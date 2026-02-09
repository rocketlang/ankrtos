import React, { useState } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface Claim {
  id: string;
  claimNumber: string;
  type: 'cargo_damage' | 'cargo_shortage' | 'demurrage' | 'dead_freight' | 'deviation' | 'general_average';
  status: 'open' | 'under_investigation' | 'negotiation' | 'arbitration' | 'settled' | 'rejected' | 'closed';
  amount: number;
  settledAmount?: number;
  currency: string;
  filedDate: string;
  settledDate?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  voyageNumber: string;
  vessel: string;
  description: string;
  notes?: string;
  documents: Document[];
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedDate: string;
}

interface WorkflowStep {
  status: string;
  label: string;
  nextSteps: string[];
  icon: string;
}

interface ClaimSummary {
  totalClaims: number;
  openClaims: number;
  settledClaims: number;
  totalClaimAmount: number;
  totalSettledAmount: number;
  averageSettlementTime: number;
  successRate: number;
}

const ClaimsSettlementShowcase: React.FC = () => {
  const [selectedClaim, setSelectedClaim] = useState<string>('claim-001');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const claims: Claim[] = [
    {
      id: 'claim-001',
      claimNumber: 'CLM-2026-001',
      type: 'cargo_damage',
      status: 'negotiation',
      amount: 125000,
      currency: 'USD',
      filedDate: '2026-01-15',
      priority: 'high',
      voyageNumber: 'VOY-SG-RTM-045',
      vessel: 'MV OCEAN SPIRIT',
      description: 'Water damage to containerized cargo during heavy weather in Bay of Biscay. 25 containers affected.',
      documents: [
        { id: '1', name: 'Damage Survey Report.pdf', type: 'Survey Report', uploadedDate: '2026-01-18' },
        { id: '2', name: 'Weather Report Bay of Biscay.pdf', type: 'Weather Data', uploadedDate: '2026-01-20' },
        { id: '3', name: 'Cargo Manifest.pdf', type: 'Cargo Documentation', uploadedDate: '2026-01-15' },
      ],
    },
    {
      id: 'claim-002',
      claimNumber: 'CLM-2026-002',
      type: 'demurrage',
      status: 'under_investigation',
      amount: 90000,
      currency: 'USD',
      filedDate: '2026-02-01',
      priority: 'medium',
      voyageNumber: 'VOY-SH-SG-032',
      vessel: 'MV FORTUNE STAR',
      description: 'Port congestion at Shanghai caused 6-day delay. Laytime exceeded by 3 days.',
      documents: [
        { id: '4', name: 'Statement of Facts.pdf', type: 'SOF', uploadedDate: '2026-02-02' },
        { id: '5', name: 'Laytime Calculation.xlsx', type: 'Calculation', uploadedDate: '2026-02-03' },
      ],
    },
    {
      id: 'claim-003',
      claimNumber: 'CLM-2025-098',
      type: 'cargo_shortage',
      status: 'settled',
      amount: 45000,
      settledAmount: 38000,
      currency: 'USD',
      filedDate: '2025-12-10',
      settledDate: '2026-01-25',
      priority: 'low',
      voyageNumber: 'VOY-BR-CN-018',
      vessel: 'MV PACIFIC CROWN',
      description: 'Iron ore shortage of 250 MT at discharge port. Outturn quantity below Bill of Lading.',
      documents: [
        { id: '6', name: 'Bill of Lading.pdf', type: 'B/L', uploadedDate: '2025-12-10' },
        { id: '7', name: 'Outturn Certificate.pdf', type: 'Certificate', uploadedDate: '2025-12-12' },
        { id: '8', name: 'Settlement Agreement.pdf', type: 'Agreement', uploadedDate: '2026-01-25' },
      ],
    },
    {
      id: 'claim-004',
      claimNumber: 'CLM-2026-003',
      type: 'general_average',
      status: 'arbitration',
      amount: 385000,
      currency: 'USD',
      filedDate: '2026-01-05',
      priority: 'critical',
      voyageNumber: 'VOY-ME-EU-012',
      vessel: 'MV GOLDEN BRIDGE',
      description: 'Engine failure requiring emergency towing and port of refuge. General Average declared.',
      documents: [
        { id: '9', name: 'Casualty Report.pdf', type: 'Casualty', uploadedDate: '2026-01-06' },
        { id: '10', name: 'Salvage Agreement.pdf', type: 'Agreement', uploadedDate: '2026-01-07' },
        { id: '11', name: 'GA Declaration.pdf', type: 'Declaration', uploadedDate: '2026-01-08' },
      ],
    },
  ];

  const workflowSteps: WorkflowStep[] = [
    { status: 'open', label: 'Open', nextSteps: ['under_investigation'], icon: '📝' },
    { status: 'under_investigation', label: 'Investigation', nextSteps: ['negotiation', 'rejected'], icon: '🔍' },
    { status: 'negotiation', label: 'Negotiation', nextSteps: ['settled', 'arbitration'], icon: '💬' },
    { status: 'arbitration', label: 'Arbitration', nextSteps: ['settled', 'closed'], icon: '⚖️' },
    { status: 'settled', label: 'Settled', nextSteps: ['closed'], icon: '✓' },
    { status: 'rejected', label: 'Rejected', nextSteps: ['closed'], icon: '✗' },
    { status: 'closed', label: 'Closed', nextSteps: [], icon: '🔒' },
  ];

  const claimSummary: ClaimSummary = {
    totalClaims: 48,
    openClaims: 12,
    settledClaims: 32,
    totalClaimAmount: 2850000,
    totalSettledAmount: 2245000,
    averageSettlementTime: 45, // days
    successRate: 78.8, // percentage
  };

  const claimTypeLabels: Record<string, string> = {
    cargo_damage: 'Cargo Damage',
    cargo_shortage: 'Cargo Shortage',
    demurrage: 'Demurrage',
    dead_freight: 'Dead Freight',
    deviation: 'Deviation',
    general_average: 'General Average',
  };

  const selectedClaimData = claims.find((c) => c.id === selectedClaim) || claims[0];

  const filteredClaims = statusFilter === 'all'
    ? claims
    : claims.filter((c) => c.status === statusFilter);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-900/50 text-red-400 border-red-500/50',
      under_investigation: 'bg-yellow-900/50 text-yellow-400 border-yellow-500/50',
      negotiation: 'bg-blue-900/50 text-blue-400 border-blue-500/50',
      arbitration: 'bg-purple-900/50 text-purple-400 border-purple-500/50',
      settled: 'bg-green-900/50 text-green-400 border-green-500/50',
      rejected: 'bg-gray-800 text-gray-400 border-gray-600',
      closed: 'bg-maritime-700 text-maritime-300 border-maritime-500',
    };
    return colors[status] || 'bg-gray-800 text-gray-400';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-maritime-400',
      medium: 'text-yellow-400',
      high: 'text-orange-400',
      critical: 'text-red-400 font-bold',
    };
    return colors[priority] || 'text-gray-400';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      cargo_damage: '📦',
      cargo_shortage: '⚖️',
      demurrage: '⏱️',
      dead_freight: '🚢',
      deviation: '🧭',
      general_average: '⚓',
    };
    return icons[type] || '📄';
  };

  const getCurrentWorkflowStep = (status: string) => {
    return workflowSteps.find((step) => step.status === status);
  };

  return (
    <ShowcaseLayout
      title="Claims Settlement"
      icon="⚖️"
      category="Risk Management"
      problem="Claims tracked in Excel, disputes take 6+ months to resolve, documentation scattered across emails, legal costs exceed $50k per arbitration, and settlement success rate under 60% due to poor evidence management."
      solution="Integrated claims management platform with automated workflow, document vault, laytime calculation verification, settlement negotiation tracker, and arbitration case builder - reducing average settlement time from 180 to 45 days and increasing success rate to 79%."
      timeSaved="6 months → 45 days"
      roi="45x"
      accuracy="79% settlement success"
      nextSection={{
        title: 'Vessel Overview',
        path: '/demo-showcase/vessel-overview',
      }}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Claims Portfolio Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-maritime-800 border-l-4 border-maritime-500 rounded-lg p-3">
              <p className="text-maritime-500 text-xs">Total Claims</p>
              <p className="text-2xl font-bold text-white mt-1">{claimSummary.totalClaims}</p>
            </div>
            <div className="bg-red-900/20 border-l-4 border-red-500 rounded-lg p-3">
              <p className="text-red-400 text-xs">Open</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{claimSummary.openClaims}</p>
            </div>
            <div className="bg-green-900/20 border-l-4 border-green-500 rounded-lg p-3">
              <p className="text-green-400 text-xs">Settled</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{claimSummary.settledClaims}</p>
            </div>
            <div className="bg-maritime-800 border-l-4 border-blue-500 rounded-lg p-3">
              <p className="text-maritime-500 text-xs">Claim Amount</p>
              <p className="text-xl font-bold text-white mt-1">
                ${(claimSummary.totalClaimAmount / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="bg-maritime-800 border-l-4 border-green-500 rounded-lg p-3">
              <p className="text-maritime-500 text-xs">Settled Amount</p>
              <p className="text-xl font-bold text-green-400 mt-1">
                ${(claimSummary.totalSettledAmount / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="bg-maritime-800 border-l-4 border-purple-500 rounded-lg p-3">
              <p className="text-maritime-500 text-xs">Avg Settlement</p>
              <p className="text-xl font-bold text-white mt-1">{claimSummary.averageSettlementTime}d</p>
            </div>
            <div className="bg-maritime-800 border-l-4 border-yellow-500 rounded-lg p-3">
              <p className="text-maritime-500 text-xs">Success Rate</p>
              <p className="text-xl font-bold text-yellow-400 mt-1">
                {claimSummary.successRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Claims List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Active Claims</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded text-sm ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                All
              </button>
              {['open', 'under_investigation', 'negotiation', 'arbitration', 'settled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded text-sm ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {workflowSteps.find((s) => s.status === status)?.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredClaims.map((claim) => (
              <div
                key={claim.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedClaim === claim.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
                onClick={() => setSelectedClaim(claim.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getTypeIcon(claim.type)}</span>
                    <div>
                      <div className="text-white font-semibold">{claim.claimNumber}</div>
                      <div className="text-xs text-gray-500">{claim.vessel}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(claim.status)}`}>
                      {workflowSteps.find((s) => s.status === claim.status)?.label}
                    </span>
                    <span className={`text-xs font-semibold uppercase ${getPriorityColor(claim.priority)}`}>
                      {claim.priority}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-400 mb-2">{claimTypeLabels[claim.type]}</div>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-white">
                    ${claim.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Filed: {claim.filedDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Claim Details */}
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{getTypeIcon(selectedClaimData.type)}</span>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedClaimData.claimNumber}</h3>
                  <div className="text-gray-400">{claimTypeLabels[selectedClaimData.type]}</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                <div>Voyage: {selectedClaimData.voyageNumber} • Vessel: {selectedClaimData.vessel}</div>
                <div>Filed: {selectedClaimData.filedDate}
                  {selectedClaimData.settledDate && ` • Settled: ${selectedClaimData.settledDate}`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm mb-1">Claim Amount</div>
              <div className="text-3xl font-bold text-white mb-2">
                ${selectedClaimData.amount.toLocaleString()}
              </div>
              {selectedClaimData.settledAmount && (
                <>
                  <div className="text-gray-400 text-sm mb-1">Settled Amount</div>
                  <div className="text-2xl font-bold text-green-400">
                    ${selectedClaimData.settledAmount.toLocaleString()}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
            <div className="text-sm font-semibold text-gray-400 mb-2">Description</div>
            <div className="text-white">{selectedClaimData.description}</div>
            {selectedClaimData.notes && (
              <>
                <div className="text-sm font-semibold text-gray-400 mt-3 mb-2">Notes</div>
                <div className="text-gray-300">{selectedClaimData.notes}</div>
              </>
            )}
          </div>

          {/* Workflow Status */}
          <div className="mb-6">
            <h4 className="text-white font-semibold mb-4">Claim Workflow Progress</h4>
            <div className="flex items-center gap-3">
              {workflowSteps.map((step, idx) => (
                <React.Fragment key={step.status}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 ${
                        selectedClaimData.status === step.status
                          ? 'border-blue-500 bg-blue-900/30'
                          : workflowSteps.findIndex((s) => s.status === selectedClaimData.status) > idx
                          ? 'border-green-500 bg-green-900/30'
                          : 'border-gray-700 bg-gray-800'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div className="text-xs text-gray-400 mt-2 text-center">{step.label}</div>
                  </div>
                  {idx < workflowSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 ${
                      workflowSteps.findIndex((s) => s.status === selectedClaimData.status) > idx
                        ? 'bg-green-500'
                        : 'bg-gray-700'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div>
            <h4 className="text-white font-semibold mb-3">Supporting Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {selectedClaimData.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center gap-3 hover:border-gray-600 transition-colors cursor-pointer"
                >
                  <div className="text-2xl">📄</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{doc.name}</div>
                    <div className="text-xs text-gray-500">{doc.type}</div>
                    <div className="text-xs text-gray-600">{doc.uploadedDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🎯</span> Claims Management Impact
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Settlement Time</div>
              <div className="text-2xl font-bold text-green-400">45 days</div>
              <div className="text-xs text-gray-500">vs 180 days traditional</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Success Rate</div>
              <div className="text-2xl font-bold text-blue-400">79%</div>
              <div className="text-xs text-gray-500">vs 58% industry avg</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Legal Costs</div>
              <div className="text-2xl font-bold text-purple-400">-65%</div>
              <div className="text-xs text-gray-500">reduced arbitration</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Documentation</div>
              <div className="text-2xl font-bold text-yellow-400">100%</div>
              <div className="text-xs text-gray-500">organized & accessible</div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
};

export default ClaimsSettlementShowcase;
