/**
 * Beta Analytics GraphQL Schema
 *
 * Queries for engagement scoring, adoption funnel, cohort analysis,
 * feature adoption, and churn risk prediction.
 */

import { builder } from '../builder.js';
import { betaAnalyticsService } from '../../services/beta-analytics.service.js';

// === Object Types ===

const EngagementBreakdownType = builder.objectRef<{
  loginFrequency: number;
  featureUsageDiversity: number;
  apiCallVolume: number;
  feedbackSubmissions: number;
}>('EngagementBreakdown');

EngagementBreakdownType.implement({
  fields: (t) => ({
    loginFrequency: t.exposeInt('loginFrequency'),
    featureUsageDiversity: t.exposeInt('featureUsageDiversity'),
    apiCallVolume: t.exposeInt('apiCallVolume'),
    feedbackSubmissions: t.exposeInt('feedbackSubmissions'),
  }),
});

const EngagementDetailsType = builder.objectRef<{
  lastLoginDaysAgo: number;
  uniqueFeaturesUsed: number;
  weeklyApiCalls: number;
  totalFeedback: number;
}>('EngagementDetails');

EngagementDetailsType.implement({
  fields: (t) => ({
    lastLoginDaysAgo: t.exposeInt('lastLoginDaysAgo'),
    uniqueFeaturesUsed: t.exposeInt('uniqueFeaturesUsed'),
    weeklyApiCalls: t.exposeInt('weeklyApiCalls'),
    totalFeedback: t.exposeInt('totalFeedback'),
  }),
});

const EngagementScoreType = builder.objectRef<{
  totalScore: number;
  breakdown: {
    loginFrequency: number;
    featureUsageDiversity: number;
    apiCallVolume: number;
    feedbackSubmissions: number;
  };
  details: {
    lastLoginDaysAgo: number;
    uniqueFeaturesUsed: number;
    weeklyApiCalls: number;
    totalFeedback: number;
  };
}>('EngagementScore');

EngagementScoreType.implement({
  fields: (t) => ({
    totalScore: t.exposeInt('totalScore'),
    breakdown: t.field({
      type: EngagementBreakdownType,
      resolve: (parent) => parent.breakdown,
    }),
    details: t.field({
      type: EngagementDetailsType,
      resolve: (parent) => parent.details,
    }),
  }),
});

const AdoptionFunnelStageType = builder.objectRef<{
  stage: string;
  count: number;
  percentage: number;
  conversionRate: number | null;
}>('AdoptionFunnelStage');

AdoptionFunnelStageType.implement({
  fields: (t) => ({
    stage: t.exposeString('stage'),
    count: t.exposeInt('count'),
    percentage: t.exposeFloat('percentage'),
    conversionRate: t.exposeFloat('conversionRate', { nullable: true }),
  }),
});

const AdoptionFunnelSummaryType = builder.objectRef<{
  signupToActive: number;
  avgTimeToOnboarding: number;
  avgTimeToFirstLogin: number;
  avgTimeToFirstAction: number;
}>('AdoptionFunnelSummary');

AdoptionFunnelSummaryType.implement({
  fields: (t) => ({
    signupToActive: t.exposeFloat('signupToActive'),
    avgTimeToOnboarding: t.exposeFloat('avgTimeToOnboarding'),
    avgTimeToFirstLogin: t.exposeFloat('avgTimeToFirstLogin'),
    avgTimeToFirstAction: t.exposeFloat('avgTimeToFirstAction'),
  }),
});

const AdoptionFunnelType = builder.objectRef<{
  stages: Array<{
    stage: string;
    count: number;
    percentage: number;
    conversionRate: number | null;
  }>;
  summary: {
    signupToActive: number;
    avgTimeToOnboarding: number;
    avgTimeToFirstLogin: number;
    avgTimeToFirstAction: number;
  };
}>('AdoptionFunnel');

AdoptionFunnelType.implement({
  fields: (t) => ({
    stages: t.field({
      type: [AdoptionFunnelStageType],
      resolve: (parent) => parent.stages,
    }),
    summary: t.field({
      type: AdoptionFunnelSummaryType,
      resolve: (parent) => parent.summary,
    }),
  }),
});

const RetentionWeekType = builder.objectRef<{
  week: number;
  activeCount: number;
  retentionRate: number;
}>('RetentionWeek');

RetentionWeekType.implement({
  fields: (t) => ({
    week: t.exposeInt('week'),
    activeCount: t.exposeInt('activeCount'),
    retentionRate: t.exposeFloat('retentionRate'),
  }),
});

