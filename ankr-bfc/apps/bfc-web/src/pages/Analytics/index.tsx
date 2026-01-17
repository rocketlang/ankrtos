/**
 * Analytics Page
 */

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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const conversionData = [
  { month: 'Jul', leads: 1200, applications: 800, approvals: 520 },
  { month: 'Aug', leads: 1400, applications: 950, approvals: 620 },
  { month: 'Sep', leads: 1100, applications: 720, approvals: 480 },
  { month: 'Oct', leads: 1600, applications: 1100, approvals: 750 },
  { month: 'Nov', leads: 1800, applications: 1250, approvals: 900 },
  { month: 'Dec', leads: 2000, applications: 1400, approvals: 1050 },
];

const segmentData = [
  { name: 'Premium', value: 3200, color: '#3b82f6' },
  { name: 'Affluent', value: 5800, color: '#22c55e' },
  { name: 'Mass Affluent', value: 8500, color: '#eab308' },
  { name: 'Mass', value: 7000, color: '#64748b' },
];

const productData = [
  { product: 'Savings', customers: 18500 },
  { product: 'Credit Card', customers: 8200 },
  { product: 'Personal Loan', customers: 4500 },
  { product: 'Home Loan', customers: 2100 },
  { product: 'FD', customers: 6800 },
  { product: 'Insurance', customers: 3200 },
];

const channelData = [
  { channel: 'Mobile App', conversions: 45 },
  { channel: 'Web Portal', conversions: 28 },
  { channel: 'Branch', conversions: 15 },
  { channel: 'WhatsApp', conversions: 8 },
  { channel: 'Call Center', conversions: 4 },
];

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Performance insights and trends</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Conversion Rate</p>
            <p className="text-2xl font-bold text-slate-900">52.5%</p>
            <p className="text-xs text-green-600 mt-1">+3.2% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Avg. Decision Time</p>
            <p className="text-2xl font-bold text-slate-900">4.2 min</p>
            <p className="text-xs text-green-600 mt-1">-1.5 min vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Churn Rate</p>
            <p className="text-2xl font-bold text-slate-900">2.1%</p>
            <p className="text-xs text-green-600 mt-1">-0.3% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">NPS Score</p>
            <p className="text-2xl font-bold text-slate-900">72</p>
            <p className="text-xs text-green-600 mt-1">+5 vs last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="leads" stroke="#94a3b8" strokeWidth={2} name="Leads" />
              <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} name="Applications" />
              <Line type="monotone" dataKey="approvals" stroke="#22c55e" strokeWidth={2} name="Approvals" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {segmentData.map((segment) => (
                  <div key={segment.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="text-sm text-slate-600">{segment.name}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {segment.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Conversions (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} domain={[0, 50]} />
                <YAxis dataKey="channel" type="category" stroke="#64748b" fontSize={12} width={100} />
                <Tooltip />
                <Bar dataKey="conversions" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Adoption */}
      <Card>
        <CardHeader>
          <CardTitle>Product Adoption</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="product" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Bar dataKey="customers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
