import React, { useState } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface ComplianceItem {
  id: string;
  vesselName: string;
  category: 'ism' | 'isps' | 'marpol' | 'solas' | 'stcw' | 'port_state' | 'flag_state' | 'class';
  title: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'pending_review' | 'expired';
  dueDate?: string;
  completedDate?: string;
  inspector?: string;
  findings?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const ComplianceHubShowcase: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const complianceItems: ComplianceItem[] = [
    {
      id: '1',
      vesselName: 'MV OCEAN SPIRIT',
      category: 'ism',
      title: 'ISM Annual Internal Audit',
      description: 'Annual internal safety management system audit',
      status: 'compliant',
      dueDate: '2026-06-15',
      completedDate: '2026-01-20',
      inspector: 'DPA Team',
      priority: 'high',
    },
    {
      id: '2',
      vesselName: 'MV FORTUNE STAR',
      category: 'isps',
      title: 'ISPS Security Plan Review',
      description: 'Ship security plan annual review and update',
      status: 'pending_review',
      dueDate: '2026-03-10',
      priority: 'medium',
    },
    {
      id: '3',
      vesselName: 'MV PACIFIC CROWN',
      category: 'marpol',
      title: 'MARPOL Annex VI Compliance',
      description: 'SOx emission compliance verification',
      status: 'compliant',
      completedDate: '2026-01-15',
      inspector: 'Port State Control',
      priority: 'high',
    },
    {
      id: '4',
      vesselName: 'MV GOLDEN BRIDGE',
      category: 'solas',
      title: 'SOLAS Fire Safety Equipment',
      description: 'Fire detection and suppression system inspection',
      status: 'non_compliant',
      dueDate: '2026-02-20',
      findings: '2 deficiencies: Fire pump pressure low, CO2 system requires servicing',
      priority: 'critical',
    },
  ];

  const categoryLabels = {
    ism: 'ISM',
    isps: 'ISPS',
    marpol: 'MARPOL',
    solas: 'SOLAS',
    stcw: 'STCW',
    port_state: 'Port State',
    flag_state: 'Flag State',
    class: 'Classification',
  };

  const statusColors = {
    compliant: 'bg-green-900/50 text-green-400 border-green-500/50',
    non_compliant: 'bg-red-900/50 text-red-400 border-red-500/50',
    pending_review: 'bg-yellow-900/50 text-yellow-400 border-yellow-500/50',
    expired: 'bg-red-900/80 text-red-300 border-red-500',
  };

  const priorityColors = {
    low: 'text-maritime-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400 font-bold',
  };

  const filteredItems = complianceItems.filter(
    (item) =>
      (filterCategory === 'all' || item.category === filterCategory) &&
      (filterStatus === 'all' || item.status === filterStatus)
  );

  const summary = {
    total: complianceItems.length,
    compliant: complianceItems.filter((i) => i.status === 'compliant').length,
    nonCompliant: complianceItems.filter((i) => i.status === 'non_compliant').length,
    pendingReview: complianceItems.filter((i) => i.status === 'pending_review').length,
  };

  return (
    <ShowcaseLayout
      title="Compliance Hub"
      icon="✓"
      category="Safety & Compliance"
      problem="Compliance tracked in spreadsheets, audit findings in PDFs, certificate renewals missed, PSC inspection prep takes 8 hours, and non-compliance costs averaging $150K annually in fines and detentions."
      solution="Centralized compliance management with automated audit tracking, certificate expiry alerts, PSC preparation checklists, real-time status dashboards, and mobile access for shipboard teams - achieving 100% compliance and zero detentions."
      timeSaved="8 hours → 30 min"
      roi="48x"
      accuracy="100% compliance rate"
      nextSection={{
        title: 'Technical Operations',
        path: '/demo-showcase/technical-operations',
      }}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-maritime-800 border-l-4 border-maritime-500 rounded-lg p-4">
            <div className="text-maritime-500 text-xs">Total Items</div>
            <div className="text-3xl font-bold text-white mt-1">{summary.total}</div>
          </div>
          <div className="bg-green-900/20 border-l-4 border-green-500 rounded-lg p-4">
            <div className="text-green-400 text-xs">Compliant</div>
            <div className="text-3xl font-bold text-green-400 mt-1">{summary.compliant}</div>
          </div>
          <div className="bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
            <div className="text-red-400 text-xs">Non-Compliant</div>
            <div className="text-3xl font-bold text-red-400 mt-1">{summary.nonCompliant}</div>
          </div>
          <div className="bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-4">
            <div className="text-yellow-400 text-xs">Pending Review</div>
            <div className="text-3xl font-bold text-yellow-400 mt-1">{summary.pendingReview}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="compliant">Compliant</option>
              <option value="non_compliant">Non-Compliant</option>
              <option value="pending_review">Pending Review</option>
            </select>
          </div>
        </div>

        {/* Compliance Items */}
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <span className="px-2 py-1 bg-gray-900 text-gray-400 rounded text-xs font-semibold">
                      {categoryLabels[item.category]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">{item.description}</div>
                  <div className="text-sm text-gray-500">Vessel: {item.vesselName}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold border-2 ${statusColors[item.status]}`}>
                    {item.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className={`text-sm font-semibold uppercase ${priorityColors[item.priority]}`}>
                    {item.priority}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {item.dueDate && (
                  <div>
                    <span className="text-gray-400">Due Date:</span>
                    <span className="text-white ml-2">{item.dueDate}</span>
                  </div>
                )}
                {item.completedDate && (
                  <div>
                    <span className="text-gray-400">Completed:</span>
                    <span className="text-white ml-2">{item.completedDate}</span>
                  </div>
                )}
                {item.inspector && (
                  <div>
                    <span className="text-gray-400">Inspector:</span>
                    <span className="text-white ml-2">{item.inspector}</span>
                  </div>
                )}
              </div>

              {item.findings && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded">
                  <div className="text-red-400 font-semibold text-sm mb-1">Findings:</div>
                  <div className="text-gray-300 text-sm">{item.findings}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span> Compliance Performance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Compliance Rate</div>
              <div className="text-2xl font-bold text-green-400">100%</div>
              <div className="text-xs text-gray-500">all critical items</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">PSC Detentions</div>
              <div className="text-2xl font-bold text-blue-400">0</div>
              <div className="text-xs text-gray-500">last 12 months</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Audit Score</div>
              <div className="text-2xl font-bold text-purple-400">98%</div>
              <div className="text-xs text-gray-500">fleet average</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Cost Savings</div>
              <div className="text-2xl font-bold text-yellow-400">$150K</div>
              <div className="text-xs text-gray-500">fines avoided</div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
};

export default ComplianceHubShowcase;
