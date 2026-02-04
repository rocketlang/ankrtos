/**
 * Performance Analytics Service
 * Fleet performance metrics, benchmarking, and optimization insights
 *
 * Purpose: Measure performance, identify improvement opportunities, maximize ROI
 */

import { prisma } from '../schema/context.js';

export interface VesselPerformanceMetrics {
  vesselId: string;
  vesselName: string;

  // Operational Efficiency
  utilizationRate: number;      // % time at sea vs in port
  avgSpeed: number;             // Knots
  avgConsumption: number;       // MT/day
  fuelEfficiency: number;       // NM per MT fuel

  // Financial Performance
  revenuePerDay: number;        // USD/day
  costPerDay: number;           // USD/day
  profitPerDay: number;         // USD/day
  profitMargin: number;         // %

  // Voyage Performance
  totalVoyages: number;
  completedVoyages: number;
  activeVoyages: number;
  avgVoyageDuration: number;    // Days
  onTimePercentage: number;     // %

  // Benchmarking
  vsFleetAverage: {
    utilizationRate: number;    // Difference from fleet avg
    fuelEfficiency: number;
    profitPerDay: number;
    onTimePercentage: number;
  };

  // Ranking
  fleetRank: number;            // 1 = best performer
  totalFleetVessels: number;
}

export interface FleetPerformanceStats {
  totalVessels: number;
  activeVessels: number;

  // Aggregates
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  avgProfitMargin: number;

  // Fleet averages
  avgUtilizationRate: number;
  avgFuelEfficiency: number;
  avgOnTimePercentage: number;

  // Top performers
  topPerformers: {
    byRevenue: VesselPerformanceMetrics[];
    byEfficiency: VesselPerformanceMetrics[];
    byProfit: VesselPerformanceMetrics[];
  };
}

