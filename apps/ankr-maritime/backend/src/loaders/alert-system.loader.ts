/**
 * Alert System Loader
 *
 * Initializes and manages all alert system background processes:
 * - BullMQ workers
 * - Cron jobs
 * - Health monitoring
 * - Graceful shutdown
 */

import { Worker } from 'bullmq';
import { createAlertMonitorWorker, shutdownAlertMonitorWorker } from '../workers/alert-monitor.worker';
import { scheduleAlertMonitoring, shutdownAlertMonitoring } from '../jobs/alert-monitoring.cron';

interface AlertSystemComponents {
  worker: Worker | null;
  queue: any;
}

const components: AlertSystemComponents = {
  worker: null,
  queue: null
};

/**
 * Initialize alert system
 */
export async function initializeAlertSystem() {
  console.log('===========================================');
  console.log('  Mari8X Alert System - Initialization');
  console.log('===========================================');

  try {
    // Check if alert system is enabled
    const alertSystemEnabled = process.env.ALERT_SYSTEM_ENABLED !== 'false';

    if (!alertSystemEnabled) {
      console.log('[AlertSystem] Alert system is disabled via environment variable');
      console.log('[AlertSystem] Set ALERT_SYSTEM_ENABLED=true to enable');
      return components;
    }

    // Check Redis configuration
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = process.env.REDIS_PORT || '6379';

    console.log(`[AlertSystem] Redis connection: ${redisHost}:${redisPort}`);

    // Initialize BullMQ worker
    console.log('[AlertSystem] Starting BullMQ worker...');
    components.worker = createAlertMonitorWorker();
    console.log('[AlertSystem] ✓ BullMQ worker started');

    // Schedule cron jobs
    console.log('[AlertSystem] Scheduling cron jobs...');
    components.queue = scheduleAlertMonitoring();
    console.log('[AlertSystem] ✓ Cron jobs scheduled');

    // Setup graceful shutdown
    setupGracefulShutdown();
    console.log('[AlertSystem] ✓ Graceful shutdown handlers registered');

    console.log('===========================================');
    console.log('  Alert System Initialized Successfully');
    console.log('===========================================');
    console.log('');
    console.log('Active Components:');
    console.log('  • BullMQ Worker (alert-monitoring queue)');
    console.log('  • Proximity Monitor (every 5 min)');
    console.log('  • Document Monitor (every 15 min)');
    console.log('  • Deadline Monitor (every 10 min)');
    console.log('  • Congestion Monitor (every 30 min)');
    console.log('  • ETA Change Monitor (every 20 min)');
    console.log('  • DA Anomaly Monitor (every hour)');
    console.log('');
    console.log('Health Endpoints:');
    console.log('  • GET /health/alert-system');
    console.log('  • GET /health/alert-system/redis');
    console.log('  • GET /health/alert-system/queue');
    console.log('  • GET /health/alert-system/delivery');
    console.log('  • GET /health/alert-system/stats');
    console.log('===========================================');

    return components;
  } catch (error) {
    console.error('[AlertSystem] ❌ Failed to initialize alert system:', error);
    console.error('[AlertSystem] Alert monitoring will not be active');
    console.error('[AlertSystem] Manual alerts via GraphQL API will still work');

    // Return empty components on failure
    return components;
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    console.log('');
    console.log(`[AlertSystem] Received ${signal}, initiating graceful shutdown...`);

    try {
      // Shutdown worker
      if (components.worker) {
        console.log('[AlertSystem] Shutting down BullMQ worker...');
        await shutdownAlertMonitorWorker(components.worker);
        console.log('[AlertSystem] ✓ Worker shut down');
      }

      // Shutdown cron jobs and queue
      if (components.queue) {
        console.log('[AlertSystem] Shutting down cron jobs and queue...');
        await shutdownAlertMonitoring();
        console.log('[AlertSystem] ✓ Cron jobs and queue shut down');
      }

      console.log('[AlertSystem] Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('[AlertSystem] Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('[AlertSystem] Uncaught exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[AlertSystem] Unhandled rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
}

/**
 * Get current system status
 */
export function getAlertSystemStatus() {
  return {
    initialized: components.worker !== null,
    workerActive: components.worker !== null,
    queueActive: components.queue !== null,
    components: {
      worker: components.worker ? 'active' : 'inactive',
      queue: components.queue ? 'active' : 'inactive'
    }
  };
}

/**
 * Manually trigger alert monitoring (for testing)
 */
export async function triggerAlertMonitoring(triggerType: string) {
  if (!components.queue) {
    throw new Error('Alert system not initialized');
  }

  console.log(`[AlertSystem] Manually triggering ${triggerType} monitoring...`);

  await components.queue.add(
    `manual-${triggerType}`,
    { triggerType },
    { priority: 1 } // High priority for manual triggers
  );

  console.log(`[AlertSystem] ${triggerType} monitoring job queued`);
}
