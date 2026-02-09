/**
 * FLEET PERFORMANCE DASHBOARD
 *
 * Comprehensive fleet analytics with:
 * - Overview cards (utilization, OTP, revenue, profit)
 * - Performance metrics table (sortable, filterable)
 * - Trend charts (6-month historical)
 * - Top performers & vessels needing attention
 */

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const FLEET_PERFORMANCE_QUERY = gql`
  query FleetPerformance($period: String!, $vesselType: String) {
    fleetPerformance(period: $period, vesselType: $vesselType) {
      summary {
        totalVessels
        activeVessels
        idleVessels
        avgUtilization
        avgOTP
        topPerformers
        needsAttention
      }
      fleetAverages {
        utilization
        avgSpeed
        fuelEfficiency
        onTimePercentage
        revenuePerDay
        costPerDay
        profitPerDay
        profitMargin
      }
      vessels {
        vesselId
        vesselName
        vesselType
        mmsi
        imo
        utilizationRate
        daysActive
        daysIdle
        avgSpeed
        fuelEfficiency
        onTimePercentage
        totalVoyages
        completedVoyages
        delayedVoyages
        revenuePerDay
        costPerDay
        profitPerDay
        profitMargin
        totalRevenue
        totalCost
        vsFleetAverage {
          utilization
          fuelEfficiency
          profit
          otp
        }
        fleetRank
        totalFleetSize
      }
      trends {
        month
        utilization
        otp
        fuelEfficiency
        revenue
        profit
        avgSpeed
      }
      lastUpdated
    }
  }
`;

