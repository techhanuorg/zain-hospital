import fs from 'fs';
import path from 'path';
import { 
  SEED_HOSPITAL, 
  SEED_DEPARTMENTS, 
  SEED_DOCTORS, 
  SEED_PATIENTS, 
  SEED_APPOINTMENTS, 
  SEED_FOLLOWUPS, 
  SEED_CONVERSATIONS, 
  SEED_MESSAGES, 
  SEED_CAMPAIGNS, 
  SEED_AUDIT_LOGS 
} from '../data/seed-data';
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

interface DatabaseSchema {
  hospitals: Record<string, Hospital>;
  departments: Department[];
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  followups: Followup[];
  conversations: Conversation[];
  messages: Message[];
  campaigns: Campaign[];
  auditLogs: AuditLog[];
  slotLocks: Record<string, number>; // "doctorId_date_time" -> lockExpiryEpoch
}

const DB_FILE_PATH = path.join(process.cwd(), 'data_store.json');

class LocalJSONDatabase {
  private db: DatabaseSchema | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.db = JSON.parse(raw);
      } else {
        this.resetToSeed();
      }
    } catch (e) {
      console.error('Failed reading DB file, reinitializing with seed data', e);
      this.resetToSeed();
    }
  }

  public resetToSeed() {
    this.db = {
      hospitals: { [SEED_HOSPITAL.hospital_id]: SEED_HOSPITAL },
      departments: [...SEED_DEPARTMENTS],
      doctors: [...SEED_DOCTORS],
      patients: [...SEED_PATIENTS],
      appointments: [...SEED_APPOINTMENTS],
      followups: [...SEED_FOLLOWUPS],
      conversations: [...SEED_CONVERSATIONS],
      messages: [...SEED_MESSAGES],
      campaigns: [...SEED_CAMPAIGNS],
      auditLogs: [...SEED_AUDIT_LOGS],
      slotLocks: {}
    };
    this.save();
  }

  private save() {
    try {
      if (this.db) {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.db, null, 2), 'utf-8');
      }
    } catch (e) {
      console.error('Failed writing DB file', e);
    }
  }

  public getDatabase(): DatabaseSchema {
    if (!this.db) {
      this.init();
    }
    return this.db!;
  }

  public mutate(mutator: (db: DatabaseSchema) => void): void {
    const current = this.getDatabase();
    mutator(current);
    this.save();
  }
}

export const localDB = new LocalJSONDatabase();
