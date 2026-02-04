/**
 * Enhanced Vessel Position GraphQL Type
 * With "My Fleet" vs "Market Fleet" filtering
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';

// VesselPosition type already exists, extend with fleet filtering queries

builder.queryFields((t) => ({
  /**
   * Get all vessel positions with real-time AIS data
   */
  liveVesselPositions: t.field({
    type: ['VesselPosition'],
    args: {
      fleetView: t.arg.string({ required: false }), // 'my_fleet' | 'market_fleet' | 'all'
      vesselType: t.arg.string({ required: false }),
      bounds: t.arg({
        type: 'MapBounds',
        required: false,
      }),
      limit: t.arg.int({ defaultValue: 100 }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');

      const where: any = {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      };

      // Fleet filtering
      if (args.fleetView === 'my_fleet') {
        // Show only vessels belonging to user's organization
        const vessels = await prisma.vessel.findMany({
          where: { organizationId: ctx.user.organizationId },
          select: { id: true },
        });
        where.vesselId = { in: vessels.map((v) => v.id) };
      } else if (args.fleetView === 'market_fleet') {
        // Show vessels from marketplace (opt-in sharing)
        const vessels = await prisma.vessel.findMany({
          where: {
            isPublicListing: true,
            organizationId: { not: ctx.user.organizationId },
          },
          select: { id: true },
        });
        where.vesselId = { in: vessels.map((v) => v.id) };
      }

      // Vessel type filtering
      if (args.vesselType) {
        const vessels = await prisma.vessel.findMany({
          where: { type: args.vesselType },
          select: { id: true },
        });
        where.vesselId = { in: vessels.map((v) => v.id) };
      }

      // Geographic bounds filtering
      if (args.bounds) {
        where.latitude = {
          gte: args.bounds.south,
          lte: args.bounds.north,
        };
        where.longitude = {
          gte: args.bounds.west,
          lte: args.bounds.east,
        };
      }

      // Get latest position per vessel
      const positions = await prisma.$queryRaw`
        SELECT DISTINCT ON (vessel_id) *
        FROM vessel_position
        WHERE ${buildWhereClause(where)}
        ORDER BY vessel_id, timestamp DESC
        LIMIT ${args.limit}
      `;

      return positions as any[];
    },
  }),

  /**
   * Get fleet statistics
   */
  fleetStatistics: t.field({
    type: 'FleetStats',
    args: {
      fleetView: t.arg.string({ defaultValue: 'my_fleet' }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');

      const vesselFilter: any = {};

      if (args.fleetView === 'my_fleet') {
        vesselFilter.organizationId = ctx.user.organizationId;
      } else if (args.fleetView === 'market_fleet') {
        vesselFilter.isPublicListing = true;
        vesselFilter.organizationId = { not: ctx.user.organizationId };
      }

      const [
        totalVessels,
        atSea,
        atPort,
        atAnchor,
        byType,
      ] = await Promise.all([
        // Total vessels
        prisma.vessel.count({ where: vesselFilter }),

        // Vessels at sea (speed > 5 knots)
        prisma.vesselPosition.count({
          where: {
            vessel: vesselFilter,
            speed: { gte: 5 },
            timestamp: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) }, // Last 6 hours
          },
        }),

        // Vessels at port (speed < 2 knots, near port)
        prisma.vesselPosition.count({
          where: {
            vessel: vesselFilter,
            speed: { lt: 2 },
            timestamp: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
          },
        }),

        // Vessels at anchor
        prisma.vesselPosition.count({
          where: {
            vessel: vesselFilter,
            status: 'at_anchor',
            timestamp: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
          },
        }),

        // Vessels by type
        prisma.vessel.groupBy({
          by: ['type'],
          where: vesselFilter,
          _count: true,
        }),
      ]);

      return {
        totalVessels,
        atSea,
        atPort,
        atAnchor,
        byType: byType.map((t) => ({
          type: t.type,
          count: t._count,
        })),
      };
    },
  }),

  /**
   * Get vessel track history (for track replay)
   */
  vesselTrackHistory: t.field({
    type: ['VesselPosition'],
    args: {
      vesselId: t.arg.string({ required: true }),
      startDate: t.arg({ type: 'DateTime', required: true }),
      endDate: t.arg({ type: 'DateTime', required: false }),
      interval: t.arg.int({ defaultValue: 60 }), // minutes between points
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');

      // Check access permission
      const vessel = await prisma.vessel.findUnique({
        where: { id: args.vesselId },
      });

      if (!vessel) throw new Error('Vessel not found');

      // Allow if own vessel or public listing
      const hasAccess =
        vessel.organizationId === ctx.user.organizationId || vessel.isPublicListing;

      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const endDate = args.endDate || new Date();

      // Get positions with sampling (to reduce data volume)
      const positions = await prisma.$queryRaw`
        SELECT *
        FROM vessel_position
        WHERE vessel_id = ${args.vesselId}
          AND timestamp >= ${args.startDate}
          AND timestamp <= ${endDate}
        ORDER BY timestamp ASC
      `;

      // Sample positions at specified interval
      const sampledPositions: any[] = [];
      let lastTimestamp = 0;

      for (const position of positions as any[]) {
        const timestamp = new Date(position.timestamp).getTime();

        if (timestamp - lastTimestamp >= args.interval * 60 * 1000) {
          sampledPositions.push(position);
          lastTimestamp = timestamp;
        }
      }

      return sampledPositions;
    },
  }),
}));

// Helper types
builder.inputType('MapBounds', {
  fields: (t) => ({
    north: t.float({ required: true }),
    south: t.float({ required: true }),
    east: t.float({ required: true }),
    west: t.float({ required: true }),
  }),
});

builder.objectType('FleetStats', {
  fields: (t) => ({
    totalVessels: t.int(),
    atSea: t.int(),
    atPort: t.int(),
    atAnchor: t.int(),
    byType: t.field({
      type: ['VesselTypeCount'],
    }),
  }),
});

builder.objectType('VesselTypeCount', {
  fields: (t) => ({
    type: t.string(),
    count: t.int(),
  }),
});

// Helper function
function buildWhereClause(where: any): string {
  const clauses: string[] = [];

  if (where.vesselId?.in) {
    clauses.push(`vessel_id IN (${where.vesselId.in.map((id: string) => `'${id}'`).join(',')})`);
  }

  if (where.timestamp?.gte) {
    clauses.push(`timestamp >= '${where.timestamp.gte.toISOString()}'`);
  }

  if (where.latitude) {
    if (where.latitude.gte) clauses.push(`latitude >= ${where.latitude.gte}`);
    if (where.latitude.lte) clauses.push(`latitude <= ${where.latitude.lte}`);
  }

  if (where.longitude) {
    if (where.longitude.gte) clauses.push(`longitude >= ${where.longitude.gte}`);
    if (where.longitude.lte) clauses.push(`longitude <= ${where.longitude.lte}`);
  }

  return clauses.join(' AND ') || 'true';
}
