// Bond Management Engine for ankrICD
// Custom bond management for ICD operations under customs supervision

import { v4 as uuidv4 } from 'uuid';
import type { UUID, OperationResult } from '../types/common';
import type {
  Bond,
  BondType,
  BondStatus,
  BondedContainer,
  BondedContainerStatus,
  BondMovement,
  BondMovementType,
  BondStatement,
  BondStats,
} from '../types/bond';
import { emit } from '../core';

// ============================================================================
// BOND ENGINE
// ============================================================================

export class BondEngine {
  private static instance: BondEngine | null = null;

  private bonds: Map<UUID, Bond> = new Map();
  private bondedContainers: Map<UUID, BondedContainer> = new Map();
  private movements: Map<UUID, BondMovement> = new Map();
  private statements: Map<UUID, BondStatement> = new Map();

  // Indexes
  private bondByNumber: Map<string, UUID> = new Map();
  private bondedByBond: Map<UUID, Set<UUID>> = new Map();
  private bondedByContainer: Map<UUID, UUID> = new Map(); // containerId → bondedContainerId
  private movementsByBond: Map<UUID, UUID[]> = new Map();
  private statementsByBond: Map<UUID, UUID[]> = new Map();

  private movementCounter = 0;
  private statementCounter = 0;

  private constructor() {}

  static getInstance(): BondEngine {
    if (!BondEngine.instance) {
      BondEngine.instance = new BondEngine();
    }
    return BondEngine.instance;
  }

  static resetInstance(): void {
    BondEngine.instance = null;
  }

  // ============================================================================
  // BOND REGISTRATION
  // ============================================================================

  registerBond(input: RegisterBondInput): OperationResult<Bond> {
    // Check duplicate bond number
    if (this.bondByNumber.has(input.bondNumber)) {
      return { success: false, error: 'Bond number already exists', errorCode: 'DUPLICATE_BOND_NUMBER' };
    }

    const now = new Date();
    const bond: Bond = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      bondNumber: input.bondNumber,
      bondType: input.bondType,
      status: 'active',

      licenseNumber: input.licenseNumber,
      licenseeId: input.licenseeId,
      licenseeName: input.licenseeName,
      customsStation: input.customsStation,
      commissionerateCode: input.commissionerateCode,

      bondAmount: input.bondAmount,
      utilizedAmount: 0,
      availableAmount: input.bondAmount,
      currency: input.currency ?? 'INR',

      suretyType: input.suretyType,
      suretyNumber: input.suretyNumber,
      suretyBankName: input.suretyBankName,
      suretyAmount: input.suretyAmount,
      suretyExpiryDate: input.suretyExpiryDate,

      effectiveDate: input.effectiveDate,
      expiryDate: input.expiryDate,
      renewalDueDate: input.renewalDueDate,

      maxContainersTEU: input.maxContainersTEU ?? 1000,
      currentContainersTEU: 0,
      maxDwellDays: input.maxDwellDays ?? 90,

      totalBondIns: 0,
      totalBondOuts: 0,
      totalExtensions: 0,

      conditions: input.conditions,
      notes: input.notes,

      createdAt: now,
      updatedAt: now,
    };

    this.bonds.set(bond.id, bond);
    this.bondByNumber.set(bond.bondNumber, bond.id);
    this.bondedByBond.set(bond.id, new Set());
    this.movementsByBond.set(bond.id, []);
    this.statementsByBond.set(bond.id, []);

    emit('bond.registered', { bondId: bond.id, bondNumber: bond.bondNumber }, { tenantId: bond.tenantId });

