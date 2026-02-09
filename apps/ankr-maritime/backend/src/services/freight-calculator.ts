// freight-calculator.ts — Maritime Freight Calculations (TCE, Ballast Bonus, Commissions)

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

interface VoyageParams {
  loadPort: string;
  dischargePort: string;
  cargo: number; // MT (metric tons)
  freight: number; // USD per MT
  currency?: string; // Default USD
  vesselDwt: number; // Deadweight tonnage
  vesselSpeed: number; // Knots
  vesselConsumption: {
    laden: number; // MT/day at laden speed
    ballast: number; // MT/day at ballast speed
  };
  bunkerPrice: {
    ifo: number; // USD/MT
    mgo?: number; // USD/MT (optional)
  };
  distance: {
    ballast: number; // Nautical miles
    laden: number; // Nautical miles
  };
  portCosts: {
    load: number; // USD
    discharge: number; // USD
  };
  loadRate: number; // MT per day
  dischargeRate: number; // MT per day
  commissions?: {
    address?: number; // % (typically 1.25%)
    brokerage?: number; // % (typically 1.25%)
  };
  extraCosts?: number; // Canal dues, etc.
}

interface TCEResult {
  grossFreight: number;
  totalCommissions: number;
  netFreight: number;
  totalVoyageCosts: number;
  totalVoyageDays: number;
  tce: number; // Time Charter Equivalent (USD/day)
  breakdown: {
    revenue: {
      grossFreight: number;
      addressCommission: number;
      brokerageCommission: number;
      netFreight: number;
    };
    costs: {
      bunkerCosts: {
        ballastLeg: number;
        ladenLeg: number;
        portStay: number;
        total: number;
      };
      portCosts: {
        loading: number;
        discharge: number;
        total: number;
      };
      extraCosts: number;
      total: number;
    };
    time: {
      ballastDays: number;
      loadingDays: number;
      ladenDays: number;
      dischargeDays: number;
      totalDays: number;
    };
  };
}

interface BallastBonusResult {
  ballastDays: number;
  ballastDistance: number;
  recommendedBonus: number; // USD
  bonusPerDay: number; // USD/day
  calculation: string;
}

interface CommissionSplit {
  grossAmount: number;
  addressCommission: {
    rate: number; // %
    amount: number;
  };
  brokerageCommission: {
    rate: number; // %
    amount: number;
  };
  totalCommissions: number;
  netAmount: number;
}

export class FreightCalculator {
  /**
   * Calculate Time Charter Equivalent (TCE)
   */
  calculateTCE(params: VoyageParams): TCEResult {
    const {
      cargo,
      freight,
      vesselSpeed,
      vesselConsumption,
      bunkerPrice,
      distance,
      portCosts,
      loadRate,
      dischargeRate,
      commissions = { address: 1.25, brokerage: 1.25 },
      extraCosts = 0,
    } = params;

    // Revenue Calculations
    const grossFreight = cargo * freight;
    const addressCommission = grossFreight * ((commissions.address || 0) / 100);
    const brokerageCommission = grossFreight * ((commissions.brokerage || 0) / 100);
    const totalCommissions = addressCommission + brokerageCommission;
    const netFreight = grossFreight - totalCommissions;

    // Time Calculations
    const ballastDays = distance.ballast / (vesselSpeed * 24); // Convert to days
    const ladenDays = distance.laden / (vesselSpeed * 24);
    const loadingDays = cargo / loadRate;
    const dischargeDays = cargo / dischargeRate;
    const portStayDays = loadingDays + dischargeDays;
    const totalDays = ballastDays + loadingDays + ladenDays + dischargeDays;

    // Bunker Cost Calculations
    const ballastBunkerCost = ballastDays * vesselConsumption.ballast * bunkerPrice.ifo;
    const ladenBunkerCost = ladenDays * vesselConsumption.laden * bunkerPrice.ifo;
    const portStayBunkerCost = portStayDays * 3 * bunkerPrice.ifo; // Assume 3 MT/day in port
    const totalBunkerCosts = ballastBunkerCost + ladenBunkerCost + portStayBunkerCost;

    // Port Costs
    const totalPortCosts = portCosts.load + portCosts.discharge;

    // Total Voyage Costs
    const totalVoyageCosts = totalBunkerCosts + totalPortCosts + extraCosts;

    // TCE Calculation
    const voyageProfit = netFreight - totalVoyageCosts;
    const tce = voyageProfit / totalDays;

    return {
      grossFreight,
      totalCommissions,
      netFreight,
      totalVoyageCosts,
      totalVoyageDays: totalDays,
      tce,
      breakdown: {
        revenue: {
          grossFreight,
          addressCommission,
          brokerageCommission,
          netFreight,
        },
        costs: {
          bunkerCosts: {
            ballastLeg: ballastBunkerCost,
            ladenLeg: ladenBunkerCost,
            portStay: portStayBunkerCost,
            total: totalBunkerCosts,
          },
          portCosts: {
            loading: portCosts.load,
            discharge: portCosts.discharge,
            total: totalPortCosts,
          },
          extraCosts,
          total: totalVoyageCosts,
        },
        time: {
          ballastDays,
          loadingDays,
          ladenDays,
          dischargeDays,
          totalDays,
        },
      },
    };
  }

