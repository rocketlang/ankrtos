import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const PORT_TARIFFS = gql`
  query PortTariffs($portId: String!, $vesselType: String, $chargeType: String) {
    portTariffs(portId: $portId, vesselType: $vesselType, chargeType: $chargeType) {
      id portId vesselType sizeRangeMin sizeRangeMax chargeType amount currency unit effectiveFrom effectiveTo notes
    }
  }
`;

const ESTIMATE_COSTS = gql`
  query EstimatePortCosts($portId: String!, $vesselGrt: Float!, $vesselNrt: Float!, $vesselDwt: Float!, $vesselType: String, $stayDays: Float) {
    estimatePortCosts(portId: $portId, vesselGrt: $vesselGrt, vesselNrt: $vesselNrt, vesselDwt: $vesselDwt, vesselType: $vesselType, stayDays: $stayDays) {
      lineItems { chargeType description amount currency }
      totalAmount currency
    }
  }
`;

const CREATE_TARIFF = gql`
  mutation CreateTariff($portId: String!, $chargeType: String!, $amount: Float!, $unit: String, $currency: String, $vesselType: String, $notes: String) {
    createPortTariff(portId: $portId, chargeType: $chargeType, amount: $amount, unit: $unit, currency: $currency, vesselType: $vesselType, notes: $notes) { id }
  }
`;

const EXPIRE_TARIFF = gql`
  mutation ExpireTariff($id: String!) { expirePortTariff(id: $id) { id } }
`;

const chargeTypes = [
  { value: 'port_dues', label: 'Port Dues' },
  { value: 'pilotage', label: 'Pilotage' },
  { value: 'towage', label: 'Towage' },
  { value: 'berth_hire', label: 'Berth Hire' },
  { value: 'anchorage', label: 'Anchorage' },
  { value: 'mooring', label: 'Mooring' },
  { value: 'light_dues', label: 'Light Dues' },
  { value: 'canal_transit', label: 'Canal Transit' },
  { value: 'garbage_disposal', label: 'Garbage Disposal' },
  { value: 'fresh_water', label: 'Fresh Water' },
];

const vesselTypes = [
  { value: '', label: 'All Types' },
  { value: 'bulk_carrier', label: 'Bulk Carrier' },
  { value: 'tanker', label: 'Tanker' },
  { value: 'container', label: 'Container' },
  { value: 'general_cargo', label: 'General Cargo' },
];

const currencies = ['USD', 'EUR', 'GBP', 'INR', 'SGD', 'AED'];
const units = ['per_grt', 'per_nrt', 'per_dwt', 'per_day', 'per_hour', 'lump_sum', 'per_metre', 'per_move'];

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(n);
}

const emptyForm = {
  chargeType: 'port_dues', amount: '', unit: 'per_grt', currency: 'USD', vesselType: '', notes: '',
};

const emptyEstimate = {
  vesselGrt: '', vesselNrt: '', vesselDwt: '', vesselType: '', stayDays: '1',
};

