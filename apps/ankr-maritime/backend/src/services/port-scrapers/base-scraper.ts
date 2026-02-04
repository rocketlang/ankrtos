/**
 * Base Port Scraper
 * Framework for scraping real port tariff data
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface PortScraperConfig {
  portId: string;
  portName: string;
  unlocode: string;
  country: string;
  scraperType: 'html' | 'pdf' | 'api' | 'excel' | 'manual';
  sourceUrl: string;
  userAgent?: string;
  rateLimit?: number; // milliseconds between requests
}

export interface ScrapedTariff {
  chargeType: string;
  amount: number;
  currency: string;
  unit: string;
  vesselType?: string | null;
  sizeRangeMin?: number | null;
  sizeRangeMax?: number | null;
  notes?: string | null;
  effectiveFrom?: Date;
  effectiveTo?: Date | null;
}

export interface ScrapeResult {
  success: boolean;
  port: string;
  unlocode: string;
  tariffs: ScrapedTariff[];
  sourceUrl: string;
  scrapedAt: Date;
  error?: string;
}

export abstract class BasePortScraper {
  protected config: PortScraperConfig;
  protected axios;

  constructor(config: PortScraperConfig) {
    this.config = config;
    this.axios = axios.create({
      headers: {
        'User-Agent': config.userAgent || 'Mari8X-TariffBot/1.0 (https://mari8x.com; compliance@mari8x.com)',
      },
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Main scraping method - must be implemented by each port scraper
   */
  abstract scrape(): Promise<ScrapeResult>;

  /**
   * Validate scraped tariff data
   */
  protected validateTariff(tariff: ScrapedTariff): boolean {
    // Amount must be positive number
    if (!tariff.amount || tariff.amount < 0) return false;

    // Charge type must be non-empty
    if (!tariff.chargeType || tariff.chargeType.trim() === '') return false;

    // Currency must be valid ISO code (3 letters)
    if (!tariff.currency || tariff.currency.length !== 3) return false;

    // Unit must be specified
    if (!tariff.unit || tariff.unit.trim() === '') return false;

    return true;
  }

  /**
   * Normalize charge type to standard categories
   */
  protected normalizeChargeType(rawType: string): string {
    const normalized = rawType.toLowerCase().trim();

    // Mapping of common variations to standard types
    const mappings: Record<string, string> = {
      'port dues': 'port_dues',
      'port due': 'port_dues',
      'harbour dues': 'port_dues',
      'pilotage': 'pilotage',
      'pilot': 'pilotage',
      'towage': 'towage',
      'tug': 'towage',
      'berth hire': 'berth_hire',
      'berth': 'berth_hire',
      'wharfage': 'berth_hire',
      'anchorage': 'anchorage',
      'anchor': 'anchorage',
      'light dues': 'light_dues',
      'lighthouse': 'light_dues',
      'mooring': 'mooring',
      'unmooring': 'unmooring',
      'agency fee': 'agency_fee',
      'agent': 'agency_fee',
      'canal dues': 'canal_dues',
      'canal': 'canal_dues',
      'cargo handling': 'cargo_handling',
      'stevedoring': 'cargo_handling',
    };

    for (const [key, value] of Object.entries(mappings)) {
      if (normalized.includes(key)) {
        return value;
      }
    }

    // If no mapping found, return sanitized version
    return normalized.replace(/[^a-z0-9_]/g, '_');
  }

  /**
   * Normalize currency code
   */
  protected normalizeCurrency(currency: string): string {
    const curr = currency.toUpperCase().trim();

    // Common currency mappings
    const mappings: Record<string, string> = {
      'RS': 'INR',
      'RUPEES': 'INR',
      'RUPEE': 'INR',
      'DOLLARS': 'USD',
      'DOLLAR': 'USD',
      'EUROS': 'EUR',
      'EURO': 'EUR',
      'YEN': 'JPY',
      'POUNDS': 'GBP',
      'POUND': 'GBP',
      'AED': 'AED', // UAE Dirham
      'SAR': 'SAR', // Saudi Riyal
      'LKR': 'LKR', // Sri Lankan Rupee
      'SGD': 'SGD', // Singapore Dollar
    };

    return mappings[curr] || curr;
  }

  /**
   * Normalize unit of measurement
   */
  protected normalizeUnit(unit: string): string {
    const normalized = unit.toLowerCase().trim();

    const mappings: Record<string, string> = {
      'grt': 'per_grt',
      'per grt': 'per_grt',
      'per gross tonnage': 'per_grt',
      'nrt': 'per_nrt',
      'per nrt': 'per_nrt',
      'per net tonnage': 'per_nrt',
      'mt': 'per_mt',
      'per metric ton': 'per_mt',
      'per ton': 'per_mt',
      'ton': 'per_mt',
      'lumpsum': 'lumpsum',
      'flat': 'lumpsum',
      'hour': 'per_hour',
      'per hour': 'per_hour',
      'day': 'per_day',
      'per day': 'per_day',
      'call': 'per_call',
      'per call': 'per_call',
      'visit': 'per_call',
    };

    return mappings[normalized] || 'lumpsum';
  }

  /**
   * Fetch HTML content with rate limiting
   */
  protected async fetchHtml(url: string): Promise<cheerio.CheerioAPI> {
    // Rate limiting
    if (this.config.rateLimit) {
      await this.sleep(this.config.rateLimit);
    }

    const response = await this.axios.get(url);
    return cheerio.load(response.data);
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse amount from string (handles formats like "$1,234.56" or "1234.56 USD")
   */
  protected parseAmount(amountStr: string): number {
    // Remove currency symbols and commas
    const cleaned = amountStr.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Get port scraper info
   */
  getInfo(): PortScraperConfig {
    return this.config;
  }
}
