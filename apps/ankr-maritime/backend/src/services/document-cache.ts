/**
 * Document Cache Service
 * Phase 33: Task #71 - DMS Performance Optimization & Caching
 *
 * Redis-based caching layer for:
 * - Document metadata
 * - Folder hierarchies
 * - Search results
 * - Thumbnails and previews
 * - OCR text
 * - Analytics aggregations
 */

import Redis from 'ioredis';
import { prisma } from '../lib/prisma.js';

// Redis client singleton
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: Number(process.env.REDIS_DB) || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redis.on('error', (error) => {
      console.error('Redis client error:', error);
    });

    redis.on('connect', () => {
      console.log('Redis client connected');
    });
  }
  return redis;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 3600)
  forceRefresh?: boolean;
}

export interface DocumentCacheData {
  id: string;
  title: string;
  category: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  organizationId: string;
  folderId: string | null;
  tags: string[];
  status: string;
  viewCount: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any> | null;
}

export interface FolderHierarchyCache {
  folderId: string;
  folderName: string;
  parentId: string | null;
  documentCount: number;
  subfolders: FolderHierarchyCache[];
  path: string[];
}

class DocumentCacheService {
  private redis: Redis;
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly THUMBNAIL_TTL = 86400; // 24 hours
  private readonly OCR_TTL = 604800; // 7 days
  private readonly SEARCH_TTL = 300; // 5 minutes
  private readonly ANALYTICS_TTL = 1800; // 30 minutes

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Generate cache key with namespace
   */
  private getCacheKey(namespace: string, key: string): string {
    return `mari8x:dms:${namespace}:${key}`;
  }

