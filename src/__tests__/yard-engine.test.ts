import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YardEngine } from '../yard/yard-engine';
import { uuid, TENANT_ID, FACILITY_ID } from './test-utils';

// Mock container engine — createWorkOrder calls getContainerEngine().getContainer()
const mockContainer = {
  id: 'ctr-mock-001',
  tenantId: TENANT_ID,
  facilityId: FACILITY_ID,
  containerNumber: 'MSCU1234567',
  size: '40',
  isoType: '42G1',
  grossWeight: 25000,
  status: 'grounded',
};

vi.mock('../containers/container-engine', () => ({
  getContainerEngine: () => ({
    getContainer: (id: string) => (id === mockContainer.id ? mockContainer : undefined),
    getContainerByNumber: (num: string) => (num === mockContainer.containerNumber ? mockContainer : undefined),
    getContainersByFacility: () => [],
  }),
}));

// Mock facility manager — recommendSlot uses it
vi.mock('../facility/facility-manager', () => ({
  getFacilityManager: () => ({
    getAvailableSlots: () => [],
    getBlock: () => undefined,
    getBlocksByFacility: () => [],
    getZonesByFacility: () => [],
    getFacilityStats: () => null,
  }),
}));

function makeWorkOrderInput(overrides: Record<string, unknown> = {}) {
  return {
    containerId: mockContainer.id,
    orderType: 'grounding' as const,
    fromLocation: { facilityId: FACILITY_ID, blockId: uuid(), row: 1, slot: 1, tier: 1, fullPath: 'A-01-01-1' },
    toLocation: { facilityId: FACILITY_ID, blockId: uuid(), row: 2, slot: 3, tier: 1, fullPath: 'B-02-03-1' },
    priority: 5,
    isUrgent: false,
    instructions: 'Standard grounding',
    estimatedDuration: 15,
    ...overrides,
  };
}

