// Customs types for ankrICD - ICEGATE Integration

import type { UUID, AuditFields, TenantEntity, Address, Attachment } from './common';

// ============================================================================
// BILL OF ENTRY (IMPORT)
// ============================================================================

export type BOEType =
  | 'home_consumption'         // Direct clearance for use in India
  | 'warehousing'              // Into customs bonded warehouse
  | 'ex_bond'                  // Clearance from bonded warehouse
  | 'ex_bond_part'             // Partial ex-bond clearance
  | 'temporary_import';        // For re-export

export type BOEStatus =
  | 'draft'
  | 'submitted'
  | 'registered'               // IGM linked
  | 'under_assessment'
  | 'assessed'
  | 'duty_pending'
  | 'duty_paid'
  | 'examination_ordered'
  | 'under_examination'
  | 'examination_completed'
  | 'query_raised'
  | 'query_replied'
  | 'out_of_charge'
  | 'cancelled'
  | 'rejected';

export interface BillOfEntry extends AuditFields, TenantEntity {
  id: UUID;
  boeNumber?: string;          // Assigned by customs
  beType: BOEType;
  status: BOEStatus;

  // Reference (before BOE number)
  jobNumber?: string;          // CHA job reference
  referenceNumber?: string;

  // Importer
  importerIEC: string;
  importerName: string;
  importerGstin?: string;
  importerAddress: Address;

  // CHA (Customs House Agent)
  chaLicense?: string;
  chaName?: string;

  // Import details
  countryOfOrigin: string;
  countryOfConsignment: string;
  portOfLoading: string;       // UN/LOCODE
  portOfDischarge: string;     // UN/LOCODE
  portOfRegistration: string;  // Customs port code

  // Transport
  transportMode: 'sea' | 'air' | 'land' | 'rail';
  vesselName?: string;
  voyageNumber?: string;
  flightNumber?: string;
  arrivalDate: Date;

  // Bill of Lading
  blNumber: string;
  blDate: Date;
  blType: 'master' | 'house' | 'direct';
  masterBlNumber?: string;     // If house BL

  // IGM Reference
  igmNumber?: string;
  igmDate?: Date;
  igmLineNumber?: number;

  // Containers
  containers: BOEContainer[];
  totalContainers: number;
  totalPackages: number;
  totalGrossWeight: number;    // kg
  totalNetWeight?: number;     // kg

  // Items
  lineItems: BOELineItem[];
  totalItems: number;

  // Values
  invoiceNumber?: string;
  invoiceDate?: Date;
  invoiceValue: number;
  invoiceCurrency: string;
  exchangeRate: number;
  cifValue: number;            // Cost, Insurance, Freight
  assessableValue: number;
  currency: string;

  // Duties
  basicDuty: number;
  additionalDuty: number;      // CVD
  specialDuty: number;         // SAD
  igst: number;
  cess: number;
  totalDuty: number;
  dutyPaidDate?: Date;

  // Insurance & Freight
  insuranceValue?: number;
  freightValue?: number;
  landingCharges?: number;

  // ICEGATE
  icegateRefNumber?: string;
  icegateStatus?: string;
  submittedAt?: Date;
  registeredAt?: Date;
  assessedAt?: Date;
  outOfChargeAt?: Date;

  // Examination
  examinationOrdered: boolean;
  examinationId?: UUID;

  // Documents
  documents: BOEDocument[];

  // Notes
  remarks?: string;
}

export interface BOEContainer {
  containerId?: UUID;
  containerNumber: string;
  sealNumber?: string;
  grossWeight: number;         // kg
  packages: number;
  marks?: string;
  status: 'pending' | 'examined' | 'cleared';
}

export interface BOELineItem {
  lineNumber: number;
  description: string;
  hsnCode: string;             // 8-digit HS code
  quantity: number;
  unit: string;                // UQC code
  unitPrice: number;
  totalPrice: number;
  currency: string;
  countryOfOrigin: string;

  // Valuation
  assessableValue: number;
  basicDutyRate: number;
  basicDuty: number;
  igstRate: number;
  igst: number;
  cessRate?: number;
  cess?: number;

  // Exemptions
  exemptionNotification?: string;
  exemptionSerialNumber?: string;

  // Trade agreements
  preferentialDutyRate?: number;
  preferentialOriginCert?: string;
}

