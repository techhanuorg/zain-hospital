import { 
  hospitalRepo, 
  departmentRepo, 
  doctorRepo, 
  patientRepo, 
  appointmentRepo, 
  followupRepo, 
  auditRepo,
  conversationRepo
} from '../../storage/repositories';
import { SlotEngine } from '../../engine/slot-engine';
import { HospitalId, Patient, Appointment } from '../../types';

export class ControlledToolExecutor {
  public static async execute(
    toolName: string,
    args: Record<string, any>,
    hospitalId: HospitalId,
    userPhone: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      switch (toolName) {
        case 'get_hospital_info': {
          const hosp = await hospitalRepo.getById(hospitalId);
          return { success: true, data: hosp };
        }

        case 'get_departments': {
          const depts = await departmentRepo.listByHospital(hospitalId);
          return { success: true, data: depts };
        }

        case 'get_doctors': {
          if (args.department_id) {
            const docs = await doctorRepo.listByDepartment(hospitalId, args.department_id);
            return { success: true, data: docs };
          }
          if (args.query) {
            const docs = await doctorRepo.findByName(hospitalId, args.query);
            return { success: true, data: docs };
          }
          const allDocs = await doctorRepo.listByHospital(hospitalId);
          return { success: true, data: allDocs };
        }

        case 'get_available_slots': {
          const slots = await SlotEngine.getAvailableSlots(hospitalId, args.doctor_id, args.date);
          let filtered = slots.filter(s => s.available);
          if (args.period_preference) {
            filtered = filtered.filter(s => s.period === args.period_preference);
          }
          return { 
            success: true, 
            data: { 
              total_available: filtered.length, 
              slots: filtered.slice(0, 8) 
            } 
          };
        }

        case 'create_appointment': {
          // Double-booking protection: Lock slot
          const locked = await SlotEngine.lockSlot(hospitalId, args.doctor_id, args.appointment_date, args.appointment_time);
          if (!locked) {
            return {
              success: false,
              error: 'Slot is already booked or being held by another patient. Please choose another time.'
            };
          }

          // Ensure patient exists or create
          let patient = await patientRepo.getByPhone(hospitalId, args.patient_phone || userPhone);
          if (!patient) {
            patient = {
              patient_id: `pat_${Date.now().toString(36)}`,
              hospital_id: hospitalId,
              whatsapp_number: args.patient_phone || userPhone,
              name: args.patient_name,
              age: args.patient_age,
              gender: args.patient_gender,
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

          const doctor = await doctorRepo.getById(hospitalId, args.doctor_id);
          const dept = doctor ? await departmentRepo.getById(hospitalId, doctor.department_id) : null;

          const appointmentId = `APP-${Math.floor(10000 + Math.random() * 90000)}`;
          const newApp: Appointment = {
            appointment_id: appointmentId,
            hospital_id: hospitalId,
            patient_id: patient.patient_id,
            doctor_id: args.doctor_id,
            department_id: doctor?.department_id || 'dept_genmed',
            appointment_date: args.appointment_date,
            appointment_time: args.appointment_time,
            status: 'CONFIRMED',
            booking_source: 'WHATSAPP_AI',
            whatsapp_number: args.patient_phone || userPhone,
            patient_name: patient.name,
            doctor_name: doctor?.doctor_name,
            department_name: dept?.name,
            consultation_fee: doctor?.consultation_fee,
            notes: args.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          await appointmentRepo.create(newApp);

          // Release slot lock
          SlotEngine.releaseLock(args.doctor_id, args.appointment_date, args.appointment_time);

          // Audit log
          await auditRepo.log({
            log_id: `aud_${Date.now()}`,
            hospital_id: hospitalId,
            action: 'CREATE_APPOINTMENT',
            entity_type: 'APPOINTMENT',
            entity_id: appointmentId,
            details: { doctor: doctor?.doctor_name, date: args.appointment_date, time: args.appointment_time },
            timestamp: new Date().toISOString()
          });

          return { success: true, data: newApp };
        }

        case 'get_appointment': {
          if (args.appointment_id) {
            const app = await appointmentRepo.getById(hospitalId, args.appointment_id);
            return { success: true, data: app };
          }
          const patient = await patientRepo.getByPhone(hospitalId, args.patient_phone || userPhone);
          if (patient) {
            const apps = await appointmentRepo.listByPatient(hospitalId, patient.patient_id);
            return { success: true, data: apps[0] || null };
          }
          return { success: true, data: null };
        }

        case 'cancel_appointment': {
          const app = await appointmentRepo.getById(hospitalId, args.appointment_id);
          if (!app) return { success: false, error: 'Appointment not found.' };
          app.status = 'CANCELLED';
          app.cancellation_reason = args.reason || 'Patient requested via WhatsApp';
          await appointmentRepo.update(app);
          return { success: true, data: app };
        }

        case 'reschedule_appointment': {
          const app = await appointmentRepo.getById(hospitalId, args.appointment_id);
          if (!app) return { success: false, error: 'Appointment not found.' };

          const locked = await SlotEngine.lockSlot(hospitalId, app.doctor_id, args.new_date, args.new_time);
          if (!locked) {
            return { success: false, error: 'The requested new slot is not available.' };
          }

          app.appointment_date = args.new_date;
          app.appointment_time = args.new_time;
          app.status = 'RESCHEDULED';
          await appointmentRepo.update(app);
          SlotEngine.releaseLock(app.doctor_id, args.new_date, args.new_time);
          return { success: true, data: app };
        }

        case 'get_patient': {
          const patient = await patientRepo.getByPhone(hospitalId, args.phone || userPhone);
          if (!patient) return { success: true, data: null };
          const apps = await appointmentRepo.listByPatient(hospitalId, patient.patient_id);
          return { success: true, data: { patient, appointments: apps } };
        }

        case 'handoff_to_human': {
          return {
            success: true,
            data: {
              status: 'HUMAN_ASSIGNED',
              message: 'Staff notified. Human agent will assist shortly.'
            }
          };
        }

        case 'get_admin_summary': {
          const date = args.date || new Date().toISOString().split('T')[0];
          const appointments = await appointmentRepo.listByHospital(hospitalId, { date });
          const followups = await followupRepo.getDueFollowups(hospitalId, date);
          const doctors = await doctorRepo.listByHospital(hospitalId);

          return {
            success: true,
            data: {
              date,
              total_appointments: appointments.length,
              confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
              completed: appointments.filter(a => a.status === 'COMPLETED').length,
              cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
              no_shows: appointments.filter(a => a.status === 'NO_SHOW').length,
              due_followups: followups.length,
              active_doctors: doctors.length
            }
          };
        }

        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Tool execution failure.' };
    }
  }
}
