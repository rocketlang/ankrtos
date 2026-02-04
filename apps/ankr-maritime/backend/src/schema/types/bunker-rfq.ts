import { builder } from '../builder.js';

// === Prisma Objects ===

builder.prismaObject('BunkerRFQ', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    portId: t.exposeString('portId'),
    fuelType: t.exposeString('fuelType'),
    quantity: t.exposeFloat('quantity'),
    deliveryDate: t.expose('deliveryDate', { type: 'DateTime', nullable: true }),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    vessel: t.relation('vessel'),
    port: t.relation('port'),
    quotes: t.relation('quotes'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('BunkerQuote', {
  fields: (t) => ({
    id: t.exposeID('id'),
    rfqId: t.exposeString('rfqId'),
    supplierId: t.exposeString('supplierId', { nullable: true }),
    supplierName: t.exposeString('supplierName'),
    pricePerMt: t.exposeFloat('pricePerMt'),
    currency: t.exposeString('currency'),
    deliveryMethod: t.exposeString('deliveryMethod'),
    minQuantity: t.exposeFloat('minQuantity', { nullable: true }),
    maxQuantity: t.exposeFloat('maxQuantity', { nullable: true }),
    validUntil: t.expose('validUntil', { type: 'DateTime', nullable: true }),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    rfq: t.relation('rfq'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('bunkerRfqs', (t) =>
  t.prismaField({
    type: ['BunkerRFQ'],
    args: {
      vesselId: t.arg.string(),
      portId: t.arg.string(),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {};
      if (args.vesselId) where.vesselId = args.vesselId;
      if (args.portId) where.portId = args.portId;
      if (args.status) where.status = args.status;
      return ctx.prisma.bunkerRFQ.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
        include: { quotes: true, vessel: true, port: true },
      });
    },
  }),
);

builder.queryField('bunkerRfqById', (t) =>
  t.prismaField({
    type: 'BunkerRFQ',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.bunkerRFQ.findUnique({
        ...query,
        where: { id: args.id },
        include: { quotes: true, vessel: true, port: true },
      }),
  }),
);

builder.queryField('bunkerQuoteComparison', (t) =>
  t.prismaField({
    type: ['BunkerQuote'],
    args: { rfqId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.bunkerQuote.findMany({
        ...query,
        where: { rfqId: args.rfqId },
        orderBy: { pricePerMt: 'asc' },
      }),
  }),
);

// === Mutations ===

builder.mutationField('createBunkerRFQ', (t) =>
  t.prismaField({
    type: 'BunkerRFQ',
    args: {
      vesselId: t.arg.string({ required: true }),
      portId: t.arg.string({ required: true }),
      fuelType: t.arg.string({ required: true }),
      quantity: t.arg.float({ required: true }),
      voyageId: t.arg.string(),
      deliveryDate: t.arg({ type: 'DateTime' }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.bunkerRFQ.create({
        ...query,
        data: {
          vesselId: args.vesselId,
          portId: args.portId,
          fuelType: args.fuelType,
          quantity: args.quantity,
          voyageId: args.voyageId ?? undefined,
          deliveryDate: args.deliveryDate ?? undefined,
          notes: args.notes ?? undefined,
        },
      }),
  }),
);

builder.mutationField('sendBunkerRFQ', (t) =>
  t.prismaField({
    type: 'BunkerRFQ',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.bunkerRFQ.update({
        ...query,
        where: { id: args.id },
        data: { status: 'sent' },
      }),
  }),
);

builder.mutationField('addBunkerQuote', (t) =>
  t.prismaField({
    type: 'BunkerQuote',
    args: {
      rfqId: t.arg.string({ required: true }),
      supplierName: t.arg.string({ required: true }),
      pricePerMt: t.arg.float({ required: true }),
      currency: t.arg.string(),
      deliveryMethod: t.arg.string(),
      supplierId: t.arg.string(),
      minQuantity: t.arg.float(),
      maxQuantity: t.arg.float(),
      validUntil: t.arg({ type: 'DateTime' }),
      notes: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const rfq = await ctx.prisma.bunkerRFQ.findUnique({ where: { id: args.rfqId } });
      if (!rfq) throw new Error('RFQ not found');

      if (rfq.status === 'sent') {
        await ctx.prisma.bunkerRFQ.update({
          where: { id: args.rfqId },
          data: { status: 'quotes_received' },
        });
      }

      return ctx.prisma.bunkerQuote.create({
        ...query,
        data: {
          rfqId: args.rfqId,
          supplierName: args.supplierName,
          pricePerMt: args.pricePerMt,
          currency: args.currency ?? 'USD',
          deliveryMethod: args.deliveryMethod ?? 'barge',
          supplierId: args.supplierId ?? undefined,
          minQuantity: args.minQuantity ?? undefined,
          maxQuantity: args.maxQuantity ?? undefined,
          validUntil: args.validUntil ?? undefined,
          notes: args.notes ?? undefined,
        },
      });
    },
  }),
);

builder.mutationField('awardBunkerQuote', (t) =>
  t.prismaField({
    type: 'BunkerQuote',
    args: { quoteId: t.arg.string({ required: true }) },
    resolve: async (query, _root, args, ctx) => {
      const quote = await ctx.prisma.bunkerQuote.findUnique({ where: { id: args.quoteId } });
      if (!quote) throw new Error('Quote not found');

      // Reject all other quotes for the same RFQ
      await ctx.prisma.bunkerQuote.updateMany({
        where: { rfqId: quote.rfqId, id: { not: args.quoteId } },
        data: { status: 'rejected' },
      });

      // Set RFQ status to awarded
      await ctx.prisma.bunkerRFQ.update({
        where: { id: quote.rfqId },
        data: { status: 'awarded' },
      });

      // Accept the winning quote
      return ctx.prisma.bunkerQuote.update({
        ...query,
        where: { id: args.quoteId },
        data: { status: 'accepted' },
      });
    },
  }),
);

builder.mutationField('cancelBunkerRFQ', (t) =>
  t.prismaField({
    type: 'BunkerRFQ',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.bunkerRFQ.update({
        ...query,
        where: { id: args.id },
        data: { status: 'cancelled' },
      }),
  }),
);
