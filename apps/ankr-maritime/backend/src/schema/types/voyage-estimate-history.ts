import { builder } from '../builder.js';

builder.prismaObject('VoyageEstimateHistory', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    charterId: t.exposeString('charterId', { nullable: true }),
    label: t.exposeString('label'),
    vesselName: t.exposeString('vesselName', { nullable: true }),
    vesselDwt: t.exposeFloat('vesselDwt', { nullable: true }),
    cargoQuantity: t.exposeFloat('cargoQuantity'),
    freightRate: t.exposeFloat('freightRate'),
    freightUnit: t.exposeString('freightUnit'),
    seaDistanceNm: t.exposeFloat('seaDistanceNm'),
    speedKnots: t.exposeFloat('speedKnots'),
    loadDays: t.exposeFloat('loadDays'),
    dischargeDays: t.exposeFloat('dischargeDays'),
    bunkerPriceIfo: t.exposeFloat('bunkerPriceIfo'),
    bunkerPriceMgo: t.exposeFloat('bunkerPriceMgo'),
    loadPortDa: t.exposeFloat('loadPortDa'),
    dischargePortDa: t.exposeFloat('dischargePortDa'),
    canalDues: t.exposeFloat('canalDues'),
    grossRevenue: t.exposeFloat('grossRevenue'),
    netRevenue: t.exposeFloat('netRevenue'),
    totalCosts: t.exposeFloat('totalCosts'),
    netResult: t.exposeFloat('netResult'),
    tce: t.exposeFloat('tce'),
    totalDays: t.exposeFloat('totalDays'),
    currency: t.exposeString('currency'),
    notes: t.exposeString('notes', { nullable: true }),
    createdBy: t.exposeString('createdBy', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('voyageEstimateHistory', (t) =>
  t.prismaField({
    type: ['VoyageEstimateHistory'],
    args: {
      voyageId: t.arg.string(),
      charterId: t.arg.string(),
    },
    resolve: (query, _root, args, _ctx) => {
      const where: Record<string, unknown> = {};
      if (args.voyageId) where.voyageId = args.voyageId;
      if (args.charterId) where.charterId = args.charterId;
      return _ctx.prisma.voyageEstimateHistory.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('voyageEstimateHistoryById', (t) =>
  t.prismaField({
    type: 'VoyageEstimateHistory',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.voyageEstimateHistory.findUnique({ ...query, where: { id: args.id } }),
  }),
);

// === Mutations ===

builder.mutationField('saveVoyageEstimate', (t) =>
  t.prismaField({
    type: 'VoyageEstimateHistory',
    args: {
      voyageId: t.arg.string(),
      charterId: t.arg.string(),
      label: t.arg.string({ required: true }),
      vesselName: t.arg.string(),
      vesselDwt: t.arg.float(),
      cargoQuantity: t.arg.float({ required: true }),
      freightRate: t.arg.float({ required: true }),
      freightUnit: t.arg.string(),
      seaDistanceNm: t.arg.float({ required: true }),
      speedKnots: t.arg.float(),
      loadDays: t.arg.float(),
      dischargeDays: t.arg.float(),
      bunkerPriceIfo: t.arg.float(),
      bunkerPriceMgo: t.arg.float(),
      loadPortDa: t.arg.float(),
      dischargePortDa: t.arg.float(),
      canalDues: t.arg.float(),
      grossRevenue: t.arg.float(),
      netRevenue: t.arg.float(),
      totalCosts: t.arg.float(),
      netResult: t.arg.float(),
      tce: t.arg.float(),
      totalDays: t.arg.float(),
      currency: t.arg.string(),
      notes: t.arg.string(),
      createdBy: t.arg.string(),
    },
    resolve: (query, _root, args, _ctx) =>
      _ctx.prisma.voyageEstimateHistory.create({
        ...query,
        data: {
          voyageId: args.voyageId ?? undefined,
          charterId: args.charterId ?? undefined,
          label: args.label,
          vesselName: args.vesselName ?? undefined,
          vesselDwt: args.vesselDwt ?? undefined,
          cargoQuantity: args.cargoQuantity,
          freightRate: args.freightRate,
          freightUnit: args.freightUnit ?? 'per_mt',
          seaDistanceNm: args.seaDistanceNm,
          speedKnots: args.speedKnots ?? 13.5,
          loadDays: args.loadDays ?? 3,
          dischargeDays: args.dischargeDays ?? 4,
          bunkerPriceIfo: args.bunkerPriceIfo ?? 450,
          bunkerPriceMgo: args.bunkerPriceMgo ?? 850,
          loadPortDa: args.loadPortDa ?? 45000,
          dischargePortDa: args.dischargePortDa ?? 55000,
          canalDues: args.canalDues ?? 0,
          grossRevenue: args.grossRevenue ?? 0,
          netRevenue: args.netRevenue ?? 0,
          totalCosts: args.totalCosts ?? 0,
          netResult: args.netResult ?? 0,
          tce: args.tce ?? 0,
          totalDays: args.totalDays ?? 0,
          currency: args.currency ?? 'USD',
          notes: args.notes ?? undefined,
          createdBy: args.createdBy ?? undefined,
        },
      }),
  }),
);

builder.mutationField('deleteVoyageEstimateHistory', (t) =>
  t.prismaField({
    type: 'VoyageEstimateHistory',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.voyageEstimateHistory.delete({ ...query, where: { id: args.id } }),
  }),
);
