/**
 * DocChain DMS - Document Management System with Blockchain-style Integrity
 *
 * Provides immutable audit trails for all reports and documents
 * Required for RBI compliance and bank audits
 */

// Document Types
export enum DocumentType {
  // Regulatory Reports
  REGULATORY_RBI = 'REGULATORY_RBI',
  REGULATORY_SEBI = 'REGULATORY_SEBI',
  REGULATORY_IRDAI = 'REGULATORY_IRDAI',

  // Compliance Reports
  AML_STR = 'AML_STR',           // Suspicious Transaction Report
  AML_CTR = 'AML_CTR',           // Cash Transaction Report
  KYC_VERIFICATION = 'KYC_VERIFICATION',
  COMPLIANCE_AUDIT = 'COMPLIANCE_AUDIT',

  // Financial Reports
  CREDIT_DECISION = 'CREDIT_DECISION',
  LOAN_AGREEMENT = 'LOAN_AGREEMENT',
  DISBURSEMENT_ADVICE = 'DISBURSEMENT_ADVICE',
  STATEMENT = 'STATEMENT',

  // Tax Reports
  TDS_CERTIFICATE = 'TDS_CERTIFICATE',
  FORM_26AS = 'FORM_26AS',
  GST_INVOICE = 'GST_INVOICE',

  // Operational Reports
  DAILY_OPERATIONS = 'DAILY_OPERATIONS',
  BRANCH_REPORT = 'BRANCH_REPORT',
  EXCEPTION_REPORT = 'EXCEPTION_REPORT',

  // Customer Documents
  CUSTOMER_DOCUMENT = 'CUSTOMER_DOCUMENT',
  IDENTITY_PROOF = 'IDENTITY_PROOF',
  ADDRESS_PROOF = 'ADDRESS_PROOF',
  INCOME_PROOF = 'INCOME_PROOF',

  // Internal Documents
  POLICY_DOCUMENT = 'POLICY_DOCUMENT',
  PROCEDURE_DOCUMENT = 'PROCEDURE_DOCUMENT',
  MEETING_MINUTES = 'MEETING_MINUTES',

  // Audit Documents
  INTERNAL_AUDIT = 'INTERNAL_AUDIT',
  EXTERNAL_AUDIT = 'EXTERNAL_AUDIT',
  PENETRATION_TEST = 'PENETRATION_TEST',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  SUPERSEDED = 'SUPERSEDED',
  REVOKED = 'REVOKED',
}

export enum AccessLevel {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED',
  TOP_SECRET = 'TOP_SECRET',
}

// Chain Block - Immutable record in the document chain
export interface ChainBlock {
  blockId: string;
  previousBlockHash: string;
  timestamp: Date;
  action: ChainAction;
  actorId: string;
  actorRole: string;
  actorIP?: string;
  documentHash: string;
  metadata: Record<string, any>;
  signature: string;        // Digital signature of the block
  blockHash: string;        // SHA-256 hash of the entire block
}

export enum ChainAction {
  CREATED = 'CREATED',
  VIEWED = 'VIEW',
  DOWNLOADED = 'DOWNLOADED',
  PRINTED = 'PRINTED',
  MODIFIED = 'MODIFIED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SIGNED = 'SIGNED',
  SHARED = 'SHARED',
  REVOKED = 'REVOKED',
  ARCHIVED = 'ARCHIVED',
  RESTORED = 'RESTORED',
  VERIFIED = 'VERIFIED',
  EXPORTED = 'EXPORTED',
  SUBMITTED = 'SUBMITTED',    // Submitted to regulator
  ACKNOWLEDGED = 'ACKNOWLEDGED', // Acknowledged by regulator
}

// Document metadata
export interface DocumentMetadata {
  id: string;
  externalId?: string;        // External reference (e.g., RBI submission ID)
  type: DocumentType;
  status: DocumentStatus;
  accessLevel: AccessLevel;

  // Document info
  title: string;
  description?: string;
  version: string;
  mimeType: string;
  fileSize: number;
  fileName: string;

