#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Extract Ferry Routes for Training
 *
 * Focus on high-quality ferry data with realistic speeds and repeated routes
 */

import { PrismaClient } from '@prisma/client';
import { AISRouteExtractor } from '../services/routing/ais-route-extractor';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

// Ferries with good data (from previous analysis)
const GOOD_VESSELS = [
  'WSF TACOMA',
  'WSF CHIMACUM',
  'BOKNAFJORD',
  'BERGENSFJORD',
  'FLOROY',
  'VOLLSOY',
  'STAVANGERFJORD',
  'OMBO',
  'HIDLE',
  'STRANDWAY',
];

async function main() {
  console.log('🚢 Mari8XOSRM - Ferry Route Extraction\n');
  console.log('Extracting high-quality ferry routes for training...\n');

  const extractor = new AISRouteExtractor(prisma);

  // Find these vessels in database
  const vessels = await prisma.vessel.findMany({
    where: {
      name: { in: GOOD_VESSELS },
    },
    select: {
      id: true,
      name: true,
      type: true,
      imo: true,
    },
  });

  console.log(`Found ${vessels.length} ferry vessels:\n`);
  vessels.forEach(v => console.log(`  - ${v.name} (${v.imo})`));
  console.log();

  let totalRoutes = 0;

  for (const vessel of vessels) {
    console.log(`\n📍 Processing ${vessel.name}...`);

    // Get all positions for this vessel
    const positions = await prisma.vesselPosition.findMany({
      where: {
        vesselId: vessel.id,
        speed: { gt: 3 }, // Moving faster than 3 knots
      },
      orderBy: { timestamp: 'asc' },
      select: {
        timestamp: true,
        latitude: true,
        longitude: true,
        speed: true,
      },
    });

    console.log(`  Found ${positions.length} positions`);

    if (positions.length < 50) {
      console.log(`  Skipping - not enough data`);
      continue;
    }

    // Split into segments (2-hour max gap)
    const segments = splitIntoSegments(positions, 2);
    console.log(`  Identified ${segments.length} voyage segments`);

    let segmentNum = 0;
    for (const segment of segments) {
      if (segment.length < 20) continue; // Need at least 20 positions

      segmentNum++;
      const start = segment[0];
      const end = segment[segment.length - 1];

      const distance = calculateDistance(segment);
      const durationHours = (end.timestamp.getTime() - start.timestamp.getTime()) / (1000 * 60 * 60);
      const avgSpeed = durationHours > 0 ? distance / durationHours : 0;

      if (distance < 5 || avgSpeed < 3 || avgSpeed > 30) continue; // Filter unrealistic

      // Find nearest ports
      const originPort = await findNearestPort(start.latitude, start.longitude);
      const destPort = await findNearestPort(end.latitude, end.longitude);

      if (!originPort || !destPort) {
        console.log(`    Segment ${segmentNum}: ${distance.toFixed(1)}nm @ ${avgSpeed.toFixed(1)} kts - no ports nearby`);
        continue;
      }

      if (originPort.id === destPort.id) {
        console.log(`    Segment ${segmentNum}: ${distance.toFixed(1)}nm @ ${avgSpeed.toFixed(1)} kts - circular route`);
        continue;
      }

      // Calculate great circle distance
      const gcDistance = haversineDistance(
        originPort.latitude,
        originPort.longitude,
        destPort.latitude,
        destPort.longitude
      );
      const distanceFactor = distance / gcDistance;

      // Quality score (simple version)
      const coverageScore = Math.min(segment.length / 100, 1); // More positions = better
      const speedConsistencyScore = avgSpeed > 5 && avgSpeed < 20 ? 1 : 0.5; // Realistic ferry speeds
      const qualityScore = (coverageScore + speedConsistencyScore) / 2;

      console.log(`    ✓ Segment ${segmentNum}: ${originPort.name} → ${destPort.name}`);
      console.log(`       ${distance.toFixed(1)}nm (${distanceFactor.toFixed(2)}x GC) @ ${avgSpeed.toFixed(1)} kts`);
      console.log(`       Quality: ${qualityScore.toFixed(2)}, ${segment.length} positions`);

      // Save to database
      try {
        await prisma.extractedAISRoute.create({
          data: {
            vesselId: vessel.id,
            vesselType: vessel.type,
            originPortId: originPort.id,
            destPortId: destPort.id,
            departureTime: start.timestamp,
            arrivalTime: end.timestamp,
            greatCircleNm: gcDistance,
            actualSailedNm: distance,
            distanceFactor: distanceFactor,
            durationHours: durationHours,
            avgSpeedKnots: avgSpeed,
            qualityScore: qualityScore,
            coveragePercent: (segment.length / (durationHours * 12)) * 100, // Assuming ~12 positions/hour
            totalPositions: segment.length,
            routeType: distanceFactor < 1.15 ? 'DIRECT' : 'COASTAL',
            viaPoints: [],
            positionsData: simplifyPositions(segment, 50),
          },
        });
        totalRoutes++;
      } catch (error: any) {
        console.log(`       Error saving: ${error.message}`);
      }
    }
  }

  console.log(`\n\n✅ Extraction complete!`);
  console.log(`\n📊 Results:`);
  console.log(`   Total routes extracted: ${totalRoutes}`);
  console.log(`   Vessels processed: ${vessels.length}`);

  if (totalRoutes > 0) {
    // Show summary statistics
    const stats = await prisma.extractedAISRoute.aggregate({
      _avg: {
        distanceFactor: true,
        avgSpeedKnots: true,
        qualityScore: true,
        actualSailedNm: true,
      },
      _count: true,
    });

    console.log(`\n📈 Average Metrics:`);
    console.log(`   Distance factor: ${stats._avg.distanceFactor?.toFixed(3)} (${((stats._avg.distanceFactor || 1) - 1) * 100}% longer than GC)`);
    console.log(`   Average speed: ${stats._avg.avgSpeedKnots?.toFixed(1)} kts`);
    console.log(`   Quality score: ${stats._avg.qualityScore?.toFixed(3)}`);
    console.log(`   Average distance: ${stats._avg.actualSailedNm?.toFixed(0)} nm`);

    // Show route pairs using Prisma ORM
    const allRoutes = await prisma.extractedAISRoute.findMany({
      include: {
        originPort: { select: { name: true } },
        destPort: { select: { name: true } },
      },
    });

    const routePairMap = new Map<string, { count: number; totalDist: number }>();
    allRoutes.forEach(route => {
      const key = `${route.originPort.name} → ${route.destPort.name}`;
      const existing = routePairMap.get(key) || { count: 0, totalDist: 0 };
      routePairMap.set(key, {
        count: existing.count + 1,
        totalDist: existing.totalDist + route.actualSailedNm,
      });
    });

    console.log(`\n🔝 Top Route Pairs:`);
    Array.from(routePairMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .forEach(([route, stats]) => {
        const avgDist = stats.totalDist / stats.count;
        console.log(`   ${route}: ${stats.count} voyages, avg ${avgDist.toFixed(0)}nm`);
      });

    console.log(`\n🎯 Next Steps:`);
    console.log(`   1. These ferry routes are perfect for initial distance training`);
    console.log(`   2. Build maritime graph with these as edges`);
    console.log(`   3. Train distance prediction model on ${totalRoutes} routes`);
    console.log(`   4. Expand to larger vessels and longer routes as data accumulates\n`);
  }

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

async function findNearestPort(lat: number, lon: number) {
  // Fetch all ports (no limit)
  const ports = await prisma.port.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      name: true,
      country: true,
      latitude: true,
      longitude: true,
    },
  });

  let nearest = null;
  let minDistance = 100; // 100nm threshold (wider for ferries)

  for (const port of ports) {
    if (!port.latitude || !port.longitude) continue;

    const distance = haversineDistance(lat, lon, port.latitude, port.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...port, distance };
    }
  }

  return nearest;
}

function simplifyPositions(
  positions: Array<{ timestamp: Date; latitude: number; longitude: number }>,
  targetCount: number
): any {
  if (positions.length <= targetCount) {
    return positions.map(p => ({
      t: p.timestamp.toISOString(),
      lat: p.latitude,
      lon: p.longitude,
    }));
  }

  const step = Math.floor(positions.length / targetCount);
  const simplified = [];
  for (let i = 0; i < positions.length; i += step) {
    simplified.push({
      t: positions[i].timestamp.toISOString(),
      lat: positions[i].latitude,
      lon: positions[i].longitude,
    });
  }

  return simplified;
}

main().catch(console.error);
