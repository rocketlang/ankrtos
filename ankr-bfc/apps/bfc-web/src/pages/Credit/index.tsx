/**
 * Credit Applications Page
 */

import { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui';

const applications = [
  {
    id: 'APP-001',
    customer: 'Rahul Sharma',
    type: 'HOME_LOAN',
    amount: 2500000,
    status: 'APPROVED',
    confidence: 0.92,
    date: '2024-01-15',
  },
  {
    id: 'APP-002',
    customer: 'Priya Patel',
    type: 'PERSONAL_LOAN',
    amount: 500000,
    status: 'PENDING_REVIEW',
    confidence: 0.65,
    date: '2024-01-15',
  },
  {
    id: 'APP-003',
    customer: 'Amit Kumar',
    type: 'VEHICLE_LOAN',
    amount: 800000,
    status: 'REJECTED',
    confidence: 0.35,
    date: '2024-01-14',
  },
  {
    id: 'APP-004',
    customer: 'Neha Singh',
    type: 'PERSONAL_LOAN',
    amount: 300000,
    status: 'APPROVED',
    confidence: 0.88,
    date: '2024-01-14',
  },
  {
    id: 'APP-005',
    customer: 'Vikram Reddy',
    type: 'BUSINESS_LOAN',
    amount: 1500000,
    status: 'PENDING_REVIEW',
    confidence: 0.55,
    date: '2024-01-13',
  },
];

const statusConfig: Record<string, { icon: any; variant: 'success' | 'warning' | 'error'; label: string }> = {
  APPROVED: { icon: CheckCircle, variant: 'success', label: 'Approved' },
  PENDING_REVIEW: { icon: Clock, variant: 'warning', label: 'Pending Review' },
  REJECTED: { icon: XCircle, variant: 'error', label: 'Rejected' },
};

export function CreditPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredApplications = applications.filter((app) => {
    if (statusFilter && app.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        app.id.toLowerCase().includes(query) ||
        app.customer.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: applications.length,
    approved: applications.filter((a) => a.status === 'APPROVED').length,
    pending: applications.filter((a) => a.status === 'PENDING_REVIEW').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Credit Applications</h1>
          <p className="text-slate-500 mt-1">AI-powered credit decisioning</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" />
          New Application
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Applications</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Application ID
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  AI Confidence
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredApplications.map((app) => {
                const config = statusConfig[app.status];
                const StatusIcon = config.icon;

                return (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-sm text-slate-900">{app.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{app.customer}</td>
                    <td className="px-6 py-4 text-slate-600">{app.type.replace('_', ' ')}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      ₹{app.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              app.confidence > 0.7
                                ? 'bg-green-500'
                                : app.confidence > 0.5
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${app.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600">
                          {(app.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={config.variant}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{app.date}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
