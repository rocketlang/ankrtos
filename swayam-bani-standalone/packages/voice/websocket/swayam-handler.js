"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwayamWebSocketHandler = void 0;
const index_js_1 = require("../stt/index.js");
const index_js_2 = require("../tts/index.js");
const executor_js_1 = require("../rocketlang/executor.js");
// ============================================================================
// DEFAULT PERSONAS
// ============================================================================
const DEFAULT_PERSONAS = {
    swayam: {
        name: 'Swayam',
        systemPrompt: `You are Swayam - India's universal AI assistant.
- Respond in the user's language
- Be helpful, concise, and friendly
- Use Indian context and examples
- For code, add comments in user's language`,
        greeting: 'नमस्ते! मैं स्वयं हूं। आपकी क्या मदद करूं?'
    },
    complymitra: {
        name: 'ComplyMitra',
        systemPrompt: `You are ComplyMitra - AI compliance assistant for Indian businesses.
- Expert in GST, Income Tax, Company Law, Labor Laws
- Provide accurate regulatory guidance
- Reference relevant sections and rules`,
        greeting: 'नमस्कार! मैं ComplyMitra हूं। Compliance में कैसे मदद करूं?'
    },
    wowtruck: {
        name: 'WowTruck Assistant',
        systemPrompt: `You are WowTruck AI - Logistics and trucking assistant.
- Help with load booking, tracking, payments
- Know Indian trucking routes and rates`,
        greeting: 'नमस्ते! WowTruck में आपका स्वागत है।'
    },
    freightbox: {
        name: 'FreightBox AI',
        systemPrompt: `You are FreightBox AI - Shipping and freight assistant.
- Expert in international shipping, customs, documentation`,
        greeting: 'Hello! FreightBox AI here.'
    }
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
// SWAYAM WEBSOCKET HANDLER
// ============================================================================
class SwayamWebSocketHandler {
    stt;
    tts;
    aiProxyUrl;
    personas;
    clients = new Map();
    stats = { connections: 0, messages: 0, errors: 0 };
    constructor(config) {
        this.stt = index_js_1.STTFactory.create(config.stt.provider, {
            apiKey: config.stt.apiKey,
            serverUrl: config.stt.serverUrl,
        });
        this.tts = index_js_2.TTSFactory.create(config.tts.provider, {
            apiKey: config.tts.apiKey,
            serverUrl: config.tts.serverUrl,
            defaultVoice: config.tts.defaultVoice || 'anushka',
        });
        this.aiProxyUrl = config.ai.proxyUrl;
        this.personas = { ...DEFAULT_PERSONAS, ...config.personas };
        console.log('🤖 SwayamWebSocketHandler initialized');
        console.log(`   STT: ${this.stt.name}`);
        console.log(`   TTS: ${this.tts.name}`);
        console.log(`   Personas: ${Object.keys(this.personas).join(', ')}`);
    }
    handleConnection(ws) {
        console.log("🔗 Swayam: New connection, socket type:", typeof ws, "has on:", typeof ws?.on);
        this.stats.connections++;
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                await this.handleMessage(ws, message);
            }
            catch (error) {
                console.error('❌ Swayam message error:', error);
                this.sendError(ws, 'PARSE_ERROR', 'Invalid message format');
            }
        });
        ws.on('close', () => this.handleDisconnect(ws));
        ws.on('error', (error) => {
            console.error('❌ Swayam WebSocket error:', error);
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
                await this.handleAudio(ws, message.data);
                break;
            case 'text':
                await this.handleText(ws, message.text);
                break;
            case 'execute':
                await this.handleExecute(ws, message.code, message.language);
                break;
            case 'leave':
                this.handleDisconnect(ws);
                break;
        }
    }
    async handleJoin(ws, msg) {
        const client = {
            ws,
            sessionId: msg.sessionId,
            userId: msg.userId,
            language: msg.language,
            persona: msg.persona || 'swayam',
            history: [],
            joinedAt: Date.now(),
        };
        this.clients.set(ws, client);
        console.log(`👤 Swayam: ${msg.userId} joined (${msg.language}, ${client.persona})`);
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
                latencyMs: 0,
            });
        }
        catch {
            this.send(ws, { type: 'response', text: greeting, intent: 'greeting', latencyMs: 0 });
        }
    }
    async handleAudio(ws, audioBase64) {
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
            this.send(ws, { type: 'transcript', text: sttResult.text, confidence: sttResult.confidence });
            await this.processAndRespond(ws, client, sttResult.text, startTime);
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Swayam audio error:', errMsg);
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
    async handleExecute(ws, code, language) {
        const client = this.clients.get(ws);
        if (!client) {
            this.sendError(ws, 'NOT_JOINED', 'Join a session first');
            return;
        }
        const startTime = Date.now();
        console.log(`⚡ Swayam: Executing ${language} code for ${client.userId}`);
        try {
            // Call ankr-sandbox API
            const response = await fetch('http://localhost:4220/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language, code }),
            });
            const result = await response.json();
            this.send(ws, {
                type: 'execute_result',
                success: result.success,
                output: result.output || '',
                error: result.error,
                executionTime: result.time || (Date.now() - startTime),
                language,
            });
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : 'Execution failed';
            console.error('❌ Swayam execute error:', errMsg);
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
    async processAndRespond(ws, client, userText, startTime) {
        try {
            client.history.push({ role: 'user', content: userText });
            if (client.history.length > 10)
                client.history = client.history.slice(-10);
            // ============================================
            // 🚀 ROCKETLANG FIRST - "Bolo Ho Jaayega"
            // ============================================
            const rocketLang = (0, executor_js_1.getRocketLangExecutor)();
            // Try to execute as a RocketLang command
            if (rocketLang.looksLikeCommand(userText)) {
                const execResult = await rocketLang.tryExecute(userText, client.language);
                if (execResult?.isCommand) {
                    // It was a command - format and respond
                    const formatted = rocketLang.formatResult(execResult, client.language);
                    client.history.push({ role: 'assistant', content: formatted.text });
                    // TTS for command result
                    let audioBase64;
                    try {
                        if (formatted.speakText) {
                            const ttsResult = await this.tts.synthesize(formatted.speakText, client.language);
                            audioBase64 = ttsResult.audio.toString('base64');
                        }
                    }
                    catch { /* TTS failed, continue without audio */ }
                    this.send(ws, {
                        type: 'response',
                        text: formatted.text,
                        audio: audioBase64,
                        intent: 'command',
                        tool: execResult.tool,
                        data: formatted.data,
                        latencyMs: Date.now() - startTime,
                    });
                    console.log(`⚡ RocketLang: Executed "${execResult.tool}" in ${execResult.executionTime}ms`);
                    return;
                }
            }
            // ============================================
            // FALLBACK TO AI CONVERSATION
            // ============================================
            const personaConfig = this.personas[client.persona] || this.personas.swayam;
            const langInstruction = LANGUAGE_INSTRUCTIONS[client.language] || LANGUAGE_INSTRUCTIONS.en;
            const systemPrompt = `${personaConfig.systemPrompt}\n\n${langInstruction}`;
            const aiResponse = await this.callAI(systemPrompt, client.history);
            client.history.push({ role: 'assistant', content: aiResponse });
            // TTS
            let audioBase64;
            try {
                const voiceText = aiResponse.replace(/```[\s\S]*?```/g, '').replace(/[*`]/g, '').trim().substring(0, 500);
                if (voiceText) {
                    const ttsResult = await this.tts.synthesize(voiceText, client.language);
                    audioBase64 = ttsResult.audio.toString('base64');
                }
            }
            catch { /* TTS failed, continue without audio */ }
            const intent = this.classifyIntent(userText);
            this.send(ws, {
                type: 'response',
                text: aiResponse,
                audio: audioBase64,
                intent: intent.type,
                latencyMs: Date.now() - startTime,
            });
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : 'Unknown error';
            this.sendError(ws, 'AI_ERROR', errMsg);
        }
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
        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';
    }
    classifyIntent(text) {
        const lower = text.toLowerCase();
        // RocketLang commands (Hindi + English)
        if (/(?:^पढ़ो|^लिखो|^देखो|^खोजो|^चलाओ|^हटाओ|^बनाओ)/i.test(text))
            return { type: 'command', confidence: 0.9 };
        if (/(?:^read|^write|^list|^search|^run|^git|^npm|^create)/i.test(lower))
            return { type: 'command', confidence: 0.9 };
        // Code generation
        if (/(?:code|program|बनाओ.*code|लिखो.*code|python|javascript)/i.test(lower))
            return { type: 'code', confidence: 0.8 };
        // Questions
        if (/(?:क्या|कैसे|क्यों|what|how|why|समझाओ)/i.test(lower))
            return { type: 'question', confidence: 0.8 };
        // Creative
        if (/(?:कहानी|story|poem|गाना|joke)/i.test(lower))
            return { type: 'creative', confidence: 0.8 };
        return { type: 'chat', confidence: 0.5 };
    }
    handleDisconnect(ws) {
        const client = this.clients.get(ws);
        if (client) {
            console.log(`👋 Swayam: ${client.userId} disconnected`);
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
        return { ...this.stats, activeClients: this.clients.size };
    }
}
exports.SwayamWebSocketHandler = SwayamWebSocketHandler;
exports.default = SwayamWebSocketHandler;
//# sourceMappingURL=swayam-handler.js.map