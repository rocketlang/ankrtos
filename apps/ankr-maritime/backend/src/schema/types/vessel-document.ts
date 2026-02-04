import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('VesselDocument', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    type: t.exposeString('type'),
    title: t.exposeString('title'),
    issuedBy: t.exposeString('issuedBy', { nullable: true }),
    issueDate: t.expose('issueDate', { type: 'DateTime', nullable: true }),
    expiryDate: t.expose('expiryDate', { type: 'DateTime', nullable: true }),
    documentNumber: t.exposeString('documentNumber', { nullable: true }),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    vessel: t.relation('vessel'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('vesselDocuments', (t) =>
  t.prismaField({
    type: ['VesselDocument'],
    args: {
      vesselId: t.arg.string({ required: true }),
      type: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.vesselDocument.findMany({
        ...query,
        where: {
          vesselId: args.vesselId,
          ...(args.type ? { type: args.type } : {}),
        },
        orderBy: { expiryDate: 'asc' },
      }),
  }),
);

const ExpiringDocsRef = builder.objectRef<{
  vesselName: string;
  vesselId: string;
  documentTitle: string;
  type: string;
  expiryDate: string;
  daysUntilExpiry: number;
}>('ExpiringDocument');

ExpiringDocsRef.implement({
  fields: (t) => ({
    vesselName: t.exposeString('vesselName'),
    vesselId: t.exposeString('vesselId'),
    documentTitle: t.exposeString('documentTitle'),
    type: t.exposeString('type'),
    expiryDate: t.exposeString('expiryDate'),
    daysUntilExpiry: t.exposeInt('daysUntilExpiry'),
  }),
});

builder.queryField('expiringVesselDocuments', (t) =>
  t.field({
    type: [ExpiringDocsRef],
    args: { withinDays: t.arg.int({ required: false }) },
    resolve: async (_root, args, ctx) => {
      const days = args.withinDays ?? 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);
      const docs = await prisma.vesselDocument.findMany({
        where: {
          expiryDate: { lte: cutoff, gte: new Date() },
          status: 'valid',
        },
        include: { vessel: true },
        orderBy: { expiryDate: 'asc' },
      });
      const now = new Date().getTime();
      return docs.map((d) => ({
        vesselName: d.vessel.name,
        vesselId: d.vesselId,
        documentTitle: d.title,
        type: d.type,
        expiryDate: d.expiryDate!.toISOString(),
        daysUntilExpiry: Math.ceil((d.expiryDate!.getTime() - now) / (1000 * 60 * 60 * 24)),
      }));
    },
  }),
);

builder.mutationField('createVesselDocument', (t) =>
  t.prismaField({
    type: 'VesselDocument',
    args: {
      vesselId: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      title: t.arg.string({ required: true }),
      issuedBy: t.arg.string({ required: false }),
      issueDate: t.arg.string({ required: false }),
      expiryDate: t.arg.string({ required: false }),
      documentNumber: t.arg.string({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) =>
      prisma.vesselDocument.create({
        ...query,
        data: {
          vesselId: args.vesselId,
          type: args.type,
          title: args.title,
          issuedBy: args.issuedBy,
          issueDate: args.issueDate ? new Date(args.issueDate) : null,
          expiryDate: args.expiryDate ? new Date(args.expiryDate) : null,
          documentNumber: args.documentNumber,
          notes: args.notes,
          organizationId: ctx.orgId(),
        },
      }),
  }),
);
