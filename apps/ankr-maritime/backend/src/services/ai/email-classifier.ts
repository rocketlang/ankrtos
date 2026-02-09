// email-classifier.ts — AI-Powered Email Classification for Maritime Operations

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

// Email categories for maritime operations
export enum EmailCategory {
  FIXTURE = 'fixture',                   // Fixture negotiations, offers, recaps
  OPERATIONS = 'operations',             // Voyage ops, port updates, ETA changes
  CLAIMS = 'claims',                     // Demurrage, cargo claims, disputes
  COMMERCIAL = 'commercial',             // Market intelligence, client relations
  TECHNICAL = 'technical',               // Vessel tech issues, surveys, repairs
  CREWING = 'crewing',                   // Crew changes, certificates, visas
  FINANCE = 'finance',                   // Invoices, payments, bank guarantees
  BUNKER = 'bunker',                     // Bunker enquiries, deliveries, quality
  COMPLIANCE = 'compliance',             // Regulations, certifications, audits
  GENERAL = 'general',                   // General correspondence, greetings
}

// Urgency levels
export enum UrgencyLevel {
  CRITICAL = 'critical',    // Requires immediate action (next 1 hour)
  HIGH = 'high',            // Urgent (within 4 hours)
  MEDIUM = 'medium',        // Normal priority (within 24 hours)
  LOW = 'low',              // Informational, no rush
}

// Actionability
export enum ActionableType {
  REQUIRES_RESPONSE = 'requires_response',     // Needs reply
  REQUIRES_APPROVAL = 'requires_approval',     // Needs decision/approval
  REQUIRES_ACTION = 'requires_action',         // Needs specific action (payment, document, etc.)
  INFORMATIONAL = 'informational',             // FYI only
}

interface ClassificationResult {
  category: EmailCategory;
  confidence: number;                          // 0.0 - 1.0
  urgency: UrgencyLevel;
  urgencyScore: number;                        // 0-100
  actionable: ActionableType;
  dealTerms?: DealTerms;                       // For fixture emails
  extractedEntities: {
    vessels?: string[];
    ports?: string[];
    dates?: string[];
    amounts?: Array<{ value: number; currency: string; context: string }>;
    references?: Array<{ type: string; value: string }>;  // BOL, voyage, charter numbers
  };
  suggestedAction?: string;
  assignToRole?: string;
  reasoning?: string;                          // Explanation of classification
}

interface DealTerms {
  vesselName?: string;
  cargoType?: string;
  quantity?: number;
  quantityUnit?: string;
  loadPort?: string;
  dischargePort?: string;
  freightRate?: number;
  hireRate?: number;
  currency?: string;
  laycanFrom?: Date;
  laycanTo?: Date;
  chartererName?: string;
  ownerName?: string;
}

// Keywords for category classification
const CATEGORY_KEYWORDS: Record<EmailCategory, string[]> = {
  [EmailCategory.FIXTURE]: [
    'fixture', 'offer', 'stem', 'position list', 'tonnage', 'subjects', 'recap',
    'freight rate', 'hire rate', 'ballast', 'open', 'availability', 'fixing',
    'clean fixed', 'main terms', 'laycan', 'cargo', 'shipper', 'receiver',
  ],
  [EmailCategory.OPERATIONS]: [
    'eta', 'etb', 'etd', 'berthing', 'arrival', 'departure', 'noon report',
    'position', 'weather', 'speed', 'consumption', 'rob', 'sof', 'nor',
    'loading commenced', 'discharge completed', 'sailing', 'anchored',
  ],
  [EmailCategory.CLAIMS]: [
    'demurrage', 'despatch', 'claim', 'dispute', 'laytime', 'time sheet',
    'statement of facts', 'time lost', 'off-hire', 'damage', 'shortage',
    'contamination', 'general average', 'liability', 'compensation',
  ],
  [EmailCategory.COMMERCIAL]: [
    'market', 'rates', 'trend', 'baltic', 'clarksons', 'outlook', 'sentiment',
    'business development', 'new client', 'partnership', 'contract', 'agreement',
  ],
  [EmailCategory.TECHNICAL]: [
    'repair', 'breakdown', 'machinery', 'engine', 'survey', 'inspection',
    'class', 'drydock', 'maintenance', 'spare parts', 'technical issue',
    'performance', 'deviation', 'port state control', 'psc',
  ],
  [EmailCategory.CREWING]: [
    'crew', 'master', 'chief engineer', 'manning', 'sign on', 'sign off',
    'coc', 'certificate', 'seaman book', 'visa', 'crew change', 'replacement',
  ],
  [EmailCategory.FINANCE]: [
    'invoice', 'payment', 'bank', 'wire transfer', 'lc', 'letter of credit',
    'bank guarantee', 'financial', 'account', 'usd', 'eur', 'remittance',
  ],
  [EmailCategory.BUNKER]: [
    'bunker', 'fuel', 'ifo', 'mgo', 'lsfo', 'vlsfo', 'bunker call', 'stem',
    'bunker delivery note', 'bdn', 'fuel quality', 'sulphur', 'rob',
  ],
  [EmailCategory.COMPLIANCE]: [
    'imo', 'marpol', 'solas', 'isps', 'ism', 'compliance', 'regulation',
    'certificate', 'audit', 'inspection', 'vetting', 'rightship', 'cii',
  ],
  [EmailCategory.GENERAL]: [],
};

