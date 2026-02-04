/**
 * RAG Cache Service
 * Caches search results and RAG answers using Redis
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6382';
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '3600'); // 1 hour default
const ENABLE_CACHE = process.env.ENABLE_CACHE !== 'false';

// Initialize Redis client
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

// Connect to Redis
let isConnected = false;

async function ensureConnected() {
  if (!isConnected) {
    try {
      await redis.connect();
      isConnected = true;
      console.log('✅ Redis cache connected');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }
  }
}

/**
 * Generate cache key for search queries
 */
function generateSearchKey(query: string, options: any, orgId: string): string {
  const optsStr = JSON.stringify({
    docTypes: options.docTypes || [],
    limit: options.limit || 10,
    vesselId: options.vesselId,
    voyageId: options.voyageId,
  });
  return `search:${orgId}:${query}:${optsStr}`;
}

/**
 * Generate cache key for RAG answers
 */
function generateRAGKey(question: string, options: any, orgId: string): string {
  const optsStr = JSON.stringify({
    docTypes: options.docTypes || [],
    limit: options.limit || 5,
  });
  return `rag:${orgId}:${question}:${optsStr}`;
}

/**
 * Get cached search results
 */
export async function getCachedSearch(
  query: string,
  options: any,
  orgId: string
): Promise<any | null> {
  if (!ENABLE_CACHE) return null;

  try {
    await ensureConnected();
    const key = generateSearchKey(query, options, orgId);
    const cached = await redis.get(key);

    if (cached) {
      console.log(`🎯 Cache HIT: search "${query}"`);
      return JSON.parse(cached);
    }

    console.log(`❌ Cache MISS: search "${query}"`);
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null; // Fail gracefully
  }
}

/**
 * Cache search results
 */
export async function cacheSearch(
  query: string,
  options: any,
  orgId: string,
  results: any
): Promise<void> {
  if (!ENABLE_CACHE) return;

  try {
    await ensureConnected();
    const key = generateSearchKey(query, options, orgId);
    await redis.setex(key, CACHE_TTL, JSON.stringify(results));
    console.log(`💾 Cached search results for "${query}"`);
  } catch (error) {
    console.error('Cache set error:', error);
    // Don't throw, just log - caching is not critical
  }
}

/**
 * Get cached RAG answer
 */
export async function getCachedRAG(
  question: string,
  options: any,
  orgId: string
): Promise<any | null> {
  if (!ENABLE_CACHE) return null;

  try {
    await ensureConnected();
    const key = generateRAGKey(question, options, orgId);
    const cached = await redis.get(key);

    if (cached) {
      console.log(`🎯 Cache HIT: RAG "${question}"`);
      return JSON.parse(cached);
    }

    console.log(`❌ Cache MISS: RAG "${question}"`);
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Cache RAG answer
 */
export async function cacheRAG(
  question: string,
  options: any,
  orgId: string,
  answer: any
): Promise<void> {
  if (!ENABLE_CACHE) return;

  try {
    await ensureConnected();
    const key = generateRAGKey(question, options, orgId);
    await redis.setex(key, CACHE_TTL, JSON.stringify(answer));
    console.log(`💾 Cached RAG answer for "${question}"`);
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Invalidate cache for an organization
 */
export async function invalidateOrgCache(orgId: string): Promise<void> {
  if (!ENABLE_CACHE) return;

  try {
    await ensureConnected();
    const pattern = `*:${orgId}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️  Invalidated ${keys.length} cache entries for org ${orgId}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  keys: number;
  memory: string;
  hitRate: string;
}> {
  if (!ENABLE_CACHE) {
    return { keys: 0, memory: '0B', hitRate: 'N/A' };
  }

  try {
    await ensureConnected();
    const info = await redis.info('stats');
    const dbSize = await redis.dbsize();

    // Parse memory usage
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const memory = memoryMatch ? memoryMatch[1] : 'unknown';

    // Parse hit rate
    const hitsMatch = info.match(/keyspace_hits:(\d+)/);
    const missesMatch = info.match(/keyspace_misses:(\d+)/);

    let hitRate = 'N/A';
    if (hitsMatch && missesMatch) {
      const hits = parseInt(hitsMatch[1]);
      const misses = parseInt(missesMatch[1]);
      const total = hits + misses;
      if (total > 0) {
        hitRate = `${((hits / total) * 100).toFixed(1)}%`;
      }
    }

    return {
      keys: dbSize,
      memory,
      hitRate,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return { keys: 0, memory: 'error', hitRate: 'error' };
  }
}

/**
 * Close Redis connection
 */
export async function closeCache(): Promise<void> {
  if (isConnected) {
    await redis.quit();
    isConnected = false;
    console.log('🔌 Redis cache disconnected');
  }
}

export default {
  getCachedSearch,
  cacheSearch,
  getCachedRAG,
  cacheRAG,
  invalidateOrgCache,
  getCacheStats,
  closeCache,
};
