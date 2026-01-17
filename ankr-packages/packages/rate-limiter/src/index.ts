/**
 * @ankr/rate-limiter
 *
 * Flexible rate limiting with multiple algorithms for API protection.
 *
 * Algorithms:
 * - Sliding Window: Smooth rate limiting across time windows
 * - Token Bucket: Allows bursts while maintaining average rate
 * - Fixed Window: Simple counter per time window
 * - Leaky Bucket: Constant outflow rate
 *
 * @example
 * ```typescript
 * import { RateLimiter, SlidingWindowLimiter } from '@ankr/rate-limiter';
 *
 * const limiter = new SlidingWindowLimiter({
 *   windowMs: 60000,  // 1 minute
 *   maxRequests: 100  // 100 requests per minute
 * });
 *
 * const result = await limiter.consume('user-123');
 * if (!result.allowed) {
 *   // Rate limited
 * }
 * ```
 *
 * @packageDocumentation
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** Total limit */
  limit: number;
  /** Time until reset (ms) */
  resetIn: number;
  /** Retry after (ms) - only if not allowed */
  retryAfter?: number;
}

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  maxRequests: number;
  /** Key prefix for storage */
  keyPrefix?: string;
  /** Skip rate limiting for certain keys */
  skip?: (key: string) => boolean;
  /** Custom key generator */
  keyGenerator?: (identifier: string) => string;
  /** Callback when limit is exceeded */
  onLimitExceeded?: (key: string, result: RateLimitResult) => void;
}

/**
 * Token bucket configuration
 */
export interface TokenBucketConfig {
  /** Maximum tokens (burst capacity) */
  bucketSize: number;
  /** Tokens added per interval */
  refillRate: number;
  /** Refill interval in milliseconds */
  refillInterval: number;
  /** Initial tokens */
  initialTokens?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDING WINDOW LIMITER
// ═══════════════════════════════════════════════════════════════════════════════

interface WindowEntry {
  count: number;
  timestamps: number[];
}

/**
 * Sliding Window Rate Limiter
 *
 * Provides smooth rate limiting by tracking requests within a sliding time window.
 */
export class SlidingWindowLimiter {
  private store = new Map<string, WindowEntry>();
  private config: Required<RateLimiterConfig>;

  constructor(config: RateLimiterConfig) {
    this.config = {
      keyPrefix: 'rl:sw:',
      skip: () => false,
      keyGenerator: (id) => id,
      onLimitExceeded: () => {},
      ...config,
    };
  }

  /**
   * Check and consume rate limit
   */
  consume(identifier: string, cost = 1): RateLimitResult {
    const key = this.config.keyPrefix + this.config.keyGenerator(identifier);

    // Check skip
    if (this.config.skip(identifier)) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        limit: this.config.maxRequests,
        resetIn: 0,
      };
    }

    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create entry
    let entry = this.store.get(key);
    if (!entry) {
      entry = { count: 0, timestamps: [] };
      this.store.set(key, entry);
    }

    // Clean old timestamps
    entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);
    entry.count = entry.timestamps.length;

    // Calculate result
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const oldestTimestamp = entry.timestamps[0] || now;
    const resetIn = Math.max(0, oldestTimestamp + this.config.windowMs - now);

    if (entry.count + cost > this.config.maxRequests) {
      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        limit: this.config.maxRequests,
        resetIn,
        retryAfter: resetIn,
      };
      this.config.onLimitExceeded(identifier, result);
      return result;
    }

    // Record request
    for (let i = 0; i < cost; i++) {
      entry.timestamps.push(now);
    }
    entry.count = entry.timestamps.length;

    return {
      allowed: true,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      limit: this.config.maxRequests,
      resetIn,
    };
  }

  /**
   * Check without consuming
   */
  check(identifier: string): RateLimitResult {
    const key = this.config.keyPrefix + this.config.keyGenerator(identifier);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const entry = this.store.get(key);
    if (!entry) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        limit: this.config.maxRequests,
        resetIn: this.config.windowMs,
      };
    }

    const validTimestamps = entry.timestamps.filter(ts => ts > windowStart);
    const count = validTimestamps.length;
    const oldestTimestamp = validTimestamps[0] || now;
    const resetIn = Math.max(0, oldestTimestamp + this.config.windowMs - now);

    return {
      allowed: count < this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - count),
      limit: this.config.maxRequests,
      resetIn,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    const key = this.config.keyPrefix + this.config.keyGenerator(identifier);
    this.store.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.store.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN BUCKET LIMITER
// ═══════════════════════════════════════════════════════════════════════════════

interface BucketEntry {
  tokens: number;
  lastRefill: number;
}

/**
 * Token Bucket Rate Limiter
 *
 * Allows bursts while maintaining average rate over time.
 */
