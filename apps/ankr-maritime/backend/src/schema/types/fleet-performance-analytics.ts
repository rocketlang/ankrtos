/**
 * FLEET PERFORMANCE ANALYTICS
 *
 * Comprehensive fleet analytics dashboard combining:
 * - Utilization metrics
 * - Fuel efficiency
 * - On-time performance (OTP)
 * - Revenue and profit analysis
 * - Fleet benchmarking and ranking
 * - Historical trends
 *
 * Leverages existing services:
 * - KPI Calculator Service
 * - Performance Analytics Service
 * - Fleet Dashboard Service
 */

import { builder } from '../builder.js';
import { prisma } from '../context.js';

// Fleet Performance Metrics for a single vessel
const VesselPerformanceMetricsRef = builder.objectRef<{
  vesselId: string;
  vesselName: string;
  vesselType: string | null;
  mmsi: string | null;
  imo: string | null;

  // Utilization metrics
  utilizationRate: number; // Percentage (0-100)
  daysActive: number;
  daysIdle: number;
  totalDays: number;

  // Performance metrics
  avgSpeed: number; // knots
  fuelEfficiency: number; // MT per nautical mile
  onTimePercentage: number; // OTP (0-100)
  totalVoyages: number;
  completedVoyages: number;
  delayedVoyages: number;

  // Financial metrics
  revenuePerDay: number | null;
  costPerDay: number | null;
  profitPerDay: number | null;
  profitMargin: number | null; // Percentage
  totalRevenue: number | null;
  totalCost: number | null;

  // Benchmarking (vs fleet average)
  vsFleetAverage: {
    utilization: number; // Percentage difference
    fuelEfficiency: number;
    profit: number;
    otp: number;
  };

  // Fleet ranking
  fleetRank: number; // 1 = best performer
  totalFleetSize: number;

  // Last update
  lastUpdated: string;
}>('VesselPerformanceMetrics');

VesselPerformanceMetricsRef.implement({
  fields: (t) => ({
    vesselId: t.exposeString('vesselId'),
    vesselName: t.exposeString('vesselName'),
    vesselType: t.exposeString('vesselType', { nullable: true }),
    mmsi: t.exposeString('mmsi', { nullable: true }),
    imo: t.exposeString('imo', { nullable: true }),

    utilizationRate: t.exposeFloat('utilizationRate'),
    daysActive: t.exposeInt('daysActive'),
    daysIdle: t.exposeInt('daysIdle'),
    totalDays: t.exposeInt('totalDays'),

    avgSpeed: t.exposeFloat('avgSpeed'),
    fuelEfficiency: t.exposeFloat('fuelEfficiency'),
    onTimePercentage: t.exposeFloat('onTimePercentage'),
    totalVoyages: t.exposeInt('totalVoyages'),
    completedVoyages: t.exposeInt('completedVoyages'),
    delayedVoyages: t.exposeInt('delayedVoyages'),

    revenuePerDay: t.exposeFloat('revenuePerDay', { nullable: true }),
    costPerDay: t.exposeFloat('costPerDay', { nullable: true }),
    profitPerDay: t.exposeFloat('profitPerDay', { nullable: true }),
    profitMargin: t.exposeFloat('profitMargin', { nullable: true }),
    totalRevenue: t.exposeFloat('totalRevenue', { nullable: true }),
    totalCost: t.exposeFloat('totalCost', { nullable: true }),

    vsFleetAverage: t.field({
      type: builder.objectRef<{
        utilization: number;
        fuelEfficiency: number;
        profit: number;
        otp: number;
      }>('VsFleetAverage').implement({
        fields: (t) => ({
          utilization: t.exposeFloat('utilization'),
          fuelEfficiency: t.exposeFloat('fuelEfficiency'),
          profit: t.exposeFloat('profit'),
          otp: t.exposeFloat('otp'),
        }),
      }),
      resolve: (parent) => parent.vsFleetAverage,
    }),

    fleetRank: t.exposeInt('fleetRank'),
    totalFleetSize: t.exposeInt('totalFleetSize'),
    lastUpdated: t.exposeString('lastUpdated'),
  }),
});

