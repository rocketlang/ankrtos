/**
 * HYBRID VESSEL TRACKER
 * Intelligently switches between AIS live tracking and GFW passive tracking
 * Fills coverage gaps with historical port visit data
 */

import { prisma } from '../lib/prisma.js';
import { GlobalFishingWatchClient } from './global-fishing-watch-ais-fixed.js';

export type TrackingStatus =
  | 'LIVE_AIS'          // Real-time AIS available
  | 'AT_PORT'           // Vessel at port (GFW data)
  | 'IN_TRANSIT'        // Between ports (estimated)
  | 'UNKNOWN';          // No data available

export interface VesselStatus {
  status: TrackingStatus;
  position: {
    lat: number;
    lon: number;
  } | null;
  speed: number | null;
  heading: number | null;
  timestamp: Date;
  source: 'AIS_LIVE' | 'GFW_PORT' | 'ESTIMATED' | 'UNKNOWN';
  quality: number; // 1.0 = live, 0.8 = port, 0.5 = estimated, 0 = unknown
  port?: {
    name: string;
    arrival: Date;
    departure?: Date;
  };
  lastKnown?: {
    position: { lat: number; lon: number };
    timestamp: Date;
    port?: string;
  };
  estimated?: {
    position: { lat: number; lon: number };
    confidence: number;
    method: string;
  };
}

export interface VesselJourney {
  vessel: {
    mmsi: string;
    name: string | null;
    type: string;
  };
  currentStatus: VesselStatus;
  segments: Array<{
    type: 'AIS_LIVE' | 'PORT_VISIT' | 'TRANSIT_GAP' | 'FISHING';
    startTime: Date;
    endTime: Date;
    startPosition?: { lat: number; lon: number };
    endPosition?: { lat: number; lon: number };
    port?: string;
    positions?: Array<{ lat: number; lon: number; timestamp: Date }>;
    estimatedRoute?: Array<{ lat: number; lon: number }>;
  }>;
  portVisits: Array<{
    port: string;
    arrival: Date;
    departure: Date;
    duration: number; // hours
    position: { lat: number; lon: number };
  }>;
  stats: {
    totalDistance: number; // nautical miles
    totalDuration: number; // hours
    portStops: number;
    aisGaps: number;
  };
}

