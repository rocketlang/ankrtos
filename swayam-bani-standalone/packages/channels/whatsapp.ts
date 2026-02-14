/**
 * SWAYAM WhatsApp Integration
 * Supports Twilio WhatsApp Business API and Meta Cloud API
 */

import { processMessage, logChannelInteraction, IncomingMessage, OutgoingMessage } from './router';

// WhatsApp provider types
type WhatsAppProvider = 'twilio' | 'meta';

// Configuration
interface WhatsAppConfig {
  provider: WhatsAppProvider;
  // Twilio config
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsAppNumber?: string;
  // Meta Cloud API config
  metaAccessToken?: string;
  metaPhoneNumberId?: string;
  metaVerifyToken?: string;
}

let config: WhatsAppConfig = {
  provider: 'twilio',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER,
  metaAccessToken: process.env.META_WHATSAPP_TOKEN,
  metaPhoneNumberId: process.env.META_PHONE_NUMBER_ID,
  metaVerifyToken: process.env.META_VERIFY_TOKEN || 'swayam_verify_token',
};

/**
 * Set WhatsApp configuration
 */
export function configure(newConfig: Partial<WhatsAppConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Handle incoming Twilio webhook
 */
export async function handleTwilioWebhook(body: {
  From: string;
  To: string;
  Body?: string;
  MediaUrl0?: string;
  NumMedia?: string;
}): Promise<string> {
  const phoneNumber = body.From.replace('whatsapp:', '');
  console.log(`[WhatsApp] Incoming from ${phoneNumber}: ${body.Body}`);

  try {
    const message: IncomingMessage = {
      channel: 'whatsapp',
      channelUserId: phoneNumber,
      channelChatId: phoneNumber,
      text: body.Body,
    };

    // Handle voice messages
    if (body.MediaUrl0 && body.NumMedia && parseInt(body.NumMedia) > 0) {
      // Download and process audio - would need to fetch the media
      console.log('[WhatsApp] Voice message received:', body.MediaUrl0);
    }

    await logChannelInteraction('whatsapp', phoneNumber, 'incoming', true);

    const response = await processMessage(message);

    await logChannelInteraction('whatsapp', phoneNumber, 'outgoing', true);

    // Return TwiML response
    return formatTwilioResponse(response);
  } catch (error) {
    console.error('[WhatsApp] Twilio webhook error:', error);
    await logChannelInteraction('whatsapp', phoneNumber, 'outgoing', false);
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, something went wrong. Please try again.</Message>
</Response>`;
  }
}

/**
 * Format response as TwiML
 */
function formatTwilioResponse(response: OutgoingMessage): string {
  let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(response.text)}</Message>`;

  // Add buttons as text (WhatsApp list messages not supported in basic TwiML)
  if (response.buttons && response.buttons.length > 0) {
    const buttonText = response.buttons
      .map((b, i) => `${i + 1}. ${b.label}`)
      .join('\n');
    twiml += `
  <Message>${escapeXml(buttonText)}</Message>`;
  }

  twiml += '\n</Response>';
  return twiml;
}

/**
 * Handle incoming Meta Cloud API webhook
 */
export async function handleMetaWebhook(body: {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { phone_number_id: string };
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          audio?: { id: string };
        }>;
        statuses?: Array<unknown>;
      };
      field: string;
    }>;
  }>;
}): Promise<{ success: boolean }> {
  if (body.object !== 'whatsapp_business_account') {
    return { success: false };
  }

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue;

      const messages = change.value.messages || [];
      for (const msg of messages) {
        if (msg.type === 'text' && msg.text) {
          await handleMetaMessage(msg.from, msg.text.body);
        } else if (msg.type === 'audio' && msg.audio) {
          console.log('[WhatsApp] Audio message:', msg.audio.id);
          // Would need to download audio from Meta API
        }
      }
    }
  }

  return { success: true };
}

/**
 * Process Meta WhatsApp message and send response
 */
async function handleMetaMessage(from: string, text: string): Promise<void> {
  console.log(`[WhatsApp Meta] From ${from}: ${text}`);

  try {
    const message: IncomingMessage = {
      channel: 'whatsapp',
      channelUserId: from,
      channelChatId: from,
      text,
    };

    await logChannelInteraction('whatsapp', from, 'incoming', true);

    const response = await processMessage(message);

    await sendMetaMessage(from, response);
    await logChannelInteraction('whatsapp', from, 'outgoing', true);
  } catch (error) {
    console.error('[WhatsApp Meta] Error:', error);
    await logChannelInteraction('whatsapp', from, 'outgoing', false);
  }
}

/**
 * Send message via Meta Cloud API
 */
async function sendMetaMessage(
  to: string,
  message: OutgoingMessage
): Promise<void> {
  if (!config.metaAccessToken || !config.metaPhoneNumberId) {
    console.error('[WhatsApp Meta] Missing configuration');
    return;
  }

  const payload: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: message.text },
  };

  // Add interactive buttons if available
  if (message.buttons && message.buttons.length > 0) {
    payload.type = 'interactive';
    payload.interactive = {
      type: 'button',
      body: { text: message.text },
      action: {
        buttons: message.buttons.slice(0, 3).map((b, i) => ({
          type: 'reply',
          reply: { id: `btn_${i}`, title: b.label.substring(0, 20) },
        })),
      },
    };
    delete payload.text;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.metaPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.metaAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[WhatsApp Meta] Send error:', error);
    }
  } catch (error) {
    console.error('[WhatsApp Meta] Send error:', error);
  }
}

/**
 * Verify Meta webhook (for initial setup)
 */
export function verifyMetaWebhook(query: {
  'hub.mode'?: string;
  'hub.verify_token'?: string;
  'hub.challenge'?: string;
}): string | null {
  if (
    query['hub.mode'] === 'subscribe' &&
    query['hub.verify_token'] === config.metaVerifyToken
  ) {
    return query['hub.challenge'] || null;
  }
  return null;
}

/**
 * Send proactive message (for notifications)
 */
export async function sendProactiveMessage(
  phoneNumber: string,
  text: string,
  templateName?: string
): Promise<boolean> {
  if (config.provider === 'twilio') {
    return sendTwilioMessage(phoneNumber, text);
  } else {
    await sendMetaMessage(phoneNumber, { text });
    return true;
  }
}

/**
 * Send message via Twilio
 */
async function sendTwilioMessage(to: string, body: string): Promise<boolean> {
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioWhatsAppNumber) {
    console.error('[WhatsApp Twilio] Missing configuration');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${config.twilioWhatsAppNumber}`,
          To: `whatsapp:${to}`,
          Body: body,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[WhatsApp Twilio] Send error:', error);
    return false;
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default {
  configure,
  handleTwilioWebhook,
  handleMetaWebhook,
  verifyMetaWebhook,
  sendProactiveMessage,
};
