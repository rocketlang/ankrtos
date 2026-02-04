// ═══════════════════════════════════════════════════════════════════════════
// GPS Fleet Tracking Page - Using @ankr/fleet-widgets
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';

// Types
interface GPSDevice {
  id: string;
  imei: string;
  type: 'sim_gps' | 'obd' | 'mobile_app';
  protocol: 'gt06' | 'teltonika' | 'mqtt' | 'http';
  status: 'online' | 'offline' | 'sleeping';
  vehicleRegNo?: string;
  lastPosition?: { lat: number; lng: number; speed: number; heading: number; timestamp: string };
  battery?: number;
  signalStrength?: number;
}

// Mock devices (replace with useWireGPS() hook in production)
const MOCK_DEVICES: GPSDevice[] = [
  {
    id: 'dev-001', imei: '868120123456789', type: 'sim_gps', protocol: 'gt06', status: 'online',
    vehicleRegNo: 'HR-55-AB-1234',
    lastPosition: { lat: 28.4595, lng: 77.0266, speed: 45, heading: 90, timestamp: new Date().toISOString() },
    battery: 85, signalStrength: 90,
  },
  {
    id: 'dev-002', imei: '868120987654321', type: 'obd', protocol: 'teltonika', status: 'online',
    vehicleRegNo: 'DL-01-CA-5678',
    lastPosition: { lat: 28.7041, lng: 77.1025, speed: 0, heading: 180, timestamp: new Date().toISOString() },
    battery: 100, signalStrength: 75,
  },
  {
    id: 'dev-003', imei: '868120111222333', type: 'mobile_app', protocol: 'mqtt', status: 'sleeping',
    vehicleRegNo: 'UP-16-XY-9999',
    lastPosition: { lat: 28.5355, lng: 77.3910, speed: 0, heading: 0, timestamp: new Date(Date.now() - 3600000).toISOString() },
    battery: 25, signalStrength: 50,
  },
];

// Device Card Component
function DeviceCard({ device }: { device: GPSDevice }) {
  const [showCommands, setShowCommands] = useState(false);
  
  const statusColors = { online: 'bg-green-500', offline: 'bg-red-500', sleeping: 'bg-yellow-500' };
  const icons = { sim_gps: '📡', obd: '🔌', mobile_app: '📱' };
  const batteryColor = (device.battery || 0) > 50 ? 'text-green-600' : (device.battery || 0) > 20 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icons[device.type]}</span>
          <div>
            <div className="font-mono text-sm">{device.imei}</div>
            <div className="text-xs text-gray-400 uppercase">{device.protocol}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${statusColors[device.status]} ${device.status === 'online' ? 'animate-pulse' : ''}`} />
          <span className="text-sm">{device.status}</span>
        </div>
      </div>

      {device.vehicleRegNo && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg text-blue-800 font-bold">🚛 {device.vehicleRegNo}</div>
      )}

      {device.lastPosition && (
        <div className="text-sm mb-3">
          <div>📍 {device.lastPosition.lat.toFixed(4)}, {device.lastPosition.lng.toFixed(4)} • 🚗 {device.lastPosition.speed} km/h</div>
          <div className="text-xs text-gray-400">{new Date(device.lastPosition.timestamp).toLocaleString('en-IN')}</div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">Battery</div>
          <div className={`font-bold ${batteryColor}`}>🔋 {device.battery}%</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">Signal</div>
          <div className="font-bold">📶 {device.signalStrength}%</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">Status</div>
          <div className="font-bold">{device.status === 'online' ? '✅' : '❌'}</div>
        </div>
      </div>

      <button onClick={() => setShowCommands(!showCommands)} className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium">
        {showCommands ? '▲ Hide' : '▼ Commands'}
      </button>

      {showCommands && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button className="py-2 bg-gray-100 rounded text-sm hover:bg-gray-200">📍 Locate</button>
          <button className="py-2 bg-gray-100 rounded text-sm hover:bg-gray-200">🔄 Restart</button>
          <button className="py-2 bg-gray-100 rounded text-sm hover:bg-gray-200">⚡ Activate</button>
          <button className="py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">🚫 Engine Cut</button>
        </div>
      )}
    </div>
  );
}

// Route Calculator with OSRM
function RouteCalculator() {
  const [route, setRoute] = useState<{ distance: number; duration: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://router.project-osrm.org/route/v1/driving/77.0266,28.4595;77.1025,28.7041?overview=false');
      const data = await res.json();
      if (data.code === 'Ok') {
        setRoute({ distance: data.routes[0].distance, duration: data.routes[0].duration });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h3 className="font-bold mb-3">🗺️ Route Calculator (OSRM - FREE!)</h3>
      <div className="text-sm mb-3">
        <div>📍 Faridabad → Delhi</div>
      </div>
      <button onClick={calculate} disabled={loading} className="w-full py-2 bg-green-600 text-white rounded-lg">
        {loading ? '⏳...' : '🚀 Calculate'}
      </button>
      {route && (
        <div className="mt-3 p-3 bg-green-50 rounded text-sm">
          <div>📍 {(route.distance / 1000).toFixed(1)} km</div>
          <div>⏱️ {Math.round(route.duration / 60)} min</div>
          <div className="text-green-600 font-bold">Provider: OSRM (FREE!)</div>
        </div>
      )}
    </div>
  );
}

// Main Page
export default function GPSTracking() {
  const online = MOCK_DEVICES.filter(d => d.status === 'online').length;
  const offline = MOCK_DEVICES.filter(d => d.status === 'offline').length;
  const sleeping = MOCK_DEVICES.filter(d => d.status === 'sleeping').length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-2">🛰️ GPS Fleet Tracking</h1>
      <p className="text-gray-600 mb-6">OSS-First: OSRM + Nominatim + Leaflet</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow"><div className="text-2xl font-bold text-green-600">{online}</div><div className="text-sm text-gray-500">Online</div></div>
        <div className="bg-white rounded-xl p-4 shadow"><div className="text-2xl font-bold text-red-600">{offline}</div><div className="text-sm text-gray-500">Offline</div></div>
        <div className="bg-white rounded-xl p-4 shadow"><div className="text-2xl font-bold text-yellow-600">{sleeping}</div><div className="text-sm text-gray-500">Sleeping</div></div>
        <div className="bg-white rounded-xl p-4 shadow"><div className="text-2xl font-bold text-blue-600">{MOCK_DEVICES.length}</div><div className="text-sm text-gray-500">Total</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_DEVICES.map(d => <DeviceCard key={d.id} device={d} />)}
        </div>
        <div className="space-y-4">
          <RouteCalculator />
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 text-white">
            <h3 className="font-bold mb-2">🗺️ OSS-First</h3>
            <ul className="text-sm space-y-1">
              <li>✅ OSRM - FREE routing</li>
              <li>✅ Nominatim - FREE geocoding</li>
              <li>✅ Leaflet - FREE maps</li>
              <li>⚠️ Google - fallback only</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-gray-500 text-sm">🙏 jai guru ji | © 2025 Powerp Box IT Solutions</div>
    </div>
  );
}
