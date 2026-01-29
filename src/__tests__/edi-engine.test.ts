/**
 * EDI Engine Tests
 *
 * Comprehensive unit tests for EDIEngine covering:
 * - Singleton pattern
 * - Trading partner management (register, get, list, update status, update config, add supported txn)
 * - Transaction management (create, get, list, update status, link entities, add errors, acknowledge)
 * - Inbound processing (receive, parse X12/EDIFACT/JSON, validate, process, unprocessed)
 * - Outbound generation (generate X12/EDIFACT/JSON, send, acknowledgment, pending)
 * - Validation rules (add, get, list, toggle, validate transaction)
 * - Queue management (enqueue, get, list, process, retry, queue stats)
 * - Field mappings (create, get, list, toggle)
 * - Stats (full stats verification)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EDIEngine } from '../edi/edi-engine';
import type {
  RegisterPartnerInput,
  CreateTransactionInput,
  GenerateOutboundInput,
  AddValidationRuleInput,
  EnqueueInput,
  CreateFieldMappingInput,
} from '../edi/edi-engine';
import { TENANT_ID, FACILITY_ID, uuid } from './test-utils';

// ============================================================================
// Helper Factories
// ============================================================================

let partnerCounter = 1;

function makePartnerInput(overrides: Record<string, unknown> = {}): RegisterPartnerInput {
  const seq = partnerCounter++;
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    partnerCode: `TP-${String(seq).padStart(4, '0')}`,
    name: `Trading Partner ${seq}`,
    ediFormat: 'x12' as const,
    transport: 'sftp' as const,
    isaQualifier: 'ZZ',
    isaId: `SENDER${seq}`,
    gsId: `GS${seq}`,
    sftpHost: `sftp.partner${seq}.com`,
    sftpPort: 22,
    sftpUser: `edi_user_${seq}`,
    sftpPath: `/edi/incoming`,
    supportedInbound: ['X12_850', 'X12_856'] as const,
    supportedOutbound: ['X12_944', 'X12_945', 'X12_997'] as const,
    ...overrides,
  } as RegisterPartnerInput;
}

function makeEdifactPartnerInput(overrides: Record<string, unknown> = {}): RegisterPartnerInput {
  const seq = partnerCounter++;
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    partnerCode: `EF-${String(seq).padStart(4, '0')}`,
    name: `EDIFACT Partner ${seq}`,
    ediFormat: 'edifact' as const,
    transport: 'as2' as const,
    unb_sender: `SENDER${seq}`,
    unb_recipient: `RECV${seq}`,
    as2Url: `https://as2.partner${seq}.com/receive`,
    as2Id: `AS2-PARTNER-${seq}`,
    supportedInbound: ['COPARN', 'BAPLIE'] as const,
    supportedOutbound: ['COARRI', 'CODECO', 'CUSRES'] as const,
    ...overrides,
  } as RegisterPartnerInput;
}

function makeJsonPartnerInput(overrides: Record<string, unknown> = {}): RegisterPartnerInput {
  const seq = partnerCounter++;
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    partnerCode: `JSON-${String(seq).padStart(4, '0')}`,
    name: `JSON Partner ${seq}`,
    ediFormat: 'json' as const,
    transport: 'http' as const,
    httpEndpoint: `https://api.partner${seq}.com/edi`,
    httpAuthType: 'bearer' as const,
    supportedInbound: ['CUSTOM'] as const,
    supportedOutbound: ['CUSTOM'] as const,
    ...overrides,
  } as RegisterPartnerInput;
}

function makeTransactionInput(partnerId: string, partnerCode: string, partnerName: string, overrides: Record<string, unknown> = {}): CreateTransactionInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    transactionType: 'X12_850' as const,
    direction: 'inbound' as const,
    partnerId,
    partnerCode,
    partnerName,
    rawData: 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *230101*1200*U*00501*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20230101*1200*000000001*X*005010~ST*850*0001~BEG*00*SA*PO12345*230101~SE*3*0001~GE*1*000000001~IEA*1*000000001~',
    format: 'x12' as const,
    isaControlNumber: '000000001',
    gsControlNumber: '000000001',
    stControlNumber: '0001',
    ...overrides,
  } as CreateTransactionInput;
}

function makeEdifactRawData(): string {
  return "UNB+SENDER1+RECV1+230101:1200+00000001'UNH+00000001+COPARN:D:20B'BGM+12+COPARN001+9'UNT+3+00000001'UNZ+1+00000001'";
}

function makeJsonRawData(): string {
  return JSON.stringify({
    messageType: 'CUSTOM',
    orderId: 'ORD-001',
    items: [{ sku: 'SKU001', qty: 10 }],
  });
}

function makeValidationRuleInput(overrides: Record<string, unknown> = {}): AddValidationRuleInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    transactionType: 'X12_850' as const,
    ruleName: `rule-${Date.now()}-${Math.random()}`,
    ruleDescription: 'Test validation rule',
    segment: 'ISA',
    element: '1',
    condition: 'required',
    severity: 'error' as const,
    ...overrides,
  } as AddValidationRuleInput;
}

function makeEnqueueInput(transactionId: string, partnerId: string, overrides: Record<string, unknown> = {}): EnqueueInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    transactionId,
    partnerId,
    transport: 'sftp' as const,
    priority: 5,
    maxAttempts: 3,
    retryDelaySeconds: 60,
    ...overrides,
  } as EnqueueInput;
}

function makeFieldMappingInput(overrides: Record<string, unknown> = {}): CreateFieldMappingInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    transactionType: 'X12_850' as const,
    direction: 'inbound' as const,
    ediSegment: 'BEG',
    ediElement: '03',
    internalField: 'purchaseOrderNumber',
    internalEntity: 'order',
    transformType: 'direct' as const,
    ...overrides,
  } as CreateFieldMappingInput;
}

// ============================================================================
// Helper: register a partner and return the TradingPartner object
// ============================================================================

function registerPartner(engine: EDIEngine, overrides: Record<string, unknown> = {}) {
  const result = engine.registerPartner(makePartnerInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function registerEdifactPartner(engine: EDIEngine, overrides: Record<string, unknown> = {}) {
  const result = engine.registerPartner(makeEdifactPartnerInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function registerJsonPartner(engine: EDIEngine, overrides: Record<string, unknown> = {}) {
  const result = engine.registerPartner(makeJsonPartnerInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function createInboundTransaction(engine: EDIEngine, partner: { id: string; partnerCode: string; name: string }, overrides: Record<string, unknown> = {}) {
  const result = engine.createTransaction(makeTransactionInput(partner.id, partner.partnerCode, partner.name, overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

// ============================================================================
// TESTS
// ============================================================================

describe('EDIEngine', () => {
  let engine: EDIEngine;

  beforeEach(() => {
    EDIEngine.resetInstance();
    engine = EDIEngine.getInstance();
    partnerCounter = 1;
  });

  // ==========================================================================
  // 1. Singleton Pattern
  // ==========================================================================

  describe('Singleton pattern', () => {
    it('should return the same instance on repeated calls', () => {
      const a = EDIEngine.getInstance();
      const b = EDIEngine.getInstance();
      expect(a).toBe(b);
    });

    it('should return a new instance after reset', () => {
      const a = EDIEngine.getInstance();
      EDIEngine.resetInstance();
      const b = EDIEngine.getInstance();
      expect(a).not.toBe(b);
    });
  });

  // ==========================================================================
  // 2. Trading Partner Management
  // ==========================================================================

  describe('Trading partner management', () => {
    it('should register a new X12 partner', () => {
      const result = engine.registerPartner(makePartnerInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('active');
      expect(result.data!.ediFormat).toBe('x12');
      expect(result.data!.transport).toBe('sftp');
      expect(result.data!.totalTransactions).toBe(0);
      expect(result.data!.errorCount).toBe(0);
      expect(result.data!.supportedInbound).toEqual(['X12_850', 'X12_856']);
      expect(result.data!.supportedOutbound).toEqual(['X12_944', 'X12_945', 'X12_997']);
    });

    it('should register an EDIFACT partner', () => {
      const result = engine.registerPartner(makeEdifactPartnerInput());
      expect(result.success).toBe(true);
      expect(result.data!.ediFormat).toBe('edifact');
      expect(result.data!.transport).toBe('as2');
      expect(result.data!.unb_sender).toBeDefined();
      expect(result.data!.unb_recipient).toBeDefined();
    });

    it('should register a JSON/HTTP partner', () => {
      const result = engine.registerPartner(makeJsonPartnerInput());
      expect(result.success).toBe(true);
      expect(result.data!.ediFormat).toBe('json');
      expect(result.data!.transport).toBe('http');
      expect(result.data!.httpEndpoint).toBeDefined();
      expect(result.data!.httpAuthType).toBe('bearer');
    });

    it('should reject duplicate partner code for same tenant', () => {
      const partnerCode = 'DUP-PARTNER';
      engine.registerPartner(makePartnerInput({ partnerCode }));
      const result = engine.registerPartner(makePartnerInput({ partnerCode }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_PARTNER_CODE');
    });

    it('should allow same partner code for different tenants', () => {
      const partnerCode = 'SHARED-CODE';
      const r1 = engine.registerPartner(makePartnerInput({ partnerCode, tenantId: 'tenant-A' }));
      const r2 = engine.registerPartner(makePartnerInput({ partnerCode, tenantId: 'tenant-B' }));
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
    });

    it('should get partner by id', () => {
      const partner = registerPartner(engine);
      const fetched = engine.getPartner(partner.id);
      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(partner.id);
      expect(fetched!.partnerCode).toBe(partner.partnerCode);
    });

    it('should return undefined for unknown partner id', () => {
      const fetched = engine.getPartner(uuid());
      expect(fetched).toBeUndefined();
    });

    it('should get partner by code', () => {
      const partner = registerPartner(engine);
      const fetched = engine.getPartnerByCode(TENANT_ID, partner.partnerCode);
      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(partner.id);
    });

    it('should return undefined for unknown partner code', () => {
      const fetched = engine.getPartnerByCode(TENANT_ID, 'NONEXISTENT');
      expect(fetched).toBeUndefined();
    });

    it('should list all partners', () => {
      registerPartner(engine);
      registerPartner(engine);
      registerPartner(engine);
      const partners = engine.listPartners();
      expect(partners).toHaveLength(3);
    });

    it('should list partners by tenant', () => {
      registerPartner(engine, { tenantId: 'tenant-A' });
      registerPartner(engine, { tenantId: 'tenant-A' });
      registerPartner(engine, { tenantId: 'tenant-B' });
      expect(engine.listPartners('tenant-A')).toHaveLength(2);
      expect(engine.listPartners('tenant-B')).toHaveLength(1);
    });

    it('should list partners by status filter', () => {
      const p1 = registerPartner(engine);
      registerPartner(engine);
      engine.updatePartnerStatus(p1.id, 'suspended');
      expect(engine.listPartners(undefined, { status: 'active' })).toHaveLength(1);
      expect(engine.listPartners(undefined, { status: 'suspended' })).toHaveLength(1);
    });

    it('should list partners by ediFormat filter', () => {
      registerPartner(engine); // x12
      registerEdifactPartner(engine); // edifact
      expect(engine.listPartners(undefined, { ediFormat: 'x12' })).toHaveLength(1);
      expect(engine.listPartners(undefined, { ediFormat: 'edifact' })).toHaveLength(1);
    });

    it('should list partners by transport filter', () => {
      registerPartner(engine); // sftp
      registerEdifactPartner(engine); // as2
      registerJsonPartner(engine); // http
      expect(engine.listPartners(undefined, { transport: 'sftp' })).toHaveLength(1);
      expect(engine.listPartners(undefined, { transport: 'as2' })).toHaveLength(1);
      expect(engine.listPartners(undefined, { transport: 'http' })).toHaveLength(1);
    });

    it('should update partner status', () => {
      const partner = registerPartner(engine);
      const result = engine.updatePartnerStatus(partner.id, 'suspended', 'Maintenance window');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('suspended');
    });

    it('should fail to update status of unknown partner', () => {
      const result = engine.updatePartnerStatus(uuid(), 'inactive');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should update partner config (SFTP)', () => {
      const partner = registerPartner(engine);
      const result = engine.updatePartnerConfig(partner.id, {
        sftpHost: 'new-sftp.example.com',
        sftpPort: 2222,
        sftpUser: 'new_user',
        sftpPath: '/new/path',
      });
      expect(result.success).toBe(true);
      expect(result.data!.sftpHost).toBe('new-sftp.example.com');
      expect(result.data!.sftpPort).toBe(2222);
      expect(result.data!.sftpUser).toBe('new_user');
      expect(result.data!.sftpPath).toBe('/new/path');
    });

    it('should update partner config (AS2)', () => {
      const partner = registerEdifactPartner(engine);
      const result = engine.updatePartnerConfig(partner.id, {
        as2Url: 'https://new-as2.example.com',
        as2Id: 'NEW-AS2-ID',
      });
      expect(result.success).toBe(true);
      expect(result.data!.as2Url).toBe('https://new-as2.example.com');
      expect(result.data!.as2Id).toBe('NEW-AS2-ID');
    });

    it('should update partner config (HTTP)', () => {
      const partner = registerJsonPartner(engine);
      const result = engine.updatePartnerConfig(partner.id, {
        httpEndpoint: 'https://new-api.example.com/edi',
        httpAuthType: 'api_key',
      });
      expect(result.success).toBe(true);
      expect(result.data!.httpEndpoint).toBe('https://new-api.example.com/edi');
      expect(result.data!.httpAuthType).toBe('api_key');
    });

    it('should fail to update config for unknown partner', () => {
      const result = engine.updatePartnerConfig(uuid(), { sftpHost: 'test.com' });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should add supported inbound transaction type', () => {
      const partner = registerPartner(engine);
      const result = engine.addSupportedTransaction(partner.id, 'inbound', 'X12_940');
      expect(result.success).toBe(true);
      expect(result.data!.supportedInbound).toContain('X12_940');
    });

    it('should add supported outbound transaction type', () => {
      const partner = registerPartner(engine);
      const result = engine.addSupportedTransaction(partner.id, 'outbound', 'X12_856');
      expect(result.success).toBe(true);
      expect(result.data!.supportedOutbound).toContain('X12_856');
    });

    it('should not duplicate an already supported transaction type', () => {
      const partner = registerPartner(engine);
      engine.addSupportedTransaction(partner.id, 'inbound', 'X12_940');
      engine.addSupportedTransaction(partner.id, 'inbound', 'X12_940');
      const fetched = engine.getPartner(partner.id)!;
      const count = fetched.supportedInbound.filter(t => t === 'X12_940').length;
      expect(count).toBe(1);
    });

    it('should fail to add supported transaction for unknown partner', () => {
      const result = engine.addSupportedTransaction(uuid(), 'inbound', 'X12_850');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should set default empty arrays for supported transactions when not provided', () => {
      const result = engine.registerPartner(makePartnerInput({
        supportedInbound: undefined,
        supportedOutbound: undefined,
      }));
      expect(result.success).toBe(true);
      expect(result.data!.supportedInbound).toEqual([]);
      expect(result.data!.supportedOutbound).toEqual([]);
    });
  });

  // ==========================================================================
  // 3. Transaction Management
  // ==========================================================================

  describe('Transaction management', () => {
    it('should create an inbound transaction', () => {
      const partner = registerPartner(engine);
      const result = engine.createTransaction(makeTransactionInput(partner.id, partner.partnerCode, partner.name));
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('received');
      expect(result.data!.direction).toBe('inbound');
      expect(result.data!.transactionNumber).toMatch(/^EDI-/);
      expect(result.data!.receivedAt).toBeDefined();
      expect(result.data!.linkedContainerIds).toEqual([]);
      expect(result.data!.linkedOrderIds).toEqual([]);
      expect(result.data!.linkedShipmentIds).toEqual([]);
      expect(result.data!.errors).toEqual([]);
      expect(result.data!.warnings).toEqual([]);
    });

    it('should create an outbound transaction', () => {
      const partner = registerPartner(engine);
      const result = engine.createTransaction(makeTransactionInput(partner.id, partner.partnerCode, partner.name, {
        direction: 'outbound',
        transactionType: 'X12_997',
      }));
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('generating');
      expect(result.data!.direction).toBe('outbound');
      expect(result.data!.receivedAt).toBeUndefined();
    });

    it('should fail to create transaction for unknown partner', () => {
      const result = engine.createTransaction(makeTransactionInput(uuid(), 'UNKNOWN', 'Unknown Partner'));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PARTNER_NOT_FOUND');
    });

    it('should increment partner totalTransactions on create', () => {
      const partner = registerPartner(engine);
      createInboundTransaction(engine, partner);
      createInboundTransaction(engine, partner);
      const updated = engine.getPartner(partner.id)!;
      expect(updated.totalTransactions).toBe(2);
    });

    it('should set partner lastInboundAt for inbound transaction', () => {
      const partner = registerPartner(engine);
      createInboundTransaction(engine, partner);
      const updated = engine.getPartner(partner.id)!;
      expect(updated.lastInboundAt).toBeDefined();
    });

    it('should set partner lastOutboundAt for outbound transaction', () => {
      const partner = registerPartner(engine);
      engine.createTransaction(makeTransactionInput(partner.id, partner.partnerCode, partner.name, {
        direction: 'outbound',
      }));
      const updated = engine.getPartner(partner.id)!;
      expect(updated.lastOutboundAt).toBeDefined();
    });

    it('should get transaction by id', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const fetched = engine.getTransaction(txn.id);
      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(txn.id);
    });

    it('should return undefined for unknown transaction id', () => {
      expect(engine.getTransaction(uuid())).toBeUndefined();
    });

    it('should get transaction by number', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const fetched = engine.getTransactionByNumber(txn.transactionNumber);
      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(txn.id);
    });

    it('should return undefined for unknown transaction number', () => {
      expect(engine.getTransactionByNumber('EDI-NONEXISTENT-0000')).toBeUndefined();
    });

    it('should list all transactions', () => {
      const partner = registerPartner(engine);
      createInboundTransaction(engine, partner);
      createInboundTransaction(engine, partner);
      createInboundTransaction(engine, partner);
      expect(engine.listTransactions()).toHaveLength(3);
    });

    it('should list transactions by tenant', () => {
      const p1 = registerPartner(engine, { tenantId: 'tenant-X' });
      const p2 = registerPartner(engine, { tenantId: 'tenant-Y' });
      createInboundTransaction(engine, p1, { tenantId: 'tenant-X' });
      createInboundTransaction(engine, p1, { tenantId: 'tenant-X' });
      createInboundTransaction(engine, p2, { tenantId: 'tenant-Y' });
      expect(engine.listTransactions('tenant-X')).toHaveLength(2);
      expect(engine.listTransactions('tenant-Y')).toHaveLength(1);
    });

    it('should list transactions by partnerId filter', () => {
      const p1 = registerPartner(engine);
      const p2 = registerPartner(engine);
      createInboundTransaction(engine, p1);
      createInboundTransaction(engine, p1);
      createInboundTransaction(engine, p2);
      expect(engine.listTransactions(undefined, { partnerId: p1.id })).toHaveLength(2);
      expect(engine.listTransactions(undefined, { partnerId: p2.id })).toHaveLength(1);
    });

    it('should list transactions by type filter', () => {
      const partner = registerPartner(engine);
      createInboundTransaction(engine, partner, { transactionType: 'X12_850' });
      createInboundTransaction(engine, partner, { transactionType: 'X12_856' });
      expect(engine.listTransactions(undefined, { type: 'X12_850' })).toHaveLength(1);
      expect(engine.listTransactions(undefined, { type: 'X12_856' })).toHaveLength(1);
    });

    it('should list transactions by direction filter', () => {
      const partner = registerPartner(engine);
      createInboundTransaction(engine, partner, { direction: 'inbound' });
      engine.createTransaction(makeTransactionInput(partner.id, partner.partnerCode, partner.name, { direction: 'outbound' }));
      expect(engine.listTransactions(undefined, { direction: 'inbound' })).toHaveLength(1);
      expect(engine.listTransactions(undefined, { direction: 'outbound' })).toHaveLength(1);
    });

    it('should list transactions by status filter', () => {
      const partner = registerPartner(engine);
      const txn1 = createInboundTransaction(engine, partner);
      createInboundTransaction(engine, partner);
      engine.updateTransactionStatus(txn1.id, 'parsing');
      expect(engine.listTransactions(undefined, { status: 'received' })).toHaveLength(1);
      expect(engine.listTransactions(undefined, { status: 'parsing' })).toHaveLength(1);
    });

    it('should list transactions by date range filter', () => {
      const partner = registerPartner(engine);
      createInboundTransaction(engine, partner);
      const pastDate = new Date(Date.now() - 86400000);
      const futureDate = new Date(Date.now() + 86400000);
      expect(engine.listTransactions(undefined, { dateFrom: pastDate, dateTo: futureDate })).toHaveLength(1);
      expect(engine.listTransactions(undefined, { dateFrom: futureDate })).toHaveLength(0);
    });

    it('should update transaction status with valid transitions', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      expect(txn.status).toBe('received');

      const r1 = engine.updateTransactionStatus(txn.id, 'parsing');
      expect(r1.success).toBe(true);
      expect(r1.data!.status).toBe('parsing');

      const r2 = engine.updateTransactionStatus(txn.id, 'parsed');
      expect(r2.success).toBe(true);
      expect(r2.data!.parsedAt).toBeDefined();

      const r3 = engine.updateTransactionStatus(txn.id, 'processing');
      expect(r3.success).toBe(true);

      const r4 = engine.updateTransactionStatus(txn.id, 'processed');
      expect(r4.success).toBe(true);
      expect(r4.data!.processedAt).toBeDefined();

      const r5 = engine.updateTransactionStatus(txn.id, 'acknowledged');
      expect(r5.success).toBe(true);
      expect(r5.data!.acknowledgedAt).toBeDefined();
    });

    it('should reject invalid status transitions', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      // received -> processed is not a valid direct transition
      const result = engine.updateTransactionStatus(txn.id, 'processed');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should allow transition to error from most statuses', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const result = engine.updateTransactionStatus(txn.id, 'error');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('error');
    });

    it('should not allow transitions from acknowledged', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      engine.updateTransactionStatus(txn.id, 'parsing');
      engine.updateTransactionStatus(txn.id, 'parsed');
      engine.updateTransactionStatus(txn.id, 'processing');
      engine.updateTransactionStatus(txn.id, 'processed');
      engine.updateTransactionStatus(txn.id, 'acknowledged');
      const result = engine.updateTransactionStatus(txn.id, 'error');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should not allow transitions from rejected', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      engine.updateTransactionStatus(txn.id, 'rejected');
      const result = engine.updateTransactionStatus(txn.id, 'received');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should allow error recovery: error -> received', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      engine.updateTransactionStatus(txn.id, 'error');
      const result = engine.updateTransactionStatus(txn.id, 'received');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('received');
    });

    it('should set sentAt when transitioning to sent status', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner, { direction: 'outbound' });
      engine.updateTransactionStatus(txn.id, 'generated');
      engine.updateTransactionStatus(txn.id, 'sending');
      const result = engine.updateTransactionStatus(txn.id, 'sent');
      expect(result.success).toBe(true);
      expect(result.data!.sentAt).toBeDefined();
    });

    it('should fail to update status of unknown transaction', () => {
      const result = engine.updateTransactionStatus(uuid(), 'parsed');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should link entities to transaction', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const result = engine.linkEntities(txn.id, {
        containerIds: ['CONT-001', 'CONT-002'],
        orderIds: ['ORD-001'],
        shipmentIds: ['SHIP-001', 'SHIP-002'],
      });
      expect(result.success).toBe(true);
      expect(result.data!.linkedContainerIds).toEqual(['CONT-001', 'CONT-002']);
      expect(result.data!.linkedOrderIds).toEqual(['ORD-001']);
      expect(result.data!.linkedShipmentIds).toEqual(['SHIP-001', 'SHIP-002']);
    });

    it('should not duplicate linked entities', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      engine.linkEntities(txn.id, { containerIds: ['CONT-001'] });
      engine.linkEntities(txn.id, { containerIds: ['CONT-001', 'CONT-002'] });
      const fetched = engine.getTransaction(txn.id)!;
      expect(fetched.linkedContainerIds).toEqual(['CONT-001', 'CONT-002']);
    });

    it('should fail to link entities to unknown transaction', () => {
      const result = engine.linkEntities(uuid(), { containerIds: ['CONT-001'] });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should add a warning-level error to transaction', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const result = engine.addTransactionError(txn.id, {
        code: 'WARN_001',
        message: 'Optional field missing',
        severity: 'warning',
      });
      expect(result.success).toBe(true);
      expect(result.data!.errors).toHaveLength(1);
      expect(result.data!.status).toBe('received'); // warning does not change status
    });

    it('should add a fatal error and set status to error', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const result = engine.addTransactionError(txn.id, {
        code: 'FATAL_001',
        message: 'Critical validation failure',
        severity: 'fatal',
      });
      expect(result.success).toBe(true);
      expect(result.data!.errors).toHaveLength(1);
      expect(result.data!.status).toBe('error');
    });

    it('should increment partner error count on addTransactionError', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      engine.addTransactionError(txn.id, {
        code: 'ERR_001',
        message: 'Test error',
        severity: 'error',
      });
      const updated = engine.getPartner(partner.id)!;
      expect(updated.errorCount).toBe(1);
    });

    it('should fail to add error to unknown transaction', () => {
      const result = engine.addTransactionError(uuid(), {
        code: 'ERR_001',
        message: 'Test',
        severity: 'error',
      });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should get transactions by partner', () => {
      const p1 = registerPartner(engine);
      const p2 = registerPartner(engine);
      createInboundTransaction(engine, p1);
      createInboundTransaction(engine, p1);
      createInboundTransaction(engine, p2);
      expect(engine.getTransactionsByPartner(p1.id)).toHaveLength(2);
      expect(engine.getTransactionsByPartner(p2.id)).toHaveLength(1);
    });

    it('should return empty array for partner with no transactions', () => {
      const partner = registerPartner(engine);
      expect(engine.getTransactionsByPartner(partner.id)).toHaveLength(0);
    });

    it('should return empty array for unknown partner id in getTransactionsByPartner', () => {
      expect(engine.getTransactionsByPartner(uuid())).toHaveLength(0);
    });

    it('should acknowledge a transaction', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const ackTxn = createInboundTransaction(engine, partner, { transactionType: 'X12_997' });
      const result = engine.acknowledgeTransaction(txn.id, ackTxn.id, 'accepted');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('acknowledged');
      expect(result.data!.acknowledgedAt).toBeDefined();
      expect(result.data!.ackTransactionId).toBe(ackTxn.id);
      expect(result.data!.ackStatus).toBe('accepted');
    });

    it('should acknowledge with errors', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const ackTxn = createInboundTransaction(engine, partner, { transactionType: 'X12_997' });
      const result = engine.acknowledgeTransaction(txn.id, ackTxn.id, 'accepted_with_errors');
      expect(result.success).toBe(true);
      expect(result.data!.ackStatus).toBe('accepted_with_errors');
    });

    it('should acknowledge with rejected status', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const ackTxn = createInboundTransaction(engine, partner, { transactionType: 'X12_997' });
      const result = engine.acknowledgeTransaction(txn.id, ackTxn.id, 'rejected');
      expect(result.success).toBe(true);
      expect(result.data!.ackStatus).toBe('rejected');
    });

    it('should fail to acknowledge unknown transaction', () => {
      const partner = registerPartner(engine);
      const ackTxn = createInboundTransaction(engine, partner);
      const result = engine.acknowledgeTransaction(uuid(), ackTxn.id, 'accepted');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to acknowledge with unknown ack transaction', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const result = engine.acknowledgeTransaction(txn.id, uuid(), 'accepted');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ACK_NOT_FOUND');
    });
  });

  // ==========================================================================
  // 4. Inbound Processing
  // ==========================================================================

  describe('Inbound processing', () => {
    it('should receive and auto-parse an inbound X12 transaction', () => {
      const partner = registerPartner(engine);
      const x12Data = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *230101*1200*U*00501*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20230101*1200*000000001*X*005010~ST*850*0001~BEG*00*SA*PO12345*230101~SE*3*0001~GE*1*000000001~IEA*1*000000001~';
      const result = engine.receiveInbound(makeTransactionInput(partner.id, partner.partnerCode, partner.name, {
        rawData: x12Data,
        format: 'x12',
        transactionType: 'X12_850',
      }));
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('parsed');
      expect(result.data!.parsedData).toBeDefined();
      expect(result.data!.parsedAt).toBeDefined();
    });

    it('should receive and auto-parse an inbound EDIFACT transaction', () => {
      const partner = registerEdifactPartner(engine);
      const result = engine.receiveInbound(makeTransactionInput(partner.id, partner.partnerCode, partner.name, {
        rawData: makeEdifactRawData(),
        format: 'edifact',
        transactionType: 'COPARN',
      }));
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('parsed');
      expect(result.data!.parsedData).toBeDefined();
    });

    it('should receive and auto-parse an inbound JSON transaction', () => {
      const partner = registerJsonPartner(engine);
      const result = engine.receiveInbound(makeTransactionInput(partner.id, partner.partnerCode, partner.name, {
        rawData: makeJsonRawData(),
        format: 'json',
        transactionType: 'CUSTOM',
      }));
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('parsed');
      expect(result.data!.parsedData).toBeDefined();
    });

    it('should still create transaction when parsing fails', () => {
      const partner = registerJsonPartner(engine);
      const result = engine.receiveInbound(makeTransactionInput(partner.id, partner.partnerCode, partner.name, {
        rawData: 'NOT_VALID_JSON{{{',
        format: 'json',
        transactionType: 'CUSTOM',
      }));
      // Transaction should be created even though parsing failed
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });

    it('should parse X12 inbound data with correct segment extraction', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner, {
        rawData: 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *230101*1200*U*00501*000000099*0*P*>~GS*PO*GSID*PARTNER*20230101*1200*000000099*X*005010~ST*850*0001~SE*2*0001~GE*1*000000099~IEA*1*000000099~',
        format: 'x12',
        transactionType: 'X12_850',
      });
      const result = engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('parsed');
      expect(result.data!.parsedData).toBeDefined();
      const pd = result.data!.parsedData!;
      expect(pd['isaControlNumber']).toBe('000000099');
      expect(pd['gsFunctionalCode']).toBe('PO');
      expect(pd['stTransactionSetCode']).toBe('850');
      expect(pd['stControlNumber']).toBe('0001');
      expect(pd['segmentCount']).toBeGreaterThan(0);
    });

    it('should parse EDIFACT inbound data with correct segment extraction', () => {
      const partner = registerEdifactPartner(engine);
      const txn = createInboundTransaction(engine, partner, {
        rawData: makeEdifactRawData(),
        format: 'edifact',
        transactionType: 'COPARN',
      });
      const result = engine.parseInbound({ transactionId: txn.id, parseAsType: 'COPARN' });
      expect(result.success).toBe(true);
      const pd = result.data!.parsedData!;
      expect(pd['unbReference']).toBe('00000001');
      expect(pd['unhReference']).toBe('00000001');
      expect(pd['segmentCount']).toBeGreaterThan(0);
    });

    it('should parse JSON inbound data', () => {
      const partner = registerJsonPartner(engine);
      const txn = createInboundTransaction(engine, partner, {
        rawData: makeJsonRawData(),
        format: 'json',
        transactionType: 'CUSTOM',
      });
      const result = engine.parseInbound({ transactionId: txn.id, parseAsType: 'CUSTOM' });
      expect(result.success).toBe(true);
      const pd = result.data!.parsedData!;
      expect(pd['messageType']).toBe('CUSTOM');
      expect(pd['orderId']).toBe('ORD-001');
      expect(pd['segmentCount']).toBeGreaterThan(0);
    });

    it('should fail to parse unknown transaction', () => {
      const result = engine.parseInbound({ transactionId: uuid(), parseAsType: 'X12_850' });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to parse an outbound transaction as inbound', () => {
      const partner = registerPartner(engine);
      const result = engine.createTransaction(makeTransactionInput(partner.id, partner.partnerCode, partner.name, {
        direction: 'outbound',
      }));
      const txn = result.data!;
      const parseResult = engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      expect(parseResult.success).toBe(false);
      expect(parseResult.errorCode).toBe('INVALID_DIRECTION');
    });

    it('should set error status when parsing invalid JSON', () => {
      const partner = registerJsonPartner(engine);
      const txn = createInboundTransaction(engine, partner, {
        rawData: 'INVALID_JSON',
        format: 'json',
        transactionType: 'CUSTOM',
      });
      const result = engine.parseInbound({ transactionId: txn.id, parseAsType: 'CUSTOM' });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PARSE_ERROR');
      const updated = engine.getTransaction(txn.id)!;
      expect(updated.status).toBe('error');
      expect(updated.errors.length).toBeGreaterThan(0);
    });

    it('should validate a parsed inbound transaction with no rules (passes)', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      const result = engine.validateInbound(txn.id);
      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(true);
      expect(result.data!.errors).toHaveLength(0);
    });

    it('should fail to validate an unparsed transaction', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const result = engine.validateInbound(txn.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_PARSED');
    });

    it('should fail to validate unknown transaction', () => {
      const result = engine.validateInbound(uuid());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should validate with failing error-severity rule', () => {
      const partner = registerPartner(engine);
      // Add a required rule for a field that does not exist
      engine.addValidationRule(makeValidationRuleInput({
        transactionType: 'X12_850',
        ruleName: 'require-nonexistent',
        segment: 'NONEXISTENT_SEGMENT',
        condition: 'required',
        severity: 'error',
      }));
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      const result = engine.validateInbound(txn.id);
      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(false);
      expect(result.data!.errors.length).toBeGreaterThan(0);
    });

    it('should validate with warning-severity rule', () => {
      const partner = registerPartner(engine);
      engine.addValidationRule(makeValidationRuleInput({
        transactionType: 'X12_850',
        ruleName: 'warn-nonexistent',
        segment: 'NONEXISTENT_SEGMENT',
        condition: 'required',
        severity: 'warning',
      }));
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      const result = engine.validateInbound(txn.id);
      expect(result.success).toBe(true);
      // Warnings don't make isValid false because there are no error-level failures
      expect(result.data!.warnings.length).toBeGreaterThan(0);
    });

    it('should process a parsed inbound transaction', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      const result = engine.processInbound(txn.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('processed');
      expect(result.data!.processedAt).toBeDefined();
    });

    it('should process a validated inbound transaction', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      engine.validateInbound(txn.id);
      const result = engine.processInbound(txn.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('processed');
    });

    it('should fail to process outbound transaction as inbound', () => {
      const partner = registerPartner(engine);
      const outTxn = engine.createTransaction(makeTransactionInput(partner.id, partner.partnerCode, partner.name, {
        direction: 'outbound',
      }));
      const result = engine.processInbound(outTxn.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_DIRECTION');
    });

    it('should fail to process transaction that is not parsed or validated', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const result = engine.processInbound(txn.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to process unknown transaction', () => {
      const result = engine.processInbound(uuid());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should get unprocessed inbound transactions', () => {
      const partner = registerPartner(engine);
      const txn1 = createInboundTransaction(engine, partner);
      const txn2 = createInboundTransaction(engine, partner);
      const txn3 = createInboundTransaction(engine, partner);
      // Parse txn2 (still unprocessed because parsed but not processed)
      engine.parseInbound({ transactionId: txn2.id, parseAsType: 'X12_850' });
      // Process txn3 fully
      engine.parseInbound({ transactionId: txn3.id, parseAsType: 'X12_850' });
      engine.processInbound(txn3.id);

      const unprocessed = engine.getUnprocessedInbound(TENANT_ID);
      // txn1 is 'received' (unprocessed), txn2 is 'parsed' (unprocessed), txn3 is 'processed' (excluded)
      expect(unprocessed).toHaveLength(2);
      const ids = unprocessed.map(t => t.id);
      expect(ids).toContain(txn1.id);
      expect(ids).toContain(txn2.id);
    });

    it('should return empty for unprocessed when tenant has no inbound', () => {
      expect(engine.getUnprocessedInbound('empty-tenant')).toHaveLength(0);
    });
  });

  // ==========================================================================
  // 5. Outbound Generation
  // ==========================================================================

  describe('Outbound generation', () => {
    it('should generate an outbound X12 transaction', () => {
      const partner = registerPartner(engine);
      const input: GenerateOutboundInput = {
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { warehouseId: 'WH-001', shipmentId: 'SHIP-001', quantity: 100 },
      };
      const result = engine.generateOutbound(input);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('generated');
      expect(result.data!.direction).toBe('outbound');
      expect(result.data!.rawData).toContain('ISA');
      expect(result.data!.rawData).toContain('GS');
      expect(result.data!.rawData).toContain('ST');
      expect(result.data!.isaControlNumber).toBeDefined();
      expect(result.data!.gsControlNumber).toBeDefined();
      expect(result.data!.stControlNumber).toBeDefined();
      expect(result.data!.parsedData).toBeDefined();
    });

    it('should generate an outbound EDIFACT transaction', () => {
      const partner = registerEdifactPartner(engine);
      const input: GenerateOutboundInput = {
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'COARRI',
        data: { containerId: 'CONT-001', action: 'discharge' },
      };
      const result = engine.generateOutbound(input);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('generated');
      expect(result.data!.rawData).toContain('UNB');
      expect(result.data!.rawData).toContain('UNH');
      expect(result.data!.unbReference).toBeDefined();
      expect(result.data!.unhReference).toBeDefined();
    });

    it('should generate an outbound JSON transaction', () => {
      const partner = registerJsonPartner(engine);
      const input: GenerateOutboundInput = {
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'CUSTOM',
        data: { status: 'ready', orderId: 'ORD-001' },
      };
      const result = engine.generateOutbound(input);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('generated');
      const parsed = JSON.parse(result.data!.rawData);
      expect(parsed.status).toBe('ready');
      expect(parsed.orderId).toBe('ORD-001');
    });

    it('should link entities during outbound generation', () => {
      const partner = registerPartner(engine);
      const input: GenerateOutboundInput = {
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { shipmentId: 'SHIP-001' },
        linkedContainerIds: ['CONT-A', 'CONT-B'],
        linkedOrderIds: ['ORD-X'],
        linkedShipmentIds: ['SHIP-001'],
      };
      const result = engine.generateOutbound(input);
      expect(result.success).toBe(true);
      expect(result.data!.linkedContainerIds).toEqual(['CONT-A', 'CONT-B']);
      expect(result.data!.linkedOrderIds).toEqual(['ORD-X']);
      expect(result.data!.linkedShipmentIds).toEqual(['SHIP-001']);
    });

    it('should fail to generate outbound for unknown partner', () => {
      const result = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: uuid(),
        transactionType: 'X12_945',
        data: {},
      });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PARTNER_NOT_FOUND');
    });

    it('should fail to generate outbound for inactive partner', () => {
      const partner = registerPartner(engine);
      engine.updatePartnerStatus(partner.id, 'inactive');
      const result = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: {},
      });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PARTNER_NOT_ACTIVE');
    });

    it('should fail to generate outbound for suspended partner', () => {
      const partner = registerPartner(engine);
      engine.updatePartnerStatus(partner.id, 'suspended');
      const result = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: {},
      });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PARTNER_NOT_ACTIVE');
    });

    it('should allow outbound generation for testing partner', () => {
      const partner = registerPartner(engine);
      engine.updatePartnerStatus(partner.id, 'testing');
      const result = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: true },
      });
      expect(result.success).toBe(true);
    });

    it('should send an outbound transaction', () => {
      const partner = registerPartner(engine);
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'send' },
      });
      const result = engine.sendOutbound(genResult.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('sent');
      expect(result.data!.sentAt).toBeDefined();
    });

    it('should fail to send unknown transaction', () => {
      const result = engine.sendOutbound(uuid());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to send an inbound transaction', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const result = engine.sendOutbound(txn.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_DIRECTION');
    });

    it('should fail to send a transaction not in generated status', () => {
      const partner = registerPartner(engine);
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'send' },
      });
      engine.sendOutbound(genResult.data!.id);
      // Now try to send again (status is 'sent', not 'generated')
      const result = engine.sendOutbound(genResult.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should generate an acknowledgment for an X12 inbound transaction', () => {
      const partner = registerPartner(engine);
      const inboundResult = engine.receiveInbound(makeTransactionInput(partner.id, partner.partnerCode, partner.name, {
        rawData: 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *230101*1200*U*00501*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20230101*1200*000000001*X*005010~ST*850*0001~SE*2*0001~GE*1*000000001~IEA*1*000000001~',
        format: 'x12',
        transactionType: 'X12_850',
      }));
      const result = engine.generateAcknowledgment(inboundResult.data!.id);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.transactionType).toBe('X12_997');
      expect(result.data!.direction).toBe('outbound');

      // Original transaction should be acknowledged
      const original = engine.getTransaction(inboundResult.data!.id)!;
      expect(original.status).toBe('acknowledged');
      expect(original.ackTransactionId).toBe(result.data!.id);
      expect(original.ackStatus).toBe('accepted');
    });

    it('should generate acknowledgment with errors for inbound that has errors', () => {
      const partner = registerPartner(engine);
      const inboundResult = engine.receiveInbound(makeTransactionInput(partner.id, partner.partnerCode, partner.name, {
        rawData: 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *230101*1200*U*00501*000000001*0*P*>~ST*850*0001~SE*2*0001~IEA*1*000000001~',
        format: 'x12',
        transactionType: 'X12_850',
      }));
      // Add an error to the inbound transaction
      engine.addTransactionError(inboundResult.data!.id, {
        code: 'ERR_001',
        message: 'Missing GS segment',
        severity: 'error',
      });
      const result = engine.generateAcknowledgment(inboundResult.data!.id);
      expect(result.success).toBe(true);
      const original = engine.getTransaction(inboundResult.data!.id)!;
      expect(original.ackStatus).toBe('accepted_with_errors');
    });

    it('should generate EDIFACT acknowledgment (CUSRES) for EDIFACT inbound', () => {
      const partner = registerEdifactPartner(engine);
      const inboundResult = engine.receiveInbound(makeTransactionInput(partner.id, partner.partnerCode, partner.name, {
        rawData: makeEdifactRawData(),
        format: 'edifact',
        transactionType: 'COPARN',
      }));
      const result = engine.generateAcknowledgment(inboundResult.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.transactionType).toBe('CUSRES');
    });

    it('should fail to generate acknowledgment for outbound transaction', () => {
      const partner = registerPartner(engine);
      const outResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: true },
      });
      const result = engine.generateAcknowledgment(outResult.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_DIRECTION');
    });

    it('should fail to generate acknowledgment for unknown transaction', () => {
      const result = engine.generateAcknowledgment(uuid());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should get pending outbound transactions', () => {
      const partner = registerPartner(engine);
      engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { shipment: 'A' },
      });
      engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_944',
        data: { receipt: 'B' },
      });
      const sentResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_997',
        data: { ack: 'C' },
      });
      engine.sendOutbound(sentResult.data!.id);

      const pending = engine.getPendingOutbound(TENANT_ID);
      expect(pending).toHaveLength(2);
    });

    it('should return empty for pending outbound when nothing generated', () => {
      expect(engine.getPendingOutbound(TENANT_ID)).toHaveLength(0);
    });
  });

  // ==========================================================================
  // 6. Validation Rules
  // ==========================================================================

  describe('Validation rules', () => {
    it('should add a validation rule', () => {
      const result = engine.addValidationRule(makeValidationRuleInput({
        ruleName: 'require-isa',
        segment: 'ISA',
        condition: 'required',
        severity: 'error',
      }));
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.isActive).toBe(true);
      expect(result.data!.ruleName).toBe('require-isa');
      expect(result.data!.severity).toBe('error');
    });

    it('should reject duplicate rule name for same transaction type and tenant', () => {
      const ruleName = 'unique-rule';
      engine.addValidationRule(makeValidationRuleInput({ ruleName, transactionType: 'X12_850' }));
      const result = engine.addValidationRule(makeValidationRuleInput({ ruleName, transactionType: 'X12_850' }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_RULE_NAME');
    });

    it('should allow same rule name for different transaction types', () => {
      const ruleName = 'shared-rule-name';
      const r1 = engine.addValidationRule(makeValidationRuleInput({ ruleName, transactionType: 'X12_850' }));
      const r2 = engine.addValidationRule(makeValidationRuleInput({ ruleName, transactionType: 'X12_856' }));
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
    });

    it('should allow same rule name for different tenants', () => {
      const ruleName = 'tenant-rule';
      const r1 = engine.addValidationRule(makeValidationRuleInput({ ruleName, tenantId: 'tenant-A' }));
      const r2 = engine.addValidationRule(makeValidationRuleInput({ ruleName, tenantId: 'tenant-B' }));
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
    });

    it('should get validation rule by id', () => {
      const result = engine.addValidationRule(makeValidationRuleInput({ ruleName: 'get-rule' }));
      const rule = engine.getValidationRule(result.data!.id);
      expect(rule).toBeDefined();
      expect(rule!.ruleName).toBe('get-rule');
    });

    it('should return undefined for unknown rule id', () => {
      expect(engine.getValidationRule(uuid())).toBeUndefined();
    });

    it('should list all validation rules', () => {
      engine.addValidationRule(makeValidationRuleInput({ ruleName: 'r1' }));
      engine.addValidationRule(makeValidationRuleInput({ ruleName: 'r2' }));
      engine.addValidationRule(makeValidationRuleInput({ ruleName: 'r3' }));
      expect(engine.listValidationRules()).toHaveLength(3);
    });

    it('should list rules by tenant', () => {
      engine.addValidationRule(makeValidationRuleInput({ ruleName: 'ta1', tenantId: 'tenant-A' }));
      engine.addValidationRule(makeValidationRuleInput({ ruleName: 'ta2', tenantId: 'tenant-A' }));
      engine.addValidationRule(makeValidationRuleInput({ ruleName: 'tb1', tenantId: 'tenant-B' }));
      expect(engine.listValidationRules('tenant-A')).toHaveLength(2);
      expect(engine.listValidationRules('tenant-B')).toHaveLength(1);
    });

    it('should list rules by transactionType filter', () => {
      engine.addValidationRule(makeValidationRuleInput({ ruleName: 'r850a', transactionType: 'X12_850' }));
      engine.addValidationRule(makeValidationRuleInput({ ruleName: 'r856a', transactionType: 'X12_856' }));
      expect(engine.listValidationRules(undefined, { transactionType: 'X12_850' })).toHaveLength(1);
      expect(engine.listValidationRules(undefined, { transactionType: 'X12_856' })).toHaveLength(1);
    });

    it('should list rules by isActive filter', () => {
      const r1 = engine.addValidationRule(makeValidationRuleInput({ ruleName: 'active-rule' }));
      engine.addValidationRule(makeValidationRuleInput({ ruleName: 'to-toggle' }));
      engine.toggleValidationRule(r1.data!.id);
      expect(engine.listValidationRules(undefined, { isActive: true })).toHaveLength(1);
      expect(engine.listValidationRules(undefined, { isActive: false })).toHaveLength(1);
    });

    it('should toggle validation rule active state', () => {
      const result = engine.addValidationRule(makeValidationRuleInput({ ruleName: 'toggle-me' }));
      expect(result.data!.isActive).toBe(true);

      const toggled1 = engine.toggleValidationRule(result.data!.id);
      expect(toggled1.success).toBe(true);
      expect(toggled1.data!.isActive).toBe(false);

      const toggled2 = engine.toggleValidationRule(result.data!.id);
      expect(toggled2.success).toBe(true);
      expect(toggled2.data!.isActive).toBe(true);
    });

    it('should fail to toggle unknown rule', () => {
      const result = engine.toggleValidationRule(uuid());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should validate transaction using required condition', () => {
      const partner = registerPartner(engine);
      // Add a rule that requires 'isaControlNumber' to be present
      engine.addValidationRule(makeValidationRuleInput({
        ruleName: 'require-isa-control',
        segment: 'isaControlNumber',
        element: undefined,
        condition: 'required',
        severity: 'error',
      }));
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      const result = engine.validateTransaction(txn.id);
      expect(result.success).toBe(true);
      // isaControlNumber should be present in parsed X12 data
      expect(result.data!.isValid).toBe(true);
    });

    it('should validate transaction with failing required condition', () => {
      const partner = registerPartner(engine);
      engine.addValidationRule(makeValidationRuleInput({
        ruleName: 'require-missing-field',
        segment: 'COMPLETELY_MISSING_FIELD',
        condition: 'required',
        severity: 'error',
      }));
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      const result = engine.validateTransaction(txn.id);
      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(false);
      expect(result.data!.errors.length).toBeGreaterThan(0);
    });

    it('should validate transaction using format condition', () => {
      const partner = registerPartner(engine);
      engine.addValidationRule(makeValidationRuleInput({
        ruleName: 'format-isa-control',
        segment: 'isaControlNumber',
        element: undefined,
        condition: 'format',
        expectedValue: '^\\d{9}$',
        severity: 'error',
      }));
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      const result = engine.validateTransaction(txn.id);
      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(true);
    });

    it('should validate transaction using length condition', () => {
      const partner = registerPartner(engine);
      engine.addValidationRule(makeValidationRuleInput({
        ruleName: 'length-isa-control',
        segment: 'isaControlNumber',
        element: undefined,
        condition: 'length',
        expectedValue: '9',
        severity: 'error',
      }));
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      const result = engine.validateTransaction(txn.id);
      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(true);
    });

    it('should validate transaction using length condition that fails', () => {
      const partner = registerPartner(engine);
      engine.addValidationRule(makeValidationRuleInput({
        ruleName: 'length-isa-wrong',
        segment: 'isaControlNumber',
        element: undefined,
        condition: 'length',
        expectedValue: '5', // ISA control is 9 chars, so 5 should fail
        severity: 'error',
      }));
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      const result = engine.validateTransaction(txn.id);
      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(false);
    });

    it('should validate transaction using enum condition', () => {
      const partner = registerPartner(engine);
      engine.addValidationRule(makeValidationRuleInput({
        ruleName: 'enum-gs-func',
        segment: 'gsFunctionalCode',
        element: undefined,
        condition: 'enum',
        expectedValue: 'PO|SH|OW',
        severity: 'error',
      }));
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      const result = engine.validateTransaction(txn.id);
      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(true);
    });

    it('should validate transaction using enum condition that fails', () => {
      const partner = registerPartner(engine);
      engine.addValidationRule(makeValidationRuleInput({
        ruleName: 'enum-gs-func-fail',
        segment: 'gsFunctionalCode',
        element: undefined,
        condition: 'enum',
        expectedValue: 'SH|OW', // Does not include PO
        severity: 'error',
      }));
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      const result = engine.validateTransaction(txn.id);
      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(false);
    });

    it('should skip inactive rules during validation', () => {
      const partner = registerPartner(engine);
      const ruleResult = engine.addValidationRule(makeValidationRuleInput({
        ruleName: 'inactive-rule',
        segment: 'NONEXISTENT',
        condition: 'required',
        severity: 'error',
      }));
      // Disable the rule
      engine.toggleValidationRule(ruleResult.data!.id);
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      const result = engine.validateTransaction(txn.id);
      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(true);
    });

    it('should fail to validate unparsed transaction', () => {
      const partner = registerPartner(engine);
      const txn = createInboundTransaction(engine, partner);
      const result = engine.validateTransaction(txn.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_PARSED');
    });

    it('should fail to validate unknown transaction', () => {
      const result = engine.validateTransaction(uuid());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should add errors and warnings to transaction on failed validation', () => {
      const partner = registerPartner(engine);
      engine.addValidationRule(makeValidationRuleInput({
        ruleName: 'err-missing-field',
        segment: 'MISSING_ERR',
        condition: 'required',
        severity: 'error',
      }));
      engine.addValidationRule(makeValidationRuleInput({
        ruleName: 'warn-missing-field',
        segment: 'MISSING_WARN',
        condition: 'required',
        severity: 'warning',
      }));
      const txn = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn.id, parseAsType: 'X12_850' });
      engine.validateTransaction(txn.id);
      const updated = engine.getTransaction(txn.id)!;
      expect(updated.errors.length).toBeGreaterThan(0);
      expect(updated.warnings.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 7. Queue Management
  // ==========================================================================

  describe('Queue management', () => {
    it('should enqueue a transaction', () => {
      const partner = registerPartner(engine);
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'queue' },
      });
      const result = engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id));
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('pending');
      expect(result.data!.priority).toBe(5);
      expect(result.data!.attempts).toBe(0);
      expect(result.data!.maxAttempts).toBe(3);
      expect(result.data!.retryDelaySeconds).toBe(60);
    });

    it('should enqueue with custom priority and retry settings', () => {
      const partner = registerPartner(engine);
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'priority' },
      });
      const result = engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id, {
        priority: 1,
        maxAttempts: 5,
        retryDelaySeconds: 120,
      }));
      expect(result.success).toBe(true);
      expect(result.data!.priority).toBe(1);
      expect(result.data!.maxAttempts).toBe(5);
      expect(result.data!.retryDelaySeconds).toBe(120);
    });

    it('should fail to enqueue unknown transaction', () => {
      const partner = registerPartner(engine);
      const result = engine.enqueue(makeEnqueueInput(uuid(), partner.id));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('TRANSACTION_NOT_FOUND');
    });

    it('should fail to enqueue with unknown partner', () => {
      const partner = registerPartner(engine);
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'queue' },
      });
      const result = engine.enqueue(makeEnqueueInput(genResult.data!.id, uuid()));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PARTNER_NOT_FOUND');
    });

    it('should reject duplicate enqueue for same transaction', () => {
      const partner = registerPartner(engine);
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'dup' },
      });
      engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id));
      const result = engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ALREADY_QUEUED');
    });

    it('should get queue item by id', () => {
      const partner = registerPartner(engine);
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'get' },
      });
      const enqResult = engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id));
      const item = engine.getQueueItem(enqResult.data!.id);
      expect(item).toBeDefined();
      expect(item!.id).toBe(enqResult.data!.id);
    });

    it('should return undefined for unknown queue item id', () => {
      expect(engine.getQueueItem(uuid())).toBeUndefined();
    });

    it('should list all queue items', () => {
      const partner = registerPartner(engine);
      for (let i = 0; i < 3; i++) {
        const g = engine.generateOutbound({
          tenantId: TENANT_ID,
          facilityId: FACILITY_ID,
          partnerId: partner.id,
          transactionType: 'X12_945',
          data: { idx: i },
        });
        engine.enqueue(makeEnqueueInput(g.data!.id, partner.id, { priority: 3 - i }));
      }
      const items = engine.listQueue(TENANT_ID);
      expect(items).toHaveLength(3);
      // Should be sorted by priority ascending
      expect(items[0].priority).toBeLessThanOrEqual(items[1].priority);
      expect(items[1].priority).toBeLessThanOrEqual(items[2].priority);
    });

    it('should list queue items by status filter', () => {
      const partner = registerPartner(engine);
      const g1 = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { idx: 1 },
      });
      const g2 = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_944',
        data: { idx: 2 },
      });
      engine.enqueue(makeEnqueueInput(g1.data!.id, partner.id));
      engine.enqueue(makeEnqueueInput(g2.data!.id, partner.id));
      // Process one from queue
      engine.processQueue(TENANT_ID);
      const pendingItems = engine.listQueue(TENANT_ID, { status: 'pending' });
      const sentItems = engine.listQueue(TENANT_ID, { status: 'sent' });
      // One should have been processed (sent or retrying depending on transport config)
      expect(pendingItems.length + sentItems.length).toBeLessThanOrEqual(2);
    });

    it('should list queue items by partnerId filter', () => {
      const p1 = registerPartner(engine);
      const p2 = registerPartner(engine);
      const g1 = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: p1.id,
        transactionType: 'X12_945',
        data: { p: 1 },
      });
      const g2 = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: p2.id,
        transactionType: 'X12_945',
        data: { p: 2 },
      });
      engine.enqueue(makeEnqueueInput(g1.data!.id, p1.id));
      engine.enqueue(makeEnqueueInput(g2.data!.id, p2.id));
      expect(engine.listQueue(undefined, { partnerId: p1.id })).toHaveLength(1);
      expect(engine.listQueue(undefined, { partnerId: p2.id })).toHaveLength(1);
    });

    it('should process queue and send successfully via SFTP partner', () => {
      const partner = registerPartner(engine); // sftp partner with sftpHost and sftpUser
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'process' },
      });
      engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id));
      const result = engine.processQueue(TENANT_ID);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('sent');
      expect(result.data!.sentAt).toBeDefined();
      expect(result.data!.responseCode).toBe(200);
      expect(result.data!.attempts).toBe(1);
    });

    it('should process queue and send successfully via email transport', () => {
      const partner = registerPartner(engine, { transport: 'email' });
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'email' },
      });
      engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id, { transport: 'email' }));
      const result = engine.processQueue(TENANT_ID);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('sent');
    });

    it('should process queue and send successfully via manual transport', () => {
      const partner = registerPartner(engine, { transport: 'manual' });
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'manual' },
      });
      engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id, { transport: 'manual' }));
      const result = engine.processQueue(TENANT_ID);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('sent');
    });

    it('should fail to send via SFTP when host not configured', () => {
      const partner = registerPartner(engine, {
        sftpHost: undefined,
        sftpUser: undefined,
        transport: 'sftp',
      });
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'sftp-fail' },
      });
      engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id, { maxAttempts: 1 }));
      const result = engine.processQueue(TENANT_ID);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('failed');
      expect(result.data!.error).toBeDefined();
    });

    it('should fail to send via AS2 when URL not configured', () => {
      const partner = registerPartner(engine, {
        ediFormat: 'edifact',
        transport: 'as2',
        as2Url: undefined,
        as2Id: undefined,
      });
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'COARRI',
        data: { test: 'as2-fail' },
      });
      engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id, {
        transport: 'as2',
        maxAttempts: 1,
      }));
      const result = engine.processQueue(TENANT_ID);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('failed');
    });

    it('should fail to send via HTTP when endpoint not configured', () => {
      const partner = registerPartner(engine, {
        ediFormat: 'json',
        transport: 'http',
        httpEndpoint: undefined,
      });
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'CUSTOM',
        data: { test: 'http-fail' },
      });
      engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id, {
        transport: 'http',
        maxAttempts: 1,
      }));
      const result = engine.processQueue(TENANT_ID);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('failed');
    });

    it('should set retrying status when send fails and attempts remain', () => {
      const partner = registerPartner(engine, {
        sftpHost: undefined,
        sftpUser: undefined,
      });
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'retry' },
      });
      engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id, { maxAttempts: 3 }));
      const result = engine.processQueue(TENANT_ID);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('retrying');
      expect(result.data!.attempts).toBe(1);
      expect(result.data!.nextRetryAt).toBeDefined();
    });

    it('should update linked transaction to sent on successful queue processing', () => {
      const partner = registerPartner(engine);
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'update-txn' },
      });
      engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id));
      engine.processQueue(TENANT_ID);
      const txn = engine.getTransaction(genResult.data!.id)!;
      expect(txn.status).toBe('sent');
      expect(txn.sentAt).toBeDefined();
    });

    it('should process queue by priority order', () => {
      const partner = registerPartner(engine);
      const low = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { priority: 'low' },
      });
      const high = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_944',
        data: { priority: 'high' },
      });
      engine.enqueue(makeEnqueueInput(low.data!.id, partner.id, { priority: 10 }));
      engine.enqueue(makeEnqueueInput(high.data!.id, partner.id, { priority: 1 }));

      // First processQueue should pick the high-priority item
      const result = engine.processQueue(TENANT_ID);
      expect(result.success).toBe(true);
      expect(result.data!.transactionId).toBe(high.data!.id);
    });

    it('should return error when queue is empty', () => {
      const result = engine.processQueue(TENANT_ID);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('QUEUE_EMPTY');
    });

    it('should retry a failed queue item', () => {
      const partner = registerPartner(engine, {
        sftpHost: undefined,
        sftpUser: undefined,
      });
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'retry-failed' },
      });
      engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id, { maxAttempts: 1 }));
      engine.processQueue(TENANT_ID); // Will fail and set to 'failed'

      const items = engine.listQueue(TENANT_ID, { status: 'failed' });
      expect(items).toHaveLength(1);

      const retryResult = engine.retryFailed(items[0].id);
      expect(retryResult.success).toBe(true);
      expect(retryResult.data!.status).toBe('pending');
      expect(retryResult.data!.attempts).toBe(0);
      expect(retryResult.data!.error).toBeUndefined();
      expect(retryResult.data!.nextRetryAt).toBeUndefined();
    });

    it('should fail to retry non-failed queue item', () => {
      const partner = registerPartner(engine);
      const genResult = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'retry-pending' },
      });
      const enqResult = engine.enqueue(makeEnqueueInput(genResult.data!.id, partner.id));
      const result = engine.retryFailed(enqResult.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to retry unknown queue item', () => {
      const result = engine.retryFailed(uuid());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should return correct queue stats', () => {
      const partner = registerPartner(engine);
      const failPartner = registerPartner(engine, {
        sftpHost: undefined,
        sftpUser: undefined,
      });

      // Create 2 pending items
      const g1 = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { idx: 1 },
      });
      const g2 = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_944',
        data: { idx: 2 },
      });
      engine.enqueue(makeEnqueueInput(g1.data!.id, partner.id));
      engine.enqueue(makeEnqueueInput(g2.data!.id, partner.id));

      // Create 1 that will fail
      const g3 = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: failPartner.id,
        transactionType: 'X12_945',
        data: { idx: 3 },
      });
      engine.enqueue(makeEnqueueInput(g3.data!.id, failPartner.id, { maxAttempts: 1 }));

      // Process all three items in queue (priority order, then creation time)
      engine.processQueue(TENANT_ID); // g1 -> success (sent)
      engine.processQueue(TENANT_ID); // g2 -> success (sent)
      engine.processQueue(TENANT_ID); // g3 -> fail (maxAttempts=1 -> failed)

      const stats = engine.getQueueStats(TENANT_ID);
      expect(stats.sent).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.pending).toBe(0);
      expect(typeof stats.in_progress).toBe('number');
      expect(typeof stats.retrying).toBe('number');
    });

    it('should return zeroed queue stats when no items', () => {
      const stats = engine.getQueueStats('empty-tenant');
      expect(stats.pending).toBe(0);
      expect(stats.in_progress).toBe(0);
      expect(stats.sent).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.retrying).toBe(0);
    });
  });

  // ==========================================================================
  // 8. Field Mappings
  // ==========================================================================

  describe('Field mappings', () => {
    it('should create a field mapping', () => {
      const result = engine.createFieldMapping(makeFieldMappingInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.isActive).toBe(true);
      expect(result.data!.ediSegment).toBe('BEG');
      expect(result.data!.ediElement).toBe('03');
      expect(result.data!.internalField).toBe('purchaseOrderNumber');
      expect(result.data!.internalEntity).toBe('order');
      expect(result.data!.transformType).toBe('direct');
    });

    it('should create a mapping with sub-element and transform config', () => {
      const result = engine.createFieldMapping(makeFieldMappingInput({
        ediSubElement: '01',
        transformType: 'lookup',
        transformConfig: { table: 'codes', keyField: 'ediCode', valueField: 'internalCode' },
      }));
      expect(result.success).toBe(true);
      expect(result.data!.ediSubElement).toBe('01');
      expect(result.data!.transformType).toBe('lookup');
      expect(result.data!.transformConfig).toBeDefined();
    });

    it('should create a partner-specific mapping', () => {
      const partner = registerPartner(engine);
      const result = engine.createFieldMapping(makeFieldMappingInput({
        partnerId: partner.id,
      }));
      expect(result.success).toBe(true);
      expect(result.data!.partnerId).toBe(partner.id);
    });

    it('should get field mapping by id', () => {
      const result = engine.createFieldMapping(makeFieldMappingInput());
      const mapping = engine.getFieldMapping(result.data!.id);
      expect(mapping).toBeDefined();
      expect(mapping!.id).toBe(result.data!.id);
    });

    it('should return undefined for unknown mapping id', () => {
      expect(engine.getFieldMapping(uuid())).toBeUndefined();
    });

    it('should list all field mappings', () => {
      engine.createFieldMapping(makeFieldMappingInput({ ediElement: '01' }));
      engine.createFieldMapping(makeFieldMappingInput({ ediElement: '02' }));
      engine.createFieldMapping(makeFieldMappingInput({ ediElement: '03' }));
      expect(engine.listFieldMappings()).toHaveLength(3);
    });

    it('should list mappings by tenant', () => {
      engine.createFieldMapping(makeFieldMappingInput({ tenantId: 'tenant-A', ediElement: '01' }));
      engine.createFieldMapping(makeFieldMappingInput({ tenantId: 'tenant-A', ediElement: '02' }));
      engine.createFieldMapping(makeFieldMappingInput({ tenantId: 'tenant-B', ediElement: '03' }));
      expect(engine.listFieldMappings('tenant-A')).toHaveLength(2);
      expect(engine.listFieldMappings('tenant-B')).toHaveLength(1);
    });

    it('should list mappings by transactionType filter', () => {
      engine.createFieldMapping(makeFieldMappingInput({ transactionType: 'X12_850', ediElement: '01' }));
      engine.createFieldMapping(makeFieldMappingInput({ transactionType: 'X12_856', ediElement: '02' }));
      expect(engine.listFieldMappings(undefined, { transactionType: 'X12_850' })).toHaveLength(1);
      expect(engine.listFieldMappings(undefined, { transactionType: 'X12_856' })).toHaveLength(1);
    });

    it('should list mappings by direction filter', () => {
      engine.createFieldMapping(makeFieldMappingInput({ direction: 'inbound', ediElement: '01' }));
      engine.createFieldMapping(makeFieldMappingInput({ direction: 'outbound', ediElement: '02' }));
      expect(engine.listFieldMappings(undefined, { direction: 'inbound' })).toHaveLength(1);
      expect(engine.listFieldMappings(undefined, { direction: 'outbound' })).toHaveLength(1);
    });

    it('should list mappings by partnerId filter', () => {
      const partner = registerPartner(engine);
      engine.createFieldMapping(makeFieldMappingInput({ partnerId: partner.id, ediElement: '01' }));
      engine.createFieldMapping(makeFieldMappingInput({ ediElement: '02' }));
      expect(engine.listFieldMappings(undefined, { partnerId: partner.id })).toHaveLength(1);
    });

    it('should toggle field mapping active state', () => {
      const result = engine.createFieldMapping(makeFieldMappingInput());
      expect(result.data!.isActive).toBe(true);

      const toggled1 = engine.toggleFieldMapping(result.data!.id);
      expect(toggled1.success).toBe(true);
      expect(toggled1.data!.isActive).toBe(false);

      const toggled2 = engine.toggleFieldMapping(result.data!.id);
      expect(toggled2.success).toBe(true);
      expect(toggled2.data!.isActive).toBe(true);
    });

    it('should fail to toggle unknown mapping', () => {
      const result = engine.toggleFieldMapping(uuid());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  // ==========================================================================
  // 9. Stats
  // ==========================================================================

  describe('EDI stats', () => {
    it('should return complete stats for a tenant', () => {
      const partner = registerPartner(engine);
      // Create inbound transactions
      const inbound1 = createInboundTransaction(engine, partner, { transactionType: 'X12_850' });
      const inbound2 = createInboundTransaction(engine, partner, { transactionType: 'X12_856' });
      // Parse and process one
      engine.parseInbound({ transactionId: inbound1.id, parseAsType: 'X12_850' });
      engine.processInbound(inbound1.id);
      // Generate outbound transactions
      engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'stats' },
      });

      const stats = engine.getEDIStats(TENANT_ID);
      expect(stats.tenantId).toBe(TENANT_ID);
      expect(stats.totalPartners).toBe(1);
      expect(stats.activePartners).toBe(1);
      expect(stats.totalTransactions).toBe(3); // 2 inbound + 1 outbound
      expect(stats.inboundTransactions).toBe(2);
      expect(stats.outboundTransactions).toBe(1);
      expect(stats.transactionsToday).toBe(3);
      expect(stats.processedTransactions).toBeGreaterThanOrEqual(1);
      expect(stats.errorTransactions).toBe(0);
      expect(stats.errorRatePercent).toBe(0);
      expect(typeof stats.avgProcessingTimeMs).toBe('number');
      expect(typeof stats.queuedItems).toBe('number');
      expect(typeof stats.failedQueueItems).toBe('number');
      expect(stats.transactionsByType['X12_850']).toBe(1);
      expect(stats.transactionsByType['X12_856']).toBe(1);
      expect(stats.transactionsByType['X12_945']).toBe(1);
    });

    it('should return zeroed stats for empty tenant', () => {
      const stats = engine.getEDIStats('empty-tenant');
      expect(stats.totalPartners).toBe(0);
      expect(stats.activePartners).toBe(0);
      expect(stats.totalTransactions).toBe(0);
      expect(stats.inboundTransactions).toBe(0);
      expect(stats.outboundTransactions).toBe(0);
      expect(stats.transactionsToday).toBe(0);
      expect(stats.pendingTransactions).toBe(0);
      expect(stats.processedTransactions).toBe(0);
      expect(stats.errorTransactions).toBe(0);
      expect(stats.errorRatePercent).toBe(0);
      expect(stats.avgProcessingTimeMs).toBe(0);
      expect(stats.queuedItems).toBe(0);
      expect(stats.failedQueueItems).toBe(0);
      expect(Object.keys(stats.transactionsByType)).toHaveLength(0);
    });

    it('should calculate error rate correctly', () => {
      const partner = registerPartner(engine);
      // Create 4 transactions
      createInboundTransaction(engine, partner);
      createInboundTransaction(engine, partner);
      const txn3 = createInboundTransaction(engine, partner);
      createInboundTransaction(engine, partner);
      // Set one to error
      engine.updateTransactionStatus(txn3.id, 'error');

      const stats = engine.getEDIStats(TENANT_ID);
      expect(stats.errorTransactions).toBe(1);
      expect(stats.errorRatePercent).toBe(25); // 1/4 = 25%
    });

    it('should count pending transactions correctly', () => {
      const partner = registerPartner(engine);
      // Create inbound (status: received = pending)
      createInboundTransaction(engine, partner);
      // Parse one (status: parsed = pending)
      const txn2 = createInboundTransaction(engine, partner);
      engine.parseInbound({ transactionId: txn2.id, parseAsType: 'X12_850' });
      // Generate outbound (status: generated = pending)
      engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { test: 'pending' },
      });

      const stats = engine.getEDIStats(TENANT_ID);
      expect(stats.pendingTransactions).toBe(3);
    });

    it('should count active partners vs total partners', () => {
      const p1 = registerPartner(engine);
      registerPartner(engine);
      const p3 = registerPartner(engine);
      engine.updatePartnerStatus(p1.id, 'inactive');
      engine.updatePartnerStatus(p3.id, 'suspended');

      const stats = engine.getEDIStats(TENANT_ID);
      expect(stats.totalPartners).toBe(3);
      expect(stats.activePartners).toBe(1);
    });

    it('should count queue items correctly in stats', () => {
      const partner = registerPartner(engine);
      const failPartner = registerPartner(engine, {
        sftpHost: undefined,
        sftpUser: undefined,
      });

      // Enqueue and process successfully
      const g1 = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_945',
        data: { idx: 1 },
      });
      engine.enqueue(makeEnqueueInput(g1.data!.id, partner.id));

      // Enqueue one that will fail
      const g2 = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: failPartner.id,
        transactionType: 'X12_945',
        data: { idx: 2 },
      });
      engine.enqueue(makeEnqueueInput(g2.data!.id, failPartner.id, { maxAttempts: 1 }));

      // Enqueue a pending one
      const g3 = engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_944',
        data: { idx: 3 },
      });
      engine.enqueue(makeEnqueueInput(g3.data!.id, partner.id));

      // Process first two
      engine.processQueue(TENANT_ID); // success
      engine.processQueue(TENANT_ID); // fail

      const stats = engine.getEDIStats(TENANT_ID);
      expect(stats.queuedItems).toBeGreaterThanOrEqual(1); // at least one pending
      expect(stats.failedQueueItems).toBeGreaterThanOrEqual(1); // at least one failed
    });

    it('should count transactionsByType accurately', () => {
      const partner = registerPartner(engine);
      createInboundTransaction(engine, partner, { transactionType: 'X12_850' });
      createInboundTransaction(engine, partner, { transactionType: 'X12_850' });
      createInboundTransaction(engine, partner, { transactionType: 'X12_856' });
      engine.generateOutbound({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        partnerId: partner.id,
        transactionType: 'X12_997',
        data: { ack: true },
      });

      const stats = engine.getEDIStats(TENANT_ID);
      expect(stats.transactionsByType['X12_850']).toBe(2);
      expect(stats.transactionsByType['X12_856']).toBe(1);
      expect(stats.transactionsByType['X12_997']).toBe(1);
    });
  });
});
