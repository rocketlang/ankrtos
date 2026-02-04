import { builder } from '../builder.js';

// === CashToMaster prisma object ===
builder.prismaObject('CashToMaster', {
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),
    voyageId: t.exposeString('voyageId'),
    vesselId: t.exposeString('vesselId'),
    portId: t.exposeString('portId', { nullable: true }),
    currency: t.exposeString('currency'),
    amount: t.exposeFloat('amount'),
    exchangeRate: t.exposeFloat('exchangeRate'),
    amountUsd: t.exposeFloat('amountUsd'),
    purpose: t.exposeString('purpose'),
    requestedBy: t.exposeString('requestedBy', { nullable: true }),
    approvedBy: t.exposeString('approvedBy', { nullable: true }),
    status: t.exposeString('status'),
    requestDate: t.expose('requestDate', { type: 'DateTime' }),
    disbursedDate: t.expose('disbursedDate', { type: 'DateTime', nullable: true }),
    settledDate: t.expose('settledDate', { type: 'DateTime', nullable: true }),
    receipt: t.exposeString('receipt', { nullable: true }),
    remarks: t.exposeString('remarks', { nullable: true }),
    voyage: t.relation('voyage'),
    vessel: t.relation('vessel'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('cashToMasterList', (t) =>
  t.prismaField({
    type: ['CashToMaster'],
    args: {
      voyageId: t.arg.string(),
      vesselId: t.arg.string(),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.voyageId) where.voyageId = args.voyageId;
      if (args.vesselId) where.vesselId = args.vesselId;
      if (args.status) where.status = args.status;
      return ctx.prisma.cashToMaster.findMany({
        ...query,
        where,
        orderBy: { requestDate: 'desc' },
      });
    },
  }),
);

// CTM Summary — totals by purpose, currency, status
const CTMSummaryEntry = builder.objectRef<{
  purpose: string;
  currency: string;
  status: string;
  count: number;
  totalAmount: number;
  totalAmountUsd: number;
}>('CTMSummaryEntry');

CTMSummaryEntry.implement({
  fields: (t) => ({
    purpose: t.exposeString('purpose'),
    currency: t.exposeString('currency'),
    status: t.exposeString('status'),
    count: t.exposeInt('count'),
    totalAmount: t.exposeFloat('totalAmount'),
    totalAmountUsd: t.exposeFloat('totalAmountUsd'),
  }),
});

const CTMSummary = builder.objectRef<{
  voyageId: string;
  totalItems: number;
  totalAmountUsd: number;
  byPurpose: Array<{ purpose: string; currency: string; status: string; count: number; totalAmount: number; totalAmountUsd: number }>;
  byCurrency: Array<{ purpose: string; currency: string; status: string; count: number; totalAmount: number; totalAmountUsd: number }>;
  byStatus: Array<{ purpose: string; currency: string; status: string; count: number; totalAmount: number; totalAmountUsd: number }>;
}>('CTMSummary');

CTMSummary.implement({
  fields: (t) => ({
    voyageId: t.exposeString('voyageId'),
    totalItems: t.exposeInt('totalItems'),
    totalAmountUsd: t.exposeFloat('totalAmountUsd'),
    byPurpose: t.field({ type: [CTMSummaryEntry], resolve: (parent) => parent.byPurpose }),
    byCurrency: t.field({ type: [CTMSummaryEntry], resolve: (parent) => parent.byCurrency }),
    byStatus: t.field({ type: [CTMSummaryEntry], resolve: (parent) => parent.byStatus }),
  }),
});

builder.queryField('cashToMasterSummary', (t) =>
  t.field({
    type: CTMSummary,
    args: {
      voyageId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const where: Record<string, unknown> = { voyageId: args.voyageId, ...ctx.orgFilter() };
      const items = await ctx.prisma.cashToMaster.findMany({ where });

      const totalAmountUsd = items.reduce((s, i) => s + i.amountUsd, 0);

      // Group by purpose
      const purposeMap = new Map<string, { count: number; totalAmount: number; totalAmountUsd: number }>();
      for (const item of items) {
        const key = item.purpose;
        const existing = purposeMap.get(key) ?? { count: 0, totalAmount: 0, totalAmountUsd: 0 };
        existing.count++;
        existing.totalAmount += item.amount;
        existing.totalAmountUsd += item.amountUsd;
        purposeMap.set(key, existing);
      }
      const byPurpose = [...purposeMap.entries()].map(([purpose, v]) => ({
        purpose,
        currency: 'ALL',
        status: 'ALL',
        ...v,
      }));

      // Group by currency
      const currencyMap = new Map<string, { count: number; totalAmount: number; totalAmountUsd: number }>();
      for (const item of items) {
        const key = item.currency;
        const existing = currencyMap.get(key) ?? { count: 0, totalAmount: 0, totalAmountUsd: 0 };
        existing.count++;
        existing.totalAmount += item.amount;
        existing.totalAmountUsd += item.amountUsd;
        currencyMap.set(key, existing);
      }
      const byCurrency = [...currencyMap.entries()].map(([currency, v]) => ({
        purpose: 'ALL',
        currency,
        status: 'ALL',
        ...v,
      }));

      // Group by status
      const statusMap = new Map<string, { count: number; totalAmount: number; totalAmountUsd: number }>();
      for (const item of items) {
        const key = item.status;
        const existing = statusMap.get(key) ?? { count: 0, totalAmount: 0, totalAmountUsd: 0 };
        existing.count++;
        existing.totalAmount += item.amount;
        existing.totalAmountUsd += item.amountUsd;
        statusMap.set(key, existing);
      }
      const byStatus = [...statusMap.entries()].map(([status, v]) => ({
        purpose: 'ALL',
        currency: 'ALL',
        status,
        ...v,
      }));

      return {
        voyageId: args.voyageId,
        totalItems: items.length,
        totalAmountUsd,
        byPurpose,
        byCurrency,
        byStatus,
      };
    },
  }),
);

// === Mutations ===

builder.mutationField('createCTM', (t) =>
  t.prismaField({
    type: 'CashToMaster',
    args: {
      voyageId: t.arg.string({ required: true }),
      vesselId: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      currency: t.arg.string(),
      exchangeRate: t.arg.float(),
      purpose: t.arg.string({ required: true }),
      portId: t.arg.string(),
      remarks: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const exchangeRate = args.exchangeRate ?? 1.0;
      const amountUsd = args.amount * exchangeRate;
      return ctx.prisma.cashToMaster.create({
        ...query,
        data: {
          organizationId: orgId,
          voyageId: args.voyageId,
          vesselId: args.vesselId,
          amount: args.amount,
          currency: args.currency ?? 'USD',
          exchangeRate,
          amountUsd,
          purpose: args.purpose,
          portId: args.portId ?? undefined,
          remarks: args.remarks ?? undefined,
          requestedBy: ctx.user?.id ?? undefined,
          status: 'requested',
        },
      });
    },
  }),
);

builder.mutationField('approveCTM', (t) =>
  t.prismaField({
    type: 'CashToMaster',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const ctm = await ctx.prisma.cashToMaster.findUnique({ where: { id: args.id } });
      if (!ctm) throw new Error('CTM record not found');
      if (ctm.status !== 'requested') throw new Error(`Cannot approve CTM in status "${ctm.status}"`);
      return ctx.prisma.cashToMaster.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'approved',
          approvedBy: ctx.user?.id ?? undefined,
        },
      });
    },
  }),
);

builder.mutationField('disburseCTM', (t) =>
  t.prismaField({
    type: 'CashToMaster',
    args: {
      id: t.arg.string({ required: true }),
      receipt: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const ctm = await ctx.prisma.cashToMaster.findUnique({ where: { id: args.id } });
      if (!ctm) throw new Error('CTM record not found');
      if (ctm.status !== 'approved') throw new Error(`Cannot disburse CTM in status "${ctm.status}"`);
      return ctx.prisma.cashToMaster.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'disbursed',
          disbursedDate: new Date(),
          receipt: args.receipt ?? undefined,
        },
      });
    },
  }),
);

builder.mutationField('settleCTM', (t) =>
  t.prismaField({
    type: 'CashToMaster',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const ctm = await ctx.prisma.cashToMaster.findUnique({ where: { id: args.id } });
      if (!ctm) throw new Error('CTM record not found');
      if (ctm.status !== 'disbursed') throw new Error(`Cannot settle CTM in status "${ctm.status}"`);
      return ctx.prisma.cashToMaster.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'settled',
          settledDate: new Date(),
        },
      });
    },
  }),
);
