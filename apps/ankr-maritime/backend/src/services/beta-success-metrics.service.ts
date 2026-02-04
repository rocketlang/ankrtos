/**
 * Beta Success Metrics Service
 *
 * Monitors beta program health, calculates ROI, tracks graduation pipeline,
 * generates leaderboards, and identifies success stories.
 */

import { prisma } from '../lib/prisma.js';

export class BetaSuccessMetricsService {
  /**
   * Get comprehensive program health metrics
   */
  async getProgramHealth(): Promise<{
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    healthScore: number; // 0-100
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
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get all beta agents
    const allAgents = await prisma.organization.findMany({
      where: { betaAgentProfile: { isNot: null } },
      include: {
        betaAgentProfile: true,
        users: true,
        betaFeedback: true,
      },
    });

    const totalAgents = allAgents.length;
    const enrolledAgents = allAgents.filter(a => a.betaStatus === 'enrolled' || a.betaStatus === 'active');
    const activeAgents = allAgents.filter(a => a.betaStatus === 'active');
    const churnedAgents = allAgents.filter(a => a.betaStatus === 'churned');

    // Calculate metrics
    const enrollmentRate = totalAgents > 0 ? (enrolledAgents.length / totalAgents) * 100 : 0;

    const completedOnboarding = allAgents.filter(a => a.betaCompletedOnboardingAt !== null);
    const activationRate = enrolledAgents.length > 0
      ? (completedOnboarding.length / enrolledAgents.length) * 100
      : 0;

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentlyActive = allAgents.filter(a => {
      const lastLogin = a.users[0]?.lastLoginAt;
      return lastLogin && lastLogin >= sevenDaysAgo;
    });
    const retentionRate = activeAgents.length > 0
      ? (recentlyActive.length / activeAgents.length) * 100
      : 0;

    // Average satisfaction from feedback
    const allFeedback = allAgents.flatMap(a => a.betaFeedback);
    const satisfactionScore = allFeedback.length > 0
      ? (allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length) * 20 // Convert 1-5 to 0-100
      : 0;

    // Graduation rate (agents who moved to paid)
    const graduatedAgents = allAgents.filter(a =>
      a.betaStatus === 'active' && a.subscriptionTier && a.subscriptionTier !== 'free'
    );
    const graduationRate = activeAgents.length > 0
      ? (graduatedAgents.length / activeAgents.length) * 100
      : 0;

    const churnRate = totalAgents > 0 ? (churnedAgents.length / totalAgents) * 100 : 0;

    // Calculate trends (compare last 30 days vs previous 30 days)
    const recentEnrollments = allAgents.filter(a =>
      a.betaEnrolledAt && a.betaEnrolledAt >= thirtyDaysAgo
    ).length;
    const previousEnrollments = allAgents.filter(a =>
      a.betaEnrolledAt && a.betaEnrolledAt >= sixtyDaysAgo && a.betaEnrolledAt < thirtyDaysAgo
    ).length;
    const enrollmentTrend = recentEnrollments > previousEnrollments ? 'up' :
                           recentEnrollments < previousEnrollments ? 'down' : 'stable';

    const recentActivations = allAgents.filter(a =>
      a.betaCompletedOnboardingAt && a.betaCompletedOnboardingAt >= thirtyDaysAgo
    ).length;
    const previousActivations = allAgents.filter(a =>
      a.betaCompletedOnboardingAt && a.betaCompletedOnboardingAt >= sixtyDaysAgo &&
      a.betaCompletedOnboardingAt < thirtyDaysAgo
    ).length;
    const activationTrend = recentActivations > previousActivations ? 'up' :
                           recentActivations < previousActivations ? 'down' : 'stable';

    const retentionTrend = 'stable'; // Simplified for now

    // Calculate overall health score (weighted average)
    const healthScore = Math.round(
      enrollmentRate * 0.15 +
      activationRate * 0.25 +
      retentionRate * 0.30 +
      satisfactionScore * 0.20 +
      graduationRate * 0.10
    );

    const overallHealth: 'excellent' | 'good' | 'fair' | 'poor' =
      healthScore >= 80 ? 'excellent' :
      healthScore >= 60 ? 'good' :
      healthScore >= 40 ? 'fair' : 'poor';

    // Generate alerts
    const alerts: Array<{
      severity: 'critical' | 'warning' | 'info';
      metric: string;
      message: string;
      recommendation: string;
    }> = [];

    if (churnRate > 20) {
      alerts.push({
        severity: 'critical',
        metric: 'Churn Rate',
        message: `Churn rate is ${churnRate.toFixed(1)}% (above 20% threshold)`,
        recommendation: 'Review exit interviews and implement retention initiatives',
      });
    }

    if (activationRate < 50) {
      alerts.push({
        severity: 'warning',
        metric: 'Activation Rate',
        message: `Only ${activationRate.toFixed(1)}% of agents complete onboarding`,
        recommendation: 'Simplify onboarding flow and add more guidance',
      });
    }

    if (retentionRate < 60) {
      alerts.push({
        severity: 'warning',
        metric: 'Retention Rate',
        message: `7-day retention is ${retentionRate.toFixed(1)}%`,
        recommendation: 'Implement re-engagement campaigns and check-ins',
      });
    }

    if (satisfactionScore < 60) {
      alerts.push({
        severity: 'warning',
        metric: 'Satisfaction',
        message: `Average satisfaction is ${satisfactionScore.toFixed(1)}/100`,
        recommendation: 'Gather detailed feedback and address pain points',
      });
    }

    if (enrollmentTrend === 'down') {
      alerts.push({
        severity: 'info',
        metric: 'Enrollment Trend',
        message: 'Enrollments declining compared to previous period',
        recommendation: 'Review marketing channels and outreach strategy',
      });
    }

    return {
      overallHealth,
      healthScore,
      metrics: {
        enrollmentRate,
        activationRate,
        retentionRate,
        satisfactionScore,
        graduationRate,
        churnRate,
      },
      trends: {
        enrollmentTrend,
        activationTrend,
        retentionTrend,
      },
      alerts,
    };
  }

