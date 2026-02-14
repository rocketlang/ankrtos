/**
 * SWAYAM MCP Client
 *
 * Connects SWAYAM to PowerBox MCP for unified AI intelligence
 *
 * @package @swayam/mcp-client
 * @version 2.1.0
 *
 * v2.1.0 Changes (Security Hardening 2026-01-16):
 * - SEC: Credential redaction in logs
 * - SEC: User-safe error messages (no internal details)
 * - SEC: DocumentId validation to prevent injection
 * - SEC: Rate limiting to prevent abuse
 * - SEC: HTTPS enforcement for production
 *
 * v2.0.0 Changes (Based on Expert Review 2026-01-16):
 * - P0: Added proper error handling with sanitized messages
 * - P0: Fixed type safety (removed `any` returns)
 * - P1: Exponential backoff with jitter for retries
 * - P1: Input validation for all parameters
 * - P1: Added disconnect/cleanup method
 * - P2: Added authentication support (API key, Bearer token)
 * - P2: Added circuit breaker pattern
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPClientConfig {
  serverUrl: string;
  transport: 'http' | 'websocket' | 'stdio';
  timeout?: number;
  retries?: number;
  maxRetryDelay?: number;
  // Authentication
  apiKey?: string;
  bearerToken?: string;
  // Circuit breaker
  circuitBreakerThreshold?: number;
  circuitBreakerResetTime?: number;
  // Security options
  enforceHttps?: boolean; // Require HTTPS in production (default: true)
  rateLimitPerMinute?: number; // Max requests per minute (default: 100)
}

// Response types for type safety
interface MCPListToolsResponse {
  tools: MCPTool[];
}

interface MCPCallToolResponse extends MCPToolResult {}

interface MCPErrorResponse {
  error?: string;
  message?: string;
}

// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

// Rate limiter state
interface RateLimiterState {
  requests: number;
  windowStart: number;
}

// ============================================================================
// Security Utilities
// ============================================================================

/**
 * Redact sensitive data from config for safe logging
 */
function redactConfig(config: MCPClientConfig): Record<string, unknown> {
  return {
    serverUrl: config.serverUrl,
    transport: config.transport,
    timeout: config.timeout,
    retries: config.retries,
    apiKey: config.apiKey ? '[REDACTED]' : undefined,
    bearerToken: config.bearerToken ? '[REDACTED]' : undefined,
  };
}

/**
 * Create a user-safe error message (no internal details)
 */
function sanitizeErrorForUser(error: Error): string {
  // Map internal error codes to user-friendly messages
  if (error instanceof MCPValidationError) {
    return error.message; // Validation errors are already user-safe
  }
  if (error instanceof MCPCircuitOpenError) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  if (error instanceof MCPRateLimitError) {
    return 'Too many requests. Please slow down and try again.';
  }
  if (error instanceof MCPConnectionError) {
    return 'Unable to connect to the service. Please check your connection.';
  }
  if (error instanceof MCPError) {
    switch (error.code) {
      case 'TIMEOUT':
        return 'Request timed out. Please try again.';
      case 'PARSE_ERROR':
        return 'Received invalid response from server.';
      case 'SERVER_ERROR':
        return 'Server encountered an error. Please try again later.';
      case 'RATE_LIMIT':
        return 'Too many requests. Please slow down and try again.';
      default:
        return 'An unexpected error occurred.';
    }
  }
  // Generic fallback - never expose raw error messages
  return 'An unexpected error occurred.';
}

/**
 * Validate and sanitize document ID to prevent injection
 */
function validateDocumentId(documentId: string): void {
  if (typeof documentId !== 'string') {
    throw new MCPValidationError('Document ID must be a string');
  }
  if (documentId.length === 0) {
    throw new MCPValidationError('Document ID cannot be empty');
  }
  if (documentId.length > 512) {
    throw new MCPValidationError('Document ID too long (max 512 chars)');
  }
  // Only allow safe characters - alphanumeric, dash, underscore, dot
  if (!/^[a-zA-Z0-9_.-]+$/.test(documentId)) {
    throw new MCPValidationError('Document ID contains invalid characters');
  }
}

