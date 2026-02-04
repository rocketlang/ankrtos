/**
 * Beta Dashboard - Admin Portal
 *
 * Central dashboard for managing all beta agents.
 * Shows overview stats, agent list, and quick actions.
 */

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  Users, CheckCircle, AlertCircle, TrendingUp, Star, Bug,
  Lightbulb, Loader, Search, Filter, Calendar, Activity
} from 'lucide-react';

const BETA_STATS_QUERY = gql`
  query BetaStats {
    betaAgentStats {
      totalAgents
      enrolledAgents
      activeAgents
      churnedAgents
      avgOnboardingProgress
      onboardingCompletionRate
      totalFeedback
      totalBugs
      totalFeatureRequests
      avgSatisfactionRating
      criticalBugsOpen
    }
  }
`;

const BETA_AGENTS_QUERY = gql`
  query BetaAgents($filters: BetaAgentFiltersInput) {
    betaAgents(filters: $filters) {
      id
      name
      agentName
      betaStatus
      enrolledAt
      completedAt
      onboardingProgress
      lastLoginAt
      feedbackCount
      bugReportCount
      featureRequestCount
    }
  }
`;

export default function BetaDashboard() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: statsData, loading: statsLoading } = useQuery(BETA_STATS_QUERY);
  const { data: agentsData, loading: agentsLoading } = useQuery(BETA_AGENTS_QUERY, {
    variables: {
      filters: statusFilter !== 'all' ? { betaStatus: statusFilter } : {},
    },
  });

  const stats = statsData?.betaAgentStats;
  const agents = agentsData?.betaAgents || [];

  // Filter agents by search query
  const filteredAgents = agents.filter((agent: any) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.agentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Beta Program Management</h1>
        <p className="text-gray-600">Manage beta agents, view feedback, and track program health</p>
      </div>

      {/* Stats Overview */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : stats && (
        <>
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              icon={Users}
              label="Total Beta Agents"
              value={stats.totalAgents}
              color="blue"
            />
            <StatsCard
              icon={CheckCircle}
              label="Active Agents"
              value={stats.activeAgents}
              subtitle={`${stats.enrolledAgents} enrolled`}
              color="green"
            />
            <StatsCard
              icon={TrendingUp}
              label="Onboarding Complete"
              value={`${Math.round(stats.onboardingCompletionRate)}%`}
              subtitle={`Avg: ${Math.round(stats.avgOnboardingProgress)}%`}
              color="purple"
            />
            <StatsCard
              icon={Star}
              label="Satisfaction"
              value={stats.avgSatisfactionRating.toFixed(1)}
              subtitle="out of 5 stars"
              color="yellow"
            />
          </div>

          {/* Feedback Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalFeedback}</div>
                  <div className="text-sm text-gray-600">Feedback Submissions</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Bug className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalBugs}</div>
                  <div className="text-sm text-gray-600">
                    Bug Reports
                    {stats.criticalBugsOpen > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                        {stats.criticalBugsOpen} critical open
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalFeatureRequests}</div>
                  <div className="text-sm text-gray-600">Feature Requests</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Agents List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* List Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Beta Agents</h2>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search agents..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="active">Active</option>
                  <option value="churned">Churned</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* List Content */}
        {agentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Beta Agents Found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search' : 'No agents have enrolled yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Onboarding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAgents.map((agent: any) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{agent.agentName}</div>
                        <div className="text-sm text-gray-500">{agent.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={agent.betaStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${agent.onboardingProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {agent.onboardingProgress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {agent.lastLoginAt ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(agent.lastLoginAt).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Star className="h-3 w-3" />
                          {agent.feedbackCount}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Bug className="h-3 w-3" />
                          {agent.bugReportCount}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Lightbulb className="h-3 w-3" />
                          {agent.featureRequestCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/beta/agents/${agent.id}`)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

function StatsCard({ icon: Icon, label, value, subtitle, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
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

// Status Badge Component
function StatusBadge({ status }: { status: string | null }) {
  const statusConfig = {
    not_enrolled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Not Enrolled' },
    invited: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Invited' },
    enrolled: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Enrolled' },
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    churned: { bg: 'bg-red-100', text: 'text-red-700', label: 'Churned' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_enrolled;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
