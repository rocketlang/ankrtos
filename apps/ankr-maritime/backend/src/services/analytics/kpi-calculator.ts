/**
 * KPI Calculator Service
 * Phase 5: Performance Monitoring Dashboard
 *
 * Features:
 * - On-time performance (OTP)
 * - Port stay duration analytics
 * - Delay statistics
 * - Fuel consumption tracking
 * - Fleet benchmarking
 */

import { prisma } from '../../lib/prisma.js';

export interface VoyageKPIs {
  onTimePerformance: number; // % within 90 minutes of ETA
  avgPortStay: number; // hours
  avgWaitingTime: number; // hours at anchorage
  avgDelayPerVoyage: number; // hours
  totalDelays: number;
  delayByType: DelayBreakdown[];
  fuelEfficiency: number; // tons per nautical mile
  totalVoyages: number;
  completedVoyages: number;
  activeVoyages: number;
}

export interface DelayBreakdown {
  type: string;
  count: number;
  totalHours: number;
  avgHours: number;
  percentage: number;
}

export interface FleetBenchmark {
  vesselId: string;
  vesselName: string;
  vesselType: string;
  otp: number; // on-time performance %
  avgSpeed: number; // knots
  fuelEfficiency: number; // tons per NM
  vsFleetAvg: number; // % difference from fleet average
  totalVoyages: number;
  rank: number;
}

export interface PortPerformance {
  portId: string;
  portName: string;
  totalCalls: number;
  avgStayHours: number;
  avgWaitHours: number;
  onTimePerformance: number;
  rank: number;
}

export interface FuelAnalytics {
  totalConsumption: number; // tons
  avgConsumptionPerDay: number; // tons/day
  avgConsumptionPerNM: number; // tons/NM
  plannedVsActual: number; // % difference
  costPerTon: number;
  totalCost: number;
  savingsOpportunity: number; // potential savings
}

class KPICalculator {
  /**
   * Calculate voyage KPIs for organization
   */
  async calculateVoyageKPIs(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    vesselId?: string
  ): Promise<VoyageKPIs> {
    // Build where clause
    const where: any = {
      vessel: { organizationId },
      createdAt: { gte: dateFrom, lte: dateTo },
    };

    if (vesselId) {
      where.vesselId = vesselId;
    }

    // Get voyages
    const voyages = await prisma.voyage.findMany({
      where,
      include: {
        vessel: true,
        portCalls: {
          include: { port: true },
        },
        delayAlerts: true,
      },
    });

    const totalVoyages = voyages.length;
    const completedVoyages = voyages.filter((v) => v.status === 'completed').length;
    const activeVoyages = voyages.filter((v) =>
      ['in_progress', 'loading', 'discharging'].includes(v.status)
    ).length;

    // Calculate OTP (On-Time Performance)
    let onTimeArrivals = 0;
    let totalArrivals = 0;
    let totalPortStayHours = 0;
    let totalWaitingHours = 0;
    let portStayCounts = 0;

    for (const voyage of voyages) {
      for (const portCall of voyage.portCalls) {
        if (portCall.eta && portCall.ata) {
          totalArrivals++;
          const differenceMinutes = Math.abs(
            (portCall.ata.getTime() - portCall.eta.getTime()) / (1000 * 60)
          );
          if (differenceMinutes <= 90) onTimeArrivals++;

          // Port stay duration
          if (portCall.atd) {
            const stayHours =
              (portCall.atd.getTime() - portCall.ata.getTime()) / (1000 * 60 * 60);
            totalPortStayHours += stayHours;
            portStayCounts++;
          }
        }
      }
    }

    const onTimePerformance = totalArrivals > 0 ? (onTimeArrivals / totalArrivals) * 100 : 0;
    const avgPortStay = portStayCounts > 0 ? totalPortStayHours / portStayCounts : 0;

    // Calculate delay statistics
    const delaysByType = new Map<string, { count: number; totalHours: number }>();
    let totalDelayHours = 0;

    for (const voyage of voyages) {
      for (const delay of voyage.delayAlerts) {
        const type = delay.type || 'unknown';
        const hours = delay.delayHours || 0;

        if (!delaysByType.has(type)) {
          delaysByType.set(type, { count: 0, totalHours: 0 });
        }

        const current = delaysByType.get(type)!;
        current.count++;
        current.totalHours += hours;
        totalDelayHours += hours;
      }
    }

    const delayByType: DelayBreakdown[] = Array.from(delaysByType.entries()).map(
      ([type, stats]) => ({
        type,
        count: stats.count,
        totalHours: stats.totalHours,
        avgHours: stats.totalHours / stats.count,
        percentage: (stats.totalHours / totalDelayHours) * 100,
      })
    );

    // Sort by total hours descending
    delayByType.sort((a, b) => b.totalHours - a.totalHours);

    const avgDelayPerVoyage = completedVoyages > 0 ? totalDelayHours / completedVoyages : 0;

    // Calculate fuel efficiency (simplified - would use actual data in production)
    const fuelEfficiency = 0.035; // tons per NM (typical for bulk carriers)

    return {
      onTimePerformance,
      avgPortStay,
      avgWaitingTime: 0, // Would calculate from anchorage data
      avgDelayPerVoyage,
      totalDelays: delaysByType.reduce((sum, d) => sum + d.count, 0),
      delayByType,
      fuelEfficiency,
      totalVoyages,
      completedVoyages,
      activeVoyages,
    };
  }

