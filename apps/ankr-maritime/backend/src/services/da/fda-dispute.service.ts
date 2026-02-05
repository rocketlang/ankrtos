/**
 * FDA Dispute Resolution Service
 * Handle disputes between PDA estimates and FDA actuals
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DisputeCreationInput {
  fdaId: string;
  lineItemId: string;
  pdaAmount: number;
  fdaAmount: number;
  variance: number;
  reason: string;
  evidence?: string[]; // URLs to uploaded documents
}

export interface DisputeResolutionInput {
  disputeId: string;
  resolution: 'APPROVED' | 'REJECTED' | 'ADJUSTED';
  adjustedAmount?: number;
  resolutionNotes: string;
  resolvedById: string;
}

export interface DisputeAnalytics {
  totalDisputes: number;
  avgResolutionDays: number;
  approvalRate: number;
  totalDisputedAmount: number;
  totalAdjustedAmount: number;
}

export class FDADisputeService {
  /**
   * Create a new dispute for an FDA line item variance
   */
  async createDispute(
    input: DisputeCreationInput,
    userId: string,
    organizationId: string
  ): Promise<any> {
    // Verify FDA belongs to organization
    const fda = await prisma.disbursementAccount.findFirst({
      where: {
        id: input.fdaId,
        organizationId,
        type: 'FDA',
      },
    });

    if (!fda) {
      throw new Error('FDA not found');
    }

    // Check if variance exceeds threshold (e.g., 10% or $1000)
    const variancePercent = Math.abs(input.variance / input.pdaAmount) * 100;
    const isSignificant = variancePercent > 10 || Math.abs(input.variance) > 1000;

    const dispute = await prisma.fDADispute.create({
      data: {
        fdaId: input.fdaId,
        lineItemId: input.lineItemId,
        pdaAmount: input.pdaAmount,
        fdaAmount: input.fdaAmount,
        variance: input.variance,
        variancePercent,
        reason: input.reason,
        evidence: input.evidence || [],
        status: 'PENDING',
        priority: isSignificant ? 'HIGH' : 'NORMAL',
        createdById: userId,
        organizationId,
      },
    });

    // Create notification for relevant parties
    await this.notifyStakeholders(dispute, organizationId);

    return dispute;
  }

  /**
   * Add comment/evidence to dispute
   */
  async addDisputeComment(
    disputeId: string,
    comment: string,
    attachments: string[],
    userId: string
  ): Promise<any> {
    const disputeComment = await prisma.fDADisputeComment.create({
      data: {
        disputeId,
        comment,
        attachments,
        createdById: userId,
      },
    });

    // Update dispute timestamp
    await prisma.fDADispute.update({
      where: { id: disputeId },
      data: { updatedAt: new Date() },
    });

    return disputeComment;
  }

  /**
   * Resolve a dispute
   */
  async resolveDispute(
    input: DisputeResolutionInput,
    organizationId: string
  ): Promise<any> {
    const dispute = await prisma.fDADispute.findFirst({
      where: {
        id: input.disputeId,
        organizationId,
      },
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    if (dispute.status === 'RESOLVED') {
      throw new Error('Dispute already resolved');
    }

    // Calculate final amount
    let finalAmount = dispute.fdaAmount;
    if (input.resolution === 'APPROVED') {
      finalAmount = dispute.fdaAmount;
    } else if (input.resolution === 'REJECTED') {
      finalAmount = dispute.pdaAmount;
    } else if (input.resolution === 'ADJUSTED' && input.adjustedAmount) {
      finalAmount = input.adjustedAmount;
    }

    // Update dispute
    const updatedDispute = await prisma.fDADispute.update({
      where: { id: input.disputeId },
      data: {
        status: 'RESOLVED',
        resolution: input.resolution,
        finalAmount,
        resolutionNotes: input.resolutionNotes,
        resolvedById: input.resolvedById,
        resolvedAt: new Date(),
      },
    });

    // Generate credit/debit note if amount changed
    if (finalAmount !== dispute.fdaAmount) {
      await this.generateAdjustmentNote(updatedDispute, finalAmount);
    }

    // Notify parties
    await this.notifyResolution(updatedDispute, organizationId);

    return updatedDispute;
  }

  /**
   * Get disputes by FDA
   */
  async getDisputesByFDA(
    fdaId: string,
    organizationId: string
  ): Promise<any[]> {
    return prisma.fDADispute.findMany({
      where: {
        fdaId,
        organizationId,
      },
      include: {
        createdBy: { select: { name: true, email: true } },
        resolvedBy: { select: { name: true, email: true } },
        comments: {
          include: {
            createdBy: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get dispute analytics
   */
  async getDisputeAnalytics(
    organizationId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<DisputeAnalytics> {
    const where: any = { organizationId };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const disputes = await prisma.fDADispute.findMany({ where });

    const totalDisputes = disputes.length;
    const resolvedDisputes = disputes.filter((d) => d.status === 'RESOLVED');

    // Calculate average resolution time
    let avgResolutionDays = 0;
    if (resolvedDisputes.length > 0) {
      const totalDays = resolvedDisputes.reduce((sum, d) => {
        if (d.resolvedAt) {
          const days =
            (d.resolvedAt.getTime() - d.createdAt.getTime()) /
            (1000 * 60 * 60 * 24);
          return sum + days;
        }
        return sum;
      }, 0);
      avgResolutionDays = totalDays / resolvedDisputes.length;
    }

    // Calculate approval rate
    const approvedDisputes = resolvedDisputes.filter(
      (d) => d.resolution === 'APPROVED'
    );
    const approvalRate =
      resolvedDisputes.length > 0
        ? approvedDisputes.length / resolvedDisputes.length
        : 0;

    // Calculate amounts
    const totalDisputedAmount = disputes.reduce(
      (sum, d) => sum + Math.abs(d.variance),
      0
    );
    const totalAdjustedAmount = resolvedDisputes.reduce((sum, d) => {
      return sum + Math.abs(d.finalAmount - d.pdaAmount);
    }, 0);

    return {
      totalDisputes,
      avgResolutionDays,
      approvalRate,
      totalDisputedAmount,
      totalAdjustedAmount,
    };
  }

  /**
   * Auto-flag variances that exceed threshold
   */
  async autoFlagVariances(
    fdaId: string,
    organizationId: string
  ): Promise<any[]> {
    const fda = await prisma.disbursementAccount.findFirst({
      where: {
        id: fdaId,
        organizationId,
        type: 'FDA',
      },
      include: {
        lineItems: true,
      },
    });

    if (!fda) {
      throw new Error('FDA not found');
    }

    // Get corresponding PDA
    const pda = await prisma.disbursementAccount.findFirst({
      where: {
        portCallId: fda.portCallId,
        type: 'PDA',
        organizationId,
      },
      include: {
        lineItems: true,
      },
    });

    if (!pda) {
      return [];
    }

    const flaggedVariances = [];

    // Compare line items
    for (const fdaItem of fda.lineItems) {
      const pdaItem = pda.lineItems.find(
        (item) => item.category === fdaItem.category
      );

      if (pdaItem) {
        const variance = fdaItem.amount - pdaItem.amount;
        const variancePercent = Math.abs(variance / pdaItem.amount) * 100;

        // Flag if variance > 10% or > $1000
        if (variancePercent > 10 || Math.abs(variance) > 1000) {
          flaggedVariances.push({
            lineItemId: fdaItem.id,
            category: fdaItem.category,
            pdaAmount: pdaItem.amount,
            fdaAmount: fdaItem.amount,
            variance,
            variancePercent,
            reason: `Variance exceeds threshold: ${variancePercent.toFixed(1)}%`,
          });
        }
      }
    }

    return flaggedVariances;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async notifyStakeholders(
    dispute: any,
    organizationId: string
  ): Promise<void> {
    // In production: send notifications via email/Slack/Teams
    console.log(`Dispute created: ${dispute.id} for organization ${organizationId}`);
  }

  private async notifyResolution(
    dispute: any,
    organizationId: string
  ): Promise<void> {
    // In production: send resolution notifications
    console.log(`Dispute resolved: ${dispute.id} with ${dispute.resolution}`);
  }

  private async generateAdjustmentNote(
    dispute: any,
    finalAmount: number
  ): Promise<void> {
    const isCredit = finalAmount < dispute.fdaAmount;
    const adjustmentAmount = Math.abs(finalAmount - dispute.fdaAmount);

    await prisma.adjustmentNote.create({
      data: {
        type: isCredit ? 'CREDIT' : 'DEBIT',
        fdaId: dispute.fdaId,
        disputeId: dispute.id,
        amount: adjustmentAmount,
        reason: dispute.resolutionNotes,
        organizationId: dispute.organizationId,
      },
    });
  }
}

export const fdaDisputeService = new FDADisputeService();
