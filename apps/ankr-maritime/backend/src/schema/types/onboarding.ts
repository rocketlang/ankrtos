import { builder } from '../builder.js';
import { onboardingService } from '../../services/onboarding-service.js';

// Onboarding Step Status
const OnboardingStepStatus = builder.enumType('OnboardingStepStatus', {
  values: ['pending', 'in_progress', 'completed', 'skipped'] as const,
});

// Onboarding Step
const OnboardingStep = builder.objectRef<{
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  order: number;
  required: boolean;
}>('OnboardingStep');

builder.objectType(OnboardingStep, {
  fields: (t) => ({
    id: t.exposeString('id'),
    title: t.exposeString('title'),
    description: t.exposeString('description'),
    status: t.field({
      type: OnboardingStepStatus,
      resolve: (parent) => parent.status,
    }),
    order: t.exposeInt('order'),
    required: t.exposeBoolean('required'),
  }),
});

// Onboarding State
const OnboardingState = builder.objectRef<{
  organizationId: string;
  currentStep: string;
  steps: any[];
  progress: number;
  completedAt?: Date;
}>('OnboardingState');

builder.objectType(OnboardingState, {
  fields: (t) => ({
    organizationId: t.exposeString('organizationId'),
    currentStep: t.exposeString('currentStep'),
    steps: t.field({
      type: [OnboardingStep],
      resolve: (parent) => parent.steps,
    }),
    progress: t.exposeInt('progress'),
    completedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.completedAt,
    }),
  }),
});

// Company Registration Input
const CompanyRegistrationInput = builder.inputType('CompanyRegistrationInput', {
  fields: (t) => ({
    companyName: t.string({ required: true }),
    tradingName: t.string({ required: false }),
    registrationNumber: t.string({ required: true }),
    taxId: t.string({ required: false }),
    country: t.string({ required: true }),
    address: t.string({ required: true }),
    city: t.string({ required: true }),
    postalCode: t.string({ required: true }),
    phone: t.string({ required: true }),
    email: t.string({ required: true }),
    website: t.string({ required: false }),
    adminUserName: t.string({ required: true }),
    adminUserEmail: t.string({ required: true }),
    adminPassword: t.string({ required: true }),
  }),
});

// Module Selection Input
const ModuleSelectionInput = builder.inputType('ModuleSelectionInput', {
  fields: (t) => ({
    chartering: t.boolean({ required: false }),
    operations: t.boolean({ required: false }),
    snp: t.boolean({ required: false }),
    crewing: t.boolean({ required: false }),
    claims: t.boolean({ required: false }),
    accounting: t.boolean({ required: false }),
    procurement: t.boolean({ required: false }),
    compliance: t.boolean({ required: false }),
    analytics: t.boolean({ required: false }),
    aiEngine: t.boolean({ required: false }),
  }),
});

// Branding Customization Input
const BrandingCustomizationInput = builder.inputType('BrandingCustomizationInput', {
  fields: (t) => ({
    logo: t.string({ required: false }),
    primaryColor: t.string({ required: false }),
    secondaryColor: t.string({ required: false }),
  }),
});

// Start onboarding
builder.mutationField('startOnboarding', (t) =>
  t.field({
    type: 'String',
    args: {
      registration: t.arg({ type: CompanyRegistrationInput, required: true }),
    },
    resolve: async (_root, args) => {
      const organizationId = await onboardingService.startOnboarding(args.registration as any);
      return organizationId;
    },
  }),
);

// Get onboarding state
builder.queryField('onboardingState', (t) =>
  t.field({
    type: OnboardingState,
    nullable: true,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      const state = await onboardingService.getOnboardingState(ctx.user.organizationId);
      return state;
    },
  }),
);

// Upload KYC document
builder.mutationField('uploadKYCDocument', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      documentType: t.arg.string({ required: true }),
      fileUrl: t.arg.string({ required: true }),
      fileName: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      await onboardingService.uploadKYCDocument(
        ctx.user.organizationId,
        args.documentType,
        args.fileUrl,
        args.fileName
      );

      return true;
    },
  }),
);

// Complete KYC step
builder.mutationField('completeKYCStep', (t) =>
  t.field({
    type: 'Boolean',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      await onboardingService.completeKYCStep(ctx.user.organizationId);
      return true;
    },
  }),
);

// Select modules
builder.mutationField('selectOnboardingModules', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      modules: t.arg({ type: ModuleSelectionInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      await onboardingService.selectModules(ctx.user.organizationId, args.modules as any);
      return true;
    },
  }),
);

// Customize branding
builder.mutationField('customizeOnboardingBranding', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      branding: t.arg({ type: BrandingCustomizationInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      await onboardingService.customizeBranding(ctx.user.organizationId, args.branding as any);
      return true;
    },
  }),
);

// Skip onboarding step
builder.mutationField('skipOnboardingStep', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      stepId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      await onboardingService.skipStep(ctx.user.organizationId, args.stepId);
      return true;
    },
  }),
);

// Complete onboarding
builder.mutationField('completeOnboarding', (t) =>
  t.field({
    type: 'Boolean',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      await onboardingService.completeOnboarding(ctx.user.organizationId);
      return true;
    },
  }),
);

// Get onboarding progress
builder.queryField('onboardingProgress', (t) =>
  t.field({
    type: 'Int',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      const progress = await onboardingService.getProgress(ctx.user.organizationId);
      return progress;
    },
  }),
);

// Verify KYC document (admin only)
builder.mutationField('verifyKYCDocument', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      organizationId: t.arg.string({ required: true }),
      documentId: t.arg.string({ required: true }),
      approved: t.arg.boolean({ required: true }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      // Check if user is admin (in a real app, this would be a super admin)
      if (!ctx.user || ctx.user.role !== 'company_admin') {
        throw new Error('Unauthorized - admin only');
      }

      await onboardingService.verifyKYCDocument(
        args.organizationId,
        args.documentId,
        args.approved,
        args.notes
      );

      return true;
    },
  }),
);

// Generate sample data for testing
builder.mutationField('generateSampleData', (t) =>
  t.field({
    type: 'Boolean',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      await onboardingService.generateSampleData(ctx.user.organizationId);
      return true;
    },
  }),
);
