/**
 * Mari8XOSRM - Incremental Learning System
 *
 * The base routes (11 ferry routes) serve as the foundation.
 * As more vessels travel the same routes, the algorithm continuously
 * improves and refines its predictions.
 *
 * Strategy:
 * 1. Base routes establish initial distance factors
 * 2. New routes on same port pairs enhance the factors
 * 3. Model learns vessel-specific and seasonal variations
 * 4. Confidence increases with more observations
 */

import { PrismaClient } from '@prisma/client';
import { createChildLogger } from '../../utils/logger';

const logger = createChildLogger({ module: 'incremental-learner' });

interface RouteLearning {
  portPair: string; // "NOSVG-NOBGO" format (origin-dest)
  originPortId: string;
  destPortId: string;

  // Base statistics
  observationCount: number;
  avgDistanceFactor: number;
  stdDeviation: number;
  confidence: number; // 0-1 based on observation count

  // Learned factors
  baseGreatCircleNm: number;
  avgActualNm: number;

  // Vessel-specific learning
  vesselTypeFactors: Map<string, {
    count: number;
    avgFactor: number;
  }>;

  // Temporal patterns
  seasonalFactors?: {
    winter: number; // Dec-Feb
    spring: number; // Mar-May
    summer: number; // Jun-Aug
    fall: number;   // Sep-Nov
  };

  // Quality metadata
  lastUpdated: Date;
  firstObserved: Date;
}

export class IncrementalLearner {
  constructor(private prisma: PrismaClient) {}

  /**
   * Build route learning database from all extracted routes
   * This creates the "base" that will be enhanced over time
   */
  async buildRouteLearningBase(): Promise<Map<string, RouteLearning>> {
    logger.info('📚 Building route learning base from extracted routes...');

    const routes = await this.prisma.extractedAISRoute.findMany({
      where: {
        qualityScore: { gte: 0.6 },
        distanceFactor: { gte: 1.0, lte: 3.5 },
      },
      include: {
        originPort: { select: { unlocode: true } },
        destPort: { select: { unlocode: true } },
      },
      orderBy: { extractedAt: 'asc' },
    });

    const learningMap = new Map<string, RouteLearning>();

    for (const route of routes) {
      const portPair = `${route.originPort.unlocode}-${route.destPort.unlocode}`;

      if (!learningMap.has(portPair)) {
        // Initialize new route learning
        learningMap.set(portPair, {
          portPair,
          originPortId: route.originPortId,
          destPortId: route.destPortId,
          observationCount: 0,
          avgDistanceFactor: 0,
          stdDeviation: 0,
          confidence: 0,
          baseGreatCircleNm: route.greatCircleNm,
          avgActualNm: 0,
          vesselTypeFactors: new Map(),
          lastUpdated: new Date(),
          firstObserved: route.extractedAt,
        });
      }

      // Update with this observation
      this.updateRouteLearning(learningMap.get(portPair)!, route);
    }

    // Calculate statistics for each route
    for (const learning of learningMap.values()) {
      this.calculateStatistics(learning);
    }

    logger.info(`✓ Built learning base for ${learningMap.size} unique port pairs`);
    return learningMap;
  }

  /**
   * Update route learning with a new observation
   */
  private updateRouteLearning(learning: RouteLearning, route: any) {
    learning.observationCount++;

    // Update average distance factor (running average)
    learning.avgDistanceFactor =
      (learning.avgDistanceFactor * (learning.observationCount - 1) + route.distanceFactor)
      / learning.observationCount;

    // Update average actual distance
    learning.avgActualNm =
      (learning.avgActualNm * (learning.observationCount - 1) + route.actualSailedNm)
      / learning.observationCount;

    // Update vessel type specific factors
    const vesselType = route.vesselType;
    const vesselFactor = learning.vesselTypeFactors.get(vesselType) || { count: 0, avgFactor: 0 };
    vesselFactor.count++;
    vesselFactor.avgFactor =
      (vesselFactor.avgFactor * (vesselFactor.count - 1) + route.distanceFactor)
      / vesselFactor.count;
    learning.vesselTypeFactors.set(vesselType, vesselFactor);

    learning.lastUpdated = new Date();
  }

