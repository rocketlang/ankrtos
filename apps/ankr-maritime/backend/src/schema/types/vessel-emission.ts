import { builder } from '../builder.js';

builder.prismaObject('VesselEmission', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    year: t.exposeInt('year'),
    reportingPeriod: t.exposeString('reportingPeriod'),
    distanceNm: t.exposeFloat('distanceNm'),
    fuelConsumedMt: t.exposeFloat('fuelConsumedMt'),
    co2EmissionsMt: t.exposeFloat('co2EmissionsMt'),
    attainedCII: t.exposeFloat('attainedCII'),
    requiredCII: t.exposeFloat('requiredCII'),
    ciiRating: t.exposeString('ciiRating', { nullable: true }),
    euEtsApplicable: t.exposeBoolean('euEtsApplicable'),
    euEtsCo2Mt: t.exposeFloat('euEtsCo2Mt'),
    euEtsAllowancesNeeded: t.exposeInt('euEtsAllowancesNeeded'),
    euEtsCostEur: t.exposeFloat('euEtsCostEur'),
    fuelEuGhgIntensity: t.exposeFloat('fuelEuGhgIntensity'),
    fuelEuTarget: t.exposeFloat('fuelEuTarget'),
    fuelEuCompliant: t.exposeBoolean('fuelEuCompliant'),
    fuelEuPenalty: t.exposeFloat('fuelEuPenalty'),
    notes: t.exposeString('notes', { nullable: true }),
    vessel: t.relation('vessel'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Custom types for summaries ===

const CiiRatingCount = builder.objectRef<{
  rating: string;
  count: number;
}>('CiiRatingCount');

CiiRatingCount.implement({
  fields: (t) => ({
    rating: t.exposeString('rating'),
    count: t.exposeInt('count'),
  }),
});

const FleetCiiSummary = builder.objectRef<{
  totalVessels: number;
  ratingDistribution: { rating: string; count: number }[];
  avgCII: number;
  worstVessel: string | null;
  bestVessel: string | null;
}>('FleetCiiSummary');

FleetCiiSummary.implement({
  fields: (t) => ({
    totalVessels: t.exposeInt('totalVessels'),
    ratingDistribution: t.field({
      type: [CiiRatingCount],
      resolve: (parent) => parent.ratingDistribution,
    }),
    avgCII: t.exposeFloat('avgCII'),
    worstVessel: t.exposeString('worstVessel', { nullable: true }),
    bestVessel: t.exposeString('bestVessel', { nullable: true }),
  }),
});

const EuEtsSummary = builder.objectRef<{
  totalCo2Mt: number;
  totalAllowancesNeeded: number;
  totalCostEur: number;
  vesselCount: number;
}>('EuEtsSummary');

EuEtsSummary.implement({
  fields: (t) => ({
    totalCo2Mt: t.exposeFloat('totalCo2Mt'),
    totalAllowancesNeeded: t.exposeInt('totalAllowancesNeeded'),
    totalCostEur: t.exposeFloat('totalCostEur'),
    vesselCount: t.exposeInt('vesselCount'),
  }),
});

// === Queries ===

builder.queryField('vesselEmissions', (t) =>
  t.prismaField({
    type: ['VesselEmission'],
    args: {
      vesselId: t.arg.string(),
      year: t.arg.int(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {};
      if (args.vesselId) where.vesselId = args.vesselId;
      if (args.year != null) where.year = args.year;
      return ctx.prisma.vesselEmission.findMany({
        ...query,
        where,
        orderBy: { year: 'desc' },
      });
    },
  }),
);

builder.queryField('fleetCiiSummary', (t) =>
  t.field({
    type: FleetCiiSummary,
    args: { year: t.arg.int({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const emissions = await ctx.prisma.vesselEmission.findMany({
        where: { year: args.year },
        include: { vessel: true },
      });

      if (emissions.length === 0) {
        return {
          totalVessels: 0,
          ratingDistribution: [],
          avgCII: 0,
          worstVessel: null,
          bestVessel: null,
        };
      }

      // Rating distribution
      const ratingMap = new Map<string, number>();
      let ciiSum = 0;
      let worst: { name: string; cii: number } | null = null;
      let best: { name: string; cii: number } | null = null;

      for (const e of emissions) {
        const rating = e.ciiRating ?? 'unrated';
        ratingMap.set(rating, (ratingMap.get(rating) ?? 0) + 1);
        ciiSum += e.attainedCII;

        if (!worst || e.attainedCII > worst.cii) {
          worst = { name: e.vessel.name, cii: e.attainedCII };
        }
        if (!best || e.attainedCII < best.cii) {
          best = { name: e.vessel.name, cii: e.attainedCII };
        }
      }

      const ratingDistribution = Array.from(ratingMap.entries())
        .map(([rating, count]) => ({ rating, count }))
        .sort((a, b) => a.rating.localeCompare(b.rating));

      return {
        totalVessels: emissions.length,
        ratingDistribution,
        avgCII: ciiSum / emissions.length,
        worstVessel: worst?.name ?? null,
        bestVessel: best?.name ?? null,
      };
    },
  }),
);

builder.queryField('euEtsSummary', (t) =>
  t.field({
    type: EuEtsSummary,
    args: { year: t.arg.int({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const emissions = await ctx.prisma.vesselEmission.findMany({
        where: { year: args.year, euEtsApplicable: true },
      });

      let totalCo2Mt = 0;
      let totalAllowancesNeeded = 0;
      let totalCostEur = 0;

      for (const e of emissions) {
        totalCo2Mt += e.euEtsCo2Mt;
        totalAllowancesNeeded += e.euEtsAllowancesNeeded;
        totalCostEur += e.euEtsCostEur;
      }

      return {
        totalCo2Mt,
        totalAllowancesNeeded,
        totalCostEur,
        vesselCount: emissions.length,
      };
    },
  }),
);

// === Mutations ===

builder.mutationField('createVesselEmission', (t) =>
  t.prismaField({
    type: 'VesselEmission',
    args: {
      vesselId: t.arg.string({ required: true }),
      year: t.arg.int({ required: true }),
      reportingPeriod: t.arg.string(),
      distanceNm: t.arg.float(),
      fuelConsumedMt: t.arg.float(),
      co2EmissionsMt: t.arg.float(),
      attainedCII: t.arg.float(),
      requiredCII: t.arg.float(),
      ciiRating: t.arg.string(),
      euEtsApplicable: t.arg.boolean(),
      euEtsCo2Mt: t.arg.float(),
      euEtsAllowancesNeeded: t.arg.int(),
      euEtsCostEur: t.arg.float(),
      fuelEuGhgIntensity: t.arg.float(),
      fuelEuTarget: t.arg.float(),
      fuelEuCompliant: t.arg.boolean(),
      fuelEuPenalty: t.arg.float(),
      voyageId: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vesselEmission.create({
        ...query,
        data: {
          vesselId: args.vesselId,
          year: args.year,
          reportingPeriod: args.reportingPeriod ?? 'annual',
          distanceNm: args.distanceNm ?? 0,
          fuelConsumedMt: args.fuelConsumedMt ?? 0,
          co2EmissionsMt: args.co2EmissionsMt ?? 0,
          attainedCII: args.attainedCII ?? 0,
          requiredCII: args.requiredCII ?? 0,
          ciiRating: args.ciiRating ?? undefined,
          euEtsApplicable: args.euEtsApplicable ?? false,
          euEtsCo2Mt: args.euEtsCo2Mt ?? 0,
          euEtsAllowancesNeeded: args.euEtsAllowancesNeeded ?? 0,
          euEtsCostEur: args.euEtsCostEur ?? 0,
          fuelEuGhgIntensity: args.fuelEuGhgIntensity ?? 0,
          fuelEuTarget: args.fuelEuTarget ?? 0,
          fuelEuCompliant: args.fuelEuCompliant ?? true,
          fuelEuPenalty: args.fuelEuPenalty ?? 0,
          voyageId: args.voyageId ?? undefined,
          notes: args.notes ?? undefined,
        },
      }),
  }),
);

builder.mutationField('updateVesselEmission', (t) =>
  t.prismaField({
    type: 'VesselEmission',
    args: {
      id: t.arg.string({ required: true }),
      distanceNm: t.arg.float(),
      fuelConsumedMt: t.arg.float(),
      co2EmissionsMt: t.arg.float(),
      attainedCII: t.arg.float(),
      requiredCII: t.arg.float(),
      ciiRating: t.arg.string(),
      euEtsApplicable: t.arg.boolean(),
      euEtsCo2Mt: t.arg.float(),
      euEtsAllowancesNeeded: t.arg.int(),
      euEtsCostEur: t.arg.float(),
      fuelEuGhgIntensity: t.arg.float(),
      fuelEuTarget: t.arg.float(),
      fuelEuCompliant: t.arg.boolean(),
      fuelEuPenalty: t.arg.float(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vesselEmission.update({
        ...query,
        where: { id: args.id },
        data: {
          ...(args.distanceNm != null && { distanceNm: args.distanceNm }),
          ...(args.fuelConsumedMt != null && { fuelConsumedMt: args.fuelConsumedMt }),
          ...(args.co2EmissionsMt != null && { co2EmissionsMt: args.co2EmissionsMt }),
          ...(args.attainedCII != null && { attainedCII: args.attainedCII }),
          ...(args.requiredCII != null && { requiredCII: args.requiredCII }),
          ...(args.ciiRating && { ciiRating: args.ciiRating }),
          ...(args.euEtsApplicable != null && { euEtsApplicable: args.euEtsApplicable }),
          ...(args.euEtsCo2Mt != null && { euEtsCo2Mt: args.euEtsCo2Mt }),
          ...(args.euEtsAllowancesNeeded != null && { euEtsAllowancesNeeded: args.euEtsAllowancesNeeded }),
          ...(args.euEtsCostEur != null && { euEtsCostEur: args.euEtsCostEur }),
          ...(args.fuelEuGhgIntensity != null && { fuelEuGhgIntensity: args.fuelEuGhgIntensity }),
          ...(args.fuelEuTarget != null && { fuelEuTarget: args.fuelEuTarget }),
          ...(args.fuelEuCompliant != null && { fuelEuCompliant: args.fuelEuCompliant }),
          ...(args.fuelEuPenalty != null && { fuelEuPenalty: args.fuelEuPenalty }),
          ...(args.notes && { notes: args.notes }),
        },
      }),
  }),
);
