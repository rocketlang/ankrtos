/**
 * WEATHER ROUTING & OPTIMIZATION
 *
 * Interactive voyage planning with weather-aware route optimization.
 * Compares 3 route alternatives:
 * 1. Great Circle (Shortest)
 * 2. Weather-Optimized (Safest)
 * 3. Fuel-Optimized (Most Economical)
 */

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import WeatherRouteMap from '../components/WeatherRouteMap';
import RouteComparison from '../components/RouteComparison';
import WeatherTimeline from '../components/WeatherTimeline';

const CALCULATE_WEATHER_ROUTES_QUERY = gql`
  query CalculateWeatherRoutes(
    $origin: PortInput!
    $destination: PortInput!
    $departureTime: DateTime!
    $vesselSpeed: Float!
    $vesselType: String!
    $fuelConsumptionRate: Float!
    $fuelPricePerMT: Float!
  ) {
    calculateWeatherRoutes(
      origin: $origin
      destination: $destination
      departureTime: $departureTime
      vesselSpeed: $vesselSpeed
      vesselType: $vesselType
      fuelConsumptionRate: $fuelConsumptionRate
      fuelPricePerMT: $fuelPricePerMT
    ) {
      alternatives {
        name
        description
        totalDistance
        estimatedDuration
        fuelConsumption
        estimatedCost
        weatherRisk
        maxWaveHeight
        maxWindSpeed
        waypoints {
          lat
          lon
          eta
          weather {
            timestamp
            windSpeed
            windDirection
            waveHeight
            waveDirection
            temperature
            precipitation
            visibility
            conditions
          }
        }
      }
      savings {
        fuelSaved
        costSaved
        timeDifference
      }
      metadata {
        calculatedAt
        weatherDataSource
        routingAlgorithm
      }
    }
  }
`;

interface Port {
  name: string;
  latitude: number;
  longitude: number;
}

