import { builder } from '../builder.js';
import { norwegianMaritimeAPI } from '../../services/norwegian-maritime-api.js';

// Norwegian Vessel Data type
const NorwegianVesselData = builder.objectRef<{
  imo: string;
  mmsi?: string | null;
  name?: string | null;
  callSign?: string | null;
  flag?: string | null;
  shipType?: string | null;
  grossTonnage?: number | null;
  deadweight?: number | null;
  lengthOverall?: number | null;
  breadth?: number | null;
  yearBuilt?: number | null;
  registeredOwner?: string | null;
  ownerAddress?: string | null;
  ownerCountry?: string | null;
  technicalManager?: string | null;
  operator?: string | null;
  norwegianRegNumber?: string | null;
  homePort?: string | null;
  classificationSociety?: string | null;
}>('NorwegianVesselData').implement({
  fields: (t) => ({
    imo: t.exposeString('imo'),
    mmsi: t.exposeString('mmsi', { nullable: true }),
    name: t.exposeString('name', { nullable: true }),
    callSign: t.exposeString('callSign', { nullable: true }),
    flag: t.exposeString('flag', { nullable: true }),
    shipType: t.exposeString('shipType', { nullable: true }),
    grossTonnage: t.exposeFloat('grossTonnage', { nullable: true }),
    deadweight: t.exposeFloat('deadweight', { nullable: true }),
    lengthOverall: t.exposeFloat('lengthOverall', { nullable: true }),
    breadth: t.exposeFloat('breadth', { nullable: true }),
    yearBuilt: t.exposeInt('yearBuilt', { nullable: true }),
    registeredOwner: t.exposeString('registeredOwner', { nullable: true }),
    ownerAddress: t.exposeString('ownerAddress', { nullable: true }),
    ownerCountry: t.exposeString('ownerCountry', { nullable: true }),
    technicalManager: t.exposeString('technicalManager', { nullable: true }),
    operator: t.exposeString('operator', { nullable: true }),
    norwegianRegNumber: t.exposeString('norwegianRegNumber', { nullable: true }),
    homePort: t.exposeString('homePort', { nullable: true }),
    classificationSociety: t.exposeString('classificationSociety', { nullable: true }),
  }),
});

// Bulk enrichment result
const NorwegianEnrichmentResult = builder.objectRef<{
  total: number;
  enriched: number;
  failed: number;
  skipped: number;
}>('NorwegianEnrichmentResult').implement({
  fields: (t) => ({
    total: t.exposeInt('total'),
    enriched: t.exposeInt('enriched'),
    failed: t.exposeInt('failed'),
    skipped: t.exposeInt('skipped'),
  }),
});

// === Queries ===

builder.queryField('fetchNorwegianVesselData', (t) =>
  t.field({
    type: NorwegianVesselData,
    nullable: true,
    args: {
      imo: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      return await norwegianMaritimeAPI.fetchVesselData(args.imo);
    },
  })
);

// === Mutations ===

builder.mutationField('enrichVesselWithNorwegianData', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      vesselId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');
      return await norwegianMaritimeAPI.enrichVessel(args.vesselId);
    },
  })
);

builder.mutationField('enrichVesselByIMO', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      imo: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');

      // Find vessel by IMO
      const vessel = await ctx.prisma.vessel.findFirst({
        where: {
          imo: args.imo,
          organizationId: ctx.user.organizationId,
        },
      });

      if (!vessel) {
        throw new Error(`Vessel not found with IMO: ${args.imo}`);
      }

      return await norwegianMaritimeAPI.enrichVessel(vessel.id);
    },
  })
);

builder.mutationField('bulkEnrichVesselsWithNorwegianData', (t) =>
  t.field({
    type: NorwegianEnrichmentResult,
    args: {
      limit: t.arg.int({ defaultValue: 50 }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'manager') {
        throw new Error('Admin or manager role required');
      }

      return await norwegianMaritimeAPI.enrichVesselsWithNorwegianData(args.limit);
    },
  })
);

builder.mutationField('clearNorwegianAPICache', (t) =>
  t.field({
    type: 'Boolean',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin role required');
      }

      norwegianMaritimeAPI.clearCache();
      return true;
    },
  })
);
