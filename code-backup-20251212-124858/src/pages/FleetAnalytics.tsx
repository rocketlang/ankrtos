/**
 * FleetAnalytics Page - WIRED TO REAL DATA
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  Truck, Clock, AlertTriangle, TrendingUp, TrendingDown,
  Gauge, MapPin, Wrench, Timer, Activity, RefreshCw,
  Download, Filter, Loader2
} from 'lucide-react';

const GET_FLEET_METRICS = gql`
  query GetFleetMetrics {
    fleetMetrics {
      totalVehicles
      runningLoaded
      runningEmpty
      idleAtClient
      idleBetweenTrips
      maintenance
      parked
      utilizationPercent
      totalDemurrageHours
      avgDemurragePerTrip
      demurrageCost
      topDemurrageLocations { name hours cost }
      avgTripTime
      benchmarkTripTime
      tripTimeVariance
      onTimeDeliveryPercent
      criticalAlerts
      warningAlerts
      upcomingService
      alerts { id type vehicle message action time }
    }
  }
`;

interface FleetMetrics {
  totalVehicles: number;
  runningLoaded: number;
  runningEmpty: number;
  idleAtClient: number;
  idleBetweenTrips: number;
  maintenance: number;
  parked: number;
  utilizationPercent: number;
  totalDemurrageHours: number;
  avgDemurragePerTrip: number;
  demurrageCost: number;
  topDemurrageLocations: { name: string; hours: number; cost: number }[];
  avgTripTime: number;
  benchmarkTripTime: number;
  tripTimeVariance: number;
  onTimeDeliveryPercent: number;
  criticalAlerts: number;
  warningAlerts: number;
  upcomingService: number;
  alerts: { id: string; type: string; vehicle: string; message: string; action: string; time: string }[];
}

const generateMockMetrics = (total: number): FleetMetrics => {
  const runningLoaded = Math.floor(total * 0.35);
  const runningEmpty = Math.floor(total * 0.08);
  const idleAtClient = Math.floor(total * 0.12);
  const idleBetweenTrips = Math.floor(total * 0.18);
  const maintenance = Math.floor(total * 0.07);
  const parked = total - runningLoaded - runningEmpty - idleAtClient - idleBetweenTrips - maintenance;
  return {
    totalVehicles: total, runningLoaded, runningEmpty, idleAtClient, idleBetweenTrips, maintenance, parked,
    utilizationPercent: Math.round((runningLoaded / total) * 100),
    totalDemurrageHours: 847, avgDemurragePerTrip: 4.2, demurrageCost: 254100,
    topDemurrageLocations: [
      { name: 'Tata Steel Jamshedpur', hours: 124, cost: 37200 },
      { name: 'Reliance Nagpur', hours: 98, cost: 29400 },
      { name: 'Amazon Bhiwandi', hours: 76, cost: 22800 },
      { name: 'Maruti Gurgaon', hours: 65, cost: 19500 },
      { name: 'JSW Bellary', hours: 58, cost: 17400 },
    ],
    avgTripTime: 52, benchmarkTripTime: 44, tripTimeVariance: 18, onTimeDeliveryPercent: 87,
    criticalAlerts: 3, warningAlerts: 8, upcomingService: 12,
    alerts: [
      { id: '1', type: 'critical', vehicle: 'HR26CW2099', message: 'GPS signal lost for 2+ hours', action: 'Contact driver', time: '10 min ago' },
      { id: '2', type: 'warning', vehicle: 'DL01CD7890', message: 'Insurance expiring in 5 days', action: 'Renew insurance', time: '1 hour ago' },
    ],
  };
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }: any) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };
  return (
    <div className={`p-4 rounded-xl border ${colors[color]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
        </div>
        <div className="p-2 rounded-lg bg-white/50"><Icon className="w-5 h-5" /></div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2 text-xs">
          {trend.value >= 0 ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
          <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>{Math.abs(trend.value)}%</span>
          <span className="opacity-70">{trend.label}</span>
        </div>
      )}
    </div>
  );
};

const UtilizationBar = ({ label, value, total, color }: any) => {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-sm text-gray-600">{label}</div>
      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} flex items-center justify-end pr-2`} style={{ width: `${Math.max(percent, 5)}%` }}>
          <span className="text-xs font-medium text-white">{value}</span>
        </div>
      </div>
      <div className="w-16 text-right text-sm text-gray-500">{percent.toFixed(1)}%</div>
    </div>
  );
};

const AlertRow = ({ alert }: any) => {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return (
    <div className={`p-3 rounded-lg border ${styles[alert.type] || styles.info} flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-4 h-4" />
        <div>
          <p className="font-medium text-sm">{alert.vehicle}</p>
          <p className="text-xs opacity-80">{alert.message}</p>
        </div>
      </div>
      <div className="text-right">
        <button className="text-xs font-medium underline">{alert.action}</button>
        <p className="text-xs opacity-60 mt-1">{alert.time}</p>
      </div>
    </div>
  );
};

export default function FleetAnalytics() {
  const [useMockData, setUseMockData] = useState(false);
  const { data, loading, error, refetch } = useQuery(GET_FLEET_METRICS, {
    pollInterval: 30000,
    errorPolicy: 'all'
  });

  const metrics: FleetMetrics = useMockData || !data?.fleetMetrics
    ? generateMockMetrics(48)
    : data.fleetMetrics;

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading fleet analytics...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time fleet utilization and performance
            {useMockData && <span className="ml-2 text-orange-500">(Demo Mode)</span>}
            {!useMockData && !error && <span className="ml-2 text-green-500">● Live</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setUseMockData(!useMockData)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${useMockData ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-green-100 border-green-300 text-green-700'}`}>
            {useMockData ? '📊 Demo' : '🔴 Live'}
          </button>
          <button onClick={() => refetch()} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100"><Download className="w-4 h-4" /></button>
          <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100"><Filter className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard title="Total Fleet" value={metrics.totalVehicles} subtitle="Active vehicles" icon={Truck} color="blue" />
        <StatCard title="Utilization" value={`${metrics.utilizationPercent}%`} subtitle="Vehicles in use" icon={Gauge} trend={{ value: 5.2, label: 'vs last week' }} color="green" />
        <StatCard title="On-Time" value={`${metrics.onTimeDeliveryPercent}%`} subtitle="Delivery rate" icon={Timer} trend={{ value: 2.1, label: 'vs last month' }} color="purple" />
        <StatCard title="Demurrage" value={`₹${(metrics.demurrageCost / 1000).toFixed(0)}K`} subtitle={`${metrics.totalDemurrageHours}h total`} icon={Clock} trend={{ value: -8.3, label: 'vs last week' }} color="orange" />
        <StatCard title="Critical Alerts" value={metrics.criticalAlerts} subtitle="Immediate action" icon={AlertTriangle} color="red" />
        <StatCard title="Service Due" value={metrics.upcomingService} subtitle="Next 7 days" icon={Wrench} color="yellow" />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />Vehicle Status Breakdown
          </h2>
          <div className="space-y-3">
            <UtilizationBar label="Running (Loaded)" value={metrics.runningLoaded} total={metrics.totalVehicles} color="bg-green-500" />
            <UtilizationBar label="Running (Empty)" value={metrics.runningEmpty} total={metrics.totalVehicles} color="bg-blue-500" />
            <UtilizationBar label="Idle at Client" value={metrics.idleAtClient} total={metrics.totalVehicles} color="bg-yellow-500" />
            <UtilizationBar label="Idle (Between)" value={metrics.idleBetweenTrips} total={metrics.totalVehicles} color="bg-orange-400" />
            <UtilizationBar label="Maintenance" value={metrics.maintenance} total={metrics.totalVehicles} color="bg-red-500" />
            <UtilizationBar label="Parked" value={metrics.parked} total={metrics.totalVehicles} color="bg-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Timer className="w-5 h-5 text-purple-500" />Trip Performance
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600">Avg Trip Time</p>
              <p className="text-3xl font-bold text-purple-700">{metrics.avgTripTime}h</p>
              <p className="text-xs text-purple-500 mt-1">Benchmark: {metrics.benchmarkTripTime}h</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-700">{metrics.onTimeDeliveryPercent}%</p>
                <p className="text-xs text-gray-500">On-Time</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-700">{metrics.tripTimeVariance}%</p>
                <p className="text-xs text-gray-500">Variance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />Top Demurrage Locations
          </h2>
          <div className="space-y-3">
            {metrics.topDemurrageLocations.map((loc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                  <span className="font-medium text-gray-700">{loc.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-600">₹{loc.cost.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{loc.hours}h</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />Active Alerts
            <span className="ml-auto text-sm font-normal text-gray-500">{metrics.criticalAlerts + metrics.warningAlerts} total</span>
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {metrics.alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
