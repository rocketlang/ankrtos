/**
 * Base Test Agent - Abstract class for all test agents
 */

export abstract class TestAgent {
  /**
   * Setup agent before running tests
   */
  abstract setup(): Promise<void>;

  /**
   * Teardown agent after running tests
   */
  abstract teardown(): Promise<void>;

  /**
   * Wait for an element to appear
   */
  abstract waitForElement(selector: string, timeout?: number): Promise<any>;

  /**
   * Click an element
   */
  abstract click(selector: string): Promise<void>;

  /**
   * Type text into an element
   */
  abstract type(selector: string, text: string): Promise<void>;

  /**
   * Get text content of an element
   */
  abstract getText(selector: string): Promise<string>;

  /**
   * Check if element exists
   */
  abstract isElementVisible(selector: string): Promise<boolean>;

  /**
   * Find multiple elements
   */
  abstract findElements(selector: string): Promise<any[]>;

  /**
   * Take a screenshot
   */
  abstract takeScreenshot(name?: string): Promise<string>;

  /**
   * Get console errors
   */
  abstract getConsoleErrors(): Promise<string[]>;

  /**
   * Start video recording
   */
  abstract startVideoRecording(name?: string): Promise<void>;

  /**
   * Stop video recording and return path
   * @param save - Whether to save the video (false will discard it)
   */
  abstract stopVideoRecording(save?: boolean): Promise<string | null>;

  /**
   * Get performance metrics
   */
  abstract getPerformanceMetrics(): Promise<{
    startupTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    networkLatency?: number;
    fps?: number;
  }>;

  /**
   * Take screenshot for visual regression testing
   * @param name - Name for the screenshot (usually test ID)
   * @returns Path to saved screenshot
   */
  async takeVisualSnapshot(name: string): Promise<string> {
    return await this.takeScreenshot(name);
  }

  /**
   * Wait for specified time
   */
  wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
