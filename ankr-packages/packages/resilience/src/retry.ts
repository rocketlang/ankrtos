/**
 * @ankr/resilience - Retry with Exponential Backoff
 *
 * Automatically retry failed operations with configurable backoff strategies.
 * Supports exponential backoff, jitter, and custom retry conditions.
 *
 * @example
 * ```typescript
 * const result = await retry(
 *   () => fetchData(),
 *   { maxAttempts: 3, baseDelay: 1000 }
 * );
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Backoff strategy
 */
export type BackoffStrategy = 'exponential' | 'linear' | 'constant' | 'fibonacci';

/**
 * Jitter strategy for randomizing delays
 */
export type JitterStrategy = 'none' | 'full' | 'equal' | 'decorrelated';

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number;
  /** Backoff strategy (default: 'exponential') */
  backoff?: BackoffStrategy;
  /** Backoff multiplier for exponential (default: 2) */
  backoffMultiplier?: number;
  /** Jitter strategy (default: 'full') */
  jitter?: JitterStrategy;
  /** Function to determine if error is retryable */
  isRetryable?: (error: Error, attempt: number) => boolean;
  /** Callback before each retry */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
  /** Callback on final failure */
  onFinalFailure?: (error: Error, attempts: number) => void;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Timeout per attempt in milliseconds */
  attemptTimeout?: number;
}

/**
 * Retry result with metadata
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
  delays: number[];
}

/**
 * Error thrown when all retries are exhausted
 */
export class RetryExhaustedError extends Error {
  constructor(
    public readonly attempts: number,
    public readonly lastError: Error,
    public readonly totalTime: number
  ) {
    super(`All ${attempts} retry attempts exhausted. Last error: ${lastError.message}`);
    this.name = 'RetryExhaustedError';
  }
}

/**
 * Error thrown when retry is aborted
 */
export class RetryAbortedError extends Error {
  constructor(
    public readonly attempts: number,
    public readonly reason: string
  ) {
    super(`Retry aborted after ${attempts} attempts: ${reason}`);
    this.name = 'RetryAbortedError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELAY CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'isRetryable' | 'onRetry' | 'onFinalFailure' | 'signal' | 'attemptTimeout'>> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoff: 'exponential',
  backoffMultiplier: 2,
  jitter: 'full',
};

/**
 * Calculate base delay based on backoff strategy
 */
function calculateBaseDelay(
  attempt: number,
  config: typeof DEFAULT_CONFIG
): number {
  switch (config.backoff) {
    case 'constant':
      return config.baseDelay;

    case 'linear':
      return config.baseDelay * attempt;

    case 'exponential':
      return config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);

    case 'fibonacci':
      return config.baseDelay * fibonacci(attempt);

    default:
      return config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  }
}

/**
 * Calculate fibonacci number (memoized)
 */
const fibonacciCache = new Map<number, number>([[1, 1], [2, 1]]);
function fibonacci(n: number): number {
  if (fibonacciCache.has(n)) return fibonacciCache.get(n)!;
  const result = fibonacci(n - 1) + fibonacci(n - 2);
  fibonacciCache.set(n, result);
  return result;
}

/**
 * Apply jitter to delay
 */
function applyJitter(
  delay: number,
  strategy: JitterStrategy,
  prevDelay?: number
): number {
  switch (strategy) {
    case 'none':
      return delay;

    case 'full':
      // Random between 0 and delay
      return Math.random() * delay;

    case 'equal':
      // Random between delay/2 and delay
      return delay / 2 + Math.random() * (delay / 2);

    case 'decorrelated':
      // Based on previous delay (AWS recommended)
      const base = prevDelay || delay;
      return Math.min(delay * 3, Math.random() * (base * 3 - delay) + delay);

    default:
      return delay;
  }
}

/**
 * Calculate final delay with jitter and cap
 */
function calculateDelay(
  attempt: number,
  config: typeof DEFAULT_CONFIG,
  prevDelay?: number
): number {
  const baseDelay = calculateBaseDelay(attempt, config);
  const withJitter = applyJitter(baseDelay, config.jitter, prevDelay);
  return Math.min(withJitter, config.maxDelay);
}

// ═══════════════════════════════════════════════════════════════════════════════
// RETRY IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new RetryAbortedError(0, 'Aborted before sleep'));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new RetryAbortedError(0, 'Aborted during sleep'));
    });
  });
}

/**
 * Wrap function with timeout
 */
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeout: number,
  signal?: AbortSignal
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new RetryAbortedError(0, 'Aborted'));
      });
    }),
  ]);
}

/**
 * Default retryable error check
 * Retries on network errors, timeouts, and 5xx errors
 */
