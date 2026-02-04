import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const VESSELS_QUERY = gql`
  query Vessels {
    vessels {
      id name imo type flag dwt grt loa beam draft yearBuilt status
    }
  }
`;

const CREATE_VESSEL = gql`
  mutation CreateVessel(
    $imo: String!, $name: String!, $type: String!, $flag: String!,
    $dwt: Float, $grt: Float, $loa: Float, $beam: Float, $draft: Float, $yearBuilt: Int
  ) {
    createVessel(
      imo: $imo, name: $name, type: $type, flag: $flag,
      dwt: $dwt, grt: $grt, loa: $loa, beam: $beam, draft: $draft, yearBuilt: $yearBuilt
    ) { id }
  }
`;

const DELETE_VESSEL = gql`
  mutation DeleteVessel($id: String!) { deleteVessel(id: $id) { id } }
`;

const vesselTypeLabels: Record<string, string> = {
  bulk_carrier: 'Bulk Carrier',
  tanker: 'Tanker',
  container: 'Container',
  general_cargo: 'General Cargo',
};

const vesselTypes = ['bulk_carrier', 'tanker', 'container', 'general_cargo'];

const emptyForm = {
  imo: '', name: '', type: 'bulk_carrier', flag: '', dwt: '', grt: '', loa: '', beam: '', draft: '', yearBuilt: '',
};

export function Vessels() {
  const { data, loading, error, refetch } = useQuery(VESSELS_QUERY);
  const [createVessel, { loading: creating }] = useMutation(CREATE_VESSEL);
  const [deleteVessel] = useMutation(DELETE_VESSEL);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const vessels = data?.vessels?.filter(
    (v: { name: string; imo: string; type: string }) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.imo.includes(search) ||
      v.type.includes(search.toLowerCase()),
  ) ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createVessel({
      variables: {
        imo: form.imo, name: form.name, type: form.type, flag: form.flag,
        dwt: form.dwt ? Number(form.dwt) : null, grt: form.grt ? Number(form.grt) : null,
        loa: form.loa ? Number(form.loa) : null, beam: form.beam ? Number(form.beam) : null,
        draft: form.draft ? Number(form.draft) : null, yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : null,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vessel?')) return;
    await deleteVessel({ variables: { id } });
    refetch();
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Vessel Registry</h1>
          <p className="text-maritime-400 text-sm mt-1">Fleet management and vessel details</p>
        </div>
        <div className="flex gap-3">
          <input type="text" placeholder="Search vessels..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64" />
          <a href="/api/csv/vessels" className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm px-3 py-2 rounded-md">CSV</a>
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ Add Vessel</button>
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading fleet...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Vessel Name</th>
                <th className="text-left px-4 py-3 font-medium">IMO</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Flag</th>
                <th className="text-right px-4 py-3 font-medium">DWT</th>
                <th className="text-right px-4 py-3 font-medium">LOA (m)</th>
                <th className="text-center px-4 py-3 font-medium">Year</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vessels.map((v: Record<string, unknown>) => (
                <tr key={v.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white font-medium">{v.name as string}</td>
                  <td className="px-4 py-3 text-maritime-300 font-mono text-xs">{v.imo as string}</td>
                  <td className="px-4 py-3 text-maritime-300">{vesselTypeLabels[v.type as string] ?? v.type}</td>
                  <td className="px-4 py-3 text-maritime-300">{v.flag as string}</td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{(v.dwt as number)?.toLocaleString() ?? '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{(v.loa as number) ?? '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-center">{(v.yearBuilt as number) ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${v.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {v.status as string}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(v.id as string)}
                      className="text-red-400/60 hover:text-red-400 text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vessels.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No vessels found</p>
          )}
        </div>
      )}

      {/* Create Vessel Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Vessel">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="IMO Number *">
              <input value={form.imo} onChange={set('imo')} className={inputClass} required placeholder="9123456" />
            </FormField>
            <FormField label="Vessel Name *">
              <input value={form.name} onChange={set('name')} className={inputClass} required placeholder="MV Ankr Star" />
            </FormField>
            <FormField label="Vessel Type *">
              <select value={form.type} onChange={set('type')} className={selectClass} required>
                {vesselTypes.map((t) => <option key={t} value={t}>{vesselTypeLabels[t]}</option>)}
              </select>
            </FormField>
            <FormField label="Flag *">
              <input value={form.flag} onChange={set('flag')} className={inputClass} required placeholder="IN" />
            </FormField>
            <FormField label="DWT">
              <input type="number" value={form.dwt} onChange={set('dwt')} className={inputClass} placeholder="75000" />
            </FormField>
            <FormField label="GRT">
              <input type="number" value={form.grt} onChange={set('grt')} className={inputClass} placeholder="40000" />
            </FormField>
            <FormField label="LOA (m)">
              <input type="number" value={form.loa} onChange={set('loa')} className={inputClass} placeholder="229" />
            </FormField>
            <FormField label="Beam (m)">
              <input type="number" value={form.beam} onChange={set('beam')} className={inputClass} placeholder="32" />
            </FormField>
            <FormField label="Draft (m)">
              <input type="number" value={form.draft} onChange={set('draft')} className={inputClass} placeholder="14.5" />
            </FormField>
            <FormField label="Year Built">
              <input type="number" value={form.yearBuilt} onChange={set('yearBuilt')} className={inputClass} placeholder="2020" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Add Vessel'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
