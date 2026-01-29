// Inventory Reconciliation Engine for ankrICD
// Cycle counting, variance detection, and adjustment workflows for ICD operations

import { v4 as uuidv4 } from 'uuid';
import type { UUID, OperationResult } from '../types/common';
import type {
  CycleCount,
  CycleCountStatus,
  CycleCountFrequency,
  CycleCountMethod,
  CounterAssignment,
  CountEntry,
  CountEntryStatus,
  Variance,
  VarianceType,
  VarianceResolution,
  Adjustment,
  AdjustmentType,
  AdjustmentStatus,
  ReconciliationStats,
} from '../types/reconciliation';
import { emit } from '../core';

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface PlanCycleCountInput {
  tenantId: string;
  facilityId: string;
  frequency: CycleCountFrequency;
  method: CycleCountMethod;
  isBlindCount?: boolean;
  plannedDate: Date;
  zones: string[];
  containerTypes?: string[];
  shippingLines?: string[];
  statusFilter?: string[];
  supervisorId?: string;
  supervisorName?: string;
  expectedContainers: number;
  notes?: string;
}

export interface RecordCountEntryInput {
  cycleCountId: UUID;
  counterId: string;
  containerNumber: string;
  containerId?: UUID;
  isoType?: string;
  shippingLine?: string;
  expectedLocation?: string;
  actualLocation: string;
  inSystem: boolean;
  physicallyPresent: boolean;
  scanMethod: 'manual' | 'rfid' | 'ocr' | 'barcode';
  scanConfidence?: number;
  hasPhoto?: boolean;
  photoUrl?: string;
  notes?: string;
}

export interface CreateAdjustmentInput {
  tenantId: string;
  facilityId: string;
  varianceId: UUID;
  cycleCountId: UUID;
  adjustmentType: AdjustmentType;
  containerNumber: string;
  containerId?: UUID;
  previousValue?: string;
  newValue: string;
  reason: string;
  requestedBy: string;
  notes?: string;
}

// ============================================================================
// RECONCILIATION ENGINE
// ============================================================================

export class ReconciliationEngine {
  private static instance: ReconciliationEngine | null = null;

  // Primary storage
  private cycleCounts: Map<UUID, CycleCount> = new Map();
  private countEntries: Map<UUID, CountEntry> = new Map();
  private variances: Map<UUID, Variance> = new Map();
  private adjustments: Map<UUID, Adjustment> = new Map();

  // Indexes
  private countByNumber: Map<string, UUID> = new Map();
  private entriesByCycleCount: Map<UUID, UUID[]> = new Map();
  private varianceByNumber: Map<string, UUID> = new Map();
  private variancesByCycleCount: Map<UUID, UUID[]> = new Map();
  private adjustmentByNumber: Map<string, UUID> = new Map();
  private adjustmentsByCycleCount: Map<UUID, UUID[]> = new Map();

  // Sequential counters
  private cycleCountCounter = 0;
  private varianceCounter = 0;
  private adjustmentCounter = 0;

  private constructor() {}

  static getInstance(): ReconciliationEngine {
    if (!ReconciliationEngine.instance) {
      ReconciliationEngine.instance = new ReconciliationEngine();
    }
    return ReconciliationEngine.instance;
  }

  static resetInstance(): void {
    ReconciliationEngine.instance = null;
  }

  // ============================================================================
  // CYCLE COUNT MANAGEMENT
  // ============================================================================

  /**
   * Plan a new cycle count with auto-generated count number (CC-YYYYMMDD-NNN)
   */
  planCycleCount(input: PlanCycleCountInput): OperationResult<CycleCount> {
    if (!input.zones || input.zones.length === 0) {
      return { success: false, error: 'At least one zone must be specified', errorCode: 'NO_ZONES' };
    }

    if (input.expectedContainers <= 0) {
      return { success: false, error: 'Expected containers must be greater than zero', errorCode: 'INVALID_EXPECTED' };
    }

    const now = new Date();
    this.cycleCountCounter++;
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const countNumber = `CC-${dateStr}-${String(this.cycleCountCounter).padStart(3, '0')}`;

    const cycleCount: CycleCount = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      countNumber,
      frequency: input.frequency,
      method: input.method,
      status: 'planned',
      isBlindCount: input.isBlindCount ?? false,

      plannedDate: input.plannedDate,
      assignedCounters: [],

      zones: input.zones,
      containerTypes: input.containerTypes,
      shippingLines: input.shippingLines,
      statusFilter: input.statusFilter,

      supervisorId: input.supervisorId,
      supervisorName: input.supervisorName,

      expectedContainers: input.expectedContainers,
      countedContainers: 0,
      matchedContainers: 0,
      varianceCount: 0,
      accuracyPercent: 0,

      missingContainers: 0,
      foundContainers: 0,
      misplacedContainers: 0,
      extraContainers: 0,

      notes: input.notes,

      createdAt: now,
      updatedAt: now,
    };

