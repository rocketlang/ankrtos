import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { NextStepBanner } from '../components/NextStepBanner';

const CLAIMS_QUERY = gql`
  query Claims($status: String, $type: String, $priority: String) {
    claims(status: $status, type: $type, priority: $priority) {
      id claimNumber type status amount currency settledAmount description
      filedDate settledDate dueDate priority notes
      voyage { voyageNumber vessel { name } }
      documents { id name type }
    }
    claimSummary {
      totalClaims openClaims settledClaims totalClaimAmount totalSettledAmount currency
    }
    voyages { id voyageNumber vessel { name } }
  }
`;

const CREATE_CLAIM = gql`
  mutation CreateClaim(
    $claimNumber: String!, $voyageId: String!, $type: String!, $amount: Float!,
    $description: String, $priority: String, $currency: String
  ) {
    createClaim(claimNumber: $claimNumber, voyageId: $voyageId, type: $type, amount: $amount,
      description: $description, priority: $priority, currency: $currency) { id }
  }
`;

const UPDATE_STATUS = gql`
  mutation UpdateClaimStatus($id: String!, $status: String!, $settledAmount: Float, $notes: String) {
    updateClaimStatus(id: $id, status: $status, settledAmount: $settledAmount, notes: $notes) { id }
  }
`;

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const claimTypes = [
  { value: 'cargo_damage', label: 'Cargo Damage' },
  { value: 'cargo_shortage', label: 'Cargo Shortage' },
  { value: 'demurrage', label: 'Demurrage' },
  { value: 'dead_freight', label: 'Dead Freight' },
  { value: 'deviation', label: 'Deviation' },
  { value: 'general_average', label: 'General Average' },
];

const statusFlow: Record<string, string[]> = {
  open: ['under_investigation'],
  under_investigation: ['negotiation', 'rejected'],
  negotiation: ['settled', 'arbitration'],
  arbitration: ['settled', 'closed'],
  settled: ['closed'],
  rejected: ['closed'],
};

const statusBadge: Record<string, string> = {
  open: 'bg-red-900/50 text-red-400',
  under_investigation: 'bg-yellow-900/50 text-yellow-400',
  negotiation: 'bg-blue-900/50 text-blue-400',
  settled: 'bg-green-900/50 text-green-400',
  rejected: 'bg-gray-800 text-gray-400',
  arbitration: 'bg-purple-900/50 text-purple-400',
  closed: 'bg-maritime-700 text-maritime-300',
};

const priorityBadge: Record<string, string> = {
  low: 'text-maritime-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400 font-bold',
};

