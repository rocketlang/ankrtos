import { describe, it, expect, beforeEach } from 'vitest';
import { RailEngine } from '../rail/rail-engine';
import { makeTrackInput, makeRakeInput, TENANT_ID, FACILITY_ID, uuid } from './test-utils';

describe('RailEngine', () => {
  let engine: RailEngine;

  beforeEach(() => {
    RailEngine.resetInstance();
    engine = RailEngine.getInstance();
  });

  // --- Track CRUD ---

  describe('Track management', () => {
    it('registers a track with correct defaults', () => {
      const input = makeTrackInput();
      const result = engine.registerTrack(input);
      expect(result.success).toBe(true);
      expect(result.data!.trackNumber).toBe(input.trackNumber);
      expect(result.data!.status).toBe('available');
      expect(result.data!.electrified).toBe(false);
      expect(result.data!.gaugeType).toBe('broad');
    });

    it('rejects duplicate track number within same tenant', () => {
      engine.registerTrack(makeTrackInput({ trackNumber: 'DUP-001' }));
      const result = engine.registerTrack(makeTrackInput({ trackNumber: 'DUP-001' }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_TRACK');
    });

    it('allows same track number across different tenants', () => {
      engine.registerTrack(makeTrackInput({ trackNumber: 'S-1', tenantId: 'tenant-a' }));
      const r = engine.registerTrack(makeTrackInput({ trackNumber: 'S-1', tenantId: 'tenant-b' }));
      expect(r.success).toBe(true);
    });

    it('getTrack returns track by ID or undefined', () => {
      const created = engine.registerTrack(makeTrackInput()).data!;
      expect(engine.getTrack(created.id)!.id).toBe(created.id);
      expect(engine.getTrack(uuid())).toBeUndefined();
    });

    it('getTrackByNumber looks up by number and tenant', () => {
      engine.registerTrack(makeTrackInput({ trackNumber: 'LK-1' }));
      expect(engine.getTrackByNumber('LK-1', TENANT_ID)).toBeDefined();
      expect(engine.getTrackByNumber('NOPE', TENANT_ID)).toBeUndefined();
    });

    it('listTracks filters by tenant and trackType', () => {
      engine.registerTrack(makeTrackInput({ tenantId: 'a', trackType: 'loading' }));
      engine.registerTrack(makeTrackInput({ tenantId: 'a', trackType: 'unloading' }));
      engine.registerTrack(makeTrackInput({ tenantId: 'b', trackType: 'loading' }));

      expect(engine.listTracks({ tenantId: 'a' }).total).toBe(2);
      expect(engine.listTracks({ trackType: 'loading' }).total).toBe(2);
    });

    it('listTracks paginates correctly', () => {
      for (let i = 0; i < 5; i++) engine.registerTrack(makeTrackInput());
      const p1 = engine.listTracks({ pageSize: 2, page: 1 });
      expect(p1.data).toHaveLength(2);
      expect(p1.hasNext).toBe(true);
      expect(p1.totalPages).toBe(3);

      const p3 = engine.listTracks({ pageSize: 2, page: 3 });
      expect(p3.data).toHaveLength(1);
      expect(p3.hasPrevious).toBe(true);
    });

    it('updateTrackStatus changes status', () => {
      const t = engine.registerTrack(makeTrackInput()).data!;
      const result = engine.updateTrackStatus(t.id, 'maintenance');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('maintenance');
    });

    it('updateTrackStatus returns NOT_FOUND for unknown id', () => {
      const result = engine.updateTrackStatus(uuid(), 'maintenance');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  // --- Track availability ---

  describe('Track availability', () => {
    it('finds available track with sufficient capacity', () => {
      engine.registerTrack(makeTrackInput({ wagonCapacity: 30, trackType: 'loading' }));
      engine.registerTrack(makeTrackInput({ wagonCapacity: 50, trackType: 'unloading' }));
      const found = engine.findAvailableTrack(TENANT_ID, 40);
      expect(found).toBeDefined();
      expect(found!.wagonCapacity).toBeGreaterThanOrEqual(40);
    });

    it('returns undefined when no track has enough capacity', () => {
      engine.registerTrack(makeTrackInput({ wagonCapacity: 10, trackType: 'loading' }));
      expect(engine.findAvailableTrack(TENANT_ID, 20)).toBeUndefined();
    });

    it('excludes occupied and main-line tracks', () => {
      const t = engine.registerTrack(makeTrackInput({ wagonCapacity: 50, trackType: 'loading' })).data!;
      engine.updateTrackStatus(t.id, 'occupied');
      engine.registerTrack(makeTrackInput({ wagonCapacity: 50, trackType: 'main' }));
      expect(engine.findAvailableTrack(TENANT_ID, 10)).toBeUndefined();
    });
  });

  // --- Rake lifecycle ---

  describe('Rake lifecycle', () => {
    it('announces a rake with status "announced"', () => {
      const result = engine.announceRake(makeRakeInput());
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('announced');
      expect(result.data!.wagons).toEqual([]);
    });

    it('rejects duplicate active rake numbers', () => {
      engine.announceRake(makeRakeInput({ rakeNumber: 'RK-DUP' }));
      const dup = engine.announceRake(makeRakeInput({ rakeNumber: 'RK-DUP' }));
      expect(dup.success).toBe(false);
      expect(dup.errorCode).toBe('DUPLICATE_RAKE');
    });

    it('getRake and getRakeByNumber retrieve correctly', () => {
      const r = engine.announceRake(makeRakeInput({ rakeNumber: 'RK-FIND' })).data!;
      expect(engine.getRake(r.id)).toBeDefined();
      expect(engine.getRakeByNumber('RK-FIND', TENANT_ID)).toBeDefined();
      expect(engine.getRake(uuid())).toBeUndefined();
    });

    it('assignTrack links rake and marks track occupied', () => {
      const rake = engine.announceRake(makeRakeInput({ totalWagons: 20 })).data!;
      const track = engine.registerTrack(makeTrackInput({ wagonCapacity: 30 })).data!;
      const result = engine.assignTrack(rake.id, track.id);

      expect(result.success).toBe(true);
      expect(result.data!.trackId).toBe(track.id);
      expect(engine.getTrack(track.id)!.status).toBe('occupied');
      expect(engine.getTrack(track.id)!.currentRakeId).toBe(rake.id);
    });

    it('rejects assigning occupied track', () => {
      const track = engine.registerTrack(makeTrackInput({ wagonCapacity: 50 })).data!;
      const r1 = engine.announceRake(makeRakeInput({ totalWagons: 10 })).data!;
      const r2 = engine.announceRake(makeRakeInput({ totalWagons: 10 })).data!;
      engine.assignTrack(r1.id, track.id);
      expect(engine.assignTrack(r2.id, track.id).errorCode).toBe('TRACK_NOT_AVAILABLE');
    });

    it('rejects track with insufficient capacity', () => {
      const rake = engine.announceRake(makeRakeInput({ totalWagons: 50 })).data!;
      const track = engine.registerTrack(makeTrackInput({ wagonCapacity: 20 })).data!;
      expect(engine.assignTrack(rake.id, track.id).errorCode).toBe('INSUFFICIENT_CAPACITY');
    });

    it('recordRakeArrival requires assigned track', () => {
      const rake = engine.announceRake(makeRakeInput()).data!;
      expect(engine.recordRakeArrival(rake.id).errorCode).toBe('NO_TRACK_ASSIGNED');

      const track = engine.registerTrack(makeTrackInput({ wagonCapacity: 50 })).data!;
      engine.assignTrack(rake.id, track.id);
      const arrival = engine.recordRakeArrival(rake.id);
      expect(arrival.success).toBe(true);
      expect(arrival.data!.status).toBe('arrived');
      expect(arrival.data!.ata).toBeInstanceOf(Date);
    });

    it('full lifecycle: announce -> arrive -> unload -> load -> dispatch', () => {
      const track = engine.registerTrack(makeTrackInput({ wagonCapacity: 50 })).data!;
      const rake = engine.announceRake(makeRakeInput({ totalWagons: 20 })).data!;
      engine.assignTrack(rake.id, track.id);
      engine.recordRakeArrival(rake.id);

      expect(engine.startUnloading(rake.id).data!.status).toBe('unloading');
      expect(engine.completeUnloading(rake.id).data!.status).toBe('loading');
      expect(engine.startLoading(rake.id).data!.status).toBe('loading');
      expect(engine.completeLoading(rake.id).data!.status).toBe('ready_for_departure');

      const dispatch = engine.dispatchRake(rake.id);
      expect(dispatch.data!.status).toBe('departed');
      expect(dispatch.data!.atd).toBeInstanceOf(Date);

      const freed = engine.getTrack(track.id)!;
      expect(freed.status).toBe('available');
      expect(freed.currentRakeId).toBeUndefined();
    });

    it('rejects startUnloading from wrong status', () => {
      const rake = engine.announceRake(makeRakeInput()).data!;
      expect(engine.startUnloading(rake.id).errorCode).toBe('INVALID_STATUS');
    });

    it('rejects dispatch when not ready_for_departure', () => {
      const track = engine.registerTrack(makeTrackInput({ wagonCapacity: 50 })).data!;
      const rake = engine.announceRake(makeRakeInput({ totalWagons: 10 })).data!;
      engine.assignTrack(rake.id, track.id);
      engine.recordRakeArrival(rake.id);
      expect(engine.dispatchRake(rake.id).errorCode).toBe('INVALID_STATUS');
    });
  });

  // --- Wagon management ---

  describe('Wagon management', () => {
    it('adds a wagon to a rake with correct defaults', () => {
      const rake = engine.announceRake(makeRakeInput({ totalWagons: 5 })).data!;
      const result = engine.addWagon({
        rakeId: rake.id, wagonNumber: 'NWR12345', wagonType: 'BLC', position: 1,
      });
      expect(result.success).toBe(true);
      expect(result.data!.wagonNumber).toBe('NWR12345');
      expect(result.data!.wagonType).toBe('BLC');
      expect(result.data!.maxContainers).toBe(2);
      expect(result.data!.condition).toBe('fit');
    });

    it('getWagon returns wagon or undefined', () => {
      const rake = engine.announceRake(makeRakeInput({ totalWagons: 5 })).data!;
      const w = engine.addWagon({
        rakeId: rake.id, wagonNumber: 'W-G', wagonType: 'BLC', position: 1,
      }).data!;
      expect(engine.getWagon(w.id)).toBeDefined();
      expect(engine.getWagon(uuid())).toBeUndefined();
    });

    it('rejects invalid wagon position', () => {
      const rake = engine.announceRake(makeRakeInput({ totalWagons: 3 })).data!;
      const r = engine.addWagon({
        rakeId: rake.id, wagonNumber: 'W-B', wagonType: 'BLC', position: 5,
      });
      expect(r.errorCode).toBe('INVALID_POSITION');
    });

    it('rejects duplicate position within a rake', () => {
      const rake = engine.announceRake(makeRakeInput({ totalWagons: 5 })).data!;
      engine.addWagon({ rakeId: rake.id, wagonNumber: 'W1', wagonType: 'BLC', position: 1 });
      const dup = engine.addWagon({ rakeId: rake.id, wagonNumber: 'W2', wagonType: 'BLC', position: 1 });
      expect(dup.errorCode).toBe('POSITION_OCCUPIED');
    });

    it('sorts wagons by position in the rake', () => {
      const rake = engine.announceRake(makeRakeInput({ totalWagons: 5 })).data!;
      engine.addWagon({ rakeId: rake.id, wagonNumber: 'W3', wagonType: 'BLC', position: 3 });
      engine.addWagon({ rakeId: rake.id, wagonNumber: 'W1', wagonType: 'BLC', position: 1 });
      engine.addWagon({ rakeId: rake.id, wagonNumber: 'W2', wagonType: 'BLC', position: 2 });
      expect(engine.getRake(rake.id)!.wagons.map(w => w.position)).toEqual([1, 2, 3]);
    });
  });

  // --- Terminal stats ---

  describe('Terminal stats', () => {
    it('returns correct counts for tracks and rakes', () => {
      const t1 = engine.registerTrack(makeTrackInput({ wagonCapacity: 50 })).data!;
      engine.registerTrack(makeTrackInput({ wagonCapacity: 50 }));

      const r1 = engine.announceRake(makeRakeInput({ totalWagons: 20 })).data!;
      engine.assignTrack(r1.id, t1.id);
      engine.recordRakeArrival(r1.id);
      engine.startUnloading(r1.id);
      engine.announceRake(makeRakeInput({ totalWagons: 10 }));

      const stats = engine.getTerminalStats(TENANT_ID);
      expect(stats.totalTracks).toBe(2);
      expect(stats.occupiedTracks).toBe(1);
      expect(stats.availableTracks).toBe(1);
      expect(stats.activeRakes).toBe(2);
      expect(stats.rakesUnloading).toBe(1);
    });

    it('returns zeroes for unknown tenant', () => {
      const stats = engine.getTerminalStats('no-such-tenant');
      expect(stats.totalTracks).toBe(0);
      expect(stats.activeRakes).toBe(0);
    });
  });
});
