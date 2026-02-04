import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const ENQUIRIES_QUERY = gql`
  query CargoEnquiries($status: String, $cargoType: String) {
    cargoEnquiries(status: $status, cargoType: $cargoType) {
      id reference cargoType hsCode quantity tolerance packaging
      loadPort { id name unlocode }
      dischargePort { id name unlocode }
      laycanFrom laycanTo rateIndication rateUnit currency
      status notes receivedVia receivedAt createdAt
    }
  }
`;

const CREATE_ENQUIRY = gql`
  mutation CreateCargoEnquiry(
    $cargoType: String!, $quantity: Float!, $tolerance: Float,
    $packaging: String, $loadPortId: String, $dischargePortId: String,
    $laycanFrom: String, $laycanTo: String, $rateIndication: Float,
    $rateUnit: String, $currency: String, $receivedVia: String, $notes: String
  ) {
    createCargoEnquiry(
      cargoType: $cargoType, quantity: $quantity, tolerance: $tolerance,
      packaging: $packaging, loadPortId: $loadPortId, dischargePortId: $dischargePortId,
      laycanFrom: $laycanFrom, laycanTo: $laycanTo, rateIndication: $rateIndication,
      rateUnit: $rateUnit, currency: $currency, receivedVia: $receivedVia, notes: $notes
    ) { id reference }
  }
`;

const UPDATE_STATUS = gql`
  mutation UpdateEnquiryStatus($id: String!, $status: String!) {
    updateCargoEnquiryStatus(id: $id, status: $status) { id status }
  }
`;

const PORTS_QUERY = gql`
  query PortsForEnquiry { ports { id name unlocode } }
`;

const statusColors: Record<string, string> = {
  new: 'bg-blue-900/50 text-blue-400',
  under_negotiation: 'bg-yellow-900/50 text-yellow-400',
  fixed: 'bg-green-900/50 text-green-400',
  declined: 'bg-red-900/50 text-red-400',
  expired: 'bg-maritime-700 text-maritime-400',
};

const statuses = ['new', 'under_negotiation', 'fixed', 'declined', 'expired'];
const packagingTypes = ['bulk', 'liquid', 'general', 'container', 'break_bulk'];

const emptyForm = {
  cargoType: '', quantity: '', tolerance: '', packaging: 'bulk',
  loadPortId: '', dischargePortId: '', laycanFrom: '', laycanTo: '',
  rateIndication: '', rateUnit: 'per_mt', currency: 'USD', receivedVia: 'email', notes: '',
};

