/**
 * Unit Tests: Tariff Extraction Pipeline
 *
 * Coverage:
 * - PDF extraction (text-based, scanned, fallback)
 * - Pattern matching (charge types, amounts, currencies)
 * - LLM structuring (mocked)
 * - Validation (4 layers)
 * - Currency conversion
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pdfExtractionService } from '../services/pdf-extraction-service.js';
import {
  normalizeChargeType,
  normalizeUnit,
  normalizeCurrency,
  parseAmount,
  parseSizeRange,
} from '../services/tariff-extraction-patterns.js';
import { llmTariffStructurer } from '../services/llm-tariff-structurer.js';
import { currencyService } from '../services/currency-service.js';
import { tariffIngestionService } from '../services/tariff-ingestion-service.js';

// ========================================
// Pattern Matching Tests
// ========================================

describe('Tariff Extraction Patterns', () => {
  describe('normalizeChargeType', () => {
    it('should normalize port dues variants', () => {
      expect(normalizeChargeType('port dues')).toBe('port_dues');
      expect(normalizeChargeType('harbour dues')).toBe('port_dues');
      expect(normalizeChargeType('HARBOR CHARGES')).toBe('port_dues');
      expect(normalizeChargeType('vessel dues')).toBe('port_dues');
    });

    it('should normalize pilotage variants', () => {
      expect(normalizeChargeType('pilotage')).toBe('pilotage');
      expect(normalizeChargeType('pilot fee')).toBe('pilotage');
      expect(normalizeChargeType('PILOT CHARGE')).toBe('pilotage');
    });

    it('should normalize towage variants', () => {
      expect(normalizeChargeType('towage')).toBe('towage');
      expect(normalizeChargeType('tug fee')).toBe('towage');
      expect(normalizeChargeType('towing charge')).toBe('towage');
    });

    it('should return other for unknown types', () => {
      expect(normalizeChargeType('unknown charge')).toBe('other');
      expect(normalizeChargeType('random text')).toBe('other');
    });
  });

  describe('normalizeUnit', () => {
    it('should normalize GRT units', () => {
      expect(normalizeUnit('per GRT')).toBe('per_grt');
      expect(normalizeUnit('/ GRT')).toBe('per_grt');
      expect(normalizeUnit('per gross ton')).toBe('per_grt');
    });

    it('should normalize TEU units', () => {
      expect(normalizeUnit('per TEU')).toBe('per_teu');
      expect(normalizeUnit('/ TEU')).toBe('per_teu');
      expect(normalizeUnit('per container')).toBe('per_teu');
    });

    it('should normalize time units', () => {
      expect(normalizeUnit('per hour')).toBe('per_hour');
      expect(normalizeUnit('hourly')).toBe('per_hour');
      expect(normalizeUnit('per day')).toBe('per_day');
      expect(normalizeUnit('daily')).toBe('per_day');
    });

    it('should default to flat_fee for unknown units', () => {
      expect(normalizeUnit('unknown')).toBe('flat_fee');
      expect(normalizeUnit('lumpsum')).toBe('flat_fee');
    });
  });

  describe('normalizeCurrency', () => {
    it('should normalize USD variants', () => {
      expect(normalizeCurrency('USD')).toBe('USD');
      expect(normalizeCurrency('US$')).toBe('USD');
      expect(normalizeCurrency('$100')).toBe('USD');
    });

    it('should normalize EUR variants', () => {
      expect(normalizeCurrency('EUR')).toBe('EUR');
      expect(normalizeCurrency('€100')).toBe('EUR');
    });

    it('should normalize INR variants', () => {
      expect(normalizeCurrency('INR')).toBe('INR');
      expect(normalizeCurrency('Rs.')).toBe('INR');
      expect(normalizeCurrency('Rs. 100')).toBe('INR');
      expect(normalizeCurrency('₹100')).toBe('INR');
    });

    it('should default to USD for unknown currency', () => {
      expect(normalizeCurrency('unknown')).toBe('USD');
    });
  });

  describe('parseAmount', () => {
    it('should parse amounts with commas', () => {
      expect(parseAmount('1,234.56')).toBe(1234.56);
      expect(parseAmount('10,000')).toBe(10000);
      expect(parseAmount('1,000,000.00')).toBe(1000000);
    });

    it('should parse amounts without commas', () => {
      expect(parseAmount('123')).toBe(123);
      expect(parseAmount('456.78')).toBe(456.78);
    });

    it('should return null for invalid amounts', () => {
      expect(parseAmount('abc')).toBeNull();
      expect(parseAmount('')).toBeNull();
    });
  });

  describe('parseSizeRange', () => {
    it('should parse "X - Y" format', () => {
      const result = parseSizeRange('10,000 - 50,000 GRT');
      expect(result).toEqual({
        min: 10000,
        max: 50000,
        unit: 'GRT',
      });
    });

    it('should parse "up to X" format', () => {
      const result = parseSizeRange('up to 10,000 GRT');
      expect(result).toEqual({
        max: 10000,
        unit: 'GRT',
      });
    });

    it('should parse "over X" format', () => {
      const result = parseSizeRange('over 50,000 GRT');
      expect(result).toEqual({
        min: 50000,
        unit: 'GRT',
      });
    });

    it('should return null for invalid format', () => {
      expect(parseSizeRange('invalid')).toBeNull();
      expect(parseSizeRange('')).toBeNull();
    });
  });
});

// ========================================
// PDF Extraction Tests
// ========================================

describe('PDF Extraction Service', () => {
  describe('assessTextQuality', () => {
    it('should assess high quality text', () => {
      const text = 'Port Dues: Vessels up to 10,000 GRT: USD 0.15 per GRT';
      const result = pdfExtractionService.assessTextQuality(text, 1);

      expect(result.isGood).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.metrics.wordCount).toBeGreaterThan(0);
      expect(result.metrics.hasNumbers).toBe(true);
      expect(result.metrics.hasLetters).toBe(true);
    });

    it('should assess low quality text (gibberish)', () => {
      const text = 'a b c d e f g h i j';
      const result = pdfExtractionService.assessTextQuality(text, 1);

      expect(result.isGood).toBe(false);
      expect(result.confidence).toBeLessThan(0.7);
      expect(result.metrics.wordsPerPage).toBeLessThanOrEqual(10);
    });

    it('should detect encoding issues', () => {
      const text = 'Text with �� encoding issues';
      const result = pdfExtractionService.assessTextQuality(text, 1);

      expect(result.metrics.encodingIssues).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should penalize low word count', () => {
      const text = 'Short';
      const result = pdfExtractionService.assessTextQuality(text, 10);

      expect(result.metrics.wordsPerPage).toBeLessThan(1);
      expect(result.isGood).toBe(false);
    });
  });
});

// ========================================
// LLM Structurer Tests (Mocked)
// ========================================

describe('LLM Tariff Structurer', () => {
  describe('assignConfidenceScore', () => {
    it('should assign high confidence to valid tariff', () => {
      const tariff = {
        chargeType: 'port_dues' as const,
        amount: 0.15,
        currency: 'USD',
        unit: 'per_grt' as const,
        rawText: 'Port Dues: USD 0.15 per GRT',
        confidence: 0.95,
      };

      const sourceText = 'Port Dues: USD 0.15 per GRT';
      const result = llmTariffStructurer['assignConfidenceScore'](tariff, sourceText);

      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.issues).toBeUndefined();
    });

    it('should penalize missing fields', () => {
      const tariff = {
        chargeType: '' as any,
        amount: 0,
        currency: '',
        unit: '' as any,
        rawText: '',
        confidence: 0.95,
      };

      const result = llmTariffStructurer['assignConfidenceScore'](tariff, '');

      expect(result.confidence).toBeLessThanOrEqual(0.5);
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBeGreaterThan(0);
    });

    it('should penalize unusually high amounts', () => {
      const tariff = {
        chargeType: 'port_dues' as const,
        amount: 2000000,
        currency: 'USD',
        unit: 'per_grt' as const,
        rawText: 'Port Dues: USD 2,000,000 per GRT',
        confidence: 0.95,
      };

      const result = llmTariffStructurer['assignConfidenceScore'](tariff, '');

      expect(result.issues).toBeDefined();
      expect(result.issues!.some(w => w.includes('high'))).toBe(true);
    });

    it('should penalize ambiguous charge types', () => {
      const tariff = {
        chargeType: 'other' as const,
        amount: 100,
        currency: 'USD',
        unit: 'flat_fee' as const,
        rawText: 'Some charge',
        confidence: 0.95,
      };

      const result = llmTariffStructurer['assignConfidenceScore'](tariff, '');

      expect(result.confidence).toBeLessThan(0.95);
      expect(result.issues).toBeDefined();
    });
  });
});

// ========================================
// Validation Tests (4 Layers)
// ========================================

describe('Tariff Validation', () => {
  describe('Layer 1: Schema Validation', () => {
    it('should pass valid tariff', () => {
      const tariff = {
        chargeType: 'port_dues' as const,
        amount: 0.15,
        currency: 'USD',
        unit: 'per_grt' as const,
        rawText: 'Test',
        confidence: 0.95,
      };

      const result = tariffIngestionService.validateTariff(tariff);

      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should fail without charge type', () => {
      const tariff = {
        chargeType: '' as any,
        amount: 0.15,
        currency: 'USD',
        unit: 'per_grt' as const,
        rawText: 'Test',
        confidence: 0.95,
      };

      const result = tariffIngestionService.validateTariff(tariff);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing charge type');
    });

    it('should fail without amount', () => {
      const tariff = {
        chargeType: 'port_dues' as const,
        amount: 0,
        currency: 'USD',
        unit: 'per_grt' as const,
        rawText: 'Test',
        confidence: 0.95,
      };

      const result = tariffIngestionService.validateTariff(tariff);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Invalid amount');
    });

    it('should fail without currency', () => {
      const tariff = {
        chargeType: 'port_dues' as const,
        amount: 0.15,
        currency: '',
        unit: 'per_grt' as const,
        rawText: 'Test',
        confidence: 0.95,
      };

      const result = tariffIngestionService.validateTariff(tariff);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing currency');
    });
  });

  describe('Layer 2: Business Logic Validation', () => {
    it('should warn on high amounts', () => {
      const tariff = {
        chargeType: 'port_dues' as const,
        amount: 1500000,
        currency: 'USD',
        unit: 'per_grt' as const,
        rawText: 'Test',
        confidence: 0.95,
      };

      const result = tariffIngestionService.validateTariff(tariff);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('exceeds typical range');
    });

    it('should reject invalid currency', () => {
      const tariff = {
        chargeType: 'port_dues' as const,
        amount: 0.15,
        currency: 'XYZ',
        unit: 'per_grt' as const,
        rawText: 'Test',
        confidence: 0.95,
      };

      const result = tariffIngestionService.validateTariff(tariff);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Invalid currency: XYZ');
    });

    it('should reject invalid size range', () => {
      const tariff = {
        chargeType: 'port_dues' as const,
        amount: 0.15,
        currency: 'USD',
        unit: 'per_grt' as const,
        sizeRangeMin: 50000,
        sizeRangeMax: 10000,
        rawText: 'Test',
        confidence: 0.95,
      };

      const result = tariffIngestionService.validateTariff(tariff);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Invalid size range: min > max');
    });
  });

  describe('Layer 4: Confidence Routing', () => {
    it('should route high confidence to auto-import', () => {
      const tariff = {
        chargeType: 'port_dues' as const,
        amount: 0.15,
        currency: 'USD',
        unit: 'per_grt' as const,
        rawText: 'Test',
        confidence: 0.85,
      };

      const result = tariffIngestionService.validateTariff(tariff);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should route low confidence to review', () => {
      const tariff = {
        chargeType: 'port_dues' as const,
        amount: 0.15,
        currency: 'USD',
        unit: 'per_grt' as const,
        rawText: 'Test',
        confidence: 0.5,
      };

      const result = tariffIngestionService.validateTariff(tariff);

      // Should still validate schema, but low confidence
      expect(result.confidence).toBeLessThan(0.7);
    });
  });
});

// ========================================
// Currency Service Tests
// ========================================

describe('Currency Service', () => {
  describe('getExchangeRate', () => {
    it('should return 1.0 for same currency', async () => {
      const rate = await currencyService.getExchangeRate('USD', 'USD');
      expect(rate).toBe(1.0);
    });

    it('should use fallback rates when API unavailable', async () => {
      // This will use fallback since we don't have real API in tests
      const rate = await currencyService.getExchangeRate('USD', 'EUR');
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(2);
    });

    it('should calculate cross rates correctly', async () => {
      const rate = await currencyService.getExchangeRate('EUR', 'GBP');
      expect(rate).toBeGreaterThan(0);
    });
  });

  describe('convert', () => {
    it('should convert amounts correctly', async () => {
      const result = await currencyService.convert(100, 'USD', 'USD');

      expect(result.from).toBe('USD');
      expect(result.to).toBe('USD');
      expect(result.amount).toBe(100);
      expect(result.converted).toBe(100);
      expect(result.rate).toBe(1.0);
    });

    it('should convert with exchange rate', async () => {
      const result = await currencyService.convert(100, 'USD', 'EUR');

      expect(result.from).toBe('USD');
      expect(result.to).toBe('EUR');
      expect(result.amount).toBe(100);
      expect(result.rate).toBeGreaterThan(0);
      expect(result.converted).toBeGreaterThan(0);
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return list of supported currencies', () => {
      const currencies = currencyService.getSupportedCurrencies();

      expect(currencies).toContain('USD');
      expect(currencies).toContain('EUR');
      expect(currencies).toContain('GBP');
      expect(currencies).toContain('INR');
      expect(currencies.length).toBeGreaterThan(0);
    });
  });
});

// ========================================
// Integration: Full Pipeline
// ========================================

describe('Tariff Ingestion Integration', () => {
  describe('getIngestionStats', () => {
    it('should return statistics', async () => {
      const stats = await tariffIngestionService.getIngestionStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('realScraped');
      expect(stats).toHaveProperty('simulated');
      expect(stats).toHaveProperty('reviewPending');
      expect(stats).toHaveProperty('coveragePercent');

      expect(typeof stats.total).toBe('number');
      expect(typeof stats.coveragePercent).toBe('number');
    });
  });
});
