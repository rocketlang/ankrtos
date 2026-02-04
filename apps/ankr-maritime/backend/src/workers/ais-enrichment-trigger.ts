/**
 * AIS Enrichment Trigger
 *
 * Monitors AIS data ingestion and triggers enrichment for:
 * 1. New vessels (first time seen in AIS)
 * 2. Vessels without enrichment data
 * 3. Vessels with stale enrichment (>30 days)
 */

import { prisma } from '../lib/prisma.js';
import { autoEnrichmentService } from '../services/auto-enrichment.service.js';
import { logger } from '../utils/logger.js';

export interface AISEnrichmentStats {
  newVesselsDetected: number;
  enrichmentTriggered: number;
  alreadyEnriched: number;
  errors: number;
}

class AISEnrichmentTrigger {
  private processedVessels = new Set<string>(); // In-memory cache to avoid duplicate triggers
  private lastCleanup = Date.now();

  /**
   * Check if vessel needs enrichment and trigger if needed
   */
  async checkAndTrigger(vesselId: string): Promise<boolean> {
    try {
      // Skip if already processed recently (in-memory cache)
      if (this.processedVessels.has(vesselId)) {
        return false;
      }

      // Get vessel with enrichment status
      const vessel = await prisma.vessel.findUnique({
        where: { id: vesselId },
        include: {
          gisisData: {
            select: {
              scrapedAt: true,
              registeredOwner: true,
            },
          },
        },
      });

      if (!vessel) {
        return false;
      }

      // Check if vessel has valid IMO
      if (!vessel.imoNumber || !/^\d{7}$/.test(vessel.imoNumber)) {
        this.processedVessels.add(vesselId);
        return false;
      }

      // Check enrichment status
      const needsEnrichment = this.needsEnrichment(vessel.gisisData);

      if (needsEnrichment) {
        await autoEnrichmentService.queueEnrichment({
          source: 'ais',
          vesselId: vessel.id,
          imoNumber: vessel.imoNumber,
          vesselName: vessel.name || undefined,
          priority: 'low', // Background priority for AIS triggers
        });

        logger.info(`Triggered enrichment for new AIS vessel: ${vessel.name} (${vessel.imoNumber})`);
        this.processedVessels.add(vesselId);
        return true;
      }

      this.processedVessels.add(vesselId);
      return false;

    } catch (error: any) {
      logger.error(`Error checking vessel enrichment: ${error.message}`);
      return false;
    } finally {
      // Cleanup cache every hour
      if (Date.now() - this.lastCleanup > 60 * 60 * 1000) {
        this.processedVessels.clear();
        this.lastCleanup = Date.now();
      }
    }
  }

  /**
   * Batch check multiple vessels
   */
  async batchCheck(vesselIds: string[]): Promise<AISEnrichmentStats> {
    const stats: AISEnrichmentStats = {
      newVesselsDetected: vesselIds.length,
      enrichmentTriggered: 0,
      alreadyEnriched: 0,
      errors: 0,
    };

    for (const vesselId of vesselIds) {
      try {
        const triggered = await this.checkAndTrigger(vesselId);
        if (triggered) {
          stats.enrichmentTriggered++;
        } else {
          stats.alreadyEnriched++;
        }
      } catch (error) {
        stats.errors++;
      }
    }

    return stats;
  }

  /**
   * Check if vessel needs enrichment
   */
  private needsEnrichment(gisisData: any): boolean {
    // No enrichment data
    if (!gisisData) {
      return true;
    }

    // No owner data
    if (!gisisData.registeredOwner) {
      return true;
    }

    // Stale data (>30 days)
    if (gisisData.scrapedAt) {
      const daysSince = Math.floor(
        (Date.now() - gisisData.scrapedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince > 30) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find vessels in AIS data without enrichment
   */
  async findUnenrichedVessels(limit: number = 100): Promise<string[]> {
    const vessels = await prisma.vessel.findMany({
      where: {
        imoNumber: {
          not: '',
          // Valid IMO format (7 digits)
        },
        gisisData: null, // No enrichment data
      },
      select: {
        id: true,
      },
      take: limit,
    });

    return vessels.map(v => v.id);
  }

  /**
   * Daily cron job: Enrich vessels with recent AIS activity
   */
  async enrichRecentlyActiveVessels(): Promise<AISEnrichmentStats> {
    try {
      logger.info('Starting daily enrichment of recently active vessels...');

      // Find vessels with AIS positions in last 7 days, no enrichment
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const activeVessels = await prisma.vesselPosition.findMany({
        where: {
          timestamp: { gte: sevenDaysAgo },
          vessel: {
            imoNumber: { not: '' },
            gisisData: null,
          },
        },
        select: {
          vesselId: true,
        },
        distinct: ['vesselId'],
        take: 100,
      });

      const vesselIds = [...new Set(activeVessels.map(v => v.vesselId))];

      logger.info(`Found ${vesselIds.length} recently active vessels without enrichment`);

      return await this.batchCheck(vesselIds);

    } catch (error: any) {
      logger.error(`Error in daily enrichment: ${error.message}`);
      return {
        newVesselsDetected: 0,
        enrichmentTriggered: 0,
        alreadyEnriched: 0,
        errors: 1,
      };
    }
  }
}

export const aisEnrichmentTrigger = new AISEnrichmentTrigger();
