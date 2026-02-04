// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 ANKR INTELLIGENCE DASHBOARD
// World-Class Dashboard using @ankr/shell UI Patterns
// ═══════════════════════════════════════════════════════════════════════════════
// 🙏 jai guru ji | blessing always
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface LLMProvider {
  id: string;
  name: string;
  available: boolean;
  cost: number;
  priority: number;
}

interface TableStats {
  count: number;
  embedded: number;
  error?: boolean;
}

interface DatabaseStats {
  learning_events?: TableStats;
  learning_patterns?: TableStats;
  sim_scenarios?: TableStats;
  sim_personas?: TableStats;
  recent_learning?: Array<{ event_type: string; count: string }>;
}

interface EmbeddingStats {
  total: number;
  cached: number;
  cost: number;
}

interface DashboardData {
  database: DatabaseStats;
  embeddings: EmbeddingStats;
  providers: LLMProvider[];
  lastUpdate: string;
}

interface EmbedResult {
  provider: string;
  dimensions: number;
  cost: number;
  sample: number[];
}

interface LearnResult {
  success: boolean;
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// @ankr/shell THEME CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const THEME = {
  primary: '#00ff88',
  secondary: '#00d4ff',
  warning: '#ffaa00',
  danger: '#ff4444',
  success: '#00ff88',
  bg: '#0a0a0f',
  bgPanel: 'rgba(18,18,26,0.95)',
  borderGlow: 'rgba(0,255,136,0.2)',
};

// ═══════════════════════════════════════════════════════════════════════════════
// @ankr/shell REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// HUD Corner Decorations
const HudCorners: React.FC = () => (
  <>
    <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-emerald-500/50" />
    <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-emerald-500/50" />
    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-emerald-500/50" />
    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-emerald-500/50" />
  </>
);

// Panel Component
interface PanelProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

const Panel: React.FC<PanelProps> = ({ title, icon, children, className = '', glowColor = THEME.primary }) => (
  <div 
    className={`relative rounded-lg overflow-hidden ${className}`}
    style={{
      background: 'linear-gradient(180deg, rgba(18,18,26,0.95) 0%, rgba(10,10,15,0.98) 100%)',
      border: `1px solid ${THEME.borderGlow}`,
    }}
  >
    {/* Top glow line */}
    <div 
      className="absolute top-0 left-0 right-0 h-0.5 opacity-50"
      style={{ background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)` }}
    />
    
    <HudCorners />
    
    {title && (
      <div 
        className="px-4 py-3 border-b flex items-center gap-2"
        style={{ 
          background: 'rgba(0,255,136,0.05)',
          borderColor: 'rgba(0,255,136,0.1)',
        }}
      >
        {icon && <span className="text-emerald-400">{icon}</span>}
        <span 
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: THEME.primary, fontFamily: "'Orbitron', sans-serif" }}
        >
          {title}
        </span>
      </div>
    )}
    
    <div className="p-4">
      {children}
    </div>
  </div>
);

// Status Badge
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'error';
  label?: string;
  pulse?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, pulse = false }) => {
  const colors = {
    online: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/50' },
    offline: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
    warning: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
    error: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  };
  
  const c = colors[status];
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-emerald-400' : status === 'offline' ? 'bg-red-400' : 'bg-yellow-400'} ${pulse ? 'animate-pulse' : ''}`} />
      {label || status.toUpperCase()}
    </span>
  );
};

