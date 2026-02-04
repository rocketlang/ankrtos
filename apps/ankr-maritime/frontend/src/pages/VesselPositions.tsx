import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const VESSEL_POSITIONS_QUERY = gql`
  query VesselPositions($vesselId: String!, $limit: Int) {
    vesselPositions(vesselId: $vesselId, limit: $limit) {
      id vesselId latitude longitude speed heading course
      status destination eta source timestamp
      vessel { id name imo }
    }
  }
`;

const LATEST_POSITION_QUERY = gql`
  query LatestVesselPosition($vesselId: String!) {
    latestVesselPosition(vesselId: $vesselId) {
      id vesselId latitude longitude speed heading course
      status destination eta source timestamp
      vessel { id name imo }
    }
  }
`;

const VESSELS_QUERY = gql`
  query Vessels {
    vessels { id name imo }
  }
`;

const CREATE_VESSEL_POSITION = gql`
  mutation CreateVesselPosition(
    $vesselId: String!, $latitude: Float!, $longitude: Float!,
    $speed: Float, $heading: Float, $course: Float,
    $status: String, $destination: String, $eta: String, $source: String
  ) {
    createVesselPosition(
      vesselId: $vesselId, latitude: $latitude, longitude: $longitude,
      speed: $speed, heading: $heading, course: $course,
      status: $status, destination: $destination, eta: $eta, source: $source
    ) { id }
  }
`;

const statusBadge: Record<string, string> = {
  underway: 'bg-green-900/50 text-green-400',
  at_anchor: 'bg-yellow-900/50 text-yellow-400',
  moored: 'bg-blue-900/50 text-blue-400',
  aground: 'bg-red-900/50 text-red-400',
  not_under_command: 'bg-orange-900/50 text-orange-400',
};

const statusOptions = [
  { value: 'underway', label: 'Underway' },
  { value: 'at_anchor', label: 'At Anchor' },
  { value: 'moored', label: 'Moored' },
  { value: 'aground', label: 'Aground' },
  { value: 'not_under_command', label: 'Not Under Command' },
];

const sourceOptions = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'ais_terrestrial', label: 'AIS Terrestrial' },
  { value: 'ais_satellite', label: 'AIS Satellite' },
];

const emptyForm = {
  vesselId: '', latitude: '', longitude: '', speed: '', heading: '',
  course: '', status: 'underway', destination: '', eta: '', source: 'manual',
};

