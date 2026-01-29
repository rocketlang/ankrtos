import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GateEngine } from '../gate/gate-engine';
import { makeGateInput, makeAppointmentInput, uuid, TENANT_ID, FACILITY_ID } from './test-utils';

const _mock = vi.hoisted(() => ({ facilityId: '' }));

vi.mock('../containers/container-engine', () => ({
  getContainerEngine: () => ({
    getContainerByNumber: (num: string) =>
      num === 'MSCU1234567'
        ? { id: 'ctr-mock-001', containerNumber: 'MSCU1234567', facilityId: _mock.facilityId,
            size: '40', isoType: '42G1', holds: [], status: 'gated_in' }
        : undefined,
    registerContainer: () => ({ success: true, data: { id: 'ctr-mock-001' } }),
    gateIn: () => ({ success: true, data: { id: 'ctr-mock-001' } }),
    gateOut: () => ({ success: true, data: { id: 'ctr-mock-001' } }),
  }),
}));

function registerGateWithLane(engine: GateEngine) {
  const gate = engine.registerGate(makeGateInput()).data!;
  const lane = engine.addLane({ gateId: gate.id, laneNumber: 'L1', laneType: 'both' }).data!;
  return { gate, lane };
}

function startGateInTx(engine: GateEngine) {
  const { gate, lane } = registerGateWithLane(engine);
  const tx = engine.startGateIn({
    gateId: gate.id, laneId: lane.id, truckNumber: 'MH04AB1234',
    driverName: 'Suresh Kumar', driverLicense: 'MH0420220001234', driverPhone: '+919876543210',
  }).data!;
  return { gate, lane, tx };
}

