import { builder } from '../builder.js';

// ────────────────────────────────────────────────────────────
//  ETS Allowance — Prisma Object
// ────────────────────────────────────────────────────────────

builder.prismaObject('EtsAllowance', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId', { nullable: true }),
    vesselName: t.exposeString('vesselName', { nullable: true }),
    year: t.exposeInt('year'),
    type: t.exposeString('type'),
    quantity: t.exposeFloat('quantity'),
    pricePerUnit: t.exposeFloat('pricePerUnit', { nullable: true }),
    totalCost: t.exposeFloat('totalCost', { nullable: true }),
    currency: t.exposeString('currency'),
    source: t.exposeString('source', { nullable: true }),
    status: t.exposeString('status'),
    surrenderDate: t.expose('surrenderDate', { type: 'DateTime', nullable: true }),
    expiryDate: t.expose('expiryDate', { type: 'DateTime', nullable: true }),
    tradeReference: t.exposeString('tradeReference', { nullable: true }),
    counterparty: t.exposeString('counterparty', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ────────────────────────────────────────────────────────────
//  Custom return type: EtsBalance
// ────────────────────────────────────────────────────────────

const EtsBalance = builder.objectRef<{
  year: number;
  totalAllocated: number;
  totalPurchased: number;
  totalSurrendered: number;
  remaining: number;
  totalCost: number;
}>('EtsBalance');

EtsBalance.implement({
  fields: (t) => ({
    year: t.exposeInt('year'),
    totalAllocated: t.exposeFloat('totalAllocated'),
    totalPurchased: t.exposeFloat('totalPurchased'),
    totalSurrendered: t.exposeFloat('totalSurrendered'),
    remaining: t.exposeFloat('remaining'),
    totalCost: t.exposeFloat('totalCost'),
  }),
});

// ────────────────────────────────────────────────────────────
//  Queries
// ────────────────────────────────────────────────────────────

builder.queryField('etsAllowances', (t) =>
  t.prismaField({
    type: ['EtsAllowance'],
    args: {
      year: t.arg.int(),
      status: t.arg.string(),
      vesselId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.year != null) where.year = args.year;
      if (args.status) where.status = args.status;
      if (args.vesselId) where.vesselId = args.vesselId;
      return ctx.prisma.etsAllowance.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('etsAllowanceBalance', (t) =>
  t.field({
    type: EtsBalance,
    args: {
      year: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const allowances = await ctx.prisma.etsAllowance.findMany({
        where: { ...ctx.orgFilter(), year: args.year },
      });

      let totalAllocated = 0;
      let totalPurchased = 0;
      let totalSurrendered = 0;
      let totalCost = 0;

      for (const a of allowances) {
        if (a.type === 'allocation') {
          totalAllocated += a.quantity;
        } else if (a.type === 'purchase') {
          totalPurchased += a.quantity;
        }

        if (a.status === 'surrendered') {
          totalSurrendered += a.quantity;
        }

        totalCost += a.totalCost ?? 0;
      }

      const remaining = totalAllocated + totalPurchased - totalSurrendered;

      return {
        year: args.year,
        totalAllocated,
        totalPurchased,
        totalSurrendered,
        remaining,
        totalCost,
      };
    },
  }),
);

// ────────────────────────────────────────────────────────────
//  Mutations
// ────────────────────────────────────────────────────────────

builder.mutationField('purchaseEtsAllowance', (t) =>
  t.prismaField({
    type: 'EtsAllowance',
    args: {
      vesselId: t.arg.string(),
      vesselName: t.arg.string(),
      year: t.arg.int({ required: true }),
      quantity: t.arg.float({ required: true }),
      pricePerUnit: t.arg.float({ required: true }),
      currency: t.arg.string(),
      source: t.arg.string(),
      tradeReference: t.arg.string(),
      counterparty: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const totalCost = args.quantity * args.pricePerUnit;
      return ctx.prisma.etsAllowance.create({
        ...query,
        data: {
          vesselId: args.vesselId ?? undefined,
          vesselName: args.vesselName ?? undefined,
          year: args.year,
          type: 'purchase',
          quantity: args.quantity,
          pricePerUnit: args.pricePerUnit,
          totalCost,
          currency: args.currency ?? 'EUR',
          source: args.source ?? undefined,
          status: 'active',
          tradeReference: args.tradeReference ?? undefined,
          counterparty: args.counterparty ?? undefined,
          notes: args.notes ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('surrenderEtsAllowance', (t) =>
  t.prismaField({
    type: 'EtsAllowance',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const existing = await ctx.prisma.etsAllowance.findUnique({
        where: { id: args.id },
      });
      if (!existing) throw new Error('ETS allowance not found');
      if (existing.status === 'surrendered') {
        throw new Error('Allowance is already surrendered');
      }

      return ctx.prisma.etsAllowance.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'surrendered',
          surrenderDate: new Date(),
        },
      });
    },
  }),
);

builder.mutationField('carryOverAllowance', (t) =>
  t.prismaField({
    type: 'EtsAllowance',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const existing = await ctx.prisma.etsAllowance.findUnique({
        where: { id: args.id },
      });
      if (!existing) throw new Error('ETS allowance not found');
      if (existing.status !== 'active') {
        throw new Error('Only active allowances can be carried over');
      }

      return ctx.prisma.etsAllowance.create({
        ...query,
        data: {
          vesselId: existing.vesselId,
          vesselName: existing.vesselName,
          year: existing.year + 1,
          type: 'carry_over',
          quantity: existing.quantity,
          pricePerUnit: existing.pricePerUnit,
          totalCost: existing.totalCost,
          currency: existing.currency,
          source: `Carried over from ${existing.year}`,
          status: 'active',
          notes: `Carry-over from allowance ${existing.id} (${existing.year})`,
          organizationId: existing.organizationId,
        },
      });
    },
  }),
);
