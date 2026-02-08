/**
 * VESSEL JOURNEY TRACKER
 * Intelligent hybrid tracking with AIS gap filling using GFW port visits
 * Implements the brilliant insight: Track vessels through AIS dark zones!
 */

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import VesselETA from '../components/VesselETA';
import JourneyPlayback from '../components/JourneyPlayback';
import VoyageCostWidget from '../components/VoyageCostWidget';

// GraphQL Queries
const VESSEL_STATUS = gql`
  query VesselStatus($mmsi: String!) {
    vesselStatus(mmsi: $mmsi) {
      status
      position {
        lat
        lon
      }
      speed
      heading
      timestamp
      source
      quality
      portName
      portArrival
      lastKnownPosition {
        lat
        lon
      }
      lastKnownTime
      estimatedPosition {
        lat
        lon
      }
      estimatedConfidence
    }
  }
`;

const VESSEL_JOURNEY = gql`
  query VesselJourney($mmsi: String!, $daysBack: Int) {
    vesselJourney(mmsi: $mmsi, daysBack: $daysBack) {
      vesselMmsi
      vesselName
      vesselType
      currentStatus {
        status
        position {
          lat
          lon
        }
        source
        quality
        portName
      }
      segments {
        type
        startTime
        endTime
        startPosition {
          lat
          lon
        }
        endPosition {
          lat
          lon
        }
        port
        estimatedRoute {
          lat
          lon
        }
        playbackWaypoints {
          lat
          lon
          timestamp
          speed
          heading
        }
        duration
      }
      portVisits {
        port
        arrival
        departure
        duration
        position {
          lat
          lon
        }
      }
      stats {
        totalDistance
        totalDuration
        portStops
        aisGaps
      }
    }
  }
`;

// Map component to auto-fit bounds
function MapBoundsUpdater({ segments }: { segments: any[] }) {
  const map = useMap();

  if (segments && segments.length > 0) {
    const bounds: [number, number][] = [];
    segments.forEach(seg => {
      if (seg.startPosition) bounds.push([seg.startPosition.lat, seg.startPosition.lon]);
      if (seg.endPosition) bounds.push([seg.endPosition.lat, seg.endPosition.lon]);
    });
    if (bounds.length > 0) {
      map.fitBounds(bounds);
    }
  }

  return null;
}

