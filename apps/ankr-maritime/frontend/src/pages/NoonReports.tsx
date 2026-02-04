import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const NOON_REPORTS_QUERY = gql`
  query NoonReports($vesselId: String, $voyageId: String) {
    noonReports(vesselId: $vesselId, voyageId: $voyageId) {
      id vesselId voyageId reportDate reportType
      latitude longitude speedActual distanceSailed
      foConsumed doConsumed foROB doROB
      windForce seaState remarks
      vessel { id name }
    }
  }
`;

const PERFORMANCE_SUMMARY_QUERY = gql`
  query VesselPerformanceSummary($vesselId: String!, $voyageId: String) {
    vesselPerformanceSummary(vesselId: $vesselId, voyageId: $voyageId) {
      vesselId totalReports avgSpeed totalDistanceSailed
      totalFoConsumed totalDoConsumed avgWindForce
    }
  }
`;

const VESSELS_QUERY = gql`
  query Vessels {
    vessels { id name imo }
  }
`;

const CREATE_NOON_REPORT = gql`
  mutation CreateNoonReport(
    $vesselId: String!, $voyageId: String, $reportDate: DateTime!, $reportType: String!,
    $latitude: Float, $longitude: Float, $speedActual: Float, $distanceSailed: Float,
    $foConsumed: Float, $doConsumed: Float, $foROB: Float, $doROB: Float,
    $windForce: Int, $seaState: Int, $remarks: String
  ) {
    createNoonReport(
      vesselId: $vesselId, voyageId: $voyageId, reportDate: $reportDate, reportType: $reportType,
      latitude: $latitude, longitude: $longitude, speedActual: $speedActual, distanceSailed: $distanceSailed,
      foConsumed: $foConsumed, doConsumed: $doConsumed, foROB: $foROB, doROB: $doROB,
      windForce: $windForce, seaState: $seaState, remarks: $remarks
    ) { id }
  }
`;

const reportTypes = ['noon', 'departure', 'arrival', 'port', 'drifting', 'bunkering'];

const emptyForm = {
  vesselId: '', voyageId: '', reportDate: '', reportType: 'noon',
  latitude: '', longitude: '', speedActual: '', distanceSailed: '',
  foConsumed: '', doConsumed: '', foROB: '', doROB: '',
  windForce: '', seaState: '', remarks: '',
};

