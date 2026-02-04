// ═══════════════════════════════════════════════════════════════════════════════════
// FleetGPS Dashboard - Admin view of all vehicles with OSS-first maps
// ═══════════════════════════════════════════════════════════════════════════════════
// 🙏 jai guru ji | © 2025 Powerp Box IT Solutions Pvt Limited
// ═══════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';

interface Vehicle {
  id: string;
  regNo: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  status: 'moving' | 'idle' | 'offline' | 'sos';
  location?: {
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    timestamp: string;
  };
  currentTrip?: {
    id: string;
    from: string;
    to: string;
    eta: string;
  };
}

// Mock data - replace with useWireGPS() in production
const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1', regNo: 'HR-55-AB-1234', driverId: 'd1', driverName: 'Ramesh Kumar', driverPhone: '+91 98765 43210',
    status: 'moving',
    location: { lat: 28.4595, lng: 77.0266, speed: 45, heading: 90, timestamp: new Date().toISOString() },
    currentTrip: { id: 't1', from: 'Faridabad', to: 'Delhi', eta: '45 min' },
  },
  {
    id: 'v2', regNo: 'DL-01-CA-5678', driverId: 'd2', driverName: 'Suresh Singh', driverPhone: '+91 87654 32109',
    status: 'idle',
    location: { lat: 28.7041, lng: 77.1025, speed: 0, heading: 180, timestamp: new Date().toISOString() },
  },
  {
    id: 'v3', regNo: 'UP-16-XY-9999', driverId: 'd3', driverName: 'Vijay Sharma', driverPhone: '+91 76543 21098',
    status: 'moving',
    location: { lat: 28.5355, lng: 77.3910, speed: 62, heading: 45, timestamp: new Date().toISOString() },
    currentTrip: { id: 't2', from: 'Noida', to: 'Gurgaon', eta: '1h 15min' },
  },
  {
    id: 'v4', regNo: 'HR-26-ZZ-4444', driverId: 'd4', driverName: 'Amit Yadav', driverPhone: '+91 65432 10987',
    status: 'offline',
  },
  {
    id: 'v5', regNo: 'DL-08-SOS-1111', driverId: 'd5', driverName: 'Raju Verma', driverPhone: '+91 54321 09876',
    status: 'sos',
    location: { lat: 28.6139, lng: 77.2090, speed: 0, heading: 0, timestamp: new Date().toISOString() },
  },
];

