"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwayamWebSocketHandlerMCP = void 0;
// Use @powerpbox/mcp for full tool access (40+ tools)
const mcp_1 = require("@powerpbox/mcp");
// Wake word detection
const index_js_1 = require("../wakeword/index.js");
// Streaming TTS
const tts_stream_js_1 = require("../streaming/tts-stream.js");
// Learning Logger - Self-evolution
const index_js_2 = require("../learning/index.js");
// Conversational Intelligence - Phase 12.1
const intelligence_1 = require("@ankr/intelligence");
// ============================================================================
// SIMPLE STT/TTS FACTORIES (uses BANI service)
// ============================================================================
const BANI_URL = process.env.BANI_URL || 'http://localhost:7777';
class SarvamSTT {
    name = 'sarvam';
    apiKey;
    serverUrl;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.serverUrl = config.serverUrl || BANI_URL;
    }
    async transcribe(audio, language) {
        try {
            const response = await fetch(`${this.serverUrl}/stt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audio: audio.toString('base64'),
                    language,
                    provider: 'sarvam',
                }),
            });
            if (!response.ok)
                throw new Error(`STT error: ${response.status}`);
            const data = await response.json();
            return {
                text: data.transcript || data.text || '',
                confidence: data.confidence || 0.8,
                language,
            };
        }
        catch (error) {
            console.error('STT Error:', error.message);
            return { text: '', confidence: 0, language };
        }
    }
}
class SarvamTTS {
    name = 'sarvam';
    apiKey;
    serverUrl;
    defaultVoice;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.serverUrl = config.serverUrl || BANI_URL;
        this.defaultVoice = config.defaultVoice || 'anushka';
    }
    async synthesize(text, language, voice) {
        try {
            const response = await fetch(`${this.serverUrl}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    language,
                    voice: voice || this.defaultVoice,
                    provider: 'sarvam',
                }),
            });
            if (!response.ok)
                throw new Error(`TTS error: ${response.status}`);
            const data = await response.json();
            const audioBase64 = data.audio || data.audioBase64 || '';
            return {
                audio: Buffer.from(audioBase64, 'base64'),
                duration: data.duration || 0,
            };
        }
        catch (error) {
            console.error('TTS Error:', error.message);
            return { audio: Buffer.alloc(0), duration: 0 };
        }
    }
}
const STTFactory = {
    create(provider, config) {
        return new SarvamSTT(config);
    },
};
const TTSFactory = {
    create(provider, config) {
        return new SarvamTTS(config);
    },
};
// ============================================================================
// INTENT TO TOOL MAPPING
// ============================================================================
const INTENT_TOOL_MAP = {
    // Logistics intents (LogisticsRAG)
    logistics_query: { tools: ['logistics_search', 'logistics_retrieve'], priority: 1 },
    logistics_route: { tools: ['logistics_route', 'logistics_search'], priority: 1 },
    logistics_compliance: { tools: ['logistics_compliance'], priority: 1 },
    trucking_question: { tools: ['logistics_search', 'logistics_compliance'], priority: 1 },
    // Compliance intents (GST, Tax)
    gst_query: { tools: ['gst_verify', 'gst_file', 'logistics_compliance'], priority: 1 },
    tax_query: { tools: ['gst_verify', 'logistics_compliance'], priority: 1 },
    // Government APIs (BANI tools)
    digilocker_query: { tools: ['digilocker_fetch', 'digilocker_verify'], priority: 1 },
    aadhaar_query: { tools: ['aadhaar_verify', 'aadhaar_otp'], priority: 1 },
    vehicle_query: { tools: ['vahan_search', 'sarathi_search'], priority: 1 },
    // Tracking
    tracking_query: { tools: ['tracking', 'gps_track'], priority: 1 },
    // Messaging
    send_message: { tools: ['telegram_send', 'whatsapp_send'], priority: 1 },
    // Payments
    payment_query: { tools: ['upi_send', 'upi_verify'], priority: 1 },
    // ULIP (Unified Logistics Interface Platform)
    ulip_query: { tools: ['ulip'], priority: 1 },
    // Memory/knowledge intents (EON)
    recall_memory: { tools: ['eon_recall', 'eon_search'], priority: 2 },
    store_memory: { tools: ['eon_store'], priority: 2 },
    // Code intents - no tools, use sandbox
    code: { tools: [], priority: 0 },
    // General - low priority tools
    question: { tools: ['logistics_search'], priority: 3 },
    chat: { tools: [], priority: 0 },
};
// ============================================================================
// ENHANCED PERSONAS WITH MCP TOOLS
// ============================================================================
const DEFAULT_PERSONAS = {
    swayam: {
        name: 'Swayam',
        systemPrompt: `You are Swayam - India's universal AI assistant.
- Respond in the user's language
- Be helpful, concise, and friendly
- Use Indian context and examples
- For code, add comments in user's language
- When tool results are provided, use them to give accurate answers`,
        greeting: 'नमस्ते! मैं स्वयं हूं। आपकी क्या मदद करूं?',
        mcpTools: [
            // Core
            'logistics_search', 'eon_recall', 'eon_store',
            // Government
            'digilocker_fetch', 'vahan_search',
            // Messaging
            'whatsapp_send', 'telegram_send',
        ],
    },
    complymitra: {
        name: 'ComplyMitra',
        systemPrompt: `You are ComplyMitra - AI compliance assistant for Indian businesses.
- Expert in GST, Income Tax, Company Law, Labor Laws
- Provide accurate regulatory guidance
- Reference relevant sections and rules
- Use tool results for up-to-date compliance information`,
        greeting: 'नमस्कार! मैं ComplyMitra हूं। Compliance में कैसे मदद करूं?',
        mcpTools: [
            // Compliance
            'logistics_compliance', 'gst_verify', 'gst_file',
            // Government
            'digilocker_fetch', 'digilocker_verify',
            // Search
            'logistics_search',
        ],
    },
    wowtruck: {
        name: 'WowTruck Assistant',
        systemPrompt: `You are WowTruck AI - Logistics and trucking assistant for Indian drivers.
- Help with load booking, tracking, payments
- Know Indian trucking routes and regulations
- Understand HOS rules, permits, documentation
- Use logistics tools to search for specific information
- Always provide practical, driver-friendly advice`,
        greeting: 'नमस्ते! WowTruck में आपका स्वागत है।',
        mcpTools: [
            // LogisticsRAG (all 7)
            'logistics_search', 'logistics_retrieve', 'logistics_route',
            'logistics_compliance', 'logistics_stats', 'logistics_ingest', 'logistics_delete',
            // Tracking
            'tracking', 'gps_track',
            // Vehicle
            'vahan_search', 'sarathi_search',
            // ULIP
            'ulip',
            // Payments
            'upi_send', 'upi_verify',
            // Messaging
            'whatsapp_send', 'telegram_send',
        ],
    },
    freightbox: {
        name: 'FreightBox AI',
        systemPrompt: `You are FreightBox AI - Shipping and freight assistant.
- Expert in international shipping, customs, documentation
- Know Indian export/import regulations
- Help with BOL, POD, customs clearance`,
        greeting: 'Hello! FreightBox AI here.',
        mcpTools: [
            // Logistics
            'logistics_search', 'logistics_compliance', 'logistics_route',
            // ULIP
            'ulip',
            // Tracking
            'tracking',
            // Shipping
            'container_track', 'container_validate', 'port_search', 'indian_ports', 'carriers', 'vessel_search',
        ],
    },
    // ERP Persona - Accounting & Business Management
    erp: {
        name: 'ERP Bharat',
        systemPrompt: `You are ERP Bharat - AI assistant for Indian business management.
- Expert in accounting, invoicing, inventory
- Help with GST compliance, TDS, financial reports
- Provide practical business advice for Indian SMEs
- Use Indian accounting standards and practices`,
        greeting: 'नमस्ते! ERP Bharat में आपका स्वागत है।',
        mcpTools: [
            // Compliance
            'gst_verify', 'gst_calc', 'hsn_lookup', 'tds_calc', 'income_tax', 'pan_verify',
            // Finance
            'emi_calc', 'sip_calc', 'calculator',
            // Fleet
            'orders', 'invoices', 'alerts',
        ],
    },
    // CRM Persona - Sales & Customer Management
    crm: {
        name: 'CRM Saathi',
        systemPrompt: `You are CRM Saathi - AI assistant for sales and customer management.
- Help manage leads, contacts, and opportunities
- Track customer interactions and follow-ups
- Provide sales insights and recommendations
- Support Hindi and English communication`,
        greeting: 'नमस्कार! CRM Saathi में आपका स्वागत है।',
        mcpTools: [
            // Messaging
            'whatsapp_send', 'telegram_send',
            // Orders
            'orders', 'invoices', 'alerts',
            // Utility
            'calculator', 'pincode_info', 'distance_calc',
        ],
    },
    // BANI Persona - Voice AI Assistant
    bani: {
        name: 'BANI Voice',
        systemPrompt: `You are BANI - Voice-first AI assistant for India.
- Optimized for voice interactions
- Respond in simple, conversational language
- Keep responses short and clear for TTS
- Support 11 Indian languages`,
        greeting: 'नमस्ते! मैं बानी हूं, आपकी voice assistant।',
        mcpTools: [
            // Core tools for voice
            'calculator', 'weather', 'pincode_info', 'distance_calc',
            // Government
            'pm_kisan', 'epf_balance', 'fastag',
            // Messaging
            'whatsapp_send', 'telegram_send',
        ],
    },
    // Saathi Persona - Driver Assistant
    saathi: {
        name: 'Driver Saathi',
        systemPrompt: `You are Driver Saathi - AI assistant for Indian truck drivers.
- Help with trip management, expenses, navigation
- Know Indian trucking rules, permits, tolls
- Speak in simple Hindi/English mix
- Understand voice commands while driving`,
        greeting: 'नमस्ते भाई! Driver Saathi में आपका स्वागत है।',
        mcpTools: [
            // Fleet
            'fleet_vehicles', 'vehicle_position', 'live_positions', 'drivers', 'trips',
            // Route
            'distance_calc', 'toll_estimate', 'pincode_info',
            // Compliance
            'vehicle_verify', 'fastag',
            // Logistics
            'freight_loads', 'freight_trucks', 'freight_stats',
            // Orders
            'orders', 'invoices', 'alerts',
        ],
    },
};
// ============================================================================
// LANGUAGE INSTRUCTIONS
// ============================================================================
const LANGUAGE_INSTRUCTIONS = {
    hi: 'Always respond in Hindi. Use Devanagari script.',
    en: 'Respond in English.',
    bn: 'Always respond in Bengali. Use Bengali script.',
    ta: 'Always respond in Tamil. Use Tamil script.',
    te: 'Always respond in Telugu. Use Telugu script.',
    mr: 'Always respond in Marathi. Use Devanagari script.',
    gu: 'Always respond in Gujarati. Use Gujarati script.',
    kn: 'Always respond in Kannada. Use Kannada script.',
    ml: 'Always respond in Malayalam. Use Malayalam script.',
    pa: 'Always respond in Punjabi. Use Gurmukhi script.',
    od: 'Always respond in Odia. Use Odia script.',
};
// ============================================================================
// SWAYAM WEBSOCKET HANDLER WITH MCP
// ============================================================================
class SwayamWebSocketHandlerMCP {
    stt;
    tts;
    aiProxyUrl;
    personas;
    clients = new Map();
    stats = {
        connections: 0,
        messages: 0,
        errors: 0,
        toolCalls: 0,
        toolSuccesses: 0,
        wakeWordDetections: 0,
        streamingResponses: 0,
    };
    // MCP Integration via @powerpbox/mcp
    mcpEnabled = false;
    toolRegistry = null;
    toolMap = new Map();
    // Phase 12.1: Conversational Intelligence
    conversationAI;
    intelligenceEnabled = false;
    activePlans = new Map();
    // Wake Word Detection
    wakeWordEnabled = false;
    wakeWordDetector = null;
    wakeWordKeywords = ['hey swayam', 'swayam'];
    wakeWordSensitivity = 0.7;
    wakeWordTimeoutMs = 10000; // 10 seconds to speak after wake word
    // Streaming TTS
    streamingEnabled = false;
    streamingTTS = null;
    constructor(config) {
        this.stt = STTFactory.create(config.stt.provider, {
            apiKey: config.stt.apiKey,
            serverUrl: config.stt.serverUrl,
        });
        this.tts = TTSFactory.create(config.tts.provider, {
            apiKey: config.tts.apiKey,
            serverUrl: config.tts.serverUrl,
            defaultVoice: config.tts.defaultVoice || 'anushka',
        });
        this.aiProxyUrl = config.ai.proxyUrl;
        this.personas = { ...DEFAULT_PERSONAS, ...config.personas };
        // Initialize Conversational Intelligence (Phase 12.1)
        this.conversationAI = new intelligence_1.ConversationAI({
            aiProxyUrl: config.ai.proxyUrl,
            verdaccioUrl: config.intelligence?.verdaccioUrl,
        });
        if (config.intelligence?.enabled !== false) {
            this.initIntelligence(config.intelligence);
        }
        // Initialize MCP
        if (config.mcp?.enabled !== false) {
            this.initMCP(config.mcp);
        }
        // Initialize Wake Word Detection
        if (config.wakeWord?.enabled !== false) {
            this.initWakeWord(config.wakeWord);
        }
        // Initialize Streaming TTS
        if (config.streaming?.enabled !== false) {
            this.initStreamingTTS(config.streaming);
        }
        console.log('🤖 SwayamWebSocketHandlerMCP initialized');
        console.log(`   STT: ${this.stt.name}`);
        console.log(`   TTS: ${this.tts.name}`);
        console.log(`   MCP: ${this.mcpEnabled ? 'enabled' : 'disabled'}`);
        console.log(`   Intelligence: ${this.intelligenceEnabled ? 'enabled' : 'disabled'}`);
        console.log(`   Wake Word: ${this.wakeWordEnabled ? `enabled (${this.wakeWordKeywords.join(', ')})` : 'disabled'}`);
        console.log(`   Streaming TTS: ${this.streamingEnabled ? 'enabled' : 'disabled'}`);
        console.log(`   Personas: ${Object.keys(this.personas).join(', ')}`);
    }
    /**
     * Initialize Conversational Intelligence (Phase 12.1)
     */
    async initIntelligence(config) {
        try {
            // Initialize and index packages
            await this.conversationAI.initialize();
            // Register progress callback for WebSocket updates
            this.conversationAI.onProgress((event) => {
                // Broadcast progress to relevant clients
                for (const [ws, client] of this.clients.entries()) {
                    if (client.intelligenceEnabled) {
                        this.send(ws, {
                            type: 'progress',
                            ...event,
                        });
                    }
                }
            });
            this.intelligenceEnabled = true;
            const summary = this.conversationAI.getCapabilitySummary();
            console.log(`🧠 Conversational Intelligence initialized`);
            console.log(`   Packages: ${summary.packages}`);
            console.log(`   Tools: ${summary.tools}`);
            console.log(`   Domains: ${summary.domains.join(', ')}`);
        }
        catch (error) {
            console.error('⚠️ Intelligence init failed:', error.message);
            this.intelligenceEnabled = false;
        }
    }
    /**
     * Initialize MCP via @powerpbox/mcp tool registry
     */
    initMCP(config) {
        try {
            // Set environment variables for @powerpbox/mcp tools
            if (config?.logisticsRagUrl) {
                process.env.LOGISTICS_RAG_URL = config.logisticsRagUrl;
            }
            if (config?.databaseUrl) {
                process.env.DATABASE_URL = config.databaseUrl;
            }
            // Initialize all tools from @powerpbox/mcp
            // This registers: LogisticsRAG (7), BANI (40+), messaging, payments, etc.
            (0, mcp_1.setupAllTools)({ databaseUrl: config?.databaseUrl });
            // Get the registry
            this.toolRegistry = (0, mcp_1.getToolRegistry)();
            // Build tool map for quick lookup
            const allTools = this.toolRegistry.getAll();
            for (const tool of allTools) {
                this.toolMap.set(tool.name, tool);
            }
            // Also add LogisticsRAG tools explicitly
            const ragTools = (0, mcp_1.getAllLogisticsRAGTools)();
            for (const tool of ragTools) {
                if (!this.toolMap.has(tool.name)) {
                    this.toolMap.set(tool.name, tool);
                }
            }
            this.mcpEnabled = true;
            const categories = this.toolRegistry.getCategories();
            console.log(`🔗 PowerBox MCP initialized: ${this.toolMap.size} tools`);
            console.log(`   Categories: ${Object.keys(categories).join(', ')}`);
            console.log(`   LogisticsRAG: ${ragTools.length} tools`);
        }
        catch (error) {
            console.error('⚠️ PowerBox MCP init failed:', error.message);
            this.mcpEnabled = false;
        }
    }
    /**
     * Initialize Wake Word Detection
     */
    initWakeWord(config) {
        try {
            this.wakeWordKeywords = config?.keywords || ['hey swayam', 'swayam', 'हे स्वयं'];
            this.wakeWordSensitivity = config?.sensitivity || 0.7;
            this.wakeWordDetector = (0, index_js_1.createWakeWordDetector)(this.wakeWordKeywords, {
                sensitivity: this.wakeWordSensitivity,
                language: 'hi',
                onDetected: (keyword, confidence) => {
                    console.log(`🎤 Wake word detected: "${keyword}" (${(confidence * 100).toFixed(0)}%)`);
                    this.stats.wakeWordDetections++;
                },
            });
            this.wakeWordEnabled = true;
            console.log(`🎤 Wake Word Detection initialized`);
            console.log(`   Keywords: ${this.wakeWordKeywords.join(', ')}`);
            console.log(`   Sensitivity: ${this.wakeWordSensitivity}`);
        }
        catch (error) {
            console.error('⚠️ Wake Word init failed:', error.message);
            this.wakeWordEnabled = false;
        }
    }
    /**
     * Initialize Streaming TTS
     */
    initStreamingTTS(config) {
        try {
            this.streamingTTS = (0, tts_stream_js_1.createStreamingTTS)({
                serverUrl: process.env.BANI_URL || 'http://localhost:7777',
                chunkSize: config?.chunkSize || 150,
                maxConcurrent: config?.maxConcurrent || 3,
            });
            this.streamingEnabled = true;
            console.log(`🔊 Streaming TTS initialized`);
            console.log(`   Chunk size: ${config?.chunkSize || 150} chars`);
        }
        catch (error) {
            console.error('⚠️ Streaming TTS init failed:', error.message);
            this.streamingEnabled = false;
        }
    }
    handleConnection(ws) {
        console.log('🔗 Swayam MCP: New connection');
        this.stats.connections++;
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                await this.handleMessage(ws, message);
            }
            catch (error) {
                console.error('❌ Swayam MCP message error:', error);
                this.sendError(ws, 'PARSE_ERROR', 'Invalid message format');
            }
        });
        ws.on('close', () => this.handleDisconnect(ws));
        ws.on('error', (error) => {
            console.error('❌ Swayam MCP WebSocket error:', error);
            this.stats.errors++;
        });
    }
    async handleMessage(ws, message) {
        this.stats.messages++;
        switch (message.type) {
            case 'join':
                await this.handleJoin(ws, message);
                break;
            case 'audio':
                await this.handleAudio(ws, message.data, message.continuous);
                break;
            case 'text':
                await this.handleText(ws, message.text);
                break;
            case 'execute':
                await this.handleExecute(ws, message.code, message.language);
                break;
            case 'tool':
                await this.handleToolCall(ws, message.name, message.args);
                break;
            case 'wake_word_config':
                this.handleWakeWordConfig(ws, message);
                break;
            case 'streaming_config':
                this.handleStreamingConfig(ws, message);
                break;
            // Phase 12.1: Plan management
            case 'plan_confirm':
                await this.handlePlanConfirm(ws, message.planId, message.confirmed);
                break;
            case 'plan_execute':
                await this.handlePlanExecute(ws, message.planId);
                break;
            case 'plan_cancel':
                this.handlePlanCancel(ws, message.planId);
                break;
            case 'leave':
                this.handleDisconnect(ws);
                break;
        }
    }
    /**
     * Handle wake word configuration
     */
    handleWakeWordConfig(ws, msg) {
        const client = this.clients.get(ws);
        if (!client)
            return;
        client.wakeWordEnabled = msg.enabled;
        if (msg.keywords && msg.keywords.length > 0) {
            // Create per-client wake word detector with custom keywords
        }
        this.send(ws, {
            type: 'wake_word_config_ack',
            enabled: client.wakeWordEnabled,
            keywords: this.wakeWordKeywords,
        });
    }
    /**
     * Handle streaming configuration
     */
    handleStreamingConfig(ws, msg) {
        const client = this.clients.get(ws);
        if (!client)
            return;
        client.streamingEnabled = msg.enabled;
        this.send(ws, {
            type: 'streaming_config_ack',
            enabled: client.streamingEnabled,
        });
    }
    // ============================================================================
    // PHASE 12.1: PLAN MANAGEMENT HANDLERS
    // ============================================================================
    /**
     * Handle plan confirmation (user says yes/no to suggested plan)
     */
    async handlePlanConfirm(ws, planId, confirmed) {
        const client = this.clients.get(ws);
        if (!client) {
            this.sendError(ws, 'NOT_JOINED', 'Join a session first');
            return;
        }
        const plan = this.activePlans.get(planId) || client.pendingPlan;
        if (!plan || plan.id !== planId) {
            this.sendError(ws, 'PLAN_NOT_FOUND', `No pending plan with ID: ${planId}`);
            return;
        }
        if (confirmed) {
            // User confirmed - execute the plan
            this.send(ws, {
                type: 'plan_confirmed',
                planId,
                message: client.language === 'hi' ? 'Plan शुरू कर रहा हूं...' : 'Starting plan execution...',
            });
            await this.handlePlanExecute(ws, planId);
        }
        else {
            // User declined
            client.pendingPlan = undefined;
            this.activePlans.delete(planId);
            this.send(ws, {
                type: 'plan_cancelled',
                planId,
                message: client.language === 'hi' ? 'Plan रद्द कर दिया' : 'Plan cancelled',
            });
        }
    }
    /**
     * Execute a plan
     */
    async handlePlanExecute(ws, planId) {
        const client = this.clients.get(ws);
        if (!client) {
            this.sendError(ws, 'NOT_JOINED', 'Join a session first');
            return;
        }
        const plan = this.activePlans.get(planId) || client.pendingPlan;
        if (!plan || plan.id !== planId) {
            this.sendError(ws, 'PLAN_NOT_FOUND', `No plan with ID: ${planId}`);
            return;
        }
        // Store in active plans
        this.activePlans.set(planId, plan);
        client.pendingPlan = undefined;
        try {
            // Execute the plan using ConversationAI
            const executedPlan = await this.conversationAI.executePlan(plan, async (toolName, params) => {
                // Execute tool via MCP
                return this.executeTool(toolName, params);
            });
            // Update stored plan
            this.activePlans.set(planId, executedPlan);
            // Send completion
            this.send(ws, {
                type: 'plan_completed',
                planId,
                plan: executedPlan,
                message: executedPlan.status === 'completed'
                    ? (client.language === 'hi' ? 'Plan सफलतापूर्वक पूरा हुआ!' : 'Plan completed successfully!')
                    : (client.language === 'hi' ? 'Plan में कुछ errors आए' : 'Plan completed with some errors'),
            });
            // Generate voice response for completion
            const voiceText = client.language === 'hi'
                ? `${executedPlan.titleHi} पूरा हो गया। ${executedPlan.items.filter(t => t.status === 'completed').length} tasks सफल।`
                : `${executedPlan.title} completed. ${executedPlan.items.filter(t => t.status === 'completed').length} tasks successful.`;
            try {
                const ttsResult = await this.tts.synthesize(voiceText.substring(0, 200), client.language);
                this.send(ws, { type: 'audio', audio: ttsResult.audio.toString('base64') });
            }
            catch { /* TTS optional */ }
        }
        catch (error) {
            this.send(ws, {
                type: 'plan_error',
                planId,
                error: error.message,
                message: client.language === 'hi' ? 'Plan execution में error आया' : 'Plan execution failed',
            });
        }
    }
    /**
     * Cancel a plan
     */
    handlePlanCancel(ws, planId) {
        const client = this.clients.get(ws);
        if (!client)
            return;
        this.activePlans.delete(planId);
        if (client.pendingPlan?.id === planId) {
            client.pendingPlan = undefined;
        }
        this.send(ws, {
            type: 'plan_cancelled',
            planId,
            message: client.language === 'hi' ? 'Plan रद्द' : 'Plan cancelled',
        });
    }
    async handleJoin(ws, msg) {
        const client = {
            ws,
            sessionId: msg.sessionId,
            userId: msg.userId,
            language: msg.language,
            persona: msg.persona || 'swayam',
            history: [],
            toolHistory: [],
            joinedAt: Date.now(),
            // Wake word state
            wakeWordEnabled: msg.wakeWord !== false && this.wakeWordEnabled,
            wakeWordActive: false,
            wakeWordTimeout: undefined,
            // Streaming state
            streamingEnabled: msg.streaming !== false && this.streamingEnabled,
            // Phase 12.1: Intelligence state
            intelligenceEnabled: msg.intelligence !== false && this.intelligenceEnabled,
            pendingPlan: undefined,
            lastAnalysis: undefined,
        };
        this.clients.set(ws, client);
        console.log(`👤 Swayam MCP: ${msg.userId} joined (${msg.language}, ${client.persona})`);
        console.log(`   Wake Word: ${client.wakeWordEnabled ? 'enabled' : 'disabled'}, Streaming: ${client.streamingEnabled ? 'enabled' : 'disabled'}, Intelligence: ${client.intelligenceEnabled ? 'enabled' : 'disabled'}`);
        // Send greeting
        const personaConfig = this.personas[client.persona] || this.personas.swayam;
        const greeting = personaConfig.greeting || 'Hello!';
        try {
            const ttsResult = await this.tts.synthesize(greeting, client.language);
            this.send(ws, {
                type: 'response',
                text: greeting,
                audio: ttsResult.audio.toString('base64'),
                intent: 'greeting',
                tools: [],
                latencyMs: 0,
            });
        }
        catch {
            this.send(ws, { type: 'response', text: greeting, intent: 'greeting', tools: [], latencyMs: 0 });
        }
    }
    async handleAudio(ws, audioBase64, continuous = false) {
        const client = this.clients.get(ws);
        if (!client) {
            this.sendError(ws, 'NOT_JOINED', 'Join a session first');
            return;
        }
        const startTime = Date.now();
        try {
            const audioBuffer = Buffer.from(audioBase64, 'base64');
            const sttResult = await this.stt.transcribe(audioBuffer, client.language);
            if (!sttResult.text?.trim()) {
                this.send(ws, { type: 'transcript', text: '', confidence: 0 });
                return;
            }
            // Wake word detection for continuous listening mode
            if (continuous && client.wakeWordEnabled && this.wakeWordDetector) {
                const wakeWordResult = this.wakeWordDetector.detectInText(sttResult.text);
                if (wakeWordResult.detected) {
                    // Wake word detected! Extract command after wake word
                    const extracted = this.wakeWordDetector.extractCommand(sttResult.text);
                    const command = extracted?.command || '';
                    // Notify client
                    this.send(ws, {
                        type: 'wake_word_detected',
                        keyword: wakeWordResult.keyword,
                        confidence: wakeWordResult.confidence,
                        command: command,
                    });
                    // Set active state with timeout
                    client.wakeWordActive = true;
                    if (client.wakeWordTimeout)
                        clearTimeout(client.wakeWordTimeout);
                    client.wakeWordTimeout = setTimeout(() => {
                        client.wakeWordActive = false;
                        this.send(ws, { type: 'wake_word_timeout' });
                    }, this.wakeWordTimeoutMs);
                    // If there's a command after wake word, process it
                    if (command.trim()) {
                        this.send(ws, { type: 'transcript', text: command, confidence: sttResult.confidence });
                        await this.processAndRespond(ws, client, command, startTime);
                    }
                    else {
                        // Just acknowledged wake word, waiting for command
                        this.send(ws, { type: 'listening', message: 'Listening...' });
                    }
                    return;
                }
                // In continuous mode without wake word active, only process if wake word was recently detected
                if (!client.wakeWordActive) {
                    // Ignore audio until wake word is detected
                    return;
                }
                // Wake word was active, clear timeout and process command
                if (client.wakeWordTimeout)
                    clearTimeout(client.wakeWordTimeout);
                client.wakeWordActive = false;
            }
            // Normal processing
            this.send(ws, { type: 'transcript', text: sttResult.text, confidence: sttResult.confidence });
            await this.processAndRespond(ws, client, sttResult.text, startTime);
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Swayam MCP audio error:', errMsg);
            this.sendError(ws, 'PROCESSING_ERROR', errMsg);
        }
    }
    async handleText(ws, text) {
        const client = this.clients.get(ws);
        if (!client) {
            this.sendError(ws, 'NOT_JOINED', 'Join a session first');
            return;
        }
        await this.processAndRespond(ws, client, text, Date.now());
    }
    async handleToolCall(ws, toolName, args) {
        const client = this.clients.get(ws);
        if (!client) {
            this.sendError(ws, 'NOT_JOINED', 'Join a session first');
            return;
        }
        const startTime = Date.now();
        this.stats.toolCalls++;
        try {
            const result = await this.executeTool(toolName, args);
            client.toolHistory.push({
                tool: toolName,
                result,
                timestamp: Date.now(),
            });
            this.stats.toolSuccesses++;
            this.send(ws, {
                type: 'tool_result',
                tool: toolName,
                result,
                success: true,
                latencyMs: Date.now() - startTime,
            });
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : 'Tool execution failed';
            this.send(ws, {
                type: 'tool_result',
                tool: toolName,
                result: null,
                success: false,
                error: errMsg,
                latencyMs: Date.now() - startTime,
            });
        }
    }
    async handleExecute(ws, code, language) {
        const client = this.clients.get(ws);
        if (!client) {
            this.sendError(ws, 'NOT_JOINED', 'Join a session first');
            return;
        }
        const startTime = Date.now();
        console.log(`⚡ Swayam MCP: Executing ${language} code for ${client.userId}`);
        try {
            const response = await fetch('http://localhost:4220/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language, code }),
            });
            const result = (await response.json());
            this.send(ws, {
                type: 'execute_result',
                success: result.success,
                output: result.output || '',
                error: result.error,
                executionTime: result.time || Date.now() - startTime,
                language,
            });
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : 'Execution failed';
            console.error('❌ Swayam MCP execute error:', errMsg);
            this.send(ws, {
                type: 'execute_result',
                success: false,
                output: '',
                error: errMsg,
                executionTime: Date.now() - startTime,
                language,
            });
        }
    }
    /**
     * Main processing with MCP tool integration and Conversational Intelligence
     */
    async processAndRespond(ws, client, userText, startTime) {
        try {
            client.history.push({ role: 'user', content: userText });
            if (client.history.length > 10)
                client.history = client.history.slice(-10);
            // Log interaction event (async, don't await)
            (0, index_js_2.logLearningEvent)({
                type: 'interaction',
                source: 'websocket',
                persona: client.persona,
                sessionId: client.sessionId,
                userId: client.userId,
                data: { text: userText, language: client.language },
                outcome: 'pending',
            }).catch(() => { });
            const personaConfig = this.personas[client.persona] || this.personas.swayam;
            const langInstruction = LANGUAGE_INSTRUCTIONS[client.language] || LANGUAGE_INSTRUCTIONS.en;
            // ================================================================
            // PHASE 12.1: CONVERSATIONAL INTELLIGENCE
            // ================================================================
            if (client.intelligenceEnabled && this.intelligenceEnabled) {
                // Check for plan confirmation responses (yes/no/हां/नहीं)
                if (client.pendingPlan) {
                    const confirmMatch = /^(yes|y|हां|ha|हाँ|ठीक|ok|शुरू|start|confirm)$/i.test(userText.trim());
                    const cancelMatch = /^(no|n|नहीं|nahi|cancel|रद्द|stop|रुको)$/i.test(userText.trim());
                    if (confirmMatch) {
                        await this.handlePlanConfirm(ws, client.pendingPlan.id, true);
                        return;
                    }
                    else if (cancelMatch) {
                        await this.handlePlanConfirm(ws, client.pendingPlan.id, false);
                        return;
                    }
                }
                // Analyze with ConversationAI
                const analysis = await this.conversationAI.analyze(userText, client.sessionId, { persona: client.persona, language: client.language });
                client.lastAnalysis = analysis;
                console.log(`🧠 Intelligence Analysis:`);
                console.log(`   Intent: ${analysis.intent.primary} (${analysis.confidence.toFixed(2)})`);
                console.log(`   Tools needed: ${analysis.toolsNeeded.join(', ') || 'none'}`);
                console.log(`   Has plan: ${analysis.suggestedPlan ? 'yes' : 'no'}`);
                // Send analysis to client
                this.send(ws, {
                    type: 'analysis',
                    intent: analysis.intent,
                    entities: analysis.entities,
                    confidence: analysis.confidence,
                    toolsNeeded: analysis.toolsNeeded,
                    toolsMissing: analysis.toolsMissing,
                    packagesAvailable: analysis.packagesAvailable.map(p => p.name),
                    latencyMs: Date.now() - startTime,
                });
                // If we have a suggested plan with high confidence, send it for confirmation
                if (analysis.suggestedPlan && analysis.confidence > 0.6) {
                    client.pendingPlan = analysis.suggestedPlan;
                    this.activePlans.set(analysis.suggestedPlan.id, analysis.suggestedPlan);
                    // Generate response with plan
                    const response = await this.conversationAI.generateResponse(analysis, client.language);
                    // Send plan to client
                    this.send(ws, {
                        type: 'plan_suggested',
                        plan: analysis.suggestedPlan,
                        message: response,
                        requiresConfirmation: analysis.requiresConfirmation,
                        followUpQuestions: analysis.followUpQuestions,
                    });
                    // TTS for the response
                    try {
                        const ttsResult = await this.tts.synthesize(response.substring(0, 500), client.language);
                        this.send(ws, { type: 'audio', audio: ttsResult.audio.toString('base64') });
                    }
                    catch { /* TTS optional */ }
                    return;
                }
                // If there are follow-up questions (missing entities), ask them
                if (analysis.followUpQuestions.length > 0 && analysis.requiresConfirmation) {
                    const questionText = analysis.followUpQuestions[0];
                    this.send(ws, {
                        type: 'follow_up',
                        questions: analysis.followUpQuestions,
                        message: questionText,
                    });
                    try {
                        const ttsResult = await this.tts.synthesize(questionText, client.language);
                        this.send(ws, { type: 'audio', audio: ttsResult.audio.toString('base64') });
                    }
                    catch { /* TTS optional */ }
                    return;
                }
                // Use intelligence-derived intent and tools
                // Fall through to enhanced processing below
            }
            // ================================================================
            // STANDARD PROCESSING (enhanced with intelligence if available)
            // ================================================================
            // Step 1: Classify intent and extract entities
            const intent = client.lastAnalysis
                ? {
                    type: client.lastAnalysis.intent.primary,
                    confidence: client.lastAnalysis.confidence,
                    suggestedTools: client.lastAnalysis.toolsNeeded,
                    entities: client.lastAnalysis.entities,
                }
                : this.classifyIntent(userText, client.persona);
            console.log(`🎯 Intent: ${intent.type} (${intent.confidence.toFixed(2)}) | Tools: ${intent.suggestedTools.join(', ') || 'none'}`);
            // Step 2: Execute relevant MCP tools
            let toolResults = [];
            if (this.mcpEnabled && intent.suggestedTools.length > 0) {
                toolResults = await this.executeIntentTools(intent, userText, client);
            }
            // Step 3: Build context with tool results
            const toolContext = this.buildToolContext(toolResults);
            // Step 4: Build system prompt with tool results
            let systemPrompt = personaConfig.systemPrompt;
            if (toolContext) {
                systemPrompt += `\n\n--- TOOL RESULTS ---\n${toolContext}\n--- END TOOL RESULTS ---\n\nUse the above tool results to provide accurate, specific answers.`;
            }
            systemPrompt += `\n\n${langInstruction}`;
            // Step 5: Call AI
            const aiResponse = await this.callAI(systemPrompt, client.history);
            client.history.push({ role: 'assistant', content: aiResponse });
            // Prepare voice-friendly text
            const voiceText = aiResponse
                .replace(/```[\s\S]*?```/g, '')
                .replace(/[*`]/g, '')
                .trim();
            // Step 6: TTS (streaming or regular)
            if (client.streamingEnabled && this.streamingTTS && voiceText.length > 100) {
                // Use streaming TTS for longer responses
                this.stats.streamingResponses++;
                // Send text response immediately (before audio)
                this.send(ws, {
                    type: 'response',
                    text: aiResponse,
                    streaming: true,
                    intent: intent.type,
                    tools: toolResults.map((t) => t.tool),
                    latencyMs: Date.now() - startTime,
                });
                // Stream audio chunks
                try {
                    await this.streamingTTS.streamWithCallback(voiceText.substring(0, 1000), // Limit for streaming
                    client.language, (chunk) => {
                        this.send(ws, {
                            type: 'audio_chunk',
                            index: chunk.index,
                            audio: chunk.audio.toString('base64'),
                            text: chunk.text,
                            duration: chunk.duration,
                            isLast: chunk.isLast,
                        });
                    });
                    this.send(ws, { type: 'audio_complete' });
                }
                catch (error) {
                    console.error('Streaming TTS error:', error);
                    this.send(ws, { type: 'audio_error', message: 'Streaming TTS failed' });
                }
            }
            else {
                // Regular TTS (single audio response)
                let audioBase64;
                try {
                    if (voiceText) {
                        const ttsResult = await this.tts.synthesize(voiceText.substring(0, 500), client.language);
                        audioBase64 = ttsResult.audio.toString('base64');
                    }
                }
                catch {
                    /* TTS failed, continue without audio */
                }
                this.send(ws, {
                    type: 'response',
                    text: aiResponse,
                    audio: audioBase64,
                    intent: intent.type,
                    tools: toolResults.map((t) => t.tool),
                    latencyMs: Date.now() - startTime,
                });
            }
            // Log successful response event
            (0, index_js_2.logLearningEvent)({
                type: 'response',
                source: 'ai',
                persona: client.persona,
                sessionId: client.sessionId,
                userId: client.userId,
                data: {
                    userText,
                    intent: intent.type,
                    toolsUsed: toolResults.map((t) => t.tool),
                    responseLength: aiResponse.length,
                },
                outcome: 'success',
                durationMs: Date.now() - startTime,
            }).catch(() => { });
            // Update intent pattern
            (0, index_js_2.updatePattern)(`intent:${intent.type}:${client.persona}`, `${intent.type} intent in ${client.persona}`, { success: true, toolsUsed: toolResults.length }, [{ confidence: intent.confidence }]).catch(() => { });
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : 'Unknown error';
            this.sendError(ws, 'AI_ERROR', errMsg);
            // Log error event
            (0, index_js_2.logLearningEvent)({
                type: 'error',
                source: 'ai',
                persona: client.persona,
                sessionId: client.sessionId,
                userId: client.userId,
                data: { userText, error: errMsg },
                outcome: 'failure',
                durationMs: Date.now() - startTime,
            }).catch(() => { });
        }
    }
    /**
     * Enhanced intent classification with entity extraction
     */
    classifyIntent(text, persona) {
        const lower = text.toLowerCase();
        const personaConfig = this.personas[persona] || this.personas.swayam;
        const allowedTools = personaConfig.mcpTools || [];
        let intentType = 'chat';
        let confidence = 0.5;
        let suggestedTools = [];
        const entities = {};
        // Logistics patterns (wowtruck persona priority)
        if (/(?:truck|route|delivery|shipment|ट्रक|रूट|डिलीवरी|load|भार|माल)/i.test(lower) ||
            /(?:hos|hours of service|driving hours|ड्राइविंग)/i.test(lower) ||
            /(?:permit|परमिट|toll|टोल|fuel|diesel|डीजल)/i.test(lower)) {
            intentType = 'logistics_query';
            confidence = 0.85;
            suggestedTools = ['logistics_search'];
            // Extract route if mentioned
            const routeMatch = text.match(/(?:from|से)\s+(\w+)\s+(?:to|तक)\s+(\w+)/i);
            if (routeMatch) {
                entities.origin = routeMatch[1];
                entities.destination = routeMatch[2];
                intentType = 'logistics_route';
                suggestedTools = ['logistics_route', 'logistics_search'];
            }
        }
        // Compliance patterns
        if (/(?:compliance|compliant|rule|regulation|नियम|कानून|hazmat|हैज़मैट)/i.test(lower)) {
            intentType = 'logistics_compliance';
            confidence = 0.85;
            suggestedTools = ['logistics_compliance'];
        }
        // GST/Tax patterns (complymitra priority)
        if (/(?:gst|जीएसटी|tax|टैक्स|invoice|इनवॉइस|return|रिटर्न)/i.test(lower)) {
            intentType = 'gst_query';
            confidence = 0.9;
            suggestedTools = ['gst_validate', 'compliance_search'];
        }
        // Memory patterns
        if (/(?:remember|याद|recall|store|save|सेव)/i.test(lower)) {
            intentType = lower.includes('remember') || lower.includes('recall') ? 'recall_memory' : 'store_memory';
            confidence = 0.8;
            suggestedTools = intentType === 'recall_memory' ? ['eon_recall'] : ['eon_store'];
        }
        // Code patterns
        if (/(?:code|program|बनाओ|लिखो|python|javascript|function)/i.test(lower)) {
            intentType = 'code';
            confidence = 0.85;
            suggestedTools = []; // No MCP tools for code
        }
        // Question patterns (can use search)
        if (/(?:क्या|कैसे|क्यों|what|how|why|when|where|समझाओ|बताओ)/i.test(lower)) {
            if (intentType === 'chat') {
                intentType = 'question';
                confidence = 0.7;
                // Only add search if persona allows it
                if (allowedTools.includes('logistics_search')) {
                    suggestedTools = ['logistics_search'];
                }
            }
        }
        // Filter tools by persona permissions
        suggestedTools = suggestedTools.filter((tool) => allowedTools.includes(tool));
        return { type: intentType, confidence, suggestedTools, entities };
    }
    /**
     * Execute tools based on intent
     */
    async executeIntentTools(intent, userText, client) {
        const results = [];
        for (const toolName of intent.suggestedTools) {
            const toolStartTime = Date.now();
            try {
                this.stats.toolCalls++;
                const args = this.buildToolArgs(toolName, userText, intent.entities);
                const result = await this.executeTool(toolName, args);
                results.push({ tool: toolName, result });
                client.toolHistory.push({ tool: toolName, result, timestamp: Date.now() });
                this.stats.toolSuccesses++;
                console.log(`✅ Tool ${toolName} executed successfully`);
                // Log tool usage (async, don't await)
                (0, index_js_2.logToolUsage)({
                    toolName,
                    persona: client.persona,
                    sessionId: client.sessionId,
                    params: args,
                    result,
                    success: true,
                    durationMs: Date.now() - toolStartTime,
                }).catch(() => { });
                // Update pattern for successful tool usage
                (0, index_js_2.updatePattern)(`tool:${toolName}:${client.persona}`, `Successful ${toolName} usage in ${client.persona}`, { success: true, intent: intent.type }, [{ query: userText.substring(0, 100) }]).catch(() => { });
                // Stop after first successful search to avoid redundancy
                if (toolName.includes('search') && result)
                    break;
            }
            catch (error) {
                console.error(`❌ Tool ${toolName} failed:`, error);
                // Log failed tool usage
                (0, index_js_2.logToolUsage)({
                    toolName,
                    persona: client.persona,
                    sessionId: client.sessionId,
                    params: this.buildToolArgs(toolName, userText, intent.entities),
                    success: false,
                    durationMs: Date.now() - toolStartTime,
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                }).catch(() => { });
            }
        }
        return results;
    }
    /**
     * Build tool arguments from user text and entities
     */
    buildToolArgs(toolName, userText, entities) {
        switch (toolName) {
            case 'logistics_search':
                return {
                    query: userText,
                    limit: 3,
                };
            case 'logistics_route':
                return {
                    origin: entities.origin || 'Delhi',
                    destination: entities.destination || 'Mumbai',
                };
            case 'logistics_compliance':
                return {
                    topic: userText,
                };
            case 'logistics_retrieve':
                return {
                    documentId: entities.documentId || '',
                };
            case 'eon_search':
            case 'eon_recall':
                return {
                    query: userText,
                    limit: 5,
                };
            case 'eon_store':
                return {
                    content: userText,
                    type: 'fact',
                };
            default:
                return { query: userText };
        }
    }
    /**
     * Execute a tool from @powerpbox/mcp registry
     */
    async executeTool(toolName, args) {
        const tool = this.toolMap.get(toolName);
        if (!tool) {
            throw new Error(`Unknown tool: ${toolName}`);
        }
        const result = await tool.execute(args);
        if (!result.success) {
            throw new Error(result.error || 'Tool execution failed');
        }
        return result.data;
    }
    /**
     * Build context string from tool results
     */
    buildToolContext(toolResults) {
        if (toolResults.length === 0)
            return '';
        const parts = [];
        for (const { tool, result } of toolResults) {
            if (!result)
                continue;
            if (tool === 'logistics_search' && Array.isArray(result)) {
                const docs = result.slice(0, 3);
                parts.push(`Search Results (${docs.length} documents):\n` +
                    docs
                        .map((d, i) => `${i + 1}. ${d.title || 'Document'}\n   ${(d.content || '').substring(0, 200)}...`)
                        .join('\n\n'));
            }
            else if (tool === 'logistics_compliance') {
                const compliance = result;
                parts.push(`Compliance Check:\n` +
                    `Status: ${compliance.compliant ? 'Compliant' : 'Issues Found'}\n` +
                    `Rules: ${(compliance.rules || []).map((r) => `- ${r.rule}: ${r.status}`).join('\n')}\n` +
                    `Recommendations: ${(compliance.recommendations || []).join(', ')}`);
            }
            else if (tool === 'logistics_route') {
                const route = result;
                parts.push(`Route: ${route.origin} → ${route.destination}\n` +
                    `Distance: ${route.distance} km\n` +
                    `Est. Time: ${route.estimatedTime}\n` +
                    `Waypoints: ${(route.waypoints || []).map((w) => w.name).join(' → ')}`);
            }
            else {
                // Generic result
                parts.push(`${tool}: ${JSON.stringify(result).substring(0, 300)}`);
            }
        }
        return parts.join('\n\n');
    }
    async callAI(systemPrompt, history) {
        const response = await fetch(`${this.aiProxyUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'system', content: systemPrompt }, ...history],
                max_tokens: 1000,
                temperature: 0.7,
            }),
        });
        if (!response.ok)
            throw new Error(`AI Proxy error: ${response.status}`);
        const data = (await response.json());
        return data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';
    }
    handleDisconnect(ws) {
        const client = this.clients.get(ws);
        if (client) {
            console.log(`👋 Swayam MCP: ${client.userId} disconnected`);
            this.clients.delete(ws);
        }
    }
    send(ws, data) {
        if (ws.readyState === ws.OPEN)
            ws.send(JSON.stringify(data));
    }
    sendError(ws, code, message) {
        this.stats.errors++;
        this.send(ws, { type: 'error', code, message });
    }
    getStats() {
        const intelligenceSummary = this.intelligenceEnabled
            ? this.conversationAI.getCapabilitySummary()
            : null;
        return {
            ...this.stats,
            activeClients: this.clients.size,
            mcpEnabled: this.mcpEnabled,
            totalTools: this.toolMap.size,
            categories: this.toolRegistry?.getCategories() || {},
            // Phase 12.1: Intelligence stats
            intelligenceEnabled: this.intelligenceEnabled,
            activePlans: this.activePlans.size,
            intelligence: intelligenceSummary,
        };
    }
    /**
     * Get intelligence capabilities (Phase 12.1)
     */
    getIntelligenceCapabilities() {
        if (!this.intelligenceEnabled) {
            return { enabled: false };
        }
        return {
            enabled: true,
            ...this.conversationAI.getCapabilitySummary(),
            packages: this.conversationAI.getPackageDiscovery().getAllPackages().map(p => ({
                name: p.name,
                capabilities: p.capabilities,
                tools: p.tools,
                domain: p.domain,
            })),
        };
    }
    /**
     * Get active plans (Phase 12.1)
     */
    getActivePlans() {
        return Array.from(this.activePlans.values());
    }
    /**
     * Get available MCP tools
     */
    getAvailableTools() {
        return Array.from(this.toolMap.keys());
    }
    /**
     * Get tools by category
     */
    getToolsByCategory(category) {
        if (!this.toolRegistry)
            return [];
        const categories = this.toolRegistry.getCategories();
        return (categories[category] || []).map((t) => t.name);
    }
    /**
     * Get tool details
     */
    getToolInfo(toolName) {
        return this.toolMap.get(toolName);
    }
    /**
     * Execute a tool directly (for REST API testing)
     */
    async executeToolDirect(toolName, params) {
        const tool = this.toolMap.get(toolName);
        if (!tool) {
            throw new Error(`Unknown tool: ${toolName}. Available: ${Array.from(this.toolMap.keys()).join(', ')}`);
        }
        const result = await tool.execute(params);
        if (!result.success) {
            throw new Error(result.error || 'Tool execution failed');
        }
        return result.data;
    }
}
exports.SwayamWebSocketHandlerMCP = SwayamWebSocketHandlerMCP;
exports.default = SwayamWebSocketHandlerMCP;
//# sourceMappingURL=swayam-handler-mcp.js.map