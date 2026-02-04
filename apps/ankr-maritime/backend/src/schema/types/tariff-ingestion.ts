/**
 * Tariff Ingestion GraphQL Schema - Enhanced
 * Phase 6: DA Desk & Port Agency - Production Implementation
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';
import { tariffIngestionService } from '../../services/tariff-ingestion-service.js';
import { tariffIngestionWorker } from '../../workers/tariff-ingestion-worker.js';
import { tariffUpdateScheduler } from '../../jobs/tariff-update-scheduler.js';

// ========================================
// OBJECT TYPES
// ========================================

const TariffReviewTask = builder.prismaObject('TariffReviewTask', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    port: t.relation('port'),
    extractedData: t.field({
      type: 'JSON',
      resolve: (parent) => parent.extractedData,
    }),
    confidence: t.exposeFloat('confidence'),
    status: t.exposeString('status'),
    issues: t.exposeStringList('issues'),
    sourceUrl: t.exposeString('sourceUrl', { nullable: true }),
    reviewedBy: t.exposeString('reviewedBy', { nullable: true }),
    reviewedAt: t.expose('reviewedAt', { type: 'DateTime', nullable: true }),
    reviewNotes: t.exposeString('reviewNotes', { nullable: true }),
    approvedCount: t.exposeInt('approvedCount'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

const TariffIngestionJob = builder.prismaObject('TariffIngestionJob', {
  fields: (t) => ({
    id: t.exposeID('id'),
    jobType: t.exposeString('jobType'),
    status: t.exposeString('status'),
    priority: t.exposeInt('priority'),
    portIds: t.exposeStringList('portIds'),
    options: t.field({
      type: 'JSON',
      nullable: true,
      resolve: (parent) => parent.options,
    }),
    totalPorts: t.exposeInt('totalPorts'),
    processedPorts: t.exposeInt('processedPorts'),
    successCount: t.exposeInt('successCount'),
    failureCount: t.exposeInt('failureCount'),
    reviewCount: t.exposeInt('reviewCount'),
    startedAt: t.expose('startedAt', { type: 'DateTime', nullable: true }),
    completedAt: t.expose('completedAt', { type: 'DateTime', nullable: true }),
    estimatedEnd: t.expose('estimatedEnd', { type: 'DateTime', nullable: true }),
    results: t.field({
      type: 'JSON',
      nullable: true,
      resolve: (parent) => parent.results,
    }),
    errorLog: t.exposeString('errorLog', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),

    // Computed fields
    progress: t.int({
      resolve: (parent) => {
        if (parent.totalPorts === 0) return 0;
        return Math.round((parent.processedPorts / parent.totalPorts) * 100);
      },
    }),
    isCompleted: t.boolean({
      resolve: (parent) => parent.status === 'completed',
    }),
    isFailed: t.boolean({
      resolve: (parent) => parent.status === 'failed',
    }),
  }),
});

const IngestionStats = builder.objectRef<{
  total: number;
  realScraped: number;
  simulated: number;
  reviewPending: number;
  coveragePercent: number;
}>('IngestionStats').implement({
  fields: (t) => ({
    total: t.exposeInt('total'),
    realScraped: t.exposeInt('realScraped'),
    simulated: t.exposeInt('simulated'),
    reviewPending: t.exposeInt('reviewPending'),
    coveragePercent: t.exposeFloat('coveragePercent'),
  }),
});

const TariffChanges = builder.objectRef<{
  added: any[];
  modified: any[];
  removed: any[];
  priceChanges: any[];
}>('TariffChanges').implement({
  fields: (t) => ({
    added: t.field({
      type: 'JSON',
      resolve: (parent) => parent.added,
    }),
    modified: t.field({
      type: 'JSON',
      resolve: (parent) => parent.modified,
    }),
    removed: t.field({
      type: 'JSON',
      resolve: (parent) => parent.removed,
    }),
    priceChanges: t.field({
      type: 'JSON',
      resolve: (parent) => parent.priceChanges,
    }),
  }),
});

const ScheduleInfo = builder.objectRef<Record<string, string>>('ScheduleInfo').implement({
  fields: (t) => ({
    daily: t.string({ resolve: (parent) => parent.daily }),
    weekly: t.string({ resolve: (parent) => parent.weekly }),
    monthly: t.string({ resolve: (parent) => parent.monthly }),
    quarterly: t.string({ resolve: (parent) => parent.quarterly }),
  }),
});

// ========================================
// INPUT TYPES
// ========================================

const TariffDocumentInput = builder.inputType('TariffDocumentInput', {
  fields: (t) => ({
    url: t.string({ required: true }),
    portId: t.string({ required: true }),
    effectiveFrom: t.field({ type: 'DateTime', required: false }),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  // Get tariffs needing review
  tariffsNeedingReview: t.field({
    type: [TariffReviewTask],
    authScopes: { operator: true },
    args: {
      limit: t.arg.int({ defaultValue: 10 }),
    },
    resolve: async (root, args) => {
      return tariffIngestionService.getTariffsNeedingReview(args.limit);
    },
  }),

  // Get ingestion job status
  ingestionJobStatus: t.field({
    type: TariffIngestionJob,
    authScopes: { operator: true },
    args: {
      jobId: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      const job = await prisma.tariffIngestionJob.findUnique({
        where: { id: args.jobId },
      });

      if (!job) {
        throw new Error('Job not found');
      }

      return job;
    },
  }),

  // Get ingestion statistics
  ingestionStats: t.field({
    type: IngestionStats,
    authScopes: { operator: true },
    args: {
      portId: t.arg.string({ required: false }),
    },
    resolve: async (root, args) => {
      return tariffIngestionService.getIngestionStats(args.portId || undefined);
    },
  }),

  // Detect tariff changes
  detectTariffUpdates: t.field({
    type: TariffChanges,
    authScopes: { operator: true },
    args: {
      portId: t.arg.string({ required: true }),
      newDocument: t.arg({ type: TariffDocumentInput, required: true }),
    },
    resolve: async (root, args) => {
      return tariffIngestionService.detectTariffChanges(
        args.portId,
        args.newDocument as any
      );
    },
  }),

  // Get update schedule
  tariffUpdateSchedule: t.field({
    type: ScheduleInfo,
    authScopes: { operator: true },
    resolve: () => {
      return tariffUpdateScheduler.getSchedule();
    },
  }),

  // Get recent ingestion jobs
  recentIngestionJobs: t.field({
    type: [TariffIngestionJob],
    authScopes: { operator: true },
    args: {
      limit: t.arg.int({ defaultValue: 10 }),
      status: t.arg.string({ required: false }),
    },
    resolve: async (root, args) => {
      return prisma.tariffIngestionJob.findMany({
        where: args.status ? { status: args.status } : undefined,
        orderBy: { createdAt: 'desc' },
        take: args.limit,
      });
    },
  }),
}));

// ========================================
// MUTATIONS
// ========================================

builder.mutationFields((t) => ({
  // Queue bulk ingestion
  queueBulkIngestion: t.field({
    type: TariffIngestionJob,
    authScopes: { manager: true },
    args: {
      portIds: t.arg.stringList({ required: true }),
      priority: t.arg.int({ defaultValue: 5 }),
      forceRefresh: t.arg.boolean({ defaultValue: false }),
      detectChanges: t.arg.boolean({ defaultValue: false }),
    },
    resolve: async (root, args) => {
      const jobId = await tariffIngestionWorker.queueJob({
        jobType: args.detectChanges ? 'update_detection' : 'bulk_ports',
        portIds: args.portIds,
        options: {
          priority: args.priority,
          forceRefresh: args.forceRefresh,
          detectChanges: args.detectChanges,
        },
      });

      const job = await prisma.tariffIngestionJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new Error('Failed to create job');
      }

      return job;
    },
  }),

  // Ingest single port
  ingestPortTariffs: t.field({
    type: 'JSON',
    authScopes: { operator: true },
    args: {
      document: t.arg({ type: TariffDocumentInput, required: true }),
    },
    resolve: async (root, args) => {
      return tariffIngestionService.ingestFromUrl(args.document as any);
    },
  }),

  // Approve tariff from review queue
  approveTariffFromReview: t.field({
    type: 'Int',
    authScopes: { manager: true },
    args: {
      reviewTaskId: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      return tariffIngestionService.approveFromReview(args.reviewTaskId);
    },
  }),

  // Reject tariff review task
  rejectTariffReview: t.field({
    type: TariffReviewTask,
    authScopes: { manager: true },
    args: {
      reviewTaskId: t.arg.string({ required: true }),
      reason: t.arg.string({ required: false }),
    },
    resolve: async (root, args) => {
      const updated = await prisma.tariffReviewTask.update({
        where: { id: args.reviewTaskId },
        data: {
          status: 'rejected',
          reviewedAt: new Date(),
          reviewNotes: args.reason || undefined,
        },
      });

      return updated;
    },
  }),

  // Apply tariff changes
  applyTariffChanges: t.field({
    type: 'Boolean',
    authScopes: { manager: true },
    args: {
      portId: t.arg.string({ required: true }),
      changes: t.arg({ type: 'JSON', required: true }),
      document: t.arg({ type: TariffDocumentInput, required: true }),
    },
    resolve: async (root, args) => {
      await tariffIngestionService.applyTariffChanges(
        args.portId,
        args.changes as any,
        args.document as any
      );
      return true;
    },
  }),

  // Cancel ingestion job
  cancelIngestionJob: t.field({
    type: 'Boolean',
    authScopes: { manager: true },
    args: {
      jobId: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      await tariffIngestionWorker.cancelJob(args.jobId);
      return true;
    },
  }),

  // Manual trigger scheduled update
  triggerScheduledUpdate: t.field({
    type: 'Boolean',
    authScopes: { admin: true },
    args: {
      type: t.arg.string({ required: true }), // daily, weekly, monthly, quarterly
    },
    resolve: async (root, args) => {
      const type = args.type as 'daily' | 'weekly' | 'monthly' | 'quarterly';
      await tariffUpdateScheduler.manualTrigger(type);
      return true;
    },
  }),
}));