  /**
   * Calculate fleet benchmarking
   */
  async calculateFleetBenchmark(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<FleetBenchmark[]> {
    // Get all vessels
    const vessels = await prisma.vessel.findMany({
      where: { organizationId },
      include: {
        voyages: {
          where: {
            createdAt: { gte: dateFrom, lte: dateTo },
            status: 'completed',
          },
          include: {
            portCalls: true,
          },
        },
      },
    });

    const benchmarks: FleetBenchmark[] = [];

    for (const vessel of vessels) {
      const voyages = vessel.voyages;
      if (voyages.length === 0) continue;

      // Calculate OTP
      let onTimeArrivals = 0;
      let totalArrivals = 0;
      let totalSpeed = 0;
      let speedCount = 0;

      for (const voyage of voyages) {
        for (const portCall of voyage.portCalls) {
          if (portCall.eta && portCall.ata) {
            totalArrivals++;
            const differenceMinutes = Math.abs(
              (portCall.ata.getTime() - portCall.eta.getTime()) / (1000 * 60)
            );
            if (differenceMinutes <= 90) onTimeArrivals++;
          }
        }

        if (voyage.plannedSpeed) {
          totalSpeed += voyage.plannedSpeed;
          speedCount++;
        }
      }

      const otp = totalArrivals > 0 ? (onTimeArrivals / totalArrivals) * 100 : 0;
      const avgSpeed = speedCount > 0 ? totalSpeed / speedCount : 13.5;
      const fuelEfficiency = 0.035; // Simplified

      benchmarks.push({
        vesselId: vessel.id,
        vesselName: vessel.name,
        vesselType: vessel.type,
        otp,
        avgSpeed,
        fuelEfficiency,
        vsFleetAvg: 0, // Calculate after fleet average
        totalVoyages: voyages.length,
        rank: 0, // Calculate after sorting
      });
    }

    // Calculate fleet average OTP
    const fleetAvgOTP =
      benchmarks.reduce((sum, b) => sum + b.otp, 0) / benchmarks.length || 0;

    // Calculate vs fleet average
    for (const benchmark of benchmarks) {
      benchmark.vsFleetAvg = ((benchmark.otp - fleetAvgOTP) / fleetAvgOTP) * 100;
    }

    // Sort by OTP descending and assign ranks
    benchmarks.sort((a, b) => b.otp - a.otp);
    benchmarks.forEach((b, index) => {
      b.rank = index + 1;
    });

    return benchmarks;
  }

  /**
   * Calculate port performance rankings
   */
  async calculatePortPerformance(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<PortPerformance[]> {
    const portStats = new Map<
      string,
      {
        portName: string;
        totalCalls: number;
        totalStayHours: number;
        totalWaitHours: number;
        onTimeArrivals: number;
        totalArrivals: number;
      }
    >();

    const voyages = await prisma.voyage.findMany({
      where: {
        vessel: { organizationId },
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      include: {
        portCalls: {
          include: { port: true },
        },
      },
    });

    for (const voyage of voyages) {
      for (const portCall of voyage.portCalls) {
        const portId = portCall.portId;

        if (!portStats.has(portId)) {
          portStats.set(portId, {
            portName: portCall.port.name,
            totalCalls: 0,
            totalStayHours: 0,
            totalWaitHours: 0,
            onTimeArrivals: 0,
            totalArrivals: 0,
          });
        }

        const stats = portStats.get(portId)!;
        stats.totalCalls++;

        if (portCall.eta && portCall.ata) {
          stats.totalArrivals++;
          const differenceMinutes = Math.abs(
            (portCall.ata.getTime() - portCall.eta.getTime()) / (1000 * 60)
          );
          if (differenceMinutes <= 90) stats.onTimeArrivals++;

          if (portCall.atd) {
            const stayHours =
              (portCall.atd.getTime() - portCall.ata.getTime()) / (1000 * 60 * 60);
            stats.totalStayHours += stayHours;
          }
        }
      }
    }

    const performance: PortPerformance[] = Array.from(portStats.entries()).map(
      ([portId, stats]) => ({
        portId,
        portName: stats.portName,
        totalCalls: stats.totalCalls,
        avgStayHours: stats.totalCalls > 0 ? stats.totalStayHours / stats.totalCalls : 0,
        avgWaitHours: 0, // Would calculate from anchorage data
        onTimePerformance:
          stats.totalArrivals > 0 ? (stats.onTimeArrivals / stats.totalArrivals) * 100 : 0,
        rank: 0,
      })
    );

    // Sort by OTP descending and assign ranks
    performance.sort((a, b) => b.onTimePerformance - a.onTimePerformance);
    performance.forEach((p, index) => {
      p.rank = index + 1;
    });

    return performance;
  }

  /**
   * Calculate fuel analytics
   */
  async calculateFuelAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<FuelAnalytics> {
    const voyages = await prisma.voyage.findMany({
      where: {
        vessel: { organizationId },
        createdAt: { gte: dateFrom, lte: dateTo },
        status: 'completed',
      },
      include: {
        noonReports: true,
      },
    });

    let totalConsumption = 0;
    let totalDays = 0;
    let totalDistance = 0;

    for (const voyage of voyages) {
      for (const report of voyage.noonReports) {
        totalConsumption += report.foConsumption || 0;
        totalDays++;
      }

      // Estimate distance (would use actual data in production)
      if (voyage.actualDeparture && voyage.actualArrival) {
        const durationDays =
          (voyage.actualArrival.getTime() - voyage.actualDeparture.getTime()) /
          (1000 * 60 * 60 * 24);
        const speed = voyage.plannedSpeed || 13.5;
        totalDistance += durationDays * 24 * speed;
      }
    }

    const avgConsumptionPerDay = totalDays > 0 ? totalConsumption / totalDays : 0;
    const avgConsumptionPerNM = totalDistance > 0 ? totalConsumption / totalDistance : 0;

    const costPerTon = 600; // USD per ton (simplified)
    const totalCost = totalConsumption * costPerTon;

    // Calculate potential savings (8% improvement possible)
    const savingsOpportunity = totalCost * 0.08;

    return {
      totalConsumption,
      avgConsumptionPerDay,
      avgConsumptionPerNM,
      plannedVsActual: 0, // Would calculate from planned vs actual
      costPerTon,
      totalCost,
      savingsOpportunity,
    };
  }

  /**
   * Get speed vs consumption data for scatter plot
   */
  async getSpeedConsumptionData(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<Array<{ speed: number; consumption: number; vesselName: string }>> {
    const noonReports = await prisma.noonReport.findMany({
      where: {
        voyage: {
          vessel: { organizationId },
        },
        reportDate: { gte: dateFrom, lte: dateTo },
      },
      include: {
        voyage: {
          include: { vessel: true },
        },
      },
      take: 500, // Limit for performance
    });

    return noonReports
      .filter((r) => r.speed && r.foConsumption)
      .map((r) => ({
        speed: r.speed!,
        consumption: r.foConsumption!,
        vesselName: r.voyage.vessel.name,
      }));
  }

  /**
   * Calculate trend data for charts (monthly aggregation)
   */
  async calculateTrendData(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<Array<{ month: string; otp: number; avgDelay: number; fuelEfficiency: number }>> {
    const trends: Array<{
      month: string;
      otp: number;
      avgDelay: number;
      fuelEfficiency: number;
    }> = [];

    // Calculate monthly trends
    const currentDate = new Date(dateFrom);
    while (currentDate <= dateTo) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const kpis = await this.calculateVoyageKPIs(organizationId, monthStart, monthEnd);

      trends.push({
        month: currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        otp: kpis.onTimePerformance,
        avgDelay: kpis.avgDelayPerVoyage,
        fuelEfficiency: kpis.fuelEfficiency,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return trends;
  }
}

export const kpiCalculator = new KPICalculator();
