import { prisma } from '../../schema/context.js';
import pino from 'pino';

const logger = pino({ name: 'route-deviation-detector' });

interface RoutePoint {
  lat: number;
  lon: number;
}

/**
 * Detects when a vessel deviates from its planned route
 * Creates DelayAlert with type='route_deviation'
 */
export class RouteDeviationDetector {
  /**
   * Calculate distance between two points in nautical miles
   * Using Haversine formula
   */
  private calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lon - point1.lon);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Calculate perpendicular distance from point to line segment
   */
  private perpendicularDistance(
    point: RoutePoint,
    lineStart: RoutePoint,
    lineEnd: RoutePoint
  ): number {
    // Vector from lineStart to lineEnd
    const lineDx = lineEnd.lon - lineStart.lon;
    const lineDy = lineEnd.lat - lineStart.lat;
    const lineLength = Math.sqrt(lineDx * lineDx + lineDy * lineDy);

    if (lineLength === 0) {
      // Line start and end are the same point
      return this.calculateDistance(point, lineStart);
    }

    // Calculate projection parameter
    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.lon - lineStart.lon) * lineDx + (point.lat - lineStart.lat) * lineDy) /
          (lineLength * lineLength)
      )
    );

    // Calculate closest point on line segment
    const closestPoint = {
      lat: lineStart.lat + t * lineDy,
      lon: lineStart.lon + t * lineDx,
    };

    return this.calculateDistance(point, closestPoint);
  }

  /**
   * Check if vessel has deviated from planned route
   */
  async checkVoyageDeviation(voyageId: string): Promise<{
    hasDeviation: boolean;
    deviationNM?: number;
    currentPosition?: RoutePoint;
  }> {
    try {
      // Get voyage with ports and current vessel position
      const voyage = await prisma.voyage.findUnique({
        where: { id: voyageId },
        include: {
          vessel: {
            include: {
              positions: {
                orderBy: { timestamp: 'desc' },
                take: 1,
              },
            },
          },
          departurePort: true,
          arrivalPort: true,
        },
      });

      if (!voyage) {
        logger.warn(`Voyage not found: ${voyageId}`);
        return { hasDeviation: false };
      }

      // Check if voyage has required data
      if (!voyage.departurePort || !voyage.arrivalPort) {
        logger.debug(`Voyage ${voyageId} missing departure/arrival ports`);
        return { hasDeviation: false };
      }

      if (
        !voyage.departurePort.latitude ||
        !voyage.departurePort.longitude ||
        !voyage.arrivalPort.latitude ||
        !voyage.arrivalPort.longitude
      ) {
        logger.debug(`Voyage ${voyageId} ports missing coordinates`);
        return { hasDeviation: false };
      }

      // Get current position
      const currentPosition = voyage.vessel.positions[0];
      if (!currentPosition) {
        logger.debug(`No position data for voyage ${voyageId}`);
        return { hasDeviation: false };
      }

      const vesselPoint: RoutePoint = {
        lat: currentPosition.latitude,
        lon: currentPosition.longitude,
      };

      const departurePoint: RoutePoint = {
        lat: voyage.departurePort.latitude,
        lon: voyage.departurePort.longitude,
      };

      const arrivalPoint: RoutePoint = {
        lat: voyage.arrivalPort.latitude,
        lon: voyage.arrivalPort.longitude,
      };

      // Calculate deviation from straight-line route
      const deviationNM = this.perpendicularDistance(
        vesselPoint,
        departurePoint,
        arrivalPoint
      );

      // Threshold: 50 nautical miles deviation
      const DEVIATION_THRESHOLD_NM = 50;

      return {
        hasDeviation: deviationNM > DEVIATION_THRESHOLD_NM,
        deviationNM,
        currentPosition: vesselPoint,
      };
    } catch (error: any) {
      logger.error(`Error checking voyage deviation for ${voyageId}:`, error.message);
      return { hasDeviation: false };
    }
  }

  /**
   * Create route deviation alert
   */
  async createDeviationAlert(
    voyageId: string,
    deviationNM: number
  ): Promise<void> {
    try {
      // Check if there's already an unresolved deviation alert
      const existingAlert = await prisma.delayAlert.findFirst({
        where: {
          voyageId,
          type: 'route_deviation',
          resolvedAt: null,
        },
      });

      if (existingAlert) {
        // Update existing alert
        await prisma.delayAlert.update({
          where: { id: existingAlert.id },
          data: {
            description: `Vessel deviated ${deviationNM.toFixed(1)} NM from planned route`,
            updatedAt: new Date(),
          },
        });
        logger.info(`Updated deviation alert for voyage ${voyageId}`);
      } else {
        // Create new alert
        await prisma.delayAlert.create({
          data: {
            voyageId,
            type: 'route_deviation',
            severity: deviationNM > 100 ? 'critical' : 'warning',
            rootCause: 'other',
            description: `Vessel deviated ${deviationNM.toFixed(1)} NM from planned route`,
          },
        });
        logger.info(`Created deviation alert for voyage ${voyageId}: ${deviationNM.toFixed(1)} NM`);
      }
    } catch (error: any) {
      logger.error(`Error creating deviation alert:`, error.message);
    }
  }

  /**
   * Check all active voyages for route deviations
   */
  async checkAllVoyages(): Promise<{
    checked: number;
    deviations: number;
  }> {
    try {
      const activeVoyages = await prisma.voyage.findMany({
        where: {
          status: 'in_progress',
        },
        select: { id: true, voyageNumber: true },
      });

      logger.info(`Checking ${activeVoyages.length} active voyages for route deviations`);

      let deviations = 0;

      for (const voyage of activeVoyages) {
        const result = await this.checkVoyageDeviation(voyage.id);

        if (result.hasDeviation && result.deviationNM) {
          await this.createDeviationAlert(voyage.id, result.deviationNM);
          deviations++;
          logger.warn(
            `Deviation detected: ${voyage.voyageNumber} - ${result.deviationNM.toFixed(1)} NM`
          );
        }
      }

      return {
        checked: activeVoyages.length,
        deviations,
      };
    } catch (error: any) {
      logger.error('Error in checkAllVoyages:', error.message);
      return { checked: 0, deviations: 0 };
    }
  }
}

export const routeDeviationDetector = new RouteDeviationDetector();