// Urgency keywords
const URGENCY_KEYWORDS = {
  critical: ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'urgent attention required'],
  high: ['important', 'priority', 'please confirm', 'awaiting', 'kindly revert', 'soon as possible'],
  medium: ['please', 'kindly', 'at your earliest convenience', 'when convenient'],
  low: ['fyi', 'for your information', 'for your records', 'note'],
};

// Actionability keywords
const ACTIONABILITY_KEYWORDS = {
  requires_response: [
    'please confirm', 'kindly revert', 'awaiting your response', 'please advise',
    'need confirmation', 'require feedback', 'what is your view', 'do you agree',
  ],
  requires_approval: [
    'please approve', 'for your approval', 'request approval', 'authorization required',
    'please review and approve', 'sign off required', 'need your approval',
  ],
  requires_action: [
    'please arrange', 'kindly provide', 'please send', 'submit', 'prepare',
    'please ensure', 'arrange payment', 'send documents', 'issue invoice',
  ],
};

export class EmailClassifier {
  /**
   * Classify an email using keyword-based ML simulation
   */
  async classifyEmail(
    subject: string,
    body: string,
    fromEmail: string,
    organizationId: string
  ): Promise<ClassificationResult> {
    const combinedText = `${subject} ${body}`.toLowerCase();

    // 1. Determine Category
    const categoryScores = this.calculateCategoryScores(combinedText);
    const topCategory = this.getTopCategory(categoryScores);

    // 2. Determine Urgency
    const urgencyResult = this.calculateUrgency(combinedText, subject);

    // 3. Determine Actionability
    const actionable = this.determineActionability(combinedText);

    // 4. Extract Entities
    const entities = this.extractEntities(combinedText, subject, body);

    // 5. Extract Deal Terms (for fixture emails)
    let dealTerms: DealTerms | undefined;
    if (topCategory.category === EmailCategory.FIXTURE) {
      dealTerms = this.extractDealTerms(subject, body, entities);
    }

    // 6. Suggest Action and Assignment
    const suggestedAction = this.suggestAction(topCategory.category, actionable, urgencyResult.level);
    const assignToRole = this.suggestRole(topCategory.category);

    // 7. Generate Reasoning
    const reasoning = this.generateReasoning(
      topCategory,
      urgencyResult,
      actionable,
      entities
    );

    return {
      category: topCategory.category,
      confidence: topCategory.confidence,
      urgency: urgencyResult.level,
      urgencyScore: urgencyResult.score,
      actionable,
      dealTerms,
      extractedEntities: entities,
      suggestedAction,
      assignToRole,
      reasoning,
    };
  }

