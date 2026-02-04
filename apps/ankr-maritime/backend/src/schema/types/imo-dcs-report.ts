import { builder } from '../builder.js';
import { ciiAlertService } from '../../services/cii-alert-service.js';

// ────────────────────────────────────────────────────────────
//  IMO DCS Report — Prisma Object
//  JSON scalar is already declared in builder.ts — reuse it.
// ────────────────────────────────────────────────────────────

builder.prismaObject('ImoDcsReport', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    vesselName: t.exposeString('vesselName'),
    imoNumber: t.exposeString('imoNumber'),
    year: t.exposeInt('year'),
    reportingPeriod: t.exposeString('reportingPeriod'),
    flagState: t.exposeString('flagState'),
    grossTonnage: t.exposeFloat('grossTonnage'),
    netTonnage: t.exposeFloat('netTonnage', { nullable: true }),
    dwt: t.exposeFloat('dwt'),
    distanceTravelled: t.exposeFloat('distanceTravelled'),
    hoursUnderway: t.exposeFloat('hoursUnderway'),
    fuelConsumption: t.expose('fuelConsumption', { type: 'JSON' }),
    totalCo2: t.exposeFloat('totalCo2'),
    transportWork: t.exposeFloat('transportWork', { nullable: true }),
    eeoi: t.exposeFloat('eeoi', { nullable: true }),
    ciiRating: t.exposeString('ciiRating', { nullable: true }),
    ciiValue: t.exposeFloat('ciiValue', { nullable: true }),
    ciiRequired: t.exposeFloat('ciiRequired', { nullable: true }),
    submissionDate: t.expose('submissionDate', { type: 'DateTime', nullable: true }),
    verifiedBy: t.exposeString('verifiedBy', { nullable: true }),
    verificationDate: t.expose('verificationDate', { type: 'DateTime', nullable: true }),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ────────────────────────────────────────────────────────────
//  Custom types for fleet overview
// ────────────────────────────────────────────────────────────

const DcsRatingCount = builder.objectRef<{
  rating: string;
  count: number;
}>('DcsRatingCount');

DcsRatingCount.implement({
  fields: (t) => ({
    rating: t.exposeString('rating'),
    count: t.exposeInt('count'),
  }),
});

const FleetDcsOverview = builder.objectRef<{
  year: number;
  vesselCount: number;
  totalCo2: number;
  avgCiiValue: number;
  ratingDistribution: { rating: string; count: number }[];
  totalDistanceTravelled: number;
  totalFuelConsumption: number;
}>('FleetDcsOverview');

FleetDcsOverview.implement({
  fields: (t) => ({
    year: t.exposeInt('year'),
    vesselCount: t.exposeInt('vesselCount'),
    totalCo2: t.exposeFloat('totalCo2'),
    avgCiiValue: t.exposeFloat('avgCiiValue'),
    ratingDistribution: t.field({
      type: [DcsRatingCount],
      resolve: (parent) => parent.ratingDistribution,
    }),
    totalDistanceTravelled: t.exposeFloat('totalDistanceTravelled'),
    totalFuelConsumption: t.exposeFloat('totalFuelConsumption'),
  }),
});

// ────────────────────────────────────────────────────────────
//  Queries
// ────────────────────────────────────────────────────────────

builder.queryField('imoDcsReports', (t) =>
  t.prismaField({
    type: ['ImoDcsReport'],
    args: {
      year: t.arg.int(),
      vesselId: t.arg.string(),
      ciiRating: t.arg.string(),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.year != null) where.year = args.year;
      if (args.vesselId) where.vesselId = args.vesselId;
      if (args.ciiRating) where.ciiRating = args.ciiRating;
      if (args.status) where.status = args.status;
      return ctx.prisma.imoDcsReport.findMany({
        ...query,
        where,
        orderBy: { year: 'desc' },
      });
    },
  }),
);

