/**
 * Wake Word Detection for SWAYAM
 *
 * Supports multiple wake words:
 * - "Hey Swayam" (हे स्वयं)
 * - "OK Swayam"
 * - "Swayam" (direct)
 *
 * Uses phonetic matching for Hindi/English variations
 *
 * @author ANKR Labs
 */
export interface WakeWordConfig {
    keywords: string[];
    sensitivity: number;
    language: string;
    onDetected?: (keyword: string, confidence: number) => void;
}
export interface WakeWordResult {
    detected: boolean;
    keyword: string;
    confidence: number;
    timestamp: number;
    audioOffset?: number;
}
export declare class WakeWordDetector {
    private keywords;
    private sensitivity;
    private language;
    private onDetected?;
    private isListening;
    private lastDetection;
    private cooldownMs;
    constructor(config: WakeWordConfig);
    /**
     * Check if text contains a wake word
     * Used for text-based wake word detection (from STT output)
     */
    detectInText(text: string): WakeWordResult;
    /**
     * Extract command after wake word
     */
    extractCommand(text: string): {
        wakeWord: string;
        command: string;
    } | null;
    /**
     * Check if audio buffer contains wake word
     * Uses VAD (Voice Activity Detection) + STT
     */
    detectInAudio(audioBuffer: Buffer, sttProvider: {
        transcribe: (audio: Buffer, lang: string) => Promise<{
            text: string;
        }>;
    }): Promise<WakeWordResult>;
    /**
     * Start continuous listening mode
     */
    startListening(): void;
    /**
     * Stop continuous listening
     */
    stopListening(): void;
    /**
     * Check if currently listening
     */
    get listening(): boolean;
    private normalizeText;
    private getPatterns;
    private matchKeyword;
    private levenshteinDistance;
}
export declare function createWakeWordDetector(keywords?: string[], options?: Partial<WakeWordConfig>): WakeWordDetector;
export declare const PERSONA_WAKE_WORDS: Record<string, string[]>;
export default WakeWordDetector;
//# sourceMappingURL=index.d.ts.map