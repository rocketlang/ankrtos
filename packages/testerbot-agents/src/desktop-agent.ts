/**
 * Desktop Test Agent - For Electron apps using Playwright
 */

import { TestAgent } from './base-agent';
import { _electron as electron, ElectronApplication, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

export interface DesktopAgentConfig {
  /** Path to Electron app executable or main.js */
  appPath: string;

  /** Working directory */
  cwd?: string;

  /** Environment variables */
  env?: Record<string, string>;

  /** Screenshots output directory */
  screenshotsDir?: string;

  /** Videos output directory */
  videosDir?: string;

  /** Launch arguments */
  args?: string[];
}

export class DesktopTestAgent extends TestAgent {
  private app: ElectronApplication | null = null;
  private page: Page | null = null;
  private consoleErrors: string[] = [];
  private config: DesktopAgentConfig;
  private isRecording: boolean = false;
  private currentVideoName: string | null = null;
  private setupStartTime: number = 0;
  private setupEndTime: number = 0;

  constructor(config: DesktopAgentConfig) {
    super();
    this.config = {
      screenshotsDir: './screenshots',
      videosDir: './videos',
      ...config
    };
  }

  /**
   * Launch Electron app
   */
  async setup(): Promise<void> {
    this.setupStartTime = Date.now();

    // Ensure videos directory exists
    if (!fs.existsSync(this.config.videosDir!)) {
      fs.mkdirSync(this.config.videosDir!, { recursive: true });
    }

    // Launch Electron app with video recording enabled
    this.app = await electron.launch({
      executablePath: this.config.appPath,
      args: this.config.args || [],
      cwd: this.config.cwd,
      env: {
        ...(process.env as Record<string, string>),
        ...(this.config.env || {})
      },
      recordVideo: {
        dir: this.config.videosDir!,
        size: { width: 1280, height: 720 }
      }
    });

    // Get first window
    this.page = await this.app.firstWindow();

    // Listen for console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(msg.text());
      }
    });

    // Wait for app to be ready
    await this.page.waitForLoadState('domcontentloaded');

    this.setupEndTime = Date.now();
  }

  /**
   * Close Electron app
   */
  async teardown(): Promise<void> {
    if (this.app) {
      await this.app.close();
      this.app = null;
      this.page = null;
    }
  }

  /**
   * Wait for element
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<any> {
    if (!this.page) throw new Error('App not launched');

    return await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Click element
   */
  async click(selector: string): Promise<void> {
    if (!this.page) throw new Error('App not launched');

    await this.page.click(selector);
  }

  /**
   * Type text
   */
  async type(selector: string, text: string): Promise<void> {
    if (!this.page) throw new Error('App not launched');

    await this.page.fill(selector, text);
  }

  /**
   * Get text content
   */
  async getText(selector: string): Promise<string> {
    if (!this.page) throw new Error('App not launched');

    const element = await this.page.$(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);

    return (await element.textContent()) || '';
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(selector: string): Promise<boolean> {
    if (!this.page) throw new Error('App not launched');

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
    if (!this.page) throw new Error('App not launched');

    return await this.page.$$(selector);
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name?: string): Promise<string> {
    if (!this.page) throw new Error('App not launched');

    // Ensure screenshots directory exists
    if (!fs.existsSync(this.config.screenshotsDir!)) {
      fs.mkdirSync(this.config.screenshotsDir!, { recursive: true });
    }

    const filename = name || `screenshot-${Date.now()}.png`;
    const filepath = path.join(this.config.screenshotsDir!, filename);

    await this.page.screenshot({ path: filepath });

    return filepath;
  }

  /**
   * Get console errors
   */
  async getConsoleErrors(): Promise<string[]> {
    return [...this.consoleErrors];
  }

  /**
   * Get memory usage
   */
  async getMemoryUsage(): Promise<number> {
    if (!this.app) throw new Error('App not launched');

    const metrics = await this.app.evaluate(async ({ app }) => {
      return process.memoryUsage();
    });

    return metrics.heapUsed;
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    startupTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    networkLatency?: number;
    fps?: number;
  }> {
    const metrics: any = {};

    // Startup time
    if (this.setupEndTime && this.setupStartTime) {
      metrics.startupTime = this.setupEndTime - this.setupStartTime;
    }

    // Memory usage
    try {
      metrics.memoryUsage = await this.getMemoryUsage();
    } catch {
      // Ignore errors
    }

    // CPU usage (not available for Electron)
    // fps (not available for Electron)

    return metrics;
  }

  /**
   * Check if app is visible
   */
  async isAppVisible(): Promise<boolean> {
    if (!this.page) return false;

    try {
      return await this.page.isVisible('body');
    } catch {
      return false;
    }
  }

  /**
   * Launch app (alias for setup for clarity)
   */
  async launchApp(): Promise<void> {
    return this.setup();
  }

  /**
   * Close app (alias for teardown for clarity)
   */
  async closeApp(): Promise<void> {
    return this.teardown();
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
      // Get the video path from Playwright
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
