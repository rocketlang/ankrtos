/**
 * Tariff Management Dashboard
 * Phase 6: DA Desk & Port Agency
 * Combines: Tariff Ingestion + Update Workflow + Change Alerts
 * Business Value: $105K/year ($30K ingestion + $25K workflow + $50K alerts)
 */

import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

// ========================================
// GRAPHQL QUERIES & MUTATIONS
// ========================================

const TARIFF_ALERTS = gql`
  query TariffChangeAlerts($portId: String, $severity: String) {
    tariffChangeAlerts(portId: $portId, severity: $severity) {
      id
      portId
      changeType
      severity
      oldAmount
      newAmount
      percentChange
      affectedVoyages
      estimatedImpact
      detectedAt
      acknowledged
    }
  }
`;

const UPDATE_CYCLES = gql`
  query TariffUpdateCycles($status: String) {
    tariffUpdateCycles(status: $status) {
      id
      quarter
      year
      status
      startDate
      completionDate
      totalPorts
      portsCompleted
      nextReminderDate
    }
  }
`;

const INGESTION_JOBS = gql`
  query TariffIngestionJobs($status: String) {
    tariffIngestionJobs(status: $status) {
      id
      portId
      documentType
      status
      totalItems
      extractedItems
      validatedItems
      errorCount
      confidence
      startedAt
      completedAt
    }
  }
`;

const INGEST_TARIFF = gql`
  mutation IngestTariffDocument($portId: String!, $documentUrl: String!, $documentType: String!) {
    ingestTariffDocument(portId: $portId, documentUrl: $documentUrl, documentType: $documentType) {
      id
      status
    }
  }
`;

const START_UPDATE_CYCLE = gql`
  mutation StartUpdateCycle($quarter: String!, $year: Int!) {
    startUpdateCycle(quarter: $quarter, year: $year) {
      id
      status
    }
  }
`;

const ACKNOWLEDGE_ALERT = gql`
  mutation AcknowledgeAlert($id: ID!) {
    acknowledgeTariffAlert(id: $id) {
      id
      acknowledged
    }
  }
`;

const SUBSCRIBE_TO_ALERTS = gql`
  mutation SubscribeToAlerts($portId: String!, $alertTypes: [String!]!) {
    subscribeToTariffAlerts(portId: $portId, alertTypes: $alertTypes) {
      success
    }
  }
`;

// ========================================
// TYPES
// ========================================

const severityColors: Record<string, string> = {
  info: 'bg-blue-900/50 text-blue-400',
  warning: 'bg-yellow-900/50 text-yellow-400',
  critical: 'bg-red-900/50 text-red-400',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-400',
  processing: 'bg-blue-900/50 text-blue-400',
  completed: 'bg-green-900/50 text-green-400',
  failed: 'bg-red-900/50 text-red-400',
  in_progress: 'bg-blue-900/50 text-blue-400',
};

const changeTypeIcons: Record<string, string> = {
  price_increase: '📈',
  price_decrease: '📉',
  new_charge: '✨',
  removed_charge: '🗑️',
  policy_change: '📋',
};

// ========================================
// COMPONENT
// ========================================

