/**
 * Bank Reconciliation Service
 * Reconcile FDA with bank statements
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface BankTransaction {
  date: Date;
  description: string;
  reference: string;
  debit?: number;
  credit?: number;
  balance: number;
  currency: string;
}

export interface ReconciliationMatch {
  bankTransactionId: string;
  fdaLineItemId: string;
  matchConfidence: number; // 0-1
  matchMethod: 'AUTO' | 'MANUAL';
  variance?: number;
}

export interface ReconciliationReport {
  fdaId: string;
  totalFDAAmount: number;
  totalBankAmount: number;
  matchedAmount: number;
  unmatchedFDAItems: any[];
  unmatchedBankTransactions: any[];
  variance: number;
  reconciliationRate: number; // 0-100%
}

export class BankReconciliationService {
  /**
   * Import bank statement
   */
  async importBankStatement(
    file: Buffer,
    format: 'CSV' | 'OFX' | 'MT940',
    organizationId: string
  ): Promise<BankTransaction[]> {
    let transactions: BankTransaction[];

    if (format === 'CSV') {
      transactions = this.parseCSV(file);
    } else if (format === 'OFX') {
      transactions = this.parseOFX(file);
    } else {
      transactions = this.parseMT940(file);
    }

    // Save transactions to database
    const savedTransactions = [];
    for (const txn of transactions) {
      const saved = await prisma.bankTransaction.create({
        data: {
          ...txn,
          organizationId,
          status: 'UNMATCHED',
        },
      });
      savedTransactions.push(saved);
    }

    return savedTransactions;
  }

  /**
   * Auto-match bank transactions to FDA line items
   */
  async autoMatchTransactions(
    fdaId: string,
    organizationId: string
  ): Promise<ReconciliationMatch[]> {
    // Get FDA with line items
    const fda = await prisma.disbursementAccount.findFirst({
      where: {
        id: fdaId,
        organizationId,
        type: 'FDA',
      },
      include: {
        lineItems: true,
        portCall: {
          include: {
            port: true,
            vessel: true,
          },
        },
      },
    });

    if (!fda) {
      throw new Error('FDA not found');
    }

    // Get unmatched bank transactions around FDA dates (+/- 30 days)
    const dateFrom = new Date(fda.createdAt);
    dateFrom.setDate(dateFrom.getDate() - 30);
    const dateTo = new Date(fda.createdAt);
    dateTo.setDate(dateTo.getDate() + 30);

    const bankTransactions = await prisma.bankTransaction.findMany({
      where: {
        organizationId,
        status: 'UNMATCHED',
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
    });

    const matches: ReconciliationMatch[] = [];

    // Try to match each FDA line item
    for (const lineItem of fda.lineItems) {
      const match = this.findBestMatch(lineItem, bankTransactions, fda);
      if (match) {
        matches.push(match);

        // Update database
        await prisma.reconciliationMatch.create({
          data: {
            bankTransactionId: match.bankTransactionId,
            fdaLineItemId: match.fdaLineItemId,
            matchConfidence: match.matchConfidence,
            matchMethod: match.matchMethod,
            variance: match.variance,
            organizationId,
          },
        });

        await prisma.bankTransaction.update({
          where: { id: match.bankTransactionId },
          data: { status: 'MATCHED' },
        });
      }
    }

    return matches;
  }

  /**
   * Manual match transaction to line item
   */
  async manualMatch(
    bankTransactionId: string,
    fdaLineItemId: string,
    organizationId: string,
    userId: string
  ): Promise<ReconciliationMatch> {
    const match = await prisma.reconciliationMatch.create({
      data: {
        bankTransactionId,
        fdaLineItemId,
        matchConfidence: 1.0,
        matchMethod: 'MANUAL',
        variance: 0,
        organizationId,
        matchedById: userId,
      },
    });

    await prisma.bankTransaction.update({
      where: { id: bankTransactionId },
      data: { status: 'MATCHED' },
    });

    return match as any;
  }

  /**
   * Generate reconciliation report
   */
  async generateReconciliationReport(
    fdaId: string,
    organizationId: string
  ): Promise<ReconciliationReport> {
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

    // Get all matches for this FDA
    const matches = await prisma.reconciliationMatch.findMany({
      where: {
        fdaLineItem: {
          disbursementAccountId: fdaId,
        },
        organizationId,
      },
      include: {
        bankTransaction: true,
        fdaLineItem: true,
      },
    });

    const totalFDAAmount = fda.lineItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const matchedLineItemIds = new Set(matches.map((m) => m.fdaLineItemId));
    const unmatchedFDAItems = fda.lineItems.filter(
      (item) => !matchedLineItemIds.has(item.id)
    );

    const matchedAmount = matches.reduce(
      (sum, m) => sum + m.fdaLineItem.amount,
      0
    );

    const totalBankAmount = matches.reduce(
      (sum, m) => sum + (m.bankTransaction.debit || m.bankTransaction.credit || 0),
      0
    );

    const variance = totalFDAAmount - totalBankAmount;
    const reconciliationRate = (matchedAmount / totalFDAAmount) * 100;

    // Get unmatched bank transactions in date range
    const dateFrom = new Date(fda.createdAt);
    dateFrom.setDate(dateFrom.getDate() - 30);
    const dateTo = new Date(fda.createdAt);
    dateTo.setDate(dateTo.getDate() + 30);

    const unmatchedBankTransactions = await prisma.bankTransaction.findMany({
      where: {
        organizationId,
        status: 'UNMATCHED',
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
    });

    return {
      fdaId,
      totalFDAAmount,
      totalBankAmount,
      matchedAmount,
      unmatchedFDAItems,
      unmatchedBankTransactions,
      variance,
      reconciliationRate,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private findBestMatch(
    lineItem: any,
    transactions: any[],
    fda: any
  ): ReconciliationMatch | null {
    let bestMatch: ReconciliationMatch | null = null;
    let highestConfidence = 0.7; // Minimum threshold

    for (const txn of transactions) {
      const confidence = this.calculateMatchConfidence(lineItem, txn, fda);

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        const txnAmount = txn.debit || txn.credit || 0;
        bestMatch = {
          bankTransactionId: txn.id,
          fdaLineItemId: lineItem.id,
          matchConfidence: confidence,
          matchMethod: 'AUTO',
          variance: Math.abs(lineItem.amount - txnAmount),
        };
      }
    }

    return bestMatch;
  }

  private calculateMatchConfidence(
    lineItem: any,
    transaction: any,
    fda: any
  ): number {
    let confidence = 0;

    // Amount match (40% weight)
    const txnAmount = transaction.debit || transaction.credit || 0;
    const amountDiff = Math.abs(lineItem.amount - txnAmount);
    const amountMatch = Math.max(0, 1 - amountDiff / lineItem.amount);
    confidence += amountMatch * 0.4;

    // Description/reference match (30% weight)
    const description = (
      transaction.description +
      ' ' +
      transaction.reference
    ).toLowerCase();
    const vesselName = fda.portCall?.vessel?.name.toLowerCase() || '';
    const portName = fda.portCall?.port?.name.toLowerCase() || '';
    const category = lineItem.category.toLowerCase();

    let descriptionScore = 0;
    if (vesselName && description.includes(vesselName)) descriptionScore += 0.4;
    if (portName && description.includes(portName)) descriptionScore += 0.3;
    if (description.includes(category)) descriptionScore += 0.3;

    confidence += descriptionScore * 0.3;

    // Date proximity (20% weight)
    const dateDiff = Math.abs(
      transaction.date.getTime() - fda.createdAt.getTime()
    );
    const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
    const dateScore = Math.max(0, 1 - daysDiff / 30);
    confidence += dateScore * 0.2;

    // Currency match (10% weight)
    if (transaction.currency === fda.currency) {
      confidence += 0.1;
    }

    return confidence;
  }

  private parseCSV(buffer: Buffer): BankTransaction[] {
    // Simplified CSV parser - in production, use robust CSV library
    const content = buffer.toString('utf-8');
    const lines = content.split('\n').slice(1); // Skip header

    return lines
      .filter((line) => line.trim())
      .map((line) => {
        const [date, description, reference, debit, credit, balance, currency] =
          line.split(',').map((s) => s.trim());

        return {
          date: new Date(date),
          description,
          reference,
          debit: debit ? parseFloat(debit) : undefined,
          credit: credit ? parseFloat(credit) : undefined,
          balance: parseFloat(balance),
          currency: currency || 'USD',
        };
      });
  }

  private parseOFX(buffer: Buffer): BankTransaction[] {
    // OFX parser stub - in production, use OFX parsing library
    console.log('OFX parsing not fully implemented');
    return [];
  }

  private parseMT940(buffer: Buffer): BankTransaction[] {
    // MT940 parser stub - in production, use SWIFT parser
    console.log('MT940 parsing not fully implemented');
    return [];
  }
}

export const bankReconciliationService = new BankReconciliationService();
