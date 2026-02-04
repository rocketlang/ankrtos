/**
 * LLM Tariff Structurer
 *
 * Uses @ankr/eon for LLM-based tariff structuring with confidence scoring
 */

import { createEON, type EONConfig } from '@ankr/eon';
// Temporarily disabled - tariff-extraction-patterns.ts doesn't export these yet
// import {
//   type TariffPattern,
//   LLM_PROMPT_TEMPLATE,
//   FEW_SHOT_EXAMPLES,
//   normalizeChargeType,
//   normalizeUnit,
//   normalizeCurrency,
//   parseAmount,
//   parseSizeRange,
// } from './tariff-extraction-patterns.js';

import { getTariffExtractionPatterns } from './tariff-extraction-patterns.js';

// Temporary type definition until TariffPattern is properly exported
export interface TariffPattern {
  chargeType: string;
  amount: number;
  currency: string;
  unit: string;
  sizeRangeMin?: number;
  sizeRangeMax?: number;
  vesselType?: string;
  cargoType?: string;
  conditions?: string[];
  rawText?: string;
}

// Initialize EON for LLM access
const eon = createEON();

export interface StructuredTariff extends TariffPattern {
  confidence: number;
  issues?: string[];
}

export interface StructuringResult {
  tariffs: StructuredTariff[];
  overallConfidence: number;
  processingTime: number;
}

class LLMTariffStructurer {
  private readonly BASE_CONFIDENCE = 0.95;
  private readonly CONFIDENCE_PENALTIES = {
    missingField: 0.1,
    ambiguousAmount: 0.15,
    ambiguousUnit: 0.1,
    ambiguousChargeType: 0.2,
    multipleTariffs: 0.05,
  };

  /**
   * Structure tariffs using LLM
   */
  async structureTariffs(extractedText: string): Promise<StructuringResult> {
    const startTime = Date.now();

    try {
      // Build prompt with few-shot examples
      const prompt = this.buildPrompt(extractedText);

      // Call LLM via @ankr/eon
      // TODO: Fix eonProxy API call - temporarily disabled for testing
      // const response = await eonProxy.chat({
      //   messages: [{ role: 'user', content: prompt }],
      //   temperature: 0.1, // Low temperature for consistent extraction
      //   maxTokens: 4000,
      // });
      const response = { choices: [{ message: { content: '[]' } }] }; // Mock response

      // Parse LLM response
      const tariffs = this.parseResponse(response.choices[0].message.content);

      // Assign confidence scores
      const scoredTariffs = tariffs.map(t => this.assignConfidenceScore(t, extractedText));

      // Calculate overall confidence
      const overallConfidence = scoredTariffs.length > 0
        ? scoredTariffs.reduce((sum, t) => sum + t.confidence, 0) / scoredTariffs.length
        : 0;

      const processingTime = Date.now() - startTime;

      return {
        tariffs: scoredTariffs,
        overallConfidence,
        processingTime,
      };

    } catch (error) {
      console.error('LLM structuring error:', error);
      throw new Error(`Failed to structure tariffs with LLM: ${error}`);
    }
  }

  /**
   * Build prompt with few-shot examples
   */
  buildPrompt(extractedText: string): string {
    // Temporarily disabled - FEW_SHOT_EXAMPLES and LLM_PROMPT_TEMPLATE not available
    // TODO: Re-enable once tariff-extraction-patterns.ts exports these
    const prompt = `Extract structured tariff data from the following text:\n\n${extractedText}\n\nReturn JSON array of tariffs.`;
    return prompt;
  }

  /**
   * Parse LLM response (extract JSON)
   */
  parseResponse(response: string): TariffPattern[] {
    try {
      // Try to find JSON array in response
      const jsonMatch = response.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        console.warn('No JSON array found in LLM response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        console.warn('LLM response is not an array');
        return [];
      }

      // Validate and normalize each tariff
      return parsed
        .filter(t => this.isValidTariff(t))
        .map(t => this.normalizeTariff(t));

    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      return [];
    }
  }

  /**
   * Validate tariff object
   */
  private isValidTariff(obj: any): boolean {
    return (
      obj &&
      typeof obj === 'object' &&
      obj.chargeType &&
      typeof obj.amount === 'number' &&
      obj.currency &&
      obj.unit
    );
  }

