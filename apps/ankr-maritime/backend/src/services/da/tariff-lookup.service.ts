/**
 * Port Tariff Lookup Service
 * Calculate port call costs based on tariff database
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface VesselSpecs {
  grt: number; // Gross Registered Tonnage
  nrt: number; // Net Registered Tonnage
  dwt: number; // Deadweight Tonnage
  loa: number; // Length Overall (meters)
  vesselType: string; // 'bulk_carrier', 'tanker', 'container', 'general_cargo'
}

export interface PortCallParams {
  portId: string;
  vesselSpecs: VesselSpecs;
  stayDuration: number; // days
  cargoTonnage?: number; // metric tons
  requiresTug?: boolean;
  requiresPilot?: boolean;
}

export interface CostBreakdown {
  category: string;
  description: string;
  baseRate: number;
  quantity: number;
  unit: string;
  amount: number;
  currency: string;
  formula?: string;
}

export interface TariffCalculationResult {
  success: boolean;
  portId: string;
  portName?: string;
  totalCost: number;
  currency: string;
  breakdown: CostBreakdown[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'; // Based on data source
  dataSource: string;
  calculatedAt: Date;
  notes?: string[];
  error?: string;
}

export class TariffLookupService {
  /**
   * Calculate port call costs using tariff database
   */
  async calculatePortCallCost(params: PortCallParams): Promise<TariffCalculationResult> {
    try {
      // Get port info
      const port = await prisma.port.findUnique({
        where: { id: params.portId },
        select: { id: true, name: true, country: true, unlocode: true },
      });

      if (!port) {
        return {
          success: false,
          portId: params.portId,
          totalCost: 0,
          currency: 'USD',
          breakdown: [],
          confidence: 'LOW',
          dataSource: 'NONE',
          calculatedAt: new Date(),
          error: `Port not found: ${params.portId}`,
        };
      }

      // Get applicable tariffs for this port
      const tariffs = await prisma.portTariff.findMany({
        where: {
          portId: params.portId,
          effectiveFrom: { lte: new Date() },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
          OR: [
            { vesselType: null }, // Applies to all vessel types
            { vesselType: params.vesselSpecs.vesselType },
          ],
          OR: [
            {
              AND: [
                { sizeRangeMin: null, sizeRangeMax: null }, // No size restriction
              ],
            },
            {
              AND: [
                { sizeRangeMin: { lte: params.vesselSpecs.dwt } },
                { sizeRangeMax: { gte: params.vesselSpecs.dwt } },
              ],
            },
          ],
        },
        orderBy: { chargeType: 'asc' },
      });

      if (tariffs.length === 0) {
        // No tariffs found - use estimation
        return this.estimatePortCallCost(port, params);
      }

      // Calculate costs
      const breakdown: CostBreakdown[] = [];
      let totalCost = 0;
      let dataSource = 'UNKNOWN';
      const notes: string[] = [];

      for (const tariff of tariffs) {
        const cost = this.calculateTariffCost(tariff, params);

        if (cost.amount > 0) {
          breakdown.push(cost);
          totalCost += cost.amount;
        }

        // Track data source (prefer REAL over SIMULATED)
        if (tariff.dataSource === 'REAL_SCRAPED' || tariff.dataSource === 'API') {
          dataSource = tariff.dataSource;
        } else if (dataSource === 'UNKNOWN') {
          dataSource = tariff.dataSource;
        }
      }

      // Determine confidence
      let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
      if (dataSource === 'REAL_SCRAPED' || dataSource === 'API') {
        confidence = 'HIGH';
      } else if (dataSource === 'SIMULATED') {
        confidence = 'MEDIUM';
        notes.push('Based on simulated tariff data - actual costs may vary');
      } else {
        confidence = 'LOW';
        notes.push('Limited tariff data available - costs are estimates');
      }

      return {
        success: true,
        portId: params.portId,
        portName: port.name,
        totalCost,
        currency: 'USD',
        breakdown,
        confidence,
        dataSource,
        calculatedAt: new Date(),
        notes: notes.length > 0 ? notes : undefined,
      };
    } catch (error: any) {
      console.error('Tariff calculation error:', error);
      return {
        success: false,
        portId: params.portId,
        totalCost: 0,
        currency: 'USD',
        breakdown: [],
        confidence: 'LOW',
        dataSource: 'ERROR',
        calculatedAt: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Calculate individual tariff cost
   */
  private calculateTariffCost(tariff: any, params: PortCallParams): CostBreakdown {
    let quantity = 0;
    let amount = 0;

    switch (tariff.unit) {
      case 'per_grt':
        quantity = params.vesselSpecs.grt;
        amount = tariff.amount * quantity;
        break;

      case 'per_nrt':
        quantity = params.vesselSpecs.nrt;
        amount = tariff.amount * quantity;
        break;

      case 'per_mt':
        quantity = params.cargoTonnage || 0;
        amount = tariff.amount * quantity;
        break;

      case 'per_day':
        quantity = params.stayDuration;
        amount = tariff.amount * quantity;
        break;

      case 'per_hour':
        quantity = params.stayDuration * 24;
        amount = tariff.amount * quantity;
        break;

      case 'lumpsum':
        quantity = 1;
        amount = tariff.amount;
        break;

      default:
        quantity = 1;
        amount = tariff.amount;
    }

    // Apply conditional charges
    if (tariff.chargeType === 'pilotage' && !params.requiresPilot) {
      amount = 0;
    }
    if (tariff.chargeType === 'towage' && !params.requiresTug) {
      amount = 0;
    }

    return {
      category: tariff.chargeType,
      description: `${this.formatChargeType(tariff.chargeType)} (${tariff.vesselType || 'all vessels'})`,
      baseRate: tariff.amount,
      quantity,
      unit: tariff.unit,
      amount: Math.round(amount * 100) / 100, // Round to 2 decimals
      currency: tariff.currency,
      formula: tariff.notes || undefined,
    };
  }

  /**
   * Estimate port call cost when no tariffs available
   */
  private async estimatePortCallCost(
    port: any,
    params: PortCallParams
  ): Promise<TariffCalculationResult> {
    const { grt, dwt } = params.vesselSpecs;

    // Simple estimation formulas based on vessel size
    const portDues = grt * 0.035; // ~$0.035 per GRT
    const pilotage = 1000 + (grt > 10000 ? (grt - 10000) * 0.02 : 0);
    const towage = 2500 + (grt > 15000 ? 1500 : 0); // Extra for large vessels
    const berthDues = grt * 0.15 * params.stayDuration; // Per day
    const agencyFee = 1500; // Flat fee

    const breakdown: CostBreakdown[] = [
      {
        category: 'port_dues',
        description: 'Estimated port dues',
        baseRate: 0.035,
        quantity: grt,
        unit: 'per_grt',
        amount: portDues,
        currency: 'USD',
      },
      {
        category: 'pilotage',
        description: 'Estimated pilotage',
        baseRate: 1000,
        quantity: 1,
        unit: 'lumpsum',
        amount: pilotage,
        currency: 'USD',
      },
      {
        category: 'towage',
        description: 'Estimated tug assistance',
        baseRate: 2500,
        quantity: 1,
        unit: 'lumpsum',
        amount: towage,
        currency: 'USD',
      },
      {
        category: 'berth_hire',
        description: 'Estimated berth charges',
        baseRate: 0.15,
        quantity: grt * params.stayDuration,
        unit: 'per_grt_per_day',
        amount: berthDues,
        currency: 'USD',
      },
      {
        category: 'agency_fee',
        description: 'Estimated port agency fee',
        baseRate: 1500,
        quantity: 1,
        unit: 'lumpsum',
        amount: agencyFee,
        currency: 'USD',
      },
    ];

    const totalCost = breakdown.reduce((sum, item) => sum + item.amount, 0);

    return {
      success: true,
      portId: port.id,
      portName: port.name,
      totalCost: Math.round(totalCost * 100) / 100,
      currency: 'USD',
      breakdown,
      confidence: 'LOW',
      dataSource: 'ESTIMATED',
      calculatedAt: new Date(),
      notes: [
        `No tariff data available for ${port.name}`,
        'Costs are rough estimates based on typical port charges',
        'Actual costs may vary significantly - please verify with port agent',
      ],
    };
  }

  /**
   * Format charge type for display
   */
  private formatChargeType(chargeType: string): string {
    const map: Record<string, string> = {
      port_dues: 'Port Dues',
      pilotage: 'Pilotage',
      towage: 'Tug Assistance',
      berth_hire: 'Berth Charges',
      anchorage: 'Anchorage',
      light_dues: 'Light Dues',
      mooring: 'Mooring',
      unmooring: 'Unmooring',
      agency_fee: 'Port Agency Fee',
      canal_dues: 'Canal Dues',
    };

    return map[chargeType] || chargeType;
  }

  /**
   * Get all tariffs for a port
   */
  async getPortTariffs(portId: string): Promise<any[]> {
    return await prisma.portTariff.findMany({
      where: {
        portId,
        effectiveFrom: { lte: new Date() },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
      },
      orderBy: [{ vesselType: 'asc' }, { chargeType: 'asc' }],
    });
  }

  /**
   * Compare costs across multiple ports
   */
  async comparePortCosts(portIds: string[], params: Omit<PortCallParams, 'portId'>): Promise<TariffCalculationResult[]> {
    const results: TariffCalculationResult[] = [];

    for (const portId of portIds) {
      const result = await this.calculatePortCallCost({ ...params, portId });
      results.push(result);
    }

    return results.sort((a, b) => a.totalCost - b.totalCost); // Cheapest first
  }
}

export const tariffLookupService = new TariffLookupService();
