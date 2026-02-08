#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Phase 1, Week 1: Test AIS Route Extraction
 *
 * This script tests the AISRouteExtractor by extracting the first 100 routes
 * from the AIS position database and validates extraction quality.
 */

import { PrismaClient } from '@prisma/client';
import { AISRouteExtractor } from '../services/routing/ais-route-extractor';

const prisma = new PrismaClient();

async function main() {
  console.log('🚢 Mari8XOSRM - AIS Route Extraction Test\n');
  console.log('Phase 1, Week 1, Task 1.1: Extract first 100 routes\n');

  // Initialize extractor
  const extractor = new AISRouteExtractor(prisma);

  // Configure extraction options
  const options = {
    minPositions: 20,           // Need at least 20 positions for valid route
    maxGapHours: 6,             // Maximum 6-hour gap between positions
    minQualityScore: 0.6,       // Minimum quality score of 0.6
    minSpeedKnots: 3,           // Minimum 3 knots (filter out at-anchor)
    maxSpeedKnots: 35,          // Maximum 35 knots (filter out unrealistic speeds)
    portProximityNm: 50,        // Within 50nm of port
    includePositionsData: true, // Include simplified position track
  };

  console.log('Extraction Configuration:');
  console.log(`- Min positions per route: ${options.minPositions}`);
  console.log(`- Max gap between positions: ${options.maxGapHours} hours`);
  console.log(`- Min quality score: ${options.minQualityScore}`);
  console.log(`- Speed range: ${options.minSpeedKnots}-${options.maxSpeedKnots} knots`);
  console.log(`- Port proximity: ${options.portProximityNm}nm\n`);

  try {
    // Check if table exists by trying to query it
    console.log('Checking database table...');
    try {
      const count = await prisma.extractedAISRoute.count();
      console.log(`✓ Table exists with ${count} existing routes\n`);
    } catch (error: any) {
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        console.log('❌ Table "extracted_ais_routes" does not exist!');
        console.log('\nTo create the table, run:');
        console.log('  npx tsx src/scripts/create-extracted-routes-table.ts\n');
        process.exit(1);
      }
      throw error;
    }

    // Extract routes
    console.log('🔍 Extracting routes from AIS data...');
    const startTime = Date.now();

    const routes = await extractor.extractRoutes(options, 100);

    const extractionTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✓ Extracted ${routes.length} routes in ${extractionTime}s\n`);

    if (routes.length === 0) {
      console.log('⚠️  No routes found matching criteria');
      console.log('\nPossible reasons:');
      console.log('- Not enough AIS position data');
      console.log('- No complete voyages in the database');
      console.log('- Quality thresholds too strict');
      return;
    }

    // Analyze extraction results
    console.log('📊 Extraction Statistics:');
    console.log('─'.repeat(80));

    const avgQuality = routes.reduce((sum, r) => sum + r.qualityScore, 0) / routes.length;
    const avgCoverage = routes.reduce((sum, r) => sum + r.coveragePercent, 0) / routes.length;
    const avgDistanceFactor = routes.reduce((sum, r) => sum + r.distanceFactor, 0) / routes.length;
    const avgPositions = routes.reduce((sum, r) => sum + r.totalPositions, 0) / routes.length;

    console.log(`Average Quality Score: ${avgQuality.toFixed(3)}`);
    console.log(`Average Coverage: ${avgCoverage.toFixed(1)}%`);
    console.log(`Average Distance Factor: ${avgDistanceFactor.toFixed(3)} (${((avgDistanceFactor - 1) * 100).toFixed(1)}% longer than great circle)`);
    console.log(`Average Positions: ${avgPositions.toFixed(0)}`);

    // Route type distribution
    const routeTypes = routes.reduce((acc, r) => {
      acc[r.routeType] = (acc[r.routeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nRoute Type Distribution:');
    Object.entries(routeTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} (${((count / routes.length) * 100).toFixed(1)}%)`);
    });

    // Vessel type distribution
    const vesselTypes = routes.reduce((acc, r) => {
      acc[r.vesselType] = (acc[r.vesselType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nVessel Type Distribution:');
    Object.entries(vesselTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

    // Show top 5 routes by quality
    console.log('\n🏆 Top 5 Routes by Quality:');
    console.log('─'.repeat(80));

    const topRoutes = [...routes]
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, 5);

    for (const route of topRoutes) {
      console.log(`\n${route.vesselType} - Quality: ${route.qualityScore.toFixed(3)}`);
      console.log(`  Distance: ${route.actualSailedNm.toFixed(0)}nm (${route.distanceFactor.toFixed(3)}x GC)`);
      console.log(`  Duration: ${route.durationHours.toFixed(1)}h @ ${route.avgSpeedKnots.toFixed(1)} knots`);
      console.log(`  Coverage: ${route.coveragePercent.toFixed(1)}% (${route.totalPositions} positions)`);
      console.log(`  Type: ${route.routeType}${route.viaPoints.length > 0 ? ` via ${route.viaPoints.join(', ')}` : ''}`);
    }

    // Save routes to database
    console.log('\n\n💾 Saving routes to database...');
    await extractor.saveExtractedRoutes(routes);
    console.log(`✓ Saved ${routes.length} routes to extracted_ais_routes table\n`);

    // Final summary
    console.log('✅ Extraction test completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Review extraction quality and adjust parameters if needed');
    console.log('2. Extract full dataset (targeting 10,000+ routes)');
    console.log('3. Build distance training model (Week 2)');
    console.log('4. Implement maritime graph structure (Week 3-4)\n');

  } catch (error) {
    console.error('❌ Extraction failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
