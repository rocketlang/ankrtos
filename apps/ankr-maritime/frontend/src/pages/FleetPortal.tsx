/**
 * Fleet Management Portal
 * For Fleet Owners, Operators, and Managers
 *
 * Overview of entire fleet with performance analytics and financial insights
 */

import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

const FLEET_PORTAL_QUERY = gql`
  query FleetPortal {
    vessels {
      id
      name
      imo
      type
      flag
      dwt
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
      departurePort { name }
      arrivalPort { name }
      eta
      status
    }

    disbursementAccounts {
      id
      type
      status
      totalAmount
      currency
      voyage {
        voyageNumber
        vessel { name }
      }
    }

    cashToMasterList {
      id
      status
      amount
      currency
      vesselName
    }
  }
`;

// Custom ship icons by status
const createShipIcon = (color: string) => new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${color}"/><text x="12" y="18" text-anchor="middle" font-size="16">⚓</text></svg>`)}`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const operatingIcon = createShipIcon('#10B981'); // green
const portIcon = createShipIcon('#3B82F6'); // blue
const offlineIcon = createShipIcon('#EF4444'); // red

interface FleetStats {
  totalVessels: number;
  operating: number;
  inPort: number;
  offline: number;
  totalDWT: number;
  activeVoyages: number;
}

interface FinancialStats {
  totalDAAmount: number;
  pendingApprovals: number;
  totalCTMRequests: number;
  pendingCTM: number;
}

