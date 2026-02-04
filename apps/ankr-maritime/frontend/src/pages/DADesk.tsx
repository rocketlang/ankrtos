import { useQuery, useMutation, useLazyQuery, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';
import { NextStepBanner } from '../components/NextStepBanner';

const DA_QUERY = gql`
  query DisbursementAccounts {
    disbursementAccounts {
      id voyageId portId type status currency totalAmount notes createdAt
    }
    voyages { id voyageNumber vesselId }
    ports { id unlocode name }
  }
`;

const LINE_ITEMS_QUERY = gql`
  query DaLineItems($disbursementAccountId: String!) {
    daLineItems(disbursementAccountId: $disbursementAccountId) {
      id category description amount currency tariffReference notes
    }
  }
`;

const CREATE_DA = gql`
  mutation CreateDA($voyageId: String!, $portId: String!, $type: String!, $currency: String, $notes: String) {
    createDisbursementAccount(voyageId: $voyageId, portId: $portId, type: $type, currency: $currency, notes: $notes) { id }
  }
`;

const ADD_LINE_ITEM = gql`
  mutation AddDaLineItem(
    $disbursementAccountId: String!, $category: String!, $description: String!,
    $amount: Float!, $currency: String, $tariffReference: String, $notes: String
  ) {
    addDaLineItem(
      disbursementAccountId: $disbursementAccountId, category: $category,
      description: $description, amount: $amount, currency: $currency,
      tariffReference: $tariffReference, notes: $notes
    ) { id }
  }
`;

const UPDATE_STATUS = gql`
  mutation UpdateDaStatus($id: String!, $status: String!) {
    updateDaStatus(id: $id, status: $status) { id status }
  }
`;

const statusColors: Record<string, string> = {
  draft: 'bg-gray-800 text-gray-400',
  submitted: 'bg-blue-900/50 text-blue-400',
  approved: 'bg-green-900/50 text-green-400',
  disputed: 'bg-red-900/50 text-red-400',
  settled: 'bg-green-900/30 text-green-300',
};

const DA_TRANSITIONS: Record<string, string[]> = {
  draft: ['submitted'],
  submitted: ['approved', 'disputed'],
  approved: ['settled'],
  disputed: ['submitted'],
  settled: [],
};

const daCategories = [
  'port_dues', 'pilotage', 'towage', 'berth_hire', 'agency_fee',
  'customs', 'bunker_costs', 'stevedoring', 'cargo_handling',
  'surveying', 'miscellaneous',
];

const emptyCreateForm = { voyageId: '', portId: '', type: 'pda', currency: 'USD', notes: '' };
const emptyLineForm = { category: 'port_dues', description: '', amount: '', currency: 'USD', tariffReference: '', notes: '' };

export function DADesk() {
  const { data, loading, refetch } = useQuery(DA_QUERY);
  const [createDA, { loading: creatingDA }] = useMutation(CREATE_DA);
  const [addLineItem, { loading: addingLine }] = useMutation(ADD_LINE_ITEM);
  const [updateStatus] = useMutation(UPDATE_STATUS);
  const [fetchLineItems, { data: lineData, loading: linesLoading }] = useLazyQuery(LINE_ITEMS_QUERY, { fetchPolicy: 'network-only' });

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [expandedDA, setExpandedDA] = useState<string | null>(null);
  const [showAddLine, setShowAddLine] = useState(false);
  const [lineForm, setLineForm] = useState(emptyLineForm);

  const handleCreateDA = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDA({
      variables: {
        voyageId: createForm.voyageId, portId: createForm.portId, type: createForm.type,
        currency: createForm.currency, notes: createForm.notes || null,
      },
    });
    setCreateForm(emptyCreateForm);
    setShowCreate(false);
    refetch();
  };

  const handleExpandDA = (daId: string) => {
    if (expandedDA === daId) { setExpandedDA(null); return; }
    setExpandedDA(daId);
    fetchLineItems({ variables: { disbursementAccountId: daId } });
  };

  const handleAddLineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedDA) return;
    await addLineItem({
      variables: {
        disbursementAccountId: expandedDA,
        category: lineForm.category, description: lineForm.description,
        amount: Number(lineForm.amount), currency: lineForm.currency,
        tariffReference: lineForm.tariffReference || null, notes: lineForm.notes || null,
      },
    });
    setLineForm(emptyLineForm);
    setShowAddLine(false);
    fetchLineItems({ variables: { disbursementAccountId: expandedDA } });
    refetch();
  };

  const handleTransition = async (id: string, status: string) => {
    await updateStatus({ variables: { id, status } });
    refetch();
  };

  const setC = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCreateForm((f) => ({ ...f, [field]: e.target.value }));
  const setL = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setLineForm((f) => ({ ...f, [field]: e.target.value }));

  // Lookup maps
  const voyageMap = new Map((data?.voyages ?? []).map((v: { id: string; voyageNumber: string }) => [v.id, v.voyageNumber]));
  const portMap = new Map((data?.ports ?? []).map((p: { id: string; unlocode: string; name: string }) => [p.id, `${p.unlocode} - ${p.name}`]));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">DA Desk</h1>
          <p className="text-maritime-400 text-sm mt-1">Proforma &amp; Final Disbursement Accounts</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New DA</button>
      </div>

      {loading && <p className="text-maritime-400">Loading DAs...</p>}

      {!loading && data?.disbursementAccounts?.length === 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <span className="text-4xl block mb-4">&#x1F4B0;</span>
          <h3 className="text-white font-medium">No Disbursement Accounts Yet</h3>
          <p className="text-maritime-400 text-sm mt-2">
            Create a PDA or FDA for a port call to start tracking costs.
          </p>
          <button onClick={() => setShowCreate(true)} className={`${btnPrimary} mt-4`}>Create DA</button>
        </div>
      )}

      {!loading && data?.disbursementAccounts?.length > 0 && (
        <div className="space-y-2">
          {data.disbursementAccounts.map((da: Record<string, unknown>) => {
            const isExpanded = expandedDA === (da.id as string);
            const nextStatuses = DA_TRANSITIONS[(da.status as string)] ?? [];
            return (
              <div key={da.id as string} className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
                {/* DA Header Row */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-maritime-700/30"
                  onClick={() => handleExpandDA(da.id as string)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-maritime-500 text-xs">{isExpanded ? '\u25BC' : '\u25B6'}</span>
                    <div>
                      <span className="text-white font-medium uppercase text-sm">{da.type as string}</span>
                      <span className="text-maritime-500 text-xs ml-3">
                        {voyageMap.get(da.voyageId as string) ?? 'N/A'} @ {portMap.get(da.portId as string) ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[(da.status as string)] ?? ''}`}>
                      {da.status as string}
                    </span>
                    <span className="text-white font-mono font-bold text-sm">
                      {da.currency} {(da.totalAmount as number).toLocaleString()}
                    </span>
                    {nextStatuses.length > 0 && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {nextStatuses.map((ns: string) => (
                          <button key={ns} onClick={() => handleTransition(da.id as string, ns)}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                              ns === 'disputed' ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                              : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                            }`}>
                            {ns}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Line Items */}
                {isExpanded && (
                  <div className="border-t border-maritime-700 bg-maritime-900/50 px-4 py-3">
                    {linesLoading && <p className="text-maritime-400 text-xs">Loading line items...</p>}
                    {!linesLoading && lineData?.daLineItems?.length > 0 && (
                      <table className="w-full text-xs mb-3">
                        <thead>
                          <tr className="text-maritime-500">
                            <th className="text-left py-1 font-medium">Category</th>
                            <th className="text-left py-1 font-medium">Description</th>
                            <th className="text-right py-1 font-medium">Amount</th>
                            <th className="text-left py-1 font-medium pl-4">Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineData.daLineItems.map((item: Record<string, unknown>) => (
                            <tr key={item.id as string} className="border-t border-maritime-800">
                              <td className="py-1.5 text-maritime-300 capitalize">{(item.category as string).replace(/_/g, ' ')}</td>
                              <td className="py-1.5 text-white">{item.description as string}</td>
                              <td className="py-1.5 text-white text-right font-mono">{item.currency} {(item.amount as number).toLocaleString()}</td>
                              <td className="py-1.5 text-maritime-500 pl-4">{(item.tariffReference as string) ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {!linesLoading && (!lineData?.daLineItems || lineData.daLineItems.length === 0) && (
                      <p className="text-maritime-500 text-xs mb-2">No line items yet.</p>
                    )}
                    <button onClick={() => setShowAddLine(true)}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                      + Add Line Item
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <NextStepBanner />

      {/* Create DA Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Disbursement Account">
        <form onSubmit={handleCreateDA}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Voyage *">
              <select value={createForm.voyageId} onChange={setC('voyageId')} className={selectClass} required>
                <option value="">-- Select Voyage --</option>
                {data?.voyages?.map((v: { id: string; voyageNumber: string }) => (
                  <option key={v.id} value={v.id}>{v.voyageNumber}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Port *">
              <select value={createForm.portId} onChange={setC('portId')} className={selectClass} required>
                <option value="">-- Select Port --</option>
                {data?.ports?.map((p: { id: string; unlocode: string; name: string }) => (
                  <option key={p.id} value={p.id}>{p.unlocode} - {p.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Type *">
              <select value={createForm.type} onChange={setC('type')} className={selectClass}>
                <option value="pda">PDA (Proforma)</option>
                <option value="fda">FDA (Final)</option>
              </select>
            </FormField>
            <FormField label="Currency">
              <select value={createForm.currency} onChange={setC('currency')} className={selectClass}>
                {['USD', 'EUR', 'GBP', 'INR', 'SGD'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={createForm.notes} onChange={setC('notes')} className={`${inputClass} h-16 resize-none`} placeholder="Port call notes..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creatingDA} className={btnPrimary}>
              {creatingDA ? 'Creating...' : 'Create DA'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Line Item Modal */}
      <Modal open={showAddLine} onClose={() => setShowAddLine(false)} title="Add DA Line Item">
        <form onSubmit={handleAddLineItem}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category *">
              <select value={lineForm.category} onChange={setL('category')} className={selectClass} required>
                {daCategories.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </FormField>
            <FormField label="Amount *">
              <input type="number" step="0.01" value={lineForm.amount} onChange={setL('amount')} className={inputClass} required placeholder="5000" />
            </FormField>
          </div>
          <FormField label="Description *">
            <input value={lineForm.description} onChange={setL('description')} className={inputClass} required placeholder="Inward pilotage fee" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tariff Reference">
              <input value={lineForm.tariffReference} onChange={setL('tariffReference')} className={inputClass} placeholder="JNPT-2026-PIL" />
            </FormField>
            <FormField label="Currency">
              <select value={lineForm.currency} onChange={setL('currency')} className={selectClass}>
                {['USD', 'EUR', 'GBP', 'INR', 'SGD'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Notes">
            <input value={lineForm.notes} onChange={setL('notes')} className={inputClass} placeholder="Optional note" />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAddLine(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={addingLine} className={btnPrimary}>
              {addingLine ? 'Adding...' : 'Add Line Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
