import { builder } from '../builder.js';
import { tenantManager } from '../../services/tenant-manager.js';

// Tenant Branding
const TenantBranding = builder.objectRef<{
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
}>('TenantBranding');

builder.objectType(TenantBranding, {
  fields: (t) => ({
    logo: t.exposeString('logo', { nullable: true }),
    primaryColor: t.exposeString('primaryColor', { nullable: true }),
    secondaryColor: t.exposeString('secondaryColor', { nullable: true }),
    companyName: t.exposeString('companyName', { nullable: true }),
  }),
});

// Module Configuration
const ModuleConfig = builder.objectRef<{
  chartering: boolean;
  operations: boolean;
  snp: boolean;
  crewing: boolean;
  claims: boolean;
  accounting: boolean;
  procurement: boolean;
  compliance: boolean;
  analytics: boolean;
  aiEngine: boolean;
}>('ModuleConfig');

builder.objectType(ModuleConfig, {
  fields: (t) => ({
    chartering: t.exposeBoolean('chartering'),
    operations: t.exposeBoolean('operations'),
    snp: t.exposeBoolean('snp'),
    crewing: t.exposeBoolean('crewing'),
    claims: t.exposeBoolean('claims'),
    accounting: t.exposeBoolean('accounting'),
    procurement: t.exposeBoolean('procurement'),
    compliance: t.exposeBoolean('compliance'),
    analytics: t.exposeBoolean('analytics'),
    aiEngine: t.exposeBoolean('aiEngine'),
  }),
});

// Tenant Configuration
const TenantConfig = builder.objectRef<{
  organizationId: string;
  branding: any;
  modules: any;
  branches: any[];
  features: any;
}>('TenantConfig');

builder.objectType(TenantConfig, {
  fields: (t) => ({
    organizationId: t.exposeString('organizationId'),
    branding: t.field({
      type: TenantBranding,
      resolve: (parent) => parent.branding || {},
    }),
    modules: t.field({
      type: ModuleConfig,
      resolve: (parent) => parent.modules || {},
    }),
    branches: t.field({
      type: ['JSON'],
      resolve: (parent) => parent.branches || [],
    }),
    features: t.expose('features', { type: 'JSON', nullable: true }),
  }),
});

// Get tenant configuration
builder.queryField('tenantConfig', (t) =>
  t.field({
    type: TenantConfig,
    nullable: true,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      const config = await tenantManager.getTenantConfig(ctx.user.organizationId);
      return config;
    },
  }),
);

// Update tenant branding
builder.mutationField('updateTenantBranding', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      logo: t.arg.string({ required: false }),
      primaryColor: t.arg.string({ required: false }),
      secondaryColor: t.arg.string({ required: false }),
      companyName: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'company_admin') {
        throw new Error('Unauthorized - admin only');
      }

      await tenantManager.updateBranding(ctx.user.organizationId, {
        logo: args.logo,
        primaryColor: args.primaryColor,
        secondaryColor: args.secondaryColor,
        companyName: args.companyName,
      });

      return true;
    },
  }),
);

// Update tenant modules
builder.mutationField('updateTenantModules', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      modules: t.arg({ type: 'JSON', required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'company_admin') {
        throw new Error('Unauthorized - admin only');
      }

      await tenantManager.updateModules(ctx.user.organizationId, args.modules as any);
      return true;
    },
  }),
);

// Add branch
builder.mutationField('addBranch', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      name: t.arg.string({ required: true }),
      code: t.arg.string({ required: true }),
      location: t.arg.string({ required: false }),
      isActive: t.arg.boolean({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'company_admin') {
        throw new Error('Unauthorized - admin only');
      }

      await tenantManager.addBranch(ctx.user.organizationId, {
        name: args.name,
        code: args.code,
        location: args.location,
        isActive: args.isActive !== false,
      });

      return true;
    },
  }),
);

// Update branch
builder.mutationField('updateBranch', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      branchId: t.arg.string({ required: true }),
      name: t.arg.string({ required: false }),
      code: t.arg.string({ required: false }),
      location: t.arg.string({ required: false }),
      isActive: t.arg.boolean({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'company_admin') {
        throw new Error('Unauthorized - admin only');
      }

      const updates: any = {};
      if (args.name) updates.name = args.name;
      if (args.code) updates.code = args.code;
      if (args.location) updates.location = args.location;
      if (args.isActive !== null) updates.isActive = args.isActive;

      await tenantManager.updateBranch(ctx.user.organizationId, args.branchId, updates);
      return true;
    },
  }),
);

// Remove branch
builder.mutationField('removeBranch', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      branchId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'company_admin') {
        throw new Error('Unauthorized - admin only');
      }

      await tenantManager.removeBranch(ctx.user.organizationId, args.branchId);
      return true;
    },
  }),
);

// Assign user to branch
builder.mutationField('assignUserToBranch', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      userId: t.arg.string({ required: true }),
      branchId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'company_admin') {
        throw new Error('Unauthorized - admin only');
      }

      await tenantManager.assignUserToBranch(args.userId, args.branchId);
      return true;
    },
  }),
);

// Get module access for current user
builder.queryField('myModuleAccess', (t) =>
  t.field({
    type: ModuleConfig,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      const access = await tenantManager.getModuleAccess(ctx.user.id);
      return access;
    },
  }),
);

// Check if module is enabled
builder.queryField('isModuleEnabled', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      moduleName: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      const enabled = await tenantManager.isModuleEnabled(
        ctx.user.organizationId,
        args.moduleName as any
      );
      return enabled;
    },
  }),
);

// Get tenant statistics (admin only)
builder.queryField('tenantStats', (t) =>
  t.field({
    type: 'JSON',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'company_admin') {
        throw new Error('Unauthorized - admin only');
      }

      const stats = await tenantManager.getTenantStats(ctx.user.organizationId);
      return stats;
    },
  }),
);
