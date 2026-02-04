/**
 * Equasis Ownership Scraper
 * Automatically enriches vessels with ownership data
 *
 * IMPORTANT: Respects Equasis terms of service
 * - Rate limit: 1 request per 3 seconds
 * - Only scrape vessels we track via AIS
 * - Cache results for 90 days
 */

import puppeteer from 'puppeteer';
import { prisma } from '../lib/prisma.js';

interface EquasisData {
  imo: string;
  registeredOwner?: {
    name: string;
    country: string;
  };
  shipManager?: {
    name: string;
    country: string;
  };
  operator?: {
    name: string;
    country: string;
  };
  ismManager?: {
    name: string;
    country: string;
  };
  docCompany?: {
    name: string;
    country: string;
  };
  scrapedAt: Date;
}

export class EquasisScraper {
  private browser: any = null;
  private isLoggedIn = false;

  /**
   * Initialize browser and login
   */
  async init() {
    if (this.browser) return;

    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    await this.login();
  }

  /**
   * Login to Equasis
   */
  private async login() {
    const page = await this.browser.newPage();

    try {
      console.log('🔐 Logging into Equasis...');

      await page.goto('https://www.equasis.org/EquasisWeb/authen/HomePage');

      // Enter credentials
      await page.type('#login', process.env.EQUASIS_USERNAME || '');
      await page.type('#password', process.env.EQUASIS_PASSWORD || '');

      // Submit
      await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]'),
      ]);

      this.isLoggedIn = true;
      console.log('✅ Logged into Equasis');
    } catch (error: any) {
      console.error('❌ Equasis login failed:', error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape ownership data for a vessel by IMO
   */
  async scrapeVessel(imo: string): Promise<EquasisData | null> {
    // Check cache first (90-day cache)
    const cached = await this.getCachedData(imo);
    if (cached) {
      console.log(`📦 Using cached data for IMO ${imo}`);
      return cached;
    }

    if (!this.isLoggedIn) {
      await this.init();
    }

    const page = await this.browser.newPage();

    try {
      console.log(`🔍 Scraping Equasis for IMO ${imo}...`);

      // Navigate to search page
      await page.goto(
        `https://www.equasis.org/EquasisWeb/restricted/ShipSearch?fs=Search&P_IMO=${imo}`
      );

      // Wait for results
      await page.waitForSelector('.ship-info', { timeout: 10000 });

      // Extract ownership data
      const data: EquasisData = {
        imo,
        scrapedAt: new Date(),
      };

      // Registered Owner
      const ownerElement = await page.$('.registered-owner');
      if (ownerElement) {
        data.registeredOwner = {
          name: await page.$eval('.owner-name', (el: any) => el.textContent.trim()),
          country: await page.$eval('.owner-country', (el: any) => el.textContent.trim()),
        };
      }

      // Ship Manager
      const managerElement = await page.$('.ship-manager');
      if (managerElement) {
        data.shipManager = {
          name: await page.$eval('.manager-name', (el: any) => el.textContent.trim()),
          country: await page.$eval('.manager-country', (el: any) => el.textContent.trim()),
        };
      }

      // Operator
      const operatorElement = await page.$('.operator');
      if (operatorElement) {
        data.operator = {
          name: await page.$eval('.operator-name', (el: any) => el.textContent.trim()),
          country: await page.$eval('.operator-country', (el: any) => el.textContent.trim()),
        };
      }

      // ISM Manager
      const ismElement = await page.$('.ism-manager');
      if (ismElement) {
        data.ismManager = {
          name: await page.$eval('.ism-name', (el: any) => el.textContent.trim()),
          country: await page.$eval('.ism-country', (el: any) => el.textContent.trim()),
        };
      }

      console.log(`✅ Scraped ownership for ${data.registeredOwner?.name || 'Unknown'}`);

      // Cache the data
      await this.cacheData(imo, data);

      // Rate limit: 3 seconds between requests
      await this.delay(3000);

      return data;
    } catch (error: any) {
      console.error(`❌ Failed to scrape IMO ${imo}:`, error.message);
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * Enrich vessel with ownership data
   */
  async enrichVessel(vesselId: string) {
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
    });

    if (!vessel || !vessel.imo || vessel.imo === '0') {
      console.log(`⚠️  Vessel ${vesselId} has no IMO, skipping`);
      return;
    }

    const ownershipData = await this.scrapeVessel(vessel.imo);

    if (!ownershipData) {
      return;
    }

    // Update vessel with ownership data
    await prisma.vessel.update({
      where: { id: vesselId },
      data: {
        registeredOwner: ownershipData.registeredOwner?.name,
        shipManager: ownershipData.shipManager?.name,
        operator: ownershipData.operator?.name,
        ownershipUpdatedAt: new Date(),
      },
    });

    console.log(`✅ Updated vessel ${vessel.name} with ownership data`);
  }

  /**
   * Batch enrich multiple vessels
   */
  async enrichMultipleVessels(vesselIds: string[]) {
    console.log(`🔄 Enriching ${vesselIds.length} vessels...`);

    for (const vesselId of vesselIds) {
      try {
        await this.enrichVessel(vesselId);
      } catch (error: any) {
        console.error(`❌ Error enriching ${vesselId}:`, error.message);
      }
    }

    console.log('✅ Batch enrichment complete');
  }

  /**
   * Auto-enrich new vessels discovered via AIS
   */
  async autoEnrichNewVessels() {
    // Find vessels without ownership data
    const vessels = await prisma.vessel.findMany({
      where: {
        OR: [
          { registeredOwner: null },
          { ownershipUpdatedAt: null },
          {
            ownershipUpdatedAt: {
              lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days old
            },
          },
        ],
        imo: { not: '0' }, // Must have valid IMO
      },
      take: 100, // Process 100 at a time
      orderBy: { createdAt: 'desc' }, // Newest first
    });

    console.log(`🆕 Found ${vessels.length} vessels needing ownership data`);

    await this.enrichMultipleVessels(vessels.map(v => v.id));
  }

  /**
   * Get cached ownership data
   */
  private async getCachedData(imo: string): Promise<EquasisData | null> {
    const cached = await prisma.vesselOwnershipCache.findUnique({
      where: { imo },
    });

    if (!cached) return null;

    // Check if cache is still valid (90 days)
    const cacheAge = Date.now() - cached.scrapedAt.getTime();
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    if (cacheAge > ninetyDays) {
      return null; // Cache expired
    }

    return cached.data as EquasisData;
  }

  /**
   * Cache ownership data
   */
  private async cacheData(imo: string, data: EquasisData) {
    await prisma.vesselOwnershipCache.upsert({
      where: { imo },
      create: {
        imo,
        data: data as any,
        scrapedAt: new Date(),
      },
      update: {
        data: data as any,
        scrapedAt: new Date(),
      },
    });
  }

  /**
   * Cleanup
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isLoggedIn = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const equasisScraper = new EquasisScraper();
