/**
 * Timeline Statistics Component
 *
 * Displays aggregated timeline statistics with visual breakdown
 */

import { Activity, User, AlertTriangle, Info, Clock } from 'lucide-react';

interface TimelineStatsProps {
  stats: {
    totalEvents: number;
    criticalCount: number;
    importantCount: number;
    infoCount: number;
    byEventType: Record<string, number>;
    byActor: Record<string, number>;
    latestEvent?: string;
    oldestEvent?: string;
  };
}

export function TimelineStats({ stats }: TimelineStatsProps) {
  // Calculate percentages
  const criticalPercent = stats.totalEvents > 0 ? (stats.criticalCount / stats.totalEvents) * 100 : 0;
  const importantPercent = stats.totalEvents > 0 ? (stats.importantCount / stats.totalEvents) * 100 : 0;
  const infoPercent = stats.totalEvents > 0 ? (stats.infoCount / stats.totalEvents) * 100 : 0;

  // Top event types
  const topEventTypes = Object.entries(stats.byEventType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Actor breakdown
  const actorBreakdown = Object.entries(stats.byActor)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="Total Events"
          value={stats.totalEvents}
          color="gray"
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical"
          value={stats.criticalCount}
          percentage={criticalPercent}
          color="red"
        />
        <StatCard
          icon={Info}
          label="Important"
          value={stats.importantCount}
          percentage={importantPercent}
          color="orange"
        />
        <StatCard
          icon={Info}
          label="Info"
          value={stats.infoCount}
          percentage={infoPercent}
          color="blue"
        />
      </div>

      {/* Impact Distribution Bar */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Impact Distribution</div>
        <div className="flex h-4 rounded-full overflow-hidden">
          {stats.criticalCount > 0 && (
            <div
              className="bg-red-500"
              style={{ width: `${criticalPercent}%` }}
              title={`Critical: ${stats.criticalCount}`}
            ></div>
          )}
          {stats.importantCount > 0 && (
            <div
              className="bg-orange-500"
              style={{ width: `${importantPercent}%` }}
              title={`Important: ${stats.importantCount}`}
            ></div>
          )}
          {stats.infoCount > 0 && (
            <div
              className="bg-blue-500"
              style={{ width: `${infoPercent}%` }}
              title={`Info: ${stats.infoCount}`}
            ></div>
          )}
        </div>
      </div>

      {/* Top Event Types */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-3">Top Event Types</div>
        <div className="space-y-2">
          {topEventTypes.map(([type, count]) => (
            <div key={type} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{formatEventType(type)}</span>
              <span className="font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actor Breakdown */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-3">Events by Actor</div>
        <div className="space-y-2">
          {actorBreakdown.map(([actor, count]) => (
            <div key={actor} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-600">{actor}</span>
              </div>
              <span className="font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Range */}
      {stats.oldestEvent && stats.latestEvent && (
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {new Date(stats.oldestEvent).toLocaleDateString()} - {new Date(stats.latestEvent).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  percentage?: number;
  color: 'gray' | 'red' | 'orange' | 'blue';
}

function StatCard({ icon: Icon, label, value, percentage, color }: StatCardProps) {
  const colorClasses = {
    gray: 'text-gray-600 bg-gray-100',
    red: 'text-red-600 bg-red-100',
    orange: 'text-orange-600 bg-orange-100',
    blue: 'text-blue-600 bg-blue-100'
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {percentage !== undefined && (
          <div className="text-sm text-gray-500">({Math.round(percentage)}%)</div>
        )}
      </div>
    </div>
  );
}

function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}
