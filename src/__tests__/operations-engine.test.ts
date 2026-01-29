import { describe, it, expect, beforeEach } from 'vitest';
import { OperationsEngine } from '../operations/operations-engine';
import type {
  CreateStuffingInput,
  CreateDestuffingInput,
  CreateConsolidationInput,
  AddConsignmentInput,
  CreateFCLOperationInput,
  CreateCrossDockInput,
  CreateInspectionInput,
} from '../operations/operations-engine';
import { uuid, TENANT_ID, FACILITY_ID } from './test-utils';

// =============================================================================
// Input Factories
// =============================================================================

function makeStuffingInput(overrides: Partial<CreateStuffingInput> = {}): CreateStuffingInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    containerId: uuid(),
    containerNumber: 'MSCU1234567',
    containerSize: '40',
    containerType: 'GP',
    isoType: '42G1',
    stuffingType: 'full_stuffing',
    cargoItems: [
      {
        id: uuid(),
        description: 'Electronics',
        hsCode: '8471',
        cargoType: 'general',
        packagingType: 'carton',
        quantity: 100,
        grossWeight: 5000,
        weightUnit: 'kg',
      },
    ],
    warehouseId: uuid(),
    bookingRef: 'BK-001',
    ...overrides,
  };
}

function makeDestuffingInput(overrides: Partial<CreateDestuffingInput> = {}): CreateDestuffingInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    containerId: uuid(),
    containerNumber: 'MSCU1234568',
    containerSize: '20',
    destuffingType: 'full_destuffing',
    blNumber: 'BL-001',
    totalPackagesExpected: 500,
    totalGrossWeightExpected: 15000,
    ...overrides,
  };
}

function makeConsolidationInput(overrides: Partial<CreateConsolidationInput> = {}): CreateConsolidationInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    containerSize: '40',
    containerType: 'GP',
    portOfLoading: 'INNSA',
    portOfDischarge: 'AEJEA',
    maxWeight: 28000,
    maxVolume: 67,
    ...overrides,
  };
}

function makeConsignmentInput(consolidationId: string, overrides: Partial<AddConsignmentInput> = {}): AddConsignmentInput {
  return {
    consolidationId,
    consignmentNumber: 'LCL-001',
    shipperId: uuid(),
    shipperName: 'ABC Exports',
    consigneeName: 'XYZ Imports',
    cargoItems: [
      {
        id: uuid(),
        description: 'Textiles',
        cargoType: 'general',
        packagingType: 'bale',
        quantity: 50,
        grossWeight: 2000,
        weightUnit: 'kg',
        volume: 10,
        volumeUnit: 'cbm',
      },
    ],
    packages: 50,
    grossWeight: 2000,
    volume: 10,
    ...overrides,
  };
}

function makeFCLInput(overrides: Partial<CreateFCLOperationInput> = {}): CreateFCLOperationInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    containerId: uuid(),
    containerNumber: 'MSCU1234569',
    containerSize: '40',
    operationType: 'import_delivery',
    fromLocation: 'Yard-A',
    toLocation: 'Gate-1',
    transportMode: 'road',
    ...overrides,
  };
}

function makeCrossDockInput(overrides: Partial<CreateCrossDockInput> = {}): CreateCrossDockInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    inboundTransportMode: 'road',
    outboundTransportMode: 'rail',
    ...overrides,
  };
}

