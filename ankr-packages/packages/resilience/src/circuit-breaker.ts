/**
 * @ankr/resilience - Circuit Breaker
 *
 * Prevents cascading failures by failing fast when a service is unhealthy.
 * Implements the Circuit Breaker pattern with three states: CLOSED, OPEN, HALF_OPEN.
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   name: 'payment-api',
 *   failureThreshold: 5,
 *   resetTimeout: 30000
 * });
 *
 * const result = await breaker.execute(() => paymentApi.charge(amount));
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Circuit breaker states
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Unique name for this circuit breaker */
  name: string;
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Number of successes in HALF_OPEN to close circuit (default: 2) */
  successThreshold?: number;
  /** Time in ms before attempting recovery (default: 30000) */
  resetTimeout?: number;
  /** Time window in ms to track failures (default: 60000) */
  failureWindow?: number;
  /** Custom function to determine if error should count as failure */
  isFailure?: (error: Error) => boolean;
  /** Callback when state changes */
  onStateChange?: (from: CircuitState, to: CircuitState, name: string) => void;
  /** Callback when circuit opens */
  onOpen?: (name: string, failures: number) => void;
  /** Callback when circuit closes */
  onClose?: (name: string) => void;
  /** Callback on each failure */
  onFailure?: (name: string, error: Error) => void;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  lastStateChange?: Date;
}

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly resetTime: Date
  ) {
    super(`Circuit breaker '${circuitName}' is OPEN. Retry after ${resetTime.toISOString()}`);
    this.name = 'CircuitOpenError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 30000,
  failureWindow: 60000,
};

