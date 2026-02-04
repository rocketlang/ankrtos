/**
 * Equasis Vessel Database Scraper
 * FREE public vessel ownership database
 *
 * Website: https://www.equasis.org/
 * Login: Public search (no registration needed for basic search)
 * Data: Ship particulars, registered owner, operator, ship manager
 */

import 'dotenv/config';
import { Builder, By, until, WebDriver, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
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
  deadweight: string | null;
  registeredOwner: string | null;
  operator: string | null;
  shipManager: string | null;
  docCompany: string | null;
  scrapedAt: Date;
}

export class EquasisService {
  private driver: WebDriver | null = null;
  private isLoggedIn = false;

  async initialize() {
    const options = new chrome.Options();

    // Headless mode
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    // Realistic user agent
    options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await this.driver.manage().setTimeouts({
      implicit: 10000,
      pageLoad: 30000,
    });

    logger.info('Equasis service initialized');
  }

  async login(): Promise<boolean> {
    if (!this.driver) {
      throw new Error('Driver not initialized. Call initialize() first.');
    }

    if (this.isLoggedIn) {
      return true;
    }

    try {
      logger.info('Logging into Equasis...');

      // Navigate to Equasis main page first
      await this.driver.get('https://www.equasis.org/');
      await this.sleep(3000);

      // Look for login link and click it
      try {
        const loginLink = await this.driver.findElement(By.linkText('Login'));
        await loginLink.click();
        logger.info('Clicked login link');
        await this.sleep(2000);
      } catch {
        // Maybe already on login page
      }

      // Check if we need to accept cookies
      try {
        const acceptButton = await this.driver.findElement(By.css('button[onclick*="acceptCookies"]'));
        await acceptButton.click();
        logger.info('Accepted cookies');
        await this.sleep(1000);
      } catch {
        // No cookie banner, continue
      }

      // Look for login form - use VISIBLE fields
      logger.info('Looking for login form...');

      // Find visible email field
      const emailFields = await this.driver.findElements(By.name('j_email'));
      let usernameInput = null;
      for (const field of emailFields) {
        if (await field.isDisplayed()) {
          usernameInput = field;
          break;
        }
      }

      if (!usernameInput) {
        throw new Error('No visible email field found');
      }

      // Find visible password field
      const passwordFields = await this.driver.findElements(By.name('j_password'));
      let passwordInput = null;
      for (const field of passwordFields) {
        if (await field.isDisplayed()) {
          passwordInput = field;
          break;
        }
      }

      if (!passwordInput) {
        throw new Error('No visible password field found');
      }

      // Enter credentials
      const username = process.env.EQUASIS_USERNAME || '';
      const password = process.env.EQUASIS_PASSWORD || '';

      logger.info(`Entering username: ${username}`);
      await usernameInput.clear();
      await usernameInput.sendKeys(username);
      await this.sleep(500);

      logger.info('Entering password...');
      await passwordInput.clear();
      await passwordInput.sendKeys(password);
      await this.sleep(500);

      // Submit login
      logger.info('Submitting login form...');
      const submitButtons = await this.driver.findElements(By.name('submit'));
      let visibleSubmit = null;

      for (const btn of submitButtons) {
        if (await btn.isDisplayed()) {
          visibleSubmit = btn;
          break;
        }
      }

      if (visibleSubmit) {
        await visibleSubmit.click();
      } else {
        // Fallback: press Enter on password field
        await passwordInput.sendKeys(Key.RETURN);
      }

      // Wait for redirect
      await this.sleep(5000);

      // Check if logged in
      const currentUrl = await this.driver.getCurrentUrl();
      logger.info(`URL after login: ${currentUrl}`);

      // Check for login success indicators
      this.isLoggedIn = currentUrl.includes('authen/HomePage') || currentUrl.includes('restricted/');

      if (this.isLoggedIn) {
        logger.info('✅ Successfully logged into Equasis');
      } else {
        logger.error('❌ Equasis login failed');

        // Get page text for debugging
        const bodyText = await this.driver.findElement(By.css('body')).getText();
        logger.error(`Page text: ${bodyText.substring(0, 500)}`);
      }

      return this.isLoggedIn;
    } catch (error: any) {
      logger.error('Equasis login error:', error.message);
      logger.error('Stack trace:', error.stack);

      // Try to get current page state for debugging
      try {
        const currentUrl = await this.driver.getCurrentUrl();
        const pageText = await this.driver.findElement(By.css('body')).getText();
        logger.error(`Current URL: ${currentUrl}`);
        logger.error(`Page text sample: ${pageText.substring(0, 300)}`);
      } catch (debugError) {
        logger.error('Could not get debug info');
      }

      return false;
    }
  }

  /**
   * Search for vessel by IMO number
   */
  async getVesselOwnerByIMO(imoNumber: string): Promise<VesselOwnershipData | null> {
    if (!this.driver) {
      throw new Error('Driver not initialized. Call initialize() first.');
    }

    if (!this.isLoggedIn) {
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error('Failed to log into Equasis');
      }
    }

