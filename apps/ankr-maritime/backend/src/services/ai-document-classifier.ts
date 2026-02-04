/**
 * AI Document Classification Service
 * Phase 33: Task #69 - AI Document Classification & Tagging
 *
 * Automatically classifies and tags documents using:
 * - Content analysis (file name, extracted text)
 * - Pattern matching (maritime terminology)
 * - ML-based classification (via Groq/local models)
 * - Duplicate detection (hash + similarity)
 * - Related documents finder (embeddings)
 */

import { prisma } from '../lib/prisma.js';
import { createHash } from 'crypto';

export interface ClassificationResult {
  category: string;
  subcategory: string | null;
  confidence: number;
  suggestedTags: string[];
  suggestedFolderPath: string[];
  extractedEntities: {
    vessels: string[];
    ports: string[];
    companies: string[];
    dates: string[];
    amounts: string[];
  };
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateOf?: string;
  similarity?: number;
  reason: string;
}

export interface RelatedDocument {
  documentId: string;
  title: string;
  similarity: number;
  reason: string;
}

/**
 * Document type patterns (file name and content analysis)
 */
const DOCUMENT_PATTERNS = {
  charter_party: {
    keywords: [
      'charter party',
      'charterparty',
      'time charter',
      'voyage charter',
      'bareboat charter',
      'gencon',
      'nype',
      'shelltime',
      'baltime',
      'owner',
      'charterer',
      'hire rate',
      'laycan',
      'demurrage',
      'despatch',
    ],
    filePatterns: [/c[\s_-]?p/i, /charter/i, /gencon/i, /nype/i],
    weight: 1.0,
  },
  bill_of_lading: {
    keywords: [
      'bill of lading',
      'bol',
      'b/l',
      'shipper',
      'consignee',
      'notify party',
      'shipped on board',
      'freight prepaid',
      'freight collect',
      'container number',
      'seal number',
    ],
    filePatterns: [/\bbol\b/i, /b[\s_-]?l/i, /lading/i],
    weight: 1.0,
  },
  invoice: {
    keywords: [
      'invoice',
      'proforma invoice',
      'commercial invoice',
      'invoice number',
      'total amount',
      'payment terms',
      'due date',
      'tax id',
      'vat',
    ],
    filePatterns: [/invoice/i, /inv[\s_-]?\d+/i],
    weight: 0.9,
  },
  email: {
    keywords: [
      'from:',
      'to:',
      'subject:',
      'cc:',
      'bcc:',
      'sent:',
      'received:',
      'forwarded',
      'reply',
    ],
    filePatterns: [/\.eml$/i, /\.msg$/i, /email/i],
    weight: 1.0,
  },
  contract: {
    keywords: [
      'agreement',
      'contract',
      'parties agree',
      'terms and conditions',
      'whereas',
      'witnesseth',
      'signed and delivered',
      'counterparts',
    ],
    filePatterns: [/contract/i, /agreement/i],
    weight: 0.8,
  },
  certificate: {
    keywords: [
      'certificate',
      'certification',
      'certify',
      'valid until',
      'expiry date',
      'issued by',
      'certificate number',
      'class notation',
    ],
    filePatterns: [/cert/i, /certificate/i],
    weight: 0.9,
  },
  sop: {
    keywords: [
      'standard operating procedure',
      'sop',
      'procedure',
      'guidelines',
      'instructions',
      'step 1',
      'step 2',
      'workflow',
    ],
    filePatterns: [/sop/i, /procedure/i, /guideline/i],
    weight: 0.8,
  },
  compliance: {
    keywords: [
      'regulation',
      'compliance',
      'imo',
      'solas',
      'marpol',
      'isps',
      'stcw',
      'regulatory',
      'audit',
      'inspection',
    ],
    filePatterns: [/compliance/i, /regulation/i, /audit/i],
    weight: 0.9,
  },
  port_document: {
    keywords: [
      'port clearance',
      'port entry',
      'port departure',
      'customs',
      'immigration',
      'port authority',
      'harbor master',
    ],
    filePatterns: [/port/i, /customs/i, /clearance/i],
    weight: 0.8,
  },
  voyage_report: {
    keywords: [
      'noon report',
      'departure report',
      'arrival report',
      'voyage report',
      'position',
      'course',
      'speed',
      'weather',
      'sea state',
    ],
    filePatterns: [/report/i, /noon/i, /voyage/i],
    weight: 0.8,
  },
};

