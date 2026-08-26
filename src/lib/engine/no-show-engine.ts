import { appointmentRepo } from '../storage/repositories';
import { HospitalId, Appointment } from '../types';

export class NoShowEngine {
  /**
   * Detects passed appointments that were never marked completed and marks them NO_SHOW
   */
  public static async detectNoShows(hospitalId: HospitalId): Promise<Appointment[]> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const appointments = await appointmentRepo.listByHospital(hospitalId, { status: 'CONFIRMED' });
    const noShows: Appointment[] = [];

    for (const app of appointments) {
      if (app.appointment_date < todayStr) {
        app.status = 'NO_SHOW';
        await appointmentRepo.update(app);
        noShows.push(app);
      }
    }

    return noShows;
  }
}
