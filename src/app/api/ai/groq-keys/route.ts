import { NextResponse } from 'next/server';
import { groqPool } from '@/lib/ai/groq-manager';

export async function GET() {
  const statuses = groqPool.getKeyStatuses();
  return NextResponse.json({
    total_keys: statuses.length,
    healthy_count: statuses.filter(s => s.status === 'HEALTHY').length,
    cooldown_count: statuses.filter(s => s.status === 'COOLDOWN').length,
    keys: statuses
  });
}
