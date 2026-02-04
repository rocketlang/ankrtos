# ANKR Universe SDK Documentation

**Version:** 2.0.0
**Date:** 19 Jan 2026
**NPM Scope:** `@ankr-universe` | `@ankr`

---

## Overview

The ANKR Universe SDK provides everything you need to integrate ANKR Universe's conversational AI, 350+ MCP tools, intelligent agents (Tasher, VibeCoder, AnkrCode), and SLM-first architecture into your applications.

### ANKR Ecosystem at a Glance

| Category | Count | Examples |
|----------|-------|----------|
| **Published Packages** | 224 | @ankr/eon, @ankr/ai-router, @ankr/voice-ai, @ankr/iam |
| **MCP Tools** | 350+ | GST, UPI, E-Way Bill, Aadhaar, logistics |
| **Intelligent Agents** | 5+ | Tasher, VibeCoder, AnkrCode, Swayam, Saathi |
| **Live Products** | 9 | WowTruck, FreightBox, ankrBFC, bani.ai, ComplyMitra |
| **Supported Languages** | 11 | Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, English |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ANKR UNIVERSE SDK                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   │
│   │   Core      │   │   Voice     │   │   Memory    │   │   Tools     │   │
│   │   Client    │   │   SDK       │   │   SDK       │   │   SDK       │   │
│   │             │   │             │   │             │   │             │   │
│   │ Conversation│   │ STT/TTS    │   │ EON Memory  │   │ 350+ Tools  │   │
│   │ Streaming   │   │ 11 Languages│   │ Learning    │   │ Execution   │   │
│   │ Auth        │   │ Wake Word   │   │ Retrieval   │   │ Playground  │   │
│   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    React / React Native Hooks                        │  │
│   │   useConversation  useVoice  useMemory  useTool  useAnalytics       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Installation

```bash
# Core SDK (required)
npm install @ankr-universe/client

# Voice SDK (optional - for voice features)
npm install @ankr-universe/voice

# React Hooks (optional - for React apps)
npm install @ankr-universe/react

# Full Suite (all packages)
npm install @ankr-universe/full
```

### Basic Usage

```typescript
import { AnkrUniverse } from '@ankr-universe/client';

// Initialize client
const universe = new AnkrUniverse({
  apiKey: 'your-api-key',
  // Optional: customize endpoints
  baseUrl: 'https://universe.ankr.dev',
});

// Send a message
const response = await universe.chat({
  message: 'Calculate GST on ₹1,00,000',
  language: 'hi', // Hindi
});

console.log(response.text);
// "₹1,00,000 पर GST: CGST ₹9,000 + SGST ₹9,000 = कुल ₹18,000 (18% दर पर)"
```

---

## Package Reference

### @ankr-universe/client

The core client for interacting with ANKR Universe API.

#### Installation

```bash
npm install @ankr-universe/client
```

#### Configuration

```typescript
import { AnkrUniverse, AnkrUniverseConfig } from '@ankr-universe/client';

const config: AnkrUniverseConfig = {
  // Required
  apiKey: process.env.ANKR_UNIVERSE_API_KEY,

  // Optional
  baseUrl: 'https://universe.ankr.dev',     // Default API endpoint
  timeout: 30000,                            // Request timeout (ms)
  retries: 3,                                // Retry count

  // SLM Routing (cost optimization)
  routing: {
    preferLocal: true,                       // Try local processing first
    slmEndpoint: 'http://localhost:11434',   // Local Ollama
    fallbackToLLM: true,                     // Fall back to cloud LLM
  },

  // Memory
  memory: {
    enabled: true,                           // Enable memory features
    sessionId: 'user-123',                   // Session identifier
    persistAcrossSessions: true,             // Long-term memory
  },

  // Logging
  debug: process.env.NODE_ENV === 'development',
};

const universe = new AnkrUniverse(config);
```

#### Chat API

```typescript
// Simple chat
const response = await universe.chat({
  message: 'What are my pending invoices?',
});

// Chat with context
const response = await universe.chat({
  message: 'Send reminder to top 3',
  context: {
    previousMessages: [...],
    userProfile: { businessType: 'logistics' },
  },
});

// Streaming response
const stream = universe.chatStream({
  message: 'Explain GST filing process',
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

#### Chat Response Type

```typescript
interface ChatResponse {
  // Core response
  id: string;
  text: string;
  language: 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'or';

