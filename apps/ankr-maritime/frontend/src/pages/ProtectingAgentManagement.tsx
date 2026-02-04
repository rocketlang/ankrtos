/**
 * Protecting Agent Designation Management
 * Phase 6: DA Desk & Port Agency
 * Business Value: $50K/year commission protection
 */

import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

// ========================================
// GRAPHQL QUERIES & MUTATIONS
// ========================================

const PROTECTING_AGENTS_QUERY = gql`
  query ProtectingAgents($portId: String, $status: String) {
    protectingAgentDesignations(portId: $portId, status: $status) {
      id
      agentId
      portId
      territory
      exclusivityStartDate
      exclusivityEndDate
      commissionRate
      status
      nominatedBy
      approvedBy
      approvedAt
    }
  }
`;

const AGENT_PERFORMANCE = gql`
  query AgentPerformance($agentId: String!) {
    agentPerformance(agentId: $agentId) {
      totalDesignations
      activeDesignations
      totalCommissionEarned
      averageCommissionRate
      portsCovered
    }
  }
`;

const CALCULATE_COMMISSION = gql`
  query CalculateProtectedCommission($portId: String!, $baseAmount: Float!) {
    calculateProtectedCommission(portId: $portId, baseAmount: $baseAmount) {
      protectingAgent
      commissionRate
      baseAmount
      commissionAmount
      isProtected
    }
  }
`;

const DESIGNATE_AGENT = gql`
  mutation DesignateProtectingAgent(
    $agentId: String!
    $portId: String!
    $territory: String
    $exclusivityStartDate: String!
    $exclusivityEndDate: String!
    $commissionRate: Float!
  ) {
    designateProtectingAgent(
      agentId: $agentId
      portId: $portId
      territory: $territory
      exclusivityStartDate: $exclusivityStartDate
      exclusivityEndDate: $exclusivityEndDate
      commissionRate: $commissionRate
    ) {
      id
    }
  }
`;

const APPROVE_DESIGNATION = gql`
  mutation ApproveDesignation($id: ID!) {
    approveProtectingAgentDesignation(id: $id) {
      id
      status
    }
  }
`;

const REVOKE_DESIGNATION = gql`
  mutation RevokeDesignation($id: ID!, $reason: String!) {
    revokeProtectingAgentDesignation(id: $id, reason: $reason) {
      id
      status
    }
  }
`;

// ========================================
// TYPES
// ========================================

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-400',
  active: 'bg-green-900/50 text-green-400',
  expired: 'bg-gray-800 text-gray-400',
  revoked: 'bg-red-900/50 text-red-400',
};

// ========================================
// COMPONENT
// ========================================

