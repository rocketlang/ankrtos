/**
 * Port Scraper Registry
 * Central registry for all port tariff scrapers
 */

import { BasePortScraper } from './base-scraper.js';
import { SingaporePortScraper } from './singapore-scraper.js';
import { MumbaiPortScraper } from './mumbai-scraper.js';
import { KandlaPortScraper } from './kandla-scraper.js';
import { MundraPortScraper } from './mundra-scraper.js';
import { ColomboPortScraper } from './colombo-scraper.js';
import { JebelAliPortScraper } from './jebel-ali-scraper.js';
import { JeddahPortScraper } from './jeddah-scraper.js';
import { FujairahPortScraper } from './fujairah-scraper.js';
import { JNPTPortScraper } from './jnpt-scraper.js';
import { prisma } from '../../lib/prisma.js';

export interface PortScraperEntry {
  unlocode: string;
  portName: string;
  scraper: typeof BasePortScraper;
  priority: number; // 1 = high priority, 10 = low priority
  status: 'active' | 'disabled' | 'testing';
}

/**
 * Registry of all available port scrapers
 * Priority 1-3: Daily scraping
 * Priority 4-7: Weekly scraping
 * Priority 8-10: Monthly scraping
 */
export const PORT_SCRAPER_REGISTRY: PortScraperEntry[] = [
  // Phase 1: First 8 ports (Mumbai, Kandla, Mundra, Colombo, Singapore, Jebel Ali, Jeddah, Fujairah)
  {
    unlocode: 'INMUN',
    portName: 'Mumbai',
    scraper: MumbaiPortScraper,
    priority: 1,
    status: 'active',
  },
  {
    unlocode: 'INKDL',
    portName: 'Kandla',
    scraper: KandlaPortScraper,
    priority: 1,
    status: 'active',
  },
  {
    unlocode: 'INMUN1',
    portName: 'Mundra',
    scraper: MundraPortScraper,
    priority: 1,
    status: 'active',
  },
  {
    unlocode: 'LKCMB',
    portName: 'Colombo',
    scraper: ColomboPortScraper,
    priority: 1,
    status: 'active',
  },
  {
    unlocode: 'SGSIN',
    portName: 'Singapore',
    scraper: SingaporePortScraper,
    priority: 1,
    status: 'testing', // Needs URL fix
  },
  {
    unlocode: 'AEJEA',
    portName: 'Jebel Ali',
    scraper: JebelAliPortScraper,
    priority: 1,
    status: 'active',
  },
  {
    unlocode: 'SAJED',
    portName: 'Jeddah',
    scraper: JeddahPortScraper,
    priority: 1,
    status: 'active',
  },
  {
    unlocode: 'AEFJR',
    portName: 'Fujairah',
    scraper: FujairahPortScraper,
    priority: 1,
    status: 'active',
  },
  {
    unlocode: 'INNSA',
    portName: 'JNPT (Nhava Sheva)',
    scraper: JNPTPortScraper,
    priority: 1,
    status: 'active',
  },
];

/**
 * Port Scraper Manager
 * Orchestrates scraping across multiple ports
 */
export class PortScraperManager {
  /**
   * Scrape a single port by unlocode
   */
  async scrapePort(unlocode: string): Promise<void> {
    const entry = PORT_SCRAPER_REGISTRY.find(e => e.unlocode === unlocode);

    if (!entry) {
      throw new Error(`No scraper found for port: ${unlocode}`);
    }

    if (entry.status !== 'active') {
      console.log(`⏸️  Skipping ${entry.portName} (status: ${entry.status})`);
      return;
    }

    // Find or create port in database
    let port = await prisma.port.findFirst({
      where: { unlocode: entry.unlocode }
    });

    if (!port) {
      // Port doesn't exist, skip for now
      console.log(`⚠️  Port ${entry.portName} (${unlocode}) not found in database`);
      return;
    }

    // Create scraper instance
    const scraper = new entry.scraper();

    console.log(`🚢 Scraping ${entry.portName} (${unlocode})...`);

    try {
      const result = await scraper.scrape();

      if (!result.success) {
        console.error(`❌ ${entry.portName}: ${result.error}`);
        return;
      }

      // Store tariffs in database
      let importedCount = 0;

      for (const tariff of result.tariffs) {
        // Check if tariff already exists
        const existing = await prisma.portTariff.findFirst({
          where: {
            portId: port.id,
            chargeType: tariff.chargeType,
            dataSource: 'REAL_SCRAPED', // Only check real scraped data
            effectiveTo: null,
          }
        });

        if (!existing) {
          await prisma.portTariff.create({
            data: {
              portId: port.id,
              chargeType: tariff.chargeType,
              amount: tariff.amount,
              currency: tariff.currency,
              unit: tariff.unit,
              notes: tariff.notes,
              vesselType: tariff.vesselType,
              sizeRangeMin: tariff.sizeRangeMin,
              sizeRangeMax: tariff.sizeRangeMax,
              dataSource: 'REAL_SCRAPED',
              sourceUrl: result.sourceUrl,
              scrapedAt: result.scrapedAt,
              effectiveFrom: tariff.effectiveFrom || new Date(),
              effectiveTo: tariff.effectiveTo,
            }
          });
          importedCount++;
        }
      }

      console.log(`✅ ${entry.portName}: Imported ${importedCount} real tariffs`);

    } catch (error) {
      console.error(`❌ ${entry.portName} scraping failed:`, error);
    }
  }

  /**
   * Scrape multiple ports in batch
   */
  async scrapePorts(unlocodes: string[], delayMs: number = 30000): Promise<void> {
    console.log(`🚢 Starting batch scrape of ${unlocodes.length} ports`);

    for (const unlocode of unlocodes) {
      await this.scrapePort(unlocode);

      // Delay between ports for respectful scraping
      if (unlocodes.indexOf(unlocode) < unlocodes.length - 1) {
        console.log(`⏳ Waiting ${delayMs/1000}s before next port...`);
        await this.sleep(delayMs);
      }
    }

    console.log(`✅ Batch scrape complete`);
  }

  /**
   * Scrape all active ports
   */
  async scrapeAll(priorityFilter?: number): Promise<void> {
    const activePorts = PORT_SCRAPER_REGISTRY
      .filter(e => e.status === 'active')
      .filter(e => priorityFilter ? e.priority <= priorityFilter : true)
      .map(e => e.unlocode);

    await this.scrapePorts(activePorts, 30000);
  }

  /**
   * Get scraper statistics
   */
  async getStats(): Promise<any> {
    const totalScrapers = PORT_SCRAPER_REGISTRY.length;
    const activeScrapers = PORT_SCRAPER_REGISTRY.filter(e => e.status === 'active').length;

    const realTariffs = await prisma.portTariff.count({
      where: { dataSource: 'REAL_SCRAPED' }
    });

    const simulatedTariffs = await prisma.portTariff.count({
      where: { dataSource: 'SIMULATED' }
    });

    return {
      totalScrapers,
      activeScrapers,
      realTariffs,
      simulatedTariffs,
      registeredPorts: PORT_SCRAPER_REGISTRY.map(e => ({
        unlocode: e.unlocode,
        name: e.portName,
        priority: e.priority,
        status: e.status,
      }))
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const portScraperManager = new PortScraperManager();
