/**
 * Beta Agent GraphQL Schema
 *
 * Provides GraphQL types and resolvers for beta agent signup and onboarding.
 */

import { builder } from '../builder.js';
import { betaAgentOnboardingService } from '../../services/beta-agent-onboarding.service.js';
import { prisma } from '../../lib/prisma.js';

// === Input Types ===

const BetaAgentSignupInput = builder.inputType('BetaAgentSignupInput', {
  fields: (t) => ({
    email: t.string({ required: true }),
    agentName: t.string({ required: true }),
    portsServed: t.stringList({ required: true }),
    serviceTypes: t.stringList({ required: true }),
    password: t.string({ required: true }),
    contactName: t.string({ required: true }),
    country: t.string({ required: false }),
  }),
});

const AgentCredentialsInput = builder.inputType('AgentCredentialsInput', {
  fields: (t) => ({
    imoMemberNumber: t.string({ required: false }),
    portAuthorityLicense: t.string({ required: false }),
    surveyorCertification: t.string({ required: false }),
    businessRegistrationNumber: t.string({ required: false }),
    otherCredentials: t.field({ type: 'JSON', required: false }),
  }),
});

const PortCoverageInput = builder.inputType('PortCoverageInput', {
  fields: (t) => ({
    portIds: t.stringList({ required: true }),
    primaryPort: t.string({ required: false }),
    secondaryPorts: t.stringList({ required: false }),
  }),
});

// === Object Types ===

const BetaAgentProfileType = builder.objectRef<{
  id: string;
  organizationId: string;
  agentName: string;
  serviceTypes: string[];
  portsCoverage: string[];
  credentials: any;
  slaAcceptedAt: Date | null;
  slaVersion: string | null;
  apiKey: string | null;
  apiKeyGeneratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>('BetaAgentProfile');

BetaAgentProfileType.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),
    agentName: t.exposeString('agentName'),
    serviceTypes: t.exposeStringList('serviceTypes'),
    portsCoverage: t.exposeStringList('portsCoverage'),
    credentials: t.field({
      type: 'JSON',
      nullable: true,
      resolve: (parent) => parent.credentials,
    }),
    slaAcceptedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.slaAcceptedAt,
    }),
    slaVersion: t.exposeString('slaVersion', { nullable: true }),
    apiKey: t.exposeString('apiKey', { nullable: true }),
    apiKeyGeneratedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.apiKeyGeneratedAt,
    }),
    createdAt: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.createdAt,
    }),
    updatedAt: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.updatedAt,
    }),
  }),
});

const BetaOnboardingStateType = builder.objectRef<{
  organizationId: string;
  agentName: string;
  betaStatus: string | null;
  enrolledAt: Date | null;
  completedAt: Date | null;
  progress: number;
  steps: {
    credentials_submitted: boolean;
    port_coverage_selected: boolean;
    sla_accepted: boolean;
    api_key_generated: boolean;
  };
  nextStep: string;
  apiKey: string | null;
  serviceTypes: string[];
  portsCoverage: string[];
}>('BetaOnboardingState');

BetaOnboardingStateType.implement({
  fields: (t) => ({
    organizationId: t.exposeString('organizationId'),
    agentName: t.exposeString('agentName'),
    betaStatus: t.exposeString('betaStatus', { nullable: true }),
    enrolledAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.enrolledAt,
    }),
    completedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.completedAt,
    }),
    progress: t.exposeInt('progress'),
    steps: t.field({
      type: 'JSON',
      resolve: (parent) => parent.steps,
    }),
    nextStep: t.exposeString('nextStep'),
    apiKey: t.exposeString('apiKey', { nullable: true }),
    serviceTypes: t.exposeStringList('serviceTypes'),
    portsCoverage: t.exposeStringList('portsCoverage'),
  }),
});

