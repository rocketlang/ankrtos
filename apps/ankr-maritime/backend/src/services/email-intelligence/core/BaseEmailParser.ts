/**
 * Universal Email Parser - Base Implementation
 * Industry-agnostic email intelligence engine
 *
 * @package @ankr/email-intelligence
 * @author ANKR Labs
 * @version 1.0.0
 */

import type {
  EmailParserConfig,
  EmailParseResult,
  EmailInput,
  UniversalEntity,
  UrgencyLevel,
  ActionableType,
  BucketCondition,
} from './types.js';

/**
 * BaseEmailParser
 * Universal email parser that works for any industry via configuration
 */
export class BaseEmailParser {
  private config: EmailParserConfig;
  private stats: {
    totalParsed: number;
    totalProcessingTime: number;
    categoryCount: Map<string, number>;
    urgencyCount: Map<UrgencyLevel, number>;
    bucketCount: Map<string, number>;
  };

  constructor(config: EmailParserConfig) {
    this.config = config;
    this.stats = {
      totalParsed: 0,
      totalProcessingTime: 0,
      categoryCount: new Map(),
      urgencyCount: new Map(),
      bucketCount: new Map(),
    };
  }

  /**
   * Parse email using configured extractors and classifiers
   */
  async parse(input: EmailInput | string, body?: string): Promise<EmailParseResult> {
    const startTime = Date.now();

    // Normalize input
    const { subject, bodyText } = this.normalizeInput(input, body);

    // Call lifecycle hook
    if (this.config.customParsers?.onBeforeParse) {
      await this.config.customParsers.onBeforeParse(subject, bodyText);
    }

    // Clean HTML
    const cleanBody = this.stripHtml(bodyText);
    const combinedText = `${subject}\n${cleanBody}`;

    // 1. Extract entities
    const entities = await this.extractEntities(combinedText);

    // 2. Classify category
    const { category, confidence: categoryConfidence } = this.classifyCategory(
      subject,
      cleanBody
    );

    // 3. Determine urgency
    const { level: urgency, score: urgencyScore } = this.determineUrgency(
      subject,
      cleanBody
    );

    // 4. Determine actionability
    const { type: actionable, confidence: actionableConfidence } =
      this.determineActionability(cleanBody);

    // 5. Apply custom parsers
    const customData = await this.applyCustomParsers(combinedText);

    // 6. Bucketize
    const { bucket, matched: bucketMatched } = this.bucketize({
      entities,
      category,
      urgency,
      actionable,
      customData,
    });

    // 7. Calculate overall confidence
    const confidence = this.calculateConfidence({
      entities,
      categoryConfidence,
      actionableConfidence,
      urgencyScore,
    });

    const processingTime = Date.now() - startTime;

    let result: EmailParseResult = {
      entities,
      category,
      categoryConfidence,
      urgency,
      urgencyScore,
      actionable,
      actionableConfidence,
      bucket,
      bucketMatched,
      customData,
      confidence,
      processingTime,
      parserVersion: this.config.version,
    };

    // Call lifecycle hook
    if (this.config.customParsers?.onAfterParse) {
      result = await this.config.customParsers.onAfterParse(result);
    }

    // Update stats
    this.updateStats(result);

    return result;
  }

  /**
   * Extract entities using configured extractors
   */
  private async extractEntities(text: string): Promise<UniversalEntity[]> {
    const entities: UniversalEntity[] = [];

    for (const [type, extractor] of Object.entries(this.config.entityExtractors)) {
      // Regex-based extraction
      if (extractor.pattern) {
        const extracted = this.extractWithRegex(text, extractor.pattern, type, extractor);
        entities.push(...extracted);
      }

      // Multiple patterns
      if (extractor.patterns) {
        for (const pattern of extractor.patterns) {
          const extracted = this.extractWithRegex(text, pattern, type, extractor);
          entities.push(...extracted);
        }
      }

      // RAG-powered extraction (placeholder for future)
      if (extractor.ragQuery) {
        // TODO: Integrate with RAG system
        // const ragResults = await this.extractWithRAG(text, extractor.ragQuery);
        // entities.push(...ragResults);
      }
    }

    // Validate
    const validated = entities.filter((entity) => {
      const extractor = this.config.entityExtractors[entity.type];
      if (extractor.validator) {
        return extractor.validator(String(entity.value));
      }
      return true;
    });

    // Transform
    const transformed = validated.map((entity) => {
      const extractor = this.config.entityExtractors[entity.type];
      if (extractor.transformer) {
        return {
          ...entity,
          value: extractor.transformer(String(entity.value)),
        };
      }
      return entity;
    });

    // Deduplicate
    return this.deduplicateEntities(transformed);
  }

  /**
   * Extract entities using regex
   */
  private extractWithRegex(
    text: string,
    pattern: RegExp,
    type: string,
    extractor: any
  ): UniversalEntity[] {
    const entities: UniversalEntity[] = [];
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const value = match[1] || match[0];
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;

      entities.push({
        type,
        value: value.trim(),
        context: this.extractContext(text, startIndex, endIndex),
        confidence: extractor.weight || 0.9,
        startIndex,
        endIndex,
      });
    }

