/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WowTruck 2.0 - Security & System Health Dashboard
 * Real-time cyber security monitoring, system health, and threat detection
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import React, { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface SystemService {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  uptime: string;
  cpu: number;
  memory: number;
  lastCheck: string;
}

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'api_abuse' | 'sql_injection' | 'xss_attempt' | 'brute_force' | 'ddos' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  message: string;
  timestamp: string;
  blocked: boolean;
}

interface NetworkStats {
  requestsPerSecond: number;
  bandwidth: string;
  activeConnections: number;
  blockedIPs: number;
  apiCalls24h: number;
  errorRate: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATORS (Replace with real API calls)
// ═══════════════════════════════════════════════════════════════════════════

const generateServices = (): SystemService[] => [
  { name: 'API Gateway', status: 'healthy', uptime: '99.99%', cpu: 23, memory: 45, lastCheck: '2s ago' },
  { name: 'PostgreSQL', status: 'healthy', uptime: '99.97%', cpu: 18, memory: 62, lastCheck: '5s ago' },
  { name: 'Redis Cache', status: 'healthy', uptime: '100%', cpu: 5, memory: 28, lastCheck: '1s ago' },
  { name: 'GraphQL Server', status: 'healthy', uptime: '99.95%', cpu: 35, memory: 51, lastCheck: '3s ago' },
  { name: 'WhatsApp Service', status: 'healthy', uptime: '99.90%', cpu: 12, memory: 34, lastCheck: '4s ago' },
  { name: 'GPS Tracker', status: 'healthy', uptime: '99.85%', cpu: 28, memory: 41, lastCheck: '2s ago' },
  { name: 'AI/LLM Router', status: 'healthy', uptime: '99.92%', cpu: 45, memory: 58, lastCheck: '6s ago' },
  { name: 'DocChain Service', status: 'healthy', uptime: '99.88%', cpu: 15, memory: 39, lastCheck: '3s ago' },
];

const generateSecurityEvents = (): SecurityEvent[] => [
  { id: '1', type: 'login_attempt', severity: 'low', source: '192.168.1.105', target: '/api/auth/login', message: 'Failed login attempt - invalid password', timestamp: '2 min ago', blocked: false },
  { id: '2', type: 'api_abuse', severity: 'medium', source: '45.33.22.11', target: '/api/graphql', message: 'Rate limit exceeded - 150 req/min', timestamp: '5 min ago', blocked: true },
  { id: '3', type: 'sql_injection', severity: 'critical', source: '103.45.67.89', target: '/api/orders', message: 'SQL injection attempt detected and blocked', timestamp: '12 min ago', blocked: true },
  { id: '4', type: 'brute_force', severity: 'high', source: '89.234.56.78', target: '/api/auth/login', message: 'Brute force attack - 50 failed attempts', timestamp: '18 min ago', blocked: true },
  { id: '5', type: 'unauthorized_access', severity: 'medium', source: '192.168.1.42', target: '/api/admin/users', message: 'Unauthorized API access attempt', timestamp: '25 min ago', blocked: true },
  { id: '6', type: 'xss_attempt', severity: 'high', source: '67.89.12.34', target: '/api/customers', message: 'XSS payload detected in input', timestamp: '32 min ago', blocked: true },
  { id: '7', type: 'login_attempt', severity: 'low', source: '192.168.1.88', target: '/api/auth/login', message: 'Successful login - admin@wowtruck.com', timestamp: '45 min ago', blocked: false },
  { id: '8', type: 'ddos', severity: 'critical', source: 'Multiple IPs', target: '/api/*', message: 'DDoS attack mitigated - 10K req/s blocked', timestamp: '1 hour ago', blocked: true },
];

const generateNetworkStats = (): NetworkStats => ({
  requestsPerSecond: Math.floor(Math.random() * 50) + 20,
  bandwidth: `${(Math.random() * 5 + 1).toFixed(2)} MB/s`,
  activeConnections: Math.floor(Math.random() * 200) + 50,
  blockedIPs: 847,
  apiCalls24h: 125847,
  errorRate: Math.random() * 0.5,
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
    offline: 'bg-gray-500',
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs text-white font-medium ${colors[status] || 'bg-gray-500'}`}>
      {status.toUpperCase()}
    </span>
  );
};

const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-blue-500' }) => {
  const getColor = () => {
    if (value > 80) return 'bg-red-500';
    if (value > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  return (
    <div className="w-full bg-gray-700 rounded-full h-2">
      <div className={`h-2 rounded-full ${getColor()}`} style={{ width: `${value}%` }} />
    </div>
  );
};

const ThreatIcon: React.FC<{ type: string }> = ({ type }) => {
  const icons: Record<string, string> = {
    login_attempt: '🔐',
    api_abuse: '⚡',
    sql_injection: '💉',
    xss_attempt: '🔗',
    brute_force: '🔨',
    ddos: '🌊',
    unauthorized_access: '🚫',
  };
  return <span className="text-xl">{icons[type] || '⚠️'}</span>;
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export default function SecurityDashboard() {
  const [services, setServices] = useState<SystemService[]>(generateServices());
  const [events, setEvents] = useState<SecurityEvent[]>(generateSecurityEvents());
  const [networkStats, setNetworkStats] = useState<NetworkStats>(generateNetworkStats());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkStats(generateNetworkStats());
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const healthyServices = services.filter(s => s.status === 'healthy').length;
  const criticalEvents = events.filter(e => e.severity === 'critical').length;
  const blockedThreats = events.filter(e => e.blocked).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            🛡️ Security & System Health Dashboard
          </h1>
          <p className="text-gray-400 text-sm">Real-time monitoring • Threat detection • System status</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-400">Last Updated</div>
            <div className="text-sm font-mono">{lastUpdate.toLocaleTimeString()}</div>
          </div>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Live" />
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">System Status</div>
          <div className="text-2xl font-bold text-green-400">SECURE</div>
          <div className="text-xs text-gray-500">{healthyServices}/{services.length} services healthy</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">Threats Blocked</div>
          <div className="text-2xl font-bold text-blue-400">{blockedThreats}</div>
          <div className="text-xs text-gray-500">Last 24 hours</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">Critical Alerts</div>
          <div className="text-2xl font-bold text-red-400">{criticalEvents}</div>
          <div className="text-xs text-gray-500">Requires attention</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">Requests/sec</div>
          <div className="text-2xl font-bold text-purple-400">{networkStats.requestsPerSecond}</div>
          <div className="text-xs text-gray-500">{networkStats.bandwidth}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">Active Connections</div>
          <div className="text-2xl font-bold text-cyan-400">{networkStats.activeConnections}</div>
          <div className="text-xs text-gray-500">WebSocket + HTTP</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">Blocked IPs</div>
          <div className="text-2xl font-bold text-orange-400">{networkStats.blockedIPs}</div>
          <div className="text-xs text-gray-500">Firewall rules</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Services Health */}
        <div className="col-span-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-750 border-b border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              🖥️ System Services
            </h2>
            <span className="text-xs text-green-400">{healthyServices}/{services.length} Online</span>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {services.map((service, i) => (
              <div key={i} className="bg-gray-750 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{service.name}</span>
                  <StatusBadge status={service.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">CPU:</span>
                    <ProgressBar value={service.cpu} />
                  </div>
                  <div>
                    <span className="text-gray-400">Memory:</span>
                    <ProgressBar value={service.memory} />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Uptime: {service.uptime}</span>
                  <span>Checked: {service.lastCheck}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Events */}
        <div className="col-span-2 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-750 border-b border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              🚨 Security Events
            </h2>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">{criticalEvents} Critical</span>
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">{blockedThreats} Blocked</span>
            </div>
          </div>
          <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
            {events.map((event) => (
              <div key={event.id} className={`p-4 hover:bg-gray-750 transition-colors ${event.severity === 'critical' ? 'bg-red-500/5' : ''}`}>
                <div className="flex items-start gap-3">
                  <ThreatIcon type={event.type} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={event.severity} />
                      <span className="text-sm font-medium">{event.type.replace(/_/g, ' ').toUpperCase()}</span>
                      {event.blocked && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">BLOCKED</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">{event.message}</p>
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      <span>Source: <code className="text-gray-400">{event.source}</code></span>
                      <span>Target: <code className="text-gray-400">{event.target}</code></span>
                      <span>{event.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Stats Row */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {/* API Stats */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">📊 API Statistics (24h)</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Total Calls</span>
              <span className="font-mono">{networkStats.apiCalls24h.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Error Rate</span>
              <span className={`font-mono ${networkStats.errorRate > 1 ? 'text-red-400' : 'text-green-400'}`}>
                {networkStats.errorRate.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Avg Response</span>
              <span className="font-mono text-green-400">45ms</span>
            </div>
          </div>
        </div>

        {/* Database Stats */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">🗄️ Database Health</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Connections</span>
              <span className="font-mono">24/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Query Time (avg)</span>
              <span className="font-mono text-green-400">12ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Disk Usage</span>
              <span className="font-mono">2.4 GB</span>
            </div>
          </div>
        </div>

        {/* Auth Stats */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">🔐 Authentication</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Active Sessions</span>
              <span className="font-mono">47</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Failed Logins (24h)</span>
              <span className="font-mono text-yellow-400">23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">2FA Enabled</span>
              <span className="font-mono text-green-400">89%</span>
            </div>
          </div>
        </div>

        {/* Firewall Stats */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">🔥 Firewall Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Status</span>
              <span className="text-green-400 font-medium">ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Rules Active</span>
              <span className="font-mono">156</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Blocked Today</span>
              <span className="font-mono text-orange-400">1,247</span>
            </div>
          </div>
        </div>
      </div>

      {/* SSL & Compliance */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">🔒 SSL/TLS Status</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-xs text-gray-400">Certificate Valid</div>
              <div className="text-sm font-mono">89 days left</div>
            </div>
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <div className="text-2xl mb-1">🔐</div>
              <div className="text-xs text-gray-400">Protocol</div>
              <div className="text-sm font-mono">TLS 1.3</div>
            </div>
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <div className="text-2xl mb-1">🛡️</div>
              <div className="text-xs text-gray-400">Grade</div>
              <div className="text-sm font-mono text-green-400">A+</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">📋 Compliance Status</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <div className="text-xl mb-1">🇮🇳</div>
              <div className="text-xs text-gray-400">DPDP Act</div>
              <div className="text-xs text-green-400">Compliant</div>
            </div>
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <div className="text-xl mb-1">🇪🇺</div>
              <div className="text-xs text-gray-400">GDPR</div>
              <div className="text-xs text-green-400">Compliant</div>
            </div>
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <div className="text-xl mb-1">💳</div>
              <div className="text-xs text-gray-400">PCI-DSS</div>
              <div className="text-xs text-green-400">Level 1</div>
            </div>
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <div className="text-xl mb-1">🔐</div>
              <div className="text-xs text-gray-400">ISO 27001</div>
              <div className="text-xs text-yellow-400">In Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-gray-500 text-xs">
        🛡️ WowTruck Security Operations Center • Powered by ANKR Labs • 🙏 Jai Guru Ji
      </div>
    </div>
  );
}
