/**
 * Smart AIS Data Cleanup Job
 * - Deletes most positions older than 7 days
 * - KEEPS one position per vessel per day for historical tracking
 *
 * Run via cron: 0 2 * * * (daily at 2 AM)
 */

import { prisma } from '../lib/prisma.js';

const RETENTION_DAYS = 7;

export async function smartCleanupAISData() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  console.log(`🧹 Smart AIS Cleanup (Keep 1 position/vessel/day for history)...`);
  console.log(`   Cutoff date: ${cutoffDate.toISOString()}`);

  try {
    // STEP 1: Find and mark positions to KEEP (one per vessel per day)
    console.log('\n📌 Step 1: Identifying positions to keep...');

    const positionsToKeep = await prisma.$queryRaw<Array<{ id: string }>>`
      WITH daily_positions AS (
        SELECT
          id,
          vesselId,
          DATE(timestamp) as position_date,
          ROW_NUMBER() OVER (
            PARTITION BY vesselId, DATE(timestamp)
            ORDER BY timestamp DESC
          ) as rn
        FROM vessel_positions
        WHERE timestamp < ${cutoffDate}
      )
      SELECT id
      FROM daily_positions
      WHERE rn = 1
    `;

    const keepIds = positionsToKeep.map(p => p.id);
    console.log(`   ✅ Keeping ${keepIds.length} historical positions (1 per vessel per day)`);

    // STEP 2: Delete old positions EXCEPT the ones we want to keep
    console.log('\n🗑️  Step 2: Deleting old positions (except daily snapshots)...');

    const deleteResult = await prisma.vesselPosition.deleteMany({
      where: {
        AND: [
          { timestamp: { lt: cutoffDate } },
          { id: { notIn: keepIds } }
        ]
      }
    });

    console.log(`   ✅ Deleted ${deleteResult.count} old position records`);
    console.log(`   ✅ Kept ${keepIds.length} daily snapshots for historical tracking`);

    // STEP 3: Get statistics
    const stats = await getAISStats();
    console.log('\n📊 Current AIS Database Stats:');
    console.log(`   Recent positions (< 7 days): ${stats.recentPositions.toLocaleString()}`);
    console.log(`   Historical snapshots (> 7 days): ${stats.historicalSnapshots.toLocaleString()}`);
    console.log(`   Total positions: ${stats.totalPositions.toLocaleString()}`);
    console.log(`   Unique vessels tracked: ${stats.uniqueVessels.toLocaleString()}`);
    console.log(`   Oldest position: ${stats.oldestPosition?.toLocaleString() || 'N/A'}`);
    console.log(`   Newest position: ${stats.newestPosition?.toLocaleString() || 'N/A'}`);
    console.log(`   Database size estimate: ~${stats.estimatedSizeMB} MB`);

    // STEP 4: Calculate historical coverage
    const historicalDays = await getHistoricalCoverage();
    console.log(`\n📅 Historical Coverage:`);
    console.log(`   Days of history: ${historicalDays.totalDays}`);
    console.log(`   Vessels with >30 days history: ${historicalDays.vesselsWithLongHistory}`);

    return {
      deleted: deleteResult.count,
      kept: keepIds.length,
      stats,
    };
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error.message);
    throw error;
  }
}

async function getAISStats() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  const [
    totalPositions,
    recentPositions,
    historicalSnapshots,
    uniqueVessels,
    oldestPosition,
    newestPosition,
  ] = await Promise.all([
    prisma.vesselPosition.count(),
    prisma.vesselPosition.count({
      where: { timestamp: { gte: cutoffDate } }
    }),
    prisma.vesselPosition.count({
      where: { timestamp: { lt: cutoffDate } }
    }),
    prisma.vesselPosition.findMany({
      distinct: ['vesselId'],
      select: { vesselId: true },
    }).then(result => result.length),
    prisma.vesselPosition.findFirst({
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true },
    }).then(result => result?.timestamp),
    prisma.vesselPosition.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    }).then(result => result?.timestamp),
  ]);

  // Estimate: ~200 bytes per position
  const estimatedSizeMB = Math.round((totalPositions * 200) / 1024 / 1024);

  return {
    totalPositions,
    recentPositions,
    historicalSnapshots,
    uniqueVessels,
    oldestPosition,
    newestPosition,
    estimatedSizeMB,
  };
}

async function getHistoricalCoverage() {
  const oldestDate = await prisma.vesselPosition.findFirst({
    orderBy: { timestamp: 'asc' },
    select: { timestamp: true },
  });

  if (!oldestDate) {
    return { totalDays: 0, vesselsWithLongHistory: 0 };
  }

  const totalDays = Math.floor(
    (Date.now() - oldestDate.timestamp.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Count vessels with >30 days of history
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const vesselsWithLongHistory = await prisma.vesselPosition.findMany({
    where: { timestamp: { lt: thirtyDaysAgo } },
    distinct: ['vesselId'],
    select: { vesselId: true },
  }).then(result => result.length);

  return {
    totalDays,
    vesselsWithLongHistory,
  };
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  smartCleanupAISData()
    .then(result => {
      console.log('\n✅ Smart cleanup complete');
      console.log(`   ${result.deleted} deleted, ${result.kept} kept`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Cleanup failed:', error);
      process.exit(1);
    });
}
