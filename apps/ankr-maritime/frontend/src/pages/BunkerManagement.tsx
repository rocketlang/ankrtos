import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary } from '../components/Modal';

const RFQS = gql`
  query BunkerRFQs($vesselId: String, $status: String) {
    bunkerRfqs(vesselId: $vesselId, status: $status) {
      id vesselId portId fuelType quantity status deliveryDate notes createdAt
      vessel { name }
      port { name }
      quotes { id supplierName pricePerMt status }
    }
  }
`;

const QUOTE_COMPARISON = gql`
  query QuoteComparison($rfqId: String!) {
    bunkerQuoteComparison(rfqId: $rfqId) {
      id supplierName pricePerMt currency deliveryMethod minQuantity maxQuantity validUntil status notes
    }
  }
`;

const CREATE_RFQ = gql`
  mutation CreateRFQ($vesselId: String!, $portId: String!, $fuelType: String!, $quantity: Float!, $deliveryDate: DateTime, $notes: String) {
    createBunkerRFQ(vesselId: $vesselId, portId: $portId, fuelType: $fuelType, quantity: $quantity, deliveryDate: $deliveryDate, notes: $notes) { id }
  }
`;

const SEND_RFQ = gql`mutation Send($id: String!) { sendBunkerRFQ(id: $id) { id status } }`;

const ADD_QUOTE = gql`
  mutation AddQuote($rfqId: String!, $supplierName: String!, $pricePerMt: Float!, $deliveryMethod: String, $notes: String) {
    addBunkerQuote(rfqId: $rfqId, supplierName: $supplierName, pricePerMt: $pricePerMt, deliveryMethod: $deliveryMethod, notes: $notes) { id }
  }
`;

const AWARD = gql`mutation Award($quoteId: String!) { awardBunkerQuote(quoteId: $quoteId) { id status } }`;

const statusBadge: Record<string, string> = {
  draft: 'bg-maritime-700 text-maritime-300',
  sent: 'bg-blue-900/50 text-blue-400',
  quotes_received: 'bg-yellow-900/50 text-yellow-400',
  awarded: 'bg-green-900/50 text-green-400',
  cancelled: 'bg-red-900/50 text-red-400',
};

