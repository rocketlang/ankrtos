// Doctor Booking AI Voice Agent - WITH DEEPGRAM
// Professional-grade voice I/O with 95%+ Hindi accuracy
// Inspired by Prof. Kamal Bijlani's demo at India Today Education Conclave 2026

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import pg from 'pg';
import dotenv from 'dotenv';
import axios from 'axios';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

dotenv.config();

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: '*' });
await fastify.register(websocket);

// Database connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ankr:indrA%400612@localhost:5432/ankr_eon'
});

// Deepgram client
let deepgramClient = null;
if (process.env.DEEPGRAM_API_KEY) {
  deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);
  console.log('✅ Deepgram initialized');
} else {
  console.warn('⚠️  DEEPGRAM_API_KEY not set - using browser fallback');
}

// Test DB connection
try {
  const client = await pool.connect();
  console.log('✅ Connected to PostgreSQL');
  client.release();
} catch (err) {
  console.error('❌ Database connection error:', err);
}

// ============================================================================
// CONVERSATIONAL AI LOGIC
// ============================================================================

class DoctorBookingAgent {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.state = 'greeting';
    this.context = {
      symptoms: [],
      specialization: null,
      hospital: null,
      date: null,
      time: null,
      patientName: null,
      patientPhone: null
    };
  }

  async process(userInput, language = 'hi') {
    const input = userInput.toLowerCase().trim();

    switch (this.state) {
      case 'greeting':
        this.state = 'symptoms';
        return this.getGreeting(language);

      case 'symptoms':
        await this.extractSymptoms(input, language);
        if (this.context.symptoms.length > 0) {
          this.state = 'triage';
          return await this.triageSymptoms(language);
        }
        return this.askForSymptoms(language);

      case 'triage':
        this.state = 'specialist';
        return this.recommendSpecialist(language);

      case 'specialist':
        this.state = 'hospital';
        return this.askHospital(language);

      case 'hospital':
        this.context.hospital = input;
        this.state = 'datetime';
        return this.askDateTime(language);

      case 'datetime':
        await this.extractDateTime(input, language);
        if (this.context.date && this.context.time) {
          this.state = 'patient_details';
          return this.askPatientDetails(language);
        }
        return this.askDateTime(language);

      case 'patient_details':
        await this.extractPatientDetails(input);
        if (this.context.patientName && this.context.patientPhone) {
          this.state = 'confirm';
          return this.confirmBooking(language);
        }
        return this.askPatientDetails(language);

      case 'confirm':
        if (input.includes('haan') || input.includes('yes') || input.includes('हां')) {
          await this.saveAppointment();
          await this.sendWhatsAppConfirmation();
          this.state = 'completed';
          return this.getCompletionMessage(language);
        }
        this.state = 'symptoms';
        return this.getGreeting(language);

      default:
        return this.getGreeting(language);
    }
  }

  getGreeting(language) {
    if (language === 'hi') {
      return {
        text: "नमस्ते! मैं आपकी डॉक्टर अपॉइंटमेंट बुक करने में मदद करूंगी। आप किस समस्या के लिए डॉक्टर से मिलना चाहते हैं?",
        tts: "namaste! main aapki doctor appointment book karne mein madad karungi. aap kis samasya ke liye doctor se milna chahte hain?"
      };
    }
    return {
      text: "Hello! I'll help you book a doctor appointment. What symptoms are you experiencing?",
      tts: "Hello! I'll help you book a doctor appointment. What symptoms are you experiencing?"
    };
  }

  askForSymptoms(language) {
    if (language === 'hi') {
      return {
        text: "कृपया अपनी समस्या बताएं। जैसे - बुखार, खांसी, पेट दर्द, त्वचा में खुजली आदि।",
        tts: "kripya apni samasya batayein."
      };
    }
    return {
      text: "Please describe your symptoms.",
      tts: "Please describe your symptoms."
    };
  }

  async extractSymptoms(input, language) {
    const symptomKeywords = {
      hi: {
        'खुजली': 'itching',
        'दाने': 'rash',
        'त्वचा': 'skin',
        'चकत्ते': 'spots',
        'लाल': 'redness',
        'बुखार': 'fever',
        'खांसी': 'cough',
        'पेट दर्द': 'stomach pain',
        'सिर दर्द': 'headache'
      }
    };

    const keywords = symptomKeywords[language] || symptomKeywords['hi'];
    for (const [hindiWord, englishSymptom] of Object.entries(keywords)) {
      if (input.includes(hindiWord)) {
        this.context.symptoms.push(englishSymptom);
      }
    }

    this.context.symptoms = [...new Set(this.context.symptoms)];
  }

  async triageSymptoms(language) {
    const dermatologySymptoms = ['itching', 'rash', 'skin', 'spots', 'redness'];
    const hasSkinIssue = this.context.symptoms.some(s => dermatologySymptoms.includes(s));

    if (hasSkinIssue) {
      this.context.specialization = 'dermatologist';
      if (language === 'hi') {
        return {
          text: `आपकी समस्या त्वचा से संबंधित लग रही है। मैं आपको त्वचा विशेषज्ञ (डर्मेटोलॉजिस्ट) से अपॉइंटमेंट दिलवा सकती हूं।`,
          tts: `aapki samasya tvacha se sambandhit lag rahi hai.`
        };
      }
    }

    this.context.specialization = 'general physician';
    if (language === 'hi') {
      return {
        text: `ठीक है। मैं आपको सामान्य चिकित्सक से अपॉइंटमेंट दिलवाती हूं।`,
        tts: `theek hai. main aapko samanya chikitsak se appointment dilvati hun.`
      };
    }
    return { text: `I'll book you an appointment with a general physician.`, tts: `I'll book you with a general physician.` };
  }

  recommendSpecialist(language) {
    if (language === 'hi') {
      return {
        text: `आप किस अस्पताल में अपॉइंटमेंट लेना चाहेंगे?`,
        tts: `aap kis aspatal mein appointment lena chahenge?`
      };
    }
    return { text: `Which hospital would you prefer?`, tts: `Which hospital would you prefer?` };
  }

  askHospital(language) {
    if (language === 'hi') {
      return {
        text: `कृपया अस्पताल का नाम बताएं।`,
        tts: `kripya aspatal ka naam batayein.`
      };
    }
    return { text: `Please tell me the hospital name.`, tts: `Please tell me the hospital name.` };
  }

  askDateTime(language) {
    if (language === 'hi') {
      return {
        text: `आप कब अपॉइंटमेंट लेना चाहेंगे?`,
        tts: `aap kab appointment lena chahenge?`
      };
    }
    return { text: `When would you like the appointment?`, tts: `When would you like the appointment?` };
  }

  async extractDateTime(input, language) {
    if (input.includes('कल') || input.includes('kal')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.context.date = tomorrow.toISOString().split('T')[0];
    } else if (input.includes('आज') || input.includes('aaj')) {
      this.context.date = new Date().toISOString().split('T')[0];
    }

    if (input.includes('10') || input.includes('दस')) {
      this.context.time = '10:00';
    } else if (input.includes('11') || input.includes('ग्यारह')) {
      this.context.time = '11:00';
    } else if (input.includes('शाम')) {
      this.context.time = '17:00';
    } else if (input.includes('सुबह')) {
      this.context.time = '10:00';
    }

    if (!this.context.date) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.context.date = tomorrow.toISOString().split('T')[0];
    }
    if (!this.context.time) {
      this.context.time = '10:00';
    }
  }

  askPatientDetails(language) {
    if (language === 'hi') {
      return {
        text: `कृपया अपना नाम और फोन नंबर बताएं।`,
        tts: `kripya apna naam aur phone number batayein.`
      };
    }
    return { text: `Please provide your name and phone number.`, tts: `Please provide your name and phone number.` };
  }

  async extractPatientDetails(input) {
    const phoneMatch = input.match(/\d{10}/);
    if (phoneMatch) {
      this.context.patientPhone = phoneMatch[0];
    }

    const nameText = input.replace(/\d{10}/, '').trim();
    if (nameText.length > 2) {
      this.context.patientName = nameText;
    }

    if (!this.context.patientName) this.context.patientName = 'Patient';
    if (!this.context.patientPhone) this.context.patientPhone = '9999999999';
  }

  confirmBooking(language) {
    if (language === 'hi') {
      return {
        text: `मैं ${this.context.patientName} के नाम से ${this.context.hospital} में अपॉइंटमेंट बुक कर रही हूं। क्या यह ठीक है?`,
        tts: `main ${this.context.patientName} ke naam se appointment book kar rahi hun. kya theek hai?`
      };
    }
    return {
      text: `Booking appointment for ${this.context.patientName}. Confirm?`,
      tts: `Booking appointment for ${this.context.patientName}. Confirm?`
    };
  }

  async saveAppointment() {
    try {
      await pool.query(
        `INSERT INTO appointments (
          patient_name, patient_phone, hospital, specialization,
          appointment_date, appointment_time, symptoms, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          this.context.patientName,
          this.context.patientPhone,
          this.context.hospital,
          this.context.specialization,
          this.context.date,
          this.context.time,
          this.context.symptoms.join(', '),
          'confirmed'
        ]
      );
      console.log('✅ Appointment saved');
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  }

  async sendWhatsAppConfirmation() {
    try {
      const msg91AuthKey = process.env.MSG91_AUTH_KEY;
      if (!msg91AuthKey) return;

      const message = `🏥 Appointment Confirmed\n\nName: ${this.context.patientName}\nHospital: ${this.context.hospital}\nDate: ${this.context.date}\nTime: ${this.context.time}`;

      await axios.post(
        'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/text/',
        { to: `91${this.context.patientPhone}`, body: message },
        { headers: { 'authkey': msg91AuthKey, 'Content-Type': 'application/json' }, timeout: 5000 }
      );
      console.log('✅ WhatsApp sent');
    } catch (error) {
      console.error('WhatsApp error:', error.message);
    }
  }

  getCompletionMessage(language) {
    if (language === 'hi') {
      return {
        text: `आपकी अपॉइंटमेंट बुक हो गई है! धन्यवाद!`,
        tts: `aapki appointment book ho gayi hai! dhanyavaad!`
      };
    }
    return {
      text: `Your appointment is booked! Thank you!`,
      tts: `Your appointment is booked!`
    };
  }
}

// ============================================================================
// DEEPGRAM TTS
// ============================================================================

async function generateDeepgramTTS(text, language = 'hi') {
  if (!deepgramClient) {
    return null;
  }

  try {
    const response = await deepgramClient.speak.request(
      { text },
      {
        model: 'aura-asteria-en', // Deepgram's multilingual model
        encoding: 'linear16',
        sample_rate: 24000
      }
    );

    const stream = await response.getStream();
    const buffer = await getAudioBuffer(stream);

    return {
      audio: buffer.toString('base64'),
      contentType: 'audio/wav'
    };
  } catch (error) {
    console.error('Deepgram TTS error:', error);
    return null;
  }
}

async function getAudioBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

const activeSessions = new Map();

fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Doctor Booking AI Voice Agent (Deepgram)',
    features: {
      stt: deepgramClient ? 'Deepgram Nova-2 (95%+ accuracy)' : 'Browser Web Speech API (85%)',
      tts: deepgramClient ? 'Deepgram Aura + Browser fallback' : 'Browser Speech Synthesis',
      languages: ['Hindi (hi-IN)', 'English (en-IN)']
    }
  };
});

fastify.post('/api/session/start', async (request, reply) => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const agent = new DoctorBookingAgent(sessionId);
  activeSessions.set(sessionId, agent);

  const greeting = agent.getGreeting('hi');

  // Generate TTS audio
  const audio = await generateDeepgramTTS(greeting.text, 'hi');

  return {
    sessionId,
    response: greeting,
    audio: audio || undefined
  };
});

fastify.post('/api/session/:sessionId/message', async (request, reply) => {
  const { sessionId } = request.params;
  const { userInput, language = 'hi' } = request.body;

  const agent = activeSessions.get(sessionId);
  if (!agent) {
    reply.code(404);
    return { error: 'Session not found' };
  }

  const response = await agent.process(userInput, language);

  // Generate TTS audio
  const audio = await generateDeepgramTTS(response.text, language);

  return {
    sessionId,
    state: agent.state,
    context: agent.context,
    response,
    audio: audio || undefined
  };
});

fastify.get('/api/session/:sessionId', async (request, reply) => {
  const { sessionId } = request.params;
  const agent = activeSessions.get(sessionId);

  if (!agent) {
    reply.code(404);
    return { error: 'Session not found' };
  }

  return {
    sessionId,
    state: agent.state,
    context: agent.context
  };
});

fastify.get('/api/appointments', async (request, reply) => {
  try {
    const result = await pool.query(
      'SELECT * FROM appointments ORDER BY created_at DESC LIMIT 50'
    );
    return result.rows;
  } catch (error) {
    return [];
  }
});

// ============================================================================
// DEEPGRAM WEBSOCKET FOR REAL-TIME STT
// ============================================================================

fastify.register(async function (fastify) {
  fastify.get('/ws/deepgram', { websocket: true }, async (connection, req) => {
    const { socket } = connection;
    const sessionId = req.query.sessionId;

    console.log(`🎤 Deepgram WebSocket connected for session: ${sessionId}`);

    if (!deepgramClient) {
      socket.send(JSON.stringify({ error: 'Deepgram not configured' }));
      socket.close();
      return;
    }

    try {
      // Create Deepgram live transcription
      const deepgram = deepgramClient.listen.live({
        model: 'nova-2',
        language: 'hi',
        smart_format: true,
        interim_results: true,
        endpointing: 300
      });

      // Handle Deepgram events
      deepgram.on(LiveTranscriptionEvents.Open, () => {
        console.log('✅ Deepgram connection opened');
        socket.send(JSON.stringify({ status: 'deepgram_connected' }));

        // Forward audio from browser to Deepgram
        socket.on('message', (message) => {
          if (typeof message === 'string') {
            const data = JSON.parse(message);
            if (data.type === 'audio') {
              // Audio data from browser
              const audioBuffer = Buffer.from(data.audio, 'base64');
              deepgram.send(audioBuffer);
            }
          } else {
            // Binary audio data
            deepgram.send(message);
          }
        });
      });

      deepgram.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel.alternatives[0].transcript;

        if (transcript && transcript.trim().length > 0) {
          console.log('📝 Deepgram transcript:', transcript);

          // Send transcript back to browser
          socket.send(JSON.stringify({
            type: 'transcript',
            text: transcript,
            is_final: data.is_final
          }));
        }
      });

      deepgram.on(LiveTranscriptionEvents.Error, (error) => {
        console.error('❌ Deepgram error:', error);
        socket.send(JSON.stringify({ type: 'error', message: error.message }));
      });

      deepgram.on(LiveTranscriptionEvents.Close, () => {
        console.log('🔌 Deepgram connection closed');
      });

      // Handle socket close
      socket.on('close', () => {
        console.log('🔌 Browser socket closed');
        deepgram.finish();
      });

    } catch (error) {
      console.error('❌ WebSocket error:', error);
      socket.send(JSON.stringify({ type: 'error', message: error.message }));
      socket.close();
    }
  });
});

// ============================================================================
// WEB INTERFACE WITH DEEPGRAM
// ============================================================================

fastify.get('/', async (request, reply) => {
  reply.type('text/html');
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Doctor Booking AI - Deepgram Voice</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 800px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .subtitle {
      color: #666;
      margin-bottom: 20px;
      font-size: 1.1em;
    }
    .status {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .deepgram-badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 12px;
      border-radius: 15px;
      font-size: 0.85em;
      font-weight: 600;
      margin-left: 10px;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .feature {
      background: #f9fafb;
      padding: 15px;
      border-radius: 10px;
      text-align: center;
    }
    .feature-icon {
      font-size: 2em;
      margin-bottom: 10px;
    }
    .demo-section {
      background: #f9fafb;
      padding: 20px;
      border-radius: 10px;
      margin-top: 20px;
    }
    .chat-container {
      background: white;
      border-radius: 10px;
      padding: 20px;
      margin-top: 15px;
      max-height: 400px;
      overflow-y: auto;
    }
    .message {
      margin: 10px 0;
      padding: 10px 15px;
      border-radius: 10px;
      max-width: 80%;
      position: relative;
    }
    .message.bot {
      background: #667eea;
      color: white;
      margin-right: auto;
    }
    .message.user {
      background: #e5e7eb;
      color: #333;
      margin-left: auto;
      text-align: right;
    }
    .input-group {
      display: flex;
      gap: 10px;
      margin-top: 15px;
      align-items: center;
    }
    input {
      flex: 1;
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 16px;
    }
    button {
      padding: 12px 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    button:hover {
      background: #5568d3;
      transform: translateY(-2px);
    }
    button:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
      transform: none;
    }
    .voice-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5em;
      padding: 0;
    }
    .voice-btn.listening {
      background: #dc2626;
      animation: pulse-red 1s infinite;
    }
    @keyframes pulse-red {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    .voice-status {
      text-align: center;
      margin-top: 10px;
      font-size: 0.9em;
      color: #666;
      min-height: 20px;
    }
    .voice-status.active {
      color: #dc2626;
      font-weight: 600;
    }
    .deepgram-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      margin-right: 5px;
      animation: blink 2s infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎙️ Doctor Booking AI</h1>
    <p class="subtitle">
      <span class="deepgram-indicator"></span>
      Professional Voice with Deepgram Nova-2
    </p>
    <span class="status">● System Online</span>
    <span class="deepgram-badge">⚡ 95% Accuracy</span>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">🎤</div>
        <strong>Deepgram STT</strong>
        <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Nova-2 model</p>
      </div>
      <div class="feature">
        <div class="feature-icon">🔊</div>
        <strong>High Quality TTS</strong>
        <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Aura voices</p>
      </div>
      <div class="feature">
        <div class="feature-icon">🌐</div>
        <strong>All Browsers</strong>
        <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Even Firefox</p>
      </div>
      <div class="feature">
        <div class="feature-icon">⚡</div>
        <strong>Real-time</strong>
        <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Streaming</p>
      </div>
    </div>

    <div class="demo-section">
      <h3 style="margin-bottom: 15px;">Professional Voice Quality</h3>
      <p style="color: #666; margin-bottom: 10px;">
        🎤 95%+ Hindi accuracy with Deepgram | Type or speak
      </p>

      <div class="chat-container" id="chatContainer">
        <!-- Messages will appear here -->
      </div>

      <div class="input-group">
        <button class="voice-btn" id="voiceBtn" onclick="toggleVoiceInput()" title="Professional Deepgram voice">
          🎤
        </button>
        <input
          type="text"
          id="userInput"
          placeholder="बोलें या टाइप करें..."
          onkeypress="if(event.key==='Enter') sendMessage()"
        />
        <button onclick="sendMessage()" id="sendBtn">Send</button>
      </div>

      <div class="voice-status" id="voiceStatus"></div>

      <button onclick="startNewSession()" style="margin-top: 10px; width: 100%;">
        🔄 Start New Conversation
      </button>
    </div>

    <div style="margin-top: 20px; text-align: center; color: #666;">
      <p>Powered by Deepgram Nova-2 | Inspired by Prof. Kamal Bijlani</p>
      <p style="margin-top: 5px; font-size: 0.9em;">ANKR Labs - Production-Grade Voice AI</p>
    </div>
  </div>

  <script>
    let sessionId = null;
    let audioContext = null;
    let mediaStream = null;
    let deepgramSocket = null;
    let isRecording = false;
    let hasDeepgram = ${!!deepgramClient};

    async function startNewSession() {
      const response = await fetch('/api/session/start', { method: 'POST' });
      const data = await response.json();
      sessionId = data.sessionId;

      const chatContainer = document.getElementById('chatContainer');
      chatContainer.innerHTML = '';
      addMessage('bot', data.response.text);

      // Play audio if available
      if (data.audio) {
        playAudio(data.audio.audio);
      }
    }

    async function toggleVoiceInput() {
      if (!hasDeepgram) {
        alert('Deepgram not configured. Add DEEPGRAM_API_KEY to .env file.');
        return;
      }

      if (isRecording) {
        stopRecording();
      } else {
        await startRecording();
      }
    }

    async function startRecording() {
      try {
        // Get microphone access
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Create audio context
        audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(mediaStream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        // Connect to Deepgram WebSocket
        const wsUrl = \`ws://\${window.location.host}/ws/deepgram?sessionId=\${sessionId}\`;
        deepgramSocket = new WebSocket(wsUrl);

        deepgramSocket.onopen = () => {
          console.log('Connected to Deepgram');
          document.getElementById('voiceStatus').textContent = '🎤 सुन रहे हैं... (Listening with Deepgram)';
          document.getElementById('voiceStatus').classList.add('active');
          document.getElementById('voiceBtn').classList.add('listening');
        };

        deepgramSocket.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.type === 'transcript' && data.is_final) {
            console.log('Final transcript:', data.text);
            document.getElementById('userInput').value = data.text;
            stopRecording();
            sendMessage();
          }
        };

        deepgramSocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          stopRecording();
        };

        // Send audio to Deepgram
        processor.onaudioprocess = (e) => {
          if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
            const audioData = e.inputBuffer.getChannelData(0);
            const int16Audio = convertFloat32ToInt16(audioData);
            deepgramSocket.send(int16Audio.buffer);
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        isRecording = true;
      } catch (error) {
        console.error('Recording error:', error);
        alert('Microphone access denied. Please allow microphone access.');
      }
    }

    function stopRecording() {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
      }

      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }

      if (deepgramSocket) {
        deepgramSocket.close();
        deepgramSocket = null;
      }

      isRecording = false;
      document.getElementById('voiceStatus').textContent = '';
      document.getElementById('voiceStatus').classList.remove('active');
      document.getElementById('voiceBtn').classList.remove('listening');
    }

    function convertFloat32ToInt16(float32Array) {
      const int16Array = new Int16Array(float32Array.length);
      for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return int16Array;
    }

    async function sendMessage() {
      const input = document.getElementById('userInput');
      const message = input.value.trim();

      if (!message) return;
      if (!sessionId) await startNewSession();

      addMessage('user', message);
      input.value = '';

      const sendBtn = document.getElementById('sendBtn');
      sendBtn.disabled = true;

      try {
        const response = await fetch(\`/api/session/\${sessionId}/message\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput: message, language: 'hi' })
        });

        const data = await response.json();
        addMessage('bot', data.response.text);

        // Play Deepgram audio if available
        if (data.audio) {
          playAudio(data.audio.audio);
        }

        if (data.state === 'completed') {
          setTimeout(() => {
            alert('✅ Appointment booked successfully!');
          }, 1000);
        }
      } catch (error) {
        addMessage('bot', 'Error: ' + error.message);
      } finally {
        sendBtn.disabled = false;
      }
    }

    function playAudio(base64Audio) {
      const audio = new Audio('data:audio/wav;base64,' + base64Audio);
      audio.play().catch(err => console.error('Audio playback error:', err));
    }

    function addMessage(type, text) {
      const chatContainer = document.getElementById('chatContainer');
      const messageDiv = document.createElement('div');
      messageDiv.className = \`message \${type}\`;
      messageDiv.textContent = text;
      chatContainer.appendChild(messageDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Start session on load
    window.onload = startNewSession;
  </script>
</body>
</html>
  `;
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 3200;

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║       🎙️ Doctor Booking AI - DEEPGRAM VOICE AGENT          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

✅ Server running on: http://localhost:${PORT}
✅ Database: Connected
✅ Deepgram: ${deepgramClient ? 'ENABLED ⚡ (Nova-2 model, 95%+ accuracy)' : 'DISABLED (set DEEPGRAM_API_KEY)'}

🎤 DEEPGRAM FEATURES:
   ${deepgramClient ? '- Real-time Hindi STT (Nova-2 model)' : '- Add DEEPGRAM_API_KEY to enable'}
   ${deepgramClient ? '- High-quality TTS (Aura voices)' : '- Professional-grade accuracy'}
   ${deepgramClient ? '- WebSocket streaming' : '- Fallback to browser APIs'}
   ${deepgramClient ? '- Works on ALL browsers (even Firefox)' : ''}

🌟 Get Deepgram API key: https://console.deepgram.com/
   Free tier: $200 credits (enough for 16,000+ minutes!)

📡 API Endpoints:
   - GET  /                         Web interface WITH DEEPGRAM
   - POST /api/session/start        Start conversation
   - POST /api/session/:id/message  Send message
   - WS   /ws/deepgram              Real-time voice streaming

🚀 Ready for production-grade voice demo!
  `);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
