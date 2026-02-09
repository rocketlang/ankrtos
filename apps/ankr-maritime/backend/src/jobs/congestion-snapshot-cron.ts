/**
 * Port Congestion Snapshot Cron Job
 *
 * Runs every hour to create congestion snapshots for major ports.
 * These snapshots are used for:
 * - Historical pattern analysis
 * - Trend detection
 * - Improving wait time predictions
 *
 * Usage: Add to your main server file or cron scheduler
 */

import { PrismaClient } from '@prisma/client';
import { PortCongestionAnalyzerService } from '../services/arrival-intelligence/port-congestion-analyzer.service';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();
const congestionAnalyzer = new PortCongestionAnalyzerService(prisma);

/**
 * Major ports to monitor
 * Extend this list as needed
 */
const MONITORED_PORTS = [
  'SGSIN', // Singapore
  'NLRTM', // Rotterdam
  'USHOU', // Houston
  'INMUN', // Mumbai
  'CNSHA', // Shanghai
  'DEHAM', // Hamburg
  'AEJEA', // Dubai
  'USNYC', // New York
  'USLAX', // Los Angeles
  'HKHKG'  // Hong Kong
];

/**
 * Main cron job function
 * Call this every hour
 */
export async function runCongestionSnapshotJob() {
  try {
    console.log(`[CongestionSnapshotCron] Starting snapshot job at ${new Date().toISOString()}`);

    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    for (const unlocode of MONITORED_PORTS) {
      try {
        // Find port by unlocode
        const port = await prisma.port.findUnique({
          where: { unlocode }
        });

        if (!port) {
          console.warn(`[CongestionSnapshotCron] Port ${unlocode} not found`);
          continue;
        }

        // Create snapshot
        await congestionAnalyzer.createCongestionSnapshot(port.id);
        successCount++;

      } catch (error) {
        console.error(`[CongestionSnapshotCron] Error creating snapshot for ${unlocode}:`, error);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;

    console.log(`[CongestionSnapshotCron] Job complete in ${duration}ms`);
    console.log(`[CongestionSnapshotCron] Success: ${successCount}, Errors: ${errorCount}`);

    return {
      success: true,
      snapshotsCreated: successCount,
      errors: errorCount,
      duration
    };

  } catch (error) {
    console.error('[CongestionSnapshotCron] Fatal error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Start the cron job (runs every hour)
 * Call this from your main server file
 */
export function startCongestionSnapshotCron() {
  console.log('[CongestionSnapshotCron] Starting cron job (interval: 1 hour)');

  // Run immediately on start
  runCongestionSnapshotJob();

  // Then run every hour
  const intervalMs = 60 * 60 * 1000; // 1 hour
  setInterval(() => {
    runCongestionSnapshotJob();
  }, intervalMs);
}

// If run directly (for testing)
if (require.main === module) {
  console.log('[CongestionSnapshotCron] Running congestion snapshot job (one-time)...');
  runCongestionSnapshotJob()
    .then((result) => {
      console.log('[CongestionSnapshotCron] Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('[CongestionSnapshotCron] Fatal error:', error);
      process.exit(1);
    });
}
