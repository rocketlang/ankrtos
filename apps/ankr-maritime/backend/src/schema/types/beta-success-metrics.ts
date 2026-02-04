/**
 * Beta Success Metrics GraphQL Schema
 *
 * Program health, leaderboards, graduation pipeline, ROI, and success stories.
 */

import { builder } from '../builder.js';
import { betaSuccessMetricsService } from '../../services/beta-success-metrics.service.js';

// === Object Types ===

const ProgramMetricsType = builder.objectRef<{
  enrollmentRate: number;
  activationRate: number;
  retentionRate: number;
  satisfactionScore: number;
  graduationRate: number;
  churnRate: number;
}>('ProgramMetrics');

ProgramMetricsType.implement({
  fields: (t) => ({
    enrollmentRate: t.exposeFloat('enrollmentRate'),
    activationRate: t.exposeFloat('activationRate'),
    retentionRate: t.exposeFloat('retentionRate'),
    satisfactionScore: t.exposeFloat('satisfactionScore'),
    graduationRate: t.exposeFloat('graduationRate'),
    churnRate: t.exposeFloat('churnRate'),
  }),
});

const ProgramTrendsType = builder.objectRef<{
  enrollmentTrend: 'up' | 'down' | 'stable';
  activationTrend: 'up' | 'down' | 'stable';
  retentionTrend: 'up' | 'down' | 'stable';
}>('ProgramTrends');

ProgramTrendsType.implement({
  fields: (t) => ({
    enrollmentTrend: t.exposeString('enrollmentTrend'),
    activationTrend: t.exposeString('activationTrend'),
    retentionTrend: t.exposeString('retentionTrend'),
  }),
});

const ProgramAlertType = builder.objectRef<{
  severity: 'critical' | 'warning' | 'info';
  metric: string;
  message: string;
  recommendation: string;
}>('ProgramAlert');

ProgramAlertType.implement({
  fields: (t) => ({
    severity: t.exposeString('severity'),
    metric: t.exposeString('metric'),
    message: t.exposeString('message'),
    recommendation: t.exposeString('recommendation'),
  }),
});

const ProgramHealthType = builder.objectRef<{
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  healthScore: number;
  metrics: {
    enrollmentRate: number;
    activationRate: number;
    retentionRate: number;
    satisfactionScore: number;
    graduationRate: number;
    churnRate: number;
  };
  trends: {
    enrollmentTrend: 'up' | 'down' | 'stable';
    activationTrend: 'up' | 'down' | 'stable';
    retentionTrend: 'up' | 'down' | 'stable';
  };
  alerts: Array<{
    severity: 'critical' | 'warning' | 'info';
    metric: string;
    message: string;
    recommendation: string;
  }>;
}>('ProgramHealth');

ProgramHealthType.implement({
  fields: (t) => ({
    overallHealth: t.exposeString('overallHealth'),
    healthScore: t.exposeInt('healthScore'),
    metrics: t.field({
      type: ProgramMetricsType,
      resolve: (parent) => parent.metrics,
    }),
    trends: t.field({
      type: ProgramTrendsType,
      resolve: (parent) => parent.trends,
    }),
    alerts: t.field({
      type: [ProgramAlertType],
      resolve: (parent) => parent.alerts,
    }),
  }),
});

const LeaderboardMetricsType = builder.objectRef<{
  loginDays: number;
  featuresUsed: number;
  apiCalls: number;
  feedbackSubmitted: number;
  articlesCompleted: number;
}>('LeaderboardMetrics');

LeaderboardMetricsType.implement({
  fields: (t) => ({
    loginDays: t.exposeInt('loginDays'),
    featuresUsed: t.exposeInt('featuresUsed'),
    apiCalls: t.exposeInt('apiCalls'),
    feedbackSubmitted: t.exposeInt('feedbackSubmitted'),
    articlesCompleted: t.exposeInt('articlesCompleted'),
  }),
});

const LeaderboardEntryType = builder.objectRef<{
  organizationId: string;
  agentName: string;
  engagementScore: number;
  rank: number;
  metrics: {
    loginDays: number;
    featuresUsed: number;
    apiCalls: number;
    feedbackSubmitted: number;
    articlesCompleted: number;
  };
  badges: string[];
}>('LeaderboardEntry');

LeaderboardEntryType.implement({
  fields: (t) => ({
    organizationId: t.exposeID('organizationId'),
    agentName: t.exposeString('agentName'),
    engagementScore: t.exposeInt('engagementScore'),
    rank: t.exposeInt('rank'),
    metrics: t.field({
      type: LeaderboardMetricsType,
      resolve: (parent) => parent.metrics,
    }),
    badges: t.exposeStringList('badges'),
  }),
});

const PipelineStageType = builder.objectRef<{
  stage: string;
  count: number;
  percentage: number;
  avgDaysInStage: number;
}>('PipelineStage');

PipelineStageType.implement({
  fields: (t) => ({
    stage: t.exposeString('stage'),
    count: t.exposeInt('count'),
    percentage: t.exposeFloat('percentage'),
    avgDaysInStage: t.exposeFloat('avgDaysInStage'),
  }),
});

