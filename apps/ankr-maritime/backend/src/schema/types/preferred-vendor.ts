import { builder } from '../builder.js';

// === PreferredVendor ===

builder.prismaObject('PreferredVendor', {
  fields: (t) => ({
    id: t.exposeID('id'),
    companyId: t.exposeString('companyId'),
    organizationId: t.exposeString('organizationId'),
    portId: t.exposeString('portId', { nullable: true }),
    serviceType: t.exposeString('serviceType'),
    priority: t.exposeInt('priority'),
    notes: t.exposeString('notes', { nullable: true }),
    addedBy: t.exposeString('addedBy', { nullable: true }),
    company: t.relation('company'),
    organization: t.relation('organization'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// === VendorBlacklist ===

builder.prismaObject('VendorBlacklist', {
  fields: (t) => ({
    id: t.exposeID('id'),
    companyId: t.exposeString('companyId'),
    organizationId: t.exposeString('organizationId'),
    reason: t.exposeString('reason'),
    description: t.exposeString('description', { nullable: true }),
    severity: t.exposeString('severity'),
    blacklistedBy: t.exposeString('blacklistedBy', { nullable: true }),
    reviewDate: t.expose('reviewDate', { type: 'DateTime', nullable: true }),
    company: t.relation('company'),
    organization: t.relation('organization'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('preferredVendors', (t) =>
  t.prismaField({
    type: ['PreferredVendor'],
    args: {
      serviceType: t.arg.string(),
      portId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = ctx.orgFilter();
      if (args.serviceType) where.serviceType = args.serviceType;
      if (args.portId) where.portId = args.portId;
      return ctx.prisma.preferredVendor.findMany({
        ...query,
        where,
        orderBy: { priority: 'asc' },
      });
    },
  }),
);

builder.queryField('vendorBlacklist', (t) =>
  t.prismaField({
    type: ['VendorBlacklist'],
    resolve: (query, _root, _args, ctx) =>
      ctx.prisma.vendorBlacklist.findMany({
        ...query,
        where: ctx.orgFilter(),
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

builder.queryField('isVendorBlacklisted', (t) =>
  t.field({
    type: 'Boolean',
    args: { companyId: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const count = await ctx.prisma.vendorBlacklist.count({
        where: {
          companyId: args.companyId,
          ...ctx.orgFilter(),
        },
      });
      return count > 0;
    },
  }),
);

// === Mutations ===

builder.mutationField('addPreferredVendor', (t) =>
  t.prismaField({
    type: 'PreferredVendor',
    args: {
      companyId: t.arg.string({ required: true }),
      serviceType: t.arg.string({ required: true }),
      portId: t.arg.string(),
      priority: t.arg.int(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      return ctx.prisma.preferredVendor.create({
        ...query,
        data: {
          companyId: args.companyId,
          organizationId: orgId,
          serviceType: args.serviceType,
          portId: args.portId ?? undefined,
          priority: args.priority ?? 1,
          notes: args.notes ?? undefined,
          addedBy: ctx.user?.id ?? undefined,
        },
      });
    },
  }),
);

builder.mutationField('removePreferredVendor', (t) =>
  t.prismaField({
    type: 'PreferredVendor',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.preferredVendor.delete({ ...query, where: { id: args.id } }),
  }),
);

builder.mutationField('blacklistVendor', (t) =>
  t.prismaField({
    type: 'VendorBlacklist',
    args: {
      companyId: t.arg.string({ required: true }),
      reason: t.arg.string({ required: true }),
      description: t.arg.string(),
      severity: t.arg.string(),
      reviewDate: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      return ctx.prisma.vendorBlacklist.create({
        ...query,
        data: {
          companyId: args.companyId,
          organizationId: orgId,
          reason: args.reason,
          description: args.description ?? undefined,
          severity: args.severity ?? 'blocked',
          blacklistedBy: ctx.user?.id ?? undefined,
          reviewDate: args.reviewDate ?? undefined,
        },
      });
    },
  }),
);

builder.mutationField('removeFromBlacklist', (t) =>
  t.prismaField({
    type: 'VendorBlacklist',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vendorBlacklist.delete({ ...query, where: { id: args.id } }),
  }),
);

builder.mutationField('updateBlacklistSeverity', (t) =>
  t.prismaField({
    type: 'VendorBlacklist',
    args: {
      id: t.arg.string({ required: true }),
      severity: t.arg.string({ required: true }),
      reviewDate: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vendorBlacklist.update({
        ...query,
        where: { id: args.id },
        data: {
          severity: args.severity,
          ...(args.reviewDate != null && { reviewDate: args.reviewDate }),
        },
      }),
  }),
);
