import { localDB } from '../local-db';
import { appCache } from '../cache';
import { googleSheetsAdapter } from '../google-sheets-adapter';
import { 
  IHospitalRepository,
  IDepartmentRepository,
  IDoctorRepository,
  IPatientRepository,
  IAppointmentRepository,
  IFollowupRepository,
  IConversationRepository,
  ICampaignRepository,
  IAuditRepository
} from '../repository-interface';
import { 
  Hospital, 
  Department, 
  Doctor, 
  Patient, 
  Appointment, 
  Followup, 
  Conversation, 
  Message, 
  Campaign, 
  AuditLog,
  HospitalId,
  PatientId,
  DoctorId,
  DepartmentId,
  AppointmentId,
  ConversationId
} from '../../types';

export class HospitalRepository implements IHospitalRepository {
  async getById(hospitalId: HospitalId): Promise<Hospital | null> {
    const cacheKey = `hosp_${hospitalId}`;
    const cached = appCache.get<Hospital>(cacheKey);
    if (cached) return cached;

    const db = localDB.getDatabase();
    const hosp = db.hospitals[hospitalId] || null;
    if (hosp) appCache.set(cacheKey, hosp, 600);
    return hosp;
  }

  async update(hospital: Hospital): Promise<Hospital> {
    hospital.updated_at = new Date().toISOString();
    localDB.mutate(db => {
      db.hospitals[hospital.hospital_id] = hospital;
    });
    appCache.del(`hosp_${hospital.hospital_id}`);
    return hospital;
  }
}

export class DepartmentRepository implements IDepartmentRepository {
  async listByHospital(hospitalId: HospitalId): Promise<Department[]> {
    const cacheKey = `depts_${hospitalId}`;
    const cached = appCache.get<Department[]>(cacheKey);
    if (cached) return cached;

    const db = localDB.getDatabase();
    const list = db.departments.filter(d => d.hospital_id === hospitalId && d.active);
    appCache.set(cacheKey, list, 600);
    return list;
  }

  async getById(hospitalId: HospitalId, departmentId: DepartmentId): Promise<Department | null> {
    const list = await this.listByHospital(hospitalId);
    return list.find(d => d.department_id === departmentId) || null;
  }

  async create(dept: Department): Promise<Department> {
    dept.created_at = new Date().toISOString();
    dept.updated_at = dept.created_at;
    localDB.mutate(db => {
      db.departments.push(dept);
    });
    appCache.del(`depts_${dept.hospital_id}`);
    return dept;
  }

  async update(dept: Department): Promise<Department> {
    dept.updated_at = new Date().toISOString();
    localDB.mutate(db => {
      const idx = db.departments.findIndex(d => d.department_id === dept.department_id && d.hospital_id === dept.hospital_id);
      if (idx >= 0) db.departments[idx] = dept;
    });
    appCache.del(`depts_${dept.hospital_id}`);
    return dept;
  }
}

export class DoctorRepository implements IDoctorRepository {
  async listByHospital(hospitalId: HospitalId): Promise<Doctor[]> {
    const cacheKey = `docs_${hospitalId}`;
    const cached = appCache.get<Doctor[]>(cacheKey);
    if (cached) return cached;

    const db = localDB.getDatabase();
    const list = db.doctors.filter(d => d.hospital_id === hospitalId && d.active_status);
    appCache.set(cacheKey, list, 300);
    return list;
  }

  async listByDepartment(hospitalId: HospitalId, departmentId: DepartmentId): Promise<Doctor[]> {
    const docs = await this.listByHospital(hospitalId);
    return docs.filter(d => d.department_id === departmentId);
  }

  async getById(hospitalId: HospitalId, doctorId: DoctorId): Promise<Doctor | null> {
    const docs = await this.listByHospital(hospitalId);
    return docs.find(d => d.doctor_id === doctorId) || null;
  }

  async findByName(hospitalId: HospitalId, query: string): Promise<Doctor[]> {
    const docs = await this.listByHospital(hospitalId);
    const q = query.toLowerCase().replace('dr.', '').replace('dr', '').trim();
    return docs.filter(d => d.doctor_name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q));
  }

  async create(doctor: Doctor): Promise<Doctor> {
    doctor.created_at = new Date().toISOString();
    doctor.updated_at = doctor.created_at;
    localDB.mutate(db => {
      db.doctors.push(doctor);
    });
    appCache.del(`docs_${doctor.hospital_id}`);
    return doctor;
  }

  async update(doctor: Doctor): Promise<Doctor> {
    doctor.updated_at = new Date().toISOString();
    localDB.mutate(db => {
      const idx = db.doctors.findIndex(d => d.doctor_id === doctor.doctor_id && d.hospital_id === doctor.hospital_id);
      if (idx >= 0) db.doctors[idx] = doctor;
    });
    appCache.del(`docs_${doctor.hospital_id}`);
    return doctor;
  }
}

