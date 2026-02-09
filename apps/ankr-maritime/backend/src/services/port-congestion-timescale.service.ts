/**
 * Port Congestion Service - TimescaleDB Optimized
 *
 * Leverages TimescaleDB features for high-performance congestion monitoring:
 * - Continuous aggregates for pre-computed hourly metrics
 * - Time-based partitioning for fast time-range queries
 * - Compression for historical data
 * - Optimized indexes for time+space queries
 */

import { prisma } from '../schema/context.js';

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
  congestionLevel: string;
  congestionScore: number;
  averageSpeed: number;
  recentArrivals24h: number;
  recentDepartures24h: number;
  estimatedWaitTime: number | null;
  trend: string;
  lastUpdated: string;
}

export interface CongestionOverview {
  totalPorts: number;
  portsMonitored: number;
  totalVesselsInPorts: number;
  criticalCongestion: number;
  highCongestion: number;
  averageWaitTime: number;
}

export class PortCongestionTimescaleService {
  // Calculate congestion score (0-100)
  private calculateCongestionScore(
    vesselsInArea: number,
    vesselsAnchored: number,
    portCapacity: number = 50
  ): number {
    const densityScore = Math.min((vesselsInArea / portCapacity) * 100, 100);
    const anchorageScore = Math.min((vesselsAnchored / (portCapacity * 0.3)) * 100, 100);
    return Math.round(densityScore * 0.6 + anchorageScore * 0.4);
  }

