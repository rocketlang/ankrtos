/**
 * Owner Portal
 * Dashboard for vessel owners - fleet overview, earnings, compliance
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  Ship,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FileText,
  Calendar,
  BarChart3,
  Settings,
} from 'lucide-react';

const OwnerPortal: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock data - replace with GraphQL queries
  const fleetStats = {
    totalVessels: 12,
    activeVessels: 10,
    idleVessels: 2,
    averageAge: 8.5,
  };

  const earnings = {
    thisMonth: 2450000,
    lastMonth: 2320000,
    ytd: 24500000,
    currency: 'USD',
  };

  const vessels = [
    {
      id: '1',
      name: 'MV PACIFIC STAR',
      type: 'Bulk Carrier',
      dwt: 82000,
      status: 'On Charter',
      currentEarnings: 18000,
      location: 'Singapore Strait',
      nextDryDock: '2026-11-15',
      utilization: 95,
    },
    {
      id: '2',
      name: 'MV ATLANTIC GRACE',
      type: 'Bulk Carrier',
      dwt: 75000,
      status: 'Spot Market',
      currentEarnings: 0,
      location: 'Mumbai',
      nextDryDock: '2027-03-20',
      utilization: 0,
    },
    {
      id: '3',
      name: 'MV OCEAN PIONEER',
      type: 'Container',
      dwt: 50000,
      status: 'On Charter',
      currentEarnings: 22000,
      location: 'Los Angeles',
      nextDryDock: '2026-08-10',
      utilization: 100,
    },
  ];

  const alerts = [
    { id: '1', type: 'warning', message: 'MV ATLANTIC GRACE - Dry dock due in 2 months', priority: 'high' },
    { id: '2', type: 'info', message: 'MV PACIFIC STAR - Charter expires in 45 days', priority: 'medium' },
    { id: '3', type: 'critical', message: 'MV OCEAN PIONEER - Class survey overdue', priority: 'critical' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Owner Portal</h1>
              <p className="text-sm text-gray-600">Fleet Management & Analytics</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Fleet</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{fleetStats.totalVessels}</p>
                <p className="text-sm text-gray-500 mt-1">{fleetStats.activeVessels} active</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Ship className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${(earnings.thisMonth / 1000).toFixed(0)}K
                </p>
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +5.6% vs last month
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">YTD Earnings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${(earnings.ytd / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-gray-500 mt-1">Target: $30M</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">87%</p>
                <p className="text-sm text-gray-500 mt-1">Fleet-wide</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    alert.priority === 'critical'
                      ? 'bg-red-50 border border-red-200'
                      : alert.priority === 'high'
                      ? 'bg-orange-50 border border-orange-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      alert.priority === 'critical'
                        ? 'text-red-600'
                        : alert.priority === 'high'
                        ? 'text-orange-600'
                        : 'text-blue-600'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  </div>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fleet Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Fleet Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vessel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type/DWT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vessels.map((vessel) => (
                  <tr key={vessel.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Ship className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{vessel.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vessel.type}</div>
                      <div className="text-sm text-gray-500">{vessel.dwt.toLocaleString()} DWT</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          vessel.status === 'On Charter'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {vessel.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {vessel.currentEarnings > 0
                          ? `$${vessel.currentEarnings.toLocaleString()}/day`
                          : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vessel.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              vessel.utilization >= 80
                                ? 'bg-green-500'
                                : vessel.utilization >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${vessel.utilization}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{vessel.utilization}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerPortal;
