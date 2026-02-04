import { useQuery, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;

const ANALYTICS_DATA = gql`
  query AnalyticsData {
    cargoEnquiries { id status createdAt }
    charters { id charterNumber status freightRate cargoQuantity commission }
    voyages { id status }
  }
`;

type Enquiry = { id: string; status: string; createdAt: string };
type Charter = { id: string; charterNumber: string; status: string; freightRate: number; cargoQuantity: number; commission: number };
type Voyage = { id: string; status: string };

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function pct(a: number, b: number) {
  if (b === 0) return '0%';
  return (a / b * 100).toFixed(1) + '%';
}

const pipelineStages = [
  { key: 'enquiry', label: 'Enquiries', statuses: ['new', 'open', 'enquiry'], color: 'bg-blue-500' },
  { key: 'working', label: 'Working', statuses: ['working', 'in_progress', 'negotiation'], color: 'bg-blue-400' },
  { key: 'fixed', label: 'Fixed', statuses: ['fixed', 'confirmed', 'awarded'], color: 'bg-teal-500' },
  { key: 'executing', label: 'Executing', statuses: ['executing', 'in_transit', 'loading', 'discharging'], color: 'bg-teal-400' },
  { key: 'complete', label: 'Complete', statuses: ['complete', 'completed', 'closed'], color: 'bg-green-500' },
];

export function Analytics() {
  const { data, loading, error } = useQuery(ANALYTICS_DATA);
  const [section, setSection] = useState<'pipeline' | 'commission' | 'port_time'>('pipeline');

  const enquiries: Enquiry[] = data?.cargoEnquiries ?? [];
  const charters: Charter[] = data?.charters ?? [];
  const voyages: Voyage[] = data?.voyages ?? [];

  // Pipeline counts based on enquiry statuses
  const stageCounts = pipelineStages.map((stage) => {
    const count = enquiries.filter((e) => stage.statuses.includes(e.status)).length;
    return { ...stage, count };
  });
  const totalPipeline = Math.max(stageCounts.reduce((sum, s) => sum + s.count, 0), 1);

  // Commission calculations
  const charterCommissions = charters.map((c) => {
    const revenue = (c.freightRate || 0) * (c.cargoQuantity || 0);
    const commPct = c.commission || 0;
    const commAmt = revenue * (commPct / 100);
    return { ...c, revenue, commPct, commAmt };
  });
  const totalRevenue = charterCommissions.reduce((s, c) => s + c.revenue, 0);
  const totalCommission = charterCommissions.reduce((s, c) => s + c.commAmt, 0);

  // Voyage stats
  const activeVoyages = voyages.filter((v) => !['completed', 'closed', 'cancelled'].includes(v.status)).length;
  const completedVoyages = voyages.filter((v) => ['completed', 'closed'].includes(v.status)).length;

  // Conversion rate: enquiries that became fixed or beyond
  const fixedAndBeyond = enquiries.filter((e) =>
    ['fixed', 'confirmed', 'awarded', 'executing', 'in_transit', 'loading', 'discharging', 'complete', 'completed', 'closed'].includes(e.status)
  ).length;
  const conversionRate = enquiries.length > 0 ? (fixedAndBeyond / enquiries.length * 100) : 0;

  const sectionClass = (s: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${section === s ? 'bg-maritime-700 text-white' : 'text-maritime-400 hover:text-maritime-300 hover:bg-maritime-800'}`;

  if (loading) return <div className="p-6"><p className="text-maritime-400">Loading analytics...</p></div>;
  if (error) return <div className="p-6"><p className="text-red-400">Error: {error.message}</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-maritime-400 text-sm mt-1">Pipeline analysis, commission tracking, and operational insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
          <p className="text-maritime-500 text-xs uppercase tracking-wide">Total Revenue</p>
          <p className="text-2xl font-bold text-white mt-2">{fmt(totalRevenue)}</p>
          <p className="text-maritime-400 text-xs mt-1">{charters.length} charters</p>
        </div>
        <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
          <p className="text-maritime-500 text-xs uppercase tracking-wide">Total Commission</p>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{fmt(totalCommission)}</p>
          <p className="text-maritime-400 text-xs mt-1">
            {totalRevenue > 0 ? (totalCommission / totalRevenue * 100).toFixed(2) : '0'}% avg rate
          </p>
        </div>
        <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
          <p className="text-maritime-500 text-xs uppercase tracking-wide">Conversion Rate</p>
          <p className="text-2xl font-bold text-blue-400 mt-2">{conversionRate.toFixed(1)}%</p>
          <p className="text-maritime-400 text-xs mt-1">{fixedAndBeyond} of {enquiries.length} enquiries</p>
        </div>
        <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
          <p className="text-maritime-500 text-xs uppercase tracking-wide">Active Voyages</p>
          <p className="text-2xl font-bold text-teal-400 mt-2">{activeVoyages}</p>
          <p className="text-maritime-400 text-xs mt-1">{completedVoyages} completed</p>
        </div>
      </div>

      {/* Section Nav */}
      <div className="flex gap-2">
        <button onClick={() => setSection('pipeline')} className={sectionClass('pipeline')}>Pipeline</button>
        <button onClick={() => setSection('commission')} className={sectionClass('commission')}>Commission Income</button>
        <button onClick={() => setSection('port_time')} className={sectionClass('port_time')}>Port Time</button>
      </div>

      {/* Pipeline Section */}
      {section === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-maritime-800 rounded-lg p-6 border border-maritime-700">
            <h3 className="text-white font-medium mb-6">Chartering Pipeline Funnel</h3>
            <div className="space-y-3">
              {stageCounts.map((stage, i) => {
                const widthPct = Math.max((stage.count / totalPipeline) * 100, 8);
                const prevCount = i > 0 ? stageCounts[i - 1].count : 0;
                const convRate = i > 0 && prevCount > 0 ? pct(stage.count, prevCount) : null;
                return (
                  <div key={stage.key}>
                    <div className="flex items-center gap-4">
                      <div className="w-28 text-right">
                        <span className="text-maritime-300 text-sm">{stage.label}</span>
                      </div>
                      <div className="flex-1 relative">
                        <div
                          className={`${stage.color} h-10 rounded-md flex items-center px-4 transition-all`}
                          style={{ width: `${widthPct}%`, minWidth: '60px' }}
                        >
                          <span className="text-white font-bold text-sm">{stage.count}</span>
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        {convRate && (
                          <span className="text-maritime-400 text-xs">{convRate}</span>
                        )}
                      </div>
                    </div>
                    {i < stageCounts.length - 1 && (
                      <div className="flex items-center gap-4 ml-32 my-1">
                        <svg className="w-4 h-4 text-maritime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        {i + 1 < stageCounts.length && stageCounts[i].count > 0 && (
                          <span className="text-maritime-500 text-[10px]">
                            {pct(stageCounts[i + 1].count, stageCounts[i].count)} conversion
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stage breakdown table */}
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                  <th className="text-left px-4 py-3">Stage</th>
                  <th className="text-right px-4 py-3">Count</th>
                  <th className="text-right px-4 py-3">% of Total</th>
                  <th className="text-right px-4 py-3">Stage Conversion</th>
                </tr>
              </thead>
              <tbody>
                {stageCounts.map((stage, i) => (
                  <tr key={stage.key} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                    <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-sm ${stage.color}`} />
                      {stage.label}
                    </td>
                    <td className="px-4 py-3 text-right text-maritime-300 font-mono">{stage.count}</td>
                    <td className="px-4 py-3 text-right text-maritime-300">{pct(stage.count, totalPipeline)}</td>
                    <td className="px-4 py-3 text-right text-maritime-300">
                      {i > 0 && stageCounts[i - 1].count > 0 ? pct(stage.count, stageCounts[i - 1].count) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commission Income Section */}
      {section === 'commission' && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-maritime-700">
            <h3 className="text-white font-medium text-sm">Commission Income by Charter</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                <th className="text-left px-4 py-3">Charter #</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Freight Rate</th>
                <th className="text-right px-4 py-3">Cargo Qty</th>
                <th className="text-right px-4 py-3">Revenue</th>
                <th className="text-right px-4 py-3">Comm %</th>
                <th className="text-right px-4 py-3">Commission</th>
              </tr>
            </thead>
            <tbody>
              {charterCommissions.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-maritime-500">No charter data available</td></tr>
              )}
              {charterCommissions.map((c) => (
                <tr key={c.id} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                  <td className="px-4 py-3 text-white font-mono text-xs">{c.charterNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      c.status === 'fixed' || c.status === 'confirmed' ? 'bg-green-900/50 text-green-400' :
                      c.status === 'executing' ? 'bg-teal-900/50 text-teal-400' :
                      c.status === 'completed' || c.status === 'closed' ? 'bg-blue-900/50 text-blue-400' :
                      'bg-maritime-700 text-maritime-300'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">
                    ${(c.freightRate || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">
                    {(c.cargoQuantity || 0).toLocaleString()} MT
                  </td>
                  <td className="px-4 py-3 text-right text-white font-mono text-xs">{fmt(c.revenue)}</td>
                  <td className="px-4 py-3 text-right text-maritime-300 text-xs">{c.commPct.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-mono text-xs font-medium">{fmt(c.commAmt)}</td>
                </tr>
              ))}
              {charterCommissions.length > 0 && (
                <tr className="border-t-2 border-maritime-600 bg-maritime-900/30">
                  <td colSpan={4} className="px-4 py-3 text-white font-bold">Totals</td>
                  <td className="px-4 py-3 text-right text-white font-bold font-mono">{fmt(totalRevenue)}</td>
                  <td className="px-4 py-3 text-right text-maritime-300 text-xs">
                    {totalRevenue > 0 ? (totalCommission / totalRevenue * 100).toFixed(2) : '0'}%
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-bold font-mono">{fmt(totalCommission)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Port Time Section */}
      {section === 'port_time' && (
        <div className="space-y-4">
          <div className="bg-maritime-800 rounded-lg p-6 border border-maritime-700">
            <h3 className="text-white font-medium mb-4">Voyage Status Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const statusGroups: Record<string, { label: string; color: string; statuses: string[] }> = {
                  active: { label: 'Active / In Transit', color: 'text-teal-400', statuses: ['in_transit', 'executing', 'loading', 'discharging'] },
                  planning: { label: 'Planning', color: 'text-blue-400', statuses: ['planned', 'draft', 'pending'] },
                  completed: { label: 'Completed', color: 'text-green-400', statuses: ['completed', 'closed'] },
                  other: { label: 'Cancelled / Other', color: 'text-maritime-400', statuses: ['cancelled', 'delayed'] },
                };
                return Object.entries(statusGroups).map(([key, group]) => {
                  const count = voyages.filter((v) => group.statuses.includes(v.status)).length;
                  return (
                    <div key={key} className="bg-maritime-900/50 rounded-lg p-4 border border-maritime-700">
                      <p className="text-maritime-500 text-xs">{group.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${group.color}`}>{count}</p>
                      <p className="text-maritime-500 text-xs mt-1">
                        {voyages.length > 0 ? pct(count, voyages.length) : '0%'} of total
                      </p>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="bg-maritime-800 rounded-lg p-6 border border-maritime-700">
            <h3 className="text-white font-medium mb-4">Fleet Utilization Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Voyages', value: voyages.length, color: 'bg-blue-500' },
                { label: 'Active', value: activeVoyages, color: 'bg-teal-500' },
                { label: 'Completed', value: completedVoyages, color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-32 text-maritime-300 text-sm">{item.label}</div>
                  <div className="flex-1 bg-maritime-900 rounded-full h-6 overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full flex items-center px-3 transition-all`}
                      style={{ width: `${voyages.length > 0 ? Math.max((item.value / voyages.length) * 100, 4) : 4}%` }}
                    >
                      <span className="text-white text-xs font-medium">{item.value}</span>
                    </div>
                  </div>
                  <div className="w-16 text-right text-maritime-400 text-xs">
                    {voyages.length > 0 ? pct(item.value, voyages.length) : '0%'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
