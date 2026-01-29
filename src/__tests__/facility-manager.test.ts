import { describe, it, expect, beforeEach } from 'vitest';
import { FacilityManager } from '../facility/facility-manager';
import { uuid, TENANT_ID } from './test-utils';

function makeFacilityInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    code: `ICD-${Date.now().toString(36)}`,
    name: 'Test ICD Terminal',
    type: 'ICD' as const,
    address: { line1: '123 Port Rd', city: 'Navi Mumbai', state: 'Maharashtra', pincode: '400707', country: 'IN' },
    portCode: 'INNSA',
    customsCode: 'INNSA6',
    capacityTEU: 5000,
    groundSlots: 2000,
    maxStackHeight: 5,
    ...overrides,
  };
}

function makeZoneInput(facilityId: string, overrides: Record<string, unknown> = {}) {
  return {
    facilityId,
    code: `Z-${Date.now().toString(36)}`,
    name: 'Import Zone',
    type: 'import' as const,
    maxStackHeight: 5,
    ...overrides,
  };
}

function makeBlockInput(zoneId: string, overrides: Record<string, unknown> = {}) {
  return {
    zoneId,
    code: `A-${Date.now().toString(36)}`,
    name: 'Block A',
    rows: 10,
    slotsPerRow: 20,
    maxTiers: 5,
    ...overrides,
  };
}

