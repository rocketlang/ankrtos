/**
 * Auto-Population Service
 * Automatically populates voyage estimate fields from market data
 */

import { prisma } from '../lib/prisma.js';
import { tariffIngestionService } from './tariff-ingestion.js';

export interface BunkerPrice {
  port: string;
  fuelType: 'vlsfo' | 'lsmgo' | 'hsfo' | 'mdo';
  price: number; // USD per MT
  date: Date;
  source: string;
}

export interface PortCostEstimate {
  portId: string;
  vesselGRT: number;
  estimatedTotal: number;
  breakdown: Array<{
    category: string;
    description: string;
    amount: number;
    currency: string;
  }>;
}

export class AutoPopulateService {
  /**
   * Get latest bunker prices for port
   */
  async getBunkerPricesForPort(portId: string): Promise<{
    vlsfo?: number;
    lsmgo?: number;
    hsfo?: number;
    mdo?: number;
    lastUpdated?: Date;
  }> {
    const port = await prisma.port.findUnique({ where: { id: portId } });
    if (!port) throw new Error('Port not found');

    // Get latest bunker prices
    const prices = await prisma.bunkerPrice.findMany({
      where: {
        portId,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: { date: 'desc' },
      take: 4, // One per fuel type
    });

    if (prices.length === 0) {
      // Return regional averages if no local data
      return this.getRegionalBunkerAverages(port.country);
    }

    const result: any = {};
    for (const price of prices) {
      result[price.fuelType] = price.pricePerMt;
      if (!result.lastUpdated || price.date > result.lastUpdated) {
        result.lastUpdated = price.date;
      }
    }

    return result;
  }

  /**
   * Get regional bunker price averages (fallback)
   */
  private async getRegionalBunkerAverages(country: string): Promise<{
    vlsfo?: number;
    lsmgo?: number;
    hsfo?: number;
    mdo?: number;
  }> {
    // Regional price matrix (sample - should come from market data API)
    const regionalPrices: Record<string, any> = {
      Singapore: { vlsfo: 620, lsmgo: 780, hsfo: 480, mdo: 750 },
      Netherlands: { vlsfo: 650, lsmgo: 800, hsfo: 500, mdo: 780 },
      USA: { vlsfo: 640, lsmgo: 790, hsfo: 490, mdo: 770 },
      UAE: { vlsfo: 610, lsmgo: 770, hsfo: 475, mdo: 740 },
      default: { vlsfo: 630, lsmgo: 785, hsfo: 485, mdo: 760 },
    };

    return regionalPrices[country] || regionalPrices.default;
  }

  /**
   * Calculate estimated port costs
   */
  async calculatePortCosts(
    portId: string,
    vesselData: {
      grt: number;
      dwt: number;
      type: string;
      loa: number;
    },
    cargoTonnage?: number,
    durationDays?: number
  ): Promise<PortCostEstimate> {
    // Get port tariffs
    const tariffs = await tariffIngestionService.getPortTariffs(portId, 'USD');

    const breakdown: PortCostEstimate['breakdown'] = [];
    let total = 0;

    // Calculate each charge
    for (const tariff of tariffs) {
      let amount = 0;

      switch (tariff.unit.toLowerCase()) {
        case 'per grt':
        case 'per grt per day':
          amount = tariff.rateInTargetCurrency * vesselData.grt;
          if (tariff.unit.includes('per day') && durationDays) {
            amount *= durationDays;
          }
          break;

        case 'per dwt':
          amount = tariff.rateInTargetCurrency * vesselData.dwt;
          break;

        case 'per ton':
        case 'per ton per day':
          if (cargoTonnage) {
            amount = tariff.rateInTargetCurrency * cargoTonnage;
            if (tariff.unit.includes('per day') && durationDays) {
              amount *= durationDays;
            }
          }
          break;

        case 'per service':
        case 'per call':
          amount = tariff.rateInTargetCurrency;
          break;

        case 'per tug per hour':
          // Assume 2 tugs, 2 hours average
          amount = tariff.rateInTargetCurrency * 2 * 2;
          break;

        case 'per teu':
        case 'per feu':
          // Skip container-specific charges for non-container vessels
          if (vesselData.type !== 'container') continue;
          break;

        default:
          amount = tariff.rateInTargetCurrency;
      }

      if (amount > 0) {
        breakdown.push({
          category: tariff.description.split(' - ')[0], // Extract category
          description: tariff.description,
          amount: Math.round(amount * 100) / 100,
          currency: 'USD',
        });
        total += amount;
      }
    }

    return {
      portId,
      vesselGRT: vesselData.grt,
      estimatedTotal: Math.round(total * 100) / 100,
      breakdown,
    };
  }

  /**
   * Auto-populate voyage estimate
   */
  async autoPopulateVoyageEstimate(data: {
    vesselId: string;
    loadPortId: string;
    dischargePortId: string;
    cargoTonnage: number;
    speed?: number;
    fuelType?: 'vlsfo' | 'lsmgo';
  }): Promise<{
    bunkerPrices: {
      loadPort: any;
      dischargePort: any;
    };
    portCosts: {
      loadPort: PortCostEstimate;
      dischargePort: PortCostEstimate;
    };
    estimatedBunkerCost: number;
    estimatedPortCost: number;
  }> {
    // Get vessel details
    const vessel = await prisma.vessel.findUnique({ where: { id: data.vesselId } });
    if (!vessel) throw new Error('Vessel not found');

    // Get bunker prices
    const [loadPortBunkerPrices, dischargePortBunkerPrices] = await Promise.all([
      this.getBunkerPricesForPort(data.loadPortId),
      this.getBunkerPricesForPort(data.dischargePortId),
    ]);

    // Get port costs
    const vesselData = {
      grt: vessel.grt || 0,
      dwt: vessel.dwt || 0,
      type: vessel.type,
      loa: vessel.loa || 0,
    };

    const [loadPortCosts, dischargePortCosts] = await Promise.all([
      this.calculatePortCosts(data.loadPortId, vesselData, data.cargoTonnage, 2), // 2 days loading
      this.calculatePortCosts(data.dischargePortId, vesselData, data.cargoTonnage, 2), // 2 days discharge
    ]);

    // Estimate bunker consumption (simplified)
    const speed = data.speed || 13; // knots
    const fuelType = data.fuelType || 'vlsfo';
    const consumptionRate = this.estimateConsumptionRate(vessel.type, vessel.dwt || 0, speed);

    // Get distance (placeholder - should use actual route calculation)
    const distance = 3000; // nautical miles (placeholder)
    const seaDays = distance / speed / 24;

    const bunkerConsumption = consumptionRate * seaDays;
    const bunkerPrice = loadPortBunkerPrices[fuelType] || 630;
    const estimatedBunkerCost = bunkerConsumption * bunkerPrice;

    const estimatedPortCost = loadPortCosts.estimatedTotal + dischargePortCosts.estimatedTotal;

    return {
      bunkerPrices: {
        loadPort: loadPortBunkerPrices,
        dischargePort: dischargePortBunkerPrices,
      },
      portCosts: {
        loadPort: loadPortCosts,
        dischargePort: dischargePortCosts,
      },
      estimatedBunkerCost: Math.round(estimatedBunkerCost * 100) / 100,
      estimatedPortCost: Math.round(estimatedPortCost * 100) / 100,
    };
  }

  /**
   * Estimate fuel consumption rate
   */
  private estimateConsumptionRate(vesselType: string, dwt: number, speed: number): number {
    // Simplified consumption model (MT/day)
    const baseConsumption: Record<string, number> = {
      bulk: 25,
      tanker: 28,
      container: 35,
      general_cargo: 20,
    };

    const base = baseConsumption[vesselType] || 25;

    // Adjust for size (DWT)
    const sizeMultiplier = 1 + (dwt - 50000) / 100000;

    // Adjust for speed (cubic relationship)
    const speedMultiplier = Math.pow(speed / 13, 3);

    return base * sizeMultiplier * speedMultiplier;
  }

  /**
   * Update bunker prices (should run daily)
   */
  async updateBunkerPrices(): Promise<void> {
    // TODO: Integrate with bunker price API (e.g., Ship & Bunker, Bunkerspot)

    const majorBunkerPorts = [
      'SGSIN', // Singapore
      'NLRTM', // Rotterdam
      'USHOU', // Houston
      'AEJEA', // Fujairah
      'PAONX', // Panama
    ];

    // Sample prices (should fetch from API)
    const samplePrices: BunkerPrice[] = [
      { port: 'SGSIN', fuelType: 'vlsfo', price: 620, date: new Date(), source: 'market' },
      { port: 'SGSIN', fuelType: 'lsmgo', price: 780, date: new Date(), source: 'market' },
      { port: 'NLRTM', fuelType: 'vlsfo', price: 650, date: new Date(), source: 'market' },
      { port: 'USHOU', fuelType: 'vlsfo', price: 640, date: new Date(), source: 'market' },
      { port: 'AEJEA', fuelType: 'vlsfo', price: 610, date: new Date(), source: 'market' },
    ];

    for (const price of samplePrices) {
      const port = await prisma.port.findUnique({ where: { unlocode: price.port } });
      if (!port) continue;

      await prisma.bunkerPrice.create({
        data: {
          portId: port.id,
          fuelType: price.fuelType,
          pricePerMt: price.price,
          currency: 'USD',
          date: price.date,
          source: price.source,
        },
      });
    }

    console.log(`✅ Bunker prices updated for ${samplePrices.length} port/fuel combinations`);
  }
}

export const autoPopulateService = new AutoPopulateService();
