import { AIOrchestrator } from '../ai/orchestrator';
import { conversationRepo } from '../storage/repositories';
import { messageDeduplicator } from './deduplicator';
import { antiBanEngine } from './anti-ban-engine';

export interface InboundJob {
  jobId: string;
  messageId: string;
  userPhone: string;
  rawText: string;
  hospitalId: string;
  timestamp: number;
  priority: 'CRITICAL' | 'STANDARD' | 'BULK';
}

export interface InboundMetrics {
  queuedCount: number;
  activeWorkers: number;
  maxWorkers: number;
  totalIngested: number;
  totalProcessed: number;
  totalDropped: number;
  fastPathReplies: number;
  avgProcessingTimeMs: number;
  peakQueueDepth: number;
  currentThroughputPerSec: number;
}

export class InboundQueueEngine {
  private criticalQueue: InboundJob[] = [];
  private standardQueue: InboundJob[] = [];
  private bulkQueue: InboundJob[] = [];

  private maxConcurrentWorkers: number = 60;
  private activeWorkerCount: number = 0;
  private isProcessing: boolean = false;

  private totalIngestedCount: number = 0;
  private totalProcessedCount: number = 0;
  private totalDroppedCount: number = 0;
  private fastPathReplyCount: number = 0;
  private processingLatencies: number[] = [];
  private peakQueueDepth: number = 0;

  private processedInLastSecond: number = 0;
  private currentThroughput: number = 0;

  constructor() {
    // Throughput calculator interval
    setInterval(() => {
      this.currentThroughput = this.processedInLastSecond;
      this.processedInLastSecond = 0;
    }, 1000);
  }

  public getMetrics(): InboundMetrics {
    const totalQueued = this.criticalQueue.length + this.standardQueue.length + this.bulkQueue.length;
    if (totalQueued > this.peakQueueDepth) {
      this.peakQueueDepth = totalQueued;
    }

    const avgLatency = this.processingLatencies.length > 0
      ? Math.round(this.processingLatencies.reduce((a, b) => a + b, 0) / this.processingLatencies.length)
      : 0;

    return {
      queuedCount: totalQueued,
      activeWorkers: this.activeWorkerCount,
      maxWorkers: this.maxConcurrentWorkers,
      totalIngested: this.totalIngestedCount,
      totalProcessed: this.totalProcessedCount,
      totalDropped: this.totalDroppedCount,
      fastPathReplies: this.fastPathReplyCount,
      avgProcessingTimeMs: avgLatency,
      peakQueueDepth: this.peakQueueDepth,
      currentThroughputPerSec: this.currentThroughput,
    };
  }

  /**
   * Fast non-blocking ingestion endpoint (Capable of 100,000+ incoming message bursts)
   */
  public enqueue(
    messageId: string,
    userPhone: string,
    rawText: string,
    hospitalId: string = 'hosp_apex_01'
  ): { status: 'QUEUED' | 'DROPPED_DUPLICATE' | 'DROPPED_OVERFLOW'; jobId?: string } {
    // 1. Ultra-fast Deduplication
    if (messageDeduplicator.isDuplicate(messageId)) {
      return { status: 'DROPPED_DUPLICATE' };
    }

    this.totalIngestedCount++;

    // 2. Bounded backpressure guard (Capacity up to 250,000 items in memory)
    const currentQueueSize = this.criticalQueue.length + this.standardQueue.length + this.bulkQueue.length;
    if (currentQueueSize >= 250000) {
      this.totalDroppedCount++;
      console.warn('[InboundQueue] Extreme backpressure capacity reached! Dropping non-critical message.');
      return { status: 'DROPPED_OVERFLOW' };
    }

    // 3. Fast Priority Categorization
    const lower = rawText.toLowerCase();
    let priority: InboundJob['priority'] = 'STANDARD';

    if (
      lower.includes('emergency') ||
      lower.includes('ambulance') ||
      lower.includes('serious') ||
      lower.includes('heart attack') ||
      lower.includes('dr ') ||
      lower.includes('appointment') ||
      lower.includes('cancel') ||
      lower.includes('reception')
    ) {
      priority = 'CRITICAL';
    } else if (lower.length > 300 || lower.includes('unsubscribe') || lower.includes('stop')) {
      priority = 'BULK';
    }

    const job: InboundJob = {
      jobId: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      messageId,
      userPhone,
      rawText,
      hospitalId,
      timestamp: Date.now(),
      priority,
    };

    if (priority === 'CRITICAL') {
      this.criticalQueue.push(job);
    } else if (priority === 'STANDARD') {
      this.standardQueue.push(job);
    } else {
      this.bulkQueue.push(job);
    }

    // Trigger workers
    this.spawnWorkers();

    return { status: 'QUEUED', jobId: job.jobId };
  }

