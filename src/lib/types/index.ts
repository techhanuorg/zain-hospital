// Multi-Tenant Hospital WhatsApp Operating System - Core Data Types

export type HospitalId = string;
export type PatientId = string;
export type DoctorId = string;
export type DepartmentId = string;
export type AppointmentId = string;
export type FollowupId = string;
export type ConversationId = string;
export type MessageId = string;

export type UserRole = 'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'DOCTOR';

export type AppointmentStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export type ConversationStatus = 
  | 'ACTIVE'
  | 'WAITING_PATIENT'
  | 'HUMAN_ASSIGNED'
  | 'CLOSED'
  | 'ARCHIVED';

export type WhatsAppSessionStatus = 
  | 'CONNECTED'
  | 'CONNECTING'
  | 'DISCONNECTED'
  | 'ERROR'
  | 'QR_REQUIRED';

export type SupportedLanguage = 
  | 'hi' // Hindi
  | 'en' // English
  | 'hinglish' // Hinglish
  | 'mr' // Marathi
  | 'gu' // Gujarati
  | 'bn' // Bengali
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'pa' // Punjabi
  | 'ur'; // Urdu

export type IntentType =
  | 'BOOK_APPOINTMENT'
  | 'CHECK_APPOINTMENT'
  | 'CANCEL_APPOINTMENT'
  | 'RESCHEDULE_APPOINTMENT'
  | 'DOCTOR_INFORMATION'
  | 'DEPARTMENT_INFORMATION'
  | 'HOSPITAL_INFORMATION'
  | 'DIRECTIONS'
  | 'TIMINGS'
  | 'EMERGENCY'
  | 'PATIENT_REGISTRATION'
  | 'PATIENT_PROFILE'
  | 'FOLLOW_UP'
  | 'MEDICINE_REMINDER'
  | 'REPORT_FOLLOW_UP'
  | 'HUMAN_HANDOFF'
  | 'ADMIN_QUERY'
  | 'GENERAL_QUERY';

export type AgentType = 
  | 'FRONT_DESK'
  | 'APPOINTMENT'
  | 'PATIENT_CARE'
  | 'PATIENT_RECORD'
  | 'ADMIN_OPS';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ExtractedEntity<T> {
  value: T;
  confidence: number; // 0.0 - 1.0
  level: ConfidenceLevel;
  rawText?: string;
}

export interface PatientEntities {
  name?: ExtractedEntity<string>;
  age?: ExtractedEntity<number>;
  gender?: ExtractedEntity<'Male' | 'Female' | 'Other'>;
  phone?: ExtractedEntity<string>;
  department?: ExtractedEntity<string>;
  doctorName?: ExtractedEntity<string>;
  targetDate?: ExtractedEntity<string>; // YYYY-MM-DD
  targetTime?: ExtractedEntity<string>; // e.g. "18:00" or "evening"
  timeOfDay?: ExtractedEntity<'morning' | 'afternoon' | 'evening' | 'night'>;
  slotTime?: ExtractedEntity<string>;
  complaint?: ExtractedEntity<string>;
}

// Multi-Tenant Entities

export interface Hospital {
  hospital_id: HospitalId;
  name: string;
  tagline?: string;
  phone: string;
  emergency_phone: string;
  whatsapp_number: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  google_maps_url: string;
  opd_timings: string;
  visiting_hours: string;
  emergency_available_247: boolean;
  facilities: string[];
  insurance_supported: string[];
  faqs: Array<{ question: string; answer: string }>;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  department_id: DepartmentId;
  hospital_id: HospitalId;
  name: string;
  name_hindi?: string;
  description: string;
  icon?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  doctor_id: DoctorId;
  hospital_id: HospitalId;
  doctor_name: string;
  specialization: string;
  department_id: DepartmentId;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  phone?: string;
  profile_image?: string;
  bio?: string;
  working_days: string[]; // ['Monday', 'Tuesday', ...]
  start_time: string; // "09:00"
  end_time: string; // "18:00"
  break_start: string; // "13:00"
  break_end: string; // "14:00"
  slot_duration_minutes: number; // 15, 20, 30
  max_patients_per_day: number;
  active_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  patient_id: PatientId;
  hospital_id: HospitalId;
  whatsapp_number: string;
  name: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  age?: number;
  address?: string;
  emergency_contact?: string;
  preferred_language: SupportedLanguage;
  consent_status: boolean;
  consent_date?: string;
  consent_source?: string;
  marketing_opt_in: boolean;
  communication_opt_in: boolean;
  registration_date: string;
  last_visit?: string;
  next_appointment?: string;
  followup_date?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  time: string; // "09:30"
  formattedTime: string; // "9:30 AM"
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  available: boolean;
  lockedUntil?: number; // epoch timestamp
  reason?: string;
}

