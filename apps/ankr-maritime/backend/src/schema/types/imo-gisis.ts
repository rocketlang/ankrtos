import { builder } from '../builder.js';
import { imoGisisScraper } from '../../services/imo-gisis-scraper.js';

// IMO GISIS Vessel Data type
const IMOGISISVesselData = builder.objectRef<{
  imo: string;
  name?: string | null;
  callSign?: string | null;
  mmsi?: string | null;
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
  imoShipType?: string | null;
  classificationSociety?: string | null;
  portOfRegistry?: string | null;
  status?: string | null;
  scrapedAt: Date;
  dataSource: string;
}>('IMOGISISVesselData').implement({
  fields: (t) => ({
    imo: t.exposeString('imo'),
    name: t.exposeString('name', { nullable: true }),
    callSign: t.exposeString('callSign', { nullable: true }),
    mmsi: t.exposeString('mmsi', { nullable: true }),
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
    imoShipType: t.exposeString('imoShipType', { nullable: true }),
    classificationSociety: t.exposeString('classificationSociety', { nullable: true }),
    portOfRegistry: t.exposeString('portOfRegistry', { nullable: true }),
    status: t.exposeString('status', { nullable: true }),
    scrapedAt: t.expose('scrapedAt', { type: 'DateTime' }),
    dataSource: t.exposeString('dataSource'),
  }),
});

// Bulk enrichment result
const GISISEnrichmentResult = builder.objectRef<{
  total: number;
  enriched: number;
  failed: number;
  skipped: number;
}>('GISISEnrichmentResult').implement({
  fields: (t) => ({
    total: t.exposeInt('total'),
    enriched: t.exposeInt('enriched'),
    failed: t.exposeInt('failed'),
    skipped: t.exposeInt('skipped'),
  }),
});

// === Queries ===

builder.queryField('fetchIMOGISISVesselData', (t) =>
  t.field({
    type: IMOGISISVesselData,
    nullable: true,
    args: {
      imo: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      return await imoGisisScraper.scrapeVesselData(args.imo);
    },
  })
);

// === Mutations ===

builder.mutationField('enrichVesselWithIMOGISIS', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      vesselId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');
      return await imoGisisScraper.enrichVessel(args.vesselId);
    },
  })
);

builder.mutationField('enrichVesselByIMOWithGISIS', (t) =>
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

      return await imoGisisScraper.enrichVessel(vessel.id);
    },
  })
);

builder.mutationField('bulkEnrichVesselsWithIMOGISIS', (t) =>
  t.field({
    type: GISISEnrichmentResult,
    args: {
      limit: t.arg.int({ defaultValue: 20 }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'manager') {
        throw new Error('Admin or manager role required');
      }

      return await imoGisisScraper.enrichVesselsWithGISISData(args.limit);
    },
  })
);

builder.mutationField('clearIMOGISISCache', (t) =>
  t.field({
    type: 'Boolean',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin role required');
      }

      imoGisisScraper.clearCache();
      return true;
    },
  })
);

builder.mutationField('closeIMOGISISScraper', (t) =>
  t.field({
    type: 'Boolean',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin role required');
      }

      await imoGisisScraper.close();
      return true;
    },
  })
);
