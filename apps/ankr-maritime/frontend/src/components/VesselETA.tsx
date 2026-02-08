/**
 * VESSEL ETA PREDICTIONS
 * Display arrival time predictions with confidence scoring
 */

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';

const CALCULATE_ETA_QUERY = gql`
  query CalculateETA($mmsi: String!, $destinationLat: Float!, $destinationLon: Float!, $destinationPort: String) {
    calculateETA(mmsi: $mmsi, destinationLat: $destinationLat, destinationLon: $destinationLon, destinationPort: $destinationPort) {
      mmsi
      vesselName
      currentPosition {
        lat
        lon
      }
      destination {
        lat
        lon
        port
      }
      estimatedArrival
      confidence
      distanceRemaining
      estimatedDuration
      averageSpeed
      qualityImpact
      method
    }
  }
`;

const PREDICT_NEXT_PORT_QUERY = gql`
  query PredictNextPort($mmsi: String!) {
    predictNextPort(mmsi: $mmsi) {
      mmsi
      vesselName
      currentPosition {
        lat
        lon
      }
      destination {
        lat
        lon
        port
      }
      estimatedArrival
      confidence
      distanceRemaining
      estimatedDuration
      averageSpeed
      qualityImpact
      method
    }
  }
`;

interface VesselETAProps {
  mmsi: string;
  mode?: 'predict' | 'calculate';
  destinationLat?: number;
  destinationLon?: number;
  destinationPort?: string;
}

export default function VesselETA({
  mmsi,
  mode = 'predict',
  destinationLat,
  destinationLon,
  destinationPort,
}: VesselETAProps) {
  const [customMode, setCustomMode] = useState(false);
  const [customLat, setCustomLat] = useState(destinationLat?.toString() || '');
  const [customLon, setCustomLon] = useState(destinationLon?.toString() || '');
  const [customPort, setCustomPort] = useState(destinationPort || '');

  // Predict next port ETA
  const { data: predictData, loading: predictLoading } = useQuery(PREDICT_NEXT_PORT_QUERY, {
    variables: { mmsi },
    skip: mode === 'calculate' || customMode,
  });

  // Calculate ETA to custom destination
  const shouldCalculate = (mode === 'calculate' || customMode) && customLat && customLon;
  const { data: calculateData, loading: calculateLoading } = useQuery(CALCULATE_ETA_QUERY, {
    variables: {
      mmsi,
      destinationLat: parseFloat(customLat),
      destinationLon: parseFloat(customLon),
      destinationPort: customPort || null,
    },
    skip: !shouldCalculate,
  });

  const eta = customMode || mode === 'calculate' ? calculateData?.calculateETA : predictData?.predictNextPort;
  const loading = customMode || mode === 'calculate' ? calculateLoading : predictLoading;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.5) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'current_speed': return 'Based on current speed';
      case 'vessel_type_average': return 'Based on vessel type average';
      case 'historical_pattern': return 'Based on port visit pattern';
      default: return method;
    }
  };

  const formatETA = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${remainingHours}h`;
  };

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              🎯 ETA Prediction
            </h3>
            <p className="text-sm text-gray-600">
              {customMode ? 'Custom Destination' : mode === 'predict' ? 'Next Port Prediction' : 'Destination ETA'}
            </p>
          </div>
          <button
            onClick={() => setCustomMode(!customMode)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {customMode ? 'Auto Predict' : 'Custom Dest'}
          </button>
        </div>
      </div>

      {/* Custom Destination Form */}
      {customMode && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                placeholder="e.g., 25.123"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={customLon}
                onChange={(e) => setCustomLon(e.target.value)}
                placeholder="e.g., 55.456"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Port Name (optional)
              </label>
              <input
                type="text"
                value={customPort}
                onChange={(e) => setCustomPort(e.target.value)}
                placeholder="e.g., Singapore"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* ETA Display */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            Calculating ETA...
          </div>
        ) : !eta ? (
          <div className="text-center py-8 text-gray-500">
            {customMode && (!customLat || !customLon) ? (
              <div>
                <p className="text-lg mb-2">📍</p>
                <p>Enter destination coordinates</p>
              </div>
            ) : (
              <div>
                <p className="text-lg mb-2">❓</p>
                <p>No ETA data available</p>
                <p className="text-xs mt-1">Vessel may not have sufficient tracking history</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Vessel & Destination */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">Vessel</div>
                <div className="text-base font-semibold text-gray-900">
                  {eta.vesselName || 'Unknown'}
                </div>
                <div className="text-xs text-gray-600">{eta.mmsi}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">Destination</div>
                <div className="text-base font-semibold text-gray-900">
                  {eta.destination.port || 'Custom Location'}
                </div>
                <div className="text-xs text-gray-600">
                  {eta.destination.lat.toFixed(4)}, {eta.destination.lon.toFixed(4)}
                </div>
              </div>
            </div>

            {/* ETA - Large Display */}
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-lg p-6 text-center">
              <div className="text-sm font-medium opacity-90 mb-2">Estimated Arrival</div>
              <div className="text-3xl font-bold mb-1">{formatETA(eta.estimatedArrival)}</div>
              <div className="text-sm opacity-75">
                {formatDuration(eta.estimatedDuration)} away • {eta.distanceRemaining.toFixed(0)} nm
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600 mb-1">Distance</div>
                <div className="text-xl font-bold text-gray-900">
                  {eta.distanceRemaining.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">nm</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600 mb-1">Speed</div>
                <div className="text-xl font-bold text-gray-900">
                  {eta.averageSpeed.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">knots</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600 mb-1">Duration</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatDuration(eta.estimatedDuration)}
                </div>
                <div className="text-xs text-gray-500">time</div>
              </div>
            </div>

            {/* Confidence & Method */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Confidence Level</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceColor(eta.confidence)}`}>
                  {(eta.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Calculation Method</span>
                <span className="text-sm text-gray-600">{getMethodLabel(eta.method)}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  {eta.qualityImpact}
                </div>
              </div>
            </div>

            {/* Current Position */}
            {eta.currentPosition && (
              <div className="text-xs text-gray-500 text-center">
                Current position: {eta.currentPosition.lat.toFixed(4)}, {eta.currentPosition.lon.toFixed(4)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
