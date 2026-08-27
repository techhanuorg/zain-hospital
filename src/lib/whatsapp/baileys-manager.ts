import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { Boom } from '@hapi/boom';
import { messageDeduplicator } from './deduplicator';
import { AIOrchestrator } from '../ai/orchestrator';
import { conversationRepo } from '../storage/repositories';
import { WhatsAppSessionStatus } from '../types';

export class BaileysManager {
  private socket: WASocket | null = null;
  private status: WhatsAppSessionStatus = 'DISCONNECTED';
  private qrCode: string | null = null;
  private qrDataUrl: string | null = null;
  private connectedNumber: string | null = null;
  private connectedSince: string | null = null;
  private instanceName: string = 'Apex-CareOS-WhatsApp';
  private isInitializing: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private lastPing: string = new Date().toISOString();

  constructor() {
    // Check if auth credentials already exist, if so try to initialize
    const authDir = this.getAuthDir();
    if (fs.existsSync(authDir) && fs.readdirSync(authDir).length > 0) {
      this.init().catch(err => console.error('[Baileys] Auto-init failed:', err));
    }
  }

  private getAuthDir(): string {
    return path.join(process.cwd(), 'data', 'baileys_auth');
  }

  public getSessionInfo() {
    this.lastPing = new Date().toISOString();
    return {
      status: this.status,
      qrCode: this.qrCode,
      qrDataUrl: this.qrDataUrl,
      connectedNumber: this.connectedNumber,
      connectedSince: this.connectedSince,
      instanceName: this.instanceName,
      batteryLevel: this.status === 'CONNECTED' ? 98 : 0,
      isPlugged: true,
      lastPing: this.lastPing,
      isBaileys: true
    };
  }

  public isConnected(): boolean {
    return this.status === 'CONNECTED' && this.socket !== null;
  }

  public async init(): Promise<void> {
    if (this.socket && this.status === 'CONNECTED') {
      return;
    }
    if (this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    this.status = 'CONNECTING';

    try {
      const authDir = this.getAuthDir();
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(authDir);
      
      let version: [number, number, number] = [2, 3000, 1015901307];
      try {
        const fetched = await fetchLatestBaileysVersion();
        if (fetched?.version) {
          version = fetched.version;
        }
      } catch (e) {
        // Fallback to default version
      }

      const logger = pino({ level: 'silent' });

      const sock = makeWASocket({
        version,
        logger,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
        browser: ['CareOS Hospital Reception', 'Chrome', '120.0.0'],
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
      });

      this.socket = sock;

      // Handle credential updates
      sock.ev.on('creds.update', saveCreds);

      // Handle connection updates (QR code, connect, disconnect)
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = qr;
          this.status = 'QR_REQUIRED';
          try {
            this.qrDataUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              scale: 8,
              color: { dark: '#0f172a', light: '#ffffff' }
            });
          } catch (err) {
            console.error('[Baileys] Error rendering QR data URL:', err);
          }
        }