  /**
   * Calculate recommended ballast bonus
   */
  calculateBallastBonus(params: {
    ballastDistance: number;
    vesselSpeed: number;
    dailyTCE: number; // Target TCE rate
    bunkerConsumption: number; // MT/day
    bunkerPrice: number; // USD/MT
  }): BallastBonusResult {
    const { ballastDistance, vesselSpeed, dailyTCE, bunkerConsumption, bunkerPrice } = params;

    const ballastDays = ballastDistance / (vesselSpeed * 24);
    const bunkerCost = ballastDays * bunkerConsumption * bunkerPrice;
    const opportunityCost = ballastDays * dailyTCE;

    // Recommended bonus = bunker cost + opportunity cost
    const recommendedBonus = bunkerCost + opportunityCost;
    const bonusPerDay = recommendedBonus / ballastDays;

    return {
      ballastDays,
      ballastDistance,
      recommendedBonus: Math.round(recommendedBonus),
      bonusPerDay: Math.round(bonusPerDay),
      calculation: `Bunker: $${Math.round(bunkerCost)} + Opportunity: $${Math.round(opportunityCost)}`,
    };
  }

  /**
   * Calculate commission split
   */
  calculateCommissions(params: {
    amount: number;
    addressCommission?: number; // %
    brokerageCommission?: number; // %
  }): CommissionSplit {
    const { amount, addressCommission = 1.25, brokerageCommission = 1.25 } = params;

    const addressAmount = amount * (addressCommission / 100);
    const brokerageAmount = amount * (brokerageCommission / 100);
    const totalCommissions = addressAmount + brokerageAmount;
    const netAmount = amount - totalCommissions;

    return {
      grossAmount: amount,
      addressCommission: {
        rate: addressCommission,
        amount: addressAmount,
      },
      brokerageCommission: {
        rate: brokerageCommission,
        amount: brokerageAmount,
      },
      totalCommissions,
      netAmount,
    };
  }

  /**
   * Convert freight to different currencies
   */
  async convertFreight(params: {
    amount: number;
    fromCurrency: string;
    toCurrency: string;
  }): Promise<{ amount: number; rate: number; converted: number }> {
    const { amount, fromCurrency, toCurrency } = params;

    if (fromCurrency === toCurrency) {
      return { amount, rate: 1, converted: amount };
    }

    // Get exchange rate from database or external API
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);