describe('GateEngine', () => {
  let engine: GateEngine;

  beforeEach(() => {
    engine = new GateEngine();
    _mock.facilityId = FACILITY_ID;
  });

  // 1. Gate registration
  describe('Gate registration', () => {
    it('registers a gate successfully', () => {
      const res = engine.registerGate(makeGateInput());
      expect(res.success).toBe(true);
      expect(res.data!.name).toBe('Main Gate');
      expect(res.data!.status).toBe('active');
    });

    it('retrieves a registered gate by id', () => {
      const gate = engine.registerGate(makeGateInput()).data!;
      expect(engine.getGate(gate.id)).toBeDefined();
      expect(engine.getGate(gate.id)!.gateType).toBe('main');
    });

    it('lists gates by facility', () => {
      engine.registerGate(makeGateInput());
      engine.registerGate(makeGateInput({ name: 'Side Gate' }));
      expect(engine.getGatesByFacility(FACILITY_ID).length).toBe(2);
    });
  });

  // 2. Lane management
  describe('Lane management', () => {
    it('adds a lane to a gate', () => {
      const gate = engine.registerGate(makeGateInput()).data!;
      const res = engine.addLane({ gateId: gate.id, laneNumber: 'L1', laneType: 'in' });
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('open');
    });

    it('returns error when adding lane to unknown gate', () => {
      const res = engine.addLane({ gateId: uuid(), laneNumber: 'L1', laneType: 'in' });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('GATE_NOT_FOUND');
    });

    it('retrieves lanes by gate', () => {
      const gate = engine.registerGate(makeGateInput()).data!;
      engine.addLane({ gateId: gate.id, laneNumber: 'L1', laneType: 'in' });
      engine.addLane({ gateId: gate.id, laneNumber: 'L2', laneType: 'out' });
      expect(engine.getLanesByGate(gate.id).length).toBe(2);
    });

    it('sets lane status', () => {
      const { lane } = registerGateWithLane(engine);
      const res = engine.setLaneStatus(lane.id, 'maintenance');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('maintenance');
    });

    it('returns error for unknown lane', () => {
      const res = engine.setLaneStatus(uuid(), 'closed');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('LANE_NOT_FOUND');
    });
  });

  // 3. Appointments
  describe('Appointments', () => {
    it('creates an appointment', () => {
      const res = engine.createAppointment(makeAppointmentInput());
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('scheduled');
      expect(res.data!.appointmentNumber).toBeDefined();
    });

    it('retrieves an appointment by id', () => {
      const appt = engine.createAppointment(makeAppointmentInput()).data!;
      expect(engine.getAppointment(appt.id)!.truckNumber).toBe('MH04AB1234');
    });

    it('updates appointment status to arrived', () => {
      const appt = engine.createAppointment(makeAppointmentInput()).data!;
      const res = engine.updateAppointmentStatus(appt.id, 'arrived');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('arrived');
      expect(res.data!.actualArrival).toBeDefined();
    });

    it('returns error for unknown appointment', () => {
      const res = engine.updateAppointmentStatus(uuid(), 'arrived');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('APPOINTMENT_NOT_FOUND');
    });
  });

  // 4. Gate-in transaction
  describe('Gate-in transaction', () => {
    it('starts a gate-in transaction', () => {
      const { tx } = startGateInTx(engine);
      expect(tx.transactionType).toBe('GATE_IN');
      expect(tx.status).toBe('vehicle_at_gate');
      expect(tx.transactionNumber).toMatch(/^GI-/);
    });

    it('rejects gate-in on a closed lane', () => {
      const { gate, lane } = registerGateWithLane(engine);
      engine.setLaneStatus(lane.id, 'closed');
      const res = engine.startGateIn({
        gateId: gate.id, laneId: lane.id, truckNumber: 'MH04AB1234',
        driverName: 'Ravi', driverLicense: 'DL001', driverPhone: '+911234567890',
      });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('LANE_CLOSED');
    });

    it('passes document check and advances status', () => {
      const { tx } = startGateInTx(engine);
      const res = engine.processDocumentCheck(tx.id, true);
      expect(res.data!.status).toBe('physical_inspection');
      expect(res.data!.documentCheckTime).toBeDefined();
    });

    it('fails document check and marks rejected', () => {
      const { tx } = startGateInTx(engine);
      const res = engine.processDocumentCheck(tx.id, false, 'Missing e-way bill');
      expect(res.data!.status).toBe('rejected');
      expect(res.data!.rejectionReason).toBe('Missing e-way bill');
    });

    it('completes gate-in after document check', () => {
      const { tx } = startGateInTx(engine);
      engine.processDocumentCheck(tx.id, true);
      const res = engine.completeGateIn(tx.id, 'operator-1');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('completed');
      expect(res.data!.approvedBy).toBe('operator-1');
      expect(res.data!.completionTime).toBeDefined();
    });
  });

  // 5. Gate-out transaction
  describe('Gate-out transaction', () => {
    it('starts a gate-out transaction', () => {
      const { gate, lane } = registerGateWithLane(engine);
      const res = engine.startGateOut({
        gateId: gate.id, laneId: lane.id, truckNumber: 'MH04CD5678',
        driverName: 'Amit', driverLicense: 'DL002', driverPhone: '+919988776655',
        containerNumber: 'MSCU1234567',
      });
      expect(res.success).toBe(true);
      expect(res.data!.transactionType).toBe('GATE_OUT');
      expect(res.data!.transactionNumber).toMatch(/^GO-/);
    });

    it('completes a gate-out transaction', () => {
      const { gate, lane } = registerGateWithLane(engine);
      const goTx = engine.startGateOut({
        gateId: gate.id, laneId: lane.id, truckNumber: 'MH04CD5678',
        driverName: 'Amit', driverLicense: 'DL002', driverPhone: '+919988776655',
        containerNumber: 'MSCU1234567',
      }).data!;
      engine.processDocumentCheck(goTx.id, true);
      const res = engine.completeGateOut(goTx.id, 'operator-2');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('completed');
      expect(res.data!.approvedBy).toBe('operator-2');
    });
  });

  // 6. Transaction cancellation
  describe('Transaction cancellation', () => {
    it('cancels an in-progress transaction', () => {
      const { tx } = startGateInTx(engine);
      const res = engine.cancelTransaction(tx.id, 'Driver left');
      expect(res.success).toBe(true);
      expect(res.data!.status).toBe('cancelled');
      expect(res.data!.rejectionReason).toBe('Driver left');
    });

    it('cannot cancel a completed transaction', () => {
      const { tx } = startGateInTx(engine);
      engine.processDocumentCheck(tx.id, true);
      engine.completeGateIn(tx.id);
      const res = engine.cancelTransaction(tx.id, 'Too late');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_STATUS');
    });

    it('frees the lane after cancellation', () => {
      const { lane, tx } = startGateInTx(engine);
      expect(engine.getLane(lane.id)!.currentTransaction).toBe(tx.id);
      engine.cancelTransaction(tx.id, 'Cancelled');
      expect(engine.getLane(lane.id)!.currentTransaction).toBeUndefined();
    });
  });

  // 7. Active transactions query
  describe('Active transactions query', () => {
    it('returns active transactions for a facility', () => {
      const { gate, tx } = startGateInTx(engine);
      const active = engine.getActiveTransactions(gate.facilityId);
      expect(active.length).toBe(1);
      expect(active[0]!.id).toBe(tx.id);
    });

    it('excludes completed transactions', () => {
      const { gate, tx } = startGateInTx(engine);
      engine.processDocumentCheck(tx.id, true);
      engine.completeGateIn(tx.id);
      expect(engine.getActiveTransactions(gate.facilityId).length).toBe(0);
    });

    it('excludes cancelled transactions', () => {
      const { gate, tx } = startGateInTx(engine);
      engine.cancelTransaction(tx.id, 'No show');
      expect(engine.getActiveTransactions(gate.facilityId).length).toBe(0);
    });
  });

  // 8. Gate metrics
  describe('Gate metrics', () => {
    it('returns empty metrics for unknown gate', () => {
      const m = engine.getGateMetrics(uuid(), new Date());
      expect(m.totalTransactions).toBe(0);
      expect(m.gateInCount).toBe(0);
    });

    it('returns zero metrics when no transactions exist', () => {
      const gate = engine.registerGate(makeGateInput()).data!;
      const m = engine.getGateMetrics(gate.id, new Date());
      expect(m.totalTransactions).toBe(0);
      expect(m.averageProcessingMinutes).toBe(0);
    });
  });
});
