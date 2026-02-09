#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Build Composite Voyages from Multiple Ships
 *
 * Strategy: Use segments from multiple ships of the same type to build complete routes
 * Example: Tanker A does route segment 1, Tanker B does segment 2, etc.
 * Combined = complete voyage pattern for that route/vessel type
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

interface RouteSegment {
  vesselId: string;
  vesselType: string;
  vesselName: string;
  startTime: Date;
  endTime: Date;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  positions: Array<{
    timestamp: Date;
    latitude: number;
    longitude: number;
    speed: number | null;
  }>;
  distanceNm: number;
  durationHours: number;
  avgSpeed: number;
}

async function main() {
  console.log('🔧 Mari8XOSRM - Composite Voyage Builder\n');
  console.log('Building complete routes from multiple ships of same type...\n');

  // Step 1: Get all vessel types with moving ships
  const vesselTypes = await prisma.$queryRaw<Array<{ type: string; count: number }>>`
    SELECT v.type, COUNT(DISTINCT vp."vesselId")::int as count
    FROM vessel_positions vp
    JOIN vessels v ON v.id = vp."vesselId"
    WHERE vp.speed > 5
    GROUP BY v.type
    HAVING COUNT(DISTINCT vp."vesselId") > 1
    ORDER BY count DESC
  `;

  console.log('Vessel types with moving ships:');
  console.log('─'.repeat(80));
  vesselTypes.forEach(vt => {
    console.log(`  ${vt.type}: ${vt.count} ships`);
  });
  console.log();

  // Step 2: For each vessel type, extract all route segments
  const allSegments: Map<string, RouteSegment[]> = new Map();

  for (const vesselType of vesselTypes.slice(0, 5)) { // Top 5 vessel types
    console.log(`\n📍 Extracting segments for ${vesselType.type}...`);

    const vessels = await prisma.$queryRaw<Array<{ vesselId: string }>>`
      SELECT DISTINCT vp."vesselId"
      FROM vessel_positions vp
      JOIN vessels v ON v.id = vp."vesselId"
      WHERE v.type = ${vesselType.type}
      AND vp.speed > 5
    `;

    const segments: RouteSegment[] = [];

    for (const vessel of vessels) {
      const vesselInfo = await prisma.vessel.findUnique({
        where: { id: vessel.vesselId },
        select: { name: true, type: true },
      });

      // Get all positions for this vessel where it's moving
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
        },
      });

      if (positions.length < 10) continue;

      // Split into continuous segments (gap > 2 hours = new segment)
      const continuousSegments = splitIntoSegments(positions, 2);

      for (const segmentPositions of continuousSegments) {
        if (segmentPositions.length < 10) continue;

        const startPos = segmentPositions[0];
        const endPos = segmentPositions[segmentPositions.length - 1];

        const distanceNm = calculateDistance(segmentPositions);
        const durationHours = (endPos.timestamp.getTime() - startPos.timestamp.getTime()) / (1000 * 60 * 60);
        const avgSpeed = durationHours > 0 ? distanceNm / durationHours : 0;

        if (distanceNm < 5 || avgSpeed < 5) continue; // Skip very short or slow segments

        segments.push({
          vesselId: vessel.vesselId,
          vesselType: vesselType.type,
          vesselName: vesselInfo?.name || 'Unknown',
          startTime: startPos.timestamp,
          endTime: endPos.timestamp,
          startLat: startPos.latitude,
          startLon: startPos.longitude,
          endLat: endPos.latitude,
          endLon: endPos.longitude,
          positions: segmentPositions,
          distanceNm,
          durationHours,
          avgSpeed,
        });
      }
    }

    allSegments.set(vesselType.type, segments);
    console.log(`  Found ${segments.length} route segments from ${vessels.length} vessels`);

    if (segments.length > 0) {
      const totalDistance = segments.reduce((sum, s) => sum + s.distanceNm, 0);
      const avgSegmentDist = totalDistance / segments.length;
      console.log(`  Total distance: ${totalDistance.toFixed(0)}nm`);
      console.log(`  Avg segment: ${avgSegmentDist.toFixed(1)}nm`);
    }
  }

  // Step 3: Try to connect segments into complete routes
  console.log('\n\n🔗 Connecting segments into composite routes...\n');

  for (const [vesselType, segments] of allSegments.entries()) {
    if (segments.length < 2) continue;

    console.log(`\n${vesselType} (${segments.length} segments):`);
    console.log('─'.repeat(100));

    // Try to find segments that connect (end of one near start of another)
    const compositeRoutes = findConnectingSegments(segments);

    console.log(`  Found ${compositeRoutes.length} composite routes:`);
    for (let i = 0; i < Math.min(compositeRoutes.length, 5); i++) {
      const route = compositeRoutes[i];
      const totalDist = route.segments.reduce((sum, s) => sum + s.distanceNm, 0);
      const totalDuration = route.segments.reduce((sum, s) => sum + s.durationHours, 0);
      const avgSpeed = totalDuration > 0 ? totalDist / totalDuration : 0;

      console.log(`\n  Route ${i + 1}:`);
      console.log(`    ${route.segments.length} segments, ${totalDist.toFixed(0)}nm, ${totalDuration.toFixed(1)}h @ ${avgSpeed.toFixed(1)} kts`);
      console.log(`    Ships: ${route.segments.map(s => s.vesselName).join(' → ')}`);

      // Find nearest ports
      const startPort = await findNearestPort(
        route.segments[0].startLat,
        route.segments[0].startLon
      );
      const endPort = await findNearestPort(
        route.segments[route.segments.length - 1].endLat,
        route.segments[route.segments.length - 1].endLon
      );

      if (startPort) {
        console.log(`    From: ${startPort.name}, ${startPort.country} (${startPort.distance.toFixed(1)}nm)`);
      }
      if (endPort) {
        console.log(`    To: ${endPort.name}, ${endPort.country} (${endPort.distance.toFixed(1)}nm)`);
      }

      // Show segment details
      route.segments.forEach((seg, idx) => {
        console.log(`      ${idx + 1}. ${seg.vesselName}: ${seg.distanceNm.toFixed(1)}nm @ ${seg.avgSpeed.toFixed(1)} kts`);
      });
    }
  }

  console.log('\n\n✅ Composite voyage building complete!\n');
  console.log('💡 Insights:');
  console.log('  - By combining segments from multiple ships, we can build complete routes');
  console.log('  - Even with 3-4 days of data, we can extract useful route intelligence');
  console.log('  - This approach works well for high-traffic routes with many vessels\n');

  await prisma.$disconnect();
}