  // Intent classification
  intent: {
    name: string;           // e.g., 'gst.calculate'
    confidence: number;     // 0-1
    category: string;       // e.g., 'compliance'
  };

  // Extracted entities
  entities: Array<{
    type: string;           // e.g., 'amount', 'gstin', 'vehicle_number'
    value: string;
    normalized: any;        // Parsed/validated value
    confidence: number;
  }>;

  // Tool execution (if any)
  toolExecution?: {
    toolId: string;
    toolName: string;
    input: Record<string, any>;
    output: any;
    duration: number;
  };

  // Routing info
  routing: {
    tier: 'local' | 'slm' | 'llm';
    cost: number;           // In credits
    latency: number;        // In ms
  };

  // Memory operations
  memory?: {
    stored: boolean;
    retrieved: Array<{ content: string; relevance: number }>;
  };

  // Metadata
  metadata: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

#### Tool Execution

```typescript
// Execute a specific tool
const result = await universe.executeTool({
  toolId: 'gst_calculator',
  input: {
    amount: 100000,
    rate: 18,
    type: 'intra-state',
  },
});

// List available tools
const tools = await universe.listTools({
  category: 'compliance',
  search: 'GST',
});

// Get tool details
const tool = await universe.getTool('gst_calculator');
console.log(tool.schema); // JSON Schema for input
```

#### Memory Operations

```typescript
// Store a memory
await universe.memory.store({
  content: 'User prefers Hindi responses',
  type: 'preference',
  metadata: { category: 'language' },
});

// Search memories
const memories = await universe.memory.search({
  query: 'language preferences',
  limit: 5,
});

// Get conversation history
const history = await universe.memory.getHistory({
  sessionId: 'user-123',
  limit: 50,
});
```

---

### @ankr-universe/voice

Voice SDK for speech-to-text, text-to-speech, and voice-first interactions.

#### Installation

```bash
npm install @ankr-universe/voice
```

#### Configuration

```typescript
import { AnkrVoice, VoiceConfig } from '@ankr-universe/voice';

const voiceConfig: VoiceConfig = {
  // API Configuration
  apiKey: process.env.ANKR_UNIVERSE_API_KEY,

  // Speech-to-Text
  stt: {
    provider: 'sarvam',                      // or 'whisper', 'google'
    language: 'hi-IN',                       // Primary language
    sampleRate: 16000,                       // Audio sample rate
    enablePunctuation: true,
    enableProfanityFilter: false,
  },

  // Text-to-Speech
  tts: {
    provider: 'sarvam',                      // or 'azure', 'google'
    voice: 'hi-IN-female-01',                // Voice ID
    speed: 1.0,                              // Speech rate
    pitch: 1.0,                              // Voice pitch
  },

  // Wake Word Detection
  wakeWord: {
    enabled: true,
    phrase: 'Hey Ankr',                      // Custom wake phrase
    sensitivity: 0.5,                        // 0-1
  },

  // Streaming
  streaming: {
    chunkSize: 4096,                         // Audio chunk size
    vadEnabled: true,                        // Voice Activity Detection
    silenceTimeout: 2000,                    // End of speech timeout (ms)
  },
};

const voice = new AnkrVoice(voiceConfig);
```

#### Speech-to-Text

```typescript
// Transcribe audio file
const transcription = await voice.transcribe({
  audio: fs.readFileSync('audio.wav'),
  format: 'wav',
  language: 'hi-IN',
});

console.log(transcription.text);
// "मुझे आज का GST रिपोर्ट दिखाओ"

// Streaming transcription (real-time)
const stream = voice.transcribeStream({
  language: 'hi-IN',
});

// Pipe audio input
audioInputStream.pipe(stream);

stream.on('partial', (text) => {
  console.log('Partial:', text);
});

stream.on('final', (result) => {
  console.log('Final:', result.text);
  console.log('Confidence:', result.confidence);
});
```

#### Text-to-Speech

```typescript
// Generate speech
const audio = await voice.synthesize({
  text: 'आपका invoice तैयार हो गया है',
  language: 'hi-IN',
  voice: 'hi-IN-female-01',
});

// Save to file
fs.writeFileSync('output.mp3', audio.buffer);

// Streaming synthesis
const audioStream = voice.synthesizeStream({
  text: longText,
  language: 'hi-IN',
});

audioStream.pipe(speakerOutput);
```

#### Voice Conversation

```typescript
// Full voice conversation loop
const conversation = voice.createConversation({
  language: 'hi-IN',
  wakeWordEnabled: true,
});

conversation.on('wakeWord', () => {
  console.log('Wake word detected!');
  playBeep();
});

conversation.on('speechStart', () => {
  console.log('User started speaking...');
});

conversation.on('transcript', async (text) => {
  console.log('User said:', text);

  // Process with ANKR Universe
  const response = await universe.chat({ message: text });

  // Speak response
  await conversation.speak(response.text);
});

conversation.on('error', (error) => {
  console.error('Voice error:', error);
});

// Start listening
conversation.start();
```

#### Supported Languages

```typescript
const SUPPORTED_LANGUAGES = {
  'en-IN': { name: 'English (India)', voices: ['en-IN-male-01', 'en-IN-female-01'] },
  'hi-IN': { name: 'Hindi', voices: ['hi-IN-male-01', 'hi-IN-female-01'] },
  'ta-IN': { name: 'Tamil', voices: ['ta-IN-male-01', 'ta-IN-female-01'] },
  'te-IN': { name: 'Telugu', voices: ['te-IN-male-01', 'te-IN-female-01'] },
  'bn-IN': { name: 'Bengali', voices: ['bn-IN-male-01', 'bn-IN-female-01'] },
  'mr-IN': { name: 'Marathi', voices: ['mr-IN-male-01', 'mr-IN-female-01'] },
  'gu-IN': { name: 'Gujarati', voices: ['gu-IN-male-01', 'gu-IN-female-01'] },
  'kn-IN': { name: 'Kannada', voices: ['kn-IN-male-01', 'kn-IN-female-01'] },
  'ml-IN': { name: 'Malayalam', voices: ['ml-IN-male-01', 'ml-IN-female-01'] },
  'pa-IN': { name: 'Punjabi', voices: ['pa-IN-male-01', 'pa-IN-female-01'] },
  'or-IN': { name: 'Odia', voices: ['or-IN-male-01', 'or-IN-female-01'] },
};
```

---

### @ankr-universe/react

React hooks and components for building ANKR Universe interfaces.

#### Installation

```bash
npm install @ankr-universe/react @ankr-universe/client
```

#### Provider Setup

```tsx
import { AnkrUniverseProvider } from '@ankr-universe/react';

function App() {
  return (
    <AnkrUniverseProvider
      apiKey={process.env.REACT_APP_ANKR_API_KEY}
      config={{
        routing: { preferLocal: true },
        memory: { enabled: true },
      }}
    >
      <YourApp />
    </AnkrUniverseProvider>
  );
}
```

#### useConversation Hook

```tsx
import { useConversation } from '@ankr-universe/react';

function ChatInterface() {
  const {
    messages,
    sendMessage,
    isLoading,
    error,
    clearHistory,
  } = useConversation({
    sessionId: 'user-123',
    language: 'hi',
  });

  const handleSend = async (text: string) => {
    await sendMessage(text);
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id} className={msg.role}>
          {msg.text}
          {msg.toolExecution && (
            <ToolResult result={msg.toolExecution} />
          )}
        </div>
      ))}

      {isLoading && <LoadingIndicator />}
      {error && <ErrorMessage error={error} />}

      <MessageInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
```

#### useVoice Hook

```tsx
import { useVoice } from '@ankr-universe/react';

function VoiceChat() {
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    isSpeaking,
  } = useVoice({
    language: 'hi-IN',
    wakeWord: 'Hey Ankr',
  });

  return (
    <div>
      <button
        onClick={isListening ? stopListening : startListening}
        className={isListening ? 'active' : ''}
      >
        {isListening ? '🎤 Listening...' : '🎙️ Click to speak'}
      </button>

      {transcript && (
        <p className="transcript">{transcript}</p>
      )}

      {isSpeaking && <p>Speaking...</p>}
    </div>
  );
}
```

#### useTool Hook

```tsx
import { useTool } from '@ankr-universe/react';

function GSTCalculator() {
  const {
    execute,
    result,
    isExecuting,
    error,
  } = useTool('gst_calculator');

  const handleCalculate = async (amount: number) => {
    await execute({
      amount,
      rate: 18,
      type: 'intra-state',
    });
  };

  return (
    <div>
      <input
        type="number"
        placeholder="Enter amount"
        onKeyDown={(e) => e.key === 'Enter' && handleCalculate(e.target.value)}
      />

      {isExecuting && <Spinner />}

      {result && (
        <div className="result">
          <p>CGST: ₹{result.cgst}</p>
          <p>SGST: ₹{result.sgst}</p>
          <p>Total: ₹{result.total}</p>
        </div>
      )}
    </div>
  );
}
```

#### useMemory Hook

```tsx
import { useMemory } from '@ankr-universe/react';

function MemoryViewer() {
  const {
    memories,
    search,
    store,
    isLoading,
  } = useMemory({
    sessionId: 'user-123',
  });

  const handleSearch = async (query: string) => {
    await search(query);
  };

  return (
    <div>
      <input
        placeholder="Search memories..."
        onChange={(e) => handleSearch(e.target.value)}
      />

      {memories.map((memory) => (
        <div key={memory.id} className="memory-item">
          <p>{memory.content}</p>
          <span className="relevance">{memory.relevance}%</span>
        </div>
      ))}
    </div>
  );
}
```

#### useAnalytics Hook

```tsx
import { useAnalytics } from '@ankr-universe/react';

function UsageDashboard() {
  const {
    usage,
    costs,
    routing,
    refresh,
  } = useAnalytics({
    period: 'month',
  });

  return (
    <div>
      <h3>Usage This Month</h3>
      <p>Conversations: {usage.conversations}</p>
      <p>Tool Executions: {usage.toolExecutions}</p>
      <p>Voice Minutes: {usage.voiceMinutes}</p>

      <h3>Cost Breakdown</h3>
      <p>Local (FREE): {routing.local}%</p>
      <p>SLM: {routing.slm}%</p>
      <p>LLM: {routing.llm}%</p>
      <p>Total Cost: ₹{costs.total}</p>
      <p>Savings: ₹{costs.savings} (vs pure LLM)</p>
    </div>
  );
}
```

#### Pre-built Components

```tsx
import {
  ChatWindow,
  VoiceButton,
  ToolPlayground,
  ToolCatalog,
  MemoryTimeline,
  CostTracker,
  LanguageSwitcher,
} from '@ankr-universe/react';

function FullApp() {
  return (
    <div className="app">
      <header>
        <LanguageSwitcher />
        <CostTracker />
      </header>

      <main>
        <ChatWindow
          welcomeMessage="नमस्ते! मैं ANKR Universe हूं। आपकी क्या मदद करूं?"
          placeholder="Type or speak..."
          showVoiceButton
          showToolExecutions
        />

        <aside>
          <ToolCatalog
            categories={['compliance', 'logistics', 'banking']}
            onToolSelect={(tool) => console.log('Selected:', tool)}
          />
        </aside>
      </main>
    </div>
  );
}
```

---

### @ankr-universe/tools

Direct access to 350+ ANKR MCP tools.

#### Installation

```bash
npm install @ankr-universe/tools
```

#### Tool Categories

```typescript
import {
  // GST & Compliance (54 tools)
  gstCalculator,
  gstFilingStatus,
  gstInvoiceGenerator,
  eWayBillCreate,
  tdsCalculator,

  // Banking & Payments (28 tools)
  upiPaymentCreate,
  upiPaymentStatus,
  bankAccountVerify,
  ifscLookup,

  // Logistics (35 tools)
  vehicleTrack,
  routeOptimize,
  loadMatch,
  freightQuote,
  podCapture,

  // Government APIs (22 tools)
  aadhaarVerify,
  panVerify,
  gstinValidate,
  rcVerify,
  digilockerFetch,

  // Communication (14 tools)
  whatsappSend,
  smsSend,
  emailSend,
  telegramSend,

  // And more...
} from '@ankr-universe/tools';
```

#### Tool Execution

```typescript
import { gstCalculator, eWayBillCreate } from '@ankr-universe/tools';

// Calculate GST
const gstResult = await gstCalculator.execute({
  amount: 100000,
  rate: 18,
  type: 'intra-state',
});

console.log(gstResult);
// {
//   baseAmount: 100000,
//   cgst: 9000,
//   sgst: 9000,
//   igst: 0,
//   totalGst: 18000,
//   totalAmount: 118000
// }

// Create E-Way Bill
const ewayResult = await eWayBillCreate.execute({
  gstin: '29AABCU9603R1ZM',
  docType: 'INV',
  docNo: 'INV-2026-001',
  docDate: '2026-01-19',
  fromGstin: '29AABCU9603R1ZM',
  toGstin: '27AADCB2230M1ZP',
  vehicleNo: 'MH12AB1234',
  transportMode: 'Road',
  items: [...],
});

console.log(ewayResult.ewayBillNo);
// "331001234567"
```

#### Tool Schema

```typescript
import { getToolSchema, validateToolInput } from '@ankr-universe/tools';

// Get JSON Schema for a tool
const schema = getToolSchema('gst_calculator');
console.log(schema);
// {
//   type: 'object',
//   properties: {
//     amount: { type: 'number', minimum: 0 },
//     rate: { type: 'number', enum: [0, 5, 12, 18, 28] },
//     type: { type: 'string', enum: ['intra-state', 'inter-state'] },
//   },
//   required: ['amount', 'rate'],
// }

// Validate input before execution
const validation = validateToolInput('gst_calculator', {
  amount: 100000,
  rate: 20, // Invalid rate
});

if (!validation.valid) {
  console.error(validation.errors);
  // ["rate must be one of: 0, 5, 12, 18, 28"]
}
```

---

### @ankr-universe/memory

EON Memory SDK for persistent, learning memory.

#### Installation

```bash
npm install @ankr-universe/memory
```

#### Memory Configuration

```typescript
import { AnkrMemory, MemoryConfig } from '@ankr-universe/memory';

const memoryConfig: MemoryConfig = {
  apiKey: process.env.ANKR_UNIVERSE_API_KEY,

  // Memory types
  layers: {
    episodic: true,    // Conversation history
    semantic: true,    // Knowledge and facts
    procedural: true,  // Learned patterns
  },

  // Embedding
  embedding: {
    model: 'multilingual-e5-large',
    dimensions: 1024,
  },

  // Retrieval
  retrieval: {
    topK: 10,
    minRelevance: 0.7,
    hybridSearch: true, // Vector + Full-text
  },

  // Persistence
  persistence: {
    sessionDuration: '30d',
    maxMemories: 10000,
  },
};

const memory = new AnkrMemory(memoryConfig);
```

#### Store Memories

```typescript
// Store conversation memory (episodic)
await memory.storeEpisodic({
  role: 'user',
  content: 'My GSTIN is 29AABCU9603R1ZM',
  timestamp: new Date(),
  sessionId: 'user-123',
});

// Store factual knowledge (semantic)
await memory.storeSemantic({
  content: 'User runs a logistics company in Bangalore',
  source: 'conversation',
  confidence: 0.95,
  metadata: {
    category: 'business-info',
    extractedFrom: 'session-456',
  },
});

// Store learned pattern (procedural)
await memory.storeProcedural({
  trigger: 'morning greeting',
  action: 'show_daily_summary',
  frequency: 15, // Times observed
  lastUsed: new Date(),
});
```

#### Retrieve Memories

```typescript
// Semantic search
const results = await memory.search({
  query: 'What is the user\'s GSTIN?',
  layers: ['episodic', 'semantic'],
  limit: 5,
});

console.log(results);
// [
//   { content: 'My GSTIN is 29AABCU9603R1ZM', relevance: 0.95, layer: 'episodic' },
//   { content: 'User runs a logistics company...', relevance: 0.72, layer: 'semantic' },
// ]

// Get recent context
const context = await memory.getContext({
  sessionId: 'user-123',
  windowSize: 10,
  includeRelevant: true,
});
```

#### Memory Learning

```typescript
// Learn from interaction patterns
await memory.learn({
  observation: {
    intent: 'gst.report',
    time: '09:00',
    frequency: 'daily',
  },
  inference: 'User checks GST reports every morning',
  confidence: 0.85,
});

// Get learned patterns
const patterns = await memory.getPatterns({
  userId: 'user-123',
  minConfidence: 0.7,
});
```

---

## Integration Examples

### Express.js Backend

```typescript
import express from 'express';
import { AnkrUniverse } from '@ankr-universe/client';

const app = express();
const universe = new AnkrUniverse({ apiKey: process.env.ANKR_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, language } = req.body;

    const response = await universe.chat({
      message,
      context: { sessionId },
      language,
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Streaming endpoint
app.get('/api/chat/stream', async (req, res) => {
  const { message } = req.query;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const stream = universe.chatStream({ message });

  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }

  res.end();
});

app.listen(3000);
```

### Next.js API Route

```typescript
// pages/api/chat.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { AnkrUniverse } from '@ankr-universe/client';

const universe = new AnkrUniverse({
  apiKey: process.env.ANKR_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, sessionId } = req.body;

  try {
    const response = await universe.chat({
      message,
      context: { sessionId },
    });

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### React Native

```tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, FlatList } from 'react-native';
import { AnkrUniverse } from '@ankr-universe/client';
import { AnkrVoice } from '@ankr-universe/voice';