export default function FleetPerformanceDashboard() {
  const [period, setPeriod] = useState('30d');
  const [vesselType, setVesselType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'profit' | 'utilization' | 'otp' | 'rank'>('rank');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, loading, error } = useQuery(FLEET_PERFORMANCE_QUERY, {
    variables: { period, vesselType },
    pollInterval: 300000, // Refresh every 5 minutes
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">📊 Fleet Performance</h1>
          <div className="text-center py-12 text-gray-600">Loading fleet data...</div>
        </div>
      </div>
    );
  }

  if (error || !data?.fleetPerformance) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">📊 Fleet Performance</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">Error loading fleet data: {error?.message || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { summary, fleetAverages, vessels, trends } = data.fleetPerformance;

  // Filter and sort vessels
  let filteredVessels = vessels.filter((v: any) =>
    v.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.mmsi && v.mmsi.includes(searchQuery)) ||
    (v.imo && v.imo.includes(searchQuery))
  );

  // Sort vessels
  filteredVessels = [...filteredVessels].sort((a: any, b: any) => {
    if (sortBy === 'profit') return (b.profitPerDay || 0) - (a.profitPerDay || 0);
    if (sortBy === 'utilization') return b.utilizationRate - a.utilizationRate;
    if (sortBy === 'otp') return b.onTimePercentage - a.onTimePercentage;
    return a.fleetRank - b.fleetRank; // rank
  });

  const topPerformers = vessels.filter((v: any) => v.fleetRank <= 5);
  const needsAttention = vessels.filter((v: any) =>
    v.utilizationRate < 70 || v.onTimePercentage < 70 || v.fuelEfficiency > fleetAverages.fuelEfficiency * 1.2
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Fleet Performance Analytics</h1>
          <p className="text-gray-600">Comprehensive fleet metrics and benchmarking</p>
        </div>

        {/* Period and Type Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-700 self-center">Period:</label>
              {['7d', '30d', '90d', '1y'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    period === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {p === '1y' ? '1 Year' : p}
                </button>
              ))}
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by vessel name, MMSI, or IMO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Total Vessels</div>
            <div className="text-3xl font-bold text-gray-900">{summary.totalVessels}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-3xl font-bold text-green-600">{summary.activeVessels}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Idle</div>
            <div className="text-3xl font-bold text-orange-600">{summary.idleVessels}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Avg Util</div>
            <div className="text-3xl font-bold text-blue-600">{summary.avgUtilization.toFixed(1)}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Avg OTP</div>
            <div className="text-3xl font-bold text-purple-600">{summary.avgOTP.toFixed(1)}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Top Performers</div>
            <div className="text-3xl font-bold text-green-600">{summary.topPerformers}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Need Attention</div>
            <div className="text-3xl font-bold text-red-600">{summary.needsAttention}</div>
          </div>
        </div>

        {/* Fleet Averages */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Fleet Averages</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600">Utilization</div>
              <div className="text-2xl font-semibold">{fleetAverages.utilization.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg Speed</div>
              <div className="text-2xl font-semibold">{fleetAverages.avgSpeed.toFixed(1)} kn</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Fuel Efficiency</div>
              <div className="text-2xl font-semibold">{fleetAverages.fuelEfficiency.toFixed(2)} MT/nm</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">On-Time %</div>
              <div className="text-2xl font-semibold">{fleetAverages.onTimePercentage.toFixed(1)}%</div>
            </div>
            {fleetAverages.revenuePerDay && (
              <div>
                <div className="text-sm text-gray-600">Revenue/Day</div>
                <div className="text-2xl font-semibold">${fleetAverages.revenuePerDay.toFixed(0)}</div>
              </div>
            )}
            {fleetAverages.profitPerDay && (
              <div>
                <div className="text-sm text-gray-600">Profit/Day</div>
                <div className="text-2xl font-semibold">${fleetAverages.profitPerDay.toFixed(0)}</div>
              </div>
            )}
            {fleetAverages.profitMargin && (
              <div>
                <div className="text-sm text-gray-600">Profit Margin</div>
                <div className="text-2xl font-semibold">{fleetAverages.profitMargin.toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>

        {/* Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Utilization & OTP Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Utilization & OTP Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="utilization" stroke="#3b82f6" name="Utilization %" />
                <Line type="monotone" dataKey="otp" stroke="#8b5cf6" name="OTP %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue & Profit Trend */}
          {trends[0].revenue && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Revenue & Profit Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  <Bar dataKey="profit" fill="#3b82f6" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Performance Table */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Vessel Performance</h2>
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-700 self-center">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="rank">Rank</option>
                <option value="profit">Profit/Day</option>
                <option value="utilization">Utilization</option>
                <option value="otp">On-Time %</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold">Rank</th>
                  <th className="text-left p-3 font-semibold">Vessel</th>
                  <th className="text-right p-3 font-semibold">Util %</th>
                  <th className="text-right p-3 font-semibold">OTP %</th>
                  <th className="text-right p-3 font-semibold">Fuel Eff</th>
                  <th className="text-right p-3 font-semibold">Voyages</th>
                  <th className="text-right p-3 font-semibold">Profit/Day</th>
                  <th className="text-right p-3 font-semibold">vs Fleet</th>
                </tr>
              </thead>
              <tbody>
                {filteredVessels.map((vessel: any) => (
                  <tr key={vessel.vesselId} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="p-3">
                      <span className={`inline-block px-2 py-1 rounded text-white text-xs font-medium ${
                        vessel.fleetRank <= 5 ? 'bg-green-600' : vessel.fleetRank <= 10 ? 'bg-blue-600' : 'bg-gray-600'
                      }`}>
                        #{vessel.fleetRank}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{vessel.vesselName}</div>
                      <div className="text-xs text-gray-500">{vessel.vesselType || 'N/A'}</div>
                    </td>
                    <td className={`p-3 text-right font-semibold ${
                      vessel.utilizationRate >= 80 ? 'text-green-600' : vessel.utilizationRate >= 60 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {vessel.utilizationRate.toFixed(1)}%
                    </td>
                    <td className={`p-3 text-right font-semibold ${
                      vessel.onTimePercentage >= 90 ? 'text-green-600' : vessel.onTimePercentage >= 70 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {vessel.onTimePercentage.toFixed(1)}%
                    </td>
                    <td className="p-3 text-right">{vessel.fuelEfficiency.toFixed(2)}</td>
                    <td className="p-3 text-right">
                      {vessel.completedVoyages}/{vessel.totalVoyages}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {vessel.profitPerDay ? `$${vessel.profitPerDay.toFixed(0)}` : 'N/A'}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        vessel.vsFleetAverage.profit > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {vessel.vsFleetAverage.profit > 0 ? '+' : ''}{vessel.vsFleetAverage.profit.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performers & Needs Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Performers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">🏆 Top 5 Performers</h2>
            <div className="space-y-3">
              {topPerformers.map((vessel: any) => (
                <div key={vessel.vesselId} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-lg">{vessel.vesselName}</div>
                      <div className="text-sm text-gray-600">Rank #{vessel.fleetRank}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${vessel.profitPerDay?.toFixed(0) || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">/day</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-gray-600">Util</div>
                      <div className="font-semibold">{vessel.utilizationRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">OTP</div>
                      <div className="font-semibold">{vessel.onTimePercentage.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Voyages</div>
                      <div className="font-semibold">{vessel.completedVoyages}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">⚠️ Needs Attention</h2>
            <div className="space-y-3">
              {needsAttention.slice(0, 5).map((vessel: any) => (
                <div key={vessel.vesselId} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="font-bold text-lg mb-2">{vessel.vesselName}</div>
                  <div className="space-y-1 text-sm">
                    {vessel.utilizationRate < 70 && (
                      <div className="text-orange-700">❌ Low utilization: {vessel.utilizationRate.toFixed(1)}%</div>
                    )}
                    {vessel.onTimePercentage < 70 && (
                      <div className="text-orange-700">❌ Low OTP: {vessel.onTimePercentage.toFixed(1)}%</div>
                    )}
                    {vessel.fuelEfficiency > fleetAverages.fuelEfficiency * 1.2 && (
                      <div className="text-orange-700">❌ High fuel consumption: {vessel.fuelEfficiency.toFixed(2)} MT/nm</div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Rank: #{vessel.fleetRank} of {vessel.totalFleetSize}
                  </div>
                </div>
              ))}
              {needsAttention.length === 0 && (
                <div className="text-center py-8 text-gray-600">✅ All vessels performing well!</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
