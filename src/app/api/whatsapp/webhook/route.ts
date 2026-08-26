import { NextRequest, NextResponse } from 'next/server';
import { messageDeduplicator } from '@/lib/whatsapp/deduplicator';
import { AIOrchestrator } from '@/lib/ai/orchestrator';
import { ModularWhatsAppClient } from '@/lib/whatsapp/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hospitalId = req.headers.get('x-hospital-id') || 'hosp_apex_01';

    // 1. Extract message details from Evolution API / Baileys format
    const messageId = body.data?.key?.id || body.messageId || `msg_${Date.now()}`;
    const userPhone = body.data?.key?.remoteJid?.split('@')[0] || body.sender || '+919876543210';
    const messageText = body.data?.message?.conversation || body.data?.message?.extendedTextMessage?.text || body.text || '';

    if (!messageText) {
      return NextResponse.json({ status: 'ignored_empty_or_status_message' });
    }

    // 2. Duplicate Message Protection (Idempotency)
    if (messageDeduplicator.isDuplicate(messageId)) {
      return NextResponse.json({ status: 'duplicate_ignored', messageId });
    }

    // 3. Process message through AI Orchestrator
    const result = await AIOrchestrator.processMessage(messageText, userPhone, hospitalId);

    // 4. Send outbound WhatsApp reply
    await ModularWhatsAppClient.sendMessage({
      phone: userPhone,
      text: result.replyText
    });

    return NextResponse.json({
      status: 'processed',
      intent: result.intent,
      agent: result.agent,
      reply: result.replyText,
      toolCalls: result.toolCallsExecuted
    });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
