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
  AuditLog 
} from '../types';

export const SEED_HOSPITAL: Hospital = {
  hospital_id: 'hosp_jain_01',
  name: 'Jain Hospital & Research Centre',
  tagline: 'Leading Multispeciality Hospital in Bahraich with 24x7 Emergency & AI Care',
  phone: '+91 5252 232000',
  emergency_phone: '+91 5252 232911',
  whatsapp_number: '+91 98110 54321',
  email: 'care@jainhospitalbahraich.com',
  address: 'Jain Mandir Road, Basheerganj',
  city: 'Bahraich',
  state: 'Uttar Pradesh',
  pincode: '271801',
  google_maps_url: 'https://maps.google.com/?q=Jain+Hospital+Bahraich+Uttar+Pradesh',
  opd_timings: 'Monday to Saturday: 8:30 AM – 7:30 PM | Sunday: 9:00 AM – 1:00 PM (Emergency 24x7)',
  visiting_hours: 'IPD Visiting: 4:30 PM – 7:00 PM (Max 2 visitors per patient)',
  emergency_available_247: true,
  facilities: [
    '24x7 Emergency & Trauma Care Unit',
    'Advanced Intensive Care Unit (ICU / NICU)',
    'Modern Modular Operation Theatres',
    'In-House Digital X-Ray, Pathology & Diagnostics',
    'Complete ENT & Paediatrics Speciality Care',
    'Maternity, Normal & Caesarean Delivery Wing',
    '24x7 In-House Pharmacy with Local Delivery',
    'Advanced General Surgery & Orthopaedics',
    'Ambulance Services & Wheelchair Facility'
  ],
  insurance_supported: [
    'Ayushman Bharat (PM-JAY)', 'Star Health', 'HDFC ERGO', 'ICICI Lombard',
    'Care Health Insurance', 'Niva Bupa', 'Bajaj Allianz', 'UP State Health Scheme'
  ],
  faqs: [
    {
      question: 'OPD appointment kaise book karein?',
      answer: 'Aap seedhe is WhatsApp par doctor ka naam, department ya apni bimari/problem likh kar bhej sakte hain. Hamara AI assistant aapko available time slots dikha kar turant book kar dega.'
    },
    {
      question: 'Emergency me kya karein?',
      answer: 'Emergency ke liye turant hamare 24x7 helpline +91 5252 232911 par call karein ya seedhe Jain Mandir Road, Basheerganj, Bahraich sthit Emergency ward me aayein. Ambulance uplabdh hai.'
    },
    {
      question: 'Reports WhatsApp par kaise milengi?',
      answer: 'Test hone ke 4 se 6 ghante baad aapki diagnostic/pathology report is WhatsApp number par PDF format me automatically bhej di jayegi.'
    },
    {
      question: 'Ayushman Bharat Card chalta hai kya?',
      answer: 'Haan, hamare yahan Ayushman Bharat (PM-JAY) aur sabhi major TPA insurance companies ke cashless elaj ki suvidha uplabdh hai.'
    }
  ],
  timezone: 'Asia/Kolkata',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-08-26T12:00:00Z'
};