const universe = new AnkrUniverse({ apiKey: 'your-api-key' });
const voice = new AnkrVoice({ apiKey: 'your-api-key' });

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  const sendMessage = async (text: string) => {
    // Add user message
    setMessages((prev) => [...prev, { role: 'user', text }]);

    // Get AI response
    const response = await universe.chat({ message: text, language: 'hi' });

    // Add AI message
    setMessages((prev) => [...prev, { role: 'assistant', text: response.text }]);

    // Speak response
    await voice.synthesize({ text: response.text, language: 'hi-IN' });
  };

  const startVoiceInput = async () => {
    setIsListening(true);

    const result = await voice.transcribe({
      language: 'hi-IN',
      duration: 10000, // 10 seconds max
    });

    setIsListening(false);

    if (result.text) {
      setInput(result.text);
      await sendMessage(result.text);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={item.role === 'user' ? styles.userMsg : styles.aiMsg}>
            <Text>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          style={styles.input}
        />
        <Button
          title={isListening ? '🔴' : '🎤'}
          onPress={startVoiceInput}
        />
        <Button
          title="Send"
          onPress={() => sendMessage(input)}
        />
      </View>
    </View>
  );
}
```

### WebSocket Real-time

```typescript
import { AnkrUniverse } from '@ankr-universe/client';

