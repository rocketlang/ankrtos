/**
 * Proximity Detector Service
 *
 * Monitors vessel positions and detects when vessels enter the 200 NM radius
 * of their destination port, triggering the pre-arrival intelligence engine.
 *
 * Core Features:
 * - Real-time AIS position monitoring
 * - Geofence detection (200 NM radius)
 * - Automatic VesselArrival creation
 * - Distance calculation using Haversine formula
 */

import { PrismaClient, Vessel, Port, VesselPosition } from '@prisma/client';

const PROXIMITY_THRESHOLD_NM = 200; // Nautical miles
const EARTH_RADIUS_NM = 3440.065; // Earth's radius in nautical miles

export interface ProximityDetectionResult {
  detected: boolean;
  distance: number; // Distance in nautical miles
  vessel: Vessel;
  port: Port;
  position: VesselPosition;
  arrivalId?: string; // If arrival was created
}

export class ProximityDetectorService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check all active vessels for proximity to their destination ports
   * Called periodically (e.g., every 5 minutes via cron job)
   */
  async checkAllVessels(): Promise<ProximityDetectionResult[]> {
    console.log('[ProximityDetector] Checking all vessels for proximity...');

    // Get all active vessels with their latest position and active voyage
    const vessels = await this.prisma.vessel.findMany({
      where: {
        status: 'active',
        voyages: {
          some: {
            status: 'in_progress'
          }
        }
      },
      include: {
        positions: {
          orderBy: { timestamp: 'desc' },
          take: 1
        },
        voyages: {
          where: { status: 'in_progress' },
          include: {
            arrivalPort: true
          },
          take: 1
        }
      }
    });

    const results: ProximityDetectionResult[] = [];

    for (const vessel of vessels) {
      const latestPosition = vessel.positions[0];
      const activeVoyage = vessel.voyages[0];

      if (!latestPosition || !activeVoyage || !activeVoyage.arrivalPort) {
        continue;
      }

      const port = activeVoyage.arrivalPort;

      // Check if vessel is within proximity threshold
      const result = await this.checkVesselProximity(
        vessel,
        port,
        latestPosition
      );

      if (result.detected) {
        results.push(result);
      }
    }

    console.log(`[ProximityDetector] Detected ${results.length} vessels within 200 NM`);
    return results;
  }

  /**
   * Check if a specific vessel is within proximity of a specific port
   */
  async checkVesselProximity(
    vessel: Vessel,
    port: Port,
    position: VesselPosition
  ): Promise<ProximityDetectionResult> {
    if (!port.latitude || !port.longitude) {
      console.warn(`[ProximityDetector] Port ${port.unlocode} has no coordinates`);
      return {
        detected: false,
        distance: Infinity,
        vessel,
        port,
        position
      };
    }

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      position.latitude,
      position.longitude,
      port.latitude,
      port.longitude
    );

    const detected = distance <= PROXIMITY_THRESHOLD_NM;

    if (detected) {
      // Check if arrival already exists
      const existingArrival = await this.prisma.vesselArrival.findFirst({
        where: {
          vesselId: vessel.id,
          portId: port.id,
          status: {
            in: ['APPROACHING', 'IN_ANCHORAGE', 'BERTHING', 'BERTHED', 'WORKING']
          }
        }
      });

      let arrivalId: string | undefined;

      if (!existingArrival) {
        // Create new arrival record
        console.log(`[ProximityDetector] Creating arrival record for ${vessel.name} → ${port.name} (${distance.toFixed(1)} NM)`);

        const arrival = await this.createArrivalRecord(
          vessel,
          port,
          position,
          distance
        );

        arrivalId = arrival.id;
      } else {
        arrivalId = existingArrival.id;

        // Update distance if changed significantly (> 5 NM)
        if (Math.abs(existingArrival.currentDistance! - distance) > 5) {
          await this.prisma.vesselArrival.update({
            where: { id: existingArrival.id },
            data: {
              currentDistance: distance,
              lastUpdateAt: new Date()
            }
          });
        }
      }

      return {
        detected: true,
        distance,
        vessel,
        port,
        position,
        arrivalId
      };
    }

    return {
      detected: false,
      distance,
      vessel,
      port,
      position
    };
  }

  /**
   * Create a new VesselArrival record when vessel enters 200 NM radius
   */
  private async createArrivalRecord(
    vessel: Vessel,
    port: Port,
    position: VesselPosition,
    distance: number
  ) {
    // Calculate ETA using current speed and distance
    const eta = this.calculateETA(position, distance);

    const arrival = await this.prisma.vesselArrival.create({
      data: {
        vesselId: vessel.id,
        portId: port.id,
        distance,
        latitude: position.latitude,
        longitude: position.longitude,
        currentDistance: distance,
        etaBestCase: eta.bestCase,
        etaMostLikely: eta.mostLikely,
        etaWorstCase: eta.worstCase,
        etaConfidence: eta.confidence,
        etaFactors: eta.factors,
        status: 'APPROACHING'
      }
    });

    // Log event to timeline
    await this.prisma.arrivalTimelineEvent.create({
      data: {
        arrivalId: arrival.id,
        eventType: 'ARRIVAL_DETECTED',
        actor: 'SYSTEM',
        action: `Vessel detected ${distance.toFixed(1)} NM from port`,
        impact: 'IMPORTANT',
        metadata: {
          distance,
          speed: position.speed,
          heading: position.heading
        }
      }
    });

    return arrival;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in nautical miles
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_NM * c;
  }

  /**
   * Calculate ETA based on current position, speed, and distance
   */
  private calculateETA(position: VesselPosition, distanceNM: number) {
    const now = new Date();
    const speed = position.speed || 12; // Default to 12 knots if no speed data

    // Calculate base ETA
    const hoursToArrival = distanceNM / speed;
    const baseETA = new Date(now.getTime() + hoursToArrival * 60 * 60 * 1000);

    // Best case: vessel maintains or increases speed (+10%)
    const bestCaseHours = distanceNM / (speed * 1.1);
    const bestCase = new Date(now.getTime() + bestCaseHours * 60 * 60 * 1000);

    // Worst case: vessel slows down or encounters delays (+20%)
    const worstCaseHours = distanceNM / (speed * 0.85);
    const worstCase = new Date(now.getTime() + worstCaseHours * 60 * 60 * 1000);

    // Confidence based on speed reliability and distance
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    const factors: string[] = [];

    if (speed > 0 && speed < 25) {
      confidence = 'HIGH';
      factors.push('steady_speed');
    }

    if (distanceNM > 150) {
      confidence = 'MEDIUM';
      factors.push('long_distance');
    }

    if (!position.speed || position.speed < 1) {
      confidence = 'LOW';
      factors.push('low_speed_data');
    }

    return {
      mostLikely: baseETA,
      bestCase,
      worstCase,
      confidence,
      factors
    };
  }

  /**
   * Update ETA for an existing arrival based on current position
   */
  async updateArrivalETA(arrivalId: string): Promise<void> {
    const arrival = await this.prisma.vesselArrival.findUnique({
      where: { id: arrivalId },
      include: {
        vessel: {
          include: {
            positions: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        },
        port: true
      }
    });

    if (!arrival || !arrival.vessel.positions[0]) {
      return;
    }

    const position = arrival.vessel.positions[0];
    const port = arrival.port;

    if (!port.latitude || !port.longitude) {
      return;
    }

    const distance = this.calculateDistance(
      position.latitude,
      position.longitude,
      port.latitude,
      port.longitude
    );

    const eta = this.calculateETA(position, distance);

    // Check if ETA changed significantly (> 1 hour)
    const etaDiff = Math.abs(
      eta.mostLikely.getTime() - arrival.etaMostLikely.getTime()
    ) / (1000 * 60 * 60);

    if (etaDiff > 1) {
      await this.prisma.vesselArrival.update({
        where: { id: arrivalId },
        data: {
          currentDistance: distance,
          etaBestCase: eta.bestCase,
          etaMostLikely: eta.mostLikely,
          etaWorstCase: eta.worstCase,
          etaConfidence: eta.confidence,
          etaFactors: eta.factors,
          lastUpdateAt: new Date()
        }
      });

      // Log ETA update event
      await this.prisma.arrivalTimelineEvent.create({
        data: {
          arrivalId,
          eventType: 'ETA_UPDATED',
          actor: 'SYSTEM',
          action: `ETA updated by ${etaDiff.toFixed(1)} hours`,
          impact: etaDiff > 6 ? 'CRITICAL' : 'IMPORTANT',
          metadata: {
            previousETA: arrival.etaMostLikely,
            newETA: eta.mostLikely,
            differenceHours: etaDiff,
            currentDistance: distance
          }
        }
      });
    }
  }
}
