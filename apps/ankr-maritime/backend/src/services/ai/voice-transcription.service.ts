/**
 * Voice Transcription Service
 * Transcribes voice messages using OpenAI Whisper API
 *
 * @package @ankr/universal-ai-assistant
 * @version 1.0.0
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  language?: string;
  duration?: number;
  error?: string;
}

export interface TranscriptionOptions {
  language?: string; // ISO language code (e.g., 'en', 'es', 'zh')
  model?: 'whisper-1';
  prompt?: string; // Optional context to improve accuracy
}

export class VoiceTranscriptionService {
  private aiProxyUrl: string;
  private transcriptionEndpoint: string;

  constructor() {
    this.aiProxyUrl = process.env.AI_PROXY_URL || 'http://localhost:4444';
    this.transcriptionEndpoint = `${this.aiProxyUrl}/api/ai/transcribe`;

    console.log(`🎙️ Voice Transcription Service initialized (AI Proxy: ${this.aiProxyUrl})`);
  }

  /**
   * Transcribe voice message from URL
   */
  async transcribeFromUrl(
    audioUrl: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    try {
      // Download audio file
      const audioResponse = await fetch(audioUrl);

      if (!audioResponse.ok) {
        return {
          success: false,
          error: `Failed to download audio: ${audioResponse.statusText}`,
        };
      }

      const audioBuffer = await audioResponse.buffer();

      // Prepare form data
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.ogg', // WhatsApp typically sends OGG
        contentType: 'audio/ogg',
      });
      formData.append('model', options?.model || 'whisper-1');

      if (options?.language) {
        formData.append('language', options.language);
      }

      if (options?.prompt) {
        formData.append('prompt', options.prompt);
      }

      // Call AI Proxy transcription endpoint
      const response = await fetch(this.transcriptionEndpoint, {
        method: 'POST',
        headers: {
          ...formData.getHeaders(),
        },
        body: formData as any,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('AI Proxy transcription error:', error);
        return {
          success: false,
          error: `Transcription failed: ${response.statusText}`,
        };
      }

      const result = await response.json();

      return {
        success: true,
        text: result.text,
        language: options?.language || result.language,
        duration: result.duration,
      };
    } catch (error: any) {
      console.error('Voice transcription error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Transcribe voice message from WhatsApp
   * Downloads from WhatsApp Business API and transcribes
   */
  async transcribeWhatsAppVoice(
    mediaId: string,
    phoneNumberId: string,
    accessToken: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    try {
      // Get media URL from WhatsApp
      const mediaInfoResponse = await fetch(
        `https://graph.facebook.com/v18.0/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!mediaInfoResponse.ok) {
        return {
          success: false,
          error: 'Failed to get WhatsApp media info',
        };
      }

      const mediaInfo = await mediaInfoResponse.json();

      if (!mediaInfo.url) {
        return {
          success: false,
          error: 'No media URL returned from WhatsApp',
        };
      }

      // Download audio file from WhatsApp
      const audioResponse = await fetch(mediaInfo.url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!audioResponse.ok) {
        return {
          success: false,
          error: 'Failed to download WhatsApp audio',
        };
      }

      const audioBuffer = await audioResponse.buffer();

      // Prepare form data for Whisper
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'voice.ogg',
        contentType: mediaInfo.mime_type || 'audio/ogg',
      });
      formData.append('model', options?.model || 'whisper-1');

      if (options?.language) {
        formData.append('language', options.language);
      }

      // Add maritime context as prompt to improve accuracy
      const maritimePrompt =
        'Maritime shipping conversation about vessels, ports, cargo, freight rates, bills of lading.';
      formData.append('prompt', options?.prompt || maritimePrompt);

      // Call AI Proxy transcription endpoint
      const response = await fetch(this.transcriptionEndpoint, {
        method: 'POST',
        headers: {
          ...formData.getHeaders(),
        },
        body: formData as any,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Whisper API error:', error);
        return {
          success: false,
          error: `Transcription failed: ${response.statusText}`,
        };
      }

      const result = await response.json();

      console.log(`🎙️ Voice transcribed: "${result.text.substring(0, 100)}..."`);

      return {
        success: true,
        text: result.text,
        language: result.language,
        duration: result.duration,
      };
    } catch (error: any) {
      console.error('WhatsApp voice transcription error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Save transcription to database
   */
  async saveTranscription(
    messageId: string,
    transcription: string,
    language: string,
    duration?: number
  ): Promise<void> {
    try {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: transcription, // Update content with transcribed text
          metadata: {
            transcription: {
              text: transcription,
              language,
              duration,
              transcribedAt: new Date().toISOString(),
            },
          },
        },
      });
    } catch (error) {
      console.error('Failed to save transcription:', error);
    }
  }

  /**
   * Get cached transcription if available
   */
  async getCachedTranscription(channelMessageId: string): Promise<string | null> {
    try {
      const message = await prisma.message.findFirst({
        where: {
          channelMessageId,
          content: { not: '[Voice message]' }, // Already transcribed
        },
        select: { content: true },
      });

      return message?.content || null;
    } catch (error) {
      console.error('Failed to get cached transcription:', error);
      return null;
    }
  }

  /**
   * Batch transcribe multiple voice messages
   */
  async batchTranscribe(
    audioUrls: string[],
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult[]> {
    const results: TranscriptionResult[] = [];

    for (const url of audioUrls) {
      const result = await this.transcribeFromUrl(url, options);
      results.push(result);

      // Rate limiting: wait 100ms between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Detect language from audio (uses Whisper's language detection)
   */
  async detectLanguage(audioUrl: string): Promise<{ language: string; confidence: number } | null> {
    try {
      // Transcribe without specifying language
      const result = await this.transcribeFromUrl(audioUrl);

      if (result.success && result.language) {
        return {
          language: result.language,
          confidence: 0.9, // Whisper doesn't provide confidence, assume high
        };
      }

      return null;
    } catch (error) {
      console.error('Language detection error:', error);
      return null;
    }
  }

  /**
   * Test transcription service
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test AI Proxy connection
      const response = await fetch(`${this.aiProxyUrl}/health`, {
        method: 'GET',
      });

      if (!response.ok) {
        return {
          success: false,
          error: 'AI Proxy not available',
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `AI Proxy connection failed: ${error.message}`,
      };
    }
  }
}

export const voiceTranscriptionService = new VoiceTranscriptionService();
