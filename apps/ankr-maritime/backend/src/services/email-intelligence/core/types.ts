/**
 * Universal Email Intelligence - Core Types
 * Industry-agnostic type definitions
 *
 * @package @ankr/email-intelligence
 * @author ANKR Labs
 * @version 1.0.0
 */

// ============================================================================
// Entity Types
// ============================================================================

/**
 * Universal entity extracted from email
 */
export interface UniversalEntity {
  type: string;              // "company", "person", "location", "date", "amount", etc.
  value: string | number | Date;
  context: string;           // Surrounding text (30 chars before/after)
  confidence: number;        // 0.0 - 1.0
  metadata?: Record<string, any>;
  startIndex?: number;       // Character position in text
  endIndex?: number;
}

/**
 * Entity extractor configuration
 */
export interface EntityExtractor {
  name: string;
  description?: string;

  // Extraction methods (at least one required)
  pattern?: RegExp;          // Regex pattern
  patterns?: RegExp[];       // Multiple patterns
  ragQuery?: string;         // RAG-powered extraction query

  // Validation and transformation
  validator?: (value: string) => boolean;
  transformer?: (value: string) => any;

  // Scoring
  weight?: number;           // Weight for confidence scoring (default: 1.0)
}

// ============================================================================
// Classification Types
// ============================================================================

/**
 * Email category configuration
 */
export interface CategoryConfig {
  name: string;
  displayName?: string;
  keywords: string[];
  weight: number;            // Weight for scoring (default: 1.0)
  description?: string;
}

/**
 * Urgency levels
 */
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Actionability types
 */
export type ActionableType =
  | 'requires_response'      // Needs reply
  | 'requires_approval'      // Needs decision/approval
  | 'requires_action'        // Needs specific action
  | 'informational';         // FYI only

// ============================================================================
// Bucket Configuration
// ============================================================================

/**
 * Bucket condition for routing emails
 */
export interface BucketCondition {
  field: string;             // "category", "urgency", "entities.company", etc.
  operator: 'equals' | 'contains' | 'matches' | 'gt' | 'lt' | 'in' | 'not_in';
  value: any;
}

/**
 * Email bucket configuration
 */
export interface BucketConfig {
  id: string;
  name: string;
  displayName?: string;
  description?: string;

  // Routing conditions (AND logic)
  conditions: BucketCondition[];

  // Assignment
  assignTo?: string;         // Role or team
  notificationChannels?: ('email' | 'sms' | 'slack' | 'whatsapp' | 'push')[];

  // Escalation
  escalationRules?: {
    afterMinutes: number;
    escalateTo: string;
  };

  // Auto-actions
  autoRespond?: boolean;
  autoCreateTask?: boolean;
  autoCreateLead?: boolean;
}

// ============================================================================
// Custom Parser Types
// ============================================================================

/**
 * Custom parser (RAG-trained or user-defined)
 */
export interface CustomParser {
  name: string;
  description?: string;
  parse: (text: string) => Promise<any> | any;
}

// ============================================================================
// Parser Configuration
// ============================================================================

/**
 * Email parser configuration (industry-specific)
 */
export interface EmailParserConfig {
  // Industry identifier
  industry: string;
  displayName: string;
  version: string;
  description?: string;

  // Entity extractors
  entityExtractors: Record<string, EntityExtractor>;

  // Keywords for quick lookup
  keywords: Record<string, string[]>;

  // Category classifiers
  categories: CategoryConfig[];

  // Bucket rules
  buckets: BucketConfig[];

  // Custom parsers (optional)
  customParsers?: Record<string, CustomParser>;

  // Urgency keywords
  urgencyKeywords?: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };

  // Actionability keywords
  actionabilityKeywords?: {
    requires_response: string[];
    requires_approval: string[];
    requires_action: string[];
    informational: string[];
  };
}

// ============================================================================
// Parse Result Types
// ============================================================================

/**
 * Email parse result
 */
export interface EmailParseResult {
  // Extracted entities
  entities: UniversalEntity[];

  // Classification
  category: string;
  categoryConfidence: number;

  // Urgency
  urgency: UrgencyLevel;
  urgencyScore: number;       // 0-100

  // Actionability
  actionable: ActionableType;
  actionableConfidence: number;

  // Bucket
  bucket: string;
  bucketMatched: boolean;

  // Custom data from custom parsers
  customData?: Record<string, any>;

  // Overall confidence
  confidence: number;         // 0.0 - 1.0

  // Metadata
  processingTime?: number;    // milliseconds
  parserVersion?: string;
}

// ============================================================================
// Industry Plugin Types
// ============================================================================

/**
 * Industry plugin
 */
export interface IndustryPlugin {
  industry: string;
  displayName: string;
  version: string;
  description?: string;
  author?: string;

  // Configuration
  config: EmailParserConfig;

  // Optional lifecycle hooks
  onBeforeParse?: (subject: string, body: string) => Promise<void> | void;
  onAfterParse?: (result: EmailParseResult) => Promise<EmailParseResult> | EmailParseResult;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Email input
 */
export interface EmailInput {
  subject: string;
  body: string;
  from?: string;
  to?: string;
  cc?: string[];
  date?: Date;
  headers?: Record<string, string>;
}

/**
 * Parser statistics
 */
export interface ParserStats {
  totalParsed: number;
  avgProcessingTime: number;
  avgConfidence: number;
  categoryBreakdown: Record<string, number>;
  urgencyBreakdown: Record<UrgencyLevel, number>;
  bucketBreakdown: Record<string, number>;
}
