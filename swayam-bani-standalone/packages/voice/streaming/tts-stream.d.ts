/**
 * Streaming TTS for SWAYAM
 *
 * Enables real-time audio streaming with:
 * - Sentence-by-sentence streaming
 * - Chunk-based audio delivery
 * - Low-latency first audio response
 * - Buffer management for smooth playback
 *
 * @author ANKR Labs
 */
import { EventEmitter } from 'events';
export interface StreamingTTSConfig {
    serverUrl: string;
    apiKey?: string;
    defaultVoice: string;
    chunkSize: number;
    maxConcurrent: number;
}
export interface AudioChunk {
    index: number;
    audio: Buffer;
    text: string;
    duration: number;
    isLast: boolean;
    timestamp: number;
}
export interface StreamingTTSEvents {
    chunk: (chunk: AudioChunk) => void;
    start: (totalChunks: number) => void;
    end: (totalDuration: number) => void;
    error: (error: Error) => void;
}
export declare class StreamingTTS extends EventEmitter {
    private config;
    private activeStreams;
    constructor(config?: Partial<StreamingTTSConfig>);
    /**
     * Stream TTS for text, emitting audio chunks as they're ready
     */
    streamText(text: string, language: string, voice?: string, streamId?: string): Promise<void>;
    /**
     * Stream with callback for each chunk (simpler API)
     */
    streamWithCallback(text: string, language: string, onChunk: (chunk: AudioChunk) => void, voice?: string): Promise<{
        totalDuration: number;
        totalChunks: number;
    }>;
    /**
     * Cancel an active stream
     */
    cancelStream(streamId: string): boolean;
    /**
     * Cancel all active streams
     */
    cancelAll(): void;
    /**
     * Synthesize a single chunk
     */
    private synthesizeChunk;
    /**
     * Estimate duration based on text length and language
     * Average speaking rate: ~150 words/min for Hindi, ~180 for English
     */
    private estimateDuration;
}
export interface WebSocketStreamOptions {
    ws: {
        send: (data: string) => void;
    };
    sessionId: string;
    language: string;
    voice?: string;
}
/**
 * Stream TTS directly to a WebSocket connection
 */
export declare function streamTTSToWebSocket(text: string, options: WebSocketStreamOptions, ttsConfig?: Partial<StreamingTTSConfig>): Promise<{
    totalDuration: number;
    totalChunks: number;
}>;
export declare function createStreamingTTS(config?: Partial<StreamingTTSConfig>): StreamingTTS;
export default StreamingTTS;
//# sourceMappingURL=tts-stream.d.ts.map