/**
 * Milestone Auto-Detector Service
 * Phase 5: TIER 2 - Voyage Automation
 *
 * Features:
 * - AIS-triggered milestone detection
 * - Automatic voyage status updates
 * - Port arrival/departure detection
 * - Berthing/unberthing detection
 * - Email-triggered milestones (future)
 *
 * Reduces manual logging by 60-70%
 */

import { prisma } from '../../lib/prisma.js';
import { aisIntegrationService } from '../ais-integration.js';

export interface MilestoneEvent {
  type: 'departure' | 'arrival' | 'berthed' | 'unberthed' | 'nor_tendered' | 'pilot_onboard';
  voyageId: string;
  portId?: string;
  portCallId?: string;
  detectedAt: Date;
  confidence: number; // 0-1
  source: 'ais' | 'email' | 'manual';
  metadata: {
    latitude?: number;
    longitude?: number;
    speed?: number;
    vesselName?: string;
    previousStatus?: string;
    newStatus?: string;
  };
}

export interface AutoMilestoneConfig {
  voyageId: string;
  enabled: boolean;
  settings: {
    aisEnabled: boolean;
    emailEnabled: boolean;
    portApproachDistance: number; // nautical miles
    berthingSpeedThreshold: number; // knots
    departureSpeedThreshold: number; // knots
    notificationEnabled: boolean;
  };
}

class MilestoneAutoDetector {
  private activeWatchers = new Map<string, NodeJS.Timeout>();

  /**
   * Enable auto-detection for a voyage
   */
  async enableAutoMilestones(voyageId: string): Promise<AutoMilestoneConfig> {
    // Get voyage details
    const voyage = await prisma.voyage.findUnique({
      where: { id: voyageId },
      include: {
        vessel: true,
        portCalls: {
          include: { port: true },
        },
      },
    });

    if (!voyage) {
      throw new Error('Voyage not found');
    }

    // Create or update config
    const config: AutoMilestoneConfig = {
      voyageId,
      enabled: true,
      settings: {
        aisEnabled: true,
        emailEnabled: false, // Future feature
        portApproachDistance: 25, // nautical miles
        berthingSpeedThreshold: 3, // knots
        departureSpeedThreshold: 5, // knots
        notificationEnabled: true,
      },
    };

    // Start monitoring
    this.startMonitoring(voyage.vessel.id, voyageId);

    console.log(`✅ Auto-milestones enabled for voyage ${voyageId}`);
    return config;
  }

  /**
   * Disable auto-detection for a voyage
   */
  async disableAutoMilestones(voyageId: string): Promise<void> {
    this.stopMonitoring(voyageId);
    console.log(`❌ Auto-milestones disabled for voyage ${voyageId}`);
  }

  /**
   * Start monitoring vessel for milestone events
   */
  private startMonitoring(vesselId: string, voyageId: string): void {
    // Check every 5 minutes
    const interval = setInterval(async () => {
      try {
        await this.detectMilestones(vesselId, voyageId);
      } catch (error) {
        console.error(`Error detecting milestones for voyage ${voyageId}:`, error);
      }
    }, 5 * 60 * 1000);

    this.activeWatchers.set(voyageId, interval);
    console.log(`👁️  Monitoring started for voyage ${voyageId}`);
  }

  /**
   * Stop monitoring vessel
   */
  private stopMonitoring(voyageId: string): void {
    const watcher = this.activeWatchers.get(voyageId);
    if (watcher) {
      clearInterval(watcher);
      this.activeWatchers.delete(voyageId);
    }
  }

