#!/usr/bin/env tsx
/**
 * Extract Routes for ALL Vessel Types from AIS Data
 *
 * Uses 52.8M+ AIS positions to identify regular routes for:
 * - Container ships
 * - Tankers (oil, chemical, LNG)
 * - Bulk carriers
 * - Ferries
 * - General cargo
 * - Passenger ships
 * - Fishing vessels
 *
 * Run: npx tsx src/scripts/extract-all-vessel-routes.ts
 */

import { prisma } from '../lib/prisma.js';

const VESSEL_TYPES = [
  { type: 'container', minTrips: 3, description: 'Container Ships' },
  { type: 'tanker', minTrips: 3, description: 'Oil/Chemical Tankers' },
  { type: 'bulk_carrier', minTrips: 3, description: 'Bulk Carriers' },
  { type: 'general_cargo', minTrips: 5, description: 'General Cargo' },
  { type: 'passenger', minTrips: 10, description: 'Passenger Ships' },
  { type: 'ferry', minTrips: 20, description: 'Ferries (High Frequency)' },
  { type: 'fishing', minTrips: 5, description: 'Fishing Vessels' },
  { type: 'tug', minTrips: 10, description: 'Tugs & Service Vessels' },
];

interface RouteData {
  vesselType: string;
  originPortId: string;
  originPortName: string;
  destinationPortId: string;
  destinationPortName: string;
  tripCount: number;
  avgDurationHours: number;
  avgDistanceNm: number;
  waypoints: Array<{ lat: number; lng: number }>;
}

