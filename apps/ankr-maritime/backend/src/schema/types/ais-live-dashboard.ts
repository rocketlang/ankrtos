/**
 * AIS Live Dashboard GraphQL Schema
 *
 * Real-time vessel position tracking and statistics
 * Single source of truth for AIS data coverage
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';

// === Object Types ===

const AISCoverageStatsType = builder.objectRef<{
  total: number;
  withNavigationStatus: number;
  withRateOfTurn: number;
  withPositionAccuracy: number;
  withManeuverIndicator: number;
  withDraught: number;
  withDimensions: number;
}>('AISCoverageStats');

AISCoverageStatsType.implement({
  fields: (t) => ({
    total: t.exposeInt('total'),
    withNavigationStatus: t.exposeInt('withNavigationStatus'),
    withRateOfTurn: t.exposeInt('withRateOfTurn'),
    withPositionAccuracy: t.exposeInt('withPositionAccuracy'),
    withManeuverIndicator: t.exposeInt('withManeuverIndicator'),
    withDraught: t.exposeInt('withDraught'),
    withDimensions: t.exposeInt('withDimensions'),
  }),
});

const AISDataRangeType = builder.objectRef<{
  oldest: Date | null;
  newest: Date | null;
  rangeHours: number;
}>('AISDataRange');

AISDataRangeType.implement({
  fields: (t) => ({
    oldest: t.expose('oldest', { type: 'DateTime', nullable: true }),
    newest: t.expose('newest', { type: 'DateTime', nullable: true }),
    rangeHours: t.exposeFloat('rangeHours'),
  }),
});

const AISActivityStatsType = builder.objectRef<{
  last5Minutes: number;
  last15Minutes: number;
  last1Hour: number;
  last24Hours: number;
}>('AISActivityStats');

AISActivityStatsType.implement({
  fields: (t) => ({
    last5Minutes: t.exposeInt('last5Minutes'),
    last15Minutes: t.exposeInt('last15Minutes'),
    last1Hour: t.exposeInt('last1Hour'),
    last24Hours: t.exposeInt('last24Hours'),
  }),
});

const AISNavigationStatusBreakdownType = builder.objectRef<{
  status: number;
  statusLabel: string;
  count: number;
  percentage: number;
}>('AISNavigationStatusBreakdown');

AISNavigationStatusBreakdownType.implement({
  fields: (t) => ({
    status: t.exposeInt('status'),
    statusLabel: t.exposeString('statusLabel'),
    count: t.exposeInt('count'),
    percentage: t.exposeFloat('percentage'),
  }),
});

const RecentVesselPositionType = builder.objectRef<{
  id: string;
  vesselId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  navigationStatus: number | null;
  timestamp: Date;
  destination: string | null;
}>('RecentVesselPosition');

RecentVesselPositionType.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeID('vesselId'),
    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    speed: t.exposeFloat('speed', { nullable: true }),
    heading: t.exposeInt('heading', { nullable: true }),
    navigationStatus: t.exposeInt('navigationStatus', { nullable: true }),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
    destination: t.exposeString('destination', { nullable: true }),
  }),
});

const AISLiveDashboardType = builder.objectRef<{
  totalPositions: number;
  uniqueVessels: number;
  averageSpeed: number;
  coverage: {
    total: number;
    withNavigationStatus: number;
    withRateOfTurn: number;
    withPositionAccuracy: number;
    withManeuverIndicator: number;
    withDraught: number;
    withDimensions: number;
  };
  dataRange: {
    oldest: Date | null;
    newest: Date | null;
    rangeHours: number;
  };
  recentActivity: {
    last5Minutes: number;
    last15Minutes: number;
    last1Hour: number;
    last24Hours: number;
  };
  navigationStatusBreakdown: Array<{
    status: number;
    statusLabel: string;
    count: number;
    percentage: number;
  }>;
  lastUpdated: Date;
}>('AISLiveDashboard');

AISLiveDashboardType.implement({
  fields: (t) => ({
    totalPositions: t.exposeInt('totalPositions'),
    uniqueVessels: t.exposeInt('uniqueVessels'),
    averageSpeed: t.exposeFloat('averageSpeed'),
    coverage: t.field({
      type: AISCoverageStatsType,
      resolve: (parent) => parent.coverage,
    }),
    dataRange: t.field({
      type: AISDataRangeType,
      resolve: (parent) => parent.dataRange,
    }),
    recentActivity: t.field({
      type: AISActivityStatsType,
      resolve: (parent) => parent.recentActivity,
    }),
    navigationStatusBreakdown: t.field({
      type: [AISNavigationStatusBreakdownType],
      resolve: (parent) => parent.navigationStatusBreakdown,
    }),
    lastUpdated: t.expose('lastUpdated', { type: 'DateTime' }),
  }),
});

// === Helper Functions ===

const NAVIGATION_STATUS_LABELS: Record<number, string> = {
  0: 'Under way using engine',
  1: 'At anchor',
  2: 'Not under command',
  3: 'Restricted maneuverability',
  4: 'Constrained by draught',
  5: 'Moored',
  6: 'Aground',
  7: 'Engaged in fishing',
  8: 'Under way sailing',
  9: 'Reserved for HSC',
  10: 'Reserved for WIG',
  11: 'Reserved',
  12: 'Reserved',
  13: 'Reserved',
  14: 'AIS-SART',
  15: 'Not defined',
};

async function getAISLiveDashboardData() {
  // Get core statistics
  const [coreStats] = await prisma.$queryRaw<Array<{
    total_positions: bigint;
    unique_vessels: bigint;
    avg_speed: number | null;
    oldest: Date | null;
    newest: Date | null;
    with_nav_status: bigint;
    with_rot: bigint;
    with_pos_accuracy: bigint;
    with_maneuver: bigint;
    with_draught: bigint;
    with_dimensions: bigint;
  }>>`
    SELECT
      COUNT(*) as total_positions,
      COUNT(DISTINCT "vesselId") as unique_vessels,
      AVG(speed) as avg_speed,
      MIN(timestamp) as oldest,
      MAX(timestamp) as newest,
      COUNT("navigationStatus") as with_nav_status,
      COUNT("rateOfTurn") as with_rot,
      COUNT("positionAccuracy") as with_pos_accuracy,
      COUNT("maneuverIndicator") as with_maneuver,
      COUNT(draught) as with_draught,
      COUNT("dimensionToBow") as with_dimensions
    FROM vessel_positions
  `;

  // Get recent activity
  const [recentActivity] = await prisma.$queryRaw<Array<{
    last_5min: bigint;
    last_15min: bigint;
    last_1hour: bigint;
    last_24hours: bigint;
  }>>`
    SELECT
      COUNT(CASE WHEN timestamp > NOW() - INTERVAL '5 minutes' THEN 1 END) as last_5min,
      COUNT(CASE WHEN timestamp > NOW() - INTERVAL '15 minutes' THEN 1 END) as last_15min,
      COUNT(CASE WHEN timestamp > NOW() - INTERVAL '1 hour' THEN 1 END) as last_1hour,
      COUNT(CASE WHEN timestamp > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24hours
    FROM vessel_positions
  `;

  // Get navigation status breakdown
  const navStatusBreakdown = await prisma.$queryRaw<Array<{
    navigation_status: number;
    count: bigint;
  }>>`
    SELECT
      "navigationStatus" as navigation_status,
      COUNT(*) as count
    FROM vessel_positions
    WHERE "navigationStatus" IS NOT NULL
    GROUP BY "navigationStatus"
    ORDER BY count DESC
    LIMIT 10
  `;

  const totalWithNavStatus = Number(coreStats.with_nav_status);

  const navigationStatusBreakdown = navStatusBreakdown.map((item) => ({
    status: item.navigation_status,
    statusLabel: NAVIGATION_STATUS_LABELS[item.navigation_status] || 'Unknown',
    count: Number(item.count),
    percentage: totalWithNavStatus > 0 ? (Number(item.count) / totalWithNavStatus) * 100 : 0,
  }));

  // Calculate data range in hours
  const rangeMs = coreStats.newest && coreStats.oldest
    ? coreStats.newest.getTime() - coreStats.oldest.getTime()
    : 0;
  const rangeHours = rangeMs / (1000 * 60 * 60);

  return {
    totalPositions: Number(coreStats.total_positions),
    uniqueVessels: Number(coreStats.unique_vessels),
    averageSpeed: coreStats.avg_speed || 0,
    coverage: {
      total: Number(coreStats.total_positions),
      withNavigationStatus: Number(coreStats.with_nav_status),
      withRateOfTurn: Number(coreStats.with_rot),
      withPositionAccuracy: Number(coreStats.with_pos_accuracy),
      withManeuverIndicator: Number(coreStats.with_maneuver),
      withDraught: Number(coreStats.with_draught),
      withDimensions: Number(coreStats.with_dimensions),
    },
    dataRange: {
      oldest: coreStats.oldest,
      newest: coreStats.newest,
      rangeHours,
    },
    recentActivity: {
      last5Minutes: Number(recentActivity.last_5min),
      last15Minutes: Number(recentActivity.last_15min),
      last1Hour: Number(recentActivity.last_1hour),
      last24Hours: Number(recentActivity.last_24hours),
    },
    navigationStatusBreakdown,
    lastUpdated: new Date(),
  };
}

// === Queries ===

builder.queryFields((t) => ({
  aisLiveDashboard: t.field({
    type: AISLiveDashboardType,
    description: 'Real-time AIS data statistics and coverage',
    resolve: async () => {
      return await getAISLiveDashboardData();
    },
  }),

  aisRecentPositions: t.field({
    type: [RecentVesselPositionType],
    description: 'Most recent vessel positions',
    args: {
      limit: t.arg.int({ required: false, defaultValue: 50 }),
    },
    resolve: async (_root, args) => {
      const positions = await prisma.vessel_positions.findMany({
        where: {
          navigationStatus: { not: null },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: args.limit,
        select: {
          id: true,
          vesselId: true,
          latitude: true,
          longitude: true,
          speed: true,
          heading: true,
          navigationStatus: true,
          timestamp: true,
          destination: true,
        },
      });

      return positions.map((pos) => ({
        id: pos.id,
        vesselId: pos.vesselId,
        latitude: pos.latitude,
        longitude: pos.longitude,
        speed: pos.speed,
        heading: pos.heading,
        navigationStatus: pos.navigationStatus,
        timestamp: pos.timestamp,
        destination: pos.destination,
      }));
    },
  }),
}));
