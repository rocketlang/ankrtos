import { builder } from '../builder.js';

builder.prismaObject('RolePermission', {
  fields: (t) => ({
    id: t.exposeID('id'),
    role: t.exposeString('role'),
    module: t.exposeString('module'),
    canCreate: t.exposeBoolean('canCreate'),
    canRead: t.exposeBoolean('canRead'),
    canUpdate: t.exposeBoolean('canUpdate'),
    canDelete: t.exposeBoolean('canDelete'),
    canApprove: t.exposeBoolean('canApprove'),
    canExport: t.exposeBoolean('canExport'),
    organizationId: t.exposeString('organizationId', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('rolePermissions', (t) =>
  t.prismaField({
    type: ['RolePermission'],
    args: { role: t.arg.string() },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {};
      if (args.role) where.role = args.role;
      return ctx.prisma.rolePermission.findMany({
        ...query,
        where,
        orderBy: [{ role: 'asc' }, { module: 'asc' }],
      });
    },
  }),
);

builder.queryField('permissionsForRole', (t) =>
  t.prismaField({
    type: ['RolePermission'],
    args: { role: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.rolePermission.findMany({
        ...query,
        where: { role: args.role },
        orderBy: { module: 'asc' },
      }),
  }),
);

// === Mutations ===

builder.mutationField('setRolePermission', (t) =>
  t.prismaField({
    type: 'RolePermission',
    args: {
      role: t.arg.string({ required: true }),
      module: t.arg.string({ required: true }),
      canCreate: t.arg.boolean(),
      canRead: t.arg.boolean(),
      canUpdate: t.arg.boolean(),
      canDelete: t.arg.boolean(),
      canApprove: t.arg.boolean(),
      canExport: t.arg.boolean(),
      organizationId: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = args.organizationId ?? ctx.user?.organizationId ?? null;
      return ctx.prisma.rolePermission.upsert({
        ...query,
        where: {
          role_module_organizationId: {
            role: args.role,
            module: args.module,
            organizationId: orgId ?? '',
          },
        },
        create: {
          role: args.role,
          module: args.module,
          canCreate: args.canCreate ?? false,
          canRead: args.canRead ?? true,
          canUpdate: args.canUpdate ?? false,
          canDelete: args.canDelete ?? false,
          canApprove: args.canApprove ?? false,
          canExport: args.canExport ?? false,
          organizationId: orgId,
        },
        update: {
          ...(args.canCreate != null && { canCreate: args.canCreate }),
          ...(args.canRead != null && { canRead: args.canRead }),
          ...(args.canUpdate != null && { canUpdate: args.canUpdate }),
          ...(args.canDelete != null && { canDelete: args.canDelete }),
          ...(args.canApprove != null && { canApprove: args.canApprove }),
          ...(args.canExport != null && { canExport: args.canExport }),
        },
      });
    },
  }),
);

// Input type for bulk permission setting
const BulkPermissionInput = builder.inputType('BulkPermissionInput', {
  fields: (t) => ({
    module: t.string({ required: true }),
    canCreate: t.boolean({ defaultValue: false }),
    canRead: t.boolean({ defaultValue: true }),
    canUpdate: t.boolean({ defaultValue: false }),
    canDelete: t.boolean({ defaultValue: false }),
    canApprove: t.boolean({ defaultValue: false }),
    canExport: t.boolean({ defaultValue: false }),
  }),
});

builder.mutationField('bulkSetRolePermissions', (t) =>
  t.prismaField({
    type: ['RolePermission'],
    args: {
      role: t.arg.string({ required: true }),
      permissions: t.arg({ type: [BulkPermissionInput], required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId ?? '';
      const results = [];
      for (const perm of args.permissions) {
        const result = await ctx.prisma.rolePermission.upsert({
          ...query,
          where: {
            role_module_organizationId: {
              role: args.role,
              module: perm.module,
              organizationId: orgId,
            },
          },
          create: {
            role: args.role,
            module: perm.module,
            canCreate: perm.canCreate ?? false,
            canRead: perm.canRead ?? true,
            canUpdate: perm.canUpdate ?? false,
            canDelete: perm.canDelete ?? false,
            canApprove: perm.canApprove ?? false,
            canExport: perm.canExport ?? false,
            organizationId: orgId || null,
          },
          update: {
            canCreate: perm.canCreate ?? false,
            canRead: perm.canRead ?? true,
            canUpdate: perm.canUpdate ?? false,
            canDelete: perm.canDelete ?? false,
            canApprove: perm.canApprove ?? false,
            canExport: perm.canExport ?? false,
          },
        });
        results.push(result);
      }
      return results;
    },
  }),
);
