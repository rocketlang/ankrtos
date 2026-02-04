/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FleetViewWidget - Vehicle Utilization & Performance KPIs
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Metrics:
 * - Vehicle Utilization (Running vs Idle)
 * - Demurrage (Wait time at client)
 * - Inter-trip Idle Time
 * - Trip Time (Benchmark vs Actual)
 * - Maintenance Alerts
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import { useState, useEffect } from 'react';
import {
  Truck, Clock, AlertTriangle, TrendingUp, TrendingDown,
  Gauge, MapPin, Wrench, Fuel, Timer, Activity
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface FleetMetrics {
  // Utilization
  totalVehicles: number;
  runningLoaded: number;
  runningEmpty: number;
  idleAtClient: number;
  idleBetweenTrips: number;
  maintenance: number;
  parked: number;
  utilizationPercent: number;
  
  // Demurrage
  totalDemurrageHours: number;
  avgDemurragePerTrip: number;
  demurrageCost: number;
  topDemurrageLocations: { name: string; hours: number }[];
  
  // Trip Performance
  avgTripTime: number;
  benchmarkTripTime: number;
  tripTimeVariance: number;
  onTimeDeliveryPercent: number;
  
  // Maintenance
  criticalAlerts: number;
  warningAlerts: number;
  upcomingService: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA (Replace with GraphQL when backend ready)
// ═══════════════════════════════════════════════════════════════════════════

const generateMockMetrics = (totalVehicles: number): FleetMetrics => {
  const runningLoaded = Math.floor(totalVehicles * 0.35);
  const runningEmpty = Math.floor(totalVehicles * 0.08);
  const idleAtClient = Math.floor(totalVehicles * 0.12);
  const idleBetweenTrips = Math.floor(totalVehicles * 0.18);
  const maintenance = Math.floor(totalVehicles * 0.07);
  const parked = totalVehicles - runningLoaded - runningEmpty - idleAtClient - idleBetweenTrips - maintenance;
  
  return {
    totalVehicles,
    runningLoaded,
    runningEmpty,
    idleAtClient,
    idleBetweenTrips,
    maintenance,
    parked,
    utilizationPercent: Math.round((runningLoaded / totalVehicles) * 100),
    
    totalDemurrageHours: 847,
    avgDemurragePerTrip: 4.2,
    demurrageCost: 254100,
    topDemurrageLocations: [
      { name: 'Tata Steel Jamshedpur', hours: 124 },
      { name: 'Reliance Nagpur', hours: 98 },
      { name: 'Amazon Bhiwandi', hours: 76 },
    ],
    
    avgTripTime: 52,
    benchmarkTripTime: 44,
    tripTimeVariance: 18,
    onTimeDeliveryPercent: 78,
    
    criticalAlerts: 2,
    warningAlerts: 5,
    upcomingService: 12,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface FleetViewWidgetProps {
  totalVehicles?: number;
  compact?: boolean;
}

export default function FleetViewWidget({ totalVehicles = 155, compact = false }: FleetViewWidgetProps) {
  const [metrics, setMetrics] = useState<FleetMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'utilization' | 'demurrage' | 'performance' | 'maintenance'>('utilization');

  useEffect(() => {
    // TODO: Replace with GraphQL query
    // query { fleetMetrics { utilizationPercent demurrageHours ... } }
    setMetrics(generateMockMetrics(totalVehicles));
  }, [totalVehicles]);

  if (!metrics) return null;

  // ═══════════════════════════════════════════════════════════════════════
  // COMPACT VIEW (For Dashboard Grid)
  // ═══════════════════════════════════════════════════════════════════════
  
  if (compact) {
    return (
      <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Fleet Health
          </h3>
          <span className={`text-2xl font-bold ${metrics.utilizationPercent >= 70 ? 'text-green-400' : metrics.utilizationPercent >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {metrics.utilizationPercent}%
          </span>
        </div>
        
        {/* Mini Progress Bar */}
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
            style={{ width: `${metrics.utilizationPercent}%` }}
          />
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <p className="text-green-400 font-bold">{metrics.runningLoaded}</p>
            <p className="text-slate-500">Running</p>
          </div>
          <div>
            <p className="text-yellow-400 font-bold">{metrics.idleAtClient}</p>
            <p className="text-slate-500">At Client</p>
          </div>
          <div>
            <p className="text-orange-400 font-bold">{metrics.idleBetweenTrips}</p>
            <p className="text-slate-500">Idle</p>
          </div>
          <div>
            <p className="text-red-400 font-bold">{metrics.criticalAlerts}</p>
            <p className="text-slate-500">Alerts</p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FULL VIEW
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="bg-[#1E293B] rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Gauge className="w-5 h-5 text-cyan-400" />
          FleetView Analytics
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Updated: Just now</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            metrics.utilizationPercent >= 70 ? 'bg-green-500/20 text-green-400' : 
            metrics.utilizationPercent >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 
            'bg-red-500/20 text-red-400'
          }`}>
            {metrics.utilizationPercent}% Utilization
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {(['utilization', 'demurrage', 'performance', 'maintenance'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'utilization' && (
          <div className="space-y-4">
            {/* Utilization Bars */}
            <div className="space-y-3">
              <UtilizationBar 
                label="Running (Loaded)" 
                value={metrics.runningLoaded} 
                total={metrics.totalVehicles} 
                color="bg-green-500" 
                icon={<Truck className="w-4 h-4" />}
              />
              <UtilizationBar 
                label="Running (Empty)" 
                value={metrics.runningEmpty} 
                total={metrics.totalVehicles} 
                color="bg-blue-500" 
                icon={<Truck className="w-4 h-4" />}
              />
              <UtilizationBar 
                label="Idle at Client" 
                value={metrics.idleAtClient} 
                total={metrics.totalVehicles} 
                color="bg-yellow-500" 
                icon={<MapPin className="w-4 h-4" />}
              />
              <UtilizationBar 
                label="Idle (Between Trips)" 
                value={metrics.idleBetweenTrips} 
                total={metrics.totalVehicles} 
                color="bg-orange-500" 
                icon={<Clock className="w-4 h-4" />}
              />
              <UtilizationBar 
                label="Maintenance" 
                value={metrics.maintenance} 
                total={metrics.totalVehicles} 
                color="bg-red-500" 
                icon={<Wrench className="w-4 h-4" />}
              />
              <UtilizationBar 
                label="Parked/Off" 
                value={metrics.parked} 
                total={metrics.totalVehicles} 
                color="bg-slate-500" 
                icon={<Timer className="w-4 h-4" />}
              />
            </div>

            {/* Target vs Actual */}
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Target Utilization</span>
                <span className="text-white font-medium">75%</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-slate-400">Actual Utilization</span>
                <span className={`font-medium ${metrics.utilizationPercent >= 75 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {metrics.utilizationPercent}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-slate-400">Gap</span>
                <span className={`font-medium flex items-center gap-1 ${metrics.utilizationPercent >= 75 ? 'text-green-400' : 'text-red-400'}`}>
                  {metrics.utilizationPercent >= 75 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(75 - metrics.utilizationPercent)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'demurrage' && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-400">{metrics.totalDemurrageHours}</p>
                <p className="text-xs text-slate-400">Total Hours</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-400">{metrics.avgDemurragePerTrip}h</p>
                <p className="text-xs text-slate-400">Avg/Trip</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-400">₹{(metrics.demurrageCost/1000).toFixed(0)}K</p>
                <p className="text-xs text-slate-400">Est. Loss</p>
              </div>
            </div>

            {/* Top Locations */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Top Detention Locations</h4>
              <div className="space-y-2">
                {metrics.topDemurrageLocations.map((loc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{idx + 1}.</span>
                      <span className="text-sm text-white">{loc.name}</span>
                    </div>
                    <span className="text-yellow-400 font-medium">{loc.hours}h</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-sm text-cyan-400">
                💡 <strong>Recommendation:</strong> Negotiate better unloading slots with Tata Steel. Potential saving: ₹45,000/month
              </p>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-4">
            {/* Trip Time Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-slate-400 text-xs mb-1">Benchmark Trip Time</p>
                <p className="text-3xl font-bold text-green-400">{metrics.benchmarkTripTime}h</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-slate-400 text-xs mb-1">Actual Avg Trip Time</p>
                <p className="text-3xl font-bold text-yellow-400">{metrics.avgTripTime}h</p>
              </div>
            </div>

            {/* Variance */}
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Trip Time Variance</span>
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +{metrics.tripTimeVariance}%
                </span>
              </div>
            </div>

            {/* On-Time Delivery */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">On-Time Delivery</span>
                <span className="text-white font-medium">{metrics.onTimeDeliveryPercent}%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${metrics.onTimeDeliveryPercent >= 90 ? 'bg-green-500' : metrics.onTimeDeliveryPercent >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${metrics.onTimeDeliveryPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Target: 90%</p>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            {/* Alert Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-center">
                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-400">{metrics.criticalAlerts}</p>
                <p className="text-xs text-slate-400">Critical</p>
              </div>
              <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-center">
                <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-yellow-400">{metrics.warningAlerts}</p>
                <p className="text-xs text-slate-400">Warning</p>
              </div>
              <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-center">
                <Wrench className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-400">{metrics.upcomingService}</p>
                <p className="text-xs text-slate-400">Scheduled</p>
              </div>
            </div>

            {/* Critical Alerts */}
            {metrics.criticalAlerts > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-400">🔴 Critical Alerts</h4>
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-white font-medium">MH-12-AB-1234 - Engine Overheating</p>
                      <p className="text-xs text-slate-400">Coolant temp: 112°C (Normal: &lt;95°C)</p>
                      <p className="text-xs text-red-400 mt-1">Action: STOP IMMEDIATELY</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-white font-medium">MH-12-CD-5678 - Brake Pad Critical</p>
                      <p className="text-xs text-slate-400">Remaining: 8% (Alert: 15%)</p>
                      <p className="text-xs text-yellow-400 mt-1">Action: Schedule service within 24h</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface UtilizationBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}

function UtilizationBar({ label, value, total, color, icon }: UtilizationBarProps) {
  const percent = Math.round((value / total) * 100);
  
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-300 flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="text-white font-medium">{value} ({percent}%)</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