describe('YardEngine', () => {
  let engine: YardEngine;

  beforeEach(() => {
    engine = new YardEngine();
  });

  // =========================================================================
  // WORK ORDER CRUD
  // =========================================================================

  describe('Work order creation', () => {
    it('creates a work order successfully', () => {
      const res = engine.createWorkOrder(makeWorkOrderInput());
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('pending');
      expect(res.data!.workOrderNumber).toMatch(/^WO-/);
      expect(res.data!.containerNumber).toBe('MSCU1234567');
    });

    it('returns error for non-existent container', () => {
      const res = engine.createWorkOrder(makeWorkOrderInput({ containerId: uuid() }));
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('CONTAINER_NOT_FOUND');
    });

    it('retrieves work order by id', () => {
      const wo = engine.createWorkOrder(makeWorkOrderInput()).data!;
      expect(engine.getWorkOrder(wo.id)).toBeDefined();
      expect(engine.getWorkOrder(wo.id)!.orderType).toBe('grounding');
    });

    it('returns undefined for unknown work order', () => {
      expect(engine.getWorkOrder(uuid())).toBeUndefined();
    });
  });

  // =========================================================================
  // WORK ORDER QUERIES
  // =========================================================================

  describe('Work order queries', () => {
    it('lists work orders by facility', () => {
      engine.createWorkOrder(makeWorkOrderInput());
      engine.createWorkOrder(makeWorkOrderInput());
      expect(engine.getWorkOrdersByFacility(FACILITY_ID).length).toBe(2);
    });

    it('filters work orders by status', () => {
      engine.createWorkOrder(makeWorkOrderInput());
      expect(engine.getWorkOrdersByFacility(FACILITY_ID, 'pending').length).toBe(1);
      expect(engine.getWorkOrdersByFacility(FACILITY_ID, 'in_progress').length).toBe(0);
    });

    it('returns empty array for unknown facility', () => {
      expect(engine.getWorkOrdersByFacility(uuid()).length).toBe(0);
    });

    it('lists pending work orders sorted by urgency then priority', () => {
      engine.createWorkOrder(makeWorkOrderInput({ priority: 3 }));
      engine.createWorkOrder(makeWorkOrderInput({ priority: 8, isUrgent: true }));
      engine.createWorkOrder(makeWorkOrderInput({ priority: 10 }));
      const pending = engine.getPendingWorkOrders(FACILITY_ID);
      expect(pending.length).toBe(3);
      // Urgent first
      expect(pending[0]!.isUrgent).toBe(true);
    });
  });

  // =========================================================================
  // WORK ORDER STATE TRANSITIONS
  // =========================================================================

  describe('Work order state transitions', () => {
    it('assigns a work order', () => {
      const wo = engine.createWorkOrder(makeWorkOrderInput()).data!;
      const equipId = uuid();
      const opId = uuid();
      const res = engine.assignWorkOrder(wo.id, equipId, opId);
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('assigned');
      expect(res.data!.assignedEquipmentId).toBe(equipId);
      expect(res.data!.assignedOperatorId).toBe(opId);
    });

    it('rejects assigning non-existent work order', () => {
      const res = engine.assignWorkOrder(uuid(), uuid());
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('starts a work order', () => {
      const wo = engine.createWorkOrder(makeWorkOrderInput()).data!;
      engine.assignWorkOrder(wo.id, uuid());
      const res = engine.startWorkOrder(wo.id);
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('in_progress');
      expect(res.data!.startedAt).toBeDefined();
    });

    it('rejects starting unassigned work order', () => {
      const wo = engine.createWorkOrder(makeWorkOrderInput()).data!;
      const res = engine.startWorkOrder(wo.id);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('completes a work order', () => {
      const wo = engine.createWorkOrder(makeWorkOrderInput()).data!;
      engine.assignWorkOrder(wo.id, uuid());
      engine.startWorkOrder(wo.id);
      const res = engine.completeWorkOrder(wo.id, 'Done successfully');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('completed');
      expect(res.data!.completedAt).toBeDefined();
      expect(res.data!.completionNotes).toBe('Done successfully');
    });

    it('rejects completing non-started work order', () => {
      const wo = engine.createWorkOrder(makeWorkOrderInput()).data!;
      const res = engine.completeWorkOrder(wo.id);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('cancels a work order', () => {
      const wo = engine.createWorkOrder(makeWorkOrderInput()).data!;
      const res = engine.cancelWorkOrder(wo.id, 'No longer needed');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('cancelled');
      expect(res.data!.failureReason).toBe('No longer needed');
    });

    it('rejects cancelling completed work order', () => {
      const wo = engine.createWorkOrder(makeWorkOrderInput()).data!;
      engine.assignWorkOrder(wo.id, uuid());
      engine.startWorkOrder(wo.id);
      engine.completeWorkOrder(wo.id);
      const res = engine.cancelWorkOrder(wo.id, 'Too late');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('removes from pending index after assignment', () => {
      engine.createWorkOrder(makeWorkOrderInput());
      const wo2 = engine.createWorkOrder(makeWorkOrderInput()).data!;
      expect(engine.getPendingWorkOrders(FACILITY_ID).length).toBe(2);
      engine.assignWorkOrder(wo2.id, uuid());
      expect(engine.getPendingWorkOrders(FACILITY_ID).length).toBe(1);
    });
  });

  // =========================================================================
  // SLOT RECOMMENDATIONS
  // =========================================================================

  describe('Slot recommendations', () => {
    it('returns empty when no slots available', () => {
      const recommendations = engine.recommendSlot(FACILITY_ID, mockContainer as any);
      expect(recommendations).toEqual([]);
    });
  });

  // =========================================================================
  // YARD OCCUPANCY
  // =========================================================================

  describe('Yard occupancy', () => {
    it('returns occupancy data for a facility', () => {
      const occupancy = engine.getYardOccupancy(FACILITY_ID);
      expect(occupancy).toBeDefined();
      expect(occupancy.facilityId).toBe(FACILITY_ID);
    });
  });
});
