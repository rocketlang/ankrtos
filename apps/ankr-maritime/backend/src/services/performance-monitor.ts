/**
 * Performance Monitoring Service
 * Phase 33: Task #71 - Performance Monitoring Dashboard
 *
 * Tracks and reports:
 * - Query performance
 * - Cache hit rates
 * - API response times
 * - Database query times
 * - Storage metrics
 * - User activity patterns
 */

import { prisma } from '../lib/prisma.js';
import { documentCache } from './document-cache.js';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface QueryPerformanceMetric {
  queryType: string;
  duration: number;
  recordsReturned: number;
  usedCache: boolean;
  timestamp: Date;
}

export interface PerformanceSummary {
  cacheStats: {
    hitRate: number;
    totalKeys: number;
    memoryUsed: string;
  };
  queryStats: {
    avgQueryTime: number;
    slowQueries: number;
    totalQueries: number;
  };
  storageStats: {
    totalDocuments: number;
    totalSize: number;
    averageFileSize: number;
  };
  userActivity: {
    activeUsers24h: number;
    documentsUploaded24h: number;
    documentsDownloaded24h: number;
    searchQueries24h: number;
  };
  systemHealth: {
    databaseStatus: 'healthy' | 'degraded' | 'down';
    cacheStatus: 'healthy' | 'degraded' | 'down';
    storageStatus: 'healthy' | 'degraded' | 'down';
  };
}

