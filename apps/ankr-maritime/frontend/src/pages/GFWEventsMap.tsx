import { useQuery } from '@apollo/client';
import { gql } from '../__generated__/gql';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

const GFW_EVENTS_QUERY = gql(`
  query GFWEvents(
    $minLat: Float!
    $maxLat: Float!
    $minLng: Float!
    $maxLng: Float!
    $startDate: String!
    $endDate: String!
    $eventTypes: [String!]
    $limit: Int
  ) {
    gfwEvents(
      minLat: $minLat
      maxLat: $maxLat
      minLng: $minLng
      maxLng: $maxLng
      startDate: $startDate
      endDate: $endDate
      eventTypes: $eventTypes
      limit: $limit
    ) {
      events {
        id
        type
        start
        end
        position {
          lat
          lon
        }
        vessel {
          ssvid
          name
          flag
        }
        portName
      }
      total
      stats {
        fishing
        portVisits
        loitering
        encounters
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

export default function GFWEventsMap() {
  const [mapBounds, setMapBounds] = useState({
    minLat: -10,
    maxLat: 30,
    minLng: 40,
    maxLng: 80,
  });

  const [daysBack, setDaysBack] = useState(30);
  const [eventTypes, setEventTypes] = useState<string[]>(['fishing', 'port_visit', 'loitering']);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const { data, loading, error, refetch } = useQuery(GFW_EVENTS_QUERY, {
    variables: {
      ...mapBounds,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      eventTypes,
      limit: 1000,
    },
    errorPolicy: 'all',
  });

  const events = data?.gfwEvents?.events || [];
  const stats = data?.gfwEvents?.stats;

  // Event type colors
  const eventColors: Record<string, string> = {
    fishing: '#22c55e',        // Green
    port_visit: '#3b82f6',     // Blue
    loitering: '#f59e0b',      // Orange
    encounter: '#ef4444',      // Red
  };

  const eventLabels: Record<string, string> = {
    fishing: '🎣 Fishing',
    port_visit: '⚓ Port Visit',
    loitering: '🔄 Loitering',
    encounter: '🤝 Encounter',
  };

  const toggleEventType = (type: string) => {
    if (eventTypes.includes(type)) {
      setEventTypes(eventTypes.filter(t => t !== type));
    } else {
      setEventTypes([...eventTypes, type]);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-maritime-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🛰️ GFW Activity Map</h1>
              <p className="text-green-100 text-sm">Fishing, Port Visits & Loitering Events</p>
            </div>
            {stats && (
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.fishing}</div>
                  <div className="text-green-200">🎣 Fishing</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.portVisits}</div>
                  <div className="text-blue-200">⚓ Port Visits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.loitering}</div>
                  <div className="text-orange-200">🔄 Loitering</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-3 bg-maritime-900 border-b border-maritime-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Time Range */}
            <div className="flex items-center gap-2">
              <label className="text-maritime-200 text-sm font-medium">Time Range:</label>
              <select
                value={daysBack}
                onChange={(e) => setDaysBack(Number(e.target.value))}
                className="px-3 py-1 bg-maritime-800 text-maritime-200 border border-maritime-700 rounded"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            {/* Event Type Filters */}
            <div className="flex items-center gap-2 ml-6">
              <span className="text-maritime-200 text-sm font-medium">Show:</span>
              {Object.entries(eventLabels).map(([type, label]) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventTypes.includes(type)}
                    onChange={() => toggleEventType(type)}
                    className="w-4 h-4"
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: eventColors[type] }}
                  >
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && events.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-maritime-950/90 z-10">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-maritime-300">Loading GFW events...</p>
            </div>
          </div>
        )}

        {error && events.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-maritime-950/90 z-10">
            <div className="text-center">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <p className="text-maritime-300">Failed to load events</p>
              <p className="text-maritime-500 text-sm mt-2">{error.message}</p>
            </div>
          </div>
        )}

        <MapContainer
          center={[10, 60]} // Indian Ocean center
          zoom={4}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsUpdater onBoundsChange={setMapBounds} />

          {events.map((event) => (
            <CircleMarker
              key={event.id}
              center={[event.position.lat, event.position.lon]}
              radius={event.type === 'fishing' ? 8 : 6}
              fillColor={eventColors[event.type]}
              color="#fff"
              weight={1}
              fillOpacity={0.7}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-base mb-2" style={{ color: eventColors[event.type] }}>
                    {eventLabels[event.type]}
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Vessel:</span>{' '}
                      {event.vessel.name || `MMSI ${event.vessel.ssvid}`}
                    </div>
                    {event.vessel.flag && (
                      <div>
                        <span className="font-medium">Flag:</span> {event.vessel.flag}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Position:</span>{' '}
                      {event.position.lat.toFixed(4)}°, {event.position.lon.toFixed(4)}°
                    </div>
                    {event.portName && (
                      <div>
                        <span className="font-medium">Port:</span> {event.portName}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Start:</span>{' '}
                      {new Date(event.start).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">End:</span>{' '}
                      {new Date(event.end).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>{' '}
                      {Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-maritime-900/95 border border-maritime-700 rounded-lg p-4 shadow-lg z-[1000]">
          <div className="text-maritime-200 font-bold mb-3">Event Types</div>
          <div className="space-y-2">
            {Object.entries(eventLabels).map(([type, label]) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: eventColors[type] }}
                ></div>
                <span className="text-maritime-300 text-sm">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-maritime-700 text-maritime-400 text-xs">
            Total Events: {events.length}
          </div>
        </div>
      </div>
    </div>
  );
}