  /**
   * Get engagement leaderboard
   */
  async getEngagementLeaderboard(limit: number = 10): Promise<Array<{
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
  }>> {
    const allAgents = await prisma.organization.findMany({
      where: { betaAgentProfile: { isNot: null } },
      include: {
        betaAgentProfile: true,
        users: true,
        betaFeedback: true,
        bugReports: true,
        featureRequests: true,
      },
    });

    const leaderboard = [];

    for (const agent of allAgents) {
      // Calculate engagement score (0-100)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Login days (last 30 days)
      const loginDays = 0; // TODO: Calculate from activity logs
      const loginScore = Math.min(loginDays * 3, 30);

      // Features used
      const featuresUsed = 0; // TODO: Calculate from feature access logs
      const featuresScore = Math.min(featuresUsed, 30);

      // API calls
      const apiCalls = 0; // TODO: Calculate from API usage logs
      const apiScore = apiCalls >= 100 ? 20 : Math.floor(apiCalls / 5);

      // Feedback submitted
      const feedbackSubmitted = agent.betaFeedback.length + agent.bugReports.length + agent.featureRequests.length;
      const feedbackScore = Math.min(feedbackSubmitted * 5, 20);

      // Articles completed
      const articlesCompleted = await prisma.articleProgress.count({
        where: {
          userId: { in: agent.users.map(u => u.id) },
          completed: true,
        },
      });
      const articlesScore = Math.min(articlesCompleted * 2, 10);

      const engagementScore = loginScore + featuresScore + apiScore + feedbackScore + articlesScore;

      // Assign badges
      const badges: string[] = [];
      if (engagementScore >= 90) badges.push('🏆 Super User');
      if (feedbackSubmitted >= 10) badges.push('💬 Feedback Champion');
      if (articlesCompleted >= 20) badges.push('📚 Learning Pro');
      if (apiCalls >= 500) badges.push('🔌 API Master');
      if (loginDays >= 25) badges.push('🔥 Daily Active');

      leaderboard.push({
        organizationId: agent.id,
        agentName: agent.betaAgentProfile!.agentName,
        engagementScore,
        rank: 0, // Will be set after sorting
        metrics: {
          loginDays,
          featuresUsed,
          apiCalls,
          feedbackSubmitted,
          articlesCompleted,
        },
        badges,
      });
    }

    // Sort by engagement score and assign ranks
    leaderboard.sort((a, b) => b.engagementScore - a.engagementScore);
    leaderboard.forEach((item, index) => {
      item.rank = index + 1;
    });

    return leaderboard.slice(0, limit);
  }

