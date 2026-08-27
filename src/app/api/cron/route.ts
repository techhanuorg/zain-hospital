import { NextRequest, NextResponse } from 'next/server';
import { ReminderEngine } from '@/lib/engine/reminder-engine';
import { NoShowEngine } from '@/lib/engine/no-show-engine';
import { ModularWhatsAppClient } from '@/lib/whatsapp/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hospitalId = searchParams.get('hospitalId') || 'hosp_jain_01';

  // 1. Process 24h and 2h reminders
  const reminders = await ReminderEngine.processAppointmentReminders(hospitalId);
  for (const r of reminders) {
    await ModularWhatsAppClient.sendMessage({ phone: r.phone, text: r.message });
  }

  // 2. Detect and process no-shows
  const noShows = await NoShowEngine.detectNoShows(hospitalId);
  for (const ns of noShows) {
    await ModularWhatsAppClient.sendMessage({
      phone: ns.whatsapp_number,
      text: `Namaste ${ns.patient_name || 'Patient'} ji.\n\nAapki appointment miss ho gayi. Kya aap dobara appointment book karna chahenge?\n\n1️⃣ Haan\n2️⃣ Baad me`
    });
  }

  return NextResponse.json({
    status: 'cron_executed',
    remindersSent: reminders.length,
    noShowsDetected: noShows.length
  });
}
