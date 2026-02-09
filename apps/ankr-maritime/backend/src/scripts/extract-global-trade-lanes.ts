#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Extract Global Trade Lane Routes
 *
 * Target: Major worldwide shipping lanes
 * - Asia-Europe (Suez Canal)
 * - Transpacific (China-USA)
 * - Transatlantic (Europe-USA)
 * - Middle East oil routes
 * - Singapore-India corridor
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

// Major global chokepoints and regions
const GLOBAL_REGIONS = {
  suezCanalApproach: {
    name: 'Suez Canal',
    minLat: 29,
    maxLat: 31,
    minLng: 32,
    maxLng: 34,
  },
  panamaCanal: {
    name: 'Panama Canal',
    minLat: 8,
    maxLat: 10,
    minLng: -80,
    maxLng: -78,
  },
  straitOfMalacca: {
    name: 'Strait of Malacca',
    minLat: 1,
    maxLat: 6,
    minLng: 99,
    maxLng: 104,
  },
  straitOfHormuz: {
    name: 'Strait of Hormuz',
    minLat: 25,
    maxLat: 27,
    minLng: 55,
    maxLng: 58,
  },
  singaporeStrait: {
    name: 'Singapore Strait',
    minLat: 1,
    maxLat: 1.5,
    minLng: 103,
    maxLng: 104.5,
  },
  bayOfBengal: {
    name: 'Bay of Bengal',
    minLat: 5,
    maxLat: 23,
    minLng: 80,
    maxLng: 100,
  },
  arabianSea: {
    name: 'Arabian Sea',
    minLat: 10,
    maxLat: 25,
    minLng: 60,
    maxLng: 75,
  },
  southChinaSea: {
    name: 'South China Sea',
    minLat: 0,
    maxLat: 25,
    minLng: 105,
    maxLng: 120,
  },
};

