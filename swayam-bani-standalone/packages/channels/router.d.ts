/**
 * SWAYAM Unified Channel Router
 * Routes messages from WhatsApp, Telegram, Slack to the AI backend
 */
export type Channel = 'whatsapp' | 'telegram' | 'slack' | 'web' | 'widget';
export interface IncomingMessage {
    channel: Channel;
    channelUserId: string;
    channelChatId: string;
    text?: string;
    audio?: Buffer;
    language?: string;
    persona?: string;
    metadata?: Record<string, unknown>;
}
export interface OutgoingMessage {
    text: string;
    audio?: string;
    buttons?: Array<{
        label: string;
        payload: string;
    }>;
    cards?: Array<{
        title: string;
        description: string;
        image?: string;
        buttons?: Array<{
            label: string;
            payload: string;
        }>;
    }>;
}
interface ChannelSession {
    sessionId: string;
    channel: Channel;
    channelUserId: string;
    channelChatId: string;
    persona: string;
    language: string;
    context: string[];
    createdAt: Date;
    lastActiveAt: Date;
}
/**
 * Get or create session for a channel user
 */
export declare function getOrCreateSession(channel: Channel, channelUserId: string, channelChatId: string, defaults?: {
    persona?: string;
    language?: string;
}): Promise<ChannelSession>;
/**
 * Update session settings
 */
export declare function updateSession(sessionId: string, updates: {
    persona?: string;
    language?: string;
    context?: string[];
}): Promise<void>;
/**
 * Process message through AI backend
 */
export declare function processMessage(message: IncomingMessage): Promise<OutgoingMessage>;
/**
 * Log channel interaction for analytics
 */
export declare function logChannelInteraction(channel: Channel, channelUserId: string, messageType: 'incoming' | 'outgoing', success: boolean): Promise<void>;
declare const _default: {
    getOrCreateSession: typeof getOrCreateSession;
    updateSession: typeof updateSession;
    processMessage: typeof processMessage;
    logChannelInteraction: typeof logChannelInteraction;
};
export default _default;
//# sourceMappingURL=router.d.ts.map