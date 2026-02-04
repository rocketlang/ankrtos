import { builder } from '../builder.js';

builder.prismaObject('PortRestriction', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    maxDraft: t.exposeFloat('maxDraft', { nullable: true }),
    maxLOA: t.exposeFloat('maxLOA', { nullable: true }),
    maxBeam: t.exposeFloat('maxBeam', { nullable: true }),
    maxDWT: t.exposeFloat('maxDWT', { nullable: true }),
    maxAirDraft: t.exposeFloat('maxAirDraft', { nullable: true }),
    tidalRange: t.exposeFloat('tidalRange', { nullable: true }),
    channelDepth: t.exposeFloat('channelDepth', { nullable: true }),
    cargoHandling: t.exposeString('cargoHandling', { nullable: true }),
    maxCargoRate: t.exposeFloat('maxCargoRate', { nullable: true }),
    terminalType: t.exposeString('terminalType', { nullable: true }),
    restrictions: t.exposeString('restrictions', { nullable: true }),
    nightNavigation: t.exposeBoolean('nightNavigation'),
    pilotMandatory: t.exposeBoolean('pilotMandatory'),
    port: t.relation('port'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Custom type for vessel fit check ===

const VesselFitResult = builder.objectRef<{
  fits: boolean;
  issues: string[];
  maxDraft: number | null;
  maxLOA: number | null;
  maxBeam: number | null;
}>('VesselFitResult');

VesselFitResult.implement({
  fields: (t) => ({
    fits: t.exposeBoolean('fits'),
    issues: t.exposeStringList('issues'),
    maxDraft: t.exposeFloat('maxDraft', { nullable: true }),
    maxLOA: t.exposeFloat('maxLOA', { nullable: true }),
    maxBeam: t.exposeFloat('maxBeam', { nullable: true }),
  }),
});

// === Queries ===

builder.queryField('portRestrictions', (t) =>
  t.prismaField({
    type: ['PortRestriction'],
    args: { portId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.portRestriction.findMany({
        ...query,
        where: { portId: args.portId },
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

builder.queryField('checkVesselFit', (t) =>
  t.field({
    type: VesselFitResult,
    args: {
      portId: t.arg.string({ required: true }),
      vesselDraft: t.arg.float({ required: true }),
      vesselLOA: t.arg.float({ required: true }),
      vesselBeam: t.arg.float({ required: true }),
      vesselDWT: t.arg.float({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const restriction = await ctx.prisma.portRestriction.findFirst({
        where: { portId: args.portId },
      });

      if (!restriction) {
        return { fits: true, issues: [], maxDraft: null, maxLOA: null, maxBeam: null };
      }

      const issues: string[] = [];

      if (restriction.maxDraft != null && args.vesselDraft > restriction.maxDraft) {
        issues.push(`Draft ${args.vesselDraft}m exceeds max ${restriction.maxDraft}m`);
      }
      if (restriction.maxLOA != null && args.vesselLOA > restriction.maxLOA) {
        issues.push(`LOA ${args.vesselLOA}m exceeds max ${restriction.maxLOA}m`);
      }
      if (restriction.maxBeam != null && args.vesselBeam > restriction.maxBeam) {
        issues.push(`Beam ${args.vesselBeam}m exceeds max ${restriction.maxBeam}m`);
      }
      if (restriction.maxDWT != null && args.vesselDWT > restriction.maxDWT) {
        issues.push(`DWT ${args.vesselDWT}t exceeds max ${restriction.maxDWT}t`);
      }

      return {
        fits: issues.length === 0,
        issues,
        maxDraft: restriction.maxDraft,
        maxLOA: restriction.maxLOA,
        maxBeam: restriction.maxBeam,
      };
    },
  }),
);

// === Mutations ===

builder.mutationField('setPortRestriction', (t) =>
  t.prismaField({
    type: 'PortRestriction',
    args: {
      portId: t.arg.string({ required: true }),
      maxDraft: t.arg.float(),
      maxLOA: t.arg.float(),
      maxBeam: t.arg.float(),
      maxDWT: t.arg.float(),
      maxAirDraft: t.arg.float(),
      tidalRange: t.arg.float(),
      channelDepth: t.arg.float(),
      cargoHandling: t.arg.string(),
      maxCargoRate: t.arg.float(),
      terminalType: t.arg.string(),
      restrictions: t.arg.string(),
      nightNavigation: t.arg.boolean(),
      pilotMandatory: t.arg.boolean(),
    },
    resolve: async (query, _root, args, ctx) => {
      const existing = await ctx.prisma.portRestriction.findFirst({
        where: { portId: args.portId },
      });

      const data = {
        portId: args.portId,
        maxDraft: args.maxDraft ?? undefined,
        maxLOA: args.maxLOA ?? undefined,
        maxBeam: args.maxBeam ?? undefined,
        maxDWT: args.maxDWT ?? undefined,
        maxAirDraft: args.maxAirDraft ?? undefined,
        tidalRange: args.tidalRange ?? undefined,
        channelDepth: args.channelDepth ?? undefined,
        cargoHandling: args.cargoHandling ?? undefined,
        maxCargoRate: args.maxCargoRate ?? undefined,
        terminalType: args.terminalType ?? undefined,
        restrictions: args.restrictions ?? undefined,
        nightNavigation: args.nightNavigation ?? undefined,
        pilotMandatory: args.pilotMandatory ?? undefined,
      };

      if (existing) {
        return ctx.prisma.portRestriction.update({
          ...query,
          where: { id: existing.id },
          data,
        });
      }

      return ctx.prisma.portRestriction.create({
        ...query,
        data,
      });
    },
  }),
);

builder.mutationField('deletePortRestriction', (t) =>
  t.prismaField({
    type: 'PortRestriction',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.portRestriction.delete({ ...query, where: { id: args.id } }),
  }),
);
