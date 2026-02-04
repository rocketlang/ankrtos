import { useQuery, useMutation, gql } from '@apollo/client';

const UNRESOLVED_ALERTS_QUERY = gql`
  query UnresolvedAlerts($limit: Int) {
    unresolvedAlerts(limit: $limit) {
      id
      voyageId
      type
      severity
      rootCause
      description
      delayHours
      eta
      createdAt
      voyage {
        voyageNumber
        vessel {
          name
        }
      }
    }
  }
`;

const RESOLVE_ALERT = gql`
  mutation ResolveAlert($alertId: String!, $notes: String) {
    resolveAlert(alertId: $alertId, notes: $notes) {
      id
      resolvedAt
    }
  }
`;

const severityColors = {
  info: 'bg-blue-900/30 text-blue-400 border-blue-700',
  warning: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
  critical: 'bg-red-900/30 text-red-400 border-red-700',
};

const typeIcons: Record<string, string> = {
  late_arrival: '⏰',
  late_departure: '🚢',
  extended_port_stay: '⚓',
  weather: '🌧️',
  congestion: '🚦',
  mechanical: '🔧',
  customs: '📋',
  cargo: '📦',
  route_deviation: '🧭',
  other: '⚠️',
};

export function VoyageAlertsPanel({ limit = 10 }: { limit?: number }) {
  const { data, loading, refetch } = useQuery(UNRESOLVED_ALERTS_QUERY, {
    variables: { limit },
    pollInterval: 60000, // Update every minute
  });

  const [resolveAlert] = useMutation(RESOLVE_ALERT, {
    onCompleted: () => refetch(),
  });

  const handleResolve = async (alertId: string) => {
    if (confirm('Mark this alert as resolved?')) {
      await resolveAlert({ variables: { alertId } });
    }
  };

  const alerts = data?.unresolvedAlerts || [];

  if (loading && !data) {
    return (
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
        <p className="text-maritime-400 text-sm">Loading alerts...</p>
      </div>
    );
  }

  return (
    <div className="bg-maritime-800 border border-maritime-700 rounded-lg">
      <div className="p-4 border-b border-maritime-700 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Active Voyage Alerts</h3>
          <p className="text-maritime-400 text-xs mt-0.5">
            {alerts.length} unresolved {alerts.length === 1 ? 'alert' : 'alerts'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-maritime-400 hover:text-white text-xs"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-4xl">✅</span>
            <p className="text-maritime-400 text-sm mt-2">No active alerts</p>
            <p className="text-maritime-500 text-xs mt-1">All voyages proceeding normally</p>
          </div>
        ) : (
          <div className="divide-y divide-maritime-700">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`p-4 border-l-4 ${severityColors[alert.severity as keyof typeof severityColors] || severityColors.info}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{typeIcons[alert.type] || '⚠️'}</span>
                      <span className="text-white font-medium text-sm">
                        {alert.voyage.vessel.name}
                      </span>
                      <span className="text-maritime-500 text-xs">
                        {alert.voyage.voyageNumber}
                      </span>
                    </div>

                    <p className="text-sm text-maritime-300 mb-2">{alert.description}</p>

                    <div className="flex items-center gap-4 text-xs text-maritime-400">
                      <span className="capitalize">
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                      {alert.delayHours && (
                        <span>
                          Delay: {alert.delayHours.toFixed(1)}h
                        </span>
                      )}
                      {alert.rootCause && alert.rootCause !== 'other' && (
                        <span className="capitalize">
                          Cause: {alert.rootCause.replace(/_/g, ' ')}
                        </span>
                      )}
                      <span className="text-maritime-500">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="ml-4 text-xs text-green-400 hover:text-green-300 whitespace-nowrap"
                  >
                    ✓ Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {alerts.length > 0 && (
        <div className="p-3 border-t border-maritime-700 bg-maritime-900/50 text-center">
          <p className="text-maritime-500 text-xs">
            Auto-checked via AIS tracking • Updates every minute
          </p>
        </div>
      )}
    </div>
  );
}
