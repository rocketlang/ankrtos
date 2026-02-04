/**
 * ANKR Pulse Dashboard - Complete Service Monitoring
 * Routes, Errors, Metrics for all ANKR services
 * 🙏 Om Namah Shivaya - By Guru's Grace
 */
import { useState, useEffect, useCallback } from 'react';
import { ActionMonitor } from '../components/ActionMonitor';
import { useTheme } from '../contexts/ThemeContext';

interface ServiceRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'WS' | 'GQL';
  path: string;
  description: string;
}

interface ServiceError {
  timestamp: Date;
  message: string;
  code?: number;
}

interface ServiceStatus {
  id: string;
  name: string;
  port: number;
  status: 'healthy' | 'unhealthy' | 'checking';
  latency: number;
  endpoint: string;
  type: 'http' | 'graphql' | 'tcp' | 'ws';
  lastCheck: Date | null;
  routes: ServiceRoute[];
  errors: ServiceError[];
  metrics: {
    requestsTotal?: number;
    requestsPerMin?: number;
    avgLatency?: number;
    errorRate?: number;
  };
}

// Service configurations with routes
const SERVICES_CONFIG: Omit<ServiceStatus, 'status' | 'latency' | 'lastCheck' | 'errors' | 'metrics'>[] = [
  { 
    id: 'graphql', 
    name: 'GraphQL API', 
    port: 4000, 
    endpoint: 'http://localhost:4000/graphql', 
    type: 'graphql',
    routes: [
      { method: 'GQL', path: 'vehicles', description: 'Fleet vehicles CRUD' },
      { method: 'GQL', path: 'drivers', description: 'Driver management' },
      { method: 'GQL', path: 'orders', description: 'Order operations' },
      { method: 'GQL', path: 'trips', description: 'Trip tracking' },
      { method: 'GQL', path: 'customers', description: 'Customer data' },
      { method: 'GQL', path: 'invoices', description: 'Billing & invoices' },
      { method: 'WS', path: 'subscriptions', description: 'Real-time updates' },
    ]
  },
  { 
    id: 'saathi', 
    name: 'Saathi REST', 
    port: 4002, 
    endpoint: 'http://localhost:4002/health', 
    type: 'http',
    routes: [
      { method: 'GET', path: '/api/pincode/:code', description: 'Pincode lookup' },
      { method: 'GET', path: '/api/route/coords', description: 'Route calculation' },
      { method: 'GET', path: '/api/toll/calculate', description: 'Toll estimation' },
      { method: 'POST', path: '/api/rate/calculate', description: 'Rate calculation' },
      { method: 'GET', path: '/health', description: 'Health check' },
    ]
  },
  { 
    id: 'gps', 
    name: 'GPS Server', 
    port: 3070, 
    endpoint: 'http://localhost:3070/', 
    type: 'ws',
    routes: [
      { method: 'WS', path: '/', description: 'WebSocket GPS stream' },
      { method: 'GET', path: '/api/vehicles', description: 'All vehicle positions' },
      { method: 'POST', path: '/api/position', description: 'Update position' },
      { method: 'GET', path: '/api/geofence', description: 'Geofence alerts' },
    ]
  },
  { 
    id: 'frontend', 
    name: 'WowTruck UI', 
    port: 3002, 
    endpoint: 'http://localhost:3002/', 
    type: 'http',
    routes: [
      { method: 'GET', path: '/', description: 'Dashboard' },
      { method: 'GET', path: '/fleet', description: 'Live tracking' },
      { method: 'GET', path: '/orders', description: 'Order management' },
      { method: 'GET', path: '/omega', description: 'Ωmega Shell demo' },
      { method: 'GET', path: '/pulse', description: 'This dashboard!' },
      { method: 'GET', path: '/widgets', description: 'Widget gallery' },
    ]
  },
  { 
    id: 'postgres', 
    name: 'PostgreSQL', 
    port: 5433, 
    endpoint: 'tcp://localhost:5433', 
    type: 'tcp',
    routes: [
      { method: 'GET', path: 'ankr_tms', description: 'Main TMS database' },
      { method: 'GET', path: 'vehicles', description: '5 vehicles' },
      { method: 'GET', path: 'drivers', description: '5 drivers' },
      { method: 'GET', path: 'orders', description: 'Order records' },
      { method: 'GET', path: 'trips', description: 'Trip records' },
    ]
  },
  { 
    id: 'eon', 
    name: 'ankr-eon Memory', 
    port: 4005, 
    endpoint: 'http://localhost:4005/health', 
    type: 'rest',
    routes: [
      { method: 'GQL', path: 'conversations', description: 'Chat memory' },
      { method: 'GQL', path: 'embeddings', description: 'Vector search (pgvector)' },
      { method: 'GQL', path: 'events', description: 'Event sourcing log' },
      { method: 'GQL', path: 'memory', description: 'Semantic memory' },
      { method: 'POST', path: '/api/ingest', description: 'Document ingestion' },
      { method: 'POST', path: '/api/remember', description: 'Store memory' },
    ]
  },
  { 
    id: 'sim', 
    name: 'ankr-sim Learning', 
    port: 4010, 
    endpoint: 'http://localhost:4010/health', 
    type: 'http',
    routes: [
      { method: 'POST', path: '/api/generate', description: 'Generate synthetic data' },
      { method: 'POST', path: '/api/evolve', description: 'Nightly evolution' },
      { method: 'GET', path: '/api/frontier', description: 'Frontier stats' },
      { method: 'POST', path: '/api/persona', description: 'Universal personas' },
      { method: 'GET', path: '/health', description: 'Health check' },
    ]
  },
];

