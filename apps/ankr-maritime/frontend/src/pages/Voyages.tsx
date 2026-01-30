import { useQuery, gql } from '@apollo/client';

const VOYAGES_QUERY = gql`
  query Voyages {
    voyages {
      id
      voyageNumber
      vesselId
      status
      etd
      eta
      atd
      ata
      departurePortId
      arrivalPortId
      createdAt
    }
  }
`;

const statusColors: Record<string, string> = {
  planned: 'bg-blue-900/50 text-blue-400',
  in_progress: 'bg-yellow-900/50 text-yellow-400',
  completed: 'bg-green-900/50 text-green-400',
  cancelled: 'bg-red-900/50 text-red-400',
};

export function Voyages() {
  const { data, loading, error } = useQuery(VOYAGES_QUERY);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Voyage Operations</h1>
          <p className="text-maritime-400 text-sm mt-1">Track vessel voyages and milestones</p>
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading voyages...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && data?.voyages?.length === 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <span className="text-4xl">&#x1F6A2;</span>
          <h3 className="text-white font-medium mt-4">No Voyages Yet</h3>
          <p className="text-maritime-400 text-sm mt-2">
            Create your first voyage to start tracking vessel movements.
          </p>
        </div>
      )}

      {!loading && data?.voyages?.length > 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Voyage #</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">ETD</th>
                <th className="text-left px-4 py-3 font-medium">ETA</th>
                <th className="text-left px-4 py-3 font-medium">ATD</th>
                <th className="text-left px-4 py-3 font-medium">ATA</th>
              </tr>
            </thead>
            <tbody>
              {data.voyages.map((v: Record<string, unknown>) => (
                <tr key={v.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white font-medium font-mono">{v.voyageNumber as string}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[(v.status as string)] ?? ''}`}>
                      {(v.status as string).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">{v.etd ? new Date(v.etd as string).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">{v.eta ? new Date(v.eta as string).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">{v.atd ? new Date(v.atd as string).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">{v.ata ? new Date(v.ata as string).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
