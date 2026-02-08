import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useQuery, gql } from '@apollo/client';
import 'leaflet/dist/leaflet.css';

const PORTS_FOR_MAP_QUERY = gql`
  query PortsForMap($limit: Int, $withOpenSeaMap: Boolean) {
    portsForMap(limit: $limit, withOpenSeaMap: $withOpenSeaMap) {
      id
      unlocode
      name
      country
      latitude
      longitude
      type
      hasOpenSeaMap
      openSeaMapFeatureCount
    }
  }
`;

interface Port {
  id: string;
  unlocode: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  type: string;
  hasOpenSeaMap: boolean;
  openSeaMapFeatureCount: number;
}

interface OpenSeaPortsMapProps {
  limit?: number;
  withOpenSeaMap?: boolean;
  height?: string;
}

// Port type to color mapping
const getPortColor = (port: Port): string => {
  if (port.hasOpenSeaMap && port.openSeaMapFeatureCount > 50) {
    return '#10b981'; // green - well-mapped
  } else if (port.hasOpenSeaMap && port.openSeaMapFeatureCount > 10) {
    return '#3b82f6'; // blue - moderately mapped
  } else if (port.hasOpenSeaMap) {
    return '#f59e0b'; // amber - basic mapping
  } else {
    return '#6b7280'; // gray - not mapped
  }
};

// Get port size based on feature count
const getPortSize = (port: Port): number => {
  if (port.openSeaMapFeatureCount > 100) return 8;
  if (port.openSeaMapFeatureCount > 50) return 6;
  if (port.openSeaMapFeatureCount > 10) return 5;
  if (port.hasOpenSeaMap) return 4;
  return 3;
};

// Component to fit bounds when data loads
function MapBounds({ ports }: { ports: Port[] }) {
  const map = useMap();

  useEffect(() => {
    if (ports.length > 0) {
      const bounds = ports
        .filter(p => p.latitude && p.longitude)
        .map(p => [p.latitude!, p.longitude!] as [number, number]);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      }
    }
  }, [ports, map]);

  return null;
}

export default function OpenSeaPortsMap({
  limit = 2000,
  withOpenSeaMap = false,
  height = '700px'
}: OpenSeaPortsMapProps) {
  const { data, loading, error } = useQuery(PORTS_FOR_MAP_QUERY, {
    variables: { limit, withOpenSeaMap },
    pollInterval: 300000, // Update every 5 minutes
  });

  const ports: Port[] = data?.portsForMap || [];

  // Calculate statistics
  const totalPorts = ports.length;
  const portsWithOpenSeaMap = ports.filter(p => p.hasOpenSeaMap).length;
  const wellMappedPorts = ports.filter(p => p.openSeaMapFeatureCount > 50).length;
  const avgFeatures = ports.length > 0
    ? Math.round(ports.reduce((sum, p) => sum + p.openSeaMapFeatureCount, 0) / ports.length)
    : 0;

  // Count by country
  const countryCount = ports.reduce((acc, port) => {
    acc[port.country] = (acc[port.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const uniqueCountries = Object.keys(countryCount).length;

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-900 to-blue-900 rounded-xl p-8 flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-400 border-t-transparent mb-4 mx-auto"></div>
          <p className="text-xl text-blue-200">Loading port locations...</p>
          <p className="text-sm text-cyan-300 mt-2">Mapping {limit.toLocaleString()} ports worldwide</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-900 to-red-900 rounded-xl p-8" style={{ height }}>
        <div className="text-center">
          <p className="text-xl text-red-200">Failed to load port data</p>
          <p className="text-sm text-red-300 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-cyan-900 to-blue-900 rounded-t-xl p-4">
        <div className="flex flex-wrap gap-6 justify-center text-white">
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-300">{totalPorts.toLocaleString()}</div>
            <div className="text-xs text-blue-200">Total Ports</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-300">{portsWithOpenSeaMap.toLocaleString()}</div>
            <div className="text-xs text-blue-200">OpenSeaMap Coverage</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-300">{wellMappedPorts.toLocaleString()}</div>
            <div className="text-xs text-blue-200">Well-Mapped (50+ features)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-300">{uniqueCountries}</div>
            <div className="text-xs text-blue-200">Countries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-300">{avgFeatures}</div>
            <div className="text-xs text-blue-200">Avg Features/Port</div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="overflow-hidden shadow-2xl" style={{ height }}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapBounds ports={ports} />

          {ports.map((port) => (
            <CircleMarker
              key={port.id}
              center={[port.latitude, port.longitude]}
              radius={getPortSize(port)}
              fillColor={getPortColor(port)}
              color="#ffffff"
              weight={1}
              opacity={0.9}
              fillOpacity={0.7}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-bold text-lg mb-2">{port.name}</h3>
                  <div className="space-y-1">
                    <p><span className="font-semibold">UN/LOCODE:</span> {port.unlocode}</p>
                    <p><span className="font-semibold">Country:</span> {port.country}</p>
                    <p><span className="font-semibold">Type:</span> {port.type.replace(/_/g, ' ')}</p>
                    <p>
                      <span className="font-semibold">OpenSeaMap:</span>{' '}
                      {port.hasOpenSeaMap ? (
                        <span className="text-green-600 font-bold">
                          ✓ {port.openSeaMapFeatureCount} features
                        </span>
                      ) : (
                        <span className="text-gray-400">Not mapped</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      {port.latitude.toFixed(4)}°, {port.longitude.toFixed(4)}°
                    </p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="bg-slate-900 rounded-b-xl p-4">
        <div className="flex flex-wrap gap-6 justify-center text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Well-Mapped (50+ features)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-blue-500"></div>
            <span>Moderately Mapped (10-50 features)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Basic Mapping (&lt;10 features)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
            <span>No OpenSeaMap Data</span>
          </div>
        </div>
        <div className="text-center mt-3 text-xs text-gray-400">
          Data from <a href="https://openseamap.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">OpenSeaMap.org</a>
          {' '}- The free nautical chart
        </div>
      </div>
    </div>
  );
}
