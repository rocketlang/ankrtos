import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;

const BUNKER_QUERY = gql`
  query Bunkers($voyageId: String) {
    bunkerStems(voyageId: $voyageId) {
      id fuelType quantity delivered pricePerMt supplier status stemDate deliveryDate
      voyage { voyageNumber vessel { name } }
    }
    bunkerSummary { totalOrdered totalDelivered totalCost stemCount currency }
    voyages { id voyageNumber vessel { name } }
  }
`;

const CREATE_STEM = gql`
  mutation CreateStem($voyageId: String!, $fuelType: String!, $quantity: Float!, $pricePerMt: Float!, $supplier: String) {
    createBunkerStem(voyageId: $voyageId, fuelType: $fuelType, quantity: $quantity, pricePerMt: $pricePerMt, supplier: $supplier) { id }
  }
`;

const UPDATE_STEM = gql`
  mutation UpdateStem($id: String!, $status: String!, $delivered: Float) {
    updateBunkerStemStatus(id: $id, status: $status, delivered: $delivered) { id }
  }
`;

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const fuelLabels: Record<string, string> = {
  ifo380: 'IFO 380', ifo180: 'IFO 180', vlsfo: 'VLSFO', mgo: 'MGO', lsmgo: 'LSMGO',
};

const statusBadge: Record<string, string> = {
  ordered: 'bg-yellow-900/50 text-yellow-400',
  confirmed: 'bg-blue-900/50 text-blue-400',
  delivered: 'bg-green-900/50 text-green-400',
  invoiced: 'bg-purple-900/50 text-purple-400',
  settled: 'bg-maritime-700 text-maritime-300',
};

const statusFlow: Record<string, string[]> = {
  ordered: ['confirmed'],
  confirmed: ['delivered'],
  delivered: ['invoiced'],
  invoiced: ['settled'],
};

export function Bunkers() {
  const [filterVoyage, setFilterVoyage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data, loading, refetch } = useQuery(BUNKER_QUERY, {
    variables: { voyageId: filterVoyage || undefined },
  });
  const [createStem] = useMutation(CREATE_STEM);
  const [updateStem] = useMutation(UPDATE_STEM);
  const [form, setForm] = useState({
    voyageId: '', fuelType: 'vlsfo', quantity: '', pricePerMt: '', supplier: '',
  });

  const handleCreate = async () => {
    if (!form.voyageId || !form.quantity || !form.pricePerMt) return;
    await createStem({ variables: { ...form, quantity: parseFloat(form.quantity), pricePerMt: parseFloat(form.pricePerMt) } });
    setShowCreate(false);
    setForm({ voyageId: '', fuelType: 'vlsfo', quantity: '', pricePerMt: '', supplier: '' });
    refetch();
  };

  const handleStatus = async (id: string, status: string, qty?: number) => {
    await updateStem({ variables: { id, status, delivered: status === 'delivered' ? qty : undefined } });
    refetch();
  };

  const stems = data?.bunkerStems ?? [];
  const summary = data?.bunkerSummary;
  const voyages = data?.voyages ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Bunker Management</h1>
          <p className="text-maritime-400 text-sm mt-1">Fuel procurement, stems, and ROB tracking</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/csv/bunkers" className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm px-3 py-2 rounded-lg">CSV</a>
          <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + New Stem Order
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Stem Orders', value: summary.stemCount, color: 'text-white', border: 'border-maritime-500' },
            { label: 'Ordered (MT)', value: summary.totalOrdered.toLocaleString(), color: 'text-yellow-400', border: 'border-yellow-500' },
            { label: 'Delivered (MT)', value: summary.totalDelivered.toLocaleString(), color: 'text-green-400', border: 'border-green-500' },
            { label: 'Total Cost', value: fmt(summary.totalCost), color: 'text-orange-400', border: 'border-orange-500' },
          ].map((s) => (
            <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
              <p className="text-maritime-500 text-xs">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <select value={filterVoyage} onChange={(e) => setFilterVoyage(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Voyages</option>
          {voyages.map((v: Record<string, unknown>) => (
            <option key={v.id as string} value={v.id as string}>
              {v.voyageNumber as string} — {(v.vessel as Record<string, unknown>)?.name as string}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-maritime-400 text-xs border-b border-maritime-700">
              <th className="text-left px-4 py-3">Fuel</th>
              <th className="text-left px-4 py-3">Voyage</th>
              <th className="text-right px-4 py-3">Ordered (MT)</th>
              <th className="text-right px-4 py-3">Delivered</th>
              <th className="text-right px-4 py-3">Price/MT</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Supplier</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={9} className="text-center py-8 text-maritime-500">Loading...</td></tr>}
            {!loading && stems.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-maritime-500">No bunker stems</td></tr>}
            {stems.map((s: Record<string, unknown>) => {
              const voyage = s.voyage as Record<string, unknown>;
              const vessel = voyage?.vessel as Record<string, unknown>;
              const delivered = (s.delivered as number) ?? (s.quantity as number);
              const total = delivered * (s.pricePerMt as number);
              const next = statusFlow[s.status as string] ?? [];
              return (
                <tr key={s.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                  <td className="px-4 py-3 text-white text-xs font-medium">{fuelLabels[s.fuelType as string] ?? s.fuelType}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">{voyage?.voyageNumber as string} — {vessel?.name as string}</td>
                  <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">{(s.quantity as number).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-mono text-xs">{s.delivered ? (s.delivered as number).toLocaleString() : '-'}</td>
                  <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">${(s.pricePerMt as number).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-orange-400 font-mono text-xs">{fmt(total)}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">{(s.supplier as string) ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusBadge[s.status as string] ?? ''}`}>
                      {s.status as string}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {next.map((ns) => (
                        <button key={ns} onClick={() => handleStatus(s.id as string, ns, s.quantity as number)}
                          className="text-blue-400 hover:text-blue-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded capitalize">
                          {ns}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-white font-bold text-lg mb-4">New Bunker Stem Order</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">Voyage</label>
                  <select value={form.voyageId} onChange={(e) => setForm({ ...form, voyageId: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1">
                    <option value="">Select</option>
                    {voyages.map((v: Record<string, unknown>) => (
                      <option key={v.id as string} value={v.id as string}>{v.voyageNumber as string}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Fuel Type</label>
                  <select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1">
                    {Object.entries(fuelLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">Quantity (MT)</label>
                  <input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} type="number"
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" />
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Price/MT ($)</label>
                  <input value={form.pricePerMt} onChange={(e) => setForm({ ...form, pricePerMt: e.target.value })} type="number"
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" />
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Supplier</label>
                  <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="text-maritime-400 text-sm hover:text-white px-4 py-2">Cancel</button>
              <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg">Create Stem</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
