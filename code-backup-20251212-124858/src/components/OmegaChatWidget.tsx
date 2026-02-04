/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANKR OMEGA - Chat Widget Component
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Embeddable chat widget for WowTruck 2.0 Dashboard
 * Connects to ANKR Omega Multi-Persona AI Engine
 * 
 * Features:
 * - Three persona modes (Customer Care, Operations, Finance)
 * - Hindi + English support
 * - Real-time conversation
 * - Suggestions and quick actions
 * 
 * Author: Captain Anil Sharma / ANKR Labs
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Headphones, 
  Package, 
  Wallet, 
  Loader2,
  ChevronDown,
  Bot
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  persona?: {
    id: string;
    name: string;
    icon: string;
  };
  data?: Record<string, any>[];
  suggestions?: string[];
}

interface Persona {
  id: string;
  name: string;
  icon: string;
  role: string;
  color: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const OMEGA_API_URL = import.meta.env.VITE_OMEGA_URL || 'http://localhost:4200';

const PERSONAS: Persona[] = [
  { 
    id: 'customer-care', 
    name: 'Saathi', 
    icon: '🎧', 
    role: 'Customer Care',
    color: 'bg-green-500'
  },
  { 
    id: 'operations', 
    name: 'FleetMaster', 
    icon: '📦', 
    role: 'Operations',
    color: 'bg-blue-500'
  },
  { 
    id: 'finance', 
    name: 'FinanceGuru', 
    icon: '💰', 
    role: 'Finance',
    color: 'bg-purple-500'
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const OmegaChatWidget: React.FC = () => {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<Persona>(PERSONAS[0]);
  const [showPersonaSelect, setShowPersonaSelect] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Namaste! I'm ${currentPersona.name}, your WowTruck ${currentPersona.role} assistant. How can I help you today?`,
        timestamp: new Date(),
        persona: currentPersona,
        suggestions: currentPersona.id === 'customer-care' 
          ? ['Track my shipment', 'Delivery status', 'Rate inquiry']
          : currentPersona.id === 'operations'
          ? ['Available vehicles', 'Driver status', 'Active trips']
          : ['Pending invoices', 'Payment status', 'Outstanding amount']
      }]);
    }
  }, [isOpen, currentPersona]);
  
  // Send message to Omega
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const response = await fetch(`${OMEGA_API_URL}/api/omega/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          personaId: currentPersona.id,
          sessionId,
          language: 'en', // Auto-detect in backend
        }),
      });
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        persona: data.persona || currentPersona,
        data: data.data,
        suggestions: data.suggestions,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Omega API Error:', error);
      
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again or contact support.',
        timestamp: new Date(),
        persona: currentPersona,
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle suggestion click
  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };
  
  // Handle persona change
  const changePersona = (persona: Persona) => {
    setCurrentPersona(persona);
    setShowPersonaSelect(false);
    setMessages(prev => [...prev, {
      id: `system-${Date.now()}`,
      role: 'system',
      content: `Switched to ${persona.name} (${persona.role})`,
      timestamp: new Date(),
    }, {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: `Hi! I'm ${persona.name}. How can I help you with ${persona.role.toLowerCase()}?`,
      timestamp: new Date(),
      persona,
    }]);
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };
  
  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════
  
  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 z-50
          w-16 h-16 rounded-full shadow-lg
          flex items-center justify-center
          transition-all duration-300 transform hover:scale-110
          ${isOpen ? 'bg-red-500 rotate-90' : currentPersona.color}
        `}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white" />
        )}
      </button>
      
      {/* Chat Window */}
      {isOpen && (
        <div className="
          fixed bottom-24 right-6 z-50
          w-96 h-[500px]
          bg-white rounded-2xl shadow-2xl
          flex flex-col overflow-hidden
          border border-gray-200
        ">
          {/* Header */}
          <div className={`
            ${currentPersona.color}
            px-4 py-3 flex items-center justify-between
          `}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentPersona.icon}</span>
              <div>
                <h3 className="font-bold text-white">{currentPersona.name}</h3>
                <p className="text-xs text-white/80">{currentPersona.role}</p>
              </div>
            </div>
            
            {/* Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaSelect(!showPersonaSelect)}
                className="text-white/80 hover:text-white p-1 rounded"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              
              {showPersonaSelect && (
                <div className="
                  absolute right-0 top-full mt-2
                  bg-white rounded-lg shadow-lg
                  min-w-[180px] py-2
                  border border-gray-100
                ">
                  {PERSONAS.map(persona => (
                    <button
                      key={persona.id}
                      onClick={() => changePersona(persona)}
                      className={`
                        w-full px-4 py-2 flex items-center gap-3
                        hover:bg-gray-50 transition-colors
                        ${persona.id === currentPersona.id ? 'bg-gray-100' : ''}
                      `}
                    >
                      <span className="text-xl">{persona.icon}</span>
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{persona.name}</p>
                        <p className="text-xs text-gray-500">{persona.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'system' ? (
                  <div className="text-center text-xs text-gray-400 w-full">
                    {msg.content}
                  </div>
                ) : (
                  <div className={`
                    max-w-[85%] rounded-2xl px-4 py-2
                    ${msg.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                    }
                  `}>
                    {msg.role === 'assistant' && msg.persona && (
                      <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                        <span>{msg.persona.icon}</span>
                        <span>{msg.persona.name}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    
                    {/* Suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestion(suggestion)}
                            className="
                              text-xs px-3 py-1 rounded-full
                              bg-gray-100 text-gray-600
                              hover:bg-gray-200 transition-colors
                            "
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Data Table Preview */}
                    {msg.data && msg.data.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                        <p className="font-medium mb-1">{msg.data.length} records found</p>
                        {/* Mini preview */}
                        {msg.data.slice(0, 2).map((row, idx) => (
                          <div key={idx} className="truncate">
                            {Object.entries(row).slice(0, 3).map(([k, v]) => (
                              <span key={k} className="mr-2">{k}: {String(v)}</span>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Hindi/English)"
                className="
                  flex-1 px-4 py-2 rounded-full
                  border border-gray-200 focus:border-blue-500
                  outline-none transition-colors
                  text-sm
                "
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-colors
                  ${inputValue.trim() && !isLoading
                    ? `${currentPersona.color} text-white`
                    : 'bg-gray-200 text-gray-400'
                  }
                `}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => sendMessage('help')}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Need help?
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => sendMessage('मदद चाहिए')}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                हिंदी में बात करें
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OmegaChatWidget;
