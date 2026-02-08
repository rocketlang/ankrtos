import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useQuery, gql } from '@apollo/client';
import 'leaflet/dist/leaflet.css';

const LIVE_SHIPS_MAP_QUERY = gql`
  query LiveVesselPositions {
    liveVesselPositions {
      vesselId
      vesselName
      vesselType
      latitude
      longitude
      speed
      heading
      timestamp
    }
  }
`;

interface VesselPosition {
  vesselId: string;
  vesselName: string | null;
  vesselType: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}

interface LiveShipsMapProps {
  limit?: number;
  height?: string;
}

// Ship type to color mapping
const getShipColor = (type: string): string => {
  const typeMap: Record<string, string> = {
    tanker: '#ef4444', // red
    crude_oil_tanker: '#dc2626',
    product_tanker: '#f87171',
    chemical_tanker: '#fca5a5',
    bulk_carrier: '#f59e0b', // amber
    ore_carrier: '#d97706',
    coal_carrier: '#f59e0b',
    container: '#3b82f6', // blue
    general_cargo: '#8b5cf6', // purple
    ferry: '#10b981', // green
    passenger: '#14b8a6', // teal
    cargo: '#6366f1', // indigo
  };
  return typeMap[type.toLowerCase()] || '#6b7280'; // default gray
};

// Component to fit bounds when data loads
function MapBounds({ positions }: { positions: VesselPosition[] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = positions.map(p => [p.latitude, p.longitude] as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
  }, [positions, map]);

  return null;
}

export default function LiveShipsMap({ limit = 2000, height = '600px' }: LiveShipsMapProps) {
  const { data, loading, error } = useQuery(LIVE_SHIPS_MAP_QUERY, {
    pollInterval: 60000, // Update every 60 seconds
  });

  const positions: VesselPosition[] = data?.liveVesselPositions || [];

  // Count ships by type
  const shipCounts = positions.reduce((acc, pos) => {
    const type = pos.vesselType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalShips = positions.length;
  const movingShips = positions.filter(p => p.speed && p.speed > 0.5).length;

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-900 to-blue-900 rounded-xl p-8 flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mb-4 mx-auto"></div>
          <p className="text-xl text-blue-200">Loading live ship positions...</p>
          <p className="text-sm text-blue-300 mt-2">Fetching {limit.toLocaleString()} vessels from the ocean</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-900 to-red-900 rounded-xl p-8" style={{ height }}>
        <div className="text-center">
          <p className="text-xl text-red-200">Failed to load ship positions</p>
          <p className="text-sm text-red-300 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-cyan-900 rounded-t-xl p-4 flex flex-wrap gap-6 justify-center text-white">
        <div className="text-center">
          <div className="text-3xl font-bold text-cyan-300">{totalShips.toLocaleString()}</div>
          <div className="text-xs text-blue-200">Ships Tracked</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-300">{movingShips.toLocaleString()}</div>
          <div className="text-xs text-blue-200">Currently Moving</div>
        </div>
        {Object.entries(shipCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([type, count]) => (
            <div key={type} className="text-center">
              <div className="text-2xl font-bold" style={{ color: getShipColor(type) }}>
                {count.toLocaleString()}
              </div>
              <div className="text-xs text-blue-200 capitalize">
                {type.replace(/_/g, ' ')}
              </div>
            </div>
          ))}
      </div>

      {/* Map */}
      <div className="rounded-b-xl overflow-hidden shadow-2xl" style={{ height }}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          {/* Satellite imagery base */}
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          {/* OpenSeaMap nautical overlay */}
          <TileLayer
            url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://www.openseamap.org">OpenSeaMap</a>'
          />
          <MapBounds positions={positions} />

          {positions.map((pos, idx) => (
            <CircleMarker
              key={`${pos.vesselId}-${idx}`}
              center={[pos.latitude, pos.longitude]}
              radius={4}
              fillColor={getShipColor(pos.vesselType)}
              color="#ffffff"
              weight={1}
              opacity={0.8}
              fillOpacity={0.7}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-bold text-lg mb-2">{pos.vesselName || pos.vesselId}</h3>
                  <div className="space-y-1">
                    <p><span className="font-semibold">Type:</span> {pos.vesselType.replace(/_/g, ' ')}</p>
                    <p><span className="font-semibold">Vessel ID:</span> {pos.vesselId}</p>
                    {pos.speed && <p><span className="font-semibold">Speed:</span> {pos.speed.toFixed(1)} knots</p>}
                    {pos.heading && <p><span className="font-semibold">Heading:</span> {pos.heading.toFixed(0)}°</p>}
                    <p className="text-xs text-gray-600 mt-2">
                      {pos.latitude.toFixed(4)}°, {pos.longitude.toFixed(4)}°
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(pos.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="bg-slate-900 rounded-b-xl p-4 flex flex-wrap gap-4 justify-center text-xs">
        {Object.entries(shipCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getShipColor(type) }}
              />
              <span className="text-gray-300 capitalize">
                {type.replace(/_/g, ' ')} ({count})
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
