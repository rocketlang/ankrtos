import { builder } from '../builder.js';

builder.prismaObject('FuelQualityRecord', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId', { nullable: true }),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    portId: t.exposeString('portId', { nullable: true }),
    fuelType: t.exposeString('fuelType'),
    supplierName: t.exposeString('supplierName', { nullable: true }),
    bdn: t.exposeString('bdn', { nullable: true }),
    quantity: t.exposeFloat('quantity'),
    density: t.exposeFloat('density', { nullable: true }),
    viscosity: t.exposeFloat('viscosity', { nullable: true }),
    sulphur: t.exposeFloat('sulphur', { nullable: true }),
    water: t.exposeFloat('water', { nullable: true }),
    flashPoint: t.exposeFloat('flashPoint', { nullable: true }),
    pourPoint: t.exposeFloat('pourPoint', { nullable: true }),
    ash: t.exposeFloat('ash', { nullable: true }),
    vanadium: t.exposeFloat('vanadium', { nullable: true }),
    aluminum: t.exposeFloat('aluminum', { nullable: true }),
    silicon: t.exposeFloat('silicon', { nullable: true }),
    isoCompliant: t.exposeBoolean('isoCompliant'),
    issueFound: t.exposeBoolean('issueFound'),
    issueDescription: t.exposeString('issueDescription', { nullable: true }),
    sampleSent: t.exposeBoolean('sampleSent'),
    labReportRef: t.exposeString('labReportRef', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Custom summary type ===

const FuelQualitySummary = builder.objectRef<{
  totalRecords: number;
  compliantRecords: number;
  nonCompliantRecords: number;
  issuesFound: number;
  avgSulphur: number;
  avgDensity: number;
}>('FuelQualitySummary');

FuelQualitySummary.implement({
  fields: (t) => ({
    totalRecords: t.exposeInt('totalRecords'),
    compliantRecords: t.exposeInt('compliantRecords'),
    nonCompliantRecords: t.exposeInt('nonCompliantRecords'),
    issuesFound: t.exposeInt('issuesFound'),
    avgSulphur: t.exposeFloat('avgSulphur'),
    avgDensity: t.exposeFloat('avgDensity'),
  }),
});

// === Queries ===

builder.queryField('fuelQualityRecords', (t) =>
  t.prismaField({
    type: ['FuelQualityRecord'],
    args: {
      vesselId: t.arg.string(),
      fuelType: t.arg.string(),
      issueFound: t.arg.boolean(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {};
      if (args.vesselId) where.vesselId = args.vesselId;
      if (args.fuelType) where.fuelType = args.fuelType;
      if (args.issueFound != null) where.issueFound = args.issueFound;
      return ctx.prisma.fuelQualityRecord.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('fuelQualitySummary', (t) =>
  t.field({
    type: FuelQualitySummary,
    resolve: async (_root, _args, ctx) => {
      const records = await ctx.prisma.fuelQualityRecord.findMany();
      let compliantRecords = 0;
      let nonCompliantRecords = 0;
      let issuesFound = 0;
      let sulphurSum = 0;
      let sulphurCount = 0;
      let densitySum = 0;
      let densityCount = 0;

      for (const r of records) {
        if (r.isoCompliant) compliantRecords++;
        else nonCompliantRecords++;
        if (r.issueFound) issuesFound++;
        if (r.sulphur != null) {
          sulphurSum += r.sulphur;
          sulphurCount++;
        }
        if (r.density != null) {
          densitySum += r.density;
          densityCount++;
        }
      }

      return {
        totalRecords: records.length,
        compliantRecords,
        nonCompliantRecords,
        issuesFound,
        avgSulphur: sulphurCount > 0 ? sulphurSum / sulphurCount : 0,
        avgDensity: densityCount > 0 ? densitySum / densityCount : 0,
      };
    },
  }),
);

// === Mutations ===

builder.mutationField('addFuelQualityRecord', (t) =>
  t.prismaField({
    type: 'FuelQualityRecord',
    args: {
      fuelType: t.arg.string({ required: true }),
      quantity: t.arg.float({ required: true }),
      vesselId: t.arg.string(),
      voyageId: t.arg.string(),
      portId: t.arg.string(),
      supplierName: t.arg.string(),
      bdn: t.arg.string(),
      density: t.arg.float(),
      viscosity: t.arg.float(),
      sulphur: t.arg.float(),
      water: t.arg.float(),
      flashPoint: t.arg.float(),
      pourPoint: t.arg.float(),
      ash: t.arg.float(),
      vanadium: t.arg.float(),
      aluminum: t.arg.float(),
      silicon: t.arg.float(),
      isoCompliant: t.arg.boolean(),
      issueFound: t.arg.boolean(),
      issueDescription: t.arg.string(),
      sampleSent: t.arg.boolean(),
      labReportRef: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.fuelQualityRecord.create({
        ...query,
        data: {
          fuelType: args.fuelType,
          quantity: args.quantity,
          vesselId: args.vesselId ?? undefined,
          voyageId: args.voyageId ?? undefined,
          portId: args.portId ?? undefined,
          supplierName: args.supplierName ?? undefined,
          bdn: args.bdn ?? undefined,
          density: args.density ?? undefined,
          viscosity: args.viscosity ?? undefined,
          sulphur: args.sulphur ?? undefined,
          water: args.water ?? undefined,
          flashPoint: args.flashPoint ?? undefined,
          pourPoint: args.pourPoint ?? undefined,
          ash: args.ash ?? undefined,
          vanadium: args.vanadium ?? undefined,
          aluminum: args.aluminum ?? undefined,
          silicon: args.silicon ?? undefined,
          isoCompliant: args.isoCompliant ?? true,
          issueFound: args.issueFound ?? false,
          issueDescription: args.issueDescription ?? undefined,
          sampleSent: args.sampleSent ?? false,
          labReportRef: args.labReportRef ?? undefined,
        },
      }),
  }),
);

builder.mutationField('flagFuelIssue', (t) =>
  t.prismaField({
    type: 'FuelQualityRecord',
    args: {
      id: t.arg.string({ required: true }),
      issueDescription: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.fuelQualityRecord.update({
        ...query,
        where: { id: args.id },
        data: {
          issueFound: true,
          issueDescription: args.issueDescription,
        },
      }),
  }),
);

builder.mutationField('markSampleSent', (t) =>
  t.prismaField({
    type: 'FuelQualityRecord',
    args: {
      id: t.arg.string({ required: true }),
      labReportRef: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.fuelQualityRecord.update({
        ...query,
        where: { id: args.id },
        data: {
          sampleSent: true,
          labReportRef: args.labReportRef ?? undefined,
        },
      }),
  }),
);
