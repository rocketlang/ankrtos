/**
 * FDA Dispute Resolution Service
 * Phase 6: DA Desk & Port Agency
 *
 * Features:
 * - Create and manage FDA disputes
 * - Track dispute resolution workflow
 * - Communication trail (comments + attachments)
 * - Auto-resolution based on rules
 * - Dispute analytics and reporting
 */

import { prisma } from '../lib/prisma.js';
import type { FdaDispute, Prisma } from '@prisma/client';

export interface DisputeCreateInput {
  disbursementAccountId: string;
  lineItemId?: string;
  disputeType: 'overcharge' | 'missing_service' | 'incorrect_calculation' | 'unauthorized_charge';
  expectedAmount: number;
  actualAmount: number;
  disputeReason: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DisputeResolutionInput {
  resolution: 'agreed_to_pay' | 'credit_issued' | 'charge_removed' | 'split_difference';
  resolvedAmount: number;
  resolutionNotes: string;
}

export interface DisputeSummary {
  totalDisputes: number;
  openDisputes: number;
  resolvedDisputes: number;
  totalDisputedAmount: number;
  totalResolvedAmount: number;
  savingsAchieved: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  averageResolutionTime: number; // in days
}

class FdaDisputeService {
  /**
   * Create a new FDA dispute
   */
  async createDispute(
    input: DisputeCreateInput,
    userId: string
  ): Promise<FdaDispute> {
    const varianceAmount = input.actualAmount - input.expectedAmount;
    const variancePercent = ((varianceAmount / input.expectedAmount) * 100);

    const dispute = await prisma.fdaDispute.create({
      data: {
        disbursementAccountId: input.disbursementAccountId,
        lineItemId: input.lineItemId,
        disputeType: input.disputeType,
        priority: input.priority || this.calculatePriority(Math.abs(variancePercent)),
        expectedAmount: input.expectedAmount,
        actualAmount: input.actualAmount,
        varianceAmount,
        variancePercent,
        disputeReason: input.disputeReason,
        createdBy: userId,
      },
    });

    // Update DA status to disputed
    await prisma.disbursementAccount.update({
      where: { id: input.disbursementAccountId },
      data: { status: 'disputed' },
    });

    // Auto-add initial comment
    await this.addComment(dispute.id, userId, 'internal',
      'Dispute created: ' + input.disputeType + ' - Variance: ' + variancePercent.toFixed(2) + '%',
      true
    );

    return dispute;
  }

  /**
   * Calculate dispute priority based on variance
   */
  private calculatePriority(variancePercent: number): 'low' | 'medium' | 'high' | 'critical' {
    if (variancePercent > 50) return 'critical';
    if (variancePercent > 25) return 'high';
    if (variancePercent > 10) return 'medium';
    return 'low';
  }

  /**
   * Add comment to dispute
   */
  async addComment(
    disputeId: string,
    userId: string,
    role: 'internal' | 'agent' | 'charterer' | 'owner',
    comment: string,
    isInternal: boolean = false
  ): Promise<void> {
    await prisma.fdaDisputeComment.create({
      data: {
        disputeId,
        userId,
        role,
        comment,
        isInternal,
      },
    });

    // Update dispute updatedAt
    await prisma.fdaDispute.update({
      where: { id: disputeId },
      data: { status: 'under_review' },
    });
  }

  /**
   * Add attachment to dispute
   */
  async addAttachment(
    disputeId: string,
    fileName: string,
    fileUrl: string,
    fileType: 'invoice' | 'receipt' | 'email' | 'contract' | 'other',
    userId: string
  ): Promise<void> {
    await prisma.fdaDisputeAttachment.create({
      data: {
        disputeId,
        fileName,
        fileUrl,
        fileType,
        uploadedBy: userId,
      },
    });
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    disputeId: string,
    resolution: DisputeResolutionInput,
    userId: string
  ): Promise<FdaDispute> {
    const dispute = await prisma.fdaDispute.update({
      where: { id: disputeId },
      data: {
        status: 'resolved',
        resolution: resolution.resolution,
        resolvedAmount: resolution.resolvedAmount,
        resolutionNotes: resolution.resolutionNotes,
        resolvedBy: userId,
        resolvedAt: new Date(),
      },
    });

    // Add resolution comment
    await this.addComment(
      disputeId,
      userId,
      'internal',
      'Dispute resolved: ' + resolution.resolution + ' - Final amount: ' + resolution.resolvedAmount,
      false
    );

    // Update DA status
    const allDisputes = await prisma.fdaDispute.findMany({
      where: { disbursementAccountId: dispute.disbursementAccountId },
    });

    const allResolved = allDisputes.every(d => d.status === 'resolved' || d.status === 'closed');
    if (allResolved) {
      await prisma.disbursementAccount.update({
        where: { id: dispute.disbursementAccountId },
        data: { status: 'approved' },
      });
    }

    return dispute;
  }

