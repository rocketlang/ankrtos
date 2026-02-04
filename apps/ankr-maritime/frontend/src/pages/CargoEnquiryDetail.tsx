import { useQuery, useMutation, gql } from '@apollo/client';
import { useParams, Link } from 'react-router-dom';

const ENQUIRY = gql`
  query CargoEnquiry($id: String!) {
    cargoEnquiry(id: $id) {
      id cargoType quantity tolerance loadPortId dischargePortId laycanFrom laycanTo
      rateIndication rateUnit currency status notes chartererName brokerName createdAt updatedAt
    }
  }
`;

const UPDATE_STATUS = gql`
  mutation UpdateCargoEnquiryStatus($id: String!, $status: String!) {
    updateCargoEnquiryStatus(id: $id, status: $status) { id status }
  }
`;

export function CargoEnquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useQuery(ENQUIRY, { variables: { id } });
  const [updateStatus] = useMutation(UPDATE_STATUS, { refetchQueries: ['CargoEnquiry'] });

  if (loading) return <div className="p-6 text-maritime-400">Loading...</div>;
  const e = data?.cargoEnquiry;
  if (!e) return <div className="p-6 text-red-400">Enquiry not found</div>;

  const statusColors: Record<string, string> = {
    open: 'bg-blue-900/50 text-blue-300',
    working: 'bg-yellow-900/50 text-yellow-300',
    fixed: 'bg-green-900/50 text-green-300',
    failed: 'bg-red-900/50 text-red-300',
    withdrawn: 'bg-maritime-700 text-maritime-400',
  };

  const transitions: Record<string, string[]> = {
    open: ['working', 'withdrawn'],
    working: ['fixed', 'failed', 'withdrawn'],
    fixed: [],
    failed: ['open'],
    withdrawn: ['open'],
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/cargo-enquiries" className="text-maritime-400 hover:text-white text-sm">&larr; Back to Enquiries</Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Cargo Enquiry: {e.cargoType}</h1>
          <p className="text-maritime-400 text-sm mt-1">ID: {e.id}</p>
        </div>
        <span className={`px-3 py-1 rounded text-sm font-medium ${statusColors[e.status] ?? 'bg-maritime-700 text-maritime-400'}`}>
          {e.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-maritime-800 rounded-lg border border-maritime-700 p-4">
          <h3 className="text-sm font-medium text-maritime-400 mb-3">Cargo Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-maritime-400">Cargo Type</span><span className="text-white">{e.cargoType}</span></div>
            <div className="flex justify-between"><span className="text-maritime-400">Quantity</span><span className="text-white">{e.quantity?.toLocaleString()} MT</span></div>
            <div className="flex justify-between"><span className="text-maritime-400">Tolerance</span><span className="text-white">{e.tolerance ? `±${e.tolerance}%` : '—'}</span></div>
            <div className="flex justify-between"><span className="text-maritime-400">Rate Indication</span><span className="text-white">{e.rateIndication ? `${e.currency ?? 'USD'} ${e.rateIndication}/${e.rateUnit ?? 'MT'}` : '—'}</span></div>
          </div>
        </div>

        <div className="bg-maritime-800 rounded-lg border border-maritime-700 p-4">
          <h3 className="text-sm font-medium text-maritime-400 mb-3">Route &amp; Timing</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-maritime-400">Load Port</span><span className="text-white">{e.loadPortId ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-maritime-400">Discharge Port</span><span className="text-white">{e.dischargePortId ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-maritime-400">Laycan From</span><span className="text-white">{e.laycanFrom ? new Date(e.laycanFrom).toLocaleDateString() : '—'}</span></div>
            <div className="flex justify-between"><span className="text-maritime-400">Laycan To</span><span className="text-white">{e.laycanTo ? new Date(e.laycanTo).toLocaleDateString() : '—'}</span></div>
          </div>
        </div>

        <div className="bg-maritime-800 rounded-lg border border-maritime-700 p-4">
          <h3 className="text-sm font-medium text-maritime-400 mb-3">Parties</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-maritime-400">Charterer</span><span className="text-white">{e.chartererName ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-maritime-400">Broker</span><span className="text-white">{e.brokerName ?? '—'}</span></div>
          </div>
        </div>

        <div className="bg-maritime-800 rounded-lg border border-maritime-700 p-4">
          <h3 className="text-sm font-medium text-maritime-400 mb-3">Timeline</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-maritime-400">Created</span><span className="text-white">{new Date(e.createdAt).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-maritime-400">Updated</span><span className="text-white">{new Date(e.updatedAt).toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {e.notes && (
        <div className="bg-maritime-800 rounded-lg border border-maritime-700 p-4 mb-6">
          <h3 className="text-sm font-medium text-maritime-400 mb-2">Notes</h3>
          <p className="text-white text-sm whitespace-pre-wrap">{e.notes}</p>
        </div>
      )}

      {/* Status Transitions */}
      {(transitions[e.status] ?? []).length > 0 && (
        <div className="bg-maritime-800 rounded-lg border border-maritime-700 p-4">
          <h3 className="text-sm font-medium text-maritime-400 mb-3">Actions</h3>
          <div className="flex gap-2">
            {(transitions[e.status] ?? []).map((s: string) => (
              <button key={s} onClick={() => updateStatus({ variables: { id: e.id, status: s } })}
                className="px-4 py-2 bg-maritime-700 hover:bg-maritime-600 text-white text-sm rounded capitalize">
                Mark as {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
