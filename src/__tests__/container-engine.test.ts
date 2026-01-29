import { describe, it, expect, beforeEach } from 'vitest';
import { ContainerEngine } from '../containers/container-engine';
import { makeContainerInput, TENANT_ID, FACILITY_ID } from './test-utils';

describe('ContainerEngine', () => {
  let engine: ContainerEngine;

  beforeEach(() => {
    engine = new ContainerEngine();
  });

  const gateIn = { gateId: 'GATE-1', truckNumber: 'MH04AB1234' };
  const gateOut = { gateId: 'GATE-2', truckNumber: 'MH04CD5678' };
  const loc = {
    facilityId: FACILITY_ID, blockId: 'BLK-A', row: 1, slot: 5, tier: 1,
    barcode: 'BLK-A-01-05-1', fullPath: 'ICD-01/IMPORT/A/01/05/1',
  };
  const reefer = {
    setTemperature: -18, pluggedIn: false,
    tempAlerts: [] as never[], preTripInspected: true,
  };
  const hazmat = {
    unNumber: 'UN1993', properShippingName: 'Flammable liquid',
    class: '3' as const, marinePollutant: false, limitedQuantity: false,
  };

  /** Register + return id helper */
  function reg(overrides: Record<string, unknown> = {}) {
    return engine.registerContainer(makeContainerInput(overrides)).data!.id;
  }

  // --- Registration ---------------------------------------------------------

  describe('registerContainer', () => {
    it('should register a valid container at announced status', () => {
      const input = makeContainerInput();
      const result = engine.registerContainer(input);
      expect(result.success).toBe(true);
      expect(result.data!.containerNumber).toBe(input.containerNumber);
      expect(result.data!.status).toBe('announced');
      expect(result.data!.tenantId).toBe(TENANT_ID);
      expect(result.data!.facilityId).toBe(FACILITY_ID);
      expect(result.data!.size).toBe('40');
      expect(result.data!.owner).toBe('MSC');
      expect(result.data!.holds).toEqual([]);
      expect(result.data!.movements).toEqual([]);
    });

    it('should reject duplicate container numbers', () => {
      const input = makeContainerInput();
      engine.registerContainer(input);
      const dup = engine.registerContainer(makeContainerInput({ containerNumber: input.containerNumber }));
      expect(dup.success).toBe(false);
      expect(dup.errorCode).toBe('DUPLICATE_CONTAINER');
    });

    it('should reject invalid container number format', () => {
      const r = engine.registerContainer(makeContainerInput({ containerNumber: 'INVALID123' }));
      expect(r.success).toBe(false);
      expect(r.errorCode).toBe('INVALID_CONTAINER_NUMBER');
    });

    it('should reject bad check digit', () => {
      const r = engine.registerContainer(makeContainerInput({ containerNumber: 'MSCU1234560' }));
      expect(r.success).toBe(false);
      expect(r.errorCode).toBe('INVALID_CONTAINER_NUMBER');
    });

    it('should default customs status to pending', () => {
      expect(engine.registerContainer(makeContainerInput()).data!.customsStatus).toBe('pending');
    });
  });

  // --- Retrieval ------------------------------------------------------------

  describe('retrieval', () => {
    it('should get container by ID', () => {
      const id = reg();
      expect(engine.getContainer(id)).toBeDefined();
      expect(engine.getContainer(id)!.id).toBe(id);
    });

    it('should return undefined for unknown ID', () => {
      expect(engine.getContainer('no-such-id')).toBeUndefined();
    });

    it('should get container by number', () => {
      const input = makeContainerInput();
      engine.registerContainer(input);
      expect(engine.getContainerByNumber(input.containerNumber)!.containerNumber).toBe(input.containerNumber);
    });

    it('should return undefined for unknown number', () => {
      expect(engine.getContainerByNumber('XXXX0000000')).toBeUndefined();
    });

    it('should get containers by facility', () => {
      reg(); reg(); reg();
      expect(engine.getContainersByFacility(FACILITY_ID)).toHaveLength(3);
    });

    it('should return empty for unknown facility', () => {
      expect(engine.getContainersByFacility('unknown')).toEqual([]);
    });

    it('should get containers by status', () => {
      reg(); reg();
      expect(engine.getContainersByStatus('announced')).toHaveLength(2);
      expect(engine.getContainersByStatus('gated_in')).toHaveLength(0);
    });
  });

  // --- Lifecycle transitions ------------------------------------------------

  describe('lifecycle', () => {
    it('should gate in an announced container', () => {
      const r = engine.gateIn(reg(), gateIn);
      expect(r.success).toBe(true);
      expect(r.data!.status).toBe('gated_in');
      expect(r.data!.gateInTime).toBeDefined();
      expect(r.data!.movements[0]!.movementType).toBe('gate_in');
    });

    it('should reject gate in from grounded', () => {
      const id = reg();
      engine.gateIn(id, gateIn);
      engine.ground(id, loc);
      expect(engine.gateIn(id, gateIn).errorCode).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should ground a gated-in container', () => {
      const id = reg();
      engine.gateIn(id, gateIn);
      const r = engine.ground(id, loc);
      expect(r.success).toBe(true);
      expect(r.data!.status).toBe('grounded');
      expect(r.data!.currentLocation).toEqual(loc);
    });

    it('should reject grounding from announced', () => {
      expect(engine.ground(reg(), loc).errorCode).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should pick a grounded container', () => {
      const id = reg();
      engine.gateIn(id, gateIn);
      engine.ground(id, loc);
      const r = engine.pick(id);
      expect(r.success).toBe(true);
      expect(r.data!.status).toBe('picked');
      expect(r.data!.currentLocation).toBeUndefined();
      expect(r.data!.previousLocations).toHaveLength(1);
    });

    it('should reject picking from announced', () => {
      expect(engine.pick(reg()).errorCode).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should gate out a picked container', () => {
      const id = reg();
      engine.gateIn(id, gateIn);
      engine.ground(id, loc);
      engine.pick(id);
      const r = engine.gateOut(id, gateOut);
      expect(r.success).toBe(true);
      expect(r.data!.status).toBe('gated_out');
      expect(r.data!.gateOutTime).toBeDefined();
    });

    it('should complete full lifecycle with 4 movements', () => {
      const id = reg();
      engine.gateIn(id, gateIn);
      engine.ground(id, loc);
      engine.pick(id);
      engine.gateOut(id, gateOut);
      const c = engine.getContainer(id)!;
      expect(c.status).toBe('gated_out');
      expect(c.movements).toHaveLength(4);
    });

    it('should return NOT_FOUND for missing containers', () => {
      expect(engine.gateIn('x', gateIn).errorCode).toBe('NOT_FOUND');
      expect(engine.ground('x', loc).errorCode).toBe('NOT_FOUND');
      expect(engine.pick('x').errorCode).toBe('NOT_FOUND');
      expect(engine.gateOut('x', gateOut).errorCode).toBe('NOT_FOUND');
    });
  });

  // --- Holds ----------------------------------------------------------------

  describe('holds', () => {
    it('should place a hold', () => {
      const r = engine.placeHold(reg(), { type: 'customs', reason: 'Exam', placedBy: 'off-1' });
      expect(r.success).toBe(true);
      expect(r.data!.holds).toHaveLength(1);
      expect(r.data!.holds[0]!.type).toBe('customs');
      expect(r.data!.status).toBe('on_hold');
    });

    it('should release a hold and revert to grounded', () => {
      const id = reg();
      const held = engine.placeHold(id, { type: 'customs', reason: 'Exam', placedBy: 'a' });
      const r = engine.releaseHold(id, held.data!.holds[0]!.id, 'b');
      expect(r.success).toBe(true);
      expect(r.data!.holds[0]!.releasedAt).toBeDefined();
      expect(r.data!.holds[0]!.releasedBy).toBe('b');
      expect(r.data!.status).toBe('grounded');
    });

    it('should stay on_hold when other holds remain', () => {
      const id = reg();
      engine.placeHold(id, { type: 'customs', reason: 'C', placedBy: 'a' });
      const after = engine.placeHold(id, { type: 'payment', reason: 'P', placedBy: 'b' });
      const r = engine.releaseHold(id, after.data!.holds[0]!.id, 'a');
      expect(r.data!.status).toBe('on_hold');
    });

    it('should block gate out when container is on_hold', () => {
      const id = reg();
      engine.gateIn(id, gateIn);
      engine.ground(id, loc);
      engine.pick(id);
      engine.placeHold(id, { type: 'customs', reason: 'Hold', placedBy: 'sys' });
      const r = engine.gateOut(id, gateOut);
      expect(r.success).toBe(false);
      expect(r.errorCode).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should return HOLD_NOT_FOUND for unknown hold', () => {
      expect(engine.releaseHold(reg(), 'bogus', 'admin').errorCode).toBe('HOLD_NOT_FOUND');
    });
  });

  // --- Reefer management ----------------------------------------------------

  describe('reefer', () => {
    it('should plug in a reefer', () => {
      const r = engine.plugInReefer(reg({ reefer }), { plugId: 'P-42' });
      expect(r.success).toBe(true);
      expect(r.data!.reefer!.pluggedIn).toBe(true);
      expect(r.data!.reefer!.pluggedInAt).toBeDefined();
    });

    it('should unplug a reefer', () => {
      const id = reg({ reefer });
      engine.plugInReefer(id, {});
      expect(engine.unplugReefer(id).data!.reefer!.pluggedIn).toBe(false);
    });

    it('should reject plug/unplug for non-reefer', () => {
      const id = reg();
      expect(engine.plugInReefer(id, {}).errorCode).toBe('NOT_REEFER');
      expect(engine.unplugReefer(id).errorCode).toBe('NOT_REEFER');
    });

    it('should update temperature', () => {
      const r = engine.updateReeferTemperature(reg({ reefer }), -17);
      expect(r.data!.reefer!.currentTemperature).toBe(-17);
    });

    it('should create alert when deviation exceeds 3 degrees', () => {
      const r = engine.updateReeferTemperature(reg({ reefer }), -10);
      expect(r.data!.reefer!.tempAlerts).toHaveLength(1);
      expect(r.data!.reefer!.tempAlerts[0]!.deviation).toBe(8);
    });
  });

  // --- Statistics -----------------------------------------------------------

  describe('getContainerStats', () => {
    it('should return zeroed stats for empty facility', () => {
      const s = engine.getContainerStats(FACILITY_ID);
      expect(s.total).toBe(0);
      expect(s.reeferCount).toBe(0);
      expect(s.hazmatCount).toBe(0);
      expect(s.totalTEU).toBe(0);
    });

    it('should count containers, reefers, hazmat, and TEU', () => {
      reg();                                              // 40ft GP  = 2 TEU
      reg({ isoType: '22G1' });                           // 20ft GP  = 1 TEU
      reg({ reefer: { ...reefer, pluggedIn: true } });    // 40ft ref = 2 TEU
      reg({ hazmat });                                    // 40ft haz = 2 TEU
      const s = engine.getContainerStats(FACILITY_ID);
      expect(s.total).toBe(4);
      expect(s.byStatus['announced']).toBe(4);
      expect(s.reeferCount).toBe(1);
      expect(s.reeferPluggedIn).toBe(1);
      expect(s.hazmatCount).toBe(1);
      expect(s.totalTEU).toBe(7);
    });

    it('should count on-hold containers', () => {
      engine.placeHold(reg(), { type: 'customs', reason: 'H', placedBy: 's' });
      expect(engine.getContainerStats(FACILITY_ID).onHoldCount).toBe(1);
    });
  });

  // --- Query filtering ------------------------------------------------------

  describe('query filtering', () => {
    it('should filter by status', () => {
      const id = reg();
      reg();
      engine.gateIn(id, gateIn);
      expect(engine.getContainersByFacility(FACILITY_ID, { status: 'gated_in' })).toHaveLength(1);
    });

    it('should filter by owner', () => {
      reg({ owner: 'MSC' });
      reg({ owner: 'MAERSK' });
      const msc = engine.getContainersByFacility(FACILITY_ID, { owner: 'MSC' });
      expect(msc).toHaveLength(1);
      expect(msc[0]!.owner).toBe('MSC');
    });

    it('should filter by reefer flag', () => {
      reg();
      reg({ reefer });
      expect(engine.getContainersByFacility(FACILITY_ID, { isReefer: true })).toHaveLength(1);
      expect(engine.getContainersByFacility(FACILITY_ID, { isReefer: false })).toHaveLength(1);
    });

    it('should filter by hazmat flag', () => {
      reg();
      reg({ hazmat });
      expect(engine.getContainersByFacility(FACILITY_ID, { isHazmat: true })).toHaveLength(1);
      expect(engine.getContainersByFacility(FACILITY_ID, { isHazmat: false })).toHaveLength(1);
    });

    it('should filter by hold presence', () => {
      const id = reg();
      reg();
      engine.placeHold(id, { type: 'customs', reason: 'H', placedBy: 's' });
      expect(engine.getContainersByFacility(FACILITY_ID, { hasHold: true })).toHaveLength(1);
      expect(engine.getContainersByFacility(FACILITY_ID, { hasHold: false })).toHaveLength(1);
    });
  });
});
