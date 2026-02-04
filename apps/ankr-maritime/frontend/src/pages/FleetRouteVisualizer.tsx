/**
 * Fleet Collaborative Route Visualizer
 * Shows Ships A, B, C on the map with their current positions
 * Displays how their routes merge to create the optimal route for Ship D
 */

import React, { useState } from 'react';
import { useQuery, gql, useMutation } from '@apollo/client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const GET_FLEET_ON_ROUTE = gql`
  query GetFleetOnRoute($originPortId: String!, $destPortId: String!, $vesselType: String!) {
    fleetOnRoute(originPortId: $originPortId, destPortId: $destPortId, vesselType: $vesselType)
  }
`;

const GET_ACTIVE_VESSELS = gql`
  query GetActiveVessels($vesselType: String, $limit: Int) {
    activeVesselsOnRoutes(vesselType: $vesselType, limit: $limit)
  }
`;

const CALCULATE_ROUTE_WITH_FLEET = gql`
  mutation CalculateRouteWithFleet(
    $vesselId: String!
    $originPortId: String!
    $destPortId: String!
    $useFleetIntelligence: Boolean
  ) {
    calculateRoute(
      vesselId: $vesselId
      originPortId: $originPortId
      destPortId: $destPortId
      useFleetIntelligence: $useFleetIntelligence
    )
  }
