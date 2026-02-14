/**
 * TTS (Text-to-Speech) Provider Factory
 */

export type SupportedLanguage = 'hi' | 'en' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'od';

export interface TTSResult {
  audio: Buffer;
  duration?: number;
}

export interface TTSProvider {
  name: string;
  synthesize(text: string, language?: SupportedLanguage, voice?: string): Promise<TTSResult>;
}

export interface TTSOptions {
  apiKey?: string;
  serverUrl?: string;
  defaultVoice?: string;
}

// Mock TTS for testing
class MockTTSProvider implements TTSProvider {
  name = 'mock';
  async synthesize(text: string, language: SupportedLanguage = 'hi'): Promise<TTSResult> {
    await new Promise(r => setTimeout(r, 50));
    return { audio: Buffer.alloc(16000), duration: 1.0 };
  }
}

// Sarvam TTS Provider (11 Indian Languages)
class SarvamTTSProvider implements TTSProvider {
  name = 'sarvam';
  private apiKey: string;
  private serverUrl: string;
  private defaultVoice: string;

  constructor(options: TTSOptions) {
    this.apiKey = options.apiKey || process.env.SARVAM_API_KEY || '';
    this.serverUrl = options.serverUrl || 'https://api.sarvam.ai';
    this.defaultVoice = options.defaultVoice || 'anushka';
  }

  async synthesize(text: string, language: SupportedLanguage = 'hi', voice?: string): Promise<TTSResult> {
    if (!this.apiKey) {
      return { audio: Buffer.alloc(0), duration: 0 };
    }

    try {
      // Language code mapping for Sarvam
      const langCodes: Record<string, string> = {
        hi: 'hi-IN',
        en: 'en-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        pa: 'pa-IN',
        od: 'od-IN',
      };

      const response = await fetch(`${this.serverUrl}/text-to-speech`, {
        method: 'POST',
        headers: {
          'api-subscription-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: langCodes[language] || 'hi-IN',
          speaker: voice || this.defaultVoice,
          model: 'bulbul:v1',
          enable_preprocessing: true,
        }),
      });

      if (!response.ok) {
        console.error('Sarvam TTS error:', response.status);
        return { audio: Buffer.alloc(0), duration: 0 };
      }

      const result = await response.json() as { audios?: string[] };
      if (result.audios?.[0]) {
        const audio = Buffer.from(result.audios[0], 'base64');
        return { audio, duration: audio.length / 32000 }; // Rough estimate
      }

      return { audio: Buffer.alloc(0), duration: 0 };
    } catch (error) {
      console.error('TTS error:', error);
      return { audio: Buffer.alloc(0), duration: 0 };
    }
  }
}

// Piper TTS Provider (Local, Fast, Free)
class PiperTTSProvider implements TTSProvider {
  name = 'piper';
  private serverUrl: string;

  constructor(options: TTSOptions) {
    this.serverUrl = options.serverUrl || 'http://localhost:5000';
  }

  async synthesize(text: string, language: SupportedLanguage = 'hi'): Promise<TTSResult> {
    try {
      const response = await fetch(`${this.serverUrl}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        return { audio: Buffer.alloc(0), duration: 0 };
      }

      const arrayBuffer = await response.arrayBuffer();
      const audio = Buffer.from(arrayBuffer);
      return { audio, duration: audio.length / 22050 };
    } catch (error) {
      console.error('Piper TTS error:', error);
      return { audio: Buffer.alloc(0), duration: 0 };
    }
  }
}

// Sarvam Voice Options
export const SARVAM_VOICES = [
  'anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun',
  'hitesh', 'aditya', 'ritu', 'chirag', 'priya', 'neha',
  'rahul', 'pooja', 'rohan', 'simran', 'kavya', 'sunita'
];

// Factory
export const TTSFactory = {
  create(provider: 'sarvam' | 'piper' | 'mock' = 'mock', options: TTSOptions = {}): TTSProvider {
    switch (provider) {
      case 'sarvam':
        return new SarvamTTSProvider(options);
      case 'piper':
        return new PiperTTSProvider(options);
      default:
        return new MockTTSProvider();
    }
  }
};

export default TTSFactory;