class PerformanceMonitorService {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private queryMetrics: QueryPerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics per type
  private readonly MAX_QUERY_METRICS = 5000; // Keep last 5000 query metrics

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      metadata,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Keep only last MAX_METRICS
    if (metrics.length > this.MAX_METRICS) {
      metrics.shift();
    }
  }

  /**
   * Record query performance
   */
  recordQuery(
    queryType: string,
    duration: number,
    recordsReturned: number,
    usedCache: boolean
  ): void {
    const metric: QueryPerformanceMetric = {
      queryType,
      duration,
      recordsReturned,
      usedCache,
      timestamp: new Date(),
    };

    this.queryMetrics.push(metric);

    // Keep only last MAX_QUERY_METRICS
    if (this.queryMetrics.length > this.MAX_QUERY_METRICS) {
      this.queryMetrics.shift();
    }
  }

  /**
   * Measure query execution time
   */
  async measureQuery<T>(
    queryType: string,
    queryFn: () => Promise<T>,
    options: { useCache?: boolean } = {}
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      // Determine records returned
      let recordsReturned = 0;
      if (Array.isArray(result)) {
        recordsReturned = result.length;
      } else if (result && typeof result === 'object' && 'items' in result) {
        recordsReturned = (result as any).items.length;
      } else if (result) {
        recordsReturned = 1;
      }

      this.recordQuery(queryType, duration, recordsReturned, options.useCache || false);

      // Log slow queries (>1 second)
      if (duration > 1000) {
        console.warn(`[Performance] Slow query detected: ${queryType} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordQuery(queryType, duration, 0, options.useCache || false);
      throw error;
    }
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(organizationId: string): Promise<PerformanceSummary> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get cache stats
    const cacheStats = await documentCache.getCacheStats();

    // Calculate query stats
    const recentQueries = this.queryMetrics.filter(
      (q) => q.timestamp.getTime() > yesterday.getTime()
    );
    const totalQueries = recentQueries.length;
    const avgQueryTime =
      totalQueries > 0
        ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / totalQueries
        : 0;
    const slowQueries = recentQueries.filter((q) => q.duration > 1000).length;

    // Get storage stats
    const documents = await prisma.document.findMany({
      where: { organizationId, status: 'active' },
      select: { fileSize: true },
    });
    const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
    const averageFileSize = documents.length > 0 ? totalSize / documents.length : 0;

    // Get user activity stats
    const [activeUsersCount, uploadsCount, downloadsCount, searchQueriesCount] =
      await Promise.all([
        // Active users (unique users who performed any action in last 24h)
        prisma.documentAuditLog
          .findMany({
            where: {
              performedAt: { gte: yesterday },
              performedBy: { not: 'system' },
            },
            select: { performedBy: true },
            distinct: ['performedBy'],
          })
          .then((logs) => logs.length),

        // Documents uploaded
        prisma.documentAuditLog.count({
          where: {
            action: 'created',
            performedAt: { gte: yesterday },
          },
        }),

        // Documents downloaded
        prisma.documentAuditLog.count({
          where: {
            action: 'downloaded',
            performedAt: { gte: yesterday },
          },
        }),

        // Search queries
        prisma.searchQuery.count({
          where: {
            organizationId,
            createdAt: { gte: yesterday },
          },
        }),
      ]);

    // Check system health
    const [databaseHealthy, cacheHealthy, storageHealthy] = await Promise.all([
      this.checkDatabaseHealth(),
      documentCache.healthCheck(),
      this.checkStorageHealth(),
    ]);

    return {
      cacheStats: {
        hitRate: cacheStats.hitRate,
        totalKeys: cacheStats.totalKeys,
        memoryUsed: cacheStats.memoryUsed,
      },
      queryStats: {
        avgQueryTime: Math.round(avgQueryTime),
        slowQueries,
        totalQueries,
      },
      storageStats: {
        totalDocuments: documents.length,
        totalSize,
        averageFileSize: Math.round(averageFileSize),
      },
      userActivity: {
        activeUsers24h: activeUsersCount,
        documentsUploaded24h: uploadsCount,
        documentsDownloaded24h: downloadsCount,
        searchQueries24h: searchQueriesCount,
      },
      systemHealth: {
        databaseStatus: databaseHealthy ? 'healthy' : 'down',
        cacheStatus: cacheHealthy ? 'healthy' : 'down',
        storageStatus: storageHealthy ? 'healthy' : 'down',
      },
    };
  }

  /**
   * Get query performance breakdown
   */
  getQueryPerformanceBreakdown(hours = 24): {
    byType: Array<{
      queryType: string;
      avgDuration: number;
      count: number;
      cacheHitRate: number;
    }>;
    overTime: Array<{
      hour: string;
      avgDuration: number;
      count: number;
    }>;
  } {
    const now = new Date();
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const recentQueries = this.queryMetrics.filter((q) => q.timestamp.getTime() > cutoff.getTime());

    // Group by query type
    const byTypeMap = new Map<
      string,
      { totalDuration: number; count: number; cacheHits: number }
    >();

    recentQueries.forEach((q) => {
      if (!byTypeMap.has(q.queryType)) {
        byTypeMap.set(q.queryType, { totalDuration: 0, count: 0, cacheHits: 0 });
      }
      const stats = byTypeMap.get(q.queryType)!;
      stats.totalDuration += q.duration;
      stats.count += 1;
      if (q.usedCache) stats.cacheHits += 1;
    });

    const byType = Array.from(byTypeMap.entries()).map(([queryType, stats]) => ({
      queryType,
      avgDuration: Math.round(stats.totalDuration / stats.count),
      count: stats.count,
      cacheHitRate: Math.round((stats.cacheHits / stats.count) * 100) / 100,
    }));

    // Group by hour
    const byHourMap = new Map<string, { totalDuration: number; count: number }>();

    recentQueries.forEach((q) => {
      const hour = new Date(q.timestamp);
      hour.setMinutes(0, 0, 0);
      const hourKey = hour.toISOString();

      if (!byHourMap.has(hourKey)) {
        byHourMap.set(hourKey, { totalDuration: 0, count: 0 });
      }
      const stats = byHourMap.get(hourKey)!;
      stats.totalDuration += q.duration;
      stats.count += 1;
    });

    const overTime = Array.from(byHourMap.entries())
      .map(([hour, stats]) => ({
        hour,
        avgDuration: Math.round(stats.totalDuration / stats.count),
        count: stats.count,
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    return { byType, overTime };
  }

  /**
   * Get slowest queries
   */
  getSlowestQueries(limit = 10): QueryPerformanceMetric[] {
    return [...this.queryMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get cache hit rate over time
   */
  getCacheHitRateOverTime(hours = 24): Array<{
    hour: string;
    hitRate: number;
    hits: number;
    misses: number;
  }> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const recentQueries = this.queryMetrics.filter((q) => q.timestamp.getTime() > cutoff.getTime());

    // Group by hour
    const byHourMap = new Map<string, { hits: number; misses: number }>();

    recentQueries.forEach((q) => {
      const hour = new Date(q.timestamp);
      hour.setMinutes(0, 0, 0);
      const hourKey = hour.toISOString();

      if (!byHourMap.has(hourKey)) {
        byHourMap.set(hourKey, { hits: 0, misses: 0 });
      }
      const stats = byHourMap.get(hourKey)!;
      if (q.usedCache) {
        stats.hits += 1;
      } else {
        stats.misses += 1;
      }
    });

    return Array.from(byHourMap.entries())
      .map(([hour, stats]) => ({
        hour,
        hitRate:
          stats.hits + stats.misses > 0 ? stats.hits / (stats.hits + stats.misses) : 0,
        hits: stats.hits,
        misses: stats.misses,
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Check storage health
   */
  private async checkStorageHealth(): Promise<boolean> {
    try {
      // Import dynamically to avoid circular dependency
      const { documentStorage } = await import('./document-storage.js');
      return await documentStorage.healthCheck();
    } catch (error) {
      console.error('Storage health check failed:', error);
      return false;
    }
  }

  /**
   * Reset metrics (for testing)
   */
  reset(): void {
    this.metrics.clear();
    this.queryMetrics = [];
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): {
    metrics: Array<{ name: string; values: PerformanceMetric[] }>;
    queries: QueryPerformanceMetric[];
  } {
    return {
      metrics: Array.from(this.metrics.entries()).map(([name, values]) => ({ name, values })),
      queries: [...this.queryMetrics],
    };
  }
}

export const performanceMonitor = new PerformanceMonitorService();
