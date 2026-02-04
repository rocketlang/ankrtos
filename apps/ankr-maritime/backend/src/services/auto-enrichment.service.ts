/**
 * Automatic Vessel Enrichment Service
 *
 * Triggers enrichment based on:
 * 1. New AIS data arrivals (AIS worker detects new vessels)
 * 2. User queries (GraphQL/API requests for vessel data)
 * 3. Email parsing (extract IMO/vessel names from emails)
 * 4. Scheduled batch jobs (daily enrichment of top N vessels by AIS activity)
 */

import { prisma } from '../lib/prisma.js';
// import { imoGisisEnrichmentService } from './imo-gisis-enrichment.service.js'; // Disabled - service doesn't exist yet
import { logger } from '../utils/logger.js';

export interface EnrichmentTrigger {
  source: 'ais' | 'user_query' | 'email' | 'scheduled';
  vesselId?: string;
  imoNumber?: string;
  vesselName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface EnrichmentQueueItem {
  id: string;
  imoNumber: string;
  vesselName?: string;
  priority: number; // 1=urgent, 2=high, 3=medium, 4=low
  source: string;
  createdAt: Date;
  attempts: number;
}

class AutoEnrichmentService {
  private queue: EnrichmentQueueItem[] = [];
  private processing = false;
  private maxConcurrent = 3;
  private rateLimit = 10000; // 10s between enrichments

  /**
   * Add vessel to enrichment queue
   */
  async queueEnrichment(trigger: EnrichmentTrigger): Promise<void> {
    try {
      // Resolve vessel to IMO number
      let imoNumber = trigger.imoNumber;
      let vesselName = trigger.vesselName;

      if (!imoNumber && trigger.vesselId) {
        const vessel = await prisma.vessel.findUnique({
          where: { id: trigger.vesselId },
          select: { imoNumber: true, name: true },
        });
        if (vessel) {
          imoNumber = vessel.imoNumber;
          vesselName = vessel.name || undefined;
        }
      }

      if (!imoNumber || !this.isValidIMO(imoNumber)) {
        logger.warn(`Invalid IMO for enrichment: ${imoNumber}`);
        return;
      }

      // Check if already enriched recently (within 30 days)
      const existingEnrichment = await prisma.imoGisisData.findUnique({
        where: { imoNumber },
        select: { scrapedAt: true },
      });

      if (existingEnrichment?.scrapedAt) {
        const daysSinceEnrichment = Math.floor(
          (Date.now() - existingEnrichment.scrapedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceEnrichment < 30 && trigger.priority !== 'urgent') {
          logger.debug(`Vessel ${imoNumber} enriched ${daysSinceEnrichment} days ago, skipping`);
          return;
        }
      }

      // Check if already in queue
      const existingInQueue = this.queue.find(item => item.imoNumber === imoNumber);
      if (existingInQueue) {
        // Upgrade priority if new request is higher
        const newPriorityNum = this.priorityToNumber(trigger.priority);
        if (newPriorityNum < existingInQueue.priority) {
          existingInQueue.priority = newPriorityNum;
          logger.info(`Upgraded priority for ${imoNumber} to ${trigger.priority}`);
        }
        return;
      }

      // Add to queue
      const queueItem: EnrichmentQueueItem = {
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        imoNumber,
        vesselName,
        priority: this.priorityToNumber(trigger.priority),
        source: trigger.source,
        createdAt: new Date(),
        attempts: 0,
      };

      this.queue.push(queueItem);
      this.queue.sort((a, b) => a.priority - b.priority); // Sort by priority

      logger.info(`Queued vessel ${imoNumber} for enrichment (priority: ${trigger.priority}, source: ${trigger.source})`);

      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }

    } catch (error: any) {
      logger.error(`Error queueing enrichment: ${error.message}`);
    }
  }

