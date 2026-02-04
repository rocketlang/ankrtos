import { useQuery, useMutation, useLazyQuery, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';
import { NextStepBanner } from '../components/NextStepBanner';

const LAYTIME_QUERY = gql`
  query LaytimeCalculations {
    laytimeCalculations {
      id voyageId portId type allowedHours usedHours demurrageRate despatchRate
      currency result amountDue norTendered norAccepted commencedAt completedAt notes createdAt
    }
    voyages { id voyageNumber }
    ports { id unlocode name }
  }
`;

const SOF_QUERY = gql`
  query SofEntries($laytimeCalculationId: String!) {
    sofEntries(laytimeCalculationId: $laytimeCalculationId) {
      id eventType eventTime timeUsed excluded excludeReason remarks
    }
  }
`;

const CREATE_LAYTIME = gql`
  mutation CreateLaytime(
    $voyageId: String!, $portId: String, $type: String!,
    $allowedHours: Float!, $demurrageRate: Float, $despatchRate: Float, $currency: String
  ) {
    createLaytimeCalculation(
      voyageId: $voyageId, portId: $portId, type: $type,
      allowedHours: $allowedHours, demurrageRate: $demurrageRate,
      despatchRate: $despatchRate, currency: $currency
    ) { id }
  }
`;

const ADD_SOF_ENTRY = gql`
  mutation AddSofEntry(
    $laytimeCalculationId: String!, $eventType: String!, $eventTime: DateTime!,
    $timeUsed: Float, $excluded: Boolean, $excludeReason: String, $remarks: String
  ) {
    addSofEntry(
      laytimeCalculationId: $laytimeCalculationId, eventType: $eventType,
      eventTime: $eventTime, timeUsed: $timeUsed, excluded: $excluded,
      excludeReason: $excludeReason, remarks: $remarks
    ) { id }
  }
`;

const UPDATE_TIMELINE = gql`
  mutation UpdateTimeline($id: String!, $norTendered: DateTime, $norAccepted: DateTime, $commencedAt: DateTime, $completedAt: DateTime) {
    updateLaytimeTimeline(id: $id, norTendered: $norTendered, norAccepted: $norAccepted, commencedAt: $commencedAt, completedAt: $completedAt) { id }
  }
`;

const resultColors: Record<string, string> = {
  pending: 'bg-gray-800 text-gray-400',
  within_laytime: 'bg-green-900/50 text-green-400',
  on_demurrage: 'bg-red-900/50 text-red-400',
  on_despatch: 'bg-blue-900/50 text-blue-400',
};

const sofEventTypes = [
  'nor_tendered', 'nor_accepted', 'berthed', 'commenced_loading',
  'completed_loading', 'commenced_discharge', 'completed_discharge',
  'hatch_open', 'hatch_closed', 'rain_start', 'rain_stop',
  'holiday', 'customs_hold', 'equipment_breakdown', 'shift_change',
];

const emptyCreateForm = {
  voyageId: '', portId: '', type: 'loading', allowedHours: '72',
  demurrageRate: '15000', despatchRate: '7500', currency: 'USD',
};
const emptySofForm = {
  eventType: 'nor_tendered', eventTime: '', timeUsed: '0',
  excluded: false, excludeReason: '', remarks: '',
};

export function Laytime() {
  const { data, loading, refetch } = useQuery(LAYTIME_QUERY);
  const [createLaytime, { loading: creating }] = useMutation(CREATE_LAYTIME);
  const [addSofEntry, { loading: addingSof }] = useMutation(ADD_SOF_ENTRY);
  const [updateTimeline] = useMutation(UPDATE_TIMELINE);
  const [fetchSof, { data: sofData, loading: sofLoading }] = useLazyQuery(SOF_QUERY, { fetchPolicy: 'network-only' });

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [expandedCalc, setExpandedCalc] = useState<string | null>(null);
  const [showAddSof, setShowAddSof] = useState(false);
  const [sofForm, setSofForm] = useState(emptySofForm);
  const [showTimeline, setShowTimeline] = useState<string | null>(null);
  const [timelineForm, setTimelineForm] = useState({ norTendered: '', norAccepted: '', commencedAt: '', completedAt: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLaytime({
      variables: {
        voyageId: createForm.voyageId, portId: createForm.portId || null,
        type: createForm.type, allowedHours: Number(createForm.allowedHours),
        demurrageRate: createForm.demurrageRate ? Number(createForm.demurrageRate) : null,
        despatchRate: createForm.despatchRate ? Number(createForm.despatchRate) : null,
        currency: createForm.currency,
      },
    });
    setCreateForm(emptyCreateForm);
    setShowCreate(false);
    refetch();
  };

  const handleExpand = (id: string) => {
    if (expandedCalc === id) { setExpandedCalc(null); return; }
    setExpandedCalc(id);
    fetchSof({ variables: { laytimeCalculationId: id } });
  };

  const handleAddSof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedCalc) return;
    await addSofEntry({
      variables: {
        laytimeCalculationId: expandedCalc,
        eventType: sofForm.eventType,
        eventTime: new Date(sofForm.eventTime).toISOString(),
        timeUsed: Number(sofForm.timeUsed),
        excluded: sofForm.excluded,
        excludeReason: sofForm.excludeReason || null,
        remarks: sofForm.remarks || null,
      },
    });
    setSofForm(emptySofForm);
    setShowAddSof(false);
    fetchSof({ variables: { laytimeCalculationId: expandedCalc } });
    refetch();
  };

  const handleUpdateTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTimeline) return;
    await updateTimeline({
      variables: {
        id: showTimeline,
        norTendered: timelineForm.norTendered ? new Date(timelineForm.norTendered).toISOString() : null,
        norAccepted: timelineForm.norAccepted ? new Date(timelineForm.norAccepted).toISOString() : null,
        commencedAt: timelineForm.commencedAt ? new Date(timelineForm.commencedAt).toISOString() : null,
        completedAt: timelineForm.completedAt ? new Date(timelineForm.completedAt).toISOString() : null,
      },
    });
    setShowTimeline(null);
    refetch();
  };

  const setC = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCreateForm((f) => ({ ...f, [field]: e.target.value }));
  const setS = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSofForm((f) => ({ ...f, [field]: e.target.value }));
  const setT = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setTimelineForm((f) => ({ ...f, [field]: e.target.value }));

  const voyageMap = new Map((data?.voyages ?? []).map((v: { id: string; voyageNumber: string }) => [v.id, v.voyageNumber]));
  const portMap = new Map((data?.ports ?? []).map((p: { id: string; unlocode: string; name: string }) => [p.id, `${p.unlocode} - ${p.name}`]));

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString() : '-';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Laytime Calculator</h1>
          <p className="text-maritime-400 text-sm mt-1">Demurrage &amp; despatch calculations with Statement of Facts</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Calculation</button>
      </div>

      {loading && <p className="text-maritime-400">Loading calculations...</p>}

      {!loading && data?.laytimeCalculations?.length === 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <span className="text-4xl block mb-4">&#x23F1;</span>
          <h3 className="text-white font-medium">No Laytime Calculations</h3>
          <p className="text-maritime-400 text-sm mt-2">
            Create a laytime calculation for a port call to track loading/discharging time.
          </p>
          <button onClick={() => setShowCreate(true)} className={`${btnPrimary} mt-4`}>Create Calculation</button>
        </div>
      )}

      {!loading && data?.laytimeCalculations?.length > 0 && (
        <div className="space-y-3">
          {data.laytimeCalculations.map((calc: Record<string, unknown>) => {
            const isExpanded = expandedCalc === (calc.id as string);
            const allowedH = calc.allowedHours as number;
            const usedH = calc.usedHours as number;
            const pct = allowedH > 0 ? Math.min((usedH / allowedH) * 100, 100) : 0;

            return (
              <div key={calc.id as string} className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 cursor-pointer hover:bg-maritime-700/30"
                  onClick={() => handleExpand(calc.id as string)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-maritime-500 text-xs">{isExpanded ? '\u25BC' : '\u25B6'}</span>
                      <div>
                        <span className="text-white font-medium capitalize">{calc.type as string}</span>
                        <span className="text-maritime-500 text-xs ml-3">
                          {voyageMap.get(calc.voyageId as string) ?? 'N/A'}
                          {calc.portId ? ` @ ${portMap.get(calc.portId as string) ?? ''}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${resultColors[(calc.result as string)] ?? ''}`}>
                        {(calc.result as string).replace(/_/g, ' ')}
                      </span>
                      {(calc.amountDue as number) !== 0 && (
                        <span className={`font-mono font-bold text-sm ${(calc.amountDue as number) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {calc.currency} {Math.abs(calc.amountDue as number).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          <span className="text-xs font-normal ml-1">
                            {(calc.amountDue as number) > 0 ? 'demurrage' : 'despatch'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 bg-maritime-900 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-maritime-400 text-xs w-40 text-right">
                      {usedH.toFixed(1)}h / {allowedH}h ({pct.toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* Expanded: Timeline + SOF */}
                {isExpanded && (
                  <div className="border-t border-maritime-700 bg-maritime-900/50 px-4 py-3">
                    {/* Timeline summary */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      {[
                        { label: 'NOR Tendered', val: calc.norTendered },
                        { label: 'NOR Accepted', val: calc.norAccepted },
                        { label: 'Commenced', val: calc.commencedAt },
                        { label: 'Completed', val: calc.completedAt },
                      ].map((t) => (
                        <div key={t.label} className="bg-maritime-800 rounded p-2">
                          <p className="text-maritime-500 text-xs">{t.label}</p>
                          <p className="text-white text-xs font-mono">{fmtDate(t.val as string | null)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setShowTimeline(calc.id as string); setTimelineForm({
                        norTendered: '', norAccepted: '', commencedAt: '', completedAt: '' }); }}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                        Update Timeline
                      </button>
                    </div>

                    {/* SOF Entries */}
                    <h4 className="text-maritime-300 text-xs font-medium mb-2">Statement of Facts</h4>
                    {sofLoading && <p className="text-maritime-500 text-xs">Loading SOF...</p>}
                    {!sofLoading && sofData?.sofEntries?.length > 0 && (
                      <table className="w-full text-xs mb-3">
                        <thead>
                          <tr className="text-maritime-500">
                            <th className="text-left py-1 font-medium">Event</th>
                            <th className="text-left py-1 font-medium">Time</th>
                            <th className="text-right py-1 font-medium">Hours Used</th>
                            <th className="text-center py-1 font-medium">Excluded</th>
                            <th className="text-left py-1 font-medium">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sofData.sofEntries.map((e: Record<string, unknown>) => (
                            <tr key={e.id as string} className={`border-t border-maritime-800 ${(e.excluded as boolean) ? 'opacity-50' : ''}`}>
                              <td className="py-1.5 text-maritime-300 capitalize">{(e.eventType as string).replace(/_/g, ' ')}</td>
                              <td className="py-1.5 text-white font-mono">{fmtDate(e.eventTime as string)}</td>
                              <td className="py-1.5 text-white text-right font-mono">{(e.timeUsed as number).toFixed(1)}h</td>
                              <td className="py-1.5 text-center">
                                {(e.excluded as boolean)
                                  ? <span className="text-red-400 text-xs">{(e.excludeReason as string) ?? 'yes'}</span>
                                  : <span className="text-green-400 text-xs">counted</span>}
                              </td>
                              <td className="py-1.5 text-maritime-500">{(e.remarks as string) ?? ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {!sofLoading && (!sofData?.sofEntries || sofData.sofEntries.length === 0) && (
                      <p className="text-maritime-500 text-xs mb-2">No SOF entries yet.</p>
                    )}
                    <button onClick={() => setShowAddSof(true)}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                      + Add SOF Entry
                    </button>

                    {/* Calculation Summary */}
                    <div className="mt-4 grid grid-cols-3 gap-3 bg-maritime-800 rounded-lg p-3">
                      <div>
                        <p className="text-maritime-500 text-xs">Demurrage Rate</p>
                        <p className="text-white text-sm font-mono">
                          {calc.demurrageRate ? `${calc.currency} ${(calc.demurrageRate as number).toLocaleString()}/day` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-maritime-500 text-xs">Despatch Rate</p>
                        <p className="text-white text-sm font-mono">
                          {calc.despatchRate ? `${calc.currency} ${(calc.despatchRate as number).toLocaleString()}/day` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-maritime-500 text-xs">Time Balance</p>
                        <p className={`text-sm font-mono font-bold ${(usedH - allowedH) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {(usedH - allowedH).toFixed(1)}h
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <NextStepBanner />

      {/* Create Laytime Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Laytime Calculation">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Voyage *">
              <select value={createForm.voyageId} onChange={setC('voyageId')} className={selectClass} required>
                <option value="">-- Select --</option>
                {data?.voyages?.map((v: { id: string; voyageNumber: string }) => (
                  <option key={v.id} value={v.id}>{v.voyageNumber}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Port">
              <select value={createForm.portId} onChange={setC('portId')} className={selectClass}>
                <option value="">-- Select --</option>
                {data?.ports?.map((p: { id: string; unlocode: string; name: string }) => (
                  <option key={p.id} value={p.id}>{p.unlocode} - {p.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Type *">
              <select value={createForm.type} onChange={setC('type')} className={selectClass}>
                <option value="loading">Loading</option>
                <option value="discharging">Discharging</option>
              </select>
            </FormField>
            <FormField label="Allowed Hours *">
              <input type="number" step="0.5" value={createForm.allowedHours} onChange={setC('allowedHours')}
                className={inputClass} required placeholder="72" />
            </FormField>
            <FormField label="Demurrage Rate (per day)">
              <input type="number" step="0.01" value={createForm.demurrageRate} onChange={setC('demurrageRate')}
                className={inputClass} placeholder="15000" />
            </FormField>
            <FormField label="Despatch Rate (per day)">
              <input type="number" step="0.01" value={createForm.despatchRate} onChange={setC('despatchRate')}
                className={inputClass} placeholder="7500" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Calculation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add SOF Entry Modal */}
      <Modal open={showAddSof} onClose={() => setShowAddSof(false)} title="Add SOF Entry">
        <form onSubmit={handleAddSof}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Event Type *">
              <select value={sofForm.eventType} onChange={setS('eventType')} className={selectClass} required>
                {sofEventTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </FormField>
            <FormField label="Event Time *">
              <input type="datetime-local" value={sofForm.eventTime} onChange={setS('eventTime')} className={inputClass} required />
            </FormField>
            <FormField label="Hours Used">
              <input type="number" step="0.1" value={sofForm.timeUsed} onChange={setS('timeUsed')} className={inputClass} placeholder="0" />
            </FormField>
            <FormField label="Excluded?">
              <div className="flex items-center gap-2 mt-1">
                <input type="checkbox" checked={sofForm.excluded}
                  onChange={(e) => setSofForm((f) => ({ ...f, excluded: e.target.checked }))}
                  className="rounded bg-maritime-900 border-maritime-600" />
                <span className="text-maritime-400 text-sm">Exclude from laytime</span>
              </div>
            </FormField>
          </div>
          {sofForm.excluded && (
            <FormField label="Exclude Reason">
              <select value={sofForm.excludeReason} onChange={setS('excludeReason')} className={selectClass}>
                <option value="">-- Select --</option>
                {['rain', 'holiday', 'equipment_breakdown', 'customs_hold', 'force_majeure', 'shift_change'].map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </FormField>
          )}
          <FormField label="Remarks">
            <input value={sofForm.remarks} onChange={setS('remarks')} className={inputClass} placeholder="Heavy rain from 14:00-18:00" />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAddSof(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={addingSof} className={btnPrimary}>
              {addingSof ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Timeline Modal */}
      <Modal open={!!showTimeline} onClose={() => setShowTimeline(null)} title="Update Timeline">
        <form onSubmit={handleUpdateTimeline}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="NOR Tendered">
              <input type="datetime-local" value={timelineForm.norTendered} onChange={setT('norTendered')} className={inputClass} />
            </FormField>
            <FormField label="NOR Accepted">
              <input type="datetime-local" value={timelineForm.norAccepted} onChange={setT('norAccepted')} className={inputClass} />
            </FormField>
            <FormField label="Commenced">
              <input type="datetime-local" value={timelineForm.commencedAt} onChange={setT('commencedAt')} className={inputClass} />
            </FormField>
            <FormField label="Completed">
              <input type="datetime-local" value={timelineForm.completedAt} onChange={setT('completedAt')} className={inputClass} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowTimeline(null)} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary}>Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
