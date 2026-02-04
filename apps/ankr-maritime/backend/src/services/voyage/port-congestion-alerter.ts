import { prisma } from '../../schema/context.js';
import pino from 'pino';

const logger = pino({ name: 'port-congestion-alerter' });

/**
 * Monitors port congestion and creates alerts for approaching vessels
 */
export class PortCongestionAlerter {
  /**
   * Get latest congestion data for a port
   */
  async getPortCongestion(portId: string) {
    return await prisma.portCongestion.findFirst({
      where: { portId },
      orderBy: { timestamp: 'desc' },
      include: { port: true },
    });
  }

  /**
   * Calculate distance between vessel and port in nautical miles
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Check if voyage is approaching a congested port
   */
  async checkApproachingCongestion(voyageId: string): Promise<{
    isCongested: boolean;
    portName?: string;
    avgWaitHours?: number;
    distanceNM?: number;
  }> {
    try {
      // Get voyage with arrival port and current position
      const voyage = await prisma.voyage.findUnique({
        where: { id: voyageId },
        include: {
          arrivalPort: true,
          vessel: {
            include: {
              positions: {
                orderBy: { timestamp: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      if (!voyage?.arrivalPort) {
        return { isCongested: false };
      }

      const currentPosition = voyage.vessel.positions[0];
      if (!currentPosition) {
        return { isCongested: false };
      }

      // Get congestion data for arrival port
      const congestion = await this.getPortCongestion(voyage.arrivalPort.id);

      if (!congestion) {
        return { isCongested: false };
      }

      // Check if port is congested (threshold: 6+ hours wait OR 80%+ berth utilization)
      const isCongested =
        (congestion.avgWaitHours && congestion.avgWaitHours >= 6) ||
        (congestion.berthUtilization && congestion.berthUtilization >= 80);

      if (!isCongested) {
        return { isCongested: false };
      }

      // Calculate distance to port
      const distanceNM = this.calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        voyage.arrivalPort.latitude || 0,
        voyage.arrivalPort.longitude || 0
      );

      // Only alert if within 200 NM of congested port
      if (distanceNM > 200) {
        return { isCongested: false };
      }

      return {
        isCongested: true,
        portName: voyage.arrivalPort.name,
        avgWaitHours: congestion.avgWaitHours || undefined,
        distanceNM,
      };
    } catch (error: any) {
      logger.error(`Error checking congestion for voyage ${voyageId}:`, error.message);
      return { isCongested: false };
    }
  }

  /**
   * Create congestion alert for voyage
   */
  async createCongestionAlert(
    voyageId: string,
    portName: string,
    avgWaitHours: number,
    distanceNM: number
  ): Promise<void> {
    try {
      // Check for existing unresolved congestion alert
      const existingAlert = await prisma.delayAlert.findFirst({
        where: {
          voyageId,
          type: 'congestion',
          resolvedAt: null,
        },
      });

      if (existingAlert) {
        // Update existing
        await prisma.delayAlert.update({
          where: { id: existingAlert.id },
          data: {
            description: `${portName} congested: ${avgWaitHours.toFixed(1)}h avg wait. Vessel ${distanceNM.toFixed(0)} NM away`,
            delayHours: avgWaitHours,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new alert
        await prisma.delayAlert.create({
          data: {
            voyageId,
            type: 'congestion',
            severity: avgWaitHours > 24 ? 'critical' : 'warning',
            rootCause: 'congestion',
            description: `${portName} congested: ${avgWaitHours.toFixed(1)}h avg wait. Vessel ${distanceNM.toFixed(0)} NM away`,
            delayHours: avgWaitHours,
          },
        });
        logger.info(`Created congestion alert for voyage ${voyageId}: ${portName}`);
      }
    } catch (error: any) {
      logger.error('Error creating congestion alert:', error.message);
    }
  }

  /**
   * Check all active voyages for port congestion
   */
  async checkAllVoyages(): Promise<{
    checked: number;
    congestedPorts: number;
  }> {
    try {
      const activeVoyages = await prisma.voyage.findMany({
        where: {
          status: 'in_progress',
        },
        select: { id: true, voyageNumber: true },
      });

      logger.info(`Checking ${activeVoyages.length} voyages for port congestion`);

      let congestedPorts = 0;

      for (const voyage of activeVoyages) {
        const result = await this.checkApproachingCongestion(voyage.id);

        if (result.isCongested && result.avgWaitHours && result.distanceNM && result.portName) {
          await this.createCongestionAlert(
            voyage.id,
            result.portName,
            result.avgWaitHours,
            result.distanceNM
          );
          congestedPorts++;
        }
      }

      return {
        checked: activeVoyages.length,
        congestedPorts,
      };
    } catch (error: any) {
      logger.error('Error checking all voyages:', error.message);
      return { checked: 0, congestedPorts: 0 };
    }
  }

  /**
   * Get congestion level description
   */
  getCongestionLevel(avgWaitHours?: number | null, berthUtil?: number | null): {
    level: 'low' | 'moderate' | 'high' | 'severe';
    color: string;
  } {
    if (!avgWaitHours && !berthUtil) {
      return { level: 'low', color: '#10b981' };
    }

    const wait = avgWaitHours || 0;
    const util = berthUtil || 0;

    if (wait >= 48 || util >= 95) {
      return { level: 'severe', color: '#dc2626' };
    } else if (wait >= 24 || util >= 85) {
      return { level: 'high', color: '#f59e0b' };
    } else if (wait >= 12 || util >= 70) {
      return { level: 'moderate', color: '#eab308' };
    } else {
      return { level: 'low', color: '#10b981' };
    }
  }
}

export const portCongestionAlerter = new PortCongestionAlerter();
