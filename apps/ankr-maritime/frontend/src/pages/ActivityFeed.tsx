import { useQuery, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;

const ACTIVITY_LOGS = gql`
  query ActivityLogs($entityType: String, $limit: Int) {
    activityLogs(entityType: $entityType, limit: $limit) {
      id userId userName action entityType entityId details createdAt
    }
  }
`;

const entityTypes = ['charter', 'voyage', 'vessel', 'company', 'da', 'laytime', 'bol'] as const;

const actionIcons: Record<string, string> = {
  created: '+',
  updated: '~',
  transitioned: '>',
  deleted: 'x',
  approved: 'v',
  submitted: '^',
};

const actionColors: Record<string, string> = {
  created: 'text-green-400 bg-green-900/30',
  updated: 'text-blue-400 bg-blue-900/30',
  transitioned: 'text-amber-400 bg-amber-900/30',
  deleted: 'text-red-400 bg-red-900/30',
  approved: 'text-emerald-400 bg-emerald-900/30',
  submitted: 'text-purple-400 bg-purple-900/30',
};

const entityIcons: Record<string, string> = {
  charter: 'C',
  voyage: 'V',
  vessel: 'S',
  company: 'O',
  da: '$',
  laytime: 'T',
  bol: 'B',
};

export function ActivityFeed() {
  const [filterType, setFilterType] = useState('');
  const [limit, setLimit] = useState(50);

  const { data, loading } = useQuery(ACTIVITY_LOGS, {
    variables: {
      ...(filterType ? { entityType: filterType } : {}),
      limit,
    },
    pollInterval: 15000,
  });

  const logs = data?.activityLogs ?? [];

  // Group by date
  const grouped: Record<string, typeof logs> = {};
  for (const log of logs) {
    const date = new Date(log.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Activity Feed</h1>
        <span className="text-maritime-500 text-xs">Auto-refreshes every 15s</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Entities</option>
          {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          {[25, 50, 100, 200].map((n) => <option key={n} value={n}>Last {n}</option>)}
        </select>
      </div>

      {/* Feed */}
      {loading ? (
        <p className="text-maritime-500 text-sm">Loading activity...</p>
      ) : logs.length === 0 ? (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-8 text-center">
          <p className="text-maritime-500 text-sm">No activity recorded yet</p>
          <p className="text-maritime-600 text-xs mt-1">Activity will appear here as operations are performed</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-maritime-400 text-xs font-medium">{date}</span>
                <div className="flex-1 border-t border-maritime-700/50" />
                <span className="text-maritime-600 text-xs">{items.length} events</span>
              </div>
              <div className="space-y-1">
                {items.map((log: Record<string, unknown>) => {
                  const details = log.details ? (() => { try { return JSON.parse(log.details as string); } catch { return null; } })() : null;
                  return (
                    <div key={log.id as string} className="bg-maritime-800 border border-maritime-700/50 rounded px-4 py-3 flex items-start gap-3 hover:bg-maritime-700/30 transition-colors">
                      {/* Entity badge */}
                      <div className="w-8 h-8 rounded bg-maritime-700 flex items-center justify-center text-xs font-bold text-maritime-300 flex-shrink-0">
                        {entityIcons[log.entityType as string] ?? '?'}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${actionColors[log.action as string] ?? 'text-gray-400 bg-gray-800'}`}>
                            {actionIcons[log.action as string] ?? '?'} {log.action as string}
                          </span>
                          <span className="text-maritime-400 text-xs">{log.entityType as string}</span>
                          <span className="text-maritime-600 text-xs font-mono">{(log.entityId as string).slice(0, 8)}...</span>
                        </div>
                        {details && (
                          <p className="text-maritime-400 text-xs mt-1 truncate">
                            {typeof details === 'object' ? JSON.stringify(details).slice(0, 120) : String(details).slice(0, 120)}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {log.userName && <span className="text-maritime-500 text-xs">{log.userName as string}</span>}
                          <span className="text-maritime-600 text-[10px]">
                            {new Date(log.createdAt as string).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {logs.length >= limit && (
        <div className="text-center">
          <button onClick={() => setLimit(limit + 50)} className="text-blue-400 hover:text-blue-300 text-sm">
            Load more...
          </button>
        </div>
      )}
    </div>
  );
}
