/**
 * STT (Speech-to-Text) Provider Factory
 */

export type SupportedLanguage = 'hi' | 'en' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'od';

export interface STTResult {
  text: string;
  confidence: number;
  language?: SupportedLanguage;
}

export interface STTProvider {
  name: string;
  transcribe(audio: Buffer, language?: SupportedLanguage): Promise<STTResult>;
}

export interface STTOptions {
  apiKey?: string;
  serverUrl?: string;
}

// Mock STT for testing
class MockSTTProvider implements STTProvider {
  name = 'mock';
  async transcribe(audio: Buffer, language: SupportedLanguage = 'hi'): Promise<STTResult> {
    await new Promise(r => setTimeout(r, 100));
    return { text: 'नमस्ते, यह एक टेस्ट है', confidence: 1.0, language };
  }
}

// Sarvam STT Provider
class SarvamSTTProvider implements STTProvider {
  name = 'sarvam';
  private apiKey: string;
  private serverUrl: string;

  constructor(options: STTOptions) {
    this.apiKey = options.apiKey || process.env.SARVAM_API_KEY || '';
    this.serverUrl = options.serverUrl || 'https://api.sarvam.ai';
  }

  async transcribe(audio: Buffer, language: SupportedLanguage = 'hi'): Promise<STTResult> {
    if (!this.apiKey) {
      return { text: '', confidence: 0, language };
    }

    try {
      const formData = new FormData();
      formData.append('audio', new Blob([audio]), 'audio.wav');
      formData.append('language_code', language);
      formData.append('model', 'saarika:v1');

      const response = await fetch(`${this.serverUrl}/speech-to-text`, {
        method: 'POST',
        headers: {
          'api-subscription-key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        console.error('Sarvam STT error:', response.status);
        return { text: '', confidence: 0, language };
      }

      const result = await response.json() as { transcript?: string; confidence?: number };
      return {
        text: result.transcript || '',
        confidence: result.confidence || 0.5,
        language,
      };
    } catch (error) {
      console.error('STT error:', error);
      return { text: '', confidence: 0, language };
    }
  }
}

// Whisper STT Provider (OpenAI compatible)
class WhisperSTTProvider implements STTProvider {
  name = 'whisper';
  private apiKey: string;
  private serverUrl: string;

  constructor(options: STTOptions) {
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY || '';
    this.serverUrl = options.serverUrl || 'https://api.openai.com/v1';
  }

  async transcribe(audio: Buffer, language: SupportedLanguage = 'hi'): Promise<STTResult> {
    if (!this.apiKey) {
      return { text: '', confidence: 0, language };
    }

    try {
      const formData = new FormData();
      formData.append('file', new Blob([audio]), 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', language);

      const response = await fetch(`${this.serverUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        return { text: '', confidence: 0, language };
      }

      const result = await response.json() as { text?: string };
      return {
        text: result.text || '',
        confidence: 0.8,
        language,
      };
    } catch (error) {
      console.error('Whisper error:', error);
      return { text: '', confidence: 0, language };
    }
  }
}

// Factory
export const STTFactory = {
  create(provider: 'sarvam' | 'whisper' | 'mock' = 'mock', options: STTOptions = {}): STTProvider {
    switch (provider) {
      case 'sarvam':
        return new SarvamSTTProvider(options);
      case 'whisper':
        return new WhisperSTTProvider(options);
      default:
        return new MockSTTProvider();
    }
  }
};

export default STTFactory;