  /**
   * Get graduation pipeline
   */
  async getGraduationPipeline(): Promise<{
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
  }> {
    const allAgents = await prisma.organization.findMany({
      where: { betaAgentProfile: { isNot: null } },
      include: {
        betaAgentProfile: true,
        users: true,
      },
    });

    const now = new Date();

    // Define pipeline stages
    const stages = [
      { stage: 'Enrolled', count: 0, totalDays: 0 },
      { stage: 'Onboarding', count: 0, totalDays: 0 },
      { stage: 'Active', count: 0, totalDays: 0 },
      { stage: 'Engaged', count: 0, totalDays: 0 },
      { stage: 'Ready to Graduate', count: 0, totalDays: 0 },
      { stage: 'Graduated', count: 0, totalDays: 0 },
    ];

    const readyToGraduate = [];

    for (const agent of allAgents) {
      const enrolledDate = agent.betaEnrolledAt || agent.createdAt;
      const daysInBeta = Math.floor((now.getTime() - enrolledDate.getTime()) / (24 * 60 * 60 * 1000));

      let stageIndex = 0;

      if (agent.betaStatus === 'churned') {
        continue; // Skip churned agents
      }

      if (!agent.betaEnrolledAt) {
        stageIndex = 0; // Enrolled
      } else if (!agent.betaCompletedOnboardingAt) {
        stageIndex = 1; // Onboarding
      } else if (agent.betaStatus === 'active') {
        // Determine if engaged or ready to graduate based on metrics
        const lastLogin = agent.users[0]?.lastLoginAt;
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const isRecentlyActive = lastLogin && lastLogin >= sevenDaysAgo;

        if (isRecentlyActive && daysInBeta >= 30) {
          // Check if ready to graduate (high engagement + long enough in beta)
          const engagementScore = 75; // TODO: Calculate actual score
          if (engagementScore >= 70) {
            stageIndex = 4; // Ready to Graduate

            // Recommend tier based on usage
            const recommendedTier: 'agent' | 'operator' | 'enterprise' =
              engagementScore >= 85 ? 'enterprise' :
              engagementScore >= 75 ? 'operator' : 'agent';

            readyToGraduate.push({
              organizationId: agent.id,
              agentName: agent.betaAgentProfile!.agentName,
              engagementScore,
              daysInBeta,
              recommendedTier,
              readinessScore: engagementScore,
            });
          } else {
            stageIndex = 3; // Engaged
          }
        } else {
          stageIndex = 2; // Active but not engaged
        }
      } else if (agent.subscriptionTier && agent.subscriptionTier !== 'free') {
        stageIndex = 5; // Graduated
      }

      stages[stageIndex].count++;
      stages[stageIndex].totalDays += daysInBeta;
    }

    const totalAgents = stages.reduce((sum, s) => sum + s.count, 0);

    return {
      stages: stages.map(s => ({
        stage: s.stage,
        count: s.count,
        percentage: totalAgents > 0 ? (s.count / totalAgents) * 100 : 0,
        avgDaysInStage: s.count > 0 ? s.totalDays / s.count : 0,
      })),
      readyToGraduate: readyToGraduate.sort((a, b) => b.readinessScore - a.readinessScore),
    };
  }

