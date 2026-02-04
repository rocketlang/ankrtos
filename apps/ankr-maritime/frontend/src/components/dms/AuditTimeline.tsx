/**
 * Audit Timeline Component
 * Visualizes document audit trail with actions and timestamps
 */

import { useQuery, gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';

const GET_AUDIT_TRAIL = gql`
  query GetDocumentAuditTrail($documentId: String!, $limit: Int) {
    getDocumentAuditTrail(documentId: $documentId, limit: $limit) {
      id
      action
      performedBy
      performedByName
      ipAddress
      userAgent
      changes
      metadata
      createdAt
    }
  }
`;

interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByName?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: any;
  metadata?: any;
  createdAt: string;
}

interface AuditTimelineProps {
  documentId: string;
  limit?: number;
}

export function AuditTimeline({ documentId, limit = 50 }: AuditTimelineProps) {
  const { t } = useTranslation();
  const { data, loading } = useQuery(GET_AUDIT_TRAIL, {
    variables: { documentId, limit },
    skip: !documentId,
  });

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return '✨';
      case 'viewed':
        return '👁️';
      case 'downloaded':
        return '⬇️';
      case 'edited':
        return '✏️';
      case 'versioned':
        return '🔄';
      case 'archived':
        return '📦';
      case 'deleted':
        return '🗑️';
      case 'locked':
        return '🔒';
      case 'unlocked':
        return '🔓';
      case 'verified':
        return '✅';
      default:
        return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return 'green';
      case 'viewed':
        return 'blue';
      case 'downloaded':
        return 'cyan';
      case 'edited':
        return 'yellow';
      case 'versioned':
        return 'purple';
      case 'archived':
        return 'gray';
      case 'deleted':
        return 'red';
      case 'locked':
        return 'orange';
      case 'unlocked':
        return 'green';
      case 'verified':
        return 'green';
      default:
        return 'maritime';
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return t('dms.justNow', 'just now');
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-maritime-500">
        <div className="animate-spin inline-block w-5 h-5 border-2 border-maritime-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const logs: AuditLog[] = data?.getDocumentAuditTrail || [];

  if (logs.length === 0) {
    return (
      <div className="p-6 text-center text-maritime-500">
        <p className="text-3xl mb-2">📋</p>
        <p className="text-sm">{t('dms.noAuditLogs', 'No audit logs yet')}</p>
      </div>
    );
  }

  return (
    <div className="bg-maritime-800 rounded-lg border border-maritime-700">
      <div className="p-3 border-b border-maritime-700">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          📜 {t('dms.auditTrail', 'Audit Trail')}
        </h3>
        <p className="text-xs text-maritime-500 mt-1">
          {logs.length} {t('dms.events', 'events')}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto p-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-maritime-700" />

          {/* Timeline events */}
          <div className="space-y-4">
            {logs.map((log, index) => {
              const color = getActionColor(log.action);
              const icon = getActionIcon(log.action);

              return (
                <div key={log.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full bg-${color}-900 border-2 border-${color}-600 flex items-center justify-center text-sm`}
                  >
                    {icon}
                  </div>

                  {/* Event content */}
                  <div className="bg-maritime-750 rounded-lg p-3 hover:bg-maritime-700 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-xs text-maritime-400 mt-0.5">
                          by {log.performedByName || log.performedBy}
                        </p>
                      </div>
                      <span className="text-xs text-maritime-500 whitespace-nowrap">
                        {formatTimestamp(log.createdAt)}
                      </span>
                    </div>

                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div className="mt-2 p-2 bg-maritime-800 rounded text-xs">
                        <span className="text-maritime-500">{t('dms.changes', 'Changes')}:</span>
                        <pre className="mt-1 text-maritime-300 overflow-x-auto">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </div>
                    )}

                    {log.metadata && (
                      <div className="mt-2 flex items-center gap-3 text-xs text-maritime-500">
                        {log.ipAddress && <span>🌐 {log.ipAddress}</span>}
                        {log.metadata.versionNumber && (
                          <span>📝 v{log.metadata.versionNumber}</span>
                        )}
                        {log.metadata.blockchainTxId && (
                          <span title={log.metadata.blockchainTxId}>
                            ⛓️ {log.metadata.blockchainTxId.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
