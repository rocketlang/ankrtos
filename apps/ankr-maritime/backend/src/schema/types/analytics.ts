/**
 * Analytics & Performance Monitoring GraphQL Schema
 * Phase 5: TIER 2 - Performance Dashboard
 */

import { builder } from '../builder.js';
import { kpiCalculator } from '../../services/analytics/kpi-calculator.js';

// ========================================
// OBJECT TYPES
// ========================================

const DelayBreakdown = builder.objectRef<{
  type: string;
  count: number;
  totalHours: number;
  avgHours: number;
  percentage: number;
}>('DelayBreakdown').implement({
  fields: (t) => ({
    type: t.exposeString('type'),
    count: t.exposeInt('count'),
    totalHours: t.exposeFloat('totalHours'),
    avgHours: t.exposeFloat('avgHours'),
    percentage: t.exposeFloat('percentage'),
  }),
});

const VoyageKPIs = builder.objectRef<{
  onTimePerformance: number;
  avgPortStay: number;
  avgWaitingTime: number;
  avgDelayPerVoyage: number;
  totalDelays: number;
  delayByType: any[];
  fuelEfficiency: number;
  totalVoyages: number;
  completedVoyages: number;
  activeVoyages: number;
}>('VoyageKPIs').implement({
  fields: (t) => ({
    onTimePerformance: t.exposeFloat('onTimePerformance'),
    avgPortStay: t.exposeFloat('avgPortStay'),
    avgWaitingTime: t.exposeFloat('avgWaitingTime'),
    avgDelayPerVoyage: t.exposeFloat('avgDelayPerVoyage'),
    totalDelays: t.exposeInt('totalDelays'),
    delayByType: t.field({
      type: [DelayBreakdown],
      resolve: (parent) => parent.delayByType,
    }),
    fuelEfficiency: t.exposeFloat('fuelEfficiency'),
    totalVoyages: t.exposeInt('totalVoyages'),
    completedVoyages: t.exposeInt('completedVoyages'),
    activeVoyages: t.exposeInt('activeVoyages'),
  }),
});

const FleetBenchmark = builder.objectRef<{
  vesselId: string;
  vesselName: string;
  vesselType: string;
  otp: number;
  avgSpeed: number;
  fuelEfficiency: number;
  vsFleetAvg: number;
  totalVoyages: number;
  rank: number;
}>('FleetBenchmark').implement({
  fields: (t) => ({
    vesselId: t.exposeString('vesselId'),
    vesselName: t.exposeString('vesselName'),
    vesselType: t.exposeString('vesselType'),
    otp: t.exposeFloat('otp'),
    avgSpeed: t.exposeFloat('avgSpeed'),
    fuelEfficiency: t.exposeFloat('fuelEfficiency'),
    vsFleetAvg: t.exposeFloat('vsFleetAvg'),
    totalVoyages: t.exposeInt('totalVoyages'),
    rank: t.exposeInt('rank'),
  }),
});

const PortPerformance = builder.objectRef<{
  portId: string;
  portName: string;
  totalCalls: number;
  avgStayHours: number;
  avgWaitHours: number;
  onTimePerformance: number;
  rank: number;
}>('PortPerformance').implement({
  fields: (t) => ({
    portId: t.exposeString('portId'),
    portName: t.exposeString('portName'),
    totalCalls: t.exposeInt('totalCalls'),
    avgStayHours: t.exposeFloat('avgStayHours'),
    avgWaitHours: t.exposeFloat('avgWaitHours'),
    onTimePerformance: t.exposeFloat('onTimePerformance'),
    rank: t.exposeInt('rank'),
  }),
});

const FuelAnalytics = builder.objectRef<{
  totalConsumption: number;
  avgConsumptionPerDay: number;
  avgConsumptionPerNM: number;
  plannedVsActual: number;
  costPerTon: number;
  totalCost: number;
  savingsOpportunity: number;
}>('FuelAnalytics').implement({
  fields: (t) => ({
    totalConsumption: t.exposeFloat('totalConsumption'),
    avgConsumptionPerDay: t.exposeFloat('avgConsumptionPerDay'),
    avgConsumptionPerNM: t.exposeFloat('avgConsumptionPerNM'),
    plannedVsActual: t.exposeFloat('plannedVsActual'),
    costPerTon: t.exposeFloat('costPerTon'),
    totalCost: t.exposeFloat('totalCost'),
    savingsOpportunity: t.exposeFloat('savingsOpportunity'),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  // Voyage KPIs
  voyageKPIs: t.field({
    type: VoyageKPIs,
    args: {
      dateFrom: t.arg({ type: 'DateTime', required: true }),
      dateTo: t.arg({ type: 'DateTime', required: true }),
      vesselId: t.arg.string(),
    },
    resolve: async (root, args, ctx) => {
      return await kpiCalculator.calculateVoyageKPIs(
        ctx.user!.organizationId,
        args.dateFrom,
        args.dateTo,
        args.vesselId || undefined
      );
    },
  }),

  // Fleet benchmarking
  fleetBenchmark: t.field({
    type: [FleetBenchmark],
    args: {
      dateFrom: t.arg({ type: 'DateTime', required: true }),
      dateTo: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await kpiCalculator.calculateFleetBenchmark(
        ctx.user!.organizationId,
        args.dateFrom,
        args.dateTo
      );
    },
  }),

  // Port performance rankings
  portPerformance: t.field({
    type: [PortPerformance],
    args: {
      dateFrom: t.arg({ type: 'DateTime', required: true }),
      dateTo: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await kpiCalculator.calculatePortPerformance(
        ctx.user!.organizationId,
        args.dateFrom,
        args.dateTo
      );
    },
  }),

  // Fuel analytics
  fuelAnalytics: t.field({
    type: FuelAnalytics,
    args: {
      dateFrom: t.arg({ type: 'DateTime', required: true }),
      dateTo: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await kpiCalculator.calculateFuelAnalytics(
        ctx.user!.organizationId,
        args.dateFrom,
        args.dateTo
      );
    },
  }),

  // Speed vs consumption data
  speedConsumptionData: t.field({
    type: 'JSON',
    args: {
      dateFrom: t.arg({ type: 'DateTime', required: true }),
      dateTo: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await kpiCalculator.getSpeedConsumptionData(
        ctx.user!.organizationId,
        args.dateFrom,
        args.dateTo
      );
    },
  }),

  // Trend data for charts
  kpiTrends: t.field({
    type: 'JSON',
    args: {
      dateFrom: t.arg({ type: 'DateTime', required: true }),
      dateTo: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await kpiCalculator.calculateTrendData(
        ctx.user!.organizationId,
        args.dateFrom,
        args.dateTo
      );
    },
  }),
}));
