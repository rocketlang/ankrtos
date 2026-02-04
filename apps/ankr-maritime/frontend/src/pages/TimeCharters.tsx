import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const TIME_CHARTERS_QUERY = gql`
  query TimeCharters($direction: String, $status: String, $vesselId: String) {
    timeCharters(direction: $direction, status: $status, vesselId: $vesselId) {
      id reference direction vesselId hireRate currency
      deliveryDate deliveryPort redeliveryDate redeliveryPort
      minDuration maxDuration status notes
      vessel { id name }
      charter { id reference }
      createdAt
    }
  }
`;

const VESSELS_QUERY = gql`
  query Vessels {
    vessels { id name imo }
  }
`;

const CREATE_TIME_CHARTER = gql`
  mutation CreateTimeCharter(
    $direction: String!, $vesselId: String!, $hireRate: Float!, $currency: String!,
    $deliveryDate: DateTime, $deliveryPort: String, $redeliveryDate: DateTime, $redeliveryPort: String,
    $minDuration: Int, $maxDuration: Int, $notes: String
  ) {
    createTimeCharter(
      direction: $direction, vesselId: $vesselId, hireRate: $hireRate, currency: $currency,
      deliveryDate: $deliveryDate, deliveryPort: $deliveryPort,
      redeliveryDate: $redeliveryDate, redeliveryPort: $redeliveryPort,
      minDuration: $minDuration, maxDuration: $maxDuration, notes: $notes
    ) { id }
  }
`;

const directionColors: Record<string, string> = {
  tc_in: 'bg-green-900/50 text-green-400',
  tc_out: 'bg-blue-900/50 text-blue-400',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-900/50 text-green-400',
  pending: 'bg-yellow-900/50 text-yellow-400',
  completed: 'bg-maritime-700 text-maritime-300',
};

const currencies = ['USD', 'EUR', 'GBP', 'SGD', 'INR'];

const emptyForm = {
  direction: 'tc_in', vesselId: '', hireRate: '', currency: 'USD',
  deliveryDate: '', deliveryPort: '', redeliveryDate: '', redeliveryPort: '',
  minDuration: '', maxDuration: '', notes: '',
};