async function main() {
  console.log('🌍 Mari8XOSRM - Global Trade Lane Extraction\n');
  console.log('Target: Major worldwide shipping routes\n');

  let totalRoutes = 0;

  // Step 1: Find vessels that have crossed major chokepoints
  console.log('📊 Finding vessels in major trade lanes...\n');

  for (const [regionKey, region] of Object.entries(GLOBAL_REGIONS)) {
    console.log(`\n🔍 Analyzing: ${region.name}`);
    console.log(`   Region: ${region.minLat}°-${region.maxLat}°N, ${region.minLng}°-${region.maxLng}°E`);

    // Find vessels that have positions in this region
    const vesselsInRegion = await prisma.vesselPosition.findMany({
      where: {
        latitude: { gte: region.minLat, lte: region.maxLat },
        longitude: { gte: region.minLng, lte: region.maxLng },
        speed: { gt: 5 },
      },
      select: {
        vesselId: true,
      },
      distinct: ['vesselId'],
      take: 100, // Limit per region
    });

    const vesselIds = vesselsInRegion.map(v => v.vesselId);
    console.log(`   Found ${vesselIds.length} vessels in this region`);

    if (vesselIds.length === 0) continue;

    // Get vessel details
    const vessels = await prisma.vessel.findMany({
      where: { id: { in: vesselIds } },
      select: { id: true, name: true, type: true },
    });

    // Process vessels in this region
    for (const vessel of vessels.slice(0, 20)) { // Process 20 per region
      console.log(`\n   📍 Processing ${vessel.name} (${region.name})...`);

      // Get all positions for this vessel
      const positions = await prisma.vesselPosition.findMany({
        where: {
          vesselId: vessel.id,
          speed: { gt: 5 },
        },
        orderBy: { timestamp: 'asc' },
        select: {
          timestamp: true,
          latitude: true,
          longitude: true,
          speed: true,
        },
        take: 5000, // Limit per vessel
      });

      if (positions.length < 50) {
        console.log(`      Insufficient data (${positions.length} positions)`);
        continue;
      }

      // Split into long-distance segments
      const segments = splitIntoSegments(positions, 12); // 12-hour max gap for ocean crossings

      let routeCount = 0;
      for (const segment of segments) {
        if (segment.length < 30) continue; // Lowered from 50

        const start = segment[0];
        const end = segment[segment.length - 1];

        const distance = calculateDistance(segment);
        const durationHours = (end.timestamp.getTime() - start.timestamp.getTime()) / (1000 * 60 * 60);
        const avgSpeed = durationHours > 0 ? distance / durationHours : 0;

        // Lowered threshold: 200nm+ (was 500nm+)
        if (distance < 200 || avgSpeed < 8 || avgSpeed > 30) continue;

        // Find ports (wider radius for major ports)
        const originPort = await findNearestPort(start.latitude, start.longitude, 200);
        const destPort = await findNearestPort(end.latitude, end.longitude, 200);

        if (!originPort || !destPort || originPort.id === destPort.id) continue;

        const gcDistance = haversineDistance(
          originPort.latitude,
          originPort.longitude,
          destPort.latitude,
          destPort.longitude
        );
        const distanceFactor = distance / gcDistance;

        // Accept realistic trade lane routes (slightly more indirect due to weather routing)
        if (distanceFactor > 1.5) continue;

        // Quality scoring
        const lengthScore = Math.min(distance / 1000, 1); // Favor longer routes
        const speedScore = (avgSpeed >= 12 && avgSpeed <= 25) ? 1 : 0.8;
        const directnessScore = distanceFactor < 1.2 ? 1 : 0.9;
        const qualityScore = (lengthScore + speedScore + directnessScore) / 3;

        // Detect route type based on geography
        let routeType = 'OCEAN';
        if (regionKey.includes('suez')) routeType = 'SUEZ_ROUTE';
        else if (regionKey.includes('panama')) routeType = 'PANAMA_ROUTE';
        else if (regionKey.includes('malacca')) routeType = 'MALACCA_ROUTE';
        else if (regionKey.includes('hormuz')) routeType = 'HORMUZ_ROUTE';

        console.log(`      ✓ ${originPort.name} (${originPort.country}) → ${destPort.name} (${destPort.country})`);
        console.log(`         ${distance.toFixed(0)}nm @ ${avgSpeed.toFixed(1)}kts | ${routeType}`);

        // Save route
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
              coveragePercent: (segment.length / (durationHours * 12)) * 100,
              totalPositions: segment.length,
              routeType: routeType,
              viaPoints: [region.name],
              positionsData: simplifyPositions(segment, 150),
            },
          });
          totalRoutes++;
          routeCount++;
        } catch (error: any) {
          // Route may already exist
        }
      }

      if (routeCount > 0) {
        console.log(`      ✅ Extracted ${routeCount} routes`);
      }
    }
  }

  console.log(`\n\n✅ Global trade lane extraction complete!`);
  console.log(`\n📊 Total new routes: ${totalRoutes}`);

  // Statistics
  const allRoutes = await prisma.extractedAISRoute.findMany({
    where: {
      actualSailedNm: { gte: 500 }, // Long-distance routes only
    },
    orderBy: { actualSailedNm: 'desc' },
    take: 20,
  });

  console.log(`\n🌍 Top 20 Longest Routes:`);
  for (const route of allRoutes) {
    const origin = await prisma.port.findUnique({ where: { id: route.originPortId }, select: { name: true, country: true } });
    const dest = await prisma.port.findUnique({ where: { id: route.destPortId }, select: { name: true, country: true } });

    console.log(`   ${origin?.name} (${origin?.country}) → ${dest?.name} (${dest?.country})`);
    console.log(`      ${route.actualSailedNm.toFixed(0)}nm @ ${route.avgSpeedKnots.toFixed(1)}kts | ${route.routeType}`);
  }

  console.log(`\n🎯 Coverage Analysis:`);
  const regionCounts = await prisma.extractedAISRoute.groupBy({
    by: ['routeType'],
    _count: true,
  });

  regionCounts.forEach(r => {
    console.log(`   ${r.routeType}: ${r._count} routes`);
  });

  await prisma.$disconnect();
}

// Helper functions
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
  const R = 3440.065;
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

async function findNearestPort(lat: number, lon: number, radiusNm: number = 150) {
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
  let minDistance = radiusNm;

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