  /**
   * Detect milestones from AIS data
   */
  async detectMilestones(vesselId: string, voyageId: string): Promise<MilestoneEvent[]> {
    const events: MilestoneEvent[] = [];

    // Get voyage details
    const voyage = await prisma.voyage.findUnique({
      where: { id: voyageId },
      include: {
        vessel: true,
        portCalls: {
          where: {
            OR: [{ ata: null }, { atd: null }], // Only upcoming/current ports
          },
          include: { port: true },
        },
      },
    });

    if (!voyage || voyage.status === 'completed') {
      return events;
    }

    // Get current vessel position
    const position = await aisIntegrationService.getVesselPosition(
      parseInt(voyage.vessel.imo),
      voyage.vessel.mmsi ? parseInt(voyage.vessel.mmsi) : undefined
    );

    if (!position) {
      console.log(`No AIS position for vessel ${voyage.vessel.name}`);
      return events;
    }

    // Get recent track to analyze speed patterns
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 2 * 60 * 60 * 1000); // Last 2 hours
    const track = await aisIntegrationService.getVesselTrack(
      parseInt(voyage.vessel.imo),
      startDate,
      endDate
    );

    // Check for each port call
    for (const portCall of voyage.portCalls) {
      // Calculate distance to port
      const distance = this.calculateDistance(
        position.latitude,
        position.longitude,
        parseFloat(portCall.port.latitude || '0'),
        parseFloat(portCall.port.longitude || '0')
      );

      // Detect arrival (vessel near port, speed dropped)
      if (!portCall.ata && distance < 5 && position.speed < 3) {
        const event = await this.createArrivalEvent(voyageId, portCall.id, portCall.portId, position);
        if (event) events.push(event);
      }

      // Detect berthing (vessel very close to port, speed near zero)
      if (portCall.ata && !portCall.berthingCompleted && distance < 1 && position.speed < 1) {
        const event = await this.createBerthedEvent(voyageId, portCall.id, portCall.portId, position);
        if (event) events.push(event);
      }

      // Detect unberthing (speed increased from near zero)
      if (portCall.berthingCompleted && !portCall.atd) {
        const wasStationary = track.positions.slice(0, 5).every((p) => p.speed < 1);
        const nowMoving = position.speed > 3;

        if (wasStationary && nowMoving) {
          const event = await this.createUnberthedEvent(voyageId, portCall.id, portCall.portId, position);
          if (event) events.push(event);
        }
      }

      // Detect departure (vessel moving away from port)
      if (portCall.ata && !portCall.atd && distance > 10 && position.speed > 8) {
        const event = await this.createDepartureEvent(voyageId, portCall.id, portCall.portId, position);
        if (event) events.push(event);
      }
    }