/**
 * Check if URL uses HTTPS (for production security)
 */
function validateSecureTransport(url: string, enforceHttps: boolean): void {
  if (enforceHttps) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      throw new MCPValidationError('HTTPS is required for production. Use localhost for development.');
    }
  }
}

// ============================================================================
// Custom Errors
// ============================================================================

export class MCPError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class MCPValidationError extends MCPError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'MCPValidationError';
  }
}

export class MCPConnectionError extends MCPError {
  constructor(message: string, statusCode?: number) {
    super(message, 'CONNECTION_ERROR', statusCode);
    this.name = 'MCPConnectionError';
  }
}

export class MCPCircuitOpenError extends MCPError {
  constructor() {
    super('Circuit breaker is open - too many recent failures', 'CIRCUIT_OPEN');
    this.name = 'MCPCircuitOpenError';
  }
}

export class MCPRateLimitError extends MCPError {
  constructor() {
    super('Rate limit exceeded. Please slow down.', 'RATE_LIMIT');
    this.name = 'MCPRateLimitError';
  }
}

// ============================================================================
// Intent to Tool Mapping
// ============================================================================

export const INTENT_TOOL_MAP: Record<string, string[]> = {
  // Logistics queries
  logistics_query: ['logistics_search', 'logistics_retrieve'],
  logistics_route: ['logistics_route', 'logistics_search'],
  logistics_compliance: ['logistics_compliance', 'logistics_search'],

  // Document operations
  document_lookup: ['logistics_retrieve', 'logistics_search'],
  document_ingest: ['logistics_ingest'],

  // Memory operations
  memory_recall: ['eon_search', 'eon_recall'],
  memory_store: ['eon_store'],

  // Code execution
  code_execute: ['sandbox_python', 'sandbox_javascript'],

  // Expert delegation (via claude-delegator / Codex MCP)
  architecture_review: ['delegator.architect'],
  plan_review: ['delegator.plan_reviewer'],
  scope_analysis: ['delegator.scope_analyst'],
  code_review: ['delegator.code_reviewer'],
  security_review: ['delegator.security_analyst'],

  // Default - search everything
  general_query: ['logistics_search'],
};

// ============================================================================
// MCP Client
// ============================================================================

export class MCPClient extends EventEmitter {
  private config: Required<
    Pick<MCPClientConfig, 'serverUrl' | 'transport' | 'timeout' | 'retries' | 'maxRetryDelay' | 'enforceHttps' | 'rateLimitPerMinute'>
  > &
    MCPClientConfig;
  private tools: Map<string, MCPTool> = new Map();
  private connected: boolean = false;
  private circuitBreaker: CircuitBreakerState;
  private rateLimiter: RateLimiterState;

  constructor(config: MCPClientConfig) {
    super();

    // Validate config
    this.validateConfig(config);

    this.config = {
      timeout: 30000,
      retries: 3,
      maxRetryDelay: 30000,
      circuitBreakerThreshold: 5,
      circuitBreakerResetTime: 60000,
      enforceHttps: true,
      rateLimitPerMinute: 100,
      ...config,
    };

    // Validate HTTPS if enforced
    validateSecureTransport(this.config.serverUrl, this.config.enforceHttps);

    this.circuitBreaker = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };

    this.rateLimiter = {
      requests: 0,
      windowStart: Date.now(),
    };

    // Set max listeners to prevent memory leak warnings
    this.setMaxListeners(20);

