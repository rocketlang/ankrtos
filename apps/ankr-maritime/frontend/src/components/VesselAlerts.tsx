/**
 * VESSEL ALERTS PANEL
 * Display vessel alerts with filtering and mark-as-read
 */

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const VESSEL_ALERTS_QUERY = gql`
  query VesselAlerts($mmsi: String, $type: VesselAlertType, $severity: AlertSeverity, $unreadOnly: Boolean, $limit: Int) {
    vesselAlerts(mmsi: $mmsi, type: $type, severity: $severity, unreadOnly: $unreadOnly, limit: $limit) {
      id
      mmsi
      vesselName
      type
      severity
      message
      timestamp
      read
      metadata
    }
  }
`;

const ALERT_STATS_QUERY = gql`
  query VesselAlertStats {
    vesselAlertStats {
      total
      unread
      critical
      warning
      info
      byType
    }
  }
`;

const MARK_ALERT_READ = gql`
  mutation MarkAlertRead($alertId: String!) {
    markAlertRead(alertId: $alertId) {
      id
      read
    }
  }
`;

const MARK_ALL_READ = gql`
  mutation MarkAllAlertsRead {
    markAllAlertsRead
  }
`;

const CHECK_VESSEL_ALERTS = gql`
  mutation CheckVesselAlerts($mmsi: String) {
    checkVesselAlerts(mmsi: $mmsi) {
      id
      mmsi
      vesselName
      type
      severity
      message
      timestamp
    }
  }
`;

interface VesselAlertsProps {
  mmsi?: string;
  limit?: number;
  showStats?: boolean;
}

export default function VesselAlerts({ mmsi, limit = 20, showStats = true }: VesselAlertsProps) {
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, loading, refetch } = useQuery(VESSEL_ALERTS_QUERY, {
    variables: { mmsi, severity: severityFilter, unreadOnly, limit },
    pollInterval: 30000, // Refresh every 30 seconds
  });

  const { data: statsData } = useQuery(ALERT_STATS_QUERY, {
    skip: !showStats,
    pollInterval: 30000,
  });

  const [markAlertRead] = useMutation(MARK_ALERT_READ, {
    refetchQueries: ['VesselAlerts', 'VesselAlertStats'],
  });

  const [markAllRead] = useMutation(MARK_ALL_READ, {
    refetchQueries: ['VesselAlerts', 'VesselAlertStats'],
  });

  const [checkAlerts, { loading: checkingAlerts }] = useMutation(CHECK_VESSEL_ALERTS, {
    refetchQueries: ['VesselAlerts', 'VesselAlertStats'],
  });

  const alerts = data?.vesselAlerts || [];
  const stats = statsData?.vesselAlertStats;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
      case 'WARNING': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'INFO': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '🚨';
      case 'WARNING': return '⚠️';
      case 'INFO': return 'ℹ️';
      default: return '📢';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Alerts</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
            <div className="text-sm text-gray-600">Unread</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-orange-600">{stats.warning}</div>
            <div className="text-sm text-gray-600">Warning</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{stats.info}</div>
            <div className="text-sm text-gray-600">Info</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-wrap items-center gap-3">
          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Severity:</label>
            <select
              value={severityFilter || 'all'}
              onChange={(e) => setSeverityFilter(e.target.value === 'all' ? null : e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          {/* Unread Only */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Unread only</span>
          </label>

          <div className="flex-1" />

          {/* Actions */}
          <button
            onClick={() => checkAlerts({ variables: { mmsi } })}
            disabled={checkingAlerts}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {checkingAlerts ? 'Checking...' : 'Check Now'}
          </button>

          <button
            onClick={() => markAllRead()}
            className="px-4 py-1.5 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
          >
            Mark All Read
          </button>

          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {mmsi ? `Alerts for ${mmsi}` : 'All Alerts'}
          </h3>
          <p className="text-sm text-gray-600">{alerts.length} alerts</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {unreadOnly ? 'No unread alerts' : 'No alerts found'}
          </div>
        ) : (
          <div className="divide-y">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${!alert.read ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-2xl flex-shrink-0">
                    {getSeverityIcon(alert.severity)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Severity Badge */}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>

                      {/* Type Badge */}
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
                        {getTypeLabel(alert.type)}
                      </span>

                      {/* Unread Indicator */}
                      {!alert.read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}

                      {/* Timestamp */}
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-sm text-gray-900 mb-1">{alert.message}</p>

                    {/* Vessel Info */}
                    {alert.vesselName && (
                      <p className="text-xs text-gray-600">
                        Vessel: {alert.vesselName} ({alert.mmsi})
                      </p>
                    )}

                    {/* Metadata (if any) */}
                    {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          View details
                        </summary>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(alert.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>

                  {/* Mark Read Button */}
                  {!alert.read && (
                    <button
                      onClick={() => markAlertRead({ variables: { alertId: alert.id } })}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex-shrink-0"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
