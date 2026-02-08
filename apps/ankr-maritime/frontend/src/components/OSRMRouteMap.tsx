/**
 * OSRM Route Visualization Component
 *
 * Displays maritime routes calculated by OSRM server
 * Can be embedded in any Mari8X page
 */

import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Waypoint {
  lat: number;
  lng: number;
  label?: string;
}

interface RouteData {
  distance: number; // meters
  duration: number; // seconds
  geometry: Array<[number, number]>; // [lon, lat]
}

interface Props {
  waypoints: Waypoint[];
  autoFetch?: boolean;
  height?: string;
}

export default function OSRMRouteMap({ waypoints, autoFetch = true, height = '600px' }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [58.5, 8.5],
      zoom: 6,
      minZoom: 2,
      maxZoom: 12,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fetch route from OSRM
  const fetchRoute = async () => {
    if (waypoints.length < 2) {
      setError('Need at least 2 waypoints');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build coordinate string for OSRM
      const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
      const url = `http://localhost:5000/route/v1/driving/${coords}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== 'Ok') {
        throw new Error('No route found between waypoints');
      }

      const routeData: RouteData = {
        distance: data.routes[0].distance,
        duration: data.routes[0].duration,
        geometry: data.routes[0].geometry.coordinates,
      };

      setRoute(routeData);
      drawRoute(routeData);
    } catch (err: any) {
      setError(err.message);
      console.error('OSRM route error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Draw route on map
  const drawRoute = (routeData: RouteData) => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing layers
    map.eachLayer(layer => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Draw polyline
    const geometry = routeData.geometry.map(([lng, lat]) => [lat, lng] as [number, number]);
    const polyline = L.polyline(geometry, {
      color: '#00d4ff',
      weight: 4,
      opacity: 0.8,
    }).addTo(map);

    // Add markers
    waypoints.forEach((wp, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === waypoints.length - 1;

      const color = isStart ? '#4ade80' : isEnd ? '#f43f5e' : '#fbbf24';
      const icon = L.divIcon({
        html: `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([wp.lat, wp.lng], { icon }).addTo(map);
      if (wp.label) {
        marker.bindPopup(wp.label);
      }
    });

    // Fit bounds
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
  };

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && waypoints.length >= 2) {
      fetchRoute();
    }
  }, [waypoints, autoFetch]);

  const distanceNm = route ? (route.distance / 1852).toFixed(1) : '—';
  const durationHrs = route ? (route.duration / 3600).toFixed(1) : '—';
  const speedKts = route ? (parseFloat(distanceNm) / parseFloat(durationHrs)).toFixed(1) : '—';

  return (
    <div className="relative">
      {/* Map */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="rounded-xl overflow-hidden border-2 border-cyan-500/30" />

      {/* Stats Overlay */}
      <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-md border border-cyan-500/50 rounded-lg p-4 max-w-xs">
        <h3 className="text-lg font-bold text-cyan-400 mb-3">🚢 Route Stats</h3>

        {loading && (
          <div className="text-cyan-300 animate-pulse">⏳ Calculating route...</div>
        )}

        {error && (
          <div className="text-red-400">❌ {error}</div>
        )}

        {route && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Distance:</span>
              <span className="text-white font-bold">{distanceNm} nm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration:</span>
              <span className="text-white font-bold">{durationHrs} hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Speed:</span>
              <span className="text-white font-bold">{speedKts} kts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Waypoints:</span>
              <span className="text-white font-bold">{route.geometry.length}</span>
            </div>
          </div>
        )}

        {!autoFetch && (
          <button
            onClick={fetchRoute}
            disabled={loading}
            className="mt-3 w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition"
          >
            Calculate Route
          </button>
        )}
      </div>
    </div>
  );
}
