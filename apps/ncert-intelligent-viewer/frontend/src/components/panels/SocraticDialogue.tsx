import React, { useState } from 'react';

interface Message {
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

interface SocraticDialogueProps {
  chapter: {
    id: string;
    title: string;
    content: string;
  };
  currentSection: string;
}

// Mock Socratic dialogue - In production, this would be AI-powered
const MOCK_DIALOGUES = [
  {
    concept: 'Ohm\'s Law',
    initialQuestion: 'Before we dive into the formula V = IR, let me ask you: What happens to the brightness of a bulb when you increase the voltage from a battery?',
    responses: [
      {
        userPattern: /bright|increase|more/i,
        aiResponse: 'Good observation! The bulb gets brighter. Now, why do you think that happens? What\'s changing inside the circuit?'
      },
      {
        userPattern: /current|flow|electron/i,
        aiResponse: 'Excellent thinking! More current flows. But why does higher voltage lead to more current? What\'s the relationship?'
      },
      {
        userPattern: /proportion|direct|linear/i,
        aiResponse: 'Brilliant! You\'ve just discovered Ohm\'s Law through reasoning! Voltage and current are directly proportional. This is written as V = IR, where R is resistance. Why do you think we need this "R" factor?'
      }
    ]
  },
  {
    concept: 'Resistance',
    initialQuestion: 'Imagine water flowing through a pipe. Now imagine the same amount of water trying to flow through a narrower pipe. What would happen?',
    responses: [
      {
        userPattern: /slow|less|reduce/i,
        aiResponse: 'Exactly! The water flows slower. This is like electrical resistance. In a wire, what do you think makes it "narrower" for electrons - like that narrow pipe for water?'
      },
      {
        userPattern: /thin|diameter|cross/i,
        aiResponse: 'Great analogy! A thinner wire has more resistance. Now, what about the material itself? Would all materials resist electron flow equally?'
      },
      {
        userPattern: /material|conductor|metal/i,
        aiResponse: 'Perfect! Different materials have different resistivities. Copper is an excellent conductor (low resistance), while rubber is an insulator (very high resistance). Can you think why we use copper for wires and rubber for insulation?'
      }
    ]
  }
];

export default function SocraticDialogue({ chapter, currentSection }: SocraticDialogueProps) {
  const [currentDialogue] = useState(MOCK_DIALOGUES[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: currentDialogue.initialQuestion,
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    setMessages([...messages, userMessage]);
    setUserInput('');
    setIsThinking(true);

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find matching response pattern (in production, this would be actual AI)
    const matchedResponse = currentDialogue.responses.find(r =>
      r.userPattern.test(userInput)
    );

    const aiResponse: Message = {
      role: 'ai',
      content: matchedResponse
        ? matchedResponse.aiResponse
        : 'Interesting thought! Can you elaborate on that? What makes you think that way?',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiResponse]);
    setIsThinking(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h3 className="text-xl font-bold text-white mb-2">🏛️ Socratic Dialogue</h3>
        <p className="text-sm text-gray-400">
          Discover insights through guided questioning - AI never gives direct answers!
        </p>
      </div>

      {/* Current Topic */}
      <div className="px-6 py-3 bg-purple-900/20 border-b border-purple-800/30">
        <div className="text-xs text-purple-400 font-semibold mb-1">EXPLORING CONCEPT</div>
        <div className="text-sm text-white font-medium">{currentDialogue.concept}</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              {/* Message role indicator */}
              <div className={`text-xs font-semibold mb-2 ${
                message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {message.role === 'user' ? '💬 You' : '🤔 Socrates AI'}
              </div>

              {/* Message content */}
              <div className="text-sm leading-relaxed">{message.content}</div>

              {/* Timestamp */}
              <div className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-blue-200' : 'text-gray-600'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* AI Thinking Indicator */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-200 rounded-lg p-4 max-w-[85%]">
              <div className="text-xs font-semibold mb-2 text-gray-500">🤔 Socrates AI</div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex gap-2">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts... (Press Enter to send)"
            className="flex-1 px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded resize-none focus:border-purple-500 focus:outline-none"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isThinking}
            className="px-4 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send →
          </button>
        </div>

        {/* Tips */}
        <div className="mt-3 text-xs text-gray-500">
          💡 Tip: There are no wrong answers. The AI guides you to discover insights through your own reasoning.
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-purple-900/10 border-t border-purple-800/20">
        <div className="text-xs text-purple-400">
          <strong>About Socratic Method:</strong> Named after Greek philosopher Socrates, this teaching method
          uses questions to help students discover knowledge themselves, rather than being told directly.
          It develops critical thinking and deep understanding.
        </div>
      </div>
    </div>
  );
}
