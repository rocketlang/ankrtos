/**
 * AIS Real World Map - Dual View (Ships + Heatmap)
 *
 * View 1: Ships - Individual vessel positions as ship icons
 * View 2: Heatmap - Aggregated traffic density
 */

import { useQuery } from '@apollo/client';
import { gql } from '../__generated__/gql';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const HEATMAP_QUERY = gql(`
  query AISHeatmapView {
    aisHeatmapData {
      points { lat lng intensity }
      totalPoints
    }
  }
`);

const SHIPS_QUERY = gql(`
  query LiveShipsView($limit: Int, $minLat: Float, $maxLat: Float, $minLng: Float, $maxLng: Float) {
    liveVesselPositions(limit: $limit, minLat: $minLat, maxLat: $maxLat, minLng: $minLng, maxLng: $maxLng) {
      vesselId
      vesselName
      vesselType
      latitude
      longitude
      speed
      heading
    }
  }
`);

export default function AISRealWorldMapDual() {
  console.log('[AISRealWorldMapDual] Component rendering');
  const [view, setView] = useState<'ships' | 'heatmap'>('ships');
  const [mapReady, setMapReady] = useState(false); // Track when map is initialized
  const [vesselLimit, setVesselLimit] = useState(500); // Adaptive: starts at 500, can creep up to 1000
  const [viewportBounds, setViewportBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Use callback ref to initialize map when div is attached
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    // If node is null (unmounting), don't do anything - cleanup effect handles it
    if (!node) return;

    // If map already exists and is attached to this same node, we're good
    if (mapRef.current && node.classList.contains('leaflet-container')) {
      console.log('[MAP] Already initialized on this node');
      return;
    }

    // If we have a map but it's on a different node (React replaced the div), clean up old map
    if (mapRef.current) {
      console.log('[MAP] Node changed, cleaning up old map');
      mapRef.current.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    }

    console.log('[MAP INIT] Initializing map on new node');

    try {
      // Use the node directly - it's guaranteed to be in the DOM when callback runs
      const map = L.map(node, {
        center: [25, 55], // Middle East/Persian Gulf
        zoom: 5,
        minZoom: 2,
        maxZoom: 12,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 20,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);

      // Update viewport bounds when map moves
      const updateBounds = () => {
        const bounds = map.getBounds();
        setViewportBounds({
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast(),
        });
      };

      updateBounds();
      map.on('moveend', updateBounds);

      mapRef.current = map;
      layerGroupRef.current = layerGroup;
      setMapReady(true);

      console.log('[MAP INIT] Successfully initialized');
    } catch (error) {
      console.error('[MAP INIT ERROR]:', error);
    }
  }, []);

  const { data: heatmapData, error: heatmapError } = useQuery(HEATMAP_QUERY, {
    skip: view !== 'heatmap',
    fetchPolicy: 'cache-and-network', // Show cached data while fetching
    errorPolicy: 'all', // Return partial data on error
  });

  const { data: shipsData, loading: shipsLoading, error: shipsError } = useQuery(SHIPS_QUERY, {
    variables: {
      limit: vesselLimit, // Adaptive limit: 500 → 1000 if viewport is dense
      ...(viewportBounds || {}), // Include viewport bounds for region-based rendering
    },
    skip: view !== 'ships',
    pollInterval: 30000, // Update every 30 seconds
    fetchPolicy: 'cache-and-network', // Show cached data while fetching - prevents blank page!
    errorPolicy: 'all', // Return partial data on error
    notifyOnNetworkStatusChange: false, // Don't show loading on refetch
  });

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        console.log('[MAP CLEANUP] Destroying map on component unmount');
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  // Adaptive "creep up": If we hit the limit, try loading more
  useEffect(() => {
    if (!shipsData?.liveVesselPositions || view !== 'ships') return;

    const vesselCount = shipsData.liveVesselPositions.length;

    // If we got exactly 500 vessels, there might be more → creep up to 1000
    if (vesselCount === 500 && vesselLimit === 500) {
      setTimeout(() => setVesselLimit(1000), 2000); // Wait 2s, then load more
    }
    // Reset to 500 when viewport changes (new region)
    else if (vesselCount < 500 && vesselLimit === 1000) {
      setVesselLimit(500);
    }
  }, [shipsData, vesselLimit, view]);

  // Update markers/circles when data or view changes
  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;

    try {
      // Clear existing layers
      layerGroup.clearLayers();

      // Render ships (gracefully handle 0 vessels - no error)
      if (view === 'ships' && shipsData?.liveVesselPositions) {
        const vessels = shipsData.liveVesselPositions;

        // If no vessels in viewport, just show empty map (no error)
        if (vessels.length === 0) return;

        vessels.forEach(vessel => {
        // Create ship icon based on vessel type
        const iconUrl = getShipIcon(vessel.vesselType);
        const icon = L.icon({
          iconUrl,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([vessel.latitude, vessel.longitude], { icon });

        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px;">
            <strong>${vessel.vesselName || 'Unknown'}</strong><br>
            Type: ${vessel.vesselType}<br>
            Speed: ${vessel.speed?.toFixed(1) || 'N/A'} kts<br>
            Position: ${vessel.latitude.toFixed(3)}°, ${vessel.longitude.toFixed(3)}°
          </div>
        `);

        layerGroup.addLayer(marker);
      });
    }

    // Render heatmap
    if (view === 'heatmap' && heatmapData?.aisHeatmapData) {
      const points = heatmapData.aisHeatmapData.points;
      const maxIntensity = Math.max(...points.map(p => p.intensity));

      points.forEach(point => {
        const normalized = Math.log(point.intensity + 1) / Math.log(maxIntensity + 1);
        const intensity = Math.min(normalized, 1);

        let color: string;
        if (intensity > 0.8) color = '#ff3232';
        else if (intensity > 0.6) color = '#ff9500';
        else if (intensity > 0.4) color = '#ffeb00';
        else color = '#00d4ff';

        const radius = 3 + (intensity * 9);

        const circle = L.circleMarker([point.lat, point.lng], {
          radius,
          fillColor: color,
          color,
          weight: 1,
          opacity: 0.8,
          fillOpacity: intensity > 0.6 ? 0.7 : 0.5,
        });

        circle.bindPopup(`
          <strong>Vessels:</strong> ${point.intensity.toLocaleString()}<br>
          <strong>Traffic:</strong> ${intensity > 0.8 ? 'Very High' : intensity > 0.6 ? 'High' : intensity > 0.4 ? 'Medium' : 'Low'}
        `);

        layerGroup.addLayer(circle);
      });
      }
    } catch (error) {
      console.error('[MARKER RENDER ERROR]:', error);
    }
  }, [view, shipsData, heatmapData, mapReady]); // Re-run when map is ready

  // Get ship icon based on vessel type
  function getShipIcon(type: string): string {
    // Using simple emoji-based data URLs for ship icons
    const icons: Record<string, string> = {
      container: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSI1IiB5PSIxNSIgZm9udC1zaXplPSIxNiI+8J+agTwvdGV4dD48L3N2Zz4=', // 🚁
      tanker: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSI1IiB5PSIxNSIgZm9udC1zaXplPSIxNiI+8J+miTwvdGV4dD48L3N2Zz4=', // ⛉
      ferry: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSI1IiB5PSIxNSIgZm9udC1zaXplPSIxNiI+8J+btDwvdGV4dD48L3N2Zz4=', // 🛴
      default: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSI1IiB5PSIxNSIgZm9udC1zaXplPSIxNiI+8J+aojwvdGV4dD48L3N2Zz4=', // 🚢
    };
    return icons[type] || icons.default;
  }

  // Only show loading if we have NO data yet (initial load)
  // With cache-and-network, we want to show map even while refetching
  if (shipsLoading && !shipsData && view === 'ships') {
    return (
      <div className="bg-gradient-to-r from-slate-900/30 to-blue-900/30 border border-blue-500/30 rounded-2xl p-8">
        <div className="text-center text-blue-300">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <div>Loading vessels...</div>
        </div>
      </div>
    );
  }

  const vesselCount = shipsData?.liveVesselPositions?.length || 0;
  const heatPoints = heatmapData?.aisHeatmapData?.points?.length || 0;

  return (
    <div className="space-y-4">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="text-4xl">🌍</span>
          Global AIS Map
        </h3>

        {/* View Tabs */}
        <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-cyan-500/30">
          <button
            onClick={() => setView('ships')}
            className={`px-6 py-2 rounded-md font-semibold transition-all ${
              view === 'ships'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                : 'text-cyan-300 hover:text-white hover:bg-cyan-500/20'
            }`}
          >
            🚢 Ships ({vesselCount.toLocaleString()})
          </button>
          <button
            onClick={() => setView('heatmap')}
            className={`px-6 py-2 rounded-md font-semibold transition-all ${
              view === 'heatmap'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
                : 'text-orange-300 hover:text-white hover:bg-orange-500/20'
            }`}
          >
            🔥 Heatmap ({heatPoints.toLocaleString()})
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-gradient-to-br from-slate-900/50 to-blue-900/30 border-2 border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl">
        <div ref={mapContainerRef} id="ais-map-container" style={{ height: '700px', width: '100%' }} />

        {/* View Info */}
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-lg p-4">
          <div className="text-cyan-400 text-sm font-bold mb-1">
            {view === 'ships' ? '🚢 LIVE VESSELS' : '🔥 TRAFFIC HEATMAP'}
          </div>
          <div className="text-white text-2xl font-bold">
            {view === 'ships'
              ? `${vesselCount.toLocaleString()}`
              : `${(heatmapData?.aisHeatmapData?.totalPoints || 0) / 1000000}M`
            }
          </div>
          <div className="text-cyan-300 text-xs">
            {view === 'ships' ? 'active now' : 'positions tracked'}
          </div>
        </div>

        {/* Legend */}
        {view === 'heatmap' && (
          <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-lg p-4 text-sm">
            <div className="font-bold text-white mb-2">Traffic Density</div>
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
        )}
      </div>

      {/* Info */}
      <div className="text-center text-xs text-blue-400">
        {view === 'ships'
          ? `${vesselCount.toLocaleString()} vessels in view • Best coverage: Bay of Bengal & Middle East • Auto-loads up to 1000`
          : 'Aggregated traffic density from 56M+ positions • Click circles for details'
        }
      </div>
    </div>
  );
}
