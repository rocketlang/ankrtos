import { builder } from '../builder.js';

// ─── Custom Object Types ─────────────────────────────────────────────────────

const RouteExposure = builder.objectRef<{
  route: string;
  longLots: number;
  shortLots: number;
  netLots: number;
  netExposure: number;
  mtmPnl: number;
}>('RouteExposure');

RouteExposure.implement({
  fields: (t) => ({
    route: t.exposeString('route'),
    longLots: t.exposeFloat('longLots'),
    shortLots: t.exposeFloat('shortLots'),
    netLots: t.exposeFloat('netLots'),
    netExposure: t.exposeFloat('netExposure'),
    mtmPnl: t.exposeFloat('mtmPnl'),
  }),
});

const PeriodExposure = builder.objectRef<{
  period: string;
  routes: {
    route: string;
    longLots: number;
    shortLots: number;
    netLots: number;
    netExposure: number;
    mtmPnl: number;
  }[];
  totalMtm: number;
}>('PeriodExposure');

PeriodExposure.implement({
  fields: (t) => ({
    period: t.exposeString('period'),
    routes: t.field({
      type: [RouteExposure],
      resolve: (parent) => parent.routes,
    }),
    totalMtm: t.exposeFloat('totalMtm'),
  }),
});

const PortfolioSummary = builder.objectRef<{
  totalPositions: number;
  openPositions: number;
  totalMtm: number;
  totalMargin: number;
  netExposure: number;
  topRoutes: {
    route: string;
    longLots: number;
    shortLots: number;
    netLots: number;
    netExposure: number;
    mtmPnl: number;
  }[];
}>('PortfolioSummary');

PortfolioSummary.implement({
  fields: (t) => ({
    totalPositions: t.exposeInt('totalPositions'),
    openPositions: t.exposeInt('openPositions'),
    totalMtm: t.exposeFloat('totalMtm'),
    totalMargin: t.exposeFloat('totalMargin'),
    netExposure: t.exposeFloat('netExposure'),
    topRoutes: t.field({
      type: [RouteExposure],
      resolve: (parent) => parent.topRoutes,
    }),
  }),
});

const PnLBreakdown = builder.objectRef<{
  category: string;
  subcategory: string | null;
  revenue: number;
  cost: number;
  pnl: number;
}>('PnLBreakdown');

PnLBreakdown.implement({
  fields: (t) => ({
    category: t.exposeString('category'),
    subcategory: t.exposeString('subcategory', { nullable: true }),
    revenue: t.exposeFloat('revenue'),
    cost: t.exposeFloat('cost'),
    pnl: t.exposeFloat('pnl'),
  }),
});

const PnLSummary = builder.objectRef<{
  physicalPnl: number;
  paperPnl: number;
  hedgingPnl: number;
  basisPnl: number;
  totalPnl: number;
  entries: {
    category: string;
    subcategory: string | null;
    revenue: number;
    cost: number;
    pnl: number;
  }[];
}>('PnLSummary');