export const SEED_DEPARTMENTS: Department[] = [
  {
    department_id: 'dept_cardio',
    hospital_id: 'hosp_jain_01',
    name: 'Cardiology',
    name_hindi: 'हृदय रोग विभाग (दिल के डॉक्टर)',
    description: 'Comprehensive heart care, Angiography, Angioplasty, Pacemaker, ECG & Echo.',
    icon: 'HeartPulse',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    department_id: 'dept_ortho',
    hospital_id: 'hosp_jain_01',
    name: 'Orthopaedics',
    name_hindi: 'हड्डी एवं जोड़ रोग विभाग',
    description: 'Joint Replacement, Spine surgery, Fracture care, Arthroscopy & Sports Injuries.',
    icon: 'Bone',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    department_id: 'dept_genmed',
    hospital_id: 'hosp_jain_01',
    name: 'General Medicine',
    name_hindi: 'सामान्य चिकित्सा (बुखार, शुगर, बीपी)',
    description: 'Fever, Diabetes, Hypertension, Thyroid, Infections, Preventive checkups.',
    icon: 'Stethoscope',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    department_id: 'dept_gynae',
    hospital_id: 'hosp_jain_01',
    name: 'Gynaecology & Obstetrics',
    name_hindi: 'स्त्री एवं प्रसूति रोग विभाग',
    description: 'Maternity care, High-risk pregnancy, Infertility, PCOD/PCOS & Laparoscopic surgery.',
    icon: 'Baby',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    department_id: 'dept_paed',
    hospital_id: 'hosp_jain_01',
    name: 'Paediatrics',
    name_hindi: 'शिशु एवं बाल रोग विभाग',
    description: 'Child growth monitoring, Vaccinations, Neonatal care, Childhood infections.',
    icon: 'Smile',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    department_id: 'dept_ent',
    hospital_id: 'hosp_jain_01',
    name: 'ENT (Ear, Nose, Throat)',
    name_hindi: 'कान, नाक एवं गला रोग विभाग',
    description: 'Sinus surgery, Hearing issues, Tonsillectomy, Voice disorders, Vertigo management.',
    icon: 'Ear',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    department_id: 'dept_derma',
    hospital_id: 'hosp_jain_01',
    name: 'Dermatology',
    name_hindi: 'त्वचा एवं सौंदर्य रोग विभाग',
    description: 'Skin allergies, Acne, Eczema, Psoriasis, Hair fall, Laser treatments.',
    icon: 'Sparkles',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    department_id: 'dept_neuro',
    hospital_id: 'hosp_jain_01',
    name: 'Neurology',
    name_hindi: 'मस्तिष्क एवं नस रोग विभाग',
    description: 'Migraine, Stroke, Epilepsy, Neuropathy, Parkinson’s, Memory disorders.',
    icon: 'Brain',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  }
];

