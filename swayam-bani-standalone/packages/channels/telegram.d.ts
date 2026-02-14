/**
 * SWAYAM Telegram Bot Integration
 * Full-featured Telegram bot with inline keyboards and voice support
 */
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
    voice?: {
        file_id: string;
        duration: number;
    };
    audio?: {
        file_id: string;
    };
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
interface TelegramConfig {
    botToken: string;
    botUsername?: string;
    webhookUrl?: string;
}
/**
 * Set Telegram configuration
 */
export declare function configure(newConfig: Partial<TelegramConfig>): void;
/**
 * Handle incoming Telegram webhook
 */
export declare function handleWebhook(update: TelegramUpdate): Promise<{
    success: boolean;
}>;
/**
 * Set webhook URL
 */
export declare function setWebhook(url: string): Promise<boolean>;
/**
 * Get bot info
 */
export declare function getBotInfo(): Promise<TelegramUser | null>;
/**
 * Send proactive message
 */
export declare function sendProactiveMessage(chatId: string, text: string, buttons?: Array<{
    label: string;
    payload: string;
}>): Promise<boolean>;
declare const _default: {
    configure: typeof configure;
    handleWebhook: typeof handleWebhook;
    setWebhook: typeof setWebhook;
    getBotInfo: typeof getBotInfo;
    sendProactiveMessage: typeof sendProactiveMessage;
};
export default _default;
//# sourceMappingURL=telegram.d.ts.map