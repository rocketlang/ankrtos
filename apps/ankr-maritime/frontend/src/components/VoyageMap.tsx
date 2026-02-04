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
  }
`;

interface VoyageMapProps {
  voyageId?: string; // If provided, focus on specific voyage
  height?: string;
}

export function VoyageMap({ voyageId, height = '600px' }: VoyageMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);

  const { data, loading } = useQuery(VOYAGE_POSITIONS_QUERY, {
    pollInterval: 30000, // Update every 30 seconds
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
      },
      center: [0, 20], // World view
      zoom: 2,
    });

    map.current.addControl(new maplibregl.NavigationControl());

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!map.current || !data) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const voyages = data.voyages || [];
    const positions = data.allVesselPositions || [];

    // Filter to specific voyage if provided
    const relevantVoyages = voyageId
      ? voyages.filter((v: any) => v.id === voyageId)
      : voyages.filter((v: any) => v.status === 'in_progress');

    // Add port markers
    relevantVoyages.forEach((voyage: any) => {
      if (voyage.departurePort?.latitude && voyage.departurePort?.longitude) {
        const el = createPortMarker('departure');
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([voyage.departurePort.longitude, voyage.departurePort.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<div class="text-sm">
                <strong>${voyage.departurePort.name}</strong>
                <br/>Departure Port
                <br/>Voyage: ${voyage.voyageNumber}
              </div>`
            )
          )
          .addTo(map.current!);
        markersRef.current.push(marker);
      }

      if (voyage.arrivalPort?.latitude && voyage.arrivalPort?.longitude) {
        const el = createPortMarker('arrival');
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([voyage.arrivalPort.longitude, voyage.arrivalPort.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<div class="text-sm">
                <strong>${voyage.arrivalPort.name}</strong>
                <br/>Arrival Port
                <br/>Voyage: ${voyage.voyageNumber}
              </div>`
            )
          )
          .addTo(map.current!);
        markersRef.current.push(marker);
      }
    });

    // Add vessel markers with positions
    const vesselIds = new Set(relevantVoyages.map((v: any) => v.vesselId));

    positions.forEach((position: any) => {
      if (!vesselIds.has(position.vesselId)) return;

      const voyage = relevantVoyages.find((v: any) => v.vesselId === position.vesselId);
      if (!voyage) return;

      const el = createVesselMarker(position.heading || 0, position.status);

      el.addEventListener('click', () => {
        setSelectedVessel({
          ...voyage.vessel,
          position,
          voyage,
        });
        map.current?.flyTo({
          center: [position.longitude, position.latitude],
          zoom: 10,
          duration: 1500,
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([position.longitude, position.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div class="text-sm">
              <strong>${voyage.vessel.name}</strong> (${voyage.vessel.imo})
              <br/>Voyage: ${voyage.voyageNumber}
              <br/>Speed: ${position.speed?.toFixed(1) || 'N/A'} kn
              <br/>Heading: ${position.heading?.toFixed(0) || 'N/A'}°
              <br/>Status: ${position.status || 'Unknown'}
              ${position.destination ? `<br/>Dest: ${position.destination}` : ''}
              <br/><small class="text-gray-500">Updated: ${new Date(position.timestamp).toLocaleString()}</small>
            </div>`
          )
        )
        .addTo(map.current!);

      markersRef.current.push(marker);

      // Draw route line if both ports exist
      if (voyage.departurePort?.latitude && voyage.arrivalPort?.latitude) {
        drawRouteLine(
          [voyage.departurePort.longitude, voyage.departurePort.latitude],
          [position.longitude, position.latitude],
          [voyage.arrivalPort.longitude, voyage.arrivalPort.latitude]
        );
      }
    });

    // Fit map to show all markers if we have any
    if (markersRef.current.length > 0 && map.current) {
      const bounds = new maplibregl.LngLatBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }
  }, [data, voyageId]);

  const createPortMarker = (type: 'departure' | 'arrival') => {
    const el = document.createElement('div');
    el.className = 'port-marker';
    el.style.width = '16px';
    el.style.height = '16px';
    el.style.backgroundColor = type === 'departure' ? '#10b981' : '#ef4444';
    el.style.border = '3px solid white';
    el.style.borderRadius = '50%';
    el.style.cursor = 'pointer';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    return el;
  };

  const createVesselMarker = (heading: number, status?: string) => {
    const el = document.createElement('div');
    el.className = 'vessel-marker';
    el.innerHTML = '🚢';
    el.style.fontSize = '24px';
    el.style.cursor = 'pointer';
    el.style.transform = `rotate(${heading}deg)`;
    el.style.filter = status === 'at_anchor' ? 'grayscale(50%)' : 'none';
    el.style.transition = 'transform 0.3s ease';
    return el;
  };

  const drawRouteLine = (
    departure: [number, number],
    current: [number, number],
    arrival: [number, number]
  ) => {
    if (!map.current) return;

    const completedLineId = `route-completed-${Date.now()}`;
    const remainingLineId = `route-remaining-${Date.now()}`;

    // Completed portion (departure to current)
    if (!map.current.getSource(completedLineId)) {
      map.current.addSource(completedLineId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [departure, current],
          },
        },
      });

      map.current.addLayer({
        id: completedLineId,
        type: 'line',
        source: completedLineId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#10b981',
          'line-width': 3,
          'line-opacity': 0.7,
        },
      });
    }

    // Remaining portion (current to arrival)
    if (!map.current.getSource(remainingLineId)) {
      map.current.addSource(remainingLineId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [current, arrival],
          },
        },
      });

      map.current.addLayer({
        id: remainingLineId,
        type: 'line',
        source: remainingLineId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-dasharray': [2, 2],
          'line-opacity': 0.5,
        },
      });
    }
  };

  return (
    <div className="relative" style={{ height }}>
      {loading && (
        <div className="absolute top-4 left-4 bg-maritime-800 border border-maritime-600 rounded px-3 py-2 z-10">
          <p className="text-maritime-300 text-sm">Loading positions...</p>
        </div>
      )}

      {selectedVessel && (
        <div className="absolute top-4 right-4 bg-maritime-900 border border-maritime-600 rounded-lg p-4 z-10 max-w-xs">
          <button
            onClick={() => setSelectedVessel(null)}
            className="absolute top-2 right-2 text-maritime-400 hover:text-white"
          >
            ✕
          </button>
          <h3 className="text-white font-bold mb-2">{selectedVessel.name}</h3>
          <div className="text-xs text-maritime-300 space-y-1">
            <p><strong>IMO:</strong> {selectedVessel.imo}</p>
            <p><strong>Type:</strong> {selectedVessel.type}</p>
            <p><strong>Voyage:</strong> {selectedVessel.voyage.voyageNumber}</p>
            <p><strong>Status:</strong> {selectedVessel.voyage.status}</p>
            {selectedVessel.position && (
              <>
                <p><strong>Speed:</strong> {selectedVessel.position.speed?.toFixed(1) || 'N/A'} knots</p>
                <p><strong>Heading:</strong> {selectedVessel.position.heading?.toFixed(0) || 'N/A'}°</p>
                <p><strong>Position:</strong> {selectedVessel.position.latitude.toFixed(4)}°N, {selectedVessel.position.longitude.toFixed(4)}°E</p>
                {selectedVessel.position.destination && (
                  <p><strong>Destination:</strong> {selectedVessel.position.destination}</p>
                )}
                <p className="text-maritime-500 text-xs mt-2">
                  Updated: {new Date(selectedVessel.position.timestamp).toLocaleString()}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-maritime-900/90 border border-maritime-600 rounded-lg p-3 z-10">
        <div className="flex items-center gap-4 text-xs text-maritime-300">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
            <span>Departure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
            <span>Arrival</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🚢</span>
            <span>Vessel</span>
          </div>
        </div>
      </div>

      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
