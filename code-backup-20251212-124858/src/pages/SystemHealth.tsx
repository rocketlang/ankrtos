/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * WowTruck 2.0 - System Health Page (DevBrain Integration)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Full-page DevBrain integration showing:
 * - PM2 Services status
 * - Docker containers health
 * - Real-time error monitoring
 * - Auto-healing actions
 * - LLM analysis toggle
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Activity, Server, Database, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Trash2, Play, Square, Cpu, HardDrive, Wifi, WifiOff,
  Brain, Zap, Clock, TrendingUp, Settings, RotateCcw, Sparkles,
  ChevronDown, ChevronRight, Eye, Terminal, Bot
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface PMService {
  name: string;
  status: string;
  pid: number | null;
  memory: number;
  cpu: number;
  restarts: number;
  uptime: number;
}

interface ServiceError {
  service: string;
  message: string;
  timestamp: string;
  count: number;
  lastSeen: string;
  healed: boolean;
}

interface HealingAction {
  id: string;
  timestamp: string;
  service: string;
  error: string;
  pattern: string;
  action: string;
  command: string;
  result: 'success' | 'failed' | 'pending' | 'skipped' | 'llm_suggested';
  output?: string;
  confidence: number;
  autoExecuted: boolean;
  llmAnalysis?: string;
  learnedPattern?: boolean;
}

