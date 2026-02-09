#!/usr/bin/env tsx
/**
 * AIS Fun Facts Extractor
 *
 * Extracts fascinating insights from 52M+ AIS position reports
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

async function main() {
  console.log('🌊 AIS Data: Global Maritime Fun Facts\n');
  console.log('═'.repeat(80));
  console.log('Analyzing 52+ million position reports...\n');

  // Fun Fact 1: Total Coverage
  console.log('📊 FUN FACT #1: The Data Scale\n');
  const totalPositions = await prisma.vesselPosition.count();
  const totalVessels = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(DISTINCT "vesselId")::int as count
    FROM vessel_positions
  `;

  const vesselsCount = totalVessels[0]?.count || 0;
  console.log(`   Total AIS Positions: ${totalPositions.toLocaleString()}`);
  console.log(`   Unique Vessels Tracked: ${vesselsCount.toLocaleString()}`);
  console.log(`   Average Positions per Ship: ${Math.floor(totalPositions / vesselsCount).toLocaleString()}`);
  console.log(`   💡 That's enough data to track a ship across the ocean ${Math.floor(totalPositions / 1000000)}+ times!\n`);

  // Fun Fact 2: Date Range
  console.log('📅 FUN FACT #2: Time Coverage\n');
  const dateRange = await prisma.$queryRaw<Array<{ earliest: Date; latest: Date }>>`
    SELECT
      MIN(timestamp) as earliest,
      MAX(timestamp) as latest
    FROM vessel_positions
  `;

  if (dateRange[0]) {
    const earliest = new Date(dateRange[0].earliest);
    const latest = new Date(dateRange[0].latest);
    const days = Math.floor((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60));

    console.log(`   Data Range: ${earliest.toISOString().split('T')[0]} to ${latest.toISOString().split('T')[0]}`);
    console.log(`   Duration: ${days} days (${hours} hours)`);
    console.log(`   Positions per Hour: ${Math.floor(totalPositions / hours).toLocaleString()}`);
    console.log(`   💡 We're tracking ${Math.floor(totalPositions / hours / 60)} ship movements per minute!\n`);
  }

  // Fun Fact 3: Speed Records
  console.log('⚡ FUN FACT #3: Speed Demons\n');
  const speedRecords = await prisma.$queryRaw<Array<{
    vesselId: string;
    maxSpeed: number;
    timestamp: Date;
  }>>`
    SELECT
      "vesselId",
      MAX(speed)::float as "maxSpeed",
      MAX(timestamp) as timestamp
    FROM vessel_positions
    WHERE speed IS NOT NULL
    GROUP BY "vesselId"
    ORDER BY "maxSpeed" DESC
    LIMIT 5
  `;

  for (const record of speedRecords) {
    const vessel = await prisma.vessel.findUnique({
      where: { id: record.vesselId },
      select: { name: true, type: true },
    });

    console.log(`   ${vessel?.name || 'Unknown'} (${vessel?.type || 'unknown'})`);
    console.log(`   Max Speed: ${record.maxSpeed.toFixed(1)} knots (${(record.maxSpeed * 1.852).toFixed(1)} km/h)`);
  }
  console.log(`   💡 The fastest ship is going ${speedRecords[0]?.maxSpeed.toFixed(0)} knots - that's highway speed!\n`);

  // Fun Fact 4: Most Active Ships
  console.log('🚢 FUN FACT #4: The Marathon Sailors\n');
  const mostActive = await prisma.$queryRaw<Array<{
    vesselId: string;
    positions: number;
    days: number;
  }>>`
    SELECT
      "vesselId",
      COUNT(*)::int as positions,
      EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / 86400 as days
    FROM vessel_positions
    GROUP BY "vesselId"
    HAVING COUNT(*) > 1000
    ORDER BY positions DESC
    LIMIT 5
  `;

  for (const ship of mostActive) {
    const vessel = await prisma.vessel.findUnique({
      where: { id: ship.vesselId },
      select: { name: true, type: true },
    });

    console.log(`   ${vessel?.name || 'Unknown'} (${vessel?.type || 'unknown'})`);
    console.log(`   Positions Reported: ${ship.positions.toLocaleString()}`);
    console.log(`   Over ${ship.days.toFixed(0)} days`);
    console.log(`   Avg: ${Math.floor(ship.positions / ship.days)} positions/day`);
    console.log();
  }
  console.log(`   💡 These ships report their position every few minutes - we can track them in real-time!\n`);

  // Fun Fact 5: Geographic Coverage
  console.log('🌍 FUN FACT #5: Global Coverage\n');
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
  `;

  if (geoCoverage[0]) {
    const { minLat, maxLat, minLon, maxLon } = geoCoverage[0];
    const latSpan = maxLat - minLat;
    const lonSpan = maxLon - minLon;

    console.log(`   Latitude Range: ${minLat.toFixed(2)}° to ${maxLat.toFixed(2)}° (${latSpan.toFixed(0)}°)`);
    console.log(`   Longitude Range: ${minLon.toFixed(2)}° to ${maxLon.toFixed(2)}° (${lonSpan.toFixed(0)}°)`);
    console.log(`   Coverage: ${((latSpan / 180) * 100).toFixed(0)}% of Earth's latitude`);
    console.log(`   💡 We're tracking ships across ${latSpan > 100 ? 'multiple continents' : 'a major region'}!\n`);
  }

  // Fun Fact 6: Movement Patterns
  console.log('🎯 FUN FACT #6: Moving vs Stationary\n');
  const movementStats = await prisma.$queryRaw<Array<{
    status: string;
    count: number;
    avgSpeed: number;
  }>>`
    SELECT
      CASE
        WHEN speed > 10 THEN 'Fast (>10 kts)'
        WHEN speed > 5 THEN 'Cruising (5-10 kts)'
        WHEN speed > 1 THEN 'Slow (1-5 kts)'
        ELSE 'Stopped (<1 kt)'
      END as status,
      COUNT(*)::int as count,
      AVG(speed)::float as "avgSpeed"
    FROM vessel_positions
    WHERE speed IS NOT NULL
    GROUP BY status
    ORDER BY count DESC
  `;

  movementStats.forEach(stat => {
    const percentage = ((stat.count / totalPositions) * 100).toFixed(1);
    console.log(`   ${stat.status}: ${stat.count.toLocaleString()} positions (${percentage}%)`);
    console.log(`      Avg Speed: ${stat.avgSpeed.toFixed(1)} knots`);
  });
  console.log(`   💡 ${((movementStats.find(s => s.status.includes('Fast'))?.count || 0) / totalPositions * 100).toFixed(0)}% of ships are moving fast - the ocean is busy!\n`);

  // Fun Fact 7: Vessel Types
  console.log('🏭 FUN FACT #7: Fleet Composition\n');
  const fleetTypes = await prisma.$queryRaw<Array<{
    type: string;
    count: number;
  }>>`
    SELECT
      v.type,
      COUNT(DISTINCT vp."vesselId")::int as count
    FROM vessel_positions vp
    JOIN vessels v ON v.id = vp."vesselId"
    GROUP BY v.type
    ORDER BY count DESC
    LIMIT 10
  `;

  fleetTypes.forEach(ft => {
    const percentage = ((ft.count / vesselsCount) * 100).toFixed(1);
    console.log(`   ${ft.type}: ${ft.count} ships (${percentage}%)`);
  });
  console.log(`   💡 ${fleetTypes[0]?.type} ships dominate our tracking with ${fleetTypes[0]?.count} vessels!\n`);

  // Fun Fact 8: Distance Traveled Estimate
  console.log('🛣️  FUN FACT #8: Total Distance Covered\n');
  const distanceSample = await prisma.$queryRaw<Array<{
    totalDistance: number;
  }>>`
    WITH vessel_distances AS (
      SELECT
        "vesselId",
        SUM(
          6371 * 2 * ASIN(
            SQRT(
              POW(SIN((LEAD(latitude) OVER (PARTITION BY "vesselId" ORDER BY timestamp) - latitude) * PI() / 360), 2) +
              COS(latitude * PI() / 180) * COS(LEAD(latitude) OVER (PARTITION BY "vesselId" ORDER BY timestamp) * PI() / 180) *
              POW(SIN((LEAD(longitude) OVER (PARTITION BY "vesselId" ORDER BY timestamp) - longitude) * PI() / 360), 2)
            )
          )
        ) * 0.539957 as distance_nm
      FROM vessel_positions
      WHERE "vesselId" IN (
        SELECT DISTINCT "vesselId"
        FROM vessel_positions
        LIMIT 10
      )
      GROUP BY "vesselId"
    )
    SELECT SUM(distance_nm)::float as "totalDistance"
    FROM vessel_distances
  `;

  if (distanceSample[0]?.totalDistance) {
    const avgDistancePerVessel = distanceSample[0].totalDistance / 10;
    const estimatedTotal = avgDistancePerVessel * vesselsCount;
    const timesAroundEarth = estimatedTotal / 21600; // Earth's circumference in nm

    console.log(`   Sample of 10 ships: ${distanceSample[0].totalDistance.toFixed(0)} nm`);
    console.log(`   Estimated Total (all ships): ${estimatedTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })} nm`);
    console.log(`   💡 That's enough distance to circle the Earth ${timesAroundEarth.toFixed(0)} times!\n`);
  }

  // Fun Fact 9: Data Resolution
  console.log('📡 FUN FACT #9: Tracking Precision\n');
  const avgInterval = await prisma.$queryRaw<Array<{
    avgSeconds: number;
  }>>`
    WITH intervals AS (
      SELECT
        EXTRACT(EPOCH FROM (
          LEAD(timestamp) OVER (PARTITION BY "vesselId" ORDER BY timestamp) - timestamp
        )) as seconds
      FROM vessel_positions
      LIMIT 100000
    )
    SELECT AVG(seconds)::float as "avgSeconds"
    FROM intervals
    WHERE seconds IS NOT NULL AND seconds < 3600
  `;

  if (avgInterval[0]?.avgSeconds) {
    const seconds = avgInterval[0].avgSeconds;
    console.log(`   Average Time Between Updates: ${seconds.toFixed(0)} seconds`);
    console.log(`   Updates per Hour: ${(3600 / seconds).toFixed(0)}`);
    console.log(`   Updates per Day: ${(86400 / seconds).toFixed(0)}`);
    console.log(`   💡 We get ${(3600 / seconds).toFixed(0)} position updates per hour - that's real-time tracking!\n`);
  }

  // Fun Fact 10: Mari8XOSRM Impact
  console.log('🚀 FUN FACT #10: Mari8XOSRM Intelligence\n');
  const extractedRoutes = await prisma.extractedAISRoute.count();
  const avgFactor = await prisma.extractedAISRoute.aggregate({
    _avg: { distanceFactor: true },
  });

  console.log(`   Routes Learned: ${extractedRoutes}`);
  console.log(`   Avg Distance Factor: ${avgFactor._avg.distanceFactor?.toFixed(2)}x`);
  console.log(`   Intelligence Extracted: From ${totalPositions.toLocaleString()} positions → ${extractedRoutes} smart routes`);
  console.log(`   Compression: ${Math.floor(totalPositions / extractedRoutes).toLocaleString()}:1 (${extractedRoutes} routes capture the essence of 52M positions!)`);
  console.log(`   💡 Mari8XOSRM turns big data into smart predictions!\n`);

  console.log('═'.repeat(80));
  console.log('\n🎯 These insights show the incredible value hidden in AIS data!');
  console.log('📊 With more analysis, we can predict congestion, optimize routes, and save millions in fuel costs.\n');

  await prisma.$disconnect();
}

main().catch(console.error);