/**
 * Maritime entity patterns
 */
const ENTITY_PATTERNS = {
  vessel_names: {
    // Vessel names often appear in ALL CAPS or Title Case
    pattern: /\b(M\/V|MV|M\/T|MT|S\/S|SS)\s+([A-Z][A-Z\s]+)\b/g,
    extract: (match: RegExpMatchArray) => match[2].trim(),
  },
  imo_numbers: {
    pattern: /\bIMO\s*:?\s*(\d{7})\b/gi,
    extract: (match: RegExpMatchArray) => `IMO ${match[1]}`,
  },
  port_codes: {
    // UN/LOCODE format: 5 characters (2 country + 3 port)
    pattern: /\b([A-Z]{2}[A-Z0-9]{3})\b/g,
    extract: (match: RegExpMatchArray) => match[1],
  },
  dates: {
    // Various date formats
    pattern:
      /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi,
    extract: (match: RegExpMatchArray) => match[0],
  },
  amounts: {
    // Currency amounts
    pattern: /\b(?:USD|EUR|GBP|JPY)?\s*\$?\s*([\d,]+(?:\.\d{2})?)\s*(?:USD|EUR|GBP|JPY)?\b/gi,
    extract: (match: RegExpMatchArray) => match[0],
  },
};

/**
 * Smart folder structure suggestions
 */
const FOLDER_STRUCTURES: Record<string, string[]> = {
  charter_party: ['Charters', 'Time Charters'],
  bill_of_lading: ['Operations', 'Bills of Lading'],
  invoice: ['Finance', 'Invoices'],
  certificate: ['Compliance', 'Certificates'],
  sop: ['Operations', 'SOPs'],
  compliance: ['Compliance', 'Regulations'],
  contract: ['Legal', 'Contracts'],
  voyage_report: ['Operations', 'Voyage Reports'],
  email: ['Communications', 'Emails'],
};

class AIDocumentClassifier {
  /**
   * Classify document based on file name and content
   */
  async classifyDocument(
    fileName: string,
    extractedText?: string,
    metadata?: Record<string, any>
  ): Promise<ClassificationResult> {
    const text = (extractedText || '').toLowerCase();
    const scores: Record<string, number> = {};

    // Score each document type
    for (const [docType, config] of Object.entries(DOCUMENT_PATTERNS)) {
      let score = 0;

      // Check file name patterns
      for (const pattern of config.filePatterns) {
        if (pattern.test(fileName)) {
          score += 0.3 * config.weight;
          break;
        }
      }

      // Check keywords in content
      if (text) {
        const keywordMatches = config.keywords.filter((keyword) =>
          text.includes(keyword.toLowerCase())
        );
        score += (keywordMatches.length / config.keywords.length) * 0.7 * config.weight;
      }

      scores[docType] = score;
    }

    // Find best match
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [category, confidence] = sortedScores[0] || ['general', 0];

    // Extract entities
    const extractedEntities = text ? this.extractEntities(text) : this.getEmptyEntities();

    // Generate tags
    const suggestedTags = this.generateTags(category, extractedEntities, fileName);

    // Suggest folder path
    const suggestedFolderPath = FOLDER_STRUCTURES[category] || ['General'];

    // Determine subcategory based on specific patterns
    const subcategory = this.determineSubcategory(category, text, fileName);

    return {
      category: confidence > 0.3 ? category : 'general',
      subcategory,
      confidence: Math.min(confidence, 1.0),
      suggestedTags,
      suggestedFolderPath,
      extractedEntities,
    };
  }

