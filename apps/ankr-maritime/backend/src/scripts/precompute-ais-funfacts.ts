/**
 * Pre-compute AIS Fun Facts
 * Runs once daily to compute expensive aggregations and store in JSON
 *
 * Usage: tsx src/scripts/precompute-ais-funfacts.ts
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

const CACHE_FILE = path.join('/tmp', 'ais-fun-facts-cache.json');

async function computeFunFacts() {
  console.log('🚀 Starting AIS Fun Facts pre-computation...');
  const startTime = Date.now();

  try {
    // Basic stats (fast)
    console.log('   📊 Computing basic stats...');
    const totalPositions = await prisma.vesselPosition.count();
    const totalVessels = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(DISTINCT "vesselId")::int as count
      FROM vessel_positions
    `;
    const vesselsCount = totalVessels[0]?.count || 0;

    const dataScale = {
      totalPositions,
      uniqueVessels: vesselsCount,
      avgPositionsPerShip: vesselsCount > 0 ? Math.floor(totalPositions / vesselsCount) : 0,
      trackingCapacity: `${Math.floor(totalPositions / 1000000)}+ million AIS messages processed`,
    };

    // Time coverage
    console.log('   📅 Computing time coverage...');
    const dateRange = await prisma.$queryRaw<Array<{ earliest: Date; latest: Date }>>`
      SELECT MIN(timestamp) as earliest, MAX(timestamp) as latest
      FROM vessel_positions
    `;
    const earliest = dateRange[0]?.earliest ? new Date(dateRange[0].earliest) : new Date();
    const latest = dateRange[0]?.latest ? new Date(dateRange[0].latest) : new Date();
    const durationMs = latest.getTime() - earliest.getTime();
    const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));

    const timeCoverage = {
      earliestDate: earliest.toISOString(),
      latestDate: latest.toISOString(),
      durationDays,
      durationHours,
      positionsPerHour: durationHours > 0 ? Math.floor(totalPositions / durationHours) : 0,
      positionsPerMinute: durationHours > 0 ? Math.floor(totalPositions / (durationHours * 60)) : 0,
    };

    // Speed records (top 5)
    console.log('   ⚡ Computing speed records...');
    const speedRecords = await prisma.$queryRaw<Array<{
      vesselId: string;
      vesselName: string;
      vesselType: string;
      maxSpeed: number;
      timestamp: Date;
    }>>`
      SELECT
        vp."vesselId",
        v.name as "vesselName",
        v.type as "vesselType",
        MAX(vp.speed)::float as "maxSpeed",
        MAX(vp.timestamp) as timestamp
      FROM vessel_positions vp
      INNER JOIN vessels v ON v.id = vp."vesselId"
      WHERE vp.speed IS NOT NULL AND vp.speed > 0
      GROUP BY vp."vesselId", v.name, v.type
      ORDER BY "maxSpeed" DESC
      LIMIT 5
    `;

    const topSpeedRecords = speedRecords.map((record) => ({
      vesselId: record.vesselId,
      vesselName: record.vesselName || 'Unknown',
      vesselType: record.vesselType || 'unknown',
      maxSpeed: record.maxSpeed,
      maxSpeedKmh: record.maxSpeed * 1.852,
      timestamp: record.timestamp.toISOString(),
    }));

    // Most active ships
    console.log('   📡 Computing most active ships...');
    const mostActive = await prisma.$queryRaw<Array<{
      vesselId: string;
      vesselName: string;
      vesselType: string;
      positions: number;
      days: number;
    }>>`
      SELECT
        vp."vesselId",
        v.name as "vesselName",
        v.type as "vesselType",
        COUNT(*)::int as positions,
        EXTRACT(EPOCH FROM (MAX(vp.timestamp) - MIN(vp.timestamp))) / 86400 as days
      FROM vessel_positions vp
      INNER JOIN vessels v ON v.id = vp."vesselId"
      GROUP BY vp."vesselId", v.name, v.type
      HAVING COUNT(*) > 100
      ORDER BY positions DESC
      LIMIT 5
    `;

    const mostActiveShips = mostActive.map((ship) => {
      const positionsPerDay = ship.days > 0 ? Math.floor(ship.positions / ship.days) : 0;
      const avgIntervalSeconds = ship.days > 0 ? Math.floor((ship.days * 86400) / ship.positions) : 0;

      return {
        vesselId: ship.vesselId,
        vesselName: ship.vesselName || 'Unknown',
        vesselType: ship.vesselType || 'unknown',
        totalPositions: ship.positions,
        activeDays: ship.days,
        positionsPerDay,
        updateFrequency: avgIntervalSeconds > 0 ? `Every ${avgIntervalSeconds} seconds` : 'Real-time',
      };
    });

    // Geographic coverage
    console.log('   🌍 Computing geographic coverage...');
    const geoCoverageData = await prisma.$queryRaw<Array<{
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
    `;
    const geo = geoCoverageData[0];
    const latSpan = geo ? geo.maxLat - geo.minLat : 0;
    const lonSpan = geo ? geo.maxLon - geo.minLon : 0;

    const geoCoverage = {
      minLatitude: geo?.minLat || 0,
      maxLatitude: geo?.maxLat || 0,
      minLongitude: geo?.minLon || 0,
      maxLongitude: geo?.maxLon || 0,
      latitudeSpan: latSpan,
      longitudeSpan: lonSpan,
      coveragePercent: geo ? (latSpan / 180) * 100 : 0,
      description: latSpan > 100 ? 'Tracking ships across all continents' : 'Regional maritime coverage',
    };

    // Last 7 days trend
    console.log('   📈 Computing trend data...');
    const last7Days = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT DATE(timestamp)::text as date, COUNT(*)::int as count
      FROM vessel_positions
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
      LIMIT 7
    `;

    // Mari8XOSRM Intelligence
    console.log('   🧠 Computing route intelligence...');
    let mari8xosrmIntelligence;
    try {
      const extractedRoutes = await prisma.extractedAISRoute.count();
      const avgFactor = await prisma.extractedAISRoute.aggregate({
        _avg: { distanceFactor: true },
      });
      const compressionRatio = totalPositions > 0 && extractedRoutes > 0 ? Math.floor(totalPositions / extractedRoutes) : 0;

      mari8xosrmIntelligence = {
        routesLearned: extractedRoutes,
        avgDistanceFactor: avgFactor._avg.distanceFactor || 0,
        compressionRatio,
        intelligenceExtracted: `From ${totalPositions.toLocaleString()} positions → ${extractedRoutes} smart routes`,
        insight: compressionRatio > 0
          ? `Mari8XOSRM compresses ${compressionRatio.toLocaleString()}:1 - ${extractedRoutes} routes capture maritime intelligence!`
          : 'Building maritime intelligence from AIS data...',
      };
    } catch (error) {
      console.warn('   ⚠️  Route intelligence table not available, using defaults');
      mari8xosrmIntelligence = {
        routesLearned: 0,
        avgDistanceFactor: 0,
        compressionRatio: 0,
        intelligenceExtracted: 'Route extraction not yet initialized',
        insight: 'Building maritime intelligence from AIS data...',
      };
    }

    // Real-time stats
    console.log('   📊 Computing real-time stats...');
    const shipsMoving = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(DISTINCT "vesselId")::int as count
      FROM (
        SELECT DISTINCT ON ("vesselId") "vesselId", speed
        FROM vessel_positions
        WHERE speed IS NOT NULL
        ORDER BY "vesselId", timestamp DESC
      ) latest
      WHERE speed > 0.5
    `;

    const shipsOnEquator = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(DISTINCT "vesselId")::int as count
      FROM (
        SELECT DISTINCT ON ("vesselId") "vesselId", latitude
        FROM vessel_positions
        ORDER BY "vesselId", timestamp DESC
      ) latest
      WHERE latitude BETWEEN -0.033 AND 0.033
    `;

    const shipsAtSuez = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(DISTINCT "vesselId")::int as count
      FROM (
        SELECT DISTINCT ON ("vesselId") "vesselId", latitude, longitude
        FROM vessel_positions
        ORDER BY "vesselId", timestamp DESC
      ) latest
      WHERE latitude BETWEEN 29.8 AND 31.2 AND longitude BETWEEN 32.0 AND 32.6
    `;

    const shipsAtCape = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(DISTINCT "vesselId")::int as count
      FROM (
        SELECT DISTINCT ON ("vesselId") "vesselId", latitude, longitude
        FROM vessel_positions
        ORDER BY "vesselId", timestamp DESC
      ) latest
      WHERE latitude BETWEEN -35.0 AND -33.8 AND longitude BETWEEN 18.0 AND 19.0
    `;

    const latSpanDegrees = geo ? geo.maxLat - geo.minLat : 0;
    const lonSpanDegrees = geo ? geo.maxLon - geo.minLon : 0;
    const avgLat = geo ? (geo.maxLat + geo.minLat) / 2 : 0;
    const milesPerDegreeLon = 69 * Math.cos(avgLat * Math.PI / 180);
    const coverageWidthMiles = lonSpanDegrees * milesPerDegreeLon;
    const coverageHeightMiles = latSpanDegrees * 69;
    const coverageSqMiles = Math.floor(coverageWidthMiles * coverageHeightMiles);

    const realTimeStats = {
      shipsMovingNow: shipsMoving[0]?.count || 0,
      shipsAtAnchor: vesselsCount - (shipsMoving[0]?.count || 0),
      shipsOnEquator: shipsOnEquator[0]?.count || 0,
      shipsAtSuez: shipsAtSuez[0]?.count || 0,
      shipsAtCapeOfGoodHope: shipsAtCape[0]?.count || 0,
      coverageSqMiles,
      coverageSqKm: Math.floor(coverageSqMiles * 2.59),
    };

    const result = {
      dataScale,
      timeCoverage,
      topSpeedRecords,
      mostActiveShips,
      geoCoverage,
      last7DaysTrend: last7Days,
      mari8xosrmIntelligence,
      nearestToNorthPole: null,
      nearestToSouthPole: null,
      realTimeStats,
      biggestTanker: null,
      biggestBulker: null,
      biggestContainer: null,
      fastestShipNow: null,
      fastestContainer: null,
      lastUpdated: new Date().toISOString(),
      _precomputedAt: new Date().toISOString(),
    };

    // Write to cache file
    fs.writeFileSync(CACHE_FILE, JSON.stringify(result, null, 2));

    const duration = Date.now() - startTime;
    console.log(`✅ AIS Fun Facts pre-computed in ${(duration / 1000).toFixed(2)}s`);
    console.log(`   💾 Cached to: ${CACHE_FILE}`);
    console.log(`   📊 Total positions: ${totalPositions.toLocaleString()}`);
    console.log(`   🚢 Unique vessels: ${vesselsCount.toLocaleString()}`);

    return result;
  } catch (error: any) {
    console.error('❌ Failed to pre-compute fun facts:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export { computeFunFacts, CACHE_FILE };

// Run if executed directly
computeFunFacts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
