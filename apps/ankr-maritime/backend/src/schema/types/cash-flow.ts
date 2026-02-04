import { builder } from '../builder.js';

// ────────────────────────────────────────────────────────────
//  CashFlowEntry — Prisma Object
// ────────────────────────────────────────────────────────────

builder.prismaObject('CashFlowEntry', {
  fields: (t) => ({
    id: t.exposeID('id'),
    date: t.expose('date', { type: 'DateTime' }),
    type: t.exposeString('type'),
    category: t.exposeString('category'),
    description: t.exposeString('description', { nullable: true }),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    amountUsd: t.exposeFloat('amountUsd', { nullable: true }),
    voyageRef: t.exposeString('voyageRef', { nullable: true }),
    vesselName: t.exposeString('vesselName', { nullable: true }),
    counterparty: t.exposeString('counterparty', { nullable: true }),
    isProjected: t.exposeBoolean('isProjected'),
    isReconciled: t.exposeBoolean('isReconciled'),
    bankAccount: t.exposeString('bankAccount', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ────────────────────────────────────────────────────────────
//  Custom summary types
// ────────────────────────────────────────────────────────────

const CashFlowCategoryTotal = builder.objectRef<{
  category: string;
  total: number;
}>('CashFlowCategoryTotal');

CashFlowCategoryTotal.implement({
  fields: (t) => ({
    category: t.exposeString('category'),
    total: t.exposeFloat('total'),
  }),
});

const CashFlowMonthCumulative = builder.objectRef<{
  month: string;
  inflow: number;
  outflow: number;
  cumulative: number;
}>('CashFlowMonthCumulative');

CashFlowMonthCumulative.implement({
  fields: (t) => ({
    month: t.exposeString('month'),
    inflow: t.exposeFloat('inflow'),
    outflow: t.exposeFloat('outflow'),
    cumulative: t.exposeFloat('cumulative'),
  }),
});

const CashFlowSummary = builder.objectRef<{
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  byCategory: { category: string; total: number }[];
  projectedBalance: number;
  cumulativeByMonth: { month: string; inflow: number; outflow: number; cumulative: number }[];
}>('CashFlowSummary');

CashFlowSummary.implement({
  fields: (t) => ({
    totalInflow: t.exposeFloat('totalInflow'),
    totalOutflow: t.exposeFloat('totalOutflow'),
    netCashFlow: t.exposeFloat('netCashFlow'),
    byCategory: t.field({
      type: [CashFlowCategoryTotal],
      resolve: (parent) => parent.byCategory,
    }),
    projectedBalance: t.exposeFloat('projectedBalance'),
    cumulativeByMonth: t.field({
      type: [CashFlowMonthCumulative],
      resolve: (parent) => parent.cumulativeByMonth,
    }),
  }),
});

// ────────────────────────────────────────────────────────────
//  Queries
// ────────────────────────────────────────────────────────────

builder.queryField('cashFlowEntries', (t) =>
  t.prismaField({
    type: ['CashFlowEntry'],
    args: {
      dateFrom: t.arg({ type: 'DateTime' }),
      dateTo: t.arg({ type: 'DateTime' }),
      type: t.arg.string(),
      category: t.arg.string(),
      isProjected: t.arg.boolean(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.dateFrom || args.dateTo) {
        const dateFilter: Record<string, unknown> = {};
        if (args.dateFrom) dateFilter.gte = args.dateFrom;
        if (args.dateTo) dateFilter.lte = args.dateTo;
        where.date = dateFilter;
      }
      if (args.type) where.type = args.type;
      if (args.category) where.category = args.category;
      if (args.isProjected != null) where.isProjected = args.isProjected;
      return ctx.prisma.cashFlowEntry.findMany({
        ...query,
        where,
        orderBy: { date: 'desc' },
      });
    },
  }),
);

builder.queryField('cashFlowSummary', (t) =>
  t.field({
    type: CashFlowSummary,
    args: {
      year: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const startDate = new Date(args.year, 0, 1);
      const endDate = new Date(args.year + 1, 0, 1);

      const entries = await ctx.prisma.cashFlowEntry.findMany({
        where: {
          ...ctx.orgFilter(),
          date: { gte: startDate, lt: endDate },
        },
        orderBy: { date: 'asc' },
      });

      let totalInflow = 0;
      let totalOutflow = 0;
      let projectedInflow = 0;
      let projectedOutflow = 0;

      const categoryMap = new Map<string, number>();
      const monthMap = new Map<string, { inflow: number; outflow: number }>();

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      for (const e of entries) {
        const amount = Math.abs(e.amountUsd ?? e.amount);
        const monthKey = `${monthNames[e.date.getMonth()]}-${args.year}`;

        if (e.type === 'inflow') {
          totalInflow += amount;
          if (e.isProjected) projectedInflow += amount;
        } else {
          totalOutflow += amount;
          if (e.isProjected) projectedOutflow += amount;
        }

        // Category totals
        const catKey = `${e.type}:${e.category}`;
        categoryMap.set(catKey, (categoryMap.get(catKey) ?? 0) + amount);

        // Monthly buckets
        let monthEntry = monthMap.get(monthKey);
        if (!monthEntry) {
          monthEntry = { inflow: 0, outflow: 0 };
          monthMap.set(monthKey, monthEntry);
        }
        if (e.type === 'inflow') {
          monthEntry.inflow += amount;
        } else {
          monthEntry.outflow += amount;
        }
      }

      // Build byCategory sorted by total descending
      const byCategory = Array.from(categoryMap.entries())
        .map(([key, total]) => {
          const [, category] = key.split(':');
          return { category, total };
        })
        .sort((a, b) => b.total - a.total);

      // Build cumulativeByMonth in calendar order
      let cumulative = 0;
      const cumulativeByMonth: { month: string; inflow: number; outflow: number; cumulative: number }[] = [];

      for (let m = 0; m < 12; m++) {
        const key = `${monthNames[m]}-${args.year}`;
        const data = monthMap.get(key);
        const inflow = data?.inflow ?? 0;
        const outflow = data?.outflow ?? 0;
        cumulative += inflow - outflow;
        cumulativeByMonth.push({ month: key, inflow, outflow, cumulative });
      }

      const netCashFlow = totalInflow - totalOutflow;
      const projectedBalance = netCashFlow + (projectedInflow - projectedOutflow);

      return {
        totalInflow,
        totalOutflow,
        netCashFlow,
        byCategory,
        projectedBalance,
        cumulativeByMonth,
      };
    },
  }),
);

// ────────────────────────────────────────────────────────────
//  Mutations
// ────────────────────────────────────────────────────────────

builder.mutationField('createCashFlowEntry', (t) =>
  t.prismaField({
    type: 'CashFlowEntry',
    args: {
      date: t.arg({ type: 'DateTime', required: true }),
      type: t.arg.string({ required: true }),
      category: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      description: t.arg.string(),
      currency: t.arg.string(),
      amountUsd: t.arg.float(),
      voyageRef: t.arg.string(),
      vesselName: t.arg.string(),
      counterparty: t.arg.string(),
      isProjected: t.arg.boolean(),
      bankAccount: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      return ctx.prisma.cashFlowEntry.create({
        ...query,
        data: {
          date: args.date,
          type: args.type,
          category: args.category,
          amount: args.amount,
          description: args.description ?? undefined,
          currency: args.currency ?? 'USD',
          amountUsd: args.amountUsd ?? undefined,
          voyageRef: args.voyageRef ?? undefined,
          vesselName: args.vesselName ?? undefined,
          counterparty: args.counterparty ?? undefined,
          isProjected: args.isProjected ?? false,
          bankAccount: args.bankAccount ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('reconcileCashFlowEntry', (t) =>
  t.prismaField({
    type: 'CashFlowEntry',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const existing = await ctx.prisma.cashFlowEntry.findUnique({
        where: { id: args.id },
      });
      if (!existing) throw new Error('Cash flow entry not found');
      if (existing.isReconciled) throw new Error('Entry is already reconciled');

      return ctx.prisma.cashFlowEntry.update({
        ...query,
        where: { id: args.id },
        data: { isReconciled: true },
      });
    },
  }),
);

builder.mutationField('projectCashFlow', (t) =>
  t.prismaField({
    type: ['CashFlowEntry'],
    args: {
      months: t.arg.int({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      if (args.months < 1 || args.months > 24) {
        throw new Error('Months must be between 1 and 24');
      }

      // Look back 6 months for recurring patterns
      const now = new Date();
      const lookbackStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);

      const historicalEntries = await ctx.prisma.cashFlowEntry.findMany({
        where: {
          organizationId: orgId,
          isProjected: false,
          date: { gte: lookbackStart, lt: now },
        },
        orderBy: { date: 'asc' },
      });

      // Build monthly averages by category
      const categoryAverages = new Map<string, { type: string; totalAmount: number; count: number }>();

      for (const e of historicalEntries) {
        const key = `${e.type}:${e.category}`;
        const existing = categoryAverages.get(key);
        const amount = Math.abs(e.amountUsd ?? e.amount);
        if (existing) {
          existing.totalAmount += amount;
          existing.count += 1;
        } else {
          categoryAverages.set(key, { type: e.type, totalAmount: amount, count: 1 });
        }
      }

      // Number of months in lookback with data
      const monthsWithData = new Set<string>();
      for (const e of historicalEntries) {
        monthsWithData.add(`${e.date.getFullYear()}-${e.date.getMonth()}`);
      }
      const numMonths = Math.max(monthsWithData.size, 1);

      // Create projected entries for each future month
      const createdIds: string[] = [];

      for (let m = 1; m <= args.months; m++) {
        const projDate = new Date(now.getFullYear(), now.getMonth() + m, 15);

        for (const [key, data] of categoryAverages) {
          const [type, category] = key.split(':');
          const monthlyAvg = data.totalAmount / numMonths;
          if (monthlyAvg < 1) continue; // Skip negligible amounts

          const record = await ctx.prisma.cashFlowEntry.create({
            ...query,
            data: {
              date: projDate,
              type,
              category,
              amount: type === 'outflow' ? -monthlyAvg : monthlyAvg,
              currency: 'USD',
              amountUsd: monthlyAvg,
              description: `Projected ${category} based on ${numMonths}-month average`,
              isProjected: true,
              isReconciled: false,
              organizationId: orgId,
            },
          });
          createdIds.push(record.id);
        }
      }

      return ctx.prisma.cashFlowEntry.findMany({
        ...query,
        where: { id: { in: createdIds } },
        orderBy: { date: 'asc' },
      });
    },
  }),
);
