/**
 * WEATHER ROUTE MAP COMPONENT
 *
 * Interactive Leaflet map displaying 3 route alternatives with weather data
 */

import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  weatherRisk: string;
  maxWaveHeight: number;
  maxWindSpeed: number;
}

interface WeatherRouteMapProps {
  routes: RouteAlternative[];
  selectedRoute: number;
  onSelectRoute: (index: number) => void;
  showWeatherGrid: boolean;
  origin: { name: string; latitude: number; longitude: number };
  destination: { name: string; latitude: number; longitude: number };
}

export default function WeatherRouteMap({
  routes,
  selectedRoute,
  onSelectRoute,
  showWeatherGrid,
  origin,
  destination,
}: WeatherRouteMapProps) {
  // Route colors
  const routeColors = ['#3b82f6', '#10b981', '#8b5cf6']; // blue, green, purple
  const routeNames = ['Great Circle', 'Weather-Optimized', 'Fuel-Optimized'];

  // Create custom icons for origin/destination
  const originIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMTBiOTgxIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const destIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZWY0NDQ0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  // Calculate map bounds from all routes
  const allPoints: [number, number][] = [];
  routes.forEach(route => {
    route.waypoints.forEach(wp => {
      allPoints.push([wp.lat, wp.lon]);
    });
  });
  allPoints.push([origin.latitude, origin.longitude]);
  allPoints.push([destination.latitude, destination.longitude]);

  const bounds = L.latLngBounds(allPoints);
  const center: [number, number] = [
    (origin.latitude + destination.latitude) / 2,
    (origin.longitude + destination.longitude) / 2,
  ];

  // Identify adverse weather zones (high waves or wind)
  const adverseZones: { lat: number; lon: number; severity: string; description: string }[] = [];
  routes[selectedRoute]?.waypoints.forEach((wp) => {
    if (wp.weather) {
      if (wp.weather.waveHeight > 4 || wp.weather.windSpeed > 25) {
        adverseZones.push({
          lat: wp.lat,
          lon: wp.lon,
          severity: wp.weather.waveHeight > 6 || wp.weather.windSpeed > 35 ? 'high' : 'medium',
          description: `Wave: ${wp.weather.waveHeight.toFixed(1)}m, Wind: ${wp.weather.windSpeed.toFixed(1)}kts`,
        });
      }
    }
  });

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <MapContainer
        bounds={bounds}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Origin Marker */}
        <Marker position={[origin.latitude, origin.longitude]} icon={originIcon}>
          <Popup>
            <div className="p-2">
              <div className="font-bold text-lg text-green-600">🚢 Origin</div>
              <div className="text-sm">{origin.name}</div>
              <div className="text-xs text-gray-500">
                {origin.latitude.toFixed(2)}°, {origin.longitude.toFixed(2)}°
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker position={[destination.latitude, destination.longitude]} icon={destIcon}>
          <Popup>
            <div className="p-2">
              <div className="font-bold text-lg text-red-600">🎯 Destination</div>
              <div className="text-sm">{destination.name}</div>
              <div className="text-xs text-gray-500">
                {destination.latitude.toFixed(2)}°, {destination.longitude.toFixed(2)}°
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Route Polylines */}
        {routes.map((route, index) => {
          const positions: [number, number][] = route.waypoints.map(wp => [wp.lat, wp.lon]);
          const isSelected = index === selectedRoute;

          return (
            <Polyline
              key={index}
              positions={positions}
              pathOptions={{
                color: routeColors[index],
                weight: isSelected ? 4 : 2,
                opacity: isSelected ? 1 : 0.4,
              }}
              eventHandlers={{
                click: () => onSelectRoute(index),
              }}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-bold" style={{ color: routeColors[index] }}>
                    {route.name}
                  </div>
                  <div className="text-sm mt-2">
                    <div>Weather Risk: <strong>{route.weatherRisk}</strong></div>
                    <div>Max Wave: <strong>{route.maxWaveHeight.toFixed(1)}m</strong></div>
                    <div>Max Wind: <strong>{route.maxWindSpeed.toFixed(1)}kts</strong></div>
                  </div>
                  <button
                    onClick={() => onSelectRoute(index)}
                    className="mt-2 text-xs text-blue-600 hover:underline"
                  >
                    Select this route
                  </button>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Adverse Weather Zones (only for selected route) */}
        {showWeatherGrid && adverseZones.map((zone, index) => (
          <Circle
            key={`adverse-${index}`}
            center={[zone.lat, zone.lon]}
            radius={50000} // 50km radius
            pathOptions={{
              color: zone.severity === 'high' ? '#ef4444' : '#f97316',
              fillColor: zone.severity === 'high' ? '#ef4444' : '#f97316',
              fillOpacity: 0.2,
              weight: 2,
              dashArray: '5, 10',
            }}
          >
            <Popup>
              <div className="p-2">
                <div className="font-bold text-orange-600">⚠️ Adverse Weather</div>
                <div className="text-sm mt-1">{zone.description}</div>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Waypoint Markers (only for selected route) */}
        {routes[selectedRoute]?.waypoints.filter((_, i) => i % 5 === 0).map((wp, index) => (
          <Marker
            key={`waypoint-${index}`}
            position={[wp.lat, wp.lon]}
            icon={new L.Icon({
              iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDEyIDEyIj48Y2lyY2xlIGN4PSI2IiBjeT0iNiIgcj0iNCIgZmlsbD0iIzNiODJmNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=',
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            })}
          >
            <Popup>
              <div className="p-2">
                <div className="font-bold text-sm">Waypoint #{index + 1}</div>
                <div className="text-xs text-gray-600 mb-2">
                  ETA: {new Date(wp.eta).toLocaleString()}
                </div>
                {wp.weather && (
                  <div className="text-xs space-y-1">
                    <div>🌊 Wave: {wp.weather.waveHeight.toFixed(1)}m</div>
                    <div>💨 Wind: {wp.weather.windSpeed.toFixed(1)}kts</div>
                    <div>🌡️ Temp: {wp.weather.temperature.toFixed(1)}°C</div>
                    <div>☁️ {wp.weather.conditions}</div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {routes.map((route, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{
                backgroundColor: routeColors[index],
                opacity: index === selectedRoute ? 1 : 0.4,
              }}
            />
            <span className={index === selectedRoute ? 'font-semibold' : ''}>
              {route.name}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 ml-4">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span>Origin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span>Destination</span>
        </div>
        {showWeatherGrid && (
          <div className="flex items-center gap-2 ml-4">
            <div className="w-4 h-4 rounded-full bg-orange-500 opacity-50" />
            <span>Adverse Weather</span>
          </div>
        )}
      </div>
    </div>
  );
}
