import { useState, useEffect } from 'react';
import { useQuery, useSubscription, gql } from '@apollo/client';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { useTheme, useTextColor } from '../contexts/ThemeContext';
import { Truck, User, Phone, Navigation, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// GraphQL Queries
const GET_VEHICLES = gql`
  query GetVehicles {
    vehicles {
      id
      vehicleNumber
      vehicleType
      status
      lastLatitude
      lastLongitude
      lastUpdated
      driver {
        id
        name
        phone
      }
    }
  }
`;

// GraphQL Subscription for real-time updates
const VEHICLE_POSITION_SUBSCRIPTION = gql`
  subscription OnVehiclePositionUpdated($vehicleId: ID) {
    vehiclePositionUpdated(vehicleId: $vehicleId) {
      id
      vehicleId
      latitude
      longitude
      speed
      heading
      ignition
      timestamp
    }
  }
`;

interface VehicleData {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  status: string;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastUpdated: string | null;
  driver: {
    id: string;
    name: string;
    phone: string;
  } | null;
  // Live data from subscription
  speed?: number;
  heading?: number;
  ignition?: boolean;
}

// Dynamic truck icon
const createTruckIcon = (status: string, speed: number, zoom: number, heading?: number) => {
  const isMoving = speed > 5;
  const isStopped = speed > 0 && speed <= 5;
  
  const colors: Record<string, string> = {
    moving: '#00FF00',
    stopped: '#FF6600', 
    parked: '#FFFF00',
    maintenance: '#888888',
    available: '#00FF00',
    in_transit: '#FF6600',
  };
  
  let fillColor = colors[status] || '#FFFF00';
  if (isMoving) fillColor = '#00FF00';
  else if (isStopped) fillColor = '#FF6600';
  
  const size = zoom <= 5 ? 14 : zoom <= 7 ? 20 : zoom <= 9 ? 28 : zoom <= 11 ? 36 : 44;
  const border = zoom <= 7 ? 2 : 3;
  const svgSize = Math.max(10, size - 10);
  const rotation = heading || 0;
  
  return new DivIcon({
    html: `<div style="
      background: ${fillColor};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: ${border}px solid #1a1a1a;
      box-shadow: 0 0 0 2px white, 0 3px 8px rgba(0,0,0,0.5);
      cursor: pointer;
      transform: rotate(${rotation}deg);
    ">
      <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="#1a1a1a">
        <path d="M12 2L4 14h6v8l8-12h-6z"/>
      </svg>
    </div>`,
    className: 'truck-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoomChange(map.getZoom()) });
  useEffect(() => { onZoomChange(map.getZoom()); }, []);
  return null;
}

function FitAllMarkers({ vehicles }: { vehicles: VehicleData[] }) {
  const map = useMap();
  useEffect(() => {
    const validVehicles = vehicles.filter(v => v.lastLatitude && v.lastLongitude);
    if (validVehicles.length > 0) {
      const bounds = validVehicles.map(v => [v.lastLatitude!, v.lastLongitude!] as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [vehicles.length]);
  return null;
}

export default function Fleet() {
  const { theme, accent } = useTheme();
  const textColor = useTextColor();
  
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [zoom, setZoom] = useState(5);

  // Fetch initial vehicles
  const { data, loading, error, refetch } = useQuery(GET_VEHICLES, {
    pollInterval: 30000, // Refresh every 30s as backup
  });

  // Subscribe to real-time position updates
  const { data: positionData } = useSubscription(VEHICLE_POSITION_SUBSCRIPTION);

  // Update vehicles from query
  useEffect(() => {
    if (data?.vehicles) {
      setVehicles(data.vehicles.map((v: any) => ({
        ...v,
        speed: 0,
        heading: 0,
      })));
    }
  }, [data]);

  // Update vehicles from subscription
  useEffect(() => {
    if (positionData?.vehiclePositionUpdated) {
      const pos = positionData.vehiclePositionUpdated;
      setVehicles(prev => prev.map(v => 
        v.id === pos.vehicleId 
          ? { 
              ...v, 
              lastLatitude: pos.latitude, 
              lastLongitude: pos.longitude,
              speed: pos.speed || 0,
              heading: pos.heading || 0,
              ignition: pos.ignition,
              lastUpdated: pos.timestamp,
            }
          : v
      ));
    }
  }, [positionData]);

  const cardBg = theme === 'light' ? 'bg-white' : theme === 'neon' ? 'bg-gray-900 border border-green-900' : 'bg-gray-800';
  const inputBg = theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : theme === 'neon' ? 'bg-black border-green-800 text-green-400' : 'bg-gray-700 border-gray-600 text-white';

  // Filter vehicles with valid coordinates
  const validVehicles = vehicles.filter(v => v.lastLatitude && v.lastLongitude);
  const filteredVehicles = filter === 'all' 
    ? validVehicles 
    : validVehicles.filter(v => {
        if (filter === 'moving') return (v.speed || 0) > 5;
        if (filter === 'stopped') return (v.speed || 0) > 0 && (v.speed || 0) <= 5;
        if (filter === 'parked') return (v.speed || 0) === 0;
        return v.status === filter;
      });

  const stats = {
    total: validVehicles.length,
    moving: validVehicles.filter(v => (v.speed || 0) > 5).length,
    stopped: validVehicles.filter(v => (v.speed || 0) > 0 && (v.speed || 0) <= 5).length,
    parked: validVehicles.filter(v => (v.speed || 0) === 0).length,
  };

  const statusDots: Record<string, string> = {
    moving: '#00FF00',
    stopped: '#FF6600',
    parked: '#FFFF00',
    available: '#00FF00',
    in_transit: '#FF6600',
    maintenance: '#888888',
  };

  const getVehicleStatus = (v: VehicleData) => {
    if ((v.speed || 0) > 5) return 'moving';
    if ((v.speed || 0) > 0) return 'stopped';
    return 'parked';
  };

  const isConnected = !error;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      {/* Left Panel */}
      <div className={`w-full lg:w-72 ${cardBg} rounded-xl shadow-sm flex flex-col`}>
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h1 className={`text-lg font-bold ${textColor.primary} flex items-center gap-2`}>
              <Truck className="w-5 h-5" /> Live Fleet
            </h1>
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'Live' : 'Error'}
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-1 mt-2">
            <div className="text-center p-1">
              <p className={`text-base font-bold ${textColor.primary}`}>{stats.total}</p>
              <p className={`text-[9px] ${textColor.muted}`}>Total</p>
            </div>
            <div className="text-center p-1">
              <p className="text-base font-bold" style={{ color: '#00FF00' }}>{stats.moving}</p>
              <p className={`text-[9px] ${textColor.muted}`}>Moving</p>
            </div>
            <div className="text-center p-1">
              <p className="text-base font-bold" style={{ color: '#FF6600' }}>{stats.stopped}</p>
              <p className={`text-[9px] ${textColor.muted}`}>Stopped</p>
            </div>
            <div className="text-center p-1">
              <p className="text-base font-bold" style={{ color: '#FFFF00' }}>{stats.parked}</p>
              <p className={`text-[9px] ${textColor.muted}`}>Parked</p>
            </div>
          </div>
        </div>

        <div className="p-2 border-b border-gray-700">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`w-full px-2 py-1.5 rounded-lg border ${inputBg} text-sm`}
          >
            <option value="all">All ({stats.total})</option>
            <option value="moving">🟢 Moving ({stats.moving})</option>
            <option value="stopped">🟠 Stopped ({stats.stopped})</option>
            <option value="parked">🟡 Parked ({stats.parked})</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className={`p-4 text-center ${textColor.muted}`}>Loading vehicles...</div>
          ) : filteredVehicles.length === 0 ? (
            <div className={`p-4 text-center ${textColor.muted}`}>No vehicles with GPS data</div>
          ) : (
            filteredVehicles.map((vehicle) => {
              const vStatus = getVehicleStatus(vehicle);
              return (
                <div
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={`p-2 border-b cursor-pointer transition-all
                    ${selectedVehicle?.id === vehicle.id 
                      ? theme === 'light' ? 'bg-orange-50 border-orange-200' : 'bg-orange-500/20 border-orange-500/30' 
                      : theme === 'light' ? 'hover:bg-gray-50 border-gray-100' : 'hover:bg-gray-700/50 border-gray-700/50'}`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border-2 border-gray-800"
                      style={{ backgroundColor: statusDots[vStatus], boxShadow: '0 0 4px rgba(0,0,0,0.3)' }} 
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${textColor.primary} text-sm truncate`}>{vehicle.vehicleNumber}</p>
                      <p className={`text-[10px] ${textColor.muted} truncate`}>{vehicle.driver?.name || 'No driver'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] font-medium ${(vehicle.speed || 0) > 0 ? 'text-green-400' : textColor.muted}`}>
                        {(vehicle.speed || 0) > 0 ? `${Math.round(vehicle.speed || 0)} km/h` : 'Parked'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-2 border-t border-gray-700 flex items-center justify-between">
          <span className={`text-[10px] ${textColor.muted}`}>🔍 {zoom}x</span>
          <button 
            onClick={() => refetch()}
            className={`text-xs ${textColor.secondary} flex items-center gap-1 hover:opacity-80`}
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden shadow-sm relative">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          <ZoomTracker onZoomChange={setZoom} />
          
          {filteredVehicles.map((vehicle) => {
            const vStatus = getVehicleStatus(vehicle);
            return (
              <Marker
                key={`${vehicle.id}-${zoom}`}
                position={[vehicle.lastLatitude!, vehicle.lastLongitude!]}
                icon={createTruckIcon(vStatus, vehicle.speed || 0, zoom, vehicle.heading)}
                eventHandlers={{ click: () => setSelectedVehicle(vehicle) }}
              >
                <Popup>
                  <div className="text-sm min-w-[180px]">
                    <p className="font-bold text-gray-900">{vehicle.vehicleNumber}</p>
                    <p className="text-gray-500 text-xs">{vehicle.vehicleType}</p>
                    {vehicle.driver && (
                      <>
                        <p className="text-gray-600 flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" /> {vehicle.driver.name}
                        </p>
                        <p className="text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {vehicle.driver.phone}
                        </p>
                      </>
                    )}
                    <p className="text-gray-600 flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> {Math.round(vehicle.speed || 0)} km/h
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {filteredVehicles.length > 0 && <FitAllMarkers vehicles={filteredVehicles} />}
        </MapContainer>

        {/* Legend */}
        <div 
          className={`absolute top-4 right-4 ${cardBg} rounded-lg p-2 text-xs shadow-lg`}
          style={{ zIndex: 1000 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full border-2 border-gray-800" style={{ backgroundColor: '#00FF00' }}></div>
            <span className={textColor.secondary}>Moving</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full border-2 border-gray-800" style={{ backgroundColor: '#FF6600' }}></div>
            <span className={textColor.secondary}>Stopped</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-gray-800" style={{ backgroundColor: '#FFFF00' }}></div>
            <span className={textColor.secondary}>Parked</span>
          </div>
        </div>

        {/* Connection Status */}
        <div 
          className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-xs shadow-lg flex items-center gap-2 ${isConnected ? 'bg-green-600' : 'bg-red-600'} text-white`}
          style={{ zIndex: 1000 }}
        >
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isConnected ? 'GraphQL Live' : 'Connection Error'}
        </div>

        {/* Selected Vehicle */}
        {selectedVehicle && (
          <div 
            className={`absolute bottom-4 left-4 right-4 lg:right-auto lg:w-80 ${cardBg} rounded-xl p-3 shadow-lg`}
            style={{ zIndex: 1000 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center border-3 border-gray-800"
                  style={{ backgroundColor: statusDots[getVehicleStatus(selectedVehicle)] }}
                >
                  <Truck className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <p className={`font-bold ${textColor.primary} text-sm`}>{selectedVehicle.vehicleNumber}</p>
                  <p className={`text-xs ${textColor.secondary}`}>{selectedVehicle.driver?.name || 'No driver'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${(selectedVehicle.speed || 0) > 0 ? 'text-green-400' : textColor.muted}`}>
                  {Math.round(selectedVehicle.speed || 0)} <span className="text-xs">km/h</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className={`p-1 rounded ${textColor.muted} hover:opacity-70`}
              >
                ✕
              </button>
            </div>
            {selectedVehicle.lastUpdated && (
              <p className={`text-[10px] ${textColor.muted} mt-2 pt-2 border-t border-gray-700`}>
                Last update: {new Date(selectedVehicle.lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
