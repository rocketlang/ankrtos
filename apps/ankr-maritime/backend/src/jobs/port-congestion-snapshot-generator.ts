/**
 * Port Congestion Snapshot Generator
 * Runs hourly via cron: 0 * * * *
 *
 * Generates aggregated congestion metrics for all active zones:
 * - Vessel counts (total, anchored, moored)
 * - Vessel type breakdown
 * - Wait time statistics (avg, max, median)
 * - Congestion level calculation
 * - Trend analysis vs previous snapshot
 */

import { PrismaClient } from '@prisma/client'
import { alertEngine } from '../services/port-congestion-alert-engine.js'

const prisma = new PrismaClient()

export class PortCongestionSnapshotGenerator {
  async generateSnapshots(): Promise<void> {
    console.log('📊 Generating port congestion snapshots...')

    const zones = await prisma.portCongestionZone.findMany({
      where: { isActive: true },
      include: {
        port: {
          select: { name: true, unlocode: true }
        }
      }
    })

    let snapshotsGenerated = 0

    for (const zone of zones) {
      try {
        await this.generateZoneSnapshot(zone)
        snapshotsGenerated++
      } catch (error) {
        console.error(`❌ Error generating snapshot for ${zone.zoneName}:`, error)
      }
    }

    console.log(`✅ Generated ${snapshotsGenerated}/${zones.length} snapshots`)
  }

  private async generateZoneSnapshot(zone: any): Promise<void> {
    const timestamp = new Date()
    timestamp.setMinutes(0, 0, 0) // Round to hour

    // Get all active detections in this zone
    const detections = await prisma.portCongestionDetection.findMany({
      where: {
        zoneId: zone.id,
        isActive: true,
      },
      include: {
        vessel: {
          select: { type: true }
        },
      },
    })

    // Count by navigation status
    const anchoredCount = detections.filter(
      (d) => d.navigationStatus === 'AT_ANCHOR'
    ).length
    const mooredCount = detections.filter(
      (d) => d.navigationStatus === 'MOORED'
    ).length

    // Count by vessel type
    const cargoCount = detections.filter(
      (d) => d.vessel.type === 'general_cargo'
    ).length
    const tankerCount = detections.filter(
      (d) => d.vessel.type === 'tanker'
    ).length
    const containerCount = detections.filter(
      (d) => d.vessel.type === 'container'
    ).length
    const bulkCarrierCount = detections.filter(
      (d) => d.vessel.type === 'bulk_carrier'
    ).length

    // Calculate wait time statistics
    const waitTimes = detections.map((d) => {
      const hours =
        (Date.now() - d.arrivalTime.getTime()) / (1000 * 60 * 60)
      return hours
    })

    const avgWaitTimeHours =
      waitTimes.length > 0
        ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
        : null

    const maxWaitTimeHours =
      waitTimes.length > 0 ? Math.max(...waitTimes) : null

    const medianWaitTimeHours =
      waitTimes.length > 0 ? this.calculateMedian(waitTimes) : null

    // Calculate congestion level
    const vesselCount = detections.length
    const capacityPercent = (vesselCount / zone.normalCapacity) * 100

    let congestionLevel = 'NORMAL'
    if (vesselCount >= zone.criticalCapacity) congestionLevel = 'CRITICAL'
    else if (vesselCount >= zone.highCapacity) congestionLevel = 'HIGH'
    else if (vesselCount >= zone.normalCapacity) congestionLevel = 'MODERATE'

    // Calculate trend (compare with previous snapshot)
    const previousSnapshot = await prisma.portCongestionSnapshot.findFirst({
      where: { zoneId: zone.id },
      orderBy: { timestamp: 'desc' },
    })

    let trend = 'STABLE'
    let changePercent = 0

    if (previousSnapshot && previousSnapshot.vesselCount > 0) {
      changePercent =
        ((vesselCount - previousSnapshot.vesselCount) /
          previousSnapshot.vesselCount) *
        100
      if (changePercent > 5) trend = 'WORSENING'
      else if (changePercent < -5) trend = 'IMPROVING'
    }

    // Create snapshot
    await prisma.portCongestionSnapshot.upsert({
      where: {
        portId_zoneId_timestamp: {
          portId: zone.portId,
          zoneId: zone.id,
          timestamp,
        },
      },
      create: {
        portId: zone.portId,
        zoneId: zone.id,
        timestamp,
        vesselCount,
        anchoredCount,
        mooredCount,
        cargoCount,
        tankerCount,
        containerCount,
        bulkCarrierCount,
        avgWaitTimeHours,
        maxWaitTimeHours,
        medianWaitTimeHours,
        congestionLevel,
        capacityPercent,
        trend,
        changePercent,
      },
      update: {
        vesselCount,
        anchoredCount,
        mooredCount,
        cargoCount,
        tankerCount,
        containerCount,
        bulkCarrierCount,
        avgWaitTimeHours,
        maxWaitTimeHours,
        medianWaitTimeHours,
        congestionLevel,
        capacityPercent,
        trend,
        changePercent,
      },
    })

    console.log(
      `  📊 ${zone.port.name} - ${zone.zoneName}: ${vesselCount} vessels (${congestionLevel})`
    )

    // Check alert conditions
    const createdSnapshot = await prisma.portCongestionSnapshot.findFirst({
      where: {
        portId: zone.portId,
        zoneId: zone.id,
        timestamp,
      },
    })

    if (createdSnapshot) {
      await alertEngine.checkAlertConditions(createdSnapshot.id)
      await alertEngine.autoResolveAlerts(createdSnapshot)
    }
  }

  private calculateMedian(values: number[]): number {
    const sorted = values.slice().sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid]
  }
}

export const snapshotGenerator = new PortCongestionSnapshotGenerator()
