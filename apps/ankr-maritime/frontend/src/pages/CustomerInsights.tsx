import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, selectClass, inputClass, btnPrimary, btnSecondary } from '../components/Modal';

const CUSTOMER_PROFILES = gql`
  query CustomerProfiles {
    customerProfiles {
      id companyId companyName customerSince totalFixtures totalRevenue avgFixtureValue
      preferredRoutes preferredVessels preferredCargoes avgPaymentDays outstandingAmount
      creditRating relationshipScore lastFixtureDate lastContactDate riskFlags tags notes
    }
  }
`;

const REFRESH_PROFILE = gql`
  mutation RefreshCustomerProfile($id: String!) {
    refreshCustomerProfile(id: $id) { id }
  }
`;

const UPDATE_CREDIT_RATING = gql`
  mutation UpdateCreditRating($id: String!, $creditRating: String!, $notes: String) {
    updateCreditRating(id: $id, creditRating: $creditRating, notes: $notes) { id creditRating }
  }
`;

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const ratingBadge: Record<string, string> = {
  A: 'bg-green-900/50 text-green-400 border-green-500/30',
  B: 'bg-blue-900/50 text-blue-400 border-blue-500/30',
  C: 'bg-yellow-900/50 text-yellow-400 border-yellow-500/30',
  D: 'bg-red-900/50 text-red-400 border-red-500/30',
};

const ratingBarColor: Record<string, string> = {
  A: 'bg-green-500',
  B: 'bg-blue-500',
  C: 'bg-yellow-500',
  D: 'bg-red-500',
};

type CustomerProfile = {
  id: string;
  companyId: string;
  companyName: string;
  customerSince: string;
  totalFixtures: number;
  totalRevenue: number;
  avgFixtureValue: number;
  preferredRoutes: string[];
  preferredVessels: string[];
  preferredCargoes: string[];
  avgPaymentDays: number;
  outstandingAmount: number;
  creditRating: string;
  relationshipScore: number;
  lastFixtureDate: string;
  lastContactDate: string;
  riskFlags: string[];
  tags: string[];
  notes: string;
};

const ratingOptions = ['A', 'B', 'C', 'D'];

