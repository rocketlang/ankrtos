import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useTheme, useTextColor } from '../contexts/ThemeContext';
import { Truck, Calculator, IndianRupee, Route, Clock, Fuel } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const SAATHI_API = 'http://localhost:4002';

// Vehicle types with toll multipliers
const vehicleTypes = [
  { id: 'lcv', name: 'LCV (Tata Ace)', axles: 2, tollMultiplier: 1.0, icon: '🚚' },
  { id: '14ft', name: '14 Ft Truck', axles: 2, tollMultiplier: 1.2, icon: '🚛' },
  { id: '17ft', name: '17 Ft Truck', axles: 2, tollMultiplier: 1.3, icon: '🚛' },
  { id: '19ft', name: '19 Ft Truck', axles: 2, tollMultiplier: 1.4, icon: '🚛' },
  { id: '20ft', name: '20 Ft Container', axles: 2, tollMultiplier: 1.5, icon: '📦' },
  { id: '32ft_sxl', name: '32 Ft SXL', axles: 3, tollMultiplier: 1.8, icon: '🚚' },
  { id: '32ft_mxl', name: '32 Ft MXL', axles: 3, tollMultiplier: 2.0, icon: '🚚' },
  { id: '40ft', name: '40 Ft Container', axles: 4, tollMultiplier: 2.5, icon: '📦' },
  { id: 'trailer', name: 'Trailer', axles: 5, tollMultiplier: 3.0, icon: '🚛' },
];

