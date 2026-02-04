import { useQuery, useMutation, useLazyQuery, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';
import { NextStepBanner } from '../components/NextStepBanner';
import { VoyageMap } from '../components/VoyageMap';
import { VoyageAlertsPanel } from '../components/VoyageAlertsPanel';

const VOYAGES_QUERY = gql`
  query Voyages {
    voyages { id voyageNumber vesselId charterId status etd eta atd ata departurePortId arrivalPortId createdAt }
    vessels { id name imo }
    ports { id unlocode name }
    charters { id reference type status }
  }
`;

const MILESTONES_QUERY = gql`
  query VoyageMilestones($voyageId: String!) {
    voyageMilestones(voyageId: $voyageId) {
      id voyageId portId type planned actual notes createdAt
    }
  }
`;

const CREATE_VOYAGE = gql`
  mutation CreateVoyage(
    $voyageNumber: String!, $vesselId: String!, $charterId: String,
    $departurePortId: String, $arrivalPortId: String, $etd: DateTime, $eta: DateTime
  ) {
    createVoyage(
      voyageNumber: $voyageNumber, vesselId: $vesselId, charterId: $charterId,
      departurePortId: $departurePortId, arrivalPortId: $arrivalPortId, etd: $etd, eta: $eta
    ) { id }
  }
`;

const UPDATE_STATUS = gql`
  mutation UpdateVoyageStatus($id: String!, $status: String!, $atd: DateTime, $ata: DateTime) {
    updateVoyageStatus(id: $id, status: $status, atd: $atd, ata: $ata) { id status }
  }
`;

const ADD_MILESTONE = gql`
  mutation AddMilestone($voyageId: String!, $portId: String, $type: String!, $planned: DateTime, $actual: DateTime, $notes: String) {
    addMilestone(voyageId: $voyageId, portId: $portId, type: $type, planned: $planned, actual: $actual, notes: $notes) { id }
  }
`;

const statusColors: Record<string, string> = {
  planned: 'bg-blue-900/50 text-blue-400',
  in_progress: 'bg-yellow-900/50 text-yellow-400',
  completed: 'bg-green-900/50 text-green-400',
  cancelled: 'bg-red-900/50 text-red-400',
};

const VOYAGE_TRANSITIONS: Record<string, string[]> = {
  planned: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const milestoneTypes = [
  'departure', 'arrival', 'nor_tendered', 'nor_accepted', 'berthed',
  'loading_commenced', 'loading_completed', 'discharge_commenced',
  'discharge_completed', 'sailed', 'anchored', 'bunker_commenced', 'bunker_completed',
];

const milestoneIcons: Record<string, string> = {
  departure: '\u2693', arrival: '\u2693', nor_tendered: '\u{1F4E8}', nor_accepted: '\u2705',
  berthed: '\u{1F6A2}', loading_commenced: '\u2B06', loading_completed: '\u2705',
  discharge_commenced: '\u2B07', discharge_completed: '\u2705', sailed: '\u{1F6F3}',
  anchored: '\u2693', bunker_commenced: '\u26FD', bunker_completed: '\u2705',
};

const emptyForm = {
  voyageNumber: '', vesselId: '', charterId: '', departurePortId: '', arrivalPortId: '', etd: '', eta: '',
};
const emptyMsForm = {
  portId: '', type: 'nor_tendered', planned: '', actual: '', notes: '',
};

export function Voyages() {
  const { data, loading, error, refetch } = useQuery(VOYAGES_QUERY);
  const [createVoyage, { loading: creating }] = useMutation(CREATE_VOYAGE);
  const [updateStatus] = useMutation(UPDATE_STATUS);
  const [addMilestone, { loading: addingMs }] = useMutation(ADD_MILESTONE);
  const [fetchMilestones, { data: msData, loading: msLoading }] = useLazyQuery(MILESTONES_QUERY, { fetchPolicy: 'network-only' });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expandedVoyage, setExpandedVoyage] = useState<string | null>(null);
  const [showAddMs, setShowAddMs] = useState(false);
  const [msForm, setMsForm] = useState(emptyMsForm);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createVoyage({
      variables: {
        voyageNumber: form.voyageNumber, vesselId: form.vesselId,
        charterId: form.charterId || null,
        departurePortId: form.departurePortId || null, arrivalPortId: form.arrivalPortId || null,
        etd: form.etd ? new Date(form.etd).toISOString() : null,
        eta: form.eta ? new Date(form.eta).toISOString() : null,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const handleTransition = async (id: string, status: string) => {
    try {
      const vars: Record<string, unknown> = { id, status };
      if (status === 'in_progress') vars.atd = new Date().toISOString();
      if (status === 'completed') vars.ata = new Date().toISOString();
      await updateStatus({ variables: vars });
      refetch();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleExpand = (id: string) => {
    if (expandedVoyage === id) { setExpandedVoyage(null); return; }
    setExpandedVoyage(id);
    fetchMilestones({ variables: { voyageId: id } });
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedVoyage) return;
    await addMilestone({
      variables: {
        voyageId: expandedVoyage,
        portId: msForm.portId || null,
        type: msForm.type,
        planned: msForm.planned ? new Date(msForm.planned).toISOString() : null,
        actual: msForm.actual ? new Date(msForm.actual).toISOString() : null,
        notes: msForm.notes || null,
      },
    });
    setMsForm(emptyMsForm);
    setShowAddMs(false);
    fetchMilestones({ variables: { voyageId: expandedVoyage } });
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));
  const setMs = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setMsForm((f) => ({ ...f, [field]: e.target.value }));

  const vesselMap = new Map((data?.vessels ?? []).map((v: { id: string; name: string }) => [v.id, v.name]));
  const portMap = new Map((data?.ports ?? []).map((p: { id: string; unlocode: string; name: string }) => [p.id, `${p.unlocode} - ${p.name}`]));
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString() : '-';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Voyage Operations</h1>
          <p className="text-maritime-400 text-sm mt-1">Track vessel voyages and milestones</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/csv/voyages" className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm px-3 py-2 rounded-md">CSV</a>
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Voyage</button>
        </div>
      </div>

      {/* Active Alerts Panel */}
      <div className="mb-6">
        <VoyageAlertsPanel limit={5} />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-maritime-700">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'list'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-maritime-400 hover:text-white'
          }`}
        >
          📋 List View
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'map'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-maritime-400 hover:text-white'
          }`}
        >
          🗺️ Map View (Real-time AIS)
        </button>
      </div>

      {/* Map View */}
      {activeTab === 'map' && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <VoyageMap height="700px" />
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <>
          {loading && <p className="text-maritime-400">Loading voyages...</p>}
          {error && <p className="text-red-400">Error: {error.message}</p>}

          {!loading && data?.voyages?.length === 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
              <span className="text-4xl">&#x1F6A2;</span>
              <h3 className="text-white font-medium mt-4">No Voyages Yet</h3>
              <p className="text-maritime-400 text-sm mt-2">Create your first voyage to start tracking vessel movements.</p>
              <button onClick={() => setShowCreate(true)} className={`${btnPrimary} mt-4`}>Create Voyage</button>
            </div>
          )}

          {!loading && data?.voyages?.length > 0 && (
        <div className="space-y-2">
          {data.voyages.map((v: Record<string, unknown>) => {
            const nextStatuses = VOYAGE_TRANSITIONS[(v.status as string)] ?? [];
            const isExpanded = expandedVoyage === (v.id as string);
            return (
              <div key={v.id as string} className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
                {/* Voyage row */}
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-maritime-700/30"
                  onClick={() => handleExpand(v.id as string)}>
                  <div className="flex items-center gap-4">
                    <span className="text-maritime-500 text-xs">{isExpanded ? '\u25BC' : '\u25B6'}</span>
                    <div>
                      <span className="text-white font-medium font-mono">{v.voyageNumber as string}</span>
                      <span className="text-maritime-500 text-xs ml-3">
                        {vesselMap.get(v.vesselId as string) ?? ''}
                      </span>
                    </div>
                    <span className="text-maritime-400 text-xs">
                      {v.departurePortId ? portMap.get(v.departurePortId as string) : ''} → {v.arrivalPortId ? portMap.get(v.arrivalPortId as string) : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-maritime-400 text-xs text-right">
                      <span>ETD: {v.etd ? new Date(v.etd as string).toLocaleDateString() : '-'}</span>
                      <span className="ml-3">ETA: {v.eta ? new Date(v.eta as string).toLocaleDateString() : '-'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[(v.status as string)] ?? ''}`}>
                      {(v.status as string).replace(/_/g, ' ')}
                    </span>
                    {nextStatuses.length > 0 && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {nextStatuses.map((ns: string) => (
                          <button key={ns} onClick={() => handleTransition(v.id as string, ns)}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                              ns === 'cancelled' ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                              : ns === 'completed' ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                              : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                            }`}>
                            {ns === 'in_progress' ? 'depart' : ns.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Milestones panel */}
                {isExpanded && (
                  <div className="border-t border-maritime-700 bg-maritime-900/50 px-4 py-3">
                    <h4 className="text-maritime-300 text-xs font-medium mb-3">Voyage Milestones</h4>
                    {msLoading && <p className="text-maritime-500 text-xs">Loading milestones...</p>}
                    {!msLoading && msData?.voyageMilestones?.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {msData.voyageMilestones.map((ms: Record<string, unknown>) => (
                          <div key={ms.id as string} className="flex items-center gap-3 bg-maritime-800 rounded px-3 py-2">
                            <span className="text-lg">{milestoneIcons[(ms.type as string)] ?? '\u{1F4CC}'}</span>
                            <div className="flex-1">
                              <span className="text-white text-sm capitalize">{(ms.type as string).replace(/_/g, ' ')}</span>
                              {ms.portId && <span className="text-maritime-500 text-xs ml-2">{portMap.get(ms.portId as string)}</span>}
                            </div>
                            <div className="text-right">
                              {ms.actual && <p className="text-green-400 text-xs font-mono">{fmtDate(ms.actual as string)}</p>}
                              {!ms.actual && ms.planned && <p className="text-maritime-400 text-xs font-mono">Planned: {fmtDate(ms.planned as string)}</p>}
                            </div>
                            {ms.notes && <span className="text-maritime-500 text-xs max-w-48 truncate">{ms.notes as string}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {!msLoading && (!msData?.voyageMilestones || msData.voyageMilestones.length === 0) && (
                      <p className="text-maritime-500 text-xs mb-2">No milestones recorded yet.</p>
                    )}
                    <button onClick={() => setShowAddMs(true)}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                      + Add Milestone
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
          )}
        </>
      )}

      {/* Create Voyage Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Voyage">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Voyage Number *">
              <input value={form.voyageNumber} onChange={set('voyageNumber')} className={inputClass} required placeholder="V-2026-001" />
            </FormField>
            <FormField label="Vessel *">
              <select value={form.vesselId} onChange={set('vesselId')} className={selectClass} required>
                <option value="">-- Select Vessel --</option>
                {data?.vessels?.map((v: { id: string; name: string; imo: string }) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.imo})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Departure Port">
              <select value={form.departurePortId} onChange={set('departurePortId')} className={selectClass}>
                <option value="">-- Select --</option>
                {data?.ports?.map((p: { id: string; unlocode: string; name: string }) => (
                  <option key={p.id} value={p.id}>{p.unlocode} - {p.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Arrival Port">
              <select value={form.arrivalPortId} onChange={set('arrivalPortId')} className={selectClass}>
                <option value="">-- Select --</option>
                {data?.ports?.map((p: { id: string; unlocode: string; name: string }) => (
                  <option key={p.id} value={p.id}>{p.unlocode} - {p.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="ETD">
              <input type="date" value={form.etd} onChange={set('etd')} className={inputClass} />
            </FormField>
            <FormField label="ETA">
              <input type="date" value={form.eta} onChange={set('eta')} className={inputClass} />
            </FormField>
          </div>
          <FormField label="Linked Charter">
            <select value={form.charterId} onChange={set('charterId')} className={selectClass}>
              <option value="">-- None --</option>
              {data?.charters?.map((c: { id: string; reference: string; type: string }) => (
                <option key={c.id} value={c.id}>{c.reference} ({c.type})</option>
              ))}
            </select>
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Voyage'}
            </button>
          </div>
        </form>
      </Modal>

      <NextStepBanner />

      {/* Add Milestone Modal */}
      <Modal open={showAddMs} onClose={() => setShowAddMs(false)} title="Add Voyage Milestone">
        <form onSubmit={handleAddMilestone}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Milestone Type *">
              <select value={msForm.type} onChange={setMs('type')} className={selectClass} required>
                {milestoneTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </FormField>
            <FormField label="Port">
              <select value={msForm.portId} onChange={setMs('portId')} className={selectClass}>
                <option value="">-- Select --</option>
                {data?.ports?.map((p: { id: string; unlocode: string; name: string }) => (
                  <option key={p.id} value={p.id}>{p.unlocode} - {p.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Planned">
              <input type="datetime-local" value={msForm.planned} onChange={setMs('planned')} className={inputClass} />
            </FormField>
            <FormField label="Actual">
              <input type="datetime-local" value={msForm.actual} onChange={setMs('actual')} className={inputClass} />
            </FormField>
          </div>
          <FormField label="Notes">
            <input value={msForm.notes} onChange={setMs('notes')} className={inputClass} placeholder="Weather delay, customs clearance, etc." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAddMs(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={addingMs} className={btnPrimary}>
              {addingMs ? 'Adding...' : 'Add Milestone'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
