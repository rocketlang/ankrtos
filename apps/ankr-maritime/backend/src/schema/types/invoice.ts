import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('Invoice', {
  fields: (t) => ({
    id: t.exposeID('id'),
    invoiceNumber: t.exposeString('invoiceNumber'),
    type: t.exposeString('type'),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    charterId: t.exposeString('charterId', { nullable: true }),
    companyId: t.exposeString('companyId', { nullable: true }),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    taxAmount: t.exposeFloat('taxAmount'),
    totalAmount: t.exposeFloat('totalAmount'),
    status: t.exposeString('status'),
    issueDate: t.expose('issueDate', { type: 'DateTime' }),
    dueDate: t.expose('dueDate', { type: 'DateTime', nullable: true }),
    paidDate: t.expose('paidDate', { type: 'DateTime', nullable: true }),
    paidAmount: t.exposeFloat('paidAmount'),
    description: t.exposeString('description', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    payments: t.relation('payments'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('Payment', {
  fields: (t) => ({
    id: t.exposeID('id'),
    invoiceId: t.exposeString('invoiceId'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    method: t.exposeString('method'),
    reference: t.exposeString('reference', { nullable: true }),
    bankName: t.exposeString('bankName', { nullable: true }),
    settledDate: t.expose('settledDate', { type: 'DateTime', nullable: true }),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    invoice: t.relation('invoice'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('Commission', {
  fields: (t) => ({
    id: t.exposeID('id'),
    charterId: t.exposeString('charterId', { nullable: true }),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    partyId: t.exposeString('partyId', { nullable: true }),
    type: t.exposeString('type'),
    percentage: t.exposeFloat('percentage'),
    baseAmount: t.exposeFloat('baseAmount'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('invoices', (t) =>
  t.prismaField({
    type: ['Invoice'],
    args: {
      status: t.arg.string({ required: false }),
      type: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) =>
      prisma.invoice.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.status ? { status: args.status } : {}),
          ...(args.type ? { type: args.type } : {}),
        },
        orderBy: { issueDate: 'desc' },
      }),
  }),
);

builder.queryField('invoice', (t) =>
  t.prismaField({
    type: 'Invoice',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.invoice.findUnique({ ...query, where: { id: args.id } }),
  }),
);

builder.queryField('commissions', (t) =>
  t.prismaField({
    type: ['Commission'],
    args: { charterId: t.arg.string({ required: false }) },
    resolve: (query, _root, args, ctx) =>
      prisma.commission.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.charterId ? { charterId: args.charterId } : {}),
        },
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

const InvoiceSummaryRef = builder.objectRef<{
  totalIssued: number;
  totalPaid: number;
  totalOverdue: number;
  count: number;
}>('InvoiceSummary');

InvoiceSummaryRef.implement({
  fields: (t) => ({
    totalIssued: t.exposeFloat('totalIssued'),
    totalPaid: t.exposeFloat('totalPaid'),
    totalOverdue: t.exposeFloat('totalOverdue'),
    count: t.exposeInt('count'),
  }),
});

builder.queryField('invoiceSummary', (t) =>
  t.field({
    type: InvoiceSummaryRef,
    resolve: async (_root, _args, ctx) => {
      const invoices = await prisma.invoice.findMany({
        where: ctx.orgFilter(),
      });
      const now = new Date();
      let totalIssued = 0, totalPaid = 0, totalOverdue = 0;
      for (const inv of invoices) {
        totalIssued += inv.totalAmount;
        totalPaid += inv.paidAmount;
        if (inv.dueDate && inv.dueDate < now && inv.status !== 'paid' && inv.status !== 'cancelled') {
          totalOverdue += inv.totalAmount - inv.paidAmount;
        }
      }
      return { totalIssued, totalPaid, totalOverdue, count: invoices.length };
    },
  }),
);

// === Mutations ===

builder.mutationField('createInvoice', (t) =>
  t.prismaField({
    type: 'Invoice',
    args: {
      type: t.arg.string({ required: true }),
      companyId: t.arg.string({ required: false }),
      voyageId: t.arg.string({ required: false }),
      charterId: t.arg.string({ required: false }),
      amount: t.arg.float({ required: true }),
      currency: t.arg.string({ required: false }),
      taxAmount: t.arg.float({ required: false }),
      dueDate: t.arg.string({ required: false }),
      description: t.arg.string({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      const count = await prisma.invoice.count();
      const prefix = args.type === 'freight' ? 'FRT' : args.type === 'demurrage' ? 'DEM' : args.type === 'hire' ? 'HIR' : 'INV';
      const invoiceNumber = `${prefix}-${String(count + 1).padStart(6, '0')}`;
      const amt = args.amount;
      const tax = args.taxAmount ?? 0;
      return prisma.invoice.create({
        ...query,
        data: {
          invoiceNumber,
          type: args.type,
          companyId: args.companyId,
          voyageId: args.voyageId,
          charterId: args.charterId,
          amount: amt,
          currency: args.currency ?? 'USD',
          taxAmount: tax,
          totalAmount: amt + tax,
          dueDate: args.dueDate ? new Date(args.dueDate) : null,
          description: args.description,
          notes: args.notes,
          organizationId: ctx.orgId(),
        },
      });
    },
  }),
);

builder.mutationField('recordPayment', (t) =>
  t.prismaField({
    type: 'Payment',
    args: {
      invoiceId: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      method: t.arg.string({ required: true }),
      reference: t.arg.string({ required: false }),
      bankName: t.arg.string({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args) => {
      const payment = await prisma.payment.create({
        ...query,
        data: {
          invoiceId: args.invoiceId,
          amount: args.amount,
          method: args.method,
          reference: args.reference,
          bankName: args.bankName,
          status: 'confirmed',
          settledDate: new Date(),
          notes: args.notes,
        },
      });
      // Update invoice paid amount and status
      const invoice = await prisma.invoice.findUnique({ where: { id: args.invoiceId } });
      if (invoice) {
        const newPaid = invoice.paidAmount + args.amount;
        const newStatus = newPaid >= invoice.totalAmount ? 'paid' : 'partially_paid';
        await prisma.invoice.update({
          where: { id: args.invoiceId },
          data: { paidAmount: newPaid, paidDate: newStatus === 'paid' ? new Date() : null, status: newStatus },
        });
      }
      return payment;
    },
  }),
);

builder.mutationField('createCommission', (t) =>
  t.prismaField({
    type: 'Commission',
    args: {
      charterId: t.arg.string({ required: false }),
      voyageId: t.arg.string({ required: false }),
      partyId: t.arg.string({ required: false }),
      type: t.arg.string({ required: true }),
      percentage: t.arg.float({ required: true }),
      baseAmount: t.arg.float({ required: true }),
      currency: t.arg.string({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) => {
      const amount = (args.percentage / 100) * args.baseAmount;
      return prisma.commission.create({
        ...query,
        data: {
          charterId: args.charterId,
          voyageId: args.voyageId,
          partyId: args.partyId,
          type: args.type,
          percentage: args.percentage,
          baseAmount: args.baseAmount,
          amount,
          currency: args.currency ?? 'USD',
          organizationId: ctx.orgId(),
          notes: args.notes,
        },
      });
    },
  }),
);
