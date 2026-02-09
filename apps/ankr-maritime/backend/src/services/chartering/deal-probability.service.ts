/**
 * Deal Probability Scoring Service
 * AI-powered prediction of fixture success probability
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface DealProbabilityFactors {
  // Negotiation dynamics
  daysInNegotiation: number;
  offerCounterOfferCount: number;
  priceMovementPercent: number; // How much price has moved from initial
  responseTimeHours: number; // Average response time

  // Competitive landscape
  competingOffersCount: number;
  marketSupplyDemand: 'tight' | 'balanced' | 'loose';

  // Relationship history
  historicalWinRate: number; // Win rate with this counterparty (0-1)
  previousFixturesCount: number;
  lastFixtureDaysAgo: number | null;

  // Deal characteristics
  dealSizeUSD: number;
  isStandardRoute: boolean;
  hasSpecialRequirements: boolean;

  // Market conditions
  currentFreightIndex: number;
  volatilityIndex: number; // Market volatility 0-1
}

export interface DealProbabilityResult {
  probability: number; // 0-100
  confidence: number; // How confident we are in the prediction (0-1)
  stage: 'early' | 'mid' | 'late' | 'closing';
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  recommendations: string[];
  expectedClosingDays: number | null;
}

export class DealProbabilityService {
  /**
   * Calculate deal probability for a charter/fixture
   */
  async calculateProbability(
    charterId: string,
    organizationId: string
  ): Promise<DealProbabilityResult> {
    // Get charter with related data
    const charter = await prisma.charter.findFirst({
      where: {
        id: charterId,
        organizationId,
      },
      include: {
        cargo: true,
        vessel: true,
        charterer: true,
        offers: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!charter) {
      throw new Error('Charter not found');
    }

    // Extract factors
    const factors = await this.extractFactors(charter, organizationId);

    // Calculate probability using weighted scoring model
    const probability = this.calculateScore(factors);

    // Determine deal stage
    const stage = this.determineStage(factors);

    // Analyze factors
    const analysis = this.analyzeFactors(factors);

    // Generate recommendations
    const recommendations = this.generateRecommendations(factors, stage);

    // Estimate closing time
    const expectedClosingDays = this.estimateClosingTime(factors, probability);

    return {
      probability,
      confidence: this.calculateConfidence(factors),
      stage,
      factors: analysis,
      recommendations,
      expectedClosingDays,
    };
  }

  /**
   * Batch calculate probabilities for all active deals
   */
  async batchCalculateProbabilities(
    organizationId: string
  ): Promise<{ charterId: string; probability: number }[]> {
    const activeCharters = await prisma.charter.findMany({
      where: {
        organizationId,
        status: { in: ['NEGO', 'SUBJECTS'] },
      },
      select: { id: true },
    });

    const results = [];
    for (const charter of activeCharters) {
      const result = await this.calculateProbability(charter.id, organizationId);
      results.push({
        charterId: charter.id,
        probability: result.probability,
      });
    }

    return results;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async extractFactors(
    charter: any,
    organizationId: string
  ): Promise<DealProbabilityFactors> {
    const now = new Date();
    const createdDate = new Date(charter.createdAt);
    const daysInNegotiation = Math.floor(
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Count offers/counter-offers
    const offerCounterOfferCount = charter.offers?.length || 0;

    // Calculate price movement
    const offers = charter.offers || [];
    let priceMovementPercent = 0;
    if (offers.length >= 2) {
      const firstPrice = offers[0].freightRate || 0;
      const lastPrice = offers[offers.length - 1].freightRate || 0;
      if (firstPrice > 0) {
        priceMovementPercent = ((lastPrice - firstPrice) / firstPrice) * 100;
      }
    }

    // Calculate response time
    let responseTimeHours = 24; // Default
    if (offers.length >= 2) {
      const intervals = [];
      for (let i = 1; i < offers.length; i++) {
        const prev = new Date(offers[i - 1].createdAt);
        const curr = new Date(offers[i].createdAt);
        intervals.push((curr.getTime() - prev.getTime()) / (1000 * 60 * 60));
      }
      responseTimeHours = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    // Get historical win rate
    const historicalData = await this.getHistoricalWinRate(
      charter.chartererId,
      organizationId
    );

    // Market conditions (simplified - in production, fetch from market data service)
    const marketData = await this.getMarketConditions(charter.cargo?.cargoType);

    return {
      daysInNegotiation,
      offerCounterOfferCount,
      priceMovementPercent,
      responseTimeHours,
      competingOffersCount: await this.countCompetingOffers(charter),
      marketSupplyDemand: marketData.supplyDemand,
      historicalWinRate: historicalData.winRate,
      previousFixturesCount: historicalData.fixturesCount,
      lastFixtureDaysAgo: historicalData.lastFixtureDaysAgo,
      dealSizeUSD: (charter.freightRate || 0) * (charter.cargo?.quantity || 1),
      isStandardRoute: this.isStandardRoute(
        charter.cargo?.loadPort,
        charter.cargo?.dischargePort
      ),
      hasSpecialRequirements: charter.specialRequirements?.length > 0,
      currentFreightIndex: marketData.freightIndex,
      volatilityIndex: marketData.volatility,
    };
  }

  private calculateScore(factors: DealProbabilityFactors): number {
    let score = 50; // Base score

    // Negotiation dynamics (30% weight)
    if (factors.daysInNegotiation > 0 && factors.daysInNegotiation <= 7) {
      score += 10; // Sweet spot
    } else if (factors.daysInNegotiation > 14) {
      score -= 10; // Getting stale
    }

    if (factors.offerCounterOfferCount >= 3 && factors.offerCounterOfferCount <= 6) {
      score += 8; // Good engagement
    } else if (factors.offerCounterOfferCount > 10) {
      score -= 5; // Too much back-and-forth
    }

    if (Math.abs(factors.priceMovementPercent) < 5) {
      score += 12; // Prices converging
    } else if (Math.abs(factors.priceMovementPercent) > 15) {
      score -= 8; // Still far apart
    }

    if (factors.responseTimeHours < 6) {
      score += 10; // Fast responses = interest
    } else if (factors.responseTimeHours > 48) {
      score -= 15; // Slow responses = low priority
    }

    // Competitive landscape (20% weight)
    if (factors.competingOffersCount === 0) {
      score += 15; // No competition
    } else if (factors.competingOffersCount > 3) {
      score -= 10; // Tough competition
    }

    if (factors.marketSupplyDemand === 'tight') {
      score += 10; // Sellers market
    } else if (factors.marketSupplyDemand === 'loose') {
      score -= 5; // Buyers market
    }

    // Relationship history (25% weight)
    score += factors.historicalWinRate * 20; // 0-20 points based on history

    if (factors.previousFixturesCount > 0) {
      score += Math.min(factors.previousFixturesCount * 2, 10); // Up to 10 points
    }

    if (
      factors.lastFixtureDaysAgo !== null &&
      factors.lastFixtureDaysAgo < 180
    ) {
      score += 8; // Recent relationship
    }

    // Deal characteristics (15% weight)
    if (factors.isStandardRoute) {
      score += 5; // Easier to close
    }

    if (!factors.hasSpecialRequirements) {
      score += 5; // Simpler deal
    }

    // Market conditions (10% weight)
    if (factors.volatilityIndex < 0.3) {
      score += 5; // Stable market
    } else if (factors.volatilityIndex > 0.7) {
      score -= 5; // Volatile market
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private determineStage(factors: DealProbabilityFactors): string {
    if (factors.daysInNegotiation <= 2 || factors.offerCounterOfferCount <= 2) {
      return 'early';
    }
    if (
      factors.offerCounterOfferCount >= 5 &&
      Math.abs(factors.priceMovementPercent) < 8
    ) {
      return 'closing';
    }
    if (factors.daysInNegotiation > 10) {
      return 'late';
    }
    return 'mid';
  }

  private analyzeFactors(
    factors: DealProbabilityFactors
  ): { positive: string[]; negative: string[]; neutral: string[] } {
    const positive: string[] = [];
    const negative: string[] = [];
    const neutral: string[] = [];

    // Analyze each factor
    if (factors.responseTimeHours < 12) {
      positive.push(`Fast response time (${factors.responseTimeHours.toFixed(1)}h avg)`);
    } else if (factors.responseTimeHours > 24) {
      negative.push(`Slow response time (${factors.responseTimeHours.toFixed(1)}h avg)`);
    }

    if (factors.historicalWinRate > 0.5) {
      positive.push(
        `Strong relationship (${(factors.historicalWinRate * 100).toFixed(0)}% win rate)`
      );
    } else if (factors.previousFixturesCount === 0) {
      neutral.push('New counterparty (no history)');
    }

    if (factors.competingOffersCount === 0) {
      positive.push('No competing offers');
    } else if (factors.competingOffersCount > 2) {
      negative.push(`${factors.competingOffersCount} competing offers`);
    }

    if (Math.abs(factors.priceMovementPercent) < 5) {
      positive.push('Prices converging (within 5%)');
    } else if (Math.abs(factors.priceMovementPercent) > 15) {
      negative.push(`Large price gap (${factors.priceMovementPercent.toFixed(1)}%)`);
    }

    if (factors.isStandardRoute) {
      positive.push('Standard trade route');
    }

    if (factors.marketSupplyDemand === 'tight') {
      positive.push("Tight market (seller's advantage)");
    } else if (factors.marketSupplyDemand === 'loose') {
      negative.push("Loose market (buyer's advantage)");
    }

    return { positive, negative, neutral };
  }

  private generateRecommendations(
    factors: DealProbabilityFactors,
    stage: string
  ): string[] {
    const recs: string[] = [];

    if (factors.responseTimeHours > 24) {
      recs.push('Follow up - response time is slow');
    }

    if (Math.abs(factors.priceMovementPercent) > 10 && stage !== 'early') {
      recs.push('Consider bridging the price gap with creative terms');
    }

    if (factors.daysInNegotiation > 14) {
      recs.push('Deal is aging - consider setting a deadline');
    }

    if (factors.competingOffersCount > 2) {
      recs.push('Competitive situation - highlight unique value proposition');
    }

    if (stage === 'closing' && factors.offerCounterOfferCount >= 5) {
      recs.push('Deal is ripe for closing - push for commitment');
    }

    if (factors.previousFixturesCount === 0) {
      recs.push('New counterparty - consider credit check and references');
    }

    return recs;
  }

  private estimateClosingTime(
    factors: DealProbabilityFactors,
    probability: number
  ): number | null {
    if (probability < 30) return null; // Too uncertain

    let days = 7; // Base estimate

    // Adjust based on factors
    if (factors.responseTimeHours > 24) {
      days += 3; // Slow responses = longer closing
    }

    if (factors.competingOffersCount > 2) {
      days += 2; // Competition extends timeline
    }

    if (factors.historicalWinRate > 0.6) {
      days -= 2; // Good relationship accelerates
    }

    if (Math.abs(factors.priceMovementPercent) > 10) {
      days += 2; // Large gap takes time
    }

    return Math.max(1, days);
  }

  private calculateConfidence(factors: DealProbabilityFactors): number {
    // Higher confidence with more data points
    let confidence = 0.5;

    if (factors.offerCounterOfferCount >= 3) confidence += 0.15;
    if (factors.previousFixturesCount > 0) confidence += 0.2;
    if (factors.daysInNegotiation >= 3) confidence += 0.1;
    if (factors.responseTimeHours > 0) confidence += 0.05;

    return Math.min(0.95, confidence);
  }

  private async getHistoricalWinRate(
    chartererId: string,
    organizationId: string
  ): Promise<{
    winRate: number;
    fixturesCount: number;
    lastFixtureDaysAgo: number | null;
  }> {
    const fixtures = await prisma.charter.findMany({
      where: {
        organizationId,
        chartererId,
        status: { in: ['FIXED', 'FAILED'] },
      },
      select: {
        status: true,
        createdAt: true,
      },
    });

    if (fixtures.length === 0) {
      return { winRate: 0.5, fixturesCount: 0, lastFixtureDaysAgo: null };
    }

    const wins = fixtures.filter((f) => f.status === 'FIXED').length;
    const winRate = wins / fixtures.length;

    const lastFixture = fixtures.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0];
    const lastFixtureDaysAgo = Math.floor(
      (Date.now() - lastFixture.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      winRate,
      fixturesCount: fixtures.length,
      lastFixtureDaysAgo,
    };
  }

  private async countCompetingOffers(charter: any): Promise<number> {
    // In production, check for other charters with same cargo/laycan
    // For now, return random 0-3
    return Math.floor(Math.random() * 4);
  }

  private isStandardRoute(loadPort?: string, dischargePort?: string): boolean {
    if (!loadPort || !dischargePort) return false;

    const standardRoutes = [
      ['BRVIX', 'CNYTN'], // Brazil → China (iron ore)
      ['AUBUN', 'CNYTN'], // Australia → China (coal)
      ['USHOU', 'NLRTM'], // US Gulf → Rotterdam (grain)
      ['AEJEA', 'SGSIN'], // Middle East → Singapore (oil)
    ];

    return standardRoutes.some(
      ([load, discharge]) =>
        loadPort.includes(load) && dischargePort.includes(discharge)
    );
  }

  private async getMarketConditions(
    cargoType?: string
  ): Promise<{
    supplyDemand: 'tight' | 'balanced' | 'loose';
    freightIndex: number;
    volatility: number;
  }> {
    // In production, fetch from market data service
    // For now, return mock data
    return {
      supplyDemand: 'balanced',
      freightIndex: 1500,
      volatility: 0.4,
    };
  }
}

export const dealProbabilityService = new DealProbabilityService();
