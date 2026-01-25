/**
 * Visual Regression Testing Utilities
 * Handles baseline management and screenshot comparison
 */

import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import type { VisualComparisonResult } from '@ankr/testerbot-core';

export interface VisualRegressionConfig {
  /** Base directory for baseline images */
  baselineDir: string;

  /** Directory for diff images */
  diffDir: string;

  /** Threshold for pixel difference (0-1, default 0.1) */
  threshold?: number;

  /** Percentage of pixels that can differ before failure (0-100, default 0.1) */
  failureThreshold?: number;
}

export class VisualRegression {
  private config: Required<VisualRegressionConfig>;

  constructor(config: VisualRegressionConfig) {
    this.config = {
      threshold: 0.1,
      failureThreshold: 0.1,
      ...config
    };

    // Ensure directories exist
    if (!fs.existsSync(this.config.baselineDir)) {
      fs.mkdirSync(this.config.baselineDir, { recursive: true });
    }
    if (!fs.existsSync(this.config.diffDir)) {
      fs.mkdirSync(this.config.diffDir, { recursive: true });
    }
  }

  /**
   * Get baseline image path for a test
   */
  getBaselinePath(testId: string, platform: string = 'default'): string {
    return path.join(this.config.baselineDir, platform, `${testId}.png`);
  }

  /**
   * Save screenshot as baseline
   */
  saveBaseline(testId: string, screenshotPath: string, platform: string = 'default'): void {
    const baselinePath = this.getBaselinePath(testId, platform);
    const baselineDir = path.dirname(baselinePath);

    if (!fs.existsSync(baselineDir)) {
      fs.mkdirSync(baselineDir, { recursive: true });
    }

    fs.copyFileSync(screenshotPath, baselinePath);
  }

  /**
   * Check if baseline exists for a test
   */
  hasBaseline(testId: string, platform: string = 'default'): boolean {
    const baselinePath = this.getBaselinePath(testId, platform);
    return fs.existsSync(baselinePath);
  }

  /**
   * Compare screenshot against baseline
   */
  async compare(
    testId: string,
    currentScreenshotPath: string,
    platform: string = 'default'
  ): Promise<VisualComparisonResult> {
    const baselinePath = this.getBaselinePath(testId, platform);

    if (!fs.existsSync(baselinePath)) {
      throw new Error(`Baseline not found for test ${testId}. Run with --update-baseline to create it.`);
    }

    // Read images
    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
    const current = PNG.sync.read(fs.readFileSync(currentScreenshotPath));

    // Check dimensions match
    if (baseline.width !== current.width || baseline.height !== current.height) {
      throw new Error(
        `Image dimensions don't match: baseline ${baseline.width}x${baseline.height} vs current ${current.width}x${current.height}`
      );
    }

    // Create diff image
    const { width, height } = baseline;
    const diff = new PNG({ width, height });

    // Compare pixels
    const diffPixels = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      width,
      height,
      { threshold: this.config.threshold }
    );

    const totalPixels = width * height;
    const diffPercentage = (diffPixels / totalPixels) * 100;

    // Save diff image if there are differences
    let diffImagePath: string | undefined;
    if (diffPixels > 0) {
      diffImagePath = path.join(
        this.config.diffDir,
        platform,
        `${testId}-diff.png`
      );

      const diffDir = path.dirname(diffImagePath);
      if (!fs.existsSync(diffDir)) {
        fs.mkdirSync(diffDir, { recursive: true });
      }

      fs.writeFileSync(diffImagePath, PNG.sync.write(diff));
    }

    return {
      matches: diffPercentage <= this.config.failureThreshold,
      diffPixels,
      diffPercentage,
      diffImagePath,
      baselinePath,
      currentPath: currentScreenshotPath
    };
  }

  /**
   * Delete baseline for a test
   */
  deleteBaseline(testId: string, platform: string = 'default'): void {
    const baselinePath = this.getBaselinePath(testId, platform);
    if (fs.existsSync(baselinePath)) {
      fs.unlinkSync(baselinePath);
    }
  }

  /**
   * List all baselines
   */
  listBaselines(platform: string = 'default'): string[] {
    const platformDir = path.join(this.config.baselineDir, platform);
    if (!fs.existsSync(platformDir)) {
      return [];
    }

    return fs.readdirSync(platformDir)
      .filter(file => file.endsWith('.png'))
      .map(file => file.replace('.png', ''));
  }
}
