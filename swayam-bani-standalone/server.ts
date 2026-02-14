/**
 * Swayam GraphQL Schema with Full BANI Integration
 *
 * Features:
 * - STT (Speech-to-Text) with Sarvam/Whisper
 * - TTS (Text-to-Speech) with 30 voices
 * - Translation across 11 Indian languages
 * - Voice cloning with XTTS
 * - AI processing with FREE-FIRST LLM routing
 * - WebSocket with MCP integration (40+ tools)
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

import Fastify from 'fastify';
import mercurius from 'mercurius';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { bani, BaniLanguage, SarvamVoice, SARVAM_VOICES, DEFAULT_VOICES } from './bani-service';
// Temporarily use non-MCP handler to avoid dependency issues
// import { SwayamWebSocketHandlerMCP } from './packages/voice/websocket/swayam-handler-mcp';
import { SwayamWebSocketHandler } from './packages/voice/websocket/swayam-handler';

// Central config - Single source of truth for all ANKR services
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getPort, getServiceUrl } = require('/root/ankr-services.config.js');

// ============================================================================
// ADMIN TTS PROVIDER TOGGLE
// ============================================================================
// Global setting for TTS provider - can be changed by admin at runtime
// 'free' = Piper/Edge (free, may be artificial)
// 'sarvam' = Sarvam Bulbul v2 (premium, natural Hindi)
let globalTTSProvider: 'free' | 'sarvam' = (process.env.TTS_PROVIDER === 'sarvam') ? 'sarvam' : 'free';

export function getTTSProvider(): 'free' | 'sarvam' {
  return globalTTSProvider;
}

export function setTTSProvider(provider: 'free' | 'sarvam'): void {
  globalTTSProvider = provider;
  console.log(`🔊 TTS Provider changed to: ${provider === 'sarvam' ? 'Sarvam (Premium)' : 'Free (Piper/Edge)'}`);
}

// AI Proxy for LLM routing
const AI_PROXY_URL = process.env.AI_PROXY_URL || getServiceUrl('ai-proxy');

// Intent keywords for classification
const INTENT_KEYWORDS: Record<string, string[]> = {
  code: ['बनाओ', 'code', 'program', 'app', 'website', 'function', 'script', 'लिखो', 'create', 'build', 'make'],
  question: ['क्या', 'कैसे', 'क्यों', 'कब', 'कहाँ', 'कौन', 'what', 'how', 'why', 'when', 'where', 'who', 'explain'],
  task: ['भेजो', 'करो', 'बुक', 'order', 'खरीदो', 'send', 'book', 'buy', 'schedule', 'remind'],
  search: ['खोजो', 'ढूंढो', 'बताओ', 'search', 'find', 'tell', 'weather', 'news', 'price'],
  creative: ['कहानी', 'गाना', 'कविता', 'story', 'song', 'poem', 'design', 'compose', 'write'],
  translate: ['translate', 'अनुवाद', 'translation', 'भाषा', 'convert'],
  chat: ['हाय', 'हेलो', 'नमस्ते', 'कैसे हो', 'hi', 'hello', 'hey', 'good morning', 'good night']
};

// Classify intent from text
function classifyIntent(text: string): { intent: string; confidence: number } {
  const normalizedText = text.toLowerCase();
  let bestIntent = 'chat';
  let bestScore = 0;
  
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const matches = keywords.filter(kw => normalizedText.includes(kw.toLowerCase())).length;
    const score = matches / keywords.length;
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }
  
  return {
    intent: bestIntent,
    confidence: Math.min(bestScore + 0.5, 1.0)
  };
}

// System prompts per language
const SYSTEM_PROMPTS: Record<string, string> = {
  hi: `आप स्वयं हैं, एक बहुभाषी AI सहायक। आप हिंदी में जवाब दें। आप कोड लिख सकते हैं, सवालों के जवाब दे सकते हैं, और मदद कर सकते हैं।`,
  en: `You are Swayam, a multilingual AI assistant. You respond in English. You can write code, answer questions, and help with tasks.`,
  bn: `আপনি স্বয়ং, একজন বহুভাষিক AI সহকারী। আপনি বাংলায় উত্তর দিন।`,
  te: `మీరు స్వయం, బహుభాషా AI సహాయకుడు. మీరు తెలుగులో సమాధానమిస్తారు.`,
  ta: `நீங்கள் சுயம், பலமொழி AI உதவியாளர். நீங்கள் தமிழில் பதிலளிக்கிறீர்கள்.`,
  mr: `तुम्ही स्वयं आहात, एक बहुभाषिक AI सहाय्यक. तुम्ही मराठीत उत्तर द्या.`,
  gu: `તમે સ્વયં છો, એક બહુભાષી AI સહાયક. તમે ગુજરાતીમાં જવાબ આપો.`,
  kn: `ನೀವು ಸ್ವಯಂ, ಬಹುಭಾಷಾ AI ಸಹಾಯಕ. ನೀವು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ.`,
  ml: `നിങ്ങൾ സ്വയം, ഒരു ബഹുഭാഷാ AI സഹായി. നിങ്ങൾ മലയാളത്തിൽ മറുപടി നൽകുന്നു.`,
  pa: `ਤੁਸੀਂ ਸਵੈਮ ਹੋ, ਇੱਕ ਬਹੁਭਾਸ਼ੀ AI ਸਹਾਇਕ। ਤੁਸੀਂ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ।`,
  or: `ଆପଣ ସ୍ୱୟଂ, ଏକ ବହୁଭାଷୀ AI ସହାୟକ। ଆପଣ ଓଡ଼ିଆରେ ଉତ୍ତର ଦିଅନ୍ତୁ।`,
  // European languages use English base
  es: `Eres Swayam, un asistente de IA multilingüe. Respondes en español.`,
  de: `Du bist Swayam, ein mehrsprachiger KI-Assistent. Du antwortest auf Deutsch.`,
  fr: `Vous êtes Swayam, un assistant IA multilingue. Vous répondez en français.`,
  it: `Sei Swayam, un assistente AI multilingue. Rispondi in italiano.`,
  nl: `Je bent Swayam, een meertalige AI-assistent. Je antwoordt in het Nederlands.`,
  pt: `Você é Swayam, um assistente de IA multilíngue. Você responde em português.`,
  pl: `Jesteś Swayam, wielojęzycznym asystentem AI. Odpowiadasz po polsku.`,
  ru: `Вы Swayam, многоязычный ИИ-ассистент. Вы отвечаете на русском языке.`,
  uk: `Ви Swayam, багатомовний AI-асистент. Ви відповідаєте українською.`,
  sv: `Du är Swayam, en flerspråkig AI-assistent. Du svarar på svenska.`
};

// Call AI Proxy for LLM response
async function callAIProxy(
  messages: { role: string; content: string }[],
  language: string
): Promise<string> {
  const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;
  
  const response = await fetch(`${AI_PROXY_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'auto', // FREE-FIRST routing
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  });
  
  if (!response.ok) {
    throw new Error(`AI Proxy error: ${response.statusText}`);
  }
  
  const data = await response.json() as any;
  return data.choices[0].message.content;
}

// GraphQL Schema
const schema = `
  # ==================== ENUMS ====================
  
  enum BaniLanguage {
    hi  # Hindi
    bn  # Bengali
    te  # Telugu
    mr  # Marathi
    ta  # Tamil
    gu  # Gujarati
    kn  # Kannada
    ml  # Malayalam
    pa  # Punjabi
    or  # Odia
    en  # English
    ur  # Urdu
    es  # Spanish
    de  # German
    fr  # French
    it  # Italian
    nl  # Dutch
    pt  # Portuguese
    pl  # Polish
    ru  # Russian
    uk  # Ukrainian
    sv  # Swedish
  }
  
  enum SarvamVoice {
    anushka abhilash manisha vidya arya karun
    hitesh aditya ritu chirag priya neha
    rahul pooja rohan simran kavya sunita
    tara anirudh anjali ishaan ratan varun
    manan sumit roopa kabir aayan shubh
  }
  
  enum TTSProvider {
    sarvam
    piper
    xtts
  }
  
  enum STTProvider {
    sarvam
    whisper
  }
  
  # ==================== TYPES ====================
  
  type SwayamResponse {
    text: String!
    voice: String!
    audioBase64: String
    code: String
    codeLanguage: String
    intent: String!
    confidence: Float!
    language: BaniLanguage!
    ttsVoice: String
    processingTime: Int
  }
  
  type TTSResponse {
    audioBase64: String!
    duration: Float!
    voice: String!
    provider: TTSProvider!
  }
  
  type STTResponse {
    text: String!
    language: BaniLanguage!
    confidence: Float!
    duration: Float!
    provider: STTProvider!
  }
  
  type TranslationResponse {
    original: String!
    translated: String!
    sourceLanguage: BaniLanguage!
    targetLanguage: BaniLanguage!
    cached: Boolean!
  }
  
  type VoiceInfo {
    name: String!
    gender: String
    style: String
  }
  
  type LanguageInfo {
    code: BaniLanguage!
    name: String!
    nativeName: String!
    hasTTS: Boolean!
    hasSTT: Boolean!
    hasTranslation: Boolean!
    defaultVoice: String
  }
  
  type BaniHealth {
    status: String!
    uptime: Int
    stt: Boolean!
    tts: Boolean!
    translate: Boolean!
    voiceClone: Boolean!
  }
  
  # ==================== INPUTS ====================
  
  input SwayamInput {
    text: String
    audioBase64: String
    language: BaniLanguage
    voice: SarvamVoice
    conversationId: String
    preferFree: Boolean
  }
  
  input TTSInput {
    text: String!
    language: BaniLanguage!
    voice: SarvamVoice
    pitch: Float
    pace: Float
    provider: TTSProvider
  }
  
  input STTInput {
    audioBase64: String!
    language: BaniLanguage
    provider: STTProvider
  }
  
  input TranslateInput {
    text: String!
    sourceLanguage: BaniLanguage!
    targetLanguage: BaniLanguage!
  }
  
  input VoiceCloneInput {
    audioBase64: String!
    language: BaniLanguage!
    name: String!
  }
  
  # ==================== QUERIES ====================
  
  type Query {
    health: String!
    baniHealth: BaniHealth!
    
    # Get available voices
    voices: [VoiceInfo!]!
    voicesForLanguage(language: BaniLanguage!): [VoiceInfo!]!
    
    # Get language info
    languages: [LanguageInfo!]!
    languageInfo(code: BaniLanguage!): LanguageInfo
  }
  
  # ==================== MUTATIONS ====================
  
  type Mutation {
    # Main Swayam processing (text or voice → AI → text + voice)
    processSwayam(input: SwayamInput!): SwayamResponse!
    
    # Individual BANI services
    textToSpeech(input: TTSInput!): TTSResponse!
    speechToText(input: STTInput!): STTResponse!
    translate(input: TranslateInput!): TranslationResponse!
    
    # Voice cloning
    createVoiceClone(input: VoiceCloneInput!): String!
    synthesizeWithClone(text: String!, cloneId: String!, language: BaniLanguage!): TTSResponse!
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    health: () => '🎙️ Swayam is ready with BANI voice capabilities!',
    
    baniHealth: async () => {
      try {
        const health = await bani.health();
        return {
          status: health.status,
          uptime: 0,
          stt: health.providers.stt,
          tts: health.providers.tts,
          translate: health.providers.translate,
          voiceClone: health.providers.voiceClone
        };
      } catch {
        return {
          status: 'error',
          uptime: 0,
          stt: false,
          tts: false,
          translate: false,
          voiceClone: false
        };
      }
    },
    
    voices: () => SARVAM_VOICES.map(name => ({
      name,
      gender: ['anushka', 'manisha', 'vidya', 'ritu', 'priya', 'neha', 'pooja', 'simran', 'kavya', 'sunita', 'tara', 'anjali', 'roopa'].includes(name) ? 'female' : 'male',
      style: 'natural'
    })),
    
    voicesForLanguage: (_: any, { language }: { language: BaniLanguage }) => {
      return SARVAM_VOICES.map(name => ({
        name,
        gender: ['anushka', 'manisha', 'vidya', 'ritu', 'priya', 'neha', 'pooja', 'simran', 'kavya', 'sunita', 'tara', 'anjali', 'roopa'].includes(name) ? 'female' : 'male',
        style: 'natural'
      }));
    },
    
    languages: () => [
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'anushka' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'priya' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'kavya' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'manisha' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'vidya' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'neha' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'sunita' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'anjali' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'simran' },
      { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'tara' },
      { code: 'en', name: 'English', nativeName: 'English', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'arya' },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'roopa' },
      // European languages (TTS via browser/external)
      { code: 'es', name: 'Spanish', nativeName: 'Español', hasTTS: false, hasSTT: false, hasTranslation: false, defaultVoice: null },
      { code: 'de', name: 'German', nativeName: 'Deutsch', hasTTS: false, hasSTT: false, hasTranslation: false, defaultVoice: null },
      { code: 'fr', name: 'French', nativeName: 'Français', hasTTS: false, hasSTT: false, hasTranslation: false, defaultVoice: null },
    ],
    
    languageInfo: (_: any, { code }: { code: BaniLanguage }) => {
      const langs: Record<string, any> = {
        hi: { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'anushka' },
        en: { code: 'en', name: 'English', nativeName: 'English', hasTTS: true, hasSTT: true, hasTranslation: true, defaultVoice: 'arya' }
      };
      return langs[code] || null;
    }
  },
  
  Mutation: {
    processSwayam: async (_: any, { input }: { input: any }) => {
      const startTime = Date.now();
      const language = input.language || 'en';
      // Use admin TTS setting unless explicitly overridden in input
      const preferFree = input.preferFree !== undefined
        ? input.preferFree
        : (globalTTSProvider === 'free');
      let inputText = input.text || '';
      
      // If audio provided, transcribe first
      if (input.audioBase64 && !inputText) {
        try {
          const audioBuffer = Buffer.from(input.audioBase64, 'base64');
          const sttResult = await bani.stt.transcribe(audioBuffer, language as BaniLanguage, preferFree);
          inputText = sttResult.text;
        } catch (error) {
          console.error('STT failed:', error);
        }
      }
      
      if (!inputText) {
        return {
          text: 'No input provided',
          voice: 'No input provided',
          intent: 'error',
          confidence: 0,
          language,
          processingTime: Date.now() - startTime
        };
      }
      
      // Classify intent
      const { intent, confidence } = classifyIntent(inputText);
      
      // Get AI response
      let responseText: string;
      try {
        responseText = await callAIProxy([{ role: 'user', content: inputText }], language);
      } catch (error) {
        console.error('AI Proxy error:', error);
        responseText = language === 'hi' 
          ? 'माफ कीजिए, कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।'
          : 'Sorry, something went wrong. Please try again.';
      }
      
      // Extract code if present
      let code: string | undefined;
      let codeLanguage: string | undefined;
      const codeMatch = responseText.match(/```(\w+)?\n([\s\S]*?)```/);
      if (codeMatch) {
        codeLanguage = codeMatch[1] || 'text';
        code = codeMatch[2];
      }
      
      // Prepare voice-friendly text (remove code blocks)
      const voiceText = responseText
        .replace(/```[\s\S]*?```/g, ' code block ')
        .replace(/[*_#`]/g, '')
        .substring(0, 500);
      
      // Generate TTS audio for Indian languages
      let audioBase64: string | undefined;
      let ttsVoice: string | undefined;
      
      const indianLanguages = ['hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa', 'or', 'en', 'ur'];
      if (indianLanguages.includes(language)) {
        try {
          const voice = input.voice || DEFAULT_VOICES[language as BaniLanguage] || 'anushka';
          const ttsResult = await bani.tts.synthesize(voiceText, language as BaniLanguage, voice as SarvamVoice, preferFree);
          audioBase64 = ttsResult.audioBase64;
          ttsVoice = ttsResult.voice;
        } catch (error) {
          console.error('TTS failed:', error);
        }
      }
      
      return {
        text: responseText,
        voice: voiceText,
        audioBase64,
        code,
        codeLanguage,
        intent,
        confidence,
        language,
        ttsVoice,
        processingTime: Date.now() - startTime
      };
    },
    
    textToSpeech: async (_: any, { input }: { input: any }) => {
      const voice = input.voice || DEFAULT_VOICES[input.language as BaniLanguage] || 'anushka';
      // Use synthesize with preferFree=true to use Piper first, fallback to Sarvam
      const preferFree = input.provider !== 'sarvam';

      const result = await bani.tts.synthesize(
        input.text,
        input.language as BaniLanguage,
        voice as SarvamVoice,
        preferFree
      );

      return {
        audioBase64: result.audioBase64,
        duration: result.duration,
        voice: result.voice,
        provider: result.provider
      };
    },
    
    speechToText: async (_: any, { input }: { input: any }) => {
      const audioBuffer = Buffer.from(input.audioBase64, 'base64');
      const language = input.language || 'hi';
      
      const result = input.provider === 'sarvam'
        ? await bani.stt.transcribeSarvam(audioBuffer, language as BaniLanguage)
        : await bani.stt.transcribeWhisper(audioBuffer, language as BaniLanguage);
      
      return {
        text: result.text,
        language: result.language,
        confidence: result.confidence,
        duration: result.duration,
        provider: result.provider
      };
    },
    
    translate: async (_: any, { input }: { input: any }) => {
      const result = await bani.translator.translate(
        input.text,
        input.sourceLanguage as BaniLanguage,
        input.targetLanguage as BaniLanguage
      );
      
      return {
        original: result.original,
        translated: result.translated,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
        cached: result.cached
      };
    },
    
    createVoiceClone: async (_: any, { input }: { input: any }) => {
      const audioBuffer = Buffer.from(input.audioBase64, 'base64');
      const result = await bani.voiceClone.createEmbedding(audioBuffer, input.language as BaniLanguage);
      return result.embeddingId;
    },
    
    synthesizeWithClone: async (_: any, { text, cloneId, language }: any) => {
      const result = await bani.voiceClone.synthesize(text, cloneId, language as BaniLanguage);
      return {
        audioBase64: result.audioBase64,
        duration: result.duration,
        voice: result.voice,
        provider: 'xtts'
      };
    }
  }
};

// ============================================================================
// SWAYAM WEBSOCKET HANDLER (MCP-ENABLED)
// ============================================================================

let swayamHandler: SwayamWebSocketHandler | null = null;

function initSwayamHandler(): SwayamWebSocketHandler {
  if (!swayamHandler) {
    swayamHandler = new SwayamWebSocketHandler({
      stt: {
        provider: 'sarvam',
        apiKey: process.env.SARVAM_API_KEY,
        serverUrl: 'http://localhost:7777',
      },
      tts: {
        provider: 'sarvam',
        apiKey: process.env.SARVAM_API_KEY,
        serverUrl: 'http://localhost:7777',
        defaultVoice: 'anushka',
      },
      ai: {
        proxyUrl: AI_PROXY_URL,
      },
      mcp: {
        enabled: true,
        logisticsRagUrl: process.env.LOGISTICS_RAG_URL || 'http://localhost:4005',
      },
      // Phase 12.1: Conversational Intelligence
      intelligence: {
        enabled: true,
        verdaccioUrl: 'http://localhost:4873',
        autoExecute: false,  // Require user confirmation for plans
      },
      // Wake Word Detection
      wakeWord: {
        enabled: true,
        keywords: ['hey swayam', 'swayam', 'हे स्वयं', 'ok swayam'],
        sensitivity: 0.7,
      },
      // Streaming TTS for low-latency responses
      streaming: {
        enabled: true,
        chunkSize: 150,     // Characters per TTS chunk
        maxConcurrent: 3,   // Parallel TTS requests
      },
    });
  }
  return swayamHandler;
}

// ============================================================================
// CREATE AND START SERVER
// ============================================================================

async function startServer() {
  const fastify = Fastify({
    logger: true,
  });

  // CORS
  await fastify.register(cors, { origin: true });

  // WebSocket support
  await fastify.register(websocket, {
    options: {
      maxPayload: 10 * 1024 * 1024, // 10MB for audio
    },
  });

  // GraphQL
  await fastify.register(mercurius, {
    schema,
    resolvers,
    graphiql: true,
    path: '/graphql',
  });

  // Health endpoint
  fastify.get('/health', async () => ({
    status: 'ok',
    service: 'swayam-api',
    version: '3.1.0',
    ttsProvider: globalTTSProvider,
    features: ['bani-tts', 'bani-stt', 'bani-translate', 'voice-clone', '21-languages', '30-voices', 'mcp-tools', 'learning'],
  }));

  // ============================================================================
  // ADMIN TTS PROVIDER TOGGLE API
  // ============================================================================

  // Get current TTS provider setting
  fastify.get('/api/admin/tts', async () => ({
    provider: globalTTSProvider,
    description: globalTTSProvider === 'sarvam'
      ? 'Sarvam Bulbul v2 (Premium - Natural Hindi voices)'
      : 'Free TTS (Piper/Edge - May sound artificial)',
    cost: globalTTSProvider === 'sarvam' ? '₹15 per 10,000 characters' : 'Free',
    quality: globalTTSProvider === 'sarvam' ? 'Premium (Natural)' : 'Basic (May be artificial)',
    voices: globalTTSProvider === 'sarvam' ? SARVAM_VOICES : ['piper-default', 'edge-swara', 'edge-madhur'],
  }));

  // Toggle TTS provider (Admin only)
  fastify.post('/api/admin/tts', async (req) => {
    const body = req.body as { provider: 'free' | 'sarvam' };

    if (!body.provider || !['free', 'sarvam'].includes(body.provider)) {
      return { error: 'Invalid provider. Use "free" or "sarvam"' };
    }

    const previousProvider = globalTTSProvider;
    setTTSProvider(body.provider);

    return {
      success: true,
      previousProvider,
      currentProvider: globalTTSProvider,
      message: globalTTSProvider === 'sarvam'
        ? '✅ Switched to Sarvam (Premium Hindi). Demo mode enabled.'
        : '✅ Switched to Free TTS. Cost-saving mode enabled.',
    };
  });

  // Quick toggle endpoint for frontend button
  fastify.post('/api/admin/tts/toggle', async () => {
    const previousProvider = globalTTSProvider;
    setTTSProvider(globalTTSProvider === 'sarvam' ? 'free' : 'sarvam');

    return {
      success: true,
      previousProvider,
      currentProvider: globalTTSProvider,
      message: globalTTSProvider === 'sarvam'
        ? '🎤 Demo Mode: Sarvam Premium Hindi enabled'
        : '💰 Cost Mode: Free TTS enabled',
    };
  });

  // Prometheus metrics endpoint
  fastify.get('/metrics', async (req, reply) => {
    const handler = initSwayamHandler();
    const stats = handler.getStats();
    const uptime = process.uptime();

    const metrics = `# HELP swayam_connections_total Total WebSocket connections
# TYPE swayam_connections_total counter
swayam_connections_total ${stats.connections}

# HELP swayam_active_clients Current active WebSocket clients
# TYPE swayam_active_clients gauge
swayam_active_clients ${stats.activeClients}

# HELP swayam_messages_total Total messages processed
# TYPE swayam_messages_total counter
swayam_messages_total ${stats.messages}

# HELP swayam_errors_total Total errors
# TYPE swayam_errors_total counter
swayam_errors_total ${stats.errors}

# HELP swayam_tool_calls_total Total MCP tool calls
# TYPE swayam_tool_calls_total counter
swayam_tool_calls_total ${stats.toolCalls}

# HELP swayam_tool_successes_total Successful MCP tool calls
# TYPE swayam_tool_successes_total counter
swayam_tool_successes_total ${stats.toolSuccesses}

# HELP swayam_wake_word_detections_total Wake word detections
# TYPE swayam_wake_word_detections_total counter
swayam_wake_word_detections_total ${stats.wakeWordDetections}

# HELP swayam_streaming_responses_total Streaming TTS responses
# TYPE swayam_streaming_responses_total counter
swayam_streaming_responses_total ${stats.streamingResponses}

# HELP swayam_uptime_seconds Service uptime in seconds
# TYPE swayam_uptime_seconds gauge
swayam_uptime_seconds ${Math.floor(uptime)}

# HELP swayam_mcp_tools_total Total registered MCP tools
# TYPE swayam_mcp_tools_total gauge
swayam_mcp_tools_total ${stats.totalTools}

# HELP nodejs_heap_used_bytes Node.js heap used
# TYPE nodejs_heap_used_bytes gauge
nodejs_heap_used_bytes ${process.memoryUsage().heapUsed}
`;

    reply.type('text/plain').send(metrics);
  });

  // Rate limiting map (simple in-memory)
  const rateLimits = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT = 100; // requests per minute
  const RATE_WINDOW = 60000; // 1 minute

  // Rate limiting hook
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip rate limiting for health/metrics endpoints
    if (request.url === '/health' || request.url === '/metrics') return;

    const ip = request.ip || 'unknown';
    const now = Date.now();
    const limit = rateLimits.get(ip);

    if (!limit || now > limit.resetTime) {
      rateLimits.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    } else {
      limit.count++;
      if (limit.count > RATE_LIMIT) {
        reply.code(429).send({ error: 'Too many requests', retryAfter: Math.ceil((limit.resetTime - now) / 1000) });
        return;
      }
    }

    // Clean up old entries periodically
    if (rateLimits.size > 10000) {
      for (const [key, val] of rateLimits) {
        if (now > val.resetTime) rateLimits.delete(key);
      }
    }
  });

  // ============================================================================
  // SWAYAM WEBSOCKET ROUTES
  // ============================================================================

  // Main Swayam WebSocket endpoint (MCP-enabled)
  // Note: @fastify/websocket v8 provides connection as SocketStream, use .socket for WebSocket
  fastify.get('/swayam', { websocket: true }, (connection, req) => {
    const handler = initSwayamHandler();
    console.log('🔗 New Swayam WebSocket connection from:', req.ip);
    handler.handleConnection(connection.socket);
  });

  // WowTruck WebSocket endpoint (alias with wowtruck persona hint)
  fastify.get('/wowtruck', { websocket: true }, (connection, req) => {
    const handler = initSwayamHandler();
    console.log('🚛 New WowTruck WebSocket connection from:', req.ip);
    handler.handleConnection(connection.socket);
  });

  // ComplyMitra WebSocket endpoint
  fastify.get('/complymitra', { websocket: true }, (connection, req) => {
    const handler = initSwayamHandler();
    console.log('📋 New ComplyMitra WebSocket connection from:', req.ip);
    handler.handleConnection(connection.socket);
  });

  // FreightBox WebSocket endpoint
  fastify.get('/freightbox', { websocket: true }, (connection, req) => {
    const handler = initSwayamHandler();
    console.log('📦 New FreightBox WebSocket connection from:', req.ip);
    handler.handleConnection(connection.socket);
  });

  // ERP WebSocket endpoint
  fastify.get('/erp', { websocket: true }, (connection, req) => {
    const handler = initSwayamHandler();
    console.log('💼 New ERP WebSocket connection from:', req.ip);
    handler.handleConnection(connection.socket);
  });

  // CRM WebSocket endpoint
  fastify.get('/crm', { websocket: true }, (connection, req) => {
    const handler = initSwayamHandler();
    console.log('👥 New CRM WebSocket connection from:', req.ip);
    handler.handleConnection(connection.socket);
  });

  // BANI Voice WebSocket endpoint
  fastify.get('/bani', { websocket: true }, (connection, req) => {
    const handler = initSwayamHandler();
    console.log('🎤 New BANI Voice WebSocket connection from:', req.ip);
    handler.handleConnection(connection.socket);
  });

  // Saathi (Driver) WebSocket endpoint
  fastify.get('/saathi', { websocket: true }, (connection, req) => {
    const handler = initSwayamHandler();
    console.log('🚚 New Saathi WebSocket connection from:', req.ip);
    handler.handleConnection(connection.socket);
  });

  // MCP Stats endpoint
  fastify.get('/mcp/stats', async () => {
    const handler = initSwayamHandler();
    return handler.getStats();
  });

  // MCP Tools endpoint
  fastify.get('/mcp/tools', async () => {
    const handler = initSwayamHandler();
    return {
      tools: handler.getAvailableTools(),
      count: handler.getAvailableTools().length,
    };
  });

  // MCP Execute endpoint - test tool execution directly
  fastify.post('/mcp/execute', async (req, reply) => {
    const body = req.body as { tool: string; params?: Record<string, any> };
    const handler = initSwayamHandler();

    try {
      const result = await handler.executeToolDirect(body.tool, body.params || {});
      return { success: true, tool: body.tool, result };
    } catch (error) {
      reply.code(500).send({
        success: false,
        tool: body.tool,
        error: error instanceof Error ? error.message : 'Tool execution failed'
      });
    }
  });

  // Phase 12.1: Intelligence capabilities endpoint
  fastify.get('/intelligence/capabilities', async () => {
    const handler = initSwayamHandler();
    return handler.getIntelligenceCapabilities();
  });

  // Phase 12.1: Active plans endpoint
  fastify.get('/intelligence/plans', async () => {
    const handler = initSwayamHandler();
    return { plans: handler.getActivePlans() };
  });

  // ============================================================================
  // LEARNING API ENDPOINTS
  // ============================================================================

  // Import learning functions
  const { Pool } = await import('pg');
  const learningPool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'ankr',
    password: process.env.PGPASSWORD || 'indrA@0612',
    database: process.env.PGDATABASE || 'ankr_eon',
    max: 5,
  });

  // Learning Analytics endpoint
  fastify.get('/api/learning/analytics', async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [events, tools, patterns, personas] = await Promise.all([
        learningPool.query(
          `SELECT
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE outcome = 'success') as successful,
             COUNT(DISTINCT session_id) as sessions,
             COUNT(DISTINCT persona) as personas
           FROM learning_events
           WHERE created_at >= $1`,
          [sevenDaysAgo]
        ),
        learningPool.query(
          `SELECT
             tool_name,
             COUNT(*) as calls,
             COUNT(*) FILTER (WHERE success = true) as successful,
             AVG(duration_ms)::integer as avg_duration
           FROM tool_usage
           WHERE created_at >= $1
           GROUP BY tool_name
           ORDER BY calls DESC
           LIMIT 10`,
          [sevenDaysAgo]
        ),
        learningPool.query(
          `SELECT
             COUNT(*) as total,
             AVG(confidence)::decimal(3,2) as avg_confidence,
             SUM(occurrences) as total_occurrences
           FROM learning_patterns`
        ),
        learningPool.query(
          `SELECT persona, COUNT(*) as count
           FROM learning_events
           WHERE created_at >= $1 AND persona IS NOT NULL
           GROUP BY persona
           ORDER BY count DESC
           LIMIT 8`,
          [sevenDaysAgo]
        ),
      ]);

      // Get top patterns
      const topPatterns = await learningPool.query(
        `SELECT name, confidence, occurrences, last_seen
         FROM learning_patterns
         ORDER BY confidence DESC, occurrences DESC
         LIMIT 10`
      );

      return {
        events: events.rows[0],
        topTools: tools.rows,
        patterns: patterns.rows[0],
        topPatterns: topPatterns.rows,
        topPersonas: personas.rows,
      };
    } catch (error) {
      console.error('Learning analytics error:', error);
      return { error: 'Failed to fetch analytics' };
    }
  });

  // Learning patterns endpoint
  fastify.get('/api/learning/patterns', async () => {
    try {
      const result = await learningPool.query(
        `SELECT name, description, confidence, occurrences, last_seen
         FROM learning_patterns
         ORDER BY confidence DESC, occurrences DESC
         LIMIT 50`
      );
      return { patterns: result.rows };
    } catch (error) {
      return { error: 'Failed to fetch patterns' };
    }
  });

  // Learning events endpoint
  fastify.get('/api/learning/events', async (req) => {
    const query = req.query as { limit?: string; offset?: string; type?: string };
    const limit = Math.min(parseInt(query.limit || '50'), 100);
    const offset = parseInt(query.offset || '0');

    try {
      const result = await learningPool.query(
        `SELECT id, event_type, source, persona, session_id, outcome, duration_ms, created_at
         FROM learning_events
         WHERE ($1::text IS NULL OR event_type = $1)
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [query.type || null, limit, offset]
      );
      return { events: result.rows };
    } catch (error) {
      return { error: 'Failed to fetch events' };
    }
  });

  // Tool usage endpoint
  fastify.get('/api/learning/tools', async (req) => {
    const query = req.query as { limit?: string };
    const limit = Math.min(parseInt(query.limit || '20'), 50);

    try {
      const result = await learningPool.query(
        `SELECT
           tool_name,
           COUNT(*) as total_calls,
           COUNT(*) FILTER (WHERE success = true) as successful,
           AVG(duration_ms)::integer as avg_duration,
           MAX(created_at) as last_used
         FROM tool_usage
         GROUP BY tool_name
         ORDER BY total_calls DESC
         LIMIT $1`,
        [limit]
      );
      return { tools: result.rows };
    } catch (error) {
      return { error: 'Failed to fetch tool usage' };
    }
  });

  // Run daily aggregation endpoint (for cron job)
  fastify.post('/api/learning/aggregate', async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Aggregate events
      const eventStats = await learningPool.query(
        `SELECT
           COUNT(*) as total_events,
           COUNT(DISTINCT session_id) as total_interactions
         FROM learning_events
         WHERE created_at >= $1 AND created_at < $2`,
        [today, tomorrow]
      );

      // Aggregate tool usage
      const toolStats = await learningPool.query(
        `SELECT
           COUNT(*) as tool_calls,
           COUNT(*) FILTER (WHERE success = true) as successful_tools
         FROM tool_usage
         WHERE created_at >= $1 AND created_at < $2`,
        [today, tomorrow]
      );

      // Aggregate patterns
      const patternStats = await learningPool.query(
        `SELECT COUNT(*) as patterns_discovered, AVG(confidence)::decimal(3,2) as avg_confidence
         FROM learning_patterns
         WHERE last_seen >= $1`,
        [today]
      );

      // Upsert daily analytics
      await learningPool.query(
        `INSERT INTO learning_analytics
         (date, total_events, total_interactions, tool_calls, successful_tools, patterns_discovered, avg_confidence)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (date) DO UPDATE SET
           total_events = EXCLUDED.total_events,
           total_interactions = EXCLUDED.total_interactions,
           tool_calls = EXCLUDED.tool_calls,
           successful_tools = EXCLUDED.successful_tools,
           patterns_discovered = EXCLUDED.patterns_discovered,
           avg_confidence = EXCLUDED.avg_confidence`,
        [
          today,
          eventStats.rows[0]?.total_events || 0,
          eventStats.rows[0]?.total_interactions || 0,
          toolStats.rows[0]?.tool_calls || 0,
          toolStats.rows[0]?.successful_tools || 0,
          patternStats.rows[0]?.patterns_discovered || 0,
          patternStats.rows[0]?.avg_confidence || 0,
        ]
      );

      return { success: true, date: today.toISOString().split('T')[0] };
    } catch (error) {
      console.error('Aggregation error:', error);
      return { error: 'Aggregation failed' };
    }
  });

  // ========== API Key Management ==========

  // List all API keys
  fastify.get('/api/keys', async () => {
    try {
      const result = await learningPool.query(
        `SELECT key_id, name, persona, rate_limit, status, created_at, last_used_at, total_requests
         FROM swayam_api_keys
         ORDER BY created_at DESC`
      );
      return { keys: result.rows };
    } catch (error) {
      console.error('API keys fetch error:', error);
      return { error: 'Failed to fetch API keys' };
    }
  });

  // Create new API key
  fastify.post('/api/keys', async (req) => {
    const body = req.body as { name: string; persona?: string; rate_limit?: number };
    try {
      const keyId = 'sw_' + Math.random().toString(36).substr(2, 16);
      await learningPool.query(
        `INSERT INTO swayam_api_keys (key_id, name, persona, rate_limit)
         VALUES ($1, $2, $3, $4)`,
        [keyId, body.name, body.persona || 'all', body.rate_limit || 100]
      );
      return { success: true, key_id: keyId };
    } catch (error) {
      console.error('API key creation error:', error);
      return { error: 'Failed to create API key' };
    }
  });

  // Delete API key
  fastify.delete('/api/keys/:keyId', async (req) => {
    const { keyId } = req.params as { keyId: string };
    try {
      await learningPool.query(
        `DELETE FROM swayam_api_keys WHERE key_id = $1`,
        [keyId]
      );
      return { success: true };
    } catch (error) {
      console.error('API key deletion error:', error);
      return { error: 'Failed to delete API key' };
    }
  });

  // Update API key
  fastify.patch('/api/keys/:keyId', async (req) => {
    const { keyId } = req.params as { keyId: string };
    const body = req.body as { name?: string; status?: string; rate_limit?: number };
    try {
      const updates: string[] = [];
      const values: (string | number)[] = [];
      let paramIndex = 1;

      if (body.name) { updates.push(`name = $${paramIndex++}`); values.push(body.name); }
      if (body.status) { updates.push(`status = $${paramIndex++}`); values.push(body.status); }
      if (body.rate_limit) { updates.push(`rate_limit = $${paramIndex++}`); values.push(body.rate_limit); }

      if (updates.length === 0) return { error: 'No updates provided' };

      values.push(keyId);
      await learningPool.query(
        `UPDATE swayam_api_keys SET ${updates.join(', ')} WHERE key_id = $${paramIndex}`,
        values
      );
      return { success: true };
    } catch (error) {
      console.error('API key update error:', error);
      return { error: 'Failed to update API key' };
    }
  });

  // Log API usage
  fastify.post('/api/usage', async (req) => {
    const body = req.body as {
      key_id: string;
      persona: string;
      language: string;
      source: string;
      latency_ms: number;
      status: string;
    };
    try {
      await learningPool.query(
        `INSERT INTO swayam_api_usage (key_id, persona, language, source, latency_ms, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [body.key_id, body.persona, body.language, body.source, body.latency_ms, body.status]
      );
      // Update key usage stats
      await learningPool.query(
        `UPDATE swayam_api_keys SET total_requests = total_requests + 1, last_used_at = NOW()
         WHERE key_id = $1`,
        [body.key_id]
      );
      return { success: true };
    } catch (error) {
      console.error('API usage log error:', error);
      return { error: 'Failed to log usage' };
    }
  });

  // Get usage analytics
  fastify.get('/api/usage/stats', async (req) => {
    const { days = '7' } = req.query as { days?: string };
    try {
      const result = await learningPool.query(
        `SELECT
           DATE(created_at) as date,
           COUNT(*) as requests,
           COUNT(DISTINCT key_id) as unique_keys,
           AVG(latency_ms)::int as avg_latency,
           COUNT(*) FILTER (WHERE status = 'success') as successful,
           COUNT(*) FILTER (WHERE status = 'error') as failed
         FROM swayam_api_usage
         WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
         GROUP BY DATE(created_at)
         ORDER BY date DESC`
      );
      return { stats: result.rows };
    } catch (error) {
      console.error('Usage stats error:', error);
      return { error: 'Failed to fetch usage stats' };
    }
  });

  // Get top languages
  fastify.get('/api/usage/languages', async (req) => {
    const { days = '7' } = req.query as { days?: string };
    try {
      const result = await learningPool.query(
        `SELECT
           language,
           COUNT(*) as count,
           ROUND(COUNT(*)::decimal / SUM(COUNT(*)) OVER() * 100, 1) as percentage
         FROM swayam_api_usage
         WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
         GROUP BY language
         ORDER BY count DESC
         LIMIT 10`
      );
      return { languages: result.rows };
    } catch (error) {
      console.error('Language stats error:', error);
      return { error: 'Failed to fetch language stats' };
    }
  });

  // Get top personas
  fastify.get('/api/usage/personas', async (req) => {
    const { days = '7' } = req.query as { days?: string };
    try {
      const result = await learningPool.query(
        `SELECT
           persona,
           COUNT(*) as requests,
           COUNT(DISTINCT key_id) as unique_keys,
           AVG(latency_ms)::int as avg_latency
         FROM swayam_api_usage
         WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
         GROUP BY persona
         ORDER BY requests DESC`
      );
      return { personas: result.rows };
    } catch (error) {
      console.error('Persona stats error:', error);
      return { error: 'Failed to fetch persona stats' };
    }
  });

  // ========== Channel Webhooks ==========

  // WhatsApp Twilio webhook
  fastify.post('/webhook/whatsapp/twilio', async (req, reply) => {
    try {
      const { handleTwilioWebhook } = await import('../packages/channels/whatsapp');
      const twiml = await handleTwilioWebhook(req.body as {
        From: string; To: string; Body?: string; MediaUrl0?: string; NumMedia?: string;
      });
      reply.type('text/xml').send(twiml);
    } catch (error) {
      console.error('WhatsApp webhook error:', error);
      reply.code(500).send('<?xml version="1.0"?><Response><Message>Error</Message></Response>');
    }
  });

  // WhatsApp Meta webhook (GET for verification)
  fastify.get('/webhook/whatsapp/meta', async (req) => {
    const { verifyMetaWebhook } = await import('../packages/channels/whatsapp');
    const challenge = verifyMetaWebhook(req.query as {
      'hub.mode'?: string; 'hub.verify_token'?: string; 'hub.challenge'?: string;
    });
    return challenge || { error: 'Verification failed' };
  });

  // WhatsApp Meta webhook (POST for messages)
  fastify.post('/webhook/whatsapp/meta', async (req) => {
    const { handleMetaWebhook } = await import('../packages/channels/whatsapp');
    return handleMetaWebhook(req.body as Parameters<typeof handleMetaWebhook>[0]);
  });

  // Telegram webhook
  fastify.post('/webhook/telegram', async (req) => {
    const { handleWebhook } = await import('../packages/channels/telegram');
    return handleWebhook(req.body as Parameters<typeof handleWebhook>[0]);
  });

  // Slack Events API webhook
  fastify.post('/webhook/slack/events', async (req, reply) => {
    const { handleEventWebhook, verifySignature } = await import('../packages/channels/slack');

    // Verify signature
    const signature = req.headers['x-slack-signature'] as string;
    const timestamp = req.headers['x-slack-request-timestamp'] as string;
    if (signature && timestamp) {
      const body = JSON.stringify(req.body);
      if (!verifySignature(signature, timestamp, body)) {
        return reply.code(401).send({ error: 'Invalid signature' });
      }
    }

    return handleEventWebhook(req.body as Parameters<typeof handleEventWebhook>[0]);
  });

  // Slack slash command
  fastify.post('/webhook/slack/command', async (req) => {
    const { handleSlashCommand } = await import('../packages/channels/slack');
    return handleSlashCommand(req.body as Parameters<typeof handleSlashCommand>[0]);
  });

  // Slack interactive components
  fastify.post('/webhook/slack/interactive', async (req) => {
    const { handleInteractive } = await import('../packages/channels/slack');
    const body = req.body as { payload?: string };
    const payload = body.payload ? JSON.parse(body.payload) : req.body;
    return handleInteractive(payload);
  });

  // Get channel integrations config
  fastify.get('/api/channels', async () => {
    try {
      const result = await learningPool.query(
        `SELECT channel, enabled, config, webhook_url, updated_at FROM channel_integrations ORDER BY channel`
      );
      return { channels: result.rows };
    } catch (error) {
      return { error: 'Failed to fetch channels' };
    }
  });

  // Update channel integration
  fastify.patch('/api/channels/:channel', async (req) => {
    const { channel } = req.params as { channel: string };
    const body = req.body as { enabled?: boolean; config?: Record<string, unknown>; webhook_url?: string };
    try {
      await learningPool.query(
        `UPDATE channel_integrations
         SET enabled = COALESCE($1, enabled),
             config = COALESCE($2, config),
             webhook_url = COALESCE($3, webhook_url),
             updated_at = NOW()
         WHERE channel = $4`,
        [body.enabled, body.config ? JSON.stringify(body.config) : null, body.webhook_url, channel]
      );
      return { success: true };
    } catch (error) {
      return { error: 'Failed to update channel' };
    }
  });

  // Channel analytics
  fastify.get('/api/channels/analytics', async (req) => {
    const { days = '7' } = req.query as { days?: string };
    try {
      const result = await learningPool.query(
        `SELECT
           channel,
           COUNT(*) as total_messages,
           COUNT(DISTINCT channel_user_id) as unique_users,
           COUNT(*) FILTER (WHERE message_type = 'incoming') as incoming,
           COUNT(*) FILTER (WHERE message_type = 'outgoing') as outgoing,
           COUNT(*) FILTER (WHERE success = true) as successful
         FROM channel_analytics
         WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
         GROUP BY channel
         ORDER BY total_messages DESC`
      );
      return { analytics: result.rows };
    } catch (error) {
      return { error: 'Failed to fetch analytics' };
    }
  });

  // TTS endpoint for streaming audio
  fastify.post('/tts', async (req, reply) => {
    const body = req.body as { text: string; language: string; voice?: string; provider?: string };
    try {
      // Use admin TTS setting unless explicitly overridden
      const preferFree = body.provider
        ? body.provider !== 'sarvam'
        : (globalTTSProvider === 'free');
      const result = await bani.tts.synthesize(
        body.text,
        body.language as BaniLanguage,
        body.voice as SarvamVoice,
        preferFree
      );
      return {
        audio: result.audioBase64,
        audioBase64: result.audioBase64,
        duration: result.duration,
        voice: result.voice,
        provider: result.provider,
      };
    } catch (error) {
      console.error('TTS Error:', error);
      reply.code(500).send({ error: 'TTS synthesis failed', details: String(error) });
    }
  });

  // Serve frontend HTML
  fastify.get('/', async (req, reply) => {
    const fs = await import('fs');
    const path = await import('path');
    const frontendPath = path.join(process.cwd(), 'frontend-v5.html');
    try {
      const html = fs.readFileSync(frontendPath, 'utf-8');
      reply.type('text/html').send(html);
    } catch (e) {
      reply.code(404).send({ error: 'Frontend not found' });
    }
  });

  const port = parseInt(process.env.PORT || String(getPort('swayam-bani')));
  await fastify.listen({ port, host: '0.0.0.0' });

  // Initialize MCP handler eagerly
  initSwayamHandler();

  console.log(`
  🎙️ Swayam Universal Gateway v3.1 (Self-Evolving)
  ═══════════════════════════════════════════════════
  GraphQL:    http://localhost:${port}/graphql
  GraphiQL:   http://localhost:${port}/graphiql
  Health:     http://localhost:${port}/health

  🔊 TTS Provider: ${globalTTSProvider === 'sarvam' ? 'Sarvam (Premium)' : 'Free (Piper/Edge)'}
     Toggle: POST http://localhost:${port}/api/admin/tts/toggle
     Set:    POST http://localhost:${port}/api/admin/tts {"provider": "sarvam"|"free"}
     Status: GET  http://localhost:${port}/api/admin/tts

  WebSocket Personas (8 endpoints):
  🔗 ws://localhost:${port}/swayam      (Universal AI)
  🚛 ws://localhost:${port}/wowtruck    (Logistics TMS)
  📋 ws://localhost:${port}/complymitra (Compliance)
  📦 ws://localhost:${port}/freightbox  (Shipping)
  💼 ws://localhost:${port}/erp         (ERP Bharat)
  👥 ws://localhost:${port}/crm         (CRM Saathi)
  🎤 ws://localhost:${port}/bani        (Voice AI)
  🚚 ws://localhost:${port}/saathi      (Driver Assistant)

  MCP Tools:
  📊 http://localhost:${port}/mcp/stats
  🔧 http://localhost:${port}/mcp/tools (53 tools)
  🔨 POST http://localhost:${port}/mcp/execute

  Learning & Self-Evolution:
  📈 http://localhost:${port}/api/learning/analytics
  📋 http://localhost:${port}/api/learning/patterns
  📝 http://localhost:${port}/api/learning/events
  🔧 http://localhost:${port}/api/learning/tools
  🕐 POST http://localhost:${port}/api/learning/aggregate (cron)
  📊 Dashboard: /learning-dashboard.html

  Features:
  ✅ 8 AI Personas with tool filtering
  ✅ 21 Languages (11 Indian + 10 European)
  ✅ 53 MCP Tools (Compliance, Finance, Fleet, Shipping)
  ✅ Piper TTS (FREE, local)
  ✅ FREE-FIRST AI Routing
  ✅ Voice Cloning (XTTS)
  ✅ Self-Evolution with Learning Pipeline
  `);
}

startServer().catch(console.error);

export { schema, resolvers };
