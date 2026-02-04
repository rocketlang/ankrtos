/**
 * SNP Commission Tracker Service
 * Tracks commission calculations and split distributions for S&P transactions
 *
 * @module services/snp-commission-tracker
 */

import { prisma } from '../schema/context.js';

export interface CommissionParty {
  partyType: 'broker' | 'sub_broker' | 'introducer' | 'surveyor';
  partyName: string;
  partyContact: string;
  commissionPercentage: number; // of total commission
  fixedAmount?: number; // Alternative to percentage
  notes?: string;
}

export interface CommissionStructure {
  transactionId: string;
  totalCommissionPercentage: number; // % of sale price (typically 1-2%)
  commissionOnPrice: number; // Absolute amount
  currency: string;

  // Split between parties
  parties: CommissionParty[];

  // Payment terms
  paymentTrigger:
    | 'moa_signed'
    | 'deposit_paid'
    | 'delivery_completed'
    | 'full_payment_received';
  paymentDueDays: number; // Days after trigger

  // Status
  status: 'pending' | 'invoiced' | 'partially_paid' | 'fully_paid';
  invoiceUrl?: string;
}

export interface CommissionCalculation {
  salePrice: number;
  currency: string;
  totalCommissionPercentage: number;
  totalCommissionAmount: number;
  breakdown: {
    party: string;
    role: string;
    percentage: number;
    amount: number;
    vatAmount?: number;
    netAmount: number;
  }[];
  totalPayable: number;
}

export interface CommissionPayment {
  id: string;
  transactionId: string;
  partyName: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: 'wire_transfer' | 'check' | 'escrow';
  reference: string;
  status: 'scheduled' | 'paid' | 'failed';
}

class SNPCommissionTrackerService {
  /**
   * Define commission structure for transaction
   */
  async defineCommissionStructure(
    transactionId: string,
    structure: Omit<CommissionStructure, 'commissionOnPrice' | 'status'>,
    organizationId: string
  ): Promise<CommissionStructure> {
    // Validate transaction and get sale price
    const transaction = await prisma.sNPTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('S&P transaction not found');
    }

    const salePrice = transaction.agreedPrice || 0;

    // Calculate commission amount
    const commissionOnPrice =
      salePrice * (structure.totalCommissionPercentage / 100);

    // Validate party percentages sum to 100%
    const totalPartyPercentage = structure.parties.reduce(
      (sum, p) => sum + p.commissionPercentage,
      0
    );

    if (Math.abs(totalPartyPercentage - 100) > 0.01) {
      throw new Error(
        `Party commission percentages must sum to 100%. Current sum: ${totalPartyPercentage}%`
      );
    }

    const commissionStructure: CommissionStructure = {
      ...structure,
      commissionOnPrice,
      status: 'pending',
    };

    // Store in database
    // await prisma.commissionStructure.create({ data: commissionStructure });