/**
 * Circuit Breaker
 *
 * Protects against cascading failures by monitoring call success/failure rates
 * and temporarily blocking calls when failure threshold is exceeded.
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number = 0;
  private successes: number = 0;
  private failureTimestamps: number[] = [];
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private lastStateChange?: Date;
  private nextRetryTime?: Date;
  private totalCalls: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;

  private readonly config: Required<
    Pick<CircuitBreakerConfig, 'name' | 'failureThreshold' | 'successThreshold' | 'resetTimeout' | 'failureWindow'>
  > & CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      name: this.config.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      lastStateChange: this.lastStateChange,
    };
  }

  /**
   * Check if circuit allows calls
   */
  isCallAllowed(): boolean {
    this.cleanupOldFailures();

    switch (this.state) {
      case 'CLOSED':
        return true;
      case 'OPEN':
        if (this.nextRetryTime && Date.now() >= this.nextRetryTime.getTime()) {
          this.transitionTo('HALF_OPEN');
          return true;
        }
        return false;
      case 'HALF_OPEN':
        return true;
    }
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.isCallAllowed()) {
      throw new CircuitOpenError(this.config.name, this.nextRetryTime!);
    }

    this.totalCalls++;

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Check if this error should count as a failure
      const isFailure = this.config.isFailure ? this.config.isFailure(err) : true;

      if (isFailure) {
        this.recordFailure(err);
      }

      throw error;
    }
  }

  /**
   * Manually trip the circuit (force open)
   */
  trip(): void {
    if (this.state !== 'OPEN') {
      this.transitionTo('OPEN');
    }
  }

  /**
   * Manually reset the circuit (force closed)
   */
  reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.failureTimestamps = [];
    this.transitionTo('CLOSED');
  }

  /**
   * Record a successful call
   */
  private recordSuccess(): void {
    this.lastSuccessTime = new Date();
    this.totalSuccesses++;

    switch (this.state) {
      case 'HALF_OPEN':
        this.successes++;
        if (this.successes >= this.config.successThreshold) {
          this.transitionTo('CLOSED');
        }
        break;
      case 'CLOSED':
        // Reset failure count on success in closed state
        this.failures = Math.max(0, this.failures - 1);
        break;
    }
  }

  /**
   * Record a failed call
   */
  private recordFailure(error: Error): void {
    this.lastFailureTime = new Date();
    this.totalFailures++;
    this.failures++;
    this.failureTimestamps.push(Date.now());

    this.config.onFailure?.(this.config.name, error);

    switch (this.state) {
      case 'CLOSED':
        if (this.failures >= this.config.failureThreshold) {
          this.transitionTo('OPEN');
        }
        break;
      case 'HALF_OPEN':
        // Any failure in half-open returns to open
        this.transitionTo('OPEN');
        break;
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    if (oldState === newState) return;

    this.state = newState;
    this.lastStateChange = new Date();

    this.config.onStateChange?.(oldState, newState, this.config.name);

    switch (newState) {
      case 'OPEN':
        this.nextRetryTime = new Date(Date.now() + this.config.resetTimeout);
        this.config.onOpen?.(this.config.name, this.failures);
        break;
      case 'CLOSED':
        this.failures = 0;
        this.successes = 0;
        this.failureTimestamps = [];
        this.nextRetryTime = undefined;
        this.config.onClose?.(this.config.name);
        break;
      case 'HALF_OPEN':
        this.successes = 0;
        break;
    }
  }

  /**
   * Remove failures outside the time window
   */
  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.config.failureWindow;
    const beforeCount = this.failureTimestamps.length;
    this.failureTimestamps = this.failureTimestamps.filter(ts => ts > cutoff);
    this.failures = this.failureTimestamps.length;

    // If failures dropped below threshold, we might need to close
    if (this.state === 'OPEN' && this.failures < this.config.failureThreshold) {
      // Don't auto-close, let the timeout handle it
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY & PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Pre-configured circuit breakers for common use cases
 */
export const CircuitBreakers = {
  /**
   * Circuit breaker for external APIs (lenient)
   */
  forExternalApi(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    return new CircuitBreaker({
      name,
      failureThreshold: 10,
      resetTimeout: 60000,
      failureWindow: 120000,
      ...config,
    });
  },

  /**
   * Circuit breaker for databases (strict)
   */
  forDatabase(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    return new CircuitBreaker({
      name,
      failureThreshold: 3,
      resetTimeout: 10000,
      failureWindow: 30000,
      ...config,
    });
  },

  /**
   * Circuit breaker for payment services (very strict)
   */
  forPayment(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    return new CircuitBreaker({
      name,
      failureThreshold: 2,
      successThreshold: 3,
      resetTimeout: 45000,
      failureWindow: 60000,
      ...config,
    });
  },

  /**
   * Circuit breaker for AI/ML services (lenient with longer timeout)
   */
  forAiService(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    return new CircuitBreaker({
      name,
      failureThreshold: 5,
      resetTimeout: 120000,
      failureWindow: 180000,
      ...config,
    });
  },

  /**
   * Circuit breaker for internal microservices
   */
  forMicroservice(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    return new CircuitBreaker({
      name,
      failureThreshold: 5,
      resetTimeout: 15000,
      failureWindow: 60000,
      ...config,
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Global registry for circuit breakers
 */
class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker
   */
  get(name: string, config?: Partial<Omit<CircuitBreakerConfig, 'name'>>): CircuitBreaker {
    let breaker = this.breakers.get(name);
    if (!breaker) {
      breaker = new CircuitBreaker({ name, ...config });
      this.breakers.set(name, breaker);
    }
    return breaker;
  }

  /**
   * Register a circuit breaker
   */
  register(breaker: CircuitBreaker): void {
    this.breakers.set(breaker.getStats().name, breaker);
  }

  /**
   * Get all circuit breakers
   */
  getAll(): CircuitBreaker[] {
    return Array.from(this.breakers.values());
  }

  /**
   * Get stats for all circuit breakers
   */
  getAllStats(): CircuitBreakerStats[] {
    return this.getAll().map(b => b.getStats());
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(b => b.reset());
  }

  /**
   * Remove a circuit breaker
   */
  remove(name: string): boolean {
    return this.breakers.delete(name);
  }

  /**
   * Clear all circuit breakers
   */
  clear(): void {
    this.breakers.clear();
  }
}

/** Global circuit breaker registry */
export const circuitBreakerRegistry = new CircuitBreakerRegistry();