    return entities;
  }

  /**
   * Classify email category using keyword scoring
   */
  private classifyCategory(
    subject: string,
    body: string
  ): { category: string; confidence: number } {
    const subjectLower = subject.toLowerCase();
    const bodyLower = body.toLowerCase();

    const scores: Record<string, number> = {};

    // Score each category
    for (const categoryConfig of this.config.categories) {
      let score = 0;

      for (const keyword of categoryConfig.keywords) {
        const keywordLower = keyword.toLowerCase();

        // Subject matches weighted 3x
        const subjectMatches = (
          subjectLower.match(new RegExp(`\\b${this.escapeRegex(keywordLower)}\\b`, 'g')) || []
        ).length;
        score += subjectMatches * 3 * categoryConfig.weight;

        // Body matches
        const bodyMatches = (
          bodyLower.match(new RegExp(`\\b${this.escapeRegex(keywordLower)}\\b`, 'g')) || []
        ).length;
        score += bodyMatches * categoryConfig.weight;
      }

      scores[categoryConfig.name] = score;
    }

    // Find top category
    let maxScore = 0;
    let topCategory = 'general';

    for (const [category, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        topCategory = category;
      }
    }

    // Minimum threshold
    if (maxScore < 2) {
      topCategory = 'general';
      maxScore = 0;
    }

    // Calculate confidence
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const confidence = totalScore > 0 ? Math.min(maxScore / totalScore, 1.0) : 0.5;

    return { category: topCategory, confidence };
  }

  /**
   * Determine urgency level
   */
  private determineUrgency(
    subject: string,
    body: string
  ): { level: UrgencyLevel; score: number } {
    let score = 30; // Base score (medium)

    const subjectLower = subject.toLowerCase();
    const bodyLower = body.toLowerCase();

    // Use configured urgency keywords or defaults
    const urgencyKeywords = this.config.urgencyKeywords || {
      critical: ['urgent', 'critical', 'emergency', 'asap', 'immediately'],
      high: ['important', 'priority', 'soon', 'expedite'],
      medium: ['please', 'kindly'],
      low: ['fyi', 'for your information', 'for your records'],
    };

    // Subject urgency (weighted higher)
    for (const keyword of urgencyKeywords.critical) {
      if (subjectLower.includes(keyword)) score += 30;
    }
    for (const keyword of urgencyKeywords.high) {
      if (subjectLower.includes(keyword)) score += 15;
    }

    // Body urgency
    for (const keyword of urgencyKeywords.critical) {
      if (bodyLower.includes(keyword)) score += 20;
    }
    for (const keyword of urgencyKeywords.high) {
      if (bodyLower.includes(keyword)) score += 10;
    }
    for (const keyword of urgencyKeywords.low) {
      if (bodyLower.includes(keyword)) score -= 15;
    }

    // Deadline detection
    if (/by (eod|cob|end of (day|business))/i.test(bodyLower)) score += 25;
    if (/within \d+ hours?/i.test(bodyLower)) score += 20;
    if (/today|tonight|this (morning|afternoon|evening)/i.test(bodyLower)) score += 15;

    // Cap score
    score = Math.max(0, Math.min(100, score));

    // Determine level
    let level: UrgencyLevel;
    if (score >= 70) level = 'critical';
    else if (score >= 50) level = 'high';
    else if (score >= 25) level = 'medium';
    else level = 'low';

    return { level, score };
  }

  /**
   * Determine actionability
   */
  private determineActionability(
    body: string
  ): { type: ActionableType; confidence: number } {
    const bodyLower = body.toLowerCase();

    // Use configured actionability keywords or defaults
    const actionabilityKeywords = this.config.actionabilityKeywords || {
      requires_approval: [
        'please approve',
        'for your approval',
        'request approval',
        'authorization required',
      ],
      requires_response: [
        'please confirm',
        'kindly revert',
        'awaiting your response',
        'please advise',
      ],
      requires_action: [
        'please arrange',
        'kindly provide',
        'please send',
        'submit',
        'prepare',
      ],
      informational: ['fyi', 'for your information', 'for your records'],
    };

    // Check in priority order
    for (const keyword of actionabilityKeywords.requires_approval) {
      if (bodyLower.includes(keyword)) {
        return { type: 'requires_approval', confidence: 0.9 };
      }
    }

    for (const keyword of actionabilityKeywords.requires_response) {
      if (bodyLower.includes(keyword)) {
        return { type: 'requires_response', confidence: 0.85 };
      }
    }

    for (const keyword of actionabilityKeywords.requires_action) {
      if (bodyLower.includes(keyword)) {
        return { type: 'requires_action', confidence: 0.8 };
      }
    }

    for (const keyword of actionabilityKeywords.informational) {
      if (bodyLower.includes(keyword)) {
        return { type: 'informational', confidence: 0.9 };
      }
    }

    // Default
    return { type: 'informational', confidence: 0.5 };
  }

  /**
   * Apply custom parsers
   */
  private async applyCustomParsers(text: string): Promise<Record<string, any>> {
    const customData: Record<string, any> = {};

    if (!this.config.customParsers) {
      return customData;
    }

    for (const [name, parser] of Object.entries(this.config.customParsers)) {
      if (typeof parser.parse === 'function') {
        customData[name] = await parser.parse(text);
      }
    }

    return customData;
  }

  /**
   * Bucketize based on configured rules
   */
  private bucketize(parseResult: any): { bucket: string; matched: boolean } {
    for (const bucketConfig of this.config.buckets) {
      let allConditionsMet = true;

      for (const condition of bucketConfig.conditions) {
        const value = this.getFieldValue(parseResult, condition.field);
        const conditionMet = this.evaluateCondition(value, condition);

        if (!conditionMet) {
          allConditionsMet = false;
          break;
        }
      }

      if (allConditionsMet) {
        return { bucket: bucketConfig.id, matched: true };
      }
    }

    return { bucket: 'general', matched: false };
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(value: any, condition: BucketCondition): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'matches':
        return new RegExp(condition.value).test(String(value));
      case 'gt':
        return value > condition.value;
      case 'lt':
        return value < condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(params: {
    entities: UniversalEntity[];
    categoryConfidence: number;
    actionableConfidence: number;
    urgencyScore: number;
  }): number {
    // Weight: 40% entities, 30% category, 20% actionable, 10% urgency
    let confidence = 0;

    // Entity confidence
    if (params.entities.length > 0) {
      const avgEntityConfidence =
        params.entities.reduce((sum, e) => sum + e.confidence, 0) / params.entities.length;
      confidence += avgEntityConfidence * 0.4;
    } else {
      confidence += 0.2; // Low confidence if no entities
    }

    // Category confidence
    confidence += params.categoryConfidence * 0.3;

    // Actionable confidence
    confidence += params.actionableConfidence * 0.2;

    // Urgency score (normalized to 0-1)
    confidence += (params.urgencyScore / 100) * 0.1;

    return Math.round(confidence * 100) / 100;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Normalize input
   */
  private normalizeInput(
    input: EmailInput | string,
    body?: string
  ): { subject: string; bodyText: string } {
    if (typeof input === 'string') {
      return { subject: input, bodyText: body || '' };
    }

    return { subject: input.subject, bodyText: input.body };
  }

  /**
   * Strip HTML tags
   */
  private stripHtml(text: string): string {
    let clean = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '');

    // Decode HTML entities
    clean = clean
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/gi, ' ');

    // Collapse whitespace
    clean = clean.replace(/[ \t]+/g, ' ');
    clean = clean.replace(/\n{3,}/g, '\n\n');

    return clean.trim();
  }

  /**
   * Extract context around match
   */
  private extractContext(text: string, startIndex: number, endIndex: number): string {
    const contextRadius = 30;
    const start = Math.max(0, startIndex - contextRadius);
    const end = Math.min(text.length, endIndex + contextRadius);

    let ctx = text.slice(start, end).replace(/\n/g, ' ').trim();
    if (start > 0) ctx = '...' + ctx;
    if (end < text.length) ctx = ctx + '...';

    return ctx;
  }

  /**
   * Get field value from object using dot notation
   */
  private getFieldValue(obj: any, field: string): any {
    const parts = field.split('.');
    let value = obj;

    for (const part of parts) {
      value = value?.[part];
    }

    return value;
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Deduplicate entities
   */
  private deduplicateEntities(entities: UniversalEntity[]): UniversalEntity[] {
    const seen = new Map<string, UniversalEntity>();

    for (const entity of entities) {
      const key = `${entity.type}:${String(entity.value).toLowerCase()}`;

      if (!seen.has(key)) {
        seen.set(key, entity);
      } else {
        // Keep entity with higher confidence
        const existing = seen.get(key)!;
        if (entity.confidence > existing.confidence) {
          seen.set(key, entity);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Update statistics
   */
  private updateStats(result: EmailParseResult): void {
    this.stats.totalParsed++;
    this.stats.totalProcessingTime += result.processingTime || 0;

    this.stats.categoryCount.set(
      result.category,
      (this.stats.categoryCount.get(result.category) || 0) + 1
    );

    this.stats.urgencyCount.set(
      result.urgency,
      (this.stats.urgencyCount.get(result.urgency) || 0) + 1
    );

    this.stats.bucketCount.set(
      result.bucket,
      (this.stats.bucketCount.get(result.bucket) || 0) + 1
    );
  }

  /**
   * Get parser statistics
   */
  getStats() {
    return {
      totalParsed: this.stats.totalParsed,
      avgProcessingTime:
        this.stats.totalParsed > 0
          ? this.stats.totalProcessingTime / this.stats.totalParsed
          : 0,
      categoryBreakdown: Object.fromEntries(this.stats.categoryCount),
      urgencyBreakdown: Object.fromEntries(this.stats.urgencyCount),
      bucketBreakdown: Object.fromEntries(this.stats.bucketCount),
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.totalParsed = 0;
    this.stats.totalProcessingTime = 0;
    this.stats.categoryCount.clear();
    this.stats.urgencyCount.clear();
    this.stats.bucketCount.clear();
  }
}