const universe = new AnkrUniverse({ apiKey: 'your-api-key' });

// Connect to real-time updates
const ws = universe.connectWebSocket({
  sessionId: 'user-123',
});

ws.on('connect', () => {
  console.log('Connected to ANKR Universe');
});

ws.on('message', (data) => {
  switch (data.type) {
    case 'response.chunk':
      // Streaming response chunk
      process.stdout.write(data.text);
      break;

    case 'tool.start':
      console.log(`Executing tool: ${data.toolName}`);
      break;

    case 'tool.complete':
      console.log(`Tool result:`, data.result);
      break;

    case 'memory.stored':
      console.log(`Memory stored: ${data.memoryId}`);
      break;

    case 'routing.decision':
      console.log(`Routed to: ${data.tier} (cost: ${data.cost})`);
      break;
  }
});

// Send message
ws.send({
  type: 'chat',
  message: 'Calculate GST on ₹50,000',
  language: 'hi',
});
```

---

## Error Handling

### Error Types

```typescript
import {
  AnkrUniverseError,
  AuthenticationError,
  RateLimitError,
  ToolExecutionError,
  VoiceError,
  MemoryError,
} from '@ankr-universe/client';

try {
  await universe.chat({ message: 'Hello' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Invalid or expired API key
    console.error('Auth failed:', error.message);

  } else if (error instanceof RateLimitError) {
    // Rate limit exceeded
    console.error('Rate limited. Retry after:', error.retryAfter);

  } else if (error instanceof ToolExecutionError) {
    // Tool execution failed
    console.error('Tool failed:', error.toolId, error.message);

  } else if (error instanceof VoiceError) {
    // Voice processing failed
    console.error('Voice error:', error.stage, error.message);

  } else if (error instanceof MemoryError) {
    // Memory operation failed
    console.error('Memory error:', error.operation, error.message);

  } else if (error instanceof AnkrUniverseError) {
    // General error
    console.error('ANKR error:', error.code, error.message);
  }
}
```

### Retry Logic

```typescript
import { withRetry } from '@ankr-universe/client';

const response = await withRetry(
  () => universe.chat({ message: 'Hello' }),
  {
    maxRetries: 3,
    backoff: 'exponential',
    retryOn: [RateLimitError, NetworkError],
  }
);
```

---

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import {
  // Client types
  AnkrUniverseConfig,
  ChatRequest,
  ChatResponse,
  ChatStreamChunk,

  // Tool types
  ToolDefinition,
  ToolInput,
  ToolOutput,
  ToolCategory,

  // Voice types
  VoiceConfig,
  TranscriptionResult,
  SynthesisResult,
  SupportedLanguage,

  // Memory types
  MemoryConfig,
  MemoryEntry,
  MemoryLayer,
  SearchResult,

  // Entity types
  ExtractedEntity,
  EntityType,

  // Intent types
  IntentClassification,
  IntentCategory,

  // Routing types
  RoutingDecision,
  RoutingTier,

} from '@ankr-universe/client';
```

---

## Best Practices

### 1. Cost Optimization

```typescript
// Enable SLM-first routing for cost savings
const universe = new AnkrUniverse({
  apiKey: 'your-key',
  routing: {
    preferLocal: true,           // Try local first (FREE)
    slmEndpoint: 'http://localhost:11434', // Local Ollama
    fallbackToLLM: true,         // Only use LLM when needed
  },
});
```

### 2. Memory Efficiency

```typescript
// Use session-scoped memory for better context
const universe = new AnkrUniverse({
  apiKey: 'your-key',
  memory: {
    enabled: true,
    sessionId: `user-${userId}`,
    windowSize: 10, // Keep last 10 messages in context
  },
});
```

### 3. Voice Best Practices

```typescript
// Configure voice for Indian accents
const voice = new AnkrVoice({
  apiKey: 'your-key',
  stt: {
    provider: 'sarvam', // Best for Indian languages
    language: 'hi-IN',
    enableCodeSwitching: true, // Handle Hindi-English mixing
  },
});
```

### 4. Error Recovery

```typescript
// Implement graceful degradation
const sendMessage = async (text: string) => {
  try {
    return await universe.chat({ message: text });
  } catch (error) {
    if (error instanceof RateLimitError) {
      // Queue for later
      return queueMessage(text, error.retryAfter);
    }
    if (error instanceof ToolExecutionError) {
      // Return without tool result
      return universe.chat({ message: text, disableTools: true });
    }
    throw error;
  }
};
```

---

## Intelligent Agents SDK

### @ankr-universe/tasher

Tasher is the Manus AI-style agentic task completion system. Execute complex multi-step tasks autonomously.

```typescript
import { Tasher } from '@ankr-universe/tasher';

const tasher = new Tasher({
  apiKey: process.env.ANKR_API_KEY,
  agents: ['research', 'calculator', 'document', 'communication', 'memory'],
});

// Execute complex task
const result = await tasher.execute({
  task: 'Create GST invoice for ₹50,000, verify GSTIN, and send via WhatsApp',
  context: {
    customer: { name: 'Ramesh Enterprises', gstin: '29AABCU9603R1ZM' },
    phone: '+919876543210',
  },
});

console.log(result.steps); // All executed steps
console.log(result.output); // Final result
console.log(result.duration); // Time taken
```

### @ankr-universe/vibecoder

VibeCoder - AI-powered development with multi-agent swarm.

```typescript
import { VibeCoder } from '@ankr-universe/vibecoder';

const vibe = new VibeCoder({
  apiKey: process.env.ANKR_API_KEY,
});

// Generate code from description
const code = await vibe.generate({
  description: 'Create a React component for GST calculator with CGST/SGST breakdown',
  language: 'typescript',
  framework: 'react',
});

// Review existing code
const review = await vibe.review({
  code: existingCode,
  aspects: ['security', 'performance', 'best-practices'],
});

// Generate tests
const tests = await vibe.generateTests({
  code: myFunction,
  framework: 'jest',
  coverage: 100,
});
```

### @ankr-universe/swayam

Swayam - Voice AI engine for 11 Indian languages.

```typescript
import { Swayam } from '@ankr-universe/swayam';

const swayam = new Swayam({
  apiKey: process.env.ANKR_API_KEY,
  defaultLanguage: 'hi-IN',
  wakeWord: 'Hey Swayam',
});

// Start voice conversation
swayam.on('wakeWord', async () => {
  const transcript = await swayam.listen({ timeout: 10000 });
  const response = await universe.chat({ message: transcript.text });
  await swayam.speak(response.text);
});

// Multi-language support
const languages = swayam.getSupportedLanguages();
// ['hi-IN', 'en-IN', 'ta-IN', 'te-IN', 'bn-IN', 'mr-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'pa-IN', 'or-IN']
```

---

## Package Categories (224 Packages)

The @ankr scope contains 224 published packages organized into these categories:

| Category | Count | Key Packages |
|----------|-------|--------------|
| **Core/Infra** | 28 | @ankr/iam, @ankr/oauth, @ankr/security, @ankr/config |
| **AI/ML** | 22 | @ankr/ai-router, @ankr/embeddings, @ankr/eon, @ankr/slm-router |
| **Voice** | 12 | @ankr/voice-ai, @ankr/stt, @ankr/tts, @ankr/wake-word |
| **Compliance** | 18 | @ankr/gst, @ankr/tds, @ankr/itr, @ankr/eway |
| **Banking/Payments** | 15 | @ankr/upi, @ankr/razorpay, @ankr/banking, @ankr/neft |
| **Logistics** | 20 | @ankr/fleet, @ankr/routing, @ankr/tracking, @ankr/pod |
| **Government APIs** | 16 | @ankr/aadhaar, @ankr/pan, @ankr/digilocker, @ankr/gstin |
| **Communication** | 14 | @ankr/whatsapp, @ankr/sms, @ankr/email, @ankr/telegram |
| **UI Components** | 25 | @ankr/ui, @ankr/charts, @ankr/forms, @ankr/tables |
| **Database** | 12 | @ankr/prisma, @ankr/pgvector, @ankr/redis, @ankr/timescale |
| **DevTools** | 18 | @ankr/cli, @ankr/publish, @ankr/viewer, @ankr/pulse |
| **Testing** | 10 | @ankr/test-utils, @ankr/mocks, @ankr/fixtures |
| **Mobile** | 14 | @ankr/expo, @ankr/native-ui, @ankr/camera, @ankr/location |
| **Other** | 20 | Various utilities and helpers |

### Installing Packages

```bash
# From local Verdaccio registry (internal)
npm install @ankr/package-name --registry http://localhost:4873

# Search available packages
npm search @ankr --registry http://localhost:4873
```

---

## Live Products Integration

### WowTruck Integration

```typescript
import { WowTruckClient } from '@ankr/wowtruck-client';

const wowtruck = new WowTruckClient({
  apiUrl: 'http://localhost:4000/graphql',
  apiKey: process.env.WOWTRUCK_API_KEY,
});

// Track vehicle
const vehicle = await wowtruck.tracking.getVehicle('MH12AB1234');

// Get trip status
const trip = await wowtruck.trips.getTrip('TRIP-001');
```

### ankrBFC Integration

```typescript
import { BFCClient } from '@ankr/bfc-client';

const bfc = new BFCClient({
  apiUrl: 'http://localhost:4007/graphql',
});

// Credit scoring
const score = await bfc.credit.getScore({ panNumber: 'ABCDE1234F' });

// Invoice factoring
const offer = await bfc.factoring.getOffer({ invoiceId: 'INV-001' });
```

### bani.ai Bot Integration

```typescript
import { BaniBot } from '@ankr/bani';

const bot = new BaniBot({
  platform: 'whatsapp', // or 'telegram', 'web'
  apiKey: process.env.BANI_API_KEY,
});

// Handle incoming message
bot.on('message', async (msg) => {
  const response = await universe.chat({
    message: msg.text,
    context: { userId: msg.from },
  });
  await bot.reply(msg, response.text);
});
```

---

## Changelog

### v2.0.0 (Jan 2026)
- Updated package count to 224 (from 121)
- Added Tasher agentic task completion SDK
- Added VibeCoder AI coding assistant SDK
- Added Swayam voice AI SDK
- Live products integration (WowTruck, BFC, bani.ai)
- Package categories documentation
- Enhanced error handling

### v1.0.0 (Jan 2026)
- Initial release
- Core client with chat, streaming, tools
- Voice SDK with 11 Indian languages
- React hooks and components
- Memory SDK with EON integration
- 350+ tool definitions

---

## Support

- **Documentation:** https://docs.ankr.dev/universe
- **GitHub Issues:** https://github.com/ankr-universe/sdk/issues
- **Discord:** https://discord.gg/ankr-universe
- **Email:** sdk-support@ankr.dev

---

*Built with love in India for the world by the ANKR Team*
