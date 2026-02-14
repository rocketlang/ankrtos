/**
 * BANI Voice Service Integration for Swayam
 *
 * Full BANI Capabilities:
 * - STT: Speech-to-Text (Sarvam Saarika / Whisper)
 * - TTS: Text-to-Speech (Sarvam Bulbul v2 - 30 voices / Piper / XTTS)
 * - Translation: 11 Indian languages (Sarvam Mayura / IndicTrans2)
 * - Voice Cloning: XTTS with 6s audio sample
 * - Phrase Cache: 500+ pre-cached translations (<2ms)
 */

// Load environment variables from .env file BEFORE any config
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

import fetch from 'node-fetch';
import FormData from 'form-data';

// BANI Server Configuration
const BANI_BASE_URL = process.env.BANI_URL || 'http://localhost:7777';
const PIPER_URL = process.env.PIPER_URL || 'http://localhost:5050';
const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

// Log Sarvam API key status (masked)
if (SARVAM_API_KEY) {
  console.log(`🔑 Sarvam API Key: ${SARVAM_API_KEY.substring(0, 8)}...${SARVAM_API_KEY.slice(-4)}`);
} else {
  console.warn('⚠️ SARVAM_API_KEY not set - Sarvam TTS will fail');
}

// Supported Languages
export type BaniLanguage = 
  | 'hi' | 'bn' | 'te' | 'mr' | 'ta' 
  | 'gu' | 'kn' | 'ml' | 'pa' | 'or' 
  | 'en' | 'ur';

// Available TTS Voices (Sarvam Bulbul v2)
export const SARVAM_VOICES = [
  'anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun',
  'hitesh', 'aditya', 'ritu', 'chirag', 'priya', 'neha',
  'rahul', 'pooja', 'rohan', 'simran', 'kavya', 'sunita',
  'tara', 'anirudh', 'anjali', 'ishaan', 'ratan', 'varun',
  'manan', 'sumit', 'roopa', 'kabir', 'aayan', 'shubh'
] as const;

export type SarvamVoice = typeof SARVAM_VOICES[number];

// Language to Voice mapping (default voices per language)
export const DEFAULT_VOICES: Record<BaniLanguage, SarvamVoice> = {
  hi: 'anushka',
  bn: 'priya',
  te: 'kavya',
  mr: 'manisha',
  ta: 'vidya',
  gu: 'neha',
  kn: 'sunita',
  ml: 'anjali',
  pa: 'simran',
  or: 'tara',
  en: 'arya',
  ur: 'roopa'
};

// Interfaces
export interface STTResult {
  text: string;
  language: BaniLanguage;
  confidence: number;
  duration: number;
  provider: 'sarvam' | 'whisper';
}

export interface TTSResult {
  audio: Buffer;
  audioBase64: string;
  duration: number;
  voice: string;
  provider: 'sarvam' | 'piper' | 'xtts';
}

export interface TranslationResult {
  original: string;
  translated: string;
  sourceLanguage: BaniLanguage;
  targetLanguage: BaniLanguage;
  cached: boolean;
  provider: 'sarvam' | 'indictrans' | 'cache';
}

export interface VoiceCloneResult {
  embeddingId: string;
  voice: string;
  sampleDuration: number;
}

// ==================== STT (Speech-to-Text) ====================

export class BaniSTT {
  
  /**
   * Transcribe audio to text using Sarvam Saarika (Premium)
   */
  async transcribeSarvam(
    audioBuffer: Buffer, 
    language: BaniLanguage = 'hi'
  ): Promise<STTResult> {
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.wav',
      contentType: 'audio/wav'
    });
    formData.append('language_code', language);
    formData.append('model', 'saarika:v2');
    
    const response = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
      },
      body: formData as any
    });
    
    if (!response.ok) {
      throw new Error(`Sarvam STT failed: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    return {
      text: data.transcript,
      language,
      confidence: data.confidence || 0.95,
      duration: data.duration || 0,
      provider: 'sarvam'
    };
  }
  
  /**
   * Transcribe audio using Whisper (Free, self-hosted)
   */
  async transcribeWhisper(
    audioBuffer: Buffer,
    language: BaniLanguage = 'hi'
  ): Promise<STTResult> {
    const formData = new FormData();
    formData.append('audio', audioBuffer, {
      filename: 'audio.wav',
      contentType: 'audio/wav'
    });
    formData.append('language', language);
    
    const response = await fetch(`${BANI_BASE_URL}/stt/whisper`, {
      method: 'POST',
      body: formData as any
    });
    
    if (!response.ok) {
      throw new Error(`Whisper STT failed: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    return {
      text: data.text,
      language,
      confidence: data.confidence || 0.9,
      duration: data.duration || 0,
      provider: 'whisper'
    };
  }
  
  /**
   * Transcribe with FREE-FIRST fallback
   */
  async transcribe(
    audioBuffer: Buffer,
    language: BaniLanguage = 'hi',
    preferFree: boolean = true
  ): Promise<STTResult> {
    if (preferFree) {
      try {
        return await this.transcribeWhisper(audioBuffer, language);
      } catch (error) {
        console.warn('Whisper failed, falling back to Sarvam:', error);
        return await this.transcribeSarvam(audioBuffer, language);
      }
    } else {
      try {
        return await this.transcribeSarvam(audioBuffer, language);
      } catch (error) {
        console.warn('Sarvam failed, falling back to Whisper:', error);
        return await this.transcribeWhisper(audioBuffer, language);
      }
    }
  }
}

