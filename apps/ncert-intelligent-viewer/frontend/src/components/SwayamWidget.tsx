import React, { useState, useEffect, useRef } from 'react';

interface SwayamMessage {
  type: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  language?: string;
}

interface SwayamWidgetProps {
  chapterId?: string;
  chapterTitle?: string;
}

export default function SwayamWidget({ chapterId, chapterTitle }: SwayamWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<SwayamMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState<string>('en');
  const [isRecording, setIsRecording] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string>(`session_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connection
  useEffect(() => {
    if (!isOpen) return;

    // Use local test server for now (port 7778)
    // Production: wss://swayam.digimitra.guru/swayam
    const wsUrl = window.location.hostname === 'localhost'
      ? 'ws://localhost:7778'
      : 'wss://swayam.digimitra.guru/swayam';

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);

      // Join session with context
      const joinMessage = {
        type: 'join',
        sessionId: sessionIdRef.current,
        userId: `ncert_user_${Date.now()}`,
        language: language,
        persona: 'swayam',
        context: chapterId ? {
          platform: 'ncert-intelligent-viewer',
          chapter: chapterId,
          title: chapterTitle,
        } : undefined,
      };

      ws.send(JSON.stringify(joinMessage));

      // Welcome message
      setMessages([
        {
          type: 'system',
          text: `नमस्ते! I'm SWAYAM, your AI learning companion. ${
            chapterTitle ? `I can help you with "${chapterTitle}".` : 'How can I help you today?'
          }`,
          timestamp: new Date(),
        },
      ]);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'text' || data.type === 'response') {
          setMessages((prev) => [
            ...prev,
            {
              type: 'bot',
              text: data.text || data.message,
              timestamp: new Date(),
              language: data.language,
            },
          ]);
        } else if (data.type === 'audio') {
          // Handle TTS audio playback
          const audio = new Audio(data.audioUrl);
          audio.play();
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setMessages((prev) => [
        ...prev,
        {
          type: 'system',
          text: 'Connection error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [isOpen, chapterId, chapterTitle, language]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        type: 'user',
        text: inputText,
        timestamp: new Date(),
      },
    ]);

    // Send to SWAYAM
    wsRef.current.send(
      JSON.stringify({
        type: 'text',
        text: inputText,
        language: language,
      })
    );

    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      // Start voice recording
      setIsRecording(true);
      // TODO: Implement voice recording with Web Speech API
      alert('Voice recording coming soon! Use text for now.');
      setIsRecording(false);
    } else {
      setIsRecording(false);
    }
  };

  const languages = [
    { code: 'en', name: 'English', emoji: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', emoji: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', emoji: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', emoji: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', emoji: '🇮🇳' },
    { code: 'mr', name: 'मराठी', emoji: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', emoji: '🇮🇳' },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-lg transition-all transform hover:scale-110 ${
          isOpen
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
        }`}
        aria-label="Toggle SWAYAM Assistant"
      >
        {isOpen ? (
          <svg className="w-8 h-8 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="text-center">
            <div className="text-2xl">🤖</div>
            {isConnected && (
              <div className="absolute top-1 right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🤖</div>
              <div>
                <h3 className="text-white font-bold">SWAYAM AI</h3>
                <p className="text-blue-100 text-xs">
                  {isConnected ? '● Connected' : '○ Connecting...'}
                </p>
              </div>
            </div>

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white/20 text-white text-sm rounded px-2 py-1 border-0 focus:ring-2 focus:ring-white/50"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-gray-800">
                  {lang.emoji} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Context Badge */}
          {chapterTitle && (
            <div className="bg-blue-600/10 border-b border-blue-500/20 px-4 py-2">
              <p className="text-blue-400 text-xs">
                📚 Context: <span className="font-semibold">{chapterTitle}</span>
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.type === 'bot'
                      ? 'bg-gray-800 text-gray-100'
                      : 'bg-gray-700/50 text-gray-400 text-sm italic'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask in ${languages.find((l) => l.code === language)?.name || 'English'}...`}
                className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isConnected}
              />

              {/* Voice Button */}
              <button
                onClick={toggleRecording}
                className={`p-2 rounded-lg transition-colors ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                }`}
                disabled={!isConnected}
                aria-label="Voice input"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>

              {/* Send Button */}
              <button
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isConnected || !inputText.trim()}
                aria-label="Send message"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setInputText('Explain this chapter in simple terms')}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full border border-gray-700"
              >
                💡 Explain chapter
              </button>
              <button
                onClick={() => setInputText('Give me practice questions')}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full border border-gray-700"
              >
                📝 Practice questions
              </button>
              <button
                onClick={() => setInputText('What are the key concepts?')}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full border border-gray-700"
              >
                🎯 Key concepts
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
