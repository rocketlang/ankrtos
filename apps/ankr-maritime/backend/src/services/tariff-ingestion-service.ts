/**
 * Tariff Ingestion Service - Production Implementation
 *
 * Real PDF parsing, LLM structuring, 4-layer validation, and change detection
 */

import { prisma } from '../lib/prisma.js';
import { pdfExtractionService } from './pdf-extraction-service.js';
import { llmTariffStructurer, type StructuredTariff } from './llm-tariff-structurer.js';
import { currencyService } from './currency-service.js';
import { createHash } from 'crypto';
import axios from 'axios';

export interface TariffDocument {
  url: string;
  portId: string;
  effectiveFrom?: Date;
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: string[];
  warnings: string[];
}

export interface TariffChanges {
  added: StructuredTariff[];
  modified: Array<{ old: any; new: StructuredTariff }>;
  removed: any[];
  priceChanges: Array<{
    chargeType: string;
    oldAmount: number;
    newAmount: number;
    percentChange: number;
  }>;
}

class TariffIngestionService {
  private readonly AUTO_IMPORT_THRESHOLD = 0.8;
  private readonly MAX_AMOUNT = 1000000;
  private readonly VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'SGD', 'AED', 'JPY', 'CNY'];

  /**
   * Ingest tariffs from PDF URL
   */
  async ingestFromUrl(document: TariffDocument): Promise<{
    reviewTaskId?: string;
    importedCount?: number;
    confidence: number;
  }> {
    try {
      // Download PDF
      const pdfBuffer = await this.downloadPDF(document.url);

      // Calculate hash for change detection
      const documentHash = this.calculateHash(pdfBuffer);

      // Check if already processed
      const existing = await prisma.portTariffDocument.findFirst({
        where: {
          portId: document.portId,
          documentHash,
        },
      });

      if (existing) {
        console.log(`Document already processed: ${documentHash}`);
        return {
          confidence: 1.0,
          importedCount: existing.tariffCount,
        };
      }

      // Extract text from PDF
      const extraction = await pdfExtractionService.extractText(pdfBuffer);

      // Structure tariffs using LLM
      const structured = await llmTariffStructurer.structureTariffsWithFallback(extraction.text);

      // Validate tariffs (4-layer)
      const validated = structured.tariffs.map(t => ({
        tariff: t,
        validation: this.validateTariff(t),
      }));

      // Route based on confidence
      if (structured.overallConfidence >= this.AUTO_IMPORT_THRESHOLD) {
        // Auto-import high-confidence tariffs
        const imported = await this.autoImportTariffs(
          validated.filter(v => v.validation.isValid),
          document
        );

        // Store document record
        await prisma.portTariffDocument.create({
          data: {
            portId: document.portId,
            documentUrl: document.url,
            documentHash,
            extractedAt: new Date(),
            tariffCount: imported,
          },
        });

        return {
          importedCount: imported,
          confidence: structured.overallConfidence,
        };
      } else {
        // Create review task for low-confidence tariffs
        const reviewTask = await prisma.tariffReviewTask.create({
          data: {
            portId: document.portId,
            extractedData: validated.map(v => ({
              ...v.tariff,
              validation: v.validation,
            })),
            confidence: structured.overallConfidence,
            sourceUrl: document.url,
            sourceHash: documentHash,
            issues: validated.flatMap(v => v.validation.issues),
          },
        });

        return {
          reviewTaskId: reviewTask.id,
          confidence: structured.overallConfidence,
        };
      }
    } catch (error) {
      console.error('Tariff ingestion error:', error);
      throw error;
    }
  }

  /**
   * Validate tariff with 4-layer pipeline
   */
  validateTariff(tariff: StructuredTariff): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    let confidence = tariff.confidence;

    // Layer 1: Schema validation (required fields, data types)
    if (!tariff.chargeType) {
      issues.push('Missing charge type');
      confidence -= 0.2;
    }

    if (!tariff.amount || tariff.amount <= 0) {
      issues.push('Invalid amount');
      confidence -= 0.3;
    }

    if (!tariff.currency) {
      issues.push('Missing currency');
      confidence -= 0.1;
    }

    if (!tariff.unit) {
      issues.push('Missing unit');
      confidence -= 0.1;
    }

    // Layer 2: Business logic (amount ranges, unit compatibility)
    if (tariff.amount > this.MAX_AMOUNT) {
      warnings.push(`Amount ${tariff.amount} exceeds typical range`);
      confidence -= 0.1;
    }

    if (tariff.currency && !this.VALID_CURRENCIES.includes(tariff.currency)) {
      issues.push(`Invalid currency: ${tariff.currency}`);
      confidence -= 0.2;
    }

    // Size range validation
    if (tariff.sizeRangeMin && tariff.sizeRangeMax && tariff.sizeRangeMin > tariff.sizeRangeMax) {
      issues.push('Invalid size range: min > max');
      confidence -= 0.2;
    }

    // Layer 3: Duplicate detection (will be checked during import)
    // Layer 4: Confidence routing (threshold check)

    const isValid = issues.length === 0 && confidence >= 0.7;

    return {
      isValid,
      confidence: Math.max(0, Math.min(1, confidence)),
      issues,
      warnings,
    };
  }

  /**
   * Auto-import validated tariffs
   */
  private async autoImportTariffs(
    validated: Array<{ tariff: StructuredTariff; validation: ValidationResult }>,
    document: TariffDocument
  ): Promise<number> {
    let imported = 0;

    for (const { tariff } of validated) {
      try {
        // Check for duplicates (Layer 3 validation)
        const duplicate = await this.checkDuplicate(tariff, document.portId);

        if (duplicate) {
          console.log(`Skipping duplicate: ${tariff.chargeType} for port ${document.portId}`);
          continue;
        }

        // Convert to USD if needed
        const amountUsd = tariff.currency !== 'USD'
          ? (await currencyService.convert(tariff.amount, tariff.currency, 'USD')).converted
          : tariff.amount;

        // Import to database
        await prisma.portTariff.create({
          data: {
            portId: document.portId,
            vesselType: tariff.vesselType || null,
            sizeRangeMin: tariff.sizeRangeMin || null,
            sizeRangeMax: tariff.sizeRangeMax || null,
            chargeType: tariff.chargeType,
            amount: tariff.amount,
            currency: tariff.currency,
            unit: tariff.unit,
            effectiveFrom: document.effectiveFrom || new Date(),
            notes: tariff.conditions?.join('; '),
            dataSource: 'REAL_SCRAPED',
            sourceUrl: document.url,
            scrapedAt: new Date(),
          },
        });

        imported++;
      } catch (error) {
        console.error(`Failed to import tariff: ${tariff.chargeType}`, error);
      }
    }

    return imported;
  }

  /**
   * Check for duplicate tariff
   */
  private async checkDuplicate(tariff: StructuredTariff, portId: string): Promise<boolean> {
    const existing = await prisma.portTariff.findFirst({
      where: {
        portId,
        chargeType: tariff.chargeType,
        sizeRangeMin: tariff.sizeRangeMin || null,
        sizeRangeMax: tariff.sizeRangeMax || null,
        vesselType: tariff.vesselType || null,
        effectiveTo: null, // Only check active tariffs
      },
    });

    return !!existing;
  }

  /**
   * Detect tariff changes (for quarterly updates)
   */
  async detectTariffChanges(
    portId: string,
    newDocument: TariffDocument
  ): Promise<TariffChanges> {
    // Download and extract new document
    const pdfBuffer = await this.downloadPDF(newDocument.url);
    const extraction = await pdfExtractionService.extractText(pdfBuffer);
    const structured = await llmTariffStructurer.structureTariffsWithFallback(extraction.text);

    // Get existing tariffs
    const existing = await prisma.portTariff.findMany({
      where: {
        portId,
        effectiveTo: null, // Only active tariffs
      },
    });

    // Compare
    const added: StructuredTariff[] = [];
    const modified: Array<{ old: any; new: StructuredTariff }> = [];
    const removed: any[] = [];
    const priceChanges: Array<{
      chargeType: string;
      oldAmount: number;
      newAmount: number;
      percentChange: number;
    }> = [];

    // Find new/modified tariffs
    for (const newTariff of structured.tariffs) {
      const match = existing.find(
        e =>
          e.chargeType === newTariff.chargeType &&
          e.sizeRangeMin === (newTariff.sizeRangeMin || null) &&
          e.sizeRangeMax === (newTariff.sizeRangeMax || null)
      );

      if (!match) {
        added.push(newTariff);
      } else if (match.amount !== newTariff.amount) {
        modified.push({ old: match, new: newTariff });

        const percentChange = ((newTariff.amount - match.amount) / match.amount) * 100;
        priceChanges.push({
          chargeType: newTariff.chargeType,
          oldAmount: match.amount,
          newAmount: newTariff.amount,
          percentChange,
        });
      }
    }

    // Find removed tariffs
    for (const oldTariff of existing) {
      const match = structured.tariffs.find(
        n =>
          n.chargeType === oldTariff.chargeType &&
          (n.sizeRangeMin || null) === oldTariff.sizeRangeMin &&
          (n.sizeRangeMax || null) === oldTariff.sizeRangeMax
      );

      if (!match) {
        removed.push(oldTariff);
      }
    }

    return {
      added,
      modified,
      removed,
      priceChanges,
    };
  }

  /**
   * Apply tariff changes (expire old, create new)
   */
  async applyTariffChanges(
    portId: string,
    changes: TariffChanges,
    document: TariffDocument
  ): Promise<void> {
    const now = new Date();

    // Expire removed tariffs
    for (const removed of changes.removed) {
      await prisma.portTariff.update({
        where: { id: removed.id },
        data: { effectiveTo: now },
      });
    }

    // Expire modified tariffs and create new versions
    for (const { old } of changes.modified) {
      await prisma.portTariff.update({
        where: { id: old.id },
        data: { effectiveTo: now },
      });
    }

    // Import new/modified tariffs
    const toImport = [...changes.added, ...changes.modified.map(m => m.new)];

    for (const tariff of toImport) {
      const validation = this.validateTariff(tariff);

      if (validation.isValid) {
        await prisma.portTariff.create({
          data: {
            portId,
            vesselType: tariff.vesselType || null,
            sizeRangeMin: tariff.sizeRangeMin || null,
            sizeRangeMax: tariff.sizeRangeMax || null,
            chargeType: tariff.chargeType,
            amount: tariff.amount,
            currency: tariff.currency,
            unit: tariff.unit,
            effectiveFrom: document.effectiveFrom || now,
            notes: tariff.conditions?.join('; '),
            dataSource: 'REAL_SCRAPED',
            sourceUrl: document.url,
            scrapedAt: now,
          },
        });
      }
    }
  }

  /**
   * Approve tariff from review queue
   */
  async approveFromReview(reviewTaskId: string): Promise<number> {
    const task = await prisma.tariffReviewTask.findUnique({
      where: { id: reviewTaskId },
    });

    if (!task) {
      throw new Error('Review task not found');
    }

    if (task.status !== 'pending') {
      throw new Error('Task already processed');
    }

    const tariffs = task.extractedData as any[];
    let imported = 0;

    for (const tariffData of tariffs) {
      if (tariffData.validation?.isValid) {
        try {
          await prisma.portTariff.create({
            data: {
              portId: task.portId,
              vesselType: tariffData.vesselType || null,
              sizeRangeMin: tariffData.sizeRangeMin || null,
              sizeRangeMax: tariffData.sizeRangeMax || null,
              chargeType: tariffData.chargeType,
              amount: tariffData.amount,
              currency: tariffData.currency,
              unit: tariffData.unit,
              effectiveFrom: new Date(),
              notes: tariffData.conditions?.join('; '),
              dataSource: 'REAL_SCRAPED',
              sourceUrl: task.sourceUrl || '',
              scrapedAt: new Date(),
            },
          });

          imported++;
        } catch (error) {
          console.error('Failed to import approved tariff:', error);
        }
      }
    }

    // Update task
    await prisma.tariffReviewTask.update({
      where: { id: reviewTaskId },
      data: {
        status: 'approved',
        reviewedAt: new Date(),
        approvedCount: imported,
      },
    });

    // Store document record
    if (task.sourceHash) {
      await prisma.portTariffDocument.create({
        data: {
          portId: task.portId,
          documentUrl: task.sourceUrl || '',
          documentHash: task.sourceHash,
          extractedAt: new Date(),
          tariffCount: imported,
        },
      });
    }

    return imported;
  }

  /**
   * Download PDF from URL
   */
  private async downloadPDF(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    return Buffer.from(response.data);
  }

  /**
   * Calculate SHA-256 hash of PDF
   */
  private calculateHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get tariffs needing review
   */
  async getTariffsNeedingReview(limit: number = 10) {
    return prisma.tariffReviewTask.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { port: true },
    });
  }

  /**
   * Get ingestion statistics
   */
  async getIngestionStats(portId?: string) {
    const where = portId ? { portId } : {};

    const [total, realScraped, simulated, reviewPending] = await Promise.all([
      prisma.portTariff.count({ where }),
      prisma.portTariff.count({ where: { ...where, dataSource: 'REAL_SCRAPED' } }),
      prisma.portTariff.count({ where: { ...where, dataSource: 'SIMULATED' } }),
      prisma.tariffReviewTask.count({ where: { ...where, status: 'pending' } }),
    ]);

    return {
      total,
      realScraped,
      simulated,
      reviewPending,
      coveragePercent: total > 0 ? (realScraped / total) * 100 : 0,
    };
  }
}

export const tariffIngestionService = new TariffIngestionService();
