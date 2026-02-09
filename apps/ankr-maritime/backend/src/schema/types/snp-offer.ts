import { builder } from '../builder.js';

// === SNPOffer Prisma Object ===
builder.prismaObject('SNPOffer', {
  fields: (t) => ({
    id: t.exposeID('id'),
    saleListingId: t.exposeString('saleListingId'),
    buyerOrgId: t.exposeString('buyerOrgId'),
    sellerOrgId: t.exposeString('sellerOrgId'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    conditions: t.exposeString('conditions', { nullable: true }),
    offerType: t.exposeString('offerType'),
    status: t.exposeString('status'),
    expiresAt: t.expose('expiresAt', { type: 'DateTime', nullable: true }),
    parentOfferId: t.exposeString('parentOfferId', { nullable: true }),
    respondedAt: t.expose('respondedAt', { type: 'DateTime', nullable: true }),
    responseNotes: t.exposeString('responseNotes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    saleListing: t.relation('saleListing'),
    buyerOrg: t.relation('buyerOrg'),
    sellerOrg: t.relation('sellerOrg'),
    parentOffer: t.relation('parentOffer', { nullable: true }),
    counterOffers: t.relation('counterOffers'),
  }),
});

// === Queries ===

builder.queryField('snpOffers', (t) =>
  t.prismaField({
    type: ['SNPOffer'],
    args: {
      saleListingId: t.arg.string({ required: false }), // Made optional - returns all if not provided
      status: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) => {
      const where: any = {};
      if (args.saleListingId) where.saleListingId = args.saleListingId;
      if (args.status) where.status = args.status;

      return ctx.prisma.sNPOffer.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

// === Mutations ===

builder.mutationField('submitOffer', (t) =>
  t.prismaField({
    type: 'SNPOffer',
    args: {
      saleListingId: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      currency: t.arg.string(),
      conditions: t.arg.string(),
      expiresAt: t.arg({ type: 'DateTime' }),
    },
    resolve: async (query, _root, args, ctx) => {
      const buyerOrgId = ctx.orgId();
      const listing = await ctx.prisma.saleListing.findUnique({
        where: { id: args.saleListingId },
      });
      if (!listing) throw new Error('Sale listing not found');
      return ctx.prisma.sNPOffer.create({
        ...query,
        data: {
          saleListingId: args.saleListingId,
          buyerOrgId,
          sellerOrgId: listing.sellerOrgId,
          amount: args.amount,
          currency: args.currency ?? 'USD',
          conditions: args.conditions ?? undefined,
          offerType: 'initial',
          status: 'submitted',
          expiresAt: args.expiresAt ?? undefined,
        },
      });
    },
  }),
);

builder.mutationField('counterOffer', (t) =>
  t.prismaField({
    type: 'SNPOffer',
    args: {
      parentOfferId: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      conditions: t.arg.string(),
      expiresAt: t.arg({ type: 'DateTime' }),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const parentOffer = await ctx.prisma.sNPOffer.findUnique({
        where: { id: args.parentOfferId },
      });
      if (!parentOffer) throw new Error('Parent offer not found');

      // Set parent offer status to countered
      await ctx.prisma.sNPOffer.update({
        where: { id: args.parentOfferId },
        data: { status: 'countered' },
      });

      return ctx.prisma.sNPOffer.create({
        ...query,
        data: {
          saleListingId: parentOffer.saleListingId,
          buyerOrgId: parentOffer.buyerOrgId,
          sellerOrgId: parentOffer.sellerOrgId,
          amount: args.amount,
          currency: parentOffer.currency,
          conditions: args.conditions ?? undefined,
          offerType: 'counter',
          status: 'submitted',
          parentOfferId: args.parentOfferId,
          expiresAt: args.expiresAt ?? undefined,
        },
      });
    },
  }),
);

builder.mutationField('respondToOffer', (t) =>
  t.prismaField({
    type: 'SNPOffer',
    args: {
      id: t.arg.string({ required: true }),
      accept: t.arg.boolean({ required: true }),
      responseNotes: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const status = args.accept ? 'accepted' : 'rejected';

      // If accepted, update listing status to under_offer
      if (args.accept) {
        const offer = await ctx.prisma.sNPOffer.findUnique({
          where: { id: args.id },
        });
        if (!offer) throw new Error('Offer not found');
        await ctx.prisma.saleListing.update({
          where: { id: offer.saleListingId },
          data: { status: 'under_offer' },
        });
      }

      return ctx.prisma.sNPOffer.update({
        ...query,
        where: { id: args.id },
        data: {
          status,
          respondedAt: new Date(),
          responseNotes: args.responseNotes ?? undefined,
        },
      });
    },
  }),
);

builder.mutationField('withdrawOffer', (t) =>
  t.prismaField({
    type: 'SNPOffer',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.sNPOffer.update({
        ...query,
        where: { id: args.id },
        data: { status: 'withdrawn' },
      }),
  }),
);