export default function WeatherRoutingPage() {
  // Form state
  const [originPort, setOriginPort] = useState<Port>({ name: 'Singapore', latitude: 1.29, longitude: 103.85 });
  const [destPort, setDestPort] = useState<Port>({ name: 'Rotterdam', latitude: 51.92, longitude: 4.48 });
  const [departureTime, setDepartureTime] = useState(new Date().toISOString().slice(0, 16));
  const [vesselSpeed, setVesselSpeed] = useState(15);
  const [vesselType, setVesselType] = useState('container');
  const [fuelConsumptionRate, setFuelConsumptionRate] = useState(45);
  const [fuelPrice, setFuelPrice] = useState(450);

  // UI state
  const [showResults, setShowResults] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<number>(0);
  const [showWeatherGrid, setShowWeatherGrid] = useState(false);

  // Predefined ports
  const majorPorts = [
    { name: 'Singapore', latitude: 1.29, longitude: 103.85 },
    { name: 'Rotterdam', latitude: 51.92, longitude: 4.48 },
    { name: 'Shanghai', latitude: 31.23, longitude: 121.47 },
    { name: 'Los Angeles', latitude: 33.74, longitude: -118.27 },
    { name: 'Hamburg', latitude: 53.55, longitude: 9.99 },
    { name: 'Dubai', latitude: 25.28, longitude: 55.33 },
    { name: 'Hong Kong', latitude: 22.32, longitude: 114.17 },
    { name: 'Busan', latitude: 35.18, longitude: 129.08 },
    { name: 'New York', latitude: 40.71, longitude: -74.01 },
    { name: 'Mumbai', latitude: 18.97, longitude: 72.83 },
  ];

  const vesselTypes = [
    { value: 'container', label: 'Container Ship', consumption: 45 },
    { value: 'tanker', label: 'Tanker', consumption: 32 },
    { value: 'bulk_carrier', label: 'Bulk Carrier', consumption: 28 },
    { value: 'general_cargo', label: 'General Cargo', consumption: 20 },
  ];

  // Query weather routes
  const { data, loading, error, refetch } = useQuery(CALCULATE_WEATHER_ROUTES_QUERY, {
    variables: {
      origin: { name: originPort.name, latitude: originPort.latitude, longitude: originPort.longitude },
      destination: { name: destPort.name, latitude: destPort.latitude, longitude: destPort.longitude },
      departureTime: new Date(departureTime).toISOString(),
      vesselSpeed,
      vesselType,
      fuelConsumptionRate,
      fuelPricePerMT: fuelPrice,
    },
    skip: !showResults,
  });

  const handleCalculate = () => {
    setShowResults(true);
    refetch();
  };

  const handleVesselTypeChange = (type: string) => {
    setVesselType(type);
    const vessel = vesselTypes.find(v => v.value === type);
    if (vessel) {
      setFuelConsumptionRate(vessel.consumption);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">⛈️ Weather Routing & Optimization</h1>
          <p className="text-gray-600">Plan voyages with weather-aware route optimization</p>
        </div>

        {/* Route Planning Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6">Plan Your Voyage</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Origin Port */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origin Port
              </label>
              <select
                value={originPort.name}
                onChange={(e) => {
                  const port = majorPorts.find(p => p.name === e.target.value);
                  if (port) setOriginPort(port);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {majorPorts.map(port => (
                  <option key={port.name} value={port.name}>
                    {port.name} ({port.latitude.toFixed(2)}°, {port.longitude.toFixed(2)}°)
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Port */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Port
              </label>
              <select
                value={destPort.name}
                onChange={(e) => {
                  const port = majorPorts.find(p => p.name === e.target.value);
                  if (port) setDestPort(port);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {majorPorts.map(port => (
                  <option key={port.name} value={port.name}>
                    {port.name} ({port.latitude.toFixed(2)}°, {port.longitude.toFixed(2)}°)
                  </option>
                ))}
              </select>
            </div>

            {/* Departure Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departure Time
              </label>
              <input
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Vessel Speed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vessel Speed (knots)
              </label>
              <input
                type="number"
                value={vesselSpeed}
                onChange={(e) => setVesselSpeed(Number(e.target.value))}
                min="5"
                max="30"
                step="0.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Vessel Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vessel Type
              </label>
              <select
                value={vesselType}
                onChange={(e) => handleVesselTypeChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {vesselTypes.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Fuel Consumption Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuel Consumption (MT/day)
              </label>
              <input
                type="number"
                value={fuelConsumptionRate}
                onChange={(e) => setFuelConsumptionRate(Number(e.target.value))}
                min="10"
                max="200"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fuel Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuel Price ($/MT)
              </label>
              <input
                type="number"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(Number(e.target.value))}
                min="100"
                max="1000"
                step="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Calculate Button */}
            <div className="md:col-span-2">
              <button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Calculating Routes...' : '🧭 Calculate Weather Routes'}
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800">❌ Error calculating routes: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-blue-800">🔄 Calculating optimal routes with weather data...</p>
          </div>
        )}

        {/* Results */}
        {data?.calculateWeatherRoutes && (
          <>
            {/* Route Comparison Cards */}
            <RouteComparison
              routes={data.calculateWeatherRoutes.alternatives}
              savings={data.calculateWeatherRoutes.savings}
              selectedRoute={selectedRoute}
              onSelectRoute={setSelectedRoute}
            />

            {/* Map and Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Interactive Map */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Route Map</h2>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showWeatherGrid}
                      onChange={(e) => setShowWeatherGrid(e.target.checked)}
                      className="rounded"
                    />
                    <span>Show Weather Grid</span>
                  </label>
                </div>
                <WeatherRouteMap
                  routes={data.calculateWeatherRoutes.alternatives}
                  selectedRoute={selectedRoute}
                  onSelectRoute={setSelectedRoute}
                  showWeatherGrid={showWeatherGrid}
                  origin={originPort}
                  destination={destPort}
                />
              </div>

              {/* Weather Timeline */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Weather Forecast</h2>
                <WeatherTimeline
                  route={data.calculateWeatherRoutes.alternatives[selectedRoute]}
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
              <div className="flex gap-6">
                <div>
                  <strong>Calculated:</strong> {new Date(data.calculateWeatherRoutes.metadata.calculatedAt).toLocaleString()}
                </div>
                <div>
                  <strong>Weather Source:</strong> {data.calculateWeatherRoutes.metadata.weatherDataSource}
                </div>
                <div>
                  <strong>Algorithm:</strong> {data.calculateWeatherRoutes.metadata.routingAlgorithm}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
