/**
 * Compliance Engine Tests
 *
 * Covers E-Way Bill, E-Invoice, GST Returns, and Compliance Stats.
 * 36+ tests across singleton, generation, lifecycle, and stats.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ComplianceEngine } from '../compliance/compliance-engine';
import type {
  GenerateEWayBillInput,
  GenerateEInvoiceInput,
  CreateGSTReturnInput,
  AddGSTREntryInput,
} from '../compliance/compliance-engine';
import { TENANT_ID, FACILITY_ID, uuid } from './test-utils';
import type { Address } from '../types/common';

// ============================================================================
// Address Fixtures
// ============================================================================

const FROM_ADDRESS: Address = {
  line1: '123 Industrial Area',
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'IN',
  postalCode: '400001',
};

const TO_ADDRESS: Address = {
  line1: '456 Trade Center',
  city: 'Delhi',
  state: 'Delhi',
  country: 'IN',
  postalCode: '110001',
};

const SUPPLIER_ADDRESS: Address = {
  line1: '789 Manufacturing Hub',
  city: 'Pune',
  state: 'Maharashtra',
  country: 'IN',
  postalCode: '411001',
};

const BUYER_ADDRESS: Address = {
  line1: '101 Commercial Complex',
  city: 'Bangalore',
  state: 'Karnataka',
  country: 'IN',
  postalCode: '560001',
};

// ============================================================================
// Factory: E-Way Bill Input
// ============================================================================

function makeEWayBillInput(overrides: Record<string, unknown> = {}): GenerateEWayBillInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    transactionType: 'outward' as const,
    subType: 'supply' as const,
    documentType: 'invoice' as const,
    documentNumber: `INV-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    documentDate: new Date(),

    fromGstin: '27AABCT1234D1ZC',
    fromName: 'Test Supplier Pvt Ltd',
    fromAddress: FROM_ADDRESS,
    fromStateCode: '27',
    fromPincode: '400001',

    toGstin: '07AABCT5678E1ZD',
    toName: 'Test Buyer Pvt Ltd',
    toAddress: TO_ADDRESS,
    toStateCode: '07',
    toPincode: '110001',

    totalValue: 150000,
    cgstAmount: 13500,
    sgstAmount: 13500,
    igstAmount: 0,
    cessAmount: 0,

    transporterId: '27AAGCT9876F1ZC',
    transporterName: 'Fast Freight Movers',
    transportMode: 'road' as const,
    vehicleNumber: 'MH04AB1234',
    vehicleType: 'regular' as const,
    distanceKm: 1400,

    ...overrides,
  } as GenerateEWayBillInput;
}

// ============================================================================
// Factory: E-Invoice Input
// ============================================================================

function makeEInvoiceInput(overrides: Record<string, unknown> = {}): GenerateEInvoiceInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    invoiceId: uuid(),
    invoiceNumber: `EINV-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    invoiceDate: new Date(),
    invoiceType: 'regular' as const,
    financialYear: '2025-26',

    supplierGstin: '27AABCT1234D1ZC',
    supplierName: 'Test Supplier Pvt Ltd',
    supplierAddress: SUPPLIER_ADDRESS,

    buyerGstin: '29AABCT5678E1ZD',
    buyerName: 'Test Buyer Pvt Ltd',
    buyerAddress: BUYER_ADDRESS,

    totalValue: 100000,
    totalTaxableValue: 100000,
    cgstAmount: 9000,
    sgstAmount: 9000,
    igstAmount: 0,
    cessAmount: 0,

    items: [],
    gspProvider: 'ClearTax',

    ...overrides,
  } as GenerateEInvoiceInput;
}

// ============================================================================
// Factory: GST Return Input
// ============================================================================

function makeGSTReturnInput(overrides: Record<string, unknown> = {}): CreateGSTReturnInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    returnType: 'GSTR1' as const,
    gstin: '27AABCT1234D1ZC',
    period: '012026',
    financialYear: '2025-26',
    ...overrides,
  } as CreateGSTReturnInput;
}

// ============================================================================
// Factory: GSTR Entry Input
// ============================================================================

function makeGSTREntryInput(overrides: Record<string, unknown> = {}): AddGSTREntryInput {
  return {
    entryType: 'b2b' as const,
    gstin: '29AABCT5678E1ZD',
    invoiceNumber: `GSTRINV-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    invoiceDate: new Date(),
    invoiceValue: 50000,
    placeOfSupply: '29',
    reverseCharge: false,
    taxableValue: 42373,
    cgstRate: 9,
    cgstAmount: 3814,
    sgstRate: 9,
    sgstAmount: 3814,
    igstRate: 0,
    igstAmount: 0,
    cessRate: 0,
    cessAmount: 0,
    hsnCode: '8471',
    description: 'Computer Parts',
    quantity: 100,
    unit: 'PCS',
    ...overrides,
  } as AddGSTREntryInput;
}

// ============================================================================
// TESTS
// ============================================================================

describe('ComplianceEngine', () => {
  let engine: ComplianceEngine;

  beforeEach(() => {
    ComplianceEngine.resetInstance();
    engine = ComplianceEngine.getInstance();
  });

  // ==========================================================================
  // SINGLETON
  // ==========================================================================

  describe('Singleton', () => {
    it('should return the same instance on subsequent calls', () => {
      const a = ComplianceEngine.getInstance();
      const b = ComplianceEngine.getInstance();
      expect(a).toBe(b);
    });

    it('should return a fresh instance after resetInstance', () => {
      const a = ComplianceEngine.getInstance();
      ComplianceEngine.resetInstance();
      const b = ComplianceEngine.getInstance();
      expect(a).not.toBe(b);
    });
  });

  // ==========================================================================
  // E-WAY BILL GENERATION
  // ==========================================================================

  describe('E-Way Bill Generation', () => {
    it('should generate an E-Way Bill with valid data', () => {
      const result = engine.generateEWayBill(makeEWayBillInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('generated');
      expect(result.data!.ewayBillNumber).toHaveLength(12);
      expect(result.data!.totalValue).toBe(150000);
      expect(result.data!.totalTaxAmount).toBe(27000); // 13500 + 13500
      expect(result.data!.extensionCount).toBe(0);
      expect(result.data!.transportMode).toBe('road');
    });

    it('should reject value below threshold', () => {
      const result = engine.generateEWayBill(makeEWayBillInput({ totalValue: 30000 }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('BELOW_THRESHOLD');
    });

    it('should respect custom valueThreshold override', () => {
      // Value of 30000 is below default 50000 but above custom 20000
      const result = engine.generateEWayBill(
        makeEWayBillInput({ totalValue: 30000, valueThreshold: 20000 }),
      );
      expect(result.success).toBe(true);
      expect(result.data!.totalValue).toBe(30000);
    });

    it('should retrieve E-Way Bill by ID', () => {
      const reg = engine.generateEWayBill(makeEWayBillInput());
      const ewb = engine.getEWayBill(reg.data!.id);
      expect(ewb).toBeDefined();
      expect(ewb!.fromName).toBe('Test Supplier Pvt Ltd');
    });

    it('should retrieve E-Way Bill by EWB number', () => {
      const reg = engine.generateEWayBill(makeEWayBillInput());
      const ewb = engine.getEWayBillByNumber(reg.data!.ewayBillNumber);
      expect(ewb).toBeDefined();
      expect(ewb!.id).toBe(reg.data!.id);
    });

    it('should list E-Way Bills by tenant', () => {
      engine.generateEWayBill(makeEWayBillInput());
      engine.generateEWayBill(makeEWayBillInput());
      engine.generateEWayBill(makeEWayBillInput({ tenantId: 'other-tenant' }));

      const bills = engine.listEWayBills(TENANT_ID);
      expect(bills).toHaveLength(2);
    });

    it('should list E-Way Bills by status', () => {
      const r1 = engine.generateEWayBill(makeEWayBillInput());
      engine.generateEWayBill(makeEWayBillInput());
      // Cancel the first to change its status
      engine.cancelEWayBill(r1.data!.id, 'Wrong address', 'admin');

      const generated = engine.listEWayBills(TENANT_ID, 'generated');
      expect(generated).toHaveLength(1);

      const cancelled = engine.listEWayBills(TENANT_ID, 'cancelled');
      expect(cancelled).toHaveLength(1);
    });

    it('should validate an active E-Way Bill', () => {
      const reg = engine.generateEWayBill(makeEWayBillInput());
      const result = engine.validateEWayBill(reg.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.valid).toBe(true);
      // After validation, status should be set to 'active'
      const ewb = engine.getEWayBill(reg.data!.id);
      expect(ewb!.status).toBe('active');
    });

    it('should mark expired E-Way Bill as invalid on validation', () => {
      const reg = engine.generateEWayBill(makeEWayBillInput({ distanceKm: 100 }));
      const ewb = engine.getEWayBill(reg.data!.id)!;
      // Force expiry by backdating validUntil
      ewb.validUntil = new Date(Date.now() - 1000);

      const result = engine.validateEWayBill(reg.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.valid).toBe(false);
      expect(result.data!.reason).toContain('expired');
      expect(engine.getEWayBill(reg.data!.id)!.status).toBe('expired');
    });
  });

  // ==========================================================================
  // E-WAY BILL LIFECYCLE
  // ==========================================================================

  describe('E-Way Bill Lifecycle', () => {
    it('should extend an E-Way Bill near expiry', () => {
      const reg = engine.generateEWayBill(makeEWayBillInput({ distanceKm: 100 }));
      const ewb = engine.getEWayBill(reg.data!.id)!;
      // Move validUntil to within 8 hours from now
      ewb.validUntil = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now

      const result = engine.extendEWayBill(ewb.id, 'MH12CD5678', 'Breakdown');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('extended');
      expect(result.data!.extensionCount).toBe(1);
      expect(result.data!.vehicleNumber).toBe('MH12CD5678');
      expect(result.data!.lastExtendedAt).toBeDefined();
    });

    it('should reject extension if too early (>8 hours to expiry)', () => {
      const reg = engine.generateEWayBill(makeEWayBillInput({ distanceKm: 1400 }));
      // Default validity for 1400 km = ceil(1400/200) = 7 days, way more than 8 hours
      const result = engine.extendEWayBill(reg.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('TOO_EARLY');
    });

    it('should cancel E-Way Bill within 24 hours', () => {
      const reg = engine.generateEWayBill(makeEWayBillInput());
      const result = engine.cancelEWayBill(reg.data!.id, 'Incorrect details', 'admin');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('cancelled');
      expect(result.data!.cancelReason).toBe('Incorrect details');
      expect(result.data!.cancelledBy).toBe('admin');
      expect(result.data!.cancelledAt).toBeDefined();
    });

    it('should reject cancellation after 24 hours', () => {
      const reg = engine.generateEWayBill(makeEWayBillInput());
      const ewb = engine.getEWayBill(reg.data!.id)!;
      // Backdate the bill generation to 25 hours ago
      ewb.ewayBillDate = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const result = engine.cancelEWayBill(ewb.id, 'Too late', 'admin');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CANCELLATION_WINDOW_EXPIRED');
    });

    it('should update Part-B (vehicle number and transport mode)', () => {
      const reg = engine.generateEWayBill(makeEWayBillInput());
      const result = engine.updatePartB(reg.data!.id, 'KA01EF9012', 'rail');
      expect(result.success).toBe(true);
      expect(result.data!.vehicleNumber).toBe('KA01EF9012');
      expect(result.data!.transportMode).toBe('rail');
    });

    it('should reject Part-B update on cancelled E-Way Bill', () => {
      const reg = engine.generateEWayBill(makeEWayBillInput());
      engine.cancelEWayBill(reg.data!.id, 'Test cancel', 'admin');

      const result = engine.updatePartB(reg.data!.id, 'KA01EF9012');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // E-INVOICE
  // ==========================================================================

  describe('E-Invoice', () => {
    it('should generate an E-Invoice', () => {
      const result = engine.generateEInvoice(makeEInvoiceInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('generated');
      expect(result.data!.irn.length).toBeGreaterThanOrEqual(48);
      expect(result.data!.ackNumber).toMatch(/^ACK-/);
      expect(result.data!.totalValue).toBe(100000);
      expect(result.data!.totalInvoiceValue).toBe(118000); // 100000 + 9000 + 9000
      expect(result.data!.qrCodeData).toContain('IRN:');
      expect(result.data!.signedInvoiceData).toBeDefined();
    });

    it('should reject duplicate E-Invoice for same invoiceId', () => {
      const invoiceId = uuid();
      engine.generateEInvoice(makeEInvoiceInput({ invoiceId }));
      const result = engine.generateEInvoice(makeEInvoiceInput({ invoiceId }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE');
    });

    it('should retrieve E-Invoice by ID', () => {
      const reg = engine.generateEInvoice(makeEInvoiceInput());
      const ei = engine.getEInvoice(reg.data!.id);
      expect(ei).toBeDefined();
      expect(ei!.supplierName).toBe('Test Supplier Pvt Ltd');
    });

    it('should retrieve E-Invoice by IRN', () => {
      const reg = engine.generateEInvoice(makeEInvoiceInput());
      const ei = engine.getEInvoiceByIRN(reg.data!.irn);
      expect(ei).toBeDefined();
      expect(ei!.id).toBe(reg.data!.id);
    });

    it('should retrieve E-Invoice by invoiceId', () => {
      const invoiceId = uuid();
      const reg = engine.generateEInvoice(makeEInvoiceInput({ invoiceId }));
      const ei = engine.getEInvoiceByInvoiceId(invoiceId);
      expect(ei).toBeDefined();
      expect(ei!.id).toBe(reg.data!.id);
    });

    it('should list E-Invoices by tenant and status', () => {
      engine.generateEInvoice(makeEInvoiceInput());
      engine.generateEInvoice(makeEInvoiceInput());
      engine.generateEInvoice(makeEInvoiceInput({ tenantId: 'other-tenant' }));

      const all = engine.listEInvoices(TENANT_ID);
      expect(all).toHaveLength(2);

      const generated = engine.listEInvoices(TENANT_ID, 'generated');
      expect(generated).toHaveLength(2);

      const pending = engine.listEInvoices(TENANT_ID, 'pending');
      expect(pending).toHaveLength(0);
    });

    it('should cancel E-Invoice within 24 hours', () => {
      const reg = engine.generateEInvoice(makeEInvoiceInput());
      const result = engine.cancelEInvoice(reg.data!.id, 'Wrong buyer', 'admin');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('cancelled');
      expect(result.data!.cancelReason).toBe('Wrong buyer');
      expect(result.data!.cancelledBy).toBe('admin');
      expect(result.data!.cancelledAt).toBeDefined();

      // After cancellation, same invoiceId should be allowed for a new e-invoice
      const newResult = engine.generateEInvoice(
        makeEInvoiceInput({ invoiceId: reg.data!.invoiceId }),
      );
      expect(newResult.success).toBe(true);
    });

    it('should reject E-Invoice cancellation after 24 hours', () => {
      const reg = engine.generateEInvoice(makeEInvoiceInput());
      const ei = engine.getEInvoice(reg.data!.id)!;
      // Backdate ackDate to 25 hours ago
      ei.ackDate = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const result = engine.cancelEInvoice(ei.id, 'Too late', 'admin');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CANCELLATION_WINDOW_EXPIRED');
    });
  });

  // ==========================================================================
  // GST RETURNS
  // ==========================================================================

  describe('GST Returns', () => {
    it('should create a GST Return in draft status', () => {
      const result = engine.createGSTReturn(makeGSTReturnInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('draft');
      expect(result.data!.returnType).toBe('GSTR1');
      expect(result.data!.period).toBe('012026');
      expect(result.data!.financialYear).toBe('2025-26');
      expect(result.data!.totalTaxableValue).toBe(0);
      expect(result.data!.totalTax).toBe(0);
    });

    it('should retrieve GST Return by ID', () => {
      const reg = engine.createGSTReturn(makeGSTReturnInput());
      const ret = engine.getGSTReturn(reg.data!.id);
      expect(ret).toBeDefined();
      expect(ret!.gstin).toBe('27AABCT1234D1ZC');
    });

    it('should list GST Returns by type', () => {
      engine.createGSTReturn(makeGSTReturnInput({ returnType: 'GSTR1' }));
      engine.createGSTReturn(makeGSTReturnInput({ returnType: 'GSTR3B' }));
      engine.createGSTReturn(makeGSTReturnInput({ returnType: 'GSTR1' }));

      const gstr1 = engine.listGSTReturns(TENANT_ID, 'GSTR1');
      expect(gstr1).toHaveLength(2);

      const gstr3b = engine.listGSTReturns(TENANT_ID, 'GSTR3B');
      expect(gstr3b).toHaveLength(1);
    });

    it('should list GST Returns by status', () => {
      const r1 = engine.createGSTReturn(makeGSTReturnInput());
      engine.createGSTReturn(makeGSTReturnInput({ period: '022026' }));

      // Add entry and validate the first return so its status changes
      engine.addGSTREntry(r1.data!.id, makeGSTREntryInput());
      engine.validateGSTReturn(r1.data!.id);

      const drafts = engine.listGSTReturns(TENANT_ID, undefined, 'draft');
      expect(drafts).toHaveLength(1);

      const validated = engine.listGSTReturns(TENANT_ID, undefined, 'validated');
      expect(validated).toHaveLength(1);
    });

    it('should add a GSTR entry and update totals', () => {
      const reg = engine.createGSTReturn(makeGSTReturnInput());
      const result = engine.addGSTREntry(reg.data!.id, makeGSTREntryInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.entryType).toBe('b2b');
      expect(result.data!.taxableValue).toBe(42373);
      expect(result.data!.returnId).toBe(reg.data!.id);
    });

    it('should recalculate return totals after adding entries', () => {
      const reg = engine.createGSTReturn(makeGSTReturnInput());
      engine.addGSTREntry(reg.data!.id, makeGSTREntryInput({
        taxableValue: 10000,
        cgstAmount: 900,
        sgstAmount: 900,
        igstAmount: 0,
        cessAmount: 0,
      }));
      engine.addGSTREntry(reg.data!.id, makeGSTREntryInput({
        taxableValue: 20000,
        cgstAmount: 1800,
        sgstAmount: 1800,
        igstAmount: 0,
        cessAmount: 200,
      }));

      const ret = engine.getGSTReturn(reg.data!.id)!;
      expect(ret.totalTaxableValue).toBe(30000);
      expect(ret.totalCGST).toBe(2700);
      expect(ret.totalSGST).toBe(2700);
      expect(ret.totalIGST).toBe(0);
      expect(ret.totalCess).toBe(200);
      expect(ret.totalTax).toBe(5600); // 2700 + 2700 + 0 + 200
    });

    it('should get GSTR entries for a return', () => {
      const reg = engine.createGSTReturn(makeGSTReturnInput());
      engine.addGSTREntry(reg.data!.id, makeGSTREntryInput());
      engine.addGSTREntry(reg.data!.id, makeGSTREntryInput({ entryType: 'b2c_large' }));
      engine.addGSTREntry(reg.data!.id, makeGSTREntryInput({ entryType: 'export' }));

      const entries = engine.getGSTREntries(reg.data!.id);
      expect(entries).toHaveLength(3);
    });

    it('should validate a GST Return with entries', () => {
      const reg = engine.createGSTReturn(makeGSTReturnInput());
      engine.addGSTREntry(reg.data!.id, makeGSTREntryInput({ entryType: 'b2b' }));
      engine.addGSTREntry(reg.data!.id, makeGSTREntryInput({ entryType: 'b2c_large' }));
      engine.addGSTREntry(reg.data!.id, makeGSTREntryInput({ entryType: 'credit_note' }));

      const result = engine.validateGSTReturn(reg.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('validated');
      expect(result.data!.b2bInvoices).toBe(1);
      expect(result.data!.b2cInvoices).toBe(1);
      expect(result.data!.creditNotes).toBe(1);
      expect(result.data!.debitNotes).toBe(0);
      expect(result.data!.exportInvoices).toBe(0);
    });

    it('should reject validation of empty return', () => {
      const reg = engine.createGSTReturn(makeGSTReturnInput());
      const result = engine.validateGSTReturn(reg.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('EMPTY_RETURN');
    });

    it('should file a validated return', () => {
      const reg = engine.createGSTReturn(makeGSTReturnInput());
      engine.addGSTREntry(reg.data!.id, makeGSTREntryInput());
      engine.validateGSTReturn(reg.data!.id);

      const result = engine.fileGSTReturn(reg.data!.id, 'ca-user@firm.in');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('filed');
      expect(result.data!.filedBy).toBe('ca-user@firm.in');
      expect(result.data!.filedAt).toBeDefined();
      expect(result.data!.filingReference).toMatch(/^GST-GSTR1-012026-/);
      expect(result.data!.acknowledgementNumber).toMatch(/^ACK-/);
    });

    it('should reject filing a non-validated return', () => {
      const reg = engine.createGSTReturn(makeGSTReturnInput());
      const result = engine.fileGSTReturn(reg.data!.id, 'ca-user@firm.in');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // COMPLIANCE STATS
  // ==========================================================================

  describe('Compliance Stats', () => {
    it('should return full compliance stats', () => {
      // E-Way Bills: 2 generated, 1 cancelled
      const eway1 = engine.generateEWayBill(makeEWayBillInput());
      engine.generateEWayBill(makeEWayBillInput());
      engine.cancelEWayBill(eway1.data!.id, 'Test', 'admin');

      // E-Invoices: 2 generated
      engine.generateEInvoice(makeEInvoiceInput());
      engine.generateEInvoice(makeEInvoiceInput());

      // GST Returns: 1 draft, 1 filed
      const ret1 = engine.createGSTReturn(makeGSTReturnInput());
      engine.createGSTReturn(makeGSTReturnInput({ period: '022026' }));
      engine.addGSTREntry(ret1.data!.id, makeGSTREntryInput());
      engine.validateGSTReturn(ret1.data!.id);
      engine.fileGSTReturn(ret1.data!.id, 'admin');

      const stats = engine.getComplianceStats(TENANT_ID);

      // E-Way Bills
      expect(stats.totalEWayBills).toBe(2);
      expect(stats.cancelledEWayBills).toBe(1);
      // Only the second one is 'generated' (active)
      expect(stats.activeEWayBills).toBe(1);

      // E-Invoices
      expect(stats.totalEInvoices).toBe(2);
      expect(stats.generatedEInvoices).toBe(2);

      // GST Returns
      expect(stats.totalReturns).toBe(2);
      expect(stats.draftReturns).toBe(1);
      expect(stats.filedReturns).toBe(1);
    });

    it('should return 100% compliance for empty tenant', () => {
      const stats = engine.getComplianceStats('empty-tenant');
      expect(stats.totalEWayBills).toBe(0);
      expect(stats.totalEInvoices).toBe(0);
      expect(stats.totalReturns).toBe(0);
      expect(stats.ewayBillCompliancePercent).toBe(100);
      expect(stats.einvoiceCompliancePercent).toBe(100);
      expect(stats.gstFilingCompliancePercent).toBe(100);
    });

    it('should correctly compute counts by status', () => {
      // Generate 3 e-way bills, cancel 1, validate 1 (making it active), leave 1 generated
      const e1 = engine.generateEWayBill(makeEWayBillInput());
      const e2 = engine.generateEWayBill(makeEWayBillInput());
      engine.generateEWayBill(makeEWayBillInput());

      engine.cancelEWayBill(e1.data!.id, 'Bad data', 'admin');
      engine.validateEWayBill(e2.data!.id); // becomes 'active'

      const stats = engine.getComplianceStats(TENANT_ID);
      expect(stats.totalEWayBills).toBe(3);
      expect(stats.cancelledEWayBills).toBe(1);
      // activeEWayBills counts 'generated', 'active', and 'extended'
      // e2 is 'active', e3 is 'generated' = 2 active
      expect(stats.activeEWayBills).toBe(2);
      // Compliance: 2 active out of 3 total
      expect(stats.ewayBillCompliancePercent).toBeCloseTo(66.67, 1);
    });
  });
});
