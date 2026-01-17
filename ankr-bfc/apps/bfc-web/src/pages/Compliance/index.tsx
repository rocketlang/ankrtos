/**
 * Compliance Dashboard
 */

import { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui';

const kycStats = {
  verified: 22450,
  pending: 1234,
  rejected: 156,
  expired: 89,
};

const alerts = [
  {
    id: 1,
    type: 'AML',
    severity: 'HIGH',
    customer: 'Suspicious transaction pattern',
    description: 'Multiple high-value transactions to new recipients',
    date: '2024-01-15 14:30',
  },
  {
    id: 2,
    type: 'KYC',
    severity: 'MEDIUM',
    customer: 'Document expiry',
    description: '156 customers have KYC documents expiring in 30 days',
    date: '2024-01-15 10:00',
  },
  {
    id: 3,
    type: 'CONSENT',
    severity: 'LOW',
    customer: 'Consent renewal',
    description: '89 customers need consent renewal for marketing',
    date: '2024-01-14 16:45',
  },
];

const consentStats = {
  marketing: { granted: 18500, revoked: 2100 },
  analytics: { granted: 21000, revoked: 850 },
  thirdParty: { granted: 12000, revoked: 8500 },
};

const recentAudit = [
  { id: 1, action: 'Customer data accessed', user: 'RM: Amit Shah', customer: 'CIF: 12345', time: '2 min ago' },
  { id: 2, action: 'KYC verified', user: 'Ops: Priya Mehta', customer: 'CIF: 12346', time: '5 min ago' },
  { id: 3, action: 'Consent updated', user: 'System', customer: 'CIF: 12347', time: '10 min ago' },
  { id: 4, action: 'Credit decision made', user: 'AI System', customer: 'CIF: 12348', time: '15 min ago' },
  { id: 5, action: 'Data export requested', user: 'Admin: Raj Kumar', customer: 'Bulk', time: '25 min ago' },
];

const severityColors: Record<string, 'error' | 'warning' | 'info'> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info',
};

export function CompliancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Dashboard</h1>
          <p className="text-slate-500 mt-1">DPDP, GDPR & RBI compliance monitoring</p>
        </div>
        <Button variant="outline">
          <FileText className="w-4 h-4" />
          Generate Report
        </Button>
      </div>

      {/* KYC Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">KYC Verified</p>
                <p className="text-xl font-bold text-slate-900">{kycStats.verified.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">KYC Pending</p>
                <p className="text-xl font-bold text-slate-900">{kycStats.pending.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">KYC Rejected</p>
                <p className="text-xl font-bold text-slate-900">{kycStats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Documents Expiring</p>
                <p className="text-xl font-bold text-slate-900">{kycStats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Active Alerts
              </CardTitle>
              <Badge variant="warning">{alerts.length} Open</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              {alerts.map((alert) => (
                <div key={alert.id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={severityColors[alert.severity]}>{alert.severity}</Badge>
                      <span className="text-sm font-medium text-slate-600">{alert.type}</span>
                    </div>
                    <span className="text-xs text-slate-500">{alert.date}</span>
                  </div>
                  <p className="font-medium text-slate-900">{alert.customer}</p>
                  <p className="text-sm text-slate-500 mt-1">{alert.description}</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">Review</Button>
                    <Button size="sm" variant="ghost">Dismiss</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Consent Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Consent Status (DPDP)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(consentStats).map(([key, value]) => {
              const total = value.granted + value.revoked;
              const grantedPercent = (value.granted / total) * 100;

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm text-slate-500">
                      {value.granted.toLocaleString()} / {total.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${grantedPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-4 border-t border-slate-200">
              <Button variant="outline" className="w-full">
                <Users className="w-4 h-4" />
                Manage Consents
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-slate-600" />
              Recent Audit Trail
            </CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {recentAudit.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="font-medium text-slate-900">{entry.action}</p>
                    <p className="text-sm text-slate-500">{entry.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">{entry.customer}</p>
                  <p className="text-xs text-slate-500">{entry.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
