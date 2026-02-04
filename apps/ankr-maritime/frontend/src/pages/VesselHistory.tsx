import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const VESSEL_HISTORY_QUERY = gql`
  query VesselHistory($vesselId: String!, $changeType: String) {
    vesselHistory(vesselId: $vesselId, changeType: $changeType) {
      id vesselId changeType changeDate fromValue toValue remarks source
      vessel { id name }
    }
  }
`;

const VESSELS_QUERY = gql`
  query Vessels {
    vessels { id name imo }
  }
`;

const ADD_VESSEL_HISTORY_ENTRY = gql`
  mutation AddVesselHistoryEntry(
    $vesselId: String!, $changeType: String!, $changeDate: String!,
    $fromValue: String, $toValue: String, $remarks: String, $source: String
  ) {
    addVesselHistoryEntry(
      vesselId: $vesselId, changeType: $changeType, changeDate: $changeDate,
      fromValue: $fromValue, toValue: $toValue, remarks: $remarks, source: $source
    ) { id }
  }
`;

const changeTypeColors: Record<string, string> = {
  name_change: 'bg-purple-900/50 text-purple-400',
  flag_change: 'bg-blue-900/50 text-blue-400',
  class_change: 'bg-indigo-900/50 text-indigo-400',
  ownership_change: 'bg-green-900/50 text-green-400',
  management_change: 'bg-yellow-900/50 text-yellow-400',
};

const changeTypes = ['name_change', 'flag_change', 'class_change', 'ownership_change', 'management_change'];

const emptyForm = {
  vesselId: '', changeType: 'name_change', changeDate: '', fromValue: '', toValue: '', remarks: '', source: '',
};

export function VesselHistory() {
  const [vesselFilter, setVesselFilter] = useState('');
  const [changeTypeFilter, setChangeTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: vesselData } = useQuery(VESSELS_QUERY);

  const queryVars: Record<string, string | undefined> = { vesselId: vesselFilter || undefined };
  if (changeTypeFilter !== 'all') queryVars.changeType = changeTypeFilter;

  const { data, loading, error, refetch } = useQuery(VESSEL_HISTORY_QUERY, {
    variables: queryVars,
    skip: !vesselFilter,
  });
  const [addVesselHistoryEntry, { loading: creating }] = useMutation(ADD_VESSEL_HISTORY_ENTRY);

  const entries = data?.vesselHistory ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await addVesselHistoryEntry({
      variables: {
        vesselId: form.vesselId,
        changeType: form.changeType,
        changeDate: new Date(form.changeDate).toISOString(),
        fromValue: form.fromValue || null,
        toValue: form.toValue || null,
        remarks: form.remarks || null,
        source: form.source || null,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : '-';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Vessel History</h1>
          <p className="text-maritime-400 text-sm mt-1">Track ownership, flag, name and class changes</p>
        </div>
        <div className="flex gap-3">
          <select value={vesselFilter} onChange={(e) => setVesselFilter(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
            <option value="">-- Select Vessel --</option>
            {vesselData?.vessels?.map((v: { id: string; name: string; imo: string }) => (
              <option key={v.id} value={v.id}>{v.name} ({v.imo})</option>
            ))}
          </select>
          <select value={changeTypeFilter} onChange={(e) => setChangeTypeFilter(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
            <option value="all">All Change Types</option>
            {changeTypes.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ Add History Entry</button>
        </div>
      </div>

      {!vesselFilter && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <span className="text-4xl">{'\u{1F6A2}'}</span>
          <h3 className="text-white font-medium mt-4">Select a Vessel</h3>
          <p className="text-maritime-400 text-sm mt-2">Choose a vessel from the dropdown to view its change history.</p>
        </div>
      )}

      {vesselFilter && loading && <p className="text-maritime-400">Loading vessel history...</p>}
      {vesselFilter && error && <p className="text-red-400">Error: {error.message}</p>}

      {vesselFilter && !loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Change Type</th>
                <th className="text-left px-4 py-3 font-medium">From</th>
                <th className="text-left px-4 py-3 font-medium">To</th>
                <th className="text-left px-4 py-3 font-medium">Remarks</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: Record<string, unknown>) => (
                <tr key={entry.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white text-xs font-mono">{fmtDate(entry.changeDate as string | null)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${changeTypeColors[(entry.changeType as string)] ?? 'bg-maritime-700 text-maritime-300'}`}>
                      {(entry.changeType as string).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-red-400/80">{(entry.fromValue as string) || '-'}</td>
                  <td className="px-4 py-3 text-green-400/80">{(entry.toValue as string) || '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 max-w-xs truncate">{(entry.remarks as string) || '-'}</td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">{(entry.source as string) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No history entries found for this vessel</p>
          )}
        </div>
      )}

      {/* Add History Entry Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Vessel History Entry">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Vessel *">
              <select value={form.vesselId} onChange={set('vesselId')} className={selectClass} required>
                <option value="">-- Select Vessel --</option>
                {vesselData?.vessels?.map((v: { id: string; name: string; imo: string }) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.imo})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Change Type *">
              <select value={form.changeType} onChange={set('changeType')} className={selectClass} required>
                {changeTypes.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Change Date *">
            <input type="date" value={form.changeDate} onChange={set('changeDate')} className={inputClass} required />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="From Value">
              <input value={form.fromValue} onChange={set('fromValue')} className={inputClass} placeholder="Previous value" />
            </FormField>
            <FormField label="To Value">
              <input value={form.toValue} onChange={set('toValue')} className={inputClass} placeholder="New value" />
            </FormField>
          </div>
          <FormField label="Remarks">
            <textarea value={form.remarks} onChange={set('remarks')}
              className={`${inputClass} h-20 resize-none`} placeholder="Reason for change, regulatory reference, etc." />
          </FormField>
          <FormField label="Source">
            <input value={form.source} onChange={set('source')} className={inputClass} placeholder="Lloyd's Register, Equasis, IMO GISIS" />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
