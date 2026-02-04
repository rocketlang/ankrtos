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
  registeredOwner: string | null;
  operator: string | null;
  technicalManager: string | null;
  docCompany: string | null;
  ismManager: string | null;
  scrapedAt: Date;
}

export class GISISOwnerService {
  private driver: WebDriver | null = null;
  private isLoggedIn = false;

  async initialize() {
    const options = new chrome.Options();

    // Basic headless settings
    options.addArguments('--headless=new'); // Use new headless mode
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    // STEALTH: Anti-detection measures
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--disable-features=IsolateOrigins,site-per-process');
    options.addArguments('--disable-web-security');
    options.addArguments('--allow-running-insecure-content');

    // STEALTH: Realistic user agent
    options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // STEALTH: Disable automation flags (using correct API)
    options.excludeSwitches(['enable-automation', 'enable-logging']);

    // STEALTH: Add preferences using addArguments with JSON
    options.addArguments('--disable-extensions');
    options.addArguments('--disable-popup-blocking');
    options.addArguments('--profile-directory=Default');

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await this.driver.manage().setTimeouts({
      implicit: 10000,
      pageLoad: 30000,
    });

    // STEALTH: Inject anti-detection scripts IMMEDIATELY after driver creation
    await this.injectStealthScripts();

    logger.info('GISIS service initialized with stealth mode');
  }

  /**
   * Inject stealth JavaScript to hide webdriver detection
   */
  private async injectStealthScripts() {
    if (!this.driver) return;

    await this.driver.executeScript(`
      // Override navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // Override chrome detection
      window.navigator.chrome = {
        runtime: {}
      };

      // Override permissions API
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Override plugins length
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });

      // Add realistic screen properties
      Object.defineProperty(screen, 'availWidth', {
        get: () => 1920
      });
      Object.defineProperty(screen, 'availHeight', {
        get: () => 1080
      });

      // Override toString methods to appear native
      const oldCall = Function.prototype.call;
      function call() {
        return oldCall.apply(this, arguments);
      }
      Function.prototype.call = call;

      // Hide automation indicators
      delete navigator.__proto__.webdriver;

      console.log('Stealth scripts injected successfully');
    `);
  }

