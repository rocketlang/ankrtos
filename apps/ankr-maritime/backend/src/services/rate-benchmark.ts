// rate-benchmark.ts — Freight Rate Benchmarking & Market Intelligence

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RateBenchmark {
  route: string;
  cargoType: string;
  vesselType: string;
  avgRate: number;
  minRate: number;
  maxRate: number;
  medianRate: number;
  sampleSize: number;
  period: string;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

interface MarketRate {
  id: string;
  route: string;
  loadPort: string;
  dischargePort: string;
  cargoType: string;
  vesselType: string;
  vesselSize: string; // Panamax, Capesize, etc.
  rate: number;
  currency: string;
  rateType: string; // per_mt, lumpsum, per_day, worldscale
  laycan: Date;
  reportedDate: Date;
  source: string; // Baltic Exchange, internal, broker report
  status: string; // rumored, firm, fixed
}

interface RouteAnalysis {
  route: string;
  current: {
    avgRate: number;
    fixtures: number;
    lastUpdate: Date;
  };
  historical: {
    thirtyDays: { avg: number; trend: string };
    ninetyDays: { avg: number; trend: string };
    oneYear: { avg: number; trend: string };
  };
  forecast: {
    nextWeek: number;
    nextMonth: number;
    confidence: number; // 0-100%
  };
  seasonality: {
    peak: string; // month
    low: string; // month
    variance: number; // %
  };
}

export class RateBenchmarkService {
  /**
   * Get rate benchmark for a route
   */
  async getBenchmark(params: {
    route: string;
    cargoType: string;
    vesselType: string;
    period?: string; // '30d', '90d', '1y'
  }): Promise<RateBenchmark | null> {
    const { route, cargoType, vesselType, period = '30d' } = params;

    const daysBack = this.parsePeriod(period);
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Get market rates from database
    const rates = await prisma.marketRate.findMany({
      where: {
        route,
        cargoType,
        vesselType,
        reportedDate: { gte: since },
        status: { in: ['firm', 'fixed'] }, // Only confirmed rates
      },
      select: { rate: true },
    });

    if (rates.length === 0) return null;

    const rateValues = rates.map((r) => r.rate).sort((a, b) => a - b);

    // Calculate statistics
    const avgRate = rateValues.reduce((a, b) => a + b, 0) / rateValues.length;
    const minRate = rateValues[0];
    const maxRate = rateValues[rateValues.length - 1];
    const medianRate = this.getMedian(rateValues);

    // Calculate trend (compare to previous period)
    const prevPeriodStart = new Date(since.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const prevRates = await prisma.marketRate.findMany({
      where: {
        route,
        cargoType,
        vesselType,
        reportedDate: { gte: prevPeriodStart, lt: since },
        status: { in: ['firm', 'fixed'] },
      },
      select: { rate: true },
    });

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercent = 0;

    if (prevRates.length > 0) {
      const prevAvg = prevRates.reduce((a, b) => a + b.rate, 0) / prevRates.length;
      trendPercent = ((avgRate - prevAvg) / prevAvg) * 100;

      if (trendPercent > 5) trend = 'up';
      else if (trendPercent < -5) trend = 'down';
    }

    return {
      route,
      cargoType,
      vesselType,
      avgRate: Math.round(avgRate * 100) / 100,
      minRate: Math.round(minRate * 100) / 100,
      maxRate: Math.round(maxRate * 100) / 100,
      medianRate: Math.round(medianRate * 100) / 100,
      sampleSize: rates.length,
      period,
      trend,
      trendPercent: Math.round(trendPercent * 10) / 10,
    };
  }

  /**
   * Record new market rate
   */
  async recordRate(rate: Omit<MarketRate, 'id'>): Promise<string> {
    const marketRate = await prisma.marketRate.create({
      data: {
        ...rate,
        organizationId: 'public', // Public market data
      },
    });

    return marketRate.id;
  }

  /**
   * Get route analysis with forecasting
   */
  async analyzeRoute(route: string): Promise<RouteAnalysis> {
    const now = new Date();

    // Current rates (last 7 days)
    const currentRates = await prisma.marketRate.findMany({
      where: {
        route,
        reportedDate: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        status: { in: ['firm', 'fixed'] },
      },
      select: { rate: true, reportedDate: true },
      orderBy: { reportedDate: 'desc' },
    });

    const currentAvg =
      currentRates.length > 0
        ? currentRates.reduce((a, b) => a + b.rate, 0) / currentRates.length
        : 0;

    // Historical analysis
    const thirtyDay = await this.getPeriodStats(route, 30);
    const ninetyDay = await this.getPeriodStats(route, 90);
    const oneYear = await this.getPeriodStats(route, 365);

    // Simple forecast (moving average)
    const forecast = this.forecastRates(currentRates.map((r) => r.rate));

    // Seasonality analysis
    const seasonality = await this.analyzeSeasonality(route);

    return {
      route,
      current: {
        avgRate: Math.round(currentAvg * 100) / 100,
        fixtures: currentRates.length,
        lastUpdate: currentRates[0]?.reportedDate || now,
      },
      historical: {
        thirtyDays: thirtyDay,
        ninetyDays: ninetyDay,
        oneYear: oneYear,
      },
      forecast,
      seasonality,
    };
  }

  /**
   * Compare user's rate to market
   */
  async compareToMarket(params: {
    route: string;
    cargoType: string;
    vesselType: string;
    proposedRate: number;
  }): Promise<{
    proposedRate: number;
    marketAvg: number;
    marketMedian: number;
    marketMin: number;
    marketMax: number;
    percentile: number; // Where this rate falls (0-100)
    recommendation: 'excellent' | 'good' | 'fair' | 'poor';
    message: string;
  }> {
    const { route, cargoType, vesselType, proposedRate } = params;

    const benchmark = await this.getBenchmark({ route, cargoType, vesselType, period: '30d' });

    if (!benchmark) {
      return {
        proposedRate,
        marketAvg: 0,
        marketMedian: 0,
        marketMin: 0,
        marketMax: 0,
        percentile: 50,
        recommendation: 'fair',
        message: 'Insufficient market data for comparison',
      };
    }

    // Calculate percentile
    const rates = await prisma.marketRate.findMany({
      where: {
        route,
        cargoType,
        vesselType,
        reportedDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        status: { in: ['firm', 'fixed'] },
      },
      select: { rate: true },
    });

    const sortedRates = rates.map((r) => r.rate).sort((a, b) => a - b);
    const percentile = this.calculatePercentile(sortedRates, proposedRate);

    // Determine recommendation
    let recommendation: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;

    if (percentile >= 75) {
      recommendation = 'excellent';
      message = `Rate is in top 25% of market. Excellent deal! (${Math.round(percentile)}th percentile)`;
    } else if (percentile >= 50) {
      recommendation = 'good';
      message = `Rate is above market median. Good deal. (${Math.round(percentile)}th percentile)`;
    } else if (percentile >= 25) {
      recommendation = 'fair';
      message = `Rate is near market average. Fair deal. (${Math.round(percentile)}th percentile)`;
    } else {
      recommendation = 'poor';
      message = `Rate is below market average. Consider negotiating. (${Math.round(percentile)}th percentile)`;
    }

    return {
      proposedRate,
      marketAvg: benchmark.avgRate,
      marketMedian: benchmark.medianRate,
      marketMin: benchmark.minRate,
      marketMax: benchmark.maxRate,
      percentile: Math.round(percentile),
      recommendation,
      message,
    };
  }

  /**
   * Get top performing routes
   */
  async getTopRoutes(params: {
    cargoType?: string;
    vesselType?: string;
    limit?: number;
    period?: string;
  }): Promise<Array<{ route: string; avgRate: number; trend: string; fixtures: number }>> {
    const { cargoType, vesselType, limit = 10, period = '30d' } = params;

    const daysBack = this.parsePeriod(period);
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const where: any = {
      reportedDate: { gte: since },
      status: { in: ['firm', 'fixed'] },
    };

    if (cargoType) where.cargoType = cargoType;
    if (vesselType) where.vesselType = vesselType;

    const rates = await prisma.marketRate.findMany({ where });

    // Group by route
    const routeMap = new Map<string, number[]>();
    rates.forEach((rate) => {
      if (!routeMap.has(rate.route)) {
        routeMap.set(rate.route, []);
      }
      routeMap.get(rate.route)!.push(rate.rate);
    });

    // Calculate averages
    const routes = Array.from(routeMap.entries()).map(([route, ratesList]) => ({
      route,
      avgRate: ratesList.reduce((a, b) => a + b, 0) / ratesList.length,
      fixtures: ratesList.length,
      trend: 'stable', // Simplified
    }));

    // Sort by average rate (highest first)
    routes.sort((a, b) => b.avgRate - a.avgRate);

    return routes.slice(0, limit);
  }

  /**
   * Get market intelligence summary
   */
  async getMarketSummary(params: {
    cargoType?: string;
    vesselType?: string;
  }): Promise<{
    totalFixtures: number;
    avgRate: number;
    topRoute: { route: string; rate: number };
    trending: 'bullish' | 'bearish' | 'neutral';
    weekOverWeek: number; // % change
    insights: string[];
  }> {
    const { cargoType, vesselType } = params;

    const where: any = {
      reportedDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      status: { in: ['firm', 'fixed'] },
    };

    if (cargoType) where.cargoType = cargoType;
    if (vesselType) where.vesselType = vesselType;

    const thisWeek = await prisma.marketRate.findMany({ where });

    const lastWeekWhere = {
      ...where,
      reportedDate: {
        gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    };

    const lastWeek = await prisma.marketRate.findMany({ where: lastWeekWhere });

    const avgThisWeek =
      thisWeek.length > 0 ? thisWeek.reduce((a, b) => a + b.rate, 0) / thisWeek.length : 0;

    const avgLastWeek =
      lastWeek.length > 0 ? lastWeek.reduce((a, b) => a + b.rate, 0) / lastWeek.length : 0;

    const weekOverWeek = avgLastWeek > 0 ? ((avgThisWeek - avgLastWeek) / avgLastWeek) * 100 : 0;

    let trending: 'bullish' | 'bearish' | 'neutral';
    if (weekOverWeek > 5) trending = 'bullish';
    else if (weekOverWeek < -5) trending = 'bearish';
    else trending = 'neutral';

    // Find top route
    const routeRates = new Map<string, number[]>();
    thisWeek.forEach((rate) => {
      if (!routeRates.has(rate.route)) routeRates.set(rate.route, []);
      routeRates.get(rate.route)!.push(rate.rate);
    });

    let topRoute = { route: 'N/A', rate: 0 };
    routeRates.forEach((rates, route) => {
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
      if (avg > topRoute.rate) {
        topRoute = { route, rate: avg };
      }
    });

    // Generate insights
    const insights: string[] = [];
    if (weekOverWeek > 10) {
      insights.push(`Strong upward momentum: +${Math.round(weekOverWeek)}% week-over-week`);
    } else if (weekOverWeek < -10) {
      insights.push(`Significant decline: ${Math.round(weekOverWeek)}% week-over-week`);
    }

    if (thisWeek.length > lastWeek.length * 1.5) {
      insights.push('Fixture activity up significantly');
    } else if (thisWeek.length < lastWeek.length * 0.5) {
      insights.push('Fixture activity slowing down');
    }

    return {
      totalFixtures: thisWeek.length,
      avgRate: Math.round(avgThisWeek * 100) / 100,
      topRoute,
      trending,
      weekOverWeek: Math.round(weekOverWeek * 10) / 10,
      insights,
    };
  }

  /**
   * Private: Get period statistics
   */
  private async getPeriodStats(
    route: string,
    days: number
  ): Promise<{ avg: number; trend: string }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rates = await prisma.marketRate.findMany({
      where: {
        route,
        reportedDate: { gte: since },
        status: { in: ['firm', 'fixed'] },
      },
      select: { rate: true, reportedDate: true },
      orderBy: { reportedDate: 'asc' },
    });

    if (rates.length === 0) {
      return { avg: 0, trend: 'stable' };
    }

    const avg = rates.reduce((a, b) => a + b.rate, 0) / rates.length;

    // Simple trend: compare first half to second half
    const midpoint = Math.floor(rates.length / 2);
    const firstHalf = rates.slice(0, midpoint);
    const secondHalf = rates.slice(midpoint);

    const firstAvg =
      firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b.rate, 0) / firstHalf.length : 0;

    const secondAvg =
      secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b.rate, 0) / secondHalf.length : 0;

    let trend = 'stable';
    if (secondAvg > firstAvg * 1.05) trend = 'up';
    else if (secondAvg < firstAvg * 0.95) trend = 'down';

    return {
      avg: Math.round(avg * 100) / 100,
      trend,
    };
  }

  /**
   * Private: Simple moving average forecast
   */
  private forecastRates(recentRates: number[]): {
    nextWeek: number;
    nextMonth: number;
    confidence: number;
  } {
    if (recentRates.length < 3) {
      return { nextWeek: 0, nextMonth: 0, confidence: 0 };
    }

    // Simple moving average
    const avg = recentRates.reduce((a, b) => a + b, 0) / recentRates.length;

    // Calculate trend
    const trend =
      recentRates.length >= 2
        ? (recentRates[recentRates.length - 1] - recentRates[0]) / recentRates.length
        : 0;

    const nextWeek = avg + trend * 7;
    const nextMonth = avg + trend * 30;

    // Confidence based on sample size and variance
    const variance = this.calculateVariance(recentRates);
    const confidence = Math.max(0, Math.min(100, 100 - variance / avg));

    return {
      nextWeek: Math.round(nextWeek * 100) / 100,
      nextMonth: Math.round(nextMonth * 100) / 100,
      confidence: Math.round(confidence),
    };
  }

  /**
   * Private: Analyze seasonality
   */
  private async analyzeSeasonality(
    route: string
  ): Promise<{ peak: string; low: string; variance: number }> {
    // Get historical data (last 2 years)
    const since = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);

    const rates = await prisma.marketRate.findMany({
      where: {
        route,
        reportedDate: { gte: since },
        status: { in: ['firm', 'fixed'] },
      },
      select: { rate: true, reportedDate: true },
    });

    if (rates.length < 12) {
      return { peak: 'Unknown', low: 'Unknown', variance: 0 };
    }

    // Group by month
    const monthlyAvg = new Map<number, number[]>();
    rates.forEach((rate) => {
      const month = rate.reportedDate.getMonth();
      if (!monthlyAvg.has(month)) monthlyAvg.set(month, []);
      monthlyAvg.get(month)!.push(rate.rate);
    });

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

    let peakMonth = 0;
    let peakAvg = 0;
    let lowMonth = 0;
    let lowAvg = Infinity;

    monthlyAvg.forEach((ratesList, month) => {
      const avg = ratesList.reduce((a, b) => a + b, 0) / ratesList.length;
      if (avg > peakAvg) {
        peakAvg = avg;
        peakMonth = month;
      }
      if (avg < lowAvg) {
        lowAvg = avg;
        lowMonth = month;
      }
    });

    const variance = ((peakAvg - lowAvg) / lowAvg) * 100;

    return {
      peak: monthNames[peakMonth],
      low: monthNames[lowMonth],
      variance: Math.round(variance),
    };
  }

  /**
   * Helper methods
   */
  private parsePeriod(period: string): number {
    const match = period.match(/(\d+)([dmy])/);
    if (!match) return 30;

    const value = parseInt(match[1]);
    const unit = match[2];

    if (unit === 'd') return value;
    if (unit === 'm') return value * 30;
    if (unit === 'y') return value * 365;

    return 30;
  }

  private getMedian(values: number[]): number {
    const mid = Math.floor(values.length / 2);
    return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  }

  private calculatePercentile(sorted: number[], value: number): number {
    const below = sorted.filter((v) => v < value).length;
    return (below / sorted.length) * 100;
  }

  private calculateVariance(values: number[]): number {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - avg, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }
}

export const rateBenchmark = new RateBenchmarkService();
