import { builder } from '../builder.js';

// ────────────────────────────────────────────────────────────
//  RevenueForecast — Prisma Object
// ────────────────────────────────────────────────────────────

builder.prismaObject('RevenueForecast', {
  fields: (t) => ({
    id: t.exposeID('id'),
    period: t.exposeString('period'),
    year: t.exposeInt('year'),
    month: t.exposeInt('month'),
    category: t.exposeString('category'),
    projectedAmount: t.exposeFloat('projectedAmount'),
    actualAmount: t.exposeFloat('actualAmount', { nullable: true }),
    variance: t.exposeFloat('variance', { nullable: true }),
    confidence: t.exposeFloat('confidence', { nullable: true }),
    methodology: t.exposeString('methodology', { nullable: true }),
    assumptions: t.exposeString('assumptions', { nullable: true }),
    createdBy: t.exposeString('createdBy', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ────────────────────────────────────────────────────────────
//  Custom summary types
// ────────────────────────────────────────────────────────────

const CategoryVariance = builder.objectRef<{
  category: string;
  projected: number;
  actual: number;
  variance: number;
}>('RevenueForecastCategoryVariance');

CategoryVariance.implement({
  fields: (t) => ({
    category: t.exposeString('category'),
    projected: t.exposeFloat('projected'),
    actual: t.exposeFloat('actual'),
    variance: t.exposeFloat('variance'),
  }),
});

const RevenueForecastSummary = builder.objectRef<{
  year: number;
  month: number;
  totalProjected: number;
  totalActual: number;
  variance: number;
  byCategory: { category: string; projected: number; actual: number; variance: number }[];
}>('RevenueForecastSummary');

RevenueForecastSummary.implement({
  fields: (t) => ({
    year: t.exposeInt('year'),
    month: t.exposeInt('month'),
    totalProjected: t.exposeFloat('totalProjected'),
    totalActual: t.exposeFloat('totalActual'),
    variance: t.exposeFloat('variance'),
    byCategory: t.field({
      type: [CategoryVariance],
      resolve: (parent) => parent.byCategory,
    }),
  }),
});

// ────────────────────────────────────────────────────────────
//  Queries
// ────────────────────────────────────────────────────────────

builder.queryField('revenueForecasts', (t) =>
  t.prismaField({
    type: ['RevenueForecast'],
    args: {
      year: t.arg.int(),
      category: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.year != null) where.year = args.year;
      if (args.category) where.category = args.category;
      return ctx.prisma.revenueForecast.findMany({
        ...query,
        where,
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      });
    },
  }),
);

builder.queryField('revenueForecastSummary', (t) =>
  t.field({
    type: [RevenueForecastSummary],
    args: {
      year: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const forecasts = await ctx.prisma.revenueForecast.findMany({
        where: { ...ctx.orgFilter(), year: args.year },
        orderBy: [{ month: 'asc' }],
      });

      // Group by month
      const monthMap = new Map<
        number,
        { totalProjected: number; totalActual: number; categories: Map<string, { projected: number; actual: number }> }
      >();

      for (const f of forecasts) {
        let entry = monthMap.get(f.month);
        if (!entry) {
          entry = { totalProjected: 0, totalActual: 0, categories: new Map() };
          monthMap.set(f.month, entry);
        }
        entry.totalProjected += f.projectedAmount;
        entry.totalActual += f.actualAmount ?? 0;

        const cat = entry.categories.get(f.category);
        if (cat) {
          cat.projected += f.projectedAmount;
          cat.actual += f.actualAmount ?? 0;
        } else {
          entry.categories.set(f.category, {
            projected: f.projectedAmount,
            actual: f.actualAmount ?? 0,
          });
        }
      }

      return Array.from(monthMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([month, data]) => ({
          year: args.year,
          month,
          totalProjected: data.totalProjected,
          totalActual: data.totalActual,
          variance: data.totalActual - data.totalProjected,
          byCategory: Array.from(data.categories.entries())
            .map(([category, vals]) => ({
              category,
              projected: vals.projected,
              actual: vals.actual,
              variance: vals.actual - vals.projected,
            }))
            .sort((a, b) => b.projected - a.projected),
        }));
    },
  }),
);

// ────────────────────────────────────────────────────────────
//  Mutations
// ────────────────────────────────────────────────────────────

builder.mutationField('createRevenueForecast', (t) =>
  t.prismaField({
    type: 'RevenueForecast',
    args: {
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true }),
      category: t.arg.string({ required: true }),
      projectedAmount: t.arg.float({ required: true }),
      confidence: t.arg.float(),
      methodology: t.arg.string(),
      assumptions: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const period = `${monthNames[args.month - 1]}-${args.year}`;

      return ctx.prisma.revenueForecast.create({
        ...query,
        data: {
          period,
          year: args.year,
          month: args.month,
          category: args.category,
          projectedAmount: args.projectedAmount,
          confidence: args.confidence ?? undefined,
          methodology: args.methodology ?? undefined,
          assumptions: args.assumptions ?? undefined,
          createdBy: ctx.user?.id ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('recordActualRevenue', (t) =>
  t.prismaField({
    type: 'RevenueForecast',
    args: {
      id: t.arg.string({ required: true }),
      actualAmount: t.arg.float({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const existing = await ctx.prisma.revenueForecast.findUnique({
        where: { id: args.id },
      });
      if (!existing) throw new Error('Revenue forecast not found');

      const variance = args.actualAmount - existing.projectedAmount;

      return ctx.prisma.revenueForecast.update({
        ...query,
        where: { id: args.id },
        data: {
          actualAmount: args.actualAmount,
          variance,
        },
      });
    },
  }),
);