  // Content hashes for integrity
  contentHash: string;        // SHA-256 of content
  checksumMD5: string;        // MD5 for quick verification
  checksumSHA1: string;       // SHA-1 for compatibility

  // Classification
  category: string;
  subcategory?: string;
  tags: string[];

  // Ownership
  ownerId: string;
  ownerName: string;
  department?: string;
  branch?: string;

  // Related entities
  customerId?: string;
  applicationId?: string;
  transactionId?: string;

  // Dates
  createdAt: Date;
  modifiedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
  retentionUntil: Date;       // Minimum retention date

  // Approval workflow
  requiresApproval: boolean;
  approvers?: string[];
  approvedBy?: string;
  approvedAt?: Date;

  // Digital signature
  isSigned: boolean;
  signedBy?: string;
  signedAt?: Date;
  signatureType?: 'DSC' | 'AADHAAR_ESIGN' | 'USB_TOKEN';
  certificateSerial?: string;

  // Chain reference
  genesisBlockHash: string;   // First block in the chain
  latestBlockHash: string;    // Most recent block
  blockCount: number;         // Total blocks in chain

  // Storage
  storageLocation: string;    // Encrypted storage path
  encryptionKeyId: string;    // KMS key used for encryption
  isEncrypted: boolean;
}

// Document with content
export interface Document extends DocumentMetadata {
  content?: Buffer;           // Actual file content (when retrieved)
  chain: ChainBlock[];        // Full chain of custody
}

// Report definition
export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  type: DocumentType;

  // Schedule
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ON_DEMAND';
  scheduleExpression?: string;  // Cron expression

  // Template
  templateId: string;
  templateVersion: string;

  // Parameters
  parameters: ReportParameter[];

  // Output
  outputFormats: ('PDF' | 'XLSX' | 'CSV' | 'JSON' | 'XML')[];
  defaultFormat: 'PDF' | 'XLSX' | 'CSV' | 'JSON' | 'XML';

  // Distribution
  autoDistribute: boolean;
  recipients?: ReportRecipient[];

  // Compliance
  regulatoryReport: boolean;
  submissionDeadline?: string;  // e.g., "T+1" for next day
  regulatorCode?: string;       // RBI, SEBI, etc.

  // Retention
  retentionYears: number;
  archiveAfterDays: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT';
  required: boolean;
  defaultValue?: any;
  options?: { value: string; label: string }[];
  validation?: string;  // Regex pattern
}

export interface ReportRecipient {
  type: 'USER' | 'ROLE' | 'EMAIL' | 'REGULATOR';
  value: string;
  format?: 'PDF' | 'XLSX' | 'CSV' | 'JSON' | 'XML';
}

// Generated report instance
export interface ReportInstance {
  id: string;
  definitionId: string;
  documentId: string;         // Reference to DocChain document

  // Generation info
  generatedAt: Date;
  generatedBy: string;
  parameters: Record<string, any>;

  // Period
  periodStart: Date;
  periodEnd: Date;

  // Status
  status: 'GENERATING' | 'GENERATED' | 'FAILED' | 'SUBMITTED' | 'ACKNOWLEDGED';
  errorMessage?: string;

  // Submission (for regulatory reports)
  submittedAt?: Date;
  submittedTo?: string;
  submissionRef?: string;
  acknowledgedAt?: Date;
  acknowledgementRef?: string;
}

// Verification result
export interface VerificationResult {
  documentId: string;
  isValid: boolean;

  // Content verification
  contentIntact: boolean;
  hashMatch: boolean;

  // Chain verification
  chainIntact: boolean;
  chainLength: number;
  brokenLinks: string[];      // Block IDs with broken links

  // Signature verification
  signatureValid?: boolean;
  certificateValid?: boolean;
  certificateExpired?: boolean;

  // Timestamps
  verifiedAt: Date;
  oldestBlock: Date;
  newestBlock: Date;

  // Issues found
  issues: VerificationIssue[];
}

export interface VerificationIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  blockId?: string;
}

