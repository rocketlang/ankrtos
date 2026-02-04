/**
 * Port Tariff Management Service
 * Phase 6: DA Desk & Port Agency
 *
 * Features:
 * - Tariff CRUD operations
 * - Tariff search and comparison
 * - Multi-currency support with FX conversion
 * - Tariff update workflow
 * - Historical tariff tracking
 */

import { prisma } from '../lib/prisma.js';
import type { PortTariff, Prisma } from '@prisma/client';

export interface TariffCalculation {
  chargeType: string;
  amount: number;
  currency: string;
  unit: string;
  vesselMetric: number; // GRT, NRT, DWT, etc.
  totalCharge: number;
  notes?: string;
}

export interface PortCostEstimate {
  portId: string;
  portName: string;
  totalCostUSD: number;
  breakdown: TariffCalculation[];
  currency: string;
  exchangeRate: number;
  estimatedDate: Date;
}

export interface TariffComparison {
  portA: PortCostEstimate;
  portB: PortCostEstimate;
  difference: number;
  differencePercent: number;
  recommendation: string;
}

class PortTariffService {
  /**
   * Calculate total port cost for a vessel call
   */
  async calculatePortCost(
    portId: string,
    vesselData: {
      type: string;
      dwt: number;
      grt: number;
      nrt: number;
    },
    operations: string[] = [
      'port_dues',
      'pilotage',
      'towage',
      'berth_hire',
      'agency_fee',
    ],
    stayDays: number = 2
  ): Promise<PortCostEstimate> {
    // Get applicable tariffs
    const tariffs = await this.getApplicableTariffs(portId, vesselData.type, vesselData.dwt);

    const breakdown: TariffCalculation[] = [];
    let totalCostUSD = 0;

    for (const tariff of tariffs) {
      if (!operations.includes(tariff.chargeType)) continue;

      const calculation = this.calculateCharge(tariff, vesselData, stayDays);
      breakdown.push(calculation);

      // Convert to USD if needed
      const usdAmount = await this.convertToUSD(
        calculation.totalCharge,
        tariff.currency
      );
      totalCostUSD += usdAmount;
    }

    const port = await prisma.port.findUnique({
      where: { id: portId },
      select: { name: true },
    });

    return {
      portId,
      portName: port?.name || 'Unknown',
      totalCostUSD,
      breakdown,
      currency: 'USD',
      exchangeRate: 1.0,
      estimatedDate: new Date(),
    };
  }

  /**
   * Get applicable tariffs for a vessel
   */
  private async getApplicableTariffs(
    portId: string,
    vesselType: string,
    dwt: number
  ): Promise<PortTariff[]> {
    const now = new Date();

    return await prisma.portTariff.findMany({
      where: {
        portId,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        OR: [
          { vesselType: null }, // Applies to all vessels
          { vesselType },
          {
            AND: [
              { sizeRangeMin: { lte: dwt } },
              { sizeRangeMax: { gte: dwt } },
            ],
          },
        ],
      },
      orderBy: { chargeType: 'asc' },
    });
  }

  /**
   * Calculate individual charge
   */
  private calculateCharge(
    tariff: PortTariff,
    vesselData: { dwt: number; grt: number; nrt: number },
    stayDays: number
  ): TariffCalculation {
    let vesselMetric = 0;
    let multiplier = 1;

    switch (tariff.unit) {
      case 'per_grt':
        vesselMetric = vesselData.grt;
        multiplier = vesselMetric;
        break;
      case 'per_nrt':
        vesselMetric = vesselData.nrt;
        multiplier = vesselMetric;
        break;
      case 'per_dwt':
        vesselMetric = vesselData.dwt;
        multiplier = vesselMetric;
        break;
      case 'per_day':
        vesselMetric = stayDays;
        multiplier = stayDays;
        break;
      case 'per_hour':
        vesselMetric = stayDays * 24;
        multiplier = stayDays * 24;
        break;
      case 'lumpsum':
        vesselMetric = 1;
        multiplier = 1;
        break;
      default:
        vesselMetric = 1;
        multiplier = 1;
    }

    const totalCharge = tariff.amount * multiplier;

    return {
      chargeType: tariff.chargeType,
      amount: tariff.amount,
      currency: tariff.currency,
      unit: tariff.unit,
      vesselMetric,
      totalCharge,
      notes: tariff.notes || undefined,
    };
  }

