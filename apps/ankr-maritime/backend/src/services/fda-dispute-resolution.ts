/**
 * FDA Dispute Resolution & Bank Reconciliation
 * Automated dispute workflow and bank statement matching
 */

import { prisma } from '../lib/prisma.js';

export interface DisputeItem {
  daLineItemId: string;
  pdaAmount: number;
  fdaAmount: number;
  variance: number;
  reason: string;
  supportingDocuments?: string[];
}

export interface BankTransaction {
  date: Date;
  description: string;
  amount: number;
  currency: string;
  reference: string;
}

export class FDADisputeResolutionService {
  /**
   * Raise dispute on FDA line item
   */
  async raiseDispute(data: {
    daId: string;
    lineItemId: string;
    pdaAmount: number;
    fdaAmount: number;
    reason: string;
    userId: string;
    supportingDocuments?: string[];
  }): Promise<void> {
    const da = await prisma.disbursementAccount.findUnique({
      where: { id: data.daId },
      include: { voyage: { include: { vessel: true } }, port: true },
    });

    if (!da) throw new Error('DA not found');

    const variance = Math.abs(data.fdaAmount - data.pdaAmount);
    const variancePercent = (variance / data.pdaAmount) * 100;

    // Update DA line item status
    await prisma.daLineItem.update({
      where: { id: data.lineItemId },
      data: {
        disputeRaised: true,
        disputeReason: data.reason,
        disputeAmount: variance,
        disputeRaisedBy: data.userId,
        disputeRaisedAt: new Date(),
      },
    });

    // Update DA status
    await prisma.disbursementAccount.update({
      where: { id: data.daId },
      data: { status: 'disputed' },
    });

    // Create dispute record
    await prisma.fdaDispute.create({
      data: {
        daId: data.daId,
        lineItemId: data.lineItemId,
        pdaAmount: data.pdaAmount,
        fdaAmount: data.fdaAmount,
        variance,
        variancePercent,
        reason: data.reason,
        status: 'pending',
        raisedBy: data.userId,
        supportingDocuments: data.supportingDocuments,
        organizationId: da.organizationId,
      },
    });

    // Create alert for agent
    await prisma.alert.create({
      data: {
        organizationId: da.organizationId,
        type: 'fda_dispute_raised',
        severity: variancePercent > 10 ? 'high' : 'medium',
        title: 'FDA Dispute Raised',
        message: `Dispute raised on ${da.port.name} FDA: ${data.reason}. Variance: $${variance.toLocaleString()} (${variancePercent.toFixed(1)}%)`,
        metadata: {
          daId: data.daId,
          lineItemId: data.lineItemId,
          variance,
          variancePercent,
        },
        relatedEntityType: 'disbursementAccount',
        relatedEntityId: data.daId,
        status: 'active',
        requiresAction: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: da.organizationId,
        userId: data.userId,
        action: 'fda_dispute_raised',
        entityType: 'disbursementAccount',
        entityId: data.daId,
        metadata: {
          vesselName: da.voyage.vessel.name,
          port: da.port.name,
          variance,
          reason: data.reason,
        },
        timestamp: new Date(),
      },
    });
  }

