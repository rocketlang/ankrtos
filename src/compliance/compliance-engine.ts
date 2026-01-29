// Compliance Engine for ankrICD
// E-Way Bill, E-Invoice, GST Returns — mandatory India compliance

import { v4 as uuidv4 } from 'uuid';
import type { UUID, OperationResult, Address, Currency } from '../types/common';
import type {
  EWayBill,
  EWayBillStatus,
  EWayBillTransactionType,
  EWayBillSubType,
  EWayBillItem,
  EInvoice,
  EInvoiceStatus,
  EInvoiceItem,
  GSTReturn,
  GSTReturnType,
  GSTReturnStatus,
  GSTREntry,
  ComplianceStats,
} from '../types/compliance';
import { emit } from '../core';

// ============================================================================
// COMPLIANCE ENGINE
// ============================================================================

export class ComplianceEngine {
  private static instance: ComplianceEngine | null = null;

  // E-Way Bills
  private ewayBills: Map<UUID, EWayBill> = new Map();
  private ewayByNumber: Map<string, UUID> = new Map();
  private ewayCounter = 0;

  // E-Invoices
  private einvoices: Map<UUID, EInvoice> = new Map();
  private einvoiceByIRN: Map<string, UUID> = new Map();
  private einvoiceByInvoice: Map<UUID, UUID> = new Map(); // invoiceId → einvoiceId

  // GST Returns
  private gstReturns: Map<UUID, GSTReturn> = new Map();
  private gstrEntries: Map<UUID, GSTREntry> = new Map();
  private entriesByReturn: Map<UUID, Set<UUID>> = new Map();

  private constructor() {}

  static getInstance(): ComplianceEngine {
    if (!ComplianceEngine.instance) {
      ComplianceEngine.instance = new ComplianceEngine();
    }
    return ComplianceEngine.instance;
  }

  static resetInstance(): void {
    ComplianceEngine.instance = null;
  }

  // ============================================================================
  // E-WAY BILL
  // ============================================================================

  generateEWayBill(input: GenerateEWayBillInput): OperationResult<EWayBill> {
    // Validate threshold (₹50,000 for inter-state)
    if (input.totalValue < (input.valueThreshold ?? 50000)) {
      return { success: false, error: 'Value below E-Way Bill threshold', errorCode: 'BELOW_THRESHOLD' };
    }

    const now = new Date();
    this.ewayCounter++;

    // Calculate validity based on distance (1 day per 200km for regular, 1 day per 20km for OD)
    const kmPerDay = input.vehicleType === 'over_dimensional' ? 20 : 200;
    const validityDays = Math.max(1, Math.ceil(input.distanceKm / kmPerDay));
    const validUntil = new Date(now.getTime() + validityDays * 86400000);

    // Generate 12-digit EWB number
    const ewbNumber = `${String(this.ewayCounter).padStart(12, '0')}`;

    const totalTax = (input.cgstAmount ?? 0) + (input.sgstAmount ?? 0) +
      (input.igstAmount ?? 0) + (input.cessAmount ?? 0);

    const ewayBill: EWayBill = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      ewayBillNumber: ewbNumber,
      ewayBillDate: now,
      status: 'generated',

      transactionType: input.transactionType,
      subType: input.subType ?? 'supply',
      documentType: input.documentType ?? 'invoice',
      documentNumber: input.documentNumber,
      documentDate: input.documentDate,

      fromGstin: input.fromGstin,
      fromName: input.fromName,
      fromAddress: input.fromAddress,
      fromStateCode: input.fromStateCode,
      fromPincode: input.fromPincode,

      toGstin: input.toGstin,
      toName: input.toName,
      toAddress: input.toAddress,
      toStateCode: input.toStateCode,
      toPincode: input.toPincode,

      totalValue: input.totalValue,
      cgstAmount: input.cgstAmount ?? 0,
      sgstAmount: input.sgstAmount ?? 0,
      igstAmount: input.igstAmount ?? 0,
      cessAmount: input.cessAmount ?? 0,
      totalTaxAmount: totalTax,
      currency: input.currency ?? 'INR',

      items: input.items ?? [],

      transporterId: input.transporterId,
      transporterName: input.transporterName,
      transportMode: input.transportMode ?? 'road',
      vehicleNumber: input.vehicleNumber,
      vehicleType: input.vehicleType ?? 'regular',
      distanceKm: input.distanceKm,

      validFrom: now,
      validUntil,
      extensionCount: 0,

      invoiceId: input.invoiceId,
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      blNumber: input.blNumber,

      createdAt: now,
      updatedAt: now,
    };

