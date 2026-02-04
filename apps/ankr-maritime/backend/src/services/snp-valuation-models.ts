/**
 * SNP Valuation Models Service
 * Provides vessel valuation using multiple methods:
 * - Scrap value (LDT × scrap rate)
 * - Market value (comparable sales)
 * - NAV (Net Asset Value) for fleet valuation
 *
 * @module services/snp-valuation-models
 */

import { prisma } from '../schema/context.js';

export interface ScrapValuation {
  method: 'scrap';
  ldt: number; // Light displacement tonnage
  scrapRatePerLDT: number; // USD per LDT
  scrapValue: number;
  currency: string;
  calculatedAt: Date;
  assumptions: string[];
}

export interface MarketValuation {
  method: 'market';
  baseValue: number;
  adjustments: {
    ageAdjustment: number;
    conditionAdjustment: number;
    marketAdjustment: number;
    specialSurveyAdjustment: number;
  };
  adjustedValue: number;
  currency: string;
  comparableSales: number; // Count of comps used
  confidence: 'low' | 'medium' | 'high';
  calculatedAt: Date;
}

export interface NAVValuation {
  method: 'nav';
  bookValue: number;
  marketValue: number;
  depreciation: number;
  impairment: number;
  nav: number;
  navPerShare?: number;
  currency: string;
  calculatedAt: Date;
}

export interface ValuationReport {
  vesselId: string;
  vesselName: string;
  imo: string;
  scrapValuation: ScrapValuation;
  marketValuation: MarketValuation;
  navValuation: NAVValuation;
  recommendedValue: number;
  valuationRange: {
    low: number;
    mid: number;
    high: number;
  };
  methodology: string;
  disclaimer: string;
  generatedAt: Date;
}

class SNPValuationModelsService {
  /**
   * Calculate scrap value
   */
  async calculateScrapValue(
    vesselId: string,
    scrapRatePerLDT?: number
  ): Promise<ScrapValuation> {
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        VesselHistory: {
          orderBy: { asOfDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!vessel) {
      throw new Error('Vessel not found');
    }

    // Get LDT from vessel history or use DWT approximation
    const ldt = vessel.VesselHistory[0]?.ldt || vessel.dwt * 0.15;

    // Default scrap rate: $450-550/LDT (2026 market average)
    const defaultScrapRate = 500;
    const scrapRate = scrapRatePerLDT || defaultScrapRate;

    const scrapValue = ldt * scrapRate;

    return {
      method: 'scrap',
      ldt,
      scrapRatePerLDT: scrapRate,
      scrapValue,
      currency: 'USD',
      calculatedAt: new Date(),
      assumptions: [
        `LDT estimated at ${ldt.toFixed(0)} MT`,
        `Scrap rate: $${scrapRate}/LDT (Bangladesh/India/Pakistan)`,
        'Delivery to scrapping location assumed',
        'No demolition premium or discount',
      ],
    };
  }

  /**
   * Calculate market value using comparable sales
   */
  async calculateMarketValue(
    vesselId: string,
    organizationId: string
  ): Promise<MarketValuation> {
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
    });

    if (!vessel) {
      throw new Error('Vessel not found');
    }

