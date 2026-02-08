/**
 * Update AIS Live Count Table
 * Run every 15 minutes via cron to keep landing page stats current
 *
 * This provides fast (<10ms) stats queries instead of slow (37s) full table counts
 */

import { prisma } from '../lib/prisma.js';

async function updateLiveCount() {
  console.log('[AIS Live Count] Starting count update...');
  const startTime = Date.now();

  try {
    // Get exact counts from vessel_positions table
    // This takes ~37s but only runs every 15 min in background
    const [stats] = await prisma.$queryRaw<Array<{
      total_positions: bigint;
      unique_vessels: bigint;
    }>>`
      SELECT
        COUNT(*)::bigint as total_positions,
        COUNT(DISTINCT "vesselId")::bigint as unique_vessels
      FROM vessel_positions
    `;

    const totalPositions = Number(stats.total_positions);
    const uniqueVessels = Number(stats.unique_vessels);

    // Update the live count table (UPSERT - insert or update)
    await prisma.$executeRaw`
      INSERT INTO ais_live_count (id, total_positions, unique_vessels, last_updated)
      VALUES (1, ${totalPositions}, ${uniqueVessels}, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        total_positions = ${totalPositions},
        unique_vessels = ${uniqueVessels},
        last_updated = NOW()
    `;

    const elapsed = Date.now() - startTime;
    console.log(`[AIS Live Count] ✅ Updated successfully in ${elapsed}ms`);
    console.log(`  Total Positions: ${totalPositions.toLocaleString()}`);
    console.log(`  Unique Vessels:  ${uniqueVessels.toLocaleString()}`);

    process.exit(0);
  } catch (error) {
    console.error('[AIS Live Count] ❌ Error updating count:', error);
    process.exit(1);
  }
}

updateLiveCount();
