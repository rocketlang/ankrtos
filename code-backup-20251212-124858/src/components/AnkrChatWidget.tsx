/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANKR UNIFIED CHAT WIDGET
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * MERGED FROM:
 * - OmegaChatWidget (personas, suggestions)
 * - FreightExchange bot (voice, TTS)
 * - FloatingBot (floating UI)
 *
 * Features:
 * - 5 Morphing Personas (auto-switch based on page)
 * - Voice Input (mic button)
 * - Text-to-Speech Output
 * - Hindi + English
 * - Real database queries via /api/chat
 *
 * Author: Captain Anil Sharma / ANKR Labs
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX,
  Headphones, Package, Wallet, Truck, HelpCircle, Loader2, Bot
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Persona {
  id: string;
  name: string;
  nameHi: string;
  icon: React.ReactNode;
  emoji: string;
  greeting: string;
  greetingHi: string;
  color: string;
  bgColor: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONAS
// ═══════════════════════════════════════════════════════════════════════════════

const PERSONAS: Record<string, Persona> = {
  freight: {
    id: 'freight',
    name: 'FreightBot',
    nameHi: 'फ्रेट बॉट',
    icon: <Truck className="w-5 h-5" />,
    emoji: '🚛',
    greeting: 'Hi! I can help with loads, trucks, rates, and bidding.',
    greetingHi: 'नमस्ते! 🙏 मैं लोड, ट्रक, रेट और बोली में मदद कर सकता हूं।',
    color: '#f97316',
    bgColor: 'bg-orange-500',
  },
  fleet: {
    id: 'fleet',
    name: 'FleetMaster',
    nameHi: 'फ्लीट मास्टर',
    icon: <Package className="w-5 h-5" />,
    emoji: '📦',
    greeting: 'Hi! I can help with vehicles, drivers, and tracking.',
    greetingHi: 'नमस्ते! मैं वाहन, ड्राइवर और ट्रैकिंग में मदद कर सकता हूं।',
    color: '#3b82f6',
    bgColor: 'bg-blue-500',
  },
  finance: {
    id: 'finance',
    name: 'FinanceBot',
    nameHi: 'फाइनेंस बॉट',
    icon: <Wallet className="w-5 h-5" />,
    emoji: '💰',
    greeting: 'Hi! I can help with invoices, payments, and collections.',
    greetingHi: 'नमस्ते! मैं इनवॉइस, पेमेंट और कलेक्शन में मदद कर सकता हूं।',
    color: '#10b981',
    bgColor: 'bg-emerald-500',
  },
  support: {
    id: 'support',
    name: 'Saathi',
    nameHi: 'साथी',
    icon: <Headphones className="w-5 h-5" />,
    emoji: '🎧',
    greeting: 'Hi! I\'m Saathi, your customer support assistant.',
    greetingHi: 'नमस्ते! मैं साथी हूं, आपका कस्टमर सपोर्ट असिस्टेंट।',
    color: '#8b5cf6',
    bgColor: 'bg-purple-500',
  },
  general: {
    id: 'general',
    name: 'ANKR Assistant',
    nameHi: 'ANKR असिस्टेंट',
    icon: <Bot className="w-5 h-5" />,
    emoji: '🤖',
    greeting: 'Hi! How can I help you today?',
    greetingHi: 'नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूं?',
    color: '#6366f1',
    bgColor: 'bg-indigo-500',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE HOOKS (from FreightExchange)
// ═══════════════════════════════════════════════════════════════════════════════

function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'hi-IN'; // Hindi + English

    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
    };

    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = () => setIsListening(false);

    return () => recognitionRef.current?.stop();
  }, [isSupported]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  }, [isListening]);

  return { isListening, transcript, isSupported, toggleListening, setTranscript };
}

function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.lang = 'hi-IN';
    utteranceRef.current.rate = 0.9;
    utteranceRef.current.onstart = () => setIsSpeaking(true);
    utteranceRef.current.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utteranceRef.current);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface AnkrChatWidgetProps {
  defaultPersona?: keyof typeof PERSONAS;
  autoDetectPersona?: boolean;
  position?: 'bottom-right' | 'bottom-left';
  language?: 'en' | 'hi';
}