export const SEED_DOCTORS: Doctor[] = [
  {
    doctor_id: 'doc_sharma_01',
    hospital_id: 'hosp_jain_01',
    doctor_name: 'Dr. Rahul Sharma',
    specialization: 'Senior Consultant Interventional Cardiologist',
    department_id: 'dept_cardio',
    qualification: 'MD, DM (Cardiology) AIIMS New Delhi, FACC (USA)',
    experience_years: 18,
    consultation_fee: 1000,
    phone: '+91 98100 11223',
    profile_image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop',
    bio: 'Ex-Professor AIIMS, specialist in Complex Angioplasty, Radial Interventions and Heart Failure.',
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    start_time: '09:00',
    end_time: '19:00',
    break_start: '13:00',
    break_end: '14:30',
    slot_duration_minutes: 30,
    max_patients_per_day: 20,
    active_status: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    doctor_id: 'doc_verma_02',
    hospital_id: 'hosp_jain_01',
    doctor_name: 'Dr. Priya Verma',
    specialization: 'Associate Consultant Cardiologist',
    department_id: 'dept_cardio',
    qualification: 'MD (Med), DNB (Cardiology), Fellowship Non-Invasive Cardio',
    experience_years: 11,
    consultation_fee: 800,
    phone: '+91 98100 22334',
    profile_image: 'https://images.unsplash.com/photo-1594824813590-482a09516629?w=300&h=300&fit=crop',
    bio: 'Specialist in 2D/3D Echocardiography, Preventative Cardiology, and Women Heart Health.',
    working_days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    start_time: '10:00',
    end_time: '17:00',
    break_start: '13:30',
    break_end: '14:30',
    slot_duration_minutes: 20,
    max_patients_per_day: 22,
    active_status: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    doctor_id: 'doc_gupta_03',
    hospital_id: 'hosp_jain_01',
    doctor_name: 'Dr. Anil Gupta',
    specialization: 'Chief Orthopaedic & Robotic Joint Surgeon',
    department_id: 'dept_ortho',
    qualification: 'MS (Ortho), M.Ch (UK), Fellowship Joint Replacement (Germany)',
    experience_years: 22,
    consultation_fee: 1200,
    phone: '+91 98100 33445',
    profile_image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop',
    bio: 'Pioneer in Robotic Knee & Hip replacement with over 6,000 successful surgeries.',
    working_days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
    start_time: '09:30',
    end_time: '18:00',
    break_start: '13:00',
    break_end: '14:00',
    slot_duration_minutes: 30,
    max_patients_per_day: 18,
    active_status: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    doctor_id: 'doc_mehta_04',
    hospital_id: 'hosp_jain_01',
    doctor_name: 'Dr. Sunita Mehta',
    specialization: 'Senior Consultant Gynaecologist & Obstetrician',
    department_id: 'dept_gynae',
    qualification: 'MBBS, MS (Obstetrics & Gynaecology), FICOG',
    experience_years: 16,
    consultation_fee: 900,
    phone: '+91 98100 44556',
    profile_image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop',
    bio: 'Expert in Natural Painless Delivery, High-Risk Pregnancies, and Laparoscopic Fibroid Surgeries.',
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    start_time: '09:00',
    end_time: '16:00',
    break_start: '12:30',
    break_end: '13:30',
    slot_duration_minutes: 20,
    max_patients_per_day: 25,
    active_status: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    doctor_id: 'doc_kapoor_05',
    hospital_id: 'hosp_jain_01',
    doctor_name: 'Dr. Rajesh Kapoor',
    specialization: 'Senior Consultant Physician & Diabetologist',
    department_id: 'dept_genmed',
    qualification: 'MD (Internal Medicine) KGMU, Post Grad Dip in Diabetology (Boston)',
    experience_years: 20,
    consultation_fee: 700,
    phone: '+91 98100 55667',
    profile_image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop',
    bio: 'Specialist in Diabetes Reversal Programs, Hypertension, Infectious Diseases and Senior Care.',
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    start_time: '08:30',
    end_time: '18:30',
    break_start: '13:00',
    break_end: '14:30',
    slot_duration_minutes: 15,
    max_patients_per_day: 35,
    active_status: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  }
];

