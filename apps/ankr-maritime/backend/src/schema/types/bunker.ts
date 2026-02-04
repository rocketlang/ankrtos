import { builder } from '../builder.js';

builder.prismaObject('BunkerStem', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageId: t.exposeString('voyageId'),
    portId: t.exposeString('portId', { nullable: true }),
    fuelType: t.exposeString('fuelType'),
    quantity: t.exposeFloat('quantity'),
    delivered: t.exposeFloat('delivered', { nullable: true }),
    pricePerMt: t.exposeFloat('pricePerMt'),
    supplier: t.exposeString('supplier', { nullable: true }),
    status: t.exposeString('status'),
    stemDate: t.expose('stemDate', { type: 'DateTime', nullable: true }),
    deliveryDate: t.expose('deliveryDate', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    voyage: t.relation('voyage'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('BunkerROB', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageId: t.exposeString('voyageId'),
    fuelType: t.exposeString('fuelType'),
    quantity: t.exposeFloat('quantity'),
    reportDate: t.expose('reportDate', { type: 'DateTime' }),
    location: t.exposeString('location', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    voyage: t.relation('voyage'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// Queries
builder.queryField('bunkerStems', (t) =>
  t.prismaField({
    type: ['BunkerStem'],
    args: { voyageId: t.arg.string() },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      return ctx.prisma.bunkerStem.findMany({
        ...query,
        where: {
          ...(args.voyageId ? { voyageId: args.voyageId } : {}),
          ...(orgId ? { voyage: { vessel: { organizationId: orgId } } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: { voyage: { include: { vessel: true } } },
      });
    },
  }),
);

builder.queryField('bunkerROBHistory', (t) =>
  t.prismaField({
    type: ['BunkerROB'],
    args: { voyageId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.bunkerROB.findMany({
        ...query,
        where: { voyageId: args.voyageId },
        orderBy: { reportDate: 'desc' },
      }),
  }),
);

// Summary
const BunkerSummary = builder.objectRef<{
  totalOrdered: number;
  totalDelivered: number;
  totalCost: number;
  stemCount: number;
  currency: string;
}>('BunkerSummary');

BunkerSummary.implement({
  fields: (t) => ({
    totalOrdered: t.exposeFloat('totalOrdered'),
    totalDelivered: t.exposeFloat('totalDelivered'),
    totalCost: t.exposeFloat('totalCost'),
    stemCount: t.exposeInt('stemCount'),
    currency: t.exposeString('currency'),
  }),
});

builder.queryField('bunkerSummary', (t) =>
  t.field({
    type: BunkerSummary,
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.user?.organizationId;
      const stems = await ctx.prisma.bunkerStem.findMany({
        where: orgId ? { voyage: { vessel: { organizationId: orgId } } } : {},
      });
      let totalOrdered = 0, totalDelivered = 0, totalCost = 0;
      for (const s of stems) {
        totalOrdered += s.quantity;
        totalDelivered += s.delivered ?? 0;
        totalCost += (s.delivered ?? s.quantity) * s.pricePerMt;
      }
      return { totalOrdered, totalDelivered, totalCost, stemCount: stems.length, currency: 'USD' };
    },
  }),
);

// Mutations
builder.mutationField('createBunkerStem', (t) =>
  t.prismaField({
    type: 'BunkerStem',
    args: {
      voyageId: t.arg.string({ required: true }),
      fuelType: t.arg.string({ required: true }),
      quantity: t.arg.float({ required: true }),
      pricePerMt: t.arg.float({ required: true }),
      supplier: t.arg.string(),
      portId: t.arg.string(),
      stemDate: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.bunkerStem.create({
        ...query,
        data: {
          voyageId: args.voyageId,
          fuelType: args.fuelType,
          quantity: args.quantity,
          pricePerMt: args.pricePerMt,
          supplier: args.supplier ?? undefined,
          portId: args.portId ?? undefined,
          stemDate: args.stemDate ?? undefined,
        },
      }),
  }),
);

builder.mutationField('updateBunkerStemStatus', (t) =>
  t.prismaField({
    type: 'BunkerStem',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      delivered: t.arg.float(),
      deliveryDate: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.bunkerStem.update({
        ...query,
        where: { id: args.id },
        data: {
          status: args.status,
          delivered: args.delivered ?? undefined,
          deliveryDate: args.deliveryDate ?? undefined,
        },
      }),
  }),
);

builder.mutationField('recordBunkerROB', (t) =>
  t.prismaField({
    type: 'BunkerROB',
    args: {
      voyageId: t.arg.string({ required: true }),
      fuelType: t.arg.string({ required: true }),
      quantity: t.arg.float({ required: true }),
      reportDate: t.arg({ type: 'DateTime', required: true }),
      location: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.bunkerROB.create({
        ...query,
        data: {
          voyageId: args.voyageId,
          fuelType: args.fuelType,
          quantity: args.quantity,
          reportDate: args.reportDate,
          location: args.location ?? undefined,
        },
      }),
  }),
);
