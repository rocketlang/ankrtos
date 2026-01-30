import { builder } from '../builder.js';

builder.prismaObject('Voyage', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageNumber: t.exposeString('voyageNumber'),
    vesselId: t.exposeString('vesselId'),
    charterId: t.exposeString('charterId', { nullable: true }),
    cargoId: t.exposeString('cargoId', { nullable: true }),
    departurePortId: t.exposeString('departurePortId', { nullable: true }),
    arrivalPortId: t.exposeString('arrivalPortId', { nullable: true }),
    status: t.exposeString('status'),
    etd: t.expose('etd', { type: 'DateTime', nullable: true }),
    eta: t.expose('eta', { type: 'DateTime', nullable: true }),
    atd: t.expose('atd', { type: 'DateTime', nullable: true }),
    ata: t.expose('ata', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('voyages', (t) =>
  t.prismaField({
    type: ['Voyage'],
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.voyage.findMany({ ...query, orderBy: { createdAt: 'desc' } }),
  }),
);

builder.queryField('voyage', (t) =>
  t.prismaField({
    type: 'Voyage',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.voyage.findUnique({ ...query, where: { id: args.id } }),
  }),
);

builder.mutationField('createVoyage', (t) =>
  t.prismaField({
    type: 'Voyage',
    args: {
      voyageNumber: t.arg.string({ required: true }),
      vesselId: t.arg.string({ required: true }),
      charterId: t.arg.string(),
      cargoId: t.arg.string(),
      departurePortId: t.arg.string(),
      arrivalPortId: t.arg.string(),
      etd: t.arg({ type: 'DateTime' }),
      eta: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.voyage.create({
        ...query,
        data: {
          voyageNumber: args.voyageNumber,
          vesselId: args.vesselId,
          charterId: args.charterId ?? undefined,
          cargoId: args.cargoId ?? undefined,
          departurePortId: args.departurePortId ?? undefined,
          arrivalPortId: args.arrivalPortId ?? undefined,
          etd: args.etd ?? undefined,
          eta: args.eta ?? undefined,
        },
      }),
  }),
);

builder.mutationField('updateVoyageStatus', (t) =>
  t.prismaField({
    type: 'Voyage',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      atd: t.arg({ type: 'DateTime' }),
      ata: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.voyage.update({
        ...query,
        where: { id: args.id },
        data: {
          status: args.status,
          atd: args.atd ?? undefined,
          ata: args.ata ?? undefined,
        },
      }),
  }),
);
