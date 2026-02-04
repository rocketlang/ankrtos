/**
 * Tariff Extraction Patterns - Extract structured tariff data from text
 * Week 2 - Days 1-2: Pattern Matching & Normalization
 *
 * Extracts:
 * - Charge types (port_dues, pilotage, towage, etc.)
 * - Amounts and currencies
 * - Units (per_grt, per_day, lumpsum, etc.)
 * - Size ranges (vessel GRT/DWT ranges)
 * - Effective dates
 */

export interface ExtractedTariff {
  chargeType: string;
  chargeName: string;
  amount: number;
  currency: string;
  unit: string;
  sizeRangeMin?: number;
  sizeRangeMax?: number;
  conditions?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  confidence: number;
  sourceText: string;
}

export class TariffExtractionPatterns {
  // Charge type patterns (what service is being charged)
  private readonly chargeTypePatterns: Map<string, RegExp[]> = new Map([
    [
      'port_dues',
      [
        /port\s+dues?/i,
        /harbor\s+dues?/i,
        /berth\s+dues?/i,
        /wharfage/i,
        /dockage/i,
      ],
    ],
    [
      'pilotage',
      [
        /pilotage/i,
        /pilot\s+fee/i,
        /pilot\s+charge/i,
        /compulsory\s+pilot/i,
      ],
    ],
    [
      'towage',
      [
        /towage/i,
        /towing\s+fee/i,
        /tug\s+assist/i,
        /tug\s+service/i,
      ],
    ],
    [
      'mooring',
      [
        /mooring/i,
        /berthing\s+assist/i,
        /line\s+handling/i,
      ],
    ],
    [
      'unmooring',
      [
        /unmooring/i,
        /unberthing/i,
        /departure\s+assist/i,
      ],
    ],
    [
      'berth_hire',
      [
        /berth\s+hire/i,
        /berth\s+rental/i,
        /quay\s+rental/i,
        /alongside\s+charge/i,
      ],
    ],
    [
      'agency_fee',
      [
        /agency\s+fee/i,
        /agent\s+fee/i,
        /husbandry/i,
        /attendance\s+fee/i,
      ],
    ],
    [
      'garbage_disposal',
      [
        /garbage\s+disposal/i,
        /waste\s+disposal/i,
        /refuse\s+collection/i,
        /sludge\s+disposal/i,
      ],
    ],
    [
      'freshwater',
      [
        /fresh\s*water/i,
        /potable\s+water/i,
        /water\s+supply/i,
      ],
    ],
    [
      'documentation',
      [
        /documentation/i,
        /clearance\s+fee/i,
        /customs\s+fee/i,
        /entry\s+fee/i,
      ],
    ],
  ]);