  /**
   * Process enrichment queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.maxConcurrent);

        await Promise.all(
          batch.map(item => this.enrichVessel(item))
        );

        // Rate limiting
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.rateLimit));
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Enrich a single vessel
   */
  private async enrichVessel(item: EnrichmentQueueItem): Promise<void> {
    try {
      logger.info(`Enriching vessel ${item.imoNumber} (${item.vesselName || 'unknown'}) from ${item.source}`);

      // Enrichment service disabled - waiting for VesselFinder/MarineTraffic API integration
      logger.warn(`⚠️  Enrichment service not available yet for ${item.imoNumber}`);

      // TODO: Integrate VesselFinder or MarineTraffic API here
      // const result = await imoGisisEnrichmentService.enrichVessel(item.imoNumber);

      // if (result.success) {
      //   logger.info(`✅ Enriched ${item.imoNumber}: ${result.data?.registeredOwner || 'no owner data'}`);
      // } else {
      //   logger.warn(`❌ Failed to enrich ${item.imoNumber}: ${result.error}`);
      //
      //   // Retry logic for transient failures
      //   if (item.attempts < 3 && result.error?.includes('timeout')) {
      //     item.attempts++;
      //     this.queue.push(item); // Re-queue
      //   }
      // }

    } catch (error: any) {
      logger.error(`Error enriching ${item.imoNumber}: ${error.message}`);
    }
  }

  /**
   * Trigger enrichment from new AIS data
   */
  async enrichFromNewAIS(vesselId: string): Promise<void> {
    await this.queueEnrichment({
      source: 'ais',
      vesselId,
      priority: 'low', // Background enrichment
    });
  }

  /**
   * Trigger enrichment from user query
   */
  async enrichFromUserQuery(imoNumber: string): Promise<void> {
    await this.queueEnrichment({
      source: 'user_query',
      imoNumber,
      priority: 'high', // User is waiting
    });
  }

  /**
   * Trigger enrichment from email parsing
   */
  async enrichFromEmail(vessels: Array<{ imoNumber?: string; vesselName?: string }>): Promise<void> {
    for (const vessel of vessels) {
      await this.queueEnrichment({
        source: 'email',
        imoNumber: vessel.imoNumber,
        vesselName: vessel.vesselName,
        priority: 'medium', // Business context
      });
    }
  }

  /**
   * Enrich top N vessels by AIS activity (daily cron)
   */
  async enrichTopActiveVessels(limit: number = 100): Promise<void> {
    try {
      // Find vessels with most AIS positions in last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const topVessels = await prisma.vesselPosition.groupBy({
        by: ['vesselId'],
        where: {
          timestamp: { gte: sevenDaysAgo },
        },
        _count: {
          vesselId: true,
        },
        orderBy: {
          _count: {
            vesselId: 'desc',
          },
        },
        take: limit,
      });

      logger.info(`Enriching top ${topVessels.length} active vessels from AIS data`);

      for (const { vesselId } of topVessels) {
        await this.queueEnrichment({
          source: 'scheduled',
          vesselId,
          priority: 'low',
        });
      }

    } catch (error: any) {
      logger.error(`Error enriching top active vessels: ${error.message}`);
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueLength: number;
    processing: boolean;
    itemsByPriority: Record<string, number>;
    itemsBySource: Record<string, number>;
  } {
    const byPriority: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const item of this.queue) {
      const priorityStr = this.numberToPriority(item.priority);
      byPriority[priorityStr] = (byPriority[priorityStr] || 0) + 1;
      bySource[item.source] = (bySource[item.source] || 0) + 1;
    }

    return {
      queueLength: this.queue.length,
      processing: this.processing,
      itemsByPriority: byPriority,
      itemsBySource: bySource,
    };
  }

  private priorityToNumber(priority: string): number {
    switch (priority) {
      case 'urgent': return 1;
      case 'high': return 2;
      case 'medium': return 3;
      case 'low': return 4;
      default: return 4;
    }
  }

  private numberToPriority(num: number): string {
    switch (num) {
      case 1: return 'urgent';
      case 2: return 'high';
      case 3: return 'medium';
      case 4: return 'low';
      default: return 'low';
    }
  }

  private isValidIMO(imo: string): boolean {
    return /^\d{7}$/.test(imo);
  }
}

export const autoEnrichmentService = new AutoEnrichmentService();
