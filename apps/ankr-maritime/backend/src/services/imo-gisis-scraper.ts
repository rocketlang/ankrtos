import puppeteer, { Browser, Page } from 'puppeteer';
import pino from 'pino';
import { prisma } from '../schema/context.js';

const logger = pino({ name: 'imo-gisis-scraper' });

export interface IMOGISISVesselData {
  imo: string;
  name?: string;
  callSign?: string;
  mmsi?: string;
  flag?: string;
  shipType?: string;
  grossTonnage?: number;
  deadweight?: number;
  lengthOverall?: number;
  breadth?: number;
  yearBuilt?: number;

  // Ownership data
  registeredOwner?: string;
  ownerAddress?: string;
  ownerCountry?: string;
  technicalManager?: string;
  operator?: string;

  // IMO-specific
  imoShipType?: string;
  classificationSociety?: string;
  portOfRegistry?: string;

  // Status
  status?: string; // active, scrapped, etc.

  // Metadata
  scrapedAt: Date;
  dataSource: 'imo-gisis';
}

export class IMOGISISScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isInitialized = false;
  private cache: Map<string, { data: IMOGISISVesselData; timestamp: number }> = new Map();
  private cacheTTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Initialize Puppeteer browser
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing IMO GISIS scraper...');

      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
      });

      this.page = await this.browser.newPage();

      await this.page.setViewport({ width: 1920, height: 1080 });
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      this.isInitialized = true;
      logger.info('✅ IMO GISIS scraper initialized');

    } catch (error: any) {
      logger.error('Failed to initialize IMO GISIS scraper:', error.message);
      throw error;
    }
  }

  /**
   * Scrape vessel data from IMO GISIS
   */
  async scrapeVesselData(imo: string): Promise<IMOGISISVesselData | null> {
    try {
      // Validate IMO format
      const cleanIMO = imo.replace(/^IMO[- ]?/i, '').replace(/^AIS-/, '');
      if (!/^\d{7}$/.test(cleanIMO)) {
        logger.warn(`Invalid IMO format: ${imo}`);
        return null;
      }

      // Check cache first
      const cached = this.cache.get(cleanIMO);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        logger.info(`Using cached IMO GISIS data for ${cleanIMO}`);
        return cached.data;
      }

      await this.initialize();
      if (!this.page) throw new Error('Page not initialized');

      logger.info(`Scraping IMO GISIS for vessel: ${cleanIMO}`);

      // Navigate to IMO GISIS ship search
      const searchUrl = 'https://gisis.imo.org/Public/SHIPS/Default.aspx';
      await this.page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for search form
      await this.page.waitForSelector('input[name*="IMO"]', { timeout: 10000 });

      // Enter IMO number in search field
      await this.page.evaluate((imoNumber: string) => {
        const imoInput = document.querySelector('input[name*="IMO"]') as HTMLInputElement;
        if (imoInput) {
          imoInput.value = imoNumber;
        }
      }, cleanIMO);

      // Click search button
      await this.page.evaluate(() => {
        const searchBtn = document.querySelector('input[type="submit"], button[type="submit"]') as HTMLElement;
        if (searchBtn) {
          searchBtn.click();
        }
      });

      // Wait for results
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch((e) => {
        logger.warn('Navigation timeout, checking if results loaded:', e.message);
      });

      // Take screenshot for debugging
      const screenshotPath = `/tmp/imo-gisis-${cleanIMO}.png`;
      await this.page.screenshot({ path: screenshotPath });
      logger.info(`Screenshot saved: ${screenshotPath}`);

      // Get page content for debugging
      const pageText = await this.page.evaluate(() => document.body.textContent);
      const pageUrl = this.page.url();
      logger.info(`Current URL: ${pageUrl}`);
      logger.info(`Page text sample: ${pageText?.substring(0, 500)}`);

      // Check if vessel found
      const vesselFound = await this.page.evaluate(() => {
        return !document.body.textContent?.includes('No records found');
      });

      if (!vesselFound) {
        logger.warn(`Vessel not found in IMO GISIS: ${cleanIMO}`);
        logger.warn(`Page contains: ${pageText?.substring(0, 200)}`);
        return null;
      }

      // Extract vessel data from the page
      const vesselData = await this.page.evaluate((imoNumber: string) => {
        const data: any = {
          imo: imoNumber,
          scrapedAt: new Date().toISOString(),
          dataSource: 'imo-gisis',
        };

        // Helper to extract text from label
        const getFieldValue = (labelText: string): string | null => {
          const labels = Array.from(document.querySelectorAll('td, th, label, span'));
          const label = labels.find(el => el.textContent?.trim().toLowerCase().includes(labelText.toLowerCase()));
          if (label) {
            const nextElement = label.nextElementSibling || label.parentElement?.nextElementSibling;
            if (nextElement) {
              return nextElement.textContent?.trim() || null;
            }
          }
          return null;
        };

        // Extract basic info
        data.name = getFieldValue('name') || getFieldValue('ship name');
        data.callSign = getFieldValue('call sign');
        data.mmsi = getFieldValue('mmsi');
        data.flag = getFieldValue('flag') || getFieldValue('flag state');
        data.shipType = getFieldValue('ship type') || getFieldValue('type');
        data.portOfRegistry = getFieldValue('port of registry');

        // Extract tonnage
        const gtText = getFieldValue('gross tonnage') || getFieldValue('gt');
        if (gtText) data.grossTonnage = parseFloat(gtText.replace(/[,\s]/g, ''));

        const dwtText = getFieldValue('deadweight') || getFieldValue('dwt');
        if (dwtText) data.deadweight = parseFloat(dwtText.replace(/[,\s]/g, ''));

        // Extract dimensions
        const loaText = getFieldValue('length') || getFieldValue('loa');
        if (loaText) data.lengthOverall = parseFloat(loaText.replace(/[,\s]/g, ''));

        const beamText = getFieldValue('breadth') || getFieldValue('beam');
        if (beamText) data.breadth = parseFloat(beamText.replace(/[,\s]/g, ''));

        // Extract year built
        const yearText = getFieldValue('year of build') || getFieldValue('built');
        if (yearText) {
          const year = parseInt(yearText.replace(/\D/g, ''));
          if (year > 1900 && year < 2100) data.yearBuilt = year;
        }

        // Extract ownership
        data.registeredOwner = getFieldValue('registered owner') || getFieldValue('owner');
        data.operator = getFieldValue('operator');
        data.technicalManager = getFieldValue('technical manager') || getFieldValue('manager');
        data.classificationSociety = getFieldValue('classification') || getFieldValue('class');

        // Extract status
        data.status = getFieldValue('status');

        return data;
      }, cleanIMO);

      // Convert scrapedAt back to Date
      vesselData.scrapedAt = new Date(vesselData.scrapedAt);

      // Cache the result
      this.cache.set(cleanIMO, { data: vesselData, timestamp: Date.now() });

      logger.info(`✅ IMO GISIS data scraped for ${vesselData.name || cleanIMO}`);
      return vesselData;

    } catch (error: any) {
      logger.error(`Error scraping IMO GISIS for ${imo}:`, error.message);
      return null;
    }
  }

  /**
   * Enrich vessel in database with IMO GISIS data
   */
  async enrichVessel(vesselId: string): Promise<boolean> {
    try {
      const vessel = await prisma.vessel.findUnique({
        where: { id: vesselId },
        select: { id: true, imo: true, name: true },
      });

      if (!vessel) {
        throw new Error(`Vessel not found: ${vesselId}`);
      }

      const gisisData = await this.scrapeVesselData(vessel.imo);
      if (!gisisData) {
        logger.warn(`No IMO GISIS data available for ${vessel.name} (${vessel.imo})`);
        return false;
      }

      // Update vessel with GISIS data
      await prisma.vessel.update({
        where: { id: vesselId },
        data: {
          mmsi: gisisData.mmsi || undefined,
          name: gisisData.name || undefined,
          flag: gisisData.flag || undefined,
          type: gisisData.shipType || undefined,
          grt: gisisData.grossTonnage || undefined,
          dwt: gisisData.deadweight || undefined,
          loa: gisisData.lengthOverall || undefined,
          beam: gisisData.breadth || undefined,
          yearBuilt: gisisData.yearBuilt || undefined,

          // Ownership data
          registeredOwner: gisisData.registeredOwner || undefined,
          shipManager: gisisData.technicalManager || undefined,
          operator: gisisData.operator || undefined,
          ownershipUpdatedAt: new Date(),

          classificationSociety: gisisData.classificationSociety || undefined,
          status: gisisData.status || undefined,
        },
      });

      // Store in cache table for future reference
      await prisma.vesselOwnershipCache.upsert({
        where: { imo: vessel.imo },
        create: {
          imo: vessel.imo,
          data: gisisData as any,
          scrapedAt: gisisData.scrapedAt,
        },
        update: {
          data: gisisData as any,
          scrapedAt: gisisData.scrapedAt,
          updatedAt: new Date(),
        },
      });

      logger.info(`✅ Vessel enriched with IMO GISIS data: ${vessel.name} (${vessel.imo})`);
      return true;

    } catch (error: any) {
      logger.error(`Error enriching vessel ${vesselId}:`, error.message);
      throw error;
    }
  }

  /**
   * Bulk enrich vessels with IMO GISIS data
   */
  async enrichVesselsWithGISISData(limit: number = 20): Promise<{
    total: number;
    enriched: number;
    failed: number;
    skipped: number;
  }> {
    try {
      // Find vessels without ownership data or with outdated data
      const vessels = await prisma.vessel.findMany({
        where: {
          OR: [
            { registeredOwner: null },
            { ownershipUpdatedAt: null },
            {
              ownershipUpdatedAt: {
                lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Older than 30 days
              },
            },
          ],
          imo: {
            not: {
              startsWith: 'AIS-', // Skip AIS-placeholder vessels
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      let enriched = 0;
      let failed = 0;
      let skipped = 0;

      logger.info(`Processing ${vessels.length} vessels for IMO GISIS enrichment`);

      for (const vessel of vessels) {
        try {
          const success = await this.enrichVessel(vessel.id);
          if (success) {
            enriched++;
          } else {
            skipped++;
          }

          // Rate limiting: wait 3 seconds between requests
          await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error: any) {
          logger.error(`Failed to enrich vessel ${vessel.name}:`, error.message);
          failed++;
        }
      }

      const result = {
        total: vessels.length,
        enriched,
        failed,
        skipped,
      };

      logger.info(`IMO GISIS enrichment complete:`, result);
      return result;

    } catch (error: any) {
      logger.error('Error in bulk vessel enrichment:', error.message);
      throw error;
    }
  }

  /**
   * Close browser and cleanup
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isInitialized = false;
      logger.info('IMO GISIS scraper closed');
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('IMO GISIS cache cleared');
  }
}

export const imoGisisScraper = new IMOGISISScraper();
