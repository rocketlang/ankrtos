import { useQuery, gql } from '@apollo/client';
import { useState } from 'react';

const VESSELS_QUERY = gql`
  query Vessels {
    vessels {
      id
      name
      imo
      type
      flag
      dwt
      grt
      loa
      beam
      draft
      yearBuilt
      status
    }
  }
`;

const vesselTypeLabels: Record<string, string> = {
  bulk_carrier: 'Bulk Carrier',
  tanker: 'Tanker',
  container: 'Container',
  general_cargo: 'General Cargo',
};

export function Vessels() {
  const { data, loading, error } = useQuery(VESSELS_QUERY);
  const [search, setSearch] = useState('');

  const vessels = data?.vessels?.filter(
    (v: { name: string; imo: string; type: string }) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.imo.includes(search) ||
      v.type.includes(search.toLowerCase()),
  ) ?? [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Vessel Registry</h1>
          <p className="text-maritime-400 text-sm mt-1">Fleet management and vessel details</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search vessels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64"
          />
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
                </tr>
              ))}
            </tbody>
          </table>
          {vessels.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No vessels found</p>
          )}
        </div>
      )}
    </div>
  );
}
