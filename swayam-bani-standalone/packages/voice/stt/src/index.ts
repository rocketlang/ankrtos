import { STTProvider, Language } from '@swayam/types';

export interface STTResult {
  text: string;
  language: Language;
  confidence: number;
  duration: number;
}

export interface STTProviderInterface {
  transcribe(audio: Buffer, language?: Language): Promise<STTResult>;
}

class MockSTT implements STTProviderInterface {
  async transcribe(audio: Buffer, language: Language = 'hi'): Promise<STTResult> {
    await new Promise(r => setTimeout(r, 100));
    return { text: 'नमस्ते, यह एक टेस्ट है', language, confidence: 1.0, duration: 2.5 };
  }
}

export function createSTTProvider(provider: STTProvider = 'mock'): STTProviderInterface {
  // For now, return mock. Real providers will be added.
  return new MockSTT();
}