  // Amount patterns (monetary values)
  private readonly amountPatterns: RegExp[] = [
    /(?:USD|EUR|GBP|SGD|INR|AED|CNY|JPY|NOK)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP|SGD|INR|AED|CNY|JPY|NOK)/,
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    /€\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    /£\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
  ];

  // Currency patterns
  private readonly currencyPatterns: Map<string, RegExp[]> = new Map([
    ['USD', [/USD/i, /US\$/, /\$/]],
    ['EUR', [/EUR/i, /€/]],
    ['GBP', [/GBP/i, /£/]],
    ['SGD', [/SGD/i, /S\$/]],
    ['INR', [/INR/i, /₹/, /RS\.?/i]],
    ['AED', [/AED/i, /DIRHAMS?/i]],
    ['CNY', [/CNY/i, /RMB/i, /¥/]],
    ['JPY', [/JPY/i, /¥/]],
    ['NOK', [/NOK/i, /KR/]],
  ]);

  // Unit patterns
  private readonly unitPatterns: Map<string, RegExp[]> = new Map([
    ['per_grt', [/per\s+grt/i, /\/\s*grt/i, /per\s+gross\s+ton/i]],
    ['per_nrt', [/per\s+nrt/i, /\/\s*nrt/i, /per\s+net\s+ton/i]],
    ['per_day', [/per\s+day/i, /\/\s*day/i, /daily/i, /per\s+24\s*hours?/i]],
    ['per_hour', [/per\s+hour/i, /\/\s*hour/i, /hourly/i]],
    ['per_movement', [/per\s+movement/i, /per\s+call/i, /per\s+visit/i]],
    ['per_ton', [/per\s+ton/i, /\/\s*ton/i, /per\s+mt/i]],
    ['lumpsum', [/lump\s*sum/i, /flat\s+fee/i, /fixed\s+fee/i, /per\s+service/i]],
  ]);

  /**
   * Extract tariffs from text
   */
  extractTariffs(text: string): ExtractedTariff[] {
    const tariffs: ExtractedTariff[] = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Try to extract tariff from this line
      const extracted = this.extractTariffFromLine(line);
      if (extracted) {
        tariffs.push(extracted);
      }
    }

    console.log(`📋 Extracted ${tariffs.length} tariffs from text`);
    return tariffs;
  }

  /**
   * Extract tariff from a single line of text
   */
  private extractTariffFromLine(line: string): ExtractedTariff | null {
    // Step 1: Identify charge type
    const chargeType = this.identifyChargeType(line);
    if (!chargeType) return null;

    // Step 2: Extract amount
    const amount = this.extractAmount(line);
    if (!amount) return null;

    // Step 3: Extract currency
    const currency = this.extractCurrency(line);

    // Step 4: Extract unit
    const unit = this.extractUnit(line);

    // Step 5: Extract size range
    const sizeRange = this.extractSizeRange(line);

    // Step 6: Calculate confidence
    const confidence = this.calculateConfidence(line, chargeType, amount, currency, unit);

    return {
      chargeType,
      chargeName: this.formatChargeName(chargeType),
      amount,
      currency: currency || 'USD',
      unit: unit || 'lumpsum',
      sizeRangeMin: sizeRange?.min,
      sizeRangeMax: sizeRange?.max,
      confidence,
      sourceText: line,
    };
  }

  private identifyChargeType(text: string): string | null {
    for (const [chargeType, patterns] of this.chargeTypePatterns) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return chargeType;
        }
      }
    }
    return null;
  }

  private extractAmount(text: string): number | null {
    for (const pattern of this.amountPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount)) {
          return amount;
        }
      }
    }
    return null;
  }

  private extractCurrency(text: string): string | null {
    for (const [currency, patterns] of this.currencyPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return currency;
        }
      }
    }
    return null;
  }

  private extractUnit(text: string): string | null {
    for (const [unit, patterns] of this.unitPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return unit;
        }
      }
    }
    return null;
  }

  private extractSizeRange(text: string): { min?: number; max?: number } | null {
    const sizeRangePatterns = [
      /(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)\s*(?:grt|dwt)/i,
      /(?:grt|dwt)\s*(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)/i,
      /up\s+to\s+(\d{1,3}(?:,\d{3})*)\s*(?:grt|dwt)/i,
      /over\s+(\d{1,3}(?:,\d{3})*)\s*(?:grt|dwt)/i,
    ];
    
    for (const pattern of sizeRangePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[2]) {
          const min = parseInt(match[1].replace(/,/g, ''));
          const max = parseInt(match[2].replace(/,/g, ''));
          if (!isNaN(min) && !isNaN(max)) {
            return { min, max };
          }
        } else if (/up\s+to/i.test(text)) {
          const max = parseInt(match[1].replace(/,/g, ''));
          if (!isNaN(max)) {
            return { max };
          }
        } else if (/over/i.test(text)) {
          const min = parseInt(match[1].replace(/,/g, ''));
          if (!isNaN(min)) {
            return { min };
          }
        }
      }
    }
    return null;
  }

  private calculateConfidence(
    text: string,
    chargeType: string | null,
    amount: number | null,
    currency: string | null,
    unit: string | null
  ): number {
    let confidence = 0.5;

    if (chargeType) confidence += 0.2;
    if (amount) confidence += 0.2;
    if (currency) confidence += 0.05;
    if (unit) confidence += 0.05;

    if (text.toLowerCase().includes('approximately')) confidence -= 0.1;
    if (text.toLowerCase().includes('subject to')) confidence -= 0.05;
    if (text.toLowerCase().includes('may vary')) confidence -= 0.05;

    return Math.max(0, Math.min(1, confidence));
  }

  private formatChargeName(chargeType: string): string {
    return chargeType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  normalizeChargeType(input: string): string {
    const normalized = input.toLowerCase().trim();

    for (const [chargeType, patterns] of this.chargeTypePatterns) {
      for (const pattern of patterns) {
        if (pattern.test(normalized)) {
          return chargeType;
        }
      }
    }

    return normalized.replace(/\s+/g, '_');
  }

  normalizeUnit(input: string): string {
    const normalized = input.toLowerCase().trim();

    for (const [unit, patterns] of this.unitPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(normalized)) {
          return unit;
        }
      }
    }

    return 'lumpsum';
  }

  normalizeCurrency(input: string): string {
    const normalized = input.toUpperCase().trim();

    for (const [currency, patterns] of this.currencyPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(normalized)) {
          return currency;
        }
      }
    }

    return 'USD';
  }
}

let tariffExtractionPatterns: TariffExtractionPatterns | null = null;

export function getTariffExtractionPatterns(): TariffExtractionPatterns {
  if (!tariffExtractionPatterns) {
    tariffExtractionPatterns = new TariffExtractionPatterns();
  }
  return tariffExtractionPatterns;
}
