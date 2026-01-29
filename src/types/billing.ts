// Billing types for ankrICD

import type { UUID, AuditFields, TenantEntity, Currency, GSTInfo, BankDetails, Address, ContactInfo } from './common';
import type { ContainerSize, ContainerType } from './container';

// ============================================================================
// CUSTOMERS
// ============================================================================

export type CustomerType =
  | 'importer'
  | 'exporter'
  | 'cha'                      // Customs House Agent
  | 'freight_forwarder'
  | 'shipping_line'
  | 'transporter'
  | 'consignee'
  | 'shipper';

export interface Customer extends AuditFields, TenantEntity {
  id: UUID;
  code: string;
  name: string;
  legalName: string;
  type: CustomerType;
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted';

  // Registration
  iecCode?: string;            // Import Export Code
  gstInfo?: GSTInfo;
  panNumber?: string;
  cinNumber?: string;          // Company Identification Number

  // Contact
  address: Address;
  billingAddress?: Address;
  contacts: ContactInfo[];
  email?: string;
  phone?: string;

  // Banking
  bankDetails?: BankDetails;

  // Credit
  creditLimit: number;
  currentOutstanding: number;
  paymentTerms: number;        // days
  creditStatus: 'good' | 'warning' | 'blocked';

  // Preferences
  preferredCurrency: Currency;
  invoiceEmail?: string;
  invoiceFrequency: 'per_container' | 'daily' | 'weekly' | 'monthly';

  // Rating
  rating?: number;
  totalContainersHandled: number;
  averagePaymentDays?: number;
}

// ============================================================================
// TARIFFS
// ============================================================================

export type ChargeType =
  | 'handling'                 // Lift-on/Lift-off
  | 'storage'                  // Ground storage
  | 'documentation'            // Document processing
  | 'inspection'               // Examination charges
  | 'reefer'                   // Reefer monitoring/power
  | 'hazmat'                   // Hazmat handling
  | 'transportation'           // Internal movement
  | 'crane'                    // Crane usage
  | 'weighbridge'              // Weighing
  | 'scanning'                 // Cargo scanning
  | 'stuffing'                 // CFS stuffing
  | 'destuffing'               // CFS destuffing
  | 'labour'                   // Manual labour
  | 'other';

export type RateType =
  | 'per_container'
  | 'per_teu'
  | 'per_feu'
  | 'per_ton'
  | 'per_cbm'
  | 'per_day'
  | 'per_hour'
  | 'per_move'
  | 'flat'
  | 'percentage';

export interface Tariff extends AuditFields, TenantEntity {
  id: UUID;
  tariffCode: string;
  name: string;
  description?: string;

  // Validity
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;

  // Applicability
  applicableContainerSizes?: ContainerSize[];
  applicableContainerTypes?: ContainerType[];
  applicableCustomerTypes?: CustomerType[];
  applicableCustomerIds?: UUID[];      // Specific customers
  applicableCargoTypes?: string[];

  // Charges
  charges: TariffCharge[];

  // Notes
  termsAndConditions?: string;
}

export interface TariffCharge {
  id: UUID;
  chargeCode: string;
  chargeName: string;
  chargeType: ChargeType;

  // Rate
  rateType: RateType;
  rate: number;
  currency: Currency;

  // Size-specific rates
  rate20?: number;
  rate40?: number;
  rate45?: number;

  // Slabs (for storage)
  slabs?: TariffSlab[];

  // Free period
  freeDays?: number;
  freeHours?: number;

  // Taxes
  taxable: boolean;
  gstRate: number;             // percentage
  hsnCode?: string;
  sacCode?: string;

  // Min/Max
  minimumCharge?: number;
  maximumCharge?: number;

  // Conditions
  conditions?: string;
}

export interface TariffSlab {
  fromDay: number;
  toDay: number | null;        // null = unlimited
  rate: number;
  rate20?: number;
  rate40?: number;
}

// ============================================================================
// INVOICES
// ============================================================================

export type InvoiceType =
  | 'standard'
  | 'proforma'
  | 'credit_note'
  | 'debit_note';

export type InvoiceStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'disputed'
  | 'cancelled'
  | 'written_off';

export interface Invoice extends AuditFields, TenantEntity {
  id: UUID;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;

  // Customer
  customerId: UUID;
  customerCode: string;
  customerName: string;
  customerGstin?: string;
  billingAddress: Address;

  // Dates
  invoiceDate: Date;
  dueDate: Date;
  periodFrom?: Date;
  periodTo?: Date;

  // Line items
  lineItems: InvoiceLineItem[];

  // Totals
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;

  // Taxes (GST)
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;

  roundOff: number;
  totalAmount: number;
  currency: Currency;

  // Outstanding
  paidAmount: number;
  balanceAmount: number;

  // Linked invoices (for credit/debit notes)
  linkedInvoiceId?: UUID;
  linkedInvoiceNumber?: string;

