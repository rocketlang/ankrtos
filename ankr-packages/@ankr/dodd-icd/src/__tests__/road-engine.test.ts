import { describe, it, expect, beforeEach } from 'vitest';
import { RoadEngine } from '../road/road-engine';
import { makeTransporterInput, makeAppointmentInput, uuid, TENANT_ID, FACILITY_ID } from './test-utils';

/** Build a valid transporter input with required `address` field. */
function transporterInput(overrides: Record<string, unknown> = {}) {
  return makeTransporterInput({
    address: {
      line1: '123 Transport Nagar',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'IN',
      postalCode: '400001',
    },
    ...overrides,
  });
}

/** Build a valid appointment input. Requires a registered transporter ID. */
function appointmentInput(transporterId: string, overrides: Record<string, unknown> = {}) {
  return {
    ...makeAppointmentInput({ transporterId }),
    containers: [
      { containerNumber: 'MSCU1234567', isoType: '42G1', operation: 'delivery' as const },
    ],
    ...overrides,
  };
}

describe('RoadEngine', () => {
  let engine: RoadEngine;

  beforeEach(() => {
    RoadEngine.resetInstance();
    engine = RoadEngine.getInstance();
  });

  // --------------------------------------------------------------------------
  // Transporter CRUD
  // --------------------------------------------------------------------------

  describe('registerTransporter', () => {
    it('should register a transporter successfully', () => {
      const result = engine.registerTransporter(transporterInput());

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('active');
      expect(result.data!.name).toBe('Test Transport Co.');
    });

    it('should reject duplicate transporter code within the same tenant', () => {
      const input = transporterInput();
      engine.registerTransporter(input);
      const dup = { ...input };
      const result = engine.registerTransporter(dup);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_TRANSPORTER');
    });
  });

  describe('getTransporter / getTransporterByCode', () => {
    it('should retrieve transporter by ID', () => {
      const reg = engine.registerTransporter(transporterInput());
      const t = engine.getTransporter(reg.data!.id);
      expect(t).toBeDefined();
      expect(t!.id).toBe(reg.data!.id);
    });

    it('should retrieve transporter by code and tenant', () => {
      const reg = engine.registerTransporter(transporterInput());
      const t = engine.getTransporterByCode(reg.data!.code, TENANT_ID);
      expect(t).toBeDefined();
      expect(t!.code).toBe(reg.data!.code);
    });

    it('should return undefined for unknown ID', () => {
      expect(engine.getTransporter(uuid())).toBeUndefined();
    });
  });

  describe('listTransporters', () => {
    it('should list transporters filtered by tenant', () => {
      engine.registerTransporter(transporterInput());
      engine.registerTransporter(transporterInput());
      engine.registerTransporter(transporterInput({ tenantId: 'other-tenant' }));

      const result = engine.listTransporters({ tenantId: TENANT_ID });
      expect(result.total).toBe(2);
    });
  });

  describe('updateTransporterStatus', () => {
    it('should update transporter status', () => {
      const reg = engine.registerTransporter(transporterInput());
      const result = engine.updateTransporterStatus(reg.data!.id, 'inactive');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('inactive');
    });

    it('should return error for unknown transporter', () => {
      const result = engine.updateTransporterStatus(uuid(), 'inactive');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  // --------------------------------------------------------------------------
  // Appointment lifecycle: create -> confirm -> arrive -> check-in ->
  //   completeProcessing -> completeAppointment
  // --------------------------------------------------------------------------

  describe('appointment lifecycle', () => {
    let transporterId: string;

    beforeEach(() => {
      const reg = engine.registerTransporter(transporterInput());
      transporterId = reg.data!.id;
    });

    it('should create an appointment', () => {
      const result = engine.createAppointment(appointmentInput(transporterId));
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('scheduled');
      expect(result.data!.appointmentNumber).toBeDefined();
      expect(result.data!.totalContainers).toBe(1);
    });

    it('should reject appointment for inactive transporter', () => {
      engine.updateTransporterStatus(transporterId, 'inactive');
      const result = engine.createAppointment(appointmentInput(transporterId));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('TRANSPORTER_INACTIVE');
    });

    it('should walk through full appointment lifecycle', () => {
      const created = engine.createAppointment(appointmentInput(transporterId));
      const apptId = created.data!.id;

      // confirm
      const confirmed = engine.confirmAppointment(apptId);
      expect(confirmed.success).toBe(true);
      expect(confirmed.data!.status).toBe('confirmed');

      // arrive
      const arrived = engine.recordArrival(apptId);
      expect(arrived.success).toBe(true);
      expect(arrived.data!.status).toBe('arrived');
      expect(arrived.data!.actualArrival).toBeDefined();

      // check-in
      const checkedIn = engine.startCheckIn(apptId);
      expect(checkedIn.success).toBe(true);
      expect(checkedIn.data!.status).toBe('check_in');

      // complete processing
      const processed = engine.completeProcessing(apptId);
      expect(processed.success).toBe(true);
      expect(processed.data!.status).toBe('check_out');

      // complete appointment
      const completed = engine.completeAppointment(apptId);
      expect(completed.success).toBe(true);
      expect(completed.data!.status).toBe('completed');
    });

    it('should get appointment by ID', () => {
      const created = engine.createAppointment(appointmentInput(transporterId));
      const appt = engine.getAppointment(created.data!.id);
      expect(appt).toBeDefined();
      expect(appt!.id).toBe(created.data!.id);
    });
  });

  // --------------------------------------------------------------------------
  // Cancel & No-show
  // --------------------------------------------------------------------------

  describe('cancelAppointment', () => {
    it('should cancel a scheduled appointment', () => {
      const reg = engine.registerTransporter(transporterInput());
      const created = engine.createAppointment(appointmentInput(reg.data!.id));

      const result = engine.cancelAppointment(created.data!.id, 'Customer request');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('cancelled');
    });

    it('should reject cancelling an already completed appointment', () => {
      const reg = engine.registerTransporter(transporterInput());
      const created = engine.createAppointment(appointmentInput(reg.data!.id));
      const apptId = created.data!.id;
      engine.confirmAppointment(apptId);
      engine.recordArrival(apptId);
      engine.startCheckIn(apptId);
      engine.completeProcessing(apptId);
      engine.completeAppointment(apptId);

      const result = engine.cancelAppointment(apptId, 'Too late');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  describe('markNoShow', () => {
    it('should mark a scheduled appointment as no-show', () => {
      const reg = engine.registerTransporter(transporterInput());
      const created = engine.createAppointment(appointmentInput(reg.data!.id));

      const result = engine.markNoShow(created.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('no_show');
    });

    it('should reject no-show for an arrived appointment', () => {
      const reg = engine.registerTransporter(transporterInput());
      const created = engine.createAppointment(appointmentInput(reg.data!.id));
      engine.recordArrival(created.data!.id);

      const result = engine.markNoShow(created.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // --------------------------------------------------------------------------
  // E-way bill
  // --------------------------------------------------------------------------

  describe('registerEWayBill', () => {
    it('should register an e-way bill', () => {
      const now = new Date();
      const result = engine.registerEWayBill({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        eWayBillNumber: 'EWB-001',
        validFrom: now,
        validTo: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        fromGstin: '27AAGCT1234F1ZC',
        fromTradeName: 'Sender Co.',
        fromAddress: { line1: '1 A St', city: 'Mumbai', state: 'MH', country: 'IN', postalCode: '400001' },
        toGstin: '29AAGCT5678G1ZD',
        toTradeName: 'Receiver Co.',
        toAddress: { line1: '2 B St', city: 'Pune', state: 'MH', country: 'IN', postalCode: '411001' },
        transportMode: 'road',
        documentType: 'invoice',
        documentNumber: 'INV-001',
        documentDate: now,
        hsnCode: '73089090',
        productDescription: 'Steel containers',
        quantity: 10,
        unit: 'NOS',
        taxableValue: 100000,
        totalValue: 118000,
      });

      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('active');
      expect(result.data!.eWayBillNumber).toBe('EWB-001');
    });

    it('should reject duplicate e-way bill number within tenant', () => {
      const now = new Date();
      const input = {
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        eWayBillNumber: 'EWB-DUP',
        validFrom: now,
        validTo: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        fromGstin: '27AAGCT1234F1ZC',
        fromTradeName: 'Sender Co.',
        fromAddress: { line1: '1 A', city: 'M', state: 'MH', country: 'IN', postalCode: '400001' } as const,
        toGstin: '29AAGCT5678G1ZD',
        toTradeName: 'Receiver',
        toAddress: { line1: '2 B', city: 'P', state: 'MH', country: 'IN', postalCode: '411001' } as const,
        transportMode: 'road' as const,
        documentType: 'invoice' as const,
        documentNumber: 'INV-001',
        documentDate: now,
        hsnCode: '73089090',
        productDescription: 'Steel',
        quantity: 5,
        unit: 'NOS',
        taxableValue: 50000,
        totalValue: 59000,
      };

      engine.registerEWayBill(input);
      const result = engine.registerEWayBill({ ...input });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_EWAY_BILL');
    });
  });

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  describe('getStats', () => {
    it('should return accurate road transport stats', () => {
      const reg = engine.registerTransporter(transporterInput());
      const today = new Date();

      // Create appointments scheduled for today
      engine.createAppointment(appointmentInput(reg.data!.id, { scheduledTime: today }));
      engine.createAppointment(appointmentInput(reg.data!.id, {
        scheduledTime: today,
        appointmentType: 'pickup',
      }));

      const stats = engine.getStats(TENANT_ID, today);
      expect(stats.totalAppointments).toBe(2);
      expect(stats.pending).toBe(2);
      expect(stats.completed).toBe(0);
      expect(stats.deliveryAppointments).toBe(1);
      expect(stats.pickupAppointments).toBe(1);
    });
  });
});