    this.ewayBills.set(ewayBill.id, ewayBill);
    this.ewayByNumber.set(ewbNumber, ewayBill.id);

    emit('compliance.eway_generated', {
      ewayBillId: ewayBill.id,
      ewayBillNumber: ewbNumber,
      documentNumber: input.documentNumber,
    }, { tenantId: input.tenantId });

    return { success: true, data: ewayBill };
  }

  getEWayBill(id: UUID): EWayBill | undefined {
    return this.ewayBills.get(id);
  }

  getEWayBillByNumber(ewbNumber: string): EWayBill | undefined {
    const id = this.ewayByNumber.get(ewbNumber);
    return id ? this.ewayBills.get(id) : undefined;
  }

  listEWayBills(tenantId?: string, status?: EWayBillStatus): EWayBill[] {
    let bills = Array.from(this.ewayBills.values());
    if (tenantId) bills = bills.filter(b => b.tenantId === tenantId);
    if (status) bills = bills.filter(b => b.status === status);
    return bills;
  }

  validateEWayBill(ewayBillId: UUID): OperationResult<{ valid: boolean; reason?: string }> {
    const ewb = this.ewayBills.get(ewayBillId);
    if (!ewb) return { success: false, error: 'E-Way Bill not found', errorCode: 'NOT_FOUND' };

    const now = new Date();
    if (ewb.status === 'cancelled') {
      return { success: true, data: { valid: false, reason: 'E-Way Bill is cancelled' } };
    }
    if (now > ewb.validUntil) {
      ewb.status = 'expired';
      ewb.updatedAt = now;
      return { success: true, data: { valid: false, reason: 'E-Way Bill has expired' } };
    }

    ewb.status = 'active';
    ewb.updatedAt = now;
    return { success: true, data: { valid: true } };
  }

  extendEWayBill(ewayBillId: UUID, newVehicleNumber?: string, _reason?: string): OperationResult<EWayBill> {
    const ewb = this.ewayBills.get(ewayBillId);
    if (!ewb) return { success: false, error: 'E-Way Bill not found', errorCode: 'NOT_FOUND' };

    if (ewb.status === 'cancelled') {
      return { success: false, error: 'Cannot extend cancelled E-Way Bill', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    // Check extension is within 8 hours before or after expiry
    const hoursFromExpiry = (ewb.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursFromExpiry > 8) {
      return { success: false, error: 'Extension only allowed within 8 hours of expiry', errorCode: 'TOO_EARLY' };
    }

    const kmPerDay = ewb.vehicleType === 'over_dimensional' ? 20 : 200;
    const extensionDays = Math.max(1, Math.ceil(ewb.distanceKm / kmPerDay));

    ewb.validUntil = new Date(ewb.validUntil.getTime() + extensionDays * 86400000);
    ewb.extensionCount++;
    ewb.lastExtendedAt = now;
    ewb.status = 'extended';
    if (newVehicleNumber) ewb.vehicleNumber = newVehicleNumber;
    ewb.updatedAt = now;

    emit('compliance.eway_extended', {
      ewayBillId: ewb.id,
      ewayBillNumber: ewb.ewayBillNumber,
      newValidUntil: ewb.validUntil,
    }, { tenantId: ewb.tenantId });

    return { success: true, data: ewb };
  }

  cancelEWayBill(ewayBillId: UUID, reason: string, cancelledBy: string): OperationResult<EWayBill> {
    const ewb = this.ewayBills.get(ewayBillId);
    if (!ewb) return { success: false, error: 'E-Way Bill not found', errorCode: 'NOT_FOUND' };

    if (ewb.status === 'cancelled') {
      return { success: false, error: 'Already cancelled', errorCode: 'ALREADY_CANCELLED' };
    }

    // Check within 24 hours
    const now = new Date();
    const hoursSinceGeneration = (now.getTime() - ewb.ewayBillDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceGeneration > 24) {
      return { success: false, error: 'Cancellation only allowed within 24 hours', errorCode: 'CANCELLATION_WINDOW_EXPIRED' };
    }

    ewb.status = 'cancelled';
    ewb.cancelledAt = now;
    ewb.cancelledBy = cancelledBy;
    ewb.cancelReason = reason;
    ewb.updatedAt = now;

    emit('compliance.eway_cancelled', {
      ewayBillId: ewb.id,
      ewayBillNumber: ewb.ewayBillNumber,
    }, { tenantId: ewb.tenantId });

    return { success: true, data: ewb };
  }

  updatePartB(ewayBillId: UUID, vehicleNumber: string, transportMode?: 'road' | 'rail' | 'air' | 'ship'): OperationResult<EWayBill> {
    const ewb = this.ewayBills.get(ewayBillId);
    if (!ewb) return { success: false, error: 'E-Way Bill not found', errorCode: 'NOT_FOUND' };

    if (ewb.status === 'cancelled' || ewb.status === 'expired') {
      return { success: false, error: 'Cannot update Part-B on inactive E-Way Bill', errorCode: 'INVALID_STATUS' };
    }

    ewb.vehicleNumber = vehicleNumber;
    if (transportMode) ewb.transportMode = transportMode;
    ewb.updatedAt = new Date();

    return { success: true, data: ewb };
  }

  // ============================================================================
  // E-INVOICE
  // ============================================================================

  generateEInvoice(input: GenerateEInvoiceInput): OperationResult<EInvoice> {
    // Check duplicate
    if (this.einvoiceByInvoice.has(input.invoiceId)) {
      return { success: false, error: 'E-Invoice already exists for this invoice', errorCode: 'DUPLICATE' };
    }

    const now = new Date();

    // Generate IRN (64-char SHA-256 hash simulation)
    const irnSeed = `${input.supplierGstin}|${input.invoiceNumber}|${input.financialYear ?? '2025-26'}|${now.getTime()}`;
    const irn = this.generateIRN(irnSeed);

    // Generate ACK number
    const ackNumber = `ACK-${Date.now().toString(36).toUpperCase()}`;

    const totalTax = (input.cgstAmount ?? 0) + (input.sgstAmount ?? 0) +
      (input.igstAmount ?? 0) + (input.cessAmount ?? 0);

    const einvoice: EInvoice = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      irn,
      ackNumber,
      ackDate: now,
      status: 'generated',

      invoiceId: input.invoiceId,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      invoiceType: input.invoiceType ?? 'regular',

      supplierGstin: input.supplierGstin,
      supplierName: input.supplierName,
      supplierAddress: input.supplierAddress,

      buyerGstin: input.buyerGstin,
      buyerName: input.buyerName,
      buyerAddress: input.buyerAddress,

      totalValue: input.totalValue,
      totalTaxableValue: input.totalTaxableValue ?? input.totalValue,
      cgstAmount: input.cgstAmount ?? 0,
      sgstAmount: input.sgstAmount ?? 0,
      igstAmount: input.igstAmount ?? 0,
      cessAmount: input.cessAmount ?? 0,
      totalInvoiceValue: input.totalValue + totalTax,
      currency: input.currency ?? 'INR',

      items: input.items ?? [],

      qrCodeData: `IRN:${irn}|ACK:${ackNumber}|DT:${now.toISOString()}`,
      signedInvoiceData: JSON.stringify({ irn, ackNumber, ackDate: now }),

      gspProvider: input.gspProvider,

      createdAt: now,
      updatedAt: now,
    };

    this.einvoices.set(einvoice.id, einvoice);
    this.einvoiceByIRN.set(irn, einvoice.id);
    this.einvoiceByInvoice.set(input.invoiceId, einvoice.id);

    emit('compliance.einvoice_generated', {
      einvoiceId: einvoice.id,
      irn,
      invoiceNumber: input.invoiceNumber,
    }, { tenantId: input.tenantId });

    return { success: true, data: einvoice };
  }

  getEInvoice(id: UUID): EInvoice | undefined {
    return this.einvoices.get(id);
  }

  getEInvoiceByIRN(irn: string): EInvoice | undefined {
    const id = this.einvoiceByIRN.get(irn);
    return id ? this.einvoices.get(id) : undefined;
  }

  getEInvoiceByInvoiceId(invoiceId: UUID): EInvoice | undefined {
    const id = this.einvoiceByInvoice.get(invoiceId);
    return id ? this.einvoices.get(id) : undefined;
  }

  listEInvoices(tenantId?: string, status?: EInvoiceStatus): EInvoice[] {
    let invoices = Array.from(this.einvoices.values());
    if (tenantId) invoices = invoices.filter(i => i.tenantId === tenantId);
    if (status) invoices = invoices.filter(i => i.status === status);
    return invoices;
  }

  cancelEInvoice(einvoiceId: UUID, reason: string, cancelledBy: string): OperationResult<EInvoice> {
    const ei = this.einvoices.get(einvoiceId);
    if (!ei) return { success: false, error: 'E-Invoice not found', errorCode: 'NOT_FOUND' };

    if (ei.status === 'cancelled') {
      return { success: false, error: 'Already cancelled', errorCode: 'ALREADY_CANCELLED' };
    }

    // Check within 24 hours
    const now = new Date();
    const hoursSince = (now.getTime() - ei.ackDate.getTime()) / (1000 * 60 * 60);
    if (hoursSince > 24) {
      return { success: false, error: 'Cancellation only allowed within 24 hours', errorCode: 'CANCELLATION_WINDOW_EXPIRED' };
    }

    ei.status = 'cancelled';
    ei.cancelledAt = now;
    ei.cancelledBy = cancelledBy;
    ei.cancelReason = reason;
    ei.updatedAt = now;

    // Remove from invoice index so a new e-invoice can be generated
    this.einvoiceByInvoice.delete(ei.invoiceId);

    emit('compliance.einvoice_cancelled', {
      einvoiceId: ei.id,
      irn: ei.irn,
    }, { tenantId: ei.tenantId });

    return { success: true, data: ei };
  }

  // ============================================================================
  // GST RETURNS
  // ============================================================================

  createGSTReturn(input: CreateGSTReturnInput): OperationResult<GSTReturn> {
    const now = new Date();

    const gstReturn: GSTReturn = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      returnType: input.returnType,
      status: 'draft',
      gstin: input.gstin,
      period: input.period,
      financialYear: input.financialYear,

      totalTaxableValue: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalCess: 0,
      totalTax: 0,

      outwardSupplies: [],

      createdAt: now,
      updatedAt: now,
    };

    this.gstReturns.set(gstReturn.id, gstReturn);
    this.entriesByReturn.set(gstReturn.id, new Set());

    return { success: true, data: gstReturn };
  }

  getGSTReturn(id: UUID): GSTReturn | undefined {
    return this.gstReturns.get(id);
  }

  listGSTReturns(tenantId?: string, returnType?: GSTReturnType, status?: GSTReturnStatus): GSTReturn[] {
    let returns = Array.from(this.gstReturns.values());
    if (tenantId) returns = returns.filter(r => r.tenantId === tenantId);
    if (returnType) returns = returns.filter(r => r.returnType === returnType);
    if (status) returns = returns.filter(r => r.status === status);
    return returns;
  }

  addGSTREntry(returnId: UUID, input: AddGSTREntryInput): OperationResult<GSTREntry> {
    const gstReturn = this.gstReturns.get(returnId);
    if (!gstReturn) return { success: false, error: 'GST Return not found', errorCode: 'NOT_FOUND' };

    if (gstReturn.status === 'filed' || gstReturn.status === 'accepted') {
      return { success: false, error: 'Cannot add entries to filed/accepted return', errorCode: 'INVALID_STATUS' };
    }

    const entry: GSTREntry = {
      id: uuidv4(),
      returnId,
      entryType: input.entryType,
      gstin: input.gstin,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      invoiceValue: input.invoiceValue,
      placeOfSupply: input.placeOfSupply,
      reverseCharge: input.reverseCharge ?? false,

      taxableValue: input.taxableValue,
      cgstRate: input.cgstRate ?? 0,
      cgstAmount: input.cgstAmount ?? 0,
      sgstRate: input.sgstRate ?? 0,
      sgstAmount: input.sgstAmount ?? 0,
      igstRate: input.igstRate ?? 0,
      igstAmount: input.igstAmount ?? 0,
      cessRate: input.cessRate ?? 0,
      cessAmount: input.cessAmount ?? 0,

      hsnCode: input.hsnCode,
      description: input.description,
      quantity: input.quantity,
      unit: input.unit,
    };

    this.gstrEntries.set(entry.id, entry);
    this.entriesByReturn.get(returnId)!.add(entry.id);

    // Update return totals
    this.recalculateReturnTotals(returnId);

    return { success: true, data: entry };
  }

  getGSTREntries(returnId: UUID): GSTREntry[] {
    const ids = this.entriesByReturn.get(returnId);
    if (!ids) return [];
    return Array.from(ids).map(id => this.gstrEntries.get(id)!).filter(Boolean);
  }

  validateGSTReturn(returnId: UUID): OperationResult<GSTReturn> {
    const gstReturn = this.gstReturns.get(returnId);
    if (!gstReturn) return { success: false, error: 'GST Return not found', errorCode: 'NOT_FOUND' };

    if (gstReturn.status !== 'draft') {
      return { success: false, error: 'Only draft returns can be validated', errorCode: 'INVALID_STATUS' };
    }

    const entries = this.getGSTREntries(returnId);
    if (entries.length === 0) {
      return { success: false, error: 'Cannot validate empty return', errorCode: 'EMPTY_RETURN' };
    }

    gstReturn.status = 'validated';
    gstReturn.updatedAt = new Date();

    // Count entry types
    gstReturn.b2bInvoices = entries.filter(e => e.entryType === 'b2b').length;
    gstReturn.b2cInvoices = entries.filter(e => e.entryType === 'b2c_large' || e.entryType === 'b2c_small').length;
    gstReturn.creditNotes = entries.filter(e => e.entryType === 'credit_note').length;
    gstReturn.debitNotes = entries.filter(e => e.entryType === 'debit_note').length;
    gstReturn.exportInvoices = entries.filter(e => e.entryType === 'export').length;

    return { success: true, data: gstReturn };
  }

  fileGSTReturn(returnId: UUID, filedBy: string): OperationResult<GSTReturn> {
    const gstReturn = this.gstReturns.get(returnId);
    if (!gstReturn) return { success: false, error: 'GST Return not found', errorCode: 'NOT_FOUND' };

    if (gstReturn.status !== 'validated') {
      return { success: false, error: 'Only validated returns can be filed', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    gstReturn.status = 'filed';
    gstReturn.filedAt = now;
    gstReturn.filedBy = filedBy;
    gstReturn.filingReference = `GST-${gstReturn.returnType}-${gstReturn.period}-${Date.now().toString(36).toUpperCase()}`;
    gstReturn.acknowledgementNumber = `ACK-${Date.now().toString(36).toUpperCase()}`;
    gstReturn.updatedAt = now;

    emit('compliance.gst_return_filed', {
      returnId: gstReturn.id,
      returnType: gstReturn.returnType,
      period: gstReturn.period,
    }, { tenantId: gstReturn.tenantId });

    return { success: true, data: gstReturn };
  }

  // ============================================================================
  // COMPLIANCE STATS
  // ============================================================================

  getComplianceStats(tenantId: string): ComplianceStats {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const ewayBills = Array.from(this.ewayBills.values()).filter(e => e.tenantId === tenantId);
    const einvoices = Array.from(this.einvoices.values()).filter(e => e.tenantId === tenantId);
    const returns = Array.from(this.gstReturns.values()).filter(r => r.tenantId === tenantId);

    const activeEway = ewayBills.filter(e => e.status === 'generated' || e.status === 'active' || e.status === 'extended');
    const generatedEInv = einvoices.filter(e => e.status === 'generated');
    const filedReturns = returns.filter(r => r.status === 'filed' || r.status === 'accepted');

    return {
      tenantId,
      date: now,

      totalEWayBills: ewayBills.length,
      activeEWayBills: activeEway.length,
      expiredEWayBills: ewayBills.filter(e => e.status === 'expired').length,
      cancelledEWayBills: ewayBills.filter(e => e.status === 'cancelled').length,
      ewayBillsGeneratedToday: ewayBills.filter(e => e.ewayBillDate >= todayStart).length,

      totalEInvoices: einvoices.length,
      pendingEInvoices: einvoices.filter(e => e.status === 'pending').length,
      generatedEInvoices: generatedEInv.length,
      failedEInvoices: einvoices.filter(e => e.status === 'failed').length,
      einvoicesGeneratedToday: einvoices.filter(e => e.ackDate >= todayStart).length,

      totalReturns: returns.length,
      draftReturns: returns.filter(r => r.status === 'draft').length,
      filedReturns: filedReturns.length,
      pendingReturns: returns.filter(r => r.status === 'validated').length,

      ewayBillCompliancePercent: ewayBills.length > 0
        ? (activeEway.length / ewayBills.length) * 100 : 100,
      einvoiceCompliancePercent: einvoices.length > 0
        ? (generatedEInv.length / einvoices.length) * 100 : 100,
      gstFilingCompliancePercent: returns.length > 0
        ? (filedReturns.length / returns.length) * 100 : 100,
    };
  }

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================

  private generateIRN(seed: string): string {
    // Simple hash simulation (real IRN is SHA-256)
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex}${uuidv4().replace(/-/g, '')}${hex}`.slice(0, 64);
  }

  private recalculateReturnTotals(returnId: UUID): void {
    const gstReturn = this.gstReturns.get(returnId);
    if (!gstReturn) return;

    const entries = this.getGSTREntries(returnId);

    gstReturn.totalTaxableValue = entries.reduce((s, e) => s + e.taxableValue, 0);
    gstReturn.totalCGST = entries.reduce((s, e) => s + e.cgstAmount, 0);
    gstReturn.totalSGST = entries.reduce((s, e) => s + e.sgstAmount, 0);
    gstReturn.totalIGST = entries.reduce((s, e) => s + e.igstAmount, 0);
    gstReturn.totalCess = entries.reduce((s, e) => s + e.cessAmount, 0);
    gstReturn.totalTax = gstReturn.totalCGST + gstReturn.totalSGST + gstReturn.totalIGST + gstReturn.totalCess;
    gstReturn.updatedAt = new Date();
  }
}

// ============================================================================
// SINGLETON ACCESSORS
// ============================================================================

let _complianceEngine: ComplianceEngine | null = null;

export function getComplianceEngine(): ComplianceEngine {
  if (!_complianceEngine) {
    _complianceEngine = ComplianceEngine.getInstance();
  }
  return _complianceEngine;
}

export function setComplianceEngine(engine: ComplianceEngine): void {
  _complianceEngine = engine;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface GenerateEWayBillInput {
  tenantId: string;
  facilityId: string;
  transactionType: EWayBillTransactionType;
  subType?: EWayBillSubType;
  documentType?: 'invoice' | 'bill_of_supply' | 'delivery_challan' | 'credit_note' | 'others';
  documentNumber: string;
  documentDate: Date;

  fromGstin: string;
  fromName: string;
  fromAddress: Address;
  fromStateCode: string;
  fromPincode: string;

  toGstin: string;
  toName: string;
  toAddress: Address;
  toStateCode: string;
  toPincode: string;

  totalValue: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  cessAmount?: number;
  currency?: Currency;

  items?: EWayBillItem[];

  transporterId?: string;
  transporterName?: string;
  transportMode?: 'road' | 'rail' | 'air' | 'ship';
  vehicleNumber?: string;
  vehicleType?: 'regular' | 'over_dimensional';
  distanceKm: number;

  invoiceId?: UUID;
  containerId?: UUID;
  containerNumber?: string;
  blNumber?: string;

  valueThreshold?: number;         // Override default ₹50,000 threshold
}

export interface GenerateEInvoiceInput {
  tenantId: string;
  facilityId: string;
  invoiceId: UUID;
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceType?: 'regular' | 'credit_note' | 'debit_note';
  financialYear?: string;

  supplierGstin: string;
  supplierName: string;
  supplierAddress: Address;

  buyerGstin: string;
  buyerName: string;
  buyerAddress: Address;

  totalValue: number;
  totalTaxableValue?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  cessAmount?: number;
  currency?: Currency;

  items?: EInvoiceItem[];
  gspProvider?: string;
}

export interface CreateGSTReturnInput {
  tenantId: string;
  facilityId: string;
  returnType: GSTReturnType;
  gstin: string;
  period: string;                  // MMYYYY
  financialYear: string;           // e.g., "2025-26"
}

export interface AddGSTREntryInput {
  entryType: 'b2b' | 'b2c_large' | 'b2c_small' | 'export' | 'credit_note' | 'debit_note' | 'nil_rated' | 'reverse_charge';
  gstin?: string;
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceValue: number;
  placeOfSupply: string;
  reverseCharge?: boolean;
  taxableValue: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  cessRate?: number;
  cessAmount?: number;
  hsnCode?: string;
  description?: string;
  quantity?: number;
  unit?: string;
}