  /**
   * Calculate category scores based on keyword matching
   */
  private calculateCategoryScores(text: string): Map<EmailCategory, number> {
    const scores = new Map<EmailCategory, number>();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length * (keyword.split(' ').length); // Multi-word phrases get higher weight
        }
      }
      scores.set(category as EmailCategory, score);
    }

    return scores;
  }

  /**
   * Get top category with confidence score
   */
  private getTopCategory(scores: Map<EmailCategory, number>): {
    category: EmailCategory;
    confidence: number;
  } {
    let maxScore = 0;
    let topCategory = EmailCategory.GENERAL;
    let totalScore = 0;

    for (const [category, score] of scores) {
      totalScore += score;
      if (score > maxScore) {
        maxScore = score;
        topCategory = category;
      }
    }

    // Calculate confidence (normalized score)
    const confidence = totalScore > 0 ? Math.min(maxScore / totalScore, 1.0) : 0.5;

    return { category: topCategory, confidence: Math.round(confidence * 100) / 100 };
  }

  /**
   * Calculate urgency level and score
   */
  private calculateUrgency(text: string, subject: string): {
    level: UrgencyLevel;
    score: number;
  } {
    let score = 30; // Base score (medium)

    // Subject urgency (weighted higher)
    const subjectLower = subject.toLowerCase();
    for (const keyword of URGENCY_KEYWORDS.critical) {
      if (subjectLower.includes(keyword)) score += 30;
    }
    for (const keyword of URGENCY_KEYWORDS.high) {
      if (subjectLower.includes(keyword)) score += 15;
    }

    // Body urgency
    for (const keyword of URGENCY_KEYWORDS.critical) {
      if (text.includes(keyword)) score += 20;
    }
    for (const keyword of URGENCY_KEYWORDS.high) {
      if (text.includes(keyword)) score += 10;
    }
    for (const keyword of URGENCY_KEYWORDS.low) {
      if (text.includes(keyword)) score -= 15;
    }

    // Deadline detection (e.g., "by EOD", "before noon")
    if (/by (eod|cob|end of (day|business))/i.test(text)) score += 25;
    if (/within \d+ hours?/i.test(text)) score += 20;
    if (/today|tonight|this (morning|afternoon|evening)/i.test(text)) score += 15;

    // Cap score
    score = Math.max(0, Math.min(100, score));

    // Determine level
    let level: UrgencyLevel;
    if (score >= 70) level = UrgencyLevel.CRITICAL;
    else if (score >= 50) level = UrgencyLevel.HIGH;
    else if (score >= 25) level = UrgencyLevel.MEDIUM;
    else level = UrgencyLevel.LOW;

    return { level, score };
  }

  /**
   * Determine if email is actionable
   */
  private determineActionability(text: string): ActionableType {
    // Check for approval requests (highest priority)
    for (const keyword of ACTIONABILITY_KEYWORDS.requires_approval) {
      if (text.includes(keyword)) return ActionableType.REQUIRES_APPROVAL;
    }

    // Check for response requests
    for (const keyword of ACTIONABILITY_KEYWORDS.requires_response) {
      if (text.includes(keyword)) return ActionableType.REQUIRES_RESPONSE;
    }

    // Check for action requests
    for (const keyword of ACTIONABILITY_KEYWORDS.requires_action) {
      if (text.includes(keyword)) return ActionableType.REQUIRES_ACTION;
    }

    // Default to informational
    return ActionableType.INFORMATIONAL;
  }

  /**
   * Extract entities (vessels, ports, dates, amounts)
   */
  private extractEntities(text: string, subject: string, body: string): ClassificationResult['extractedEntities'] {
    const entities: ClassificationResult['extractedEntities'] = {};

    // Extract vessel names (IMO pattern or "MV/MT/SS" prefix)
    const vesselPattern = /\b(m\/?(v|t|s)|ss)\s+[\w\s-]+/gi;
    const vesselMatches = text.match(vesselPattern);
    if (vesselMatches) {
      entities.vessels = [...new Set(vesselMatches.map((v) => v.trim().toUpperCase()))];
    }

    // Extract ports (UN/LOCODE pattern or common port names)
    const portPattern = /\b([A-Z]{5})\b/g; // UN/LOCODE format
    const portMatches = text.match(portPattern);
    if (portMatches) {
      entities.ports = [...new Set(portMatches)];
    }

    // Extract dates (various formats)
    const datePattern = /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|(\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4}))/gi;
    const dateMatches = text.match(datePattern);
    if (dateMatches) {
      entities.dates = [...new Set(dateMatches.map((d) => d.trim()))];
    }

    // Extract amounts (USD, EUR, etc.)
    const amountPattern = /\b(usd|eur|gbp|jpy|sgd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/gi;
    const amountMatches = [...body.matchAll(new RegExp(amountPattern, 'gi'))];
    if (amountMatches.length > 0) {
      entities.amounts = amountMatches.map((match) => ({
        currency: match[1].toUpperCase(),
        value: parseFloat(match[2].replace(/,/g, '')),
        context: match.input?.substring(Math.max(0, match.index! - 30), match.index! + 50) || '',
      }));
    }

    // Extract references (BOL, voyage, charter numbers)
    const refPattern = /\b(bol|voyage|charter|fixture|ref)[\s#:]*([A-Z0-9-]+)/gi;
    const refMatches = [...text.matchAll(new RegExp(refPattern, 'gi'))];
    if (refMatches.length > 0) {
      entities.references = refMatches.map((match) => ({
        type: match[1].toLowerCase(),
        value: match[2].toUpperCase(),
      }));
    }

    return entities;
  }

  /**
   * Extract deal terms from fixture emails
   */
  private extractDealTerms(
    subject: string,
    body: string,
    entities: ClassificationResult['extractedEntities']
  ): DealTerms {
    const terms: DealTerms = {};

    // Vessel name
    if (entities.vessels && entities.vessels.length > 0) {
      terms.vesselName = entities.vessels[0];
    }

    // Cargo type
    const cargoPattern = /cargo[:\s]+([\w\s,]+?)(?=\n|quantity|load|$)/i;
    const cargoMatch = body.match(cargoPattern);
    if (cargoMatch) {
      terms.cargoType = cargoMatch[1].trim();
    }

    // Quantity
    const quantityPattern = /(\d{1,3}(?:,\d{3})*)\s*(mt|tons?|cbm|bbls?)/i;
    const quantityMatch = body.match(quantityPattern);
    if (quantityMatch) {
      terms.quantity = parseFloat(quantityMatch[1].replace(/,/g, ''));
      terms.quantityUnit = quantityMatch[2].toLowerCase();
    }

    // Ports
    if (entities.ports && entities.ports.length >= 2) {
      terms.loadPort = entities.ports[0];
      terms.dischargePort = entities.ports[1];
    }

    // Freight/hire rate
    const freightPattern = /freight[:\s]+usd\s*([\d.]+)/i;
    const freightMatch = body.match(freightPattern);
    if (freightMatch) {
      terms.freightRate = parseFloat(freightMatch[1]);
      terms.currency = 'USD';
    }

    const hirePattern = /hire[:\s]+usd\s*([\d,]+)/i;
    const hireMatch = body.match(hirePattern);
    if (hireMatch) {
      terms.hireRate = parseFloat(hireMatch[1].replace(/,/g, ''));
      terms.currency = 'USD';
    }

    // Laycan
    const laycanPattern = /laycan[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\s*[-–]\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
    const laycanMatch = body.match(laycanPattern);
    if (laycanMatch) {
      terms.laycanFrom = new Date(laycanMatch[1]);
      terms.laycanTo = new Date(laycanMatch[2]);
    }

    return terms;
  }

  /**
   * Suggest action based on classification
   */
  private suggestAction(
    category: EmailCategory,
    actionable: ActionableType,
    urgency: UrgencyLevel
  ): string {
    if (actionable === ActionableType.REQUIRES_APPROVAL) {
      return 'Review and approve/reject request';
    }

    if (actionable === ActionableType.REQUIRES_RESPONSE) {
      if (urgency === UrgencyLevel.CRITICAL) {
        return 'Respond immediately (within 1 hour)';
      } else if (urgency === UrgencyLevel.HIGH) {
        return 'Respond within 4 hours';
      } else {
        return 'Respond within 24 hours';
      }
    }

    if (actionable === ActionableType.REQUIRES_ACTION) {
      switch (category) {
        case EmailCategory.FIXTURE:
          return 'Review terms and prepare counter-offer or acceptance';
        case EmailCategory.CLAIMS:
          return 'Review claim and gather supporting documents';
        case EmailCategory.FINANCE:
          return 'Process payment or send invoice';
        case EmailCategory.OPERATIONS:
          return 'Update voyage plan or notify relevant parties';
        default:
          return 'Take necessary action based on email content';
      }
    }

    return 'File for reference';
  }

  /**
   * Suggest role assignment based on category
   */
  private suggestRole(category: EmailCategory): string {
    const roleMap: Record<EmailCategory, string> = {
      [EmailCategory.FIXTURE]: 'commercial_manager',
      [EmailCategory.OPERATIONS]: 'ops_manager',
      [EmailCategory.CLAIMS]: 'commercial_manager',
      [EmailCategory.COMMERCIAL]: 'commercial_manager',
      [EmailCategory.TECHNICAL]: 'technical_manager',
      [EmailCategory.CREWING]: 'crewing_manager',
      [EmailCategory.FINANCE]: 'finance_manager',
      [EmailCategory.BUNKER]: 'ops_manager',
      [EmailCategory.COMPLIANCE]: 'compliance_officer',
      [EmailCategory.GENERAL]: 'user',
    };

    return roleMap[category] || 'user';
  }

  /**
   * Generate reasoning explanation
   */
  private generateReasoning(
    categoryResult: { category: EmailCategory; confidence: number },
    urgencyResult: { level: UrgencyLevel; score: number },
    actionable: ActionableType,
    entities: ClassificationResult['extractedEntities']
  ): string {
    const reasons: string[] = [];

    // Category reasoning
    reasons.push(
      `Classified as ${categoryResult.category} (${(categoryResult.confidence * 100).toFixed(0)}% confidence)`
    );

    // Entity extraction
    if (entities.vessels?.length) {
      reasons.push(`Detected ${entities.vessels.length} vessel(s): ${entities.vessels.join(', ')}`);
    }
    if (entities.ports?.length) {
      reasons.push(`Detected ${entities.ports.length} port(s): ${entities.ports.join(', ')}`);
    }
    if (entities.amounts?.length) {
      reasons.push(`Found ${entities.amounts.length} monetary amount(s)`);
    }

    // Urgency reasoning
    reasons.push(`Urgency: ${urgencyResult.level} (score: ${urgencyResult.score}/100)`);

    // Actionability
    reasons.push(`Actionable: ${actionable}`);

    return reasons.join('. ');
  }

  /**
   * Batch classify emails
   */
  async classifyBatch(
    emails: Array<{ id: string; subject: string; body: string; fromEmail: string }>,
    organizationId: string
  ): Promise<Map<string, ClassificationResult>> {
    const results = new Map<string, ClassificationResult>();

    for (const email of emails) {
      const classification = await this.classifyEmail(
        email.subject,
        email.body,
        email.fromEmail,
        organizationId
      );
      results.set(email.id, classification);
    }

    return results;
  }

  /**
   * Save classification result to database
   */
  async saveClassification(
    emailId: string,
    classification: ClassificationResult,
    organizationId: string
  ): Promise<void> {
    await prisma.emailMessage?.update({
      where: { id: emailId },
      data: {
        category: classification.category,
        urgency: classification.urgency,
        actionable: classification.actionable,
        aiClassification: classification as any,
        assignedToRole: classification.assignToRole,
      },
    });

    // Create alert for critical/high urgency emails
    if (
      classification.urgency === UrgencyLevel.CRITICAL ||
      classification.urgency === UrgencyLevel.HIGH
    ) {
      await prisma.alert?.create({
        data: {
          organizationId,
          type: 'urgent_email',
          severity: classification.urgency === UrgencyLevel.CRITICAL ? 'critical' : 'high',
          title: `Urgent Email: ${classification.category}`,
          message: `${classification.suggestedAction}`,
          metadata: {
            emailId,
            category: classification.category,
            actionable: classification.actionable,
          },
          status: 'active',
        },
      });
    }
  }
}

export const emailClassifier = new EmailClassifier();
