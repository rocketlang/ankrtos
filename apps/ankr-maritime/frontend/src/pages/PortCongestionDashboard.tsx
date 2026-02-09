/**
 * PORT CONGESTION DASHBOARD
 * Live real-time port congestion monitoring using AIS data
 */

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LIVE_PORT_CONGESTION_QUERY = gql`
  query LivePortCongestionDashboard {
    livePortCongestionDashboard {
      overview {
        totalPorts
        portsMonitored
        totalVesselsInPorts
        criticalCongestion
        highCongestion
        averageWaitTime
      }
      topCongested {
        portId
        portName
        unlocode
        country
        latitude
        longitude
        vesselsInArea
        vesselsAnchored
        vesselsMoving
        congestionLevel
        congestionScore
        averageSpeed
        recentArrivals24h
        recentDepartures24h
        estimatedWaitTime
        trend
        lastUpdated
      }
      allPorts {
        portId
        portName
        unlocode
        country
        latitude
        longitude
        vesselsInArea
        vesselsAnchored
        congestionLevel
        congestionScore
        estimatedWaitTime
        trend
      }
    }
  }
`;

export default function PortCongestionDashboard() {
  const [selectedCongestionLevel, setSelectedCongestionLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, loading, error } = useQuery(LIVE_PORT_CONGESTION_QUERY, {
    pollInterval: 60000, // Refresh every minute
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">⚓ Live Port Congestion</h1>
          <div className="text-center py-12 text-gray-600">Loading congestion data...</div>
        </div>
      </div>
    );
  }

  if (error || !data?.livePortCongestionDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">⚓ Live Port Congestion</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">Error loading congestion data: {error?.message || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { overview, topCongested, allPorts } = data.livePortCongestionDashboard;

  // Filter ports
  const filteredPorts = allPorts.filter((port: any) => {
    const matchesSearch = port.portName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         port.unlocode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         port.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedCongestionLevel === 'all' || port.congestionLevel === selectedCongestionLevel;
    return matchesSearch && matchesLevel;
  });

  // Congestion level colors
  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'critical': return '#ef4444'; // red
      case 'high': return '#f97316'; // orange
      case 'medium': return '#eab308'; // yellow
      case 'low': return '#22c55e'; // green
      default: return '#6b7280'; // gray
    }
  };

  // Trend indicator
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↑';
      case 'decreasing': return '↓';
      case 'stable': return '→';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">⚓ Live Port Congestion</h1>
          <p className="text-gray-600">Real-time port congestion monitoring from AIS data</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Total Ports</div>
            <div className="text-3xl font-bold text-gray-900">{overview.totalPorts}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Monitored</div>
            <div className="text-3xl font-bold text-blue-600">{overview.portsMonitored}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Total Vessels</div>
            <div className="text-3xl font-bold text-gray-900">{overview.totalVesselsInPorts}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Critical</div>
            <div className="text-3xl font-bold text-red-600">{overview.criticalCongestion}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">High</div>
            <div className="text-3xl font-bold text-orange-600">{overview.highCongestion}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Avg Wait</div>
            <div className="text-3xl font-bold text-gray-900">{overview.averageWaitTime}</div>
            <div className="text-xs text-gray-500">minutes</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by port name, UNLOCODE, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'critical', 'high', 'medium', 'low'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedCongestionLevel(level)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedCongestionLevel === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Port Congestion Map */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Congestion Map</h2>
            <div style={{ height: '600px' }}>
              <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ height: '100%', width: '100%', borderRadius: '8px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Port markers with congestion circles */}
                {filteredPorts.map((port: any) => (
                  <Circle
                    key={port.portId}
                    center={[port.latitude, port.longitude]}
                    radius={port.congestionScore * 500} // Scale based on congestion score
                    pathOptions={{
                      color: getCongestionColor(port.congestionLevel),
                      fillColor: getCongestionColor(port.congestionLevel),
                      fillOpacity: 0.4,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <div className="font-bold text-lg">{port.portName}</div>
                        <div className="text-sm text-gray-600 mb-2">
                          {port.unlocode} • {port.country}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>Vessels in Area: <strong>{port.vesselsInArea}</strong></div>
                          <div>Anchored: <strong>{port.vesselsAnchored}</strong></div>
                          <div>
                            Congestion:{' '}
                            <span
                              className="font-bold"
                              style={{ color: getCongestionColor(port.congestionLevel) }}
                            >
                              {port.congestionLevel.toUpperCase()} ({port.congestionScore})
                            </span>
                          </div>
                          {port.estimatedWaitTime && (
                            <div>Wait Time: <strong>{port.estimatedWaitTime} min</strong></div>
                          )}
                          <div>Trend: <strong>{getTrendIcon(port.trend)} {port.trend}</strong></div>
                        </div>
                      </div>
                    </Popup>
                  </Circle>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Port Congestion Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Port Details</h2>
            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              {filteredPorts.length === 0 ? (
                <div className="text-center py-8 text-gray-600">No ports found matching your filters</div>
              ) : (
                <div className="space-y-3">
                  {filteredPorts.map((port: any) => (
                    <div
                      key={port.portId}
                      className="border rounded-lg p-4 hover:shadow-md transition"
                      style={{ borderLeftWidth: '4px', borderLeftColor: getCongestionColor(port.congestionLevel) }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-lg">{port.portName}</div>
                          <div className="text-sm text-gray-600">
                            {port.unlocode} • {port.country}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: getCongestionColor(port.congestionLevel) + '20',
                              color: getCongestionColor(port.congestionLevel),
                            }}
                          >
                            {port.congestionLevel.toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Score: {port.congestionScore}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-gray-600">Vessels</div>
                          <div className="font-semibold">{port.vesselsInArea}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Anchored</div>
                          <div className="font-semibold">{port.vesselsAnchored}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Wait Time</div>
                          <div className="font-semibold">
                            {port.estimatedWaitTime ? `${port.estimatedWaitTime}m` : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-sm">
                        <div className="text-gray-600">
                          Trend: <span className="font-medium">{getTrendIcon(port.trend)} {port.trend}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Congested Ports Section */}
        {topCongested && topCongested.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">🔥 Top Congested Ports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topCongested.slice(0, 6).map((port: any) => (
                <div
                  key={port.portId}
                  className="border-2 rounded-lg p-4"
                  style={{ borderColor: getCongestionColor(port.congestionLevel) }}
                >
                  <div className="font-bold text-lg mb-2">{port.portName}</div>
                  <div className="text-sm text-gray-600 mb-3">{port.unlocode}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Vessels: <strong>{port.vesselsInArea}</strong></div>
                    <div>Anchored: <strong>{port.vesselsAnchored}</strong></div>
                    <div>Moving: <strong>{port.vesselsMoving}</strong></div>
                    <div>Avg Speed: <strong>{port.averageSpeed.toFixed(1)} kn</strong></div>
                    <div>Arrivals 24h: <strong>{port.recentArrivals24h}</strong></div>
                    <div>Departures 24h: <strong>{port.recentDepartures24h}</strong></div>
                  </div>
                  {port.estimatedWaitTime && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                      <div className="text-sm text-gray-600">Estimated Wait Time</div>
                      <div className="text-2xl font-bold text-orange-600">{port.estimatedWaitTime}</div>
                      <div className="text-xs text-gray-500">minutes</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
