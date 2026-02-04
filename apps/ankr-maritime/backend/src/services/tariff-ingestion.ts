/**
 * Port Tariff Ingestion Pipeline
 * Automates extraction of tariff data from PDF documents
 */

import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';

export interface TariffDocument {
  portId: string;
  portName: string;
  effectiveDate: Date;
  expiryDate?: Date;
  currency: string;
  sourceUrl?: string;
  documentPath: string;
}

export interface TariffLineItem {
  category: string;
  description: string;
  unit: string;
  rate: number;
  currency: string;
  vesselTypeApplicable?: string;
  sizeRangeMin?: number;
  sizeRangeMax?: number;
  notes?: string;
}

export class TariffIngestionService {
  /**
   * Ingest tariff document (PDF → structured data)
   */
  async ingestTariffDocument(
    document: TariffDocument,
    organizationId: string
  ): Promise<{ success: boolean; itemsImported: number; errors: string[] }> {
    const errors: string[] = [];
    let itemsImported = 0;

    try {
      // Step 1: Extract text from PDF
      const extractedText = await this.extractTextFromPDF(document.documentPath);

      // Step 2: Parse tariff structure
      const lineItems = await this.parseTariffText(extractedText, document.currency);

      // Step 3: Validate and deduplicate
      const validItems = this.validateLineItems(lineItems, errors);

      // Step 4: Store in database
      for (const item of validItems) {
        try {
          await prisma.portTariff.create({
            data: {
              portId: document.portId,
              category: item.category,
              description: item.description,
              chargeType: this.mapCategoryToChargeType(item.category),
              unit: item.unit,
              rate: item.rate,
              currency: item.currency,
              vesselType: item.vesselTypeApplicable,
              sizeRangeMin: item.sizeRangeMin,
              sizeRangeMax: item.sizeRangeMax,
              effectiveDate: document.effectiveDate,
              expiryDate: document.expiryDate,
              notes: item.notes,
              source: 'ingested',
              sourceUrl: document.sourceUrl,
              organizationId,
            },
          });
          itemsImported++;
        } catch (error: any) {
          errors.push(`Failed to import item "${item.description}": ${error.message}`);
        }
      }

      // Step 5: Create ingestion log
      await prisma.tariffIngestionLog.create({
        data: {
          portId: document.portId,
          portName: document.portName,
          documentPath: document.documentPath,
          effectiveDate: document.effectiveDate,
          itemsImported,
          errors: errors.length > 0 ? errors : null,
          status: errors.length > 0 ? 'partial' : 'success',
          organizationId,
          ingestedAt: new Date(),
        },
      });

      return { success: errors.length === 0, itemsImported, errors };
    } catch (error: any) {
      errors.push(`Critical error: ${error.message}`);
      return { success: false, itemsImported: 0, errors };
    }
  }

  /**
   * Extract text from PDF document
   */
  private async extractTextFromPDF(filePath: string): Promise<string> {
    // TODO: Integrate with @ankr/ocr or pdf-parse library
    // For now, return placeholder

    // Example using pdf-parse:
    // const pdfParse = require('pdf-parse');
    // const dataBuffer = fs.readFileSync(filePath);
    // const data = await pdfParse(dataBuffer);
    // return data.text;

    console.log(`📄 Extracting text from: ${filePath}`);

    // Placeholder: Read sample tariff structure
    return `
PORT OF SINGAPORE TARIFF
Effective: 2026-01-01

VESSEL CHARGES
1. Port Dues: $0.50 per GRT
2. Pilotage (Inward): $2,500 per service
3. Pilotage (Outward): $2,500 per service
4. Towage: $1,200 per tug per hour
5. Berth Hire: $0.30 per GRT per day

CARGO CHARGES
6. Wharfage: $15 per ton
7. Storage: $5 per ton per day
8. Stevedoring: $25 per ton

SERVICES
9. Fresh Water: $8 per cubic meter
10. Garbage Disposal: $500 per call
    `;
  }

  /**
   * Parse tariff text into structured line items
   */
  private async parseTariffText(
    text: string,
    defaultCurrency: string
  ): Promise<TariffLineItem[]> {
    const lineItems: TariffLineItem[] = [];

    // Simple regex-based parsing (in production, use AI/ML)
    const lines = text.split('\n');
    let currentCategory = 'General';

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect category headers
      if (trimmed.endsWith('CHARGES') || trimmed.endsWith('SERVICES')) {
        currentCategory = trimmed;
        continue;
      }

      // Parse line items (format: "N. Description: $X per unit")
      const itemMatch = trimmed.match(/^(\d+)\.\s+(.+?):\s+\$?([\d,.]+)\s+per\s+(.+?)$/i);

      if (itemMatch) {
        const [_, number, description, rateStr, unit] = itemMatch;
        const rate = parseFloat(rateStr.replace(/,/g, ''));

        lineItems.push({
          category: currentCategory,
          description: description.trim(),
          unit: unit.trim(),
          rate,
          currency: defaultCurrency,
        });
      }
    }

