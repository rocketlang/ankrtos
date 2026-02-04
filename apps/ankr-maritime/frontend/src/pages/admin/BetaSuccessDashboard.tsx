/**
 * Beta Success Dashboard
 *
 * Program health monitoring, engagement leaderboard, graduation pipeline,
 * ROI tracking, and success stories showcase.
 */

import { useQuery, gql } from '@apollo/client';
import {
  TrendingUp, Award, Users, DollarSign, AlertTriangle, CheckCircle,
  Trophy, Target, Zap, Loader, ArrowUp, ArrowDown, Minus, Star, Crown
} from 'lucide-react';

// === GraphQL Queries ===

const PROGRAM_HEALTH_QUERY = gql`
  query BetaProgramHealth {
    betaProgramHealth {
      overallHealth
      healthScore
      metrics {
        enrollmentRate
        activationRate
        retentionRate
        satisfactionScore
        graduationRate
        churnRate
      }
      trends {
        enrollmentTrend
        activationTrend
        retentionTrend
      }
      alerts {
        severity
        metric
        message
        recommendation
      }
    }
  }
`;

const LEADERBOARD_QUERY = gql`
  query BetaEngagementLeaderboard($limit: Int) {
    betaEngagementLeaderboard(limit: $limit) {
      organizationId
      agentName
      engagementScore
      rank
      metrics {
        loginDays
        featuresUsed
        apiCalls
        feedbackSubmitted
        articlesCompleted
      }
      badges
    }
  }
`;

const GRADUATION_PIPELINE_QUERY = gql`
  query BetaGraduationPipeline {
    betaGraduationPipeline {
      stages {
        stage
        count
        percentage
        avgDaysInStage
      }
      readyToGraduate {
        organizationId
        agentName
        engagementScore
        daysInBeta
        recommendedTier
        readinessScore
      }
    }
  }
`;

const ROI_QUERY = gql`
  query BetaProgramROI {
    betaProgramROI {
      totalInvestment
      totalRevenue
      roi
      breakdown {
        developmentCost
        supportCost
        marketingCost
        graduatedRevenue
        projectedRevenue
      }
      paybackPeriod
    }
  }
`;

const SUCCESS_STORIES_QUERY = gql`
  query BetaSuccessStories {
    betaSuccessStories {
      organizationId
      agentName
      story
      metrics {
        daysInBeta
        engagementScore
        graduatedTier
        testimonial
      }
      highlights
    }
  }
`;

