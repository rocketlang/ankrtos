/**
 * Equasis Ownership Scraper
 *
 * SLOW & RESPECTFUL scraping to avoid being blocked
 * - 10 second delay between requests
 * - 7 year cache (re-check only on active vessel use)
 * - Max 50 vessels per day
 */

import puppeteer from 'puppeteer';
import { prisma } from '../lib/prisma.js';

interface EquasisData {
  imo: string;
  registeredOwner?: string;
  shipManager?: string;
  operator?: string;
  flag?: string;
  scrapedAt: Date;
}

export class EquasisScraper {
  private browser: any = null;
  private page: any = null; // Reuse same page to maintain session
  private isLoggedIn = false;
  private requestCount = 0;
  private readonly MAX_REQUESTS_PER_DAY = 50; // Conservative limit
  private readonly DELAY_BETWEEN_REQUESTS = 10000; // 10 seconds

  /**
   * Initialize browser and login
   */
  async init() {
    if (this.browser) return;

    console.log('🌐 Launching browser...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled', // Hide automation
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ],
    });

    await this.login();
  }

  /**
   * Login to Equasis
   */
  private async login() {
    this.page = await this.browser.newPage();

    try {
      // Anti-detection: override webdriver flag
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });

      // Set realistic viewport
      await this.page.setViewport({ width: 1920, height: 1080 });

      // Set extra headers to appear more like a real browser
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });

      console.log('🔐 Logging into Equasis...');

      await this.page.goto('https://www.equasis.org/EquasisWeb/public/HomePage', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait a bit to appear more human-like
      await this.delay(2000);

      // Fill the login form
      const username = process.env.EQUASIS_USERNAME || '';
      const password = process.env.EQUASIS_PASSWORD || '';

      // Type email slowly like a human
      await this.page.evaluate((email) => {
        const emailInput = document.querySelector('input[name="j_email"]') as HTMLInputElement;
        if (emailInput) emailInput.value = email;
      }, username);

      await this.delay(500);

      // Type password slowly like a human
      await this.page.evaluate((pass) => {
        const passwordInput = document.querySelector('input[name="j_password"]') as HTMLInputElement;
        if (passwordInput) passwordInput.value = pass;
      }, password);

      await this.delay(1000);

      // Submit the form by pressing Enter or clicking Login button
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        this.page.evaluate(() => {
          const loginButton = Array.from(document.querySelectorAll('button[type="submit"]'))
            .find(btn => btn.textContent?.includes('Login'));
          if (loginButton) (loginButton as HTMLElement).click();
        }),
      ]);

      // Wait a bit for session to be established
      await this.delay(2000);

      // Verify login by checking if we can access restricted area
      const currentUrl = this.page.url();
      console.log(`📍 Current URL after login: ${currentUrl}`);

      // Check if login was successful by looking for logout button or restricted content
      const isLoggedIn = await this.page.evaluate(() => {
        return document.body.textContent?.includes('Logout') ||
               document.body.textContent?.includes('My Equasis');
      });

      if (!isLoggedIn) {
        throw new Error('Login failed - not authenticated');
      }

      this.isLoggedIn = true;
      console.log('✅ Logged into Equasis');
    } catch (error: any) {
      console.error('❌ Equasis login failed:', error.message);
      throw error;
    }
    // Don't close page - reuse it for vessel searches
  }

  /**
   * Scrape ownership data for a vessel by IMO
   */
  async scrapeVessel(imo: string): Promise<EquasisData | null> {
    // Check daily limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_DAY) {
      console.log(`⚠️  Daily limit reached (${this.MAX_REQUESTS_PER_DAY} vessels). Wait until tomorrow.`);
      return null;
    }

    // Check cache first (90-day cache)
    const cached = await this.getCachedData(imo);
    if (cached) {
      console.log(`📦 Using cached data for IMO ${imo}`);
      return cached;
    }

    if (!this.isLoggedIn) {
      await this.init();
    }

    try {
      console.log(`🔍 [${this.requestCount + 1}/${this.MAX_REQUESTS_PER_DAY}] Scraping Equasis for IMO ${imo}...`);

      // Use Advanced Ship Search (has proper form with named inputs)
      await this.page.goto('https://www.equasis.org/EquasisWeb/restricted/ShipAdvanced?fs=HomePage', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await this.delay(1000);

      // Fill IMO field in advanced search form
      await this.page.evaluate((searchIMO: string) => {
        // Advanced search has proper named input for IMO
        const imoInput = document.querySelector('input[name="P_IMO"]') as HTMLInputElement;
        if (imoInput) {
          imoInput.value = searchIMO;
        }
      }, imo);

      await this.delay(500);

      // Submit the advanced search form
      await this.page.evaluate(() => {
        const submitBtn = document.querySelector('input[type="submit"]') as HTMLElement ||
                         document.querySelector('button[type="submit"]') as HTMLElement;
        if (submitBtn) submitBtn.click();
      });

      // Wait for results to load (AJAX may take longer)
      console.log('  ⏳ Waiting for search results...');
      await this.delay(5000); // Increased from 3s to 5s

      // Wait for actual result rows to appear (not just headers)
      try {
        await this.page.waitForFunction(() => {
          const rows = Array.from(document.querySelectorAll('tr'));
          // Look for rows with actual data (more than just headers)
          return rows.some(row => {
            const text = row.textContent || '';
            return text.match(/\d{7}/) && !text.includes('IMO number'); // Has 7-digit number but not header
          });
        }, { timeout: 10000 });
        console.log('  ✅ Results loaded');
      } catch (e) {
        console.log('  ⚠️  No results appeared (vessel may not exist)');
      }

      // Check page state
      const pageType = await this.page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        const hasResultsList = bodyText.includes('Results list');
        const hasShipDetails = bodyText.includes('Registered owner') || bodyText.includes('Ship manager');
        const rowsWithData = Array.from(document.querySelectorAll('tr'))
          .filter(row => {
            const text = row.textContent || '';
            return text.match(/\d{7}/) && !text.includes('IMO number');
          }).length;

        return { hasResultsList, hasShipDetails, rowsWithData };
      });

      console.log(`  📋 Results: ${pageType.rowsWithData} rows, Details page: ${pageType.hasShipDetails}`);

      // If results list with data, click the first result
      if (pageType.rowsWithData > 0 && !pageType.hasShipDetails) {
        console.log('  🖱️  Clicking first result...');

        await this.page.evaluate(() => {
          // Click first ship result link (look for IMO link)
          const firstLink = document.querySelector('a[href*="ShipInfo"]') as HTMLElement ||
                           Array.from(document.querySelectorAll('a'))
                             .find(a => a.textContent?.match(/\d{7}/)) as HTMLElement;

          if (firstLink) firstLink.click();
        });

        await this.delay(3000);
      }

      // DEBUG: Check what's on the page
      const pageDebug = await this.page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        const rows = Array.from(document.querySelectorAll('tr'));
        return {
          title: document.title,
          rowCount: rows.length,
          hasOwnerText: bodyText.includes('Registered owner'),
          hasManagerText: bodyText.includes('Ship manager'),
          hasShipName: bodyText.includes('GOLDEN CURL'),
          firstFewRows: rows.slice(0, 10).map(r => r.textContent?.trim().substring(0, 100)),
        };
      });

      console.log(`  📄 Page: ${pageDebug.title}`);
      console.log(`  📊 Table rows: ${pageDebug.rowCount}`);
      console.log(`  🏢 Has owner text: ${pageDebug.hasOwnerText}`);
      console.log(`  🚢 Has ship name: ${pageDebug.hasShipName}`);

      if (pageDebug.rowCount > 0) {
        console.log('  📝 First rows:');
        pageDebug.firstFewRows.forEach((text, idx) => {
          if (text && text.length > 5) console.log(`     [${idx}] ${text}`);
        });
      }

      // Extract data from the page
      const data: EquasisData = {
        imo,
        scrapedAt: new Date(),
      };

      // Try to extract registered owner
      try {
        const ownerText = await this.page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('tr'));
          const ownerRow = rows.find(row =>
            row.textContent?.includes('Registered owner')
          );
          return ownerRow?.textContent || '';
        });

        // Parse owner from text (format varies)
        const ownerMatch = ownerText.match(/Registered owner\s*[:\-]?\s*(.+?)(?:\s*\(|$)/);
        if (ownerMatch) {
          data.registeredOwner = ownerMatch[1].trim();
        }
      } catch (e) {
        console.log('  ⚠️  Could not extract owner');
      }

      // Try to extract ship manager
      try {
        const managerText = await this.page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('tr'));
          const managerRow = rows.find(row =>
            row.textContent?.includes('Ship manager')
          );
          return managerRow?.textContent || '';
        });

        const managerMatch = managerText.match(/Ship manager\s*[:\-]?\s*(.+?)(?:\s*\(|$)/);
        if (managerMatch) {
          data.shipManager = managerMatch[1].trim();
        }
      } catch (e) {
        console.log('  ⚠️  Could not extract manager');
      }

      // Try to extract flag
      try {
        const flagText = await this.page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('tr'));
          const flagRow = rows.find(row =>
            row.textContent?.includes('Flag')
          );
          return flagRow?.textContent || '';
        });

        const flagMatch = flagText.match(/Flag\s*[:\-]?\s*(.+?)(?:\s*\(|$)/);
        if (flagMatch) {
          data.flag = flagMatch[1].trim();
        }
      } catch (e) {
        console.log('  ⚠️  Could not extract flag');
      }

      if (data.registeredOwner) {
        console.log(`  ✅ Owner: ${data.registeredOwner}`);
      }
      if (data.shipManager) {
        console.log(`  ✅ Manager: ${data.shipManager}`);
      }

      // Cache the data
      await this.cacheData(imo, data);

      this.requestCount++;

      // SLOW rate limit: 10 seconds between requests
      console.log(`  ⏰ Waiting ${this.DELAY_BETWEEN_REQUESTS / 1000} seconds before next request...`);
      await this.delay(this.DELAY_BETWEEN_REQUESTS);

      return data;
    } catch (error: any) {
      console.error(`  ❌ Failed to scrape IMO ${imo}:`, error.message);
      return null;
    }
    // Don't close page - reuse it for next vessel
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
        registeredOwner: ownershipData.registeredOwner,
        shipManager: ownershipData.shipManager,
        operator: ownershipData.operator,
        ownershipUpdatedAt: new Date(),
      },
    });

    console.log(`✅ Updated vessel ${vessel.name} with ownership data`);
  }

  /**
   * Auto-enrich new vessels (respects daily limit)
   */
  async autoEnrichNewVessels(limit: number = 20) {
    console.log('🔄 Auto-enriching vessels with ownership data...');
    console.log(`   Limit: ${Math.min(limit, this.MAX_REQUESTS_PER_DAY)} vessels`);

    // Find vessels without ownership data or data >7 years old
    const vessels = await prisma.vessel.findMany({
      where: {
        OR: [
          { registeredOwner: null },
          { ownershipUpdatedAt: null },
          {
            ownershipUpdatedAt: {
              lt: new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000), // 7 years old
            },
          },
        ],
        imo: { not: '0' }, // Must have valid IMO
        mmsi: { not: null }, // Must have MMSI (discovered via AIS)
      },
      take: Math.min(limit, this.MAX_REQUESTS_PER_DAY),
      orderBy: { createdAt: 'desc' }, // Newest first
    });

    console.log(`   Found ${vessels.length} vessels needing ownership data`);

    for (const vessel of vessels) {
      if (this.requestCount >= this.MAX_REQUESTS_PER_DAY) {
        console.log('⚠️  Daily limit reached. Stopping.');
        break;
      }

      try {
        await this.enrichVessel(vessel.id);
      } catch (error: any) {
        console.error(`❌ Error enriching ${vessel.name}:`, error.message);
      }
    }

    console.log(`\n✅ Enrichment complete: ${this.requestCount} vessels processed today`);
  }

  /**
   * Get cached ownership data
   */
  private async getCachedData(imo: string): Promise<EquasisData | null> {
    const cached = await prisma.vesselOwnershipCache.findUnique({
      where: { imo },
    });

    if (!cached) return null;

    // Check if cache is still valid (7 years)
    const cacheAge = Date.now() - cached.scrapedAt.getTime();
    const sevenYears = 7 * 365 * 24 * 60 * 60 * 1000;

    if (cacheAge > sevenYears) {
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
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isLoggedIn = false;
    }
    console.log('👋 Browser closed');
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      requestsToday: this.requestCount,
      remainingToday: this.MAX_REQUESTS_PER_DAY - this.requestCount,
      isLoggedIn: this.isLoggedIn,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const equasisScraper = new EquasisScraper();
