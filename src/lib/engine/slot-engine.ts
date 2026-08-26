import { Doctor, TimeSlot, HospitalId, DoctorId } from '../types';
import { appointmentRepo, doctorRepo } from '../storage/repositories';
import { localDB } from '../storage/local-db';

export class SlotEngine {
  private static LOCK_TTL_MS = 120000; // 2 minutes lock during booking flow

  /**
   * Generates valid time slots for a doctor on a specific date (YYYY-MM-DD)
   */
  public static async getAvailableSlots(
    hospitalId: HospitalId,
    doctorId: DoctorId,
    dateStr: string
  ): Promise<TimeSlot[]> {
    const doctor = await doctorRepo.getById(hospitalId, doctorId);
    if (!doctor || !doctor.active_status) {
      return [];
    }

    // Check doctor working day
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()];

    if (!doctor.working_days.includes(dayOfWeek)) {
      return [];
    }

    // Fetch existing confirmed/pending appointments
    const existingAppointments = await appointmentRepo.listByDoctorAndDate(hospitalId, doctorId, dateStr);

    const slots: TimeSlot[] = [];
    const duration = doctor.slot_duration_minutes || 30;

    const startMinutes = this.timeToMinutes(doctor.start_time);
    const endMinutes = this.timeToMinutes(doctor.end_time);
    const breakStart = this.timeToMinutes(doctor.break_start);
    const breakEnd = this.timeToMinutes(doctor.break_end);

    const db = localDB.getDatabase();
    const now = Date.now();

    for (let current = startMinutes; current + duration <= endMinutes; current += duration) {
      // Skip if during break
      if (current >= breakStart && current < breakEnd) {
        continue;
      }

      const timeStr = this.minutesToTime(current);
      const formatted = this.format12Hour(timeStr);
      const period = current < 720 ? 'morning' : current < 960 ? 'afternoon' : 'evening';

      // Check if slot is already booked
      const isBooked = existingAppointments.some(a => a.appointment_time === timeStr);

      // Check slot lock
      const lockKey = `${doctorId}_${dateStr}_${timeStr}`;
      const lockExpiry = db.slotLocks[lockKey] || 0;
      const isLocked = lockExpiry > now;

      slots.push({
        time: timeStr,
        formattedTime: formatted,
        period,
        available: !isBooked && !isLocked,
        reason: isBooked ? 'Booked' : isLocked ? 'Temporarily Held' : undefined
      });
    }

    return slots;
  }

  /**
   * Double-booking protection: Mutex lock on slot
   */
  public static async lockSlot(
    hospitalId: HospitalId,
    doctorId: DoctorId,
    dateStr: string,
    timeStr: string
  ): Promise<boolean> {
    const slots = await this.getAvailableSlots(hospitalId, doctorId, dateStr);
    const slot = slots.find(s => s.time === timeStr);

    if (!slot || !slot.available) {
      return false;
    }

    const lockKey = `${doctorId}_${dateStr}_${timeStr}`;
    const expiresAt = Date.now() + this.LOCK_TTL_MS;

    localDB.mutate(db => {
      db.slotLocks[lockKey] = expiresAt;
    });

    return true;
  }

  public static releaseLock(doctorId: DoctorId, dateStr: string, timeStr: string): void {
    const lockKey = `${doctorId}_${dateStr}_${timeStr}`;
    localDB.mutate(db => {
      delete db.slotLocks[lockKey];
    });
  }

  private static timeToMinutes(t: string): number {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  private static minutesToTime(m: number): string {
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  private static format12Hour(t: string): string {
    const [h, m] = t.split(':').map(Number);
    const meridiem = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${meridiem}`;
  }
}
