import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// Types & Interfaces
// ============================================================================

export enum PermissionLevel {
  NONE = 'none',
  VIEW = 'view',
  COMMENT = 'comment',
  EDIT = 'edit',
  FULL_CONTROL = 'full_control',
}

export enum AccessType {
  USER = 'user',
  ROLE = 'role',
  TEAM = 'team',
  PUBLIC = 'public',
  EXTERNAL = 'external',
}

export interface AccessControlEntry {
  id: string;
  documentId: string;
  accessType: AccessType;
  entityId: string; // userId, roleId, teamId, or 'public'/'external-{email}'
  permissionLevel: PermissionLevel;
  expiresAt?: Date;
  grantedBy: string;
  grantedAt: Date;
  organizationId: string;
  metadata?: Record<string, any>;
}

export interface ShareLink {
  id: string;
  documentId: string;
  token: string;
  permissionLevel: PermissionLevel;
  expiresAt?: Date;
  maxDownloads?: number;
  downloadCount: number;
  password?: string;
  createdBy: string;
  createdAt: Date;
  lastAccessedAt?: Date;
  organizationId: string;
  metadata?: Record<string, any>;
}

export interface AccessAuditLog {
  id: string;
  documentId: string;
  userId?: string;
  action: 'view' | 'download' | 'edit' | 'share' | 'delete' | 'permission_change';
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  details?: Record<string, any>;
  organizationId: string;
}

export interface BulkAccessUpdate {
  documentIds: string[];
  accessType: AccessType;
  entityId: string;
  permissionLevel: PermissionLevel;
  expiresAt?: Date;
}

// ============================================================================
// Access Control Service
// ============================================================================

export class AccessControlService {
  /**
   * Grant access to a document
   */
  async grantAccess(
    documentId: string,
    accessType: AccessType,
    entityId: string, // userId, roleId, teamId
    permissionLevel: PermissionLevel,
    grantedBy: string,
    organizationId: string,
    options?: {
      expiresAt?: Date;
      notify?: boolean;
      metadata?: Record<string, any>;
    }
  ): Promise<AccessControlEntry> {
    // Verify document exists
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId,
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Check if user has permission to grant access
    const canGrant = await this.hasPermission(
      documentId,
      grantedBy,
      organizationId,
      PermissionLevel.FULL_CONTROL
    );

    if (!canGrant) {
      throw new Error('Insufficient permissions to grant access');
    }

    // Check if access already exists
    const existing = await prisma.accessControlEntry.findFirst({
      where: {
        documentId,
        accessType,
        entityId,
        organizationId,
      },
    });

    let acl: AccessControlEntry;

    if (existing) {
      // Update existing access
      const updated = await prisma.accessControlEntry.update({
        where: { id: existing.id },
        data: {
          permissionLevel,
          expiresAt: options?.expiresAt,
          metadata: options?.metadata,
        },
      });
      acl = updated as AccessControlEntry;
    } else {
      // Create new access
      const created = await prisma.accessControlEntry.create({
        data: {
          documentId,
          accessType,
          entityId,
          permissionLevel,
          expiresAt: options?.expiresAt,
          grantedBy,
          grantedAt: new Date(),
          organizationId,
          metadata: options?.metadata || {},
        },
      });
      acl = created as AccessControlEntry;
    }

    // Log access change
    await this.logAccess({
      id: this.generateId('audit'),
      documentId,
      userId: grantedBy,
      action: 'permission_change',
      timestamp: new Date(),
      details: {
        accessType,
        entityId,
        permissionLevel,
        action: existing ? 'updated' : 'granted',
      },
      organizationId,
    });

    // Send notification if requested
    if (options?.notify && accessType === AccessType.USER) {
      await this.notifyAccessGranted(documentId, entityId, permissionLevel, organizationId);
    }

    return acl;
  }