    return lineItems;
  }

  /**
   * Validate line items
   */
  private validateLineItems(
    items: TariffLineItem[],
    errors: string[]
  ): TariffLineItem[] {
    return items.filter((item) => {
      if (!item.description || item.description.length < 3) {
        errors.push(`Invalid description: "${item.description}"`);
        return false;
      }

      if (!item.rate || item.rate <= 0) {
        errors.push(`Invalid rate for "${item.description}": ${item.rate}`);
        return false;
      }

      if (!item.unit) {
        errors.push(`Missing unit for "${item.description}"`);
        return false;
      }

      return true;
    });
  }

  /**
   * Map category to charge type enum
   */
  private mapCategoryToChargeType(category: string): string {
    const categoryMap: Record<string, string> = {
      'VESSEL CHARGES': 'port_dues',
      'CARGO CHARGES': 'wharfage',
      SERVICES: 'service_fee',
      PILOTAGE: 'pilotage',
      TOWAGE: 'towage',
      'BERTH HIRE': 'berth_hire',
    };

    const normalized = category.toUpperCase();
    return categoryMap[normalized] || 'other';
  }

  /**
   * Schedule quarterly tariff refresh
   */
  async scheduleTariffRefresh(portId: string, organizationId: string): Promise<void> {
    const port = await prisma.port.findUnique({ where: { id: portId } });
    if (!port) throw new Error('Port not found');

    // Create refresh task
    await prisma.tariffRefreshTask.create({
      data: {
        portId,
        portName: port.name,
        scheduledDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        status: 'scheduled',
        organizationId,
      },
    });

    console.log(`📅 Tariff refresh scheduled for ${port.name} in 90 days`);
  }

  /**
   * Get tariffs for port with FX conversion
   */
  async getPortTariffs(
    portId: string,
    targetCurrency: string = 'USD'
  ): Promise<
    Array<{
      id: string;
      description: string;
      rate: number;
      currency: string;
      rateInTargetCurrency: number;
      unit: string;
    }>
  > {
    const tariffs = await prisma.portTariff.findMany({
      where: {
        portId,
        effectiveDate: { lte: new Date() },
        OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
      },
      orderBy: { category: 'asc' },
    });

    // Convert to target currency
    const converted = await Promise.all(
      tariffs.map(async (tariff) => {
        const rateInTargetCurrency =
          tariff.currency === targetCurrency
            ? tariff.rate
            : await this.convertCurrency(tariff.rate, tariff.currency, targetCurrency);

        return {
          id: tariff.id,
          description: tariff.description,
          rate: tariff.rate,
          currency: tariff.currency,
          rateInTargetCurrency,
          unit: tariff.unit,
        };
      })
    );

    return converted;
  }

  /**
   * Convert currency using live FX rates
   */
  private async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    // Get latest FX rate
    const fxRate = await prisma.currencyRate.findFirst({
      where: { from: fromCurrency, to: toCurrency },
      orderBy: { date: 'desc' },
    });

    if (!fxRate) {
      console.warn(`No FX rate found for ${fromCurrency} → ${toCurrency}, using 1.0`);
      return amount;
    }

    return amount * fxRate.rate;
  }

  /**
   * Update FX rates (should run daily)
   */
  async updateFXRates(): Promise<void> {
    // TODO: Integrate with FX API (e.g., exchangerate-api.com, fixer.io)

    const baseCurrencies = ['USD', 'EUR', 'GBP', 'SGD', 'NOK', 'JPY'];
    const today = new Date();

    // Placeholder: Insert sample rates
    const sampleRates = [
      { from: 'USD', to: 'EUR', rate: 0.92 },
      { from: 'USD', to: 'GBP', rate: 0.79 },
      { from: 'USD', to: 'SGD', rate: 1.34 },
      { from: 'USD', to: 'NOK', rate: 10.50 },
      { from: 'USD', to: 'JPY', rate: 148.50 },
      { from: 'EUR', to: 'USD', rate: 1.09 },
      { from: 'GBP', to: 'USD', rate: 1.27 },
      { from: 'SGD', to: 'USD', rate: 0.75 },
    ];

    for (const rate of sampleRates) {
      await prisma.currencyRate.upsert({
        where: {
          from_to_date: {
            from: rate.from,
            to: rate.to,
            date: today,
          },
        },
        create: {
          from: rate.from,
          to: rate.to,
          rate: rate.rate,
          date: today,
        },
        update: {
          rate: rate.rate,
        },
      });
    }

    console.log(`✅ FX rates updated for ${sampleRates.length} currency pairs`);
  }
}

export const tariffIngestionService = new TariffIngestionService();
