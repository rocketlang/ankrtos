import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;

const EBL_QUERY = gql`
  query EblChain {
    billsOfLading {
      id bolNumber type status voyageId
      voyage { voyageNumber vessel { name } }
    }
    eblSummary { totalEbls pendingTransfers confirmedTransfers surrendered }
  }
`;

const TITLE_CHAIN = gql`
  query TitleChain($bolId: String!) {
    eblTitleChain(bolId: $bolId) {
      id fromParty toParty transferType dcsaStatus platformRef hash notes createdAt
    }
  }
`;

const INITIATE = gql`
  mutation InitiateTransfer($bolId: String!, $toParty: String!, $transferType: String!, $notes: String) {
    initiateEblTransfer(bolId: $bolId, toParty: $toParty, transferType: $transferType, notes: $notes) { id }
  }
`;

const RESPOND = gql`
  mutation RespondTransfer($transferId: String!, $action: String!) {
    respondEblTransfer(transferId: $transferId, action: $action) { id }
  }
`;

const typeColors: Record<string, string> = {
  issuance: 'bg-green-900/50 text-green-400',
  endorsement: 'bg-blue-900/50 text-blue-400',
  amendment: 'bg-yellow-900/50 text-yellow-400',
  surrender: 'bg-red-900/50 text-red-400',
  switch_to_paper: 'bg-purple-900/50 text-purple-400',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-400',
  requested: 'bg-blue-900/50 text-blue-400',
  confirmed: 'bg-green-900/50 text-green-400',
  rejected: 'bg-red-900/50 text-red-400',
};

