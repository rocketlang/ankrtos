/**
 * Port Congestion Analyzer Service
 *
 * Analyzes real-time port congestion using AIS data to predict wait times
 * and generate port readiness scores for incoming vessels.
 *
 * Core Features:
 * - Real-time vessel counting in port area (AIS-based)
 * - Wait time prediction based on current congestion + historical patterns
 * - Port readiness scoring (GREEN/YELLOW/RED)
 * - Optimal arrival speed recommendations
 * - Historical congestion pattern analysis
 *
 * This helps agents and masters make better arrival timing decisions.
 */

import { PrismaClient, Port, VesselArrival } from '@prisma/client';

interface CongestionAnalysis {
  status: 'GREEN' | 'YELLOW' | 'RED';
  vesselsInPort: number;
  vesselsAtAnchorage: number;
  expectedWaitTimeMin: number; // hours
  expectedWaitTimeMax: number; // hours
  factors: string[];
  recommendation: string;
  berthAvailability: string;
  pilotAvailability: string;
  portReadinessScore: string;
}

export class PortCongestionAnalyzerService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Analyze congestion for a specific arrival
   * Main entry point called by ArrivalIntelligenceService
   */
  async analyzeCongestion(arrivalId: string): Promise<CongestionAnalysis> {
    const arrival = await this.prisma.vesselArrival.findUnique({
      where: { id: arrivalId },
      include: {
        port: true,
        vessel: true
      }
    });

    if (!arrival) {
      throw new Error(`Arrival ${arrivalId} not found`);
    }

    console.log(`[CongestionAnalyzer] Analyzing congestion for ${arrival.port.name}`);

    // Get current congestion snapshot
    const currentCongestion = await this.getCurrentCongestion(arrival.port);

    // Get historical patterns
    const historicalPattern = await this.getHistoricalPattern(arrival.port, arrival.etaMostLikely);

    // Combine current + historical for prediction
    const analysis = this.generateAnalysis(
      currentCongestion,
      historicalPattern,
      arrival
    );

    // Update ArrivalIntelligence with congestion data
    await this.updateArrivalIntelligence(arrivalId, analysis);

    // Generate recommendation for optimal arrival
    const recommendation = this.generateRecommendation(analysis, arrival);

    // Log timeline event
    await this.prisma.arrivalTimelineEvent.create({
      data: {
        arrivalId,
        eventType: 'CONGESTION_DETECTED',
        actor: 'SYSTEM',
        action: `Port congestion: ${analysis.status} (${analysis.vesselsInPort} vessels in port, ${analysis.vesselsAtAnchorage} at anchorage)`,
        impact: analysis.status === 'RED' ? 'CRITICAL' : analysis.status === 'YELLOW' ? 'IMPORTANT' : 'INFO',
        metadata: {
          congestionStatus: analysis.status,
          vesselsInPort: analysis.vesselsInPort,
          vesselsAtAnchorage: analysis.vesselsAtAnchorage,
          expectedWaitTimeMin: analysis.expectedWaitTimeMin,
          expectedWaitTimeMax: analysis.expectedWaitTimeMax,
          recommendation: recommendation
        }
      }
    });

    console.log(`[CongestionAnalyzer] Status: ${analysis.status}, Wait time: ${analysis.expectedWaitTimeMin}-${analysis.expectedWaitTimeMax}h`);

    return {
      ...analysis,
      recommendation
    };
  }

  /**
   * Get current real-time congestion using AIS data
   */
  private async getCurrentCongestion(port: Port) {
    if (!port.latitude || !port.longitude) {
      console.warn(`[CongestionAnalyzer] Port ${port.unlocode} has no coordinates`);
      return null;
    }

    // Define port area boundaries (±0.5 degrees ≈ 55km radius)
    const latMin = port.latitude - 0.5;
    const latMax = port.latitude + 0.5;
    const lonMin = port.longitude - 0.5;
    const lonMax = port.longitude + 0.5;

    // Get latest positions for vessels in port area
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const vesselsInArea = await this.prisma.vesselPosition.findMany({
      where: {
        latitude: { gte: latMin, lte: latMax },
        longitude: { gte: lonMin, lte: lonMax },
        timestamp: { gte: oneHourAgo },
        // Navigation status filters (from AIS)
        navigationStatus: {
          in: [
            1,  // At anchor
            5,  // Moored
            0   // Underway using engine (could be maneuvering)
          ]
        }
      },
      include: {
        vessel: true
      },
      distinct: ['vesselId']
    });

    // Categorize vessels
    const vesselsAtAnchorage = vesselsInArea.filter(
      pos => pos.navigationStatus === 1 && pos.speed !== null && pos.speed < 1
    ).length;

    const vesselsMoored = vesselsInArea.filter(
      pos => pos.navigationStatus === 5 || (pos.speed !== null && pos.speed < 0.5)
    ).length;

    const vesselsInPort = vesselsMoored;
    const vesselsWaiting = vesselsAtAnchorage;

    return {
      timestamp: now,
      vesselsInPort,
      vesselsAtAnchorage: vesselsWaiting,
      totalVessels: vesselsInArea.length,
      positions: vesselsInArea
    };
  }

  /**
   * Get historical congestion patterns for this port
   */
  private async getHistoricalPattern(port: Port, eta: Date) {
    // Get historical snapshots for same day-of-week and time-of-day
    const dayOfWeek = eta.getDay();
    const hourOfDay = eta.getHours();

    // Query last 30 days of congestion snapshots
    const thirtyDaysAgo = new Date(eta);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalSnapshots = await this.prisma.portCongestionSnapshot.findMany({
      where: {
        portId: port.id,
        timestamp: { gte: thirtyDaysAgo }
      },
      orderBy: { timestamp: 'desc' }
    });

    if (historicalSnapshots.length === 0) {
      return null;
    }

    // Calculate average wait time
    const avgWaitTime = historicalSnapshots.reduce((sum, s) =>
      sum + (s.averageWaitTime || 0), 0
    ) / historicalSnapshots.length;

    // Calculate average vessels
    const avgVesselsInPort = historicalSnapshots.reduce((sum, s) =>
      sum + s.vesselsInPort, 0
    ) / historicalSnapshots.length;

    const avgVesselsAtAnchorage = historicalSnapshots.reduce((sum, s) =>
      sum + s.vesselsAtAnchorage, 0
    ) / historicalSnapshots.length;

    return {
      avgWaitTime,
      avgVesselsInPort,
      avgVesselsAtAnchorage,
      samplesCount: historicalSnapshots.length
    };
  }

  /**
   * Generate congestion analysis combining current + historical
   */
  private generateAnalysis(
    currentCongestion: any,
    historicalPattern: any,
    arrival: VesselArrival & { port: Port; vessel: any }
  ): CongestionAnalysis {
    // Default values if no data
    if (!currentCongestion) {
      return {
        status: 'GREEN',
        vesselsInPort: 0,
        vesselsAtAnchorage: 0,
        expectedWaitTimeMin: 0,
        expectedWaitTimeMax: 2,
        factors: ['no_ais_data', 'default_estimate'],
        recommendation: '',
        berthAvailability: 'UNKNOWN',
        pilotAvailability: 'AVAILABLE',
        portReadinessScore: 'green'
      };
    }

    const vesselsInPort = currentCongestion.vesselsInPort || 0;
    const vesselsAtAnchorage = currentCongestion.vesselsAtAnchorage || 0;
    const factors: string[] = [];

    // Calculate expected wait time based on vessels waiting
    let expectedWaitTimeMin = 0;
    let expectedWaitTimeMax = 0;

    if (vesselsAtAnchorage === 0) {
      expectedWaitTimeMin = 0;
      expectedWaitTimeMax = 2;
      factors.push('no_wait_expected');
    } else if (vesselsAtAnchorage <= 2) {
      expectedWaitTimeMin = 2;
      expectedWaitTimeMax = 4;
      factors.push('light_wait');
    } else if (vesselsAtAnchorage <= 5) {
      expectedWaitTimeMin = 4;
      expectedWaitTimeMax = 8;
      factors.push('moderate_wait');
    } else {
      expectedWaitTimeMin = 8;
      expectedWaitTimeMax = 16;
      factors.push('heavy_congestion');
    }

    // Adjust based on historical pattern
    if (historicalPattern) {
      const historicalWait = historicalPattern.avgWaitTime;
      if (historicalWait > expectedWaitTimeMin) {
        expectedWaitTimeMin = Math.max(expectedWaitTimeMin, historicalWait * 0.8);
        expectedWaitTimeMax = Math.max(expectedWaitTimeMax, historicalWait * 1.2);
        factors.push('historical_pattern_higher');
      }
    }

    // Determine congestion status
    let status: 'GREEN' | 'YELLOW' | 'RED';
    let portReadinessScore: string;

    if (expectedWaitTimeMax <= 2) {
      status = 'GREEN';
      portReadinessScore = 'green';
      factors.push('smooth_operations');
    } else if (expectedWaitTimeMax <= 8) {
      status = 'YELLOW';
      portReadinessScore = 'yellow';
      factors.push('moderate_delays');
    } else {
      status = 'RED';
      portReadinessScore = 'red';
      factors.push('significant_delays');
    }

    // Berth availability estimation
    let berthAvailability: string;
    if (vesselsInPort > 20) {
      berthAvailability = 'LIMITED';
    } else if (vesselsInPort > 10) {
      berthAvailability = 'MODERATE';
    } else {
      berthAvailability = 'AVAILABLE';
    }

    // Pilot availability (usually available unless severe congestion)
    const pilotAvailability = vesselsAtAnchorage > 8 ? 'DELAYED' : 'AVAILABLE';

    return {
      status,
      vesselsInPort,
      vesselsAtAnchorage,
      expectedWaitTimeMin: Math.round(expectedWaitTimeMin * 10) / 10,
      expectedWaitTimeMax: Math.round(expectedWaitTimeMax * 10) / 10,
      factors,
      recommendation: '',
      berthAvailability,
      pilotAvailability,
      portReadinessScore
    };
  }

  /**
   * Generate recommendation for optimal arrival
   */
  private generateRecommendation(
    analysis: CongestionAnalysis,
    arrival: VesselArrival & { port: Port; vessel: any }
  ): string {
    const { status, expectedWaitTimeMin, expectedWaitTimeMax, vesselsAtAnchorage } = analysis;

    if (status === 'GREEN') {
      return `Port is clear. Proceed at normal speed. Expected smooth arrival.`;
    }

    if (status === 'YELLOW') {
      const avgWait = (expectedWaitTimeMin + expectedWaitTimeMax) / 2;
      return `Moderate congestion. Expected wait: ${avgWait.toFixed(1)} hours. ` +
        `Consider reducing speed by 0.5 knots to avoid anchorage wait. ` +
        `${vesselsAtAnchorage} vessels currently waiting.`;
    }

    // RED status
    const avgWait = (expectedWaitTimeMin + expectedWaitTimeMax) / 2;

    // Calculate optimal speed reduction
    const hoursToETA = (arrival.etaMostLikely.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    const currentDistance = arrival.currentDistance || arrival.distance;

    let speedReduction = '';
    if (hoursToETA > avgWait) {
      // Can afford to slow down
      speedReduction = `Recommend reducing speed by 1-2 knots to arrive after congestion clears. `;
    }

    return `⚠️ HIGH CONGESTION. Expected wait: ${avgWait.toFixed(1)} hours. ` +
      `${vesselsAtAnchorage} vessels at anchorage. ` +
      speedReduction +
      `Monitor congestion updates before final approach.`;
  }

  /**
   * Update ArrivalIntelligence with congestion analysis
   */
  private async updateArrivalIntelligence(
    arrivalId: string,
    analysis: CongestionAnalysis
  ): Promise<void> {
    const existing = await this.prisma.arrivalIntelligence.findUnique({
      where: { arrivalId }
    });

    if (existing) {
      await this.prisma.arrivalIntelligence.update({
        where: { arrivalId },
        data: {
          congestionStatus: analysis.status,
          expectedWaitTimeMin: analysis.expectedWaitTimeMin,
          expectedWaitTimeMax: analysis.expectedWaitTimeMax,
          vesselsInPort: analysis.vesselsInPort,
          vesselsAtAnchorage: analysis.vesselsAtAnchorage,
          congestionFactors: analysis.factors,
          portReadinessScore: analysis.portReadinessScore,
          berthAvailability: analysis.berthAvailability,
          pilotAvailability: analysis.pilotAvailability,
          recommendations: analysis.recommendation ? {
            congestionOptimization: analysis.recommendation
          } : undefined
        }
      });
    }
  }

  /**
   * Create congestion snapshot for historical tracking
   * Should be called periodically (e.g., every hour) via cron
   */
  async createCongestionSnapshot(portId: string): Promise<void> {
    const port = await this.prisma.port.findUnique({
      where: { id: portId }
    });

    if (!port) {
      throw new Error(`Port ${portId} not found`);
    }

    const congestion = await this.getCurrentCongestion(port);

    if (!congestion) {
      console.warn(`[CongestionAnalyzer] Cannot create snapshot for ${port.unlocode} - no coordinate data`);
      return;
    }

    // Calculate average wait time based on vessels waiting
    let averageWaitTime = 0;
    if (congestion.vesselsAtAnchorage > 0) {
      // Rough estimate: 2-3 hours per vessel in queue
      averageWaitTime = congestion.vesselsAtAnchorage * 2.5;
    }

    // Determine readiness score
    let readinessScore: string;
    if (averageWaitTime <= 2) {
      readinessScore = 'green';
    } else if (averageWaitTime <= 8) {
      readinessScore = 'yellow';
    } else {
      readinessScore = 'red';
    }

    await this.prisma.portCongestionSnapshot.create({
      data: {
        portId,
        zoneId: null,
        timestamp: congestion.timestamp,
        vesselCount: congestion.vesselsInPort + congestion.vesselsAtAnchorage,
        anchoredCount: congestion.vesselsAtAnchorage,
        mooredCount: congestion.vesselsInPort,
        cargoCount: 0, // TODO: Break down by vessel type
        tankerCount: 0,
        containerCount: 0,
        bulkCarrierCount: 0,
        avgWaitTimeHours: averageWaitTime,
        maxWaitTimeHours: averageWaitTime > 0 ? averageWaitTime * 1.5 : null,
        medianWaitTimeHours: averageWaitTime > 0 ? averageWaitTime * 0.9 : null,
        congestionLevel: readinessScore === 'red' ? 'CRITICAL' : readinessScore === 'yellow' ? 'HIGH' : 'LOW',
        capacityPercent: Math.min(100, ((congestion.vesselsInPort + congestion.vesselsAtAnchorage) / 20) * 100), // Assume 20 is max capacity
        trend: 'STABLE',
        changePercent: null
      }
    });

    console.log(`[CongestionAnalyzer] Snapshot created for ${port.name}: ${congestion.vesselsInPort} in port, ${congestion.vesselsAtAnchorage} waiting`);
  }

  /**
   * Get congestion trends for a port (for monitoring/analytics)
   */
  async getCongestionTrends(portId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshots = await this.prisma.portCongestionSnapshot.findMany({
      where: {
        portId,
        timestamp: { gte: startDate }
      },
      orderBy: { timestamp: 'asc' }
    });

    const avgVesselsInPort = snapshots.reduce((sum, s) =>
      sum + s.vesselsInPort, 0
    ) / snapshots.length;

    const avgVesselsWaiting = snapshots.reduce((sum, s) =>
      sum + s.vesselsAtAnchorage, 0
    ) / snapshots.length;

    const avgWaitTime = snapshots.reduce((sum, s) =>
      sum + (s.averageWaitTime || 0), 0
    ) / snapshots.length;

    // Calculate congestion score (0-100, higher = more congested)
    const congestionScore = Math.min(100,
      (avgVesselsWaiting * 10) + (avgWaitTime * 2)
    );

    return {
      period: `${days} days`,
      samplesCount: snapshots.length,
      avgVesselsInPort: Math.round(avgVesselsInPort),
      avgVesselsWaiting: Math.round(avgVesselsWaiting * 10) / 10,
      avgWaitTime: Math.round(avgWaitTime * 10) / 10,
      congestionScore: Math.round(congestionScore),
      trend: snapshots.length > 1 ? this.calculateTrend(snapshots) : 'STABLE'
    };
  }

  /**
   * Calculate trend direction (improving, worsening, stable)
   */
  private calculateTrend(snapshots: any[]): string {
    if (snapshots.length < 2) return 'STABLE';

    const firstHalf = snapshots.slice(0, Math.floor(snapshots.length / 2));
    const secondHalf = snapshots.slice(Math.floor(snapshots.length / 2));

    const avgFirstHalf = firstHalf.reduce((sum, s) =>
      sum + s.vesselsAtAnchorage, 0
    ) / firstHalf.length;

    const avgSecondHalf = secondHalf.reduce((sum, s) =>
      sum + s.vesselsAtAnchorage, 0
    ) / secondHalf.length;

    const change = ((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100;

    if (change > 20) return 'WORSENING';
    if (change < -20) return 'IMPROVING';
    return 'STABLE';
  }
}
