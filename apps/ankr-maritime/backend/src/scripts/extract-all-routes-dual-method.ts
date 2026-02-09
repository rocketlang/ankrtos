#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Comprehensive Route Extraction (Dual Method)
 *
 * Uses BOTH proprietary approaches:
 * 1. AISRouteExtractor: Segment-based trajectory analysis with quality scoring
 * 2. IncrementalLearner: Pattern learning with confidence building
 *
 * Extracts routes for ALL vessel types from 52.8M+ AIS positions
 */

import { PrismaClient } from '@prisma/client';
import { AISRouteExtractor } from '../services/routing/ais-route-extractor';
import { IncrementalLearner } from '../services/routing/incremental-learner';
import { createChildLogger } from '../utils/logger';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();
const logger = createChildLogger({ module: 'dual-extraction' });

// Vessel types to process
const VESSEL_TYPES = [
  {
    type: 'container',
    minSpeed: 8,
    maxSpeed: 25,
    minTrips: 3,
    description: 'Container Ships',
  },
  {
    type: 'tanker',
    minSpeed: 6,
    maxSpeed: 18,
    minTrips: 3,
    description: 'Oil/Chemical Tankers',
  },
  {
    type: 'bulk_carrier',
    minSpeed: 7,
    maxSpeed: 16,
    minTrips: 3,
    description: 'Bulk Carriers',
  },
  {
    type: 'general_cargo',
    minSpeed: 6,
    maxSpeed: 18,
    minTrips: 5,
    description: 'General Cargo',
  },
  {
    type: 'passenger',
    minSpeed: 10,
    maxSpeed: 30,
    minTrips: 10,
    description: 'Passenger Ships',
  },
  {
    type: 'ferry',
    minSpeed: 8,
    maxSpeed: 25,
    minTrips: 20,
    description: 'Ferries',
  },
  {
    type: 'fishing',
    minSpeed: 3,
    maxSpeed: 12,
    minTrips: 5,
    description: 'Fishing Vessels',
  },
  {
    type: 'tug',
    minSpeed: 4,
    maxSpeed: 12,
    minTrips: 10,
    description: 'Tugs & Service Vessels',
  },
];

interface ExtractionStats {
  vesselType: string;
  method1Routes: number; // AISRouteExtractor
  method2Routes: number; // IncrementalLearner
  totalRoutes: number;
  avgConfidence: number;
  avgDistanceFactor: number;
  topRoute: string;
}

/**
 * METHOD 1: AISRouteExtractor (Trajectory Segmentation)
 * - Splits vessel tracks into segments
 * - Calculates quality scores and distance factors
 * - Direct route analysis from position data
 */
async function extractRoutesMethod1(
  vesselType: string,
  minSpeed: number,
  maxSpeed: number
): Promise<number> {
  logger.info(`  🔍 Method 1 (Trajectory Analysis) for ${vesselType}...`);

  const extractor = new AISRouteExtractor(prisma);
  let routesExtracted = 0;

  try {
    // Get vessels of this type with recent data
    const vessels = await prisma.vessel.findMany({
      where: {
        type: vesselType,
        positions: {
          some: {
            timestamp: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
            speed: { gte: minSpeed, lte: maxSpeed },
          },
        },
      },
      take: 50, // Top 50 active vessels per type
      select: {
        id: true,
        name: true,
        type: true,
        imo: true,
      },
    });

    logger.info(`     Found ${vessels.length} active vessels`);

    for (const vessel of vessels) {
      // Extract routes using AISRouteExtractor service
      const routes = await extractor.extractRoutesForVessel(vessel.id, {
        minPositions: 20,
        maxTimeGapHours: 3,
        minDistanceNm: 5,
        minSpeed,
        maxSpeed,
      });

      routesExtracted += routes;
    }

    return routesExtracted;
  } catch (error) {
    logger.error(`     ❌ Method 1 error: ${error}`);
    return 0;
  }
}

/**
 * METHOD 2: IncrementalLearner (Pattern Learning)
 * - Builds learning base from historical patterns
 * - Calculates confidence scores from repeated observations
 * - Identifies reliable route patterns across vessel fleet
 */
