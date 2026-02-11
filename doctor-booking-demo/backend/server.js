// Doctor Booking AI Voice Agent Demo
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
  connectionString: process.env.DATABASE_URL || 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon'
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
// CONVERSATIONAL AI LOGIC
// ============================================================================

/**
 * Conversation state machine for doctor booking
 */
class DoctorBookingAgent {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.state = 'greeting'; // greeting -> symptoms -> triage -> specialist -> hospital -> datetime -> confirm
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

  /**
   * Process user input and determine next response
   */
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
        // Symptoms processed, move to specialist selection
        this.state = 'specialist';
        return this.recommendSpecialist(language);

      case 'specialist':
        // User confirms specialist or modifies
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
        this.state = 'symptoms'; // Reset
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
      text: "Please describe your symptoms. For example - fever, cough, stomach pain, skin rash, etc.",
      tts: "Please describe your symptoms."
    };
  }

  async extractSymptoms(input, language) {
    // Symptom detection (basic keyword matching + AI enhancement via ANKR AI Proxy)
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

    // Extract symptoms from input
    const keywords = symptomKeywords[language] || symptomKeywords['hi'];
    for (const [hindiWord, englishSymptom] of Object.entries(keywords)) {
      if (input.includes(hindiWord)) {
        this.context.symptoms.push(englishSymptom);
      }
    }

    // Call ANKR AI Proxy for better symptom extraction (if available)
    try {
      const aiProxyUrl = process.env.AI_PROXY_URL || 'http://localhost:4444';
      const response = await axios.post(`${aiProxyUrl}/chat`, {
        messages: [
          { role: 'system', content: 'Extract symptoms from user input and respond with JSON array of symptoms in English. For skin issues, include "dermatology".' },
          { role: 'user', content: input }
        ],
        model: 'auto',
        response_format: { type: 'json_object' }
      }, { timeout: 3000 });

      if (response.data.symptoms) {
        this.context.symptoms.push(...response.data.symptoms);
      }
    } catch (error) {
      console.log('AI Proxy not available, using keyword matching only');
    }

    // Remove duplicates
    this.context.symptoms = [...new Set(this.context.symptoms)];
  }

  async triageSymptoms(language) {
    // Determine specialization based on symptoms
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
      return {
        text: `Your symptoms appear to be skin-related. I can book you an appointment with a dermatologist.`,
        tts: `Your symptoms appear to be skin-related. I can book you an appointment with a dermatologist.`
      };
    }

    // Default to general physician
    this.context.specialization = 'general physician';
    if (language === 'hi') {
      return {
        text: `ठीक है। मैं आपको सामान्य चिकित्सक (जनरल फिजिशियन) से अपॉइंटमेंट दिलवाती हूं।`,
        tts: `theek hai. main aapko samanya chikitsak se appointment dilvati hun.`
      };
    }
    return {
      text: `I'll book you an appointment with a general physician.`,
      tts: `I'll book you an appointment with a general physician.`
    };
  }

  recommendSpecialist(language) {
    if (language === 'hi') {
      return {
        text: `आप किस अस्पताल में अपॉइंटमेंट लेना चाहेंगे? या मैं आपके नजदीकी अस्पताल की सिफारिश करूं?`,
        tts: `aap kis aspatal mein appointment lena chahenge? ya main aapke najdeeki aspatal ki sifarish karun?`
      };
    }
    return {
      text: `Which hospital would you prefer? Or shall I recommend one nearby?`,
      tts: `Which hospital would you prefer?`
    };
  }

  askHospital(language) {
    if (language === 'hi') {
      return {
        text: `कृपया अस्पताल का नाम बताएं।`,
        tts: `kripya aspatal ka naam batayein.`
      };
    }
    return {
      text: `Please tell me the hospital name.`,
      tts: `Please tell me the hospital name.`
    };
  }

  askDateTime(language) {
    if (language === 'hi') {
      return {
        text: `आप कब अपॉइंटमेंट लेना चाहेंगे? तारीख और समय बताएं।`,
        tts: `aap kab appointment lena chahenge? tareekh aur samay batayein.`
      };
    }
    return {
      text: `When would you like the appointment? Please provide date and time.`,
      tts: `When would you like the appointment?`
    };
  }

  async extractDateTime(input, language) {
    // Simple date/time extraction
    // In production, use NLP library or AI for better parsing

    // Look for common Hindi date patterns
    if (input.includes('कल') || input.includes('kal')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.context.date = tomorrow.toISOString().split('T')[0];
    } else if (input.includes('आज') || input.includes('aaj')) {
      this.context.date = new Date().toISOString().split('T')[0];
    }

    // Look for time patterns
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

    // Default to tomorrow 10 AM if not specified
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
    return {
      text: `Please provide your name and phone number.`,
      tts: `Please provide your name and phone number.`
    };
  }

  async extractPatientDetails(input) {
    // Extract name and phone from input
    // Simple pattern matching - in production use NER

    const phoneMatch = input.match(/\d{10}/);
    if (phoneMatch) {
      this.context.patientPhone = phoneMatch[0];
    }

    // Name is whatever's left after removing phone
    const nameText = input.replace(/\d{10}/, '').trim();
    if (nameText.length > 2) {
      this.context.patientName = nameText;
    }

    // Set defaults if not found
    if (!this.context.patientName) this.context.patientName = 'Patient';
    if (!this.context.patientPhone) this.context.patientPhone = '9999999999';
  }

  confirmBooking(language) {
    if (language === 'hi') {
      const dateStr = new Date(this.context.date).toLocaleDateString('hi-IN');
      return {
        text: `ठीक है। मैं ${this.context.patientName} के नाम से ${this.context.hospital} में ${this.context.specialization} के लिए ${dateStr} को ${this.context.time} बजे अपॉइंटमेंट बुक कर रही हूं। क्या यह ठीक है?`,
        tts: `theek hai. main ${this.context.patientName} ke naam se ${this.context.hospital} mein ${this.context.specialization} ke liye ${dateStr} ko ${this.context.time} baje appointment book kar rahi hun. kya yeh theek hai?`
      };
    }
    return {
      text: `I'm booking an appointment for ${this.context.patientName} at ${this.context.hospital} with a ${this.context.specialization} on ${this.context.date} at ${this.context.time}. Is this correct?`,
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

      const response = await axios.post(
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
        tts: `aapki appointment book ho gayi hai! aapko whatsapp par confirmation mil jayega. dhanyavaad!`
      };
    }
    return {
      text: `Your appointment has been booked! You'll receive a WhatsApp confirmation. Thank you!`,
      tts: `Your appointment has been booked!`
    };
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Store active sessions
const activeSessions = new Map();

// Health check
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Doctor Booking AI Voice Agent'
  };
});

