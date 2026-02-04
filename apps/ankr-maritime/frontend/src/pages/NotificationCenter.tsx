import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, selectClass, inputClass, btnPrimary, btnSecondary } from '../components/Modal';

const NOTIFICATION_DIGESTS = gql`
  query NotificationDigests($digestType: String, $status: String, $channel: String) {
    notificationDigests(digestType: $digestType, status: $status, channel: $channel) {
      id digestType periodStart periodEnd channel status
      recipientEmail recipientUserId
      eventsCount highlights categoryBreakdown
      generatedAt sentAt failureReason
      createdAt updatedAt
    }
  }
`;

const GENERATE_DIGEST = gql`
  mutation GenerateDigest($digestType: String!, $periodStart: String!, $periodEnd: String!, $channel: String!) {
    generateDigest(digestType: $digestType, periodStart: $periodStart, periodEnd: $periodEnd, channel: $channel) {
      id status
    }
  }
`;

const SEND_DIGEST = gql`
  mutation SendDigest($id: String!) {
    sendDigest(id: $id) { id status sentAt }
  }
`;

const statusBadge: Record<string, { bg: string; label: string }> = {
  pending: { bg: 'bg-amber-900/50 text-amber-400', label: 'Pending' },
  generated: { bg: 'bg-blue-900/50 text-blue-400', label: 'Generated' },
  sent: { bg: 'bg-emerald-900/50 text-emerald-400', label: 'Sent' },
  failed: { bg: 'bg-red-900/50 text-red-400', label: 'Failed' },
};

const digestTypeLabel: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
};

const channelLabel: Record<string, string> = {
  email: 'Email',
  in_app: 'In-App',
  slack: 'Slack',
  teams: 'Teams',
  webhook: 'Webhook',
};

function formatDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

function parseJson(val: unknown): Record<string, unknown> | null {
  if (!val) return null;
  if (typeof val === 'object') return val as Record<string, unknown>;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return null; }
  }
  return null;
}

function parseHighlights(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch { return []; }
  }
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Digest = Record<string, any>;

