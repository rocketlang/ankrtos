import { useQuery } from '@apollo/client';
import { gql } from '../__generated__/gql';
import { useEffect, useState } from 'react';

const AIS_DASHBOARD_QUERY = gql(`
  query AISLiveDashboard {
    dailyAISStats {
      totalPositions
      uniqueVessels
      avgPositionsPerShip
      shipsMovingNow
      shipsAtAnchor
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
  const [refreshInterval, setRefreshInterval] = useState(60); // seconds
  const [countdown, setCountdown] = useState(refreshInterval);

  const { data, loading, error, refetch } = useQuery(AIS_DASHBOARD_QUERY, {
    pollInterval: autoRefresh ? refreshInterval * 1000 : 0,
    errorPolicy: 'all',
  });

  const { data: recentData, loading: recentLoading, error: recentError, refetch: refetchRecent } = useQuery(AIS_RECENT_POSITIONS_QUERY, {
    variables: { limit: 50 },
    pollInterval: autoRefresh ? refreshInterval * 1000 : 0,
    errorPolicy: 'ignore',
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
      <div className="flex items-center justify-center h-screen bg-maritime-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-maritime-300">Loading AIS Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-maritime-950">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-maritime-300">Failed to load AIS data</p>
          <p className="text-maritime-500 text-sm mt-2">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const dashboard = data?.dailyAISStats;
  const recentPositions = recentData?.aisRecentPositions || [];

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen bg-maritime-950">
        <div className="text-center text-maritime-300">No AIS data available</div>
      </div>
    );
  }

  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div className="min-h-screen bg-maritime-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">🛰️ AIS Dashboard</h1>
              <p className="text-blue-100">Daily vessel tracking statistics</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100 mb-1">Last Updated</div>
              <div className="text-lg font-mono">
                {new Date(dashboard.lastUpdated).toLocaleString()}
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
        <div className="bg-maritime-900 rounded-lg shadow-lg p-4 flex items-center justify-between border border-maritime-700">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium text-maritime-200">Auto-refresh</span>
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-1 border rounded bg-maritime-800 text-maritime-200 border-maritime-700"
              >
                <option value={30}>Every 30s</option>
                <option value={60}>Every 1m</option>
                <option value={300}>Every 5m</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-maritime-900 rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
            <div className="text-sm font-medium text-maritime-400 mb-2">Total Positions</div>
            <div className="text-4xl font-bold text-blue-400">
              {formatNumber(dashboard.totalPositions)}
            </div>
            <div className="text-xs text-maritime-500 mt-2">
              AIS positions tracked
            </div>
          </div>

          <div className="bg-maritime-900 rounded-lg shadow-lg p-6 border-l-4 border-green-600">
            <div className="text-sm font-medium text-maritime-400 mb-2">Unique Vessels</div>
            <div className="text-4xl font-bold text-green-400">
              {formatNumber(dashboard.uniqueVessels)}
            </div>
            <div className="text-xs text-maritime-500 mt-2">
              Actively tracked
            </div>
          </div>

          <div className="bg-maritime-900 rounded-lg shadow-lg p-6 border-l-4 border-cyan-600">
            <div className="text-sm font-medium text-maritime-400 mb-2">Ships Moving</div>
            <div className="text-4xl font-bold text-cyan-400">
              {formatNumber(dashboard.shipsMovingNow)}
            </div>
            <div className="text-xs text-maritime-500 mt-2">
              Currently underway
            </div>
          </div>

          <div className="bg-maritime-900 rounded-lg shadow-lg p-6 border-l-4 border-orange-600">
            <div className="text-sm font-medium text-maritime-400 mb-2">At Anchor</div>
            <div className="text-4xl font-bold text-orange-400">
              {formatNumber(dashboard.shipsAtAnchor)}
            </div>
            <div className="text-xs text-maritime-500 mt-2">
              Currently anchored
            </div>
          </div>
        </div>

        {/* Avg Positions Per Ship */}
        <div className="bg-maritime-900 rounded-lg shadow-lg p-6 border border-maritime-700">
          <h2 className="text-xl font-bold text-maritime-200 mb-4">📊 Tracking Intensity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-maritime-400">Avg Positions per Ship</div>
              <div className="text-3xl font-bold text-purple-400 mt-2">
                {formatNumber(dashboard.avgPositionsPerShip)}
              </div>
              <div className="text-xs text-maritime-500 mt-1">
                Total: {formatNumber(dashboard.totalPositions)} positions
              </div>
            </div>
            <div>
              <div className="text-sm text-maritime-400">Moving Ships %</div>
              <div className="text-3xl font-bold text-green-400 mt-2">
                {((dashboard.shipsMovingNow / dashboard.uniqueVessels) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-maritime-500 mt-1">
                {formatNumber(dashboard.shipsMovingNow)} of {formatNumber(dashboard.uniqueVessels)}
              </div>
            </div>
            <div>
              <div className="text-sm text-maritime-400">Anchored Ships %</div>
              <div className="text-3xl font-bold text-orange-400 mt-2">
                {((dashboard.shipsAtAnchor / dashboard.uniqueVessels) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-maritime-500 mt-1">
                {formatNumber(dashboard.shipsAtAnchor)} of {formatNumber(dashboard.uniqueVessels)}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Positions Table */}
        <div className="bg-maritime-900 rounded-lg shadow-lg p-6 border border-maritime-700">
          <h2 className="text-xl font-bold text-maritime-200 mb-4">🌊 Recent Vessel Positions</h2>
          {recentLoading && recentPositions.length === 0 ? (
            <div className="text-center text-maritime-400 py-8">
              <div className="animate-pulse">Loading recent positions...</div>
            </div>
          ) : recentError && recentPositions.length === 0 ? (
            <div className="text-center text-orange-400 py-8">
              Recent positions temporarily unavailable
            </div>
          ) : recentPositions.length === 0 ? (
            <div className="text-center text-maritime-400 py-8">
              No recent positions available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-maritime-700">
                    <th className="text-left py-3 px-4 text-maritime-300 font-semibold">Timestamp</th>
                    <th className="text-left py-3 px-4 text-maritime-300 font-semibold">Position</th>
                    <th className="text-right py-3 px-4 text-maritime-300 font-semibold">Speed (kn)</th>
                    <th className="text-right py-3 px-4 text-maritime-300 font-semibold">Heading</th>
                    <th className="text-center py-3 px-4 text-maritime-300 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-maritime-300 font-semibold">Destination</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPositions.map((pos, idx) => (
                    <tr
                      key={pos.id}
                      className="border-b border-maritime-800 hover:bg-maritime-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-maritime-400 font-mono text-xs">
                        {new Date(pos.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-maritime-200 font-mono text-xs">
                        {pos.latitude.toFixed(4)}°, {pos.longitude.toFixed(4)}°
                      </td>
                      <td className="py-3 px-4 text-right text-cyan-400 font-semibold">
                        {pos.speed?.toFixed(1) || '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-purple-400 font-semibold">
                        {pos.heading !== null ? `${pos.heading}°` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {pos.navigationStatus !== null ? (
                          <span className="inline-block px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-xs">
                            {pos.navigationStatus}
                          </span>
                        ) : (
                          <span className="text-maritime-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-maritime-300 text-xs truncate max-w-xs">
                        {pos.destination || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
