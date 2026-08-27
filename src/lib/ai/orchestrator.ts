import { groqPool, GroqMessage } from './groq-manager';
import { MessageNormalizer } from './nlu/normalizer';
import { LanguageDetector } from './nlu/language-detector';
import { DateTimeParser } from './nlu/date-time-parser';
import { EntityExtractor } from './nlu/entity-extractor';
import { LowLiteracyHandler } from './nlu/low-literacy';
import { CONTROLLED_TOOLS_SCHEMA } from './tools/tool-definitions';
import { ControlledToolExecutor } from './tools/controlled-tools';
import { 
  patientRepo, 
  conversationRepo, 
  appointmentRepo, 
  doctorRepo 
} from '../storage/repositories';
import { FRONT_DESK_SYSTEM_PROMPT } from './agents/frontdesk-agent';
import { APPOINTMENT_SYSTEM_PROMPT } from './agents/appointment-agent';
import { PATIENT_CARE_SYSTEM_PROMPT } from './agents/patient-care-agent';
import { PATIENT_RECORD_SYSTEM_PROMPT } from './agents/patient-record-agent';
import { ADMIN_AGENT_SYSTEM_PROMPT } from './agents/admin-agent';
import { 
  HospitalId, 
  IntentType, 
  AgentType, 
  AIResponseOutput, 
  Conversation 
} from '../types';