export function Claims() {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [settleId, setSettleId] = useState<string | null>(null);
  const [settleAmt, setSettleAmt] = useState('');

  const { data, loading, refetch } = useQuery(CLAIMS_QUERY, {
    variables: {
      status: filterStatus || undefined,
      type: filterType || undefined,
    },
  });
  const [createClaim] = useMutation(CREATE_CLAIM);
  const [updateStatus] = useMutation(UPDATE_STATUS);

  const [form, setForm] = useState({
    claimNumber: '', voyageId: '', type: 'cargo_damage', amount: '',
    description: '', priority: 'medium', currency: 'USD',
  });

  const handleCreate = async () => {
    if (!form.claimNumber || !form.voyageId || !form.amount) return;
    await createClaim({
      variables: {
        ...form,
        amount: parseFloat(form.amount),
      },
    });
    setShowCreate(false);
    setForm({ claimNumber: '', voyageId: '', type: 'cargo_damage', amount: '', description: '', priority: 'medium', currency: 'USD' });
    refetch();
  };

  const handleStatusChange = async (id: string, status: string) => {
    if (status === 'settled' && !settleAmt) {
      setSettleId(id);
      return;
    }
    await updateStatus({
      variables: {
        id,
        status,
        settledAmount: status === 'settled' ? parseFloat(settleAmt) : undefined,
      },
    });
    setSettleId(null);
    setSettleAmt('');
    refetch();
  };

  const claims = data?.claims ?? [];
  const summary = data?.claimSummary;
  const voyages = data?.voyages ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Claims Management</h1>
          <p className="text-maritime-400 text-sm mt-1">Cargo damage, shortage, demurrage & freight claims</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/csv/claims" className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm px-3 py-2 rounded-lg">CSV</a>
          <button onClick={() => setShowCreate(true)} className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + New Claim
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Claims', value: summary.totalClaims, color: 'text-white', border: 'border-maritime-500' },
            { label: 'Open', value: summary.openClaims, color: 'text-red-400', border: 'border-red-500' },
            { label: 'Settled', value: summary.settledClaims, color: 'text-green-400', border: 'border-green-500' },
            { label: 'Claimed', value: fmt(summary.totalClaimAmount), color: 'text-orange-400', border: 'border-orange-500' },
            { label: 'Settled Amt', value: fmt(summary.totalSettledAmount), color: 'text-emerald-400', border: 'border-emerald-500' },
          ].map((s) => (
            <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
              <p className="text-maritime-500 text-xs">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="under_investigation">Under Investigation</option>
          <option value="negotiation">Negotiation</option>
          <option value="settled">Settled</option>
          <option value="rejected">Rejected</option>
          <option value="arbitration">Arbitration</option>
          <option value="closed">Closed</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Types</option>
          {claimTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Claims Table */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-maritime-400 text-xs border-b border-maritime-700">
              <th className="text-left px-4 py-3">Claim #</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Voyage</th>
              <th className="text-left px-4 py-3">Priority</th>
              <th className="text-right px-4 py-3">Amount</th>
              <th className="text-right px-4 py-3">Settled</th>
              <th className="text-left px-4 py-3">Filed</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="text-center py-8 text-maritime-500">Loading...</td></tr>
            )}
            {!loading && claims.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8 text-maritime-500">No claims found</td></tr>
            )}
            {claims.map((c: Record<string, unknown>) => {
              const voyage = c.voyage as Record<string, unknown> | null;
              const vessel = voyage?.vessel as Record<string, unknown> | null;
              const nextStatuses = statusFlow[c.status as string] ?? [];
              return (
                <tr key={c.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                  <td className="px-4 py-3 text-white font-mono text-xs">{c.claimNumber as string}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs capitalize">{(c.type as string).replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">
                    {voyage?.voyageNumber as string} — {vessel?.name as string}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${priorityBadge[c.priority as string] ?? 'text-maritime-400'}`}>
                      {(c.priority as string).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-orange-400 font-mono text-xs">{fmt(c.amount as number)}</td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-mono text-xs">
                    {(c.settledAmount as number) ? fmt(c.settledAmount as number) : '-'}
                  </td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">
                    {new Date(c.filedDate as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusBadge[c.status as string] ?? ''}`}>
                      {(c.status as string).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {settleId === c.id ? (
                      <div className="flex items-center gap-1">
                        <input value={settleAmt} onChange={(e) => setSettleAmt(e.target.value)}
                          placeholder="Amount" type="number" step="any"
                          className="w-24 bg-maritime-900 border border-maritime-700 text-white text-xs rounded px-2 py-1" />
                        <button onClick={() => handleStatusChange(c.id as string, 'settled')}
                          className="text-green-400 text-xs hover:text-green-300">OK</button>
                        <button onClick={() => { setSettleId(null); setSettleAmt(''); }}
                          className="text-maritime-500 text-xs">X</button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        {nextStatuses.map((ns) => (
                          <button key={ns} onClick={() => handleStatusChange(c.id as string, ns)}
                            className="text-blue-400 hover:text-blue-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded capitalize">
                            {ns.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <NextStepBanner />

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-white font-bold text-lg mb-4">File New Claim</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">Claim Number</label>
                  <input value={form.claimNumber} onChange={(e) => setForm({ ...form, claimNumber: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1"
                    placeholder="CLM-2026-001" />
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Voyage</label>
                  <select value={form.voyageId} onChange={(e) => setForm({ ...form, voyageId: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1">
                    <option value="">Select Voyage</option>
                    {voyages.map((v: Record<string, unknown>) => (
                      <option key={v.id as string} value={v.id as string}>
                        {v.voyageNumber as string} — {(v.vessel as Record<string, unknown>)?.name as string}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1">
                    {claimTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Amount ($)</label>
                  <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    type="number" step="any"
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" />
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-maritime-400 text-xs">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="text-maritime-400 text-sm hover:text-white px-4 py-2">Cancel</button>
              <button onClick={handleCreate} className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg">File Claim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
