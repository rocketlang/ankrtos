import { builder } from '../builder.js';
import { prisma } from '../context.js';

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

// Live congestion dashboard query (calculates from AIS data in real-time)
builder.queryField('livePortCongestionDashboard', (t) =>
  t.field({
    type: LiveCongestionDashboardRef,
    resolve: async () => {
      try {
        // Get major ports with recent AIS activity
        const majorPorts = await prisma.$queryRaw<Array<{
          id: string;
          name: string;
          unlocode: string;
          country: string;
          latitude: number;
          longitude: number;
          position_count: bigint;
        }>>`
          SELECT
            p.id,
            p.name,
            p.unlocode,
            p.country,
            p.latitude,
            p.longitude,
            COUNT(vp.id) as position_count
          FROM ports p
          LEFT JOIN vessel_positions vp ON (
            ST_DWithin(
              ST_MakePoint(p.longitude, p.latitude)::geography,
              ST_MakePoint(vp.longitude, vp.latitude)::geography,
              20000
            )
            AND vp.timestamp > NOW() - INTERVAL '24 hours'
          )
          WHERE p.latitude IS NOT NULL
            AND p.longitude IS NOT NULL
          GROUP BY p.id, p.name, p.unlocode, p.country, p.latitude, p.longitude
          HAVING COUNT(vp.id) > 0
          ORDER BY position_count DESC
          LIMIT 100
        `;

        const portMetrics: Array<any> = [];

        // Calculate congestion for each port
        for (const port of majorPorts) {
          const vesselStats = await prisma.$queryRaw<Array<{
            total_vessels: bigint;
            anchored: bigint;
            moving: bigint;
            avg_speed: number;
          }>>`
            WITH latest_positions AS (
              SELECT DISTINCT ON ("vesselId")
                "vesselId",
                latitude,
                longitude,
                speed,
                "navigationStatus",
                timestamp
              FROM vessel_positions
              WHERE ST_DWithin(
                ST_MakePoint(${port.longitude}, ${port.latitude})::geography,
                ST_MakePoint(longitude, latitude)::geography,
                20000
              )
              AND timestamp > NOW() - INTERVAL '2 hours'
              ORDER BY "vesselId", timestamp DESC
            )
            SELECT
              COUNT(*)::bigint as total_vessels,
              COUNT(*) FILTER (WHERE speed < 0.5)::bigint as anchored,
              COUNT(*) FILTER (WHERE speed >= 0.5)::bigint as moving,
              AVG(speed) as avg_speed
            FROM latest_positions
          `;

          const stats = vesselStats[0];
          const vesselsInArea = Number(stats?.total_vessels || 0);
          const vesselsAnchored = Number(stats?.anchored || 0);
          const vesselsMoving = Number(stats?.moving || 0);

          const congestionScore = calculateCongestionScore(vesselsInArea, vesselsAnchored);
          const congestionLevel = getCongestionLevel(congestionScore);
          const estimatedWait = estimateWaitTime(vesselsAnchored);

          const trend = 'stable'; // Simplified for now

          portMetrics.push({
            portId: port.id,
            portName: port.name,
            unlocode: port.unlocode,
            country: port.country,
            latitude: port.latitude,
            longitude: port.longitude,
            vesselsInArea,
            vesselsAnchored,
            vesselsMoving,
            congestionLevel,
            congestionScore,
            averageSpeed: Number(stats?.avg_speed || 0),
            recentArrivals24h: 0,
            recentDepartures24h: 0,
            estimatedWaitTime: estimatedWait,
            trend,
            lastUpdated: new Date().toISOString(),
          });
        }

        // Sort by congestion score
        portMetrics.sort((a, b) => b.congestionScore - a.congestionScore);

        // Build dashboard
        return {
          overview: {
            totalPorts: majorPorts.length,
            portsMonitored: portMetrics.length,
            totalVesselsInPorts: portMetrics.reduce((sum, p) => sum + p.vesselsInArea, 0),
            criticalCongestion: portMetrics.filter(p => p.congestionLevel === 'critical').length,
            highCongestion: portMetrics.filter(p => p.congestionLevel === 'high').length,
            averageWaitTime: Math.round(
              portMetrics
                .filter(p => p.estimatedWaitTime !== null)
                .reduce((sum, p) => sum + (p.estimatedWaitTime || 0), 0) /
              (portMetrics.filter(p => p.estimatedWaitTime !== null).length || 1)
            ),
          },
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
