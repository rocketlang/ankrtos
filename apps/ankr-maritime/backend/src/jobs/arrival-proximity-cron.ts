/**
 * Arrival Proximity Detection Cron Job
 *
 * Runs every 5 minutes to check all active vessels for proximity to destination ports.
 * When a vessel enters 200 NM radius, triggers the pre-arrival intelligence engine.
 *
 * Usage:
 * - Add to your main server file or cron scheduler
 * - Runs continuously in the background
 * - Logs all proximity detections
 */

import { PrismaClient } from '@prisma/client';
import { ProximityDetectorService } from '../services/arrival-intelligence/proximity-detector.service';
import { ArrivalIntelligenceService } from '../services/arrival-intelligence/arrival-intelligence.service';

const prisma = new PrismaClient();
const proximityDetector = new ProximityDetectorService(prisma);
const intelligenceService = new ArrivalIntelligenceService(prisma);

/**
 * Main cron job function
 * Call this every 5 minutes
 */
export async function runArrivalProximityCheck() {
  try {
    console.log(`[ArrivalProximityCron] Starting check at ${new Date().toISOString()}`);

    const startTime = Date.now();
    const results = await proximityDetector.checkAllVessels();
    const duration = Date.now() - startTime;

    console.log(`[ArrivalProximityCron] Check complete in ${duration}ms`);
    console.log(`[ArrivalProximityCron] Results:`);
    console.log(`  - Vessels checked: ${results.length}`);
    console.log(`  - New arrivals detected: ${results.filter(r => r.arrivalId).length}`);

    // Log each detected arrival
    for (const result of results.filter(r => r.detected)) {
      console.log(`  → ${result.vessel.name} approaching ${result.port.name} (${result.distance.toFixed(1)} NM)`);
    }

    // Trigger intelligence generation for new arrivals
    const newArrivals = results.filter(r => r.arrivalId);
    for (const result of newArrivals) {
      try {
        await intelligenceService.generateIntelligence(result.arrivalId!);
        console.log(`  ✓ Intelligence generated for arrival ${result.arrivalId}`);
      } catch (error) {
        console.error(`  ✗ Failed to generate intelligence for ${result.arrivalId}:`, error);
      }
    }

    return {
      success: true,
      vesselsChecked: results.length,
      arrivalsDetected: results.filter(r => r.detected).length,
      duration
    };
  } catch (error) {
    console.error('[ArrivalProximityCron] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Start the cron job (runs every 5 minutes)
 * Call this from your main server file
 */
export function startArrivalProximityCron() {
  console.log('[ArrivalProximityCron] Starting cron job (interval: 5 minutes)');

  // Run immediately on start
  runArrivalProximityCheck();

  // Then run every 5 minutes
  const intervalMs = 5 * 60 * 1000; // 5 minutes
  setInterval(() => {
    runArrivalProximityCheck();
  }, intervalMs);
}

// If run directly (for testing)
if (require.main === module) {
  console.log('[ArrivalProximityCron] Running proximity check (one-time)...');
  runArrivalProximityCheck()
    .then((result) => {
      console.log('[ArrivalProximityCron] Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('[ArrivalProximityCron] Fatal error:', error);
      process.exit(1);
    });
}
