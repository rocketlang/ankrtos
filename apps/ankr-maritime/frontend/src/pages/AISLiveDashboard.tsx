import { useQuery } from '@apollo/client';
import { gql } from '../__generated__/gql';
import { useEffect, useState } from 'react';

const AIS_LIVE_DASHBOARD_QUERY = gql(`
  query AISLiveDashboard {
    aisLiveDashboard {
      totalPositions
      uniqueVessels
      averageSpeed
      coverage {
        total
        withNavigationStatus
        withRateOfTurn
        withPositionAccuracy
        withManeuverIndicator
        withDraught
        withDimensions
      }
      dataRange {
        oldest
        newest
        rangeHours
      }
      recentActivity {
        last5Minutes
        last15Minutes
        last1Hour
        last24Hours
      }
      navigationStatusBreakdown {
        status
        statusLabel
        count
        percentage
      }
      lastUpdated
    }
  }
`);

const AIS_RECENT_POSITIONS_QUERY = gql(`
  query AISRecentPositions($limit: Int) {
    aisRecentPositions(limit: $limit) {
      id
      vesselId
      latitude
      longitude
      speed
      heading
      navigationStatus
      timestamp
      destination
    }
  }
`);

export default function AISLiveDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10); // seconds
  const [countdown, setCountdown] = useState(refreshInterval);

  const { data, loading, error, refetch } = useQuery(AIS_LIVE_DASHBOARD_QUERY, {
    pollInterval: autoRefresh ? refreshInterval * 1000 : 0,
  });

  const { data: recentData, refetch: refetchRecent } = useQuery(AIS_RECENT_POSITIONS_QUERY, {
    variables: { limit: 20 },
    pollInterval: autoRefresh ? refreshInterval * 1000 : 0,
  });

  // Countdown timer for next refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval]);

  // Reset countdown when interval changes
  useEffect(() => {
    setCountdown(refreshInterval);
  }, [refreshInterval]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AIS Live Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const dashboard = data?.aisLiveDashboard;
  if (!dashboard) return null;

  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercent = (num: number) => `${num.toFixed(1)}%`;

  const coveragePercentage = (count: number) =>
    dashboard.coverage.total > 0
      ? ((count / dashboard.coverage.total) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">🛰️ AIS Live Dashboard</h1>
              <p className="text-blue-100">Real-time vessel tracking • Single source of truth</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100 mb-1">Last Updated</div>
              <div className="text-lg font-mono">
                {new Date(dashboard.lastUpdated).toLocaleTimeString()}
              </div>
              {autoRefresh && (
                <div className="text-xs text-blue-200 mt-1">
                  Next refresh in {countdown}s
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium">Auto-refresh</span>
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-1 border rounded"
              >
                <option value={5}>Every 5s</option>
                <option value={10}>Every 10s</option>
                <option value={30}>Every 30s</option>
                <option value={60}>Every 1m</option>
              </select>
            )}
          </div>
          <button
            onClick={() => {
              refetch();
              refetchRecent();
              setCountdown(refreshInterval);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            🔄 Refresh Now
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
            <div className="text-sm font-medium text-gray-600 mb-2">Total Positions</div>
            <div className="text-4xl font-bold text-blue-600">
              {formatNumber(dashboard.totalPositions)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Collected over {dashboard.dataRange.rangeHours.toFixed(1)} hours
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-600">
            <div className="text-sm font-medium text-gray-600 mb-2">Unique Vessels</div>
            <div className="text-4xl font-bold text-green-600">
              {formatNumber(dashboard.uniqueVessels)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Actively tracked worldwide
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-600">
            <div className="text-sm font-medium text-gray-600 mb-2">Average Speed</div>
            <div className="text-4xl font-bold text-purple-600">
              {dashboard.averageSpeed.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 mt-2">Knots (fleet-wide)</div>
          </div>
        </div>

        {/* Data Range */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📅 Data Coverage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Oldest Position</div>
              <div className="text-lg font-semibold text-gray-800">
                {dashboard.dataRange.oldest
                  ? new Date(dashboard.dataRange.oldest).toLocaleString()
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Newest Position</div>
              <div className="text-lg font-semibold text-gray-800">
                {dashboard.dataRange.newest
                  ? new Date(dashboard.dataRange.newest).toLocaleString()
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Time Range</div>
              <div className="text-lg font-semibold text-gray-800">
                {dashboard.dataRange.rangeHours.toFixed(1)} hours
              </div>
              <div className="text-xs text-gray-500">
                ({(dashboard.dataRange.rangeHours / 24).toFixed(1)} days)
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⚡ Recent Activity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(dashboard.recentActivity.last5Minutes)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Last 5 minutes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(dashboard.recentActivity.last15Minutes)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Last 15 minutes</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {formatNumber(dashboard.recentActivity.last1Hour)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Last 1 hour</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(dashboard.recentActivity.last24Hours)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Last 24 hours</div>
            </div>
          </div>
        </div>

        {/* Field Coverage */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Priority 1 Field Coverage
          </h2>
          <div className="space-y-4">
            {/* Navigation Status */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Navigation Status</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatNumber(dashboard.coverage.withNavigationStatus)} (
                  {coveragePercentage(dashboard.coverage.withNavigationStatus)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${coveragePercentage(dashboard.coverage.withNavigationStatus)}%`,
                  }}
                />
              </div>
            </div>

            {/* Rate of Turn */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Rate of Turn</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatNumber(dashboard.coverage.withRateOfTurn)} (
                  {coveragePercentage(dashboard.coverage.withRateOfTurn)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${coveragePercentage(dashboard.coverage.withRateOfTurn)}%`,
                  }}
                />
              </div>
            </div>

            {/* Position Accuracy */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Position Accuracy</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatNumber(dashboard.coverage.withPositionAccuracy)} (
                  {coveragePercentage(dashboard.coverage.withPositionAccuracy)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${coveragePercentage(dashboard.coverage.withPositionAccuracy)}%`,
                  }}
                />
              </div>
            </div>

            {/* Maneuver Indicator */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Maneuver Indicator</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatNumber(dashboard.coverage.withManeuverIndicator)} (
                  {coveragePercentage(dashboard.coverage.withManeuverIndicator)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${coveragePercentage(dashboard.coverage.withManeuverIndicator)}%`,
                  }}
                />
              </div>
            </div>

            {/* Draught */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Draught <span className="text-xs text-gray-500">(static field)</span>
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatNumber(dashboard.coverage.withDraught)} (
                  {coveragePercentage(dashboard.coverage.withDraught)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-orange-600 h-3 rounded-full transition-all"
                  style={{ width: `${coveragePercentage(dashboard.coverage.withDraught)}%` }}
                />
              </div>
            </div>

            {/* Vessel Dimensions */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Vessel Dimensions <span className="text-xs text-gray-500">(static fields)</span>
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatNumber(dashboard.coverage.withDimensions)} (
                  {coveragePercentage(dashboard.coverage.withDimensions)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-600 h-3 rounded-full transition-all"
                  style={{ width: `${coveragePercentage(dashboard.coverage.withDimensions)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Status Breakdown */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🧭 Navigation Status Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Label</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Count</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Percentage</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Distribution</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.navigationStatusBreakdown.map((item) => (
                  <tr key={item.status} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-800">{item.statusLabel}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatNumber(item.count)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatPercent(item.percentage)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Positions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🌊 Latest Vessel Positions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Timestamp</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Position</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Speed</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Heading</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Destination</th>
                </tr>
              </thead>
              <tbody>
                {recentData?.aisRecentPositions.slice(0, 20).map((pos) => (
                  <tr key={pos.id} className="border-b border-gray-100 hover:bg-blue-50">
                    <td className="py-2 px-3 text-gray-600 font-mono text-xs">
                      {new Date(pos.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 text-gray-800 font-mono text-xs">
                      {pos.latitude.toFixed(4)}, {pos.longitude.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-800">
                      {pos.speed?.toFixed(1) || '-'} kn
                    </td>
                    <td className="py-2 px-3 text-right text-gray-800">
                      {pos.heading !== null ? `${pos.heading}°` : '-'}
                    </td>
                    <td className="py-2 px-3">
                      {pos.navigationStatus !== null ? (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {pos.navigationStatus}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-800">{pos.destination || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
