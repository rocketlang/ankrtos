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
export declare const SARVAM_VOICES: string[];
export declare const TTSFactory: {
    create(provider?: "sarvam" | "piper" | "mock", options?: TTSOptions): TTSProvider;
};
export default TTSFactory;
//# sourceMappingURL=index.d.ts.map