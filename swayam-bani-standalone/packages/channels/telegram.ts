/**
 * SWAYAM Telegram Bot Integration
 * Full-featured Telegram bot with inline keyboards and voice support
 */

import { processMessage, logChannelInteraction, IncomingMessage, OutgoingMessage } from './router';

// Telegram API types
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  voice?: { file_id: string; duration: number };
  audio?: { file_id: string };
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

// Configuration
interface TelegramConfig {
  botToken: string;
  botUsername?: string;
  webhookUrl?: string;
}

let config: TelegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  botUsername: process.env.TELEGRAM_BOT_USERNAME,
  webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
};

const TELEGRAM_API = 'https://api.telegram.org/bot';

/**
 * Set Telegram configuration
 */
export function configure(newConfig: Partial<TelegramConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Handle incoming Telegram webhook
 */
export async function handleWebhook(update: TelegramUpdate): Promise<{ success: boolean }> {
  try {
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    } else if (update.message) {
      await handleMessage(update.message);
    }
    return { success: true };
  } catch (error) {
    console.error('[Telegram] Webhook error:', error);
    return { success: false };
  }
}

/**
 * Handle text/voice message
 */
async function handleMessage(msg: TelegramMessage): Promise<void> {
  const chatId = msg.chat.id.toString();
  const userId = msg.from?.id.toString() || chatId;
  const userLang = msg.from?.language_code;

  console.log(`[Telegram] Message from ${userId} in ${chatId}: ${msg.text || '[voice]'}`);

  try {
    // Handle voice messages
    let text = msg.text;
    if (msg.voice || msg.audio) {
      const fileId = msg.voice?.file_id || msg.audio?.file_id;
      if (fileId) {
        text = await transcribeVoice(fileId);
        if (!text) {
          await sendMessage(chatId, 'Sorry, I could not transcribe your voice message.');
          return;
        }
      }
    }

    if (!text) return;

    const message: IncomingMessage = {
      channel: 'telegram',
      channelUserId: userId,
      channelChatId: chatId,
      text,
      language: userLang === 'hi' ? 'hi' : userLang === 'en' ? 'en' : undefined,
    };

    await logChannelInteraction('telegram', userId, 'incoming', true);

    // Send typing indicator
    await sendChatAction(chatId, 'typing');

    const response = await processMessage(message);

    await sendFormattedResponse(chatId, response);
    await logChannelInteraction('telegram', userId, 'outgoing', true);
  } catch (error) {
    console.error('[Telegram] Message handling error:', error);
    await sendMessage(chatId, '❌ Something went wrong. Please try again.');
    await logChannelInteraction('telegram', userId, 'outgoing', false);
  }
}

/**
 * Handle callback query (button click)
 */
async function handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
  const chatId = query.message?.chat.id.toString();
  const userId = query.from.id.toString();
  const data = query.data;

  if (!chatId || !data) return;

  console.log(`[Telegram] Callback from ${userId}: ${data}`);

  try {
    // Answer callback to remove loading state
    await answerCallbackQuery(query.id);

    // Process as command or text
    const message: IncomingMessage = {
      channel: 'telegram',
      channelUserId: userId,
      channelChatId: chatId,
      text: data,
    };

    await logChannelInteraction('telegram', userId, 'incoming', true);

    const response = await processMessage(message);
    await sendFormattedResponse(chatId, response);

    await logChannelInteraction('telegram', userId, 'outgoing', true);
  } catch (error) {
    console.error('[Telegram] Callback error:', error);
  }
}

/**
 * Send formatted response with optional keyboard
 */
async function sendFormattedResponse(
  chatId: string,
  response: OutgoingMessage
): Promise<void> {
  const keyboard = response.buttons
    ? {
        inline_keyboard: response.buttons.map((btn) => [
          { text: btn.label, callback_data: btn.payload },
        ]),
      }
    : undefined;

  await sendMessage(chatId, response.text, keyboard);

  // Send audio if available
  if (response.audio) {
    await sendVoice(chatId, response.audio);
  }
}