export function CustomerInsights() {
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{ id: string; companyName: string; current: string } | null>(null);
  const [newRating, setNewRating] = useState('A');
  const [ratingNotes, setRatingNotes] = useState('');

  const { data, loading, refetch } = useQuery(CUSTOMER_PROFILES);
  const [refreshProfile, { loading: refreshing }] = useMutation(REFRESH_PROFILE);
  const [updateCreditRating, { loading: updatingRating }] = useMutation(UPDATE_CREDIT_RATING);

  const allCustomers: CustomerProfile[] = data?.customerProfiles ?? [];

  const customers = ratingFilter === 'all'
    ? allCustomers
    : allCustomers.filter((c) => c.creditRating === ratingFilter);

  const totalRevenue = allCustomers.reduce((s, c) => s + (c.totalRevenue || 0), 0);
  const avgRevPerCustomer = allCustomers.length > 0 ? totalRevenue / allCustomers.length : 0;
  const atRiskCount = allCustomers.filter((c) => c.riskFlags && c.riskFlags.length > 0).length;

  const handleRefresh = async (id: string) => {
    await refreshProfile({ variables: { id } });
    refetch();
  };

  const openRatingModal = (customer: CustomerProfile) => {
    setRatingTarget({ id: customer.id, companyName: customer.companyName, current: customer.creditRating });
    setNewRating(customer.creditRating || 'A');
    setRatingNotes('');
    setShowRatingModal(true);
  };

  const handleUpdateRating = async () => {
    if (!ratingTarget) return;
    await updateCreditRating({
      variables: {
        id: ratingTarget.id,
        creditRating: newRating,
        notes: ratingNotes || undefined,
      },
    });
    setShowRatingModal(false);
    setRatingTarget(null);
    refetch();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filterTabClass = (tab: string) =>
    `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
      ratingFilter === tab
        ? 'bg-maritime-700 text-white'
        : 'text-maritime-400 hover:text-maritime-300 hover:bg-maritime-700/50'
    }`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Customer Insights</h1>
        <p className="text-maritime-400 text-sm mt-1">Customer profiles, credit ratings & relationship analytics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-maritime-800 border-l-4 border-blue-500 rounded-lg p-4">
          <p className="text-maritime-500 text-xs">Total Customers</p>
          <p className="text-lg font-bold mt-1 text-white">{allCustomers.length}</p>
        </div>
        <div className="bg-maritime-800 border-l-4 border-green-500 rounded-lg p-4">
          <p className="text-maritime-500 text-xs">Total Revenue</p>
          <p className="text-lg font-bold mt-1 text-green-400">{fmt(totalRevenue)}</p>
        </div>
        <div className="bg-maritime-800 border-l-4 border-yellow-500 rounded-lg p-4">
          <p className="text-maritime-500 text-xs">Avg Revenue / Customer</p>
          <p className="text-lg font-bold mt-1 text-yellow-400">{fmt(avgRevPerCustomer)}</p>
        </div>
        <div className="bg-maritime-800 border-l-4 border-red-500 rounded-lg p-4">
          <p className="text-maritime-500 text-xs">At Risk</p>
          <p className="text-lg font-bold mt-1 text-red-400">{atRiskCount}</p>
        </div>
      </div>

      {/* Credit Rating Filter Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-maritime-500 text-xs mr-1">Credit Rating:</span>
        <button onClick={() => setRatingFilter('all')} className={filterTabClass('all')}>All</button>
        {ratingOptions.map((r) => (
          <button key={r} onClick={() => setRatingFilter(r)} className={filterTabClass(r)}>
            {r} ({allCustomers.filter((c) => c.creditRating === r).length})
          </button>
        ))}
      </div>

      {/* Customer Table */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-maritime-400 text-xs border-b border-maritime-700">
              <th className="text-left px-4 py-3">Company</th>
              <th className="text-left px-4 py-3">Since</th>
              <th className="text-right px-4 py-3">Fixtures</th>
              <th className="text-right px-4 py-3">Revenue</th>
              <th className="text-right px-4 py-3">Avg Payment</th>
              <th className="text-center px-4 py-3">Rating</th>
              <th className="text-left px-4 py-3">Relationship</th>
              <th className="text-right px-4 py-3">Outstanding</th>
              <th className="text-left px-4 py-3">Last Contact</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="text-center py-8 text-maritime-500">Loading...</td></tr>
            )}
            {!loading && customers.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8 text-maritime-500">No customers found</td></tr>
            )}
            {customers.map((c) => {
              const isExpanded = expandedId === c.id;
              const scorePercent = Math.min(100, Math.max(0, c.relationshipScore || 0));
              const scoreColor = scorePercent >= 80 ? 'bg-green-500' : scorePercent >= 60 ? 'bg-blue-500' : scorePercent >= 40 ? 'bg-yellow-500' : 'bg-red-500';
              const hasRiskFlags = c.riskFlags && c.riskFlags.length > 0;

              return (
                <tr key={c.id} className="group">
                  <td colSpan={9} className="p-0">
                    {/* Main Row */}
                    <div
                      onClick={() => toggleExpand(c.id)}
                      className={`grid grid-cols-[1fr_80px_70px_100px_90px_60px_120px_100px_90px] items-center cursor-pointer border-b border-maritime-700/30 hover:bg-maritime-700/20 ${isExpanded ? 'bg-maritime-700/20' : ''}`}
                    >
                      <div className="px-4 py-3 flex items-center gap-2">
                        <span className="text-white text-xs font-medium">{c.companyName}</span>
                        {hasRiskFlags && (
                          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" title="Has risk flags" />
                        )}
                      </div>
                      <div className="px-4 py-3 text-maritime-400 text-xs">
                        {c.customerSince
                          ? new Date(c.customerSince).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                          : '-'}
                      </div>
                      <div className="px-4 py-3 text-right text-maritime-300 text-xs font-mono">{c.totalFixtures}</div>
                      <div className="px-4 py-3 text-right text-green-400 text-xs font-mono">{fmt(c.totalRevenue || 0)}</div>
                      <div className="px-4 py-3 text-right text-maritime-300 text-xs">
                        {c.avgPaymentDays != null ? `${c.avgPaymentDays}d` : '-'}
                      </div>
                      <div className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${ratingBadge[c.creditRating] ?? 'bg-maritime-700 text-maritime-300 border-maritime-600'}`}>
                          {c.creditRating || '-'}
                        </span>
                      </div>
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-maritime-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${scorePercent}%` }} />
                          </div>
                          <span className="text-maritime-400 text-[10px] w-7 text-right">{scorePercent}</span>
                        </div>
                      </div>
                      <div className="px-4 py-3 text-right text-orange-400 text-xs font-mono">
                        {c.outstandingAmount ? fmt(c.outstandingAmount) : '-'}
                      </div>
                      <div className="px-4 py-3 text-maritime-400 text-xs">
                        {c.lastContactDate
                          ? new Date(c.lastContactDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                          : '-'}
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="px-6 py-4 bg-maritime-900/50 border-b border-maritime-700 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          {/* Preferred Routes */}
                          <div>
                            <p className="text-maritime-500 text-[10px] font-medium uppercase tracking-wide mb-1.5">Preferred Routes</p>
                            <div className="flex flex-wrap gap-1">
                              {c.preferredRoutes && c.preferredRoutes.length > 0
                                ? c.preferredRoutes.map((r, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400">{r}</span>
                                  ))
                                : <span className="text-maritime-600 text-[10px]">None</span>}
                            </div>
                          </div>

                          {/* Preferred Vessels */}
                          <div>
                            <p className="text-maritime-500 text-[10px] font-medium uppercase tracking-wide mb-1.5">Preferred Vessels</p>
                            <div className="flex flex-wrap gap-1">
                              {c.preferredVessels && c.preferredVessels.length > 0
                                ? c.preferredVessels.map((v, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400">{v}</span>
                                  ))
                                : <span className="text-maritime-600 text-[10px]">None</span>}
                            </div>
                          </div>

                          {/* Preferred Cargoes */}
                          <div>
                            <p className="text-maritime-500 text-[10px] font-medium uppercase tracking-wide mb-1.5">Preferred Cargoes</p>
                            <div className="flex flex-wrap gap-1">
                              {c.preferredCargoes && c.preferredCargoes.length > 0
                                ? c.preferredCargoes.map((cargo, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400">{cargo}</span>
                                  ))
                                : <span className="text-maritime-600 text-[10px]">None</span>}
                            </div>
                          </div>
                        </div>

                        {/* Risk Flags */}
                        {hasRiskFlags && (
                          <div>
                            <p className="text-maritime-500 text-[10px] font-medium uppercase tracking-wide mb-1.5">Risk Flags</p>
                            <div className="flex flex-wrap gap-1">
                              {c.riskFlags.map((flag, i) => (
                                <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                                  {flag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {c.tags && c.tags.length > 0 && (
                          <div>
                            <p className="text-maritime-500 text-[10px] font-medium uppercase tracking-wide mb-1.5">Tags</p>
                            <div className="flex flex-wrap gap-1">
                              {c.tags.map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-maritime-700 text-maritime-300">{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {c.notes && (
                          <div>
                            <p className="text-maritime-500 text-[10px] font-medium uppercase tracking-wide mb-1">Notes</p>
                            <p className="text-maritime-300 text-xs bg-maritime-800 rounded p-2">{c.notes}</p>
                          </div>
                        )}

                        {/* Additional Info */}
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-maritime-500">Avg Fixture Value: </span>
                            <span className="text-green-400 font-mono">{c.avgFixtureValue ? fmt(c.avgFixtureValue) : '-'}</span>
                          </div>
                          <div>
                            <span className="text-maritime-500">Last Fixture: </span>
                            <span className="text-maritime-300">
                              {c.lastFixtureDate
                                ? new Date(c.lastFixtureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-maritime-500">Rating: </span>
                            <span className={`font-bold ${
                              c.creditRating === 'A' ? 'text-green-400' :
                              c.creditRating === 'B' ? 'text-blue-400' :
                              c.creditRating === 'C' ? 'text-yellow-400' : 'text-red-400'
                            }`}>{c.creditRating || '-'}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRefresh(c.id); }}
                            disabled={refreshing}
                            className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-xs font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                          >
                            {refreshing ? 'Refreshing...' : 'Refresh Profile'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openRatingModal(c); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                          >
                            Update Rating
                          </button>
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

      {/* Update Rating Modal */}
      <Modal open={showRatingModal} onClose={() => setShowRatingModal(false)} title="Update Credit Rating">
        <div className="space-y-4">
          {ratingTarget && (
            <div className="bg-maritime-900 rounded-lg p-3">
              <p className="text-maritime-400 text-xs">Company</p>
              <p className="text-white text-sm font-medium mt-0.5">{ratingTarget.companyName}</p>
              <p className="text-maritime-500 text-xs mt-1">
                Current Rating: <span className={`font-bold ${
                  ratingTarget.current === 'A' ? 'text-green-400' :
                  ratingTarget.current === 'B' ? 'text-blue-400' :
                  ratingTarget.current === 'C' ? 'text-yellow-400' : 'text-red-400'
                }`}>{ratingTarget.current || 'N/A'}</span>
              </p>
            </div>
          )}
          <FormField label="New Credit Rating *">
            <select value={newRating} onChange={(e) => setNewRating(e.target.value)} className={selectClass}>
              {ratingOptions.map((r) => (
                <option key={r} value={r}>{r} - {r === 'A' ? 'Excellent' : r === 'B' ? 'Good' : r === 'C' ? 'Fair' : 'Poor'}</option>
              ))}
            </select>
          </FormField>
          <div className="flex items-center gap-3">
            {ratingOptions.map((r) => (
              <button
                key={r}
                onClick={() => setNewRating(r)}
                className={`w-10 h-10 rounded-lg text-sm font-bold border-2 transition-all ${
                  newRating === r
                    ? `${ratingBarColor[r]} text-white border-transparent scale-110`
                    : `bg-maritime-900 border-maritime-700 text-maritime-400 hover:border-maritime-500`
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <FormField label="Notes">
            <textarea value={ratingNotes} onChange={(e) => setRatingNotes(e.target.value)} rows={3} className={inputClass}
              placeholder="Reason for rating change..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowRatingModal(false)} className={btnSecondary}>Cancel</button>
            <button onClick={handleUpdateRating} disabled={updatingRating} className={btnPrimary}>
              {updatingRating ? 'Updating...' : 'Update Rating'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