export class PerformanceAnalyticsService {
  /**
   * Get performance metrics for a specific vessel
   */
  async getVesselPerformance(vesselId: string): Promise<VesselPerformanceMetrics> {
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        voyages: {
          where: { status: { in: ['completed', 'in_progress'] } },
          orderBy: { createdAt: 'desc' },
          take: 12, // Last 12 voyages
        },
      },
    });

    if (!vessel) {
      throw new Error(`Vessel ${vesselId} not found`);
    }

    // Calculate operational metrics
    const operational = this.calculateOperationalMetrics(vessel);

    // Calculate financial metrics
    const financial = this.calculateFinancialMetrics(vessel);

    // Calculate voyage performance
    const voyagePerf = this.calculateVoyagePerformance(vessel);

    // Get fleet averages for benchmarking
    const fleetAvg = await this.getFleetAverages(vessel.organizationId);

    // Calculate benchmarking
    const vsFleetAverage = {
      utilizationRate: operational.utilizationRate - fleetAvg.avgUtilizationRate,
      fuelEfficiency: operational.fuelEfficiency - fleetAvg.avgFuelEfficiency,
      profitPerDay: financial.profitPerDay - fleetAvg.avgProfitPerDay,
      onTimePercentage: voyagePerf.onTimePercentage - fleetAvg.avgOnTimePercentage,
    };

    // Calculate fleet ranking
    const ranking = await this.calculateFleetRanking(vesselId, vessel.organizationId);

    return {
      vesselId: vessel.id,
      vesselName: vessel.name,

      ...operational,
      ...financial,
      ...voyagePerf,

      vsFleetAverage,
      fleetRank: ranking.rank,
      totalFleetVessels: ranking.total,
    };
  }

  /**
   * Calculate operational efficiency metrics
   */
  private calculateOperationalMetrics(vessel: any) {
    // Mock calculations - would use real voyage data
    const voyages = vessel.voyages || [];

    // Utilization rate (time at sea vs in port)
    // Simplified: assume 80% utilization for active vessels
    const utilizationRate = voyages.length > 0 ? 75 + Math.random() * 20 : 0;

    // Average speed from AIS data (would query positions)
    const avgSpeed = 12 + Math.random() * 4; // 12-16 knots

    // Average fuel consumption (MT/day)
    const dwt = vessel.dwt || 50000;
    const avgConsumption = (dwt / 10000) * 15; // Rough estimate

    // Fuel efficiency (NM per MT)
    const fuelEfficiency = (avgSpeed * 24) / avgConsumption;

    return {
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      avgConsumption: Math.round(avgConsumption * 10) / 10,
      fuelEfficiency: Math.round(fuelEfficiency * 10) / 10,
    };
  }

  /**
   * Calculate financial performance metrics
   */
  private calculateFinancialMetrics(vessel: any) {
    const voyages = vessel.voyages || [];

    // Mock financial data - would come from accounting system
    const dwt = vessel.dwt || 50000;

    // Revenue per day (freight rate × cargo)
    // Simplified: $15-25 per MT of cargo
    const freightRate = 15 + Math.random() * 10;
    const avgCargoPerVoyage = dwt * 0.9; // 90% capacity
    const avgVoyageDays = 30;
    const revenuePerDay = (freightRate * avgCargoPerVoyage) / avgVoyageDays;

    // Cost per day (bunkers, port fees, crew, etc.)
    // Simplified: $8K-15K/day depending on vessel size
    const costPerDay = 8000 + (dwt / 10000) * 2000;

    // Profit per day
    const profitPerDay = revenuePerDay - costPerDay;

    // Profit margin
    const profitMargin = (profitPerDay / revenuePerDay) * 100;

    return {
      revenuePerDay: Math.round(revenuePerDay),
      costPerDay: Math.round(costPerDay),
      profitPerDay: Math.round(profitPerDay),
      profitMargin: Math.round(profitMargin * 10) / 10,
    };
  }

  /**
   * Calculate voyage performance metrics
   */
  private calculateVoyagePerformance(vessel: any) {
    const voyages = vessel.voyages || [];

    const totalVoyages = voyages.length;
    const completedVoyages = voyages.filter((v: any) => v.status === 'completed').length;
    const activeVoyages = voyages.filter((v: any) => v.status === 'in_progress').length;

    // Average voyage duration (days)
    // Mock: 25-35 days
    const avgVoyageDuration = 25 + Math.random() * 10;

    // On-time performance (% of voyages on time)
    // Mock: 85-95%
    const onTimePercentage = 85 + Math.random() * 10;

    return {
      totalVoyages,
      completedVoyages,
      activeVoyages,
      avgVoyageDuration: Math.round(avgVoyageDuration * 10) / 10,
      onTimePercentage: Math.round(onTimePercentage * 10) / 10,
    };
  }

  /**
   * Get fleet-wide averages for benchmarking
   */
  private async getFleetAverages(organizationId: string) {
    // In production, would aggregate real data across fleet
    // For prototype, return reasonable averages

    return {
      avgUtilizationRate: 80.0,
      avgFuelEfficiency: 150.0,
      avgProfitPerDay: 8000,
      avgOnTimePercentage: 88.0,
    };
  }

  /**
   * Calculate vessel's rank in fleet
   */
  private async calculateFleetRanking(vesselId: string, organizationId: string) {
    const vessels = await prisma.vessel.findMany({
      where: { organizationId },
    });

    // Mock ranking based on vessel ID position
    const vesselIndex = vessels.findIndex((v) => v.id === vesselId);
    const rank = vesselIndex + 1;

    return {
      rank: rank || 1,
      total: vessels.length,
    };
  }

  /**
   * Get fleet-wide performance statistics
   */
  async getFleetPerformance(organizationId: string): Promise<FleetPerformanceStats> {
    const vessels = await prisma.vessel.findMany({
      where: { organizationId },
      include: {
        voyages: {
          where: { status: { in: ['completed', 'in_progress'] } },
        },
      },
    });

    const totalVessels = vessels.length;
    const activeVessels = vessels.filter(
      (v) => v.voyages.some((voy: any) => voy.status === 'in_progress')
    ).length;

    // Calculate aggregates (mock data)
    const totalRevenue = totalVessels * 300000; // $300K/vessel avg
    const totalCosts = totalVessels * 220000; // $220K/vessel avg
    const totalProfit = totalRevenue - totalCosts;
    const avgProfitMargin = (totalProfit / totalRevenue) * 100;

    // Fleet averages
    const avgUtilizationRate = 80.0;
    const avgFuelEfficiency = 150.0;
    const avgOnTimePercentage = 88.0;

    // Get top performers (mock - would calculate from real data)
    const topPerformers = {
      byRevenue: [],
      byEfficiency: [],
      byProfit: [],
    };

    return {
      totalVessels,
      activeVessels,
      totalRevenue,
      totalCosts,
      totalProfit,
      avgProfitMargin: Math.round(avgProfitMargin * 10) / 10,
      avgUtilizationRate,
      avgFuelEfficiency,
      avgOnTimePercentage,
      topPerformers,
    };
  }

  /**
   * Get predictive maintenance alerts
   */
  async getPredictiveMaintenanceAlerts(vesselId: string) {
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
    });

    if (!vessel) return [];

    const yearBuilt = vessel.yearBuilt || 2010;
    const vesselAge = new Date().getFullYear() - yearBuilt;

    // Mock alerts based on age and usage
    const alerts = [];

    if (vesselAge > 10) {
      alerts.push({
        component: 'Main Engine',
        severity: 'medium',
        daysUntil: 45,
        estimatedCost: 25000,
        description: 'Main engine overhaul recommended based on running hours',
      });
    }

    if (vesselAge > 5) {
      alerts.push({
        component: 'Hull Coating',
        severity: 'low',
        daysUntil: 90,
        estimatedCost: 50000,
        description: 'Hull coating showing signs of wear, drydocking recommended',
      });
    }

    return alerts;
  }
}

export const performanceAnalyticsService = new PerformanceAnalyticsService();
