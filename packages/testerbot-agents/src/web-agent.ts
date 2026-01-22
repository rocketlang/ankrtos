/**
 * Web Test Agent - For web apps using Playwright browsers
 */

import { TestAgent } from './base-agent';
import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export interface WebAgentConfig {
  /** Base URL of the web app */
  baseUrl: string;

  /** Browser to use */
  browserType?: BrowserType;

  /** Headless mode (default: true) */
  headless?: boolean;

  /** Viewport size */
  viewport?: {
    width: number;
    height: number;
  };

  /** Screenshots output directory */
  screenshotsDir?: string;

  /** Videos output directory */
  videosDir?: string;

  /** User agent string */
  userAgent?: string;

  /** Extra HTTP headers */
  extraHTTPHeaders?: Record<string, string>;

  /** Geolocation */
  geolocation?: {
    latitude: number;
    longitude: number;
  };

  /** Permissions */
  permissions?: string[];
}

export class WebTestAgent extends TestAgent {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private consoleErrors: string[] = [];
  private config: WebAgentConfig;
  private isRecording: boolean = false;
  private currentVideoName: string | null = null;

  constructor(config: WebAgentConfig) {
    super();
    this.config = {
      browserType: 'chromium',
      headless: true,
      viewport: { width: 1280, height: 720 },
      screenshotsDir: './screenshots',
      videosDir: './videos',
      ...config
    };
  }

  /**
   * Launch browser and navigate to base URL
   */
  async setup(): Promise<void> {
    // Ensure videos directory exists
    if (!fs.existsSync(this.config.videosDir!)) {
      fs.mkdirSync(this.config.videosDir!, { recursive: true });
    }

    // Launch browser
    const browserType = this.config.browserType || 'chromium';

    switch (browserType) {
      case 'chromium':
        this.browser = await chromium.launch({ headless: this.config.headless });
        break;
      case 'firefox':
        this.browser = await firefox.launch({ headless: this.config.headless });
        break;
      case 'webkit':
        this.browser = await webkit.launch({ headless: this.config.headless });
        break;
    }

    // Create context with configuration and video recording
    this.context = await this.browser.newContext({
      viewport: this.config.viewport,
      userAgent: this.config.userAgent,
      extraHTTPHeaders: this.config.extraHTTPHeaders,
      geolocation: this.config.geolocation,
      permissions: this.config.permissions,
      recordVideo: {
        dir: this.config.videosDir!,
        size: { width: 1280, height: 720 }
      }
    });

    // Create new page
    this.page = await this.context.newPage();

    // Listen for console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(msg.text());
      }
    });

    // Navigate to base URL
    await this.page.goto(this.config.baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
  }

  /**
   * Close browser
   */
  async teardown(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
  }

  /**
   * Wait for element
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<any> {
    if (!this.page) throw new Error('Browser not launched');

    return await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Click element
   */
  async click(selector: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.click(selector);
  }

  /**
   * Type text
   */
  async type(selector: string, text: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.fill(selector, text);
  }

  /**
   * Get text content
   */
  async getText(selector: string): Promise<string> {
    if (!this.page) throw new Error('Browser not launched');

    const element = await this.page.$(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);

    return (await element.textContent()) || '';
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(selector: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not launched');

    try {
      const element = await this.page.$(selector);
      if (!element) return false;

      return await element.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Find multiple elements
   */
  async findElements(selector: string): Promise<any[]> {
    if (!this.page) throw new Error('Browser not launched');

    return await this.page.$$(selector);
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name?: string): Promise<string> {
    if (!this.page) throw new Error('Browser not launched');

    // Ensure screenshots directory exists
    if (!fs.existsSync(this.config.screenshotsDir!)) {
      fs.mkdirSync(this.config.screenshotsDir!, { recursive: true });
    }

    const filename = name || `screenshot-${Date.now()}.png`;
    const filepath = path.join(this.config.screenshotsDir!, filename);

    await this.page.screenshot({ path: filepath, fullPage: true });

    return filepath;
  }

  /**
   * Get console errors
   */
  async getConsoleErrors(): Promise<string[]> {
    return [...this.consoleErrors];
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    if (!this.page) throw new Error('Browser not launched');

    return await this.page.title();
  }

  /**
   * Get current URL
   */
  async getUrl(): Promise<string> {
    if (!this.page) throw new Error('Browser not launched');

    return this.page.url();
  }

  /**
   * Execute JavaScript
   */
  async evaluate<T>(fn: () => T): Promise<T> {
    if (!this.page) throw new Error('Browser not launched');

    return await this.page.evaluate(fn);
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(timeout: number = 30000): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.waitForLoadState('domcontentloaded', { timeout });
  }

  /**
   * Reload page
   */
  async reload(): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  /**
   * Go back
   */
  async goBack(): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.goBack({ waitUntil: 'domcontentloaded' });
  }

  /**
   * Go forward
   */
  async goForward(): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.goForward({ waitUntil: 'domcontentloaded' });
  }

  /**
   * Get attribute value
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    if (!this.page) throw new Error('Browser not launched');

    const element = await this.page.$(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);

    return await element.getAttribute(attribute);
  }

  /**
   * Check if page is loaded
   */
  async isPageLoaded(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const readyState = await this.page.evaluate(() => document.readyState);
      return readyState === 'complete' || readyState === 'interactive';
    } catch {
      return false;
    }
  }

  /**
   * Get network requests
   */
  async getNetworkRequests(): Promise<string[]> {
    // TODO: Implement network request tracking
    return [];
  }

  /**
   * Block URLs (for testing)
   */
  async blockUrls(patterns: string[]): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.route('**/*', (route) => {
      const url = route.request().url();
      const shouldBlock = patterns.some(pattern => url.includes(pattern));

      if (shouldBlock) {
        route.abort();
      } else {
        route.continue();
      }
    });
  }

  /**
   * Set viewport size
   */
  async setViewport(width: number, height: number): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.setViewportSize({ width, height });
  }

  /**
   * Hover over element
   */
  async hover(selector: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.hover(selector);
  }

  /**
   * Select option from dropdown
   */
  async select(selector: string, value: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.selectOption(selector, value);
  }

  /**
   * Press keyboard key
   */
  async press(key: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.keyboard.press(key);
  }

  /**
   * Start video recording
   */
  async startVideoRecording(name?: string): Promise<void> {
    this.isRecording = true;
    this.currentVideoName = name || `video-${Date.now()}`;
    // Video recording is automatically enabled via recordVideo in setup()
    // This method just marks that we want to keep this recording
  }

  /**
   * Stop video recording and return path (or null if not saved)
   */
  async stopVideoRecording(save: boolean = false): Promise<string | null> {
    if (!this.isRecording || !this.page) {
      return null;
    }

    this.isRecording = false;

    try {
      // Get the video from Playwright
      const video = this.page.video();
      if (!video) {
        return null;
      }

      // Close the page to finalize the video
      const videoPath = await video.path();

      if (save && videoPath) {
        // Rename video to the desired name
        const finalPath = path.join(
          this.config.videosDir!,
          `${this.currentVideoName}.webm`
        );

        // Copy the video to the final location
        if (fs.existsSync(videoPath)) {
          fs.copyFileSync(videoPath, finalPath);
          return finalPath;
        }

        return videoPath;
      } else {
        // Delete the video if not saving
        if (videoPath && fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
        return null;
      }
    } catch (error) {
      console.error('Error stopping video recording:', error);
      return null;
    } finally {
      this.currentVideoName = null;
    }
  }
}
