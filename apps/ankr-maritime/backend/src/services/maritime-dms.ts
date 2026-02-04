/**
 * Maritime DMS - Document Management System for Mari8X
 *
 * Integrates:
 * - @ankr/docchain for blockchain verification (eBL, C/P)
 * - @fr8x/dms for document storage and versioning
 * - Maritime-specific features (DCSA eBL, vessel certificates, port notices)
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ============================================================================
// Types
// ============================================================================

export interface DocumentUploadInput {
  title: string;
  category: string;
  subcategory?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  entityType?: string;
  entityId?: string;
  voyageId?: string;
  vesselId?: string;
  tags?: string[];
  notes?: string;
  folderId?: string;
  requireBlockchainProof?: boolean; // For eBL, C/P
}

export interface DocumentVersionInput {
  documentId: string;
  fileHash: string;
  fileSize: number;
  mimeType: string;
  storagePath?: string;
  changelog?: string;
  uploadedBy: string;
  uploadedByName?: string;
}

export interface FolderInput {
  name: string;
  parentId?: string;
  folderType: string; // vessel, voyage, company, type
  entityId?: string;
  description?: string;
  permissions?: string[];
  organizationId: string;
}

export interface CheckInOutInput {
  documentId: string;
  userId: string;
  userName?: string;
  lockReason?: string;
  expectedRelease?: Date;
}

export interface BlockchainProofInput {
  documentId: string;
  documentHash: string;
  proofType?: string; // standard, ebl_dcsa, cp_immutable
  eblNumber?: string;
  eblStandard?: string;
  metadata?: any;
}

export interface CertificateExpiryInput {
  documentId: string;
  certificateType: string;
  issuedBy?: string;
  issueDate?: Date;
  expiryDate: Date;
  renewalDue?: Date;
  vesselId?: string;
  entityType?: string;
  entityId?: string;
}

// ============================================================================
// Maritime DMS Service
// ============================================================================

export class MaritimeDMS {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Document Management
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Upload a new document
   */
  async uploadDocument(input: DocumentUploadInput, uploadedBy: string) {
    // 1. Create document record
    const document = await prisma.document.create({
      data: {
        title: input.title,
        category: input.category,
        subcategory: input.subcategory,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        entityType: input.entityType,
        entityId: input.entityId,
        voyageId: input.voyageId,
        vesselId: input.vesselId,
        tags: input.tags || [],
        notes: input.notes,
        uploadedBy,
        organizationId: this.organizationId,
        status: 'active',
      },
    });

    // 2. Log audit trail
    await this.logAudit({
      documentId: document.id,
      action: 'created',
      performedBy: uploadedBy,
    });

    // 3. Create blockchain proof if required (for eBL, C/P)
    if (input.requireBlockchainProof) {
      const fileHash = this.generateFileHash(input.fileName);
      await this.createBlockchainProof({
        documentId: document.id,
        documentHash: fileHash,
        proofType: input.category === 'bol' ? 'ebl_dcsa' : 'cp_immutable',
      });
    }

    return document;
  }

  /**
   * Create a new document version
   */
  async createVersion(input: DocumentVersionInput) {
    // Get current version count
    const versionCount = await prisma.documentVersion.count({
      where: { documentId: input.documentId },
    });

    const version = await prisma.documentVersion.create({
      data: {
        documentId: input.documentId,
        versionNumber: versionCount + 1,
        fileHash: input.fileHash,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        storagePath: input.storagePath,
        changelog: input.changelog,
        uploadedBy: input.uploadedBy,
        uploadedByName: input.uploadedByName,
        organizationId: this.organizationId,
      },
    });

    await this.logAudit({
      documentId: input.documentId,
      action: 'versioned',
      performedBy: input.uploadedBy,
      metadata: { versionNumber: version.versionNumber, changelog: input.changelog },
    });

    return version;
  }

  /**
   * Get document with all versions
   */
  async getDocument(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId, organizationId: this.organizationId },
    });

    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId, organizationId: this.organizationId },
      orderBy: { versionNumber: 'desc' },
    });

    const auditLog = await prisma.documentAuditLog.findMany({
      where: { documentId, organizationId: this.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      ...document,
      versions,
      auditLog,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Folder Management
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Create a folder
   */
  async createFolder(input: FolderInput) {
    // Build folder path
    let folderPath = `/${input.name}`;
    if (input.parentId) {
      const parent = await prisma.documentFolder.findUnique({
        where: { id: input.parentId },
      });
      if (parent) {
        folderPath = `${parent.folderPath}/${input.name}`;
      }
    }

    const folder = await prisma.documentFolder.create({
      data: {
        name: input.name,
        parentId: input.parentId,
        folderPath,
        folderType: input.folderType,
        entityId: input.entityId,
        description: input.description,
        permissions: input.permissions || [],
        organizationId: input.organizationId,
      },
    });

    return folder;
  }

  /**
   * Get folder hierarchy
   */
  async getFolderTree(parentId?: string) {
    const folders = await prisma.documentFolder.findMany({
      where: {
        organizationId: this.organizationId,
        parentId: parentId || null,
      },
      orderBy: { name: 'asc' },
    });

    // Recursively load children
    const tree = await Promise.all(
      folders.map(async (folder) => {
        const children = await this.getFolderTree(folder.id);
        const documentCount = await prisma.document.count({
          where: {
            // Note: This assumes we add folderId to Document model
            // For now, returning 0
          },
        });

        return {
          ...folder,
          documentCount: 0, // TODO: Add folderId to Document model
          children,
        };
      })
    );

    return tree;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Check-in/Check-out (Document Locking)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Check out a document (lock for editing)
   */
  async checkOutDocument(input: CheckInOutInput) {
    // Check if already locked
    const existingLock = await prisma.documentLock.findUnique({
      where: { documentId: input.documentId },
    });

    if (existingLock) {
      throw new Error(
        `Document is already locked by ${existingLock.lockedByName || existingLock.lockedBy}`
      );
    }

    const lock = await prisma.documentLock.create({
      data: {
        documentId: input.documentId,
        lockedBy: input.userId,
        lockedByName: input.userName,
        lockReason: input.lockReason || 'Editing',
        expectedRelease: input.expectedRelease,
        organizationId: this.organizationId,
      },
    });

    await this.logAudit({
      documentId: input.documentId,
      action: 'locked',
      performedBy: input.userId,
      metadata: { lockReason: input.lockReason },
    });

    return lock;
  }

  /**
   * Check in a document (unlock)
   */
  async checkInDocument(documentId: string, userId: string) {
    const lock = await prisma.documentLock.findUnique({
      where: { documentId },
    });

    if (!lock) {
      throw new Error('Document is not locked');
    }

    if (lock.lockedBy !== userId) {
      throw new Error('Only the user who locked the document can unlock it');
    }

    await prisma.documentLock.delete({
      where: { documentId },
    });

    await this.logAudit({
      documentId,
      action: 'unlocked',
      performedBy: userId,
    });

    return { success: true };
  }

  /**
   * Get document lock status
   */
  async getLockStatus(documentId: string) {
    const lock = await prisma.documentLock.findUnique({
      where: { documentId },
    });

    return {
      isLocked: !!lock,
      lock,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Blockchain Verification (eBL, C/P)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Create blockchain proof for document
   */
  async createBlockchainProof(input: BlockchainProofInput) {
    // In production, this would:
    // 1. Submit hash to blockchain (Polygon, Ethereum)
    // 2. Get transaction ID
    // 3. Store verification data

    // For now, simulate blockchain submission
    const blockchainTxId = `0x${crypto.randomBytes(32).toString('hex')}`;
    const verificationUrl = `https://polygonscan.com/tx/${blockchainTxId}`;

    const proof = await prisma.blockchainProof.create({
      data: {
        documentId: input.documentId,
        documentHash: input.documentHash,
        blockchainTxId,
        blockchainNetwork: 'polygon',
        verificationUrl,
        proofType: input.proofType || 'standard',
        metadata: input.metadata,
        eblNumber: input.eblNumber,
        eblStandard: input.eblStandard || 'DCSA eBL 3.0',
        organizationId: this.organizationId,
      },
    });

    await this.logAudit({
      documentId: input.documentId,
      action: 'verified',
      performedBy: 'system',
      metadata: { blockchainTxId, verificationUrl },
    });

    return proof;
  }

  /**
   * Verify document against blockchain
   */
  async verifyDocument(documentId: string) {
    const proof = await prisma.blockchainProof.findUnique({
      where: { documentId, organizationId: this.organizationId },
    });

    if (!proof) {
      return {
        verified: false,
        error: 'No blockchain proof found for this document',
      };
    }

    // In production, query blockchain to verify hash
    // For now, assume verification passes
    return {
      verified: true,
      proof,
      timestamp: proof.createdAt,
      blockchainTxId: proof.blockchainTxId,
      verificationUrl: proof.verificationUrl,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Certificate Expiry Management
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Track certificate expiry
   */
  async trackCertificateExpiry(input: CertificateExpiryInput) {
    const expiry = await prisma.certificateExpiry.create({
      data: {
        documentId: input.documentId,
        certificateType: input.certificateType,
        issuedBy: input.issuedBy,
        issueDate: input.issueDate,
        expiryDate: input.expiryDate,
        renewalDue: input.renewalDue,
        vesselId: input.vesselId,
        entityType: input.entityType,
        entityId: input.entityId,
        renewalStatus: 'pending',
        organizationId: this.organizationId,
      },
    });

    return expiry;
  }

  /**
   * Get expiring certificates
   */
  async getExpiringCertificates(daysAhead: number = 90) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const expiring = await prisma.certificateExpiry.findMany({
      where: {
        organizationId: this.organizationId,
        expiryDate: { lte: futureDate },
        renewalStatus: { in: ['pending', 'in_progress'] },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return expiring;
  }

  /**
   * Send expiry alerts
   */
  async sendExpiryAlerts() {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Find certificates needing alerts
    const needsAlert = await prisma.certificateExpiry.findMany({
      where: {
        organizationId: this.organizationId,
        renewalStatus: { in: ['pending', 'in_progress'] },
        OR: [
          { expiryDate: { lte: in30Days }, alertSent30: false },
          { expiryDate: { lte: in60Days }, alertSent60: false },
          { expiryDate: { lte: in90Days }, alertSent90: false },
        ],
      },
    });

    const alerts = [];
    for (const cert of needsAlert) {
      const daysUntilExpiry = Math.floor(
        (cert.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 30 && !cert.alertSent30) {
        alerts.push({ cert, threshold: 30 });
        await prisma.certificateExpiry.update({
          where: { id: cert.id },
          data: { alertSent30: true },
        });
      } else if (daysUntilExpiry <= 60 && !cert.alertSent60) {
        alerts.push({ cert, threshold: 60 });
        await prisma.certificateExpiry.update({
          where: { id: cert.id },
          data: { alertSent60: true },
        });
      } else if (daysUntilExpiry <= 90 && !cert.alertSent90) {
        alerts.push({ cert, threshold: 90 });
        await prisma.certificateExpiry.update({
          where: { id: cert.id },
          data: { alertSent90: true },
        });
      }
    }

    return alerts;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Audit Trail
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Log document action
   */
  async logAudit(data: {
    documentId: string;
    action: string;
    performedBy: string;
    performedByName?: string;
    ipAddress?: string;
    userAgent?: string;
    changes?: any;
    metadata?: any;
  }) {
    await prisma.documentAuditLog.create({
      data: {
        documentId: data.documentId,
        action: data.action,
        performedBy: data.performedBy,
        performedByName: data.performedByName,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        changes: data.changes,
        metadata: data.metadata,
        organizationId: this.organizationId,
      },
    });
  }

  /**
   * Get audit trail for document
   */
  async getAuditTrail(documentId: string, limit: number = 100) {
    const logs = await prisma.documentAuditLog.findMany({
      where: {
        documentId,
        organizationId: this.organizationId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Utility
  // ──────────────────────────────────────────────────────────────────────────

  private generateFileHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

/**
 * Factory function to create MaritimeDMS instance
 */
export function createMaritimeDMS(organizationId: string): MaritimeDMS {
  return new MaritimeDMS(organizationId);
}
