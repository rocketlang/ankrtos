/**
 * Billing Engine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BillingEngine } from '../billing/billing-engine';
import { TENANT_ID, FACILITY_ID, uuid } from './test-utils';

function makeCustomerInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    code: `CUST-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    name: 'Test Logistics Pvt Ltd',
    legalName: 'Test Logistics Private Limited',
    type: 'importer' as const,
    iecCode: '0501012345',
    panNumber: 'AABCT1234D',
    address: {
      line1: '123 Port Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'IN',
      postalCode: '400001',
    },
    email: 'billing@test-logistics.in',
    phone: '+912223456789',
    creditLimit: 500000,
    paymentTerms: 30,
    ...overrides,
  };
}

function makeTariffInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    tariffCode: `TAR-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    name: 'Standard Import Tariff',
    description: 'Standard charges for import containers',
    effectiveFrom: new Date('2025-01-01'),
    effectiveTo: new Date('2026-12-31'),
    charges: [
      {
        chargeType: 'handling' as const,
        chargeName: 'Container Handling',
        amount: 5000,
        currency: 'INR' as const,
        per: 'container' as const,
        containerSize: '20' as const,
      },
    ],
    ...overrides,
  };
}

describe('BillingEngine', () => {
  let engine: BillingEngine;

  beforeEach(() => {
    BillingEngine.resetInstance();
    engine = BillingEngine.getInstance();
  });

  describe('Customer Management', () => {
    it('should register a customer', () => {
      const result = engine.registerCustomer(makeCustomerInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBeDefined();
      expect(result.data!.status).toBe('active');
      expect(result.data!.creditStatus).toBe('good');
      expect(result.data!.currentOutstanding).toBe(0);
    });

    it('should reject duplicate customer code', () => {
      const input = makeCustomerInput({ code: 'DUP-001' });
      engine.registerCustomer(input);
      const result = engine.registerCustomer(makeCustomerInput({ code: 'DUP-001' }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_CUSTOMER');
    });

    it('should get customer by ID', () => {
      const reg = engine.registerCustomer(makeCustomerInput());
      const customer = engine.getCustomer(reg.data!.id);
      expect(customer).toBeDefined();
      expect(customer!.name).toBe('Test Logistics Pvt Ltd');
    });

    it('should find customer by code', () => {
      const input = makeCustomerInput({ code: 'FIND-ME' });
      engine.registerCustomer(input);
      const customer = engine.findCustomerByCode(TENANT_ID, 'FIND-ME');
      expect(customer).toBeDefined();
      expect(customer!.code).toBe('FIND-ME');
    });

    it('should list customers with pagination', () => {
      for (let i = 0; i < 5; i++) {
        engine.registerCustomer(makeCustomerInput());
      }
      const result = engine.listCustomers({ tenantId: TENANT_ID, page: 1, pageSize: 3 });
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.hasNext).toBe(true);
      expect(result.totalPages).toBe(2);
    });

    it('should update credit limit', () => {
      const reg = engine.registerCustomer(makeCustomerInput({ creditLimit: 100000 }));
      const result = engine.updateCreditLimit(reg.data!.id, 250000);
      expect(result.success).toBe(true);
      expect(result.data!.creditLimit).toBe(250000);
    });

    it('should flag warning when outstanding reaches 80% of credit limit', () => {
      const reg = engine.registerCustomer(makeCustomerInput({ creditLimit: 100000 }));
      engine.adjustOutstanding(reg.data!.id, 85000);
      const customer = engine.getCustomer(reg.data!.id);
      expect(customer!.creditStatus).toBe('warning');
    });

    it('should block when outstanding exceeds credit limit', () => {
      const reg = engine.registerCustomer(makeCustomerInput({ creditLimit: 100000 }));
      engine.adjustOutstanding(reg.data!.id, 110000);
      const customer = engine.getCustomer(reg.data!.id);
      expect(customer!.creditStatus).toBe('blocked');
    });
  });

  describe('Tariff Management', () => {
    it('should create a tariff', () => {
      const result = engine.createTariff(makeTariffInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.isActive).toBe(true);
      expect(result.data!.charges).toHaveLength(1);
    });

    it('should reject duplicate active tariff code', () => {
      const input = makeTariffInput({ tariffCode: 'TAR-DUP' });
      engine.createTariff(input);
      const result = engine.createTariff(makeTariffInput({ tariffCode: 'TAR-DUP' }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_TARIFF');
    });

    it('should get tariff by ID', () => {
      const reg = engine.createTariff(makeTariffInput());
      const tariff = engine.getTariff(reg.data!.id);
      expect(tariff).toBeDefined();
      expect(tariff!.name).toBe('Standard Import Tariff');
    });
  });
});