function VehicleCard({ vehicle, onSelect }: { vehicle: Vehicle; onSelect: (v: Vehicle) => void }) {
  const statusColors = {
    moving: 'bg-green-500',
    idle: 'bg-yellow-500',
    offline: 'bg-gray-400',
    sos: 'bg-red-600 animate-pulse',
  };

  const statusLabels = {
    moving: '🚛 Moving',
    idle: '⏸️ Idle',
    offline: '📴 Offline',
    sos: '🆘 SOS!',
  };

  return (
    <div
      onClick={() => onSelect(vehicle)}
      className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all border-l-4 ${
        vehicle.status === 'sos' ? 'border-red-600 bg-red-50' : 'border-blue-500'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-xl font-bold text-blue-800">{vehicle.regNo}</div>
          <div className="text-sm text-gray-600">{vehicle.driverName}</div>
        </div>
        <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${statusColors[vehicle.status]}`}>
          {statusLabels[vehicle.status]}
        </span>
      </div>

      {vehicle.location && (
        <div className="text-sm space-y-1 mb-3">
          <div className="flex justify-between">
            <span>📍 Position</span>
            <span className="font-mono">{vehicle.location.lat.toFixed(4)}, {vehicle.location.lng.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span>🚗 Speed</span>
            <span className="font-bold">{vehicle.location.speed} km/h</span>
          </div>
        </div>
      )}

      {vehicle.currentTrip && (
        <div className="bg-blue-50 rounded-lg p-2 text-sm">
          <div className="font-medium">📦 {vehicle.currentTrip.from} → {vehicle.currentTrip.to}</div>
          <div className="text-blue-600">ETA: {vehicle.currentTrip.eta}</div>
        </div>
      )}

      {vehicle.status === 'sos' && (
        <div className="mt-3 bg-red-600 text-white rounded-lg p-2 text-center font-bold animate-pulse">
          🆘 EMERGENCY - REQUIRES ATTENTION
        </div>
      )}
    </div>
  );
}

function RouteCalculator({ from, to }: { from?: string; to?: string }) {
  const [route, setRoute] = useState<{ distance: number; duration: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      // OSRM - FREE routing!
      const res = await fetch(
        'https://router.project-osrm.org/route/v1/driving/77.0266,28.4595;77.1025,28.7041?overview=false'
      );
      const data = await res.json();
      if (data.code === 'Ok') {
        setRoute({ distance: data.routes[0].distance, duration: data.routes[0].duration });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    calculate();
  }, []);

  if (!route) return null;

  return (
    <div className="bg-green-50 rounded-lg p-3 text-sm">
      <div className="font-bold text-green-800 mb-1">🛣️ Route (OSRM - FREE!)</div>
      <div>📍 {(route.distance / 1000).toFixed(1)} km</div>
      <div>⏱️ {Math.round(route.duration / 60)} min</div>
    </div>
  );
}

export default function FleetGPS() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filter, setFilter] = useState<'all' | 'moving' | 'idle' | 'offline' | 'sos'>('all');

  const stats = {
    total: vehicles.length,
    moving: vehicles.filter(v => v.status === 'moving').length,
    idle: vehicles.filter(v => v.status === 'idle').length,
    offline: vehicles.filter(v => v.status === 'offline').length,
    sos: vehicles.filter(v => v.status === 'sos').length,
  };

  const filteredVehicles = filter === 'all' ? vehicles : vehicles.filter(v => v.status === filter);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h1 className="text-3xl font-bold mb-2">🛰️ Fleet GPS Tracking</h1>
        <p className="opacity-80">Real-time vehicle tracking • OSS-First (OSRM + Nominatim)</p>
      </div>

      {/* Stats Bar */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-5 gap-4 text-center">
            <button
              onClick={() => setFilter('all')}
              className={`p-3 rounded-lg transition-all ${filter === 'all' ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'}`}
            >
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </button>
            <button
              onClick={() => setFilter('moving')}
              className={`p-3 rounded-lg transition-all ${filter === 'moving' ? 'bg-green-100 ring-2 ring-green-500' : 'hover:bg-gray-100'}`}
            >
              <div className="text-2xl font-bold text-green-600">{stats.moving}</div>
              <div className="text-sm text-gray-500">Moving</div>
            </button>
            <button
              onClick={() => setFilter('idle')}
              className={`p-3 rounded-lg transition-all ${filter === 'idle' ? 'bg-yellow-100 ring-2 ring-yellow-500' : 'hover:bg-gray-100'}`}
            >
              <div className="text-2xl font-bold text-yellow-600">{stats.idle}</div>
              <div className="text-sm text-gray-500">Idle</div>
            </button>
            <button
              onClick={() => setFilter('offline')}
              className={`p-3 rounded-lg transition-all ${filter === 'offline' ? 'bg-gray-200 ring-2 ring-gray-500' : 'hover:bg-gray-100'}`}
            >
              <div className="text-2xl font-bold text-gray-600">{stats.offline}</div>
              <div className="text-sm text-gray-500">Offline</div>
            </button>
            <button
              onClick={() => setFilter('sos')}
              className={`p-3 rounded-lg transition-all ${filter === 'sos' ? 'bg-red-100 ring-2 ring-red-500' : 'hover:bg-gray-100'} ${stats.sos > 0 ? 'animate-pulse' : ''}`}
            >
              <div className="text-2xl font-bold text-red-600">{stats.sos}</div>
              <div className="text-sm text-gray-500">🆘 SOS</div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredVehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onSelect={setSelectedVehicle} />
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Selected Vehicle Detail */}
            {selectedVehicle && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="font-bold text-lg mb-3">📋 {selectedVehicle.regNo}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>👤 Driver</span>
                    <span>{selectedVehicle.driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>📞 Phone</span>
                    <a href={`tel:${selectedVehicle.driverPhone}`} className="text-blue-600">{selectedVehicle.driverPhone}</a>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button className="py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">📍 Track</button>
                  <button className="py-2 bg-green-600 text-white rounded-lg text-sm font-medium">📞 Call</button>
                </div>
              </div>
            )}

            {/* OSS Info */}
            <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-4 text-white">
              <h3 className="font-bold mb-2">🗺️ OSS-First Philosophy</h3>
              <ul className="text-sm space-y-1">
                <li>✅ OSRM - FREE routing</li>
                <li>✅ Nominatim - FREE geocoding</li>
                <li>✅ Leaflet - FREE maps</li>
                <li>⚠️ Google - fallback only</li>
              </ul>
              <div className="mt-3 text-xs opacity-80">
                Saving ₹15,000+/month vs Google Maps
              </div>
            </div>

            {/* Quick Route */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="font-bold mb-3">🛣️ Quick Route</h3>
              <RouteCalculator from="Faridabad" to="Delhi" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm py-6">
        🙏 jai guru ji | © 2025 Powerp Box IT Solutions Pvt Limited
      </div>
    </div>
  );
}
