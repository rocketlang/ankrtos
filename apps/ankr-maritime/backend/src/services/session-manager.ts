// session-manager.ts — Redis-based Session Management

import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

interface SessionData {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
  mfaVerified: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
  lastActivity: number;
}

interface SessionConfig {
  ttl: number; // Time to live in seconds
  maxSessions: number; // Max concurrent sessions per user
  slidingExpiration: boolean; // Extend expiration on activity
}

const DEFAULT_CONFIG: SessionConfig = {
  ttl: 24 * 60 * 60, // 24 hours
  maxSessions: 5, // 5 concurrent sessions
  slidingExpiration: true,
};

export class SessionManager {
  private redis: Redis;
  private config: SessionConfig;
  private prefix: string = 'session:';

  constructor(redisUrl?: string, customConfig?: Partial<SessionConfig>) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
  }

  /**
   * Create new session
   */
  async createSession(
    userId: string,
    organizationId: string,
    role: string,
    email: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<string> {
    const sessionId = uuidv4();
    const now = Date.now();

    const sessionData: SessionData = {
      userId,
      organizationId,
      role,
      email,
      mfaVerified: false,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      createdAt: now,
      lastActivity: now,
    };

    // Store session
    await this.redis.setex(
      this.getSessionKey(sessionId),
      this.config.ttl,
      JSON.stringify(sessionData)
    );

    // Add to user's session set
    await this.redis.sadd(this.getUserSessionsKey(userId), sessionId);

    // Enforce max sessions limit
    await this.enforceMaxSessions(userId);

    // Store session metadata for quick lookups
    await this.redis.setex(
      `${this.prefix}meta:${sessionId}`,
      this.config.ttl,
      JSON.stringify({ userId, organizationId })
    );

    return sessionId;
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const data = await this.redis.get(this.getSessionKey(sessionId));
    if (!data) return null;

    const session: SessionData = JSON.parse(data);

    // Update last activity if sliding expiration enabled
    if (this.config.slidingExpiration) {
      session.lastActivity = Date.now();
      await this.redis.setex(
        this.getSessionKey(sessionId),
        this.config.ttl,
        JSON.stringify(session)
      );
    }

    return session;
  }

  /**
   * Update session (e.g., mark MFA as verified)
   */
  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    const updatedSession = { ...session, ...updates, lastActivity: Date.now() };

    await this.redis.setex(
      this.getSessionKey(sessionId),
      this.config.ttl,
      JSON.stringify(updatedSession)
    );

    return true;
  }

  /**
   * Mark MFA as verified for session
   */
  async markMFAVerified(sessionId: string): Promise<boolean> {
    return this.updateSession(sessionId, { mfaVerified: true });
  }

  /**
   * Delete session (logout)
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    // Remove from Redis
    await this.redis.del(this.getSessionKey(sessionId));
    await this.redis.del(`${this.prefix}meta:${sessionId}`);

    // Remove from user's session set
    await this.redis.srem(this.getUserSessionsKey(session.userId), sessionId);
  }

  /**
   * Delete all sessions for user (logout all devices)
   */
  async deleteAllUserSessions(userId: string): Promise<number> {
    const sessionIds = await this.redis.smembers(this.getUserSessionsKey(userId));

    let count = 0;
    for (const sessionId of sessionIds) {
      await this.deleteSession(sessionId);
      count++;
    }

    await this.redis.del(this.getUserSessionsKey(userId));

    return count;
  }

  /**
   * Get all active sessions for user
   */
  async getUserSessions(userId: string): Promise<Array<{ sessionId: string; data: SessionData }>> {
    const sessionIds = await this.redis.smembers(this.getUserSessionsKey(userId));

    const sessions: Array<{ sessionId: string; data: SessionData }> = [];

    for (const sessionId of sessionIds) {
      const data = await this.getSession(sessionId);
      if (data) {
        sessions.push({ sessionId, data });
      } else {
        // Clean up stale session ID
        await this.redis.srem(this.getUserSessionsKey(userId), sessionId);
      }
    }

    // Sort by last activity (most recent first)
    sessions.sort((a, b) => b.data.lastActivity - a.data.lastActivity);

    return sessions;
  }

  /**
   * Get session count for user
   */
  async getUserSessionCount(userId: string): Promise<number> {
    return this.redis.scard(this.getUserSessionsKey(userId));
  }

  /**
   * Validate session and check expiry
   */
  async validateSession(sessionId: string): Promise<{
    valid: boolean;
    session?: SessionData;
    reason?: string;
  }> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return { valid: false, reason: 'session_not_found' };
    }

    // Check if session is too old (even with sliding expiration)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days absolute max
    if (Date.now() - session.createdAt > maxAge) {
      await this.deleteSession(sessionId);
      return { valid: false, reason: 'session_expired' };
    }

    return { valid: true, session };
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: string, additionalSeconds?: number): Promise<boolean> {
    const ttl = additionalSeconds || this.config.ttl;
    const exists = await this.redis.exists(this.getSessionKey(sessionId));

    if (!exists) return false;

    await this.redis.expire(this.getSessionKey(sessionId), ttl);
    await this.redis.expire(`${this.prefix}meta:${sessionId}`, ttl);

    return true;
  }

  /**
   * Get active session statistics
   */
  async getStats(): Promise<{
    totalSessions: number;
    totalUsers: number;
    avgSessionsPerUser: number;
  }> {
    const keys = await this.redis.keys(`${this.prefix}*`);
    const sessionKeys = keys.filter((k) => k.startsWith(this.prefix) && !k.includes(':meta:'));

    const totalSessions = sessionKeys.length;

    // Get unique users
    const userIds = new Set<string>();
    for (const key of sessionKeys) {
      const data = await this.redis.get(key);
      if (data) {
        const session: SessionData = JSON.parse(data);
        userIds.add(session.userId);
      }
    }

    const totalUsers = userIds.size;
    const avgSessionsPerUser = totalUsers > 0 ? totalSessions / totalUsers : 0;

    return {
      totalSessions,
      totalUsers,
      avgSessionsPerUser: Math.round(avgSessionsPerUser * 100) / 100,
    };
  }

  /**
   * Clean up expired sessions (maintenance task)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const keys = await this.redis.keys(`${this.prefix}*`);
    let cleaned = 0;

    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -2) {
        // Key doesn't exist
        await this.redis.del(key);
        cleaned++;
      } else if (ttl === -1) {
        // Key exists but has no expiry (shouldn't happen, but clean up anyway)
        await this.redis.del(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Private: Enforce max sessions per user
   */
  private async enforceMaxSessions(userId: string): Promise<void> {
    const sessionIds = await this.redis.smembers(this.getUserSessionsKey(userId));

    if (sessionIds.length <= this.config.maxSessions) return;

    // Get all sessions with timestamps
    const sessions: Array<{ sessionId: string; lastActivity: number }> = [];

    for (const sessionId of sessionIds) {
      const data = await this.getSession(sessionId);
      if (data) {
        sessions.push({ sessionId, lastActivity: data.lastActivity });
      }
    }

    // Sort by last activity (oldest first)
    sessions.sort((a, b) => a.lastActivity - b.lastActivity);

    // Delete oldest sessions to get back to limit
    const toDelete = sessions.length - this.config.maxSessions;
    for (let i = 0; i < toDelete; i++) {
      await this.deleteSession(sessions[i].sessionId);
    }
  }

  /**
   * Private: Get session key
   */
  private getSessionKey(sessionId: string): string {
    return `${this.prefix}${sessionId}`;
  }

  /**
   * Private: Get user sessions set key
   */
  private getUserSessionsKey(userId: string): string {
    return `${this.prefix}user:${userId}:sessions`;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export const sessionManager = new SessionManager();
