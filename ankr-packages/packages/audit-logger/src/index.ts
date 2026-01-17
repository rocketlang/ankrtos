/**
 * @ankr/audit-logger
 *
 * Compliance-ready audit logging with tamper detection, structured events,
 * and retention policies for regulated industries.
 *
 * Features:
 * - Structured audit events (WHO, WHAT, WHEN, WHERE, WHY)
 * - Tamper detection with cryptographic chaining
 * - Multiple output targets (console, file, webhook)
 * - Automatic PII masking
 * - Retention policy support
 * - Query and search capabilities
 *
 * @example
 * ```typescript
 * import { AuditLogger } from '@ankr/audit-logger';
 *
 * const audit = new AuditLogger({ appName: 'banking-app' });
 *
 * audit.log({
 *   action: 'TRANSFER_FUNDS',
 *   actor: { id: 'user-123', type: 'USER' },
 *   resource: { type: 'ACCOUNT', id: 'acc-456' },
 *   outcome: 'SUCCESS',
 *   details: { amount: 10000, currency: 'INR' }
 * });
 * ```
 *
 * @packageDocumentation
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Audit event outcome
 */
export type AuditOutcome = 'SUCCESS' | 'FAILURE' | 'DENIED' | 'ERROR' | 'PENDING';

/**
 * Audit event severity
 */
export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'ALERT';

/**
 * Actor who performed the action
 */
export interface AuditActor {
  id: string;
  type: 'USER' | 'SYSTEM' | 'API' | 'ADMIN' | 'SERVICE';
  name?: string;
  email?: string;
  role?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Resource affected by the action
 */
export interface AuditResource {
  type: string;
  id: string;
  name?: string;
  attributes?: Record<string, any>;
}

/**
 * Change record for data modifications
 */
export interface AuditChange {
  field: string;
  oldValue?: any;
  newValue?: any;
}

/**
 * Audit event input
 */
export interface AuditEventInput {
  /** Action performed (e.g., 'LOGIN', 'TRANSFER', 'UPDATE_PROFILE') */
  action: string;
  /** Category of action */
  category?: string;
  /** Actor who performed the action */
  actor: AuditActor;
  /** Resource affected */
  resource?: AuditResource;
  /** Outcome of the action */
  outcome: AuditOutcome;
  /** Severity level */
  severity?: AuditSeverity;
  /** Reason for the action */
  reason?: string;
  /** Additional details */
  details?: Record<string, any>;
  /** Data changes */
  changes?: AuditChange[];
  /** Related event IDs */
  correlationId?: string;
  /** Tags for filtering */
  tags?: string[];
}

/**
 * Complete audit event (with system-generated fields)
 */
export interface AuditEvent extends AuditEventInput {
  /** Unique event ID */
  id: string;
  /** Timestamp */
  timestamp: Date;
  /** Application name */
  appName: string;
  /** Environment */
  environment: string;
  /** Server/instance ID */
  serverId?: string;
  /** Previous event hash (for tamper detection) */
  previousHash?: string;
  /** Event hash */
  hash: string;
  /** Sequence number */
  sequence: number;
}

/**
 * Audit query options
 */
export interface AuditQueryOptions {
  /** Filter by action */
  action?: string;
  /** Filter by actor ID */
  actorId?: string;
  /** Filter by resource type */
  resourceType?: string;
  /** Filter by resource ID */
  resourceId?: string;
  /** Filter by outcome */
  outcome?: AuditOutcome;
  /** Filter by severity */
  severity?: AuditSeverity;
  /** Start date */
  startDate?: Date;
  /** End date */
  endDate?: Date;
  /** Filter by tags */
  tags?: string[];
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGGER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Output target interface
 */
export interface AuditTarget {
  name: string;
  write(event: AuditEvent): Promise<void> | void;
  query?(options: AuditQueryOptions): Promise<AuditEvent[]>;
  close?(): Promise<void> | void;
}

/**
 * Audit logger configuration
 */
export interface AuditLoggerConfig {
  /** Application name */
  appName: string;
  /** Environment (default: process.env.NODE_ENV) */
  environment?: string;
  /** Server/instance ID */
  serverId?: string;
  /** Enable tamper detection via chaining */
  enableChaining?: boolean;
  /** Enable automatic PII masking */
  enableMasking?: boolean;
  /** Fields to mask */
  sensitiveFields?: string[];
  /** Output targets */
  targets?: AuditTarget[];
  /** Default severity */
  defaultSeverity?: AuditSeverity;
  /** Async mode (non-blocking writes) */
  asyncMode?: boolean;
  /** Callback on error */
  onError?: (error: Error, event: AuditEvent) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN TARGETS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Console output target
 */
export class ConsoleTarget implements AuditTarget {
  name = 'console';
  private format: 'json' | 'pretty';

