#!/usr/bin/env tsx
/**
 * Simple Route Extraction from AIS Data
 * Fixed to match actual database schema
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VESSEL_TYPES = [
  { type: 'container', minTrips: 3, description: 'Container Ships' },
  { type: 'tanker', minTrips: 3, description: 'Oil/Chemical Tankers' },
  { type: 'bulk_carrier', minTrips: 3, description: 'Bulk Carriers' },
  { type: 'general_cargo', minTrips: 5, description: 'General Cargo' },
];

// Simple great circle distance calculation
function greatCircleDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
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

async function extractRoutesForVesselType(
  vesselType: string,
  minTrips: number,
  description: string
) {
  console.log(`\n🚢 Extracting routes for ${description}...`);

  try {
    // Find recent port-to-port movements
    const routes = await prisma.$queryRaw<
      Array<{
        vessel_id: string;
        origin_port_id: string;
        dest_port_id: string;
        origin_lat: number;
        origin_lon: number;
        dest_lat: number;
        dest_lon: number;
        departure_time: Date;
        arrival_time: Date;
        trip_count: bigint;
        avg_distance_nm: number;
      }>
    >`
      WITH port_visits AS (
        SELECT
          v.id as vessel_id,
          v.type as vessel_type,
          vp."vesselId",
          vp.timestamp,
          vp.latitude,
          vp.longitude,
          vp.speed,
          p.id as port_id,
          p.latitude as port_lat,
          p.longitude as port_lon
        FROM vessel_positions vp
        INNER JOIN vessels v ON vp."vesselId" = v.id
        INNER JOIN ports p ON ST_DWithin(
          ST_MakePoint(vp.longitude, vp.latitude)::geography,
          ST_MakePoint(p.longitude, p.latitude)::geography,
          5000  -- Within 5km of port
        )
        WHERE v.type = ${vesselType}
          AND vp.timestamp >= NOW() - INTERVAL '10 days'
          AND vp.speed < 2.0  -- Stopped/slow at port
      ),
      voyages AS (
        SELECT
          pv1.vessel_id,
          pv1.port_id as origin_port_id,
          pv2.port_id as dest_port_id,
          MIN(pv1.timestamp) as departure_time,
          MIN(pv2.timestamp) as arrival_time,
          AVG(pv1.port_lat) as origin_lat,
          AVG(pv1.port_lon) as origin_lon,
          AVG(pv2.port_lat) as dest_lat,
          AVG(pv2.port_lon) as dest_lon
        FROM port_visits pv1
        INNER JOIN port_visits pv2
          ON pv1.vessel_id = pv2.vessel_id
          AND pv2.timestamp > pv1.timestamp
          AND pv2.timestamp < pv1.timestamp + INTERVAL '5 days'
          AND pv1.port_id != pv2.port_id
        GROUP BY pv1.vessel_id, pv1.port_id, pv2.port_id
      )
      SELECT
        vessel_id,
        origin_port_id,
        dest_port_id,
        origin_lat,
        origin_lon,
        dest_lat,
        dest_lon,
        MIN(departure_time) as departure_time,
        MAX(arrival_time) as arrival_time,
        COUNT(*)::bigint as trip_count,
        AVG(
          ST_Distance(
            ST_MakePoint(origin_lon, origin_lat)::geography,
            ST_MakePoint(dest_lon, dest_lat)::geography
          ) / 1852.0
        ) as avg_distance_nm
      FROM voyages
      GROUP BY vessel_id, origin_port_id, dest_port_id, origin_lat, origin_lon, dest_lat, dest_lon
      HAVING COUNT(*) >= ${minTrips}
      LIMIT 50
    `;

    console.log(`   Found ${routes.length} potential routes`);

    let savedCount = 0;

    for (const route of routes) {
      // Check if route already exists
      const existing = await prisma.extractedAISRoute.findFirst({
        where: {
          vesselId: route.vessel_id,
          originPortId: route.origin_port_id,
          destPortId: route.dest_port_id,
        },
      });

      if (existing) {
        continue; // Skip duplicates
      }

      // Calculate distances
      const greatCircle = greatCircleDistance(
        route.origin_lat,
        route.origin_lon,
        route.dest_lat,
        route.dest_lon
      );
      const actualSailed = route.avg_distance_nm;
      const distanceFactor = actualSailed / greatCircle;

      // Calculate duration and speed
      const durationHours =
        (route.arrival_time.getTime() - route.departure_time.getTime()) / (1000 * 60 * 60);
      const avgSpeed = actualSailed / durationHours;

      // Quality score based on trip count and distance factor reasonableness
      const qualityScore = Math.min(
        (Number(route.trip_count) / 10) * 0.5 + // Confidence from repetition
          (distanceFactor >= 1.0 && distanceFactor <= 2.5 ? 0.5 : 0), // Reasonable routing
        1.0
      );

      // Save route
      await prisma.extractedAISRoute.create({
        data: {
          vesselId: route.vessel_id,
          vesselType: vesselType,
          originPortId: route.origin_port_id,
          destPortId: route.dest_port_id,
          departureTime: route.departure_time,
          arrivalTime: route.arrival_time,
          greatCircleNm: greatCircle,
          actualSailedNm: actualSailed,
          distanceFactor: distanceFactor,
          durationHours: durationHours,
          avgSpeedKnots: avgSpeed,
          qualityScore: qualityScore,
          coveragePercent: 80, // Estimated
          totalPositions: Number(route.trip_count) * 50, // Estimated
          routeType: 'DIRECT',
          viaPoints: [],
          positionsData: null,
        },
      });

      savedCount++;
    }

    console.log(`   ✅ Saved ${savedCount} new routes`);
    return savedCount;
  } catch (error) {
    console.error(`   ❌ Error:`, error);
    return 0;
  }
}

async function main() {
  console.log('🚀 Mari8x Route Extraction - Simplified');
  console.log('═'.repeat(80));

  const startTime = Date.now();
  let totalRoutes = 0;

  // Get baseline
  const routesBefore = await prisma.extractedAISRoute.count();
  console.log(`\n📊 Current routes: ${routesBefore}\n`);

  // Process each vessel type
  for (const config of VESSEL_TYPES) {
    const count = await extractRoutesForVesselType(
      config.type,
      config.minTrips,
      config.description
    );
    totalRoutes += count;
  }

  const routesAfter = await prisma.extractedAISRoute.count();
  const newRoutes = routesAfter - routesBefore;
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '═'.repeat(80));
  console.log(`\n✅ Extraction complete!`);
  console.log(`   Routes before: ${routesBefore}`);
  console.log(`   Routes after: ${routesAfter}`);
  console.log(`   New routes: ${newRoutes}`);
  console.log(`   Time: ${duration}s\n`);

  // Show summary
  console.log('📊 Routes by vessel type:');
  const summary = await prisma.extractedAISRoute.groupBy({
    by: ['vesselType'],
    _count: { id: true },
    _avg: { qualityScore: true, distanceFactor: true },
  });

  summary.forEach(item => {
    const config = VESSEL_TYPES.find(v => v.type === item.vesselType);
    console.log(
      `   ${(config?.description || item.vesselType).padEnd(20)} ` +
        `${item._count.id.toString().padStart(3)} routes | ` +
        `quality ${item._avg.qualityScore?.toFixed(2) || '0.00'} | ` +
        `factor ${item._avg.distanceFactor?.toFixed(2) || '0.00'}`
    );
  });

  console.log('\n');
}

main()
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
