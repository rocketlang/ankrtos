import { builder } from '../builder.js';
import crypto from 'crypto';

builder.prismaObject('EblTitleTransfer', {
  fields: (t) => ({
    id: t.exposeID('id'),
    bolId: t.exposeString('bolId'),
    fromParty: t.exposeString('fromParty'),
    toParty: t.exposeString('toParty'),
    transferType: t.exposeString('transferType'),
    dcsaStatus: t.exposeString('dcsaStatus'),
    platformRef: t.exposeString('platformRef', { nullable: true }),
    hash: t.exposeString('hash', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    initiatedBy: t.exposeString('initiatedBy', { nullable: true }),
    bol: t.relation('bol'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// Query title chain for a B/L
builder.queryField('eblTitleChain', (t) =>
  t.prismaField({
    type: ['EblTitleTransfer'],
    args: { bolId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.eblTitleTransfer.findMany({
        ...query,
        where: { bolId: args.bolId },
        orderBy: { createdAt: 'asc' },
        include: { bol: true },
      }),
  }),
);

// eBL summary
const EblSummary = builder.objectRef<{
  totalEbls: number;
  pendingTransfers: number;
  confirmedTransfers: number;
  surrendered: number;
}>('EblSummary');

EblSummary.implement({
  fields: (t) => ({
    totalEbls: t.exposeInt('totalEbls'),
    pendingTransfers: t.exposeInt('pendingTransfers'),
    confirmedTransfers: t.exposeInt('confirmedTransfers'),
    surrendered: t.exposeInt('surrendered'),
  }),
});

builder.queryField('eblSummary', (t) =>
  t.field({
    type: EblSummary,
    resolve: async (_root, _args, ctx) => {
      const [totalEbls, pendingTransfers, confirmedTransfers, surrendered] = await Promise.all([
        ctx.prisma.billOfLading.count({ where: { type: 'electronic' } }),
        ctx.prisma.eblTitleTransfer.count({ where: { dcsaStatus: 'pending' } }),
        ctx.prisma.eblTitleTransfer.count({ where: { dcsaStatus: 'confirmed' } }),
        ctx.prisma.eblTitleTransfer.count({ where: { transferType: 'surrender' } }),
      ]);
      return { totalEbls, pendingTransfers, confirmedTransfers, surrendered };
    },
  }),
);

// Mutations — DCSA v3.0 workflow

// Initiate title transfer (endorsement)
builder.mutationField('initiateEblTransfer', (t) =>
  t.prismaField({
    type: 'EblTitleTransfer',
    args: {
      bolId: t.arg.string({ required: true }),
      toParty: t.arg.string({ required: true }),
      transferType: t.arg.string({ required: true }),
      notes: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const bol = await ctx.prisma.billOfLading.findUniqueOrThrow({ where: { id: args.bolId } });
      const fromParty = ctx.user?.name ?? 'System';
      const hash = crypto.createHash('sha256').update(`${bol.bolNumber}-${args.toParty}-${Date.now()}`).digest('hex').slice(0, 16);
      const platformRef = `DCSA-${bol.bolNumber}-${Date.now().toString(36).toUpperCase()}`;
      return ctx.prisma.eblTitleTransfer.create({
        ...query,
        data: {
          bolId: args.bolId,
          fromParty,
          toParty: args.toParty,
          transferType: args.transferType,
          dcsaStatus: 'pending',
          platformRef,
          hash,
          notes: args.notes ?? undefined,
          initiatedBy: ctx.user?.name ?? undefined,
        },
      });
    },
  }),
);

// Confirm or reject transfer
builder.mutationField('respondEblTransfer', (t) =>
  t.prismaField({
    type: 'EblTitleTransfer',
    args: {
      transferId: t.arg.string({ required: true }),
      action: t.arg.string({ required: true }), // confirm, reject
    },
    resolve: async (query, _root, args, ctx) => {
      const status = args.action === 'confirm' ? 'confirmed' : 'rejected';
      const transfer = await ctx.prisma.eblTitleTransfer.update({
        ...query,
        where: { id: args.transferId },
        data: { dcsaStatus: status },
      });
      // If confirmed surrender, update BOL status
      if (status === 'confirmed') {
        const t = await ctx.prisma.eblTitleTransfer.findUnique({ where: { id: args.transferId } });
        if (t?.transferType === 'surrender') {
          await ctx.prisma.billOfLading.update({ where: { id: t.bolId }, data: { status: 'surrendered' } });
        }
      }
      return transfer;
    },
  }),
);