export const SEED_PATIENTS: Patient[] = [
  {
    patient_id: 'pat_ramesh_01',
    hospital_id: 'hosp_jain_01',
    whatsapp_number: '+919876543210',
    name: 'Ramesh Singh',
    gender: 'Male',
    dob: '1984-05-12',
    age: 42,
    address: 'Civil Lines, Near Water Tank, Bahraich, Uttar Pradesh',
    emergency_contact: '+91 98765 00001 (Wife)',
    preferred_language: 'hinglish',
    consent_status: true,
    consent_date: '2026-06-10T10:00:00Z',
    consent_source: 'WHATSAPP_OPTIN',
    marketing_opt_in: true,
    communication_opt_in: true,
    registration_date: '2026-06-10T10:00:00Z',
    last_visit: '2026-08-16T11:00:00Z',
    next_appointment: '2026-08-27T18:00:00Z',
    followup_date: '2026-08-26T00:00:00Z',
    status: 'ACTIVE',
    created_at: '2026-06-10T10:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    patient_id: 'pat_sunita_02',
    hospital_id: 'hosp_jain_01',
    whatsapp_number: '+919811122233',
    name: 'Sunita Devi',
    gender: 'Female',
    dob: '1988-02-20',
    age: 38,
    address: 'Flat 204, Shivam Apts, Rohini Sector 9, Delhi',
    emergency_contact: '+91 98111 99999 (Husband)',
    preferred_language: 'hi',
    consent_status: true,
    consent_date: '2026-07-01T09:30:00Z',
    consent_source: 'WHATSAPP_OPTIN',
    marketing_opt_in: true,
    communication_opt_in: true,
    registration_date: '2026-07-01T09:30:00Z',
    last_visit: '2026-08-10T15:00:00Z',
    status: 'ACTIVE',
    created_at: '2026-07-01T09:30:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  }
];

export const SEED_APPOINTMENTS: Appointment[] = [
  {
    appointment_id: 'APP-98421',
    hospital_id: 'hosp_jain_01',
    patient_id: 'pat_ramesh_01',
    doctor_id: 'doc_sharma_01',
    department_id: 'dept_cardio',
    appointment_date: '2026-08-27',
    appointment_time: '18:00',
    status: 'CONFIRMED',
    booking_source: 'WHATSAPP_AI',
    whatsapp_number: '+919876543210',
    patient_name: 'Ramesh Singh',
    doctor_name: 'Dr. Rahul Sharma',
    department_name: 'Cardiology',
    consultation_fee: 1000,
    reminder_24h_sent: true,
    reminder_2h_sent: false,
    notes: 'Routine blood pressure review & ECG check',
    created_at: '2026-08-25T14:30:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    appointment_id: 'APP-98310',
    hospital_id: 'hosp_jain_01',
    patient_id: 'pat_sunita_02',
    doctor_id: 'doc_mehta_04',
    department_id: 'dept_gynae',
    appointment_date: '2026-08-26',
    appointment_time: '11:00',
    status: 'COMPLETED',
    booking_source: 'WHATSAPP_AI',
    whatsapp_number: '+919811122233',
    patient_name: 'Sunita Devi',
    doctor_name: 'Dr. Sunita Mehta',
    department_name: 'Gynaecology & Obstetrics',
    consultation_fee: 900,
    reminder_24h_sent: true,
    reminder_2h_sent: true,
    notes: 'Postnatal 6-week checkup completed. Prescribed Calcium & Iron for 30 days.',
    created_at: '2026-08-24T10:00:00Z',
    updated_at: '2026-08-26T11:45:00Z'
  },
  {
    appointment_id: 'APP-98104',
    hospital_id: 'hosp_jain_01',
    patient_id: 'pat_ramesh_01',
    doctor_id: 'doc_kapoor_05',
    department_id: 'dept_genmed',
    appointment_date: '2026-08-22',
    appointment_time: '16:30',
    status: 'NO_SHOW',
    booking_source: 'WHATSAPP_AI',
    whatsapp_number: '+919876543210',
    patient_name: 'Ramesh Singh',
    doctor_name: 'Dr. Rajesh Kapoor',
    department_name: 'General Medicine',
    consultation_fee: 700,
    notes: 'Patient did not arrive. No-show recovery message triggered.',
    created_at: '2026-08-20T09:00:00Z',
    updated_at: '2026-08-22T17:30:00Z'
  }
];

export const SEED_FOLLOWUPS: Followup[] = [
  {
    followup_id: 'fol_med_01',
    hospital_id: 'hosp_jain_01',
    patient_id: 'pat_ramesh_01',
    appointment_id: 'APP-98421',
    type: 'MEDICINE_REMINDER',
    title: 'Telmisartan 40mg (BP Medicine) 10-day Course Completion',
    message_template: 'Namaste Ramesh ji 👋 Aapki blood pressure medicine kal complete hone wali hai. Kya aap follow-up appointment book karna chahenge?\n\n1️⃣ Haan\n2️⃣ Baad me\n3️⃣ Zarurat nahi',
    scheduled_date: '2026-08-26',
    scheduled_time: '10:00',
    status: 'SENT',
    metadata: {
      medicine_name: 'Telmisartan 40mg',
      duration_days: 10,
      start_date: '2026-08-16',
      doctor_id: 'doc_sharma_01'
    },
    sent_at: '2026-08-26T10:00:00Z',
    created_at: '2026-08-16T11:30:00Z',
    updated_at: '2026-08-26T10:00:00Z'
  },
  {
    followup_id: 'fol_missed_02',
    hospital_id: 'hosp_jain_01',
    patient_id: 'pat_ramesh_01',
    appointment_id: 'APP-98104',
    type: 'MISSED_APPOINTMENT',
    title: 'Missed Appointment Recovery - Dr. Rajesh Kapoor',
    message_template: 'Namaste Ramesh ji. Aapki 22 Aug ki appointment miss ho gayi thi. Kya aap dobara appointment book karna chahenge?\n\n1️⃣ Haan\n2️⃣ Baad me',
    scheduled_date: '2026-08-23',
    scheduled_time: '11:00',
    status: 'RESPONDED',
    response_received: 'haan kal ka time do',
    sent_at: '2026-08-23T11:00:00Z',
    created_at: '2026-08-22T17:35:00Z',
    updated_at: '2026-08-23T12:00:00Z'
  }
];

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    conversation_id: 'conv_ramesh_01',
    hospital_id: 'hosp_jain_01',
    patient_id: 'pat_ramesh_01',
    whatsapp_number: '+919876543210',
    patient_name: 'Ramesh Singh',
    status: 'ACTIVE',
    active_agent: 'APPOINTMENT',
    detected_language: 'hinglish',
    last_intent: 'BOOK_APPOINTMENT',
    context_data: {
      selectedDoctorId: 'doc_sharma_01',
      selectedDepartmentId: 'dept_cardio',
      selectedDate: '2026-08-27',
      selectedTime: '18:00',
      step: 'CONFIRMED'
    },
    unread_count: 0,
    last_message_text: 'Appointment Confirmed ✅ Dr Rahul Sharma, 27 Aug 6:00 PM',
    last_message_time: '2026-08-26T12:30:00Z',
    created_at: '2026-08-25T14:20:00Z',
    updated_at: '2026-08-26T12:30:00Z'
  }
];

