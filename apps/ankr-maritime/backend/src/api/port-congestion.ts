import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PortCongestionMetrics {
  portId: string;
  portName: string;
  unlocode: string;
  country: string;
  latitude: number;
  longitude: number;
  vesselsInArea: number;
  vesselsAnchored: number;
  vesselsMoving: number;
  congestionLevel: 'low' | 'medium' | 'high' | 'critical';
  congestionScore: number; // 0-100
  averageSpeed: number;
  recentArrivals24h: number;
  recentDepartures24h: number;
  estimatedWaitTime: number | null; // minutes
  trend: 'increasing' | 'stable' | 'decreasing';
  lastUpdated: string;
}

export interface CongestionDashboard {
  overview: {
    totalPorts: number;
    portsMonitored: number;
    totalVesselsInPorts: number;
    criticalCongestion: number;
    highCongestion: number;
    averageWaitTime: number;
  };
  topCongested: PortCongestionMetrics[];
  recentlyCleared: PortCongestionMetrics[];
  allPorts: PortCongestionMetrics[];
  lastUpdated: string;
}

/**
 * Calculate congestion score based on vessel density and activity
 */
function calculateCongestionScore(
  vesselsInArea: number,
  vesselsAnchored: number,
  portCapacity: number = 50 // default capacity
): number {
  const densityScore = Math.min((vesselsInArea / portCapacity) * 100, 100);
  const anchorageScore = Math.min((vesselsAnchored / (portCapacity * 0.3)) * 100, 100);

  // Weighted average: 60% density, 40% anchorage
  return Math.round(densityScore * 0.6 + anchorageScore * 0.4);
}

/**
 * Determine congestion level from score
 */
function getCongestionLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

/**
 * Estimate wait time based on anchored vessels and historical data
 */
function estimateWaitTime(vesselsAnchored: number, portThroughput: number = 10): number | null {
  if (vesselsAnchored === 0) return null;

  // Simple estimation: (anchored vessels / daily throughput) * 24 hours * 60 minutes
  // Throughput is vessels per day
  const hoursPerVessel = 24 / portThroughput;
  return Math.round(vesselsAnchored * hoursPerVessel * 60);
}

/**
 * Port Congestion Dashboard API
 */
