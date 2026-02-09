import React, { useState, useMemo } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface Port {
  id: string;
  name: string;
  country: string;
  flag: string;
  congestionLevel: 'low' | 'medium' | 'high' | 'critical';
  vesselsWaiting: number;
  averageWaitTime: number;
  berthsTotal: number;
  berthsAvailable: number;
  nextAvailable: string;
  trends: 'improving' | 'stable' | 'worsening';
  costIndex: number;
  efficiency: number;
}

interface BerthStatus {
  berthNumber: string;
  status: 'available' | 'occupied' | 'maintenance';
  vessel?: string;
  cargo?: string;
  eta?: string;
  etd?: string;
  delay?: number;
}

interface VesselQueue {
  position: number;
  vesselName: string;
  imo: string;
  arrival: string;
  waitTime: number;
  cargoType: string;
  priority: 'normal' | 'high' | 'urgent';
  estimatedBerthTime: string;
}

interface PortCost {
  category: string;
  amount: number;
  unit: string;
  notes?: string;
}

interface HistoricalData {
  month: string;
  avgWaitTime: number;
  congestionScore: number;
  vesselCalls: number;
}

const PortIntelligenceShowcase: React.FC = () => {
  const [selectedPort, setSelectedPort] = useState<string>('singapore');
  const [timeRange, setTimeRange] = useState<string>('7D');

  const ports: Port[] = [
    {
      id: 'singapore',
      name: 'Port of Singapore',
      country: 'Singapore',
      flag: '🇸🇬',
      congestionLevel: 'low',
      vesselsWaiting: 12,
      averageWaitTime: 0.8,
      berthsTotal: 68,
      berthsAvailable: 14,
      nextAvailable: '2026-02-10 06:00',
      trends: 'stable',
      costIndex: 85,
      efficiency: 98,
    },
    {
      id: 'shanghai',
      name: 'Port of Shanghai',
      country: 'China',
      flag: '🇨🇳',
      congestionLevel: 'medium',
      vesselsWaiting: 45,
      averageWaitTime: 2.3,
      berthsTotal: 125,
      berthsAvailable: 8,
      nextAvailable: '2026-02-11 14:00',
      trends: 'worsening',
      costIndex: 72,
      efficiency: 91,
    },
    {
      id: 'rotterdam',
      name: 'Port of Rotterdam',
      country: 'Netherlands',
      flag: '🇳🇱',
      congestionLevel: 'medium',
      vesselsWaiting: 28,
      averageWaitTime: 1.5,
      berthsTotal: 85,
      berthsAvailable: 11,
      nextAvailable: '2026-02-10 18:00',
      trends: 'improving',
      costIndex: 91,
      efficiency: 94,
    },
    {
      id: 'losangeles',
      name: 'Port of Los Angeles',
      country: 'United States',
      flag: '🇺🇸',
      congestionLevel: 'high',
      vesselsWaiting: 67,
      averageWaitTime: 4.2,
      berthsTotal: 42,
      berthsAvailable: 2,
      nextAvailable: '2026-02-13 10:00',
      trends: 'worsening',
      costIndex: 88,
      efficiency: 78,
    },
    {
      id: 'durban',
      name: 'Port of Durban',
      country: 'South Africa',
      flag: '🇿🇦',
      congestionLevel: 'critical',
      vesselsWaiting: 92,
      averageWaitTime: 7.8,
      berthsTotal: 28,
      berthsAvailable: 0,
      nextAvailable: '2026-02-16 08:00',
      trends: 'worsening',
      costIndex: 65,
      efficiency: 62,
    },
  ];

  const berthStatuses: BerthStatus[] = [
    {
      berthNumber: 'TB-1',
      status: 'occupied',
      vessel: 'MV PACIFIC CROWN',
      cargo: 'Containers',
      eta: '2026-02-08 14:00',
      etd: '2026-02-10 08:00',
    },
    {
      berthNumber: 'TB-2',
      status: 'occupied',
      vessel: 'MV OCEAN SPIRIT',
      cargo: 'Bulk Cargo',
      eta: '2026-02-07 09:00',
      etd: '2026-02-10 16:00',
      delay: 8,
    },
    {
      berthNumber: 'TB-3',
      status: 'available',
      estimatedBerthTime: '2026-02-10 06:00',
    },
    {
      berthNumber: 'TB-4',
      status: 'occupied',
      vessel: 'MV FORTUNE STAR',
      cargo: 'General Cargo',
      eta: '2026-02-09 11:00',
      etd: '2026-02-11 04:00',
    },
    {
      berthNumber: 'TB-5',
      status: 'maintenance',
    },
    {
      berthNumber: 'TB-6',
      status: 'available',
      estimatedBerthTime: '2026-02-10 18:00',
    },
  ];

  const vesselQueue: VesselQueue[] = [
    {
      position: 1,
      vesselName: 'MV GOLDEN BRIDGE',
      imo: 'IMO 9876543',
      arrival: '2026-02-09 18:30',
      waitTime: 0.5,
      cargoType: 'Containers',
      priority: 'high',
      estimatedBerthTime: '2026-02-10 06:00',
    },
    {
      position: 2,
      vesselName: 'MV ASIA TRADER',
      imo: 'IMO 9854321',
      arrival: '2026-02-09 22:15',
      waitTime: 0.7,
      cargoType: 'Bulk',
      priority: 'normal',
      estimatedBerthTime: '2026-02-10 12:00',
    },
    {
      position: 3,
      vesselName: 'MV MEDITERRANEAN STAR',
      imo: 'IMO 9765432',
      arrival: '2026-02-10 01:00',
      waitTime: 0.9,
      cargoType: 'General',
      priority: 'normal',
      estimatedBerthTime: '2026-02-10 18:00',
    },
    {
      position: 4,
      vesselName: 'MV CARGO EXPRESS',
      imo: 'IMO 9712345',
      arrival: '2026-02-10 04:30',
      waitTime: 1.2,
      cargoType: 'Containers',
      priority: 'urgent',
      estimatedBerthTime: '2026-02-11 02:00',
    },
  ];

  const portCosts: PortCost[] = [
    {
      category: 'Port Dues',
      amount: 12500,
      unit: 'per call',
      notes: 'Based on GRT',
    },
    {
      category: 'Berth Hire',
      amount: 2800,
      unit: 'per day',
      notes: 'Container terminal',
    },
    {
      category: 'Pilotage',
      amount: 4200,
      unit: 'per movement',
      notes: 'Inbound + Outbound',
    },
    {
      category: 'Tugboat Assistance',
      amount: 3500,
      unit: 'per movement',
      notes: '2 tugs required',
    },
    {
      category: 'Line Handling',
      amount: 850,
      unit: 'per call',
    },
    {
      category: 'Agency Fees',
      amount: 2500,
      unit: 'per call',
      notes: 'Estimated',
    },
  ];

  const historicalData: HistoricalData[] = [
    { month: 'Aug', avgWaitTime: 1.2, congestionScore: 35, vesselCalls: 2450 },
    { month: 'Sep', avgWaitTime: 0.9, congestionScore: 28, vesselCalls: 2520 },
    { month: 'Oct', avgWaitTime: 1.1, congestionScore: 32, vesselCalls: 2480 },
    { month: 'Nov', avgWaitTime: 0.7, congestionScore: 22, vesselCalls: 2380 },
    { month: 'Dec', avgWaitTime: 0.9, congestionScore: 26, vesselCalls: 2290 },
    { month: 'Jan', avgWaitTime: 0.8, congestionScore: 24, vesselCalls: 2410 },
  ];

  const selectedPortData = ports.find((p) => p.id === selectedPort) || ports[0];

  const totalPortCosts = useMemo(() => {
    return portCosts.reduce((sum, cost) => {
      if (cost.unit === 'per call') return sum + cost.amount;
      if (cost.unit === 'per day') return sum + cost.amount * 2; // Assume 2 days
      if (cost.unit === 'per movement') return sum + cost.amount * 2; // In + Out
      return sum;
    }, 0);
  }, []);

  const getCongestionColor = (level: string) => {
    if (level === 'low') return 'text-green-400 bg-green-900/30 border-green-500/50';
    if (level === 'medium') return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50';
    if (level === 'high') return 'text-orange-400 bg-orange-900/30 border-orange-500/50';
    return 'text-red-400 bg-red-900/30 border-red-500/50';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '📈';
    if (trend === 'stable') return '➡️';
    return '📉';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return 'text-green-400';
    if (trend === 'stable') return 'text-blue-400';
    return 'text-red-400';
  };

  const getBerthStatusColor = (status: string) => {
    if (status === 'available') return 'bg-green-900/30 text-green-400 border-green-500/50';
    if (status === 'occupied') return 'bg-blue-900/30 text-blue-400 border-blue-500/50';
    return 'bg-gray-800 text-gray-400 border-gray-600';
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'urgent') return 'bg-red-900/30 text-red-400';
    if (priority === 'high') return 'bg-orange-900/30 text-orange-400';
    return 'bg-gray-800 text-gray-400';
  };

  return (
    <ShowcaseLayout
      title="Port Intelligence"
      icon="⚓"
      category="Port Operations"
      problem="Port agents provide outdated congestion info via email, berth availability is uncertain until arrival, and vessels often face unexpected delays costing $20,000-$50,000 per day - resulting in inefficient scheduling and budget overruns."
      solution="Real-time port intelligence platform aggregating AIS data, berth schedules, historical patterns, and agent reports to provide accurate congestion forecasts, optimal arrival windows, and proactive delay alerts - reducing average port waiting time by 65%."
      timeSaved="Manual calls → Real-time"
      roi="22x"
      accuracy="65% wait time reduction"
      nextSection={{
        title: 'Port Operations',
        path: '/demo-showcase/port-operations',
      }}
    >
      <div className="space-y-6">
        {/* Port Selection */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Global Port Monitoring</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {ports.map((port) => (
              <div
                key={port.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPort === port.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
                onClick={() => setSelectedPort(port.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{port.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">
                      {port.name}
                    </div>
                    <div className="text-xs text-gray-500">{port.country}</div>
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-bold text-center border ${getCongestionColor(
                    port.congestionLevel
                  )}`}
                >
                  {port.congestionLevel.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Port Overview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              {selectedPortData.flag} {selectedPortData.name} - Live Status
            </h3>
            <span className="text-sm text-gray-400">Updated 2 min ago</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Congestion Level</div>
              <div
                className={`text-2xl font-bold capitalize ${
                  selectedPortData.congestionLevel === 'low'
                    ? 'text-green-400'
                    : selectedPortData.congestionLevel === 'medium'
                    ? 'text-yellow-400'
                    : selectedPortData.congestionLevel === 'high'
                    ? 'text-orange-400'
                    : 'text-red-400'
                }`}
              >
                {selectedPortData.congestionLevel}
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Vessels Waiting</div>
              <div className="text-2xl font-bold text-white">
                {selectedPortData.vesselsWaiting}
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Avg Wait Time</div>
              <div className="text-2xl font-bold text-white">
                {selectedPortData.averageWaitTime} days
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Berth Availability</div>
              <div className="text-2xl font-bold text-white">
                {selectedPortData.berthsAvailable}/{selectedPortData.berthsTotal}
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Efficiency Score</div>
              <div className="text-2xl font-bold text-blue-400">
                {selectedPortData.efficiency}%
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Trend</div>
              <div className={`text-xl font-bold flex items-center gap-2 ${getTrendColor(selectedPortData.trends)}`}>
                <span className="text-2xl">{getTrendIcon(selectedPortData.trends)}</span>
                {selectedPortData.trends}
              </div>
            </div>
          </div>
        </div>

        {/* Berth Status */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Real-time Berth Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {berthStatuses.map((berth) => (
              <div
                key={berth.berthNumber}
                className={`border-2 rounded-lg p-4 ${getBerthStatusColor(berth.status)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold">{berth.berthNumber}</h4>
                  <span className="px-2 py-1 bg-gray-900/50 rounded text-xs font-semibold uppercase">
                    {berth.status}
                  </span>
                </div>

                {berth.status === 'occupied' && berth.vessel && (
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-400">Vessel</div>
                      <div className="text-white font-medium">{berth.vessel}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Cargo</div>
                      <div className="text-white text-sm">{berth.cargo}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-gray-400">ETD</div>
                        <div className="text-white text-xs">{berth.etd}</div>
                      </div>
                      {berth.delay && (
                        <div>
                          <div className="text-xs text-red-400">Delay</div>
                          <div className="text-red-400 text-xs font-semibold">
                            +{berth.delay}h
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {berth.status === 'available' && (
                  <div>
                    <div className="text-xs text-gray-400">Next Available</div>
                    <div className="text-white font-medium">{berth.estimatedBerthTime}</div>
                  </div>
                )}

                {berth.status === 'maintenance' && (
                  <div className="text-sm text-gray-400">Under maintenance</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vessel Queue */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Vessel Queue & Estimated Berth Times
          </h3>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                    Position
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                    Vessel
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                    Arrival
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">
                    Wait Time
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                    Cargo Type
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400">
                    Priority
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                    Est. Berth Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {vesselQueue.map((vessel) => (
                  <tr key={vessel.position} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-900/50 text-blue-400 font-bold text-sm">
                        {vessel.position}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{vessel.vesselName}</div>
                      <div className="text-xs text-gray-500">{vessel.imo}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{vessel.arrival}</td>
                    <td className="px-4 py-3 text-sm text-right text-white font-semibold">
                      {vessel.waitTime.toFixed(1)} days
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{vessel.cargoType}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase ${getPriorityColor(
                          vessel.priority
                        )}`}
                      >
                        {vessel.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {vessel.estimatedBerthTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Port Costs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Estimated Port Costs
            </h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <tbody className="divide-y divide-gray-700/50">
                  {portCosts.map((cost, idx) => (
                    <tr key={idx} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{cost.category}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-white">
                        ${cost.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{cost.unit}</td>
                      {cost.notes && (
                        <td className="px-4 py-3 text-xs text-gray-500">{cost.notes}</td>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-blue-900/20">
                    <td className="px-4 py-3 text-sm font-bold text-white">TOTAL</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-blue-400">
                      ${totalPortCosts.toLocaleString()}
                    </td>
                    <td colSpan={2} className="px-4 py-3 text-xs text-gray-400">
                      Estimated 2-day call
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Historical Trends (6 Months)
            </h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="space-y-4">
                {/* Wait Time Chart */}
                <div>
                  <div className="text-sm font-semibold text-gray-400 mb-2">
                    Average Wait Time (days)
                  </div>
                  <div className="flex items-end gap-2 h-24">
                    {historicalData.map((data, idx) => {
                      const maxWait = Math.max(...historicalData.map((d) => d.avgWaitTime));
                      const height = (data.avgWaitTime / maxWait) * 100;
                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <div
                            className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-500"
                            style={{ height: `${height}%` }}
                            title={`${data.month}: ${data.avgWaitTime} days`}
                          />
                          <div className="text-xs text-gray-500">{data.month}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Current</div>
                    <div className="text-lg font-bold text-white">
                      {historicalData[historicalData.length - 1].avgWaitTime} days
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">6-Mo Avg</div>
                    <div className="text-lg font-bold text-blue-400">
                      {(
                        historicalData.reduce((sum, d) => sum + d.avgWaitTime, 0) /
                        historicalData.length
                      ).toFixed(1)}{' '}
                      days
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Best</div>
                    <div className="text-lg font-bold text-green-400">
                      {Math.min(...historicalData.map((d) => d.avgWaitTime))} days
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>💡</span> AI-Powered Arrival Recommendations
          </h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="text-green-400 font-bold text-xl">✓</div>
              <div className="flex-1">
                <div className="text-white font-semibold mb-1">
                  Optimal Arrival Window: Feb 10, 04:00 - 08:00
                </div>
                <div className="text-sm text-gray-300">
                  Berth TB-3 available at 06:00. Arrive slightly early to secure position
                  #1 in queue and avoid 0.8-day average wait.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-yellow-400 font-bold text-xl">⚠</div>
              <div className="flex-1">
                <div className="text-white font-semibold mb-1">
                  Avoid Arrival: Feb 12-14
                </div>
                <div className="text-sm text-gray-300">
                  Predicted congestion spike due to 8 scheduled container vessel arrivals.
                  Wait time may exceed 2 days.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-blue-400 font-bold text-xl">💰</div>
              <div className="flex-1">
                <div className="text-white font-semibold mb-1">
                  Estimated Cost Savings: $42,000
                </div>
                <div className="text-sm text-gray-300">
                  By arriving in optimal window vs. average wait scenario (2.1 days saved
                  × $20,000/day).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
};

export default PortIntelligenceShowcase;