// Stat Card
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subValue, color = THEME.primary, trend }) => (
  <div 
    className="p-4 rounded-lg border transition-all hover:scale-[1.02]"
    style={{ 
      background: 'rgba(18,18,26,0.8)',
      borderColor: 'rgba(0,255,136,0.15)',
    }}
  >
    <div className="flex items-start justify-between mb-2">
      <span style={{ color }} className="text-2xl">{icon}</span>
      {trend && (
        <span className={trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      )}
    </div>
    <div 
      className="text-2xl font-bold mb-1"
      style={{ color, fontFamily: "'Orbitron', sans-serif" }}
    >
      {value}
    </div>
    <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
    {subValue && <div className="text-xs text-gray-600 mt-1">{subValue}</div>}
  </div>
);

// Tier Badge
interface TierBadgeProps {
  tier: 'FREE' | 'BUDGET' | 'STANDARD' | 'PREMIUM';
}

const TierBadge: React.FC<TierBadgeProps> = ({ tier }) => {
  const colors = {
    FREE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    BUDGET: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    STANDARD: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    PREMIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${colors[tier]}`}>
      {tier}
    </span>
  );
};

// Progress Gauge (Circular)
interface GaugeProps {
  value: number;
  max: number;
  label: string;
  color?: string;
  size?: number;
}

const Gauge: React.FC<GaugeProps> = ({ value, max, label, color = THEME.primary, size = 80 }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(30,30,40,0.8)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="text-center -mt-12">
        <div className="text-lg font-bold" style={{ color, fontFamily: "'Orbitron', sans-serif" }}>
          {value}
        </div>
        <div className="text-[10px] text-gray-500 uppercase">{label}</div>
      </div>
    </div>
  );
};

// Cockpit Button
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const CockpitButton: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
}) => {
  const variants = {
    primary: {
      bg: 'linear-gradient(180deg, rgba(0,255,136,0.2) 0%, rgba(0,255,136,0.1) 100%)',
      border: THEME.primary,
      text: THEME.primary,
      hover: THEME.primary,
    },
    secondary: {
      bg: 'linear-gradient(180deg, rgba(0,212,255,0.2) 0%, rgba(0,212,255,0.1) 100%)',
      border: THEME.secondary,
      text: THEME.secondary,
      hover: THEME.secondary,
    },
    danger: {
      bg: 'linear-gradient(180deg, rgba(255,68,68,0.2) 0%, rgba(255,68,68,0.1) 100%)',
      border: THEME.danger,
      text: THEME.danger,
      hover: THEME.danger,
    },
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const v = variants[variant];
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        rounded font-semibold uppercase tracking-wider transition-all
        hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
        ${sizes[size]} ${className}
      `}
      style={{
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.text,
        fontFamily: "'Orbitron', sans-serif",
      }}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </span>
      ) : children}
    </button>
  );
};

