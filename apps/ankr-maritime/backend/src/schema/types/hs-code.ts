import { builder } from '../builder.js';

// === HS Code Lookup ===
builder.prismaObject('HSCodeLookup', {
  fields: (t) => ({
    id: t.exposeID('id'),
    hsCode: t.exposeString('hsCode'),
    description: t.exposeString('description'),
    chapter: t.exposeString('chapter', { nullable: true }),
    heading: t.exposeString('heading', { nullable: true }),
    subheading: t.exposeString('subheading', { nullable: true }),
    tariffItem: t.exposeString('tariffItem', { nullable: true }),
    unit: t.exposeString('unit', { nullable: true }),
    basicDutyRate: t.exposeFloat('basicDutyRate', { nullable: true }),
    socialWelfareRate: t.exposeFloat('socialWelfareRate', { nullable: true }),
    igstRate: t.exposeFloat('igstRate', { nullable: true }),
    cessRate: t.exposeFloat('cessRate', { nullable: true }),
    isRestricted: t.exposeBoolean('isRestricted'),
    isProhibited: t.exposeBoolean('isProhibited'),
    requiresLicense: t.exposeBoolean('requiresLicense'),
    exportRestricted: t.exposeBoolean('exportRestricted'),
    category: t.exposeString('category', { nullable: true }),
    country: t.exposeString('country'),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('hsCodeLookups', (t) =>
  t.prismaField({
    type: ['HSCodeLookup'],
    args: {
      chapter: t.arg.string(),
      category: t.arg.string(),
      country: t.arg.string(),
      isRestricted: t.arg.boolean(),
      search: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.chapter) where.chapter = args.chapter;
      if (args.category) where.category = args.category;
      if (args.country) where.country = args.country;
      if (args.isRestricted != null) where.isRestricted = args.isRestricted;
      if (args.search) {
        where.OR = [
          { hsCode: { contains: args.search, mode: 'insensitive' } },
          { description: { contains: args.search, mode: 'insensitive' } },
        ];
      }
      return ctx.prisma.hSCodeLookup.findMany({
        ...query,
        where,
        orderBy: { hsCode: 'asc' },
      });
    },
  }),
);

builder.queryField('hsCodeLookup', (t) =>
  t.prismaField({
    type: 'HSCodeLookup',
    nullable: true,
    args: {
      hsCode: t.arg.string({ required: true }),
      country: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      if (!orgId) throw new Error('Authentication required');
      return ctx.prisma.hSCodeLookup.findUnique({
        ...query,
        where: {
          hsCode_country_organizationId: {
            hsCode: args.hsCode,
            country: args.country,
            organizationId: orgId,
          },
        },
      });
    },
  }),
);

// === Mutations ===

builder.mutationField('createHSCodeLookup', (t) =>
  t.prismaField({
    type: 'HSCodeLookup',
    args: {
      hsCode: t.arg.string({ required: true }),
      description: t.arg.string({ required: true }),
      chapter: t.arg.string(),
      heading: t.arg.string(),
      subheading: t.arg.string(),
      tariffItem: t.arg.string(),
      unit: t.arg.string(),
      basicDutyRate: t.arg.float(),
      socialWelfareRate: t.arg.float(),
      igstRate: t.arg.float(),
      cessRate: t.arg.float(),
      isRestricted: t.arg.boolean(),
      isProhibited: t.arg.boolean(),
      requiresLicense: t.arg.boolean(),
      exportRestricted: t.arg.boolean(),
      category: t.arg.string(),
      country: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.hSCodeLookup.create({
        ...query,
        data: {
          hsCode: args.hsCode,
          description: args.description,
          chapter: args.chapter ?? undefined,
          heading: args.heading ?? undefined,
          subheading: args.subheading ?? undefined,
          tariffItem: args.tariffItem ?? undefined,
          unit: args.unit ?? undefined,
          basicDutyRate: args.basicDutyRate ?? undefined,
          socialWelfareRate: args.socialWelfareRate ?? undefined,
          igstRate: args.igstRate ?? undefined,
          cessRate: args.cessRate ?? undefined,
          isRestricted: args.isRestricted ?? false,
          isProhibited: args.isProhibited ?? false,
          requiresLicense: args.requiresLicense ?? false,
          exportRestricted: args.exportRestricted ?? false,
          category: args.category ?? undefined,
          country: args.country ?? 'IN',
          organizationId: ctx.orgId(),
        },
      }),
  }),
);

builder.mutationField('updateHSCodeRates', (t) =>
  t.prismaField({
    type: 'HSCodeLookup',
    args: {
      id: t.arg.string({ required: true }),
      basicDutyRate: t.arg.float(),
      socialWelfareRate: t.arg.float(),
      igstRate: t.arg.float(),
      cessRate: t.arg.float(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.hSCodeLookup.update({
        ...query,
        where: { id: args.id },
        data: {
          ...(args.basicDutyRate != null && { basicDutyRate: args.basicDutyRate }),
          ...(args.socialWelfareRate != null && { socialWelfareRate: args.socialWelfareRate }),
          ...(args.igstRate != null && { igstRate: args.igstRate }),
          ...(args.cessRate != null && { cessRate: args.cessRate }),
        },
      }),
  }),
);

builder.mutationField('classifyHSCode', (t) =>
  t.prismaField({
    type: ['HSCodeLookup'],
    args: {
      cargoDescription: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.hSCodeLookup.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          description: { contains: args.cargoDescription, mode: 'insensitive' },
        },
        orderBy: { hsCode: 'asc' },
        take: 10,
      }),
  }),
);
