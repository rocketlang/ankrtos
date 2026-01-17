/**
 * @ankr/resilience - Graceful Shutdown
 *
 * Handles graceful shutdown of applications by allowing in-flight requests
 * to complete and cleaning up resources properly.
 *
 * @example
 * ```typescript
 * const shutdown = new GracefulShutdown({ timeout: 30000 });
 *
 * shutdown.register('database', async () => {
 *   await db.close();
 * });
 *
 * shutdown.register('server', async () => {
 *   await server.close();
 * });
 *
 * shutdown.listen(); // Listens for SIGTERM, SIGINT
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cleanup handler function
 */
export type CleanupHandler = () => Promise<void> | void;

/**
 * Graceful shutdown configuration
 */
export interface GracefulShutdownConfig {
  /** Maximum time to wait for cleanup in milliseconds (default: 30000) */
  timeout?: number;
  /** Signals to listen for (default: ['SIGTERM', 'SIGINT']) */
  signals?: NodeJS.Signals[];
  /** Whether to exit process after shutdown (default: true) */
  exitOnComplete?: boolean;
  /** Exit code on success (default: 0) */
  exitCodeSuccess?: number;
  /** Exit code on timeout/failure (default: 1) */
  exitCodeFailure?: number;
  /** Callback when shutdown starts */
  onShutdownStart?: () => void;
  /** Callback when shutdown completes */
  onShutdownComplete?: (results: ShutdownResult[]) => void;
  /** Callback on cleanup error */
  onCleanupError?: (name: string, error: Error) => void;
  /** Logger function */
  logger?: (message: string) => void;
}

/**
 * Result of a single cleanup handler
 */
export interface ShutdownResult {
  name: string;
  success: boolean;
  duration: number;
  error?: Error;
}

/**
 * Shutdown state
 */
export type ShutdownState = 'RUNNING' | 'SHUTTING_DOWN' | 'COMPLETED';

// ═══════════════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: Required<Omit<GracefulShutdownConfig, 'onShutdownStart' | 'onShutdownComplete' | 'onCleanupError' | 'logger'>> = {
  timeout: 30000,
  signals: ['SIGTERM', 'SIGINT'],
  exitOnComplete: true,
  exitCodeSuccess: 0,
  exitCodeFailure: 1,
};

/**
 * Graceful Shutdown Manager
 *
 * Coordinates graceful shutdown of application components by:
 * 1. Listening for shutdown signals
 * 2. Running cleanup handlers in order (later registered = higher priority)
 * 3. Enforcing timeout on cleanup operations
 * 4. Optionally exiting the process
 */
export class GracefulShutdown {
  private handlers: Map<string, { handler: CleanupHandler; priority: number }> = new Map();
  private state: ShutdownState = 'RUNNING';
  private shutdownPromise?: Promise<ShutdownResult[]>;
  private priorityCounter = 0;

  private readonly config: Required<Omit<GracefulShutdownConfig, 'onShutdownStart' | 'onShutdownComplete' | 'onCleanupError' | 'logger'>> & GracefulShutdownConfig;

