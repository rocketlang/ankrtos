/**
 * FDA Variance Service - Analyze PDA vs FDA Differences
 * Priority 1: Port Agency Portal
 *
 * Features:
 * - Calculate variance by category
 * - Identify significant variances (>5%)
 * - Categorize variance reasons
 * - Auto-approve if total variance <10%
 * - Generate variance analysis reports
 */

import { PrismaClient } from '@prisma/client';

export interface VarianceAnalysis {
  category: string;
  pdaAmount: number;
  fdaAmount: number;
  variance: number;
  variancePercent: number;
  isSignificant: boolean; // >5%
  reason?: string;
}

export interface FDAVarianceResult {
  fdaId: string;
  reference: string;
  pdaTotal: number;
  fdaTotal: number;
  totalVariance: number;
  totalVariancePercent: number;
  autoApproved: boolean;
  variances: VarianceAnalysis[];
  recommendedAction: 'auto_approve' | 'review_required' | 'escalate';
}

export interface CreateFDAInput {
  pdaId: string;
  lineItems: Array<{
    category: string;
    description: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    amount: number;
    currency?: string;
    invoiceNumber?: string;
    invoiceDate?: Date;
    vendorId?: string;
  }>;
  paymentMethod?: string;
  paymentReference?: string;
}

export class FDAVarianceService {
  private prisma: PrismaClient;

  // Variance thresholds
  private readonly SIGNIFICANT_VARIANCE_THRESHOLD = 5.0; // 5%
  private readonly AUTO_APPROVE_THRESHOLD = 10.0; // 10%
  private readonly ESCALATION_THRESHOLD = 20.0; // 20%

  // Variance reasons
  private readonly VARIANCE_REASONS = {
    rate_change: 'Tariff rate changed since PDA generation',
    additional_services: 'Additional services required',
    currency_fluctuation: 'Exchange rate fluctuation',
    measurement_difference: 'Actual measurement differed from estimate',
    seasonal_surcharge: 'Seasonal or peak surcharge applied',
    discount_applied: 'Vendor discount or negotiation',
    regulatory_change: 'Regulatory or tax change',
  };

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Create FDA from PDA with variance analysis
   * Main entry point
   */
  async createFDAFromPDA(input: CreateFDAInput): Promise<FDAVarianceResult> {
    // 1. Fetch PDA with line items
    const pda = await this.prisma.proformaDisbursementAccount.findUnique({
      where: { id: input.pdaId },
      include: {
        lineItems: true,
        appointment: true,
      },
    });

    if (!pda) {
      throw new Error(`PDA not found: ${input.pdaId}`);
    }

    // 2. Calculate variance analysis
    const variances = this.calculateVariances(pda.lineItems, input.lineItems);

    // 3. Calculate totals
    const pdaTotal = pda.totalAmount;
    const fdaTotal = input.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const totalVariance = fdaTotal - pdaTotal;
    const totalVariancePercent = (totalVariance / pdaTotal) * 100;

    // 4. Determine auto-approval
    const autoApproved = Math.abs(totalVariancePercent) < this.AUTO_APPROVE_THRESHOLD;
    const recommendedAction = this.getRecommendedAction(totalVariancePercent);

    // 5. Generate FDA reference
    const reference = await this.generateFDAReference(pda.portCode);

    // 6. Create FDA with line items and variance analysis
    const fdaLineItems = input.lineItems.map((item, index) => {
      const pdaItem = pda.lineItems.find((p) => p.category === item.category);
      const variance = variances.find((v) => v.category === item.category);

      return {
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        amount: item.amount,
        currency: item.currency || 'USD',
        invoiceNumber: item.invoiceNumber,
        invoiceDate: item.invoiceDate,
        vendorId: item.vendorId,
        pdaLineItemId: pdaItem?.id,
        pdaAmount: pdaItem?.amount,
        variance: variance ? variance.variance : undefined,
      };
    });

    const fdaVariances = variances
      .filter((v) => v.isSignificant)
      .map((v) => ({
        category: v.category,
        pdaAmount: v.pdaAmount,
        fdaAmount: v.fdaAmount,
        variance: v.variance,
        variancePercent: v.variancePercent,
        reason: v.reason || this.inferVarianceReason(v),
        notes: `Variance of ${v.variancePercent.toFixed(1)}% for ${v.category}`,
      }));

    const fda = await this.prisma.finalDisbursementAccount.create({
      data: {
        pdaId: pda.id,
        appointmentId: pda.appointmentId,
        reference,
        baseCurrency: pda.baseCurrency,
        totalAmount: fdaTotal,
        totalAmountLocal: pda.localCurrency ? fdaTotal * (pda.fxRate || 1.0) : undefined,
        localCurrency: pda.localCurrency,
        fxRate: pda.fxRate,
        pdaTotal,
        variance: totalVariance,
        variancePercent: totalVariancePercent,
        status: autoApproved ? 'approved' : 'draft',
        approvedAt: autoApproved ? new Date() : undefined,
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference,
        lineItems: {
          create: fdaLineItems,
        },
        variances: {
          create: fdaVariances,
        },
      },
      include: {
        lineItems: true,
        variances: true,
      },
    });

    console.log(
      `✅ Created FDA ${reference} - Variance: ${totalVariancePercent.toFixed(1)}% (${autoApproved ? 'AUTO-APPROVED' : 'REQUIRES REVIEW'})`
    );

    return {
      fdaId: fda.id,
      reference: fda.reference,
      pdaTotal,
      fdaTotal,
      totalVariance,
      totalVariancePercent,
      autoApproved,
      variances,
      recommendedAction,
    };
  }

