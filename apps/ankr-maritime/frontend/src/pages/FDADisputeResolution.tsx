/**
 * FDA Dispute Resolution Frontend
 * Phase 6: DA Desk & Port Agency
 * Business Value: $450K/year savings through dispute resolution
 */

import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react';
import { Modal, FormField, inputClass, selectClass, textareaClass, btnPrimary, btnSecondary } from '../components/Modal';

// ========================================
// GRAPHQL QUERIES & MUTATIONS
// ========================================

const FDA_DISPUTES_QUERY = gql`
  query FDADisputes($status: String, $priority: String, $disputeType: String) {
    fdaDisputes(status: $status, priority: $priority, disputeType: $disputeType) {
      id
      disbursementAccountId
      disputeType
      status
      priority
      expectedAmount
      actualAmount
      varianceAmount
      variancePercent
      disputeReason
      resolution
      resolvedAmount
      resolutionNotes
      resolvedBy
      resolvedAt
      createdBy
      createdAt
      updatedAt
    }
    fdaDisputeSummary {
      totalDisputes
      openDisputes
      resolvedDisputes
      totalDisputedAmount
      totalResolvedAmount
      savingsAchieved
      byType
      byStatus
      averageResolutionTime
    }
  }
`;

const FDA_DISPUTE_DETAIL = gql`
  query FDADisputeDetail($id: ID!) {
    fdaDispute(id: $id) {
      id
      disbursementAccountId
      lineItemId
      disputeType
      status
      priority
      expectedAmount
      actualAmount
      varianceAmount
      variancePercent
      disputeReason
      resolution
      resolvedAmount
      resolutionNotes
      resolvedBy
      resolvedAt
      createdBy
      createdAt
      updatedAt
      comments {
        id
        userId
        role
        comment
        isInternal
        createdAt
      }
      attachments {
        id
        fileName
        fileUrl
        fileType
        uploadedBy
        createdAt
      }
    }
  }
`;

const CREATE_DISPUTE = gql`
  mutation CreateDispute($input: DisputeCreateInput!) {
    createFdaDispute(input: $input) {
      id
    }
  }
`;

const RESOLVE_DISPUTE = gql`
  mutation ResolveDispute($id: ID!, $input: DisputeResolutionInput!) {
    resolveFdaDispute(id: $id, input: $input) {
      id
      status
      resolution
      resolvedAmount
    }
  }
`;

const ADD_COMMENT = gql`
  mutation AddDisputeComment($input: DisputeCommentInput!) {
    addDisputeComment(input: $input) {
      id
    }
  }
`;

const ESCALATE_DISPUTE = gql`
  mutation EscalateDispute($id: ID!, $reason: String!) {
    escalateFdaDispute(id: $id, reason: $reason) {
      id
      priority
    }
  }
`;

// ========================================
// TYPES & CONSTANTS
// ========================================

interface Dispute {
  id: string;
  disbursementAccountId: string;
  lineItemId?: string;
  disputeType: string;
  status: string;
  priority: string;
  expectedAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePercent: number;
  disputeReason: string;
  resolution?: string;
  resolvedAmount?: number;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  comments?: any[];
  attachments?: any[];
}

const DISPUTE_TYPES = [
  { value: 'overcharge', label: 'Overcharge' },
  { value: 'service_not_rendered', label: 'Service Not Rendered' },
  { value: 'incorrect_quantity', label: 'Incorrect Quantity' },
  { value: 'pricing_error', label: 'Pricing Error' },
  { value: 'duplicate_charge', label: 'Duplicate Charge' },
  { value: 'tariff_mismatch', label: 'Tariff Mismatch' },
  { value: 'exchange_rate', label: 'Exchange Rate Issue' },
  { value: 'calculation_error', label: 'Calculation Error' },
  { value: 'other', label: 'Other' },
];

const RESOLUTION_TYPES = [
  { value: 'credit_issued', label: 'Credit Issued' },
  { value: 'charge_removed', label: 'Charge Removed' },
  { value: 'charge_adjusted', label: 'Charge Adjusted' },
  { value: 'dispute_rejected', label: 'Dispute Rejected' },
];

const statusColors: Record<string, string> = {
  open: 'bg-yellow-900/50 text-yellow-400',
  in_review: 'bg-blue-900/50 text-blue-400',
  resolved: 'bg-green-900/50 text-green-400',
  rejected: 'bg-red-900/50 text-red-400',
  escalated: 'bg-orange-900/50 text-orange-400',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-800 text-gray-400',
  medium: 'bg-blue-900/50 text-blue-400',
  high: 'bg-orange-900/50 text-orange-400',
  critical: 'bg-red-900/50 text-red-400',
};

