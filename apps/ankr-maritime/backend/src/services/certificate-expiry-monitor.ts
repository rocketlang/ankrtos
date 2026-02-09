/**
 * Certificate Expiry Monitor Service
 * Phase 33: Document Management System
 *
 * Monitors certificate expiration dates and sends alerts:
 * - Daily scan of all certificates
 * - Alert thresholds: 90, 60, 30, 14, 7, 3, 1 days
 * - Email notifications to responsible parties
 * - Dashboard alerts
 * - Audit logging
 */

import { PrismaClient } from '@prisma/client';
import { differenceInDays, addDays, startOfDay } from 'date-fns';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

interface ExpiryAlert {
  certificateId: string;
  documentId: string;
  certificateType: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  daysUntilExpiry: number;
  status: 'valid' | 'expiring_soon' | 'expired' | 'critical';
  severity: 'info' | 'warning' | 'critical' | 'urgent';
  vesselId?: string;
  vesselName?: string;
  responsibleUserId?: string;
  organizationId: string;
}

interface AlertThreshold {
  days: number;
  severity: 'info' | 'warning' | 'critical' | 'urgent';
  status: 'valid' | 'expiring_soon' | 'critical';
}

// Alert thresholds in descending order
const ALERT_THRESHOLDS: AlertThreshold[] = [
  { days: 90, severity: 'info', status: 'valid' },
  { days: 60, severity: 'info', status: 'expiring_soon' },
  { days: 30, severity: 'warning', status: 'expiring_soon' },
  { days: 14, severity: 'warning', status: 'expiring_soon' },
  { days: 7, severity: 'critical', status: 'critical' },
  { days: 3, severity: 'critical', status: 'critical' },
  { days: 1, severity: 'urgent', status: 'critical' },
  { days: 0, severity: 'urgent', status: 'expired' },
];

