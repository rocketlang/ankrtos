/**
 * CII Downgrade Monitor - Automated Cron Job
 *
 * Checks all vessels for CII rating downgrades and sends alerts
 * Runs: Daily at 6 AM UTC (after DCS reports are typically updated)
 */

import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { ciiAlertService } from '../services/cii-alert-service.js';

export class CIIDowngradeMonitor {
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Start the CII monitoring cron job
   */
  start() {
    // Run daily at 6:00 AM UTC
    this.cronJob = cron.schedule('0 6 * * *', async () => {
      console.log('[CII Monitor] Starting daily CII downgrade check...');
      await this.runCheck();
    });

    console.log('✅ CII Downgrade Monitor started (daily at 6:00 AM UTC)');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('CII Downgrade Monitor stopped');
    }
  }

  /**
   * Run the CII check for all organizations
   */
  async runCheck() {
    const startTime = Date.now();
    let totalDowngrades = 0;
    let organizationsChecked = 0;

    try {
      // Get all active organizations
      const organizations = await prisma.organization.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });

      console.log(`[CII Monitor] Checking ${organizations.length} organizations...`);

      // Check each organization
      for (const org of organizations) {
        try {
          const downgrades = await ciiAlertService.checkAllVessels(org.id);

          if (downgrades.length > 0) {
            console.log(
              `[CII Monitor] ${org.name}: Found ${downgrades.length} vessel(s) with CII downgrade`
            );
            totalDowngrades += downgrades.length;
          }

          organizationsChecked++;
        } catch (error) {
          console.error(`[CII Monitor] Error checking organization ${org.name}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `[CII Monitor] Check complete: ${organizationsChecked} orgs, ${totalDowngrades} downgrades found (${duration}ms)`
      );

      // Log statistics
      await this.logCheckRun(organizationsChecked, totalDowngrades, duration);

    } catch (error) {
      console.error('[CII Monitor] Fatal error during check:', error);
    }
  }

  /**
   * Log check run statistics (optional - for monitoring)
   */
  private async logCheckRun(
    orgsChecked: number,
    downgradesFound: number,
    durationMs: number
  ) {
    try {
      // You could log to a monitoring table if needed
      console.log('[CII Monitor] Stats:', {
        timestamp: new Date().toISOString(),
        organizationsChecked: orgsChecked,
        downgradesFound: downgradesFound,
        durationMs,
      });
    } catch (error) {
      console.error('[CII Monitor] Failed to log statistics:', error);
    }
  }

  /**
   * Manual trigger (for testing or on-demand checks)
   */
  async triggerManualCheck(organizationId?: string) {
    console.log('[CII Monitor] Manual check triggered');

    if (organizationId) {
      // Check specific organization
      const downgrades = await ciiAlertService.checkAllVessels(organizationId);
      console.log(`[CII Monitor] Found ${downgrades.length} downgrades for org ${organizationId}`);
      return downgrades;
    } else {
      // Check all organizations
      await this.runCheck();
    }
  }
}

export const ciiDowngradeMonitor = new CIIDowngradeMonitor();
