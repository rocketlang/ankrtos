/**
 * Dashboard Page with Real GraphQL Data
 */

import React from 'react';
import { Users, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  useDashboardStats,
  useApplicationTrends,
  useSegmentDistribution,
  useRecentActivity,
} from '@ankr-bfc/api-client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatCard,
  StatsGrid,
} from '@ankr-bfc/ui';
import { formatINR } from '@ankr-bfc/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export function DashboardPage() {
  const { data: statsData, loading: statsLoading } = useDashboardStats();
  const { data: trendsData } = useApplicationTrends('month');
  const { data: segmentData } = useSegmentDistribution();
  const { data: activityData } = useRecentActivity(10);

  const stats = statsData?.dashboardStats;
  const trends = trendsData?.applicationTrends || [];
  const segments = segmentData?.segmentDistribution || [];
  const activities = activityData?.recentActivity || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <StatsGrid cols={4}>
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          change={stats?.customerGrowth}
          icon={<Users className="w-5 h-5" />}
          iconColor="blue"
          format="number"
          loading={statsLoading}
        />
        <StatCard
          title="Active Applications"
          value={stats?.activeApplications || 0}
          change={stats?.applicationGrowth}
          icon={<CreditCard className="w-5 h-5" />}
          iconColor="green"
          format="number"
          loading={statsLoading}
        />
        <StatCard
          title="Approval Rate"
          value={stats?.approvalRate || 0}
          change={stats?.approvalChange}
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="purple"
          format="percentage"
          loading={statsLoading}
        />
        <StatCard
          title="High Risk Alerts"
          value={stats?.highRiskAlerts || 0}
          change={stats?.alertChange}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="red"
          format="number"
          loading={statsLoading}
        />
      </StatsGrid>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Applications Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                  name="Applications"
                />
                <Line
                  type="monotone"
                  dataKey="approvals"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                  name="Approvals"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Segment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segments} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="segment" type="category" stroke="#64748b" fontSize={12} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {activities.map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-600">
                    {activity.customer?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{activity.customer?.name || 'Unknown'}</p>
                    <p className="text-sm text-slate-500">{activity.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.amount && (
                    <p className="font-medium text-slate-900">{formatINR(activity.amount)}</p>
                  )}
                  <p className="text-sm text-slate-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="px-6 py-8 text-center text-slate-500">
                No recent activity
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
