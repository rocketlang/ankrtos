/**
 * Test Utilities for @ankr/dodd-icd
 *
 * Shared factories and helpers for unit tests.
 */

import { v4 as uuidv4 } from 'uuid';
import type { UUID } from '../types/common';

// ============================================================================
// ID Generators
// ============================================================================

export function uuid(): UUID {
  return uuidv4();
}

export const TENANT_ID = 'test-tenant-001';
export const FACILITY_ID = uuid();

// ============================================================================
// Valid ISO 6346 Container Numbers
// Check digit must be valid for the functions to accept them.
// ============================================================================

/**
 * Generate a valid ISO 6346 container number.
 * Uses MSCU prefix with sequential serial to guarantee uniqueness,
 * and computes the correct check digit.
 */
let containerSerial = 100000;
export function validContainerNumber(): string {
  const serial = String(containerSerial++);
  const prefix = `MSCU${serial}`;
  const checkDigit = computeCheckDigit(prefix);
  return `${prefix}${checkDigit}`;
}

function computeCheckDigit(first10: string): number {
  const values: Record<string, number> = {
    A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19,
    J: 20, K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29,
    S: 30, T: 31, U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  };
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const char = first10.charAt(i);
    const value = values[char];
    if (value === undefined) return 0;
    sum += value * Math.pow(2, i);
  }
  return sum % 11 % 10;
}

// ============================================================================
// Factory: Container Registration Input
// ============================================================================

export function makeContainerInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    containerNumber: validContainerNumber(),
    isoType: '42G1' as const,
    owner: 'MSC',
    ownerName: 'Mediterranean Shipping Company',
    ...overrides,
  };
}

// ============================================================================
// Factory: Rail Track Input
// ============================================================================

let trackCounter = 1;
export function makeTrackInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    trackNumber: `T-${String(trackCounter++).padStart(3, '0')}`,
    name: 'Test Track',
    trackType: 'loading' as const,
    length: 650,
    wagonCapacity: 45,
    electrified: false,
    gaugeType: 'broad' as const,
    ...overrides,
  };
}

// ============================================================================
// Factory: Rake Announcement Input
// ============================================================================

let rakeCounter = 1;
export function makeRakeInput(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    rakeNumber: `RK-${String(rakeCounter++).padStart(4, '0')}`,
    trainNumber: `CONCOR-DFC-${rakeCounter}`,
    origin: 'JNPT',
    originName: 'Jawaharlal Nehru Port',
    destination: 'ICD-TKD',
    destinationName: 'ICD Tughlakabad',
    eta: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    etd: new Date(now.getTime() + 48 * 60 * 60 * 1000),
    totalWagons: 45,
    importContainers: 60,
    exportContainers: 0,
    emptyContainers: 10,
    ...overrides,
  };
}

// ============================================================================
// Factory: Gate Registration Input
// ============================================================================

let gateCounter = 1;
export function makeGateInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    gateId: `GATE-${gateCounter++}`,
    name: 'Main Gate',
    gateType: 'main' as const,
    hasWeighbridge: true,
    hasOCR: true,
    hasRFID: true,
    is24x7: true,
    ...overrides,
  };
}

// ============================================================================
// Factory: Equipment Registration Input
// ============================================================================

let equipCounter = 1;
export function makeEquipmentInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    equipmentNumber: `RTG-${String(equipCounter++).padStart(3, '0')}`,
    type: 'rtg_crane' as const,
    make: 'Kalmar',
    model: 'DRG450-70S5',
    year: 2022,
    liftCapacity: 45,
    maxStackHeight: 5,
    fuelType: 'diesel' as const,
    ...overrides,
  };
}

// ============================================================================
// Factory: Waterfront Berth Input
// ============================================================================

let berthCounter = 1;
export function makeBerthInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    berthNumber: `B-${berthCounter++}`,
    name: 'Container Berth',
    berthType: 'container' as const,
    length: 350,
    depth: 16,
    maxDraft: 14.5,
    maxLOA: 366,
    maxBeam: 52,
    craneRails: true,
    shoreGangway: true,
    ...overrides,
  };
}

// ============================================================================
// Factory: Road Transporter Input
// ============================================================================

let transporterCounter = 1;
export function makeTransporterInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    code: `TRN-${String(transporterCounter++).padStart(3, '0')}`,
    name: 'Test Transport Co.',
    gstin: '27AAGCT1234F1ZC',
    panNumber: 'AAGCT1234F',
    contactPerson: 'Ravi Kumar',
    contactPhone: '+919876543210',
    contactEmail: 'ravi@test-transport.in',
    fleetSize: 25,
    ...overrides,
  };
}

// ============================================================================
// Factory: Road Appointment Input
// ============================================================================

export function makeAppointmentInput(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    appointmentType: 'delivery' as const,
    scheduledTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    truckNumber: 'MH04AB1234',
    driverName: 'Suresh Kumar',
    driverLicense: 'MH0420220001234',
    driverPhone: '+919876543210',
    transporterId: uuid(),
    transporterName: 'Test Transport Co.',
    ...overrides,
  };
}

// ============================================================================
// Factory: Vessel Visit Input
// ============================================================================

let vesselCounter = 1;
export function makeVesselVisitInput(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    vesselName: `MV Test Vessel ${vesselCounter}`,
    imoNumber: `IMO${String(9000000 + vesselCounter++).padStart(7, '0')}`,
    flag: 'IN',
    vesselType: 'container' as const,
    voyageNumber: `V-${vesselCounter}E`,
    shippingLine: 'MSC',
    loa: 300,
    beam: 48,
    draft: 13.5,
    eta: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    etd: new Date(now.getTime() + 72 * 60 * 60 * 1000),
    berthSide: 'port' as const,
    dischargeContainers: 500,
    loadContainers: 450,
    ...overrides,
  };
}