    return { success: true, data: bond };
  }

  getBond(id: UUID): Bond | undefined {
    return this.bonds.get(id);
  }

  getBondByNumber(bondNumber: string): Bond | undefined {
    const id = this.bondByNumber.get(bondNumber);
    return id ? this.bonds.get(id) : undefined;
  }

  listBonds(tenantId?: string, status?: BondStatus): Bond[] {
    let bonds = Array.from(this.bonds.values());
    if (tenantId) bonds = bonds.filter(b => b.tenantId === tenantId);
    if (status) bonds = bonds.filter(b => b.status === status);
    return bonds;
  }

  updateBondStatus(bondId: UUID, status: BondStatus, reason?: string): OperationResult<Bond> {
    const bond = this.bonds.get(bondId);
    if (!bond) return { success: false, error: 'Bond not found', errorCode: 'NOT_FOUND' };

    // Validation
    if (bond.status === 'cancelled') {
      return { success: false, error: 'Cannot update cancelled bond', errorCode: 'INVALID_STATUS' };
    }
    if (status === 'active' && bond.status !== 'suspended' && bond.status !== 'under_renewal') {
      return { success: false, error: 'Can only activate from suspended or under_renewal', errorCode: 'INVALID_STATUS' };
    }

    bond.status = status;
    bond.updatedAt = new Date();
    if (reason) bond.notes = reason;

    emit('bond.status_changed', { bondId: bond.id, status }, { tenantId: bond.tenantId });
    return { success: true, data: bond };
  }

  renewBond(bondId: UUID, newExpiryDate: Date, newSuretyExpiryDate?: Date): OperationResult<Bond> {
    const bond = this.bonds.get(bondId);
    if (!bond) return { success: false, error: 'Bond not found', errorCode: 'NOT_FOUND' };
    if (bond.status === 'cancelled') {
      return { success: false, error: 'Cannot renew cancelled bond', errorCode: 'INVALID_STATUS' };
    }

    bond.lastRenewalDate = new Date();
    bond.expiryDate = newExpiryDate;
    if (newSuretyExpiryDate) bond.suretyExpiryDate = newSuretyExpiryDate;
    bond.status = 'active';
    bond.updatedAt = new Date();

    emit('bond.renewed', { bondId: bond.id, newExpiry: newExpiryDate }, { tenantId: bond.tenantId });
    return { success: true, data: bond };
  }

  // ============================================================================
  // BOND-IN (Place container under bond)
  // ============================================================================

  bondIn(input: BondInInput): OperationResult<BondedContainer> {
    const bond = this.bonds.get(input.bondId);
    if (!bond) return { success: false, error: 'Bond not found', errorCode: 'BOND_NOT_FOUND' };

    if (bond.status !== 'active') {
      return { success: false, error: 'Bond is not active', errorCode: 'BOND_NOT_ACTIVE' };
    }

    // Check capacity
    if (bond.currentContainersTEU + input.teu > bond.maxContainersTEU) {
      return { success: false, error: 'Bond TEU capacity exceeded', errorCode: 'CAPACITY_EXCEEDED' };
    }

    // Check bond amount
    if (bond.utilizedAmount + input.declaredValue > bond.bondAmount) {
      return { success: false, error: 'Bond amount limit exceeded', errorCode: 'AMOUNT_EXCEEDED' };
    }

    // Check if container is already bonded
    if (this.bondedByContainer.has(input.containerId)) {
      return { success: false, error: 'Container is already under bond', errorCode: 'ALREADY_BONDED' };
    }

    const now = new Date();
    const dwellExpiryDate = new Date(now.getTime() + bond.maxDwellDays * 86400000);

    const bondedContainer: BondedContainer = {
      id: uuidv4(),
      tenantId: bond.tenantId,
      facilityId: bond.facilityId,
      bondId: bond.id,
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      status: 'bonded',

      bondInDate: now,
      bondInBOENumber: input.bondInBOENumber,
      bondInBOEDate: input.bondInBOEDate,
      igmNumber: input.igmNumber,
      igmDate: input.igmDate,
      blNumber: input.blNumber,

      commodityDescription: input.commodityDescription,
      hsCode: input.hsCode,
      cthCode: input.cthCode,
      declaredValue: input.declaredValue,
      declaredCurrency: input.declaredCurrency ?? 'INR',
      dutyAmount: input.dutyAmount,
      teu: input.teu,

      dwellDays: 0,
      maxDwellDays: bond.maxDwellDays,
      dwellExpiryDate,
      isOverdue: false,
      extensionCount: 0,

      insurancePolicyNumber: input.insurancePolicyNumber,
      insuranceExpiryDate: input.insuranceExpiryDate,
      insuredValue: input.insuredValue,

      createdAt: now,
      updatedAt: now,
    };

    // Store
    this.bondedContainers.set(bondedContainer.id, bondedContainer);
    this.bondedByBond.get(bond.id)!.add(bondedContainer.id);
    this.bondedByContainer.set(input.containerId, bondedContainer.id);

    // Update bond utilization
    bond.utilizedAmount += input.declaredValue;
    bond.availableAmount = bond.bondAmount - bond.utilizedAmount;
    bond.currentContainersTEU += input.teu;
    bond.totalBondIns++;
    bond.updatedAt = now;

    // Record movement
    this.recordMovement(bond, 'bond_in', input.declaredValue, bondedContainer.id, input.bondInBOENumber);

    emit('bond.container_bonded', {
      bondId: bond.id,
      containerId: input.containerId,
      containerNumber: input.containerNumber,
    }, { tenantId: bond.tenantId });

    return { success: true, data: bondedContainer };
  }

  // ============================================================================
  // BOND-OUT (Release container from bond)
  // ============================================================================

  bondOut(bondedContainerId: UUID, input: BondOutInput): OperationResult<BondedContainer> {
    const bc = this.bondedContainers.get(bondedContainerId);
    if (!bc) return { success: false, error: 'Bonded container not found', errorCode: 'NOT_FOUND' };

    if (bc.status !== 'bonded' && bc.status !== 'bond_extended') {
      return { success: false, error: 'Container is not under active bond', errorCode: 'INVALID_STATUS' };
    }

    const bond = this.bonds.get(bc.bondId);
    if (!bond) return { success: false, error: 'Bond not found', errorCode: 'BOND_NOT_FOUND' };

    const now = new Date();

    bc.status = 'released';
    bc.bondOutDate = now;
    bc.exBondBOENumber = input.exBondBOENumber;
    bc.exBondBOEDate = input.exBondBOEDate;
    bc.releaseOrderNumber = input.releaseOrderNumber;
    bc.releasedBy = input.releasedBy;
    bc.releaseNotes = input.releaseNotes;
    bc.updatedAt = now;

    // Update dwell days
    bc.dwellDays = Math.ceil((now.getTime() - bc.bondInDate.getTime()) / 86400000);

    // Update bond utilization
    bond.utilizedAmount -= bc.declaredValue;
    bond.availableAmount = bond.bondAmount - bond.utilizedAmount;
    bond.currentContainersTEU -= bc.teu;
    bond.totalBondOuts++;
    bond.updatedAt = now;

    // Remove from container index
    this.bondedByContainer.delete(bc.containerId);

    // Record movement
    this.recordMovement(bond, 'bond_out', -bc.declaredValue, bc.id, input.exBondBOENumber);

    emit('bond.container_released', {
      bondId: bond.id,
      containerId: bc.containerId,
      containerNumber: bc.containerNumber,
      dwellDays: bc.dwellDays,
    }, { tenantId: bond.tenantId });

    return { success: true, data: bc };
  }

  // ============================================================================
  // BOND EXTENSION
  // ============================================================================

  extendBond(bondedContainerId: UUID, additionalDays: number, reason: string, _approvedBy?: string): OperationResult<BondedContainer> {
    const bc = this.bondedContainers.get(bondedContainerId);
    if (!bc) return { success: false, error: 'Bonded container not found', errorCode: 'NOT_FOUND' };

    if (bc.status !== 'bonded' && bc.status !== 'bond_extended') {
      return { success: false, error: 'Container is not under active bond', errorCode: 'INVALID_STATUS' };
    }

    const bond = this.bonds.get(bc.bondId);
    if (!bond) return { success: false, error: 'Bond not found', errorCode: 'BOND_NOT_FOUND' };

    const now = new Date();

    bc.status = 'bond_extended';
    bc.maxDwellDays += additionalDays;
    bc.dwellExpiryDate = new Date(bc.bondInDate.getTime() + bc.maxDwellDays * 86400000);
    bc.extensionCount++;
    bc.lastExtensionDate = now;
    bc.isOverdue = false; // Reset overdue since extension granted
    bc.updatedAt = now;

    bond.totalExtensions++;
    bond.updatedAt = now;

    // Record movement
    this.recordMovement(bond, 'bond_extension', 0, bc.id, undefined, reason);

    emit('bond.extension_granted', {
      bondId: bond.id,
      containerId: bc.containerId,
      additionalDays,
      newDwellExpiry: bc.dwellExpiryDate,
    }, { tenantId: bond.tenantId });

    return { success: true, data: bc };
  }

  // ============================================================================
  // BOND TRANSFER
  // ============================================================================

  transferBond(bondedContainerId: UUID, targetBondId: UUID, reason: string): OperationResult<BondedContainer> {
    const bc = this.bondedContainers.get(bondedContainerId);
    if (!bc) return { success: false, error: 'Bonded container not found', errorCode: 'NOT_FOUND' };

    if (bc.status !== 'bonded' && bc.status !== 'bond_extended') {
      return { success: false, error: 'Container is not under active bond', errorCode: 'INVALID_STATUS' };
    }

    const sourceBond = this.bonds.get(bc.bondId);
    if (!sourceBond) return { success: false, error: 'Source bond not found', errorCode: 'SOURCE_BOND_NOT_FOUND' };

    const targetBond = this.bonds.get(targetBondId);
    if (!targetBond) return { success: false, error: 'Target bond not found', errorCode: 'TARGET_BOND_NOT_FOUND' };

    if (targetBond.status !== 'active') {
      return { success: false, error: 'Target bond is not active', errorCode: 'TARGET_BOND_NOT_ACTIVE' };
    }

    // Check target capacity
    if (targetBond.currentContainersTEU + bc.teu > targetBond.maxContainersTEU) {
      return { success: false, error: 'Target bond TEU capacity exceeded', errorCode: 'CAPACITY_EXCEEDED' };
    }

    if (targetBond.utilizedAmount + bc.declaredValue > targetBond.bondAmount) {
      return { success: false, error: 'Target bond amount limit exceeded', errorCode: 'AMOUNT_EXCEEDED' };
    }

    const now = new Date();

    // Remove from source bond
    sourceBond.utilizedAmount -= bc.declaredValue;
    sourceBond.availableAmount = sourceBond.bondAmount - sourceBond.utilizedAmount;
    sourceBond.currentContainersTEU -= bc.teu;
    sourceBond.updatedAt = now;
    this.bondedByBond.get(sourceBond.id)!.delete(bc.id);

    // Record source movement
    this.recordMovement(sourceBond, 'bond_transfer', -bc.declaredValue, bc.id, undefined, reason);

    // Update bonded container
    bc.status = 'transferred';
    bc.transferredToBondId = targetBondId;
    bc.transferDate = now;
    bc.transferReason = reason;
    bc.updatedAt = now;

    // Create new bonded entry under target bond
    const newBc: BondedContainer = {
      ...bc,
      id: uuidv4(),
      bondId: targetBondId,
      status: 'bonded',
      transferredToBondId: undefined,
      transferDate: undefined,
      transferReason: undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.bondedContainers.set(newBc.id, newBc);
    this.bondedByBond.get(targetBondId)!.add(newBc.id);
    this.bondedByContainer.set(bc.containerId, newBc.id);

    // Update target bond
    targetBond.utilizedAmount += bc.declaredValue;
    targetBond.availableAmount = targetBond.bondAmount - targetBond.utilizedAmount;
    targetBond.currentContainersTEU += bc.teu;
    targetBond.totalBondIns++;
    targetBond.updatedAt = now;

    // Record target movement
    this.recordMovement(targetBond, 'bond_transfer', bc.declaredValue, newBc.id, undefined, reason);

    emit('bond.container_transferred', {
      sourceBondId: sourceBond.id,
      targetBondId: targetBond.id,
      containerId: bc.containerId,
      containerNumber: bc.containerNumber,
    }, { tenantId: sourceBond.tenantId });

    return { success: true, data: newBc };
  }

  // ============================================================================
  // BONDED CONTAINER QUERIES
  // ============================================================================

  getBondedContainer(id: UUID): BondedContainer | undefined {
    return this.bondedContainers.get(id);
  }

  getBondedContainerByContainerId(containerId: UUID): BondedContainer | undefined {
    const bcId = this.bondedByContainer.get(containerId);
    return bcId ? this.bondedContainers.get(bcId) : undefined;
  }

  getBondedContainersByBond(bondId: UUID, status?: BondedContainerStatus): BondedContainer[] {
    const ids = this.bondedByBond.get(bondId);
    if (!ids) return [];
    let containers = Array.from(ids).map(id => this.bondedContainers.get(id)!).filter(Boolean);
    if (status) containers = containers.filter(c => c.status === status);
    return containers;
  }

  getOverdueContainers(tenantId: string): BondedContainer[] {
    const now = new Date();
    return Array.from(this.bondedContainers.values())
      .filter(bc =>
        bc.tenantId === tenantId &&
        (bc.status === 'bonded' || bc.status === 'bond_extended') &&
        now > bc.dwellExpiryDate
      );
  }

  getExpiringContainers(tenantId: string, withinDays: number = 7): BondedContainer[] {
    const now = new Date();
    const threshold = new Date(now.getTime() + withinDays * 86400000);
    return Array.from(this.bondedContainers.values())
      .filter(bc =>
        bc.tenantId === tenantId &&
        (bc.status === 'bonded' || bc.status === 'bond_extended') &&
        bc.dwellExpiryDate <= threshold &&
        bc.dwellExpiryDate > now
      );
  }

  /**
   * Refresh dwell days for all active bonded containers
   */
  refreshDwellDays(): void {
    const now = new Date();
    for (const bc of this.bondedContainers.values()) {
      if (bc.status === 'bonded' || bc.status === 'bond_extended') {
        bc.dwellDays = Math.ceil((now.getTime() - bc.bondInDate.getTime()) / 86400000);
        bc.isOverdue = now > bc.dwellExpiryDate;
      }
    }
  }

  // ============================================================================
  // BOND MOVEMENTS
  // ============================================================================

  getMovementsByBond(bondId: UUID): BondMovement[] {
    const ids = this.movementsByBond.get(bondId);
    if (!ids) return [];
    return ids.map(id => this.movements.get(id)!).filter(Boolean);
  }

  // ============================================================================
  // BOND STATEMENTS (Daily Stock Statement)
  // ============================================================================

  generateStatement(bondId: UUID, statementType: 'daily' | 'weekly' | 'monthly' | 'custom' = 'daily', preparedBy?: string): OperationResult<BondStatement> {
    const bond = this.bonds.get(bondId);
    if (!bond) return { success: false, error: 'Bond not found', errorCode: 'NOT_FOUND' };

    const now = new Date();
    this.refreshDwellDays();

    const activeBonded = this.getBondedContainersByBond(bondId).filter(
      bc => bc.status === 'bonded' || bc.status === 'bond_extended'
    );

    // Get today's movements
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const movements = this.getMovementsByBond(bondId);
    const todayMovements = movements.filter(m => m.movementDate >= todayStart);

    const bondIns = todayMovements.filter(m => m.movementType === 'bond_in');
    const bondOuts = todayMovements.filter(m => m.movementType === 'bond_out');

    const bondInsTEU = bondIns.reduce((sum, m) => {
      const bc = m.bondedContainerId ? this.bondedContainers.get(m.bondedContainerId) : undefined;
      return sum + (bc?.teu ?? 0);
    }, 0);

    const bondOutsTEU = bondOuts.reduce((sum, m) => {
      const bc = m.bondedContainerId ? this.bondedContainers.get(m.bondedContainerId) : undefined;
      return sum + (bc?.teu ?? 0);
    }, 0);

    const closingTEU = activeBonded.reduce((sum, bc) => sum + bc.teu, 0);
    const closingValue = activeBonded.reduce((sum, bc) => sum + bc.declaredValue, 0);

    const overdueContainers = activeBonded.filter(bc => bc.isOverdue).length;
    const expiringContainers = activeBonded.filter(bc => {
      const daysLeft = (bc.dwellExpiryDate.getTime() - now.getTime()) / 86400000;
      return daysLeft > 0 && daysLeft <= 7;
    }).length;

    const bondExpiryDays = (bond.expiryDate.getTime() - now.getTime()) / 86400000;

    this.statementCounter++;
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    const statement: BondStatement = {
      id: uuidv4(),
      tenantId: bond.tenantId,
      facilityId: bond.facilityId,
      bondId: bond.id,
      statementNumber: `BS-${dateStr}-${String(this.statementCounter).padStart(4, '0')}`,
      statementDate: now,
      statementType,

      openingContainers: activeBonded.length - bondIns.length + bondOuts.length,
      openingTEU: closingTEU - bondInsTEU + bondOutsTEU,
      openingValue: closingValue - bondIns.reduce((s, m) => s + m.amountImpact, 0) + Math.abs(bondOuts.reduce((s, m) => s + m.amountImpact, 0)),

      bondInsCount: bondIns.length,
      bondInsTEU,
      bondInsValue: bondIns.reduce((s, m) => s + m.amountImpact, 0),

      bondOutsCount: bondOuts.length,
      bondOutsTEU,
      bondOutsValue: Math.abs(bondOuts.reduce((s, m) => s + m.amountImpact, 0)),

      closingContainers: activeBonded.length,
      closingTEU,
      closingValue,

      bondAmount: bond.bondAmount,
      utilizedAmount: bond.utilizedAmount,
      utilizationPercent: bond.bondAmount > 0 ? (bond.utilizedAmount / bond.bondAmount) * 100 : 0,

      overdueContainers,
      expiringContainers,
      bondExpiryAlert: bondExpiryDays <= 30 && bondExpiryDays > 0,

      preparedBy,
      submittedToCustoms: false,

      createdAt: now,
      updatedAt: now,
    };

    this.statements.set(statement.id, statement);
    if (!this.statementsByBond.has(bondId)) {
      this.statementsByBond.set(bondId, []);
    }
    this.statementsByBond.get(bondId)!.push(statement.id);

    return { success: true, data: statement };
  }

  getStatement(id: UUID): BondStatement | undefined {
    return this.statements.get(id);
  }

  getStatementsByBond(bondId: UUID): BondStatement[] {
    const ids = this.statementsByBond.get(bondId);
    if (!ids) return [];
    return ids.map(id => this.statements.get(id)!).filter(Boolean);
  }

  submitStatementToCustoms(statementId: UUID, submittedBy: string): OperationResult<BondStatement> {
    const statement = this.statements.get(statementId);
    if (!statement) return { success: false, error: 'Statement not found', errorCode: 'NOT_FOUND' };

    if (statement.submittedToCustoms) {
      return { success: false, error: 'Statement already submitted', errorCode: 'ALREADY_SUBMITTED' };
    }

    statement.submittedToCustoms = true;
    statement.submittedAt = new Date();
    statement.approvedBy = submittedBy;
    statement.approvedAt = new Date();
    statement.updatedAt = new Date();

    return { success: true, data: statement };
  }

  // ============================================================================
  // BOND STATS
  // ============================================================================

  getBondStats(tenantId: string): BondStats {
    this.refreshDwellDays();

    const bonds = Array.from(this.bonds.values()).filter(b => b.tenantId === tenantId);
    const activeBonds = bonds.filter(b => b.status === 'active');
    const allBonded = Array.from(this.bondedContainers.values()).filter(bc => bc.tenantId === tenantId);
    const activeBonded = allBonded.filter(bc => bc.status === 'bonded' || bc.status === 'bond_extended');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayMovements = Array.from(this.movements.values()).filter(
      m => m.tenantId === tenantId && m.movementDate >= todayStart
    );

    const dwellDaysArr = activeBonded.map(bc => bc.dwellDays);
    const avgDwell = dwellDaysArr.length > 0
      ? dwellDaysArr.reduce((a, b) => a + b, 0) / dwellDaysArr.length
      : 0;

    return {
      tenantId,
      date: now,
      totalBonds: bonds.length,
      activeBonds: activeBonds.length,
      expiredBonds: bonds.filter(b => b.status === 'expired').length,
      suspendedBonds: bonds.filter(b => b.status === 'suspended').length,

      totalBondedContainers: activeBonded.length,
      totalBondedTEU: activeBonded.reduce((s, bc) => s + bc.teu, 0),
      totalBondedValue: activeBonded.reduce((s, bc) => s + bc.declaredValue, 0),

      overdueContainers: activeBonded.filter(bc => bc.isOverdue).length,
      expiringContainers: activeBonded.filter(bc => {
        const daysLeft = (bc.dwellExpiryDate.getTime() - now.getTime()) / 86400000;
        return daysLeft > 0 && daysLeft <= 7;
      }).length,

      totalBondAmount: bonds.reduce((s, b) => s + b.bondAmount, 0),
      totalUtilizedAmount: bonds.reduce((s, b) => s + b.utilizedAmount, 0),
      overallUtilizationPercent: (() => {
        const total = bonds.reduce((s, b) => s + b.bondAmount, 0);
        const utilized = bonds.reduce((s, b) => s + b.utilizedAmount, 0);
        return total > 0 ? (utilized / total) * 100 : 0;
      })(),

      bondInsToday: todayMovements.filter(m => m.movementType === 'bond_in').length,
      bondOutsToday: todayMovements.filter(m => m.movementType === 'bond_out').length,
      extensionsToday: todayMovements.filter(m => m.movementType === 'bond_extension').length,

      averageDwellDays: avgDwell,
    };
  }

  // ============================================================================
  // INTERNAL
  // ============================================================================

  private recordMovement(
    bond: Bond,
    movementType: BondMovementType,
    amountImpact: number,
    bondedContainerId?: UUID,
    referenceNumber?: string,
    reason?: string,
  ): BondMovement {
    this.movementCounter++;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    const movement: BondMovement = {
      id: uuidv4(),
      tenantId: bond.tenantId,
      facilityId: bond.facilityId,
      bondId: bond.id,
      bondedContainerId,
      movementType,
      movementDate: now,
      movementNumber: `BM-${dateStr}-${String(this.movementCounter).padStart(4, '0')}`,
      amountImpact,
      previousUtilized: bond.utilizedAmount - amountImpact,
      newUtilized: bond.utilizedAmount,
      referenceNumber,
      reason,
      createdAt: now,
      updatedAt: now,
    };

    this.movements.set(movement.id, movement);
    this.movementsByBond.get(bond.id)?.push(movement.id);

    return movement;
  }
}