export const SEED_MESSAGES: Message[] = [
  {
    message_id: 'msg_001',
    conversation_id: 'conv_ramesh_01',
    hospital_id: 'hosp_jain_01',
    sender_type: 'PATIENT',
    sender_name: 'Ramesh Singh',
    message_type: 'TEXT',
    content: 'mujhe doctor ko dikhana hai kal shaam ko',
    intent: 'BOOK_APPOINTMENT',
    delivery_status: 'READ',
    timestamp: '2026-08-25T14:20:00Z'
  },
  {
    message_id: 'msg_002',
    conversation_id: 'conv_ramesh_01',
    hospital_id: 'hosp_jain_01',
    sender_type: 'AI_AGENT',
    sender_name: 'Jain AI Front Desk',
    message_type: 'TEXT',
    content: 'Namaste Ramesh ji! 😊 Aap kis department ya doctor se appointment lena chahte hain?\n\n1️⃣ Cardiology (दिल)\n2️⃣ Orthopaedics (हड्डी)\n3️⃣ General Medicine (बुखार/BP)\n4️⃣ Other',
    agent_invoked: 'APPOINTMENT',
    tokens_used: 120,
    groq_key_index: 0,
    latency_ms: 320,
    delivery_status: 'READ',
    timestamp: '2026-08-25T14:20:02Z'
  },
  {
    message_id: 'msg_003',
    conversation_id: 'conv_ramesh_01',
    hospital_id: 'hosp_jain_01',
    sender_type: 'PATIENT',
    sender_name: 'Ramesh Singh',
    message_type: 'TEXT',
    content: 'cardiology dr sharma',
    intent: 'BOOK_APPOINTMENT',
    delivery_status: 'READ',
    timestamp: '2026-08-25T14:21:00Z'
  },
  {
    message_id: 'msg_004',
    conversation_id: 'conv_ramesh_01',
    hospital_id: 'hosp_jain_01',
    sender_type: 'AI_AGENT',
    sender_name: 'Jain AI Appointment Desk',
    message_type: 'TEXT',
    content: 'Dr. Rahul Sharma ke kal shaam ke available slots:\n\n⏰ 5:30 PM\n⏰ 6:00 PM\n⏰ 6:30 PM\n\nKaunsa time book karu aapke liye?',
    agent_invoked: 'APPOINTMENT',
    tokens_used: 180,
    groq_key_index: 1,
    latency_ms: 280,
    delivery_status: 'READ',
    timestamp: '2026-08-25T14:21:03Z'
  },
  {
    message_id: 'msg_005',
    conversation_id: 'conv_ramesh_01',
    hospital_id: 'hosp_jain_01',
    sender_type: 'PATIENT',
    sender_name: 'Ramesh Singh',
    message_type: 'TEXT',
    content: '6',
    intent: 'BOOK_APPOINTMENT',
    delivery_status: 'READ',
    timestamp: '2026-08-25T14:22:00Z'
  },
  {
    message_id: 'msg_006',
    conversation_id: 'conv_ramesh_01',
    hospital_id: 'hosp_jain_01',
    sender_type: 'AI_AGENT',
    sender_name: 'Jain AI Appointment Desk',
    message_type: 'TEXT',
    content: 'Appointment Confirmed ✅\n\n👤 Patient: Ramesh Singh\n👨‍⚕️ Doctor: Dr. Rahul Sharma\n🏥 Department: Cardiology\n📅 Date: 27 Aug 2026\n⏰ Time: 6:00 PM\n🔖 Appointment ID: APP-98421\n\nKripya 10-15 minute pehle OPD reception par report karein. Dhanyawad!',
    agent_invoked: 'APPOINTMENT',
    tokens_used: 210,
    groq_key_index: 2,
    latency_ms: 310,
    delivery_status: 'READ',
    timestamp: '2026-08-25T14:22:02Z'
  }
];

