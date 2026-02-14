"use strict";
/**
 * SWAYAM Unified Channel Router
 * Routes messages from WhatsApp, Telegram, Slack to the AI backend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateSession = getOrCreateSession;
exports.updateSession = updateSession;
exports.processMessage = processMessage;
exports.logChannelInteraction = logChannelInteraction;
const pg_1 = require("pg");
// Database connection for session tracking
const pool = new pg_1.Pool({
    host: 'localhost',
    user: 'ankr',
    password: 'indrA@0612',
    database: 'ankr_eon',
});
// AI Backend URL
const AI_BACKEND = process.env.AI_BACKEND_URL || 'http://localhost:7777';
/**
 * Get or create session for a channel user
 */
async function getOrCreateSession(channel, channelUserId, channelChatId, defaults = {}) {
    const sessionId = `${channel}_${channelUserId}_${channelChatId}`;
    try {
        // Try to get existing session
        const result = await pool.query(`SELECT * FROM channel_sessions WHERE session_id = $1`, [sessionId]);
        if (result.rows.length > 0) {
            // Update last active
            await pool.query(`UPDATE channel_sessions SET last_active_at = NOW() WHERE session_id = $1`, [sessionId]);
            return {
                sessionId: result.rows[0].session_id,
                channel: result.rows[0].channel,
                channelUserId: result.rows[0].channel_user_id,
                channelChatId: result.rows[0].channel_chat_id,
                persona: result.rows[0].persona,
                language: result.rows[0].language,
                context: result.rows[0].context || [],
                createdAt: result.rows[0].created_at,
                lastActiveAt: new Date(),
            };
        }
        // Create new session
        const persona = defaults.persona || 'swayam';
        const language = defaults.language || 'hi';
        await pool.query(`INSERT INTO channel_sessions
       (session_id, channel, channel_user_id, channel_chat_id, persona, language, context)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [sessionId, channel, channelUserId, channelChatId, persona, language, []]);
        return {
            sessionId,
            channel,
            channelUserId,
            channelChatId,
            persona,
            language,
            context: [],
            createdAt: new Date(),
            lastActiveAt: new Date(),
        };
    }
    catch (error) {
        console.error('[Router] Session error:', error);
        // Return default session on error
        return {
            sessionId,
            channel,
            channelUserId,
            channelChatId,
            persona: defaults.persona || 'swayam',
            language: defaults.language || 'hi',
            context: [],
            createdAt: new Date(),
            lastActiveAt: new Date(),
        };
    }
}
/**
 * Update session settings
 */
async function updateSession(sessionId, updates) {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    if (updates.persona) {
        setClauses.push(`persona = $${paramIndex++}`);
        values.push(updates.persona);
    }
    if (updates.language) {
        setClauses.push(`language = $${paramIndex++}`);
        values.push(updates.language);
    }
    if (updates.context) {
        setClauses.push(`context = $${paramIndex++}`);
        values.push(updates.context);
    }
    if (setClauses.length === 0)
        return;
    values.push(sessionId);
    await pool.query(`UPDATE channel_sessions SET ${setClauses.join(', ')} WHERE session_id = $${paramIndex}`, values);
}
/**
 * Process message through AI backend
 */
async function processMessage(message) {
    const session = await getOrCreateSession(message.channel, message.channelUserId, message.channelChatId, { persona: message.persona, language: message.language });
    try {
        // Handle commands
        if (message.text?.startsWith('/')) {
            return handleCommand(message.text, session);
        }
        // Call AI backend
        const response = await fetch(`${AI_BACKEND}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: message.text,
                audio: message.audio?.toString('base64'),
                sessionId: session.sessionId,
                persona: session.persona,
                language: session.language,
                channel: message.channel,
            }),
        });
        if (!response.ok) {
            throw new Error(`AI backend error: ${response.status}`);
        }
        const data = await response.json();
        // Update context
        if (message.text) {
            const newContext = [...session.context.slice(-9), message.text];
            await updateSession(session.sessionId, { context: newContext });
        }
        return {
            text: data.text || data.response || 'I could not process your request.',
            audio: data.audio || data.audioBase64,
        };
    }
    catch (error) {
        console.error('[Router] Process error:', error);
        return {
            text: getErrorMessage(session.language),
        };
    }
}
/**
 * Handle slash commands
 */
