/**
 * @ankr/resilience
 *
 * Enterprise-grade resilience patterns for Node.js applications.
 *
 * Features:
 * - Circuit Breaker: Prevent cascading failures
 * - Retry: Exponential backoff with jitter
 * - Graceful Shutdown: Clean application termination
 *
 * @example
 * ```typescript
 * import {
 *   CircuitBreaker,
 *   retry,
 *   GracefulShutdown
 * } from '@ankr/resilience';
 *
 * // Circuit Breaker
 * const breaker = new CircuitBreaker({ name: 'api', failureThreshold: 5 });
 * const result = await breaker.execute(() => fetchData());
 *
 * // Retry
 * const data = await retry(() => api.call(), { maxAttempts: 3 });
 *
 * // Graceful Shutdown
 * const shutdown = new GracefulShutdown();
 * shutdown.register('db', () => db.close());
 * shutdown.listen();
 * ```
 *
 * @packageDocumentation
 */

// Circuit Breaker
export {
  CircuitBreaker,
  CircuitBreakers,
  circuitBreakerRegistry,
  CircuitOpenError,
  type CircuitState,
  type CircuitBreakerConfig,
  type CircuitBreakerStats,
} from './circuit-breaker.js';

// Retry
export {
  retry,
  retryWithResult,
  withRetry,
  retryWithBreaker,
  RetryPresets,
  RetryExhaustedError,
  RetryAbortedError,
  type RetryConfig,
  type RetryResult,
  type BackoffStrategy,
  type JitterStrategy,
} from './retry.js';

// Graceful Shutdown
export {
  GracefulShutdown,
  getGracefulShutdown,
  onShutdown,
  listenForShutdown,
  createShutdownHealthCheck,
  type GracefulShutdownConfig,
  type ShutdownResult,
  type ShutdownState,
  type CleanupHandler,
} from './graceful-shutdown.js';

// ═══════════════════════════════════════════════════════════════════════════════
// COMBINED UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

import { CircuitBreaker, type CircuitBreakerConfig } from './circuit-breaker.js';
import { retry, type RetryConfig } from './retry.js';

/**
 * Execute a function with both circuit breaker and retry protection
 *
 * @example
 * ```typescript
 * const result = await resilientCall(
 *   () => api.fetchData(),
 *   { name: 'api' },
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export async function resilientCall<T>(
  fn: () => Promise<T>,
  breakerConfig: CircuitBreakerConfig,
  retryConfig?: RetryConfig
): Promise<T> {
  const breaker = new CircuitBreaker(breakerConfig);
  return retry(() => breaker.execute(fn), retryConfig);
}

/**
 * Create a resilient wrapper for an async function
 *
 * @example
 * ```typescript
 * const fetchData = createResilientFunction(
 *   api.fetchData.bind(api),
 *   { name: 'api' },
 *   { maxAttempts: 3 }
 * );
 *
 * const result = await fetchData(params);
 * ```
 */
export function createResilientFunction<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  breakerConfig: CircuitBreakerConfig,
  retryConfig?: RetryConfig
): (...args: TArgs) => Promise<TResult> {
  const breaker = new CircuitBreaker(breakerConfig);

  return (...args: TArgs) =>
    retry(() => breaker.execute(() => fn(...args)), retryConfig);
}
