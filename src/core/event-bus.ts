// ankrICD Event Bus - Central Event System
// Following ankrWMS patterns for event-driven architecture

import { v4 as uuidv4 } from 'uuid';
import type { ICDEventType, EventSeverity } from './event-types';
import { getEventSeverity, matchesEventPattern } from './event-types';

// ============================================================================
// EVENT INTERFACES
// ============================================================================

export interface ICDEvent<T = unknown> {
  id: string;
  type: ICDEventType;
  timestamp: Date;
  source: string;
  severity: EventSeverity;

  // Tenant context
  tenantId?: string;
  facilityId?: string;

  // User context
  userId?: string;
  deviceId?: string;

  // Tracing
  correlationId?: string;
  causationId?: string;

  // Payload
  payload: T;

  // Metadata
  metadata?: Record<string, unknown>;
}

export type EventHandler<T = unknown> = (event: ICDEvent<T>) => void | Promise<void>;

export interface EventSubscription {
  id: string;
  pattern: string;
  handler: EventHandler;
  async: boolean;
  priority: number;
}

export interface EventBusConfig {
  // History
  historyEnabled: boolean;
  historyRetentionMs: number;
  maxHistorySize: number;

  // Error handling
  errorHandler?: (error: Error, event: ICDEvent) => void;
  retryOnError: boolean;
  maxRetries: number;

  // Performance
  asyncByDefault: boolean;
  batchSize: number;
  debounceMs: number;
}

// ============================================================================
// ICD EVENT BUS
// ============================================================================

export class ICDEventBus {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHistory: ICDEvent[] = [];
  private config: EventBusConfig;
  private isDisposed = false;

  constructor(config: Partial<EventBusConfig> = {}) {
    this.config = {
      historyEnabled: true,
      historyRetentionMs: 24 * 60 * 60 * 1000, // 24 hours
      maxHistorySize: 10000,
      retryOnError: false,
      maxRetries: 3,
      asyncByDefault: true,
      batchSize: 100,
      debounceMs: 0,
      ...config,
    };

    // Start history cleanup interval
    if (this.config.historyEnabled) {
      this.startHistoryCleanup();
    }
  }

  // ===========================================================================
  // PUBLISHING
  // ===========================================================================

  /**
   * Emit an event to all matching subscribers
   */
  emit<T>(
    type: ICDEventType,
    payload: T,
    options: Partial<Omit<ICDEvent<T>, 'id' | 'timestamp' | 'type' | 'payload' | 'severity'>> = {}
  ): ICDEvent<T> {
    if (this.isDisposed) {
      throw new Error('EventBus has been disposed');
    }

    const event: ICDEvent<T> = {
      id: uuidv4(),
      type,
      timestamp: new Date(),
      severity: getEventSeverity(type),
      source: options.source ?? 'unknown',
      payload,
      ...options,
    };

    // Add to history
    if (this.config.historyEnabled) {
      this.addToHistory(event as ICDEvent);
    }

    // Notify subscribers
    this.notifySubscribers(event as ICDEvent);

    return event;
  }

  /**
   * Emit multiple events at once
   */
  emitBatch<T>(
    events: Array<{
      type: ICDEventType;
      payload: T;
      options?: Partial<Omit<ICDEvent<T>, 'id' | 'timestamp' | 'type' | 'payload' | 'severity'>>;
    }>
  ): ICDEvent<T>[] {
    return events.map(({ type, payload, options }) => this.emit(type, payload, options));
  }

  // ===========================================================================
  // SUBSCRIBING
  // ===========================================================================

