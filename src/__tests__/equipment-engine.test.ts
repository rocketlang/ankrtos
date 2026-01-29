import { describe, it, expect, beforeEach } from 'vitest';
import { EquipmentEngine } from '../equipment/equipment-engine';
import { makeEquipmentInput, uuid, TENANT_ID, FACILITY_ID } from './test-utils';

describe('EquipmentEngine', () => {
  let engine: EquipmentEngine;

  beforeEach(() => {
    EquipmentEngine.resetInstance();
    engine = EquipmentEngine.getInstance();
  });

  // --------------------------------------------------------------------------
  // Registration
  // --------------------------------------------------------------------------

  describe('registerEquipment', () => {
    it('should register new equipment and return success', () => {
      const input = makeEquipmentInput({ yearOfManufacture: 2022 });
      const result = engine.registerEquipment(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.equipmentNumber).toBe(input.equipmentNumber);
      expect(result.data!.type).toBe('rtg_crane');
      expect(result.data!.status).toBe('available');
      expect(result.data!.make).toBe('Kalmar');
      expect(result.data!.liftCapacity).toBe(45);
      expect(result.data!.fuelType).toBe('diesel');
    });

    it('should reject duplicate equipment numbers within the same tenant', () => {
      const input = makeEquipmentInput({ yearOfManufacture: 2022 });
      engine.registerEquipment(input);

      const duplicate = { ...input };
      const result = engine.registerEquipment(duplicate);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_EQUIPMENT');
    });
  });

  // --------------------------------------------------------------------------
  // Retrieval
  // --------------------------------------------------------------------------

  describe('getEquipment', () => {
    it('should return equipment by ID', () => {
      const reg = engine.registerEquipment(makeEquipmentInput({ yearOfManufacture: 2022 }));
      const equip = engine.getEquipment(reg.data!.id);

      expect(equip).toBeDefined();
      expect(equip!.id).toBe(reg.data!.id);
    });

    it('should return undefined for unknown ID', () => {
      expect(engine.getEquipment(uuid())).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // Listing
  // --------------------------------------------------------------------------

  describe('listEquipment', () => {
    it('should list equipment filtered by tenant', () => {
      engine.registerEquipment(makeEquipmentInput({ yearOfManufacture: 2022 }));
      engine.registerEquipment(makeEquipmentInput({ yearOfManufacture: 2021 }));
      engine.registerEquipment(makeEquipmentInput({ tenantId: 'other-tenant', yearOfManufacture: 2023 }));

      const result = engine.listEquipment({ tenantId: TENANT_ID });

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.page).toBe(1);
    });

    it('should filter by equipment type', () => {
      engine.registerEquipment(makeEquipmentInput({ type: 'RTG', yearOfManufacture: 2022 }));
      engine.registerEquipment(makeEquipmentInput({ type: 'REACH_STACKER', yearOfManufacture: 2022 }));

      const result = engine.listEquipment({ tenantId: TENANT_ID, type: 'RTG' });
      expect(result.total).toBe(1);
      expect(result.data[0].type).toBe('RTG');
    });

    it('should filter by status', () => {
      const reg = engine.registerEquipment(makeEquipmentInput({ yearOfManufacture: 2022 }));
      engine.registerEquipment(makeEquipmentInput({ yearOfManufacture: 2022 }));
      engine.updateStatus(reg.data!.id, 'maintenance');

      const result = engine.listEquipment({ tenantId: TENANT_ID, status: 'available' });
      expect(result.total).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // Status updates
  // --------------------------------------------------------------------------

  describe('updateStatus', () => {
    it('should update equipment status', () => {
      const reg = engine.registerEquipment(makeEquipmentInput({ yearOfManufacture: 2022 }));
      const result = engine.updateStatus(reg.data!.id, 'maintenance', 'scheduled service');

      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('maintenance');
    });

    it('should return error for unknown equipment', () => {
      const result = engine.updateStatus(uuid(), 'maintenance');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  // --------------------------------------------------------------------------
  // Assignment lifecycle
  // --------------------------------------------------------------------------

  describe('assignment lifecycle', () => {
    it('should assign equipment as a reservation and then release it', () => {
      const reg = engine.registerEquipment(makeEquipmentInput({ yearOfManufacture: 2022 }));
      const equipId = reg.data!.id;

      // Assign as reservation (bypasses checklist requirement)
      const assignResult = engine.assignEquipment({
        equipmentId: equipId,
        assignmentType: 'reservation',
        operatorId: uuid(),
      });

      expect(assignResult.success).toBe(true);
      expect(assignResult.data!.status).toBe('active');

      // Equipment should now be reserved
      const equip = engine.getEquipment(equipId);
      expect(equip!.status).toBe('reserved');

      // Release the assignment
      const releaseResult = engine.releaseEquipment(assignResult.data!.id, 25);
      expect(releaseResult.success).toBe(true);
      expect(releaseResult.data!.status).toBe('completed');
      expect(releaseResult.data!.movesCompleted).toBe(25);

      // Equipment should be available again
      const after = engine.getEquipment(equipId);
      expect(after!.status).toBe('available');
    });

    it('should reject assignment when equipment is not available', () => {
      const reg = engine.registerEquipment(makeEquipmentInput({ yearOfManufacture: 2022 }));
      engine.updateStatus(reg.data!.id, 'maintenance');

      const result = engine.assignEquipment({
        equipmentId: reg.data!.id,
        assignmentType: 'reservation',
        operatorId: uuid(),
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('EQUIPMENT_NOT_AVAILABLE');
    });
  });

  // --------------------------------------------------------------------------
  // Maintenance scheduling
  // --------------------------------------------------------------------------

  describe('scheduleMaintenance', () => {
    it('should schedule and track maintenance', () => {
      const reg = engine.registerEquipment(makeEquipmentInput({ yearOfManufacture: 2022 }));

      const schedResult = engine.scheduleMaintenance({
        tenantId: TENANT_ID,
        equipmentId: reg.data!.id,
        type: 'preventive',
        maintenanceType: 'oil_change',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        estimatedDuration: 4,
        description: 'Scheduled oil change at 500 hours',
      });

      expect(schedResult.success).toBe(true);
      expect(schedResult.data!.status).toBe('scheduled');
      expect(schedResult.data!.maintenanceType).toBe('oil_change');
    });

    it('should return error when equipment not found', () => {
      const result = engine.scheduleMaintenance({
        tenantId: TENANT_ID,
        equipmentId: uuid(),
        type: 'preventive',
        maintenanceType: 'oil_change',
        scheduledDate: new Date(),
        description: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  // --------------------------------------------------------------------------
  // Fleet stats
  // --------------------------------------------------------------------------

  describe('getFleetStats', () => {
    it('should return correct fleet statistics', () => {
      engine.registerEquipment(makeEquipmentInput({ yearOfManufacture: 2022 }));
      const reg2 = engine.registerEquipment(makeEquipmentInput({ yearOfManufacture: 2021 }));
      engine.updateStatus(reg2.data!.id, 'breakdown');

      const stats = engine.getFleetStats(TENANT_ID);

      expect(stats.totalEquipment).toBe(2);
      expect(stats.available).toBe(1);
      expect(stats.breakdown).toBe(1);
    });
  });
});
