import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('VesselPosition', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    speed: t.exposeFloat('speed', { nullable: true }),
    heading: t.exposeFloat('heading', { nullable: true }),
    course: t.exposeFloat('course', { nullable: true }),
    status: t.exposeString('status', { nullable: true }),
    destination: t.exposeString('destination', { nullable: true }),
    eta: t.expose('eta', { type: 'DateTime', nullable: true }),
    source: t.exposeString('source'),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
    vessel: t.relation('vessel'),
  }),
});

builder.queryField('vesselPositions', (t) =>
  t.prismaField({
    type: ['VesselPosition'],
    args: {
      vesselId: t.arg.string({ required: true }),
      limit: t.arg.int({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.vesselPosition.findMany({
        ...query,
        where: { vesselId: args.vesselId },
        orderBy: { timestamp: 'desc' },
        take: args.limit ?? 100,
      }),
  }),
);

builder.queryField('latestVesselPosition', (t) =>
  t.prismaField({
    type: 'VesselPosition',
    nullable: true,
    args: {
      vesselId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.vesselPosition.findFirst({
        ...query,
        where: { vesselId: args.vesselId },
        orderBy: { timestamp: 'desc' },
      }),
  }),
);

// Get all latest vessel positions (one per vessel)
builder.queryField('allVesselPositions', (t) =>
  t.field({
    type: ['VesselPosition'],
    resolve: async (_root, _args, ctx) => {
      // Get all unique vessel IDs
      const vessels = await prisma.vessel.findMany({
        where: ctx.user?.organizationId
          ? { organizationId: ctx.user.organizationId }
          : {},
        select: { id: true },
      });

      // Get latest position for each vessel
      const positions = await Promise.all(
        vessels.map(async (vessel) => {
          return prisma.vesselPosition.findFirst({
            where: { vesselId: vessel.id },
            orderBy: { timestamp: 'desc' },
          });
        })
      );

      return positions.filter((p) => p !== null);
    },
  }),
);

builder.mutationField('createVesselPosition', (t) =>
  t.prismaField({
    type: 'VesselPosition',
    args: {
      vesselId: t.arg.string({ required: true }),
      latitude: t.arg.float({ required: true }),
      longitude: t.arg.float({ required: true }),
      speed: t.arg.float({ required: false }),
      heading: t.arg.float({ required: false }),
      course: t.arg.float({ required: false }),
      status: t.arg.string({ required: false }),
      destination: t.arg.string({ required: false }),
      eta: t.arg.string({ required: false }),
      source: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.vesselPosition.create({
        ...query,
        data: {
          vesselId: args.vesselId,
          latitude: args.latitude,
          longitude: args.longitude,
          speed: args.speed,
          heading: args.heading,
          course: args.course,
          status: args.status,
          destination: args.destination,
          eta: args.eta ? new Date(args.eta) : undefined,
          source: args.source ?? 'manual',
        },
      }),
  }),
);
