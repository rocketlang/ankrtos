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
export declare const STTFactory: {
    create(provider?: "sarvam" | "whisper" | "mock", options?: STTOptions): STTProvider;
};
export default STTFactory;
//# sourceMappingURL=index.d.ts.map