import { builder } from '../builder.js';

// ────────────────────────────────────────────────────────────
//  FixtureAnalytics — Prisma Object
// ────────────────────────────────────────────────────────────

builder.prismaObject('FixtureAnalytics', {
  fields: (t) => ({
    id: t.exposeID('id'),
    period: t.exposeString('period'),
    periodType: t.exposeString('periodType'),
    year: t.exposeInt('year'),
    month: t.exposeInt('month', { nullable: true }),
    quarter: t.exposeInt('quarter', { nullable: true }),
    vesselType: t.exposeString('vesselType', { nullable: true }),
    route: t.exposeString('route', { nullable: true }),
    cargoType: t.exposeString('cargoType', { nullable: true }),
    fixtureCount: t.exposeInt('fixtureCount'),
    totalRevenue: t.exposeFloat('totalRevenue'),
    avgFreightRate: t.exposeFloat('avgFreightRate', { nullable: true }),
    avgCommission: t.exposeFloat('avgCommission', { nullable: true }),
    avgLaytime: t.exposeFloat('avgLaytime', { nullable: true }),
    avgDemurrage: t.exposeFloat('avgDemurrage', { nullable: true }),
    avgTce: t.exposeFloat('avgTce', { nullable: true }),
    marketShare: t.exposeFloat('marketShare', { nullable: true }),
    winRate: t.exposeFloat('winRate', { nullable: true }),
    avgNegDays: t.exposeFloat('avgNegDays', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ────────────────────────────────────────────────────────────
//  Custom summary types
// ────────────────────────────────────────────────────────────

const TopRoute = builder.objectRef<{
  route: string;
  count: number;
  revenue: number;
}>('FixtureTopRoute');

TopRoute.implement({
  fields: (t) => ({
    route: t.exposeString('route'),
    count: t.exposeInt('count'),
    revenue: t.exposeFloat('revenue'),
  }),
});

const TopVesselType = builder.objectRef<{
  vesselType: string;
  count: number;
  avgRate: number;
}>('FixtureTopVesselType');

TopVesselType.implement({
  fields: (t) => ({
    vesselType: t.exposeString('vesselType'),
    count: t.exposeInt('count'),
    avgRate: t.exposeFloat('avgRate'),
  }),
});

const FixturePerformanceSummary = builder.objectRef<{
  totalFixtures: number;
  totalRevenue: number;
  avgTce: number;
  avgLaytime: number;
  avgDemurrage: number;
  topRoutes: { route: string; count: number; revenue: number }[];
  topVesselTypes: { vesselType: string; count: number; avgRate: number }[];
}>('FixturePerformanceSummary');

FixturePerformanceSummary.implement({
  fields: (t) => ({
    totalFixtures: t.exposeInt('totalFixtures'),
    totalRevenue: t.exposeFloat('totalRevenue'),
    avgTce: t.exposeFloat('avgTce'),
    avgLaytime: t.exposeFloat('avgLaytime'),
    avgDemurrage: t.exposeFloat('avgDemurrage'),
    topRoutes: t.field({
      type: [TopRoute],
      resolve: (parent) => parent.topRoutes,
    }),
    topVesselTypes: t.field({
      type: [TopVesselType],
      resolve: (parent) => parent.topVesselTypes,
    }),
  }),
});

// ────────────────────────────────────────────────────────────
//  Queries
// ────────────────────────────────────────────────────────────

builder.queryField('fixtureAnalytics', (t) =>
  t.prismaField({
    type: ['FixtureAnalytics'],
    args: {
      year: t.arg.int(),
      vesselType: t.arg.string(),
      route: t.arg.string(),
      periodType: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.year != null) where.year = args.year;
      if (args.vesselType) where.vesselType = args.vesselType;
      if (args.route) where.route = args.route;
      if (args.periodType) where.periodType = args.periodType;
      return ctx.prisma.fixtureAnalytics.findMany({
        ...query,
        where,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });
    },
  }),
);

builder.queryField('fixturePerformanceSummary', (t) =>
  t.field({
    type: FixturePerformanceSummary,
    args: {
      year: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const records = await ctx.prisma.fixtureAnalytics.findMany({
        where: { ...ctx.orgFilter(), year: args.year },
      });

      let totalFixtures = 0;
      let totalRevenue = 0;
      let tceSum = 0;
      let tceCount = 0;
      let laytimeSum = 0;
      let laytimeCount = 0;
      let demurrageSum = 0;
      let demurrageCount = 0;

      const routeMap = new Map<string, { count: number; revenue: number }>();
      const vesselTypeMap = new Map<string, { count: number; rateSum: number; rateCount: number }>();

      for (const r of records) {
        totalFixtures += r.fixtureCount;
        totalRevenue += r.totalRevenue;

        if (r.avgTce != null) {
          tceSum += r.avgTce * r.fixtureCount;
          tceCount += r.fixtureCount;
        }
        if (r.avgLaytime != null) {
          laytimeSum += r.avgLaytime * r.fixtureCount;
          laytimeCount += r.fixtureCount;
        }
        if (r.avgDemurrage != null) {
          demurrageSum += r.avgDemurrage * r.fixtureCount;
          demurrageCount += r.fixtureCount;
        }

        if (r.route) {
          const existing = routeMap.get(r.route);
          if (existing) {
            existing.count += r.fixtureCount;
            existing.revenue += r.totalRevenue;
          } else {
            routeMap.set(r.route, { count: r.fixtureCount, revenue: r.totalRevenue });
          }
        }

        if (r.vesselType) {
          const existing = vesselTypeMap.get(r.vesselType);
          if (existing) {
            existing.count += r.fixtureCount;
            if (r.avgFreightRate != null) {
              existing.rateSum += r.avgFreightRate * r.fixtureCount;
              existing.rateCount += r.fixtureCount;
            }
          } else {
            vesselTypeMap.set(r.vesselType, {
              count: r.fixtureCount,
              rateSum: r.avgFreightRate != null ? r.avgFreightRate * r.fixtureCount : 0,
              rateCount: r.avgFreightRate != null ? r.fixtureCount : 0,
            });
          }
        }
      }

      const topRoutes = Array.from(routeMap.entries())
        .map(([route, data]) => ({ route, count: data.count, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const topVesselTypes = Array.from(vesselTypeMap.entries())
        .map(([vesselType, data]) => ({
          vesselType,
          count: data.count,
          avgRate: data.rateCount > 0 ? data.rateSum / data.rateCount : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalFixtures,
        totalRevenue,
        avgTce: tceCount > 0 ? tceSum / tceCount : 0,
        avgLaytime: laytimeCount > 0 ? laytimeSum / laytimeCount : 0,
        avgDemurrage: demurrageCount > 0 ? demurrageSum / demurrageCount : 0,
        topRoutes,
        topVesselTypes,
      };
    },
  }),
);

// ────────────────────────────────────────────────────────────
//  Mutations
// ────────────────────────────────────────────────────────────

builder.mutationField('createFixtureAnalytics', (t) =>
  t.prismaField({
    type: 'FixtureAnalytics',
    args: {
      period: t.arg.string({ required: true }),
      periodType: t.arg.string({ required: true }),
      year: t.arg.int({ required: true }),
      month: t.arg.int(),
      quarter: t.arg.int(),
      vesselType: t.arg.string(),
      route: t.arg.string(),
      cargoType: t.arg.string(),
      fixtureCount: t.arg.int({ required: true }),
      totalRevenue: t.arg.float({ required: true }),
      avgFreightRate: t.arg.float(),
      avgCommission: t.arg.float(),
      avgLaytime: t.arg.float(),
      avgDemurrage: t.arg.float(),
      avgTce: t.arg.float(),
      marketShare: t.arg.float(),
      winRate: t.arg.float(),
      avgNegDays: t.arg.float(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      return ctx.prisma.fixtureAnalytics.create({
        ...query,
        data: {
          period: args.period,
          periodType: args.periodType,
          year: args.year,
          month: args.month ?? undefined,
          quarter: args.quarter ?? undefined,
          vesselType: args.vesselType ?? undefined,
          route: args.route ?? undefined,
          cargoType: args.cargoType ?? undefined,
          fixtureCount: args.fixtureCount,
          totalRevenue: args.totalRevenue,
          avgFreightRate: args.avgFreightRate ?? undefined,
          avgCommission: args.avgCommission ?? undefined,
          avgLaytime: args.avgLaytime ?? undefined,
          avgDemurrage: args.avgDemurrage ?? undefined,
          avgTce: args.avgTce ?? undefined,
          marketShare: args.marketShare ?? undefined,
          winRate: args.winRate ?? undefined,
          avgNegDays: args.avgNegDays ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('generateFixtureAnalytics', (t) =>
  t.prismaField({
    type: ['FixtureAnalytics'],
    args: {
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const period = `${monthNames[args.month - 1]}-${args.year}`;

      // Date range for the requested month
      const startDate = new Date(args.year, args.month - 1, 1);
      const endDate = new Date(args.year, args.month, 1);

      // Aggregate fixture data from charters fixed in this period
      const charters = await ctx.prisma.charter.findMany({
        where: {
          organizationId: orgId,
          fixtureDate: { gte: startDate, lt: endDate },
          status: { in: ['fixed', 'executed', 'completed'] },
        },
        include: {
          voyages: {
            include: {
              vessel: true,
              cargo: true,
              laytimeCalculations: true,
            },
          },
        },
      });

      // Group by vessel type
      const groupMap = new Map<
        string,
        {
          vesselType: string;
          count: number;
          revenue: number;
          rates: number[];
          laytimes: number[];
          demurrages: number[];
          tces: number[];
        }
      >();

      for (const c of charters) {
        for (const v of c.voyages) {
          const vType = v.vessel.type || 'unknown';
          let entry = groupMap.get(vType);
          if (!entry) {
            entry = { vesselType: vType, count: 0, revenue: 0, rates: [], laytimes: [], demurrages: [], tces: [] };
            groupMap.set(vType, entry);
          }
          entry.count += 1;

          // Calculate revenue
          let rev = 0;
          if (c.freightRate && c.freightUnit === 'lumpsum') {
            rev = c.freightRate;
          } else if (c.freightRate && v.cargo?.quantity) {
            rev = c.freightRate * v.cargo.quantity;
          }
          entry.revenue += rev;
          if (c.freightRate) entry.rates.push(c.freightRate);

          // Laytime and demurrage
          for (const lt of v.laytimeCalculations) {
            if (lt.usedHours != null) entry.laytimes.push(lt.usedHours / 24);
            if (lt.result === 'on_demurrage' && lt.amountDue > 0) entry.demurrages.push(lt.amountDue);
          }

          // TCE calculation: (revenue - voyage costs) / voyage days
          if (v.atd && v.ata) {
            const days = (v.ata.getTime() - v.atd.getTime()) / (1000 * 60 * 60 * 24);
            if (days > 0) entry.tces.push(rev / days);
          }
        }
      }

      const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined);

      // Create analytics records for each vessel type
      const created: string[] = [];
      for (const [, data] of groupMap) {
        const record = await ctx.prisma.fixtureAnalytics.create({
          ...query,
          data: {
            period,
            periodType: 'monthly',
            year: args.year,
            month: args.month,
            vesselType: data.vesselType,
            fixtureCount: data.count,
            totalRevenue: data.revenue,
            avgFreightRate: avg(data.rates),
            avgLaytime: avg(data.laytimes),
            avgDemurrage: avg(data.demurrages),
            avgTce: avg(data.tces),
            organizationId: orgId,
          },
        });
        created.push(record.id);
      }

      // If no charters found, create a zero-count record
      if (created.length === 0) {
        const record = await ctx.prisma.fixtureAnalytics.create({
          ...query,
          data: {
            period,
            periodType: 'monthly',
            year: args.year,
            month: args.month,
            fixtureCount: 0,
            totalRevenue: 0,
            organizationId: orgId,
          },
        });
        created.push(record.id);
      }

      return ctx.prisma.fixtureAnalytics.findMany({
        ...query,
        where: { id: { in: created } },
      });
    },
  }),
);
