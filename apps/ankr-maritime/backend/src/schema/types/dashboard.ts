import { builder } from '../builder.js';

const DashboardStats = builder.objectRef<{
  vesselCount: number;
  portCount: number;
  companyCount: number;
  charterCount: number;
  activeVoyageCount: number;
  cargoCount: number;
}>('DashboardStats');

builder.objectType(DashboardStats, {
  fields: (t) => ({
    vesselCount: t.exposeInt('vesselCount'),
    portCount: t.exposeInt('portCount'),
    companyCount: t.exposeInt('companyCount'),
    charterCount: t.exposeInt('charterCount'),
    activeVoyageCount: t.exposeInt('activeVoyageCount'),
    cargoCount: t.exposeInt('cargoCount'),
  }),
});

builder.queryField('dashboardStats', (t) =>
  t.field({
    type: DashboardStats,
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.user?.organizationId;
      const orgWhere = orgId ? { organizationId: orgId } : {};
      const vesselOrgWhere = orgId ? { vessel: { organizationId: orgId } } : {};
      const [vesselCount, portCount, companyCount, charterCount, activeVoyageCount, cargoCount] =
        await Promise.all([
          ctx.prisma.vessel.count({ where: orgWhere }),
          ctx.prisma.port.count(),
          ctx.prisma.company.count({ where: orgWhere }),
          ctx.prisma.charter.count({ where: orgWhere }),
          ctx.prisma.voyage.count({ where: { status: 'in_progress', ...vesselOrgWhere } }),
          ctx.prisma.cargo.count(),
        ]);
      return { vesselCount, portCount, companyCount, charterCount, activeVoyageCount, cargoCount };
    },
  }),
);

// === Chart Data ===

const VoyageChartItem = builder.objectRef<{
  voyageNumber: string;
  vesselName: string;
  status: string;
  revenue: number;
  costs: number;
  demurrage: number;
  despatch: number;
  netResult: number;
}>('VoyageChartItem');

VoyageChartItem.implement({
  fields: (t) => ({
    voyageNumber: t.exposeString('voyageNumber'),
    vesselName: t.exposeString('vesselName'),
    status: t.exposeString('status'),
    revenue: t.exposeFloat('revenue'),
    costs: t.exposeFloat('costs'),
    demurrage: t.exposeFloat('demurrage'),
    despatch: t.exposeFloat('despatch'),
    netResult: t.exposeFloat('netResult'),
  }),
});

const DaCostBreakdown = builder.objectRef<{ category: string; total: number }>('DaCostBreakdown');
DaCostBreakdown.implement({
  fields: (t) => ({
    category: t.exposeString('category'),
    total: t.exposeFloat('total'),
  }),
});

const VoyageTimeline = builder.objectRef<{
  voyageNumber: string;
  vesselName: string;
  status: string;
  etd: string | null;
  eta: string | null;
  atd: string | null;
  ata: string | null;
  departurePort: string | null;
  arrivalPort: string | null;
}>('VoyageTimeline');

VoyageTimeline.implement({
  fields: (t) => ({
    voyageNumber: t.exposeString('voyageNumber'),
    vesselName: t.exposeString('vesselName'),
    status: t.exposeString('status'),
    etd: t.exposeString('etd', { nullable: true }),
    eta: t.exposeString('eta', { nullable: true }),
    atd: t.exposeString('atd', { nullable: true }),
    ata: t.exposeString('ata', { nullable: true }),
    departurePort: t.exposeString('departurePort', { nullable: true }),
    arrivalPort: t.exposeString('arrivalPort', { nullable: true }),
  }),
});

builder.queryField('voyageChartData', (t) =>
  t.field({
    type: [VoyageChartItem],
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.user?.organizationId;
      const voyages = await ctx.prisma.voyage.findMany({
        where: orgId ? { vessel: { organizationId: orgId } } : {},
        include: {
          vessel: true,
          charter: true,
          cargo: true,
          disbursementAccounts: { include: { lineItems: true } },
          laytimeCalculations: true,
        },
      });
      return voyages.map((v) => {
        let revenue = 0;
        if (v.charter?.freightRate && v.charter.freightUnit === 'lumpsum') {
          revenue = v.charter.freightRate;
        } else if (v.charter?.freightRate && v.cargo?.quantity) {
          revenue = v.charter.freightRate * v.cargo.quantity;
        }
        let costs = 0;
        for (const da of v.disbursementAccounts) {
          for (const li of da.lineItems) costs += li.amount;
        }
        let demurrage = 0;
        let despatch = 0;
        for (const lt of v.laytimeCalculations) {
          if (lt.result === 'on_demurrage' && lt.amountDue > 0) demurrage += lt.amountDue;
          if (lt.result === 'on_despatch' && lt.amountDue < 0) despatch += Math.abs(lt.amountDue);
        }
        return {
          voyageNumber: v.voyageNumber,
          vesselName: v.vessel.name,
          status: v.status,
          revenue,
          costs,
          demurrage,
          despatch,
          netResult: revenue + despatch - costs - demurrage,
        };
      });
    },
  }),
);

builder.queryField('daCostBreakdown', (t) =>
  t.field({
    type: [DaCostBreakdown],
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.user?.organizationId;
      const items = await ctx.prisma.daLineItem.findMany({
        where: orgId ? { disbursementAccount: { voyage: { vessel: { organizationId: orgId } } } } : {},
      });
      const map = new Map<string, number>();
      for (const item of items) {
        map.set(item.category, (map.get(item.category) ?? 0) + item.amount);
      }
      return Array.from(map.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);
    },
  }),
);

builder.queryField('voyageTimeline', (t) =>
  t.field({
    type: [VoyageTimeline],
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.user?.organizationId;
      const voyages = await ctx.prisma.voyage.findMany({
        where: orgId ? { vessel: { organizationId: orgId } } : {},
        include: { vessel: true, departurePort: true, arrivalPort: true },
        orderBy: { createdAt: 'desc' },
      });
      return voyages.map((v) => ({
        voyageNumber: v.voyageNumber,
        vesselName: v.vessel.name,
        status: v.status,
        etd: v.etd?.toISOString() ?? null,
        eta: v.eta?.toISOString() ?? null,
        atd: v.atd?.toISOString() ?? null,
        ata: v.ata?.toISOString() ?? null,
        departurePort: v.departurePort?.name ?? null,
        arrivalPort: v.arrivalPort?.name ?? null,
      }));
    },
  }),
);