export function PortTariffs() {
  const [portId, setPortId] = useState('');
  const [tab, setTab] = useState<'tariffs' | 'estimator'>('tariffs');
  const [filterVesselType, setFilterVesselType] = useState('');
  const [filterChargeType, setFilterChargeType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [estForm, setEstForm] = useState(emptyEstimate);

  const { data, loading, error, refetch } = useQuery(PORT_TARIFFS, {
    variables: {
      portId,
      vesselType: filterVesselType || undefined,
      chargeType: filterChargeType || undefined,
    },
    skip: !portId,
  });

  const { data: estData, loading: estLoading, refetch: runEstimate } = useQuery(ESTIMATE_COSTS, {
    variables: {
      portId,
      vesselGrt: parseFloat(estForm.vesselGrt) || 0,
      vesselNrt: parseFloat(estForm.vesselNrt) || 0,
      vesselDwt: parseFloat(estForm.vesselDwt) || 0,
      vesselType: estForm.vesselType || undefined,
      stayDays: parseFloat(estForm.stayDays) || 1,
    },
    skip: true,
  });

  const [createTariff, { loading: creating }] = useMutation(CREATE_TARIFF);
  const [expireTariff] = useMutation(EXPIRE_TARIFF);

  const tariffs = data?.portTariffs ?? [];
  const estimate = estData?.estimatePortCosts;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portId || !form.amount) return;
    await createTariff({
      variables: {
        portId,
        chargeType: form.chargeType,
        amount: parseFloat(form.amount),
        unit: form.unit,
        currency: form.currency,
        vesselType: form.vesselType || undefined,
        notes: form.notes || undefined,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const handleExpire = async (id: string) => {
    if (!confirm('Expire this tariff?')) return;
    await expireTariff({ variables: { id } });
    refetch();
  };

  const handleEstimate = () => {
    if (!portId || !estForm.vesselGrt || !estForm.vesselNrt || !estForm.vesselDwt) return;
    runEstimate({
      portId,
      vesselGrt: parseFloat(estForm.vesselGrt),
      vesselNrt: parseFloat(estForm.vesselNrt),
      vesselDwt: parseFloat(estForm.vesselDwt),
      vesselType: estForm.vesselType || undefined,
      stayDays: parseFloat(estForm.stayDays) || 1,
    });
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const setEst = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEstForm((f) => ({ ...f, [field]: e.target.value }));

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t ? 'bg-maritime-800 text-white border-t border-x border-maritime-700' : 'text-maritime-400 hover:text-maritime-300'}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Port Tariffs</h1>
          <p className="text-maritime-400 text-sm mt-1">Manage port charges and estimate disbursement costs</p>
        </div>
      </div>

      {/* Port ID Input */}
      <div className="flex items-end gap-4">
        <div>
          <label className="block text-xs text-maritime-400 mb-1 font-medium">Port ID *</label>
          <input
            value={portId}
            onChange={(e) => setPortId(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64"
            placeholder="e.g. INMUN, SGSIN, AEJEA"
          />
        </div>
        {!portId && <p className="text-maritime-500 text-sm pb-2">Enter a port ID to view tariffs</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-maritime-700">
        <button onClick={() => setTab('tariffs')} className={tabClass('tariffs')}>Tariffs</button>
        <button onClick={() => setTab('estimator')} className={tabClass('estimator')}>Cost Estimator</button>
      </div>

      {/* Tariffs Tab */}
      {tab === 'tariffs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <select value={filterVesselType} onChange={(e) => setFilterVesselType(e.target.value)}
                className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
                {vesselTypes.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
              <select value={filterChargeType} onChange={(e) => setFilterChargeType(e.target.value)}
                className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
                <option value="">All Charges</option>
                {chargeTypes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <button onClick={() => setShowCreate(true)} disabled={!portId} className={btnPrimary}>+ Add Tariff</button>
          </div>

          {loading && <p className="text-maritime-400">Loading tariffs...</p>}
          {error && <p className="text-red-400">Error: {error.message}</p>}

          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                  <th className="text-left px-4 py-3">Charge Type</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Currency</th>
                  <th className="text-left px-4 py-3">Unit</th>
                  <th className="text-left px-4 py-3">Vessel Type</th>
                  <th className="text-left px-4 py-3">Effective From</th>
                  <th className="text-left px-4 py-3">Effective To</th>
                  <th className="text-left px-4 py-3">Notes</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && tariffs.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-8 text-maritime-500">
                    {portId ? 'No tariffs found for this port' : 'Enter a port ID above'}
                  </td></tr>
                )}
                {tariffs.map((t: Record<string, unknown>) => (
                  <tr key={t.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                    <td className="px-4 py-3 text-white font-medium capitalize">{(t.chargeType as string).replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-mono text-xs">{fmt(t.amount as number, t.currency as string)}</td>
                    <td className="px-4 py-3 text-maritime-300 text-xs">{t.currency as string}</td>
                    <td className="px-4 py-3 text-maritime-300 text-xs capitalize">{(t.unit as string || '').replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-maritime-300 text-xs capitalize">{(t.vesselType as string || 'All').replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">
                      {t.effectiveFrom ? new Date(t.effectiveFrom as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">
                      {t.effectiveTo ? new Date(t.effectiveTo as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Current'}
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs max-w-[200px] truncate">{(t.notes as string) || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleExpire(t.id as string)}
                        className="text-red-400/60 hover:text-red-400 text-xs">Expire</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cost Estimator Tab */}
      {tab === 'estimator' && (
        <div className="space-y-4">
          <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
            <h3 className="text-white font-medium mb-4">Vessel Parameters</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs text-maritime-400 mb-1">GRT *</label>
                <input type="number" value={estForm.vesselGrt} onChange={setEst('vesselGrt')}
                  className={inputClass} placeholder="40000" />
              </div>
              <div>
                <label className="block text-xs text-maritime-400 mb-1">NRT *</label>
                <input type="number" value={estForm.vesselNrt} onChange={setEst('vesselNrt')}
                  className={inputClass} placeholder="25000" />
              </div>
              <div>
                <label className="block text-xs text-maritime-400 mb-1">DWT *</label>
                <input type="number" value={estForm.vesselDwt} onChange={setEst('vesselDwt')}
                  className={inputClass} placeholder="75000" />
              </div>
              <div>
                <label className="block text-xs text-maritime-400 mb-1">Vessel Type</label>
                <select value={estForm.vesselType} onChange={setEst('vesselType')} className={selectClass}>
                  {vesselTypes.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-maritime-400 mb-1">Stay (days)</label>
                <input type="number" value={estForm.stayDays} onChange={setEst('stayDays')}
                  className={inputClass} placeholder="1" />
              </div>
              <div className="flex items-end">
                <button onClick={handleEstimate} disabled={!portId || !estForm.vesselGrt || !estForm.vesselNrt || !estForm.vesselDwt}
                  className={btnPrimary + ' w-full'}>
                  {estLoading ? 'Estimating...' : 'Estimate'}
                </button>
              </div>
            </div>
          </div>

          {estimate && (
            <div className="space-y-4">
              <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
                <h3 className="text-white font-medium mb-3">Estimated Port Costs</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                      <th className="text-left px-4 py-2">Charge Type</th>
                      <th className="text-left px-4 py-2">Description</th>
                      <th className="text-right px-4 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(estimate.lineItems as Array<Record<string, unknown>>).map((item, i) => (
                      <tr key={i} className="border-b border-maritime-700/30">
                        <td className="px-4 py-2 text-white capitalize">{(item.chargeType as string).replace(/_/g, ' ')}</td>
                        <td className="px-4 py-2 text-maritime-300 text-xs">{item.description as string}</td>
                        <td className="px-4 py-2 text-right text-emerald-400 font-mono">{fmt(item.amount as number, item.currency as string)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-maritime-600">
                      <td colSpan={2} className="px-4 py-3 text-white font-bold">Total Estimated Cost</td>
                      <td className="px-4 py-3 text-right text-white font-bold font-mono text-lg">
                        {fmt(estimate.totalAmount as number, estimate.currency as string)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!estimate && !estLoading && (
            <p className="text-maritime-500 text-sm text-center py-8">
              Enter vessel parameters and click Estimate to calculate port costs
            </p>
          )}
        </div>
      )}

      {/* Create Tariff Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Port Tariff">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Charge Type *">
              <select value={form.chargeType} onChange={set('chargeType')} className={selectClass} required>
                {chargeTypes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FormField>
            <FormField label="Amount *">
              <input type="number" step="any" value={form.amount} onChange={set('amount')} className={inputClass} required placeholder="1500.00" />
            </FormField>
            <FormField label="Currency">
              <select value={form.currency} onChange={set('currency')} className={selectClass}>
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Unit">
              <select value={form.unit} onChange={set('unit')} className={selectClass}>
                {units.map((u) => <option key={u} value={u}>{u.replace(/_/g, ' ')}</option>)}
              </select>
            </FormField>
            <FormField label="Vessel Type">
              <select value={form.vesselType} onChange={set('vesselType')} className={selectClass}>
                {vesselTypes.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={set('notes')} rows={2} className={inputClass} placeholder="Additional notes..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Add Tariff'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
