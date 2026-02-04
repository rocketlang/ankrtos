/**
 * Vessel Operations Portal
 * For Ship Masters, Chief Officers, and Vessel Staff
 *
 * The "Sweetener" - Makes vessel operations easier and faster!
 */

import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const VESSEL_PORTAL_QUERY = gql`
  query VesselPortal {
    vessels {
      id
      name
      imo
      type
      flag
      positions(take: 1, orderBy: { timestamp: desc }) {
        latitude
        longitude
        speed
        heading
        timestamp
      }
    }

    voyages(status: "in_progress") {
      id
      voyageNumber
      vessel { id name }
      departurePort { id name }
      arrivalPort { id name }
      etd
      eta
      status
    }

    disbursementAccounts {
      id
      type
      status
      totalAmount
      currency
      voyage { voyageNumber }
    }

    cashToMasterList {
      id
      status
      amount
      currency
      purpose
    }
  }
`;

const PORT_INTELLIGENCE_QUERY = gql`
  query PortIntelligence($portId: String!) {
    port(id: $portId) {
      id
      name
      unlocode
      country
      latitude
      longitude
    }
  }
`;

// Custom ship icon for map
const shipIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjM0I4MkY2Ij48dGV4dCB5PSIyMCIgZm9udC1zaXplPSIyMCI+8J+agDwvdGV4dD48L3N2Zz4=',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface Recommendation {
  id: string;
  type: 'success' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  savings?: number;
}

