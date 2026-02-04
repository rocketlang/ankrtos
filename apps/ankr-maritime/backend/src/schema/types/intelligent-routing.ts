/**
 * GraphQL Schema for Intelligent Routing Engine with Auto-Learning
 */

import { builder } from '../builder.js';
import { prisma } from '../context.js';
import { routeCalculator } from '../../services/routing/route-calculator.js';
import { historicalRouteAnalyzer } from '../../services/routing/historical-route-analyzer.js';
import { fleetCollaborativeLearner } from '../../services/routing/fleet-collaborative-learner.js';

// ===============================
// TYPES
// ===============================

// Vessel Route
builder.prismaObject('VesselRoute', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    originPortId: t.exposeString('originPortId'),
    destPortId: t.exposeString('destPortId'),

    routeType: t.exposeString('routeType'),
    vesselType: t.exposeString('vesselType'),

    draftMeters: t.exposeFloat('draftMeters', { nullable: true }),
    loaMeters: t.exposeFloat('loaMeters', { nullable: true }),
    beamMeters: t.exposeFloat('beamMeters', { nullable: true }),

    totalDistanceNm: t.exposeFloat('totalDistanceNm'),
    estimatedHours: t.exposeFloat('estimatedHours'),
    fuelEstimateMt: t.exposeFloat('fuelEstimateMt', { nullable: true }),
    confidenceScore: t.exposeFloat('confidenceScore'),

    usageCount: t.exposeInt('usageCount'),
    successRate: t.exposeFloat('successRate'),
    avgActualHours: t.exposeFloat('avgActualHours', { nullable: true }),
    lastUsedAt: t.expose('lastUsedAt', { type: 'DateTime', nullable: true }),

    avoidedEcaZones: t.exposeBoolean('avoidedEcaZones'),
    avoidedHighRisk: t.exposeBoolean('avoidedHighRisk'),
    consideredCongestion: t.exposeBoolean('consideredCongestion'),
    consideredWeather: t.exposeBoolean('consideredWeather'),

    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),

    vessel: t.relation('vessel'),
    originPort: t.relation('originPort'),
    destPort: t.relation('destPort'),
    waypoints: t.relation('waypoints'),
    qualityLogs: t.relation('qualityLogs'),
  }),
});

// Route Waypoint
builder.prismaObject('VesselRouteWaypoint', {
  fields: (t) => ({
    id: t.exposeID('id'),
    routeId: t.exposeString('routeId'),
    sequenceNumber: t.exposeInt('sequenceNumber'),

    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    name: t.exposeString('name', { nullable: true }),
    waypointType: t.exposeString('waypointType'),

    distanceToNextNm: t.exposeFloat('distanceToNextNm', { nullable: true }),
    hoursToNext: t.exposeFloat('hoursToNext', { nullable: true }),

    minDraftMeters: t.exposeFloat('minDraftMeters', { nullable: true }),
    maxDraftMeters: t.exposeFloat('maxDraftMeters', { nullable: true }),
    speedLimitKnots: t.exposeFloat('speedLimitKnots', { nullable: true }),

    avgSpeedKnots: t.exposeFloat('avgSpeedKnots', { nullable: true }),
    trafficDensity: t.exposeString('trafficDensity', { nullable: true }),

    route: t.relation('route'),
  }),
});

// Learned Route Pattern
builder.prismaObject('LearnedRoutePattern', {
  fields: (t) => ({
    id: t.exposeID('id'),
    originPortId: t.exposeString('originPortId'),
    destPortId: t.exposeString('destPortId'),
    vesselType: t.exposeString('vesselType'),

    patternName: t.exposeString('patternName'),
    description: t.exposeString('description', { nullable: true }),

    observedCount: t.exposeInt('observedCount'),
    firstObservedAt: t.expose('firstObservedAt', { type: 'DateTime' }),
    lastObservedAt: t.expose('lastObservedAt', { type: 'DateTime' }),

    avgDistanceNm: t.exposeFloat('avgDistanceNm'),
    avgDurationHours: t.exposeFloat('avgDurationHours'),
    avgSpeedKnots: t.exposeFloat('avgSpeedKnots'),

    preferredMonths: t.exposeString('preferredMonths', { nullable: true }),

    reliability: t.exposeFloat('reliability'),
    popularity: t.exposeFloat('popularity'),

    waypointPattern: t.expose('waypointPattern', { type: 'JSON' }),

    originPort: t.relation('originPort'),
    destPort: t.relation('destPort'),
  }),
});

