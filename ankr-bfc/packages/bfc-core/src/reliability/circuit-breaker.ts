/**
 * BFC Circuit Breaker Pattern
 *
 * Prevents cascade failures in distributed systems:
 * - CBS integration failures
 * - External API failures
 * - Database connection issues
 */

// ============================================================================
// TYPES
// ============================================================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  // Number of failures before opening
  failureThreshold: number;

  // Time in ms before trying again (half-open)
  resetTimeout: number;

  // Number of successes in half-open to close
  successThreshold: number;

  // Timeout for individual calls
  timeout?: number;

  // Optional name for logging
  name?: string;

  // Callback when state changes
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  totalCalls: number;
  failedCalls: number;
  successfulCalls: number;
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailure?: Date;
  private lastSuccess?: Date;
  private nextAttempt?: Date;
  private totalCalls = 0;
  private failedCalls = 0;
  private successfulCalls = 0;

  private readonly config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      timeout: 30000,
      name: 'default',
      onStateChange: () => {},
      ...config,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;

    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (this.nextAttempt && new Date() >= this.nextAttempt) {
        this.transitionTo('HALF_OPEN');
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker [${this.config.name}] is OPEN`,
          this.state
        );
      }
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current stats
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      totalCalls: this.totalCalls,
      failedCalls: this.failedCalls,
      successfulCalls: this.successfulCalls,
    };
  }

  /**
   * Force reset to closed state
   */
  reset(): void {
    this.transitionTo('CLOSED');
    this.failures = 0;
    this.successes = 0;
  }

  /**
   * Check if circuit allows requests
   */
  isAvailable(): boolean {
    if (this.state === 'CLOSED' || this.state === 'HALF_OPEN') {
      return true;
    }
    return this.nextAttempt ? new Date() >= this.nextAttempt : false;
  }

  // ============================================================================
  // PRIVATE
  // ============================================================================

  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Circuit breaker [${this.config.name}] timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private onSuccess(): void {
    this.lastSuccess = new Date();
    this.successfulCalls++;

    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
        this.failures = 0;
        this.successes = 0;
      }
    } else {
      // Reset failure count on success in closed state
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.lastFailure = new Date();
    this.failedCalls++;
    this.failures++;

    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
      this.scheduleNextAttempt();
    } else if (this.failures >= this.config.failureThreshold) {
      this.transitionTo('OPEN');
      this.scheduleNextAttempt();
    }
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.config.onStateChange(oldState, newState);
      console.log(`[CircuitBreaker:${this.config.name}] ${oldState} → ${newState}`);
    }
  }

  private scheduleNextAttempt(): void {
    this.nextAttempt = new Date(Date.now() + this.config.resetTimeout);
    this.successes = 0;
  }
}

// ============================================================================
// ERROR
// ============================================================================

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly state: CircuitState
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

// ============================================================================
// FACTORY FOR COMMON USE CASES
// ============================================================================

export const CircuitBreakers = {
  /**
   * Circuit breaker for CBS (Core Banking System)
   */
  forCBS(name = 'cbs'): CircuitBreaker {
    return new CircuitBreaker({
      name,
      failureThreshold: 5,
      resetTimeout: 30000,  // 30 seconds
      successThreshold: 2,
      timeout: 15000,       // 15 second timeout for CBS calls
    });
  },

  /**
   * Circuit breaker for AI Proxy
   */
  forAiProxy(name = 'ai-proxy'): CircuitBreaker {
    return new CircuitBreaker({
      name,
      failureThreshold: 3,
      resetTimeout: 60000,  // 1 minute
      successThreshold: 2,
      timeout: 30000,       // 30 second timeout for AI calls
    });
  },

  /**
   * Circuit breaker for EON Memory
   */
  forEon(name = 'eon'): CircuitBreaker {
    return new CircuitBreaker({
      name,
      failureThreshold: 5,
      resetTimeout: 15000,  // 15 seconds
      successThreshold: 3,
      timeout: 10000,       // 10 second timeout
    });
  },

  /**
   * Circuit breaker for external compliance APIs
   */
  forCompliance(name = 'compliance'): CircuitBreaker {
    return new CircuitBreaker({
      name,
      failureThreshold: 3,
      resetTimeout: 45000,  // 45 seconds
      successThreshold: 2,
      timeout: 20000,       // 20 second timeout
    });
  },
};
