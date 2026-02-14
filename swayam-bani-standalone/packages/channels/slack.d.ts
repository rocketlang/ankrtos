/**
 * SWAYAM Slack App Integration
 * Supports Slack Events API, Slash Commands, and Interactive Components
 */
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
    user: {
        id: string;
        username: string;
    };
    channel: {
        id: string;
    };
    actions: Array<{
        action_id: string;
        value: string;
    }>;
    response_url: string;
    trigger_id: string;
}
interface SlackConfig {
    botToken: string;
    signingSecret: string;
    appId?: string;
}
/**
 * Set Slack configuration
 */
export declare function configure(newConfig: Partial<SlackConfig>): void;
/**
 * Verify Slack request signature
 */
export declare function verifySignature(signature: string, timestamp: string, body: string): boolean;
/**
 * Handle Events API webhook
 */
export declare function handleEventWebhook(payload: SlackEventPayload): Promise<{
    challenge?: string;
    success: boolean;
}>;
/**
 * Handle slash command
 */
export declare function handleSlashCommand(command: SlackSlashCommand): Promise<{
    response_type: string;
    text: string;
    blocks?: unknown[];
}>;
/**
 * Handle interactive component (button click)
 */
export declare function handleInteractive(payload: SlackInteractivePayload): Promise<{
    success: boolean;
}>;
/**
 * Send proactive message
 */
export declare function sendProactiveMessage(channel: string, text: string, blocks?: unknown[]): Promise<boolean>;
/**
 * Get bot info
 */
export declare function getBotInfo(): Promise<unknown | null>;
declare const _default: {
    configure: typeof configure;
    verifySignature: typeof verifySignature;
    handleEventWebhook: typeof handleEventWebhook;
    handleSlashCommand: typeof handleSlashCommand;
    handleInteractive: typeof handleInteractive;
    sendProactiveMessage: typeof sendProactiveMessage;
    getBotInfo: typeof getBotInfo;
};
export default _default;
//# sourceMappingURL=slack.d.ts.map