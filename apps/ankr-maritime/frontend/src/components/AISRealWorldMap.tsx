/**
 * AIS Real World Map with Heatmap Overlay
 *
 * Uses Leaflet + OpenStreetMap for real world geography
 * Overlays AIS heatmap data on top
 */

import { useQuery } from '@apollo/client';
import { gql } from '../__generated__/gql';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

const AIS_HEATMAP_QUERY = gql(`
  query AISRealWorldHeatmap {
    aisHeatmapData {
      points {
        lat
        lng
        intensity
      }
      totalPoints
      lastUpdated
    }
  }
`);

export default function AISRealWorldMap() {
  const leafletMapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.LayerGroup | null>(null);

  const { data, loading, error } = useQuery(AIS_HEATMAP_QUERY, {
    skip: false,
    pollInterval: 60000, // Refresh every minute
  });

  // Callback ref to initialize map when div is mounted
  const mapRefCallback = (node: HTMLDivElement | null) => {
    if (!node || leafletMapRef.current) return;

    console.log('[Real World Map] Initializing map...');
    // Create map centered on world view
    const map = L.map(node, {
      center: [30, 0], // Centered on shipping lanes
      zoom: 2,
      minZoom: 2,
      maxZoom: 10,
      worldCopyJump: true,
    });
    console.log('[Real World Map] Map created successfully');

    // Add CartoDB Voyager tiles (clean English labels worldwide)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 20,
    }).addTo(map);

    // Alternative: Satellite imagery (uncomment to use)
    // L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    //   attribution: '© Esri',
    //   maxZoom: 19,
    // }).addTo(map);

    leafletMapRef.current = map;
    heatLayerRef.current = L.layerGroup().addTo(map);
  };

  // Update heatmap overlay when data changes
  useEffect(() => {
    if (!data?.aisHeatmapData?.points || !heatLayerRef.current || !leafletMapRef.current) return;

    const map = leafletMapRef.current;
    const heatLayer = heatLayerRef.current;

    // Clear existing heat points
    heatLayer.clearLayers();

    const points = data.aisHeatmapData.points;
    const maxIntensity = Math.max(...points.map(p => p.intensity));

    console.log(`[Real World Map] Rendering ${points.length} heat points`);

    // Add heat points as circle markers
    points.forEach(point => {
      // Logarithmic intensity normalization
      const normalized = Math.log(point.intensity + 1) / Math.log(maxIntensity + 1);
      const intensity = Math.min(normalized, 1);

      // Determine color based on intensity
      let color: string;
      let fillOpacity: number;

      if (intensity > 0.8) {
        color = '#ff3232'; // Red - very high traffic
        fillOpacity = 0.8;
      } else if (intensity > 0.6) {
        color = '#ff9500'; // Orange - high traffic
        fillOpacity = 0.7;
      } else if (intensity > 0.4) {
        color = '#ffeb00'; // Yellow - medium traffic
        fillOpacity = 0.6;
      } else {
        color = '#00d4ff'; // Cyan - low traffic
        fillOpacity = 0.5;
      }

      // Radius based on intensity (2-12 pixels)
      const radius = 3 + (intensity * 9);

      // Create circle marker
      const circle = L.circleMarker([point.lat, point.lng], {
        radius,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 0.8,
        fillOpacity,
      });

      // Add popup with details
      circle.bindPopup(`
        <div style="font-family: monospace; font-size: 12px;">
          <strong>Position:</strong> ${point.lat.toFixed(2)}°, ${point.lng.toFixed(2)}°<br>
          <strong>Vessels:</strong> ${point.intensity.toLocaleString()}<br>
          <strong>Traffic:</strong> ${intensity > 0.8 ? 'Very High' : intensity > 0.6 ? 'High' : intensity > 0.4 ? 'Medium' : 'Low'}
        </div>
      `);

      heatLayer.addLayer(circle);
    });

    console.log(`[Real World Map] ✅ Rendered ${points.length} heat points on real world map`);

  }, [data]);

  if (loading && !data) {
    return (
      <div className="bg-gradient-to-r from-slate-900/30 to-blue-900/30 border border-blue-500/30 rounded-2xl p-8">
        <div className="text-center text-blue-300">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <div>Loading real world map...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-slate-900/30 to-red-900/30 border border-red-500/30 rounded-2xl p-8">
        <div className="text-center text-red-300">
          <div className="text-4xl mb-4">⚠️</div>
          <div>Error loading map data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-4xl">🌍</span>
            Global AIS Heatmap (Real World Map)
          </h3>
          <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-xs font-semibold animate-pulse">
            ● LIVE
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-gradient-to-br from-slate-900/50 to-blue-900/30 border-2 border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl">
        <div ref={mapRefCallback} style={{ height: '600px', width: '100%' }} />

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-lg p-4 text-sm">
          <div className="font-bold text-white mb-2">Traffic Intensity</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-white">Very High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-white">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-white">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-cyan-400"></div>
              <span className="text-white">Low</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {data?.aisHeatmapData && (
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-lg p-4">
            <div className="text-cyan-400 text-sm font-bold mb-1">AIS DATA</div>
            <div className="text-white text-2xl font-bold">
              {(data.aisHeatmapData.totalPoints / 1000000).toFixed(1)}M
            </div>
            <div className="text-cyan-300 text-xs">positions tracked</div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center text-xs text-blue-400">
        Real-time vessel heatmap overlaid on OpenStreetMap • Click markers for details
      </div>
    </div>
  );
}
