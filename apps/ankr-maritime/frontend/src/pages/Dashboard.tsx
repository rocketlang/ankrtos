import { useQuery, gql } from '@apollo/client';

const HEALTH_QUERY = gql`
  query Health {
    health
  }
`;

export function Dashboard() {
  const { data, loading, error } = useQuery(HEALTH_QUERY);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-2">ankrMrk8X Dashboard</h1>
      <p className="text-maritime-300 mb-8">Maritime Operations Platform</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* GraphQL Status Card */}
        <div className="bg-maritime-800 border border-maritime-600 rounded-lg p-6">
          <h3 className="text-sm font-medium text-maritime-300 mb-2">GraphQL API</h3>
          {loading && <p className="text-yellow-400">Connecting...</p>}
          {error && <p className="text-red-400">Disconnected</p>}
          {data && <p className="text-green-400">{data.health}</p>}
        </div>

        {/* Vessels Card */}
        <div className="bg-maritime-800 border border-maritime-600 rounded-lg p-6">
          <h3 className="text-sm font-medium text-maritime-300 mb-2">Vessels</h3>
          <p className="text-2xl font-bold text-white">--</p>
          <p className="text-xs text-maritime-400 mt-1">Phase 1 — Fleet Management</p>
        </div>

        {/* Voyages Card */}
        <div className="bg-maritime-800 border border-maritime-600 rounded-lg p-6">
          <h3 className="text-sm font-medium text-maritime-300 mb-2">Active Voyages</h3>
          <p className="text-2xl font-bold text-white">--</p>
          <p className="text-xs text-maritime-400 mt-1">Phase 2 — Voyage Ops</p>
        </div>
      </div>

      {/* Module Preview */}
      <div className="bg-maritime-800 border border-maritime-600 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Platform Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Chartering', status: 'Phase 1' },
            { name: 'Voyage Ops', status: 'Phase 2' },
            { name: 'DA Desk', status: 'Phase 2' },
            { name: 'Laytime', status: 'Phase 3' },
            { name: 'Claims', status: 'Phase 3' },
            { name: 'Compliance', status: 'Phase 4' },
            { name: 'P&I Club', status: 'Phase 5' },
            { name: 'Analytics', status: 'Phase 5' },
          ].map((mod) => (
            <div key={mod.name} className="bg-maritime-900 rounded-md p-3 text-center">
              <p className="text-sm font-medium text-white">{mod.name}</p>
              <p className="text-xs text-maritime-400 mt-1">{mod.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
