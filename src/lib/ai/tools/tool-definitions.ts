export const CONTROLLED_TOOLS_SCHEMA = [
  {
    type: 'function',
    function: {
      name: 'get_hospital_info',
      description: 'Get verified hospital profile, address, OPD timings, emergency numbers, facilities, FAQs, and supported insurance TPAs. Never hallucinate hospital information.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_departments',
      description: 'Retrieve the active medical departments in the hospital (e.g. Cardiology, Orthopaedics, General Medicine, Gynaecology, Paediatrics, ENT).',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_doctors',
      description: 'Retrieve doctors by department or search query with their qualifications, fees, and schedule.',
      parameters: {
        type: 'object',
        properties: {
          department_id: { type: 'string', description: 'Department ID e.g. dept_cardio' },
          query: { type: 'string', description: 'Doctor surname or specialization e.g. Sharma or Heart' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_available_slots',
      description: 'Retrieve real-time available appointment slots for a doctor on a specific date (YYYY-MM-DD). Never invent slots.',
      parameters: {
        type: 'object',
        properties: {
          doctor_id: { type: 'string', description: 'Doctor ID e.g. doc_sharma_01' },
          date: { type: 'string', description: 'Appointment Date in YYYY-MM-DD format e.g. 2026-08-27' },
          period_preference: { type: 'string', enum: ['morning', 'afternoon', 'evening'], description: 'Optional time period' }
        },
        required: ['doctor_id', 'date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_appointment',
      description: 'Safely books an appointment with double-booking mutex validation. Requires verified patient, doctor, date, and slot time.',
      parameters: {
        type: 'object',
        properties: {
          doctor_id: { type: 'string', description: 'Doctor ID' },
          patient_name: { type: 'string', description: 'Patient Full Name' },
          patient_phone: { type: 'string', description: 'Patient WhatsApp Number' },
          patient_age: { type: 'number', description: 'Patient Age' },
          patient_gender: { type: 'string', enum: ['Male', 'Female', 'Other'], description: 'Gender' },
          appointment_date: { type: 'string', description: 'Date in YYYY-MM-DD' },
          appointment_time: { type: 'string', description: 'Time in HH:mm 24h format e.g. 18:00' },
          notes: { type: 'string', description: 'Patient complaint or notes' }
        },
        required: ['doctor_id', 'patient_name', 'patient_phone', 'appointment_date', 'appointment_time']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_appointment',
      description: 'Retrieve appointment details by appointment ID or patient phone number.',
      parameters: {
        type: 'object',
        properties: {
          appointment_id: { type: 'string', description: 'Appointment ID e.g. APP-98421' },
          patient_phone: { type: 'string', description: 'Patient Phone Number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_appointment',
      description: 'Cancel an existing confirmed appointment.',
      parameters: {
        type: 'object',
        properties: {
          appointment_id: { type: 'string', description: 'Appointment ID' },
          reason: { type: 'string', description: 'Cancellation reason' }
        },
        required: ['appointment_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_appointment',
      description: 'Reschedule an existing appointment to a new date and time slot.',
      parameters: {
        type: 'object',
        properties: {
          appointment_id: { type: 'string', description: 'Appointment ID' },
          new_date: { type: 'string', description: 'New Date in YYYY-MM-DD' },
          new_time: { type: 'string', description: 'New Time in HH:mm' }
        },
        required: ['appointment_id', 'new_date', 'new_time']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_patient',
      description: 'Retrieve patient profile and visit history by phone number or patient ID.',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'WhatsApp phone number' },
          patient_id: { type: 'string', description: 'Patient ID' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'handoff_to_human',
      description: 'Transfer conversation to hospital reception staff when the patient requests a human or for complex medical escalations.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Reason for human handoff' }
        },
        required: ['reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_admin_summary',
      description: 'Retrieve operational summary of appointments, doctors, no-shows, and follow-ups for hospital staff.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date in YYYY-MM-DD (defaults to today)' }
        }
      }
    }
  }
];
