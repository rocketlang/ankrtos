/**
 * Document Versioning System
 *
 * Manages document versions:
 * - Version creation and tracking
 * - Version comparison and diff
 * - Version rollback and restore
 * - Branch and merge workflows (for collaborative editing)
 * - Version history and audit
 *
 * @module DocumentVersioning
 */

import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';
import * as crypto from 'crypto';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

// ============================================================================
// Types and Enums
// ============================================================================

export enum VersionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUPERSEDED = 'SUPERSEDED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum ChangeType {
  CREATED = 'CREATED',
  MODIFIED = 'MODIFIED',
  MINOR_EDIT = 'MINOR_EDIT',
  MAJOR_REVISION = 'MAJOR_REVISION',
  MERGED = 'MERGED',
  ROLLED_BACK = 'ROLLED_BACK',
}

export enum MergeStrategy {
  OVERWRITE = 'OVERWRITE',
  MANUAL = 'MANUAL',
  AUTO_MERGE = 'AUTO_MERGE',
}

// ============================================================================
// Interfaces
// ============================================================================

export interface DocumentVersion {
  versionId: string;
  documentId: string;
  versionNumber: string; // e.g., "1.0", "1.1", "2.0"
  majorVersion: number;
  minorVersion: number;
  patchVersion: number;

  status: VersionStatus;
  changeType: ChangeType;

  // Content
  contentHash: string; // SHA-256 hash of content
  fileSize: number;
  filePath: string; // Storage location

  // Metadata
  title: string;
  description?: string;
  changeLog?: string;
  tags?: string[];

  // Branching
  branchName?: string; // e.g., "main", "draft-2026-01", "legal-review"
  parentVersionId?: string;
  mergedFromVersionId?: string;

  // User tracking
  createdBy: string;
  createdAt: Date;

  // Multi-tenancy
  organizationId: string;

  // Additional metadata
  metadata?: Record<string, any>;
}

export interface VersionComparison {
  documentId: string;
  sourceVersion: string;
  targetVersion: string;

  differences: VersionDifference[];
  similarity: number; // 0-100%

  comparedAt: Date;
  comparedBy: string;
}

export interface VersionDifference {
  field: string;
  changeType: 'added' | 'removed' | 'modified';

  oldValue?: any;
  newValue?: any;

  location?: {
    line?: number;
    section?: string;
    page?: number;
  };
}

export interface VersionBranch {
  branchId: string;
  branchName: string;
  documentId: string;

  baseVersionId: string;
  headVersionId: string;

  status: 'active' | 'merged' | 'abandoned';

  createdBy: string;
  createdAt: Date;
  mergedAt?: Date;
  mergedBy?: string;

  organizationId: string;
}

export interface MergeResult {
  success: boolean;
  mergedVersionId?: string;
  conflicts?: MergeConflict[];

  strategy: MergeStrategy;
  performedAt: Date;
  performedBy: string;
}

export interface MergeConflict {
  field: string;
  sourceValue: any;
  targetValue: any;
  resolution?: 'keep_source' | 'keep_target' | 'manual';
}

// ============================================================================
// Document Versioning Service
// ============================================================================

export class DocumentVersioningService {

  /**
   * Create new version
   */
  async createVersion(
    documentId: string,
    changeType: ChangeType,
    content: string | Buffer,
    createdBy: string,
    organizationId: string,
    options?: {
      title?: string;
      description?: string;
      changeLog?: string;
      tags?: string[];
      branchName?: string;
      isMajor?: boolean;
      isMinor?: boolean;
    }
  ): Promise<DocumentVersion> {
    // Get document
    const document = await prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      throw new GraphQLError(`Document not found: ${documentId}`);
    }

    // Get current version
    const currentVersion = await this.getCurrentVersion(documentId, organizationId, options?.branchName);

    // Calculate new version number
    let majorVersion = 1;
    let minorVersion = 0;
    let patchVersion = 0;

    if (currentVersion) {
      majorVersion = currentVersion.majorVersion;
      minorVersion = currentVersion.minorVersion;
      patchVersion = currentVersion.patchVersion;

      if (options?.isMajor || changeType === ChangeType.MAJOR_REVISION) {
        majorVersion++;
        minorVersion = 0;
        patchVersion = 0;
      } else if (options?.isMinor || changeType === ChangeType.MODIFIED) {
        minorVersion++;
        patchVersion = 0;
      } else {
        patchVersion++;
      }

      // Mark current version as superseded
      await this.updateVersionStatus(currentVersion.versionId, VersionStatus.SUPERSEDED, organizationId);
    }

