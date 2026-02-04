/**
 * Redis Session Management
 * Secure session storage with automatic expiry
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected for session management');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error.message);
});

/**
 * Session Storage Interface
 */
export class SessionStore {
  private readonly prefix = 'mari8x:session:';
  private readonly ttl = 7 * 24 * 60 * 60; // 7 days

  /**
   * Create a new session
   */
  async create(userId: string, sessionData: any): Promise<string> {
    const sessionId = this.generateSessionId();
    const key = this.prefix + sessionId;

    await redis.setex(
      key,
      this.ttl,
      JSON.stringify({
        userId,
        ...sessionData,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      })
    );

    return sessionId;
  }

  /**
   * Get session data
   */
  async get(sessionId: string): Promise<any | null> {
    const key = this.prefix + sessionId;
    const data = await redis.get(key);

    if (!data) return null;

    // Update last activity timestamp and refresh TTL
    const session = JSON.parse(data);
    session.lastActivity = new Date().toISOString();
    await redis.setex(key, this.ttl, JSON.stringify(session));

    return session;
  }

  /**
   * Update session data
   */
  async update(sessionId: string, updates: any): Promise<void> {
    const key = this.prefix + sessionId;
    const existing = await redis.get(key);

    if (!existing) {
      throw new Error('Session not found');
    }

    const session = { ...JSON.parse(existing), ...updates };
    session.lastActivity = new Date().toISOString();
    await redis.setex(key, this.ttl, JSON.stringify(session));
  }

  /**
   * Destroy session (logout)
   */
  async destroy(sessionId: string): Promise<void> {
    const key = this.prefix + sessionId;
    await redis.del(key);
  }

  /**
   * Destroy all sessions for a user (security: logout from all devices)
   */
  async destroyAllUserSessions(userId: string): Promise<void> {
    const pattern = this.prefix + '*';
    let cursor = '0';

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;

      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const session = JSON.parse(data);
          if (session.userId === userId) {
            await redis.del(key);
          }
        }
      }
    } while (cursor !== '0');
  }

  /**
   * Get active session count for user
   */
  async getUserSessionCount(userId: string): Promise<number> {
    const pattern = this.prefix + '*';
    let cursor = '0';
    let count = 0;

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;

      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const session = JSON.parse(data);
          if (session.userId === userId) {
            count++;
          }
        }
      }
    } while (cursor !== '0');

    return count;
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36)
    );
  }
}

export const sessionStore = new SessionStore();