  /**
   * Escalate dispute
   */
  async escalateDispute(
    disputeId: string,
    reason: string,
    userId: string
  ): Promise<FdaDispute> {
    const dispute = await prisma.fdaDispute.update({
      where: { id: disputeId },
      data: {
        status: 'escalated',
        priority: 'critical',
      },
    });

    await this.addComment(
      disputeId,
      userId,
      'internal',
      'Dispute escalated: ' + reason,
      true
    );

    return dispute;
  }

  /**
   * Close dispute without resolution
   */
  async closeDispute(
    disputeId: string,
    reason: string,
    userId: string
  ): Promise<FdaDispute> {
    const dispute = await prisma.fdaDispute.update({
      where: { id: disputeId },
      data: {
        status: 'closed',
        resolutionNotes: reason,
        resolvedBy: userId,
        resolvedAt: new Date(),
      },
    });

    await this.addComment(
      disputeId,
      userId,
      'internal',
      'Dispute closed: ' + reason,
      false
    );

    return dispute;
  }

  /**
   * Get dispute with full details
   */
  async getDispute(disputeId: string) {
    return await prisma.fdaDispute.findUnique({
      where: { id: disputeId },
      include: {
        disbursementAccount: {
          include: {
            voyage: { include: { vessel: true } },
            port: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
      },
    });
  }

  /**
   * Get disputes for DA
   */
  async getDisputesForDA(daId: string) {
    return await prisma.fdaDispute.findMany({
      where: { disbursementAccountId: daId },
      include: {
        comments: { take: 1, orderBy: { createdAt: 'desc' } },
        attachments: { take: 3 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get dispute summary for organization
   */
  async getDisputeSummary(
    organizationId: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<DisputeSummary> {
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 :
                 timeframe === 'quarter' ? 90 : 365;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get all disputes in timeframe
    const disputes = await prisma.fdaDispute.findMany({
      where: {
        createdAt: { gte: since },
        disbursementAccount: {
          voyage: {
            vessel: {
              organizationId,
            },
          },
        },
      },
    });

    const openDisputes = disputes.filter(d => ['open', 'under_review', 'escalated'].includes(d.status));
    const resolvedDisputes = disputes.filter(d => d.status === 'resolved');

    const totalDisputedAmount = disputes.reduce((sum, d) => sum + Math.abs(d.varianceAmount), 0);
    const totalResolvedAmount = resolvedDisputes.reduce((sum, d) => sum + (d.resolvedAmount || 0), 0);
    const savingsAchieved = disputes.reduce((sum, d) => {
      if (d.status === 'resolved' && d.resolvedAmount) {
        return sum + (d.actualAmount - d.resolvedAmount);
      }
      return sum;
    }, 0);

    // Group by type
    const byType: Record<string, number> = {};
    disputes.forEach(d => {
      byType[d.disputeType] = (byType[d.disputeType] || 0) + 1;
    });

    // Group by status
    const byStatus: Record<string, number> = {};
    disputes.forEach(d => {
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
    });

    // Calculate average resolution time
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    resolvedDisputes.forEach(d => {
      if (d.resolvedAt) {
        const days = (d.resolvedAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        totalResolutionTime += days;
        resolvedCount++;
      }
    });
    const averageResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

    return {
      totalDisputes: disputes.length,
      openDisputes: openDisputes.length,
      resolvedDisputes: resolvedDisputes.length,
      totalDisputedAmount,
      totalResolvedAmount,
      savingsAchieved,
      byType,
      byStatus,
      averageResolutionTime,
    };
  }

  /**
   * Auto-resolve disputes based on rules
   */
  async autoResolveDisputes(organizationId: string): Promise<number> {
    let resolvedCount = 0;

    // Get all open disputes
    const openDisputes = await prisma.fdaDispute.findMany({
      where: {
        status: 'open',
        disbursementAccount: {
          voyage: {
            vessel: {
              organizationId,
            },
          },
        },
      },
      include: {
        disbursementAccount: true,
      },
    });

    for (const dispute of openDisputes) {
      // Auto-resolve if variance is within threshold
      const da = dispute.disbursementAccount;
      if (Math.abs(dispute.variancePercent) < da.varianceThreshold) {
        await this.resolveDispute(
          dispute.id,
          {
            resolution: 'agreed_to_pay',
            resolvedAmount: dispute.actualAmount,
            resolutionNotes: 'Auto-resolved: Variance within acceptable threshold',
          },
          'system'
        );
        resolvedCount++;
      }
    }

    return resolvedCount;
  }
}

export const fdaDisputeService = new FdaDisputeService();