export default function BetaSuccessDashboard() {
  const { data: healthData, loading: healthLoading } = useQuery(PROGRAM_HEALTH_QUERY);
  const { data: leaderboardData, loading: leaderboardLoading } = useQuery(LEADERBOARD_QUERY, {
    variables: { limit: 10 },
  });
  const { data: pipelineData, loading: pipelineLoading } = useQuery(GRADUATION_PIPELINE_QUERY);
  const { data: roiData, loading: roiLoading } = useQuery(ROI_QUERY);
  const { data: storiesData, loading: storiesLoading } = useQuery(SUCCESS_STORIES_QUERY);

  const health = healthData?.betaProgramHealth;
  const leaderboard = leaderboardData?.betaEngagementLeaderboard || [];
  const pipeline = pipelineData?.betaGraduationPipeline;
  const roi = roiData?.betaProgramROI;
  const stories = storiesData?.betaSuccessStories || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-600" />
          Beta Program Success Dashboard
        </h1>
        <p className="text-gray-600">Monitor program health and track success metrics</p>
      </div>

      {/* Program Health */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="h-6 w-6 text-green-600" />
          Program Health
        </h2>

        {healthLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : health && (
          <>
            {/* Overall Health Score */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Overall Health</div>
                  <div className={`text-4xl font-bold ${
                    health.overallHealth === 'excellent' ? 'text-green-600' :
                    health.overallHealth === 'good' ? 'text-blue-600' :
                    health.overallHealth === 'fair' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {health.overallHealth.toUpperCase()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-6xl font-bold text-gray-900">{health.healthScore}</div>
                  <div className="text-sm text-gray-600">/ 100</div>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <MetricCard
                label="Enrollment Rate"
                value={`${health.metrics.enrollmentRate.toFixed(1)}%`}
                trend={health.trends.enrollmentTrend}
                color="blue"
              />
              <MetricCard
                label="Activation Rate"
                value={`${health.metrics.activationRate.toFixed(1)}%`}
                trend={health.trends.activationTrend}
                color="green"
              />
              <MetricCard
                label="Retention Rate"
                value={`${health.metrics.retentionRate.toFixed(1)}%`}
                trend={health.trends.retentionTrend}
                color="purple"
              />
              <MetricCard
                label="Satisfaction"
                value={`${health.metrics.satisfactionScore.toFixed(1)}/100`}
                color="yellow"
              />
              <MetricCard
                label="Graduation Rate"
                value={`${health.metrics.graduationRate.toFixed(1)}%`}
                color="indigo"
              />
              <MetricCard
                label="Churn Rate"
                value={`${health.metrics.churnRate.toFixed(1)}%`}
                color="red"
              />
            </div>

            {/* Alerts */}
            {health.alerts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Alerts & Recommendations</h3>
                {health.alerts.map((alert: any, index: number) => (
                  <AlertCard key={index} alert={alert} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ROI */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          Return on Investment
        </h2>

        {roiLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : roi && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Investment</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${roi.totalInvestment.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-green-600">
                  ${roi.totalRevenue.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">ROI</div>
                <div className={`text-2xl font-bold ${roi.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {roi.roi >= 0 ? '+' : ''}{roi.roi.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Payback Period</div>
                <div className="text-2xl font-bold text-gray-900">
                  {roi.paybackPeriod} months
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Development:</span>
                  <span className="ml-2 font-medium">${roi.breakdown.developmentCost.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Support:</span>
                  <span className="ml-2 font-medium">${roi.breakdown.supportCost.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Marketing:</span>
                  <span className="ml-2 font-medium">${roi.breakdown.marketingCost.toLocaleString()}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <span className="text-gray-600">Graduated Revenue:</span>
                  <span className="ml-2 font-medium text-green-600">${roi.breakdown.graduatedRevenue.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Projected Revenue:</span>
                  <span className="ml-2 font-medium text-blue-600">${roi.breakdown.projectedRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Graduation Pipeline */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          Graduation Pipeline
        </h2>

        {pipelineLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : pipeline && (
          <>
            {/* Pipeline Stages */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="space-y-4">
                {pipeline.stages.map((stage: any, index: number) => (
                  <div key={stage.stage} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{stage.stage}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            {stage.count} agents ({stage.percentage.toFixed(1)}%)
                          </span>
                          <span className="text-sm text-gray-500">
                            Avg: {stage.avgDaysInStage.toFixed(0)} days
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full"
                          style={{ width: `${stage.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ready to Graduate */}
            {pipeline.readyToGraduate.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  Ready to Graduate ({pipeline.readyToGraduate.length})
                </h3>
                <div className="space-y-3">
                  {pipeline.readyToGraduate.slice(0, 5).map((agent: any) => (
                    <div key={agent.organizationId} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{agent.agentName}</div>
                        <div className="text-sm text-gray-600">
                          {agent.daysInBeta} days in beta • Engagement: {agent.engagementScore}/100
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          {agent.recommendedTier}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {agent.readinessScore}% ready
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Engagement Leaderboard */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="h-6 w-6 text-purple-600" />
          Engagement Leaderboard
        </h2>

        {leaderboardLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badges</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboard.map((entry: any) => (
                  <tr key={entry.organizationId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {entry.rank <= 3 && (
                          <Trophy className={`h-5 w-5 ${
                            entry.rank === 1 ? 'text-yellow-500' :
                            entry.rank === 2 ? 'text-gray-400' :
                            'text-amber-600'
                          }`} />
                        )}
                        <span className="font-bold text-gray-900">#{entry.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{entry.agentName}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-2xl font-bold text-blue-600">{entry.engagementScore}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {entry.badges.map((badge: string, idx: number) => (
                          <span key={idx} className="text-xs">{badge}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      <div>{entry.metrics.loginDays}d login</div>
                      <div>{entry.metrics.feedbackSubmitted} feedback</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Success Stories */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-600" />
          Success Stories
        </h2>

        {storiesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : stories.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Success Stories Yet</h3>
            <p className="text-gray-600">Stories will appear as agents graduate to paid tiers</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stories.map((story: any) => (
              <SuccessStoryCard key={story.organizationId} story={story} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// === Helper Components ===

function MetricCard({ label, value, trend, color }: {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">{label}</div>
        {trend && (
          <div className="flex items-center gap-1">
            {trend === 'up' && <ArrowUp className="h-4 w-4 text-green-600" />}
            {trend === 'down' && <ArrowDown className="h-4 w-4 text-red-600" />}
            {trend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
          </div>
        )}
      </div>
      <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
    </div>
  );
}

function AlertCard({ alert }: { alert: any }) {
  const severityConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconColor: 'text-red-600' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle, iconColor: 'text-yellow-600' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: CheckCircle, iconColor: 'text-blue-600' },
  };

  const config = severityConfig[alert.severity as keyof typeof severityConfig];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">{alert.metric}</span>
            <span className="px-2 py-0.5 bg-white rounded text-xs font-medium uppercase">
              {alert.severity}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Recommendation:</span> {alert.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

function SuccessStoryCard({ story }: { story: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start gap-3 mb-4">
        <Star className="h-6 w-6 text-yellow-600 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-gray-900 mb-1">{story.agentName}</h3>
          <p className="text-sm text-gray-600">{story.story}</p>
        </div>
      </div>

      {story.metrics.testimonial && (
        <div className="bg-gray-50 border-l-4 border-blue-600 p-3 mb-4 italic text-sm text-gray-700">
          "{story.metrics.testimonial}"
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {story.highlights.map((highlight: string, idx: number) => (
          <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
            ✓ {highlight}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-600">Days in Beta</div>
          <div className="font-bold text-gray-900">{story.metrics.daysInBeta}</div>
        </div>
        <div>
          <div className="text-gray-600">Engagement</div>
          <div className="font-bold text-gray-900">{story.metrics.engagementScore}/100</div>
        </div>
        <div>
          <div className="text-gray-600">Tier</div>
          <div className="font-bold text-gray-900 capitalize">{story.metrics.graduatedTier}</div>
        </div>
      </div>
    </div>
  );
}
