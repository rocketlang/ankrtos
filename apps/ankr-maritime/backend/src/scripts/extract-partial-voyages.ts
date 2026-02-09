#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Extract Partial Voyage Segments
 *
 * Since we only have 3-4 days of AIS data, this script extracts:
 * - Partial voyage segments (vessels in transit)
 * - Short routes (ferries, coastal vessels)
 * - Movement patterns between positions
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

async function main() {
  console.log('🚢 Mari8XOSRM - Partial Voyage Extraction\n');
  console.log('Extracting movement patterns from 3-4 day AIS window...\n');

  // Step 1: Find vessels that are actually moving (speed > 5 knots)
  console.log('🔍 Finding vessels in transit...\n');

  const movingVessels = await prisma.$queryRaw<Array<{
    vesselId: string;
    positions: number;
    avgSpeed: number;
    maxSpeed: number;
    minTime: Date;
    maxTime: Date;
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  }>>`
    SELECT
      "vesselId",
      COUNT(*)::int as positions,
      AVG(COALESCE(speed, 0))::float as "avgSpeed",
      MAX(COALESCE(speed, 0))::float as "maxSpeed",
      MIN(timestamp) as "minTime",
      MAX(timestamp) as "maxTime",
      MIN(latitude)::float as "minLat",
      MAX(latitude)::float as "maxLat",
      MIN(longitude)::float as "minLon",
      MAX(longitude)::float as "maxLon"
    FROM vessel_positions
    WHERE speed > 5  -- Only vessels moving faster than 5 knots
    GROUP BY "vesselId"
    HAVING COUNT(*) > 50  -- Need at least 50 positions
    AND MAX(COALESCE(speed, 0)) > 10  -- Max speed > 10 knots (actually sailing)
    ORDER BY COUNT(*) DESC
    LIMIT 20
  `;

  console.log(`Found ${movingVessels.length} vessels in transit\n`);

  if (movingVessels.length === 0) {
    console.log('❌ No moving vessels found in the dataset');
    console.log('\nLooks like all AIS data is from vessels at anchor/moored.');
    console.log('We need data from vessels that are actually sailing.\n');
    return;
  }

  console.log('Top moving vessels:');
  console.log('─'.repeat(120));

  const extractedSegments: Array<{
    vesselId: string;
    vesselName: string;
    vesselType: string;
    startTime: Date;
    endTime: Date;
    startLat: number;
    startLon: number;
    endLat: number;
    endLon: number;
    distanceNm: number;
    durationHours: number;
    avgSpeed: number;
    positions: number;
  }> = [];

  for (const vessel of movingVessels) {
    const vesselInfo = await prisma.vessel.findUnique({
      where: { id: vessel.vesselId },
      select: { name: true, type: true, imo: true },
    });

    const durationHours = (vessel.maxTime.getTime() - vessel.minTime.getTime()) / (1000 * 60 * 60);

    // Calculate approximate distance using bounding box
    const latDiff = Math.abs(vessel.maxLat - vessel.minLat);
    const lonDiff = Math.abs(vessel.maxLon - vessel.minLon);
    const approxDistanceNm = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 60; // Rough nautical miles

    console.log(`\n${vesselInfo?.name || 'Unknown'} (${vesselInfo?.type || 'unknown'})`);
    console.log(`  IMO: ${vesselInfo?.imo || 'N/A'}`);
    console.log(`  Positions: ${vessel.positions} over ${durationHours.toFixed(1)}h`);
    console.log(`  Avg speed: ${vessel.avgSpeed.toFixed(1)} kts, Max: ${vessel.maxSpeed.toFixed(1)} kts`);
    console.log(`  Movement: ~${approxDistanceNm.toFixed(0)}nm (${vessel.minLat.toFixed(2)},${vessel.minLon.toFixed(2)}) → (${vessel.maxLat.toFixed(2)},${vessel.maxLon.toFixed(2)})`);

    // Get detailed position track
    const positions = await prisma.vesselPosition.findMany({
      where: {
        vesselId: vessel.vesselId,
        speed: { gt: 5 },
      },
      orderBy: { timestamp: 'asc' },
      select: {
        timestamp: true,
        latitude: true,
        longitude: true,
        speed: true,
        heading: true,
        course: true,
        navigationStatus: true,
      },
    });

    if (positions.length < 10) continue;

    // Calculate actual sailed distance using haversine
    let totalDistanceNm = 0;
    for (let i = 1; i < positions.length; i++) {
      const dist = haversineDistance(
        positions[i - 1].latitude,
        positions[i - 1].longitude,
        positions[i].latitude,
        positions[i].longitude
      );
      totalDistanceNm += dist;
    }

    const startPos = positions[0];
    const endPos = positions[positions.length - 1];
    const segmentDuration = (endPos.timestamp.getTime() - startPos.timestamp.getTime()) / (1000 * 60 * 60);
    const avgSpeedActual = segmentDuration > 0 ? totalDistanceNm / segmentDuration : 0;

    console.log(`  Actual sailed: ${totalDistanceNm.toFixed(1)}nm @ ${avgSpeedActual.toFixed(1)} kts`);
    console.log(`  Time range: ${startPos.timestamp.toISOString()} → ${endPos.timestamp.toISOString()}`);

    // Check if this is near any ports
    const startPort = await findNearestPort(startPos.latitude, startPos.longitude);
    const endPort = await findNearestPort(endPos.latitude, endPos.longitude);

    if (startPort) {
      console.log(`  Start near: ${startPort.name} (${startPort.distance.toFixed(1)}nm away)`);
    }
    if (endPort) {
      console.log(`  End near: ${endPort.name} (${endPort.distance.toFixed(1)}nm away)`);
    }

    extractedSegments.push({
      vesselId: vessel.vesselId,
      vesselName: vesselInfo?.name || 'Unknown',
      vesselType: vesselInfo?.type || 'unknown',
      startTime: startPos.timestamp,
      endTime: endPos.timestamp,
      startLat: startPos.latitude,
      startLon: startPos.longitude,
      endLat: endPos.latitude,
      endLon: endPos.longitude,
      distanceNm: totalDistanceNm,
      durationHours: segmentDuration,
      avgSpeed: avgSpeedActual,
      positions: positions.length,
    });
  }

  console.log('\n\n📊 Extraction Summary:');
  console.log('─'.repeat(120));
  console.log(`\nExtracted ${extractedSegments.length} voyage segments`);

  if (extractedSegments.length > 0) {
    const totalDistance = extractedSegments.reduce((sum, s) => sum + s.distanceNm, 0);
    const totalDuration = extractedSegments.reduce((sum, s) => sum + s.durationHours, 0);
    const avgSpeed = totalDuration > 0 ? totalDistance / totalDuration : 0;

    console.log(`Total distance covered: ${totalDistance.toFixed(0)}nm`);
    console.log(`Total duration: ${totalDuration.toFixed(1)}h`);
    console.log(`Average speed: ${avgSpeed.toFixed(1)} kts`);
    console.log(`Average segment: ${(totalDistance / extractedSegments.length).toFixed(1)}nm over ${(totalDuration / extractedSegments.length).toFixed(1)}h`);

    // Show longest segment
    const longest = extractedSegments.sort((a, b) => b.distanceNm - a.distanceNm)[0];
    console.log(`\n🏆 Longest segment:`);
    console.log(`  ${longest.vesselName} (${longest.vesselType})`);
    console.log(`  ${longest.distanceNm.toFixed(1)}nm in ${longest.durationHours.toFixed(1)}h @ ${longest.avgSpeed.toFixed(1)} kts`);
    console.log(`  ${longest.positions} positions`);

    console.log('\n✅ Partial voyage extraction successful!\n');
    console.log('Next steps:');
    console.log('1. These segments can be used for initial distance training');
    console.log('2. As more data accumulates, we can extract longer routes');
    console.log('3. Consider ingesting historical voyage data for better training\n');
  } else {
    console.log('\n⚠️  No usable voyage segments found');
    console.log('The AIS data may only contain stationary vessels.\n');
  }

  await prisma.$disconnect();
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function findNearestPort(lat: number, lon: number) {
  // Find nearest port within 100nm
  const ports = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  }>>`
    SELECT id, name, country, latitude, longitude
    FROM ports
    WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL
    LIMIT 1000
  `;

  let nearest = null;
  let minDistance = 100; // 100nm threshold

  for (const port of ports) {
    const distance = haversineDistance(lat, lon, port.latitude, port.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...port, distance };
    }
  }

  return nearest;
}

main().catch(console.error);
