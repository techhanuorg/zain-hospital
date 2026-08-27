/**
 * Google Sheets Data Adapter (Phone-Friendly Webhook & API Sync)
 *
 * Supports zero-credential phone integration via Google Apps Script Webhook,
 * as well as traditional Google Service Account API sync.
 */

export interface GoogleSheetSyncPayload {
  sheetName: 'Appointments' | 'Patients' | 'Doctors' | 'Followups' | 'Conversations';
  action: 'INSERT' | 'UPDATE';
  data: Record<string, any>;
  timestamp: string;
}

export class GoogleSheetsAdapter {
  private webhookUrl: string = '';
  private spreadsheetId: string = '';
  private autoSync: boolean = true;
  private lastSyncTime: string | null = null;
  private totalSyncedCount: number = 0;
  private lastSyncStatus: 'IDLE' | 'SUCCESS' | 'FAILED' = 'IDLE';
  private lastErrorMessage: string = '';

  constructor() {
    this.webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || '';
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
  }

  public isConfigured(): boolean {
    return Boolean(this.webhookUrl || this.spreadsheetId);
  }

  public getConfig() {
    return {
      isConfigured: this.isConfigured(),
      webhookUrl: this.webhookUrl ? `${this.webhookUrl.substring(0, 35)}...` : '',
      fullWebhookUrl: this.webhookUrl,
      spreadsheetId: this.spreadsheetId,
      autoSync: this.autoSync,
      lastSyncTime: this.lastSyncTime,
      totalSyncedCount: this.totalSyncedCount,
      lastSyncStatus: this.lastSyncStatus,
      lastErrorMessage: this.lastErrorMessage,
    };
  }

  public updateConfig(config: { webhookUrl?: string; spreadsheetId?: string; autoSync?: boolean }) {
    if (config.webhookUrl !== undefined) this.webhookUrl = config.webhookUrl.trim();
    if (config.spreadsheetId !== undefined) this.spreadsheetId = config.spreadsheetId.trim();
    if (config.autoSync !== undefined) this.autoSync = config.autoSync;
    console.log('[GoogleSheetsAdapter] Config updated. Webhook active:', Boolean(this.webhookUrl));
  }

  /**
   * Dispatches real-time record to Google Sheet via Apps Script Webhook
   */
  public async syncRecord(sheetName: GoogleSheetSyncPayload['sheetName'], action: 'INSERT' | 'UPDATE', data: Record<string, any>): Promise<boolean> {
    if (!this.autoSync || !this.webhookUrl) {
      return false;
    }

    const payload: GoogleSheetSyncPayload = {
      sheetName,
      action,
      data,
      timestamp: new Date().toISOString(),
    };

    try {
      // Fire non-blocking fetch to Google Apps Script Webhook
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        this.lastSyncTime = new Date().toISOString();
        this.totalSyncedCount++;
        this.lastSyncStatus = 'SUCCESS';
        this.lastErrorMessage = '';
        return true;
      } else {
        this.lastSyncStatus = 'FAILED';
        this.lastErrorMessage = `HTTP ${res.status}: ${res.statusText}`;
        return false;
      }
    } catch (err: any) {
      console.warn('[GoogleSheetsAdapter] Background sync error:', err.message);
      this.lastSyncStatus = 'FAILED';
      this.lastErrorMessage = err.message || 'Network request failed';
      return false;
    }
  }

  /**
   * Test connection by sending a sample ping row
   */
  public async sendTestPing(): Promise<{ success: boolean; message: string }> {
    if (!this.webhookUrl) {
      return { success: false, message: 'Google Sheets Webhook URL not configured. Please paste your Apps Script URL first.' };
    }

    try {
      const testPayload: GoogleSheetSyncPayload = {
        sheetName: 'Appointments',
        action: 'INSERT',
        data: {
          appointment_id: `TEST_${Date.now()}`,
          patient_name: 'Test Patient (CareOS Verification)',
          phone: '+919811054321',
          doctor_name: 'Dr. Sharma (Cardiology)',
          date: new Date().toISOString().split('T')[0],
          time: '10:00 AM',
          status: 'VERIFIED_OK',
          created_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      if (res.ok) {
        this.lastSyncTime = new Date().toISOString();
        this.totalSyncedCount++;
        this.lastSyncStatus = 'SUCCESS';
        return { success: true, message: '✅ Google Sheet Connected successfully! Test row was added to your sheet.' };
      } else {
        return { success: false, message: `Google returned HTTP error: ${res.status} ${res.statusText}` };
      }
    } catch (err: any) {
      return { success: false, message: `Failed to reach Google Sheet Webhook: ${err.message}` };
    }
  }
}

// Global Singleton
declare global {
  var __googleSheetsAdapter: GoogleSheetsAdapter | undefined;
}

export const googleSheetsAdapter = globalThis.__googleSheetsAdapter || new GoogleSheetsAdapter();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__googleSheetsAdapter = googleSheetsAdapter;
}