  /**
   * Get document metadata from cache or database
   */
  async getDocument(
    documentId: string,
    options: CacheOptions = {}
  ): Promise<DocumentCacheData | null> {
    const { ttl = this.DEFAULT_TTL, forceRefresh = false } = options;
    const cacheKey = this.getCacheKey('document', documentId);

    // Try cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        // Restore Date objects
        data.createdAt = new Date(data.createdAt);
        data.updatedAt = new Date(data.updatedAt);
        return data;
      }
    }

    // Fetch from database
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        category: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        organizationId: true,
        folderId: true,
        tags: true,
        status: true,
        viewCount: true,
        downloadCount: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
      },
    });

    if (!document) {
      return null;
    }

    // Cache the result
    await this.redis.setex(cacheKey, ttl, JSON.stringify(document));

    return document as DocumentCacheData;
  }

  /**
   * Get multiple documents (batch)
   */
  async getDocuments(
    documentIds: string[],
    options: CacheOptions = {}
  ): Promise<Map<string, DocumentCacheData>> {
    const { ttl = this.DEFAULT_TTL, forceRefresh = false } = options;
    const result = new Map<string, DocumentCacheData>();

    if (documentIds.length === 0) {
      return result;
    }

    // Try cache first (unless force refresh)
    if (!forceRefresh) {
      const cacheKeys = documentIds.map((id) => this.getCacheKey('document', id));
      const cachedValues = await this.redis.mget(...cacheKeys);

      const uncachedIds: string[] = [];
      documentIds.forEach((id, index) => {
        if (cachedValues[index]) {
          const data = JSON.parse(cachedValues[index]!);
          data.createdAt = new Date(data.createdAt);
          data.updatedAt = new Date(data.updatedAt);
          result.set(id, data);
        } else {
          uncachedIds.push(id);
        }
      });

      if (uncachedIds.length === 0) {
        return result;
      }

      // Fetch uncached documents from database
      const documents = await prisma.document.findMany({
        where: { id: { in: uncachedIds } },
        select: {
          id: true,
          title: true,
          category: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          organizationId: true,
          folderId: true,
          tags: true,
          status: true,
          viewCount: true,
          downloadCount: true,
          createdAt: true,
          updatedAt: true,
          metadata: true,
        },
      });

      // Cache and add to result
      const pipeline = this.redis.pipeline();
      documents.forEach((doc) => {
        const cacheKey = this.getCacheKey('document', doc.id);
        pipeline.setex(cacheKey, ttl, JSON.stringify(doc));
        result.set(doc.id, doc as DocumentCacheData);
      });
      await pipeline.exec();
    } else {
      // Force refresh: fetch all from database
      const documents = await prisma.document.findMany({
        where: { id: { in: documentIds } },
        select: {
          id: true,
          title: true,
          category: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          organizationId: true,
          folderId: true,
          tags: true,
          status: true,
          viewCount: true,
          downloadCount: true,
          createdAt: true,
          updatedAt: true,
          metadata: true,
        },
      });

      // Cache all
      const pipeline = this.redis.pipeline();
      documents.forEach((doc) => {
        const cacheKey = this.getCacheKey('document', doc.id);
        pipeline.setex(cacheKey, ttl, JSON.stringify(doc));
        result.set(doc.id, doc as DocumentCacheData);
      });
      await pipeline.exec();
    }

    return result;
  }

  /**
   * Get folder hierarchy (cached for fast navigation)
   */
  async getFolderHierarchy(
    organizationId: string,
    parentId: string | null = null,
    options: CacheOptions = {}
  ): Promise<FolderHierarchyCache[]> {
    const { ttl = this.DEFAULT_TTL, forceRefresh = false } = options;
    const cacheKey = this.getCacheKey(
      'folder-hierarchy',
      `${organizationId}:${parentId || 'root'}`
    );

    // Try cache first
    if (!forceRefresh) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // Fetch from database
    const folders = await prisma.documentFolder.findMany({
      where: {
        organizationId,
        parentId: parentId || null,
      },
      select: {
        id: true,
        folderName: true,
        parentId: true,
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { folderName: 'asc' },
    });

    // Build hierarchy with recursive subfolder loading
    const hierarchy: FolderHierarchyCache[] = await Promise.all(
      folders.map(async (folder) => {
        const subfolders = await this.getFolderHierarchy(
          organizationId,
          folder.id,
          { forceRefresh }
        );

        return {
          folderId: folder.id,
          folderName: folder.folderName,
          parentId: folder.parentId,
          documentCount: folder._count.documents,
          subfolders,
          path: await this.getFolderPath(folder.id),
        };
      })
    );

    // Cache the result
    await this.redis.setex(cacheKey, ttl, JSON.stringify(hierarchy));

    return hierarchy;
  }

  /**
   * Get folder path (breadcrumb trail)
   */
  private async getFolderPath(folderId: string): Promise<string[]> {
    const cacheKey = this.getCacheKey('folder-path', folderId);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const path: string[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = await prisma.documentFolder.findUnique({
        where: { id: currentId },
        select: { folderName: true, parentId: true },
      });

      if (!folder) break;

      path.unshift(folder.folderName);
      currentId = folder.parentId;
    }

    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, JSON.stringify(path));

    return path;
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(
    searchQuery: string,
    organizationId: string,
    results: any[]
  ): Promise<void> {
    const cacheKey = this.getCacheKey(
      'search',
      `${organizationId}:${searchQuery.toLowerCase()}`
    );
    await this.redis.setex(cacheKey, this.SEARCH_TTL, JSON.stringify(results));
  }

  /**
   * Get cached search results
   */
  async getSearchResults(
    searchQuery: string,
    organizationId: string
  ): Promise<any[] | null> {
    const cacheKey = this.getCacheKey(
      'search',
      `${organizationId}:${searchQuery.toLowerCase()}`
    );
    const cached = await this.redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Cache thumbnail URL
   */
  async cacheThumbnail(documentId: string, thumbnailUrl: string): Promise<void> {
    const cacheKey = this.getCacheKey('thumbnail', documentId);
    await this.redis.setex(cacheKey, this.THUMBNAIL_TTL, thumbnailUrl);
  }

  /**
   * Get cached thumbnail URL
   */
  async getThumbnail(documentId: string): Promise<string | null> {
    const cacheKey = this.getCacheKey('thumbnail', documentId);
    return await this.redis.get(cacheKey);
  }

  /**
   * Cache OCR text
   */
  async cacheOCRText(documentId: string, text: string): Promise<void> {
    const cacheKey = this.getCacheKey('ocr', documentId);
    await this.redis.setex(cacheKey, this.OCR_TTL, text);
  }

  /**
   * Get cached OCR text
   */
  async getOCRText(documentId: string): Promise<string | null> {
    const cacheKey = this.getCacheKey('ocr', documentId);
    return await this.redis.get(cacheKey);
  }

  /**
   * Cache analytics aggregation
   */
  async cacheAnalytics(
    documentId: string,
    analytics: Record<string, any>
  ): Promise<void> {
    const cacheKey = this.getCacheKey('analytics', documentId);
    await this.redis.setex(cacheKey, this.ANALYTICS_TTL, JSON.stringify(analytics));
  }

  /**
   * Get cached analytics
   */
  async getAnalytics(documentId: string): Promise<Record<string, any> | null> {
    const cacheKey = this.getCacheKey('analytics', documentId);
    const cached = await this.redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Invalidate document cache (on update/delete)
   */
  async invalidateDocument(documentId: string): Promise<void> {
    const keys = [
      this.getCacheKey('document', documentId),
      this.getCacheKey('thumbnail', documentId),
      this.getCacheKey('analytics', documentId),
    ];
    await this.redis.del(...keys);
  }

  /**
   * Invalidate folder hierarchy cache
   */
  async invalidateFolderHierarchy(organizationId: string): Promise<void> {
    const pattern = this.getCacheKey('folder-hierarchy', `${organizationId}:*`);
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Invalidate search cache for organization
   */
  async invalidateSearchCache(organizationId: string): Promise<void> {
    const pattern = this.getCacheKey('search', `${organizationId}:*`);
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Clear all DMS caches
   */
  async clearAllCache(): Promise<void> {
    const pattern = 'mari8x:dms:*';
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsed: string;
    hitRate: number;
  }> {
    const info = await this.redis.info('stats');
    const keyspaceInfo = await this.redis.info('keyspace');

    // Parse memory usage
    const memoryMatch = info.match(/used_memory_human:(.+)/);
    const memoryUsed = memoryMatch ? memoryMatch[1].trim() : 'unknown';

    // Parse hits and misses
    const hitsMatch = info.match(/keyspace_hits:(\d+)/);
    const missesMatch = info.match(/keyspace_misses:(\d+)/);
    const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
    const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
    const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0;

    // Count DMS keys
    const dmsKeys = await this.redis.keys('mari8x:dms:*');

    return {
      totalKeys: dmsKeys.length,
      memoryUsed,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}

export const documentCache = new DocumentCacheService();
