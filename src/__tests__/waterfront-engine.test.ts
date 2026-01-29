import { describe, it, expect, beforeEach } from 'vitest';
import { WaterfrontEngine } from '../waterfront/waterfront-engine';
import { makeBerthInput, makeVesselVisitInput, uuid, TENANT_ID, FACILITY_ID } from './test-utils';

describe('WaterfrontEngine', () => {
  let engine: WaterfrontEngine;

  beforeEach(() => {
    WaterfrontEngine.resetInstance();
    engine = WaterfrontEngine.getInstance();
  });

  // --------------------------------------------------------------------------
  // Berth CRUD
  // --------------------------------------------------------------------------

  describe('registerBerth', () => {
    it('should register a berth successfully', () => {
      const result = engine.registerBerth(makeBerthInput());

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('available');
      expect(result.data!.length).toBe(350);
      expect(result.data!.maxDraft).toBe(14.5);
    });

    it('should reject duplicate berth numbers within the same tenant', () => {
      const input = makeBerthInput();
      engine.registerBerth(input);

      const dup = { ...input };
      const result = engine.registerBerth(dup);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_BERTH');
    });
  });

  describe('getBerth', () => {
    it('should return berth by ID', () => {
      const reg = engine.registerBerth(makeBerthInput());
      const berth = engine.getBerth(reg.data!.id);

      expect(berth).toBeDefined();
      expect(berth!.id).toBe(reg.data!.id);
    });

    it('should return undefined for unknown ID', () => {
      expect(engine.getBerth(uuid())).toBeUndefined();
    });
  });

  describe('listBerths', () => {
    it('should list berths filtered by tenant', () => {
      engine.registerBerth(makeBerthInput());
      engine.registerBerth(makeBerthInput());
      engine.registerBerth(makeBerthInput({ tenantId: 'other-tenant' }));

      const result = engine.listBerths({ tenantId: TENANT_ID });
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });

    it('should filter available berths only', () => {
      const b1 = engine.registerBerth(makeBerthInput());
      engine.registerBerth(makeBerthInput());
      engine.updateBerthStatus(b1.data!.id, 'maintenance');

      const result = engine.listBerths({ tenantId: TENANT_ID, availableOnly: true });
      expect(result.total).toBe(1);
    });
  });

  describe('updateBerthStatus', () => {
    it('should update berth status', () => {
      const reg = engine.registerBerth(makeBerthInput());
      const result = engine.updateBerthStatus(reg.data!.id, 'maintenance');

      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('maintenance');
    });

    it('should return error for unknown berth', () => {
      const result = engine.updateBerthStatus(uuid(), 'occupied');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  // --------------------------------------------------------------------------
  // Vessel lifecycle:
  //   announce -> assign berth -> arrive -> berth -> discharge -> load -> depart
  // --------------------------------------------------------------------------

  describe('vessel visit lifecycle', () => {
    let berthId: string;

    beforeEach(() => {
      const berthResult = engine.registerBerth(makeBerthInput());
      berthId = berthResult.data!.id;
    });

    it('should announce a vessel visit', () => {
      const result = engine.announceVessel(makeVesselVisitInput());

      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('announced');
      expect(result.data!.vesselName).toContain('MV Test Vessel');
      expect(result.data!.dischargeContainers).toBe(500);
      expect(result.data!.loadContainers).toBe(450);
      expect(result.data!.totalMoves).toBe(950);
    });

    it('should reject duplicate active vessel visit for same IMO + voyage', () => {
      const input = makeVesselVisitInput();
      engine.announceVessel(input);

      const dup = { ...input };
      const result = engine.announceVessel(dup);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_VISIT');
    });

    it('should retrieve a vessel visit by ID', () => {
      const reg = engine.announceVessel(makeVesselVisitInput());
      const visit = engine.getVesselVisit(reg.data!.id);
      expect(visit).toBeDefined();
      expect(visit!.id).toBe(reg.data!.id);
    });

    it('should walk through the full vessel lifecycle', () => {
      const announced = engine.announceVessel(makeVesselVisitInput());
      const visitId = announced.data!.id;

      // Assign berth
      const assigned = engine.assignBerth(visitId, berthId);
      expect(assigned.success).toBe(true);
      expect(assigned.data!.berthId).toBe(berthId);

      // Berth should now be reserved
      const berth = engine.getBerth(berthId);
      expect(berth!.status).toBe('reserved');

      // Record arrival (at anchorage)
      const arrived = engine.recordArrival(visitId);
      expect(arrived.success).toBe(true);
      expect(arrived.data!.status).toBe('at_anchorage');
      expect(arrived.data!.ata).toBeDefined();

      // Record berthing
      const berthed = engine.recordBerthing(visitId);
      expect(berthed.success).toBe(true);
      expect(berthed.data!.status).toBe('alongside');
      expect(berthed.data!.atb).toBeDefined();

      // Berth should now be occupied
      const berthAfterBerthing = engine.getBerth(berthId);
      expect(berthAfterBerthing!.status).toBe('occupied');

      // Start discharge
      const dischargeStarted = engine.startDischarge(visitId);
      expect(dischargeStarted.success).toBe(true);
      expect(dischargeStarted.data!.status).toBe('working');

      // Complete discharge
      const dischargeComplete = engine.completeDischarge(visitId);
      expect(dischargeComplete.success).toBe(true);
      expect(dischargeComplete.data!.dischargeDone).toBe(dischargeComplete.data!.dischargeContainers);

      // Start loading
      const loadStarted = engine.startLoading(visitId);
      expect(loadStarted.success).toBe(true);
      expect(loadStarted.data!.status).toBe('working');

      // Complete loading
      const loadComplete = engine.completeLoading(visitId);
      expect(loadComplete.success).toBe(true);
      expect(loadComplete.data!.loadDone).toBe(loadComplete.data!.loadContainers);
      expect(loadComplete.data!.status).toBe('idle');

      // Record departure
      const departed = engine.recordDeparture(visitId);
      expect(departed.success).toBe(true);
      expect(departed.data!.status).toBe('departed');
      expect(departed.data!.atd).toBeDefined();

      // Berth should be released (available again)
      const berthAfterDepart = engine.getBerth(berthId);
      expect(berthAfterDepart!.status).toBe('available');
      expect(berthAfterDepart!.currentVesselId).toBeUndefined();
    });

    it('should reject berth assignment when vessel LOA exceeds berth max LOA', () => {
      const visit = engine.announceVessel(makeVesselVisitInput({ loa: 500 }));
      const result = engine.assignBerth(visit.data!.id, berthId);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('LOA_EXCEEDED');
    });

    it('should reject berthing when no berth is assigned', () => {
      const visit = engine.announceVessel(makeVesselVisitInput());
      engine.recordArrival(visit.data!.id);

      const result = engine.recordBerthing(visit.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NO_BERTH_ASSIGNED');
    });
  });

  // --------------------------------------------------------------------------
  // Crane registration
  // --------------------------------------------------------------------------

  describe('registerCrane', () => {
    it('should register a quay crane successfully', () => {
      const result = engine.registerCrane({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        craneName: 'STS Crane 1',
        craneNumber: 'QC-001',
        craneType: 'STS',
        outreach: 65,
        liftCapacity: 65,
        liftHeight: 52,
        hoisSpeed: 180,
        trolleySpeed: 240,
        spreaderType: 'twin-lift',
        movesPerHour: 30,
      });

      expect(result.success).toBe(true);
      expect(result.data!.craneNumber).toBe('QC-001');
      expect(result.data!.status).toBe('available');
      expect(result.data!.craneType).toBe('STS');
    });

    it('should reject duplicate crane numbers within the same tenant', () => {
      const input = {
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        craneName: 'STS Crane 2',
        craneNumber: 'QC-DUP',
        craneType: 'STS' as const,
        outreach: 65,
        liftCapacity: 65,
        liftHeight: 52,
        hoisSpeed: 180,
        trolleySpeed: 240,
        spreaderType: 'single' as const,
      };

      engine.registerCrane(input);
      const result = engine.registerCrane({ ...input });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_CRANE');
    });
  });

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  describe('getWaterfrontStats', () => {
    it('should return accurate waterfront statistics', () => {
      engine.registerBerth(makeBerthInput());
      engine.registerBerth(makeBerthInput());
      engine.registerCrane({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        craneName: 'QC Stats',
        craneNumber: 'QCS-001',
        craneType: 'STS',
        outreach: 65,
        liftCapacity: 65,
        liftHeight: 52,
        hoisSpeed: 180,
        trolleySpeed: 240,
        spreaderType: 'single',
      });
      engine.announceVessel(makeVesselVisitInput());

      const stats = engine.getWaterfrontStats(TENANT_ID);

      expect(stats.totalBerths).toBe(2);
      expect(stats.availableBerths).toBe(2);
      expect(stats.totalCranes).toBe(1);
      expect(stats.availableCranes).toBe(1);
      expect(stats.activeVesselVisits).toBe(1);
    });
  });
});