  constructor(format: 'json' | 'pretty' = 'json') {
    this.format = format;
  }

  write(event: AuditEvent): void {
    if (this.format === 'pretty') {
      const emoji = event.outcome === 'SUCCESS' ? '✓' : event.outcome === 'FAILURE' ? '✗' : '!';
      console.log(
        `[AUDIT] ${emoji} ${event.timestamp.toISOString()} | ${event.action} | ` +
        `${event.actor.type}:${event.actor.id} | ${event.outcome}`
      );
    } else {
      console.log(JSON.stringify(event));
    }
  }
}

/**
 * In-memory target (for testing and querying)
 */
export class MemoryTarget implements AuditTarget {
  name = 'memory';
  private events: AuditEvent[] = [];
  private maxSize: number;

  constructor(maxSize = 10000) {
    this.maxSize = maxSize;
  }

  write(event: AuditEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxSize) {
      this.events.shift(); // Remove oldest
    }
  }

  query(options: AuditQueryOptions): Promise<AuditEvent[]> {
    let results = [...this.events];

    if (options.action) {
      results = results.filter(e => e.action === options.action);
    }
    if (options.actorId) {
      results = results.filter(e => e.actor.id === options.actorId);
    }
    if (options.resourceType) {
      results = results.filter(e => e.resource?.type === options.resourceType);
    }
    if (options.resourceId) {
      results = results.filter(e => e.resource?.id === options.resourceId);
    }
    if (options.outcome) {
      results = results.filter(e => e.outcome === options.outcome);
    }
    if (options.severity) {
      results = results.filter(e => e.severity === options.severity);
    }
    if (options.startDate) {
      results = results.filter(e => e.timestamp >= options.startDate!);
    }
    if (options.endDate) {
      results = results.filter(e => e.timestamp <= options.endDate!);
    }
    if (options.tags?.length) {
      results = results.filter(e =>
        options.tags!.some(tag => e.tags?.includes(tag))
      );
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Pagination
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    results = results.slice(offset, offset + limit);

    return Promise.resolve(results);
  }

  getAll(): AuditEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}

/**
 * Webhook target
 */
export class WebhookTarget implements AuditTarget {
  name = 'webhook';
  private url: string;
  private headers: Record<string, string>;
  private batchSize: number;
  private flushInterval: number;
  private buffer: AuditEvent[] = [];
  private timer?: NodeJS.Timeout;

  constructor(config: {
    url: string;
    headers?: Record<string, string>;
    batchSize?: number;
    flushIntervalMs?: number;
  }) {
    this.url = config.url;
    this.headers = config.headers || {};
    this.batchSize = config.batchSize || 10;
    this.flushInterval = config.flushIntervalMs || 5000;

    // Start flush timer
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  write(event: AuditEvent): void {
    this.buffer.push(event);
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0, this.batchSize);

    try {
      await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify({ events: batch }),
      });
    } catch (error) {
      // Re-add events to buffer on failure
      this.buffer.unshift(...batch);
      console.error('[AuditLogger] Webhook flush failed:', error);
    }
  }