export function NotificationCenter() {
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generateForm, setGenerateForm] = useState({
    digestType: 'daily',
    periodStart: '',
    periodEnd: '',
    channel: 'email',
  });

  const { data, loading, error, refetch } = useQuery(NOTIFICATION_DIGESTS, {
    variables: {
      digestType: filterType || undefined,
      status: filterStatus || undefined,
      channel: filterChannel || undefined,
    },
  });
  const [generateDigest, { loading: generating }] = useMutation(GENERATE_DIGEST);
  const [sendDigest] = useMutation(SEND_DIGEST);

  const digests: Digest[] = data?.notificationDigests ?? [];

  // Compute summary stats
  const totalDigests = digests.length;
  const pendingCount = digests.filter((d: Digest) => d.status === 'pending').length;
  const sentCount = digests.filter((d: Digest) => d.status === 'sent').length;
  const failedCount = digests.filter((d: Digest) => d.status === 'failed').length;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateForm.periodStart || !generateForm.periodEnd) return;
    await generateDigest({
      variables: {
        digestType: generateForm.digestType,
        periodStart: generateForm.periodStart,
        periodEnd: generateForm.periodEnd,
        channel: generateForm.channel,
      },
    });
    setShowGenerate(false);
    setGenerateForm({ digestType: 'daily', periodStart: '', periodEnd: '', channel: 'email' });
    refetch();
  };

  const handleSendDigest = async (id: string) => {
    await sendDigest({ variables: { id } });
    refetch();
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notification Center</h1>
          <p className="text-maritime-400 text-sm mt-1">Digest management and notification delivery tracking</p>
        </div>
        <button onClick={() => setShowGenerate(true)} className={btnPrimary}>
          + Generate Digest
        </button>
      </div>

      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Digests', value: totalDigests, color: 'text-white', border: 'border-maritime-500', bg: 'bg-maritime-800' },
          { label: 'Pending', value: pendingCount, color: 'text-amber-400', border: 'border-amber-500', bg: 'bg-maritime-800' },
          { label: 'Sent', value: sentCount, color: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-maritime-800' },
          { label: 'Failed', value: failedCount, color: 'text-red-400', border: 'border-red-500', bg: 'bg-maritime-800' },
        ].map((card) => (
          <div key={card.label} className={`${card.bg} border-l-4 ${card.border} rounded-lg p-4`}>
            <p className="text-maritime-500 text-xs font-medium">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5"
        >
          <option value="">All Types</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="generated">Generated</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5"
        >
          <option value="">All Channels</option>
          <option value="email">Email</option>
          <option value="in_app">In-App</option>
          <option value="slack">Slack</option>
          <option value="teams">Teams</option>
          <option value="webhook">Webhook</option>
        </select>
      </div>

      {/* Digests Table */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-maritime-400 text-xs border-b border-maritime-700">
              <th className="text-left px-4 py-3 font-medium w-8"></th>
              <th className="text-left px-4 py-3 font-medium">Period</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Channel</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Events</th>
              <th className="text-left px-4 py-3 font-medium">Sent</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="text-center px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="text-center py-8 text-maritime-500">Loading digests...</td></tr>
            )}
            {!loading && digests.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8 text-maritime-500">No notification digests found</td></tr>
            )}
            {digests.map((digest: Digest) => {
              const isExpanded = expandedId === digest.id;
              const badge = statusBadge[digest.status] ?? { bg: 'bg-maritime-700 text-maritime-300', label: digest.status };
              const highlights = parseHighlights(digest.highlights);
              const categoryBreakdown = parseJson(digest.categoryBreakdown);

              return (
                <tr key={digest.id} className="group">
                  <td colSpan={9} className="p-0">
                    {/* Main Row */}
                    <div className={`flex items-center border-b border-maritime-700/50 hover:bg-maritime-700/20 ${isExpanded ? 'bg-maritime-700/20' : ''}`}>
                      <div className="px-4 py-3 w-8">
                        <button
                          onClick={() => toggleExpand(digest.id)}
                          className="text-maritime-500 hover:text-maritime-300 text-sm transition-transform"
                        >
                          {isExpanded ? '\u25BC' : '\u25B6'}
                        </button>
                      </div>
                      <div className="px-4 py-3 flex-1 text-white text-sm">
                        {digest.periodStart && digest.periodEnd
                          ? formatPeriod(digest.periodStart, digest.periodEnd)
                          : '-'}
                      </div>
                      <div className="px-4 py-3 w-24">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          digest.digestType === 'daily'
                            ? 'bg-blue-900/50 text-blue-400'
                            : 'bg-purple-900/50 text-purple-400'
                        }`}>
                          {digestTypeLabel[digest.digestType] ?? digest.digestType}
                        </span>
                      </div>
                      <div className="px-4 py-3 w-28 text-maritime-300 text-xs">
                        {channelLabel[digest.channel] ?? digest.channel}
                      </div>
                      <div className="px-4 py-3 w-28 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="px-4 py-3 w-20 text-right text-maritime-300 font-mono text-xs">
                        {digest.eventsCount ?? 0}
                      </div>
                      <div className="px-4 py-3 w-40 text-maritime-400 text-xs">
                        {formatDate(digest.sentAt)}
                      </div>
                      <div className="px-4 py-3 w-40 text-maritime-400 text-xs">
                        {formatDate(digest.createdAt)}
                      </div>
                      <div className="px-4 py-3 w-28 text-center">
                        {(digest.status === 'generated' || digest.status === 'pending') && (
                          <button
                            onClick={() => handleSendDigest(digest.id)}
                            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-medium px-2.5 py-1 rounded transition-colors"
                          >
                            Send
                          </button>
                        )}
                        {digest.status === 'failed' && (
                          <span className="text-red-400/70 text-[10px]" title={digest.failureReason || 'Unknown error'}>
                            Retry
                          </span>
                        )}
                        {digest.status === 'sent' && (
                          <span className="text-emerald-400/50 text-[10px]">Delivered</span>
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="bg-maritime-900/50 border-b border-maritime-700 px-8 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Highlights */}
                          <div>
                            <p className="text-xs text-maritime-500 font-medium mb-2 uppercase tracking-wide">Highlights</p>
                            {highlights.length > 0 ? (
                              <ul className="space-y-1.5">
                                {highlights.map((h, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-maritime-300">
                                    <span className="text-blue-400 mt-0.5 flex-shrink-0">{'\u2022'}</span>
                                    <span>{typeof h === 'string' ? h : JSON.stringify(h)}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-maritime-500 text-xs italic">No highlights available</p>
                            )}
                          </div>

                          {/* Category Breakdown */}
                          <div>
                            <p className="text-xs text-maritime-500 font-medium mb-2 uppercase tracking-wide">Category Breakdown</p>
                            {categoryBreakdown ? (
                              <div className="space-y-2">
                                {Object.entries(categoryBreakdown).map(([category, count]) => {
                                  const numericCount = typeof count === 'number' ? count : parseInt(String(count)) || 0;
                                  const total = Object.values(categoryBreakdown).reduce((sum, v) => {
                                    const n = typeof v === 'number' ? v : parseInt(String(v)) || 0;
                                    return (sum as number) + n;
                                  }, 0) as number;
                                  const pct = total > 0 ? (numericCount / total) * 100 : 0;
                                  return (
                                    <div key={category}>
                                      <div className="flex justify-between text-xs mb-0.5">
                                        <span className="text-maritime-300 capitalize">{category.replace(/_/g, ' ')}</span>
                                        <span className="text-maritime-400">{numericCount}</span>
                                      </div>
                                      <div className="w-full bg-maritime-800 rounded-full h-1.5">
                                        <div
                                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                                          style={{ width: `${Math.max(pct, 2)}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-maritime-500 text-xs italic">No category data available</p>
                            )}
                          </div>
                        </div>

                        {/* Failure Reason */}
                        {digest.status === 'failed' && digest.failureReason && (
                          <div className="mt-4 bg-red-900/20 border border-red-800/40 rounded px-4 py-3">
                            <p className="text-xs text-red-400 font-medium mb-1">Failure Reason</p>
                            <p className="text-sm text-red-300">{digest.failureReason}</p>
                          </div>
                        )}

                        {/* Recipient Info */}
                        <div className="mt-4 flex gap-6 text-xs text-maritime-400">
                          {digest.recipientEmail && (
                            <span>Recipient: <span className="text-maritime-300">{digest.recipientEmail}</span></span>
                          )}
                          {digest.generatedAt && (
                            <span>Generated: <span className="text-maritime-300">{formatDate(digest.generatedAt)}</span></span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Generate Digest Modal */}
      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Notification Digest">
        <form onSubmit={handleGenerate}>
          <FormField label="Digest Type *">
            <select
              value={generateForm.digestType}
              onChange={(e) => setGenerateForm({ ...generateForm, digestType: e.target.value })}
              className={selectClass}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </FormField>
          <FormField label="Period Start *">
            <input
              type="date"
              value={generateForm.periodStart}
              onChange={(e) => setGenerateForm({ ...generateForm, periodStart: e.target.value })}
              className={inputClass}
              required
            />
          </FormField>
          <FormField label="Period End *">
            <input
              type="date"
              value={generateForm.periodEnd}
              onChange={(e) => setGenerateForm({ ...generateForm, periodEnd: e.target.value })}
              className={inputClass}
              required
            />
          </FormField>
          <FormField label="Channel *">
            <select
              value={generateForm.channel}
              onChange={(e) => setGenerateForm({ ...generateForm, channel: e.target.value })}
              className={selectClass}
            >
              <option value="email">Email</option>
              <option value="in_app">In-App</option>
              <option value="slack">Slack</option>
              <option value="teams">Teams</option>
              <option value="webhook">Webhook</option>
            </select>
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowGenerate(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={generating} className={btnPrimary}>
              {generating ? 'Generating...' : 'Generate Digest'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