export class TokenBucketLimiter {
  private store = new Map<string, BucketEntry>();
  private config: Required<TokenBucketConfig> & { keyPrefix: string };

  constructor(config: TokenBucketConfig & { keyPrefix?: string }) {
    this.config = {
      keyPrefix: 'rl:tb:',
      initialTokens: config.bucketSize,
      ...config,
    };
  }

  /**
   * Try to consume tokens
   */
  consume(identifier: string, tokens = 1): RateLimitResult {
    const key = this.config.keyPrefix + identifier;
    const now = Date.now();

    // Get or create bucket
    let bucket = this.store.get(key);
    if (!bucket) {
      bucket = {
        tokens: this.config.initialTokens,
        lastRefill: now,
      };
      this.store.set(key, bucket);
    }

    // Refill tokens
    const elapsed = now - bucket.lastRefill;
    const refills = Math.floor(elapsed / this.config.refillInterval);
    if (refills > 0) {
      bucket.tokens = Math.min(
        this.config.bucketSize,
        bucket.tokens + refills * this.config.refillRate
      );
      bucket.lastRefill = now;
    }

    // Calculate time until next token
    const timeUntilRefill = this.config.refillInterval - (elapsed % this.config.refillInterval);

    if (bucket.tokens < tokens) {
      // Not enough tokens
      const tokensNeeded = tokens - bucket.tokens;
      const refillsNeeded = Math.ceil(tokensNeeded / this.config.refillRate);
      const retryAfter = timeUntilRefill + (refillsNeeded - 1) * this.config.refillInterval;

      return {
        allowed: false,
        remaining: Math.floor(bucket.tokens),
        limit: this.config.bucketSize,
        resetIn: timeUntilRefill,
        retryAfter,
      };
    }

    // Consume tokens
    bucket.tokens -= tokens;

    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      limit: this.config.bucketSize,
      resetIn: timeUntilRefill,
    };
  }

  /**
   * Check without consuming
   */
  check(identifier: string): RateLimitResult {
    const key = this.config.keyPrefix + identifier;
    const now = Date.now();

    const bucket = this.store.get(key);
    if (!bucket) {
      return {
        allowed: true,
        remaining: this.config.bucketSize,
        limit: this.config.bucketSize,
        resetIn: 0,
      };
    }

    // Calculate current tokens
    const elapsed = now - bucket.lastRefill;
    const refills = Math.floor(elapsed / this.config.refillInterval);
    const currentTokens = Math.min(
      this.config.bucketSize,
      bucket.tokens + refills * this.config.refillRate
    );

    return {
      allowed: currentTokens >= 1,
      remaining: Math.floor(currentTokens),
      limit: this.config.bucketSize,
      resetIn: this.config.refillInterval - (elapsed % this.config.refillInterval),
    };
  }

  /**
   * Reset bucket for identifier
   */
  reset(identifier: string): void {
    const key = this.config.keyPrefix + identifier;
    this.store.delete(key);
  }

  /**
   * Clear all buckets
   */
  clear(): void {
    this.store.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIXED WINDOW LIMITER
// ═══════════════════════════════════════════════════════════════════════════════

interface FixedWindowEntry {
  count: number;
  windowStart: number;
}

/**
 * Fixed Window Rate Limiter
 *
 * Simple counter that resets at fixed intervals.
 */
export class FixedWindowLimiter {
  private store = new Map<string, FixedWindowEntry>();
  private config: Required<RateLimiterConfig>;

  constructor(config: RateLimiterConfig) {
    this.config = {
      keyPrefix: 'rl:fw:',
      skip: () => false,
      keyGenerator: (id) => id,
      onLimitExceeded: () => {},
      ...config,
    };
  }

  /**
   * Check and consume rate limit
   */
  consume(identifier: string, cost = 1): RateLimitResult {
    const key = this.config.keyPrefix + this.config.keyGenerator(identifier);
    const now = Date.now();
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const windowEnd = windowStart + this.config.windowMs;

    // Get or create entry
    let entry = this.store.get(key);
    if (!entry || entry.windowStart !== windowStart) {
      entry = { count: 0, windowStart };
      this.store.set(key, entry);
    }

    const resetIn = windowEnd - now;

    if (entry.count + cost > this.config.maxRequests) {
      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        limit: this.config.maxRequests,
        resetIn,
        retryAfter: resetIn,
      };
      this.config.onLimitExceeded(identifier, result);
      return result;
    }

    entry.count += cost;

    return {
      allowed: true,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      limit: this.config.maxRequests,
      resetIn,
    };
  }

  /**
   * Check without consuming
   */
  check(identifier: string): RateLimitResult {
    const key = this.config.keyPrefix + this.config.keyGenerator(identifier);
    const now = Date.now();
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const windowEnd = windowStart + this.config.windowMs;

    const entry = this.store.get(key);
    const count = entry?.windowStart === windowStart ? entry.count : 0;

    return {
      allowed: count < this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - count),
      limit: this.config.maxRequests,
      resetIn: windowEnd - now,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    const key = this.config.keyPrefix + this.config.keyGenerator(identifier);
    this.store.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.store.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSITE RATE LIMITER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Rate limiter interface
 */
export interface RateLimiter {
  consume(identifier: string, cost?: number): RateLimitResult;
  check(identifier: string): RateLimitResult;
  reset(identifier: string): void;
  clear(): void;
}

/**
 * Composite Rate Limiter
 *
 * Combines multiple limiters (e.g., per-second and per-day limits).
 */
export class CompositeRateLimiter implements RateLimiter {
  private limiters: RateLimiter[];

  constructor(limiters: RateLimiter[]) {
    this.limiters = limiters;
  }

  /**
   * Check all limiters, consume only if all allow
   */
  consume(identifier: string, cost = 1): RateLimitResult {
    // First check all
    const results = this.limiters.map(l => l.check(identifier));
    const blocked = results.find(r => !r.allowed || r.remaining < cost);

    if (blocked) {
      return {
        allowed: false,
        remaining: Math.min(...results.map(r => r.remaining)),
        limit: Math.min(...results.map(r => r.limit)),
        resetIn: Math.max(...results.map(r => r.resetIn)),
        retryAfter: blocked.retryAfter || blocked.resetIn,
      };
    }

    // Consume from all
    const consumeResults = this.limiters.map(l => l.consume(identifier, cost));

    return {
      allowed: true,
      remaining: Math.min(...consumeResults.map(r => r.remaining)),
      limit: Math.min(...consumeResults.map(r => r.limit)),
      resetIn: Math.min(...consumeResults.map(r => r.resetIn)),
    };
  }

  /**
   * Check all limiters
   */
  check(identifier: string): RateLimitResult {
    const results = this.limiters.map(l => l.check(identifier));
    const blocked = results.find(r => !r.allowed);

    return {
      allowed: !blocked,
      remaining: Math.min(...results.map(r => r.remaining)),
      limit: Math.min(...results.map(r => r.limit)),
      resetIn: blocked ? blocked.resetIn : Math.min(...results.map(r => r.resetIn)),
      retryAfter: blocked?.retryAfter,
    };
  }

  /**
   * Reset all limiters
   */
  reset(identifier: string): void {
    this.limiters.forEach(l => l.reset(identifier));
  }

  /**
   * Clear all limiters
   */
  clear(): void {
    this.limiters.forEach(l => l.clear());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Pre-configured rate limiters for common use cases
 */
export const RateLimiterPresets = {
  /**
   * Standard API rate limiter (100 req/min)
   */
  api(): SlidingWindowLimiter {
    return new SlidingWindowLimiter({
      windowMs: 60000,
      maxRequests: 100,
    });
  },

  /**
   * Strict API rate limiter (30 req/min)
   */
  apiStrict(): SlidingWindowLimiter {
    return new SlidingWindowLimiter({
      windowMs: 60000,
      maxRequests: 30,
    });
  },

  /**
   * Authentication rate limiter (5 attempts/15 min)
   */
  auth(): SlidingWindowLimiter {
    return new SlidingWindowLimiter({
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
    });
  },

  /**
   * OTP rate limiter (3 attempts/10 min)
   */
  otp(): SlidingWindowLimiter {
    return new SlidingWindowLimiter({
      windowMs: 10 * 60 * 1000,
      maxRequests: 3,
    });
  },

  /**
   * Payment rate limiter (10 req/min, 100 req/hour)
   */
  payment(): CompositeRateLimiter {
    return new CompositeRateLimiter([
      new SlidingWindowLimiter({ windowMs: 60000, maxRequests: 10 }),
      new SlidingWindowLimiter({ windowMs: 3600000, maxRequests: 100 }),
    ]);
  },

  /**
   * Burst-friendly with token bucket (10 burst, 1 req/sec avg)
   */
  burst(): TokenBucketLimiter {
    return new TokenBucketLimiter({
      bucketSize: 10,
      refillRate: 1,
      refillInterval: 1000,
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create rate limit headers for HTTP response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil((Date.now() + result.resetIn) / 1000)),
    ...(result.retryAfter ? { 'Retry-After': String(Math.ceil(result.retryAfter / 1000)) } : {}),
  };
}

/**
 * Extract identifier from request (for middleware)
 */
export function getIdentifier(
  req: { ip?: string; headers?: Record<string, string | string[] | undefined>; user?: { id?: string } }
): string {
  // Prefer user ID if authenticated
  if (req.user?.id) return `user:${req.user.id}`;

  // Fall back to IP
  const forwarded = req.headers?.['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.ip || 'unknown';

  return `ip:${ip}`;
}
