import { builder } from '../builder.js';

// === PrismaObject: UltimateBeneficialOwner ===
builder.prismaObject('UltimateBeneficialOwner', {
  fields: (t) => ({
    id: t.exposeID('id'),
    companyId: t.exposeString('companyId'),
    companyName: t.exposeString('companyName'),
    ownerName: t.exposeString('ownerName'),
    nationality: t.exposeString('nationality', { nullable: true }),
    dateOfBirth: t.expose('dateOfBirth', { type: 'DateTime', nullable: true }),
    ownershipPercent: t.exposeFloat('ownershipPercent'),
    isDirectOwner: t.exposeBoolean('isDirectOwner'),
    controlType: t.exposeString('controlType'),
    pepStatus: t.exposeBoolean('pepStatus'),
    sanctionStatus: t.exposeString('sanctionStatus'),
    verificationStatus: t.exposeString('verificationStatus'),
    verifiedDate: t.expose('verifiedDate', { type: 'DateTime', nullable: true }),
    verifiedBy: t.exposeString('verifiedBy', { nullable: true }),
    documentRef: t.exposeString('documentRef', { nullable: true }),
    expiresAt: t.expose('expiresAt', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    organization: t.relation('organization'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('ubos', (t) =>
  t.prismaField({
    type: ['UltimateBeneficialOwner'],
    args: {
      companyId: t.arg.string(),
      verificationStatus: t.arg.string(),
      sanctionStatus: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.ultimateBeneficialOwner.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.companyId ? { companyId: args.companyId } : {}),
          ...(args.verificationStatus ? { verificationStatus: args.verificationStatus } : {}),
          ...(args.sanctionStatus ? { sanctionStatus: args.sanctionStatus } : {}),
        },
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

builder.queryField('ubo', (t) =>
  t.prismaField({
    type: 'UltimateBeneficialOwner',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.ultimateBeneficialOwner.findUnique({
        ...query,
        where: { id: args.id },
      }),
  }),
);

// === Mutations ===

builder.mutationField('createUBO', (t) =>
  t.prismaField({
    type: 'UltimateBeneficialOwner',
    args: {
      companyId: t.arg.string({ required: true }),
      companyName: t.arg.string({ required: true }),
      ownerName: t.arg.string({ required: true }),
      nationality: t.arg.string(),
      dateOfBirth: t.arg({ type: 'DateTime' }),
      ownershipPercent: t.arg.float({ required: true }),
      isDirectOwner: t.arg.boolean(),
      controlType: t.arg.string(),
      pepStatus: t.arg.boolean(),
      documentRef: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.ultimateBeneficialOwner.create({
        ...query,
        data: {
          companyId: args.companyId,
          companyName: args.companyName,
          ownerName: args.ownerName,
          nationality: args.nationality ?? undefined,
          dateOfBirth: args.dateOfBirth ?? undefined,
          ownershipPercent: args.ownershipPercent,
          isDirectOwner: args.isDirectOwner ?? true,
          controlType: args.controlType ?? 'ownership',
          pepStatus: args.pepStatus ?? false,
          documentRef: args.documentRef ?? undefined,
          notes: args.notes ?? undefined,
          verificationStatus: 'pending',
          sanctionStatus: 'clear',
          organizationId: ctx.orgId(),
        },
      }),
  }),
);

builder.mutationField('verifyUBO', (t) =>
  t.prismaField({
    type: 'UltimateBeneficialOwner',
    args: {
      id: t.arg.string({ required: true }),
      verifiedBy: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.ultimateBeneficialOwner.update({
        ...query,
        where: { id: args.id },
        data: {
          verificationStatus: 'verified',
          verifiedDate: new Date(),
          verifiedBy: args.verifiedBy,
        },
      }),
  }),
);

builder.mutationField('rejectUBO', (t) =>
  t.prismaField({
    type: 'UltimateBeneficialOwner',
    args: {
      id: t.arg.string({ required: true }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.ultimateBeneficialOwner.update({
        ...query,
        where: { id: args.id },
        data: {
          verificationStatus: 'rejected',
          notes: args.notes ?? undefined,
        },
      }),
  }),
);

builder.mutationField('flagUBOSanction', (t) =>
  t.prismaField({
    type: 'UltimateBeneficialOwner',
    args: {
      id: t.arg.string({ required: true }),
      sanctionStatus: t.arg.string({ required: true }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.ultimateBeneficialOwner.update({
        ...query,
        where: { id: args.id },
        data: {
          sanctionStatus: args.sanctionStatus,
          notes: args.notes ?? undefined,
        },
      }),
  }),
);
