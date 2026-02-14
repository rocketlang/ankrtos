/**
 * SWAYAM Multi-Channel Integration
 * Unified exports for all channel integrations
 */

export * from './router';
export { default as router } from './router';

export * from './whatsapp';
export { default as whatsapp } from './whatsapp';

export * from './telegram';
export { default as telegram } from './telegram';

export * from './slack';
export { default as slack } from './slack';

// Re-export types
export type { Channel, IncomingMessage, OutgoingMessage } from './router';