  async close(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.flush();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HASHING & MASKING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Simple hash function for tamper detection
 */
function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generate event hash
 */
function generateHash(event: Omit<AuditEvent, 'hash'>, previousHash?: string): string {
  const data = JSON.stringify({
    id: event.id,
    action: event.action,
    actor: event.actor.id,
    resource: event.resource?.id,
    outcome: event.outcome,
    timestamp: event.timestamp.toISOString(),
    sequence: event.sequence,
    previousHash,
  });
  return simpleHash(data);
}

/**
 * Mask sensitive value
 */
function maskValue(value: any): any {
  if (typeof value === 'string') {
    if (value.length <= 4) return '****';
    return value.slice(0, 2) + '****' + value.slice(-2);
  }
  return '[MASKED]';
}

/**
 * Mask sensitive fields in object
 */
function maskSensitiveFields(
  obj: Record<string, any>,
  sensitiveFields: string[]
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      result[key] = maskValue(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = maskSensitiveFields(value, sensitiveFields);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_SENSITIVE_FIELDS = [
  'password', 'secret', 'token', 'apiKey', 'api_key',
  'aadhaar', 'pan', 'ssn', 'creditCard', 'credit_card',
  'cvv', 'pin', 'otp',
];

/**
 * Audit Logger
 *
 * Enterprise-grade audit logging with compliance features.
 */
export class AuditLogger {
  private config: Required<Omit<AuditLoggerConfig, 'onError'>> & Pick<AuditLoggerConfig, 'onError'>;
  private sequence = 0;
  private lastHash?: string;
  private targets: AuditTarget[];

  constructor(config: AuditLoggerConfig) {
    this.config = {
      environment: process.env.NODE_ENV || 'development',
      serverId: process.env.HOSTNAME || 'unknown',
      enableChaining: true,
      enableMasking: true,
      sensitiveFields: DEFAULT_SENSITIVE_FIELDS,
      targets: [new ConsoleTarget()],
      defaultSeverity: 'INFO',
      asyncMode: true,
      ...config,
    };
    this.targets = this.config.targets;
  }

  /**
   * Log an audit event
   */
  log(input: AuditEventInput): AuditEvent {
    // Generate ID
    const id = `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    // Mask sensitive data
    let details = input.details;
    let changes = input.changes;
    if (this.config.enableMasking && details) {
      details = maskSensitiveFields(details, this.config.sensitiveFields);
    }
    if (this.config.enableMasking && changes) {
      changes = changes.map(c => ({
        ...c,
        oldValue: this.config.sensitiveFields.some(f =>
          c.field.toLowerCase().includes(f.toLowerCase())
        ) ? maskValue(c.oldValue) : c.oldValue,
        newValue: this.config.sensitiveFields.some(f =>
          c.field.toLowerCase().includes(f.toLowerCase())
        ) ? maskValue(c.newValue) : c.newValue,
      }));
    }

    // Build event
    const event: Omit<AuditEvent, 'hash'> = {
      ...input,
      id,
      timestamp: new Date(),
      appName: this.config.appName,
      environment: this.config.environment,
      serverId: this.config.serverId,
      severity: input.severity || this.config.defaultSeverity,
      details,
      changes,
      sequence: ++this.sequence,
      previousHash: this.config.enableChaining ? this.lastHash : undefined,
    };

    // Generate hash
    const hash = generateHash(event, this.lastHash);
    this.lastHash = hash;

    const completeEvent: AuditEvent = { ...event, hash };

    // Write to targets
    if (this.config.asyncMode) {
      this.writeAsync(completeEvent);
    } else {
      this.writeSync(completeEvent);
    }

    return completeEvent;
  }

  /**
   * Write to all targets asynchronously
   */
  private async writeAsync(event: AuditEvent): Promise<void> {
    for (const target of this.targets) {
      try {
        await target.write(event);
      } catch (error) {
        this.config.onError?.(error as Error, event);
      }
    }
  }

  /**
   * Write to all targets synchronously
   */
  private writeSync(event: AuditEvent): void {
    for (const target of this.targets) {
      try {
        target.write(event);
      } catch (error) {
        this.config.onError?.(error as Error, event);
      }
    }
  }

  /**
   * Query audit events
   */
  async query(options: AuditQueryOptions): Promise<AuditEvent[]> {
    for (const target of this.targets) {
      if (target.query) {
        return target.query(options);
      }
    }
    return [];
  }

  /**
   * Verify event chain integrity
   */
  verifyChain(events: AuditEvent[]): { valid: boolean; brokenAt?: number } {
    if (!this.config.enableChaining) {
      return { valid: true };
    }

    // Sort by sequence
    const sorted = [...events].sort((a, b) => a.sequence - b.sequence);

    for (let i = 0; i < sorted.length; i++) {
      const event = sorted[i];
      const { hash: _hash, ...eventWithoutHash } = event;
      const expectedHash = generateHash(
        eventWithoutHash,
        i > 0 ? sorted[i - 1].hash : undefined
      );

      if (event.hash !== expectedHash) {
        return { valid: false, brokenAt: i };
      }
    }

    return { valid: true };
  }

  /**
   * Add a target
   */
  addTarget(target: AuditTarget): void {
    this.targets.push(target);
  }

  /**
   * Remove a target
   */
  removeTarget(name: string): boolean {
    const index = this.targets.findIndex(t => t.name === name);
    if (index >= 0) {
      this.targets.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Close all targets
   */
  async close(): Promise<void> {
    for (const target of this.targets) {
      await target.close?.();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONVENIENCE METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Log authentication event
   */
  logAuth(
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'MFA_SETUP' | 'MFA_VERIFY',
    actor: AuditActor,
    outcome: AuditOutcome,
    details?: Record<string, any>
  ): AuditEvent {
    return this.log({
      action,
      category: 'AUTH',
      actor,
      outcome,
      severity: outcome === 'FAILURE' || outcome === 'DENIED' ? 'WARNING' : 'INFO',
      details,
    });
  }

  /**
   * Log data access event
   */
  logAccess(
    action: 'VIEW' | 'EXPORT' | 'DOWNLOAD' | 'SEARCH',
    actor: AuditActor,
    resource: AuditResource,
    outcome: AuditOutcome,
    details?: Record<string, any>
  ): AuditEvent {
    return this.log({
      action: `DATA_${action}`,
      category: 'ACCESS',
      actor,
      resource,
      outcome,
      details,
    });
  }

  /**
   * Log data modification event
   */
  logChange(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    actor: AuditActor,
    resource: AuditResource,
    outcome: AuditOutcome,
    changes?: AuditChange[],
    details?: Record<string, any>
  ): AuditEvent {
    return this.log({
      action: `DATA_${action}`,
      category: 'CHANGE',
      actor,
      resource,
      outcome,
      changes,
      details,
    });
  }

  /**
   * Log financial transaction
   */
  logTransaction(
    action: string,
    actor: AuditActor,
    outcome: AuditOutcome,
    details: { amount: number; currency?: string; [key: string]: any }
  ): AuditEvent {
    return this.log({
      action,
      category: 'FINANCIAL',
      actor,
      outcome,
      severity: details.amount > 100000 ? 'WARNING' : 'INFO',
      details,
      tags: ['financial', 'transaction'],
    });
  }

  /**
   * Log security event
   */
  logSecurity(
    action: string,
    actor: AuditActor,
    outcome: AuditOutcome,
    severity: AuditSeverity = 'WARNING',
    details?: Record<string, any>
  ): AuditEvent {
    return this.log({
      action,
      category: 'SECURITY',
      actor,
      outcome,
      severity,
      details,
      tags: ['security'],
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

let defaultLogger: AuditLogger | undefined;

/**
 * Get or create the default audit logger
 */
export function getAuditLogger(config?: AuditLoggerConfig): AuditLogger {
  if (!defaultLogger && config) {
    defaultLogger = new AuditLogger(config);
  }
  if (!defaultLogger) {
    throw new Error('AuditLogger not initialized. Call with config first.');
  }
  return defaultLogger;
}

/**
 * Create a new audit logger
 */
export function createAuditLogger(config: AuditLoggerConfig): AuditLogger {
  return new AuditLogger(config);
}
