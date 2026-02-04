/**
 * Certificate Expiry Cron Job
 * Scheduled task that runs daily to check certificate expiration
 *
 * Schedule: Every day at 00:00 UTC
 * Cron Expression: 0 0 * * *
 */

import cron from 'node-cron';
import { certificateExpiryMonitor } from '../services/certificate-expiry-monitor';

export function startCertificateExpiryCron(): void {
  // Run every day at 00:00 UTC
  const job = cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Certificate expiry check started at', new Date().toISOString());

    try {
      await certificateExpiryMonitor.runDailyCheck();
      console.log('[Cron] Certificate expiry check completed successfully');
    } catch (error) {
      console.error('[Cron] Certificate expiry check failed:', error);
    }
  }, {
    timezone: 'UTC',
  });

  console.log('[Cron] Certificate expiry monitor scheduled (daily at 00:00 UTC)');

  // Start the job
  job.start();

  // Optional: Run immediately on startup (for testing)
  if (process.env.RUN_CRON_ON_STARTUP === 'true') {
    console.log('[Cron] Running certificate expiry check on startup...');
    certificateExpiryMonitor.runDailyCheck().catch((error) => {
      console.error('[Cron] Startup check failed:', error);
    });
  }
}

/**
 * Manual trigger for testing/admin purposes
 */
export async function triggerCertificateExpiryCheck(): Promise<void> {
  console.log('[Manual] Triggering certificate expiry check...');
  await certificateExpiryMonitor.runDailyCheck();
  console.log('[Manual] Certificate expiry check completed');
}
