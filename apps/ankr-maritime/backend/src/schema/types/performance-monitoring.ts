/**
 * Performance Monitoring GraphQL Schema
 * Phase 33: Task #71 - Performance Monitoring Dashboard
 */

import { builder } from '../builder.js';
import { performanceMonitor } from '../../services/performance-monitor.js';

// Object Types
const CacheStats = builder.objectRef<{
  hitRate: number;
  totalKeys: number;
  memoryUsed: string;
}>('CacheStats');

CacheStats.implement({
  fields: (t) => ({
    hitRate: t.exposeFloat('hitRate'),
    totalKeys: t.exposeInt('totalKeys'),
    memoryUsed: t.exposeString('memoryUsed'),
  }),
});

const QueryStats = builder.objectRef<{
  avgQueryTime: number;
  slowQueries: number;
  totalQueries: number;
}>('QueryStats');

QueryStats.implement({
  fields: (t) => ({
    avgQueryTime: t.exposeFloat('avgQueryTime'),
    slowQueries: t.exposeInt('slowQueries'),
    totalQueries: t.exposeInt('totalQueries'),
  }),
});

const StorageStats = builder.objectRef<{
  totalDocuments: number;
  totalSize: number;
  averageFileSize: number;
}>('StorageStats');

StorageStats.implement({
  fields: (t) => ({
    totalDocuments: t.exposeInt('totalDocuments'),
    totalSize: t.exposeInt('totalSize'),
    averageFileSize: t.exposeFloat('averageFileSize'),
  }),
});

const UserActivity = builder.objectRef<{
  activeUsers24h: number;
  documentsUploaded24h: number;
  documentsDownloaded24h: number;
  searchQueries24h: number;
}>('UserActivity');

UserActivity.implement({
  fields: (t) => ({
    activeUsers24h: t.exposeInt('activeUsers24h'),
    documentsUploaded24h: t.exposeInt('documentsUploaded24h'),
    documentsDownloaded24h: t.exposeInt('documentsDownloaded24h'),
    searchQueries24h: t.exposeInt('searchQueries24h'),
  }),
});

const SystemHealth = builder.objectRef<{
  databaseStatus: string;
  cacheStatus: string;
  storageStatus: string;
}>('SystemHealth');

SystemHealth.implement({
  fields: (t) => ({
    databaseStatus: t.exposeString('databaseStatus'),
    cacheStatus: t.exposeString('cacheStatus'),
    storageStatus: t.exposeString('storageStatus'),
  }),
});

const PerformanceSummary = builder.objectRef<{
  cacheStats: { hitRate: number; totalKeys: number; memoryUsed: string };
  queryStats: { avgQueryTime: number; slowQueries: number; totalQueries: number };
  storageStats: { totalDocuments: number; totalSize: number; averageFileSize: number };
  userActivity: {
    activeUsers24h: number;
    documentsUploaded24h: number;
    documentsDownloaded24h: number;
    searchQueries24h: number;
  };
  systemHealth: { databaseStatus: string; cacheStatus: string; storageStatus: string };
}>('PerformanceSummary');

PerformanceSummary.implement({
  fields: (t) => ({
    cacheStats: t.field({ type: CacheStats, resolve: (parent) => parent.cacheStats }),
    queryStats: t.field({ type: QueryStats, resolve: (parent) => parent.queryStats }),
    storageStats: t.field({ type: StorageStats, resolve: (parent) => parent.storageStats }),
    userActivity: t.field({ type: UserActivity, resolve: (parent) => parent.userActivity }),
    systemHealth: t.field({ type: SystemHealth, resolve: (parent) => parent.systemHealth }),
  }),
});

const QueryPerformanceByType = builder.objectRef<{
  queryType: string;
  avgDuration: number;
  count: number;
  cacheHitRate: number;
}>('QueryPerformanceByType');

QueryPerformanceByType.implement({
  fields: (t) => ({
    queryType: t.exposeString('queryType'),
    avgDuration: t.exposeFloat('avgDuration'),
    count: t.exposeInt('count'),
    cacheHitRate: t.exposeFloat('cacheHitRate'),
  }),
});

