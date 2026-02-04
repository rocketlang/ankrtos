/**
 * Document Retention & Lifecycle Management Service
 * Phase 33: Task #70 - Document Retention & Lifecycle Management
 *
 * Features:
 * - Retention policies (by category)
 * - Auto-archive after retention period
 * - Soft delete with recovery window
 * - Hard delete after grace period
 * - Compliance reporting
 */

import { prisma } from '../lib/prisma.js';
import { documentStorage } from './document-storage.js';

export interface RetentionPolicy {
  id: string;
  name: string;
  category: string;
  retentionDays: number; // How long to keep active
  archiveAfterDays: number; // When to archive
  deleteAfterDays: number; // When to hard delete (from archive)
  organizationId: string;
  enabled: boolean;
}

export interface RetentionReport {
  totalDocuments: number;
  activeDocuments: number;
  archivedDocuments: number;
  deletedDocuments: number;
  documentsNearingRetention: number;
  storageReclaimed: number; // bytes
  byCategory: Array<{
    category: string;
    active: number;
    archived: number;
    deleted: number;
  }>;
}

class DocumentRetentionService {
  /**
   * Create retention policy
   */
  async createPolicy(
    policy: Omit<RetentionPolicy, 'id'>,
    organizationId: string
  ): Promise<RetentionPolicy> {
    const created = await prisma.retentionPolicy.create({
      data: {
        name: policy.name,
        category: policy.category,
        retentionDays: policy.retentionDays,
        archiveAfterDays: policy.archiveAfterDays,
        deleteAfterDays: policy.deleteAfterDays,
        organizationId,
        enabled: policy.enabled,
      },
    });

    return {
      id: created.id,
      name: created.name,
      category: created.category,
      retentionDays: created.retentionDays,
      archiveAfterDays: created.archiveAfterDays,
      deleteAfterDays: created.deleteAfterDays,
      organizationId: created.organizationId,
      enabled: created.enabled,
    };
  }

  /**
   * Run retention check (daily cron job)
   */
  async runRetentionCheck(organizationId: string): Promise<{
    archived: number;
    deleted: number;
    errors: number;
  }> {
    let archived = 0;
    let deleted = 0;
    let errors = 0;

    const policies = await prisma.retentionPolicy.findMany({
      where: { organizationId, enabled: true },
    });

    for (const policy of policies) {
      try {
        // Archive old documents
        const toArchive = await this.findDocumentsToArchive(policy);
        for (const doc of toArchive) {
          await this.archiveDocument(doc.id);
          archived++;
        }

        // Delete very old archived documents
        const toDelete = await this.findDocumentsToDelete(policy);
        for (const doc of toDelete) {
          await this.hardDeleteDocument(doc.id);
          deleted++;
        }
      } catch (error) {
        console.error(`Retention policy ${policy.id} error:`, error);
        errors++;
      }
    }

    return { archived, deleted, errors };
  }

  /**
   * Find documents ready for archival
   */
  private async findDocumentsToArchive(policy: RetentionPolicy) {
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - policy.archiveAfterDays);

    return await prisma.document.findMany({
      where: {
        organizationId: policy.organizationId,
        category: policy.category,
        status: 'active',
        createdAt: { lte: archiveDate },
      },
      select: { id: true },
    });
  }

  /**
   * Find archived documents ready for deletion
   */
  private async findDocumentsToDelete(policy: RetentionPolicy) {
    const deleteDate = new Date();
    deleteDate.setDate(deleteDate.getDate() - policy.deleteAfterDays);

    return await prisma.document.findMany({
      where: {
        organizationId: policy.organizationId,
        category: policy.category,
        status: 'archived',
        deletedAt: { lte: deleteDate },
      },
      select: { id: true },
    });
  }

  /**
   * Archive document (soft delete)
   */
  async archiveDocument(documentId: string): Promise<void> {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'archived',
        deletedAt: new Date(),
      },
    });

    await prisma.documentAuditLog.create({
      data: {
        documentId,
        action: 'archived',
        performedBy: 'system',
        performedByName: 'Retention Policy',
        metadata: {
          reason: 'Automatic archival based on retention policy',
        },
        organizationId: (await prisma.document.findUnique({
          where: { id: documentId },
          select: { organizationId: true },
        }))!.organizationId,
      },
    });
  }

  /**
   * Restore archived document
   */
  async restoreDocument(documentId: string, userId: string): Promise<void> {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'active',
        deletedAt: null,
      },
    });

    await prisma.documentAuditLog.create({
      data: {
        documentId,
        action: 'restored',
        performedBy: userId,
        performedByName: userId,
        metadata: {
          reason: 'Restored from archive',
        },
        organizationId: (await prisma.document.findUnique({
          where: { id: documentId },
          select: { organizationId: true },
        }))!.organizationId,
      },
    });
  }

  /**
   * Hard delete document (permanent)
   */
  async hardDeleteDocument(documentId: string): Promise<void> {
    // Delete from MinIO
    await documentStorage.deleteDocument(documentId, 'system');

    // Delete from database (cascade will handle related records)
    await prisma.document.delete({
      where: { id: documentId },
    });
  }

  /**
   * Get retention report
   */
  async getRetentionReport(organizationId: string): Promise<RetentionReport> {
    const [total, active, archived, deleted, byCategory] = await Promise.all([
      prisma.document.count({ where: { organizationId } }),
      prisma.document.count({ where: { organizationId, status: 'active' } }),
      prisma.document.count({ where: { organizationId, status: 'archived' } }),
      prisma.document.count({ where: { organizationId, status: 'deleted' } }),
      prisma.document.groupBy({
        by: ['category', 'status'],
        where: { organizationId },
        _count: { id: true },
        _sum: { fileSize: true },
      }),
    ]);

    // Calculate nearing retention (within 30 days of archive)
    const policies = await prisma.retentionPolicy.findMany({
      where: { organizationId, enabled: true },
    });

    let nearingRetention = 0;
    for (const policy of policies) {
      const nearingDate = new Date();
      nearingDate.setDate(nearingDate.getDate() - (policy.archiveAfterDays - 30));
      const count = await prisma.document.count({
        where: {
          organizationId,
          category: policy.category,
          status: 'active',
          createdAt: { lte: nearingDate },
        },
      });
      nearingRetention += count;
    }

    // Group by category
    const categoryMap = new Map<string, { active: number; archived: number; deleted: number }>();
    byCategory.forEach((item) => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, { active: 0, archived: 0, deleted: 0 });
      }
      const stats = categoryMap.get(item.category)!;
      if (item.status === 'active') stats.active = item._count.id;
      if (item.status === 'archived') stats.archived = item._count.id;
      if (item.status === 'deleted') stats.deleted = item._count.id;
    });

    const storageReclaimed = byCategory
      .filter((item) => item.status === 'deleted')
      .reduce((sum, item) => sum + Number(item._sum.fileSize || 0), 0);

    return {
      totalDocuments: total,
      activeDocuments: active,
      archivedDocuments: archived,
      deletedDocuments: deleted,
      documentsNearingRetention: nearingRetention,
      storageReclaimed,
      byCategory: Array.from(categoryMap.entries()).map(([category, stats]) => ({
        category,
        ...stats,
      })),
    };
  }
}

export const documentRetentionService = new DocumentRetentionService();