export function NoonReports() {
  const [vesselFilter, setVesselFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const queryVars: Record<string, string | undefined> = {};
  if (vesselFilter) queryVars.vesselId = vesselFilter;

  const { data, loading, error, refetch } = useQuery(NOON_REPORTS_QUERY, { variables: queryVars });
  const { data: vesselData } = useQuery(VESSELS_QUERY);
  const { data: perfData } = useQuery(PERFORMANCE_SUMMARY_QUERY, {
    variables: { vesselId: vesselFilter },
    skip: !vesselFilter,
  });
  const [createNoonReport, { loading: creating }] = useMutation(CREATE_NOON_REPORT);

  const reports = data?.noonReports ?? [];
  const perf = perfData?.vesselPerformanceSummary;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createNoonReport({
      variables: {
        vesselId: form.vesselId,
        voyageId: form.voyageId || null,
        reportDate: new Date(form.reportDate).toISOString(),
        reportType: form.reportType,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        speedActual: form.speedActual ? Number(form.speedActual) : null,
        distanceSailed: form.distanceSailed ? Number(form.distanceSailed) : null,
        foConsumed: form.foConsumed ? Number(form.foConsumed) : null,
        doConsumed: form.doConsumed ? Number(form.doConsumed) : null,
        foROB: form.foROB ? Number(form.foROB) : null,
        doROB: form.doROB ? Number(form.doROB) : null,
        windForce: form.windForce ? Number(form.windForce) : null,
        seaState: form.seaState ? Number(form.seaState) : null,
        remarks: form.remarks || null,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : '-';
  const fmtPos = (lat: number | null, lng: number | null) => {
    if (lat == null || lng == null) return '-';
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(2)}\u00B0${latDir}, ${Math.abs(lng).toFixed(2)}\u00B0${lngDir}`;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Noon Reports</h1>
          <p className="text-maritime-400 text-sm mt-1">Daily vessel performance and position reports</p>
        </div>
        <div className="flex gap-3">
          <select value={vesselFilter} onChange={(e) => setVesselFilter(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
            <option value="">All Vessels</option>
            {vesselData?.vessels?.map((v: { id: string; name: string; imo: string }) => (
              <option key={v.id} value={v.id}>{v.name} ({v.imo})</option>
            ))}
          </select>
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Report</button>
        </div>
      </div>

      {/* Performance summary cards */}
      {vesselFilter && perf && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <p className="text-maritime-400 text-xs font-medium mb-1">Avg Speed</p>
            <p className="text-white text-xl font-bold">{perf.avgSpeed?.toFixed(1) ?? '-'} <span className="text-maritime-400 text-sm font-normal">kts</span></p>
          </div>
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <p className="text-maritime-400 text-xs font-medium mb-1">Total Distance</p>
            <p className="text-white text-xl font-bold">{perf.totalDistanceSailed?.toLocaleString() ?? '-'} <span className="text-maritime-400 text-sm font-normal">NM</span></p>
          </div>
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <p className="text-maritime-400 text-xs font-medium mb-1">Total FO Consumed</p>
            <p className="text-white text-xl font-bold">{perf.totalFoConsumed?.toLocaleString() ?? '-'} <span className="text-maritime-400 text-sm font-normal">MT</span></p>
          </div>
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <p className="text-maritime-400 text-xs font-medium mb-1">Reports Count</p>
            <p className="text-white text-xl font-bold">{perf.totalReports ?? '-'}</p>
          </div>
        </div>
      )}

      {loading && <p className="text-maritime-400">Loading noon reports...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Vessel</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Position</th>
                <th className="text-right px-4 py-3 font-medium">Speed (kts)</th>
                <th className="text-right px-4 py-3 font-medium">Dist (NM)</th>
                <th className="text-right px-4 py-3 font-medium">FO Cons</th>
                <th className="text-right px-4 py-3 font-medium">DO Cons</th>
                <th className="text-right px-4 py-3 font-medium">FO ROB</th>
                <th className="text-right px-4 py-3 font-medium">DO ROB</th>
                <th className="text-center px-4 py-3 font-medium">Wind</th>
                <th className="text-center px-4 py-3 font-medium">Sea</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r: Record<string, unknown>) => (
                <tr key={r.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white text-xs font-mono">{fmtDate(r.reportDate as string | null)}</td>
                  <td className="px-4 py-3 text-maritime-300">{(r.vessel as Record<string, string>)?.name ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-maritime-700 text-maritime-300 capitalize">
                      {r.reportType as string}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-maritime-300 text-xs font-mono">
                    {fmtPos(r.latitude as number | null, r.longitude as number | null)}
                  </td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{(r.speedActual as number)?.toFixed(1) ?? '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{(r.distanceSailed as number)?.toFixed(1) ?? '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{(r.foConsumed as number)?.toFixed(1) ?? '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{(r.doConsumed as number)?.toFixed(1) ?? '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{(r.foROB as number)?.toFixed(1) ?? '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{(r.doROB as number)?.toFixed(1) ?? '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-center">{(r.windForce as number) ?? '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-center">{(r.seaState as number) ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No noon reports found</p>
          )}
        </div>
      )}

      {/* Create Noon Report Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Noon Report">
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
            <FormField label="Report Type *">
              <select value={form.reportType} onChange={set('reportType')} className={selectClass} required>
                {reportTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </FormField>
            <FormField label="Report Date *">
              <input type="datetime-local" value={form.reportDate} onChange={set('reportDate')} className={inputClass} required />
            </FormField>
            <FormField label="Voyage ID">
              <input value={form.voyageId} onChange={set('voyageId')} className={inputClass} placeholder="Optional voyage reference" />
            </FormField>
            <FormField label="Latitude">
              <input type="number" step="0.0001" value={form.latitude} onChange={set('latitude')} className={inputClass} placeholder="25.2744" />
            </FormField>
            <FormField label="Longitude">
              <input type="number" step="0.0001" value={form.longitude} onChange={set('longitude')} className={inputClass} placeholder="55.2962" />
            </FormField>
            <FormField label="Speed (kts)">
              <input type="number" step="0.1" value={form.speedActual} onChange={set('speedActual')} className={inputClass} placeholder="12.5" />
            </FormField>
            <FormField label="Distance Sailed (NM)">
              <input type="number" step="0.1" value={form.distanceSailed} onChange={set('distanceSailed')} className={inputClass} placeholder="285" />
            </FormField>
            <FormField label="FO Consumed (MT)">
              <input type="number" step="0.1" value={form.foConsumed} onChange={set('foConsumed')} className={inputClass} placeholder="32.5" />
            </FormField>
            <FormField label="DO Consumed (MT)">
              <input type="number" step="0.1" value={form.doConsumed} onChange={set('doConsumed')} className={inputClass} placeholder="2.1" />
            </FormField>
            <FormField label="FO ROB (MT)">
              <input type="number" step="0.1" value={form.foROB} onChange={set('foROB')} className={inputClass} placeholder="850" />
            </FormField>
            <FormField label="DO ROB (MT)">
              <input type="number" step="0.1" value={form.doROB} onChange={set('doROB')} className={inputClass} placeholder="120" />
            </FormField>
            <FormField label="Wind Force (Beaufort)">
              <input type="number" min="0" max="12" value={form.windForce} onChange={set('windForce')} className={inputClass} placeholder="4" />
            </FormField>
            <FormField label="Sea State (Douglas)">
              <input type="number" min="0" max="9" value={form.seaState} onChange={set('seaState')} className={inputClass} placeholder="3" />
            </FormField>
          </div>
          <FormField label="Remarks">
            <textarea value={form.remarks} onChange={set('remarks')}
              className={`${inputClass} h-20 resize-none`} placeholder="Weather conditions, incidents, etc." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
