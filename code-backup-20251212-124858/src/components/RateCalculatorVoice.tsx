/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANKR RATE CALCULATOR - Voice-Enabled, 103 Languages
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Mumbai Delhi 20 ton" → Instant rate via voice!
 *
 * Features:
 * - Voice input in 103 languages
 * - Real-time rate calculation
 * - Toll + Fuel + Driver costs
 * - Surge pricing display
 * - WhatsApp sharing
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calculator, IndianRupee, Truck, MapPin, Fuel, 
  Mic, MicOff, Share2, MessageCircle, Volume2
} from 'lucide-react';
import { ANKR_LANGUAGES } from '../config/languages';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface RateResult {
  origin: string;
  destination: string;
  distance: number;
  vehicleType: string;
  tollCharges: number;
  fuelCost: number;
  driverCost: number;
  totalCost: number;
  ratePerKm: number;
  surgeMultiplier: number;
  surgeLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'SURGE';
}

interface VehicleType {
  id: string;
  name: string;
  nameHi: string;
  axles: number;
  tollMultiplier: number;
  fuelEfficiency: number; // km per litre
  icon: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const VEHICLE_TYPES: VehicleType[] = [
  { id: 'lcv', name: 'LCV (Tata Ace)', nameHi: 'छोटा ट्रक', axles: 2, tollMultiplier: 1.0, fuelEfficiency: 12, icon: '🚚' },
  { id: '14ft', name: '14 Ft Truck', nameHi: '14 फीट ट्रक', axles: 2, tollMultiplier: 1.2, fuelEfficiency: 8, icon: '🚛' },
  { id: '17ft', name: '17 Ft Truck', nameHi: '17 फीट ट्रक', axles: 2, tollMultiplier: 1.3, fuelEfficiency: 7, icon: '🚛' },
  { id: '19ft', name: '19 Ft Truck', nameHi: '19 फीट ट्रक', axles: 2, tollMultiplier: 1.4, fuelEfficiency: 6.5, icon: '🚛' },
  { id: '20ft', name: '20 Ft Container', nameHi: '20 फीट कंटेनर', axles: 2, tollMultiplier: 1.5, fuelEfficiency: 6, icon: '📦' },
  { id: '32ft_sxl', name: '32 Ft SXL', nameHi: '32 फीट SXL', axles: 3, tollMultiplier: 1.8, fuelEfficiency: 5, icon: '🚚' },
  { id: '32ft_mxl', name: '32 Ft MXL', nameHi: '32 फीट MXL', axles: 3, tollMultiplier: 2.0, fuelEfficiency: 4.5, icon: '🚚' },
  { id: '40ft', name: '40 Ft Container', nameHi: '40 फीट कंटेनर', axles: 4, tollMultiplier: 2.5, fuelEfficiency: 4, icon: '📦' },
  { id: 'trailer', name: 'Trailer', nameHi: 'ट्रेलर', axles: 5, tollMultiplier: 3.0, fuelEfficiency: 3.5, icon: '🚛' },
];

const FUEL_PRICE = 95; // ₹ per litre (diesel)
const DRIVER_COST_PER_KM = 3; // ₹ per km
const BASE_TOLL_PER_KM = 2.5; // ₹ per km base

// City coordinates for distance estimation
const CITY_COORDS: Record<string, [number, number]> = {
  'mumbai': [19.076, 72.8777], 'delhi': [28.6139, 77.2090], 'bangalore': [12.9716, 77.5946],
  'chennai': [13.0827, 80.2707], 'kolkata': [22.5726, 88.3639], 'hyderabad': [17.385, 78.4867],
  'pune': [18.5204, 73.8567], 'ahmedabad': [23.0225, 72.5714], 'jaipur': [26.9124, 75.7873],
  'lucknow': [26.8467, 80.9462], 'gurgaon': [28.4595, 77.0266], 'noida': [28.5355, 77.3910],
  'surat': [21.1702, 72.8311], 'nagpur': [21.1458, 79.0882], 'indore': [22.7196, 75.8577],
  'bhopal': [23.2599, 77.4126], 'patna': [25.5941, 85.1376], 'vadodara': [22.3072, 73.1812],
  'coimbatore': [11.0168, 76.9558], 'kochi': [9.9312, 76.2673], 'visakhapatnam': [17.6868, 83.2185],
  // Hindi names
  'मुंबई': [19.076, 72.8777], 'दिल्ली': [28.6139, 77.2090], 'बेंगलुरु': [12.9716, 77.5946],
  'चेन्नई': [13.0827, 80.2707], 'कोलकाता': [22.5726, 88.3639], 'हैदराबाद': [17.385, 78.4867],
  'पुणे': [18.5204, 73.8567], 'अहमदाबाद': [23.0225, 72.5714], 'जयपुर': [26.9124, 75.7873],
};

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE HOOK
// ═══════════════════════════════════════════════════════════════════════════════

function useVoiceInput(langCode: string = 'hi') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const getBcp47 = (code: string) => {
    const lang = ANKR_LANGUAGES.find(l => l.code === code);
    return lang?.bcp47 || 'hi-IN';
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = getBcp47(langCode);

    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
    };

    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = () => setIsListening(false);

