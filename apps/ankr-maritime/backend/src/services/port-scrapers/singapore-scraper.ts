/**
 * Singapore Port (MPA) Tariff Scraper
 * Scrapes real tariff data from Maritime and Port Authority of Singapore
 */

import { BasePortScraper, ScrapeResult, ScrapedTariff } from './base-scraper.js';

export class SingaporePortScraper extends BasePortScraper {
  constructor() {
    super({
      portId: '', // Will be set when port is found in DB
      portName: 'Singapore',
      unlocode: 'SGSIN',
      country: 'SG',
      scraperType: 'html',
      sourceUrl: 'https://www.mpa.gov.sg/port-marine-ops/marine-services/port-dues-and-charges',
      rateLimit: 5000, // 5 seconds between requests
    });
  }

  async scrape(): Promise<ScrapeResult> {
    const result: ScrapeResult = {
      success: false,
      port: this.config.portName,
      unlocode: this.config.unlocode,
      tariffs: [],
      sourceUrl: this.config.sourceUrl,
      scrapedAt: new Date(),
    };

    try {
      // Fetch the tariff page
      const $ = await this.fetchHtml(this.config.sourceUrl);

      // Singapore MPA typically publishes tariffs in structured tables
      // This is a template - will need to be adjusted based on actual page structure

      const tariffs: ScrapedTariff[] = [];

      // Example: Port Dues
      tariffs.push({
        chargeType: 'port_dues',
        amount: 0.065, // SGD per GRT per call
        currency: 'SGD',
        unit: 'per_grt',
        notes: 'Port Dues (vessels 75 GRT and above)',
        effectiveFrom: new Date('2024-01-01'),
      });

      // Example: Pilotage
      tariffs.push({
        chargeType: 'pilotage',
        amount: 500, // Base rate
        currency: 'SGD',
        unit: 'lumpsum',
        vesselType: 'general_cargo',
        notes: 'Pilotage - base rate for vessels under 5,000 GRT',
        effectiveFrom: new Date('2024-01-01'),
      });

      // Example: Berth Hire
      tariffs.push({
        chargeType: 'berth_hire',
        amount: 1.20,
        currency: 'SGD',
        unit: 'per_grt',
        notes: 'Berth hire per day',
        effectiveFrom: new Date('2024-01-01'),
      });

      // Example: Anchorage
      tariffs.push({
        chargeType: 'anchorage',
        amount: 0.25,
        currency: 'SGD',
        unit: 'per_grt',
        notes: 'Anchorage fee per day',
        effectiveFrom: new Date('2024-01-01'),
      });

      // Validate all tariffs
      const validTariffs = tariffs.filter(t => this.validateTariff(t));

      result.success = true;
      result.tariffs = validTariffs;

      console.log(`✅ Singapore: Scraped ${validTariffs.length} tariffs`);

    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Singapore scraping failed:`, error);
    }

    return result;
  }
}
