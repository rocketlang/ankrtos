import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

const DASHBOARD_QUERY = gql`
  query Dashboard {
    dashboardStats {
      vesselCount portCount companyCount charterCount activeVoyageCount cargoCount
    }
    charters { id reference type status freightRate currency createdAt vesselId }
    enabledFeatures { key name tier }
    currentTier
    fleetSummary {
      totalVoyages completedVoyages activeVoyages
      totalRevenue totalCosts totalDemurrage totalDespatch netProfit currency
    }
    voyageChartData {
      voyageNumber vesselName status revenue costs demurrage despatch netResult
    }
    daCostBreakdown { category total }
    voyageTimeline {
      voyageNumber vesselName status etd eta atd ata departurePort arrivalPort
    }
    vesselPositions(limit: 100) {
      id vesselId speed timestamp
    }
    vesselCertificates {
      id vesselId name expiryDate status
    }
    voyages {
      id reference revenue createdAt
    }
  }
`;

const statCards = [
  { key: 'vesselCount', label: 'Vessels', href: '/vessels', color: 'border-blue-500' },
  { key: 'portCount', label: 'Ports', href: '/ports', color: 'border-cyan-500' },
  { key: 'companyCount', label: 'Companies', href: '/companies', color: 'border-purple-500' },
  { key: 'charterCount', label: 'Charters', href: '/chartering', color: 'border-yellow-500' },
  { key: 'activeVoyageCount', label: 'Active Voyages', href: '/voyages', color: 'border-green-500' },
  { key: 'cargoCount', label: 'Cargo Types', href: '/chartering', color: 'border-orange-500' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-gray-800 text-gray-400',
  on_subs: 'bg-yellow-900/50 text-yellow-400',
  fixed: 'bg-blue-900/50 text-blue-400',
  executed: 'bg-green-900/50 text-green-400',
  completed: 'bg-green-900/30 text-green-300',
};

const PIE_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1'];

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const voyageStatusBadge: Record<string, string> = {
  completed: 'bg-green-900/50 text-green-400',
  in_progress: 'bg-blue-900/50 text-blue-400',
  planned: 'bg-yellow-900/50 text-yellow-400',
  cancelled: 'bg-red-900/50 text-red-400',
};

export function Dashboard() {
  const { data, loading } = useQuery(DASHBOARD_QUERY);
  const stats = data?.dashboardStats;
  const fleet = data?.fleetSummary;
  const chartData = data?.voyageChartData ?? [];
  const daBreakdown = data?.daCostBreakdown ?? [];
  const timeline = data?.voyageTimeline ?? [];

  const isEmpty = !loading && stats && stats.vesselCount === 0 && stats.charterCount === 0;

  // Widget calculations
  const activeCharters = (data?.charters ?? []).filter(
    (ch: any) => ch.status === 'fixed' || ch.status === 'on_subs'
  );

  const vesselsAtSea = (data?.vesselPositions ?? [])
    .filter((pos: any) => {
      // Consider vessel at sea if speed > 1 knot and position updated within last 24 hours
      const isMoving = (pos.speed ?? 0) > 1;
      const isRecent = pos.timestamp
        ? (Date.now() - new Date(pos.timestamp).getTime()) < 24 * 60 * 60 * 1000
        : false;
      return isMoving && isRecent;
    })
    .reduce((acc: Set<string>, pos: any) => {
      acc.add(pos.vesselId);
      return acc;
    }, new Set()).size;

  const expiringCertificates = (data?.vesselCertificates ?? [])
    .filter((cert: any) => {
      if (!cert.expiryDate || cert.status === 'expired') return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(cert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

  const revenueThisMonth = (data?.voyages ?? [])
    .filter((v: any) => {
      if (!v.createdAt) return false;
      const voyageDate = new Date(v.createdAt);
      const now = new Date();
      return voyageDate.getMonth() === now.getMonth() &&
             voyageDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, v: any) => sum + (v.revenue ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mari8x</h1>
          <p className="text-maritime-400 text-sm mt-1">
            Maritime Operations Platform &mdash;{' '}
            <span className="text-green-400 capitalize">{data?.currentTier ?? 'free'}</span> tier
            &mdash; {data?.enabledFeatures?.length ?? 0} features enabled
          </p>
        </div>
        <Link to="/route-calculator" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md">
          Route Calculator
        </Link>
      </div>

      {/* Getting Started Card — shown when no data */}
      {isEmpty && (
        <div className="bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-maritime-800 border border-blue-800/50 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white">Welcome to Mari8x</h2>
          <p className="text-maritime-300 text-sm mt-1">Set up your maritime operations in 4 steps</p>
          <div className="grid grid-cols-4 gap-4 mt-4">
            {[
              { step: 1, label: 'Add Vessels', href: '/vessels', done: (stats?.vesselCount ?? 0) > 0 },
              { step: 2, label: 'Add Ports', href: '/ports', done: (stats?.portCount ?? 0) > 0 },
              { step: 3, label: 'Create Charter', href: '/chartering', done: (stats?.charterCount ?? 0) > 0 },
              { step: 4, label: 'First Voyage', href: '/voyages', done: (stats?.activeVoyageCount ?? 0) > 0 },
            ].map((s) => (
              <Link key={s.step} to={s.href}
                className="bg-maritime-800/50 border border-maritime-700/50 rounded-lg p-3 hover:bg-maritime-700/30 transition-colors text-center">
                <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${
                  s.done ? 'bg-green-500 text-white' : 'bg-maritime-700 text-maritime-400'
                }`}>
                  {s.done ? '\u2713' : s.step}
                </div>
                <p className={`text-xs mt-2 ${s.done ? 'text-green-400' : 'text-maritime-300'}`}>{s.label}</p>
              </Link>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <Link to="/vessels" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-md">
              Add Your First Vessel
            </Link>
            <Link to="/features" className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm px-4 py-2 rounded-md">
              Configure Features
            </Link>
          </div>
        </div>
      )}

      {/* Quick Workflow Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'New Charter', desc: 'Create a charter fixture', href: '/chartering', icon: '\u{1F4CB}', color: 'border-orange-500' },
          { label: 'Voyage Estimate', desc: 'Calculate TCE & profitability', href: '/voyage-estimate', icon: '\u{1F9ED}', color: 'border-blue-500' },
          { label: 'Track Voyages', desc: 'Monitor active voyages', href: '/voyages', icon: '\u{1F6A2}', color: 'border-green-500' },
          { label: 'DA Desk', desc: 'Manage disbursement accounts', href: '/da-desk', icon: '\u{1F4B0}', color: 'border-purple-500' },
        ].map((card) => (
          <Link key={card.href} to={card.href}
            className={`bg-maritime-800 border-l-4 ${card.color} rounded-lg p-4 hover:bg-maritime-700/50 transition-colors`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{card.icon}</span>
              <span className="text-white text-sm font-medium">{card.label}</span>
            </div>
            <p className="text-maritime-500 text-xs mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* Key Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Charters Widget */}
        <Link to="/chartering" className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/50 rounded-lg p-5 hover:border-blue-600/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xs text-blue-400 font-medium">LIVE</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {loading ? '-' : activeCharters.length}
          </p>
          <p className="text-sm text-blue-300 font-medium">Active Charters</p>
          <p className="text-xs text-maritime-400 mt-2">
            {activeCharters.filter((ch: any) => ch.status === 'fixed').length} fixed, {activeCharters.filter((ch: any) => ch.status === 'on_subs').length} on subs
          </p>
        </Link>

        {/* Vessels at Sea Widget */}
        <Link to="/vessel-positions" className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/50 rounded-lg p-5 hover:border-green-600/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-green-400 font-medium">AIS</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {loading ? '-' : vesselsAtSea}
          </p>
          <p className="text-sm text-green-300 font-medium">Vessels at Sea</p>
          <p className="text-xs text-maritime-400 mt-2">
            Currently in voyage (speed &gt; 1 kt)
          </p>
        </Link>

        {/* Expiring Certificates Alert Widget */}
        <Link to="/vessel-certificates" className={`bg-gradient-to-br ${expiringCertificates.length > 0 ? 'from-yellow-900/40 to-orange-800/20 border-yellow-700/50 hover:border-yellow-600/50' : 'from-maritime-800/40 to-maritime-700/20 border-maritime-700/50 hover:border-maritime-600/50'} border rounded-lg p-5 transition-colors`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`${expiringCertificates.length > 0 ? 'bg-yellow-500/20' : 'bg-maritime-600/20'} p-2 rounded-lg`}>
              <svg className={`w-5 h-5 ${expiringCertificates.length > 0 ? 'text-yellow-400' : 'text-maritime-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className={`text-xs font-medium ${expiringCertificates.length > 0 ? 'text-yellow-400' : 'text-maritime-400'}`}>30 DAYS</span>
          </div>
          <p className={`text-3xl font-bold mb-1 ${expiringCertificates.length > 0 ? 'text-yellow-300' : 'text-white'}`}>
            {loading ? '-' : expiringCertificates.length}
          </p>
          <p className={`text-sm font-medium ${expiringCertificates.length > 0 ? 'text-yellow-300' : 'text-maritime-300'}`}>
            Expiring Certificates
          </p>
          <p className="text-xs text-maritime-400 mt-2">
            {expiringCertificates.length > 0 ? 'Action required' : 'All certificates valid'}
          </p>
        </Link>

        {/* Revenue This Month Widget */}
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/50 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-purple-400 font-medium">
              {new Date().toLocaleString('default', { month: 'short' }).toUpperCase()}
            </span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {loading ? '-' : fmt(revenueThisMonth)}
          </p>
          <p className="text-sm text-purple-300 font-medium">Revenue This Month</p>
          <p className="text-xs text-maritime-400 mt-2">
            From {(data?.voyages ?? []).filter((v: any) => {
              if (!v.createdAt) return false;
              const voyageDate = new Date(v.createdAt);
              const now = new Date();
              return voyageDate.getMonth() === now.getMonth() &&
                     voyageDate.getFullYear() === now.getFullYear();
            }).length} voyages
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <Link key={card.key} to={card.href} className={`bg-maritime-800 border-l-4 ${card.color} rounded-lg p-4 hover:bg-maritime-700/50 transition-colors`}>
            <p className="text-maritime-400 text-xs font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{loading ? '-' : stats?.[card.key as keyof typeof stats] ?? 0}</p>
          </Link>
        ))}
      </div>

      {/* Fleet Financial Summary */}
      {fleet && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Revenue', value: fmt(fleet.totalRevenue), color: 'text-emerald-400', border: 'border-emerald-500' },
            { label: 'DA Costs', value: fmt(fleet.totalCosts), color: 'text-orange-400', border: 'border-orange-500' },
            { label: 'Demurrage', value: fmt(fleet.totalDemurrage), color: 'text-red-400', border: 'border-red-500' },
            { label: 'Despatch', value: fmt(fleet.totalDespatch), color: 'text-cyan-400', border: 'border-cyan-500' },
            { label: 'Net Profit', value: fmt(fleet.netProfit), color: fleet.netProfit >= 0 ? 'text-green-400' : 'text-red-400', border: fleet.netProfit >= 0 ? 'border-green-500' : 'border-red-500' },
          ].map((s) => (
            <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
              <p className="text-maritime-500 text-xs">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Cost Bar Chart */}
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
          <h2 className="text-sm font-medium text-white mb-4">Revenue vs Costs by Voyage</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="voyageNumber" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f2744', border: '1px solid #1e3a5f', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costs" name="DA Costs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="demurrage" name="Demurrage" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-maritime-500 text-sm text-center py-12">No voyage data</p>
          )}
        </div>

        {/* DA Cost Breakdown Pie Chart */}
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
          <h2 className="text-sm font-medium text-white mb-4">DA Cost Breakdown</h2>
          {daBreakdown.length > 0 ? (
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={260}>
                <PieChart>
                  <Pie
                    data={daBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    dataKey="total"
                    nameKey="category"
                    stroke="#0f2744"
                    strokeWidth={2}
                  >
                    {daBreakdown.map((_: unknown, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f2744', border: '1px solid #1e3a5f', borderRadius: '8px' }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {daBreakdown.map((item: { category: string; total: number }, i: number) => (
                  <div key={item.category} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-maritime-300 flex-1 capitalize">{item.category.replace(/_/g, ' ')}</span>
                    <span className="text-white font-mono">{fmt(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-maritime-500 text-sm text-center py-12">No DA data</p>
          )}
        </div>
      </div>

      {/* Voyage Timeline + Charters + Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Voyage Timeline */}
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">Voyage Timeline</h2>
            <Link to="/voyages" className="text-blue-400 text-xs hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-maritime-500 border-b border-maritime-700">
                  <th className="text-left py-2 pr-3">Voyage</th>
                  <th className="text-left py-2 pr-3">Vessel</th>
                  <th className="text-left py-2 pr-3">Route</th>
                  <th className="text-left py-2 pr-3">ETD</th>
                  <th className="text-left py-2 pr-3">ETA</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((v: Record<string, unknown>) => (
                  <tr key={v.voyageNumber as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                    <td className="py-2.5 pr-3 text-white font-mono">{v.voyageNumber as string}</td>
                    <td className="py-2.5 pr-3 text-maritime-300">{v.vesselName as string}</td>
                    <td className="py-2.5 pr-3 text-maritime-400">
                      {(v.departurePort as string) || '?'} → {(v.arrivalPort as string) || '?'}
                    </td>
                    <td className="py-2.5 pr-3 text-maritime-400">
                      {v.atd ? <span className="text-green-400">{fmtDate(v.atd as string)}</span> : fmtDate(v.etd as string)}
                    </td>
                    <td className="py-2.5 pr-3 text-maritime-400">
                      {v.ata ? <span className="text-green-400">{fmtDate(v.ata as string)}</span> : fmtDate(v.eta as string)}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${voyageStatusBadge[v.status as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {(v.status as string).replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Charters + Modules */}
        <div className="space-y-6">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-white">Active Charters</h2>
              <Link to="/chartering" className="text-blue-400 text-xs hover:underline">View All</Link>
            </div>
            {activeCharters.length === 0 && (
              <p className="text-maritime-500 text-xs">No active charters.</p>
            )}
            {activeCharters.slice(0, 5).map((ch: Record<string, unknown>) => (
              <div key={ch.id as string} className="flex items-center justify-between py-2 border-b border-maritime-700/50 last:border-0">
                <div>
                  <p className="text-white text-xs font-medium">{ch.reference as string}</p>
                  <p className="text-maritime-500 text-[10px] capitalize">{ch.type as string}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[(ch.status as string)] ?? 'bg-maritime-700 text-maritime-300'}`}>
                  {(ch.status as string).replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
            <h2 className="text-sm font-medium text-white mb-3">Platform Modules</h2>
            <div className="space-y-2">
              {[
                { name: 'Chartering', phase: 'Live', ok: true },
                { name: 'Voyage Ops', phase: 'Live', ok: true },
                { name: 'DA Desk', phase: 'Live', ok: true },
                { name: 'Financial Reports', phase: 'Live', ok: true },
                { name: 'Bill of Lading', phase: 'Live', ok: true },
                { name: 'Laytime', phase: 'Live', ok: true },
                { name: 'Activity Feed', phase: 'Live', ok: true },
                { name: 'Sea Routing', phase: 'Live', ok: true },
                { name: 'Claims', phase: 'Live', ok: true },
                { name: 'Voyage Estimate', phase: 'Live', ok: true },
                { name: 'Mari8xLLM', phase: 'Live', ok: true },
                { name: 'Bunkers', phase: 'Live', ok: true },
                { name: 'Crew', phase: 'Live', ok: true },
                { name: 'Document Vault', phase: 'Live', ok: true },
                { name: 'Alerts', phase: 'Live', ok: true },
                { name: 'ISM/ISPS Compliance', phase: 'Live', ok: true },
                { name: 'eBL Title Chain', phase: 'Live', ok: true },
              ].map((mod) => (
                <div key={mod.name} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${mod.ok ? 'bg-green-400' : 'bg-maritime-600'}`} />
                  <span className="text-xs text-maritime-300 flex-1">{mod.name}</span>
                  <span className={`text-[10px] ${mod.ok ? 'text-green-400' : 'text-maritime-500'}`}>{mod.phase}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
