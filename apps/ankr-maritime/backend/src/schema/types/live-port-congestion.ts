import { builder } from '../builder.js';
import { prisma } from '../context.js';
import { portCongestionService } from '../../services/port-congestion-timescale.service.js';

// Live congestion metrics calculated from AIS data
const LivePortCongestionMetricsRef = builder.objectRef<{
  portId: string;
  portName: string;
  unlocode: string;
  country: string;
  latitude: number;
  longitude: number;
  vesselsInArea: number;
  vesselsAnchored: number;
  vesselsMoving: number;
  congestionLevel: string;
  congestionScore: number;
  averageSpeed: number;
  recentArrivals24h: number;
  recentDepartures24h: number;
  estimatedWaitTime: number | null;
  trend: string;
  lastUpdated: string;
}>('LivePortCongestionMetrics');

LivePortCongestionMetricsRef.implement({
  fields: (t) => ({
    portId: t.exposeString('portId'),
    portName: t.exposeString('portName'),
    unlocode: t.exposeString('unlocode'),
    country: t.exposeString('country'),
    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    vesselsInArea: t.exposeInt('vesselsInArea'),
    vesselsAnchored: t.exposeInt('vesselsAnchored'),
    vesselsMoving: t.exposeInt('vesselsMoving'),
    congestionLevel: t.exposeString('congestionLevel'),
    congestionScore: t.exposeInt('congestionScore'),
    averageSpeed: t.exposeFloat('averageSpeed'),
    recentArrivals24h: t.exposeInt('recentArrivals24h'),
    recentDepartures24h: t.exposeInt('recentDepartures24h'),
    estimatedWaitTime: t.exposeInt('estimatedWaitTime', { nullable: true }),
    trend: t.exposeString('trend'),
    lastUpdated: t.exposeString('lastUpdated'),
  }),
});

const LiveCongestionDashboardOverviewRef = builder.objectRef<{
  totalPorts: number;
  portsMonitored: number;
  totalVesselsInPorts: number;
  criticalCongestion: number;
  highCongestion: number;
  averageWaitTime: number;
}>('LiveCongestionDashboardOverview');

LiveCongestionDashboardOverviewRef.implement({
  fields: (t) => ({
    totalPorts: t.exposeInt('totalPorts'),
    portsMonitored: t.exposeInt('portsMonitored'),
    totalVesselsInPorts: t.exposeInt('totalVesselsInPorts'),
    criticalCongestion: t.exposeInt('criticalCongestion'),
    highCongestion: t.exposeInt('highCongestion'),
    averageWaitTime: t.exposeInt('averageWaitTime'),
  }),
});

const LiveCongestionDashboardRef = builder.objectRef<{
  overview: {
    totalPorts: number;
    portsMonitored: number;
    totalVesselsInPorts: number;
    criticalCongestion: number;
    highCongestion: number;
    averageWaitTime: number;
  };
  topCongested: Array<any>;
  recentlyCleared: Array<any>;
  allPorts: Array<any>;
  lastUpdated: string;
}>('LiveCongestionDashboard');

LiveCongestionDashboardRef.implement({
  fields: (t) => ({
    overview: t.field({
      type: LiveCongestionDashboardOverviewRef,
      resolve: (parent) => parent.overview,
    }),
    topCongested: t.field({
      type: [LivePortCongestionMetricsRef],
      resolve: (parent) => parent.topCongested,
    }),
    recentlyCleared: t.field({
      type: [LivePortCongestionMetricsRef],
      resolve: (parent) => parent.recentlyCleared,
    }),
    allPorts: t.field({
      type: [LivePortCongestionMetricsRef],
      resolve: (parent) => parent.allPorts,
    }),
    lastUpdated: t.exposeString('lastUpdated'),
  }),
});

// Calculate congestion score
function calculateCongestionScore(vesselsInArea: number, vesselsAnchored: number, portCapacity: number = 50): number {
  const densityScore = Math.min((vesselsInArea / portCapacity) * 100, 100);
  const anchorageScore = Math.min((vesselsAnchored / (portCapacity * 0.3)) * 100, 100);
  return Math.round(densityScore * 0.6 + anchorageScore * 0.4);
}

// Get congestion level from score
function getCongestionLevel(score: number): string {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

// Estimate wait time
function estimateWaitTime(vesselsAnchored: number, portThroughput: number = 10): number | null {
  if (vesselsAnchored === 0) return null;
  const hoursPerVessel = 24 / portThroughput;
  return Math.round(vesselsAnchored * hoursPerVessel * 60);
}

// Live congestion dashboard query (TimescaleDB optimized)
builder.queryField('livePortCongestionDashboard', (t) =>
  t.field({
    type: LiveCongestionDashboardRef,
    resolve: async () => {
      try {
        // Use TimescaleDB-optimized service
        const portMetrics = await portCongestionService.getPortCongestionMetrics(100);
        const overview = await portCongestionService.getDashboardOverview(portMetrics);

        return {
          overview,
          topCongested: portMetrics.slice(0, 10),
          recentlyCleared: portMetrics
            .filter(p => p.trend === 'decreasing' && p.congestionScore < 40)
            .slice(0, 10),
          allPorts: portMetrics,
          lastUpdated: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[Live Congestion Dashboard Error]', error);
        return {
          overview: {
            totalPorts: 0,
            portsMonitored: 0,
            totalVesselsInPorts: 0,
            criticalCongestion: 0,
            highCongestion: 0,
            averageWaitTime: 0,
          },
          topCongested: [],
          recentlyCleared: [],
          allPorts: [],
          lastUpdated: new Date().toISOString(),
        };
      }
    },
  }),
);

// Query for port congestion historical trend
builder.queryField('portCongestionHistory', (t) =>
  t.field({
    type: [builder.objectRef<{
      hour: Date;
      vesselCount: number;
      anchoredCount: number;
    }>('PortCongestionHistoryPoint').implement({
      fields: (t) => ({
        hour: t.expose('hour', { type: 'DateTime' }),
        vesselCount: t.exposeInt('vesselCount'),
        anchoredCount: t.exposeInt('anchoredCount'),
      }),
    })],
    args: {
      latitude: t.arg.float({ required: true }),
      longitude: t.arg.float({ required: true }),
      hours: t.arg.int({ defaultValue: 168 }), // 7 days default
    },
    resolve: async (_root, args) => {
      return portCongestionService.getPortCongestionHistory(
        args.latitude,
        args.longitude,
        args.hours
      );
    },
  }),
);

// Query for TimescaleDB performance stats
builder.queryField('timescaleDBStats', (t) =>
  t.field({
    type: 'JSON',
    resolve: async () => {
      return portCongestionService.getTimescaleDBStats();
    },
  }),
);
