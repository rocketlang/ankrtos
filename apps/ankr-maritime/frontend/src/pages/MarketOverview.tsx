import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;

const TONNAGE_HEATMAPS = gql`
  query TonnageHeatmaps {
    tonnageHeatmaps {
      id snapshotDate region vesselType availableCount onPassageCount
      totalCount demandCount supplyDemandRatio avgRate weekOverWeek
    }
  }
`;

const FIXTURE_PERFORMANCE = gql`
  query FixturePerformance {
    fixturePerformanceSummary {
      totalFixtures totalRevenue avgTce avgLaytime avgDemurrage
    }
  }
`;

const FIXTURE_ANALYTICS = gql`
  query FixtureAnalytics {
    fixtureAnalytics {
      id period vesselType route fixtureCount totalRevenue
      avgFreightRate avgTce marketShare winRate
    }
  }
`;

const GENERATE_TONNAGE_SNAPSHOT = gql`
  mutation GenerateTonnageSnapshot {
    generateTonnageSnapshot { id snapshotDate }
  }
`;

const GENERATE_FIXTURE_ANALYTICS = gql`
  mutation GenerateFixtureAnalytics {
    generateFixtureAnalytics { id period }
  }
`;

type HeatmapEntry = {
  id: string;
  snapshotDate: string;
  region: string;
  vesselType: string;
  availableCount: number;
  onPassageCount: number;
  totalCount: number;
  demandCount: number;
  supplyDemandRatio: number;
  avgRate: number;
  weekOverWeek: number;
};

type FixturePerf = {
  totalFixtures: number;
  totalRevenue: number;
  avgTce: number;
  avgLaytime: number;
  avgDemurrage: number;
};

type FixtureAnalytic = {
  id: string;
  period: string;
  vesselType: string;
  route: string;
  fixtureCount: number;
  totalRevenue: number;
  avgFreightRate: number;
  avgTce: number;
  marketShare: number;
  winRate: number;
};

function fmtMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtNum(n: number, decimals = 1): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function getRatioColor(ratio: number): string {
  if (ratio >= 1.3) return 'bg-green-900/60 text-green-400';
  if (ratio >= 1.1) return 'bg-green-900/30 text-green-300';
  if (ratio >= 0.9) return 'bg-maritime-700 text-maritime-300';
  if (ratio >= 0.7) return 'bg-red-900/30 text-red-300';
  return 'bg-red-900/60 text-red-400';
}