function makeInspectionInput(overrides: Partial<CreateInspectionInput> = {}): CreateInspectionInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    inspectionType: 'pre_stuffing',
    containerId: uuid(),
    containerNumber: 'MSCU1234570',
    inspectorId: uuid(),
    inspectorName: 'Inspector Singh',
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('OperationsEngine', () => {
  let engine: OperationsEngine;

  beforeEach(() => {
    engine = new OperationsEngine();
  });

  // ===========================================================================
  // 1. STUFFING
  // ===========================================================================
  describe('Stuffing', () => {
    it('creates a stuffing operation with status planned', () => {
      const res = engine.createStuffing(makeStuffingInput());
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data!.status).toBe('planned');
      expect(res.data!.stuffingType).toBe('full_stuffing');
      expect(res.data!.operationNumber).toMatch(/^STF-/);
      expect(res.data!.containerNumber).toBe('MSCU1234567');
    });

    it('retrieves a stuffing operation by id', () => {
      const created = engine.createStuffing(makeStuffingInput()).data!;
      const fetched = engine.getStuffing(created.id);
      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(created.id);
      expect(fetched!.bookingRef).toBe('BK-001');
    });

    it('returns undefined for unknown stuffing id', () => {
      expect(engine.getStuffing(uuid())).toBeUndefined();
    });

    it('lists stuffing operations filtered by tenant', () => {
      engine.createStuffing(makeStuffingInput());
      engine.createStuffing(makeStuffingInput({ tenantId: 'other-tenant' }));
      const list = engine.listStuffingOps({ tenantId: TENANT_ID });
      expect(list.length).toBe(1);
    });

    it('lists stuffing operations filtered by status', () => {
      const op = engine.createStuffing(makeStuffingInput()).data!;
      engine.startStuffing(op.id);
      engine.createStuffing(makeStuffingInput());
      const inProgress = engine.listStuffingOps({ status: 'in_progress' });
      expect(inProgress.length).toBe(1);
      expect(inProgress[0]!.id).toBe(op.id);
    });

    it('calculates cargo totals on creation', () => {
      const res = engine.createStuffing(makeStuffingInput());
      expect(res.data!.totalPackages).toBe(100);
      expect(res.data!.totalGrossWeight).toBe(5000);
    });

    it('transitions from planned to in_progress via startStuffing', () => {
      const op = engine.createStuffing(makeStuffingInput()).data!;
      const res = engine.startStuffing(op.id);
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('in_progress');
      expect(res.data!.actualStartTime).toBeDefined();
    });

    it('transitions from in_progress to completed via completeStuffing', () => {
      const op = engine.createStuffing(makeStuffingInput()).data!;
      engine.startStuffing(op.id);
      const res = engine.completeStuffing(op.id, 'SEAL-12345');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('completed');
      expect(res.data!.sealNumber).toBe('SEAL-12345');
      expect(res.data!.actualEndTime).toBeDefined();
    });

    it('transitions from in_progress to paused', () => {
      const op = engine.createStuffing(makeStuffingInput()).data!;
      engine.startStuffing(op.id);
      const res = engine.pauseStuffing(op.id, 'Rain delay');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('paused');
      expect(res.data!.pauseHistory!.length).toBe(1);
      expect(res.data!.pauseHistory![0]!.reason).toBe('Rain delay');
    });

    it('resumes from paused to in_progress', () => {
      const op = engine.createStuffing(makeStuffingInput()).data!;
      engine.startStuffing(op.id);
      engine.pauseStuffing(op.id, 'Break');
      const res = engine.startStuffing(op.id);
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('in_progress');
    });

    it('cancels a planned stuffing operation', () => {
      const op = engine.createStuffing(makeStuffingInput()).data!;
      const res = engine.cancelStuffing(op.id, 'Booking cancelled');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('cancelled');
    });

    it('rejects starting a completed stuffing', () => {
      const op = engine.createStuffing(makeStuffingInput()).data!;
      engine.startStuffing(op.id);
      engine.completeStuffing(op.id);
      const res = engine.startStuffing(op.id);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('rejects completing a planned stuffing (must be in_progress)', () => {
      const op = engine.createStuffing(makeStuffingInput()).data!;
      const res = engine.completeStuffing(op.id);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('rejects cancelling a completed stuffing', () => {
      const op = engine.createStuffing(makeStuffingInput()).data!;
      engine.startStuffing(op.id);
      engine.completeStuffing(op.id);
      const res = engine.cancelStuffing(op.id, 'Too late');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('returns NOT_FOUND for startStuffing with unknown id', () => {
      const res = engine.startStuffing(uuid());
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('rejects pausing a planned stuffing', () => {
      const op = engine.createStuffing(makeStuffingInput()).data!;
      const res = engine.pauseStuffing(op.id, 'reason');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ===========================================================================
  // 2. DESTUFFING
  // ===========================================================================
  describe('Destuffing', () => {
    it('creates a destuffing operation with status planned', () => {
      const res = engine.createDestuffing(makeDestuffingInput());
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('planned');
      expect(res.data!.destuffingType).toBe('full_destuffing');
      expect(res.data!.operationNumber).toMatch(/^DST-/);
      expect(res.data!.totalPackagesExpected).toBe(500);
    });

    it('retrieves a destuffing operation by id', () => {
      const created = engine.createDestuffing(makeDestuffingInput()).data!;
      const fetched = engine.getDestuffing(created.id);
      expect(fetched).toBeDefined();
      expect(fetched!.blNumber).toBe('BL-001');
    });

    it('returns undefined for unknown destuffing id', () => {
      expect(engine.getDestuffing(uuid())).toBeUndefined();
    });

    it('lists destuffing operations with filter', () => {
      engine.createDestuffing(makeDestuffingInput());
      engine.createDestuffing(makeDestuffingInput({ tenantId: 'other' }));
      const list = engine.listDestuffingOps({ tenantId: TENANT_ID });
      expect(list.length).toBe(1);
    });

    it('transitions planned -> in_progress via startDestuffing', () => {
      const op = engine.createDestuffing(makeDestuffingInput()).data!;
      const res = engine.startDestuffing(op.id, true);
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('in_progress');
      expect(res.data!.actualStartTime).toBeDefined();
      expect(res.data!.sealIntact).toBe(true);
      expect(res.data!.sealVerified).toBe(true);
    });

    it('transitions in_progress -> completed via completeDestuffing', () => {
      const op = engine.createDestuffing(makeDestuffingInput()).data!;
      engine.startDestuffing(op.id);
      const res = engine.completeDestuffing(op.id);
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('completed');
      expect(res.data!.actualEndTime).toBeDefined();
    });

    it('detects package shortage on completion', () => {
      const op = engine.createDestuffing(makeDestuffingInput({ totalPackagesExpected: 100 })).data!;
      engine.startDestuffing(op.id);
      // Record only 80 packages received
      engine.recordCargoReceived(op.id, {
        id: uuid(),
        description: 'Goods',
        cargoType: 'general',
        packagingType: 'carton',
        quantity: 80,
        grossWeight: 15000,
        weightUnit: 'kg',
      });
      const res = engine.completeDestuffing(op.id);
      expect(res.data!.hasDiscrepancy).toBe(true);
      expect(res.data!.shortages.length).toBe(1);
      expect(res.data!.shortages[0]!.difference).toBe(20);
    });

    it('detects package excess on completion', () => {
      const op = engine.createDestuffing(makeDestuffingInput({ totalPackagesExpected: 50 })).data!;
      engine.startDestuffing(op.id);
      engine.recordCargoReceived(op.id, {
        id: uuid(),
        description: 'Goods',
        cargoType: 'general',
        packagingType: 'carton',
        quantity: 60,
        grossWeight: 15000,
        weightUnit: 'kg',
      });
      const res = engine.completeDestuffing(op.id);
      expect(res.data!.hasDiscrepancy).toBe(true);
      expect(res.data!.excesses.length).toBe(1);
      expect(res.data!.excesses[0]!.difference).toBe(10);
    });

    it('rejects starting an already in_progress destuffing', () => {
      const op = engine.createDestuffing(makeDestuffingInput()).data!;
      engine.startDestuffing(op.id);
      const res = engine.startDestuffing(op.id);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('rejects completing a planned destuffing', () => {
      const op = engine.createDestuffing(makeDestuffingInput()).data!;
      const res = engine.completeDestuffing(op.id);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('returns NOT_FOUND for unknown destuffing id', () => {
      const res = engine.startDestuffing(uuid());
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });
  });

  // ===========================================================================
  // 3. LCL CONSOLIDATION
  // ===========================================================================
  describe('LCL Consolidation', () => {
    it('creates a consolidation with status open', () => {
      const res = engine.createConsolidation(makeConsolidationInput());
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('open');
      expect(res.data!.consolidationNumber).toMatch(/^LCL-/);
      expect(res.data!.maxWeight).toBe(28000);
      expect(res.data!.maxVolume).toBe(67);
      expect(res.data!.portOfLoading).toBe('INNSA');
    });

    it('retrieves a consolidation by id', () => {
      const created = engine.createConsolidation(makeConsolidationInput()).data!;
      const fetched = engine.getConsolidation(created.id);
      expect(fetched).toBeDefined();
      expect(fetched!.portOfDischarge).toBe('AEJEA');
    });

    it('returns undefined for unknown consolidation id', () => {
      expect(engine.getConsolidation(uuid())).toBeUndefined();
    });

    it('lists consolidations filtered by status', () => {
      engine.createConsolidation(makeConsolidationInput());
      engine.createConsolidation(makeConsolidationInput());
      const list = engine.listConsolidations({ status: 'open' });
      expect(list.length).toBe(2);
    });

    it('adds a consignment and transitions open -> in_progress', () => {
      const consol = engine.createConsolidation(makeConsolidationInput()).data!;
      const res = engine.addConsignment(makeConsignmentInput(consol.id));
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('in_progress');
      expect(res.data!.totalConsignments).toBe(1);
      expect(res.data!.totalPackages).toBe(50);
      expect(res.data!.totalWeight).toBe(2000);
      expect(res.data!.totalVolume).toBe(10);
    });

    it('rejects consignment if weight exceeds capacity', () => {
      const consol = engine.createConsolidation(makeConsolidationInput({ maxWeight: 1000 })).data!;
      const res = engine.addConsignment(makeConsignmentInput(consol.id, { grossWeight: 1500 }));
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('OVER_WEIGHT');
    });

    it('rejects consignment if volume exceeds capacity', () => {
      const consol = engine.createConsolidation(makeConsolidationInput({ maxVolume: 5 })).data!;
      const res = engine.addConsignment(makeConsignmentInput(consol.id, { volume: 10 }));
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('OVER_VOLUME');
    });

    it('closes a consolidation with consignments', () => {
      const consol = engine.createConsolidation(makeConsolidationInput()).data!;
      engine.addConsignment(makeConsignmentInput(consol.id));
      const containerId = uuid();
      const res = engine.closeConsolidation(consol.id, containerId, 'MSCU9999999', 'MBL-001');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('stuffed');
      expect(res.data!.containerId).toBe(containerId);
      expect(res.data!.containerNumber).toBe('MSCU9999999');
      expect(res.data!.masterBlNumber).toBe('MBL-001');
      expect(res.data!.stuffingDate).toBeDefined();
    });

    it('rejects closing an empty consolidation', () => {
      const consol = engine.createConsolidation(makeConsolidationInput()).data!;
      const res = engine.closeConsolidation(consol.id, uuid(), 'MSCU9999999');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('EMPTY');
    });

    it('returns NOT_FOUND for unknown consolidation on addConsignment', () => {
      const res = engine.addConsignment(makeConsignmentInput(uuid()));
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('calculates utilization percentages correctly', () => {
      const consol = engine.createConsolidation(makeConsolidationInput({ maxWeight: 10000, maxVolume: 50 })).data!;
      engine.addConsignment(makeConsignmentInput(consol.id, { grossWeight: 5000, volume: 25 }));
      const fetched = engine.getConsolidation(consol.id)!;
      expect(fetched.weightUtilization).toBe(50);
      expect(fetched.volumeUtilization).toBe(50);
    });
  });

  // ===========================================================================
  // 4. FCL OPERATIONS
  // ===========================================================================
  describe('FCL Operations', () => {
    it('creates an FCL operation with status pending', () => {
      const res = engine.createFCLOperation(makeFCLInput());
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('pending');
      expect(res.data!.operationNumber).toMatch(/^FCL-/);
      expect(res.data!.operationType).toBe('import_delivery');
      expect(res.data!.fromLocation).toBe('Yard-A');
      expect(res.data!.toLocation).toBe('Gate-1');
    });

    it('retrieves an FCL operation by id', () => {
      const created = engine.createFCLOperation(makeFCLInput()).data!;
      const fetched = engine.getFCLOperation(created.id);
      expect(fetched).toBeDefined();
      expect(fetched!.transportMode).toBe('road');
    });

    it('returns undefined for unknown FCL id', () => {
      expect(engine.getFCLOperation(uuid())).toBeUndefined();
    });

    it('lists FCL operations filtered by operationType', () => {
      engine.createFCLOperation(makeFCLInput({ operationType: 'import_delivery' }));
      engine.createFCLOperation(makeFCLInput({ operationType: 'repo_in' }));
      const list = engine.listFCLOperations({ operationType: 'import_delivery' });
      expect(list.length).toBe(1);
    });

    it('transitions pending -> in_progress via startFCLOperation', () => {
      const op = engine.createFCLOperation(makeFCLInput()).data!;
      const res = engine.startFCLOperation(op.id);
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('in_progress');
    });

    it('transitions in_progress -> completed via completeFCLOperation', () => {
      const op = engine.createFCLOperation(makeFCLInput()).data!;
      engine.startFCLOperation(op.id);
      const res = engine.completeFCLOperation(op.id, 'Delivered successfully');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('completed');
      expect(res.data!.completedDate).toBeDefined();
      expect(res.data!.remarks).toBe('Delivered successfully');
    });

    it('rejects starting a non-pending FCL operation', () => {
      const op = engine.createFCLOperation(makeFCLInput()).data!;
      engine.startFCLOperation(op.id);
      const res = engine.startFCLOperation(op.id);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('rejects completing a pending FCL operation', () => {
      const op = engine.createFCLOperation(makeFCLInput()).data!;
      const res = engine.completeFCLOperation(op.id);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('returns NOT_FOUND for startFCLOperation with unknown id', () => {
      const res = engine.startFCLOperation(uuid());
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });
  });

  // ===========================================================================
  // 5. CROSS-DOCK
  // ===========================================================================
  describe('Cross-Dock', () => {
    it('creates a cross-dock operation with status planned', () => {
      const res = engine.createCrossDock(makeCrossDockInput());
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('planned');
      expect(res.data!.operationNumber).toMatch(/^XDK-/);
      expect(res.data!.inboundTransportMode).toBe('road');
      expect(res.data!.outboundTransportMode).toBe('rail');
    });

    it('retrieves a cross-dock operation by id', () => {
      const created = engine.createCrossDock(makeCrossDockInput()).data!;
      const fetched = engine.getCrossDock(created.id);
      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(created.id);
    });

    it('returns undefined for unknown cross-dock id', () => {
      expect(engine.getCrossDock(uuid())).toBeUndefined();
    });

    it('lists cross-dock operations filtered by status', () => {
      engine.createCrossDock(makeCrossDockInput());
      engine.createCrossDock(makeCrossDockInput());
      const list = engine.listCrossDocks({ status: 'planned' });
      expect(list.length).toBe(2);
    });

    it('transitions planned -> receiving via receiveCrossDock', () => {
      const op = engine.createCrossDock(makeCrossDockInput()).data!;
      const res = engine.receiveCrossDock(op.id);
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('receiving');
      expect(res.data!.receivedAt).toBeDefined();
    });

    it('transitions receiving -> sorting via sortCrossDock', () => {
      const op = engine.createCrossDock(makeCrossDockInput()).data!;
      engine.receiveCrossDock(op.id);
      const res = engine.sortCrossDock(op.id);
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('sorting');
      expect(res.data!.sortedAt).toBeDefined();
    });

    it('transitions sorting -> completed via dispatchCrossDock', () => {
      const op = engine.createCrossDock(makeCrossDockInput()).data!;
      engine.receiveCrossDock(op.id);
      engine.sortCrossDock(op.id);
      const res = engine.dispatchCrossDock(op.id, 'TRLU7654321');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('completed');
      expect(res.data!.dispatchedAt).toBeDefined();
      expect(res.data!.outboundContainerNumber).toBe('TRLU7654321');
    });

    it('calculates dwell time on dispatch', () => {
      const op = engine.createCrossDock(makeCrossDockInput()).data!;
      engine.receiveCrossDock(op.id);
      engine.sortCrossDock(op.id);
      const res = engine.dispatchCrossDock(op.id);
      expect(res.data!.dwellTimeMinutes).toBeDefined();
      expect(typeof res.data!.dwellTimeMinutes).toBe('number');
    });

    it('returns NOT_FOUND for receiveCrossDock with unknown id', () => {
      const res = engine.receiveCrossDock(uuid());
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('returns NOT_FOUND for sortCrossDock with unknown id', () => {
      const res = engine.sortCrossDock(uuid());
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('returns NOT_FOUND for dispatchCrossDock with unknown id', () => {
      const res = engine.dispatchCrossDock(uuid());
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });
  });

  // ===========================================================================
  // 6. INSPECTION
  // ===========================================================================
  describe('Inspection', () => {
    it('creates an inspection with status scheduled', () => {
      const res = engine.createInspection(makeInspectionInput());
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('scheduled');
      expect(res.data!.result).toBe('pending');
      expect(res.data!.inspectionNumber).toMatch(/^INS-/);
      expect(res.data!.inspectionType).toBe('pre_stuffing');
      expect(res.data!.inspectorName).toBe('Inspector Singh');
    });

    it('retrieves an inspection by id', () => {
      const created = engine.createInspection(makeInspectionInput()).data!;
      const fetched = engine.getInspection(created.id);
      expect(fetched).toBeDefined();
      expect(fetched!.inspectionType).toBe('pre_stuffing');
    });

    it('returns undefined for unknown inspection id', () => {
      expect(engine.getInspection(uuid())).toBeUndefined();
    });

    it('lists inspections filtered by inspectionType', () => {
      engine.createInspection(makeInspectionInput({ inspectionType: 'pre_stuffing' }));
      engine.createInspection(makeInspectionInput({ inspectionType: 'customs' }));
      const list = engine.listInspections({ inspectionType: 'pre_stuffing' });
      expect(list.length).toBe(1);
    });

    it('transitions scheduled -> in_progress via startInspection', () => {
      const insp = engine.createInspection(makeInspectionInput()).data!;
      const res = engine.startInspection(insp.id);
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('in_progress');
      expect(res.data!.startedAt).toBeDefined();
    });

    it('transitions in_progress -> completed with pass result', () => {
      const insp = engine.createInspection(makeInspectionInput()).data!;
      engine.startInspection(insp.id);
      const res = engine.completeInspection(insp.id, 'pass', 'Container in good condition');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('completed');
      expect(res.data!.result).toBe('pass');
      expect(res.data!.findings).toBe('Container in good condition');
      expect(res.data!.completedAt).toBeDefined();
    });

    it('transitions in_progress -> completed with fail result', () => {
      const insp = engine.createInspection(makeInspectionInput()).data!;
      engine.startInspection(insp.id);
      const res = engine.completeInspection(insp.id, 'fail', 'Structural damage found');
      expect(res.success).toBe(true);
      expect(res.data!.result).toBe('fail');
      expect(res.data!.findings).toBe('Structural damage found');
    });

    it('records weight variance on completion', () => {
      const insp = engine.createInspection(makeInspectionInput({ declaredWeight: 10000 })).data!;
      engine.startInspection(insp.id);
      const res = engine.completeInspection(insp.id, 'pass', 'OK', 10500);
      expect(res.data!.actualWeight).toBe(10500);
      expect(res.data!.weightVariance).toBe(500);
    });

    it('rejects starting a non-scheduled inspection', () => {
      const insp = engine.createInspection(makeInspectionInput()).data!;
      engine.startInspection(insp.id);
      const res = engine.startInspection(insp.id);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('rejects completing a scheduled inspection (must be in_progress)', () => {
      const insp = engine.createInspection(makeInspectionInput()).data!;
      const res = engine.completeInspection(insp.id, 'pass', 'OK');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('returns NOT_FOUND for startInspection with unknown id', () => {
      const res = engine.startInspection(uuid());
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('adds checklist items and recalculates pass/fail counts', () => {
      const insp = engine.createInspection(makeInspectionInput()).data!;
      engine.addChecklistItem(insp.id, {
        id: uuid(),
        category: 'Structure',
        description: 'Floor integrity',
        result: 'pass',
      });
      engine.addChecklistItem(insp.id, {
        id: uuid(),
        category: 'Structure',
        description: 'Wall integrity',
        result: 'fail',
        remarks: 'Hole in left wall',
      });
      engine.addChecklistItem(insp.id, {
        id: uuid(),
        category: 'Doors',
        description: 'Door operation',
        result: 'pass',
      });
      const fetched = engine.getInspection(insp.id)!;
      expect(fetched.totalItems).toBe(3);
      expect(fetched.passedItems).toBe(2);
      expect(fetched.failedItems).toBe(1);
    });
  });

  // ===========================================================================
  // 7. OPERATIONS STATS
  // ===========================================================================
  describe('Operations Stats', () => {
    it('returns zero stats for a tenant with no operations', () => {
      const stats = engine.getOperationsStats(TENANT_ID);
      expect(stats.date).toBeDefined();
      expect(stats.stuffing.planned).toBe(0);
      expect(stats.stuffing.inProgress).toBe(0);
      expect(stats.stuffing.completed).toBe(0);
      expect(stats.stuffing.cancelled).toBe(0);
      expect(stats.destuffing.planned).toBe(0);
      expect(stats.destuffing.discrepancyRate).toBe(0);
      expect(stats.lcl.openConsolidations).toBe(0);
      expect(stats.fcl.pending).toBe(0);
      expect(stats.crossDock.active).toBe(0);
      expect(stats.inspections.scheduled).toBe(0);
      expect(stats.inspections.passRate).toBe(0);
    });

    it('counts stuffing operations by status', () => {
      engine.createStuffing(makeStuffingInput());
      const op2 = engine.createStuffing(makeStuffingInput()).data!;
      engine.startStuffing(op2.id);
      const op3 = engine.createStuffing(makeStuffingInput()).data!;
      engine.cancelStuffing(op3.id, 'Cancelled');

      const stats = engine.getOperationsStats(TENANT_ID);
      expect(stats.stuffing.planned).toBe(1);
      expect(stats.stuffing.inProgress).toBe(1);
      expect(stats.stuffing.cancelled).toBe(1);
    });

    it('counts destuffing operations and discrepancy rate', () => {
      // Completed destuffing with discrepancy
      const op1 = engine.createDestuffing(makeDestuffingInput({ totalPackagesExpected: 100 })).data!;
      engine.startDestuffing(op1.id);
      engine.recordCargoReceived(op1.id, {
        id: uuid(),
        description: 'Goods',
        cargoType: 'general',
        packagingType: 'carton',
        quantity: 80,
        grossWeight: 15000,
        weightUnit: 'kg',
      });
      engine.completeDestuffing(op1.id);

      // Completed destuffing without discrepancy
      const op2 = engine.createDestuffing(makeDestuffingInput({ totalPackagesExpected: 50, totalGrossWeightExpected: 5000 })).data!;
      engine.startDestuffing(op2.id);
      engine.recordCargoReceived(op2.id, {
        id: uuid(),
        description: 'Goods',
        cargoType: 'general',
        packagingType: 'carton',
        quantity: 50,
        grossWeight: 5000,
        weightUnit: 'kg',
      });
      engine.completeDestuffing(op2.id);

      const stats = engine.getOperationsStats(TENANT_ID);
      expect(stats.destuffing.completed).toBe(2);
      expect(stats.destuffing.discrepancyRate).toBe(50); // 1 out of 2
    });

    it('counts LCL consolidation stats', () => {
      const c1 = engine.createConsolidation(makeConsolidationInput()).data!;
      engine.addConsignment(makeConsignmentInput(c1.id));
      engine.closeConsolidation(c1.id, uuid(), 'MSCU0000001');

      const c2 = engine.createConsolidation(makeConsolidationInput()).data!;
      engine.addConsignment(makeConsignmentInput(c2.id, { consignmentNumber: 'LCL-002' }));

      const stats = engine.getOperationsStats(TENANT_ID);
      expect(stats.lcl.containersStuffed).toBe(1);
      expect(stats.lcl.openConsolidations).toBe(1);
      expect(stats.lcl.consignmentsReceived).toBe(2);
    });

    it('counts FCL operations by type', () => {
      engine.createFCLOperation(makeFCLInput({ operationType: 'import_delivery' }));
      engine.createFCLOperation(makeFCLInput({ operationType: 'import_delivery' }));
      engine.createFCLOperation(makeFCLInput({ operationType: 'repo_in' }));
      const op = engine.createFCLOperation(makeFCLInput({ operationType: 'transshipment' })).data!;
      engine.startFCLOperation(op.id);
      engine.completeFCLOperation(op.id);

      const stats = engine.getOperationsStats(TENANT_ID);
      expect(stats.fcl.pending).toBe(3);
      expect(stats.fcl.completed).toBe(1);
      expect(stats.fcl.byType['import_delivery']).toBe(2);
      expect(stats.fcl.byType['repo_in']).toBe(1);
      expect(stats.fcl.byType['transshipment']).toBe(1);
    });

    it('counts cross-dock active and completed operations', () => {
      const op1 = engine.createCrossDock(makeCrossDockInput()).data!;
      engine.receiveCrossDock(op1.id);
      engine.sortCrossDock(op1.id);
      engine.dispatchCrossDock(op1.id);

      const op2 = engine.createCrossDock(makeCrossDockInput()).data!;
      engine.receiveCrossDock(op2.id);

      const stats = engine.getOperationsStats(TENANT_ID);
      expect(stats.crossDock.completed).toBe(1);
      expect(stats.crossDock.active).toBe(1);
    });

    it('counts inspection pass and fail rates', () => {
      // Pass
      const i1 = engine.createInspection(makeInspectionInput()).data!;
      engine.startInspection(i1.id);
      engine.completeInspection(i1.id, 'pass', 'Good');

      // Fail
      const i2 = engine.createInspection(makeInspectionInput()).data!;
      engine.startInspection(i2.id);
      engine.completeInspection(i2.id, 'fail', 'Bad');

      // Conditional pass
      const i3 = engine.createInspection(makeInspectionInput()).data!;
      engine.startInspection(i3.id);
      engine.completeInspection(i3.id, 'conditional_pass', 'Minor issues');

      // Scheduled (not counted in rates)
      engine.createInspection(makeInspectionInput());

      const stats = engine.getOperationsStats(TENANT_ID);
      expect(stats.inspections.scheduled).toBe(1);
      expect(stats.inspections.completed).toBe(3);
      // passRate includes pass + conditional_pass = 2/3 = 67%
      expect(stats.inspections.passRate).toBe(67);
      // failRate = 1/3 = 33%
      expect(stats.inspections.failRate).toBe(33);
    });

    it('isolates stats by tenant', () => {
      engine.createStuffing(makeStuffingInput({ tenantId: 'tenant-A' }));
      engine.createStuffing(makeStuffingInput({ tenantId: 'tenant-B' }));
      engine.createStuffing(makeStuffingInput({ tenantId: 'tenant-B' }));

      const statsA = engine.getOperationsStats('tenant-A');
      const statsB = engine.getOperationsStats('tenant-B');
      expect(statsA.stuffing.planned).toBe(1);
      expect(statsB.stuffing.planned).toBe(2);
    });
  });
});
