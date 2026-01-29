// Compliance types for ankrICD
// E-Way Bill, E-Invoice, GST compliance for India ICD operations

import type { UUID, AuditFields, TenantEntity, Currency, Address } from './common';

// ============================================================================
// E-WAY BILL
// ============================================================================

export type EWayBillStatus =
  | 'generated'
  | 'active'
  | 'extended'
  | 'cancelled'
  | 'expired';

export type EWayBillTransactionType =
  | 'outward'      // Dispatching goods
  | 'inward';      // Receiving goods

export type EWayBillSubType =
  | 'supply'
  | 'export'
  | 'import'
  | 'job_work'
  | 'for_own_use'
  | 'exhibition'
  | 'others';

export interface EWayBill extends AuditFields, TenantEntity {
  id: UUID;
  ewayBillNumber: string;          // 12-digit EWB number from NIC
  ewayBillDate: Date;
  status: EWayBillStatus;

  // Transaction
  transactionType: EWayBillTransactionType;
  subType: EWayBillSubType;
  documentType: 'invoice' | 'bill_of_supply' | 'delivery_challan' | 'credit_note' | 'others';
  documentNumber: string;
  documentDate: Date;

  // From party
  fromGstin: string;
  fromName: string;
  fromAddress: Address;
  fromStateCode: string;
  fromPincode: string;

  // To party
  toGstin: string;
  toName: string;
  toAddress: Address;
  toStateCode: string;
  toPincode: string;

  // Goods
  totalValue: number;              // Total invoice value
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTaxAmount: number;
  currency: Currency;

  // Items
  items: EWayBillItem[];

  // Transport
  transporterId?: string;          // GSTIN of transporter
  transporterName?: string;
  transportMode: 'road' | 'rail' | 'air' | 'ship';
  vehicleNumber?: string;
  vehicleType?: 'regular' | 'over_dimensional';
  distanceKm: number;

  // Validity
  validFrom: Date;
  validUntil: Date;
  extensionCount: number;
  lastExtendedAt?: Date;

  // Reference
  invoiceId?: UUID;
  containerId?: UUID;
  containerNumber?: string;
  blNumber?: string;

  // NIC integration
  nicRequestId?: string;
  nicResponseCode?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancelReason?: string;
}

export interface EWayBillItem {
  productName: string;
  productDescription?: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  taxableValue: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cessRate: number;
}

// ============================================================================
// E-INVOICE
// ============================================================================

export type EInvoiceStatus =
  | 'pending'
  | 'generated'
  | 'cancelled'
  | 'failed';

export interface EInvoice extends AuditFields, TenantEntity {
  id: UUID;
  irn: string;                     // Invoice Reference Number (64-char hash)
  ackNumber: string;               // Acknowledgement number from IRP
  ackDate: Date;
  status: EInvoiceStatus;

  // Invoice reference
  invoiceId: UUID;
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceType: 'regular' | 'credit_note' | 'debit_note';

  // Supplier
  supplierGstin: string;
  supplierName: string;
  supplierAddress: Address;

  // Buyer
  buyerGstin: string;
  buyerName: string;
  buyerAddress: Address;

  // Amounts
  totalValue: number;
  totalTaxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalInvoiceValue: number;
  currency: Currency;

  // Items
  items: EInvoiceItem[];

  // QR Code
  qrCodeData?: string;             // Signed QR code data from IRP
  qrCodeImage?: string;            // Base64 QR code image

  // Signed invoice
  signedInvoiceData?: string;      // Digitally signed JSON from IRP

  // Cancellation
  cancelledAt?: Date;
  cancelledBy?: string;
  cancelReason?: string;

  // GSP integration
  gspProvider?: string;            // e.g., ClearTax, Masters India
  gspRequestId?: string;
  gspResponseCode?: string;
}

export interface EInvoiceItem {
  slNo: number;
  productName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  discount: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  cessRate: number;
  cessAmount: number;
}

// ============================================================================
// GST RETURNS
// ============================================================================

export type GSTReturnType =
  | 'GSTR1'        // Outward supplies
  | 'GSTR2A'       // Auto-populated inward (read-only)
  | 'GSTR3B'       // Monthly summary
  | 'GSTR9'        // Annual return
  | 'GSTR9C';      // Reconciliation statement

export type GSTReturnStatus =
  | 'draft'
  | 'validated'
  | 'filed'
  | 'accepted'
  | 'rejected';

export interface GSTReturn extends AuditFields, TenantEntity {
  id: UUID;
  returnType: GSTReturnType;
  status: GSTReturnStatus;
  gstin: string;
  period: string;                  // MMYYYY format
  financialYear: string;           // e.g., "2025-26"

  // Summary
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalCess: number;
  totalTax: number;

  // GSTR-1 specific
  outwardSupplies?: GSTREntry[];
  b2bInvoices?: number;
  b2cInvoices?: number;
  creditNotes?: number;
  debitNotes?: number;
  exportInvoices?: number;

  // GSTR-3B specific
  outwardTaxable?: number;
  inwardReverseCharge?: number;
  inputTaxCredit?: number;
  netTaxPayable?: number;
  taxPaid?: number;
  interestPaid?: number;
  lateFee?: number;

  // Reconciliation
  matchedInvoices?: number;
  unmatchedInvoices?: number;
  reconciliationDifference?: number;

  // Filing
  filedAt?: Date;
  filedBy?: string;
  filingReference?: string;
  acknowledgementNumber?: string;

  // Notes
  notes?: string;
}

export interface GSTREntry {
  id: UUID;
  returnId: UUID;
  entryType: 'b2b' | 'b2c_large' | 'b2c_small' | 'export' | 'credit_note' | 'debit_note' | 'nil_rated' | 'reverse_charge';
  gstin?: string;                  // Counter-party GSTIN
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceValue: number;
  placeOfSupply: string;           // State code
  reverseCharge: boolean;

  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  cessRate: number;
  cessAmount: number;

  // HSN summary
  hsnCode?: string;
  description?: string;
  quantity?: number;
  unit?: string;
}

// ============================================================================
// COMPLIANCE STATS
// ============================================================================

export interface ComplianceStats {
  tenantId: string;
  date: Date;

  // E-Way Bills
  totalEWayBills: number;
  activeEWayBills: number;
  expiredEWayBills: number;
  cancelledEWayBills: number;
  ewayBillsGeneratedToday: number;

  // E-Invoices
  totalEInvoices: number;
  pendingEInvoices: number;
  generatedEInvoices: number;
  failedEInvoices: number;
  einvoicesGeneratedToday: number;

  // GST Returns
  totalReturns: number;
  draftReturns: number;
  filedReturns: number;
  pendingReturns: number;

  // Compliance scores
  ewayBillCompliancePercent: number;   // % of dispatches with valid e-way bill
  einvoiceCompliancePercent: number;   // % of invoices with e-invoice
  gstFilingCompliancePercent: number;  // % of periods filed on time
}