export interface BOEDocument {
  documentType: BOEDocumentType;
  documentNumber?: string;
  documentDate?: Date;
  issuingAuthority?: string;
  attachment?: Attachment;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export type BOEDocumentType =
  | 'invoice'
  | 'packing_list'
  | 'bill_of_lading'
  | 'airway_bill'
  | 'certificate_of_origin'
  | 'insurance_certificate'
  | 'licence'
  | 'catalogue'
  | 'test_report'
  | 'phytosanitary'
  | 'fssai'
  | 'drug_licence'
  | 'other';

// ============================================================================
// SHIPPING BILL (EXPORT)
// ============================================================================

export type SBType =
  | 'free_shipping_bill'       // No incentives
  | 'drawback'                 // Duty Drawback
  | 'epcg'                     // Export Promotion Capital Goods
  | 'advance_licence'          // Advance Authorization
  | 'dfia'                     // Duty Free Import Authorization
  | 'jobwork';                 // Job work exports

export type SBStatus =
  | 'draft'
  | 'submitted'
  | 'registered'
  | 'under_assessment'
  | 'assessed'
  | 'examination_ordered'
  | 'under_examination'
  | 'examination_completed'
  | 'let_export'               // Permission to export
  | 'eos'                      // Export Order of Shipment
  | 'shipped'
  | 'cancelled'
  | 'rejected';

export interface ShippingBill extends AuditFields, TenantEntity {
  id: UUID;
  sbNumber?: string;           // Assigned by customs
  sbType: SBType;
  status: SBStatus;

  // Reference
  jobNumber?: string;

  // Exporter
  exporterIEC: string;
  exporterName: string;
  exporterGstin?: string;
  exporterAddress: Address;

  // CHA
  chaLicense?: string;
  chaName?: string;

  // Buyer/Consignee
  buyerName: string;
  buyerAddress: Address;
  buyerCountry: string;

  // Export details
  portOfLoading: string;       // Indian port
  portOfDischarge: string;     // Foreign port
  finalDestination: string;
  countryOfDestination: string;

  // Invoice
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceValue: number;
  invoiceCurrency: string;
  exchangeRate: number;
  fobValue: number;            // Free On Board
  currency: string;

  // Transport
  transportMode: 'sea' | 'air' | 'land' | 'rail';
  vesselName?: string;
  voyageNumber?: string;
  rotationNumber?: string;

  // Containers
  containers: SBContainer[];
  totalContainers: number;
  totalPackages: number;
  totalGrossWeight: number;
  totalNetWeight?: number;

  // Items
  lineItems: SBLineItem[];
  totalItems: number;

  // Incentives
  drawbackAmount?: number;
  drawbackClaimed?: boolean;
  meis?: boolean;              // Merchandise Exports from India Scheme
  seis?: boolean;              // Service Exports from India Scheme
  rodtep?: boolean;            // RoDTEP scheme

  // LEO (Let Export Order)
  letExportDate?: Date;
  letExportBy?: string;

  // EGM Reference
  egmNumber?: string;
  egmDate?: Date;
  egmLineNumber?: number;

  // ICEGATE
  icegateRefNumber?: string;
  icegateStatus?: string;
  submittedAt?: Date;
  registeredAt?: Date;
  letExportAt?: Date;

  // Documents
  documents: SBDocument[];

  // Notes
  remarks?: string;
}

export interface SBContainer {
  containerId?: UUID;
  containerNumber: string;
  sealNumber?: string;
  grossWeight: number;
  packages: number;
  stuffedAt?: string;          // Location where stuffed
  status: 'stuffing' | 'sealed' | 'examined' | 'loaded';
}

export interface SBLineItem {
  lineNumber: number;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  currency: string;

  // FOB
  fobValue: number;

  // Drawback
  drawbackSerialNumber?: string;
  drawbackRate?: number;
  drawbackAmount?: number;
  drawbackCap?: number;

  // Other incentives
  rodtepRate?: number;
}

export interface SBDocument {
  documentType: SBDocumentType;
  documentNumber?: string;
  documentDate?: Date;
  attachment?: Attachment;
}

export type SBDocumentType =
  | 'invoice'
  | 'packing_list'
  | 'are1'                     // ARE-1 for excise
  | 'gst_invoice'
  | 'lut'                      // Letter of Undertaking
  | 'ad_code'                  // Bank AD Code
  | 'licence'
  | 'certificate_of_origin'
  | 'phytosanitary'
  | 'fumigation'
  | 'quality_certificate'
  | 'other';

// ============================================================================
// CUSTOMS EXAMINATION
// ============================================================================

export type ExaminationType =
  | 'first_check'              // Initial verification
  | 'second_check'             // Detailed examination
  | 'percentage'               // Random percentage check
  | 'full'                     // 100% examination
  | 'x_ray'                    // X-ray scanning
  | 'destuff'                  // Complete destuffing
  | 're_examination';          // Second examination

export type ExaminationResult =
  | 'passed'                   // No discrepancy
  | 'minor_discrepancy'        // Minor issues, can proceed
  | 'major_discrepancy'        // Major issues, requires action
  | 'seizure'                  // Goods seized
  | 'pending_query';           // Query raised

export interface CustomsExamination extends AuditFields, TenantEntity {
  id: UUID;
  examinationNumber?: string;
  examinationType: ExaminationType;
  result?: ExaminationResult;

