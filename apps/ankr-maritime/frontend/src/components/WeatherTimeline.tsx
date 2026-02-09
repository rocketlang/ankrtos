/**
 * WEATHER TIMELINE COMPONENT
 *
 * Displays weather forecast along the selected route with alerts
 */

interface WeatherData {
  timestamp: string;
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  waveDirection: number;
  temperature: number;
  precipitation: number;
  visibility: number;
  conditions: string;
}

interface Waypoint {
  lat: number;
  lon: number;
  eta: string;
  weather?: WeatherData;
}

interface RouteAlternative {
  name: string;
  waypoints: Waypoint[];
}

interface WeatherTimelineProps {
  route: RouteAlternative;
}

export default function WeatherTimeline({ route }: WeatherTimelineProps) {
  if (!route || !route.waypoints) {
    return (
      <div className="text-center py-8 text-gray-500">
        No route selected
      </div>
    );
  }

  // Sample waypoints (every 6 hours for readability)
  const sampledWaypoints = route.waypoints.filter((_, index) => {
    // Show first, last, and every 6th waypoint
    return index === 0 || index === route.waypoints.length - 1 || index % 6 === 0;
  });

  const getWeatherIcon = (conditions: string) => {
    const lower = conditions.toLowerCase();
    if (lower.includes('clear') || lower.includes('sunny')) return '☀️';
    if (lower.includes('cloud')) return '☁️';
    if (lower.includes('rain')) return '🌧️';
    if (lower.includes('storm') || lower.includes('thunder')) return '⛈️';
    if (lower.includes('fog')) return '🌫️';
    if (lower.includes('snow')) return '❄️';
    return '🌤️';
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getSeverityColor = (waveHeight: number, windSpeed: number) => {
    if (waveHeight > 6 || windSpeed > 35) return 'bg-red-50 border-red-200';
    if (waveHeight > 4 || windSpeed > 25) return 'bg-orange-50 border-orange-200';
    if (waveHeight > 2 || windSpeed > 15) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const getSeverityText = (waveHeight: number, windSpeed: number) => {
    if (waveHeight > 6 || windSpeed > 35) return { label: 'HIGH RISK', color: 'text-red-700' };
    if (waveHeight > 4 || windSpeed > 25) return { label: 'MODERATE', color: 'text-orange-700' };
    if (waveHeight > 2 || windSpeed > 15) return { label: 'FAIR', color: 'text-yellow-700' };
    return { label: 'GOOD', color: 'text-green-700' };
  };

  // Identify weather alerts
  const alerts = sampledWaypoints.filter(wp =>
    wp.weather && (wp.weather.waveHeight > 4 || wp.weather.windSpeed > 25)
  );

  return (
    <div className="space-y-4">
      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚠️</span>
            <h3 className="font-bold text-orange-900">Weather Alerts</h3>
          </div>
          <div className="text-sm text-orange-800">
            {alerts.length} waypoint{alerts.length > 1 ? 's' : ''} with adverse conditions detected
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {sampledWaypoints.map((waypoint, index) => {
          if (!waypoint.weather) return null;

          const weather = waypoint.weather;
          const severity = getSeverityText(weather.waveHeight, weather.windSpeed);
          const severityColor = getSeverityColor(weather.waveHeight, weather.windSpeed);

          return (
            <div
              key={index}
              className={`border rounded-lg p-4 ${severityColor}`}
            >
              {/* Time and Location */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs text-gray-600">
                    {index === 0 ? 'Departure' : index === sampledWaypoints.length - 1 ? 'Arrival' : `Waypoint ${index}`}
                  </div>
                  <div className="font-semibold text-sm">
                    {new Date(waypoint.eta).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${severity.color}`}>
                    {severity.label}
                  </div>
                  <div className="text-2xl">
                    {getWeatherIcon(weather.conditions)}
                  </div>
                </div>
              </div>

              {/* Weather Conditions */}
              <div className="text-xs text-gray-700">
                {weather.conditions}
              </div>

              {/* Weather Metrics */}
              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                {/* Wave Height */}
                <div>
                  <div className="text-xs text-gray-600">🌊 Wave Height</div>
                  <div className={`font-semibold ${
                    weather.waveHeight > 4 ? 'text-orange-700' : 'text-gray-900'
                  }`}>
                    {weather.waveHeight.toFixed(1)} m
                  </div>
                </div>

                {/* Wind Speed */}
                <div>
                  <div className="text-xs text-gray-600">💨 Wind Speed</div>
                  <div className={`font-semibold ${
                    weather.windSpeed > 25 ? 'text-orange-700' : 'text-gray-900'
                  }`}>
                    {weather.windSpeed.toFixed(1)} kts
                  </div>
                </div>

                {/* Temperature */}
                <div>
                  <div className="text-xs text-gray-600">🌡️ Temperature</div>
                  <div className="font-semibold text-gray-900">
                    {weather.temperature.toFixed(1)}°C
                  </div>
                </div>

                {/* Wind Direction */}
                <div>
                  <div className="text-xs text-gray-600">🧭 Wind Dir</div>
                  <div className="font-semibold text-gray-900">
                    {getWindDirection(weather.windDirection)}
                  </div>
                </div>

                {/* Precipitation */}
                {weather.precipitation > 0 && (
                  <div>
                    <div className="text-xs text-gray-600">🌧️ Precipitation</div>
                    <div className="font-semibold text-gray-900">
                      {weather.precipitation.toFixed(1)} mm
                    </div>
                  </div>
                )}

                {/* Visibility */}
                {weather.visibility < 10 && (
                  <div>
                    <div className="text-xs text-gray-600">👁️ Visibility</div>
                    <div className={`font-semibold ${
                      weather.visibility < 2 ? 'text-orange-700' : 'text-gray-900'
                    }`}>
                      {weather.visibility.toFixed(1)} km
                    </div>
                  </div>
                )}
              </div>

              {/* Warning */}
              {(weather.waveHeight > 4 || weather.windSpeed > 25) && (
                <div className="mt-3 pt-3 border-t border-orange-300">
                  <div className="text-xs text-orange-800">
                    ⚠️ {weather.waveHeight > 6 || weather.windSpeed > 35
                      ? 'Severe conditions - consider route adjustment'
                      : 'Moderate conditions - monitor closely'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-gray-100 rounded-lg p-4 text-sm">
        <div className="font-semibold mb-2">Weather Summary</div>
        <div className="space-y-1 text-xs text-gray-700">
          <div>• Total waypoints: {route.waypoints.length}</div>
          <div>• Showing: {sampledWaypoints.length} key points</div>
          {alerts.length > 0 && (
            <div className="text-orange-700 font-medium">
              • ⚠️ {alerts.length} adverse weather alert{alerts.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
