#!/usr/bin/env tsx
/**
 * Clean extracted route data - remove duplicates and invalid routes
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

async function main() {
  console.log('🧹 Cleaning extracted route data...\n');

  // Get all routes
  const routes = await prisma.extractedAISRoute.findMany({
    orderBy: [{ originPortId: 'asc' }, { destPortId: 'asc' }, { departureTime: 'asc' }],
  });

  console.log(`Total routes before cleaning: ${routes.length}`);

  // Find duplicates and invalid routes
  const toDelete: string[] = [];
  const seen = new Set<string>();

  for (const route of routes) {
    const key = `${route.originPortId}-${route.destPortId}-${route.departureTime.toISOString()}`;

    // Check for duplicates
    if (seen.has(key)) {
      toDelete.push(route.id);
      continue;
    }
    seen.has(key);

    // Check for invalid data (distance factor < 1.0 is impossible)
    if (route.distanceFactor < 1.0) {
      console.log(`  ❌ Invalid: ${route.id} has factor ${route.distanceFactor.toFixed(2)}x (< 1.0)`);
      toDelete.push(route.id);
      continue;
    }

    // Check for extreme outliers (> 3.5x for routes > 10nm)
    if (route.greatCircleNm > 10 && route.distanceFactor > 3.5) {
      console.log(`  ❌ Outlier: ${route.id} has factor ${route.distanceFactor.toFixed(2)}x (> 3.5)`);
      toDelete.push(route.id);
      continue;
    }

    // Check for quality issues
    if (route.qualityScore < 0.6) {
      console.log(`  ❌ Low quality: ${route.id} has quality ${route.qualityScore.toFixed(2)}`);
      toDelete.push(route.id);
      continue;
    }

    seen.add(key);
  }

  console.log(`\nFound ${toDelete.length} routes to delete:`);
  console.log(`  Duplicates + Invalid data: ${toDelete.length}`);

  // Delete bad routes
  if (toDelete.length > 0) {
    const result = await prisma.extractedAISRoute.deleteMany({
      where: { id: { in: toDelete } },
    });
    console.log(`\n✓ Deleted ${result.count} routes`);
  }

  // Show remaining routes
  const remaining = await prisma.extractedAISRoute.count();
  console.log(`\n✅ Clean dataset: ${remaining} high-quality routes\n`);

  await prisma.$disconnect();
}

main().catch(console.error);