  /**
   * Calculate program ROI
   */
  async calculateROI(): Promise<{
    totalInvestment: number;
    totalRevenue: number;
    roi: number; // percentage
    breakdown: {
      developmentCost: number;
      supportCost: number;
      marketingCost: number;
      graduatedRevenue: number;
      projectedRevenue: number;
    };
    paybackPeriod: number; // months
  }> {
    // Estimated costs (would come from actual data)
    const developmentCost = 50000; // Platform development
    const supportCost = 10000; // Support team (3 months)
    const marketingCost = 5000; // Outreach and campaigns

    const totalInvestment = developmentCost + supportCost + marketingCost;

    // Calculate revenue from graduated agents
    const graduatedAgents = await prisma.organization.count({
      where: {
        betaAgentProfile: { isNot: null },
        subscriptionTier: { in: ['agent', 'operator', 'enterprise'] },
      },
    });

    // Pricing tiers (annual)
    const tierRevenue = {
      agent: 1200, // $100/month
      operator: 2400, // $200/month
      enterprise: 4800, // $400/month
    };

    // Estimate mix (50% agent, 30% operator, 20% enterprise)
    const avgRevenuePerAgent =
      tierRevenue.agent * 0.5 +
      tierRevenue.operator * 0.3 +
      tierRevenue.enterprise * 0.2;

    const graduatedRevenue = graduatedAgents * avgRevenuePerAgent;

    // Project revenue from ready-to-graduate agents (assume 50% conversion)
    const readyToGraduate = (await this.getGraduationPipeline()).readyToGraduate.length;
    const projectedRevenue = readyToGraduate * avgRevenuePerAgent * 0.5;

    const totalRevenue = graduatedRevenue + projectedRevenue;

    const roi = totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0;

    // Calculate payback period in months
    const monthlyRevenue = graduatedRevenue / 12;
    const paybackPeriod = monthlyRevenue > 0 ? totalInvestment / monthlyRevenue : 999;

    return {
      totalInvestment,
      totalRevenue,
      roi,
      breakdown: {
        developmentCost,
        supportCost,
        marketingCost,
        graduatedRevenue,
        projectedRevenue,
      },
      paybackPeriod: Math.ceil(paybackPeriod),
    };
  }

  /**
   * Get success stories
   */
  async getSuccessStories(): Promise<Array<{
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
  }>> {
    const successfulAgents = await prisma.organization.findMany({
      where: {
        betaAgentProfile: { isNot: null },
        subscriptionTier: { in: ['agent', 'operator', 'enterprise'] },
        betaStatus: 'active',
      },
      include: {
        betaAgentProfile: true,
        users: true,
        betaFeedback: true,
      },
      take: 5,
      orderBy: {
        betaCompletedOnboardingAt: 'asc',
      },
    });

    return successfulAgents.map(agent => {
      const enrolledDate = agent.betaEnrolledAt || agent.createdAt;
      const daysInBeta = Math.floor((Date.now() - enrolledDate.getTime()) / (24 * 60 * 60 * 1000));

      // Find positive testimonial
      const positiveReview = agent.betaFeedback.find(f => f.rating >= 4);

      const highlights = [];
      if (daysInBeta <= 30) highlights.push('Quick adopter - graduated in <30 days');
      if (agent.subscriptionTier === 'enterprise') highlights.push('Enterprise tier customer');
      if (agent.betaFeedback.length >= 5) highlights.push('Active feedback contributor');
      if (positiveReview) highlights.push(`Rated ${positiveReview.rating}/5 stars`);

      return {
        organizationId: agent.id,
        agentName: agent.betaAgentProfile!.agentName,
        story: `${agent.betaAgentProfile!.agentName} joined the beta program ${daysInBeta} days ago and has since graduated to the ${agent.subscriptionTier} tier.`,
        metrics: {
          daysInBeta,
          engagementScore: 85, // TODO: Calculate actual
          graduatedTier: agent.subscriptionTier || 'free',
          testimonial: positiveReview?.feedback,
        },
        highlights,
      };
    });
  }
}

export const betaSuccessMetricsService = new BetaSuccessMetricsService();
