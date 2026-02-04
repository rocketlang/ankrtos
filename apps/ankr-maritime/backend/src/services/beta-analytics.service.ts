/**
 * Beta Analytics Service
 *
 * Provides engagement scoring, adoption funnel tracking, cohort analysis,
 * feature adoption rates, and churn risk prediction for beta agents.
 */

import { prisma } from '../lib/prisma.js';

export class BetaAnalyticsService {
  /**
   * Calculate engagement score (0-100) for a beta agent
   *
   * Scoring breakdown:
   * - Login frequency: 30 points (daily=30, weekly=20, monthly=10, less=5)
   * - Feature usage diversity: 30 points (1 point per unique feature, max 30)
   * - API call volume: 20 points (>100/week=20, >50/week=15, >10/week=10, less=5)
   * - Feedback submissions: 20 points (5 points per submission, max 20)
   */
  async calculateEngagementScore(organizationId: string): Promise<{
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
  }> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get organization with related data
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          orderBy: { lastLoginAt: 'desc' },
          take: 1,
        },
        betaFeedback: true,
        bugReports: true,
        featureRequests: true,
      },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // === 1. Login Frequency (30 points) ===
    let loginFrequencyScore = 0;
    let lastLoginDaysAgo = 999;

    const lastLogin = org.users[0]?.lastLoginAt;
    if (lastLogin) {
      const daysAgo = Math.floor((now.getTime() - lastLogin.getTime()) / (24 * 60 * 60 * 1000));
      lastLoginDaysAgo = daysAgo;

      if (daysAgo === 0) {
        loginFrequencyScore = 30; // Logged in today (daily active)
      } else if (daysAgo <= 7) {
        loginFrequencyScore = 20; // Logged in this week (weekly active)
      } else if (daysAgo <= 30) {
        loginFrequencyScore = 10; // Logged in this month (monthly active)
      } else {
        loginFrequencyScore = 5; // Inactive
      }
    }

    // === 2. Feature Usage Diversity (30 points) ===
    const featureAccessLogs = await prisma.featureAccessLog.findMany({
      where: {
        userId: { in: org.users.map(u => u.id) },
        createdAt: { gte: oneMonthAgo },
      },
      select: { featureName: true },
      distinct: ['featureName'],
    });

    const uniqueFeaturesUsed = featureAccessLogs.length;
    const featureUsageDiversityScore = Math.min(uniqueFeaturesUsed, 30); // 1 point per feature, max 30

    // === 3. API Call Volume (20 points) ===
    const apiUsage = await prisma.apiUsage.findMany({
      where: {
        userId: { in: org.users.map(u => u.id) },
        createdAt: { gte: oneWeekAgo },
      },
    });

    const weeklyApiCalls = apiUsage.length;
    let apiCallVolumeScore = 0;

    if (weeklyApiCalls >= 100) {
      apiCallVolumeScore = 20;
    } else if (weeklyApiCalls >= 50) {
      apiCallVolumeScore = 15;
    } else if (weeklyApiCalls >= 10) {
      apiCallVolumeScore = 10;
    } else if (weeklyApiCalls > 0) {
      apiCallVolumeScore = 5;
    }

    // === 4. Feedback Submissions (20 points) ===
    const totalFeedback = org.betaFeedback.length + org.bugReports.length + org.featureRequests.length;
    const feedbackSubmissionsScore = Math.min(totalFeedback * 5, 20); // 5 points per submission, max 20

    // === Calculate Total ===
    const totalScore = loginFrequencyScore + featureUsageDiversityScore + apiCallVolumeScore + feedbackSubmissionsScore;

    return {
      totalScore,
      breakdown: {
        loginFrequency: loginFrequencyScore,
        featureUsageDiversity: featureUsageDiversityScore,
        apiCallVolume: apiCallVolumeScore,
        feedbackSubmissions: feedbackSubmissionsScore,
      },
      details: {
        lastLoginDaysAgo,
        uniqueFeaturesUsed,
        weeklyApiCalls,
        totalFeedback,
      },
    };
  }

  /**
   * Get adoption funnel metrics
   *
   * Tracks conversion rates through:
   * 1. Signup
   * 2. Onboarding Started
   * 3. Onboarding Completed
   * 4. First Login
   * 5. First Action (any feature usage)
   * 6. Active User (7-day active)
   */
  async getAdoptionFunnel(): Promise<{
    stages: Array<{
      stage: string;
      count: number;
      percentage: number;
      conversionRate: number | null;
    }>;
    summary: {
      signupToActive: number; // Overall conversion rate
      avgTimeToOnboarding: number; // Hours
      avgTimeToFirstLogin: number; // Hours
      avgTimeToFirstAction: number; // Hours
    };
  }> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all beta agents
    const allAgents = await prisma.organization.findMany({
      where: { betaAgentProfile: { isNot: null } },
      include: {
        users: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
        betaAgentProfile: true,
      },
    });

    const totalSignups = allAgents.length;

    // Stage 1: Signup (baseline)
    const signupCount = totalSignups;

    // Stage 2: Onboarding Started (has betaEnrolledAt)
    const onboardingStarted = allAgents.filter(a => a.betaEnrolledAt !== null);
    const onboardingStartedCount = onboardingStarted.length;

    // Stage 3: Onboarding Completed (has betaCompletedOnboardingAt)
    const onboardingCompleted = allAgents.filter(a => a.betaCompletedOnboardingAt !== null);
    const onboardingCompletedCount = onboardingCompleted.length;

    // Stage 4: First Login (has at least one user with lastLoginAt)
    const firstLogin = allAgents.filter(a => a.users[0]?.lastLoginAt !== null);
    const firstLoginCount = firstLogin.length;

    // Stage 5: First Action (has at least one feature access log)
    let firstActionCount = 0;
    for (const org of allAgents) {
      const hasAction = await prisma.featureAccessLog.findFirst({
        where: { userId: { in: org.users.map(u => u.id) } },
      });
      if (hasAction) firstActionCount++;
    }

    // Stage 6: Active User (7-day active)
    const activeUsers = allAgents.filter(a => {
      const lastLogin = a.users[0]?.lastLoginAt;
      return lastLogin && lastLogin >= sevenDaysAgo;
    });
    const activeUserCount = activeUsers.length;

    // Calculate conversion rates (vs previous stage)
    const stages = [
      {
        stage: 'Signup',
        count: signupCount,
        percentage: 100,
        conversionRate: null,
      },
      {
        stage: 'Onboarding Started',
        count: onboardingStartedCount,
        percentage: (onboardingStartedCount / signupCount) * 100,
        conversionRate: (onboardingStartedCount / signupCount) * 100,
      },
      {
        stage: 'Onboarding Completed',
        count: onboardingCompletedCount,
        percentage: (onboardingCompletedCount / signupCount) * 100,
        conversionRate: onboardingStartedCount > 0 ? (onboardingCompletedCount / onboardingStartedCount) * 100 : 0,
      },
      {
        stage: 'First Login',
        count: firstLoginCount,
        percentage: (firstLoginCount / signupCount) * 100,
        conversionRate: onboardingCompletedCount > 0 ? (firstLoginCount / onboardingCompletedCount) * 100 : 0,
      },
      {
        stage: 'First Action',
        count: firstActionCount,
        percentage: (firstActionCount / signupCount) * 100,
        conversionRate: firstLoginCount > 0 ? (firstActionCount / firstLoginCount) * 100 : 0,
      },
      {
        stage: 'Active User',
        count: activeUserCount,
        percentage: (activeUserCount / signupCount) * 100,
        conversionRate: firstActionCount > 0 ? (activeUserCount / firstActionCount) * 100 : 0,
      },
    ];

    // Calculate average times
    let totalTimeToOnboarding = 0;
    let totalTimeToFirstLogin = 0;
    let totalTimeToFirstAction = 0;
    let onboardingCount = 0;
    let loginCount = 0;
    let actionCount = 0;

    for (const org of onboardingCompleted) {
      if (org.betaEnrolledAt && org.betaCompletedOnboardingAt) {
        const hours = (org.betaCompletedOnboardingAt.getTime() - org.betaEnrolledAt.getTime()) / (60 * 60 * 1000);
        totalTimeToOnboarding += hours;
        onboardingCount++;
      }
    }

    for (const org of firstLogin) {
      if (org.betaEnrolledAt && org.users[0]?.lastLoginAt) {
        const hours = (org.users[0].lastLoginAt.getTime() - org.betaEnrolledAt.getTime()) / (60 * 60 * 1000);
        totalTimeToFirstLogin += hours;
        loginCount++;
      }
    }

    // For first action, we need to find the earliest feature access log
    for (const org of allAgents) {
      if (org.betaEnrolledAt) {
        const firstAction = await prisma.featureAccessLog.findFirst({
          where: { userId: { in: org.users.map(u => u.id) } },
          orderBy: { createdAt: 'asc' },
        });
        if (firstAction) {
          const hours = (firstAction.createdAt.getTime() - org.betaEnrolledAt.getTime()) / (60 * 60 * 1000);
          totalTimeToFirstAction += hours;
          actionCount++;
        }
      }
    }

    return {
      stages,
      summary: {
        signupToActive: signupCount > 0 ? (activeUserCount / signupCount) * 100 : 0,
        avgTimeToOnboarding: onboardingCount > 0 ? totalTimeToOnboarding / onboardingCount : 0,
        avgTimeToFirstLogin: loginCount > 0 ? totalTimeToFirstLogin / loginCount : 0,
        avgTimeToFirstAction: actionCount > 0 ? totalTimeToFirstAction / actionCount : 0,
      },
    };
  }

  /**
   * Get weekly cohort retention analysis
   *
   * Groups agents by signup week and tracks retention over subsequent weeks.
   */
  async getBetaCohortAnalysis(): Promise<{
    cohorts: Array<{
      cohortWeek: string; // ISO week (YYYY-WW)
      signupCount: number;
      retentionWeeks: Array<{
        week: number; // Weeks since signup
        activeCount: number;
        retentionRate: number;
      }>;
    }>;
  }> {
    const allAgents = await prisma.organization.findMany({
      where: { betaAgentProfile: { isNot: null } },
      include: {
        users: true,
      },
    });

    // Group by signup week
    const cohortMap = new Map<string, typeof allAgents>();

    for (const agent of allAgents) {
      if (!agent.betaEnrolledAt) continue;

      const week = this.getISOWeek(agent.betaEnrolledAt);
      if (!cohortMap.has(week)) {
        cohortMap.set(week, []);
      }
      cohortMap.get(week)!.push(agent);
    }

    const cohorts = [];
    const now = new Date();

    for (const [cohortWeek, agents] of cohortMap.entries()) {
      const signupCount = agents.length;
      const cohortStartDate = this.getDateFromISOWeek(cohortWeek);

      // Calculate retention for each week since signup (up to 12 weeks)
      const retentionWeeks = [];

      for (let weekOffset = 0; weekOffset <= 12; weekOffset++) {
        const weekStart = new Date(cohortStartDate.getTime() + weekOffset * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Don't calculate future weeks
        if (weekStart > now) break;

        // Count agents active during this week
        let activeCount = 0;
        for (const agent of agents) {
          const hasActivityInWeek = await prisma.activityLog.findFirst({
            where: {
              userId: { in: agent.users.map(u => u.id) },
              createdAt: {
                gte: weekStart,
                lt: weekEnd,
              },
            },
          });
          if (hasActivityInWeek) activeCount++;
        }

        retentionWeeks.push({
          week: weekOffset,
          activeCount,
          retentionRate: (activeCount / signupCount) * 100,
        });
      }

      cohorts.push({
        cohortWeek,
        signupCount,
        retentionWeeks,
      });
    }

    // Sort by cohort week (newest first)
    cohorts.sort((a, b) => b.cohortWeek.localeCompare(a.cohortWeek));

    return { cohorts };
  }

  /**
   * Get feature adoption rates across all beta agents
   *
   * Shows which features are most/least used by beta agents.
   */
  async getFeatureAdoptionRates(): Promise<{
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
  }> {
    const allAgents = await prisma.organization.findMany({
      where: { betaAgentProfile: { isNot: null } },
      include: { users: true },
    });

    const totalBetaAgents = allAgents.length;
    const allUserIds = allAgents.flatMap(a => a.users.map(u => u.id));

    // Get all feature access logs for beta users
    const featureLogs = await prisma.featureAccessLog.findMany({
      where: { userId: { in: allUserIds } },
      select: { featureName: true, userId: true },
    });

    // Group by feature
    const featureMap = new Map<string, { userIds: Set<string>; totalCount: number }>();

    for (const log of featureLogs) {
      if (!featureMap.has(log.featureName)) {
        featureMap.set(log.featureName, { userIds: new Set(), totalCount: 0 });
      }
      const feature = featureMap.get(log.featureName)!;
      feature.userIds.add(log.userId);
      feature.totalCount++;
    }

    // Calculate adoption rates
    const features = [];
    for (const [featureName, data] of featureMap.entries()) {
      features.push({
        featureName,
        adoptionCount: data.userIds.size,
        adoptionRate: (data.userIds.size / allUserIds.length) * 100,
        totalUsageCount: data.totalCount,
        avgUsagePerAgent: data.totalCount / totalBetaAgents,
      });
    }

    // Sort by adoption rate (highest first)
    features.sort((a, b) => b.adoptionRate - a.adoptionRate);

    // Calculate summary
    const totalFeaturesUsed = features.reduce((sum, f) => sum + f.adoptionCount, 0);
    const avgFeaturesPerAgent = allUserIds.length > 0 ? totalFeaturesUsed / allUserIds.length : 0;

    return {
      features,
      summary: {
        totalBetaAgents,
        avgFeaturesPerAgent,
        mostPopularFeature: features[0]?.featureName || 'N/A',
        leastPopularFeature: features[features.length - 1]?.featureName || 'N/A',
      },
    };
  }

  /**
   * Predict churn risk for a beta agent
   *
   * Based on declining engagement patterns:
   * - No login in 14+ days: HIGH risk
   * - No login in 7-13 days: MEDIUM risk
   * - Engagement score < 30: MEDIUM risk
   * - Engagement score < 50 AND declining trend: LOW risk
   * - Otherwise: NO risk
   */
  async getChurnRisk(organizationId: string): Promise<{
    riskLevel: 'NO' | 'LOW' | 'MEDIUM' | 'HIGH';
    riskScore: number; // 0-100 (higher = more risk)
    reasons: string[];
    recommendations: string[];
    currentEngagement: number;
    engagementTrend: 'increasing' | 'stable' | 'declining';
  }> {
    const now = new Date();

    // Get current engagement score
    const engagement = await this.calculateEngagementScore(organizationId);
    const currentEngagement = engagement.totalScore;

    // Determine risk based on last login
    let riskScore = 0;
    const reasons: string[] = [];
    const recommendations: string[] = [];

    const lastLoginDaysAgo = engagement.details.lastLoginDaysAgo;

    // === Risk Factor 1: Login Inactivity (40 points) ===
    if (lastLoginDaysAgo >= 30) {
      riskScore += 40;
      reasons.push(`No login in ${lastLoginDaysAgo} days`);
      recommendations.push('Send re-engagement email campaign');
    } else if (lastLoginDaysAgo >= 14) {
      riskScore += 30;
      reasons.push(`No login in ${lastLoginDaysAgo} days`);
      recommendations.push('Send check-in email');
    } else if (lastLoginDaysAgo >= 7) {
      riskScore += 15;
      reasons.push(`Last login was ${lastLoginDaysAgo} days ago`);
      recommendations.push('Send weekly digest email');
    }

    // === Risk Factor 2: Low Engagement Score (30 points) ===
    if (currentEngagement < 30) {
      riskScore += 30;
      reasons.push('Very low engagement score');
      recommendations.push('Schedule 1:1 onboarding call');
    } else if (currentEngagement < 50) {
      riskScore += 15;
      reasons.push('Below-average engagement score');
      recommendations.push('Send feature tutorial emails');
    }

    // === Risk Factor 3: Low Feature Diversity (15 points) ===
    if (engagement.details.uniqueFeaturesUsed < 3) {
      riskScore += 15;
      reasons.push('Using very few features');
      recommendations.push('Highlight unused features that match their use case');
    } else if (engagement.details.uniqueFeaturesUsed < 5) {
      riskScore += 8;
      reasons.push('Limited feature adoption');
    }

    // === Risk Factor 4: No Feedback (15 points) ===
    if (engagement.details.totalFeedback === 0) {
      riskScore += 15;
      reasons.push('Has not submitted any feedback');
      recommendations.push('Encourage feedback submission with incentive');
    }

    // Determine trend (compare with 7 days ago - simplified)
    // In production, you'd calculate engagement at two time points and compare
    const engagementTrend: 'increasing' | 'stable' | 'declining' = currentEngagement >= 60 ? 'stable' : 'declining';

    // Determine risk level
    let riskLevel: 'NO' | 'LOW' | 'MEDIUM' | 'HIGH';
    if (riskScore >= 60) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 40) {
      riskLevel = 'MEDIUM';
    } else if (riskScore >= 20) {
      riskLevel = 'LOW';
    } else {
      riskLevel = 'NO';
    }

    // Add default recommendations
    if (riskLevel === 'NO') {
      recommendations.push('Continue current engagement strategy');
    }

    return {
      riskLevel,
      riskScore,
      reasons,
      recommendations,
      currentEngagement,
      engagementTrend,
    };
  }

  // === Helper Methods ===

  private getISOWeek(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  }

  private getDateFromISOWeek(isoWeek: string): Date {
    const [year, week] = isoWeek.split('-W').map(Number);
    const jan4 = new Date(year, 0, 4);
    const weekStart = new Date(jan4);
    weekStart.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1 + (week - 1) * 7);
    return weekStart;
  }
}

export const betaAnalyticsService = new BetaAnalyticsService();
