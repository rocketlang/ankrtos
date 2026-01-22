/**
 * Mobile Test Agent - For iOS and Android apps using Appium
 */

import { TestAgent } from './base-agent';
import { remote, RemoteOptions } from 'webdriverio';
import * as path from 'path';
import * as fs from 'fs';

export type PlatformType = 'iOS' | 'Android';

export interface MobileAgentConfig {
  /** Platform (iOS or Android) */
  platform: PlatformType;

  /** Device name */
  deviceName?: string;

  /** Platform version */
  platformVersion?: string;

  /** App path (absolute path to .app or .apk) */
  appPath?: string;

  /** Bundle ID (iOS) or Package name (Android) */
  bundleId?: string;

  /** Appium server URL */
  appiumUrl?: string;

  /** Screenshots output directory */
  screenshotsDir?: string;

  /** Videos output directory */
  videosDir?: string;

  /** Use simulator/emulator */
  useSimulator?: boolean;

  /** UDID for real device */
  udid?: string;

  /** Additional capabilities */
  capabilities?: Record<string, any>;
}

export class MobileTestAgent extends TestAgent {
  private driver: WebdriverIO.Browser | null = null;
  private consoleErrors: string[] = [];
  private config: MobileAgentConfig;
  private isRecording: boolean = false;
  private currentVideoName: string | null = null;
  private setupStartTime: number = 0;
  private setupEndTime: number = 0;

  constructor(config: MobileAgentConfig) {
    super();
    this.config = {
      appiumUrl: 'http://localhost:4723',
      screenshotsDir: './screenshots',
      videosDir: './videos',
      useSimulator: true,
      ...config
    };
  }

  /**
   * Launch mobile app
   */
  async setup(): Promise<void> {
    this.setupStartTime = Date.now();

    const capabilities = this.buildCapabilities();

    const options: RemoteOptions = {
      protocol: 'http',
      hostname: 'localhost',
      port: 4723,
      path: '/',
      capabilities
    };

    // Create WebDriver session
    this.driver = await remote(options);

    // Wait for app to launch
    await this.wait(3000);

    this.setupEndTime = Date.now();
  }

  /**
   * Build Appium capabilities
   */
  private buildCapabilities(): any {
    const baseCapabilities: Record<string, any> = {
      platformName: this.config.platform,
      'appium:automationName': this.config.platform === 'iOS' ? 'XCUITest' : 'UiAutomator2',
      'appium:deviceName': this.config.deviceName || (this.config.platform === 'iOS' ? 'iPhone 15' : 'Android Emulator'),
      'appium:platformVersion': this.config.platformVersion || (this.config.platform === 'iOS' ? '17.0' : '13.0'),
      'appium:noReset': false,
      'appium:newCommandTimeout': 300,
      ...this.config.capabilities
    };

    // Add app path if provided
    if (this.config.appPath) {
      baseCapabilities['appium:app'] = this.config.appPath;
    }

    // Add bundle ID if provided
    if (this.config.bundleId) {
      if (this.config.platform === 'iOS') {
        baseCapabilities['appium:bundleId'] = this.config.bundleId;
      } else {
        baseCapabilities['appium:appPackage'] = this.config.bundleId;
      }
    }

    // Add UDID for real device
    if (this.config.udid) {
      baseCapabilities['appium:udid'] = this.config.udid;
    }

    return baseCapabilities;
  }

  /**
   * Close mobile app
   */
  async teardown(): Promise<void> {
    if (this.driver) {
      try {
        await this.driver.deleteSession();
      } catch (err) {
        console.error('Error closing session:', err);
      }
      this.driver = null;
    }
  }

  /**
   * Wait for element (supports iOS and Android selectors)
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<any> {
    if (!this.driver) throw new Error('Driver not initialized');

    // Support both accessibility ID and XPath
    let element;
    if (selector.startsWith('~')) {
      // Accessibility ID
      const accessibilityId = selector.substring(1);
      element = await this.driver.$(`~${accessibilityId}`);
    } else if (selector.startsWith('//')) {
      // XPath
      element = await this.driver.$(selector);
    } else {
      // Try as accessibility ID by default
      element = await this.driver.$(`~${selector}`);
    }

    await element.waitForExist({ timeout });
    return element;
  }

  /**
   * Click/Tap element
   */
  async click(selector: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.click();
  }

