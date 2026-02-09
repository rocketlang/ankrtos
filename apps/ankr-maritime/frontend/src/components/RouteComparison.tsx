/**
 * ROUTE COMPARISON COMPONENT
 *
 * Displays 3 route alternatives side-by-side with metrics and savings
 */

interface RouteAlternative {
  name: string;
  description: string;
  totalDistance: number;
  estimatedDuration: number;
  fuelConsumption: number;
  estimatedCost: number;
  weatherRisk: string;
  maxWaveHeight: number;
  maxWindSpeed: number;
}

interface Savings {
  fuelSaved: number;
  costSaved: number;
  timeDifference: number;
}

interface RouteComparisonProps {
  routes: RouteAlternative[];
  savings: Savings;
  selectedRoute: number;
  onSelectRoute: (index: number) => void;
}

export default function RouteComparison({
  routes,
  savings,
  selectedRoute,
  onSelectRoute,
}: RouteComparisonProps) {
  // Color coding for routes
  const routeColors = [
    { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', badge: 'bg-blue-500' },
    { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-500' },
    { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', badge: 'bg-purple-500' },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  return (
    <div className="mb-6">
      {/* Savings Summary */}
      {savings && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💰</span>
            <h2 className="text-2xl font-bold text-gray-900">Potential Savings</h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Fuel Saved (Weather vs Great Circle)</div>
              <div className="text-3xl font-bold text-green-600">
                {savings.fuelSaved.toFixed(1)} MT
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Cost Saved</div>
              <div className="text-3xl font-bold text-green-600">
                ${savings.costSaved.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Time Difference</div>
              <div className="text-3xl font-bold text-blue-600">
                {savings.timeDifference > 0 ? '+' : ''}{formatDuration(savings.timeDifference)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Alternatives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {routes.map((route, index) => {
          const colors = routeColors[index];
          const isSelected = selectedRoute === index;

          return (
            <div
              key={index}
              onClick={() => onSelectRoute(index)}
              className={`relative cursor-pointer transition-all ${
                isSelected
                  ? `${colors.bg} border-2 ${colors.border} shadow-lg scale-105`
                  : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md'
              } rounded-lg p-6`}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${colors.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                  SELECTED
                </div>
              )}

              {/* Route Name */}
              <div className="mb-4">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                  isSelected ? colors.badge + ' text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  Route {index + 1}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{route.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{route.description}</p>
              </div>

              {/* Metrics */}
              <div className="space-y-4">
                {/* Distance */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Distance</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {route.totalDistance.toFixed(0)} nm
                  </span>
                </div>

                {/* Duration */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatDuration(route.estimatedDuration)}
                  </span>
                </div>

                {/* Fuel */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fuel</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {route.fuelConsumption.toFixed(1)} MT
                  </span>
                </div>

                {/* Cost */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Cost</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ${route.estimatedCost.toFixed(0)}
                  </span>
                </div>

                {/* Weather Risk */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Weather Risk</span>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRiskBadge(route.weatherRisk)}`}>
                      {route.weatherRisk.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Wave Height</span>
                      <span className={`font-semibold ${route.maxWaveHeight > 4 ? 'text-orange-600' : 'text-green-600'}`}>
                        {route.maxWaveHeight.toFixed(1)} m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Wind Speed</span>
                      <span className={`font-semibold ${route.maxWindSpeed > 25 ? 'text-orange-600' : 'text-green-600'}`}>
                        {route.maxWindSpeed.toFixed(1)} kts
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Select Button */}
              {!isSelected && (
                <button
                  className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  View on Map
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Route Recommendations */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-bold text-blue-900 mb-2">Route Recommendations</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Great Circle Route:</strong> Shortest distance, best for calm weather conditions</li>
              <li>• <strong>Weather-Optimized Route:</strong> Safest option, avoids storms and high seas</li>
              <li>• <strong>Fuel-Optimized Route:</strong> Best for cost savings, balances distance and weather</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
