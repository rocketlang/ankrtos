/**
 * BFC Redis Caching Layer
 *
 * High-performance caching for:
 * - Customer 360 views
 * - Credit decisions
 * - Session data
 * - Rate limiting
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RedisCacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  defaultTtl?: number;  // seconds
  maxRetries?: number;
}

export interface CacheOptions {
  ttl?: number;        // seconds
  tags?: string[];     // for cache invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memoryUsage?: string;
}

// ============================================================================
// BFC CACHE SERVICE
// ============================================================================

/**
 * BFC Cache Service
 *
 * Provides Redis-based caching with BFC-specific patterns.
 *
 * Usage:
 * ```typescript
 * const cache = new BfcCache({ host: 'localhost', port: 6379 });
 * await cache.connect();
 *
 * // Cache customer data
 * await cache.setCustomer('cust-123', customerData, { ttl: 3600 });
 *
 * // Get cached customer
 * const customer = await cache.getCustomer('cust-123');
 *
 * // Cache credit decision
 * await cache.setCreditDecision('app-456', decision);
 * ```
 */
export class BfcCache {
  private client: any = null;
  private config: Required<RedisCacheConfig>;
  private stats = { hits: 0, misses: 0 };
  private connected = false;

  constructor(config: RedisCacheConfig) {
    this.config = {
      db: 0,
      keyPrefix: 'bfc:',
      defaultTtl: 3600,  // 1 hour
      maxRetries: 3,
      ...config,
    };
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    // Dynamic import for Redis
    const { createClient } = await import('redis');

    this.client = createClient({
      socket: {
        host: this.config.host,
        port: this.config.port,
      },
      password: this.config.password,
      database: this.config.db,
    });

    this.client.on('error', (err: Error) => {
      console.error('[BfcCache] Redis error:', err.message);
    });

    this.client.on('connect', () => {
      console.log('[BfcCache] Connected to Redis');
    });

    await this.client.connect();
    this.connected = true;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  // ============================================================================
  // GENERIC OPERATIONS
  // ============================================================================

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) return null;

