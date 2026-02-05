/**
 * Baltic Index Integration Service
 * Track and analyze dry bulk freight indices
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type BalticIndexType = 'BDI' | 'BCI' | 'BPI' | 'BSI' | 'BHSI';

export interface BalticIndexData {
  indexType: BalticIndexType;
  date: Date;
  value: number;
  change: number; // points
  changePercent: number;
  high52Week: number;
  low52Week: number;
  average52Week: number;
}

export interface IndexHistoricalData {
  indexType: BalticIndexType;
  data: Array<{
    date: Date;
    value: number;
  }>;
  stats: {
    min: number;
    max: number;
    average: number;
    volatility: number; // standard deviation
    trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  };
}

export interface MarketSentiment {
  overall: 'STRONG_BULL' | 'BULL' | 'NEUTRAL' | 'BEAR' | 'STRONG_BEAR';
  score: number; // -100 to +100
  indicators: {
    bdiTrend: 'UP' | 'DOWN' | 'FLAT';
    volatility: 'LOW' | 'MEDIUM' | 'HIGH';
    momentum: number; // RSI-like indicator 0-100
    seasonality: 'FAVORABLE' | 'UNFAVORABLE' | 'NEUTRAL';
  };
  signals: Array<{
    type: 'BUY' | 'SELL' | 'HOLD';
    strength: 'STRONG' | 'WEAK';
    reason: string;
  }>;
}

export interface RouteComparison {
  routeName: string;
  indexType: BalticIndexType;
  currentRate: number; // USD/day or USD/ton
  historicalAverage: number;
  deviation: number; // percent from average
  recommendation: 'FAVORABLE' | 'UNFAVORABLE' | 'NEUTRAL';
}

export class BalticIndexService {
  /**
   * Get current Baltic Index values
   */
  async getCurrentIndices(): Promise<BalticIndexData[]> {
    const indices: BalticIndexType[] = ['BDI', 'BCI', 'BPI', 'BSI', 'BHSI'];
    const results = [];

    for (const indexType of indices) {
      const latest = await prisma.balticIndex.findFirst({
        where: { indexType },
        orderBy: { date: 'desc' },
      });

      if (latest) {
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);

        const historical = await prisma.balticIndex.findMany({
          where: {
            indexType,
            date: { gte: yearAgo },
          },
          select: { value: true },
        });

        const values = historical.map((h) => h.value);
        const high52Week = Math.max(...values);
        const low52Week = Math.min(...values);
        const average52Week = values.reduce((a, b) => a + b, 0) / values.length;

        results.push({
          indexType,
          date: latest.date,
          value: latest.value,
          change: latest.change || 0,
          changePercent: latest.changePercent || 0,
          high52Week,
          low52Week,
          average52Week,
        });
      }
    }

    return results;
  }

  /**
   * Get historical data for an index
   */
  async getHistoricalData(
    indexType: BalticIndexType,
    days: number = 365
  ): Promise<IndexHistoricalData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await prisma.balticIndex.findMany({
      where: {
        indexType,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    const data = records.map((r) => ({
      date: r.date,
      value: r.value,
    }));

    // Calculate statistics
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    // Volatility (standard deviation)
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const volatility = Math.sqrt(variance);

    // Trend (compare first half vs second half)
    const midpoint = Math.floor(values.length / 2);
    const firstHalfAvg = values.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
    const secondHalfAvg = values.slice(midpoint).reduce((a, b) => a + b, 0) / (values.length - midpoint);

    let trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS';
    const trendStrength = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    if (trendStrength > 10) trend = 'BULLISH';
    else if (trendStrength < -10) trend = 'BEARISH';

    return {
      indexType,
      data,
      stats: {
        min,
        max,
        average,
        volatility,
        trend,
      },
    };
  }

  /**
   * Analyze market sentiment based on Baltic indices
   */
  async analyzeMarketSentiment(): Promise<MarketSentiment> {
    const bdiData = await this.getHistoricalData('BDI', 90);
    const currentBDI = bdiData.data[bdiData.data.length - 1]?.value || 0;
    const avgBDI = bdiData.stats.average;

    // Calculate momentum (RSI-like)
    const momentum = this.calculateRSI(bdiData.data.map((d) => d.value), 14);

    // Determine BDI trend
    const recentValues = bdiData.data.slice(-30).map((d) => d.value);
    const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const bdiTrend = currentBDI > recentAvg * 1.05 ? 'UP' : currentBDI < recentAvg * 0.95 ? 'DOWN' : 'FLAT';

    // Determine volatility level
    const volatilityPercent = (bdiData.stats.volatility / avgBDI) * 100;
    const volatility = volatilityPercent > 20 ? 'HIGH' : volatilityPercent > 10 ? 'MEDIUM' : 'LOW';

    // Seasonality (simplified - check month)
    const currentMonth = new Date().getMonth();
    const seasonality = currentMonth >= 8 && currentMonth <= 11 ? 'FAVORABLE' : 'NEUTRAL'; // Q4 traditionally strong

    // Calculate overall score (-100 to +100)
    let score = 0;
    if (currentBDI > avgBDI) score += 30;
    else if (currentBDI < avgBDI) score -= 30;

    if (bdiTrend === 'UP') score += 25;
    else if (bdiTrend === 'DOWN') score -= 25;

    if (momentum > 70) score += 20; // Overbought
    else if (momentum < 30) score += 20; // Oversold (contrarian)
    else if (momentum > 50) score += 10;
    else score -= 10;

    if (bdiData.stats.trend === 'BULLISH') score += 15;
    else if (bdiData.stats.trend === 'BEARISH') score -= 15;

    if (seasonality === 'FAVORABLE') score += 10;

    // Determine overall sentiment
    let overall: MarketSentiment['overall'];
    if (score > 60) overall = 'STRONG_BULL';
    else if (score > 20) overall = 'BULL';
    else if (score > -20) overall = 'NEUTRAL';
    else if (score > -60) overall = 'BEAR';
    else overall = 'STRONG_BEAR';

    // Generate signals
    const signals: MarketSentiment['signals'] = [];

    if (momentum > 70 && bdiTrend === 'UP') {
      signals.push({
        type: 'SELL',
        strength: 'WEAK',
        reason: 'Market overbought - consider locking in rates',
      });
    } else if (momentum < 30 && bdiTrend === 'DOWN') {
      signals.push({
        type: 'BUY',
        strength: 'STRONG',
        reason: 'Market oversold - favorable entry point for coverage',
      });
    } else if (bdiData.stats.trend === 'BULLISH' && currentBDI < avgBDI * 1.1) {
      signals.push({
        type: 'BUY',
        strength: 'STRONG',
        reason: 'Uptrend intact, price below resistance',
      });
    } else if (bdiData.stats.trend === 'BEARISH') {
      signals.push({
        type: 'HOLD',
        strength: 'WEAK',
        reason: 'Downtrend active - wait for reversal confirmation',
      });
    }

    return {
      overall,
      score,
      indicators: {
        bdiTrend,
        volatility,
        momentum,
        seasonality,
      },
      signals,
    };
  }

  /**
   * Compare route rates vs Baltic indices
   */
  async compareRoutesToIndices(): Promise<RouteComparison[]> {
    // Major Baltic routes mapped to indices
    const routes = [
      {
        name: 'Transatlantic (Capesize)',
        indexType: 'BCI' as BalticIndexType,
        description: 'Brazil → China (iron ore)',
      },
      {
        name: 'Transpacific (Panamax)',
        indexType: 'BPI' as BalticIndexType,
        description: 'Australia → China (coal)',
      },
      {
        name: 'US Gulf → Far East (Supramax)',
        indexType: 'BSI' as BalticIndexType,
        description: 'Grain routes',
      },
      {
        name: 'Continent → Far East (Handysize)',
        indexType: 'BHSI' as BalticIndexType,
        description: 'Minor bulk routes',
      },
    ];

    const comparisons: RouteComparison[] = [];

    for (const route of routes) {
      const historicalData = await this.getHistoricalData(route.indexType, 365);
      const currentRate = historicalData.data[historicalData.data.length - 1]?.value || 0;
      const historicalAverage = historicalData.stats.average;
      const deviation = ((currentRate - historicalAverage) / historicalAverage) * 100;

      let recommendation: 'FAVORABLE' | 'UNFAVORABLE' | 'NEUTRAL';
      if (deviation < -10) recommendation = 'FAVORABLE'; // Below average = good for charterers
      else if (deviation > 10) recommendation = 'UNFAVORABLE';
      else recommendation = 'NEUTRAL';

      comparisons.push({
        routeName: route.name,
        indexType: route.indexType,
        currentRate,
        historicalAverage,
        deviation,
        recommendation,
      });
    }

    return comparisons;
  }

  /**
   * Seed Baltic Index data (for demo)
   */
  async seedBalticData(): Promise<void> {
    const today = new Date();
    const indices: BalticIndexType[] = ['BDI', 'BCI', 'BPI', 'BSI', 'BHSI'];
    const baseValues = { BDI: 1500, BCI: 2000, BPI: 1200, BSI: 1000, BHSI: 800 };

    for (let i = 365; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      for (const indexType of indices) {
        const baseValue = baseValues[indexType];
        // Add some randomness + trend
        const trend = i > 180 ? 1.1 : 0.9; // Uptrend in last 6 months
        const value = Math.round(baseValue * trend + (Math.random() - 0.5) * baseValue * 0.1);
        const change = Math.round((Math.random() - 0.5) * 50);
        const changePercent = (change / value) * 100;

        await prisma.balticIndex.upsert({
          where: {
            indexType_date: {
              indexType,
              date,
            },
          },
          create: {
            indexType,
            date,
            value,
            change,
            changePercent,
          },
          update: {},
        });
      }
    }

    console.log(`✅ Seeded 365 days of Baltic Index data for 5 indices`);
  }

  /**
   * Get index correlation matrix
   */
  async getIndexCorrelations(): Promise<Record<string, Record<string, number>>> {
    const indices: BalticIndexType[] = ['BDI', 'BCI', 'BPI', 'BSI', 'BHSI'];
    const historicalData: Record<string, number[]> = {};

    // Get last 90 days of data for each index
    for (const indexType of indices) {
      const data = await this.getHistoricalData(indexType, 90);
      historicalData[indexType] = data.data.map((d) => d.value);
    }

    // Calculate correlation matrix
    const correlations: Record<string, Record<string, number>> = {};

    for (const index1 of indices) {
      correlations[index1] = {};
      for (const index2 of indices) {
        if (index1 === index2) {
          correlations[index1][index2] = 1.0;
        } else {
          const corr = this.calculateCorrelation(
            historicalData[index1],
            historicalData[index2]
          );
          correlations[index1][index2] = corr;
        }
      }
    }

    return correlations;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private calculateRSI(values: number[], period: number = 14): number {
    if (values.length < period + 1) return 50; // Not enough data

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
      const diff = values[i] - values[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI using smoothed averages
    for (let i = period + 1; i < values.length; i++) {
      const diff = values[i] - values[i - 1];
      if (diff > 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - diff) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return Math.round(rsi * 100) / 100;
  }

  private calculateCorrelation(values1: number[], values2: number[]): number {
    const n = Math.min(values1.length, values2.length);
    if (n === 0) return 0;

    const mean1 = values1.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const mean2 = values2.slice(0, n).reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }

    const denominator = Math.sqrt(sum1Sq * sum2Sq);
    if (denominator === 0) return 0;

    return Math.round((numerator / denominator) * 100) / 100;
  }
}

export const balticIndexService = new BalticIndexService();