  /**
   * Random human-like delay
   */
  private randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.sleep(delay);
  }

  /**
   * Simulate human-like mouse movement to element before clicking
   */
  private async humanClick(element: any) {
    if (!this.driver) return;

    // Move mouse to element (simulated via JavaScript)
    await this.driver.executeScript(`
      const el = arguments[0];
      const rect = el.getBoundingClientRect();
      const mouseEvent = new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      });
      el.dispatchEvent(mouseEvent);
    `, element);

    await this.randomDelay(100, 300); // Random delay before click

    // Actual click
    await element.click();
  }

  /**
   * Type text like a human (with random delays and occasional typos)
   */
  private async humanType(element: any, text: string) {
    await this.humanClick(element);
    await this.randomDelay(200, 500);

    // Clear field first
    await element.clear();
    await this.randomDelay(100, 300);

    // Type character by character with realistic delays
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      await element.sendKeys(char);

      // Random typing speed (50-200ms per character)
      const delay = Math.random() < 0.9 ?
        Math.floor(Math.random() * 100) + 50 :  // Normal typing
        Math.floor(Math.random() * 200) + 200;  // Occasional pause

      await this.sleep(delay);
    }

    // Random delay after finishing typing
    await this.randomDelay(300, 700);
  }

  async login(): Promise<boolean> {
    if (!this.driver) {
      throw new Error('Driver not initialized. Call initialize() first.');
    }

    if (this.isLoggedIn) {
      return true;
    }

    try {
      logger.info('Logging into IMO GISIS with stealth mode...');

      // Navigate to GISIS
      await this.driver.get('https://gisis.imo.org/');

      // Re-inject stealth scripts on new page
      await this.injectStealthScripts();

      // Random realistic delay (humans don't interact immediately)
      await this.randomDelay(2000, 4000);

      // STEALTH: Wait for page to fully load (humans wait for visual cues)
      await this.driver.wait(until.elementLocated(By.id('ctl00_cpMain_ddlAuthorityType')), 10000);
      await this.randomDelay(500, 1500); // Random delay to appear human

      // Select authority: Public User (with human-like interaction)
      const dropdown = await this.driver.findElement(By.id('ctl00_cpMain_ddlAuthorityType'));
      await this.humanClick(dropdown);
      await this.randomDelay(300, 700);

      await this.driver.executeScript(`
        const dropdown = document.getElementById('ctl00_cpMain_ddlAuthorityType');
        const options = dropdown.options;
        for (let i = 0; i < options.length; i++) {
          if (options[i].text.includes('Public User')) {
            dropdown.selectedIndex = i;
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            dropdown.dispatchEvent(event);
            break;
          }
        }
      `);

      logger.info('Selected: Public User');
      await this.randomDelay(800, 1500);

      // Enter username by typing slowly (like a real human)
      const username = process.env.GISIS_EMAIL || process.env.GISIS_USERNAME || '';
      logger.info(`Entering username: ${username}`);

      // CRITICAL: Remove maxlength attribute
      await this.driver.executeScript(`
        const usernameField = document.getElementById('ctl00_cpMain_txtUsername');
        usernameField.removeAttribute('maxlength');
        // Also ensure it's visible and enabled
        usernameField.style.display = 'block';
        usernameField.disabled = false;
      `);

      const usernameInput = await this.driver.findElement(By.id('ctl00_cpMain_txtUsername'));

      // STEALTH: Use human-like typing
      await this.humanType(usernameInput, username);

      // Trigger blur event (natural behavior after typing)
      await this.driver.executeScript(`
        const field = document.getElementById('ctl00_cpMain_txtUsername');
        field.dispatchEvent(new Event('blur', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
      `);

      await this.randomDelay(500, 1000);

      // Verify the field has the value
      const enteredValue = await usernameInput.getAttribute('value');
      logger.info(`Username field value: ${enteredValue}`);

      if (enteredValue !== username) {
        logger.error(`Username mismatch! Expected: ${username}, Got: ${enteredValue}`);
        return false;
      }

      logger.info('✅ Username entered successfully');

      // STEALTH: Click the Next button like a human would (instead of JavaScript postback)
      logger.info('Clicking Next button...');
      const nextButton = await this.driver.findElement(By.id('ctl00_cpMain_btnStep1'));

      // Scroll button into view (humans scroll to see buttons)
      await this.driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', nextButton);
      await this.randomDelay(300, 600);

      // Move mouse to button and click
      await this.humanClick(nextButton);

      // STEALTH: Realistic wait time for password page
      logger.info('Waiting for password page...');
      await this.randomDelay(3000, 5000); // Random 3-5 second wait

      const urlAfterUsername = await this.driver.getCurrentUrl();
      logger.info(`URL after username: ${urlAfterUsername}`);

      // Check if still on login page (validation error?)
      const bodyText = await this.driver.findElement(By.css('body')).getText();
      if (bodyText.includes('invalid') || bodyText.includes('error') || bodyText.includes('not found')) {
        logger.error(`Validation error detected: ${bodyText.substring(0, 500)}`);
        return false;
      }

      // Enter password by typing slowly (like a real human)
      logger.info('Looking for password field...');
      const passwordInput = await this.driver.wait(
        until.elementLocated(By.css('input[type="password"]')),
        10000
      );

      logger.info('Entering password...');
      await passwordInput.clear();
      await this.sleep(500);

      // Type password slowly character by character
      const password = process.env.GISIS_PASSWORD || '';
      for (const char of password) {
        await passwordInput.sendKeys(char);
        await this.sleep(50); // 50ms between characters
      }

      await this.sleep(1000);
      logger.info('✅ Password entered');

      // Submit login
      logger.info('Looking for login button...');
      const loginButton = await this.driver.findElement(By.css('input[name*="btnStep2"]'));
      logger.info('Clicking Login button...');
      await loginButton.click();

      // WAIT LONGER for login to complete
      logger.info('Waiting 10 seconds for login to complete...');
      await this.sleep(10000);

      // Verify login
      const currentUrl = await this.driver.getCurrentUrl();
      logger.info(`URL after login: ${currentUrl}`);

      this.isLoggedIn = currentUrl.includes('gisis.imo.org/Public');

      if (this.isLoggedIn) {
        logger.info('✅ Successfully logged into GISIS');
      } else {
        logger.error(`❌ GISIS login failed - URL does not contain "gisis.imo.org/Public"`);
        logger.error(`Current URL: ${currentUrl}`);

        // Get page text for debugging
        const bodyText = await this.driver.findElement(By.css('body')).getText();
        logger.error(`Page text: ${bodyText.substring(0, 500)}`);
      }

      return this.isLoggedIn;
    } catch (error: any) {
      logger.error('GISIS login error:', error.message);
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

  async getVesselOwnerByIMO(imoNumber: string): Promise<VesselOwnershipData | null> {
    if (!this.driver) {
      throw new Error('Driver not initialized. Call initialize() first.');
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
      await this.driver.get(url);
      await this.sleep(3000);

      // Check for redirect to login
      const currentUrl = await this.driver.getCurrentUrl();
      if (currentUrl.includes('WebLogin')) {
        logger.warn('Session expired, re-logging...');
        this.isLoggedIn = false;
        return await this.getVesselOwnerByIMO(imoNumber); // Retry
      }

      // Get page text
      const bodyText = await this.driver.findElement(By.css('body')).getText();

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

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
      this.isLoggedIn = false;
      logger.info('GISIS service closed');
    }
  }
}

// Singleton instance for reuse
let gisisServiceInstance: GISISOwnerService | null = null;

export async function getGISISService(): Promise<GISISOwnerService> {
  if (!gisisServiceInstance) {
    gisisServiceInstance = new GISISOwnerService();
    await gisisServiceInstance.initialize();
  }
  return gisisServiceInstance;
}

export async function closeGISISService() {
  if (gisisServiceInstance) {
    await gisisServiceInstance.close();
    gisisServiceInstance = null;
  }
}
