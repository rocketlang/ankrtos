/**
 * FLEET DASHBOARD
 * Overview of all vessels with hybrid tracking status
 */

import { builder } from '../builder.js';
import { HybridVesselTracker } from '../../services/hybrid-vessel-tracker.js';
import { prisma } from '../../lib/prisma.js';

// Fleet Vessel Status (simplified version for dashboard)
const FleetVesselStatus = builder.objectRef<{
  mmsi: string;
  name: string | null;
  type: string;
  status: string;
  source: string;
  quality: number;
  lastUpdate: Date;
  position: { lat: number; lon: number } | null;
  portName: string | null;
}>('FleetVesselStatus').implement({
  fields: (t) => ({
    mmsi: t.exposeString('mmsi'),
    name: t.exposeString('name', { nullable: true }),
    type: t.exposeString('type'),
    status: t.exposeString('status'),
    source: t.exposeString('source'),
    quality: t.exposeFloat('quality'),
    lastUpdate: t.expose('lastUpdate', { type: 'DateTime' }),
    position: t.field({
      type: builder.objectRef<{ lat: number; lon: number }>('FleetPosition').implement({
        fields: (t) => ({
          lat: t.exposeFloat('lat'),
          lon: t.exposeFloat('lon'),
        }),
      }),
      nullable: true,
      resolve: (parent) => parent.position,
    }),
    portName: t.exposeString('portName', { nullable: true }),
  }),
});

// Fleet Statistics
const FleetStats = builder.objectRef<{
  totalVessels: number;
  liveTracking: number;
  atPort: number;
  inTransit: number;
  unknown: number;
  averageQuality: number;
  coveragePercentage: number;
  vesselsNeedingAttention: number;
}>('FleetStats').implement({
  fields: (t) => ({
    totalVessels: t.exposeInt('totalVessels'),
    liveTracking: t.exposeInt('liveTracking'),
    atPort: t.exposeInt('atPort'),
    inTransit: t.exposeInt('inTransit'),
    unknown: t.exposeInt('unknown'),
    averageQuality: t.exposeFloat('averageQuality'),
    coveragePercentage: t.exposeFloat('coveragePercentage'),
    vesselsNeedingAttention: t.exposeInt('vesselsNeedingAttention'),
  }),
});

// Fleet Dashboard Response
const FleetDashboard = builder.objectRef<{
  stats: any;
  vessels: any[];
  lastUpdated: Date;
}>('FleetDashboard').implement({
  fields: (t) => ({
    stats: t.field({
      type: FleetStats,
      resolve: (parent) => parent.stats,
    }),
    vessels: t.field({
      type: [FleetVesselStatus],
      resolve: (parent) => parent.vessels,
    }),
    lastUpdated: t.expose('lastUpdated', { type: 'DateTime' }),
  }),
});

/**
 * Get fleet-wide status overview
 */
builder.queryField('fleetDashboard', (t) =>
  t.field({
    type: FleetDashboard,
    description: 'Get fleet-wide vessel tracking status overview',
    args: {
      limit: t.arg.int({ required: false, defaultValue: 100 }),
      statusFilter: t.arg.stringList({ required: false }),
      minQuality: t.arg.float({ required: false }),
    },
    resolve: async (_root, args) => {
      console.log(`[Fleet Dashboard] Fetching status for up to ${args.limit} vessels`);

      // Get all vessels
      const vessels = await prisma.vessel.findMany({
        take: args.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          mmsi: true,
          name: true,
          type: true,
        },
      });

      console.log(`[Fleet Dashboard] Found ${vessels.length} vessels`);

      // Get status for each vessel (in parallel for performance)
      const tracker = new HybridVesselTracker();

      // Process in batches to avoid overwhelming the system
      const batchSize = 10;
      const vesselStatuses = [];

      for (let i = 0; i < vessels.length; i += batchSize) {
        const batch = vessels.slice(i, i + batchSize);
        const batchStatuses = await Promise.all(
          batch.map(async (vessel) => {
            try {
              const status = await tracker.getVesselStatus(vessel.mmsi);
              return {
                mmsi: vessel.mmsi,
                name: vessel.name,
                type: vessel.type,
                status: status.status,
                source: status.source,
                quality: status.quality,
                lastUpdate: status.timestamp,
                position: status.position,
                portName: status.port?.name || null,
              };
            } catch (error) {
              console.error(`[Fleet Dashboard] Error getting status for ${vessel.mmsi}:`, error);
              return {
                mmsi: vessel.mmsi,
                name: vessel.name,
                type: vessel.type,
                status: 'UNKNOWN',
                source: 'UNKNOWN',
                quality: 0,
                lastUpdate: new Date(),
                position: null,
                portName: null,
              };
            }
          })
        );
        vesselStatuses.push(...batchStatuses);

        // Small delay between batches to avoid overwhelming the system
        if (i + batchSize < vessels.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Filter by status if requested
      let filteredVessels = vesselStatuses;
      if (args.statusFilter && args.statusFilter.length > 0) {
        filteredVessels = vesselStatuses.filter(v =>
          args.statusFilter!.includes(v.status)
        );
      }

      // Filter by minimum quality if requested
      if (args.minQuality !== null && args.minQuality !== undefined) {
        filteredVessels = filteredVessels.filter(v => v.quality >= args.minQuality!);
      }

      // Calculate statistics
      const stats = {
        totalVessels: vesselStatuses.length,
        liveTracking: vesselStatuses.filter(v => v.status === 'LIVE_AIS').length,
        atPort: vesselStatuses.filter(v => v.status === 'AT_PORT').length,
        inTransit: vesselStatuses.filter(v => v.status === 'IN_TRANSIT').length,
        unknown: vesselStatuses.filter(v => v.status === 'UNKNOWN').length,
        averageQuality: vesselStatuses.reduce((sum, v) => sum + v.quality, 0) / vesselStatuses.length,
        coveragePercentage: (vesselStatuses.filter(v => v.quality > 0).length / vesselStatuses.length) * 100,
        vesselsNeedingAttention: vesselStatuses.filter(v => v.status === 'UNKNOWN' || v.quality < 0.5).length,
      };

      console.log(`[Fleet Dashboard] Stats:`, stats);

      return {
        stats,
        vessels: filteredVessels,
        lastUpdated: new Date(),
      };
    },
  })
);

/**
 * Get quick fleet statistics without full vessel details
 */
builder.queryField('fleetStats', (t) =>
  t.field({
    type: FleetStats,
    description: 'Get quick fleet-wide statistics',
    resolve: async (_root) => {
      // Get total vessel count
      const totalVessels = await prisma.vessel.count();

      // Get recent positions to determine live tracking count
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const liveVessels = await prisma.vesselPosition.groupBy({
        by: ['vesselId'],
        where: {
          timestamp: { gte: thirtyMinutesAgo },
        },
      });

      const liveTracking = liveVessels.length;
      const coveragePercentage = totalVessels > 0 ? (liveTracking / totalVessels) * 100 : 0;

      return {
        totalVessels,
        liveTracking,
        atPort: 0, // Would need GFW data to calculate
        inTransit: 0, // Estimated count
        unknown: totalVessels - liveTracking,
        averageQuality: coveragePercentage / 100,
        coveragePercentage,
        vesselsNeedingAttention: totalVessels - liveTracking,
      };
    },
  })
);
