/**
 * Production-Grade Database Connection Manager
 *
 * Features:
 * - Singleton pattern with proper lifecycle management
 * - Connection pooling with automatic cleanup
 * - Health checks and monitoring
 * - Graceful shutdown handling
 * - Error recovery and reconnection logic
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

class DatabaseManager {
  private static instance: DatabaseManager;
  private client: PrismaClient | null = null;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxRetries = 3;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.setupGracefulShutdown();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Get Prisma client instance
   * Creates connection on first call, returns existing instance thereafter
   */
  public async getClient(): Promise<PrismaClient> {
    if (!this.client) {
      await this.connect();
    }
    return this.client!;
  }

  /**
   * Establish database connection with retry logic
   */
  private async connect(): Promise<void> {
    try {
      logger.info('🔌 Connecting to database...');

      this.client = new PrismaClient({
        log: [
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
        datasources: {
          db: {
            url: this.buildConnectionString(),
          },
        },
      });

      // Setup error handlers
      this.client.$on('error' as never, (e: any) => {
        logger.error('Prisma error:', e);
      });

      this.client.$on('warn' as never, (e: any) => {
        logger.warn('Prisma warning:', e);
      });

      // Test connection
      await this.client.$connect();
      await this.client.$queryRaw`SELECT 1`;

      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info('✅ Database connected successfully');

      // Start health checks
      this.startHealthChecks();

      // Start idle connection cleanup
      this.startIdleConnectionCleanup();
    } catch (error) {
      this.connectionAttempts++;
      logger.error(`❌ Database connection failed (attempt ${this.connectionAttempts}/${this.maxRetries}):`, error);

      if (this.connectionAttempts < this.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 10000);
        logger.info(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connect();
      } else {
        throw new Error('Failed to connect to database after multiple attempts');
      }
    }
  }

  /**
   * Build optimized connection string
   */
  private buildConnectionString(): string {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Production-grade connection pool settings
    const params = new URLSearchParams({
      // Connection pool settings
      connection_limit: '8', // Reduced from 10 - more efficient
      pool_timeout: '10', // Reduced from 20 - fail faster

      // Performance settings
      statement_cache_size: '500', // Cache prepared statements

      // Reliability settings
      connect_timeout: '10', // 10 seconds to establish connection
      idle_timeout: '30', // 30 seconds idle before closing (aggressive cleanup)

      // SSL for production
      sslmode: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Periodic health checks to ensure connection is alive
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        if (this.client) {
          await this.client.$queryRaw`SELECT 1`;
          this.isConnected = true;
        }
      } catch (error) {
        logger.error('❌ Database health check failed:', error);
        this.isConnected = false;

        // Attempt reconnection
        await this.reconnect();
      }
    }, 30000);
  }

  /**
   * Reconnect to database
   */
  private async reconnect(): Promise<void> {
    logger.warn('🔄 Attempting to reconnect to database...');

    try {
      await this.disconnect();
      this.connectionAttempts = 0;
      await this.connect();
    } catch (error) {
      logger.error('❌ Reconnection failed:', error);
    }
  }

  /**
   * Gracefully disconnect from database
   */
  public async disconnect(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.client) {
      try {
        await this.client.$disconnect();
        logger.info('🔌 Database disconnected');
      } catch (error) {
        logger.error('Error disconnecting from database:', error);
      } finally {
        this.client = null;
        this.isConnected = false;
      }
    }
  }

  /**
   * Get connection status
   */
  public getStatus(): {
    connected: boolean;
    attempts: number;
    hasClient: boolean;
  } {
    return {
      connected: this.isConnected,
      attempts: this.connectionAttempts,
      hasClient: !!this.client,
    };
  }

  /**
   * Execute query with automatic retry on connection loss
   */
  public async withRetry<T>(
    operation: (client: PrismaClient) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = await this.getClient();
        return await operation(client);
      } catch (error: any) {
        lastError = error;

        // Check if it's a connection error
        if (
          error.code === 'P1001' || // Can't reach database
          error.code === 'P1002' || // Connection timeout
          error.code === 'P2037' || // Too many connections
          error.message?.includes('Connection')
        ) {
          logger.warn(`⚠️ Connection error on attempt ${attempt}/${maxRetries}:`, error.message);

          if (attempt < maxRetries) {
            await this.reconnect();
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }

        // Non-connection errors are thrown immediately
        throw error;
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Clean up idle connections at database level
   */
  public async cleanupIdleConnections(idleThresholdSeconds = 60): Promise<number> {
    try {
      if (!this.client) return 0;

      // Terminate connections that have been idle for too long
      const result = await this.client.$executeRaw`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid != pg_backend_pid()
          AND state = 'idle'
          AND state_change < NOW() - INTERVAL '1 second' * ${idleThresholdSeconds}
          AND application_name != 'TimescaleDB Background Worker Scheduler'
      `;

      if (result > 0) {
        logger.info(`🧹 Cleaned up ${result} idle connection(s)`);
      }

      return result;
    } catch (error) {
      logger.error('Error cleaning up idle connections:', error);
      return 0;
    }
  }

  /**
   * Start periodic idle connection cleanup
   */
  private startIdleConnectionCleanup(): void {
    // Clean up idle connections every 2 minutes
    setInterval(async () => {
      await this.cleanupIdleConnections(60); // Terminate if idle > 60 seconds
    }, 120000); // Run every 2 minutes
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Closing database connection...`);
      await this.disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('beforeExit', () => {
      this.disconnect().catch(console.error);
    });
  }
}

// Export singleton instance
const dbManager = DatabaseManager.getInstance();

// Export convenient getter
export const getPrisma = () => dbManager.getClient();

// Export manager for advanced usage
export { dbManager };

// Export type for convenience
export type { PrismaClient };
