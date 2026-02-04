/**
 * Mari8X Route Engine - GraphQL Schema
 * Intelligent routing based on 11.6M+ AIS positions
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';
import { Mari8XRouteEngine } from '../../services/routing/mari8x-route-engine.js';

const engine = new Mari8XRouteEngine();

// ========== OUTPUT TYPES ==========

const MLRouteWaypoint = builder.objectType('MLRouteWaypoint', {
  fields: (t) => ({
    latitude: t.float(),
    longitude: t.float(),
  }),
});

const MLRouteRecommendation = builder.objectType('MLRouteRecommendation', {
  fields: (t) => ({
    totalDistanceNm: t.float(),
    estimatedDays: t.float(),
    averageSpeedKnots: t.float(),
    waypoints: t.field({ type: [MLRouteWaypoint] }),
    confidence: t.float(),
    basedOnVesselCount: t.int(),
  }),
});

const RouteTrafficDensity = builder.objectType('RouteTrafficDensity', {
  fields: (t) => ({
    vesselsNearRoute: t.int(),
    congestionLevel: t.string(),
  }),
});

// ========== QUERIES ==========

builder.queryFields((t) => ({
  // ML-powered route recommendation (uses 11.6M AIS positions)
  mlRouteRecommendation: t.field({
    type: MLRouteRecommendation,
    args: {
      fromUnlocode: t.arg.string({ required: true }),
      toUnlocode: t.arg.string({ required: true }),
      vesselType: t.arg.string({ required: false }),
      speedKnots: t.arg.float({ required: false }),
    },
    resolve: async (_, args) => {
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
    resolve: async (_, args) => {
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
}));