  /**
   * Respond to dispute (agent response)
   */
  async respondToDispute(data: {
    disputeId: string;
    response: string;
    acceptedAmount: number;
    justification: string;
    userId: string;
  }): Promise<void> {
    const dispute = await prisma.fdaDispute.findUnique({
      where: { id: data.disputeId },
      include: { da: { include: { voyage: { include: { vessel: true } }, port: true } } },
    });

    if (!dispute) throw new Error('Dispute not found');

    // Update dispute
    await prisma.fdaDispute.update({
      where: { id: data.disputeId },
      data: {
        agentResponse: data.response,
        acceptedAmount: data.acceptedAmount,
        justification: data.justification,
        respondedBy: data.userId,
        respondedAt: new Date(),
        status: 'responded',
      },
    });

    // Create alert for principal
    await prisma.alert.create({
      data: {
        organizationId: dispute.organizationId,
        type: 'fda_dispute_responded',
        severity: 'medium',
        title: 'FDA Dispute Response Received',
        message: `Agent responded to ${dispute.da.port.name} FDA dispute. Accepted amount: $${data.acceptedAmount.toLocaleString()}`,
        metadata: {
          disputeId: data.disputeId,
          acceptedAmount: data.acceptedAmount,
        },
        relatedEntityType: 'disbursementAccount',
        relatedEntityId: dispute.daId,
        status: 'active',
        requiresAction: true,
      },
    });
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(data: {
    disputeId: string;
    resolution: 'accepted' | 'rejected' | 'partial';
    finalAmount: number;
    notes: string;
    userId: string;
  }): Promise<void> {
    const dispute = await prisma.fdaDispute.findUnique({
      where: { id: data.disputeId },
      include: { da: true, lineItem: true },
    });

    if (!dispute) throw new Error('Dispute not found');

    // Update dispute
    await prisma.fdaDispute.update({
      where: { id: data.disputeId },
      data: {
        status: 'resolved',
        resolution: data.resolution,
        finalAmount: data.finalAmount,
        resolutionNotes: data.notes,
        resolvedBy: data.userId,
        resolvedAt: new Date(),
      },
    });

    // Update DA line item with final amount
    await prisma.daLineItem.update({
      where: { id: dispute.lineItemId },
      data: {
        amount: data.finalAmount,
        disputeRaised: false,
      },
    });

    // If all disputes resolved, update DA status
    const remainingDisputes = await prisma.fdaDispute.count({
      where: {
        daId: dispute.daId,
        status: { in: ['pending', 'responded'] },
      },
    });

    if (remainingDisputes === 0) {
      await prisma.disbursementAccount.update({
        where: { id: dispute.daId },
        data: { status: 'approved' },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: dispute.organizationId,
        userId: data.userId,
        action: 'fda_dispute_resolved',
        entityType: 'fdaDispute',
        entityId: data.disputeId,
        metadata: {
          resolution: data.resolution,
          finalAmount: data.finalAmount,
        },
        timestamp: new Date(),
      },
    });
  }

  /**
   * Reconcile FDA with bank statement
   */
  async reconcileFDAWithBank(data: {
    daId: string;
    bankTransactions: BankTransaction[];
    userId: string;
  }): Promise<{
    matched: number;
    unmatched: number;
    totalFDA: number;
    totalBank: number;
    variance: number;
    matchedItems: Array<{
      daLineItemId: string;
      bankTransactionReference: string;
      amount: number;
    }>;
    unmatchedItems: Array<{
      daLineItemId?: string;
      bankTransactionReference?: string;
      description: string;
      amount: number;
    }>;
  }> {
    const da = await prisma.disbursementAccount.findUnique({
      where: { id: data.daId },
      include: { lineItems: true },
    });

    if (!da) throw new Error('DA not found');

    const matchedItems: any[] = [];
    const unmatchedItems: any[] = [];
    const matchedLineItemIds = new Set<string>();
    const matchedBankRefs = new Set<string>();

    // Try to match DA line items with bank transactions
    for (const lineItem of da.lineItems) {
      const match = data.bankTransactions.find(
        (tx) =>
          Math.abs(tx.amount - lineItem.amount) < 1 && // Allow $1 tolerance
          !matchedBankRefs.has(tx.reference) &&
          (tx.description.toLowerCase().includes(lineItem.description.toLowerCase()) ||
            tx.reference.includes(da.id.substring(0, 8)))
      );

      if (match) {
        matchedItems.push({
          daLineItemId: lineItem.id,
          bankTransactionReference: match.reference,
          amount: lineItem.amount,
        });
        matchedLineItemIds.add(lineItem.id);
        matchedBankRefs.add(match.reference);

        // Mark line item as reconciled
        await prisma.daLineItem.update({
          where: { id: lineItem.id },
          data: {
            bankReconciled: true,
            bankReconcilationDate: new Date(),
            bankReference: match.reference,
          },
        });
      }
    }

    // Find unmatched DA items
    for (const lineItem of da.lineItems) {
      if (!matchedLineItemIds.has(lineItem.id)) {
        unmatchedItems.push({
          daLineItemId: lineItem.id,
          description: lineItem.description,
          amount: lineItem.amount,
        });
      }
    }

    // Find unmatched bank transactions
    for (const tx of data.bankTransactions) {
      if (!matchedBankRefs.has(tx.reference)) {
        unmatchedItems.push({
          bankTransactionReference: tx.reference,
          description: tx.description,
          amount: tx.amount,
        });
      }
    }

    const totalFDA = da.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const totalBank = data.bankTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const variance = totalFDA - totalBank;

    // Update DA reconciliation status
    if (matchedItems.length === da.lineItems.length && unmatchedItems.length === 0) {
      await prisma.disbursementAccount.update({
        where: { id: data.daId },
        data: {
          bankReconciled: true,
          bankReconciliationDate: new Date(),
        },
      });
    }

    // Log reconciliation
    await prisma.activityLog.create({
      data: {
        organizationId: da.organizationId,
        userId: data.userId,
        action: 'fda_bank_reconciliation',
        entityType: 'disbursementAccount',
        entityId: data.daId,
        metadata: {
          matched: matchedItems.length,
          unmatched: unmatchedItems.length,
          variance,
        },
        timestamp: new Date(),
      },
    });

    return {
      matched: matchedItems.length,
      unmatched: unmatchedItems.length,
      totalFDA,
      totalBank,
      variance,
      matchedItems,
      unmatchedItems,
    };
  }
}

export const fdaDisputeResolutionService = new FDADisputeResolutionService();
