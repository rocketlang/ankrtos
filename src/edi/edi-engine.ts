// Advanced EDI & Integration Engine for ankrICD
// X12, EDIFACT, trading partners, transaction processing, queue management

import { v4 as uuidv4 } from 'uuid';
import type { UUID, OperationResult } from '../types/common';
import type {
  TradingPartner,
  TradingPartnerStatus,
  EDIFormat,
  EDITransport,
  EDITransaction,
  EDITransactionType,
  EDITransactionStatus,
  EDIError,
  EDIValidationRule,
  EDIValidationResult,
  EDIQueueItem,
  EDIQueueItemStatus,
  EDIFieldMapping,
  EDIStats,
} from '../types/edi';
import type { EDIDirection } from '../types/documentation';
import { emit } from '../core';

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface RegisterPartnerInput {
  tenantId: string;
  facilityId: string;
  partnerCode: string;
  name: string;
  ediFormat: EDIFormat;
  transport: EDITransport;
  isaQualifier?: string;
  isaId?: string;
  gsId?: string;
  unb_sender?: string;
  unb_recipient?: string;
  sftpHost?: string;
  sftpPort?: number;
  sftpUser?: string;
  sftpPath?: string;
  as2Url?: string;
  as2Id?: string;
  httpEndpoint?: string;
  httpAuthType?: 'basic' | 'bearer' | 'api_key';
  supportedInbound?: EDITransactionType[];
  supportedOutbound?: EDITransactionType[];
}

export interface CreateTransactionInput {
  tenantId: string;
  facilityId: string;
  transactionType: EDITransactionType;
  direction: EDIDirection;
  partnerId: UUID;
  partnerCode: string;
  partnerName: string;
  rawData: string;
  format: EDIFormat;
  isaControlNumber?: string;
  gsControlNumber?: string;
  stControlNumber?: string;
  unbReference?: string;
  unhReference?: string;
}

export interface ParseInboundInput {
  transactionId: UUID;
  parseAsType: EDITransactionType;
}

export interface GenerateOutboundInput {
  tenantId: string;
  facilityId: string;
  partnerId: UUID;
  transactionType: EDITransactionType;
  data: Record<string, unknown>;
  linkedContainerIds?: string[];
  linkedOrderIds?: string[];
  linkedShipmentIds?: string[];
}

export interface AddValidationRuleInput {
  tenantId: string;
  facilityId: string;
  transactionType: EDITransactionType;
  ruleName: string;
  ruleDescription: string;
  segment: string;
  element?: string;
  condition: string;
  expectedValue?: string;
  severity: 'warning' | 'error';
}

export interface EnqueueInput {
  tenantId: string;
  facilityId: string;
  transactionId: UUID;
  partnerId: UUID;
  transport: EDITransport;
  priority?: number;
  maxAttempts?: number;
  retryDelaySeconds?: number;
}

export interface CreateFieldMappingInput {
  tenantId: string;
  facilityId: string;
  transactionType: EDITransactionType;
  direction: EDIDirection;
  partnerId?: UUID;
  ediSegment: string;
  ediElement: string;
  ediSubElement?: string;
  internalField: string;
  internalEntity: string;
  transformType?: 'direct' | 'lookup' | 'format' | 'calculated';
  transformConfig?: Record<string, unknown>;
}

// ============================================================================
// EDI ENGINE
// ============================================================================

export class EDIEngine {
  private static instance: EDIEngine | null = null;

  // Primary stores
  private partners: Map<UUID, TradingPartner> = new Map();
  private transactions: Map<UUID, EDITransaction> = new Map();
  private validationRules: Map<UUID, EDIValidationRule> = new Map();
  private queueItems: Map<UUID, EDIQueueItem> = new Map();
  private fieldMappings: Map<UUID, EDIFieldMapping> = new Map();

  // Secondary indexes
  private partnerByCode: Map<string, UUID> = new Map(); // tenantId:partnerCode -> id
  private transactionByNumber: Map<string, UUID> = new Map();
  private transactionsByPartner: Map<UUID, UUID[]> = new Map();
  private queueByTransaction: Map<UUID, UUID> = new Map();

  // Counters
  private transactionCounter = 0;
  private isaCounter = 0;
  private gsCounter = 0;
  private stCounter = 0;
  private unbCounter = 0;

  private constructor() {}

  static getInstance(): EDIEngine {
    if (!EDIEngine.instance) {
      EDIEngine.instance = new EDIEngine();
    }
    return EDIEngine.instance;
  }

  static resetInstance(): void {
    EDIEngine.instance = null;
  }

  // ============================================================================
  // 1. TRADING PARTNER MANAGEMENT
  // ============================================================================

  registerPartner(input: RegisterPartnerInput): OperationResult<TradingPartner> {
    const compositeKey = `${input.tenantId}:${input.partnerCode}`;
    if (this.partnerByCode.has(compositeKey)) {
      return { success: false, error: 'Partner code already exists for this tenant', errorCode: 'DUPLICATE_PARTNER_CODE' };
    }

    const now = new Date();
    const partner: TradingPartner = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      partnerCode: input.partnerCode,
      name: input.name,
      status: 'active',

      ediFormat: input.ediFormat,
      transport: input.transport,

      isaQualifier: input.isaQualifier,
      isaId: input.isaId,
      gsId: input.gsId,

      unb_sender: input.unb_sender,
      unb_recipient: input.unb_recipient,

      sftpHost: input.sftpHost,
      sftpPort: input.sftpPort,
      sftpUser: input.sftpUser,
      sftpPath: input.sftpPath,
      as2Url: input.as2Url,
      as2Id: input.as2Id,
      httpEndpoint: input.httpEndpoint,
      httpAuthType: input.httpAuthType,

      supportedInbound: input.supportedInbound ?? [],
      supportedOutbound: input.supportedOutbound ?? [],

      totalTransactions: 0,
      errorCount: 0,

      createdAt: now,
      updatedAt: now,
    };

    this.partners.set(partner.id, partner);
    this.partnerByCode.set(compositeKey, partner.id);
    this.transactionsByPartner.set(partner.id, []);

    emit('edi.partner_registered', {
      partnerId: partner.id,
      partnerCode: partner.partnerCode,
      name: partner.name,
    }, { tenantId: partner.tenantId });