const CohortType = builder.objectRef<{
  cohortWeek: string;
  signupCount: number;
  retentionWeeks: Array<{
    week: number;
    activeCount: number;
    retentionRate: number;
  }>;
}>('Cohort');

CohortType.implement({
  fields: (t) => ({
    cohortWeek: t.exposeString('cohortWeek'),
    signupCount: t.exposeInt('signupCount'),
    retentionWeeks: t.field({
      type: [RetentionWeekType],
      resolve: (parent) => parent.retentionWeeks,
    }),
  }),
});

const CohortAnalysisType = builder.objectRef<{
  cohorts: Array<{
    cohortWeek: string;
    signupCount: number;
    retentionWeeks: Array<{
      week: number;
      activeCount: number;
      retentionRate: number;
    }>;
  }>;
}>('CohortAnalysis');

CohortAnalysisType.implement({
  fields: (t) => ({
    cohorts: t.field({
      type: [CohortType],
      resolve: (parent) => parent.cohorts,
    }),
  }),
});

const FeatureAdoptionType = builder.objectRef<{
  featureName: string;
  adoptionCount: number;
  adoptionRate: number;
  totalUsageCount: number;
  avgUsagePerAgent: number;
}>('FeatureAdoption');

FeatureAdoptionType.implement({
  fields: (t) => ({
    featureName: t.exposeString('featureName'),
    adoptionCount: t.exposeInt('adoptionCount'),
    adoptionRate: t.exposeFloat('adoptionRate'),
    totalUsageCount: t.exposeInt('totalUsageCount'),
    avgUsagePerAgent: t.exposeFloat('avgUsagePerAgent'),
  }),
});

const FeatureAdoptionSummaryType = builder.objectRef<{
  totalBetaAgents: number;
  avgFeaturesPerAgent: number;
  mostPopularFeature: string;
  leastPopularFeature: string;
}>('FeatureAdoptionSummary');

FeatureAdoptionSummaryType.implement({
  fields: (t) => ({
    totalBetaAgents: t.exposeInt('totalBetaAgents'),
    avgFeaturesPerAgent: t.exposeFloat('avgFeaturesPerAgent'),
    mostPopularFeature: t.exposeString('mostPopularFeature'),
    leastPopularFeature: t.exposeString('leastPopularFeature'),
  }),
});

const FeatureAdoptionRatesType = builder.objectRef<{
  features: Array<{
    featureName: string;
    adoptionCount: number;
    adoptionRate: number;
    totalUsageCount: number;
    avgUsagePerAgent: number;
  }>;
  summary: {
    totalBetaAgents: number;
    avgFeaturesPerAgent: number;
    mostPopularFeature: string;
    leastPopularFeature: string;
  };
}>('FeatureAdoptionRates');

FeatureAdoptionRatesType.implement({
  fields: (t) => ({
    features: t.field({
      type: [FeatureAdoptionType],
      resolve: (parent) => parent.features,
    }),
    summary: t.field({
      type: FeatureAdoptionSummaryType,
      resolve: (parent) => parent.summary,
    }),
  }),
});

const ChurnRiskType = builder.objectRef<{
  riskLevel: 'NO' | 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
  reasons: string[];
  recommendations: string[];
  currentEngagement: number;
  engagementTrend: 'increasing' | 'stable' | 'declining';
}>('ChurnRisk');

ChurnRiskType.implement({
  fields: (t) => ({
    riskLevel: t.exposeString('riskLevel'),
    riskScore: t.exposeInt('riskScore'),
    reasons: t.exposeStringList('reasons'),
    recommendations: t.exposeStringList('recommendations'),
    currentEngagement: t.exposeInt('currentEngagement'),
    engagementTrend: t.exposeString('engagementTrend'),
  }),
});

// === Queries ===

builder.queryFields((t) => ({
  betaEngagementScore: t.field({
    type: EngagementScoreType,
    args: {
      organizationId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return await betaAnalyticsService.calculateEngagementScore(args.organizationId);
    },
  }),

  betaAdoptionFunnel: t.field({
    type: AdoptionFunnelType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return await betaAnalyticsService.getAdoptionFunnel();
    },
  }),

  betaCohortAnalysis: t.field({
    type: CohortAnalysisType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return await betaAnalyticsService.getBetaCohortAnalysis();
    },
  }),

  betaFeatureAdoption: t.field({
    type: FeatureAdoptionRatesType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return await betaAnalyticsService.getFeatureAdoptionRates();
    },
  }),

  betaChurnRisk: t.field({
    type: ChurnRiskType,
    args: {
      organizationId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return await betaAnalyticsService.getChurnRisk(args.organizationId);
    },
  }),
}));
