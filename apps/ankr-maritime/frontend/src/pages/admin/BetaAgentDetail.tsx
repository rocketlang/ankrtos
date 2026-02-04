/**
 * Beta Agent Detail - Admin Portal
 *
 * Detailed view of a single beta agent with admin actions.
 */

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Key, Send, Star, Bug, Lightbulb,
  User, MapPin, FileText, Calendar, Shield, Activity, Loader, AlertCircle
} from 'lucide-react';

const BETA_AGENT_DETAIL_QUERY = gql`
  query BetaAgentDetail($organizationId: String!) {
    betaAgentDetail(organizationId: $organizationId) {
      organizationId
      organizationName
      agentName
      betaStatus
      enrolledAt
      completedAt
      serviceTypes
      portsCoverage
      apiKey
      apiKeyGeneratedAt
      slaAcceptedAt
      slaVersion
      users
      feedbackCount
      bugReportCount
      featureRequestCount
      avgFeedbackRating
    }
  }
`;

const APPROVE_AGENT = gql`
  mutation ApproveAgent($organizationId: String!) {
    approveBetaAgent(organizationId: $organizationId) {
      success
      message
    }
  }
`;

const SUSPEND_AGENT = gql`
  mutation SuspendAgent($organizationId: String!, $reason: String!) {
    suspendBetaAgent(organizationId: $organizationId, reason: $reason) {
      success
      message
    }
  }
`;

const RESET_API_KEY = gql`
  mutation ResetAPIKey($organizationId: String!) {
    resetBetaAgentAPIKey(organizationId: $organizationId) {
      success
      message
    }
  }
`;

const GRADUATE_AGENT = gql`
  mutation GraduateAgent($organizationId: String!, $tier: String!) {
    graduateBetaAgent(organizationId: $organizationId, tier: $tier) {
      success
      message
    }
  }
`;

