// price-predictor.ts — AI-Powered Freight Rate Price Prediction

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

interface PredictionInput {
  route?: string;
  cargoType?: string;
  vesselType?: string;
  vesselDwt?: number;
  loadPort?: string;
  dischargePort?: string;
  targetDate?: Date;
  organizationId: string;
}

interface PredictionResult {
  predictedRate: number;
  confidence: number;              // 0-1
  range: {
    low: number;                   // 10th percentile
    mid: number;                   // 50th percentile (median)
    high: number;                  // 90th percentile
  };
  trend: 'bullish' | 'bearish' | 'stable';
  factors: {
    historical: number;            // Historical average influence
    seasonal: number;              // Seasonal factor (-20% to +20%)
    trend: number;                 // Trend factor
    market: number;                // Market sentiment factor
  };
  historicalData: {
    samples: number;
    avgRate: number;
    minRate: number;
    maxRate: number;
    stdDev: number;
  };
  seasonality?: {
    currentMonth: number;          // 1-12
    monthFactor: number;           // Multiplier (0.8 - 1.2)
    peakMonths: number[];
    lowMonths: number[];
  };
  marketConditions: {
    supplyDemand: 'tight' | 'balanced' | 'oversupplied';
    sentiment: 'positive' | 'neutral' | 'negative';
    volatility: 'low' | 'medium' | 'high';
  };
  recommendations: string[];
  reasoning: string;
}

interface SeasonalityPattern {
  month: number;
  avgRate: number;
  sampleSize: number;
  factor: number;                  // Relative to annual average
}

export class PricePredictor {
  /**
   * Predict freight rate for given parameters
   */
  async predictRate(input: PredictionInput): Promise<PredictionResult> {
    // 1. Get historical data
    const historicalRates = await this.getHistoricalRates(input);

    if (historicalRates.length === 0) {
      return this.fallbackPrediction(input);
    }

    // 2. Calculate base statistics
    const stats = this.calculateStatistics(historicalRates);

    // 3. Analyze seasonality
    const seasonality = this.analyzeSeasonality(historicalRates, input.targetDate);

    // 4. Calculate trend
    const trendAnalysis = this.calculateTrend(historicalRates);

    // 5. Assess market conditions
    const marketConditions = this.assessMarketConditions(historicalRates);

    // 6. Apply prediction model
    const prediction = this.applyPredictionModel(
      stats,
      seasonality,
      trendAnalysis,
      marketConditions,
      input
    );

    // 7. Generate recommendations
    const recommendations = this.generateRecommendations(prediction, marketConditions, trendAnalysis);

    // 8. Generate reasoning
    const reasoning = this.generateReasoning(prediction, stats, seasonality, trendAnalysis);

    return {
      ...prediction,
      historicalData: stats,
      seasonality,
      marketConditions,
      recommendations,
      reasoning,
    };
  }

  /**
   * Get historical freight rates matching criteria
   */
  private async getHistoricalRates(input: PredictionInput): Promise<Array<{ rate: number; date: Date }>> {
    const where: any = {
      organizationId: input.organizationId,
      status: { in: ['approved', 'completed'] },
      freightRate: { not: null },
    };

    // Route matching
    if (input.route) {
      where.OR = [
        { route: { contains: input.route, mode: 'insensitive' } },
        {
          AND: [
            { loadPort: { contains: input.loadPort || '', mode: 'insensitive' } },
            { dischargePort: { contains: input.dischargePort || '', mode: 'insensitive' } },
          ],
        },
      ];
    } else if (input.loadPort && input.dischargePort) {
      where.loadPort = { contains: input.loadPort, mode: 'insensitive' };
      where.dischargePort = { contains: input.dischargePort, mode: 'insensitive' };
    }

    // Cargo type
    if (input.cargoType) {
      where.cargoType = { contains: input.cargoType, mode: 'insensitive' };
    }

    // Vessel type/size
    if (input.vesselType) {
      where.vesselType = input.vesselType;
    }

    // Get last 2 years of data
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    where.laycanFrom = { gte: twoYearsAgo };

    const charters = await prisma.charter.findMany({
      where,
      select: {
        freightRate: true,
        laycanFrom: true,
      },
      orderBy: { laycanFrom: 'asc' },
    });

    return charters
      .filter((c) => c.freightRate !== null && c.laycanFrom !== null)
      .map((c) => ({
        rate: c.freightRate!,
        date: c.laycanFrom!,
      }));
  }

