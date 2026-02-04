/**
 * AIS Data Cleanup Job
 * Deletes vessel position data older than 7 days
 *
 * Run via cron: 0 2 * * * (daily at 2 AM)
 */

import { prisma } from '../lib/prisma.js';

const RETENTION_DAYS = 7;

export async function cleanupOldAISData() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  console.log(`🧹 Cleaning up AIS data older than ${RETENTION_DAYS} days...`);
  console.log(`   Cutoff date: ${cutoffDate.toISOString()}`);

  try {
    // Delete old vessel positions
    const result = await prisma.vesselPosition.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`✅ Deleted ${result.count} old AIS position records`);

    // Get current statistics
    const stats = await getAISStats();
    console.log('\n📊 Current AIS Database Stats:');
    console.log(`   Total positions: ${stats.totalPositions.toLocaleString()}`);
    console.log(`   Unique vessels tracked: ${stats.uniqueVessels.toLocaleString()}`);
    console.log(`   Oldest position: ${stats.oldestPosition?.toLocaleString() || 'N/A'}`);
    console.log(`   Newest position: ${stats.newestPosition?.toLocaleString() || 'N/A'}`);
    console.log(`   Database size estimate: ~${stats.estimatedSizeMB} MB`);

    return {
      deleted: result.count,
      stats,
    };
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error.message);
    throw error;
  }
}

async function getAISStats() {
  const [totalPositions, uniqueVessels, oldestPosition, newestPosition] = await Promise.all([
    prisma.vesselPosition.count(),
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

  // Estimate database size (rough calculation)
  // Each position record ≈ 200 bytes
  const estimatedSizeMB = Math.round((totalPositions * 200) / 1024 / 1024);

  return {
    totalPositions,
    uniqueVessels,
    oldestPosition,
    newestPosition,
    estimatedSizeMB,
  };
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupOldAISData()
    .then(result => {
      console.log('\n✅ Cleanup complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Cleanup failed:', error);
      process.exit(1);
    });
}