interface DevBrainStatus {
  services: PMService[];
  autoHealEnabled: boolean;
  llmHealEnabled: boolean;
  llmConnected: boolean;
  learnedPatterns: number;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEVBRAIN API
// ═══════════════════════════════════════════════════════════════════════════════

const DEVBRAIN_URL = 'http://localhost:4600';

const devbrainApi = {
  getStatus: async (): Promise<DevBrainStatus> => {
    const res = await fetch(`${DEVBRAIN_URL}/api/status`);
    return res.json();
  },
  getErrors: async (): Promise<ServiceError[]> => {
    const res = await fetch(`${DEVBRAIN_URL}/api/errors`);
    return res.json();
  },
  getActions: async (): Promise<HealingAction[]> => {
    const res = await fetch(`${DEVBRAIN_URL}/api/actions`);
    return res.json();
  },
  toggleAutoHeal: async (enabled: boolean): Promise<void> => {
    await fetch(`${DEVBRAIN_URL}/api/autoheal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
  },
  toggleLLMHeal: async (enabled: boolean): Promise<void> => {
    await fetch(`${DEVBRAIN_URL}/api/llmheal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
  },
  restartService: async (name: string): Promise<void> => {
    await fetch(`${DEVBRAIN_URL}/api/restart/${name}`, { method: 'POST' });
  },
  flushLogs: async (): Promise<void> => {
    await fetch(`${DEVBRAIN_URL}/api/flush`, { method: 'POST' });
  },
  clearErrors: async (): Promise<void> => {
    await fetch(`${DEVBRAIN_URL}/api/clear`, { method: 'POST' });
  },
  executeCommand: async (command: string, actionId?: string): Promise<{ success: boolean; output: string }> => {
    const res = await fetch(`${DEVBRAIN_URL}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, actionId })
    });
    return res.json();
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function formatUptime(ms: number): string {
  if (!ms) return '-';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'online': return 'text-green-400';
    case 'stopped': return 'text-red-400';
    case 'errored': return 'text-red-500';
    default: return 'text-yellow-400';
  }
}

function getResultColor(result: string): string {
  switch (result) {
    case 'success': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'llm_suggested': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SystemHealth() {
  const { theme } = useTheme();
  const isDark = theme !== 'light';

  const [status, setStatus] = useState<DevBrainStatus | null>(null);
  const [errors, setErrors] = useState<ServiceError[]>([]);
  const [actions, setActions] = useState<HealingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['services', 'errors', 'actions']);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [statusData, errorsData, actionsData] = await Promise.all([
        devbrainApi.getStatus(),
        devbrainApi.getErrors(),
        devbrainApi.getActions()
      ]);
      setStatus(statusData);
      setErrors(errorsData);
      setActions(actionsData);
      setConnected(true);
    } catch (e) {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  // Handlers
  const handleToggleAutoHeal = async () => {
    if (!status) return;
    await devbrainApi.toggleAutoHeal(!status.autoHealEnabled);
    fetchData();
  };

  const handleToggleLLMHeal = async () => {
    if (!status) return;
    await devbrainApi.toggleLLMHeal(!status.llmHealEnabled);
    fetchData();
  };

  const handleRestart = async (name: string) => {
    await devbrainApi.restartService(name);
    setTimeout(fetchData, 2000);
  };

  const handleRestartAll = async () => {
    if (!confirm('Restart all services?')) return;
    await devbrainApi.restartService('all');
    setTimeout(fetchData, 3000);
  };

  const handleFlush = async () => {
    await devbrainApi.flushLogs();
    fetchData();
  };

  const handleClearErrors = async () => {
    await devbrainApi.clearErrors();
    fetchData();
  };

  const handleExecute = async (command: string, actionId: string) => {
    const result = await devbrainApi.executeCommand(command, actionId);
    alert(result.success ? '✅ Command executed' : `❌ Failed: ${result.output}`);
    fetchData();
  };

  // Stats
  const onlineCount = status?.services.filter(s => s.status === 'online').length || 0;
  const totalServices = status?.services.length || 0;
  const healedCount = actions.filter(a => a.result === 'success').length;

  // Theme colors
  const cardBg = isDark ? 'bg-slate-800/50' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-gray-500';
  const sectionBg = isDark ? 'bg-slate-900/50' : 'bg-gray-50';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className={`${cardBg} border ${cardBorder} rounded-xl p-8 text-center`}>
        <WifiOff className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2 className={`text-xl font-bold ${textPrimary} mb-2`}>DevBrain Not Connected</h2>
        <p className={textSecondary}>
          DevBrain server is not running at {DEVBRAIN_URL}
        </p>
        <p className={`${textSecondary} mt-2`}>
          Run: <code className="bg-slate-700 px-2 py-1 rounded">ankr</code> to start services
        </p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary} flex items-center gap-2`}>
            <Brain className="w-7 h-7 text-purple-500" />
            System Health
            <span className={`text-sm font-normal ${textSecondary}`}>DevBrain v2.1</span>
          </h1>
          <p className={textSecondary}>AI-Powered Auto-Healing Monitor</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleToggleAutoHeal}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              status?.autoHealEnabled
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            Auto-Heal: {status?.autoHealEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleToggleLLMHeal}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              status?.llmHealEnabled
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            <Bot className="w-4 h-4" />
            LLM: {status?.llmHealEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleFlush}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Flush Logs
          </button>
          <button
            onClick={handleRestartAll}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restart All
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`${cardBg} border ${cardBorder} rounded-xl p-4`}>
          <div className="flex items-center justify-between">
            <Server className="w-5 h-5 text-blue-400" />
            <span className={`text-2xl font-bold ${textPrimary}`}>{onlineCount}/{totalServices}</span>
          </div>
          <p className={`text-sm ${textSecondary} mt-1`}>Services Online</p>
        </div>
        <div className={`${cardBg} border ${cardBorder} rounded-xl p-4`}>
          <div className="flex items-center justify-between">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className={`text-2xl font-bold ${errors.length > 0 ? 'text-red-400' : textPrimary}`}>
              {errors.length}
            </span>
          </div>
          <p className={`text-sm ${textSecondary} mt-1`}>Active Errors</p>
        </div>
        <div className={`${cardBg} border ${cardBorder} rounded-xl p-4`}>
          <div className="flex items-center justify-between">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className={`text-2xl font-bold text-green-400`}>{healedCount}</span>
          </div>
          <p className={`text-sm ${textSecondary} mt-1`}>Auto-Healed</p>
        </div>
        <div className={`${cardBg} border ${cardBorder} rounded-xl p-4`}>
          <div className="flex items-center justify-between">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className={`text-2xl font-bold ${status?.llmConnected ? 'text-purple-400' : textSecondary}`}>
              {status?.learnedPatterns || 0}
            </span>
          </div>
          <p className={`text-sm ${textSecondary} mt-1`}>Learned Fixes</p>
        </div>
      </div>

      {/* Services Section */}
      <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
        <button
          onClick={() => toggleSection('services')}
          className={`w-full flex items-center justify-between p-4 ${sectionBg} hover:bg-slate-800/70 transition`}
        >
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            <span className={`font-semibold ${textPrimary}`}>PM2 Services</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              onlineCount === totalServices ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {onlineCount}/{totalServices} online
            </span>
          </div>
          {expandedSections.includes('services') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {expandedSections.includes('services') && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {status?.services.map(svc => (
              <div
                key={svc.name}
                className={`${sectionBg} border ${cardBorder} rounded-lg p-3 ${
                  svc.status === 'online' ? 'ring-1 ring-green-500/30' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className={`font-semibold ${textPrimary}`}>{svc.name}</h3>
                    <span className={`text-xs flex items-center gap-1 ${getStatusColor(svc.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {svc.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRestart(svc.name)}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                    title="Restart"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className={`grid grid-cols-3 gap-2 text-xs ${textSecondary}`}>
                  <div>PID: {svc.pid || '-'}</div>
                  <div>CPU: {svc.cpu}%</div>
                  <div>RAM: {svc.memory}MB</div>
                  <div>↻ {svc.restarts}</div>
                  <div className="col-span-2">Up: {formatUptime(svc.uptime)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Errors Section */}
      <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
        <button
          onClick={() => toggleSection('errors')}
          className={`w-full flex items-center justify-between p-4 ${sectionBg} hover:bg-slate-800/70 transition`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className={`font-semibold ${textPrimary}`}>Recent Errors</span>
            {errors.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                {errors.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {errors.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleClearErrors(); }}
                className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded"
              >
                Clear
              </button>
            )}
            {expandedSections.includes('errors') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </button>
        {expandedSections.includes('errors') && (
          <div className="p-4 max-h-64 overflow-y-auto space-y-2">
            {errors.length === 0 ? (
              <div className={`text-center py-8 ${textSecondary}`}>
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                <p>No errors - system healthy</p>
              </div>
            ) : (
              errors.map((err, i) => (
                <div
                  key={i}
                  className="border-l-3 border-red-500 bg-red-500/10 rounded-r-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-orange-400 font-medium text-sm">{err.service}</span>
                    <span className={`text-xs ${textSecondary}`}>
                      {formatTime(err.lastSeen)} ({err.count}x)
                    </span>
                  </div>
                  <p className={`text-xs ${textSecondary} break-all`}>{err.message.slice(0, 200)}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Healing Actions Section */}
      <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
        <button
          onClick={() => toggleSection('actions')}
          className={`w-full flex items-center justify-between p-4 ${sectionBg} hover:bg-slate-800/70 transition`}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className={`font-semibold ${textPrimary}`}>Healing Actions</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
              {actions.length}
            </span>
          </div>
          {expandedSections.includes('actions') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {expandedSections.includes('actions') && (
          <div className="p-4 max-h-80 overflow-y-auto space-y-2">
            {actions.length === 0 ? (
              <div className={`text-center py-8 ${textSecondary}`}>
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No healing actions yet</p>
              </div>
            ) : (
              actions.slice(0, 20).map((action) => (
                <div
                  key={action.id}
                  className={`border rounded-lg p-3 ${getResultColor(action.result)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{action.service}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getResultColor(action.result)}`}>
                        {action.result}
                        {action.autoExecuted && ' 🤖'}
                        {action.learnedPattern && ' 📚'}
                      </span>
                    </div>
                  </div>
                  <p className={`text-xs ${textSecondary} mb-1`}>
                    {action.action} ({(action.confidence * 100).toFixed(0)}% confidence)
                  </p>
                  {action.command && (
                    <code className={`text-xs block ${textSecondary} bg-black/20 p-1 rounded truncate`}>
                      {action.command}
                    </code>
                  )}
                  {action.llmAnalysis && (
                    <p className="text-xs text-purple-300 mt-1 flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      {action.llmAnalysis}
                    </p>
                  )}
                  {action.result === 'llm_suggested' && action.command && (
                    <button
                      onClick={() => handleExecute(action.command, action.id)}
                      className="mt-2 text-xs px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded"
                    >
                      Execute Suggestion
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`text-center text-sm ${textSecondary}`}>
        🙏 Jai Guru Ji | DevBrain AI-Powered Healing | Last updated: {status?.timestamp ? formatTime(status.timestamp) : '-'}
      </div>
    </div>
  );
}
