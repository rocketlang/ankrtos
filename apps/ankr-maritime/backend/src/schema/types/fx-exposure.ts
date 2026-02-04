import { builder } from '../builder.js';

// === FXExposure ===
builder.prismaObject('FXExposure', {
  fields: (t) => ({
    id: t.exposeID('id'),
    currency: t.exposeString('currency'),
    baseCurrency: t.exposeString('baseCurrency'),
    amount: t.exposeFloat('amount'),
    exposureType: t.exposeString('exposureType'),
    status: t.exposeString('status'),
    spotRate: t.exposeFloat('spotRate', { nullable: true }),
    hedgedAmount: t.exposeFloat('hedgedAmount', { nullable: true }),
    hedgeRate: t.exposeFloat('hedgeRate', { nullable: true }),
    hedgeInstrument: t.exposeString('hedgeInstrument', { nullable: true }),
    hedgeMaturity: t.expose('hedgeMaturity', { type: 'DateTime', nullable: true }),
    counterparty: t.exposeString('counterparty', { nullable: true }),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    organization: t.relation('organization'),
  }),
});

// === Custom Object for FX Summary ===

const FXSummaryEntry = builder.objectRef<{
  currency: string;
  exposureType: string;
  totalAmount: number;
  hedgedAmount: number;
  unhedgedAmount: number;
  avgRate: number;
}>('FXSummaryEntry');

FXSummaryEntry.implement({
  fields: (t) => ({
    currency: t.exposeString('currency'),
    exposureType: t.exposeString('exposureType'),
    totalAmount: t.exposeFloat('totalAmount'),
    hedgedAmount: t.exposeFloat('hedgedAmount'),
    unhedgedAmount: t.exposeFloat('unhedgedAmount'),
    avgRate: t.exposeFloat('avgRate'),
  }),
});

// === Queries ===

builder.queryField('fxExposures', (t) =>
  t.prismaField({
    type: ['FXExposure'],
    args: {
      status: t.arg.string(),
      currency: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.status) where.status = args.status;
      if (args.currency) where.currency = args.currency;
      return ctx.prisma.fXExposure.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('fxExposureSummary', (t) =>
  t.field({
    type: [FXSummaryEntry],
    resolve: async (_root, _args, ctx) => {
      const exposures = await ctx.prisma.fXExposure.findMany({
        where: { ...ctx.orgFilter(), status: { not: 'settled' } },
      });

      const groupKey = (e: { currency: string; exposureType: string }) =>
        `${e.currency}::${e.exposureType}`;

      const groups = new Map<
        string,
        { currency: string; exposureType: string; totalAmount: number; hedgedAmount: number; rateSum: number; rateCount: number }
      >();

      for (const e of exposures) {
        const key = groupKey(e);
        const group = groups.get(key) ?? {
          currency: e.currency,
          exposureType: e.exposureType,
          totalAmount: 0,
          hedgedAmount: 0,
          rateSum: 0,
          rateCount: 0,
        };
        group.totalAmount += e.amount;
        group.hedgedAmount += e.hedgedAmount ?? 0;
        if (e.spotRate) {
          group.rateSum += e.spotRate;
          group.rateCount++;
        }
        groups.set(key, group);
      }

      return Array.from(groups.values()).map((g) => ({
        currency: g.currency,
        exposureType: g.exposureType,
        totalAmount: g.totalAmount,
        hedgedAmount: g.hedgedAmount,
        unhedgedAmount: g.totalAmount - g.hedgedAmount,
        avgRate: g.rateCount > 0 ? g.rateSum / g.rateCount : 0,
      }));
    },
  }),
);

// === Mutations ===

builder.mutationField('createFXExposure', (t) =>
  t.prismaField({
    type: 'FXExposure',
    args: {
      currency: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      exposureType: t.arg.string({ required: true }),
      baseCurrency: t.arg.string(),
      spotRate: t.arg.float(),
      counterparty: t.arg.string(),
      voyageId: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.fXExposure.create({
        ...query,
        data: {
          currency: args.currency,
          amount: args.amount,
          exposureType: args.exposureType,
          baseCurrency: args.baseCurrency ?? 'USD',
          spotRate: args.spotRate ?? undefined,
          counterparty: args.counterparty ?? undefined,
          voyageId: args.voyageId ?? undefined,
          notes: args.notes ?? undefined,
          status: 'open',
          organizationId: ctx.orgId(),
        },
      }),
  }),
);

builder.mutationField('addHedge', (t) =>
  t.prismaField({
    type: 'FXExposure',
    args: {
      id: t.arg.string({ required: true }),
      hedgedAmount: t.arg.float({ required: true }),
      hedgeRate: t.arg.float({ required: true }),
      hedgeInstrument: t.arg.string({ required: true }),
      hedgeMaturity: t.arg({ type: 'DateTime' }),
      counterparty: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const exposure = await ctx.prisma.fXExposure.findUnique({
        where: { id: args.id },
      });
      if (!exposure) throw new Error('FX Exposure not found');

      const newStatus = args.hedgedAmount >= exposure.amount
        ? 'fully_hedged'
        : 'partially_hedged';

      return ctx.prisma.fXExposure.update({
        ...query,
        where: { id: args.id },
        data: {
          hedgedAmount: args.hedgedAmount,
          hedgeRate: args.hedgeRate,
          hedgeInstrument: args.hedgeInstrument,
          hedgeMaturity: args.hedgeMaturity ?? undefined,
          counterparty: args.counterparty ?? undefined,
          status: newStatus,
        },
      });
    },
  }),
);

builder.mutationField('settleFXExposure', (t) =>
  t.prismaField({
    type: 'FXExposure',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.fXExposure.update({
        ...query,
        where: { id: args.id },
        data: { status: 'settled' },
      }),
  }),
);