const ReadyToGraduateType = builder.objectRef<{
  organizationId: string;
  agentName: string;
  engagementScore: number;
  daysInBeta: number;
  recommendedTier: 'agent' | 'operator' | 'enterprise';
  readinessScore: number;
}>('ReadyToGraduate');

ReadyToGraduateType.implement({
  fields: (t) => ({
    organizationId: t.exposeID('organizationId'),
    agentName: t.exposeString('agentName'),
    engagementScore: t.exposeInt('engagementScore'),
    daysInBeta: t.exposeInt('daysInBeta'),
    recommendedTier: t.exposeString('recommendedTier'),
    readinessScore: t.exposeInt('readinessScore'),
  }),
});

const GraduationPipelineType = builder.objectRef<{
  stages: Array<{
    stage: string;
    count: number;
    percentage: number;
    avgDaysInStage: number;
  }>;
  readyToGraduate: Array<{
    organizationId: string;
    agentName: string;
    engagementScore: number;
    daysInBeta: number;
    recommendedTier: 'agent' | 'operator' | 'enterprise';
    readinessScore: number;
  }>;
}>('GraduationPipeline');

GraduationPipelineType.implement({
  fields: (t) => ({
    stages: t.field({
      type: [PipelineStageType],
      resolve: (parent) => parent.stages,
    }),
    readyToGraduate: t.field({
      type: [ReadyToGraduateType],
      resolve: (parent) => parent.readyToGraduate,
    }),
  }),
});

const ROIBreakdownType = builder.objectRef<{
  developmentCost: number;
  supportCost: number;
  marketingCost: number;
  graduatedRevenue: number;
  projectedRevenue: number;
}>('ROIBreakdown');

ROIBreakdownType.implement({
  fields: (t) => ({
    developmentCost: t.exposeFloat('developmentCost'),
    supportCost: t.exposeFloat('supportCost'),
    marketingCost: t.exposeFloat('marketingCost'),
    graduatedRevenue: t.exposeFloat('graduatedRevenue'),
    projectedRevenue: t.exposeFloat('projectedRevenue'),
  }),
});

const ProgramROIType = builder.objectRef<{
  totalInvestment: number;
  totalRevenue: number;
  roi: number;
  breakdown: {
    developmentCost: number;
    supportCost: number;
    marketingCost: number;
    graduatedRevenue: number;
    projectedRevenue: number;
  };
  paybackPeriod: number;
}>('ProgramROI');

ProgramROIType.implement({
  fields: (t) => ({
    totalInvestment: t.exposeFloat('totalInvestment'),
    totalRevenue: t.exposeFloat('totalRevenue'),
    roi: t.exposeFloat('roi'),
    breakdown: t.field({
      type: ROIBreakdownType,
      resolve: (parent) => parent.breakdown,
    }),
    paybackPeriod: t.exposeInt('paybackPeriod'),
  }),
});

const SuccessStoryMetricsType = builder.objectRef<{
  daysInBeta: number;
  engagementScore: number;
  graduatedTier: string;
  testimonial?: string;
}>('SuccessStoryMetrics');

SuccessStoryMetricsType.implement({
  fields: (t) => ({
    daysInBeta: t.exposeInt('daysInBeta'),
    engagementScore: t.exposeInt('engagementScore'),
    graduatedTier: t.exposeString('graduatedTier'),
    testimonial: t.exposeString('testimonial', { nullable: true }),
  }),
});

const SuccessStoryType = builder.objectRef<{
  organizationId: string;
  agentName: string;
  story: string;
  metrics: {
    daysInBeta: number;
    engagementScore: number;
    graduatedTier: string;
    testimonial?: string;
  };
  highlights: string[];
}>('SuccessStory');

SuccessStoryType.implement({
  fields: (t) => ({
    organizationId: t.exposeID('organizationId'),
    agentName: t.exposeString('agentName'),
    story: t.exposeString('story'),
    metrics: t.field({
      type: SuccessStoryMetricsType,
      resolve: (parent) => parent.metrics,
    }),
    highlights: t.exposeStringList('highlights'),
  }),
});

// === Queries ===

builder.queryFields((t) => ({
  betaProgramHealth: t.field({
    type: ProgramHealthType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return await betaSuccessMetricsService.getProgramHealth();
    },
  }),

  betaEngagementLeaderboard: t.field({
    type: [LeaderboardEntryType],
    args: {
      limit: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return await betaSuccessMetricsService.getEngagementLeaderboard(args.limit || 10);
    },
  }),

  betaGraduationPipeline: t.field({
    type: GraduationPipelineType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return await betaSuccessMetricsService.getGraduationPipeline();
    },
  }),

  betaProgramROI: t.field({
    type: ProgramROIType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return await betaSuccessMetricsService.calculateROI();
    },
  }),

  betaSuccessStories: t.field({
    type: [SuccessStoryType],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return await betaSuccessMetricsService.getSuccessStories();
    },
  }),
}));
