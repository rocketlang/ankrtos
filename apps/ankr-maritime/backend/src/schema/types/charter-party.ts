import { builder } from '../builder.js';

builder.prismaObject('CharterParty', {
  fields: (t) => ({
    id: t.exposeID('id'),
    charterId: t.exposeString('charterId'),
    formType: t.exposeString('formType', { nullable: true }),
    content: t.exposeString('content', { nullable: true }),
    cargoId: t.exposeString('cargoId', { nullable: true }),
    loadPort: t.exposeString('loadPort', { nullable: true }),
    dischargePort: t.exposeString('dischargePort', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('Clause', {
  fields: (t) => ({
    id: t.exposeID('id'),
    code: t.exposeString('code'),
    title: t.exposeString('title'),
    body: t.exposeString('body'),
    category: t.exposeString('category'),
    source: t.exposeString('source', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('CharterPartyClauses', {
  fields: (t) => ({
    id: t.exposeID('id'),
    charterPartyId: t.exposeString('charterPartyId'),
    clauseId: t.exposeString('clauseId'),
    orderIndex: t.exposeInt('orderIndex'),
    amendments: t.exposeString('amendments', { nullable: true }),
  }),
});

// Queries
builder.queryField('charterParty', (t) =>
  t.prismaField({
    type: 'CharterParty',
    nullable: true,
    args: { charterId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.charterParty.findUnique({ ...query, where: { charterId: args.charterId } }),
  }),
);

builder.queryField('clauses', (t) =>
  t.prismaField({
    type: ['Clause'],
    args: { category: t.arg.string(), search: t.arg.string() },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.clause.findMany({
        ...query,
        where: {
          ...(args.category ? { category: args.category } : {}),
          ...(args.search
            ? {
                OR: [
                  { title: { contains: args.search, mode: 'insensitive' as const } },
                  { code: { contains: args.search, mode: 'insensitive' as const } },
                ],
              }
            : {}),
        },
        orderBy: { code: 'asc' },
      }),
  }),
);

builder.queryField('charterPartyClauses', (t) =>
  t.prismaField({
    type: ['CharterPartyClauses'],
    args: { charterPartyId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.charterPartyClauses.findMany({
        ...query,
        where: { charterPartyId: args.charterPartyId },
        orderBy: { orderIndex: 'asc' },
      }),
  }),
);

// Mutations
builder.mutationField('createCharterParty', (t) =>
  t.prismaField({
    type: 'CharterParty',
    args: {
      charterId: t.arg.string({ required: true }),
      formType: t.arg.string(),
      loadPort: t.arg.string(),
      dischargePort: t.arg.string(),
      cargoId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.charterParty.create({
        ...query,
        data: {
          charterId: args.charterId,
          formType: args.formType ?? undefined,
          loadPort: args.loadPort ?? undefined,
          dischargePort: args.dischargePort ?? undefined,
          cargoId: args.cargoId ?? undefined,
        },
      }),
  }),
);

builder.mutationField('addClauseToCharterParty', (t) =>
  t.prismaField({
    type: 'CharterPartyClauses',
    args: {
      charterPartyId: t.arg.string({ required: true }),
      clauseId: t.arg.string({ required: true }),
      orderIndex: t.arg.int(),
      amendments: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      // Auto-assign next order index if not provided
      let orderIndex = args.orderIndex;
      if (orderIndex == null) {
        const existing = await ctx.prisma.charterPartyClauses.findMany({
          where: { charterPartyId: args.charterPartyId },
          orderBy: { orderIndex: 'desc' },
          take: 1,
        });
        orderIndex = (existing[0]?.orderIndex ?? -1) + 1;
      }

      return ctx.prisma.charterPartyClauses.create({
        ...query,
        data: {
          charterPartyId: args.charterPartyId,
          clauseId: args.clauseId,
          orderIndex,
          amendments: args.amendments ?? undefined,
        },
      });
    },
  }),
);

builder.mutationField('removeClauseFromCharterParty', (t) =>
  t.prismaField({
    type: 'CharterPartyClauses',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.charterPartyClauses.delete({ ...query, where: { id: args.id } }),
  }),
);