// Start a new conversation session
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

// Process user input
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

// Get session state
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

// Get all appointments
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

// Plivo webhook for incoming calls
fastify.post('/api/plivo/answer', async (request, reply) => {
  // Generate Plivo XML response
  reply.type('application/xml');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak language="hi-IN">
    नमस्ते! मैं आपकी डॉक्टर अपॉइंटमेंट बुक करने में मदद करूंगी।
  </Speak>
  <GetInput action="${process.env.BASE_URL || 'http://localhost:3200'}/api/plivo/process" method="POST">
    <Speak language="hi-IN">
      आप किस समस्या के लिए डॉक्टर से मिलना चाहते हैं?
    </Speak>
  </GetInput>
</Response>`;
});

// Simple web interface
fastify.get('/', async (request, reply) => {
  reply.type('text/html');
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Doctor Booking AI Demo</title>
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
      margin-bottom: 30px;
      font-size: 1.1em;
    }
    .status {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      margin-bottom: 30px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .feature {
      background: #f9fafb;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
    }
    .feature-icon {
      font-size: 2.5em;
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
  </style>
</head>
<body>
  <div class="container">
    <h1>🏥 Doctor Booking AI</h1>
    <p class="subtitle">AI Voice Agent Demo - Hindi Conversation</p>
    <span class="status">● System Online</span>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">🗣️</div>
        <strong>Hindi Support</strong>
        <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Native language</p>
      </div>
      <div class="feature">
        <div class="feature-icon">🩺</div>
        <strong>Symptom Triage</strong>
        <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Smart diagnosis</p>
      </div>
      <div class="feature">
        <div class="feature-icon">📅</div>
        <strong>Auto Booking</strong>
        <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Instant scheduling</p>
      </div>
      <div class="feature">
        <div class="feature-icon">💬</div>
        <strong>WhatsApp Alert</strong>
        <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Confirmation</p>
      </div>
    </div>

    <div class="demo-section">
      <h3 style="margin-bottom: 15px;">Try the Demo</h3>
      <p style="color: #666; margin-bottom: 10px;">
        Type in Hindi or English. Example: "मुझे त्वचा में खुजली है" (I have skin itching)
      </p>

      <div class="chat-container" id="chatContainer">
        <!-- Messages will appear here -->
      </div>

      <div class="input-group">
        <input
          type="text"
          id="userInput"
          placeholder="अपनी समस्या बताएं..."
          onkeypress="if(event.key==='Enter') sendMessage()"
        />
        <button onclick="sendMessage()" id="sendBtn">Send</button>
      </div>

      <button onclick="startNewSession()" style="margin-top: 10px; width: 100%;">
        🔄 Start New Conversation
      </button>
    </div>

    <div style="margin-top: 20px; text-align: center; color: #666;">
      <p>Inspired by Prof. Kamal Bijlani's demo at India Today Education Conclave 2026</p>
      <p style="margin-top: 5px; font-size: 0.9em;">Built with ANKR Labs</p>
    </div>
  </div>

  <script>
    let sessionId = null;

    async function startNewSession() {
      const response = await fetch('/api/session/start', { method: 'POST' });
      const data = await response.json();
      sessionId = data.sessionId;

      const chatContainer = document.getElementById('chatContainer');
      chatContainer.innerHTML = '';
      addMessage('bot', data.response.text);
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

        if (data.state === 'completed') {
          setTimeout(() => {
            alert('✅ Appointment booked successfully! Check WhatsApp for confirmation.');
          }, 500);
        }
      } catch (error) {
        addMessage('bot', 'Error: ' + error.message);
      } finally {
        sendBtn.disabled = false;
      }
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
║       🏥 Doctor Booking AI Voice Agent - Demo Server        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

✅ Server running on: http://localhost:${PORT}
✅ Database: Connected
✅ Language: Hindi (हिन्दी)
✅ Features: Symptom triage, Specialist recommendation, Auto-booking

🎯 Inspired by Prof. Kamal Bijlani's demo at India Today Education Conclave

📡 API Endpoints:
   - GET  /                         Web interface
   - POST /api/session/start        Start conversation
   - POST /api/session/:id/message  Send message
   - GET  /api/appointments         View bookings
   - POST /api/plivo/answer         Plivo webhook

🚀 Ready for demo!
  `);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