/**
 * Send text message
 */
async function sendMessage(
  chatId: string,
  text: string,
  replyMarkup?: Record<string, unknown>
): Promise<boolean> {
  try {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    };

    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(`${TELEGRAM_API}${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Retry without markdown if parsing failed
      if (text.includes('*') || text.includes('_')) {
        payload.parse_mode = undefined;
        await fetch(`${TELEGRAM_API}${config.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
    }

    return response.ok;
  } catch (error) {
    console.error('[Telegram] Send message error:', error);
    return false;
  }
}

/**
 * Send voice message
 */
async function sendVoice(chatId: string, audioBase64: string): Promise<boolean> {
  try {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64.replace(/^data:audio\/\w+;base64,/, ''), 'base64');

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('voice', new Blob([audioBuffer], { type: 'audio/ogg' }), 'voice.ogg');

    const response = await fetch(`${TELEGRAM_API}${config.botToken}/sendVoice`, {
      method: 'POST',
      body: formData,
    });

    return response.ok;
  } catch (error) {
    console.error('[Telegram] Send voice error:', error);
    return false;
  }
}

/**
 * Send chat action (typing indicator)
 */
async function sendChatAction(
  chatId: string,
  action: 'typing' | 'record_voice' | 'upload_voice'
): Promise<void> {
  try {
    await fetch(`${TELEGRAM_API}${config.botToken}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
  } catch (error) {
    console.error('[Telegram] Chat action error:', error);
  }
}

/**
 * Answer callback query
 */
async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  try {
    await fetch(`${TELEGRAM_API}${config.botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch (error) {
    console.error('[Telegram] Answer callback error:', error);
  }
}

/**
 * Transcribe voice message
 */
async function transcribeVoice(fileId: string): Promise<string | null> {
  try {
    // Get file path
    const fileResponse = await fetch(
      `${TELEGRAM_API}${config.botToken}/getFile?file_id=${fileId}`
    );
    const fileData = await fileResponse.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      return null;
    }

    // Download file
    const fileUrl = `https://api.telegram.org/file/bot${config.botToken}/${fileData.result.file_path}`;
    const audioResponse = await fetch(fileUrl);
    const audioBuffer = await audioResponse.arrayBuffer();

    // Send to STT service
    const sttResponse = await fetch('http://localhost:7777/stt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: Buffer.from(audioBuffer).toString('base64'),
        language: 'hi',
      }),
    });

    if (!sttResponse.ok) return null;

    const sttData = await sttResponse.json();
    return sttData.text || sttData.transcript || null;
  } catch (error) {
    console.error('[Telegram] Voice transcription error:', error);
    return null;
  }
}

/**
 * Set webhook URL
 */
export async function setWebhook(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API}${config.botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    console.log('[Telegram] Webhook set:', data);
    return data.ok;
  } catch (error) {
    console.error('[Telegram] Set webhook error:', error);
    return false;
  }
}

/**
 * Get bot info
 */
export async function getBotInfo(): Promise<TelegramUser | null> {
  try {
    const response = await fetch(`${TELEGRAM_API}${config.botToken}/getMe`);
    const data = await response.json();
    return data.ok ? data.result : null;
  } catch (error) {
    console.error('[Telegram] Get bot info error:', error);
    return null;
  }
}

/**
 * Send proactive message
 */
export async function sendProactiveMessage(
  chatId: string,
  text: string,
  buttons?: Array<{ label: string; payload: string }>
): Promise<boolean> {
  const keyboard = buttons
    ? {
        inline_keyboard: buttons.map((btn) => [
          { text: btn.label, callback_data: btn.payload },
        ]),
      }
    : undefined;

  return sendMessage(chatId, text, keyboard);
}

export default {
  configure,
  handleWebhook,
  setWebhook,
  getBotInfo,
  sendProactiveMessage,
};