  /**
   * Calculate variances between PDA and FDA line items
   */
  private calculateVariances(
    pdaItems: any[],
    fdaItems: any[]
  ): VarianceAnalysis[] {
    const variances: VarianceAnalysis[] = [];

    // Create a map of FDA items by category
    const fdaItemMap = new Map(fdaItems.map((item) => [item.category, item]));

    // Compare each PDA item with corresponding FDA item
    for (const pdaItem of pdaItems) {
      const fdaItem = fdaItemMap.get(pdaItem.category);

      if (fdaItem) {
        const pdaAmount = pdaItem.amount;
        const fdaAmount = fdaItem.amount;
        const variance = fdaAmount - pdaAmount;
        const variancePercent = (variance / pdaAmount) * 100;
        const isSignificant = Math.abs(variancePercent) > this.SIGNIFICANT_VARIANCE_THRESHOLD;

        variances.push({
          category: pdaItem.category,
          pdaAmount,
          fdaAmount,
          variance,
          variancePercent,
          isSignificant,
        });
      }
    }

    // Check for FDA items not in PDA (additional services)
    for (const fdaItem of fdaItems) {
      const pdaItem = pdaItems.find((p) => p.category === fdaItem.category);
      if (!pdaItem) {
        variances.push({
          category: fdaItem.category,
          pdaAmount: 0,
          fdaAmount: fdaItem.amount,
          variance: fdaItem.amount,
          variancePercent: 100,
          isSignificant: true,
          reason: 'additional_services',
        });
      }
    }

    return variances;
  }

  /**
   * Infer variance reason based on variance characteristics
   */
  private inferVarianceReason(variance: VarianceAnalysis): string {
    const absVariance = Math.abs(variance.variancePercent);

    if (variance.pdaAmount === 0) {
      return 'additional_services';
    }

    if (absVariance > 15) {
      return 'rate_change';
    }

    if (absVariance > 10) {
      return 'measurement_difference';
    }

    if (variance.variance > 0) {
      // FDA higher than PDA
      if (variance.category.includes('port_dues') || variance.category.includes('pilotage')) {
        return 'rate_change';
      }
      return 'measurement_difference';
    } else {
      // FDA lower than PDA (discount or better rate)
      return 'discount_applied';
    }
  }

  /**
   * Get recommended action based on total variance
   */
  private getRecommendedAction(
    variancePercent: number
  ): 'auto_approve' | 'review_required' | 'escalate' {
    const absVariance = Math.abs(variancePercent);

    if (absVariance < this.AUTO_APPROVE_THRESHOLD) {
      return 'auto_approve';
    } else if (absVariance < this.ESCALATION_THRESHOLD) {
      return 'review_required';
    } else {
      return 'escalate';
    }
  }