export class PatientRepository implements IPatientRepository {
  async getById(hospitalId: HospitalId, patientId: PatientId): Promise<Patient | null> {
    const db = localDB.getDatabase();
    return db.patients.find(p => p.patient_id === patientId && p.hospital_id === hospitalId) || null;
  }

  async getByPhone(hospitalId: HospitalId, phone: string): Promise<Patient | null> {
    const db = localDB.getDatabase();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return db.patients.find(p => {
      if (p.hospital_id !== hospitalId) return false;
      const target = p.whatsapp_number.replace(/[^0-9]/g, '');
      return target.endsWith(cleanPhone.slice(-10)) || cleanPhone.endsWith(target.slice(-10));
    }) || null;
  }

  async search(hospitalId: HospitalId, query: string): Promise<Patient[]> {
    const db = localDB.getDatabase();
    const q = query.toLowerCase().trim();
    return db.patients.filter(p => 
      p.hospital_id === hospitalId && 
      (p.name.toLowerCase().includes(q) || p.whatsapp_number.includes(q) || p.patient_id.toLowerCase().includes(q))
    );
  }

  async create(patient: Patient): Promise<Patient> {
    patient.created_at = new Date().toISOString();
    patient.updated_at = patient.created_at;
    localDB.mutate(db => {
      db.patients.push(patient);
    });
    // Async background sync to Google Sheet
    googleSheetsAdapter.syncRecord('Patients', 'INSERT', patient).catch(() => {});
    return patient;
  }

  async update(patient: Patient): Promise<Patient> {
    patient.updated_at = new Date().toISOString();
    localDB.mutate(db => {
      const idx = db.patients.findIndex(p => p.patient_id === patient.patient_id && p.hospital_id === patient.hospital_id);
      if (idx >= 0) db.patients[idx] = patient;
    });
    googleSheetsAdapter.syncRecord('Patients', 'UPDATE', patient).catch(() => {});
    return patient;
  }
}

export class AppointmentRepository implements IAppointmentRepository {
  async getById(hospitalId: HospitalId, appointmentId: AppointmentId): Promise<Appointment | null> {
    const db = localDB.getDatabase();
    return db.appointments.find(a => a.appointment_id === appointmentId && a.hospital_id === hospitalId) || null;
  }

  async listByPatient(hospitalId: HospitalId, patientId: PatientId): Promise<Appointment[]> {
    const db = localDB.getDatabase();
    return db.appointments.filter(a => a.patient_id === patientId && a.hospital_id === hospitalId)
      .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
  }

  async listByDoctorAndDate(hospitalId: HospitalId, doctorId: DoctorId, date: string): Promise<Appointment[]> {
    const db = localDB.getDatabase();
    return db.appointments.filter(a => 
      a.hospital_id === hospitalId && 
      a.doctor_id === doctorId && 
      a.appointment_date === date &&
      a.status !== 'CANCELLED'
    );
  }

