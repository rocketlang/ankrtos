import { builder } from '../builder.js';

// ─── PrismaObject ────────────────────────────────────────────────────────────

builder.prismaObject('PnLEntry', {
  fields: (t) => ({
    id: t.exposeID('id'),
    date: t.expose('date', { type: 'DateTime' }),
    category: t.exposeString('category'),
    subcategory: t.exposeString('subcategory', { nullable: true }),
    route: t.exposeString('route', { nullable: true }),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    positionId: t.exposeString('positionId', { nullable: true }),
    revenue: t.exposeFloat('revenue'),
    cost: t.exposeFloat('cost'),
    pnl: t.exposeFloat('pnl'),
    currency: t.exposeString('currency'),
    exchangeRate: t.exposeFloat('exchangeRate'),
    pnlUsd: t.exposeFloat('pnlUsd'),
    description: t.exposeString('description', { nullable: true }),
    period: t.exposeString('period', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    organization: t.relation('organization'),
    position: t.relation('position', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ─── Custom Object for Reconciliation ────────────────────────────────────────

const ReconciliationResult = builder.objectRef<{
  physicalPnl: number;
  paperPnl: number;
  basisRisk: number;
  hedgeEffectiveness: number;
}>('ReconciliationResult');

ReconciliationResult.implement({
  fields: (t) => ({
    physicalPnl: t.exposeFloat('physicalPnl'),
    paperPnl: t.exposeFloat('paperPnl'),
    basisRisk: t.exposeFloat('basisRisk'),
    hedgeEffectiveness: t.exposeFloat('hedgeEffectiveness'),
  }),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

builder.queryField('pnlEntries', (t) =>
  t.prismaField({
    type: ['PnLEntry'],
    args: {
      category: t.arg.string(),
      startDate: t.arg({ type: 'DateTime' }),
      endDate: t.arg({ type: 'DateTime' }),
      route: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.category) where.category = args.category;
      if (args.route) where.route = args.route;

      if (args.startDate || args.endDate) {
        const dateFilter: Record<string, unknown> = {};
        if (args.startDate) dateFilter.gte = args.startDate;
        if (args.endDate) dateFilter.lte = args.endDate;
        where.date = dateFilter;
      }

      return ctx.prisma.pnLEntry.findMany({
        ...query,
        where,
        orderBy: { date: 'desc' },
      });
    },
  }),
);

// ─── Mutations ───────────────────────────────────────────────────────────────

builder.mutationField('createPnLEntry', (t) =>
  t.prismaField({
    type: 'PnLEntry',
    args: {
      date: t.arg({ type: 'DateTime' }),
      category: t.arg.string({ required: true }),
      subcategory: t.arg.string(),
      route: t.arg.string(),
      voyageId: t.arg.string(),
      positionId: t.arg.string(),
      revenue: t.arg.float({ required: true }),
      cost: t.arg.float({ required: true }),
      currency: t.arg.string(),
      exchangeRate: t.arg.float(),
      description: t.arg.string(),
      period: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const pnl = args.revenue - args.cost;
      const exchangeRate = args.exchangeRate ?? 1;
      const pnlUsd = pnl * exchangeRate;

      return ctx.prisma.pnLEntry.create({
        ...query,
        data: {
          date: args.date ?? new Date(),
          category: args.category,
          subcategory: args.subcategory ?? undefined,
          route: args.route ?? undefined,
          voyageId: args.voyageId ?? undefined,
          positionId: args.positionId ?? undefined,
          revenue: args.revenue,
          cost: args.cost,
          pnl,
          currency: args.currency ?? 'USD',
          exchangeRate,
          pnlUsd,
          description: args.description ?? undefined,
          period: args.period ?? undefined,
          organizationId: ctx.orgId(),
        },
      });
    },
  }),
);

builder.mutationField('reconcilePhysicalPaper', (t) =>
  t.field({
    type: ReconciliationResult,
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      // Fetch all PnL entries for this voyage
      const voyageEntries = await ctx.prisma.pnLEntry.findMany({
        where: {
          ...ctx.orgFilter(),
          voyageId: args.voyageId,
        },
      });

      // Fetch any linked FFA position PnL entries through positions that reference this voyage
      const linkedPositions = await ctx.prisma.fFAPosition.findMany({
        where: {
          ...ctx.orgFilter(),
          physicalVoyageId: args.voyageId,
        },
        select: { id: true },
      });

      const positionIds = linkedPositions.map((p) => p.id);

      let positionEntries: typeof voyageEntries = [];
      if (positionIds.length > 0) {
        positionEntries = await ctx.prisma.pnLEntry.findMany({
          where: {
            ...ctx.orgFilter(),
            positionId: { in: positionIds },
          },
        });
      }

      const allEntries = [...voyageEntries, ...positionEntries];

      // Deduplicate by id (in case an entry links both voyageId and positionId)
      const seen = new Set<string>();
      const uniqueEntries = allEntries.filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });

      let physicalPnl = 0;
      let paperPnl = 0;

      for (const e of uniqueEntries) {
        if (e.category === 'physical') {
          physicalPnl += e.pnlUsd;
        } else if (e.category === 'paper' || e.category === 'hedging') {
          paperPnl += e.pnlUsd;
        }
      }

      const basisRisk = physicalPnl + paperPnl;
      // Hedge effectiveness: how much of physical loss was offset by paper gain
      // A perfect hedge yields 100%. If physical PnL is 0, effectiveness is 100%.
      const hedgeEffectiveness =
        physicalPnl === 0
          ? 100
          : Math.min(100, Math.max(0, (1 - Math.abs(basisRisk) / Math.abs(physicalPnl)) * 100));

      return {
        physicalPnl,
        paperPnl,
        basisRisk,
        hedgeEffectiveness: Math.round(hedgeEffectiveness * 100) / 100,
      };
    },
  }),
);
