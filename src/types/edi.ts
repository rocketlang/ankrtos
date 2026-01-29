// Advanced EDI & Integration types for ankrICD
// X12, EDIFACT, trading partners, EDI transport

import type { UUID, AuditFields, TenantEntity, Attachment } from './common';
import type { EDIDirection } from './documentation';

// ============================================================================
// TRADING PARTNERS
// ============================================================================

export type EDIFormat = 'x12' | 'edifact' | 'xml' | 'json' | 'csv';
export type EDITransport = 'sftp' | 'as2' | 'http' | 'email' | 'manual';
export type TradingPartnerStatus = 'active' | 'inactive' | 'suspended' | 'testing';

export interface TradingPartner extends TenantEntity, AuditFields {
  id: UUID;
  partnerCode: string;
  name: string;
  status: TradingPartnerStatus;

  // EDI config
  ediFormat: EDIFormat;
  transport: EDITransport;

  // X12 qualifiers
  isaQualifier?: string;
  isaId?: string;
  gsId?: string;

  // EDIFACT qualifiers
  unb_sender?: string;
  unb_recipient?: string;

  // Transport config
  sftpHost?: string;
  sftpPort?: number;
  sftpUser?: string;
  sftpPath?: string;
  as2Url?: string;
  as2Id?: string;
  httpEndpoint?: string;
  httpAuthType?: 'basic' | 'bearer' | 'api_key';

  // Supported transactions
  supportedInbound: EDITransactionType[];
  supportedOutbound: EDITransactionType[];

  // Stats
  lastInboundAt?: Date;
  lastOutboundAt?: Date;
  totalTransactions: number;
  errorCount: number;
}

// ============================================================================
// EDI TRANSACTIONS
// ============================================================================

export type EDITransactionType =
  // X12 Inbound
  | 'X12_850'   // Purchase Order
  | 'X12_856'   // ASN (Advance Ship Notice)
  | 'X12_940'   // Warehouse Shipping Order
  // X12 Outbound
  | 'X12_944'   // Warehouse Stock Receipt
  | 'X12_945'   // Warehouse Shipping Advice
  | 'X12_997'   // Functional Acknowledgment
  // EDIFACT Inbound
  | 'COPARN'    // Container pre-announcement
  | 'BAPLIE'    // Bayplan / stowage plan
  | 'IFTMIN'    // Booking confirmation
  | 'CUSCAR'    // Customs cargo report
  // EDIFACT Outbound
  | 'COARRI'    // Container discharge/load confirmation
  | 'CODECO'    // Gate in/out report
  | 'IFTSTA'    // Shipment status
  | 'CUSRES'    // Customs response
  // Generic
  | 'CUSTOM';

// Re-export EDIDirection from documentation (avoid duplicate definition)
export type { EDIDirection } from './documentation';

export type EDITransactionStatus =
  | 'received'
  | 'parsing'
  | 'parsed'
  | 'validating'
  | 'validated'
  | 'processing'
  | 'processed'
  | 'generating'
  | 'generated'
  | 'sending'
  | 'sent'
  | 'acknowledged'
  | 'error'
  | 'rejected';

export interface EDITransaction extends TenantEntity, AuditFields {
  id: UUID;
  transactionNumber: string;
  transactionType: EDITransactionType;
  direction: EDIDirection;
  status: EDITransactionStatus;

  // Partner
  partnerId: UUID;
  partnerCode: string;
  partnerName: string;

  // Content
  rawData: string;
  parsedData?: Record<string, unknown>;
  format: EDIFormat;

  // X12 control numbers
  isaControlNumber?: string;
  gsControlNumber?: string;
  stControlNumber?: string;

  // EDIFACT reference
  unbReference?: string;
  unhReference?: string;

  // Processing
  receivedAt?: Date;
  parsedAt?: Date;
  processedAt?: Date;
  sentAt?: Date;
  acknowledgedAt?: Date;

  // Linked entities
  linkedContainerIds: string[];
  linkedOrderIds: string[];
  linkedShipmentIds: string[];

  // Errors
  errors: EDIError[];
  warnings: string[];

  // Acknowledgment
  ackTransactionId?: UUID;
  ackStatus?: 'accepted' | 'accepted_with_errors' | 'rejected';

  // Documents
  rawFile?: Attachment;
}

export interface EDIError {
  code: string;
  segment?: string;
  element?: string;
  position?: number;
  message: string;
  severity: 'warning' | 'error' | 'fatal';
}

// ============================================================================
// EDI VALIDATION
// ============================================================================

export interface EDIValidationRule extends TenantEntity, AuditFields {
  id: UUID;
  transactionType: EDITransactionType;
  ruleName: string;
  ruleDescription: string;
  segment: string;
  element?: string;
  condition: string; // 'required' | 'format' | 'length' | 'enum' | 'custom'
  expectedValue?: string;
  isActive: boolean;
  severity: 'warning' | 'error';
}

export interface EDIValidationResult {
  isValid: boolean;
  errors: EDIError[];
  warnings: string[];
  segmentCount: number;
  validatedAt: Date;
}

// ============================================================================
// EDI TRANSPORT / QUEUE
// ============================================================================

export type EDIQueueItemStatus = 'pending' | 'in_progress' | 'sent' | 'failed' | 'retrying';

export interface EDIQueueItem extends TenantEntity, AuditFields {
  id: UUID;
  transactionId: UUID;
  partnerId: UUID;
  transport: EDITransport;

  status: EDIQueueItemStatus;
  priority: number; // 1 = highest

  // Retry
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  retryDelaySeconds: number;

  // Result
  sentAt?: Date;
  responseCode?: number;
  responseMessage?: string;
  error?: string;
}

// ============================================================================
// EDI MAPPING
// ============================================================================

export interface EDIFieldMapping extends TenantEntity, AuditFields {
  id: UUID;
  transactionType: EDITransactionType;
  direction: EDIDirection;
  partnerId?: UUID; // null = default mapping

  // Mapping
  ediSegment: string;
  ediElement: string;
  ediSubElement?: string;
  internalField: string;
  internalEntity: string; // 'container', 'shipment', 'order', etc.

  // Transformation
  transformType?: 'direct' | 'lookup' | 'format' | 'calculated';
  transformConfig?: Record<string, unknown>;

  isActive: boolean;
}

// ============================================================================
// STATS
// ============================================================================

export interface EDIStats {
  tenantId: string;

  // Partners
  totalPartners: number;
  activePartners: number;

  // Transactions
  totalTransactions: number;
  inboundTransactions: number;
  outboundTransactions: number;
  transactionsToday: number;

  // Status breakdown
  pendingTransactions: number;
  processedTransactions: number;
  errorTransactions: number;

  // Error rate
  errorRatePercent: number;
  avgProcessingTimeMs: number;

  // Queue
  queuedItems: number;
  failedQueueItems: number;

  // By type
  transactionsByType: Record<string, number>;
}