  constructor(config?: GracefulShutdownConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current shutdown state
   */
  getState(): ShutdownState {
    return this.state;
  }

  /**
   * Check if shutdown is in progress
   */
  isShuttingDown(): boolean {
    return this.state !== 'RUNNING';
  }

  /**
   * Register a cleanup handler
   *
   * @param name - Unique name for this handler
   * @param handler - Async function to run during shutdown
   * @param priority - Higher priority handlers run first (default: auto-increment)
   */
  register(name: string, handler: CleanupHandler, priority?: number): void {
    if (this.state !== 'RUNNING') {
      this.log(`Warning: Registering handler '${name}' during shutdown`);
    }

    this.handlers.set(name, {
      handler,
      priority: priority ?? ++this.priorityCounter,
    });

    this.log(`Registered shutdown handler: ${name} (priority: ${priority ?? this.priorityCounter})`);
  }

  /**
   * Unregister a cleanup handler
   */
  unregister(name: string): boolean {
    const removed = this.handlers.delete(name);
    if (removed) {
      this.log(`Unregistered shutdown handler: ${name}`);
    }
    return removed;
  }

  /**
   * Start listening for shutdown signals
   */
  listen(): void {
    for (const signal of this.config.signals) {
      process.on(signal, () => {
        this.log(`Received ${signal} signal`);
        this.shutdown();
      });
    }

    this.log(`Listening for shutdown signals: ${this.config.signals.join(', ')}`);
  }

  /**
   * Stop listening for shutdown signals
   */
  stopListening(): void {
    for (const signal of this.config.signals) {
      process.removeAllListeners(signal);
    }
  }

  /**
   * Trigger graceful shutdown
   *
   * @returns Promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<ShutdownResult[]> {
    // If already shutting down, return existing promise
    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }

    this.state = 'SHUTTING_DOWN';
    this.config.onShutdownStart?.();
    this.log('Starting graceful shutdown...');

    this.shutdownPromise = this.executeShutdown();
    const results = await this.shutdownPromise;

    this.state = 'COMPLETED';
    this.config.onShutdownComplete?.(results);

    const failed = results.filter(r => !r.success);
    const exitCode = failed.length > 0
      ? this.config.exitCodeFailure
      : this.config.exitCodeSuccess;

    this.log(`Shutdown complete. ${results.length - failed.length}/${results.length} handlers succeeded.`);

    if (this.config.exitOnComplete) {
      process.exit(exitCode);
    }

    return results;
  }

  /**
   * Execute all shutdown handlers
   */
  private async executeShutdown(): Promise<ShutdownResult[]> {
    const results: ShutdownResult[] = [];

    // Sort handlers by priority (descending - higher priority first)
    const sortedHandlers = Array.from(this.handlers.entries())
      .sort((a, b) => b[1].priority - a[1].priority);

    // Create timeout promise
    const timeoutPromise = new Promise<'timeout'>((resolve) => {
      setTimeout(() => resolve('timeout'), this.config.timeout);
    });

    for (const [name, { handler }] of sortedHandlers) {
      this.log(`Running cleanup: ${name}`);
      const startTime = Date.now();

      try {
        const handlerPromise = Promise.resolve(handler());

        // Race handler against timeout
        const result = await Promise.race([
          handlerPromise.then(() => 'success' as const),
          timeoutPromise,
        ]);

        if (result === 'timeout') {
          throw new Error(`Cleanup timed out after ${this.config.timeout}ms`);
        }

        results.push({
          name,
          success: true,
          duration: Date.now() - startTime,
        });

        this.log(`Cleanup complete: ${name} (${Date.now() - startTime}ms)`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        results.push({
          name,
          success: false,
          duration: Date.now() - startTime,
          error: err,
        });

        this.config.onCleanupError?.(name, err);
        this.log(`Cleanup failed: ${name} - ${err.message}`);
      }
    }

    return results;
  }

  /**
   * Log a message
   */
  private log(message: string): void {
    if (this.config.logger) {
      this.config.logger(`[GracefulShutdown] ${message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

let defaultInstance: GracefulShutdown | undefined;

/**
 * Get or create the default graceful shutdown instance
 */
export function getGracefulShutdown(config?: GracefulShutdownConfig): GracefulShutdown {
  if (!defaultInstance) {
    defaultInstance = new GracefulShutdown(config);
  }
  return defaultInstance;
}

/**
 * Register a cleanup handler with the default instance
 */
export function onShutdown(name: string, handler: CleanupHandler, priority?: number): void {
  getGracefulShutdown().register(name, handler, priority);
}

/**
 * Start listening for shutdown signals with the default instance
 */
export function listenForShutdown(config?: GracefulShutdownConfig): void {
  getGracefulShutdown(config).listen();
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Health check that reports unhealthy during shutdown
 */
export function createShutdownHealthCheck(
  shutdown: GracefulShutdown = getGracefulShutdown()
): () => { healthy: boolean; status: string } {
  return () => ({
    healthy: !shutdown.isShuttingDown(),
    status: shutdown.isShuttingDown() ? 'shutting_down' : 'running',
  });
}
