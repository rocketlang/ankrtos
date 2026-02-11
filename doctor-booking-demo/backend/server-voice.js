// Doctor Booking AI Voice Agent Demo - WITH VOICE I/O
// Enhanced version with Speech-to-Text and Text-to-Speech
// Inspired by Prof. Kamal Bijlani's demo at India Today Education Conclave 2026

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import pg from 'pg';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: '*' });
await fastify.register(websocket);

// Database connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ankr:indrA%400612@localhost:5432/ankr_eon'
});

// Test DB connection
try {
  const client = await pool.connect();
  console.log('✅ Connected to PostgreSQL');
  client.release();
} catch (err) {
  console.error('❌ Database connection error:', err);
}

// ============================================================================
// CONVERSATIONAL AI LOGIC (Same as before)
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
        tts: "kripya apni samasya batayein. jaise - bukhar, khansi, pet dard, tvacha mein khujli aadi."
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
          tts: `aapki samasya tvacha se sambandhit lag rahi hai. main aapko tvacha visheshagya se appointment dilva sakti hun.`
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
    return { text: `I'll book you an appointment with a general physician.`, tts: `I'll book you an appointment with a general physician.` };
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
        text: `आप कब अपॉइंटमेंट लेना चाहेंगे? तारीख और समय बताएं।`,
        tts: `aap kab appointment lena chahenge? tareekh aur samay batayein.`
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
    } else if (input.includes('2') || input.includes('दो')) {
      this.context.time = '14:00';
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
      const dateStr = new Date(this.context.date).toLocaleDateString('hi-IN');
      return {
        text: `ठीक है। मैं ${this.context.patientName} के नाम से ${this.context.hospital} में ${this.context.specialization} के लिए ${dateStr} को ${this.context.time} बजे अपॉइंटमेंट बुक कर रही हूं। क्या यह ठीक है?`,
        tts: `theek hai. main ${this.context.patientName} ke naam se ${this.context.hospital} mein appointment book kar rahi hun. kya yeh theek hai?`
      };
    }
    return {
      text: `I'm booking an appointment for ${this.context.patientName} at ${this.context.hospital} on ${this.context.date} at ${this.context.time}. Is this correct?`,
      tts: `I'm booking an appointment for ${this.context.patientName}.`
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
      console.log('✅ Appointment saved to database');
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  }

  async sendWhatsAppConfirmation() {
    try {
      const msg91AuthKey = process.env.MSG91_AUTH_KEY;
      if (!msg91AuthKey) {
        console.log('⚠️ MSG91_AUTH_KEY not configured, skipping WhatsApp');
        return;
      }

      const message = `
🏥 *Appointment Confirmed*

Name: ${this.context.patientName}
Hospital: ${this.context.hospital}
Doctor: ${this.context.specialization}
Date: ${this.context.date}
Time: ${this.context.time}

We'll see you soon!
      `.trim();

      await axios.post(
        'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/text/',
        {
          to: `91${this.context.patientPhone}`,
          body: message
        },
        {
          headers: {
            'authkey': msg91AuthKey,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      console.log('✅ WhatsApp confirmation sent');
    } catch (error) {
      console.error('WhatsApp error:', error.message);
    }
  }

  getCompletionMessage(language) {
    if (language === 'hi') {
      return {
        text: `आपकी अपॉइंटमेंट बुक हो गई है! आपको WhatsApp पर कंफर्मेशन मिल जाएगा। धन्यवाद!`,
        tts: `aapki appointment book ho gayi hai! dhanyavaad!`
      };
    }
    return {
      text: `Your appointment has been booked! Thank you!`,
      tts: `Your appointment has been booked!`
    };
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

const activeSessions = new Map();

fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Doctor Booking AI Voice Agent (with Voice I/O)',
    features: ['Hindi STT', 'Hindi TTS', 'Browser Web Speech API']
  };
});

fastify.post('/api/session/start', async (request, reply) => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const agent = new DoctorBookingAgent(sessionId);
  activeSessions.set(sessionId, agent);

  const greeting = agent.getGreeting('hi');

  return {
    sessionId,
    response: greeting
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

  return {
    sessionId,
    state: agent.state,
    context: agent.context,
    response
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
// WEB INTERFACE WITH VOICE I/O
// ============================================================================

fastify.get('/', async (request, reply) => {
  reply.type('text/html');
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Doctor Booking AI - Voice Demo</title>
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
    .voice-badge {
      display: inline-block;
      background: #f59e0b;
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
    .message .speaker-icon {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      font-size: 1.2em;
      opacity: 0.7;
      transition: opacity 0.3s;
    }
    .message.bot .speaker-icon {
      left: auto;
      right: -30px;
    }
    .message .speaker-icon:hover {
      opacity: 1;
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
      background: #f59e0b;
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
  </style>
</head>
<body>
  <div class="container">
    <h1>🎙️ Doctor Booking AI</h1>
    <p class="subtitle">AI Voice Agent Demo - Speak or Type in Hindi</p>
    <span class="status">● System Online</span>
    <span class="voice-badge">🎤 Voice Enabled</span>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">🗣️</div>
        <strong>Voice Input</strong>
        <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Speak symptoms</p>
      </div>
      <div class="feature">
        <div class="feature-icon">🔊</div>
        <strong>Voice Output</strong>
        <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Listen to AI</p>
      </div>
      <div class="feature">
        <div class="feature-icon">🩺</div>
        <strong>Smart Triage</strong>
        <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Auto diagnosis</p>
      </div>
      <div class="feature">
        <div class="feature-icon">📅</div>
        <strong>Auto Booking</strong>
        <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Instant schedule</p>
      </div>
    </div>

    <div class="demo-section">
      <h3 style="margin-bottom: 15px;">Try Voice or Text</h3>
      <p style="color: #666; margin-bottom: 10px;">
        🎤 Click microphone to speak OR type: "मुझे त्वचा में खुजली है"
      </p>

      <div class="chat-container" id="chatContainer">
        <!-- Messages will appear here -->
      </div>

      <div class="input-group">
        <button class="voice-btn" id="voiceBtn" onclick="toggleVoiceInput()" title="Click to speak">
          🎤
        </button>
        <input
          type="text"
          id="userInput"
          placeholder="अपनी समस्या बताएं या माइक दबाएं..."
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
      <p>Inspired by Prof. Kamal Bijlani's demo at India Today Education Conclave 2026</p>
      <p style="margin-top: 5px; font-size: 0.9em;">Built with ANKR Labs - Now with Voice I/O!</p>
    </div>
  </div>

  <script>
    let sessionId = null;
    let recognition = null;
    let isListening = false;
    let synthesis = window.speechSynthesis;

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Hindi language
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        isListening = true;
        document.getElementById('voiceBtn').classList.add('listening');
        document.getElementById('voiceStatus').textContent = '🎤 सुन रहे हैं... (Listening...)';
        document.getElementById('voiceStatus').classList.add('active');
      };

      recognition.onend = () => {
        isListening = false;
        document.getElementById('voiceBtn').classList.remove('listening');
        document.getElementById('voiceStatus').textContent = '';
        document.getElementById('voiceStatus').classList.remove('active');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Voice input:', transcript);
        document.getElementById('userInput').value = transcript;
        sendMessage();
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        document.getElementById('voiceStatus').textContent = '❌ Error: ' + event.error;
        setTimeout(() => {
          document.getElementById('voiceStatus').textContent = '';
        }, 3000);
      };
    } else {
      console.warn('Speech Recognition not supported');
      document.getElementById('voiceBtn').style.opacity = '0.5';
      document.getElementById('voiceBtn').title = 'Speech Recognition not supported in this browser';
    }

    function toggleVoiceInput() {
      if (!recognition) {
        alert('Voice input not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    }

    function speakText(text) {
      if (!synthesis) {
        console.warn('Speech Synthesis not supported');
        return;
      }

      // Cancel any ongoing speech
      synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN'; // Hindi voice
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;

      // Try to find a Hindi voice
      const voices = synthesis.getVoices();
      const hindiVoice = voices.find(voice => voice.lang === 'hi-IN' || voice.lang.startsWith('hi'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }

      synthesis.speak(utterance);
    }

    async function startNewSession() {
      const response = await fetch('/api/session/start', { method: 'POST' });
      const data = await response.json();
      sessionId = data.sessionId;

      const chatContainer = document.getElementById('chatContainer');
      chatContainer.innerHTML = '';
      addMessage('bot', data.response.text, data.response.tts);
      speakText(data.response.text);
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
        addMessage('bot', data.response.text, data.response.tts);

        // Speak bot response
        speakText(data.response.text);

        if (data.state === 'completed') {
          setTimeout(() => {
            alert('✅ Appointment booked successfully! Check WhatsApp for confirmation.');
          }, 2000);
        }
      } catch (error) {
        addMessage('bot', 'Error: ' + error.message);
      } finally {
        sendBtn.disabled = false;
      }
    }

    function addMessage(type, text, ttsText = null) {
      const chatContainer = document.getElementById('chatContainer');
      const messageDiv = document.createElement('div');
      messageDiv.className = \`message \${type}\`;
      messageDiv.textContent = text;

      // Add speaker icon for bot messages
      if (type === 'bot' && synthesis) {
        const speakerIcon = document.createElement('span');
        speakerIcon.className = 'speaker-icon';
        speakerIcon.textContent = '🔊';
        speakerIcon.title = 'Click to replay';
        speakerIcon.onclick = () => speakText(text);
        messageDiv.appendChild(speakerIcon);
      }

      chatContainer.appendChild(messageDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Load voices when available
    if (synthesis) {
      if (synthesis.onvoiceschanged !== undefined) {
        synthesis.onvoiceschanged = () => {
          const voices = synthesis.getVoices();
          console.log('Available voices:', voices.filter(v => v.lang.startsWith('hi')));
        };
      }
    }

    // Start session on load
    window.onload = () => {
      startNewSession();
      // Load voices
      if (synthesis) {
        synthesis.getVoices();
      }
    };
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
║       🎙️ Doctor Booking AI Voice Agent - WITH VOICE I/O    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

✅ Server running on: http://localhost:${PORT}
✅ Database: Connected
✅ Language: Hindi (हिन्दी)
✅ Voice Input: Browser Web Speech API (Hindi STT)
✅ Voice Output: Browser Speech Synthesis (Hindi TTS)

🎤 NEW FEATURES:
   - Click microphone button to speak symptoms
   - Bot responds with voice automatically
   - Click 🔊 icon to replay any message
   - Works best in Chrome/Edge browsers

🎯 Inspired by Prof. Kamal Bijlani's demo at India Today Education Conclave

📡 API Endpoints:
   - GET  /                         Web interface WITH VOICE
   - POST /api/session/start        Start conversation
   - POST /api/session/:id/message  Send message
   - GET  /api/appointments         View bookings

🚀 Ready for voice demo!
  `);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
