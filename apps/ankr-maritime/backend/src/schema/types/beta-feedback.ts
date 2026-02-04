/**
 * Beta Feedback GraphQL Schema
 *
 * Provides GraphQL types and resolvers for beta feedback, bug reports, and feature requests.
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';

// === Input Types ===

const BetaFeedbackInput = builder.inputType('BetaFeedbackInput', {
  fields: (t) => ({
    rating: t.int({ required: true }),
    category: t.string({ required: true }), // UI, Performance, Features, Documentation, Support
    feedback: t.string({ required: true }),
    screenshot: t.string({ required: false }),
    url: t.string({ required: false }),
    browser: t.string({ required: false }),
    userAgent: t.string({ required: false }),
  }),
});

const BugReportInput = builder.inputType('BugReportInput', {
  fields: (t) => ({
    title: t.string({ required: true }),
    description: t.string({ required: true }),
    severity: t.string({ required: true }), // CRITICAL, HIGH, MEDIUM, LOW
    stepsToReproduce: t.string({ required: false }),
    screenshot: t.string({ required: false }),
    url: t.string({ required: false }),
    browser: t.string({ required: false }),
    userAgent: t.string({ required: false }),
  }),
});

const FeatureRequestInput = builder.inputType('FeatureRequestInput', {
  fields: (t) => ({
    title: t.string({ required: true }),
    description: t.string({ required: true }),
    priority: t.string({ required: false }), // HIGH, MEDIUM, LOW
  }),
});

const BetaFeedbackFiltersInput = builder.inputType('BetaFeedbackFiltersInput', {
  fields: (t) => ({
    category: t.string({ required: false }),
    minRating: t.int({ required: false }),
    maxRating: t.int({ required: false }),
    startDate: t.field({ type: 'DateTime', required: false }),
    endDate: t.field({ type: 'DateTime', required: false }),
  }),
});

const BugReportFiltersInput = builder.inputType('BugReportFiltersInput', {
  fields: (t) => ({
    severity: t.string({ required: false }),
    status: t.string({ required: false }),
  }),
});

const FeatureRequestFiltersInput = builder.inputType('FeatureRequestFiltersInput', {
  fields: (t) => ({
    status: t.string({ required: false }),
    minVotes: t.int({ required: false }),
  }),
});

// === Object Types ===

const BetaFeedbackType = builder.objectRef<{
  id: string;
  organizationId: string | null;
  userId: string | null;
  rating: number;
  category: string;
  feedback: string;
  screenshot: string | null;
  url: string | null;
  browser: string | null;
  userAgent: string | null;
  createdAt: Date;
}>('BetaFeedback');

BetaFeedbackType.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId', { nullable: true }),
    userId: t.exposeString('userId', { nullable: true }),
    rating: t.exposeInt('rating'),
    category: t.exposeString('category'),
    feedback: t.exposeString('feedback'),
    screenshot: t.exposeString('screenshot', { nullable: true }),
    url: t.exposeString('url', { nullable: true }),
    browser: t.exposeString('browser', { nullable: true }),
    userAgent: t.exposeString('userAgent', { nullable: true }),
    createdAt: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.createdAt,
    }),
  }),
});

const BugReportType = builder.objectRef<{
  id: string;
  organizationId: string | null;
  userId: string | null;
  title: string;
  description: string;
  severity: string;
  stepsToReproduce: string | null;
  screenshot: string | null;
  url: string | null;
  browser: string | null;
  userAgent: string | null;
  status: string;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
}>('BugReport');

BugReportType.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId', { nullable: true }),
    userId: t.exposeString('userId', { nullable: true }),
    title: t.exposeString('title'),
    description: t.exposeString('description'),
    severity: t.exposeString('severity'),
    stepsToReproduce: t.exposeString('stepsToReproduce', { nullable: true }),
    screenshot: t.exposeString('screenshot', { nullable: true }),
    url: t.exposeString('url', { nullable: true }),
    browser: t.exposeString('browser', { nullable: true }),
    userAgent: t.exposeString('userAgent', { nullable: true }),
    status: t.exposeString('status'),
    resolvedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.resolvedAt,
    }),
    resolvedBy: t.exposeString('resolvedBy', { nullable: true }),
    resolution: t.exposeString('resolution', { nullable: true }),
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

const FeatureRequestType = builder.objectRef<{
  id: string;
  organizationId: string | null;
  userId: string | null;
  title: string;
  description: string;
  priority: string | null;
  votes: number;
  status: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>('FeatureRequest');

FeatureRequestType.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId', { nullable: true }),
    userId: t.exposeString('userId', { nullable: true }),
    title: t.exposeString('title'),
    description: t.exposeString('description'),
    priority: t.exposeString('priority', { nullable: true }),
    votes: t.exposeInt('votes'),
    status: t.exposeString('status'),
    completedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.completedAt,
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

const BetaFeedbackStatsType = builder.objectRef<{
  totalFeedback: number;
  averageRating: number;
  categoryBreakdown: Record<string, number>;
  ratingDistribution: Record<string, number>;
}>('BetaFeedbackStats');

BetaFeedbackStatsType.implement({
  fields: (t) => ({
    totalFeedback: t.exposeInt('totalFeedback'),
    averageRating: t.exposeFloat('averageRating'),
    categoryBreakdown: t.field({
      type: 'JSON',
      resolve: (parent) => parent.categoryBreakdown,
    }),
    ratingDistribution: t.field({
      type: 'JSON',
      resolve: (parent) => parent.ratingDistribution,
    }),
  }),
});

// === Queries ===

builder.queryFields((t) => ({
  betaFeedback: t.field({
    type: [BetaFeedbackType],
    args: {
      filters: t.arg({ type: BetaFeedbackFiltersInput, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Authentication required');
      }

      const where: any = {};

      if (args.filters) {
        if (args.filters.category) {
          where.category = args.filters.category;
        }
        if (args.filters.minRating !== undefined) {
          where.rating = { ...where.rating, gte: args.filters.minRating };
        }
        if (args.filters.maxRating !== undefined) {
          where.rating = { ...where.rating, lte: args.filters.maxRating };
        }
        if (args.filters.startDate) {
          where.createdAt = { ...where.createdAt, gte: args.filters.startDate };
        }
        if (args.filters.endDate) {
          where.createdAt = { ...where.createdAt, lte: args.filters.endDate };
        }
      }

      // Admin can see all, users can see only their own
      const isAdmin = ctx.user.role === 'admin';
      if (!isAdmin) {
        where.userId = ctx.user.id;
      }

      const feedback = await prisma.betaFeedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return feedback;
    },
  }),

  bugReports: t.field({
    type: [BugReportType],
    args: {
      filters: t.arg({ type: BugReportFiltersInput, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Authentication required');
      }

      const where: any = {};

      if (args.filters) {
        if (args.filters.severity) {
          where.severity = args.filters.severity;
        }
        if (args.filters.status) {
          where.status = args.filters.status;
        }
      }

      // Admin can see all, users can see only their own
      const isAdmin = ctx.user.role === 'admin';
      if (!isAdmin) {
        where.userId = ctx.user.id;
      }

      const bugs = await prisma.bugReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return bugs;
    },
  }),

  featureRequests: t.field({
    type: [FeatureRequestType],
    args: {
      filters: t.arg({ type: FeatureRequestFiltersInput, required: false }),
    },
    resolve: async (_root, args) => {
      const where: any = {};

      if (args.filters) {
        if (args.filters.status) {
          where.status = args.filters.status;
        }
        if (args.filters.minVotes !== undefined) {
          where.votes = { gte: args.filters.minVotes };
        }
      }

      const requests = await prisma.featureRequest.findMany({
        where,
        orderBy: { votes: 'desc' },
      });

      return requests;
    },
  }),

  betaFeedbackStats: t.field({
    type: BetaFeedbackStatsType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const allFeedback = await prisma.betaFeedback.findMany();

      const totalFeedback = allFeedback.length;
      const averageRating = totalFeedback > 0
        ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
        : 0;

      // Category breakdown
      const categoryBreakdown: Record<string, number> = {};
      allFeedback.forEach(f => {
        categoryBreakdown[f.category] = (categoryBreakdown[f.category] || 0) + 1;
      });

      // Rating distribution
      const ratingDistribution: Record<string, number> = {
        '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
      };
      allFeedback.forEach(f => {
        ratingDistribution[f.rating.toString()] = (ratingDistribution[f.rating.toString()] || 0) + 1;
      });

      return {
        totalFeedback,
        averageRating,
        categoryBreakdown,
        ratingDistribution,
      };
    },
  }),
}));

// === Mutations ===

builder.mutationFields((t) => ({
  submitBetaFeedback: t.field({
    type: BetaFeedbackType,
    args: {
      input: t.arg({ type: BetaFeedbackInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Authentication required');
      }

      const feedback = await prisma.betaFeedback.create({
        data: {
          organizationId: ctx.user.organizationId,
          userId: ctx.user.id,
          rating: args.input.rating,
          category: args.input.category,
          feedback: args.input.feedback,
          screenshot: args.input.screenshot,
          url: args.input.url,
          browser: args.input.browser,
          userAgent: args.input.userAgent,
        },
      });

      return feedback;
    },
  }),

  reportBug: t.field({
    type: BugReportType,
    args: {
      input: t.arg({ type: BugReportInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Authentication required');
      }

      const bug = await prisma.bugReport.create({
        data: {
          organizationId: ctx.user.organizationId,
          userId: ctx.user.id,
          title: args.input.title,
          description: args.input.description,
          severity: args.input.severity,
          stepsToReproduce: args.input.stepsToReproduce,
          screenshot: args.input.screenshot,
          url: args.input.url,
          browser: args.input.browser,
          userAgent: args.input.userAgent,
        },
      });

      return bug;
    },
  }),

  requestFeature: t.field({
    type: FeatureRequestType,
    args: {
      input: t.arg({ type: FeatureRequestInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Authentication required');
      }

      const request = await prisma.featureRequest.create({
        data: {
          organizationId: ctx.user.organizationId,
          userId: ctx.user.id,
          title: args.input.title,
          description: args.input.description,
          priority: args.input.priority,
        },
      });

      return request;
    },
  }),

  voteFeatureRequest: t.field({
    type: FeatureRequestType,
    args: {
      requestId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Authentication required');
      }

      const request = await prisma.featureRequest.update({
        where: { id: args.requestId },
        data: {
          votes: { increment: 1 },
        },
      });

      return request;
    },
  }),

  // Admin mutations
  resolveBugReport: t.field({
    type: BugReportType,
    args: {
      bugId: t.arg.string({ required: true }),
      resolution: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const bug = await prisma.bugReport.update({
        where: { id: args.bugId },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
          resolution: args.resolution,
        },
      });

      return bug;
    },
  }),

  updateFeatureRequestStatus: t.field({
    type: FeatureRequestType,
    args: {
      requestId: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const request = await prisma.featureRequest.update({
        where: { id: args.requestId },
        data: {
          status: args.status,
          completedAt: args.status === 'completed' ? new Date() : null,
        },
      });

      return request;
    },
  }),
}));
