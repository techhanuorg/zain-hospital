import { NextRequest, NextResponse } from 'next/server';
import { messageDeduplicator } from '@/lib/whatsapp/deduplicator';
import { AIOrchestrator } from '@/lib/ai/orchestrator';
import { ModularWhatsAppClient } from '@/lib/whatsapp/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hospitalId = req.headers.get('x-hospital-id') || process.env.DEFAULT_HOSPITAL_ID || 'hosp_zain_01';

    // 1. Extract message details from all standard formats (Evolution API v1/v2, Baileys, Meta Cloud API, or Direct payload)
    // Ignore messages sent by bot itself
    if (body.data?.key?.fromMe || body.fromMe) {
      return NextResponse.json({ status: 'ignored_own_message' });
    }

    let messageId = body.data?.key?.id || body.messageId || body.id || `msg_${Date.now()}`;
    let userPhone = '';
    let messageText = '';

    // Meta Cloud API format
    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const metaMsg = body.entry[0].changes[0].value.messages[0];
      messageId = metaMsg.id || messageId;
      userPhone = metaMsg.from ? (metaMsg.from.startsWith('+') ? metaMsg.from : `+${metaMsg.from}`) : '';
      messageText = metaMsg.text?.body || metaMsg.button?.text || '';
    } else {
      // Evolution API / Baileys format
      const rawJid = body.data?.key?.remoteJid || body.remoteJid || body.sender || body.phone || body.from || '';
      const rawClean = rawJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
      userPhone = rawClean ? (rawClean.startsWith('+') ? rawClean : `+${rawClean}`) : '+919876543210';

      const m = body.data?.message || body.message;
      if (typeof m === 'string') {
        messageText = m;
      } else if (m) {
        messageText = m.conversation || 
          m.extendedTextMessage?.text || 
          m.imageMessage?.caption || 
          m.buttonsResponseMessage?.selectedDisplayText || 
          m.templateButtonReplyMessage?.selectedDisplayText || 
          m.listResponseMessage?.title || 
          m.interactiveResponseMessage?.body?.text || '';
      } else {
        messageText = body.text || body.content || body.body || '';
      }
    }

    messageText = (messageText || '').trim();

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
