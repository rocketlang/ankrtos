/**
 * Reply Parser Service
 *
 * Parses master replies to alerts and extracts intent for automated actions.
 *
 * Supported Intents:
 * - READY: All documents complete, vessel ready
 * - DELAY: ETA change, reporting delay
 * - QUESTION: Master has a question, needs assistance
 * - CONFIRM: Acknowledgment without action
 * - UNKNOWN: Cannot determine intent
 *
 * Features:
 * - Keyword matching with fuzzy logic
 * - Confidence scoring (0-1)
 * - Entity extraction (hours, documents, reasons)
 * - Multi-language support (basic)
 */

export enum ReplyIntent {
  READY = 'READY',
  DELAY = 'DELAY',
  QUESTION = 'QUESTION',
  CONFIRM = 'CONFIRM',
  UNKNOWN = 'UNKNOWN'
}

export interface ParsedReply {
  intent: ReplyIntent;
  confidence: number; // 0-1
  text: string;
  entities: {
    delayHours?: number;
    delayReason?: string;
    documents?: string[];
    question?: string;
  };
  rawText: string;
  language?: string;
}

export class ReplyParserService {
  // Intent keywords with weights
  private readonly intentKeywords = {
    [ReplyIntent.READY]: {
      primary: ['ready', 'complete', 'done', 'submitted', 'finished', 'all set'],
      secondary: ['ok', 'yes', 'affirmative', 'confirmed', 'sent'],
      weight: 1.0
    },
    [ReplyIntent.DELAY]: {
      primary: ['delay', 'late', 'delayed', 'postpone', 'weather', 'slow'],
      secondary: ['hours', 'hrs', 'h', 'tomorrow', 'next', 'changed'],
      weight: 0.9
    },
    [ReplyIntent.QUESTION]: {
      primary: ['?', 'what', 'how', 'when', 'where', 'why', 'which', 'help'],
      secondary: ['question', 'ask', 'need', 'require', 'clarify', 'explain'],
      weight: 0.8
    },
    [ReplyIntent.CONFIRM]: {
      primary: ['ok', 'okay', 'thanks', 'thank you', 'got it', 'received'],
      secondary: ['acknowledge', 'noted', 'understood'],
      weight: 0.7
    }
  };

