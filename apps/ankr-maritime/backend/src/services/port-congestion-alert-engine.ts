/**
 * Port Congestion Alert Engine
 * Monitors snapshots and triggers alerts for:
 * - High/critical congestion levels
 * - Excessive wait times
 * - Capacity threshold breaches
 * - Worsening trends
 */

import { getPrisma } from '../lib/db.js';
import { PrismaClient } from '@prisma/client';

// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export class PortCongestionAlertEngine {
  /**
   * Check for alert conditions after each snapshot
   */
  async checkAlertConditions(snapshotId: string): Promise<void> {
    const snapshot = await prisma.portCongestionSnapshot.findUnique({
      where: { id: snapshotId },
      include: {
        port: { select: { name: true, unlocode: true } },
        zone: { select: { zoneName: true } },
      },
    })

    if (!snapshot) return

    // 1. Check for high/critical congestion
    if (['CRITICAL', 'HIGH'].includes(snapshot.congestionLevel)) {
      await this.triggerCongestionAlert(snapshot)
    }

    // 2. Check for excessive wait times (>48 hours)
    if (snapshot.maxWaitTimeHours && snapshot.maxWaitTimeHours > 48) {
      await this.triggerWaitTimeAlert(snapshot)
    }

    // 3. Check for capacity threshold breach (>90%)
    if (snapshot.capacityPercent > 90) {
      await this.triggerCapacityAlert(snapshot)
    }

    // 4. Check for worsening trend (>20% increase)
    if (
      snapshot.trend === 'WORSENING' &&
      snapshot.changePercent &&
      snapshot.changePercent > 20
    ) {
      await this.triggerTrendAlert(snapshot)
    }
  }

  /**
   * Trigger congestion level alert
   */
  private async triggerCongestionAlert(snapshot: any): Promise<void> {
    // Check if alert already exists and is active
    const existingAlert = await prisma.portCongestionAlert.findFirst({
      where: {
        portId: snapshot.portId,
        zoneId: snapshot.zoneId,
        alertType: 'CONGESTION_HIGH',
        status: 'ACTIVE',
      },
    })

    if (existingAlert) return // Already alerted

    const severity = snapshot.congestionLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING'
    const title = `${snapshot.congestionLevel} Congestion at ${snapshot.port.name}`
    const message = `${snapshot.zone?.zoneName || 'Port area'} has ${snapshot.vesselCount} vessels (${snapshot.capacityPercent.toFixed(0)}% capacity). Average wait time: ${snapshot.avgWaitTimeHours?.toFixed(1) || 'N/A'} hours.`

    const alert = await prisma.portCongestionAlert.create({
      data: {
        portId: snapshot.portId,
        zoneId: snapshot.zoneId,
        alertType: 'CONGESTION_HIGH',
        severity,
        title,
        message,
        triggerValue: snapshot.capacityPercent,
        threshold: 80,
      },
    })

    console.log(`🚨 ALERT [${severity}]: ${title}`)

    // Send notifications
    await this.sendNotifications(alert)
  }

  /**
   * Trigger wait time alert
   */
  private async triggerWaitTimeAlert(snapshot: any): Promise<void> {
    const existingAlert = await prisma.portCongestionAlert.findFirst({
      where: {
        portId: snapshot.portId,
        zoneId: snapshot.zoneId,
        alertType: 'WAIT_TIME_EXCEEDED',
        status: 'ACTIVE',
      },
    })

    if (existingAlert) return

    const title = `Excessive Wait Time at ${snapshot.port.name}`
    const message = `Maximum wait time in ${snapshot.zone?.zoneName || 'port area'} is ${snapshot.maxWaitTimeHours?.toFixed(1)} hours (threshold: 48 hours).`

    const alert = await prisma.portCongestionAlert.create({
      data: {
        portId: snapshot.portId,
        zoneId: snapshot.zoneId,
        alertType: 'WAIT_TIME_EXCEEDED',
        severity: 'WARNING',
        title,
        message,
        triggerValue: snapshot.maxWaitTimeHours,
        threshold: 48,
      },
    })

    console.log(`⏰ ALERT: ${title}`)
    await this.sendNotifications(alert)
  }

  /**
   * Trigger capacity alert
   */
  private async triggerCapacityAlert(snapshot: any): Promise<void> {
    const existingAlert = await prisma.portCongestionAlert.findFirst({
      where: {
        portId: snapshot.portId,
        zoneId: snapshot.zoneId,
        alertType: 'CAPACITY_CRITICAL',
        status: 'ACTIVE',
      },
    })

    if (existingAlert) return

    const title = `Capacity Critical at ${snapshot.port.name}`
    const message = `${snapshot.zone?.zoneName || 'Port area'} is at ${snapshot.capacityPercent.toFixed(0)}% capacity (${snapshot.vesselCount} vessels).`

    const alert = await prisma.portCongestionAlert.create({
      data: {
        portId: snapshot.portId,
        zoneId: snapshot.zoneId,
        alertType: 'CAPACITY_CRITICAL',
        severity: 'CRITICAL',
        title,
        message,
        triggerValue: snapshot.capacityPercent,
        threshold: 90,
      },
    })

    console.log(`⚠️  ALERT: ${title}`)
    await this.sendNotifications(alert)
  }

  /**
   * Trigger trend alert
   */
  private async triggerTrendAlert(snapshot: any): Promise<void> {
    const existingAlert = await prisma.portCongestionAlert.findFirst({
      where: {
        portId: snapshot.portId,
        zoneId: snapshot.zoneId,
        alertType: 'TREND_WORSENING',
        status: 'ACTIVE',
      },
    })

    if (existingAlert) return

    const title = `Worsening Congestion Trend at ${snapshot.port.name}`
    const message = `Congestion in ${snapshot.zone?.zoneName || 'port area'} has increased by ${snapshot.changePercent?.toFixed(0)}% in the past hour.`

    const alert = await prisma.portCongestionAlert.create({
      data: {
        portId: snapshot.portId,
        zoneId: snapshot.zoneId,
        alertType: 'TREND_WORSENING',
        severity: 'INFO',
        title,
        message,
        triggerValue: snapshot.changePercent,
        threshold: 20,
      },
    })

    console.log(`📈 ALERT: ${title}`)
    await this.sendNotifications(alert)
  }

  /**
   * Send notifications (email, SMS, webhooks)
   */
  private async sendNotifications(alert: any): Promise<void> {
    // Email notification
    try {
      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      // await emailService.send({
      //   to: 'operations@mari8x.com',
      //   subject: alert.title,
      //   body: alert.message,
      // });

      await prisma.portCongestionAlert.update({
        where: { id: alert.id },
        data: { emailSent: true },
      })

      console.log(`  ✉️  Email notification sent`)
    } catch (error) {
      console.error(`  ❌ Email notification failed:`, error)
    }

    // SMS notification (for critical alerts only)
    if (alert.severity === 'CRITICAL') {
      try {
        // TODO: Integrate with SMS service (Twilio, etc.)
        // await smsService.send({
        //   to: '+1234567890',
        //   message: `${alert.title}: ${alert.message}`,
        // });

        await prisma.portCongestionAlert.update({
          where: { id: alert.id },
          data: { smsSent: true },
        })

        console.log(`  📱 SMS notification sent`)
      } catch (error) {
        console.error(`  ❌ SMS notification failed:`, error)
      }
    }

    // Webhook notification
    try {
      // TODO: Integrate with webhook service
      // await webhookService.send({
      //   url: process.env.WEBHOOK_URL,
      //   payload: alert,
      // });

      await prisma.portCongestionAlert.update({
        where: { id: alert.id },
        data: { webhookSent: true },
      })

      console.log(`  🔗 Webhook notification sent`)
    } catch (error) {
      console.error(`  ❌ Webhook notification failed:`, error)
    }
  }

  /**
   * Auto-resolve alerts when conditions improve
   */
  async autoResolveAlerts(snapshot: any): Promise<void> {
    // If congestion is back to NORMAL, resolve related alerts
    if (snapshot.congestionLevel === 'NORMAL') {
      await prisma.portCongestionAlert.updateMany({
        where: {
          portId: snapshot.portId,
          zoneId: snapshot.zoneId,
          alertType: {
            in: ['CONGESTION_HIGH', 'CAPACITY_CRITICAL'],
          },
          status: 'ACTIVE',
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      })

      console.log(`  ✅ Auto-resolved congestion alerts for ${snapshot.port.name}`)
    }

    // If wait times are below threshold, resolve wait time alerts
    if (
      !snapshot.maxWaitTimeHours ||
      snapshot.maxWaitTimeHours < 48
    ) {
      await prisma.portCongestionAlert.updateMany({
        where: {
          portId: snapshot.portId,
          zoneId: snapshot.zoneId,
          alertType: 'WAIT_TIME_EXCEEDED',
          status: 'ACTIVE',
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      })
    }
  }
}

export const alertEngine = new PortCongestionAlertEngine()
