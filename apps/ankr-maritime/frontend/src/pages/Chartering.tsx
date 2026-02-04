import { useQuery, useMutation, useLazyQuery, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';
import { NextStepBanner } from '../components/NextStepBanner';

const CHARTERS_QUERY = gql`
  query Charters {
    charters { id reference type status vesselId chartererId freightRate freightUnit currency laycanStart laycanEnd createdAt }
    vessels { id name imo }
    companies { id name type }
  }
`;

const CREATE_CHARTER = gql`
  mutation CreateCharter(
    $reference: String!, $type: String!, $vesselId: String, $chartererId: String,
    $freightRate: Float, $freightUnit: String, $currency: String, $notes: String
  ) {
    createCharter(
      reference: $reference, type: $type, vesselId: $vesselId, chartererId: $chartererId,
      freightRate: $freightRate, freightUnit: $freightUnit, currency: $currency, notes: $notes
    ) { id }
  }
`;

const TRANSITION_STATUS = gql`
  mutation TransitionCharterStatus($id: String!, $status: String!) {
    transitionCharterStatus(id: $id, status: $status) { id status }
  }
`;

const CHARTER_PARTY_QUERY = gql`
  query CharterParty($charterId: String!) {
    charterParty(charterId: $charterId) { id charterId formType loadPort dischargePort content }
  }
`;

const CP_CLAUSES_QUERY = gql`
  query CPClauses($charterPartyId: String!) {
    charterPartyClauses(charterPartyId: $charterPartyId) { id clauseId orderIndex amendments }
  }
`;

const CLAUSES_LIBRARY = gql`
  query ClausesLibrary($category: String, $search: String) {
    clauses(category: $category, search: $search) { id code title body category source }
  }
`;

const CREATE_CP = gql`
  mutation CreateCP($charterId: String!, $formType: String, $loadPort: String, $dischargePort: String) {
    createCharterParty(charterId: $charterId, formType: $formType, loadPort: $loadPort, dischargePort: $dischargePort) { id }
  }
`;

const ADD_CLAUSE_TO_CP = gql`
  mutation AddClauseToCP($charterPartyId: String!, $clauseId: String!, $amendments: String) {
    addClauseToCharterParty(charterPartyId: $charterPartyId, clauseId: $clauseId, amendments: $amendments) { id }
  }
`;

const REMOVE_CLAUSE_FROM_CP = gql`
  mutation RemoveClause($id: String!) {
    removeClauseFromCharterParty(id: $id) { id }
  }
`;

const statusColors: Record<string, string> = {
  draft: 'bg-gray-800 text-gray-400',
  on_subs: 'bg-yellow-900/50 text-yellow-400',
  fixed: 'bg-blue-900/50 text-blue-400',
  executed: 'bg-green-900/50 text-green-400',
  completed: 'bg-green-900/30 text-green-300',
  cancelled: 'bg-red-900/50 text-red-400',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['on_subs'],
  on_subs: ['fixed', 'cancelled'],
  fixed: ['executed', 'cancelled'],
  executed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const charterTypes = ['voyage', 'time', 'bareboat', 'coa'];
const currencies = ['USD', 'EUR', 'GBP', 'INR', 'SGD', 'JPY'];
const freightUnits = ['MT', 'CBM', 'lumpsum', 'day'];
const cpFormTypes = ['GENCON', 'ASBATANKVOY', 'BALTIME', 'SHELLVOY', 'NYPE', 'BARECON', 'Custom'];
const clauseCategories = ['demurrage', 'laytime', 'insurance', 'war', 'ice', 'piracy', 'general', 'custom'];

const emptyForm = {
  reference: '', type: 'voyage', vesselId: '', chartererId: '',
  freightRate: '', freightUnit: 'MT', currency: 'USD', notes: '',
};

const emptyCPForm = { formType: 'GENCON', loadPort: '', dischargePort: '' };

export function Chartering() {
  const { data, loading, error, refetch } = useQuery(CHARTERS_QUERY);
  const [createCharter, { loading: creating }] = useMutation(CREATE_CHARTER);
  const [transitionStatus] = useMutation(TRANSITION_STATUS);
  const [createCP] = useMutation(CREATE_CP);
  const [addClauseToCP] = useMutation(ADD_CLAUSE_TO_CP);
  const [removeClause] = useMutation(REMOVE_CLAUSE_FROM_CP);
  const [fetchCP, { data: cpData }] = useLazyQuery(CHARTER_PARTY_QUERY, { fetchPolicy: 'network-only' });
  const [fetchCPClauses, { data: cpClausesData }] = useLazyQuery(CP_CLAUSES_QUERY, { fetchPolicy: 'network-only' });
  const [fetchLibrary, { data: libraryData }] = useLazyQuery(CLAUSES_LIBRARY, { fetchPolicy: 'network-only' });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateCP, setShowCreateCP] = useState(false);
  const [cpForm, setCpForm] = useState(emptyCPForm);
  const [showClauseLibrary, setShowClauseLibrary] = useState(false);
  const [clauseSearch, setClauseSearch] = useState('');
  const [clauseCategoryFilter, setClauseCategoryFilter] = useState('');
  const [activeCP, setActiveCP] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCharter({
      variables: {
        reference: form.reference, type: form.type,
        vesselId: form.vesselId || null, chartererId: form.chartererId || null,
        freightRate: form.freightRate ? Number(form.freightRate) : null,
        freightUnit: form.freightUnit, currency: form.currency,
        notes: form.notes || null,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const handleTransition = async (id: string, status: string) => {
    try {
      await transitionStatus({ variables: { id, status } });
      refetch();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const toggleExpand = (charterId: string) => {
    if (expandedId === charterId) {
      setExpandedId(null);
    } else {
      setExpandedId(charterId);
      fetchCP({ variables: { charterId } });
    }
  };

  const handleCreateCP = async (e: React.FormEvent, charterId: string) => {
    e.preventDefault();
    await createCP({
      variables: {
        charterId,
        formType: cpForm.formType,
        loadPort: cpForm.loadPort || null,
        dischargePort: cpForm.dischargePort || null,
      },
    });
    setShowCreateCP(false);
    setCpForm(emptyCPForm);
    fetchCP({ variables: { charterId } });
  };

  const openClauseLibrary = (charterPartyId: string) => {
    setActiveCP(charterPartyId);
    setClauseSearch('');
    setClauseCategoryFilter('');
    setShowClauseLibrary(true);
    fetchLibrary({ variables: {} });
  };

  const handleAddClause = async (clauseId: string) => {
    await addClauseToCP({ variables: { charterPartyId: activeCP, clauseId } });
    fetchCPClauses({ variables: { charterPartyId: activeCP } });
  };

  const handleRemoveClause = async (id: string) => {
    await removeClause({ variables: { id } });
    if (activeCP) fetchCPClauses({ variables: { charterPartyId: activeCP } });
    // Re-fetch for the expanded CP
    const cp = cpData?.charterParty;
    if (cp) fetchCPClauses({ variables: { charterPartyId: cp.id } });
  };

  const searchClauses = () => {
    fetchLibrary({
      variables: {
        category: clauseCategoryFilter || null,
        search: clauseSearch || null,
      },
    });
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const setCPField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCpForm((f) => ({ ...f, [field]: e.target.value }));

  const charterers = data?.companies?.filter((c: { type: string }) => c.type === 'charterer') ?? [];
  const cp = cpData?.charterParty;
  const cpClauses = cpClausesData?.charterPartyClauses ?? [];
  const libraryClauses = libraryData?.clauses ?? [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Chartering</h1>
          <p className="text-maritime-400 text-sm mt-1">Charter fixtures, negotiations &amp; charter parties</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Charter</button>
      </div>

      {loading && <p className="text-maritime-400">Loading charters...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && data?.charters?.length === 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <span className="text-4xl">&#x1F4CB;</span>
          <h3 className="text-white font-medium mt-4">No Charters Yet</h3>
          <p className="text-maritime-400 text-sm mt-2">
            Create your first charter fixture to start tracking voyage chartering.
          </p>
          <button onClick={() => setShowCreate(true)} className={`${btnPrimary} mt-4`}>Create Charter</button>
        </div>
      )}

      {!loading && data?.charters?.length > 0 && (
        <div className="space-y-2">
          {data.charters.map((ch: Record<string, unknown>) => {
            const nextStatuses = VALID_TRANSITIONS[(ch.status as string)] ?? [];
            const isExpanded = expandedId === ch.id;
            return (
              <div key={ch.id as string} className={`bg-maritime-800 border rounded-lg overflow-hidden transition-colors ${isExpanded ? 'border-blue-600' : 'border-maritime-700'}`}>
                {/* Charter row */}
                <div className="flex items-center text-sm cursor-pointer hover:bg-maritime-700/30" onClick={() => toggleExpand(ch.id as string)}>
                  <div className="px-4 py-3 w-10 text-maritime-600 text-xs">{isExpanded ? '\u25B2' : '\u25BC'}</div>
                  <div className="px-2 py-3 flex-1 text-white font-medium font-mono">{ch.reference as string}</div>
                  <div className="px-2 py-3 w-24 text-maritime-300 capitalize">{ch.type as string}</div>
                  <div className="px-2 py-3 w-28 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[(ch.status as string)] ?? ''}`}>
                      {(ch.status as string).replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="px-2 py-3 w-40 text-maritime-300 text-right">
                    {ch.freightRate ? `${ch.currency} ${(ch.freightRate as number).toLocaleString()}/${ch.freightUnit}` : '-'}
                  </div>
                  <div className="px-2 py-3 w-28 text-maritime-400 text-xs">
                    {ch.laycanStart ? new Date(ch.laycanStart as string).toLocaleDateString() : '-'}
                  </div>
                  <div className="px-4 py-3 w-48" onClick={(e) => e.stopPropagation()}>
                    {nextStatuses.length > 0 && (
                      <div className="flex gap-1 justify-end">
                        {nextStatuses.map((ns: string) => (
                          <button key={ns} onClick={() => handleTransition(ch.id as string, ns)}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                              ns === 'cancelled' ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                              : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                            }`}>
                            {ns.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded: Charter Party builder */}
                {isExpanded && (
                  <div className="border-t border-maritime-700 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white text-sm font-medium">Charter Party (C/P)</h4>
                      {!cp || cp.charterId !== ch.id ? (
                        <button onClick={() => setShowCreateCP(true)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">
                          + Create C/P
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-maritime-400 text-xs">
                            Form: <span className="text-white">{cp.formType ?? 'Custom'}</span>
                          </span>
                          {cp.loadPort && (
                            <span className="text-maritime-400 text-xs">
                              Load: <span className="text-white">{cp.loadPort}</span>
                            </span>
                          )}
                          {cp.dischargePort && (
                            <span className="text-maritime-400 text-xs">
                              Discharge: <span className="text-white">{cp.dischargePort}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {cp && cp.charterId === ch.id ? (
                      <div>
                        {/* Attached clauses */}
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-maritime-300 text-xs font-medium">Attached Clauses ({cpClauses.length})</h5>
                          <button onClick={() => {
                            openClauseLibrary(cp.id);
                            fetchCPClauses({ variables: { charterPartyId: cp.id } });
                          }}
                            className="px-2 py-1 bg-maritime-700 text-maritime-300 text-xs rounded hover:bg-maritime-600">
                            + Add Clause from Library
                          </button>
                        </div>

                        {cpClauses.length === 0 ? (
                          <p className="text-maritime-500 text-xs py-4 text-center">No clauses attached yet. Add from the clause library.</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {(cpClauses as Array<Record<string, unknown>>).map((cc, idx) => (
                              <div key={cc.id as string} className="bg-maritime-900/50 rounded p-3 flex items-start gap-3">
                                <span className="text-maritime-600 text-xs font-mono w-6 flex-shrink-0">{idx + 1}.</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-xs font-medium">Clause {cc.clauseId as string}</p>
                                  {cc.amendments && (
                                    <p className="text-yellow-400 text-[10px] mt-1">Amendment: {cc.amendments as string}</p>
                                  )}
                                </div>
                                <button onClick={() => handleRemoveClause(cc.id as string)}
                                  className="text-red-500 hover:text-red-400 text-xs flex-shrink-0">
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-maritime-500 text-xs">No Charter Party created yet. Create one to start adding clauses.</p>
                    )}

                    {/* Create CP Modal */}
                    <Modal open={showCreateCP} onClose={() => setShowCreateCP(false)} title="Create Charter Party">
                      <form onSubmit={(e) => handleCreateCP(e, ch.id as string)}>
                        <FormField label="Form Type">
                          <select value={cpForm.formType} onChange={setCPField('formType')} className={selectClass}>
                            {cpFormTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField label="Load Port">
                            <input value={cpForm.loadPort} onChange={setCPField('loadPort')} className={inputClass} placeholder="INMUN" />
                          </FormField>
                          <FormField label="Discharge Port">
                            <input value={cpForm.dischargePort} onChange={setCPField('dischargePort')} className={inputClass} placeholder="SGSIN" />
                          </FormField>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                          <button type="button" onClick={() => setShowCreateCP(false)} className={btnSecondary}>Cancel</button>
                          <button type="submit" className={btnPrimary}>Create C/P</button>
                        </div>
                      </form>
                    </Modal>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Charter Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Charter Fixture">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Reference *">
              <input value={form.reference} onChange={set('reference')} className={inputClass} required placeholder="CP-2026-001" />
            </FormField>
            <FormField label="Charter Type *">
              <select value={form.type} onChange={set('type')} className={selectClass} required>
                {charterTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Vessel">
              <select value={form.vesselId} onChange={set('vesselId')} className={selectClass}>
                <option value="">-- Select --</option>
                {data?.vessels?.map((v: { id: string; name: string; imo: string }) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.imo})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Charterer">
              <select value={form.chartererId} onChange={set('chartererId')} className={selectClass}>
                <option value="">-- Select --</option>
                {charterers.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Freight Rate">
              <input type="number" step="0.01" value={form.freightRate} onChange={set('freightRate')} className={inputClass} placeholder="25.50" />
            </FormField>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Unit">
                <select value={form.freightUnit} onChange={set('freightUnit')} className={selectClass}>
                  {freightUnits.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </FormField>
              <FormField label="Currency">
                <select value={form.currency} onChange={set('currency')} className={selectClass}>
                  {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
            </div>
          </div>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={set('notes')} className={`${inputClass} h-16 resize-none`} placeholder="Additional terms..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Charter'}
            </button>
          </div>
        </form>
      </Modal>

      <NextStepBanner />

      {/* Clause Library Modal */}
      <Modal open={showClauseLibrary} onClose={() => setShowClauseLibrary(false)} title="Clause Library">
        <div className="mb-4">
          <div className="flex gap-2 mb-3">
            <input value={clauseSearch} onChange={(e) => setClauseSearch(e.target.value)}
              className={`${inputClass} flex-1`} placeholder="Search clauses..." />
            <select value={clauseCategoryFilter} onChange={(e) => setClauseCategoryFilter(e.target.value)} className={selectClass}>
              <option value="">All Categories</option>
              {clauseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={searchClauses} className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">
              Search
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {(libraryClauses as Array<Record<string, unknown>>).length === 0 ? (
            <p className="text-maritime-500 text-xs text-center py-6">No clauses found. Try a different search.</p>
          ) : (
            (libraryClauses as Array<Record<string, unknown>>).map((clause) => (
              <div key={clause.id as string} className="bg-maritime-900/50 rounded p-3 border border-maritime-700/50">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 text-xs font-mono">{clause.code as string}</span>
                      <span className="px-1.5 py-0.5 bg-maritime-700 text-maritime-400 text-[10px] rounded">{clause.category as string}</span>
                      {clause.source && <span className="text-maritime-600 text-[10px]">{clause.source as string}</span>}
                    </div>
                    <p className="text-white text-xs font-medium mt-1">{clause.title as string}</p>
                    <p className="text-maritime-500 text-[10px] mt-1 line-clamp-2">{(clause.body as string).substring(0, 150)}...</p>
                  </div>
                  <button onClick={() => handleAddClause(clause.id as string)}
                    className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded hover:bg-green-900/50 flex-shrink-0 ml-3">
                    + Add
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