export function ProtectingAgentManagement() {
  const [portFilter, setPortFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDesignate, setShowDesignate] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [showRevoke, setShowRevoke] = useState(false);
  const [selectedDesignationId, setSelectedDesignationId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  const [designateForm, setDesignateForm] = useState({
    agentId: '',
    portId: '',
    territory: '',
    exclusivityStartDate: '',
    exclusivityEndDate: '',
    commissionRate: '5.0',
  });

  const { data, loading, refetch } = useQuery(PROTECTING_AGENTS_QUERY, {
    variables: {
      portId: portFilter || undefined,
      status: statusFilter || undefined,
    },
  });

  const { data: performanceData, loading: perfLoading } = useQuery(AGENT_PERFORMANCE, {
    variables: { agentId: selectedAgentId },
    skip: !selectedAgentId,
  });

  const [designateAgent, { loading: designating }] = useMutation(DESIGNATE_AGENT);
  const [approveDesignation] = useMutation(APPROVE_DESIGNATION);
  const [revokeDesignation, { loading: revoking }] = useMutation(REVOKE_DESIGNATION);

  const handleDesignate = async (e: React.FormEvent) => {
    e.preventDefault();
    await designateAgent({
      variables: {
        agentId: designateForm.agentId,
        portId: designateForm.portId,
        territory: designateForm.territory || undefined,
        exclusivityStartDate: designateForm.exclusivityStartDate,
        exclusivityEndDate: designateForm.exclusivityEndDate,
        commissionRate: parseFloat(designateForm.commissionRate),
      },
    });
    setShowDesignate(false);
    setDesignateForm({
      agentId: '',
      portId: '',
      territory: '',
      exclusivityStartDate: '',
      exclusivityEndDate: '',
      commissionRate: '5.0',
    });
    refetch();
  };

  const handleApprove = async (id: string) => {
    await approveDesignation({ variables: { id } });
    refetch();
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    await revokeDesignation({
      variables: {
        id: selectedDesignationId,
        reason: revokeReason,
      },
    });
    setShowRevoke(false);
    setRevokeReason('');
    setSelectedDesignationId('');
    refetch();
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const designations = data?.protectingAgentDesignations || [];
  const performance = performanceData?.agentPerformance;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          Protecting Agent Management
        </h1>
        <p className="text-gray-400">Manage agent designations & commission protection • $50K/year value</p>
      </div>

      {/* Controls */}
      <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">Filter by Port</label>
            <input
              type="text"
              value={portFilter}
              onChange={(e) => setPortFilter(e.target.value)}
              placeholder="Port ID..."
              className={inputClass}
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectClass}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          <div className="flex items-end">
            <button onClick={() => setShowDesignate(true)} className={btnPrimary}>
              + Designate Agent
            </button>
          </div>
        </div>
      </div>

      {/* Designations Table */}
      <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">
          Agent Designations ({designations.length})
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading designations...</div>
        ) : designations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No designations found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-blue-500/30">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-3">Agent ID</th>
                  <th className="pb-3">Port ID</th>
                  <th className="pb-3">Territory</th>
                  <th className="pb-3">Commission Rate</th>
                  <th className="pb-3">Exclusivity Period</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-500/20">
                {designations.map((d: any) => (
                  <tr key={d.id} className="text-white text-sm">
                    <td className="py-4">
                      <button
                        onClick={() => {
                          setSelectedAgentId(d.agentId);
                          setShowPerformance(true);
                        }}
                        className="text-blue-400 hover:underline"
                      >
                        {d.agentId.substring(0, 8)}...
                      </button>
                    </td>
                    <td className="py-4">{d.portId}</td>
                    <td className="py-4">{d.territory || '-'}</td>
                    <td className="py-4 font-semibold text-green-400">{d.commissionRate}%</td>
                    <td className="py-4">
                      <div className="text-xs">
                        <div>{new Date(d.exclusivityStartDate).toLocaleDateString()}</div>
                        <div className="text-gray-400">
                          to {new Date(d.exclusivityEndDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs ${statusColors[d.status]}`}>
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        {d.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(d.id)}
                            className="text-green-400 hover:text-green-300 text-xs"
                          >
                            ✓ Approve
                          </button>
                        )}
                        {d.status === 'active' && (
                          <button
                            onClick={() => {
                              setSelectedDesignationId(d.id);
                              setShowRevoke(true);
                            }}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            ✕ Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Designate Agent Modal */}
      <Modal open={showDesignate} onClose={() => setShowDesignate(false)} title="Designate Protecting Agent">
        <form onSubmit={handleDesignate} className="space-y-4">
          <FormField label="Agent ID">
            <input
              type="text"
              value={designateForm.agentId}
              onChange={(e) => setDesignateForm({ ...designateForm, agentId: e.target.value })}
              className={inputClass}
              required
            />
          </FormField>

          <FormField label="Port ID">
            <input
              type="text"
              value={designateForm.portId}
              onChange={(e) => setDesignateForm({ ...designateForm, portId: e.target.value })}
              className={inputClass}
              required
            />
          </FormField>

          <FormField label="Territory (optional)">
            <input
              type="text"
              value={designateForm.territory}
              onChange={(e) => setDesignateForm({ ...designateForm, territory: e.target.value })}
              placeholder="e.g., Mediterranean, North Sea, etc."
              className={inputClass}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date">
              <input
                type="date"
                value={designateForm.exclusivityStartDate}
                onChange={(e) => setDesignateForm({ ...designateForm, exclusivityStartDate: e.target.value })}
                className={inputClass}
                required
              />
            </FormField>

            <FormField label="End Date">
              <input
                type="date"
                value={designateForm.exclusivityEndDate}
                onChange={(e) => setDesignateForm({ ...designateForm, exclusivityEndDate: e.target.value })}
                className={inputClass}
                required
              />
            </FormField>
          </div>

          <FormField label="Commission Rate (%)">
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={designateForm.commissionRate}
              onChange={(e) => setDesignateForm({ ...designateForm, commissionRate: e.target.value })}
              className={inputClass}
              required
            />
          </FormField>

          <div className="bg-blue-950/50 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">What is a Protecting Agent?</h4>
            <p className="text-xs text-gray-400">
              A protecting agent has exclusive rights to represent vessels in a specific port/territory.
              They earn commission on all port calls within their designated area, protecting their investment
              in local relationships and infrastructure.
            </p>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={designating} className={btnPrimary}>
              {designating ? 'Designating...' : 'Designate Agent'}
            </button>
            <button type="button" onClick={() => setShowDesignate(false)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Agent Performance Modal */}
      <Modal open={showPerformance} onClose={() => setShowPerformance(false)} title="Agent Performance">
        {perfLoading ? (
          <div className="text-center py-8 text-gray-400">Loading performance data...</div>
        ) : performance ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-950/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Total Designations</div>
                <div className="text-2xl font-bold text-white">{performance.totalDesignations}</div>
                <div className="text-xs text-gray-500">{performance.activeDesignations} currently active</div>
              </div>

              <div className="bg-blue-950/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Ports Covered</div>
                <div className="text-2xl font-bold text-blue-400">{performance.portsCovered}</div>
                <div className="text-xs text-gray-500">Geographic coverage</div>
              </div>

              <div className="bg-blue-950/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Total Commission Earned</div>
                <div className="text-2xl font-bold text-green-400">{fmt(performance.totalCommissionEarned)}</div>
                <div className="text-xs text-gray-500">Lifetime earnings</div>
              </div>

              <div className="bg-blue-950/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Avg Commission Rate</div>
                <div className="text-2xl font-bold text-yellow-400">{performance.averageCommissionRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">Across all designations</div>
              </div>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="text-sm font-semibold text-green-400 mb-1">💰 Commission Protection Working</div>
              <p className="text-xs text-gray-300">
                This agent has successfully protected {fmt(performance.totalCommissionEarned)} in commissions
                across {performance.totalDesignations} designations.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No performance data available</div>
        )}
      </Modal>

      {/* Revoke Designation Modal */}
      <Modal open={showRevoke} onClose={() => setShowRevoke(false)} title="Revoke Agent Designation">
        <form onSubmit={handleRevoke} className="space-y-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-sm text-red-300">
              ⚠️ Revoking this designation will immediately terminate the agent's exclusivity rights
              and stop future commission payments.
            </p>
          </div>

          <FormField label="Revocation Reason">
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="w-full bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-vertical"
              rows={4}
              placeholder="Explain why this designation is being revoked..."
              required
            />
          </FormField>

          <div className="flex gap-3">
            <button type="submit" disabled={revoking} className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
              {revoking ? 'Revoking...' : 'Confirm Revocation'}
            </button>
            <button type="button" onClick={() => setShowRevoke(false)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