function fmtPos(lat: number | null | undefined, lng: number | null | undefined) {
  if (lat == null || lng == null) return '-';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}\u00B0${latDir}, ${Math.abs(lng).toFixed(4)}\u00B0${lngDir}`;
}

function fmtTimestamp(d: string | null | undefined) {
  if (!d) return '-';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function VesselPositions() {
  const [vesselFilter, setVesselFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: vesselData } = useQuery(VESSELS_QUERY);

  const { data, loading, error, refetch } = useQuery(VESSEL_POSITIONS_QUERY, {
    variables: { vesselId: vesselFilter, limit: 50 },
    skip: !vesselFilter,
  });

  const { data: latestData } = useQuery(LATEST_POSITION_QUERY, {
    variables: { vesselId: vesselFilter },
    skip: !vesselFilter,
  });

  const [createVesselPosition, { loading: creating }] = useMutation(CREATE_VESSEL_POSITION);

  const positions = data?.vesselPositions ?? [];
  const latest = latestData?.latestVesselPosition;

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createVesselPosition({
      variables: {
        vesselId: form.vesselId,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        speed: form.speed ? parseFloat(form.speed) : null,
        heading: form.heading ? parseFloat(form.heading) : null,
        course: form.course ? parseFloat(form.course) : null,
        status: form.status || null,
        destination: form.destination || null,
        eta: form.eta ? new Date(form.eta).toISOString() : null,
        source: form.source || null,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Vessel Positions</h1>
          <p className="text-maritime-400 text-sm mt-1">Manual vessel position entry and tracking</p>
        </div>
        <div className="flex gap-3">
          <select value={vesselFilter} onChange={(e) => setVesselFilter(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
            <option value="">-- Select Vessel --</option>
            {vesselData?.vessels?.map((v: { id: string; name: string; imo: string }) => (
              <option key={v.id} value={v.id}>{v.name} ({v.imo})</option>
            ))}
          </select>
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ Report Position</button>
        </div>
      </div>

      {!vesselFilter && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <span className="text-4xl">{'\u{1F4CD}'}</span>
          <h3 className="text-white font-medium mt-4">Select a Vessel</h3>
          <p className="text-maritime-400 text-sm mt-2">Choose a vessel from the dropdown to view position history.</p>
        </div>
      )}

      {/* Latest Position Card */}
      {vesselFilter && latest && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{'\u{1F6A2}'}</span>
            <h3 className="text-white font-medium">Latest Position &mdash; {(latest.vessel as Record<string, string>)?.name ?? ''}</h3>
            <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-medium capitalize ${statusBadge[latest.status as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
              {(latest.status as string)?.replace(/_/g, ' ') || 'unknown'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-maritime-400 text-xs font-medium mb-1">Position</p>
              <p className="text-white text-sm font-mono">{fmtPos(latest.latitude as number, latest.longitude as number)}</p>
            </div>
            <div>
              <p className="text-maritime-400 text-xs font-medium mb-1">Speed / Heading</p>
              <p className="text-white text-sm font-mono">
                {(latest.speed as number)?.toFixed(1) ?? '-'} kts / {(latest.heading as number)?.toFixed(0) ?? '-'}&deg;
              </p>
            </div>
            <div>
              <p className="text-maritime-400 text-xs font-medium mb-1">Destination / ETA</p>
              <p className="text-white text-sm">
                {(latest.destination as string) || '-'}
                {latest.eta && <span className="text-maritime-400 ml-1 text-xs">({fmtTimestamp(latest.eta as string)})</span>}
              </p>
            </div>
            <div>
              <p className="text-maritime-400 text-xs font-medium mb-1">Source / Timestamp</p>
              <p className="text-white text-sm">
                <span className="capitalize">{(latest.source as string)?.replace(/_/g, ' ') || '-'}</span>
                <span className="text-maritime-400 ml-1 text-xs">{fmtTimestamp(latest.timestamp as string)}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {vesselFilter && loading && <p className="text-maritime-400">Loading vessel positions...</p>}
      {vesselFilter && error && <p className="text-red-400">Error: {error.message}</p>}

      {vesselFilter && !loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Timestamp</th>
                <th className="text-left px-4 py-3 font-medium">Position</th>
                <th className="text-right px-4 py-3 font-medium">Speed (kts)</th>
                <th className="text-right px-4 py-3 font-medium">Heading</th>
                <th className="text-right px-4 py-3 font-medium">Course</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Destination</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p: Record<string, unknown>) => (
                <tr key={p.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white text-xs font-mono">{fmtTimestamp(p.timestamp as string)}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs font-mono">
                    {fmtPos(p.latitude as number, p.longitude as number)}
                  </td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{(p.speed as number)?.toFixed(1) ?? '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{(p.heading as number)?.toFixed(0) ?? '-'}&deg;</td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{(p.course as number)?.toFixed(0) ?? '-'}&deg;</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${statusBadge[p.status as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                      {(p.status as string)?.replace(/_/g, ' ') || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">{(p.destination as string) || '-'}</td>
                  <td className="px-4 py-3 text-maritime-400 text-xs capitalize">{(p.source as string)?.replace(/_/g, ' ') || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {positions.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No position reports found for this vessel</p>
          )}
        </div>
      )}

      {/* Report Position Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Report Vessel Position">
        <form onSubmit={handleCreate}>
          <FormField label="Vessel *">
            <select value={form.vesselId} onChange={set('vesselId')} className={selectClass} required>
              <option value="">-- Select Vessel --</option>
              {vesselData?.vessels?.map((v: { id: string; name: string; imo: string }) => (
                <option key={v.id} value={v.id}>{v.name} ({v.imo})</option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Latitude *">
              <input type="number" step="0.0001" value={form.latitude} onChange={set('latitude')}
                className={inputClass} required placeholder="25.2744" />
            </FormField>
            <FormField label="Longitude *">
              <input type="number" step="0.0001" value={form.longitude} onChange={set('longitude')}
                className={inputClass} required placeholder="55.2962" />
            </FormField>
            <FormField label="Speed (kts)">
              <input type="number" step="0.1" value={form.speed} onChange={set('speed')}
                className={inputClass} placeholder="12.5" />
            </FormField>
            <FormField label="Heading (&deg;)">
              <input type="number" step="1" min="0" max="360" value={form.heading} onChange={set('heading')}
                className={inputClass} placeholder="045" />
            </FormField>
            <FormField label="Course (&deg;)">
              <input type="number" step="1" min="0" max="360" value={form.course} onChange={set('course')}
                className={inputClass} placeholder="042" />
            </FormField>
            <FormField label="Status">
              <select value={form.status} onChange={set('status')} className={selectClass}>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Destination">
            <input value={form.destination} onChange={set('destination')} className={inputClass} placeholder="Rotterdam, NL" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="ETA">
              <input type="datetime-local" value={form.eta} onChange={set('eta')} className={inputClass} />
            </FormField>
            <FormField label="Source">
              <select value={form.source} onChange={set('source')} className={selectClass}>
                {sourceOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Reporting...' : 'Report Position'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