export const AnkrChatWidget: React.FC<AnkrChatWidgetProps> = ({
  defaultPersona = 'general',
  autoDetectPersona = true,
  position = 'bottom-right',
  language = 'hi',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<string>(defaultPersona);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice hooks
  const { isListening, transcript, isSupported, toggleListening, setTranscript } = useVoiceInput();
  const { speak, stop, isSpeaking } = useTextToSpeech();

  const persona = PERSONAS[currentPersona] || PERSONAS.general;
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Auto-detect persona from URL
  useEffect(() => {
    if (!autoDetectPersona) return;
    const path = window.location.pathname.toLowerCase();
    if (path.includes('freight') || path.includes('exchange') || path.includes('load')) {
      setCurrentPersona('freight');
    } else if (path.includes('fleet') || path.includes('vehicle') || path.includes('gps')) {
      setCurrentPersona('fleet');
    } else if (path.includes('finance') || path.includes('invoice') || path.includes('payment')) {
      setCurrentPersona('finance');
    } else if (path.includes('support') || path.includes('help') || path.includes('customer')) {
      setCurrentPersona('support');
    }
  }, [autoDetectPersona]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add greeting on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = language === 'hi' ? persona.greetingHi : persona.greeting;
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, persona, language]);

  // Voice transcript → input
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  // Auto-send on voice stop
  useEffect(() => {
    if (!isListening && transcript && transcript.length > 2) {
      const timer = setTimeout(() => {
        sendMessage(transcript);
        setTranscript('');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, transcript]);

  // Send message
  const sendMessage = async (messageOverride?: string) => {
    const userMsg = messageOverride || input;
    if (!userMsg.trim() || isLoading) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          persona: currentPersona,
          language,
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'Sorry, please try again.';

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }]);

      // Speak response if voice was used
      if (voiceEnabled && messageOverride) {
        speak(reply);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Connection error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick actions / suggestions
  const suggestions = [
    language === 'hi' ? 'मुंबई दिल्ली रेट?' : 'Mumbai Delhi rate?',
    language === 'hi' ? 'सर्ज रूट दिखाओ' : 'Show surge routes',
    language === 'hi' ? 'आज के लोड?' : 'Today\'s loads?',
  ];

  const positionClasses = position === 'bottom-right'
    ? 'right-4 bottom-4'
    : 'left-4 bottom-4';

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${positionClasses} z-50 w-14 h-14 rounded-full shadow-lg 
          flex items-center justify-center text-white text-2xl
          hover:scale-110 transition-all duration-200 group`}
        style={{ backgroundColor: persona.color }}
        title={`Chat with ${persona.name}`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <span className="text-2xl">{persona.emoji}</span>
        )}
        {/* Pulse indicator when speaking */}
        {isSpeaking && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed ${positionClasses} z-40 mb-16 w-80 sm:w-96 
            bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
            flex flex-col overflow-hidden`}
          style={{ maxHeight: '500px' }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 text-white flex items-center gap-2"
            style={{ backgroundColor: persona.color }}
          >
            <span className="text-xl">{persona.emoji}</span>
            <div className="flex-1">
              <div className="font-semibold text-sm">{language === 'hi' ? persona.nameHi : persona.name}</div>
              <div className="text-xs opacity-80">AI Assistant</div>
            </div>
            
            {/* Voice toggle */}
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30"
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            
            {/* Persona switcher */}
            <select
              value={currentPersona}
              onChange={(e) => setCurrentPersona(e.target.value)}
              className="text-xs bg-white/20 border-none rounded px-1 py-0.5 text-white"
            >
              {Object.values(PERSONAS).map(p => (
                <option key={p.id} value={p.id} className="text-gray-800">
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[300px] bg-gray-50 dark:bg-gray-900">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      : 'text-white'
                  }`}
                  style={msg.role === 'assistant' ? { backgroundColor: persona.color } : {}}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-wrap">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 
                    hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex gap-2">
              {/* Mic button */}
              {isSupported && (
                <button
                  onClick={toggleListening}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
              
              {/* Text input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={language === 'hi' ? 'मैसेज टाइप करें...' : 'Type a message...'}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
                  bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
                  focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ '--tw-ring-color': persona.color } as any}
                disabled={isLoading}
              />
              
              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium
                  disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: persona.color }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Listening indicator */}
            {isListening && (
              <div className="mt-2 text-xs text-center text-red-500 animate-pulse">
                🎤 Listening... (speak in Hindi or English)
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AnkrChatWidget;
