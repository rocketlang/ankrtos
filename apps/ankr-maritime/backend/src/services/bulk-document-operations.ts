/**
 * Bulk Document Operations Service
 * Handles batch upload, delete, and download operations
 */

import { documentStorage } from './document-storage.js';
import { prisma } from '../lib/prisma.js';
import { Queue, Worker, Job } from 'bullmq';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';
import path from 'path';
import { minioClient } from './hybrid/minio-client.js';

interface BulkUploadOptions {
  files: Array<{
    buffer: Buffer;
    fileName: string;
    mimeType: string;
  }>;
  organizationId: string;
  folderId?: string;
  category?: string;
  tags?: string[];
  userId?: string;
}

interface BulkUploadResult {
  jobId: string;
  totalFiles: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

interface BulkDeleteOptions {
  documentIds: string[];
  organizationId: string;
  userId?: string;
}

interface BulkDeleteResult {
  jobId: string;
  totalDocuments: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

interface BulkDownloadOptions {
  documentIds: string[];
  organizationId: string;
  zipFileName?: string;
  userId?: string;
}

interface BulkDownloadResult {
  jobId: string;
  totalDocuments: number;
  downloadUrl?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

interface JobProgress {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
  result?: any;
}

// Redis connection for BullMQ
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Create queues
const bulkUploadQueue = new Queue('bulk-upload', { connection: redisConnection });
const bulkDeleteQueue = new Queue('bulk-delete', { connection: redisConnection });
const bulkDownloadQueue = new Queue('bulk-download', { connection: redisConnection });

class BulkDocumentOperations {
  /**
   * Batch upload multiple documents
   */
  async bulkUpload(options: BulkUploadOptions): Promise<BulkUploadResult> {
    const { files, organizationId, folderId, category, tags, userId } = options;

    // Create job
    const job = await bulkUploadQueue.add('bulk-upload', {
      files: files.map((f) => ({
        fileName: f.fileName,
        mimeType: f.mimeType,
        buffer: f.buffer.toString('base64'), // Serialize buffer
      })),
      organizationId,
      folderId,
      category,
      tags,
      userId,
    });

    return {
      jobId: job.id!,
      totalFiles: files.length,
      status: 'queued',
    };
  }

  /**
   * Batch delete multiple documents
   */
  async bulkDelete(options: BulkDeleteOptions): Promise<BulkDeleteResult> {
    const { documentIds, organizationId, userId } = options;

    // Verify all documents belong to organization
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        organizationId,
      },
      select: { id: true },
    });

    if (documents.length !== documentIds.length) {
      throw new Error(
        `Some documents not found or don't belong to organization. Found ${documents.length} of ${documentIds.length}`
      );
    }

    // Create job
    const job = await bulkDeleteQueue.add('bulk-delete', {
      documentIds,
      organizationId,
      userId,
    });

    return {
      jobId: job.id!,
      totalDocuments: documentIds.length,
      status: 'queued',
    };
  }