    return { success: true, data: partner };
  }

  getPartner(id: UUID): TradingPartner | undefined {
    return this.partners.get(id);
  }

  getPartnerByCode(tenantId: string, partnerCode: string): TradingPartner | undefined {
    const compositeKey = `${tenantId}:${partnerCode}`;
    const id = this.partnerByCode.get(compositeKey);
    return id ? this.partners.get(id) : undefined;
  }

  listPartners(
    tenantId?: string,
    filters?: { status?: TradingPartnerStatus; ediFormat?: EDIFormat; transport?: EDITransport }
  ): TradingPartner[] {
    let partners = Array.from(this.partners.values());
    if (tenantId) partners = partners.filter(p => p.tenantId === tenantId);
    if (filters?.status) partners = partners.filter(p => p.status === filters.status);
    if (filters?.ediFormat) partners = partners.filter(p => p.ediFormat === filters.ediFormat);
    if (filters?.transport) partners = partners.filter(p => p.transport === filters.transport);
    return partners;
  }

  updatePartnerStatus(partnerId: UUID, status: TradingPartnerStatus, reason?: string): OperationResult<TradingPartner> {
    const partner = this.partners.get(partnerId);
    if (!partner) return { success: false, error: 'Partner not found', errorCode: 'NOT_FOUND' };

    const previousStatus = partner.status;
    partner.status = status;
    partner.updatedAt = new Date();

    emit('edi.partner_status_changed', {
      partnerId: partner.id,
      partnerCode: partner.partnerCode,
      previousStatus,
      newStatus: status,
      reason,
    }, { tenantId: partner.tenantId });

    return { success: true, data: partner };
  }

  updatePartnerConfig(
    partnerId: UUID,
    config: {
      sftpHost?: string;
      sftpPort?: number;
      sftpUser?: string;
      sftpPath?: string;
      as2Url?: string;
      as2Id?: string;
      httpEndpoint?: string;
      httpAuthType?: 'basic' | 'bearer' | 'api_key';
    }
  ): OperationResult<TradingPartner> {
    const partner = this.partners.get(partnerId);
    if (!partner) return { success: false, error: 'Partner not found', errorCode: 'NOT_FOUND' };

    if (config.sftpHost !== undefined) partner.sftpHost = config.sftpHost;
    if (config.sftpPort !== undefined) partner.sftpPort = config.sftpPort;
    if (config.sftpUser !== undefined) partner.sftpUser = config.sftpUser;
    if (config.sftpPath !== undefined) partner.sftpPath = config.sftpPath;
    if (config.as2Url !== undefined) partner.as2Url = config.as2Url;
    if (config.as2Id !== undefined) partner.as2Id = config.as2Id;
    if (config.httpEndpoint !== undefined) partner.httpEndpoint = config.httpEndpoint;
    if (config.httpAuthType !== undefined) partner.httpAuthType = config.httpAuthType;
    partner.updatedAt = new Date();

    return { success: true, data: partner };
  }

  addSupportedTransaction(
    partnerId: UUID,
    direction: EDIDirection,
    transactionType: EDITransactionType
  ): OperationResult<TradingPartner> {
    const partner = this.partners.get(partnerId);
    if (!partner) return { success: false, error: 'Partner not found', errorCode: 'NOT_FOUND' };

    if (direction === 'inbound') {
      if (!partner.supportedInbound.includes(transactionType)) {
        partner.supportedInbound.push(transactionType);
      }
    } else {
      if (!partner.supportedOutbound.includes(transactionType)) {
        partner.supportedOutbound.push(transactionType);
      }
    }
    partner.updatedAt = new Date();

    return { success: true, data: partner };
  }

  // ============================================================================
  // 2. TRANSACTION MANAGEMENT
  // ============================================================================

  createTransaction(input: CreateTransactionInput): OperationResult<EDITransaction> {
    const partner = this.partners.get(input.partnerId);
    if (!partner) return { success: false, error: 'Partner not found', errorCode: 'PARTNER_NOT_FOUND' };

    this.transactionCounter++;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const transactionNumber = `EDI-${dateStr}-${String(this.transactionCounter).padStart(4, '0')}`;

    const initialStatus: EDITransactionStatus = input.direction === 'inbound' ? 'received' : 'generating';

    const transaction: EDITransaction = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      transactionNumber,
      transactionType: input.transactionType,
      direction: input.direction,
      status: initialStatus,

      partnerId: input.partnerId,
      partnerCode: input.partnerCode,
      partnerName: input.partnerName,

      rawData: input.rawData,
      format: input.format,

      isaControlNumber: input.isaControlNumber,
      gsControlNumber: input.gsControlNumber,
      stControlNumber: input.stControlNumber,
      unbReference: input.unbReference,
      unhReference: input.unhReference,

      receivedAt: input.direction === 'inbound' ? now : undefined,

      linkedContainerIds: [],
      linkedOrderIds: [],
      linkedShipmentIds: [],

      errors: [],
      warnings: [],

      createdAt: now,
      updatedAt: now,
    };

    this.transactions.set(transaction.id, transaction);
    this.transactionByNumber.set(transactionNumber, transaction.id);

    // Update partner stats
    partner.totalTransactions++;
    if (input.direction === 'inbound') {
      partner.lastInboundAt = now;
    } else {
      partner.lastOutboundAt = now;
    }
    partner.updatedAt = now;

    // Update partner transaction index
    const partnerTxns = this.transactionsByPartner.get(input.partnerId);
    if (partnerTxns) {
      partnerTxns.push(transaction.id);
    } else {
      this.transactionsByPartner.set(input.partnerId, [transaction.id]);
    }

    const eventType = input.direction === 'inbound' ? 'edi.transaction_received' : 'edi.transaction_generated';
    emit(eventType, {
      transactionId: transaction.id,
      transactionNumber: transaction.transactionNumber,
      transactionType: transaction.transactionType,
      direction: transaction.direction,
      partnerId: transaction.partnerId,
    }, { tenantId: transaction.tenantId });

    return { success: true, data: transaction };
  }

  getTransaction(id: UUID): EDITransaction | undefined {
    return this.transactions.get(id);
  }

  getTransactionByNumber(transactionNumber: string): EDITransaction | undefined {
    const id = this.transactionByNumber.get(transactionNumber);
    return id ? this.transactions.get(id) : undefined;
  }

  listTransactions(
    tenantId?: string,
    filters?: {
      partnerId?: UUID;
      type?: EDITransactionType;
      direction?: EDIDirection;
      status?: EDITransactionStatus;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): EDITransaction[] {
    let txns = Array.from(this.transactions.values());
    if (tenantId) txns = txns.filter(t => t.tenantId === tenantId);
    if (filters?.partnerId) txns = txns.filter(t => t.partnerId === filters.partnerId);
    if (filters?.type) txns = txns.filter(t => t.transactionType === filters.type);
    if (filters?.direction) txns = txns.filter(t => t.direction === filters.direction);
    if (filters?.status) txns = txns.filter(t => t.status === filters.status);
    if (filters?.dateFrom) txns = txns.filter(t => t.createdAt >= filters.dateFrom!);
    if (filters?.dateTo) txns = txns.filter(t => t.createdAt <= filters.dateTo!);
    return txns;
  }

  updateTransactionStatus(
    transactionId: UUID,
    status: EDITransactionStatus,
    _reason?: string
  ): OperationResult<EDITransaction> {
    const txn = this.transactions.get(transactionId);
    if (!txn) return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };

    // Validate status transitions
    const validTransitions: Record<string, EDITransactionStatus[]> = {
      received: ['parsing', 'error', 'rejected'],
      parsing: ['parsed', 'error'],
      parsed: ['validating', 'processing', 'error'],
      validating: ['validated', 'error', 'rejected'],
      validated: ['processing', 'error'],
      processing: ['processed', 'error'],
      processed: ['acknowledged', 'error'],
      generating: ['generated', 'error'],
      generated: ['sending', 'error'],
      sending: ['sent', 'error'],
      sent: ['acknowledged', 'error'],
      acknowledged: [],
      error: ['received', 'parsing', 'generating'],
      rejected: [],
    };

    const allowed = validTransitions[txn.status];
    if (allowed && !allowed.includes(status)) {
      return {
        success: false,
        error: `Cannot transition from ${txn.status} to ${status}`,
        errorCode: 'INVALID_STATUS_TRANSITION',
      };
    }

    const now = new Date();
    txn.status = status;
    txn.updatedAt = now;

    // Record timestamps for specific statuses
    if (status === 'parsed') txn.parsedAt = now;
    if (status === 'processed') txn.processedAt = now;
    if (status === 'sent') txn.sentAt = now;
    if (status === 'acknowledged') txn.acknowledgedAt = now;

    // Emit corresponding events
    if (status === 'parsed') {
      emit('edi.transaction_parsed', {
        transactionId: txn.id,
        transactionNumber: txn.transactionNumber,
      }, { tenantId: txn.tenantId });
    } else if (status === 'processed') {
      emit('edi.transaction_processed', {
        transactionId: txn.id,
        transactionNumber: txn.transactionNumber,
      }, { tenantId: txn.tenantId });
    } else if (status === 'sent') {
      emit('edi.transaction_sent', {
        transactionId: txn.id,
        transactionNumber: txn.transactionNumber,
        partnerId: txn.partnerId,
      }, { tenantId: txn.tenantId });
    } else if (status === 'acknowledged') {
      emit('edi.transaction_acknowledged', {
        transactionId: txn.id,
        transactionNumber: txn.transactionNumber,
      }, { tenantId: txn.tenantId });
    } else if (status === 'error') {
      emit('edi.transaction_error', {
        transactionId: txn.id,
        transactionNumber: txn.transactionNumber,
      }, { tenantId: txn.tenantId });
    }

    return { success: true, data: txn };
  }

  linkEntities(
    transactionId: UUID,
    entities: { containerIds?: string[]; orderIds?: string[]; shipmentIds?: string[] }
  ): OperationResult<EDITransaction> {
    const txn = this.transactions.get(transactionId);
    if (!txn) return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };

    if (entities.containerIds) {
      for (const cid of entities.containerIds) {
        if (!txn.linkedContainerIds.includes(cid)) {
          txn.linkedContainerIds.push(cid);
        }
      }
    }
    if (entities.orderIds) {
      for (const oid of entities.orderIds) {
        if (!txn.linkedOrderIds.includes(oid)) {
          txn.linkedOrderIds.push(oid);
        }
      }
    }
    if (entities.shipmentIds) {
      for (const sid of entities.shipmentIds) {
        if (!txn.linkedShipmentIds.includes(sid)) {
          txn.linkedShipmentIds.push(sid);
        }
      }
    }
    txn.updatedAt = new Date();

    return { success: true, data: txn };
  }

  addTransactionError(
    transactionId: UUID,
    error: EDIError
  ): OperationResult<EDITransaction> {
    const txn = this.transactions.get(transactionId);
    if (!txn) return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };

    txn.errors.push(error);
    txn.updatedAt = new Date();

    // Update partner error count
    const partner = this.partners.get(txn.partnerId);
    if (partner) {
      partner.errorCount++;
      partner.updatedAt = new Date();
    }

    if (error.severity === 'fatal') {
      txn.status = 'error';
      emit('edi.transaction_error', {
        transactionId: txn.id,
        transactionNumber: txn.transactionNumber,
        errorCode: error.code,
        errorMessage: error.message,
      }, { tenantId: txn.tenantId });
    }

    return { success: true, data: txn };
  }

  getTransactionsByPartner(partnerId: UUID): EDITransaction[] {
    const ids = this.transactionsByPartner.get(partnerId);
    if (!ids) return [];
    return ids
      .map(id => this.transactions.get(id))
      .filter((t): t is EDITransaction => t !== undefined);
  }

  acknowledgeTransaction(
    transactionId: UUID,
    ackTransactionId: UUID,
    ackStatus: 'accepted' | 'accepted_with_errors' | 'rejected'
  ): OperationResult<EDITransaction> {
    const txn = this.transactions.get(transactionId);
    if (!txn) return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };

    const ackTxn = this.transactions.get(ackTransactionId);
    if (!ackTxn) return { success: false, error: 'Acknowledgment transaction not found', errorCode: 'ACK_NOT_FOUND' };

    const now = new Date();
    txn.status = 'acknowledged';
    txn.acknowledgedAt = now;
    txn.ackTransactionId = ackTransactionId;
    txn.ackStatus = ackStatus;
    txn.updatedAt = now;

    emit('edi.transaction_acknowledged', {
      transactionId: txn.id,
      transactionNumber: txn.transactionNumber,
      ackTransactionId,
      ackStatus,
    }, { tenantId: txn.tenantId });

    return { success: true, data: txn };
  }

  // ============================================================================
  // 3. INBOUND PROCESSING
  // ============================================================================

  receiveInbound(input: CreateTransactionInput): OperationResult<EDITransaction> {
    const createResult = this.createTransaction({
      ...input,
      direction: 'inbound',
    });
    if (!createResult.success || !createResult.data) return createResult;

    const parseResult = this.parseInbound({
      transactionId: createResult.data.id,
      parseAsType: input.transactionType,
    });

    if (!parseResult.success) {
      return {
        success: true,
        data: createResult.data,
        warnings: [`Transaction created but parsing failed: ${parseResult.error ?? 'unknown error'}`],
      };
    }

    return { success: true, data: parseResult.data ?? createResult.data };
  }

  parseInbound(input: ParseInboundInput): OperationResult<EDITransaction> {
    const txn = this.transactions.get(input.transactionId);
    if (!txn) return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };

    if (txn.direction !== 'inbound') {
      return { success: false, error: 'Cannot parse outbound transaction as inbound', errorCode: 'INVALID_DIRECTION' };
    }

    // Set status to parsing
    txn.status = 'parsing';
    txn.updatedAt = new Date();

    let parsedData: Record<string, unknown>;

    try {
      parsedData = this.parseRawData(txn.rawData, txn.format, input.parseAsType);
    } catch (parseError) {
      txn.status = 'error';
      txn.errors.push({
        code: 'PARSE_ERROR',
        message: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        severity: 'fatal',
      });
      txn.updatedAt = new Date();
      emit('edi.transaction_error', {
        transactionId: txn.id,
        transactionNumber: txn.transactionNumber,
        errorCode: 'PARSE_ERROR',
      }, { tenantId: txn.tenantId });
      return { success: false, error: 'Failed to parse raw data', errorCode: 'PARSE_ERROR' };
    }

    const now = new Date();
    txn.parsedData = parsedData;
    txn.status = 'parsed';
    txn.parsedAt = now;
    txn.updatedAt = now;

    emit('edi.transaction_parsed', {
      transactionId: txn.id,
      transactionNumber: txn.transactionNumber,
      transactionType: input.parseAsType,
      segmentCount: (parsedData['segmentCount'] as number | undefined) ?? 0,
    }, { tenantId: txn.tenantId });

    return { success: true, data: txn };
  }

  validateInbound(transactionId: UUID): OperationResult<EDIValidationResult> {
    const txn = this.transactions.get(transactionId);
    if (!txn) return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };

    if (!txn.parsedData) {
      return { success: false, error: 'Transaction has not been parsed', errorCode: 'NOT_PARSED' };
    }

    txn.status = 'validating';
    txn.updatedAt = new Date();

    const result = this.runValidation(txn.transactionType, txn.parsedData, txn.tenantId);

    const now = new Date();
    if (result.isValid) {
      txn.status = 'validated';
    } else {
      // Add errors to transaction
      for (const error of result.errors) {
        txn.errors.push(error);
      }
      txn.warnings.push(...result.warnings);
      // If any fatal errors, set status to error
      const hasFatal = result.errors.some(e => e.severity === 'fatal');
      txn.status = hasFatal ? 'error' : 'validated';
    }
    txn.updatedAt = now;

    if (!result.isValid) {
      emit('edi.validation_failed', {
        transactionId: txn.id,
        transactionNumber: txn.transactionNumber,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
      }, { tenantId: txn.tenantId });
    }

    return { success: true, data: result };
  }

  processInbound(transactionId: UUID): OperationResult<EDITransaction> {
    const txn = this.transactions.get(transactionId);
    if (!txn) return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };

    if (txn.direction !== 'inbound') {
      return { success: false, error: 'Cannot process outbound as inbound', errorCode: 'INVALID_DIRECTION' };
    }

    if (txn.status !== 'parsed' && txn.status !== 'validated') {
      return { success: false, error: 'Transaction must be parsed or validated before processing', errorCode: 'INVALID_STATUS' };
    }

    txn.status = 'processing';
    txn.updatedAt = new Date();

    const now = new Date();
    txn.status = 'processed';
    txn.processedAt = now;
    txn.updatedAt = now;

    emit('edi.transaction_processed', {
      transactionId: txn.id,
      transactionNumber: txn.transactionNumber,
      transactionType: txn.transactionType,
    }, { tenantId: txn.tenantId });

    return { success: true, data: txn };
  }

  getUnprocessedInbound(tenantId: string): EDITransaction[] {
    return Array.from(this.transactions.values()).filter(
      t =>
        t.tenantId === tenantId &&
        t.direction === 'inbound' &&
        (t.status === 'received' || t.status === 'parsed')
    );
  }

  // ============================================================================
  // 4. OUTBOUND GENERATION
  // ============================================================================

  generateOutbound(input: GenerateOutboundInput): OperationResult<EDITransaction> {
    const partner = this.partners.get(input.partnerId);
    if (!partner) return { success: false, error: 'Partner not found', errorCode: 'PARTNER_NOT_FOUND' };

    if (partner.status !== 'active' && partner.status !== 'testing') {
      return { success: false, error: 'Partner is not active or in testing', errorCode: 'PARTNER_NOT_ACTIVE' };
    }

    let rawData: string;
    let isaControlNumber: string | undefined;
    let gsControlNumber: string | undefined;
    let stControlNumber: string | undefined;
    let unbReference: string | undefined;
    let unhReference: string | undefined;

    try {
      const generated = this.generateRawData(
        partner,
        input.transactionType,
        input.data
      );
      rawData = generated.rawData;
      isaControlNumber = generated.isaControlNumber;
      gsControlNumber = generated.gsControlNumber;
      stControlNumber = generated.stControlNumber;
      unbReference = generated.unbReference;
      unhReference = generated.unhReference;
    } catch (genError) {
      return {
        success: false,
        error: genError instanceof Error ? genError.message : 'Failed to generate raw data',
        errorCode: 'GENERATION_ERROR',
      };
    }

    const createResult = this.createTransaction({
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      transactionType: input.transactionType,
      direction: 'outbound',
      partnerId: input.partnerId,
      partnerCode: partner.partnerCode,
      partnerName: partner.name,
      rawData,
      format: partner.ediFormat,
      isaControlNumber,
      gsControlNumber,
      stControlNumber,
      unbReference,
      unhReference,
    });

    if (!createResult.success || !createResult.data) return createResult;

    const txn = createResult.data;

    // Link entities
    if (input.linkedContainerIds) txn.linkedContainerIds = input.linkedContainerIds;
    if (input.linkedOrderIds) txn.linkedOrderIds = input.linkedOrderIds;
    if (input.linkedShipmentIds) txn.linkedShipmentIds = input.linkedShipmentIds;

    // Set parsed data from input data
    txn.parsedData = input.data;
    txn.status = 'generated';
    txn.updatedAt = new Date();

    emit('edi.transaction_generated', {
      transactionId: txn.id,
      transactionNumber: txn.transactionNumber,
      transactionType: txn.transactionType,
      partnerId: txn.partnerId,
    }, { tenantId: txn.tenantId });

    return { success: true, data: txn };
  }

  sendOutbound(transactionId: UUID): OperationResult<EDITransaction> {
    const txn = this.transactions.get(transactionId);
    if (!txn) return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };

    if (txn.direction !== 'outbound') {
      return { success: false, error: 'Cannot send inbound transaction', errorCode: 'INVALID_DIRECTION' };
    }

    if (txn.status !== 'generated') {
      return { success: false, error: 'Transaction must be in generated status to send', errorCode: 'INVALID_STATUS' };
    }

    txn.status = 'sending';
    txn.updatedAt = new Date();

    const now = new Date();
    txn.status = 'sent';
    txn.sentAt = now;
    txn.updatedAt = now;

    emit('edi.transaction_sent', {
      transactionId: txn.id,
      transactionNumber: txn.transactionNumber,
      partnerId: txn.partnerId,
      partnerCode: txn.partnerCode,
    }, { tenantId: txn.tenantId });

    return { success: true, data: txn };
  }

  generateAcknowledgment(inboundTransactionId: UUID): OperationResult<EDITransaction> {
    const inboundTxn = this.transactions.get(inboundTransactionId);
    if (!inboundTxn) return { success: false, error: 'Inbound transaction not found', errorCode: 'NOT_FOUND' };

    if (inboundTxn.direction !== 'inbound') {
      return { success: false, error: 'Can only acknowledge inbound transactions', errorCode: 'INVALID_DIRECTION' };
    }

    const partner = this.partners.get(inboundTxn.partnerId);
    if (!partner) return { success: false, error: 'Partner not found', errorCode: 'PARTNER_NOT_FOUND' };

    // Determine ack type based on format
    const ackType: EDITransactionType = inboundTxn.format === 'x12' ? 'X12_997' : 'CUSRES';

    const ackData: Record<string, unknown> = {
      originalTransactionId: inboundTxn.id,
      originalTransactionNumber: inboundTxn.transactionNumber,
      originalTransactionType: inboundTxn.transactionType,
      ackStatus: inboundTxn.errors.length > 0 ? 'accepted_with_errors' : 'accepted',
      errorCount: inboundTxn.errors.length,
      acknowledgedAt: new Date().toISOString(),
    };

    const generateResult = this.generateOutbound({
      tenantId: inboundTxn.tenantId,
      facilityId: inboundTxn.facilityId,
      partnerId: inboundTxn.partnerId,
      transactionType: ackType,
      data: ackData,
    });

    if (!generateResult.success || !generateResult.data) return generateResult;

    const ackTxn = generateResult.data;

    // Link the acknowledgment
    const ackStatus: 'accepted' | 'accepted_with_errors' | 'rejected' =
      inboundTxn.errors.length > 0 ? 'accepted_with_errors' : 'accepted';

    inboundTxn.ackTransactionId = ackTxn.id;
    inboundTxn.ackStatus = ackStatus;
    inboundTxn.status = 'acknowledged';
    inboundTxn.acknowledgedAt = new Date();
    inboundTxn.updatedAt = new Date();

    emit('edi.transaction_acknowledged', {
      transactionId: inboundTxn.id,
      transactionNumber: inboundTxn.transactionNumber,
      ackTransactionId: ackTxn.id,
      ackStatus,
    }, { tenantId: inboundTxn.tenantId });

    return { success: true, data: ackTxn };
  }

  getPendingOutbound(tenantId: string): EDITransaction[] {
    return Array.from(this.transactions.values()).filter(
      t =>
        t.tenantId === tenantId &&
        t.direction === 'outbound' &&
        t.status === 'generated'
    );
  }

  // ============================================================================
  // 5. VALIDATION RULES
  // ============================================================================

  addValidationRule(input: AddValidationRuleInput): OperationResult<EDIValidationRule> {
    // Check unique ruleName per transactionType within tenant
    const duplicate = Array.from(this.validationRules.values()).find(
      r =>
        r.tenantId === input.tenantId &&
        r.transactionType === input.transactionType &&
        r.ruleName === input.ruleName
    );
    if (duplicate) {
      return { success: false, error: 'Validation rule name already exists for this transaction type', errorCode: 'DUPLICATE_RULE_NAME' };
    }

    const now = new Date();
    const rule: EDIValidationRule = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      transactionType: input.transactionType,
      ruleName: input.ruleName,
      ruleDescription: input.ruleDescription,
      segment: input.segment,
      element: input.element,
      condition: input.condition,
      expectedValue: input.expectedValue,
      isActive: true,
      severity: input.severity,
      createdAt: now,
      updatedAt: now,
    };

    this.validationRules.set(rule.id, rule);

    return { success: true, data: rule };
  }

  getValidationRule(id: UUID): EDIValidationRule | undefined {
    return this.validationRules.get(id);
  }

  listValidationRules(
    tenantId?: string,
    filters?: { transactionType?: EDITransactionType; isActive?: boolean }
  ): EDIValidationRule[] {
    let rules = Array.from(this.validationRules.values());
    if (tenantId) rules = rules.filter(r => r.tenantId === tenantId);
    if (filters?.transactionType) rules = rules.filter(r => r.transactionType === filters.transactionType);
    if (filters?.isActive !== undefined) rules = rules.filter(r => r.isActive === filters.isActive);
    return rules;
  }

  toggleValidationRule(ruleId: UUID): OperationResult<EDIValidationRule> {
    const rule = this.validationRules.get(ruleId);
    if (!rule) return { success: false, error: 'Validation rule not found', errorCode: 'NOT_FOUND' };

    rule.isActive = !rule.isActive;
    rule.updatedAt = new Date();

    return { success: true, data: rule };
  }

  validateTransaction(transactionId: UUID): OperationResult<EDIValidationResult> {
    const txn = this.transactions.get(transactionId);
    if (!txn) return { success: false, error: 'Transaction not found', errorCode: 'NOT_FOUND' };

    if (!txn.parsedData) {
      return { success: false, error: 'Transaction has not been parsed', errorCode: 'NOT_PARSED' };
    }

    const result = this.runValidation(txn.transactionType, txn.parsedData, txn.tenantId);

    // Apply results to transaction
    if (!result.isValid) {
      for (const err of result.errors) {
        txn.errors.push(err);
      }
      txn.warnings.push(...result.warnings);
      txn.updatedAt = new Date();

      emit('edi.validation_failed', {
        transactionId: txn.id,
        transactionNumber: txn.transactionNumber,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
      }, { tenantId: txn.tenantId });
    }

    return { success: true, data: result };
  }

  // ============================================================================
  // 6. QUEUE MANAGEMENT
  // ============================================================================

  enqueue(input: EnqueueInput): OperationResult<EDIQueueItem> {
    const txn = this.transactions.get(input.transactionId);
    if (!txn) return { success: false, error: 'Transaction not found', errorCode: 'TRANSACTION_NOT_FOUND' };

    const partner = this.partners.get(input.partnerId);
    if (!partner) return { success: false, error: 'Partner not found', errorCode: 'PARTNER_NOT_FOUND' };

    // Check if already queued
    if (this.queueByTransaction.has(input.transactionId)) {
      return { success: false, error: 'Transaction already in queue', errorCode: 'ALREADY_QUEUED' };
    }

    const now = new Date();
    const queueItem: EDIQueueItem = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      transactionId: input.transactionId,
      partnerId: input.partnerId,
      transport: input.transport,

      status: 'pending',
      priority: input.priority ?? 5,

      attempts: 0,
      maxAttempts: input.maxAttempts ?? 3,
      retryDelaySeconds: input.retryDelaySeconds ?? 60,

      createdAt: now,
      updatedAt: now,
    };

    this.queueItems.set(queueItem.id, queueItem);
    this.queueByTransaction.set(input.transactionId, queueItem.id);

    return { success: true, data: queueItem };
  }

  getQueueItem(id: UUID): EDIQueueItem | undefined {
    return this.queueItems.get(id);
  }

  listQueue(
    tenantId?: string,
    filters?: { status?: EDIQueueItemStatus; partnerId?: UUID }
  ): EDIQueueItem[] {
    let items = Array.from(this.queueItems.values());
    if (tenantId) items = items.filter(q => q.tenantId === tenantId);
    if (filters?.status) items = items.filter(q => q.status === filters.status);
    if (filters?.partnerId) items = items.filter(q => q.partnerId === filters.partnerId);
    // Sort by priority (lower number = higher priority), then by creation time
    items.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    return items;
  }

  processQueue(tenantId: string): OperationResult<EDIQueueItem> {
    // Find the next pending item by priority
    const pending = Array.from(this.queueItems.values())
      .filter(q => q.tenantId === tenantId && q.status === 'pending')
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    if (pending.length === 0) {
      return { success: false, error: 'No pending items in queue', errorCode: 'QUEUE_EMPTY' };
    }

    const item = pending[0]!;
    const now = new Date();

    item.status = 'in_progress';
    item.attempts++;
    item.lastAttemptAt = now;
    item.updatedAt = now;

    // Simulate send attempt — in a real system this would call transport layer
    const sendSuccess = this.attemptSend(item);

    if (sendSuccess) {
      item.status = 'sent';
      item.sentAt = now;
      item.responseCode = 200;
      item.responseMessage = 'Sent successfully';
      item.updatedAt = new Date();

      // Update the linked transaction
      const txn = this.transactions.get(item.transactionId);
      if (txn && txn.status === 'generated') {
        txn.status = 'sent';
        txn.sentAt = new Date();
        txn.updatedAt = new Date();

        emit('edi.transaction_sent', {
          transactionId: txn.id,
          transactionNumber: txn.transactionNumber,
          partnerId: txn.partnerId,
        }, { tenantId: txn.tenantId });
      }

      return { success: true, data: item };
    }

    // Handle failure
    item.error = 'Send attempt failed';
    item.updatedAt = new Date();

    if (item.attempts >= item.maxAttempts) {
      item.status = 'failed';
      emit('edi.queue_failed', {
        queueItemId: item.id,
        transactionId: item.transactionId,
        partnerId: item.partnerId,
        attempts: item.attempts,
      }, { tenantId: item.tenantId });
    } else {
      item.status = 'retrying';
      item.nextRetryAt = new Date(now.getTime() + item.retryDelaySeconds * 1000);
      emit('edi.queue_retry', {
        queueItemId: item.id,
        transactionId: item.transactionId,
        attempt: item.attempts,
        maxAttempts: item.maxAttempts,
        nextRetryAt: item.nextRetryAt,
      }, { tenantId: item.tenantId });
    }

    return { success: true, data: item };
  }

  retryFailed(queueItemId: UUID): OperationResult<EDIQueueItem> {
    const item = this.queueItems.get(queueItemId);
    if (!item) return { success: false, error: 'Queue item not found', errorCode: 'NOT_FOUND' };

    if (item.status !== 'failed') {
      return { success: false, error: 'Can only retry failed items', errorCode: 'INVALID_STATUS' };
    }

    item.status = 'pending';
    item.attempts = 0;
    item.error = undefined;
    item.nextRetryAt = undefined;
    item.updatedAt = new Date();

    return { success: true, data: item };
  }

  getQueueStats(tenantId: string): {
    pending: number;
    in_progress: number;
    sent: number;
    failed: number;
    retrying: number;
  } {
    const items = Array.from(this.queueItems.values()).filter(q => q.tenantId === tenantId);
    return {
      pending: items.filter(q => q.status === 'pending').length,
      in_progress: items.filter(q => q.status === 'in_progress').length,
      sent: items.filter(q => q.status === 'sent').length,
      failed: items.filter(q => q.status === 'failed').length,
      retrying: items.filter(q => q.status === 'retrying').length,
    };
  }

  // ============================================================================
  // 7. FIELD MAPPINGS
  // ============================================================================

  createFieldMapping(input: CreateFieldMappingInput): OperationResult<EDIFieldMapping> {
    const now = new Date();
    const mapping: EDIFieldMapping = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      transactionType: input.transactionType,
      direction: input.direction,
      partnerId: input.partnerId,

      ediSegment: input.ediSegment,
      ediElement: input.ediElement,
      ediSubElement: input.ediSubElement,
      internalField: input.internalField,
      internalEntity: input.internalEntity,

      transformType: input.transformType,
      transformConfig: input.transformConfig,

      isActive: true,

      createdAt: now,
      updatedAt: now,
    };

    this.fieldMappings.set(mapping.id, mapping);

    return { success: true, data: mapping };
  }

  getFieldMapping(id: UUID): EDIFieldMapping | undefined {
    return this.fieldMappings.get(id);
  }

  listFieldMappings(
    tenantId?: string,
    filters?: { transactionType?: EDITransactionType; direction?: EDIDirection; partnerId?: UUID }
  ): EDIFieldMapping[] {
    let mappings = Array.from(this.fieldMappings.values());
    if (tenantId) mappings = mappings.filter(m => m.tenantId === tenantId);
    if (filters?.transactionType) mappings = mappings.filter(m => m.transactionType === filters.transactionType);
    if (filters?.direction) mappings = mappings.filter(m => m.direction === filters.direction);
    if (filters?.partnerId !== undefined) mappings = mappings.filter(m => m.partnerId === filters.partnerId);
    return mappings;
  }

  toggleFieldMapping(mappingId: UUID): OperationResult<EDIFieldMapping> {
    const mapping = this.fieldMappings.get(mappingId);
    if (!mapping) return { success: false, error: 'Field mapping not found', errorCode: 'NOT_FOUND' };

    mapping.isActive = !mapping.isActive;
    mapping.updatedAt = new Date();

    return { success: true, data: mapping };
  }

  // ============================================================================
  // 8. STATS
  // ============================================================================

  getEDIStats(tenantId: string): EDIStats {
    const partners = Array.from(this.partners.values()).filter(p => p.tenantId === tenantId);
    const transactions = Array.from(this.transactions.values()).filter(t => t.tenantId === tenantId);
    const queueItems = Array.from(this.queueItems.values()).filter(q => q.tenantId === tenantId);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTransactions = transactions.filter(t => t.createdAt >= todayStart);

    const inbound = transactions.filter(t => t.direction === 'inbound');
    const outbound = transactions.filter(t => t.direction === 'outbound');

    const errorTransactions = transactions.filter(t => t.status === 'error' || t.status === 'rejected');
    const processedTransactions = transactions.filter(
      t => t.status === 'processed' || t.status === 'acknowledged' || t.status === 'sent'
    );
    const pendingTransactions = transactions.filter(
      t =>
        t.status === 'received' ||
        t.status === 'parsing' ||
        t.status === 'parsed' ||
        t.status === 'validating' ||
        t.status === 'validated' ||
        t.status === 'processing' ||
        t.status === 'generating' ||
        t.status === 'generated' ||
        t.status === 'sending'
    );

    const errorRate = transactions.length > 0
      ? (errorTransactions.length / transactions.length) * 100
      : 0;

    // Calculate average processing time for processed transactions
    const processedWithTimes = transactions.filter(t => t.processedAt && t.receivedAt);
    const avgProcessingTimeMs = processedWithTimes.length > 0
      ? processedWithTimes.reduce((sum, t) => {
          const received = t.receivedAt!.getTime();
          const processed = t.processedAt!.getTime();
          return sum + (processed - received);
        }, 0) / processedWithTimes.length
      : 0;

    // Transactions by type
    const transactionsByType: Record<string, number> = {};
    for (const txn of transactions) {
      const typeKey = txn.transactionType;
      transactionsByType[typeKey] = (transactionsByType[typeKey] ?? 0) + 1;
    }

    return {
      tenantId,

      totalPartners: partners.length,
      activePartners: partners.filter(p => p.status === 'active').length,

      totalTransactions: transactions.length,
      inboundTransactions: inbound.length,
      outboundTransactions: outbound.length,
      transactionsToday: todayTransactions.length,

      pendingTransactions: pendingTransactions.length,
      processedTransactions: processedTransactions.length,
      errorTransactions: errorTransactions.length,

      errorRatePercent: errorRate,
      avgProcessingTimeMs,

      queuedItems: queueItems.filter(q => q.status === 'pending' || q.status === 'in_progress' || q.status === 'retrying').length,
      failedQueueItems: queueItems.filter(q => q.status === 'failed').length,

      transactionsByType,
    };
  }

  // ============================================================================
  // INTERNAL: PARSING
  // ============================================================================

  private parseRawData(
    rawData: string,
    format: EDIFormat,
    _parseAsType: EDITransactionType
  ): Record<string, unknown> {
    switch (format) {
      case 'x12':
        return this.parseX12(rawData);
      case 'edifact':
        return this.parseEDIFACT(rawData);
      case 'json':
        return this.parseJSON(rawData);
      case 'xml':
        return this.parseXML(rawData);
      case 'csv':
        return this.parseCSV(rawData);
      default: {
        // Exhaustive check: if format is never, this line will not compile
        const _exhaustive: never = format;
        throw new Error(`Unsupported format: ${String(_exhaustive)}`);
      }
    }
  }

  private parseX12(rawData: string): Record<string, unknown> {
    const segments = rawData.split('~').map(s => s.trim()).filter(s => s.length > 0);
    const parsed: Record<string, unknown> = {
      segments: [] as Record<string, unknown>[],
      segmentCount: segments.length,
    };

    const parsedSegments: Record<string, unknown>[] = [];

    for (const segment of segments) {
      const elements = segment.split('*');
      const segmentId = elements[0] ?? '';

      const segmentData: Record<string, unknown> = {
        id: segmentId,
        elements: elements.slice(1),
      };

      if (segmentId === 'ISA' && elements.length >= 14) {
        parsed['isaQualifier'] = elements[1];
        parsed['isaId'] = elements[2];
        parsed['isaReceiverQualifier'] = elements[5];
        parsed['isaReceiverId'] = elements[6];
        parsed['isaDate'] = elements[9];
        parsed['isaTime'] = elements[10];
        parsed['isaControlNumber'] = elements[13];
      }

      if (segmentId === 'GS' && elements.length >= 7) {
        parsed['gsFunctionalCode'] = elements[1];
        parsed['gsSenderId'] = elements[2];
        parsed['gsReceiverId'] = elements[3];
        parsed['gsDate'] = elements[4];
        parsed['gsTime'] = elements[5];
        parsed['gsControlNumber'] = elements[6];
        if (elements.length >= 9) {
          parsed['gsVersionCode'] = elements[8];
        }
      }

      if (segmentId === 'ST' && elements.length >= 3) {
        parsed['stTransactionSetCode'] = elements[1];
        parsed['stControlNumber'] = elements[2];
      }

      if (segmentId === 'SE' && elements.length >= 3) {
        parsed['seSegmentCount'] = elements[1];
        parsed['seControlNumber'] = elements[2];
      }

      if (segmentId === 'GE' && elements.length >= 3) {
        parsed['geTransactionCount'] = elements[1];
        parsed['geControlNumber'] = elements[2];
      }

      if (segmentId === 'IEA' && elements.length >= 3) {
        parsed['ieaGroupCount'] = elements[1];
        parsed['ieaControlNumber'] = elements[2];
      }

      parsedSegments.push(segmentData);
    }

    parsed['segments'] = parsedSegments;
    return parsed;
  }

  private parseEDIFACT(rawData: string): Record<string, unknown> {
    const segments = rawData.split("'").map(s => s.trim()).filter(s => s.length > 0);
    const parsed: Record<string, unknown> = {
      segments: [] as Record<string, unknown>[],
      segmentCount: segments.length,
    };

    const parsedSegments: Record<string, unknown>[] = [];

    for (const segment of segments) {
      const elements = segment.split('+');
      const segmentTag = elements[0] ?? '';

      const segmentData: Record<string, unknown> = {
        tag: segmentTag,
        elements: elements.slice(1),
      };

      if (segmentTag === 'UNB' && elements.length >= 5) {
        parsed['unbSender'] = elements[1];
        parsed['unbRecipient'] = elements[2];
        const dateTimeParts = (elements[3] ?? '').split(':');
        parsed['unbDate'] = dateTimeParts[0];
        parsed['unbTime'] = dateTimeParts[1];
        parsed['unbReference'] = elements[4];
      }

      if (segmentTag === 'UNH' && elements.length >= 3) {
        parsed['unhReference'] = elements[1];
        const typeParts = (elements[2] ?? '').split(':');
        parsed['unhMessageType'] = typeParts[0];
        parsed['unhMessageVersion'] = typeParts[1];
      }

      if (segmentTag === 'UNT' && elements.length >= 3) {
        parsed['untSegmentCount'] = elements[1];
        parsed['untReference'] = elements[2];
      }

      if (segmentTag === 'UNZ' && elements.length >= 3) {
        parsed['unzMessageCount'] = elements[1];
        parsed['unzReference'] = elements[2];
      }

      parsedSegments.push(segmentData);
    }

    parsed['segments'] = parsedSegments;
    return parsed;
  }

  private parseJSON(rawData: string): Record<string, unknown> {
    const data = JSON.parse(rawData) as Record<string, unknown>;
    return {
      ...data,
      segmentCount: Object.keys(data).length,
    };
  }

  private parseXML(rawData: string): Record<string, unknown> {
    // Basic XML parser: extract tags and content
    const tagRegex = /<(\w+)[^>]*>(.*?)<\/\1>/gs;
    const parsed: Record<string, unknown> = {};
    let segmentCount = 0;

    let match = tagRegex.exec(rawData);
    while (match) {
      const tagName = match[1]!;
      const tagContent = match[2]!;
      parsed[tagName] = tagContent;
      segmentCount++;
      match = tagRegex.exec(rawData);
    }

    parsed['segmentCount'] = segmentCount;
    parsed['rawXml'] = rawData;
    return parsed;
  }

  private parseCSV(rawData: string): Record<string, unknown> {
    const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      return { headers: [], rows: [], segmentCount: 0 };
    }

    const headerLine = lines[0]!;
    const headers = headerLine.split(',').map(h => h.trim());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]!;
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j]!;
        row[header] = values[j] ?? '';
      }
      rows.push(row);
    }

    return {
      headers,
      rows,
      segmentCount: lines.length,
    };
  }

  // ============================================================================
  // INTERNAL: GENERATION
  // ============================================================================

  private generateRawData(
    partner: TradingPartner,
    transactionType: EDITransactionType,
    data: Record<string, unknown>
  ): {
    rawData: string;
    isaControlNumber?: string;
    gsControlNumber?: string;
    stControlNumber?: string;
    unbReference?: string;
    unhReference?: string;
  } {
    switch (partner.ediFormat) {
      case 'x12':
        return this.generateX12(partner, transactionType, data);
      case 'edifact':
        return this.generateEDIFACT(partner, transactionType, data);
      case 'json':
        return this.generateJSON(data);
      case 'xml':
        return this.generateXML(transactionType, data);
      case 'csv':
        return this.generateCSV(data);
      default: {
        const _exhaustive: never = partner.ediFormat;
        throw new Error(`Unsupported format: ${String(_exhaustive)}`);
      }
    }
  }

  private generateX12(
    partner: TradingPartner,
    transactionType: EDITransactionType,
    data: Record<string, unknown>
  ): {
    rawData: string;
    isaControlNumber: string;
    gsControlNumber: string;
    stControlNumber: string;
  } {
    this.isaCounter++;
    this.gsCounter++;
    this.stCounter++;

    const isaControlNumber = String(this.isaCounter).padStart(9, '0');
    const gsControlNumber = String(this.gsCounter).padStart(9, '0');
    const stControlNumber = String(this.stCounter).padStart(4, '0');

    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const timeStr = now.toISOString().slice(11, 16).replace(/:/g, ''); // HHMM

    const isaQualifier = partner.isaQualifier ?? 'ZZ';
    const isaId = (partner.isaId ?? 'SENDER').padEnd(15, ' ');
    const receiverQualifier = 'ZZ';
    const receiverId = (partner.partnerCode).padEnd(15, ' ');

    // Extract X12 transaction set code from type (e.g. X12_850 -> 850)
    const txnSetCode = transactionType.startsWith('X12_')
      ? transactionType.slice(4)
      : '999';

    // Determine functional identifier code
    const functionalCode = this.getX12FunctionalCode(transactionType);

    const gsVersionCode = '005010';

    // Build data segments from the data object
    const dataSegments = this.buildX12DataSegments(data);

    // Total segments: ST + data segments + SE
    const totalSegmentCount = 2 + dataSegments.length;

    const segments: string[] = [
      `ISA*${isaQualifier}*${isaId}*${receiverQualifier}*${receiverId}*${dateStr}*${timeStr}*U*00501*${isaControlNumber}*0*P*>`,
      `GS*${functionalCode}*${partner.gsId ?? 'SENDER'}*${partner.partnerCode}*${dateStr}*${timeStr}*${gsControlNumber}*X*${gsVersionCode}`,
      `ST*${txnSetCode}*${stControlNumber}`,
      ...dataSegments,
      `SE*${totalSegmentCount}*${stControlNumber}`,
      `GE*1*${gsControlNumber}`,
      `IEA*1*${isaControlNumber}`,
    ];

    const rawData = segments.join('~') + '~';

    return { rawData, isaControlNumber, gsControlNumber, stControlNumber };
  }

  private generateEDIFACT(
    partner: TradingPartner,
    transactionType: EDITransactionType,
    data: Record<string, unknown>
  ): {
    rawData: string;
    unbReference: string;
    unhReference: string;
  } {
    this.unbCounter++;

    const unbReference = String(this.unbCounter).padStart(8, '0');
    const unhReference = String(this.unbCounter).padStart(8, '0');

    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const timeStr = now.toISOString().slice(11, 16).replace(/:/g, ''); // HHMM

    const sender = partner.unb_sender ?? partner.partnerCode;
    const recipient = partner.unb_recipient ?? 'RECEIVER';

    // Map transaction type to EDIFACT message type
    const messageType = this.getEDIFACTMessageType(transactionType);
    const messageVersion = 'D:20B';

    // Build data segments from the data object
    const dataSegments = this.buildEDIFACTDataSegments(data);

    // Total segments: UNH + data segments + UNT
    const totalSegmentCount = 2 + dataSegments.length;

    const segments: string[] = [
      `UNB+${sender}+${recipient}+${dateStr}:${timeStr}+${unbReference}`,
      `UNH+${unhReference}+${messageType}:${messageVersion}`,
      ...dataSegments,
      `UNT+${totalSegmentCount}+${unhReference}`,
      `UNZ+1+${unbReference}`,
    ];

    const rawData = segments.join("'") + "'";

    return { rawData, unbReference, unhReference };
  }

  private generateJSON(
    data: Record<string, unknown>
  ): { rawData: string } {
    return {
      rawData: JSON.stringify(data, null, 2),
    };
  }

  private generateXML(
    transactionType: EDITransactionType,
    data: Record<string, unknown>
  ): { rawData: string } {
    const lines: string[] = [];
    lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    lines.push(`<EDIMessage type="${transactionType}">`);

    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        lines.push(`  <${key}>${String(value)}</${key}>`);
      }
    }

    lines.push(`</EDIMessage>`);
    return { rawData: lines.join('\n') };
  }

  private generateCSV(
    data: Record<string, unknown>
  ): { rawData: string } {
    const keys = Object.keys(data);
    const headerLine = keys.join(',');
    const valueLine = keys.map(k => {
      const val = data[k];
      return val !== null && val !== undefined ? String(val) : '';
    }).join(',');

    return { rawData: `${headerLine}\n${valueLine}` };
  }

  // ============================================================================
  // INTERNAL: VALIDATION
  // ============================================================================

  private runValidation(
    transactionType: EDITransactionType,
    parsedData: Record<string, unknown>,
    tenantId: string
  ): EDIValidationResult {
    const rules = Array.from(this.validationRules.values()).filter(
      r =>
        r.tenantId === tenantId &&
        r.transactionType === transactionType &&
        r.isActive
    );

    const errors: EDIError[] = [];
    const warnings: string[] = [];
    const segmentCount = (parsedData['segmentCount'] as number | undefined) ?? 0;

    for (const rule of rules) {
      const ruleResult = this.evaluateRule(rule, parsedData);

      if (!ruleResult.passed) {
        if (rule.severity === 'error') {
          errors.push({
            code: `RULE_${rule.ruleName}`,
            segment: rule.segment,
            element: rule.element,
            message: ruleResult.message,
            severity: 'error',
          });
        } else {
          warnings.push(`${rule.ruleName}: ${ruleResult.message}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      segmentCount,
      validatedAt: new Date(),
    };
  }

  private evaluateRule(
    rule: EDIValidationRule,
    parsedData: Record<string, unknown>
  ): { passed: boolean; message: string } {
    // Look for the segment/element in parsed data
    const segmentValue = this.extractSegmentValue(parsedData, rule.segment, rule.element);

    switch (rule.condition) {
      case 'required':
        if (segmentValue === undefined || segmentValue === null || segmentValue === '') {
          return { passed: false, message: `${rule.segment}${rule.element ? '/' + rule.element : ''} is required` };
        }
        return { passed: true, message: '' };

      case 'format': {
        if (segmentValue === undefined || segmentValue === null) {
          return { passed: true, message: '' }; // Not present, skip format check
        }
        if (rule.expectedValue) {
          const regex = new RegExp(rule.expectedValue);
          if (!regex.test(String(segmentValue))) {
            return { passed: false, message: `${rule.segment} does not match format ${rule.expectedValue}` };
          }
        }
        return { passed: true, message: '' };
      }

      case 'length': {
        if (segmentValue === undefined || segmentValue === null) {
          return { passed: true, message: '' };
        }
        const expectedLen = rule.expectedValue ? parseInt(rule.expectedValue, 10) : 0;
        if (String(segmentValue).length !== expectedLen) {
          return { passed: false, message: `${rule.segment} length must be ${expectedLen}` };
        }
        return { passed: true, message: '' };
      }

      case 'enum': {
        if (segmentValue === undefined || segmentValue === null) {
          return { passed: true, message: '' };
        }
        const allowedValues = rule.expectedValue ? rule.expectedValue.split('|') : [];
        if (!allowedValues.includes(String(segmentValue))) {
          return { passed: false, message: `${rule.segment} must be one of: ${rule.expectedValue ?? ''}` };
        }
        return { passed: true, message: '' };
      }

      case 'custom':
        // Custom rules always pass in this basic implementation
        return { passed: true, message: '' };

      default:
        return { passed: true, message: '' };
    }
  }

  private extractSegmentValue(
    parsedData: Record<string, unknown>,
    segment: string,
    element?: string
  ): unknown {
    // First, check if the segment name is a direct key in parsedData
    const directKey = element ? `${segment}${element}` : segment;
    if (directKey in parsedData) {
      return parsedData[directKey];
    }

    // Check camelCase variant
    const camelKey = segment.charAt(0).toLowerCase() + segment.slice(1) + (element ?? '');
    if (camelKey in parsedData) {
      return parsedData[camelKey];
    }

    // Search within parsed segments array
    const segments = parsedData['segments'] as Array<Record<string, unknown>> | undefined;
    if (segments) {
      for (const seg of segments) {
        const segId = seg['id'] ?? seg['tag'];
        if (segId === segment) {
          if (element) {
            const elIndex = parseInt(element, 10);
            const elements = seg['elements'] as unknown[] | undefined;
            if (elements && !isNaN(elIndex) && elIndex >= 0 && elIndex < elements.length) {
              return elements[elIndex];
            }
          }
          return seg;
        }
      }
    }

    return undefined;
  }

  // ============================================================================
  // INTERNAL: HELPERS
  // ============================================================================

  private getX12FunctionalCode(transactionType: EDITransactionType): string {
    switch (transactionType) {
      case 'X12_850': return 'PO';
      case 'X12_856': return 'SH';
      case 'X12_940': return 'OW';
      case 'X12_944': return 'WA';
      case 'X12_945': return 'SW';
      case 'X12_997': return 'FA';
      default: return 'GF';
    }
  }

  private getEDIFACTMessageType(transactionType: EDITransactionType): string {
    switch (transactionType) {
      case 'COPARN': return 'COPARN';
      case 'BAPLIE': return 'BAPLIE';
      case 'IFTMIN': return 'IFTMIN';
      case 'CUSCAR': return 'CUSCAR';
      case 'COARRI': return 'COARRI';
      case 'CODECO': return 'CODECO';
      case 'IFTSTA': return 'IFTSTA';
      case 'CUSRES': return 'CUSRES';
      default: return transactionType;
    }
  }

  private buildX12DataSegments(data: Record<string, unknown>): string[] {
    const segments: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Nested object: create segment with sub-elements
          const subValues = Object.values(value as Record<string, unknown>);
          const subElements = subValues.map(v => v !== null && v !== undefined ? String(v) : '');
          segments.push(`${key.toUpperCase()}*${subElements.join('*')}`);
        } else if (Array.isArray(value)) {
          // Array: create a segment for each item
          for (const item of value) {
            if (typeof item === 'object' && item !== null) {
              const subValues = Object.values(item as Record<string, unknown>);
              const subElements = subValues.map(v => v !== null && v !== undefined ? String(v) : '');
              segments.push(`${key.toUpperCase()}*${subElements.join('*')}`);
            } else {
              segments.push(`${key.toUpperCase()}*${String(item)}`);
            }
          }
        } else {
          segments.push(`${key.toUpperCase()}*${String(value)}`);
        }
      }
    }

    return segments;
  }

  private buildEDIFACTDataSegments(data: Record<string, unknown>): string[] {
    const segments: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          const subValues = Object.values(value as Record<string, unknown>);
          const subElements = subValues.map(v => v !== null && v !== undefined ? String(v) : '');
          segments.push(`${key.toUpperCase()}+${subElements.join('+')}`);
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'object' && item !== null) {
              const subValues = Object.values(item as Record<string, unknown>);
              const subElements = subValues.map(v => v !== null && v !== undefined ? String(v) : '');
              segments.push(`${key.toUpperCase()}+${subElements.join('+')}`);
            } else {
              segments.push(`${key.toUpperCase()}+${String(item)}`);
            }
          }
        } else {
          segments.push(`${key.toUpperCase()}+${String(value)}`);
        }
      }
    }

    return segments;
  }

  private attemptSend(item: EDIQueueItem): boolean {
    // In production, this would call the actual transport layer (SFTP, AS2, HTTP, etc.)
    // For the in-memory engine, we simulate success based on the transport type
    const partner = this.partners.get(item.partnerId);
    if (!partner) return false;

    if (partner.status !== 'active' && partner.status !== 'testing') {
      return false;
    }

    // Simulate transport validation
    switch (item.transport) {
      case 'sftp':
        return Boolean(partner.sftpHost && partner.sftpUser);
      case 'as2':
        return Boolean(partner.as2Url && partner.as2Id);
      case 'http':
        return Boolean(partner.httpEndpoint);
      case 'email':
        return true;
      case 'manual':
        return true;
      default:
        return false;
    }
  }
}

// ============================================================================
// SINGLETON ACCESSORS
// ============================================================================

let _ediEngine: EDIEngine | null = null;

export function getEDIEngine(): EDIEngine {
  if (!_ediEngine) {
    _ediEngine = EDIEngine.getInstance();
  }
  return _ediEngine;
}

export function setEDIEngine(engine: EDIEngine): void {
  _ediEngine = engine;
}
