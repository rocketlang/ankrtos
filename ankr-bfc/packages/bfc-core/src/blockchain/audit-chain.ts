/**
 * ankrBFC Blockchain Audit Trail
 *
 * Provides immutable, tamper-proof audit logs using blockchain technology.
 * Supports both local merkle tree storage and external blockchain integration.
 *
 * Use Cases:
 * - Consent changes (DPDP/GDPR compliance)
 * - Credit decisions (regulatory audit)
 * - KYC verification events
 * - Data access logs
 * - Transaction disputes
 */

import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

// Types
export interface AuditEntry {
  id: string;
  timestamp: number;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  actor: {
    type: 'CUSTOMER' | 'STAFF' | 'SYSTEM' | 'EXTERNAL';
    id: string;
    name?: string;
  };
  data: Record<string, unknown>;
  previousHash: string;
  hash: string;
  signature?: string;  // For non-repudiation
  blockNumber?: number;  // If anchored to external blockchain
  txHash?: string;  // External blockchain transaction hash
}

export type AuditEntityType =
  | 'CUSTOMER'
  | 'CONSENT'
  | 'KYC'
  | 'CREDIT_DECISION'
  | 'TRANSACTION'
  | 'DOCUMENT'
  | 'PRODUCT'
  | 'OFFER'
  | 'ALERT'
  | 'DATA_ACCESS';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'EXPORT'
  | 'CONSENT_GIVEN'
  | 'CONSENT_REVOKED'
  | 'KYC_VERIFIED'
  | 'KYC_REJECTED'
  | 'CREDIT_APPROVED'
  | 'CREDIT_REJECTED'
  | 'FRAUD_FLAGGED'
  | 'ALERT_RAISED'
  | 'ALERT_RESOLVED';

export interface BlockchainConfig {
  mode: 'local' | 'ethereum' | 'polygon' | 'hyperledger';
  rpcUrl?: string;
  privateKey?: string;
  contractAddress?: string;
  anchorInterval?: number;  // Minutes between blockchain anchoring
}

export interface AuditBlock {
  blockNumber: number;
  entries: AuditEntry[];
  merkleRoot: string;
  previousBlockHash: string;
  hash: string;
  timestamp: number;
  anchoredAt?: number;
  txHash?: string;
}

/**
 * Blockchain-based audit chain service
 */
export class AuditChain {
  private config: BlockchainConfig;
  private entries: AuditEntry[] = [];
  private blocks: AuditBlock[] = [];
  private lastHash: string = '0'.repeat(64);  // Genesis hash
  private pendingEntries: AuditEntry[] = [];

  constructor(config: BlockchainConfig) {
    this.config = config;
  }

  /**
   * Record an audit entry with cryptographic linking
   */
  async record(
    entityType: AuditEntityType,
    entityId: string,
    action: AuditAction,
    actor: AuditEntry['actor'],
    data: Record<string, unknown>,
  ): Promise<AuditEntry> {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      entityType,
      entityId,
      action,
      actor,
      data: this.sanitizeData(data),
      previousHash: this.lastHash,
      hash: '',  // Will be computed
    };

    // Compute hash including previous hash for chain integrity
    entry.hash = this.computeEntryHash(entry);
    this.lastHash = entry.hash;

    this.entries.push(entry);
    this.pendingEntries.push(entry);

    // Persist entry (implementation depends on storage)
    await this.persistEntry(entry);

