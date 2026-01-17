/**
 * BFC Graceful Shutdown
 *
 * Ensures clean shutdown of services:
 * - Completes in-flight requests
 * - Closes database connections
 * - Flushes metrics/logs
 * - Notifies health checks
 */

// ============================================================================
// TYPES
// ============================================================================

export type ShutdownPhase = 'RUNNING' | 'DRAINING' | 'SHUTTING_DOWN' | 'TERMINATED';

export interface ShutdownHandler {
  name: string;
  priority: number;  // Lower runs first
  timeout: number;   // Max time for this handler
  handler: () => Promise<void>;
}

export interface GracefulShutdownConfig {
  // Total shutdown timeout
  timeout: number;

  // Drain period (stop accepting new requests)
  drainTimeout: number;

  // Signals to listen for
  signals?: NodeJS.Signals[];

  // Callback on phase change
  onPhaseChange?: (phase: ShutdownPhase) => void;

  // Logger
  logger?: {
    info: (msg: string) => void;
    error: (msg: string, error?: Error) => void;
  };
}

// ============================================================================
// GRACEFUL SHUTDOWN MANAGER
// ============================================================================

export class GracefulShutdownManager {
  private phase: ShutdownPhase = 'RUNNING';
  private handlers: ShutdownHandler[] = [];
  private isShuttingDown = false;
  private readonly config: Required<GracefulShutdownConfig>;

  constructor(config: GracefulShutdownConfig) {
    this.config = {
      signals: ['SIGTERM', 'SIGINT'],
      onPhaseChange: () => {},
      logger: {
        info: console.log,
        error: console.error,
      },
      ...config,
    };
  }

  /**
   * Register a shutdown handler
   */
  register(handler: ShutdownHandler): void {
    this.handlers.push(handler);
    this.handlers.sort((a, b) => a.priority - b.priority);
    this.config.logger.info(`[Shutdown] Registered handler: ${handler.name} (priority ${handler.priority})`);
  }

  /**
   * Start listening for shutdown signals
   */
  listen(): void {
    for (const signal of this.config.signals) {
      process.on(signal, () => {
        this.config.logger.info(`[Shutdown] Received ${signal}`);
        this.shutdown();
      });
    }

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.config.logger.error('[Shutdown] Uncaught exception', error);
      this.shutdown(1);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason) => {
      this.config.logger.error('[Shutdown] Unhandled rejection', reason as Error);
      this.shutdown(1);
    });
  }

  /**
   * Get current phase
   */
  getPhase(): ShutdownPhase {
    return this.phase;
  }

  /**
   * Check if accepting new requests
   */
  isHealthy(): boolean {
    return this.phase === 'RUNNING';
  }

  /**
   * Check if in shutdown
   */
  isTerminating(): boolean {
    return this.phase !== 'RUNNING';
  }

  /**
   * Trigger shutdown
   */
  async shutdown(exitCode = 0): Promise<void> {
    if (this.isShuttingDown) {
      this.config.logger.info('[Shutdown] Already shutting down, ignoring');
      return;
    }

    this.isShuttingDown = true;
    const startTime = Date.now();

    try {
      // Phase 1: Draining
      this.setPhase('DRAINING');
      this.config.logger.info(`[Shutdown] Draining for ${this.config.drainTimeout}ms...`);
      await this.sleep(this.config.drainTimeout);

      // Phase 2: Execute handlers
      this.setPhase('SHUTTING_DOWN');
      await this.executeHandlers();

      // Phase 3: Done
      this.setPhase('TERMINATED');
      const elapsed = Date.now() - startTime;
      this.config.logger.info(`[Shutdown] Completed in ${elapsed}ms`);

    } catch (error) {
      this.config.logger.error('[Shutdown] Error during shutdown', error as Error);
      exitCode = 1;
    } finally {
      // Force exit after timeout
      setTimeout(() => {
        this.config.logger.error('[Shutdown] Force exit after timeout');
        process.exit(exitCode);
      }, 1000);

      process.exit(exitCode);
    }
  }

  // ============================================================================
  // PRIVATE
  // ============================================================================

  private setPhase(phase: ShutdownPhase): void {
    this.phase = phase;
    this.config.onPhaseChange(phase);
  }

  private async executeHandlers(): Promise<void> {
    for (const handler of this.handlers) {
      this.config.logger.info(`[Shutdown] Running: ${handler.name}`);

      try {
        await Promise.race([
          handler.handler(),
          this.timeoutPromise(handler.timeout, handler.name),
        ]);
        this.config.logger.info(`[Shutdown] Completed: ${handler.name}`);
      } catch (error) {
        this.config.logger.error(`[Shutdown] Failed: ${handler.name}`, error as Error);
        // Continue with other handlers
      }
    }
  }

  private timeoutPromise(ms: number, name: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Handler ${name} timed out after ${ms}ms`)), ms);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// COMMON HANDLERS
// ============================================================================

export const ShutdownHandlers = {
  /**
   * Close Fastify server
   */
  fastify(app: any, timeout = 10000): ShutdownHandler {
    return {
      name: 'fastify-server',
      priority: 1,  // Close server first
      timeout,
      handler: async () => {
        await app.close();
      },
    };
  },

  /**
   * Close Prisma connection
   */
  prisma(prisma: any, timeout = 5000): ShutdownHandler {
    return {
      name: 'prisma-database',
      priority: 10,  // Close after server
      timeout,
      handler: async () => {
        await prisma.$disconnect();
      },
    };
  },

  /**
   * Close Redis connection
   */
  redis(redis: any, timeout = 3000): ShutdownHandler {
    return {
      name: 'redis-cache',
      priority: 5,
      timeout,
      handler: async () => {
        await redis.quit();
      },
    };
  },

  /**
   * Flush metrics
   */
  metrics(flush: () => Promise<void>, timeout = 2000): ShutdownHandler {
    return {
      name: 'metrics-flush',
      priority: 20,
      timeout,
      handler: flush,
    };
  },

  /**
   * Close CBS connection
   */
  cbs(adapter: any, timeout = 5000): ShutdownHandler {
    return {
      name: 'cbs-adapter',
      priority: 8,
      timeout,
      handler: async () => {
        await adapter.disconnect();
      },
    };
  },

  /**
   * Custom handler
   */
  custom(name: string, handler: () => Promise<void>, priority = 15, timeout = 5000): ShutdownHandler {
    return {
      name,
      priority,
      timeout,
      handler,
    };
  },
};

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let instance: GracefulShutdownManager | null = null;

export function getShutdownManager(config?: GracefulShutdownConfig): GracefulShutdownManager {
  if (!instance && config) {
    instance = new GracefulShutdownManager(config);
  }
  if (!instance) {
    instance = new GracefulShutdownManager({
      timeout: 30000,
      drainTimeout: 5000,
    });
  }
  return instance;
}

// ============================================================================
// FASTIFY PLUGIN
// ============================================================================

export function gracefulShutdownPlugin(app: any, options: { manager: GracefulShutdownManager }): void {
  const { manager } = options;

  // Health check that respects shutdown
  app.get('/healthz', async (req: any, reply: any) => {
    if (manager.isTerminating()) {
      reply.code(503);
      return { status: 'draining', phase: manager.getPhase() };
    }
    return { status: 'ok', phase: manager.getPhase() };
  });

  // Reject new requests during drain
  app.addHook('onRequest', async (request: any, reply: any) => {
    if (manager.isTerminating() && request.url !== '/healthz') {
      reply.code(503);
      throw new Error('Service is shutting down');
    }
  });
}
