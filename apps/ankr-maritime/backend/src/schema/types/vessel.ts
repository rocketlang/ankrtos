import { builder } from '../builder.js';
import { autoEnrichmentService } from '../../services/auto-enrichment.service.js';

builder.prismaObject('Vessel', {
  fields: (t) => ({
    id: t.exposeID('id'),
    imo: t.exposeString('imo'),
    name: t.exposeString('name'),
    type: t.exposeString('type'),
    flag: t.exposeString('flag'),
    classificationSociety: t.exposeString('classificationSociety', { nullable: true }),
    dwt: t.exposeFloat('dwt', { nullable: true }),
    grt: t.exposeFloat('grt', { nullable: true }),
    nrt: t.exposeFloat('nrt', { nullable: true }),
    loa: t.exposeFloat('loa', { nullable: true }),
    beam: t.exposeFloat('beam', { nullable: true }),
    draft: t.exposeFloat('draft', { nullable: true }),
    yearBuilt: t.exposeInt('yearBuilt', { nullable: true }),
    status: t.exposeString('status'),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('vessels', (t) =>
  t.prismaField({
    type: ['Vessel'],
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.vessel.findMany({ ...query, where: ctx.orgFilter(), orderBy: { name: 'asc' } }),
  }),
);

builder.queryField('vessel', (t) =>
  t.prismaField({
    type: 'Vessel',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: async (query, _root, args, ctx) => {
      const vessel = await ctx.prisma.vessel.findUnique({ ...query, where: { id: args.id } });

      // Trigger enrichment if vessel has IMO and user is querying it
      if (vessel?.imoNumber) {
        await autoEnrichmentService.queueEnrichment({
          source: 'user_query',
          vesselId: vessel.id,
          imoNumber: vessel.imoNumber,
          vesselName: vessel.name || undefined,
          priority: 'high', // User is waiting for data
        });
      }

      return vessel;
    },
  }),
);

builder.queryField('vesselByImo', (t) =>
  t.prismaField({
    type: 'Vessel',
    nullable: true,
    args: { imo: t.arg.string({ required: true }) },
    resolve: async (query, _root, args, ctx) => {
      const vessel = await ctx.prisma.vessel.findUnique({ ...query, where: { imo: args.imo } });

      // Trigger enrichment when querying by IMO (clear user intent to get vessel data)
      if (vessel) {
        await autoEnrichmentService.queueEnrichment({
          source: 'user_query',
          vesselId: vessel.id,
          imoNumber: vessel.imoNumber || args.imo,
          vesselName: vessel.name || undefined,
          priority: 'high', // User is waiting for data
        });
      }

      return vessel;
    },
  }),
);

// Mutations
builder.mutationField('createVessel', (t) =>
  t.prismaField({
    type: 'Vessel',
    args: {
      imo: t.arg.string({ required: true }),
      name: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      flag: t.arg.string({ required: true }),
      classificationSociety: t.arg.string(),
      dwt: t.arg.float(),
      grt: t.arg.float(),
      nrt: t.arg.float(),
      loa: t.arg.float(),
      beam: t.arg.float(),
      draft: t.arg.float(),
      yearBuilt: t.arg.int(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      if (!orgId) throw new Error('Not authenticated');
      return ctx.prisma.vessel.create({
        ...query,
        data: {
          imo: args.imo,
          name: args.name,
          type: args.type,
          flag: args.flag,
          classificationSociety: args.classificationSociety ?? undefined,
          dwt: args.dwt ?? undefined,
          grt: args.grt ?? undefined,
          nrt: args.nrt ?? undefined,
          loa: args.loa ?? undefined,
          beam: args.beam ?? undefined,
          draft: args.draft ?? undefined,
          yearBuilt: args.yearBuilt ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('updateVessel', (t) =>
  t.prismaField({
    type: 'Vessel',
    args: {
      id: t.arg.string({ required: true }),
      name: t.arg.string(),
      type: t.arg.string(),
      flag: t.arg.string(),
      status: t.arg.string(),
      dwt: t.arg.float(),
      loa: t.arg.float(),
      beam: t.arg.float(),
      draft: t.arg.float(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vessel.update({
        ...query,
        where: { id: args.id },
        data: {
          ...(args.name && { name: args.name }),
          ...(args.type && { type: args.type }),
          ...(args.flag && { flag: args.flag }),
          ...(args.status && { status: args.status }),
          ...(args.dwt != null && { dwt: args.dwt }),
          ...(args.loa != null && { loa: args.loa }),
          ...(args.beam != null && { beam: args.beam }),
          ...(args.draft != null && { draft: args.draft }),
        },
      }),
  }),
);

builder.mutationField('deleteVessel', (t) =>
  t.prismaField({
    type: 'Vessel',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vessel.delete({ ...query, where: { id: args.id } }),
  }),
);
