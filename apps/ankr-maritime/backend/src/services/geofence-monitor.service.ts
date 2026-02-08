/**
 * GEOFENCE MONITOR SERVICE
 * Monitor vessel positions and detect geofence violations
 */

import { prisma } from '../lib/prisma.js';

interface Geofence {
  id: string;
  name: string;
  fenceType: string;
  centerLat: number | null;
  centerLon: number | null;
  radiusNm: number | null;
  polygonCoords: any;
  vesselIds: string[];
  alertOnEntry: boolean;
  alertOnExit: boolean;
  alertOnDwell: boolean;
  dwellThresholdHrs: number | null;
}

interface VesselPosition {
  vesselId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: Date;
}

export class GeofenceMonitorService {
  /**
   * Check all active geofences and generate alerts
   */
  async checkAllGeofences(): Promise<any[]> {
    try {
      const geofences = await prisma.geofence.findMany({
        where: { active: true },
      });

      console.log(`[Geofence Monitor] Checking ${geofences.length} active geofences`);

      const allAlerts = [];

      for (const geofence of geofences) {
        for (const vesselId of geofence.vesselIds) {
          const alerts = await this.checkVesselGeofence(vesselId, geofence);
          if (alerts.length > 0) {
            allAlerts.push(...alerts);
          }
        }
      }

      console.log(`[Geofence Monitor] Generated ${allAlerts.length} new alerts`);

      return allAlerts;
    } catch (error) {
      console.error('[Geofence Monitor] Error checking geofences:', error);
      return [];
    }
  }

  /**
   * Check a single vessel against a geofence
   */
  private async checkVesselGeofence(vesselId: string, geofence: Geofence): Promise<any[]> {
    try {
      // Get latest vessel position
      const position = await prisma.vesselPosition.findFirst({
        where: { vesselId },
        orderBy: { timestamp: 'desc' },
      });

      if (!position) {
        return [];
      }

      // Check if inside/outside fence
      const isInside =
        geofence.fenceType === 'circle'
          ? this.isInsideCircle(position, geofence)
          : this.isInsidePolygon(position, geofence);

      // Get last known state for this vessel/geofence combination
      const lastAlert = await prisma.geofenceAlert.findFirst({
        where: {
          geofenceId: geofence.id,
          vesselId,
        },
        orderBy: { eventAt: 'desc' },
      });

      const wasInside = lastAlert ? lastAlert.eventType === 'entry' || lastAlert.eventType === 'dwell' : false;

      const alerts = [];

      // Detect entry
      if (isInside && !wasInside && geofence.alertOnEntry) {
        console.log(`[Geofence Monitor] Vessel ${vesselId} ENTERED ${geofence.name}`);
        const alert = await this.createAlert(geofence, vesselId, 'entry', position);
        alerts.push(alert);
      }

      // Detect exit
      if (!isInside && wasInside && geofence.alertOnExit) {
        console.log(`[Geofence Monitor] Vessel ${vesselId} EXITED ${geofence.name}`);
        const alert = await this.createAlert(geofence, vesselId, 'exit', position);
        alerts.push(alert);
      }

      // Check dwell time
      if (isInside && wasInside && geofence.alertOnDwell && geofence.dwellThresholdHrs) {
        const dwellTimeHrs = await this.calculateDwellTime(geofence.id, vesselId);
        if (dwellTimeHrs >= geofence.dwellThresholdHrs) {
          // Only create dwell alert if we haven't created one recently
          const recentDwellAlert = await prisma.geofenceAlert.findFirst({
            where: {
              geofenceId: geofence.id,
              vesselId,
              eventType: 'dwell',
              eventAt: {
                gte: new Date(Date.now() - geofence.dwellThresholdHrs * 60 * 60 * 1000),
              },
            },
          });

          if (!recentDwellAlert) {
            console.log(
              `[Geofence Monitor] Vessel ${vesselId} DWELLING in ${geofence.name} for ${dwellTimeHrs.toFixed(1)}h`
            );
            const alert = await this.createAlert(geofence, vesselId, 'dwell', position);
            alerts.push(alert);
          }
        }
      }

      return alerts;
    } catch (error) {
      console.error(`[Geofence Monitor] Error checking vessel ${vesselId} against ${geofence.name}:`, error);
      return [];
    }
  }

  /**
   * Check if position is inside a circular geofence
   */
  private isInsideCircle(position: VesselPosition, geofence: Geofence): boolean {
    if (!geofence.centerLat || !geofence.centerLon || !geofence.radiusNm) {
      return false;
    }

    const distance = this.haversineDistance(
      position.latitude,
      position.longitude,
      geofence.centerLat,
      geofence.centerLon
    );

    return distance <= geofence.radiusNm;
  }

  /**
   * Check if position is inside a polygon geofence
   * Using ray casting algorithm
   */
  private isInsidePolygon(position: VesselPosition, geofence: Geofence): boolean {
    if (!geofence.polygonCoords) {
      return false;
    }

    const polygon = geofence.polygonCoords as Array<{ lat: number; lon: number }>;
    if (!Array.isArray(polygon) || polygon.length < 3) {
      return false;
    }

    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lon;
      const yi = polygon[i].lat;
      const xj = polygon[j].lon;
      const yj = polygon[j].lat;

      const intersect =
        yi > position.latitude !== yj > position.latitude &&
        position.longitude < ((xj - xi) * (position.latitude - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Calculate how long a vessel has been in a geofence
   */
  private async calculateDwellTime(geofenceId: string, vesselId: string): Promise<number> {
    // Find the most recent entry event
    const entryAlert = await prisma.geofenceAlert.findFirst({
      where: {
        geofenceId,
        vesselId,
        eventType: 'entry',
      },
      orderBy: { eventAt: 'desc' },
    });

    if (!entryAlert) {
      return 0;
    }

    // Check if there's an exit after this entry
    const exitAfterEntry = await prisma.geofenceAlert.findFirst({
      where: {
        geofenceId,
        vesselId,
        eventType: 'exit',
        eventAt: {
          gt: entryAlert.eventAt,
        },
      },
    });

    if (exitAfterEntry) {
      // Vessel has exited, so dwell time is 0
      return 0;
    }

    // Calculate time since entry
    const dwellTimeMs = Date.now() - entryAlert.eventAt.getTime();
    const dwellTimeHrs = dwellTimeMs / (1000 * 60 * 60);

    return dwellTimeHrs;
  }

  /**
   * Create a geofence alert
   */
  private async createAlert(
    geofence: Geofence,
    vesselId: string,
    eventType: string,
    position: VesselPosition
  ): Promise<any> {
    return await prisma.geofenceAlert.create({
      data: {
        geofenceId: geofence.id,
        vesselId,
        eventType,
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed,
        heading: position.heading,
        eventAt: position.timestamp,
        acknowledged: false,
      },
    });
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
