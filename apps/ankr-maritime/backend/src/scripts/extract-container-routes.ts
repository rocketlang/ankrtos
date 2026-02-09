#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Extract Container Ship Routes
 *
 * Focus: Bay of Bengal, major shipping lanes
 * Container ships: Longer routes, higher speeds, major ports
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

// Major container shipping regions
const TARGET_REGIONS = {
  bayOfBengal: {
    minLat: 5,
    maxLat: 23,
    minLng: 80,
    maxLng: 100,
  },
  arabianSea: {
    minLat: 10,
    maxLat: 25,
    minLng: 60,
    maxLng: 80,
  },
  southChinaSea: {
    minLat: 0,
    maxLat: 25,
    minLng: 100,
    maxLng: 120,
  },
};

async function main() {
  console.log('🚢 Mari8XOSRM - Container Ship Route Extraction\n');
  console.log('Target: International shipping lanes, major ports\n');

  // Step 1: Find container ships in target regions
  console.log('📊 Finding container ships...\n');

  const containerVessels = await prisma.vessel.findMany({
    where: {
      OR: [
        { type: 'container' },
        { type: 'container_ship' },
        { type: 'cargo' },
        { name: { contains: 'CONTAINER', mode: 'insensitive' } },
        { name: { contains: 'MAERSK', mode: 'insensitive' } },
        { name: { contains: 'MSC', mode: 'insensitive' } },
        { name: { contains: 'CMA CGM', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      type: true,
      imo: true,
    },
    take: 50, // Start with 50 container ships
  });

  console.log(`Found ${containerVessels.length} container vessels\n`);

  if (containerVessels.length === 0) {
    console.log('❌ No container vessels found. Try broader search.');
    process.exit(1);
  }

  // Show sample
  console.log('Sample vessels:');
  containerVessels.slice(0, 10).forEach(v => {
    console.log(`  - ${v.name} (${v.type})`);
  });
  console.log();

  let totalRoutes = 0;
  const vesselIds = containerVessels.map(v => v.id);

  // Step 2: Extract routes from container ships
  for (const vessel of containerVessels) {
    console.log(`\n📍 Processing ${vessel.name}...`);

    // Get positions (focus on moving vessels)
    const positions = await prisma.vesselPosition.findMany({
      where: {
        vesselId: vessel.id,
        speed: { gt: 5 }, // Container ships typically move at 10-25 knots
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

    if (positions.length < 100) {
      console.log(`  Skipping - insufficient data`);
      continue;
    }

    // Split into voyage segments (longer gaps allowed for international shipping)
    const segments = splitIntoSegments(positions, 6); // 6-hour max gap
    console.log(`  Identified ${segments.length} voyage segments`);

    let segmentNum = 0;
    for (const segment of segments) {
      if (segment.length < 50) continue; // Need substantial data

      segmentNum++;
      const start = segment[0];
      const end = segment[segment.length - 1];

      const distance = calculateDistance(segment);
      const durationHours = (end.timestamp.getTime() - start.timestamp.getTime()) / (1000 * 60 * 60);
      const avgSpeed = durationHours > 0 ? distance / durationHours : 0;

      // Filter unrealistic routes
      if (distance < 50 || avgSpeed < 5 || avgSpeed > 35) {
        console.log(`    Segment ${segmentNum}: ${distance.toFixed(1)}nm @ ${avgSpeed.toFixed(1)} kts - unrealistic`);
        continue;
      }

      // Find nearest major ports (wider radius for container terminals)
      const originPort = await findNearestPort(start.latitude, start.longitude);
      const destPort = await findNearestPort(end.latitude, end.longitude);

      if (!originPort || !destPort) {
        console.log(`    Segment ${segmentNum}: ${distance.toFixed(1)}nm @ ${avgSpeed.toFixed(1)} kts - no ports nearby`);
        continue;
      }

      if (originPort.id === destPort.id) {
        console.log(`    Segment ${segmentNum}: circular route - skipping`);
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

      // Reject extreme outliers (container ships follow shipping lanes)
      if (distanceFactor > 2.5) {
        console.log(`    Segment ${segmentNum}: ${distanceFactor.toFixed(2)}x GC - too indirect`);
        continue;
      }

      // Quality scoring for container routes
      const coverageScore = Math.min(segment.length / 200, 1); // Expect ~200+ positions for long routes
      const speedScore = (avgSpeed >= 10 && avgSpeed <= 25) ? 1 : 0.7; // Container ships: 10-25 kts
      const directnessScore = distanceFactor < 1.3 ? 1 : 0.8; // Prefer direct routes
      const qualityScore = (coverageScore + speedScore + directnessScore) / 3;

      console.log(`    ✓ Segment ${segmentNum}: ${originPort.name} → ${destPort.name}`);
      console.log(`       ${distance.toFixed(1)}nm (${distanceFactor.toFixed(2)}x GC) @ ${avgSpeed.toFixed(1)} kts`);
      console.log(`       Quality: ${qualityScore.toFixed(2)}, ${segment.length} positions`);

      // Save route
      try {
        await prisma.extractedAISRoute.create({
          data: {
            vesselId: vessel.id,
            vesselType: 'container',
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
            coveragePercent: (segment.length / (durationHours * 12)) * 100,
            totalPositions: segment.length,
            routeType: distanceFactor < 1.15 ? 'DIRECT' : distanceFactor < 1.3 ? 'SHIPPING_LANE' : 'COASTAL',
            viaPoints: [],
            positionsData: simplifyPositions(segment, 100), // More waypoints for long routes
          },
        });
        totalRoutes++;
      } catch (error: any) {
        console.log(`       Error saving: ${error.message}`);
      }
    }
  }

  console.log(`\n\n✅ Container route extraction complete!`);
  console.log(`\n📊 Results:`);
  console.log(`   Total routes extracted: ${totalRoutes}`);
  console.log(`   Vessels processed: ${containerVessels.length}`);

  if (totalRoutes > 0) {
    // Statistics
    const stats = await prisma.extractedAISRoute.aggregate({
      where: { vesselType: 'container' },
      _avg: {
        distanceFactor: true,
        avgSpeedKnots: true,
        qualityScore: true,
        actualSailedNm: true,
      },
      _count: true,
    });

    console.log(`\n📈 Container Ship Metrics:`);
    console.log(`   Avg distance factor: ${stats._avg.distanceFactor?.toFixed(3)}`);
    console.log(`   Avg speed: ${stats._avg.avgSpeedKnots?.toFixed(1)} kts`);
    console.log(`   Avg quality: ${stats._avg.qualityScore?.toFixed(3)}`);
    console.log(`   Avg route length: ${stats._avg.actualSailedNm?.toFixed(0)} nm`);

    // Show top routes
    const topRoutes = await prisma.extractedAISRoute.findMany({
      where: { vesselType: 'container' },
      orderBy: { qualityScore: 'desc' },
      take: 10,
      select: {
        id: true,
        originPortId: true,
        destPortId: true,
        actualSailedNm: true,
        avgSpeedKnots: true,
        qualityScore: true,
      },
    });

    console.log(`\n🔝 Top ${topRoutes.length} Routes by Quality:`);
    for (const route of topRoutes) {
      const origin = await prisma.port.findUnique({ where: { id: route.originPortId }, select: { name: true } });
      const dest = await prisma.port.findUnique({ where: { id: route.destPortId }, select: { name: true } });

      console.log(`   ${origin?.name} → ${dest?.name}: ${route.actualSailedNm.toFixed(0)}nm @ ${route.avgSpeedKnots.toFixed(1)}kts (Q: ${route.qualityScore.toFixed(2)})`);
    }

    console.log(`\n🎯 Next Steps:`);
    console.log(`   1. Run export-osrm-ferry-routes.ts (update to include container routes)`);
    console.log(`   2. Rebuild OSRM graph with expanded coverage`);
    console.log(`   3. Container ships will add international shipping lanes`);
    console.log(`   4. Expected: 50-200 new routes, major ports connected\n`);
  }

  await prisma.$disconnect();
}

// Helper functions (same as ferry extraction)

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
      if (currentSegment.length >= 20) {
        segments.push([...currentSegment]);
      }
      currentSegment = [positions[i]];
    } else {
      currentSegment.push(positions[i]);
    }
  }

  if (currentSegment.length >= 20) {
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
  const R = 3440.065; // Nautical miles
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
  let minDistance = 150; // 150nm threshold (wider for container ports)

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
