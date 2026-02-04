import { builder } from '../builder.js';

// ────────────────────────────────────────────────────────────
//  TonnageHeatmap — Prisma Object
// ────────────────────────────────────────────────────────────

builder.prismaObject('TonnageHeatmap', {
  fields: (t) => ({
    id: t.exposeID('id'),
    snapshotDate: t.expose('snapshotDate', { type: 'DateTime' }),
    region: t.exposeString('region'),
    vesselType: t.exposeString('vesselType'),
    availableCount: t.exposeInt('availableCount'),
    onPassageCount: t.exposeInt('onPassageCount'),
    totalCount: t.exposeInt('totalCount'),
    avgAge: t.exposeFloat('avgAge', { nullable: true }),
    demandCount: t.exposeInt('demandCount'),
    supplyDemandRatio: t.exposeFloat('supplyDemandRatio', { nullable: true }),
    avgRate: t.exposeFloat('avgRate', { nullable: true }),
    weekOverWeek: t.exposeFloat('weekOverWeek', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// ────────────────────────────────────────────────────────────
//  Custom summary types
// ────────────────────────────────────────────────────────────

const TonnageSupplyDemand = builder.objectRef<{
  region: string;
  vesselType: string;
  supply: number;
  demand: number;
  ratio: number;
  trend: string;
}>('TonnageSupplyDemand');

TonnageSupplyDemand.implement({
  fields: (t) => ({
    region: t.exposeString('region'),
    vesselType: t.exposeString('vesselType'),
    supply: t.exposeInt('supply'),
    demand: t.exposeInt('demand'),
    ratio: t.exposeFloat('ratio'),
    trend: t.exposeString('trend'),
  }),
});

// ────────────────────────────────────────────────────────────
//  Queries
// ────────────────────────────────────────────────────────────

builder.queryField('tonnageHeatmaps', (t) =>
  t.prismaField({
    type: ['TonnageHeatmap'],
    args: {
      snapshotDate: t.arg({ type: 'DateTime' }),
      region: t.arg.string(),
      vesselType: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.snapshotDate) where.snapshotDate = args.snapshotDate;
      if (args.region) where.region = args.region;
      if (args.vesselType) where.vesselType = args.vesselType;
      return ctx.prisma.tonnageHeatmap.findMany({
        ...query,
        where,
        orderBy: [{ snapshotDate: 'desc' }, { region: 'asc' }],
      });
    },
  }),
);

builder.queryField('latestTonnageSnapshot', (t) =>
  t.prismaField({
    type: ['TonnageHeatmap'],
    resolve: async (query, _root, _args, ctx) => {
      // Find the most recent snapshot date for this org
      const latest = await ctx.prisma.tonnageHeatmap.findFirst({
        where: ctx.orgFilter(),
        orderBy: { snapshotDate: 'desc' },
        select: { snapshotDate: true },
      });

      if (!latest) return [];

      return ctx.prisma.tonnageHeatmap.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          snapshotDate: latest.snapshotDate,
        },
        orderBy: [{ region: 'asc' }, { vesselType: 'asc' }],
      });
    },
  }),
);

builder.queryField('tonnageSupplyDemand', (t) =>
  t.field({
    type: [TonnageSupplyDemand],
    resolve: async (_root, _args, ctx) => {
      // Get latest snapshot
      const latest = await ctx.prisma.tonnageHeatmap.findFirst({
        where: ctx.orgFilter(),
        orderBy: { snapshotDate: 'desc' },
        select: { snapshotDate: true },
      });

      if (!latest) return [];

      const snapshots = await ctx.prisma.tonnageHeatmap.findMany({
        where: {
          ...ctx.orgFilter(),
          snapshotDate: latest.snapshotDate,
        },
      });

      return snapshots.map((s) => {
        const supply = s.availableCount + s.onPassageCount;
        const demand = s.demandCount;
        const ratio = demand > 0 ? supply / demand : supply > 0 ? 999 : 0;

        let trend = 'stable';
        if (s.weekOverWeek != null) {
          if (s.weekOverWeek > 5) trend = 'tightening';
          else if (s.weekOverWeek < -5) trend = 'loosening';
        }

        return {
          region: s.region,
          vesselType: s.vesselType,
          supply,
          demand,
          ratio: Math.round(ratio * 100) / 100,
          trend,
        };
      });
    },
  }),
);

// ────────────────────────────────────────────────────────────
//  Mutations
// ────────────────────────────────────────────────────────────

builder.mutationField('createTonnageSnapshot', (t) =>
  t.prismaField({
    type: 'TonnageHeatmap',
    args: {
      snapshotDate: t.arg({ type: 'DateTime', required: true }),
      region: t.arg.string({ required: true }),
      vesselType: t.arg.string({ required: true }),
      availableCount: t.arg.int({ required: true }),
      onPassageCount: t.arg.int(),
      demandCount: t.arg.int(),
      avgAge: t.arg.float(),
      avgRate: t.arg.float(),
      weekOverWeek: t.arg.float(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const available = args.availableCount;
      const onPassage = args.onPassageCount ?? 0;
      const totalCount = available + onPassage;
      const demand = args.demandCount ?? 0;
      const supplyDemandRatio = demand > 0 ? totalCount / demand : null;

      return ctx.prisma.tonnageHeatmap.create({
        ...query,
        data: {
          snapshotDate: args.snapshotDate,
          region: args.region,
          vesselType: args.vesselType,
          availableCount: available,
          onPassageCount: onPassage,
          totalCount,
          avgAge: args.avgAge ?? undefined,
          demandCount: demand,
          supplyDemandRatio,
          avgRate: args.avgRate ?? undefined,
          weekOverWeek: args.weekOverWeek ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('generateTonnageSnapshot', (t) =>
  t.prismaField({
    type: ['TonnageHeatmap'],
    args: {
      snapshotDate: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.orgId();

      const regions = ['AG', 'WAF', 'USG', 'ECSA', 'SEA', 'NOPAC', 'Med', 'Baltic', 'UKC', 'ECI'];
      const vesselTypes = ['VLCC', 'Suezmax', 'Aframax', 'Capesize', 'Panamax', 'Supramax', 'Handysize'];

      // Look for previous snapshot to calculate week-over-week
      const prevDate = new Date(args.snapshotDate);
      prevDate.setDate(prevDate.getDate() - 7);

      const previousSnapshots = await ctx.prisma.tonnageHeatmap.findMany({
        where: {
          organizationId: orgId,
          snapshotDate: prevDate,
        },
      });
      const prevMap = new Map<string, number>();
      for (const p of previousSnapshots) {
        prevMap.set(`${p.region}:${p.vesselType}`, p.totalCount);
      }

      // Generate demo data for all region/vesselType combinations
      const createdIds: string[] = [];

      for (const region of regions) {
        for (const vt of vesselTypes) {
          // Deterministic pseudo-random based on region + vesselType hash
          const seed = (region + vt).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
          const available = 2 + (seed % 18);
          const onPassage = 1 + (seed % 8);
          const totalCount = available + onPassage;
          const demand = 1 + (seed % 14);
          const supplyDemandRatio = demand > 0 ? totalCount / demand : null;
          const avgAge = 5 + (seed % 20);
          const avgRate = 8000 + (seed % 40) * 500;

          const prevTotal = prevMap.get(`${region}:${vt}`);
          const weekOverWeek =
            prevTotal != null && prevTotal > 0
              ? ((totalCount - prevTotal) / prevTotal) * 100
              : null;

          const record = await ctx.prisma.tonnageHeatmap.create({
            ...query,
            data: {
              snapshotDate: args.snapshotDate,
              region,
              vesselType: vt,
              availableCount: available,
              onPassageCount: onPassage,
              totalCount,
              avgAge,
              demandCount: demand,
              supplyDemandRatio: supplyDemandRatio != null ? Math.round(supplyDemandRatio * 100) / 100 : null,
              avgRate,
              weekOverWeek: weekOverWeek != null ? Math.round(weekOverWeek * 100) / 100 : null,
              organizationId: orgId,
            },
          });
          createdIds.push(record.id);
        }
      }

      return ctx.prisma.tonnageHeatmap.findMany({
        ...query,
        where: { id: { in: createdIds } },
        orderBy: [{ region: 'asc' }, { vesselType: 'asc' }],
      });
    },
  }),
);
