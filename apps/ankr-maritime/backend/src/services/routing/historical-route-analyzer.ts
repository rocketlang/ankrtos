/**
 * Historical Route Analyzer - AUTO-LEARNING SYSTEM
 *
 * This service continuously learns from:
 * 1. Completed voyages
 * 2. Historical AIS position data (12.6M positions!)
 * 3. Route quality feedback
 *
 * As data grows, routes get smarter automatically!
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class HistoricalRouteAnalyzer {
  /**
   * Analyze completed voyage and learn from it
   * Called automatically when voyage status = 'completed'
   */
  async learnFromCompletedVoyage(voyageId: string): Promise<void> {
    console.log(`📚 Learning from completed voyage: ${voyageId}`);

    const voyage = await prisma.voyage.findUnique({
      where: { id: voyageId },
      include: {
        vessel: {
          select: { id: true, type: true, name: true, draft: true, loa: true, beam: true }
        },
        departurePort: { select: { id: true, name: true, latitude: true, longitude: true } },
        arrivalPort: { select: { id: true, name: true, latitude: true, longitude: true } },
      },
    });

    if (!voyage || !voyage.departurePort || !voyage.arrivalPort) {
      console.log('  ⚠️  Insufficient voyage data for learning');
      return;
    }

    // Get vessel positions during this voyage
    const positions = await prisma.vesselPosition.findMany({
      where: {
        vesselId: voyage.vesselId,
        timestamp: {
          gte: voyage.atd || voyage.etd,
          lte: voyage.ata || voyage.eta,
        },
      },
      orderBy: { timestamp: 'asc' },
      select: {
        latitude: true,
        longitude: true,
        speed: true,
        timestamp: true,
      },
    });

    if (positions.length < 10) {
      console.log('  ⚠️  Insufficient position data (need at least 10 points)');
      return;
    }

    console.log(`  📍 Analyzing ${positions.length} positions`);

    // Step 1: Extract route pattern from positions
    const routePattern = this.extractRoutePattern(positions);

    // Step 2: Calculate actual voyage metrics
    const totalDistance = this.calculateTotalDistance(positions);
    const avgSpeed = this.calculateAverageSpeed(positions);
    const actualDuration = voyage.ata && voyage.atd
      ? (voyage.ata.getTime() - voyage.atd.getTime()) / (1000 * 60 * 60)
      : null;

    if (!actualDuration) {
      console.log('  ⚠️  Missing actual arrival/departure times');
      return;
    }

    // Step 3: Check if this route pattern already exists
    const existingPattern = await prisma.learnedRoutePattern.findFirst({
      where: {
        originPortId: voyage.departurePort.id,
        destPortId: voyage.arrivalPort.id,
        vesselType: voyage.vessel.type,
      },
    });

    if (existingPattern) {
      // Update existing pattern (incremental learning!)
      await this.updateLearnedPattern(
        existingPattern,
        totalDistance,
        actualDuration,
        avgSpeed,
        routePattern
      );
      console.log(`  ✅ Updated learned pattern (${existingPattern.observedCount + 1} observations)`);
    } else {
      // Create new learned pattern
      await this.createLearnedPattern(
        voyage.departurePort.id,
        voyage.arrivalPort.id,
        voyage.vessel.type,
        totalDistance,
        actualDuration,
        avgSpeed,
        routePattern
      );
      console.log(`  ✨ Created new learned pattern`);
    }

    // Step 4: Update any routes that were used for this voyage
    await this.updateRouteQuality(voyage, actualDuration, totalDistance);

    console.log(`  ✅ Learning complete`);
  }

  /**
   * Extract simplified route pattern from positions
   * Reduces thousands of points to key waypoints
   */
  private extractRoutePattern(positions: any[]): any[] {
    // Douglas-Peucker algorithm to simplify route
    // For now, simple sampling: take every Nth point
    const sampleRate = Math.max(1, Math.floor(positions.length / 10));
    const simplified = positions.filter((_, idx) => idx % sampleRate === 0);

    return simplified.map(pos => ({
      lat: pos.latitude,
      lng: pos.longitude,
    }));
  }

  /**
   * Calculate total distance traveled
   */
  private calculateTotalDistance(positions: any[]): number {
    let total = 0;
    for (let i = 1; i < positions.length; i++) {
      total += this.haversineDistance(
        positions[i - 1].latitude,
        positions[i - 1].longitude,
        positions[i].latitude,
        positions[i].longitude
      );
    }
    return total;
  }

  /**
   * Calculate average speed
   */
  private calculateAverageSpeed(positions: any[]): number {
    const speeds = positions
      .filter(p => p.speed && p.speed > 0)
      .map(p => p.speed);

    if (speeds.length === 0) return 14; // Default 14 knots
    return speeds.reduce((a, b) => a + b, 0) / speeds.length;
  }

  /**
   * Update existing learned pattern (incremental learning!)
   */
  private async updateLearnedPattern(
    existing: any,
    distance: number,
    duration: number,
    speed: number,
    pattern: any[]
  ): Promise<void> {
    // Calculate new weighted averages
    const n = existing.observedCount;
    const newAvgDistance = (existing.avgDistanceNm * n + distance) / (n + 1);
    const newAvgDuration = (existing.avgDurationHours * n + duration) / (n + 1);
    const newAvgSpeed = (existing.avgSpeedKnots * n + speed) / (n + 1);

    // Calculate reliability (consistency metric)
    // Higher reliability if new data is close to existing average
    const distanceDeviation = Math.abs(distance - existing.avgDistanceNm) / existing.avgDistanceNm;
    const reliabilityDelta = distanceDeviation < 0.1 ? 0.05 : -0.02; // Reward consistency
    const newReliability = Math.min(1.0, Math.max(0.1, existing.reliability + reliabilityDelta));

    // Popularity increases with usage
    const newPopularity = Math.min(1.0, existing.popularity + 0.02);

    await prisma.learnedRoutePattern.update({
      where: { id: existing.id },
      data: {
        observedCount: n + 1,
        lastObservedAt: new Date(),
        avgDistanceNm: newAvgDistance,
        avgDurationHours: newAvgDuration,
        avgSpeedKnots: newAvgSpeed,
        reliability: newReliability,
        popularity: newPopularity,
        // Optionally update pattern if significantly different
        // waypointPattern: pattern,
      },
    });
  }

  /**
   * Create new learned pattern
   */
  private async createLearnedPattern(
    originPortId: string,
    destPortId: string,
    vesselType: string,
    distance: number,
    duration: number,
    speed: number,
    pattern: any[]
  ): Promise<void> {
    const [origin, dest] = await Promise.all([
      prisma.port.findUnique({ where: { id: originPortId }, select: { name: true } }),
      prisma.port.findUnique({ where: { id: destPortId }, select: { name: true } }),
    ]);

    const patternName = `${origin?.name} - ${dest?.name} (${vesselType})`;

    await prisma.learnedRoutePattern.create({
      data: {
        originPortId,
        destPortId,
        vesselType,
        patternName,
        description: `Learned from voyage data`,
        avgDistanceNm: distance,
        avgDurationHours: duration,
        avgSpeedKnots: speed,
        waypointPattern: pattern,
        reliability: 0.5, // Start with medium reliability
        popularity: 0.1, // Low popularity initially
      },
    });
  }

  /**
   * Update route quality based on actual voyage performance
   */
  private async updateRouteQuality(
    voyage: any,
    actualHours: number,
    actualDistance: number
  ): Promise<void> {
    // Find if this voyage used a calculated route
    const usedRoute = await prisma.vesselRoute.findFirst({
      where: {
        vesselId: voyage.vesselId,
        originPortId: voyage.departurePortId,
        destPortId: voyage.arrivalPortId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!usedRoute) return;

    // Create quality log
    await prisma.routeQualityLog.create({
      data: {
        routeId: usedRoute.id,
        voyageId: voyage.id,
        plannedHours: usedRoute.estimatedHours,
        actualHours,
        completed: true,
        completedAt: voyage.ata,
        onTimeArrival: actualHours <= usedRoute.estimatedHours * 1.1, // Within 10%
        delayHours: Math.max(0, actualHours - usedRoute.estimatedHours),
        weatherConditions: 'GOOD', // TODO: Get from weather service
        wouldRecommend: actualHours <= usedRoute.estimatedHours * 1.2, // Within 20%
      },
    });

    // Update route confidence score based on performance
    const qualityLogs = await prisma.routeQualityLog.findMany({
      where: { routeId: usedRoute.id, completed: true },
    });

    const successRate = qualityLogs.filter(log => log.wouldRecommend).length / qualityLogs.length;
    const avgActualHours = qualityLogs.reduce((sum, log) => sum + (log.actualHours || 0), 0) / qualityLogs.length;

    // Update route with learned metrics
    await prisma.vesselRoute.update({
      where: { id: usedRoute.id },
      data: {
        usageCount: usedRoute.usageCount + 1,
        successRate,
        avgActualHours,
        lastUsedAt: new Date(),
        confidenceScore: Math.min(1.0, usedRoute.confidenceScore + 0.1), // Increase confidence with use
      },
    });

    console.log(`  📈 Route confidence updated: ${(usedRoute.confidenceScore * 100).toFixed(0)}% → ${Math.min(100, (usedRoute.confidenceScore + 0.1) * 100).toFixed(0)}%`);
  }

  /**
   * Haversine distance in nautical miles
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Batch analyze historical voyages to bootstrap learning
   */
  async bootstrapLearning(limit: number = 100): Promise<void> {
    console.log(`🚀 Bootstrapping route learning from historical data (limit: ${limit})`);

    const completedVoyages = await prisma.voyage.findMany({
      where: {
        status: 'completed',
        atd: { not: null },
        ata: { not: null },
        departurePortId: { not: null },
        arrivalPortId: { not: null },
      },
      take: limit,
      orderBy: { ata: 'desc' },
      select: { id: true },
    });

    console.log(`  Found ${completedVoyages.length} completed voyages`);

    let learned = 0;
    for (const voyage of completedVoyages) {
      try {
        await this.learnFromCompletedVoyage(voyage.id);
        learned++;
      } catch (error) {
        console.error(`  ❌ Error learning from voyage ${voyage.id}:`, error);
      }
    }

    console.log(`  ✅ Bootstrap complete: ${learned}/${completedVoyages.length} voyages analyzed`);
  }

  /**
   * Generate route optimization suggestions based on learned patterns
   */
  async generateOptimizationSuggestions(): Promise<void> {
    console.log(`💡 Generating route optimization suggestions`);

    // Find routes with low confidence scores that have high-reliability alternatives
    const lowConfidenceRoutes = await prisma.vesselRoute.findMany({
      where: {
        confidenceScore: { lt: 0.6 },
        usageCount: { gt: 0 },
      },
      include: {
        vessel: { select: { type: true } },
      },
      take: 50,
    });

    for (const route of lowConfidenceRoutes) {
      // Check if there's a better learned pattern
      const betterPattern = await prisma.learnedRoutePattern.findFirst({
        where: {
          originPortId: route.originPortId,
          destPortId: route.destPortId,
          vesselType: route.vessel.type,
          reliability: { gt: 0.7 },
        },
      });

      if (betterPattern && betterPattern.avgDurationHours < route.estimatedHours) {
        // Create optimization suggestion
        await prisma.routeOptimizationSuggestion.create({
          data: {
            originalRouteId: route.id,
            suggestionType: 'FASTER',
            reason: `Learned pattern shows ${(route.estimatedHours - betterPattern.avgDurationHours).toFixed(1)} hours faster route`,
            timeSavingHours: route.estimatedHours - betterPattern.avgDurationHours,
            confidence: betterPattern.reliability,
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });

        console.log(`  💡 Suggestion created for route ${route.id}`);
      }
    }
  }
}

export const historicalRouteAnalyzer = new HistoricalRouteAnalyzer();