  /**
   * Calculate statistics (std deviation, confidence)
   */
  private async calculateStatistics(learning: RouteLearning) {
    // Get all routes for this port pair to calculate std deviation
    const routes = await this.prisma.extractedAISRoute.findMany({
      where: {
        originPortId: learning.originPortId,
        destPortId: learning.destPortId,
        qualityScore: { gte: 0.6 },
      },
      select: { distanceFactor: true },
    });

    if (routes.length > 1) {
      const mean = learning.avgDistanceFactor;
      const squaredDiffs = routes.map(r => Math.pow(r.distanceFactor - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / routes.length;
      learning.stdDeviation = Math.sqrt(variance);
    }

    // Confidence increases with observations (asymptotic to 1.0)
    // Formula: confidence = 1 - exp(-count / k) where k = 10
    // Reaches ~63% at 10 obs, ~86% at 20 obs, ~95% at 30 obs
    learning.confidence = 1 - Math.exp(-learning.observationCount / 10);
  }

  /**
   * Predict distance for a route using incremental learning
   */
  async predictWithLearning(
    originPortId: string,
    destPortId: string,
    vesselType: string,
    learningMap: Map<string, RouteLearning>
  ): Promise<{
    predictedNm: number;
    greatCircleNm: number;
    factor: number;
    confidence: number;
    observations: number;
    source: 'learned' | 'vessel_type' | 'global_avg' | 'fallback';
  }> {
    // Look up origin and dest ports to get unlocodes
    const [originPort, destPort] = await Promise.all([
      this.prisma.port.findUnique({ where: { id: originPortId }, select: { unlocode: true, latitude: true, longitude: true } }),
      this.prisma.port.findUnique({ where: { id: destPortId }, select: { unlocode: true, latitude: true, longitude: true } }),
    ]);

    if (!originPort || !destPort || !originPort.latitude || !destPort.latitude) {
      throw new Error('Invalid port IDs or missing coordinates');
    }

    const greatCircleNm = this.haversineDistance(
      originPort.latitude,
      originPort.longitude,
      destPort.latitude,
      destPort.longitude
    );

    const portPair = `${originPort.unlocode}-${destPort.unlocode}`;
    const learning = learningMap.get(portPair);

    // Strategy 1: Exact route learned
    if (learning && learning.observationCount > 0) {
      // Check for vessel-specific learning
      const vesselFactor = learning.vesselTypeFactors.get(vesselType);

      if (vesselFactor && vesselFactor.count >= 2) {
        // Use vessel-specific factor (high confidence)
        return {
          predictedNm: greatCircleNm * vesselFactor.avgFactor,
          greatCircleNm,
          factor: vesselFactor.avgFactor,
          confidence: Math.min(learning.confidence * 1.2, 1.0), // Boost confidence for vessel match
          observations: vesselFactor.count,
          source: 'learned',
        };
      }

      // Use route average factor (medium confidence)
      return {
        predictedNm: greatCircleNm * learning.avgDistanceFactor,
        greatCircleNm,
        factor: learning.avgDistanceFactor,
        confidence: learning.confidence,
        observations: learning.observationCount,
        source: 'learned',
      };
    }

    // Strategy 2: No exact route, use vessel type average from all routes
    const vesselTypeRoutes = await this.prisma.extractedAISRoute.findMany({
      where: { vesselType, qualityScore: { gte: 0.6 } },
      select: { distanceFactor: true },
    });

    if (vesselTypeRoutes.length > 0) {
      const avgFactor = vesselTypeRoutes.reduce((sum, r) => sum + r.distanceFactor, 0) / vesselTypeRoutes.length;
      return {
        predictedNm: greatCircleNm * avgFactor,
        greatCircleNm,
        factor: avgFactor,
        confidence: Math.min(vesselTypeRoutes.length / 20, 0.7), // Max 70% for vessel type avg
        observations: vesselTypeRoutes.length,
        source: 'vessel_type',
      };
    }

    // Strategy 3: Global average
    const allRoutes = await this.prisma.extractedAISRoute.findMany({
      where: { qualityScore: { gte: 0.6 } },
      select: { distanceFactor: true },
    });

    if (allRoutes.length > 0) {
      const avgFactor = allRoutes.reduce((sum, r) => sum + r.distanceFactor, 0) / allRoutes.length;
      return {
        predictedNm: greatCircleNm * avgFactor,
        greatCircleNm,
        factor: avgFactor,
        confidence: 0.3, // Low confidence
        observations: allRoutes.length,
        source: 'global_avg',
      };
    }

    // Strategy 4: Fallback (conservative estimate)
    return {
      predictedNm: greatCircleNm * 1.2,
      greatCircleNm,
      factor: 1.2,
      confidence: 0.1,
      observations: 0,
      source: 'fallback',
    };
  }

  /**
   * Enhance the algorithm with a new route observation
   * This is called automatically when new AIS routes are extracted
   */
  async enhanceWithNewRoute(
    routeId: string,
    learningMap: Map<string, RouteLearning>
  ): Promise<RouteLearning> {
    logger.info(`🔄 Enhancing algorithm with new route: ${routeId}`);

    const route = await this.prisma.extractedAISRoute.findUnique({
      where: { id: routeId },
      include: {
        originPort: { select: { unlocode: true } },
        destPort: { select: { unlocode: true } },
      },
    });

    if (!route) {
      throw new Error('Route not found');
    }

    const portPair = `${route.originPort.unlocode}-${route.destPort.unlocode}`;
    let learning = learningMap.get(portPair);

    if (!learning) {
      // New port pair - create base learning
      learning = {
        portPair,
        originPortId: route.originPortId,
        destPortId: route.destPortId,
        observationCount: 0,
        avgDistanceFactor: 0,
        stdDeviation: 0,
        confidence: 0,
        baseGreatCircleNm: route.greatCircleNm,
        avgActualNm: 0,
        vesselTypeFactors: new Map(),
        lastUpdated: new Date(),
        firstObserved: route.extractedAt,
      };
      learningMap.set(portPair, learning);
      logger.info(`  ✓ New port pair learned: ${portPair}`);
    } else {
      logger.info(`  ✓ Enhancing existing port pair: ${portPair}`);
      logger.info(`    Before: ${learning.observationCount} obs, factor ${learning.avgDistanceFactor.toFixed(3)}x`);
    }

    this.updateRouteLearning(learning, route);
    await this.calculateStatistics(learning);

    logger.info(`    After: ${learning.observationCount} obs, factor ${learning.avgDistanceFactor.toFixed(3)}x, confidence ${(learning.confidence * 100).toFixed(0)}%`);

    return learning;
  }

  /**
   * Get learning summary for all routes
   */
  async getLearningReport(learningMap: Map<string, RouteLearning>) {
    const report = {
      totalPortPairs: learningMap.size,
      totalObservations: 0,
      highConfidenceRoutes: 0, // confidence > 0.8
      mediumConfidenceRoutes: 0, // 0.5 - 0.8
      lowConfidenceRoutes: 0, // < 0.5
      vesselTypesLearned: new Set<string>(),
      topRoutes: [] as Array<{
        portPair: string;
        observations: number;
        factor: number;
        confidence: number;
      }>,
    };

    for (const learning of learningMap.values()) {
      report.totalObservations += learning.observationCount;

      if (learning.confidence > 0.8) report.highConfidenceRoutes++;
      else if (learning.confidence > 0.5) report.mediumConfidenceRoutes++;
      else report.lowConfidenceRoutes++;

      for (const vesselType of learning.vesselTypeFactors.keys()) {
        report.vesselTypesLearned.add(vesselType);
      }
    }

    // Get top 10 routes by observations
    report.topRoutes = Array.from(learningMap.values())
      .sort((a, b) => b.observationCount - a.observationCount)
      .slice(0, 10)
      .map(l => ({
        portPair: l.portPair,
        observations: l.observationCount,
        factor: l.avgDistanceFactor,
        confidence: l.confidence,
      }));

    return report;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
}
