import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/whatsapp/session-manager';

export async function GET() {
  const session = sessionManager.getSessionInfo();
  return NextResponse.json(session);
}

export async function POST(req: NextRequest) {
  const { action } = await req.json();
  if (action === 'refresh_qr') {
    const qr = sessionManager.refreshQR();
    return NextResponse.json({ status: 'QR_REQUIRED', qrCode: qr });
  }
  if (action === 'reconnect') {
    sessionManager.reconnect();
    return NextResponse.json({ status: 'CONNECTING' });
  }
  if (action === 'disconnect') {
    sessionManager.disconnect();
    return NextResponse.json({ status: 'DISCONNECTED' });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
