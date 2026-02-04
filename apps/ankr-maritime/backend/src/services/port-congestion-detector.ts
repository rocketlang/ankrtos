/**
 * Port Congestion Detector
 * Monitors vessel positions and detects congestion at ports
 *
 * Features:
 * - Detects vessels at anchor/moored
 * - Finds nearest port and congestion zone
 * - Tracks wait times
 * - Calculates congestion levels
 * - Marks departures
 */

import { PrismaClient } from '@prisma/client'
import { isPointInPolygon, haversineDistanceNm } from './geofence-engine.js'

const prisma = new PrismaClient()

interface VesselPosition {
  lat: number
  lng: number
}

export class PortCongestionDetector {
  /**
   * Process AIS position update for congestion detection
   */
  async processVesselPosition(
    vesselId: string,
    position: VesselPosition,
    navigationStatus: string,
    timestamp: Date
  ): Promise<void> {
    // Only process vessels at anchor or moored
    if (!['AT_ANCHOR', 'MOORED'].includes(navigationStatus)) {
      return
    }

    // Find nearest port (within 50km)
    const nearbyPort = await this.findNearestPort(position)
    if (!nearbyPort) return

    // Check if vessel is in a congestion zone
    const zone = await this.findCongestionZone(nearbyPort.id, position)
    if (!zone) return

    // Check if we already have an active detection for this vessel
    const existingDetection = await prisma.portCongestionDetection.findFirst({
      where: {
        vesselId,
        portId: nearbyPort.id,
        isActive: true,
      },
    })

    if (existingDetection) {
      // Vessel still in zone - update position
      await prisma.portCongestionDetection.update({
        where: { id: existingDetection.id },
        data: {
          latitude: position.lat,
          longitude: position.lng,
          navigationStatus,
        },
      })
    } else {
      // New arrival - create detection record
      const currentVesselCount = await this.getVesselCountInZone(zone.id)
      const congestionLevel = await this.calculateCongestionLevel(
        zone.id,
        currentVesselCount
      )

      await prisma.portCongestionDetection.create({
        data: {
          vesselId,
          portId: nearbyPort.id,
          zoneId: zone.id,
          detectedAt: timestamp,
          navigationStatus,
          latitude: position.lat,
          longitude: position.lng,
          arrivalTime: timestamp,
          vesselCountAtArrival: currentVesselCount,
          congestionLevel,
          isActive: true,
        },
      })

      console.log(
        `🚢 New congestion detection: Vessel ${vesselId} in ${zone.zoneName} (${congestionLevel})`
      )
    }
  }

  /**
   * Mark vessel as departed from zone
   */
  async processVesselDeparture(
    vesselId: string,
    departureTime: Date
  ): Promise<void> {
    const activeDetections = await prisma.portCongestionDetection.findMany({
      where: {
        vesselId,
        isActive: true,
      },
    })

    for (const detection of activeDetections) {
      const waitTimeHours =
        (departureTime.getTime() - detection.arrivalTime.getTime()) /
        (1000 * 60 * 60)

      // Estimate detention cost (assume $10,000/day for cargo vessels)
      const detentionCost = (waitTimeHours / 24) * 10000

      await prisma.portCongestionDetection.update({
        where: { id: detection.id },
        data: {
          isActive: false,
          departureTime,
          waitTimeHours,
          estimatedDetentionCost: detentionCost,
        },
      })

      console.log(
        `✅ Vessel ${vesselId} departed after ${waitTimeHours.toFixed(1)} hours (cost: $${detentionCost.toFixed(0)})`
      )
    }
  }

  /**
   * Find nearest port within radius
   */
  private async findNearestPort(
    position: VesselPosition
  ): Promise<{ id: string; name: string; unlocode: string } | null> {
    // Get ports within bounding box (~50km = ~0.5 degrees)
    const ports = await prisma.port.findMany({
      where: {
        latitude: {
          gte: position.lat - 0.5,
          lte: position.lat + 0.5,
        },
        longitude: {
          gte: position.lng - 0.5,
          lte: position.lng + 0.5,
        },
      },
      select: {
        id: true,
        name: true,
        unlocode: true,
        latitude: true,
        longitude: true,
      },
    })

    if (ports.length === 0) return null

    // Find closest port using Haversine
    let nearestPort: any = null
    let minDistance = Infinity

    for (const port of ports) {
      if (port.latitude && port.longitude) {
        const distance = haversineDistanceNm(
          position.lat,
          position.lng,
          port.latitude,
          port.longitude
        )

        if (distance < minDistance && distance < 50) {
          // Within 50nm
          minDistance = distance
          nearestPort = port
        }
      }
    }

    return nearestPort
  }

  /**
   * Find congestion zone for vessel position
   */
  private async findCongestionZone(
    portId: string,
    position: VesselPosition
  ): Promise<{
    id: string
    zoneName: string
    zoneType: string
  } | null> {
    // Get all active zones for this port
    const zones = await prisma.portCongestionZone.findMany({
      where: { portId, isActive: true },
      orderBy: { priority: 'desc' }, // Check high-priority zones first
    })

    for (const zone of zones) {
      const boundary = zone.boundaryGeoJson as any

      if (boundary?.type === 'Polygon' && boundary.coordinates?.[0]) {
        const polygonPoints = boundary.coordinates[0].map(
          (coord: number[]) => ({
            lat: coord[1],
            lon: coord[0],
          })
        )

        if (
          isPointInPolygon(position.lat, position.lng, polygonPoints)
        ) {
          return {
            id: zone.id,
            zoneName: zone.zoneName,
            zoneType: zone.zoneType,
          }
        }
      }
    }

    return null // Not in any zone
  }

  /**
   * Count vessels currently in zone
   */
  private async getVesselCountInZone(zoneId: string): Promise<number> {
    return await prisma.portCongestionDetection.count({
      where: {
        zoneId,
        isActive: true,
      },
    })
  }

  /**
   * Calculate congestion level based on capacity thresholds
   */
  private async calculateCongestionLevel(
    zoneId: string,
    currentCount: number
  ): Promise<string> {
    const zone = await prisma.portCongestionZone.findUnique({
      where: { id: zoneId },
    })

    if (!zone) return 'NORMAL'

    if (currentCount >= zone.criticalCapacity) return 'CRITICAL'
    if (currentCount >= zone.highCapacity) return 'HIGH'
    if (currentCount >= zone.normalCapacity) return 'MODERATE'
    return 'NORMAL'
  }
}

export const portCongestionDetector = new PortCongestionDetector()