  /**
   * Subscribe to events matching a pattern
   * Pattern can be exact event type or wildcard (e.g., 'container.*')
   */
  subscribe<T = unknown>(
    pattern: string,
    handler: EventHandler<T>,
    options: { async?: boolean; priority?: number } = {}
  ): () => void {
    const subscription: EventSubscription = {
      id: uuidv4(),
      pattern,
      handler: handler as EventHandler,
      async: options.async ?? this.config.asyncByDefault,
      priority: options.priority ?? 0,
    };

    this.subscriptions.set(subscription.id, subscription);

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(subscription.id);
    };
  }

  /**
   * Subscribe to a single event occurrence
   */
  once<T = unknown>(
    pattern: string,
    handler: EventHandler<T>,
    options: { async?: boolean; timeout?: number } = {}
  ): Promise<ICDEvent<T>> {
    return new Promise((resolve, reject) => {
      let unsubscribe: (() => void) | null = null;
      let timeoutId: NodeJS.Timeout | null = null;

      const wrappedHandler: EventHandler<T> = (event) => {
        if (unsubscribe) unsubscribe();
        if (timeoutId) clearTimeout(timeoutId);
        handler(event);
        resolve(event);
      };

      unsubscribe = this.subscribe(pattern, wrappedHandler, options);

      if (options.timeout) {
        timeoutId = setTimeout(() => {
          if (unsubscribe) unsubscribe();
          reject(new Error(`Timeout waiting for event: ${pattern}`));
        }, options.timeout);
      }
    });
  }

  /**
   * Subscribe to multiple patterns at once
   */
  subscribeMultiple<T = unknown>(
    patterns: string[],
    handler: EventHandler<T>,
    options: { async?: boolean; priority?: number } = {}
  ): () => void {
    const unsubscribes = patterns.map((pattern) => this.subscribe(pattern, handler, options));

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }

  // ===========================================================================
  // QUERYING
  // ===========================================================================

  /**
   * Get event history
   */
  getHistory(options: {
    type?: ICDEventType | string;
    facilityId?: string;
    correlationId?: string;
    since?: Date;
    until?: Date;
    limit?: number;
  } = {}): ICDEvent[] {
    let results = [...this.eventHistory];

    if (options.type) {
      results = results.filter((e) => matchesEventPattern(e.type, options.type!));
    }

    if (options.facilityId) {
      results = results.filter((e) => e.facilityId === options.facilityId);
    }

    if (options.correlationId) {
      results = results.filter((e) => e.correlationId === options.correlationId);
    }

    if (options.since) {
      results = results.filter((e) => e.timestamp >= options.since!);
    }

    if (options.until) {
      results = results.filter((e) => e.timestamp <= options.until!);
    }

    // Sort by timestamp descending (most recent first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get last event of a specific type
   */
  getLastEvent(type: ICDEventType | string): ICDEvent | undefined {
    const events = this.getHistory({ type, limit: 1 });
    return events[0];
  }

  /**
   * Check if an event occurred recently
   */
  hasRecentEvent(type: ICDEventType | string, withinMs: number): boolean {
    const since = new Date(Date.now() - withinMs);
    const events = this.getHistory({ type, since, limit: 1 });
    return events.length > 0;
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Get count of active subscriptions
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get all subscription patterns
   */
  getSubscriptionPatterns(): string[] {
    return Array.from(this.subscriptions.values()).map((s) => s.pattern);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Dispose of the event bus
   */
  dispose(): void {
    this.isDisposed = true;
    this.subscriptions.clear();
    this.eventHistory = [];
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private notifySubscribers(event: ICDEvent): void {
    // Get matching subscriptions sorted by priority (higher first)
    const matchingSubscriptions = Array.from(this.subscriptions.values())
      .filter((sub) => matchesEventPattern(event.type, sub.pattern))
      .sort((a, b) => b.priority - a.priority);

    for (const subscription of matchingSubscriptions) {
      try {
        if (subscription.async) {
          // Async execution (fire and forget)
          Promise.resolve(subscription.handler(event)).catch((error) => {
            this.handleError(error as Error, event);
          });
        } else {
          // Sync execution
          const result = subscription.handler(event);
          if (result instanceof Promise) {
            result.catch((error) => {
              this.handleError(error as Error, event);
            });
          }
        }
      } catch (error) {
        this.handleError(error as Error, event);
      }
    }
  }

  private handleError(error: Error, event: ICDEvent): void {
    console.error(`[ICDEventBus] Error handling event ${event.type}:`, error);

    if (this.config.errorHandler) {
      try {
        this.config.errorHandler(error, event);
      } catch (handlerError) {
        console.error('[ICDEventBus] Error in error handler:', handlerError);
      }
    }
  }

  private addToHistory(event: ICDEvent): void {
    this.eventHistory.push(event);

    // Trim history if over max size
    if (this.eventHistory.length > this.config.maxHistorySize) {
      const excess = this.eventHistory.length - this.config.maxHistorySize;
      this.eventHistory.splice(0, excess);
    }
  }

  private startHistoryCleanup(): void {
    // Cleanup old events every hour
    setInterval(() => {
      const cutoff = new Date(Date.now() - this.config.historyRetentionMs);
      this.eventHistory = this.eventHistory.filter((e) => e.timestamp > cutoff);
    }, 60 * 60 * 1000);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let defaultEventBus: ICDEventBus | null = null;

export function getEventBus(): ICDEventBus {
  if (!defaultEventBus) {
    defaultEventBus = new ICDEventBus();
  }
  return defaultEventBus;
}

export function setEventBus(eventBus: ICDEventBus): void {
  defaultEventBus = eventBus;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export function emit<T>(
  type: ICDEventType,
  payload: T,
  options: Partial<Omit<ICDEvent<T>, 'id' | 'timestamp' | 'type' | 'payload' | 'severity'>> = {}
): ICDEvent<T> {
  return getEventBus().emit(type, payload, options);
}

export function subscribe<T = unknown>(
  pattern: string,
  handler: EventHandler<T>,
  options: { async?: boolean; priority?: number } = {}
): () => void {
  return getEventBus().subscribe(pattern, handler, options);
}

export function once<T = unknown>(
  pattern: string,
  options: { async?: boolean; timeout?: number } = {}
): Promise<ICDEvent<T>> {
  return getEventBus().once(pattern, () => {}, options);
}

// ============================================================================
// EVENT HELPERS
// ============================================================================

/**
 * Create a correlation ID for tracking related events
 */
export function createCorrelationId(): string {
  return uuidv4();
}

/**
 * Create event context with tenant and facility info
 */
export function createEventContext(
  tenantId: string,
  facilityId: string,
  userId?: string
): Pick<ICDEvent, 'tenantId' | 'facilityId' | 'userId' | 'correlationId'> {
  return {
    tenantId,
    facilityId,
    userId,
    correlationId: createCorrelationId(),
  };
}
