/**
 * Alert System Health Checks
 *
 * Health check endpoints for monitoring alert system components:
 * - Redis connection
 * - BullMQ queue status
 * - Alert delivery success rates
 * - Worker status
 */

import type { FastifyInstance } from 'fastify';
import { Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { getQueueStats } from '../../jobs/alert-monitoring.cron';

const prisma = new PrismaClient();

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
};

export async function alertSystemHealthRoutes(fastify: FastifyInstance) {
  /**
   * GET /health/alert-system
   * Overall alert system health
   */
  fastify.get('/health/alert-system', async (request, reply) => {
    try {
      const checks = await Promise.allSettled([
        checkRedisConnection(),
        checkQueueHealth(),
        checkAlertDeliveryRates(),
        checkRecentAlerts()
      ]);

      const results = {
        redis: checks[0].status === 'fulfilled' ? checks[0].value : { healthy: false, error: (checks[0] as any).reason.message },
        queue: checks[1].status === 'fulfilled' ? checks[1].value : { healthy: false, error: (checks[1] as any).reason.message },
        delivery: checks[2].status === 'fulfilled' ? checks[2].value : { healthy: false, error: (checks[2] as any).reason.message },
        recentAlerts: checks[3].status === 'fulfilled' ? checks[3].value : { healthy: false, error: (checks[3] as any).reason.message }
      };

      const overallHealthy =
        results.redis.healthy &&
        results.queue.healthy &&
        results.delivery.healthy &&
        results.recentAlerts.healthy;

      return reply.code(overallHealthy ? 200 : 503).send({
        status: overallHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: results
      });
    } catch (error) {
      console.error('Health check error:', error);
      return reply.code(503).send({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /health/alert-system/redis
   * Check Redis connection
   */
  fastify.get('/health/alert-system/redis', async (request, reply) => {
    try {
      const result = await checkRedisConnection();
      return reply.code(result.healthy ? 200 : 503).send(result);
    } catch (error) {
      return reply.code(503).send({
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /health/alert-system/queue
   * Check BullMQ queue status
   */
  fastify.get('/health/alert-system/queue', async (request, reply) => {
    try {
      const result = await checkQueueHealth();
      return reply.code(result.healthy ? 200 : 503).send(result);
    } catch (error) {
      return reply.code(503).send({
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /health/alert-system/delivery
   * Check alert delivery success rates
   */
  fastify.get('/health/alert-system/delivery', async (request, reply) => {
    try {
      const result = await checkAlertDeliveryRates();
      return reply.code(result.healthy ? 200 : 503).send(result);
    } catch (error) {
      return reply.code(503).send({
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /health/alert-system/stats
   * Get detailed statistics
   */
  fastify.get('/health/alert-system/stats', async (request, reply) => {
    try {
      const [queueStats, alertStats, deliveryStats] = await Promise.all([
        getQueueStats(),
        getAlertStats(),
        getDeliveryChannelStats()
      ]);

      return reply.code(200).send({
        timestamp: new Date().toISOString(),
        queue: queueStats,
        alerts: alertStats,
        delivery: deliveryStats
      });
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Check Redis connection health
 */
async function checkRedisConnection() {
  try {
    const testQueue = new Queue('health-check', { connection: redisConnection });
    await testQueue.getJobCounts();
    await testQueue.close();

    return {
      healthy: true,
      message: 'Redis connection successful',
      host: redisConnection.host,
      port: redisConnection.port
    };
  } catch (error) {
    return {
      healthy: false,
      message: 'Redis connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check BullMQ queue health
 */
async function checkQueueHealth() {
  try {
    const stats = await getQueueStats();

    // Queue is unhealthy if:
    // - Too many failed jobs (>50)
    // - Too many waiting jobs (>100)
    const tooManyFailed = stats.failed > 50;
    const tooManyWaiting = stats.waiting > 100;

    return {
      healthy: !tooManyFailed && !tooManyWaiting,
      stats,
      warnings: [
        tooManyFailed && `High failure rate: ${stats.failed} failed jobs`,
        tooManyWaiting && `Queue backlog: ${stats.waiting} waiting jobs`
      ].filter(Boolean)
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check alert delivery success rates
 */
async function checkAlertDeliveryRates() {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [total, delivered, failed] = await Promise.all([
      prisma.masterAlert.count({
        where: { createdAt: { gte: last24h } }
      }),
      prisma.masterAlert.count({
        where: {
          createdAt: { gte: last24h },
          deliveredAt: { not: null }
        }
      }),
      prisma.masterAlert.count({
        where: {
          createdAt: { gte: last24h },
          failedAt: { not: null }
        }
      })
    ]);

    const deliveryRate = total > 0 ? (delivered / total) * 100 : 100;
    const failureRate = total > 0 ? (failed / total) * 100 : 0;

    // Unhealthy if delivery rate < 90% or failure rate > 10%
    const healthy = deliveryRate >= 90 && failureRate <= 10;

    return {
      healthy,
      period: 'last 24 hours',
      total,
      delivered,
      failed,
      deliveryRate: Math.round(deliveryRate),
      failureRate: Math.round(failureRate),
      warnings: [
        deliveryRate < 90 && `Low delivery rate: ${Math.round(deliveryRate)}%`,
        failureRate > 10 && `High failure rate: ${Math.round(failureRate)}%`
      ].filter(Boolean)
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check recent alert activity
 */
async function checkRecentAlerts() {
  try {
    const last1h = new Date(Date.now() - 60 * 60 * 1000);

    const recentCount = await prisma.masterAlert.count({
      where: { createdAt: { gte: last1h } }
    });

    // System is healthy if there's some activity or if there legitimately aren't any alerts
    return {
      healthy: true,
      recentAlerts: recentCount,
      period: 'last hour',
      message: recentCount > 0 ? 'System active' : 'No recent alerts (normal if no triggers)'
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get detailed alert statistics
 */
async function getAlertStats() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    total,
    byPriority,
    byType,
    withReplies,
    requiresAction
  ] = await Promise.all([
    prisma.masterAlert.count({ where: { createdAt: { gte: last24h } } }),
    prisma.masterAlert.groupBy({
      by: ['priority'],
      where: { createdAt: { gte: last24h } },
      _count: true
    }),
    prisma.masterAlert.groupBy({
      by: ['alertType'],
      where: { createdAt: { gte: last24h } },
      _count: true
    }),
    prisma.masterAlert.count({
      where: {
        createdAt: { gte: last24h },
        repliedAt: { not: null }
      }
    }),
    prisma.masterAlert.count({
      where: {
        createdAt: { gte: last24h },
        repliedAt: { not: null },
        acknowledgedAt: null
      }
    })
  ]);

  return {
    total,
    byPriority: Object.fromEntries(byPriority.map(p => [p.priority, p._count])),
    byType: Object.fromEntries(byType.map(t => [t.alertType, t._count])),
    withReplies,
    requiresAction,
    replyRate: total > 0 ? Math.round((withReplies / total) * 100) : 0
  };
}

/**
 * Get delivery channel statistics
 */
async function getDeliveryChannelStats() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const alerts = await prisma.masterAlert.findMany({
    where: { createdAt: { gte: last24h } },
    select: {
      channels: true,
      deliveredAt: true,
      failedAt: true
    }
  });

  const channelStats: Record<string, { sent: number; delivered: number; failed: number }> = {};

  for (const alert of alerts) {
    const channels = alert.channels as string[];
    for (const channel of channels) {
      if (!channelStats[channel]) {
        channelStats[channel] = { sent: 0, delivered: 0, failed: 0 };
      }
      channelStats[channel].sent++;
      if (alert.deliveredAt) channelStats[channel].delivered++;
      if (alert.failedAt) channelStats[channel].failed++;
    }
  }

  return channelStats;
}