  async listByHospital(hospitalId: HospitalId, filter?: { status?: string; date?: string; doctorId?: string }): Promise<Appointment[]> {
    const db = localDB.getDatabase();
    return db.appointments.filter(a => {
      if (a.hospital_id !== hospitalId) return false;
      if (filter?.status && a.status !== filter.status) return false;
      if (filter?.date && a.appointment_date !== filter.date) return false;
      if (filter?.doctorId && a.doctor_id !== filter.doctorId) return false;
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async create(appointment: Appointment): Promise<Appointment> {
    appointment.created_at = new Date().toISOString();
    appointment.updated_at = appointment.created_at;
    localDB.mutate(db => {
      db.appointments.unshift(appointment);
    });
    // Async background sync to Google Sheet
    googleSheetsAdapter.syncRecord('Appointments', 'INSERT', appointment).catch(() => {});
    return appointment;
  }

  async update(appointment: Appointment): Promise<Appointment> {
    appointment.updated_at = new Date().toISOString();
    localDB.mutate(db => {
      const idx = db.appointments.findIndex(a => a.appointment_id === appointment.appointment_id && a.hospital_id === appointment.hospital_id);
      if (idx >= 0) db.appointments[idx] = appointment;
    });
    googleSheetsAdapter.syncRecord('Appointments', 'UPDATE', appointment).catch(() => {});
    return appointment;
  }
}

export class FollowupRepository implements IFollowupRepository {
  async listByHospital(hospitalId: HospitalId, status?: string): Promise<Followup[]> {
    const db = localDB.getDatabase();
    return db.followups.filter(f => {
      if (f.hospital_id !== hospitalId) return false;
      if (status && f.status !== status) return false;
      return true;
    }).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  }

  async listByPatient(hospitalId: HospitalId, patientId: PatientId): Promise<Followup[]> {
    const db = localDB.getDatabase();
    return db.followups.filter(f => f.patient_id === patientId && f.hospital_id === hospitalId);
  }

  async getDueFollowups(hospitalId: HospitalId, date: string): Promise<Followup[]> {
    const db = localDB.getDatabase();
    return db.followups.filter(f => 
      f.hospital_id === hospitalId && 
      f.status === 'SCHEDULED' && 
      f.scheduled_date <= date
    );
  }

  async create(followup: Followup): Promise<Followup> {
    followup.created_at = new Date().toISOString();
    followup.updated_at = followup.created_at;
    localDB.mutate(db => {
      db.followups.unshift(followup);
    });
    return followup;
  }

  async update(followup: Followup): Promise<Followup> {
    followup.updated_at = new Date().toISOString();
    localDB.mutate(db => {
      const idx = db.followups.findIndex(f => f.followup_id === followup.followup_id && f.hospital_id === followup.hospital_id);
      if (idx >= 0) db.followups[idx] = followup;
    });
    return followup;
  }
}

export class ConversationRepository implements IConversationRepository {
  async getById(hospitalId: HospitalId, conversationId: ConversationId): Promise<Conversation | null> {
    const db = localDB.getDatabase();
    return db.conversations.find(c => c.conversation_id === conversationId && c.hospital_id === hospitalId) || null;
  }

  async getByPhone(hospitalId: HospitalId, phone: string): Promise<Conversation | null> {
    const db = localDB.getDatabase();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return db.conversations.find(c => {
      if (c.hospital_id !== hospitalId) return false;
      const target = c.whatsapp_number.replace(/[^0-9]/g, '');
      return target.endsWith(cleanPhone.slice(-10)) || cleanPhone.endsWith(target.slice(-10));
    }) || null;
  }

  async listByHospital(hospitalId: HospitalId, status?: string): Promise<Conversation[]> {
    const db = localDB.getDatabase();
    return db.conversations.filter(c => {
      if (c.hospital_id !== hospitalId) return false;
      if (status && c.status !== status) return false;
      return true;
    }).sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());
  }

  async create(conv: Conversation): Promise<Conversation> {
    conv.created_at = new Date().toISOString();
    conv.updated_at = conv.created_at;
    localDB.mutate(db => {
      db.conversations.unshift(conv);
    });
    return conv;
  }

  async update(conv: Conversation): Promise<Conversation> {
    conv.updated_at = new Date().toISOString();
    localDB.mutate(db => {
      const idx = db.conversations.findIndex(c => c.conversation_id === conv.conversation_id && c.hospital_id === conv.hospital_id);
      if (idx >= 0) db.conversations[idx] = conv;
    });
    return conv;
  }

  async getMessages(hospitalId: HospitalId, conversationId: ConversationId): Promise<Message[]> {
    const db = localDB.getDatabase();
    return db.messages.filter(m => m.conversation_id === conversationId && m.hospital_id === hospitalId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async addMessage(message: Message): Promise<Message> {
    localDB.mutate(db => {
      db.messages.push(message);
      // update conversation snippet
      const conv = db.conversations.find(c => c.conversation_id === message.conversation_id && c.hospital_id === message.hospital_id);
      if (conv) {
        conv.last_message_text = message.content;
        conv.last_message_time = message.timestamp;
        conv.updated_at = message.timestamp;
      }
    });
    return message;
  }
}

export class CampaignRepository implements ICampaignRepository {
  async listByHospital(hospitalId: HospitalId): Promise<Campaign[]> {
    const db = localDB.getDatabase();
    return db.campaigns.filter(c => c.hospital_id === hospitalId);
  }

  async create(campaign: Campaign): Promise<Campaign> {
    campaign.created_at = new Date().toISOString();
    campaign.updated_at = campaign.created_at;
    localDB.mutate(db => {
      db.campaigns.unshift(campaign);
    });
    return campaign;
  }

  async update(campaign: Campaign): Promise<Campaign> {
    campaign.updated_at = new Date().toISOString();
    localDB.mutate(db => {
      const idx = db.campaigns.findIndex(c => c.campaign_id === campaign.campaign_id && c.hospital_id === campaign.hospital_id);
      if (idx >= 0) db.campaigns[idx] = campaign;
    });
    return campaign;
  }
}

export class AuditRepository implements IAuditRepository {
  async log(audit: AuditLog): Promise<void> {
    localDB.mutate(db => {
      db.auditLogs.unshift(audit);
    });
  }

  async listByHospital(hospitalId: HospitalId, limit: number = 50): Promise<AuditLog[]> {
    const db = localDB.getDatabase();
    return db.auditLogs.filter(a => a.hospital_id === hospitalId).slice(0, limit);
  }
}

// Export singleton instances
export const hospitalRepo = new HospitalRepository();
export const departmentRepo = new DepartmentRepository();
export const doctorRepo = new DoctorRepository();
export const patientRepo = new PatientRepository();
export const appointmentRepo = new AppointmentRepository();
export const followupRepo = new FollowupRepository();
export const conversationRepo = new ConversationRepository();
export const campaignRepo = new CampaignRepository();
export const auditRepo = new AuditRepository();