  /**
   * Parse reply text and extract intent
   */
  parseReply(text: string): ParsedReply {
    // Clean and normalize text
    const cleanText = this.cleanText(text);

    // Try exact keyword match first
    const exactMatch = this.checkExactMatch(cleanText);
    if (exactMatch) {
      return exactMatch;
    }

    // Calculate scores for each intent
    const intentScores = this.calculateIntentScores(cleanText);

    // Get highest scoring intent
    const { intent, confidence } = this.getHighestScoringIntent(intentScores);

    // Extract entities based on intent
    const entities = this.extractEntities(cleanText, intent);

    return {
      intent,
      confidence,
      text: cleanText,
      entities,
      rawText: text,
      language: this.detectLanguage(cleanText)
    };
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s?]/g, ''); // Keep only alphanumeric, spaces, and ?
  }

  /**
   * Check for exact keyword matches
   */
  private checkExactMatch(text: string): ParsedReply | null {
    // Exact "READY" match
    if (text === 'ready' || text === 'yes' || text === 'done') {
      return {
        intent: ReplyIntent.READY,
        confidence: 1.0,
        text,
        entities: {},
        rawText: text
      };
    }

    // Exact "DELAY" match with hours
    const delayMatch = text.match(/^delay\s*(\d+)\s*(hours?|hrs?|h)?$/i);
    if (delayMatch) {
      return {
        intent: ReplyIntent.DELAY,
        confidence: 1.0,
        text,
        entities: {
          delayHours: parseInt(delayMatch[1])
        },
        rawText: text
      };
    }

    // Just a question mark
    if (text === '?') {
      return {
        intent: ReplyIntent.QUESTION,
        confidence: 1.0,
        text,
        entities: {
          question: 'General question'
        },
        rawText: text
      };
    }

    return null;
  }

  /**
   * Calculate intent scores using keyword matching
   */
  private calculateIntentScores(text: string): Map<ReplyIntent, number> {
    const scores = new Map<ReplyIntent, number>();
    const words = text.split(' ');

    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      let score = 0;

      // Check primary keywords (higher weight)
      for (const keyword of keywords.primary) {
        if (text.includes(keyword)) {
          score += keywords.weight;
        }
      }

      // Check secondary keywords (lower weight)
      for (const keyword of keywords.secondary) {
        if (text.includes(keyword)) {
          score += keywords.weight * 0.5;
        }
      }

      // Normalize by number of words
      score = score / Math.max(words.length, 1);

      scores.set(intent as ReplyIntent, score);
    }

    return scores;
  }

  /**
   * Get intent with highest score
   */
  private getHighestScoringIntent(scores: Map<ReplyIntent, number>): {
    intent: ReplyIntent;
    confidence: number;
  } {
    let maxIntent = ReplyIntent.UNKNOWN;
    let maxScore = 0;

    for (const [intent, score] of scores.entries()) {
      if (score > maxScore) {
        maxScore = score;
        maxIntent = intent;
      }
    }

    // If score is too low, mark as unknown
    if (maxScore < 0.3) {
      return {
        intent: ReplyIntent.UNKNOWN,
        confidence: 0
      };
    }

    return {
      intent: maxIntent,
      confidence: Math.min(maxScore, 1.0)
    };
  }

  /**
   * Extract entities from text based on intent
   */
  private extractEntities(
    text: string,
    intent: ReplyIntent
  ): ParsedReply['entities'] {
    const entities: ParsedReply['entities'] = {};

    switch (intent) {
      case ReplyIntent.DELAY:
        entities.delayHours = this.extractDelayHours(text);
        entities.delayReason = this.extractDelayReason(text);
        break;

      case ReplyIntent.QUESTION:
        entities.question = this.extractQuestion(text);
        break;

      case ReplyIntent.READY:
        entities.documents = this.extractDocuments(text);
        break;
    }

    return entities;
  }

  /**
   * Extract delay duration in hours
   */
  private extractDelayHours(text: string): number | undefined {
    // Pattern: "delay 6 hours", "6h", "delayed 12 hrs"
    const patterns = [
      /(\d+)\s*(hours?|hrs?|h)\b/i,
      /delay.*?(\d+)/i,
      /(\d+).*?(late|delay)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  /**
   * Extract reason for delay
   */
  private extractDelayReason(text: string): string | undefined {
    const reasons = ['weather', 'engine', 'mechanical', 'sea', 'storm', 'wind', 'fuel'];

    for (const reason of reasons) {
      if (text.includes(reason)) {
        // Extract surrounding context
        const words = text.split(' ');
        const index = words.findIndex(w => w.includes(reason));
        if (index >= 0) {
          // Get 2 words before and after
          const context = words.slice(Math.max(0, index - 2), index + 3).join(' ');
          return context;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract question from text
   */
  private extractQuestion(text: string): string | undefined {
    // If text contains question mark, return full text
    if (text.includes('?')) {
      return text;
    }

    // If starts with question word, return full text
    const questionWords = ['what', 'how', 'when', 'where', 'why', 'which'];
    const firstWord = text.split(' ')[0];
    if (questionWords.includes(firstWord)) {
      return text;
    }

    return text; // Return full text as question
  }

  /**
   * Extract document names from text
   */
  private extractDocuments(text: string): string[] | undefined {
    const documentKeywords = [
      'crew list',
      'ballast',
      'declaration',
      'health',
      'customs',
      'manifest',
      'certificate'
    ];

    const found: string[] = [];

    for (const keyword of documentKeywords) {
      if (text.includes(keyword)) {
        found.push(keyword);
      }
    }

    return found.length > 0 ? found : undefined;
  }

  /**
   * Detect language (basic)
   */
  private detectLanguage(text: string): string {
    // Very basic language detection
    // Could be improved with a proper library

    const commonWords = {
      en: ['the', 'is', 'are', 'and', 'or', 'yes', 'no'],
      es: ['el', 'la', 'es', 'son', 'y', 'o', 'si', 'no'],
      fr: ['le', 'la', 'est', 'sont', 'et', 'ou', 'oui', 'non']
    };

    for (const [lang, words] of Object.entries(commonWords)) {
      for (const word of words) {
        if (text.includes(` ${word} `)) {
          return lang;
        }
      }
    }

    return 'en'; // Default to English
  }

  /**
   * Validate parsed reply
   */
  validateParsedReply(parsed: ParsedReply): boolean {
    // Confidence threshold
    if (parsed.confidence < 0.5 && parsed.intent !== ReplyIntent.UNKNOWN) {
      return false;
    }

    // DELAY must have hours or reason
    if (parsed.intent === ReplyIntent.DELAY) {
      return !!(parsed.entities.delayHours || parsed.entities.delayReason);
    }

    return true;
  }

  /**
   * Get human-readable intent description
   */
  getIntentDescription(intent: ReplyIntent): string {
    const descriptions = {
      [ReplyIntent.READY]: 'Master confirmed all documents complete and ready',
      [ReplyIntent.DELAY]: 'Master reported a delay or ETA change',
      [ReplyIntent.QUESTION]: 'Master has a question or needs assistance',
      [ReplyIntent.CONFIRM]: 'Master acknowledged the alert',
      [ReplyIntent.UNKNOWN]: 'Could not determine intent from reply'
    };

    return descriptions[intent];
  }
}

export const replyParserService = new ReplyParserService();
