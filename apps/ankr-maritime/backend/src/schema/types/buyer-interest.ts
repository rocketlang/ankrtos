import { builder } from '../builder.js';

// === BuyerInterest Prisma Object ===
builder.prismaObject('BuyerInterest', {
  fields: (t) => ({
    id: t.exposeID('id'),
    saleListingId: t.exposeString('saleListingId'),
    buyerOrgId: t.exposeString('buyerOrgId'),
    contactName: t.exposeString('contactName', { nullable: true }),
    contactEmail: t.exposeString('contactEmail', { nullable: true }),
    status: t.exposeString('status'),
    ndaSignedAt: t.expose('ndaSignedAt', { type: 'DateTime', nullable: true }),
    inspectionDate: t.expose('inspectionDate', { type: 'DateTime', nullable: true }),
    inspectionPort: t.exposeString('inspectionPort', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    saleListing: t.relation('saleListing'),
    buyerOrg: t.relation('buyerOrg'),
  }),
});

// === Queries ===

builder.queryField('buyerInterests', (t) =>
  t.prismaField({
    type: ['BuyerInterest'],
    args: {
      saleListingId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.buyerInterest.findMany({
        ...query,
        where: { saleListingId: args.saleListingId },
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

// === Mutations ===

builder.mutationField('expressInterest', (t) =>
  t.prismaField({
    type: 'BuyerInterest',
    args: {
      saleListingId: t.arg.string({ required: true }),
      contactName: t.arg.string(),
      contactEmail: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      return ctx.prisma.buyerInterest.create({
        ...query,
        data: {
          saleListingId: args.saleListingId,
          buyerOrgId: orgId,
          contactName: args.contactName ?? undefined,
          contactEmail: args.contactEmail ?? undefined,
          notes: args.notes ?? undefined,
          status: 'expressed',
        },
      });
    },
  }),
);

builder.mutationField('updateBuyerInterest', (t) =>
  t.prismaField({
    type: 'BuyerInterest',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string(),
      ndaSignedAt: t.arg({ type: 'DateTime' }),
      inspectionDate: t.arg({ type: 'DateTime' }),
      inspectionPort: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const data: Record<string, unknown> = {};
      if (args.status) {
        data.status = args.status;
        // Auto-set ndaSignedAt when status changes to nda_signed
        if (args.status === 'nda_signed' && !args.ndaSignedAt) {
          data.ndaSignedAt = new Date();
        }
      }
      if (args.ndaSignedAt) data.ndaSignedAt = args.ndaSignedAt;
      if (args.inspectionDate) data.inspectionDate = args.inspectionDate;
      if (args.inspectionPort) data.inspectionPort = args.inspectionPort;
      if (args.notes) data.notes = args.notes;
      return ctx.prisma.buyerInterest.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);