// Scanline Effect
const Scanline: React.FC = () => (
  <div 
    className="fixed top-0 left-0 right-0 h-0.5 pointer-events-none z-50 opacity-30"
    style={{
      background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.3), transparent)',
      animation: 'scanline 4s linear infinite',
    }}
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const ANKRIntelligenceDashboard: React.FC = () => {
  // State
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'llm' | 'learning' | 'test'>('overview');
  
  // Test state
  const [testText, setTestText] = useState('मुझे दिल्ली से मुंबई के लिए ट्रक चाहिए');
  const [embedResult, setEmbedResult] = useState<EmbedResult | null>(null);
  const [learnResult, setLearnResult] = useState<LearnResult | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const API_URL = 'http://localhost:4020';

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as DashboardData;
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);

  // Test embedding
  const handleTestEmbed = async () => {
    setTestLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText }),
      });
      const json = await res.json() as EmbedResult;
      setEmbedResult(json);
    } catch (e) {
      console.error('Embed error:', e);
    } finally {
      setTestLoading(false);
    }
  };

  // Test learning
  const handleTestLearn = async () => {
    setTestLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/learn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'interaction',
          source: 'dashboard-test',
          content: testText,
          metadata: { intent: 'test', language: 'hi-en' },
          immediate: true,
        }),
      });
      const json = await res.json() as LearnResult;
      setLearnResult(json);
      // Refresh stats
      setTimeout(fetchData, 1000);
    } catch (e) {
      console.error('Learn error:', e);
    } finally {
      setTestLoading(false);
    }
  };

  // Calculate stats
  const totalEmbedded = data ? 
    (data.database.learning_events?.embedded || 0) + 
    (data.database.learning_patterns?.embedded || 0) : 0;
  
  const totalRecords = data ?
    (data.database.learning_events?.count || 0) +
    (data.database.learning_patterns?.count || 0) +
    (data.database.sim_scenarios?.count || 0) +
    (data.database.sim_personas?.count || 0) : 0;

  const onlineProviders = data?.providers.filter(p => p.available).length || 0;

  return (
    <div 
      className="min-h-screen p-4 md:p-6"
      style={{
        background: `
          linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px),
          radial-gradient(ellipse at center, #0a0a0f 0%, #050508 100%)
        `,
        backgroundSize: '50px 50px, 50px 50px, 100% 100%',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <Scanline />
      
      {/* Add Orbitron font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes scanline { 0% { top: 0; } 100% { top: 100%; } }
      `}</style>
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="text-5xl animate-pulse"
              style={{ 
                color: THEME.primary,
                textShadow: `0 0 20px ${THEME.primary}`,
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              Ω
            </div>
            <div>
              <h1 
                className="text-xl md:text-2xl font-bold tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif", color: '#fff' }}
              >
                ANKR INTELLIGENCE
              </h1>
              <p className="text-xs text-gray-500 tracking-widest">
                LIVE LEARNING • EMBEDDINGS • pgvector
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <StatusBadge 
              status={error ? 'error' : data ? 'online' : 'warning'} 
              label={error ? 'ERROR' : data ? 'CONNECTED' : 'CONNECTING'}
              pulse={!error && !!data}
            />
            
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-emerald-500/50 bg-transparent text-emerald-500 focus:ring-emerald-500/50"
              />
              Auto-refresh
            </label>
            
            <CockpitButton onClick={fetchData} size="sm" loading={loading}>
              ↻ Refresh
            </CockpitButton>
          </div>
        </div>
        
        {/* Last update */}
        {data?.lastUpdate && (
          <div className="mt-2 text-[10px] text-gray-600">
            Last update: {new Date(data.lastUpdate).toLocaleString()}
          </div>
        )}
      </header>

      {/* Error State */}
      {error && (
        <Panel className="mb-6" glowColor={THEME.danger}>
          <div className="flex items-center gap-3 text-red-400">
            <span className="text-2xl">⚠</span>
            <div>
              <div className="font-semibold">Connection Error</div>
              <div className="text-sm text-gray-400">{error}</div>
              <div className="text-xs text-gray-500 mt-1">
                Make sure the Intelligence Stack is running on port 4020
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TABS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['overview', 'llm', 'learning', 'test'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 rounded text-xs uppercase tracking-wider transition-all
              ${activeTab === tab 
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20' 
                : 'bg-transparent border-gray-700 text-gray-400 hover:border-emerald-500/50 hover:text-emerald-400'
              }
            `}
            style={{ 
              border: `1px solid ${activeTab === tab ? THEME.primary : 'rgba(100,100,100,0.3)'}`,
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            {tab === 'overview' && '📊 '}
            {tab === 'llm' && '🤖 '}
            {tab === 'learning' && '🧠 '}
            {tab === 'test' && '🧪 '}
            {tab}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: OVERVIEW */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && data && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon="🧠"
              label="Embeddings"
              value={data.embeddings.total}
              subValue={`${totalEmbedded} stored`}
              color={THEME.primary}
              trend="up"
            />
            <StatCard
              icon="📚"
              label="Learning Events"
              value={data.database.learning_events?.count || 0}
              subValue={`${data.database.learning_events?.embedded || 0} embedded`}
              color={THEME.secondary}
              trend="up"
            />
            <StatCard
              icon="🤖"
              label="LLM Providers"
              value={`${onlineProviders}/${data.providers.length}`}
              subValue="FREE tier active"
              color="#a855f7"
            />
            <StatCard
              icon="💰"
              label="Total Cost"
              value={`$${data.embeddings.cost.toFixed(4)}`}
              subValue="FREE embeddings!"
              color={THEME.warning}
            />
          </div>

          {/* Main Panels */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Providers Panel */}
            <Panel title="Embedding Providers" icon="🔌">
              <div className="space-y-3">
                {data.providers.map((p, i) => (
                  <div 
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ 
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(0,255,136,0.1)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                      <div>
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-gray-500">Priority: {p.priority}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TierBadge tier="FREE" />
                      <StatusBadge status={p.available ? 'online' : 'offline'} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Database Tables */}
            <Panel title="Database Tables" icon="🗄️">
              <div className="space-y-3">
                {Object.entries(data.database)
                  .filter(([key]) => !key.includes('recent'))
                  .map(([name, stats]) => {
                    const s = stats as TableStats;
                    return (
                      <div 
                        key={name}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ 
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(0,255,136,0.1)',
                        }}
                      >
                        <div>
                          <div className="font-medium text-sm text-gray-300">{name}</div>
                          <div className="text-xs text-gray-500">
                            {s.embedded > 0 && `${s.embedded} embedded`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span 
                            className="text-xl font-bold"
                            style={{ color: THEME.primary, fontFamily: "'Orbitron', sans-serif" }}
                          >
                            {s.count}
                          </span>
                          <StatusBadge status={s.error ? 'error' : 'online'} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Panel>
          </div>

          {/* Gauges */}
          <Panel title="System Health" icon="📈">
            <div className="flex justify-around flex-wrap gap-6 py-4">
              <Gauge value={onlineProviders} max={3} label="Providers" color={THEME.primary} />
              <Gauge value={totalEmbedded} max={Math.max(100, totalEmbedded)} label="Embedded" color={THEME.secondary} />
              <Gauge value={totalRecords} max={Math.max(100, totalRecords)} label="Records" color="#a855f7" />
              <Gauge value={100} max={100} label="Uptime %" color={THEME.warning} />
            </div>
          </Panel>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: LLM PROVIDERS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'llm' && data && (
        <Panel title="LLM Embedding Providers" icon="🤖">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Provider</th>
                  <th className="pb-3 pr-4">Tier</th>
                  <th className="pb-3 pr-4">Cost/1K</th>
                  <th className="pb-3 pr-4">Priority</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.providers.map((p, i) => (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-white/5">
                    <td className="py-3 pr-4 font-bold" style={{ color: THEME.primary }}>
                      {i + 1}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.id}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <TierBadge tier="FREE" />
                    </td>
                    <td className="py-3 pr-4 text-emerald-400">
                      ${p.cost.toFixed(4)}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs">
                        P{p.priority}
                      </span>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={p.available ? 'online' : 'offline'} pulse />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
              <span>💡</span> Fallback Chain
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {data.providers.filter(p => p.available).map((p, i) => (
                <React.Fragment key={p.id}>
                  <span className="px-3 py-1 rounded bg-gray-800 text-sm">{p.name.split(' ')[0]}</span>
                  {i < data.providers.filter(p => p.available).length - 1 && (
                    <span className="text-emerald-400">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: LEARNING */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'learning' && data && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <StatCard
              icon="📝"
              label="Total Events"
              value={data.database.learning_events?.count || 0}
              color={THEME.primary}
            />
            <StatCard
              icon="🔮"
              label="Embedded"
              value={data.database.learning_events?.embedded || 0}
              color={THEME.secondary}
            />
            <StatCard
              icon="🎯"
              label="Patterns"
              value={data.database.learning_patterns?.count || 0}
              color="#a855f7"
            />
          </div>

          <Panel title="Recent Learning Activity" icon="📊">
            {data.database.recent_learning && data.database.recent_learning.length > 0 ? (
              <div className="space-y-2">
                {data.database.recent_learning.map((item, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-3 rounded bg-gray-800/50"
                  >
                    <span className="text-sm">{item.event_type}</span>
                    <span className="font-bold" style={{ color: THEME.primary }}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🧠</div>
                <div>No learning events in last 24 hours</div>
                <div className="text-sm mt-1">Use the Test tab to create some!</div>
              </div>
            )}
          </Panel>

          <Panel title="Scenarios & Personas" icon="🎭">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                <div className="text-2xl mb-2">📋</div>
                <div className="text-2xl font-bold" style={{ color: THEME.secondary }}>
                  {data.database.sim_scenarios?.count || 0}
                </div>
                <div className="text-xs text-gray-500 uppercase">Scenarios</div>
              </div>
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <div className="text-2xl mb-2">👤</div>
                <div className="text-2xl font-bold text-purple-400">
                  {data.database.sim_personas?.count || 0}
                </div>
                <div className="text-xs text-gray-500 uppercase">Personas</div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: TEST */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'test' && (
        <div className="space-y-6">
          <Panel title="Live Embedding Test" icon="🧪">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                  Test Text (Hindi/English/Hinglish)
                </label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full p-3 rounded-lg bg-black/50 border border-emerald-500/30 text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  rows={3}
                  placeholder="Enter text to embed..."
                />
              </div>
              
              <div className="flex gap-3">
                <CockpitButton onClick={handleTestEmbed} loading={testLoading}>
                  🔮 Generate Embedding
                </CockpitButton>
                <CockpitButton onClick={handleTestLearn} variant="secondary" loading={testLoading}>
                  🧠 Log & Learn
                </CockpitButton>
              </div>

              {embedResult && (
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-3">
                    ✅ Embedding Generated!
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs uppercase">Provider</div>
                      <div className="font-medium">{embedResult.provider}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs uppercase">Dimensions</div>
                      <div className="font-medium" style={{ color: THEME.primary }}>{embedResult.dimensions}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs uppercase">Cost</div>
                      <div className="font-medium text-emerald-400">${embedResult.cost.toFixed(6)}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-gray-500 text-xs uppercase mb-1">Sample Vector (first 5)</div>
                    <code className="text-xs text-gray-400 break-all">
                      [{embedResult.sample.map(n => n.toFixed(4)).join(', ')}...]
                    </code>
                  </div>
                </div>
              )}

              {learnResult && (
                <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                    ✅ {learnResult.message}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Quick Test Phrases" icon="💬">
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Mera order kab aayega?',
                'Rate batao Delhi se Chennai',
                'Driver ka number chahiye',
                'Invoice download karna hai',
                'Truck book karna hai urgent',
                'POD share karo please',
              ].map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => setTestText(phrase)}
                  className="p-3 text-left rounded-lg bg-gray-800/50 border border-gray-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-sm"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <footer className="mt-8 pt-4 border-t border-gray-800 text-center">
        <div className="text-xs text-gray-600">
          🙏 Jai Guru Ji • ANKR Intelligence Stack v2.0 • PostgreSQL + pgvector + TimescaleDB
        </div>
      </footer>
    </div>
  );
};

export default ANKRIntelligenceDashboard;
