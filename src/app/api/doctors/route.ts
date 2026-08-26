import { NextRequest, NextResponse } from 'next/server';
import { doctorRepo } from '@/lib/storage/repositories';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hospitalId = searchParams.get('hospitalId') || 'hosp_apex_01';
  const doctors = await doctorRepo.listByHospital(hospitalId);
  return NextResponse.json({ doctors });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const doc = await doctorRepo.create(body);
    return NextResponse.json({ success: true, doctor: doc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
