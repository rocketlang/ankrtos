/**
 * FLEET DASHBOARD
 * Overview of all vessels with hybrid tracking status
 */

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

// GraphQL Query
const FLEET_DASHBOARD = gql`
  query FleetDashboard($limit: Int, $statusFilter: [String!], $minQuality: Float) {
    fleetDashboard(limit: $limit, statusFilter: $statusFilter, minQuality: $minQuality) {
      stats {
        totalVessels
        liveTracking
        atPort
        inTransit
        unknown
        averageQuality
        coveragePercentage
        vesselsNeedingAttention
      }
      vessels {
        mmsi
        name
        type
        status
        source
        quality
        lastUpdate
        position {
          lat
          lon
        }
        portName
      }
      lastUpdated
    }
  }
`;

export default function FleetDashboard() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [minQuality, setMinQuality] = useState<number | null>(null);
  const [limit, setLimit] = useState(50);

  const { data, loading, refetch } = useQuery(FLEET_DASHBOARD, {
    variables: {
      limit,
      statusFilter: statusFilter.length > 0 ? statusFilter : null,
      minQuality,
    },
    pollInterval: 60000, // Refresh every minute
  });

  const stats = data?.fleetDashboard?.stats;
  const vessels = data?.fleetDashboard?.vessels || [];

  // Status color coding
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE_AIS': return 'bg-green-100 text-green-800 border-green-300';
      case 'AT_PORT': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'IN_TRANSIT': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'UNKNOWN': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'LIVE_AIS': return '🛰️';
      case 'AT_PORT': return '⚓';
      case 'IN_TRANSIT': return '📍';
      case 'UNKNOWN': return '❓';
      default: return '❓';
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 0.8) return 'text-green-600 font-semibold';
    if (quality >= 0.5) return 'text-orange-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const toggleStatusFilter = (status: string) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Fleet Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time overview of all vessels with hybrid tracking status
          </p>
          {data?.fleetDashboard?.lastUpdated && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date(data.fleetDashboard.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Total Vessels */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Total Vessels</div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalVessels}</div>
              <div className="text-xs text-gray-500 mt-1">In fleet</div>
            </div>

            {/* Live Tracking */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Live Tracking</div>
              <div className="text-3xl font-bold text-green-600">{stats.liveTracking}</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.coveragePercentage.toFixed(1)}% coverage
              </div>
            </div>

            {/* At Port */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">At Port</div>
              <div className="text-3xl font-bold text-blue-600">{stats.atPort}</div>
              <div className="text-xs text-gray-500 mt-1">Via GFW data</div>
            </div>

            {/* Needs Attention */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Needs Attention</div>
              <div className="text-3xl font-bold text-red-600">{stats.vesselsNeedingAttention}</div>
              <div className="text-xs text-gray-500 mt-1">Low quality/unknown</div>
            </div>

            {/* Average Quality */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Avg Quality</div>
              <div className={`text-3xl font-bold ${getQualityColor(stats.averageQuality)}`}>
                {(stats.averageQuality * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Fleet-wide</div>
            </div>

            {/* In Transit */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">In Transit</div>
              <div className="text-3xl font-bold text-orange-600">{stats.inTransit}</div>
              <div className="text-xs text-gray-500 mt-1">Estimated position</div>
            </div>

            {/* Unknown */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Unknown</div>
              <div className="text-3xl font-bold text-gray-600">{stats.unknown}</div>
              <div className="text-xs text-gray-500 mt-1">No recent data</div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Status Mix</div>
              <div className="flex gap-2 mt-2">
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-green-600">{stats.liveTracking}</div>
                  <div className="text-xs text-gray-500">Live</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.atPort}</div>
                  <div className="text-xs text-gray-500">Port</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-orange-600">{stats.inTransit}</div>
                  <div className="text-xs text-gray-500">Transit</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {['LIVE_AIS', 'AT_PORT', 'IN_TRANSIT', 'UNKNOWN'].map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-sm border transition ${
                      statusFilter.includes(status)
                        ? getStatusColor(status)
                        : 'bg-gray-100 text-gray-600 border-gray-300'
                    }`}
                  >
                    {getStatusIcon(status)} {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Quality
              </label>
              <select
                value={minQuality || ''}
                onChange={(e) => setMinQuality(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="0.8">High (80%+)</option>
                <option value="0.5">Medium (50%+)</option>
                <option value="0.1">Any tracking</option>
              </select>
            </div>

            {/* Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vessels to Show
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="25">25 vessels</option>
                <option value="50">50 vessels</option>
                <option value="100">100 vessels</option>
                <option value="200">200 vessels</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              🔄 Refresh Now
            </button>
            <button
              onClick={() => {
                setStatusFilter([]);
                setMinQuality(null);
                setLimit(50);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Vessels Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              Vessels ({vessels.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-600">
              <div className="text-xl mb-2">Loading fleet data...</div>
              <div className="text-sm">This may take a moment for large fleets</div>
            </div>
          ) : vessels.length === 0 ? (
            <div className="p-12 text-center text-gray-600">
              <div className="text-xl mb-2">No vessels found</div>
              <div className="text-sm">Try adjusting your filters</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vessel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MMSI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Update
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vessels.map((vessel: any) => (
                    <tr
                      key={vessel.mmsi}
                      className="hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => navigate(`/ais/vessel-journey?mmsi=${vessel.mmsi}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {vessel.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{vessel.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {vessel.mmsi}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(vessel.status)}`}>
                          {getStatusIcon(vessel.status)} {vessel.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${getQualityColor(vessel.quality)}`}>
                          {(vessel.quality * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">{vessel.source}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vessel.portName ? (
                          <div className="text-sm">
                            <div className="font-medium text-blue-600">⚓ {vessel.portName}</div>
                          </div>
                        ) : vessel.position ? (
                          <div className="text-xs text-gray-600">
                            {vessel.position.lat.toFixed(3)}, {vessel.position.lon.toFixed(3)}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">Unknown</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(vessel.lastUpdate).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/ais/vessel-journey?mmsi=${vessel.mmsi}`);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Journey →
                        </button>
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
