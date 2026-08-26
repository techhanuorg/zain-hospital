# CareOS: Production AI Hospital WhatsApp Operating System

CareOS is an AI-first, WhatsApp-centric operating system built specifically for Indian hospitals. It turns the hospital's official WhatsApp number into a multilingual digital reception desk with real-time slot scheduling, messy input correction, low-literacy understanding, double-booking prevention, medicine follow-ups, and automated human-in-the-loop escalation.

---

## 🌟 Key Architecture Highlights

1. **Natural Multilingual NLU**:
   - Supports 12 Indian languages: Hindi, Hinglish, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Urdu, English.
   - Messy input tolerance: Recognizes typos and phonetic spelling ("docter", "appointmnt", "dr sarma").
   - Low-literacy single-word resolution: Interprets "haan", "nahi", "4", "kal", "shaam" directly in conversational context.
   - Any-format patient extraction: Extracts Name, Age, Gender, Department, Doctor, Date, Time with confidence scoring.

2. **5 Specialized AI Agents + Orchestrator**:
   - **Agent 1 (Front Desk Agent)**: Hospital information, timings, OPD, facilities, directions, 24x7 emergency helpline.
   - **Agent 2 (Appointment Agent)**: Live slot engine, doctor selection, double-booking mutex lock, reschedules, cancellations.
   - **Agent 3 (Patient Care Agent)**: Medicine completion countdowns, post-consultation check-ins, missed appointment recovery.
   - **Agent 4 (Patient Record Agent)**: Identification, registration, visit timeline, communication consent.
   - **Agent 5 (Admin & Ops Agent)**: Daily summaries, doctor schedules, utilization metrics.

3. **18 Controlled Backend Tools**:
   - The AI **never** mutates the database directly. It executes strictly validated controlled backend tools.

4. **11-Key Groq Failover Pool**:
   - Round-robin load balancer, automatic 429 rate-limit cooldown, and real-time health telemetry.

5. **Multi-Tenant Data Abstraction**:
   - Strict hospital-level tenant isolation (`hospital_id` on all entities).
   - Clean repository pattern with Google Sheets synchronization adapter.

---

## 🚀 Quickstart

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Or build and start production server
npm run build
npm start
```