builder.queryField('fleetDcsOverview', (t) =>
  t.field({
    type: FleetDcsOverview,
    args: {
      year: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const reports = await ctx.prisma.imoDcsReport.findMany({
        where: { ...ctx.orgFilter(), year: args.year },
      });

      if (reports.length === 0) {
        return {
          year: args.year,
          vesselCount: 0,
          totalCo2: 0,
          avgCiiValue: 0,
          ratingDistribution: [],
          totalDistanceTravelled: 0,
          totalFuelConsumption: 0,
        };
      }

      let totalCo2 = 0;
      let ciiSum = 0;
      let ciiCount = 0;
      let totalDistanceTravelled = 0;
      let totalFuelConsumption = 0;
      const ratingMap = new Map<string, number>();

      for (const r of reports) {
        totalCo2 += r.totalCo2;
        totalDistanceTravelled += r.distanceTravelled;

        // Sum fuel consumption from JSON field
        if (r.fuelConsumption && typeof r.fuelConsumption === 'object') {
          const fuels = r.fuelConsumption as Record<string, { consumption?: number }>;
          for (const fuelType of Object.values(fuels)) {
            totalFuelConsumption += fuelType.consumption ?? 0;
          }
        }

        if (r.ciiValue != null) {
          ciiSum += r.ciiValue;
          ciiCount += 1;
        }

        const rating = r.ciiRating ?? 'unrated';
        ratingMap.set(rating, (ratingMap.get(rating) ?? 0) + 1);
      }

      const ratingDistribution = Array.from(ratingMap.entries())
        .map(([rating, count]) => ({ rating, count }))
        .sort((a, b) => a.rating.localeCompare(b.rating));

      return {
        year: args.year,
        vesselCount: reports.length,
        totalCo2,
        avgCiiValue: ciiCount > 0 ? ciiSum / ciiCount : 0,
        ratingDistribution,
        totalDistanceTravelled,
        totalFuelConsumption,
      };
    },
  }),
);

// ────────────────────────────────────────────────────────────
//  Mutations
// ────────────────────────────────────────────────────────────

