/**
 * WhatsApp Admin Dashboard - Monitor all bot conversations
 */

import React, { useState, useEffect } from 'react';

interface Conversation {
  phone: string;
  name: string;
  lastActivity: string;
  messageCount: number;
  lastMessage: string;
  hasPendingBooking: boolean;
}

export default function WhatsAppAdmin() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/whatsapp/conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) {
      console.error('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (phone: string) => {
    try {
      const res = await fetch(`/api/whatsapp/conversations/${encodeURIComponent(phone)}`);
      const data = await res.json();
      setSelectedConv(data);
      setSelectedPhone(phone);
    } catch (e) {
      console.error('Failed to fetch conversation');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <h1 className="text-xl font-bold">📱 WhatsApp Bot Admin</h1>
        <p className="text-sm opacity-80">{conversations.length} active conversations</p>
      </div>

      <div className="flex">
        {/* Conversation List */}
        <div className="w-1/3 bg-white dark:bg-gray-800 border-r dark:border-gray-700 h-[calc(100vh-72px)] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-4xl mb-2">📱</p>
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Test at /whatsapp-demo</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.phone}
                onClick={() => fetchConversation(conv.phone)}
                className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedPhone === conv.phone ? 'bg-green-50 dark:bg-green-900/30' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold dark:text-white">{conv.name}</p>
                    <p className="text-sm text-gray-500">{conv.phone}</p>
                  </div>
                  {conv.hasPendingBooking && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {conv.lastMessage}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(conv.lastActivity).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Conversation Detail */}
        <div className="flex-1 h-[calc(100vh-72px)] flex flex-col">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b dark:border-gray-700">
                <h2 className="font-semibold dark:text-white">{selectedConv.name}</h2>
                <p className="text-sm text-gray-500">{selectedConv.phone}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5] dark:bg-gray-900">
                {selectedConv.messages?.map((msg: any, i: number) => (
                  <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg whitespace-pre-wrap ${
                      msg.from === 'user'
                        ? 'bg-[#dcf8c6] dark:bg-green-800 text-gray-800 dark:text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white'
                    }`}>
                      {msg.text}
                      <p className="text-[10px] text-gray-500 mt-1 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending Booking Info */}
              {selectedConv.pendingBooking && (
                <div className="bg-orange-50 dark:bg-orange-900/30 p-3 border-t">
                  <p className="text-sm font-semibold text-orange-600">⏳ Pending Booking</p>
                  <p className="text-sm">
                    {selectedConv.pendingBooking.origin} → {selectedConv.pendingBooking.destination}
                    ({selectedConv.pendingBooking.weight}T)
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-6xl mb-4">💬</p>
                <p>Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
