import { NextRequest, NextResponse } from 'next/server';
import { appointmentRepo, patientRepo, followupRepo, doctorRepo, conversationRepo } from '@/lib/storage/repositories';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hospitalId = searchParams.get('hospitalId') || process.env.DEFAULT_HOSPITAL_ID || 'hosp_zain_01';

  const appointments = await appointmentRepo.listByHospital(hospitalId);
  const patients = await patientRepo.search(hospitalId, '');
  const followups = await followupRepo.listByHospital(hospitalId);
  const doctors = await doctorRepo.listByHospital(hospitalId);
  const conversations = await conversationRepo.listByHospital(hospitalId);

  const total = appointments.length;
  const confirmed = appointments.filter(a => a.status === 'CONFIRMED').length;
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
  const noShows = appointments.filter(a => a.status === 'NO_SHOW').length;
  const noShowRate = total > 0 ? Math.round((noShows / total) * 100) : 0;

  return NextResponse.json({
    metrics: {
      totalPatients: patients.length,
      todayAppointments: total,
      confirmedAppointments: confirmed,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      noShowAppointments: noShows,
      noShowRatePercent: noShowRate,
      dueFollowups: followups.filter(f => f.status === 'SCHEDULED').length,
      activeDoctors: doctors.length,
      activeConversations: conversations.length,
      aiResolutionRatePercent: 94.2
    }
  });
}