async function extractRoutesForVesselType(vesselType: string, minTrips: number, description: string) {
  console.log(`\n🚢 Extracting routes for ${description}...`);

  try {
    // Find voyages for this vessel type
    const voyages = await prisma.$queryRaw<Array<{
      vessel_id: string;
      vessel_name: string;
      origin_port_id: string;
      origin_port_name: string;
      dest_port_id: string;
      dest_port_name: string;
      trip_count: bigint;
      avg_duration_hours: number;
      avg_distance_nm: number;
    }>>`
      WITH vessel_voyages AS (
        SELECT
          v.id as vessel_id,
          v.name as vessel_name,
          v.type as vessel_type,
          vp1.timestamp as departure_time,
          vp2.timestamp as arrival_time,
          p1.id as origin_port_id,
          p1.name as origin_port_name,
          p2.id as dest_port_id,
          p2.name as dest_port_name,
          ST_Distance(
            ST_MakePoint(vp1.longitude, vp1.latitude)::geography,
            ST_MakePoint(vp2.longitude, vp2.latitude)::geography
          ) / 1852.0 as distance_nm,
          EXTRACT(EPOCH FROM (vp2.timestamp - vp1.timestamp)) / 3600.0 as duration_hours
        FROM vessels v
        INNER JOIN vessel_positions vp1 ON v.id = vp1."vesselId"
        INNER JOIN vessel_positions vp2 ON v.id = vp2."vesselId"
        INNER JOIN ports p1 ON ST_DWithin(
          ST_MakePoint(vp1.longitude, vp1.latitude)::geography,
          ST_MakePoint(p1.longitude, p1.latitude)::geography,
          10000
        )
        INNER JOIN ports p2 ON ST_DWithin(
          ST_MakePoint(vp2.longitude, vp2.latitude)::geography,
          ST_MakePoint(p2.longitude, p2.latitude)::geography,
          10000
        )
        WHERE v.type = ${vesselType}
          AND vp1.timestamp > NOW() - INTERVAL '14 days'
          AND vp2.timestamp > vp1.timestamp
          AND vp2.timestamp < vp1.timestamp + INTERVAL '7 days'
          AND p1.id != p2.id
          AND vp1.speed < 1.0  -- At port (anchored/stopped)
          AND vp2.speed < 1.0
      )
      SELECT
        origin_port_id,
        origin_port_name,
        dest_port_id,
        dest_port_name,
        COUNT(*)::bigint as trip_count,
        AVG(duration_hours)::float as avg_duration_hours,
        AVG(distance_nm)::float as avg_distance_nm,
        MIN(vessel_id) as vessel_id,
        MIN(vessel_name) as vessel_name
      FROM vessel_voyages
      GROUP BY origin_port_id, origin_port_name, dest_port_id, dest_port_name
      HAVING COUNT(*) >= ${minTrips}
      ORDER BY trip_count DESC
      LIMIT 100
    `;

    console.log(`   Found ${voyages.length} routes with ${minTrips}+ trips`);

    let savedCount = 0;

    for (const voyage of voyages) {
      // Get waypoints (sample positions along the route)
      const waypoints = await prisma.$queryRaw<Array<{ lat: number; lng: number }>>`
        WITH route_positions AS (
          SELECT DISTINCT
            vp.latitude as lat,
            vp.longitude as lng,
            vp.timestamp
          FROM vessel_positions vp
          INNER JOIN vessels v ON vp."vesselId" = v.id
          WHERE v.type = ${vesselType}
            AND vp.timestamp > NOW() - INTERVAL '14 days'
            AND ST_DWithin(
              ST_MakePoint(vp.longitude, vp.latitude)::geography,
              ST_MakeLine(
                ST_MakePoint(
                  (SELECT longitude FROM ports WHERE id = ${voyage.origin_port_id}),
                  (SELECT latitude FROM ports WHERE id = ${voyage.origin_port_id})
                ),
                ST_MakePoint(
                  (SELECT longitude FROM ports WHERE id = ${voyage.dest_port_id}),
                  (SELECT latitude FROM ports WHERE id = ${voyage.dest_port_id})
                )
              )::geography,
              50000  -- 50km corridor
            )
          ORDER BY vp.timestamp
          LIMIT 20
        )
        SELECT lat, lng FROM route_positions
      `;

      if (waypoints.length < 2) continue;

      // Save to extractedAISRoute table
      await prisma.extractedAISRoute.create({
        data: {
          routeType: vesselType,
          originPortId: voyage.origin_port_id,
          originName: voyage.origin_port_name,
          destinationPortId: voyage.dest_port_id,
          destinationName: voyage.dest_port_name,
          waypoints: waypoints.map(w => ({ lat: w.lat, lng: w.lng })),
          tripCount: Number(voyage.trip_count),
          avgDurationHours: voyage.avg_duration_hours,
          avgDistanceNm: voyage.avg_distance_nm,
          distanceFactor: voyage.avg_distance_nm > 0
            ? (waypoints.length * 10) / voyage.avg_distance_nm
            : 1.0,
          confidence: Math.min(Number(voyage.trip_count) / 10, 1.0),
          metadata: {
            vesselType,
            sampleVesselId: voyage.vessel_id,
            sampleVesselName: voyage.vessel_name,
            extractedAt: new Date().toISOString(),
          },
        },
      });

      savedCount++;
    }

    console.log(`   ✅ Saved ${savedCount} routes for ${description}`);
    return savedCount;

  } catch (error) {
    console.error(`   ❌ Error extracting routes for ${description}:`, error);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting comprehensive route extraction from 52.8M+ AIS positions...\n');
  console.log('═'.repeat(80));

  const startTime = Date.now();
  let totalRoutes = 0;

  // Process each vessel type
  for (const vesselConfig of VESSEL_TYPES) {
    const count = await extractRoutesForVesselType(
      vesselConfig.type,
      vesselConfig.minTrips,
      vesselConfig.description
    );
    totalRoutes += count;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '═'.repeat(80));
  console.log(`\n✅ Route extraction complete!`);
  console.log(`   📊 Total routes extracted: ${totalRoutes}`);
  console.log(`   ⏱️  Time taken: ${duration}s`);
  console.log(`   💾 Data saved to: extractedAISRoute table\n`);

  // Show summary by vessel type
  console.log('📈 Routes by Vessel Type:');
  console.log('─'.repeat(80));

  const summary = await prisma.extractedAISRoute.groupBy({
    by: ['routeType'],
    _count: { id: true },
    _avg: { tripCount: true, avgDistanceNm: true },
  });

  summary.forEach(item => {
    const vesselConfig = VESSEL_TYPES.find(v => v.type === item.routeType);
    const avgTrips = item._avg.tripCount?.toFixed(1) || '0';
    const avgDistance = item._avg.avgDistanceNm?.toFixed(0) || '0';

    console.log(
      `${(vesselConfig?.description || item.routeType).padEnd(25)} ` +
      `${item._count.id.toString().padStart(4)} routes | ` +
      `${avgTrips.padStart(5)} avg trips | ` +
      `${avgDistance.padStart(6)} nm avg distance`
    );
  });

  console.log('\n🎯 Next steps:');
  console.log('   1. Query routes via GraphQL: routesByType(vesselType: "container")');
  console.log('   2. Use for route planning and optimization');
  console.log('   3. Display on frontend maps\n');
}

main()
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
