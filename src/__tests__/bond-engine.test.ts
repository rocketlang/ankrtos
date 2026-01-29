/**
 * Bond Engine Tests
 *
 * Comprehensive unit tests for BondEngine covering:
 * - Singleton pattern
 * - Bond registration
 * - Bond-in (placing containers under bond)
 * - Bond-out (releasing containers from bond)
 * - Bond extension
 * - Bond transfer
 * - Bonded container queries
 * - Bond statements
 * - Bond stats
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BondEngine } from '../bond/bond-engine';
import type { RegisterBondInput, BondInInput, BondOutInput } from '../bond/bond-engine';
import { TENANT_ID, FACILITY_ID, uuid } from './test-utils';

// ============================================================================
// Helper Factories
// ============================================================================

let bondCounter = 1;

function makeBondInput(overrides: Record<string, unknown> = {}): RegisterBondInput {
  const now = new Date();
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    bondNumber: `B1/2026/INNSA/${String(bondCounter++).padStart(4, '0')}`,
    bondType: 'public_bonded' as const,
    licenseNumber: `LIC/MUM/2026/${bondCounter}`,
    licenseeId: uuid(),
    licenseeName: 'Test Bonded Warehouse Pvt Ltd',
    customsStation: 'INNSA6',
    commissionerateCode: 'JNCH',
    bondAmount: 5000000,
    currency: 'INR' as const,
    suretyType: 'bank_guarantee' as const,
    suretyNumber: `BG-${bondCounter}`,
    suretyBankName: 'State Bank of India',
    suretyAmount: 5000000,
    suretyExpiryDate: new Date(now.getTime() + 365 * 86400000),
    effectiveDate: now,
    expiryDate: new Date(now.getTime() + 365 * 86400000),
    renewalDueDate: new Date(now.getTime() + 335 * 86400000),
    maxContainersTEU: 500,
    maxDwellDays: 90,
    conditions: 'Standard bonded warehouse conditions',
    notes: 'Test bond',
    ...overrides,
  } as RegisterBondInput;
}

let containerSeq = 1;

function makeBondInInput(bondId: string, overrides: Record<string, unknown> = {}): BondInInput {
  const seq = containerSeq++;
  return {
    bondId,
    containerId: uuid(),
    containerNumber: `MSCU${String(200000 + seq)}0`,
    bondInBOENumber: `BOE/2026/${String(seq).padStart(6, '0')}`,
    bondInBOEDate: new Date(),
    igmNumber: `IGM-2026-${seq}`,
    igmDate: new Date(),
    blNumber: `MAEU${String(seq).padStart(9, '0')}`,
    commodityDescription: 'Electronics Parts',
    hsCode: '8471.30',
    cthCode: '84713000',
    declaredValue: 100000,
    declaredCurrency: 'INR' as const,
    dutyAmount: 28000,
    teu: 2,
    insurancePolicyNumber: `INS-${seq}`,
    insuranceExpiryDate: new Date(Date.now() + 180 * 86400000),
    insuredValue: 110000,
    ...overrides,
  } as BondInInput;
}

function makeBondOutInput(overrides: Record<string, unknown> = {}): BondOutInput {
  return {
    exBondBOENumber: `EXBOE/2026/${Date.now()}`,
    exBondBOEDate: new Date(),
    releaseOrderNumber: `RO-${Date.now()}`,
    releasedBy: 'customs-officer-001',
    releaseNotes: 'Cleared for delivery',
    ...overrides,
  } as BondOutInput;
}

// ============================================================================
// Helper: register a bond and return the Bond object
// ============================================================================

function registerBond(engine: BondEngine, overrides: Record<string, unknown> = {}) {
  const result = engine.registerBond(makeBondInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function bondInContainer(engine: BondEngine, bondId: string, overrides: Record<string, unknown> = {}) {
  const result = engine.bondIn(makeBondInInput(bondId, overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

// ============================================================================
// TESTS
// ============================================================================

describe('BondEngine', () => {
  let engine: BondEngine;

  beforeEach(() => {
    BondEngine.resetInstance();
    engine = BondEngine.getInstance();
    bondCounter = 1;
    containerSeq = 1;
  });

  // ==========================================================================
  // Singleton Pattern
  // ==========================================================================

  describe('Singleton pattern', () => {
    it('should return the same instance on repeated calls', () => {
      const a = BondEngine.getInstance();
      const b = BondEngine.getInstance();
      expect(a).toBe(b);
    });

    it('should return a new instance after reset', () => {
      const a = BondEngine.getInstance();
      BondEngine.resetInstance();
      const b = BondEngine.getInstance();
      expect(a).not.toBe(b);
    });
  });

  // ==========================================================================
  // Bond Registration
  // ==========================================================================

  describe('Bond registration', () => {
    it('should register a new bond', () => {
      const result = engine.registerBond(makeBondInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('active');
      expect(result.data!.utilizedAmount).toBe(0);
      expect(result.data!.availableAmount).toBe(result.data!.bondAmount);
      expect(result.data!.currentContainersTEU).toBe(0);
    });

    it('should reject duplicate bond number', () => {
      const bondNumber = 'B1/2026/DUP/0001';
      engine.registerBond(makeBondInput({ bondNumber }));
      const result = engine.registerBond(makeBondInput({ bondNumber }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_BOND_NUMBER');
    });

    it('should get bond by id', () => {
      const reg = engine.registerBond(makeBondInput());
      const bond = engine.getBond(reg.data!.id);
      expect(bond).toBeDefined();
      expect(bond!.bondNumber).toBe(reg.data!.bondNumber);
    });

    it('should get bond by number', () => {
      const bondNumber = 'B1/2026/BYNUM/0001';
      engine.registerBond(makeBondInput({ bondNumber }));
      const bond = engine.getBondByNumber(bondNumber);
      expect(bond).toBeDefined();
      expect(bond!.bondNumber).toBe(bondNumber);
    });

    it('should return undefined for unknown bond number', () => {
      const bond = engine.getBondByNumber('NONEXISTENT');
      expect(bond).toBeUndefined();
    });

    it('should list all bonds', () => {
      registerBond(engine);
      registerBond(engine);
      registerBond(engine);
      const bonds = engine.listBonds();
      expect(bonds).toHaveLength(3);
    });

    it('should list bonds by tenant', () => {
      registerBond(engine, { tenantId: 'tenant-A' });
      registerBond(engine, { tenantId: 'tenant-A' });
      registerBond(engine, { tenantId: 'tenant-B' });
      expect(engine.listBonds('tenant-A')).toHaveLength(2);
      expect(engine.listBonds('tenant-B')).toHaveLength(1);
    });

    it('should list bonds by status', () => {
      const bond = registerBond(engine);
      registerBond(engine);
      engine.updateBondStatus(bond.id, 'suspended');
      expect(engine.listBonds(undefined, 'active')).toHaveLength(1);
      expect(engine.listBonds(undefined, 'suspended')).toHaveLength(1);
    });

    it('should update bond status', () => {
      const bond = registerBond(engine);
      const result = engine.updateBondStatus(bond.id, 'suspended', 'Pending audit');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('suspended');
      expect(result.data!.notes).toBe('Pending audit');
    });

    it('should not update status of cancelled bond', () => {
      const bond = registerBond(engine);
      engine.updateBondStatus(bond.id, 'cancelled');
      const result = engine.updateBondStatus(bond.id, 'active');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should renew a bond', () => {
      const bond = registerBond(engine);
      const newExpiry = new Date(Date.now() + 730 * 86400000);
      const newSuretyExpiry = new Date(Date.now() + 730 * 86400000);
      const result = engine.renewBond(bond.id, newExpiry, newSuretyExpiry);
      expect(result.success).toBe(true);
      expect(result.data!.expiryDate).toBe(newExpiry);
      expect(result.data!.suretyExpiryDate).toBe(newSuretyExpiry);
      expect(result.data!.status).toBe('active');
      expect(result.data!.lastRenewalDate).toBeDefined();
    });

    it('should not renew a cancelled bond', () => {
      const bond = registerBond(engine);
      engine.updateBondStatus(bond.id, 'cancelled');
      const result = engine.renewBond(bond.id, new Date(Date.now() + 365 * 86400000));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Bond-In
  // ==========================================================================

  describe('Bond-in', () => {
    it('should successfully bond-in a container', () => {
      const bond = registerBond(engine);
      const result = engine.bondIn(makeBondInInput(bond.id));
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('bonded');
      expect(result.data!.dwellDays).toBe(0);
      expect(result.data!.isOverdue).toBe(false);
      expect(result.data!.extensionCount).toBe(0);
    });

    it('should fail when bond not found', () => {
      const result = engine.bondIn(makeBondInInput('non-existent-bond-id'));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('BOND_NOT_FOUND');
    });

    it('should fail when bond is not active', () => {
      const bond = registerBond(engine);
      engine.updateBondStatus(bond.id, 'suspended');
      const result = engine.bondIn(makeBondInInput(bond.id));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('BOND_NOT_ACTIVE');
    });

    it('should fail when TEU capacity is exceeded', () => {
      const bond = registerBond(engine, { maxContainersTEU: 3 });
      // Bond in 2 TEU (ok)
      engine.bondIn(makeBondInInput(bond.id, { teu: 2 }));
      // Bond in another 2 TEU (total 4 > max 3)
      const result = engine.bondIn(makeBondInInput(bond.id, { teu: 2 }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CAPACITY_EXCEEDED');
    });

    it('should fail when bond amount is exceeded', () => {
      const bond = registerBond(engine, { bondAmount: 150000 });
      engine.bondIn(makeBondInInput(bond.id, { declaredValue: 100000 }));
      const result = engine.bondIn(makeBondInInput(bond.id, { declaredValue: 60000 }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('AMOUNT_EXCEEDED');
    });

    it('should reject already bonded container', () => {
      const bond = registerBond(engine);
      const containerId = uuid();
      engine.bondIn(makeBondInInput(bond.id, { containerId }));
      const result = engine.bondIn(makeBondInInput(bond.id, { containerId }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ALREADY_BONDED');
    });

    it('should update bond utilization after bond-in', () => {
      const bond = registerBond(engine);
      const declaredValue = 200000;
      const teu = 2;
      engine.bondIn(makeBondInInput(bond.id, { declaredValue, teu }));

      const updatedBond = engine.getBond(bond.id)!;
      expect(updatedBond.utilizedAmount).toBe(declaredValue);
      expect(updatedBond.availableAmount).toBe(updatedBond.bondAmount - declaredValue);
      expect(updatedBond.currentContainersTEU).toBe(teu);
      expect(updatedBond.totalBondIns).toBe(1);
    });

    it('should record a bond_in movement', () => {
      const bond = registerBond(engine);
      engine.bondIn(makeBondInInput(bond.id));

      const movements = engine.getMovementsByBond(bond.id);
      expect(movements).toHaveLength(1);
      expect(movements[0].movementType).toBe('bond_in');
      expect(movements[0].amountImpact).toBeGreaterThan(0);
      expect(movements[0].movementNumber).toMatch(/^BM-/);
    });
  });

  // ==========================================================================
  // Bond-Out
  // ==========================================================================

  describe('Bond-out', () => {
    it('should successfully release a bonded container', () => {
      const bond = registerBond(engine);
      const bc = bondInContainer(engine, bond.id);
      const result = engine.bondOut(bc.id, makeBondOutInput());
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('released');
      expect(result.data!.bondOutDate).toBeDefined();
      expect(result.data!.exBondBOENumber).toBeDefined();
      expect(result.data!.releaseOrderNumber).toBeDefined();
    });

    it('should fail when bonded container not found', () => {
      const result = engine.bondOut('non-existent-id', makeBondOutInput());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail when container is not under active bond', () => {
      const bond = registerBond(engine);
      const bc = bondInContainer(engine, bond.id);
      // Release once
      engine.bondOut(bc.id, makeBondOutInput());
      // Try to release again
      const result = engine.bondOut(bc.id, makeBondOutInput());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should calculate dwell days on release', () => {
      const bond = registerBond(engine);
      const bc = bondInContainer(engine, bond.id);
      const result = engine.bondOut(bc.id, makeBondOutInput());
      expect(result.success).toBe(true);
      // Dwell days should be at least 0 (same-day bond-in/out)
      expect(result.data!.dwellDays).toBeGreaterThanOrEqual(0);
    });

    it('should decrement bond utilization on release', () => {
      const bond = registerBond(engine);
      const declaredValue = 150000;
      const teu = 2;
      const bc = bondInContainer(engine, bond.id, { declaredValue, teu });

      const bondBefore = engine.getBond(bond.id)!;
      expect(bondBefore.utilizedAmount).toBe(declaredValue);
      expect(bondBefore.currentContainersTEU).toBe(teu);

      engine.bondOut(bc.id, makeBondOutInput());

      const bondAfter = engine.getBond(bond.id)!;
      expect(bondAfter.utilizedAmount).toBe(0);
      expect(bondAfter.currentContainersTEU).toBe(0);
      expect(bondAfter.availableAmount).toBe(bondAfter.bondAmount);
      expect(bondAfter.totalBondOuts).toBe(1);
    });

    it('should record a bond_out movement', () => {
      const bond = registerBond(engine);
      const bc = bondInContainer(engine, bond.id);
      engine.bondOut(bc.id, makeBondOutInput());

      const movements = engine.getMovementsByBond(bond.id);
      // Should have bond_in + bond_out = 2 movements
      expect(movements).toHaveLength(2);
      const outMovement = movements.find(m => m.movementType === 'bond_out');
      expect(outMovement).toBeDefined();
      expect(outMovement!.amountImpact).toBeLessThan(0);
    });
  });

  // ==========================================================================
  // Bond Extension
  // ==========================================================================

  describe('Bond extension', () => {
    it('should extend dwell period for bonded container', () => {
      const bond = registerBond(engine);
      const bc = bondInContainer(engine, bond.id);
      const result = engine.extendBond(bc.id, 30, 'Customs clearance delayed');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('bond_extended');
      expect(result.data!.maxDwellDays).toBe(90 + 30);
    });

    it('should fail when bonded container not found', () => {
      const result = engine.extendBond('non-existent-id', 30, 'Test');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail when container has been released', () => {
      const bond = registerBond(engine);
      const bc = bondInContainer(engine, bond.id);
      engine.bondOut(bc.id, makeBondOutInput());
      const result = engine.extendBond(bc.id, 30, 'Test');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should increment extension count', () => {
      const bond = registerBond(engine);
      const bc = bondInContainer(engine, bond.id);

      engine.extendBond(bc.id, 15, 'First extension');
      const after1 = engine.getBondedContainer(bc.id)!;
      expect(after1.extensionCount).toBe(1);
      expect(after1.lastExtensionDate).toBeDefined();

      engine.extendBond(bc.id, 15, 'Second extension');
      const after2 = engine.getBondedContainer(bc.id)!;
      expect(after2.extensionCount).toBe(2);
      expect(after2.maxDwellDays).toBe(90 + 15 + 15);

      // Bond-level totalExtensions should also be incremented
      const updatedBond = engine.getBond(bond.id)!;
      expect(updatedBond.totalExtensions).toBe(2);
    });

    it('should reset overdue flag on extension', () => {
      const bond = registerBond(engine);
      const bc = bondInContainer(engine, bond.id);

      // Manually set container as overdue for testing
      const container = engine.getBondedContainer(bc.id)!;
      (container as any).isOverdue = true;

      const result = engine.extendBond(bc.id, 30, 'Overdue extension');
      expect(result.success).toBe(true);
      expect(result.data!.isOverdue).toBe(false);
    });

    it('should record a bond_extension movement', () => {
      const bond = registerBond(engine);
      const bc = bondInContainer(engine, bond.id);
      engine.extendBond(bc.id, 30, 'Test extension');

      const movements = engine.getMovementsByBond(bond.id);
      const extMovement = movements.find(m => m.movementType === 'bond_extension');
      expect(extMovement).toBeDefined();
      expect(extMovement!.amountImpact).toBe(0);
      expect(extMovement!.reason).toBe('Test extension');
    });
  });

  // ==========================================================================
  // Bond Transfer
  // ==========================================================================

  describe('Bond transfer', () => {
    it('should successfully transfer container between bonds', () => {
      const sourceBond = registerBond(engine);
      const targetBond = registerBond(engine);
      const bc = bondInContainer(engine, sourceBond.id);

      const result = engine.transferBond(bc.id, targetBond.id, 'Capacity rebalancing');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.bondId).toBe(targetBond.id);
      expect(result.data!.status).toBe('bonded');
    });

    it('should fail when source bonded container not found', () => {
      const targetBond = registerBond(engine);
      const result = engine.transferBond('non-existent-id', targetBond.id, 'Test');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail when target bond not found', () => {
      const sourceBond = registerBond(engine);
      const bc = bondInContainer(engine, sourceBond.id);
      const result = engine.transferBond(bc.id, 'non-existent-target', 'Test');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('TARGET_BOND_NOT_FOUND');
    });

    it('should fail when target bond is not active', () => {
      const sourceBond = registerBond(engine);
      const targetBond = registerBond(engine);
      engine.updateBondStatus(targetBond.id, 'suspended');
      const bc = bondInContainer(engine, sourceBond.id);

      const result = engine.transferBond(bc.id, targetBond.id, 'Test');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('TARGET_BOND_NOT_ACTIVE');
    });

    it('should fail when target bond TEU capacity exceeded', () => {
      const sourceBond = registerBond(engine);
      const targetBond = registerBond(engine, { maxContainersTEU: 1 });
      const bc = bondInContainer(engine, sourceBond.id, { teu: 2 });

      const result = engine.transferBond(bc.id, targetBond.id, 'Test');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CAPACITY_EXCEEDED');
    });

    it('should fail when target bond amount exceeded', () => {
      const sourceBond = registerBond(engine);
      const targetBond = registerBond(engine, { bondAmount: 50000 });
      const bc = bondInContainer(engine, sourceBond.id, { declaredValue: 60000 });

      const result = engine.transferBond(bc.id, targetBond.id, 'Test');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('AMOUNT_EXCEEDED');
    });

    it('should update both source and target bond utilization', () => {
      const sourceBond = registerBond(engine);
      const targetBond = registerBond(engine);
      const declaredValue = 200000;
      const teu = 2;
      const bc = bondInContainer(engine, sourceBond.id, { declaredValue, teu });

      // Before transfer
      expect(engine.getBond(sourceBond.id)!.utilizedAmount).toBe(declaredValue);
      expect(engine.getBond(targetBond.id)!.utilizedAmount).toBe(0);

      engine.transferBond(bc.id, targetBond.id, 'Rebalance');

      // After transfer: source decremented, target incremented
      const srcAfter = engine.getBond(sourceBond.id)!;
      expect(srcAfter.utilizedAmount).toBe(0);
      expect(srcAfter.currentContainersTEU).toBe(0);

      const tgtAfter = engine.getBond(targetBond.id)!;
      expect(tgtAfter.utilizedAmount).toBe(declaredValue);
      expect(tgtAfter.currentContainersTEU).toBe(teu);
      expect(tgtAfter.totalBondIns).toBe(1);

      // Original bonded container should be marked transferred
      const originalBc = engine.getBondedContainer(bc.id)!;
      expect(originalBc.status).toBe('transferred');
      expect(originalBc.transferredToBondId).toBe(targetBond.id);
      expect(originalBc.transferReason).toBe('Rebalance');
    });
  });

  // ==========================================================================
  // Queries
  // ==========================================================================

  describe('Queries', () => {
    it('should get bonded containers by bond', () => {
      const bond = registerBond(engine);
      bondInContainer(engine, bond.id);
      bondInContainer(engine, bond.id);
      bondInContainer(engine, bond.id);

      const containers = engine.getBondedContainersByBond(bond.id);
      expect(containers).toHaveLength(3);
    });

    it('should filter bonded containers by status', () => {
      const bond = registerBond(engine);
      const bc1 = bondInContainer(engine, bond.id);
      bondInContainer(engine, bond.id);
      engine.bondOut(bc1.id, makeBondOutInput());

      const bonded = engine.getBondedContainersByBond(bond.id, 'bonded');
      expect(bonded).toHaveLength(1);

      const released = engine.getBondedContainersByBond(bond.id, 'released');
      expect(released).toHaveLength(1);
    });

    it('should get overdue containers', () => {
      const bond = registerBond(engine, { maxDwellDays: 0 });
      // maxDwellDays=0 means the dwellExpiryDate is set to now at bond-in time,
      // so the container is immediately overdue (or extremely close to it).
      bondInContainer(engine, bond.id);

      // Small delay: we force a check slightly in the future by manually
      // adjusting the dwell expiry date to be in the past
      const containers = engine.getBondedContainersByBond(bond.id);
      const bc = containers[0];
      (bc as any).dwellExpiryDate = new Date(Date.now() - 86400000); // yesterday

      const overdue = engine.getOverdueContainers(TENANT_ID);
      expect(overdue.length).toBeGreaterThanOrEqual(1);
      expect(overdue[0].id).toBe(bc.id);
    });

    it('should get expiring containers (within N days)', () => {
      const bond = registerBond(engine, { maxDwellDays: 5 });
      bondInContainer(engine, bond.id);

      // Container dwell expiry is 5 days out, within 7-day threshold
      const expiring = engine.getExpiringContainers(TENANT_ID, 7);
      expect(expiring).toHaveLength(1);

      // But not within 2-day threshold
      const notExpiring = engine.getExpiringContainers(TENANT_ID, 2);
      expect(notExpiring).toHaveLength(0);
    });

    it('should refresh dwell days for active containers', () => {
      const bond = registerBond(engine);
      const bc = bondInContainer(engine, bond.id);

      // Manually backdate bondInDate to simulate time passing
      const container = engine.getBondedContainer(bc.id)!;
      (container as any).bondInDate = new Date(Date.now() - 10 * 86400000); // 10 days ago

      engine.refreshDwellDays();

      const refreshed = engine.getBondedContainer(bc.id)!;
      expect(refreshed.dwellDays).toBeGreaterThanOrEqual(10);
    });
  });

  // ==========================================================================
  // Statements
  // ==========================================================================

  describe('Statements', () => {
    it('should generate a daily statement', () => {
      const bond = registerBond(engine);
      bondInContainer(engine, bond.id, { declaredValue: 100000, teu: 1 });
      bondInContainer(engine, bond.id, { declaredValue: 200000, teu: 2 });

      const result = engine.generateStatement(bond.id, 'daily', 'bond-officer-001');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const stmt = result.data!;
      expect(stmt.statementType).toBe('daily');
      expect(stmt.statementNumber).toMatch(/^BS-/);
      expect(stmt.closingContainers).toBe(2);
      expect(stmt.closingTEU).toBe(3);
      expect(stmt.closingValue).toBe(300000);
      expect(stmt.bondAmount).toBe(bond.bondAmount);
      expect(stmt.utilizedAmount).toBe(300000);
      expect(stmt.preparedBy).toBe('bond-officer-001');
      expect(stmt.submittedToCustoms).toBe(false);
    });

    it('should get statement by id', () => {
      const bond = registerBond(engine);
      bondInContainer(engine, bond.id);
      const gen = engine.generateStatement(bond.id);
      const stmt = engine.getStatement(gen.data!.id);
      expect(stmt).toBeDefined();
      expect(stmt!.bondId).toBe(bond.id);
    });

    it('should list statements by bond', () => {
      const bond = registerBond(engine);
      bondInContainer(engine, bond.id);
      engine.generateStatement(bond.id, 'daily');
      engine.generateStatement(bond.id, 'weekly');

      const statements = engine.getStatementsByBond(bond.id);
      expect(statements).toHaveLength(2);
    });

    it('should submit statement to customs', () => {
      const bond = registerBond(engine);
      bondInContainer(engine, bond.id);
      const gen = engine.generateStatement(bond.id);
      const result = engine.submitStatementToCustoms(gen.data!.id, 'customs-officer-001');
      expect(result.success).toBe(true);
      expect(result.data!.submittedToCustoms).toBe(true);
      expect(result.data!.submittedAt).toBeDefined();
      expect(result.data!.approvedBy).toBe('customs-officer-001');
      expect(result.data!.approvedAt).toBeDefined();
    });

    it('should reject submitting already-submitted statement', () => {
      const bond = registerBond(engine);
      bondInContainer(engine, bond.id);
      const gen = engine.generateStatement(bond.id);
      engine.submitStatementToCustoms(gen.data!.id, 'officer-A');
      const result = engine.submitStatementToCustoms(gen.data!.id, 'officer-B');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ALREADY_SUBMITTED');
    });

    it('should fail to generate statement for unknown bond', () => {
      const result = engine.generateStatement('non-existent-bond');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail to submit non-existent statement', () => {
      const result = engine.submitStatementToCustoms('non-existent-id', 'officer');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  // ==========================================================================
  // Bond Stats
  // ==========================================================================

  describe('Bond stats', () => {
    it('should return complete stats for a tenant', () => {
      const bond = registerBond(engine);
      bondInContainer(engine, bond.id, { declaredValue: 100000, teu: 1 });
      bondInContainer(engine, bond.id, { declaredValue: 200000, teu: 2 });

      const stats = engine.getBondStats(TENANT_ID);
      expect(stats.tenantId).toBe(TENANT_ID);
      expect(stats.totalBonds).toBe(1);
      expect(stats.activeBonds).toBe(1);
      expect(stats.totalBondedContainers).toBe(2);
      expect(stats.totalBondedTEU).toBe(3);
      expect(stats.totalBondedValue).toBe(300000);
      expect(stats.totalBondAmount).toBe(bond.bondAmount);
      expect(stats.totalUtilizedAmount).toBe(300000);
      expect(stats.overallUtilizationPercent).toBeGreaterThan(0);
      expect(stats.averageDwellDays).toBeGreaterThanOrEqual(0);
    });

    it('should return zeroed stats for empty tenant', () => {
      const stats = engine.getBondStats('empty-tenant');
      expect(stats.totalBonds).toBe(0);
      expect(stats.activeBonds).toBe(0);
      expect(stats.totalBondedContainers).toBe(0);
      expect(stats.totalBondedTEU).toBe(0);
      expect(stats.totalBondedValue).toBe(0);
      expect(stats.totalBondAmount).toBe(0);
      expect(stats.totalUtilizedAmount).toBe(0);
      expect(stats.overallUtilizationPercent).toBe(0);
      expect(stats.averageDwellDays).toBe(0);
      expect(stats.bondInsToday).toBe(0);
      expect(stats.bondOutsToday).toBe(0);
      expect(stats.extensionsToday).toBe(0);
    });

    it('should count bonds by status', () => {
      const b1 = registerBond(engine);
      registerBond(engine);
      const b3 = registerBond(engine);
      engine.updateBondStatus(b1.id, 'suspended');
      engine.updateBondStatus(b3.id, 'expired');

      const stats = engine.getBondStats(TENANT_ID);
      expect(stats.totalBonds).toBe(3);
      expect(stats.activeBonds).toBe(1);
      expect(stats.suspendedBonds).toBe(1);
      expect(stats.expiredBonds).toBe(1);
    });

    it('should count today movements', () => {
      const bond = registerBond(engine);
      const bc1 = bondInContainer(engine, bond.id);
      bondInContainer(engine, bond.id);
      engine.bondOut(bc1.id, makeBondOutInput());

      const bc3 = bondInContainer(engine, bond.id);
      engine.extendBond(bc3.id, 15, 'Test extension');

      const stats = engine.getBondStats(TENANT_ID);
      // 3 bond-ins today (bc1, bc2, bc3)
      expect(stats.bondInsToday).toBe(3);
      // 1 bond-out today
      expect(stats.bondOutsToday).toBe(1);
      // 1 extension today
      expect(stats.extensionsToday).toBe(1);
    });
  });
});