export interface Appointment {
  appointment_id: AppointmentId;
  hospital_id: HospitalId;
  patient_id: PatientId;
  doctor_id: DoctorId;
  department_id: DepartmentId;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:mm (24h)
  status: AppointmentStatus;
  booking_source: 'WHATSAPP_AI' | 'ADMIN_PORTAL' | 'RECEPTION' | 'PHONE';
  whatsapp_number: string;
  patient_name?: string;
  doctor_name?: string;
  department_name?: string;
  consultation_fee?: number;
  cancellation_reason?: string;
  notes?: string;
  reminder_24h_sent?: boolean;
  reminder_2h_sent?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Followup {
  followup_id: FollowupId;
  hospital_id: HospitalId;
  patient_id: PatientId;
  appointment_id?: AppointmentId;
  type: 'MEDICINE_REMINDER' | 'POST_CONSULTATION' | 'MISSED_APPOINTMENT' | 'TEST_REMINDER' | 'CHRONIC_CARE' | 'CUSTOM';
  title: string;
  message_template: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:mm
  status: 'SCHEDULED' | 'SENT' | 'RESPONDED' | 'CANCELLED';
  metadata?: {
    medicine_name?: string;
    duration_days?: number;
    start_date?: string;
    test_name?: string;
    doctor_id?: string;
    original_appointment_id?: string;
  };
  sent_at?: string;
  response_received?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  conversation_id: ConversationId;
  hospital_id: HospitalId;
  patient_id?: PatientId;
  whatsapp_number: string;
  patient_name?: string;
  status: ConversationStatus;
  active_agent: AgentType;
  detected_language: SupportedLanguage;
  last_intent?: IntentType;
  context_data: {
    pendingAction?: string;
    selectedDoctorId?: string;
    selectedDepartmentId?: string;
    selectedDate?: string;
    selectedTime?: string;
    tempEntities?: Partial<PatientEntities>;
    step?: string;
    lastAgentPrompt?: string;
    consecutiveMisunderstandings?: number;
  };
  unread_count: number;
  last_message_text: string;
  last_message_time: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  message_id: MessageId;
  conversation_id: ConversationId;
  hospital_id: HospitalId;
  sender_type: 'PATIENT' | 'AI_AGENT' | 'HUMAN_STAFF' | 'SYSTEM';
  sender_name?: string;
  message_type: 'TEXT' | 'VOICE' | 'IMAGE' | 'DOCUMENT' | 'TEMPLATE';
  content: string;
  media_url?: string;
  transcription?: string;
  ocr_extracted_text?: string;
  intent?: IntentType;
  agent_invoked?: AgentType;
  tokens_used?: number;
  groq_key_index?: number;
  latency_ms?: number;
  delivery_status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  raw_payload?: Record<string, any>;
  timestamp: string;
}

export interface Campaign {
  campaign_id: string;
  hospital_id: HospitalId;
  name: string;
  type: 'HEALTH_CHECKUP' | 'VACCINATION' | 'ANNUAL_CHECKUP' | 'INACTIVE_PATIENT_REACTIVATION' | 'CUSTOM';
  target_audience: 'ALL' | 'INACTIVE_30_DAYS' | 'DIABETIC_PATIENTS' | 'CARDIAC_PATIENTS' | 'SENIOR_CITIZENS' | 'CUSTOM';
  message_template: string;
  scheduled_at: string;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  responded_count: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  log_id: string;
  hospital_id: HospitalId;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

export interface GroqKeyStatus {
  key_index: number;
  key_hint: string;
  is_active: boolean;
  request_count: number;
  error_count: number;
  rate_limited_until?: number; // timestamp
  cooldown_seconds: number;
  last_used?: string;
  avg_latency_ms: number;
  status: 'HEALTHY' | 'COOLDOWN' | 'ERROR' | 'DISABLED';
}

export interface AIResponseOutput {
  replyText: string;
  detectedLanguage: SupportedLanguage;
  intent: IntentType;
  agent: AgentType;
  confidence: number;
  entities: PatientEntities;
  toolCallsExecuted: Array<{ toolName: string; args: any; result: any }>;
  shouldHandoffToHuman: boolean;
  handoffReason?: string;
  contextUpdates?: Record<string, any>;
}
