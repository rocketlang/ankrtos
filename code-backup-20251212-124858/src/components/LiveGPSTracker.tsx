/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANKR LIVE GPS TRACKER - Real-time Fleet Visibility
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - Real-time truck locations
 * - ETA predictions
 * - Geofence alerts
 * - Route visualization
 * - Voice alerts
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Truck, Clock, AlertTriangle, Navigation, Phone, Bell } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Vehicle {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  status: 'moving' | 'stopped' | 'idle' | 'offline';
  lastUpdate: Date;
  currentTrip?: {
    id: string;
    origin: string;
    destination: string;
    eta: Date;
    distanceRemaining: number;
    progress: number;
  };
  alerts: Array<{
    type: 'geofence' | 'speed' | 'deviation' | 'sos';
    message: string;
    timestamp: Date;
  }>;
}

interface Geofence {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // meters
  type: 'pickup' | 'delivery' | 'hub' | 'restricted';
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    vehicleNumber: 'MH-12-AB-1234',
    driverName: 'Ramesh Kumar',
    driverPhone: '+91-98765-43210',
    lat: 19.076 + Math.random() * 2,
    lng: 72.8777 + Math.random() * 3,
    speed: 65,
    heading: 45,
    status: 'moving',
    lastUpdate: new Date(),
    currentTrip: {
      id: 'TRIP-001',
      origin: 'Mumbai',
      destination: 'Pune',
      eta: new Date(Date.now() + 2 * 60 * 60 * 1000),
      distanceRemaining: 85,
      progress: 45,
    },
    alerts: [],
  },
  {
    id: 'v2',
    vehicleNumber: 'MH-14-CD-5678',
    driverName: 'Suresh Singh',
    driverPhone: '+91-87654-32109',
    lat: 18.5204 + Math.random(),
    lng: 73.8567 + Math.random(),
    speed: 0,
    heading: 0,
    status: 'stopped',
    lastUpdate: new Date(Date.now() - 15 * 60 * 1000),
    currentTrip: {
      id: 'TRIP-002',
      origin: 'Pune',
      destination: 'Bangalore',
      eta: new Date(Date.now() + 8 * 60 * 60 * 1000),
      distanceRemaining: 450,
      progress: 25,
    },
    alerts: [
      { type: 'geofence', message: 'Entered Pune hub', timestamp: new Date() },
    ],
  },
  {
    id: 'v3',
    vehicleNumber: 'KA-01-EF-9012',
    driverName: 'Vijay Rao',
    driverPhone: '+91-76543-21098',
    lat: 12.9716 + Math.random(),
    lng: 77.5946 + Math.random(),
    speed: 72,
    heading: 180,
    status: 'moving',
    lastUpdate: new Date(),
    alerts: [
      { type: 'speed', message: 'Overspeeding: 72 km/h', timestamp: new Date() },
    ],
  },
];

