/**
 * Tariff Update Workflow Service
 * Phase 6: DA Desk & Port Agency
 *
 * Features:
 * - Quarterly tariff update scheduling
 * - Automated update reminders
 * - Stakeholder notifications
 * - Version comparison and approval workflow
 */

import { prisma } from '../lib/prisma.js';
import { tariffIngestionService } from './tariff-ingestion-service.js';

export interface TariffUpdateCycle {
  id: string;
  quarter: string; // Q1, Q2, Q3, Q4
  year: number;
  scheduledDate: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  portsUpdated: number;
  totalPorts: number;
  stakeholdersNotified: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface UpdateReminder {
  id: string;
  portId: string;
  portName: string;
  currentTariffDate: Date;
  nextUpdateDue: Date;
  daysUntilDue: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notificationsSent: number;
  lastNotifiedAt?: Date;
}

export interface StakeholderNotification {
  recipientEmail: string;
  recipientName: string;
  recipientRole: string;
  notificationType: 'update_reminder' | 'update_completed' | 'price_change_alert';
  portIds: string[];
  message: string;
  sentAt: Date;
}

class TariffUpdateWorkflowService {
  /**
   * Create quarterly update cycle
   */
  async createUpdateCycle(quarter: string, year: number): Promise<TariffUpdateCycle> {
    // Calculate scheduled date (15th of first month of quarter)
    const quarterMonths = {
      Q1: 0, // January
      Q2: 3, // April
      Q3: 6, // July
      Q4: 9, // October
    };

    const month = quarterMonths[quarter as keyof typeof quarterMonths];
    const scheduledDate = new Date(year, month, 15);

    const cycle: TariffUpdateCycle = {
      id: `cycle-${quarter}-${year}`,
      quarter,
      year,
      scheduledDate,
      status: 'scheduled',
      portsUpdated: 0,
      totalPorts: 0,
      stakeholdersNotified: false,
      createdAt: new Date(),
    };

    // In production: Store in database
    // await prisma.tariffUpdateCycle.create({ data: cycle });

    return cycle;
  }

  /**
   * Get upcoming update reminders
   */
  async getUpcomingReminders(
    organizationId: string,
    daysAhead: number = 30
  ): Promise<UpdateReminder[]> {
    // In production: Query database for ports with tariffs expiring soon
    // const ports = await prisma.port.findMany({
    //   where: {
    //     organizationId,
    //     tariffs: {
    //       some: {
    //         effectiveDate: { lte: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000) },
    //       },
    //     },
    //   },
    // });

    // Simulated reminders
    const reminders: UpdateReminder[] = [
      {
        id: 'rem-1',
        portId: 'port-singapore',
        portName: 'Port of Singapore',
        currentTariffDate: new Date('2025-10-01'),
        nextUpdateDue: new Date('2026-04-01'),
        daysUntilDue: 60,
        priority: 'medium',
        notificationsSent: 1,
        lastNotifiedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'rem-2',
        portId: 'port-rotterdam',
        portName: 'Port of Rotterdam',
        currentTariffDate: new Date('2025-07-01'),
        nextUpdateDue: new Date('2026-01-01'),
        daysUntilDue: 15,
        priority: 'urgent',
        notificationsSent: 3,
        lastNotifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'rem-3',
        portId: 'port-shanghai',
        portName: 'Port of Shanghai',
        currentTariffDate: new Date('2025-12-01'),
        nextUpdateDue: new Date('2026-06-01'),
        daysUntilDue: 120,
        priority: 'low',
        notificationsSent: 0,
      },
    ];

    return reminders;
  }

  /**
   * Calculate reminder priority based on days until due
   */
  private calculatePriority(daysUntilDue: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (daysUntilDue <= 7) return 'urgent';
    if (daysUntilDue <= 30) return 'high';
    if (daysUntilDue <= 60) return 'medium';
    return 'low';
  }