    const versionNumber = `${majorVersion}.${minorVersion}.${patchVersion}`;

    // Calculate content hash
    const contentHash = this.calculateContentHash(content);

    // Generate file path
    const filePath = `versions/${organizationId}/${documentId}/${versionNumber}`;

    const version: DocumentVersion = {
      versionId: this.generateVersionId(),
      documentId,
      versionNumber,
      majorVersion,
      minorVersion,
      patchVersion,
      status: VersionStatus.ACTIVE,
      changeType,
      contentHash,
      fileSize: Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content),
      filePath,
      title: options?.title || document.name,
      description: options?.description,
      changeLog: options?.changeLog,
      tags: options?.tags,
      branchName: options?.branchName || 'main',
      parentVersionId: currentVersion?.versionId,
      createdBy,
      createdAt: new Date(),
      organizationId,
      metadata: {
        documentType: document.type,
        originalFileName: document.name,
      },
    };

    // Store version (in production, use DocumentVersion table)
    const versions = (document.metadata as any)?.versions || [];
    versions.push(version);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          ...(document.metadata as any || {}),
          versions,
          currentVersion: version,
        },
      },
    });

    // In production: Store content to file storage
    // await this.storeVersionContent(version, content);

    return version;
  }

  /**
   * Get version by ID
   */
  async getVersion(
    versionId: string,
    organizationId: string
  ): Promise<DocumentVersion | null> {
    const documents = await prisma.document.findMany({
      where: { organizationId },
    });

    for (const doc of documents) {
      const versions = (doc.metadata as any)?.versions as DocumentVersion[] || [];
      const version = versions.find(v => v.versionId === versionId);

      if (version) {
        return version;
      }
    }

    return null;
  }

  /**
   * Get all versions for a document
   */
  async getVersionHistory(
    documentId: string,
    organizationId: string,
    branchName?: string
  ): Promise<DocumentVersion[]> {
    const document = await prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      throw new GraphQLError(`Document not found: ${documentId}`);
    }

    let versions = (document.metadata as any)?.versions as DocumentVersion[] || [];

    // Filter by branch if specified
    if (branchName) {
      versions = versions.filter(v => v.branchName === branchName);
    }

    // Sort by version number (descending)
    return versions.sort((a, b) => {
      if (a.majorVersion !== b.majorVersion) return b.majorVersion - a.majorVersion;
      if (a.minorVersion !== b.minorVersion) return b.minorVersion - a.minorVersion;
      return b.patchVersion - a.patchVersion;
    });
  }

  /**
   * Get current version
   */
  async getCurrentVersion(
    documentId: string,
    organizationId: string,
    branchName: string = 'main'
  ): Promise<DocumentVersion | null> {
    const versions = await this.getVersionHistory(documentId, organizationId, branchName);

    // Return first active version
    return versions.find(v => v.status === VersionStatus.ACTIVE) || null;
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    versionId1: string,
    versionId2: string,
    comparedBy: string,
    organizationId: string
  ): Promise<VersionComparison> {
    const version1 = await this.getVersion(versionId1, organizationId);
    const version2 = await this.getVersion(versionId2, organizationId);

    if (!version1 || !version2) {
      throw new GraphQLError('One or both versions not found');
    }

    if (version1.documentId !== version2.documentId) {
      throw new GraphQLError('Versions belong to different documents');
    }

    // Calculate differences
    const differences = this.calculateDifferences(version1, version2);

    // Calculate similarity
    const similarity = this.calculateSimilarity(version1, version2, differences);

    return {
      documentId: version1.documentId,
      sourceVersion: version1.versionNumber,
      targetVersion: version2.versionNumber,
      differences,
      similarity,
      comparedAt: new Date(),
      comparedBy,
    };
  }

  /**
   * Rollback to previous version
   */
  async rollbackToVersion(
    documentId: string,
    targetVersionId: string,
    performedBy: string,
    organizationId: string,
    reason?: string
  ): Promise<DocumentVersion> {
    const targetVersion = await this.getVersion(targetVersionId, organizationId);

    if (!targetVersion) {
      throw new GraphQLError(`Target version not found: ${targetVersionId}`);
    }

    if (targetVersion.documentId !== documentId) {
      throw new GraphQLError('Version does not belong to this document');
    }

    // In production: Fetch content from storage
    const content = `[Content from version ${targetVersion.versionNumber}]`;

    // Create new version based on target
    const newVersion = await this.createVersion(
      documentId,
      ChangeType.ROLLED_BACK,
      content,
      performedBy,
      organizationId,
      {
        title: targetVersion.title,
        description: `Rolled back to version ${targetVersion.versionNumber}`,
        changeLog: reason || `Rollback to version ${targetVersion.versionNumber}`,
        branchName: targetVersion.branchName,
        isMajor: true,
      }
    );

    newVersion.metadata = {
      ...newVersion.metadata,
      rolledBackFrom: targetVersionId,
      rolledBackAt: new Date().toISOString(),
      rolledBackBy: performedBy,
    };

    return newVersion;
  }

  /**
   * Create branch
   */
  async createBranch(
    documentId: string,
    branchName: string,
    baseVersionId: string,
    createdBy: string,
    organizationId: string
  ): Promise<VersionBranch> {
    const baseVersion = await this.getVersion(baseVersionId, organizationId);

    if (!baseVersion) {
      throw new GraphQLError(`Base version not found: ${baseVersionId}`);
    }

    if (baseVersion.documentId !== documentId) {
      throw new GraphQLError('Version does not belong to this document');
    }

    // Check if branch name already exists
    const existingBranch = await this.getBranch(documentId, branchName, organizationId);
    if (existingBranch && existingBranch.status === 'active') {
      throw new GraphQLError(`Branch already exists: ${branchName}`);
    }

    const branch: VersionBranch = {
      branchId: this.generateBranchId(),
      branchName,
      documentId,
      baseVersionId,
      headVersionId: baseVersionId,
      status: 'active',
      createdBy,
      createdAt: new Date(),
      organizationId,
    };

    // Store branch (in production, use VersionBranch table)
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    const branches = (document?.metadata as any)?.branches || [];
    branches.push(branch);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          ...(document?.metadata as any || {}),
          branches,
        },
      },
    });

    return branch;
  }

  /**
   * Merge branch
   */
  async mergeBranch(
    documentId: string,
    sourceBranchName: string,
    targetBranchName: string,
    performedBy: string,
    organizationId: string,
    strategy: MergeStrategy = MergeStrategy.AUTO_MERGE
  ): Promise<MergeResult> {
    const sourceBranch = await this.getBranch(documentId, sourceBranchName, organizationId);
    const targetBranch = await this.getBranch(documentId, targetBranchName, organizationId);

    if (!sourceBranch || !targetBranch) {
      throw new GraphQLError('Source or target branch not found');
    }

    const sourceVersion = await this.getVersion(sourceBranch.headVersionId, organizationId);
    const targetVersion = await this.getVersion(targetBranch.headVersionId, organizationId);

    if (!sourceVersion || !targetVersion) {
      throw new GraphQLError('Branch head versions not found');
    }

    // Calculate differences
    const comparison = await this.compareVersions(
      targetVersion.versionId,
      sourceVersion.versionId,
      performedBy,
      organizationId
    );

    // Check for conflicts
    const conflicts = this.detectMergeConflicts(comparison.differences);

    if (conflicts.length > 0 && strategy === MergeStrategy.AUTO_MERGE) {
      return {
        success: false,
        conflicts,
        strategy,
        performedAt: new Date(),
        performedBy,
      };
    }

    // Perform merge based on strategy
    let mergedContent: string;

    switch (strategy) {
      case MergeStrategy.OVERWRITE:
        mergedContent = `[Source branch content]`;
        break;

      case MergeStrategy.MANUAL:
        // In production: Return conflicts for manual resolution
        throw new GraphQLError('Manual merge requires conflict resolution');

      case MergeStrategy.AUTO_MERGE:
      default:
        mergedContent = this.autoMergeContent(sourceVersion, targetVersion, conflicts);
        break;
    }

    // Create merged version
    const mergedVersion = await this.createVersion(
      documentId,
      ChangeType.MERGED,
      mergedContent,
      performedBy,
      organizationId,
      {
        title: sourceVersion.title,
        description: `Merged ${sourceBranchName} into ${targetBranchName}`,
        changeLog: `Merge: ${sourceBranchName} → ${targetBranchName}`,
        branchName: targetBranchName,
        isMajor: true,
      }
    );

    mergedVersion.mergedFromVersionId = sourceVersion.versionId;

    // Update branches
    sourceBranch.status = 'merged';
    sourceBranch.mergedAt = new Date();
    sourceBranch.mergedBy = performedBy;

    targetBranch.headVersionId = mergedVersion.versionId;

    // Update document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    const branches = (document?.metadata as any)?.branches as VersionBranch[] || [];
    const updatedBranches = branches.map(b => {
      if (b.branchId === sourceBranch.branchId) return sourceBranch;
      if (b.branchId === targetBranch.branchId) return targetBranch;
      return b;
    });

    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          ...(document?.metadata as any || {}),
          branches: updatedBranches,
        },
      },
    });

    return {
      success: true,
      mergedVersionId: mergedVersion.versionId,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      strategy,
      performedAt: new Date(),
      performedBy,
    };
  }

  /**
   * Get branch
   */
  async getBranch(
    documentId: string,
    branchName: string,
    organizationId: string
  ): Promise<VersionBranch | null> {
    const document = await prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      return null;
    }

    const branches = (document.metadata as any)?.branches as VersionBranch[] || [];
    return branches.find(b => b.branchName === branchName) || null;
  }

  /**
   * Get all branches for a document
   */
  async getBranches(
    documentId: string,
    organizationId: string,
    activeOnly: boolean = false
  ): Promise<VersionBranch[]> {
    const document = await prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      return [];
    }

    let branches = (document.metadata as any)?.branches as VersionBranch[] || [];

    if (activeOnly) {
      branches = branches.filter(b => b.status === 'active');
    }

    return branches;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private calculateContentHash(content: string | Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
  }

  private calculateDifferences(
    version1: DocumentVersion,
    version2: DocumentVersion
  ): VersionDifference[] {
    const differences: VersionDifference[] = [];

    // Compare metadata fields
    const fields = ['title', 'description', 'tags', 'contentHash'];

    for (const field of fields) {
      const val1 = (version1 as any)[field];
      const val2 = (version2 as any)[field];

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push({
          field,
          changeType: 'modified',
          oldValue: val1,
          newValue: val2,
        });
      }
    }

    // In production: Perform actual content diff using diff library
    if (version1.contentHash !== version2.contentHash) {
      differences.push({
        field: 'content',
        changeType: 'modified',
        oldValue: version1.contentHash,
        newValue: version2.contentHash,
      });
    }

    return differences;
  }

  private calculateSimilarity(
    version1: DocumentVersion,
    version2: DocumentVersion,
    differences: VersionDifference[]
  ): number {
    // Simple similarity calculation
    // In production: Use more sophisticated algorithms (Levenshtein, cosine similarity, etc.)

    if (version1.contentHash === version2.contentHash) {
      return 100;
    }

    const totalFields = 10; // Approximate number of comparable fields
    const changedFields = differences.length;

    return Math.max(0, Math.round(((totalFields - changedFields) / totalFields) * 100));
  }

  private detectMergeConflicts(differences: VersionDifference[]): MergeConflict[] {
    const conflicts: MergeConflict[] = [];

    for (const diff of differences) {
      // In production: Implement sophisticated conflict detection
      // For now, treat all content changes as potential conflicts
      if (diff.field === 'content' && diff.changeType === 'modified') {
        conflicts.push({
          field: diff.field,
          sourceValue: diff.newValue,
          targetValue: diff.oldValue,
        });
      }
    }

    return conflicts;
  }

  private autoMergeContent(
    sourceVersion: DocumentVersion,
    targetVersion: DocumentVersion,
    conflicts: MergeConflict[]
  ): string {
    // In production: Implement three-way merge algorithm
    // For MVP, simple concatenation or overwrite

    if (conflicts.length === 0) {
      return `[Merged content from ${sourceVersion.versionNumber} and ${targetVersion.versionNumber}]`;
    }

    // Apply simple conflict resolution (prefer source)
    return `[Auto-merged with ${conflicts.length} conflicts resolved]`;
  }

  private async updateVersionStatus(
    versionId: string,
    status: VersionStatus,
    organizationId: string
  ): Promise<void> {
    const documents = await prisma.document.findMany({
      where: { organizationId },
    });

    for (const doc of documents) {
      const versions = (doc.metadata as any)?.versions as DocumentVersion[] || [];
      const versionIndex = versions.findIndex(v => v.versionId === versionId);

      if (versionIndex !== -1) {
        versions[versionIndex].status = status;

        await prisma.document.update({
          where: { id: doc.id },
          data: {
            metadata: {
              ...(doc.metadata as any || {}),
              versions,
            },
          },
        });

        break;
      }
    }
  }

  private generateVersionId(): string {
    return `VER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBranchId(): string {
    return `BRN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const documentVersioningService = new DocumentVersioningService();
