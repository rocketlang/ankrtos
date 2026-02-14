/**
 * SWAYAM - Universal Conversational AI Bot
 * Reusable WebSocket module for real-time voice AI
 *
 * Can be embedded in: Complymitra, WowTruck, BANI, FreightBox, PowerBox
 *
 * WebSocket Protocol:
 * - Client sends: { type: 'join', sessionId, userId, language, persona? }
 * - Client sends: { type: 'audio', data: base64Audio }
 * - Client sends: { type: 'text', text: string }
 * - Server sends: { type: 'transcript', text, confidence }
 * - Server sends: { type: 'response', text, audio, intent, latencyMs }
 * - Server sends: { type: 'error', code, message }
 *
 * @author ANKR Labs
 */
import type { WebSocket } from 'ws';
interface SwayamConfig {
    stt: {
        provider: 'sarvam' | 'whisper';
        apiKey?: string;
        serverUrl?: string;
    };
    tts: {
        provider: 'sarvam' | 'piper';
        apiKey?: string;
        serverUrl?: string;
        defaultVoice?: string;
    };
    ai: {
        proxyUrl: string;
    };
    personas?: Record<string, PersonaConfig>;
}
interface PersonaConfig {
    name: string;
    systemPrompt: string;
    voice?: string;
    greeting?: string;
}
export declare class SwayamWebSocketHandler {
    private stt;
    private tts;
    private aiProxyUrl;
    private personas;
    private clients;
    private stats;
    constructor(config: SwayamConfig);
    handleConnection(ws: WebSocket): void;
    private handleMessage;
    private handleJoin;
    private handleAudio;
    private handleText;
    private handleExecute;
    private processAndRespond;
    private callAI;
    private classifyIntent;
    private handleDisconnect;
    private send;
    private sendError;
    getStats(): {
        activeClients: number;
        connections: number;
        messages: number;
        errors: number;
    };
}
export default SwayamWebSocketHandler;
//# sourceMappingURL=swayam-handler.d.ts.map