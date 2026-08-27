import { NextRequest, NextResponse } from 'next/server';
import { AIOrchestrator } from '@/lib/ai/orchestrator';

export async function POST(req: NextRequest) {
  try {
    const { message, phone = '+919876543210', hospitalId = 'hosp_jain_01' } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const output = await AIOrchestrator.processMessage(message, phone, hospitalId);

    return NextResponse.json(output);
  } catch (err: any) {
    console.error('Simulation error:', err);
    return NextResponse.json({ error: err.message || 'Simulation error' }, { status: 500 });
  }
}
