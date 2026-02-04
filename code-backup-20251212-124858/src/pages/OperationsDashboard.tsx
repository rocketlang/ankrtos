/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ANKR Operations Dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Universal Operations UI for Lead Capture & Container Tracking
 * Built on @ankr/shell framework
 * 
 * Features:
 * - Lead Dashboard with scoring
 * - Scraper Health monitoring
 * - Container Tracking (Ocean)
 * - Real-time updates via WebSocket
 * - 10 themes, 20+ languages
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Lead {
  id: string;
  leadNumber: string;
  source: 'whatsapp' | 'email' | 'website' | 'phone';
  customerName?: string;
  customerPhone?: string;
  origin?: string;
  destination?: string;
  weight?: number;
  weightUnit?: string;
  materialType?: string;
  vehicleType?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  stage: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'QUOTED' | 'NEGOTIATING' | 'WON' | 'LOST';
  score: number;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ScraperStatus {
  name: string;
  status: 'online' | 'offline' | 'error';
  leadsToday: number;
  lastRun: Date;
  errors: number;
}

interface ContainerStatus {
  containerId: string;
  carrier: string;
  status: string;
  vessel?: string;
  location: string;
  eta?: Date;
  isDelayed: boolean;
}

interface DashboardStats {
  today: number;
  hot: number;
  pending: number;
  converted: number;
  bySource: Record<string, number>;
  byStage: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════════════════════
// THEME (from @ankr/shell)
// ═══════════════════════════════════════════════════════════════════════════

const themes = {
  midnight: {
    bg: 'bg-slate-900',
    card: 'bg-slate-800',
    cardHover: 'hover:bg-slate-700',
    text: 'text-white',
    textMuted: 'text-slate-400',
    border: 'border-slate-700',
    primary: 'text-cyan-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
    accent: 'bg-cyan-500',
  },
  corporate: {
    bg: 'bg-gray-100',
    card: 'bg-white',
    cardHover: 'hover:bg-gray-50',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    border: 'border-gray-200',
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    accent: 'bg-blue-600',
  }
};

type ThemeName = keyof typeof themes;

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  WhatsApp: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  Email: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Globe: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  Ship: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17h2l2-8h10l2 8h2M7 17v4M17 17v4M12 3v6M9 9h6" />
    </svg>
  ),
  Truck: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  Fire: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.551 1.369-4.787 3.414-6.012C9.971 8.549 11 6.621 11 4.5c0-.327-.027-.649-.078-.964A8.5 8.5 0 0112 3c.552 0 1 .448 1 1 0 .552-.448 1-1 1-1.657 0-3 1.343-3 3 0 1.657 1.343 3 3 3s3-1.343 3-3c0-.552.448-1 1-1s1 .448 1 1c0 2.761-2.239 5-5 5-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3c0-.552.448-1 1-1s1 .448 1 1c0 2.761-2.239 5-5 5z"/>
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const Badge: React.FC<{
  children: React.ReactNode;
  variant: 'success' | 'warning' | 'error' | 'info' | 'default';
}> = ({ children, variant }) => {
  const colors = {
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    default: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[variant]}`}>
      {children}
    </span>
  );
};

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const getColor = () => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-cyan-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };
  
  const getLabel = () => {
    if (score >= 80) return '🔥 HOT';
    if (score >= 60) return '⚡ WARM';
    if (score >= 40) return '💧 COOL';
    return '❄️ COLD';
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono font-bold ${getColor()}`}>{score}</span>
      <span className="text-xs">{getLabel()}</span>
    </div>
  );
};

