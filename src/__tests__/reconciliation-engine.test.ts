/**
 * Reconciliation Engine Tests
 *
 * Comprehensive unit tests for ReconciliationEngine covering:
 * - Singleton pattern
 * - Cycle count management (plan, get, list, start, assign, cancel)
 * - Count entries (record, get, getByCount, getVarianceEntries, updateStatus)
 * - Variance management (generate, get, list, resolve, notify)
 * - Adjustments (create, get, list, submit, approve, reject, apply)
 * - Finalize & approve cycle counts
 * - Reconciliation stats
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReconciliationEngine } from '../reconciliation/reconciliation-engine';
import type {
  PlanCycleCountInput,
  RecordCountEntryInput,
  CreateAdjustmentInput,
} from '../reconciliation/reconciliation-engine';
import { TENANT_ID, FACILITY_ID, uuid } from './test-utils';

// ============================================================================
// Helper Factories
// ============================================================================

function makeCycleCountInput(overrides: Record<string, unknown> = {}): PlanCycleCountInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    frequency: 'weekly' as const,
    method: 'zone_based' as const,
    isBlindCount: false,
    plannedDate: new Date(),
    zones: ['A', 'B'],
    expectedContainers: 100,
    notes: 'Test cycle count',
    ...overrides,
  } as PlanCycleCountInput;
}

let entrySeq = 1;

function makeCountEntryInput(cycleCountId: string, overrides: Record<string, unknown> = {}): RecordCountEntryInput {
  const seq = entrySeq++;
  return {
    cycleCountId,
    counterId: `counter-${seq}`,
    containerNumber: `MSCU${String(300000 + seq)}0`,
    actualLocation: 'A-01-02-3',
    inSystem: true,
    physicallyPresent: true,
    scanMethod: 'rfid' as const,
    scanConfidence: 95,
    ...overrides,
  } as RecordCountEntryInput;
}

function makeAdjustmentInput(
  varianceId: string,
  cycleCountId: string,
  containerNumber: string,
  overrides: Record<string, unknown> = {},
): CreateAdjustmentInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    varianceId,
    cycleCountId,
    adjustmentType: 'location_correction' as const,
    containerNumber,
    previousValue: 'A-01-02-3',
    newValue: 'B-03-01-1',
    reason: 'Container found in wrong location',
    requestedBy: 'operator-001',
    ...overrides,
  } as CreateAdjustmentInput;
}

// ============================================================================
// Helper: plan a cycle count and return the CycleCount object
// ============================================================================

function planCount(engine: ReconciliationEngine, overrides: Record<string, unknown> = {}) {
  const result = engine.planCycleCount(makeCycleCountInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function startCount(engine: ReconciliationEngine, id: string) {
  const result = engine.startCycleCount(id);
  expect(result.success).toBe(true);
  return result.data!;
}

function recordEntry(engine: ReconciliationEngine, cycleCountId: string, overrides: Record<string, unknown> = {}) {
  const result = engine.recordCountEntry(makeCountEntryInput(cycleCountId, overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

// ============================================================================
// TESTS
// ============================================================================

describe('ReconciliationEngine', () => {
  let engine: ReconciliationEngine;

  beforeEach(() => {
    ReconciliationEngine.resetInstance();
    engine = ReconciliationEngine.getInstance();
    entrySeq = 1;
  });

  // ==========================================================================
  // Singleton Pattern
  // ==========================================================================

  describe('Singleton pattern', () => {
    it('should return the same instance on repeated calls', () => {
      const a = ReconciliationEngine.getInstance();
      const b = ReconciliationEngine.getInstance();
      expect(a).toBe(b);
    });

    it('should return a new instance after reset', () => {
      const a = ReconciliationEngine.getInstance();
      ReconciliationEngine.resetInstance();
      const b = ReconciliationEngine.getInstance();
      expect(a).not.toBe(b);
    });
  });

  // ==========================================================================
  // Cycle Count Management
  // ==========================================================================

  describe('Cycle count management', () => {
    describe('planCycleCount', () => {
      it('should plan a new cycle count with auto-generated number', () => {
        const result = engine.planCycleCount(makeCycleCountInput());
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.status).toBe('planned');
        expect(result.data!.countNumber).toMatch(/^CC-\d{8}-\d{3}$/);
        expect(result.data!.countedContainers).toBe(0);
        expect(result.data!.matchedContainers).toBe(0);
        expect(result.data!.varianceCount).toBe(0);
        expect(result.data!.accuracyPercent).toBe(0);
      });

      it('should assign sequential count numbers', () => {
        const r1 = engine.planCycleCount(makeCycleCountInput());
        const r2 = engine.planCycleCount(makeCycleCountInput());
        expect(r1.data!.countNumber).toMatch(/-001$/);
        expect(r2.data!.countNumber).toMatch(/-002$/);
      });

      it('should fail when no zones are specified', () => {
        const result = engine.planCycleCount(makeCycleCountInput({ zones: [] }));
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NO_ZONES');
      });

      it('should fail when expectedContainers is zero', () => {
        const result = engine.planCycleCount(makeCycleCountInput({ expectedContainers: 0 }));
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_EXPECTED');
      });

      it('should fail when expectedContainers is negative', () => {
        const result = engine.planCycleCount(makeCycleCountInput({ expectedContainers: -5 }));
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_EXPECTED');
      });

      it('should default isBlindCount to false', () => {
        const result = engine.planCycleCount(makeCycleCountInput({ isBlindCount: undefined }));
        expect(result.success).toBe(true);
        expect(result.data!.isBlindCount).toBe(false);
      });

      it('should set isBlindCount when provided', () => {
        const result = engine.planCycleCount(makeCycleCountInput({ isBlindCount: true }));
        expect(result.success).toBe(true);
        expect(result.data!.isBlindCount).toBe(true);
      });

      it('should preserve optional fields', () => {
        const result = engine.planCycleCount(makeCycleCountInput({
          supervisorId: 'sup-001',
          supervisorName: 'John Supervisor',
          containerTypes: ['40HC'],
          shippingLines: ['MSC'],
          statusFilter: ['import'],
        }));
        expect(result.success).toBe(true);
        expect(result.data!.supervisorId).toBe('sup-001');
        expect(result.data!.supervisorName).toBe('John Supervisor');
        expect(result.data!.containerTypes).toEqual(['40HC']);
        expect(result.data!.shippingLines).toEqual(['MSC']);
        expect(result.data!.statusFilter).toEqual(['import']);
      });
    });

    describe('getCycleCount', () => {
      it('should get a cycle count by ID', () => {
        const cc = planCount(engine);
        const found = engine.getCycleCount(cc.id);
        expect(found).toBeDefined();
        expect(found!.id).toBe(cc.id);
        expect(found!.countNumber).toBe(cc.countNumber);
      });

      it('should return undefined for unknown ID', () => {
        expect(engine.getCycleCount('non-existent-id')).toBeUndefined();
      });
    });

    describe('getCycleCountByNumber', () => {
      it('should get a cycle count by its count number', () => {
        const cc = planCount(engine);
        const found = engine.getCycleCountByNumber(cc.countNumber);
        expect(found).toBeDefined();
        expect(found!.id).toBe(cc.id);
      });

      it('should return undefined for unknown count number', () => {
        expect(engine.getCycleCountByNumber('CC-FAKE-999')).toBeUndefined();
      });
    });

    describe('listCycleCounts', () => {
      it('should list cycle counts for a tenant', () => {
        planCount(engine);
        planCount(engine);
        planCount(engine, { tenantId: 'other-tenant' });
        const list = engine.listCycleCounts(TENANT_ID);
        expect(list).toHaveLength(2);
      });

      it('should filter by status', () => {
        const cc = planCount(engine);
        planCount(engine);
        engine.startCycleCount(cc.id);
        expect(engine.listCycleCounts(TENANT_ID, 'planned')).toHaveLength(1);
        expect(engine.listCycleCounts(TENANT_ID, 'in_progress')).toHaveLength(1);
      });

      it('should return empty array for tenant with no counts', () => {
        expect(engine.listCycleCounts('empty-tenant')).toHaveLength(0);
      });
    });

    describe('startCycleCount', () => {
      it('should start a planned cycle count', () => {
        const cc = planCount(engine);
        const result = engine.startCycleCount(cc.id);
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('in_progress');
        expect(result.data!.startedAt).toBeDefined();
      });

      it('should fail when cycle count not found', () => {
        const result = engine.startCycleCount('non-existent');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should fail when cycle count is not in planned status', () => {
        const cc = planCount(engine);
        engine.startCycleCount(cc.id);
        const result = engine.startCycleCount(cc.id);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });
    });

    describe('assignCounters', () => {
      it('should assign counters to a cycle count', () => {
        const cc = planCount(engine);
        const counters = [
          { counterId: 'c-1', counterName: 'Alice', assignedZones: ['A'], containersScanned: 0 },
          { counterId: 'c-2', counterName: 'Bob', assignedZones: ['B'], containersScanned: 0 },
        ];
        const result = engine.assignCounters(cc.id, counters);
        expect(result.success).toBe(true);
        expect(result.data!.assignedCounters).toHaveLength(2);
        expect(result.data!.assignedCounters[0].counterName).toBe('Alice');
      });

      it('should fail when cycle count not found', () => {
        const result = engine.assignCounters('bad-id', []);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should fail when cycle count is completed', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id);
        engine.finalizeCycleCount(cc.id);
        engine.approveCycleCount(cc.id, 'supervisor-001');

        const result = engine.assignCounters(cc.id, []);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });

      it('should fail when cycle count is cancelled', () => {
        const cc = planCount(engine);
        engine.cancelCycleCount(cc.id, 'Test cancel');
        const result = engine.assignCounters(cc.id, []);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });
    });

    describe('cancelCycleCount', () => {
      it('should cancel a planned cycle count', () => {
        const cc = planCount(engine);
        const result = engine.cancelCycleCount(cc.id, 'Bad weather');
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('cancelled');
        expect(result.data!.notes).toBe('Bad weather');
      });

      it('should cancel an in-progress cycle count', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        const result = engine.cancelCycleCount(cc.id, 'Cancelled mid-count');
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('cancelled');
      });

      it('should fail when cycle count not found', () => {
        const result = engine.cancelCycleCount('no-id', 'reason');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should fail when cycle count is already completed', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id);
        engine.finalizeCycleCount(cc.id);
        engine.approveCycleCount(cc.id, 'sup');

        const result = engine.cancelCycleCount(cc.id, 'Too late');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });

      it('should fail when cycle count is already cancelled', () => {
        const cc = planCount(engine);
        engine.cancelCycleCount(cc.id, 'First cancel');
        const result = engine.cancelCycleCount(cc.id, 'Double cancel');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });
    });
  });

  // ==========================================================================
  // Count Entries
  // ==========================================================================

  describe('Count entries', () => {
    describe('recordCountEntry', () => {
      it('should record a matching entry (no variance)', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        const result = engine.recordCountEntry(makeCountEntryInput(cc.id, {
          inSystem: true,
          physicallyPresent: true,
          expectedLocation: 'A-01-02-3',
          actualLocation: 'A-01-02-3',
        }));
        expect(result.success).toBe(true);
        expect(result.data!.isVariance).toBe(false);
        expect(result.data!.status).toBe('scanned');
        expect(result.data!.locationMatch).toBe(true);
      });

      it('should detect missing variance (in system, not found)', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        const result = engine.recordCountEntry(makeCountEntryInput(cc.id, {
          inSystem: true,
          physicallyPresent: false,
          expectedLocation: 'A-01-02-3',
          actualLocation: 'A-01-02-3',
        }));
        expect(result.success).toBe(true);
        expect(result.data!.isVariance).toBe(true);
        expect(result.data!.varianceType).toBe('missing');
        expect(result.data!.status).toBe('variance_flagged');
      });

      it('should detect found variance (not in system, physically present)', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        const result = engine.recordCountEntry(makeCountEntryInput(cc.id, {
          inSystem: false,
          physicallyPresent: true,
        }));
        expect(result.success).toBe(true);
        expect(result.data!.isVariance).toBe(true);
        expect(result.data!.varianceType).toBe('found');
      });

      it('should detect misplaced variance (location mismatch)', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        const result = engine.recordCountEntry(makeCountEntryInput(cc.id, {
          inSystem: true,
          physicallyPresent: true,
          expectedLocation: 'A-01-02-3',
          actualLocation: 'B-05-01-1',
        }));
        expect(result.success).toBe(true);
        expect(result.data!.isVariance).toBe(true);
        expect(result.data!.varianceType).toBe('misplaced');
        expect(result.data!.locationMatch).toBe(false);
      });

      it('should treat as no variance when no expectedLocation is set and container is in system and present', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        const result = engine.recordCountEntry(makeCountEntryInput(cc.id, {
          inSystem: true,
          physicallyPresent: true,
          expectedLocation: undefined,
          actualLocation: 'C-01-01-1',
        }));
        expect(result.success).toBe(true);
        expect(result.data!.isVariance).toBe(false);
        expect(result.data!.locationMatch).toBe(true);
      });

      it('should transition cycle count from in_progress to counting on first entry', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        expect(engine.getCycleCount(cc.id)!.status).toBe('in_progress');

        recordEntry(engine, cc.id);
        expect(engine.getCycleCount(cc.id)!.status).toBe('counting');
      });

      it('should increment counted containers tally', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        recordEntry(engine, cc.id);
        recordEntry(engine, cc.id);
        recordEntry(engine, cc.id);

        const updated = engine.getCycleCount(cc.id)!;
        expect(updated.countedContainers).toBe(3);
      });

      it('should increment matched containers for non-variance entries', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: true });
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: true });

        expect(engine.getCycleCount(cc.id)!.matchedContainers).toBe(2);
      });

      it('should increment variance count for variance entries', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false });
        recordEntry(engine, cc.id, { inSystem: false, physicallyPresent: true });

        expect(engine.getCycleCount(cc.id)!.varianceCount).toBe(2);
      });

      it('should fail when cycle count not found', () => {
        const result = engine.recordCountEntry(makeCountEntryInput('bad-id'));
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('CYCLE_COUNT_NOT_FOUND');
      });

      it('should fail when cycle count is in planned status', () => {
        const cc = planCount(engine);
        const result = engine.recordCountEntry(makeCountEntryInput(cc.id));
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });

      it('should fail when cycle count is cancelled', () => {
        const cc = planCount(engine);
        engine.cancelCycleCount(cc.id, 'cancelled');
        const result = engine.recordCountEntry(makeCountEntryInput(cc.id));
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });

      it('should record hasPhoto and photoUrl', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        const result = engine.recordCountEntry(makeCountEntryInput(cc.id, {
          hasPhoto: true,
          photoUrl: 'https://photos.test/photo1.jpg',
        }));
        expect(result.success).toBe(true);
        expect(result.data!.hasPhoto).toBe(true);
        expect(result.data!.photoUrl).toBe('https://photos.test/photo1.jpg');
      });
    });

    describe('getCountEntry', () => {
      it('should return a count entry by ID', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        const entry = recordEntry(engine, cc.id);

        const found = engine.getCountEntry(entry.id);
        expect(found).toBeDefined();
        expect(found!.id).toBe(entry.id);
      });

      it('should return undefined for unknown ID', () => {
        expect(engine.getCountEntry('non-existent')).toBeUndefined();
      });
    });

    describe('getEntriesByCycleCount', () => {
      it('should return all entries for a cycle count', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id);
        recordEntry(engine, cc.id);
        recordEntry(engine, cc.id);

        const entries = engine.getEntriesByCycleCount(cc.id);
        expect(entries).toHaveLength(3);
      });

      it('should return empty array for unknown cycle count', () => {
        expect(engine.getEntriesByCycleCount('unknown-id')).toHaveLength(0);
      });
    });

    describe('getVarianceEntries', () => {
      it('should return only variance entries', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: true });
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false }); // missing
        recordEntry(engine, cc.id, { inSystem: false, physicallyPresent: true }); // found

        const variances = engine.getVarianceEntries(cc.id);
        expect(variances).toHaveLength(2);
        expect(variances.every(e => e.isVariance)).toBe(true);
      });

      it('should return empty array when no variance entries exist', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: true });

        expect(engine.getVarianceEntries(cc.id)).toHaveLength(0);
      });
    });

    describe('updateEntryStatus', () => {
      it('should update the status of a count entry', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        const entry = recordEntry(engine, cc.id);

        const result = engine.updateEntryStatus(entry.id, 'verified');
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('verified');
      });

      it('should fail when entry not found', () => {
        const result = engine.updateEntryStatus('bad-id', 'verified');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });
    });
  });

  // ==========================================================================
  // Variance Management
  // ==========================================================================

  describe('Variance management', () => {
    describe('generateVariances', () => {
      it('should generate variances from variance entries', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        recordEntry(engine, cc.id, {
          containerNumber: 'MSCU5000001',
          inSystem: true,
          physicallyPresent: false,
          expectedLocation: 'A-01-01-1',
          actualLocation: 'A-01-01-1',
        });
        recordEntry(engine, cc.id, {
          containerNumber: 'MSCU5000002',
          inSystem: false,
          physicallyPresent: true,
          actualLocation: 'B-03-02-1',
        });

        const result = engine.generateVariances(cc.id);
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);

        const missing = result.data!.find(v => v.varianceType === 'missing');
        expect(missing).toBeDefined();
        expect(missing!.containerNumber).toBe('MSCU5000001');
        expect(missing!.varianceNumber).toMatch(/^VAR-\d{8}-\d{4}$/);

        const found = result.data!.find(v => v.varianceType === 'found');
        expect(found).toBeDefined();
        expect(found!.containerNumber).toBe('MSCU5000002');
      });

      it('should return empty array with warnings when no variance entries exist', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: true });

        const result = engine.generateVariances(cc.id);
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(0);
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.length).toBeGreaterThan(0);
      });

      it('should fail when cycle count not found', () => {
        const result = engine.generateVariances('bad-id');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should update cycle count category tallies', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        recordEntry(engine, cc.id, { containerNumber: 'C1', inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        recordEntry(engine, cc.id, { containerNumber: 'C2', inSystem: false, physicallyPresent: true, actualLocation: 'B' });
        recordEntry(engine, cc.id, { containerNumber: 'C3', inSystem: true, physicallyPresent: true, expectedLocation: 'A', actualLocation: 'C' });

        engine.generateVariances(cc.id);

        const updated = engine.getCycleCount(cc.id)!;
        expect(updated.missingContainers).toBe(1);
        expect(updated.foundContainers).toBe(1);
        expect(updated.misplacedContainers).toBe(1);
      });

      it('should flag bonded containers from notes', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        recordEntry(engine, cc.id, {
          containerNumber: 'BONDED1',
          inSystem: true,
          physicallyPresent: false,
          expectedLocation: 'A',
          actualLocation: 'A',
          notes: 'This is a bonded container under customs hold',
        });

        const result = engine.generateVariances(cc.id);
        expect(result.success).toBe(true);
        expect(result.data![0].isBondedContainer).toBe(true);
        expect(result.data![0].isCustomsHold).toBe(true);
        expect(result.data![0].requiresApproval).toBe(true);
      });

      it('should include evidence URLs from photo entries', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        recordEntry(engine, cc.id, {
          containerNumber: 'PHOTO1',
          inSystem: true,
          physicallyPresent: false,
          expectedLocation: 'A',
          actualLocation: 'A',
          hasPhoto: true,
          photoUrl: 'https://photos.test/evidence.jpg',
        });

        const result = engine.generateVariances(cc.id);
        expect(result.data![0].hasEvidence).toBe(true);
        expect(result.data![0].evidenceUrls).toContain('https://photos.test/evidence.jpg');
      });

      it('should generate misplaced variance with correct description', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);

        recordEntry(engine, cc.id, {
          containerNumber: 'MSCU1234567',
          inSystem: true,
          physicallyPresent: true,
          expectedLocation: 'A-01-01-1',
          actualLocation: 'B-05-03-2',
        });

        const result = engine.generateVariances(cc.id);
        expect(result.data![0].varianceType).toBe('misplaced');
        expect(result.data![0].description).toContain('MSCU1234567');
        expect(result.data![0].description).toContain('A-01-01-1');
        expect(result.data![0].description).toContain('B-05-03-2');
      });
    });

    describe('getVariance', () => {
      it('should return a variance by ID', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        const variances = engine.generateVariances(cc.id).data!;
        const found = engine.getVariance(variances[0].id);
        expect(found).toBeDefined();
        expect(found!.id).toBe(variances[0].id);
      });

      it('should return undefined for unknown ID', () => {
        expect(engine.getVariance('non-existent')).toBeUndefined();
      });
    });

    describe('getVarianceByNumber', () => {
      it('should return a variance by number', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        const variances = engine.generateVariances(cc.id).data!;
        const found = engine.getVarianceByNumber(variances[0].varianceNumber);
        expect(found).toBeDefined();
        expect(found!.varianceNumber).toBe(variances[0].varianceNumber);
      });

      it('should return undefined for unknown variance number', () => {
        expect(engine.getVarianceByNumber('VAR-FAKE-0001')).toBeUndefined();
      });
    });

    describe('listVariances', () => {
      it('should list variances for a tenant', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        recordEntry(engine, cc.id, { inSystem: false, physicallyPresent: true, actualLocation: 'B' });
        engine.generateVariances(cc.id);

        const list = engine.listVariances(TENANT_ID);
        expect(list).toHaveLength(2);
      });

      it('should filter by cycle count ID', () => {
        const cc1 = planCount(engine);
        const cc2 = planCount(engine);
        startCount(engine, cc1.id);
        startCount(engine, cc2.id);

        recordEntry(engine, cc1.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        recordEntry(engine, cc2.id, { inSystem: false, physicallyPresent: true, actualLocation: 'B' });
        engine.generateVariances(cc1.id);
        engine.generateVariances(cc2.id);

        expect(engine.listVariances(TENANT_ID, cc1.id)).toHaveLength(1);
        expect(engine.listVariances(TENANT_ID, cc2.id)).toHaveLength(1);
      });

      it('should filter by variance type', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        recordEntry(engine, cc.id, { inSystem: false, physicallyPresent: true, actualLocation: 'B' });
        engine.generateVariances(cc.id);

        expect(engine.listVariances(TENANT_ID, undefined, 'missing')).toHaveLength(1);
        expect(engine.listVariances(TENANT_ID, undefined, 'found')).toHaveLength(1);
        expect(engine.listVariances(TENANT_ID, undefined, 'extra')).toHaveLength(0);
      });

      it('should filter by resolved status', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id, { containerNumber: 'V1', inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        recordEntry(engine, cc.id, { containerNumber: 'V2', inSystem: false, physicallyPresent: true, actualLocation: 'B' });
        const variances = engine.generateVariances(cc.id).data!;

        // Resolve one variance
        engine.resolveVariance(variances[0].id, 'adjusted', 'user-1');

        expect(engine.listVariances(TENANT_ID, undefined, undefined, true)).toHaveLength(1);
        expect(engine.listVariances(TENANT_ID, undefined, undefined, false)).toHaveLength(1);
      });

      it('should return empty for unknown tenant', () => {
        expect(engine.listVariances('no-such-tenant')).toHaveLength(0);
      });
    });

    describe('resolveVariance', () => {
      it('should resolve a variance', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        const variance = engine.generateVariances(cc.id).data![0];

        const result = engine.resolveVariance(variance.id, 'location_corrected', 'operator-1', 'Container located in zone C');
        expect(result.success).toBe(true);
        expect(result.data!.resolution).toBe('location_corrected');
        expect(result.data!.resolvedBy).toBe('operator-1');
        expect(result.data!.resolvedAt).toBeDefined();
        expect(result.data!.resolutionNotes).toBe('Container located in zone C');
      });

      it('should fail when variance not found', () => {
        const result = engine.resolveVariance('bad-id', 'adjusted', 'user');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should fail when variance is already resolved', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        const variance = engine.generateVariances(cc.id).data![0];

        engine.resolveVariance(variance.id, 'adjusted', 'user-1');
        const result = engine.resolveVariance(variance.id, 'dismissed', 'user-2');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('ALREADY_RESOLVED');
      });
    });

    describe('notifyCustoms', () => {
      it('should mark customs as notified', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        const variance = engine.generateVariances(cc.id).data![0];

        const result = engine.notifyCustoms(variance.id);
        expect(result.success).toBe(true);
        expect(result.data!.customsNotified).toBe(true);
        expect(result.data!.customsNotifiedAt).toBeDefined();
      });

      it('should fail when variance not found', () => {
        const result = engine.notifyCustoms('bad-id');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should fail when customs already notified', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        const variance = engine.generateVariances(cc.id).data![0];

        engine.notifyCustoms(variance.id);
        const result = engine.notifyCustoms(variance.id);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('ALREADY_NOTIFIED');
      });
    });

    describe('notifyShippingLine', () => {
      it('should mark shipping line as notified', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        const variance = engine.generateVariances(cc.id).data![0];

        const result = engine.notifyShippingLine(variance.id);
        expect(result.success).toBe(true);
        expect(result.data!.shippingLineNotified).toBe(true);
        expect(result.data!.shippingLineNotifiedAt).toBeDefined();
      });

      it('should fail when variance not found', () => {
        const result = engine.notifyShippingLine('bad-id');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should fail when shipping line already notified', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        const variance = engine.generateVariances(cc.id).data![0];

        engine.notifyShippingLine(variance.id);
        const result = engine.notifyShippingLine(variance.id);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('ALREADY_NOTIFIED');
      });
    });
  });

  // ==========================================================================
  // Adjustments
  // ==========================================================================

  describe('Adjustments', () => {
    function setupVariance(eng: ReconciliationEngine) {
      const cc = planCount(eng);
      startCount(eng, cc.id);
      recordEntry(eng, cc.id, {
        containerNumber: 'ADJ-CONTAINER-001',
        inSystem: true,
        physicallyPresent: true,
        expectedLocation: 'A-01-02-3',
        actualLocation: 'B-05-01-1',
      });
      const variances = eng.generateVariances(cc.id).data!;
      return { cc, variance: variances[0] };
    }

    describe('createAdjustment', () => {
      it('should create a new adjustment', () => {
        const { cc, variance } = setupVariance(engine);
        const result = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'ADJ-CONTAINER-001'));
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.status).toBe('draft');
        expect(result.data!.adjustmentNumber).toMatch(/^ADJ-\d{8}-\d{4}$/);
        expect(result.data!.varianceId).toBe(variance.id);
        expect(result.data!.cycleCountId).toBe(cc.id);
      });

      it('should fail when variance not found', () => {
        const cc = planCount(engine);
        const result = engine.createAdjustment(makeAdjustmentInput('bad-variance-id', cc.id, 'C1'));
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('VARIANCE_NOT_FOUND');
      });

      it('should fail when cycle count not found', () => {
        const { variance } = setupVariance(engine);
        const result = engine.createAdjustment(makeAdjustmentInput(variance.id, 'bad-cc-id', 'C1'));
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('CYCLE_COUNT_NOT_FOUND');
      });

      it('should assign sequential adjustment numbers', () => {
        const { cc, variance } = setupVariance(engine);
        const r1 = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C1'));
        const r2 = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C2'));
        expect(r1.data!.adjustmentNumber).toMatch(/-0001$/);
        expect(r2.data!.adjustmentNumber).toMatch(/-0002$/);
      });
    });

    describe('getAdjustment', () => {
      it('should return an adjustment by ID', () => {
        const { cc, variance } = setupVariance(engine);
        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C1')).data!;
        const found = engine.getAdjustment(adj.id);
        expect(found).toBeDefined();
        expect(found!.id).toBe(adj.id);
      });

      it('should return undefined for unknown ID', () => {
        expect(engine.getAdjustment('non-existent')).toBeUndefined();
      });
    });

    describe('listAdjustments', () => {
      it('should list adjustments for a tenant', () => {
        const { cc, variance } = setupVariance(engine);
        engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C1'));
        engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C2'));

        expect(engine.listAdjustments(TENANT_ID)).toHaveLength(2);
      });

      it('should filter by cycle count ID', () => {
        const { cc: cc1, variance: v1 } = setupVariance(engine);
        const { cc: cc2, variance: v2 } = setupVariance(engine);
        engine.createAdjustment(makeAdjustmentInput(v1.id, cc1.id, 'C1'));
        engine.createAdjustment(makeAdjustmentInput(v2.id, cc2.id, 'C2'));

        expect(engine.listAdjustments(TENANT_ID, cc1.id)).toHaveLength(1);
        expect(engine.listAdjustments(TENANT_ID, cc2.id)).toHaveLength(1);
      });

      it('should filter by status', () => {
        const { cc, variance } = setupVariance(engine);
        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C1')).data!;
        engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C2'));
        engine.submitForApproval(adj.id);

        expect(engine.listAdjustments(TENANT_ID, undefined, 'draft')).toHaveLength(1);
        expect(engine.listAdjustments(TENANT_ID, undefined, 'pending_approval')).toHaveLength(1);
      });

      it('should return empty for unknown tenant', () => {
        expect(engine.listAdjustments('no-such-tenant')).toHaveLength(0);
      });
    });

    describe('submitForApproval', () => {
      it('should submit a draft adjustment for approval', () => {
        const { cc, variance } = setupVariance(engine);
        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C1')).data!;
        const result = engine.submitForApproval(adj.id);
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('pending_approval');
      });

      it('should fail when adjustment not found', () => {
        const result = engine.submitForApproval('bad-id');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should fail when adjustment is not in draft status', () => {
        const { cc, variance } = setupVariance(engine);
        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C1')).data!;
        engine.submitForApproval(adj.id);
        const result = engine.submitForApproval(adj.id);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });
    });

    describe('approveAdjustment', () => {
      it('should approve a pending adjustment', () => {
        const { cc, variance } = setupVariance(engine);
        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C1')).data!;
        engine.submitForApproval(adj.id);

        const result = engine.approveAdjustment(adj.id, 'supervisor-001');
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('approved');
        expect(result.data!.approvedBy).toBe('supervisor-001');
        expect(result.data!.approvedAt).toBeDefined();
      });

      it('should fail when adjustment not found', () => {
        const result = engine.approveAdjustment('bad-id', 'user');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should fail when adjustment is not in pending_approval status', () => {
        const { cc, variance } = setupVariance(engine);
        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C1')).data!;
        // Still in draft
        const result = engine.approveAdjustment(adj.id, 'supervisor');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });
    });

    describe('rejectAdjustment', () => {
      it('should reject a pending adjustment', () => {
        const { cc, variance } = setupVariance(engine);
        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C1')).data!;
        engine.submitForApproval(adj.id);

        const result = engine.rejectAdjustment(adj.id, 'supervisor-001', 'Insufficient evidence');
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('rejected');
        expect(result.data!.rejectedBy).toBe('supervisor-001');
        expect(result.data!.rejectedAt).toBeDefined();
        expect(result.data!.rejectionReason).toBe('Insufficient evidence');
      });

      it('should fail when adjustment not found', () => {
        const result = engine.rejectAdjustment('bad-id', 'user', 'reason');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should fail when adjustment is not in pending_approval status', () => {
        const { cc, variance } = setupVariance(engine);
        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C1')).data!;
        const result = engine.rejectAdjustment(adj.id, 'supervisor', 'reason');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });
    });

    describe('applyAdjustment', () => {
      it('should apply an approved adjustment', () => {
        const { cc, variance } = setupVariance(engine);
        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'ADJ-CONTAINER-001')).data!;
        engine.submitForApproval(adj.id);
        engine.approveAdjustment(adj.id, 'supervisor');

        const result = engine.applyAdjustment(adj.id, 'operator-001');
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('applied');
        expect(result.data!.appliedBy).toBe('operator-001');
        expect(result.data!.appliedAt).toBeDefined();
      });

      it('should auto-resolve the related variance on apply', () => {
        const { cc, variance } = setupVariance(engine);
        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'ADJ-CONTAINER-001')).data!;
        engine.submitForApproval(adj.id);
        engine.approveAdjustment(adj.id, 'supervisor');
        engine.applyAdjustment(adj.id, 'operator-001');

        const resolved = engine.getVariance(variance.id);
        expect(resolved!.resolution).toBe('adjusted');
        expect(resolved!.resolvedBy).toBe('operator-001');
        expect(resolved!.resolvedAt).toBeDefined();
      });

      it('should update matching count entry status to adjusted', () => {
        const { cc, variance } = setupVariance(engine);
        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'ADJ-CONTAINER-001')).data!;
        engine.submitForApproval(adj.id);
        engine.approveAdjustment(adj.id, 'supervisor');
        engine.applyAdjustment(adj.id, 'operator-001');

        const entries = engine.getEntriesByCycleCount(cc.id);
        const matchingEntry = entries.find(e => e.containerNumber === 'ADJ-CONTAINER-001' && e.isVariance);
        expect(matchingEntry).toBeDefined();
        expect(matchingEntry!.status).toBe('adjusted');
      });

      it('should fail when adjustment not found', () => {
        const result = engine.applyAdjustment('bad-id', 'user');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should fail when adjustment is not in approved status', () => {
        const { cc, variance } = setupVariance(engine);
        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C1')).data!;
        engine.submitForApproval(adj.id);
        // Still pending_approval, not approved
        const result = engine.applyAdjustment(adj.id, 'user');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });

      it('should fail when adjustment is still draft', () => {
        const { cc, variance } = setupVariance(engine);
        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'C1')).data!;
        const result = engine.applyAdjustment(adj.id, 'user');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });

      it('should not re-resolve an already resolved variance', () => {
        const { cc, variance } = setupVariance(engine);
        // Manually resolve the variance first
        engine.resolveVariance(variance.id, 'dismissed', 'admin');

        const adj = engine.createAdjustment(makeAdjustmentInput(variance.id, cc.id, 'ADJ-CONTAINER-001')).data!;
        engine.submitForApproval(adj.id);
        engine.approveAdjustment(adj.id, 'supervisor');
        engine.applyAdjustment(adj.id, 'operator-001');

        // Variance should still have original resolution
        const v = engine.getVariance(variance.id);
        expect(v!.resolution).toBe('dismissed');
        expect(v!.resolvedBy).toBe('admin');
      });
    });
  });

  // ==========================================================================
  // Finalize & Approve Cycle Count
  // ==========================================================================

  describe('Finalize & approve cycle count', () => {
    describe('finalizeCycleCount', () => {
      it('should finalize a counting cycle count and transition to review', () => {
        const cc = planCount(engine, { expectedContainers: 10 });
        startCount(engine, cc.id);

        // Record 8 matching + 2 variance entries
        for (let i = 0; i < 8; i++) {
          recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: true });
        }
        recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        recordEntry(engine, cc.id, { inSystem: false, physicallyPresent: true, actualLocation: 'B' });

        const result = engine.finalizeCycleCount(cc.id);
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('review');
        expect(result.data!.countedContainers).toBe(10);
        expect(result.data!.matchedContainers).toBe(8);
        expect(result.data!.varianceCount).toBe(2);
        expect(result.data!.accuracyPercent).toBe(80);
        expect(result.data!.completedAt).toBeDefined();
      });

      it('should finalize an in_progress cycle count', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id);

        // Status is now 'counting' after first entry, but let's also test in_progress
        // We need a fresh one where we don't record entries after start (the first entry transitions)
        const cc2 = planCount(engine);
        startCount(engine, cc2.id);

        // We can't finalize with 0 entries, so this is really testing the counting state
        const result = engine.finalizeCycleCount(cc.id);
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('review');
      });

      it('should calculate accuracy percent correctly', () => {
        const cc = planCount(engine, { expectedContainers: 4 });
        startCount(engine, cc.id);
        recordEntry(engine, cc.id);
        recordEntry(engine, cc.id);
        recordEntry(engine, cc.id);

        const result = engine.finalizeCycleCount(cc.id);
        expect(result.success).toBe(true);
        // 3 matched out of 4 expected = 75%
        expect(result.data!.accuracyPercent).toBe(75);
      });

      it('should fail when cycle count not found', () => {
        const result = engine.finalizeCycleCount('bad-id');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should fail when cycle count is in planned status', () => {
        const cc = planCount(engine);
        const result = engine.finalizeCycleCount(cc.id);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });

      it('should fail when cycle count is already in review status', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id);
        engine.finalizeCycleCount(cc.id);

        const result = engine.finalizeCycleCount(cc.id);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });

      it('should fail when cycle count has zero entries', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        // No entries recorded, still in_progress
        const result = engine.finalizeCycleCount(cc.id);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NO_ENTRIES');
      });

      it('should recalculate category tallies from generated variances', () => {
        const cc = planCount(engine, { expectedContainers: 10 });
        startCount(engine, cc.id);

        recordEntry(engine, cc.id, { containerNumber: 'M1', inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
        recordEntry(engine, cc.id, { containerNumber: 'F1', inSystem: false, physicallyPresent: true, actualLocation: 'B' });
        recordEntry(engine, cc.id, { containerNumber: 'P1', inSystem: true, physicallyPresent: true, expectedLocation: 'A', actualLocation: 'C' });
        recordEntry(engine, cc.id); // matched

        // Generate variances before finalizing
        engine.generateVariances(cc.id);

        const result = engine.finalizeCycleCount(cc.id);
        expect(result.success).toBe(true);
        expect(result.data!.missingContainers).toBe(1);
        expect(result.data!.foundContainers).toBe(1);
        expect(result.data!.misplacedContainers).toBe(1);
      });
    });

    describe('approveCycleCount', () => {
      it('should approve a cycle count in review status', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        recordEntry(engine, cc.id);
        engine.finalizeCycleCount(cc.id);

        const result = engine.approveCycleCount(cc.id, 'supervisor-001');
        expect(result.success).toBe(true);
        expect(result.data!.status).toBe('completed');
        expect(result.data!.approvedBy).toBe('supervisor-001');
        expect(result.data!.approvedAt).toBeDefined();
      });

      it('should fail when cycle count not found', () => {
        const result = engine.approveCycleCount('bad-id', 'user');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should fail when cycle count is not in review status', () => {
        const cc = planCount(engine);
        const result = engine.approveCycleCount(cc.id, 'user');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });

      it('should fail when cycle count is in_progress', () => {
        const cc = planCount(engine);
        startCount(engine, cc.id);
        const result = engine.approveCycleCount(cc.id, 'user');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS');
      });
    });
  });

  // ==========================================================================
  // Reconciliation Stats
  // ==========================================================================

  describe('Reconciliation stats', () => {
    it('should return zeroed stats for empty tenant', () => {
      const stats = engine.getReconciliationStats('empty-tenant');
      expect(stats.tenantId).toBe('empty-tenant');
      expect(stats.totalCycleCounts).toBe(0);
      expect(stats.completedCycleCounts).toBe(0);
      expect(stats.inProgressCycleCounts).toBe(0);
      expect(stats.plannedCycleCounts).toBe(0);
      expect(stats.countsThisMonth).toBe(0);
      expect(stats.overallAccuracyPercent).toBe(0);
      expect(stats.lastCountAccuracyPercent).toBe(0);
      expect(stats.accuracyTrend).toBe('stable');
      expect(stats.targetAccuracyPercent).toBe(99.5);
      expect(stats.totalVariances).toBe(0);
      expect(stats.openVariances).toBe(0);
      expect(stats.resolvedVariances).toBe(0);
      expect(stats.totalAdjustments).toBe(0);
      expect(stats.pendingAdjustments).toBe(0);
      expect(stats.approvedAdjustments).toBe(0);
      expect(stats.rejectedAdjustments).toBe(0);
      expect(stats.bondedVariances).toBe(0);
      expect(stats.bondedCustomsNotifications).toBe(0);
      expect(stats.averageCountDurationHours).toBe(0);
      expect(stats.containersCountedThisMonth).toBe(0);
      expect(stats.countEfficiencyRate).toBe(0);
    });

    it('should count cycle counts by status', () => {
      const cc1 = planCount(engine); // planned
      const cc2 = planCount(engine);
      startCount(engine, cc2.id); // in_progress
      const cc3 = planCount(engine);
      startCount(engine, cc3.id);
      recordEntry(engine, cc3.id);
      engine.finalizeCycleCount(cc3.id);
      engine.approveCycleCount(cc3.id, 'sup'); // completed

      const stats = engine.getReconciliationStats(TENANT_ID);
      expect(stats.totalCycleCounts).toBe(3);
      expect(stats.plannedCycleCounts).toBe(1);
      expect(stats.inProgressCycleCounts).toBe(1);
      expect(stats.completedCycleCounts).toBe(1);
    });

    it('should count variances by type', () => {
      const cc = planCount(engine);
      startCount(engine, cc.id);

      recordEntry(engine, cc.id, { containerNumber: 'M1', inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
      recordEntry(engine, cc.id, { containerNumber: 'F1', inSystem: false, physicallyPresent: true, actualLocation: 'B' });
      recordEntry(engine, cc.id, { containerNumber: 'P1', inSystem: true, physicallyPresent: true, expectedLocation: 'A', actualLocation: 'C' });
      engine.generateVariances(cc.id);

      const stats = engine.getReconciliationStats(TENANT_ID);
      expect(stats.totalVariances).toBe(3);
      expect(stats.missingContainers).toBe(1);
      expect(stats.foundContainers).toBe(1);
      expect(stats.misplacedContainers).toBe(1);
    });

    it('should track open vs resolved variances', () => {
      const cc = planCount(engine);
      startCount(engine, cc.id);

      recordEntry(engine, cc.id, { containerNumber: 'V1', inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
      recordEntry(engine, cc.id, { containerNumber: 'V2', inSystem: false, physicallyPresent: true, actualLocation: 'B' });
      const variances = engine.generateVariances(cc.id).data!;

      engine.resolveVariance(variances[0].id, 'adjusted', 'user');

      const stats = engine.getReconciliationStats(TENANT_ID);
      expect(stats.openVariances).toBe(1);
      expect(stats.resolvedVariances).toBe(1);
    });

    it('should track adjustment statuses', () => {
      const cc = planCount(engine);
      startCount(engine, cc.id);
      recordEntry(engine, cc.id, {
        containerNumber: 'ADJ1',
        inSystem: true,
        physicallyPresent: true,
        expectedLocation: 'A',
        actualLocation: 'B',
      });
      const variances = engine.generateVariances(cc.id).data!;
      const v = variances[0];

      // Create 3 adjustments with different final statuses
      const adj1 = engine.createAdjustment(makeAdjustmentInput(v.id, cc.id, 'ADJ1')).data!;
      engine.submitForApproval(adj1.id);
      // adj1 is pending

      const adj2 = engine.createAdjustment(makeAdjustmentInput(v.id, cc.id, 'ADJ2')).data!;
      engine.submitForApproval(adj2.id);
      engine.approveAdjustment(adj2.id, 'sup');
      // adj2 is approved

      const adj3 = engine.createAdjustment(makeAdjustmentInput(v.id, cc.id, 'ADJ3')).data!;
      engine.submitForApproval(adj3.id);
      engine.rejectAdjustment(adj3.id, 'sup', 'No');
      // adj3 is rejected

      const stats = engine.getReconciliationStats(TENANT_ID);
      expect(stats.totalAdjustments).toBe(3);
      expect(stats.pendingAdjustments).toBe(1);
      expect(stats.approvedAdjustments).toBe(1);
      expect(stats.rejectedAdjustments).toBe(1);
    });

    it('should count applied adjustments as approved', () => {
      const cc = planCount(engine);
      startCount(engine, cc.id);
      recordEntry(engine, cc.id, {
        containerNumber: 'APPL1',
        inSystem: true,
        physicallyPresent: true,
        expectedLocation: 'A',
        actualLocation: 'B',
      });
      const variances = engine.generateVariances(cc.id).data!;
      const adj = engine.createAdjustment(makeAdjustmentInput(variances[0].id, cc.id, 'APPL1')).data!;
      engine.submitForApproval(adj.id);
      engine.approveAdjustment(adj.id, 'sup');
      engine.applyAdjustment(adj.id, 'op');

      const stats = engine.getReconciliationStats(TENANT_ID);
      // applied counts as approved (approved || applied)
      expect(stats.approvedAdjustments).toBe(1);
    });

    it('should track bonded variances and customs notifications', () => {
      const cc = planCount(engine);
      startCount(engine, cc.id);
      recordEntry(engine, cc.id, {
        containerNumber: 'BONDED1',
        inSystem: true,
        physicallyPresent: false,
        expectedLocation: 'A',
        actualLocation: 'A',
        notes: 'bonded cargo under customs supervision',
      });
      const variances = engine.generateVariances(cc.id).data!;
      engine.notifyCustoms(variances[0].id);

      const stats = engine.getReconciliationStats(TENANT_ID);
      expect(stats.bondedVariances).toBe(1);
      expect(stats.bondedCustomsNotifications).toBe(1);
    });

    it('should calculate overall accuracy from completed counts', () => {
      // Create and complete two cycle counts with different accuracy
      const cc1 = planCount(engine, { expectedContainers: 10 });
      startCount(engine, cc1.id);
      for (let i = 0; i < 9; i++) recordEntry(engine, cc1.id);
      recordEntry(engine, cc1.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
      engine.finalizeCycleCount(cc1.id);
      engine.approveCycleCount(cc1.id, 'sup');
      // cc1 accuracy = 9/10 = 90%

      const cc2 = planCount(engine, { expectedContainers: 10 });
      startCount(engine, cc2.id);
      for (let i = 0; i < 8; i++) recordEntry(engine, cc2.id);
      recordEntry(engine, cc2.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
      recordEntry(engine, cc2.id, { inSystem: false, physicallyPresent: true, actualLocation: 'B' });
      engine.finalizeCycleCount(cc2.id);
      engine.approveCycleCount(cc2.id, 'sup');
      // cc2 accuracy = 8/10 = 80%

      const stats = engine.getReconciliationStats(TENANT_ID);
      // Average of 90 + 80 = 85
      expect(stats.overallAccuracyPercent).toBe(85);
    });

    it('should report last count accuracy', () => {
      const cc = planCount(engine, { expectedContainers: 5 });
      startCount(engine, cc.id);
      for (let i = 0; i < 4; i++) recordEntry(engine, cc.id);
      recordEntry(engine, cc.id, { inSystem: true, physicallyPresent: false, expectedLocation: 'A', actualLocation: 'A' });
      engine.finalizeCycleCount(cc.id);
      engine.approveCycleCount(cc.id, 'sup');
      // 4/5 = 80%

      const stats = engine.getReconciliationStats(TENANT_ID);
      expect(stats.lastCountAccuracyPercent).toBe(80);
    });

    it('should include counts this month', () => {
      planCount(engine);
      planCount(engine);

      const stats = engine.getReconciliationStats(TENANT_ID);
      expect(stats.countsThisMonth).toBe(2);
    });

    it('should count containers counted this month', () => {
      const cc = planCount(engine);
      startCount(engine, cc.id);
      recordEntry(engine, cc.id);
      recordEntry(engine, cc.id);

      const stats = engine.getReconciliationStats(TENANT_ID);
      expect(stats.containersCountedThisMonth).toBe(2);
    });
  });

  // ==========================================================================
  // Full Workflow Integration
  // ==========================================================================

  describe('Full workflow integration', () => {
    it('should complete an end-to-end reconciliation workflow', () => {
      // 1. Plan
      const cc = planCount(engine, { expectedContainers: 5 });
      expect(cc.status).toBe('planned');

      // 2. Assign counters
      engine.assignCounters(cc.id, [
        { counterId: 'c1', counterName: 'Alice', assignedZones: ['A'], containersScanned: 0 },
      ]);

      // 3. Start
      startCount(engine, cc.id);
      expect(engine.getCycleCount(cc.id)!.status).toBe('in_progress');

      // 4. Record entries
      recordEntry(engine, cc.id, { containerNumber: 'C1', inSystem: true, physicallyPresent: true });
      recordEntry(engine, cc.id, { containerNumber: 'C2', inSystem: true, physicallyPresent: true });
      recordEntry(engine, cc.id, { containerNumber: 'C3', inSystem: true, physicallyPresent: true });
      recordEntry(engine, cc.id, {
        containerNumber: 'C4',
        inSystem: true,
        physicallyPresent: true,
        expectedLocation: 'A-01',
        actualLocation: 'B-02',
      });
      recordEntry(engine, cc.id, {
        containerNumber: 'C5',
        inSystem: true,
        physicallyPresent: false,
        expectedLocation: 'A-03',
        actualLocation: 'A-03',
      });

      expect(engine.getCycleCount(cc.id)!.status).toBe('counting');

      // 5. Generate variances
      const variances = engine.generateVariances(cc.id).data!;
      expect(variances).toHaveLength(2);

      // 6. Create adjustments for misplaced container
      const misplacedV = variances.find(v => v.varianceType === 'misplaced')!;
      const adj = engine.createAdjustment(makeAdjustmentInput(misplacedV.id, cc.id, 'C4', {
        adjustmentType: 'location_correction',
        previousValue: 'A-01',
        newValue: 'B-02',
      })).data!;

      // 7. Submit -> Approve -> Apply
      engine.submitForApproval(adj.id);
      engine.approveAdjustment(adj.id, 'supervisor');
      engine.applyAdjustment(adj.id, 'operator');
      expect(engine.getAdjustment(adj.id)!.status).toBe('applied');

      // 8. Resolve missing variance
      const missingV = variances.find(v => v.varianceType === 'missing')!;
      engine.resolveVariance(missingV.id, 'under_investigation', 'supervisor');

      // 9. Finalize
      const finalized = engine.finalizeCycleCount(cc.id);
      expect(finalized.success).toBe(true);
      expect(finalized.data!.status).toBe('review');
      expect(finalized.data!.accuracyPercent).toBe(60); // 3 matched out of 5 expected

      // 10. Approve
      const approved = engine.approveCycleCount(cc.id, 'manager');
      expect(approved.success).toBe(true);
      expect(approved.data!.status).toBe('completed');

      // 11. Verify stats
      const stats = engine.getReconciliationStats(TENANT_ID);
      expect(stats.totalCycleCounts).toBe(1);
      expect(stats.completedCycleCounts).toBe(1);
      expect(stats.totalVariances).toBe(2);
      expect(stats.resolvedVariances).toBe(2); // both resolved
      expect(stats.totalAdjustments).toBe(1);
      expect(stats.approvedAdjustments).toBe(1);
    });
  });
});
