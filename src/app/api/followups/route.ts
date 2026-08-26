import { NextRequest, NextResponse } from 'next/server';
import { followupRepo } from '@/lib/storage/repositories';
import { ReminderEngine } from '@/lib/engine/reminder-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hospitalId = searchParams.get('hospitalId') || 'hosp_apex_01';
  const followups = await followupRepo.listByHospital(hospitalId);
  return NextResponse.json({ followups });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hospitalId = body.hospitalId || 'hosp_apex_01';
    const fol = await ReminderEngine.scheduleMedicineFollowup(
      hospitalId,
      body.patientId,
      body.medicineName,
      body.durationDays,
      body.startDate
    );
    return NextResponse.json({ success: true, followup: fol });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
