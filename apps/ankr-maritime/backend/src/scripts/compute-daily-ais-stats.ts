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
import { getPrisma } from '../lib/db.js';


// Create Prisma client with connection pooling limits
// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

async function computeDailyStats() {
  console.log('🔄 Computing daily AIS stats...');
  const startTime = Date.now();

  try {
    // 1. Approximate total positions (use actual count for last 90 days)
    console.log('  📊 Step 1/5: Counting positions...');
    const totalPositionsQuery = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count
      FROM vessel_positions
      WHERE timestamp >= NOW() - INTERVAL '90 days'
    `;
    const totalPositions = Number(totalPositionsQuery[0]?.count || 0);
    console.log(`     ✓ Found ${totalPositions.toLocaleString()} positions (last 90 days)`);

    console.log('  📊 Step 2/5: Counting vessels...');
    const totalVesselsQuery = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int as count
      FROM vessels
    `;
    const uniqueVessels = totalVesselsQuery[0]?.count || 0;
    console.log(`     ✓ Found ${uniqueVessels.toLocaleString()} vessels`);

    // 2. Time coverage (optimized with index)
    console.log('  📊 Step 3/5: Analyzing time range...');
    const dateRange = await prisma.$queryRaw<Array<{ earliest: Date; latest: Date }>>`
      SELECT
        MIN(timestamp) as earliest,
        MAX(timestamp) as latest
      FROM vessel_positions
      WHERE timestamp >= NOW() - INTERVAL '90 days'
    `;

    const earliest = dateRange[0]?.earliest || new Date();
    const latest = dateRange[0]?.latest || new Date();
    const durationMs = new Date(latest).getTime() - new Date(earliest).getTime();
    const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    console.log(`     ✓ Data spans ${durationDays} days`);

    // 3. Current stats from last 24 hours (optimized with materialized subquery)
    console.log('  📊 Step 4/5: Computing current vessel stats...');
    // Use a single query with CTE for better performance
    const currentStats = await prisma.$queryRaw<Array<{
      ships_moving: number;
      ships_on_equator: number;
      ships_at_suez: number;
    }>>`
      WITH latest_positions AS (
        SELECT DISTINCT ON ("vesselId")
          "vesselId",
          speed,
          latitude,
          longitude
        FROM vessel_positions
        WHERE timestamp >= NOW() - INTERVAL '1 day'
        ORDER BY "vesselId", timestamp DESC
      )
      SELECT
        COUNT(*) FILTER (WHERE speed > 0.5)::int as ships_moving,
        COUNT(*) FILTER (WHERE latitude BETWEEN -0.033 AND 0.033)::int as ships_on_equator,
        COUNT(*) FILTER (WHERE latitude BETWEEN 29.8 AND 31.2 AND longitude BETWEEN 32.0 AND 32.6)::int as ships_at_suez
      FROM latest_positions
    `;

    const shipsMoving = [{ count: currentStats[0]?.ships_moving || 0 }];
    const shipsOnEquator = [{ count: currentStats[0]?.ships_on_equator || 0 }];
    const shipsAtSuez = [{ count: currentStats[0]?.ships_at_suez || 0 }];
    console.log(`     ✓ Moving: ${shipsMoving[0].count}, Equator: ${shipsOnEquator[0].count}, Suez: ${shipsAtSuez[0].count}`);

    // 4. Last 7 days trend (optimized with date bucketing)
    console.log('  📊 Step 5/5: Computing trends and coverage...');
    const last7Days = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT
        DATE(timestamp)::text as date,
        COUNT(*)::int as count
      FROM vessel_positions
      WHERE timestamp >= NOW() - INTERVAL '7 days'
        AND timestamp < NOW()
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
      LIMIT 7
    `;

    // 5. Geographic coverage (last 7 days) - sample for performance
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
        AND timestamp < NOW()
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
    // Ensure clean disconnect
    try {
      await prisma.$disconnect();
      console.log('🔌 Database connection closed');
    } catch (disconnectError) {
      console.error('⚠️  Error disconnecting:', disconnectError);
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  computeDailyStats()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { computeDailyStats };