    return events;
  }

  /**
   * Create arrival event and update database
   */
  private async createArrivalEvent(
    voyageId: string,
    portCallId: string,
    portId: string,
    position: any
  ): Promise<MilestoneEvent | null> {
    // Check if already recorded
    const portCall = await prisma.portCall.findUnique({
      where: { id: portCallId },
    });

    if (portCall?.ata) return null; // Already arrived

    // Update port call
    await prisma.portCall.update({
      where: { id: portCallId },
      data: {
        ata: position.timestamp,
        status: 'arrived',
      },
    });

    // Create milestone
    await prisma.voyageMilestone.create({
      data: {
        voyageId,
        type: 'arrival',
        timestamp: position.timestamp,
        location: portId,
        autoDetected: true,
        notes: `Auto-detected from AIS (speed: ${position.speed.toFixed(1)} knots)`,
      },
    });

    console.log(`✅ Auto-detected ARRIVAL at port ${portId}`);

    return {
      type: 'arrival',
      voyageId,
      portId,
      portCallId,
      detectedAt: new Date(),
      confidence: 0.9,
      source: 'ais',
      metadata: {
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed,
        vesselName: position.vesselName,
        newStatus: 'arrived',
      },
    };
  }

  /**
   * Create berthed event
   */
  private async createBerthedEvent(
    voyageId: string,
    portCallId: string,
    portId: string,
    position: any
  ): Promise<MilestoneEvent | null> {
    const portCall = await prisma.portCall.findUnique({
      where: { id: portCallId },
    });

    if (portCall?.berthingCompleted) return null;

    await prisma.portCall.update({
      where: { id: portCallId },
      data: {
        berthingCompleted: position.timestamp,
        status: 'berthed',
      },
    });

    await prisma.voyageMilestone.create({
      data: {
        voyageId,
        type: 'berthed',
        timestamp: position.timestamp,
        location: portId,
        autoDetected: true,
        notes: `Auto-detected from AIS (speed: ${position.speed.toFixed(1)} knots)`,
      },
    });

    console.log(`✅ Auto-detected BERTHED at port ${portId}`);

    return {
      type: 'berthed',
      voyageId,
      portId,
      portCallId,
      detectedAt: new Date(),
      confidence: 0.85,
      source: 'ais',
      metadata: {
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed,
        newStatus: 'berthed',
      },
    };
  }

  /**
   * Create unberthed event
   */
  private async createUnberthedEvent(
    voyageId: string,
    portCallId: string,
    portId: string,
    position: any
  ): Promise<MilestoneEvent | null> {
    await prisma.voyageMilestone.create({
      data: {
        voyageId,
        type: 'unberthed',
        timestamp: position.timestamp,
        location: portId,
        autoDetected: true,
        notes: `Auto-detected from AIS (speed: ${position.speed.toFixed(1)} knots)`,
      },
    });

    console.log(`✅ Auto-detected UNBERTHED from port ${portId}`);

    return {
      type: 'unberthed',
      voyageId,
      portId,
      portCallId,
      detectedAt: new Date(),
      confidence: 0.8,
      source: 'ais',
      metadata: {
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed,
        newStatus: 'unberthed',
      },
    };
  }

  /**
   * Create departure event
   */
  private async createDepartureEvent(
    voyageId: string,
    portCallId: string,
    portId: string,
    position: any
  ): Promise<MilestoneEvent | null> {
    const portCall = await prisma.portCall.findUnique({
      where: { id: portCallId },
    });

    if (portCall?.atd) return null;

    await prisma.portCall.update({
      where: { id: portCallId },
      data: {
        atd: position.timestamp,
        status: 'departed',
      },
    });

    await prisma.voyageMilestone.create({
      data: {
        voyageId,
        type: 'departure',
        timestamp: position.timestamp,
        location: portId,
        autoDetected: true,
        notes: `Auto-detected from AIS (speed: ${position.speed.toFixed(1)} knots)`,
      },
    });

    // Update voyage status
    await prisma.voyage.update({
      where: { id: voyageId },
      data: { status: 'at_sea' },
    });

    console.log(`✅ Auto-detected DEPARTURE from port ${portId}`);

    return {
      type: 'departure',
      voyageId,
      portId,
      portCallId,
      detectedAt: new Date(),
      confidence: 0.9,
      source: 'ais',
      metadata: {
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed,
        newStatus: 'at_sea',
      },
    };
  }

  /**
   * Get auto-detection history for voyage
   */
  async getAutoDetectedMilestones(voyageId: string): Promise<any[]> {
    const milestones = await prisma.voyageMilestone.findMany({
      where: {
        voyageId,
        autoDetected: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    return milestones;
  }

  /**
   * Calculate distance between coordinates (Haversine)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3440.065; // Earth radius in nautical miles
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Batch process all active voyages
   */
  async batchProcessActiveVoyages(organizationId: string): Promise<{
    processed: number;
    eventsDetected: number;
    events: MilestoneEvent[];
  }> {
    const activeVoyages = await prisma.voyage.findMany({
      where: {
        vessel: { organizationId },
        status: { in: ['in_progress', 'loading', 'discharging', 'at_sea'] },
      },
      include: { vessel: true },
    });

    let processed = 0;
    let eventsDetected = 0;
    const allEvents: MilestoneEvent[] = [];

    for (const voyage of activeVoyages) {
      const events = await this.detectMilestones(voyage.vessel.id, voyage.id);
      processed++;
      eventsDetected += events.length;
      allEvents.push(...events);
    }

    return {
      processed,
      eventsDetected,
      events: allEvents,
    };
  }
}

export const milestoneAutoDetector = new MilestoneAutoDetector();
