import { builder } from '../builder.js';

// === SNPCommission Prisma Object ===
builder.prismaObject('SNPCommission', {
  fields: (t) => ({
    id: t.exposeID('id'),
    transactionId: t.exposeString('transactionId'),
    organizationId: t.exposeString('organizationId'),
    partyType: t.exposeString('partyType'),
    commissionRate: t.exposeFloat('commissionRate'),
    commissionAmount: t.exposeFloat('commissionAmount', { nullable: true }),
    currency: t.exposeString('currency'),
    invoiceRef: t.exposeString('invoiceRef', { nullable: true }),
    invoiceDate: t.expose('invoiceDate', { type: 'DateTime', nullable: true }),
    paidDate: t.expose('paidDate', { type: 'DateTime', nullable: true }),
    status: t.exposeString('status'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    transaction: t.relation('transaction'),
    organization: t.relation('organization'),
  }),
});

// === Queries ===

builder.queryField('snpCommissions', (t) =>
  t.prismaField({
    type: ['SNPCommission'],
    args: {
      transactionId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {};
      const orgFilter = ctx.orgFilter();
      if (orgFilter.organizationId) {
        where.organizationId = orgFilter.organizationId;
      }
      if (args.transactionId) where.transactionId = args.transactionId;
      return ctx.prisma.sNPCommission.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

// === Mutations ===

builder.mutationField('addCommission', (t) =>
  t.prismaField({
    type: 'SNPCommission',
    args: {
      transactionId: t.arg.string({ required: true }),
      organizationId: t.arg.string({ required: true }),
      partyType: t.arg.string({ required: true }),
      commissionRate: t.arg.float({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Fetch transaction to calculate commission amount
      const transaction = await ctx.prisma.sNPTransaction.findUnique({
        where: { id: args.transactionId },
      });
      if (!transaction) throw new Error('Transaction not found');

      const commissionAmount = (transaction.purchasePrice * args.commissionRate) / 100;

      return ctx.prisma.sNPCommission.create({
        ...query,
        data: {
          transactionId: args.transactionId,
          organizationId: args.organizationId,
          partyType: args.partyType,
          commissionRate: args.commissionRate,
          commissionAmount,
          currency: transaction.currency,
          status: 'pending',
        },
      });
    },
  }),
);

builder.mutationField('updateCommissionStatus', (t) =>
  t.prismaField({
    type: 'SNPCommission',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      invoiceRef: t.arg.string(),
      invoiceDate: t.arg({ type: 'DateTime' }),
      paidDate: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, unknown> = { status: args.status };
      if (args.invoiceRef) data.invoiceRef = args.invoiceRef;
      if (args.invoiceDate) data.invoiceDate = args.invoiceDate;
      if (args.paidDate) data.paidDate = args.paidDate;
      return ctx.prisma.sNPCommission.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);
