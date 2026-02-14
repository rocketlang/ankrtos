import { TTSProvider, Language } from '@swayam/types';

export interface TTSResult {
  audio: Buffer;
  duration: number;
}

export interface TTSProviderInterface {
  synthesize(text: string, language?: Language, voice?: string): Promise<TTSResult>;
}

class MockTTS implements TTSProviderInterface {
  async synthesize(text: string, language: Language = 'hi'): Promise<TTSResult> {
    await new Promise(r => setTimeout(r, 50));
    return { audio: Buffer.alloc(16000), duration: 1.0 };
  }
}

export function createTTSProvider(provider: TTSProvider = 'mock'): TTSProviderInterface {
  return new MockTTS();
}

export const SARVAM_VOICES = [
  'anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun',
  'hitesh', 'aditya', 'ritu', 'chirag', 'priya', 'neha',
  'rahul', 'pooja', 'rohan', 'simran', 'kavya', 'sunita'
];
