import { NextRequest, NextResponse } from 'next/server';
import { baileysManager } from '@/lib/whatsapp/baileys-manager';

export async function GET() {
  try {
    const session = baileysManager.getSessionInfo();
    return NextResponse.json(session);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, message } = body;

    if (action === 'refresh_qr' || action === 'start' || action === 'init') {
      const res = await baileysManager.refreshQR();
      return NextResponse.json(res);
    }

    if (action === 'reconnect') {
      await baileysManager.reconnect();
      return NextResponse.json({ status: 'CONNECTING' });
    }

    if (action === 'disconnect') {
      await baileysManager.disconnect();
      return NextResponse.json({ status: 'DISCONNECTED' });
    }

    if (action === 'logout') {
      await baileysManager.logout();
      return NextResponse.json({ status: 'DISCONNECTED' });
    }

    if (action === 'send_test') {
      if (!phone || !message) {
        return NextResponse.json({ error: 'Phone number and test message are required' }, { status: 400 });
      }
      const result = await baileysManager.sendMessage(phone, message);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API /whatsapp/session] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