  /**
   * Spawns parallel workers up to max concurrency limit
   */
  private spawnWorkers() {
    while (
      this.activeWorkerCount < this.maxConcurrentWorkers &&
      (this.criticalQueue.length > 0 || this.standardQueue.length > 0 || this.bulkQueue.length > 0)
    ) {
      this.activeWorkerCount++;
      this.runWorker().catch(err => {
        console.error('[InboundQueue] Worker execution error:', err);
      }).finally(() => {
        this.activeWorkerCount--;
        // Recheck if more jobs arrived
        if (this.criticalQueue.length > 0 || this.standardQueue.length > 0 || this.bulkQueue.length > 0) {
          this.spawnWorkers();
        }
      });
    }
  }

  private async runWorker() {
    while (this.criticalQueue.length > 0 || this.standardQueue.length > 0 || this.bulkQueue.length > 0) {
      // Pick next job (Strict priority order)
      let job: InboundJob | undefined;
      if (this.criticalQueue.length > 0) {
        job = this.criticalQueue.shift();
      } else if (this.standardQueue.length > 0) {
        job = this.standardQueue.shift();
      } else {
        job = this.bulkQueue.shift();
      }

      if (!job) break;

      const startTime = Date.now();

      try {
        await this.processSingleJob(job);

        const duration = Date.now() - startTime;
        this.totalProcessedCount++;
        this.processedInLastSecond++;

        // Keep last 100 latencies
        this.processingLatencies.push(duration);
        if (this.processingLatencies.length > 100) {
          this.processingLatencies.shift();
        }

      } catch (err: any) {
        console.error(`[InboundQueue] Error processing job ${job.jobId} for ${job.userPhone}:`, err);
      }
    }
  }

  private async processSingleJob(job: InboundJob) {
    const { userPhone, rawText, hospitalId, messageId } = job;

    // 1. Record incoming message into repository
    let conv = await conversationRepo.getByPhone(hospitalId, userPhone);
    const convId = conv?.conversation_id || `conv_${Date.now().toString(36)}`;

    await conversationRepo.addMessage({
      message_id: messageId,
      conversation_id: convId,
      hospital_id: hospitalId,
      sender_type: 'PATIENT',
      sender_name: conv?.patient_name || userPhone,
      message_type: 'TEXT',
      content: rawText,
      delivery_status: 'DELIVERED',
      timestamp: new Date().toISOString()
    });

    // 2. Overload Fast-Path Protection:
    // If system is under heavy queue load (> 5,000 pending items), use deterministic fast-reply
    const queueDepth = this.criticalQueue.length + this.standardQueue.length + this.bulkQueue.length;
    let replyText = '';
    let agentName = 'CareOS AI Reception';

    if (queueDepth > 5000 && job.priority !== 'CRITICAL') {
      this.fastPathReplyCount++;
      replyText = `Namaste! Apex Hospital me aapka sandesh mil gaya hai. Hamare digital system dwara aapka anurodh process ho raha hai 🙏`;
    } else {
      // Standard AI Orchestration
      const aiResult = await AIOrchestrator.processMessage(rawText, userPhone, hospitalId);
      replyText = aiResult.replyText;
      agentName = aiResult.agent || 'CareOS AI Reception';
    }

    // 3. Dispatch AI Outbound Reply via Anti-Ban Engine
    if (replyText) {
      const priority = job.priority === 'CRITICAL' ? 'HIGH' : 'MEDIUM';
      
      const sentRes = await antiBanEngine.enqueueMessage(
        userPhone,
        replyText,
        priority,
        'AI_REPLY'
      );

      // Record outbound message in conversation
      await conversationRepo.addMessage({
        message_id: sentRes.messageId || `reply_${Date.now()}`,
        conversation_id: convId,
        hospital_id: hospitalId,
        sender_type: 'AI_AGENT',
        sender_name: agentName,
        message_type: 'TEXT',
        content: replyText,
        delivery_status: 'SENT',
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Global Singleton
declare global {
  var __inboundQueueEngine: InboundQueueEngine | undefined;
}

export const inboundQueueEngine = globalThis.__inboundQueueEngine || new InboundQueueEngine();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__inboundQueueEngine = inboundQueueEngine;
}
