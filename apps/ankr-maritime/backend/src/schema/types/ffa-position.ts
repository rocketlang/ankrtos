import { builder } from '../builder.js';

// ─── PrismaObjects ───────────────────────────────────────────────────────────

builder.prismaObject('FFATrade', {
  fields: (t) => ({
    id: t.exposeID('id'),
    positionId: t.exposeString('positionId'),
    tradeType: t.exposeString('tradeType'),
    direction: t.exposeString('direction'),
    quantity: t.exposeFloat('quantity'),
    price: t.exposeFloat('price'),
    fees: t.exposeFloat('fees'),
    clearingFee: t.exposeFloat('clearingFee'),
    brokerFee: t.exposeFloat('brokerFee'),
    counterparty: t.exposeString('counterparty', { nullable: true }),
    broker: t.exposeString('broker', { nullable: true }),
    tradeDate: t.expose('tradeDate', { type: 'DateTime' }),
    settlementDate: t.expose('settlementDate', { type: 'DateTime', nullable: true }),
    reference: t.exposeString('reference', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    position: t.relation('position'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('FFAPosition', {
  fields: (t) => ({
    id: t.exposeID('id'),
    route: t.exposeString('route'),
    period: t.exposeString('period'),
    direction: t.exposeString('direction'),
    quantity: t.exposeFloat('quantity'),
    lotSize: t.exposeFloat('lotSize'),
    entryPrice: t.exposeFloat('entryPrice'),
    currentPrice: t.exposeFloat('currentPrice', { nullable: true }),
    mtmValue: t.exposeFloat('mtmValue', { nullable: true }),
    clearingHouse: t.exposeString('clearingHouse', { nullable: true }),
    clearingRef: t.exposeString('clearingRef', { nullable: true }),
    margin: t.exposeFloat('margin', { nullable: true }),
    variationMargin: t.exposeFloat('variationMargin', { nullable: true }),
    counterparty: t.exposeString('counterparty', { nullable: true }),
    broker: t.exposeString('broker', { nullable: true }),
    physicalVoyageId: t.exposeString('physicalVoyageId', { nullable: true }),
    status: t.exposeString('status'),
    tradeDate: t.expose('tradeDate', { type: 'DateTime' }),
    expiryDate: t.expose('expiryDate', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    organization: t.relation('organization'),
    trades: t.relation('trades'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

builder.queryField('ffaPositions', (t) =>
  t.prismaField({
    type: ['FFAPosition'],
    args: {
      status: t.arg.string(),
      route: t.arg.string(),
      direction: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.status) where.status = args.status;
      if (args.route) where.route = args.route;
      if (args.direction) where.direction = args.direction;
      return ctx.prisma.fFAPosition.findMany({
        ...query,
        where,
        orderBy: { tradeDate: 'desc' },
      });
    },
  }),
);

builder.queryField('ffaPosition', (t) =>
  t.prismaField({
    type: 'FFAPosition',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.fFAPosition.findUnique({
        ...query,
        where: { id: args.id },
        include: { trades: { orderBy: { tradeDate: 'desc' } } },
      }),
  }),
);

// ─── Mutations ───────────────────────────────────────────────────────────────

builder.mutationField('openFFAPosition', (t) =>
  t.prismaField({
    type: 'FFAPosition',
    args: {
      route: t.arg.string({ required: true }),
      period: t.arg.string({ required: true }),
      direction: t.arg.string({ required: true }),
      quantity: t.arg.float({ required: true }),
      lotSize: t.arg.float(),
      entryPrice: t.arg.float({ required: true }),
      clearingHouse: t.arg.string(),
      counterparty: t.arg.string(),
      broker: t.arg.string(),
      physicalVoyageId: t.arg.string(),
      expiryDate: t.arg({ type: 'DateTime' }),
      notes: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const lotSize = args.lotSize ?? 1000;
      const tradeDirection = args.direction === 'long' ? 'buy' : 'sell';

      return ctx.prisma.fFAPosition.create({
        ...query,
        data: {
          route: args.route,
          period: args.period,
          direction: args.direction,
          quantity: args.quantity,
          lotSize,
          entryPrice: args.entryPrice,
          currentPrice: args.entryPrice,
          mtmValue: 0,
          clearingHouse: args.clearingHouse ?? undefined,
          counterparty: args.counterparty ?? undefined,
          broker: args.broker ?? undefined,
          physicalVoyageId: args.physicalVoyageId ?? undefined,
          expiryDate: args.expiryDate ?? undefined,
          notes: args.notes ?? undefined,
          status: 'open',
          organizationId: orgId,
          trades: {
            create: {
              tradeType: 'open',
              direction: tradeDirection,
              quantity: args.quantity,
              price: args.entryPrice,
              counterparty: args.counterparty ?? undefined,
              broker: args.broker ?? undefined,
              organizationId: orgId,
            },
          },
        },
      });
    },
  }),
);

builder.mutationField('closeFFAPosition', (t) =>
  t.prismaField({
    type: 'FFAPosition',
    args: {
      id: t.arg.string({ required: true }),
      closePrice: t.arg.float({ required: true }),
      quantity: t.arg.float(),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const position = await ctx.prisma.fFAPosition.findUnique({
        where: { id: args.id },
      });
      if (!position) throw new Error('FFA Position not found');
      if (position.status === 'closed') throw new Error('Position is already closed');

      const closeQty = args.quantity ?? position.quantity;
      const isFullClose = closeQty >= position.quantity;
      const tradeDirection = position.direction === 'long' ? 'sell' : 'buy';
      const dirMultiplier = position.direction === 'long' ? 1 : -1;
      const closeMtm =
        (args.closePrice - position.entryPrice) * closeQty * position.lotSize * dirMultiplier;

      if (isFullClose) {
        // Full close
        return ctx.prisma.fFAPosition.update({
          ...query,
          where: { id: args.id },
          data: {
            status: 'closed',
            currentPrice: args.closePrice,
            mtmValue: closeMtm,
            trades: {
              create: {
                tradeType: 'close',
                direction: tradeDirection,
                quantity: closeQty,
                price: args.closePrice,
                organizationId: orgId,
              },
            },
          },
        });
      }

      // Partial close
      const remainingQty = position.quantity - closeQty;
      const remainingMtm =
        (args.closePrice - position.entryPrice) *
        remainingQty *
        position.lotSize *
        dirMultiplier;

      return ctx.prisma.fFAPosition.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'partially_closed',
          quantity: remainingQty,
          currentPrice: args.closePrice,
          mtmValue: remainingMtm,
          trades: {
            create: {
              tradeType: 'partial_close',
              direction: tradeDirection,
              quantity: closeQty,
              price: args.closePrice,
              organizationId: orgId,
            },
          },
        },
      });
    },
  }),
);

builder.mutationField('rollFFAPosition', (t) =>
  t.prismaField({
    type: 'FFAPosition',
    args: {
      id: t.arg.string({ required: true }),
      newPeriod: t.arg.string({ required: true }),
      rollPrice: t.arg.float({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const position = await ctx.prisma.fFAPosition.findUnique({
        where: { id: args.id },
      });
      if (!position) throw new Error('FFA Position not found');
      if (position.status === 'closed') throw new Error('Position is already closed');

      const closeDirection = position.direction === 'long' ? 'sell' : 'buy';
      const openDirection = position.direction === 'long' ? 'buy' : 'sell';
      const dirMultiplier = position.direction === 'long' ? 1 : -1;
      const closeMtm =
        (args.rollPrice - position.entryPrice) *
        position.quantity *
        position.lotSize *
        dirMultiplier;

      // Close current position with roll trade
      await ctx.prisma.fFAPosition.update({
        where: { id: args.id },
        data: {
          status: 'closed',
          currentPrice: args.rollPrice,
          mtmValue: closeMtm,
          trades: {
            create: {
              tradeType: 'roll',
              direction: closeDirection,
              quantity: position.quantity,
              price: args.rollPrice,
              organizationId: orgId,
            },
          },
        },
      });

      // Open new position for the next period
      return ctx.prisma.fFAPosition.create({
        ...query,
        data: {
          route: position.route,
          period: args.newPeriod,
          direction: position.direction,
          quantity: position.quantity,
          lotSize: position.lotSize,
          entryPrice: args.rollPrice,
          currentPrice: args.rollPrice,
          mtmValue: 0,
          clearingHouse: position.clearingHouse ?? undefined,
          counterparty: position.counterparty ?? undefined,
          broker: position.broker ?? undefined,
          physicalVoyageId: position.physicalVoyageId ?? undefined,
          notes: `Rolled from position ${args.id} (${position.period})`,
          status: 'open',
          organizationId: orgId,
          trades: {
            create: {
              tradeType: 'roll',
              direction: openDirection,
              quantity: position.quantity,
              price: args.rollPrice,
              organizationId: orgId,
            },
          },
        },
      });
    },
  }),
);

builder.mutationField('updateMTM', (t) =>
  t.prismaField({
    type: 'FFAPosition',
    args: {
      id: t.arg.string({ required: true }),
      currentPrice: t.arg.float({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const position = await ctx.prisma.fFAPosition.findUnique({
        where: { id: args.id },
      });
      if (!position) throw new Error('FFA Position not found');

      const dirMultiplier = position.direction === 'long' ? 1 : -1;
      const mtmValue =
        (args.currentPrice - position.entryPrice) *
        position.quantity *
        position.lotSize *
        dirMultiplier;
      const variationMargin = mtmValue - (position.mtmValue ?? 0);

      return ctx.prisma.fFAPosition.update({
        ...query,
        where: { id: args.id },
        data: {
          currentPrice: args.currentPrice,
          mtmValue,
          variationMargin,
        },
      });
    },
  }),
);