  /**
   * Batch download multiple documents as ZIP
   */
  async bulkDownload(options: BulkDownloadOptions): Promise<BulkDownloadResult> {
    const { documentIds, organizationId, zipFileName, userId } = options;

    // Verify all documents belong to organization
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        organizationId,
        status: 'active',
      },
      select: { id: true, fileName: true },
    });

    if (documents.length === 0) {
      throw new Error('No valid documents found');
    }

    // Create job
    const job = await bulkDownloadQueue.add('bulk-download', {
      documentIds,
      organizationId,
      zipFileName: zipFileName || `documents_${Date.now()}.zip`,
      userId,
    });

    return {
      jobId: job.id!,
      totalDocuments: documents.length,
      status: 'queued',
    };
  }

  /**
   * Get job progress
   */
  async getJobProgress(jobId: string, queueName: string): Promise<JobProgress> {
    let queue: Queue;

    switch (queueName) {
      case 'bulk-upload':
        queue = bulkUploadQueue;
        break;
      case 'bulk-delete':
        queue = bulkDeleteQueue;
        break;
      case 'bulk-download':
        queue = bulkDownloadQueue;
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    const state = await job.getState();
    const progress = job.progress as any;

    let status: 'queued' | 'processing' | 'completed' | 'failed';
    if (state === 'completed') {
      status = 'completed';
    } else if (state === 'failed') {
      status = 'failed';
    } else if (state === 'active') {
      status = 'processing';
    } else {
      status = 'queued';
    }

    return {
      jobId: job.id!,
      status,
      progress: progress?.percentage || 0,
      total: progress?.total || 0,
      processed: progress?.processed || 0,
      successful: progress?.successful || 0,
      failed: progress?.failed || 0,
      errors: progress?.errors || [],
      result: state === 'completed' ? job.returnvalue : undefined,
    };
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string, queueName: string): Promise<void> {
    let queue: Queue;

    switch (queueName) {
      case 'bulk-upload':
        queue = bulkUploadQueue;
        break;
      case 'bulk-delete':
        queue = bulkDeleteQueue;
        break;
      case 'bulk-download':
        queue = bulkDownloadQueue;
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }

    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  /**
   * Initialize workers
   */
  initializeWorkers() {
    // Bulk Upload Worker
    new Worker(
      'bulk-upload',
      async (job: Job) => {
        const { files, organizationId, folderId, category, tags, userId } = job.data;
        const results: any[] = [];
        const errors: string[] = [];

        for (let i = 0; i < files.length; i++) {
          try {
            const file = files[i];
            const buffer = Buffer.from(file.buffer, 'base64');

            const result = await documentStorage.uploadDocument({
              file: buffer,
              fileName: file.fileName,
              mimeType: file.mimeType,
              organizationId,
              folderId,
              category,
              tags,
              userId,
            });

            results.push(result);

            // Update progress
            await job.updateProgress({
              percentage: Math.round(((i + 1) / files.length) * 100),
              total: files.length,
              processed: i + 1,
              successful: results.length,
              failed: errors.length,
              errors,
            });
          } catch (error: any) {
            errors.push(`${files[i].fileName}: ${error.message}`);
            console.error(`Failed to upload ${files[i].fileName}:`, error);
          }
        }

        return {
          totalFiles: files.length,
          successful: results.length,
          failed: errors.length,
          results,
          errors,
        };
      },
      { connection: redisConnection }
    );

    // Bulk Delete Worker
    new Worker(
      'bulk-delete',
      async (job: Job) => {
        const { documentIds, organizationId, userId } = job.data;
        const results: string[] = [];
        const errors: string[] = [];

        for (let i = 0; i < documentIds.length; i++) {
          try {
            await documentStorage.deleteDocument(documentIds[i], userId);
            results.push(documentIds[i]);

            // Update progress
            await job.updateProgress({
              percentage: Math.round(((i + 1) / documentIds.length) * 100),
              total: documentIds.length,
              processed: i + 1,
              successful: results.length,
              failed: errors.length,
              errors,
            });
          } catch (error: any) {
            errors.push(`${documentIds[i]}: ${error.message}`);
            console.error(`Failed to delete ${documentIds[i]}:`, error);
          }
        }

        return {
          totalDocuments: documentIds.length,
          successful: results.length,
          failed: errors.length,
          deletedIds: results,
          errors,
        };
      },
      { connection: redisConnection }
    );

    // Bulk Download Worker
    new Worker(
      'bulk-download',
      async (job: Job) => {
        const { documentIds, organizationId, zipFileName, userId } = job.data;

        // Create ZIP in MinIO temp folder
        const tempZipKey = `temp/${organizationId}/${Date.now()}_${zipFileName}`;
        const archive = archiver('zip', { zlib: { level: 9 } });
        const chunks: Buffer[] = [];

        archive.on('data', (chunk) => chunks.push(chunk));

        // Add each document to ZIP
        for (let i = 0; i < documentIds.length; i++) {
          try {
            const { buffer, fileName } = await documentStorage.getDocumentBuffer(
              documentIds[i]
            );
            archive.append(buffer, { name: fileName });

            // Update progress
            await job.updateProgress({
              percentage: Math.round(((i + 1) / documentIds.length) * 100),
              total: documentIds.length,
              processed: i + 1,
              successful: i + 1,
              failed: 0,
              errors: [],
            });
          } catch (error: any) {
            console.error(`Failed to add document ${documentIds[i]} to ZIP:`, error);
          }
        }

        await archive.finalize();

        // Upload ZIP to MinIO
        const zipBuffer = Buffer.concat(chunks);
        const uploadResult = await minioClient.upload(tempZipKey, zipBuffer, {
          'x-amz-meta-organization': organizationId,
          'x-amz-meta-type': 'bulk-download',
          'x-amz-meta-created-by': userId || 'system',
        });

        // Generate presigned URL (valid for 24 hours)
        const downloadUrl = await minioClient.getUrl(tempZipKey, 86400);

        // Create audit log
        await prisma.documentAuditLog.create({
          data: {
            documentId: documentIds[0], // Use first doc as reference
            action: 'bulk_download',
            performedBy: userId || 'system',
            performedByName: userId || 'System',
            metadata: {
              totalDocuments: documentIds.length,
              zipFileName,
              documentIds,
            },
          },
        });

        return {
          totalDocuments: documentIds.length,
          zipFileName,
          downloadUrl,
          expiresIn: 86400,
        };
      },
      { connection: redisConnection }
    );

    console.log('✅ Bulk document operation workers initialized');
  }
}

export const bulkDocumentOps = new BulkDocumentOperations();

// Auto-initialize workers if this module is imported
bulkDocumentOps.initializeWorkers();