  /**
   * Revoke access to a document
   */
  async revokeAccess(
    documentId: string,
    accessType: AccessType,
    entityId: string,
    revokedBy: string,
    organizationId: string
  ): Promise<void> {
    // Check permissions
    const canRevoke = await this.hasPermission(
      documentId,
      revokedBy,
      organizationId,
      PermissionLevel.FULL_CONTROL
    );

    if (!canRevoke) {
      throw new Error('Insufficient permissions to revoke access');
    }

    await prisma.accessControlEntry.deleteMany({
      where: {
        documentId,
        accessType,
        entityId,
        organizationId,
      },
    });

    // Log access change
    await this.logAccess({
      id: this.generateId('audit'),
      documentId,
      userId: revokedBy,
      action: 'permission_change',
      timestamp: new Date(),
      details: {
        accessType,
        entityId,
        action: 'revoked',
      },
      organizationId,
    });

    // Notify user if their access was revoked
    if (accessType === AccessType.USER) {
      await this.notifyAccessRevoked(documentId, entityId, organizationId);
    }
  }

  /**
   * Check if user has permission for a document
   */
  async hasPermission(
    documentId: string,
    userId: string,
    organizationId: string,
    requiredLevel: PermissionLevel
  ): Promise<boolean> {
    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId,
      },
    });

    if (!document) {
      return false;
    }

    // Document owner has full control
    if (document.uploadedBy === userId) {
      return true;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // Organization admins have full control
    if (user.role === 'admin' || user.role === 'owner') {
      return true;
    }

    // Get all applicable ACL entries
    const aclEntries = await prisma.accessControlEntry.findMany({
      where: {
        documentId,
        organizationId,
        OR: [
          // Direct user access
          { accessType: AccessType.USER, entityId: userId },
          // Role-based access
          { accessType: AccessType.ROLE, entityId: user.role },
          // Public access
          { accessType: AccessType.PUBLIC, entityId: 'public' },
        ],
      },
    });

    // Filter out expired entries
    const validEntries = aclEntries.filter((entry) => {
      if (!entry.expiresAt) return true;
      return entry.expiresAt > new Date();
    });

    if (validEntries.length === 0) {
      return false;
    }

    // Get highest permission level
    const maxPermission = validEntries.reduce((max, entry) => {
      return this.comparePermissionLevels(entry.permissionLevel as PermissionLevel, max) > 0
        ? (entry.permissionLevel as PermissionLevel)
        : max;
    }, PermissionLevel.NONE);

    // Check if maxPermission meets or exceeds requiredLevel
    return this.comparePermissionLevels(maxPermission, requiredLevel) >= 0;
  }

  /**
   * Get user's permission level for a document
   */
  async getPermissionLevel(
    documentId: string,
    userId: string,
    organizationId: string
  ): Promise<PermissionLevel> {
    const document = await prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      return PermissionLevel.NONE;
    }

    // Document owner has full control
    if (document.uploadedBy === userId) {
      return PermissionLevel.FULL_CONTROL;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return PermissionLevel.NONE;
    }

    // Organization admins have full control
    if (user.role === 'admin' || user.role === 'owner') {
      return PermissionLevel.FULL_CONTROL;
    }

    // Get ACL entries
    const aclEntries = await prisma.accessControlEntry.findMany({
      where: {
        documentId,
        organizationId,
        OR: [
          { accessType: AccessType.USER, entityId: userId },
          { accessType: AccessType.ROLE, entityId: user.role },
          { accessType: AccessType.PUBLIC, entityId: 'public' },
        ],
      },
    });

    // Filter valid entries
    const validEntries = aclEntries.filter((entry) => {
      if (!entry.expiresAt) return true;
      return entry.expiresAt > new Date();
    });

    if (validEntries.length === 0) {
      return PermissionLevel.NONE;
    }

    // Return highest permission level
    return validEntries.reduce((max, entry) => {
      return this.comparePermissionLevels(entry.permissionLevel as PermissionLevel, max) > 0
        ? (entry.permissionLevel as PermissionLevel)
        : max;
    }, PermissionLevel.NONE);
  }

  /**
   * Create shareable link for a document
   */
  async createShareLink(
    documentId: string,
    createdBy: string,
    organizationId: string,
    options?: {
      permissionLevel?: PermissionLevel;
      expiresAt?: Date;
      maxDownloads?: number;
      password?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<ShareLink> {
    // Check permissions
    const canShare = await this.hasPermission(
      documentId,
      createdBy,
      organizationId,
      PermissionLevel.EDIT
    );

    if (!canShare) {
      throw new Error('Insufficient permissions to share document');
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const token = this.generateShareToken();

    const shareLink = await prisma.shareLink.create({
      data: {
        documentId,
        token,
        permissionLevel: options?.permissionLevel || PermissionLevel.VIEW,
        expiresAt: options?.expiresAt,
        maxDownloads: options?.maxDownloads,
        downloadCount: 0,
        password: options?.password,
        createdBy,
        createdAt: new Date(),
        organizationId,
        metadata: options?.metadata || {},
      },
    });

    // Log share action
    await this.logAccess({
      id: this.generateId('audit'),
      documentId,
      userId: createdBy,
      action: 'share',
      timestamp: new Date(),
      details: {
        linkId: shareLink.id,
        permissionLevel: shareLink.permissionLevel,
        expiresAt: shareLink.expiresAt?.toISOString(),
      },
      organizationId,
    });

    return shareLink as ShareLink;
  }

  /**
   * Access document via share link
   */
  async accessViaShareLink(
    token: string,
    password?: string
  ): Promise<{
    documentId: string;
    permissionLevel: PermissionLevel;
    expiresAt?: Date;
  }> {
    const shareLink = await prisma.shareLink.findFirst({
      where: { token },
    });

    if (!shareLink) {
      throw new Error('Invalid share link');
    }

    // Check expiration
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      throw new Error('Share link has expired');
    }

    // Check max downloads
    if (shareLink.maxDownloads && shareLink.downloadCount >= shareLink.maxDownloads) {
      throw new Error('Share link download limit reached');
    }

    // Check password
    if (shareLink.password && shareLink.password !== password) {
      throw new Error('Invalid password');
    }

    // Increment download count
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        downloadCount: shareLink.downloadCount + 1,
        lastAccessedAt: new Date(),
      },
    });

    return {
      documentId: shareLink.documentId,
      permissionLevel: shareLink.permissionLevel as PermissionLevel,
      expiresAt: shareLink.expiresAt || undefined,
    };
  }

  /**
   * Revoke share link
   */
  async revokeShareLink(
    linkId: string,
    revokedBy: string,
    organizationId: string
  ): Promise<void> {
    const shareLink = await prisma.shareLink.findFirst({
      where: {
        id: linkId,
        organizationId,
      },
    });

    if (!shareLink) {
      throw new Error('Share link not found');
    }

    // Check permissions
    const canRevoke = await this.hasPermission(
      shareLink.documentId,
      revokedBy,
      organizationId,
      PermissionLevel.EDIT
    );

    if (!canRevoke && shareLink.createdBy !== revokedBy) {
      throw new Error('Insufficient permissions to revoke share link');
    }

    await prisma.shareLink.delete({
      where: { id: linkId },
    });

    await this.logAccess({
      id: this.generateId('audit'),
      documentId: shareLink.documentId,
      userId: revokedBy,
      action: 'permission_change',
      timestamp: new Date(),
      details: {
        action: 'share_link_revoked',
        linkId,
      },
      organizationId,
    });
  }

  /**
   * Get all access entries for a document
   */
  async getDocumentAccess(
    documentId: string,
    organizationId: string
  ): Promise<AccessControlEntry[]> {
    const entries = await prisma.accessControlEntry.findMany({
      where: {
        documentId,
        organizationId,
      },
      orderBy: {
        grantedAt: 'desc',
      },
    });

    return entries as AccessControlEntry[];
  }

  /**
   * Get all share links for a document
   */
  async getDocumentShareLinks(
    documentId: string,
    organizationId: string
  ): Promise<ShareLink[]> {
    const links = await prisma.shareLink.findMany({
      where: {
        documentId,
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return links as ShareLink[];
  }

  /**
   * Get access audit log for a document
   */
  async getAccessAudit(
    documentId: string,
    organizationId: string,
    options?: {
      userId?: string;
      action?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
    }
  ): Promise<AccessAuditLog[]> {
    const where: any = {
      documentId,
      organizationId,
    };

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.action) {
      where.action = options.action;
    }

    if (options?.dateFrom || options?.dateTo) {
      where.timestamp = {};
      if (options.dateFrom) where.timestamp.gte = options.dateFrom;
      if (options.dateTo) where.timestamp.lte = options.dateTo;
    }

    const logs = await prisma.accessAuditLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: options?.limit || 100,
    });

    return logs as AccessAuditLog[];
  }

  /**
   * Bulk update access for multiple documents
   */
  async bulkUpdateAccess(
    updates: BulkAccessUpdate[],
    updatedBy: string,
    organizationId: string
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ documentId: string; error: string }>;
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ documentId: string; error: string }>,
    };

    for (const update of updates) {
      for (const documentId of update.documentIds) {
        try {
          await this.grantAccess(
            documentId,
            update.accessType,
            update.entityId,
            update.permissionLevel,
            updatedBy,
            organizationId,
            {
              expiresAt: update.expiresAt,
            }
          );
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            documentId,
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /**
   * Get documents accessible by a user
   */
  async getUserAccessibleDocuments(
    userId: string,
    organizationId: string,
    minPermissionLevel?: PermissionLevel
  ): Promise<string[]> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    // Get all documents in organization
    const documents = await prisma.document.findMany({
      where: { organizationId },
      select: { id: true },
    });

    const accessible: string[] = [];

    for (const doc of documents) {
      const permissionLevel = await this.getPermissionLevel(
        doc.id,
        userId,
        organizationId
      );

      if (
        permissionLevel !== PermissionLevel.NONE &&
        (!minPermissionLevel ||
          this.comparePermissionLevels(permissionLevel, minPermissionLevel) >= 0)
      ) {
        accessible.push(doc.id);
      }
    }

    return accessible;
  }

  /**
   * Clean up expired access entries and share links
   */
  async cleanupExpired(organizationId: string): Promise<{
    deletedACLs: number;
    deletedLinks: number;
  }> {
    const now = new Date();

    const deletedACLs = await prisma.accessControlEntry.deleteMany({
      where: {
        organizationId,
        expiresAt: {
          lt: now,
        },
      },
    });

    const deletedLinks = await prisma.shareLink.deleteMany({
      where: {
        organizationId,
        expiresAt: {
          lt: now,
        },
      },
    });

    return {
      deletedACLs: deletedACLs.count,
      deletedLinks: deletedLinks.count,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Compare permission levels
   * Returns: 1 if a > b, -1 if a < b, 0 if equal
   */
  private comparePermissionLevels(a: PermissionLevel, b: PermissionLevel): number {
    const levels = [
      PermissionLevel.NONE,
      PermissionLevel.VIEW,
      PermissionLevel.COMMENT,
      PermissionLevel.EDIT,
      PermissionLevel.FULL_CONTROL,
    ];

    const indexA = levels.indexOf(a);
    const indexB = levels.indexOf(b);

    if (indexA > indexB) return 1;
    if (indexA < indexB) return -1;
    return 0;
  }

  /**
   * Log access event
   */
  private async logAccess(log: AccessAuditLog): Promise<void> {
    await prisma.accessAuditLog.create({
      data: {
        documentId: log.documentId,
        userId: log.userId,
        action: log.action,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        timestamp: log.timestamp,
        details: log.details || {},
        organizationId: log.organizationId,
      },
    });
  }

  /**
   * Generate share token
   */
  private generateShareToken(): string {
    return `sl_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Notify user that access was granted
   */
  private async notifyAccessGranted(
    documentId: string,
    userId: string,
    permissionLevel: PermissionLevel,
    organizationId: string
  ): Promise<void> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) return;

    await prisma.notification.create({
      data: {
        userId,
        type: 'document_access_granted',
        title: 'Document Access Granted',
        message: `You have been granted ${permissionLevel} access to "${document.fileName}"`,
        link: `/documents/${documentId}`,
        metadata: {
          documentId,
          permissionLevel,
        },
        organizationId,
      },
    });
  }

  /**
   * Notify user that access was revoked
   */
  private async notifyAccessRevoked(
    documentId: string,
    userId: string,
    organizationId: string
  ): Promise<void> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) return;

    await prisma.notification.create({
      data: {
        userId,
        type: 'document_access_revoked',
        title: 'Document Access Revoked',
        message: `Your access to "${document.fileName}" has been revoked`,
        link: `/documents`,
        metadata: {
          documentId,
        },
        organizationId,
      },
    });
  }
}

export default new AccessControlService();