export class HybridVesselTracker {
  private gfwClient: GlobalFishingWatchClient;
  private readonly AIS_FRESHNESS_THRESHOLD = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.gfwClient = new GlobalFishingWatchClient();
  }

  /**
   * Get current vessel status with intelligent source switching
   */
  async getVesselStatus(mmsi: string): Promise<VesselStatus> {
    console.log(`[Hybrid Tracker] Checking status for ${mmsi}`);

    // Step 1: Check for recent AIS data
    const aisPosition = await this.getLatestAISPosition(mmsi);

    if (aisPosition && this.isRecent(aisPosition.timestamp)) {
      console.log(`[Hybrid Tracker] ${mmsi} - LIVE AIS available`);
      return {
        status: 'LIVE_AIS',
        position: {
          lat: aisPosition.latitude,
          lon: aisPosition.longitude,
        },
        speed: aisPosition.speed,
        heading: aisPosition.heading,
        timestamp: aisPosition.timestamp,
        source: 'AIS_LIVE',
        quality: 1.0,
      };
    }

    // Step 2: No recent AIS → Check GFW port visits
    const recentPortVisits = await this.getRecentPortVisits(mmsi, 30);

    if (recentPortVisits.length > 0) {
      const latestPort = recentPortVisits[0];
      const now = new Date();
      const portEnd = new Date(latestPort.end);

      // Still at port?
      if (portEnd > now || (now.getTime() - portEnd.getTime()) < 2 * 60 * 60 * 1000) {
        console.log(`[Hybrid Tracker] ${mmsi} - AT PORT: ${latestPort.port?.name}`);
        return {
          status: 'AT_PORT',
          position: latestPort.position,
          speed: 0,
          heading: null,
          timestamp: portEnd,
          source: 'GFW_PORT',
          quality: 0.8,
          port: {
            name: latestPort.port?.name || 'Unknown Port',
            arrival: new Date(latestPort.start),
            departure: portEnd,
          },
        };
      }

      // In transit between ports
      const daysSinceDeparture = (now.getTime() - portEnd.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceDeparture < 30) {
        console.log(`[Hybrid Tracker] ${mmsi} - IN TRANSIT (${daysSinceDeparture.toFixed(1)} days since last port)`);

        // Try to predict next port and estimate position
        const estimatedPosition = await this.estimatePosition(mmsi, latestPort, recentPortVisits);

        return {
          status: 'IN_TRANSIT',
          position: estimatedPosition.position,
          speed: estimatedPosition.estimatedSpeed,
          heading: null,
          timestamp: now,
          source: 'ESTIMATED',
          quality: 0.5,
          lastKnown: {
            position: latestPort.position,
            timestamp: portEnd,
            port: latestPort.port?.name,
          },
          estimated: {
            position: estimatedPosition.position,
            confidence: estimatedPosition.confidence,
            method: 'great_circle_with_speed',
          },
        };
      }
    }

    // Step 3: No data available
    console.log(`[Hybrid Tracker] ${mmsi} - UNKNOWN (no recent data)`);
    return {
      status: 'UNKNOWN',
      position: aisPosition ? { lat: aisPosition.latitude, lon: aisPosition.longitude } : null,
      speed: null,
      heading: null,
      timestamp: aisPosition?.timestamp || new Date(),
      source: 'UNKNOWN',
      quality: 0,
      lastKnown: aisPosition ? {
        position: { lat: aisPosition.latitude, lon: aisPosition.longitude },
        timestamp: aisPosition.timestamp,
      } : undefined,
    };
  }

  /**
   * Get complete vessel journey with gap filling
   */
  async getVesselJourney(mmsi: string, daysBack: number = 30): Promise<VesselJourney | null> {
    console.log(`[Hybrid Tracker] Building journey for ${mmsi} (last ${daysBack} days)`);

    // Get vessel info
    const vessel = await prisma.vessel.findFirst({
      where: { mmsi },
    });

    if (!vessel) {
      console.log(`[Hybrid Tracker] Vessel ${mmsi} not found in database`);
      return null;
    }

    // Get current status
    const currentStatus = await this.getVesselStatus(mmsi);

    // Get port visits from GFW
    const portVisits = await this.getRecentPortVisits(mmsi, daysBack);

    // Get AIS positions
    const aisPositions = await this.getAISHistory(mmsi, daysBack);

    // Build journey segments
    const segments = await this.buildJourneySegments(portVisits, aisPositions);

    // Calculate stats
    const stats = this.calculateJourneyStats(segments, portVisits);

    return {
      vessel: {
        mmsi,
        name: vessel.name,
        type: vessel.type,
      },
      currentStatus,
      segments,
      portVisits: portVisits.map(pv => ({
        port: pv.port?.name || 'Unknown Port',
        arrival: new Date(pv.start),
        departure: new Date(pv.end),
        duration: (new Date(pv.end).getTime() - new Date(pv.start).getTime()) / (1000 * 60 * 60),
        position: pv.position,
      })),
      stats,
    };
  }

  /**
   * Get latest AIS position from database
   */
  private async getLatestAISPosition(mmsi: string) {
    const vessel = await prisma.vessel.findFirst({
      where: { mmsi },
    });

    if (!vessel) return null;

    return await prisma.vesselPosition.findFirst({
      where: { vesselId: vessel.id },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get recent port visits from GFW
   */
  private async getRecentPortVisits(mmsi: string, daysBack: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    try {
      const portVisits = await this.gfwClient.getPortVisits({
        startDate,
        endDate,
        limit: 100,
      });

      // Filter for this vessel
      return portVisits
        .filter(pv => pv.vessel.ssvid === mmsi)
        .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
    } catch (error) {
      console.error(`[Hybrid Tracker] Error fetching port visits:`, error);
      return [];
    }
  }

  /**
   * Get AIS position history
   */
  private async getAISHistory(mmsi: string, daysBack: number) {
    const vessel = await prisma.vessel.findFirst({
      where: { mmsi },
    });

    if (!vessel) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    return await prisma.vesselPosition.findMany({
      where: {
        vesselId: vessel.id,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'asc' },
      take: 1000,
    });
  }

  /**
   * Check if timestamp is recent (within threshold)
   */
  private isRecent(timestamp: Date): boolean {
    return Date.now() - timestamp.getTime() < this.AIS_FRESHNESS_THRESHOLD;
  }

  /**
   * Estimate position during transit
   */
  private async estimatePosition(mmsi: string, lastPort: any, portHistory: any[]) {
    // Simple estimation: assume vessel maintains average speed
    const avgSpeed = 15; // knots (typical container ship)
    const now = new Date();
    const departureTime = new Date(lastPort.end);
    const hoursSinceDeparture = (now.getTime() - departureTime.getTime()) / (1000 * 60 * 60);

    // Distance traveled (nautical miles)
    const distanceTraveled = avgSpeed * hoursSinceDeparture;

    // Try to predict next port based on history
    // For now, just extrapolate along last known bearing
    const estimatedLat = lastPort.position.lat;
    const estimatedLon = lastPort.position.lon + (distanceTraveled / 60); // Rough approximation

    return {
      position: {
        lat: Math.max(-90, Math.min(90, estimatedLat)),
        lon: ((estimatedLon + 180) % 360) - 180, // Wrap longitude
      },
      estimatedSpeed: avgSpeed,
      confidence: Math.max(0, 1 - (hoursSinceDeparture / (24 * 7))), // Confidence decreases over time
    };
  }

  /**
   * Build journey segments from port visits and AIS data
   */
  private async buildJourneySegments(portVisits: any[], aisPositions: any[]) {
    const segments: any[] = [];

    // For now, create segments from port visits
    for (let i = 0; i < portVisits.length; i++) {
      const currentPort = portVisits[i];

      // Add port visit segment
      segments.push({
        type: 'PORT_VISIT',
        startTime: new Date(currentPort.start),
        endTime: new Date(currentPort.end),
        startPosition: currentPort.position,
        endPosition: currentPort.position,
        port: currentPort.port?.name || 'Unknown Port',
      });

      // Add transit gap if there's a next port
      if (i < portVisits.length - 1) {
        const nextPort = portVisits[i + 1];
        segments.push({
          type: 'TRANSIT_GAP',
          startTime: new Date(currentPort.end),
          endTime: new Date(nextPort.start),
          startPosition: currentPort.position,
          endPosition: nextPort.position,
          estimatedRoute: this.calculateGreatCircle(
            currentPort.position,
            nextPort.position,
            20 // 20 intermediate points
          ),
        });
      }
    }

    return segments.reverse(); // Newest first
  }

  /**
   * Calculate great circle route between two points
   */
  private calculateGreatCircle(
    start: { lat: number; lon: number },
    end: { lat: number; lon: number },
    points: number
  ): Array<{ lat: number; lon: number }> {
    const route = [];

    for (let i = 0; i <= points; i++) {
      const fraction = i / points;

      // Simple linear interpolation (not true great circle, but good enough for visualization)
      const lat = start.lat + (end.lat - start.lat) * fraction;
      const lon = start.lon + (end.lon - start.lon) * fraction;

      route.push({ lat, lon });
    }

    return route;
  }

  /**
   * Calculate journey statistics
   */
  private calculateJourneyStats(segments: any[], portVisits: any[]) {
    const totalDuration = segments.reduce((sum, seg) => {
      const duration = (seg.endTime.getTime() - seg.startTime.getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);

    const aisGaps = segments.filter(s => s.type === 'TRANSIT_GAP').length;

    return {
      totalDistance: 0, // TODO: Calculate from segments
      totalDuration,
      portStops: portVisits.length,
      aisGaps,
    };
  }
}
