import { useQuery, gql } from '@apollo/client';
import { useState } from 'react';

const PORTS_QUERY = gql`
  query Ports {
    ports {
      id
      unlocode
      name
      country
      latitude
      longitude
      timezone
      type
    }
  }
`;

export function Ports() {
  const { data, loading, error } = useQuery(PORTS_QUERY);
  const [search, setSearch] = useState('');

  const ports = data?.ports?.filter(
    (p: { name: string; unlocode: string; country: string }) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.unlocode.toLowerCase().includes(search.toLowerCase()) ||
      p.country.toLowerCase().includes(search.toLowerCase()),
  ) ?? [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Port Directory</h1>
          <p className="text-maritime-400 text-sm mt-1">{data?.ports?.length ?? 0} ports worldwide</p>
        </div>
        <input
          type="text"
          placeholder="Search ports, UNLOCODE, country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-80"
        />
      </div>

      {loading && <p className="text-maritime-400">Loading ports...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">UNLOCODE</th>
                <th className="text-left px-4 py-3 font-medium">Port Name</th>
                <th className="text-left px-4 py-3 font-medium">Country</th>
                <th className="text-right px-4 py-3 font-medium">Latitude</th>
                <th className="text-right px-4 py-3 font-medium">Longitude</th>
                <th className="text-left px-4 py-3 font-medium">Timezone</th>
              </tr>
            </thead>
            <tbody>
              {ports.map((p: Record<string, unknown>) => (
                <tr key={p.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-blue-400 font-mono text-xs font-medium">{p.unlocode as string}</td>
                  <td className="px-4 py-3 text-white font-medium">{p.name as string}</td>
                  <td className="px-4 py-3 text-maritime-300">{p.country as string}</td>
                  <td className="px-4 py-3 text-maritime-300 text-right font-mono text-xs">{(p.latitude as number)?.toFixed(4) ?? '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-right font-mono text-xs">{(p.longitude as number)?.toFixed(4) ?? '-'}</td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">{(p.timezone as string) ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ports.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No ports found</p>
          )}
        </div>
      )}
    </div>
  );
}
