/**
 * PDF Downloader Service - Week 3 Day 1
 * Downloads PDF tariff documents from port authority websites
 *
 * Features:
 * - Puppeteer-based PDF download (handles JavaScript-rendered content)
 * - Axios fallback for direct PDF links
 * - SHA-256 change detection
 * - File validation
 * - Error handling with retries
 */

import puppeteer from 'puppeteer';
import axios from 'axios';
import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';

export interface PDFDownloadOptions {
  url: string;
  portId: string;
  outputDir?: string;
  timeout?: number;
  retries?: number;
  userAgent?: string;
}

export interface PDFDownloadResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  hash?: string;
  downloadTime: number;
  method: 'puppeteer' | 'axios' | 'cached';
  error?: string;
  changeDetected: boolean;
  previousHash?: string;
}

export class PDFDownloaderService {
  private readonly DEFAULT_OUTPUT_DIR = '/root/apps/ankr-maritime/tariff-pdfs';
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly DEFAULT_USER_AGENT = 'Mari8X-TariffBot/1.0 (https://mari8x.com; compliance@mari8x.com)';

  /**
   * Download PDF from URL
   * Tries axios first (faster), falls back to puppeteer if needed
   */
  async downloadPDF(options: PDFDownloadOptions): Promise<PDFDownloadResult> {
    const startTime = Date.now();
    const outputDir = options.outputDir || this.DEFAULT_OUTPUT_DIR;
    const retries = options.retries || 2;

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const fileName = `${options.portId}-${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    // Try different download methods
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Method 1: Direct download with axios (faster)
        if (options.url.endsWith('.pdf')) {
          const result = await this.downloadWithAxios(options.url, filePath, options.userAgent);
          if (result.success) {
            const changeDetection = await this.detectChange(filePath, options.portId);
            return {
              ...result,
              downloadTime: Date.now() - startTime,
              ...changeDetection,
            };
          }
        }

        // Method 2: Puppeteer (handles JavaScript-rendered pages)
        const result = await this.downloadWithPuppeteer(options.url, filePath, options.timeout, options.userAgent);
        if (result.success) {
          const changeDetection = await this.detectChange(filePath, options.portId);
          return {
            ...result,
            downloadTime: Date.now() - startTime,
            ...changeDetection,
          };
        }
      } catch (error: any) {
        console.error(`❌ Download attempt ${attempt}/${retries} failed: ${error.message}`);

        if (attempt === retries) {
          return {
            success: false,
            downloadTime: Date.now() - startTime,
            method: 'axios',
            error: error.message,
            changeDetected: false,
          };
        }

        // Wait before retry
        await this.sleep(5000 * attempt);
      }
    }

    return {
      success: false,
      downloadTime: Date.now() - startTime,
      method: 'axios',
      error: 'All download attempts failed',
      changeDetected: false,
    };
  }

  /**
   * Download PDF using axios (direct link)
   */
  private async downloadWithAxios(
    url: string,
    filePath: string,
    userAgent?: string
  ): Promise<{ success: boolean; filePath?: string; fileSize?: number; method: 'axios'; error?: string }> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: this.DEFAULT_TIMEOUT,
        headers: {
          'User-Agent': userAgent || this.DEFAULT_USER_AGENT,
        },
      });

      // Validate content type
      const contentType = response.headers['content-type'];
      if (!contentType?.includes('pdf')) {
        throw new Error(`Expected PDF but got: ${contentType}`);
      }

      // Write file
      await fs.writeFile(filePath, response.data);

      // Validate file
      const stats = await fs.stat(filePath);
      if (stats.size < 1024) {
        throw new Error('Downloaded file is too small (< 1KB)');
      }

      console.log(`✅ Downloaded via axios: ${filePath} (${(stats.size / 1024).toFixed(2)} KB)`);

      return {
        success: true,
        filePath,
        fileSize: stats.size,
        method: 'axios',
      };
    } catch (error: any) {
      return {
        success: false,
        method: 'axios',
        error: error.message,
      };
    }
  }

  /**
   * Download PDF using puppeteer (handles JavaScript)
   */
  private async downloadWithPuppeteer(
    url: string,
    filePath: string,
    timeout?: number,
    userAgent?: string
  ): Promise<{ success: boolean; filePath?: string; fileSize?: number; method: 'puppeteer'; error?: string }> {
    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      // Set user agent
      await page.setUserAgent(userAgent || this.DEFAULT_USER_AGENT);

      // Navigate to page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: timeout || this.DEFAULT_TIMEOUT,
      });

      // Check if it's a PDF page or has a download link
      const isPDFPage = await page.evaluate(() => {
        return document.contentType === 'application/pdf' ||
               document.querySelector('embed[type="application/pdf"]') !== null;
      });

      if (isPDFPage) {
        // Direct PDF - save the page
        const pdfBuffer = await page.pdf({ format: 'A4' });
        await fs.writeFile(filePath, pdfBuffer);
      } else {
        // Look for download link
        const pdfLink = await page.$eval('a[href$=".pdf"]', el => el.getAttribute('href'));
        if (pdfLink) {
          const fullUrl = new URL(pdfLink, url).href;
          await browser.close();
          return this.downloadWithAxios(fullUrl, filePath, userAgent);
        } else {
          throw new Error('No PDF found on page');
        }
      }

      await browser.close();

      // Validate file
      const stats = await fs.stat(filePath);
      if (stats.size < 1024) {
        throw new Error('Downloaded file is too small (< 1KB)');
      }

      console.log(`✅ Downloaded via puppeteer: ${filePath} (${(stats.size / 1024).toFixed(2)} KB)`);

      return {
        success: true,
        filePath,
        fileSize: stats.size,
        method: 'puppeteer',
      };
    } catch (error: any) {
      if (browser) {
        await browser.close();
      }

      return {
        success: false,
        method: 'puppeteer',
        error: error.message,
      };
    }
  }

  /**
   * Detect if PDF has changed since last download (SHA-256 hash comparison)
   */
  private async detectChange(
    filePath: string,
    portId: string
  ): Promise<{ changeDetected: boolean; hash: string; previousHash?: string }> {
    try {
      // Calculate current file hash
      const fileBuffer = await fs.readFile(filePath);
      const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Check for previous hash (stored in a tracking file)
      const hashTrackingFile = path.join(
        path.dirname(filePath),
        `${portId}-hashes.json`
      );

      let previousHash: string | undefined;
      try {
        const trackingData = await fs.readFile(hashTrackingFile, 'utf-8');
        const tracking = JSON.parse(trackingData);
        previousHash = tracking.lastHash;
      } catch {
        // No previous hash, this is the first download
      }

      // Update tracking file
      await fs.writeFile(
        hashTrackingFile,
        JSON.stringify({
          lastHash: currentHash,
          lastUpdated: new Date().toISOString(),
          portId,
        }, null, 2)
      );

      const changeDetected = !previousHash || previousHash !== currentHash;

      if (changeDetected && previousHash) {
        console.log(`🔄 Change detected for ${portId}`);
        console.log(`   Previous: ${previousHash.substring(0, 8)}...`);
        console.log(`   Current:  ${currentHash.substring(0, 8)}...`);
      }

      return {
        changeDetected,
        hash: currentHash,
        previousHash,
      };
    } catch (error: any) {
      console.error(`⚠️  Change detection failed: ${error.message}`);
      return {
        changeDetected: true, // Assume changed if detection fails
        hash: '',
      };
    }
  }

  /**
   * Clean old PDFs (keep last N versions)
   */
  async cleanOldPDFs(portId: string, keepVersions: number = 3): Promise<number> {
    try {
      const outputDir = this.DEFAULT_OUTPUT_DIR;
      const files = await fs.readdir(outputDir);

      // Filter files for this port
      const portFiles = files
        .filter(f => f.startsWith(portId) && f.endsWith('.pdf'))
        .map(f => ({
          name: f,
          path: path.join(outputDir, f),
        }));

      // Sort by modification time (newest first)
      const sortedFiles = await Promise.all(
        portFiles.map(async f => ({
          ...f,
          mtime: (await fs.stat(f.path)).mtime,
        }))
      );
      sortedFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Delete old versions
      const toDelete = sortedFiles.slice(keepVersions);
      for (const file of toDelete) {
        await fs.unlink(file.path);
        console.log(`🗑️  Deleted old PDF: ${file.name}`);
      }

      return toDelete.length;
    } catch (error: any) {
      console.error(`⚠️  Failed to clean old PDFs: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get latest PDF for port
   */
  async getLatestPDF(portId: string): Promise<string | null> {
    try {
      const outputDir = this.DEFAULT_OUTPUT_DIR;
      const files = await fs.readdir(outputDir);

      const portFiles = files
        .filter(f => f.startsWith(portId) && f.endsWith('.pdf'))
        .map(f => path.join(outputDir, f));

      if (portFiles.length === 0) {
        return null;
      }

      // Get most recent file
      const sortedFiles = await Promise.all(
        portFiles.map(async f => ({
          path: f,
          mtime: (await fs.stat(f)).mtime,
        }))
      );
      sortedFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      return sortedFiles[0].path;
    } catch (error: any) {
      console.error(`⚠️  Failed to get latest PDF: ${error.message}`);
      return null;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let pdfDownloaderService: PDFDownloaderService | null = null;

export function getPDFDownloaderService(): PDFDownloaderService {
  if (!pdfDownloaderService) {
    pdfDownloaderService = new PDFDownloaderService();
  }
  return pdfDownloaderService;
}