// Route Quality Log
builder.prismaObject('RouteQualityLog', {
  fields: (t) => ({
    id: t.exposeID('id'),
    routeId: t.exposeString('routeId'),
    voyageId: t.exposeString('voyageId', { nullable: true }),

    plannedHours: t.exposeFloat('plannedHours'),
    actualHours: t.exposeFloat('actualHours', { nullable: true }),
    plannedFuelMt: t.exposeFloat('plannedFuelMt', { nullable: true }),
    actualFuelMt: t.exposeFloat('actualFuelMt', { nullable: true }),

    onTimeArrival: t.exposeBoolean('onTimeArrival'),
    delayHours: t.exposeFloat('delayHours', { nullable: true }),
    delayReason: t.exposeString('delayReason', { nullable: true }),

    weatherConditions: t.exposeString('weatherConditions', { nullable: true }),
    congestionMet: t.exposeBoolean('congestionMet'),
    routeDeviation: t.exposeFloat('routeDeviation', { nullable: true }),

    completed: t.exposeBoolean('completed'),
    completedAt: t.expose('completedAt', { type: 'DateTime', nullable: true }),

    wouldRecommend: t.exposeBoolean('wouldRecommend'),
    issuesEncountered: t.exposeString('issuesEncountered', { nullable: true }),

    createdAt: t.expose('createdAt', { type: 'DateTime' }),

    route: t.relation('route'),
    voyage: t.relation('voyage', { nullable: true }),
  }),
});