    try {
      logger.info(`Searching Equasis for IMO ${imoNumber}`);

      // Navigate directly to ship search page
      await this.driver.get('https://www.equasis.org/EquasisWeb/restricted/ShipInfo?fs=Search');
      await this.sleep(3000);

      // Use the visible general search field that accepts "IMO, Name, Company"
      // Try P_ENTREE or P_ENTREE_ENTETE
      let searchInput = null;
      const searchFields = [
        By.id('P_ENTREE'),
        By.id('P_ENTREE_ENTETE'),
        By.name('P_ENTREE'),
        By.name('P_ENTREE_ENTETE'),
      ];

      for (const selector of searchFields) {
        try {
          searchInput = await this.driver.findElement(selector);
          if (await searchInput.isDisplayed()) {
            logger.info('Found search input field');
            break;
          }
        } catch {
          // Try next selector
        }
      }

      if (!searchInput) {
        throw new Error('Could not find search field');
      }

      // Check the "Ship" checkbox (might be required)
      try {
        const shipCheckbox = await this.driver.findElement(By.id('checkbox-ship'));
        const isChecked = await shipCheckbox.isSelected();
        if (!isChecked) {
          await shipCheckbox.click();
          logger.info('Checked Ship search option');
          await this.sleep(500);
        }
      } catch {
        // Checkbox might not exist or already checked
      }

      // Enter IMO number and submit
      await searchInput.clear();
      await searchInput.sendKeys(imoNumber);
      await this.sleep(500);

      // Press Enter or find submit
      await searchInput.sendKeys(Key.RETURN);
      logger.info('Submitted search');

      // Wait for results page
      await this.sleep(5000);

      // Check for redirect to login (session expired)
      const currentUrl = await this.driver.getCurrentUrl();
      if (currentUrl.includes('HomePage')) {
        logger.warn('Session expired, re-logging...');
        this.isLoggedIn = false;
        return await this.getVesselOwnerByIMO(imoNumber); // Retry
      }

      // Get page text
      const bodyText = await this.driver.findElement(By.css('body')).getText();

      // Check if vessel found
      if (bodyText.includes('No ship found') || bodyText.includes('No result') || bodyText.includes('No company nor Ship')) {
        logger.warn(`No vessel found in Equasis for IMO ${imoNumber}`);
        return null;
      }

      // Results found - click on first vessel in results table
      logger.info('Results found, clicking on vessel...');
      try {
        // Look for the IMO link in the results table
        const imoLink = await this.driver.findElement(By.linkText(imoNumber));
        await imoLink.click();
        await this.sleep(3000);
        logger.info('Navigated to vessel detail page');
      } catch (error) {
        logger.error('Could not find vessel link in results');
        return null;
      }

      // Extract data from page
      const data: VesselOwnershipData = {
        name: this.extractField(bodyText, 'Name of the ship:') || this.extractField(bodyText, 'Ship name:'),
        imoNumber: this.extractField(bodyText, 'IMO number:'),
        callSign: this.extractField(bodyText, 'Call sign:'),
        flag: this.extractField(bodyText, 'Flag:'),
        mmsi: this.extractField(bodyText, 'MMSI:'),
        type: this.extractField(bodyText, 'Type of ship:') || this.extractField(bodyText, 'Ship type:'),
        buildDate: this.extractField(bodyText, 'Year of build:') || this.extractField(bodyText, 'Built:'),
        grossTonnage: this.extractField(bodyText, 'Gross tonnage:') || this.extractField(bodyText, 'GT:'),
        deadweight: this.extractField(bodyText, 'Deadweight:') || this.extractField(bodyText, 'DWT:'),
        registeredOwner: this.extractField(bodyText, 'Registered owner:') || this.extractField(bodyText, 'Owner:'),
        operator: this.extractField(bodyText, 'Operator:') || this.extractField(bodyText, 'Ship operator:'),
        shipManager: this.extractField(bodyText, 'Ship manager:') || this.extractField(bodyText, 'Manager:'),
        docCompany: this.extractField(bodyText, 'DOC company:') || this.extractField(bodyText, 'Company:'),
        scrapedAt: new Date(),
      };

      logger.info(`✅ Found vessel in Equasis: ${data.name} - Owner: ${data.registeredOwner}`);

      return data;
    } catch (error: any) {
      logger.error(`Error fetching vessel from Equasis (IMO ${imoNumber}):`, error);
      return null;
    }
  }

  /**
   * Extract field value from page text
   */
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

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
      this.isLoggedIn = false;
      logger.info('Equasis service closed');
    }
  }
}

// Singleton instance for reuse
let equasisServiceInstance: EquasisService | null = null;

export async function getEquasisService(): Promise<EquasisService> {
  if (!equasisServiceInstance) {
    equasisServiceInstance = new EquasisService();
    await equasisServiceInstance.initialize();
  }
  return equasisServiceInstance;
}

export async function closeEquasisService() {
  if (equasisServiceInstance) {
    await equasisServiceInstance.close();
    equasisServiceInstance = null;
  }
}
