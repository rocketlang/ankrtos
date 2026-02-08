import { useQuery } from '@apollo/client';
import { gql } from '../__generated__/gql';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

const HYBRID_VESSELS_QUERY = gql(`
  query HybridVesselPositions(
    $minLat: Float!
    $maxLat: Float!
    $minLng: Float!
    $maxLng: Float!
    $limit: Int
    $includeSatellite: Boolean
  ) {
    hybridVesselPositions(
      minLat: $minLat
      maxLat: $maxLat
      minLng: $minLng
      maxLng: $maxLng
      limit: $limit
      includeSatellite: $includeSatellite
    ) {
      vessels {
        vesselId
        mmsi
        vesselName
        vesselType
        latitude
        longitude
        speed
        heading
        course
        timestamp
        source
        quality
      }
      stats {
        totalVessels
        terrestrialVessels
        satelliteVessels
        coverageImprovement
        lastUpdated
      }
    }
  }
`);

// Update bounds when map moves
function MapBoundsUpdater({ onBoundsChange }: { onBoundsChange: (bounds: any) => void }) {
  const map = useMap();

  useEffect(() => {
    const updateBounds = () => {
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    };

    map.on('moveend', updateBounds);
    updateBounds(); // Initial bounds

    return () => {
      map.off('moveend', updateBounds);
    };
  }, [map, onBoundsChange]);

  return null;
}

export default function HybridAISMap() {
  const [includeSatellite, setIncludeSatellite] = useState(true);
  const [mapBounds, setMapBounds] = useState({
    minLat: 5,
    maxLat: 25,
    minLng: 50,
    maxLng: 75,
  });

  const { data, loading, error, refetch } = useQuery(HYBRID_VESSELS_QUERY, {
    variables: {
      ...mapBounds,
      limit: 1000,
      includeSatellite,
    },
    pollInterval: 60000, // Refresh every 60 seconds
    errorPolicy: 'all',
  });

  const vessels = data?.hybridVesselPositions?.vessels || [];
  const stats = data?.hybridVesselPositions?.stats;

  return (
    <div className="h-screen flex flex-col bg-maritime-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🛰️ Hybrid AIS Map</h1>
              <p className="text-blue-100 text-sm">Terrestrial + Satellite Coverage</p>
            </div>
            {stats && (
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalVessels}</div>
                  <div className="text-blue-200">Total Vessels</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.terrestrialVessels}</div>
                  <div className="text-blue-200">Terrestrial</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">{stats.satelliteVessels}</div>
                  <div className="text-blue-200">Satellite</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    +{stats.coverageImprovement.toFixed(0)}%
                  </div>
                  <div className="text-blue-200">Improvement</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-3 bg-maritime-900 border-b border-maritime-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-maritime-200">
            <input
              type="checkbox"
              checked={includeSatellite}
              onChange={(e) => setIncludeSatellite(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-medium">Include Satellite AIS</span>
            <span className="text-xs text-maritime-400">(GFW)</span>
          </label>
          <div className="flex gap-3 ml-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-maritime-300">Terrestrial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
              <span className="text-sm text-maritime-300">Satellite</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && vessels.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-maritime-950/90 z-10">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-maritime-300">Loading hybrid AIS data...</p>
            </div>
          </div>
        )}

        {error && vessels.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-maritime-950/90 z-10">
            <div className="text-center">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <p className="text-maritime-300">Failed to load vessel data</p>
              <p className="text-maritime-500 text-sm mt-2">{error.message}</p>
            </div>
          </div>
        )}

        <MapContainer
          center={[15, 62.5]} // Arabian Sea center
          zoom={5}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsUpdater onBoundsChange={setMapBounds} />

          {vessels.map((vessel) => (
            <CircleMarker
              key={vessel.vesselId}
              center={[vessel.latitude, vessel.longitude]}
              radius={6}
              fillColor={vessel.source === 'terrestrial' ? '#10b981' : '#22d3ee'}
              color="#fff"
              weight={1}
              fillOpacity={0.8}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-base mb-2">
                    {vessel.vesselName || `MMSI ${vessel.mmsi}`}
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">MMSI:</span> {vessel.mmsi}
                    </div>
                    {vessel.vesselType && (
                      <div>
                        <span className="font-medium">Type:</span> {vessel.vesselType}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Position:</span>{' '}
                      {vessel.latitude.toFixed(4)}°, {vessel.longitude.toFixed(4)}°
                    </div>
                    {vessel.speed && (
                      <div>
                        <span className="font-medium">Speed:</span> {vessel.speed.toFixed(1)} kn
                      </div>
                    )}
                    {vessel.course && (
                      <div>
                        <span className="font-medium">Course:</span> {vessel.course.toFixed(0)}°
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Source:</span>{' '}
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          vessel.source === 'terrestrial'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-cyan-100 text-cyan-800'
                        }`}
                      >
                        {vessel.source === 'terrestrial' ? '📡 Terrestrial' : '🛰️ Satellite'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(vessel.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