    // Log config with redacted credentials
    console.log('[MCPClient] Initialized with config:', redactConfig(this.config));
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: MCPClientConfig): void {
    if (!config.serverUrl) {
      throw new MCPValidationError('serverUrl is required');
    }

    // Validate URL format (basic check)
    try {
      new URL(config.serverUrl);
    } catch {
      throw new MCPValidationError('serverUrl must be a valid URL');
    }

    if (!config.transport) {
      throw new MCPValidationError('transport is required');
    }

    if (!['http', 'websocket', 'stdio'].includes(config.transport)) {
      throw new MCPValidationError('transport must be http, websocket, or stdio');
    }

    if (config.timeout !== undefined && (config.timeout < 0 || config.timeout > 300000)) {
      throw new MCPValidationError('timeout must be between 0 and 300000ms');
    }

    if (config.retries !== undefined && (config.retries < 0 || config.retries > 10)) {
      throw new MCPValidationError('retries must be between 0 and 10');
    }
  }

  /**
   * Connect to MCP server and fetch available tools
   */
  async connect(): Promise<void> {
    try {
      const tools = await this.listTools();
      for (const tool of tools) {
        this.tools.set(tool.name, tool);
      }
      this.connected = true;
      this.emit('connected', { toolCount: tools.length });
      console.log(`[MCPClient] Connected with ${tools.length} tools`);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect and cleanup resources
   */
  disconnect(): void {
    this.connected = false;
    this.tools.clear();
    this.removeAllListeners();
    this.circuitBreaker = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };
    this.rateLimiter = {
      requests: 0,
      windowStart: Date.now(),
    };
    console.log('[MCPClient] Disconnected and cleaned up');
  }

  /**
   * Refresh tools without full reconnect
   */
  async refreshTools(): Promise<void> {
    const tools = await this.listTools();
    this.tools.clear();
    for (const tool of tools) {
      this.tools.set(tool.name, tool);
    }
    this.emit('toolsRefreshed', { toolCount: tools.length });
  }

  /**
   * List available tools from MCP server
   */
  async listTools(): Promise<MCPTool[]> {
    const response = await this.request<MCPListToolsResponse>('tools/list', {});
    return response.tools || [];
  }

  /**
   * Call a specific tool
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    // Validate inputs
    this.validateToolName(name);
    this.validateToolArgs(args);

    if (!this.tools.has(name)) {
      throw new MCPValidationError(`Unknown tool: ${name}`);
    }

    const startTime = Date.now();

    try {
      const result = await this.request<MCPCallToolResponse>('tools/call', {
        name,
        arguments: args,
      });
      const latencyMs = Date.now() - startTime;

      this.emit('toolCall', { name, args, latencyMs, success: true });
      console.log(`[MCPClient] ${name} completed in ${latencyMs}ms`);

      return result;
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('toolCall', { name, args, latencyMs, success: false, error: errorMessage });
      throw error;
    }
  }

  /**
   * Validate tool name
   */
  private validateToolName(name: string): void {
    if (typeof name !== 'string') {
      throw new MCPValidationError('Tool name must be a string');
    }
    if (name.length === 0) {
      throw new MCPValidationError('Tool name cannot be empty');
    }
    if (name.length > 256) {
      throw new MCPValidationError('Tool name too long (max 256 chars)');
    }
    // Prevent injection attacks - only allow safe characters
    if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
      throw new MCPValidationError('Tool name contains invalid characters');
    }
  }

  /**
   * Validate tool arguments
   */
  private validateToolArgs(args: unknown): asserts args is Record<string, unknown> {
    if (args === null || args === undefined) {
      throw new MCPValidationError('Tool arguments cannot be null or undefined');
    }
    if (typeof args !== 'object') {
      throw new MCPValidationError('Tool arguments must be an object');
    }
    if (Array.isArray(args)) {
      throw new MCPValidationError('Tool arguments must be an object, not an array');
    }
    // Check for reasonable size to prevent DoS
    const argsString = JSON.stringify(args);
    if (argsString.length > 1000000) {
      throw new MCPValidationError('Tool arguments too large (max 1MB)');
    }
  }

  /**
   * Select tools based on intent and query
   */
  selectToolsForIntent(intent: string, _query: string): string[] {
    const mappedTools = INTENT_TOOL_MAP[intent] || INTENT_TOOL_MAP['general_query'];

    // Filter to only available tools
    return mappedTools.filter((name) => this.tools.has(name));
  }

  /**
   * Execute multiple tools in parallel
   */
  async executeTools(
    toolCalls: MCPToolCall[]
  ): Promise<Array<{ tool: string; result: MCPToolResult; error?: string }>> {
    // Validate all tool calls first
    for (const call of toolCalls) {
      this.validateToolName(call.name);
      this.validateToolArgs(call.arguments);
    }

    const results = await Promise.allSettled(
      toolCalls.map((call) => this.callTool(call.name, call.arguments))
    );

    return results.map((result, i) => {
      if (result.status === 'fulfilled') {
        return { tool: toolCalls[i].name, result: result.value };
      } else {
        return {
          tool: toolCalls[i].name,
          result: { content: [], isError: true },
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * Get tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all available tools
   */
  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Check circuit breaker state
   */
  private checkCircuitBreaker(): void {
    if (!this.circuitBreaker.isOpen) return;

    const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailure;
    if (timeSinceLastFailure > (this.config.circuitBreakerResetTime || 60000)) {
      // Reset circuit breaker (half-open state)
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failures = 0;
      console.log('[MCPClient] Circuit breaker reset');
    } else {
      throw new MCPCircuitOpenError();
    }
  }

  /**
   * Record circuit breaker failure
   */
  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();

    if (this.circuitBreaker.failures >= (this.config.circuitBreakerThreshold || 5)) {
      this.circuitBreaker.isOpen = true;
      console.log('[MCPClient] Circuit breaker opened after too many failures');
      this.emit('circuitBreakerOpen', { failures: this.circuitBreaker.failures });
    }
  }

  /**
   * Record circuit breaker success
   */
  private recordSuccess(): void {
    if (this.circuitBreaker.failures > 0) {
      this.circuitBreaker.failures = 0;
      console.log('[MCPClient] Circuit breaker reset on success');
    }
  }

  /**
   * Check rate limiter
   */
  private checkRateLimit(): void {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window

    // Reset window if expired
    if (now - this.rateLimiter.windowStart > windowMs) {
      this.rateLimiter.requests = 0;
      this.rateLimiter.windowStart = now;
    }

    // Check limit
    if (this.rateLimiter.requests >= this.config.rateLimitPerMinute) {
      this.emit('rateLimitExceeded', { requests: this.rateLimiter.requests });
      throw new MCPRateLimitError();
    }

    // Increment counter
    this.rateLimiter.requests++;
  }

  /**
   * Get a user-safe error message from an error
   */
  getUserSafeError(error: Error): string {
    return sanitizeErrorForUser(error);
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, ...
    const baseDelay = 1000 * Math.pow(2, attempt);
    // Add jitter (0-1000ms) to prevent thundering herd
    const jitter = Math.random() * 1000;
    // Cap at max delay
    return Math.min(baseDelay + jitter, this.config.maxRetryDelay);
  }

  /**
   * Build request headers with authentication
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    if (this.config.bearerToken) {
      headers['Authorization'] = `Bearer ${this.config.bearerToken}`;
    }

    return headers;
  }

  /**
   * Make HTTP request to MCP server with type safety
   */
  private async request<T>(method: string, params: unknown): Promise<T> {
    // Check rate limiter first
    this.checkRateLimit();

    // Check circuit breaker
    this.checkCircuitBreaker();

    // Validate method name
    if (typeof method !== 'string' || !/^[a-zA-Z0-9_/.-]+$/.test(method)) {
      throw new MCPValidationError('Invalid method name');
    }

    const url = `${this.config.serverUrl}/mcp/${method}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        let response: Response;
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: this.buildHeaders(),
            body: JSON.stringify(params),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          // Don't expose internal URL in error message (security)
          throw new MCPConnectionError(
            `Request failed with status ${response.status}`,
            response.status
          );
        }

        // Parse JSON with error handling
        let data: T;
        try {
          const text = await response.text();
          data = JSON.parse(text) as T;
        } catch (parseError) {
          throw new MCPError('Invalid JSON response from server', 'PARSE_ERROR');
        }

        // Check for error in response body
        const errorResponse = data as unknown as MCPErrorResponse;
        if (errorResponse.error || errorResponse.message) {
          throw new MCPError(
            errorResponse.error || errorResponse.message || 'Unknown error',
            'SERVER_ERROR'
          );
        }

        // Success - record and return
        this.recordSuccess();
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Handle abort specifically
        if (lastError.name === 'AbortError') {
          lastError = new MCPError('Request timed out', 'TIMEOUT');
        }

        // Record failure for circuit breaker
        this.recordFailure();

        // Don't retry on validation errors
        if (error instanceof MCPValidationError) {
          throw error;
        }

        // Calculate delay and wait before retry
        if (attempt < this.config.retries - 1) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(`[MCPClient] Retry ${attempt + 1}/${this.config.retries} after ${delay}ms`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError || new MCPError('Request failed after all retries', 'MAX_RETRIES');
  }
}

// ============================================================================
// Logistics RAG Tools (Direct HTTP fallback)
// ============================================================================

export class LogisticsRAGClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:4444', timeout: number = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Make request with timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Search logistics documents
   */
  async search(
    query: string,
    options?: {
      docTypes?: string[];
      regions?: string[];
      carrierId?: string;
      limit?: number;
    }
  ): Promise<LogisticsSearchResult[]> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/logistics/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...options }),
    });

    if (!response.ok) {
      throw new Error(`Search failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  }

  /**
   * Get document by ID
   */
  async retrieve(documentId: string): Promise<LogisticsDocument | null> {
    // Validate documentId to prevent injection attacks
    validateDocumentId(documentId);

    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/api/logistics/document/${encodeURIComponent(documentId)}`
    );

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Retrieve failed with status ${response.status}`);

    return response.json();
  }

  /**
   * Check compliance
   */
  async checkCompliance(
    topic: string,
    context?: { carrierId?: string; region?: string }
  ): Promise<ComplianceResult> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/logistics/compliance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, ...context }),
    });

    if (!response.ok) throw new Error(`Compliance check failed with status ${response.status}`);

    return response.json();
  }

  /**
   * Get route information
   */
  async getRoute(
    origin: string,
    destination: string,
    options?: { carrierId?: string }
  ): Promise<RouteInfo> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/logistics/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, ...options }),
    });

    if (!response.ok) throw new Error(`Route query failed with status ${response.status}`);

    return response.json();
  }
}

