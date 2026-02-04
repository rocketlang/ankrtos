import 'dotenv/config';
import { chromium, Browser, Page } from 'playwright';
import { logger } from '../utils/logger.js';

interface VesselOwnershipData {
  name: string | null;
  imoNumber: string | null;
  callSign: string | null;
  flag: string | null;
  mmsi: string | null;
  type: string | null;
  buildDate: string | null;
  grossTonnage: string | null;
  registeredOwner: string | null;
  operator: string | null;
  technicalManager: string | null;
  docCompany: string | null;
  ismManager: string | null;
  scrapedAt: Date;
}

export class GISISPlaywrightService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isLoggedIn = false;

  async initialize() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    logger.info('GISIS Playwright service initialized');
  }

  async login(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Page not initialized. Call initialize() first.');
    }

    if (this.isLoggedIn) {
      return true;
    }

    try {
      logger.info('Logging into IMO GISIS...');

      await this.page.goto('https://gisis.imo.org/', { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(2000);

      // Select authority: Public User
      logger.info('Selecting authority: Public User');
      await this.page.selectOption('#ctl00_cpMain_ddlAuthorityType', { label: 'Public User' });
      await this.page.waitForTimeout(1000);

      // Enter username - use GISIS_USERNAME ("powerpbox")
      const username = process.env.GISIS_USERNAME || 'powerpbox';
      logger.info(`Entering username: ${username}`);

      await this.page.fill('#ctl00_cpMain_txtUsername', username);
      await this.page.waitForTimeout(1000);

      logger.info('✅ Username entered successfully');

      // Click Next button
      logger.info('Clicking Next button...');
      await this.page.click('#ctl00_cpMain_btnStep1');

      // Wait for password page
      logger.info('Waiting for password page...');
      await this.page.waitForSelector('input[type="password"]', { timeout: 30000 });

      logger.info('✅ Password field found!');

      // Enter password
      const password = process.env.GISIS_PASSWORD || '';
      logger.info('Entering password...');
      await this.page.fill('input[type="password"]', password);
      await this.page.waitForTimeout(1000);

      logger.info('✅ Password entered');

      // Click Login button
      logger.info('Clicking Login button...');

      // Use Promise.race to handle navigation (might not trigger navigation event)
      await Promise.race([
        this.page.click('input[name*="btnStep2"]').then(() => this.page.waitForNavigation({ timeout: 15000, waitUntil: 'domcontentloaded' }).catch(() => {})),
        this.page.waitForTimeout(15000)
      ]);

      // Wait a bit more for page to settle
      await this.page.waitForTimeout(3000);

      // Verify login
      const currentUrl = this.page.url();
      logger.info(`URL after login: ${currentUrl}`);

      this.isLoggedIn = currentUrl.includes('gisis.imo.org/Public');

      if (this.isLoggedIn) {
        logger.info('✅ Successfully logged into GISIS');
      } else {
        logger.error(`❌ GISIS login failed - URL does not contain "gisis.imo.org/Public"`);
        logger.error(`Current URL: ${currentUrl}`);

        // Get page text for debugging
        const bodyText = await this.page.textContent('body');
        logger.error(`Page text: ${bodyText?.substring(0, 500)}`);
      }

      return this.isLoggedIn;
    } catch (error: any) {
      logger.error('GISIS login error:', error.message);
      logger.error('Stack trace:', error.stack);

      // Try to get current page state for debugging
      try {
        const currentUrl = this.page?.url();
        const pageText = await this.page?.textContent('body');
        logger.error(`Current URL: ${currentUrl}`);
        logger.error(`Page text sample: ${pageText?.substring(0, 300)}`);
      } catch (debugError) {
        logger.error('Could not get debug info');
      }

      return false;
    }
  }

  async getVesselOwnerByIMO(imoNumber: string): Promise<VesselOwnershipData | null> {
    if (!this.page) {
      throw new Error('Page not initialized. Call initialize() first.');
    }

    if (!this.isLoggedIn) {
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error('Failed to log into GISIS');
      }
    }

    try {
      logger.info(`Fetching ownership data for IMO ${imoNumber}`);

      const url = `https://gisis.imo.org/Public/SHIPS/ShipDetails.aspx?IMONumber=${imoNumber}`;
      await this.page.goto(url, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(3000);

      // Check for redirect to login
      const currentUrl = this.page.url();
      if (currentUrl.includes('WebLogin')) {
        logger.warn('Session expired, re-logging...');
        this.isLoggedIn = false;
        return await this.getVesselOwnerByIMO(imoNumber); // Retry
      }

      // Get page text
      const bodyText = await this.page.textContent('body');
      if (!bodyText) {
        logger.warn(`No content found for IMO ${imoNumber}`);
        return null;
      }

      // Verify we have data
      if (!bodyText.includes('Ship Particulars')) {
        logger.warn(`No vessel details found for IMO ${imoNumber}`);
        return null;
      }

      // Extract data
      const data: VesselOwnershipData = {
        name: this.extractField(bodyText, 'Name:'),
        imoNumber: this.extractField(bodyText, 'IMO Number:'),
        callSign: this.extractField(bodyText, 'Call sign:'),
        flag: this.extractField(bodyText, 'Flag:'),
        mmsi: this.extractField(bodyText, 'MMSI:'),
        type: this.extractField(bodyText, 'Type:'),
        buildDate: this.extractField(bodyText, 'Date of build:'),
        grossTonnage: this.extractField(bodyText, 'Gross tonnage:'),
        registeredOwner: this.extractField(bodyText, 'Registered owner:'),
        operator: this.extractField(bodyText, 'Operator:'),
        technicalManager: this.extractField(bodyText, 'Technical manager:'),
        docCompany:
          this.extractField(bodyText, 'DOC company:') ||
          this.extractField(bodyText, 'Company responsible for DOC:'),
        ismManager:
          this.extractField(bodyText, 'ISM manager:') ||
          this.extractField(bodyText, 'Company:'),
        scrapedAt: new Date(),
      };

      logger.info(`Successfully extracted owner for IMO ${imoNumber}: ${data.registeredOwner}`);

      return data;
    } catch (error: any) {
      logger.error(`Error fetching owner for IMO ${imoNumber}:`, error);
      return null;
    }
  }

  private extractField(text: string, fieldLabel: string): string | null {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(fieldLabel)) {
        // Check if value is on same line
        const parts = lines[i].split(':');
        if (parts.length > 1 && parts[1].trim()) {
          return parts.slice(1).join(':').trim();
        }
        // Check next line
        if (i + 1 < lines.length && lines[i + 1]) {
          return lines[i + 1];
        }
      }
    }
    return null;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isLoggedIn = false;
      logger.info('GISIS Playwright service closed');
    }
  }
}

// Singleton instance for reuse
let gisisPlaywrightInstance: GISISPlaywrightService | null = null;

export async function getGISISPlaywrightService(): Promise<GISISPlaywrightService> {
  if (!gisisPlaywrightInstance) {
    gisisPlaywrightInstance = new GISISPlaywrightService();
    await gisisPlaywrightInstance.initialize();
  }
  return gisisPlaywrightInstance;
}

export async function closeGISISPlaywrightService() {
  if (gisisPlaywrightInstance) {
    await gisisPlaywrightInstance.close();
    gisisPlaywrightInstance = null;
  }
}
