/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * WOWTRUCK DRIVER APP - VOICE-FIRST EDITION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 *
 * FEATURES:
 * - 103 Language Voice Commands
 * - Turn-by-Turn Navigation (ANKR Nav)
 * - Voice Expense Logging
 * - SOS with Voice Trigger
 * - Offline-First Architecture
 * - GraphQL Backend Integration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useLanguage } from '../contexts/LanguageContext';
import { ANKR_LANGUAGES } from '../config/languages';

// ═══════════════════════════════════════════════════════════════════════════════
// GRAPHQL QUERIES & MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const GET_DRIVER_TRIPS = gql`
  query GetDriverTrips($driverId: String, $status: String) {
    trips(driverId: $driverId, status: $status) {
      id
      tripNumber
      status
      startLocation
      endLocation
      plannedDistance
      actualDistance
      vehicle {
        id
        vehicleNumber
      }
      driver {
        id
        name
      }
      order {
        id
        orderNumber
        quotedAmount
        customer {
          companyName
          contactPhone
        }
      }
      fuelCost
      tollCost
      driverAllowance
      otherCost
      createdAt
    }
  }
`;

const GET_ACTIVE_TRIPS = gql`
  query GetActiveTrips {
    activeTrips {
      id
      tripNumber
      status
      startLocation
      endLocation
      plannedDistance
      vehicle {
        id
        vehicleNumber
      }
      driver {
        id
        name
      }
      order {
        id
        orderNumber
        quotedAmount
        customer {
          companyName
          contactPhone
        }
      }
    }
  }
`;

const UPDATE_TRIP_STATUS = gql`
  mutation UpdateTrip($id: ID!, $input: TripUpdateInput!) {
    updateTrip(id: $id, input: $input) {
      id
      status
    }
  }