    return entry;
  }

  /**
   * Record consent change with full audit trail
   */
  async recordConsentChange(
    customerId: string,
    consentType: string,
    granted: boolean,
    actor: AuditEntry['actor'],
    metadata?: Record<string, unknown>,
  ): Promise<AuditEntry> {
    return this.record(
      'CONSENT',
      customerId,
      granted ? 'CONSENT_GIVEN' : 'CONSENT_REVOKED',
      actor,
      {
        consentType,
        granted,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        source: metadata?.source,
        timestamp: new Date().toISOString(),
      },
    );
  }

  /**
   * Record KYC verification event
   */
  async recordKycEvent(
    customerId: string,
    documentType: string,
    verified: boolean,
    actor: AuditEntry['actor'],
    details: Record<string, unknown>,
  ): Promise<AuditEntry> {
    return this.record(
      'KYC',
      customerId,
      verified ? 'KYC_VERIFIED' : 'KYC_REJECTED',
      actor,
      {
        documentType,
        verificationMethod: details.method,
        verificationSource: details.source,
        rejectionReason: details.rejectionReason,
      },
    );
  }

  /**
   * Record credit decision with full context
   */
  async recordCreditDecision(
    applicationId: string,
    customerId: string,
    approved: boolean,
    actor: AuditEntry['actor'],
    decision: Record<string, unknown>,
  ): Promise<AuditEntry> {
    return this.record(
      'CREDIT_DECISION',
      applicationId,
      approved ? 'CREDIT_APPROVED' : 'CREDIT_REJECTED',
      actor,
      {
        customerId,
        loanType: decision.loanType,
        requestedAmount: decision.requestedAmount,
        approvedAmount: decision.approvedAmount,
        interestRate: decision.interestRate,
        riskScore: decision.riskScore,
        decisionFactors: decision.factors,
        modelVersion: decision.modelVersion,
      },
    );
  }

  /**
   * Record data access for DPDP/GDPR compliance
   */
  async recordDataAccess(
    entityType: AuditEntityType,
    entityId: string,
    actor: AuditEntry['actor'],
    accessType: 'VIEW' | 'EXPORT',
    fields?: string[],
  ): Promise<AuditEntry> {
    return this.record(
      'DATA_ACCESS',
      entityId,
      accessType,
      actor,
      {
        accessedEntityType: entityType,
        fields: fields ?? ['ALL'],
        purpose: 'Data Subject Request',
      },
    );
  }

  /**
   * Create a block from pending entries
   */
  async createBlock(): Promise<AuditBlock | null> {
    if (this.pendingEntries.length === 0) {
      return null;
    }

    const entries = [...this.pendingEntries];
    this.pendingEntries = [];

    const blockNumber = this.blocks.length + 1;
    const previousBlockHash = this.blocks.length > 0
      ? this.blocks[this.blocks.length - 1].hash
      : '0'.repeat(64);

    const merkleRoot = this.computeMerkleRoot(entries.map(e => e.hash));

    const block: AuditBlock = {
      blockNumber,
      entries,
      merkleRoot,
      previousBlockHash,
      hash: '',
      timestamp: Date.now(),
    };

    block.hash = this.computeBlockHash(block);
    this.blocks.push(block);

    // Anchor to external blockchain if configured
    if (this.config.mode !== 'local' && this.config.rpcUrl) {
      await this.anchorToBlockchain(block);
    }

    return block;
  }

  /**
   * Verify chain integrity
   */
  async verifyChain(): Promise<{
    valid: boolean;
    errors: string[];
    lastValidEntry?: string;
  }> {
    const errors: string[] = [];
    let lastValidEntry: string | undefined;

    // Verify entry chain
    let previousHash = '0'.repeat(64);
    for (const entry of this.entries) {
      // Check hash chain
      if (entry.previousHash !== previousHash) {
        errors.push(`Entry ${entry.id}: Previous hash mismatch`);
        break;
      }

      // Verify entry hash
      const computedHash = this.computeEntryHash(entry);
      if (entry.hash !== computedHash) {
        errors.push(`Entry ${entry.id}: Hash verification failed`);
        break;
      }

      previousHash = entry.hash;
      lastValidEntry = entry.id;
    }

    // Verify block chain
    let previousBlockHash = '0'.repeat(64);
    for (const block of this.blocks) {
      if (block.previousBlockHash !== previousBlockHash) {
        errors.push(`Block ${block.blockNumber}: Previous block hash mismatch`);
      }

      const computedHash = this.computeBlockHash(block);
      if (block.hash !== computedHash) {
        errors.push(`Block ${block.blockNumber}: Hash verification failed`);
      }

      // Verify merkle root
      const computedMerkle = this.computeMerkleRoot(block.entries.map(e => e.hash));
      if (block.merkleRoot !== computedMerkle) {
        errors.push(`Block ${block.blockNumber}: Merkle root mismatch`);
      }

      previousBlockHash = block.hash;
    }

    return {
      valid: errors.length === 0,
      errors,
      lastValidEntry,
    };
  }

  /**
   * Get audit trail for an entity
   */
  async getAuditTrail(
    entityType: AuditEntityType,
    entityId: string,
  ): Promise<AuditEntry[]> {
    return this.entries.filter(
      e => e.entityType === entityType && e.entityId === entityId
    );
  }

  /**
   * Get entries by actor (for access logs)
   */
  async getEntriesByActor(
    actorType: AuditEntry['actor']['type'],
    actorId: string,
  ): Promise<AuditEntry[]> {
    return this.entries.filter(
      e => e.actor.type === actorType && e.actor.id === actorId
    );
  }

  /**
   * Export audit log for regulatory submission
   */
  async exportAuditLog(
    options: {
      from?: Date;
      to?: Date;
      entityTypes?: AuditEntityType[];
      format?: 'json' | 'csv';
    } = {}
  ): Promise<string> {
    let filtered = this.entries;

    if (options.from) {
      filtered = filtered.filter(e => e.timestamp >= options.from!.getTime());
    }
    if (options.to) {
      filtered = filtered.filter(e => e.timestamp <= options.to!.getTime());
    }
    if (options.entityTypes?.length) {
      filtered = filtered.filter(e => options.entityTypes!.includes(e.entityType));
    }

    if (options.format === 'csv') {
      return this.toCSV(filtered);
    }

    return JSON.stringify(filtered, null, 2);
  }

  // Private methods

  private generateId(): string {
    return `aud_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    // Remove sensitive fields from audit data
    const sensitiveKeys = ['password', 'pin', 'cvv', 'otp', 'secret'];
    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private computeEntryHash(entry: Omit<AuditEntry, 'hash'>): string {
    const data = {
      id: entry.id,
      timestamp: entry.timestamp,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      actor: entry.actor,
      data: entry.data,
      previousHash: entry.previousHash,
    };

    const bytes = new TextEncoder().encode(JSON.stringify(data));
    return bytesToHex(sha256(bytes));
  }

  private computeBlockHash(block: Omit<AuditBlock, 'hash'>): string {
    const data = {
      blockNumber: block.blockNumber,
      merkleRoot: block.merkleRoot,
      previousBlockHash: block.previousBlockHash,
      timestamp: block.timestamp,
    };

    const bytes = new TextEncoder().encode(JSON.stringify(data));
    return bytesToHex(sha256(bytes));
  }

  private computeMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) {
      return '0'.repeat(64);
    }

    if (hashes.length === 1) {
      return hashes[0];
    }

    const nextLevel: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] ?? left;  // Duplicate last if odd
      const combined = new TextEncoder().encode(left + right);
      nextLevel.push(bytesToHex(sha256(combined)));
    }

    return this.computeMerkleRoot(nextLevel);
  }

  private async persistEntry(entry: AuditEntry): Promise<void> {
    // In production, persist to database
    // This is a placeholder for the actual implementation
  }

  private async anchorToBlockchain(block: AuditBlock): Promise<void> {
    // Anchor merkle root to external blockchain
    // Implementation depends on blockchain choice

    if (this.config.mode === 'ethereum' || this.config.mode === 'polygon') {
      // Use ethers.js to anchor
      // const { ethers } = await import('ethers');
      // const provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      // ... submit merkle root to smart contract
    }
  }

  private toCSV(entries: AuditEntry[]): string {
    const headers = [
      'id', 'timestamp', 'entityType', 'entityId', 'action',
      'actorType', 'actorId', 'hash', 'previousHash',
    ];

    const rows = entries.map(e => [
      e.id,
      new Date(e.timestamp).toISOString(),
      e.entityType,
      e.entityId,
      e.action,
      e.actor.type,
      e.actor.id,
      e.hash,
      e.previousHash,
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }
}

// Export singleton
let auditChain: AuditChain | null = null;

export function initializeAuditChain(config: BlockchainConfig): AuditChain {
  auditChain = new AuditChain(config);
  return auditChain;
}

export function getAuditChain(): AuditChain {
  if (!auditChain) {
    throw new Error('AuditChain not initialized. Call initializeAuditChain first.');
  }
  return auditChain;
}
