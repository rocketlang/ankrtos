/**
 * Document DataLoaders
 * Phase 33: Task #71 - Query Optimization with DataLoader
 *
 * Batch and cache database queries to prevent N+1 problems:
 * - Document by ID
 * - Documents by folder
 * - Document versions
 * - Document analytics
 * - Folder metadata
 */

import DataLoader from 'dataloader';
import { prisma } from '../lib/prisma.js';
import { documentCache } from './document-cache.js';
import type { Document, DocumentVersion, DocumentFolder, DocumentAnalytics } from '@prisma/client';

/**
 * Document by ID loader (with Redis cache integration)
 */
export function createDocumentLoader() {
  return new DataLoader<string, Document | null>(
    async (documentIds) => {
      // Try cache first
      const cached = await documentCache.getDocuments(Array.from(documentIds));

      // Find uncached IDs
      const uncachedIds = documentIds.filter((id) => !cached.has(id));

      if (uncachedIds.length > 0) {
        // Fetch uncached from database
        const documents = await prisma.document.findMany({
          where: {
            id: { in: Array.from(uncachedIds) },
          },
        });

        // Add to cache
        const cachePromises = documents.map((doc) =>
          documentCache.getDocument(doc.id, { forceRefresh: false })
        );
        await Promise.all(cachePromises);

        // Add to result
        documents.forEach((doc) => {
          cached.set(doc.id, doc as any);
        });
      }

      // Return in same order as requested
      return documentIds.map((id) => (cached.get(id) as Document) || null);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Documents by folder loader
 */
export function createDocumentsByFolderLoader() {
  return new DataLoader<string | null, Document[]>(
    async (folderIds) => {
      const uniqueFolderIds = Array.from(new Set(folderIds));

      // Fetch all documents for these folders
      const documents = await prisma.document.findMany({
        where: {
          folderId: { in: uniqueFolderIds.filter((id) => id !== null) as string[] },
          status: 'active',
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group by folder ID
      const documentsByFolder = new Map<string | null, Document[]>();
      uniqueFolderIds.forEach((folderId) => {
        documentsByFolder.set(folderId, []);
      });

      documents.forEach((doc) => {
        const folderDocs = documentsByFolder.get(doc.folderId);
        if (folderDocs) {
          folderDocs.push(doc);
        }
      });

      // Return in same order as requested
      return folderIds.map((folderId) => documentsByFolder.get(folderId) || []);
    },
    {
      cache: true,
      maxBatchSize: 50,
    }
  );
}

/**
 * Document versions loader
 */
export function createDocumentVersionsLoader() {
  return new DataLoader<string, DocumentVersion[]>(
    async (documentIds) => {
      const versions = await prisma.documentVersion.findMany({
        where: {
          documentId: { in: Array.from(documentIds) },
        },
        orderBy: { versionNumber: 'desc' },
      });

      // Group by document ID
      const versionsByDocument = new Map<string, DocumentVersion[]>();
      documentIds.forEach((id) => {
        versionsByDocument.set(id, []);
      });

      versions.forEach((version) => {
        const docVersions = versionsByDocument.get(version.documentId);
        if (docVersions) {
          docVersions.push(version);
        }
      });

      return documentIds.map((id) => versionsByDocument.get(id) || []);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Latest version loader (optimized for common use case)
 */
export function createLatestVersionLoader() {
  return new DataLoader<string, DocumentVersion | null>(
    async (documentIds) => {
      // Get all versions
      const allVersions = await prisma.documentVersion.findMany({
        where: {
          documentId: { in: Array.from(documentIds) },
        },
        orderBy: { versionNumber: 'desc' },
      });

      // Find latest for each document
      const latestByDocument = new Map<string, DocumentVersion>();
      allVersions.forEach((version) => {
        if (!latestByDocument.has(version.documentId)) {
          latestByDocument.set(version.documentId, version);
        }
      });

      return documentIds.map((id) => latestByDocument.get(id) || null);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Document analytics loader
 */
export function createDocumentAnalyticsLoader() {
  return new DataLoader<string, DocumentAnalytics[]>(
    async (documentIds) => {
      const analytics = await prisma.documentAnalytics.findMany({
        where: {
          documentId: { in: Array.from(documentIds) },
        },
        orderBy: { timestamp: 'desc' },
        take: 100, // Limit to recent 100 events per document
      });

      // Group by document ID
      const analyticsByDocument = new Map<string, DocumentAnalytics[]>();
      documentIds.forEach((id) => {
        analyticsByDocument.set(id, []);
      });

      analytics.forEach((event) => {
        const docAnalytics = analyticsByDocument.get(event.documentId);
        if (docAnalytics) {
          docAnalytics.push(event);
        }
      });

      return documentIds.map((id) => analyticsByDocument.get(id) || []);
    },
    {
      cache: true,
      maxBatchSize: 50,
    }
  );
}

/**
 * Aggregated analytics loader (cached)
 */
export function createAggregatedAnalyticsLoader() {
  return new DataLoader<
    string,
    {
      totalViews: number;
      totalDownloads: number;
      totalShares: number;
      uniqueViewers: number;
      recentActivity: Date | null;
    }
  >(
    async (documentIds) => {
      const results = await Promise.all(
        documentIds.map(async (documentId) => {
          // Try cache first
          const cached = await documentCache.getAnalytics(documentId);
          if (cached) {
            return cached;
          }

          // Aggregate from database
          const analytics = await prisma.documentAnalytics.findMany({
            where: { documentId },
            select: {
              eventType: true,
              userId: true,
              timestamp: true,
            },
          });

          const uniqueViewers = new Set(
            analytics.filter((a) => a.eventType === 'view' && a.userId).map((a) => a.userId)
          );

          const aggregated = {
            totalViews: analytics.filter((a) => a.eventType === 'view').length,
            totalDownloads: analytics.filter((a) => a.eventType === 'download').length,
            totalShares: analytics.filter((a) => a.eventType === 'share').length,
            uniqueViewers: uniqueViewers.size,
            recentActivity:
              analytics.length > 0
                ? new Date(Math.max(...analytics.map((a) => a.timestamp.getTime())))
                : null,
          };

          // Cache for 30 minutes
          await documentCache.cacheAnalytics(documentId, aggregated);

          return aggregated;
        })
      );

      return results;
    },
    {
      cache: true,
      maxBatchSize: 50,
    }
  );
}

/**
 * Folder metadata loader
 */
export function createFolderLoader() {
  return new DataLoader<string, DocumentFolder | null>(
    async (folderIds) => {
      const folders = await prisma.documentFolder.findMany({
        where: {
          id: { in: Array.from(folderIds) },
        },
      });

      const folderMap = new Map<string, DocumentFolder>();
      folders.forEach((folder) => {
        folderMap.set(folder.id, folder);
      });

      return folderIds.map((id) => folderMap.get(id) || null);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Folder document count loader
 */
export function createFolderDocumentCountLoader() {
  return new DataLoader<string, number>(
    async (folderIds) => {
      const counts = await prisma.document.groupBy({
        by: ['folderId'],
        where: {
          folderId: { in: Array.from(folderIds) },
          status: 'active',
        },
        _count: {
          id: true,
        },
      });

      const countMap = new Map<string, number>();
      counts.forEach((count) => {
        if (count.folderId) {
          countMap.set(count.folderId, count._count.id);
        }
      });

      return folderIds.map((id) => countMap.get(id) || 0);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Document tag loader (for tag autocomplete)
 */
export function createTagLoader(organizationId: string) {
  return new DataLoader<string, string[]>(
    async (documentIds) => {
      const documents = await prisma.document.findMany({
        where: {
          id: { in: Array.from(documentIds) },
          organizationId,
        },
        select: {
          id: true,
          tags: true,
        },
      });

      const tagMap = new Map<string, string[]>();
      documents.forEach((doc) => {
        tagMap.set(doc.id, doc.tags);
      });

      return documentIds.map((id) => tagMap.get(id) || []);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create all DataLoaders for a request context
 */
export function createDocumentDataLoaders(organizationId: string) {
  return {
    document: createDocumentLoader(),
    documentsByFolder: createDocumentsByFolderLoader(),
    documentVersions: createDocumentVersionsLoader(),
    latestVersion: createLatestVersionLoader(),
    documentAnalytics: createDocumentAnalyticsLoader(),
    aggregatedAnalytics: createAggregatedAnalyticsLoader(),
    folder: createFolderLoader(),
    folderDocumentCount: createFolderDocumentCountLoader(),
    tags: createTagLoader(organizationId),
  };
}

/**
 * DataLoader type for context
 */
export type DocumentDataLoaders = ReturnType<typeof createDocumentDataLoaders>;