  /**
   * Type text into element
   */
  async type(selector: string, text: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.setValue(text);
  }

  /**
   * Get text content
   */
  async getText(selector: string): Promise<string> {
    const element = await this.waitForElement(selector);
    return await element.getText();
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      const element = await this.waitForElement(selector, 5000);
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Find multiple elements
   */
  async findElements(selector: string): Promise<any> {
    if (!this.driver) throw new Error('Driver not initialized');

    if (selector.startsWith('~')) {
      const accessibilityId = selector.substring(1);
      return await this.driver.$$(`~${accessibilityId}`);
    } else if (selector.startsWith('//')) {
      return await this.driver.$$(selector);
    } else {
      return await this.driver.$$(`~${selector}`);
    }
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name?: string): Promise<string> {
    if (!this.driver) throw new Error('Driver not initialized');

    // Ensure screenshots directory exists
    if (!fs.existsSync(this.config.screenshotsDir!)) {
      fs.mkdirSync(this.config.screenshotsDir!, { recursive: true });
    }

    const filename = name || `screenshot-${Date.now()}.png`;
    const filepath = path.join(this.config.screenshotsDir!, filename);

    const screenshot = await this.driver.takeScreenshot();
    fs.writeFileSync(filepath, screenshot, 'base64');

    return filepath;
  }

  /**
   * Get console errors (limited on mobile)
   */
  async getConsoleErrors(): Promise<string[]> {
    // Mobile platforms don't expose console logs easily
    // Return collected errors if any
    return [...this.consoleErrors];
  }

  /**
   * Swipe gesture
   */
  async swipe(direction: 'up' | 'down' | 'left' | 'right', duration: number = 500): Promise<void> {
    if (!this.driver) throw new Error('Driver not initialized');

    const { width, height } = await this.driver.getWindowSize();

    let startX, startY, endX, endY;

    switch (direction) {
      case 'up':
        startX = width / 2;
        startY = height * 0.8;
        endX = width / 2;
        endY = height * 0.2;
        break;
      case 'down':
        startX = width / 2;
        startY = height * 0.2;
        endX = width / 2;
        endY = height * 0.8;
        break;
      case 'left':
        startX = width * 0.8;
        startY = height / 2;
        endX = width * 0.2;
        endY = height / 2;
        break;
      case 'right':
        startX = width * 0.2;
        startY = height / 2;
        endX = width * 0.8;
        endY = height / 2;
        break;
    }

    await this.driver.touchPerform([
      { action: 'press', options: { x: startX, y: startY } },
      { action: 'wait', options: { ms: duration } },
      { action: 'moveTo', options: { x: endX, y: endY } },
      { action: 'release', options: {} }
    ]);
  }

  /**
   * Tap at coordinates
   */
  async tapAt(x: number, y: number): Promise<void> {
    if (!this.driver) throw new Error('Driver not initialized');

    await this.driver.touchPerform([
      { action: 'tap', options: { x, y } }
    ]);
  }

  /**
   * Long press element
   */
  async longPress(selector: string, duration: number = 1000): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.touchAction([
      { action: 'press' },
      { action: 'wait', ms: duration },
      { action: 'release' }
    ]);
  }

  /**
   * Get current activity (Android) or screen (iOS)
   */
  async getCurrentScreen(): Promise<string> {
    if (!this.driver) throw new Error('Driver not initialized');

    if (this.config.platform === 'Android') {
      return await this.driver.getCurrentActivity();
    } else {
      // For iOS, get current page source as identifier
      const source = await this.driver.getPageSource();
      return source.substring(0, 100); // First 100 chars as identifier
    }
  }

  /**
   * Press device back button (Android only)
   */
  async pressBack(): Promise<void> {
    if (!this.driver) throw new Error('Driver not initialized');

    if (this.config.platform === 'Android') {
      await this.driver.pressKeyCode(4); // Back button key code
    } else {
      throw new Error('Back button not supported on iOS');
    }
  }