  /**
   * Convert amount to USD
   */
  private async convertToUSD(amount: number, fromCurrency: string): Promise<number> {
    if (fromCurrency === 'USD') return amount;

    // Get latest currency rate
    const rate = await prisma.currencyRate.findFirst({
      where: {
        fromCurrency,
        toCurrency: 'USD',
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!rate) {
      console.warn(`No FX rate found for ${fromCurrency}/USD, using 1.0`);
      return amount;
    }

    return amount * rate.rate;
  }

  /**
   * Compare port costs between two ports
   */
  async comparePorts(
    portIdA: string,
    portIdB: string,
    vesselData: {
      type: string;
      dwt: number;
      grt: number;
      nrt: number;
    },
    operations?: string[],
    stayDays?: number
  ): Promise<TariffComparison> {
    const [portA, portB] = await Promise.all([
      this.calculatePortCost(portIdA, vesselData, operations, stayDays),
      this.calculatePortCost(portIdB, vesselData, operations, stayDays),
    ]);

    const difference = portB.totalCostUSD - portA.totalCostUSD;
    const differencePercent = (difference / portA.totalCostUSD) * 100;

    let recommendation = '';
    if (Math.abs(differencePercent) < 5) {
      recommendation = 'Costs are similar - choose based on other factors';
    } else if (difference < 0) {
      recommendation = `${portB.portName} is ${Math.abs(differencePercent).toFixed(1)}% cheaper`;
    } else {
      recommendation = `${portA.portName} is ${Math.abs(differencePercent).toFixed(1)}% cheaper`;
    }

    return {
      portA,
      portB,
      difference,
      differencePercent,
      recommendation,
    };
  }

  /**
   * Create or update tariff
   */
  async upsertTariff(
    data: Prisma.PortTariffCreateInput,
    organizationId: string
  ): Promise<PortTariff> {
    // Check if similar tariff exists
    const existing = await prisma.portTariff.findFirst({
      where: {
        portId: data.port.connect?.id,
        chargeType: data.chargeType,
        vesselType: data.vesselType,
        sizeRangeMin: data.sizeRangeMin,
        sizeRangeMax: data.sizeRangeMax,
        effectiveTo: null, // Currently active
      },
    });

    if (existing) {
      // End existing tariff
      await prisma.portTariff.update({
        where: { id: existing.id },
        data: { effectiveTo: new Date() },
      });
    }

    // Create new tariff
    return await prisma.portTariff.create({ data });
  }

  /**
   * Get tariffs for a port
   */
  async getPortTariffs(
    portId: string,
    activeOnly: boolean = true
  ): Promise<PortTariff[]> {
    const where: Prisma.PortTariffWhereInput = { portId };

    if (activeOnly) {
      const now = new Date();
      where.effectiveFrom = { lte: now };
      where.OR = [{ effectiveTo: null }, { effectiveTo: { gte: now } }];
    }

    return await prisma.portTariff.findMany({
      where,
      orderBy: [{ chargeType: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }

  /**
   * Bulk import tariffs from CSV
   */
  async bulkImportTariffs(
    tariffs: Array<{
      portId: string;
      vesselType?: string;
      sizeRangeMin?: number;
      sizeRangeMax?: number;
      chargeType: string;
      amount: number;
      currency: string;
      unit: string;
      notes?: string;
    }>,
    organizationId: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const tariff of tariffs) {
      try {
        await this.upsertTariff(
          {
            port: { connect: { id: tariff.portId } },
            vesselType: tariff.vesselType,
            sizeRangeMin: tariff.sizeRangeMin,
            sizeRangeMax: tariff.sizeRangeMax,
            chargeType: tariff.chargeType,
            amount: tariff.amount,
            currency: tariff.currency,
            unit: tariff.unit,
            notes: tariff.notes,
          },
          organizationId
        );
        success++;
      } catch (error) {
        failed++;
        errors.push(
          `Failed to import tariff for port ${tariff.portId}, charge ${tariff.chargeType}: ${error.message}`
        );
      }
    }

    return { success, failed, errors };
  }

  /**
   * Get tariff statistics
   */
  async getTariffStats(organizationId: string): Promise<{
    totalPorts: number;
    totalTariffs: number;
    byChargeType: Record<string, number>;
    recentUpdates: number;
    missingPorts: string[];
  }> {
    const [totalPorts, totalTariffs, byChargeTypeRaw, recentUpdates, allPorts] =
      await Promise.all([
        prisma.port.count(),
        prisma.portTariff.count(),
        prisma.portTariff.groupBy({
          by: ['chargeType'],
          _count: { id: true },
        }),
        prisma.portTariff.count({
          where: {
            effectiveFrom: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.port.findMany({ select: { id: true, name: true } }),
      ]);

    const byChargeType: Record<string, number> = {};
    byChargeTypeRaw.forEach((item) => {
      byChargeType[item.chargeType] = item._count.id;
    });

    // Find ports without tariffs
    const portsWithTariffs = await prisma.portTariff.findMany({
      select: { portId: true },
      distinct: ['portId'],
    });
    const portsWithTariffsSet = new Set(portsWithTariffs.map((p) => p.portId));
    const missingPorts = allPorts
      .filter((p) => !portsWithTariffsSet.has(p.id))
      .map((p) => p.name)
      .slice(0, 20); // First 20

    return {
      totalPorts,
      totalTariffs,
      byChargeType,
      recentUpdates,
      missingPorts,
    };
  }

  /**
   * Search tariffs
   */
  async searchTariffs(
    filters: {
      portId?: string;
      chargeType?: string;
      vesselType?: string;
      currency?: string;
      minAmount?: number;
      maxAmount?: number;
    },
    limit: number = 50
  ): Promise<PortTariff[]> {
    const where: Prisma.PortTariffWhereInput = {};

    if (filters.portId) where.portId = filters.portId;
    if (filters.chargeType) where.chargeType = filters.chargeType;
    if (filters.vesselType) where.vesselType = filters.vesselType;
    if (filters.currency) where.currency = filters.currency;
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) where.amount.gte = filters.minAmount;
      if (filters.maxAmount !== undefined) where.amount.lte = filters.maxAmount;
    }

    // Only active tariffs
    const now = new Date();
    where.effectiveFrom = { lte: now };
    where.OR = [{ effectiveTo: null }, { effectiveTo: { gte: now } }];

    return await prisma.portTariff.findMany({
      where,
      take: limit,
      orderBy: { amount: 'desc' },
      include: { port: { select: { name: true, unlocode: true } } },
    });
  }
}

export const portTariffService = new PortTariffService();