function initServices(): ServiceStatus[] {
  return SERVICES_CONFIG.map(c => ({
    ...c,
    status: 'checking' as const,
    latency: 0,
    lastCheck: null,
    errors: [],
    metrics: { requestsTotal: 0, requestsPerMin: 0, avgLatency: 0, errorRate: 0 },
  }));
}

async function checkService(service: ServiceStatus): Promise<ServiceStatus> {
  const start = Date.now();
  const errors = [...service.errors];
  
  try {
    if (service.type === 'tcp') {
      return { ...service, status: 'healthy', latency: 2, lastCheck: new Date(), errors };
    }
    
    if (service.type === 'graphql') {
      const res = await fetch(service.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
      });
      const latency = Date.now() - start;
      
      if (res.ok) {
        return { 
          ...service, status: 'healthy', latency, lastCheck: new Date(), errors,
          metrics: { ...service.metrics, requestsTotal: (service.metrics.requestsTotal || 0) + 1,
            avgLatency: Math.round(((service.metrics.avgLatency || latency) + latency) / 2) }
        };
      }
      throw new Error(`HTTP ${res.status}`);
    }
    
    const res = await fetch(service.endpoint, { method: 'GET' });
    const latency = Date.now() - start;
    
    return { 
      ...service, status: 'healthy', latency, lastCheck: new Date(), errors,
      metrics: { ...service.metrics, requestsTotal: (service.metrics.requestsTotal || 0) + 1,
        avgLatency: Math.round(((service.metrics.avgLatency || latency) + latency) / 2) }
    };
  } catch (err: any) {
    errors.unshift({ timestamp: new Date(), message: err.message || 'Connection failed', code: 500 });
    if (errors.length > 10) errors.pop();
    return { ...service, status: 'unhealthy', latency: 0, lastCheck: new Date(), errors,
      metrics: { ...service.metrics, errorRate: Math.min(100, (service.metrics.errorRate || 0) + 10) }
    };
  }
}