export function EblChain() {
  const [selectedBol, setSelectedBol] = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const { data, loading, refetch } = useQuery(EBL_QUERY);
  const { data: chainData, refetch: refetchChain } = useQuery(TITLE_CHAIN, {
    variables: { bolId: selectedBol ?? '' },
    skip: !selectedBol,
  });
  const [initiate] = useMutation(INITIATE);
  const [respond] = useMutation(RESPOND);

  const [form, setForm] = useState({ toParty: '', transferType: 'endorsement', notes: '' });

  const handleInitiate = async () => {
    if (!selectedBol || !form.toParty) return;
    await initiate({ variables: { bolId: selectedBol, ...form } });
    setShowTransfer(false);
    setForm({ toParty: '', transferType: 'endorsement', notes: '' });
    refetchChain();
    refetch();
  };

  const handleRespond = async (transferId: string, action: string) => {
    await respond({ variables: { transferId, action } });
    refetchChain();
    refetch();
  };

  const bols = (data?.billsOfLading ?? []).filter((b: Record<string, unknown>) => b.type === 'electronic' || b.type === 'master');
  const summary = data?.eblSummary;
  const chain = chainData?.eblTitleChain ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">eBL Title Chain</h1>
        <p className="text-maritime-400 text-sm mt-1">DCSA v3.0 electronic Bill of Lading title transfer workflow</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total eBLs', value: summary.totalEbls, color: 'text-white', border: 'border-maritime-500' },
            { label: 'Pending', value: summary.pendingTransfers, color: 'text-yellow-400', border: 'border-yellow-500' },
            { label: 'Confirmed', value: summary.confirmedTransfers, color: 'text-green-400', border: 'border-green-500' },
            { label: 'Surrendered', value: summary.surrendered, color: 'text-red-400', border: 'border-red-500' },
          ].map((s) => (
            <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
              <p className="text-maritime-500 text-xs">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* B/L List */}
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-maritime-700">
            <h2 className="text-white text-sm font-medium">Bills of Lading</h2>
          </div>
          {loading && <p className="text-maritime-500 text-xs text-center py-6">Loading...</p>}
          {bols.map((b: Record<string, unknown>) => {
            const voyage = b.voyage as Record<string, unknown>;
            const vessel = voyage?.vessel as Record<string, unknown>;
            return (
              <button key={b.id as string} onClick={() => setSelectedBol(b.id as string)}
                className={`w-full text-left px-4 py-3 border-b border-maritime-700/30 hover:bg-maritime-700/20 ${selectedBol === b.id ? 'bg-maritime-700/30' : ''}`}>
                <p className="text-white text-xs font-medium">{b.bolNumber as string}</p>
                <p className="text-maritime-400 text-[10px]">{voyage?.voyageNumber as string} — {vessel?.name as string}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${b.type === 'electronic' ? 'bg-blue-900/50 text-blue-400' : 'bg-maritime-700 text-maritime-400'}`}>{b.type as string}</span>
                  <span className="text-maritime-500 text-[10px]">{b.status as string}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Title Chain */}
        <div className="lg:col-span-2 bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-maritime-700">
            <h2 className="text-white text-sm font-medium">
              {selectedBol ? 'Title Transfer Chain' : 'Select a B/L to view chain'}
            </h2>
            {selectedBol && (
              <button onClick={() => setShowTransfer(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded">
                + Transfer
              </button>
            )}
          </div>

          {!selectedBol && <p className="text-maritime-500 text-xs text-center py-12">Select a Bill of Lading from the left panel</p>}

          {selectedBol && chain.length === 0 && <p className="text-maritime-500 text-xs text-center py-8">No title transfers yet</p>}

          {chain.length > 0 && (
            <div className="p-4 space-y-3">
              {chain.map((t: Record<string, unknown>, i: number) => (
                <div key={t.id as string} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className={`absolute left-0 top-2 w-3 h-3 rounded-full ${t.dcsaStatus === 'confirmed' ? 'bg-green-500' : t.dcsaStatus === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  {i < chain.length - 1 && <div className="absolute left-1.5 top-5 bottom-0 w-px bg-maritime-700" style={{ height: '100%' }} />}

                  <div className="bg-maritime-900/50 border border-maritime-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${typeColors[t.transferType as string] ?? ''}`}>
                        {(t.transferType as string).replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[t.dcsaStatus as string] ?? ''}`}>
                        {t.dcsaStatus as string}
                      </span>
                    </div>
                    <p className="text-white text-xs">
                      <span className="text-maritime-400">From:</span> {t.fromParty as string}
                      <span className="text-maritime-600 mx-2">&rarr;</span>
                      <span className="text-maritime-400">To:</span> {t.toParty as string}
                    </p>
                    {t.platformRef && <p className="text-maritime-500 text-[10px] mt-1 font-mono">Ref: {t.platformRef as string}</p>}
                    {t.hash && <p className="text-maritime-600 text-[10px] font-mono">Hash: {t.hash as string}</p>}
                    {t.notes && <p className="text-maritime-400 text-[10px] mt-1 italic">{t.notes as string}</p>}
                    <p className="text-maritime-600 text-[10px] mt-1">{new Date(t.createdAt as string).toLocaleString()}</p>

                    {t.dcsaStatus === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleRespond(t.id as string, 'confirm')}
                          className="text-green-400 hover:text-green-300 text-[10px] bg-green-900/30 px-2 py-0.5 rounded">Confirm</button>
                        <button onClick={() => handleRespond(t.id as string, 'reject')}
                          className="text-red-400 hover:text-red-300 text-[10px] bg-red-900/30 px-2 py-0.5 rounded">Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showTransfer && selectedBol && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-4">Initiate Title Transfer</h2>
            <div className="space-y-3">
              <div>
                <label className="text-maritime-400 text-xs">To Party</label>
                <input value={form.toParty} onChange={(e) => setForm({ ...form, toParty: e.target.value })}
                  className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" placeholder="Company name" />
              </div>
              <div>
                <label className="text-maritime-400 text-xs">Transfer Type</label>
                <select value={form.transferType} onChange={(e) => setForm({ ...form, transferType: e.target.value })}
                  className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1">
                  <option value="endorsement">Endorsement</option>
                  <option value="amendment">Amendment</option>
                  <option value="surrender">Surrender</option>
                  <option value="switch_to_paper">Switch to Paper</option>
                </select>
              </div>
              <div>
                <label className="text-maritime-400 text-xs">Notes</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowTransfer(false)} className="text-maritime-400 text-sm hover:text-white px-4 py-2">Cancel</button>
              <button onClick={handleInitiate} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg">Initiate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
