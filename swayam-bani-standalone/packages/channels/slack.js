"use strict";
/**
 * SWAYAM Slack App Integration
 * Supports Slack Events API, Slash Commands, and Interactive Components
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configure = configure;
exports.verifySignature = verifySignature;
exports.handleEventWebhook = handleEventWebhook;
exports.handleSlashCommand = handleSlashCommand;
exports.handleInteractive = handleInteractive;
exports.sendProactiveMessage = sendProactiveMessage;
exports.getBotInfo = getBotInfo;
const crypto_1 = __importDefault(require("crypto"));
const router_1 = require("./router");
let config = {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    appId: process.env.SLACK_APP_ID,
};
const SLACK_API = 'https://slack.com/api';
/**
 * Set Slack configuration
 */
function configure(newConfig) {
    config = { ...config, ...newConfig };
}
/**
 * Verify Slack request signature
 */
function verifySignature(signature, timestamp, body) {
    const baseString = `v0:${timestamp}:${body}`;
    const hmac = crypto_1.default.createHmac('sha256', config.signingSecret);
    const computedSignature = 'v0=' + hmac.update(baseString).digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
}
/**
 * Handle Events API webhook
 */
async function handleEventWebhook(payload) {
    // Handle URL verification challenge
    if (payload.type === 'url_verification') {
        return { challenge: payload.challenge, success: true };
    }
    // Handle events
    if (payload.type === 'event_callback' && payload.event) {
        await handleEvent(payload.event, payload.team_id);
    }
    return { success: true };
}
/**
 * Handle Slack event
 */
async function handleEvent(event, teamId) {
    // Ignore bot messages to prevent loops
    if (event.bot_id)
        return;
    // Handle app mentions and direct messages
    if (event.type === 'app_mention' || event.type === 'message') {
        if (!event.user || !event.channel || !event.text)
            return;
        console.log(`[Slack] Message from ${event.user} in ${event.channel}: ${event.text}`);
        try {
            // Remove bot mention from text
            const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
            if (!text)
                return;
            const message = {
                channel: 'slack',
                channelUserId: event.user,
                channelChatId: event.channel,
                text,
                metadata: { teamId, threadTs: event.thread_ts || event.ts },
            };
            await (0, router_1.logChannelInteraction)('slack', event.user, 'incoming', true);
            const response = await (0, router_1.processMessage)(message);
            await sendSlackMessage(event.channel, response, event.thread_ts || event.ts);
            await (0, router_1.logChannelInteraction)('slack', event.user, 'outgoing', true);
        }
        catch (error) {
            console.error('[Slack] Event handling error:', error);
            await sendSlackMessage(event.channel, { text: '❌ Something went wrong. Please try again.' }, event.thread_ts || event.ts);
            await (0, router_1.logChannelInteraction)('slack', event.user, 'outgoing', false);
        }
    }
}
/**
 * Handle slash command
 */
async function handleSlashCommand(command) {
    console.log(`[Slack] Command ${command.command} from ${command.user_name}: ${command.text}`);
    try {
        const message = {
            channel: 'slack',
            channelUserId: command.user_id,
            channelChatId: command.channel_id,
            text: command.text || 'help',
        };
        await (0, router_1.logChannelInteraction)('slack', command.user_id, 'incoming', true);
        const response = await (0, router_1.processMessage)(message);
        // Send detailed response via response_url for longer messages
        if (response.text.length > 200) {
            await sendToResponseUrl(command.response_url, response);
            return {
                response_type: 'ephemeral',
                text: 'Processing your request...',
            };
        }
        await (0, router_1.logChannelInteraction)('slack', command.user_id, 'outgoing', true);
        return {
            response_type: 'in_channel',
            text: response.text,
            blocks: formatSlackBlocks(response),
        };
    }
    catch (error) {
        console.error('[Slack] Slash command error:', error);
        return {
            response_type: 'ephemeral',
            text: '❌ Something went wrong. Please try again.',
        };
    }
}
/**
 * Handle interactive component (button click)
 */
async function handleInteractive(payload) {
    console.log(`[Slack] Interactive from ${payload.user.id}: ${payload.actions[0]?.value}`);
    try {
        const action = payload.actions[0];
        if (!action)
            return { success: false };
        const message = {
            channel: 'slack',
            channelUserId: payload.user.id,
            channelChatId: payload.channel.id,
            text: action.value,
        };
        await (0, router_1.logChannelInteraction)('slack', payload.user.id, 'incoming', true);
        const response = await (0, router_1.processMessage)(message);
        await sendToResponseUrl(payload.response_url, response);
        await (0, router_1.logChannelInteraction)('slack', payload.user.id, 'outgoing', true);
        return { success: true };
    }
    catch (error) {
        console.error('[Slack] Interactive error:', error);
        return { success: false };
    }
}
/**
 * Send message to Slack channel
 */
async function sendSlackMessage(channel, response, threadTs) {
    try {
        const payload = {
            channel,
            text: response.text,
            blocks: formatSlackBlocks(response),
        };
        if (threadTs) {
            payload.thread_ts = threadTs;
        }
        const res = await fetch(`${SLACK_API}/chat.postMessage`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.botToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.ok) {
            console.error('[Slack] Post message error:', data.error);
        }
        return data.ok;
    }
    catch (error) {
        console.error('[Slack] Post message error:', error);
        return false;
    }
}
/**
 * Send response to response_url
 */
async function sendToResponseUrl(responseUrl, response) {
    try {
        await fetch(responseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                response_type: 'in_channel',
                text: response.text,
                blocks: formatSlackBlocks(response),
            }),
        });
    }
    catch (error) {
        console.error('[Slack] Response URL error:', error);
    }
}
/**
 * Format response as Slack blocks
 */
function formatSlackBlocks(response) {
    const blocks = [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: response.text,
            },
        },
    ];
    // Add buttons
    if (response.buttons && response.buttons.length > 0) {
        blocks.push({
            type: 'actions',
            elements: response.buttons.map((btn, i) => ({
                type: 'button',
                text: {
                    type: 'plain_text',
                    text: btn.label,
                },
                action_id: `action_${i}`,
                value: btn.payload,
            })),
        });
    }
    // Add cards
    if (response.cards && response.cards.length > 0) {
        for (const card of response.cards) {
            blocks.push({ type: 'divider' });
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*${card.title}*\n${card.description}`,
                },
                accessory: card.image
                    ? {
                        type: 'image',
                        image_url: card.image,
                        alt_text: card.title,
                    }
                    : undefined,
            });
        }
    }
    return blocks;
}
/**
 * Send proactive message
 */
async function sendProactiveMessage(channel, text, blocks) {
    try {
        const res = await fetch(`${SLACK_API}/chat.postMessage`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.botToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ channel, text, blocks }),
        });
        const data = await res.json();
        return data.ok;
    }
    catch (error) {
        console.error('[Slack] Proactive message error:', error);
        return false;
    }
}
/**
 * Get bot info
 */
async function getBotInfo() {
    try {
        const res = await fetch(`${SLACK_API}/auth.test`, {
            headers: { Authorization: `Bearer ${config.botToken}` },
        });
        const data = await res.json();
        return data.ok ? data : null;
    }
    catch (error) {
        console.error('[Slack] Get bot info error:', error);
        return null;
    }
}
exports.default = {
    configure,
    verifySignature,
    handleEventWebhook,
    handleSlashCommand,
    handleInteractive,
    sendProactiveMessage,
    getBotInfo,
};
//# sourceMappingURL=slack.js.map