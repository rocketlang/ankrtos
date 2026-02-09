import React, { useState, useMemo } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface MarketIndex {
  name: string;
  code: string;
  value: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  trend: 'up' | 'down' | 'stable';
}

interface FreightRate {
  route: string;
  vesselType: string;
  rate: number;
  unit: string;
  change: number;
  changePercent: number;
  volume: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface MarketIndicator {
  name: string;
  value: string;
  trend: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface HistoricalData {
  date: string;
  bdi: number;
  capesizeRate: number;
  panamaxRate: number;
}

const MarketIntelligenceShowcase: React.FC = () => {
  const [selectedVesselType, setSelectedVesselType] = useState<string>('Capesize');
  const [timeRange, setTimeRange] = useState<string>('1M');

  const balticIndices: MarketIndex[] = [
    {
      name: 'Baltic Dry Index',
      code: 'BDI',
      value: 1847,
      change: 52,
      changePercent: 2.9,
      high: 1895,
      low: 1795,
      trend: 'up',
    },
    {
      name: 'Baltic Capesize Index',
      code: 'BCI',
      value: 2654,
      change: 118,
      changePercent: 4.65,
      high: 2702,
      low: 2536,
      trend: 'up',
    },
    {
      name: 'Baltic Panamax Index',
      code: 'BPI',
      value: 1523,
      change: -23,
      changePercent: -1.49,
      high: 1568,
      low: 1501,
      trend: 'down',
    },
    {
      name: 'Baltic Supramax Index',
      code: 'BSI',
      value: 1189,
      change: 8,
      changePercent: 0.68,
      high: 1205,
      low: 1165,
      trend: 'stable',
    },
    {
      name: 'Baltic Handysize Index',
      code: 'BHSI',
      value: 892,
      change: -5,
      changePercent: -0.56,
      high: 912,
      low: 885,
      trend: 'down',
    },
  ];

  const freightRates: FreightRate[] = [
    {
      route: 'Australia → China (Iron Ore)',
      vesselType: 'Capesize 180k dwt',
      rate: 12.50,
      unit: '$/ton',
      change: 0.75,
      changePercent: 6.38,
      volume: 285000,
      sentiment: 'bullish',
    },
    {
      route: 'Brazil → China (Iron Ore)',
      vesselType: 'Capesize 180k dwt',
      rate: 24.80,
      unit: '$/ton',
      change: 1.20,
      changePercent: 5.08,
      volume: 176000,
      sentiment: 'bullish',
    },
    {
      route: 'US Gulf → Far East (Grain)',
      vesselType: 'Panamax 82k dwt',
      rate: 35.25,
      unit: '$/ton',
      change: -1.50,
      changePercent: -4.08,
      volume: 68000,
      sentiment: 'bearish',
    },
    {
      route: 'EC South America → Far East (Grain)',
      vesselType: 'Panamax 82k dwt',
      rate: 42.00,
      unit: '$/ton',
      change: -0.75,
      changePercent: -1.75,
      volume: 52000,
      sentiment: 'bearish',
    },
    {
      route: 'Indonesia → India (Coal)',
      vesselType: 'Supramax 58k dwt',
      rate: 18.50,
      unit: '$/ton',
      change: 0.25,
      changePercent: 1.37,
      volume: 125000,
      sentiment: 'neutral',
    },
    {
      route: 'Black Sea → Mediterranean (Grain)',
      vesselType: 'Handysize 35k dwt',
      rate: 28.75,
      unit: '$/ton',
      change: -0.50,
      changePercent: -1.71,
      volume: 42000,
      sentiment: 'neutral',
    },
  ];

  const marketIndicators: MarketIndicator[] = [
    {
      name: 'Fleet Utilization',
      value: '87.3%',
      trend: 'positive',
      description: 'Above 5-year average of 82%',
    },
    {
      name: 'Orderbook/Fleet Ratio',
      value: '6.8%',
      trend: 'positive',
      description: 'Historically low - tight supply',
    },
    {
      name: 'Iron Ore Shipments',
      value: '128.5M tons',
      trend: 'positive',
      description: 'Up 8.2% YoY - strong Chinese demand',
    },
    {
      name: 'Grain Exports (Q1)',
      value: '42.3M tons',
      trend: 'negative',
      description: 'Down 3.5% vs Q1 2025',
    },
    {
      name: 'Average Bunker Price (VLSFO)',
      value: '$685/mt',
      trend: 'neutral',
      description: 'Stable range $670-700 for 3 months',
    },
    {
      name: 'Port Congestion Index',
      value: '5.2 days',
      trend: 'positive',
      description: 'Below 6-day threshold - improving',
    },
  ];

  const historicalData: HistoricalData[] = [
    { date: 'Jan 9', bdi: 1652, capesizeRate: 9.80, panamaxRate: 37.20 },
    { date: 'Jan 16', bdi: 1695, capesizeRate: 10.30, panamaxRate: 36.50 },
    { date: 'Jan 23', bdi: 1728, capesizeRate: 10.95, panamaxRate: 35.80 },
    { date: 'Jan 30', bdi: 1763, capesizeRate: 11.40, panamaxRate: 36.20 },
    { date: 'Feb 6', bdi: 1795, capesizeRate: 11.75, panamaxRate: 35.50 },
    { date: 'Feb 9', bdi: 1847, capesizeRate: 12.50, panamaxRate: 35.25 },
  ];

  const filteredRates = useMemo(() => {
    if (selectedVesselType === 'All') return freightRates;
    return freightRates.filter((rate) =>
      rate.vesselType.toLowerCase().includes(selectedVesselType.toLowerCase())
    );
  }, [selectedVesselType]);

  const getTrendIcon = (trend: string) => {
    if (trend === 'up' || trend === 'positive' || trend === 'bullish') return '📈';
    if (trend === 'down' || trend === 'negative' || trend === 'bearish') return '📉';
    return '➡️';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up' || trend === 'positive' || trend === 'bullish')
      return 'text-green-400';
    if (trend === 'down' || trend === 'negative' || trend === 'bearish')
      return 'text-red-400';
    return 'text-yellow-400';
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400';
  };

  return (
    <ShowcaseLayout
      title="Market Intelligence Hub"
      icon="📊"
      category="Market Analysis"
      problem="Chartering managers spend hours gathering freight rates from brokers, checking Baltic indices, analyzing market trends, and comparing routes across multiple sources - data is often outdated by the time decisions are made."
      solution="Real-time market intelligence dashboard aggregating Baltic Exchange indices, freight rates, supply/demand indicators, and predictive analytics in one unified view - enabling data-driven chartering decisions in seconds."
      timeSaved="4 hours → Real-time"
      roi="25x"
      accuracy="98% rate accuracy"
      nextSection={{
        title: 'Chartering Workflow',
        path: '/demo-showcase/chartering-workflow',
      }}
    >
      <div className="space-y-6">
        {/* Baltic Indices Overview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Baltic Exchange Indices
            </h3>
            <span className="text-sm text-gray-400">
              Live • Updated 2 min ago
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {balticIndices.map((index) => (
              <div
                key={index.code}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">{index.code}</div>
                    <div className="text-2xl font-bold text-white">
                      {index.value.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-2xl">{getTrendIcon(index.trend)}</span>
                </div>
                <div className={`text-sm font-semibold mb-2 ${getChangeColor(index.change)}`}>
                  {index.change > 0 ? '+' : ''}
                  {index.change} ({index.changePercent > 0 ? '+' : ''}
                  {index.changePercent.toFixed(2)}%)
                </div>
                <div className="text-xs text-gray-500">
                  H: {index.high} • L: {index.low}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Freight Rates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Spot Freight Rates
            </h3>
            <div className="flex gap-2">
              {['All', 'Capesize', 'Panamax', 'Supramax', 'Handysize'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedVesselType(type)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    selectedVesselType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                    Route
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                    Vessel Type
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">
                    Rate
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">
                    Change
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">
                    Volume (tons)
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400">
                    Sentiment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredRates.map((rate, idx) => (
                  <tr key={idx} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{rate.route}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {rate.vesselType}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-white">
                      ${rate.rate.toFixed(2)} {rate.unit}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-semibold ${getChangeColor(
                        rate.change
                      )}`}
                    >
                      {rate.change > 0 ? '+' : ''}
                      {rate.change.toFixed(2)} ({rate.changePercent > 0 ? '+' : ''}
                      {rate.changePercent.toFixed(2)}%)
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-400">
                      {rate.volume.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                          rate.sentiment === 'bullish'
                            ? 'bg-green-900/30 text-green-400'
                            : rate.sentiment === 'bearish'
                            ? 'bg-red-900/30 text-red-400'
                            : 'bg-yellow-900/30 text-yellow-400'
                        }`}
                      >
                        {getTrendIcon(rate.sentiment)} {rate.sentiment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Indicators */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Market Indicators
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketIndicators.map((indicator, idx) => (
              <div
                key={idx}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-medium text-gray-400">
                    {indicator.name}
                  </div>
                  <span className="text-lg">{getTrendIcon(indicator.trend)}</span>
                </div>
                <div className={`text-2xl font-bold mb-2 ${getTrendColor(indicator.trend)}`}>
                  {indicator.value}
                </div>
                <div className="text-xs text-gray-500">{indicator.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Trends */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Historical Trends
            </h3>
            <div className="flex gap-2">
              {['1W', '1M', '3M', '6M', '1Y'].map((range) => (
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
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="space-y-6">
              {/* BDI Chart */}
              <div>
                <div className="text-sm font-semibold text-gray-400 mb-3">
                  Baltic Dry Index (BDI)
                </div>
                <div className="flex items-end gap-2 h-32">
                  {historicalData.map((data, idx) => {
                    const maxBdi = Math.max(...historicalData.map((d) => d.bdi));
                    const height = (data.bdi / maxBdi) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-500"
                          style={{ height: `${height}%` }}
                          title={`${data.date}: ${data.bdi}`}
                        />
                        <div className="text-xs text-gray-500 rotate-45 origin-top-left mt-2">
                          {data.date}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rate Comparison */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <div className="text-sm font-semibold text-gray-400 mb-2">
                    Capesize Rate Trend
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-green-400">
                      ${historicalData[historicalData.length - 1].capesizeRate}/ton
                    </div>
                    <span className="text-green-400">📈 +27.6%</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-400 mb-2">
                    Panamax Rate Trend
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-red-400">
                      ${historicalData[historicalData.length - 1].panamaxRate}/ton
                    </div>
                    <span className="text-red-400">📉 -5.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🧠</span> AI-Powered Market Insights
          </h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="text-green-400 font-bold">✓</div>
              <div className="text-sm text-gray-300">
                <span className="font-semibold text-white">Strong Capesize Market:</span> BCI
                up 4.65% driven by robust Australian iron ore exports to China (285k tons
                today). Consider fixing longer period for Capesize vessels.
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-yellow-400 font-bold">!</div>
              <div className="text-sm text-gray-300">
                <span className="font-semibold text-white">Weak Grain Rates:</span> US
                Gulf-Far East Panamax rates down 4.08% on oversupply. Short-term T/C rates
                may be preferable to spot for Panamax.
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-blue-400 font-bold">→</div>
              <div className="text-sm text-gray-300">
                <span className="font-semibold text-white">Low Orderbook:</span> 6.8%
                orderbook-to-fleet ratio suggests tight supply through 2026 - favorable for
                owners in TCE negotiations.
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-purple-400 font-bold">★</div>
              <div className="text-sm text-gray-300">
                <span className="font-semibold text-white">Opportunity Alert:</span>{' '}
                Indonesia-India coal route showing stability at $18.50/ton with improving
                volume - good entry point for Supramax positioning.
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
};

export default MarketIntelligenceShowcase;
