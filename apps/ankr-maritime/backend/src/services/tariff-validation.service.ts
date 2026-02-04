/**
 * Tariff Validation Service - 4-Layer Validation Pipeline
 * Week 2 - Days 3-4: Validation & Ingestion
 *
 * Validation Layers:
 * 1. Schema Validation - Required fields, data types, formats
 * 2. Business Logic - Amount ranges, unit compatibility, size logic
 * 3. Duplicate Detection - Check existing tariffs for same port + charge + range
 * 4. Confidence Routing - ≥0.8 auto-import, <0.8 human review
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
  action: 'auto_import' | 'review' | 'reject';
  isDuplicate: boolean;
  duplicateId?: string;
}

export interface TariffInput {
  portId: string;
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
  confidence?: number;
  sourceText?: string;
  dataSource?: string;
}

export class TariffValidationService {
  private prisma: PrismaClient;

  // Validation thresholds
  private readonly AUTO_IMPORT_THRESHOLD = 0.8; // 80% confidence
  private readonly REJECT_THRESHOLD = 0.3; // 30% confidence

  // Business rules
  private readonly MIN_AMOUNT = 0.01;
  private readonly MAX_AMOUNT = 1000000; // $1M max per charge
  private readonly MIN_SIZE_RANGE = 100; // GRT
  private readonly MAX_SIZE_RANGE = 500000; // GRT

  private readonly VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'INR', 'AED', 'CNY', 'JPY', 'NOK'];
  private readonly VALID_UNITS = ['per_grt', 'per_nrt', 'per_day', 'per_hour', 'per_movement', 'per_ton', 'lumpsum'];
  private readonly VALID_CHARGE_TYPES = [
    'port_dues',
    'pilotage',
    'towage',
    'mooring',
    'unmooring',
    'berth_hire',
    'agency_fee',
    'garbage_disposal',
    'freshwater',
    'documentation',
  ];

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Validate tariff through 4-layer pipeline
   */
  async validate(tariff: TariffInput): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Layer 1: Schema Validation
    const schemaErrors = this.validateSchema(tariff);
    errors.push(...schemaErrors);

    // Layer 2: Business Logic Validation
    const businessErrors = this.validateBusinessLogic(tariff);
    errors.push(...businessErrors.errors);
    warnings.push(...businessErrors.warnings);

    // Layer 3: Duplicate Detection
    const duplicateCheck = await this.checkDuplicates(tariff);

    // Layer 4: Confidence Routing
    const confidence = tariff.confidence || 0.5;
    const action = this.routeByConfidence(confidence, errors.length, duplicateCheck.isDuplicate);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence,
      action,
      isDuplicate: duplicateCheck.isDuplicate,
      duplicateId: duplicateCheck.duplicateId,
    };
  }

  /**
   * Layer 1: Schema Validation
   * Check required fields, data types, and formats
   */
  private validateSchema(tariff: TariffInput): string[] {
    const errors: string[] = [];

    // Required fields
    if (!tariff.portId || tariff.portId.trim() === '') {
      errors.push('portId is required');
    }

    if (!tariff.chargeType || tariff.chargeType.trim() === '') {
      errors.push('chargeType is required');
    }

    if (!tariff.chargeName || tariff.chargeName.trim() === '') {
      errors.push('chargeName is required');
    }

    if (tariff.amount === undefined || tariff.amount === null) {
      errors.push('amount is required');
    }

    if (!tariff.currency || tariff.currency.trim() === '') {
      errors.push('currency is required');
    }

    if (!tariff.unit || tariff.unit.trim() === '') {
      errors.push('unit is required');
    }

    // Data type validation
    if (typeof tariff.amount !== 'number' || isNaN(tariff.amount)) {
      errors.push('amount must be a valid number');
    }

    // Format validation
    if (tariff.portId && !/^[A-Z]{5}$/.test(tariff.portId)) {
      errors.push('portId must be a valid 5-letter UNLOCODE (e.g., SGSIN)');
    }

    if (tariff.currency && !this.VALID_CURRENCIES.includes(tariff.currency)) {
      errors.push(`currency must be one of: ${this.VALID_CURRENCIES.join(', ')}`);
    }

    if (tariff.unit && !this.VALID_UNITS.includes(tariff.unit)) {
      errors.push(`unit must be one of: ${this.VALID_UNITS.join(', ')}`);
    }

    if (tariff.chargeType && !this.VALID_CHARGE_TYPES.includes(tariff.chargeType)) {
      errors.push(`chargeType must be one of: ${this.VALID_CHARGE_TYPES.join(', ')}`);
    }

    return errors;
  }

  /**
   * Layer 2: Business Logic Validation
   * Check amount ranges, unit compatibility, size logic
   */
  private validateBusinessLogic(tariff: TariffInput): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Amount range validation
    if (tariff.amount < this.MIN_AMOUNT) {
      errors.push(`amount must be at least ${this.MIN_AMOUNT}`);
    }

    if (tariff.amount > this.MAX_AMOUNT) {
      warnings.push(`amount ${tariff.amount} is unusually high (>${this.MAX_AMOUNT})`);
    }

    // Size range validation
    if (tariff.sizeRangeMin !== undefined && tariff.sizeRangeMin < this.MIN_SIZE_RANGE) {
      warnings.push(`sizeRangeMin ${tariff.sizeRangeMin} is unusually small (<${this.MIN_SIZE_RANGE})`);
    }

    if (tariff.sizeRangeMax !== undefined && tariff.sizeRangeMax > this.MAX_SIZE_RANGE) {
      warnings.push(`sizeRangeMax ${tariff.sizeRangeMax} is unusually large (>${this.MAX_SIZE_RANGE})`);
    }

    // Size range logic
    if (
      tariff.sizeRangeMin !== undefined &&
      tariff.sizeRangeMax !== undefined &&
      tariff.sizeRangeMin >= tariff.sizeRangeMax
    ) {
      errors.push('sizeRangeMin must be less than sizeRangeMax');
    }

    // Unit compatibility with charge type
    const incompatibilities = this.checkUnitCompatibility(tariff.chargeType, tariff.unit);
    warnings.push(...incompatibilities);

    // Date validation
    if (tariff.effectiveFrom && tariff.effectiveTo) {
      if (tariff.effectiveFrom >= tariff.effectiveTo) {
        errors.push('effectiveFrom must be before effectiveTo');
      }
    }

    return { errors, warnings };
  }

  /**
   * Check if unit is compatible with charge type
   */
  private checkUnitCompatibility(chargeType: string, unit: string): string[] {
    const warnings: string[] = [];

    // Expected units for each charge type
    const expectedUnits: Record<string, string[]> = {
      port_dues: ['per_grt', 'per_nrt', 'lumpsum'],
      pilotage: ['per_movement', 'lumpsum'],
      towage: ['per_movement', 'per_hour', 'lumpsum'],
      mooring: ['per_movement', 'lumpsum'],
      unmooring: ['per_movement', 'lumpsum'],
      berth_hire: ['per_day', 'per_hour', 'lumpsum'],
      agency_fee: ['lumpsum'],
      garbage_disposal: ['lumpsum', 'per_ton'],
      freshwater: ['per_ton', 'lumpsum'],
      documentation: ['lumpsum'],
    };

    const expected = expectedUnits[chargeType];
    if (expected && !expected.includes(unit)) {
      warnings.push(`unusual unit '${unit}' for charge type '${chargeType}', expected: ${expected.join(', ')}`);
    }

    return warnings;
  }

  /**
   * Layer 3: Duplicate Detection
   * Check if tariff already exists for same port + charge + range
   */
  async checkDuplicates(tariff: TariffInput): Promise<{ isDuplicate: boolean; duplicateId?: string }> {
    try {
      // Build where clause
      const where: any = {
        portId: tariff.portId,
        chargeType: tariff.chargeType,
      };

      // Include size range in duplicate check if provided
      if (tariff.sizeRangeMin !== undefined) {
        where.sizeRangeMin = tariff.sizeRangeMin;
      }
      if (tariff.sizeRangeMax !== undefined) {
        where.sizeRangeMax = tariff.sizeRangeMax;
      }

      // Check for active tariffs (no effectiveTo or future effectiveTo)
      where.OR = [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }];

      const existing = await this.prisma.portTariff.findFirst({
        where,
        select: { id: true },
      });

      if (existing) {
        return { isDuplicate: true, duplicateId: existing.id };
      }

      return { isDuplicate: false };
    } catch (error: any) {
      console.error('Duplicate check error:', error.message);
      return { isDuplicate: false };
    }
  }

  /**
   * Layer 4: Confidence Routing
   * Determine action based on confidence, errors, and duplicates
   */
  private routeByConfidence(
    confidence: number,
    errorCount: number,
    isDuplicate: boolean
  ): 'auto_import' | 'review' | 'reject' {
    // Reject if errors or low confidence
    if (errorCount > 0 || confidence < this.REJECT_THRESHOLD) {
      return 'reject';
    }

    // Reject duplicates
    if (isDuplicate) {
      return 'reject';
    }

    // Auto-import if high confidence
    if (confidence >= this.AUTO_IMPORT_THRESHOLD) {
      return 'auto_import';
    }

    // Otherwise, route to human review
    return 'review';
  }

  /**
   * Generate hash for tariff (for change detection)
   */
  generateHash(tariff: TariffInput): string {
    const hashInput = JSON.stringify({
      portId: tariff.portId,
      chargeType: tariff.chargeType,
      amount: tariff.amount,
      currency: tariff.currency,
      unit: tariff.unit,
      sizeRangeMin: tariff.sizeRangeMin,
      sizeRangeMax: tariff.sizeRangeMax,
    });

    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Batch validate multiple tariffs
   */
  async validateBatch(tariffs: TariffInput[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const tariff of tariffs) {
      const result = await this.validate(tariff);
      results.push(result);
    }

    return results;
  }

  /**
   * Get validation statistics
   */
  getStatistics(results: ValidationResult[]): {
    total: number;
    valid: number;
    invalid: number;
    autoImport: number;
    review: number;
    reject: number;
    duplicates: number;
    averageConfidence: number;
  } {
    const total = results.length;
    const valid = results.filter((r) => r.isValid).length;
    const invalid = results.filter((r) => !r.isValid).length;
    const autoImport = results.filter((r) => r.action === 'auto_import').length;
    const review = results.filter((r) => r.action === 'review').length;
    const reject = results.filter((r) => r.action === 'reject').length;
    const duplicates = results.filter((r) => r.isDuplicate).length;
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / total;

    return {
      total,
      valid,
      invalid,
      autoImport,
      review,
      reject,
      duplicates,
      averageConfidence,
    };
  }
}

// Singleton instance
let tariffValidationService: TariffValidationService | null = null;

export function getTariffValidationService(): TariffValidationService {
  if (!tariffValidationService) {
    tariffValidationService = new TariffValidationService();
  }
  return tariffValidationService;
}