builder.mutationField('createImoDcsReport', (t) =>
  t.prismaField({
    type: 'ImoDcsReport',
    args: {
      vesselId: t.arg.string({ required: true }),
      vesselName: t.arg.string({ required: true }),
      imoNumber: t.arg.string({ required: true }),
      year: t.arg.int({ required: true }),
      reportingPeriod: t.arg.string({ required: true }),
      flagState: t.arg.string({ required: true }),
      grossTonnage: t.arg.float({ required: true }),
      netTonnage: t.arg.float(),
      dwt: t.arg.float({ required: true }),
      distanceTravelled: t.arg.float({ required: true }),
      hoursUnderway: t.arg.float({ required: true }),
      fuelConsumption: t.arg({ type: 'JSON', required: true }),
      totalCo2: t.arg.float(),
      transportWork: t.arg.float(),
      eeoi: t.arg.float(),
      ciiRating: t.arg.string(),
      ciiValue: t.arg.float(),
      ciiRequired: t.arg.float(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();

      // Auto-calculate totalCo2 from fuel consumption if not provided
      let totalCo2 = args.totalCo2 ?? 0;
      if (!args.totalCo2 && args.fuelConsumption && typeof args.fuelConsumption === 'object') {
        const fuels = args.fuelConsumption as Record<string, { consumption?: number; co2Factor?: number }>;
        for (const fuel of Object.values(fuels)) {
          const consumption = fuel.consumption ?? 0;
          const co2Factor = fuel.co2Factor ?? 3.114; // default HFO factor
          totalCo2 += (consumption * co2Factor) / 1000; // convert kg to tonnes
        }
      }

      // Auto-calculate EEOI if transportWork is provided
      let eeoi = args.eeoi ?? undefined;
      if (!args.eeoi && args.transportWork && args.transportWork > 0) {
        eeoi = totalCo2 / args.transportWork;
      }

      return ctx.prisma.imoDcsReport.create({
        ...query,
        data: {
          vesselId: args.vesselId,
          vesselName: args.vesselName,
          imoNumber: args.imoNumber,
          year: args.year,
          reportingPeriod: args.reportingPeriod,
          flagState: args.flagState,
          grossTonnage: args.grossTonnage,
          netTonnage: args.netTonnage ?? undefined,
          dwt: args.dwt,
          distanceTravelled: args.distanceTravelled,
          hoursUnderway: args.hoursUnderway,
          fuelConsumption: args.fuelConsumption as object,
          totalCo2,
          transportWork: args.transportWork ?? undefined,
          eeoi,
          ciiRating: args.ciiRating ?? undefined,
          ciiValue: args.ciiValue ?? undefined,
          ciiRequired: args.ciiRequired ?? undefined,
          status: 'draft',
          notes: args.notes ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('submitImoDcsReport', (t) =>
  t.prismaField({
    type: 'ImoDcsReport',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const existing = await ctx.prisma.imoDcsReport.findUnique({
        where: { id: args.id },
      });
      if (!existing) throw new Error('IMO DCS report not found');
      if (existing.status !== 'draft') {
        throw new Error(`Cannot submit report with status "${existing.status}". Must be in "draft" status.`);
      }

      return ctx.prisma.imoDcsReport.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'submitted',
          submissionDate: new Date(),
        },
      });
    },
  }),
);

builder.mutationField('verifyImoDcsReport', (t) =>
  t.prismaField({
    type: 'ImoDcsReport',
    args: {
      id: t.arg.string({ required: true }),
      verifiedBy: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const existing = await ctx.prisma.imoDcsReport.findUnique({
        where: { id: args.id },
      });
      if (!existing) throw new Error('IMO DCS report not found');
      if (existing.status !== 'submitted') {
        throw new Error(`Cannot verify report with status "${existing.status}". Must be in "submitted" status.`);
      }

      return ctx.prisma.imoDcsReport.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'verified',
          verifiedBy: args.verifiedBy,
          verificationDate: new Date(),
        },
      });
    },
  }),
);

// ────────────────────────────────────────────────────────────
//  CII Alert System — Types
// ────────────────────────────────────────────────────────────

const CIIRatingChange = builder.objectRef<{
  vesselId: string;
  vesselName: string;
  previousRating: string;
  currentRating: string;
  year: number;
  downgradeLevel: number;
}>('CIIRatingChange');

CIIRatingChange.implement({
  fields: (t) => ({
    vesselId: t.exposeString('vesselId'),
    vesselName: t.exposeString('vesselName'),
    previousRating: t.exposeString('previousRating'),
    currentRating: t.exposeString('currentRating'),
    year: t.exposeInt('year'),
    downgradeLevel: t.exposeInt('downgradeLevel'),
  }),
});

const CIIDowngradeStats = builder.objectRef<{
  totalVessels: number;
  vesselsWithDowngrade: number;
  criticalDowngrades: number;
  downgradeRate: number;
  ratingDistribution: Record<string, number>;
}>('CIIDowngradeStats');

CIIDowngradeStats.implement({
  fields: (t) => ({
    totalVessels: t.exposeInt('totalVessels'),
    vesselsWithDowngrade: t.exposeInt('vesselsWithDowngrade'),
    criticalDowngrades: t.exposeInt('criticalDowngrades'),
    downgradeRate: t.exposeFloat('downgradeRate'),
    ratingDistribution: t.expose('ratingDistribution', { type: 'JSON' }),
  }),
});

// ────────────────────────────────────────────────────────────
//  CII Alert System — Queries
// ────────────────────────────────────────────────────────────

builder.queryField('ciiDowngradeStats', (t) =>
  t.field({
    type: CIIDowngradeStats,
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.orgId();
      return await ciiAlertService.getDowngradeStats(orgId);
    },
  }),
);

// ────────────────────────────────────────────────────────────
//  CII Alert System — Mutations
// ────────────────────────────────────────────────────────────

builder.mutationField('checkAllCIIDowngrades', (t) =>
  t.field({
    type: [CIIRatingChange],
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.orgId();
      return await ciiAlertService.checkAllVessels(orgId);
    },
  }),
);

builder.mutationField('checkVesselCIIDowngrade', (t) =>
  t.field({
    type: CIIRatingChange,
    nullable: true,
    args: {
      vesselId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const orgId = ctx.orgId();
      return await ciiAlertService.checkVessel(args.vesselId, orgId);
    },
  }),
);