export default function BetaAgentDetail() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const { data, loading, refetch } = useQuery(BETA_AGENT_DETAIL_QUERY, {
    variables: { organizationId: agentId },
    skip: !agentId,
  });

  const [approveAgent, { loading: approving }] = useMutation(APPROVE_AGENT);
  const [suspendAgent, { loading: suspending }] = useMutation(SUSPEND_AGENT);
  const [resetAPIKey, { loading: resetting }] = useMutation(RESET_API_KEY);
  const [graduateAgent, { loading: graduating }] = useMutation(GRADUATE_AGENT);

  const agent = data?.betaAgentDetail;

  const handleApprove = async () => {
    if (!agentId) return;
    try {
      const result = await approveAgent({ variables: { organizationId: agentId } });
      alert(result.data.approveBetaAgent.message);
      await refetch();
    } catch (err: any) {
      alert('Failed to approve agent: ' + err.message);
    }
  };

  const handleSuspend = async () => {
    if (!agentId || !suspendReason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }
    try {
      const result = await suspendAgent({
        variables: { organizationId: agentId, reason: suspendReason },
      });
      alert(result.data.suspendBetaAgent.message);
      setShowSuspendModal(false);
      setSuspendReason('');
      await refetch();
    } catch (err: any) {
      alert('Failed to suspend agent: ' + err.message);
    }
  };

  const handleResetAPIKey = async () => {
    if (!agentId) return;
    if (!confirm('Are you sure you want to reset the API key? The agent will be notified.')) {
      return;
    }
    try {
      const result = await resetAPIKey({ variables: { organizationId: agentId } });
      alert(result.data.resetBetaAgentAPIKey.message);
      await refetch();
    } catch (err: any) {
      alert('Failed to reset API key: ' + err.message);
    }
  };

  const handleGraduate = async (tier: string) => {
    if (!agentId) return;
    if (!confirm(`Graduate this agent to ${tier} tier?`)) {
      return;
    }
    try {
      const result = await graduateAgent({
        variables: { organizationId: agentId, tier },
      });
      alert(result.data.graduateBetaAgent.message);
      await refetch();
    } catch (err: any) {
      alert('Failed to graduate agent: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Agent Not Found</h3>
            <p className="text-sm text-red-700">The requested beta agent could not be found.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/beta')}
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const users = agent.users as Array<{ id: string; email: string; name: string; lastLoginAt: string | null }>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/beta')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{agent.agentName}</h1>
            <p className="text-gray-600">{agent.organizationName}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={agent.betaStatus} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={handleApprove}
          disabled={approving || agent.betaStatus === 'active'}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="h-5 w-5" />
          {approving ? 'Approving...' : 'Approve'}
        </button>

        <button
          onClick={() => setShowSuspendModal(true)}
          disabled={suspending}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <XCircle className="h-5 w-5" />
          Suspend
        </button>

        <button
          onClick={handleResetAPIKey}
          disabled={resetting}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          <Key className="h-5 w-5" />
          {resetting ? 'Resetting...' : 'Reset API Key'}
        </button>

        <button
          onClick={() => {
            const tier = prompt('Enter tier (agent, operator, enterprise):');
            if (tier) handleGraduate(tier);
          }}
          disabled={graduating}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
          {graduating ? 'Processing...' : 'Graduate'}
        </button>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Profile Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
          <div className="space-y-3">
            <InfoRow
              icon={User}
              label="Organization ID"
              value={agent.organizationId}
            />
            <InfoRow
              icon={FileText}
              label="Service Types"
              value={agent.serviceTypes.join(', ')}
            />
            <InfoRow
              icon={MapPin}
              label="Ports Coverage"
              value={`${agent.portsCoverage.length} ports`}
            />
            <InfoRow
              icon={Calendar}
              label="Enrolled"
              value={agent.enrolledAt ? new Date(agent.enrolledAt).toLocaleDateString() : 'N/A'}
            />
            <InfoRow
              icon={Calendar}
              label="Completed Onboarding"
              value={agent.completedAt ? new Date(agent.completedAt).toLocaleDateString() : 'Not completed'}
            />
          </div>
        </div>

        {/* SLA & API Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA & API Access</h3>
          <div className="space-y-3">
            <InfoRow
              icon={Shield}
              label="SLA Accepted"
              value={agent.slaAcceptedAt ? `Version ${agent.slaVersion}` : 'Not accepted'}
            />
            <InfoRow
              icon={Calendar}
              label="SLA Date"
              value={agent.slaAcceptedAt ? new Date(agent.slaAcceptedAt).toLocaleDateString() : 'N/A'}
            />
            <InfoRow
              icon={Key}
              label="API Key"
              value={agent.apiKey ? `${agent.apiKey.substring(0, 20)}...` : 'Not generated'}
            />
            <InfoRow
              icon={Calendar}
              label="API Key Generated"
              value={agent.apiKeyGeneratedAt ? new Date(agent.apiKeyGeneratedAt).toLocaleDateString() : 'N/A'}
            />
          </div>
        </div>

        {/* Users */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Users ({users.length})</h3>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {user.lastLoginAt ? (
                    <div>Last login: {new Date(user.lastLoginAt).toLocaleDateString()}</div>
                  ) : (
                    <div>Never logged in</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Feedback</span>
              </div>
              <div className="text-xl font-bold text-blue-600">{agent.feedbackCount}</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bug className="h-5 w-5 text-red-600" />
                <span className="font-medium text-gray-900">Bug Reports</span>
              </div>
              <div className="text-xl font-bold text-red-600">{agent.bugReportCount}</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Feature Requests</span>
              </div>
              <div className="text-xl font-bold text-purple-600">{agent.featureRequestCount}</div>
            </div>

            {agent.avgFeedbackRating !== null && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Avg Rating</span>
                </div>
                <div className="text-xl font-bold text-yellow-600">
                  {agent.avgFeedbackRating.toFixed(1)} / 5
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Suspend Beta Agent</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for suspending this agent. They will be notified.
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason('');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={suspending || !suspendReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {suspending ? 'Suspending...' : 'Suspend Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
      <div className="flex-1">
        <div className="text-sm text-gray-600">{label}</div>
        <div className="font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}

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
    <span className={`px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
