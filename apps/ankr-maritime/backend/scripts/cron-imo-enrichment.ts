#!/usr/bin/env tsx
/**
 * IMO GISIS Vessel Enrichment - Cron Job
 * Enriches vessels with ownership data from IMO GISIS
 * Run daily at 3 AM: 0 3 * * *
 */

import { prisma } from '../src/lib/prisma.js';
import { getGISISService } from '../src/services/gisis-owner-service.js';

const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
};

const VESSELS_PER_RUN = 20;
const DELAY_BETWEEN_VESSELS = 5000; // 5 seconds between vessels (respectful)
const CACHE_VALIDITY_DAYS = 90; // Re-fetch after 90 days

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enrichVessel(vesselId: string, imoNumber: string): Promise<boolean> {
  try {
    logger.info(`Enriching vessel: ${imoNumber}`);

    const gisis = await getGISISService();
    const ownerData = await gisis.getVesselOwnerByIMO(imoNumber);

    if (!ownerData || !ownerData.registeredOwner) {
      logger.warn(`No owner data found for IMO ${imoNumber}`);
      return false;
    }

    // Update vessel with ownership data
    await prisma.vessel.update({
      where: { id: vesselId },
      data: {
        registeredOwner: ownerData.registeredOwner,
        operator: ownerData.operator,
        shipManager: ownerData.technicalManager,
        ownershipUpdatedAt: new Date(),
      }
    });

    // Cache the ownership data
    await prisma.vesselOwnershipCache.upsert({
      where: { imo: imoNumber },
      create: {
        imo: imoNumber,
        data: ownerData,
        scrapedAt: new Date(),
      },
      update: {
        data: ownerData,
        scrapedAt: new Date(),
      }
    });

    logger.info(`✅ Enriched ${imoNumber}: ${ownerData.registeredOwner}`);
    return true;

  } catch (error) {
    logger.error(`Error enriching vessel ${imoNumber}:`, error);
    return false;
  }
}

async function getVesselsNeedingEnrichment(): Promise<Array<{ id: string; imo: string; name: string }>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - CACHE_VALIDITY_DAYS);

  // Find vessels that need enrichment:
  // 1. Have real IMO numbers (not AIS- prefix)
  // 2. Don't have ownership data OR data is old
  // 3. Exclude vessels scraped recently
  const vessels = await prisma.vessel.findMany({
    where: {
      NOT: {
        imo: { startsWith: 'AIS-' }
      },
      OR: [
        { registeredOwner: null },
        { ownershipUpdatedAt: null },
        { ownershipUpdatedAt: { lt: cutoffDate } },
      ]
    },
    select: {
      id: true,
      imo: true,
      name: true,
      ownershipUpdatedAt: true,
    },
    orderBy: {
      ownershipUpdatedAt: 'asc', // Oldest first
    },
    take: VESSELS_PER_RUN,
  });

  return vessels.map(v => ({ id: v.id, imo: v.imo!, name: v.name }));
}

async function main() {
  const startTime = Date.now();
  logger.info('🏢 Starting IMO GISIS enrichment cron job');
  logger.info(`Target: ${VESSELS_PER_RUN} vessels with ${DELAY_BETWEEN_VESSELS}ms delay`);

  try {
    // Get vessels needing enrichment
    const vessels = await getVesselsNeedingEnrichment();

    if (vessels.length === 0) {
      logger.info('✅ No vessels need enrichment at this time');
      await prisma.$disconnect();
      return;
    }

    logger.info(`Found ${vessels.length} vessels to enrich`);

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const vessel of vessels) {
      // Skip invalid IMO numbers
      if (!vessel.imo || vessel.imo.length < 7) {
        logger.warn(`Skipping ${vessel.name}: Invalid IMO ${vessel.imo}`);
        skippedCount++;
        continue;
      }

      try {
        const success = await enrichVessel(vessel.id, vessel.imo);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }

        // Respectful delay between vessels (5 seconds)
        if (vessels.indexOf(vessel) < vessels.length - 1) {
          logger.info(`⏳ Waiting ${DELAY_BETWEEN_VESSELS/1000}s before next vessel...`);
          await sleep(DELAY_BETWEEN_VESSELS);
        }
      } catch (error) {
        failCount++;
        logger.error(`Failed to enrich ${vessel.name}:`, error);
        // Continue with next vessel
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    logger.info('✅ IMO GISIS enrichment cron job complete');
    logger.info(`Success: ${successCount}/${vessels.length} vessels`);
    logger.info(`Failed: ${failCount} vessels`);
    logger.info(`Skipped: ${skippedCount} vessels`);
    logger.info(`Duration: ${duration}s`);

    // Log to database for monitoring
    await prisma.activityLog.create({
      data: {
        userId: 'system',
        userName: 'Cron Job',
        action: 'imo_enrichment_cron',
        entityType: 'vessel',
        entityId: 'batch',
        details: JSON.stringify({
          vesselsEnriched: successCount,
          vesselsFailed: failCount,
          vesselsSkipped: skippedCount,
          duration: `${duration}s`,
        }),
      }
    });

  } catch (error) {
    logger.error('IMO GISIS enrichment cron job failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
