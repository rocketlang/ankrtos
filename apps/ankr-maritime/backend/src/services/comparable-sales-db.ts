/**
 * Comparable Sales Database Service
 * Phase 4: Ship Broking & S&P
 *
 * Features:
 * - Historical S&P transaction database
 * - Comparable vessel matching
 * - Market trend analysis
 * - Price index calculation
 * - Auto-population from market reports
 */

import { prisma } from '../lib/prisma.js';

export interface ComparableSale {
  id: string;
  vesselName: string;
  vesselType: string;
  dwt: number;
  built: number;
  flag: string;
  builder: string;
  salePrice: number;
  currency: string;
  saleDate: Date;
  deliveryDate?: Date;
  buyer?: string;
  seller?: string;
  source: string;
  verified: boolean;
  notes?: string;
  createdAt: Date;
}

export interface ComparableMatch {
  sale: ComparableSale;
  matchScore: number;
  matchFactors: {
    typeMatch: number;
    ageMatch: number;
    sizeMatch: number;
    builderMatch: number;
    recencyMatch: number;
  };
  adjustedPrice: number;
  adjustment: number;
}

export interface PriceIndex {
  vesselType: string;
  period: string;
  averagePrice: number;
  medianPrice: number;
  transactionCount: number;
  priceChange: number;
  priceChangePercent: number;
}

class ComparableSalesDBService {
  /**
   * Add comparable sale to database
   */
  async addSale(sale: Omit<ComparableSale, 'id' | 'createdAt'>): Promise<ComparableSale> {
    const newSale: ComparableSale = {
      id: `sale-${Date.now()}`,
      ...sale,
      createdAt: new Date(),
    };

    // In production: Store in database
    // await prisma.comparableSale.create({ data: newSale });

    return newSale;
  }

