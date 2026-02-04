/**
 * Enhanced Voyage Map with Advanced Features
 * Phase 5: TIER 2 - Enhanced Live Map Features
 *
 * New Features:
 * - Vessel clustering for performance with 100+ vessels
 * - Weather overlay (wind, waves)
 * - Port congestion visualization
 * - Layer controls
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const VOYAGE_POSITIONS_QUERY = gql`
  query VoyagePositions {
    voyages {
      id
      voyageNumber
      status
      vesselId
      vessel {
        id
        name
        imo
        type
      }
      departurePort {
        id
        name
        latitude
        longitude
      }
      arrivalPort {
        id
        name
        latitude
        longitude
      }
    }
    allVesselPositions {
      id
      vesselId
      latitude
      longitude
      speed
      heading
      course
      status
      destination
      timestamp
    }
    ports {
      id
      name
      unlocode
      latitude
      longitude
    }
  }
`;

const PORT_CONGESTION_QUERY = gql`
  query PortCongestion {
    portCongestion {
      portId
      vesselsAtAnchor
      avgWaitingTime
      lastUpdated
      port {
        name
        latitude
        longitude
      }
    }
  }
`;

interface VoyageMapEnhancedProps {
  voyageId?: string;
  height?: string;
  enableClustering?: boolean;
  showWeather?: boolean;
  showCongestion?: boolean;
}

interface LayerState {
  weather: boolean;
  congestion: boolean;
  routes: boolean;
}

export function VoyageMapEnhanced({
  voyageId,
  height = '600px',
  enableClustering = true,
  showWeather: initialWeather = false,
  showCongestion: initialCongestion = false,
}: VoyageMapEnhancedProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);
  const [layers, setLayers] = useState<LayerState>({
    weather: initialWeather,
    congestion: initialCongestion,
    routes: true,
  });

  const { data, loading } = useQuery(VOYAGE_POSITIONS_QUERY, {
    pollInterval: 30000, // Update every 30 seconds
  });

  const { data: congestionData } = useQuery(PORT_CONGESTION_QUERY, {
    pollInterval: 300000, // Update every 5 minutes
    skip: !layers.congestion,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      },
      center: [0, 20],
      zoom: 2,
    });

    map.current.addControl(new maplibregl.NavigationControl());
    map.current.addControl(new maplibregl.FullscreenControl());

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add vessel clustering source
  useEffect(() => {
    if (!map.current || !data || !enableClustering) return;

    const positions = data.allVesselPositions || [];
    const voyages = data.voyages || [];

    // Create GeoJSON from vessel positions
    const features = positions.map((pos: any) => {
      const voyage = voyages.find((v: any) => v.vesselId === pos.vesselId);
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [pos.longitude, pos.latitude],
        },
        properties: {
          vesselId: pos.vesselId,
          vesselName: voyage?.vessel?.name || 'Unknown',
          speed: pos.speed || 0,
          heading: pos.heading || 0,
          status: pos.status,
        },
      };
    });

    const geojson = {
      type: 'FeatureCollection' as const,
      features,
    };

    // Add or update clustered vessel source
    if (map.current.getSource('vessels')) {
      (map.current.getSource('vessels') as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.current.addSource('vessels', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circles
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'vessels',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#3b82f6', // Blue for small clusters
            10,
            '#10b981', // Green for medium clusters
            50,
            '#f59e0b', // Orange for large clusters
          ],
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Cluster count labels
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'vessels',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Individual vessel points
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'vessels',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#3b82f6',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Click on cluster to zoom in
      map.current.on('click', 'clusters', (e) => {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        const clusterId = features[0].properties!.cluster_id;
        (map.current.getSource('vessels') as maplibregl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err || !map.current) return;

            map.current.easeTo({
              center: (features[0].geometry as any).coordinates,
              zoom: zoom,
            });
          }
        );
      });

      // Show vessel details on click
      map.current.on('click', 'unclustered-point', (e) => {
        const coordinates = (e.features![0].geometry as any).coordinates.slice();
        const props = e.features![0].properties!;

        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(
            `<div class="text-sm">
              <strong>${props.vesselName}</strong>
              <br/>Speed: ${props.speed?.toFixed(1) || 'N/A'} kn
              <br/>Heading: ${props.heading?.toFixed(0) || 'N/A'}°
              <br/>Status: ${props.status || 'Unknown'}
            </div>`
          )
          .addTo(map.current!);
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
      map.current.on('mouseenter', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    }
  }, [data, enableClustering]);

  // Weather overlay
  useEffect(() => {
    if (!map.current || !layers.weather) return;

    // Add weather tile layer (OpenWeatherMap)
    // Note: Requires API key in production
    if (!map.current.getSource('weather-wind')) {
      map.current.addSource('weather-wind', {
        type: 'raster',
        tiles: [
          // Free OpenWeatherMap wind layer (replace with actual API key)
          'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY',
        ],
        tileSize: 256,
      });

      map.current.addLayer({
        id: 'weather-wind-layer',
        type: 'raster',
        source: 'weather-wind',
        paint: {
          'raster-opacity': 0.6,
        },
      });
    }

    return () => {
      if (map.current?.getLayer('weather-wind-layer')) {
        map.current.removeLayer('weather-wind-layer');
      }
      if (map.current?.getSource('weather-wind')) {
        map.current.removeSource('weather-wind');
      }
    };
  }, [layers.weather]);

  // Port congestion overlay
  useEffect(() => {
    if (!map.current || !layers.congestion || !congestionData) return;

    const congestions = congestionData.portCongestion || [];

    // Create GeoJSON from congestion data
    const features = congestions.map((c: any) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [parseFloat(c.port.longitude), parseFloat(c.port.latitude)],
      },
      properties: {
        portName: c.port.name,
        vesselsAtAnchor: c.vesselsAtAnchor,
        avgWaitingTime: c.avgWaitingTime,
        congestionLevel:
          c.avgWaitingTime > 24
            ? 'high'
            : c.avgWaitingTime > 6
              ? 'medium'
              : 'low',
      },
    }));

    const geojson = {
      type: 'FeatureCollection' as const,
      features,
    };

    if (map.current.getSource('port-congestion')) {
      (map.current.getSource('port-congestion') as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.current.addSource('port-congestion', {
        type: 'geojson',
        data: geojson,
      });

      map.current.addLayer({
        id: 'congestion-circles',
        type: 'circle',
        source: 'port-congestion',
        paint: {
          'circle-radius': 15,
          'circle-color': [
            'match',
            ['get', 'congestionLevel'],
            'high',
            '#ef4444', // Red
            'medium',
            '#f59e0b', // Orange
            'low',
            '#10b981', // Green
            '#3b82f6', // Blue (default)
          ],
          'circle-opacity': 0.7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      map.current.on('click', 'congestion-circles', (e) => {
        const coordinates = (e.features![0].geometry as any).coordinates.slice();
        const props = e.features![0].properties!;

        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(
            `<div class="text-sm">
              <strong>${props.portName}</strong>
              <br/>Vessels at anchor: ${props.vesselsAtAnchor}
              <br/>Avg wait: ${props.avgWaitingTime?.toFixed(1) || 'N/A'} hours
              <br/>Status: <span class="font-bold ${props.congestionLevel === 'high' ? 'text-red-500' : props.congestionLevel === 'medium' ? 'text-orange-500' : 'text-green-500'}">
                ${props.congestionLevel.toUpperCase()}
              </span>
            </div>`
          )
          .addTo(map.current!);
      });
    }

    return () => {
      if (map.current?.getLayer('congestion-circles')) {
        map.current.removeLayer('congestion-circles');
      }
      if (map.current?.getSource('port-congestion')) {
        map.current.removeSource('port-congestion');
      }
    };
  }, [layers.congestion, congestionData]);

  const toggleLayer = (layer: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="relative" style={{ height }}>
      {loading && (
        <div className="absolute top-4 left-4 bg-maritime-800 border border-maritime-600 rounded px-3 py-2 z-10">
          <p className="text-maritime-300 text-sm">Loading positions...</p>
        </div>
      )}

      {/* Layer Controls */}
      <div className="absolute top-4 right-4 bg-maritime-900 border border-maritime-600 rounded-lg p-3 z-10 space-y-2">
        <div className="text-xs font-bold text-white mb-2">Map Layers</div>

        <label className="flex items-center gap-2 text-xs text-maritime-300 cursor-pointer">
          <input
            type="checkbox"
            checked={layers.weather}
            onChange={() => toggleLayer('weather')}
            className="rounded"
          />
          <span>Weather Overlay</span>
        </label>

        <label className="flex items-center gap-2 text-xs text-maritime-300 cursor-pointer">
          <input
            type="checkbox"
            checked={layers.congestion}
            onChange={() => toggleLayer('congestion')}
            className="rounded"
          />
          <span>Port Congestion</span>
        </label>

        <label className="flex items-center gap-2 text-xs text-maritime-300 cursor-pointer">
          <input
            type="checkbox"
            checked={layers.routes}
            onChange={() => toggleLayer('routes')}
            className="rounded"
          />
          <span>Voyage Routes</span>
        </label>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-maritime-900/90 border border-maritime-600 rounded-lg p-3 z-10">
        <div className="flex flex-col gap-2 text-xs text-maritime-300">
          <div className="font-bold text-white mb-1">Legend</div>

          {enableClustering && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
              <span>Vessel Cluster (click to zoom)</span>
            </div>
          )}

          {layers.congestion && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                <span>Low congestion (&lt;6h wait)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white"></div>
                <span>Medium (6-24h wait)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
                <span>High congestion (24h+ wait)</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