// Route Optimization Suggestion
builder.prismaObject('RouteOptimizationSuggestion', {
  fields: (t) => ({
    id: t.exposeID('id'),
    originalRouteId: t.exposeString('originalRouteId'),
    voyageId: t.exposeString('voyageId', { nullable: true }),

    suggestionType: t.exposeString('suggestionType'),
    reason: t.exposeString('reason'),

    timeSavingHours: t.exposeFloat('timeSavingHours', { nullable: true }),
    fuelSavingMt: t.exposeFloat('fuelSavingMt', { nullable: true }),
    costSavingUsd: t.exposeFloat('costSavingUsd', { nullable: true }),

    alternativeRouteId: t.exposeString('alternativeRouteId', { nullable: true }),
    alternativeWaypoints: t.expose('alternativeWaypoints', { type: 'JSON', nullable: true }),

    confidence: t.exposeFloat('confidence'),

    accepted: t.exposeBoolean('accepted', { nullable: true }),
    acceptedAt: t.expose('acceptedAt', { type: 'DateTime', nullable: true }),
    acceptedBy: t.exposeString('acceptedBy', { nullable: true }),
    actualOutcome: t.exposeString('actualOutcome', { nullable: true }),

    validUntil: t.expose('validUntil', { type: 'DateTime' }),
    status: t.exposeString('status'),

    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// ===============================
// QUERIES
// ===============================

// Get all routes for a vessel
builder.queryField('vesselRoutes', (t) =>
  t.prismaField({
    type: ['VesselRoute'],
    args: {
      vesselId: t.arg.string({ required: true }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (query, _root, args) => {
      return prisma.vesselRoute.findMany({
        ...query,
        where: { vesselId: args.vesselId },
        orderBy: { createdAt: 'desc' },
        take: args.limit || 50,
      });
    },
  })
);

// Get route by ID with waypoints
builder.queryField('route', (t) =>
  t.prismaField({
    type: 'VesselRoute',
    nullable: true,
    args: {
      routeId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args) => {
      return prisma.vesselRoute.findUnique({
        ...query,
        where: { id: args.routeId },
      });
    },
  })
);

// Get learned route patterns
builder.queryField('learnedRoutes', (t) =>
  t.prismaField({
    type: ['LearnedRoutePattern'],
    args: {
      originPortId: t.arg.string({ required: false }),
      destPortId: t.arg.string({ required: false }),
      vesselType: t.arg.string({ required: false }),
      minReliability: t.arg.float({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (query, _root, args) => {
      return prisma.learnedRoutePattern.findMany({
        ...query,
        where: {
          ...(args.originPortId && { originPortId: args.originPortId }),
          ...(args.destPortId && { destPortId: args.destPortId }),
          ...(args.vesselType && { vesselType: args.vesselType }),
          ...(args.minReliability && { reliability: { gte: args.minReliability } }),
        },
        orderBy: [
          { reliability: 'desc' },
          { observedCount: 'desc' },
        ],
        take: args.limit || 20,
      });
    },
  })
);

// Get optimization suggestions
builder.queryField('routeOptimizationSuggestions', (t) =>
  t.prismaField({
    type: ['RouteOptimizationSuggestion'],
    args: {
      status: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (query, _root, args) => {
      return prisma.routeOptimizationSuggestion.findMany({
        ...query,
        where: {
          status: args.status || 'ACTIVE',
          validUntil: { gte: new Date() },
        },
        orderBy: { confidence: 'desc' },
        take: args.limit || 10,
      });
    },
  })
);

// Get route quality logs
builder.queryField('routeQualityLogs', (t) =>
  t.prismaField({
    type: ['RouteQualityLog'],
    args: {
      routeId: t.arg.string({ required: false }),
      voyageId: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (query, _root, args) => {
      return prisma.routeQualityLog.findMany({
        ...query,
        where: {
          ...(args.routeId && { routeId: args.routeId }),
          ...(args.voyageId && { voyageId: args.voyageId }),
        },
        orderBy: { createdAt: 'desc' },
        take: args.limit || 20,
      });
    },
  })
);

// FLEET COLLABORATIVE ROUTING QUERIES

// Get active fleet on a route (Ships A, B, C)
builder.queryField('fleetOnRoute', (t) =>
  t.field({
    type: 'JSON',
    args: {
      originPortId: t.arg.string({ required: true }),
      destPortId: t.arg.string({ required: true }),
      vesselType: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const fleetRoute = await fleetCollaborativeLearner.findFleetOnRoute(
        args.originPortId,
        args.destPortId,
        args.vesselType
      );
      return fleetRoute;
    },
  })
);

// Get active vessels on any route (for map visualization)
builder.queryField('activeVesselsOnRoutes', (t) =>
  t.field({
    type: 'JSON',
    args: {
      vesselType: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (_root, args) => {
      // Find all in-progress voyages with their latest positions
      const voyages = await prisma.voyage.findMany({
        where: {
          status: 'in_progress',
          atd: { not: null },
          ata: null,
          ...(args.vesselType && {
            vessel: { type: args.vesselType }
          }),
        },
        include: {
          vessel: {
            select: {
              id: true,
              name: true,
              type: true,
              positions: {
                orderBy: { timestamp: 'desc' },
                take: 1,
              },
            },
          },
          departurePort: {
            select: { id: true, name: true, latitude: true, longitude: true },
          },
          arrivalPort: {
            select: { id: true, name: true, latitude: true, longitude: true },
          },
        },
        take: args.limit || 100,
      });

      return voyages
        .filter(v => v.vessel.positions.length > 0)
        .map(v => {
          const pos = v.vessel.positions[0];
          return {
            voyageId: v.id,
            vesselId: v.vessel.id,
            vesselName: v.vessel.name,
            vesselType: v.vessel.type,
            latitude: pos.latitude,
            longitude: pos.longitude,
            speed: pos.speed || 0,
            heading: pos.heading || 0,
            timestamp: pos.timestamp,
            originPort: v.departurePort,
            destPort: v.arrivalPort,
            etd: v.etd,
            eta: v.eta,
          };
        });
    },
  })
);

// ===============================
// MUTATIONS
// ===============================

// Calculate route (main intelligent routing function!)
builder.mutationField('calculateRoute', (t) =>
  t.field({
    type: 'JSON',
    args: {
      vesselId: t.arg.string({ required: true }),
      originPortId: t.arg.string({ required: true }),
      destPortId: t.arg.string({ required: true }),
      draftMeters: t.arg.float({ required: false }),
      loaMeters: t.arg.float({ required: false }),
      beamMeters: t.arg.float({ required: false }),
      optimizeFor: t.arg.string({ required: false }),
      avoidEcaZones: t.arg.boolean({ required: false }),
      avoidHighRiskAreas: t.arg.boolean({ required: false }),
      considerCongestion: t.arg.boolean({ required: false }),
      considerWeather: t.arg.boolean({ required: false }),
      useFleetIntelligence: t.arg.boolean({ required: false }),
    },
    resolve: async (_root, args) => {
      const route = await routeCalculator.calculateRoute({
        vesselId: args.vesselId,
        originPortId: args.originPortId,
        destPortId: args.destPortId,
        draftMeters: args.draftMeters || undefined,
        loaMeters: args.loaMeters || undefined,
        beamMeters: args.beamMeters || undefined,
        optimizeFor: (args.optimizeFor as any) || 'SPEED',
        avoidEcaZones: args.avoidEcaZones || false,
        avoidHighRiskAreas: args.avoidHighRiskAreas || false,
        considerCongestion: args.considerCongestion || false,
        considerWeather: args.considerWeather || false,
      });

      // Enhance with fleet intelligence if requested
      if (args.useFleetIntelligence) {
        const vessel = await prisma.vessel.findUnique({
          where: { id: args.vesselId },
          select: { type: true },
        });

        if (vessel) {
          const enhancedRoute = await fleetCollaborativeLearner.enhanceRouteWithFleetData(
            route,
            args.originPortId,
            args.destPortId,
            vessel.type
          );
          return enhancedRoute;
        }
      }

      return route;
    },
  })
);

// Bootstrap learning from historical voyages
builder.mutationField('bootstrapRouteLearning', (t) =>
  t.field({
    type: 'JSON',
    args: {
      limit: t.arg.int({ required: false }),
    },
    resolve: async (_root, args) => {
      await historicalRouteAnalyzer.bootstrapLearning(args.limit || 100);
      return { success: true, message: 'Bootstrap learning completed' };
    },
  })
);

// Learn from completed voyage
builder.mutationField('learnFromVoyage', (t) =>
  t.field({
    type: 'JSON',
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      await historicalRouteAnalyzer.learnFromCompletedVoyage(args.voyageId);
      return { success: true, message: 'Learning completed' };
    },
  })
);

// Generate optimization suggestions
builder.mutationField('generateRouteOptimizations', (t) =>
  t.field({
    type: 'JSON',
    resolve: async () => {
      await historicalRouteAnalyzer.generateOptimizationSuggestions();
      return { success: true, message: 'Optimization suggestions generated' };
    },
  })
);

// Accept optimization suggestion
builder.mutationField('acceptRouteOptimization', (t) =>
  t.prismaField({
    type: 'RouteOptimizationSuggestion',
    args: {
      suggestionId: t.arg.string({ required: true }),
      userId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args) => {
      return prisma.routeOptimizationSuggestion.update({
        ...query,
        where: { id: args.suggestionId },
        data: {
          accepted: true,
          acceptedAt: new Date(),
          acceptedBy: args.userId,
          status: 'ACCEPTED',
        },
      });
    },
  })
);

// Reject optimization suggestion
builder.mutationField('rejectRouteOptimization', (t) =>
  t.prismaField({
    type: 'RouteOptimizationSuggestion',
    args: {
      suggestionId: t.arg.string({ required: true }),
      userId: t.arg.string({ required: true }),
      reason: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args) => {
      return prisma.routeOptimizationSuggestion.update({
        ...query,
        where: { id: args.suggestionId },
        data: {
          accepted: false,
          acceptedAt: new Date(),
          acceptedBy: args.userId,
          status: 'REJECTED',
          actualOutcome: args.reason || 'User rejected suggestion',
        },
      });
    },
  })
);
