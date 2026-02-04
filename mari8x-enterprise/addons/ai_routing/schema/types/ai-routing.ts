/**
 * Mari8X AI Routing - GraphQL Schema (Enterprise)
 * Intelligent routing based on live AIS data
 */

import { Express } from 'express';
import { Mari8XRouteEngine } from '../../src/mari8x-route-engine.js';

const engine = new Mari8XRoute Engine();

/**
 * Register GraphQL types and resolvers
 * This extends the community schema with enterprise routing features
 */
export function registerAIRoutingTypes(builder: any, prisma: any) {
  // ========== OUTPUT TYPES ==========

  const MLRouteWaypoint = builder.objectType('MLRouteWaypoint', {
    fields: (t: any) => ({
      latitude: t.float(),
      longitude: t.float(),
    }),
  });

  const MLRouteRecommendation = builder.objectType('MLRouteRecommendation', {
    fields: (t: any) => ({
      totalDistanceNm: t.float(),
      estimatedDays: t.float(),
      averageSpeedKnots: t.float(),
      waypoints: t.field({ type: [MLRouteWaypoint] }),
      confidence: t.float(),
      basedOnVesselCount: t.int(),
    }),
  });

  const RouteTrafficDensity = builder.objectType('RouteTrafficDensity', {
    fields: (t: any) => ({
      vesselsNearRoute: t.int(),
      congestionLevel: t.string(),
    }),
  });

  const RouteDeviationStatus = builder.objectType('RouteDeviationStatus', {
    fields: (t: any) => ({
      isDeviating: t.boolean(),
      currentPosition: t.field({
        type: builder.objectType('Position', {
          fields: (t: any) => ({
            latitude: t.float(),
            longitude: t.float(),
          }),
        }),
        nullable: true,
      }),
      deviationDistanceNm: t.float({ nullable: true }),
      nearestWaypointIndex: t.int({ nullable: true }),
    }),
  });

  // ========== QUERIES ==========

  builder.queryFields((t: any) => ({
    // ML-powered route recommendation (uses live AIS data)
    mlRouteRecommendation: t.field({
      type: MLRouteRecommendation,
      args: {
        fromUnlocode: t.arg.string({ required: true }),
        toUnlocode: t.arg.string({ required: true }),
        vesselType: t.arg.string({ required: false }),
        speedKnots: t.arg.float({ required: false }),
      },
      resolve: async (_: any, args: any) => {
        // Get port coordinates
        const fromPort = await prisma.port.findUnique({
          where: { unlocode: args.fromUnlocode },
        });
        const toPort = await prisma.port.findUnique({
          where: { unlocode: args.toUnlocode },
        });

        if (!fromPort || !toPort || !fromPort.lat || !toPort.lat) {
          throw new Error('Port not found or missing coordinates');
        }

        // Call route engine
        const result = await engine.recommendRoute(
          fromPort.lat,
          fromPort.lng!,
          toPort.lat,
          toPort.lng!,
          args.vesselType || undefined
        );

        const estimatedSpeed = args.speedKnots || result.averageSpeed || 12;
        const estimatedDays = result.distance / (estimatedSpeed * 24);

        return {
          totalDistanceNm: result.distance,
          estimatedDays,
          averageSpeedKnots: result.averageSpeed,
          waypoints: result.waypoints,
          confidence: result.confidence,
          basedOnVesselCount: result.basedOnVessels,
        };
      },
    }),

    // Traffic density analysis along route
    routeTrafficAnalysis: t.field({
      type: RouteTrafficDensity,
      args: {
        fromUnlocode: t.arg.string({ required: true }),
        toUnlocode: t.arg.string({ required: true }),
        radiusNm: t.arg.float({ required: false, defaultValue: 50 }),
      },
      resolve: async (_: any, args: any) => {
        // Get port coordinates
        const fromPort = await prisma.port.findUnique({
          where: { unlocode: args.fromUnlocode },
        });
        const toPort = await prisma.port.findUnique({
          where: { unlocode: args.toUnlocode },
        });

        if (!fromPort || !toPort || !fromPort.lat || !toPort.lat) {
          throw new Error('Port not found or missing coordinates');
        }

        // Get route waypoints
        const route = await engine.recommendRoute(
          fromPort.lat,
          fromPort.lng!,
          toPort.lat,
          toPort.lng!
        );

        // Find vessels near route
        const nearbyVessels = await engine.getVesselsNearRoute(
          route.waypoints,
          args.radiusNm || 50
        );

        return {
          vesselsNearRoute: nearbyVessels.length,
          congestionLevel:
            nearbyVessels.length < 10
              ? 'low'
              : nearbyVessels.length < 50
              ? 'moderate'
              : 'high',
        };
      },
    }),

    // Route deviation detection
    checkRouteDeviation: t.field({
      type: RouteDeviationStatus,
      args: {
        vesselId: t.arg.string({ required: true }),
        plannedWaypoints: t.arg({
          type: [
            builder.inputType('WaypointInput', {
              fields: (t: any) => ({
                latitude: t.float({ required: true }),
                longitude: t.float({ required: true }),
              }),
            }),
          ],
          required: true,
        }),
        maxDeviationNm: t.arg.float({ required: false, defaultValue: 50 }),
      },
      resolve: async (_: any, args: any) => {
        const waypoints = args.plannedWaypoints.map((wp: any) => ({
          lat: wp.latitude,
          lng: wp.longitude,
        }));

        const deviation = await engine.detectRouteDeviation(
          args.vesselId,
          waypoints,
          args.maxDeviationNm || 50
        );

        return {
          isDeviating: deviation.isDeviating,
          currentPosition: deviation.currentPosition
            ? {
                latitude: deviation.currentPosition.lat,
                longitude: deviation.currentPosition.lng,
              }
            : null,
          deviationDistanceNm: deviation.deviationDistance,
          nearestWaypointIndex: deviation.nearestWaypoint?.index || null,
        };
      },
    }),
  }));
}
