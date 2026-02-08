#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Export Ferry Routes to OSRM Format
 *
 * Converts extracted ferry routes into OSRM-compatible graph data
 * Strategy: Hybrid approach with creep build + averaging
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

interface OSRMNode {
  id: string;
  lat: number;
  lon: number;
  name: string;
  unlocode: string;
}

interface OSRMEdge {
  source: string;
  target: string;
  distance: number; // meters
  duration: number; // seconds
  weight: number; // cost factor
  geometry: Array<[number, number]>; // [lon, lat] pairs
  metadata: {
    observations: number;
    confidence: number;
    distanceFactor: number;
    vesselTypes: string[];
    avgSpeed: number;
  };
}

interface OSRMGraph {
  nodes: OSRMNode[];
  edges: OSRMEdge[];
  metadata: {
    generatedAt: string;
    totalRoutes: number;
    vesselType: string;
    strategy: string;
  };
}

async function main() {
  console.log('🗺️  Mari8XOSRM - Ferry Route Export\n');
  console.log('Strategy: Hybrid (Creep Build + Averaging)\n');

  // Step 1: Load all ferry routes with quality >= 0.6
  // Ferry vessels are classified as 'general_cargo' in AIS data
  const ferryVesselNames = ['WSF TACOMA', 'WSF CHIMACUM', 'BOKNAFJORD', 'BERGENSFJORD', 'FLOROY', 'VOLLSOY', 'STAVANGERFJORD', 'OMBO', 'HIDLE', 'STRANDWAY'];

  const ferryVessels = await prisma.vessel.findMany({
    where: { name: { in: ferryVesselNames } },
    select: { id: true },
  });

  const ferryVesselIds = ferryVessels.map(v => v.id);

  const routes = await prisma.extractedAISRoute.findMany({
    where: {
      vesselId: { in: ferryVesselIds },
      qualityScore: { gte: 0.6 },
      distanceFactor: { gte: 1.0, lte: 10.0 }, // Allow coastal routes up to 10x GC
    },
    orderBy: { qualityScore: 'desc' },
  });

  console.log(`📊 Found ${routes.length} ferry routes\n`);

  if (routes.length === 0) {
    console.log('❌ No ferry routes found. Run extract-ferry-routes.ts first.');
    process.exit(1);
  }

  // Step 2: Load ports (nodes)
  const portIds = new Set<string>();
  routes.forEach(r => {
    portIds.add(r.originPortId);
    portIds.add(r.destPortId);
  });

  const ports = await prisma.port.findMany({
    where: { id: { in: Array.from(portIds) } },
    select: {
      id: true,
      name: true,
      unlocode: true,
      latitude: true,
      longitude: true,
    },
  });

  console.log(`🏖️  Loaded ${ports.length} ports (nodes)\n`);

  // Step 3: Group routes by port pair for averaging
  const routeGroups = new Map<string, typeof routes>();
  routes.forEach(route => {
    const key = `${route.originPortId}→${route.destPortId}`;
    if (!routeGroups.has(key)) {
      routeGroups.set(key, []);
    }
    routeGroups.get(key)!.push(route);
  });

  console.log(`🔗 Grouped into ${routeGroups.size} unique port pairs\n`);

  // Step 4: Build OSRM nodes
  const osrmNodes: OSRMNode[] = ports
    .filter(p => p.latitude && p.longitude)
    .map(p => ({
      id: p.id,
      lat: p.latitude!,
      lon: p.longitude!,
      name: p.name,
      unlocode: p.unlocode,
    }));

  // Step 5: Build OSRM edges (averaging strategy)
  const osrmEdges: OSRMEdge[] = [];

  for (const [portPair, groupRoutes] of routeGroups) {
    const [originId, destId] = portPair.split('→');

    const originPort = ports.find(p => p.id === originId);
    const destPort = ports.find(p => p.id === destId);

    if (!originPort || !destPort || !originPort.latitude || !destPort.latitude) continue;

    // Averaging: Calculate consensus metrics
    const observations = groupRoutes.length;
    const avgDistance = groupRoutes.reduce((sum, r) => sum + r.actualSailedNm, 0) / observations;
    const avgSpeed = groupRoutes.reduce((sum, r) => sum + r.avgSpeedKnots, 0) / observations;
    const avgDistanceFactor = groupRoutes.reduce((sum, r) => sum + r.distanceFactor, 0) / observations;
    const avgQuality = groupRoutes.reduce((sum, r) => sum + r.qualityScore, 0) / observations;

    // Confidence increases with observations (exponential approach to 1.0)
    const confidence = 1 - Math.exp(-observations / 5); // 95% confidence at 15 observations

    // Duration calculation
    const durationHours = avgDistance / avgSpeed;
    const durationSeconds = durationHours * 3600;

    // Weight: Distance adjusted by quality and confidence
    // Lower confidence or quality = higher weight (less preferred route)
    const weight = avgDistance * (1 / avgQuality) * (1 / confidence);

    // Geometry: Extract waypoints from best quality route in group
    const bestRoute = groupRoutes.reduce((best, curr) =>
      curr.qualityScore > best.qualityScore ? curr : best
    );

    const geometry: Array<[number, number]> = [];

    // Start point
    geometry.push([originPort.longitude!, originPort.latitude!]);

    // Waypoints from positionsData if available
    if (bestRoute.positionsData && Array.isArray(bestRoute.positionsData)) {
      const positions = bestRoute.positionsData as Array<{ lat: number; lon: number }>;
      positions.forEach(pos => {
        geometry.push([pos.lon, pos.lat]);
      });
    }

    // End point
    geometry.push([destPort.longitude!, destPort.latitude!]);

    // Vessel types that have used this route
    const vesselTypes = [...new Set(groupRoutes.map(r => r.vesselType))];

    osrmEdges.push({
      source: originId,
      target: destId,
      distance: avgDistance * 1852, // Convert nm to meters
      duration: durationSeconds,
      weight: weight,
      geometry: geometry,
      metadata: {
        observations,
        confidence,
        distanceFactor: avgDistanceFactor,
        vesselTypes,
        avgSpeed,
      },
    });

    console.log(`  ✓ ${originPort.name} → ${destPort.name}`);
    console.log(`     ${avgDistance.toFixed(1)}nm, ${avgSpeed.toFixed(1)}kts, ${observations} obs, ${(confidence * 100).toFixed(0)}% conf`);
  }

  console.log(`\n✅ Built ${osrmEdges.length} OSRM edges\n`);

  // Step 6: Export OSRM graph
  const osrmGraph: OSRMGraph = {
    nodes: osrmNodes,
    edges: osrmEdges,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalRoutes: routes.length,
      vesselType: 'Ferry',
      strategy: 'Hybrid: Individual trajectories (creep build) + Consensus averaging',
    },
  };

  const outputPath = '/root/apps/ankr-maritime/backend/osrm-ferry-graph.json';
  writeFileSync(outputPath, JSON.stringify(osrmGraph, null, 2));

  console.log(`💾 Exported OSRM graph to: ${outputPath}\n`);

  // Step 7: Statistics
  console.log('📈 Graph Statistics:');
  console.log(`   Nodes: ${osrmNodes.length} ports`);
  console.log(`   Edges: ${osrmEdges.length} routes`);
  console.log(`   Avg edges per node: ${(osrmEdges.length / osrmNodes.length).toFixed(1)}`);

  const avgConfidence = osrmEdges.reduce((sum, e) => sum + e.metadata.confidence, 0) / osrmEdges.length;
  const highConfEdges = osrmEdges.filter(e => e.metadata.confidence > 0.8).length;

  console.log(`   Avg confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  console.log(`   High confidence (>80%): ${highConfEdges}/${osrmEdges.length}`);

  console.log('\n🎯 Next Steps:');
  console.log('   1. Install OSRM: docker pull osrm/osrm-backend');
  console.log('   2. Convert to .osm format: node osrm-json-to-osm.js');
  console.log('   3. Build OSRM graph: osrm-extract, osrm-partition, osrm-customize');
  console.log('   4. Start OSRM server: osrm-routed ferry-graph.osrm');
  console.log('   5. Query routes: GET /route/v1/driving/{lon,lat};{lon,lat}');

  await prisma.$disconnect();
}

main().catch(console.error);