export default function VesselPortal() {
  const { data, loading } = useQuery(VESSEL_PORTAL_QUERY, {
    pollInterval: 30000, // Update every 30 seconds
  });

  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-maritime-950">
        <div className="text-maritime-400 text-xl">Loading Vessel Portal...</div>
      </div>
    );
  }

  const vessels = data?.vessels || [];
  const voyages = data?.voyages || [];
  const disbursementAccounts = data?.disbursementAccounts || [];
  const cashToMasterList = data?.cashToMasterList || [];

  // Get first vessel for demo (in production, filter by logged-in user's vessel)
  const currentVessel = vessels[0];
  const currentVoyage = voyages.find(v => v.vessel?.id === currentVessel?.id);
  const currentPosition = currentVessel?.positions?.[0];

  // Generate smart recommendations
  const recommendations: Recommendation[] = [];

  // Check for pending DA approvals
  const pendingDAs = disbursementAccounts.filter(da => da.status === 'submitted');
  if (pendingDAs.length > 0) {
    recommendations.push({
      id: 'da-pending',
      type: 'info',
      icon: '💰',
      title: `${pendingDAs.length} DA(s) Pending Approval`,
      description: `Disbursement accounts submitted and awaiting office approval`,
      actionLabel: 'View DA Desk',
      actionUrl: '/da-desk',
    });
  }

  // Check for pending CTM requests
  const pendingCTM = cashToMasterList.filter(ctm => ctm.status === 'requested');
  if (pendingCTM.length > 0) {
    const totalAmount = pendingCTM.reduce((sum, ctm) => sum + ctm.amount, 0);
    recommendations.push({
      id: 'ctm-pending',
      type: 'warning',
      icon: '💵',
      title: 'Cash to Master Request Pending',
      description: `$${totalAmount.toLocaleString()} requested, awaiting approval`,
      actionLabel: 'View Requests',
      actionUrl: '/cash-to-master',
    });
  }

  // Fleet routing recommendation
  if (currentVoyage) {
    recommendations.push({
      id: 'route-optimization',
      type: 'success',
      icon: '🗺️',
      title: 'Optimized Route Available',
      description: 'Fleet collaborative routing can help optimize fuel consumption',
      actionLabel: 'View Route',
      actionUrl: '/fleet-routes',
      savings: 3500,
    });
  }

  // Port intelligence
  if (currentVoyage?.arrivalPort) {
    recommendations.push({
      id: 'port-intel',
      type: 'info',
      icon: '⚓',
      title: `Next Port: ${currentVoyage.arrivalPort.name}`,
      description: 'Check port intelligence, congestion, and restrictions',
      actionLabel: 'View Port Info',
      actionUrl: '/port-intelligence',
    });
  }

  const mapCenter: [number, number] = currentPosition
    ? [currentPosition.latitude, currentPosition.longitude]
    : [0, 0];

  return (
    <div className="min-h-screen bg-maritime-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-maritime-100 mb-2">
          🚢 Vessel Operations Portal
        </h1>
        <p className="text-maritime-400">
          {currentVessel?.name || 'Select Vessel'} - Operational Dashboard
        </p>
      </div>

      {/* Current Voyage Status */}
      {currentVoyage && (
        <div className="bg-maritime-900 rounded-lg p-6 mb-6 border border-maritime-800">
          <h2 className="text-xl font-bold text-maritime-100 mb-4">
            Current Voyage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-maritime-400 text-sm mb-1">Voyage Number</div>
              <div className="text-maritime-100 font-semibold">
                {currentVoyage.voyageNumber}
              </div>
            </div>
            <div>
              <div className="text-maritime-400 text-sm mb-1">Route</div>
              <div className="text-maritime-100 font-semibold">
                {currentVoyage.departurePort?.name} → {currentVoyage.arrivalPort?.name}
              </div>
            </div>
            <div>
              <div className="text-maritime-400 text-sm mb-1">ETA</div>
              <div className="text-maritime-100 font-semibold">
                {currentVoyage.eta
                  ? new Date(currentVoyage.eta).toLocaleDateString()
                  : 'TBD'}
              </div>
            </div>
          </div>

          {currentPosition && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-maritime-400 text-sm mb-1">Position</div>
                <div className="text-maritime-100 font-mono text-xs">
                  {currentPosition.latitude.toFixed(4)}°N,{' '}
                  {currentPosition.longitude.toFixed(4)}°E
                </div>
              </div>
              <div>
                <div className="text-maritime-400 text-sm mb-1">Speed</div>
                <div className="text-maritime-100 font-semibold">
                  {currentPosition.speed?.toFixed(1) || '0.0'} kn
                </div>
              </div>
              <div>
                <div className="text-maritime-400 text-sm mb-1">Heading</div>
                <div className="text-maritime-100 font-semibold">
                  {currentPosition.heading || '---'}°
                </div>
              </div>
              <div>
                <div className="text-maritime-400 text-sm mb-1">Last Update</div>
                <div className="text-maritime-100 text-xs">
                  {new Date(currentPosition.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link
          to="/da-desk"
          className="bg-maritime-900 hover:bg-maritime-800 rounded-lg p-6 border border-maritime-800 transition"
        >
          <div className="text-3xl mb-3">💰</div>
          <div className="font-semibold text-maritime-100 mb-1">
            DA Desk
          </div>
          <div className="text-sm text-maritime-400">
            Manage disbursement accounts
          </div>
          {disbursementAccounts.length > 0 && (
            <div className="mt-3 text-xs text-maritime-300">
              {disbursementAccounts.length} active DA(s)
            </div>
          )}
        </Link>

        <Link
          to="/cash-to-master"
          className="bg-maritime-900 hover:bg-maritime-800 rounded-lg p-6 border border-maritime-800 transition"
        >
          <div className="text-3xl mb-3">💵</div>
          <div className="font-semibold text-maritime-100 mb-1">
            Cash to Master
          </div>
          <div className="text-sm text-maritime-400">
            Request vessel cash
          </div>
          {cashToMasterList.length > 0 && (
            <div className="mt-3 text-xs text-maritime-300">
              {cashToMasterList.length} request(s)
            </div>
          )}
        </Link>

        <Link
          to="/fleet-routes"
          className="bg-maritime-900 hover:bg-maritime-800 rounded-lg p-6 border border-maritime-800 transition"
        >
          <div className="text-3xl mb-3">🗺️</div>
          <div className="font-semibold text-maritime-100 mb-1">
            Route Planner
          </div>
          <div className="text-sm text-maritime-400">
            Fleet collaborative routing
          </div>
        </Link>

        <Link
          to="/port-intelligence"
          className="bg-maritime-900 hover:bg-maritime-800 rounded-lg p-6 border border-maritime-800 transition"
        >
          <div className="text-3xl mb-3">⚓</div>
          <div className="font-semibold text-maritime-100 mb-1">
            Port Intelligence
          </div>
          <div className="text-sm text-maritime-400">
            Port info and congestion
          </div>
        </Link>
      </div>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-maritime-900 rounded-lg p-6 mb-6 border border-maritime-800">
          <h2 className="text-xl font-bold text-maritime-100 mb-4">
            💡 Smart Recommendations
          </h2>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className={`
                  p-4 rounded-lg border
                  ${rec.type === 'success' ? 'bg-green-900/20 border-green-800/50' : ''}
                  ${rec.type === 'warning' ? 'bg-yellow-900/20 border-yellow-800/50' : ''}
                  ${rec.type === 'info' ? 'bg-blue-900/20 border-blue-800/50' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{rec.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-maritime-100 mb-1">
                        {rec.title}
                      </div>
                      <div className="text-sm text-maritime-300 mb-2">
                        {rec.description}
                      </div>
                      {rec.savings && (
                        <div className="text-xs text-green-400 font-semibold mb-2">
                          Potential savings: ${rec.savings.toLocaleString()}
                        </div>
                      )}
                      <Link
                        to={rec.actionUrl}
                        className="text-sm text-blue-400 hover:text-blue-300 underline"
                      >
                        {rec.actionLabel} →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vessel Position Map */}
      {currentPosition && (
        <div className="bg-maritime-900 rounded-lg p-6 border border-maritime-800">
          <h2 className="text-xl font-bold text-maritime-100 mb-4">
            Current Position
          </h2>
          <div className="h-96 rounded-lg overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />
              <TileLayer
                url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
                attribution="&copy; OpenSeaMap"
              />
              <Marker
                position={mapCenter}
                icon={shipIcon}
              >
                <Popup>
                  <div className="font-semibold">{currentVessel?.name}</div>
                  <div className="text-sm">Speed: {currentPosition.speed?.toFixed(1)} kn</div>
                  <div className="text-sm">Heading: {currentPosition.heading}°</div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!currentVessel && (
        <div className="bg-maritime-900 rounded-lg p-12 text-center border border-maritime-800">
          <div className="text-6xl mb-4">🚢</div>
          <h2 className="text-2xl font-bold text-maritime-100 mb-2">
            No Vessel Selected
          </h2>
          <p className="text-maritime-400">
            Select a vessel to view operational dashboard
          </p>
        </div>
      )}
    </div>
  );
}