// ========================================
// COMPONENT
// ========================================

export function FDADisputeResolution() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    disbursementAccountId: '',
    lineItemId: '',
    disputeType: 'overcharge',
    expectedAmount: '',
    actualAmount: '',
    disputeReason: '',
    priority: 'medium',
  });

  const [resolveForm, setResolveForm] = useState({
    resolution: 'credit_issued',
    resolvedAmount: '',
    resolutionNotes: '',
  });

  const [commentForm, setCommentForm] = useState({
    role: 'agent',
    comment: '',
    isInternal: false,
  });

  const [escalateReason, setEscalateReason] = useState('');

  // Queries
  const { data, loading, refetch } = useQuery(FDA_DISPUTES_QUERY, {
    variables: {
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      disputeType: typeFilter || undefined,
    },
  });

  const { data: detailData, loading: detailLoading } = useQuery(FDA_DISPUTE_DETAIL, {
    variables: { id: selectedDispute || '' },
    skip: !selectedDispute,
  });

  // Mutations
  const [createDispute, { loading: creating }] = useMutation(CREATE_DISPUTE);
  const [resolveDispute, { loading: resolving }] = useMutation(RESOLVE_DISPUTE);
  const [addComment, { loading: commenting }] = useMutation(ADD_COMMENT);
  const [escalateDispute, { loading: escalating }] = useMutation(ESCALATE_DISPUTE);

  // Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDispute({
      variables: {
        input: {
          disbursementAccountId: createForm.disbursementAccountId,
          lineItemId: createForm.lineItemId || undefined,
          disputeType: createForm.disputeType,
          expectedAmount: parseFloat(createForm.expectedAmount),
          actualAmount: parseFloat(createForm.actualAmount),
          disputeReason: createForm.disputeReason,
          priority: createForm.priority,
        },
      },
    });
    setShowCreate(false);
    setCreateForm({
      disbursementAccountId: '',
      lineItemId: '',
      disputeType: 'overcharge',
      expectedAmount: '',
      actualAmount: '',
      disputeReason: '',
      priority: 'medium',
    });
    refetch();
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    await resolveDispute({
      variables: {
        id: selectedDispute,
        input: {
          resolution: resolveForm.resolution,
          resolvedAmount: parseFloat(resolveForm.resolvedAmount),
          resolutionNotes: resolveForm.resolutionNotes,
        },
      },
    });
    setShowResolve(false);
    setResolveForm({ resolution: 'credit_issued', resolvedAmount: '', resolutionNotes: '' });
    refetch();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    await addComment({
      variables: {
        input: {
          disputeId: selectedDispute,
          role: commentForm.role,
          comment: commentForm.comment,
          isInternal: commentForm.isInternal,
        },
      },
    });
    setShowComment(false);
    setCommentForm({ role: 'agent', comment: '', isInternal: false });
    refetch();
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    await escalateDispute({
      variables: {
        id: selectedDispute,
        reason: escalateReason,
      },
    });
    setShowEscalate(false);
    setEscalateReason('');
    refetch();
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const disputes = data?.fdaDisputes || [];
  const summary = data?.fdaDisputeSummary;
  const dispute = detailData?.fdaDispute;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          FDA Dispute Resolution
        </h1>
        <p className="text-gray-400">Manage and resolve FDA disputes • $450K/year savings potential</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Total Disputes</div>
            <div className="text-3xl font-bold text-white">{summary.totalDisputes}</div>
            <div className="text-xs text-gray-500 mt-1">
              {summary.openDisputes} open • {summary.resolvedDisputes} resolved
            </div>
          </div>

          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Disputed Amount</div>
            <div className="text-3xl font-bold text-orange-400">{fmt(summary.totalDisputedAmount)}</div>
            <div className="text-xs text-gray-500 mt-1">Total amount under dispute</div>
          </div>

          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Savings Achieved</div>
            <div className="text-3xl font-bold text-green-400">{fmt(summary.savingsAchieved)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {((summary.savingsAchieved / summary.totalDisputedAmount) * 100).toFixed(1)}% recovery rate
            </div>
          </div>

          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Avg Resolution Time</div>
            <div className="text-3xl font-bold text-blue-400">{summary.averageResolutionTime.toFixed(1)}</div>
            <div className="text-xs text-gray-500 mt-1">days to resolve</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dispute List */}
        <div className="lg:col-span-2 bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Disputes</h2>
            <button onClick={() => setShowCreate(true)} className={btnPrimary}>
              + Create Dispute
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectClass}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={selectClass}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={selectClass}
              >
                <option value="">All Types</option>
                {DISPUTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dispute Table */}
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading disputes...</div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No disputes found</div>
          ) : (
            <div className="space-y-3">
              {disputes.map((d: Dispute) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDispute(d.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedDispute === d.id
                      ? 'bg-blue-800/50 border-blue-400'
                      : 'bg-blue-950/30 border-blue-500/20 hover:border-blue-400/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-white font-semibold">
                        {DISPUTE_TYPES.find((t) => t.value === d.disputeType)?.label || d.disputeType}
                      </div>
                      <div className="text-sm text-gray-400">DA: {d.disbursementAccountId.substring(0, 8)}</div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${priorityColors[d.priority]}`}>
                        {d.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${statusColors[d.status]}`}>
                        {d.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                    <div>
                      <span className="text-gray-400">Expected:</span>
                      <span className="text-white ml-2">{fmt(d.expectedAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Actual:</span>
                      <span className="text-white ml-2">{fmt(d.actualAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Variance:</span>
                      <span className="text-orange-400 ml-2 font-semibold">
                        {fmt(d.varianceAmount)} ({d.variancePercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-300 truncate">{d.disputeReason}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Created {new Date(d.createdAt).toLocaleDateString()} by {d.createdBy}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Dispute Detail */}
        <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
          {!selectedDispute ? (
            <div className="text-center py-12 text-gray-400">
              Select a dispute to view details
            </div>
          ) : detailLoading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : dispute ? (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Dispute Details</h2>

              <div className="space-y-4">
                {/* Status & Actions */}
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded text-sm ${statusColors[dispute.status]}`}>
                    {dispute.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded text-sm ${priorityColors[dispute.priority]}`}>
                    {dispute.priority.toUpperCase()}
                  </span>
                </div>

                {/* Amounts */}
                <div className="bg-blue-950/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Expected Amount:</span>
                    <span className="text-white font-semibold">{fmt(dispute.expectedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Actual Amount:</span>
                    <span className="text-white font-semibold">{fmt(dispute.actualAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-blue-500/30 pt-2">
                    <span className="text-gray-400">Variance:</span>
                    <span className="text-orange-400 font-bold">
                      {fmt(dispute.varianceAmount)} ({dispute.variancePercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <div className="text-sm text-gray-400 mb-1">Dispute Reason:</div>
                  <div className="text-white text-sm bg-blue-950/50 rounded p-3">{dispute.disputeReason}</div>
                </div>

                {/* Resolution (if resolved) */}
                {dispute.resolution && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <div className="text-sm text-green-400 font-semibold mb-2">✓ Resolved</div>
                    <div className="text-sm text-white mb-1">
                      {RESOLUTION_TYPES.find((r) => r.value === dispute.resolution)?.label}
                    </div>
                    <div className="text-sm text-green-400 mb-2">Amount: {fmt(dispute.resolvedAmount!)}</div>
                    <div className="text-xs text-gray-400">{dispute.resolutionNotes}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Resolved by {dispute.resolvedBy} on {new Date(dispute.resolvedAt!).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Communication Trail */}
                {dispute.comments && dispute.comments.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Communication Trail:</div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {dispute.comments.map((c: any) => (
                        <div key={c.id} className="bg-blue-950/50 rounded p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-semibold text-blue-400">{c.role.toUpperCase()}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-sm text-white">{c.comment}</div>
                          {c.isInternal && (
                            <div className="text-xs text-yellow-400 mt-1">🔒 Internal Note</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {dispute.attachments && dispute.attachments.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Attachments ({dispute.attachments.length}):</div>
                    <div className="space-y-1">
                      {dispute.attachments.map((a: any) => (
                        <div key={a.id} className="flex items-center gap-2 text-sm">
                          <span className="text-blue-400">📎</span>
                          <a href={a.fileUrl} className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">
                            {a.fileName}
                          </a>
                          <span className="text-xs text-gray-500">({a.fileType})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {dispute.status !== 'resolved' && dispute.status !== 'rejected' && (
                  <div className="flex flex-col gap-2 pt-4 border-t border-blue-500/30">
                    <button onClick={() => setShowComment(true)} className={btnSecondary + ' w-full'}>
                      💬 Add Comment
                    </button>
                    <button onClick={() => setShowResolve(true)} className={btnPrimary + ' w-full'}>
                      ✓ Resolve Dispute
                    </button>
                    {dispute.priority !== 'critical' && (
                      <button onClick={() => setShowEscalate(true)} className="btn-warning w-full">
                        ⚠ Escalate
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Create Dispute Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Dispute">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Disbursement Account ID">
            <input
              type="text"
              value={createForm.disbursementAccountId}
              onChange={(e) => setCreateForm({ ...createForm, disbursementAccountId: e.target.value })}
              className={inputClass}
              required
            />
          </FormField>

          <FormField label="Line Item ID (optional)">
            <input
              type="text"
              value={createForm.lineItemId}
              onChange={(e) => setCreateForm({ ...createForm, lineItemId: e.target.value })}
              className={inputClass}
            />
          </FormField>

          <FormField label="Dispute Type">
            <select
              value={createForm.disputeType}
              onChange={(e) => setCreateForm({ ...createForm, disputeType: e.target.value })}
              className={selectClass}
              required
            >
              {DISPUTE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Expected Amount">
              <input
                type="number"
                step="0.01"
                value={createForm.expectedAmount}
                onChange={(e) => setCreateForm({ ...createForm, expectedAmount: e.target.value })}
                className={inputClass}
                required
              />
            </FormField>

            <FormField label="Actual Amount">
              <input
                type="number"
                step="0.01"
                value={createForm.actualAmount}
                onChange={(e) => setCreateForm({ ...createForm, actualAmount: e.target.value })}
                className={inputClass}
                required
              />
            </FormField>
          </div>

          <FormField label="Priority">
            <select
              value={createForm.priority}
              onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
              className={selectClass}
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </FormField>

          <FormField label="Dispute Reason">
            <textarea
              value={createForm.disputeReason}
              onChange={(e) => setCreateForm({ ...createForm, disputeReason: e.target.value })}
              className={textareaClass}
              rows={4}
              required
            />
          </FormField>

          <div className="flex gap-3">
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Dispute'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Resolve Dispute Modal */}
      <Modal open={showResolve} onClose={() => setShowResolve(false)} title="Resolve Dispute">
        <form onSubmit={handleResolve} className="space-y-4">
          <FormField label="Resolution Type">
            <select
              value={resolveForm.resolution}
              onChange={(e) => setResolveForm({ ...resolveForm, resolution: e.target.value })}
              className={selectClass}
              required
            >
              {RESOLUTION_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Resolved Amount">
            <input
              type="number"
              step="0.01"
              value={resolveForm.resolvedAmount}
              onChange={(e) => setResolveForm({ ...resolveForm, resolvedAmount: e.target.value })}
              className={inputClass}
              required
            />
          </FormField>

          <FormField label="Resolution Notes">
            <textarea
              value={resolveForm.resolutionNotes}
              onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })}
              className={textareaClass}
              rows={4}
              required
            />
          </FormField>

          <div className="flex gap-3">
            <button type="submit" disabled={resolving} className={btnPrimary}>
              {resolving ? 'Resolving...' : 'Resolve Dispute'}
            </button>
            <button type="button" onClick={() => setShowResolve(false)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Comment Modal */}
      <Modal open={showComment} onClose={() => setShowComment(false)} title="Add Comment">
        <form onSubmit={handleAddComment} className="space-y-4">
          <FormField label="Role">
            <select
              value={commentForm.role}
              onChange={(e) => setCommentForm({ ...commentForm, role: e.target.value })}
              className={selectClass}
              required
            >
              <option value="agent">Agent</option>
              <option value="port">Port</option>
              <option value="owner">Owner</option>
              <option value="internal">Internal</option>
            </select>
          </FormField>

          <FormField label="Comment">
            <textarea
              value={commentForm.comment}
              onChange={(e) => setCommentForm({ ...commentForm, comment: e.target.value })}
              className={textareaClass}
              rows={4}
              required
            />
          </FormField>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isInternal"
              checked={commentForm.isInternal}
              onChange={(e) => setCommentForm({ ...commentForm, isInternal: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isInternal" className="text-sm text-gray-300">
              Internal note (not visible to external parties)
            </label>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={commenting} className={btnPrimary}>
              {commenting ? 'Adding...' : 'Add Comment'}
            </button>
            <button type="button" onClick={() => setShowComment(false)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Escalate Modal */}
      <Modal open={showEscalate} onClose={() => setShowEscalate(false)} title="Escalate Dispute">
        <form onSubmit={handleEscalate} className="space-y-4">
          <FormField label="Escalation Reason">
            <textarea
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              className={textareaClass}
              rows={4}
              placeholder="Explain why this dispute needs to be escalated..."
              required
            />
          </FormField>

          <div className="flex gap-3">
            <button type="submit" disabled={escalating} className="btn-warning">
              {escalating ? 'Escalating...' : 'Escalate to Critical'}
            </button>
            <button type="button" onClick={() => setShowEscalate(false)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
