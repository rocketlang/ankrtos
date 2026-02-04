/**
 * Document Upload REST API
 * Handles multipart file uploads with MinIO integration
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { documentStorage } from '../services/document-storage.js';
import { aiDocumentClassifier } from '../services/ai-document-classifier.js';
import { prisma } from '../lib/prisma.js';

interface UploadQuery {
  organizationId: string;
  folderId?: string;
  category?: string;
  title?: string;
  tags?: string;
  userId?: string;
}

export async function documentUploadRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/documents/upload
   * Upload a single document file
   */
  fastify.post<{ Querystring: UploadQuery }>(
    '/api/documents/upload',
    async (request: FastifyRequest<{ Querystring: UploadQuery }>, reply: FastifyReply) => {
      try {
        const data = await request.file();

        if (!data) {
          return reply.code(400).send({ error: 'No file uploaded' });
        }

        // Get query parameters
        const { organizationId, folderId, category, title, tags, userId } = request.query;

        if (!organizationId) {
          return reply.code(400).send({ error: 'organizationId is required' });
        }

        // Read file buffer
        const buffer = await data.toBuffer();

        // Parse tags if provided
        const parsedTags = tags ? tags.split(',').map((t) => t.trim()) : [];

        // Upload document
        const result = await documentStorage.uploadDocument({
          file: buffer,
          fileName: data.filename,
          mimeType: data.mimetype,
          organizationId,
          folderId,
          category,
          title,
          tags: parsedTags,
          userId,
        });

        // Phase 33: Task #69 - Auto-classify document (async, non-blocking)
        if (process.env.ENABLE_AUTO_CLASSIFICATION !== 'false') {
          // Run classification in background (don't await)
          aiDocumentClassifier
            .classifyDocument(data.filename)
            .then(async (classification) => {
              // Only apply if confidence is high enough and no category was manually set
              if (classification.confidence > 0.6 && !category) {
                await prisma.document.update({
                  where: { id: result.documentId },
                  data: {
                    category: classification.category,
                    subcategory: classification.subcategory,
                    tags: {
                      set: [...parsedTags, ...classification.suggestedTags].slice(0, 10),
                    },
                    metadata: {
                      classification: {
                        confidence: classification.confidence,
                        extractedEntities: classification.extractedEntities,
                        classifiedAt: new Date().toISOString(),
                        autoApplied: true,
                      },
                    },
                  },
                });
              }
            })
            .catch((error) => {
              console.error('Auto-classification error:', error);
              // Don't fail the upload if classification fails
            });
        }

        return reply.code(201).send({
          success: true,
          document: result,
        });
      } catch (error: any) {
        console.error('Document upload error:', error);
        return reply.code(500).send({
          error: 'Failed to upload document',
          message: error.message,
        });
      }
    }
  );

  /**
   * POST /api/documents/:documentId/version
   * Upload a new version of an existing document
   */
  fastify.post<{
    Params: { documentId: string };
    Querystring: { changelog?: string; userId?: string };
  }>(
    '/api/documents/:documentId/version',
    async (
      request: FastifyRequest<{
        Params: { documentId: string };
        Querystring: { changelog?: string; userId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const data = await request.file();

        if (!data) {
          return reply.code(400).send({ error: 'No file uploaded' });
        }

        const { documentId } = request.params;
        const { changelog, userId } = request.query;

        // Read file buffer
        const buffer = await data.toBuffer();

        // Upload new version
        const result = await documentStorage.uploadVersion(
          documentId,
          buffer,
          changelog || 'Version update',
          userId
        );

        return reply.code(201).send({
          success: true,
          version: result,
        });
      } catch (error: any) {
        console.error('Document version upload error:', error);
        return reply.code(500).send({
          error: 'Failed to upload document version',
          message: error.message,
        });
      }
    }
  );

  /**
   * GET /api/documents/:documentId/download
   * Get presigned download URL
   */
  fastify.get<{
    Params: { documentId: string };
    Querystring: { versionNumber?: number; expirySeconds?: number };
  }>(
    '/api/documents/:documentId/download',
    async (
      request: FastifyRequest<{
        Params: { documentId: string };
        Querystring: { versionNumber?: number; expirySeconds?: number };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { documentId } = request.params;
        const { versionNumber, expirySeconds } = request.query;

        const url = await documentStorage.getDownloadUrl(
          documentId,
          versionNumber,
          expirySeconds || 3600
        );

        return reply.send({
          success: true,
          url,
          expiresIn: expirySeconds || 3600,
        });
      } catch (error: any) {
        console.error('Document download URL error:', error);
        return reply.code(500).send({
          error: 'Failed to generate download URL',
          message: error.message,
        });
      }
    }
  );

  /**
   * GET /api/documents/:documentId/stream
   * Stream document file directly
   */
  fastify.get<{
    Params: { documentId: string };
    Querystring: { versionNumber?: number };
  }>(
    '/api/documents/:documentId/stream',
    async (
      request: FastifyRequest<{
        Params: { documentId: string };
        Querystring: { versionNumber?: number };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { documentId } = request.params;
        const { versionNumber } = request.query;

        const { buffer, fileName, mimeType } = await documentStorage.getDocumentBuffer(
          documentId,
          versionNumber
        );

        reply
          .header('Content-Type', mimeType)
          .header('Content-Disposition', `attachment; filename="${fileName}"`)
          .header('Content-Length', buffer.length)
          .send(buffer);
      } catch (error: any) {
        console.error('Document stream error:', error);
        return reply.code(500).send({
          error: 'Failed to stream document',
          message: error.message,
        });
      }
    }
  );

  /**
   * DELETE /api/documents/:documentId
   * Delete document and all versions
   */
  fastify.delete<{
    Params: { documentId: string };
    Querystring: { userId?: string };
  }>(
    '/api/documents/:documentId',
    async (
      request: FastifyRequest<{
        Params: { documentId: string };
        Querystring: { userId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { documentId } = request.params;
        const { userId } = request.query;

        await documentStorage.deleteDocument(documentId, userId);

        return reply.send({
          success: true,
          message: 'Document deleted successfully',
        });
      } catch (error: any) {
        console.error('Document delete error:', error);
        return reply.code(500).send({
          error: 'Failed to delete document',
          message: error.message,
        });
      }
    }
  );

  /**
   * DELETE /api/documents/:documentId/versions/:versionNumber
   * Delete specific version
   */
  fastify.delete<{
    Params: { documentId: string; versionNumber: string };
    Querystring: { userId?: string };
  }>(
    '/api/documents/:documentId/versions/:versionNumber',
    async (
      request: FastifyRequest<{
        Params: { documentId: string; versionNumber: string };
        Querystring: { userId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { documentId, versionNumber } = request.params;
        const { userId } = request.query;

        await documentStorage.deleteVersion(
          documentId,
          parseInt(versionNumber),
          userId
        );

        return reply.send({
          success: true,
          message: 'Version deleted successfully',
        });
      } catch (error: any) {
        console.error('Version delete error:', error);
        return reply.code(500).send({
          error: 'Failed to delete version',
          message: error.message,
        });
      }
    }
  );

  /**
   * GET /api/documents/storage-stats
   * Get storage statistics for organization
   */
  fastify.get<{ Querystring: { organizationId: string } }>(
    '/api/documents/storage-stats',
    async (
      request: FastifyRequest<{ Querystring: { organizationId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { organizationId } = request.query;

        if (!organizationId) {
          return reply.code(400).send({ error: 'organizationId is required' });
        }

        const stats = await documentStorage.getStorageStats(organizationId);

        return reply.send({
          success: true,
          stats,
        });
      } catch (error: any) {
        console.error('Storage stats error:', error);
        return reply.code(500).send({
          error: 'Failed to get storage stats',
          message: error.message,
        });
      }
    }
  );

  /**
   * GET /api/documents/health
   * Check MinIO health
   */
  fastify.get('/api/documents/health', async (request, reply) => {
    try {
      const healthy = await documentStorage.healthCheck();

      return reply.send({
        success: healthy,
        service: 'MinIO',
        status: healthy ? 'healthy' : 'unhealthy',
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        service: 'MinIO',
        status: 'error',
        message: error.message,
      });
    }
  });
}
