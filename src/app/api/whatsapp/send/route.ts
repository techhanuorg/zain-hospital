import { NextRequest, NextResponse } from 'next/server';
import { ModularWhatsAppClient } from '@/lib/whatsapp/client';
import { conversationRepo } from '@/lib/storage/repositories';

export async function POST(req: NextRequest) {
  try {
    const { phone, text, conversationId, hospitalId = process.env.DEFAULT_HOSPITAL_ID || 'hosp_zain_01' } = await req.json();
    if (!phone || !text) {
      return NextResponse.json({ error: 'Phone and text are required' }, { status: 400 });
    }

    const sendRes = await ModularWhatsAppClient.sendMessage({ phone, text });

    if (conversationId) {
      await conversationRepo.addMessage({
        message_id: sendRes.messageId,
        conversation_id: conversationId,
        hospital_id: hospitalId,
        sender_type: 'HUMAN_STAFF',
        sender_name: 'Reception Staff',
        message_type: 'TEXT',
        content: text,
        delivery_status: 'SENT',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, messageId: sendRes.messageId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
