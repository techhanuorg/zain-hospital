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
} from '../types';

export interface IHospitalRepository {
  getById(hospitalId: HospitalId): Promise<Hospital | null>;
  update(hospital: Hospital): Promise<Hospital>;
}

export interface IDepartmentRepository {
  listByHospital(hospitalId: HospitalId): Promise<Department[]>;
  getById(hospitalId: HospitalId, departmentId: DepartmentId): Promise<Department | null>;
  create(dept: Department): Promise<Department>;
  update(dept: Department): Promise<Department>;
}

export interface IDoctorRepository {
  listByHospital(hospitalId: HospitalId): Promise<Doctor[]>;
  listByDepartment(hospitalId: HospitalId, departmentId: DepartmentId): Promise<Doctor[]>;
  getById(hospitalId: HospitalId, doctorId: DoctorId): Promise<Doctor | null>;
  findByName(hospitalId: HospitalId, query: string): Promise<Doctor[]>;
  create(doctor: Doctor): Promise<Doctor>;
  update(doctor: Doctor): Promise<Doctor>;
}

export interface IPatientRepository {
  getById(hospitalId: HospitalId, patientId: PatientId): Promise<Patient | null>;
  getByPhone(hospitalId: HospitalId, phone: string): Promise<Patient | null>;
  search(hospitalId: HospitalId, query: string): Promise<Patient[]>;
  create(patient: Patient): Promise<Patient>;
  update(patient: Patient): Promise<Patient>;
}

export interface IAppointmentRepository {
  getById(hospitalId: HospitalId, appointmentId: AppointmentId): Promise<Appointment | null>;
  listByPatient(hospitalId: HospitalId, patientId: PatientId): Promise<Appointment[]>;
  listByDoctorAndDate(hospitalId: HospitalId, doctorId: DoctorId, date: string): Promise<Appointment[]>;
  listByHospital(hospitalId: HospitalId, filter?: { status?: string; date?: string; doctorId?: string }): Promise<Appointment[]>;
  create(appointment: Appointment): Promise<Appointment>;
  update(appointment: Appointment): Promise<Appointment>;
}

export interface IFollowupRepository {
  listByHospital(hospitalId: HospitalId, status?: string): Promise<Followup[]>;
  listByPatient(hospitalId: HospitalId, patientId: PatientId): Promise<Followup[]>;
  getDueFollowups(hospitalId: HospitalId, date: string): Promise<Followup[]>;
  create(followup: Followup): Promise<Followup>;
  update(followup: Followup): Promise<Followup>;
}

export interface IConversationRepository {
  getById(hospitalId: HospitalId, conversationId: ConversationId): Promise<Conversation | null>;
  getByPhone(hospitalId: HospitalId, phone: string): Promise<Conversation | null>;
  listByHospital(hospitalId: HospitalId, status?: string): Promise<Conversation[]>;
  create(conv: Conversation): Promise<Conversation>;
  update(conv: Conversation): Promise<Conversation>;
  getMessages(hospitalId: HospitalId, conversationId: ConversationId): Promise<Message[]>;
  addMessage(message: Message): Promise<Message>;
}

export interface ICampaignRepository {
  listByHospital(hospitalId: HospitalId): Promise<Campaign[]>;
  create(campaign: Campaign): Promise<Campaign>;
  update(campaign: Campaign): Promise<Campaign>;
}

export interface IAuditRepository {
  log(audit: AuditLog): Promise<void>;
  listByHospital(hospitalId: HospitalId, limit?: number): Promise<AuditLog[]>;
}
