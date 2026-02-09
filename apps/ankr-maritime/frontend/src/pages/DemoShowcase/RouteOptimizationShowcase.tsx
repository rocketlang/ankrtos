import React, { useState, useMemo } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface Route {
  id: string;
  name: string;
  type: 'recommended' | 'standard' | 'alternative';
  distance: number;
  sailingTime: number;
  speed: number;
  bunkerConsumption: number;
  bunkerCost: number;
  portCosts: number;
  canalFees: number;
  totalCost: number;
  ecaDistance: number;
  weatherDelay: number;
  piracyRisk: 'low' | 'medium' | 'high';
  co2Emissions: number;
  waypoints: string[];
  savings?: number;
  warnings?: string[];
  advantages?: string[];
}

interface WeatherCondition {
  location: string;
  condition: string;
  severity: 'good' | 'moderate' | 'severe';
  windSpeed: number;
  waveHeight: number;
  impact: string;
}

interface Waypoint {
  name: string;
  lat: number;
  lng: number;
  eta: string;
  description: string;
}

const RouteOptimizationShowcase: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<string>('optimized');
  const [bunkerPrice, setBunkerPrice] = useState<number>(685);
  const [weatherRouting, setWeatherRouting] = useState<boolean>(true);

  const routes: Route[] = useMemo(() => {
    const bunkerMultiplier = bunkerPrice / 685;

    return [
      {
        id: 'optimized',
        name: 'AI-Optimized Route (Recommended)',
        type: 'recommended',
        distance: 10245,
        sailingTime: 18.2,
        speed: 11.8,
        bunkerConsumption: 512,
        bunkerCost: Math.round(512 * bunkerPrice),
        portCosts: 0,
        canalFees: 485000,
        totalCost: Math.round(512 * bunkerPrice + 485000),
        ecaDistance: 285,
        weatherDelay: 0.3,
        piracyRisk: 'low',
        co2Emissions: 1638,
        waypoints: ['Singapore', 'Suez Canal', 'Gibraltar', 'Rotterdam'],
        savings: 125000,
        advantages: [
          'Shortest total time with weather routing',
          'Avoids Bay of Biscay storm system (Feb 15-18)',
          'Optimal speed profile saves 85 MT bunker',
          'Lower ECA distance reduces compliance cost',
        ],
      },
      {
        id: 'suez',
        name: 'Standard Suez Route',
        type: 'standard',
        distance: 10580,
        sailingTime: 19.8,
        speed: 11.2,
        bunkerConsumption: 597,
        bunkerCost: Math.round(597 * bunkerPrice),
        portCosts: 0,
        canalFees: 485000,
        totalCost: Math.round(597 * bunkerPrice + 485000),
        ecaDistance: 420,
        weatherDelay: 1.5,
        piracyRisk: 'medium',
        co2Emissions: 1910,
        waypoints: ['Singapore', 'Suez Canal', 'Mediterranean', 'Rotterdam'],
        warnings: [
          'Storm system in Bay of Biscay (Feb 15-18)',
          'Increased piracy risk through Gulf of Aden',
          'Higher ECA zone transit distance',
        ],
      },
      {
        id: 'cape',
        name: 'Cape of Good Hope Route',
        type: 'alternative',
        distance: 12850,
        sailingTime: 24.5,
        speed: 11.0,
        bunkerConsumption: 734,
        bunkerCost: Math.round(734 * bunkerPrice),
        portCosts: 0,
        canalFees: 0,
        totalCost: Math.round(734 * bunkerPrice),
        ecaDistance: 320,
        weatherDelay: 0.5,
        piracyRisk: 'low',
        co2Emissions: 2348,
        waypoints: ['Singapore', 'Cape of Good Hope', 'West Africa', 'Rotterdam'],
        advantages: [
          'No canal fees ($485k savings)',
          'Low piracy risk',
          'Predictable weather patterns',
        ],
        warnings: [
          '6 days longer voyage',
          '222 MT more bunker consumption',
          'Higher total costs despite no canal fees',
        ],
      },
    ];
  }, [bunkerPrice]);

  const weatherConditions: WeatherCondition[] = [
    {
      location: 'Singapore Strait',
      condition: 'Clear',
      severity: 'good',
      windSpeed: 8,
      waveHeight: 0.8,
      impact: 'No impact - proceed as planned',
    },
    {
      location: 'Arabian Sea',
      condition: 'Moderate Winds',
      severity: 'moderate',
      windSpeed: 18,
      waveHeight: 2.5,
      impact: 'Minor speed reduction (0.5 kts) recommended',
    },
    {
      location: 'Red Sea',
      condition: 'Favorable',
      severity: 'good',
      windSpeed: 12,
      waveHeight: 1.2,
      impact: 'Good conditions - maintain planned speed',
    },
    {
      location: 'Bay of Biscay',
      condition: 'Storm System',
      severity: 'severe',
      windSpeed: 45,
      waveHeight: 6.5,
      impact: 'AVOID Feb 15-18 - Route adjusted to pass after Feb 19',
    },
    {
      location: 'English Channel',
      condition: 'Moderate',
      severity: 'moderate',
      windSpeed: 22,
      waveHeight: 2.8,
      impact: 'Normal winter conditions - no route change needed',
    },
  ];

  const keyWaypoints: Waypoint[] = [
    {
      name: 'Singapore',
      lat: 1.29,
      lng: 103.85,
      eta: '2026-02-10 08:00',
      description: 'Departure - Bunker loaded',
    },
    {
      name: 'Malacca Strait',
      lat: 2.5,
      lng: 98.5,
      eta: '2026-02-11 14:00',
      description: 'Transit - Speed 10 kts (TSS)',
    },
    {
      name: 'Colombo (Optional)',
      lat: 6.93,
      lng: 79.85,
      eta: '2026-02-14 06:00',
      description: 'Bunker option if market favorable',
    },
    {
      name: 'Suez Canal',
      lat: 30.0,
      lng: 32.5,
      eta: '2026-02-19 16:00',
      description: 'Canal transit - 12-14 hour crossing',
    },
    {
      name: 'Gibraltar',
      lat: 36.14,
      lng: -5.35,
      eta: '2026-02-23 10:00',
      description: 'Weather checkpoint - storm avoidance',
    },
    {
      name: 'Rotterdam',
      lat: 51.92,
      lng: 4.48,
      eta: '2026-02-28 07:00',
      description: 'Arrival - Total voyage 18.2 days',
    },
  ];

  const selectedRouteData = routes.find((r) => r.id === selectedRoute) || routes[0];

  const getSeverityColor = (severity: string) => {
    if (severity === 'good') return 'text-green-400 bg-green-900/30';
    if (severity === 'moderate') return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'low') return 'text-green-400 bg-green-900/30';
    if (risk === 'medium') return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  const getRouteTypeColor = (type: string) => {
    if (type === 'recommended') return 'border-green-500 bg-green-900/10';
    if (type === 'standard') return 'border-blue-500 bg-blue-900/10';
    return 'border-gray-600 bg-gray-800/30';
  };

  return (
    <ShowcaseLayout
      title="Route Optimization"
      icon="🗺️"
      category="Voyage Planning"
      problem="Manual route planning using paper charts and static databases misses weather patterns, market conditions, and real-time opportunities - resulting in suboptimal routes that waste fuel, time, and money while increasing safety risks."
      solution="AI-powered route optimization analyzes 50+ parameters including weather forecasts, ocean currents, piracy zones, ECA compliance, and fuel markets to generate optimal routes with dynamic re-optimization during voyage - saving average 8% on voyage costs."
      timeSaved="6 hours → 2 min"
      roi="18x"
      accuracy="8% cost reduction"
      nextSection={{
        title: 'Port Intelligence',
        path: '/demo-showcase/port-intelligence',
      }}
    >
      <div className="space-y-6">
        {/* Route Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Bunker Price (VLSFO)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="500"
                max="850"
                value={bunkerPrice}
                onChange={(e) => setBunkerPrice(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-white font-bold w-24 text-right">
                ${bunkerPrice}/MT
              </span>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Weather Routing
            </label>
            <button
              onClick={() => setWeatherRouting(!weatherRouting)}
              className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
                weatherRouting
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {weatherRouting ? '✓ Enabled' : '○ Disabled'}
            </button>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-400 mb-1">Voyage</div>
            <div className="text-white font-semibold">Singapore → Rotterdam</div>
            <div className="text-xs text-gray-500 mt-1">82,000 DWT Bulk Carrier</div>
          </div>
        </div>

        {/* Route Comparison */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Route Comparison & Analysis
          </h3>
          <div className="space-y-4">
            {routes.map((route) => (
              <div
                key={route.id}
                className={`border-2 rounded-lg p-5 cursor-pointer transition-all ${
                  selectedRoute === route.id
                    ? getRouteTypeColor(route.type)
                    : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                }`}
                onClick={() => setSelectedRoute(route.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-white">{route.name}</h4>
                      {route.type === 'recommended' && (
                        <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                          BEST CHOICE
                        </span>
                      )}
                      {route.savings && (
                        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                          Save ${route.savings.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {route.waypoints.join(' → ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      ${(route.totalCost / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-gray-500">Total Cost</div>
                  </div>
                </div>

                {/* Route Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-xs text-gray-500">Distance</div>
                    <div className="text-white font-semibold">
                      {route.distance.toLocaleString()} nm
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-xs text-gray-500">Time</div>
                    <div className="text-white font-semibold">
                      {route.sailingTime.toFixed(1)} days
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-xs text-gray-500">Speed</div>
                    <div className="text-white font-semibold">{route.speed} kts</div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-xs text-gray-500">Bunker</div>
                    <div className="text-white font-semibold">
                      {route.bunkerConsumption} MT
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-xs text-gray-500">Bunker Cost</div>
                    <div className="text-white font-semibold">
                      ${(route.bunkerCost / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-xs text-gray-500">Canal Fees</div>
                    <div className="text-white font-semibold">
                      ${route.canalFees > 0 ? (route.canalFees / 1000).toFixed(0) + 'K' : '0'}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-xs text-gray-500">CO₂</div>
                    <div className="text-white font-semibold">
                      {route.co2Emissions} MT
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-xs text-gray-500">Piracy Risk</div>
                    <div
                      className={`font-semibold capitalize ${
                        route.piracyRisk === 'low'
                          ? 'text-green-400'
                          : route.piracyRisk === 'medium'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {route.piracyRisk}
                    </div>
                  </div>
                </div>

                {/* Advantages */}
                {route.advantages && route.advantages.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-green-400 mb-2">
                      ✓ Advantages:
                    </div>
                    <ul className="space-y-1">
                      {route.advantages.map((adv, idx) => (
                        <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">•</span>
                          {adv}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {route.warnings && route.warnings.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-yellow-400 mb-2">
                      ⚠ Considerations:
                    </div>
                    <ul className="space-y-1">
                      {route.warnings.map((warning, idx) => (
                        <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Weather Conditions */}
        {weatherRouting && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Weather Forecast & Routing Adjustments
            </h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Location
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Condition
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">
                      Wind Speed
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">
                      Wave Height
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Impact & Recommendation
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {weatherConditions.map((weather, idx) => (
                    <tr key={idx} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-white font-medium">
                        {weather.location}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(
                            weather.severity
                          )}`}
                        >
                          {weather.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-white">
                        {weather.windSpeed} kts
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-white">
                        {weather.waveHeight} m
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{weather.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Key Waypoints */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Key Waypoints & ETA Schedule
          </h3>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="space-y-3">
              {keyWaypoints.map((waypoint, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-900/30 border border-blue-500/50 text-blue-400 font-bold text-sm flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 mb-1">
                      <h4 className="text-white font-semibold">{waypoint.name}</h4>
                      <span className="text-sm text-gray-400">{waypoint.eta}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {waypoint.lat.toFixed(2)}°, {waypoint.lng.toFixed(2)}°
                    </div>
                    <div className="text-sm text-gray-300">{waypoint.description}</div>
                  </div>
                  {idx < keyWaypoints.length - 1 && (
                    <div className="text-gray-600 text-xl">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Optimization Summary */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🎯</span> Optimization Impact Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Cost Savings</div>
              <div className="text-2xl font-bold text-green-400">$125,000</div>
              <div className="text-xs text-gray-500">vs standard route</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Time Saved</div>
              <div className="text-2xl font-bold text-blue-400">1.6 days</div>
              <div className="text-xs text-gray-500">faster arrival</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Fuel Efficiency</div>
              <div className="text-2xl font-bold text-purple-400">85 MT</div>
              <div className="text-xs text-gray-500">bunker saved</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">CO₂ Reduction</div>
              <div className="text-2xl font-bold text-yellow-400">272 MT</div>
              <div className="text-xs text-gray-500">emissions saved</div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
};

export default RouteOptimizationShowcase;
