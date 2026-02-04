import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, btnPrimary, btnSecondary } from '../components/Modal';

const CARGO_COMPATIBILITY_QUERY = gql`
  query CargoCompatibility($cargo: String) {
    cargoCompatibility(cargo: $cargo) {
      id cargoA cargoB compatible notes source
    }
  }
`;

const SET_CARGO_COMPATIBILITY = gql`
  mutation SetCargoCompatibility(
    $cargoA: String!, $cargoB: String!, $compatible: Boolean!, $notes: String, $source: String
  ) {
    setCargoCompatibility(
      cargoA: $cargoA, cargoB: $cargoB, compatible: $compatible, notes: $notes, source: $source
    ) { id }
  }
`;

const emptyForm = {
  cargoA: '', cargoB: '', compatible: true, notes: '', source: '',
};

export function CargoCompatibility() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const queryVars: Record<string, string | undefined> = {};
  if (search.trim()) queryVars.cargo = search.trim();

  const { data, loading, error, refetch } = useQuery(CARGO_COMPATIBILITY_QUERY, { variables: queryVars });
  const [setCargoCompatibility, { loading: saving }] = useMutation(SET_CARGO_COMPATIBILITY);

  const records = data?.cargoCompatibility ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await setCargoCompatibility({
      variables: {
        cargoA: form.cargoA,
        cargoB: form.cargoB,
        compatible: form.compatible,
        notes: form.notes || null,
        source: form.source || null,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleCompatible = () => setForm((f) => ({ ...f, compatible: !f.compatible }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Cargo Compatibility Matrix</h1>
          <p className="text-maritime-400 text-sm mt-1">Check and manage cargo co-loading compatibility</p>
        </div>
        <div className="flex gap-3">
          <input type="text" placeholder="Search by cargo name..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64" />
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ Add Compatibility</button>
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading cargo compatibility data...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Cargo A</th>
                <th className="text-left px-4 py-3 font-medium">Cargo B</th>
                <th className="text-center px-4 py-3 font-medium">Compatible</th>
                <th className="text-left px-4 py-3 font-medium">Notes</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: Record<string, unknown>) => (
                <tr key={r.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white font-medium">{r.cargoA as string}</td>
                  <td className="px-4 py-3 text-white font-medium">{r.cargoB as string}</td>
                  <td className="px-4 py-3 text-center">
                    {(r.compatible as boolean) ? (
                      <span className="text-green-400 text-lg" title="Compatible">{'\u2705'}</span>
                    ) : (
                      <span className="text-red-400 text-lg" title="Not Compatible">{'\u274C'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-maritime-300 max-w-xs truncate">{(r.notes as string) || '-'}</td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">{(r.source as string) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No cargo compatibility records found</p>
          )}
        </div>
      )}

      {/* Create / Update Cargo Compatibility Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Set Cargo Compatibility">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Cargo A *">
              <input value={form.cargoA} onChange={set('cargoA')} className={inputClass} required placeholder="Crude Oil" />
            </FormField>
            <FormField label="Cargo B *">
              <input value={form.cargoB} onChange={set('cargoB')} className={inputClass} required placeholder="Jet Fuel" />
            </FormField>
          </div>
          <FormField label="Compatible">
            <button type="button" onClick={toggleCompatible}
              className={`flex items-center gap-3 px-4 py-2 rounded-md border transition-colors w-full ${
                form.compatible
                  ? 'bg-green-900/30 border-green-700 text-green-400'
                  : 'bg-red-900/30 border-red-700 text-red-400'
              }`}>
              <span className="text-lg">{form.compatible ? '\u2705' : '\u274C'}</span>
              <span className="text-sm font-medium">{form.compatible ? 'Compatible' : 'Not Compatible'}</span>
            </button>
          </FormField>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={set('notes')}
              className={`${inputClass} h-20 resize-none`} placeholder="Requires tank washing between loads, specific segregation needed, etc." />
          </FormField>
          <FormField label="Source">
            <input value={form.source} onChange={set('source')} className={inputClass} placeholder="IMSBC Code, P&I Club, IMO MEPC.2" />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? 'Saving...' : 'Save Compatibility'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