    // Find comparable sales (from Phase 4 comparable sales DB)
    const comps = await prisma.comparableSale.findMany({
      where: {
        vesselType: vessel.vesselType,
        dwt: {
          gte: vessel.dwt * 0.85,
          lte: vessel.dwt * 1.15,
        },
        saleDate: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last 1 year
        },
      },
      orderBy: {
        saleDate: 'desc',
      },
      take: 10,
    });

    if (comps.length === 0) {
      throw new Error('No comparable sales found for this vessel type/size');
    }

    // Calculate base value from comps (median price)
    const prices = comps.map((c) => c.salePrice);
    prices.sort((a, b) => a - b);
    const medianPrice = prices[Math.floor(prices.length / 2)];
    const baseValue = medianPrice;

    // Calculate adjustments
    const vesselAge = new Date().getFullYear() - vessel.yearBuilt;
    const avgCompAge =
      comps.reduce((sum, c) => sum + c.vesselAge, 0) / comps.length;

    // Age adjustment: -3% per year older than comps
    const ageAdjustment = (avgCompAge - vesselAge) * 0.03 * baseValue;

    // Condition adjustment (placeholder - would use survey data)
    const conditionAdjustment = 0; // Neutral

    // Market adjustment (recent trend)
    const recentComps = comps.slice(0, 3);
    const olderComps = comps.slice(-3);
    const recentAvg =
      recentComps.reduce((sum, c) => sum + c.salePrice, 0) / recentComps.length;
    const olderAvg =
      olderComps.reduce((sum, c) => sum + c.salePrice, 0) / olderComps.length;
    const marketTrend = (recentAvg - olderAvg) / olderAvg;
    const marketAdjustment = marketTrend * baseValue;

    // Special survey adjustment (if due within 1 year, -5%)
    const lastSpecialSurvey = vessel.VesselHistory?.[0]?.lastSpecialSurvey;
    const monthsSinceLastSS = lastSpecialSurvey
      ? (Date.now() - lastSpecialSurvey.getTime()) / (30 * 24 * 60 * 60 * 1000)
      : 60;
    const specialSurveyAdjustment =
      monthsSinceLastSS > 48 ? -0.05 * baseValue : 0;

    const adjustedValue =
      baseValue +
      ageAdjustment +
      conditionAdjustment +
      marketAdjustment +
      specialSurveyAdjustment;

    // Confidence based on number of comps and age of data
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    if (comps.length >= 7 && recentComps.length >= 3) {
      confidence = 'high';
    } else if (comps.length < 3) {
      confidence = 'low';
    }

    return {
      method: 'market',
      baseValue,
      adjustments: {
        ageAdjustment,
        conditionAdjustment,
        marketAdjustment,
        specialSurveyAdjustment,
      },
      adjustedValue,
      currency: 'USD',
      comparableSales: comps.length,
      confidence,
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate NAV (Net Asset Value)
   */
  async calculateNAV(
    vesselId: string,
    bookValue?: number,
    shares?: number
  ): Promise<NAVValuation> {
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        VesselHistory: {
          orderBy: { asOfDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!vessel) {
      throw new Error('Vessel not found');
    }

    // Get market value
    const marketVal = await this.calculateMarketValue(
      vesselId,
      vessel.organizationId
    );
    const marketValue = marketVal.adjustedValue;

    // Book value (from accounting records or estimated)
    const vesselAge = new Date().getFullYear() - vessel.yearBuilt;
    const estimatedOriginalCost = marketValue * (1 + vesselAge * 0.03); // Rough estimate
    const providedBookValue = bookValue || estimatedOriginalCost;

    // Depreciation (straight-line over 25 years)
    const depreciationRate = 1 / 25;
    const depreciation = providedBookValue * depreciationRate * vesselAge;

    // Impairment (if market value < book value - depreciation)
    const netBookValue = providedBookValue - depreciation;
    const impairment = Math.max(0, netBookValue - marketValue);

    // NAV = Market Value - Impairment
    const nav = marketValue - impairment;

    // NAV per share (if shares provided)
    const navPerShare = shares ? nav / shares : undefined;

    return {
      method: 'nav',
      bookValue: providedBookValue,
      marketValue,
      depreciation,
      impairment,
      nav,
      navPerShare,
      currency: 'USD',
      calculatedAt: new Date(),
    };
  }

  /**
   * Generate comprehensive valuation report
   */
  async generateValuationReport(
    vesselId: string,
    organizationId: string,
    options?: {
      scrapRatePerLDT?: number;
      bookValue?: number;
      shares?: number;
    }
  ): Promise<ValuationReport> {
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
    });

    if (!vessel) {
      throw new Error('Vessel not found');
    }

    // Calculate all three valuations
    const scrapValuation = await this.calculateScrapValue(
      vesselId,
      options?.scrapRatePerLDT
    );

    const marketValuation = await this.calculateMarketValue(
      vesselId,
      organizationId
    );

    const navValuation = await this.calculateNAV(
      vesselId,
      options?.bookValue,
      options?.shares
    );

    // Recommended value: weighted average (60% market, 30% NAV, 10% scrap)
    const recommendedValue =
      marketValuation.adjustedValue * 0.6 +
      navValuation.nav * 0.3 +
      scrapValuation.scrapValue * 0.1;

    // Valuation range (±15% from recommended)
    const valuationRange = {
      low: recommendedValue * 0.85,
      mid: recommendedValue,
      high: recommendedValue * 1.15,
    };

    return {
      vesselId,
      vesselName: vessel.name,
      imo: vessel.imo,
      scrapValuation,
      marketValuation,
      navValuation,
      recommendedValue,
      valuationRange,
      methodology: `
Multi-method vessel valuation combining:
1. Market Value (60% weight): Based on ${marketValuation.comparableSales} comparable sales
2. NAV (30% weight): Net Asset Value accounting method
3. Scrap Value (10% weight): LDT-based demolition value

Confidence: ${marketValuation.confidence.toUpperCase()}
      `.trim(),
      disclaimer: `
This valuation is for indicative purposes only and should not be relied upon for
investment decisions without independent verification. Actual sale price may vary
significantly based on market conditions, buyer motivation, vessel condition, and
negotiation. Recommend commissioning professional survey and inspection before purchase.
      `.trim(),
      generatedAt: new Date(),
    };
  }

  /**
   * Get valuation trend for a vessel (historical valuations)
   */
  async getValuationTrend(
    vesselId: string,
    organizationId: string,
    months: number = 12
  ): Promise<any[]> {
    // This would fetch historical valuations from database
    // For now, return empty (would need ValuationHistory model)
    return [];
  }

  /**
   * Bulk valuation for fleet
   */
  async valuateFleet(organizationId: string): Promise<any> {
    const vessels = await prisma.vessel.findMany({
      where: { organizationId },
    });

    const valuations = await Promise.all(
      vessels.map(async (v) => {
        try {
          const report = await this.generateValuationReport(v.id, organizationId);
          return {
            vesselId: v.id,
            vesselName: v.name,
            recommendedValue: report.recommendedValue,
            valuationRange: report.valuationRange,
            confidence: report.marketValuation.confidence,
          };
        } catch (error) {
          return {
            vesselId: v.id,
            vesselName: v.name,
            error: (error as Error).message,
          };
        }
      })
    );

    const totalFleetValue = valuations
      .filter((v) => v.recommendedValue)
      .reduce((sum, v) => sum + (v.recommendedValue || 0), 0);

    return {
      totalVessels: vessels.length,
      valuedVessels: valuations.filter((v) => !v.error).length,
      totalFleetValue,
      averageValuePerVessel:
        totalFleetValue /
        valuations.filter((v) => !v.error).length,
      valuations,
    };
  }
}

export const snpValuationModelsService = new SNPValuationModelsService();
