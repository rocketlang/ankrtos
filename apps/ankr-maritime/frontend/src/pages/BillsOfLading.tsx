import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { NextStepBanner } from '../components/NextStepBanner';

const BOLS_QUERY = gql`
  query BillsOfLading($type: String, $status: String) {
    billsOfLading(type: $type, status: $status) {
      id bolNumber type status freightTerms numberOfOriginals
      portOfLoading portOfDischarge grossWeight measurement
      shipperId consigneeId notifyPartyId description
      issuedAt issuedBy createdAt
      voyage { id voyageNumber }
    }
  }
`;

const CREATE_BOL = gql`
  mutation CreateBOL(
    $bolNumber: String!, $type: String!, $voyageId: String!,
    $portOfLoading: String, $portOfDischarge: String,
    $shipperId: String, $consigneeId: String, $notifyPartyId: String,
    $freightTerms: String, $numberOfOriginals: Int,
    $description: String, $grossWeight: Float, $measurement: Float
  ) {
    createBillOfLading(
      bolNumber: $bolNumber, type: $type, voyageId: $voyageId,
      portOfLoading: $portOfLoading, portOfDischarge: $portOfDischarge,
      shipperId: $shipperId, consigneeId: $consigneeId, notifyPartyId: $notifyPartyId,
      freightTerms: $freightTerms, numberOfOriginals: $numberOfOriginals,
      description: $description, grossWeight: $grossWeight, measurement: $measurement
    ) { id bolNumber }
  }
`;

const UPDATE_STATUS = gql`
  mutation UpdateBolStatus($id: String!, $status: String!, $issuedBy: String) {
    updateBolStatus(id: $id, status: $status, issuedBy: $issuedBy) { id status issuedAt }
  }
`;

const VOYAGES_LIST = gql`
  query Voyages { voyages { id voyageNumber } }
`;

const bolTypes = ['master', 'house', 'electronic'] as const;
const bolStatuses = ['draft', 'issued', 'shipped', 'surrendered', 'accomplished', 'switch'] as const;

const typeLabels: Record<string, string> = { master: 'MBL', house: 'HBL', electronic: 'eBL' };
const statusColors: Record<string, string> = {
  draft: 'bg-gray-700 text-gray-300',
  issued: 'bg-blue-900/50 text-blue-400',
  shipped: 'bg-indigo-900/50 text-indigo-400',
  surrendered: 'bg-amber-900/50 text-amber-400',
  accomplished: 'bg-green-900/50 text-green-400',
  switch: 'bg-purple-900/50 text-purple-400',
};

