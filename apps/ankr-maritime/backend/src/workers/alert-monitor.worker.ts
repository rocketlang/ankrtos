/**
 * Alert Monitor Worker
 *
 * Background worker that monitors arrivals and triggers alerts automatically.
 * Runs continuously via BullMQ, checking for trigger conditions.
 */

import { Worker, Job } from 'bullmq';
import { alertTriggerService } from '../services/alerts/alert-trigger.service';
import { alertOrchestratorService } from '../services/alerts/alert-orchestrator.service';
import { notificationDispatcherService } from '../services/alerts/notification-dispatcher.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
};

interface AlertMonitorJob {
  triggerType: 'proximity' | 'document' | 'congestion' | 'eta_change' | 'da_anomaly' | 'deadline';
}

/**
 * Process alert monitoring jobs
 */
async function processAlertMonitoring(job: Job<AlertMonitorJob>) {
  const { triggerType } = job.data;

  console.log(`[AlertMonitor] Checking ${triggerType} triggers...`);

  try {
    // Get trigger conditions
    let triggers: any[] = [];

    switch (triggerType) {
      case 'proximity':
        triggers = await alertTriggerService.monitorProximityTriggers();
        break;
      case 'document':
        triggers = await alertTriggerService.monitorDocumentTriggers();
        break;
      case 'congestion':
        triggers = await alertTriggerService.monitorCongestionTriggers();
        break;
      case 'eta_change':
        triggers = await alertTriggerService.monitorETAChangeTriggers();
        break;
      case 'da_anomaly':
        triggers = await alertTriggerService.monitorDAAnomalyTriggers();
        break;
      case 'deadline':
        triggers = await alertTriggerService.monitorDeadlineTriggers();
        break;
    }

    if (triggers.length === 0) {
      console.log(`[AlertMonitor] No ${triggerType} triggers found`);
      return { processed: 0 };
    }

    console.log(`[AlertMonitor] Found ${triggers.length} ${triggerType} triggers`);

    // Process each trigger
    let processed = 0;
    let failed = 0;

    for (const trigger of triggers) {
      try {
        // Compose alert message
        const composedAlert = await alertOrchestratorService.composeAlert(trigger);

        // Create alert record
        const alert = await prisma.masterAlert.create({
          data: {
            arrivalId: trigger.arrivalId,
            vesselId: trigger.vesselId,
            alertType: trigger.alertType,
            title: composedAlert.title,
            message: composedAlert.message,
            priority: composedAlert.priority,
            channels: composedAlert.channels,
            recipientEmail: composedAlert.recipientEmail,
            recipientPhone: composedAlert.recipientPhone,
            metadata: composedAlert.metadata
          }
        });

        // Dispatch alert
        await notificationDispatcherService.dispatchAlert(alert.id, composedAlert);

        processed++;
        console.log(`[AlertMonitor] Dispatched alert ${alert.id} for ${trigger.alertType}`);
      } catch (error) {
        failed++;
        console.error(`[AlertMonitor] Failed to process trigger:`, error);
      }
    }

    return {
      processed,
      failed,
      total: triggers.length
    };
  } catch (error) {
    console.error(`[AlertMonitor] Error in ${triggerType} monitoring:`, error);
    throw error;
  }
}

/**
 * Create and start the alert monitor worker
 */
export function createAlertMonitorWorker() {
  const worker = new Worker<AlertMonitorJob>(
    'alert-monitoring',
    processAlertMonitoring,
    {
      connection: redisConnection,
      concurrency: 1, // Process one at a time to avoid race conditions
      limiter: {
        max: 10, // Max 10 jobs per interval
        duration: 1000 // 1 second interval
      }
    }
  );

  // Event handlers
  worker.on('completed', (job, result) => {
    console.log(`[AlertMonitor] Job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, error) => {
    console.error(`[AlertMonitor] Job ${job?.id} failed:`, error);
  });

  worker.on('error', (error) => {
    console.error('[AlertMonitor] Worker error:', error);
  });

  console.log('[AlertMonitor] Worker started successfully');

  return worker;
}

/**
 * Graceful shutdown
 */
export async function shutdownAlertMonitorWorker(worker: Worker) {
  console.log('[AlertMonitor] Shutting down worker...');
  await worker.close();
  console.log('[AlertMonitor] Worker shut down successfully');
}
