import { builder } from '../builder.js';

// === Claim Document ===
builder.prismaObject('ClaimDocument', {
  fields: (t) => ({
    id: t.exposeID('id'),
    claimId: t.exposeString('claimId'),
    name: t.exposeString('name'),
    type: t.exposeString('type'),
    url: t.exposeString('url', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// === Claim ===
builder.prismaObject('Claim', {
  fields: (t) => ({
    id: t.exposeID('id'),
    claimNumber: t.exposeString('claimNumber'),
    type: t.exposeString('type'),
    status: t.exposeString('status'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    settledAmount: t.exposeFloat('settledAmount', { nullable: true }),
    description: t.exposeString('description', { nullable: true }),
    filedDate: t.expose('filedDate', { type: 'DateTime' }),
    settledDate: t.expose('settledDate', { type: 'DateTime', nullable: true }),
    dueDate: t.expose('dueDate', { type: 'DateTime', nullable: true }),
    priority: t.exposeString('priority'),
    notes: t.exposeString('notes', { nullable: true }),
    claimantId: t.exposeString('claimantId', { nullable: true }),
    respondentId: t.exposeString('respondentId', { nullable: true }),
    voyage: t.relation('voyage'),
    documents: t.relation('documents'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('claims', (t) =>
  t.prismaField({
    type: ['Claim'],
    args: {
      voyageId: t.arg.string(),
      status: t.arg.string(),
      type: t.arg.string(),
      priority: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {};
      if (args.voyageId) where.voyageId = args.voyageId;
      if (args.status) where.status = args.status;
      if (args.type) where.type = args.type;
      if (args.priority) where.priority = args.priority;
      const orgId = ctx.user?.organizationId;
      if (orgId) where.voyage = { vessel: { organizationId: orgId } };
      return ctx.prisma.claim.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
        include: { voyage: { include: { vessel: true } }, documents: true },
      });
    },
  }),
);

builder.queryField('claim', (t) =>
  t.prismaField({
    type: 'Claim',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.claim.findUnique({
        ...query,
        where: { id: args.id },
        include: { voyage: { include: { vessel: true } }, documents: true },
      }),
  }),
);

// === Claim Summary for dashboard ===
const ClaimSummary = builder.objectRef<{
  totalClaims: number;
  openClaims: number;
  settledClaims: number;
  totalClaimAmount: number;
  totalSettledAmount: number;
  currency: string;
}>('ClaimSummary');

ClaimSummary.implement({
  fields: (t) => ({
    totalClaims: t.exposeInt('totalClaims'),
    openClaims: t.exposeInt('openClaims'),
    settledClaims: t.exposeInt('settledClaims'),
    totalClaimAmount: t.exposeFloat('totalClaimAmount'),
    totalSettledAmount: t.exposeFloat('totalSettledAmount'),
    currency: t.exposeString('currency'),
  }),
});

builder.queryField('claimSummary', (t) =>
  t.field({
    type: ClaimSummary,
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.user?.organizationId;
      const claims = await ctx.prisma.claim.findMany({
        where: orgId ? { voyage: { vessel: { organizationId: orgId } } } : {},
      });
      let totalClaimAmount = 0;
      let totalSettledAmount = 0;
      let openClaims = 0;
      let settledClaims = 0;
      for (const c of claims) {
        totalClaimAmount += c.amount;
        if (c.settledAmount) totalSettledAmount += c.settledAmount;
        if (['open', 'under_investigation', 'negotiation'].includes(c.status)) openClaims++;
        if (c.status === 'settled') settledClaims++;
      }
      return {
        totalClaims: claims.length,
        openClaims,
        settledClaims,
        totalClaimAmount,
        totalSettledAmount,
        currency: 'USD',
      };
    },
  }),
);

// === Mutations ===

builder.mutationField('createClaim', (t) =>
  t.prismaField({
    type: 'Claim',
    args: {
      claimNumber: t.arg.string({ required: true }),
      voyageId: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      claimantId: t.arg.string(),
      respondentId: t.arg.string(),
      amount: t.arg.float({ required: true }),
      currency: t.arg.string(),
      description: t.arg.string(),
      priority: t.arg.string(),
      dueDate: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.claim.create({
        ...query,
        data: {
          claimNumber: args.claimNumber,
          voyageId: args.voyageId,
          type: args.type,
          claimantId: args.claimantId ?? undefined,
          respondentId: args.respondentId ?? undefined,
          amount: args.amount,
          currency: args.currency ?? 'USD',
          description: args.description ?? undefined,
          priority: args.priority ?? 'medium',
          dueDate: args.dueDate ?? undefined,
        },
      }),
  }),
);

builder.mutationField('updateClaimStatus', (t) =>
  t.prismaField({
    type: 'Claim',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      settledAmount: t.arg.float(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, unknown> = { status: args.status };
      if (args.settledAmount !== undefined && args.settledAmount !== null) data.settledAmount = args.settledAmount;
      if (args.notes) data.notes = args.notes;
      if (args.status === 'settled') data.settledDate = new Date();
      return ctx.prisma.claim.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);

builder.mutationField('addClaimDocument', (t) =>
  t.prismaField({
    type: 'ClaimDocument',
    args: {
      claimId: t.arg.string({ required: true }),
      name: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      url: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.claimDocument.create({
        ...query,
        data: {
          claimId: args.claimId,
          name: args.name,
          type: args.type,
          url: args.url ?? undefined,
          notes: args.notes ?? undefined,
        },
      }),
  }),
);