    return () => recognitionRef.current?.stop();
  }, [langCode]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getBcp47(langCode);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [langCode]);

  return { isListening, transcript, startListening, stopListening, speak };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RATE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

function calculateDistance(origin: string, destination: string): number {
  const o = CITY_COORDS[origin.toLowerCase()] || CITY_COORDS[origin];
  const d = CITY_COORDS[destination.toLowerCase()] || CITY_COORDS[destination];
  
  if (!o || !d) return 0;
  
  // Haversine formula
  const R = 6371;
  const dLat = (d[0] - o[0]) * Math.PI / 180;
  const dLon = (d[1] - o[1]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(o[0] * Math.PI / 180) * Math.cos(d[0] * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  // Road distance is typically 1.3x straight line
  return Math.round(R * c * 1.3);
}

function getSurgeLevel(origin: string, destination: string): { multiplier: number; level: 'LOW' | 'NORMAL' | 'HIGH' | 'SURGE' } {
  // Simulated surge based on popular routes
  const highDemandRoutes = ['mumbai-delhi', 'delhi-mumbai', 'chennai-delhi', 'delhi-chennai'];
  const key = `${origin.toLowerCase()}-${destination.toLowerCase()}`;
  
  if (highDemandRoutes.includes(key)) {
    return { multiplier: 1.2, level: 'HIGH' };
  }
  
  // Random surge for demo
  const rand = Math.random();
  if (rand > 0.9) return { multiplier: 1.3, level: 'SURGE' };
  if (rand > 0.7) return { multiplier: 1.15, level: 'HIGH' };
  if (rand > 0.3) return { multiplier: 1.0, level: 'NORMAL' };
  return { multiplier: 0.9, level: 'LOW' };
}

function calculateRate(origin: string, destination: string, vehicleId: string): RateResult | null {
  const vehicle = VEHICLE_TYPES.find(v => v.id === vehicleId);
  if (!vehicle) return null;

  const distance = calculateDistance(origin, destination);
  if (distance === 0) return null;

  const surge = getSurgeLevel(origin, destination);
  
  const tollCharges = Math.round(distance * BASE_TOLL_PER_KM * vehicle.tollMultiplier);
  const fuelCost = Math.round((distance / vehicle.fuelEfficiency) * FUEL_PRICE);
  const driverCost = Math.round(distance * DRIVER_COST_PER_KM);
  const baseCost = tollCharges + fuelCost + driverCost;
  const totalCost = Math.round(baseCost * surge.multiplier);

  return {
    origin,
    destination,
    distance,
    vehicleType: vehicle.name,
    tollCharges,
    fuelCost,
    driverCost,
    totalCost,
    ratePerKm: Math.round(totalCost / distance * 100) / 100,
    surgeMultiplier: surge.multiplier,
    surgeLevel: surge.level,
  };
}

// Parse voice input like "Mumbai Delhi 20 ton" or "मुंबई दिल्ली"
function parseVoiceQuery(text: string): { origin: string; destination: string; weight?: number } | null {
  const words = text.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/);
  
  // Try to find cities
  let origin = '', destination = '';
  for (const word of words) {
    if (CITY_COORDS[word]) {
      if (!origin) origin = word;
      else if (!destination) destination = word;
    }
  }

  // Extract weight
  const weightMatch = text.match(/(\d+)\s*(ton|टन|t)/i);
  const weight = weightMatch ? parseInt(weightMatch[1]) : undefined;

  if (origin && destination) {
    return { origin, destination, weight };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface Props {
  lang?: string;
  compact?: boolean;
  onRateCalculated?: (rate: RateResult) => void;
}

export default function RateCalculatorVoice({ lang = 'hi', compact = false, onRateCalculated }: Props) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('32ft_mxl');
  const [result, setResult] = useState<RateResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { isListening, transcript, startListening, stopListening, speak } = useVoiceInput(lang);

  // Process voice input
  useEffect(() => {
    if (transcript && !isListening) {
      const parsed = parseVoiceQuery(transcript);
      if (parsed) {
        setOrigin(parsed.origin);
        setDestination(parsed.destination);
        // Auto-calculate after voice input
        setTimeout(() => handleCalculate(parsed.origin, parsed.destination), 500);
      }
    }
  }, [transcript, isListening]);

  const handleCalculate = (o?: string, d?: string) => {
    setLoading(true);
    const rate = calculateRate(o || origin, d || destination, vehicleId);
    setTimeout(() => {
      setResult(rate);
      setLoading(false);
      if (rate) {
        onRateCalculated?.(rate);
        // Speak result
        const msg = lang === 'hi' 
          ? `${rate.origin} से ${rate.destination}, ${rate.distance} किलोमीटर, कुल ₹${rate.totalCost.toLocaleString()}`
          : `${rate.origin} to ${rate.destination}, ${rate.distance} km, total ₹${rate.totalCost.toLocaleString()}`;
        speak(msg);
      }
    }, 300);
  };

  const shareWhatsApp = () => {
    if (!result) return;
    const text = `🚛 WowTruck Rate Quote

📍 ${result.origin} → ${result.destination}
📏 Distance: ${result.distance} km
🚛 Vehicle: ${result.vehicleType}

💰 Cost Breakdown:
- Toll: ₹${result.tollCharges.toLocaleString()}
- Fuel: ₹${result.fuelCost.toLocaleString()}
- Driver: ₹${result.driverCost.toLocaleString()}
───────────
Total: ₹${result.totalCost.toLocaleString()}
(₹${result.ratePerKm}/km)

📞 Book now: +91-XXXX-XXXXXX`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getSurgeColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-500/20 text-green-400 border-green-500';
      case 'NORMAL': return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'SURGE': return 'bg-red-500/20 text-red-400 border-red-500 animate-pulse';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header with Voice */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-orange-500" />
          {lang === 'hi' ? 'रेट कैलकुलेटर' : 'Rate Calculator'}
        </h3>
        <button
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onTouchStart={startListening}
          onTouchEnd={stopListening}
          className={`p-2 rounded-full transition-all ${
            isListening ? 'bg-red-500 animate-pulse scale-110' : 'bg-orange-600 hover:bg-orange-500'
          }`}
        >
          {isListening ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Voice Hint */}
      {transcript && (
        <div className="mb-3 p-2 bg-orange-900/30 rounded-lg text-sm text-orange-300">
          🎤 "{transcript}"
        </div>
      )}

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {lang === 'hi' ? 'कहाँ से' : 'From'}
          </label>
          <div className="relative">
            <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
            <input
              type="text"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              placeholder={lang === 'hi' ? 'मुंबई' : 'Mumbai'}
              className="w-full pl-8 pr-2 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {lang === 'hi' ? 'कहाँ तक' : 'To'}
          </label>
          <div className="relative">
            <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder={lang === 'hi' ? 'दिल्ली' : 'Delhi'}
              className="w-full pl-8 pr-2 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Vehicle Selector */}
      <div className="mb-3">
        <label className="text-xs text-gray-400 mb-1 block">
          {lang === 'hi' ? 'वाहन' : 'Vehicle'}
        </label>
        <select
          value={vehicleId}
          onChange={e => setVehicleId(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {VEHICLE_TYPES.map(v => (
            <option key={v.id} value={v.id}>
              {v.icon} {lang === 'hi' ? v.nameHi : v.name}
            </option>
          ))}
        </select>
      </div>

      {/* Calculate Button */}
      <button
        onClick={() => handleCalculate()}
        disabled={!origin || !destination || loading}
        className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
      >
        {loading ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <Calculator className="w-5 h-5" />
        )}
        {lang === 'hi' ? 'रेट देखें' : 'Calculate Rate'}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-4 space-y-3">
          {/* Surge Badge */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSurgeColor(result.surgeLevel)}`}>
            {result.surgeLevel === 'SURGE' && '🔥'} 
            {result.surgeLevel} Demand ({result.surgeMultiplier}x)
          </div>

          {/* Route Summary */}
          <div className="flex items-center justify-between text-white">
            <span className="text-lg font-bold">
              {result.origin} → {result.destination}
            </span>
            <span className="text-sm text-gray-400">{result.distance} km</span>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-gray-700 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">🛣️ Toll</span>
              <span className="text-white">₹{result.tollCharges.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">⛽ Fuel</span>
              <span className="text-white">₹{result.fuelCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">👨‍✈️ Driver</span>
              <span className="text-white">₹{result.driverCost.toLocaleString()}</span>
            </div>
            <hr className="border-gray-600" />
            <div className="flex justify-between text-lg">
              <span className="font-bold text-white">Total</span>
              <span className="font-bold text-orange-400">₹{result.totalCost.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 text-right">
              ₹{result.ratePerKm}/km
            </p>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <button
              onClick={shareWhatsApp}
              className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={() => speak(`Total ₹${result.totalCost.toLocaleString()}`)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Voice Instructions */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        🎤 {lang === 'hi' ? '"मुंबई दिल्ली 20 टन" बोलें' : 'Say "Mumbai Delhi 20 ton"'}
      </p>
    </div>
  );
}
