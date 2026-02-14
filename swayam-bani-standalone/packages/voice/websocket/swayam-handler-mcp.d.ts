/**
 * SWAYAM WebSocket Handler with MCP Integration
 *
 * Enhanced version with PowerBox MCP for unified AI intelligence
 *
 * Features:
 * - All original SwayamWebSocketHandler features
 * - MCP tool integration for logistics, compliance, memory
 * - Automatic tool selection based on intent
 * - Tool results injected into AI context
 * - Wake word detection ("Hey Swayam")
 * - Streaming TTS for low-latency responses
 * - Conversational Intelligence (@ankr/intelligence)
 * - TODO Planning and execution
 * - Package Discovery from Verdaccio
 *
 * @author ANKR Labs
 * @version 3.0.0 - Phase 12.1 Agentic System
 */
import type { WebSocket } from 'ws';
import { type MCPTool } from '@powerpbox/mcp';
import { type TodoPlan } from '@ankr/intelligence';
interface SwayamMCPConfig {
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
    mcp?: {
        enabled?: boolean;
        logisticsRagUrl?: string;
        databaseUrl?: string;
    };
    wakeWord?: {
        enabled?: boolean;
        keywords?: string[];
        sensitivity?: number;
    };
    streaming?: {
        enabled?: boolean;
        chunkSize?: number;
        maxConcurrent?: number;
    };
    intelligence?: {
        enabled?: boolean;
        verdaccioUrl?: string;
        autoExecute?: boolean;
    };
    personas?: Record<string, PersonaConfig>;
}
interface PersonaConfig {
    name: string;
    systemPrompt: string;
    voice?: string;
    greeting?: string;
    mcpTools?: string[];
}
export declare class SwayamWebSocketHandlerMCP {
    private stt;
    private tts;
    private aiProxyUrl;
    private personas;
    private clients;
    private stats;
    private mcpEnabled;
    private toolRegistry;
    private toolMap;
    private conversationAI;
    private intelligenceEnabled;
    private activePlans;
    private wakeWordEnabled;
    private wakeWordDetector;
    private wakeWordKeywords;
    private wakeWordSensitivity;
    private wakeWordTimeoutMs;
    private streamingEnabled;
    private streamingTTS;
    constructor(config: SwayamMCPConfig);
    /**
     * Initialize Conversational Intelligence (Phase 12.1)
     */
    private initIntelligence;
    /**
     * Initialize MCP via @powerpbox/mcp tool registry
     */
    private initMCP;
    /**
     * Initialize Wake Word Detection
     */
    private initWakeWord;
    /**
     * Initialize Streaming TTS
     */
    private initStreamingTTS;
    handleConnection(ws: WebSocket): void;
    private handleMessage;
    /**
     * Handle wake word configuration
     */
    private handleWakeWordConfig;
    /**
     * Handle streaming configuration
     */
    private handleStreamingConfig;
    /**
     * Handle plan confirmation (user says yes/no to suggested plan)
     */
    private handlePlanConfirm;
    /**
     * Execute a plan
     */
    private handlePlanExecute;
    /**
     * Cancel a plan
     */
    private handlePlanCancel;
    private handleJoin;
    private handleAudio;
    private handleText;
    private handleToolCall;
    private handleExecute;
    /**
     * Main processing with MCP tool integration and Conversational Intelligence
     */
    private processAndRespond;
    /**
     * Enhanced intent classification with entity extraction
     */
    private classifyIntent;
    /**
     * Execute tools based on intent
     */
    private executeIntentTools;
    /**
     * Build tool arguments from user text and entities
     */
    private buildToolArgs;
    /**
     * Execute a tool from @powerpbox/mcp registry
     */
    private executeTool;
    /**
     * Build context string from tool results
     */
    private buildToolContext;
    private callAI;
    private handleDisconnect;
    private send;
    private sendError;
    getStats(): {
        activeClients: number;
        mcpEnabled: boolean;
        totalTools: number;
        categories: {};
        intelligenceEnabled: boolean;
        activePlans: number;
        intelligence: {
            packages: number;
            intents: number;
            tools: number;
            domains: string[];
        } | null;
        connections: number;
        messages: number;
        errors: number;
        toolCalls: number;
        toolSuccesses: number;
        wakeWordDetections: number;
        streamingResponses: number;
    };
    /**
     * Get intelligence capabilities (Phase 12.1)
     */
    getIntelligenceCapabilities(): {
        enabled: boolean;
    } | {
        packages: {
            name: string;
            capabilities: string[];
            tools: string[] | undefined;
            domain: import("@ankr/intelligence").IntentDomain | undefined;
        }[];
        intents: number;
        tools: number;
        domains: string[];
        enabled: boolean;
    };
    /**
     * Get active plans (Phase 12.1)
     */
    getActivePlans(): TodoPlan[];
    /**
     * Get available MCP tools
     */
    getAvailableTools(): string[];
    /**
     * Get tools by category
     */
    getToolsByCategory(category: string): string[];
    /**
     * Get tool details
     */
    getToolInfo(toolName: string): MCPTool | undefined;
    /**
     * Execute a tool directly (for REST API testing)
     */
    executeToolDirect(toolName: string, params: Record<string, unknown>): Promise<unknown>;
}
export default SwayamWebSocketHandlerMCP;
//# sourceMappingURL=swayam-handler-mcp.d.ts.map