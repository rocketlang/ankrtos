import { builder } from '../builder.js';

builder.prismaObject('Company', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    type: t.exposeString('type'),
    country: t.exposeString('country', { nullable: true }),
    city: t.exposeString('city', { nullable: true }),
    address: t.exposeString('address', { nullable: true }),
    contactEmail: t.exposeString('contactEmail', { nullable: true }),
    contactPhone: t.exposeString('contactPhone', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('companies', (t) =>
  t.prismaField({
    type: ['Company'],
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.company.findMany({ ...query, where: ctx.orgFilter(), orderBy: { name: 'asc' } }),
  }),
);

builder.queryField('company', (t) =>
  t.prismaField({
    type: 'Company',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.company.findUnique({ ...query, where: { id: args.id } }),
  }),
);

builder.mutationField('createCompany', (t) =>
  t.prismaField({
    type: 'Company',
    args: {
      name: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      country: t.arg.string(),
      city: t.arg.string(),
      address: t.arg.string(),
      contactEmail: t.arg.string(),
      contactPhone: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      if (!orgId) throw new Error('Not authenticated');
      return ctx.prisma.company.create({
        ...query,
        data: {
          name: args.name,
          type: args.type,
          country: args.country ?? undefined,
          city: args.city ?? undefined,
          address: args.address ?? undefined,
          contactEmail: args.contactEmail ?? undefined,
          contactPhone: args.contactPhone ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);