  // Reference
  documentType: 'BOE' | 'SB';
  documentId: UUID;
  documentNumber: string;

  // Container being examined
  containerId: UUID;
  containerNumber: string;

  // Schedule
  orderedAt: Date;
  orderedBy: string;           // Officer name/ID
  scheduledDate?: Date;
  scheduledSlot?: string;

  // Execution
  startedAt?: Date;
  completedAt?: Date;
  examOfficer?: string;
  examOfficerDesignation?: string;

  // Location
  examinationLocation?: string;

  // Findings
  findings?: string;
  discrepancies?: ExamDiscrepancy[];

  // Photos
  photos: ExamPhoto[];

  // Sample
  sampleTaken: boolean;
  sampleDetails?: string;
  sampleTestResult?: string;

  // Re-examination
  reExaminationRequired: boolean;
  reExaminationReason?: string;
  reExaminationId?: UUID;

  // Sign-off
  supervisorApproval?: boolean;
  supervisorId?: string;
  supervisorRemarks?: string;
}

export interface ExamDiscrepancy {
  type: 'quantity' | 'description' | 'value' | 'origin' | 'hs_code' | 'weight' | 'other';
  declared: string;
  found: string;
  remarks: string;
  severity: 'minor' | 'major' | 'critical';
}

export interface ExamPhoto {
  id: UUID;
  url: string;
  description?: string;
  capturedAt: Date;
  capturedBy?: string;
}

// ============================================================================
// ICEGATE EDI MESSAGES
// ============================================================================

export type ICEGATEMessageType =
  | 'IGES_BOE'                 // Bill of Entry
  | 'IGES_SB'                  // Shipping Bill
  | 'IGES_IGM'                 // Import General Manifest
  | 'IGES_EGM'                 // Export General Manifest
  | 'IGES_DO'                  // Delivery Order
  | 'IGES_ARRIVAL'             // Arrival Manifest
  | 'IGES_DEPARTURE'           // Departure Manifest
  | 'COPARN'                   // Container Pre-Arrival Notification
  | 'CODECO'                   // Container Gate In/Out
  | 'BAPLIE'                   // Bay Plan
  | 'CUSRES'                   // Customs Response
  | 'CUSREP';                  // Customs Report

export interface ICEGATEMessage extends AuditFields, TenantEntity {
  id: UUID;
  messageType: ICEGATEMessageType;
  direction: 'inbound' | 'outbound';

  // Reference
  referenceNumber: string;
  correlationId?: string;

  // Content
  payload: string;             // EDI or XML content
  parsedData?: Record<string, unknown>;

  // Status
  status: 'pending' | 'sent' | 'acknowledged' | 'error' | 'rejected';
  errorCode?: string;
  errorMessage?: string;

  // Timestamps
  sentAt?: Date;
  acknowledgedAt?: Date;
  processedAt?: Date;

  // Retry
  retryCount: number;
  nextRetryAt?: Date;
}

// ============================================================================
// DUTY PAYMENT
// ============================================================================

export interface DutyChallan extends AuditFields, TenantEntity {
  id: UUID;
  challanNumber?: string;
  documentType: 'BOE' | 'SB';
  documentId: UUID;
  documentNumber: string;

  // Amount
  basicDuty: number;
  additionalDuty: number;
  igst: number;
  cess: number;
  interest?: number;
  penalty?: number;
  totalAmount: number;

  // Payment
  status: 'pending' | 'initiated' | 'completed' | 'failed';
  paymentMode?: 'online' | 'bank' | 'neft' | 'rtgs';
  bankName?: string;
  bankRefNumber?: string;
  icegateRefNumber?: string;

  // Timestamps
  generatedAt: Date;
  paidAt?: Date;
  acknowledgedAt?: Date;
}