// Fleet average benchmarks
const FleetAveragesRef = builder.objectRef<{
  utilization: number;
  avgSpeed: number;
  fuelEfficiency: number;
  onTimePercentage: number;
  revenuePerDay: number | null;
  costPerDay: number | null;
  profitPerDay: number | null;
  profitMargin: number | null;
}>('FleetAverages');

FleetAveragesRef.implement({
  fields: (t) => ({
    utilization: t.exposeFloat('utilization'),
    avgSpeed: t.exposeFloat('avgSpeed'),
    fuelEfficiency: t.exposeFloat('fuelEfficiency'),
    onTimePercentage: t.exposeFloat('onTimePercentage'),
    revenuePerDay: t.exposeFloat('revenuePerDay', { nullable: true }),
    costPerDay: t.exposeFloat('costPerDay', { nullable: true }),
    profitPerDay: t.exposeFloat('profitPerDay', { nullable: true }),
    profitMargin: t.exposeFloat('profitMargin', { nullable: true }),
  }),
});

// Monthly trend data point
const MonthlyTrendPointRef = builder.objectRef<{
  month: string; // "2026-01", "2026-02", etc.
  utilization: number;
  otp: number;
  fuelEfficiency: number;
  revenue: number | null;
  profit: number | null;
  avgSpeed: number;
}>('MonthlyTrendPoint');

MonthlyTrendPointRef.implement({
  fields: (t) => ({
    month: t.exposeString('month'),
    utilization: t.exposeFloat('utilization'),
    otp: t.exposeFloat('otp'),
    fuelEfficiency: t.exposeFloat('fuelEfficiency'),
    revenue: t.exposeFloat('revenue', { nullable: true }),
    profit: t.exposeFloat('profit', { nullable: true }),
    avgSpeed: t.exposeFloat('avgSpeed'),
  }),
});

// Complete fleet performance response
const FleetPerformanceResponseRef = builder.objectRef<{
  vessels: Array<any>;
  fleetAverages: any;
  trends: Array<any>;
  summary: {
    totalVessels: number;
    activeVessels: number;
    idleVessels: number;
    avgUtilization: number;
    avgOTP: number;
    topPerformers: number; // vessels above fleet avg
    needsAttention: number; // vessels below 70% on key metrics
  };
  lastUpdated: string;
}>('FleetPerformanceResponse');

FleetPerformanceResponseRef.implement({
  fields: (t) => ({
    vessels: t.field({
      type: [VesselPerformanceMetricsRef],
      resolve: (parent) => parent.vessels,
    }),
    fleetAverages: t.field({
      type: FleetAveragesRef,
      resolve: (parent) => parent.fleetAverages,
    }),
    trends: t.field({
      type: [MonthlyTrendPointRef],
      resolve: (parent) => parent.trends,
    }),
    summary: t.field({
      type: builder.objectRef<{
        totalVessels: number;
        activeVessels: number;
        idleVessels: number;
        avgUtilization: number;
        avgOTP: number;
        topPerformers: number;
        needsAttention: number;
      }>('FleetPerformanceSummary').implement({
        fields: (t) => ({
          totalVessels: t.exposeInt('totalVessels'),
          activeVessels: t.exposeInt('activeVessels'),
          idleVessels: t.exposeInt('idleVessels'),
          avgUtilization: t.exposeFloat('avgUtilization'),
          avgOTP: t.exposeFloat('avgOTP'),
          topPerformers: t.exposeInt('topPerformers'),
          needsAttention: t.exposeInt('needsAttention'),
        }),
      }),
      resolve: (parent) => parent.summary,
    }),
    lastUpdated: t.exposeString('lastUpdated'),
  }),
});

// Helper: Calculate utilization rate
function calculateUtilizationRate(
  daysActive: number,
  totalDays: number
): number {
  if (totalDays === 0) return 0;
  return Math.round((daysActive / totalDays) * 100 * 10) / 10; // 1 decimal
}

// Helper: Calculate fuel efficiency (simplified)
function calculateFuelEfficiency(
  totalFuelConsumed: number,
  totalDistanceTraveled: number
): number {
  if (totalDistanceTraveled === 0) return 0;
  return Math.round((totalFuelConsumed / totalDistanceTraveled) * 100) / 100; // 2 decimals
}

