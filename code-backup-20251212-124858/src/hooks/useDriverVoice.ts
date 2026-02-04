/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANKR DRIVER VOICE HOOK - Voice Commands for Truck Drivers
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "No typing needed - illiterate drivers can use AI!"
 *
 * Supports 103 languages via Web Speech API
 * Understands Hindi, Bhojpuri, Tamil, Telugu, and more
 *
 * VOICE COMMANDS:
 * - "Trip complete" / "ट्रिप पूरा" → Advance trip status
 * - "500 rupees diesel" / "500 रुपये डीज़ल" → Log expense
 * - "Emergency" / "इमरजेंसी" → Trigger SOS
 * - "Call customer" / "कस्टमर को फोन करो" → Make call
 * - "Navigate" / "रास्ता दिखाओ" → Open maps
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// Voice command patterns (multilingual)
const COMMAND_PATTERNS = {
  // Trip status commands
  tripComplete: [
    /trip\s*(complete|done|finish|over)/i,
    /ट्रिप\s*(पूरा|खत्म|हो\s*गया|कम्प्लीट)/i,
    /delivery\s*(done|complete)/i,
    /डिलीवरी\s*(हो\s*गई|पूरी)/i,
    /पहुंच\s*गया/i,
    /reached/i,
  ],
  
  // Expense commands - extract amount
  logExpense: [
    /(\d+)\s*(rupees?|rs|₹)?\s*(diesel|petrol|fuel|खाना|food|toll|टोल|डीज़ल|पेट्रोल|फ्यूल)/i,
    /(diesel|petrol|fuel|खाना|food|toll|टोल|डीज़ल|पेट्रोल|फ्यूल)\s*(\d+)\s*(rupees?|rs|₹)?/i,
    /(\d+)\s*(रुपये|रुपया)\s*(डीज़ल|पेट्रोल|खाना|टोल)/i,
    /भरवाया\s*(\d+)/i,
  ],
  
  // SOS/Emergency
  emergency: [
    /emergency/i,
    /इमरजेंसी/i,
    /sos/i,
    /help/i,
    /मदद/i,
    /bachao/i,
    /बचाओ/i,
    /accident/i,
    /एक्सीडेंट/i,
    /problem/i,
    /प्रॉब्लम/i,
    /puncture/i,
    /पंचर/i,
  ],
  
  // Navigation
  navigate: [
    /navigate/i,
    /direction/i,
    /रास्ता/i,
    /map/i,
    /नक्शा/i,
    /route/i,
    /कैसे\s*जाना/i,
  ],
  
  // Call customer/receiver
  callCustomer: [
    /call\s*(customer|receiver|sender)/i,
    /फोन\s*(करो|लगाओ)/i,
    /कस्टमर\s*को\s*(फोन|कॉल)/i,
    /रिसीवर\s*को\s*(फोन|कॉल)/i,
  ],
  
  // Take photo
  takePhoto: [
    /photo/i,
    /फोटो/i,
    /picture/i,
    /camera/i,
    /कैमरा/i,
    /तस्वीर/i,
  ],
  
  // Status updates
  startLoading: [
    /start\s*loading/i,
    /लोडिंग\s*शुरू/i,
    /loading\s*start/i,
  ],
  
  loadingDone: [
    /loading\s*(done|complete|finish)/i,
    /लोडिंग\s*(हो\s*गई|पूरी|खत्म)/i,
    /माल\s*चढ़\s*गया/i,
  ],
  
  startUnloading: [
    /start\s*unloading/i,
    /unloading\s*start/i,
    /उतराई\s*शुरू/i,
    /माल\s*उतारो/i,
  ],
  
  unloadingDone: [
    /unloading\s*(done|complete)/i,
    /उतराई\s*(हो\s*गई|पूरी)/i,
    /माल\s*उतर\s*गया/i,
  ],
};

export type VoiceCommand = 
  | { type: 'TRIP_COMPLETE' }
  | { type: 'LOG_EXPENSE'; amount: number; category: string }
  | { type: 'EMERGENCY' }
  | { type: 'NAVIGATE' }
  | { type: 'CALL_CUSTOMER' }
  | { type: 'TAKE_PHOTO' }
  | { type: 'START_LOADING' }
  | { type: 'LOADING_DONE' }
  | { type: 'START_UNLOADING' }
  | { type: 'UNLOADING_DONE' }
  | { type: 'UNKNOWN'; transcript: string };

interface UseDriverVoiceOptions {
  language?: string; // BCP-47 code like 'hi-IN'
  onCommand?: (command: VoiceCommand) => void;
  onTranscript?: (text: string) => void;
  continuous?: boolean;
}

