import { NextRequest, NextResponse } from 'next/server';
import { conversationRepo } from '@/lib/storage/repositories';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get('hospitalId') || process.env.DEFAULT_HOSPITAL_ID || 'hosp_zain_01';
    const conversationId = params.id;

    const conv = await conversationRepo.getById(hospitalId, conversationId);
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await conversationRepo.getMessages(hospitalId, conversationId);

    return NextResponse.json({
      success: true,
      conversation: {
        ...conv,
        messages: messages.map((m) => ({
          id: m.message_id,
          sender: m.sender_type,
          text: m.content,
          time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawTimestamp: m.timestamp,
          agent: m.agent_invoked,
          intent: m.intent,
        }))
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching conversation' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, hospitalId = process.env.DEFAULT_HOSPITAL_ID || 'hosp_zain_01' } = body;
    const conversationId = params.id;

    const conv = await conversationRepo.getById(hospitalId, conversationId);
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (status) {
      conv.status = status;
      await conversationRepo.update(conv);
    }

    return NextResponse.json({ success: true, conversation: conv });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error updating conversation' }, { status: 500 });
  }
}
