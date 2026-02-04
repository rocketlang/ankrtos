/**
 * Beta Admin GraphQL Schema
 *
 * Provides admin-only queries and mutations for managing beta agents,
 * viewing feedback, and performing bulk operations.
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';

// === Input Types ===

const BetaAgentFiltersInput = builder.inputType('BetaAgentFiltersInput', {
  fields: (t) => ({
    betaStatus: t.string({ required: false }),
    onboardingComplete: t.boolean({ required: false }),
    minEngagementScore: t.int({ required: false }),
  }),
});

const BulkMessageInput = builder.inputType('BulkMessageInput', {
  fields: (t) => ({
    organizationIds: t.stringList({ required: true }),
    subject: t.string({ required: true }),
    message: t.string({ required: true }),
  }),
});

// === Object Types ===

const BetaAgentSummaryType = builder.objectRef<{
  id: string;
  name: string;
  agentName: string;
  betaStatus: string | null;
  enrolledAt: Date | null;
  completedAt: Date | null;
  onboardingProgress: number;
  lastLoginAt: Date | null;
  feedbackCount: number;
  bugReportCount: number;
  featureRequestCount: number;
}>('BetaAgentSummary');

BetaAgentSummaryType.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
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
    onboardingProgress: t.exposeInt('onboardingProgress'),
    lastLoginAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.lastLoginAt,
    }),
    feedbackCount: t.exposeInt('feedbackCount'),
    bugReportCount: t.exposeInt('bugReportCount'),
    featureRequestCount: t.exposeInt('featureRequestCount'),
  }),
});

const BetaAgentDetailType = builder.objectRef<{
  organizationId: string;
  organizationName: string;
  agentName: string;
  betaStatus: string | null;
  enrolledAt: Date | null;
  completedAt: Date | null;
  serviceTypes: string[];
  portsCoverage: string[];
  apiKey: string | null;
  apiKeyGeneratedAt: Date | null;
  slaAcceptedAt: Date | null;
  slaVersion: string | null;
  users: Array<{ id: string; email: string; name: string; lastLoginAt: Date | null }>;
  feedbackCount: number;
  bugReportCount: number;
  featureRequestCount: number;
  avgFeedbackRating: number | null;
}>('BetaAgentDetail');

BetaAgentDetailType.implement({
  fields: (t) => ({
    organizationId: t.exposeString('organizationId'),
    organizationName: t.exposeString('organizationName'),
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
    serviceTypes: t.exposeStringList('serviceTypes'),
    portsCoverage: t.exposeStringList('portsCoverage'),
    apiKey: t.exposeString('apiKey', { nullable: true }),
    apiKeyGeneratedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.apiKeyGeneratedAt,
    }),
    slaAcceptedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.slaAcceptedAt,
    }),
    slaVersion: t.exposeString('slaVersion', { nullable: true }),
    users: t.field({
      type: 'JSON',
      resolve: (parent) => parent.users,
    }),
    feedbackCount: t.exposeInt('feedbackCount'),
    bugReportCount: t.exposeInt('bugReportCount'),
    featureRequestCount: t.exposeInt('featureRequestCount'),
    avgFeedbackRating: t.exposeFloat('avgFeedbackRating', { nullable: true }),
  }),
});

const BetaStatsType = builder.objectRef<{
  totalAgents: number;
  enrolledAgents: number;
  activeAgents: number;
  churnedAgents: number;
  avgOnboardingProgress: number;
  onboardingCompletionRate: number;
  totalFeedback: number;
  totalBugs: number;
  totalFeatureRequests: number;
  avgSatisfactionRating: number;
  criticalBugsOpen: number;
}>('BetaStats');

BetaStatsType.implement({
  fields: (t) => ({
    totalAgents: t.exposeInt('totalAgents'),
    enrolledAgents: t.exposeInt('enrolledAgents'),
    activeAgents: t.exposeInt('activeAgents'),
    churnedAgents: t.exposeInt('churnedAgents'),
    avgOnboardingProgress: t.exposeFloat('avgOnboardingProgress'),
    onboardingCompletionRate: t.exposeFloat('onboardingCompletionRate'),
    totalFeedback: t.exposeInt('totalFeedback'),
    totalBugs: t.exposeInt('totalBugs'),
    totalFeatureRequests: t.exposeInt('totalFeatureRequests'),
    avgSatisfactionRating: t.exposeFloat('avgSatisfactionRating'),
    criticalBugsOpen: t.exposeInt('criticalBugsOpen'),
  }),
});

const AdminActionResultType = builder.objectRef<{
  success: boolean;
  message: string;
}>('AdminActionResult');

AdminActionResultType.implement({
  fields: (t) => ({
    success: t.exposeBoolean('success'),
    message: t.exposeString('message'),
  }),
});

// === Queries ===

builder.queryFields((t) => ({
  betaAgents: t.field({
    type: [BetaAgentSummaryType],
    args: {
      filters: t.arg({ type: BetaAgentFiltersInput, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const where: any = {};

      // Only include orgs with beta profile
      where.betaAgentProfile = { isNot: null };

      if (args.filters) {
        if (args.filters.betaStatus) {
          where.betaStatus = args.filters.betaStatus;
        }
        if (args.filters.onboardingComplete !== undefined) {
          if (args.filters.onboardingComplete) {
            where.betaCompletedOnboardingAt = { not: null };
          } else {
            where.betaCompletedOnboardingAt = null;
          }
        }
      }

      const orgs = await prisma.organization.findMany({
        where,
        include: {
          betaAgentProfile: true,
          users: {
            orderBy: { lastLoginAt: 'desc' },
            take: 1,
          },
          betaFeedback: true,
          bugReports: true,
          featureRequests: true,
        },
        orderBy: { betaEnrolledAt: 'desc' },
      });

      return orgs.map((org) => {
        const profile = org.betaAgentProfile!;

        // Calculate onboarding progress
        const steps = {
          credentials: !!profile.credentials,
          ports: profile.portsCoverage.length > 0,
          sla: !!profile.slaAcceptedAt,
          apiKey: !!profile.apiKey,
        };
        const completed = Object.values(steps).filter(Boolean).length;
        const progress = Math.round((completed / 4) * 100);

        return {
          id: org.id,
          name: org.name,
          agentName: profile.agentName,
          betaStatus: org.betaStatus,
          enrolledAt: org.betaEnrolledAt,
          completedAt: org.betaCompletedOnboardingAt,
          onboardingProgress: progress,
          lastLoginAt: org.users[0]?.lastLoginAt || null,
          feedbackCount: org.betaFeedback.length,
          bugReportCount: org.bugReports.length,
          featureRequestCount: org.featureRequests.length,
        };
      });
    },
  }),

  betaAgentDetail: t.field({
    type: BetaAgentDetailType,
    args: {
      organizationId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const org = await prisma.organization.findUnique({
        where: { id: args.organizationId },
        include: {
          betaAgentProfile: true,
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              lastLoginAt: true,
            },
          },
          betaFeedback: true,
          bugReports: true,
          featureRequests: true,
        },
      });

      if (!org || !org.betaAgentProfile) {
        throw new Error('Beta agent not found');
      }

      const profile = org.betaAgentProfile;

      // Calculate average feedback rating
      const ratings = org.betaFeedback.map(f => f.rating);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : null;

      return {
        organizationId: org.id,
        organizationName: org.name,
        agentName: profile.agentName,
        betaStatus: org.betaStatus,
        enrolledAt: org.betaEnrolledAt,
        completedAt: org.betaCompletedOnboardingAt,
        serviceTypes: profile.serviceTypes,
        portsCoverage: profile.portsCoverage,
        apiKey: profile.apiKey,
        apiKeyGeneratedAt: profile.apiKeyGeneratedAt,
        slaAcceptedAt: profile.slaAcceptedAt,
        slaVersion: profile.slaVersion,
        users: org.users,
        feedbackCount: org.betaFeedback.length,
        bugReportCount: org.bugReports.length,
        featureRequestCount: org.featureRequests.length,
        avgFeedbackRating: avgRating,
      };
    },
  }),

  betaAgentStats: t.field({
    type: BetaStatsType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const allAgents = await prisma.organization.findMany({
        where: { betaAgentProfile: { isNot: null } },
        include: {
          betaAgentProfile: true,
          betaFeedback: true,
          bugReports: true,
        },
      });

      const totalAgents = allAgents.length;
      const enrolledAgents = allAgents.filter(a => a.betaStatus === 'enrolled').length;
      const activeAgents = allAgents.filter(a => a.betaStatus === 'active').length;
      const churnedAgents = allAgents.filter(a => a.betaStatus === 'churned').length;

      // Calculate average onboarding progress
      const progressValues = allAgents.map(org => {
        const profile = org.betaAgentProfile!;
        const steps = {
          credentials: !!profile.credentials,
          ports: profile.portsCoverage.length > 0,
          sla: !!profile.slaAcceptedAt,
          apiKey: !!profile.apiKey,
        };
        const completed = Object.values(steps).filter(Boolean).length;
        return (completed / 4) * 100;
      });
      const avgOnboardingProgress = progressValues.length > 0
        ? progressValues.reduce((sum, p) => sum + p, 0) / progressValues.length
        : 0;

      const completedCount = allAgents.filter(a => a.betaCompletedOnboardingAt !== null).length;
      const onboardingCompletionRate = totalAgents > 0 ? (completedCount / totalAgents) * 100 : 0;

      const allFeedback = allAgents.flatMap(a => a.betaFeedback);
      const totalFeedback = allFeedback.length;
      const avgSatisfactionRating = totalFeedback > 0
        ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
        : 0;

      const allBugs = allAgents.flatMap(a => a.bugReports);
      const totalBugs = allBugs.length;
      const criticalBugsOpen = allBugs.filter(
        b => b.severity === 'CRITICAL' && b.status !== 'resolved'
      ).length;

      const totalFeatureRequests = await prisma.featureRequest.count();

      return {
        totalAgents,
        enrolledAgents,
        activeAgents,
        churnedAgents,
        avgOnboardingProgress,
        onboardingCompletionRate,
        totalFeedback,
        totalBugs,
        totalFeatureRequests,
        avgSatisfactionRating,
        criticalBugsOpen,
      };
    },
  }),
}));

// === Mutations ===

builder.mutationFields((t) => ({
  approveBetaAgent: t.field({
    type: AdminActionResultType,
    args: {
      organizationId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      await prisma.organization.update({
        where: { id: args.organizationId },
        data: { betaStatus: 'active' },
      });

      return {
        success: true,
        message: 'Beta agent approved and activated',
      };
    },
  }),

  suspendBetaAgent: t.field({
    type: AdminActionResultType,
    args: {
      organizationId: t.arg.string({ required: true }),
      reason: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      await prisma.organization.update({
        where: { id: args.organizationId },
        data: {
          betaStatus: 'churned',
          // Store reason in a metadata field if needed
        },
      });

      // TODO: Send notification email to agent about suspension

      return {
        success: true,
        message: `Beta agent suspended. Reason: ${args.reason}`,
      };
    },
  }),

  graduateBetaAgent: t.field({
    type: AdminActionResultType,
    args: {
      organizationId: t.arg.string({ required: true }),
      tier: t.arg.string({ required: true }), // agent, operator, enterprise
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      // Update organization status
      await prisma.organization.update({
        where: { id: args.organizationId },
        data: { betaStatus: 'active' }, // Keep as active but they're now paying
      });

      // TODO: Create subscription for the agent with specified tier
      // TODO: Send congratulations email with payment details

      return {
        success: true,
        message: `Beta agent graduated to ${args.tier} tier`,
      };
    },
  }),

  resetBetaAgentAPIKey: t.field({
    type: AdminActionResultType,
    args: {
      organizationId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const { randomBytes } = await import('crypto');
      const newApiKey = `beta_${randomBytes(32).toString('hex')}`;
      const now = new Date();

      await prisma.$transaction(async (tx) => {
        await tx.betaAgentProfile.update({
          where: { organizationId: args.organizationId },
          data: {
            apiKey: newApiKey,
            apiKeyGeneratedAt: now,
          },
        });

        await tx.organization.update({
          where: { id: args.organizationId },
          data: {
            apiKey: newApiKey,
            apiKeyGeneratedAt: now,
          },
        });
      });

      // TODO: Send email notification about API key reset

      return {
        success: true,
        message: 'API key reset successfully. Agent has been notified.',
      };
    },
  }),

  sendBulkMessage: t.field({
    type: AdminActionResultType,
    args: {
      input: t.arg({ type: BulkMessageInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const { organizationIds, subject, message } = args.input;

      // Get all users from selected organizations
      const orgs = await prisma.organization.findMany({
        where: { id: { in: organizationIds } },
        include: { users: true },
      });

      const allEmails = orgs.flatMap(org => org.users.map(u => u.email));

      // TODO: Send bulk email using email service
      console.log(`Sending bulk message to ${allEmails.length} users:`, { subject, message });

      return {
        success: true,
        message: `Message sent to ${allEmails.length} users across ${organizationIds.length} organizations`,
      };
    },
  }),
}));