// Custom markers
const greenIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const redIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Decode polyline
function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length >= 2) {
      map.fitBounds(coords, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
}

export default function Rates() {
  const { theme, accent } = useTheme();
  const textColor = useTextColor();
  
  const [originPin, setOriginPin] = useState('');
  const [destPin, setDestPin] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [destCity, setDestCity] = useState('');
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleTypes[6]); // 32ft MXL default
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Theme styles
  const cardBg = theme === 'light' ? 'bg-white' : theme === 'neon' ? 'bg-gray-900 border border-green-900' : 'bg-gray-800';
  const inputBg = theme === 'light' ? 'bg-gray-50 border-gray-200' : theme === 'neon' ? 'bg-black border-green-800 text-green-400' : 'bg-gray-700 border-gray-600 text-white';
  const accentColors: Record<string, string> = { orange: 'bg-orange-600', blue: 'bg-blue-600', green: 'bg-green-600', purple: 'bg-purple-600', red: 'bg-red-600' };
  const accentBg = accentColors[accent];

  // Lookup pincode
  const lookupPincode = async (pin: string, type: 'origin' | 'dest') => {
    if (pin.length !== 6) return;
    try {
      const res = await fetch(`${SAATHI_API}/api/pincode/${pin}`);
      if (res.ok) {
        const data = await res.json();
        if (type === 'origin') {
          setOriginCity(`${data.city}, ${data.state}`);
          setOriginCoords([data.lat, data.lng]);
        } else {
          setDestCity(`${data.city}, ${data.state}`);
          setDestCoords([data.lat, data.lng]);
        }
      }
    } catch (e) { console.error(e); }
  };

  // Calculate route
  const calculateRoute = async () => {
    if (!originCoords || !destCoords) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${SAATHI_API}/api/route/coords?from_lat=${originCoords[0]}&from_lng=${originCoords[1]}&to_lat=${destCoords[0]}&to_lng=${destCoords[1]}`
      );
      if (res.ok) {
        const data = await res.json();
        setRouteData(data);
        if (data.geometry) {
          setRouteCoords(decodePolyline(data.geometry));
        } else {
          setRouteCoords([originCoords, destCoords]);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // Calculate rates based on vehicle
  const baseToll = routeData?.toll_estimate || 0;
  const adjustedToll = Math.round(baseToll * selectedVehicle.tollMultiplier);
  const distance = routeData?.distance_km || 0;
  const fuelCost = Math.round(distance * 12); // ~₹12/km fuel estimate
  const driverCost = Math.round(distance * 3); // ~₹3/km driver cost
  const totalCost = adjustedToll + fuelCost + driverCost;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      {/* Left Panel - Form */}
      <div className={`w-full lg:w-96 ${cardBg} rounded-xl p-4 shadow-sm overflow-y-auto`}>
        <h1 className={`text-xl font-bold ${textColor.primary} mb-4 flex items-center gap-2`}>
          <IndianRupee className="w-6 h-6" /> Rate Calculator
        </h1>

        {/* Origin */}
        <div className="mb-4">
          <label className={`text-sm ${textColor.secondary} mb-1 block`}>Origin Pincode</label>
          <input
            type="text"
            value={originPin}
            onChange={(e) => {
              setOriginPin(e.target.value);
              if (e.target.value.length === 6) lookupPincode(e.target.value, 'origin');
            }}
            placeholder="e.g. 600001"
            className={`w-full px-3 py-2 rounded-lg border ${inputBg} focus:outline-none focus:ring-2 focus:ring-orange-500`}
            maxLength={6}
          />
          {originCity && <p className={`text-xs ${textColor.muted} mt-1`}>📍 {originCity}</p>}
        </div>

        {/* Destination */}
        <div className="mb-4">
          <label className={`text-sm ${textColor.secondary} mb-1 block`}>Destination Pincode</label>
          <input
            type="text"
            value={destPin}
            onChange={(e) => {
              setDestPin(e.target.value);
              if (e.target.value.length === 6) lookupPincode(e.target.value, 'dest');
            }}
            placeholder="e.g. 110001"
            className={`w-full px-3 py-2 rounded-lg border ${inputBg} focus:outline-none focus:ring-2 focus:ring-orange-500`}
            maxLength={6}
          />
          {destCity && <p className={`text-xs ${textColor.muted} mt-1`}>📍 {destCity}</p>}
        </div>

        {/* Vehicle Type */}
        <div className="mb-4">
          <label className={`text-sm ${textColor.secondary} mb-1 block`}>Vehicle Type</label>
          <select
            value={selectedVehicle.id}
            onChange={(e) => setSelectedVehicle(vehicleTypes.find(v => v.id === e.target.value) || vehicleTypes[6])}
            className={`w-full px-3 py-2 rounded-lg border ${inputBg} focus:outline-none focus:ring-2 focus:ring-orange-500`}
          >
            {vehicleTypes.map(v => (
              <option key={v.id} value={v.id}>{v.icon} {v.name}</option>
            ))}
          </select>
          <p className={`text-xs ${textColor.muted} mt-1`}>Axles: {selectedVehicle.axles} | Toll Factor: {selectedVehicle.tollMultiplier}x</p>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculateRoute}
          disabled={!originCoords || !destCoords || loading}
          className={`w-full py-3 rounded-lg ${accentBg} text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50`}
        >
          {loading ? <span className="animate-spin">⏳</span> : <Calculator className="w-5 h-5" />}
          {loading ? 'Calculating...' : 'Calculate Rate'}
        </button>

        {/* Results */}
        {routeData && (
          <div className="mt-6 space-y-3">
            <h2 className={`font-semibold ${textColor.primary} flex items-center gap-2`}>
              <Route className="w-5 h-5" /> Route Details
            </h2>
            
            <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : theme === 'neon' ? 'bg-black' : 'bg-gray-700'}`}>
              <div className="flex justify-between mb-2">
                <span className={textColor.secondary}>Distance</span>
                <span className={`font-bold ${textColor.primary}`}>{distance.toFixed(0)} km</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className={textColor.secondary}>Duration</span>
                <span className={`font-bold ${textColor.primary}`}>{routeData.duration_text || `${Math.round(distance/50)}h`}</span>
              </div>
            </div>

            <h2 className={`font-semibold ${textColor.primary} flex items-center gap-2 mt-4`}>
              <IndianRupee className="w-5 h-5" /> Cost Breakdown ({selectedVehicle.name})
            </h2>

            <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : theme === 'neon' ? 'bg-black' : 'bg-gray-700'}`}>
              <div className="flex justify-between mb-2">
                <span className={textColor.secondary}>🛣️ Toll Charges</span>
                <span className={`font-bold ${textColor.primary}`}>₹{adjustedToll.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className={textColor.secondary}>⛽ Fuel Cost</span>
                <span className={`font-bold ${textColor.primary}`}>₹{fuelCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className={textColor.secondary}>👨‍✈️ Driver Cost</span>
                <span className={`font-bold ${textColor.primary}`}>₹{driverCost.toLocaleString('en-IN')}</span>
              </div>
              <hr className={`my-2 ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`} />
              <div className="flex justify-between">
                <span className={`font-semibold ${textColor.primary}`}>Total Estimated</span>
                <span className={`font-bold text-lg ${accent === 'orange' ? 'text-orange-500' : accent === 'blue' ? 'text-blue-500' : accent === 'green' ? 'text-green-500' : accent === 'purple' ? 'text-purple-500' : 'text-red-500'}`}>
                  ₹{totalCost.toLocaleString('en-IN')}
                </span>
              </div>
              <p className={`text-xs ${textColor.muted} mt-2`}>Rate per km: ₹{(totalCost/distance).toFixed(2)}/km</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Map */}
      <div className="flex-1 rounded-xl overflow-hidden shadow-sm">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url={theme === 'dark' || theme === 'neon' 
              ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'}
          />
          {originCoords && <Marker position={originCoords} icon={greenIcon} />}
          {destCoords && <Marker position={destCoords} icon={redIcon} />}
          {routeCoords.length > 0 && (
            <>
              <Polyline positions={routeCoords} color={accent === 'orange' ? '#f97316' : accent === 'blue' ? '#3b82f6' : accent === 'green' ? '#22c55e' : accent === 'purple' ? '#a855f7' : '#ef4444'} weight={4} />
              <FitBounds coords={routeCoords} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
