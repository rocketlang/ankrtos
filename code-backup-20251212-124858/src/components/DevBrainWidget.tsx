/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * WowTruck 2.0 - DevBrain Widget (Compact for Command Center)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Compact system health widget showing:
 * - Service count (online/total)
 * - Error count
 * - Auto-heal status
 * - Quick link to full page
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Server, AlertTriangle, CheckCircle, Zap,
  ChevronRight, RefreshCw, WifiOff, Bot
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface DevBrainStatus {
  services: { name: string; status: string }[];
  autoHealEnabled: boolean;
  llmHealEnabled: boolean;
  llmConnected: boolean;
  learnedPatterns: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface DevBrainWidgetProps {
  className?: string;
  compact?: boolean;
}

export default function DevBrainWidget({ className = '', compact = false }: DevBrainWidgetProps) {
  const [status, setStatus] = useState<DevBrainStatus | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [statusRes, errorsRes] = await Promise.all([
          fetch('http://localhost:4600/api/status'),
          fetch('http://localhost:4600/api/errors')
        ]);
        const statusData = await statusRes.json();
        const errorsData = await errorsRes.json();
        setStatus(statusData);
        setErrorCount(errorsData.length);
        setConnected(true);
      } catch {
        setConnected(false);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = status?.services.filter(s => s.status === 'online').length || 0;
  const totalServices = status?.services.length || 0;
  const allHealthy = onlineCount === totalServices && errorCount === 0;

  if (loading) {
    return (
      <div className={`bg-slate-800/50 border border-slate-700 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-center h-20">
          <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className={`bg-slate-800/50 border border-slate-700 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <WifiOff className="w-8 h-8 text-red-400" />
          <div>
            <h3 className="font-semibold text-white">DevBrain Offline</h3>
            <p className="text-xs text-slate-400">Run `ankr` to start</p>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <Link
        to="/system-health"
        className={`
          flex items-center gap-3 p-3 rounded-lg transition
          ${allHealthy 
            ? 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/30' 
            : 'bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30'
          }
          ${className}
        `}
      >
        <Brain className={`w-6 h-6 ${allHealthy ? 'text-green-400' : 'text-orange-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">System</span>
            {status?.autoHealEnabled && <Zap className="w-3 h-3 text-yellow-400" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{onlineCount}/{totalServices} services</span>
            {errorCount > 0 && (
              <span className="text-red-400">• {errorCount} errors</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </Link>
    );
  }

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white">System Health</span>
        </div>
        <Link
          to="/system-health"
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          Details <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {/* Services */}
        <div className="text-center">
          <div className={`text-xl font-bold ${onlineCount === totalServices ? 'text-green-400' : 'text-yellow-400'}`}>
            {onlineCount}/{totalServices}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Server className="w-3 h-3" />
            Services
          </div>
        </div>

        {/* Errors */}
        <div className="text-center">
          <div className={`text-xl font-bold ${errorCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {errorCount}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Errors
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          <div className="text-xl font-bold">
            {status?.autoHealEnabled ? (
              <Zap className="w-6 h-6 mx-auto text-yellow-400" />
            ) : (
              <span className="text-slate-400">OFF</span>
            )}
          </div>
          <div className="text-xs text-slate-400">Auto-Heal</div>
        </div>
      </div>

      {/* Status Bar */}
      <div className={`px-3 py-2 text-xs flex items-center justify-between ${
        allHealthy ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'
      }`}>
        <div className="flex items-center gap-1">
          {allHealthy ? (
            <><CheckCircle className="w-3 h-3" /> All systems operational</>
          ) : (
            <><AlertTriangle className="w-3 h-3" /> {errorCount} issue{errorCount !== 1 ? 's' : ''} detected</>
          )}
        </div>
        {status?.llmConnected && (
          <div className="flex items-center gap-1 text-purple-400">
            <Bot className="w-3 h-3" />
            LLM
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI INDICATOR (For header/toolbar)
// ═══════════════════════════════════════════════════════════════════════════════

export function DevBrainIndicator() {
  const [healthy, setHealthy] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const [statusRes, errorsRes] = await Promise.all([
          fetch('http://localhost:4600/api/status'),
          fetch('http://localhost:4600/api/errors')
        ]);
        const status = await statusRes.json();
        const errors = await errorsRes.json();
        const online = status.services?.filter((s: any) => s.status === 'online').length || 0;
        const total = status.services?.length || 0;
        setHealthy(online === total && errors.length === 0);
        setConnected(true);
      } catch {
        setConnected(false);
      }
    };

    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!connected) {
    return (
      <Link to="/system-health" title="DevBrain Offline">
        <WifiOff className="w-4 h-4 text-red-400" />
      </Link>
    );
  }

  return (
    <Link
      to="/system-health"
      title={healthy ? 'System Healthy' : 'Issues Detected'}
      className={`
        w-2 h-2 rounded-full
        ${healthy ? 'bg-green-400' : 'bg-orange-400 animate-pulse'}
      `}
    />
  );
}