  /**
   * Calculate statistical measures
   */
  private calculateStatistics(rates: Array<{ rate: number; date: Date }>): PredictionResult['historicalData'] {
    const rateValues = rates.map((r) => r.rate);

    const avgRate = rateValues.reduce((a, b) => a + b, 0) / rateValues.length;
    const minRate = Math.min(...rateValues);
    const maxRate = Math.max(...rateValues);

    // Standard deviation
    const variance = rateValues.reduce((sum, r) => sum + Math.pow(r - avgRate, 2), 0) / rateValues.length;
    const stdDev = Math.sqrt(variance);

    return {
      samples: rates.length,
      avgRate: Math.round(avgRate * 100) / 100,
      minRate: Math.round(minRate * 100) / 100,
      maxRate: Math.round(maxRate * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
    };
  }

  /**
   * Analyze seasonality patterns
   */
  private analyzeSeasonality(
    rates: Array<{ rate: number; date: Date }>,
    targetDate?: Date
  ): PredictionResult['seasonality'] {
    // Group rates by month
    const monthlyRates: Record<number, number[]> = {};
    for (let i = 1; i <= 12; i++) {
      monthlyRates[i] = [];
    }

    for (const { rate, date } of rates) {
      const month = date.getMonth() + 1;
      monthlyRates[month].push(rate);
    }

    // Calculate monthly averages
    const monthlyAvg: SeasonalityPattern[] = [];
    const annualAvg =
      rates.reduce((sum, r) => sum + r.rate, 0) / rates.length;

    for (let month = 1; month <= 12; month++) {
      const monthRates = monthlyRates[month];
      if (monthRates.length > 0) {
        const avg = monthRates.reduce((a, b) => a + b, 0) / monthRates.length;
        monthlyAvg.push({
          month,
          avgRate: Math.round(avg * 100) / 100,
          sampleSize: monthRates.length,
          factor: Math.round((avg / annualAvg) * 100) / 100,
        });
      }
    }

    // Identify peak and low months
    const sortedMonths = [...monthlyAvg].sort((a, b) => b.factor - a.factor);
    const peakMonths = sortedMonths.slice(0, 3).map((m) => m.month);
    const lowMonths = sortedMonths.slice(-3).map((m) => m.month);

    // Current month factor
    const currentMonth = targetDate ? targetDate.getMonth() + 1 : new Date().getMonth() + 1;
    const currentMonthData = monthlyAvg.find((m) => m.month === currentMonth);
    const monthFactor = currentMonthData?.factor || 1.0;

    return {
      currentMonth,
      monthFactor,
      peakMonths,
      lowMonths,
    };
  }

  /**
   * Calculate trend using linear regression
   */
  private calculateTrend(rates: Array<{ rate: number; date: Date }>): {
    slope: number;
    direction: 'bullish' | 'bearish' | 'stable';
    strength: number;
  } {
    if (rates.length < 5) {
      return { slope: 0, direction: 'stable', strength: 0 };
    }

    // Convert dates to numeric (days since first date)
    const firstDate = rates[0].date.getTime();
    const dataPoints = rates.map((r) => ({
      x: (r.date.getTime() - firstDate) / (24 * 60 * 60 * 1000), // Days
      y: r.rate,
    }));

    // Simple linear regression: y = mx + b
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((s, p) => s + p.x, 0);
    const sumY = dataPoints.reduce((s, p) => s + p.y, 0);
    const sumXY = dataPoints.reduce((s, p) => s + p.x * p.y, 0);
    const sumXX = dataPoints.reduce((s, p) => s + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Determine direction and strength
    const avgRate = sumY / n;
    const rateChangePerDay = slope;
    const rateChangePer30Days = rateChangePerDay * 30;
    const percentChange = (rateChangePer30Days / avgRate) * 100;

    let direction: 'bullish' | 'bearish' | 'stable';
    if (percentChange > 2) direction = 'bullish';
    else if (percentChange < -2) direction = 'bearish';
    else direction = 'stable';

    const strength = Math.min(100, Math.abs(percentChange) * 10); // 0-100

    return {
      slope: Math.round(slope * 1000) / 1000,
      direction,
      strength: Math.round(strength),
    };
  }

  /**
   * Assess current market conditions
   */
  private assessMarketConditions(rates: Array<{ rate: number; date: Date }>): PredictionResult['marketConditions'] {
    // Recent vs historical comparison (last 30 days vs rest)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentRates = rates.filter((r) => r.date.getTime() >= thirtyDaysAgo).map((r) => r.rate);
    const historicalRates = rates.filter((r) => r.date.getTime() < thirtyDaysAgo).map((r) => r.rate);

    if (recentRates.length === 0 || historicalRates.length === 0) {
      return {
        supplyDemand: 'balanced',
        sentiment: 'neutral',
        volatility: 'medium',
      };
    }

    const recentAvg = recentRates.reduce((a, b) => a + b, 0) / recentRates.length;
    const historicalAvg = historicalRates.reduce((a, b) => a + b, 0) / historicalRates.length;
    const change = ((recentAvg - historicalAvg) / historicalAvg) * 100;

    // Supply-demand balance
    let supplyDemand: 'tight' | 'balanced' | 'oversupplied';
    if (change > 10) supplyDemand = 'tight'; // Prices rising = tight supply
    else if (change < -10) supplyDemand = 'oversupplied';
    else supplyDemand = 'balanced';

    // Sentiment
    let sentiment: 'positive' | 'neutral' | 'negative';
    if (change > 5) sentiment = 'positive';
    else if (change < -5) sentiment = 'negative';
    else sentiment = 'neutral';

    // Volatility (coefficient of variation for recent rates)
    const recentStdDev = Math.sqrt(
      recentRates.reduce((sum, r) => sum + Math.pow(r - recentAvg, 2), 0) / recentRates.length
    );
    const cv = recentStdDev / recentAvg;

    let volatility: 'low' | 'medium' | 'high';
    if (cv < 0.05) volatility = 'low';
    else if (cv < 0.15) volatility = 'medium';
    else volatility = 'high';

    return { supplyDemand, sentiment, volatility };
  }

  /**
   * Apply prediction model (weighted combination of factors)
   */
  private applyPredictionModel(
    stats: PredictionResult['historicalData'],
    seasonality: PredictionResult['seasonality'],
    trendAnalysis: { slope: number; direction: string; strength: number },
    marketConditions: PredictionResult['marketConditions'],
    input: PredictionInput
  ): Omit<PredictionResult, 'historicalData' | 'seasonality' | 'marketConditions' | 'recommendations' | 'reasoning'> {
    // Base: Historical average
    let predictedRate = stats.avgRate;
    const factors = {
      historical: 1.0,
      seasonal: seasonality?.monthFactor || 1.0,
      trend: 1.0,
      market: 1.0,
    };

    // Apply seasonal adjustment
    if (seasonality) {
      predictedRate *= seasonality.monthFactor;
      factors.seasonal = seasonality.monthFactor;
    }

    // Apply trend (extrapolate 30 days forward)
    const trendAdjustment = trendAnalysis.slope * 30;
    predictedRate += trendAdjustment;
    factors.trend = 1 + trendAdjustment / stats.avgRate;

    // Apply market sentiment
    let marketAdjustment = 0;
    if (marketConditions.sentiment === 'positive') marketAdjustment = 0.05; // +5%
    else if (marketConditions.sentiment === 'negative') marketAdjustment = -0.05; // -5%

    if (marketConditions.supplyDemand === 'tight') marketAdjustment += 0.03; // +3%
    else if (marketConditions.supplyDemand === 'oversupplied') marketAdjustment -= 0.03; // -3%

    predictedRate *= 1 + marketAdjustment;
    factors.market = 1 + marketAdjustment;

    // Calculate prediction range (using standard deviation)
    const range = {
      low: Math.round((predictedRate - stats.stdDev * 1.28) * 100) / 100, // 10th percentile
      mid: Math.round(predictedRate * 100) / 100,
      high: Math.round((predictedRate + stats.stdDev * 1.28) * 100) / 100, // 90th percentile
    };

    // Confidence (based on sample size and volatility)
    let confidence = 0.5; // Base confidence
    if (stats.samples >= 50) confidence += 0.2;
    else if (stats.samples >= 20) confidence += 0.1;
    else if (stats.samples >= 10) confidence += 0.05;

    if (marketConditions.volatility === 'low') confidence += 0.15;
    else if (marketConditions.volatility === 'high') confidence -= 0.15;

    confidence = Math.max(0.2, Math.min(0.95, confidence)); // Clamp to 20%-95%

    return {
      predictedRate: Math.round(predictedRate * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      range,
      trend: trendAnalysis.direction as 'bullish' | 'bearish' | 'stable',
      factors: {
        historical: Math.round(factors.historical * 100) / 100,
        seasonal: Math.round(factors.seasonal * 100) / 100,
        trend: Math.round(factors.trend * 100) / 100,
        market: Math.round(factors.market * 100) / 100,
      },
    };
  }

  /**
   * Generate recommendations based on prediction
   */
  private generateRecommendations(
    prediction: any,
    marketConditions: PredictionResult['marketConditions'],
    trendAnalysis: { direction: string; strength: number }
  ): string[] {
    const recommendations: string[] = [];

    // Market timing
    if (prediction.trend === 'bullish' && trendAnalysis.strength > 50) {
      recommendations.push('Consider fixing soon - market trending upward strongly');
    } else if (prediction.trend === 'bearish' && trendAnalysis.strength > 50) {
      recommendations.push('Consider waiting - market trending downward');
    } else if (prediction.trend === 'stable') {
      recommendations.push('Market stable - reasonable time to fix');
    }

    // Confidence-based
    if (prediction.confidence > 0.8) {
      recommendations.push(`High confidence (${(prediction.confidence * 100).toFixed(0)}%) - prediction reliable`);
    } else if (prediction.confidence < 0.5) {
      recommendations.push(
        `Low confidence (${(prediction.confidence * 100).toFixed(0)}%) - limited historical data, use caution`
      );
    }

    // Supply-demand
    if (marketConditions.supplyDemand === 'tight') {
      recommendations.push('Tight supply conditions - expect firm rates');
    } else if (marketConditions.supplyDemand === 'oversupplied') {
      recommendations.push('Oversupplied market - negotiate aggressively');
    }

    // Volatility
    if (marketConditions.volatility === 'high') {
      recommendations.push('High volatility - consider fixing for certainty');
    }

    // Range guidance
    const rangeWidth = prediction.range.high - prediction.range.low;
    const midPoint = prediction.range.mid;
    const rangePercent = (rangeWidth / midPoint) * 100;

    if (rangePercent > 30) {
      recommendations.push(`Wide prediction range (${rangePercent.toFixed(0)}%) - market uncertain`);
    }

    return recommendations;
  }

  /**
   * Generate reasoning explanation
   */
  private generateReasoning(
    prediction: any,
    stats: PredictionResult['historicalData'],
    seasonality: PredictionResult['seasonality'],
    trendAnalysis: { direction: string; strength: number }
  ): string {
    const parts: string[] = [];

    parts.push(`Based on ${stats.samples} historical fixtures, average rate ${stats.avgRate} USD/MT`);

    if (seasonality) {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const currentMonthName = monthNames[seasonality.currentMonth - 1];
      const seasonalEffect = ((seasonality.monthFactor - 1) * 100).toFixed(1);
      const direction = parseFloat(seasonalEffect) > 0 ? 'above' : 'below';

      parts.push(
        `${currentMonthName} seasonal factor ${Math.abs(parseFloat(seasonalEffect))}% ${direction} annual average`
      );
    }

    if (trendAnalysis.direction !== 'stable') {
      parts.push(
        `${trendAnalysis.direction === 'bullish' ? 'Upward' : 'Downward'} trend detected (strength ${trendAnalysis.strength}/100)`
      );
    }

    parts.push(`Predicted rate ${prediction.predictedRate} USD/MT (range ${prediction.range.low}-${prediction.range.high})`);

    parts.push(`Confidence ${(prediction.confidence * 100).toFixed(0)}%`);

    return parts.join('. ') + '.';
  }

  /**
   * Fallback prediction when no historical data
   */
  private fallbackPrediction(input: PredictionInput): PredictionResult {
    // Use industry benchmarks as fallback
    const benchmarkRates: Record<string, number> = {
      grain: 30,
      coal: 25,
      iron_ore: 20,
      fertilizer: 28,
      container: 150,
      crude_oil: 40,
      lpg: 45,
      general_cargo: 35,
    };

    const cargoKey = Object.keys(benchmarkRates).find((key) =>
      input.cargoType?.toLowerCase().includes(key)
    );
    const baseRate = cargoKey ? benchmarkRates[cargoKey] : 30;

    return {
      predictedRate: baseRate,
      confidence: 0.3,
      range: {
        low: baseRate * 0.8,
        mid: baseRate,
        high: baseRate * 1.2,
      },
      trend: 'stable',
      factors: {
        historical: 1.0,
        seasonal: 1.0,
        trend: 1.0,
        market: 1.0,
      },
      historicalData: {
        samples: 0,
        avgRate: baseRate,
        minRate: baseRate * 0.8,
        maxRate: baseRate * 1.2,
        stdDev: baseRate * 0.1,
      },
      marketConditions: {
        supplyDemand: 'balanced',
        sentiment: 'neutral',
        volatility: 'medium',
      },
      recommendations: [
        'No historical data available - using industry benchmarks',
        'Low confidence - verify rate with brokers/market reports',
      ],
      reasoning: `No historical data for this route/cargo. Using industry benchmark of ${baseRate} USD/MT. Confidence 30%.`,
    };
  }

  /**
   * Batch predict rates for multiple inputs
   */
  async predictBatch(inputs: PredictionInput[]): Promise<Map<string, PredictionResult>> {
    const results = new Map<string, PredictionResult>();

    for (const input of inputs) {
      const key = `${input.route || input.loadPort}-${input.dischargePort}_${input.cargoType}`;
      const prediction = await this.predictRate(input);
      results.set(key, prediction);
    }

    return results;
  }

  /**
   * Get prediction accuracy metrics (for evaluation)
   */
  async evaluatePredictions(
    organizationId: string,
    daysBack: number = 90
  ): Promise<{
    totalPredictions: number;
    avgError: number;
    avgErrorPercent: number;
    withinRange: number;
  }> {
    // Get actual fixtures from the past N days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const actualFixtures = await prisma.charter.findMany({
      where: {
        organizationId,
        status: { in: ['approved', 'completed'] },
        freightRate: { not: null },
        laycanFrom: { gte: cutoffDate },
      },
      select: {
        freightRate: true,
        route: true,
        cargoType: true,
        vesselType: true,
        loadPort: true,
        dischargePort: true,
        laycanFrom: true,
      },
    });

    let totalError = 0;
    let withinRange = 0;

    for (const fixture of actualFixtures) {
      // Re-run prediction as of the fixture date
      const prediction = await this.predictRate({
        route: fixture.route || undefined,
        cargoType: fixture.cargoType || undefined,
        vesselType: fixture.vesselType || undefined,
        loadPort: fixture.loadPort || undefined,
        dischargePort: fixture.dischargePort || undefined,
        targetDate: fixture.laycanFrom || undefined,
        organizationId,
      });

      const actualRate = fixture.freightRate!;
      const error = Math.abs(actualRate - prediction.predictedRate);
      totalError += error;

      if (actualRate >= prediction.range.low && actualRate <= prediction.range.high) {
        withinRange++;
      }
    }

    const avgError = actualFixtures.length > 0 ? totalError / actualFixtures.length : 0;
    const avgActualRate =
      actualFixtures.length > 0
        ? actualFixtures.reduce((sum, f) => sum + f.freightRate!, 0) / actualFixtures.length
        : 1;
    const avgErrorPercent = (avgError / avgActualRate) * 100;

    return {
      totalPredictions: actualFixtures.length,
      avgError: Math.round(avgError * 100) / 100,
      avgErrorPercent: Math.round(avgErrorPercent * 100) / 100,
      withinRange,
    };
  }
}

export const pricePredictor = new PricePredictor();