    this.cycleCounts.set(cycleCount.id, cycleCount);
    this.countByNumber.set(countNumber, cycleCount.id);
    this.entriesByCycleCount.set(cycleCount.id, []);
    this.variancesByCycleCount.set(cycleCount.id, []);
    this.adjustmentsByCycleCount.set(cycleCount.id, []);

    emit('reconciliation.count_planned', {
      cycleCountId: cycleCount.id,
      countNumber: cycleCount.countNumber,
      plannedDate: cycleCount.plannedDate,
      zones: cycleCount.zones,
    }, { tenantId: cycleCount.tenantId });

    return { success: true, data: cycleCount };
  }

  /**
   * Get a cycle count by ID
   */
  getCycleCount(id: UUID): CycleCount | undefined {
    return this.cycleCounts.get(id);
  }

  /**
   * Get a cycle count by its count number
   */
  getCycleCountByNumber(num: string): CycleCount | undefined {
    const id = this.countByNumber.get(num);
    return id ? this.cycleCounts.get(id) : undefined;
  }

  /**
   * List cycle counts for a tenant, optionally filtered by status
   */
  listCycleCounts(tenantId: string, status?: CycleCountStatus): CycleCount[] {
    let counts = Array.from(this.cycleCounts.values()).filter(c => c.tenantId === tenantId);
    if (status) counts = counts.filter(c => c.status === status);
    return counts;
  }

  /**
   * Start a cycle count — transition to in_progress and record startedAt
   */
  startCycleCount(id: UUID): OperationResult<CycleCount> {
    const cc = this.cycleCounts.get(id);
    if (!cc) return { success: false, error: 'Cycle count not found', errorCode: 'NOT_FOUND' };

    if (cc.status !== 'planned') {
      return { success: false, error: 'Cycle count must be in planned status to start', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    cc.status = 'in_progress';
    cc.startedAt = now;
    cc.updatedAt = now;

    emit('reconciliation.count_started', {
      cycleCountId: cc.id,
      countNumber: cc.countNumber,
      startedAt: now,
    }, { tenantId: cc.tenantId });

    return { success: true, data: cc };
  }

  /**
   * Assign counters (personnel) to the cycle count
   */
  assignCounters(id: UUID, counters: CounterAssignment[]): OperationResult<CycleCount> {
    const cc = this.cycleCounts.get(id);
    if (!cc) return { success: false, error: 'Cycle count not found', errorCode: 'NOT_FOUND' };

    if (cc.status === 'completed' || cc.status === 'cancelled' || cc.status === 'approved') {
      return { success: false, error: 'Cannot assign counters to a completed, approved, or cancelled count', errorCode: 'INVALID_STATUS' };
    }

    cc.assignedCounters = counters;
    cc.updatedAt = new Date();

    return { success: true, data: cc };
  }

  /**
   * Cancel a cycle count with a reason
   */
  cancelCycleCount(id: UUID, reason: string): OperationResult<CycleCount> {
    const cc = this.cycleCounts.get(id);
    if (!cc) return { success: false, error: 'Cycle count not found', errorCode: 'NOT_FOUND' };

    if (cc.status === 'completed' || cc.status === 'approved' || cc.status === 'cancelled') {
      return { success: false, error: 'Cannot cancel a completed, approved, or already cancelled count', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    cc.status = 'cancelled';
    cc.notes = reason;
    cc.updatedAt = now;

    return { success: true, data: cc };
  }

  // ============================================================================
  // COUNT ENTRIES
  // ============================================================================

  /**
   * Record a count entry during a cycle count.
   * Validates that the cycle count is in counting or in_progress status.
   * Automatically detects variance (location mismatch, not in system, not found).
   */
  recordCountEntry(input: RecordCountEntryInput): OperationResult<CountEntry> {
    const cc = this.cycleCounts.get(input.cycleCountId);
    if (!cc) return { success: false, error: 'Cycle count not found', errorCode: 'CYCLE_COUNT_NOT_FOUND' };

    if (cc.status !== 'in_progress' && cc.status !== 'counting') {
      return {
        success: false,
        error: 'Cycle count must be in in_progress or counting status to record entries',
        errorCode: 'INVALID_STATUS',
      };
    }

    // If first entry and status is in_progress, transition to counting
    if (cc.status === 'in_progress') {
      cc.status = 'counting';
    }

    const now = new Date();

    // Detect variance conditions
    const locationMatch = input.expectedLocation
      ? input.expectedLocation === input.actualLocation
      : true;

    let isVariance = false;
    let varianceType: VarianceType | undefined;

    if (!input.inSystem && input.physicallyPresent) {
      // Container found physically but not in the system
      isVariance = true;
      varianceType = 'found';
    } else if (input.inSystem && !input.physicallyPresent) {
      // Container in system but not found physically
      isVariance = true;
      varianceType = 'missing';
    } else if (input.inSystem && input.physicallyPresent && !locationMatch) {
      // Container in system and found but at wrong location
      isVariance = true;
      varianceType = 'misplaced';
    }

    const entry: CountEntry = {
      id: uuidv4(),
      cycleCountId: input.cycleCountId,
      counterId: input.counterId,

      containerNumber: input.containerNumber,
      containerId: input.containerId,
      isoType: input.isoType,
      shippingLine: input.shippingLine,

      expectedLocation: input.expectedLocation,
      actualLocation: input.actualLocation,
      locationMatch,

      status: isVariance ? 'variance_flagged' : 'scanned',
      inSystem: input.inSystem,
      physicallyPresent: input.physicallyPresent,
      isVariance,
      varianceType,

      scannedAt: now,
      scanMethod: input.scanMethod,
      scanConfidence: input.scanConfidence,

      hasPhoto: input.hasPhoto ?? false,
      photoUrl: input.photoUrl,

      notes: input.notes,

      createdAt: now,
      updatedAt: now,
    };

    this.countEntries.set(entry.id, entry);
    if (!this.entriesByCycleCount.has(input.cycleCountId)) {
      this.entriesByCycleCount.set(input.cycleCountId, []);
    }
    this.entriesByCycleCount.get(input.cycleCountId)!.push(entry.id);

    // Update cycle count tallies
    cc.countedContainers++;
    if (!isVariance) {
      cc.matchedContainers++;
    } else {
      cc.varianceCount++;
    }
    cc.updatedAt = now;

    emit('reconciliation.entry_recorded', {
      cycleCountId: cc.id,
      entryId: entry.id,
      containerNumber: entry.containerNumber,
      isVariance: entry.isVariance,
      varianceType: entry.varianceType,
    }, { tenantId: cc.tenantId });

    return { success: true, data: entry };
  }

  /**
   * Get a single count entry by ID
   */
  getCountEntry(id: UUID): CountEntry | undefined {
    return this.countEntries.get(id);
  }

  /**
   * Get all entries for a given cycle count
   */
  getEntriesByCycleCount(cycleCountId: UUID): CountEntry[] {
    const ids = this.entriesByCycleCount.get(cycleCountId);
    if (!ids) return [];
    return ids.map(id => this.countEntries.get(id)!).filter(Boolean);
  }

  /**
   * Get only variance entries for a given cycle count
   */
  getVarianceEntries(cycleCountId: UUID): CountEntry[] {
    return this.getEntriesByCycleCount(cycleCountId).filter(e => e.isVariance);
  }

  /**
   * Update the status of a count entry
   */
  updateEntryStatus(id: UUID, status: CountEntryStatus): OperationResult<CountEntry> {
    const entry = this.countEntries.get(id);
    if (!entry) return { success: false, error: 'Count entry not found', errorCode: 'NOT_FOUND' };

    entry.status = status;
    entry.updatedAt = new Date();

    return { success: true, data: entry };
  }

  // ============================================================================
  // VARIANCE MANAGEMENT
  // ============================================================================

  /**
   * Analyze count entries and generate Variance records.
   * Auto-creates Variance for missing, found, and misplaced containers.
   * Auto-classifies variance type and flags bonded/customs-hold containers.
   */
  generateVariances(cycleCountId: UUID): OperationResult<Variance[]> {
    const cc = this.cycleCounts.get(cycleCountId);
    if (!cc) return { success: false, error: 'Cycle count not found', errorCode: 'NOT_FOUND' };

    const entries = this.getVarianceEntries(cycleCountId);
    if (entries.length === 0) {
      return { success: true, data: [], warnings: ['No variance entries found for this cycle count'] };
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const generatedVariances: Variance[] = [];

    // Reset cycle count category tallies before recalculating
    cc.missingContainers = 0;
    cc.foundContainers = 0;
    cc.misplacedContainers = 0;
    cc.extraContainers = 0;

    for (const entry of entries) {
      this.varianceCounter++;
      const varianceNumber = `VAR-${dateStr}-${String(this.varianceCounter).padStart(4, '0')}`;

      const vType = entry.varianceType ?? 'missing';

      // Build a human-readable description
      let description: string;
      switch (vType) {
        case 'missing':
          description = `Container ${entry.containerNumber} expected at ${entry.expectedLocation ?? 'N/A'} but not found physically`;
          cc.missingContainers++;
          break;
        case 'found':
          description = `Container ${entry.containerNumber} found at ${entry.actualLocation} but not in system`;
          cc.foundContainers++;
          break;
        case 'misplaced':
          description = `Container ${entry.containerNumber} expected at ${entry.expectedLocation ?? 'N/A'} but found at ${entry.actualLocation}`;
          cc.misplacedContainers++;
          break;
        case 'extra':
          description = `Container ${entry.containerNumber} found at ${entry.actualLocation} — unaccounted`;
          cc.extraContainers++;
          break;
        default:
          description = `Variance detected for container ${entry.containerNumber}`;
          break;
      }

      // Flag bonded and customs-hold containers (these keywords in shipping line or notes)
      const isBondedContainer = (entry.notes?.toLowerCase().includes('bonded') || entry.shippingLine?.toLowerCase().includes('bonded')) ?? false;
      const isCustomsHold = (entry.notes?.toLowerCase().includes('customs') || entry.notes?.toLowerCase().includes('hold')) ?? false;

      const variance: Variance = {
        id: uuidv4(),
        tenantId: cc.tenantId,
        facilityId: cc.facilityId,
        cycleCountId,
        varianceNumber,
        varianceType: vType,

        containerNumber: entry.containerNumber,
        containerId: entry.containerId,
        isoType: entry.isoType,
        shippingLine: entry.shippingLine,

        expectedLocation: entry.expectedLocation,
        actualLocation: entry.actualLocation,
        description,

        isBondedContainer,
        isCustomsHold,
        isHighValue: false,

        customsNotified: false,
        shippingLineNotified: false,
        supervisorNotified: false,

        requiresApproval: isBondedContainer || isCustomsHold,
        hasEvidence: entry.hasPhoto,
        evidenceUrls: entry.photoUrl ? [entry.photoUrl] : [],

        createdAt: now,
        updatedAt: now,
      };

      this.variances.set(variance.id, variance);
      this.varianceByNumber.set(varianceNumber, variance.id);
      if (!this.variancesByCycleCount.has(cycleCountId)) {
        this.variancesByCycleCount.set(cycleCountId, []);
      }
      this.variancesByCycleCount.get(cycleCountId)!.push(variance.id);

      generatedVariances.push(variance);

      emit('reconciliation.variance_detected', {
        cycleCountId,
        varianceId: variance.id,
        varianceNumber: variance.varianceNumber,
        varianceType: variance.varianceType,
        containerNumber: variance.containerNumber,
        isBondedContainer: variance.isBondedContainer,
        isCustomsHold: variance.isCustomsHold,
      }, { tenantId: cc.tenantId });
    }

    cc.varianceCount = generatedVariances.length;
    cc.updatedAt = now;

    return { success: true, data: generatedVariances };
  }

  /**
   * Get a single variance by ID
   */
  getVariance(id: UUID): Variance | undefined {
    return this.variances.get(id);
  }

  /**
   * Get a variance by its variance number
   */
  getVarianceByNumber(num: string): Variance | undefined {
    const id = this.varianceByNumber.get(num);
    return id ? this.variances.get(id) : undefined;
  }

  /**
   * List variances for a tenant with optional filters
   */
  listVariances(tenantId: string, cycleCountId?: UUID, type?: VarianceType, resolved?: boolean): Variance[] {
    let results = Array.from(this.variances.values()).filter(v => v.tenantId === tenantId);
    if (cycleCountId) results = results.filter(v => v.cycleCountId === cycleCountId);
    if (type) results = results.filter(v => v.varianceType === type);
    if (resolved !== undefined) {
      if (resolved) {
        results = results.filter(v => v.resolution !== undefined);
      } else {
        results = results.filter(v => v.resolution === undefined);
      }
    }
    return results;
  }

  /**
   * Resolve a variance with a resolution type, by whom, and optional notes
   */
  resolveVariance(id: UUID, resolution: VarianceResolution, by: string, notes?: string): OperationResult<Variance> {
    const variance = this.variances.get(id);
    if (!variance) return { success: false, error: 'Variance not found', errorCode: 'NOT_FOUND' };

    if (variance.resolution) {
      return { success: false, error: 'Variance is already resolved', errorCode: 'ALREADY_RESOLVED' };
    }

    const now = new Date();
    variance.resolution = resolution;
    variance.resolvedBy = by;
    variance.resolvedAt = now;
    variance.resolutionNotes = notes;
    variance.updatedAt = now;

    emit('reconciliation.variance_resolved', {
      varianceId: variance.id,
      varianceNumber: variance.varianceNumber,
      resolution,
      resolvedBy: by,
    }, { tenantId: variance.tenantId });

    return { success: true, data: variance };
  }

  /**
   * Mark that customs has been notified about a variance
   */
  notifyCustoms(varianceId: UUID): OperationResult<Variance> {
    const variance = this.variances.get(varianceId);
    if (!variance) return { success: false, error: 'Variance not found', errorCode: 'NOT_FOUND' };

    if (variance.customsNotified) {
      return { success: false, error: 'Customs already notified for this variance', errorCode: 'ALREADY_NOTIFIED' };
    }

    const now = new Date();
    variance.customsNotified = true;
    variance.customsNotifiedAt = now;
    variance.updatedAt = now;

    emit('reconciliation.customs_notified', {
      varianceId: variance.id,
      varianceNumber: variance.varianceNumber,
      containerNumber: variance.containerNumber,
      varianceType: variance.varianceType,
    }, { tenantId: variance.tenantId });

    return { success: true, data: variance };
  }

  /**
   * Mark that the shipping line has been notified about a variance
   */
  notifyShippingLine(varianceId: UUID): OperationResult<Variance> {
    const variance = this.variances.get(varianceId);
    if (!variance) return { success: false, error: 'Variance not found', errorCode: 'NOT_FOUND' };

    if (variance.shippingLineNotified) {
      return { success: false, error: 'Shipping line already notified for this variance', errorCode: 'ALREADY_NOTIFIED' };
    }

    const now = new Date();
    variance.shippingLineNotified = true;
    variance.shippingLineNotifiedAt = now;
    variance.updatedAt = now;

    return { success: true, data: variance };
  }

  // ============================================================================
  // ADJUSTMENTS
  // ============================================================================

  /**
   * Create a new adjustment with auto-generated adjustment number
   */
  createAdjustment(input: CreateAdjustmentInput): OperationResult<Adjustment> {
    const variance = this.variances.get(input.varianceId);
    if (!variance) return { success: false, error: 'Variance not found', errorCode: 'VARIANCE_NOT_FOUND' };

    const cc = this.cycleCounts.get(input.cycleCountId);
    if (!cc) return { success: false, error: 'Cycle count not found', errorCode: 'CYCLE_COUNT_NOT_FOUND' };

    const now = new Date();
    this.adjustmentCounter++;
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const adjustmentNumber = `ADJ-${dateStr}-${String(this.adjustmentCounter).padStart(4, '0')}`;

    const adjustment: Adjustment = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      adjustmentNumber,
      varianceId: input.varianceId,
      cycleCountId: input.cycleCountId,
      adjustmentType: input.adjustmentType,
      status: 'draft',

      containerNumber: input.containerNumber,
      containerId: input.containerId,

      previousValue: input.previousValue,
      newValue: input.newValue,
      reason: input.reason,

      requestedBy: input.requestedBy,
      requestedAt: now,

      notes: input.notes,

      createdAt: now,
      updatedAt: now,
    };

    this.adjustments.set(adjustment.id, adjustment);
    this.adjustmentByNumber.set(adjustmentNumber, adjustment.id);
    if (!this.adjustmentsByCycleCount.has(input.cycleCountId)) {
      this.adjustmentsByCycleCount.set(input.cycleCountId, []);
    }
    this.adjustmentsByCycleCount.get(input.cycleCountId)!.push(adjustment.id);

    emit('reconciliation.adjustment_created', {
      adjustmentId: adjustment.id,
      adjustmentNumber: adjustment.adjustmentNumber,
      varianceId: adjustment.varianceId,
      adjustmentType: adjustment.adjustmentType,
      containerNumber: adjustment.containerNumber,
    }, { tenantId: adjustment.tenantId });

    return { success: true, data: adjustment };
  }

  /**
   * Get a single adjustment by ID
   */
  getAdjustment(id: UUID): Adjustment | undefined {
    return this.adjustments.get(id);
  }

  /**
   * List adjustments for a tenant with optional filters
   */
  listAdjustments(tenantId: string, cycleCountId?: UUID, status?: AdjustmentStatus): Adjustment[] {
    let results = Array.from(this.adjustments.values()).filter(a => a.tenantId === tenantId);
    if (cycleCountId) results = results.filter(a => a.cycleCountId === cycleCountId);
    if (status) results = results.filter(a => a.status === status);
    return results;
  }

  /**
   * Submit an adjustment for approval — transition from draft to pending_approval
   */
  submitForApproval(id: UUID): OperationResult<Adjustment> {
    const adj = this.adjustments.get(id);
    if (!adj) return { success: false, error: 'Adjustment not found', errorCode: 'NOT_FOUND' };

    if (adj.status !== 'draft') {
      return { success: false, error: 'Adjustment must be in draft status to submit for approval', errorCode: 'INVALID_STATUS' };
    }

    adj.status = 'pending_approval';
    adj.updatedAt = new Date();

    return { success: true, data: adj };
  }

  /**
   * Approve an adjustment
   */
  approveAdjustment(id: UUID, approvedBy: string): OperationResult<Adjustment> {
    const adj = this.adjustments.get(id);
    if (!adj) return { success: false, error: 'Adjustment not found', errorCode: 'NOT_FOUND' };

    if (adj.status !== 'pending_approval') {
      return { success: false, error: 'Adjustment must be in pending_approval status to approve', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    adj.status = 'approved';
    adj.approvedBy = approvedBy;
    adj.approvedAt = now;
    adj.updatedAt = now;

    emit('reconciliation.adjustment_approved', {
      adjustmentId: adj.id,
      adjustmentNumber: adj.adjustmentNumber,
      approvedBy,
    }, { tenantId: adj.tenantId });

    return { success: true, data: adj };
  }

  /**
   * Reject an adjustment
   */
  rejectAdjustment(id: UUID, rejectedBy: string, reason: string): OperationResult<Adjustment> {
    const adj = this.adjustments.get(id);
    if (!adj) return { success: false, error: 'Adjustment not found', errorCode: 'NOT_FOUND' };

    if (adj.status !== 'pending_approval') {
      return { success: false, error: 'Adjustment must be in pending_approval status to reject', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    adj.status = 'rejected';
    adj.rejectedBy = rejectedBy;
    adj.rejectedAt = now;
    adj.rejectionReason = reason;
    adj.updatedAt = now;

    return { success: true, data: adj };
  }

  /**
   * Apply an approved adjustment — must be in approved status
   */
  applyAdjustment(id: UUID, appliedBy: string): OperationResult<Adjustment> {
    const adj = this.adjustments.get(id);
    if (!adj) return { success: false, error: 'Adjustment not found', errorCode: 'NOT_FOUND' };

    if (adj.status !== 'approved') {
      return { success: false, error: 'Adjustment must be approved before it can be applied', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    adj.status = 'applied';
    adj.appliedBy = appliedBy;
    adj.appliedAt = now;
    adj.updatedAt = now;

    // Mark the corresponding variance as adjusted
    const variance = this.variances.get(adj.varianceId);
    if (variance && !variance.resolution) {
      variance.resolution = 'adjusted';
      variance.resolvedBy = appliedBy;
      variance.resolvedAt = now;
      variance.updatedAt = now;
    }

    // Update the related count entry status to adjusted
    const entries = this.getEntriesByCycleCount(adj.cycleCountId);
    const matchingEntry = entries.find(e => e.containerNumber === adj.containerNumber && e.isVariance);
    if (matchingEntry) {
      matchingEntry.status = 'adjusted';
      matchingEntry.updatedAt = now;
    }

    emit('reconciliation.adjustment_applied', {
      adjustmentId: adj.id,
      adjustmentNumber: adj.adjustmentNumber,
      appliedBy,
      adjustmentType: adj.adjustmentType,
      containerNumber: adj.containerNumber,
    }, { tenantId: adj.tenantId });

    return { success: true, data: adj };
  }

  // ============================================================================
  // FINALIZE CYCLE COUNT
  // ============================================================================

  /**
   * Finalize a cycle count by calculating accuracy metrics and moving to review status.
   * Accuracy = matchedContainers / expectedContainers * 100
   */
  finalizeCycleCount(id: UUID): OperationResult<CycleCount> {
    const cc = this.cycleCounts.get(id);
    if (!cc) return { success: false, error: 'Cycle count not found', errorCode: 'NOT_FOUND' };

    if (cc.status !== 'in_progress' && cc.status !== 'counting') {
      return { success: false, error: 'Cycle count must be in in_progress or counting status to finalize', errorCode: 'INVALID_STATUS' };
    }

    if (cc.countedContainers === 0) {
      return { success: false, error: 'Cannot finalize a cycle count with zero entries', errorCode: 'NO_ENTRIES' };
    }

    const now = new Date();

    // Recalculate matched from entries
    const entries = this.getEntriesByCycleCount(id);
    const matched = entries.filter(e => !e.isVariance).length;
    cc.matchedContainers = matched;
    cc.countedContainers = entries.length;
    cc.varianceCount = entries.filter(e => e.isVariance).length;

    // Recalculate category tallies from generated variances
    const varianceIds = this.variancesByCycleCount.get(id) ?? [];
    const ccVariances = varianceIds.map(vid => this.variances.get(vid)!).filter(Boolean);
    cc.missingContainers = ccVariances.filter(v => v.varianceType === 'missing').length;
    cc.foundContainers = ccVariances.filter(v => v.varianceType === 'found').length;
    cc.misplacedContainers = ccVariances.filter(v => v.varianceType === 'misplaced').length;
    cc.extraContainers = ccVariances.filter(v => v.varianceType === 'extra').length;

    // Calculate accuracy percent
    cc.accuracyPercent = cc.expectedContainers > 0
      ? parseFloat(((cc.matchedContainers / cc.expectedContainers) * 100).toFixed(2))
      : 0;

    cc.status = 'review';
    cc.completedAt = now;
    cc.updatedAt = now;

    emit('reconciliation.count_completed', {
      cycleCountId: cc.id,
      countNumber: cc.countNumber,
      countedContainers: cc.countedContainers,
      matchedContainers: cc.matchedContainers,
      varianceCount: cc.varianceCount,
      accuracyPercent: cc.accuracyPercent,
    }, { tenantId: cc.tenantId });

    return { success: true, data: cc };
  }

  /**
   * Approve a finalized cycle count — final sign-off, move to completed
   */
  approveCycleCount(id: UUID, approvedBy: string): OperationResult<CycleCount> {
    const cc = this.cycleCounts.get(id);
    if (!cc) return { success: false, error: 'Cycle count not found', errorCode: 'NOT_FOUND' };

    if (cc.status !== 'review') {
      return { success: false, error: 'Cycle count must be in review status to approve', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    cc.status = 'completed';
    cc.approvedBy = approvedBy;
    cc.approvedAt = now;
    cc.updatedAt = now;

    return { success: true, data: cc };
  }

  // ============================================================================
  // RECONCILIATION STATS
  // ============================================================================

  /**
   * Compute reconciliation statistics for a tenant
   */
  getReconciliationStats(tenantId: string): ReconciliationStats {
    const allCounts = Array.from(this.cycleCounts.values()).filter(c => c.tenantId === tenantId);
    const allVariances = Array.from(this.variances.values()).filter(v => v.tenantId === tenantId);
    const allAdjustments = Array.from(this.adjustments.values()).filter(a => a.tenantId === tenantId);

    const completedCounts = allCounts.filter(c => c.status === 'completed' || c.status === 'approved');
    const inProgressCounts = allCounts.filter(c => c.status === 'in_progress' || c.status === 'counting');
    const plannedCounts = allCounts.filter(c => c.status === 'planned');

    // Counts this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const countsThisMonth = allCounts.filter(c => c.createdAt >= monthStart).length;

    // Accuracy calculations
    const completedAccuracies = completedCounts
      .map(c => c.accuracyPercent)
      .filter(a => a > 0);
    const overallAccuracyPercent = completedAccuracies.length > 0
      ? parseFloat((completedAccuracies.reduce((sum, a) => sum + a, 0) / completedAccuracies.length).toFixed(2))
      : 0;

    // Last count accuracy
    const sortedCompleted = [...completedCounts].sort(
      (a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)
    );
    const firstCompleted = sortedCompleted[0];
    const lastCountAccuracy = firstCompleted ? firstCompleted.accuracyPercent : 0;

    // Accuracy trend: compare last two completed counts
    let accuracyTrend: 'improving' | 'declining' | 'stable' = 'stable';
    const secondCompleted = sortedCompleted[1];
    if (firstCompleted && secondCompleted) {
      const latest = firstCompleted.accuracyPercent;
      const previous = secondCompleted.accuracyPercent;
      if (latest > previous + 0.5) accuracyTrend = 'improving';
      else if (latest < previous - 0.5) accuracyTrend = 'declining';
    }

    // Variance stats
    const openVariances = allVariances.filter(v => v.resolution === undefined).length;
    const resolvedVariances = allVariances.filter(v => v.resolution !== undefined).length;
    const variancesThisMonth = allVariances.filter(v => v.createdAt >= monthStart).length;

    // Adjustment stats
    const pendingAdjustments = allAdjustments.filter(a => a.status === 'pending_approval').length;
    const approvedAdjustments = allAdjustments.filter(a => a.status === 'approved' || a.status === 'applied').length;
    const rejectedAdjustments = allAdjustments.filter(a => a.status === 'rejected').length;

    // Bonded variances
    const bondedVariances = allVariances.filter(v => v.isBondedContainer).length;
    const bondedCustomsNotifications = allVariances.filter(v => v.isBondedContainer && v.customsNotified).length;

    // Performance: average count duration in hours for completed counts
    const durations = completedCounts
      .filter(c => c.startedAt && c.completedAt)
      .map(c => (c.completedAt!.getTime() - c.startedAt!.getTime()) / (1000 * 60 * 60));
    const averageCountDurationHours = durations.length > 0
      ? parseFloat((durations.reduce((sum, d) => sum + d, 0) / durations.length).toFixed(2))
      : 0;

    // Containers counted this month
    const monthCountIds = allCounts
      .filter(c => c.createdAt >= monthStart)
      .map(c => c.id);
    const containersCountedThisMonth = monthCountIds.reduce((sum, ccId) => {
      const cc = this.cycleCounts.get(ccId);
      return sum + (cc?.countedContainers ?? 0);
    }, 0);

    // Count efficiency: containers per hour across completed counts
    const totalContainersCounted = completedCounts.reduce((sum, c) => sum + c.countedContainers, 0);
    const totalDurationHours = durations.reduce((sum, d) => sum + d, 0);
    const countEfficiencyRate = totalDurationHours > 0
      ? parseFloat((totalContainersCounted / totalDurationHours).toFixed(2))
      : 0;

    return {
      tenantId,

      totalCycleCounts: allCounts.length,
      completedCycleCounts: completedCounts.length,
      inProgressCycleCounts: inProgressCounts.length,
      plannedCycleCounts: plannedCounts.length,
      countsThisMonth,

      overallAccuracyPercent,
      lastCountAccuracyPercent: lastCountAccuracy,
      accuracyTrend,
      targetAccuracyPercent: 99.5,

      totalVariances: allVariances.length,
      openVariances,
      resolvedVariances,
      missingContainers: allVariances.filter(v => v.varianceType === 'missing').length,
      foundContainers: allVariances.filter(v => v.varianceType === 'found').length,
      misplacedContainers: allVariances.filter(v => v.varianceType === 'misplaced').length,
      variancesThisMonth,

      totalAdjustments: allAdjustments.length,
      pendingAdjustments,
      approvedAdjustments,
      rejectedAdjustments,

      bondedVariances,
      bondedCustomsNotifications,

      averageCountDurationHours,
      containersCountedThisMonth,
      countEfficiencyRate,
    };
  }
}

// ============================================================================
// SINGLETON ACCESSORS
// ============================================================================

let _reconciliationEngine: ReconciliationEngine | null = null;

export function getReconciliationEngine(): ReconciliationEngine {
  if (!_reconciliationEngine) {
    _reconciliationEngine = ReconciliationEngine.getInstance();
  }
  return _reconciliationEngine;
}

export function setReconciliationEngine(engine: ReconciliationEngine): void {
  _reconciliationEngine = engine;
}
