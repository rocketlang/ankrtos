#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Daily Automatic Route Extraction
 *
 * Runs daily to extract new routes from AIS data and enhance the learning system.
 * Designed to run as a cron job: 0 0 * * * (midnight daily)
 */

import { PrismaClient } from '@prisma/client';
import { IncrementalLearner } from '../services/routing/incremental-learner';
import { createChildLogger } from '../utils/logger';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();
const logger = createChildLogger({ module: 'daily-extraction' });

// Good vessels to monitor (expand this list as we find more)
const MONITORED_VESSELS = [
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

interface ExtractionReport {
  date: Date;
  newRoutesExtracted: number;
  totalRoutes: number;
  confidenceImproved: number;
  avgConfidenceBefore: number;
  avgConfidenceAfter: number;
  topRoutes: Array<{ portPair: string; observations: number; confidence: number }>;
  errors: string[];
}

async function main() {
  const startTime = Date.now();
  logger.info('🌅 Mari8XOSRM - Daily Route Extraction Starting...');
  logger.info(`Timestamp: ${new Date().toISOString()}`);

  const report: ExtractionReport = {
    date: new Date(),
    newRoutesExtracted: 0,
    totalRoutes: 0,
    confidenceImproved: 0,
    avgConfidenceBefore: 0,
    avgConfidenceAfter: 0,
    topRoutes: [],
    errors: [],
  };

  try {
    // Step 1: Get baseline statistics
    logger.info('📊 Getting baseline statistics...');
    const routesBefore = await prisma.extractedAISRoute.count();
    const learnerBefore = new IncrementalLearner(prisma);
    const learningMapBefore = await learnerBefore.buildRouteLearningBase();

    const reportBefore = await learnerBefore.getLearningReport(learningMapBefore);
    report.avgConfidenceBefore = reportBefore.totalObservations > 0
      ? Array.from(learningMapBefore.values()).reduce((sum, l) => sum + l.confidence, 0) / learningMapBefore.size
      : 0;

    logger.info(`Baseline: ${routesBefore} routes, ${(report.avgConfidenceBefore * 100).toFixed(1)}% avg confidence`);

    // Step 2: Find vessels with new position data
    logger.info('🔍 Scanning for new vessel movements...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const vesselsWithNewData = await prisma.vessel.findMany({
      where: {
        name: { in: MONITORED_VESSELS },
        positions: {
          some: {
            timestamp: { gte: yesterday },
            speed: { gt: 5 }, // Moving vessels only
          },
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    logger.info(`Found ${vesselsWithNewData.length} vessels with new movement data`);

    if (vesselsWithNewData.length === 0) {
      logger.warn('⚠️  No new vessel movements detected in the last 24 hours');
      report.errors.push('No new vessel movements in last 24h');
      await saveReport(report);
      return;
    }

    // Step 3: Extract routes from each vessel
    let newRoutesCount = 0;

    for (const vessel of vesselsWithNewData) {
      logger.info(`\n📍 Processing ${vessel.name}...`);

      try {
        // Get positions from last 24h
        const positions = await prisma.vesselPosition.findMany({
          where: {
            vesselId: vessel.id,
            timestamp: { gte: yesterday },
            speed: { gt: 3 },
          },
          orderBy: { timestamp: 'asc' },
          select: {
            timestamp: true,
            latitude: true,
            longitude: true,
            speed: true,
          },
        });

        logger.info(`  Found ${positions.length} positions`);

        if (positions.length < 20) {
          logger.info(`  Skipping - insufficient data (need 20+)`);
          continue;
        }

        // Split into continuous segments
        const segments = splitIntoSegments(positions, 2);
        logger.info(`  Identified ${segments.length} route segments`);

        for (const segment of segments) {
          if (segment.length < 20) continue;

          const route = await extractRouteSegment(vessel, segment);
          if (route) {
            newRoutesCount++;
            logger.info(`  ✓ Extracted route: ${route.distance.toFixed(0)}nm`);
          }
        }
      } catch (error: any) {
        logger.error(`  ❌ Error processing ${vessel.name}: ${error.message}`);
        report.errors.push(`${vessel.name}: ${error.message}`);
      }
    }

    report.newRoutesExtracted = newRoutesCount;

    // Step 4: Update learning system
    logger.info('\n🧠 Updating learning system...');
    const learnerAfter = new IncrementalLearner(prisma);
    const learningMapAfter = await learnerAfter.buildRouteLearningBase();

    const reportAfter = await learnerAfter.getLearningReport(learningMapAfter);
    report.totalRoutes = await prisma.extractedAISRoute.count();
    report.avgConfidenceAfter = reportAfter.totalObservations > 0
      ? Array.from(learningMapAfter.values()).reduce((sum, l) => sum + l.confidence, 0) / learningMapAfter.size
      : 0;

    // Calculate improvements
    report.confidenceImproved = report.avgConfidenceAfter - report.avgConfidenceBefore;
    report.topRoutes = reportAfter.topRoutes.slice(0, 5);

    // Step 5: Generate report
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    logger.info('\n✅ Daily Extraction Complete!\n');
    logger.info('═'.repeat(80));
    logger.info('DAILY EXTRACTION REPORT');
    logger.info('═'.repeat(80));
    logger.info(`Date: ${report.date.toISOString()}`);
    logger.info(`Duration: ${duration}s`);
    logger.info(`\nNew routes extracted: ${report.newRoutesExtracted}`);
    logger.info(`Total routes now: ${report.totalRoutes} (+${report.totalRoutes - routesBefore})`);
    logger.info(`\nConfidence improvement:`);
    logger.info(`  Before: ${(report.avgConfidenceBefore * 100).toFixed(1)}%`);
    logger.info(`  After: ${(report.avgConfidenceAfter * 100).toFixed(1)}%`);
    logger.info(`  Change: +${(report.confidenceImproved * 100).toFixed(2)}%`);

    if (report.topRoutes.length > 0) {
      logger.info(`\nTop 5 Routes by Observations:`);
      report.topRoutes.forEach((route, i) => {
        logger.info(`  ${i + 1}. ${route.portPair}: ${route.observations} obs, ${(route.confidence * 100).toFixed(0)}% conf`);
      });
    }

    if (report.errors.length > 0) {
      logger.warn(`\n⚠️  Errors encountered: ${report.errors.length}`);
      report.errors.forEach(err => logger.warn(`  - ${err}`));
    }

    logger.info('\n' + '═'.repeat(80));

    // Save report to database
    await saveReport(report);

    // Send alerts if significant improvements
    if (report.newRoutesExtracted >= 5) {
      logger.info(`\n🎉 Major milestone: ${report.newRoutesExtracted} new routes extracted!`);
    }

    if (report.avgConfidenceAfter > 0.5 && report.avgConfidenceBefore < 0.5) {
      logger.info(`\n🎊 Milestone reached: 50%+ average confidence!`);
    }

  } catch (error: any) {
    logger.error(`\n❌ Daily extraction failed: ${error.message}`);
    logger.error(error.stack);
    report.errors.push(`Fatal: ${error.message}`);
    await saveReport(report);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Split positions into continuous segments
 */
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

/**
 * Extract a route from a segment of positions
 */
async function extractRouteSegment(
  vessel: { id: string; name: string; type: string },
  positions: Array<{ timestamp: Date; latitude: number; longitude: number; speed: number | null }>
) {
  const startPos = positions[0];
  const endPos = positions[positions.length - 1];

  // Calculate distance
  let totalDistance = 0;
  for (let i = 1; i < positions.length; i++) {
    totalDistance += haversineDistance(
      positions[i - 1].latitude,
      positions[i - 1].longitude,
      positions[i].latitude,
      positions[i].longitude
    );
  }

  // Skip very short segments
  if (totalDistance < 5) return null;

  // Find nearest ports
  const originPort = await findNearestPort(startPos.latitude, startPos.longitude);
  const destPort = await findNearestPort(endPos.latitude, endPos.longitude);

  if (!originPort || !destPort || originPort.id === destPort.id) {
    return null;
  }

  // Calculate metrics
  const greatCircleNm = haversineDistance(
    originPort.latitude,
    originPort.longitude,
    destPort.latitude,
    destPort.longitude
  );
  const distanceFactor = totalDistance / greatCircleNm;
  const durationHours = (endPos.timestamp.getTime() - startPos.timestamp.getTime()) / (1000 * 60 * 60);
  const avgSpeed = durationHours > 0 ? totalDistance / durationHours : 0;

  // Quality checks
  if (distanceFactor < 1.0 || distanceFactor > 3.5) return null;
  if (avgSpeed < 3 || avgSpeed > 30) return null;

  // Save route
  await prisma.extractedAISRoute.create({
    data: {
      vesselId: vessel.id,
      vesselType: vessel.type,
      originPortId: originPort.id,
      destPortId: destPort.id,
      departureTime: startPos.timestamp,
      arrivalTime: endPos.timestamp,
      greatCircleNm,
      actualSailedNm: totalDistance,
      distanceFactor,
      durationHours,
      avgSpeedKnots: avgSpeed,
      qualityScore: Math.min(positions.length / 100, 1),
      coveragePercent: (positions.length / (durationHours * 12)) * 100,
      totalPositions: positions.length,
      routeType: distanceFactor < 1.15 ? 'DIRECT' : 'COASTAL',
      viaPoints: [],
      positionsData: simplifyPositions(positions, 50),
    },
  });

  return { distance: totalDistance, duration: durationHours };
}

/**
 * Helper functions
 */
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

async function findNearestPort(lat: number, lon: number) {
  const ports = await prisma.port.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
    },
  });

  let nearest = null;
  let minDistance = 100;

  for (const port of ports) {
    if (!port.latitude || !port.longitude) continue;
    const distance = haversineDistance(lat, lon, port.latitude, port.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = port;
    }
  }

  return nearest;
}

function simplifyPositions(positions: any[], targetCount: number): any {
  if (positions.length <= targetCount) {
    return positions.map(p => ({ t: p.timestamp.toISOString(), lat: p.latitude, lon: p.longitude }));
  }
  const step = Math.floor(positions.length / targetCount);
  return positions.filter((_, i) => i % step === 0).map(p => ({
    t: p.timestamp.toISOString(),
    lat: p.latitude,
    lon: p.longitude
  }));
}

async function saveReport(report: ExtractionReport) {
  // Save to JSON file for historical tracking
  const fs = require('fs');
  const reportPath = `/tmp/mari8xosrm-daily-reports.jsonl`;
  const reportLine = JSON.stringify(report) + '\n';
  fs.appendFileSync(reportPath, reportLine);
  logger.info(`📝 Report saved to ${reportPath}`);
}

main().catch((error) => {
  logger.error('Fatal error in daily extraction:', error);
  process.exit(1);
});
