import { classifyIntent } from '@swayam/intent';
import { llmRouter } from '@swayam/llm-router';
import { createSTTProvider } from '@swayam/stt';
import { createTTSProvider } from '@swayam/tts';
import { removeCodeBlocks, extractCodeBlocks, truncate } from '@swayam/utils';
import type { SwayamRequest, SwayamResponse, Intent, Persona, Language } from '@swayam/types';

const SYSTEM_PROMPTS: Record<Intent, string> = {
  code: `You are Swayam (स्वयं), an AI coding assistant for Hindi speakers. Generate clean code and explain in simple Hindi.`,
  question: `You are Swayam (स्वयं), a knowledgeable teacher. Answer clearly in Hindi with examples.`,
  task: `You are Swayam (स्वयं), a task assistant. Help complete tasks step by step in Hindi.`,
  search: `You are Swayam (स्वयं), an information finder. Present findings clearly in Hindi.`,
  creative: `You are Swayam (स्वयं), a creative partner. Generate creative content in Hindi.`,
  chat: `You are Swayam (स्वयं), a friendly AI companion. Be warm and conversational in Hindi.`,
  command: `You are Swayam (स्वयं). Process commands efficiently.`,
  unknown: `You are Swayam (स्वयं). Help the user in Hindi.`,
};

export class SwayamEngine {
  private stt = createSTTProvider('mock');
  private tts = createTTSProvider('mock');

  constructor() {
    console.log('🎙️ Swayam Engine initialized');
  }

  async process(request: SwayamRequest): Promise<SwayamResponse> {
    const startTime = Date.now();
    console.log('🔄 Processing request...');

    try {
      let inputText = request.text || '';
      if (request.audio && request.audio.length > 0) {
        const sttResult = await this.stt.transcribe(request.audio, request.language || 'hi');
        inputText = sttResult.text;
      }

      if (!inputText.trim()) {
        return this.errorResponse('कोई इनपुट नहीं मिला');
      }

      const intentResult = classifyIntent(inputText, request.language || 'hi');
      console.log(`✨ Intent: ${intentResult.intent} (${intentResult.confidence * 100}%)`);

      const systemPrompt = SYSTEM_PROMPTS[intentResult.intent];
      const llmResponse = await llmRouter.route({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: inputText }
        ],
      });

      const codeBlocks = extractCodeBlocks(llmResponse.content);
      const code = codeBlocks[0]?.code;
      const codeLanguage = codeBlocks[0]?.language;
      const voiceText = truncate(removeCodeBlocks(llmResponse.content), 500, '...');

      let audio: Buffer | undefined;
      try {
        const ttsResult = await this.tts.synthesize(voiceText, request.language || 'hi');
        audio = ttsResult.audio;
      } catch (e) {
        console.warn('TTS failed:', e);
      }

      const latencyMs = Date.now() - startTime;
      console.log(`✅ Processed in ${latencyMs}ms`);

      return {
        text: llmResponse.content,
        voice: voiceText,
        audio,
        code,
        codeLanguage,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        metadata: { latencyMs, provider: llmResponse.provider, model: llmResponse.model }
      };
    } catch (error) {
      console.error('❌ Error:', error);
      return this.errorResponse('माफ कीजिए, कुछ गड़बड़ हो गई।');
    }
  }

  private errorResponse(message: string): SwayamResponse {
    return { text: message, voice: message, intent: 'unknown', confidence: 0 };
  }
}

export const swayam = new SwayamEngine();
