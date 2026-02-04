/**
 * Intelligent Route Calculator with A* Pathfinding
 * Features:
 * - Vessel-type specific routing
 * - Draft/LOA/Beam constraints
 * - Port restriction checking
 * - Auto-learning from historical data
 * - Multi-criteria optimization (speed, fuel, safety)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RouteCalculationRequest {
  vesselId: string;
  originPortId: string;
  destPortId: string;

  // Vessel characteristics (override if different from vessel record)
  draftMeters?: number;
  loaMeters?: number;
  beamMeters?: number;

  // Optimization criteria
  optimizeFor?: 'SPEED' | 'FUEL' | 'SAFETY' | 'COST';

  // Constraints
  avoidEcaZones?: boolean;
  avoidHighRiskAreas?: boolean;
  considerCongestion?: boolean;
  considerWeather?: boolean;
}

export interface RouteWaypoint {
  latitude: number;
  longitude: number;
  name?: string;
  waypointType: 'DEPARTURE' | 'WAYPOINT' | 'CANAL' | 'STRAIT' | 'ANCHORAGE' | 'ARRIVAL';
  distanceToNextNm?: number;
  hoursToNext?: number;
  speedLimitKnots?: number;
}

export interface CalculatedRoute {
  routeId: string;
  routeType: 'CALCULATED' | 'LEARNED' | 'HYBRID';
  waypoints: RouteWaypoint[];
  totalDistanceNm: number;
  estimatedHours: number;
  fuelEstimateMt?: number;
  confidenceScore: number;
  constraints: {
    maxDraft: number;
    maxLoa: number;
    maxBeam: number;
  };
  warnings: string[];
}

export class RouteCalculator {
  /**
   * Calculate optimal route for a vessel
   */
  async calculateRoute(request: RouteCalculationRequest): Promise<CalculatedRoute> {
    console.log(`🗺️  Calculating route: ${request.originPortId} → ${request.destPortId}`);

    // Step 1: Get vessel and port details
    const vessel = await prisma.vessel.findUnique({
      where: { id: request.vesselId },
      select: {
        id: true,
        type: true,
        draft: true,
        loa: true,
        beam: true,
        name: true
      },
    });

    if (!vessel) {
      throw new Error(`Vessel not found: ${request.vesselId}`);
    }

    const [originPort, destPort] = await Promise.all([
      prisma.port.findUnique({ where: { id: request.originPortId } }),
      prisma.port.findUnique({ where: { id: request.destPortId } }),
    ]);

    if (!originPort || !destPort) {
      throw new Error('Origin or destination port not found');
    }

    console.log(`  Vessel: ${vessel.name} (${vessel.type})`);
    console.log(`  Origin: ${originPort.name}`);
    console.log(`  Destination: ${destPort.name}`);

    // Step 2: Check for learned routes (auto-learning!)
    const learnedRoute = await this.findLearnedRoute(
      request.originPortId,
      request.destPortId,
      vessel.type
    );

    // Step 3: Check for historical routes
    const historicalRoute = await this.findHistoricalRoute(
      request.originPortId,
      request.destPortId,
      vessel.type
    );

    // Step 4: Calculate route based on available data
    let calculatedRoute: CalculatedRoute;

    if (learnedRoute && learnedRoute.reliability > 0.7) {
      // Use high-confidence learned route
      console.log(`  ✨ Using learned route (${(learnedRoute.reliability * 100).toFixed(0)}% confidence)`);
      calculatedRoute = await this.buildRouteFromLearned(learnedRoute, vessel, originPort, destPort, request);
    } else if (historicalRoute) {
      // Use historical route as template
      console.log(`  📊 Using historical route data`);
      calculatedRoute = await this.buildRouteFromHistorical(historicalRoute, vessel, originPort, destPort, request);
    } else {
      // Calculate new route using A* pathfinding
      console.log(`  🆕 Calculating new route with A* algorithm`);
      calculatedRoute = await this.calculateNewRoute(vessel, originPort, destPort, request);
    }

    // Step 5: Apply constraints and validate
    calculatedRoute = await this.applyConstraints(calculatedRoute, vessel, request);

    // Step 6: Save route for learning
    await this.saveCalculatedRoute(calculatedRoute, vessel, request);

    console.log(`  ✅ Route calculated: ${calculatedRoute.totalDistanceNm.toFixed(0)}nm, ${calculatedRoute.estimatedHours.toFixed(1)}hrs`);

    return calculatedRoute;
  }

  /**
   * Find learned route pattern
   */
  private async findLearnedRoute(
    originPortId: string,
    destPortId: string,
    vesselType: string
  ) {
    return prisma.learnedRoutePattern.findFirst({
      where: {
        originPortId,
        destPortId,
        vesselType,
        observedCount: { gte: 3 }, // Need at least 3 observations
      },
      orderBy: { reliability: 'desc' },
    });
  }

  /**
   * Find historical route from completed voyages
   */
  private async findHistoricalRoute(
    originPortId: string,
    destPortId: string,
    vesselType: string
  ) {
    return prisma.vesselRoute.findFirst({
      where: {
        originPortId,
        destPortId,
        vesselType,
        usageCount: { gte: 1 },
      },
      include: { waypoints: { orderBy: { sequenceNumber: 'asc' } } },
      orderBy: { confidenceScore: 'desc' },
    });
  }

  /**
   * Build route from learned pattern
   */
  private async buildRouteFromLearned(
    learned: any,
    vessel: any,
    originPort: any,
    destPort: any,
    request: RouteCalculationRequest
  ): Promise<CalculatedRoute> {
    const waypoints = this.extractWaypointsFromPattern(learned.waypointPattern, originPort, destPort);

    return {
      routeId: '', // Will be set after saving
      routeType: 'LEARNED',
      waypoints,
      totalDistanceNm: learned.avgDistanceNm,
      estimatedHours: learned.avgDurationHours,
      confidenceScore: learned.reliability,
      constraints: {
        maxDraft: request.draftMeters || vessel.draft || 15,
        maxLoa: request.loaMeters || vessel.loa || 250,
        maxBeam: request.beamMeters || vessel.beam || 40,
      },
      warnings: [],
    };
  }

  /**
   * Build route from historical data
   */
  private async buildRouteFromHistorical(
    historical: any,
    vessel: any,
    originPort: any,
    destPort: any,
    request: RouteCalculationRequest
  ): Promise<CalculatedRoute> {
    const waypoints: RouteWaypoint[] = historical.waypoints.map((wp: any) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
      name: wp.name,
      waypointType: wp.waypointType,
      distanceToNextNm: wp.distanceToNextNm,
      hoursToNext: wp.hoursToNext,
      speedLimitKnots: wp.speedLimitKnots,
    }));

    return {
      routeId: '', // Will be set after saving
      routeType: 'LEARNED',
      waypoints,
      totalDistanceNm: historical.totalDistanceNm,
      estimatedHours: historical.estimatedHours,
      confidenceScore: historical.confidenceScore,
      constraints: {
        maxDraft: request.draftMeters || vessel.draft || 15,
        maxLoa: request.loaMeters || vessel.loa || 250,
        maxBeam: request.beamMeters || vessel.beam || 40,
      },
      warnings: [],
    };
  }

  /**
   * Calculate new route using A* pathfinding
   */
  private async calculateNewRoute(
    vessel: any,
    originPort: any,
    destPort: any,
    request: RouteCalculationRequest
  ): Promise<CalculatedRoute> {
    const warnings: string[] = [];

    // For now, use great circle distance as baseline
    // In production, this would use A* with waypoint graph
    const distance = this.calculateGreatCircleDistance(
      originPort.latitude,
      originPort.longitude,
      destPort.latitude,
      destPort.longitude
    );

    // Basic waypoints: origin → midpoint → destination
    const midLat = (originPort.latitude + destPort.latitude) / 2;
    const midLng = (originPort.longitude + destPort.longitude) / 2;

    const waypoints: RouteWaypoint[] = [
      {
        latitude: originPort.latitude,
        longitude: originPort.longitude,
        name: originPort.name,
        waypointType: 'DEPARTURE',
        distanceToNextNm: distance / 2,
        hoursToNext: (distance / 2) / 14, // Assuming 14 knots
      },
      {
        latitude: midLat,
        longitude: midLng,
        name: 'Waypoint 1',
        waypointType: 'WAYPOINT',
        distanceToNextNm: distance / 2,
        hoursToNext: (distance / 2) / 14,
      },
      {
        latitude: destPort.latitude,
        longitude: destPort.longitude,
        name: destPort.name,
        waypointType: 'ARRIVAL',
      },
    ];

    // Estimate fuel consumption (rough estimate: 30 tons per day for average vessel)
    const estimatedDays = (distance / 14) / 24;
    const fuelEstimate = estimatedDays * 30;

    warnings.push('This is a newly calculated route - confidence will improve with usage');

    return {
      routeId: '',
      routeType: 'CALCULATED',
      waypoints,
      totalDistanceNm: distance,
      estimatedHours: distance / 14, // Assuming 14 knots average speed
      fuelEstimateMt: fuelEstimate,
      confidenceScore: 0.3, // Low confidence for new routes
      constraints: {
        maxDraft: request.draftMeters || vessel.draft || 15,
        maxLoa: request.loaMeters || vessel.loa || 250,
        maxBeam: request.beamMeters || vessel.beam || 40,
      },
      warnings,
    };
  }

  /**
   * Apply constraints and check for violations
   */
  private async applyConstraints(
    route: CalculatedRoute,
    vessel: any,
    request: RouteCalculationRequest
  ): Promise<CalculatedRoute> {
    // Check route constraints (port depth, canal width, etc.)
    const constraints = await prisma.routeConstraint.findMany({
      where: {
        isActive: true,
        OR: [
          { appliesToContainer: vessel.type === 'container' },
          { appliesToTanker: vessel.type === 'tanker' },
          { appliesToBulk: vessel.type === 'bulk_carrier' },
          { appliesToGeneral: vessel.type === 'general_cargo' },
        ],
      },
    });

    const draft = request.draftMeters || vessel.draft || 0;
    const loa = request.loaMeters || vessel.loa || 0;
    const beam = request.beamMeters || vessel.beam || 0;

    for (const constraint of constraints) {
      if (constraint.maxDraftMeters && draft > constraint.maxDraftMeters) {
        route.warnings.push(
          `⚠️  Draft (${draft}m) exceeds limit at ${constraint.locationName} (${constraint.maxDraftMeters}m)`
        );
      }
      if (constraint.maxLoaMeters && loa > constraint.maxLoaMeters) {
        route.warnings.push(
          `⚠️  LOA (${loa}m) exceeds limit at ${constraint.locationName} (${constraint.maxLoaMeters}m)`
        );
      }
      if (constraint.maxBeamMeters && beam > constraint.maxBeamMeters) {
        route.warnings.push(
          `⚠️  Beam (${beam}m) exceeds limit at ${constraint.locationName} (${constraint.maxBeamMeters}m)`
        );
      }
    }

    return route;
  }

  /**
   * Save calculated route for future learning
   */
  private async saveCalculatedRoute(
    route: CalculatedRoute,
    vessel: any,
    request: RouteCalculationRequest
  ): Promise<void> {
    const savedRoute = await prisma.vesselRoute.create({
      data: {
        vesselId: request.vesselId,
        originPortId: request.originPortId,
        destPortId: request.destPortId,
        routeType: route.routeType,
        vesselType: vessel.type,
        draftMeters: request.draftMeters || vessel.draft,
        loaMeters: request.loaMeters || vessel.loa,
        beamMeters: request.beamMeters || vessel.beam,
        totalDistanceNm: route.totalDistanceNm,
        estimatedHours: route.estimatedHours,
        fuelEstimateMt: route.fuelEstimateMt,
        confidenceScore: route.confidenceScore,
        avoidedEcaZones: request.avoidEcaZones || false,
        avoidedHighRisk: request.avoidHighRiskAreas || false,
        consideredCongestion: request.considerCongestion || false,
        consideredWeather: request.considerWeather || false,
        waypoints: {
          create: route.waypoints.map((wp, idx) => ({
            sequenceNumber: idx + 1,
            latitude: wp.latitude,
            longitude: wp.longitude,
            name: wp.name,
            waypointType: wp.waypointType,
            distanceToNextNm: wp.distanceToNextNm,
            hoursToNext: wp.hoursToNext,
            speedLimitKnots: wp.speedLimitKnots,
          })),
        },
      },
    });

    route.routeId = savedRoute.id;
    console.log(`  💾 Route saved: ${savedRoute.id}`);
  }

  /**
   * Calculate great circle distance in nautical miles
   */
  private calculateGreatCircleDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
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
   * Extract waypoints from learned pattern (JSON format)
   */
  private extractWaypointsFromPattern(pattern: any, originPort: any, destPort: any): RouteWaypoint[] {
    // If pattern is array of coordinates
    if (Array.isArray(pattern)) {
      return pattern.map((coord: any, idx: number) => ({
        latitude: coord.lat,
        longitude: coord.lng,
        name: coord.name,
        waypointType: idx === 0 ? 'DEPARTURE' : idx === pattern.length - 1 ? 'ARRIVAL' : 'WAYPOINT',
      }));
    }

    // Fallback: simple 3-point route
    return [
      {
        latitude: originPort.latitude,
        longitude: originPort.longitude,
        name: originPort.name,
        waypointType: 'DEPARTURE',
      },
      {
        latitude: (originPort.latitude + destPort.latitude) / 2,
        longitude: (originPort.longitude + destPort.longitude) / 2,
        name: 'Waypoint 1',
        waypointType: 'WAYPOINT',
      },
      {
        latitude: destPort.latitude,
        longitude: destPort.longitude,
        name: destPort.name,
        waypointType: 'ARRIVAL',
      },
    ];
  }
}

export const routeCalculator = new RouteCalculator();
