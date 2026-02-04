/**
 * Beta Analytics Dashboard - Admin Portal
 *
 * Comprehensive analytics for beta program including engagement scores,
 * adoption funnel, cohort retention, feature adoption, and churn risk.
 */

import { useQuery, gql } from '@apollo/client';
import {
  TrendingUp, Users, Activity, AlertTriangle, Target, BarChart3,
  Loader, CheckCircle, XCircle, TrendingDown, Lightbulb
} from 'lucide-react';
import { useState } from 'react';

// === GraphQL Queries ===

const ADOPTION_FUNNEL_QUERY = gql`
  query BetaAdoptionFunnel {
    betaAdoptionFunnel {
      stages {
        stage
        count
        percentage
        conversionRate
      }
      summary {
        signupToActive
        avgTimeToOnboarding
        avgTimeToFirstLogin
        avgTimeToFirstAction
      }
    }
  }
`;

const FEATURE_ADOPTION_QUERY = gql`
  query BetaFeatureAdoption {
    betaFeatureAdoption {
      features {
        featureName
        adoptionCount
        adoptionRate
        totalUsageCount
        avgUsagePerAgent
      }
      summary {
        totalBetaAgents
        avgFeaturesPerAgent
        mostPopularFeature
        leastPopularFeature
      }
    }
  }
`;

const COHORT_ANALYSIS_QUERY = gql`
  query BetaCohortAnalysis {
    betaCohortAnalysis {
      cohorts {
        cohortWeek
        signupCount
        retentionWeeks {
          week
          activeCount
          retentionRate
        }
      }
    }
  }
`;

const ENGAGEMENT_SCORE_QUERY = gql`
  query BetaEngagementScore($organizationId: String!) {
    betaEngagementScore(organizationId: $organizationId) {
      totalScore
      breakdown {
        loginFrequency
        featureUsageDiversity
        apiCallVolume
        feedbackSubmissions
      }
      details {
        lastLoginDaysAgo
        uniqueFeaturesUsed
        weeklyApiCalls
        totalFeedback
      }
    }
  }
`;

const CHURN_RISK_QUERY = gql`
  query BetaChurnRisk($organizationId: String!) {
    betaChurnRisk(organizationId: $organizationId) {
      riskLevel
      riskScore
      reasons
      recommendations
      currentEngagement
      engagementTrend
    }
  }
`;

const BETA_AGENTS_QUERY = gql`
  query BetaAgents {
    betaAgents {
      id
      name
      agentName
      betaStatus
    }
  }
`;