export function TimeCharters() {
  const [directionFilter, setDirectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const queryVars: Record<string, string | undefined> = {};
  if (directionFilter !== 'all') queryVars.direction = directionFilter;
  if (statusFilter !== 'all') queryVars.status = statusFilter;

  const { data, loading, error, refetch } = useQuery(TIME_CHARTERS_QUERY, { variables: queryVars });
  const { data: vesselData } = useQuery(VESSELS_QUERY);
  const [createTimeCharter, { loading: creating }] = useMutation(CREATE_TIME_CHARTER);

  const charters = data?.timeCharters ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTimeCharter({
      variables: {
        direction: form.direction,
        vesselId: form.vesselId,
        hireRate: Number(form.hireRate),
        currency: form.currency,
        deliveryDate: form.deliveryDate ? new Date(form.deliveryDate).toISOString() : null,
        deliveryPort: form.deliveryPort || null,
        redeliveryDate: form.redeliveryDate ? new Date(form.redeliveryDate).toISOString() : null,
        redeliveryPort: form.redeliveryPort || null,
        minDuration: form.minDuration ? Number(form.minDuration) : null,
        maxDuration: form.maxDuration ? Number(form.maxDuration) : null,
        notes: form.notes || null,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : '-';
  const fmtRate = (rate: number, currency: string) => {
    const sym: Record<string, string> = { USD: '$', EUR: '\u20AC', GBP: '\u00A3', SGD: 'S$', INR: '\u20B9' };
    return `${sym[currency] ?? currency} ${rate.toLocaleString()}/day`;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Time Charters</h1>
          <p className="text-maritime-400 text-sm mt-1">TC-In and TC-Out charter management</p>
        </div>
        <div className="flex gap-3">
          <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
            <option value="all">All Directions</option>
            <option value="tc_in">TC-In</option>
            <option value="tc_out">TC-Out</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Time Charter</button>
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading time charters...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Reference</th>
                <th className="text-left px-4 py-3 font-medium">Direction</th>
                <th className="text-left px-4 py-3 font-medium">Vessel</th>
                <th className="text-right px-4 py-3 font-medium">Hire Rate</th>
                <th className="text-left px-4 py-3 font-medium">Delivery</th>
                <th className="text-left px-4 py-3 font-medium">Redelivery</th>
                <th className="text-center px-4 py-3 font-medium">Duration</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {charters.map((tc: Record<string, unknown>) => (
                <tr key={tc.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white font-mono text-xs">{tc.reference as string}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${directionColors[(tc.direction as string)] ?? ''}`}>
                      {(tc.direction as string) === 'tc_in' ? 'TC-In' : 'TC-Out'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-maritime-300">
                    {(tc.vessel as Record<string, string>)?.name ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-maritime-300 text-right font-mono">
                    {fmtRate(tc.hireRate as number, tc.currency as string)}
                  </td>
                  <td className="px-4 py-3 text-maritime-300">
                    <div>{tc.deliveryPort as string || '-'}</div>
                    <div className="text-maritime-500 text-xs">{fmtDate(tc.deliveryDate as string | null)}</div>
                  </td>
                  <td className="px-4 py-3 text-maritime-300">
                    <div>{tc.redeliveryPort as string || '-'}</div>
                    <div className="text-maritime-500 text-xs">{fmtDate(tc.redeliveryDate as string | null)}</div>
                  </td>
                  <td className="px-4 py-3 text-maritime-300 text-center text-xs">
                    {tc.minDuration || tc.maxDuration
                      ? `${tc.minDuration ?? '?'} - ${tc.maxDuration ?? '?'} months`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[(tc.status as string)] ?? 'bg-maritime-700 text-maritime-300'}`}>
                      {tc.status as string}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {charters.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No time charters found</p>
          )}
        </div>
      )}

      {/* Create Time Charter Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Time Charter">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Direction *">
              <select value={form.direction} onChange={set('direction')} className={selectClass} required>
                <option value="tc_in">TC-In</option>
                <option value="tc_out">TC-Out</option>
              </select>
            </FormField>
            <FormField label="Vessel *">
              <select value={form.vesselId} onChange={set('vesselId')} className={selectClass} required>
                <option value="">-- Select Vessel --</option>
                {vesselData?.vessels?.map((v: { id: string; name: string; imo: string }) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.imo})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Hire Rate (per day) *">
              <input type="number" step="0.01" value={form.hireRate} onChange={set('hireRate')} className={inputClass} required placeholder="15000" />
            </FormField>
            <FormField label="Currency *">
              <select value={form.currency} onChange={set('currency')} className={selectClass} required>
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Delivery Date">
              <input type="date" value={form.deliveryDate} onChange={set('deliveryDate')} className={inputClass} />
            </FormField>
            <FormField label="Delivery Port">
              <input value={form.deliveryPort} onChange={set('deliveryPort')} className={inputClass} placeholder="Singapore" />
            </FormField>
            <FormField label="Redelivery Date">
              <input type="date" value={form.redeliveryDate} onChange={set('redeliveryDate')} className={inputClass} />
            </FormField>
            <FormField label="Redelivery Port">
              <input value={form.redeliveryPort} onChange={set('redeliveryPort')} className={inputClass} placeholder="Rotterdam" />
            </FormField>
            <FormField label="Min Duration (months)">
              <input type="number" value={form.minDuration} onChange={set('minDuration')} className={inputClass} placeholder="6" />
            </FormField>
            <FormField label="Max Duration (months)">
              <input type="number" value={form.maxDuration} onChange={set('maxDuration')} className={inputClass} placeholder="12" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={set('notes')}
              className={`${inputClass} h-20 resize-none`} placeholder="Additional charter terms or remarks..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Time Charter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
