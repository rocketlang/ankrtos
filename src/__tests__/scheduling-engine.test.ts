/**
 * Scheduling Engine Tests
 *
 * Comprehensive unit tests for SchedulingEngine covering:
 * - Singleton pattern
 * - Dock Slot Management (register, get, list, update status, available slots)
 * - Dock Appointments (create, get, list, confirm, check-in, complete, cancel, reschedule, no-show)
 * - Trailer Management (register, get, list, assign, release, park, update status)
 * - Empty Container Ops (receive, get, list, survey, PTI, allotment, approve, pickup, stats)
 * - Stacking Rules (add, get, list, toggle, recommendation)
 * - Scheduling Stats
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SchedulingEngine } from '../scheduling/scheduling-engine';
import type {
  RegisterDockSlotInput,
  CreateDockAppointmentInput,
  RegisterTrailerInput,
  ReceiveEmptyInput,
  CreateAllotmentInput,
  AddStackingRuleInput,
} from '../scheduling/scheduling-engine';
import { TENANT_ID, FACILITY_ID, uuid } from './test-utils';

// ============================================================================
// Helper Factories
// ============================================================================

const GATE_ID = uuid();
let slotCounter = 1;

function makeDockSlotInput(overrides: Record<string, unknown> = {}): RegisterDockSlotInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    gateId: GATE_ID,
    slotNumber: `DS-${String(slotCounter++).padStart(3, '0')}`,
    slotType: 'dual',
    operatingHoursStart: '06:00',
    operatingHoursEnd: '22:00',
    slotDurationMinutes: 60,
    maxTrucksPerSlot: 2,
    hasWeighbridge: true,
    hasOCR: false,
    notes: 'Test dock slot',
    ...overrides,
  } as RegisterDockSlotInput;
}

function makeAppointmentInput(slotId: string, overrides: Record<string, unknown> = {}): CreateDockAppointmentInput {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    slotId,
    purpose: 'delivery_import',
    scheduledDate: tomorrow,
    scheduledTimeStart: '09:00',
    scheduledTimeEnd: '10:00',
    truckNumber: 'MH04AB1234',
    driverName: 'Suresh Kumar',
    driverPhone: '+919876543210',
    driverLicense: 'MH0420220001234',
    containerNumbers: ['MSCU1234567'],
    cargoDescription: 'Electronics',
    estimatedWeight: 18000,
    ...overrides,
  } as CreateDockAppointmentInput;
}

let trailerSeq = 1;

function makeTrailerInput(overrides: Record<string, unknown> = {}): RegisterTrailerInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    trailerNumber: `TRL-${String(trailerSeq++).padStart(4, '0')}`,
    trailerType: '40ft_chassis',
    owner: 'ICD Tughlakabad',
    ownerType: 'icd',
    maxPayload: 30000,
    tareWeight: 4500,
    length: 12.2,
    width: 2.44,
    currentLocation: 'Yard A',
    parkingSlot: 'P-01',
    ...overrides,
  } as RegisterTrailerInput;
}

let emptySeq = 1;

function makeEmptyInput(overrides: Record<string, unknown> = {}): ReceiveEmptyInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    containerNumber: `MSCU${String(900000 + emptySeq++)}0`,
    isoType: '42G1',
    shippingLine: 'MSC',
    receivedFrom: 'Transporter ABC',
    depotLocation: 'Empty Yard Block-A',
    yardSlot: 'EA-01',
    isReefer: false,
    ...overrides,
  } as ReceiveEmptyInput;
}

function makeAllotmentInput(overrides: Record<string, unknown> = {}): CreateAllotmentInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    shippingLine: 'MSC',
    requestedBy: 'Exporter Pvt Ltd',
    containerType: '42G1',
    quantityRequested: 2,
    notes: 'Urgent export booking',
    ...overrides,
  } as CreateAllotmentInput;
}

let ruleSeq = 1;

function makeStackingRuleInput(overrides: Record<string, unknown> = {}): AddStackingRuleInput {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    name: `Rule-${ruleSeq++}`,
    priority: 10,
    ruleType: 'segregation',
    conditions: {
      category: 'import',
      maxStackHeight: 4,
      allowMixedCategories: false,
      preferredBlocks: ['B'],
    },
    ...overrides,
  } as AddStackingRuleInput;
}

// ============================================================================
// Helper: register a dock slot and return the DockSlot object
// ============================================================================

function registerSlot(engine: SchedulingEngine, overrides: Record<string, unknown> = {}) {
  const result = engine.registerDockSlot(makeDockSlotInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function createAppointment(engine: SchedulingEngine, slotId: string, overrides: Record<string, unknown> = {}) {
  const result = engine.createAppointment(makeAppointmentInput(slotId, overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function registerTrailer(engine: SchedulingEngine, overrides: Record<string, unknown> = {}) {
  const result = engine.registerTrailer(makeTrailerInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function receiveEmpty(engine: SchedulingEngine, overrides: Record<string, unknown> = {}) {
  const result = engine.receiveEmptyContainer(makeEmptyInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function createAllotment(engine: SchedulingEngine, overrides: Record<string, unknown> = {}) {
  const result = engine.createAllotment(makeAllotmentInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function addRule(engine: SchedulingEngine, overrides: Record<string, unknown> = {}) {
  const result = engine.addStackingRule(makeStackingRuleInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

// ============================================================================
// TESTS
// ============================================================================

describe('SchedulingEngine', () => {
  let engine: SchedulingEngine;

  beforeEach(() => {
    SchedulingEngine.resetInstance();
    engine = SchedulingEngine.getInstance();
    slotCounter = 1;
    trailerSeq = 1;
    emptySeq = 1;
    ruleSeq = 1;
  });

  // ==========================================================================
  // Singleton Pattern
  // ==========================================================================

  describe('Singleton pattern', () => {
    it('should return the same instance on repeated calls', () => {
      const a = SchedulingEngine.getInstance();
      const b = SchedulingEngine.getInstance();
      expect(a).toBe(b);
    });

    it('should return a new instance after reset', () => {
      const a = SchedulingEngine.getInstance();
      SchedulingEngine.resetInstance();
      const b = SchedulingEngine.getInstance();
      expect(a).not.toBe(b);
    });
  });

  // ==========================================================================
  // Dock Slot Management
  // ==========================================================================

  describe('Dock Slot Management', () => {
    it('should register a new dock slot', () => {
      const result = engine.registerDockSlot(makeDockSlotInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('available');
      expect(result.data!.slotType).toBe('dual');
      expect(result.data!.hasWeighbridge).toBe(true);
      expect(result.data!.hasOCR).toBe(false);
      expect(result.data!.tenantId).toBe(TENANT_ID);
      expect(result.data!.facilityId).toBe(FACILITY_ID);
    });

    it('should default hasWeighbridge and hasOCR to false when not provided', () => {
      const result = engine.registerDockSlot(makeDockSlotInput({
        hasWeighbridge: undefined,
        hasOCR: undefined,
      }));
      expect(result.success).toBe(true);
      expect(result.data!.hasWeighbridge).toBe(false);
      expect(result.data!.hasOCR).toBe(false);
    });

    it('should reject duplicate slot number within same gate', () => {
      const slotNumber = 'DS-DUP-001';
      engine.registerDockSlot(makeDockSlotInput({ slotNumber }));
      const result = engine.registerDockSlot(makeDockSlotInput({ slotNumber }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_SLOT');
    });

    it('should allow same slot number on different gates', () => {
      const slotNumber = 'DS-SHARED-001';
      const gateA = uuid();
      const gateB = uuid();
      const r1 = engine.registerDockSlot(makeDockSlotInput({ slotNumber, gateId: gateA }));
      const r2 = engine.registerDockSlot(makeDockSlotInput({ slotNumber, gateId: gateB }));
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
    });

    it('should get dock slot by id', () => {
      const slot = registerSlot(engine);
      const found = engine.getDockSlot(slot.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(slot.id);
      expect(found!.slotNumber).toBe(slot.slotNumber);
    });

    it('should return undefined for unknown dock slot id', () => {
      const found = engine.getDockSlot('non-existent-id');
      expect(found).toBeUndefined();
    });

    it('should list dock slots by facility', () => {
      registerSlot(engine);
      registerSlot(engine);
      registerSlot(engine, { facilityId: 'other-facility' });

      const slots = engine.listDockSlots(FACILITY_ID);
      expect(slots).toHaveLength(2);
    });

    it('should list dock slots filtered by gate', () => {
      const gateA = uuid();
      const gateB = uuid();
      registerSlot(engine, { gateId: gateA });
      registerSlot(engine, { gateId: gateA });
      registerSlot(engine, { gateId: gateB });

      const slotsA = engine.listDockSlots(FACILITY_ID, gateA);
      expect(slotsA).toHaveLength(2);

      const slotsB = engine.listDockSlots(FACILITY_ID, gateB);
      expect(slotsB).toHaveLength(1);
    });

    it('should return empty array for unknown facility', () => {
      const slots = engine.listDockSlots('unknown-facility');
      expect(slots).toHaveLength(0);
    });

    it('should update dock slot status', () => {
      const slot = registerSlot(engine);
      const result = engine.updateDockSlotStatus(slot.id, 'maintenance');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('maintenance');
    });

    it('should fail to update status for unknown slot', () => {
      const result = engine.updateDockSlotStatus('non-existent-id', 'blocked');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should get available inbound slots for delivery_import', () => {
      registerSlot(engine, { slotType: 'inbound' });
      registerSlot(engine, { slotType: 'outbound' });
      registerSlot(engine, { slotType: 'dual' });

      const available = engine.getAvailableSlots(FACILITY_ID, new Date(), 'delivery_import');
      // inbound + dual = 2
      expect(available).toHaveLength(2);
    });

    it('should get available outbound slots for pickup_export', () => {
      registerSlot(engine, { slotType: 'inbound' });
      registerSlot(engine, { slotType: 'outbound' });
      registerSlot(engine, { slotType: 'dual' });

      const available = engine.getAvailableSlots(FACILITY_ID, new Date(), 'pickup_export');
      // outbound + dual = 2
      expect(available).toHaveLength(2);
    });

    it('should get only dual slots for survey purpose', () => {
      registerSlot(engine, { slotType: 'inbound' });
      registerSlot(engine, { slotType: 'outbound' });
      registerSlot(engine, { slotType: 'dual' });

      const available = engine.getAvailableSlots(FACILITY_ID, new Date(), 'survey');
      expect(available).toHaveLength(1);
      expect(available[0].slotType).toBe('dual');
    });

    it('should exclude non-available slots from available list', () => {
      const slot = registerSlot(engine, { slotType: 'dual' });
      engine.updateDockSlotStatus(slot.id, 'blocked');

      const available = engine.getAvailableSlots(FACILITY_ID, new Date(), 'delivery_import');
      expect(available).toHaveLength(0);
    });

    it('should get available slots for empty_return (inbound)', () => {
      registerSlot(engine, { slotType: 'inbound' });
      registerSlot(engine, { slotType: 'outbound' });

      const available = engine.getAvailableSlots(FACILITY_ID, new Date(), 'empty_return');
      expect(available).toHaveLength(1);
      expect(available[0].slotType).toBe('inbound');
    });

    it('should get available slots for empty_pickup (outbound)', () => {
      registerSlot(engine, { slotType: 'inbound' });
      registerSlot(engine, { slotType: 'outbound' });

      const available = engine.getAvailableSlots(FACILITY_ID, new Date(), 'empty_pickup');
      expect(available).toHaveLength(1);
      expect(available[0].slotType).toBe('outbound');
    });
  });

  // ==========================================================================
  // Dock Appointments
  // ==========================================================================

  describe('Dock Appointments', () => {
    it('should create a dock appointment', () => {
      const slot = registerSlot(engine);
      const result = engine.createAppointment(makeAppointmentInput(slot.id));
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('requested');
      expect(result.data!.appointmentNumber).toMatch(/^APT-\d{3}$/);
      expect(result.data!.smsNotified).toBe(false);
      expect(result.data!.reminderSent).toBe(false);
    });

    it('should generate sequential appointment numbers', () => {
      const slot = registerSlot(engine);
      const a1 = createAppointment(engine, slot.id, { scheduledTimeStart: '08:00', scheduledTimeEnd: '09:00' });
      const a2 = createAppointment(engine, slot.id, { scheduledTimeStart: '10:00', scheduledTimeEnd: '11:00' });
      expect(a1.appointmentNumber).toBe('APT-001');
      expect(a2.appointmentNumber).toBe('APT-002');
    });

    it('should fail when slot not found', () => {
      const result = engine.createAppointment(makeAppointmentInput('non-existent-slot'));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('SLOT_NOT_FOUND');
    });

    it('should fail when slot is blocked', () => {
      const slot = registerSlot(engine);
      engine.updateDockSlotStatus(slot.id, 'blocked');
      const result = engine.createAppointment(makeAppointmentInput(slot.id));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('SLOT_UNAVAILABLE');
    });

    it('should fail when slot is under maintenance', () => {
      const slot = registerSlot(engine);
      engine.updateDockSlotStatus(slot.id, 'maintenance');
      const result = engine.createAppointment(makeAppointmentInput(slot.id));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('SLOT_UNAVAILABLE');
    });

    it('should fail with time conflict on same slot and date', () => {
      const slot = registerSlot(engine);
      createAppointment(engine, slot.id, { scheduledTimeStart: '09:00', scheduledTimeEnd: '10:00' });
      const result = engine.createAppointment(makeAppointmentInput(slot.id, {
        scheduledTimeStart: '09:30',
        scheduledTimeEnd: '10:30',
      }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('TIME_CONFLICT');
    });

    it('should allow non-overlapping times on same slot', () => {
      const slot = registerSlot(engine);
      createAppointment(engine, slot.id, { scheduledTimeStart: '09:00', scheduledTimeEnd: '10:00' });
      const result = engine.createAppointment(makeAppointmentInput(slot.id, {
        scheduledTimeStart: '10:00',
        scheduledTimeEnd: '11:00',
      }));
      expect(result.success).toBe(true);
    });

    it('should get appointment by id', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      const found = engine.getAppointment(apt.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(apt.id);
    });

    it('should return undefined for unknown appointment id', () => {
      expect(engine.getAppointment('non-existent')).toBeUndefined();
    });

    it('should get appointment by number', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      const found = engine.getAppointmentByNumber(apt.appointmentNumber);
      expect(found).toBeDefined();
      expect(found!.id).toBe(apt.id);
    });

    it('should return undefined for unknown appointment number', () => {
      expect(engine.getAppointmentByNumber('APT-999')).toBeUndefined();
    });

    it('should list appointments by facility', () => {
      const slot = registerSlot(engine);
      createAppointment(engine, slot.id, { scheduledTimeStart: '08:00', scheduledTimeEnd: '09:00' });
      createAppointment(engine, slot.id, { scheduledTimeStart: '10:00', scheduledTimeEnd: '11:00' });

      const list = engine.listAppointments(FACILITY_ID);
      expect(list).toHaveLength(2);
    });

    it('should list appointments filtered by status', () => {
      const slot = registerSlot(engine);
      const apt1 = createAppointment(engine, slot.id, { scheduledTimeStart: '08:00', scheduledTimeEnd: '09:00' });
      createAppointment(engine, slot.id, { scheduledTimeStart: '10:00', scheduledTimeEnd: '11:00' });
      engine.confirmAppointment(apt1.id);

      const confirmed = engine.listAppointments(FACILITY_ID, undefined, 'confirmed');
      expect(confirmed).toHaveLength(1);
      expect(confirmed[0].id).toBe(apt1.id);
    });

    it('should list appointments filtered by date', () => {
      const slot = registerSlot(engine);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      createAppointment(engine, slot.id, {
        scheduledDate: tomorrow,
        scheduledTimeStart: '08:00',
        scheduledTimeEnd: '09:00',
      });

      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      createAppointment(engine, slot.id, {
        scheduledDate: dayAfter,
        scheduledTimeStart: '08:00',
        scheduledTimeEnd: '09:00',
      });

      const list = engine.listAppointments(FACILITY_ID, tomorrow);
      expect(list).toHaveLength(1);
    });

    it('should return empty list for unknown facility', () => {
      expect(engine.listAppointments('unknown-facility')).toHaveLength(0);
    });

    it('should confirm an appointment', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      const result = engine.confirmAppointment(apt.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('confirmed');
    });

    it('should fail to confirm when not in requested status', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      engine.confirmAppointment(apt.id);
      const result = engine.confirmAppointment(apt.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to confirm unknown appointment', () => {
      const result = engine.confirmAppointment('non-existent');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should check in a confirmed appointment', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      engine.confirmAppointment(apt.id);
      const result = engine.checkInAppointment(apt.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('checked_in');
      expect(result.data!.actualArrivalTime).toBeDefined();
      expect(result.data!.waitTimeMinutes).toBeDefined();
    });

    it('should check in a requested appointment (skip confirm)', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      const result = engine.checkInAppointment(apt.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('checked_in');
    });

    it('should fail to check in a completed appointment', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      engine.confirmAppointment(apt.id);
      engine.checkInAppointment(apt.id);
      engine.completeAppointment(apt.id);
      const result = engine.checkInAppointment(apt.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to check in unknown appointment', () => {
      const result = engine.checkInAppointment('non-existent');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should complete a checked-in appointment', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      engine.confirmAppointment(apt.id);
      engine.checkInAppointment(apt.id);
      const result = engine.completeAppointment(apt.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('completed');
      expect(result.data!.actualEndTime).toBeDefined();
      expect(result.data!.turnaroundMinutes).toBeDefined();
    });

    it('should fail to complete when not checked in or in progress', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      const result = engine.completeAppointment(apt.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to complete unknown appointment', () => {
      const result = engine.completeAppointment('non-existent');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should cancel an appointment', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      const result = engine.cancelAppointment(apt.id, 'Driver unavailable', 'dispatcher-001');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('cancelled');
      expect(result.data!.cancelReason).toBe('Driver unavailable');
      expect(result.data!.cancelledBy).toBe('dispatcher-001');
      expect(result.data!.cancelledAt).toBeDefined();
    });

    it('should fail to cancel a completed appointment', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      engine.confirmAppointment(apt.id);
      engine.checkInAppointment(apt.id);
      engine.completeAppointment(apt.id);
      const result = engine.cancelAppointment(apt.id, 'Test', 'admin');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to cancel an already cancelled appointment', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      engine.cancelAppointment(apt.id, 'Reason 1', 'admin');
      const result = engine.cancelAppointment(apt.id, 'Reason 2', 'admin');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to cancel unknown appointment', () => {
      const result = engine.cancelAppointment('non-existent', 'Test', 'admin');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should reschedule an appointment', () => {
      const slotA = registerSlot(engine);
      const slotB = registerSlot(engine);
      const apt = createAppointment(engine, slotA.id);

      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 3);
      newDate.setHours(0, 0, 0, 0);

      const result = engine.rescheduleAppointment(apt.id, newDate, slotB.id, 'Weather delay', 'ops-001');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('rescheduled');
      expect(result.data!.slotId).toBe(slotB.id);
      expect(result.data!.scheduledDate).toBe(newDate);
      expect(result.data!.rescheduleReason).toBe('Weather delay');
      expect(result.data!.rescheduledBy).toBe('ops-001');
      expect(result.data!.originalSlotId).toBe(slotA.id);
      expect(result.data!.originalDate).toBeDefined();
    });

    it('should fail to reschedule a completed appointment', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      engine.confirmAppointment(apt.id);
      engine.checkInAppointment(apt.id);
      engine.completeAppointment(apt.id);

      const result = engine.rescheduleAppointment(apt.id, new Date(), slot.id, 'Test', 'admin');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to reschedule a cancelled appointment', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      engine.cancelAppointment(apt.id, 'Test', 'admin');

      const result = engine.rescheduleAppointment(apt.id, new Date(), slot.id, 'Test', 'admin');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to reschedule to non-existent slot', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);

      const result = engine.rescheduleAppointment(apt.id, new Date(), 'bad-slot', 'Test', 'admin');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('SLOT_NOT_FOUND');
    });

    it('should fail to reschedule unknown appointment', () => {
      const slot = registerSlot(engine);
      const result = engine.rescheduleAppointment('non-existent', new Date(), slot.id, 'Test', 'admin');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to reschedule when time conflict on new slot', () => {
      const slot = registerSlot(engine);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      // Create existing appointment on slot for tomorrow 09:00-10:00
      createAppointment(engine, slot.id, {
        scheduledDate: tomorrow,
        scheduledTimeStart: '09:00',
        scheduledTimeEnd: '10:00',
      });

      // Create a second slot and an appointment on it
      const slot2 = registerSlot(engine);
      const apt2 = createAppointment(engine, slot2.id, {
        scheduledDate: tomorrow,
        scheduledTimeStart: '09:00',
        scheduledTimeEnd: '10:00',
      });

      // Try to reschedule apt2 to slot (which already has a 09:00-10:00 appointment)
      const result = engine.rescheduleAppointment(apt2.id, tomorrow, slot.id, 'Test', 'admin');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('TIME_CONFLICT');
    });

    it('should mark appointment as no-show', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      const result = engine.markNoShow(apt.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('no_show');
    });

    it('should fail to mark no-show for completed appointment', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      engine.confirmAppointment(apt.id);
      engine.checkInAppointment(apt.id);
      engine.completeAppointment(apt.id);
      const result = engine.markNoShow(apt.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to mark no-show for cancelled appointment', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      engine.cancelAppointment(apt.id, 'Test', 'admin');
      const result = engine.markNoShow(apt.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to mark no-show for already no-show appointment', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      engine.markNoShow(apt.id);
      const result = engine.markNoShow(apt.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to mark no-show for unknown appointment', () => {
      const result = engine.markNoShow('non-existent');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  // ==========================================================================
  // Trailer & Chassis Management
  // ==========================================================================

  describe('Trailer Management', () => {
    it('should register a new trailer', () => {
      const result = engine.registerTrailer(makeTrailerInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('available');
      expect(result.data!.trailerType).toBe('40ft_chassis');
      expect(result.data!.ownerType).toBe('icd');
    });

    it('should reject duplicate trailer number', () => {
      const trailerNumber = 'TRL-DUP-001';
      engine.registerTrailer(makeTrailerInput({ trailerNumber }));
      const result = engine.registerTrailer(makeTrailerInput({ trailerNumber }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_TRAILER');
    });

    it('should compute inspection status as due when no lastInspectionDate', () => {
      const result = engine.registerTrailer(makeTrailerInput({
        lastInspectionDate: undefined,
        nextInspectionDue: undefined,
      }));
      expect(result.success).toBe(true);
      expect(result.data!.inspectionStatus).toBe('due');
    });

    it('should compute inspection status as valid when next due is far away', () => {
      const result = engine.registerTrailer(makeTrailerInput({
        lastInspectionDate: new Date(),
        nextInspectionDue: new Date(Date.now() + 60 * 86400000), // 60 days from now
      }));
      expect(result.success).toBe(true);
      expect(result.data!.inspectionStatus).toBe('valid');
    });

    it('should compute inspection status as overdue when past due', () => {
      const result = engine.registerTrailer(makeTrailerInput({
        lastInspectionDate: new Date(Date.now() - 90 * 86400000),
        nextInspectionDue: new Date(Date.now() - 1 * 86400000), // yesterday
      }));
      expect(result.success).toBe(true);
      expect(result.data!.inspectionStatus).toBe('overdue');
    });

    it('should compute inspection status as due when within 7 days', () => {
      const result = engine.registerTrailer(makeTrailerInput({
        lastInspectionDate: new Date(Date.now() - 30 * 86400000),
        nextInspectionDue: new Date(Date.now() + 3 * 86400000), // 3 days from now
      }));
      expect(result.success).toBe(true);
      expect(result.data!.inspectionStatus).toBe('due');
    });

    it('should compute inspection status as valid when no nextInspectionDue', () => {
      const result = engine.registerTrailer(makeTrailerInput({
        lastInspectionDate: new Date(),
        nextInspectionDue: undefined,
      }));
      expect(result.success).toBe(true);
      expect(result.data!.inspectionStatus).toBe('valid');
    });

    it('should get trailer by id', () => {
      const trailer = registerTrailer(engine);
      const found = engine.getTrailer(trailer.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(trailer.id);
    });

    it('should return undefined for unknown trailer id', () => {
      expect(engine.getTrailer('non-existent')).toBeUndefined();
    });

    it('should get trailer by number', () => {
      const trailer = registerTrailer(engine);
      const found = engine.getTrailerByNumber(trailer.trailerNumber);
      expect(found).toBeDefined();
      expect(found!.id).toBe(trailer.id);
    });

    it('should return undefined for unknown trailer number', () => {
      expect(engine.getTrailerByNumber('TRL-NONEXISTENT')).toBeUndefined();
    });

    it('should list trailers by tenant', () => {
      registerTrailer(engine);
      registerTrailer(engine);
      registerTrailer(engine, { tenantId: 'other-tenant' });

      const list = engine.listTrailers(TENANT_ID);
      expect(list).toHaveLength(2);
    });

    it('should list trailers filtered by status', () => {
      const t1 = registerTrailer(engine);
      registerTrailer(engine);
      engine.updateTrailerStatus(t1.id, 'maintenance');

      const available = engine.listTrailers(TENANT_ID, 'available');
      expect(available).toHaveLength(1);

      const maintenance = engine.listTrailers(TENANT_ID, 'maintenance');
      expect(maintenance).toHaveLength(1);
    });

    it('should list trailers filtered by type', () => {
      registerTrailer(engine, { trailerType: '40ft_chassis' });
      registerTrailer(engine, { trailerType: '20ft_chassis' });
      registerTrailer(engine, { trailerType: '40ft_chassis' });

      const chassis40 = engine.listTrailers(TENANT_ID, undefined, '40ft_chassis');
      expect(chassis40).toHaveLength(2);

      const chassis20 = engine.listTrailers(TENANT_ID, undefined, '20ft_chassis');
      expect(chassis20).toHaveLength(1);
    });

    it('should assign a trailer', () => {
      const trailer = registerTrailer(engine);
      const containerId = uuid();
      const result = engine.assignTrailer(trailer.id, containerId, 'MH04XY9999');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('in_use');
      expect(result.data!.assignedContainerId).toBe(containerId);
      expect(result.data!.assignedTruckNumber).toBe('MH04XY9999');
      expect(result.data!.assignedAt).toBeDefined();
    });

    it('should assign a parked trailer', () => {
      const trailer = registerTrailer(engine);
      engine.parkTrailer(trailer.id, 'P-05');
      const result = engine.assignTrailer(trailer.id, uuid(), 'MH04XY9999');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('in_use');
    });

    it('should fail to assign a trailer that is already in use', () => {
      const trailer = registerTrailer(engine);
      engine.assignTrailer(trailer.id, uuid(), 'MH04AB1234');
      const result = engine.assignTrailer(trailer.id, uuid(), 'MH04CD5678');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to assign unknown trailer', () => {
      const result = engine.assignTrailer('non-existent', uuid(), 'MH04AB1234');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should release a trailer', () => {
      const trailer = registerTrailer(engine);
      engine.assignTrailer(trailer.id, uuid(), 'MH04AB1234');
      const result = engine.releaseTrailer(trailer.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('available');
      expect(result.data!.assignedContainerId).toBeUndefined();
      expect(result.data!.assignedTruckNumber).toBeUndefined();
      expect(result.data!.assignedAt).toBeUndefined();
    });

    it('should fail to release a trailer not in use', () => {
      const trailer = registerTrailer(engine);
      const result = engine.releaseTrailer(trailer.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to release unknown trailer', () => {
      const result = engine.releaseTrailer('non-existent');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should park a trailer', () => {
      const trailer = registerTrailer(engine);
      const result = engine.parkTrailer(trailer.id, 'P-12');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('parked');
      expect(result.data!.parkingSlot).toBe('P-12');
      expect(result.data!.currentLocation).toBe('P-12');
    });

    it('should fail to park a retired trailer', () => {
      const trailer = registerTrailer(engine);
      engine.updateTrailerStatus(trailer.id, 'retired');
      const result = engine.parkTrailer(trailer.id, 'P-12');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to park a damaged trailer', () => {
      const trailer = registerTrailer(engine);
      engine.updateTrailerStatus(trailer.id, 'damaged');
      const result = engine.parkTrailer(trailer.id, 'P-12');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to park unknown trailer', () => {
      const result = engine.parkTrailer('non-existent', 'P-12');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should update trailer status directly', () => {
      const trailer = registerTrailer(engine);
      const result = engine.updateTrailerStatus(trailer.id, 'damaged');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('damaged');
    });

    it('should fail to update status of unknown trailer', () => {
      const result = engine.updateTrailerStatus('non-existent', 'available');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  // ==========================================================================
  // Empty Container Management
  // ==========================================================================

  describe('Empty Container Management', () => {
    it('should receive an empty container', () => {
      const result = engine.receiveEmptyContainer(makeEmptyInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('in_depot');
      expect(result.data!.isReefer).toBe(false);
      expect(result.data!.receivedDate).toBeDefined();
    });

    it('should receive a reefer container', () => {
      const result = engine.receiveEmptyContainer(makeEmptyInput({ isReefer: true }));
      expect(result.success).toBe(true);
      expect(result.data!.isReefer).toBe(true);
    });

    it('should receive a container with damages', () => {
      const damages = ['Dent on left panel', 'Rust on floor'];
      const result = engine.receiveEmptyContainer(makeEmptyInput({ damages }));
      expect(result.success).toBe(true);
      expect(result.data!.damages).toEqual(damages);
    });

    it('should get empty container by id', () => {
      const container = receiveEmpty(engine);
      const found = engine.getEmptyContainer(container.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(container.id);
    });

    it('should return undefined for unknown empty container id', () => {
      expect(engine.getEmptyContainer('non-existent')).toBeUndefined();
    });

    it('should list empty containers by tenant', () => {
      receiveEmpty(engine);
      receiveEmpty(engine);
      receiveEmpty(engine, { tenantId: 'other-tenant' });

      const list = engine.listEmptyContainers(TENANT_ID);
      expect(list).toHaveLength(2);
    });

    it('should list empty containers filtered by status', () => {
      const c1 = receiveEmpty(engine);
      receiveEmpty(engine);
      engine.recordSurveyResult(c1.id, 'pass');

      const inDepot = engine.listEmptyContainers(TENANT_ID, 'in_depot');
      expect(inDepot).toHaveLength(1);

      const passed = engine.listEmptyContainers(TENANT_ID, 'survey_passed');
      expect(passed).toHaveLength(1);
    });

    it('should list empty containers filtered by shipping line', () => {
      receiveEmpty(engine, { shippingLine: 'MSC' });
      receiveEmpty(engine, { shippingLine: 'Maersk' });
      receiveEmpty(engine, { shippingLine: 'MSC' });

      const msc = engine.listEmptyContainers(TENANT_ID, undefined, 'MSC');
      expect(msc).toHaveLength(2);

      const maersk = engine.listEmptyContainers(TENANT_ID, undefined, 'Maersk');
      expect(maersk).toHaveLength(1);
    });

    it('should record survey pass result', () => {
      const container = receiveEmpty(engine);
      const result = engine.recordSurveyResult(container.id, 'pass', 'Clean container');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('survey_passed');
      expect(result.data!.surveyResult).toBe('pass');
      expect(result.data!.surveyRemarks).toBe('Clean container');
      expect(result.data!.surveyDate).toBeDefined();
    });

    it('should record survey fail result', () => {
      const container = receiveEmpty(engine);
      const result = engine.recordSurveyResult(container.id, 'fail', 'Floor damaged');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('survey_failed');
      expect(result.data!.surveyResult).toBe('fail');
    });

    it('should fail to survey when container is not in depot or survey_pending', () => {
      const container = receiveEmpty(engine);
      engine.recordSurveyResult(container.id, 'pass');
      const result = engine.recordSurveyResult(container.id, 'pass');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to survey unknown container', () => {
      const result = engine.recordSurveyResult('non-existent', 'pass');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should record PTI pass result for reefer', () => {
      const container = receiveEmpty(engine, { isReefer: true });
      const result = engine.recordPTIResult(container.id, 'pass', -18, 'Reefer OK');
      expect(result.success).toBe(true);
      expect(result.data!.ptiResult).toBe('pass');
      expect(result.data!.setTemperature).toBe(-18);
      expect(result.data!.ptiRemarks).toBe('Reefer OK');
      expect(result.data!.ptiDate).toBeDefined();
    });

    it('should record PTI fail result for reefer', () => {
      const container = receiveEmpty(engine, { isReefer: true });
      const result = engine.recordPTIResult(container.id, 'fail', undefined, 'Compressor not working');
      expect(result.success).toBe(true);
      expect(result.data!.ptiResult).toBe('fail');
    });

    it('should fail PTI for non-reefer container', () => {
      const container = receiveEmpty(engine, { isReefer: false });
      const result = engine.recordPTIResult(container.id, 'pass');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_REEFER');
    });

    it('should fail PTI for unknown container', () => {
      const result = engine.recordPTIResult('non-existent', 'pass');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should create an allotment', () => {
      const result = engine.createAllotment(makeAllotmentInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('requested');
      expect(result.data!.allotmentNumber).toMatch(/^ALT-\d{3}$/);
      expect(result.data!.quantityAllotted).toBe(0);
      expect(result.data!.quantityPickedUp).toBe(0);
      expect(result.data!.containerIds).toHaveLength(0);
    });

    it('should generate sequential allotment numbers', () => {
      const a1 = createAllotment(engine);
      const a2 = createAllotment(engine);
      expect(a1.allotmentNumber).toBe('ALT-001');
      expect(a2.allotmentNumber).toBe('ALT-002');
    });

    it('should approve an allotment and assign matching containers', () => {
      // Receive 3 matching containers
      receiveEmpty(engine, { shippingLine: 'MSC', isoType: '42G1' });
      receiveEmpty(engine, { shippingLine: 'MSC', isoType: '42G1' });
      receiveEmpty(engine, { shippingLine: 'Maersk', isoType: '42G1' }); // Different line

      const allotment = createAllotment(engine, { shippingLine: 'MSC', containerType: '42G1', quantityRequested: 2 });
      const result = engine.approveAllotment(allotment.id, 'warehouse-mgr-001');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('approved');
      expect(result.data!.approvedBy).toBe('warehouse-mgr-001');
      expect(result.data!.approvedDate).toBeDefined();
      expect(result.data!.quantityAllotted).toBe(2);
      expect(result.data!.containerIds).toHaveLength(2);
    });

    it('should allot fewer containers when insufficient matching stock', () => {
      receiveEmpty(engine, { shippingLine: 'MSC', isoType: '42G1' });
      const allotment = createAllotment(engine, { shippingLine: 'MSC', containerType: '42G1', quantityRequested: 5 });
      const result = engine.approveAllotment(allotment.id, 'mgr');
      expect(result.success).toBe(true);
      expect(result.data!.quantityAllotted).toBe(1);
      expect(result.data!.containerIds).toHaveLength(1);
    });

    it('should fail to approve non-requested allotment', () => {
      const allotment = createAllotment(engine);
      engine.approveAllotment(allotment.id, 'mgr');
      const result = engine.approveAllotment(allotment.id, 'mgr');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to approve unknown allotment', () => {
      const result = engine.approveAllotment('non-existent', 'mgr');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should update container statuses on allotment approval', () => {
      const c1 = receiveEmpty(engine, { shippingLine: 'MSC', isoType: '42G1' });
      const allotment = createAllotment(engine, { shippingLine: 'MSC', containerType: '42G1', quantityRequested: 1 });
      engine.approveAllotment(allotment.id, 'mgr');

      const updated = engine.getEmptyContainer(c1.id)!;
      expect(updated.status).toBe('allotted');
      expect(updated.allotmentId).toBe(allotment.id);
      expect(updated.allottedDate).toBeDefined();
    });

    it('should record pickup from an allotment', () => {
      const c1 = receiveEmpty(engine, { shippingLine: 'MSC', isoType: '42G1', containerNumber: 'MSCU5000001' });
      const allotment = createAllotment(engine, { shippingLine: 'MSC', containerType: '42G1', quantityRequested: 1 });
      engine.approveAllotment(allotment.id, 'mgr');

      const result = engine.recordPickup(allotment.id, 'MSCU5000001');
      expect(result.success).toBe(true);
      expect(result.data!.quantityPickedUp).toBe(1);
      // Since quantityAllotted is 1 and quantityPickedUp is 1, status should be 'picked_up'
      expect(result.data!.status).toBe('picked_up');

      // Container should also be marked picked_up
      const container = engine.getEmptyContainer(c1.id)!;
      expect(container.status).toBe('picked_up');
      expect(container.releaseDate).toBeDefined();
    });

    it('should set allotment status to allotted when partial pickup', () => {
      receiveEmpty(engine, { shippingLine: 'MSC', isoType: '42G1', containerNumber: 'MSCU6000001' });
      receiveEmpty(engine, { shippingLine: 'MSC', isoType: '42G1', containerNumber: 'MSCU6000002' });
      const allotment = createAllotment(engine, { shippingLine: 'MSC', containerType: '42G1', quantityRequested: 2 });
      engine.approveAllotment(allotment.id, 'mgr');

      const result = engine.recordPickup(allotment.id, 'MSCU6000001');
      expect(result.success).toBe(true);
      expect(result.data!.quantityPickedUp).toBe(1);
      expect(result.data!.status).toBe('allotted');
    });

    it('should fail to record pickup for non-approved allotment', () => {
      const allotment = createAllotment(engine);
      const result = engine.recordPickup(allotment.id, 'MSCU0000000');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail to record pickup for unknown allotment', () => {
      const result = engine.recordPickup('non-existent', 'MSCU0000000');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to record pickup with wrong container number', () => {
      receiveEmpty(engine, { shippingLine: 'MSC', isoType: '42G1', containerNumber: 'MSCU7000001' });
      const allotment = createAllotment(engine, { shippingLine: 'MSC', containerType: '42G1', quantityRequested: 1 });
      engine.approveAllotment(allotment.id, 'mgr');

      const result = engine.recordPickup(allotment.id, 'MSCU9999999');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CONTAINER_NOT_FOUND');
    });

    it('should return empty container stats', () => {
      receiveEmpty(engine, { shippingLine: 'MSC' });
      receiveEmpty(engine, { shippingLine: 'MSC' });
      receiveEmpty(engine, { shippingLine: 'Maersk' });

      const stats = engine.getEmptyContainerStats(TENANT_ID);
      expect(stats.totalInDepot).toBe(3);
      expect(stats.pendingSurvey).toBe(3); // in_depot counts as pending
      expect(stats.allotted).toBe(0);
      expect(stats.byShippingLine['MSC']).toBe(2);
      expect(stats.byShippingLine['Maersk']).toBe(1);
    });

    it('should return zeroed stats for empty tenant', () => {
      const stats = engine.getEmptyContainerStats('empty-tenant');
      expect(stats.totalInDepot).toBe(0);
      expect(stats.pendingSurvey).toBe(0);
      expect(stats.allotted).toBe(0);
      expect(Object.keys(stats.byShippingLine)).toHaveLength(0);
    });

    it('should exclude picked_up containers from byShippingLine stats', () => {
      const c1 = receiveEmpty(engine, { shippingLine: 'MSC', isoType: '42G1', containerNumber: 'MSCU8000001' });
      receiveEmpty(engine, { shippingLine: 'MSC', isoType: '42G1' });
      const allotment = createAllotment(engine, { shippingLine: 'MSC', containerType: '42G1', quantityRequested: 1 });
      engine.approveAllotment(allotment.id, 'mgr');
      engine.recordPickup(allotment.id, 'MSCU8000001');

      const stats = engine.getEmptyContainerStats(TENANT_ID);
      // One picked_up (excluded from byShippingLine), one in_depot, one allotted (c1 was allotted then picked up, but the second MSC container was allotted)
      expect(stats.byShippingLine['MSC']).toBe(1);
    });
  });

  // ==========================================================================
  // Stacking Rules
  // ==========================================================================

  describe('Stacking Rules', () => {
    it('should add a stacking rule', () => {
      const result = engine.addStackingRule(makeStackingRuleInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.enabled).toBe(true);
      expect(result.data!.ruleType).toBe('segregation');
      expect(result.data!.priority).toBe(10);
    });

    it('should get a stacking rule by id', () => {
      const rule = addRule(engine);
      const found = engine.getStackingRule(rule.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(rule.id);
      expect(found!.name).toBe(rule.name);
    });

    it('should return undefined for unknown stacking rule id', () => {
      expect(engine.getStackingRule('non-existent')).toBeUndefined();
    });

    it('should list stacking rules by tenant sorted by priority descending', () => {
      addRule(engine, { priority: 5 });
      addRule(engine, { priority: 20 });
      addRule(engine, { priority: 10 });

      const rules = engine.listStackingRules(TENANT_ID);
      expect(rules).toHaveLength(3);
      expect(rules[0].priority).toBe(20);
      expect(rules[1].priority).toBe(10);
      expect(rules[2].priority).toBe(5);
    });

    it('should list only enabled rules', () => {
      const r1 = addRule(engine);
      addRule(engine);
      engine.toggleStackingRule(r1.id, false);

      const enabled = engine.listStackingRules(TENANT_ID, true);
      expect(enabled).toHaveLength(1);

      const disabled = engine.listStackingRules(TENANT_ID, false);
      expect(disabled).toHaveLength(1);
      expect(disabled[0].id).toBe(r1.id);
    });

    it('should return empty list for unknown tenant', () => {
      expect(engine.listStackingRules('unknown-tenant')).toHaveLength(0);
    });

    it('should toggle a stacking rule off', () => {
      const rule = addRule(engine);
      const result = engine.toggleStackingRule(rule.id, false);
      expect(result.success).toBe(true);
      expect(result.data!.enabled).toBe(false);
    });

    it('should toggle a stacking rule back on', () => {
      const rule = addRule(engine);
      engine.toggleStackingRule(rule.id, false);
      const result = engine.toggleStackingRule(rule.id, true);
      expect(result.success).toBe(true);
      expect(result.data!.enabled).toBe(true);
    });

    it('should fail to toggle unknown stacking rule', () => {
      const result = engine.toggleStackingRule('non-existent', false);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should get default stacking recommendation when no rules exist', () => {
      const containerId = uuid();
      const rec = engine.getStackingRecommendation(containerId, 'MSCU1234567', 'import', 15000);
      expect(rec.containerId).toBe(containerId);
      expect(rec.containerNumber).toBe('MSCU1234567');
      expect(rec.score).toBe(50); // Base score
      expect(rec.strategy).toBe('balanced');
      expect(rec.reasons).toContain('Default placement: no active stacking rules matched');
      expect(rec.alternativeLocations.length).toBeGreaterThan(0);
    });

    it('should apply segregation rule to stacking recommendation', () => {
      addRule(engine, {
        ruleType: 'segregation',
        priority: 10,
        conditions: {
          category: 'import',
          preferredBlocks: ['C'],
          allowMixedCategories: false,
        },
      });

      const rec = engine.getStackingRecommendation(uuid(), 'MSCU1234567', 'import', 15000);
      expect(rec.recommendedBlock).toBe('C');
      expect(rec.strategy).toBe('segregation_based');
      expect(rec.reasons.some(r => r.includes('Segregation rule'))).toBe(true);
      expect(rec.reasons.some(r => r.includes('No mixed categories'))).toBe(true);
    });

    it('should apply weight rule - heavy container on bottom', () => {
      addRule(engine, {
        ruleType: 'weight',
        priority: 10,
        conditions: {
          heavyOnBottom: true,
          maxStackHeight: 4,
        },
      });

      const rec = engine.getStackingRecommendation(uuid(), 'MSCU1234567', 'import', 25000);
      expect(rec.recommendedTier).toBe(1);
      expect(rec.strategy).toBe('weight_based');
      expect(rec.reasons.some(r => r.includes('Heavy container'))).toBe(true);
    });

    it('should apply weight rule - light container on upper tier', () => {
      addRule(engine, {
        ruleType: 'weight',
        priority: 10,
        conditions: {
          heavyOnBottom: true,
          maxStackHeight: 4,
        },
      });

      const rec = engine.getStackingRecommendation(uuid(), 'MSCU1234567', 'import', 5000);
      expect(rec.recommendedTier).toBe(3);
      expect(rec.reasons.some(r => r.includes('Light container'))).toBe(true);
    });

    it('should apply weight rule - medium weight container on middle tier', () => {
      addRule(engine, {
        ruleType: 'weight',
        priority: 10,
        conditions: {
          heavyOnBottom: true,
          maxStackHeight: 4,
        },
      });

      const rec = engine.getStackingRecommendation(uuid(), 'MSCU1234567', 'import', 15000);
      expect(rec.recommendedTier).toBe(2);
      expect(rec.reasons.some(r => r.includes('Medium-weight'))).toBe(true);
    });

    it('should apply departure rule - near departure', () => {
      addRule(engine, {
        ruleType: 'departure',
        priority: 10,
        conditions: {
          departureWindowHours: 48,
          maxStackHeight: 4,
        },
      });

      // Departure in 12 hours (within 48h window)
      const departureDate = new Date(Date.now() + 12 * 3600000);
      const rec = engine.getStackingRecommendation(uuid(), 'MSCU1234567', 'export', 15000, departureDate);
      expect(rec.recommendedTier).toBe(4);
      expect(rec.strategy).toBe('departure_based');
      expect(rec.rehandlesNeeded).toBe(0);
      expect(rec.reasons.some(r => r.includes('Near departure'))).toBe(true);
    });

    it('should apply departure rule - far from departure', () => {
      addRule(engine, {
        ruleType: 'departure',
        priority: 10,
        conditions: {
          departureWindowHours: 24,
          maxStackHeight: 4,
        },
      });

      // Departure in 72 hours (outside 24h window)
      const departureDate = new Date(Date.now() + 72 * 3600000);
      const rec = engine.getStackingRecommendation(uuid(), 'MSCU1234567', 'export', 15000, departureDate);
      expect(rec.recommendedTier).toBe(1);
      expect(rec.reasons.some(r => r.includes('can be stacked lower'))).toBe(true);
    });

    it('should apply shipping_line rule', () => {
      addRule(engine, {
        ruleType: 'shipping_line',
        priority: 10,
        conditions: {
          preferredBlocks: ['D'],
        },
      });

      const rec = engine.getStackingRecommendation(uuid(), 'MSCU1234567', 'import', 15000);
      expect(rec.recommendedBlock).toBe('D');
      expect(rec.reasons.some(r => r.includes('Shipping line grouping'))).toBe(true);
    });

    it('should apply custom rule with maxStackHeight', () => {
      addRule(engine, {
        ruleType: 'custom',
        priority: 10,
        conditions: {
          maxStackHeight: 2,
          preferredBlocks: ['E'],
        },
      });

      const rec = engine.getStackingRecommendation(uuid(), 'MSCU1234567', 'import', 15000);
      expect(rec.recommendedBlock).toBe('E');
      expect(rec.reasons.some(r => r.includes('Custom rule'))).toBe(true);
    });

    it('should cap recommendation score at 100', () => {
      // Add many high-scoring rules
      addRule(engine, {
        ruleType: 'segregation', priority: 20,
        conditions: { category: 'import', preferredBlocks: ['B'], allowMixedCategories: false },
      });
      addRule(engine, {
        ruleType: 'weight', priority: 15,
        conditions: { heavyOnBottom: true, maxStackHeight: 4 },
      });
      addRule(engine, {
        ruleType: 'departure', priority: 10,
        conditions: { departureWindowHours: 100, maxStackHeight: 4 },
      });

      const departureDate = new Date(Date.now() + 12 * 3600000);
      const rec = engine.getStackingRecommendation(uuid(), 'MSCU1234567', 'import', 25000, departureDate);
      expect(rec.score).toBeLessThanOrEqual(100);
    });

    it('should generate alternative locations', () => {
      const rec = engine.getStackingRecommendation(uuid(), 'MSCU1234567', 'import', 15000);
      expect(rec.alternativeLocations).toBeDefined();
      expect(rec.alternativeLocations.length).toBeLessThanOrEqual(3);
      // Each alternative should have descending scores
      for (let i = 0; i < rec.alternativeLocations.length; i++) {
        expect(rec.alternativeLocations[i].score).toBeGreaterThanOrEqual(10);
      }
    });

    it('should not apply disabled rules in recommendation', () => {
      const rule = addRule(engine, {
        ruleType: 'segregation',
        priority: 10,
        conditions: { category: 'import', preferredBlocks: ['C'] },
      });
      engine.toggleStackingRule(rule.id, false);

      const rec = engine.getStackingRecommendation(uuid(), 'MSCU1234567', 'import', 15000);
      // Default block is 'A', not 'C' since rule is disabled
      expect(rec.recommendedBlock).toBe('A');
      expect(rec.reasons).toContain('Default placement: no active stacking rules matched');
    });
  });

  // ==========================================================================
  // Scheduling Stats
  // ==========================================================================

  describe('Scheduling Stats', () => {
    it('should return complete stats for a tenant', () => {
      // Create some data
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id, { scheduledTimeStart: '08:00', scheduledTimeEnd: '09:00' });
      engine.confirmAppointment(apt.id);
      engine.checkInAppointment(apt.id);
      engine.completeAppointment(apt.id);

      const apt2 = createAppointment(engine, slot.id, { scheduledTimeStart: '10:00', scheduledTimeEnd: '11:00' });
      engine.cancelAppointment(apt2.id, 'Test', 'admin');

      registerTrailer(engine);
      const t2 = registerTrailer(engine);
      engine.assignTrailer(t2.id, uuid(), 'MH04AB1234');

      receiveEmpty(engine);
      addRule(engine);

      const stats = engine.getSchedulingStats(TENANT_ID);
      expect(stats.tenantId).toBe(TENANT_ID);

      // Appointments
      expect(stats.totalAppointments).toBe(2);
      expect(stats.completedAppointments).toBe(1);
      expect(stats.cancelledAppointments).toBe(1);

      // Dock slots
      expect(stats.totalDockSlots).toBe(1);
      expect(stats.availableSlots).toBe(1);

      // Trailers
      expect(stats.totalTrailers).toBe(2);
      expect(stats.availableTrailers).toBe(1);
      expect(stats.inUseTrailers).toBe(1);

      // Empty containers
      expect(stats.totalEmptyContainers).toBe(1);
      expect(stats.emptyInDepot).toBe(1);

      // Stacking
      expect(stats.totalStackingRules).toBe(1);
      expect(stats.activeStackingRules).toBe(1);
    });

    it('should return zeroed stats for empty tenant', () => {
      const stats = engine.getSchedulingStats('empty-tenant');
      expect(stats.tenantId).toBe('empty-tenant');
      expect(stats.totalAppointments).toBe(0);
      expect(stats.confirmedAppointments).toBe(0);
      expect(stats.completedAppointments).toBe(0);
      expect(stats.noShowAppointments).toBe(0);
      expect(stats.cancelledAppointments).toBe(0);
      expect(stats.appointmentsToday).toBe(0);
      expect(stats.averageTurnaroundMinutes).toBe(0);
      expect(stats.averageWaitTimeMinutes).toBe(0);
      expect(stats.totalDockSlots).toBe(0);
      expect(stats.availableSlots).toBe(0);
      expect(stats.occupiedSlots).toBe(0);
      expect(stats.utilizationPercent).toBe(0);
      expect(stats.totalTrailers).toBe(0);
      expect(stats.availableTrailers).toBe(0);
      expect(stats.inUseTrailers).toBe(0);
      expect(stats.maintenanceTrailers).toBe(0);
      expect(stats.totalEmptyContainers).toBe(0);
      expect(stats.emptyInDepot).toBe(0);
      expect(stats.emptyAllotted).toBe(0);
      expect(stats.emptyPendingSurvey).toBe(0);
      expect(stats.pendingAllotments).toBe(0);
      expect(stats.totalStackingRules).toBe(0);
      expect(stats.activeStackingRules).toBe(0);
    });

    it('should count no-show appointments', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      engine.markNoShow(apt.id);

      const stats = engine.getSchedulingStats(TENANT_ID);
      expect(stats.noShowAppointments).toBe(1);
    });

    it('should count confirmed appointments', () => {
      const slot = registerSlot(engine);
      const apt = createAppointment(engine, slot.id);
      engine.confirmAppointment(apt.id);

      const stats = engine.getSchedulingStats(TENANT_ID);
      expect(stats.confirmedAppointments).toBe(1);
    });

    it('should calculate utilization percent', () => {
      const s1 = registerSlot(engine);
      registerSlot(engine);
      engine.updateDockSlotStatus(s1.id, 'occupied');

      const stats = engine.getSchedulingStats(TENANT_ID);
      expect(stats.totalDockSlots).toBe(2);
      expect(stats.occupiedSlots).toBe(1);
      expect(stats.utilizationPercent).toBe(50);
    });

    it('should count maintenance trailers', () => {
      const t1 = registerTrailer(engine);
      registerTrailer(engine);
      engine.updateTrailerStatus(t1.id, 'maintenance');

      const stats = engine.getSchedulingStats(TENANT_ID);
      expect(stats.maintenanceTrailers).toBe(1);
    });

    it('should count pending allotments', () => {
      receiveEmpty(engine, { shippingLine: 'MSC', isoType: '42G1' });
      createAllotment(engine, { shippingLine: 'MSC', containerType: '42G1', quantityRequested: 1 });
      const a2 = createAllotment(engine, { shippingLine: 'MSC', containerType: '42G1', quantityRequested: 1 });
      engine.approveAllotment(a2.id, 'mgr');

      const stats = engine.getSchedulingStats(TENANT_ID);
      // One 'requested' + one 'approved' = 2 pending
      expect(stats.pendingAllotments).toBe(2);
    });

    it('should count active and disabled stacking rules', () => {
      const r1 = addRule(engine);
      addRule(engine);
      addRule(engine);
      engine.toggleStackingRule(r1.id, false);

      const stats = engine.getSchedulingStats(TENANT_ID);
      expect(stats.totalStackingRules).toBe(3);
      expect(stats.activeStackingRules).toBe(2);
    });
  });
});
