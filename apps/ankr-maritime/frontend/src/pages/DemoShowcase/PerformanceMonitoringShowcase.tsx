import React, { useState, useMemo } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface Vessel {
  id: string;
  name: string;
  type: string;
  dwt: number;
  avgSpeed: number;
  targetSpeed: number;
  fuelConsumption: number;
  targetConsumption: number;
  efficiency: number;
  ciiRating: 'A' | 'B' | 'C' | 'D' | 'E';
  co2Emissions: number;
  status: 'excellent' | 'good' | 'average' | 'below-target';
}

interface PerformanceMetric {
  name: string;
  current: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

interface EmissionData {
  type: string;
  amount: number;
  unit: string;
  limit?: number;
  status: 'compliant' | 'warning' | 'exceeded';
}

interface HistoricalPerformance {
  month: string;
  fuelEfficiency: number;
  avgSpeed: number;
  co2Emissions: number;
  ciiScore: number;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  savings?: number;
}

const PerformanceMonitoringShowcase: React.FC = () => {
  const [selectedVessel, setSelectedVessel] = useState<string>('ocean-spirit');
  const [timeRange, setTimeRange] = useState<string>('30D');

  const vessels: Vessel[] = [
    {
      id: 'ocean-spirit',
      name: 'MV OCEAN SPIRIT',
      type: 'Bulk Carrier',
      dwt: 82000,
      avgSpeed: 11.8,
      targetSpeed: 12.0,
      fuelConsumption: 28.5,
      targetConsumption: 30.0,
      efficiency: 95.2,
      ciiRating: 'B',
      co2Emissions: 1245,
      status: 'excellent',
    },
    {
      id: 'fortune-star',
      name: 'MV FORTUNE STAR',
      type: 'Bulk Carrier',
      dwt: 76000,
      avgSpeed: 11.2,
      targetSpeed: 12.0,
      fuelConsumption: 31.8,
      targetConsumption: 29.0,
      efficiency: 87.5,
      ciiRating: 'C',
      co2Emissions: 1389,
      status: 'average',
    },
    {
      id: 'pacific-crown',
      name: 'MV PACIFIC CROWN',
      type: 'Bulk Carrier',
      dwt: 81500,
      avgSpeed: 12.3,
      targetSpeed: 12.0,
      fuelConsumption: 27.2,
      targetConsumption: 30.0,
      efficiency: 98.1,
      ciiRating: 'A',
      co2Emissions: 1189,
      status: 'excellent',
    },
    {
      id: 'golden-bridge',
      name: 'MV GOLDEN BRIDGE',
      type: 'Container',
      dwt: 65000,
      avgSpeed: 10.5,
      targetSpeed: 12.5,
      fuelConsumption: 35.2,
      targetConsumption: 32.0,
      efficiency: 82.3,
      ciiRating: 'D',
      co2Emissions: 1542,
      status: 'below-target',
    },
  ];

  const performanceMetrics: PerformanceMetric[] = [
    {
      name: 'Fuel Efficiency',
      current: 28.5,
      target: 30.0,
      unit: 'MT/day',
      trend: 'down',
      changePercent: -5.0,
    },
    {
      name: 'Speed Performance',
      current: 11.8,
      target: 12.0,
      unit: 'knots',
      trend: 'stable',
      changePercent: -1.7,
    },
    {
      name: 'Hull Performance',
      current: 95.2,
      target: 95.0,
      unit: '%',
      trend: 'stable',
      changePercent: 0.2,
    },
    {
      name: 'Main Engine Efficiency',
      current: 92.8,
      target: 90.0,
      unit: '%',
      trend: 'up',
      changePercent: 3.1,
    },
    {
      name: 'CO₂ per Mile',
      current: 52.3,
      target: 55.0,
      unit: 'kg/nm',
      trend: 'down',
      changePercent: -4.9,
    },
    {
      name: 'EEOI Index',
      current: 8.2,
      target: 9.0,
      unit: 'gCO₂/t·nm',
      trend: 'down',
      changePercent: -8.9,
    },
  ];

  const emissionsData: EmissionData[] = [
    {
      type: 'CO₂',
      amount: 1245,
      unit: 'MT/month',
      limit: 1400,
      status: 'compliant',
    },
    {
      type: 'SOx',
      amount: 2.8,
      unit: 'MT/month',
      limit: 3.5,
      status: 'compliant',
    },
    {
      type: 'NOx',
      amount: 18.5,
      unit: 'MT/month',
      limit: 22.0,
      status: 'compliant',
    },
    {
      type: 'Particulate Matter',
      amount: 0.42,
      unit: 'MT/month',
      limit: 0.50,
      status: 'compliant',
    },
  ];

  const historicalData: HistoricalPerformance[] = [
    {
      month: 'Aug',
      fuelEfficiency: 29.8,
      avgSpeed: 11.5,
      co2Emissions: 1302,
      ciiScore: 6.8,
    },
    {
      month: 'Sep',
      fuelEfficiency: 29.2,
      avgSpeed: 11.6,
      co2Emissions: 1278,
      ciiScore: 6.5,
    },
    {
      month: 'Oct',
      fuelEfficiency: 28.9,
      avgSpeed: 11.7,
      co2Emissions: 1265,
      ciiScore: 6.3,
    },
    {
      month: 'Nov',
      fuelEfficiency: 28.7,
      avgSpeed: 11.8,
      co2Emissions: 1256,
      ciiScore: 6.2,
    },
    {
      month: 'Dec',
      fuelEfficiency: 28.6,
      avgSpeed: 11.8,
      co2Emissions: 1249,
      ciiScore: 6.1,
    },
    {
      month: 'Jan',
      fuelEfficiency: 28.5,
      avgSpeed: 11.8,
      co2Emissions: 1245,
      ciiScore: 6.0,
    },
  ];

  const recommendations: Recommendation[] = [
    {
      priority: 'high',
      category: 'Hull Maintenance',
      title: 'Schedule Hull Cleaning',
      description:
        'Hull fouling detected - performance drop of 2.3% over last 90 days. Cleaning will restore optimal resistance.',
      impact: 'Improve fuel efficiency by 3-5%',
      savings: 42000,
    },
    {
      priority: 'high',
      category: 'Speed Optimization',
      title: 'Reduce Speed by 0.5 Knots',
      description:
        'Current speed (11.8 kts) exceeds optimal for weather conditions. Reduce to 11.3 kts on current route.',
      impact: 'Save 2.8 MT fuel/day',
      savings: 58000,
    },
    {
      priority: 'medium',
      category: 'Route Planning',
      title: 'Optimize Weather Routing',
      description:
        'Forecasted headwinds on current route. Alternative route adds 45nm but saves 6.5 MT fuel.',
      impact: 'Net savings of 4.2 MT fuel',
      savings: 12000,
    },
    {
      priority: 'medium',
      category: 'Engine Tuning',
      title: 'Main Engine Performance Check',
      description:
        'Engine efficiency trending down 1.2% over last 60 days. Schedule maintenance during next port call.',
      impact: 'Restore 1-2% efficiency',
      savings: 18000,
    },
    {
      priority: 'low',
      category: 'Trim Optimization',
      title: 'Adjust Vessel Trim',
      description:
        'Current trim: 0.8m by stern. Optimal trim for current draft: 0.5m by stern.',
      impact: 'Improve fuel efficiency by 0.5-1%',
      savings: 8000,
    },
  ];

  const selectedVesselData = vessels.find((v) => v.id === selectedVessel) || vessels[0];

  const fleetAverage = useMemo(() => {
    return {
      efficiency: vessels.reduce((sum, v) => sum + v.efficiency, 0) / vessels.length,
      fuelConsumption:
        vessels.reduce((sum, v) => sum + v.fuelConsumption, 0) / vessels.length,
      speed: vessels.reduce((sum, v) => sum + v.avgSpeed, 0) / vessels.length,
    };
  }, []);

  const getCIIColor = (rating: string) => {
    if (rating === 'A') return 'bg-green-600 text-white';
    if (rating === 'B') return 'bg-green-500 text-white';
    if (rating === 'C') return 'bg-yellow-500 text-white';
    if (rating === 'D') return 'bg-orange-500 text-white';
    return 'bg-red-600 text-white';
  };

  const getStatusColor = (status: string) => {
    if (status === 'excellent') return 'text-green-400 bg-green-900/30';
    if (status === 'good') return 'text-blue-400 bg-blue-900/30';
    if (status === 'average') return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  const getTrendColor = (changePercent: number) => {
    // For most metrics, negative is good (lower consumption/emissions)
    if (changePercent < -2) return 'text-green-400';
    if (changePercent < 2) return 'text-gray-400';
    return 'text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-900/30 text-red-400 border-red-500/50';
    if (priority === 'medium') return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50';
    return 'bg-blue-900/30 text-blue-400 border-blue-500/50';
  };

  const getEmissionStatusColor = (status: string) => {
    if (status === 'compliant') return 'text-green-400';
    if (status === 'warning') return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <ShowcaseLayout
      title="Performance Monitoring"
      icon="📊"
      category="Fleet Analytics"
      problem="Performance data scattered across noon reports, manual Excel sheets, and delayed monthly reports - making it impossible to identify inefficiencies, optimize operations, or prove CII compliance in real-time."
      solution="Real-time performance analytics platform integrating AIS data, noon reports, and sensor data to deliver instant KPIs, predictive maintenance alerts, and AI-powered optimization recommendations - improving fleet efficiency by average 12% and ensuring regulatory compliance."
      timeSaved="Monthly reports → Real-time"
      roi="32x"
      accuracy="12% efficiency gain"
      nextSection={{
        title: 'Document Chain',
        path: '/demo-showcase/document-chain',
      }}
    >
      <div className="space-y-6">
        {/* Vessel Selection */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Fleet Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {vessels.map((vessel) => (
              <div
                key={vessel.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedVessel === vessel.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
                onClick={() => setSelectedVessel(vessel.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">
                      {vessel.name}
                    </div>
                    <div className="text-xs text-gray-500">{vessel.type}</div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded font-bold text-xs ${getCIIColor(
                      vessel.ciiRating
                    )}`}
                  >
                    CII {vessel.ciiRating}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Efficiency:</span>
                    <span className="text-white font-semibold">{vessel.efficiency}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Fuel:</span>
                    <span className="text-white font-semibold">
                      {vessel.fuelConsumption} MT/day
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vessel Details */}
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{selectedVesselData.name}</h3>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                  selectedVesselData.status
                )}`}
              >
                {selectedVesselData.status}
              </span>
              <div
                className={`px-4 py-2 rounded-lg font-bold text-lg ${getCIIColor(
                  selectedVesselData.ciiRating
                )}`}
              >
                CII Rating: {selectedVesselData.ciiRating}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">DWT</div>
              <div className="text-white font-semibold text-lg">
                {selectedVesselData.dwt.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Avg Speed</div>
              <div className="text-white font-semibold text-lg">
                {selectedVesselData.avgSpeed} kts
              </div>
              <div className="text-xs text-gray-500">
                Target: {selectedVesselData.targetSpeed}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Fuel Consumption</div>
              <div className="text-white font-semibold text-lg">
                {selectedVesselData.fuelConsumption} MT/day
              </div>
              <div className="text-xs text-gray-500">
                Target: {selectedVesselData.targetConsumption}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Overall Efficiency</div>
              <div className="text-green-400 font-bold text-lg">
                {selectedVesselData.efficiency}%
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Key Performance Indicators
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceMetrics.map((metric, idx) => (
              <div
                key={idx}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-medium text-gray-400">{metric.name}</div>
                  <span className="text-xl">{getTrendIcon(metric.trend)}</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <div className="text-2xl font-bold text-white">
                    {metric.current.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">{metric.unit}</div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Target: {metric.target.toFixed(1)} {metric.unit}
                  </span>
                  <span
                    className={`font-semibold ${getTrendColor(metric.changePercent)}`}
                  >
                    {metric.changePercent > 0 ? '+' : ''}
                    {metric.changePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        metric.current <= metric.target
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          (metric.current / metric.target) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emissions Tracking */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Emissions Monitoring & Compliance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {emissionsData.map((emission, idx) => (
              <div
                key={idx}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-400">{emission.type}</div>
                  <span
                    className={`text-xl ${getEmissionStatusColor(emission.status)}`}
                  >
                    {emission.status === 'compliant' ? '✓' : '⚠'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {emission.amount.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 mb-3">{emission.unit}</div>
                {emission.limit && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Limit:</span>
                      <span className="text-white">{emission.limit}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          emission.status === 'compliant'
                            ? 'bg-green-500'
                            : emission.status === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{
                          width: `${(emission.amount / emission.limit) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Historical Trends */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Performance Trends (6 Months)
            </h3>
            <div className="flex gap-2">
              {['7D', '30D', '90D', '6M', '1Y'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fuel Efficiency Chart */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-400 mb-3">
                Fuel Consumption (MT/day)
              </div>
              <div className="flex items-end gap-2 h-32 mb-3">
                {historicalData.map((data, idx) => {
                  const maxFuel = Math.max(
                    ...historicalData.map((d) => d.fuelEfficiency)
                  );
                  const height = (data.fuelEfficiency / maxFuel) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-green-600 rounded-t transition-all hover:bg-green-500"
                        style={{ height: `${height}%` }}
                        title={`${data.month}: ${data.fuelEfficiency} MT/day`}
                      />
                      <div className="text-xs text-gray-500">{data.month}</div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-gray-400">
                Trend: Improving by 0.2 MT/day per month
              </div>
            </div>

            {/* CO2 Emissions Chart */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-400 mb-3">
                CO₂ Emissions (MT/month)
              </div>
              <div className="flex items-end gap-2 h-32 mb-3">
                {historicalData.map((data, idx) => {
                  const maxEmissions = Math.max(
                    ...historicalData.map((d) => d.co2Emissions)
                  );
                  const height = (data.co2Emissions / maxEmissions) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-500"
                        style={{ height: `${height}%` }}
                        title={`${data.month}: ${data.co2Emissions} MT`}
                      />
                      <div className="text-xs text-gray-500">{data.month}</div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-gray-400">
                Trend: Reducing by 9.5 MT/month (4.5% improvement)
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Comparison */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Fleet Benchmark Comparison
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-gray-400 text-sm mb-2">Current Vessel</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Efficiency:</span>
                  <span className="text-white font-semibold">
                    {selectedVesselData.efficiency}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Fuel:</span>
                  <span className="text-white font-semibold">
                    {selectedVesselData.fuelConsumption} MT/day
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Speed:</span>
                  <span className="text-white font-semibold">
                    {selectedVesselData.avgSpeed} kts
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-2">Fleet Average</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Efficiency:</span>
                  <span className="text-blue-400 font-semibold">
                    {fleetAverage.efficiency.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Fuel:</span>
                  <span className="text-blue-400 font-semibold">
                    {fleetAverage.fuelConsumption.toFixed(1)} MT/day
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Speed:</span>
                  <span className="text-blue-400 font-semibold">
                    {fleetAverage.speed.toFixed(1)} kts
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-2">Variance</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Efficiency:</span>
                  <span
                    className={`font-semibold ${
                      selectedVesselData.efficiency > fleetAverage.efficiency
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {selectedVesselData.efficiency > fleetAverage.efficiency ? '+' : ''}
                    {(selectedVesselData.efficiency - fleetAverage.efficiency).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Fuel:</span>
                  <span
                    className={`font-semibold ${
                      selectedVesselData.fuelConsumption < fleetAverage.fuelConsumption
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {selectedVesselData.fuelConsumption < fleetAverage.fuelConsumption
                      ? ''
                      : '+'}
                    {(
                      selectedVesselData.fuelConsumption - fleetAverage.fuelConsumption
                    ).toFixed(1)}{' '}
                    MT/day
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Speed:</span>
                  <span
                    className={`font-semibold ${
                      selectedVesselData.avgSpeed > fleetAverage.speed
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {selectedVesselData.avgSpeed > fleetAverage.speed ? '+' : ''}
                    {(selectedVesselData.avgSpeed - fleetAverage.speed).toFixed(1)} kts
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            AI-Powered Optimization Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`border-2 rounded-lg p-4 ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold uppercase ${getPriorityColor(
                          rec.priority
                        )}`}
                      >
                        {rec.priority}
                      </span>
                      <span className="text-xs text-gray-400">{rec.category}</span>
                    </div>
                    <h4 className="text-white font-semibold text-lg">{rec.title}</h4>
                  </div>
                  {rec.savings && (
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-xl">
                        ${(rec.savings / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-gray-400">potential savings</div>
                    </div>
                  )}
                </div>
                <p className="text-gray-300 text-sm mb-2">{rec.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Impact:</span>
                  <span className="text-sm text-blue-400 font-medium">{rec.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📈</span> Performance Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Total Potential Savings</div>
              <div className="text-2xl font-bold text-green-400">$138K</div>
              <div className="text-xs text-gray-500">per month</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Efficiency Improvement</div>
              <div className="text-2xl font-bold text-blue-400">8-12%</div>
              <div className="text-xs text-gray-500">achievable</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">CII Rating Progress</div>
              <div className="text-2xl font-bold text-purple-400">B → A</div>
              <div className="text-xs text-gray-500">with optimizations</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">CO₂ Reduction</div>
              <div className="text-2xl font-bold text-yellow-400">156 MT</div>
              <div className="text-xs text-gray-500">per month</div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
};

export default PerformanceMonitoringShowcase;
