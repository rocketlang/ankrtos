import { builder } from '../builder.js';

// === SaleListing Prisma Object ===
builder.prismaObject('SaleListing', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    sellerOrgId: t.exposeString('sellerOrgId'),
    askingPrice: t.exposeFloat('askingPrice'),
    currency: t.exposeString('currency'),
    condition: t.exposeString('condition'),
    classStatus: t.exposeString('classStatus', { nullable: true }),
    specialSurveyDue: t.expose('specialSurveyDue', { type: 'DateTime', nullable: true }),
    ddDueDate: t.expose('ddDueDate', { type: 'DateTime', nullable: true }),
    lastSurveyDate: t.expose('lastSurveyDate', { type: 'DateTime', nullable: true }),
    highlights: t.exposeString('highlights', { nullable: true }),
    photos: t.expose('photos', { type: 'JSON', nullable: true }),
    brokerNotes: t.exposeString('brokerNotes', { nullable: true }),
    status: t.exposeString('status'),
    publishedAt: t.expose('publishedAt', { type: 'DateTime', nullable: true }),
    soldAt: t.expose('soldAt', { type: 'DateTime', nullable: true }),
    soldPrice: t.exposeFloat('soldPrice', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    vessel: t.relation('vessel'),
    sellerOrg: t.relation('sellerOrg'),
    interests: t.relation('interests'),
    offers: t.relation('offers'),
    transaction: t.relation('transaction', { nullable: true }),
  }),
});

// === Queries ===

builder.queryField('saleListings', (t) =>
  t.prismaField({
    type: ['SaleListing'],
    args: {
      status: t.arg.string(),
      vesselType: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {};
      const orgFilter = ctx.orgFilter();
      if (orgFilter.organizationId) {
        where.sellerOrgId = orgFilter.organizationId;
      }
      if (args.status) where.status = args.status;
      if (args.vesselType) where.vessel = { type: args.vesselType };
      return ctx.prisma.saleListing.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('saleListing', (t) =>
  t.prismaField({
    type: 'SaleListing',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.saleListing.findUnique({ ...query, where: { id: args.id } }),
  }),
);

// === Mutations ===

builder.mutationField('createSaleListing', (t) =>
  t.prismaField({
    type: 'SaleListing',
    args: {
      vesselId: t.arg.string({ required: true }),
      askingPrice: t.arg.float({ required: true }),
      currency: t.arg.string(),
      condition: t.arg.string(),
      classStatus: t.arg.string(),
      specialSurveyDue: t.arg({ type: 'DateTime' }),
      highlights: t.arg.string(),
      photos: t.arg({ type: 'JSON' }),
      brokerNotes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      return ctx.prisma.saleListing.create({
        ...query,
        data: {
          vesselId: args.vesselId,
          sellerOrgId: orgId,
          askingPrice: args.askingPrice,
          currency: args.currency ?? 'USD',
          condition: args.condition ?? 'as_is',
          classStatus: args.classStatus ?? undefined,
          specialSurveyDue: args.specialSurveyDue ?? undefined,
          highlights: args.highlights ?? undefined,
          photos: args.photos ?? undefined,
          brokerNotes: args.brokerNotes ?? undefined,
          status: 'draft',
        },
      });
    },
  }),
);

builder.mutationField('publishSaleListing', (t) =>
  t.prismaField({
    type: 'SaleListing',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.saleListing.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'active',
          publishedAt: new Date(),
        },
      }),
  }),
);

builder.mutationField('updateSaleListing', (t) =>
  t.prismaField({
    type: 'SaleListing',
    args: {
      id: t.arg.string({ required: true }),
      askingPrice: t.arg.float(),
      condition: t.arg.string(),
      classStatus: t.arg.string(),
      highlights: t.arg.string(),
      brokerNotes: t.arg.string(),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, unknown> = {};
      if (args.askingPrice != null) data.askingPrice = args.askingPrice;
      if (args.condition) data.condition = args.condition;
      if (args.classStatus) data.classStatus = args.classStatus;
      if (args.highlights) data.highlights = args.highlights;
      if (args.brokerNotes) data.brokerNotes = args.brokerNotes;
      if (args.status) data.status = args.status;
      return ctx.prisma.saleListing.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);

builder.mutationField('withdrawSaleListing', (t) =>
  t.prismaField({
    type: 'SaleListing',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.saleListing.update({
        ...query,
        where: { id: args.id },
        data: { status: 'withdrawn' },
      }),
  }),
);
