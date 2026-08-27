export class WhatsAppTemplateFormatter {
  public static formatAppointmentConfirmation(details: {
    patientName: string;
    doctorName: string;
    departmentName: string;
    date: string;
    time: string;
    appointmentId: string;
  }): string {
    return `Appointment Confirmed ✅\n\n` +
      `👤 *Patient:* ${details.patientName}\n` +
      `👨‍⚕️ *Doctor:* ${details.doctorName}\n` +
      `🏥 *Department:* ${details.departmentName}\n` +
      `📅 *Date:* ${details.date}\n` +
      `⏰ *Time:* ${details.time}\n` +
      `🔖 *Appointment ID:* ${details.appointmentId}\n\n` +
      `Kripya 10–15 minutes pehle OPD reception par report karein.\n` +
      `📍 Jain Hospital, Jain Mandir Road, Basheerganj, Bahraich (U.P.)`;
  }
}
