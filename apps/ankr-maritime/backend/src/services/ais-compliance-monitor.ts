/**
 * AIS Compliance Monitoring Service
 * - STS (Ship-to-Ship) transfer detection
 * - Dark activity detection (AIS gaps)
 * - Route deviation monitoring
 */

import { prisma } from '../lib/prisma.js';
import { publishVoyageAlert } from '../schema/subscriptions.js';

interface STSTransfer {
  vessel1Id: string;
  vessel2Id: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  duration: number; // minutes
  proximity: number; // meters
}

interface DarkActivity {
  vesselId: string;
  lastPosition: { latitude: number; longitude: number; timestamp: Date };
  gapDuration: number; // hours
  suspicionLevel: 'low' | 'medium' | 'high';
}

export class AISComplianceMonitor {
  private readonly STS_PROXIMITY_THRESHOLD = 500; // meters
  private readonly STS_MIN_DURATION = 30; // minutes
  private readonly DARK_ACTIVITY_THRESHOLD = 12; // hours
  private readonly HIGH_RISK_DARK_THRESHOLD = 24; // hours

  /**
   * Monitor for STS (Ship-to-Ship) transfers
   * Detects when two vessels are stationary in close proximity
   */
  async detectSTSTransfers(timeWindowMinutes: number = 60): Promise<STSTransfer[]> {
    const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    // Get all recent vessel positions
    const positions = await prisma.vesselPosition.findMany({
      where: {
        timestamp: { gte: since },
        speed: { lt: 2 }, // Slow or stationary
      },
      include: { vessel: true },
      orderBy: { timestamp: 'desc' },
    });

    const transfers: STSTransfer[] = [];
    const processedPairs = new Set<string>();

    // Check proximity between vessels
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const pos1 = positions[i];
        const pos2 = positions[j];

        // Skip if same vessel or already processed
        const pairKey = [pos1.vesselId, pos2.vesselId].sort().join('-');
        if (pos1.vesselId === pos2.vesselId || processedPairs.has(pairKey)) continue;

        // Calculate distance
        const distance = this.calculateDistance(
          pos1.latitude,
          pos1.longitude,
          pos2.latitude,
          pos2.longitude
        );

        // Check if within STS proximity threshold
        if (distance <= this.STS_PROXIMITY_THRESHOLD) {
          // Calculate duration both vessels have been stationary together
          const duration = await this.calculateSTSDuration(pos1.vesselId, pos2.vesselId);

          if (duration >= this.STS_MIN_DURATION) {
            transfers.push({
              vessel1Id: pos1.vesselId,
              vessel2Id: pos2.vesselId,
              latitude: (pos1.latitude + pos2.latitude) / 2,
              longitude: (pos1.longitude + pos2.longitude) / 2,
              timestamp: new Date(),
              duration,
              proximity: distance,
            });

            processedPairs.add(pairKey);

            // Create compliance alert
            await this.createSTSAlert(
              pos1.vesselId,
              pos2.vesselId,
              duration,
              distance,
              pos1.latitude,
              pos1.longitude
            );
          }
        }
      }
    }

    return transfers;
  }

  /**
   * Detect dark activity (AIS gaps > 12 hours)
   */
  async detectDarkActivity(): Promise<DarkActivity[]> {
    const darkActivities: DarkActivity[] = [];

    // Get all active vessels
    const vessels = await prisma.vessel.findMany({
      where: { status: 'active' },
      select: { id: true, name: true, imo: true },
    });

    for (const vessel of vessels) {
      // Get latest position
      const latestPosition = await prisma.vesselPosition.findFirst({
        where: { vesselId: vessel.id },
        orderBy: { timestamp: 'desc' },
      });

      if (!latestPosition) continue;

      // Calculate gap duration
      const now = new Date();
      const gapHours = (now.getTime() - latestPosition.timestamp.getTime()) / (1000 * 60 * 60);

      // Check if exceeds threshold
      if (gapHours >= this.DARK_ACTIVITY_THRESHOLD) {
        const suspicionLevel: 'low' | 'medium' | 'high' =
          gapHours >= this.HIGH_RISK_DARK_THRESHOLD
            ? 'high'
            : gapHours >= 18
            ? 'medium'
            : 'low';

        darkActivities.push({
          vesselId: vessel.id,
          lastPosition: {
            latitude: latestPosition.latitude,
            longitude: latestPosition.longitude,
            timestamp: latestPosition.timestamp,
          },
          gapDuration: gapHours,
          suspicionLevel,
        });

        // Create compliance alert
        await this.createDarkActivityAlert(vessel.id, gapHours, suspicionLevel);
      }
    }

    return darkActivities;
  }

  /**
   * Create STS transfer alert
   */
  private async createSTSAlert(
    vessel1Id: string,
    vessel2Id: string,
    duration: number,
    proximity: number,
    latitude: number,
    longitude: number
  ): Promise<void> {
    const vessel1 = await prisma.vessel.findUnique({ where: { id: vessel1Id } });
    const vessel2 = await prisma.vessel.findUnique({ where: { id: vessel2Id } });

    if (!vessel1 || !vessel2) return;

    const alert = await prisma.alert.create({
      data: {
        organizationId: vessel1.organizationId,
        type: 'sts_transfer_detected',
        severity: 'high',
        title: 'STS Transfer Detected',
        message: `Potential ship-to-ship transfer detected between ${vessel1.name} (IMO ${vessel1.imo}) and ${vessel2.name} (IMO ${vessel2.imo}). Duration: ${Math.round(duration)} minutes, Proximity: ${Math.round(proximity)}m`,
        metadata: {
          vessel1Id,
          vessel2Id,
          vessel1Name: vessel1.name,
          vessel2Name: vessel2.name,
          duration,
          proximity,
          latitude,
          longitude,
          detectedAt: new Date(),
        },
        relatedEntityType: 'vessel',
        relatedEntityId: vessel1Id,
        status: 'active',
        requiresAction: true,
      },
    });

    // Publish real-time notification
    publishVoyageAlert({
      ...alert,
      alertType: 'compliance',
    });
  }

  /**
   * Create dark activity alert
   */
  private async createDarkActivityAlert(
    vesselId: string,
    gapHours: number,
    suspicionLevel: 'low' | 'medium' | 'high'
  ): Promise<void> {
    const vessel = await prisma.vessel.findUnique({ where: { id: vesselId } });
    if (!vessel) return;

    const severityMap = {
      low: 'medium' as const,
      medium: 'high' as const,
      high: 'critical' as const,
    };

    const alert = await prisma.alert.create({
      data: {
        organizationId: vessel.organizationId,
        type: 'dark_activity_detected',
        severity: severityMap[suspicionLevel],
        title: 'Dark Activity Detected',
        message: `${vessel.name} (IMO ${vessel.imo}) has not transmitted AIS for ${Math.round(gapHours)} hours. Last known position: ${new Date(vessel.lastPositionUpdate || '').toISOString()}`,
        metadata: {
          vesselId,
          vesselName: vessel.name,
          imo: vessel.imo,
          gapHours: Math.round(gapHours),
          suspicionLevel,
          lastTransmission: vessel.lastPositionUpdate,
        },
        relatedEntityType: 'vessel',
        relatedEntityId: vesselId,
        status: 'active',
        requiresAction: suspicionLevel === 'high',
      },
    });

    // Publish real-time notification
    publishVoyageAlert({
      ...alert,
      alertType: 'compliance',
    });
  }

  /**
   * Calculate duration two vessels have been in proximity
   */
  private async calculateSTSDuration(vessel1Id: string, vessel2Id: string): Promise<number> {
    const lookbackHours = 6;
    const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

    const [positions1, positions2] = await Promise.all([
      prisma.vesselPosition.findMany({
        where: { vesselId: vessel1Id, timestamp: { gte: since } },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.vesselPosition.findMany({
        where: { vesselId: vessel2Id, timestamp: { gte: since } },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    let proximityDuration = 0;

    for (const pos1 of positions1) {
      const pos2 = positions2.find((p) =>
        Math.abs(p.timestamp.getTime() - pos1.timestamp.getTime()) < 5 * 60 * 1000
      ); // Within 5 minutes

      if (pos2) {
        const distance = this.calculateDistance(
          pos1.latitude,
          pos1.longitude,
          pos2.latitude,
          pos2.longitude
        );

        if (distance <= this.STS_PROXIMITY_THRESHOLD) {
          proximityDuration += 5; // Add 5 minutes (approximate)
        }
      }
    }

    return proximityDuration;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Schedule periodic monitoring
   */
  async startMonitoring(intervalMinutes: number = 30): Promise<void> {
    console.log(`🛡️  AIS Compliance Monitor started (interval: ${intervalMinutes} minutes)`);

    // Initial run
    await this.runMonitoring();

    // Schedule periodic runs
    setInterval(async () => {
      await this.runMonitoring();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Run all monitoring checks
   */
  private async runMonitoring(): Promise<void> {
    try {
      const [stsTransfers, darkActivities] = await Promise.all([
        this.detectSTSTransfers(60),
        this.detectDarkActivity(),
      ]);

      console.log(`✅ AIS Compliance: ${stsTransfers.length} STS transfers, ${darkActivities.length} dark activities detected`);
    } catch (error) {
      console.error('❌ AIS Compliance Monitor error:', error);
    }
  }
}

export const aisComplianceMonitor = new AISComplianceMonitor();
