/**
 * QwenTTS Provider for Bani.ai
 * Integrates Qwen3-TTS for multilingual voice synthesis
 *
 * Features:
 * - 9 premium custom voices
 * - Voice cloning capability
 * - Instruction-based emotion control
 * - 10 languages (en, zh, ja, ko, de, fr, ru, pt, es, it)
 * - Voice library management
 *
 * @author ANKR Labs
 */

import type {
  TTSProvider, TTSProviderName, TTSResult,
  SupportedLanguage
} from '../types/index.js';

// ============================================================================
// Types
// ============================================================================

export const QWEN_CUSTOM_VOICES = [
  'custom_1', 'custom_2', 'custom_3', 'custom_4', 'custom_5',
  'custom_6', 'custom_7', 'custom_8', 'custom_9'
] as const;

export type QwenCustomVoice = typeof QWEN_CUSTOM_VOICES[number];

export type QwenModel =
  | 'Qwen3-TTS-12Hz-1.7B-CustomVoice'
  | 'Qwen3-TTS-12Hz-0.6B-CustomVoice'
  | 'Qwen3-TTS-12Hz-1.7B-VoiceDesign'
  | 'Qwen3-TTS-12Hz-1.7B-Base'
  | 'Qwen3-TTS-12Hz-0.6B-Base';

export interface QwenTTSConfig {
  bridgeUrl: string;
  defaultVoice?: QwenCustomVoice;
  defaultModel?: QwenModel;
  timeout?: number;
  enableVoiceCloning?: boolean;
  enableInstructions?: boolean;
}

export interface QwenSynthesizeRequest {
  text: string;
  language: string;
  voice?: string;
  instruction?: string;
  model?: QwenModel;
  max_tokens?: number;
  temperature?: number;
  do_sample?: boolean;
  streaming?: boolean;
}

export interface QwenSynthesizeResponse {
  audio: string; // base64-encoded
  format: string;
  sample_rate: number;
  duration_ms: number;
  voice_id?: string;
  model: string;
}

export interface VoiceInfo {
  voice_id: string;
  name: string;
  language: string;
  description?: string;
  created_at: string;
  embedding_path?: string;
}

// ============================================================================
// Language Mapping
// ============================================================================

const QWEN_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  // Qwen-supported languages
  en: 'en',

  // Map others to closest match or fallback
  hi: 'en', // Hindi -> fallback to English (use IndicF5 instead)
  ta: 'en', // Tamil -> fallback
  te: 'en', // Telugu -> fallback
  bn: 'en', // Bengali -> fallback
  mr: 'en', // Marathi -> fallback
  gu: 'en', // Gujarati -> fallback
  kn: 'en', // Kannada -> fallback
  ml: 'en', // Malayalam -> fallback
  pa: 'en', // Punjabi -> fallback
  or: 'en', // Odia -> fallback
};

// Languages where QwenTTS is recommended (not covered by IndicF5)
export const QWEN_PREFERRED_LANGUAGES = [
  'en', 'zh', 'ja', 'ko', 'de', 'fr', 'ru', 'pt', 'es', 'it'
];

// ============================================================================
// QwenTTS Provider
// ============================================================================

export class QwenTTS implements TTSProvider {
  name: TTSProviderName = 'qwen';
  private config: QwenTTSConfig;
  private voiceCache: Map<string, VoiceInfo> = new Map();

  constructor(config: QwenTTSConfig) {
    this.config = {
      timeout: 30000,
      enableVoiceCloning: true,
      enableInstructions: true,
      defaultVoice: 'custom_1',
      defaultModel: 'Qwen3-TTS-12Hz-1.7B-CustomVoice',
      ...config,
    };

    if (!this.config.bridgeUrl) {
      throw new Error('QwenTTS: bridgeUrl is required');
    }

    console.log('✅ QwenTTS initialized:', this.config.bridgeUrl);
  }

  /**
   * Check if language is supported
   * QwenTTS supports: en, zh, ja, ko, de, fr, ru, pt, es, it
   */
  supportsLanguage(language: SupportedLanguage): boolean {
    // Recommend QwenTTS for languages NOT covered by IndicF5
    return QWEN_PREFERRED_LANGUAGES.includes(language);
  }

  /**
   * Get available voices
   */
  getAvailableVoices(_language: SupportedLanguage): string[] {
    return [...QWEN_CUSTOM_VOICES];
  }

