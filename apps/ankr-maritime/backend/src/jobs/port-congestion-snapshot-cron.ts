/**
 * Port Congestion Snapshot Cron Job
 * Generates hourly congestion snapshots for all active port zones
 *
 * Schedule: Every hour at :00
 * Cron Expression: 0 * * * *
 */

import cron from 'node-cron'
import { snapshotGenerator } from './port-congestion-snapshot-generator.js'

export function startPortCongestionSnapshotCron(): void {
  // Run every hour at :00
  const job = cron.schedule(
    '0 * * * *',
    async () => {
      console.log('[Cron] Port congestion snapshot started at', new Date().toISOString())

      try {
        await snapshotGenerator.generateSnapshots()
        console.log('[Cron] Port congestion snapshot completed successfully')
      } catch (error) {
        console.error('[Cron] Port congestion snapshot failed:', error)
      }
    },
    {
      timezone: 'UTC',
    }
  )

  console.log('[Cron] Port congestion snapshot generator scheduled (hourly at :00 UTC)')

  // Start the job
  job.start()

  // Optional: Run immediately on startup (for testing)
  if (process.env.RUN_CRON_ON_STARTUP === 'true') {
    console.log('[Cron] Running port congestion snapshot on startup...')
    snapshotGenerator.generateSnapshots().catch((error) => {
      console.error('[Cron] Startup snapshot generation failed:', error)
    })
  }
}

/**
 * Manual trigger for testing/admin purposes
 */
export async function triggerPortCongestionSnapshot(): Promise<void> {
  console.log('[Manual] Triggering port congestion snapshot...')
  await snapshotGenerator.generateSnapshots()
  console.log('[Manual] Port congestion snapshot completed')
}