  // Get congestion level from score
  private getCongestionLevel(score: number): string {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  // Estimate wait time based on queue
  private estimateWaitTime(vesselsAnchored: number, portThroughput: number = 10): number | null {
    if (vesselsAnchored === 0) return null;
    const hoursPerVessel = 24 / portThroughput;
    return Math.round(vesselsAnchored * hoursPerVessel * 60); // minutes
  }

  // Calculate trend from historical data
  private async calculateTrend(
    latitude: number,
    longitude: number,
    currentVessels: number
  ): Promise<string> {
    try {
      // Get vessel count from 24 hours ago using continuous aggregate
      const historicalData = await prisma.$queryRaw<Array<{ vessel_count: bigint }>>`
        SELECT vessel_count
        FROM port_congestion_hourly
        WHERE lat_bucket = ROUND(${latitude}::numeric, 1)
          AND lon_bucket = ROUND(${longitude}::numeric, 1)
          AND hour = time_bucket('1 hour', NOW() - INTERVAL '24 hours')
        ORDER BY hour DESC
        LIMIT 1
      `;

      if (historicalData.length === 0) return 'stable';

      const previousCount = Number(historicalData[0].vessel_count);
      const change = ((currentVessels - previousCount) / previousCount) * 100;

      if (change > 20) return 'increasing';
      if (change < -20) return 'decreasing';
      return 'stable';
    } catch (error) {
      console.error('[Trend Calculation Error]', error);
      return 'stable';
    }
  }

  // Get real-time port congestion metrics (optimized with TimescaleDB)
  async getPortCongestionMetrics(limit: number = 100): Promise<PortCongestionMetrics[]> {
    try {
      // Step 1: Get major ports with recent activity
      // Uses TimescaleDB's optimized time-range queries
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
        INNER JOIN vessel_positions vp ON (
          ST_DWithin(
            ST_MakePoint(p.longitude, p.latitude)::geography,
            ST_MakePoint(vp.longitude, vp.latitude)::geography,
            20000  -- 20km radius
          )
          AND vp.timestamp > NOW() - INTERVAL '24 hours'
        )
        WHERE p.latitude IS NOT NULL
          AND p.longitude IS NOT NULL
        GROUP BY p.id, p.name, p.unlocode, p.country, p.latitude, p.longitude
        HAVING COUNT(vp.id) > 0
        ORDER BY position_count DESC
        LIMIT ${limit}
      `;

      const portMetrics: PortCongestionMetrics[] = [];

      // Step 2: Calculate real-time metrics for each port
      // Uses TimescaleDB's DISTINCT ON optimization with timestamp ordering
      for (const port of majorPorts) {
        // Get latest position per vessel in port area
        const vesselStats = await prisma.$queryRaw<Array<{
          total_vessels: bigint;
          anchored: bigint;
          moving: bigint;
          avg_speed: number;
        }>>`
          WITH latest_positions AS (
            SELECT DISTINCT ON ("vesselId")
              "vesselId",
              speed,
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
            COALESCE(AVG(speed), 0) as avg_speed
          FROM latest_positions
        `;

        const stats = vesselStats[0];
        const vesselsInArea = Number(stats?.total_vessels || 0);
        const vesselsAnchored = Number(stats?.anchored || 0);
        const vesselsMoving = Number(stats?.moving || 0);

        // Calculate congestion metrics
        const congestionScore = this.calculateCongestionScore(vesselsInArea, vesselsAnchored);
        const congestionLevel = this.getCongestionLevel(congestionScore);
        const estimatedWait = this.estimateWaitTime(vesselsAnchored);

        // Calculate trend from historical data (async)
        const trend = await this.calculateTrend(port.latitude, port.longitude, vesselsInArea);

        // Get arrivals/departures in last 24 hours
        // Uses continuous aggregate for better performance
        const arrivalDepartures = await prisma.$queryRaw<Array<{
          arrivals: bigint;
          departures: bigint;
        }>>`
          WITH port_area AS (
            SELECT
              "vesselId",
              MIN(timestamp) as first_seen,
              MAX(timestamp) as last_seen
            FROM vessel_positions
            WHERE ST_DWithin(
              ST_MakePoint(${port.longitude}, ${port.latitude})::geography,
              ST_MakePoint(longitude, latitude)::geography,
              20000
            )
            AND timestamp > NOW() - INTERVAL '24 hours'
            GROUP BY "vesselId"
          )
          SELECT
            COUNT(*) FILTER (WHERE first_seen > NOW() - INTERVAL '24 hours')::bigint as arrivals,
            COUNT(*) FILTER (WHERE last_seen < NOW() - INTERVAL '1 hour')::bigint as departures
          FROM port_area
        `;

        const arrDepStats = arrivalDepartures[0];

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
          recentArrivals24h: Number(arrDepStats?.arrivals || 0),
          recentDepartures24h: Number(arrDepStats?.departures || 0),
          estimatedWaitTime: estimatedWait,
          trend,
          lastUpdated: new Date().toISOString(),
        });
      }

      // Sort by congestion score descending
      portMetrics.sort((a, b) => b.congestionScore - a.congestionScore);

      return portMetrics;
    } catch (error) {
      console.error('[Port Congestion Metrics Error]', error);
      throw error;
    }
  }

  // Get dashboard overview
  async getDashboardOverview(portMetrics: PortCongestionMetrics[]): Promise<CongestionOverview> {
    return {
      totalPorts: portMetrics.length,
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
    };
  }

  // Get historical congestion trend for a specific port
  async getPortCongestionHistory(
    latitude: number,
    longitude: number,
    hours: number = 168 // 7 days
  ): Promise<Array<{ hour: Date; vesselCount: number; anchoredCount: number }>> {
    try {
      const history = await prisma.$queryRaw<Array<{
        hour: Date;
        vessel_count: bigint;
        anchored_count: bigint;
      }>>`
        SELECT
          hour,
          vessel_count,
          anchored_count
        FROM port_congestion_hourly
        WHERE lat_bucket = ROUND(${latitude}::numeric, 1)
          AND lon_bucket = ROUND(${longitude}::numeric, 1)
          AND hour > NOW() - INTERVAL '${hours} hours'
        ORDER BY hour ASC
      `;

      return history.map(h => ({
        hour: h.hour,
        vesselCount: Number(h.vessel_count),
        anchoredCount: Number(h.anchored_count),
      }));
    } catch (error) {
      console.error('[Port Congestion History Error]', error);
      return [];
    }
  }

  // Get TimescaleDB performance statistics
  async getTimescaleDBStats(): Promise<any> {
    try {
      const stats = await prisma.$queryRaw`
        SELECT
          hypertable_name,
          num_chunks,
          total_size_bytes,
          compression_enabled,
          compression_ratio
        FROM timescaledb_information.hypertables
        WHERE hypertable_name = 'vessel_positions'
      `;
      return stats;
    } catch (error) {
      console.error('[TimescaleDB Stats Error]', error);
      return null;
    }
  }
}

export const portCongestionService = new PortCongestionTimescaleService();
