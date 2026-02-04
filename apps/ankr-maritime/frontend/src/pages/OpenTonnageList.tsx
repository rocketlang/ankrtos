import { useQuery, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;

const VESSEL_POSITIONS = gql`
  query VesselPositions($vesselId: String) {
    vesselPositions(vesselId: $vesselId, limit: 100) {
      id vesselId latitude longitude speed heading status destination eta reportedAt
    }
  }
`;

const VESSELS = gql`
  query Vessels { vessels { id name imo flag type dwt grt nrt loa beam draft builtYear status } }
`;

export function OpenTonnageList() {
  // State for filters
  const [vesselType, setVesselType] = useState('');
  const [dwtMin, setDwtMin] = useState('');
  const [dwtMax, setDwtMax] = useState('');
  const [openArea, setOpenArea] = useState('');
  const [myFleetOnly, setMyFleetOnly] = useState(false);

  const { data: vesselsData } = useQuery(VESSELS);
  const { data: positionsData } = useQuery(VESSEL_POSITIONS);

  // Build position map: vesselId -> latest position
  const positionMap = new Map();
  for (const p of positionsData?.vesselPositions ?? []) {
    const existing = positionMap.get(p.vesselId);
    if (!existing || new Date(p.reportedAt) > new Date(existing.reportedAt)) {
      positionMap.set(p.vesselId, p);
    }
  }

  // Filter vessels
  let filtered = (vesselsData?.vessels ?? []).filter((v: any) => {
    if (vesselType && v.type !== vesselType) return false;
    if (dwtMin && v.dwt < Number(dwtMin)) return false;
    if (dwtMax && v.dwt > Number(dwtMax)) return false;
    // Open area filter: check if vessel destination matches
    if (openArea) {
      const pos = positionMap.get(v.id);
      if (pos && pos.destination && !pos.destination.toLowerCase().includes(openArea.toLowerCase())) return false;
    }
    return true;
  });

  const vesselTypes = [...new Set((vesselsData?.vessels ?? []).map((v: any) => v.type))];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Open Tonnage List</h1>
          <p className="text-maritime-400 text-sm mt-1">Vessels available for fixture — {filtered.length} vessel(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-maritime-300">
            <input type="checkbox" checked={myFleetOnly} onChange={(e) => setMyFleetOnly(e.target.checked)}
              className="rounded bg-maritime-700 border-maritime-600" />
            My Fleet Only
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-maritime-800 rounded-lg border border-maritime-700 p-4 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-maritime-400">Vessel Type</label>
            <select value={vesselType} onChange={(e) => setVesselType(e.target.value)}
              className="w-full mt-1 bg-maritime-900 border border-maritime-700 rounded px-3 py-2 text-white text-sm">
              <option value="">All Types</option>
              {vesselTypes.map((t: any) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-maritime-400">Min DWT</label>
            <input type="number" value={dwtMin} onChange={(e) => setDwtMin(e.target.value)} placeholder="e.g. 30000"
              className="w-full mt-1 bg-maritime-900 border border-maritime-700 rounded px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-maritime-400">Max DWT</label>
            <input type="number" value={dwtMax} onChange={(e) => setDwtMax(e.target.value)} placeholder="e.g. 80000"
              className="w-full mt-1 bg-maritime-900 border border-maritime-700 rounded px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-maritime-400">Open Area</label>
            <input type="text" value={openArea} onChange={(e) => setOpenArea(e.target.value)} placeholder="e.g. SE Asia"
              className="w-full mt-1 bg-maritime-900 border border-maritime-700 rounded px-3 py-2 text-white text-sm" />
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-maritime-800 rounded-lg border border-maritime-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-maritime-700 text-maritime-400">
              <th className="text-left p-3">Vessel</th>
              <th className="text-left p-3">Type</th>
              <th className="text-right p-3">DWT</th>
              <th className="text-left p-3">Flag</th>
              <th className="text-right p-3">Built</th>
              <th className="text-left p-3">Position</th>
              <th className="text-left p-3">Destination</th>
              <th className="text-left p-3">ETA</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v: any) => {
              const pos = positionMap.get(v.id);
              return (
                <tr key={v.id} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="p-3">
                    <div className="text-white font-medium">{v.name}</div>
                    <div className="text-maritime-500 text-xs">IMO {v.imo}</div>
                  </td>
                  <td className="p-3 text-maritime-300 capitalize">{v.type?.replace('_', ' ')}</td>
                  <td className="p-3 text-right text-white">{v.dwt?.toLocaleString()}</td>
                  <td className="p-3 text-maritime-300">{v.flag}</td>
                  <td className="p-3 text-right text-maritime-300">{v.builtYear}</td>
                  <td className="p-3 text-maritime-300">
                    {pos ? `${pos.latitude?.toFixed(2)}°, ${pos.longitude?.toFixed(2)}°` : '—'}
                  </td>
                  <td className="p-3 text-maritime-300">{pos?.destination ?? '—'}</td>
                  <td className="p-3 text-maritime-300">
                    {pos?.eta ? new Date(pos.eta).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      pos?.status === 'at_sea' ? 'bg-blue-900/50 text-blue-300' :
                      pos?.status === 'at_anchor' ? 'bg-yellow-900/50 text-yellow-300' :
                      pos?.status === 'in_port' ? 'bg-green-900/50 text-green-300' :
                      'bg-maritime-700 text-maritime-400'
                    }`}>
                      {pos?.status?.replace('_', ' ') ?? v.status ?? 'unknown'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="p-8 text-center text-maritime-500">No vessels match filters</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