export default function VesselJourneyTracker() {
  const [mmsi, setMmsi] = useState('');
  const [searchMMSI, setSearchMMSI] = useState('');
  const [daysBack, setDaysBack] = useState(30);
  const [playbackPosition, setPlaybackPosition] = useState<{lat: number; lon: number; timestamp: Date} | null>(null);

  const { data: statusData, loading: statusLoading } = useQuery(VESSEL_STATUS, {
    variables: { mmsi: searchMMSI },
    skip: !searchMMSI,
  });

  const { data: journeyData, loading: journeyLoading } = useQuery(VESSEL_JOURNEY, {
    variables: { mmsi: searchMMSI, daysBack },
    skip: !searchMMSI,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchMMSI(mmsi);
  };

  const status = statusData?.vesselStatus;
  const journey = journeyData?.vesselJourney;

  // Status color coding
  const getStatusColor = (source: string) => {
    switch (source) {
      case 'AIS_LIVE': return 'text-green-600 bg-green-100';
      case 'GFW_PORT': return 'text-blue-600 bg-blue-100';
      case 'ESTIMATED': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (source: string) => {
    switch (source) {
      case 'AIS_LIVE': return '🛰️';
      case 'GFW_PORT': return '⚓';
      case 'ESTIMATED': return '📍';
      default: return '❓';
    }
  };

  // Segment colors for map
  const getSegmentColor = (type: string) => {
    switch (type) {
      case 'AIS_LIVE': return '#10b981'; // green
      case 'PORT_VISIT': return '#3b82f6'; // blue
      case 'TRANSIT_GAP': return '#f97316'; // orange
      case 'FISHING': return '#84cc16'; // lime
      default: return '#6b7280'; // gray
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Playback animation styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚢 Vessel Journey Tracker
          </h1>
          <p className="text-gray-600">
            Intelligent hybrid tracking with AIS gap filling using GFW port visits
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vessel MMSI
              </label>
              <input
                type="text"
                value={mmsi}
                onChange={(e) => setMmsi(e.target.value)}
                placeholder="e.g., 477995900"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days Back
              </label>
              <select
                value={daysBack}
                onChange={(e) => setDaysBack(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Track Vessel
            </button>
          </form>
        </div>

        {/* Current Status Card */}
        {status && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Current Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status Badge */}
              <div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(status.source)}`}>
                  <span className="text-2xl">{getStatusIcon(status.source)}</span>
                  <span className="font-semibold">{status.status}</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Quality: {(status.quality * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">
                  Source: {status.source}
                </div>
              </div>

              {/* Position */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Position</h3>
                {status.position ? (
                  <div className="text-sm">
                    <div>Lat: {status.position.lat.toFixed(4)}</div>
                    <div>Lon: {status.position.lon.toFixed(4)}</div>
                    {status.speed !== null && <div>Speed: {status.speed.toFixed(1)} kn</div>}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Position unavailable</div>
                )}
              </div>

              {/* Port Info or Estimated */}
              <div>
                {status.portName ? (
                  <>
                    <h3 className="font-semibold text-gray-700 mb-2">At Port</h3>
                    <div className="text-sm">
                      <div className="font-medium">{status.portName}</div>
                      {status.portArrival && (
                        <div className="text-gray-600">
                          Arrived: {new Date(status.portArrival).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </>
                ) : status.estimatedPosition ? (
                  <>
                    <h3 className="font-semibold text-gray-700 mb-2">Estimated</h3>
                    <div className="text-sm">
                      <div>Confidence: {(status.estimatedConfidence * 100).toFixed(0)}%</div>
                      <div className="text-gray-600 mt-1">
                        Last known: {status.lastKnownTime ? new Date(status.lastKnownTime).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* ETA Prediction */}
        {searchMMSI && (
          <div className="mb-6">
            <VesselETA mmsi={searchMMSI} mode="predict" />
          </div>
        )}

        {/* Voyage Cost Estimate */}
        {searchMMSI && (
          <div className="mb-6">
            <VoyageCostWidget mmsi={searchMMSI} daysBack={daysBack} />
          </div>
        )}

        {/* Journey Playback */}
        {journey && (
          <JourneyPlayback
            segments={journey.segments}
            onPositionChange={setPlaybackPosition}
          />
        )}

        {/* Journey Map and Timeline */}
        {journey && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-blue-600">{journey.stats.portStops}</div>
                <div className="text-sm text-gray-600">Port Stops</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-orange-600">{journey.stats.aisGaps}</div>
                <div className="text-sm text-gray-600">AIS Gaps Filled</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-green-600">
                  {journey.stats.totalDuration.toFixed(0)}h
                </div>
                <div className="text-sm text-gray-600">Total Duration</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {journey.segments.length}
                </div>
                <div className="text-sm text-gray-600">Journey Segments</div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-2xl font-bold mb-4">Journey Map</h2>
              <div className="h-[600px] rounded-lg overflow-hidden">
                <MapContainer
                  center={[20, 60]}
                  zoom={4}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <MapBoundsUpdater segments={journey.segments} />

                  {/* Draw segments */}
                  {journey.segments.map((segment: any, idx: number) => {
                    if (segment.estimatedRoute && segment.estimatedRoute.length > 0) {
                      // Draw estimated route for gaps
                      const positions = segment.estimatedRoute.map((p: any) => [p.lat, p.lon]);
                      return (
                        <Polyline
                          key={idx}
                          positions={positions}
                          pathOptions={{
                            color: getSegmentColor(segment.type),
                            weight: 3,
                            opacity: 0.7,
                            dashArray: segment.type === 'TRANSIT_GAP' ? '10, 10' : undefined,
                          }}
                        />
                      );
                    } else if (segment.startPosition && segment.endPosition) {
                      // Draw direct line for port visits
                      return (
                        <Polyline
                          key={idx}
                          positions={[
                            [segment.startPosition.lat, segment.startPosition.lon],
                            [segment.endPosition.lat, segment.endPosition.lon],
                          ]}
                          pathOptions={{
                            color: getSegmentColor(segment.type),
                            weight: 4,
                            opacity: 0.8,
                          }}
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Port markers */}
                  {journey.portVisits.map((port: any, idx: number) => (
                    <Marker
                      key={idx}
                      position={[port.position.lat, port.position.lon]}
                      icon={L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background: #3b82f6; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">⚓</div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16],
                      })}
                    >
                      <Popup>
                        <div className="p-2">
                          <div className="font-bold text-blue-600">{port.port}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Arrived: {new Date(port.arrival).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            Departed: {new Date(port.departure).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            Duration: {port.duration.toFixed(1)}h
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Current position */}
                  {journey.currentStatus.position && !playbackPosition && (
                    <Marker
                      position={[journey.currentStatus.position.lat, journey.currentStatus.position.lon]}
                      icon={L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background: #10b981; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">🚢</div>`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20],
                      })}
                    >
                      <Popup>
                        <div className="p-2">
                          <div className="font-bold text-green-600">Current Position</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {journey.vesselName || journey.vesselMmsi}
                          </div>
                          <div className="text-sm text-gray-600">
                            Status: {journey.currentStatus.status}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Playback position */}
                  {playbackPosition && (
                    <Marker
                      position={[playbackPosition.lat, playbackPosition.lon]}
                      icon={L.divIcon({
                        className: 'playback-marker',
                        html: `<div style="background: #8b5cf6; color: white; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; border: 4px solid #a78bfa; box-shadow: 0 4px 12px rgba(139,92,246,0.6); animation: pulse 2s infinite;">🚢</div>`,
                        iconSize: [48, 48],
                        iconAnchor: [24, 24],
                      })}
                    >
                      <Popup>
                        <div className="p-2">
                          <div className="font-bold text-purple-600">Playback Position</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {journey.vesselName || journey.vesselMmsi}
                          </div>
                          <div className="text-sm text-gray-600">
                            Time: {playbackPosition.timestamp.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            Lat: {playbackPosition.lat.toFixed(4)}, Lon: {playbackPosition.lon.toFixed(4)}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>

              {/* Legend */}
              <div className="mt-4 flex gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-green-500"></div>
                  <span>AIS Live</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-blue-500"></div>
                  <span>Port Visit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-orange-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f97316 0, #f97316 10px, transparent 10px, transparent 20px)' }}></div>
                  <span>Transit Gap (Estimated)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl">🚢</div>
                  <span className="text-purple-600 font-medium">Playback Position</span>
                </div>
              </div>
            </div>

            {/* Journey Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Journey Timeline</h2>
              <div className="space-y-4">
                {journey.segments.map((segment: any, idx: number) => (
                  <div
                    key={idx}
                    className={`border-l-4 pl-4 py-3 ${
                      segment.type === 'PORT_VISIT' ? 'border-blue-500 bg-blue-50' :
                      segment.type === 'TRANSIT_GAP' ? 'border-orange-500 bg-orange-50' :
                      'border-green-500 bg-green-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {segment.type === 'PORT_VISIT' ? `⚓ At Port: ${segment.port}` :
                           segment.type === 'TRANSIT_GAP' ? '🌊 In Transit (Gap Filled)' :
                           '🛰️ AIS Live Tracking'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(segment.startTime).toLocaleString()} → {new Date(segment.endTime).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          Duration: {segment.duration.toFixed(1)} hours
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Loading States */}
        {(statusLoading || journeyLoading) && (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Loading vessel data...</div>
          </div>
        )}

        {/* Example MMSIs */}
        {!searchMMSI && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="font-semibold text-blue-900 mb-2">Try These Example Vessels:</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <div>477995900 - Container vessel with active tracking</div>
              <div>Enter any MMSI from your database to track its journey</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