`;

// Major routes for testing
const MAJOR_ROUTES = [
  {
    id: 'sgsin-nlrtm',
    name: 'Singapore → Rotterdam',
    origin: { id: 'port-sgsin', name: 'Singapore', lat: 1.2897, lng: 103.8501 },
    dest: { id: 'port-nlrtm', name: 'Rotterdam', lat: 51.9244, lng: 4.4777 },
  },
  {
    id: 'cnsha-uslax',
    name: 'Shanghai → Los Angeles',
    origin: { id: 'port-cnsha', name: 'Shanghai', lat: 31.2304, lng: 121.4737 },
    dest: { id: 'port-uslax', name: 'Los Angeles', lat: 33.7517, lng: -118.1877 },
  },
  {
    id: 'inmun-aejea',
    name: 'Mumbai → Jebel Ali',
    origin: { id: 'port-inmun', name: 'Mumbai', lat: 18.9220, lng: 72.8347 },
    dest: { id: 'port-aejea', name: 'Jebel Ali', lat: 25.0118, lng: 55.1136 },
  },
];

const VESSEL_TYPES = [
  { value: 'container', label: 'Container Ship', color: '#3B82F6' },
  { value: 'tanker', label: 'Tanker', color: '#EF4444' },
  { value: 'bulk_carrier', label: 'Bulk Carrier', color: '#F59E0B' },
  { value: 'general_cargo', label: 'General Cargo', color: '#10B981' },
];

export default function FleetRouteVisualizer() {
  const [selectedRoute, setSelectedRoute] = useState(MAJOR_ROUTES[0]);
  const [selectedVesselType, setSelectedVesselType] = useState(VESSEL_TYPES[0]);
  const [calculatedRoute, setCalculatedRoute] = useState<any>(null);

  const { data: fleetData, loading: fleetLoading } = useQuery(GET_FLEET_ON_ROUTE, {
    variables: {
      originPortId: selectedRoute.origin.id,
      destPortId: selectedRoute.dest.id,
      vesselType: selectedVesselType.value,
    },
    pollInterval: 30000, // Refresh every 30 seconds (real-time fleet positions!)
  });

  const { data: activeVesselsData } = useQuery(GET_ACTIVE_VESSELS, {
    variables: {
      vesselType: selectedVesselType.value,
      limit: 50,
    },
    pollInterval: 30000,
  });

  const [calculateRoute] = useMutation(CALCULATE_ROUTE_WITH_FLEET);

  const fleet = fleetData?.fleetOnRoute;
  const activeVessels = activeVesselsData?.activeVesselsOnRoutes || [];

  const getProgressColor = (progress: number) => {
    if (progress < 30) return '#10B981'; // Green - just started
    if (progress < 60) return '#F59E0B'; // Orange - halfway
    return '#3B82F6'; // Blue - almost there
  };

  const handleCalculateRoute = async () => {
    if (!activeVessels || activeVessels.length === 0) {
      alert('No active vessels found for this route. Cannot calculate with fleet intelligence.');
      return;
    }

    try {
      const result = await calculateRoute({
        variables: {
          vesselId: activeVessels[0].vesselId, // Use first vessel as example
          originPortId: selectedRoute.origin.id,
          destPortId: selectedRoute.dest.id,
          useFleetIntelligence: true, // YOUR BRILLIANT FEATURE!
        },
      });

      setCalculatedRoute(result.data.calculateRoute);
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  // Calculate map center from route
  const mapCenter: [number, number] = [
    (selectedRoute.origin.lat + selectedRoute.dest.lat) / 2,
    (selectedRoute.origin.lng + selectedRoute.dest.lng) / 2,
  ];

  if (fleetLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading fleet data...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🚢 Fleet Collaborative Routing
            </h1>
            <p className="text-gray-600 mt-1">
              Watch Ships A, B, C create the optimal route for Ship D!
            </p>
          </div>

          <div className="flex gap-4">
            <select
              value={selectedRoute.id}
              onChange={(e) => {
                const route = MAJOR_ROUTES.find((r) => r.id === e.target.value);
                if (route) setSelectedRoute(route);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              {MAJOR_ROUTES.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>

            <select
              value={selectedVesselType.value}
              onChange={(e) => {
                const type = VESSEL_TYPES.find((t) => t.value === e.target.value);
                if (type) setSelectedVesselType(type);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              {VESSEL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleCalculateRoute}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Calculate Route with Fleet Intelligence
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-4">
        {/* Map */}
        <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
          <MapContainer
            center={mapCenter}
            zoom={3}
            style={{ height: '100%', width: '100%' }}
            key={`${selectedRoute.id}-${selectedVesselType.value}`}
          >
            {/* Base map */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />

            {/* OpenSeaMap nautical overlay */}
            <TileLayer
              url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
              attribution='&copy; OpenSeaMap'
            />

            {/* Origin and Destination Ports */}
            <Circle
              center={[selectedRoute.origin.lat, selectedRoute.origin.lng]}
              radius={50000}
              pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.3 }}
            >
              <Popup>
                <div className="font-bold">{selectedRoute.origin.name}</div>
                <div className="text-sm text-gray-600">Origin Port</div>
              </Popup>
            </Circle>

            <Circle
              center={[selectedRoute.dest.lat, selectedRoute.dest.lng]}
              radius={50000}
              pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3 }}
            >
              <Popup>
                <div className="font-bold">{selectedRoute.dest.name}</div>
                <div className="text-sm text-gray-600">Destination Port</div>
              </Popup>
            </Circle>

            {/* Direct route line (base route) */}
            <Polyline
              positions={[
                [selectedRoute.origin.lat, selectedRoute.origin.lng],
                [selectedRoute.dest.lat, selectedRoute.dest.lng],
              ]}
              pathOptions={{ color: '#9CA3AF', weight: 2, dashArray: '10, 10' }}
            />

            {/* Active fleet vessels (Ships A, B, C) */}
            {fleet?.activeVessels?.map((vessel: any, idx: number) => (
              <Circle
                key={vessel.vesselId}
                center={[vessel.latitude, vessel.longitude]}
                radius={30000}
                pathOptions={{
                  color: getProgressColor(vessel.routeProgress),
                  fillColor: getProgressColor(vessel.routeProgress),
                  fillOpacity: 0.7,
                  weight: 3,
                }}
              >
                <Popup>
                  <div className="p-2">
                    <div className="font-bold text-lg">
                      Ship {String.fromCharCode(65 + idx)} - {vessel.vesselName}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Type: {vessel.vesselType}
                    </div>
                    <div className="text-sm text-gray-600">
                      Speed: {vessel.speed.toFixed(1)} knots
                    </div>
                    <div className="text-sm text-gray-600">
                      Heading: {vessel.heading}°
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-medium">
                        Progress: {vessel.routeProgress.toFixed(1)}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${vessel.routeProgress}%`,
                            backgroundColor: getProgressColor(vessel.routeProgress),
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Last update: {new Date(vessel.timestamp).toLocaleString()}
                    </div>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Calculated route waypoints */}
            {calculatedRoute?.waypoints && (
              <>
                <Polyline
                  positions={calculatedRoute.waypoints.map((wp: any) => [
                    wp.latitude,
                    wp.longitude,
                  ])}
                  pathOptions={{ color: '#3B82F6', weight: 3 }}
                />
                {calculatedRoute.waypoints.map((wp: any, idx: number) => (
                  <Circle
                    key={idx}
                    center={[wp.latitude, wp.longitude]}
                    radius={15000}
                    pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.5 }}
                  >
                    <Popup>
                      <div className="font-bold">{wp.name}</div>
                      <div className="text-sm">{wp.waypointType}</div>
                    </Popup>
                  </Circle>
                ))}
              </>
            )}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div className="w-96 bg-white rounded-lg shadow-lg p-6 overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Fleet Intelligence
          </h2>

          {/* Fleet Summary */}
          {fleet && (
            <div className="mb-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="font-bold text-lg mb-2">
                  {fleet.activeVessels?.length || 0} Vessels Active
                </div>
                <div className="space-y-1 text-sm">
                  <div>Avg Speed: {fleet.avgSpeed?.toFixed(1)} knots</div>
                  <div>Traffic: {fleet.trafficLevel}</div>
                  <div>Confidence: {(fleet.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Active Vessels List */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Active Fleet</h3>
            {fleet?.activeVessels?.map((vessel: any, idx: number) => (
              <div
                key={vessel.vesselId}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold">
                    Ship {String.fromCharCode(65 + idx)}
                  </div>
                  <div
                    className="px-2 py-1 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: getProgressColor(vessel.routeProgress) }}
                  >
                    {vessel.routeProgress.toFixed(0)}%
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>{vessel.vesselName}</div>
                  <div>Speed: {vessel.speed.toFixed(1)} kn</div>
                  <div>Heading: {vessel.heading}°</div>
                </div>
              </div>
            ))}

            {(!fleet?.activeVessels || fleet.activeVessels.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No vessels currently on this route.
                <br />
                Try a different route or vessel type.
              </div>
            )}
          </div>

          {/* Calculated Route Info */}
          {calculatedRoute && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">
                Calculated Route (Ship D)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">
                    {calculatedRoute.totalDistanceNm.toFixed(0)} nm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ETA:</span>
                  <span className="font-medium">
                    {calculatedRoute.estimatedHours.toFixed(1)} hrs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-medium">
                    {(calculatedRoute.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Route Type:</span>
                  <span className="font-medium">{calculatedRoute.routeType}</span>
                </div>
              </div>

              {calculatedRoute.fleetIntelligence && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
                  <div className="font-bold text-green-900 text-sm mb-2">
                    ✨ Fleet Intelligence Applied
                  </div>
                  <div className="text-xs text-green-800 space-y-1">
                    <div>
                      Active vessels: {calculatedRoute.fleetIntelligence.activeVessels}
                    </div>
                    <div>
                      Fleet avg speed: {calculatedRoute.fleetIntelligence.fleetAvgSpeed.toFixed(1)} kn
                    </div>
                    <div>
                      Vessels ahead: {calculatedRoute.fleetIntelligence.vesselsAhead}
                    </div>
                    <div>
                      Vessels behind: {calculatedRoute.fleetIntelligence.vesselsBehind}
                    </div>
                  </div>
                </div>
              )}

              {calculatedRoute.warnings && calculatedRoute.warnings.length > 0 && (
                <div className="mt-4 space-y-2">
                  {calculatedRoute.warnings.map((warning: string, idx: number) => (
                    <div
                      key={idx}
                      className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2 text-yellow-800"
                    >
                      {warning}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
