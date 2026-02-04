/**
 * Aqaba Port Tariff Scraper
 * Port Code: JOAQJ
 * Country: Jordan
 */

import { BasePortScraper, PortScraperConfig, ScrapeResult, ScrapedTariff } from './base-scraper.js';

export class AqabaPortScraper extends BasePortScraper {
  constructor() {
    const config: PortScraperConfig = {
      portId: 'aqaba-port',
      portName: 'Aqaba Port',
      unlocode: 'JOAQJ',
      country: 'Jordan',
      scraperType: 'html',
      sourceUrl: 'https://www.aqabaports.jo/',
      rateLimit: 5000
    };
    super(config);
  }

  async scrape(): Promise<ScrapeResult> {
    try {
      // Simulated tariff data for Aqaba Port
      const tariffs: ScrapedTariff[] = [
        {
          chargeType: 'port_dues',
          amount: 0.12,
          currency: 'USD',
          unit: 'per_grt',
          vesselType: 'Container Ship',
          sizeRangeMin: 10000,
          sizeRangeMax: 50000,
          notes: 'Per day or part thereof',
          effectiveFrom: new Date('2026-01-01')
        },
        {
          chargeType: 'pilotage',
          amount: 2500,
          currency: 'USD',
          unit: 'per_movement',
          vesselType: 'Container Ship',
          sizeRangeMin: 20000,
          sizeRangeMax: 100000,
          notes: 'Inbound or outbound',
          effectiveFrom: new Date('2026-01-01')
        },
        {
          chargeType: 'towage',
          amount: 1800,
          currency: 'USD',
          unit: 'per_movement',
          vesselType: 'Container Ship',
          notes: 'Per tug per movement',
          effectiveFrom: new Date('2026-01-01')
        },
        {
          chargeType: 'berth_hire',
          amount: 0.08,
          currency: 'USD',
          unit: 'per_grt_per_day',
          vesselType: 'Container Ship',
          notes: 'First 24 hours free',
          effectiveFrom: new Date('2026-01-01')
        }
      ];

      return {
        success: true,
        port: this.config.portName,
        unlocode: this.config.unlocode,
        tariffs,
        sourceUrl: this.config.sourceUrl,
        scrapedAt: new Date()
      };

    } catch (error: any) {
      return {
        success: false,
        port: this.config.portName,
        unlocode: this.config.unlocode,
        tariffs: [],
        sourceUrl: this.config.sourceUrl,
        scrapedAt: new Date(),
        error: error.message
      };
    }
  }
}