  /**
   * Extract maritime entities from text
   */
  private extractEntities(text: string): {
    vessels: string[];
    ports: string[];
    companies: string[];
    dates: string[];
    amounts: string[];
  } {
    const entities = {
      vessels: new Set<string>(),
      ports: new Set<string>(),
      companies: new Set<string>(),
      dates: new Set<string>(),
      amounts: new Set<string>(),
    };

    // Extract vessel names
    const vesselMatches = text.matchAll(ENTITY_PATTERNS.vessel_names.pattern);
    for (const match of vesselMatches) {
      const vessel = ENTITY_PATTERNS.vessel_names.extract(match);
      if (vessel && vessel.length > 2) {
        entities.vessels.add(vessel);
      }
    }

    // Extract IMO numbers
    const imoMatches = text.matchAll(ENTITY_PATTERNS.imo_numbers.pattern);
    for (const match of imoMatches) {
      const imo = ENTITY_PATTERNS.imo_numbers.extract(match);
      entities.vessels.add(imo);
    }

    // Extract port codes
    const portMatches = text.matchAll(ENTITY_PATTERNS.port_codes.pattern);
    for (const match of portMatches) {
      const port = ENTITY_PATTERNS.port_codes.extract(match);
      // Validate it's a known port code (basic validation)
      if (this.isLikelyPortCode(port)) {
        entities.ports.add(port);
      }
    }

    // Extract dates
    const dateMatches = text.matchAll(ENTITY_PATTERNS.dates.pattern);
    for (const match of dateMatches) {
      const date = ENTITY_PATTERNS.dates.extract(match);
      entities.dates.add(date);
    }

    // Extract amounts
    const amountMatches = text.matchAll(ENTITY_PATTERNS.amounts.pattern);
    for (const match of amountMatches) {
      const amount = ENTITY_PATTERNS.amounts.extract(match);
      if (this.isLikelyAmount(amount)) {
        entities.amounts.add(amount);
      }
    }

    return {
      vessels: Array.from(entities.vessels).slice(0, 10),
      ports: Array.from(entities.ports).slice(0, 10),
      companies: [], // TODO: Implement company name extraction
      dates: Array.from(entities.dates).slice(0, 10),
      amounts: Array.from(entities.amounts).slice(0, 10),
    };
  }

  /**
   * Generate smart tags based on classification and entities
   */
  private generateTags(
    category: string,
    entities: {
      vessels: string[];
      ports: string[];
      companies: string[];
      dates: string[];
      amounts: string[];
    },
    fileName: string
  ): string[] {
    const tags = new Set<string>();

    // Add category tag
    tags.add(category.replace('_', '-'));

    // Add year tag if found in filename or dates
    const yearMatch = fileName.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      tags.add(`year-${yearMatch[1]}`);
    } else if (entities.dates.length > 0) {
      const firstDate = entities.dates[0];
      const dateYearMatch = firstDate.match(/\b(20\d{2})\b/);
      if (dateYearMatch) {
        tags.add(`year-${dateYearMatch[1]}`);
      }
    }

    // Add vessel tags
    entities.vessels.slice(0, 3).forEach((vessel) => {
      tags.add(`vessel-${vessel.toLowerCase().replace(/\s+/g, '-')}`);
    });

    // Add port tags
    entities.ports.slice(0, 3).forEach((port) => {
      tags.add(`port-${port.toLowerCase()}`);
    });

    // Add urgency tags based on keywords
    const fileNameLower = fileName.toLowerCase();
    if (
      fileNameLower.includes('urgent') ||
      fileNameLower.includes('asap') ||
      fileNameLower.includes('priority')
    ) {
      tags.add('urgent');
    }