const GEOFENCES: Geofence[] = [
  { id: 'g1', name: 'Mumbai Hub', lat: 19.076, lng: 72.8777, radius: 5000, type: 'hub' },
  { id: 'g2', name: 'Pune Hub', lat: 18.5204, lng: 73.8567, radius: 3000, type: 'hub' },
  { id: 'g3', name: 'Bangalore Hub', lat: 12.9716, lng: 77.5946, radius: 4000, type: 'hub' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface Props {
  lang?: string;
  onVehicleSelect?: (vehicle: Vehicle) => void;
}

export default function LiveGPSTracker({ lang = 'en', onVehicleSelect }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filter, setFilter] = useState<'all' | 'moving' | 'stopped' | 'alert'>('all');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v => ({
        ...v,
        lat: v.status === 'moving' ? v.lat + (Math.random() - 0.5) * 0.01 : v.lat,
        lng: v.status === 'moving' ? v.lng + (Math.random() - 0.5) * 0.01 : v.lng,
        speed: v.status === 'moving' ? 50 + Math.random() * 30 : 0,
        lastUpdate: v.status !== 'offline' ? new Date() : v.lastUpdate,
      })));
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredVehicles = vehicles.filter(v => {
    if (filter === 'all') return true;
    if (filter === 'moving') return v.status === 'moving';
    if (filter === 'stopped') return v.status === 'stopped' || v.status === 'idle';
    if (filter === 'alert') return v.alerts.length > 0;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving': return 'bg-green-500';
      case 'stopped': return 'bg-yellow-500';
      case 'idle': return 'bg-orange-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, Record<string, string>> = {
      en: { moving: 'Moving', stopped: 'Stopped', idle: 'Idle', offline: 'Offline' },
      hi: { moving: 'चल रहा', stopped: 'रुका हुआ', idle: 'निष्क्रिय', offline: 'ऑफलाइन' },
    };
    return texts[lang]?.[status] || status;
  };

  const formatETA = (date: Date) => {
    const diff = date.getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              {lang === 'hi' ? 'लाइव ट्रैकिंग' : 'Live GPS Tracking'}
            </h3>
            <p className="text-blue-100 text-sm">
              {vehicles.length} {lang === 'hi' ? 'वाहन' : 'vehicles'} •
              Updated {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-white text-sm">Live</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3">
          {(['all', 'moving', 'stopped', 'alert'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-500/50 text-white hover:bg-blue-500'
              }`}
            >
              {f === 'all' ? (lang === 'hi' ? 'सभी' : 'All') :
               f === 'moving' ? (lang === 'hi' ? 'चल रहे' : 'Moving') :
               f === 'stopped' ? (lang === 'hi' ? 'रुके हुए' : 'Stopped') :
               (lang === 'hi' ? 'अलर्ट' : 'Alerts')}
              {f === 'alert' && vehicles.filter(v => v.alerts.length > 0).length > 0 && (
                <span className="ml-1 bg-red-500 text-white px-1.5 rounded-full">
                  {vehicles.filter(v => v.alerts.length > 0).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle List */}
      <div className="divide-y divide-gray-700 max-h-[400px] overflow-y-auto">
        {filteredVehicles.map(vehicle => (
          <div
            key={vehicle.id}
            onClick={() => {
              setSelectedVehicle(vehicle);
              onVehicleSelect?.(vehicle);
            }}
            className={`p-4 hover:bg-gray-700 cursor-pointer transition-all ${
              selectedVehicle?.id === vehicle.id ? 'bg-gray-700 border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${getStatusColor(vehicle.status)} flex items-center justify-center`}>
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">{vehicle.vehicleNumber}</p>
                  <p className="text-sm text-gray-400">{vehicle.driverName}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(vehicle.status)} text-white`}>
                  {getStatusText(vehicle.status)}
                </span>
                {vehicle.status === 'moving' && (
                  <p className="text-sm text-gray-400 mt-1">{Math.round(vehicle.speed)} km/h</p>
                )}
              </div>
            </div>

            {/* Trip Info */}
            {vehicle.currentTrip && (
              <div className="mt-3 bg-gray-700/50 rounded-lg p-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {vehicle.currentTrip.origin} → {vehicle.currentTrip.destination}
                  </span>
                  <span className="text-blue-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ETA: {formatETA(vehicle.currentTrip.eta)}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="mt-2 h-2 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all"
                    style={{ width: `${vehicle.currentTrip.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {vehicle.currentTrip.distanceRemaining} km remaining
                </p>
              </div>
            )}

            {/* Alerts */}
            {vehicle.alerts.length > 0 && (
              <div className="mt-2 space-y-1">
                {vehicle.alerts.slice(0, 2).map((alert, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <AlertTriangle className={`w-3 h-3 ${
                      alert.type === 'sos' ? 'text-red-500' :
                      alert.type === 'speed' ? 'text-orange-500' :
                      'text-yellow-500'
                    }`} />
                    <span className="text-gray-400">{alert.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Vehicle Actions */}
      {selectedVehicle && (
        <div className="p-4 bg-gray-700 border-t border-gray-600">
          <div className="flex gap-2">
            <a
              href={`tel:${selectedVehicle.driverPhone}`}
              className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm"
            >
              <Phone className="w-4 h-4" />
              {lang === 'hi' ? 'कॉल करें' : 'Call Driver'}
            </a>
            <button
              onClick={() => window.open(`https://www.google.com/maps?q=${selectedVehicle.lat},${selectedVehicle.lng}`, '_blank')}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm"
            >
              <MapPin className="w-4 h-4" />
              {lang === 'hi' ? 'नक्शा' : 'View Map'}
            </button>
            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
