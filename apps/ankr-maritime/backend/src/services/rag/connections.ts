/**
 * Database and Cache Connections for RAG Services
 *
 * Provides singleton connections for PageIndex hybrid search
 */

import { Pool } from 'pg';
import Redis from 'ioredis';

// PostgreSQL connection pool for RAG queries
let pgPool: Pool | null = null;

export function getPgPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pgPool.on('error', (err) => {
      console.error('[PgPool] Unexpected error on idle client:', err);
    });

    console.log('[PgPool] ✅ PostgreSQL connection pool created for RAG');
  }

  return pgPool;
}

// Redis connection for caching
let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('[Redis] REDIS_URL not configured - caching disabled');
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.error('[Redis] Max retries reached, giving up');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 2000); // Exponential backoff
        },
      });

      redisClient.on('connect', () => {
        console.log('[Redis] ✅ Connected to Redis for RAG caching');
      });

      redisClient.on('error', (err) => {
        console.error('[Redis] Connection error:', err);
      });
    } catch (error) {
      console.error('[Redis] Failed to create client:', error);
      return null;
    }
  }

  return redisClient;
}

// Cleanup on app shutdown
export async function closeConnections() {
  if (pgPool) {
    await pgPool.end();
    console.log('[PgPool] Connection pool closed');
  }

  if (redisClient) {
    redisClient.disconnect();
    console.log('[Redis] Connection closed');
  }
}

// Test connections
export async function testConnections() {
  const results = { pg: false, redis: false };

  // Test PostgreSQL
  try {
    const pool = getPgPool();
    await pool.query('SELECT 1');
    results.pg = true;
    console.log('[PgPool] ✅ Connection test passed');
  } catch (error) {
    console.error('[PgPool] ❌ Connection test failed:', error);
  }

  // Test Redis
  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
      results.redis = true;
      console.log('[Redis] ✅ Connection test passed');
    }
  } catch (error) {
    console.error('[Redis] ❌ Connection test failed:', error);
  }

  return results;
}
