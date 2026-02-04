import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const DELAY_ALERTS = gql`
  query DelayAlerts($voyageId: String, $severity: String) {
    delayAlerts(voyageId: $voyageId, severity: $severity) {
      id voyageId type severity rootCause description delayHours eta resolvedAt resolvedBy notes createdAt
    }
    activeDelayAlerts {
      id voyageId type severity description delayHours createdAt
    }
  }
`;

const CREATE_ALERT = gql`
  mutation CreateDelayAlert($voyageId: String!, $type: String!, $description: String!, $severity: String, $delayHours: Float, $rootCause: String) {
    createDelayAlert(voyageId: $voyageId, type: $type, description: $description, severity: $severity, delayHours: $delayHours, rootCause: $rootCause) {
      id
    }
  }
`;

const RESOLVE_ALERT = gql`
  mutation ResolveAlert($id: String!, $resolvedBy: String, $notes: String) {
    resolveDelayAlert(id: $id, resolvedBy: $resolvedBy, notes: $notes) {
      id resolvedAt
    }
  }
`;

interface Alert {
  id: string;
  voyageId: string;
  type: string;
  severity: string;
  rootCause: string | null;
  description: string;
  delayHours: number;
  eta: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  notes: string | null;
  createdAt: string;
}

interface ActiveAlert {
  id: string;
  voyageId: string;
  type: string;
  severity: string;
  description: string;
  delayHours: number;
  createdAt: string;
}

const severityBadge: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  warning: 'bg-amber-500/20 text-amber-400',
  info: 'bg-blue-500/20 text-blue-400',
};

const severityOptions = ['info', 'warning', 'critical'];

const alertTypes = [
  'weather',
  'port_congestion',
  'mechanical',
  'cargo_ops',
  'customs',
  'strike',
  'other',
];

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString() : '-';

const emptyCreateForm = {
  voyageId: '',
  type: 'weather',
  severity: 'warning',
  description: '',
  delayHours: '',
  rootCause: '',
};

