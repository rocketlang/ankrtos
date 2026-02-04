/**
 * Fleet Collaborative Route Learning
 *
 * YOUR BRILLIANT IDEA:
 * "Ship A ahead, Ship B middle, Ship C behind - all contribute to Ship D's route!"
 *
 * This creates a "living route" that:
 * - Learns from vessels currently in transit
 * - Merges data as vessels progress
 * - Creates optimal "global route" from fleet experience
 * - Gets better in REAL-TIME!
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface FleetVesselPosition {
  vesselId: string;
  vesselName: string;
  vesselType: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  routeProgress: number; // 0-100%
}

export interface FleetRoute {
  originPortId: string;
  destPortId: string;
  vesselType: string;

  // Vessels currently on this route
  activeVessels: FleetVesselPosition[];

  // Merged route data
  segments: FleetRouteSegment[];

  // Fleet intelligence
  avgSpeed: number;
  avgFuelPerDay: number;
  currentWeather: string;
  trafficLevel: string;

  confidence: number; // Based on number of active vessels
  lastUpdated: Date;
}

export interface FleetRouteSegment {
  segmentName: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;

  // Data from vessels that passed through
  avgSpeed: number;
  avgTime: number;
  observations: number; // How many vessels reported

  // Real-time data from vessels currently here
  currentVessels: number;
  currentConditions: string;

  confidence: number;
}

export class FleetCollaborativeLearner {
  /**
   * YOUR IDEA: Find all vessels on the same route (A, B, C ahead/behind)
   */
  async findFleetOnRoute(
    originPortId: string,
    destPortId: string,
    vesselType: string
  ): Promise<FleetRoute> {
    console.log(`🚢 Finding fleet: ${originPortId} → ${destPortId} (${vesselType})`);

    // Step 1: Find vessels currently on this route
    // (Vessels that departed from origin and haven't arrived at destination yet)
    const activeVessels = await prisma.voyage.findMany({
      where: {
        departurePortId: originPortId,
        arrivalPortId: destPortId,
        status: 'in_progress',
        vessel: { type: vesselType },
        atd: { not: null }, // Actually departed
        ata: null, // Not yet arrived
      },
      include: {
        vessel: {
          select: {
            id: true,
            name: true,
            type: true,
            positions: {
              orderBy: { timestamp: 'desc' },
              take: 1, // Latest position
            },
          },
        },
      },
      take: 50, // Max 50 vessels
    });

    console.log(`  Found ${activeVessels.length} vessels currently on route`);

    // Step 2: Get current positions of these vessels
    const fleetPositions: FleetVesselPosition[] = activeVessels
      .filter(v => v.vessel.positions.length > 0)
      .map(v => {
        const pos = v.vessel.positions[0];

        // Calculate route progress (simplified)
        const progress = this.calculateRouteProgress(
          v.departurePort?.latitude || 0,
          v.departurePort?.longitude || 0,
          pos.latitude,
          pos.longitude,
          v.arrivalPort?.latitude || 0,
          v.arrivalPort?.longitude || 0
        );

        return {
          vesselId: v.vessel.id,
          vesselName: v.vessel.name,
          vesselType: v.vessel.type,
          latitude: pos.latitude,
          longitude: pos.longitude,
          speed: pos.speed || 0,
          heading: pos.heading || 0,
          timestamp: pos.timestamp,
          routeProgress: progress,
        };
      });

    // Step 3: Create route segments from fleet data
    const segments = await this.createFleetRouteSegments(
      originPortId,
      destPortId,
      vesselType,
      fleetPositions
    );

    // Step 4: Calculate fleet-wide statistics
    const avgSpeed = fleetPositions.length > 0
      ? fleetPositions.reduce((sum, v) => sum + v.speed, 0) / fleetPositions.length
      : 14;

    const confidence = Math.min(1.0, fleetPositions.length * 0.15); // More vessels = higher confidence

    console.log(`  📊 Fleet intelligence: ${fleetPositions.length} vessels, avg speed ${avgSpeed.toFixed(1)}kn, confidence ${(confidence * 100).toFixed(0)}%`);

    return {
      originPortId,
      destPortId,
      vesselType,
      activeVessels: fleetPositions,
      segments,
      avgSpeed,
      avgFuelPerDay: 30, // TODO: Calculate from actual data
      currentWeather: 'GOOD', // TODO: Integrate weather data
      trafficLevel: fleetPositions.length > 5 ? 'HIGH' : fleetPositions.length > 2 ? 'MEDIUM' : 'LOW',
      confidence,
      lastUpdated: new Date(),
    };
  }

  /**
   * YOUR IDEA: Create "global route" by merging all vessel paths
   */
  private async createFleetRouteSegments(
    originPortId: string,
    destPortId: string,
    vesselType: string,
    fleetPositions: FleetVesselPosition[]
  ): Promise<FleetRouteSegment[]> {
    // Get learned route pattern (historical data)
    const learnedPattern = await prisma.learnedRoutePattern.findFirst({
      where: { originPortId, destPortId, vesselType },
    });

    if (!learnedPattern) {
      console.log('  ⚠️  No learned pattern yet, using basic segments');
      return this.createBasicSegments(originPortId, destPortId);
    }

    const waypoints = learnedPattern.waypointPattern as any[];
    const segments: FleetRouteSegment[] = [];

    // Create segments between waypoints
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];

      // Find vessels currently in this segment
      const vesselsInSegment = fleetPositions.filter(v =>
        this.isVesselInSegment(v, from, to)
      );

      // Calculate segment metrics from vessels in this segment
      const avgSpeed = vesselsInSegment.length > 0
        ? vesselsInSegment.reduce((sum, v) => sum + v.speed, 0) / vesselsInSegment.length
        : learnedPattern.avgSpeedKnots;

      segments.push({
        segmentName: `Segment ${i + 1}`,
        fromLat: from.lat,
        fromLng: from.lng,
        toLat: to.lat,
        toLng: to.lng,
        avgSpeed,
        avgTime: 0, // TODO: Calculate from distance and speed
        observations: learnedPattern.observedCount,
        currentVessels: vesselsInSegment.length,
        currentConditions: vesselsInSegment.length > 0 ? 'REAL-TIME DATA' : 'HISTORICAL DATA',
        confidence: vesselsInSegment.length > 0 ? 0.9 : 0.6, // Higher confidence with active vessels
      });
    }

    return segments;
  }

  /**
   * Check if vessel is currently in this segment
   */
  private isVesselInSegment(
    vessel: FleetVesselPosition,
    segmentStart: any,
    segmentEnd: any
  ): boolean {
    // Simple bounding box check
    // TODO: Implement proper geometric containment
    const minLat = Math.min(segmentStart.lat, segmentEnd.lat);
    const maxLat = Math.max(segmentStart.lat, segmentEnd.lat);
    const minLng = Math.min(segmentStart.lng, segmentEnd.lng);
    const maxLng = Math.max(segmentStart.lng, segmentEnd.lng);

    return (
      vessel.latitude >= minLat &&
      vessel.latitude <= maxLat &&
      vessel.longitude >= minLng &&
      vessel.longitude <= maxLng
    );
  }

  /**
   * Calculate how far along the route a vessel is (0-100%)
   */
  private calculateRouteProgress(
    originLat: number,
    originLng: number,
    currentLat: number,
    currentLng: number,
    destLat: number,
    destLng: number
  ): number {
    const totalDistance = this.haversineDistance(originLat, originLng, destLat, destLng);
    const distanceTraveled = this.haversineDistance(originLat, originLng, currentLat, currentLng);
    return Math.min(100, (distanceTraveled / totalDistance) * 100);
  }

  /**
   * YOUR IDEA: Use fleet data to improve route for Ship D
   */
  async enhanceRouteWithFleetData(
    baseRoute: any,
    originPortId: string,
    destPortId: string,
    vesselType: string
  ): Promise<any> {
    const fleetRoute = await this.findFleetOnRoute(originPortId, destPortId, vesselType);

    if (fleetRoute.activeVessels.length === 0) {
      console.log('  ℹ️  No fleet data available, using base route');
      return baseRoute;
    }

    console.log(`  ✨ Enhancing route with data from ${fleetRoute.activeVessels.length} active vessels`);

    // Enhance confidence score based on fleet data
    const fleetConfidence = (baseRoute.confidenceScore + fleetRoute.confidence) / 2;

    // Enhance ETA based on fleet's actual speeds
    const enhancedHours = baseRoute.totalDistanceNm / fleetRoute.avgSpeed;

    // Add fleet intelligence to route
    return {
      ...baseRoute,
      confidenceScore: fleetConfidence,
      estimatedHours: enhancedHours,
      routeType: 'HYBRID', // Base + Fleet data
      fleetIntelligence: {
        activeVessels: fleetRoute.activeVessels.length,
        fleetAvgSpeed: fleetRoute.avgSpeed,
        trafficLevel: fleetRoute.trafficLevel,
        realTimeData: true,
        vesselsAhead: fleetRoute.activeVessels.filter(v => v.routeProgress > 50).length,
        vesselsBehind: fleetRoute.activeVessels.filter(v => v.routeProgress < 50).length,
      },
      warnings: [
        ...baseRoute.warnings,
        `✨ Route enhanced with real-time data from ${fleetRoute.activeVessels.length} vessels`,
      ],
    };
  }

  /**
   * Create basic segments when no learned pattern exists
   */
  private async createBasicSegments(
    originPortId: string,
    destPortId: string
  ): Promise<FleetRouteSegment[]> {
    const [origin, dest] = await Promise.all([
      prisma.port.findUnique({ where: { id: originPortId } }),
      prisma.port.findUnique({ where: { id: destPortId } }),
    ]);

    if (!origin || !dest) return [];

    // Create 3 basic segments
    const midLat = (origin.latitude! + dest.latitude!) / 2;
    const midLng = (origin.longitude! + dest.longitude!) / 2;

    return [
      {
        segmentName: 'Departure',
        fromLat: origin.latitude!,
        fromLng: origin.longitude!,
        toLat: midLat,
        toLng: midLng,
        avgSpeed: 14,
        avgTime: 0,
        observations: 0,
        currentVessels: 0,
        currentConditions: 'NO DATA',
        confidence: 0.3,
      },
      {
        segmentName: 'Mid-route',
        fromLat: midLat,
        fromLng: midLng,
        toLat: dest.latitude!,
        toLng: dest.longitude!,
        avgSpeed: 14,
        avgTime: 0,
        observations: 0,
        currentVessels: 0,
        currentConditions: 'NO DATA',
        confidence: 0.3,
      },
    ];
  }

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
}

export const fleetCollaborativeLearner = new FleetCollaborativeLearner();
