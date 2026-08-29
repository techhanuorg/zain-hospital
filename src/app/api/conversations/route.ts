import { NextRequest, NextResponse } from 'next/server';
import { conversationRepo } from '@/lib/storage/repositories';
import { AIOrchestrator } from '@/lib/ai/orchestrator';
import { ModularWhatsAppClient } from '@/lib/whatsapp/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get('hospitalId') || process.env.DEFAULT_HOSPITAL_ID || 'hosp_zain_01';
    const status = searchParams.get('status') || undefined;

    const list = await conversationRepo.listByHospital(hospitalId, status);

    // Fetch messages for each conversation to return populated timeline
    const populated = await Promise.all(
      list.map(async (c) => {
        const messages = await conversationRepo.getMessages(hospitalId, c.conversation_id);
        return {
          ...c,
          messages: messages.map((m) => ({
            id: m.message_id,
            sender: m.sender_type,
            text: m.content,
            time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rawTimestamp: m.timestamp,
            agent: m.agent_invoked,
            intent: m.intent,
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      hospital_id: hospitalId,
      total: populated.length,
      conversations: populated
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      conversationId,
      phone,
      message,
      senderType = 'STAFF',
      hospitalId = process.env.DEFAULT_HOSPITAL_ID || 'hosp_zain_01'
    } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: 'Phone and message are required' }, { status: 400 });
    }

    if (senderType === 'STAFF') {
      const sendRes = await ModularWhatsAppClient.sendMessage({ phone, text: message });

      const conv = conversationId ? await conversationRepo.getById(hospitalId, conversationId) : await conversationRepo.getByPhone(hospitalId, phone);
      const convId = conv?.conversation_id || conversationId || `conv_mtdalwzo`;

      await conversationRepo.addMessage({
        message_id: sendRes.messageId || `msg_staff_1787942176845`,
        conversation_id: convId,
        hospital_id: hospitalId,
        sender_type: 'HUMAN_STAFF',
        sender_name: 'Reception Staff',
        message_type: 'TEXT',
        content: message,
        delivery_status: 'SENT',
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        type: 'STAFF_REPLY',
        messageId: sendRes.messageId
      });
    } else {
      const aiResult = await AIOrchestrator.processMessage(message, phone, hospitalId);

      await ModularWhatsAppClient.sendMessage({
        phone,
        text: aiResult.replyText
      });

      return NextResponse.json({
        success: true,
        type: 'AI_REPLY',
        reply: aiResult.replyText,
        intent: aiResult.intent,
        agent: aiResult.agent,
        toolCalls: aiResult.toolCallsExecuted
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error processing conversation message' }, { status: 500 });
  }
}