function defaultIsRetryable(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Network errors
  if (
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('socket') ||
    message.includes('timeout')
  ) {
    return true;
  }

  // HTTP 5xx errors (if error has status)
  if ('status' in error || 'statusCode' in error) {
    const status = (error as any).status || (error as any).statusCode;
    if (status >= 500 && status < 600) return true;
    if (status === 429) return true; // Rate limited
  }

  // Specific retryable errors
  if (
    message.includes('temporarily unavailable') ||
    message.includes('service unavailable') ||
    message.includes('try again')
  ) {
    return true;
  }

  return false;
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param config - Retry configuration
 * @returns The result of the function
 * @throws RetryExhaustedError if all attempts fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config?: RetryConfig
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const isRetryable = config?.isRetryable || defaultIsRetryable;

  let lastError: Error | undefined;
  let prevDelay: number | undefined;
  const delays: number[] = [];
  const startTime = Date.now();

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    // Check if aborted
    if (config?.signal?.aborted) {
      throw new RetryAbortedError(attempt - 1, 'Aborted');
    }

    try {
      // Execute with optional timeout
      const result = config?.attemptTimeout
        ? await withTimeout(fn, config.attemptTimeout, config?.signal)
        : await fn();

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt >= cfg.maxAttempts) {
        break;
      }

      if (!isRetryable(lastError, attempt)) {
        throw lastError;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, cfg, prevDelay);
      delays.push(delay);
      prevDelay = delay;

      // Callback before retry
      config?.onRetry?.(lastError, attempt, delay);

      // Wait before next attempt
      await sleep(delay, config?.signal);
    }
  }

  // All attempts exhausted
  const totalTime = Date.now() - startTime;
  config?.onFinalFailure?.(lastError!, cfg.maxAttempts);

  throw new RetryExhaustedError(cfg.maxAttempts, lastError!, totalTime);
}

/**
 * Retry with detailed result (doesn't throw)
 */
export async function retryWithResult<T>(
  fn: () => Promise<T>,
  config?: RetryConfig
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  const delays: number[] = [];
  let attempts = 0;

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const isRetryable = config?.isRetryable || defaultIsRetryable;
  let prevDelay: number | undefined;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    attempts = attempt;

    if (config?.signal?.aborted) {
      return {
        success: false,
        error: new RetryAbortedError(attempt - 1, 'Aborted'),
        attempts,
        totalTime: Date.now() - startTime,
        delays,
      };
    }

    try {
      const data = config?.attemptTimeout
        ? await withTimeout(fn, config.attemptTimeout, config?.signal)
        : await fn();

      return {
        success: true,
        data,
        attempts,
        totalTime: Date.now() - startTime,
        delays,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt >= cfg.maxAttempts || !isRetryable(lastError, attempt)) {
        break;
      }

      const delay = calculateDelay(attempt, cfg, prevDelay);
      delays.push(delay);
      prevDelay = delay;

      config?.onRetry?.(lastError, attempt, delay);

      try {
        await sleep(delay, config?.signal);
      } catch {
        // Aborted during sleep
        break;
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts,
    totalTime: Date.now() - startTime,
    delays,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Pre-configured retry options for common use cases
 */
export const RetryPresets = {
  /**
   * Quick retry for fast operations
   */
  quick: {
    maxAttempts: 3,
    baseDelay: 100,
    maxDelay: 1000,
    backoff: 'exponential' as BackoffStrategy,
    jitter: 'full' as JitterStrategy,
  },

  /**
   * Standard retry for API calls
   */
  standard: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoff: 'exponential' as BackoffStrategy,
    jitter: 'full' as JitterStrategy,
  },

  /**
   * Patient retry for slow services
   */
  patient: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    backoff: 'exponential' as BackoffStrategy,
    jitter: 'equal' as JitterStrategy,
  },

  /**
   * Aggressive retry for critical operations
   */
  aggressive: {
    maxAttempts: 10,
    baseDelay: 500,
    maxDelay: 30000,
    backoff: 'exponential' as BackoffStrategy,
    jitter: 'decorrelated' as JitterStrategy,
  },

  /**
   * Database retry (quick recovery)
   */
  database: {
    maxAttempts: 3,
    baseDelay: 100,
    maxDelay: 2000,
    backoff: 'exponential' as BackoffStrategy,
    backoffMultiplier: 3,
    jitter: 'equal' as JitterStrategy,
  },

  /**
   * Payment retry (careful with longer waits)
   */
  payment: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    backoff: 'linear' as BackoffStrategy,
    jitter: 'equal' as JitterStrategy,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a retryable version of an async function
 */
export function withRetry<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  config?: RetryConfig
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => retry(() => fn(...args), config);
}

/**
 * Retry with circuit breaker integration
 */
export async function retryWithBreaker<T>(
  fn: () => Promise<T>,
  breaker: { execute: (fn: () => Promise<T>) => Promise<T> },
  config?: RetryConfig
): Promise<T> {
  return retry(() => breaker.execute(fn), config);
}