const fuelBadge: Record<string, string> = {
  IFO: 'bg-gray-800 text-gray-400',
  VLSFO: 'bg-blue-900/50 text-blue-400',
  MGO: 'bg-green-900/50 text-green-400',
  LNG: 'bg-purple-900/50 text-purple-400',
  LSMGO: 'bg-teal-900/50 text-teal-400',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

export function BunkerManagement() {
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    vesselId: '', portId: '', fuelType: 'VLSFO', quantity: '', deliveryDate: '', notes: '',
  });
  const [quoteForm, setQuoteForm] = useState({
    supplierName: '', pricePerMt: '', deliveryMethod: '', notes: '',
  });

  const { data, loading, refetch } = useQuery(RFQS, {
    variables: { status: filterStatus || undefined },
  });

  const { data: compData, loading: compLoading, refetch: refetchComp } = useQuery(QUOTE_COMPARISON, {
    variables: { rfqId: selectedRfqId ?? '' },
    skip: !selectedRfqId,
  });

  const [createRfq] = useMutation(CREATE_RFQ);
  const [sendRfq] = useMutation(SEND_RFQ);
  const [addQuote] = useMutation(ADD_QUOTE);
  const [awardQuote] = useMutation(AWARD);

  const rfqs = data?.bunkerRfqs ?? [];
  const quotes = compData?.bunkerQuoteComparison ?? [];

  const handleCreate = async () => {
    if (!createForm.vesselId || !createForm.portId || !createForm.quantity) return;
    await createRfq({
      variables: {
        ...createForm,
        quantity: parseFloat(createForm.quantity),
        deliveryDate: createForm.deliveryDate || undefined,
        notes: createForm.notes || undefined,
      },
    });
    setShowCreate(false);
    setCreateForm({ vesselId: '', portId: '', fuelType: 'VLSFO', quantity: '', deliveryDate: '', notes: '' });
    refetch();
  };

  const handleSend = async (id: string) => {
    await sendRfq({ variables: { id } });
    refetch();
  };

  const handleAddQuote = async () => {
    if (!selectedRfqId || !quoteForm.supplierName || !quoteForm.pricePerMt) return;
    await addQuote({
      variables: {
        rfqId: selectedRfqId,
        supplierName: quoteForm.supplierName,
        pricePerMt: parseFloat(quoteForm.pricePerMt),
        deliveryMethod: quoteForm.deliveryMethod || undefined,
        notes: quoteForm.notes || undefined,
      },
    });
    setShowAddQuote(false);
    setQuoteForm({ supplierName: '', pricePerMt: '', deliveryMethod: '', notes: '' });
    refetchComp();
    refetch();
  };

  const handleAward = async (quoteId: string) => {
    await awardQuote({ variables: { quoteId } });
    refetchComp();
    refetch();
  };

  // Find the cheapest quote price for highlighting
  const cheapestPrice = quotes.length > 0
    ? Math.min(...(quotes as Record<string, unknown>[]).map((q: Record<string, unknown>) => q.pricePerMt as number))
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Bunker RFQ Management</h1>
          <p className="text-maritime-400 text-sm mt-1">Request for quotes, comparison, and award</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Create RFQ
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['', 'draft', 'sent', 'quotes_received', 'awarded'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-sm px-3 py-1.5 rounded ${
              filterStatus === s
                ? 'bg-blue-600 text-white'
                : 'bg-maritime-800 text-maritime-400 hover:text-white border border-maritime-700'
            }`}
          >
            {s === '' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* RFQ Table */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-maritime-400 text-xs border-b border-maritime-700">
              <th className="text-left px-4 py-3">Vessel</th>
              <th className="text-left px-4 py-3">Port</th>
              <th className="text-left px-4 py-3">Fuel Type</th>
              <th className="text-right px-4 py-3">Quantity (MT)</th>
              <th className="text-left px-4 py-3">Delivery Date</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Quotes</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="text-center py-8 text-maritime-500">Loading...</td></tr>
            )}
            {!loading && rfqs.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-maritime-500">No RFQs found</td></tr>
            )}
            {rfqs.map((rfq: Record<string, unknown>) => {
              const vessel = rfq.vessel as Record<string, unknown> | null;
              const port = rfq.port as Record<string, unknown> | null;
              const rfqQuotes = (rfq.quotes as Record<string, unknown>[]) ?? [];
              return (
                <tr key={rfq.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                  <td className="px-4 py-3 text-white text-xs">{vessel?.name as string ?? '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">{port?.name as string ?? rfq.portId as string}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${fuelBadge[rfq.fuelType as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                      {rfq.fuelType as string}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">
                    {(rfq.quantity as number).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">
                    {rfq.deliveryDate
                      ? new Date(rfq.deliveryDate as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusBadge[rfq.status as string] ?? ''}`}>
                      {(rfq.status as string).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-maritime-300 text-xs">{rfqQuotes.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(rfq.status as string) === 'draft' && (
                        <button
                          onClick={() => handleSend(rfq.id as string)}
                          className="text-blue-400 hover:text-blue-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded"
                        >
                          Send
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedRfqId(rfq.id as string)}
                        className="text-cyan-400 hover:text-cyan-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded"
                      >
                        View Quotes
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quote Comparison Section */}
      {selectedRfqId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">Quote Comparison</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddQuote(true)}
                className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm px-3 py-1.5 rounded"
              >
                + Add Quote
              </button>
              <button
                onClick={() => setSelectedRfqId(null)}
                className="text-maritime-400 hover:text-white text-sm px-3 py-1.5"
              >
                Close
              </button>
            </div>
          </div>

          {compLoading && <p className="text-maritime-500 text-sm">Loading quotes...</p>}

          {!compLoading && quotes.length === 0 && (
            <div className="bg-maritime-800 rounded-lg p-6 border border-maritime-700 text-center">
              <p className="text-maritime-500 text-sm">No quotes received yet</p>
            </div>
          )}

          {!compLoading && quotes.length > 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                    <th className="text-left px-4 py-3">Supplier</th>
                    <th className="text-right px-4 py-3">Price/MT</th>
                    <th className="text-left px-4 py-3">Currency</th>
                    <th className="text-left px-4 py-3">Delivery</th>
                    <th className="text-right px-4 py-3">Min Qty</th>
                    <th className="text-right px-4 py-3">Max Qty</th>
                    <th className="text-left px-4 py-3">Valid Until</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(quotes as Record<string, unknown>[])]
                    .sort((a, b) => (a.pricePerMt as number) - (b.pricePerMt as number))
                    .map((q: Record<string, unknown>) => {
                      const isCheapest = (q.pricePerMt as number) === cheapestPrice;
                      return (
                        <tr
                          key={q.id as string}
                          className={`border-b border-maritime-700/30 ${
                            isCheapest ? 'bg-green-900/10' : 'hover:bg-maritime-700/20'
                          }`}
                        >
                          <td className="px-4 py-3 text-white text-xs font-medium">
                            {q.supplierName as string}
                            {isCheapest && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400">
                                Lowest
                              </span>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono text-xs font-semibold ${
                            isCheapest ? 'text-green-400' : 'text-maritime-300'
                          }`}>
                            {fmt(q.pricePerMt as number)}
                          </td>
                          <td className="px-4 py-3 text-maritime-400 text-xs">{(q.currency as string) ?? 'USD'}</td>
                          <td className="px-4 py-3 text-maritime-300 text-xs capitalize">{(q.deliveryMethod as string) ?? '-'}</td>
                          <td className="px-4 py-3 text-right text-maritime-400 font-mono text-xs">
                            {q.minQuantity ? (q.minQuantity as number).toLocaleString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-maritime-400 font-mono text-xs">
                            {q.maxQuantity ? (q.maxQuantity as number).toLocaleString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-maritime-400 text-xs">
                            {q.validUntil
                              ? new Date(q.validUntil as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                              : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              (q.status as string) === 'awarded'
                                ? 'bg-green-900/50 text-green-400'
                                : 'bg-maritime-700 text-maritime-300'
                            }`}>
                              {q.status as string}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {(q.status as string) !== 'awarded' && (
                              <button
                                onClick={() => handleAward(q.id as string)}
                                className="text-green-400 hover:text-green-300 text-[10px] bg-green-900/30 px-1.5 py-0.5 rounded"
                              >
                                Award
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create RFQ Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Bunker RFQ">
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Vessel ID">
              <input
                value={createForm.vesselId}
                onChange={(e) => setCreateForm({ ...createForm, vesselId: e.target.value })}
                className={inputClass}
                placeholder="Enter vessel ID"
              />
            </FormField>
            <FormField label="Port ID">
              <input
                value={createForm.portId}
                onChange={(e) => setCreateForm({ ...createForm, portId: e.target.value })}
                className={inputClass}
                placeholder="Enter port ID"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Fuel Type">
              <select
                value={createForm.fuelType}
                onChange={(e) => setCreateForm({ ...createForm, fuelType: e.target.value })}
                className={selectClass}
              >
                <option value="IFO">IFO</option>
                <option value="VLSFO">VLSFO</option>
                <option value="MGO">MGO</option>
                <option value="LNG">LNG</option>
                <option value="LSMGO">LSMGO</option>
              </select>
            </FormField>
            <FormField label="Quantity (MT)">
              <input
                value={createForm.quantity}
                onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
                type="number"
                step="1"
                className={inputClass}
                placeholder="e.g. 500"
              />
            </FormField>
          </div>
          <FormField label="Delivery Date">
            <input
              value={createForm.deliveryDate}
              onChange={(e) => setCreateForm({ ...createForm, deliveryDate: e.target.value })}
              type="date"
              className={inputClass}
            />
          </FormField>
          <FormField label="Notes">
            <textarea
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              rows={3}
              className={inputClass}
              placeholder="Additional requirements or notes..."
            />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setShowCreate(false)} className="text-maritime-400 text-sm hover:text-white px-4 py-2">Cancel</button>
          <button onClick={handleCreate} className={btnPrimary}>Create RFQ</button>
        </div>
      </Modal>

      {/* Add Quote Modal */}
      <Modal open={showAddQuote} onClose={() => setShowAddQuote(false)} title="Add Quote">
        <div className="space-y-1">
          <FormField label="Supplier Name">
            <input
              value={quoteForm.supplierName}
              onChange={(e) => setQuoteForm({ ...quoteForm, supplierName: e.target.value })}
              className={inputClass}
              placeholder="e.g. Peninsula Petroleum"
            />
          </FormField>
          <FormField label="Price per MT ($)">
            <input
              value={quoteForm.pricePerMt}
              onChange={(e) => setQuoteForm({ ...quoteForm, pricePerMt: e.target.value })}
              type="number"
              step="0.01"
              className={inputClass}
              placeholder="e.g. 620.50"
            />
          </FormField>
          <FormField label="Delivery Method">
            <select
              value={quoteForm.deliveryMethod}
              onChange={(e) => setQuoteForm({ ...quoteForm, deliveryMethod: e.target.value })}
              className={selectClass}
            >
              <option value="">Select</option>
              <option value="barge">Barge</option>
              <option value="truck">Truck</option>
              <option value="pipeline">Pipeline</option>
              <option value="ship_to_ship">Ship to Ship</option>
            </select>
          </FormField>
          <FormField label="Notes">
            <textarea
              value={quoteForm.notes}
              onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
              rows={2}
              className={inputClass}
              placeholder="Quote conditions..."
            />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setShowAddQuote(false)} className="text-maritime-400 text-sm hover:text-white px-4 py-2">Cancel</button>
          <button onClick={handleAddQuote} className={btnPrimary}>Add Quote</button>
        </div>
      </Modal>
    </div>
  );
}