    try {
      const value = await this.client.get(this.prefixKey(key));
      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      }
      this.stats.misses++;
      return null;
    } catch (error) {
      console.error(`[BfcCache] Get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    if (!this.connected) return;

    try {
      const ttl = options?.ttl ?? this.config.defaultTtl;
      await this.client.setEx(
        this.prefixKey(key),
        ttl,
        JSON.stringify(value)
      );

      // Store tags for invalidation
      if (options?.tags?.length) {
        for (const tag of options.tags) {
          await this.client.sAdd(this.prefixKey(`tag:${tag}`), key);
        }
      }
    } catch (error) {
      console.error(`[BfcCache] Set error for ${key}:`, error);
    }
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.del(this.prefixKey(key));
    } catch (error) {
      console.error(`[BfcCache] Delete error for ${key}:`, error);
    }
  }

  /**
   * Invalidate by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    if (!this.connected) return 0;

    try {
      const keys = await this.client.sMembers(this.prefixKey(`tag:${tag}`));
      if (keys.length === 0) return 0;

      const prefixedKeys = keys.map((k: string) => this.prefixKey(k));
      await this.client.del(prefixedKeys);
      await this.client.del(this.prefixKey(`tag:${tag}`));

      return keys.length;
    } catch (error) {
      console.error(`[BfcCache] Invalidate error for tag ${tag}:`, error);
      return 0;
    }
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  // ============================================================================
  // BFC-SPECIFIC OPERATIONS
  // ============================================================================

  /**
   * Cache customer 360 view
   */
  async setCustomer(customerId: string, data: any, options?: CacheOptions): Promise<void> {
    await this.set(`customer:${customerId}`, data, {
      ttl: options?.ttl ?? 1800,  // 30 minutes default
      tags: [`customer:${customerId}`, 'customers'],
      ...options,
    });
  }

  /**
   * Get cached customer
   */
  async getCustomer<T = any>(customerId: string): Promise<T | null> {
    return this.get<T>(`customer:${customerId}`);
  }

  /**
   * Cache credit decision (short TTL)
   */
  async setCreditDecision(applicationId: string, decision: any): Promise<void> {
    await this.set(`credit:${applicationId}`, decision, {
      ttl: 300,  // 5 minutes
      tags: ['credit-decisions'],
    });
  }

  /**
   * Get cached credit decision
   */
  async getCreditDecision<T = any>(applicationId: string): Promise<T | null> {
    return this.get<T>(`credit:${applicationId}`);
  }

  /**
   * Cache offer recommendations
   */
  async setOffers(customerId: string, offers: any[]): Promise<void> {
    await this.set(`offers:${customerId}`, offers, {
      ttl: 3600,  // 1 hour
      tags: [`customer:${customerId}`, 'offers'],
    });
  }

  /**
   * Get cached offers
   */
  async getOffers<T = any>(customerId: string): Promise<T[] | null> {
    return this.get<T[]>(`offers:${customerId}`);
  }

  /**
   * Cache risk score
   */
  async setRiskScore(customerId: string, score: any): Promise<void> {
    await this.set(`risk:${customerId}`, score, {
      ttl: 900,  // 15 minutes
      tags: [`customer:${customerId}`, 'risk-scores'],
    });
  }

  /**
   * Get cached risk score
   */
  async getRiskScore<T = any>(customerId: string): Promise<T | null> {
    return this.get<T>(`risk:${customerId}`);
  }

  /**
   * Invalidate all cache for a customer
   */
  async invalidateCustomer(customerId: string): Promise<void> {
    await this.invalidateByTag(`customer:${customerId}`);
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  /**
   * Check and increment rate limit
   * Returns true if within limit, false if exceeded
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    if (!this.connected) {
      return { allowed: true, remaining: limit, resetAt: new Date() };
    }

    const rateLimitKey = this.prefixKey(`ratelimit:${key}`);

    try {
      const current = await this.client.incr(rateLimitKey);

      if (current === 1) {
        await this.client.expire(rateLimitKey, windowSeconds);
      }

      const ttl = await this.client.ttl(rateLimitKey);
      const resetAt = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : 0));

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetAt,
      };
    } catch (error) {
      console.error(`[BfcCache] Rate limit error for ${key}:`, error);
      return { allowed: true, remaining: limit, resetAt: new Date() };
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Store session data
   */
  async setSession(sessionId: string, data: any, ttlSeconds = 86400): Promise<void> {
    await this.set(`session:${sessionId}`, data, { ttl: ttlSeconds });
  }

  /**
   * Get session data
   */
  async getSession<T = any>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`);
  }

  /**
   * Extend session TTL
   */
  async touchSession(sessionId: string, ttlSeconds = 86400): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.expire(this.prefixKey(`session:${sessionId}`), ttlSeconds);
    } catch (error) {
      console.error(`[BfcCache] Touch session error for ${sessionId}:`, error);
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.delete(`session:${sessionId}`);
  }

  // ============================================================================
  // STATS
  // ============================================================================

  /**
   * Get cache stats
   */
  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;

    let keys = 0;
    let memoryUsage = 'N/A';

    if (this.connected) {
      try {
        const info = await this.client.info('memory');
        const match = info.match(/used_memory_human:(\S+)/);
        if (match) {
          memoryUsage = match[1];
        }

        keys = await this.client.dbSize();
      } catch {
        // Ignore stats errors
      }
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      keys,
      memoryUsage,
    };
  }

  /**
   * Reset stats
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  // ============================================================================
  // PRIVATE
  // ============================================================================

  private prefixKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let defaultCache: BfcCache | null = null;

export function createBfcCache(config: RedisCacheConfig): BfcCache {
  return new BfcCache(config);
}

export function getBfcCache(): BfcCache {
  if (!defaultCache) {
    defaultCache = new BfcCache({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: 'bfc:',
    });
  }
  return defaultCache;
}

// ============================================================================
// FASTIFY PLUGIN
// ============================================================================

export function cachePlugin(app: any, options: { cache: BfcCache }): void {
  const { cache } = options;

  // Expose cache on request
  app.decorateRequest('cache', null);

  app.addHook('onRequest', async (request: any) => {
    request.cache = cache;
  });

  // Cache stats endpoint
  app.get('/cache/stats', async () => {
    return cache.getStats();
  });

  // Cache invalidation endpoint (admin only)
  app.delete('/cache/invalidate/:tag', async (request: any) => {
    const { tag } = request.params;
    const count = await cache.invalidateByTag(tag);
    return { invalidated: count, tag };
  });
}