describe('FacilityManager', () => {
  let mgr: FacilityManager;

  beforeEach(() => {
    mgr = new FacilityManager();
  });

  // =========================================================================
  // FACILITY CRUD
  // =========================================================================

  describe('Facility CRUD', () => {
    it('creates a facility successfully', () => {
      const res = mgr.createFacility(makeFacilityInput());
      expect(res.success).toBe(true);
      expect(res.data!.name).toBe('Test ICD Terminal');
      expect(res.data!.status).toBe('active');
      expect(res.data!.type).toBe('ICD');
    });

    it('rejects duplicate facility code', () => {
      const input = makeFacilityInput({ code: 'UNIQUE-CODE' });
      mgr.createFacility(input);
      const res = mgr.createFacility({ ...input, name: 'Another Terminal' });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('DUPLICATE_CODE');
    });

    it('retrieves facility by id', () => {
      const facility = mgr.createFacility(makeFacilityInput()).data!;
      expect(mgr.getFacility(facility.id)).toBeDefined();
      expect(mgr.getFacility(facility.id)!.name).toBe('Test ICD Terminal');
    });

    it('retrieves facility by code', () => {
      const input = makeFacilityInput({ code: 'ICD-TKD' });
      mgr.createFacility(input);
      expect(mgr.getFacilityByCode('ICD-TKD')).toBeDefined();
      expect(mgr.getFacilityByCode('NONEXISTENT')).toBeUndefined();
    });

    it('lists all facilities', () => {
      mgr.createFacility(makeFacilityInput({ code: 'F1' }));
      mgr.createFacility(makeFacilityInput({ code: 'F2' }));
      expect(mgr.getAllFacilities().length).toBe(2);
    });

    it('filters facilities by tenant', () => {
      mgr.createFacility(makeFacilityInput({ code: 'F1', tenantId: 'tenant-a' }));
      mgr.createFacility(makeFacilityInput({ code: 'F2', tenantId: 'tenant-b' }));
      expect(mgr.getAllFacilities('tenant-a').length).toBe(1);
    });

    it('updates facility fields', () => {
      const facility = mgr.createFacility(makeFacilityInput()).data!;
      const res = mgr.updateFacility(facility.id, { name: 'Updated Terminal' });
      expect(res.success).toBe(true);
      expect(res.data!.name).toBe('Updated Terminal');
    });

    it('returns error updating non-existent facility', () => {
      const res = mgr.updateFacility(uuid(), { name: 'Nope' });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });

    it('prevents duplicate code on update', () => {
      mgr.createFacility(makeFacilityInput({ code: 'CODE-A' }));
      const f2 = mgr.createFacility(makeFacilityInput({ code: 'CODE-B' })).data!;
      const res = mgr.updateFacility(f2.id, { code: 'CODE-A' });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('DUPLICATE_CODE');
    });

    it('updates facility status', () => {
      const facility = mgr.createFacility(makeFacilityInput()).data!;
      const res = mgr.updateFacilityStatus(facility.id, 'closed');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('closed');
    });
  });

  // =========================================================================
  // ZONE MANAGEMENT
  // =========================================================================

  describe('Zone management', () => {
    let facilityId: string;

    beforeEach(() => {
      facilityId = mgr.createFacility(makeFacilityInput()).data!.id;
    });

    it('creates a zone in a facility', () => {
      const res = mgr.createZone(makeZoneInput(facilityId));
      expect(res.success).toBe(true);
      expect(res.data!.name).toBe('Import Zone');
      expect(res.data!.status).toBe('active');
    });

    it('rejects zone in non-existent facility', () => {
      const res = mgr.createZone(makeZoneInput(uuid()));
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('FACILITY_NOT_FOUND');
    });

    it('rejects duplicate zone code in same facility', () => {
      const input = makeZoneInput(facilityId, { code: 'Z-DUP' });
      mgr.createZone(input);
      const res = mgr.createZone({ ...input, name: 'Another Zone' });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('DUPLICATE_CODE');
    });

    it('retrieves zone by id', () => {
      const zone = mgr.createZone(makeZoneInput(facilityId)).data!;
      expect(mgr.getZone(zone.id)).toBeDefined();
    });

    it('lists zones by facility', () => {
      mgr.createZone(makeZoneInput(facilityId, { code: 'Z1' }));
      mgr.createZone(makeZoneInput(facilityId, { code: 'Z2' }));
      expect(mgr.getZonesByFacility(facilityId).length).toBe(2);
    });

    it('updates zone fields', () => {
      const zone = mgr.createZone(makeZoneInput(facilityId)).data!;
      const res = mgr.updateZone(zone.id, { name: 'Export Zone' });
      expect(res.success).toBe(true);
      expect(res.data!.name).toBe('Export Zone');
    });

    it('returns error updating non-existent zone', () => {
      const res = mgr.updateZone(uuid(), { name: 'Nope' });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });
  });

  // =========================================================================
  // BLOCK MANAGEMENT
  // =========================================================================

  describe('Block management', () => {
    let facilityId: string;
    let zoneId: string;

    beforeEach(() => {
      facilityId = mgr.createFacility(makeFacilityInput()).data!.id;
      zoneId = mgr.createZone(makeZoneInput(facilityId)).data!.id;
    });

    it('creates a block with auto-generated slots', () => {
      const res = mgr.createBlock(makeBlockInput(zoneId, { rows: 5, slotsPerRow: 10 }));
      expect(res.success).toBe(true);
      expect(res.data!.rows).toBe(5);
      expect(res.data!.slotsPerRow).toBe(10);
      // Check slots were auto-created
      const slots = mgr.getSlotsByBlock(res.data!.id);
      expect(slots.length).toBe(50);
    });

    it('rejects block in non-existent zone', () => {
      const res = mgr.createBlock(makeBlockInput(uuid()));
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('ZONE_NOT_FOUND');
    });

    it('rejects duplicate block code in same facility', () => {
      const input = makeBlockInput(zoneId, { code: 'B-DUP' });
      mgr.createBlock(input);
      const res = mgr.createBlock({ ...input, name: 'Another Block' });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('DUPLICATE_CODE');
    });

    it('retrieves block by id', () => {
      const block = mgr.createBlock(makeBlockInput(zoneId)).data!;
      expect(mgr.getBlock(block.id)).toBeDefined();
    });

    it('retrieves block by code', () => {
      const input = makeBlockInput(zoneId, { code: 'BLK-X' });
      mgr.createBlock(input);
      expect(mgr.getBlockByCode(facilityId, 'BLK-X')).toBeDefined();
      expect(mgr.getBlockByCode(facilityId, 'NONEXISTENT')).toBeUndefined();
    });

    it('lists blocks by facility', () => {
      mgr.createBlock(makeBlockInput(zoneId, { code: 'B1' }));
      mgr.createBlock(makeBlockInput(zoneId, { code: 'B2' }));
      expect(mgr.getBlocksByFacility(facilityId).length).toBe(2);
    });

    it('lists blocks by zone', () => {
      mgr.createBlock(makeBlockInput(zoneId, { code: 'B1' }));
      expect(mgr.getBlocksByZone(zoneId).length).toBe(1);
    });

    it('updates block fields', () => {
      const block = mgr.createBlock(makeBlockInput(zoneId)).data!;
      const res = mgr.updateBlock(block.id, { name: 'Renamed Block' });
      expect(res.success).toBe(true);
      expect(res.data!.name).toBe('Renamed Block');
    });
  });

  // =========================================================================
  // SLOT MANAGEMENT
  // =========================================================================

  describe('Slot management', () => {
    let blockId: string;

    beforeEach(() => {
      const facilityId = mgr.createFacility(makeFacilityInput()).data!.id;
      const zoneId = mgr.createZone(makeZoneInput(facilityId)).data!.id;
      blockId = mgr.createBlock(makeBlockInput(zoneId, { rows: 3, slotsPerRow: 4 })).data!.id;
    });

    it('auto-creates slots for a block', () => {
      const slots = mgr.getSlotsByBlock(blockId);
      expect(slots.length).toBe(12); // 3 rows x 4 slots
    });

    it('retrieves slot by id', () => {
      const slots = mgr.getSlotsByBlock(blockId);
      const slot = slots[0]!;
      expect(mgr.getSlot(slot.id)).toBeDefined();
    });

    it('retrieves slot by barcode', () => {
      const slots = mgr.getSlotsByBlock(blockId);
      const slot = slots[0]!;
      expect(mgr.getSlotByBarcode(slot.barcode)).toBeDefined();
    });

    it('retrieves slot by position', () => {
      const slot = mgr.getSlotByPosition(blockId, 1, 1);
      expect(slot).toBeDefined();
      expect(slot!.row).toBe(1);
      expect(slot!.slot).toBe(1);
    });

    it('returns undefined for non-existent position', () => {
      expect(mgr.getSlotByPosition(blockId, 99, 99)).toBeUndefined();
    });

    it('updates slot fields', () => {
      const slots = mgr.getSlotsByBlock(blockId);
      const slot = slots[0]!;
      const res = mgr.updateSlot(slot.id, { status: 'blocked', blockedReason: 'Maintenance' });
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('blocked');
      expect(res.data!.blockedReason).toBe('Maintenance');
    });

    it('returns error updating non-existent slot', () => {
      const res = mgr.updateSlot(uuid(), { status: 'blocked' });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NOT_FOUND');
    });
  });

  // =========================================================================
  // LOCATION RESOLUTION & STATS
  // =========================================================================

  describe('Location resolution', () => {
    it('resolves barcode to yard location', () => {
      const facilityId = mgr.createFacility(makeFacilityInput()).data!.id;
      const zoneId = mgr.createZone(makeZoneInput(facilityId)).data!.id;
      // Use a block code without hyphens so resolveLocation can parse BLOCK-ROW-SLOT
      mgr.createBlock(makeBlockInput(zoneId, { code: 'BLKA', rows: 2, slotsPerRow: 3 }));
      const slots = mgr.getBlocksByFacility(facilityId)
        .flatMap(b => mgr.getSlotsByBlock(b.id));
      const barcode = slots[0]!.barcode;
      const location = mgr.resolveLocation(facilityId, barcode);
      expect(location).not.toBeNull();
      expect(location!.facilityId).toBe(facilityId);
    });

    it('returns null for unknown barcode', () => {
      const facilityId = mgr.createFacility(makeFacilityInput()).data!.id;
      expect(mgr.resolveLocation(facilityId, 'UNKNOWN-BARCODE')).toBeNull();
    });
  });

  describe('Facility stats', () => {
    it('returns stats for a facility with blocks', () => {
      const facilityId = mgr.createFacility(makeFacilityInput()).data!.id;
      const zoneId = mgr.createZone(makeZoneInput(facilityId)).data!.id;
      mgr.createBlock(makeBlockInput(zoneId, { rows: 5, slotsPerRow: 10 }));
      const stats = mgr.getFacilityStats(facilityId);
      expect(stats).not.toBeNull();
      expect(stats!.totalBlocks).toBeGreaterThan(0);
      expect(stats!.totalSlots).toBeGreaterThan(0);
    });

    it('returns null for unknown facility', () => {
      expect(mgr.getFacilityStats(uuid())).toBeNull();
    });
  });
});