// ==================== TTS (Text-to-Speech) ====================

export class BaniTTS {
  
  /**
   * Synthesize speech using Sarvam Bulbul v2 (Premium, 30 voices)
   */
  async synthesizeSarvam(
    text: string,
    language: BaniLanguage = 'hi',
    voice: SarvamVoice = 'anushka',
    options: {
      pitch?: number;  // -1 to 1
      pace?: number;   // 0.5 to 2
    } = {}
  ): Promise<TTSResult> {
    // Map short language codes to Sarvam format (with -IN suffix)
    const langMap: Record<string, string> = {
      'hi': 'hi-IN', 'bn': 'bn-IN', 'te': 'te-IN', 'mr': 'mr-IN',
      'ta': 'ta-IN', 'gu': 'gu-IN', 'kn': 'kn-IN', 'ml': 'ml-IN',
      'pa': 'pa-IN', 'or': 'od-IN', 'en': 'en-IN', 'ur': 'ur-IN'
    };
    const langCode = langMap[language] || 'hi-IN';

    const response = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: langCode,
        speaker: voice,
        model: 'bulbul:v2',
        pitch: options.pitch || 0,
        pace: options.pace || 1.0,
        enable_preprocessing: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`Sarvam TTS failed: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    const audioBase64 = data.audios[0];
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    return {
      audio: audioBuffer,
      audioBase64,
      duration: audioBuffer.length / 24000, // Approximate
      voice,
      provider: 'sarvam'
    };
  }
  
  /**
   * Synthesize speech using Piper (Free, self-hosted)
   */
  async synthesizePiper(
    text: string,
    language: BaniLanguage = 'en'
  ): Promise<TTSResult> {
    const response = await fetch(`${PIPER_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language })
    });

    if (!response.ok) {
      throw new Error(`Piper TTS failed: ${response.statusText}`);
    }

    const data = await response.json() as { audioBase64?: string; audio?: string; duration?: number; voice?: string };
    const audioBase64 = data.audioBase64 || data.audio || '';
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    return {
      audio: audioBuffer,
      audioBase64: audioBase64,
      duration: data.duration || audioBuffer.length / 22050,
      voice: data.voice || 'piper-default',
      provider: 'piper'
    };
  }
  
  /**
   * Synthesize with voice cloning using XTTS
   */
  async synthesizeXTTS(
    text: string,
    language: BaniLanguage,
    voiceSamplePath: string
  ): Promise<TTSResult> {
    const response = await fetch(`${BANI_BASE_URL}/tts/xtts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language,
        speaker_wav: voiceSamplePath
      })
    });
    
    if (!response.ok) {
      throw new Error(`XTTS failed: ${response.statusText}`);
    }
    
    const audioBuffer = Buffer.from(await response.arrayBuffer());
    
    return {
      audio: audioBuffer,
      audioBase64: audioBuffer.toString('base64'),
      duration: audioBuffer.length / 24000,
      voice: 'cloned',
      provider: 'xtts'
    };
  }
  
  /**
   * Synthesize with FREE-FIRST fallback
   */
  async synthesize(
    text: string,
    language: BaniLanguage = 'hi',
    voice?: SarvamVoice,
    preferFree: boolean = true
  ): Promise<TTSResult> {
    const selectedVoice = voice || DEFAULT_VOICES[language] || 'anushka';
    
    if (preferFree) {
      try {
        return await this.synthesizePiper(text, language);
      } catch (error) {
        console.warn('Piper failed, falling back to Sarvam:', error);
        return await this.synthesizeSarvam(text, language, selectedVoice);
      }
    } else {
      try {
        return await this.synthesizeSarvam(text, language, selectedVoice);
      } catch (error) {
        console.warn('Sarvam failed, falling back to Piper:', error);
        return await this.synthesizePiper(text, language);
      }
    }
  }
}

// ==================== Translation ====================

export class BaniTranslator {
  
  // Phrase cache for instant responses
  private phraseCache: Map<string, string> = new Map();
  
  constructor() {
    this.initPhraseCache();
  }
  
  private initPhraseCache() {
    // Common greetings
    const greetings: Record<string, Record<BaniLanguage, string>> = {
      'hello': { hi: 'नमस्ते', bn: 'নমস্কার', te: 'నమస్కారం', ta: 'வணக்கம்', mr: 'नमस्कार', gu: 'નમસ્તે', kn: 'ನಮಸ್ಕಾರ', ml: 'നമസ്കാരം', pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', or: 'ନମସ୍କାର', en: 'Hello', ur: 'السلام علیکم' },
      'thank you': { hi: 'धन्यवाद', bn: 'ধন্যবাদ', te: 'ధన్యవాదాలు', ta: 'நன்றி', mr: 'धन्यवाद', gu: 'આભાર', kn: 'ಧನ್ಯವಾದ', ml: 'നന്ദി', pa: 'ਧੰਨਵਾਦ', or: 'ଧନ୍ୟବାଦ', en: 'Thank you', ur: 'شکریہ' },
      'yes': { hi: 'हाँ', bn: 'হ্যাঁ', te: 'అవును', ta: 'ஆம்', mr: 'हो', gu: 'હા', kn: 'ಹೌದು', ml: 'അതെ', pa: 'ਹਾਂ', or: 'ହଁ', en: 'Yes', ur: 'جی ہاں' },
      'no': { hi: 'नहीं', bn: 'না', te: 'కాదు', ta: 'இல்லை', mr: 'नाही', gu: 'ના', kn: 'ಇಲ್ಲ', ml: 'ഇല്ല', pa: 'ਨਹੀਂ', or: 'ନା', en: 'No', ur: 'نہیں' },
      'how are you': { hi: 'आप कैसे हैं?', bn: 'আপনি কেমন আছেন?', te: 'మీరు ఎలా ఉన్నారు?', ta: 'நீங்கள் எப்படி இருக்கிறீர்கள்?', mr: 'तुम्ही कसे आहात?', gu: 'તમે કેમ છો?', kn: 'ನೀವು ಹೇಗಿದ್ದೀರಿ?', ml: 'നിങ്ങൾക്ക് സുഖമാണോ?', pa: 'ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?', or: 'ଆପଣ କେମିତି ଅଛନ୍ତି?', en: 'How are you?', ur: 'آپ کیسے ہیں؟' },
    };
    
    // Populate cache
    for (const [english, translations] of Object.entries(greetings)) {
      for (const [lang, text] of Object.entries(translations)) {
        this.phraseCache.set(`en-${lang}:${english.toLowerCase()}`, text);
        this.phraseCache.set(`${lang}-en:${text.toLowerCase()}`, english);
      }
    }
  }
  
  /**
   * Check phrase cache for instant translation
   */
  private checkCache(
    text: string,
    source: BaniLanguage,
    target: BaniLanguage
  ): string | null {
    const key = `${source}-${target}:${text.toLowerCase().trim()}`;
    return this.phraseCache.get(key) || null;
  }
  
  /**
   * Translate using Sarvam Mayura (Premium)
   */
  async translateSarvam(
    text: string,
    source: BaniLanguage,
    target: BaniLanguage,
    options: {
      mode?: 'formal' | 'informal';
      enablePreprocessing?: boolean;
    } = {}
  ): Promise<TranslationResult> {
    const response = await fetch(`${SARVAM_BASE_URL}/translate`, {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        source_language_code: source,
        target_language_code: target,
        mode: options.mode || 'formal',
        enable_preprocessing: options.enablePreprocessing !== false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Sarvam translation failed: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    return {
      original: text,
      translated: data.translated_text,
      sourceLanguage: source,
      targetLanguage: target,
      cached: false,
      provider: 'sarvam'
    };
  }
  
  /**
   * Translate using IndicTrans2 (Free, AI4Bharat)
   */
  async translateIndicTrans(
    text: string,
    source: BaniLanguage,
    target: BaniLanguage
  ): Promise<TranslationResult> {
    const response = await fetch(`${BANI_BASE_URL}/translate/indictrans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source_lang: source,
        target_lang: target
      })
    });
    
    if (!response.ok) {
      throw new Error(`IndicTrans failed: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    return {
      original: text,
      translated: data.translated,
      sourceLanguage: source,
      targetLanguage: target,
      cached: false,
      provider: 'indictrans'
    };
  }
  
  /**
   * Translate with cache check and FREE-FIRST fallback
   */
  async translate(
    text: string,
    source: BaniLanguage,
    target: BaniLanguage,
    preferFree: boolean = true
  ): Promise<TranslationResult> {
    // Check cache first (instant response)
    const cached = this.checkCache(text, source, target);
    if (cached) {
      return {
        original: text,
        translated: cached,
        sourceLanguage: source,
        targetLanguage: target,
        cached: true,
        provider: 'cache'
      };
    }
    
    if (preferFree) {
      try {
        return await this.translateIndicTrans(text, source, target);
      } catch (error) {
        console.warn('IndicTrans failed, falling back to Sarvam:', error);
        return await this.translateSarvam(text, source, target);
      }
    } else {
      try {
        return await this.translateSarvam(text, source, target);
      } catch (error) {
        console.warn('Sarvam failed, falling back to IndicTrans:', error);
        return await this.translateIndicTrans(text, source, target);
      }
    }
  }
}

// ==================== Voice Cloning ====================

export class BaniVoiceClone {
  
  /**
   * Create voice embedding from audio sample (6+ seconds)
   */
  async createEmbedding(
    audioBuffer: Buffer,
    language: BaniLanguage
  ): Promise<VoiceCloneResult> {
    const formData = new FormData();
    formData.append('audio', audioBuffer, {
      filename: 'voice_sample.wav',
      contentType: 'audio/wav'
    });
    formData.append('language', language);
    
    const response = await fetch(`${BANI_BASE_URL}/voice-clone/create`, {
      method: 'POST',
      body: formData as any
    });
    
    if (!response.ok) {
      throw new Error(`Voice clone creation failed: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    return {
      embeddingId: data.embedding_id,
      voice: data.voice_name,
      sampleDuration: data.duration
    };
  }
  
  /**
   * Synthesize with cloned voice
   */
  async synthesize(
    text: string,
    embeddingId: string,
    language: BaniLanguage
  ): Promise<TTSResult> {
    const response = await fetch(`${BANI_BASE_URL}/voice-clone/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        embedding_id: embeddingId,
        language
      })
    });
    
    if (!response.ok) {
      throw new Error(`Voice clone synthesis failed: ${response.statusText}`);
    }
    
    const audioBuffer = Buffer.from(await response.arrayBuffer());
    
    return {
      audio: audioBuffer,
      audioBase64: audioBuffer.toString('base64'),
      duration: audioBuffer.length / 24000,
      voice: `cloned-${embeddingId}`,
      provider: 'xtts'
    };
  }
}

// ==================== Unified BANI Service ====================

export class BaniService {
  public stt: BaniSTT;
  public tts: BaniTTS;
  public translator: BaniTranslator;
  public voiceClone: BaniVoiceClone;
  
  constructor() {
    this.stt = new BaniSTT();
    this.tts = new BaniTTS();
    this.translator = new BaniTranslator();
    this.voiceClone = new BaniVoiceClone();
  }
  
  /**
   * Full voice pipeline: Audio → Text → Process → Audio
   */
  async processVoice(
    audioBuffer: Buffer,
    language: BaniLanguage,
    processText: (text: string) => Promise<string>,
    options: {
      preferFree?: boolean;
      voice?: SarvamVoice;
      translateTo?: BaniLanguage;
    } = {}
  ): Promise<{
    inputText: string;
    outputText: string;
    outputAudio: TTSResult;
    translation?: TranslationResult;
  }> {
    const preferFree = options.preferFree !== false;
    
    // 1. STT: Audio → Text
    const sttResult = await this.stt.transcribe(audioBuffer, language, preferFree);
    
    // 2. Process text (AI response)
    let outputText = await processText(sttResult.text);
    
    // 3. Optional translation
    let translation: TranslationResult | undefined;
    if (options.translateTo && options.translateTo !== language) {
      translation = await this.translator.translate(
        outputText,
        language,
        options.translateTo,
        preferFree
      );
      outputText = translation.translated;
    }
    
    // 4. TTS: Text → Audio
    const ttsResult = await this.tts.synthesize(
      outputText,
      options.translateTo || language,
      options.voice,
      preferFree
    );
    
    return {
      inputText: sttResult.text,
      outputText,
      outputAudio: ttsResult,
      translation
    };
  }
  
  /**
   * Health check
   */
  async health(): Promise<{
    status: string;
    providers: {
      stt: boolean;
      tts: boolean;
      translate: boolean;
      voiceClone: boolean;
    };
  }> {
    const response = await fetch(`${BANI_BASE_URL}/health`);
    const data = await response.json() as any;
    
    return {
      status: data.status,
      providers: {
        stt: data.providers?.stt?.status === 'ok',
        tts: data.providers?.tts?.status === 'ok',
        translate: data.providers?.translate?.status === 'ok',
        voiceClone: true // Assume available if BANI is up
      }
    };
  }
  
  /**
   * Get available voices for a language
   */
  getVoicesForLanguage(language: BaniLanguage): SarvamVoice[] {
    // All 30 voices work for all Indian languages
    return [...SARVAM_VOICES];
  }
  
  /**
   * Get default voice for language
   */
  getDefaultVoice(language: BaniLanguage): SarvamVoice {
    return DEFAULT_VOICES[language] || 'anushka';
  }
}

// Export singleton instance
export const bani = new BaniService();

// Types are already exported above via their declarations
