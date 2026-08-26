import { appointmentRepo, followupRepo, patientRepo } from '../storage/repositories';
import { HospitalId, Followup } from '../types';

export class ReminderEngine {
  /**
   * Evaluates appointments needing 24h or 2h reminders
   */
  public static async processAppointmentReminders(hospitalId: HospitalId): Promise<Array<{ appointmentId: string; type: string; phone: string; message: string }>> {
    const appointments = await appointmentRepo.listByHospital(hospitalId, { status: 'CONFIRMED' });
    const now = new Date();
    const remindersToSend: Array<{ appointmentId: string; type: string; phone: string; message: string }> = [];

    for (const app of appointments) {
      const appDateTime = new Date(`${app.appointment_date}T${app.appointment_time}:00`);
      const diffMs = appDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // 24h reminder (between 20h and 26h before)
      if (diffHours > 20 && diffHours <= 26 && !app.reminder_24h_sent) {
        remindersToSend.push({
          appointmentId: app.appointment_id,
          type: '24H_REMINDER',
          phone: app.whatsapp_number,
          message: `Reminder 🔔\n\nNamaste ${app.patient_name || 'Patient'} ji!\n\nAapki kal ${app.appointment_time} par ${app.doctor_name} (${app.department_name}) ke saath appointment hai.\n\n1️⃣ Confirm\n2️⃣ Reschedule\n3️⃣ Cancel`
        });
        app.reminder_24h_sent = true;
        await appointmentRepo.update(app);
      }

      // 2h reminder (between 1.5h and 2.5h before)
      if (diffHours > 1.0 && diffHours <= 2.5 && !app.reminder_2h_sent) {
        remindersToSend.push({
          appointmentId: app.appointment_id,
          type: '2H_REMINDER',
          phone: app.whatsapp_number,
          message: `Reminder 🔔\n\nNamaste ${app.patient_name || 'Patient'} ji!\n\nAapki appointment 2 ghante baad (${app.appointment_time}) ${app.doctor_name} ke saath hai. Kripya samay par hospital pahuchein.`
        });
        app.reminder_2h_sent = true;
        await appointmentRepo.update(app);
      }
    }

    return remindersToSend;
  }

  /**
   * Schedules a medicine course completion follow-up on Day N-1
   */
  public static async scheduleMedicineFollowup(
    hospitalId: HospitalId,
    patientId: string,
    medicineName: string,
    durationDays: number,
    startDateStr: string
  ): Promise<Followup> {
    const start = new Date(startDateStr);
    const reminderDate = new Date(start);
    reminderDate.setDate(start.getDate() + Math.max(1, durationDays - 1));

    const yyyy = reminderDate.getFullYear();
    const mm = String(reminderDate.getMonth() + 1).padStart(2, '0');
    const dd = String(reminderDate.getDate()).padStart(2, '0');
    const scheduledDate = `${yyyy}-${mm}-${dd}`;

    const followup: Followup = {
      followup_id: `fol_med_${Date.now()}`,
      hospital_id: hospitalId,
      patient_id: patientId,
      type: 'MEDICINE_REMINDER',
      title: `${medicineName} Course Completion Reminder`,
      message_template: `Namaste 👋\n\nAapki dawai (${medicineName}) kal complete hone wali hai.\n\nKya aap follow-up appointment book karna chahenge?\n\n1️⃣ Haan\n2️⃣ Baad me\n3️⃣ Zarurat nahi`,
      scheduled_date: scheduledDate,
      scheduled_time: '10:00',
      status: 'SCHEDULED',
      metadata: {
        medicine_name: medicineName,
        duration_days: durationDays,
        start_date: startDateStr
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await followupRepo.create(followup);
  }
}
