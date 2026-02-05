/**
 * Market Intelligence Service
 * Fixture database, rate trends, trade flow analysis
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface FixtureRecord {
  id: string;
  date: Date;
  vesselName: string;
  vesselType: string;
  dwt: number;
  built: number;
  loadPort: string;
  dischargePort: string;
  cargoType: string;
  quantity: number;
  freightRate: number;
  freightBasis: string;
  charterer: string;
  owner: string;
  broker?: string;
  source: 'EMAIL' | 'MANUAL' | 'SCRAPED' | 'PARTNER';
}

export interface RateTrend {
  route: string;
  cargoType: string;
  vesselSize: string;
  period: string; // 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
  dataPoints: Array<{
    date: Date;
    avgRate: number;
    minRate: number;
    maxRate: number;
    count: number; // Number of fixtures
  }>;
  trend: 'UP' | 'DOWN' | 'FLAT';
  changePercent: number;
}

export interface TradeFlow {
  loadRegion: string;
  dischargeRegion: string;
  cargoType: string;
  totalVolume: number; // MT
  fixturesCount: number;
  avgFreightRate: number;
  topVessels: Array<{ vesselName: string; count: number }>;
}

export class MarketIntelligenceService {
  /**
   * Get fixture database (historical fixtures)
   */
  async getFixtures(
    filters: {
      vesselType?: string;
      loadPort?: string;
      dischargePort?: string;
      cargoType?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    organizationId: string
  ): Promise<FixtureRecord[]> {
    const where: any = { organizationId };

    if (filters.vesselType) where.vesselType = filters.vesselType;
    if (filters.cargoType) where.cargoType = filters.cargoType;
    if (filters.dateFrom || filters.dateTo) {
      where.fixtureDate = {};
      if (filters.dateFrom) where.fixtureDate.gte = filters.dateFrom;
      if (filters.dateTo) where.fixtureDate.lte = filters.dateTo;
    }

    const fixtures = await prisma.charter.findMany({
      where: {
        ...where,
        status: 'FIXED',
      },
      include: {
        vessel: true,
        charterer: true,
        cargo: true,
      },
      orderBy: { fixtureDate: 'desc' },
      take: 100,
    });

    return fixtures.map((f) => ({
      id: f.id,
      date: f.fixtureDate || f.createdAt,
      vesselName: f.vessel.name,
      vesselType: f.vessel.type,
      dwt: f.vessel.dwt,
      built: f.vessel.built,
      loadPort: f.cargo?.loadPort || 'Unknown',
      dischargePort: f.cargo?.dischargePort || 'Unknown',
      cargoType: f.cargo?.cargoType || 'Unknown',
      quantity: f.cargo?.quantity || 0,
      freightRate: f.freightRate || 0,
      freightBasis: f.freightBasis || 'per MT',
      charterer: f.charterer?.name || 'Unknown',
      owner: f.vessel.owner?.name || 'Unknown',
      broker: f.brokerName,
      source: 'MANUAL' as const,
    }));
  }

  /**
   * Get rate trends over time
   */
  async getRateTrends(
    route: string,
    cargoType: string,
    period: 'WEEKLY' | 'MONTHLY' = 'MONTHLY',
    organizationId: string
  ): Promise<RateTrend> {
    const [loadPort, dischargePort] = route.split('-');

    // Get fixtures for this route
    const fixtures = await this.getFixtures(
      {
        loadPort,
        dischargePort,
        cargoType,
        dateFrom: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
      },
      organizationId
    );

    // Group by period
    const grouped = this.groupByPeriod(fixtures, period);

    // Calculate trend
    const dataPoints = grouped.map((g) => ({
      date: g.date,
      avgRate: g.avgRate,
      minRate: g.minRate,
      maxRate: g.maxRate,
      count: g.count,
    }));

    const { trend, changePercent } = this.calculateTrend(dataPoints);

    return {
      route,
      cargoType,
      vesselSize: 'Panamax', // Simplified
      period,
      dataPoints,
      trend,
      changePercent,
    };
  }

  /**
   * Get trade flow analysis
   */
  async getTradeFlows(
    cargoType: string,
    organizationId: string
  ): Promise<TradeFlow[]> {
    const fixtures = await this.getFixtures({ cargoType }, organizationId);

    // Group by route
    const routeMap = new Map<string, FixtureRecord[]>();
    fixtures.forEach((f) => {
      const route = `${this.getRegion(f.loadPort)}-${this.getRegion(f.dischargePort)}`;
      if (!routeMap.has(route)) {
        routeMap.set(route, []);
      }
      routeMap.get(route)!.push(f);
    });

    // Convert to trade flows
    const flows: TradeFlow[] = [];
    routeMap.forEach((routeFixtures, route) => {
      const [loadRegion, dischargeRegion] = route.split('-');

      const totalVolume = routeFixtures.reduce((sum, f) => sum + f.quantity, 0);
      const avgFreightRate =
        routeFixtures.reduce((sum, f) => sum + f.freightRate, 0) / routeFixtures.length;

      // Count vessel frequency
      const vesselCounts = new Map<string, number>();
      routeFixtures.forEach((f) => {
        vesselCounts.set(f.vesselName, (vesselCounts.get(f.vesselName) || 0) + 1);
      });

      const topVessels = Array.from(vesselCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([vesselName, count]) => ({ vesselName, count }));

      flows.push({
        loadRegion,
        dischargeRegion,
        cargoType,
        totalVolume,
        fixturesCount: routeFixtures.length,
        avgFreightRate,
        topVessels,
      });
    });

    // Sort by volume
    flows.sort((a, b) => b.totalVolume - a.totalVolume);

    return flows;
  }

  /**
   * Competitor activity analysis
   */
  async getCompetitorActivity(
    organizationId: string
  ): Promise<
    Array<{
      company: string;
      fixturesCount: number;
      totalVolume: number;
      marketShare: number; // percent
      growthRate: number; // YoY percent
    }>
  > {
    // Get all fixtures
    const allFixtures = await this.getFixtures({}, organizationId);
    const totalVolume = allFixtures.reduce((sum, f) => sum + f.quantity, 0);

    // Group by charterer
    const byCharterer = new Map<string, FixtureRecord[]>();
    allFixtures.forEach((f) => {
      if (!byCharterer.has(f.charterer)) {
        byCharterer.set(f.charterer, []);
      }
      byCharterer.get(f.charterer)!.push(f);
    });

    // Calculate metrics
    const competitors = Array.from(byCharterer.entries()).map(([company, fixtures]) => {
      const fixturesCount = fixtures.length;
      const companyVolume = fixtures.reduce((sum, f) => sum + f.quantity, 0);
      const marketShare = (companyVolume / totalVolume) * 100;

      return {
        company,
        fixturesCount,
        totalVolume: companyVolume,
        marketShare,
        growthRate: 0, // Mock - would need historical comparison
      };
    });

    // Sort by market share
    competitors.sort((a, b) => b.marketShare - a.marketShare);

    return competitors.slice(0, 10); // Top 10
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private groupByPeriod(
    fixtures: FixtureRecord[],
    period: 'WEEKLY' | 'MONTHLY'
  ): Array<{
    date: Date;
    avgRate: number;
    minRate: number;
    maxRate: number;
    count: number;
  }> {
    // Group fixtures by period
    const periodMap = new Map<string, FixtureRecord[]>();

    fixtures.forEach((f) => {
      const key = this.getPeriodKey(f.date, period);
      if (!periodMap.has(key)) {
        periodMap.set(key, []);
      }
      periodMap.get(key)!.push(f);
    });

    // Calculate stats for each period
    const result = Array.from(periodMap.entries()).map(([key, periodFixtures]) => {
      const rates = periodFixtures.map((f) => f.freightRate);
      const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
      const minRate = Math.min(...rates);
      const maxRate = Math.max(...rates);

      return {
        date: new Date(key),
        avgRate: Math.round(avgRate * 100) / 100,
        minRate,
        maxRate,
        count: periodFixtures.length,
      };
    });

    // Sort by date
    result.sort((a, b) => a.date.getTime() - b.date.getTime());

    return result;
  }

  private getPeriodKey(date: Date, period: 'WEEKLY' | 'MONTHLY'): string {
    if (period === 'MONTHLY') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      // Weekly: ISO week number
      const week = this.getISOWeek(date);
      return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
    }
  }

  private getISOWeek(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private calculateTrend(
    dataPoints: Array<{ date: Date; avgRate: number }>
  ): { trend: 'UP' | 'DOWN' | 'FLAT'; changePercent: number } {
    if (dataPoints.length < 2) {
      return { trend: 'FLAT', changePercent: 0 };
    }

    const first = dataPoints[0].avgRate;
    const last = dataPoints[dataPoints.length - 1].avgRate;
    const changePercent = ((last - first) / first) * 100;

    let trend: 'UP' | 'DOWN' | 'FLAT';
    if (changePercent > 5) trend = 'UP';
    else if (changePercent < -5) trend = 'DOWN';
    else trend = 'FLAT';

    return { trend, changePercent: Math.round(changePercent * 10) / 10 };
  }

  private getRegion(portName: string): string {
    // Simple region mapping
    const regionMap: Record<string, string> = {
      SINGAPORE: 'FAR_EAST',
      SHANGHAI: 'FAR_EAST',
      QINGDAO: 'FAR_EAST',
      NINGBO: 'FAR_EAST',
      NEWCASTLE: 'AUSTRALIA',
      RICHARDS_BAY: 'SOUTH_AFRICA',
      ROTTERDAM: 'EUROPE',
      HAMBURG: 'EUROPE',
    };

    const match = Object.entries(regionMap).find(([key]) =>
      portName.toUpperCase().includes(key)
    );

    return match ? match[1] : 'OTHER';
  }
}

export const marketIntelligenceService = new MarketIntelligenceService();
