import { WASocket } from '@whiskeysockets/baileys';

export type MessagePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AntiBanConfig {
  minDelayMs: number;         // Minimum delay between messages
  maxDelayMs: number;         // Maximum delay with jitter
  batchSize: number;          // Messages before taking batch rest
  batchCooldownMs: number;    // Rest interval after batch
  simulateTyping: boolean;    // Enable realistic typing simulation
  spintaxVariation: boolean;  // Enable dynamic message phrasing variation
  dailyLimit: number;         // Daily safety message cap
  hourlyLimit: number;        // Hourly safety message cap
}

export interface QueuedOutboundMessage {
  id: string;
  phone: string;
  text: string;
  priority: MessagePriority;
  category?: 'AI_REPLY' | 'APPOINTMENT_CONFIRM' | 'REMINDER' | 'CAMPAIGN' | 'TEST';
  enqueuedAt: number;
  resolve: (res: { success: boolean; messageId: string }) => void;
  reject: (err: any) => void;
}

export class AntiBanEngine {
  private config: AntiBanConfig = {
    minDelayMs: 3500,
    maxDelayMs: 7000,
    batchSize: 15,
    batchCooldownMs: 25000,
    simulateTyping: true,
    spintaxVariation: true,
    dailyLimit: 3500,
    hourlyLimit: 400,
  };

  private highQueue: QueuedOutboundMessage[] = [];
  private mediumQueue: QueuedOutboundMessage[] = [];
  private lowQueue: QueuedOutboundMessage[] = [];

  private isProcessing: boolean = false;
  private batchCounter: number = 0;
  private sentInCurrentHour: number = 0;
  private sentToday: number = 0;
  private currentHourTimestamp: number = Date.now();
  private currentDayDate: string = new Date().toISOString().split('T')[0];

  private consecutiveErrors: number = 0;
  private isPaused: boolean = false;
  private pauseReason: string = '';
  private pauseUntil: number = 0;

  private totalSentAllTime: number = 0;
  private totalFailedAllTime: number = 0;

  // Greetings Spintax dictionary for natural variation
  private greetingVariants: string[] = [
    'Namaste 🙏',
    'Namaskar 🙏',
    'Hello 😊',
    'Pranam 🙏',
    'Greetings from Apex Hospital 🏥',
    'Namaste ji 🙏'
  ];

  // Closing Spintax dictionary
  private closingVariants: string[] = [
    '\n\n— Apex Super Speciality Hospital Team',
    '\n\n— CareOS Digital Reception Desk',
    '\n\n— Apex Hospital Support Desk 🙏',
    '\n\n— Aapka Swasthya, Hamari Prathmikta 🏥',
    '\n\n— Apex Care Team'
  ];

  constructor() {
    // Hourly reset checker
    setInterval(() => this.checkResetIntervals(), 60000);
  }

  private checkResetIntervals() {
    const now = Date.now();
    // Reset hourly counter if 1 hour elapsed
    if (now - this.currentHourTimestamp >= 3600000) {
      this.sentInCurrentHour = 0;
      this.currentHourTimestamp = now;
    }

    // Reset daily counter at midnight
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.currentDayDate) {
      this.sentToday = 0;
      this.currentDayDate = today;
      this.batchCounter = 0;
    }