  /**
   * Press home button
   */
  async pressHome(): Promise<void> {
    if (!this.driver) throw new Error('Driver not initialized');

    if (this.config.platform === 'Android') {
      await this.driver.pressKeyCode(3); // Home button key code
    } else {
      // iOS home button simulation
      await this.driver.execute('mobile: pressButton', { name: 'home' });
    }
  }

  /**
   * Rotate device
   */
  async rotate(orientation: 'PORTRAIT' | 'LANDSCAPE'): Promise<void> {
    if (!this.driver) throw new Error('Driver not initialized');

    await this.driver.setOrientation(orientation);
  }

  /**
   * Get device orientation
   */
  async getOrientation(): Promise<string> {
    if (!this.driver) throw new Error('Driver not initialized');

    return await this.driver.getOrientation();
  }

  /**
   * Check if keyboard is shown
   */
  async isKeyboardShown(): Promise<boolean> {
    if (!this.driver) throw new Error('Driver not initialized');

    return await this.driver.isKeyboardShown();
  }

  /**
   * Hide keyboard
   */
  async hideKeyboard(): Promise<void> {
    if (!this.driver) throw new Error('Driver not initialized');

    try {
      await this.driver.hideKeyboard();
    } catch {
      // Keyboard might not be shown
    }
  }

  /**
   * Scroll to element (using scroll gesture)
   */
  async scrollToElement(selector: string, maxScrolls: number = 5): Promise<void> {
    for (let i = 0; i < maxScrolls; i++) {
      const visible = await this.isElementVisible(selector);
      if (visible) return;

      await this.swipe('up', 300);
      await this.wait(500);
    }

    throw new Error(`Element not found after ${maxScrolls} scrolls: ${selector}`);
  }

  /**
   * Get app state
   */
  async getAppState(): Promise<string> {
    if (!this.driver) throw new Error('Driver not initialized');

    // 0 = not installed, 1 = not running, 2 = background, 3 = background suspended, 4 = foreground
    const state = await this.driver.execute('mobile: queryAppState', {
      bundleId: this.config.bundleId
    });

    return String(state);
  }

  /**
   * Launch app (if not already launched)
   */
  async launchApp(): Promise<void> {
    if (!this.driver) throw new Error('Driver not initialized');

    await this.driver.execute('mobile: launchApp', {});
  }

  /**
   * Terminate app
   */
  async terminateApp(): Promise<void> {
    if (!this.driver) throw new Error('Driver not initialized');

    await this.driver.execute('mobile: terminateApp', {
      bundleId: this.config.bundleId
    });
  }

  /**
   * Start video recording
   */
  async startVideoRecording(name?: string): Promise<void> {
    if (!this.driver) throw new Error('Driver not initialized');

    this.isRecording = true;
    this.currentVideoName = name || `video-${Date.now()}`;

    // Ensure videos directory exists
    if (!fs.existsSync(this.config.videosDir!)) {
      fs.mkdirSync(this.config.videosDir!, { recursive: true });
    }

    try {
      // Start screen recording using Appium
      await this.driver.startRecordingScreen({
        videoQuality: 'medium',
        videoFps: 30,
        timeLimit: '180' // 3 minutes max
      });
    } catch (error) {
      console.error('Error starting video recording:', error);
      this.isRecording = false;
    }
  }

  /**
   * Stop video recording and return path (or null if not saved)
   */
  async stopVideoRecording(save: boolean = false): Promise<string | null> {
    if (!this.isRecording || !this.driver) {
      return null;
    }

    this.isRecording = false;

    try {
      // Stop screen recording and get base64 video
      const videoBase64 = await this.driver.stopRecordingScreen();

      if (save && videoBase64) {
        // Save video to file
        const filename = `${this.currentVideoName}.mp4`;
        const filepath = path.join(this.config.videosDir!, filename);

        // Decode base64 and write to file
        const videoBuffer = Buffer.from(videoBase64, 'base64');
        fs.writeFileSync(filepath, videoBuffer);

        return filepath;
      }

      return null;
    } catch (error) {
      console.error('Error stopping video recording:', error);
      return null;
    } finally {
      this.currentVideoName = null;
    }
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

    // Memory usage (not easily available via Appium)
    // CPU usage (not easily available via Appium)
    // FPS (not easily available via Appium)

    return metrics;
  }
}