  // References
  referenceNumbers?: string[];
  poNumber?: string;

  // Payment
  paymentTerms: number;
  paymentHistory: Payment[];

  // Notes
  notes?: string;
  internalNotes?: string;

  // PDF
  pdfUrl?: string;

  // Approval
  approvedAt?: Date;
  approvedBy?: string;
}

export interface InvoiceLineItem {
  id: UUID;
  lineNumber: number;

  // Charge details
  chargeCode: string;
  chargeName: string;
  chargeType: ChargeType;
  description?: string;

  // Container reference (if applicable)
  containerId?: UUID;
  containerNumber?: string;
  containerSize?: ContainerSize;

  // Period (for storage charges)
  periodFrom?: Date;
  periodTo?: Date;
  days?: number;

  // Quantity and rate
  quantity: number;
  unit: string;
  rate: number;
  amount: number;

  // Taxes
  hsnCode?: string;
  sacCode?: string;
  taxable: boolean;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;

  lineTotal: number;
}

export interface Payment {
  id: UUID;
  invoiceId: UUID;
  paymentDate: Date;
  amount: number;
  currency: Currency;

  // Method
  paymentMethod: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'online';
  reference?: string;
  chequeNumber?: string;
  bankName?: string;
  utrNumber?: string;

  // Status
  status: 'pending' | 'confirmed' | 'bounced' | 'reversed';

  // Notes
  notes?: string;
  receivedBy?: string;
}

// ============================================================================
// DEMURRAGE & DETENTION
// ============================================================================

export interface DemurrageCalculation {
  containerId: UUID;
  containerNumber: string;
  containerSize: ContainerSize;

  // Dates
  arrivalDate: Date;
  freeTimeStart: Date;
  freeTimeExpiry: Date;
  calculationDate: Date;

  // Free time
  freeDays: number;
  freeTimeUsed: number;
  freeTimeRemaining: number;

  // Chargeable
  totalDays: number;
  chargeableDays: number;
  isOverdue: boolean;

  // Rates
  slabBreakdown: {
    fromDay: number;
    toDay: number;
    days: number;
    rate: number;
    amount: number;
  }[];

  // Totals
  subtotal: number;
  gst: number;
  totalDemurrage: number;
  currency: Currency;

  // Invoice reference
  invoiceId?: UUID;
  invoiceNumber?: string;
  invoiced: boolean;
}

export interface DetentionCalculation {
  containerId: UUID;
  containerNumber: string;
  containerSize: ContainerSize;
  shippingLine: string;

  // Dates
  gateOutDate: Date;
  freeTimeExpiry: Date;
  returnDate?: Date;
  calculationDate: Date;

  // Free time
  freeDays: number;

  // Chargeable
  totalDays: number;
  chargeableDays: number;

  // Amount
  dailyRate: number;
  totalDetention: number;
  currency: Currency;

  // Status
  status: 'accruing' | 'closed' | 'invoiced' | 'paid';
}

// ============================================================================
// STORAGE REPORT
// ============================================================================

export interface StorageReport {
  facilityId: UUID;
  reportDate: Date;
  period: { from: Date; to: Date };

  // Summary
  totalContainers: number;
  totalTEU: number;
  averageOccupancy: number;

  // By customer
  byCustomer: CustomerStorageSummary[];

  // Revenue
  totalStorageRevenue: number;
  totalHandlingRevenue: number;
  totalOtherRevenue: number;
  totalRevenue: number;
  currency: Currency;
}

export interface CustomerStorageSummary {
  customerId: UUID;
  customerCode: string;
  customerName: string;

  containerCount: number;
  teuCount: number;
  averageDwellDays: number;

  storageCharge: number;
  handlingCharge: number;
  otherCharges: number;
  totalCharge: number;

  containers: {
    containerNumber: string;
    arrivalDate: Date;
    dwellDays: number;
    storageCharge: number;
  }[];
}

// ============================================================================
// REVENUE ANALYTICS
// ============================================================================

export interface RevenueAnalytics {
  facilityId: UUID;
  period: { from: Date; to: Date };

  // Overall
  totalRevenue: number;
  revenueGrowth: number;       // percentage vs previous period

  // By charge type
  byChargeType: {
    chargeType: ChargeType;
    amount: number;
    percentage: number;
  }[];

  // By container type
  byContainerType: {
    containerType: ContainerType;
    count: number;
    revenue: number;
  }[];

  // By customer
  topCustomers: {
    customerId: UUID;
    customerName: string;
    revenue: number;
    containers: number;
  }[];

  // By transport mode
  byTransportMode: {
    mode: 'road' | 'rail' | 'vessel';
    containers: number;
    revenue: number;
  }[];

  // Trends
  dailyRevenue: {
    date: Date;
    amount: number;
  }[];
}
