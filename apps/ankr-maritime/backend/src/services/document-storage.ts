/**
 * Document Storage Service
 * Handles file uploads, versioning, and retrieval using MinIO
 */

import { minioClient } from './hybrid/minio-client.js';
import { prisma } from '../lib/prisma.js';
import { createHash } from 'crypto';
import path from 'path';

export interface UploadDocumentOptions {
  file: Buffer;
  fileName: string;
  mimeType: string;
  organizationId: string;
  folderId?: string;
  category?: string;
  title?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  userId?: string;
}

export interface UploadResult {
  documentId: string;
  fileUrl: string;
  fileHash: string;
  versionId: string;
  versionNumber: number;
}

class DocumentStorageService {
  /**
   * Upload document to MinIO and create database record
   */
  async uploadDocument(options: UploadDocumentOptions): Promise<UploadResult> {
    const {
      file,
      fileName,
      mimeType,
      organizationId,
      folderId,
      category,
      title,
      tags,
      metadata,
      userId,
    } = options;

    // Generate file hash
    const fileHash = createHash('sha256').update(file).digest('hex');

    // Generate unique MinIO object key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const minioKey = `${organizationId}/${timestamp}_${sanitizedFileName}`;

    // Upload to MinIO
    const uploadResult = await minioClient.upload(minioKey, file, {
      'x-amz-meta-organization': organizationId,
      'x-amz-meta-original-name': fileName,
      'x-amz-meta-category': category || 'general',
      'x-amz-meta-uploaded-by': userId || 'system',
      'x-amz-meta-file-hash': fileHash,
    });

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        title: title || fileName,
        category: category || 'general',
        fileName: sanitizedFileName,
        fileSize: file.length,
        mimeType,
        organizationId,
        folderId: folderId || null,
        tags: tags || [],
        fileHash,
        filePath: minioKey,
        status: 'active',
        metadata: {
          minioVersionId: uploadResult.versionId,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      },
    });

    // Create version record
    const version = await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: 1,
        fileHash,
        fileSize: file.length,
        filePath: minioKey,
        uploadedBy: userId || 'system',
        changelog: 'Initial version',
        metadata: {
          minioVersionId: uploadResult.versionId,
          minioEtag: uploadResult.etag,
        },
      },
    });

    // Create audit log
    await prisma.documentAuditLog.create({
      data: {
        documentId: document.id,
        action: 'created',
        performedBy: userId || 'system',
        performedByName: userId || 'System',
        metadata: {
          fileName,
          fileSize: file.length,
          fileHash,
          versionNumber: 1,
        },
      },
    });

    return {
      documentId: document.id,
      fileUrl: uploadResult.url,
      fileHash,
      versionId: uploadResult.versionId || '',
      versionNumber: 1,
    };
  }

  /**
   * Upload new version of existing document
   */
  async uploadVersion(
    documentId: string,
    file: Buffer,
    changelog: string,
    userId?: string
  ): Promise<UploadResult> {
    // Get existing document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Generate file hash
    const fileHash = createHash('sha256').update(file).digest('hex');

    // Check if file content has changed
    const latestVersion = document.versions[0];
    if (latestVersion && latestVersion.fileHash === fileHash) {
      throw new Error('File content is identical to latest version');
    }

    // Generate MinIO key for new version
    const timestamp = Date.now();
    const sanitizedFileName = document.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const minioKey = `${document.organizationId}/${timestamp}_${sanitizedFileName}`;

    // Upload to MinIO
    const uploadResult = await minioClient.upload(minioKey, file, {
      'x-amz-meta-organization': document.organizationId,
      'x-amz-meta-document-id': documentId,
      'x-amz-meta-version-number': String((latestVersion?.versionNumber || 0) + 1),
      'x-amz-meta-file-hash': fileHash,
    });

    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Create new version record
    const version = await prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: newVersionNumber,
        fileHash,
        fileSize: file.length,
        filePath: minioKey,
        uploadedBy: userId || 'system',
        changelog,
        metadata: {
          minioVersionId: uploadResult.versionId,
          minioEtag: uploadResult.etag,
        },
      },
    });

    // Update document metadata
    await prisma.document.update({
      where: { id: documentId },
      data: {
        fileHash,
        fileSize: file.length,
        filePath: minioKey,
        metadata: {
          ...(document.metadata as any),
          currentVersionNumber: newVersionNumber,
          minioVersionId: uploadResult.versionId,
        },
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.documentAuditLog.create({
      data: {
        documentId,
        action: 'versioned',
        performedBy: userId || 'system',
        performedByName: userId || 'System',
        metadata: {
          versionNumber: newVersionNumber,
          fileHash,
          fileSize: file.length,
          changelog,
        },
      },
    });

    return {
      documentId,
      fileUrl: uploadResult.url,
      fileHash,
      versionId: uploadResult.versionId || '',
      versionNumber: newVersionNumber,
    };
  }

  /**
   * Get presigned download URL for document
   */
  async getDownloadUrl(
    documentId: string,
    versionNumber?: number,
    expirySeconds = 3600
  ): Promise<string> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: versionNumber
          ? {
              where: { versionNumber },
              take: 1,
            }
          : {
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const version = document.versions[0];
    if (!version) {
      throw new Error('Document version not found');
    }

    // Get presigned URL from MinIO
    const url = await minioClient.getUrl(version.filePath, expirySeconds);

    // Create audit log for download
    await prisma.documentAuditLog.create({
      data: {
        documentId,
        action: 'downloaded',
        performedBy: 'system',
        performedByName: 'System',
        metadata: {
          versionNumber: version.versionNumber,
          expirySeconds,
        },
      },
    });

    return url;
  }

  /**
   * Delete document and all versions from MinIO
   */
  async deleteDocument(documentId: string, userId?: string): Promise<void> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { versions: true },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete all versions from MinIO
    for (const version of document.versions) {
      try {
        await minioClient.delete(version.filePath);
      } catch (error) {
        console.error(`Failed to delete MinIO object: ${version.filePath}`, error);
      }
    }

    // Soft delete document in database (mark as deleted)
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'deleted',
        deletedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.documentAuditLog.create({
      data: {
        documentId,
        action: 'deleted',
        performedBy: userId || 'system',
        performedByName: userId || 'System',
        metadata: {
          versionsDeleted: document.versions.length,
        },
      },
    });
  }

  /**
   * Delete specific version from MinIO
   */
  async deleteVersion(
    documentId: string,
    versionNumber: number,
    userId?: string
  ): Promise<void> {
    const version = await prisma.documentVersion.findFirst({
      where: {
        documentId,
        versionNumber,
      },
    });

    if (!version) {
      throw new Error('Version not found');
    }

    // Check if it's the only version
    const versionCount = await prisma.documentVersion.count({
      where: { documentId },
    });

    if (versionCount === 1) {
      throw new Error('Cannot delete the only version. Delete the document instead.');
    }

    // Delete from MinIO
    await minioClient.delete(version.filePath);

    // Delete version record
    await prisma.documentVersion.delete({
      where: { id: version.id },
    });

    // Create audit log
    await prisma.documentAuditLog.create({
      data: {
        documentId,
        action: 'version_deleted',
        performedBy: userId || 'system',
        performedByName: userId || 'System',
        metadata: {
          versionNumber,
        },
      },
    });
  }

  /**
   * Get document file buffer
   */
  async getDocumentBuffer(
    documentId: string,
    versionNumber?: number
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: versionNumber
          ? {
              where: { versionNumber },
              take: 1,
            }
          : {
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const version = document.versions[0];
    if (!version) {
      throw new Error('Document version not found');
    }

    // Download from MinIO
    const buffer = await minioClient.download(version.filePath);

    return {
      buffer,
      fileName: document.fileName,
      mimeType: document.mimeType || 'application/octet-stream',
    };
  }

  /**
   * Check MinIO health
   */
  async healthCheck(): Promise<boolean> {
    return await minioClient.isAvailable();
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(organizationId: string): Promise<{
    totalDocuments: number;
    totalSize: number;
    totalVersions: number;
    averageFileSize: number;
  }> {
    const documents = await prisma.document.findMany({
      where: {
        organizationId,
        status: 'active',
      },
      include: {
        _count: {
          select: { versions: true },
        },
      },
    });

    const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
    const totalVersions = documents.reduce((sum, doc) => sum + doc._count.versions, 0);

    return {
      totalDocuments: documents.length,
      totalSize,
      totalVersions,
      averageFileSize: documents.length > 0 ? totalSize / documents.length : 0,
    };
  }
}

export const documentStorage = new DocumentStorageService();
