import { builder } from '../builder.js';

// ────────────────────────────────────────────────────────────
//  ESG Report — Prisma Object
// ────────────────────────────────────────────────────────────

builder.prismaObject('EsgReport', {
  fields: (t) => ({
    id: t.exposeID('id'),
    reportingPeriod: t.exposeString('reportingPeriod'),
    year: t.exposeInt('year'),
    quarter: t.exposeInt('quarter', { nullable: true }),
    scope1Emissions: t.exposeFloat('scope1Emissions'),
    scope2Emissions: t.exposeFloat('scope2Emissions'),
    scope3Emissions: t.exposeFloat('scope3Emissions', { nullable: true }),
    totalEmissions: t.exposeFloat('totalEmissions'),
    emissionIntensity: t.exposeFloat('emissionIntensity', { nullable: true }),
    renewableEnergy: t.exposeFloat('renewableEnergy', { nullable: true }),
    shorePowerHours: t.exposeFloat('shorePowerHours', { nullable: true }),
    wasteRecycled: t.exposeFloat('wasteRecycled', { nullable: true }),
    spillIncidents: t.exposeInt('spillIncidents'),
    safetyIncidents: t.exposeInt('safetyIncidents'),
    diversityScore: t.exposeFloat('diversityScore', { nullable: true }),
    trainingHours: t.exposeFloat('trainingHours', { nullable: true }),
    communityInvestment: t.exposeFloat('communityInvestment', { nullable: true }),
    carbonOffset: t.exposeFloat('carbonOffset', { nullable: true }),
    offsetCost: t.exposeFloat('offsetCost', { nullable: true }),
    poseidonScore: t.exposeFloat('poseidonScore', { nullable: true }),
    seaCargoCharter: t.exposeFloat('seaCargoCharter', { nullable: true }),
    status: t.exposeString('status'),
    publishedDate: t.expose('publishedDate', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ────────────────────────────────────────────────────────────
//  Custom return type: EsgTrend (for chart data)
// ────────────────────────────────────────────────────────────

const EsgTrend = builder.objectRef<{
  year: number;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  intensity: number;
}>('EsgTrend');

EsgTrend.implement({
  fields: (t) => ({
    year: t.exposeInt('year'),
    scope1: t.exposeFloat('scope1'),
    scope2: t.exposeFloat('scope2'),
    scope3: t.exposeFloat('scope3'),
    total: t.exposeFloat('total'),
    intensity: t.exposeFloat('intensity'),
  }),
});

// ────────────────────────────────────────────────────────────
//  Queries
// ────────────────────────────────────────────────────────────

builder.queryField('esgReports', (t) =>
  t.prismaField({
    type: ['EsgReport'],
    args: {
      year: t.arg.int(),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.year != null) where.year = args.year;
      if (args.status) where.status = args.status;
      return ctx.prisma.esgReport.findMany({
        ...query,
        where,
        orderBy: { year: 'desc' },
      });
    },
  }),
);

builder.queryField('latestEsgReport', (t) =>
  t.prismaField({
    type: 'EsgReport',
    nullable: true,
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.esgReport.findFirst({
        ...query,
        where: { ...ctx.orgFilter(), status: 'published' },
        orderBy: { year: 'desc' },
      }),
  }),
);

builder.queryField('esgTrendData', (t) =>
  t.field({
    type: [EsgTrend],
    args: {
      startYear: t.arg.int(),
      endYear: t.arg.int(),
    },
    resolve: async (_root, args, ctx) => {
      const where: Record<string, unknown> = {
        ...ctx.orgFilter(),
        status: 'published',
        quarter: null, // only annual reports
      };

      if (args.startYear != null || args.endYear != null) {
        const yearFilter: Record<string, number> = {};
        if (args.startYear != null) yearFilter.gte = args.startYear;
        if (args.endYear != null) yearFilter.lte = args.endYear;
        where.year = yearFilter;
      }

      const reports = await ctx.prisma.esgReport.findMany({
        where,
        orderBy: { year: 'asc' },
      });

      return reports.map((r) => ({
        year: r.year,
        scope1: r.scope1Emissions,
        scope2: r.scope2Emissions,
        scope3: r.scope3Emissions ?? 0,
        total: r.totalEmissions,
        intensity: r.emissionIntensity ?? 0,
      }));
    },
  }),
);

// ────────────────────────────────────────────────────────────
//  Mutations
// ────────────────────────────────────────────────────────────

builder.mutationField('createEsgReport', (t) =>
  t.prismaField({
    type: 'EsgReport',
    args: {
      reportingPeriod: t.arg.string({ required: true }),
      year: t.arg.int({ required: true }),
      quarter: t.arg.int(),
      scope1Emissions: t.arg.float({ required: true }),
      scope2Emissions: t.arg.float({ required: true }),
      scope3Emissions: t.arg.float(),
      emissionIntensity: t.arg.float(),
      renewableEnergy: t.arg.float(),
      shorePowerHours: t.arg.float(),
      wasteRecycled: t.arg.float(),
      spillIncidents: t.arg.int(),
      safetyIncidents: t.arg.int(),
      diversityScore: t.arg.float(),
      trainingHours: t.arg.float(),
      communityInvestment: t.arg.float(),
      carbonOffset: t.arg.float(),
      offsetCost: t.arg.float(),
      poseidonScore: t.arg.float(),
      seaCargoCharter: t.arg.float(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();

      // Auto-calculate totalEmissions
      const totalEmissions =
        args.scope1Emissions + args.scope2Emissions + (args.scope3Emissions ?? 0);

      return ctx.prisma.esgReport.create({
        ...query,
        data: {
          reportingPeriod: args.reportingPeriod,
          year: args.year,
          quarter: args.quarter ?? undefined,
          scope1Emissions: args.scope1Emissions,
          scope2Emissions: args.scope2Emissions,
          scope3Emissions: args.scope3Emissions ?? undefined,
          totalEmissions,
          emissionIntensity: args.emissionIntensity ?? undefined,
          renewableEnergy: args.renewableEnergy ?? undefined,
          shorePowerHours: args.shorePowerHours ?? undefined,
          wasteRecycled: args.wasteRecycled ?? undefined,
          spillIncidents: args.spillIncidents ?? 0,
          safetyIncidents: args.safetyIncidents ?? 0,
          diversityScore: args.diversityScore ?? undefined,
          trainingHours: args.trainingHours ?? undefined,
          communityInvestment: args.communityInvestment ?? undefined,
          carbonOffset: args.carbonOffset ?? undefined,
          offsetCost: args.offsetCost ?? undefined,
          poseidonScore: args.poseidonScore ?? undefined,
          seaCargoCharter: args.seaCargoCharter ?? undefined,
          status: 'draft',
          notes: args.notes ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('publishEsgReport', (t) =>
  t.prismaField({
    type: 'EsgReport',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const existing = await ctx.prisma.esgReport.findUnique({
        where: { id: args.id },
      });
      if (!existing) throw new Error('ESG report not found');
      if (existing.status === 'published') {
        throw new Error('Report is already published');
      }

      return ctx.prisma.esgReport.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'published',
          publishedDate: new Date(),
        },
      });
    },
  }),
);
