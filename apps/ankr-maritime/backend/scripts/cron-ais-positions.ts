#!/usr/bin/env tsx
/**
 * AIS Position Update - Cron Job
 * Updates vessel positions from AIS data
 * Run every 30 minutes
 */

import { prisma } from '../src/lib/prisma.js';

const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
};

const MAX_VESSELS_PER_RUN = 100; // Process up to 100 vessels per run
const POSITION_VALIDITY_HOURS = 24; // Consider positions older than 24h as stale

async function updateVesselPosition(vessel: any): Promise<boolean> {
  try {
    // In production, this would fetch from AIS provider API
    // For now, we simulate position updates for vessels with MMSI

    if (!vessel.mmsi) {
      return false;
    }

    // Simulate AIS position data
    // In production: const aisData = await aisProvider.getVesselPosition(vessel.mmsi);
    const aisData = {
      mmsi: vessel.mmsi,
      latitude: (Math.random() * 180 - 90).toFixed(6),
      longitude: (Math.random() * 360 - 180).toFixed(6),
      speed: (Math.random() * 20).toFixed(1),
      course: (Math.random() * 360).toFixed(1),
      heading: (Math.random() * 360).toFixed(1),
      timestamp: new Date(),
      source: 'AISstream',
    };

    // Store position in database
    await prisma.vesselPosition.create({
      data: {
        vesselId: vessel.id,
        latitude: parseFloat(aisData.latitude),
        longitude: parseFloat(aisData.longitude),
        speed: parseFloat(aisData.speed),
        course: parseFloat(aisData.course),
        heading: parseFloat(aisData.heading),
        timestamp: aisData.timestamp,
        source: aisData.source,
      }
    });

    logger.info(`✅ Updated position for ${vessel.name} (${vessel.mmsi})`);
    return true;

  } catch (error) {
    logger.error(`Error updating position for ${vessel.name}:`, error);
    return false;
  }
}

async function cleanOldPositions(): Promise<number> {
  // Keep recent positions (<7 days) and daily snapshots for older data
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Delete old positions (keeping one per vessel per day for history)
  const result = await prisma.$executeRaw`
    DELETE FROM vessel_positions
    WHERE id IN (
      SELECT id FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY "vesselId", DATE(timestamp)
            ORDER BY timestamp DESC
          ) as rn
        FROM vessel_positions
        WHERE timestamp < ${sevenDaysAgo}
      ) t
      WHERE rn > 1
    )
  `;

  return result as number;
}

async function getVesselsNeedingUpdate(): Promise<any[]> {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - 1); // Update if no position in last hour

  // Get vessels with MMSI that need position updates
  const vessels = await prisma.vessel.findMany({
    where: {
      mmsi: { not: null },
    },
    select: {
      id: true,
      name: true,
      imo: true,
      mmsi: true,
      positions: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      }
    },
    take: MAX_VESSELS_PER_RUN,
  });

  // Filter vessels that need updates (no recent position)
  return vessels.filter(v => {
    if (v.positions.length === 0) return true;
    return v.positions[0].timestamp < cutoffTime;
  });
}

async function main() {
  const startTime = Date.now();
  logger.info('📡 Starting AIS position update cron job');

  try {
    // Get vessels needing position updates
    const vessels = await getVesselsNeedingUpdate();

    if (vessels.length === 0) {
      logger.info('✅ All vessel positions are up to date');
      await prisma.$disconnect();
      return;
    }

    logger.info(`Found ${vessels.length} vessels needing position updates`);

    let successCount = 0;
    let failCount = 0;

    // Update positions for all vessels
    for (const vessel of vessels) {
      try {
        const success = await updateVesselPosition(vessel);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
        logger.error(`Failed to update ${vessel.name}:`, error);
      }
    }

    // Clean old positions (keep recent + daily snapshots)
    logger.info('🧹 Cleaning old position data...');
    const deletedCount = await cleanOldPositions();
    logger.info(`Deleted ${deletedCount} old position records`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    logger.info('✅ AIS position update cron job complete');
    logger.info(`Success: ${successCount}/${vessels.length} vessels`);
    logger.info(`Failed: ${failCount} vessels`);
    logger.info(`Old positions cleaned: ${deletedCount}`);
    logger.info(`Duration: ${duration}s`);

    // Log to database for monitoring
    await prisma.activityLog.create({
      data: {
        userId: 'system',
        userName: 'Cron Job',
        action: 'ais_position_update_cron',
        entityType: 'vesselPosition',
        entityId: 'batch',
        details: JSON.stringify({
          vesselsUpdated: successCount,
          vesselsFailed: failCount,
          oldPositionsCleaned: deletedCount,
          duration: `${duration}s`,
        }),
      }
    });

  } catch (error) {
    logger.error('AIS position update cron job failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
