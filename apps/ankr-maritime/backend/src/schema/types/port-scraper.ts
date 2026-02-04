/**
 * Port Tariff Scraper GraphQL Schema
 * USP Feature: Automated port tariff data collection
 */

import { builder } from '../builder.js';
import { portTariffScraperService } from '../../services/port-tariff-scraper.js';

// ========================================
// OBJECT TYPES
// ========================================

const ScrapingProgress = builder.objectRef<{
  totalPorts: number;
  scrapedPorts: number;
  failedPorts: number;
  pendingPorts: number;
  percentComplete: number;
  estimatedDaysRemaining: number;
}>('ScrapingProgress').implement({
  fields: (t) => ({
    totalPorts: t.exposeInt('totalPorts'),
    scrapedPorts: t.exposeInt('scrapedPorts'),
    failedPorts: t.exposeInt('failedPorts'),
    pendingPorts: t.exposeInt('pendingPorts'),
    percentComplete: t.exposeFloat('percentComplete'),
    estimatedDaysRemaining: t.exposeInt('estimatedDaysRemaining'),
  }),
});

const ScrapingSchedule = builder.objectRef<{
  dailyTarget: number;
  currentBatch: any[];
  nextScheduled: Date;
  progress: any;
}>('ScrapingSchedule').implement({
  fields: (t) => ({
    dailyTarget: t.exposeInt('dailyTarget'),
    currentBatch: t.field({ type: 'JSON', resolve: (p) => p.currentBatch }),
    nextScheduled: t.expose('nextScheduled', { type: 'DateTime' }),
    progress: t.field({ type: ScrapingProgress, resolve: (p) => p.progress }),
  }),
});

const BatchResult = builder.objectRef<{
  jobsCompleted: number;
  jobsFailed: number;
  totalTariffsExtracted: number;
  nextBatchAt: Date;
}>('BatchResult').implement({
  fields: (t) => ({
    jobsCompleted: t.exposeInt('jobsCompleted'),
    jobsFailed: t.exposeInt('jobsFailed'),
    totalTariffsExtracted: t.exposeInt('totalTariffsExtracted'),
    nextBatchAt: t.expose('nextBatchAt', { type: 'DateTime' }),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  scrapingProgress: t.field({
    type: ScrapingProgress,
    resolve: async () => {
      return await portTariffScraperService.getProgress();
    },
  }),

  scrapingSchedule: t.field({
    type: ScrapingSchedule,
    args: {
      dailyTarget: t.arg.int({ defaultValue: 10 }),
    },
    resolve: async (root, args) => {
      return await portTariffScraperService.createSchedule(args.dailyTarget);
    },
  }),

  portSources: t.field({
    type: 'JSON',
    resolve: async () => {
      return await portTariffScraperService.exportConfiguration();
    },
  }),
}));

// ========================================
// MUTATIONS
// ========================================

builder.mutationFields((t) => ({
  runScrapingBatch: t.field({
    type: BatchResult,
    authScopes: { admin: true },
    resolve: async () => {
      return await portTariffScraperService.runDailyBatch();
    },
  }),

  markPortManual: t.field({
    type: 'Boolean',
    authScopes: { admin: true },
    args: {
      portId: t.arg.string({ required: true }),
      reason: t.arg.string({ required: true }),
    },
    resolve: async (root, args) => {
      await portTariffScraperService.markManual(args.portId, args.reason);
      return true;
    },
  }),
}));
