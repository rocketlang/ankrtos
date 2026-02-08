/**
 * Refresh AIS Materialized Views
 *
 * Run this after the initial creation to populate views with latest data.
 * Can also be run manually anytime or automated via pg_cron.
 */

import { prisma } from '../lib/prisma.js';

async function refreshAISViews() {
  console.log('🔄 Refreshing AIS materialized views...\n');

  try {
    const startTime = Date.now();

    // Refresh all views concurrently for speed
    console.log('Refreshing:');
    console.log('  - ais_dashboard_stats');
    console.log('  - ais_nav_status_breakdown');
    console.log('  - ais_fun_facts_cache\n');

    await Promise.all([
      prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW ais_dashboard_stats`),
      prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW ais_nav_status_breakdown`),
      prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW ais_fun_facts_cache`),
    ]);

    const refreshTime = Date.now() - startTime;
    console.log(`✅ All views refreshed in ${(refreshTime / 1000).toFixed(2)}s\n`);

    // Show latest stats
    const [stats] = await prisma.$queryRaw<Array<{
      total_positions: bigint;
      unique_vessels: bigint;
      avg_speed: number | null;
      computed_at: Date;
    }>>`SELECT * FROM ais_dashboard_stats`;

    console.log('📊 Latest Stats:');
    console.log(`   Total Positions: ${Number(stats.total_positions).toLocaleString()}`);
    console.log(`   Unique Vessels: ${Number(stats.unique_vessels).toLocaleString()}`);
    console.log(`   Avg Speed: ${stats.avg_speed?.toFixed(1) || 'N/A'} knots`);
    console.log(`   Last Updated: ${stats.computed_at.toISOString()}\n`);

    // Show sample fun fact
    const [funFacts] = await prisma.$queryRaw<Array<{
      fastest_vessel_speed: number | null;
      total_positions: bigint;
    }>>`SELECT fastest_vessel_speed, total_positions FROM ais_fun_facts_cache`;

    console.log('🎯 Sample Fun Fact:');
    console.log(`   Fastest vessel speed: ${funFacts.fastest_vessel_speed?.toFixed(1)} knots`);
    console.log(`   Total positions in cache: ${Number(funFacts.total_positions).toLocaleString()}\n`);

  } catch (error) {
    console.error('❌ Error refreshing views:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

refreshAISViews()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