// Search and filter
export interface DocumentSearchCriteria {
  types?: DocumentType[];
  statuses?: DocumentStatus[];
  accessLevels?: AccessLevel[];

  ownerId?: string;
  department?: string;
  branch?: string;

  customerId?: string;
  applicationId?: string;

  dateFrom?: Date;
  dateTo?: Date;

  tags?: string[];
  keyword?: string;

  regulatoryOnly?: boolean;
  pendingApproval?: boolean;
  expiringSoon?: boolean;

  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'modifiedAt' | 'title' | 'type';
  sortOrder?: 'asc' | 'desc';
}

// Retention policy
export interface RetentionPolicy {
  documentType: DocumentType;
  retentionYears: number;
  archiveAfterDays: number;
  deleteAfterArchive: boolean;
  legalHoldExempt: boolean;
  regulatoryRequirement?: string;
}

// Default retention policies (RBI requirements)
export const DEFAULT_RETENTION_POLICIES: RetentionPolicy[] = [
  // Regulatory reports - 8 years
  { documentType: DocumentType.REGULATORY_RBI, retentionYears: 8, archiveAfterDays: 365, deleteAfterArchive: false, legalHoldExempt: false, regulatoryRequirement: 'RBI Master Direction' },
  { documentType: DocumentType.AML_STR, retentionYears: 8, archiveAfterDays: 90, deleteAfterArchive: false, legalHoldExempt: false, regulatoryRequirement: 'PMLA 2002' },
  { documentType: DocumentType.AML_CTR, retentionYears: 8, archiveAfterDays: 90, deleteAfterArchive: false, legalHoldExempt: false, regulatoryRequirement: 'PMLA 2002' },

  // KYC documents - 5 years after relationship ends
  { documentType: DocumentType.KYC_VERIFICATION, retentionYears: 5, archiveAfterDays: 180, deleteAfterArchive: false, legalHoldExempt: false, regulatoryRequirement: 'RBI KYC Master Direction' },
  { documentType: DocumentType.IDENTITY_PROOF, retentionYears: 5, archiveAfterDays: 180, deleteAfterArchive: false, legalHoldExempt: false, regulatoryRequirement: 'RBI KYC Master Direction' },

  // Financial documents - 8 years
  { documentType: DocumentType.CREDIT_DECISION, retentionYears: 8, archiveAfterDays: 365, deleteAfterArchive: false, legalHoldExempt: false, regulatoryRequirement: 'Banking Regulation Act' },
  { documentType: DocumentType.LOAN_AGREEMENT, retentionYears: 8, archiveAfterDays: 365, deleteAfterArchive: false, legalHoldExempt: false, regulatoryRequirement: 'Banking Regulation Act' },

  // Tax documents - 7 years
  { documentType: DocumentType.TDS_CERTIFICATE, retentionYears: 7, archiveAfterDays: 365, deleteAfterArchive: false, legalHoldExempt: false, regulatoryRequirement: 'Income Tax Act' },
  { documentType: DocumentType.FORM_26AS, retentionYears: 7, archiveAfterDays: 365, deleteAfterArchive: false, legalHoldExempt: false, regulatoryRequirement: 'Income Tax Act' },
  { documentType: DocumentType.GST_INVOICE, retentionYears: 7, archiveAfterDays: 365, deleteAfterArchive: false, legalHoldExempt: false, regulatoryRequirement: 'GST Act' },

  // Audit documents - 8 years
  { documentType: DocumentType.INTERNAL_AUDIT, retentionYears: 8, archiveAfterDays: 365, deleteAfterArchive: false, legalHoldExempt: false, regulatoryRequirement: 'Companies Act' },
  { documentType: DocumentType.EXTERNAL_AUDIT, retentionYears: 8, archiveAfterDays: 365, deleteAfterArchive: false, legalHoldExempt: false, regulatoryRequirement: 'Companies Act' },
  { documentType: DocumentType.PENETRATION_TEST, retentionYears: 5, archiveAfterDays: 365, deleteAfterArchive: false, legalHoldExempt: false, regulatoryRequirement: 'RBI Cyber Security Framework' },
];
