import { WhatsAppSessionStatus } from '../types';

class WhatsAppSessionManager {
  private status: WhatsAppSessionStatus = 'CONNECTED';
  private qrCode: string = '2@CareOS_MockQR_JainHospital_2026_LiveSessionKey_9811054321';
  private connectedNumber: string = '+91 98110 54321';
  private connectedSince: string = '2026-08-26T08:00:00Z';
  private instanceName: string = 'Jain-Hospital-Main';

  public getSessionInfo() {
    return {
      status: this.status,
      qrCode: this.qrCode,
      connectedNumber: this.connectedNumber,
      connectedSince: this.connectedSince,
      instanceName: this.instanceName,
      batteryLevel: 98,
      isPlugged: true,
      lastPing: new Date().toISOString()
    };
  }

  public setStatus(s: WhatsAppSessionStatus) {
    this.status = s;
  }

  public refreshQR(): string {
    this.status = 'QR_REQUIRED';
    this.qrCode = `2@CareOS_QR_${Date.now()}_Jain_Refreshed`;
    return this.qrCode;
  }

  public reconnect(): void {
    this.status = 'CONNECTING';
    setTimeout(() => {
      this.status = 'CONNECTED';
    }, 2000);
  }

  public disconnect(): void {
    this.status = 'DISCONNECTED';
  }
}

export const sessionManager = new WhatsAppSessionManager();
