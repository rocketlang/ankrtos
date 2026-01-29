// Bond & Bonded Warehouse types for ankrICD
// Custom bond management for ICD operations under customs supervision

import type { UUID, AuditFields, TenantEntity, Currency } from './common';

// ============================================================================
// BOND TYPES
// ============================================================================

export type BondType =
  | 'private_bonded'               // Private bonded warehouse (single importer)
  | 'public_bonded'                // Public bonded warehouse (multiple importers)
  | 'special_bonded'               // Special warehouse (IT/EOU/SEZ)
  | 'temporary'                    // Temporary bond (transit/re-export)
  | 'continuity';                  // Continuity bond (ongoing operations)

export type BondStatus =
  | 'active'
  | 'suspended'
  | 'expired'
  | 'cancelled'
  | 'under_renewal';

// ============================================================================
// BOND ENTITY
// ============================================================================

export interface Bond extends AuditFields, TenantEntity {
  id: UUID;
  bondNumber: string;              // e.g., B1/2026/INNSA/0001
  bondType: BondType;
  status: BondStatus;

  // License details
  licenseNumber: string;           // Customs license number
  licenseeId: UUID;                // Customer who holds the license
  licenseeName: string;
  customsStation: string;          // e.g., "INNSA6" (JNPT)
  commissionerateCode: string;

  // Bond amounts (in INR)
  bondAmount: number;              // Total bond value
  utilizedAmount: number;          // Currently utilized (goods under bond)
  availableAmount: number;         // bondAmount - utilizedAmount
  currency: Currency;

  // Surety / Bank Guarantee
  suretyType: 'bank_guarantee' | 'surety_bond' | 'cash_deposit';
  suretyNumber?: string;
  suretyBankName?: string;
  suretyAmount: number;
  suretyExpiryDate?: Date;

  // Validity
  effectiveDate: Date;
  expiryDate: Date;
  renewalDueDate?: Date;           // Typically 30 days before expiry
  lastRenewalDate?: Date;

  // Capacity
  maxContainersTEU: number;        // Max TEU allowed under this bond
  currentContainersTEU: number;    // Currently bonded TEU
  maxDwellDays: number;            // Maximum days goods can stay bonded (typically 90)

  // Statistics
  totalBondIns: number;
  totalBondOuts: number;
  totalExtensions: number;

  // Notes
  conditions?: string;             // Special conditions on the bond
  notes?: string;
}

// ============================================================================
// BONDED CONTAINER
// ============================================================================

export type BondedContainerStatus =
  | 'bonded'                       // Under bond
  | 'bond_extended'                // Extension granted
  | 'ex_bond_pending'              // BOE filed, clearance pending
  | 'released'                     // Released from bond
  | 'auctioned'                    // Goods auctioned (max dwell exceeded)
  | 'transferred';                 // Transferred to another bond

export interface BondedContainer extends AuditFields, TenantEntity {
  id: UUID;
  bondId: UUID;
  containerId: UUID;
  containerNumber: string;

  status: BondedContainerStatus;

  // Bond-in details
  bondInDate: Date;
  bondInBOENumber?: string;        // In-bond Bill of Entry number
  bondInBOEDate?: Date;
  igmNumber?: string;              // Import General Manifest
  igmDate?: Date;
  blNumber?: string;               // Bill of Lading

  // Cargo details
  commodityDescription: string;
  hsCode?: string;                 // Harmonized System code
  cthCode?: string;                // Custom Tariff Heading
  declaredValue: number;
  declaredCurrency: Currency;
  dutyAmount?: number;             // Estimated customs duty
  teu: number;

  // Dwell tracking
  dwellDays: number;               // Days under bond
  maxDwellDays: number;            // From bond config
  dwellExpiryDate: Date;           // bondInDate + maxDwellDays
  isOverdue: boolean;              // dwellDays > maxDwellDays
  extensionCount: number;
  lastExtensionDate?: Date;

  // Bond-out / Release details
  bondOutDate?: Date;
  exBondBOENumber?: string;        // Ex-bond Bill of Entry
  exBondBOEDate?: Date;
  releaseOrderNumber?: string;
  releasedBy?: string;
  releaseNotes?: string;

  // Transfer details (if transferred to another bond)
  transferredToBondId?: UUID;
  transferDate?: Date;
  transferReason?: string;

  // Insurance
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: Date;
  insuredValue?: number;
}

// ============================================================================
// BOND MOVEMENT
// ============================================================================

export type BondMovementType =
  | 'bond_in'                      // Container placed under bond
  | 'bond_out'                     // Container released from bond
  | 'bond_extension'               // Dwell period extended
  | 'bond_transfer'                // Transferred to another bond
  | 'examination'                  // Customs examination under bond
  | 'duty_payment'                 // Duty paid for release
  | 'auction_initiation'           // Auction process started
  | 'insurance_update';            // Insurance updated

export interface BondMovement extends AuditFields, TenantEntity {
  id: UUID;
  bondId: UUID;
  bondedContainerId?: UUID;
  movementType: BondMovementType;
  movementDate: Date;
  movementNumber: string;          // BM-YYYYMMDD-NNNN

  // Financial impact
  amountImpact: number;            // Positive = utilization increase, negative = decrease
  previousUtilized: number;
  newUtilized: number;

  // Reference documents
  referenceNumber?: string;        // BOE, Release Order, etc.
  referenceType?: string;
  customsOfficerId?: string;
  customsApprovalDate?: Date;

  // Notes
  reason?: string;
  notes?: string;
}

// ============================================================================
// BOND STATEMENT (Daily Stock Statement)
// ============================================================================

export interface BondStatement extends AuditFields, TenantEntity {
  id: UUID;
  bondId: UUID;
  statementNumber: string;         // BS-YYYYMMDD-NNNN
  statementDate: Date;
  statementType: 'daily' | 'weekly' | 'monthly' | 'custom';

  // Opening balance
  openingContainers: number;
  openingTEU: number;
  openingValue: number;

  // Movements during period
  bondInsCount: number;
  bondInsTEU: number;
  bondInsValue: number;

  bondOutsCount: number;
  bondOutsTEU: number;
  bondOutsValue: number;

  // Closing balance
  closingContainers: number;
  closingTEU: number;
  closingValue: number;

  // Bond utilization
  bondAmount: number;
  utilizedAmount: number;
  utilizationPercent: number;

  // Alerts
  overdueContainers: number;       // Containers exceeding max dwell
  expiringContainers: number;      // Containers within 7 days of dwell limit
  bondExpiryAlert: boolean;        // Bond itself is expiring soon

  // Approval
  preparedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  submittedToCustoms: boolean;
  submittedAt?: Date;
}

// ============================================================================
// BOND STATS
// ============================================================================

export interface BondStats {
  tenantId: string;
  date: Date;
  totalBonds: number;
  activeBonds: number;
  expiredBonds: number;
  suspendedBonds: number;

  totalBondedContainers: number;
  totalBondedTEU: number;
  totalBondedValue: number;

  overdueContainers: number;
  expiringContainers: number;      // Within 7 days of dwell limit

  totalBondAmount: number;
  totalUtilizedAmount: number;
  overallUtilizationPercent: number;

  bondInsToday: number;
  bondOutsToday: number;
  extensionsToday: number;

  averageDwellDays: number;
}
