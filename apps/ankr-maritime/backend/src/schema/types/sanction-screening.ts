import { builder } from '../builder.js';

// === PrismaObject: SanctionScreening ===
builder.prismaObject('SanctionScreening', {
  fields: (t) => ({
    id: t.exposeID('id'),
    entityType: t.exposeString('entityType'),
    entityName: t.exposeString('entityName'),
    entityId: t.exposeString('entityId', { nullable: true }),
    imoNumber: t.exposeString('imoNumber', { nullable: true }),
    flagState: t.exposeString('flagState', { nullable: true }),
    nationality: t.exposeString('nationality', { nullable: true }),
    screeningType: t.exposeString('screeningType'),
    status: t.exposeString('status'),
    riskLevel: t.exposeString('riskLevel', { nullable: true }),
    matchDetails: t.exposeString('matchDetails', { nullable: true }),
    sanctionLists: t.exposeStringList('sanctionLists'),
    pepMatch: t.exposeBoolean('pepMatch'),
    adverseMedia: t.exposeBoolean('adverseMedia'),
    screenedBy: t.exposeString('screenedBy', { nullable: true }),
    reviewedBy: t.exposeString('reviewedBy', { nullable: true }),
    reviewDate: t.expose('reviewDate', { type: 'DateTime', nullable: true }),
    expiresAt: t.expose('expiresAt', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    organization: t.relation('organization'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('sanctionScreenings', (t) =>
  t.prismaField({
    type: ['SanctionScreening'],
    args: {
      entityType: t.arg.string(),
      status: t.arg.string(),
      riskLevel: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.sanctionScreening.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.entityType ? { entityType: args.entityType } : {}),
          ...(args.status ? { status: args.status } : {}),
          ...(args.riskLevel ? { riskLevel: args.riskLevel } : {}),
        },
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

builder.queryField('sanctionScreening', (t) =>
  t.prismaField({
    type: 'SanctionScreening',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.sanctionScreening.findUnique({
        ...query,
        where: { id: args.id },
      }),
  }),
);

// === Mutations ===

builder.mutationField('createSanctionScreening', (t) =>
  t.prismaField({
    type: 'SanctionScreening',
    args: {
      entityType: t.arg.string({ required: true }),
      entityName: t.arg.string({ required: true }),
      entityId: t.arg.string(),
      imoNumber: t.arg.string(),
      flagState: t.arg.string(),
      nationality: t.arg.string(),
      screeningType: t.arg.string({ required: true }),
      sanctionLists: t.arg.stringList({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.sanctionScreening.create({
        ...query,
        data: {
          entityType: args.entityType,
          entityName: args.entityName,
          entityId: args.entityId ?? undefined,
          imoNumber: args.imoNumber ?? undefined,
          flagState: args.flagState ?? undefined,
          nationality: args.nationality ?? undefined,
          screeningType: args.screeningType,
          sanctionLists: args.sanctionLists,
          status: 'pending',
          organizationId: ctx.orgId(),
        },
      }),
  }),
);

builder.mutationField('updateScreeningResult', (t) =>
  t.prismaField({
    type: 'SanctionScreening',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      riskLevel: t.arg.string(),
      matchDetails: t.arg.string(),
      pepMatch: t.arg.boolean(),
      adverseMedia: t.arg.boolean(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.sanctionScreening.update({
        ...query,
        where: { id: args.id },
        data: {
          status: args.status,
          riskLevel: args.riskLevel ?? undefined,
          matchDetails: args.matchDetails ?? undefined,
          ...(args.pepMatch !== null && args.pepMatch !== undefined
            ? { pepMatch: args.pepMatch }
            : {}),
          ...(args.adverseMedia !== null && args.adverseMedia !== undefined
            ? { adverseMedia: args.adverseMedia }
            : {}),
          screenedBy: ctx.user?.id ?? undefined,
        },
      }),
  }),
);

builder.mutationField('reviewScreening', (t) =>
  t.prismaField({
    type: 'SanctionScreening',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.sanctionScreening.update({
        ...query,
        where: { id: args.id },
        data: {
          status: args.status,
          notes: args.notes ?? undefined,
          reviewedBy: ctx.user?.id ?? undefined,
          reviewDate: new Date(),
        },
      }),
  }),
);

builder.mutationField('escalateScreening', (t) =>
  t.prismaField({
    type: 'SanctionScreening',
    args: {
      id: t.arg.string({ required: true }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.sanctionScreening.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'escalated',
          notes: args.notes ?? undefined,
        },
      }),
  }),
);