export const SEED_CAMPAIGNS: Campaign[] = [
  {
    campaign_id: 'camp_diabetic_01',
    hospital_id: 'hosp_jain_01',
    name: 'Free HbA1c & Cardiac Screening Camp',
    type: 'HEALTH_CHECKUP',
    target_audience: 'DIABETIC_PATIENTS',
    message_template: 'Namaste {{name}} ji! 🏥 Jain Hospital me is Somvar (31 Aug) ko Free Diabetes & Heart Checkup Camp aayojit kiya ja raha hai. Kya aap apna slot register karna chahenge?\n\n1️⃣ Haan, slot book karein\n2️⃣ Baad me',
    scheduled_at: '2026-08-29T09:00:00Z',
    status: 'SCHEDULED',
    total_recipients: 450,
    sent_count: 0,
    delivered_count: 0,
    read_count: 0,
    responded_count: 0,
    created_at: '2026-08-25T10:00:00Z',
    updated_at: '2026-08-25T10:00:00Z'
  }
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    log_id: 'aud_001',
    hospital_id: 'hosp_jain_01',
    user_id: 'sys_ai_agent',
    user_name: 'Jain AI Orchestrator',
    action: 'CREATE_APPOINTMENT',
    entity_type: 'APPOINTMENT',
    entity_id: 'APP-98421',
    details: { doctor: 'Dr. Rahul Sharma', slot: '2026-08-27 18:00', channel: 'WhatsApp' },
    ip_address: '127.0.0.1',
    timestamp: '2026-08-25T14:22:02Z'
  },
  {
    log_id: 'aud_002',
    hospital_id: 'hosp_jain_01',
    user_id: 'sys_ai_agent',
    user_name: 'Jain AI Orchestrator',
    action: 'EXECUTE_TOOL',
    entity_type: 'TOOL',
    entity_id: 'create_appointment',
    details: { slot_locked: true, validation_passed: true },
    ip_address: '127.0.0.1',
    timestamp: '2026-08-25T14:22:01Z'
  }
];
