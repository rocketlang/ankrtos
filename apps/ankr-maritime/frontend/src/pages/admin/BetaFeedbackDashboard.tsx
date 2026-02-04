/**
 * Beta Feedback Dashboard - Admin Portal
 *
 * Comprehensive view of all beta feedback, bug reports, and feature requests.
 * Allows admins to view, filter, resolve bugs, and update feature statuses.
 */

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Star, Bug, Lightbulb, Filter, Calendar, TrendingUp, CheckCircle,
  XCircle, Loader, AlertCircle, User, FileText, ThumbsUp, Download
} from 'lucide-react';

// === GraphQL Queries ===

const BETA_FEEDBACK_QUERY = gql`
  query BetaFeedback($filters: BetaFeedbackFiltersInput) {
    betaFeedback(filters: $filters) {
      id
      rating
      category
      feedback
      screenshot
      url
      browser
      createdAt
      userId
      organizationId
    }
  }
`;

const BUG_REPORTS_QUERY = gql`
  query BugReports($filters: BugReportFiltersInput) {
    bugReports(filters: $filters) {
      id
      title
      description
      severity
      stepsToReproduce
      screenshot
      url
      browser
      status
      resolvedAt
      resolvedBy
      resolution
      createdAt
      userId
      organizationId
    }
  }
`;

const FEATURE_REQUESTS_QUERY = gql`
  query FeatureRequests($filters: FeatureRequestFiltersInput) {
    featureRequests(filters: $filters) {
      id
      title
      description
      priority
      votes
      status
      completedAt
      createdAt
      userId
      organizationId
    }
  }
`;

const BETA_FEEDBACK_STATS_QUERY = gql`
  query BetaFeedbackStats {
    betaFeedbackStats {
      totalFeedback
      averageRating
      categoryBreakdown
      ratingDistribution
    }
  }
`;

// === Mutations ===

const RESOLVE_BUG = gql`
  mutation ResolveBugReport($bugId: String!, $resolution: String!) {
    resolveBugReport(bugId: $bugId, resolution: $resolution) {
      id
      status
      resolvedAt
      resolution
    }
  }
`;

const UPDATE_FEATURE_STATUS = gql`
  mutation UpdateFeatureRequestStatus($requestId: String!, $status: String!) {
    updateFeatureRequestStatus(requestId: $requestId, status: $status) {
      id
      status
      completedAt
    }
  }
`;