const QueryPerformanceOverTime = builder.objectRef<{
  hour: string;
  avgDuration: number;
  count: number;
}>('QueryPerformanceOverTime');

QueryPerformanceOverTime.implement({
  fields: (t) => ({
    hour: t.exposeString('hour'),
    avgDuration: t.exposeFloat('avgDuration'),
    count: t.exposeInt('count'),
  }),
});

const QueryPerformanceBreakdown = builder.objectRef<{
  byType: Array<{ queryType: string; avgDuration: number; count: number; cacheHitRate: number }>;
  overTime: Array<{ hour: string; avgDuration: number; count: number }>;
}>('QueryPerformanceBreakdown');

QueryPerformanceBreakdown.implement({
  fields: (t) => ({
    byType: t.field({
      type: [QueryPerformanceByType],
      resolve: (parent) => parent.byType,
    }),
    overTime: t.field({
      type: [QueryPerformanceOverTime],
      resolve: (parent) => parent.overTime,
    }),
  }),
});

const SlowQuery = builder.objectRef<{
  queryType: string;
  duration: number;
  recordsReturned: number;
  usedCache: boolean;
  timestamp: Date;
}>('SlowQuery');

SlowQuery.implement({
  fields: (t) => ({
    queryType: t.exposeString('queryType'),
    duration: t.exposeFloat('duration'),
    recordsReturned: t.exposeInt('recordsReturned'),
    usedCache: t.exposeBoolean('usedCache'),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
  }),
});

const CacheHitRateOverTime = builder.objectRef<{
  hour: string;
  hitRate: number;
  hits: number;
  misses: number;
}>('CacheHitRateOverTime');

CacheHitRateOverTime.implement({
  fields: (t) => ({
    hour: t.exposeString('hour'),
    hitRate: t.exposeFloat('hitRate'),
    hits: t.exposeInt('hits'),
    misses: t.exposeInt('misses'),
  }),
});

// Queries
builder.queryFields((t) => ({
  /**
   * Get overall performance summary
   */
  performanceSummary: t.field({
    type: PerformanceSummary,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const summary = await performanceMonitor.getPerformanceSummary(ctx.user.organizationId);
      return summary;
    },
  }),

  /**
   * Get query performance breakdown
   */
  queryPerformanceBreakdown: t.field({
    type: QueryPerformanceBreakdown,
    args: {
      hours: t.arg.int({ defaultValue: 24 }),
    },
    resolve: (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const breakdown = performanceMonitor.getQueryPerformanceBreakdown(args.hours);
      return breakdown;
    },
  }),

  /**
   * Get slowest queries
   */
  slowestQueries: t.field({
    type: [SlowQuery],
    args: {
      limit: t.arg.int({ defaultValue: 10 }),
    },
    resolve: (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const slowQueries = performanceMonitor.getSlowestQueries(args.limit);
      return slowQueries;
    },
  }),

  /**
   * Get cache hit rate over time
   */
  cacheHitRateOverTime: t.field({
    type: [CacheHitRateOverTime],
    args: {
      hours: t.arg.int({ defaultValue: 24 }),
    },
    resolve: (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const hitRates = performanceMonitor.getCacheHitRateOverTime(args.hours);
      return hitRates;
    },
  }),
}));

// Mutations
builder.mutationFields((t) => ({
  /**
   * Clear all DMS caches
   */
  clearDMSCache: t.boolean({
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');
      if (ctx.user.role !== 'admin') throw new Error('Admin access required');

      const { documentCache } = await import('../../services/document-cache.js');
      await documentCache.clearAllCache();

      return true;
    },
  }),

  /**
   * Reset performance metrics (for testing)
   */
  resetPerformanceMetrics: t.boolean({
    resolve: (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');
      if (ctx.user.role !== 'admin') throw new Error('Admin access required');

      performanceMonitor.reset();

      return true;
    },
  }),
}));