// ============================================================================
// SINGLETON ACCESSORS
// ============================================================================

let _bondEngine: BondEngine | null = null;

export function getBondEngine(): BondEngine {
  if (!_bondEngine) {
    _bondEngine = BondEngine.getInstance();
  }
  return _bondEngine;
}

export function setBondEngine(engine: BondEngine): void {
  _bondEngine = engine;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface RegisterBondInput {
  tenantId: string;
  facilityId: string;
  bondNumber: string;
  bondType: BondType;
  licenseNumber: string;
  licenseeId: UUID;
  licenseeName: string;
  customsStation: string;
  commissionerateCode: string;
  bondAmount: number;
  currency?: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD';
  suretyType: 'bank_guarantee' | 'surety_bond' | 'cash_deposit';
  suretyNumber?: string;
  suretyBankName?: string;
  suretyAmount: number;
  suretyExpiryDate?: Date;
  effectiveDate: Date;
  expiryDate: Date;
  renewalDueDate?: Date;
  maxContainersTEU?: number;
  maxDwellDays?: number;
  conditions?: string;
  notes?: string;
}

export interface BondInInput {
  bondId: UUID;
  containerId: UUID;
  containerNumber: string;
  bondInBOENumber?: string;
  bondInBOEDate?: Date;
  igmNumber?: string;
  igmDate?: Date;
  blNumber?: string;
  commodityDescription: string;
  hsCode?: string;
  cthCode?: string;
  declaredValue: number;
  declaredCurrency?: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD';
  dutyAmount?: number;
  teu: number;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: Date;
  insuredValue?: number;
}

export interface BondOutInput {
  exBondBOENumber?: string;
  exBondBOEDate?: Date;
  releaseOrderNumber?: string;
  releasedBy?: string;
  releaseNotes?: string;
}