    // Check if cooldown pause has expired
    if (this.isPaused && now >= this.pauseUntil) {
      this.isPaused = false;
      this.pauseReason = '';
      this.consecutiveErrors = 0;
      console.log('[AntiBanEngine] Cooldown period ended. Resuming outbound queue.');
      this.processQueue();
    }
  }

  public getConfig(): AntiBanConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<AntiBanConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('[AntiBanEngine] Config updated:', this.config);
  }

  public getTelemetry() {
    this.checkResetIntervals();
    return {
      queueLength: {
        high: this.highQueue.length,
        medium: this.mediumQueue.length,
        low: this.lowQueue.length,
        total: this.highQueue.length + this.mediumQueue.length + this.lowQueue.length,
      },
      sentInCurrentHour: this.sentInCurrentHour,
      hourlyLimit: this.config.hourlyLimit,
      sentToday: this.sentToday,
      dailyLimit: this.config.dailyLimit,
      totalSent: this.totalSentAllTime,
      totalFailed: this.totalFailedAllTime,
      batchCount: this.batchCounter,
      isPaused: this.isPaused,
      pauseReason: this.pauseReason,
      pauseRemainingSeconds: this.isPaused ? Math.max(0, Math.ceil((this.pauseUntil - Date.now()) / 1000)) : 0,
      safetyStatus: this.getSafetyStatus(),
      config: this.config,
    };
  }

  private getSafetyStatus(): 'OPTIMAL' | 'APPROACHING_LIMIT' | 'THROTTLED' | 'PAUSED' {
    if (this.isPaused) return 'PAUSED';
    if (this.sentToday >= this.config.dailyLimit || this.sentInCurrentHour >= this.config.hourlyLimit) {
      return 'THROTTLED';
    }
    if (this.sentToday >= this.config.dailyLimit * 0.8 || this.sentInCurrentHour >= this.config.hourlyLimit * 0.8) {
      return 'APPROACHING_LIMIT';
    }
    return 'OPTIMAL';
  }

  /**
   * Apply dynamic Spintax variation to message text to prevent hash-fingerprint blocking
   */
  public applySpintax(text: string, isBroadcast: boolean = false): string {
    if (!this.config.spintaxVariation) return text;

    let modified = text;

    // Resolve manual spintax {option1|option2|option3}
    modified = modified.replace(/\{([^{}]+)\}/g, (match, choices) => {
      const parts = choices.split('|');
      return parts[Math.floor(Math.random() * parts.length)].trim();
    });

    // If bulk/broadcast, add randomized subtle polite footer or zero-width variations
    if (isBroadcast) {
      const randomClosing = this.closingVariants[Math.floor(Math.random() * this.closingVariants.length)];
      if (!modified.includes('Apex')) {
        modified += randomClosing;
      }
      // Add subtle micro-timestamp marker at bottom for absolute message uniqueness
      const uniqueTag = `\n\u200E[Ref: #${Date.now().toString(36).slice(-4)}]`;
      modified += uniqueTag;
    }

    return modified;
  }

  /**
   * Enqueue an outbound message with Anti-Ban priority handling
   */
  public async enqueueMessage(
    phone: string,
    text: string,
    priority: MessagePriority = 'HIGH',
    category: QueuedOutboundMessage['category'] = 'AI_REPLY'
  ): Promise<{ success: boolean; messageId: string }> {
    return new Promise((resolve, reject) => {
      const item: QueuedOutboundMessage = {
        id: `out_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        phone,
        text,
        priority,
        category,
        enqueuedAt: Date.now(),
        resolve,
        reject
      };

      if (priority === 'HIGH') {
        this.highQueue.push(item);
      } else if (priority === 'MEDIUM') {
        this.mediumQueue.push(item);
      } else {
        this.lowQueue.push(item);
      }

      this.processQueue();
    });
  }

  /**
   * Core worker loop that paces and delivers outbound messages safely
   */
  public async processQueue(socketGetter?: () => WASocket | null) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.highQueue.length > 0 || this.mediumQueue.length > 0 || this.lowQueue.length > 0) {
        this.checkResetIntervals();

        // Check if currently paused due to cooldown or limits
        if (this.isPaused) {
          console.warn(`[AntiBanEngine] Queue is paused: ${this.pauseReason}. Waiting...`);
          break;
        }

        // Check daily / hourly safety quota
        if (this.sentToday >= this.config.dailyLimit) {
          this.isPaused = true;
          this.pauseReason = 'Daily WhatsApp safe volume quota reached. Pausing until tomorrow to prevent ban.';
          this.pauseUntil = Date.now() + 3600000; // Check again in 1 hour
          break;
        }

        if (this.sentInCurrentHour >= this.config.hourlyLimit) {
          this.isPaused = true;
          this.pauseReason = 'Hourly message threshold reached. Cooling down for safe dispatch.';
          this.pauseUntil = Date.now() + 600000; // 10 min cooldown
          break;
        }

        // Pick next message (Strict Priority Order: HIGH -> MEDIUM -> LOW)
        let item: QueuedOutboundMessage | undefined;
        if (this.highQueue.length > 0) {
          item = this.highQueue.shift();
        } else if (this.mediumQueue.length > 0) {
          item = this.mediumQueue.shift();
        } else {
          item = this.lowQueue.shift();
        }

        if (!item) break;

        // Execute safe send
        await this.dispatchItem(item);

        // Calculate dynamic humanized delay based on message priority & batch counter
        this.batchCounter++;

        let delayMs = 0;
        if (item.priority === 'HIGH') {
          // Fast human response delay for live chat (400ms - 1200ms)
          delayMs = Math.floor(Math.random() * 800) + 400;
        } else if (item.priority === 'MEDIUM') {
          // Moderate delay for reminders (2.5s - 4.5s)
          delayMs = Math.floor(Math.random() * 2000) + 2500;
        } else {
          // Safe randomized pacing for bulk campaigns (minDelay to maxDelay with jitter)
          const jitter = Math.floor(Math.random() * (this.config.maxDelayMs - this.config.minDelayMs));
          delayMs = this.config.minDelayMs + jitter;

          // Check if batch cooldown interval reached
          if (this.batchCounter >= this.config.batchSize) {
            console.log(`[AntiBanEngine] Batch size of ${this.config.batchSize} reached. Taking human rest interval of ${this.config.batchCooldownMs / 1000}s...`);
            this.batchCounter = 0;
            delayMs += this.config.batchCooldownMs;
          }
        }

        if (delayMs > 0) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Dispatches a single message with typing simulation and socket execution
   */
  private async dispatchItem(item: QueuedOutboundMessage) {
    try {
      const { baileysManager } = await import('./baileys-manager');
      
      const cleanPhone = item.phone.replace(/[^0-9]/g, '');
      const jid = `${cleanPhone}@s.whatsapp.net`;

      // Apply Anti-Ban Spintax Variation
      const finalText = this.applySpintax(item.text, item.priority === 'LOW');

      // 1. Simulate Human Typing & Online Presence if enabled
      if (this.config.simulateTyping && baileysManager.isConnected()) {
        try {
          const sock = (baileysManager as any).socket;
          if (sock) {
            await sock.sendPresenceUpdate('available');
            await sock.sendPresenceUpdate('composing', jid);

            // Compute natural typing speed simulation (approx 40ms per char, capped 800ms - 3000ms)
            const typingDuration = Math.min(3000, Math.max(800, finalText.length * 35));
            await new Promise(r => setTimeout(r, typingDuration));

            await sock.sendPresenceUpdate('paused', jid);
          }
        } catch (presenceErr) {
          // Non-fatal, continue with message dispatch
        }
      }

      // 2. Send via Baileys Manager
      const res = await baileysManager.sendMessage(item.phone, finalText);

      // Update metrics
      this.sentInCurrentHour++;
      this.sentToday++;
      this.totalSentAllTime++;
      this.consecutiveErrors = 0;

      item.resolve({
        success: true,
        messageId: res.messageId
      });

    } catch (err: any) {
      console.error(`[AntiBanEngine] Failed to dispatch message to ${item.phone}:`, err);
      this.totalFailedAllTime++;
      this.consecutiveErrors++;

      // Circuit Breaker: If 4 consecutive errors, pause queue temporarily
      if (this.consecutiveErrors >= 4) {
        this.isPaused = true;
        this.pauseReason = 'Consecutive WhatsApp dispatch errors detected. Cooling down for 60 seconds.';
        this.pauseUntil = Date.now() + 60000;
      }

      item.reject(err);
    }
  }
}

// Global Singleton
declare global {
  var __antiBanEngine: AntiBanEngine | undefined;
}

export const antiBanEngine = globalThis.__antiBanEngine || new AntiBanEngine();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__antiBanEngine = antiBanEngine;
}
