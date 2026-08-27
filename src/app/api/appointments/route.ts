import { NextRequest, NextResponse } from 'next/server';
import { appointmentRepo, doctorRepo, patientRepo } from '@/lib/storage/repositories';
import { SlotEngine } from '@/lib/engine/slot-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hospitalId = searchParams.get('hospitalId') || 'hosp_jain_01';
  const doctorId = searchParams.get('doctorId') || undefined;
  const date = searchParams.get('date') || undefined;
  const status = searchParams.get('status') || undefined;
  const getSlots = searchParams.get('getSlots');

  if (getSlots === 'true' && doctorId && date) {
    const slots = await SlotEngine.getAvailableSlots(hospitalId, doctorId, date);
    return NextResponse.json({ slots });
  }

  const appointments = await appointmentRepo.listByHospital(hospitalId, { doctorId, date, status });
  return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hospitalId = body.hospitalId || 'hosp_jain_01';

    const locked = await SlotEngine.lockSlot(hospitalId, body.doctorId, body.appointmentDate, body.appointmentTime);
    if (!locked) {
      return NextResponse.json({ error: 'Slot is already booked or unavailable' }, { status: 409 });
    }

    let patient = await patientRepo.getByPhone(hospitalId, body.phone);
    if (!patient) {
      patient = {
        patient_id: `pat_${Date.now().toString(36)}`,
        hospital_id: hospitalId,
        whatsapp_number: body.phone,
        name: body.patientName,
        age: body.age,
        gender: body.gender || 'Male',
        preferred_language: 'hinglish',
        consent_status: true,
        marketing_opt_in: true,
        communication_opt_in: true,
        registration_date: new Date().toISOString(),
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await patientRepo.create(patient);
    }

    const doctor = await doctorRepo.getById(hospitalId, body.doctorId);
    const appointmentId = `APP-${Math.floor(10000 + Math.random() * 90000)}`;

    const app = await appointmentRepo.create({
      appointment_id: appointmentId,
      hospital_id: hospitalId,
      patient_id: patient.patient_id,
      doctor_id: body.doctorId,
      department_id: doctor?.department_id || 'dept_genmed',
      appointment_date: body.appointmentDate,
      appointment_time: body.appointmentTime,
      status: 'CONFIRMED',
      booking_source: 'ADMIN_PORTAL',
      whatsapp_number: body.phone,
      patient_name: patient.name,
      doctor_name: doctor?.doctor_name,
      consultation_fee: doctor?.consultation_fee,
      notes: body.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    SlotEngine.releaseLock(body.doctorId, body.appointmentDate, body.appointmentTime);
    return NextResponse.json({ success: true, appointment: app });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
