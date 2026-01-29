// Inventory Reconciliation types for ankrICD
// Cycle counting, variance detection, adjustment workflows

import type { UUID, AuditFields, TenantEntity } from './common';

// ============================================================================
// CYCLE COUNT
// ============================================================================

export type CycleCountFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'ad_hoc';
export type CycleCountMethod = 'full' | 'zone_based' | 'random_sample' | 'abc_analysis';
export type CycleCountStatus = 'planned' | 'in_progress' | 'counting' | 'review' | 'approved' | 'completed' | 'cancelled';

export interface CycleCount extends TenantEntity, AuditFields {
  id: UUID;
  countNumber: string;
  frequency: CycleCountFrequency;
  method: CycleCountMethod;
  status: CycleCountStatus;
  isBlindCount: boolean; // counter doesn't see expected values

  // Scheduling
  plannedDate: Date;
  startedAt?: Date;
  completedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;

  // Scope
  zones: string[]; // yard blocks/zones to count
  containerTypes?: string[]; // filter by ISO type
  shippingLines?: string[]; // filter by shipping line
  statusFilter?: string[]; // filter by container status

  // Counters
  assignedCounters: CounterAssignment[];
  supervisorId?: string;
  supervisorName?: string;

  // Results
  expectedContainers: number;
  countedContainers: number;
  matchedContainers: number;
  varianceCount: number;
  accuracyPercent: number;

  // Categories
  missingContainers: number; // in system, not found physically
  foundContainers: number; // found physically, not in system
  misplacedContainers: number; // found in wrong location
  extraContainers: number; // unaccounted containers

  notes?: string;
}

export interface CounterAssignment {
  counterId: string;
  counterName: string;
  assignedZones: string[];
  startedAt?: Date;
  completedAt?: Date;
  containersScanned: number;
}

// ============================================================================
// COUNT ENTRY
// ============================================================================

export type CountEntryStatus = 'scanned' | 'verified' | 'variance_flagged' | 'adjusted';

export interface CountEntry extends AuditFields {
  id: UUID;
  cycleCountId: UUID;
  counterId: string;

  // Container info
  containerNumber: string;
  containerId?: UUID; // null if container not in system
  isoType?: string;
  shippingLine?: string;

  // Location
  expectedLocation?: string; // block-bay-row-tier
  actualLocation: string;
  locationMatch: boolean;

  // Status
  status: CountEntryStatus;
  inSystem: boolean; // container exists in ICD system
  physicallyPresent: boolean;
  isVariance: boolean;
  varianceType?: VarianceType;

  // Scan info
  scannedAt: Date;
  scanMethod: 'manual' | 'rfid' | 'ocr' | 'barcode';
  scanConfidence?: number; // 0-100

  // Photo evidence
  hasPhoto: boolean;
  photoUrl?: string;

  notes?: string;
}

// ============================================================================
// VARIANCE
// ============================================================================

export type VarianceType = 'missing' | 'found' | 'misplaced' | 'extra' | 'status_mismatch' | 'type_mismatch';
export type VarianceResolution = 'adjusted' | 'location_corrected' | 'status_corrected' | 'written_off' | 'customs_notified' | 'shipping_line_notified' | 'under_investigation' | 'dismissed';

export interface Variance extends TenantEntity, AuditFields {
  id: UUID;
  cycleCountId: UUID;
  varianceNumber: string;
  varianceType: VarianceType;

  // Container
  containerNumber: string;
  containerId?: UUID;
  isoType?: string;
  shippingLine?: string;

  // Details
  expectedLocation?: string;
  actualLocation?: string;
  expectedStatus?: string;
  actualStatus?: string;
  description: string;

  // Impact
  isBondedContainer: boolean;
  isCustomsHold: boolean;
  isHighValue: boolean;
  estimatedValue?: number;

  // Resolution
  resolution?: VarianceResolution;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;

  // Notifications
  customsNotified: boolean;
  customsNotifiedAt?: Date;
  shippingLineNotified: boolean;
  shippingLineNotifiedAt?: Date;
  supervisorNotified: boolean;
  supervisorNotifiedAt?: Date;

  // Approval
  requiresApproval: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  approvalNotes?: string;

  // Photo evidence
  hasEvidence: boolean;
  evidenceUrls: string[];
}

// ============================================================================
// ADJUSTMENT
// ============================================================================

export type AdjustmentType = 'location_correction' | 'status_correction' | 'add_to_system' | 'remove_from_system' | 'write_off';
export type AdjustmentStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'applied';

export interface Adjustment extends TenantEntity, AuditFields {
  id: UUID;
  adjustmentNumber: string;
  varianceId: UUID;
  cycleCountId: UUID;
  adjustmentType: AdjustmentType;
  status: AdjustmentStatus;

  // Container
  containerNumber: string;
  containerId?: UUID;

  // Change
  previousValue?: string; // e.g., previous location or status
  newValue: string;
  reason: string;

  // Approval workflow
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Application
  appliedAt?: Date;
  appliedBy?: string;

  notes?: string;
}

// ============================================================================
// STATS
// ============================================================================

export interface ReconciliationStats {
  tenantId: string;

  // Cycle counts
  totalCycleCounts: number;
  completedCycleCounts: number;
  inProgressCycleCounts: number;
  plannedCycleCounts: number;
  countsThisMonth: number;

  // Accuracy
  overallAccuracyPercent: number;
  lastCountAccuracyPercent: number;
  accuracyTrend: 'improving' | 'declining' | 'stable';
  targetAccuracyPercent: number; // typically 99.5%

  // Variances
  totalVariances: number;
  openVariances: number;
  resolvedVariances: number;
  missingContainers: number;
  foundContainers: number;
  misplacedContainers: number;
  variancesThisMonth: number;

  // Adjustments
  totalAdjustments: number;
  pendingAdjustments: number;
  approvedAdjustments: number;
  rejectedAdjustments: number;

  // Bonded
  bondedVariances: number;
  bondedCustomsNotifications: number;

  // Performance
  averageCountDurationHours: number;
  containersCountedThisMonth: number;
  countEfficiencyRate: number; // containers per hour
}