function handleCommand(command, session) {
    const [cmd, ...args] = command.toLowerCase().split(' ');
    switch (cmd) {
        case '/start':
        case '/help':
            return {
                text: getHelpMessage(session.language),
                buttons: [
                    { label: 'Hindi', payload: '/lang hi' },
                    { label: 'English', payload: '/lang en' },
                    { label: 'Tamil', payload: '/lang ta' },
                ],
            };
        case '/lang':
        case '/language':
            const lang = args[0] || 'hi';
            updateSession(session.sessionId, { language: lang });
            return {
                text: getLanguageChangedMessage(lang),
            };
        case '/persona':
            const persona = args[0] || 'swayam';
            updateSession(session.sessionId, { persona });
            return {
                text: `Persona changed to ${persona}`,
            };
        case '/reset':
            updateSession(session.sessionId, { context: [] });
            return {
                text: session.language === 'hi'
                    ? 'बातचीत रीसेट हो गई।'
                    : 'Conversation reset.',
            };
        default:
            return {
                text: session.language === 'hi'
                    ? `अज्ञात कमांड: ${cmd}`
                    : `Unknown command: ${cmd}`,
            };
    }
}
/**
 * Get localized help message
 */
function getHelpMessage(language) {
    const messages = {
        hi: `🎭 *SWAYAM - आपका AI सहायक*

नमस्ते! मैं स्वयं हूं। मैं आपकी मदद कर सकता हूं:
• सवालों के जवाब देना
• अनुवाद करना
• GST/Tax गणना
• Route planning
• और बहुत कुछ!

*कमांड:*
/lang [hi/en/ta/te/bn] - भाषा बदलें
/persona [swayam/wowtruck/complymitra] - AI बदलें
/reset - बातचीत रीसेट करें

बस मुझसे कुछ भी पूछें! 🙏`,
        en: `🎭 *SWAYAM - Your AI Assistant*

Hello! I'm SWAYAM. I can help you with:
• Answering questions
• Translation
• GST/Tax calculations
• Route planning
• And much more!

*Commands:*
/lang [hi/en/ta/te/bn] - Change language
/persona [swayam/wowtruck/complymitra] - Change AI
/reset - Reset conversation

Just ask me anything! 🙏`,
        ta: `🎭 *SWAYAM - உங்கள் AI உதவியாளர்*

வணக்கம்! நான் ஸ்வயம். நான் உங்களுக்கு உதவ முடியும்.

/lang ta - தமிழ் மொழி தேர்வு
/reset - உரையாடலை மீட்டமைக்கவும்`,
    };
    return messages[language] || messages.en;
}
/**
 * Get localized language changed message
 */
function getLanguageChangedMessage(language) {
    const messages = {
        hi: '✅ भाषा हिंदी में बदल दी गई।',
        en: '✅ Language changed to English.',
        bn: '✅ ভাষা বাংলায় পরিবর্তন করা হয়েছে।',
        ta: '✅ மொழி தமிழுக்கு மாற்றப்பட்டது.',
        te: '✅ భాష తెలుగుకు మార్చబడింది.',
        mr: '✅ भाषा मराठीत बदलली.',
        gu: '✅ ભાષા ગુજરાતીમાં બદલાઈ.',
    };
    return messages[language] || `✅ Language changed to ${language}.`;
}
/**
 * Get localized error message
 */
function getErrorMessage(language) {
    const messages = {
        hi: '❌ कुछ गलत हो गया। कृपया दोबारा कोशिश करें।',
        en: '❌ Something went wrong. Please try again.',
        ta: '❌ ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
    };
    return messages[language] || messages.en;
}
/**
 * Log channel interaction for analytics
 */
async function logChannelInteraction(channel, channelUserId, messageType, success) {
    try {
        await pool.query(`INSERT INTO channel_analytics (channel, channel_user_id, message_type, success)
       VALUES ($1, $2, $3, $4)`, [channel, channelUserId, messageType, success]);
    }
    catch (error) {
        console.error('[Router] Analytics log error:', error);
    }
}
exports.default = {
    getOrCreateSession,
    updateSession,
    processMessage,
    logChannelInteraction,
};
//# sourceMappingURL=router.js.map