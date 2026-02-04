import { builder } from '../builder.js';

// === TradePayment ===
builder.prismaObject('TradePayment', {
  fields: (t) => ({
    id: t.exposeID('id'),
    reference: t.exposeString('reference'),
    paymentType: t.exposeString('paymentType'),
    status: t.exposeString('status'),
    payer: t.exposeString('payer'),
    payee: t.exposeString('payee'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    amountUsd: t.exposeFloat('amountUsd', { nullable: true }),
    exchangeRate: t.exposeFloat('exchangeRate', { nullable: true }),
    dueDate: t.expose('dueDate', { type: 'DateTime' }),
    paidDate: t.expose('paidDate', { type: 'DateTime', nullable: true }),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    invoiceRef: t.exposeString('invoiceRef', { nullable: true }),
    bankReference: t.exposeString('bankReference', { nullable: true }),
    swiftRef: t.exposeString('swiftRef', { nullable: true }),
    paymentMethod: t.exposeString('paymentMethod', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    organization: t.relation('organization'),
    voyage: t.relation('voyage', { nullable: true }),
  }),
});

// === Custom Objects for PaymentSummary ===

const PaymentByType = builder.objectRef<{
  paymentType: string;
  count: number;
  totalAmount: number;
}>('PaymentByType');

PaymentByType.implement({
  fields: (t) => ({
    paymentType: t.exposeString('paymentType'),
    count: t.exposeInt('count'),
    totalAmount: t.exposeFloat('totalAmount'),
  }),
});

const PaymentByCurrency = builder.objectRef<{
  currency: string;
  totalAmount: number;
}>('PaymentByCurrency');

PaymentByCurrency.implement({
  fields: (t) => ({
    currency: t.exposeString('currency'),
    totalAmount: t.exposeFloat('totalAmount'),
  }),
});

const PaymentSummary = builder.objectRef<{
  totalPending: number;
  totalOverdue: number;
  totalPaid: number;
  byType: { paymentType: string; count: number; totalAmount: number }[];
  byCurrency: { currency: string; totalAmount: number }[];
}>('PaymentSummary');

PaymentSummary.implement({
  fields: (t) => ({
    totalPending: t.exposeFloat('totalPending'),
    totalOverdue: t.exposeFloat('totalOverdue'),
    totalPaid: t.exposeFloat('totalPaid'),
    byType: t.field({
      type: [PaymentByType],
      resolve: (parent) => parent.byType,
    }),
    byCurrency: t.field({
      type: [PaymentByCurrency],
      resolve: (parent) => parent.byCurrency,
    }),
  }),
});

// === Queries ===

builder.queryField('tradePayments', (t) =>
  t.prismaField({
    type: ['TradePayment'],
    args: {
      status: t.arg.string(),
      paymentType: t.arg.string(),
      voyageId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.status) where.status = args.status;
      if (args.paymentType) where.paymentType = args.paymentType;
      if (args.voyageId) where.voyageId = args.voyageId;
      return ctx.prisma.tradePayment.findMany({
        ...query,
        where,
        orderBy: { dueDate: 'asc' },
      });
    },
  }),
);

builder.queryField('tradePayment', (t) =>
  t.prismaField({
    type: 'TradePayment',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.tradePayment.findUnique({
        ...query,
        where: { id: args.id },
      }),
  }),
);

builder.queryField('paymentSummary', (t) =>
  t.field({
    type: PaymentSummary,
    resolve: async (_root, _args, ctx) => {
      const payments = await ctx.prisma.tradePayment.findMany({
        where: ctx.orgFilter(),
      });

      let totalPending = 0;
      let totalOverdue = 0;
      let totalPaid = 0;

      const typeMap = new Map<string, { count: number; totalAmount: number }>();
      const currencyMap = new Map<string, number>();

      for (const p of payments) {
        if (p.status === 'pending') totalPending += p.amount;
        if (p.status === 'overdue') totalOverdue += p.amount;
        if (p.status === 'paid') totalPaid += p.amount;

        const typeEntry = typeMap.get(p.paymentType) ?? { count: 0, totalAmount: 0 };
        typeEntry.count++;
        typeEntry.totalAmount += p.amount;
        typeMap.set(p.paymentType, typeEntry);

        currencyMap.set(p.currency, (currencyMap.get(p.currency) ?? 0) + p.amount);
      }

      const byType = Array.from(typeMap.entries()).map(([paymentType, data]) => ({
        paymentType,
        count: data.count,
        totalAmount: data.totalAmount,
      }));

      const byCurrency = Array.from(currencyMap.entries()).map(([currency, totalAmount]) => ({
        currency,
        totalAmount,
      }));

      return { totalPending, totalOverdue, totalPaid, byType, byCurrency };
    },
  }),
);

// === Mutations ===

builder.mutationField('createTradePayment', (t) =>
  t.prismaField({
    type: 'TradePayment',
    args: {
      reference: t.arg.string({ required: true }),
      paymentType: t.arg.string({ required: true }),
      payer: t.arg.string({ required: true }),
      payee: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      currency: t.arg.string(),
      dueDate: t.arg({ type: 'DateTime', required: true }),
      voyageId: t.arg.string(),
      invoiceRef: t.arg.string(),
      notes: t.arg.string(),
      exchangeRate: t.arg.float(),
    },
    resolve: (query, _root, args, ctx) => {
      const currency = args.currency ?? 'USD';
      const exchangeRate = args.exchangeRate ?? (currency === 'USD' ? 1.0 : undefined);
      const amountUsd = exchangeRate ? args.amount * exchangeRate : undefined;

      return ctx.prisma.tradePayment.create({
        ...query,
        data: {
          reference: args.reference,
          paymentType: args.paymentType,
          status: 'pending',
          payer: args.payer,
          payee: args.payee,
          amount: args.amount,
          currency,
          amountUsd,
          exchangeRate,
          dueDate: args.dueDate,
          voyageId: args.voyageId ?? undefined,
          invoiceRef: args.invoiceRef ?? undefined,
          notes: args.notes ?? undefined,
          organizationId: ctx.orgId(),
        },
      });
    },
  }),
);

builder.mutationField('approvePayment', (t) =>
  t.prismaField({
    type: 'TradePayment',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.tradePayment.update({
        ...query,
        where: { id: args.id },
        data: { status: 'approved' },
      }),
  }),
);

builder.mutationField('recordTradePayment', (t) =>
  t.prismaField({
    type: 'TradePayment',
    args: {
      id: t.arg.string({ required: true }),
      bankReference: t.arg.string(),
      swiftRef: t.arg.string(),
      paymentMethod: t.arg.string(),
      paidDate: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.tradePayment.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'paid',
          paidDate: args.paidDate ?? new Date(),
          bankReference: args.bankReference ?? undefined,
          swiftRef: args.swiftRef ?? undefined,
          paymentMethod: args.paymentMethod ?? undefined,
        },
      }),
  }),
);

builder.mutationField('markPaymentOverdue', (t) =>
  t.prismaField({
    type: 'TradePayment',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.tradePayment.update({
        ...query,
        where: { id: args.id },
        data: { status: 'overdue' },
      }),
  }),
);