export default function BetaFeedbackDashboard() {
  const [activeTab, setActiveTab] = useState<'feedback' | 'bugs' | 'features'>('feedback');
  const [feedbackFilter, setFeedbackFilter] = useState<{ category?: string; minRating?: number }>({});
  const [bugFilter, setBugFilter] = useState<{ severity?: string; status?: string }>({});
  const [featureFilter, setFeatureFilter] = useState<{ status?: string; minVotes?: number }>({});

  const { data: statsData, loading: statsLoading } = useQuery(BETA_FEEDBACK_STATS_QUERY);
  const { data: feedbackData, loading: feedbackLoading, refetch: refetchFeedback } = useQuery(BETA_FEEDBACK_QUERY, {
    variables: { filters: feedbackFilter },
  });
  const { data: bugsData, loading: bugsLoading, refetch: refetchBugs } = useQuery(BUG_REPORTS_QUERY, {
    variables: { filters: bugFilter },
  });
  const { data: featuresData, loading: featuresLoading, refetch: refetchFeatures } = useQuery(FEATURE_REQUESTS_QUERY, {
    variables: { filters: featureFilter },
  });

  const [resolveBug, { loading: resolvingBug }] = useMutation(RESOLVE_BUG);
  const [updateFeatureStatus, { loading: updatingFeature }] = useMutation(UPDATE_FEATURE_STATUS);

  const stats = statsData?.betaFeedbackStats;
  const feedback = feedbackData?.betaFeedback || [];
  const bugs = bugsData?.bugReports || [];
  const features = featuresData?.featureRequests || [];

  const handleResolveBug = async (bugId: string) => {
    const resolution = prompt('Enter resolution notes:');
    if (!resolution) return;

    try {
      await resolveBug({ variables: { bugId, resolution } });
      alert('Bug marked as resolved');
      await refetchBugs();
    } catch (err: any) {
      alert('Failed to resolve bug: ' + err.message);
    }
  };

  const handleUpdateFeatureStatus = async (requestId: string, currentStatus: string) => {
    const statuses = ['submitted', 'reviewing', 'planned', 'in_progress', 'completed', 'rejected'];
    const newStatus = prompt(
      `Update status from "${currentStatus}" to:\n${statuses.join(', ')}`,
      currentStatus
    );
    if (!newStatus || !statuses.includes(newStatus)) return;

    try {
      await updateFeatureStatus({ variables: { requestId, status: newStatus } });
      alert('Feature status updated');
      await refetchFeatures();
    } catch (err: any) {
      alert('Failed to update feature: ' + err.message);
    }
  };

  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'feedback') {
      csvContent = 'Date,Rating,Category,Feedback,URL,Browser\n';
      feedback.forEach((f: any) => {
        csvContent += `${new Date(f.createdAt).toLocaleDateString()},${f.rating},${f.category},"${f.feedback}",${f.url},${f.browser}\n`;
      });
      filename = 'beta-feedback.csv';
    } else if (activeTab === 'bugs') {
      csvContent = 'Date,Title,Severity,Status,Description,URL\n';
      bugs.forEach((b: any) => {
        csvContent += `${new Date(b.createdAt).toLocaleDateString()},"${b.title}",${b.severity},${b.status},"${b.description}",${b.url}\n`;
      });
      filename = 'bug-reports.csv';
    } else {
      csvContent = 'Date,Title,Priority,Votes,Status,Description\n';
      features.forEach((f: any) => {
        csvContent += `${new Date(f.createdAt).toLocaleDateString()},"${f.title}",${f.priority || 'N/A'},${f.votes},${f.status},"${f.description}"\n`;
      });
      filename = 'feature-requests.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Beta Feedback & Reports</h1>
        <p className="text-gray-600">View and manage all feedback, bug reports, and feature requests</p>
      </div>

      {/* Stats Overview */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={Star}
            label="Total Feedback"
            value={stats.totalFeedback}
            subtitle={`Avg: ${stats.averageRating.toFixed(1)} / 5`}
            color="blue"
          />
          <StatsCard
            icon={Bug}
            label="Bug Reports"
            value={bugs.length}
            subtitle={`${bugs.filter((b: any) => b.severity === 'CRITICAL' && b.status !== 'resolved').length} critical open`}
            color="red"
          />
          <StatsCard
            icon={Lightbulb}
            label="Feature Requests"
            value={features.length}
            subtitle={`${features.filter((f: any) => f.status === 'planned').length} planned`}
            color="purple"
          />
          <StatsCard
            icon={TrendingUp}
            label="Top Category"
            value={stats.categoryBreakdown[0]?.category || 'N/A'}
            subtitle={`${stats.categoryBreakdown[0]?.count || 0} submissions`}
            color="green"
          />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex gap-4">
            <TabButton
              active={activeTab === 'feedback'}
              onClick={() => setActiveTab('feedback')}
              icon={Star}
              label="Feedback"
              count={feedback.length}
            />
            <TabButton
              active={activeTab === 'bugs'}
              onClick={() => setActiveTab('bugs')}
              icon={Bug}
              label="Bug Reports"
              count={bugs.length}
            />
            <TabButton
              active={activeTab === 'features'}
              onClick={() => setActiveTab('features')}
              icon={Lightbulb}
              label="Feature Requests"
              count={features.length}
            />
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={feedbackFilter.category || ''}
                  onChange={(e) => setFeedbackFilter({ ...feedbackFilter, category: e.target.value || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="UI">User Interface</option>
                  <option value="Performance">Performance</option>
                  <option value="Features">Features</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Support">Support</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gray-400" />
                <select
                  value={feedbackFilter.minRating || ''}
                  onChange={(e) => setFeedbackFilter({ ...feedbackFilter, minRating: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                </select>
              </div>
            </div>

            {/* Feedback List */}
            {feedbackLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : feedback.length === 0 ? (
              <div className="text-center py-12">
                <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Yet</h3>
                <p className="text-gray-600">Feedback submissions will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedback.map((item: any) => (
                  <FeedbackCard key={item.id} feedback={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bugs Tab */}
        {activeTab === 'bugs' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <select
                value={bugFilter.severity || ''}
                onChange={(e) => setBugFilter({ ...bugFilter, severity: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={bugFilter.status || ''}
                onChange={(e) => setBugFilter({ ...bugFilter, status: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="investigating">Investigating</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Bug List */}
            {bugsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : bugs.length === 0 ? (
              <div className="text-center py-12">
                <Bug className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Bug Reports</h3>
                <p className="text-gray-600">Bug reports will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bugs.map((bug: any) => (
                  <BugCard key={bug.id} bug={bug} onResolve={handleResolveBug} resolving={resolvingBug} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <select
                value={featureFilter.status || ''}
                onChange={(e) => setFeatureFilter({ ...featureFilter, status: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="reviewing">Reviewing</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={featureFilter.minVotes || ''}
                onChange={(e) => setFeatureFilter({ ...featureFilter, minVotes: e.target.value ? parseInt(e.target.value) : undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Votes</option>
                <option value="10">10+ Votes</option>
                <option value="5">5+ Votes</option>
                <option value="1">1+ Votes</option>
              </select>
            </div>

            {/* Feature List */}
            {featuresLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : features.length === 0 ? (
              <div className="text-center py-12">
                <Lightbulb className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Feature Requests</h3>
                <p className="text-gray-600">Feature requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {features.map((feature: any) => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    onUpdateStatus={handleUpdateFeatureStatus}
                    updating={updatingFeature}
                  />
                ))}
              </div>
            )}
          </div>
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
  color: 'blue' | 'red' | 'purple' | 'green';
}

function StatsCard({ icon: Icon, label, value, subtitle, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
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

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}

function TabButton({ active, onClick, icon: Icon, label, count }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      <span className={`px-2 py-0.5 rounded-full text-xs ${
        active ? 'bg-blue-200' : 'bg-gray-200'
      }`}>
        {count}
      </span>
    </button>
  );
}

function FeedbackCard({ feedback }: { feedback: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {feedback.category}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {new Date(feedback.createdAt).toLocaleDateString()}
        </div>
      </div>

      <p className="text-gray-900 mb-4">{feedback.feedback}</p>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          {feedback.url}
        </div>
        <div className="flex items-center gap-1">
          <User className="h-4 w-4" />
          {feedback.browser}
        </div>
      </div>
    </div>
  );
}

function BugCard({ bug, onResolve, resolving }: { bug: any; onResolve: (id: string) => void; resolving: boolean }) {
  const severityColors = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    LOW: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const statusColors = {
    new: 'bg-gray-100 text-gray-700',
    investigating: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    resolved: 'bg-green-100 text-green-700',
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${severityColors[bug.severity as keyof typeof severityColors] || 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{bug.title}</h3>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-white">
              {bug.severity}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[bug.status as keyof typeof statusColors]}`}>
              {bug.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500 text-right">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(bug.createdAt).toLocaleDateString()}
            </div>
          </div>
          {bug.status !== 'resolved' && (
            <button
              onClick={() => onResolve(bug.id)}
              disabled={resolving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Resolve
            </button>
          )}
        </div>
      </div>

      <p className="text-gray-900 mb-4">{bug.description}</p>

      {bug.stepsToReproduce && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Steps to Reproduce:</div>
          <pre className="bg-gray-50 p-3 rounded text-sm text-gray-800 whitespace-pre-wrap font-mono">
            {bug.stepsToReproduce}
          </pre>
        </div>
      )}

      {bug.resolvedAt && bug.resolution && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm font-medium text-green-700 mb-2">✓ Resolved</div>
          <p className="text-sm text-gray-600">{bug.resolution}</p>
          <div className="text-xs text-gray-500 mt-2">
            Resolved on {new Date(bug.resolvedAt).toLocaleDateString()}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-600 mt-4">
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          {bug.url}
        </div>
        <div className="flex items-center gap-1">
          <User className="h-4 w-4" />
          {bug.browser}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ feature, onUpdateStatus, updating }: { feature: any; onUpdateStatus: (id: string, status: string) => void; updating: boolean }) {
  const priorityColors = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-green-100 text-green-700',
  };

  const statusColors = {
    submitted: 'bg-gray-100 text-gray-700',
    reviewing: 'bg-blue-100 text-blue-700',
    planned: 'bg-purple-100 text-purple-700',
    in_progress: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start gap-4">
        {/* Vote Count */}
        <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg">
          <ThumbsUp className="h-6 w-6 text-purple-600 mb-1" />
          <span className="text-2xl font-bold text-purple-600">{feature.votes}</span>
          <span className="text-xs text-gray-600">votes</span>
        </div>

        {/* Feature Details */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <div className="flex items-center gap-2">
                {feature.priority && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[feature.priority as keyof typeof priorityColors]}`}>
                    {feature.priority}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[feature.status as keyof typeof statusColors]}`}>
                  {feature.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">
                <Calendar className="h-4 w-4 inline mr-1" />
                {new Date(feature.createdAt).toLocaleDateString()}
              </div>
              <button
                onClick={() => onUpdateStatus(feature.id, feature.status)}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
              >
                Update Status
              </button>
            </div>
          </div>

          <p className="text-gray-700">{feature.description}</p>

          {feature.completedAt && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Completed on {new Date(feature.completedAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
