/**
 * Historical Track Replay Component
 * Phase 5: TIER 2 - Enhanced Live Map Features
 *
 * Features:
 * - Timeline slider (30/60/90 days)
 * - Play/pause/speed controls
 * - Shows vessel movement over time
 * - Animated track visualization
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery, gql } from '@apollo/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const VESSEL_TRACK_QUERY = gql`
  query VesselTrack($imo: Int!, $startDate: DateTime!, $endDate: DateTime!) {
    vesselTrack(imo: $imo, startDate: $startDate, endDate: $endDate) {
      positions {
        latitude
        longitude
        speed
        heading
        timestamp
      }
      totalDistance
      avgSpeed
    }
  }
`;

interface TrackReplayProps {
  imo: number;
  vesselName: string;
  days?: 30 | 60 | 90;
  height?: string;
}

export function TrackReplay({
  imo,
  vesselName,
  days = 30,
  height = '600px',
}: TrackReplayProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const animationRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 5x, 10x
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDays, setSelectedDays] = useState(days);

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - selectedDays * 24 * 60 * 60 * 1000);

  const { data, loading } = useQuery(VESSEL_TRACK_QUERY, {
    variables: {
      imo,
      startDate,
      endDate,
    },
  });

  const positions = data?.vesselTrack?.positions || [];

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

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Draw complete track
  useEffect(() => {
    if (!map.current || positions.length === 0) return;

    const coordinates = positions.map((p: any) => [p.longitude, p.latitude]);

    // Add track source
    if (map.current.getSource('track')) {
      (map.current.getSource('track') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      });
    } else {
      map.current.addSource('track', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      });

      // Complete track (faded)
      map.current.addLayer({
        id: 'track-line',
        type: 'line',
        source: 'track',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#9ca3af',
          'line-width': 2,
          'line-opacity': 0.3,
        },
      });
    }

    // Traveled track (animated)
    if (!map.current.getSource('track-traveled')) {
      map.current.addSource('track-traveled', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });

      map.current.addLayer({
        id: 'track-traveled-line',
        type: 'line',
        source: 'track-traveled',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });
    }

    // Current position marker
    if (!map.current.getSource('current-position')) {
      map.current.addSource('current-position', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: coordinates[0],
          },
        },
      });

      map.current.addLayer({
        id: 'current-position-circle',
        type: 'circle',
        source: 'current-position',
        paint: {
          'circle-radius': 8,
          'circle-color': '#3b82f6',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
        },
      });
    }

    // Fit bounds to track
    const bounds = coordinates.reduce(
      (bounds, coord) => bounds.extend(coord as [number, number]),
      new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
    );
    map.current.fitBounds(bounds, { padding: 50 });
  }, [positions]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || positions.length === 0 || !map.current) return;

    let lastTimestamp = 0;
    const frameInterval = 1000 / (30 * playbackSpeed); // 30 fps adjusted by speed

    const animate = (timestamp: number) => {
      if (timestamp - lastTimestamp < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      lastTimestamp = timestamp;

      setCurrentIndex((prevIndex) => {
        if (prevIndex >= positions.length - 1) {
          setIsPlaying(false);
          return prevIndex;
        }

        const nextIndex = prevIndex + 1;
        const currentPos = positions[nextIndex];

        // Update traveled track
        const traveledCoords = positions
          .slice(0, nextIndex + 1)
          .map((p: any) => [p.longitude, p.latitude]);

        (map.current!.getSource('track-traveled') as maplibregl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: traveledCoords,
          },
        });

        // Update current position
        (map.current!.getSource('current-position') as maplibregl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [currentPos.longitude, currentPos.latitude],
          },
        });

        // Center map on current position
        map.current!.easeTo({
          center: [currentPos.longitude, currentPos.latitude],
          duration: frameInterval,
        });

        return nextIndex;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, positions, playbackSpeed]);

  const handlePlay = () => {
    if (currentIndex >= positions.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);

    if (map.current && positions.length > 0) {
      // Reset traveled track
      (map.current.getSource('track-traveled') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [],
        },
      });

      // Reset current position
      const firstPos = positions[0];
      (map.current.getSource('current-position') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [firstPos.longitude, firstPos.latitude],
        },
      });
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value);
    setCurrentIndex(newIndex);
    setIsPlaying(false);

    if (map.current && positions.length > 0) {
      const currentPos = positions[newIndex];

      // Update traveled track
      const traveledCoords = positions
        .slice(0, newIndex + 1)
        .map((p: any) => [p.longitude, p.latitude]);

      (map.current.getSource('track-traveled') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: traveledCoords,
        },
      });

      // Update current position
      (map.current.getSource('current-position') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [currentPos.longitude, currentPos.latitude],
        },
      });

      map.current.flyTo({
        center: [currentPos.longitude, currentPos.latitude],
        duration: 1000,
      });
    }
  };

  const currentPosition = positions[currentIndex];
  const progress = positions.length > 0 ? (currentIndex / (positions.length - 1)) * 100 : 0;

  return (
    <div className="relative" style={{ height }}>
      {loading && (
        <div className="absolute top-4 left-4 bg-maritime-800 border border-maritime-600 rounded px-3 py-2 z-10">
          <p className="text-maritime-300 text-sm">Loading track data...</p>
        </div>
      )}

      {/* Stats Panel */}
      {data && (
        <div className="absolute top-4 right-4 bg-maritime-900 border border-maritime-600 rounded-lg p-4 z-10 min-w-[250px]">
          <h3 className="text-white font-bold mb-2">{vesselName}</h3>
          <div className="text-xs text-maritime-300 space-y-1">
            <p>
              <strong>IMO:</strong> {imo}
            </p>
            <p>
              <strong>Period:</strong> {selectedDays} days
            </p>
            <p>
              <strong>Total Distance:</strong>{' '}
              {data.vesselTrack.totalDistance?.toFixed(0) || 'N/A'} nm
            </p>
            <p>
              <strong>Avg Speed:</strong> {data.vesselTrack.avgSpeed?.toFixed(1) || 'N/A'} knots
            </p>
            <p>
              <strong>Positions:</strong> {positions.length}
            </p>
            {currentPosition && (
              <>
                <hr className="border-maritime-700 my-2" />
                <p>
                  <strong>Current Time:</strong>
                  <br />
                  {new Date(currentPosition.timestamp).toLocaleString()}
                </p>
                <p>
                  <strong>Speed:</strong> {currentPosition.speed?.toFixed(1) || 'N/A'} knots
                </p>
                <p>
                  <strong>Heading:</strong> {currentPosition.heading?.toFixed(0) || 'N/A'}°
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Playback Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-maritime-900 border border-maritime-600 rounded-lg p-4 z-10 min-w-[500px]">
        <div className="flex items-center gap-4 mb-3">
          {/* Play/Pause Button */}
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={loading || positions.length === 0}
            className="bg-maritime-700 hover:bg-maritime-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={loading || positions.length === 0}
            className="bg-maritime-700 hover:bg-maritime-600 text-white px-3 py-2 rounded disabled:opacity-50"
          >
            ↻ Reset
          </button>

          {/* Speed Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-maritime-300">Speed:</span>
            {[1, 2, 5, 10].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-1 rounded text-xs ${
                  playbackSpeed === speed
                    ? 'bg-blue-600 text-white'
                    : 'bg-maritime-700 text-maritime-300 hover:bg-maritime-600'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Days Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-maritime-300">Days:</span>
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDays(d as 30 | 60 | 90)}
                className={`px-2 py-1 rounded text-xs ${
                  selectedDays === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-maritime-700 text-maritime-300 hover:bg-maritime-600'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="mb-2">
          <input
            type="range"
            min="0"
            max={Math.max(0, positions.length - 1)}
            value={currentIndex}
            onChange={handleSliderChange}
            disabled={loading || positions.length === 0}
            className="w-full"
          />
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-maritime-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-maritime-400 mt-1">
          <span>
            {currentIndex + 1} / {positions.length}
          </span>
          <span>{progress.toFixed(1)}% complete</span>
        </div>
      </div>

      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