    return commissionStructure;
  }

  /**
   * Calculate commission breakdown
   */
  async calculateCommission(
    transactionId: string,
    salePrice: number,
    organizationId: string
  ): Promise<CommissionCalculation> {
    // Get commission structure
    // In production, would fetch from database
    const structure: CommissionStructure = {
      transactionId,
      totalCommissionPercentage: 1.5, // 1.5% typical
      commissionOnPrice: salePrice * 0.015,
      currency: 'USD',
      parties: [
        {
          partyType: 'broker',
          partyName: 'Main Broker Ltd',
          partyContact: 'broker@example.com',
          commissionPercentage: 60,
        },
        {
          partyType: 'sub_broker',
          partyName: 'Sub Broker Inc',
          partyContact: 'sub@example.com',
          commissionPercentage: 30,
        },
        {
          partyType: 'introducer',
          partyName: 'Introducer Co',
          partyContact: 'intro@example.com',
          commissionPercentage: 10,
        },
      ],
      paymentTrigger: 'delivery_completed',
      paymentDueDays: 30,
      status: 'pending',
    };

    const totalCommissionAmount =
      salePrice * (structure.totalCommissionPercentage / 100);

    // Calculate each party's share
    const breakdown = structure.parties.map((party) => {
      const partyAmount =
        totalCommissionAmount * (party.commissionPercentage / 100);

      // Apply VAT if applicable (20% in UK, varies by jurisdiction)
      const vatRate = 0.2; // 20%
      const vatAmount = partyAmount * vatRate;
      const netAmount = partyAmount - vatAmount;

      return {
        party: party.partyName,
        role: party.partyType,
        percentage: party.commissionPercentage,
        amount: partyAmount,
        vatAmount,
        netAmount,
      };
    });

    const totalPayable = breakdown.reduce((sum, b) => sum + b.amount, 0);

    return {
      salePrice,
      currency: structure.currency,
      totalCommissionPercentage: structure.totalCommissionPercentage,
      totalCommissionAmount,
      breakdown,
      totalPayable,
    };
  }

  /**
   * Generate commission invoice
   */
  async generateCommissionInvoice(
    transactionId: string,
    partyName: string,
    organizationId: string
  ): Promise<string> {
    const transaction = await prisma.sNPTransaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: {
          include: {
            vessel: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const calculation = await this.calculateCommission(
      transactionId,
      transaction.agreedPrice || 0,
      organizationId
    );

    const partyBreakdown = calculation.breakdown.find(
      (b) => b.party === partyName
    );

    if (!partyBreakdown) {
      throw new Error('Party not found in commission structure');
    }

    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Commission Invoice</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { color: #0066cc; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: bold; }
    .total { font-size: 18pt; font-weight: bold; background: #0066cc; color: white; }
    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .invoice-number { font-size: 14pt; color: #666; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div>
      <h1>COMMISSION INVOICE</h1>
      <p class="invoice-number">Invoice #: INV-${Date.now()}</p>
      <p>Date: ${new Date().toLocaleDateString()}</p>
    </div>
    <div style="text-align: right;">
      <strong>Mari8X Platform</strong><br>
      S&P Commission Services<br>
      invoice@mari8x.com
    </div>
  </div>

  <h2>Bill To:</h2>
  <p>
    <strong>${partyName}</strong><br>
    ${partyBreakdown.role}<br>
  </p>

  <h2>Transaction Details:</h2>
  <table>
    <tr>
      <td><strong>Vessel:</strong></td>
      <td>${transaction.listing.vessel.name} (IMO: ${transaction.listing.vessel.imo})</td>
    </tr>
    <tr>
      <td><strong>Sale Price:</strong></td>
      <td>${calculation.currency} ${calculation.salePrice.toLocaleString()}</td>
    </tr>
    <tr>
      <td><strong>Commission Rate:</strong></td>
      <td>${calculation.totalCommissionPercentage}%</td>
    </tr>
    <tr>
      <td><strong>Total Commission:</strong></td>
      <td>${calculation.currency} ${calculation.totalCommissionAmount.toLocaleString()}</td>
    </tr>
  </table>

  <h2>Your Commission:</h2>
  <table>
    <tr>
      <th>Description</th>
      <th>Amount</th>
    </tr>
    <tr>
      <td>Commission (${partyBreakdown.percentage}% of total)</td>
      <td>${calculation.currency} ${partyBreakdown.amount.toLocaleString()}</td>
    </tr>
    <tr>
      <td>Less: VAT (20%)</td>
      <td>${calculation.currency} ${(partyBreakdown.vatAmount || 0).toLocaleString()}</td>
    </tr>
    <tr class="total">
      <td>TOTAL DUE</td>
      <td>${calculation.currency} ${partyBreakdown.netAmount.toLocaleString()}</td>
    </tr>
  </table>

  <h2>Payment Details:</h2>
  <p>
    <strong>Bank:</strong> Example Bank<br>
    <strong>Account Name:</strong> ${partyName}<br>
    <strong>SWIFT:</strong> XXXXX<br>
    <strong>IBAN:</strong> XXXXX<br>
    <strong>Payment Terms:</strong> 30 days from delivery<br>
    <strong>Reference:</strong> ${transactionId}
  </p>

  <p style="margin-top: 60px; text-align: center; color: #666; font-size: 10pt;">
    Thank you for your business. For queries, contact finance@mari8x.com
  </p>
</body>
</html>
    `.trim();

    return invoiceHTML;
  }

  /**
   * Record commission payment
   */
  async recordCommissionPayment(
    payment: Omit<CommissionPayment, 'id'>,
    organizationId: string
  ): Promise<CommissionPayment> {
    const commissionPayment: CommissionPayment = {
      ...payment,
      id: `PAY-${Date.now()}`,
    };

    // Store in database
    // await prisma.commissionPayment.create({ data: commissionPayment });

    // Update commission structure status
    // Check if all parties paid, update status to 'fully_paid'

    return commissionPayment;
  }

  /**
   * Get commission status
   */
  async getCommissionStatus(
    transactionId: string,
    organizationId: string
  ): Promise<{
    totalDue: number;
    totalPaid: number;
    outstanding: number;
    parties: any[];
  }> {
    // Get all payments for transaction
    // const payments = await prisma.commissionPayment.findMany({ where: { transactionId } });

    // Mock for now
    const calculation = await this.calculateCommission(
      transactionId,
      15000000,
      organizationId
    );

    const parties = calculation.breakdown.map((party) => ({
      name: party.party,
      role: party.role,
      amountDue: party.netAmount,
      amountPaid: 0,
      status: 'pending',
    }));

    return {
      totalDue: calculation.totalPayable,
      totalPaid: 0,
      outstanding: calculation.totalPayable,
      parties,
    };
  }

  /**
   * Standard commission rates by vessel type and size
   */
  getStandardCommissionRate(
    vesselType: string,
    salePrice: number
  ): number {
    // Industry standard commission rates
    const rateTable: Record<string, number> = {
      'Bulk Carrier': 1.25,
      'Container': 1.5,
      'Tanker': 1.25,
      'LNG Carrier': 1.0,
      'VLCC': 1.0,
      'General Cargo': 1.5,
      'Reefer': 1.5,
      'RoRo': 1.5,
      'Chemical Tanker': 1.25,
      'Product Tanker': 1.25,
    };

    // Adjust for sale price (higher price = lower %)
    let baseRate = rateTable[vesselType] || 1.25;

    if (salePrice > 50000000) {
      // > $50M: reduce by 0.25%
      baseRate -= 0.25;
    } else if (salePrice < 5000000) {
      // < $5M: increase by 0.25%
      baseRate += 0.25;
    }

    return Math.max(0.75, Math.min(2.0, baseRate)); // Clamp between 0.75% and 2%
  }
}

export const snpCommissionTrackerService = new SNPCommissionTrackerService();