  /**
   * Synthesize speech from text
   */
  async synthesize(
    text: string,
    language: SupportedLanguage,
    voiceId?: string,
    options?: {
      instruction?: string;
      model?: QwenModel;
      temperature?: number;
    }
  ): Promise<TTSResult> {
    const startTime = Date.now();

    try {
      const request: QwenSynthesizeRequest = {
        text,
        language: QWEN_LANGUAGE_MAP[language] || 'en',
        voice: voiceId || this.config.defaultVoice,
        model: options?.model || this.config.defaultModel,
        temperature: options?.temperature || 0.7,
        do_sample: false, // Disable for stability
        max_tokens: this.estimateTokens(text),
      };

      // Add instruction if enabled
      if (this.config.enableInstructions && options?.instruction) {
        request.instruction = options.instruction;
      }

      const response = await fetch(`${this.config.bridgeUrl}/api/v1/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`QwenTTS API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as QwenSynthesizeResponse;
      const audio = Buffer.from(data.audio, 'base64');

      const latency = Date.now() - startTime;
      console.log(
        `🔊 QwenTTS: "${text.substring(0, 30)}..." ` +
        `(${language}, ${request.voice}) → ` +
        `${audio.length} bytes (${latency}ms)`
      );

      return {
        audio,
        duration: data.duration_ms,
        format: data.format as 'wav' | 'mp3',
        sampleRate: data.sample_rate,
      };
    } catch (error) {
      console.error('❌ QwenTTS error:', error);
      throw error;
    }
  }

  /**
   * Clone voice from audio sample
   * Requires voice cloning to be enabled
   */
  async cloneVoice(
    audioBuffer: Buffer,
    transcript: string,
    language: SupportedLanguage,
    name: string
  ): Promise<VoiceInfo> {
    if (!this.config.enableVoiceCloning) {
      throw new Error('Voice cloning is disabled');
    }

    try {
      const formData = new FormData();
      formData.append('audio', new Blob([audioBuffer]), 'audio.wav');
      formData.append('transcript', transcript);
      formData.append('language', QWEN_LANGUAGE_MAP[language] || 'en');
      formData.append('name', name);
      formData.append('save_to_library', 'true');

      const response = await fetch(`${this.config.bridgeUrl}/api/v1/clone-voice`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Voice clone error: ${response.status} - ${error}`);
      }

      const voiceInfo = await response.json() as VoiceInfo;
      this.voiceCache.set(voiceInfo.voice_id, voiceInfo);

      console.log(`🎙️ Cloned voice: ${name} (${voiceInfo.voice_id})`);
      return voiceInfo;
    } catch (error) {
      console.error('❌ Voice clone error:', error);
      throw error;
    }
  }

  /**
   * Design voice from natural language description
   */
  async designVoice(
    description: string,
    language: SupportedLanguage,
    name: string
  ): Promise<VoiceInfo> {
    if (!this.config.enableVoiceCloning) {
      throw new Error('Voice design is disabled');
    }

    try {
      const response = await fetch(`${this.config.bridgeUrl}/api/v1/design-voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          language: QWEN_LANGUAGE_MAP[language] || 'en',
          name,
          save_to_library: true,
        }),
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Voice design error: ${response.status} - ${error}`);
      }

      const voiceInfo = await response.json() as VoiceInfo;
      this.voiceCache.set(voiceInfo.voice_id, voiceInfo);

      console.log(`🎨 Designed voice: ${name} (${voiceInfo.voice_id})`);
      return voiceInfo;
    } catch (error) {
      console.error('❌ Voice design error:', error);
      throw error;
    }
  }

  /**
   * List all voices in library
   */
  async listVoices(): Promise<VoiceInfo[]> {
    try {
      const response = await fetch(`${this.config.bridgeUrl}/api/v1/voices`);

      if (!response.ok) {
        throw new Error(`Failed to list voices: ${response.status}`);
      }

      const voices = await response.json() as VoiceInfo[];

      // Update cache
      voices.forEach(voice => {
        this.voiceCache.set(voice.voice_id, voice);
      });

      return voices;
    } catch (error) {
      console.error('❌ List voices error:', error);
      throw error;
    }
  }

  /**
   * Delete voice from library
   */
  async deleteVoice(voiceId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.bridgeUrl}/api/v1/voices/${voiceId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete voice: ${response.status}`);
      }

      this.voiceCache.delete(voiceId);
      console.log(`🗑️ Deleted voice: ${voiceId}`);
    } catch (error) {
      console.error('❌ Delete voice error:', error);
      throw error;
    }
  }

  /**
   * Estimate max tokens needed for text
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1.5 tokens per character
    const estimated = Math.ceil(text.length * 1.5);

    // Clamp between 128-4096
    return Math.max(128, Math.min(4096, estimated));
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.bridgeUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Integration with Bani TTSFactory
// ============================================================================

/**
 * Add to Bani's TTSFactory:
 *
 * import { QwenTTS } from './qwen.js';
 *
 * export class TTSFactory {
 *   static create(provider: TTSProviderName, config: any): TTSProvider {
 *     switch (provider) {
 *       case 'qwen':
 *         return new QwenTTS({
 *           bridgeUrl: config.bridgeUrl || 'http://localhost:8000',
 *           defaultVoice: config.defaultVoice || 'custom_1',
 *         });
 *       // ... other providers
 *     }
 *   }
 * }
 */

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Basic synthesis
 *
 * const qwen = new QwenTTS({
 *   bridgeUrl: 'http://localhost:8000',
 * });
 *
 * const result = await qwen.synthesize(
 *   'Hello, how are you today?',
 *   'en',
 *   'custom_1'
 * );
 */

/**
 * Example 2: With emotion instruction
 *
 * const result = await qwen.synthesize(
 *   'Your order has been shipped!',
 *   'en',
 *   'custom_2',
 *   { instruction: 'speak with excitement and joy' }
 * );
 */

/**
 * Example 3: Voice cloning
 *
 * const audioBuffer = fs.readFileSync('reference.wav');
 * const voiceInfo = await qwen.cloneVoice(
 *   audioBuffer,
 *   'This is my voice speaking naturally',
 *   'en',
 *   'Customer Voice'
 * );
 *
 * // Use cloned voice
 * const result = await qwen.synthesize(
 *   'Welcome back!',
 *   'en',
 *   voiceInfo.voice_id
 * );
 */

/**
 * Example 4: Voice design
 *
 * const voiceInfo = await qwen.designVoice(
 *   'A warm, elderly male voice with slight Hindi accent',
 *   'en',
 *   'Grandfather Voice'
 * );
 *
 * const result = await qwen.synthesize(
 *   'Happy birthday, my dear grandchild',
 *   'en',
 *   voiceInfo.voice_id
 * );
 */

export default QwenTTS;
