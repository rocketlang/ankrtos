/**
 * Customs Engine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CustomsEngine } from '../customs/customs-engine';
import { TENANT_ID, FACILITY_ID } from './test-utils';

function makeBOEInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    beType: 'home_consumption' as const,
    jobNumber: `JOB-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    referenceNumber: `REF-${Date.now()}`,

    // Importer
    importerIEC: '0501012345',
    importerName: 'Test Import Corp',
    importerGstin: '27AABCT1234D1ZC',
    importerAddress: {
      line1: '456 Import Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'IN',
      postalCode: '400001',
    },

    // CHA
    chaLicense: 'CHA/MUM/2024/0001',
    chaName: 'Swift Customs Agents',

    // Import details
    countryOfOrigin: 'CN',
    countryOfConsignment: 'CN',
    portOfLoading: 'CNSHA',
    portOfDischarge: 'INJNP',
    portOfRegistration: 'INJNP',

    // Transport
    transportMode: 'sea' as const,
    vesselName: 'MV Shanghai Express',
    voyageNumber: 'V-2026-001E',
    arrivalDate: new Date(),

    // BL
    blNumber: 'MAEU123456789',
    blDate: new Date(),
    blType: 'master' as const,

    // IGM
    igmNumber: 'IGM-2026-001',
    igmDate: new Date(),
    igmLineNumber: 1,

    // Containers
    containers: [
      {
        containerNumber: 'MSCU1234567',
        sealNumber: 'SEAL001',
        packages: 500,
        grossWeight: 18000,
        netWeight: 16000,
        cargoDescription: 'Electronics Parts',
      },
    ],

    totalNetWeight: 16000,

    // Line items
    lineItems: [
      {
        itemNumber: 1,
        hsnCode: '8471.30',
        description: 'Laptop Components',
        quantity: 500,
        unit: 'PCS',
        unitPrice: 10,
        totalValue: 5000,
        assessableValue: 350000,
        basicDutyRate: 10,
        basicDuty: 35000,
        igstRate: 18,
        igst: 69300,
        cess: 0,
        countryOfOrigin: 'CN',
      },
    ],

    // Values
    invoiceNumber: 'INV-2026-001',
    invoiceDate: new Date(),
    invoiceValue: 5000,
    invoiceCurrency: 'USD' as const,
    exchangeRate: 83.5,
    cifValue: 417500,
    insuranceValue: 5000,
    freightValue: 12500,
    landingCharges: 1000,

    ...overrides,
  };
}

function makeSBInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    sbType: 'dutiable' as const,
    jobNumber: `EXP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    referenceNumber: `EXPREF-${Date.now()}`,

    exporterIEC: '0501012345',
    exporterName: 'Test Export Corp',
    exporterGstin: '27AABCT1234D1ZC',
    exporterAddress: {
      line1: '789 Export Blvd',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'IN',
      postalCode: '400001',
    },

    chaLicense: 'CHA/MUM/2024/0001',
    chaName: 'Swift Customs Agents',

    countryOfDestination: 'US',
    portOfLoading: 'INJNP',
    portOfDischarge: 'USLAX',

    transportMode: 'sea' as const,
    vesselName: 'MV India Express',
    voyageNumber: 'V-2026-002W',

    blNumber: 'MAEU987654321',
    blDate: new Date(),

    containers: [
      {
        containerNumber: 'MSCU7654321',
        sealNumber: 'SEAL002',
        packages: 200,
        grossWeight: 14000,
        netWeight: 12000,
        cargoDescription: 'Textile Garments',
      },
    ],

    totalNetWeight: 12000,

    lineItems: [
      {
        itemNumber: 1,
        hsnCode: '6109.10',
        description: 'Cotton T-Shirts',
        quantity: 200,
        unit: 'PCS',
        unitPrice: 500,
        totalValue: 100000,
        fobValue: 100000,
        dutyCess: 0,
        drawbackRate: 1.9,
        drawbackAmount: 1900,
        countryOfDestination: 'US',
      },
    ],

    invoiceNumber: 'EXP-INV-2026-001',
    invoiceDate: new Date(),
    invoiceValue: 100000,
    invoiceCurrency: 'INR' as const,
    fobValue: 100000,

    ...overrides,
  };
}

describe('CustomsEngine', () => {
  let engine: CustomsEngine;

  beforeEach(() => {
    CustomsEngine.resetInstance();
    engine = CustomsEngine.getInstance();
  });

  describe('Bill of Entry (Import)', () => {
    it('should create a Bill of Entry', () => {
      const result = engine.createBillOfEntry(makeBOEInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('draft');
      expect(result.data!.totalContainers).toBe(1);
      expect(result.data!.totalDuty).toBeGreaterThan(0);
    });

    it('should get BOE by ID', () => {
      const reg = engine.createBillOfEntry(makeBOEInput());
      const boe = engine.getBillOfEntry(reg.data!.id);
      expect(boe).toBeDefined();
      expect(boe!.importerName).toBe('Test Import Corp');
    });

    it('should submit BOE', () => {
      const reg = engine.createBillOfEntry(makeBOEInput());
      const result = engine.submitBOE(reg.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('submitted');
    });

    it('should reject submitting non-existent BOE', () => {
      const result = engine.submitBOE('non-existent-id');
      expect(result.success).toBe(false);
    });

    it('should calculate duty totals correctly', () => {
      const result = engine.createBillOfEntry(makeBOEInput());
      const boe = result.data!;
      expect(boe.basicDuty).toBe(35000);
      expect(boe.igst).toBe(69300);
      expect(boe.totalDuty).toBe(35000 + 69300); // basic + igst
    });
  });

  describe('Shipping Bill (Export)', () => {
    it('should create a Shipping Bill', () => {
      const result = engine.createShippingBill(makeSBInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('draft');
      expect(result.data!.exporterName).toBe('Test Export Corp');
    });

    it('should get Shipping Bill by ID', () => {
      const reg = engine.createShippingBill(makeSBInput());
      const sb = engine.getShippingBill(reg.data!.id);
      expect(sb).toBeDefined();
      expect(sb!.sbType).toBe('dutiable');
    });

    it('should submit Shipping Bill', () => {
      const reg = engine.createShippingBill(makeSBInput());
      const result = engine.submitShippingBill(reg.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('submitted');
    });
  });
});
