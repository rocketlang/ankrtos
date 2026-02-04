import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('CargoCompatibility', {
  fields: (t) => ({
    id: t.exposeID('id'),
    cargoA: t.exposeString('cargoA'),
    cargoB: t.exposeString('cargoB'),
    compatible: t.exposeBoolean('compatible'),
    notes: t.exposeString('notes', { nullable: true }),
    source: t.exposeString('source', { nullable: true }),
  }),
});

builder.queryField('cargoCompatibility', (t) =>
  t.prismaField({
    type: ['CargoCompatibility'],
    args: { cargo: t.arg.string({ required: false }) },
    resolve: (query, _root, args) =>
      prisma.cargoCompatibility.findMany({
        ...query,
        where: args.cargo
          ? { OR: [
              { cargoA: { contains: args.cargo, mode: 'insensitive' } },
              { cargoB: { contains: args.cargo, mode: 'insensitive' } },
            ] }
          : {},
        orderBy: { cargoA: 'asc' },
      }),
  }),
);

builder.mutationField('setCargoCompatibility', (t) =>
  t.prismaField({
    type: 'CargoCompatibility',
    args: {
      cargoA: t.arg.string({ required: true }),
      cargoB: t.arg.string({ required: true }),
      compatible: t.arg.boolean({ required: true }),
      notes: t.arg.string({ required: false }),
      source: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.cargoCompatibility.upsert({
        ...query,
        where: { cargoA_cargoB: { cargoA: args.cargoA, cargoB: args.cargoB } },
        create: {
          cargoA: args.cargoA,
          cargoB: args.cargoB,
          compatible: args.compatible,
          notes: args.notes,
          source: args.source ?? 'manual',
        },
        update: {
          compatible: args.compatible,
          notes: args.notes,
          source: args.source,
        },
      }),
  }),
);