export class CertificateExpiryMonitor {
  /**
   * Main cron job function - runs daily at 00:00 UTC
   */
  async runDailyCheck(): Promise<void> {
    console.log('[CertificateExpiryMonitor] Starting daily certificate expiry check...');

    try {
      const today = startOfDay(new Date());

      // Get all active certificates across all organizations
      const certificates = await prisma.certificateExpiry.findMany({
        where: {
          expiryDate: {
            gte: today, // Only check non-expired or soon-to-expire
          },
          status: {
            not: 'renewed', // Exclude already renewed certificates
          },
        },
        include: {
          document: {
            select: {
              id: true,
              title: true,
              organizationId: true,
              vesselId: true,
              createdById: true,
            },
          },
          vessel: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      console.log(`[CertificateExpiryMonitor] Found ${certificates.length} active certificates to check`);

      const alerts: ExpiryAlert[] = [];
      let processedCount = 0;
      let alertsCreatedCount = 0;

      for (const cert of certificates) {
        const daysUntilExpiry = differenceInDays(cert.expiryDate, today);
        const threshold = this.getAlertThreshold(daysUntilExpiry);

        if (threshold) {
          // Check if we should create an alert for this threshold
          const shouldAlert = await this.shouldCreateAlert(
            cert.id,
            cert.expiryDate,
            threshold.days
          );

          if (shouldAlert) {
            const alert: ExpiryAlert = {
              certificateId: cert.id,
              documentId: cert.document.id,
              certificateType: cert.certificateType,
              certificateNumber: cert.certificateNumber || 'N/A',
              issueDate: cert.issueDate,
              expiryDate: cert.expiryDate,
              daysUntilExpiry,
              status: threshold.status,
              severity: threshold.severity,
              vesselId: cert.vesselId || undefined,
              vesselName: cert.vessel?.name || undefined,
              responsibleUserId: cert.document.createdById || undefined,
              organizationId: cert.document.organizationId,
            };

            alerts.push(alert);
            alertsCreatedCount++;
          }
        }

        processedCount++;
      }

      console.log(`[CertificateExpiryMonitor] Processed ${processedCount} certificates`);
      console.log(`[CertificateExpiryMonitor] Generated ${alertsCreatedCount} new alerts`);

      // Create alert records in database
      if (alerts.length > 0) {
        await this.createAlerts(alerts);
      }

      // Send notifications
      if (alerts.length > 0) {
        await this.sendNotifications(alerts);
      }

      // Update certificate statuses
      await this.updateCertificateStatuses(certificates);

      // Log completion
      await this.logExecution({
        executedAt: new Date(),
        certificatesChecked: processedCount,
        alertsCreated: alertsCreatedCount,
        status: 'success',
      });

      console.log('[CertificateExpiryMonitor] Daily check completed successfully');
    } catch (error) {
      console.error('[CertificateExpiryMonitor] Error during daily check:', error);

      await this.logExecution({
        executedAt: new Date(),
        certificatesChecked: 0,
        alertsCreated: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Get the appropriate alert threshold for given days until expiry
   */
  private getAlertThreshold(daysUntilExpiry: number): AlertThreshold | null {
    // Find the first threshold that matches (in descending order)
    for (const threshold of ALERT_THRESHOLDS) {
      if (daysUntilExpiry <= threshold.days) {
        return threshold;
      }
    }

    return null; // No alert needed (more than 90 days away)
  }

  /**
   * Check if we should create an alert for this certificate and threshold
   * Prevents duplicate alerts for the same threshold period
   */
  private async shouldCreateAlert(
    certificateId: string,
    expiryDate: Date,
    thresholdDays: number
  ): Promise<boolean> {
    const today = startOfDay(new Date());

    // Check if an alert was already created for this threshold
    const existingAlert = await prisma.alert.findFirst({
      where: {
        entityType: 'certificate',
        entityId: certificateId,
        type: 'certificate_expiry',
        metadata: {
          path: ['threshold'],
          equals: thresholdDays,
        },
        createdAt: {
          gte: addDays(today, -1), // Within last 24 hours
        },
      },
    });

    if (existingAlert) {
      return false; // Alert already created for this threshold
    }

    // Only create alert if we're within the threshold window
    const daysUntilExpiry = differenceInDays(expiryDate, today);
    return daysUntilExpiry <= thresholdDays;
  }

  /**
   * Create alert records in database
   */
  private async createAlerts(alerts: ExpiryAlert[]): Promise<void> {
    const alertRecords = alerts.map((alert) => ({
      type: 'certificate_expiry',
      severity: alert.severity,
      title: `Certificate Expiring: ${alert.certificateType}`,
      message: this.formatAlertMessage(alert),
      entityType: 'certificate',
      entityId: alert.certificateId,
      organizationId: alert.organizationId,
      userId: alert.responsibleUserId || null,
      metadata: {
        certificateType: alert.certificateType,
        certificateNumber: alert.certificateNumber,
        expiryDate: alert.expiryDate.toISOString(),
        daysUntilExpiry: alert.daysUntilExpiry,
        threshold: this.getAlertThreshold(alert.daysUntilExpiry)?.days,
        vesselId: alert.vesselId,
        vesselName: alert.vesselName,
        documentId: alert.documentId,
      },
      status: 'active',
      readAt: null,
    }));

    await prisma.alert.createMany({
      data: alertRecords,
    });

    console.log(`[CertificateExpiryMonitor] Created ${alertRecords.length} alert records`);
  }

  /**
   * Format alert message based on severity
   */
  private formatAlertMessage(alert: ExpiryAlert): string {
    const { certificateType, certificateNumber, daysUntilExpiry, vesselName } = alert;

    const vesselInfo = vesselName ? ` for vessel ${vesselName}` : '';
    const certInfo = certificateNumber !== 'N/A' ? ` (${certificateNumber})` : '';

    if (daysUntilExpiry <= 0) {
      return `${certificateType}${certInfo}${vesselInfo} has EXPIRED. Immediate renewal required.`;
    }

    if (daysUntilExpiry === 1) {
      return `${certificateType}${certInfo}${vesselInfo} expires TOMORROW. Urgent renewal required.`;
    }

    if (daysUntilExpiry <= 7) {
      return `${certificateType}${certInfo}${vesselInfo} expires in ${daysUntilExpiry} days. Critical - immediate action required.`;
    }

    if (daysUntilExpiry <= 14) {
      return `${certificateType}${certInfo}${vesselInfo} expires in ${daysUntilExpiry} days. Please initiate renewal process.`;
    }

    if (daysUntilExpiry <= 30) {
      return `${certificateType}${certInfo}${vesselInfo} expires in ${daysUntilExpiry} days. Renewal required soon.`;
    }

    return `${certificateType}${certInfo}${vesselInfo} expires in ${daysUntilExpiry} days. Plan renewal accordingly.`;
  }

  /**
   * Send email/SMS notifications to responsible parties
   */
  private async sendNotifications(alerts: ExpiryAlert[]): Promise<void> {
    // Group alerts by organization and severity
    const alertsByOrg = alerts.reduce((acc, alert) => {
      if (!acc[alert.organizationId]) {
        acc[alert.organizationId] = {
          urgent: [],
          critical: [],
          warning: [],
          info: [],
        };
      }

      acc[alert.organizationId][alert.severity].push(alert);
      return acc;
    }, {} as Record<string, Record<string, ExpiryAlert[]>>);

    for (const [orgId, alertsBySeverity] of Object.entries(alertsByOrg)) {
      // Get organization admin users
      const adminUsers = await prisma.user.findMany({
        where: {
          organizationId: orgId,
          role: { in: ['admin', 'owner'] },
          email: { not: null },
        },
      });

      if (adminUsers.length === 0) {
        console.warn(`[CertificateExpiryMonitor] No admin users found for org ${orgId}`);
        continue;
      }

      // Send urgent/critical alerts immediately
      const urgentAlerts = [
        ...alertsBySeverity.urgent,
        ...alertsBySeverity.critical,
      ];

      if (urgentAlerts.length > 0) {
        await this.sendUrgentNotification(adminUsers, urgentAlerts);
      }

      // Send daily digest for warning/info alerts
      const digestAlerts = [
        ...alertsBySeverity.warning,
        ...alertsBySeverity.info,
      ];

      if (digestAlerts.length > 0) {
        await this.sendDigestNotification(adminUsers, digestAlerts);
      }
    }

    console.log(`[CertificateExpiryMonitor] Sent notifications for ${alerts.length} alerts`);
  }

  /**
   * Send urgent notification (immediate email/SMS)
   */
  private async sendUrgentNotification(
    users: any[],
    alerts: ExpiryAlert[]
  ): Promise<void> {
    // TODO: Implement actual email/SMS sending
    // For now, just log
    console.log(`[CertificateExpiryMonitor] URGENT: Sending alerts to ${users.length} users`);
    alerts.forEach((alert) => {
      console.log(`  - ${alert.certificateType} expires in ${alert.daysUntilExpiry} days`);
    });
  }

  /**
   * Send daily digest notification (combined email)
   */
  private async sendDigestNotification(
    users: any[],
    alerts: ExpiryAlert[]
  ): Promise<void> {
    // TODO: Implement actual email sending
    // For now, just log
    console.log(`[CertificateExpiryMonitor] DIGEST: Sending ${alerts.length} alerts to ${users.length} users`);
  }

  /**
   * Update certificate statuses based on expiry dates
   */
  private async updateCertificateStatuses(certificates: any[]): Promise<void> {
    const today = startOfDay(new Date());
    const updates: { id: string; status: string }[] = [];

    for (const cert of certificates) {
      const daysUntilExpiry = differenceInDays(cert.expiryDate, today);
      let newStatus = cert.status;

      if (daysUntilExpiry < 0) {
        newStatus = 'expired';
      } else if (daysUntilExpiry <= 7) {
        newStatus = 'critical';
      } else if (daysUntilExpiry <= 30) {
        newStatus = 'expiring_soon';
      } else {
        newStatus = 'valid';
      }

      if (newStatus !== cert.status) {
        updates.push({ id: cert.id, status: newStatus });
      }
    }

    // Batch update statuses
    for (const update of updates) {
      await prisma.certificateExpiry.update({
        where: { id: update.id },
        data: { status: update.status },
      });
    }

    console.log(`[CertificateExpiryMonitor] Updated ${updates.length} certificate statuses`);
  }

  /**
   * Log cron job execution
   */
  private async logExecution(log: {
    executedAt: Date;
    certificatesChecked: number;
    alertsCreated: number;
    status: string;
    error?: string;
  }): Promise<void> {
    await prisma.cronJobLog.create({
      data: {
        jobName: 'certificate-expiry-monitor',
        executedAt: log.executedAt,
        status: log.status,
        metadata: {
          certificatesChecked: log.certificatesChecked,
          alertsCreated: log.alertsCreated,
          error: log.error,
        },
      },
    });
  }

  /**
   * Get upcoming expiries for dashboard display
   */
  async getUpcomingExpiries(organizationId: string, days: number = 90): Promise<ExpiryAlert[]> {
    const today = startOfDay(new Date());
    const endDate = addDays(today, days);

    const certificates = await prisma.certificateExpiry.findMany({
      where: {
        document: {
          organizationId,
        },
        expiryDate: {
          gte: today,
          lte: endDate,
        },
        status: {
          not: 'renewed',
        },
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            createdById: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    return certificates.map((cert) => {
      const daysUntilExpiry = differenceInDays(cert.expiryDate, today);
      const threshold = this.getAlertThreshold(daysUntilExpiry);

      return {
        certificateId: cert.id,
        documentId: cert.document.id,
        certificateType: cert.certificateType,
        certificateNumber: cert.certificateNumber || 'N/A',
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        daysUntilExpiry,
        status: threshold?.status || 'valid',
        severity: threshold?.severity || 'info',
        vesselId: cert.vesselId || undefined,
        vesselName: cert.vessel?.name || undefined,
        responsibleUserId: cert.document.createdById || undefined,
        organizationId,
      };
    });
  }

  /**
   * Mark certificate as renewed
   */
  async markAsRenewed(certificateId: string, newCertificateId?: string): Promise<void> {
    await prisma.certificateExpiry.update({
      where: { id: certificateId },
      data: {
        status: 'renewed',
        renewedCertificateId: newCertificateId || null,
        renewedAt: new Date(),
      },
    });

    // Dismiss all active alerts for this certificate
    await prisma.alert.updateMany({
      where: {
        entityType: 'certificate',
        entityId: certificateId,
        status: 'active',
      },
      data: {
        status: 'dismissed',
        readAt: new Date(),
      },
    });

    console.log(`[CertificateExpiryMonitor] Marked certificate ${certificateId} as renewed`);
  }
}

// Singleton instance
export const certificateExpiryMonitor = new CertificateExpiryMonitor();
