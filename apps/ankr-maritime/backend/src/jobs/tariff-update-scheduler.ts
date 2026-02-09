/**
 * Tariff Update Scheduler - Automated Quarterly Updates
 * Week 2 - Day 5: Automated Scheduling
 *
 * Schedule:
 * - Daily (2am):     Priority 1 ports (SGSIN, AEJEA, NLRTM)
 * - Weekly (3am Sun): Priority 2-3 ports
 * - Monthly (4am 1st): Priority 4 ports
 * - Quarterly (5am): All ports + change detection
 */

import cron from 'node-cron';
import { getTariffIngestionService } from '../services/tariff-ingestion.service.js';
import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();
const ingestionService = getTariffIngestionService();

export class TariffUpdateScheduler {
  private jobs: cron.ScheduledTask[] = [];

  /**
   * Start all scheduled jobs
   */
  start(): void {
    console.log('📅 Starting Tariff Update Scheduler');

    // Daily: Priority 1 ports (2am)
    this.jobs.push(
      cron.schedule('0 2 * * *', async () => {
        console.log('\n⏰ Daily tariff update starting...');
        await this.updatePriorityPorts(1);
      })
    );

    // Weekly: Priority 2-3 ports (3am Sunday)
    this.jobs.push(
      cron.schedule('0 3 * * 0', async () => {
        console.log('\n⏰ Weekly tariff update starting...');
        await this.updatePriorityPorts(2);
        await this.updatePriorityPorts(3);
      })
    );

    // Monthly: Priority 4 ports (4am 1st of month)
    this.jobs.push(
      cron.schedule('0 4 1 * *', async () => {
        console.log('\n⏰ Monthly tariff update starting...');
        await this.updatePriorityPorts(4);
      })
    );

    // Quarterly: All ports (5am on Jan 1, Apr 1, Jul 1, Oct 1)
    this.jobs.push(
      cron.schedule('0 5 1 1,4,7,10 *', async () => {
        console.log('\n⏰ Quarterly tariff update starting...');
        await this.updateAllPorts();
      })
    );

    console.log('✅ Scheduler started with 4 jobs');
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    this.jobs.forEach(job => job.stop());
    console.log('✅ Scheduler stopped');
  }

  /**
   * Update priority ports
   */
  private async updatePriorityPorts(priority: number): Promise<void> {
    const ports = this.getPortsByPriority(priority);
    console.log(`📦 Updating ${ports.length} priority ${priority} ports`);

    const pdfs = ports.map(portId => ({
      pdfPath: this.getPDFPath(portId),
      portId,
    }));

    try {
      const results = await ingestionService.ingestBulk(pdfs, {
        parallel: true,
        maxConcurrent: 5,
        delayMs: 30000,
      });

      const successful = results.filter(r => r.success).length;
      console.log(`✅ Update complete: ${successful}/${ports.length} successful`);
    } catch (error: any) {
      console.error(`❌ Update failed: ${error.message}`);
    }
  }

  /**
   * Update all ports (quarterly)
   */
  private async updateAllPorts(): Promise<void> {
    console.log('📦 Quarterly update: Processing all ports');
    
    for (let priority = 1; priority <= 4; priority++) {
      await this.updatePriorityPorts(priority);
    }
  }

  /**
   * Get ports by priority
   */
  private getPortsByPriority(priority: number): string[] {
    const priorities: Record<number, string[]> = {
      1: ['SGSIN', 'AEJEA', 'NLRTM'],
      2: ['INMUN', 'INNSA', 'USNYC'],
      3: ['CNSHA', 'GBLON', 'JPYOK'],
      4: ['NOKRS'],
    };
    return priorities[priority] || [];
  }

  /**
   * Get PDF path for port
   */
  private getPDFPath(portId: string): string {
    return `/root/apps/ankr-maritime/tariff-pdfs/${portId}.pdf`;
  }
}

// Export singleton
let scheduler: TariffUpdateScheduler | null = null;

export function getTariffUpdateScheduler(): TariffUpdateScheduler {
  if (!scheduler) {
    scheduler = new TariffUpdateScheduler();
  }
  return scheduler;
}