const SourceIcon: React.FC<{ source: string }> = ({ source }) => {
  switch (source) {
    case 'whatsapp':
      return <span className="text-green-400"><Icons.WhatsApp /></span>;
    case 'email':
      return <span className="text-blue-400"><Icons.Email /></span>;
    case 'website':
      return <span className="text-purple-400"><Icons.Globe /></span>;
    default:
      return <span className="text-gray-400"><Icons.Truck /></span>;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════

const StatCard: React.FC<{
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  theme: typeof themes.midnight;
}> = ({ title, value, subtitle, icon, color = 'text-cyan-400', theme }) => (
  <div className={`${theme.card} rounded-xl p-6 border ${theme.border}`}>
    <div className="flex items-center justify-between mb-2">
      <span className={`text-sm ${theme.textMuted}`}>{title}</span>
      {icon && <span className={color}>{icon}</span>}
    </div>
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
    {subtitle && <div className={`text-xs ${theme.textMuted} mt-1`}>{subtitle}</div>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// LEADS TABLE
// ═══════════════════════════════════════════════════════════════════════════

const LeadsTable: React.FC<{
  leads: Lead[];
  theme: typeof themes.midnight;
  onLeadClick: (lead: Lead) => void;
}> = ({ leads, theme, onLeadClick }) => {
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'NEW': return 'bg-blue-500/20 text-blue-400';
      case 'CONTACTED': return 'bg-cyan-500/20 text-cyan-400';
      case 'QUALIFIED': return 'bg-purple-500/20 text-purple-400';
      case 'QUOTED': return 'bg-amber-500/20 text-amber-400';
      case 'NEGOTIATING': return 'bg-orange-500/20 text-orange-400';
      case 'WON': return 'bg-emerald-500/20 text-emerald-400';
      case 'LOST': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className={`${theme.card} rounded-xl border ${theme.border} overflow-hidden`}>
      <div className={`px-6 py-4 border-b ${theme.border} flex justify-between items-center`}>
        <h3 className={`font-semibold ${theme.text}`}>Recent Leads</h3>
        <div className="flex gap-2">
          <select className={`${theme.card} ${theme.text} text-sm rounded px-3 py-1 border ${theme.border}`}>
            <option>All Sources</option>
            <option>WhatsApp</option>
            <option>Email</option>
            <option>Website</option>
          </select>
          <select className={`${theme.card} ${theme.text} text-sm rounded px-3 py-1 border ${theme.border}`}>
            <option>All Stages</option>
            <option>NEW</option>
            <option>CONTACTED</option>
            <option>QUALIFIED</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${theme.bg} text-left`}>
            <tr>
              <th className={`px-6 py-3 text-xs font-medium ${theme.textMuted} uppercase tracking-wider`}>Lead</th>
              <th className={`px-6 py-3 text-xs font-medium ${theme.textMuted} uppercase tracking-wider`}>Route</th>
              <th className={`px-6 py-3 text-xs font-medium ${theme.textMuted} uppercase tracking-wider`}>Details</th>
              <th className={`px-6 py-3 text-xs font-medium ${theme.textMuted} uppercase tracking-wider`}>Source</th>
              <th className={`px-6 py-3 text-xs font-medium ${theme.textMuted} uppercase tracking-wider`}>Score</th>
              <th className={`px-6 py-3 text-xs font-medium ${theme.textMuted} uppercase tracking-wider`}>Stage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {leads.map((lead) => (
              <tr 
                key={lead.id} 
                className={`${theme.cardHover} cursor-pointer transition-colors`}
                onClick={() => onLeadClick(lead)}
              >
                <td className="px-6 py-4">
                  <div className={`font-mono text-sm ${theme.primary}`}>{lead.leadNumber}</div>
                  <div className={`text-xs ${theme.textMuted}`}>
                    {lead.customerName || lead.customerPhone || 'Unknown'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`text-sm ${theme.text}`}>
                    {lead.origin || '?'} → {lead.destination || '?'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`text-sm ${theme.textMuted}`}>
                    {lead.weight ? `${lead.weight} ${lead.weightUnit || 'ton'}` : '-'} 
                    {lead.materialType ? ` | ${lead.materialType}` : ''}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <SourceIcon source={lead.source} />
                    <span className={`text-xs ${theme.textMuted} capitalize`}>{lead.source}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <ScoreGauge score={lead.score} />
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStageColor(lead.stage)}`}>
                    {lead.stage}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCRAPER HEALTH
// ═══════════════════════════════════════════════════════════════════════════

const ScraperHealthCard: React.FC<{
  scraper: ScraperStatus;
  theme: typeof themes.midnight;
}> = ({ scraper, theme }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'offline': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'RUNNING';
      case 'offline': return 'STOPPED';
      case 'error': return 'ERROR';
      default: return 'UNKNOWN';
    }
  };

  const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className={`${theme.card} rounded-xl p-4 border ${theme.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(scraper.status)} animate-pulse`} />
          <span className={`font-medium ${theme.text}`}>{scraper.name}</span>
        </div>
        <Badge variant={scraper.status === 'online' ? 'success' : scraper.status === 'error' ? 'error' : 'default'}>
          {getStatusText(scraper.status)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <div className={`text-xs ${theme.textMuted}`}>Leads Today</div>
          <div className={`text-xl font-bold ${theme.primary}`}>{scraper.leadsToday}</div>
        </div>
        <div>
          <div className={`text-xs ${theme.textMuted}`}>Last Run</div>
          <div className={`text-sm ${theme.text}`}>{timeSince(scraper.lastRun)}</div>
        </div>
      </div>
      
      {scraper.errors > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
          <span>⚠️ {scraper.errors} errors</span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTAINER TRACKER
// ═══════════════════════════════════════════════════════════════════════════

const ContainerCard: React.FC<{
  container: ContainerStatus;
  theme: typeof themes.midnight;
}> = ({ container, theme }) => {
  const getCarrierColor = (carrier: string) => {
    switch (carrier.toLowerCase()) {
      case 'maersk': return 'text-blue-400';
      case 'msc': return 'text-yellow-400';
      case 'cma': return 'text-red-400';
      case 'hapag': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`${theme.card} rounded-xl p-4 border ${theme.border} ${container.isDelayed ? 'border-red-500/50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icons.Ship />
          <span className={`font-mono font-bold ${theme.text}`}>{container.containerId}</span>
        </div>
        <span className={`text-xs font-medium ${getCarrierColor(container.carrier)} uppercase`}>
          {container.carrier}
        </span>
      </div>
      
      <div className={`text-sm ${theme.textMuted} mb-2`}>{container.status}</div>
      
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className={theme.textMuted}>Location:</span>
          <span className={theme.text}>{container.location}</span>
        </div>
        {container.vessel && (
          <div className="flex justify-between">
            <span className={theme.textMuted}>Vessel:</span>
            <span className={theme.text}>{container.vessel}</span>
          </div>
        )}
        {container.eta && (
          <div className="flex justify-between">
            <span className={theme.textMuted}>ETA:</span>
            <span className={container.isDelayed ? 'text-red-400' : theme.text}>
              {new Date(container.eta).toLocaleDateString()}
              {container.isDelayed && ' ⚠️ DELAYED'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

const OperationsDashboard: React.FC = () => {
  const [themeName, setThemeName] = useState<ThemeName>('midnight');
  const [activeTab, setActiveTab] = useState<'leads' | 'scrapers' | 'containers'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [scrapers, setScrapers] = useState<ScraperStatus[]>([]);
  const [containers, setContainers] = useState<ContainerStatus[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    today: 0,
    hot: 0,
    pending: 0,
    converted: 0,
    bySource: {},
    byStage: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const theme = themes[themeName];
  
  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, these would be real API calls
      // const leadsRes = await fetch('/api/inbox/leads');
      // const statsRes = await fetch('/api/inbox/stats');
      
      // Mock data for demo
      const mockLeads: Lead[] = [
        {
          id: '1',
          leadNumber: 'LD-2025-0047',
          source: 'whatsapp',
          customerName: 'Ramesh Transport',
          customerPhone: '9876543210',
          origin: 'Delhi',
          destination: 'Mumbai',
          weight: 20,
          weightUnit: 'ton',
          materialType: 'Steel Coils',
          urgency: 'high',
          stage: 'NEW',
          score: 85,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          leadNumber: 'LD-2025-0046',
          source: 'email',
          customerName: 'ABC Logistics',
          customerPhone: '9876543211',
          origin: 'Chennai',
          destination: 'Bangalore',
          weight: 15,
          weightUnit: 'ton',
          materialType: 'Electronics',
          urgency: 'medium',
          stage: 'NEW',
          score: 72,
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(Date.now() - 3600000),
        },
        {
          id: '3',
          leadNumber: 'LD-2025-0045',
          source: 'website',
          customerName: 'XYZ Corp',
          origin: 'Pune',
          destination: 'Delhi',
          weight: 10,
          weightUnit: 'ton',
          urgency: 'low',
          stage: 'CONTACTED',
          score: 65,
          createdAt: new Date(Date.now() - 7200000),
          updatedAt: new Date(Date.now() - 7200000),
        },
      ];
      
      const mockScrapers: ScraperStatus[] = [
        { name: 'wa-scraper', status: 'online', leadsToday: 156, lastRun: new Date(Date.now() - 120000), errors: 0 },
        { name: 'email-miner', status: 'online', leadsToday: 42, lastRun: new Date(Date.now() - 300000), errors: 0 },
        { name: 'lead-scraper', status: 'online', leadsToday: 28, lastRun: new Date(Date.now() - 720000), errors: 2 },
        { name: 'ocean-tracker', status: 'online', leadsToday: 0, lastRun: new Date(Date.now() - 3600000), errors: 0 },
      ];
      
      const mockContainers: ContainerStatus[] = [
        { containerId: 'MSKU1234567', carrier: 'Maersk', status: 'In Transit', vessel: 'MAERSK SELETAR', location: 'Arabian Sea', eta: new Date(Date.now() + 86400000 * 3), isDelayed: false },
        { containerId: 'CMAU7654321', carrier: 'CMA', status: 'Arrived', location: 'JNPT Mumbai', isDelayed: false },
        { containerId: 'MSCU9876543', carrier: 'MSC', status: 'In Transit', vessel: 'MSC DIANA', location: 'Singapore', eta: new Date(Date.now() + 86400000 * 7), isDelayed: true },
      ];
      
      setLeads(mockLeads);
      setScrapers(mockScrapers);
      setContainers(mockContainers);
      setStats({
        today: 47,
        hot: 12,
        pending: 28,
        converted: 7,
        bySource: { whatsapp: 28, email: 12, website: 7 },
        byStage: { NEW: 15, CONTACTED: 18, QUALIFIED: 8, QUOTED: 4, WON: 2 },
      });
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);
  
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
      {/* Header */}
      <header className={`${theme.card} border-b ${theme.border} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">🚛 ANKR Operations</h1>
            <div className="flex gap-1">
              {(['leads', 'scrapers', 'containers'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? `${theme.accent} text-white`
                      : `${theme.textMuted} hover:${theme.text}`
                  }`}
                >
                  {tab === 'leads' && '📋 Leads'}
                  {tab === 'scrapers' && '🤖 Scrapers'}
                  {tab === 'containers' && '🚢 Containers'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              className={`p-2 rounded-lg ${theme.cardHover} ${theme.textMuted}`}
              title="Refresh"
            >
              <Icons.Refresh />
            </button>
            <select
              value={themeName}
              onChange={(e) => setThemeName(e.target.value as ThemeName)}
              className={`${theme.card} ${theme.text} text-sm rounded-lg px-3 py-2 border ${theme.border}`}
            >
              <option value="midnight">🌙 Midnight</option>
              <option value="corporate">💼 Corporate</option>
            </select>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'leads' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="TODAY'S LEADS"
                value={stats.today}
                subtitle="from all sources"
                icon={<Icons.Truck />}
                color="text-cyan-400"
                theme={theme}
              />
              <StatCard
                title="HOT LEADS"
                value={stats.hot}
                subtitle="score > 80"
                icon={<Icons.Fire />}
                color="text-orange-400"
                theme={theme}
              />
              <StatCard
                title="PENDING FOLLOWUP"
                value={stats.pending}
                subtitle="need action"
                icon={<Icons.Clock />}
                color="text-amber-400"
                theme={theme}
              />
              <StatCard
                title="CONVERTED TODAY"
                value={stats.converted}
                subtitle="to orders"
                icon={<Icons.Check />}
                color="text-emerald-400"
                theme={theme}
              />
            </div>
            
            {/* Leads Table */}
            <LeadsTable
              leads={leads}
              theme={theme}
              onLeadClick={(lead) => setSelectedLead(lead)}
            />
          </>
        )}
        
        {activeTab === 'scrapers' && (
          <>
            <h2 className={`text-lg font-semibold mb-4 ${theme.text}`}>Scraper Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {scrapers.map((scraper) => (
                <ScraperHealthCard key={scraper.name} scraper={scraper} theme={theme} />
              ))}
            </div>
            
            {/* Source Breakdown */}
            <div className={`${theme.card} rounded-xl p-6 border ${theme.border} mt-6`}>
              <h3 className={`font-semibold mb-4 ${theme.text}`}>Leads by Source (Today)</h3>
              <div className="space-y-3">
                {Object.entries(stats.bySource).map(([source, count]) => (
                  <div key={source} className="flex items-center gap-4">
                    <SourceIcon source={source} />
                    <span className={`capitalize ${theme.text} w-24`}>{source}</span>
                    <div className="flex-1 h-4 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full ${
                          source === 'whatsapp' ? 'bg-green-500' :
                          source === 'email' ? 'bg-blue-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${(count / stats.today) * 100}%` }}
                      />
                    </div>
                    <span className={`font-mono ${theme.primary}`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'containers' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${theme.text}`}>Container Tracking</h2>
              <button className={`px-4 py-2 rounded-lg ${theme.accent} text-white text-sm font-medium`}>
                + Add Container
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {containers.map((container) => (
                <ContainerCard key={container.containerId} container={container} theme={theme} />
              ))}
            </div>
          </>
        )}
      </main>
      
      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedLead(null)}>
          <div className={`${theme.card} rounded-xl p-6 max-w-lg w-full mx-4 border ${theme.border}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.text}`}>{selectedLead.leadNumber}</h3>
              <button onClick={() => setSelectedLead(null)} className={theme.textMuted}>✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <SourceIcon source={selectedLead.source} />
                <span className={`capitalize ${theme.textMuted}`}>{selectedLead.source}</span>
                <ScoreGauge score={selectedLead.score} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className={theme.textMuted}>Customer</div>
                  <div className={theme.text}>{selectedLead.customerName || '-'}</div>
                </div>
                <div>
                  <div className={theme.textMuted}>Phone</div>
                  <div className={theme.text}>{selectedLead.customerPhone || '-'}</div>
                </div>
                <div>
                  <div className={theme.textMuted}>Route</div>
                  <div className={theme.text}>{selectedLead.origin} → {selectedLead.destination}</div>
                </div>
                <div>
                  <div className={theme.textMuted}>Weight</div>
                  <div className={theme.text}>{selectedLead.weight} {selectedLead.weightUnit}</div>
                </div>
                <div>
                  <div className={theme.textMuted}>Material</div>
                  <div className={theme.text}>{selectedLead.materialType || '-'}</div>
                </div>
                <div>
                  <div className={theme.textMuted}>Stage</div>
                  <div className={theme.text}>{selectedLead.stage}</div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button className={`flex-1 px-4 py-2 rounded-lg ${theme.accent} text-white font-medium`}>
                  📞 Call
                </button>
                <button className={`flex-1 px-4 py-2 rounded-lg border ${theme.border} ${theme.text} font-medium`}>
                  📝 Update Stage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsDashboard;
