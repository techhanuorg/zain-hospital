import { NextRequest, NextResponse } from 'next/server';
import { hospitalRepo } from '@/lib/storage/repositories';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hospitalId = searchParams.get('hospitalId') || 'hosp_jain_01';
  const hospital = await hospitalRepo.getById(hospitalId);
  return NextResponse.json({ hospital });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await hospitalRepo.update(body);
    return NextResponse.json({ success: true, hospital: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
