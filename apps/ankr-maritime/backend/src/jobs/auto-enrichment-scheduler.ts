/**
 * Auto-Enrichment Scheduler
 *
 * Daily cron jobs for automatic vessel enrichment:
 * 1. 3am daily: Enrich top 100 active vessels from AIS
 * 2. On-demand: Parse emails and trigger enrichment
 * 3. On-demand: Enrich vessels from user queries
 */

import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { aisEnrichmentTrigger } from '../workers/ais-enrichment-trigger.js';
import { autoEnrichmentService } from '../services/auto-enrichment.service.js';

export function getAutoEnrichmentScheduler() {
  const tasks: cron.ScheduledTask[] = [];

  /**
   * Daily 3am: Enrich top 100 vessels by AIS activity
   */
  const dailyAISEnrichment = cron.schedule(
    '0 3 * * *', // 3am every day
    async () => {
      try {
        logger.info('🤖 [Auto-Enrichment] Starting daily AIS enrichment...');

        const stats = await aisEnrichmentTrigger.enrichRecentlyActiveVessels();

        logger.info(
          `✅ [Auto-Enrichment] Daily AIS enrichment complete: ${stats.enrichmentTriggered} vessels queued, ${stats.alreadyEnriched} already enriched`
        );
      } catch (error: any) {
        logger.error(`❌ [Auto-Enrichment] Daily AIS enrichment failed: ${error.message}`);
      }
    },
    {
      scheduled: false,
      timezone: 'UTC',
    }
  );

  tasks.push(dailyAISEnrichment);

  /**
   * Every 6 hours: Enrich top active vessels (smaller batch)
   */
  const sixHourlyEnrichment = cron.schedule(
    '0 */6 * * *', // Every 6 hours
    async () => {
      try {
        logger.info('🤖 [Auto-Enrichment] Starting 6-hourly enrichment...');

        await autoEnrichmentService.enrichTopActiveVessels(50); // Top 50 only

        logger.info('✅ [Auto-Enrichment] 6-hourly enrichment complete');
      } catch (error: any) {
        logger.error(`❌ [Auto-Enrichment] 6-hourly enrichment failed: ${error.message}`);
      }
    },
    {
      scheduled: false,
      timezone: 'UTC',
    }
  );

  tasks.push(sixHourlyEnrichment);

  /**
   * Every hour: Log queue status
   */
  const hourlyQueueStatus = cron.schedule(
    '0 * * * *', // Every hour
    async () => {
      try {
        const status = autoEnrichmentService.getQueueStatus();

        if (status.queueLength > 0 || status.processing) {
          logger.info(
            `📊 [Auto-Enrichment] Queue status: ${status.queueLength} vessels queued, processing: ${status.processing}`
          );
        }
      } catch (error: any) {
        logger.error(`❌ [Auto-Enrichment] Queue status check failed: ${error.message}`);
      }
    },
    {
      scheduled: false,
      timezone: 'UTC',
    }
  );

  tasks.push(hourlyQueueStatus);

  return {
    start: () => {
      logger.info('Starting auto-enrichment scheduler...');
      tasks.forEach(task => task.start());
      logger.info('✅ Auto-enrichment scheduler started:');
      logger.info('  - Daily 3am: Top 100 active vessels');
      logger.info('  - Every 6 hours: Top 50 active vessels');
      logger.info('  - Hourly: Queue status logging');
    },
    stop: () => {
      logger.info('Stopping auto-enrichment scheduler...');
      tasks.forEach(task => task.stop());
    },
  };
}