PnLSummary.implement({
  fields: (t) => ({
    physicalPnl: t.exposeFloat('physicalPnl'),
    paperPnl: t.exposeFloat('paperPnl'),
    hedgingPnl: t.exposeFloat('hedgingPnl'),
    basisPnl: t.exposeFloat('basisPnl'),
    totalPnl: t.exposeFloat('totalPnl'),
    entries: t.field({
      type: [PnLBreakdown],
      resolve: (parent) => parent.entries,
    }),
  }),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

builder.queryField('ffaPortfolioSummary', (t) =>
  t.field({
    type: PortfolioSummary,
    resolve: async (_root, _args, ctx) => {
      const positions = await ctx.prisma.fFAPosition.findMany({
        where: ctx.orgFilter(),
      });

      const openPositions = positions.filter((p) => p.status === 'open' || p.status === 'partially_closed');

      // Aggregate by route
      const routeMap = new Map<
        string,
        { longLots: number; shortLots: number; mtmPnl: number; exposure: number }
      >();

      let totalMtm = 0;
      let totalMargin = 0;
      let netExposure = 0;

      for (const p of openPositions) {
        const entry = routeMap.get(p.route) ?? {
          longLots: 0,
          shortLots: 0,
          mtmPnl: 0,
          exposure: 0,
        };

        const notional = p.quantity * p.lotSize * (p.currentPrice ?? p.entryPrice);

        if (p.direction === 'long') {
          entry.longLots += p.quantity;
        } else {
          entry.shortLots += p.quantity;
        }
        entry.mtmPnl += p.mtmValue ?? 0;
        entry.exposure += notional;

        routeMap.set(p.route, entry);
        totalMtm += p.mtmValue ?? 0;
        totalMargin += p.margin ?? 0;
        netExposure += notional;
      }

      const topRoutes = Array.from(routeMap.entries())
        .map(([route, data]) => ({
          route,
          longLots: data.longLots,
          shortLots: data.shortLots,
          netLots: data.longLots - data.shortLots,
          netExposure: data.exposure,
          mtmPnl: data.mtmPnl,
        }))
        .sort((a, b) => Math.abs(b.netExposure) - Math.abs(a.netExposure))
        .slice(0, 10);

      return {
        totalPositions: positions.length,
        openPositions: openPositions.length,
        totalMtm,
        totalMargin,
        netExposure,
        topRoutes,
      };
    },
  }),
);

builder.queryField('ffaPnlSummary', (t) =>
  t.field({
    type: PnLSummary,
    args: {
      startDate: t.arg({ type: 'DateTime' }),
      endDate: t.arg({ type: 'DateTime' }),
    },
    resolve: async (_root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };

      if (args.startDate || args.endDate) {
        const dateFilter: Record<string, unknown> = {};
        if (args.startDate) dateFilter.gte = args.startDate;
        if (args.endDate) dateFilter.lte = args.endDate;
        where.date = dateFilter;
      }

      const entries = await ctx.prisma.pnLEntry.findMany({ where });

      // Aggregate by category + subcategory
      const groupKey = (e: { category: string; subcategory: string | null }) =>
        `${e.category}::${e.subcategory ?? ''}`;

      const groups = new Map<
        string,
        { category: string; subcategory: string | null; revenue: number; cost: number; pnl: number }
      >();

      let physicalPnl = 0;
      let paperPnl = 0;
      let hedgingPnl = 0;
      let basisPnl = 0;

      for (const e of entries) {
        const key = groupKey(e);
        const group = groups.get(key) ?? {
          category: e.category,
          subcategory: e.subcategory,
          revenue: 0,
          cost: 0,
          pnl: 0,
        };
        group.revenue += e.revenue;
        group.cost += e.cost;
        group.pnl += e.pnlUsd;
        groups.set(key, group);

        switch (e.category) {
          case 'physical':
            physicalPnl += e.pnlUsd;
            break;
          case 'paper':
            paperPnl += e.pnlUsd;
            break;
          case 'hedging':
            hedgingPnl += e.pnlUsd;
            break;
          case 'basis':
            basisPnl += e.pnlUsd;
            break;
        }
      }

      const totalPnl = physicalPnl + paperPnl + hedgingPnl + basisPnl;

      return {
        physicalPnl,
        paperPnl,
        hedgingPnl,
        basisPnl,
        totalPnl,
        entries: Array.from(groups.values()),
      };
    },
  }),
);

builder.queryField('ffaPositionsByPeriod', (t) =>
  t.field({
    type: [PeriodExposure],
    resolve: async (_root, _args, ctx) => {
      const positions = await ctx.prisma.fFAPosition.findMany({
        where: {
          ...ctx.orgFilter(),
          status: { in: ['open', 'partially_closed'] },
        },
      });

      // Group by period, then by route
      const periodMap = new Map<
        string,
        Map<string, { longLots: number; shortLots: number; mtmPnl: number; exposure: number }>
      >();

      for (const p of positions) {
        if (!periodMap.has(p.period)) {
          periodMap.set(p.period, new Map());
        }
        const routeMap = periodMap.get(p.period)!;
        const entry = routeMap.get(p.route) ?? {
          longLots: 0,
          shortLots: 0,
          mtmPnl: 0,
          exposure: 0,
        };

        const notional = p.quantity * p.lotSize * (p.currentPrice ?? p.entryPrice);

        if (p.direction === 'long') {
          entry.longLots += p.quantity;
        } else {
          entry.shortLots += p.quantity;
        }
        entry.mtmPnl += p.mtmValue ?? 0;
        entry.exposure += notional;

        routeMap.set(p.route, entry);
      }

      return Array.from(periodMap.entries())
        .map(([period, routeMap]) => {
          let totalMtm = 0;
          const routes = Array.from(routeMap.entries()).map(([route, data]) => {
            totalMtm += data.mtmPnl;
            return {
              route,
              longLots: data.longLots,
              shortLots: data.shortLots,
              netLots: data.longLots - data.shortLots,
              netExposure: data.exposure,
              mtmPnl: data.mtmPnl,
            };
          });
          return { period, routes, totalMtm };
        })
        .sort((a, b) => a.period.localeCompare(b.period));
    },
  }),
);