function splitIntoSegments(
  positions: Array<{ timestamp: Date; latitude: number; longitude: number; speed: number | null }>,
  maxGapHours: number
): Array<typeof positions> {
  const segments: Array<typeof positions> = [];
  let currentSegment: typeof positions = [];

  for (let i = 0; i < positions.length; i++) {
    if (currentSegment.length === 0) {
      currentSegment.push(positions[i]);
      continue;
    }

    const lastPos = currentSegment[currentSegment.length - 1];
    const gapHours = (positions[i].timestamp.getTime() - lastPos.timestamp.getTime()) / (1000 * 60 * 60);

    if (gapHours > maxGapHours) {
      // Gap too large, start new segment
      if (currentSegment.length >= 10) {
        segments.push([...currentSegment]);
      }
      currentSegment = [positions[i]];
    } else {
      currentSegment.push(positions[i]);
    }
  }

  if (currentSegment.length >= 10) {
    segments.push(currentSegment);
  }

  return segments;
}

function calculateDistance(positions: Array<{ latitude: number; longitude: number }>): number {
  let total = 0;
  for (let i = 1; i < positions.length; i++) {
    total += haversineDistance(
      positions[i - 1].latitude,
      positions[i - 1].longitude,
      positions[i].latitude,
      positions[i].longitude
    );
  }
  return total;
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

function findConnectingSegments(segments: RouteSegment[]): Array<{ segments: RouteSegment[] }> {
  const routes: Array<{ segments: RouteSegment[] }> = [];
  const maxConnectionDistanceNm = 50; // Max 50nm gap to consider segments connected

  // Try to chain segments together
  for (let i = 0; i < segments.length; i++) {
    const route = [segments[i]];
    let lastSegment = segments[i];

    // Try to find connecting segments
    for (let j = 0; j < segments.length; j++) {
      if (i === j) continue;

      const candidate = segments[j];

      // Check if this segment starts near where the last one ended
      const distance = haversineDistance(
        lastSegment.endLat,
        lastSegment.endLon,
        candidate.startLat,
        candidate.startLon
      );

      if (distance < maxConnectionDistanceNm) {
        // Check if it's chronologically possible (not too far apart in time)
        const timeDiff = Math.abs(candidate.startTime.getTime() - lastSegment.endTime.getTime()) / (1000 * 60 * 60);
        if (timeDiff < 72) { // Within 72 hours
          route.push(candidate);
          lastSegment = candidate;
        }
      }
    }

    if (route.length > 1) {
      routes.push({ segments: route });
    }
  }

  // Sort by total distance
  return routes.sort((a, b) => {
    const aDist = a.segments.reduce((sum, s) => sum + s.distanceNm, 0);
    const bDist = b.segments.reduce((sum, s) => sum + s.distanceNm, 0);
    return bDist - aDist;
  });
}

async function findNearestPort(lat: number, lon: number) {
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
  let minDistance = 100;

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
