#!/usr/bin/env tsx
/**
 * Export Complete OSRM Graph (All Vessel Types)
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚢 Exporting Full Maritime Graph\n');

  const routes = await prisma.extractedAISRoute.findMany({
    where: {
      qualityScore: { gte: 0.6 },
      distanceFactor: { gte: 1.0, lte: 10.0 },
    },
    orderBy: { qualityScore: 'desc' },
  });

  console.log(`✅ Found ${routes.length} routes (all vessel types)\n`);

  const portIds = new Set<string>();
  routes.forEach(r => {
    portIds.add(r.originPortId);
    portIds.add(r.destPortId);
  });

  const ports = await prisma.port.findMany({
    where: { id: { in: Array.from(portIds) } },
    select: { id: true, name: true, unlocode: true, latitude: true, longitude: true },
  });

  const nodes = ports
    .filter(p => p.latitude && p.longitude)
    .map(p => ({
      id: p.id,
      lat: p.latitude!,
      lon: p.longitude!,
      name: p.name,
      unlocode: p.unlocode,
    }));

  // Group by port pair
  const routeGroups = new Map<string, typeof routes>();
  routes.forEach(route => {
    const key = `${route.originPortId}→${route.destPortId}`;
    if (!routeGroups.has(key)) routeGroups.set(key, []);
    routeGroups.get(key)!.push(route);
  });

  const edges = [];

  for (const [_, groupRoutes] of routeGroups) {
    const observations = groupRoutes.length;
    const avgDistance = groupRoutes.reduce((sum, r) => sum + r.actualSailedNm, 0) / observations;
    const avgSpeed = groupRoutes.reduce((sum, r) => sum + r.avgSpeedKnots, 0) / observations;
    const avgDistanceFactor = groupRoutes.reduce((sum, r) => sum + r.distanceFactor, 0) / observations;
    const avgQuality = groupRoutes.reduce((sum, r) => sum + r.qualityScore, 0) / observations;
    const confidence = 1 - Math.exp(-observations / 5);

    const bestRoute = groupRoutes[0];
    const geometry: Array<[number, number]> = [];

    const origin = ports.find(p => p.id === bestRoute.originPortId);
    const dest = ports.find(p => p.id === bestRoute.destPortId);

    if (!origin || !dest || !origin.latitude || !dest.latitude) continue;

    geometry.push([origin.longitude!, origin.latitude!]);

    if (bestRoute.positionsData && Array.isArray(bestRoute.positionsData)) {
      const positions = bestRoute.positionsData as Array<{ lat: number; lon: number }>;
      positions.forEach(pos => geometry.push([pos.lon, pos.lat]));
    }

    geometry.push([dest.longitude!, dest.latitude!]);

    edges.push({
      source: bestRoute.originPortId,
      target: bestRoute.destPortId,
      distance: avgDistance * 1852,
      duration: (avgDistance / avgSpeed) * 3600,
      weight: avgDistance * (1 / avgQuality) * (1 / confidence),
      geometry: geometry,
      metadata: {
        observations,
        confidence,
        distanceFactor: avgDistanceFactor,
        vesselTypes: [...new Set(groupRoutes.map(r => r.vesselType))],
        avgSpeed,
      },
    });
  }

  const graph = {
    nodes,
    edges,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalRoutes: routes.length,
      vesselTypes: ['Ferry', 'Container Ship', 'General Cargo'],
      strategy: 'Hybrid: Creep build + Averaging',
    },
  };

  writeFileSync('/root/apps/ankr-maritime/backend/osrm-full-graph.json', JSON.stringify(graph, null, 2));

  console.log(`\n📊 Graph Statistics:`);
  console.log(`   Nodes: ${graph.nodes.length} ports`);
  console.log(`   Edges: ${graph.edges.length} unique routes`);
  console.log(`   Total observations: ${routes.length}`);
  console.log(`   Avg confidence: ${(edges.reduce((s, e) => s + e.metadata.confidence, 0) / edges.length * 100).toFixed(1)}%`);

  // Show vessel type breakdown
  const byType = routes.reduce((acc, r) => {
    acc[r.vesselType] = (acc[r.vesselType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`\n📦 Routes by Vessel Type:`);
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  console.log(`\n✅ Exported to: osrm-full-graph.json`);

  await prisma.$disconnect();
}

main().catch(console.error);
