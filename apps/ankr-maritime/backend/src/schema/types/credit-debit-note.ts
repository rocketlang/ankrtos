import { builder } from '../builder.js';

builder.prismaObject('CreditDebitNote', {
  fields: (t) => ({
    id: t.exposeID('id'),
    disbursementAccountId: t.exposeString('disbursementAccountId'),
    type: t.exposeString('type'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    reason: t.exposeString('reason'),
    description: t.exposeString('description'),
    status: t.exposeString('status'),
    issuedTo: t.exposeString('issuedTo', { nullable: true }),
    referenceNumber: t.exposeString('referenceNumber', { nullable: true }),
    issuedAt: t.expose('issuedAt', { type: 'DateTime', nullable: true }),
    settledAt: t.expose('settledAt', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    disbursementAccount: t.relation('disbursementAccount'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('creditDebitNotes', (t) =>
  t.prismaField({
    type: ['CreditDebitNote'],
    args: {
      disbursementAccountId: t.arg.string(),
      type: t.arg.string(),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {};
      if (args.disbursementAccountId) where.disbursementAccountId = args.disbursementAccountId;
      if (args.type) where.type = args.type;
      if (args.status) where.status = args.status;
      return ctx.prisma.creditDebitNote.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('creditDebitNoteById', (t) =>
  t.prismaField({
    type: 'CreditDebitNote',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.creditDebitNote.findUnique({ ...query, where: { id: args.id } }),
  }),
);

// === Mutations ===

builder.mutationField('createCreditDebitNote', (t) =>
  t.prismaField({
    type: 'CreditDebitNote',
    args: {
      disbursementAccountId: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      reason: t.arg.string({ required: true }),
      description: t.arg.string({ required: true }),
      currency: t.arg.string(),
      issuedTo: t.arg.string(),
      referenceNumber: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.creditDebitNote.create({
        ...query,
        data: {
          disbursementAccountId: args.disbursementAccountId,
          type: args.type,
          amount: args.amount,
          reason: args.reason,
          description: args.description,
          currency: args.currency ?? 'USD',
          issuedTo: args.issuedTo ?? undefined,
          referenceNumber: args.referenceNumber ?? undefined,
          notes: args.notes ?? undefined,
        },
      }),
  }),
);

builder.mutationField('issueCreditDebitNote', (t) =>
  t.prismaField({
    type: 'CreditDebitNote',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.creditDebitNote.update({
        ...query,
        where: { id: args.id },
        data: { status: 'issued', issuedAt: new Date() },
      }),
  }),
);

builder.mutationField('settleCreditDebitNote', (t) =>
  t.prismaField({
    type: 'CreditDebitNote',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.creditDebitNote.update({
        ...query,
        where: { id: args.id },
        data: { status: 'settled', settledAt: new Date() },
      }),
  }),
);

builder.mutationField('disputeCreditDebitNote', (t) =>
  t.prismaField({
    type: 'CreditDebitNote',
    args: {
      id: t.arg.string({ required: true }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, unknown> = { status: 'disputed' };
      if (args.notes) data.notes = args.notes;
      return ctx.prisma.creditDebitNote.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);
