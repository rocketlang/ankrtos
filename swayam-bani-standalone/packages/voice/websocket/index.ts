/**
 * SWAYAM WebSocket Handlers
 *
 * Export both standard and MCP-enhanced handlers
 */

export { SwayamWebSocketHandler } from './swayam-handler.js';
export { SwayamWebSocketHandlerMCP } from './swayam-handler-mcp.js';

// Default export is the MCP-enhanced version
export { SwayamWebSocketHandlerMCP as default } from './swayam-handler-mcp.js';