async function extractRoutesMethod2(
  vesselType: string,
  minTrips: number
): Promise<number> {
  logger.info(`  🧠 Method 2 (Pattern Learning) for ${vesselType}...`);

  try {
    const learner = new IncrementalLearner(prisma);

    // Build route learning base for this vessel type
    const learningMap = await learner.buildRouteLearningBase({
      vesselTypes: [vesselType],
      minObservations: minTrips,
      timeWindowDays: 14,
    });

    logger.info(`     Built learning base with ${learningMap.size} route patterns`);

    // Save high-confidence routes
    let routesSaved = 0;

    for (const [routeKey, learning] of learningMap.entries()) {
      if (learning.confidence >= 0.6) {
        // High confidence routes only
        await learner.saveLearnedRoute(routeKey, learning);
        routesSaved++;
      }
    }

    return routesSaved;
  } catch (error) {
    logger.error(`     ❌ Method 2 error: ${error}`);
    return 0;
  }
}

async function main() {
  const startTime = Date.now();

  logger.info('🚀 Mari8XOSRM - Comprehensive Dual-Method Route Extraction');
  logger.info('   Using 52.8M+ AIS positions');
  logger.info('   Combining both proprietary methodologies\n');
  logger.info('═'.repeat(80));

  const stats: ExtractionStats[] = [];

  // Get baseline
  const routesBefore = await prisma.extractedAISRoute.count();
  logger.info(`\n📊 Baseline: ${routesBefore} existing routes\n`);

  // Process each vessel type
  for (const config of VESSEL_TYPES) {
    logger.info(`\n🚢 Processing ${config.description}...`);
    logger.info('─'.repeat(80));

    // Method 1: Trajectory segmentation
    const method1Count = await extractRoutesMethod1(
      config.type,
      config.minSpeed,
      config.maxSpeed
    );

    // Method 2: Pattern learning
    const method2Count = await extractRoutesMethod2(config.type, config.minTrips);

    // Get statistics for this vessel type
    const typeStats = await prisma.extractedAISRoute.groupBy({
      by: ['routeType'],
      where: { vesselType: config.type },
      _count: { id: true },
      _avg: { distanceFactor: true, qualityScore: true },
    });

    const totalForType = typeStats.reduce((sum, s) => sum + s._count.id, 0);
    const avgFactor =
      typeStats.reduce((sum, s) => sum + (s._avg.distanceFactor || 0), 0) /
      (typeStats.length || 1);

    // Find top route
    const topRoute = await prisma.extractedAISRoute.findFirst({
      where: { vesselType: config.type },
      orderBy: { qualityScore: 'desc' },
      include: {
        originPort: { select: { name: true } },
        destPort: { select: { name: true } },
      },
    });

    stats.push({
      vesselType: config.description,
      method1Routes: method1Count,
      method2Routes: method2Count,
      totalRoutes: totalForType,
      avgConfidence: 0, // Calculate from quality score
      avgDistanceFactor: avgFactor,
      topRoute: topRoute
        ? `${topRoute.originPort?.name} → ${topRoute.destPort?.name}`
        : 'N/A',
    });

    logger.info(`   ✅ Method 1: ${method1Count} routes`);
    logger.info(`   ✅ Method 2: ${method2Count} routes`);
    logger.info(`   📊 Total: ${totalForType} routes`);
  }

  // Final summary
  const routesAfter = await prisma.extractedAISRoute.count();
  const newRoutes = routesAfter - routesBefore;
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  logger.info('\n' + '═'.repeat(80));
  logger.info('\n✅ EXTRACTION COMPLETE!\n');
  logger.info(`   📊 Routes before: ${routesBefore}`);
  logger.info(`   📊 Routes after: ${routesAfter}`);
  logger.info(`   ✨ New routes extracted: ${newRoutes}`);
  logger.info(`   ⏱️  Time taken: ${duration}s\n`);

  // Summary table
  logger.info('📈 Summary by Vessel Type:');
  logger.info('═'.repeat(100));
  logger.info(
    'Vessel Type'.padEnd(25) +
      'Method 1'.padStart(10) +
      'Method 2'.padStart(10) +
      'Total'.padStart(10) +
      'Dist Factor'.padStart(12) +
      'Top Route'
  );
  logger.info('─'.repeat(100));

  stats.forEach(s => {
    logger.info(
      s.vesselType.padEnd(25) +
        s.method1Routes.toString().padStart(10) +
        s.method2Routes.toString().padStart(10) +
        s.totalRoutes.toString().padStart(10) +
        s.avgDistanceFactor.toFixed(2).padStart(12) +
        '  ' +
        s.topRoute.substring(0, 40)
    );
  });

  logger.info('\n🎯 Next Steps:');
  logger.info('   1. Query via GraphQL: routesByVesselType(type: "container")');
  logger.info('   2. Use for route optimization and planning');
  logger.info('   3. Train distance prediction models');
  logger.info('   4. Display on frontend route maps\n');
}

main()
  .catch(error => {
    logger.error('💥 Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
