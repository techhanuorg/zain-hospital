import { antiBanEngine } from './anti-ban-engine';
import { campaignRepo } from '../storage/repositories';
import { Campaign } from '../types';

export interface CampaignDispatchStatus {
  campaignId: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  startedAt?: string;
  completedAt?: string;
}

export class CampaignDispatcher {
  private activeCampaigns: Map<string, CampaignDispatchStatus> = new Map();

  public getStatus(campaignId: string): CampaignDispatchStatus | undefined {
    return this.activeCampaigns.get(campaignId);
  }

  public getAllStatuses(): CampaignDispatchStatus[] {
    return Array.from(this.activeCampaigns.values());
  }

  /**
   * Dispatches a campaign with safe anti-ban pacing across all targeted patients
   */
  public async dispatchCampaign(
    campaign: Campaign,
    recipients: Array<{ phone: string; name?: string }>
  ): Promise<{ success: boolean; totalScheduled: number }> {
    const campaignId = campaign.campaign_id;

    const status: CampaignDispatchStatus = {
      campaignId,
      totalRecipients: recipients.length,
      sentCount: 0,
      failedCount: 0,
      pendingCount: recipients.length,
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
    };

    this.activeCampaigns.set(campaignId, status);

    // Update campaign record in repository
    await campaignRepo.update(campaignId, {
      status: 'RUNNING',
      sent_count: 0,
      delivered_count: 0
    });

    // Asynchronously dispatch through Anti-Ban queue in background
    (async () => {
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        
        // Personalize template
        let messageText = campaign.template_text;
        if (recipient.name) {
          messageText = messageText.replace(/\{\{name\}\}/gi, recipient.name);
        } else {
          messageText = messageText.replace(/\{\{name\}\}/gi, 'Sir/Ma\'am');
        }

        try {
          // Enqueue with LOW priority for campaign safe-pacing
          await antiBanEngine.enqueueMessage(
            recipient.phone,
            messageText,
            'LOW',
            'CAMPAIGN'
          );

          status.sentCount++;
          status.pendingCount--;

          // Update repository in increments of 5
          if (status.sentCount % 5 === 0 || status.pendingCount === 0) {
            await campaignRepo.update(campaignId, {
              sent_count: status.sentCount,
              delivered_count: Math.floor(status.sentCount * 0.95), // Estimated delivery
            });
          }

        } catch (err) {
          console.error(`[CampaignDispatcher] Error sending campaign msg to ${recipient.phone}:`, err);
          status.failedCount++;
          status.pendingCount--;
        }
      }

      status.status = 'COMPLETED';
      status.completedAt = new Date().toISOString();

      await campaignRepo.update(campaignId, {
        status: 'COMPLETED',
        sent_count: status.sentCount,
      });

      console.log(`[CampaignDispatcher] Campaign ${campaignId} completed! Total: ${status.sentCount}/${status.totalRecipients}`);
    })().catch(err => {
      console.error('[CampaignDispatcher] Fatal campaign runner error:', err);
      status.status = 'PAUSED';
    });

    return {
      success: true,
      totalScheduled: recipients.length
    };
  }
}

// Global Singleton
declare global {
  var __campaignDispatcher: CampaignDispatcher | undefined;
}

export const campaignDispatcher = globalThis.__campaignDispatcher || new CampaignDispatcher();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__campaignDispatcher = campaignDispatcher;
}
