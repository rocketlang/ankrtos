/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DriverApp - Polished with SOS & Voice Commands
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - SOS Emergency Button (prominent)
 * - Voice Commands (Hindi/English)
 * - Current Trip Status
 * - Quick Actions
 * - Offline-capable design
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import { useState, useEffect } from 'react';
import {
  Phone, Mic, MicOff, Navigation, Camera, FileText,
  AlertTriangle, CheckCircle, Truck, MapPin, Clock,
  PhoneCall, Shield, Battery, Signal, Fuel
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Trip {
  id: string;
  tripNumber: string;
  status: 'ASSIGNED' | 'STARTED' | 'IN_TRANSIT' | 'AT_PICKUP' | 'AT_DELIVERY' | 'COMPLETED';
  pickup: { city: string; address: string; contact: string };
  delivery: { city: string; address: string; contact: string };
  vehicle: string;
  cargo: string;
  distance: number;
  eta: string;
}

interface DriverStatus {
  name: string;
  phone: string;
  vehicle: string;
  batteryLevel: number;
  signalStrength: number;
  gpsActive: boolean;
  currentTrip: Trip | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const mockDriverStatus: DriverStatus = {
  name: 'Rajesh Kumar',
  phone: '+91 98765 43210',
  vehicle: 'MH-12-AB-1234',
  batteryLevel: 78,
  signalStrength: 4,
  gpsActive: true,
  currentTrip: {
    id: 'trip-001',
    tripNumber: 'TRP-2024-0542',
    status: 'IN_TRANSIT',
    pickup: { city: 'Mumbai', address: 'Warehouse 5, JNPT', contact: '+91 99999 11111' },
    delivery: { city: 'Pune', address: 'MRF Factory, Pimpri', contact: '+91 99999 22222' },
    vehicle: 'MH-12-AB-1234',
    cargo: '10T Steel Coils',
    distance: 148,
    eta: '2:30 PM'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function DriverApp() {
  const [driver, setDriver] = useState<DriverStatus>(mockDriverStatus);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);

  // ═══════════════════════════════════════════════════════════════════════
  // SOS HANDLER
  // ═══════════════════════════════════════════════════════════════════════

  const handleSOS = () => {
    setSosActive(true);
    setSosCountdown(5);
    
    // Countdown timer
    const interval = setInterval(() => {
      setSosCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    setSosActive(false);
    setSosCountdown(5);
  };

  const triggerEmergency = () => {
    // TODO: Integrate with backend
    // - Send GPS location
    // - Alert fleet manager
    // - Call emergency contacts
    console.log('🚨 EMERGENCY TRIGGERED');
    alert('Emergency alert sent to fleet manager!');
    setSosActive(false);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // VOICE COMMANDS
  // ═══════════════════════════════════════════════════════════════════════

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice not supported in this browser');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'hi-IN'; // Hindi
    recognition.continuous = false;
    
    recognition.onstart = () => {
      setIsListening(true);
      setVoiceText('सुन रहा हूं...');
    };
    
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setVoiceText(text);
      processVoiceCommand(text);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  const processVoiceCommand = (text: string) => {
    const lower = text.toLowerCase();
    
    if (lower.includes('trip') || lower.includes('ट्रिप')) {
      speak('आपकी वर्तमान ट्रिप मुंबई से पुणे है। 148 किलोमीटर बाकी है।');
    } else if (lower.includes('fuel') || lower.includes('पेट्रोल') || lower.includes('डीज़ल')) {
      speak('निकटतम पेट्रोल पंप 5 किलोमीटर आगे है। HP पेट्रोल पंप, पनवेल।');
    } else if (lower.includes('help') || lower.includes('मदद')) {
      speak('मैं आपकी मदद कर सकता हूं। ट्रिप जानकारी, नेविगेशन, या ईपीओडी के लिए बोलें।');
    } else if (lower.includes('navigate') || lower.includes('रास्ता')) {
      speak('नेविगेशन शुरू कर रहा हूं। पुणे की ओर।');
    } else {
      speak('समझ नहीं आया। कृपया दोबारा बोलें।');
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    speechSynthesis.speak(utterance);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // STATUS BAR
  // ═══════════════════════════════════════════════════════════════════════

  const StatusBar = () => (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Signal className={`w-4 h-4 ${driver.signalStrength >= 3 ? 'text-green-400' : 'text-yellow-400'}`} />
          <span className="text-xs text-slate-400">{driver.signalStrength}/5</span>
        </div>
        <div className="flex items-center gap-1">
          <Battery className={`w-4 h-4 ${driver.batteryLevel >= 20 ? 'text-green-400' : 'text-red-400'}`} />
          <span className="text-xs text-slate-400">{driver.batteryLevel}%</span>
        </div>
        <div className={`flex items-center gap-1 ${driver.gpsActive ? 'text-green-400' : 'text-red-400'}`}>
          <MapPin className="w-4 h-4" />
          <span className="text-xs">GPS</span>
        </div>
      </div>
      <div className="text-xs text-slate-400">
        {new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      {/* Status Bar */}
      <StatusBar />

      {/* SOS Overlay */}
      {sosActive && (
        <div className="fixed inset-0 z-50 bg-red-900/95 flex flex-col items-center justify-center p-8">
          <AlertTriangle className="w-24 h-24 text-white animate-pulse mb-4" />
          <h1 className="text-4xl font-bold mb-2">EMERGENCY</h1>
          <p className="text-xl mb-8">Sending alert in {sosCountdown} seconds...</p>
          <button
            onClick={cancelSOS}
            className="px-8 py-4 bg-white text-red-900 rounded-full text-xl font-bold"
          >
            CANCEL
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-4 bg-[#1E293B] border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">🙏 नमस्ते, {driver.name.split(' ')[0]}</h1>
            <p className="text-sm text-slate-400">{driver.vehicle}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${driver.currentTrip ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-sm">{driver.currentTrip ? 'On Trip' : 'Available'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        
        {/* Current Trip Card */}
        {driver.currentTrip && (
          <div className="bg-gradient-to-br from-cyan-900/50 to-slate-800 rounded-xl p-4 border border-cyan-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-cyan-400 font-medium">{driver.currentTrip.tripNumber}</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                {driver.currentTrip.status}
              </span>
            </div>
            
            {/* Route */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="w-0.5 h-8 bg-slate-600" />
                <div className="w-3 h-3 rounded-full bg-orange-500" />
              </div>
              <div className="flex-1">
                <div className="mb-2">
                  <p className="font-medium">{driver.currentTrip.pickup.city}</p>
                  <p className="text-xs text-slate-400">{driver.currentTrip.pickup.address}</p>
                </div>
                <div>
                  <p className="font-medium">{driver.currentTrip.delivery.city}</p>
                  <p className="text-xs text-slate-400">{driver.currentTrip.delivery.address}</p>
                </div>
              </div>
            </div>

            {/* Trip Info */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="p-2 bg-slate-800/50 rounded">
                <p className="text-slate-400 text-xs">Distance</p>
                <p className="font-bold">{driver.currentTrip.distance} km</p>
              </div>
              <div className="p-2 bg-slate-800/50 rounded">
                <p className="text-slate-400 text-xs">ETA</p>
                <p className="font-bold">{driver.currentTrip.eta}</p>
              </div>
              <div className="p-2 bg-slate-800/50 rounded">
                <p className="text-slate-400 text-xs">Cargo</p>
                <p className="font-bold text-xs">{driver.currentTrip.cargo}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => window.open(`tel:${driver.currentTrip?.delivery.contact}`)}
            className="flex items-center justify-center gap-2 p-4 bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call Customer</span>
          </button>
          <button 
            onClick={() => {/* Open maps */}}
            className="flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            <Navigation className="w-5 h-5" />
            <span>Navigate</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
            <Camera className="w-6 h-6 text-purple-400" />
            <span className="text-xs">ePOD</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
            <FileText className="w-6 h-6 text-yellow-400" />
            <span className="text-xs">Documents</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
            <Fuel className="w-6 h-6 text-orange-400" />
            <span className="text-xs">Fuel Log</span>
          </button>
        </div>

        {/* Voice Command Result */}
        {voiceText && (
          <div className="p-3 bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-400">You said:</p>
            <p className="text-white">{voiceText}</p>
          </div>
        )}
      </div>

      {/* Bottom Bar - SOS & Voice */}
      <div className="p-4 bg-[#1E293B] border-t border-slate-700">
        <div className="flex items-center justify-between gap-4">
          {/* SOS Button */}
          <button
            onTouchStart={handleSOS}
            onMouseDown={handleSOS}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl font-bold transition-colors"
          >
            <Shield className="w-6 h-6" />
            <span>SOS</span>
          </button>

          {/* Voice Button */}
          <button
            onClick={startVoice}
            disabled={isListening}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-colors ${
              isListening 
                ? 'bg-cyan-600 animate-pulse' 
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            <span>{isListening ? 'सुन रहा हूं...' : 'बोलो'}</span>
          </button>
        </div>

        {/* Trip Status Buttons */}
        {driver.currentTrip && (
          <div className="mt-3 flex gap-2">
            <button className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition-colors">
              At Pickup
            </button>
            <button className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors">
              Start Trip
            </button>
            <button className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium transition-colors">
              At Delivery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
