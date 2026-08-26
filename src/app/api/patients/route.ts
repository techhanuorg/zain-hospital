import { NextRequest, NextResponse } from 'next/server';
import { patientRepo, appointmentRepo } from '@/lib/storage/repositories';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hospitalId = searchParams.get('hospitalId') || 'hosp_apex_01';
  const q = searchParams.get('query');
  const patientId = searchParams.get('patientId');

  if (patientId) {
    const patient = await patientRepo.getById(hospitalId, patientId);
    const appointments = patient ? await appointmentRepo.listByPatient(hospitalId, patient.patient_id) : [];
    return NextResponse.json({ patient, appointments });
  }

  const patients = q ? await patientRepo.search(hospitalId, q) : await patientRepo.search(hospitalId, '');
  return NextResponse.json({ patients });
}