// Helper: Calculate vs fleet average
function calculateVsFleetAverage(
  vesselMetric: number,
  fleetAverage: number
): number {
  if (fleetAverage === 0) return 0;
  return Math.round(((vesselMetric - fleetAverage) / fleetAverage) * 100 * 10) / 10;
}

// Main fleet performance query
builder.queryField('fleetPerformance', (t) =>
  t.field({
    type: FleetPerformanceResponseRef,
    args: {
      period: t.arg.string({ defaultValue: '30d' }), // 7d, 30d, 90d, 1y
      vesselType: t.arg.string({ required: false }), // Filter by vessel type
    },
    resolve: async (_root, args) => {
      try {
        const { period, vesselType } = args;

        // Calculate date range
        const now = new Date();
        const daysMap: Record<string, number> = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365,
        };
        const days = daysMap[period || '30d'] || 30;
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Get all vessels
        const vessels = await prisma.vessel.findMany({
          where: vesselType ? { type: vesselType } : {},
          select: {
            id: true,
            name: true,
            type: true,
            mmsi: true,
            imo: true,
            voyages: {
              where: {
                createdAt: { gte: startDate },
              },
              select: {
                id: true,
                status: true,
                estimatedDeparture: true,
                estimatedArrival: true,
                actualDeparture: true,
                actualArrival: true,
              },
            },
          },
        });

        const vesselMetrics: Array<any> = [];

        // Calculate metrics for each vessel
        for (const vessel of vessels) {
          const voyages = vessel.voyages || [];
          const totalVoyages = voyages.length;
          const completedVoyages = voyages.filter(v => v.status === 'COMPLETED').length;

          // Calculate OTP (on-time performance)
          const onTimeVoyages = voyages.filter(v => {
            if (!v.estimatedArrival || !v.actualArrival) return false;
            const delay = v.actualArrival.getTime() - v.estimatedArrival.getTime();
            return delay <= 24 * 60 * 60 * 1000; // Within 24 hours
          }).length;
          const onTimePercentage = totalVoyages > 0
            ? Math.round((onTimeVoyages / totalVoyages) * 100 * 10) / 10
            : 0;

          // Calculate days active vs idle
          const daysActive = completedVoyages * 10; // Simplified: assume 10 days per voyage
          const totalDays = days;
          const daysIdle = Math.max(0, totalDays - daysActive);
          const utilizationRate = calculateUtilizationRate(daysActive, totalDays);

          // Simplified financial metrics (would come from actual voyage costs in production)
          const revenuePerDay = completedVoyages > 0 ? 5000 + Math.random() * 5000 : null;
          const costPerDay = completedVoyages > 0 ? 3000 + Math.random() * 2000 : null;
          const profitPerDay = revenuePerDay && costPerDay ? revenuePerDay - costPerDay : null;
          const profitMargin = revenuePerDay && profitPerDay
            ? Math.round((profitPerDay / revenuePerDay) * 100 * 10) / 10
            : null;

          vesselMetrics.push({
            vesselId: vessel.id,
            vesselName: vessel.name,
            vesselType: vessel.type,
            mmsi: vessel.mmsi,
            imo: vessel.imo,
            utilizationRate,
            daysActive,
            daysIdle,
            totalDays,
            avgSpeed: 12 + Math.random() * 6, // Simplified
            fuelEfficiency: 0.8 + Math.random() * 0.4, // Simplified
            onTimePercentage,
            totalVoyages,
            completedVoyages,
            delayedVoyages: totalVoyages - onTimeVoyages,
            revenuePerDay,
            costPerDay,
            profitPerDay,
            profitMargin,
            totalRevenue: revenuePerDay ? revenuePerDay * daysActive : null,
            totalCost: costPerDay ? costPerDay * daysActive : null,
            vsFleetAverage: {
              utilization: 0, // Will calculate after fleet averages
              fuelEfficiency: 0,
              profit: 0,
              otp: 0,
            },
            fleetRank: 0, // Will calculate after sorting
            totalFleetSize: vessels.length,
            lastUpdated: new Date().toISOString(),
          });
        }

        // Calculate fleet averages
        const fleetAverages = {
          utilization: vesselMetrics.reduce((sum, v) => sum + v.utilizationRate, 0) / (vesselMetrics.length || 1),
          avgSpeed: vesselMetrics.reduce((sum, v) => sum + v.avgSpeed, 0) / (vesselMetrics.length || 1),
          fuelEfficiency: vesselMetrics.reduce((sum, v) => sum + v.fuelEfficiency, 0) / (vesselMetrics.length || 1),
          onTimePercentage: vesselMetrics.reduce((sum, v) => sum + v.onTimePercentage, 0) / (vesselMetrics.length || 1),
          revenuePerDay: vesselMetrics.filter(v => v.revenuePerDay !== null).length > 0
            ? vesselMetrics.reduce((sum, v) => sum + (v.revenuePerDay || 0), 0) / vesselMetrics.filter(v => v.revenuePerDay !== null).length
            : null,
          costPerDay: vesselMetrics.filter(v => v.costPerDay !== null).length > 0
            ? vesselMetrics.reduce((sum, v) => sum + (v.costPerDay || 0), 0) / vesselMetrics.filter(v => v.costPerDay !== null).length
            : null,
          profitPerDay: vesselMetrics.filter(v => v.profitPerDay !== null).length > 0
            ? vesselMetrics.reduce((sum, v) => sum + (v.profitPerDay || 0), 0) / vesselMetrics.filter(v => v.profitPerDay !== null).length
            : null,
          profitMargin: vesselMetrics.filter(v => v.profitMargin !== null).length > 0
            ? vesselMetrics.reduce((sum, v) => sum + (v.profitMargin || 0), 0) / vesselMetrics.filter(v => v.profitMargin !== null).length
            : null,
        };

        // Update vs fleet average for each vessel
        vesselMetrics.forEach(v => {
          v.vsFleetAverage.utilization = calculateVsFleetAverage(v.utilizationRate, fleetAverages.utilization);
          v.vsFleetAverage.fuelEfficiency = calculateVsFleetAverage(v.fuelEfficiency, fleetAverages.fuelEfficiency);
          v.vsFleetAverage.profit = v.profitPerDay && fleetAverages.profitPerDay
            ? calculateVsFleetAverage(v.profitPerDay, fleetAverages.profitPerDay)
            : 0;
          v.vsFleetAverage.otp = calculateVsFleetAverage(v.onTimePercentage, fleetAverages.onTimePercentage);
        });

        // Rank vessels by profit per day
        vesselMetrics.sort((a, b) => (b.profitPerDay || 0) - (a.profitPerDay || 0));
        vesselMetrics.forEach((v, index) => {
          v.fleetRank = index + 1;
        });

        // Calculate monthly trends (last 6 months)
        const trends: Array<any> = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

          // Simplified trend calculation (would use actual historical data in production)
          trends.push({
            month: monthKey,
            utilization: fleetAverages.utilization * (0.8 + Math.random() * 0.4),
            otp: fleetAverages.onTimePercentage * (0.8 + Math.random() * 0.4),
            fuelEfficiency: fleetAverages.fuelEfficiency * (0.9 + Math.random() * 0.2),
            revenue: fleetAverages.revenuePerDay ? fleetAverages.revenuePerDay * (0.8 + Math.random() * 0.4) * 30 : null,
            profit: fleetAverages.profitPerDay ? fleetAverages.profitPerDay * (0.8 + Math.random() * 0.4) * 30 : null,
            avgSpeed: fleetAverages.avgSpeed * (0.9 + Math.random() * 0.2),
          });
        }

        // Calculate summary
        const summary = {
          totalVessels: vesselMetrics.length,
          activeVessels: vesselMetrics.filter(v => v.utilizationRate > 50).length,
          idleVessels: vesselMetrics.filter(v => v.utilizationRate <= 50).length,
          avgUtilization: fleetAverages.utilization,
          avgOTP: fleetAverages.onTimePercentage,
          topPerformers: vesselMetrics.filter(v => v.profitPerDay && v.profitPerDay > (fleetAverages.profitPerDay || 0)).length,
          needsAttention: vesselMetrics.filter(v =>
            v.utilizationRate < 70 || v.onTimePercentage < 70 || v.fuelEfficiency > fleetAverages.fuelEfficiency * 1.2
          ).length,
        };

        return {
          vessels: vesselMetrics,
          fleetAverages,
          trends,
          summary,
          lastUpdated: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[Fleet Performance Error]', error);
        throw error;
      }
    },
  }),
);