export function CargoEnquiries() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, loading, error, refetch } = useQuery(ENQUIRIES_QUERY, {
    variables: { status: statusFilter || undefined },
  });
  const { data: portsData } = useQuery(PORTS_QUERY);
  const [createEnquiry, { loading: creating }] = useMutation(CREATE_ENQUIRY);
  const [updateStatus] = useMutation(UPDATE_STATUS);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const ports = portsData?.ports ?? [];
  const enquiries = (data?.cargoEnquiries ?? []).filter(
    (e: { reference: string; cargoType: string }) =>
      `${e.reference} ${e.cargoType}`.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEnquiry({
      variables: {
        cargoType: form.cargoType, quantity: parseFloat(form.quantity),
        tolerance: form.tolerance ? parseFloat(form.tolerance) : null,
        packaging: form.packaging, loadPortId: form.loadPortId || null,
        dischargePortId: form.dischargePortId || null,
        laycanFrom: form.laycanFrom || null, laycanTo: form.laycanTo || null,
        rateIndication: form.rateIndication ? parseFloat(form.rateIndication) : null,
        rateUnit: form.rateUnit, currency: form.currency,
        receivedVia: form.receivedVia, notes: form.notes || null,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus({ variables: { id, status } });
    refetch();
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Cargo Enquiries</h1>
          <p className="text-maritime-400 text-sm mt-1">Incoming cargo enquiries &amp; fixtures pipeline</p>
        </div>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
            <option value="">All Statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <input type="text" placeholder="Search enquiries..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64" />
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Enquiry</button>
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading enquiries...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-left border-b border-maritime-700">
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Cargo</th>
                <th className="px-4 py-3 font-medium">Qty (MT)</th>
                <th className="px-4 py-3 font-medium">Load Port</th>
                <th className="px-4 py-3 font-medium">Disch Port</th>
                <th className="px-4 py-3 font-medium">Laycan</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Via</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e: Record<string, unknown>) => (
                <tr key={e.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white font-mono text-xs">{e.reference as string}</td>
                  <td className="px-4 py-3 text-white">{e.cargoType as string}</td>
                  <td className="px-4 py-3 text-maritime-300">
                    {(e.quantity as number).toLocaleString()}
                    {e.tolerance ? <span className="text-maritime-500 text-xs"> +/-{e.tolerance as number}%</span> : null}
                  </td>
                  <td className="px-4 py-3 text-maritime-300">
                    {e.loadPort ? (e.loadPort as { name: string }).name : '-'}
                  </td>
                  <td className="px-4 py-3 text-maritime-300">
                    {e.dischargePort ? (e.dischargePort as { name: string }).name : '-'}
                  </td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">
                    {fmtDate(e.laycanFrom as string | null)} - {fmtDate(e.laycanTo as string | null)}
                  </td>
                  <td className="px-4 py-3 text-maritime-300">
                    {e.rateIndication ? `$${(e.rateIndication as number).toFixed(2)}/${e.rateUnit as string}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-maritime-500 text-xs">{(e.receivedVia as string) || '-'}</td>
                  <td className="px-4 py-3">
                    <select value={e.status as string}
                      onChange={(ev) => handleStatusChange(e.id as string, ev.target.value)}
                      className={`px-2 py-0.5 rounded text-xs font-medium border-0 cursor-pointer ${statusColors[e.status as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                      {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {enquiries.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-maritime-500">No enquiries found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Cargo Enquiry">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Cargo Type *">
              <input value={form.cargoType} onChange={set('cargoType')} className={inputClass} required placeholder="Iron Ore Fines" />
            </FormField>
            <FormField label="Packaging">
              <select value={form.packaging} onChange={set('packaging')} className={selectClass}>
                {packagingTypes.map((p) => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Quantity (MT) *">
              <input type="number" value={form.quantity} onChange={set('quantity')} className={inputClass} required />
            </FormField>
            <FormField label="Tolerance (%)">
              <input type="number" value={form.tolerance} onChange={set('tolerance')} className={inputClass} placeholder="5" />
            </FormField>
            <FormField label="Received Via">
              <select value={form.receivedVia} onChange={set('receivedVia')} className={selectClass}>
                <option value="email">Email</option>
                <option value="broker">Broker</option>
                <option value="platform">Platform</option>
                <option value="phone">Phone</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Load Port">
              <select value={form.loadPortId} onChange={set('loadPortId')} className={selectClass}>
                <option value="">Select port...</option>
                {ports.map((p: { id: string; name: string; unlocode: string }) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.unlocode})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Discharge Port">
              <select value={form.dischargePortId} onChange={set('dischargePortId')} className={selectClass}>
                <option value="">Select port...</option>
                {ports.map((p: { id: string; name: string; unlocode: string }) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.unlocode})</option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Laycan From">
              <input type="date" value={form.laycanFrom} onChange={set('laycanFrom')} className={inputClass} />
            </FormField>
            <FormField label="Laycan To">
              <input type="date" value={form.laycanTo} onChange={set('laycanTo')} className={inputClass} />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Rate Indication">
              <input type="number" step="0.01" value={form.rateIndication} onChange={set('rateIndication')} className={inputClass} />
            </FormField>
            <FormField label="Rate Unit">
              <select value={form.rateUnit} onChange={set('rateUnit')} className={selectClass}>
                <option value="per_mt">Per MT</option>
                <option value="lumpsum">Lumpsum</option>
                <option value="per_day">Per Day</option>
              </select>
            </FormField>
            <FormField label="Currency">
              <select value={form.currency} onChange={set('currency')} className={selectClass}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={set('notes')} className={`${inputClass} h-16 resize-none`} />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Enquiry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