export default function FleetPortal() {
  const { data, loading } = useQuery(FLEET_PORTAL_QUERY, {
    pollInterval: 30000, // Update every 30 seconds
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-maritime-950">
        <div className="text-maritime-400 text-xl">Loading Fleet Portal...</div>
      </div>
    );
  }

  const vessels = data?.vessels || [];
  const voyages = data?.voyages || [];
  const disbursementAccounts = data?.disbursementAccounts || [];
  const cashToMasterList = data?.cashToMasterList || [];

  // Calculate fleet statistics
  const fleetStats: FleetStats = {
    totalVessels: vessels.length,
    operating: vessels.filter(v => v.positions?.length > 0 && v.positions[0].speed > 0).length,
    inPort: vessels.filter(v => v.positions?.length > 0 && v.positions[0].speed === 0).length,
    offline: vessels.filter(v => v.positions?.length === 0).length,
    totalDWT: vessels.reduce((sum, v) => sum + (v.dwt || 0), 0),
    activeVoyages: voyages.length,
  };

  // Calculate financial statistics
  const financialStats: FinancialStats = {
    totalDAAmount: disbursementAccounts.reduce((sum, da) => sum + da.totalAmount, 0),
    pendingApprovals: disbursementAccounts.filter(da => da.status === 'submitted').length,
    totalCTMRequests: cashToMasterList.length,
    pendingCTM: cashToMasterList.filter(ctm => ctm.status === 'requested').length,
  };

  // Calculate map center (average of all vessel positions)
  const validPositions = vessels
    .filter(v => v.positions?.length > 0)
    .map(v => v.positions[0]);

  const mapCenter: [number, number] = validPositions.length > 0
    ? [
        validPositions.reduce((sum, p) => sum + p.latitude, 0) / validPositions.length,
        validPositions.reduce((sum, p) => sum + p.longitude, 0) / validPositions.length,
      ]
    : [20, 0]; // Default center

  return (
    <div className="min-h-screen bg-maritime-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-maritime-100 mb-2">
          🚢 Fleet Management Portal
        </h1>
        <p className="text-maritime-400">
          Real-time fleet overview and performance analytics
        </p>
      </div>

      {/* Fleet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Vessels */}
        <div className="bg-maritime-900 rounded-lg p-6 border border-maritime-800">
          <div className="text-maritime-400 text-sm mb-2">Total Vessels</div>
          <div className="text-3xl font-bold text-maritime-100 mb-2">
            {fleetStats.totalVessels}
          </div>
          <div className="flex gap-4 text-xs">
            <div className="text-green-400">
              🟢 {fleetStats.operating} Operating
            </div>
            <div className="text-blue-400">
              🔵 {fleetStats.inPort} In Port
            </div>
            <div className="text-red-400">
              🔴 {fleetStats.offline} Offline
            </div>
          </div>
        </div>

        {/* Active Voyages */}
        <div className="bg-maritime-900 rounded-lg p-6 border border-maritime-800">
          <div className="text-maritime-400 text-sm mb-2">Active Voyages</div>
          <div className="text-3xl font-bold text-maritime-100 mb-2">
            {fleetStats.activeVoyages}
          </div>
          <Link to="/voyages" className="text-xs text-blue-400 hover:text-blue-300">
            View all voyages →
          </Link>
        </div>

        {/* Fleet Capacity */}
        <div className="bg-maritime-900 rounded-lg p-6 border border-maritime-800">
          <div className="text-maritime-400 text-sm mb-2">Total Fleet DWT</div>
          <div className="text-3xl font-bold text-maritime-100 mb-2">
            {(fleetStats.totalDWT / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-maritime-400">
            Deadweight Tonnage
          </div>
        </div>

        {/* Utilization */}
        <div className="bg-maritime-900 rounded-lg p-6 border border-maritime-800">
          <div className="text-maritime-400 text-sm mb-2">Fleet Utilization</div>
          <div className="text-3xl font-bold text-maritime-100 mb-2">
            {((fleetStats.operating / fleetStats.totalVessels) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-green-400">
            {fleetStats.operating} vessels operating
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Disbursement Accounts */}
        <div className="bg-maritime-900 rounded-lg p-6 border border-maritime-800">
          <h2 className="text-xl font-bold text-maritime-100 mb-4">
            💰 Disbursement Accounts
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-maritime-400">Total DA Amount</span>
              <span className="text-2xl font-bold text-maritime-100">
                ${(financialStats.totalDAAmount / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-maritime-400">Total Accounts</span>
              <span className="text-xl font-semibold text-maritime-100">
                {disbursementAccounts.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-maritime-400">Pending Approval</span>
              <span className={`text-xl font-semibold ${financialStats.pendingApprovals > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {financialStats.pendingApprovals}
              </span>
            </div>
          </div>
          <Link
            to="/da-desk"
            className="mt-4 block text-sm text-blue-400 hover:text-blue-300"
          >
            View DA Desk →
          </Link>
        </div>

        {/* Cash to Master */}
        <div className="bg-maritime-900 rounded-lg p-6 border border-maritime-800">
          <h2 className="text-xl font-bold text-maritime-100 mb-4">
            💵 Cash to Master
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-maritime-400">Total Requested</span>
              <span className="text-2xl font-bold text-maritime-100">
                ${(cashToMasterList.reduce((sum, ctm) => sum + ctm.amount, 0) / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-maritime-400">Total Requests</span>
              <span className="text-xl font-semibold text-maritime-100">
                {financialStats.totalCTMRequests}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-maritime-400">Pending Approval</span>
              <span className={`text-xl font-semibold ${financialStats.pendingCTM > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {financialStats.pendingCTM}
              </span>
            </div>
          </div>
          <Link
            to="/cash-to-master"
            className="mt-4 block text-sm text-blue-400 hover:text-blue-300"
          >
            View Cash to Master →
          </Link>
        </div>
      </div>

      {/* Fleet Map */}
      <div className="bg-maritime-900 rounded-lg p-6 mb-6 border border-maritime-800">
        <h2 className="text-xl font-bold text-maritime-100 mb-4">
          🗺️ Fleet Map (Real-Time)
        </h2>
        <div className="h-96 rounded-lg overflow-hidden">
          <MapContainer
            center={mapCenter}
            zoom={2}
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

            {vessels.map((vessel) => {
              const position = vessel.positions?.[0];
              if (!position) return null;

              const isOperating = position.speed > 0;
              const icon = isOperating ? operatingIcon : portIcon;

              return (
                <Marker
                  key={vessel.id}
                  position={[position.latitude, position.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <div>
                      <div className="font-bold">{vessel.name}</div>
                      <div className="text-xs text-gray-600">{vessel.type}</div>
                      <div className="text-sm mt-1">
                        Speed: {position.speed?.toFixed(1)} kn
                      </div>
                      <div className="text-sm">
                        Heading: {position.heading}°
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Last update: {new Date(position.timestamp).toLocaleTimeString()}
                      </div>
                      <Link
                        to={`/vessels`}
                        className="text-xs text-blue-500 hover:underline mt-2 block"
                      >
                        View details →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link
          to="/vessels"
          className="bg-maritime-900 hover:bg-maritime-800 rounded-lg p-6 border border-maritime-800 transition"
        >
          <div className="text-3xl mb-3">🚢</div>
          <div className="font-semibold text-maritime-100 mb-1">
            Fleet Overview
          </div>
          <div className="text-sm text-maritime-400">
            View all vessels
          </div>
        </Link>

        <Link
          to="/voyages"
          className="bg-maritime-900 hover:bg-maritime-800 rounded-lg p-6 border border-maritime-800 transition"
        >
          <div className="text-3xl mb-3">🧭</div>
          <div className="font-semibold text-maritime-100 mb-1">
            Voyages
          </div>
          <div className="text-sm text-maritime-400">
            {fleetStats.activeVoyages} active voyages
          </div>
        </Link>

        <Link
          to="/analytics"
          className="bg-maritime-900 hover:bg-maritime-800 rounded-lg p-6 border border-maritime-800 transition"
        >
          <div className="text-3xl mb-3">📊</div>
          <div className="font-semibold text-maritime-100 mb-1">
            Analytics
          </div>
          <div className="text-sm text-maritime-400">
            Performance insights
          </div>
        </Link>

        <Link
          to="/fleet-routes"
          className="bg-maritime-900 hover:bg-maritime-800 rounded-lg p-6 border border-maritime-800 transition"
        >
          <div className="text-3xl mb-3">🗺️</div>
          <div className="font-semibold text-maritime-100 mb-1">
            Fleet Routing
          </div>
          <div className="text-sm text-maritime-400">
            Collaborative routing
          </div>
        </Link>
      </div>

      {/* Active Voyages List */}
      <div className="bg-maritime-900 rounded-lg p-6 border border-maritime-800">
        <h2 className="text-xl font-bold text-maritime-100 mb-4">
          Active Voyages
        </h2>
        {voyages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-maritime-400 border-b border-maritime-800">
                  <th className="pb-3">Voyage</th>
                  <th className="pb-3">Vessel</th>
                  <th className="pb-3">Route</th>
                  <th className="pb-3">ETA</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-maritime-100">
                {voyages.slice(0, 10).map((voyage) => (
                  <tr key={voyage.id} className="border-b border-maritime-800/50">
                    <td className="py-3 font-mono text-sm">{voyage.voyageNumber}</td>
                    <td className="py-3">{voyage.vessel?.name}</td>
                    <td className="py-3 text-sm">
                      {voyage.departurePort?.name} → {voyage.arrivalPort?.name}
                    </td>
                    <td className="py-3 text-sm">
                      {voyage.eta
                        ? new Date(voyage.eta).toLocaleDateString()
                        : 'TBD'}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 text-xs rounded bg-green-900/30 text-green-400">
                        {voyage.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-maritime-400">
            No active voyages
          </div>
        )}
      </div>
    </div>
  );
}
