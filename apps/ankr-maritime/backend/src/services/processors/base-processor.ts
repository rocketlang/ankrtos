/**
 * Base Document Processor Interface
 * All document processors extend this base class
 */

export interface ExtractedData {
  // Common fields
  title: string;
  docType: string;
  extractedAt: Date;

  // Maritime entities
  vessels?: Array<{
    name: string;
    imo?: string;
    dwt?: number;
    flag?: string;
    built?: number;
  }>;

  ports?: Array<{
    name: string;
    code?: string;
    type?: 'loading' | 'discharge' | 'bunkering';
  }>;

  parties?: Array<{
    role: string; // 'owner', 'charterer', 'shipper', 'consignee', etc.
    name: string;
    address?: string;
    contact?: string;
  }>;

  cargo?: Array<{
    description: string;
    quantity?: number;
    unit?: string;
    weight?: number;
  }>;

  // Financial data
  rates?: Array<{
    type: string; // 'freight', 'hire', 'demurrage', 'despatch'
    amount: number;
    currency: string;
    unit?: string; // 'per day', 'per MT', etc.
  }>;

  dates?: Array<{
    type: string; // 'laycan', 'eta', 'etd', 'loaded', 'discharged'
    date: Date | string;
  }>;

  // Document-specific data
  metadata?: Record<string, any>;

  // Extracted text
  fullText?: string;
  summary?: string;
}

export abstract class BaseProcessor {
  abstract docType: string;

  /**
   * Extract structured data from document content
   */
  abstract extract(content: string, metadata?: any): Promise<ExtractedData>;

  /**
   * Validate extracted data
   */
  validate(data: ExtractedData): boolean {
    return !!data.title && !!data.docType;
  }

  /**
   * Extract monetary amounts from text
   */
  protected extractAmounts(text: string): Array<{ amount: number; currency: string }> {
    const amounts: Array<{ amount: number; currency: string }> = [];

    // Pattern: USD 15,000 or $15,000 or 15,000 USD
    const patterns = [
      /(?:USD|EUR|GBP)\s+([\d,]+(?:\.\d{2})?)/gi,
      /\$([\d,]+(?:\.\d{2})?)/g,
      /([\d,]+(?:\.\d{2})?)\s+(?:USD|EUR|GBP)/gi,
    ];

    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount)) {
          // Try to find currency in the match
          const currency = match[0].match(/USD|EUR|GBP/i)?.[0].toUpperCase() || 'USD';
          amounts.push({ amount, currency });
        }
      }
    });

    return amounts;
  }

  /**
   * Extract dates from text
   */
  protected extractDates(text: string): Date[] {
    const dates: Date[] = [];

    // Pattern: Jan 15, 2026 or January 15, 2026 or 2026-01-15
    const patterns = [
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/g, // Jan 15, 2026
      /(\d{4})-(\d{2})-(\d{2})/g, // 2026-01-15
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, // 01/15/2026
    ];

    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        try {
          const date = new Date(match[0]);
          if (!isNaN(date.getTime())) {
            dates.push(date);
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
    });

    return dates;
  }

  /**
   * Clean and normalize text
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double
      .trim();
  }
}
