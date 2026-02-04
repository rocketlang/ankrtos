/**
 * ANKR-PULSE Agent Monitor Components
 * Real-time agent monitoring dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

interface AgentConfig {
  id: string;
  name: string;
  version: string;
  domain: string;
  config: any;
  generation: number;
  score: number | null;
  active: boolean;
  createdAt: string;
}

interface AgentStats {
  domain: string;
  totalSessions: number;
  totalScopes: number;
  totalArtifacts: number;
  successRate: number;
  hindsightCount: number;
  resolvedCount: number;
}

interface MemoryScope {
  id: string;
  sessionId: string;
  scopeType: string;
  summary: string | null;
  compressed: boolean;
  children: MemoryScope[];
  artifacts: ScopeArtifact[];
}

interface ScopeArtifact {
  id: string;
  artifactType: string;
  content: any;
  importanceScore: number;
  createdAt: string;
}

interface HindsightNote {
  id: string;
  title: string;
  errorType: string;
  errorMessage: string;
  domain: string | null;
  resolutionStatus: string;
  resolution: string | null;
  createdAt: string;
}

interface LiveEvent {
  timestamp: string;
  agent: string;
  action: string;
  status: 'success' | 'error' | 'pending';
}

// ============================================================================
// API Hook
// ============================================================================

const API_BASE = '/api'; // Adjust based on your setup

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// AgentStatusCard Component
// ============================================================================

interface AgentStatusCardProps {
  domain: string;
  config: AgentConfig | null;
  stats: AgentStats | null;
  onClick?: () => void;
}

export const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ 
  domain, config, stats, onClick 
}) => {
  const statusColor = config?.active ? 'bg-green-500' : 'bg-gray-500';
  const successRate = stats?.successRate ?? 100;
  
  return (
    <div 
      className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-blue-500 cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`} />
          <h3 className="text-lg font-semibold text-white uppercase">{domain}</h3>
        </div>
        <span className="text-xs bg-slate-700 px-2 py-1 rounded text-gray-400">
          {config?.version || 'N/A'}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Success Rate</span>
          <span className={successRate >= 80 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : 'text-red-400'}>
            {successRate.toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              successRate >= 80 ? 'bg-green-500' : successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${successRate}%` }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-700/50 p-2 rounded">
            <div className="text-gray-400">Sessions</div>
            <div className="text-white font-bold">{stats?.totalSessions ?? 0}</div>
          </div>
          <div className="bg-slate-700/50 p-2 rounded">
            <div className="text-gray-400">Artifacts</div>
            <div className="text-white font-bold">{stats?.totalArtifacts ?? 0}</div>
          </div>
        </div>
        
        {stats && stats.hindsightCount > 0 && (
          <div className="text-xs text-red-400">
            ⚠️ {stats.hindsightCount} failures ({stats.resolvedCount} resolved)
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// AgentMonitor Component (Main Dashboard)
// ============================================================================

export const AgentMonitor: React.FC = () => {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [stats, setStats] = useState<Record<string, AgentStats>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const domains = ['tms', 'wms', 'oms', 'voice', 'compliance', 'government'];

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI<{ agents: AgentConfig[] }>('/agents');
      setAgents(data.agents);

      // Load stats for each domain
      const statsMap: Record<string, AgentStats> = {};
      for (const domain of domains) {
        try {
          const domainData = await fetchAPI<{ stats: AgentStats }>(`/agents/${domain}/stats`);
          statsMap[domain] = domainData.stats;
        } catch (e) {
          // Domain might not have config yet
        }
      }
      setStats(statsMap);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfigForDomain = (domain: string) => 
    agents.find(a => a.domain === domain && a.active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">🤖 Agent Monitor</h2>
        <button 
          onClick={loadAgents}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map(domain => (
          <AgentStatusCard
            key={domain}
            domain={domain}
            config={getConfigForDomain(domain) || null}
            stats={stats[domain] || null}
            onClick={() => setSelectedDomain(domain)}
          />
        ))}
      </div>

      {selectedDomain && (
        <AgentDetailModal
          domain={selectedDomain}
          config={getConfigForDomain(selectedDomain) || null}
          stats={stats[selectedDomain] || null}
          onClose={() => setSelectedDomain(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// AgentDetailModal Component
// ============================================================================

interface AgentDetailModalProps {
  domain: string;
  config: AgentConfig | null;
  stats: AgentStats | null;
  onClose: () => void;
}

const AgentDetailModal: React.FC<AgentDetailModalProps> = ({ 
  domain, config, stats, onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white uppercase">{domain} Agent Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {config ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Name</div>
                <div className="text-white font-semibold">{config.name}</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Version</div>
                <div className="text-white font-semibold">{config.version}</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Generation</div>
                <div className="text-white font-semibold">{config.generation}</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Score</div>
                <div className="text-white font-semibold">{config.score?.toFixed(2) || 'N/A'}</div>
              </div>
            </div>

            <div className="bg-slate-700/50 p-4 rounded-lg">
              <div className="text-gray-400 text-sm mb-2">Configuration</div>
              <pre className="text-xs text-green-400 overflow-x-auto">
                {JSON.stringify(config.config, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            No active configuration for {domain}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MemoryTreeView Component
// ============================================================================

interface MemoryTreeViewProps {
  sessionId?: string;
}

export const MemoryTreeView: React.FC<MemoryTreeViewProps> = ({ sessionId }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(sessionId || null);
  const [memoryTree, setMemoryTree] = useState<MemoryScope[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMemoryTree(selectedSession);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      const data = await fetchAPI<{ sessions: any[] }>('/memory/sessions');
      setSessions(data.sessions);
      if (data.sessions.length > 0 && !selectedSession) {
        setSelectedSession(data.sessions[0].sessionId);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMemoryTree = async (sid: string) => {
    try {
      const data = await fetchAPI<{ tree: MemoryScope[] }>(`/memory/${sid}`);
      setMemoryTree(data.tree);
    } catch (error) {
      console.error('Failed to load memory tree:', error);
    }
  };

  const renderScope = (scope: MemoryScope, depth = 0) => {
    const scopeColors: Record<string, string> = {
      session: 'border-blue-500 bg-blue-500/10',
      task: 'border-green-500 bg-green-500/10',
      subtask: 'border-yellow-500 bg-yellow-500/10',
      action: 'border-purple-500 bg-purple-500/10'
    };

    return (
      <div key={scope.id} className={`ml-${depth * 4}`}>
        <div className={`border-l-4 ${scopeColors[scope.scopeType] || 'border-gray-500'} p-3 mb-2 rounded-r-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded uppercase">
                {scope.scopeType}
              </span>
              {scope.compressed && (
                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                  Compressed
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{scope.artifacts.length} artifacts</span>
          </div>
          {scope.summary && (
            <p className="text-sm text-gray-300 mt-2">{scope.summary}</p>
          )}
          {scope.artifacts.length > 0 && (
            <div className="mt-2 space-y-1">
              {scope.artifacts.slice(0, 3).map(artifact => (
                <div key={artifact.id} className="text-xs bg-slate-800 p-2 rounded flex justify-between">
                  <span className="text-gray-400">{artifact.artifactType}</span>
                  <span className="text-blue-400">{(artifact.importanceScore * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {scope.children?.map(child => renderScope(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-800 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">🧠 Memory Inspector</h2>
        <select
          value={selectedSession || ''}
          onChange={e => setSelectedSession(e.target.value)}
          className="bg-slate-700 text-white rounded-lg px-4 py-2 text-sm"
        >
          {sessions.map(s => (
            <option key={s.sessionId} value={s.sessionId}>
              Session {s.sessionId.slice(0, 8)}... ({s.taskCount} tasks)
            </option>
          ))}
        </select>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        {memoryTree.length > 0 ? (
          memoryTree.map(scope => renderScope(scope))
        ) : (
          <div className="text-center text-gray-400 py-8">
            No memory scopes found for this session
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// NoteExplorer Component
// ============================================================================

export const NoteExplorer: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [hindsightNotes, setHindsightNotes] = useState<HindsightNote[]>([]);
  const [activeTab, setActiveTab] = useState<'notes' | 'hindsight'>('hindsight');
  const [filter, setFilter] = useState({ domain: '', errorType: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, [filter]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const [notesData, hindsightData] = await Promise.all([
        fetchAPI<{ notes: any[] }>('/notes'),
        fetchAPI<{ notes: HindsightNote[], stats: any }>('/notes/hindsight')
      ]);
      setNotes(notesData.notes);
      setHindsightNotes(hindsightData.notes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    resolved: 'bg-green-500/20 text-green-400',
    workaround: 'bg-yellow-500/20 text-yellow-400',
    abandoned: 'bg-red-500/20 text-red-400',
    unknown: 'bg-gray-500/20 text-gray-400'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">📝 Note Explorer</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'notes' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-400'
            }`}
          >
            Strategy Notes
          </button>
          <button
            onClick={() => setActiveTab('hindsight')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'hindsight' ? 'bg-red-600 text-white' : 'bg-slate-700 text-gray-400'
            }`}
          >
            Hindsight Notes
          </button>
        </div>
      </div>

      {activeTab === 'hindsight' && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="space-y-3">
            {hindsightNotes.length > 0 ? (
              hindsightNotes.map(note => (
                <div 
                  key={note.id} 
                  className="bg-slate-700/50 p-4 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                          {note.errorType}
                        </span>
                        {note.domain && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded uppercase">
                            {note.domain}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${statusColors[note.resolutionStatus]}`}>
                          {note.resolutionStatus}
                        </span>
                      </div>
                      <h4 className="text-white font-medium">{note.title}</h4>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{note.errorMessage}</p>
                      {note.resolution && (
                        <p className="text-green-400 text-sm mt-2">✅ {note.resolution}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                No hindsight notes found
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="space-y-3">
            {notes.length > 0 ? (
              notes.map(note => (
                <div 
                  key={note.id}
                  className="bg-slate-700/50 p-4 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {note.domain && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded uppercase">
                        {note.domain}
                      </span>
                    )}
                    {note.tags?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-xs bg-slate-600 text-gray-300 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h4 className="text-white font-medium">{note.title}</h4>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{note.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                No strategy notes found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// LiveActivityFeed Component
// ============================================================================

export const LiveActivityFeed: React.FC = () => {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws/agents`);
    
    ws.onopen = () => {
      setConnected(true);
      console.log('Connected to agent stream');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== 'connected') {
        setEvents(prev => [data, ...prev].slice(0, 50));
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('Disconnected from agent stream');
    };

    return () => ws.close();
  }, []);

  const statusIcons: Record<string, string> = {
    success: '✅',
    error: '❌',
    pending: '⏳'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">📡 Live Activity</h2>
        <div className={`flex items-center gap-2 text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {events.length > 0 ? (
            events.map((event, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-4 p-3 border-b border-slate-700 hover:bg-slate-700/50"
              >
                <span className="text-xs font-mono text-gray-500 w-20">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-xs bg-slate-600 px-2 py-1 rounded uppercase w-24 text-center">
                  {event.agent}
                </span>
                <span className="flex-1 text-sm text-gray-300">{event.action}</span>
                <span>{statusIcons[event.status]}</span>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              Waiting for agent activity...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Dashboard Page
// ============================================================================

export const AgentDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              🎛️ ANKR-EON Agent Observatory
              <span className="text-sm bg-green-500 px-2 py-1 rounded animate-pulse">LIVE</span>
            </h1>
            <p className="text-gray-400 mt-1">Confucius Memory System | Hierarchical Learning</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <AgentMonitor />
          </div>
          <div>
            <LiveActivityFeed />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MemoryTreeView />
          <NoteExplorer />
        </div>

        <footer className="text-center text-gray-500 text-sm mt-8">
          🙏 Jai Guru Ji | ANKR Labs | PowerBox IT Solutions
        </footer>
      </div>
    </div>
  );
};

export default AgentDashboard;
