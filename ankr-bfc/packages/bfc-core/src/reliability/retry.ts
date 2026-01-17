/**
 * BFC Retry Pattern
 *
 * Exponential backoff with jitter for transient failures:
 * - Network timeouts
 * - Rate limiting
 * - Temporary unavailability
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RetryConfig {
  // Maximum number of retry attempts
  maxAttempts: number;

  // Initial delay in ms
  initialDelay: number;

  // Maximum delay in ms
  maxDelay: number;

  // Exponential factor (default 2)
  factor?: number;

  // Add random jitter (default true)
  jitter?: boolean;

  // Errors to retry (default: all)
  retryOn?: (error: Error) => boolean;

  // Callback on each retry
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

// ============================================================================
// RETRY FUNCTION
// ============================================================================

/**
 * Execute a function with retry logic
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  const {
    maxAttempts,
    initialDelay,
    maxDelay,
    factor = 2,
    jitter = true,
    retryOn = () => true,
    onRetry,
  } = config;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (!retryOn(lastError)) {
        throw lastError;
      }

      // Check if we have more attempts
      if (attempt >= maxAttempts) {
        break;
      }

      // Calculate delay with optional jitter
      const actualDelay = jitter
        ? delay * (0.5 + Math.random())
        : delay;

      // Notify callback
      onRetry?.(attempt, lastError, actualDelay);

      // Wait before retry
      await sleep(actualDelay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  throw new RetryExhaustedError(
    `All ${maxAttempts} retry attempts failed`,
    lastError!,
    maxAttempts
  );
}

/**
 * Execute with detailed result (doesn't throw)
 */
export async function retryWithResult<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  let attempts = 0;

  try {
    const result = await retry(
      async () => {
        attempts++;
        return fn();
      },
      config
    );

    return {
      success: true,
      result,
      attempts,
      totalTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      attempts,
      totalTime: Date.now() - startTime,
    };
  }
}

// ============================================================================
// DECORATORS
// ============================================================================

/**
 * Retry decorator for class methods
 */
export function Retryable(config: RetryConfig): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return retry(() => originalMethod.apply(this, args), config);
    };

    return descriptor;
  };
}

// ============================================================================
// PRESETS
// ============================================================================

export const RetryPresets = {
  /**
   * Quick retry for fast operations
   */
  quick(): RetryConfig {
    return {
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 1000,
      factor: 2,
      jitter: true,
    };
  },

  /**
   * Standard retry for network operations
   */
  standard(): RetryConfig {
    return {
      maxAttempts: 5,
      initialDelay: 500,
      maxDelay: 10000,
      factor: 2,
      jitter: true,
    };
  },

  /**
   * Patient retry for external services
   */
  patient(): RetryConfig {
    return {
      maxAttempts: 10,
      initialDelay: 1000,
      maxDelay: 60000,
      factor: 2,
      jitter: true,
    };
  },

  /**
   * Retry for CBS operations
   */
  cbs(): RetryConfig {
    return {
      maxAttempts: 3,
      initialDelay: 500,
      maxDelay: 5000,
      factor: 2,
      jitter: true,
      retryOn: (error) => {
        // Retry on network errors, not on business errors
        return (
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('timeout') ||
          error.message.includes('503')
        );
      },
    };
  },

  /**
   * Retry for AI Proxy calls
   */
  aiProxy(): RetryConfig {
    return {
      maxAttempts: 3,
      initialDelay: 2000,
      maxDelay: 30000,
      factor: 2,
      jitter: true,
      retryOn: (error) => {
        // Retry on rate limits and server errors
        return (
          error.message.includes('429') ||
          error.message.includes('503') ||
          error.message.includes('timeout')
        );
      },
    };
  },

  /**
   * Retry for database operations
   */
  database(): RetryConfig {
    return {
      maxAttempts: 3,
      initialDelay: 200,
      maxDelay: 2000,
      factor: 2,
      jitter: true,
      retryOn: (error) => {
        // Retry on connection issues, not constraint violations
        return (
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('Connection') ||
          error.message.includes('deadlock')
        );
      },
    };
  },
};

// ============================================================================
// ERROR
// ============================================================================

export class RetryExhaustedError extends Error {
  constructor(
    message: string,
    public readonly lastError: Error,
    public readonly attempts: number
  ) {
    super(message);
    this.name = 'RetryExhaustedError';
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// COMBINED RETRY + CIRCUIT BREAKER
// ============================================================================

import { CircuitBreaker } from './circuit-breaker.js';

/**
 * Execute with both retry and circuit breaker protection
 */
export async function resilientCall<T>(
  fn: () => Promise<T>,
  options: {
    circuitBreaker: CircuitBreaker;
    retryConfig: RetryConfig;
  }
): Promise<T> {
  const { circuitBreaker, retryConfig } = options;

  return retry(
    () => circuitBreaker.execute(fn),
    {
      ...retryConfig,
      retryOn: (error) => {
        // Don't retry if circuit is open
        if (error.name === 'CircuitBreakerError') {
          return false;
        }
        return retryConfig.retryOn?.(error) ?? true;
      },
    }
  );
}
