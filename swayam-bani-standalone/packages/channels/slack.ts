/**
 * SWAYAM Slack App Integration
 * Supports Slack Events API, Slash Commands, and Interactive Components
 */

import crypto from 'crypto';
import { processMessage, logChannelInteraction, IncomingMessage, OutgoingMessage } from './router';

// Slack event types
interface SlackEvent {
  type: string;
  user?: string;
  channel?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
  bot_id?: string;
}

interface SlackEventPayload {
  token: string;
  team_id: string;
  api_app_id: string;
  event: SlackEvent;
  type: string;
  event_id: string;
  event_time: number;
  challenge?: string;
}

interface SlackSlashCommand {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

interface SlackInteractivePayload {
  type: string;
  user: { id: string; username: string };
  channel: { id: string };
  actions: Array<{ action_id: string; value: string }>;
  response_url: string;
  trigger_id: string;
}

// Configuration
interface SlackConfig {
  botToken: string;
  signingSecret: string;
  appId?: string;
}

let config: SlackConfig = {
  botToken: process.env.SLACK_BOT_TOKEN || '',
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
  appId: process.env.SLACK_APP_ID,
};

const SLACK_API = 'https://slack.com/api';

/**
 * Set Slack configuration
 */
export function configure(newConfig: Partial<SlackConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Verify Slack request signature
 */
export function verifySignature(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  const baseString = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac('sha256', config.signingSecret);
  const computedSignature = 'v0=' + hmac.update(baseString).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}

/**
 * Handle Events API webhook
 */
export async function handleEventWebhook(
  payload: SlackEventPayload
): Promise<{ challenge?: string; success: boolean }> {
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
async function handleEvent(event: SlackEvent, teamId: string): Promise<void> {
  // Ignore bot messages to prevent loops
  if (event.bot_id) return;

  // Handle app mentions and direct messages
  if (event.type === 'app_mention' || event.type === 'message') {
    if (!event.user || !event.channel || !event.text) return;

    console.log(`[Slack] Message from ${event.user} in ${event.channel}: ${event.text}`);

    try {
      // Remove bot mention from text
      const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
      if (!text) return;

      const message: IncomingMessage = {
        channel: 'slack',
        channelUserId: event.user,
        channelChatId: event.channel,
        text,
        metadata: { teamId, threadTs: event.thread_ts || event.ts },
      };

      await logChannelInteraction('slack', event.user, 'incoming', true);

      const response = await processMessage(message);

      await sendSlackMessage(event.channel, response, event.thread_ts || event.ts);
      await logChannelInteraction('slack', event.user, 'outgoing', true);
    } catch (error) {
      console.error('[Slack] Event handling error:', error);
      await sendSlackMessage(
        event.channel,
        { text: '❌ Something went wrong. Please try again.' },
        event.thread_ts || event.ts
      );
      await logChannelInteraction('slack', event.user, 'outgoing', false);
    }
  }
}

/**
 * Handle slash command
 */
export async function handleSlashCommand(
  command: SlackSlashCommand
): Promise<{ response_type: string; text: string; blocks?: unknown[] }> {
  console.log(`[Slack] Command ${command.command} from ${command.user_name}: ${command.text}`);

  try {
    const message: IncomingMessage = {
      channel: 'slack',
      channelUserId: command.user_id,
      channelChatId: command.channel_id,
      text: command.text || 'help',
    };

    await logChannelInteraction('slack', command.user_id, 'incoming', true);

    const response = await processMessage(message);

    // Send detailed response via response_url for longer messages
    if (response.text.length > 200) {
      await sendToResponseUrl(command.response_url, response);
      return {
        response_type: 'ephemeral',
        text: 'Processing your request...',
      };
    }

    await logChannelInteraction('slack', command.user_id, 'outgoing', true);

    return {
      response_type: 'in_channel',
      text: response.text,
      blocks: formatSlackBlocks(response),
    };
  } catch (error) {
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
export async function handleInteractive(
  payload: SlackInteractivePayload
): Promise<{ success: boolean }> {
  console.log(`[Slack] Interactive from ${payload.user.id}: ${payload.actions[0]?.value}`);

  try {
    const action = payload.actions[0];
    if (!action) return { success: false };

    const message: IncomingMessage = {
      channel: 'slack',
      channelUserId: payload.user.id,
      channelChatId: payload.channel.id,
      text: action.value,
    };

    await logChannelInteraction('slack', payload.user.id, 'incoming', true);

    const response = await processMessage(message);

    await sendToResponseUrl(payload.response_url, response);
    await logChannelInteraction('slack', payload.user.id, 'outgoing', true);

    return { success: true };
  } catch (error) {
    console.error('[Slack] Interactive error:', error);
    return { success: false };
  }
}

/**
 * Send message to Slack channel
 */
async function sendSlackMessage(
  channel: string,
  response: OutgoingMessage,
  threadTs?: string
): Promise<boolean> {
  try {
    const payload: Record<string, unknown> = {
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
  } catch (error) {
    console.error('[Slack] Post message error:', error);
    return false;
  }
}

/**
 * Send response to response_url
 */
async function sendToResponseUrl(
  responseUrl: string,
  response: OutgoingMessage
): Promise<void> {
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
  } catch (error) {
    console.error('[Slack] Response URL error:', error);
  }
}

/**
 * Format response as Slack blocks
 */
function formatSlackBlocks(response: OutgoingMessage): unknown[] {
  const blocks: unknown[] = [
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
export async function sendProactiveMessage(
  channel: string,
  text: string,
  blocks?: unknown[]
): Promise<boolean> {
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
  } catch (error) {
    console.error('[Slack] Proactive message error:', error);
    return false;
  }
}

/**
 * Get bot info
 */
export async function getBotInfo(): Promise<unknown | null> {
  try {
    const res = await fetch(`${SLACK_API}/auth.test`, {
      headers: { Authorization: `Bearer ${config.botToken}` },
    });
    const data = await res.json();
    return data.ok ? data : null;
  } catch (error) {
    console.error('[Slack] Get bot info error:', error);
    return null;
  }
}

export default {
  configure,
  verifySignature,
  handleEventWebhook,
  handleSlashCommand,
  handleInteractive,
  sendProactiveMessage,
  getBotInfo,
};
