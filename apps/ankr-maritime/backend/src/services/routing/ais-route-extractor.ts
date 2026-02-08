/**
 * Mari8XOSRM - AIS Route Extractor
 *
 * Extracts high-quality port-to-port routes from 46M+ AIS positions.
 * This is the foundation of our OSRM-style ocean routing engine.
 *
 * Strategy:
 * 1. Filter vessels by movement patterns
 * 2. Identify port-to-port segments
 * 3. Clean outliers and GPS errors
 * 4. Validate route quality
 * 5. Calculate accurate distances
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger.js';

const prisma = new PrismaClient();

export interface RouteExtractionOptions {
  minPositions: number;        // Minimum positions for valid route (e.g., 50)
  maxGapHours: number;         // Maximum time gap between positions (e.g., 6 hours)
  speedFilter: {
    min: number;               // Minimum speed (e.g., 3 knots - vessel moving)
    max: number;               // Maximum realistic speed (e.g., 30 knots)
  };
  qualityThreshold: number;    // Minimum quality score (0-1, e.g., 0.7)
}

export interface ExtractedRoute {
  id: string;
  vesselId: string;
  vesselName: string;
  vesselType: string;
  imo: string;

  // Port information
  originPortId: string;
  originPortName: string;
  originLat: number;
  originLng: number;
  departureTime: Date;

  destPortId: string;
  destPortName: string;
  destLat: number;
  destLng: number;
  arrivalTime: Date;

  // Route metrics
  positions: RoutePosition[];
  totalPositions: number;
  greatCircleNm: number;        // Theoretical distance
  actualSailedNm: number;        // Actual distance from AIS
  distanceFactor: number;        // actual / great_circle
  durationHours: number;
  avgSpeedKnots: number;

  // Quality metrics
  qualityScore: number;          // 0-1 (coverage, consistency, etc.)
  coveragePercent: number;       // Position coverage vs expected
  hasGaps: boolean;
  maxGapHours: number;

  // Classification
  routeType: 'DIRECT' | 'VIA_CANAL' | 'COASTAL' | 'UNKNOWN';
  viaPoints: string[];           // e.g., ["Suez Canal", "Malacca Strait"]

  extractedAt: Date;
}

export interface RoutePosition {
  lat: number;
  lng: number;
  speed: number;
  course: number;
  timestamp: Date;
}

export class AISRouteExtractor {
  /**
   * Extract routes from AIS data for a specific time period
   */
  async extractRoutes(
    options: RouteExtractionOptions,
    limit: number = 100
  ): Promise<ExtractedRoute[]> {
    logger.info('🚀 Starting AIS route extraction', {
      minPositions: options.minPositions,
      maxGapHours: options.maxGapHours,
      qualityThreshold: options.qualityThreshold,
      limit
    });

    // Step 1: Find completed voyages with AIS data
    const voyages = await this.findCompletedVoyages(limit);
    logger.info(`Found ${voyages.length} completed voyages`);

    const extractedRoutes: ExtractedRoute[] = [];

    // Step 2: Extract route from each voyage
    for (const voyage of voyages) {
      try {
        const route = await this.extractRouteFromVoyage(voyage.id, options);

        if (route && route.qualityScore >= options.qualityThreshold) {
          extractedRoutes.push(route);
          logger.info(`✅ Extracted route: ${route.originPortName} → ${route.destPortName}`, {
            distance: route.actualSailedNm.toFixed(0),
            quality: route.qualityScore.toFixed(2),
            positions: route.totalPositions
          });
        } else if (route) {
          logger.warn(`⚠️  Low quality route skipped (${route.qualityScore.toFixed(2)} < ${options.qualityThreshold})`);
        }
      } catch (error) {
        logger.error(`❌ Failed to extract route from voyage ${voyage.id}:`, error);
      }
    }

    logger.info(`✅ Route extraction complete: ${extractedRoutes.length}/${voyages.length} routes extracted`);
    return extractedRoutes;
  }

  /**
   * Find completed voyages with AIS position data
   */
  private async findCompletedVoyages(limit: number) {
    return prisma.voyage.findMany({
      where: {
        status: 'completed',
        atd: { not: null },
        ata: { not: null },
        departurePortId: { not: null },
        arrivalPortId: { not: null },
      },
      include: {
        vessel: {
          select: {
            id: true,
            name: true,
            type: true,
            imo: true
          }
        },
        departurePort: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true
          }
        },
        arrivalPort: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true
          }
        }
      },
      orderBy: {
        ata: 'desc'
      },
      take: limit
    });
  }

  /**
   * Extract route from a specific voyage
   */
  private async extractRouteFromVoyage(
    voyageId: string,
    options: RouteExtractionOptions
  ): Promise<ExtractedRoute | null> {
    const voyage = await prisma.voyage.findUnique({
      where: { id: voyageId },
      include: {
        vessel: true,
        departurePort: true,
        arrivalPort: true
      }
    });

    if (!voyage || !voyage.departurePort || !voyage.arrivalPort || !voyage.atd || !voyage.ata) {
      return null;
    }

    // Get AIS positions for this voyage
    const positions = await this.getVoyagePositions(
      voyage.vesselId,
      voyage.atd,
      voyage.ata,
      options
    );

    if (positions.length < options.minPositions) {
      logger.warn(`Insufficient positions: ${positions.length} < ${options.minPositions}`);
      return null;
    }

    // Calculate route metrics
    const actualDistance = this.calculateTotalDistance(positions);
    const greatCircle = this.haversineDistance(
      voyage.departurePort.latitude!,
      voyage.departurePort.longitude!,
      voyage.arrivalPort.latitude!,
      voyage.arrivalPort.longitude!
    );
    const distanceFactor = actualDistance / greatCircle;
    const durationHours = (voyage.ata.getTime() - voyage.atd.getTime()) / (1000 * 60 * 60);
    const avgSpeed = actualDistance / durationHours;

    // Calculate quality metrics
    const quality = this.calculateQualityScore(positions, options, durationHours);

    // Detect route type and via points
    const { routeType, viaPoints } = await this.classifyRoute(
      voyage.departurePort,
      voyage.arrivalPort,
      positions
    );

    return {
      id: `route_${voyageId}`,
      vesselId: voyage.vesselId,
      vesselName: voyage.vessel.name,
      vesselType: voyage.vessel.type,
      imo: voyage.vessel.imo,

      originPortId: voyage.departurePort.id,
      originPortName: voyage.departurePort.name,
      originLat: voyage.departurePort.latitude!,
      originLng: voyage.departurePort.longitude!,
      departureTime: voyage.atd,

      destPortId: voyage.arrivalPort.id,
      destPortName: voyage.arrivalPort.name,
      destLat: voyage.arrivalPort.latitude!,
      destLng: voyage.arrivalPort.longitude!,
      arrivalTime: voyage.ata,

      positions,
      totalPositions: positions.length,
      greatCircleNm: greatCircle,
      actualSailedNm: actualDistance,
      distanceFactor,
      durationHours,
      avgSpeedKnots: avgSpeed,

      qualityScore: quality.score,
      coveragePercent: quality.coverage,
      hasGaps: quality.hasGaps,
      maxGapHours: quality.maxGapHours,

      routeType,
      viaPoints,

      extractedAt: new Date()
    };
  }

  /**
   * Get vessel positions for a voyage with filtering
   */
  private async getVoyagePositions(
    vesselId: string,
    startTime: Date,
    endTime: Date,
    options: RouteExtractionOptions
  ): Promise<RoutePosition[]> {
    const rawPositions = await prisma.vesselPosition.findMany({
      where: {
        vesselId,
        timestamp: {
          gte: startTime,
          lte: endTime
        },
        speed: {
          gte: options.speedFilter.min,
          lte: options.speedFilter.max
        }
      },
      orderBy: {
        timestamp: 'asc'
      },
      select: {
        latitude: true,
        longitude: true,
        speed: true,
        course: true,
        timestamp: true
      }
    });

    // Convert to RoutePosition format and clean outliers
    const positions: RoutePosition[] = rawPositions.map(p => ({
      lat: p.latitude,
      lng: p.longitude,
      speed: p.speed,
      course: p.course,
      timestamp: p.timestamp
    }));

    // Remove GPS outliers (positions with impossible jumps)
    return this.removeOutliers(positions);
  }

  /**
   * Remove GPS outliers and impossible positions
   */
  private removeOutliers(positions: RoutePosition[]): RoutePosition[] {
    if (positions.length < 2) return positions;

    const cleaned: RoutePosition[] = [positions[0]];

    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];

      const distance = this.haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      const timeHours = (curr.timestamp.getTime() - prev.timestamp.getTime()) / (1000 * 60 * 60);
      const impliedSpeed = distance / timeHours;

      // Check if speed is realistic (vessels rarely go > 35 knots)
      if (impliedSpeed < 50) {  // 50 knots as absolute max (including some GPS error margin)
        cleaned.push(curr);
      } else {
        logger.warn(`Outlier removed: ${impliedSpeed.toFixed(1)} knots between positions`);
      }
    }

    return cleaned;
  }

  /**
   * Calculate quality score based on coverage and consistency
   */
  private calculateQualityScore(
    positions: RoutePosition[],
    options: RouteExtractionOptions,
    durationHours: number
  ): {
    score: number;
    coverage: number;
    hasGaps: boolean;
    maxGapHours: number;
  } {
    if (positions.length < 2) {
      return { score: 0, coverage: 0, hasGaps: true, maxGapHours: 999 };
    }

    // Calculate expected number of positions (AIS reports every 2-10 minutes typically)
    const expectedPositions = durationHours * 6; // Assuming 1 report per 10 minutes
    const coverage = Math.min(1, positions.length / expectedPositions) * 100;

    // Find largest gap
    let maxGapHours = 0;
    let hasGaps = false;

    for (let i = 1; i < positions.length; i++) {
      const gapHours = (positions[i].timestamp.getTime() - positions[i - 1].timestamp.getTime()) / (1000 * 60 * 60);
      if (gapHours > maxGapHours) {
        maxGapHours = gapHours;
      }
      if (gapHours > options.maxGapHours) {
        hasGaps = true;
      }
    }

    // Calculate speed consistency
    const speeds = positions.filter(p => p.speed > 0).map(p => p.speed);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const speedStdDev = Math.sqrt(
      speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) / speeds.length
    );
    const speedConsistency = Math.max(0, 1 - (speedStdDev / avgSpeed));

    // Overall quality score (weighted average)
    const score = (
      coverage / 100 * 0.4 +           // 40% weight on coverage
      speedConsistency * 0.3 +         // 30% weight on speed consistency
      (hasGaps ? 0 : 0.3)             // 30% weight on no large gaps
    );

    return {
      score: Math.max(0, Math.min(1, score)),
      coverage,
      hasGaps,
      maxGapHours
    };
  }

  /**
   * Classify route type and identify via points
   */
  private async classifyRoute(
    origin: any,
    destination: any,
    positions: RoutePosition[]
  ): Promise<{ routeType: ExtractedRoute['routeType']; viaPoints: string[] }> {
    const viaPoints: string[] = [];
    let routeType: ExtractedRoute['routeType'] = 'UNKNOWN';

    // Check for major chokepoints
    const chokepoints = [
      { name: 'Suez Canal', lat: 30.5, lng: 32.3, radius: 50 },
      { name: 'Panama Canal', lat: 9.0, lng: -79.5, radius: 50 },
      { name: 'Malacca Strait', lat: 1.3, lng: 103.5, radius: 100 },
      { name: 'Gibraltar Strait', lat: 36.0, lng: -5.4, radius: 50 },
      { name: 'Bosphorus', lat: 41.0, lng: 29.0, radius: 30 },
      { name: 'Singapore Strait', lat: 1.2, lng: 103.8, radius: 50 }
    ];

    // Check if route passes through any chokepoints
    for (const chokepoint of chokepoints) {
      const passesThrough = positions.some(pos =>
        this.haversineDistance(pos.lat, pos.lng, chokepoint.lat, chokepoint.lng) < chokepoint.radius
      );

      if (passesThrough) {
        viaPoints.push(chokepoint.name);

        // Classify as canal route if passes through canal
        if (chokepoint.name.includes('Canal')) {
          routeType = 'VIA_CANAL';
        }
      }
    }

    // If no canals, check if coastal or direct
    if (routeType === 'UNKNOWN') {
      const greatCircle = this.haversineDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
      const actualDistance = this.calculateTotalDistance(positions);
      const distanceFactor = actualDistance / greatCircle;

      // If actual distance is very close to great circle, it's direct
      if (distanceFactor < 1.1) {
        routeType = 'DIRECT';
      } else if (distanceFactor < 1.3) {
        routeType = 'COASTAL';
      }
    }

    return { routeType, viaPoints };
  }

  /**
   * Calculate total distance traveled along route
   */
  private calculateTotalDistance(positions: RoutePosition[]): number {
    let total = 0;
    for (let i = 1; i < positions.length; i++) {
      total += this.haversineDistance(
        positions[i - 1].lat,
        positions[i - 1].lng,
        positions[i].lat,
        positions[i].lng
      );
    }
    return total;
  }

  /**
   * Haversine distance in nautical miles
   */
  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3440.065; // Earth radius in nautical miles
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  /**
   * Save extracted routes to database for training
   */
  async saveExtractedRoutes(routes: ExtractedRoute[]): Promise<void> {
    logger.info(`💾 Saving ${routes.length} extracted routes to database`);

    for (const route of routes) {
      try {
        // This will be used to train the distance model later
        await prisma.extractedAISRoute.create({
          data: {
            vesselId: route.vesselId,
            originPortId: route.originPortId,
            destPortId: route.destPortId,
            vesselType: route.vesselType,

            departureTime: route.departureTime,
            arrivalTime: route.arrivalTime,

            greatCircleNm: route.greatCircleNm,
            actualSailedNm: route.actualSailedNm,
            distanceFactor: route.distanceFactor,
            durationHours: route.durationHours,
            avgSpeedKnots: route.avgSpeedKnots,

            qualityScore: route.qualityScore,
            coveragePercent: route.coveragePercent,
            totalPositions: route.totalPositions,

            routeType: route.routeType,
            viaPoints: route.viaPoints,

            // Store simplified positions (we don't need all thousands of points)
            positionsData: this.simplifyPositions(route.positions, 50) // Store ~50 key points
          }
        });
      } catch (error) {
        logger.error(`Failed to save route ${route.id}:`, error);
      }
    }

    logger.info(`✅ Saved ${routes.length} routes to database`);
  }

  /**
   * Simplify route positions using Douglas-Peucker algorithm
   */
  private simplifyPositions(positions: RoutePosition[], targetCount: number): any {
    // For now, simple sampling. TODO: Implement Douglas-Peucker
    const step = Math.max(1, Math.floor(positions.length / targetCount));
    const simplified = positions.filter((_, i) => i % step === 0);

    // Always include first and last
    if (simplified[0] !== positions[0]) {
      simplified.unshift(positions[0]);
    }
    if (simplified[simplified.length - 1] !== positions[positions.length - 1]) {
      simplified.push(positions[positions.length - 1]);
    }

    return simplified.map(p => ({
      lat: p.lat,
      lng: p.lng,
      speed: p.speed,
      timestamp: p.timestamp
    }));
  }
}

// Export singleton
export const aisRouteExtractor = new AISRouteExtractor();
