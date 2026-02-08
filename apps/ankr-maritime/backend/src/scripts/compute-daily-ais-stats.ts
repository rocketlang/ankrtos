#!/usr/bin/env tsx
/**
 * Daily AIS Stats Computation
 *
 * Runs once per day to pre-compute AIS fun facts
 * Results stored in JSON file for instant access
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function computeDailyStats() {
  console.log('🔄 Computing daily AIS stats...');
  const startTime = Date.now();

  try {
    // 1. Approximate total positions (instant)
    const [totalPositionsQuery, totalVesselsQuery] = await Promise.all([
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT reltuples::bigint as count
        FROM pg_class
        WHERE relname = 'vessel_positions'
      `,
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int as count
        FROM vessels
      `,
    ]);

    const totalPositions = Number(totalPositionsQuery[0]?.count || 0);
    const uniqueVessels = totalVesselsQuery[0]?.count || 0;

    // 2. Time coverage
    const dateRange = await prisma.$queryRaw<Array<{ earliest: Date; latest: Date }>>`
      SELECT
        (SELECT timestamp FROM vessel_positions ORDER BY timestamp ASC LIMIT 1) as earliest,
        (SELECT timestamp FROM vessel_positions ORDER BY timestamp DESC LIMIT 1) as latest
    `;

    const earliest = dateRange[0]?.earliest || new Date();
    const latest = dateRange[0]?.latest || new Date();
    const durationMs = new Date(latest).getTime() - new Date(earliest).getTime();
    const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));

    // 3. Current stats from last 24 hours
    const [shipsMoving, shipsOnEquator, shipsAtSuez] = await Promise.all([
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(DISTINCT "vesselId")::int as count
        FROM (
          SELECT DISTINCT ON ("vesselId") "vesselId", speed
          FROM vessel_positions
          WHERE speed IS NOT NULL AND timestamp >= NOW() - INTERVAL '1 day'
          ORDER BY "vesselId", timestamp DESC
        ) latest
        WHERE speed > 0.5
      `,
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(DISTINCT "vesselId")::int as count
        FROM (
          SELECT DISTINCT ON ("vesselId") "vesselId", latitude
          FROM vessel_positions
          WHERE timestamp >= NOW() - INTERVAL '1 day'
          ORDER BY "vesselId", timestamp DESC
        ) latest
        WHERE latitude BETWEEN -0.033 AND 0.033
      `,
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(DISTINCT "vesselId")::int as count
        FROM (
          SELECT DISTINCT ON ("vesselId") "vesselId", latitude, longitude
          FROM vessel_positions
          WHERE timestamp >= NOW() - INTERVAL '1 day'
          ORDER BY "vesselId", timestamp DESC
        ) latest
        WHERE latitude BETWEEN 29.8 AND 31.2 AND longitude BETWEEN 32.0 AND 32.6
      `,
    ]);

    // 4. Last 7 days trend
    const last7Days = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT
        DATE(timestamp)::text as date,
        COUNT(*)::int as count
      FROM vessel_positions
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
      LIMIT 7
    `;

    // 5. Geographic coverage (last 7 days)
    const geoCoverage = await prisma.$queryRaw<Array<{
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    }>>`
      SELECT
        MIN(latitude)::float as "minLat",
        MAX(latitude)::float as "maxLat",
        MIN(longitude)::float as "minLon",
        MAX(longitude)::float as "maxLon"
      FROM vessel_positions
      WHERE timestamp >= NOW() - INTERVAL '7 days'
    `;

    const geo = geoCoverage[0];
    const latSpan = geo ? geo.maxLat - geo.minLat : 0;
    const lonSpan = geo ? geo.maxLon - geo.minLon : 0;

    // Build result
    const stats = {
      totalPositions,
      uniqueVessels,
      avgPositionsPerShip: uniqueVessels > 0 ? Math.floor(totalPositions / uniqueVessels) : 0,
      earliestDate: new Date(earliest).toISOString(),
      latestDate: new Date(latest).toISOString(),
      durationDays,
      shipsMovingNow: shipsMoving[0]?.count || 0,
      shipsAtAnchor: uniqueVessels - (shipsMoving[0]?.count || 0),
      shipsOnEquator: shipsOnEquator[0]?.count || 0,
      shipsAtSuez: shipsAtSuez[0]?.count || 0,
      coverageLatSpan: latSpan,
      coverageLonSpan: lonSpan,
      coveragePercent: geo ? (latSpan / 180) * 100 : 0,
      last7DaysTrend: last7Days,
      lastUpdated: new Date().toISOString(),
      computedIn: Date.now() - startTime,
    };

    // Save to JSON file
    const outputPath = join(process.cwd(), 'public', 'ais-stats-daily.json');
    writeFileSync(outputPath, JSON.stringify(stats, null, 2));

    const duration = Date.now() - startTime;
    console.log(`✅ Daily AIS stats computed in ${duration}ms`);
    console.log(`📊 Stats: ${totalPositions.toLocaleString()} positions, ${uniqueVessels.toLocaleString()} vessels`);
    console.log(`💾 Saved to: ${outputPath}`);

    return stats;
  } catch (error) {
    console.error('❌ Failed to compute daily stats:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  computeDailyStats()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { computeDailyStats };
