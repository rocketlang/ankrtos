/**
 * Port Tariff GraphQL Schema
 * Phase 6: DA Desk & Port Agency
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';
import { portTariffService } from '../../services/port-tariff-service.js';

// ========================================
// OBJECT TYPES
// ========================================

const PortTariff = builder.prismaObject('PortTariff', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    port: t.relation('port'),
    vesselType: t.exposeString('vesselType', { nullable: true }),
    sizeRangeMin: t.exposeFloat('sizeRangeMin', { nullable: true }),
    sizeRangeMax: t.exposeFloat('sizeRangeMax', { nullable: true }),
    chargeType: t.exposeString('chargeType'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    unit: t.exposeString('unit'),
    effectiveFrom: t.expose('effectiveFrom', { type: 'DateTime' }),
    effectiveTo: t.expose('effectiveTo', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

const TariffCalculation = builder.objectRef<{
  chargeType: string;
  amount: number;
  currency: string;
  unit: string;
  vesselMetric: number;
  totalCharge: number;
  notes?: string;
}>('TariffCalculation').implement({
  fields: (t) => ({
    chargeType: t.exposeString('chargeType'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    unit: t.exposeString('unit'),
    vesselMetric: t.exposeFloat('vesselMetric'),
    totalCharge: t.exposeFloat('totalCharge'),
    notes: t.exposeString('notes', { nullable: true }),
  }),
});

const PortCostEstimate = builder.objectRef<{
  portId: string;
  portName: string;
  totalCostUSD: number;
  breakdown: any[];
  currency: string;
  exchangeRate: number;
  estimatedDate: Date;
}>('PortCostEstimate').implement({
  fields: (t) => ({
    portId: t.exposeID('portId'),
    portName: t.exposeString('portName'),
    totalCostUSD: t.exposeFloat('totalCostUSD'),
    breakdown: t.field({ type: [TariffCalculation], resolve: (parent) => parent.breakdown }),
    currency: t.exposeString('currency'),
    exchangeRate: t.exposeFloat('exchangeRate'),
    estimatedDate: t.expose('estimatedDate', { type: 'DateTime' }),
  }),
});

const TariffComparison = builder.objectRef<{
  portA: any;
  portB: any;
  difference: number;
  differencePercent: number;
  recommendation: string;
}>('TariffComparison').implement({
  fields: (t) => ({
    portA: t.field({ type: PortCostEstimate, resolve: (parent) => parent.portA }),
    portB: t.field({ type: PortCostEstimate, resolve: (parent) => parent.portB }),
    difference: t.exposeFloat('difference'),
    differencePercent: t.exposeFloat('differencePercent'),
    recommendation: t.exposeString('recommendation'),
  }),
});

const TariffStats = builder.objectRef<{
  totalPorts: number;
  totalTariffs: number;
  byChargeType: Record<string, number>;
  recentUpdates: number;
  missingPorts: string[];
}>('TariffStats').implement({
  fields: (t) => ({
    totalPorts: t.exposeInt('totalPorts'),
    totalTariffs: t.exposeInt('totalTariffs'),
    byChargeType: t.field({
      type: 'JSON',
      resolve: (parent) => parent.byChargeType,
    }),
    recentUpdates: t.exposeInt('recentUpdates'),
    missingPorts: t.exposeStringList('missingPorts'),
  }),
});

const PortTariffBulkImportResult = builder.objectRef<{
  success: number;
  failed: number;
  errors: string[];
}>('PortTariffBulkImportResult').implement({
  fields: (t) => ({
    success: t.exposeInt('success'),
    failed: t.exposeInt('failed'),
    errors: t.exposeStringList('errors'),
  }),
});

// ========================================
// INPUT TYPES
// ========================================

const VesselDataInput = builder.inputType('VesselDataInput', {
  fields: (t) => ({
    type: t.string({ required: true }),
    dwt: t.float({ required: true }),
    grt: t.float({ required: true }),
    nrt: t.float({ required: true }),
  }),
});

const TariffFilterInput = builder.inputType('TariffFilterInput', {
  fields: (t) => ({
    portId: t.string(),
    chargeType: t.string(),
    vesselType: t.string(),
    currency: t.string(),
    minAmount: t.float(),
    maxAmount: t.float(),
  }),
});

const TariffCreateInput = builder.inputType('TariffCreateInput', {
  fields: (t) => ({
    portId: t.string({ required: true }),
    vesselType: t.string(),
    sizeRangeMin: t.float(),
    sizeRangeMax: t.float(),
    chargeType: t.string({ required: true }),
    amount: t.float({ required: true }),
    currency: t.string({ required: true }),
    unit: t.string({ required: true }),
    notes: t.string(),
  }),
});

const BulkTariffImportInput = builder.inputType('BulkTariffImportInput', {
  fields: (t) => ({
    portId: t.string({ required: true }),
    vesselType: t.string(),
    sizeRangeMin: t.float(),
    sizeRangeMax: t.float(),
    chargeType: t.string({ required: true }),
    amount: t.float({ required: true }),
    currency: t.string({ required: true }),
    unit: t.string({ required: true }),
    notes: t.string(),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  portTariffs: t.field({
    type: [PortTariff],
    args: {
      portId: t.arg.string({ required: true }),
      activeOnly: t.arg.boolean({ defaultValue: true }),
    },
    resolve: async (root, args, ctx) => {
      return await portTariffService.getPortTariffs(args.portId, args.activeOnly);
    },
  }),

  calculatePortCost: t.field({
    type: PortCostEstimate,
    args: {
      portId: t.arg.string({ required: true }),
      vesselData: t.arg({ type: VesselDataInput, required: true }),
      operations: t.arg.stringList(),
      stayDays: t.arg.float({ defaultValue: 2 }),
    },
    resolve: async (root, args, ctx) => {
      return await portTariffService.calculatePortCost(
        args.portId,
        args.vesselData,
        args.operations || undefined,
        args.stayDays
      );
    },
  }),

  comparePortCosts: t.field({
    type: TariffComparison,
    args: {
      portIdA: t.arg.string({ required: true }),
      portIdB: t.arg.string({ required: true }),
      vesselData: t.arg({ type: VesselDataInput, required: true }),
      operations: t.arg.stringList(),
      stayDays: t.arg.float({ defaultValue: 2 }),
    },
    resolve: async (root, args, ctx) => {
      return await portTariffService.comparePorts(
        args.portIdA,
        args.portIdB,
        args.vesselData,
        args.operations || undefined,
        args.stayDays
      );
    },
  }),

  searchTariffs: t.field({
    type: [PortTariff],
    args: {
      filters: t.arg({ type: TariffFilterInput }),
      limit: t.arg.int({ defaultValue: 50 }),
    },
    resolve: async (root, args, ctx) => {
      return await portTariffService.searchTariffs(args.filters || {}, args.limit);
    },
  }),

  tariffStats: t.field({
    type: TariffStats,
    authScopes: { admin: true },
    resolve: async (root, args, ctx) => {
      return await portTariffService.getTariffStats(ctx.user!.organizationId);
    },
  }),
}));

// ========================================
// MUTATIONS
// ========================================

builder.mutationFields((t) => ({
  createTariff: t.field({
    type: PortTariff,
    authScopes: { manager: true },
    args: {
      input: t.arg({ type: TariffCreateInput, required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await portTariffService.upsertTariff(
        {
          port: { connect: { id: args.input.portId } },
          vesselType: args.input.vesselType,
          sizeRangeMin: args.input.sizeRangeMin,
          sizeRangeMax: args.input.sizeRangeMax,
          chargeType: args.input.chargeType,
          amount: args.input.amount,
          currency: args.input.currency,
          unit: args.input.unit,
          notes: args.input.notes,
        },
        ctx.user!.organizationId
      );
    },
  }),

  bulkImportTariffs: t.field({
    type: PortTariffBulkImportResult,
    authScopes: { admin: true },
    args: {
      tariffs: t.arg({ type: [BulkTariffImportInput], required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await portTariffService.bulkImportTariffs(
        args.tariffs,
        ctx.user!.organizationId
      );
    },
  }),

  deleteTariff: t.field({
    type: 'Boolean',
    authScopes: { admin: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      await prisma.portTariff.delete({ where: { id: args.id } });
      return true;
    },
  }),
}));