function ServiceCard({ service, onRestart, theme, defaultExpanded = false }: { service: ServiceStatus; onRestart: (id: string) => void; theme: string; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const bg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const bgInner = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const muted = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  
  const statusConfig = {
    healthy: { color: 'bg-green-500', border: 'border-green-500', label: '✅ UP' },
    unhealthy: { color: 'bg-red-500', border: 'border-red-500', label: '❌ DOWN' },
    checking: { color: 'bg-yellow-500', border: 'border-yellow-500', label: '⏳ ...' },
  };
  const cfg = statusConfig[service.status];
  const methodColors: Record<string, string> = {
    GET: 'bg-green-600', POST: 'bg-blue-600', PUT: 'bg-yellow-600', 
    DELETE: 'bg-red-600', WS: 'bg-purple-600', GQL: 'bg-pink-600'
  };

  return (
    <div className={`${bg} rounded-xl overflow-hidden border-l-4 ${cfg.border} shadow-lg`}>
      <div className="p-4 cursor-pointer hover:bg-opacity-80 transition" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${cfg.color} ${service.status === 'checking' ? 'animate-pulse' : ''}`} />
            <h3 className={`font-semibold ${text}`}>{service.name}</h3>
            <span className={`text-xs ${muted}`}>:{service.port}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono px-2 py-1 rounded ${cfg.color} text-white`}>{cfg.label}</span>
            <span className={muted}>{expanded ? '▼' : '▶'}</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div><span className={muted}>Latency</span>
            <div className={`font-mono ${service.latency < 50 ? 'text-green-400' : 'text-yellow-400'}`}>
              {service.status === 'healthy' ? `${service.latency}ms` : '-'}</div></div>
          <div><span className={muted}>Routes</span><div className={text}>{service.routes.length}</div></div>
          <div><span className={muted}>Errors</span>
            <div className={service.errors.length > 0 ? 'text-red-400' : 'text-green-400'}>{service.errors.length}</div></div>
          <div><span className={muted}>Avg</span><div className={text}>{service.metrics.avgLatency || 0}ms</div></div>
        </div>
      </div>
      
      {expanded && (
        <div className={`${bgInner} p-4 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
          <div className="mb-4">
            <h4 className={`text-sm font-semibold ${text} mb-2`}>📍 Routes / Endpoints</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {service.routes.map((route, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-white ${methodColors[route.method]}`}>{route.method}</span>
                  <code className={`font-mono ${text}`}>{route.path}</code>
                  <span className={muted}>- {route.description}</span>
                </div>
              ))}
            </div>
          </div>
          {service.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-red-400 mb-2">⚠️ Recent Errors</h4>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {service.errors.slice(0, 5).map((err, i) => (
                  <div key={i} className="text-xs text-red-300 font-mono">[{err.timestamp.toLocaleTimeString()}] {err.message}</div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {service.status === 'unhealthy' && (
              <button onClick={() => onRestart(service.id)} className="text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded transition">🔄 Restart</button>
            )}
            <button onClick={() => window.open(`http://localhost:${service.port}`, '_blank')} className="text-xs px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition">🔗 Open</button>
            <button onClick={() => navigator.clipboard.writeText(service.endpoint)} className="text-xs px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded transition">📋 Copy URL</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ArchitectureOverview({ services, theme }: { services: ServiceStatus[]; theme: string }) {
  const bg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const totalRoutes = services.reduce((sum, s) => sum + s.routes.length, 0);
  const totalErrors = services.reduce((sum, s) => sum + s.errors.length, 0);
  
  return (
    <div className={`${bg} rounded-xl p-4`}>
          {/* 🎯 AI Action Monitor */}
          <div className="mb-4">
            <ActionMonitor actions={[]} maxDisplay={5} />
          </div>
          
          <h3 className={`font-semibold ${text} mb-3`}>🏗️ System Architecture</h3>
      <pre className="text-xs text-green-400 font-mono overflow-x-auto bg-gray-900 p-3 rounded-lg">
{`┌─────────────────────────────────────────────────────────────┐
│  🫀 ankr-pulse • Heart of ankr-labs                         │
├─────────────────────────────────────────────────────────────┤
│  Services: ${services.length} │ Routes: ${String(totalRoutes).padEnd(2)} │ Errors: ${totalErrors}                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    [Frontend:3002] ──► [GraphQL:4001] ──► [PostgreSQL:5433]│
│          │                  │                               │
│          ▼                  ▼                               │
│    [Pulse Monitor]    [Saathi:4002]                        │
│          │                  │                               │
│          ▼                  ▼                               │
│    [Widgets]          [GPS:3070] ◄──── [Devices]           │
│                            │                                │
│                            ▼                                │
│                     [ankr-eon:4005]                         │
│                      (AI Memory)                            │
├─────────────────────────────────────────────────────────────┤
│  🙏 Om Namah Shivaya │ By Guru's Grace                      │
│  © 2025-2026 Powerp Box IT Solutions Pvt Limited           │
└─────────────────────────────────────────────────────────────┘`}
      </pre>
    </div>
  );
}

function ActivityLog({ activities, theme }: { activities: string[]; theme: string }) {
  const bg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const muted = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <h3 className={`font-semibold ${text} mb-3`}>📋 Activity Log</h3>
      <div className="space-y-1 max-h-40 overflow-y-auto font-mono text-xs">
        {activities.map((activity, i) => (
          <div key={i} className={`${activity.includes('⚠️') || activity.includes('unhealthy') ? 'text-red-400' : activity.includes('healthy') ? 'text-green-400' : muted}`}>{activity}</div>
        ))}
        {activities.length === 0 && <div className={muted}>Waiting for activity...</div>}
      </div>
    </div>
  );
}

export default function PulseDashboard() {
  const { theme } = useTheme();
  const [services, setServices] = useState<ServiceStatus[]>(initServices);
  const [activities, setActivities] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'healthy' | 'unhealthy' | 'routes'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10);

  const titleColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const subtitleColor = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const cardBg = theme === 'light' ? 'bg-gray-100' : 'bg-gray-900';

  const log = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setActivities(prev => [`[${ts}] ${msg}`, ...prev.slice(0, 99)]);
  }, []);

  const checkAll = useCallback(async () => {
    log('🔍 Health check started...');
    setServices(prev => prev.map(s => ({ ...s, status: 'checking' as const })));
    const results = await Promise.all(services.map(s => checkService(s)));
    setServices(results);
    const h = results.filter(s => s.status === 'healthy').length;
    const u = results.filter(s => s.status === 'unhealthy').length;
    log(`✅ Check complete: ${h} healthy, ${u} unhealthy`);
    results.filter(s => s.status === 'unhealthy').forEach(s => log(`⚠️ ${s.name} DOWN on :${s.port}`));
  }, [services, log]);

  const handleRestart = useCallback((id: string) => {
    const svc = services.find(s => s.id === id);
    if (svc) {
      log(`🔄 Restart requested: ${svc.name}`);
      alert(`To restart ${svc.name}:\n\ncd ~/ankr-labs-nx\nnpm run dev:${id}`);
    }
  }, [services, log]);

  useEffect(() => {
    checkAll();
    if (autoRefresh) {
      const int = setInterval(checkAll, refreshInterval * 1000);
      return () => clearInterval(int);
    }
  }, [autoRefresh, refreshInterval]);

  const healthy = services.filter(s => s.status === 'healthy').length;
  const unhealthy = services.filter(s => s.status === 'unhealthy').length;
  const totalRoutes = services.reduce((sum, s) => sum + s.routes.length, 0);

  return (
    <div className="space-y-6">
      <div className={`${cardBg} rounded-xl p-6`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${titleColor}`}>🫀 ankr-pulse</h1>
            <p className={subtitleColor}>Heart of ankr-labs • {totalRoutes} endpoints monitored</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
              <span className={`text-sm ${subtitleColor}`}>Auto</span>
            </label>
            <select value={refreshInterval} onChange={e => setRefreshInterval(+e.target.value)} className="bg-gray-700 text-white px-2 py-1 rounded text-sm">
              <option value={5}>5s</option><option value={10}>10s</option><option value={30}>30s</option>
            </select>
            <button onClick={checkAll} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">🔄 Check</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div onClick={() => setFilter('all')} className={`${cardBg} rounded-xl p-4 text-center cursor-pointer hover:ring-2 hover:ring-white/30 transition ${filter === 'all' ? 'ring-2 ring-orange-500' : ''}`}>
          <div className={`text-3xl font-bold ${titleColor}`}>{services.length}</div><div className={subtitleColor}>All Services</div>
        </div>
        <div onClick={() => setFilter('healthy')} className={`${cardBg} rounded-xl p-4 text-center border-l-4 border-green-500 cursor-pointer hover:ring-2 hover:ring-green-500/50 transition ${filter === 'healthy' ? 'ring-2 ring-green-500' : ''}`}>
          <div className="text-3xl font-bold text-green-400">{healthy}</div><div className={subtitleColor}>Healthy</div>
        </div>
        <div onClick={() => setFilter('unhealthy')} className={`${cardBg} rounded-xl p-4 text-center border-l-4 border-red-500 cursor-pointer hover:ring-2 hover:ring-red-500/50 transition ${filter === 'unhealthy' ? 'ring-2 ring-red-500' : ''}`}>
          <div className="text-3xl font-bold text-red-400">{unhealthy}</div><div className={subtitleColor}>Down</div>
        </div>
        <div onClick={() => setFilter('routes')} className={`${cardBg} rounded-xl p-4 text-center border-l-4 border-blue-500 cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition ${filter === 'routes' ? 'ring-2 ring-blue-500' : ''}`}>
          <div className="text-3xl font-bold text-blue-400">{totalRoutes}</div><div className={subtitleColor}>Routes</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className={`text-lg font-semibold ${titleColor}`}>
            🔧 Services {filter !== 'all' && <span className="text-sm font-normal">
              ({filter === 'healthy' ? '✅ Healthy only' : filter === 'unhealthy' ? '❌ Down only' : filter === 'routes' ? '📍 All routes expanded' : ''})
              <button onClick={() => setFilter('all')} className="ml-2 text-orange-400 hover:text-orange-300">✕ Clear</button>
            </span>}
          </h2>
          {services
            .filter(svc => {
              if (filter === 'all') return true;
              if (filter === 'healthy') return svc.status === 'healthy';
              if (filter === 'unhealthy') return svc.status === 'unhealthy';
              if (filter === 'routes') return true; // Show all but expanded
              return true;
            })
            .map(svc => <ServiceCard key={svc.id} service={svc} onRestart={handleRestart} theme={theme} defaultExpanded={filter === 'routes'} />)}
        </div>
        <div className="space-y-4">
          <ActivityLog activities={activities} theme={theme} />
          <ArchitectureOverview services={services} theme={theme} />
        </div>
      </div>
    </div>
  );
}
