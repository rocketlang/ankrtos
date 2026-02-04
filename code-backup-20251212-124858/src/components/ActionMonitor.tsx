/**
 * ankr Action Monitor - Real-time AI action tracking
 * Pulls from Zustand store for live updates
 */
import { useTheme } from '../contexts/ThemeContext';
import { useAIStore } from '../stores/useAIStore';

export function ActionMonitor() {
  const { theme } = useTheme();
  const { actions, stats } = useAIStore();
  
  const bg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const muted = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  const statusConfig: Record<string, { icon: string; bg: string }> = {
    pending: { icon: '🟡', bg: 'bg-yellow-500/20' },
    executing: { icon: '🔵', bg: 'bg-blue-500/20' },
    success: { icon: '🟢', bg: 'bg-green-500/20' },
    failed: { icon: '🔴', bg: 'bg-red-500/20' },
  };

  const actionIcons: Record<string, string> = {
    create_order: '📦', book_truck: '🚛', track_vehicle: '📍',
    assign_driver: '👤', send_invoice: '💰', create_widget: '🧩', default: '⚡'
  };

  return (
    <div className={`${bg} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold ${text}`}>🎯 Action Monitor</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${actions.some(a => a.status === 'executing') ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
          {actions.filter(a => a.status === 'executing').length > 0 ? 'Active' : 'Idle'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div><div className={`text-lg font-bold ${text}`}>{stats.totalActions}</div><div className={`text-xs ${muted}`}>Total</div></div>
        <div><div className="text-lg font-bold text-green-400">{Math.round(stats.successRate)}%</div><div className={`text-xs ${muted}`}>Success</div></div>
        <div><div className={`text-lg font-bold ${text}`}>{Math.round(stats.avgDuration)}ms</div><div className={`text-xs ${muted}`}>Avg</div></div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {actions.slice(0, 10).map((action) => {
          const cfg = statusConfig[action.status] || statusConfig.pending;
          const icon = actionIcons[action.action] || actionIcons.default;
          return (
            <div key={action.id} className={`flex items-center justify-between p-2 rounded-lg ${cfg.bg} ${action.status === 'executing' ? 'animate-pulse' : ''}`}>
              <div className="flex items-center gap-2">
                <span>{icon}</span>
                <span className={`text-sm ${text}`}>{action.action.replace(/_/g, ' ')}</span>
                {action.loggedToSim && <span className="text-xs text-green-400">📚</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${muted}`}>{action.duration ? `${action.duration}ms` : '...'}</span>
                <span>{cfg.icon}</span>
              </div>
            </div>
          );
        })}
        {actions.length === 0 && <div className={`text-center py-4 ${muted}`}>No actions yet. Use AI Command Bar!</div>}
      </div>
    </div>
  );
}

export default ActionMonitor;