// ============================================================================
// Types for Logistics RAG
// ============================================================================

export interface LogisticsSearchResult {
  documentId: string;
  title: string;
  content: string;
  docType: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface LogisticsDocument {
  id: string;
  title: string;
  content: string;
  docType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceResult {
  compliant: boolean;
  rules: Array<{
    rule: string;
    status: 'pass' | 'fail' | 'warning';
    details: string;
  }>;
  recommendations: string[];
  sources: string[];
}

export interface RouteInfo {
  origin: string;
  destination: string;
  distance: number;
  estimatedTime: string;
  waypoints: Array<{ name: string; type: string; notes?: string }>;
  compliance: string[];
  warnings: string[];
}

// ============================================================================
// Factory Functions
// ============================================================================

let defaultClient: MCPClient | null = null;

export function getMCPClient(config?: MCPClientConfig): MCPClient {
  if (!defaultClient && config) {
    defaultClient = new MCPClient(config);
  }
  if (!defaultClient) {
    throw new Error('MCP client not initialized');
  }
  return defaultClient;
}

export function createMCPClient(config: MCPClientConfig): MCPClient {
  return new MCPClient(config);
}

export function createLogisticsRAGClient(baseUrl?: string, timeout?: number): LogisticsRAGClient {
  return new LogisticsRAGClient(baseUrl, timeout);
}

/**
 * Reset the default client (useful for testing)
 */
export function resetDefaultClient(): void {
  if (defaultClient) {
    defaultClient.disconnect();
    defaultClient = null;
  }
}

export default MCPClient;
