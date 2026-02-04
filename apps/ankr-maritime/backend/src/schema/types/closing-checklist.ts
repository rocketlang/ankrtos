import { builder } from '../builder.js';

// === ClosingChecklistItem Prisma Object ===
builder.prismaObject('ClosingChecklistItem', {
  fields: (t) => ({
    id: t.exposeID('id'),
    transactionId: t.exposeString('transactionId'),
    category: t.exposeString('category'),
    item: t.exposeString('item'),
    responsible: t.exposeString('responsible', { nullable: true }),
    assignedTo: t.exposeString('assignedTo', { nullable: true }),
    dueDate: t.expose('dueDate', { type: 'DateTime', nullable: true }),
    completedDate: t.expose('completedDate', { type: 'DateTime', nullable: true }),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    documentRef: t.exposeString('documentRef', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    transaction: t.relation('transaction'),
  }),
});

// === Queries ===

builder.queryField('closingChecklist', (t) =>
  t.prismaField({
    type: ['ClosingChecklistItem'],
    args: {
      transactionId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.closingChecklistItem.findMany({
        ...query,
        where: { transactionId: args.transactionId },
        orderBy: [{ category: 'asc' }, { dueDate: 'asc' }],
      }),
  }),
);

// === Mutations ===

builder.mutationField('addChecklistItem', (t) =>
  t.prismaField({
    type: 'ClosingChecklistItem',
    args: {
      transactionId: t.arg.string({ required: true }),
      category: t.arg.string({ required: true }),
      item: t.arg.string({ required: true }),
      responsible: t.arg.string(),
      assignedTo: t.arg.string(),
      dueDate: t.arg({ type: 'DateTime' }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.closingChecklistItem.create({
        ...query,
        data: {
          transactionId: args.transactionId,
          category: args.category,
          item: args.item,
          responsible: args.responsible ?? undefined,
          assignedTo: args.assignedTo ?? undefined,
          dueDate: args.dueDate ?? undefined,
          notes: args.notes ?? undefined,
          status: 'pending',
        },
      }),
  }),
);

builder.mutationField('updateChecklistItem', (t) =>
  t.prismaField({
    type: 'ClosingChecklistItem',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string(),
      completedDate: t.arg({ type: 'DateTime' }),
      notes: t.arg.string(),
      documentRef: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, unknown> = {};
      if (args.status) {
        data.status = args.status;
        // Auto-set completedDate when status changes to completed
        if (args.status === 'completed' && !args.completedDate) {
          data.completedDate = new Date();
        }
      }
      if (args.completedDate) data.completedDate = args.completedDate;
      if (args.notes) data.notes = args.notes;
      if (args.documentRef) data.documentRef = args.documentRef;
      return ctx.prisma.closingChecklistItem.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);

// Standard closing checklist items for S&P transactions
const DEFAULT_CHECKLIST_ITEMS: Array<{ category: string; item: string; responsible: string }> = [
  // Documents
  { category: 'documents', item: 'Bill of Sale', responsible: 'seller' },
  { category: 'documents', item: 'Protocol of Delivery/Acceptance', responsible: 'buyer' },
  { category: 'documents', item: 'Power of Attorney', responsible: 'seller' },
  // Flag
  { category: 'flag', item: 'Flag state deletion certificate', responsible: 'seller' },
  { category: 'flag', item: 'New flag state registration', responsible: 'buyer' },
  // Class
  { category: 'class', item: 'Class transfer/continuity arrangement', responsible: 'buyer' },
  { category: 'class', item: 'Outstanding recommendations clearance', responsible: 'seller' },
  // Insurance
  { category: 'insurance', item: 'H&M insurance transfer/cancellation', responsible: 'seller' },
  { category: 'insurance', item: 'P&I club cessation of entry', responsible: 'seller' },
  // Financial
  { category: 'financial', item: 'Final payment settlement', responsible: 'buyer' },
  { category: 'financial', item: 'Mortgage/lien release', responsible: 'seller' },
  // Operational
  { category: 'operational', item: 'Crew handover/repatriation', responsible: 'seller' },
  { category: 'operational', item: 'Stores/spares inventory', responsible: 'seller' },
  { category: 'operational', item: 'Bunker survey at delivery', responsible: 'buyer' },
];

builder.mutationField('generateDefaultChecklist', (t) =>
  t.prismaField({
    type: ['ClosingChecklistItem'],
    args: {
      transactionId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const transaction = await ctx.prisma.sNPTransaction.findUnique({
        where: { id: args.transactionId },
      });
      if (!transaction) throw new Error('Transaction not found');

      // Create all default checklist items
      await ctx.prisma.closingChecklistItem.createMany({
        data: DEFAULT_CHECKLIST_ITEMS.map((item) => ({
          transactionId: args.transactionId,
          category: item.category,
          item: item.item,
          responsible: item.responsible,
          status: 'pending',
        })),
      });

      // Return all items for this transaction
      return ctx.prisma.closingChecklistItem.findMany({
        ...query,
        where: { transactionId: args.transactionId },
        orderBy: [{ category: 'asc' }, { dueDate: 'asc' }],
      });
    },
  }),
);