  /**
   * Find comparable sales for valuation
   */
  async findComparables(
    vesselType: string,
    dwt: number,
    built: number,
    limit: number = 10
  ): Promise<ComparableMatch[]> {
    // In production: Query database with similarity scoring
    // const sales = await prisma.comparableSale.findMany({
    //   where: {
    //     vesselType: { in: this.getRelatedTypes(vesselType) },
    //     dwt: { gte: dwt * 0.8, lte: dwt * 1.2 },
    //     built: { gte: built - 3, lte: built + 3 },
    //     verified: true,
    //   },
    //   orderBy: { saleDate: 'desc' },
    //   take: limit * 3, // Get more for scoring
    // });

    // Simulated comparable sales
    const sales: ComparableSale[] = [
      {
        id: 'sale-1',
        vesselName: 'MV PACIFIC DREAM',
        vesselType: 'bulk_carrier',
        dwt: 82000,
        built: 2010,
        flag: 'Panama',
        builder: 'Hyundai Heavy Industries',
        salePrice: 18500000,
        currency: 'USD',
        saleDate: new Date('2025-11-15'),
        buyer: 'Pacific Shipping Ltd',
        seller: 'Ocean Carriers Inc',
        source: 'Clarksons SIN',
        verified: true,
        createdAt: new Date('2025-11-16'),
      },
      {
        id: 'sale-2',
        vesselName: 'MV ASIAN STAR',
        vesselType: 'bulk_carrier',
        dwt: 81500,
        built: 2011,
        flag: 'Liberia',
        builder: 'DSME',
        salePrice: 17800000,
        currency: 'USD',
        saleDate: new Date('2025-10-20'),
        buyer: 'Star Maritime',
        seller: 'Global Fleet',
        source: 'Clarksons SIN',
        verified: true,
        createdAt: new Date('2025-10-21'),
      },
      {
        id: 'sale-3',
        vesselName: 'MV OCEAN VOYAGER',
        vesselType: 'bulk_carrier',
        dwt: 80000,
        built: 2009,
        flag: 'Marshall Islands',
        builder: 'Hyundai Samho',
        salePrice: 16900000,
        currency: 'USD',
        saleDate: new Date('2025-09-10'),
        buyer: 'Voyager Shipping',
        source: 'VesselsValue',
        verified: true,
        createdAt: new Date('2025-09-11'),
      },
    ];

    // Calculate match scores and adjustments
    const matches: ComparableMatch[] = sales.map((sale) => {
      const matchFactors = this.calculateMatchFactors(
        vesselType,
        dwt,
        built,
        sale
      );

      const matchScore = this.calculateOverallMatch(matchFactors);

      const adjustment = this.calculatePriceAdjustment(
        sale,
        dwt,
        built,
        new Date()
      );

      const adjustedPrice = sale.salePrice + adjustment;

      return {
        sale,
        matchScore,
        matchFactors,
        adjustedPrice,
        adjustment,
      };
    });

    // Sort by match score and return top matches
    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Calculate match factors between target vessel and comparable
   */
  private calculateMatchFactors(
    targetType: string,
    targetDwt: number,
    targetBuilt: number,
    sale: ComparableSale
  ): {
    typeMatch: number;
    ageMatch: number;
    sizeMatch: number;
    builderMatch: number;
    recencyMatch: number;
  } {
    // Type match (0-1)
    const typeMatch = sale.vesselType === targetType ? 1.0 : 0.7;

    // Age match (based on difference in build year)
    const ageDiff = Math.abs(targetBuilt - sale.built);
    const ageMatch = Math.max(0, 1 - ageDiff * 0.1); // Penalty 0.1 per year diff

    // Size match (based on DWT difference)
    const sizeDiff = Math.abs(targetDwt - sale.dwt) / targetDwt;
    const sizeMatch = Math.max(0, 1 - sizeDiff * 2); // Penalty for size variance

    // Builder match (premium builders: HHI, DSME, SHI)
    const premiumBuilders = ['Hyundai Heavy Industries', 'DSME', 'Samsung Heavy Industries'];
    const builderMatch = premiumBuilders.includes(sale.builder) ? 1.0 : 0.8;

    // Recency match (more recent = better)
    const monthsSinceSale = (Date.now() - sale.saleDate.getTime()) / (30 * 24 * 60 * 60 * 1000);
    const recencyMatch = Math.max(0, 1 - monthsSinceSale * 0.05); // Penalty 0.05 per month

    return {
      typeMatch,
      ageMatch,
      sizeMatch,
      builderMatch,
      recencyMatch,
    };
  }

  /**
   * Calculate overall match score (weighted average)
   */
  private calculateOverallMatch(factors: {
    typeMatch: number;
    ageMatch: number;
    sizeMatch: number;
    builderMatch: number;
    recencyMatch: number;
  }): number {
    const weights = {
      typeMatch: 0.25,
      ageMatch: 0.25,
      sizeMatch: 0.25,
      builderMatch: 0.10,
      recencyMatch: 0.15,
    };

    return (
      factors.typeMatch * weights.typeMatch +
      factors.ageMatch * weights.ageMatch +
      factors.sizeMatch * weights.sizeMatch +
      factors.builderMatch * weights.builderMatch +
      factors.recencyMatch * weights.recencyMatch
    );
  }

  /**
   * Calculate price adjustment based on differences
   */
  private calculatePriceAdjustment(
    sale: ComparableSale,
    targetDwt: number,
    targetBuilt: number,
    targetDate: Date
  ): number {
    let adjustment = 0;

    // Size adjustment (linear interpolation)
    const dwtDiff = targetDwt - sale.dwt;
    const pricePerDwt = sale.salePrice / sale.dwt;
    adjustment += dwtDiff * pricePerDwt;

    // Age adjustment (depreciation ~3% per year)
    const ageDiff = targetBuilt - sale.built;
    adjustment += ageDiff * sale.salePrice * 0.03;

    // Time adjustment (market appreciation ~2% per year)
    const yearsSinceSale = (targetDate.getTime() - sale.saleDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
    adjustment += yearsSinceSale * sale.salePrice * 0.02;

    return Math.round(adjustment);
  }

  /**
   * Get price index for vessel type
   */
  async getPriceIndex(
    vesselType: string,
    period: 'month' | 'quarter' | 'year'
  ): Promise<PriceIndex[]> {
    // In production: Aggregate sales by period
    // const sales = await prisma.comparableSale.groupBy({
    //   by: ['vesselType'],
    //   where: { vesselType },
    //   _avg: { salePrice: true },
    //   _count: true,
    // });

    // Simulated price index
    return [
      {
        vesselType,
        period: 'Q4 2025',
        averagePrice: 18200000,
        medianPrice: 17900000,
        transactionCount: 8,
        priceChange: 500000,
        priceChangePercent: 2.8,
      },
      {
        vesselType,
        period: 'Q3 2025',
        averagePrice: 17700000,
        medianPrice: 17500000,
        transactionCount: 12,
        priceChange: -300000,
        priceChangePercent: -1.7,
      },
      {
        vesselType,
        period: 'Q2 2025',
        averagePrice: 18000000,
        medianPrice: 17800000,
        transactionCount: 10,
        priceChange: 800000,
        priceChangePercent: 4.7,
      },
    ];
  }

  /**
   * Auto-populate from market report (email parsing)
   */
  async importFromMarketReport(
    reportText: string,
    source: string
  ): Promise<{ imported: number; failed: number }> {
    // In production: Use LLM to extract sales from market report
    // const llm = new LLMService();
    // const prompt = `Extract S&P transactions from this market report: ${reportText}`;
    // const extracted = await llm.extractJSON(prompt);

    // Simulated extraction
    const sales = [
      {
        vesselName: 'MV EXAMPLE',
        vesselType: 'bulk_carrier',
        dwt: 82000,
        built: 2010,
        flag: 'Panama',
        builder: 'HHI',
        salePrice: 18500000,
        currency: 'USD',
        saleDate: new Date(),
        source,
        verified: false,
      },
    ];

    let imported = 0;
    let failed = 0;

    for (const sale of sales) {
      try {
        await this.addSale(sale);
        imported++;
      } catch (error) {
        failed++;
      }
    }

    return { imported, failed };
  }

  /**
   * Verify comparable sale (manual quality check)
   */
  async verifySale(saleId: string, verified: boolean, notes?: string): Promise<void> {
    // In production: Update verification status
    // await prisma.comparableSale.update({
    //   where: { id: saleId },
    //   data: { verified, notes },
    // });

    console.log(`Sale ${saleId} verification status updated to ${verified}`);
  }

  /**
   * Get market statistics
   */
  async getMarketStatistics(
    vesselType: string,
    months: number = 12
  ): Promise<{
    totalSales: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    avgAge: number;
    avgDwt: number;
    topBuyers: { name: string; count: number }[];
    priceByAge: { age: number; avgPrice: number }[];
  }> {
    // In production: Aggregate actual sales data
    return {
      totalSales: 42,
      averagePrice: 17800000,
      priceRange: { min: 14500000, max: 21200000 },
      avgAge: 12.5,
      avgDwt: 81200,
      topBuyers: [
        { name: 'Pacific Shipping', count: 5 },
        { name: 'Star Maritime', count: 4 },
        { name: 'Global Fleet', count: 3 },
      ],
      priceByAge: [
        { age: 5, avgPrice: 25000000 },
        { age: 10, avgPrice: 19500000 },
        { age: 15, avgPrice: 14200000 },
        { age: 20, avgPrice: 9800000 },
      ],
    };
  }

  /**
   * Get related vessel types for comparison
   */
  private getRelatedTypes(vesselType: string): string[] {
    const relatedTypes: Record<string, string[]> = {
      bulk_carrier: ['bulk_carrier', 'geared_bulker', 'supramax', 'panamax', 'capesize'],
      tanker: ['tanker', 'aframax', 'suezmax', 'vlcc', 'product_tanker'],
      container: ['container', 'feeder', 'panamax_container', 'post_panamax'],
    };

    return relatedTypes[vesselType] || [vesselType];
  }
}

export const comparableSalesDBService = new ComparableSalesDBService();
