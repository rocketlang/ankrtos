/**
 * BullMQ Tariff Ingestion Worker
 *
 * Async job processing with retry logic and progress tracking
 */

import { Worker, Job, Queue } from 'bullmq';
import Redis from 'ioredis';
import { tariffIngestionService } from '../services/tariff-ingestion-service.js';
import { prisma } from '../lib/prisma.js';

// Redis client singleton for BullMQ
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: null, // Required for BullMQ
    });
  }
  return redis;
}

export interface TariffIngestionJobData {
  jobType: 'single_port' | 'bulk_ports' | 'update_detection';
  portIds: string[];
  options?: {
    priority?: number;
    forceRefresh?: boolean;
    detectChanges?: boolean;
  };
}

export interface TariffIngestionProgress {
  stage: string;
  current: number;
  total: number;
  percentage: number;
  currentPort?: string;
  message?: string;
}

class TariffIngestionWorker {
  private worker: Worker | null = null;
  private queue: Queue | null = null;
  private readonly QUEUE_NAME = 'tariff-ingestion';

  /**
   * Initialize worker and queue
   */
  async initialize() {
    // Create queue
    this.queue = new Queue(this.QUEUE_NAME, {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 seconds, doubles each retry
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });

    // Create worker
    this.worker = new Worker(
      this.QUEUE_NAME,
      async (job: Job<TariffIngestionJobData>) => {
        return this.processJob(job);
      },
      {
        connection: getRedisClient(),
        concurrency: 5, // Process up to 5 jobs concurrently
        limiter: {
          max: 10, // Max 10 jobs
          duration: 60000, // Per minute (rate limiting)
        },
      }
    );

    // Event handlers
    this.worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} failed:`, err.message);
    });

    this.worker.on('progress', (job, progress: TariffIngestionProgress) => {
      console.log(`📊 Job ${job.id}: ${progress.stage} - ${progress.percentage}%`);
    });

    console.log('Tariff ingestion worker initialized');
  }

  /**
   * Queue a new ingestion job
   */
  async queueJob(data: TariffIngestionJobData): Promise<string> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    // Create job record in database
    const jobRecord = await prisma.tariffIngestionJob.create({
      data: {
        jobType: data.jobType,
        priority: data.options?.priority || 5,
        portIds: data.portIds,
        options: data.options || {},
        totalPorts: data.portIds.length,
        status: 'queued',
      },
    });

    // Queue job in BullMQ
    const job = await this.queue.add(
      data.jobType,
      { ...data, jobRecordId: jobRecord.id },
      {
        priority: data.options?.priority || 5,
        jobId: jobRecord.id,
      }
    );

    return jobRecord.id;
  }

  /**
   * Process ingestion job
   */
  private async processJob(job: Job<TariffIngestionJobData & { jobRecordId: string }>) {
    const { jobType, portIds, options, jobRecordId } = job.data;

    try {
      // Update job status to processing
      await prisma.tariffIngestionJob.update({
        where: { id: jobRecordId },
        data: {
          status: 'processing',
          startedAt: new Date(),
          estimatedEnd: new Date(Date.now() + portIds.length * 60 * 1000), // 1 min per port
        },
      });

      // Update progress: Starting
      await job.updateProgress({
        stage: 'initializing',
        current: 0,
        total: portIds.length,
        percentage: 10,
        message: 'Initializing ingestion process',
      });

      const results: any[] = [];
      let successCount = 0;
      let failureCount = 0;
      let reviewCount = 0;

      // Process each port
      for (let i = 0; i < portIds.length; i++) {
        const portId = portIds[i];

        try {
          // Update progress
          await job.updateProgress({
            stage: 'processing',
            current: i + 1,
            total: portIds.length,
            percentage: 10 + Math.round((i / portIds.length) * 80), // 10% to 90%
            currentPort: portId,
            message: `Processing port ${i + 1}/${portIds.length}`,
          });

          // Get port tariff URL (from database or scraper config)
          const port = await prisma.port.findUnique({ where: { id: portId } });
          if (!port) {
            throw new Error(`Port ${portId} not found`);
          }

          // TODO: Get tariff URL from port scraper config or database
          // For now, skip if no URL available
          const tariffUrl = await this.getPortTariffUrl(portId);
          if (!tariffUrl) {
            results.push({
              portId,
              status: 'skipped',
              reason: 'No tariff URL available',
            });
            continue;
          }

          // Ingest tariffs
          const result = await tariffIngestionService.ingestFromUrl({
            url: tariffUrl,
            portId,
          });

          // Track results
          if (result.importedCount) {
            successCount++;
            results.push({
              portId,
              status: 'success',
              importedCount: result.importedCount,
              confidence: result.confidence,
            });
          } else if (result.reviewTaskId) {
            reviewCount++;
            results.push({
              portId,
              status: 'review',
              reviewTaskId: result.reviewTaskId,
              confidence: result.confidence,
            });
          }

          // Rate limiting: Wait 30 seconds between ports (respectful scraping)
          if (i < portIds.length - 1) {
            await this.sleep(30000);
          }

        } catch (error) {
          failureCount++;
          results.push({
            portId,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          });
          console.error(`Failed to process port ${portId}:`, error);
        }

        // Update database progress
        await prisma.tariffIngestionJob.update({
          where: { id: jobRecordId },
          data: {
            processedPorts: i + 1,
            successCount,
            failureCount,
            reviewCount,
          },
        });
      }

      // Update progress: Finalizing
      await job.updateProgress({
        stage: 'finalizing',
        current: portIds.length,
        total: portIds.length,
        percentage: 95,
        message: 'Finalizing results',
      });

      // Update job record with final results
      await prisma.tariffIngestionJob.update({
        where: { id: jobRecordId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          results,
        },
      });

      // Update progress: Complete
      await job.updateProgress({
        stage: 'completed',
        current: portIds.length,
        total: portIds.length,
        percentage: 100,
        message: `Completed: ${successCount} success, ${failureCount} failed, ${reviewCount} review`,
      });

      return {
        success: true,
        totalPorts: portIds.length,
        successCount,
        failureCount,
        reviewCount,
        results,
      };

    } catch (error) {
      // Update job status to failed
      await prisma.tariffIngestionJob.update({
        where: { id: jobRecordId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorLog: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Get tariff URL for port (from scraper config or database)
   */
  private async getPortTariffUrl(portId: string): Promise<string | null> {
    // TODO: Implement port tariff URL lookup
    // This should query port scraper configuration or stored URLs
    // For now, return null (will be implemented when port scraper is integrated)

    // Example implementation:
    // const config = await prisma.portScraperConfig.findFirst({
    //   where: { portId, documentType: 'tariff_schedule' }
    // });
    // return config?.url || null;

    return null;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string) {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    const state = await job.getState();
    const progress = job.progress as TariffIngestionProgress | undefined;

    // Also get database record
    const dbRecord = await prisma.tariffIngestionJob.findUnique({
      where: { id: jobId },
    });

    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      dbRecord,
    };
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string) {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    await job.remove();

    // Update database record
    await prisma.tariffIngestionJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errorLog: 'Cancelled by user',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics() {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Shutdown worker gracefully
   */
  async shutdown() {
    if (this.worker) {
      await this.worker.close();
      console.log('Tariff ingestion worker shut down');
    }
  }
}

export const tariffIngestionWorker = new TariffIngestionWorker();

// Auto-initialize when module is loaded (in production)
if (process.env.NODE_ENV !== 'test') {
  tariffIngestionWorker.initialize().catch(console.error);
}
