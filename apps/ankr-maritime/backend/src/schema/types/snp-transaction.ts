import { builder } from '../builder.js';

// === SNPTransaction Prisma Object ===
builder.prismaObject('SNPTransaction', {
  fields: (t) => ({
    id: t.exposeID('id'),
    saleListingId: t.exposeString('saleListingId'),
    buyerOrgId: t.exposeString('buyerOrgId'),
    sellerOrgId: t.exposeString('sellerOrgId'),
    moaDate: t.expose('moaDate', { type: 'DateTime', nullable: true }),
    moaRef: t.exposeString('moaRef', { nullable: true }),
    moaTemplate: t.exposeString('moaTemplate', { nullable: true }),
    purchasePrice: t.exposeFloat('purchasePrice'),
    currency: t.exposeString('currency'),
    depositAmount: t.exposeFloat('depositAmount', { nullable: true }),
    depositPercent: t.exposeFloat('depositPercent', { nullable: true }),
    depositDueDate: t.expose('depositDueDate', { type: 'DateTime', nullable: true }),
    depositPaidDate: t.expose('depositPaidDate', { type: 'DateTime', nullable: true }),
    depositBankRef: t.exposeString('depositBankRef', { nullable: true }),
    deliveryDate: t.expose('deliveryDate', { type: 'DateTime', nullable: true }),
    deliveryPort: t.exposeString('deliveryPort', { nullable: true }),
    deliveryCondition: t.exposeString('deliveryCondition', { nullable: true }),
    cancellationDate: t.expose('cancellationDate', { type: 'DateTime', nullable: true }),
    status: t.exposeString('status'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    saleListing: t.relation('saleListing'),
    buyerOrg: t.relation('buyerOrg'),
    sellerOrg: t.relation('sellerOrg'),
    commissions: t.relation('commissions'),
    closingItems: t.relation('closingItems'),
  }),
});

// === Queries ===

builder.queryField('snpTransactions', (t) =>
  t.prismaField({
    type: ['SNPTransaction'],
    args: {
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      const where: Record<string, unknown> = {};
      if (args.status) where.status = args.status;
      // Multi-tenancy: match on either buyer or seller org
      if (orgId) {
        where.OR = [
          { buyerOrgId: orgId },
          { sellerOrgId: orgId },
        ];
      }
      return ctx.prisma.sNPTransaction.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('snpTransaction', (t) =>
  t.prismaField({
    type: 'SNPTransaction',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.sNPTransaction.findUnique({ ...query, where: { id: args.id } }),
  }),
);

// === Mutations ===

builder.mutationField('createTransaction', (t) =>
  t.prismaField({
    type: 'SNPTransaction',
    args: {
      saleListingId: t.arg.string({ required: true }),
      purchasePrice: t.arg.float({ required: true }),
      currency: t.arg.string(),
      moaTemplate: t.arg.string(),
      depositPercent: t.arg.float(),
      deliveryPort: t.arg.string(),
      deliveryCondition: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const listing = await ctx.prisma.saleListing.findUnique({
        where: { id: args.saleListingId },
      });
      if (!listing) throw new Error('Sale listing not found');

      const depositPercent = args.depositPercent ?? 10;
      const depositAmount = (args.purchasePrice * depositPercent) / 100;

      return ctx.prisma.sNPTransaction.create({
        ...query,
        data: {
          saleListingId: args.saleListingId,
          buyerOrgId: ctx.orgId(),
          sellerOrgId: listing.sellerOrgId,
          purchasePrice: args.purchasePrice,
          currency: args.currency ?? 'USD',
          moaTemplate: args.moaTemplate ?? undefined,
          depositPercent,
          depositAmount,
          deliveryPort: args.deliveryPort ?? undefined,
          deliveryCondition: args.deliveryCondition ?? undefined,
          status: 'moa_draft',
        },
      });
    },
  }),
);

builder.mutationField('updateTransactionStatus', (t) =>
  t.prismaField({
    type: 'SNPTransaction',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      moaDate: t.arg({ type: 'DateTime' }),
      moaRef: t.arg.string(),
      depositPaidDate: t.arg({ type: 'DateTime' }),
      depositBankRef: t.arg.string(),
      deliveryDate: t.arg({ type: 'DateTime' }),
      cancellationDate: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, unknown> = { status: args.status };
      if (args.moaDate) data.moaDate = args.moaDate;
      if (args.moaRef) data.moaRef = args.moaRef;
      if (args.depositPaidDate) data.depositPaidDate = args.depositPaidDate;
      if (args.depositBankRef) data.depositBankRef = args.depositBankRef;
      if (args.deliveryDate) data.deliveryDate = args.deliveryDate;
      if (args.cancellationDate) data.cancellationDate = args.cancellationDate;
      return ctx.prisma.sNPTransaction.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);

builder.mutationField('recordDeposit', (t) =>
  t.prismaField({
    type: 'SNPTransaction',
    args: {
      id: t.arg.string({ required: true }),
      depositBankRef: t.arg.string({ required: true }),
      depositPaidDate: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.sNPTransaction.update({
        ...query,
        where: { id: args.id },
        data: {
          depositBankRef: args.depositBankRef,
          depositPaidDate: args.depositPaidDate ?? new Date(),
          status: 'deposit_paid',
        },
      }),
  }),
);
