/**
 * Bulk Document Operations REST API
 * Handles batch upload, delete, and download operations
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { bulkDocumentOps } from '../services/bulk-document-operations.js';

interface BulkUploadQuery {
  organizationId: string;
  folderId?: string;
  category?: string;
  tags?: string;
  userId?: string;
}

interface BulkDeleteBody {
  documentIds: string[];
  organizationId: string;
  userId?: string;
}

interface BulkDownloadBody {
  documentIds: string[];
  organizationId: string;
  zipFileName?: string;
  userId?: string;
}

interface JobProgressQuery {
  jobId: string;
  queueName: string;
}

export async function bulkOperationsRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/documents/bulk-upload
   * Upload multiple documents at once
   */
  fastify.post<{ Querystring: BulkUploadQuery }>(
    '/api/documents/bulk-upload',
    async (request: FastifyRequest<{ Querystring: BulkUploadQuery }>, reply: FastifyReply) => {
      try {
        // Get multiple files
        const files = await request.files();
        const uploadFiles: Array<{
          buffer: Buffer;
          fileName: string;
          mimeType: string;
        }> = [];

        for await (const file of files) {
          const buffer = await file.toBuffer();
          uploadFiles.push({
            buffer,
            fileName: file.filename,
            mimeType: file.mimetype,
          });
        }

        if (uploadFiles.length === 0) {
          return reply.code(400).send({ error: 'No files uploaded' });
        }

        const { organizationId, folderId, category, tags, userId } = request.query;

        if (!organizationId) {
          return reply.code(400).send({ error: 'organizationId is required' });
        }

        // Parse tags if provided
        const parsedTags = tags ? tags.split(',').map((t) => t.trim()) : [];

        // Queue bulk upload job
        const result = await bulkDocumentOps.bulkUpload({
          files: uploadFiles,
          organizationId,
          folderId,
          category,
          tags: parsedTags,
          userId,
        });

        return reply.code(202).send({
          success: true,
          message: 'Bulk upload job queued',
          ...result,
        });
      } catch (error: any) {
        console.error('Bulk upload error:', error);
        return reply.code(500).send({
          error: 'Failed to queue bulk upload',
          message: error.message,
        });
      }
    }
  );

  /**
   * POST /api/documents/bulk-delete
   * Delete multiple documents at once
   */
  fastify.post<{ Body: BulkDeleteBody }>(
    '/api/documents/bulk-delete',
    async (request: FastifyRequest<{ Body: BulkDeleteBody }>, reply: FastifyReply) => {
      try {
        const { documentIds, organizationId, userId } = request.body;

        if (!documentIds || documentIds.length === 0) {
          return reply.code(400).send({ error: 'documentIds array is required' });
        }

        if (!organizationId) {
          return reply.code(400).send({ error: 'organizationId is required' });
        }

        // Queue bulk delete job
        const result = await bulkDocumentOps.bulkDelete({
          documentIds,
          organizationId,
          userId,
        });

        return reply.code(202).send({
          success: true,
          message: 'Bulk delete job queued',
          ...result,
        });
      } catch (error: any) {
        console.error('Bulk delete error:', error);
        return reply.code(500).send({
          error: 'Failed to queue bulk delete',
          message: error.message,
        });
      }
    }
  );

  /**
   * POST /api/documents/bulk-download
   * Download multiple documents as ZIP
   */
  fastify.post<{ Body: BulkDownloadBody }>(
    '/api/documents/bulk-download',
    async (request: FastifyRequest<{ Body: BulkDownloadBody }>, reply: FastifyReply) => {
      try {
        const { documentIds, organizationId, zipFileName, userId } = request.body;

        if (!documentIds || documentIds.length === 0) {
          return reply.code(400).send({ error: 'documentIds array is required' });
        }

        if (!organizationId) {
          return reply.code(400).send({ error: 'organizationId is required' });
        }

        // Queue bulk download job
        const result = await bulkDocumentOps.bulkDownload({
          documentIds,
          organizationId,
          zipFileName,
          userId,
        });

        return reply.code(202).send({
          success: true,
          message: 'Bulk download job queued',
          ...result,
        });
      } catch (error: any) {
        console.error('Bulk download error:', error);
        return reply.code(500).send({
          error: 'Failed to queue bulk download',
          message: error.message,
        });
      }
    }
  );

  /**
   * GET /api/documents/bulk-job/:jobId
   * Get job progress status
   */
  fastify.get<{
    Params: { jobId: string };
    Querystring: { queueName: string };
  }>(
    '/api/documents/bulk-job/:jobId',
    async (
      request: FastifyRequest<{
        Params: { jobId: string };
        Querystring: { queueName: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { jobId } = request.params;
        const { queueName } = request.query;

        if (!queueName) {
          return reply.code(400).send({ error: 'queueName is required' });
        }

        const progress = await bulkDocumentOps.getJobProgress(jobId, queueName);

        return reply.send({
          success: true,
          ...progress,
        });
      } catch (error: any) {
        console.error('Get job progress error:', error);
        return reply.code(500).send({
          error: 'Failed to get job progress',
          message: error.message,
        });
      }
    }
  );

  /**
   * DELETE /api/documents/bulk-job/:jobId
   * Cancel a queued/running job
   */
  fastify.delete<{
    Params: { jobId: string };
    Querystring: { queueName: string };
  }>(
    '/api/documents/bulk-job/:jobId',
    async (
      request: FastifyRequest<{
        Params: { jobId: string };
        Querystring: { queueName: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { jobId } = request.params;
        const { queueName } = request.query;

        if (!queueName) {
          return reply.code(400).send({ error: 'queueName is required' });
        }

        await bulkDocumentOps.cancelJob(jobId, queueName);

        return reply.send({
          success: true,
          message: 'Job cancelled successfully',
        });
      } catch (error: any) {
        console.error('Cancel job error:', error);
        return reply.code(500).send({
          error: 'Failed to cancel job',
          message: error.message,
        });
      }
    }
  );
}