    return {
      amount,
      rate,
      converted: amount * rate,
    };
  }

  /**
   * Calculate freight for different cargo types
   */
  calculateFreightTypes(params: {
    cargo: number;
    freightRate: number;
    freightType: 'lumpsum' | 'per_mt' | 'per_day' | 'worldscale';
    voyageDays?: number;
    worldscaleRate?: number;
    flatRate?: number;
  }): number {
    const { cargo, freightRate, freightType, voyageDays, worldscaleRate, flatRate } = params;

    switch (freightType) {
      case 'lumpsum':
        return freightRate; // Fixed amount for entire voyage

      case 'per_mt':
        return cargo * freightRate; // USD per metric ton

      case 'per_day':
        if (!voyageDays) throw new Error('Voyage days required for per_day freight');
        return voyageDays * freightRate; // USD per day

      case 'worldscale':
        if (!worldscaleRate || !flatRate) {
          throw new Error('Worldscale rate and flat rate required');
        }
        return cargo * flatRate * (worldscaleRate / 100); // Worldscale percentage

      default:
        throw new Error(`Unknown freight type: ${freightType}`);
    }
  }

  /**
   * Calculate voyage comparison (multiple offers)
   */
  compareVoyages(voyages: VoyageParams[]): Array<TCEResult & { rank: number; index: number }> {
    const results = voyages.map((voyage, index) => ({
      ...this.calculateTCE(voyage),
      index,
      rank: 0,
    }));

    // Sort by TCE (highest first)
    results.sort((a, b) => b.tce - a.tce);

    // Assign ranks
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    return results;
  }

  /**
   * Calculate breakeven freight rate
   */
  calculateBreakeven(params: {
    targetTCE: number; // USD/day
    cargo: number; // MT
    vesselSpeed: number;
    vesselConsumption: { laden: number; ballast: number };
    bunkerPrice: { ifo: number };
    distance: { ballast: number; laden: number };
    portCosts: { load: number; discharge: number };
    loadRate: number;
    dischargeRate: number;
    commissions?: { address?: number; brokerage?: number };
    extraCosts?: number;
  }): { breakevenRate: number; breakdown: any } {
    const {
      targetTCE,
      cargo,
      vesselSpeed,
      vesselConsumption,
      bunkerPrice,
      distance,
      portCosts,
      loadRate,
      dischargeRate,
      commissions = { address: 1.25, brokerage: 1.25 },
      extraCosts = 0,
    } = params;

    // Calculate voyage time
    const ballastDays = distance.ballast / (vesselSpeed * 24);
    const ladenDays = distance.laden / (vesselSpeed * 24);
    const loadingDays = cargo / loadRate;
    const dischargeDays = cargo / dischargeRate;
    const totalDays = ballastDays + loadingDays + ladenDays + dischargeDays;

    // Calculate costs
    const bunkerCosts =
      ballastDays * vesselConsumption.ballast * bunkerPrice.ifo +
      ladenDays * vesselConsumption.laden * bunkerPrice.ifo +
      (loadingDays + dischargeDays) * 3 * bunkerPrice.ifo;

    const totalPortCosts = portCosts.load + portCosts.discharge;
    const totalCosts = bunkerCosts + totalPortCosts + extraCosts;

    // Required voyage profit
    const requiredProfit = targetTCE * totalDays;

    // Gross freight needed
    const totalCommissionRate = (commissions.address || 0) + (commissions.brokerage || 0);
    const netToGrossRatio = 1 - totalCommissionRate / 100;
    const grossFreightNeeded = (requiredProfit + totalCosts) / netToGrossRatio;

    // Breakeven rate per MT
    const breakevenRate = grossFreightNeeded / cargo;

    return {
      breakevenRate: Math.round(breakevenRate * 100) / 100,
      breakdown: {
        targetTCE,
        totalDays,
        requiredProfit,
        totalCosts,
        grossFreightNeeded,
        cargo,
      },
    };
  }

  /**
   * Get historical exchange rate
   */
  private async getExchangeRate(from: string, to: string): Promise<number> {
    // Try to get from database cache first
    const cached = await prisma.exchangeRate?.findFirst({
      where: {
        fromCurrency: from,
        toCurrency: to,
        date: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { date: 'desc' },
    });

    if (cached) {
      return cached.rate;
    }

    // Fallback to hardcoded rates (in production, use external API)
    const rates: Record<string, Record<string, number>> = {
      USD: { EUR: 0.92, GBP: 0.79, JPY: 149.5, SGD: 1.34, NOK: 10.87 },
      EUR: { USD: 1.09, GBP: 0.86, JPY: 162.8, SGD: 1.46, NOK: 11.83 },
      GBP: { USD: 1.27, EUR: 1.16, JPY: 189.2, SGD: 1.70, NOK: 13.76 },
    };

    return rates[from]?.[to] || 1;
  }

  /**
   * Calculate cargo intake (actual vs declared)
   */
  calculateCargoIntake(params: {
    declaredCargo: number;
    actualCargo: number;
    freightRate: number;
    allowedVariance?: number; // % (default 0.5%)
  }): {
    difference: number;
    differencePercent: number;
    withinTolerance: boolean;
    freightDifference: number;
  } {
    const { declaredCargo, actualCargo, freightRate, allowedVariance = 0.5 } = params;

    const difference = actualCargo - declaredCargo;
    const differencePercent = (difference / declaredCargo) * 100;
    const withinTolerance = Math.abs(differencePercent) <= allowedVariance;
    const freightDifference = difference * freightRate;

    return {
      difference,
      differencePercent: Math.round(differencePercent * 100) / 100,
      withinTolerance,
      freightDifference: Math.round(freightDifference * 100) / 100,
    };
  }
}

export const freightCalculator = new FreightCalculator();
