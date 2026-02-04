import { builder } from '../builder.js';

builder.prismaObject('Cargo', {
  fields: (t) => ({
    id: t.exposeID('id'),
    commodity: t.exposeString('commodity'),
    hsCode: t.exposeString('hsCode', { nullable: true }),
    quantity: t.exposeFloat('quantity'),
    packaging: t.exposeString('packaging'),
    description: t.exposeString('description', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.queryField('cargoes', (t) =>
  t.prismaField({
    type: ['Cargo'],
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.cargo.findMany({ ...query, orderBy: { commodity: 'asc' } }),
  }),
);

builder.mutationField('createCargo', (t) =>
  t.prismaField({
    type: 'Cargo',
    args: {
      commodity: t.arg.string({ required: true }),
      hsCode: t.arg.string(),
      quantity: t.arg.float({ required: true }),
      packaging: t.arg.string(),
      description: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.cargo.create({
        ...query,
        data: {
          commodity: args.commodity,
          hsCode: args.hsCode ?? undefined,
          quantity: args.quantity,
          packaging: args.packaging ?? 'bulk',
          description: args.description ?? undefined,
        },
      }),
  }),
);
