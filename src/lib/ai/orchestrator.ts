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
    hospitalIdInput: HospitalId = 'hosp_zain_01'
  ): Promise<AIResponseOutput> {
    const hospitalId = hospitalIdInput === 'hosp_jain_01' ? 'hosp_zain_01' : hospitalIdInput;
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

    // If conversation was assigned to Human Staff and patient asks for human again, remind them
    const isExplicitHumanRequest = normalizedText.toLowerCase().includes('reception') || 
      normalizedText.toLowerCase().includes('human') || 
      normalizedText.toLowerCase().includes('staff') || 
      normalizedText.toLowerCase().includes('insan');

    if (conversation.status === 'HUMAN_ASSIGNED' && isExplicitHumanRequest) {
      return {
        replyText: 'Aapki chat hamare reception staff ko assign ki gayi hai. Hamari team turant aapse sampark karegi 🙏',
        detectedLanguage,
        intent: 'HUMAN_HANDOFF',
        agent: 'FRONT_DESK',
        confidence: 1.0,
        entities: extractedEntities,
        toolCallsExecuted: [],
        shouldHandoffToHuman: true,
        handoffReason: 'Patient requested human staff'
      };
    }

    // 5. Update Conversation Context with Extracted Entities
    if (!conversation.context_data) conversation.context_data = {};
    if (extractedEntities.name?.value) {
      conversation.context_data.patientName = extractedEntities.name.value;
      conversation.patient_name = extractedEntities.name.value;
    }
    if (extractedEntities.age?.value) conversation.context_data.patientAge = extractedEntities.age.value;
    if (extractedEntities.gender?.value) conversation.context_data.patientGender = extractedEntities.gender.value;
    if (extractedEntities.doctorName?.value) conversation.context_data.doctorQuery = extractedEntities.doctorName.value;
    if (extractedEntities.department?.value) conversation.context_data.department = extractedEntities.department.value;
    if (extractedEntities.targetDate?.value) conversation.context_data.selectedDate = extractedEntities.targetDate.value;
    if (extractedEntities.slotTime?.value) conversation.context_data.selectedTime = extractedEntities.slotTime.value;

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
    const systemContext = `${systemPrompt}\n\nCURRENT CONTEXT:\n- Patient Phone: ${userPhone}\n- Detected Language: ${detectedLanguage}\n- Known Patient Name: ${conversation.context_data.patientName || patient?.name || 'Unknown'}\n- Known Patient Age: ${conversation.context_data.patientAge || patient?.age || 'Unknown'}\n- Known Patient Gender: ${conversation.context_data.patientGender || patient?.gender || 'Unknown'}\n- Doctor Selected: ${conversation.context_data.selectedDoctorName || conversation.context_data.doctorQuery || 'None'}\n- Target Date: ${conversation.context_data.selectedDate || 'None'}\n- Preferred Time Slot: ${conversation.context_data.selectedTime || 'None'}\n- Context Step: ${conversation.context_data.step || 'START'}\n- Current Time (IST): ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

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
      let turn = 0;
      const MAX_TURNS = 4;

      while (turn < MAX_TURNS) {
        turn++;
        const completionResult = await groqPool.chatCompletion(groqMessages, {
          tools: CONTROLLED_TOOLS_SCHEMA,
          temperature: 0.2,
          max_tokens: 600
        });

        const choice = completionResult.response?.choices?.[0];
        const messageObj = choice?.message;

        // Handle Tool Calls if generated by LLM
        if (messageObj?.tool_calls && messageObj.tool_calls.length > 0) {
          groqMessages.push({
            role: 'assistant',
            content: messageObj.content || '',
            tool_calls: messageObj.tool_calls
          });

          for (const tc of messageObj.tool_calls) {
            const fnName = tc.function?.name;
            let fnArgs: any = {};
            try {
              fnArgs = JSON.parse(tc.function?.arguments || '{}');
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

            if (fnName === 'get_doctors' && execRes.data && execRes.data.length > 0) {
              conversation.context_data.selectedDoctorId = execRes.data[0].doctor_id;
              conversation.context_data.selectedDoctorName = execRes.data[0].doctor_name;
              conversation.context_data.selectedDepartmentId = execRes.data[0].department_id;
            }
            if (fnName === 'create_appointment' && execRes.data) {
              conversation.context_data.confirmedAppointmentId = execRes.data.appointment_id;
              conversation.context_data.step = 'CONFIRMED';
            }

            // Feed tool execution result back to Groq for natural response synthesis
            groqMessages.push({
              role: 'tool',
              name: fnName,
              tool_call_id: tc.id,
              content: JSON.stringify(execRes)
            });
          }
        } else {
          finalReply = messageObj?.content || '';
          // Strip any residual XML tags or think tokens if present
          if (finalReply.includes('<tool_call>') || finalReply.includes('<function=')) {
            finalReply = finalReply.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '').trim();
          }
          break;
        }
      }

      if (!finalReply && toolCallsExecuted.length > 0) {
        // If the model produced empty text after tools, synthesize fallback from tool result
        const lastResult = toolCallsExecuted[toolCallsExecuted.length - 1];
        if (lastResult.toolName === 'get_doctors') {
          const docs = lastResult.result?.data || [];
          finalReply = `Zain Hospital Bahraich me uplabdh doctors:\n${docs.slice(0, 3).map((d: any, i: number) => `${i + 1}️⃣ ${d.doctor_name} (${d.specialization}) - Fees: ₹${d.consultation_fee}`).join('\n')}\n\nAap kis samay appointment book karna chahenge?`;
        } else if (lastResult.toolName === 'get_hospital_info') {
          const h = lastResult.result?.data || {};
          finalReply = `Namaste! 🙏 *${h.name || 'Zain Hospital & Research Centre'}*\n\n📍 **Address:** ${h.address || 'Hospital Road, Basheerganj, Bahraich'}\n🕒 **OPD Timings:** ${h.opd_timings || '8:30 AM – 7:30 PM'}\n🚨 **24x7 Emergency:** ${h.emergency_phone || '+91 5252 232911'}\n\nKya aapko koi appointment book karni hai ya doctor ki details chahiye?`;
        } else if (lastResult.toolName === 'get_available_slots') {
          const slots = lastResult.result?.data?.slots || [];
          const docName = lastResult.result?.data?.doctor_name || 'Doctor';
          finalReply = `Dr. ${docName} ke uplabdh time slots:\n${slots.slice(0, 5).map((s: string) => `⏰ ${s}`).join('\n')}\n\nAap kaunsa time slot book karna chahenge?`;
        } else if (lastResult.toolName === 'create_appointment') {
          const appt = lastResult.result?.data || {};
          finalReply = `Appointment Confirmed ✅\n\n🆔 **ID:** ${appt.appointment_id || 'APP-NEW'}\n👨‍⚕️ **Doctor:** ${appt.doctor_name || 'Doctor'}\n📅 **Date:** ${appt.appointment_date}\n⏰ **Time:** ${appt.appointment_time}\n\nZain Hospital me aane ke liye dhanyawad! 🙏`;
        }
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
      finalReply = 'Namaste! Main Zain Hospital Bahraich ka AI digital assistant hoon. Main aapki kya sahayata kar sakta hoon?';
    }

    // Update and persist conversation metadata
    conversation.last_message_text = rawMessage;
    conversation.last_message_time = new Date().toISOString();
    conversation.active_agent = agent;
    conversation.last_intent = intent;
    await conversationRepo.update(conversation);

    // Save message history
    await conversationRepo.addMessage({
      message_id: `msg_u_${Date.now()}`,
      conversation_id: conversation.conversation_id,
      hospital_id: hospitalId,
      sender_type: 'PATIENT',
      sender_name: extractedEntities.name?.value || conversation.context_data.patientName || patient?.name || userPhone,
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
      sender_name: 'Zain Care AI',
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
      return `Bilkul 😊 Zain Hospital Bahraich me appointment ke liye hamare visheshagya doctors:\n\n${docList}\n\nAap kis doctor ya department me dikhana chahte hain?`;
    }
    if (intent === 'EMERGENCY') {
      return `🚨 *24x7 Emergency Helpline:* +91 5252 232911\n\nZain Hospital, Hospital Road, Basheerganj, Bahraich. Emergency ward 24 ghante khula hai.`;
    }
    return `Namaste! Zain Hospital Bahraich me aapka swagat hai. OPD subah 8:30 AM se shaam 7:30 PM tak khula hai. Doctor appointment, timings ya emergency helpline ke liye batayein.`;
  }
}
