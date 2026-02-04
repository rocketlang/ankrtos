/**
 * CII Dashboard - Comprehensive CII monitoring and alerts
 */

import { useQuery, useMutation } from '@apollo/client';
import { gql } from '../__generated__/gql';
import { Layout } from '../components/Layout';
import { CIIAlertBanner } from '../components/CIIAlertBanner';
import { AlertTriangle, TrendingDown, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const CII_DOWNGRADE_STATS = gql(`
  query CIIDowngradeStatsPage {
    ciiDowngradeStats {
      totalVessels
      vesselsWithDowngrade
      criticalDowngrades
      downgradeRate
      ratingDistribution
    }
  }
`);

const GET_ALL_ALERTS = gql(`
  query GetAllCIIAlerts {
    alerts(
      where: { type: "cii_downgrade" }
      orderBy: { createdAt: DESC }
    ) {
      id
      severity
      title
      message
      metadata
      status
      createdAt
    }
  }
`);

const CHECK_ALL_DOWNGRADES = gql(`
  mutation CheckAllCIIDowngrades {
    checkAllCIIDowngrades {
      vesselId
      vesselName
      previousRating
      currentRating
      year
      downgradeLevel
    }
  }
`);

export function CIIDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: statsData, refetch: refetchStats } = useQuery(CII_DOWNGRADE_STATS);
  const { data: alertsData, refetch: refetchAlerts } = useQuery(GET_ALL_ALERTS);
  const [checkAll] = useMutation(CHECK_ALL_DOWNGRADES);

  const stats = statsData?.ciiDowngradeStats;
  const alerts = alertsData?.alerts || [];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await checkAll();
      await Promise.all([refetchStats(), refetchAlerts()]);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CII Monitoring Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Track vessel CII ratings and downgrade alerts
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Checking...' : 'Check All Vessels'}
          </button>
        </div>

        {/* Alert Banner */}
        <CIIAlertBanner />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vessels</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalVessels || 0}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Downgrades</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.vesselsWithDowngrade || 0}</p>
              </div>
              <TrendingDown className="h-10 w-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical (3+ levels)</p>
                <p className="text-3xl font-bold text-red-600">{stats?.criticalDowngrades || 0}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Downgrade Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.downgradeRate?.toFixed(1) || 0}%
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">CII Downgrade Alerts</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vessel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previous</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="text-lg font-medium">No CII downgrades detected</p>
                      <p className="text-sm">Your fleet is maintaining or improving CII ratings</p>
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert) => {
                    const metadata = alert.metadata as any;
                    return (
                      <tr key={alert.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {metadata?.vesselName || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            IMO: {metadata?.vesselId?.substring(0, 7) || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-green-100 text-green-800 font-bold rounded text-sm">
                            {metadata?.previousRating || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-red-100 text-red-800 font-bold rounded text-sm">
                            {metadata?.currentRating || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {metadata?.year || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            alert.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                            alert.status === 'acknowledged' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a
                            href={`/vessels/${metadata?.vesselId}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View →
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
