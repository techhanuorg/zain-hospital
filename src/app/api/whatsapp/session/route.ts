import { NextRequest, NextResponse } from 'next/server';
import { baileysManager } from '@/lib/whatsapp/baileys-manager';
import { antiBanEngine } from '@/lib/whatsapp/anti-ban-engine';
import { inboundQueueEngine } from '@/lib/whatsapp/inbound-queue';

export async function GET() {
  try {
    const session = baileysManager.getSessionInfo();
    return NextResponse.json({
      ...session,
      antiBan: antiBanEngine.getTelemetry(),
      inboundQueue: inboundQueueEngine.getMetrics(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, message, config, burstCount } = body;

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

    if (action === 'update_antiban_config') {
      if (config) {
        antiBanEngine.updateConfig(config);
      }
      return NextResponse.json({
        success: true,
        antiBan: antiBanEngine.getTelemetry(),
      });
    }

    if (action === 'send_test') {
      if (!phone || !message) {
        return NextResponse.json({ error: 'Phone number and test message are required' }, { status: 400 });
      }
      // Route test message with HIGH priority
      const result = await antiBanEngine.enqueueMessage(phone, message, 'HIGH', 'TEST');
      return NextResponse.json(result);
    }

    // Stress test endpoint to simulate 1,000 to 100,000 rapid messages
    if (action === 'simulate_burst') {
      const count = Math.min(100000, Math.max(1, burstCount || 100));
      for (let i = 0; i < count; i++) {
        const dummyPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
        const dummyMsg = i % 5 === 0 
          ? 'Doctor appointment book karni hai emergency me' 
          : i % 3 === 0 
          ? 'OPD timing kya hai?' 
          : 'Mera blood test report kab milega?';
        inboundQueueEngine.enqueue(`sim_${Date.now()}_${i}`, dummyPhone, dummyMsg, 'hosp_jain_01');
      }
      return NextResponse.json({
        success: true,
        message: `Successfully enqueued burst of ${count} messages into Inbound Queue!`,
        metrics: inboundQueueEngine.getMetrics(),
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API /whatsapp/session] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
