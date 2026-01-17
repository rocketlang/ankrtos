/**
 * Dashboard Page
 */

import {
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
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

// Mock data - would come from GraphQL
const stats = [
  {
    title: 'Total Customers',
    value: '24,521',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'blue',
  },
  {
    title: 'Active Applications',
    value: '1,234',
    change: '+8.2%',
    trend: 'up',
    icon: CreditCard,
    color: 'green',
  },
  {
    title: 'Approval Rate',
    value: '78.3%',
    change: '+2.1%',
    trend: 'up',
    icon: TrendingUp,
    color: 'purple',
  },
  {
    title: 'High Risk Alerts',
    value: '23',
    change: '-5.4%',
    trend: 'down',
    icon: AlertTriangle,
    color: 'red',
  },
];

const chartData = [
  { name: 'Jan', applications: 400, approvals: 320 },
  { name: 'Feb', applications: 300, approvals: 248 },
  { name: 'Mar', applications: 520, approvals: 410 },
  { name: 'Apr', applications: 480, approvals: 390 },
  { name: 'May', applications: 600, approvals: 470 },
  { name: 'Jun', applications: 550, approvals: 430 },
];

const segmentData = [
  { segment: 'Premium', count: 3200 },
  { segment: 'Affluent', count: 5800 },
  { segment: 'Mass Affluent', count: 8500 },
  { segment: 'Mass', count: 7000 },
];

const recentActivity = [
  { id: 1, customer: 'Rahul Sharma', action: 'Loan Approved', amount: '₹15,00,000', time: '2 min ago' },
  { id: 2, customer: 'Priya Patel', action: 'KYC Verified', amount: null, time: '5 min ago' },
  { id: 3, customer: 'Amit Kumar', action: 'Offer Accepted', amount: '₹5,00,000', time: '12 min ago' },
  { id: 4, customer: 'Neha Singh', action: 'Application Submitted', amount: '₹8,00,000', time: '18 min ago' },
  { id: 5, customer: 'Vikram Reddy', action: 'Risk Alert', amount: null, time: '25 min ago' },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div
                  className={`p-2 rounded-lg bg-${stat.color}-100`}
                  style={{
                    backgroundColor:
                      stat.color === 'blue'
                        ? '#dbeafe'
                        : stat.color === 'green'
                        ? '#dcfce7'
                        : stat.color === 'purple'
                        ? '#f3e8ff'
                        : '#fee2e2',
                  }}
                >
                  <stat.icon
                    className="w-5 h-5"
                    style={{
                      color:
                        stat.color === 'blue'
                          ? '#2563eb'
                          : stat.color === 'green'
                          ? '#16a34a'
                          : stat.color === 'purple'
                          ? '#9333ea'
                          : '#dc2626',
                    }}
                  />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Applications Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
                <Line
                  type="monotone"
                  dataKey="approvals"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
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
              <BarChart data={segmentData} layout="vertical">
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
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-600">
                    {activity.customer.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{activity.customer}</p>
                    <p className="text-sm text-slate-500">{activity.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.amount && (
                    <p className="font-medium text-slate-900">{activity.amount}</p>
                  )}
                  <p className="text-sm text-slate-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