export default function BetaAnalytics() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const { data: funnelData, loading: funnelLoading } = useQuery(ADOPTION_FUNNEL_QUERY);
  const { data: featuresData, loading: featuresLoading } = useQuery(FEATURE_ADOPTION_QUERY);
  const { data: cohortData, loading: cohortLoading } = useQuery(COHORT_ANALYSIS_QUERY);
  const { data: agentsData } = useQuery(BETA_AGENTS_QUERY);

  const { data: engagementData, loading: engagementLoading } = useQuery(ENGAGEMENT_SCORE_QUERY, {
    variables: { organizationId: selectedAgent },
    skip: !selectedAgent,
  });

  const { data: churnData, loading: churnLoading } = useQuery(CHURN_RISK_QUERY, {
    variables: { organizationId: selectedAgent },
    skip: !selectedAgent,
  });

  const funnel = funnelData?.betaAdoptionFunnel;
  const features = featuresData?.betaFeatureAdoption;
  const cohorts = cohortData?.betaCohortAnalysis;
  const agents = agentsData?.betaAgents || [];
  const engagement = engagementData?.betaEngagementScore;
  const churn = churnData?.betaChurnRisk;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Beta Program Analytics</h1>
        <p className="text-gray-600">Engagement metrics, adoption funnel, and churn risk analysis</p>
      </div>

      {/* Adoption Funnel */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="h-6 w-6 text-blue-600" />
          Adoption Funnel
        </h2>

        {funnelLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : funnel && (
          <>
            {/* Funnel Visualization */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="space-y-4">
                {funnel.stages.map((stage: any, index: number) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center gap-4">
                      {/* Stage Number */}
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>

                      {/* Progress Bar */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{stage.stage}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                              {stage.count} agents ({stage.percentage.toFixed(1)}%)
                            </span>
                            {stage.conversionRate !== null && (
                              <span className={`text-sm font-medium ${
                                stage.conversionRate >= 70 ? 'text-green-600' :
                                stage.conversionRate >= 50 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {stage.conversionRate.toFixed(1)}% conversion
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all"
                            style={{ width: `${stage.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funnel Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard
                icon={Users}
                label="Signup to Active"
                value={`${funnel.summary.signupToActive.toFixed(1)}%`}
                color="blue"
              />
              <StatsCard
                icon={Activity}
                label="Avg Time to Onboarding"
                value={`${funnel.summary.avgTimeToOnboarding.toFixed(1)}h`}
                color="green"
              />
              <StatsCard
                icon={CheckCircle}
                label="Avg Time to First Login"
                value={`${funnel.summary.avgTimeToFirstLogin.toFixed(1)}h`}
                color="purple"
              />
              <StatsCard
                icon={TrendingUp}
                label="Avg Time to First Action"
                value={`${funnel.summary.avgTimeToFirstAction.toFixed(1)}h`}
                color="yellow"
              />
            </div>
          </>
        )}
      </div>

      {/* Feature Adoption */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-purple-600" />
          Feature Adoption Rates
        </h2>

        {featuresLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : features && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <StatsCard
                icon={Users}
                label="Total Beta Agents"
                value={features.summary.totalBetaAgents}
                color="blue"
              />
              <StatsCard
                icon={BarChart3}
                label="Avg Features Per Agent"
                value={features.summary.avgFeaturesPerAgent.toFixed(1)}
                color="green"
              />
              <StatsCard
                icon={TrendingUp}
                label="Most Popular"
                value={features.summary.mostPopularFeature}
                subtitle="Feature"
                color="purple"
              />
              <StatsCard
                icon={TrendingDown}
                label="Least Popular"
                value={features.summary.leastPopularFeature}
                subtitle="Feature"
                color="red"
              />
            </div>

            {/* Feature List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Feature
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Adoption Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Agents Using
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total Usage
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Avg per Agent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {features.features.slice(0, 20).map((feature: any) => (
                    <tr key={feature.featureName} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {feature.featureName}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                feature.adoptionRate >= 70 ? 'bg-green-600' :
                                feature.adoptionRate >= 40 ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${feature.adoptionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {feature.adoptionRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {feature.adoptionCount}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {feature.totalUsageCount}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {feature.avgUsagePerAgent.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Cohort Retention */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-6 w-6 text-green-600" />
          Cohort Retention Analysis
        </h2>

        {cohortLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : cohorts && cohorts.cohorts.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                    Cohort Week
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Signups
                  </th>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(week => (
                    <th key={week} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      W{week}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cohorts.cohorts.map((cohort: any) => (
                  <tr key={cohort.cohortWeek} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                      {cohort.cohortWeek}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {cohort.signupCount}
                    </td>
                    {cohort.retentionWeeks.map((week: any) => (
                      <td key={week.week} className="px-4 py-4 text-center">
                        <div
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            week.retentionRate >= 80 ? 'bg-green-100 text-green-700' :
                            week.retentionRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            week.retentionRate >= 40 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}
                        >
                          {week.retentionRate.toFixed(0)}%
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Cohort Data Yet</h3>
            <p className="text-gray-600">Cohort data will appear as beta agents sign up</p>
          </div>
        )}
      </div>

      {/* Individual Agent Analysis */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
          Individual Agent Analysis
        </h2>

        {/* Agent Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Agent to Analyze
          </label>
          <select
            value={selectedAgent || ''}
            onChange={(e) => setSelectedAgent(e.target.value || null)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Select an agent --</option>
            {agents.map((agent: any) => (
              <option key={agent.id} value={agent.id}>
                {agent.agentName} ({agent.name})
              </option>
            ))}
          </select>
        </div>

        {selectedAgent && (
          <>
            {/* Engagement Score */}
            {engagementLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : engagement && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Engagement Score Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Score</h3>
                  <div className="text-center mb-6">
                    <div className={`text-6xl font-bold ${
                      engagement.totalScore >= 70 ? 'text-green-600' :
                      engagement.totalScore >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {engagement.totalScore}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">out of 100</div>
                  </div>
                  <div className="space-y-3">
                    <ScoreBreakdownBar
                      label="Login Frequency"
                      value={engagement.breakdown.loginFrequency}
                      max={30}
                    />
                    <ScoreBreakdownBar
                      label="Feature Usage"
                      value={engagement.breakdown.featureUsageDiversity}
                      max={30}
                    />
                    <ScoreBreakdownBar
                      label="API Calls"
                      value={engagement.breakdown.apiCallVolume}
                      max={20}
                    />
                    <ScoreBreakdownBar
                      label="Feedback"
                      value={engagement.breakdown.feedbackSubmissions}
                      max={20}
                    />
                  </div>
                </div>

                {/* Engagement Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Details</h3>
                  <div className="space-y-4">
                    <DetailRow
                      label="Last Login"
                      value={`${engagement.details.lastLoginDaysAgo} days ago`}
                      alert={engagement.details.lastLoginDaysAgo > 7}
                    />
                    <DetailRow
                      label="Features Used"
                      value={engagement.details.uniqueFeaturesUsed}
                      alert={engagement.details.uniqueFeaturesUsed < 3}
                    />
                    <DetailRow
                      label="Weekly API Calls"
                      value={engagement.details.weeklyApiCalls}
                      alert={engagement.details.weeklyApiCalls < 10}
                    />
                    <DetailRow
                      label="Feedback Submissions"
                      value={engagement.details.totalFeedback}
                      alert={engagement.details.totalFeedback === 0}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Churn Risk */}
            {churnLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : churn && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Churn Risk Assessment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Risk Level */}
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Risk Level</div>
                    <div className={`text-3xl font-bold ${
                      churn.riskLevel === 'NO' ? 'text-green-600' :
                      churn.riskLevel === 'LOW' ? 'text-yellow-600' :
                      churn.riskLevel === 'MEDIUM' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {churn.riskLevel}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Risk Score: {churn.riskScore}/100
                    </div>
                  </div>

                  {/* Reasons */}
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Risk Factors</div>
                    <ul className="space-y-1">
                      {churn.reasons.map((reason: string, i: number) => (
                        <li key={i} className="text-sm text-gray-900 flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Recommendations</div>
                    <ul className="space-y-1">
                      {churn.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="text-sm text-gray-900 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// === Helper Components ===

interface StatsCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
}

function StatsCard({ icon: Icon, label, value, subtitle, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function ScoreBreakdownBar({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = (value / max) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value}/{max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${alert ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
        {alert && <AlertTriangle className="h-4 w-4 inline ml-1" />}
      </span>
    </div>
  );
}
