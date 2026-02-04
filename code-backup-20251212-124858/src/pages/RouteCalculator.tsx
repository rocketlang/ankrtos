import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const SAATHI_API = 'http://localhost:4002';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom markers
const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Decode polyline
function decodePolyline(str: string): [number, number][] {
  const coords: [number, number][] = [];
  let lat = 0, lng = 0, i = 0;
  while (i < str.length) {
    let b, shift = 0, result = 0;
    do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

// Map bounds fitter
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      map.fitBounds(coords, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
}

interface RouteResult {
  distance_km: number;
  duration_hours: number;
  duration_text?: string;
  toll_estimate: number;
  geometry?: string;
  provider?: string;
  confidence?: number;
}

export default function RouteCalculator() {
  const [originPin, setOriginPin] = useState('');
  const [destPin, setDestPin] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [destCity, setDestCity] = useState('');
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [vehicleType, setVehicleType] = useState('32ft MXL (Full Load)');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  // Lookup pincode
  const lookupPincode = async (pin: string, type: 'origin' | 'dest') => {
    if (pin.length !== 6) return;
    try {
      const res = await fetch(`${SAATHI_API}/api/pincode/${pin}`);
      const data = await res.json();
      if (data.lat) {
        if (type === 'origin') {
          setOriginCity(`${data.city || data.district}, ${data.state}`);
          setOriginCoords([data.lat, data.lng]);
        } else {
          setDestCity(`${data.city || data.district}, ${data.state}`);
          setDestCoords([data.lat, data.lng]);
        }
      }
    } catch (e) { console.error(e); }
  };

  // Calculate route
  const calculateRoute = async () => {
    if (!originCoords || !destCoords) {
      alert('Please enter valid pincodes');
      return;
    }
    setLoading(true);
    try {
      const url = `${SAATHI_API}/api/route/coords?from_lat=${originCoords[0]}&from_lng=${originCoords[1]}&to_lat=${destCoords[0]}&to_lng=${destCoords[1]}`;
      const res = await fetch(url);
      const data = await res.json();
      
      setResult({
        distance_km: data.distance_km,
        duration_hours: data.duration_hours,
        duration_text: data.duration_text,
        toll_estimate: data.toll_estimate || 0,
        geometry: data.geometry,
        provider: data.provider,
        confidence: data.confidence
      });

      // Decode and set polyline
      if (data.geometry) {
        const decoded = decodePolyline(data.geometry);
        setRouteCoords(decoded);
      } else {
        // Fallback: straight line
        setRouteCoords([originCoords, destCoords]);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to calculate route');
    }
    setLoading(false);
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Left Panel */}
      <div className="w-96 flex-shrink-0 space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
            🗺️ Route Calculator
          </h1>

          {/* Origin */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Origin Pincode</label>
            <input
              type="text"
              value={originPin}
              onChange={(e) => setOriginPin(e.target.value)}
              onBlur={() => lookupPincode(originPin, 'origin')}
              className="w-full border rounded-lg p-2"
              placeholder="e.g. 600001"
              maxLength={6}
            />
            {originCity && <p className="text-sm text-green-600 mt-1">✓ {originCity}</p>}
          </div>

          {/* Destination */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Pincode</label>
            <input
              type="text"
              value={destPin}
              onChange={(e) => setDestPin(e.target.value)}
              onBlur={() => lookupPincode(destPin, 'dest')}
              className="w-full border rounded-lg p-2"
              placeholder="e.g. 110001"
              maxLength={6}
            />
            {destCity && <p className="text-sm text-green-600 mt-1">✓ {destCity}</p>}
          </div>

          {/* Vehicle Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option>32ft MXL (Full Load)</option>
              <option>40ft Container</option>
              <option>20ft Container</option>
              <option>Tata Ace</option>
              <option>14ft Taurus</option>
            </select>
          </div>

          <button
            onClick={calculateRoute}
            disabled={loading || !originCoords || !destCoords}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400"
          >
            {loading ? '⏳ Calculating...' : '📍 Calculate Route & Toll'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Results</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Distance</p>
                <p className="text-2xl font-bold text-blue-600">{result.distance_km?.toFixed(0)} km</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-2xl font-bold text-green-600">{formatDuration(result.duration_hours)}</p>
              </div>
            </div>
            <div className="mt-4 bg-orange-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600">Estimated Toll</p>
              <p className="text-3xl font-bold text-orange-600">₹{result.toll_estimate?.toLocaleString()}</p>
              {result.confidence !== undefined && (
                <p className="text-xs text-gray-500 mt-1">Confidence: {(result.confidence * 100).toFixed(0)}%</p>
              )}
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              {originCity} → {destCity} via {result.provider || 'OSRM'}
            </p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {originCoords && <Marker position={originCoords} icon={originIcon} />}
          {destCoords && <Marker position={destCoords} icon={destIcon} />}
          
          {routeCoords.length > 0 && (
            <>
              <Polyline positions={routeCoords} color="#3b82f6" weight={4} />
              <FitBounds coords={routeCoords} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