export function TariffManagement() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'ingestion' | 'cycles'>('alerts');
  const [showIngest, setShowIngest] = useState(false);
  const [showStartCycle, setShowStartCycle] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);

  const [ingestForm, setIngestForm] = useState({
    portId: '',
    documentUrl: '',
    documentType: 'pdf',
  });

  const [cycleForm, setCycleForm] = useState({
    quarter: 'Q1',
    year: new Date().getFullYear(),
  });

  const { data: alertsData, loading: alertsLoading, refetch: refetchAlerts } = useQuery(TARIFF_ALERTS);
  const { data: cyclesData, loading: cyclesLoading } = useQuery(UPDATE_CYCLES);
  const { data: jobsData, loading: jobsLoading } = useQuery(INGESTION_JOBS);

  const [ingestTariff, { loading: ingesting }] = useMutation(INGEST_TARIFF);
  const [startUpdateCycle, { loading: startingCycle }] = useMutation(START_UPDATE_CYCLE);
  const [acknowledgeAlert] = useMutation(ACKNOWLEDGE_ALERT);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    await ingestTariff({
      variables: {
        portId: ingestForm.portId,
        documentUrl: ingestForm.documentUrl,
        documentType: ingestForm.documentType,
      },
    });
    setShowIngest(false);
    setIngestForm({ portId: '', documentUrl: '', documentType: 'pdf' });
  };

  const handleStartCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    await startUpdateCycle({
      variables: {
        quarter: cycleForm.quarter,
        year: cycleForm.year,
      },
    });
    setShowStartCycle(false);
  };

  const handleAcknowledge = async (id: string) => {
    await acknowledgeAlert({ variables: { id } });
    refetchAlerts();
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const alerts = alertsData?.tariffChangeAlerts || [];
  const cycles = cyclesData?.tariffUpdateCycles || [];
  const jobs = jobsData?.tariffIngestionJobs || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          Tariff Management
        </h1>
        <p className="text-gray-400">Automated ingestion, quarterly updates & change alerts • $105K/year value</p>
      </div>

      {/* Tabs */}
      <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-2 mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'alerts'
              ? 'bg-blue-500 text-white'
              : 'bg-transparent text-gray-400 hover:bg-blue-900/30'
          }`}
        >
          🚨 Change Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab('ingestion')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'ingestion'
              ? 'bg-blue-500 text-white'
              : 'bg-transparent text-gray-400 hover:bg-blue-900/30'
          }`}
        >
          📤 Ingestion Jobs ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('cycles')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'cycles'
              ? 'bg-blue-500 text-white'
              : 'bg-transparent text-gray-400 hover:bg-blue-900/30'
          }`}
        >
          🔄 Update Cycles ({cycles.length})
        </button>
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-1">Total Alerts</div>
              <div className="text-3xl font-bold text-white">{alerts.length}</div>
              <div className="text-xs text-gray-500">
                {alerts.filter((a: any) => !a.acknowledged).length} unacknowledged
              </div>
            </div>

            <div className="bg-yellow-900/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-1">Critical Alerts</div>
              <div className="text-3xl font-bold text-yellow-400">
                {alerts.filter((a: any) => a.severity === 'critical').length}
              </div>
              <div className="text-xs text-gray-500">Require immediate attention</div>
            </div>

            <div className="bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-1">Estimated Impact</div>
              <div className="text-3xl font-bold text-red-400">
                {fmt(alerts.reduce((sum: number, a: any) => sum + (a.estimatedImpact || 0), 0))}
              </div>
              <div className="text-xs text-gray-500">Across all affected voyages</div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Tariff Change Alerts</h2>
              <button onClick={() => setShowSubscribe(true)} className={btnSecondary}>
                ⚙️ Configure Alerts
              </button>
            </div>

            {alertsLoading ? (
              <div className="text-center py-8 text-gray-400">Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No tariff changes detected</div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.acknowledged ? 'bg-blue-950/30 border-blue-500/20' : 'bg-blue-900/40 border-blue-400/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{changeTypeIcons[alert.changeType] || '📊'}</span>
                        <div>
                          <div className="text-white font-semibold">
                            {alert.changeType.replace(/_/g, ' ').toUpperCase()} - {alert.portId}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            Detected {new Date(alert.detectedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${severityColors[alert.severity]}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                      <div>
                        <span className="text-gray-400">Old Amount:</span>
                        <div className="text-white">{fmt(alert.oldAmount)}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">New Amount:</span>
                        <div className="text-white">{fmt(alert.newAmount)}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Change:</span>
                        <div className={alert.percentChange > 0 ? 'text-red-400' : 'text-green-400'}>
                          {alert.percentChange > 0 ? '+' : ''}{alert.percentChange.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Affected Voyages:</span>
                        <div className="text-orange-400">{alert.affectedVoyages}</div>
                      </div>
                    </div>

                    {alert.estimatedImpact && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-400">Estimated Impact:</span>
                        <span className="text-red-400 ml-2 font-semibold">{fmt(alert.estimatedImpact)}</span>
                      </div>
                    )}

                    {!alert.acknowledged && (
                      <div className="mt-3 pt-3 border-t border-blue-500/30">
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          ✓ Acknowledge Alert
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ingestion Tab */}
      {activeTab === 'ingestion' && (
        <div className="space-y-6">
          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Tariff Ingestion Jobs</h2>
              <button onClick={() => setShowIngest(true)} className={btnPrimary}>
                📤 Upload Tariff Document
              </button>
            </div>

            {jobsLoading ? (
              <div className="text-center py-8 text-gray-400">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No ingestion jobs found</div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job: any) => (
                  <div key={job.id} className="bg-blue-950/30 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-white font-semibold">{job.portId}</div>
                        <div className="text-sm text-gray-400">{job.documentType.toUpperCase()} Document</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${statusColors[job.status]}`}>
                        {job.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Total Items:</span>
                        <div className="text-white">{job.totalItems}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Extracted:</span>
                        <div className="text-blue-400">{job.extractedItems}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Validated:</span>
                        <div className="text-green-400">{job.validatedItems}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Errors:</span>
                        <div className="text-red-400">{job.errorCount}</div>
                      </div>
                    </div>

                    {job.confidence && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-400">Confidence Score:</span>
                          <span className="text-white">{(job.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="bg-blue-950/50 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-green-500 h-full transition-all"
                            style={{ width: `${job.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-2">
                      Started {new Date(job.startedAt).toLocaleString()}
                      {job.completedAt && ` • Completed ${new Date(job.completedAt).toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Update Cycles Tab */}
      {activeTab === 'cycles' && (
        <div className="space-y-6">
          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Quarterly Update Cycles</h2>
              <button onClick={() => setShowStartCycle(true)} className={btnPrimary}>
                🔄 Start New Cycle
              </button>
            </div>

            {cyclesLoading ? (
              <div className="text-center py-8 text-gray-400">Loading cycles...</div>
            ) : cycles.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No update cycles found</div>
            ) : (
              <div className="space-y-3">
                {cycles.map((cycle: any) => (
                  <div key={cycle.id} className="bg-blue-950/30 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-white font-semibold text-lg">
                          {cycle.quarter} {cycle.year}
                        </div>
                        <div className="text-sm text-gray-400">
                          Started {new Date(cycle.startDate).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${statusColors[cycle.status]}`}>
                        {cycle.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400">Progress:</span>
                        <span className="text-white">
                          {cycle.portsCompleted} / {cycle.totalPorts} ports
                        </span>
                      </div>
                      <div className="bg-blue-950/50 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{ width: `${(cycle.portsCompleted / cycle.totalPorts) * 100}%` }}
                        />
                      </div>
                    </div>

                    {cycle.nextReminderDate && cycle.status === 'in_progress' && (
                      <div className="text-sm text-yellow-400">
                        📅 Next reminder: {new Date(cycle.nextReminderDate).toLocaleDateString()}
                      </div>
                    )}

                    {cycle.completionDate && (
                      <div className="text-sm text-green-400">
                        ✓ Completed {new Date(cycle.completionDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ingest Tariff Modal */}
      <Modal open={showIngest} onClose={() => setShowIngest(false)} title="Upload Tariff Document">
        <form onSubmit={handleIngest} className="space-y-4">
          <FormField label="Port ID">
            <input
              type="text"
              value={ingestForm.portId}
              onChange={(e) => setIngestForm({ ...ingestForm, portId: e.target.value })}
              className={inputClass}
              required
            />
          </FormField>

          <FormField label="Document URL or File Path">
            <input
              type="text"
              value={ingestForm.documentUrl}
              onChange={(e) => setIngestForm({ ...ingestForm, documentUrl: e.target.value })}
              placeholder="https://... or /path/to/tariff.pdf"
              className={inputClass}
              required
            />
          </FormField>

          <FormField label="Document Type">
            <select
              value={ingestForm.documentType}
              onChange={(e) => setIngestForm({ ...ingestForm, documentType: e.target.value })}
              className={selectClass}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="html">HTML</option>
            </select>
          </FormField>

          <div className="bg-blue-950/50 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">How it works:</h4>
            <ol className="text-sm text-gray-300 space-y-1">
              <li>1. Upload tariff document (PDF, Excel, CSV, HTML)</li>
              <li>2. AI extracts structured data with OCR if needed</li>
              <li>3. LLM validates and categorizes charges</li>
              <li>4. Review low-confidence items manually</li>
              <li>5. Bulk import validated tariffs (85% faster)</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={ingesting} className={btnPrimary}>
              {ingesting ? 'Uploading...' : 'Upload & Process'}
            </button>
            <button type="button" onClick={() => setShowIngest(false)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Start Update Cycle Modal */}
      <Modal open={showStartCycle} onClose={() => setShowStartCycle(false)} title="Start Quarterly Update Cycle">
        <form onSubmit={handleStartCycle} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quarter">
              <select
                value={cycleForm.quarter}
                onChange={(e) => setCycleForm({ ...cycleForm, quarter: e.target.value })}
                className={selectClass}
              >
                <option value="Q1">Q1 (Jan-Mar)</option>
                <option value="Q2">Q2 (Apr-Jun)</option>
                <option value="Q3">Q3 (Jul-Sep)</option>
                <option value="Q4">Q4 (Oct-Dec)</option>
              </select>
            </FormField>

            <FormField label="Year">
              <input
                type="number"
                value={cycleForm.year}
                onChange={(e) => setCycleForm({ ...cycleForm, year: parseInt(e.target.value) })}
                className={inputClass}
                required
              />
            </FormField>
          </div>

          <div className="bg-blue-950/50 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Quarterly Update Process:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Automated reminders sent to port contacts</li>
              <li>• Track progress across all ports</li>
              <li>• Version comparison for changes</li>
              <li>• Stakeholder notifications</li>
              <li>• Auto-complete when all ports updated</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={startingCycle} className={btnPrimary}>
              {startingCycle ? 'Starting...' : 'Start Update Cycle'}
            </button>
            <button type="button" onClick={() => setShowStartCycle(false)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
