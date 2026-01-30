import { useQuery, gql } from '@apollo/client';

const CHARTERS_QUERY = gql`
  query Charters {
    charters {
      id
      reference
      type
      status
      vesselId
      freightRate
      freightUnit
      currency
      laycanStart
      laycanEnd
      createdAt
    }
  }
`;

const statusColors: Record<string, string> = {
  draft: 'bg-gray-800 text-gray-400',
  on_subs: 'bg-yellow-900/50 text-yellow-400',
  fixed: 'bg-blue-900/50 text-blue-400',
  executed: 'bg-green-900/50 text-green-400',
  completed: 'bg-green-900/30 text-green-300',
  cancelled: 'bg-red-900/50 text-red-400',
};

export function Chartering() {
  const { data, loading, error } = useQuery(CHARTERS_QUERY);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Chartering</h1>
          <p className="text-maritime-400 text-sm mt-1">Charter fixtures and negotiations</p>
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading charters...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && data?.charters?.length === 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <span className="text-4xl">&#x1F4CB;</span>
          <h3 className="text-white font-medium mt-4">No Charters Yet</h3>
          <p className="text-maritime-400 text-sm mt-2">
            Create your first charter fixture to start tracking voyage chartering.
          </p>
        </div>
      )}

      {!loading && data?.charters?.length > 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Reference</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Freight Rate</th>
                <th className="text-left px-4 py-3 font-medium">Laycan</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.charters.map((ch: Record<string, unknown>) => (
                <tr key={ch.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white font-medium font-mono">{ch.reference as string}</td>
                  <td className="px-4 py-3 text-maritime-300 capitalize">{ch.type as string}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[(ch.status as string)] ?? ''}`}>
                      {(ch.status as string).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-maritime-300 text-right">
                    {ch.freightRate ? `${ch.currency} ${(ch.freightRate as number).toLocaleString()}/${ch.freightUnit}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">
                    {ch.laycanStart ? new Date(ch.laycanStart as string).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-maritime-500 text-xs">
                    {new Date(ch.createdAt as string).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
