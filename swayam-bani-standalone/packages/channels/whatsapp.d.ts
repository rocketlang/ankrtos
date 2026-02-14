/**
 * SWAYAM WhatsApp Integration
 * Supports Twilio WhatsApp Business API and Meta Cloud API
 */
type WhatsAppProvider = 'twilio' | 'meta';
interface WhatsAppConfig {
    provider: WhatsAppProvider;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioWhatsAppNumber?: string;
    metaAccessToken?: string;
    metaPhoneNumberId?: string;
    metaVerifyToken?: string;
}
/**
 * Set WhatsApp configuration
 */
export declare function configure(newConfig: Partial<WhatsAppConfig>): void;
/**
 * Handle incoming Twilio webhook
 */
export declare function handleTwilioWebhook(body: {
    From: string;
    To: string;
    Body?: string;
    MediaUrl0?: string;
    NumMedia?: string;
}): Promise<string>;
/**
 * Handle incoming Meta Cloud API webhook
 */
export declare function handleMetaWebhook(body: {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: string;
                metadata: {
                    phone_number_id: string;
                };
                messages?: Array<{
                    from: string;
                    id: string;
                    timestamp: string;
                    type: string;
                    text?: {
                        body: string;
                    };
                    audio?: {
                        id: string;
                    };
                }>;
                statuses?: Array<unknown>;
            };
            field: string;
        }>;
    }>;
}): Promise<{
    success: boolean;
}>;
/**
 * Verify Meta webhook (for initial setup)
 */
export declare function verifyMetaWebhook(query: {
    'hub.mode'?: string;
    'hub.verify_token'?: string;
    'hub.challenge'?: string;
}): string | null;
/**
 * Send proactive message (for notifications)
 */
export declare function sendProactiveMessage(phoneNumber: string, text: string, templateName?: string): Promise<boolean>;
declare const _default: {
    configure: typeof configure;
    handleTwilioWebhook: typeof handleTwilioWebhook;
    handleMetaWebhook: typeof handleMetaWebhook;
    verifyMetaWebhook: typeof verifyMetaWebhook;
    sendProactiveMessage: typeof sendProactiveMessage;
};
export default _default;
//# sourceMappingURL=whatsapp.d.ts.map