function getRatioBadgeColor(ratio: number): string {
  if (ratio >= 1.3) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (ratio >= 1.1) return 'bg-green-500/10 text-green-300 border-green-500/20';
  if (ratio >= 0.9) return 'bg-maritime-600/30 text-maritime-300 border-maritime-600/30';
  if (ratio >= 0.7) return 'bg-red-500/10 text-red-300 border-red-500/20';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

function getCellIntensity(ratio: number): string {
  if (ratio >= 1.5) return 'bg-green-900/50';
  if (ratio >= 1.2) return 'bg-green-900/30';
  if (ratio >= 1.0) return 'bg-green-900/15';
  if (ratio >= 0.8) return 'bg-red-900/15';
  if (ratio >= 0.6) return 'bg-red-900/30';
  return 'bg-red-900/50';
}

export function MarketOverview() {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'fixtures'>('heatmap');

  const { data: heatmapData, loading: heatmapLoading, refetch: refetchHeatmap } = useQuery(TONNAGE_HEATMAPS);
  const { data: perfData, loading: perfLoading } = useQuery(FIXTURE_PERFORMANCE);
  const { data: analyticsData, loading: analyticsLoading, refetch: refetchAnalytics } = useQuery(FIXTURE_ANALYTICS);

  const [generateSnapshot, { loading: generatingSnapshot }] = useMutation(GENERATE_TONNAGE_SNAPSHOT);
  const [generateAnalytics, { loading: generatingAnalytics }] = useMutation(GENERATE_FIXTURE_ANALYTICS);

  const heatmapEntries: HeatmapEntry[] = heatmapData?.tonnageHeatmaps ?? [];
  const perf: FixturePerf | null = perfData?.fixturePerformanceSummary ?? null;
  const analytics: FixtureAnalytic[] = analyticsData?.fixtureAnalytics ?? [];

  // Build heatmap grid: regions as rows, vessel types as columns
  const regions = [...new Set(heatmapEntries.map((h) => h.region))].sort();
  const vesselTypes = [...new Set(heatmapEntries.map((h) => h.vesselType))].sort();

  const heatmapGrid: Record<string, Record<string, HeatmapEntry | undefined>> = {};
  regions.forEach((region) => {
    heatmapGrid[region] = {};
    vesselTypes.forEach((vt) => {
      heatmapGrid[region][vt] = heatmapEntries.find(
        (h) => h.region === region && h.vesselType === vt
      );
    });
  });

  // Route breakdown (aggregated from analytics)
  const routeBreakdown: Record<string, { route: string; fixtures: number; revenue: number; avgRate: number; avgTce: number; winRate: number; marketShare: number }> = {};
  analytics.forEach((a) => {
    if (!routeBreakdown[a.route]) {
      routeBreakdown[a.route] = { route: a.route, fixtures: 0, revenue: 0, avgRate: 0, avgTce: 0, winRate: 0, marketShare: 0 };
    }
    const rb = routeBreakdown[a.route];
    rb.fixtures += a.fixtureCount;
    rb.revenue += a.totalRevenue;
    rb.avgRate = (rb.avgRate + a.avgFreightRate) / 2 || a.avgFreightRate;
    rb.avgTce = (rb.avgTce + a.avgTce) / 2 || a.avgTce;
    rb.winRate = (rb.winRate + a.winRate) / 2 || a.winRate;
    rb.marketShare = (rb.marketShare + a.marketShare) / 2 || a.marketShare;
  });
  const routes = Object.values(routeBreakdown).sort((a, b) => b.revenue - a.revenue);

  // Vessel type breakdown (aggregated from analytics)
  const vtBreakdown: Record<string, { vesselType: string; fixtures: number; revenue: number; avgRate: number }> = {};
  analytics.forEach((a) => {
    if (!vtBreakdown[a.vesselType]) {
      vtBreakdown[a.vesselType] = { vesselType: a.vesselType, fixtures: 0, revenue: 0, avgRate: 0 };
    }
    const vt = vtBreakdown[a.vesselType];
    vt.fixtures += a.fixtureCount;
    vt.revenue += a.totalRevenue;
    vt.avgRate = (vt.avgRate + a.avgFreightRate) / 2 || a.avgFreightRate;
  });
  const vesselTypeList = Object.values(vtBreakdown).sort((a, b) => b.revenue - a.revenue);

  const handleGenerateSnapshot = async () => {
    await generateSnapshot();
    refetchHeatmap();
  };

  const handleGenerateAnalytics = async () => {
    await generateAnalytics();
    refetchAnalytics();
  };

  const isLoading = heatmapLoading || perfLoading || analyticsLoading;

  const tabClass = (tab: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      activeTab === tab
        ? 'bg-maritime-700 text-white'
        : 'text-maritime-400 hover:text-maritime-300 hover:bg-maritime-800'
    }`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Market Overview</h1>
          <p className="text-maritime-400 text-sm mt-1">
            Tonnage supply/demand heatmap and fixture performance analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateSnapshot}
            disabled={generatingSnapshot}
            className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {generatingSnapshot ? 'Generating...' : 'Generate Snapshot'}
          </button>
          <button
            onClick={handleGenerateAnalytics}
            disabled={generatingAnalytics}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {generatingAnalytics ? 'Refreshing...' : 'Refresh Analytics'}
          </button>
        </div>
      </div>

      {isLoading && <p className="text-maritime-400 text-sm">Loading market data...</p>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-xs uppercase tracking-wide">Total Fixtures</p>
          <p className="text-2xl font-bold text-white mt-2">
            {perf ? perf.totalFixtures.toLocaleString() : '0'}
          </p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-xs uppercase tracking-wide">Total Revenue</p>
          <p className="text-2xl font-bold text-green-400 mt-2">
            {perf ? fmtMoney(perf.totalRevenue) : '$0'}
          </p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-xs uppercase tracking-wide">Avg TCE</p>
          <p className="text-2xl font-bold text-blue-400 mt-2">
            {perf ? `$${fmtNum(perf.avgTce, 0)}` : '$0'}
          </p>
          <p className="text-maritime-400 text-xs mt-1">per day</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-xs uppercase tracking-wide">Avg Laytime</p>
          <p className="text-2xl font-bold text-yellow-400 mt-2">
            {perf ? fmtNum(perf.avgLaytime) : '0'}
          </p>
          <p className="text-maritime-400 text-xs mt-1">days</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-xs uppercase tracking-wide">Avg Demurrage</p>
          <p className="text-2xl font-bold text-red-400 mt-2">
            {perf ? fmtMoney(perf.avgDemurrage) : '$0'}
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('heatmap')} className={tabClass('heatmap')}>
          Tonnage Heatmap
        </button>
        <button onClick={() => setActiveTab('fixtures')} className={tabClass('fixtures')}>
          Fixture Analytics
        </button>
      </div>

      {/* Tonnage Heatmap Section */}
      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          {heatmapEntries.length === 0 && !heatmapLoading && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
              <p className="text-maritime-500 text-sm">No tonnage heatmap data available.</p>
              <p className="text-maritime-600 text-xs mt-2">
                Click "Generate Snapshot" to create the latest supply/demand snapshot.
              </p>
            </div>
          )}

          {heatmapEntries.length > 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-maritime-700 flex items-center justify-between">
                <h3 className="text-white font-medium text-sm">
                  Supply / Demand Heatmap
                </h3>
                <div className="flex items-center gap-4 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-green-900/50" />
                    <span className="text-maritime-400">Oversupply (ratio &gt; 1.0)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-red-900/50" />
                    <span className="text-maritime-400">Undersupply (ratio &lt; 1.0)</span>
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                      <th className="px-4 py-3 text-left font-medium sticky left-0 bg-maritime-800 z-10">Region</th>
                      {vesselTypes.map((vt) => (
                        <th key={vt} className="px-4 py-3 text-center font-medium capitalize min-w-[140px]">
                          {vt.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {regions.map((region) => (
                      <tr key={region} className="border-b border-maritime-700/50">
                        <td className="px-4 py-3 text-white font-medium sticky left-0 bg-maritime-800 z-10 capitalize">
                          {region.replace(/_/g, ' ')}
                        </td>
                        {vesselTypes.map((vt) => {
                          const cell = heatmapGrid[region][vt];
                          if (!cell) {
                            return (
                              <td key={vt} className="px-4 py-3 text-center">
                                <span className="text-maritime-600 text-xs">-</span>
                              </td>
                            );
                          }
                          return (
                            <td key={vt} className={`px-3 py-2 text-center ${getCellIntensity(cell.supplyDemandRatio)}`}>
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-white text-sm font-bold">
                                  {cell.availableCount}
                                </span>
                                <span className="text-maritime-400 text-[10px]">
                                  of {cell.totalCount} total
                                </span>
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${getRatioBadgeColor(cell.supplyDemandRatio)}`}>
                                  {cell.supplyDemandRatio.toFixed(2)}x
                                </span>
                                {cell.weekOverWeek !== 0 && (
                                  <span className={`text-[10px] ${cell.weekOverWeek > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {cell.weekOverWeek > 0 ? '+' : ''}{cell.weekOverWeek.toFixed(1)}% WoW
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rate Overview from Heatmap */}
          {heatmapEntries.length > 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-maritime-700">
                <h3 className="text-white font-medium text-sm">Average Rates by Region &amp; Type</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                    <th className="px-4 py-3 text-left font-medium">Region</th>
                    <th className="px-4 py-3 text-left font-medium">Vessel Type</th>
                    <th className="px-4 py-3 text-right font-medium">Available</th>
                    <th className="px-4 py-3 text-right font-medium">On Passage</th>
                    <th className="px-4 py-3 text-right font-medium">Demand</th>
                    <th className="px-4 py-3 text-right font-medium">Avg Rate</th>
                    <th className="px-4 py-3 text-center font-medium">S/D Ratio</th>
                    <th className="px-4 py-3 text-right font-medium">WoW</th>
                  </tr>
                </thead>
                <tbody>
                  {heatmapEntries.map((h) => (
                    <tr key={h.id} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                      <td className="px-4 py-3 text-white capitalize">{h.region.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-maritime-300 capitalize">{h.vesselType.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-right text-white font-mono text-xs">{h.availableCount}</td>
                      <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">{h.onPassageCount}</td>
                      <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">{h.demandCount}</td>
                      <td className="px-4 py-3 text-right text-white font-mono text-xs">{fmtMoney(h.avgRate)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRatioColor(h.supplyDemandRatio)}`}>
                          {h.supplyDemandRatio.toFixed(2)}x
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        <span className={h.weekOverWeek > 0 ? 'text-green-400' : h.weekOverWeek < 0 ? 'text-red-400' : 'text-maritime-500'}>
                          {h.weekOverWeek > 0 ? '+' : ''}{h.weekOverWeek.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {heatmapEntries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-maritime-500">
                        No heatmap data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Fixture Analytics Section */}
      {activeTab === 'fixtures' && (
        <div className="space-y-6">
          {analytics.length === 0 && !analyticsLoading && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
              <p className="text-maritime-500 text-sm">No fixture analytics data available.</p>
              <p className="text-maritime-600 text-xs mt-2">
                Click "Refresh Analytics" to generate the latest fixture performance data.
              </p>
            </div>
          )}

          {/* Route Breakdown */}
          {routes.length > 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-maritime-700">
                <h3 className="text-white font-medium text-sm">Route Breakdown</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-maritime-400 text-xs text-left border-b border-maritime-700">
                    <th className="px-4 py-3 font-medium">Route</th>
                    <th className="px-4 py-3 font-medium text-right">Fixtures</th>
                    <th className="px-4 py-3 font-medium text-right">Revenue</th>
                    <th className="px-4 py-3 font-medium text-right">Avg Rate</th>
                    <th className="px-4 py-3 font-medium text-right">TCE</th>
                    <th className="px-4 py-3 font-medium text-right">Win Rate</th>
                    <th className="px-4 py-3 font-medium text-right">Mkt Share</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr key={r.route} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                      <td className="px-4 py-3 text-white font-medium">{r.route || 'Unknown'}</td>
                      <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">{r.fixtures}</td>
                      <td className="px-4 py-3 text-right text-white font-mono text-xs">{fmtMoney(r.revenue)}</td>
                      <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">{fmtMoney(r.avgRate)}</td>
                      <td className="px-4 py-3 text-right text-blue-400 font-mono text-xs">${fmtNum(r.avgTce, 0)}/d</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-medium ${
                          r.winRate >= 50 ? 'text-green-400' : r.winRate >= 30 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {r.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-maritime-900 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${Math.min(r.marketShare, 100)}%` }}
                            />
                          </div>
                          <span className="text-maritime-300 text-xs font-mono w-12 text-right">
                            {r.marketShare.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Vessel Type Breakdown */}
          {vesselTypeList.length > 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-maritime-700">
                <h3 className="text-white font-medium text-sm">Vessel Type Breakdown</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-maritime-400 text-xs text-left border-b border-maritime-700">
                    <th className="px-4 py-3 font-medium">Vessel Type</th>
                    <th className="px-4 py-3 font-medium text-right">Fixtures</th>
                    <th className="px-4 py-3 font-medium text-right">Revenue</th>
                    <th className="px-4 py-3 font-medium text-right">Avg Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {vesselTypeList.map((vt) => {
                    const totalRev = vesselTypeList.reduce((s, v) => s + v.revenue, 0);
                    const pct = totalRev > 0 ? (vt.revenue / totalRev) * 100 : 0;
                    return (
                      <tr key={vt.vesselType} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                        <td className="px-4 py-3 text-white font-medium capitalize">
                          <div className="flex items-center gap-3">
                            <span>{vt.vesselType.replace(/_/g, ' ')}</span>
                            <span className="text-maritime-500 text-[10px]">({pct.toFixed(1)}% of revenue)</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">{vt.fixtures}</td>
                        <td className="px-4 py-3 text-right text-white font-mono text-xs">{fmtMoney(vt.revenue)}</td>
                        <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">{fmtMoney(vt.avgRate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Raw Fixture Analytics Table */}
          {analytics.length > 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-maritime-700 flex items-center justify-between">
                <h3 className="text-white font-medium text-sm">Detailed Fixture Analytics</h3>
                <span className="text-maritime-400 text-xs">{analytics.length} entries</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-maritime-400 text-xs text-left border-b border-maritime-700">
                      <th className="px-4 py-3 font-medium">Period</th>
                      <th className="px-4 py-3 font-medium">Vessel Type</th>
                      <th className="px-4 py-3 font-medium">Route</th>
                      <th className="px-4 py-3 font-medium text-right">Fixtures</th>
                      <th className="px-4 py-3 font-medium text-right">Revenue</th>
                      <th className="px-4 py-3 font-medium text-right">Avg Freight</th>
                      <th className="px-4 py-3 font-medium text-right">Avg TCE</th>
                      <th className="px-4 py-3 font-medium text-right">Win Rate</th>
                      <th className="px-4 py-3 font-medium text-right">Mkt Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((a) => (
                      <tr key={a.id} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                        <td className="px-4 py-3 text-white text-xs">{a.period}</td>
                        <td className="px-4 py-3 text-maritime-300 capitalize text-xs">{a.vesselType.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-maritime-300 text-xs">{a.route || '-'}</td>
                        <td className="px-4 py-3 text-right text-white font-mono text-xs">{a.fixtureCount}</td>
                        <td className="px-4 py-3 text-right text-white font-mono text-xs">{fmtMoney(a.totalRevenue)}</td>
                        <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">{fmtMoney(a.avgFreightRate)}</td>
                        <td className="px-4 py-3 text-right text-blue-400 font-mono text-xs">${fmtNum(a.avgTce, 0)}/d</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs font-medium ${
                            a.winRate >= 50 ? 'text-green-400' : a.winRate >= 30 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {a.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-maritime-300 text-xs font-mono">
                          {a.marketShare.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