const BetaSignupResultType = builder.objectRef<{
  organizationId: string;
  userId: string;
  betaProfileId: string;
  onboardingComplete: boolean;
  nextStep: string;
}>('BetaSignupResult');

BetaSignupResultType.implement({
  fields: (t) => ({
    organizationId: t.exposeString('organizationId'),
    userId: t.exposeString('userId'),
    betaProfileId: t.exposeString('betaProfileId'),
    onboardingComplete: t.exposeBoolean('onboardingComplete'),
    nextStep: t.exposeString('nextStep'),
  }),
});

const BetaActionResultType = builder.objectRef<{
  success: boolean;
  nextStep?: string;
  apiKey?: string;
  generatedAt?: Date;
  onboardingComplete?: boolean;
}>('BetaActionResult');

BetaActionResultType.implement({
  fields: (t) => ({
    success: t.exposeBoolean('success'),
    nextStep: t.exposeString('nextStep', { nullable: true }),
    apiKey: t.exposeString('apiKey', { nullable: true }),
    generatedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.generatedAt,
    }),
    onboardingComplete: t.exposeBoolean('onboardingComplete', { nullable: true }),
  }),
});

// === Queries ===

builder.queryFields((t) => ({
  betaAgentOnboarding: t.field({
    type: BetaOnboardingStateType,
    nullable: true,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Authentication required');
      }

      return betaAgentOnboardingService.getBetaAgentOnboardingState(ctx.user.organizationId);
    },
  }),

  betaAgentProfile: t.field({
    type: BetaAgentProfileType,
    nullable: true,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Authentication required');
      }

      const profile = await prisma.betaAgentProfile.findUnique({
        where: { organizationId: ctx.user.organizationId },
      });

      return profile;
    },
  }),
}));

// === Mutations ===

builder.mutationFields((t) => ({
  betaAgentSignup: t.field({
    type: BetaSignupResultType,
    args: {
      input: t.arg({ type: BetaAgentSignupInput, required: true }),
    },
    resolve: async (_root, args) => {
      const result = await betaAgentOnboardingService.startBetaAgentOnboarding({
        email: args.input.email,
        agentName: args.input.agentName,
        portsServed: args.input.portsServed,
        serviceTypes: args.input.serviceTypes,
        password: args.input.password,
        contactName: args.input.contactName,
        country: args.input.country,
      });

      return result;
    },
  }),

  submitAgentCredentials: t.field({
    type: BetaActionResultType,
    args: {
      credentials: t.arg({ type: AgentCredentialsInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Authentication required');
      }

      const result = await betaAgentOnboardingService.submitAgentCredentials(
        ctx.user.organizationId,
        args.credentials
      );

      return result;
    },
  }),

  selectPortCoverage: t.field({
    type: BetaActionResultType,
    args: {
      coverage: t.arg({ type: PortCoverageInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Authentication required');
      }

      const result = await betaAgentOnboardingService.selectPortCoverage(ctx.user.organizationId, {
        portIds: args.coverage.portIds,
        primaryPort: args.coverage.primaryPort,
        secondaryPorts: args.coverage.secondaryPorts,
      });

      return result;
    },
  }),

  acceptBetaSLA: t.field({
    type: BetaActionResultType,
    args: {
      slaVersion: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Authentication required');
      }

      const result = await betaAgentOnboardingService.acceptBetaSLA(
        ctx.user.organizationId,
        args.slaVersion
      );

      return result;
    },
  }),

  generateBetaAPIKey: t.field({
    type: BetaActionResultType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Authentication required');
      }

      const result = await betaAgentOnboardingService.generateAgentAPIKey(ctx.user.organizationId);

      return {
        success: true,
        ...result,
      };
    },
  }),

  resetBetaAPIKey: t.field({
    type: BetaActionResultType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Authentication required');
      }

      const result = await betaAgentOnboardingService.resetAPIKey(ctx.user.organizationId);

      return {
        success: true,
        ...result,
      };
    },
  }),
}));
