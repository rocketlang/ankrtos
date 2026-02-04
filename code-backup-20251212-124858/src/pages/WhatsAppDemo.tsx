/**
 * WhatsApp Demo - Test the freight bot without actual WhatsApp
 * Looks exactly like WhatsApp!
 */

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  from: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function WhatsAppDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      from: 'bot',
      text: `🚛 *WowTruck WhatsApp Bot*

नमस्ते! मैं आपका freight assistant हूं।

कुछ भी पूछें:
- "Mumbai Delhi 20 ton"
- "Chennai Bangalore भाड़ा"
- "Help"

103 भाषाओं में बात करें! 🌍`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      from: 'user',
      text: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          phone: '+919876543210',
          name: 'Demo User'
        }),
      });
      const data = await res.json();

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        from: 'bot',
        text: data.reply || '❌ Error processing message',
        timestamp: new Date(),
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        from: 'bot',
        text: '❌ Connection error. Backend not running?\n\nStart with: cd apps/wowtruck/backend && npm run dev',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickReplies = [
    { text: 'Mumbai Delhi 20 ton', emoji: '🚛' },
    { text: 'Chennai Bangalore 15 ton', emoji: '📦' },
    { text: 'Available trucks Pune', emoji: '🔍' },
    { text: 'Book', emoji: '✅' },
    { text: 'Help', emoji: '❓' },
    { text: 'track WOW-123456', emoji: '📍' },
  ];

  return (
    <div className="min-h-screen bg-[#111b21] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0b141a] rounded-2xl overflow-hidden shadow-2xl">
        {/* WhatsApp Header */}
        <div className="bg-[#202c33] p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-xl">
            🚛
          </div>
          <div className="flex-1">
            <h1 className="text-white font-semibold">WowTruck Bot</h1>
            <p className="text-green-400 text-xs flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Online • 103 languages
            </p>
          </div>
          <div className="flex gap-4 text-gray-400">
            <span>📹</span>
            <span>📞</span>
            <span>⋮</span>
          </div>
        </div>

        {/* Messages */}
        <div 
          className="h-[400px] overflow-y-auto p-3 space-y-2"
          style={{ 
            backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA...")`,
            backgroundColor: '#0b141a'
          }}
        >
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-2 px-3 rounded-lg shadow ${
                msg.from === 'user' 
                  ? 'bg-[#005c4b] text-white rounded-tr-none' 
                  : 'bg-[#202c33] text-white rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                <p className="text-[10px] text-gray-400 mt-1 text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.from === 'user' && ' ✓✓'}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#202c33] p-2 px-4 rounded-lg">
                <span className="text-gray-400 text-sm">typing</span>
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        <div className="bg-[#202c33] p-2 flex gap-2 overflow-x-auto">
          {quickReplies.map((qr, i) => (
            <button
              key={i}
              onClick={() => setInput(qr.text)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#0b141a] text-white rounded-full text-xs whitespace-nowrap border border-gray-600 hover:border-green-500 transition"
            >
              <span>{qr.emoji}</span>
              <span>{qr.text}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="bg-[#202c33] p-2 flex items-center gap-2">
          <button className="text-gray-400 text-xl p-2">😊</button>
          <button className="text-gray-400 text-xl p-2">📎</button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message"
            className="flex-1 bg-[#2a3942] text-white px-4 py-2 rounded-full text-sm focus:outline-none"
          />
          {input.trim() ? (
            <button
              onClick={sendMessage}
              disabled={loading}
              className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white disabled:opacity-50"
            >
              ➤
            </button>
          ) : (
            <button className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white">
              🎤
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#111b21] p-2 text-center">
          <p className="text-gray-500 text-xs">
            🔒 Demo Mode • Real WhatsApp: +91-XXXX-XXXXXX
          </p>
        </div>
      </div>
    </div>
  );
}