  /**
   * Send update reminders to stakeholders
   */
  async sendUpdateReminders(
    updateCycle: TariffUpdateCycle,
    organizationId: string
  ): Promise<StakeholderNotification[]> {
    // Get stakeholders (DA desk operators, port managers)
    // In production: Query from database
    // const stakeholders = await prisma.user.findMany({
    //   where: {
    //     organizationId,
    //     role: { in: ['da_operator', 'port_manager', 'commercial_manager'] },
    //   },
    // });

    const stakeholders = [
      {
        email: 'da.operator@company.com',
        name: 'DA Operator',
        role: 'da_operator',
      },
      {
        email: 'port.manager@company.com',
        name: 'Port Manager',
        role: 'port_manager',
      },
    ];

    const notifications: StakeholderNotification[] = [];

    for (const stakeholder of stakeholders) {
      const message = this.generateUpdateReminderMessage(updateCycle);

      const notification: StakeholderNotification = {
        recipientEmail: stakeholder.email,
        recipientName: stakeholder.name,
        recipientRole: stakeholder.role,
        notificationType: 'update_reminder',
        portIds: [], // Would be populated with relevant ports
        message,
        sentAt: new Date(),
      };

      // In production: Send actual email
      // await emailService.send(notification);

      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Generate update reminder message
   */
  private generateUpdateReminderMessage(updateCycle: TariffUpdateCycle): string {
    return `
Dear Team,

This is a reminder that the ${updateCycle.quarter} ${updateCycle.year} quarterly tariff update is scheduled for ${updateCycle.scheduledDate.toDateString()}.

Please ensure that you have:
1. Contacted all port agents for updated tariff documents
2. Prepared tariff PDFs for ingestion
3. Reviewed any anticipated price changes

The update cycle will begin on ${updateCycle.scheduledDate.toDateString()}.

Thank you,
Mari8X Tariff Management System
    `.trim();
  }

  /**
   * Start update cycle workflow
   */
  async startUpdateCycle(cycleId: string, organizationId: string): Promise<TariffUpdateCycle> {
    // Get cycle
    // In production: Fetch from database
    const cycle: TariffUpdateCycle = {
      id: cycleId,
      quarter: 'Q1',
      year: 2026,
      scheduledDate: new Date('2026-01-15'),
      status: 'in_progress',
      portsUpdated: 0,
      totalPorts: 100,
      stakeholdersNotified: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    };

    // Update status
    cycle.status = 'in_progress';

    // Send notifications
    await this.sendUpdateReminders(cycle, organizationId);
    cycle.stakeholdersNotified = true;

    // In production: Update in database
    // await prisma.tariffUpdateCycle.update({
    //   where: { id: cycleId },
    //   data: { status: 'in_progress', stakeholdersNotified: true },
    // });

    return cycle;
  }

  /**
   * Complete update cycle
   */
  async completeUpdateCycle(cycleId: string): Promise<TariffUpdateCycle> {
    // Get cycle
    // In production: Fetch from database
    const cycle: TariffUpdateCycle = {
      id: cycleId,
      quarter: 'Q1',
      year: 2026,
      scheduledDate: new Date('2026-01-15'),
      status: 'completed',
      portsUpdated: 95,
      totalPorts: 100,
      stakeholdersNotified: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      completedAt: new Date(),
    };

    // Update status
    cycle.status = 'completed';
    cycle.completedAt = new Date();

    // Send completion notifications
    await this.sendCompletionNotifications(cycle);

    // In production: Update in database
    // await prisma.tariffUpdateCycle.update({
    //   where: { id: cycleId },
    //   data: {
    //     status: 'completed',
    //     completedAt: new Date(),
    //   },
    // });

    return cycle;
  }

  /**
   * Send completion notifications
   */
  private async sendCompletionNotifications(
    cycle: TariffUpdateCycle
  ): Promise<StakeholderNotification[]> {
    const message = `
Dear Team,

The ${cycle.quarter} ${cycle.year} quarterly tariff update has been completed.

Summary:
- Total ports updated: ${cycle.portsUpdated} / ${cycle.totalPorts}
- Completion rate: ${((cycle.portsUpdated / cycle.totalPorts) * 100).toFixed(1)}%
- Completed on: ${cycle.completedAt?.toDateString()}

The updated tariffs are now live in the system.

Thank you,
Mari8X Tariff Management System
    `.trim();

    // In production: Send actual notifications
    return [];
  }

  /**
   * Track port update progress
   */
  async trackPortUpdate(
    cycleId: string,
    portId: string,
    status: 'updated' | 'skipped' | 'failed'
  ): Promise<void> {
    // In production: Update cycle progress
    // await prisma.tariffUpdateCycle.update({
    //   where: { id: cycleId },
    //   data: {
    //     portsUpdated: { increment: status === 'updated' ? 1 : 0 },
    //   },
    // });

    console.log(`Port ${portId} update ${status} for cycle ${cycleId}`);
  }

  /**
   * Get update cycle history
   */
  async getUpdateHistory(organizationId: string, limit: number = 10): Promise<TariffUpdateCycle[]> {
    // In production: Query database
    // return await prisma.tariffUpdateCycle.findMany({
    //   where: { organizationId },
    //   orderBy: { scheduledDate: 'desc' },
    //   take: limit,
    // });

    return [
      {
        id: 'cycle-Q4-2025',
        quarter: 'Q4',
        year: 2025,
        scheduledDate: new Date('2025-10-15'),
        status: 'completed',
        portsUpdated: 98,
        totalPorts: 100,
        stakeholdersNotified: true,
        createdAt: new Date('2025-09-01'),
        completedAt: new Date('2025-11-01'),
      },
      {
        id: 'cycle-Q1-2026',
        quarter: 'Q1',
        year: 2026,
        scheduledDate: new Date('2026-01-15'),
        status: 'in_progress',
        portsUpdated: 45,
        totalPorts: 100,
        stakeholdersNotified: true,
        createdAt: new Date('2025-12-01'),
      },
    ];
  }

  /**
   * Schedule next quarter's update cycle
   */
  async scheduleNextCycle(currentCycle: TariffUpdateCycle): Promise<TariffUpdateCycle> {
    const nextQuarter = this.getNextQuarter(currentCycle.quarter, currentCycle.year);
    return await this.createUpdateCycle(nextQuarter.quarter, nextQuarter.year);
  }

  /**
   * Get next quarter
   */
  private getNextQuarter(
    currentQuarter: string,
    currentYear: number
  ): { quarter: string; year: number } {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const currentIndex = quarters.indexOf(currentQuarter);

    if (currentIndex === 3) {
      // Q4 -> Q1 of next year
      return { quarter: 'Q1', year: currentYear + 1 };
    } else {
      return { quarter: quarters[currentIndex + 1], year: currentYear };
    }
  }
}

export const tariffUpdateWorkflowService = new TariffUpdateWorkflowService();
