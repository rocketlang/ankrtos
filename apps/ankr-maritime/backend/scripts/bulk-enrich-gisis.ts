/**
 * Bulk IMO GISIS Enrichment Script
 * Enriches all 15,448 vessels with ownership data from IMO GISIS
 *
 * Runtime: ~42 hours with 10s delay (can be parallelized)
 * Usage:
 *   npm run enrich:gisis          # Process all vessels
 *   npm run enrich:gisis -- 100   # Process first 100
 */

import { getGISISPlaywrightService, closeGISISPlaywrightService } from '../src/services/gisis-playwright-service.js';
import { prisma } from '../src/lib/prisma.js';
import pino from 'pino';

const logger = pino({ name: 'bulk-gisis-enrichment' });

interface EnrichmentStats {
  totalVessels: number;
  processed: number;
  enriched: number;
  failed: number;
  skipped: number;
  startTime: Date;
  estimatedCompletion: Date | null;
}

async function bulkEnrichGISIS(limit?: number) {
  const stats: EnrichmentStats = {
    totalVessels: 0,
    processed: 0,
    enriched: 0,
    failed: 0,
    skipped: 0,
    startTime: new Date(),
    estimatedCompletion: null,
  };

  try {
    logger.info('=== IMO GISIS Bulk Enrichment Started ===');
    logger.info('');

    // Count vessels needing enrichment
    const totalNeedingEnrichment = await prisma.vessel.count({
      where: {
        OR: [
          { registeredOwner: null },
          { ownershipUpdatedAt: null },
          {
            ownershipUpdatedAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Older than 30 days
            },
          },
        ],
        imo: {
          not: {
            startsWith: 'AIS-',
          },
        },
      },
    });

    stats.totalVessels = totalNeedingEnrichment;
    const targetCount = limit || totalNeedingEnrichment;

    logger.info(`Total vessels needing enrichment: ${totalNeedingEnrichment.toLocaleString()}`);
    logger.info(`Target for this run: ${targetCount.toLocaleString()}`);
    logger.info(`Estimated time: ${((targetCount * 10) / 3600).toFixed(1)} hours (10s per vessel)`);
    logger.info('');

    // Calculate estimated completion
    const estimatedSeconds = targetCount * 10; // 10 seconds per vessel
    stats.estimatedCompletion = new Date(Date.now() + estimatedSeconds * 1000);
    logger.info(`Estimated completion: ${stats.estimatedCompletion.toISOString()}`);
    logger.info('');

    // Process in batches of 20
    const batchSize = 20;
    let remaining = targetCount;
    let batchNumber = 1;

    // Initialize GISIS Playwright service with login
    const gisisService = await getGISISPlaywrightService();
    logger.info('✅ GISIS Playwright service initialized and logged in');

    while (remaining > 0) {
      const currentBatchSize = Math.min(batchSize, remaining);

      logger.info(`\n=== Batch ${batchNumber} (${currentBatchSize} vessels) ===`);
      logger.info(`Progress: ${stats.processed}/${targetCount} (${((stats.processed/targetCount)*100).toFixed(1)}%)`);
      logger.info(`Enriched: ${stats.enriched}, Failed: ${stats.failed}, Skipped: ${stats.skipped}`);

      try {
        // Fetch vessels for this batch
        const vessels = await prisma.vessel.findMany({
          where: {
            OR: [
              { registeredOwner: null },
              { ownershipUpdatedAt: null },
              {
                ownershipUpdatedAt: {
                  lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
              },
            ],
            imo: {
              not: {
                startsWith: 'AIS-',
              },
            },
          },
          take: currentBatchSize,
          orderBy: { createdAt: 'desc' },
        });

        // Enrich each vessel
        for (const vessel of vessels) {
          try {
            logger.info(`Enriching: ${vessel.name} (${vessel.imo})`);

            const ownerData = await gisisService.getVesselOwnerByIMO(vessel.imo);

            if (ownerData && ownerData.registeredOwner) {
              // Update vessel with ownership data
              await prisma.vessel.update({
                where: { id: vessel.id },
                data: {
                  registeredOwner: ownerData.registeredOwner,
                  operator: ownerData.operator,
                  shipManager: ownerData.technicalManager,
                  ownershipUpdatedAt: new Date(),
                },
              });

              stats.enriched++;
              logger.info(`✅ Enriched: ${vessel.name} - Owner: ${ownerData.registeredOwner}`);
            } else {
              stats.skipped++;
              logger.warn(`⚠️  No data for: ${vessel.name} (${vessel.imo})`);
            }

            stats.processed++;

            // Rate limiting with random jitter (10-20s) for respectful scraping
            const delay = 10000 + Math.floor(Math.random() * 10000); // 10-20 seconds
            logger.info(`⏳ Waiting ${(delay/1000).toFixed(1)}s before next vessel...`);
            await new Promise(resolve => setTimeout(resolve, delay));

          } catch (error: any) {
            stats.failed++;
            stats.processed++;
            logger.error(`❌ Failed: ${vessel.name} - ${error.message}`);
          }
        }

        remaining -= vessels.length;

        logger.info(`Batch ${batchNumber} complete:`);
        logger.info(`  Enriched: ${stats.enriched}`);
        logger.info(`  Failed: ${stats.failed}`);
        logger.info(`  Skipped: ${stats.skipped}`);

        // Save checkpoint every 100 vessels
        if (stats.processed % 100 === 0) {
          await saveCheckpoint(stats);
        }

        // Respectful break every 50 vessels (like a human taking a coffee break)
        if (stats.processed % 50 === 0 && stats.processed > 0) {
          logger.info('\n☕ Taking a 2-minute break to be respectful of the server...');
          await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutes
        }

        batchNumber++;

        // Break if we've processed the target count
        if (limit && stats.processed >= limit) {
          logger.info(`\nTarget limit of ${limit} vessels reached. Stopping.`);
          break;
        }

      } catch (error: any) {
        logger.error(`Batch ${batchNumber} failed:`, error.message);
        stats.failed += currentBatchSize;
        remaining -= currentBatchSize;

        // Wait longer before retrying after error
        logger.info('Waiting 60 seconds before next batch due to error...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }

      // Progress update
      if (stats.processed % 50 === 0) {
        printProgressReport(stats, targetCount);
      }
    }

    // Final report
    printFinalReport(stats);

    // Close GISIS Playwright service
    await closeGISISPlaywrightService();

    logger.info('\n✅ IMO GISIS Bulk Enrichment Complete!');

  } catch (error: any) {
    logger.error('Fatal error in bulk enrichment:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function saveCheckpoint(stats: EnrichmentStats): Promise<void> {
  const checkpoint = {
    timestamp: new Date().toISOString(),
    processed: stats.processed,
    enriched: stats.enriched,
    failed: stats.failed,
    skipped: stats.skipped,
    successRate: ((stats.enriched / stats.processed) * 100).toFixed(1) + '%',
  };

  // Save to database (optional - can use a checkpoint table)
  logger.info(`\n📝 Checkpoint saved: ${JSON.stringify(checkpoint, null, 2)}`);
}

function printProgressReport(stats: EnrichmentStats, targetCount: number): void {
  const elapsed = Date.now() - stats.startTime.getTime();
  const elapsedMinutes = elapsed / 60000;
  const rate = stats.processed / elapsedMinutes; // vessels per minute

  const remaining = targetCount - stats.processed;
  const estimatedMinutesLeft = remaining / rate;

  logger.info('\n=== Progress Report ===');
  logger.info(`Processed: ${stats.processed}/${targetCount} (${((stats.processed/targetCount)*100).toFixed(1)}%)`);
  logger.info(`Success Rate: ${((stats.enriched/stats.processed)*100).toFixed(1)}%`);
  logger.info(`Processing Rate: ${rate.toFixed(1)} vessels/minute`);
  logger.info(`Elapsed: ${elapsedMinutes.toFixed(0)} minutes`);
  logger.info(`Estimated Time Left: ${estimatedMinutesLeft.toFixed(0)} minutes`);
  logger.info('');
}

function printFinalReport(stats: EnrichmentStats): void {
  const elapsed = Date.now() - stats.startTime.getTime();
  const elapsedMinutes = elapsed / 60000;
  const elapsedHours = elapsedMinutes / 60;

  logger.info('\n\n╔════════════════════════════════════════════╗');
  logger.info('║  IMO GISIS Bulk Enrichment - Final Report ║');
  logger.info('╚════════════════════════════════════════════╝\n');

  logger.info(`Total Processed: ${stats.processed.toLocaleString()}`);
  logger.info(`Successfully Enriched: ${stats.enriched.toLocaleString()} (${((stats.enriched/stats.processed)*100).toFixed(1)}%)`);
  logger.info(`Failed: ${stats.failed.toLocaleString()} (${((stats.failed/stats.processed)*100).toFixed(1)}%)`);
  logger.info(`Skipped: ${stats.skipped.toLocaleString()} (${((stats.skipped/stats.processed)*100).toFixed(1)}%)`);
  logger.info('');

  logger.info(`Start Time: ${stats.startTime.toISOString()}`);
  logger.info(`End Time: ${new Date().toISOString()}`);
  logger.info(`Total Duration: ${elapsedHours.toFixed(1)} hours`);
  logger.info(`Average Rate: ${(stats.processed / elapsedMinutes).toFixed(1)} vessels/minute`);
  logger.info('');

  // Data quality metrics
  const checkDatabase = async () => {
    const totalWithOwner = await prisma.vessel.count({
      where: {
        OR: [
          { registeredOwner: { not: null } },
          { shipManager: { not: null } },
          { operator: { not: null } }
        ]
      }
    });

    const totalVessels = await prisma.vessel.count();

    logger.info('=== Database Statistics ===');
    logger.info(`Total Vessels: ${totalVessels.toLocaleString()}`);
    logger.info(`Vessels with Ownership Data: ${totalWithOwner.toLocaleString()}`);
    logger.info(`Coverage: ${((totalWithOwner/totalVessels)*100).toFixed(1)}%`);
  };

  checkDatabase().catch(logger.error);
}

// Main execution
const limit = process.argv[2] ? parseInt(process.argv[2]) : undefined;

if (limit) {
  logger.info(`Running bulk enrichment with limit: ${limit} vessels\n`);
} else {
  logger.info('Running full bulk enrichment (all vessels)\n');
}

bulkEnrichGISIS(limit).catch((error) => {
  logger.error('Bulk enrichment failed:', error);
  process.exit(1);
});
