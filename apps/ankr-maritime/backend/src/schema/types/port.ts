import { builder } from '../builder.js';

builder.prismaObject('Port', {
  fields: (t) => ({
    id: t.exposeID('id'),
    unlocode: t.exposeString('unlocode'),
    name: t.exposeString('name'),
    country: t.exposeString('country'),
    latitude: t.exposeFloat('latitude', { nullable: true }),
    longitude: t.exposeFloat('longitude', { nullable: true }),
    timezone: t.exposeString('timezone', { nullable: true }),
    type: t.exposeString('type'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('ports', (t) =>
  t.prismaField({
    type: ['Port'],
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.port.findMany({ ...query, orderBy: { name: 'asc' } }),
  }),
);

builder.queryField('port', (t) =>
  t.prismaField({
    type: 'Port',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.port.findUnique({ ...query, where: { id: args.id } }),
  }),
);

builder.queryField('portByUnlocode', (t) =>
  t.prismaField({
    type: 'Port',
    nullable: true,
    args: { unlocode: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.port.findUnique({ ...query, where: { unlocode: args.unlocode } }),
  }),
);

builder.mutationField('createPort', (t) =>
  t.prismaField({
    type: 'Port',
    args: {
      unlocode: t.arg.string({ required: true }),
      name: t.arg.string({ required: true }),
      country: t.arg.string({ required: true }),
      latitude: t.arg.float(),
      longitude: t.arg.float(),
      timezone: t.arg.string(),
      type: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.port.create({
        ...query,
        data: {
          unlocode: args.unlocode,
          name: args.name,
          country: args.country,
          latitude: args.latitude ?? undefined,
          longitude: args.longitude ?? undefined,
          timezone: args.timezone ?? undefined,
          type: args.type ?? 'seaport',
        },
      }),
  }),
);
