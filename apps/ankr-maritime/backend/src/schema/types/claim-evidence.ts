import { builder } from '../builder.js';

builder.prismaObject('ClaimEvidence', {
  fields: (t) => ({
    id: t.exposeID('id'),
    claimId: t.exposeString('claimId'),
    documentType: t.exposeString('documentType'),
    description: t.exposeString('description'),
    filePath: t.exposeString('filePath', { nullable: true }),
    fileName: t.exposeString('fileName', { nullable: true }),
    fileSize: t.exposeInt('fileSize', { nullable: true }),
    uploadedBy: t.exposeString('uploadedBy', { nullable: true }),
    verified: t.exposeBoolean('verified'),
    verifiedBy: t.exposeString('verifiedBy', { nullable: true }),
    verifiedAt: t.expose('verifiedAt', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    claim: t.relation('claim'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// === Custom summary type ===

const ClaimEvidenceSummary = builder.objectRef<{
  totalCount: number;
  verifiedCount: number;
  unverifiedCount: number;
  documentTypes: string[];
}>('ClaimEvidenceSummary');

ClaimEvidenceSummary.implement({
  fields: (t) => ({
    totalCount: t.exposeInt('totalCount'),
    verifiedCount: t.exposeInt('verifiedCount'),
    unverifiedCount: t.exposeInt('unverifiedCount'),
    documentTypes: t.exposeStringList('documentTypes'),
  }),
});

// === Queries ===

builder.queryField('claimEvidence', (t) =>
  t.prismaField({
    type: ['ClaimEvidence'],
    args: { claimId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.claimEvidence.findMany({
        ...query,
        where: { claimId: args.claimId },
        orderBy: { createdAt: 'asc' },
      }),
  }),
);

builder.queryField('claimEvidenceSummary', (t) =>
  t.field({
    type: ClaimEvidenceSummary,
    args: { claimId: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const evidence = await ctx.prisma.claimEvidence.findMany({
        where: { claimId: args.claimId },
      });

      const verifiedCount = evidence.filter((e) => e.verified).length;
      const documentTypes = [...new Set(evidence.map((e) => e.documentType))];

      return {
        totalCount: evidence.length,
        verifiedCount,
        unverifiedCount: evidence.length - verifiedCount,
        documentTypes,
      };
    },
  }),
);

// === Mutations ===

builder.mutationField('addClaimEvidence', (t) =>
  t.prismaField({
    type: 'ClaimEvidence',
    args: {
      claimId: t.arg.string({ required: true }),
      documentType: t.arg.string({ required: true }),
      description: t.arg.string({ required: true }),
      filePath: t.arg.string(),
      fileName: t.arg.string(),
      fileSize: t.arg.int(),
      uploadedBy: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.claimEvidence.create({
        ...query,
        data: {
          claimId: args.claimId,
          documentType: args.documentType,
          description: args.description,
          filePath: args.filePath ?? undefined,
          fileName: args.fileName ?? undefined,
          fileSize: args.fileSize ?? undefined,
          uploadedBy: args.uploadedBy ?? ctx.user?.id ?? undefined,
          notes: args.notes ?? undefined,
        },
      }),
  }),
);

builder.mutationField('verifyClaimEvidence', (t) =>
  t.prismaField({
    type: 'ClaimEvidence',
    args: {
      id: t.arg.string({ required: true }),
      verifiedBy: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.claimEvidence.update({
        ...query,
        where: { id: args.id },
        data: {
          verified: true,
          verifiedBy: args.verifiedBy,
          verifiedAt: new Date(),
        },
      }),
  }),
);

builder.mutationField('removeClaimEvidence', (t) =>
  t.prismaField({
    type: 'ClaimEvidence',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.claimEvidence.delete({ ...query, where: { id: args.id } }),
  }),
);
