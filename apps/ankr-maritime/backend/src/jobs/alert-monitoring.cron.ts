/**
 * Alert Monitoring Cron Jobs
 *
 * Schedules recurring jobs to check for alert trigger conditions.
 * Uses node-cron for scheduling and BullMQ for job execution.
 */

import cron from 'node-cron';
import { Queue } from 'bullmq';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
};

const alertMonitoringQueue = new Queue('alert-monitoring', {
  connection: redisConnection
});

/**
 * Schedule alert monitoring jobs
 */
export function scheduleAlertMonitoring() {
  console.log('[AlertCron] Scheduling alert monitoring jobs...');

  // Proximity alerts - every 5 minutes
  // Check for vessels entering 200 NM radius
  cron.schedule('*/5 * * * *', async () => {
    try {
      await alertMonitoringQueue.add(
        'proximity-check',
        { triggerType: 'proximity' },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      );
      console.log('[AlertCron] Scheduled proximity check');
    } catch (error) {
      console.error('[AlertCron] Failed to schedule proximity check:', error);
    }
  });

  // Document deadline alerts - every 15 minutes
  // Check for approaching document deadlines
  cron.schedule('*/15 * * * *', async () => {
    try {
      await alertMonitoringQueue.add(
        'document-check',
        { triggerType: 'document' },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      );
      console.log('[AlertCron] Scheduled document check');
    } catch (error) {
      console.error('[AlertCron] Failed to schedule document check:', error);
    }
  });

  // Deadline alerts - every 10 minutes
  // Check for critical approaching deadlines
  cron.schedule('*/10 * * * *', async () => {
    try {
      await alertMonitoringQueue.add(
        'deadline-check',
        { triggerType: 'deadline' },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      );
      console.log('[AlertCron] Scheduled deadline check');
    } catch (error) {
      console.error('[AlertCron] Failed to schedule deadline check:', error);
    }
  });

  // Port congestion alerts - every 30 minutes
  // Check for high congestion warnings
  cron.schedule('*/30 * * * *', async () => {
    try {
      await alertMonitoringQueue.add(
        'congestion-check',
        { triggerType: 'congestion' },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      );
      console.log('[AlertCron] Scheduled congestion check');
    } catch (error) {
      console.error('[AlertCron] Failed to schedule congestion check:', error);
    }
  });

  // ETA change alerts - every 20 minutes
  // Check for significant ETA changes
  cron.schedule('*/20 * * * *', async () => {
    try {
      await alertMonitoringQueue.add(
        'eta-change-check',
        { triggerType: 'eta_change' },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      );
      console.log('[AlertCron] Scheduled ETA change check');
    } catch (error) {
      console.error('[AlertCron] Failed to schedule ETA change check:', error);
    }
  });

  // DA anomaly alerts - every hour
  // Check for unusual DA cost patterns
  cron.schedule('0 * * * *', async () => {
    try {
      await alertMonitoringQueue.add(
        'da-anomaly-check',
        { triggerType: 'da_anomaly' },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      );
      console.log('[AlertCron] Scheduled DA anomaly check');
    } catch (error) {
      console.error('[AlertCron] Failed to schedule DA anomaly check:', error);
    }
  });

  console.log('[AlertCron] All alert monitoring jobs scheduled successfully');
  console.log('[AlertCron] Schedule:');
  console.log('  - Proximity: Every 5 minutes');
  console.log('  - Documents: Every 15 minutes');
  console.log('  - Deadlines: Every 10 minutes');
  console.log('  - Congestion: Every 30 minutes');
  console.log('  - ETA Changes: Every 20 minutes');
  console.log('  - DA Anomalies: Every hour');

  return alertMonitoringQueue;
}

/**
 * Get queue stats for monitoring
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    alertMonitoringQueue.getWaitingCount(),
    alertMonitoringQueue.getActiveCount(),
    alertMonitoringQueue.getCompletedCount(),
    alertMonitoringQueue.getFailedCount(),
    alertMonitoringQueue.getDelayedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  };
}

/**
 * Clean up old completed and failed jobs
 */
export async function cleanupOldJobs() {
  console.log('[AlertCron] Cleaning up old jobs...');

  try {
    // Remove completed jobs older than 1 day
    await alertMonitoringQueue.clean(24 * 60 * 60 * 1000, 100, 'completed');

    // Remove failed jobs older than 7 days
    await alertMonitoringQueue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed');

    console.log('[AlertCron] Old jobs cleaned up successfully');
  } catch (error) {
    console.error('[AlertCron] Failed to clean up old jobs:', error);
  }
}

// Schedule cleanup to run daily at 2 AM
cron.schedule('0 2 * * *', cleanupOldJobs);

/**
 * Graceful shutdown
 */
export async function shutdownAlertMonitoring() {
  console.log('[AlertCron] Shutting down alert monitoring...');
  await alertMonitoringQueue.close();
  console.log('[AlertCron] Alert monitoring shut down successfully');
}
