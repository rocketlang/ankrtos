/**
 * Periodic KYC Refresh Scheduler
 * Automatically schedules and triggers KYC reviews based on risk level
 */

import { prisma } from '../lib/prisma.js';

export type KYCRefreshInterval = 'monthly' | 'quarterly' | 'semiannually' | 'annually';

export interface KYCRefreshSchedule {
  companyId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  refreshInterval: KYCRefreshInterval;
  lastReviewDate: Date;
  nextReviewDate: Date;
}

export class KYCRefreshScheduler {
  /**
   * Get refresh interval based on risk level
   */
  private getRefreshInterval(riskLevel: string): KYCRefreshInterval {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return 'quarterly'; // 3 months
      case 'medium':
        return 'semiannually'; // 6 months
      case 'low':
      default:
        return 'annually'; // 12 months
    }
  }

  /**
   * Calculate next review date
   */
  private calculateNextReviewDate(
    lastReviewDate: Date,
    interval: KYCRefreshInterval
  ): Date {
    const months = {
      monthly: 1,
      quarterly: 3,
      semiannually: 6,
      annually: 12,
    };

    const nextDate = new Date(lastReviewDate);
    nextDate.setMonth(nextDate.getMonth() + months[interval]);

    return nextDate;
  }

  /**
   * Schedule KYC refresh for a company
   */
  async scheduleRefresh(companyId: string): Promise<KYCRefreshSchedule> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        kycRecord: true,
        counterpartyRiskScore: true,
      },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Determine risk level
    const riskLevel = company.counterpartyRiskScore?.overallRisk || 'medium';
    const refreshInterval = this.getRefreshInterval(riskLevel);

    // Get last review date
    const lastReviewDate =
      company.kycRecord?.lastReviewDate || company.kycRecord?.createdAt || new Date();

    // Calculate next review date
    const nextReviewDate = this.calculateNextReviewDate(lastReviewDate, refreshInterval);

    // Update KYC record
    if (company.kycRecord) {
      await prisma.kYCRecord.update({
        where: { id: company.kycRecord.id },
        data: {
          refreshInterval,
          nextReviewDate,
        },
      });
    }

    return {
      companyId,
      riskLevel: riskLevel as any,
      refreshInterval,
      lastReviewDate,
      nextReviewDate,
    };
  }

  /**
   * Get companies due for KYC refresh
   */
  async getCompaniesForRefresh(): Promise<
    Array<{
      companyId: string;
      companyName: string;
      lastReviewDate: Date;
      nextReviewDate: Date;
      daysOverdue: number;
      riskLevel: string;
    }>
  > {
    const today = new Date();

    const kycRecords = await prisma.kYCRecord.findMany({
      where: {
        OR: [
          { nextReviewDate: { lte: today } }, // Due today or overdue
          { nextReviewDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }, // Due within 30 days
        ],
      },
      include: {
        company: {
          include: {
            counterpartyRiskScore: true,
          },
        },
      },
      orderBy: { nextReviewDate: 'asc' },
    });

    return kycRecords.map((record) => {
      const daysOverdue = Math.floor(
        (today.getTime() - record.nextReviewDate!.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        companyId: record.companyId,
        companyName: record.company.name,
        lastReviewDate: record.lastReviewDate || record.createdAt,
        nextReviewDate: record.nextReviewDate!,
        daysOverdue,
        riskLevel: record.company.counterpartyRiskScore?.overallRisk || 'medium',
      };
    });
  }

  /**
   * Trigger KYC refresh for a company
   */
  async triggerRefresh(companyId: string, userId: string): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { kycRecord: true },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Create KYC refresh task
    await prisma.activityLog.create({
      data: {
        organizationId: company.organizationId,
        userId,
        action: 'kyc_refresh_initiated',
        entityType: 'company',
        entityId: companyId,
        metadata: {
          companyName: company.name,
          previousReviewDate: company.kycRecord?.lastReviewDate,
          triggeredBy: 'scheduled_refresh',
        },
        timestamp: new Date(),
      },
    });

    // Create alert for compliance team
    await prisma.alert.create({
      data: {
        organizationId: company.organizationId,
        type: 'kyc_refresh_due',
        severity: 'medium',
        title: 'KYC Refresh Required',
        message: `KYC review is due for ${company.name}. Please update KYC documentation and screening.`,
        metadata: {
          companyId,
          companyName: company.name,
          lastReviewDate: company.kycRecord?.lastReviewDate,
          nextReviewDate: company.kycRecord?.nextReviewDate,
        },
        relatedEntityType: 'company',
        relatedEntityId: companyId,
        status: 'active',
        requiresAction: true,
      },
    });

    // Update KYC record
    if (company.kycRecord) {
      await prisma.kYCRecord.update({
        where: { id: company.kycRecord.id },
        data: {
          status: 'pending_refresh',
        },
      });
    }
  }

  /**
   * Complete KYC refresh
   */
  async completeRefresh(kycRecordId: string, userId: string): Promise<void> {
    const kycRecord = await prisma.kYCRecord.findUnique({
      where: { id: kycRecordId },
      include: { company: true },
    });

    if (!kycRecord) {
      throw new Error('KYC record not found');
    }

    const now = new Date();
    const refreshInterval = kycRecord.refreshInterval || this.getRefreshInterval(kycRecord.riskScore);
    const nextReviewDate = this.calculateNextReviewDate(now, refreshInterval);

    // Update KYC record
    await prisma.kYCRecord.update({
      where: { id: kycRecordId },
      data: {
        lastReviewDate: now,
        nextReviewDate,
        status: 'approved',
        reviewedBy: userId,
        reviewedAt: now,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: kycRecord.company.organizationId,
        userId,
        action: 'kyc_refresh_completed',
        entityType: 'company',
        entityId: kycRecord.companyId,
        metadata: {
          companyName: kycRecord.company.name,
          reviewDate: now,
          nextReviewDate,
        },
        timestamp: now,
      },
    });
  }

  /**
   * Start periodic KYC refresh scheduler
   */
  async startScheduler(checkIntervalHours: number = 24): Promise<void> {
    console.log(`📅 KYC Refresh Scheduler started (check interval: ${checkIntervalHours} hours)`);

    // Initial run
    await this.runScheduledRefreshes();

    // Schedule periodic checks
    setInterval(async () => {
      await this.runScheduledRefreshes();
    }, checkIntervalHours * 60 * 60 * 1000);
  }

  /**
   * Run scheduled refreshes
   */
  private async runScheduledRefreshes(): Promise<void> {
    try {
      const duForRefresh = await this.getCompaniesForRefresh();
      const overdue = dueForRefresh.filter((c) => c.daysOverdue > 0);

      console.log(`✅ KYC Refresh Check: ${dueForRefresh.length} companies due (${overdue.length} overdue)`);

      // Trigger refreshes for overdue companies
      for (const company of overdue) {
        // Find compliance officer for organization
        const complianceOfficer = await prisma.user.findFirst({
          where: {
            organizationId: (await prisma.company.findUnique({ where: { id: company.companyId } }))?.organizationId,
            role: { name: 'compliance_officer' },
          },
        });

        if (complianceOfficer) {
          await this.triggerRefresh(company.companyId, complianceOfficer.id);
        }
      }
    } catch (error) {
      console.error('❌ KYC Refresh Scheduler error:', error);
    }
  }
}

export const kycRefreshScheduler = new KYCRefreshScheduler();
