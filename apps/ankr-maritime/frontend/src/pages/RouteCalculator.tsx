import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { useLazyQuery, useQuery, gql } from '@apollo/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const PORTS_QUERY = gql`
  query PortsForRouting {
    ports { id unlocode name country latitude longitude }
  }
`;

const ROUTE_QUERY = gql`
  query CalcRoute($from: String!, $to: String!, $speed: Float) {
    calculateRoute(fromUnlocode: $from, toUnlocode: $to, speedKnots: $speed) {
      distanceNm
      distanceKm
      estimatedDays
      estimatedHours
      speedKnots
      fromPort { unlocode name lat lng }
      toPort { unlocode name lat lng }
      waypoints { lat lng }
    }
  }
`;

export function RouteCalculator() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { data: portData } = useQuery(PORTS_QUERY);
  const [calcRoute, { data: routeData, loading }] = useLazyQuery(ROUTE_QUERY);

  const [fromPort, setFromPort] = useState('INMUN');
  const [toPort, setToPort] = useState('SGSIN');
  const [speed, setSpeed] = useState(14);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '&copy; OpenStreetMap' },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [80, 10],
      zoom: 3,
    });
    map.current.addControl(new maplibregl.NavigationControl());
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  // Draw route on map
  useEffect(() => {
    if (!map.current || !routeData?.calculateRoute) return;
    const route = routeData.calculateRoute;
    const coords = route.waypoints.map((w: { lat: number; lng: number }) => [w.lng, w.lat]);

    // Remove old layers
    if (map.current.getSource('route')) {
      map.current.removeLayer('route-line');
      map.current.removeSource('route');
    }
    if (map.current.getSource('endpoints')) {
      map.current.removeLayer('endpoints-circle');
      map.current.removeSource('endpoints');
    }

    // Add route line
    map.current.addSource('route', {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
    });
    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      paint: { 'line-color': '#3b82f6', 'line-width': 3, 'line-dasharray': [2, 1] },
    });

    // Add endpoints
    map.current.addSource('endpoints', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { name: route.fromPort.name }, geometry: { type: 'Point', coordinates: [route.fromPort.lng, route.fromPort.lat] } },
          { type: 'Feature', properties: { name: route.toPort.name }, geometry: { type: 'Point', coordinates: [route.toPort.lng, route.toPort.lat] } },
        ],
      },
    });
    map.current.addLayer({
      id: 'endpoints-circle',
      type: 'circle',
      source: 'endpoints',
      paint: { 'circle-radius': 8, 'circle-color': '#ef4444', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
    });

    // Fit bounds
    const bounds = new maplibregl.LngLatBounds();
    coords.forEach((c: [number, number]) => bounds.extend(c));
    map.current.fitBounds(bounds, { padding: 80, duration: 1000 });
  }, [routeData]);

  const handleCalculate = () => {
    calcRoute({ variables: { from: fromPort, to: toPort, speed } });
  };

  const route = routeData?.calculateRoute;

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="p-4 bg-maritime-800 border-b border-maritime-700">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-xs text-maritime-400 mb-1">From Port</label>
            <select
              value={fromPort}
              onChange={(e) => setFromPort(e.target.value)}
              className="bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm w-56"
            >
              {portData?.ports?.map((p: { unlocode: string; name: string }) => (
                <option key={p.unlocode} value={p.unlocode}>{p.unlocode} — {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-maritime-400 mb-1">To Port</label>
            <select
              value={toPort}
              onChange={(e) => setToPort(e.target.value)}
              className="bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm w-56"
            >
              {portData?.ports?.map((p: { unlocode: string; name: string }) => (
                <option key={p.unlocode} value={p.unlocode}>{p.unlocode} — {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-maritime-400 mb-1">Speed (knots)</label>
            <input
              type="number"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm w-24"
              min={1}
              max={30}
            />
          </div>
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Calculate Route'}
          </button>

          {/* Results inline */}
          {route && (
            <div className="flex gap-6 ml-4 text-sm">
              <div>
                <span className="text-maritime-400">Distance</span>
                <p className="text-white font-bold">{route.distanceNm.toLocaleString()} NM</p>
              </div>
              <div>
                <span className="text-maritime-400">Est. Time</span>
                <p className="text-white font-bold">{route.estimatedDays} days</p>
              </div>
              <div>
                <span className="text-maritime-400">Hours</span>
                <p className="text-white font-bold">{route.estimatedHours} hrs</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainer} className="flex-1" />
    </div>
  );
}