  /**
   * Normalize tariff (ensure correct types)
   */
  private normalizeTariff(tariff: any): TariffPattern {
    const patterns = getTariffExtractionPatterns();
    return {
      chargeType: patterns.normalizeChargeType(tariff.chargeType),
      amount: typeof tariff.amount === 'string' ? parseFloat(tariff.amount) || 0 : tariff.amount,
      currency: patterns.normalizeCurrency(tariff.currency),
      unit: patterns.normalizeUnit(tariff.unit),
      sizeRangeMin: tariff.sizeRangeMin,
      sizeRangeMax: tariff.sizeRangeMax,
      vesselType: tariff.vesselType,
      cargoType: tariff.cargoType,
      conditions: Array.isArray(tariff.conditions) ? tariff.conditions : [],
      rawText: tariff.rawText || '',
    };
  }

  /**
   * Assign confidence score to tariff
   */
  assignConfidenceScore(tariff: TariffPattern, sourceText: string): StructuredTariff {
    let confidence = this.BASE_CONFIDENCE;
    const issues: string[] = [];

    // Check for required fields
    if (!tariff.chargeType) {
      confidence -= this.CONFIDENCE_PENALTIES.missingField;
      issues.push('Missing charge type');
    }

    if (!tariff.amount || tariff.amount <= 0) {
      confidence -= this.CONFIDENCE_PENALTIES.ambiguousAmount;
      issues.push('Invalid or missing amount');
    }

    if (!tariff.currency) {
      confidence -= this.CONFIDENCE_PENALTIES.missingField;
      issues.push('Missing currency');
    }

    if (!tariff.unit) {
      confidence -= this.CONFIDENCE_PENALTIES.ambiguousUnit;
      issues.push('Missing unit');
    }

    // Check if raw text exists in source
    if (tariff.rawText && !sourceText.includes(tariff.rawText.substring(0, 50))) {
      confidence -= 0.2;
      issues.push('Raw text not found in source');
    }

    // Check for ambiguous charge type
    if (tariff.chargeType === 'other') {
      confidence -= this.CONFIDENCE_PENALTIES.ambiguousChargeType;
      issues.push('Ambiguous charge type');
    }

    // Check for reasonable amount ranges
    if (tariff.amount > 1000000) {
      confidence -= 0.1;
      issues.push('Unusually high amount');
    }

    // Ensure confidence is between 0 and 1
    confidence = Math.max(0, Math.min(1, confidence));

    return {
      ...tariff,
      confidence,
      issues: issues.length > 0 ? issues : undefined,
    };
  }

  /**
   * Structure tariffs with regex fallback (if LLM fails)
   */
  async structureTariffsWithFallback(extractedText: string): Promise<StructuringResult> {
    try {
      // Try LLM first
      return await this.structureTariffs(extractedText);
    } catch (error) {
      console.warn('LLM structuring failed, using regex fallback:', error);

      // Fallback to regex-based extraction
      return this.extractWithRegex(extractedText);
    }
  }

  /**
   * Extract tariffs using regex patterns (fallback)
   */
  private extractWithRegex(text: string): StructuringResult {
    const startTime = Date.now();

    // Use the TariffExtractionPatterns class for regex extraction
    const patterns = getTariffExtractionPatterns();
    const extractedTariffs = patterns.extractTariffs(text);

    // Convert to StructuredTariff format
    const tariffs: StructuredTariff[] = extractedTariffs.map(t => ({
      chargeType: t.chargeType,
      amount: t.amount,
      currency: t.currency,
      unit: t.unit,
      sizeRangeMin: t.sizeRangeMin,
      sizeRangeMax: t.sizeRangeMax,
      rawText: t.sourceText,
      confidence: t.confidence,
      issues: ['Extracted with regex fallback'],
    }));

    const processingTime = Date.now() - startTime;
    const overallConfidence = tariffs.length > 0
      ? tariffs.reduce((sum, t) => sum + t.confidence, 0) / tariffs.length
      : 0;

    return {
      tariffs,
      overallConfidence,
      processingTime,
    };
  }

  /**
   * Batch structure multiple documents
   */
  async structureBatch(documents: Array<{ id: string; text: string }>): Promise<Map<string, StructuringResult>> {
    const results = new Map<string, StructuringResult>();

    // Process in parallel (with concurrency limit)
    const CONCURRENCY = 3;

    for (let i = 0; i < documents.length; i += CONCURRENCY) {
      const batch = documents.slice(i, i + CONCURRENCY);

      const batchResults = await Promise.all(
        batch.map(async (doc) => {
          try {
            const result = await this.structureTariffsWithFallback(doc.text);
            return { id: doc.id, result };
          } catch (error) {
            console.error(`Failed to structure document ${doc.id}:`, error);
            return {
              id: doc.id,
              result: {
                tariffs: [],
                overallConfidence: 0,
                processingTime: 0,
              },
            };
          }
        })
      );

      for (const { id, result } of batchResults) {
        results.set(id, result);
      }
    }

    return results;
  }
}

export const llmTariffStructurer = new LLMTariffStructurer();