export function BillsOfLading() {
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    bolNumber: '', type: 'master', voyageId: '', portOfLoading: '', portOfDischarge: '',
    freightTerms: 'prepaid', numberOfOriginals: 3, description: '', grossWeight: '', measurement: '',
  });

  const { data, loading, refetch } = useQuery(BOLS_QUERY, {
    variables: { ...(filterType ? { type: filterType } : {}), ...(filterStatus ? { status: filterStatus } : {}) },
  });
  const { data: voyagesData } = useQuery(VOYAGES_LIST);
  const [createBol] = useMutation(CREATE_BOL);
  const [updateStatus] = useMutation(UPDATE_STATUS);

  const handleCreate = async () => {
    if (!form.bolNumber || !form.voyageId) return;
    await createBol({
      variables: {
        ...form,
        numberOfOriginals: Number(form.numberOfOriginals),
        grossWeight: form.grossWeight ? parseFloat(form.grossWeight) : undefined,
        measurement: form.measurement ? parseFloat(form.measurement) : undefined,
      },
    });
    setShowCreate(false);
    setForm({ bolNumber: '', type: 'master', voyageId: '', portOfLoading: '', portOfDischarge: '', freightTerms: 'prepaid', numberOfOriginals: 3, description: '', grossWeight: '', measurement: '' });
    refetch();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateStatus({ variables: { id, status: newStatus } });
    refetch();
  };

  const nextStatus: Record<string, string> = {
    draft: 'issued', issued: 'shipped', shipped: 'surrendered', surrendered: 'accomplished',
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Bills of Lading</h1>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded">
          + New B/L
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Types</option>
          {bolTypes.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Statuses</option>
          {bolStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-maritime-500 text-sm">Loading...</p>
      ) : (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400 text-xs">
                <th className="text-left p-3">B/L Number</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Voyage</th>
                <th className="text-left p-3">POL</th>
                <th className="text-left p-3">POD</th>
                <th className="text-left p-3">Weight</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Issued</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.billsOfLading?.map((bol: Record<string, unknown>) => {
                const voyage = bol.voyage as { voyageNumber: string } | null;
                const ns = nextStatus[bol.status as string];
                return (
                  <tr key={bol.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="p-3 text-white font-mono">{bol.bolNumber as string}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        bol.type === 'electronic' ? 'bg-purple-900/40 text-purple-400' :
                        bol.type === 'house' ? 'bg-cyan-900/40 text-cyan-400' :
                        'bg-blue-900/40 text-blue-400'
                      }`}>{typeLabels[bol.type as string] ?? bol.type}</span>
                    </td>
                    <td className="p-3 text-maritime-300">{voyage?.voyageNumber ?? '-'}</td>
                    <td className="p-3 text-maritime-300">{(bol.portOfLoading as string) || '-'}</td>
                    <td className="p-3 text-maritime-300">{(bol.portOfDischarge as string) || '-'}</td>
                    <td className="p-3 text-maritime-300">{bol.grossWeight ? `${bol.grossWeight} MT` : '-'}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColors[bol.status as string] ?? 'bg-gray-700 text-gray-300'}`}>
                        {bol.status as string}
                      </span>
                    </td>
                    <td className="p-3 text-maritime-400 text-xs">
                      {bol.issuedAt ? new Date(bol.issuedAt as string).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3">
                      {ns && (
                        <button
                          onClick={() => handleStatusChange(bol.id as string, ns)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          {ns === 'issued' ? 'Issue' : ns === 'shipped' ? 'Ship' : ns === 'surrendered' ? 'Surrender' : 'Accomplish'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!data?.billsOfLading || data.billsOfLading.length === 0) && (
                <tr><td colSpan={9} className="p-6 text-center text-maritime-500 text-sm">No bills of lading found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <NextStepBanner />

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-bold mb-4">New Bill of Lading</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">B/L Number *</label>
                  <input value={form.bolNumber} onChange={(e) => setForm({ ...form, bolNumber: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-2 mt-1"
                    placeholder="MBL-2026-001" />
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-2 mt-1">
                    {bolTypes.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-maritime-400 text-xs">Voyage *</label>
                <select value={form.voyageId} onChange={(e) => setForm({ ...form, voyageId: e.target.value })}
                  className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-2 mt-1">
                  <option value="">Select voyage...</option>
                  {voyagesData?.voyages?.map((v: { id: string; voyageNumber: string }) => (
                    <option key={v.id} value={v.id}>{v.voyageNumber}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">Port of Loading</label>
                  <input value={form.portOfLoading} onChange={(e) => setForm({ ...form, portOfLoading: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-2 mt-1"
                    placeholder="INMUN" />
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Port of Discharge</label>
                  <input value={form.portOfDischarge} onChange={(e) => setForm({ ...form, portOfDischarge: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-2 mt-1"
                    placeholder="SGSIN" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">Freight Terms</label>
                  <select value={form.freightTerms} onChange={(e) => setForm({ ...form, freightTerms: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-2 mt-1">
                    <option value="prepaid">Prepaid</option>
                    <option value="collect">Collect</option>
                  </select>
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Original Copies</label>
                  <input type="number" value={form.numberOfOriginals} onChange={(e) => setForm({ ...form, numberOfOriginals: parseInt(e.target.value) || 3 })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-2 mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">Gross Weight (MT)</label>
                  <input value={form.grossWeight} onChange={(e) => setForm({ ...form, grossWeight: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-2 mt-1"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Measurement (CBM)</label>
                  <input value={form.measurement} onChange={(e) => setForm({ ...form, measurement: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-2 mt-1"
                    placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="text-maritime-400 text-xs">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-2 mt-1"
                  rows={2} placeholder="Cargo description..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowCreate(false)} className="text-maritime-400 text-sm hover:text-white">Cancel</button>
              <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded">
                Create B/L
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