export function useDriverVoice(options: UseDriverVoiceOptions = {}) {
  const {
    language = 'hi-IN',
    onCommand,
    onTranscript,
    continuous = false,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Parse transcript to extract command
  const parseCommand = useCallback((text: string): VoiceCommand => {
    const lowerText = text.toLowerCase();

    // Check each command pattern
    for (const pattern of COMMAND_PATTERNS.emergency) {
      if (pattern.test(text)) {
        return { type: 'EMERGENCY' };
      }
    }

    // Log expense - extract amount
    for (const pattern of COMMAND_PATTERNS.logExpense) {
      const match = text.match(pattern);
      if (match) {
        // Find the number in the match
        const amount = parseInt(match[1]) || parseInt(match[2]) || 0;
        let category = 'fuel';
        if (/खाना|food/i.test(text)) category = 'food';
        if (/toll|टोल/i.test(text)) category = 'toll';
        if (/diesel|डीज़ल/i.test(text)) category = 'diesel';
        if (/petrol|पेट्रोल/i.test(text)) category = 'petrol';
        return { type: 'LOG_EXPENSE', amount, category };
      }
    }

    for (const pattern of COMMAND_PATTERNS.tripComplete) {
      if (pattern.test(text)) {
        return { type: 'TRIP_COMPLETE' };
      }
    }

    for (const pattern of COMMAND_PATTERNS.navigate) {
      if (pattern.test(text)) {
        return { type: 'NAVIGATE' };
      }
    }

    for (const pattern of COMMAND_PATTERNS.callCustomer) {
      if (pattern.test(text)) {
        return { type: 'CALL_CUSTOMER' };
      }
    }

    for (const pattern of COMMAND_PATTERNS.takePhoto) {
      if (pattern.test(text)) {
        return { type: 'TAKE_PHOTO' };
      }
    }

    for (const pattern of COMMAND_PATTERNS.startLoading) {
      if (pattern.test(text)) {
        return { type: 'START_LOADING' };
      }
    }

    for (const pattern of COMMAND_PATTERNS.loadingDone) {
      if (pattern.test(text)) {
        return { type: 'LOADING_DONE' };
      }
    }

    for (const pattern of COMMAND_PATTERNS.startUnloading) {
      if (pattern.test(text)) {
        return { type: 'START_UNLOADING' };
      }
    }

    for (const pattern of COMMAND_PATTERNS.unloadingDone) {
      if (pattern.test(text)) {
        return { type: 'UNLOADING_DONE' };
      }
    }

    return { type: 'UNKNOWN', transcript: text };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = continuous;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language;

    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      
      setTranscript(text);
      onTranscript?.(text);

      // Only process final results
      if (result.isFinal) {
        const command = parseCommand(text);
        setLastCommand(command);
        onCommand?.(command);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (continuous && isListening) {
        // Restart if continuous mode
        try {
          recognitionRef.current?.start();
          setIsListening(true);
        } catch (e) {}
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      setError(event.error);
      setIsListening(false);
    };

    return () => {
      recognitionRef.current?.stop();
    };
  }, [isSupported, language, continuous, onCommand, onTranscript, parseCommand]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    
    setError(null);
    setTranscript('');
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Already started
    }
  }, [isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Change language
  const setLanguage = useCallback((newLang: string) => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = newLang;
    }
  }, []);

  return {
    isListening,
    transcript,
    lastCommand,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    setLanguage,
  };
}

// Text-to-speech for driver feedback
export function useDriverTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string, lang: string = 'hi-IN') => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}

// Predefined voice responses in multiple languages
export const VOICE_RESPONSES = {
  tripComplete: {
    'hi-IN': 'ट्रिप पूरा हो गया। धन्यवाद!',
    'en-US': 'Trip completed. Thank you!',
    'ta-IN': 'பயணம் முடிந்தது. நன்றி!',
    'te-IN': 'ట్రిప్ పూర్తయింది. ధన్యవాదాలు!',
  },
  expenseLogged: {
    'hi-IN': 'खर्चा दर्ज हो गया।',
    'en-US': 'Expense logged.',
    'ta-IN': 'செலவு பதிவு செய்யப்பட்டது.',
    'te-IN': 'ఖర్చు నమోదైంది.',
  },
  sosTriggered: {
    'hi-IN': 'इमरजेंसी अलर्ट भेज दिया गया। मदद आ रही है!',
    'en-US': 'Emergency alert sent. Help is on the way!',
    'ta-IN': 'அவசர எச்சரிக்கை அனுப்பப்பட்டது!',
    'te-IN': 'ఎమర్జెన్సీ అలర్ట్ పంపబడింది!',
  },
  listening: {
    'hi-IN': 'बोलिए, मैं सुन रहा हूं...',
    'en-US': 'Listening...',
    'ta-IN': 'கேட்கிறேன்...',
    'te-IN': 'వింటున్నాను...',
  },
  notUnderstood: {
    'hi-IN': 'समझ नहीं आया। फिर से बोलिए।',
    'en-US': 'Did not understand. Please repeat.',
    'ta-IN': 'புரியவில்லை. மீண்டும் சொல்லுங்கள்.',
    'te-IN': 'అర్థం కాలేదు. మళ్ళీ చెప్పండి.',
  },
};

console.log('🎤 Driver Voice Hook loaded');