        if (connection === 'open') {
          this.status = 'CONNECTED';
          this.qrCode = null;
          this.qrDataUrl = null;
          this.connectedSince = new Date().toISOString();
          
          const rawUser = sock.user?.id || '';
          const phone = rawUser.split(':')[0].replace(/[^0-9]/g, '');
          this.connectedNumber = phone ? `+${phone}` : 'Connected';
          this.isInitializing = false;
          console.log(`[Baileys] ✅ WhatsApp connected as ${this.connectedNumber}`);
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          console.log(`[Baileys] Connection closed. Reason code: ${statusCode}, LoggedOut: ${isLoggedOut}`);

          this.socket = null;
          this.isInitializing = false;

          if (isLoggedOut) {
            this.status = 'DISCONNECTED';
            this.connectedNumber = null;
            this.connectedSince = null;
            this.qrCode = null;
            this.qrDataUrl = null;
            this.clearAuthDir();
          } else {
            this.status = 'CONNECTING';
            if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = setTimeout(() => {
              this.init();
            }, 3000);
          }
        }
      });

      // Handle incoming messages
      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
          // Ignore own messages or status broadcasts
          if (!msg.message || msg.key.fromMe) continue;
          const remoteJid = msg.key.remoteJid;
          if (!remoteJid || remoteJid === 'status@broadcast' || remoteJid.endsWith('@g.us')) continue;

          const messageId = msg.key.id || `msg_${Date.now()}`;
          if (messageDeduplicator.isDuplicate(messageId)) continue;

          // Extract text content
          const messageText =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            '';

          if (!messageText || messageText.trim() === '') continue;

          const rawPhone = remoteJid.split('@')[0].replace(/[^0-9]/g, '');
          const userPhone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
          const hospitalId = 'hosp_apex_01';

          console.log(`[Baileys] 📩 Received WhatsApp message from ${userPhone}: "${messageText}"`);

          try {
            // Save incoming message in conversation history
            let conversation = await conversationRepo.getByPhone(hospitalId, userPhone);
            const convId = conversation?.conversation_id || `conv_${Date.now().toString(36)}`;

            await conversationRepo.addMessage({
              message_id: messageId,
              conversation_id: convId,
              hospital_id: hospitalId,
              sender_type: 'PATIENT',
              sender_name: conversation?.patient_name || userPhone,
              message_type: 'TEXT',
              content: messageText,
              delivery_status: 'DELIVERED',
              timestamp: new Date().toISOString()
            });

            // Process through AI Orchestrator
            const result = await AIOrchestrator.processMessage(messageText, userPhone, hospitalId);

            if (result.replyText && this.socket) {
              console.log(`[Baileys] 🤖 Sending AI reply to ${userPhone}`);
              const sent = await this.socket.sendMessage(remoteJid, { text: result.replyText });

              await conversationRepo.addMessage({
                message_id: sent?.key?.id || `reply_${Date.now()}`,
                conversation_id: convId,
                hospital_id: hospitalId,
                sender_type: 'AI_AGENT',
                sender_name: result.agent || 'CareOS Reception AI',
                message_type: 'TEXT',
                content: result.replyText,
                delivery_status: 'SENT',
                timestamp: new Date().toISOString()
              });
            }
          } catch (msgErr) {
            console.error('[Baileys] Error processing incoming WhatsApp message:', msgErr);
          }
        }
      });

      this.isInitializing = false;
    } catch (err) {
      console.error('[Baileys] Initialization failed:', err);
      this.status = 'ERROR';
      this.isInitializing = false;
    }
  }

  public async refreshQR(): Promise<{ status: WhatsAppSessionStatus; qrCode: string | null; qrDataUrl: string | null }> {
    await this.disconnect();
    this.clearAuthDir();
    await this.init();
    return {
      status: this.status,
      qrCode: this.qrCode,
      qrDataUrl: this.qrDataUrl
    };
  }

  public async reconnect(): Promise<void> {
    await this.disconnect();
    await this.init();
  }

  public async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      try {
        this.socket.end(undefined);
      } catch (e) {}
      this.socket = null;
    }
    this.status = 'DISCONNECTED';
    this.isInitializing = false;
  }

  public async logout(): Promise<void> {
    await this.disconnect();
    this.clearAuthDir();
    this.connectedNumber = null;
    this.connectedSince = null;
    this.qrCode = null;
    this.qrDataUrl = null;
    this.status = 'DISCONNECTED';
  }

  public clearAuthDir(): void {
    const authDir = this.getAuthDir();
    if (fs.existsSync(authDir)) {
      try {
        fs.rmSync(authDir, { recursive: true, force: true });
      } catch (e) {
        console.error('[Baileys] Error clearing auth directory:', e);
      }
    }
  }

  public async sendMessage(phone: string, text: string): Promise<{ success: boolean; messageId: string }> {
    if (!this.socket || this.status !== 'CONNECTED') {
      return {
        success: false,
        messageId: `mock_${Date.now()}`
      };
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const jid = `${cleanPhone}@s.whatsapp.net`;

    const res = await this.socket.sendMessage(jid, { text });
    return {
      success: true,
      messageId: res?.key?.id || `wamid_${Date.now()}`
    };
  }
}

// Global Singleton to survive Next.js module reloading
declare global {
  var __baileysManager: BaileysManager | undefined;
}

export const baileysManager = globalThis.__baileysManager || new BaileysManager();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__baileysManager = baileysManager;
}