  /**
   * Generate unique FDA reference
   * Format: FDA-{PORT}-{YEAR}-{SEQUENCE}
   */
  private async generateFDAReference(portCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `FDA-${portCode}-${year}`;

    const lastFda = await this.prisma.finalDisbursementAccount.findFirst({
      where: {
        reference: {
          startsWith: prefix,
        },
      },
      orderBy: {
        reference: 'desc',
      },
    });

    let sequence = 1;
    if (lastFda) {
      const match = lastFda.reference.match(/-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}-${String(sequence).padStart(3, '0')}`;
  }

  /**
   * Get variance analysis for existing FDA
   */
  async getVarianceAnalysis(fdaId: string): Promise<FDAVarianceResult | null> {
    const fda = await this.prisma.finalDisbursementAccount.findUnique({
      where: { id: fdaId },
      include: {
        lineItems: true,
        variances: true,
        pda: {
          include: {
            lineItems: true,
          },
        },
      },
    });

    if (!fda) {
      return null;
    }

    const variances: VarianceAnalysis[] = fda.variances.map((v) => ({
      category: v.category,
      pdaAmount: v.pdaAmount,
      fdaAmount: v.fdaAmount,
      variance: v.variance,
      variancePercent: v.variancePercent,
      isSignificant: Math.abs(v.variancePercent) > this.SIGNIFICANT_VARIANCE_THRESHOLD,
      reason: v.reason || undefined,
    }));

    return {
      fdaId: fda.id,
      reference: fda.reference,
      pdaTotal: fda.pdaTotal,
      fdaTotal: fda.totalAmount,
      totalVariance: fda.variance,
      totalVariancePercent: fda.variancePercent,
      autoApproved: fda.status === 'approved' && Math.abs(fda.variancePercent) < this.AUTO_APPROVE_THRESHOLD,
      variances,
      recommendedAction: this.getRecommendedAction(fda.variancePercent),
    };
  }

  /**
   * Update FDA status
   */
  async updateFDAStatus(
    fdaId: string,
    status: string,
    paymentReference?: string
  ): Promise<void> {
    const updateData: any = { status };

    if (status === 'submitted') {
      updateData.submittedAt = new Date();
    } else if (status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (status === 'settled') {
      updateData.settledAt = new Date();
      if (paymentReference) {
        updateData.paymentReference = paymentReference;
      }
    }

    await this.prisma.finalDisbursementAccount.update({
      where: { id: fdaId },
      data: updateData,
    });

    console.log(`✅ Updated FDA ${fdaId} status to ${status}`);
  }

  /**
   * Get variance summary statistics
   */
  async getVarianceStatistics(organizationId?: string): Promise<{
    averageVariancePercent: number;
    autoApprovalRate: number;
    totalFDAs: number;
    byCategory: Record<string, { count: number; avgVariance: number }>;
  }> {
    const where: any = {};
    if (organizationId) {
      where.appointment = {
        organizationId,
      };
    }

    const fdas = await this.prisma.finalDisbursementAccount.findMany({
      where,
      include: {
        variances: true,
      },
    });

    if (fdas.length === 0) {
      return {
        averageVariancePercent: 0,
        autoApprovalRate: 0,
        totalFDAs: 0,
        byCategory: {},
      };
    }

    const averageVariancePercent =
      fdas.reduce((sum, fda) => sum + Math.abs(fda.variancePercent), 0) / fdas.length;

    const autoApproved = fdas.filter(
      (fda) => Math.abs(fda.variancePercent) < this.AUTO_APPROVE_THRESHOLD
    );
    const autoApprovalRate = (autoApproved.length / fdas.length) * 100;

    // Aggregate by category
    const byCategory: Record<string, { count: number; avgVariance: number }> = {};
    const allVariances = fdas.flatMap((fda) => fda.variances);

    for (const variance of allVariances) {
      if (!byCategory[variance.category]) {
        byCategory[variance.category] = { count: 0, avgVariance: 0 };
      }
      byCategory[variance.category].count++;
      byCategory[variance.category].avgVariance += Math.abs(variance.variancePercent);
    }

    // Calculate averages
    for (const category in byCategory) {
      byCategory[category].avgVariance /= byCategory[category].count;
    }

    return {
      averageVariancePercent,
      autoApprovalRate,
      totalFDAs: fdas.length,
      byCategory,
    };
  }
}

// Singleton instance
let fdaVarianceService: FDAVarianceService | null = null;

export function getFDAVarianceService(): FDAVarianceService {
  if (!fdaVarianceService) {
    fdaVarianceService = new FDAVarianceService();
  }
  return fdaVarianceService;
}