export function DelayAlerts() {
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterVoyageId, setFilterVoyageId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveForm, setResolveForm] = useState({ resolvedBy: '', notes: '' });

  const { data, loading, error, refetch } = useQuery(DELAY_ALERTS, {
    variables: {
      voyageId: filterVoyageId || null,
      severity: filterSeverity || null,
    },
  });

  const [createAlert, { loading: creating }] = useMutation(CREATE_ALERT);
  const [resolveAlert, { loading: resolving }] = useMutation(RESOLVE_ALERT);

  const allAlerts: Alert[] = data?.delayAlerts ?? [];
  const activeAlerts: ActiveAlert[] = data?.activeDelayAlerts ?? [];

  // Summary calculations
  const totalActive = activeAlerts.length;
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;
  const avgDelay =
    activeAlerts.length > 0
      ? activeAlerts.reduce((sum, a) => sum + (a.delayHours || 0), 0) / activeAlerts.length
      : 0;
  const today = new Date().toDateString();
  const resolvedToday = allAlerts.filter(
    (a) => a.resolvedAt && new Date(a.resolvedAt).toDateString() === today
  ).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAlert({
      variables: {
        voyageId: createForm.voyageId,
        type: createForm.type,
        description: createForm.description,
        severity: createForm.severity,
        delayHours: createForm.delayHours ? parseFloat(createForm.delayHours) : null,
        rootCause: createForm.rootCause || null,
      },
    });
    setCreateForm(emptyCreateForm);
    setShowCreate(false);
    refetch();
  };

  const handleResolve = async (id: string) => {
    await resolveAlert({
      variables: {
        id,
        resolvedBy: resolveForm.resolvedBy || null,
        notes: resolveForm.notes || null,
      },
    });
    setResolvingId(null);
    setResolveForm({ resolvedBy: '', notes: '' });
    refetch();
  };

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCreateForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Delay Alerts</h1>
          <p className="text-maritime-400 text-sm mt-1">
            Monitor and manage voyage delay alerts
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          + Add Alert
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-end gap-4 mb-6">
        <div>
          <label className="block text-xs text-maritime-400 mb-1 font-medium">
            Severity
          </label>
          <div className="flex gap-1">
            {['', 'info', 'warning', 'critical'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterSeverity === sev
                    ? 'bg-blue-600 text-white'
                    : 'bg-maritime-800 text-maritime-400 hover:bg-maritime-700'
                }`}
              >
                {sev === '' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-maritime-400 mb-1 font-medium">
            Voyage ID
          </label>
          <input
            value={filterVoyageId}
            onChange={(e) => setFilterVoyageId(e.target.value)}
            placeholder="Filter by voyage..."
            className="bg-maritime-900 border border-maritime-600 rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500 w-52"
          />
        </div>
        {filterVoyageId && (
          <button
            onClick={() => setFilterVoyageId('')}
            className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 px-3 py-1.5 rounded text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
          <p className="text-maritime-400 text-xs">Total Active</p>
          <p className="text-white text-2xl font-bold mt-1">{totalActive}</p>
        </div>
        <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
          <p className="text-maritime-400 text-xs">Critical</p>
          <p className="text-red-400 text-2xl font-bold mt-1">{criticalCount}</p>
        </div>
        <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
          <p className="text-maritime-400 text-xs">Avg Delay Hours</p>
          <p className="text-amber-400 text-2xl font-bold mt-1 font-mono">
            {avgDelay.toFixed(1)}h
          </p>
        </div>
        <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
          <p className="text-maritime-400 text-xs">Resolved Today</p>
          <p className="text-green-400 text-2xl font-bold mt-1">{resolvedToday}</p>
        </div>
      </div>

      {/* Alerts Table */}
      {loading && <p className="text-maritime-400">Loading alerts...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && activeAlerts.length === 0 && allAlerts.length === 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <h3 className="text-white font-medium mt-4">No Delay Alerts</h3>
          <p className="text-maritime-400 text-sm mt-2">
            All voyages are running on schedule.
          </p>
        </div>
      )}

      {/* Active Alerts Section */}
      {!loading && activeAlerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white text-sm font-medium mb-3">
            Active Alerts ({activeAlerts.length})
          </h2>
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-maritime-800 text-maritime-400 text-xs">
                  <th className="text-left px-4 py-3 font-medium">Voyage</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Severity</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Description
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    Delay (hrs)
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Created</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="border-t border-maritime-700 hover:bg-maritime-700/30"
                  >
                    <td className="px-4 py-3 text-white font-mono text-xs">
                      {alert.voyageId}
                    </td>
                    <td className="px-4 py-3 text-maritime-300 capitalize">
                      {alert.type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${severityBadge[alert.severity] ?? 'bg-maritime-700 text-maritime-300'}`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-maritime-300 max-w-xs truncate">
                      {alert.description}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-400 font-mono">
                      {alert.delayHours ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">
                      {fmtDate(alert.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {resolvingId === alert.id ? (
                        <div className="flex flex-col gap-2 items-end">
                          <input
                            value={resolveForm.resolvedBy}
                            onChange={(e) =>
                              setResolveForm((f) => ({
                                ...f,
                                resolvedBy: e.target.value,
                              }))
                            }
                            placeholder="Resolved by..."
                            className="bg-maritime-900 border border-maritime-600 rounded px-2 py-1 text-white text-xs w-40 focus:outline-none focus:border-blue-500"
                          />
                          <input
                            value={resolveForm.notes}
                            onChange={(e) =>
                              setResolveForm((f) => ({
                                ...f,
                                notes: e.target.value,
                              }))
                            }
                            placeholder="Resolution notes..."
                            className="bg-maritime-900 border border-maritime-600 rounded px-2 py-1 text-white text-xs w-40 focus:outline-none focus:border-blue-500"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleResolve(alert.id)}
                              disabled={resolving}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                            >
                              {resolving ? '...' : 'Submit'}
                            </button>
                            <button
                              onClick={() => {
                                setResolvingId(null);
                                setResolveForm({ resolvedBy: '', notes: '' });
                              }}
                              className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 px-2 py-1 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResolvingId(alert.id)}
                          className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1 rounded text-xs font-medium"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Alerts History */}
      {!loading && allAlerts.length > 0 && (
        <div>
          <h2 className="text-white text-sm font-medium mb-3">
            All Alerts ({allAlerts.length})
          </h2>
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-maritime-800 text-maritime-400 text-xs">
                  <th className="text-left px-4 py-3 font-medium">Voyage</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Severity</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    Root Cause
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    Delay (hrs)
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {allAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="border-t border-maritime-700 hover:bg-maritime-700/30"
                  >
                    <td className="px-4 py-3 text-white font-mono text-xs">
                      {alert.voyageId}
                    </td>
                    <td className="px-4 py-3 text-maritime-300 capitalize">
                      {alert.type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${severityBadge[alert.severity] ?? 'bg-maritime-700 text-maritime-300'}`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-maritime-300 max-w-xs truncate">
                      {alert.description}
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">
                      {alert.rootCause || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-400 font-mono">
                      {alert.delayHours ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      {alert.resolvedAt ? (
                        <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                          Resolved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">
                      <span>{fmtDate(alert.createdAt)}</span>
                      {alert.resolvedAt && (
                        <span className="block text-green-400 text-xs mt-0.5">
                          Resolved: {fmtDate(alert.resolvedAt)}
                          {alert.resolvedBy && ` by ${alert.resolvedBy}`}
                        </span>
                      )}
                      {alert.notes && (
                        <span className="block text-maritime-500 text-xs mt-0.5 italic">
                          {alert.notes}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Delay Alert"
      >
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Voyage ID *">
              <input
                value={createForm.voyageId}
                onChange={setField('voyageId')}
                className={inputClass}
                required
                placeholder="Enter voyage ID"
              />
            </FormField>
            <FormField label="Type *">
              <select
                value={createForm.type}
                onChange={setField('type')}
                className={selectClass}
                required
              >
                {alertTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Severity">
              <select
                value={createForm.severity}
                onChange={setField('severity')}
                className={selectClass}
              >
                {severityOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Delay Hours">
              <input
                type="number"
                step="0.5"
                value={createForm.delayHours}
                onChange={setField('delayHours')}
                className={inputClass}
                placeholder="e.g. 12"
              />
            </FormField>
          </div>
          <FormField label="Description *">
            <input
              value={createForm.description}
              onChange={setField('description')}
              className={inputClass}
              required
              placeholder="Describe the delay..."
            />
          </FormField>
          <FormField label="Root Cause">
            <input
              value={createForm.rootCause}
              onChange={setField('rootCause')}
              className={inputClass}
              placeholder="Underlying cause of the delay..."
            />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
