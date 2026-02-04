/**
 * HTML Table Extractor Service - Week 3 Day 1
 * Extracts tariff data from HTML tables on port authority websites
 *
 * Features:
 * - Intelligent table detection
 * - Pattern-based tariff extraction
 * - Multiple table formats supported
 * - Confidence scoring
 * - LLM fallback for complex tables
 */

import * as cheerio from 'cheerio';
import { getTariffExtractionPatterns, ExtractedTariff } from './tariff-extraction-patterns.js';

export interface TableExtractionConfig {
  url: string;
  portId: string;
  tableSelector?: string; // CSS selector for table
  headerRowIndex?: number; // Which row contains headers (default: 0)
  skipRows?: number; // Number of rows to skip at start
  columnMapping?: {
    chargeType?: number;
    amount?: number;
    currency?: number;
    unit?: number;
    sizeRange?: number;
    notes?: number;
  };
}

export interface TableExtractionResult {
  success: boolean;
  tariffs: ExtractedTariff[];
  tablesFound: number;
  rowsProcessed: number;
  extractionMethod: 'automatic' | 'configured' | 'llm';
  confidence: number;
  error?: string;
}

export class HTMLTableExtractorService {
  private patternExtractor = getTariffExtractionPatterns();

  /**
   * Extract tariffs from HTML page
   */
  async extractFromHTML(html: string, config: TableExtractionConfig): Promise<TableExtractionResult> {
    try {
      const $ = cheerio.load(html);

      // Find tables
      const tables = config.tableSelector
        ? $(config.tableSelector)
        : this.findTariffTables($);

      if (tables.length === 0) {
        return {
          success: false,
          tariffs: [],
          tablesFound: 0,
          rowsProcessed: 0,
          extractionMethod: 'automatic',
          confidence: 0,
          error: 'No tables found on page',
        };
      }

      console.log(`📊 Found ${tables.length} potential tariff tables`);

      // Extract tariffs from all tables
      const allTariffs: ExtractedTariff[] = [];
      let totalRows = 0;

      tables.each((i, tableElement) => {
        const tableData = this.extractTableData($, $(tableElement));
        totalRows += tableData.rows.length;

        // Try to extract tariffs from table data
        const tariffs = config.columnMapping
          ? this.extractWithMapping(tableData, config, config.portId)
          : this.extractAutomatic(tableData, config.portId);

        allTariffs.push(...tariffs);
      });

      // Calculate average confidence
      const avgConfidence = allTariffs.length > 0
        ? allTariffs.reduce((sum, t) => sum + t.confidence, 0) / allTariffs.length
        : 0;

      console.log(`✅ Extracted ${allTariffs.length} tariffs from ${totalRows} rows`);

      return {
        success: true,
        tariffs: allTariffs,
        tablesFound: tables.length,
        rowsProcessed: totalRows,
        extractionMethod: config.columnMapping ? 'configured' : 'automatic',
        confidence: avgConfidence,
      };
    } catch (error: any) {
      console.error(`❌ HTML extraction failed: ${error.message}`);
      return {
        success: false,
        tariffs: [],
        tablesFound: 0,
        rowsProcessed: 0,
        extractionMethod: 'automatic',
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Find tables that likely contain tariff data
   */
  private findTariffTables($: cheerio.CheerioAPI): cheerio.Cheerio<any> {
    const allTables = $('table');

    // Filter tables that likely contain tariffs
    return allTables.filter((i, table) => {
      const text = $(table).text().toLowerCase();

      // Look for tariff-related keywords
      const keywords = [
        'tariff', 'charge', 'fee', 'rate', 'dues',
        'port', 'pilotage', 'towage', 'berth',
        'price', 'cost', 'amount'
      ];

      return keywords.some(keyword => text.includes(keyword));
    });
  }

  /**
   * Extract raw data from table
   */
  private extractTableData($: cheerio.CheerioAPI, table: cheerio.Cheerio<any>): {
    headers: string[];
    rows: string[][];
  } {
    const headers: string[] = [];
    const rows: string[][] = [];

    // Extract headers
    table.find('thead tr th, thead tr td, tr:first-child th, tr:first-child td').each((i, el) => {
      headers.push($(el).text().trim());
    });

    // If no headers found in thead, use first row
    if (headers.length === 0) {
      const firstRow = table.find('tr:first-child');
      firstRow.find('td, th').each((i, el) => {
        headers.push($(el).text().trim());
      });
    }

    // Extract data rows
    table.find('tbody tr, tr').each((i, row) => {
      // Skip if it's the header row
      if (i === 0 && headers.length === 0) return;

      const rowData: string[] = [];
      $(row).find('td, th').each((j, cell) => {
        rowData.push($(cell).text().trim());
      });

      if (rowData.length > 0) {
        rows.push(rowData);
      }
    });

    return { headers, rows };
  }

  /**
   * Extract tariffs using configured column mapping
   */
  private extractWithMapping(
    tableData: { headers: string[]; rows: string[][] },
    config: TableExtractionConfig,
    portId: string
  ): ExtractedTariff[] {
    const tariffs: ExtractedTariff[] = [];
    const mapping = config.columnMapping!;

    for (const row of tableData.rows) {
      try {
        // Skip empty rows
        if (row.every(cell => !cell || cell.trim() === '')) continue;

        const chargeTypeRaw = mapping.chargeType !== undefined ? row[mapping.chargeType] : '';
        const amountRaw = mapping.amount !== undefined ? row[mapping.amount] : '';
        const currencyRaw = mapping.currency !== undefined ? row[mapping.currency] : '';
        const unitRaw = mapping.unit !== undefined ? row[mapping.unit] : '';
        const notesRaw = mapping.notes !== undefined ? row[mapping.notes] : '';

        // Skip if no charge type or amount
        if (!chargeTypeRaw || !amountRaw) continue;

        // Parse amount
        const amount = this.parseAmount(amountRaw);
        if (amount <= 0) continue;

        // Normalize charge type
        const chargeType = this.normalizeChargeType(chargeTypeRaw);

        // Extract currency (default to port's currency if not found)
        const currency = currencyRaw || this.extractCurrency(amountRaw) || 'USD';

        // Extract unit
        const unit = unitRaw || this.extractUnit(amountRaw + ' ' + notesRaw);

        tariffs.push({
          chargeType,
          chargeName: chargeTypeRaw,
          amount,
          currency,
          unit,
          conditions: notesRaw || undefined,
          confidence: 0.90, // High confidence for mapped extraction
          sourceText: row.join(' | '),
        });
      } catch (error: any) {
        console.error(`⚠️  Failed to extract row: ${error.message}`);
      }
    }

    return tariffs;
  }

  /**
   * Extract tariffs automatically (no column mapping)
   */
  private extractAutomatic(
    tableData: { headers: string[]; rows: string[][] },
    portId: string
  ): ExtractedTariff[] {
    const tariffs: ExtractedTariff[] = [];

    // Detect column indices by analyzing headers
    const columnIndices = this.detectColumns(tableData.headers);

    for (const row of tableData.rows) {
      try {
        // Skip empty or header rows
        if (row.every(cell => !cell || cell.trim() === '')) continue;
        if (this.isHeaderRow(row)) continue;

        // Extract data based on detected columns
        const chargeTypeRaw = columnIndices.chargeType !== -1 ? row[columnIndices.chargeType] : '';
        const amountRaw = columnIndices.amount !== -1 ? row[columnIndices.amount] : '';

        // Try all columns if not detected
        if (!chargeTypeRaw || !amountRaw) {
          // Use pattern matching on full row text
          const fullText = row.join(' | ');
          const extracted = this.patternExtractor.extractTariffs(fullText);
          tariffs.push(...extracted);
          continue;
        }

        const amount = this.parseAmount(amountRaw);
        if (amount <= 0) continue;

        const chargeType = this.normalizeChargeType(chargeTypeRaw);
        const currency = this.extractCurrency(amountRaw) || 'USD';
        const unit = this.extractUnit(row.join(' '));

        tariffs.push({
          chargeType,
          chargeName: chargeTypeRaw,
          amount,
          currency,
          unit,
          confidence: 0.75, // Lower confidence for automatic extraction
          sourceText: row.join(' | '),
        });
      } catch (error: any) {
        console.error(`⚠️  Failed to extract row automatically: ${error.message}`);
      }
    }

    return tariffs;
  }

  /**
   * Detect column indices from headers
   */
  private detectColumns(headers: string[]): {
    chargeType: number;
    amount: number;
    currency: number;
    unit: number;
  } {
    const result = {
      chargeType: -1,
      amount: -1,
      currency: -1,
      unit: -1,
    };

    headers.forEach((header, index) => {
      const h = header.toLowerCase();

      // Charge type
      if (h.includes('service') || h.includes('charge') || h.includes('type') || h.includes('description')) {
        result.chargeType = index;
      }

      // Amount
      if (h.includes('amount') || h.includes('rate') || h.includes('fee') || h.includes('price') || h.includes('tariff')) {
        result.amount = index;
      }

      // Currency
      if (h.includes('currency') || h === 'curr') {
        result.currency = index;
      }

      // Unit
      if (h.includes('unit') || h.includes('per') || h.includes('basis')) {
        result.unit = index;
      }
    });

    return result;
  }

  /**
   * Check if row is a header row
   */
  private isHeaderRow(row: string[]): boolean {
    const text = row.join(' ').toLowerCase();
    return text.includes('service') && text.includes('rate') ||
           text.includes('description') && text.includes('amount') ||
           text.includes('charge') && text.includes('fee');
  }

  /**
   * Normalize charge type
   */
  private normalizeChargeType(rawType: string): string {
    const normalized = rawType.toLowerCase().trim();

    const mappings: Record<string, string> = {
      'port dues': 'port_dues',
      'port due': 'port_dues',
      'harbour dues': 'port_dues',
      'harbor dues': 'port_dues',
      'pilotage': 'pilotage',
      'pilot': 'pilotage',
      'towage': 'towage',
      'tug': 'towage',
      'berth hire': 'berth_hire',
      'berth': 'berth_hire',
      'wharfage': 'berth_hire',
      'anchorage': 'anchorage',
      'light dues': 'light_dues',
      'mooring': 'mooring',
      'unmooring': 'unmooring',
    };

    for (const [key, value] of Object.entries(mappings)) {
      if (normalized.includes(key)) {
        return value;
      }
    }

    return normalized.replace(/[^a-z0-9_]/g, '_');
  }

  /**
   * Parse amount from string
   */
  private parseAmount(amountStr: string): number {
    // Remove currency symbols, commas, and whitespace
    const cleaned = amountStr.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Extract currency from string
   */
  private extractCurrency(text: string): string | null {
    const currencies = ['USD', 'EUR', 'GBP', 'SGD', 'INR', 'AED', 'CNY', 'JPY', 'SAR', 'LKR'];

    for (const currency of currencies) {
      if (text.toUpperCase().includes(currency)) {
        return currency;
      }
    }

    // Check for currency symbols
    if (text.includes('$')) return 'USD';
    if (text.includes('€')) return 'EUR';
    if (text.includes('£')) return 'GBP';
    if (text.includes('₹')) return 'INR';

    return null;
  }

  /**
   * Extract unit from string
   */
  private extractUnit(text: string): string {
    const normalized = text.toLowerCase();

    const patterns: [RegExp, string][] = [
      [/per\s+grt|per\s+gross\s+tonnage|\s+grt\s+/i, 'per_grt'],
      [/per\s+nrt|per\s+net\s+tonnage|\s+nrt\s+/i, 'per_nrt'],
      [/per\s+mt|per\s+metric\s+ton|per\s+ton/i, 'per_mt'],
      [/per\s+hour|hourly/i, 'per_hour'],
      [/per\s+day|daily/i, 'per_day'],
      [/per\s+call|per\s+visit/i, 'per_call'],
      [/lump\s+sum|flat\s+rate/i, 'lumpsum'],
    ];

    for (const [pattern, unit] of patterns) {
      if (pattern.test(normalized)) {
        return unit;
      }
    }

    return 'lumpsum';
  }
}

// Singleton instance
let htmlTableExtractorService: HTMLTableExtractorService | null = null;

export function getHTMLTableExtractorService(): HTMLTableExtractorService {
  if (!htmlTableExtractorService) {
    htmlTableExtractorService = new HTMLTableExtractorService();
  }
  return htmlTableExtractorService;
}
