/**
 * Swayam Voice Types
 */
export type SupportedLanguage = 'hi' | 'en' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'od';
export interface STTProvider {
    name: string;
    transcribe(audio: Buffer, language?: SupportedLanguage): Promise<STTResult>;
}
export interface STTResult {
    text: string;
    confidence: number;
    language?: SupportedLanguage;
}
export interface TTSProvider {
    name: string;
    synthesize(text: string, language?: SupportedLanguage, voice?: string): Promise<TTSResult>;
}
export interface TTSResult {
    audio: Buffer;
    duration?: number;
}
export interface VoiceConfig {
    stt: {
        provider: 'sarvam' | 'whisper' | 'mock';
        apiKey?: string;
        serverUrl?: string;
    };
    tts: {
        provider: 'sarvam' | 'piper' | 'mock';
        apiKey?: string;
        serverUrl?: string;
        defaultVoice?: string;
    };
}
//# sourceMappingURL=index.d.ts.map