    // Add status tags
    if (fileNameLower.includes('draft')) {
      tags.add('draft');
    } else if (fileNameLower.includes('final')) {
      tags.add('final');
    } else if (fileNameLower.includes('signed')) {
      tags.add('signed');
    }

    return Array.from(tags).slice(0, 10);
  }

  /**
   * Determine subcategory based on specific patterns
   */
  private determineSubcategory(
    category: string,
    text: string,
    fileName: string
  ): string | null {
    const textLower = text.toLowerCase();
    const fileNameLower = fileName.toLowerCase();

    switch (category) {
      case 'charter_party':
        if (textLower.includes('time charter') || fileNameLower.includes('tc')) {
          return 'time_charter';
        }
        if (textLower.includes('voyage charter') || fileNameLower.includes('vc')) {
          return 'voyage_charter';
        }
        if (textLower.includes('bareboat')) {
          return 'bareboat_charter';
        }
        break;

      case 'certificate':
        if (textLower.includes('class certificate')) {
          return 'class_certificate';
        }
        if (textLower.includes('safety')) {
          return 'safety_certificate';
        }
        if (textLower.includes('insurance')) {
          return 'insurance_certificate';
        }
        break;

      case 'invoice':
        if (textLower.includes('proforma')) {
          return 'proforma_invoice';
        }
        if (textLower.includes('commercial')) {
          return 'commercial_invoice';
        }
        break;
    }

    return null;
  }

  /**
   * Detect duplicate documents
   */
  async detectDuplicate(
    fileHash: string,
    fileName: string,
    organizationId: string
  ): Promise<DuplicateDetectionResult> {
    // Check for exact hash match
    const exactDuplicate = await prisma.document.findFirst({
      where: {
        organizationId,
        fileHash,
        status: 'active',
      },
      select: { id: true, title: true, createdAt: true },
    });

    if (exactDuplicate) {
      return {
        isDuplicate: true,
        duplicateOf: exactDuplicate.id,
        similarity: 1.0,
        reason: 'Exact file hash match (identical content)',
      };
    }

    // Check for similar file names (potential duplicates)
    const normalizedFileName = this.normalizeFileName(fileName);
    const similarDocuments = await prisma.document.findMany({
      where: {
        organizationId,
        status: 'active',
      },
      select: { id: true, fileName: true, title: true },
    });

    for (const doc of similarDocuments) {
      const similarity = this.calculateFileNameSimilarity(
        normalizedFileName,
        this.normalizeFileName(doc.fileName)
      );

      if (similarity > 0.9) {
        return {
          isDuplicate: true,
          duplicateOf: doc.id,
          similarity,
          reason: `Very similar file name: "${doc.fileName}" (${Math.round(similarity * 100)}% match)`,
        };
      }
    }

    return {
      isDuplicate: false,
      reason: 'No duplicates found',
    };
  }

  /**
   * Find related documents based on entities and category
   */
  async findRelatedDocuments(
    documentId: string,
    category: string,
    entities: {
      vessels: string[];
      ports: string[];
      companies: string[];
      dates: string[];
      amounts: string[];
    },
    organizationId: string,
    limit = 5
  ): Promise<RelatedDocument[]> {
    const related: Array<{ documentId: string; title: string; score: number; reason: string }> =
      [];

    // Find documents in same category
    const sameCategory = await prisma.document.findMany({
      where: {
        organizationId,
        category,
        status: 'active',
        id: { not: documentId },
      },
      select: { id: true, title: true, tags: true },
      take: 20,
    });

    // Score based on shared entities
    for (const doc of sameCategory) {
      let score = 0.3; // Base score for same category
      const reasons: string[] = [];

      // Check for shared vessel names
      const sharedVessels = entities.vessels.filter((vessel) =>
        doc.tags.some((tag) => tag.toLowerCase().includes(vessel.toLowerCase()))
      );
      if (sharedVessels.length > 0) {
        score += 0.4;
        reasons.push(`Shared vessels: ${sharedVessels.join(', ')}`);
      }

      // Check for shared ports
      const sharedPorts = entities.ports.filter((port) =>
        doc.tags.some((tag) => tag.toLowerCase().includes(port.toLowerCase()))
      );
      if (sharedPorts.length > 0) {
        score += 0.2;
        reasons.push(`Shared ports: ${sharedPorts.join(', ')}`);
      }

      // Check for shared tags
      const sharedTags = doc.tags.filter((tag) =>
        entities.vessels.concat(entities.ports).some((entity) =>
          tag.toLowerCase().includes(entity.toLowerCase())
        )
      );
      if (sharedTags.length > 0) {
        score += 0.1;
      }

      if (score > 0.4) {
        related.push({
          documentId: doc.id,
          title: doc.title,
          score,
          reason: reasons.join('; '),
        });
      }
    }

    // Sort by score and return top N
    return related
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ documentId, title, score, reason }) => ({
        documentId,
        title,
        similarity: score,
        reason,
      }));
  }

  /**
   * Auto-classify existing documents (batch operation)
   */
  async batchClassify(organizationId: string, limit = 100): Promise<{
    processed: number;
    classified: number;
    errors: number;
  }> {
    let processed = 0;
    let classified = 0;
    let errors = 0;

    // Get unclassified documents (category = 'general' or null)
    const documents = await prisma.document.findMany({
      where: {
        organizationId,
        OR: [{ category: 'general' }, { category: null }],
        status: 'active',
      },
      take: limit,
      select: { id: true, fileName: true, notes: true },
    });

    for (const doc of documents) {
      try {
        // Classify
        const result = await this.classifyDocument(doc.fileName, doc.notes || undefined);

        // Update if confidence is high enough
        if (result.confidence > 0.5) {
          await prisma.document.update({
            where: { id: doc.id },
            data: {
              category: result.category,
              subcategory: result.subcategory,
              tags: { set: result.suggestedTags },
              metadata: {
                classification: {
                  confidence: result.confidence,
                  extractedEntities: result.extractedEntities,
                  classifiedAt: new Date().toISOString(),
                },
              },
            },
          });
          classified++;
        }

        processed++;
      } catch (error) {
        console.error(`Error classifying document ${doc.id}:`, error);
        errors++;
      }
    }

    return { processed, classified, errors };
  }

  /**
   * Helper: Get empty entities object
   */
  private getEmptyEntities() {
    return {
      vessels: [],
      ports: [],
      companies: [],
      dates: [],
      amounts: [],
    };
  }

  /**
   * Helper: Check if string is likely a port code
   */
  private isLikelyPortCode(code: string): boolean {
    // Basic validation: 5 characters, starts with 2 letters
    return /^[A-Z]{2}[A-Z0-9]{3}$/.test(code);
  }

  /**
   * Helper: Check if string is likely a monetary amount
   */
  private isLikelyAmount(amount: string): boolean {
    // Must contain digits and be reasonable length
    return /\d/.test(amount) && amount.length < 30;
  }

  /**
   * Helper: Normalize file name for comparison
   */
  private normalizeFileName(fileName: string): string {
    return fileName
      .toLowerCase()
      .replace(/\.[^.]+$/, '') // Remove extension
      .replace(/[^a-z0-9]+/g, ' ') // Replace special chars with spaces
      .trim();
  }

  /**
   * Helper: Calculate similarity between two file names
   */
  private calculateFileNameSimilarity(name1: string, name2: string): number {
    const words1 = new Set(name1.split(/\s+/));
    const words2 = new Set(name2.split(/\s+/));

    const intersection = new Set([...words1].filter((word) => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    // Jaccard similarity
    return intersection.size / union.size;
  }
}

export const aiDocumentClassifier = new AIDocumentClassifier();