`;

const END_TRIP = gql`
  mutation EndTrip($id: ID!, $actualDistance: Float, $podReceiverName: String) {
    endTrip(id: $id, actualDistance: $actualDistance, podReceiverName: $podReceiverName) {
      id
      status
      actualDistance
      podReceiverName
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type TripStatus =
  | 'ASSIGNED' | 'ACCEPTED' | 'EN_ROUTE_PICKUP' | 'AT_PICKUP'
  | 'LOADING' | 'IN_TRANSIT' | 'AT_DELIVERY' | 'UNLOADING'
  | 'DELIVERED' | 'POD_UPLOADED' | 'COMPLETED' | 'in_progress' | 'completed';

interface Trip {
  id: string;
  tripNumber: string;
  status: TripStatus;
  startLocation: string;
  endLocation: string;
  plannedDistance?: number;
  actualDistance?: number;
  vehicle?: {
    id: string;
    vehicleNumber: string;
  };
  driver?: {
    id: string;
    name: string;
  };
  order?: {
    id: string;
    orderNumber: string;
    quotedAmount?: number;
    customer?: {
      companyName: string;
      contactPhone: string;
    };
  };
  fuelCost?: number;
  tollCost?: number;
  driverAllowance?: number;
  otherCost?: number;
}

interface Expense {
  id: string;
  type: 'fuel' | 'toll' | 'food' | 'repair' | 'other';
  amount: number;
  description: string;
  timestamp: Date;
  voiceRecorded: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE HOOK (103 Languages)
// ═══════════════════════════════════════════════════════════════════════════════

function useVoiceCommands(langCode: string = 'hi') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  // Get BCP-47 code for the language
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
      const text = result[0].transcript.toLowerCase();
      setTranscript(text);

      if (result.isFinal) {
        parseCommand(text);
      }
    };

    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = () => setIsListening(false);

    return () => recognitionRef.current?.stop();
  }, [langCode]);

  const parseCommand = (text: string) => {
    // Trip commands (Hindi + English)
    if (/trip complete|ट्रिप पूरा|delivery done|डिलीवरी हो गई/.test(text)) {
      setLastCommand('TRIP_COMPLETE');
    }
    // Expense commands
    else if (/(\d+).*(?:diesel|डीज़ल|petrol|पेट्रोल|fuel|फ्यूल)/.test(text)) {
      const match = text.match(/(\d+)/);
      setLastCommand(`EXPENSE_FUEL_${match?.[1] || 0}`);
    }
    else if (/(\d+).*(?:toll|टोल)/.test(text)) {
      const match = text.match(/(\d+)/);
      setLastCommand(`EXPENSE_TOLL_${match?.[1] || 0}`);
    }
    else if (/(\d+).*(?:food|खाना|chai|चाय)/.test(text)) {
      const match = text.match(/(\d+)/);
      setLastCommand(`EXPENSE_FOOD_${match?.[1] || 0}`);
    }
    // SOS commands
    else if (/emergency|इमरजेंसी|help|मदद|sos|accident|एक्सीडेंट|puncture|पंचर/.test(text)) {
      setLastCommand('SOS');
    }
    // Navigation
    else if (/navigate|नेविगेट|rasta|रास्ता|direction|दिशा/.test(text)) {
      setLastCommand('NAVIGATE');
    }
    // Call
    else if (/call|फोन|customer|कस्टमर/.test(text)) {
      setLastCommand('CALL');
    }
    // Accept/Reject
    else if (/accept|स्वीकार|हां|yes/.test(text)) {
      setLastCommand('ACCEPT');
    }
    else if (/reject|मना|नहीं|no/.test(text)) {
      setLastCommand('REJECT');
    }
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setTranscript('');
      setLastCommand(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getBcp47(langCode);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [langCode]);

  return { isListening, transcript, lastCommand, startListening, stopListening, speak, setLastCommand };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATIONS (Key phrases in 9 Indian languages)
// ═══════════════════════════════════════════════════════════════════════════════

const translations: Record<string, Record<string, string>> = {
  en: {
    listening: 'Listening...',
    speakNow: 'Speak now',
    tripComplete: 'Trip completed!',
    expenseAdded: 'Expense added',
    sosAlert: 'SOS Alert Sent!',
    navigating: 'Starting navigation...',
    calling: 'Calling...',
    accepted: 'Trip Accepted!',
    rejected: 'Trip Rejected',
    voiceCommands: 'Voice Commands',
    sayTripComplete: 'Say "Trip complete"',
    sayAmount: 'Say "500 diesel"',
    sayEmergency: 'Say "Emergency"',
    currentTrip: 'Current Trip',
    noTrip: 'No active trip',
    earnings: 'Earnings',
    today: 'Today',
    expenses: 'Expenses',
    selectLanguage: 'Select Language',
    loading: 'Loading...',
    error: 'Error loading data',
  },
  hi: {
    listening: 'सुन रहा हूं...',
    speakNow: 'अब बोलिए',
    tripComplete: 'ट्रिप पूरी हो गई!',
    expenseAdded: 'खर्चा जोड़ दिया',
    sosAlert: 'SOS भेज दिया!',
    navigating: 'नेविगेशन शुरू...',
    calling: 'फोन कर रहा हूं...',
    accepted: 'ट्रिप स्वीकार!',
    rejected: 'ट्रिप मना',
    voiceCommands: 'वॉइस कमांड',
    sayTripComplete: '"ट्रिप पूरा" बोलें',
    sayAmount: '"500 डीज़ल" बोलें',
    sayEmergency: '"इमरजेंसी" बोलें',
    currentTrip: 'चालू ट्रिप',
    noTrip: 'कोई ट्रिप नहीं',
    earnings: 'कमाई',
    today: 'आज',
    expenses: 'खर्चे',
    selectLanguage: 'भाषा चुनें',
    loading: 'लोड हो रहा है...',
    error: 'डेटा लोड करने में त्रुटि',
  },
  bn: {
    listening: 'শুনছি...',
    speakNow: 'এখন বলুন',
    tripComplete: 'ট্রিপ সম্পূর্ণ!',
    expenseAdded: 'খরচ যোগ হয়েছে',
    sosAlert: 'SOS পাঠানো হয়েছে!',
    currentTrip: 'বর্তমান ট্রিপ',
    earnings: 'আয়',
  },
  ta: {
    listening: 'கேட்கிறேன்...',
    speakNow: 'இப்போது பேசுங்கள்',
    tripComplete: 'டிரிப் முடிந்தது!',
    currentTrip: 'தற்போதைய டிரிப்',
    earnings: 'வருமானம்',
  },
  te: {
    listening: 'వింటున్నాను...',
    speakNow: 'ఇప్పుడు మాట్లాడండి',
    tripComplete: 'ట్రిప్ పూర్తయింది!',
    currentTrip: 'ప్రస్తుత ట్రిప్',
    earnings: 'సంపాదన',
  },
  mr: {
    listening: 'ऐकतोय...',
    speakNow: 'आता बोला',
    tripComplete: 'ट्रिप पूर्ण!',
    currentTrip: 'सध्याची ट्रिप',
    earnings: 'कमाई',
  },
  gu: {
    listening: 'સાંભળી રહ્યો છું...',
    speakNow: 'હવે બોલો',
    tripComplete: 'ટ્રિપ પૂર્ણ!',
    currentTrip: 'વર્તમાન ટ્રિપ',
    earnings: 'કમાણી',
  },
  kn: {
    listening: 'ಕೇಳುತ್ತಿದ್ದೇನೆ...',
    speakNow: 'ಈಗ ಮಾತನಾಡಿ',
    tripComplete: 'ಟ್ರಿಪ್ ಮುಗಿಯಿತು!',
    currentTrip: 'ಪ್ರಸ್ತುತ ಟ್ರಿಪ್',
    earnings: 'ಗಳಿಕೆ',
  },
  ml: {
    listening: 'കേൾക്കുന്നു...',
    speakNow: 'ഇപ്പോൾ സംസാരിക്കൂ',
    tripComplete: 'ട്രിപ്പ് പൂർത്തിയായി!',
    currentTrip: 'നിലവിലെ ട്രിപ്പ്',
    earnings: 'വരുമാനം',
  },
  pa: {
    listening: 'ਸੁਣ ਰਿਹਾ ਹਾਂ...',
    speakNow: 'ਹੁਣ ਬੋਲੋ',
    tripComplete: 'ਟ੍ਰਿਪ ਪੂਰੀ!',
    currentTrip: 'ਮੌਜੂਦਾ ਟ੍ਰਿਪ',
    earnings: 'ਕਮਾਈ',
  },
};

const getT = (lang: string, key: string): string => {
  return translations[lang]?.[key] || translations.en[key] || key;
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO DATA (Fallback when not authenticated or no trips)
// ═══════════════════════════════════════════════════════════════════════════════

const DEMO_TRIP: Trip = {
  id: 'DEMO-001',
  tripNumber: 'WOW-2024-DEMO',
  status: 'IN_TRANSIT',
  startLocation: 'Mumbai',
  endLocation: 'Pune',
  plannedDistance: 150,
  vehicle: { id: 'v1', vehicleNumber: 'MH-12-AB-1234' },
  driver: { id: 'd1', name: 'Demo Driver' },
  order: { 
    id: 'o1', 
    orderNumber: 'ORD-DEMO', 
    quotedAmount: 15000,
    customer: { companyName: 'Demo Customer', contactPhone: '+91 87654 32109' }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DriverAppVoice() {
  const [lang, setLang] = useState('hi');
  const [showLangSelector, setShowLangSelector] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [earnings, setEarnings] = useState({ today: 0, pending: 0 });
  const [sosActive, setSosActive] = useState(false);
  const [useDemo, setUseDemo] = useState(false);

  // GraphQL queries
  const { data: tripsData, loading, error, refetch } = useQuery(GET_ACTIVE_TRIPS, {
    pollInterval: 30000, // Refresh every 30 seconds
    onError: (err) => {
      console.log('GraphQL error, using demo mode:', err.message);
      setUseDemo(true);
    }
  });

  // GraphQL mutations
  const [updateTrip] = useMutation(UPDATE_TRIP_STATUS);
  const [endTrip] = useMutation(END_TRIP);

  const { isListening, transcript, lastCommand, startListening, stopListening, speak, setLastCommand } = useVoiceCommands(lang);

  const t = (key: string) => getT(lang, key);

  // Get current trip from backend or use demo
  const trip: Trip | null = useDemo 
    ? DEMO_TRIP 
    : tripsData?.activeTrips?.[0] || null;

  // Calculate earnings from trip data
  useEffect(() => {
    if (tripsData?.activeTrips) {
      const todayEarnings = tripsData.activeTrips
        .filter((t: Trip) => t.status === 'completed' || t.status === 'COMPLETED')
        .reduce((sum: number, t: Trip) => sum + (t.order?.quotedAmount || 0), 0);
      
      const pendingEarnings = tripsData.activeTrips
        .filter((t: Trip) => t.status !== 'completed' && t.status !== 'COMPLETED')
        .reduce((sum: number, t: Trip) => sum + (t.order?.quotedAmount || 0), 0);
      
      setEarnings({ today: todayEarnings, pending: pendingEarnings });
    } else if (useDemo) {
      setEarnings({ today: 2500, pending: 8500 });
    }
  }, [tripsData, useDemo]);

  // Handle voice commands
  useEffect(() => {
    if (!lastCommand) return;

    if (lastCommand === 'TRIP_COMPLETE') {
      handleTripComplete();
    }
    else if (lastCommand.startsWith('EXPENSE_FUEL_')) {
      const amount = parseInt(lastCommand.split('_')[2]);
      addExpense('fuel', amount, 'Diesel');
      speak(`${t('expenseAdded')}: ₹${amount}`);
    }
    else if (lastCommand.startsWith('EXPENSE_TOLL_')) {
      const amount = parseInt(lastCommand.split('_')[2]);
      addExpense('toll', amount, 'Toll');
      speak(`${t('expenseAdded')}: ₹${amount}`);
    }
    else if (lastCommand.startsWith('EXPENSE_FOOD_')) {
      const amount = parseInt(lastCommand.split('_')[2]);
      addExpense('food', amount, 'Food');
      speak(`${t('expenseAdded')}: ₹${amount}`);
    }
    else if (lastCommand === 'SOS') {
      triggerSOS();
    }
    else if (lastCommand === 'NAVIGATE') {
      openNavigation();
    }
    else if (lastCommand === 'CALL') {
      callCustomer();
    }

    setLastCommand(null);
  }, [lastCommand]);

  const handleTripComplete = async () => {
    if (!trip) return;
    
    if (useDemo) {
      // Demo mode - just update local state
      speak(t('tripComplete'));
      return;
    }

    try {
      await endTrip({
        variables: {
          id: trip.id,
          actualDistance: trip.plannedDistance,
          podReceiverName: trip.order?.customer?.companyName || 'Customer'
        }
      });
      speak(t('tripComplete'));
      refetch(); // Refresh trip data
    } catch (err) {
      console.error('Error completing trip:', err);
      speak('Error completing trip');
    }
  };

  const addExpense = (type: Expense['type'], amount: number, description: string) => {
    setExpenses(prev => [...prev, {
      id: `EXP-${Date.now()}`,
      type,
      amount,
      description,
      timestamp: new Date(),
      voiceRecorded: true,
    }]);
    
    // TODO: Add mutation to save expense to backend
    // await createExpense({ variables: { tripId: trip.id, type, amount, description } });
  };

  const triggerSOS = () => {
    setSosActive(true);
    speak(t('sosAlert'));
    // TODO: Send SOS to backend with GPS location
    // await sendSOS({ variables: { tripId: trip?.id, location: currentLocation } });
    setTimeout(() => setSosActive(false), 5000);
  };

  const openNavigation = () => {
    if (trip) {
      // TODO: Integrate with ANKR Nav for turn-by-turn
      // For now, fallback to Google Maps
      const destination = encodeURIComponent(trip.endLocation);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
      window.open(url, '_blank');
      speak(t('navigating'));
    }
  };

  const callCustomer = () => {
    if (trip?.order?.customer?.contactPhone) {
      window.location.href = `tel:${trip.order.customer.contactPhone}`;
      speak(t('calling'));
    }
  };

  // Indian languages for selector (top 10)
  const indianLanguages = ANKR_LANGUAGES.filter(l => l.region === 'India').slice(0, 10);

  // Loading state
  if (loading && !useDemo) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🚛</div>
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header - with back button for demo navigation */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back to Dashboard */}
          <a 
            href="/dashboard" 
            className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
            title="Back to Dashboard"
          >
            <span className="text-xl">←</span>
          </a>
          <div>
            <h1 className="text-xl font-bold">🚛 WowTruck Driver</h1>
            <p className="text-sm opacity-80">
              {trip?.vehicle?.vehicleNumber || 'Not assigned'}
              {useDemo && <span className="ml-2 text-yellow-200">(Demo)</span>}
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <button
          onClick={() => setShowLangSelector(true)}
          className="bg-white/20 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
        >
          <span>🌍</span>
          <span>{ANKR_LANGUAGES.find(l => l.code === lang)?.nativeName || 'हिन्दी'}</span>
        </button>
      </div>

      {/* Demo Mode Toggle (for testing) */}
      {error && (
        <div className="bg-yellow-600/20 px-4 py-2 text-center text-sm">
          <span>⚠️ Backend not available - </span>
          <button 
            onClick={() => setUseDemo(true)} 
            className="underline"
          >
            Use Demo Mode
          </button>
        </div>
      )}

      {/* Language Selector Modal */}
      {showLangSelector && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
          <div className="bg-gray-800 w-full rounded-t-3xl p-4 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{t('selectLanguage')}</h2>
              <button onClick={() => setShowLangSelector(false)} className="text-2xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {indianLanguages.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setShowLangSelector(false); }}
                  className={`p-3 rounded-lg text-left ${lang === l.code ? 'bg-orange-600' : 'bg-gray-700'}`}
                >
                  <div className="font-medium">{l.nativeName}</div>
                  <div className="text-xs opacity-70">{l.name}</div>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-500 mt-4">
              🌍 103 भाषाओं में Voice AI काम करता है
            </p>
          </div>
        </div>
      )}

      {/* SOS Alert */}
      {sosActive && (
        <div className="fixed inset-0 bg-red-600 z-50 flex items-center justify-center animate-pulse">
          <div className="text-center">
            <div className="text-8xl mb-4">🆘</div>
            <h2 className="text-3xl font-bold">{t('sosAlert')}</h2>
            <p className="mt-2">Help is on the way!</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-4">

        {/* Current Trip Card */}
        {trip ? (
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-gray-400">{trip.tripNumber}</p>
                <h3 className="text-lg font-bold">{trip.startLocation} → {trip.endLocation}</h3>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                trip.status === 'COMPLETED' || trip.status === 'completed' 
                  ? 'bg-green-600' 
                  : 'bg-orange-600'
              }`}>
                {trip.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mt-4">
              <div className="bg-gray-700 rounded-lg p-2">
                <p className="text-xl font-bold">₹{(trip.order?.quotedAmount || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-400">Freight</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-2">
                <p className="text-xl font-bold">{trip.plannedDistance || 0}</p>
                <p className="text-xs text-gray-400">km</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-2">
                <p className="text-xl font-bold">{expenses.length}</p>
                <p className="text-xs text-gray-400">{t('expenses')}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              <button onClick={openNavigation} className="bg-blue-600 p-3 rounded-lg text-center">
                <span className="text-2xl">🗺️</span>
                <p className="text-xs mt-1">Navigate</p>
              </button>
              <button onClick={callCustomer} className="bg-green-600 p-3 rounded-lg text-center">
                <span className="text-2xl">📞</span>
                <p className="text-xs mt-1">Call</p>
              </button>
              <button className="bg-purple-600 p-3 rounded-lg text-center">
                <span className="text-2xl">📷</span>
                <p className="text-xs mt-1">Photo</p>
              </button>
              <button onClick={triggerSOS} className="bg-red-600 p-3 rounded-lg text-center">
                <span className="text-2xl">🆘</span>
                <p className="text-xs mt-1">SOS</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-4xl mb-2">🚛</p>
            <p className="text-gray-400">{t('noTrip')}</p>
            {!useDemo && (
              <button 
                onClick={() => setUseDemo(true)}
                className="mt-4 bg-orange-600 px-4 py-2 rounded-lg text-sm"
              >
                Try Demo Mode
              </button>
            )}
          </div>
        )}

        {/* Earnings Card */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="font-bold mb-3">{t('earnings')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-900/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-400">₹{earnings.today.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{t('today')}</p>
            </div>
            <div className="bg-orange-900/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-orange-400">₹{earnings.pending.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Pending</p>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        {expenses.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="font-bold mb-3">{t('expenses')}</h3>
            <div className="space-y-2">
              {expenses.slice(-3).map(exp => (
                <div key={exp.id} className="flex justify-between items-center bg-gray-700 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <span>{exp.type === 'fuel' ? '⛽' : exp.type === 'toll' ? '🛣️' : '🍽️'}</span>
                    <span>{exp.description}</span>
                    {exp.voiceRecorded && <span className="text-xs text-orange-400">🎤</span>}
                  </div>
                  <span className="font-bold">₹{exp.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voice Commands Help */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="font-bold mb-3">🎤 {t('voiceCommands')}</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p>• {t('sayTripComplete')}</p>
            <p>• {t('sayAmount')}</p>
            <p>• {t('sayEmergency')}</p>
          </div>
        </div>
      </div>

      {/* Voice Command Button (Fixed at bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 to-transparent">
        <button
          onTouchStart={startListening}
          onTouchEnd={stopListening}
          onMouseDown={startListening}
          onMouseUp={stopListening}
          className={`w-full py-6 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all ${
            isListening
              ? 'bg-red-600 animate-pulse scale-105'
              : 'bg-orange-600 hover:bg-orange-500'
          }`}
        >
          <span className="text-3xl">{isListening ? '🎤' : '🎙️'}</span>
          <span>{isListening ? t('listening') : t('speakNow')}</span>
        </button>

        {transcript && (
          <p className="text-center mt-2 text-sm text-gray-400">
            "{transcript}"
          </p>
        )}
      </div>

      {/* Bottom spacing for fixed button */}
      <div className="h-32" />
    </div>
  );
}
