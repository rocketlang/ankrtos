import { useQuery, gql } from '@apollo/client';

const FEATURES_QUERY = gql`
  query Features {
    currentTier
    features {
      key
      name
      description
      tier
      enabled
      module
    }
  }
`;

const tierColors: Record<string, string> = {
  free: 'bg-green-900/50 text-green-400 border-green-700',
  pro: 'bg-blue-900/50 text-blue-400 border-blue-700',
  enterprise: 'bg-purple-900/50 text-purple-400 border-purple-700',
};

const tierBadge: Record<string, string> = {
  free: 'bg-green-900/30 text-green-400',
  pro: 'bg-blue-900/30 text-blue-400',
  enterprise: 'bg-purple-900/30 text-purple-400',
};

export function Features() {
  const { data, loading } = useQuery(FEATURES_QUERY);

  const modules = [...new Set((data?.features ?? []).map((f: { module: string }) => f.module))];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Platform Configuration</h1>
        <p className="text-maritime-400 text-sm mt-1">Feature flags and tier management</p>
      </div>

      {/* Current Tier */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {['free', 'pro', 'enterprise'].map((tier) => (
          <div
            key={tier}
            className={`rounded-lg border p-6 ${
              data?.currentTier === tier
                ? tierColors[tier]
                : 'bg-maritime-800 border-maritime-700 opacity-50'
            }`}
          >
            <h3 className="text-lg font-bold capitalize">{tier}</h3>
            <p className="text-xs mt-1 opacity-75">
              {tier === 'free' && 'Core maritime ops — vessels, ports, chartering'}
              {tier === 'pro' && 'Advanced ops, milestones, analytics'}
              {tier === 'enterprise' && 'Full platform — DA Desk, Laytime, Claims, AI'}
            </p>
            {data?.currentTier === tier && (
              <span className="inline-block mt-3 text-xs font-medium bg-white/10 rounded px-2 py-0.5">
                ACTIVE
              </span>
            )}
          </div>
        ))}
      </div>

      {loading && <p className="text-maritime-400">Loading features...</p>}

      {/* Features by Module */}
      {modules.map((mod) => {
        const moduleFeatures = (data?.features ?? []).filter(
          (f: { module: string }) => f.module === mod,
        );
        return (
          <div key={mod as string} className="mb-6">
            <h2 className="text-sm font-medium text-maritime-400 uppercase tracking-wider mb-3">
              {(mod as string).replace(/_/g, ' ')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {moduleFeatures.map((f: Record<string, unknown>) => (
                <div
                  key={f.key as string}
                  className={`bg-maritime-800 border rounded-md p-4 flex items-start gap-3 ${
                    f.enabled ? 'border-maritime-600' : 'border-maritime-700/50 opacity-40'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full mt-1 ${f.enabled ? 'bg-green-400' : 'bg-maritime-600'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{f.name as string}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${tierBadge[(f.tier as string)]}`}>
                        {(f.tier as string).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-maritime-400 text-xs mt-1">{f.description as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-8 bg-maritime-800 border border-maritime-700 rounded-md p-4">
        <p className="text-maritime-400 text-xs">
          Set <code className="text-blue-400">MRK8X_TIER=pro</code> or <code className="text-blue-400">MRK8X_TIER=enterprise</code> in backend .env to unlock higher tiers.
        </p>
      </div>
    </div>
  );
}