export class AIOrchestrator {
  /**
   * Main AI Processing Pipeline
   */
  public static async processMessage(
    rawMessage: string,
    userPhone: string,
    hospitalId: HospitalId = 'hosp_jain_01'
  ): Promise<AIResponseOutput> {
    // 1. Message Normalizer (typos, Indian colloquialisms)
    const normalizedText = MessageNormalizer.normalize(rawMessage);

    // 2. Language Detection
    const detectedLanguage = LanguageDetector.detect(normalizedText);

    // 3. Fast Entity & Date/Time Extraction
    const extractedEntities = EntityExtractor.extractFast(normalizedText);
    const parsedDate = DateTimeParser.parseDate(normalizedText);
    const parsedTimeObj = DateTimeParser.parseTime(normalizedText);

    if (parsedDate) {
      extractedEntities.targetDate = { value: parsedDate, confidence: 0.95, level: 'HIGH' };
    }
    if (parsedTimeObj.time) {
      extractedEntities.slotTime = { value: parsedTimeObj.time, confidence: 0.90, level: 'HIGH' };
    }
    if (parsedTimeObj.period) {
      extractedEntities.timeOfDay = { value: parsedTimeObj.period, confidence: 0.85, level: 'HIGH' };
    }

    // 4. Retrieve or Initialize Conversation & Patient
    let conversation = await conversationRepo.getByPhone(hospitalId, userPhone);
    let patient = await patientRepo.getByPhone(hospitalId, userPhone);

    if (!conversation) {
      conversation = {
        conversation_id: `conv_${Date.now().toString(36)}`,
        hospital_id: hospitalId,
        patient_id: patient?.patient_id,
        whatsapp_number: userPhone,
        patient_name: patient?.name,
        status: 'ACTIVE',
        active_agent: 'FRONT_DESK',
        detected_language: detectedLanguage,
        context_data: {},
        unread_count: 0,
        last_message_text: rawMessage,
        last_message_time: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await conversationRepo.create(conversation);
    }

    // Check if conversation is currently assigned to Human Staff
    if (conversation.status === 'HUMAN_ASSIGNED') {
      return {
        replyText: 'Aapki chat hamare reception staff ko assign ki gayi hai. Kripya thoda intezaar karein 🙏',
        detectedLanguage,
        intent: 'HUMAN_HANDOFF',
        agent: 'FRONT_DESK',
        confidence: 1.0,
        entities: extractedEntities,
        toolCallsExecuted: [],
        shouldHandoffToHuman: true,
        handoffReason: 'Conversation already in HUMAN_ASSIGNED state'
      };
    }

    // 5. Low-Literacy Contextual Check
    const lowLiteracyResolution = LowLiteracyHandler.resolveContextualInput(
      normalizedText,
      conversation.context_data
    );

    // 6. Intent & Agent Routing
    const { intent, agent } = this.routeIntent(normalizedText, conversation, lowLiteracyResolution);

    // 7. Select System Prompt
    let systemPrompt = FRONT_DESK_SYSTEM_PROMPT;
    if (agent === 'APPOINTMENT') systemPrompt = APPOINTMENT_SYSTEM_PROMPT;
    else if (agent === 'PATIENT_CARE') systemPrompt = PATIENT_CARE_SYSTEM_PROMPT;
    else if (agent === 'PATIENT_RECORD') systemPrompt = PATIENT_RECORD_SYSTEM_PROMPT;
    else if (agent === 'ADMIN_OPS') systemPrompt = ADMIN_AGENT_SYSTEM_PROMPT;

    // Fetch conversation history
    const pastMessages = await conversationRepo.getMessages(hospitalId, conversation.conversation_id);
    const historySlice = pastMessages.slice(-6).map(m => ({
      role: m.sender_type === 'PATIENT' ? ('user' as const) : ('assistant' as const),
      content: m.content
    }));

    // Build Groq Messages payload
    const systemContext = `${systemPrompt}\n\nCURRENT CONTEXT:\n- Patient Phone: ${userPhone}\n- Detected Language: ${detectedLanguage}\n- Extracted Name: ${extractedEntities.name?.value || patient?.name || 'Unknown'}\n- Extracted Age: ${extractedEntities.age?.value || patient?.age || 'Unknown'}\n- Extracted Target Date: ${extractedEntities.targetDate?.value || 'Not specified'}\n- Context Step: ${conversation.context_data.step || 'START'}\n- Current Time (IST): ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

    const groqMessages: GroqMessage[] = [
      { role: 'system', content: systemContext },
      ...historySlice,
      { role: 'user', content: rawMessage }
    ];

    // 8. Invoke Groq with Controlled Function Calling Tools
    const toolCallsExecuted: Array<{ toolName: string; args: any; result: any }> = [];
    let finalReply = '';
    let shouldHandoff = false;
    let handoffReason: string | undefined;

    try {
      const completionResult = await groqPool.chatCompletion(groqMessages, {
        tools: CONTROLLED_TOOLS_SCHEMA,
        temperature: 0.2,
        max_tokens: 600
      });

      const choice = completionResult.response?.choices?.[0];
      const messageObj = choice?.message;

      // Handle Tool Calls if generated by LLM
      if (messageObj?.tool_calls && messageObj.tool_calls.length > 0) {
        for (const tc of messageObj.tool_calls) {
          const fnName = tc.function.name;
          let fnArgs: any = {};
          try {
            fnArgs = JSON.parse(tc.function.arguments || '{}');
          } catch (e) {
            fnArgs = {};
          }

          // Execute controlled backend tool
          const execRes = await ControlledToolExecutor.execute(fnName, fnArgs, hospitalId, userPhone);
          toolCallsExecuted.push({ toolName: fnName, args: fnArgs, result: execRes });

          if (fnName === 'handoff_to_human') {
            shouldHandoff = true;
            handoffReason = fnArgs.reason;
            conversation.status = 'HUMAN_ASSIGNED';
            await conversationRepo.update(conversation);
          }

          // Feed tool execution result back to Groq for natural response synthesis
          groqMessages.push({
            role: 'assistant',
            tool_calls: messageObj.tool_calls
          });
          groqMessages.push({
            role: 'tool',
            name: fnName,
            tool_call_id: tc.id,
            content: JSON.stringify(execRes)
          });
        }

        // Second turn: Generate user response with tool data
        const secondTurn = await groqPool.chatCompletion(groqMessages, {
          temperature: 0.2,
          max_tokens: 600
        });
        finalReply = secondTurn.response?.choices?.[0]?.message?.content || '';
      } else {
        finalReply = messageObj?.content || '';
      }
    } catch (err: any) {
      console.error('Groq orchestration error, executing robust fallback logic:', err);
      // Deterministic fallback response
      finalReply = await this.generateDeterministicFallback(
        normalizedText,
        intent,
        extractedEntities,
        userPhone,
        hospitalId
      );
    }

    if (!finalReply) {
      finalReply = 'Namaste! Main Jain Hospital Bahraich ka AI digital assistant hoon. Main aapki kya sahayata kar sakta hoon?';
    }

    // Save message history
    await conversationRepo.addMessage({
      message_id: `msg_u_${Date.now()}`,
      conversation_id: conversation.conversation_id,
      hospital_id: hospitalId,
      sender_type: 'PATIENT',
      sender_name: extractedEntities.name?.value || patient?.name || userPhone,
      message_type: 'TEXT',
      content: rawMessage,
      intent,
      delivery_status: 'READ',
      timestamp: new Date().toISOString()
    });

    await conversationRepo.addMessage({
      message_id: `msg_a_${Date.now() + 1}`,
      conversation_id: conversation.conversation_id,
      hospital_id: hospitalId,
      sender_type: 'AI_AGENT',
      sender_name: 'Jain Care AI',
      message_type: 'TEXT',
      content: finalReply,
      agent_invoked: agent,
      delivery_status: 'SENT',
      timestamp: new Date().toISOString()
    });

    return {
      replyText: finalReply,
      detectedLanguage,
      intent,
      agent,
      confidence: 0.95,
      entities: extractedEntities,
      toolCallsExecuted,
      shouldHandoffToHuman: shouldHandoff,
      handoffReason
    };
  }

  private static routeIntent(
    text: string,
    conv: Conversation,
    lowLit: { resolvedAction?: string; selectedValue?: any; isShortReply: boolean }
  ): { intent: IntentType; agent: AgentType } {
    const lower = text.toLowerCase();

    // Human Handoff
    if (lower.includes('reception') || lower.includes('human') || lower.includes('staff se baat') || lower.includes('insan se')) {
      return { intent: 'HUMAN_HANDOFF', agent: 'FRONT_DESK' };
    }

    // Emergency
    if (lower.includes('emergency') || lower.includes('ambulance') || lower.includes('serious') || lower.includes('heart attack')) {
      return { intent: 'EMERGENCY', agent: 'FRONT_DESK' };
    }

    // Medicine Followup
    if (lower.includes('medicine khatam') || lower.includes('dawai khatam') || lower.includes('dawai') || lower.includes('medicine')) {
      return { intent: 'MEDICINE_REMINDER', agent: 'PATIENT_CARE' };
    }

    // Cancellation
    if (lower.includes('cancel') || lower.includes('appointment cancel') || lower.includes('radd')) {
      return { intent: 'CANCEL_APPOINTMENT', agent: 'APPOINTMENT' };
    }

    // Rescheduling
    if (lower.includes('reschedule') || lower.includes('change karni hai') || lower.includes('badalna')) {
      return { intent: 'RESCHEDULE_APPOINTMENT', agent: 'APPOINTMENT' };
    }

    // Check appointment
    if (lower.includes('meri appointment') || lower.includes('kab hai') || lower.includes('check appointment')) {
      return { intent: 'CHECK_APPOINTMENT', agent: 'PATIENT_RECORD' };
    }

    // Doctor info / booking
    if (lower.includes('doctor') || lower.includes('appointment') || lower.includes('dikhana hai') || lower.includes('milna hai') || lower.includes('sharma') || lower.includes('cardio') || lower.includes('ortho')) {
      return { intent: 'BOOK_APPOINTMENT', agent: 'APPOINTMENT' };
    }

    // Timings & Hospital info
    if (lower.includes('timings') || lower.includes('kitne baje') || lower.includes('opd') || lower.includes('kaha hai') || lower.includes('address') || lower.includes('rasta')) {
      return { intent: 'HOSPITAL_INFORMATION', agent: 'FRONT_DESK' };
    }

    // Admin Query
    if (lower.includes('aaj kitne appointment') || lower.includes('admin') || lower.includes('stats')) {
      return { intent: 'ADMIN_QUERY', agent: 'ADMIN_OPS' };
    }

    return { intent: 'GENERAL_QUERY', agent: 'FRONT_DESK' };
  }

  private static async generateDeterministicFallback(
    text: string,
    intent: IntentType,
    entities: any,
    userPhone: string,
    hospitalId: HospitalId
  ): Promise<string> {
    if (intent === 'BOOK_APPOINTMENT') {
      const doctors = await doctorRepo.listByHospital(hospitalId);
      const docList = doctors.slice(0, 3).map((d, i) => `${i + 1}️⃣ ${d.doctor_name} (${d.specialization})`).join('\n');
      return `Bilkul 😊 Jain Hospital Bahraich me appointment ke liye hamare visheshagya doctors:\n\n${docList}\n\nAap kis doctor ya department me dikhana chahte hain?`;
    }
    if (intent === 'EMERGENCY') {
      return `🚨 *24x7 Emergency Helpline:* +91 5252 232911\n\nJain Hospital, Jain Mandir Road, Basheerganj, Bahraich. Emergency ward 24 ghante khula hai.`;
    }
    return `Namaste! Jain Hospital Bahraich me aapka swagat hai. OPD subah 8:30 AM se shaam 7:30 PM tak khula hai. Doctor appointment, timings ya emergency helpline ke liye batayein.`;
  }
}