export async function portCongestionRoutes(app: FastifyInstance) {
  /**
   * Get congestion metrics for all major ports
   */
  app.get('/api/port-congestion/dashboard', async (request, reply) => {
    try {
      // Get major ports (ports with most historical AIS activity)
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
            20000  -- 20km radius
          )
          AND vp.timestamp > NOW() - INTERVAL '24 hours'
        )
        WHERE p.latitude IS NOT NULL
          AND p.longitude IS NOT NULL
          AND p."worldPortIndexNumber" IS NOT NULL  -- Only major ports
        GROUP BY p.id, p.name, p.unlocode, p.country, p.latitude, p.longitude
        HAVING COUNT(vp.id) > 0
        ORDER BY position_count DESC
        LIMIT 100
      `;

      const portMetrics: PortCongestionMetrics[] = [];

      // Calculate congestion for each port
      for (const port of majorPorts) {
        // Get vessel distribution in port area (20km radius)
        const vesselStats = await prisma.$queryRaw<Array<{
          total_vessels: bigint;
          anchored: bigint;
          moving: bigint;
          avg_speed: number;
          arrivals_24h: bigint;
          departures_24h: bigint;
        }>>`
          WITH latest_positions AS (
            SELECT DISTINCT ON (mmsi)
              mmsi,
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
            ORDER BY mmsi, timestamp DESC
          ),
          arrivals AS (
            SELECT COUNT(DISTINCT mmsi) as count
            FROM vessel_positions
            WHERE ST_DWithin(
              ST_MakePoint(${port.longitude}, ${port.latitude})::geography,
              ST_MakePoint(longitude, latitude)::geography,
              20000
            )
            AND timestamp BETWEEN NOW() - INTERVAL '24 hours' AND NOW() - INTERVAL '23 hours'
          ),
          departures AS (
            SELECT COUNT(DISTINCT vp1.mmsi) as count
            FROM vessel_positions vp1
            WHERE NOT EXISTS (
              SELECT 1 FROM vessel_positions vp2
              WHERE vp2.mmsi = vp1.mmsi
              AND vp2.timestamp > vp1.timestamp
              AND ST_DWithin(
                ST_MakePoint(${port.longitude}, ${port.latitude})::geography,
                ST_MakePoint(vp2.longitude, vp2.latitude)::geography,
                20000
              )
            )
            AND vp1.timestamp > NOW() - INTERVAL '24 hours'
          )
          SELECT
            COUNT(*)::bigint as total_vessels,
            COUNT(*) FILTER (WHERE speed < 0.5 OR "navigationStatus" IN ('At anchor', 'Moored'))::bigint as anchored,
            COUNT(*) FILTER (WHERE speed >= 0.5)::bigint as moving,
            AVG(speed) as avg_speed,
            (SELECT count FROM arrivals) as arrivals_24h,
            (SELECT count FROM departures) as departures_24h
          FROM latest_positions
        `;

        const stats = vesselStats[0];
        const vesselsInArea = Number(stats?.total_vessels || 0);
        const vesselsAnchored = Number(stats?.anchored || 0);
        const vesselsMoving = Number(stats?.moving || 0);
        const arrivals = Number(stats?.arrivals_24h || 0);
        const departures = Number(stats?.departures_24h || 0);

        // Calculate congestion metrics
        const congestionScore = calculateCongestionScore(vesselsInArea, vesselsAnchored);
        const congestionLevel = getCongestionLevel(congestionScore);
        const estimatedWait = estimateWaitTime(vesselsAnchored);

        // Determine trend
        let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
        if (arrivals > departures * 1.2) trend = 'increasing';
        else if (departures > arrivals * 1.2) trend = 'decreasing';

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
          recentArrivals24h: arrivals,
          recentDepartures24h: departures,
          estimatedWaitTime: estimatedWait,
          trend,
          lastUpdated: new Date().toISOString(),
        });
      }

      // Sort by congestion score
      portMetrics.sort((a, b) => b.congestionScore - a.congestionScore);

      // Build dashboard overview
      const dashboard: CongestionDashboard = {
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
            portMetrics.filter(p => p.estimatedWaitTime !== null).length || 0
          ),
        },
        topCongested: portMetrics.slice(0, 10),
        recentlyCleared: portMetrics
          .filter(p => p.trend === 'decreasing' && p.congestionScore < 40)
          .slice(0, 10),
        allPorts: portMetrics,
        lastUpdated: new Date().toISOString(),
      };

      // Cache for 5 minutes
      reply.header('Cache-Control', 'public, max-age=300');

      return reply.send(dashboard);
    } catch (error) {
      console.error('[Port Congestion Error]', error);

      // Return mock data on error
      return reply.send({
        overview: {
          totalPorts: 100,
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
      } as CongestionDashboard);
    }
  });

  /**
   * Get congestion details for a specific port
   */
  app.get<{
    Params: { portId: string };
  }>('/api/port-congestion/:portId', async (request, reply) => {
    try {
      const { portId } = request.params;

      const port = await prisma.port.findUnique({
        where: { id: portId },
      });

      if (!port || !port.latitude || !port.longitude) {
        return reply.status(404).send({ error: 'Port not found' });
      }

      // Get detailed vessel list
      const vessels = await prisma.$queryRaw<Array<{
        mmsi: string;
        vessel_name: string | null;
        latitude: number;
        longitude: number;
        speed: number;
        heading: number;
        navigation_status: string | null;
        timestamp: Date;
        distance_km: number;
      }>>`
        SELECT DISTINCT ON (vp.mmsi)
          vp.mmsi,
          v.name as vessel_name,
          vp.latitude,
          vp.longitude,
          vp.speed,
          vp.heading,
          vp."navigationStatus" as navigation_status,
          vp.timestamp,
          ST_Distance(
            ST_MakePoint(${port.longitude}, ${port.latitude})::geography,
            ST_MakePoint(vp.longitude, vp.latitude)::geography
          ) / 1000 as distance_km
        FROM vessel_positions vp
        LEFT JOIN vessels v ON v.mmsi = vp.mmsi
        WHERE ST_DWithin(
          ST_MakePoint(${port.longitude}, ${port.latitude})::geography,
          ST_MakePoint(vp.longitude, vp.latitude)::geography,
          20000
        )
        AND vp.timestamp > NOW() - INTERVAL '2 hours'
        ORDER BY vp.mmsi, vp.timestamp DESC
      `;

      return reply.send({
        port: {
          id: port.id,
          name: port.name,
          unlocode: port.unlocode,
          country: port.country,
          latitude: port.latitude,
          longitude: port.longitude,
        },
        vessels: vessels.map(v => ({
          mmsi: v.mmsi,
          vesselName: v.vessel_name || 'Unknown',
          latitude: v.latitude,
          longitude: v.longitude,
          speed: v.speed,
          heading: v.heading,
          navigationStatus: v.navigation_status || 'Unknown',
          timestamp: v.timestamp,
          distanceFromPort: Math.round(v.distance_km * 10) / 10,
        })),
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Port Detail Error]', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
