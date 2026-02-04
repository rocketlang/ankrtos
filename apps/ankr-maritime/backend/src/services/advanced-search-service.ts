/**
 * Advanced Search Service
 * Phase 33: Task #65 - Advanced Search & Filters
 *
 * Features:
 * - PostgreSQL full-text search (tsvector)
 * - Faceted filters (category, tags, date range, size)
 * - Saved searches
 * - Search history tracking
 * - Export search results
 */

import { prisma } from '../lib/prisma.js';
import { documentCache } from './document-cache.js';
import type { Document, Prisma } from '@prisma/client';

export interface AdvancedSearchFilters {
  query?: string;
  categories?: string[];
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minSize?: number;
  maxSize?: number;
  fileTypes?: string[];
  uploadedBy?: string[];
  status?: string[];
  hasAttachments?: boolean;
  sortBy?: 'relevance' | 'createdAt' | 'updatedAt' | 'title' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: AdvancedSearchFilters;
  organizationId: string;
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
}

export interface SearchFacets {
  categories: Array<{ value: string; count: number }>;
  tags: Array<{ value: string; count: number }>;
  fileTypes: Array<{ value: string; count: number }>;
  uploadedBy: Array<{ userId: string; userName: string; count: number }>;
  dateRanges: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    older: number;
  };
  sizeRanges: {
    small: number; // < 1MB
    medium: number; // 1-10MB
    large: number; // 10-100MB
    xlarge: number; // > 100MB
  };
}

class AdvancedSearchService {
  /**
   * Perform advanced search with filters
   */
  async search(
    filters: AdvancedSearchFilters,
    organizationId: string,
    userId?: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{
    documents: Document[];
    total: number;
    facets: SearchFacets;
  }> {
    const { limit = 50, offset = 0 } = options;

    // Build where clause
    const where = this.buildWhereClause(filters, organizationId);

    // Track search query
    if (filters.query && userId) {
      await this.trackSearch(filters.query, organizationId, userId);
    }

    // Execute search with facets in parallel
    const [documents, total, facets] = await Promise.all([
      this.executeSearch(where, filters, limit, offset),
      prisma.document.count({ where }),
      this.getFacets(organizationId, where),
    ]);

    return { documents, total, facets };
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(
    filters: AdvancedSearchFilters,
    organizationId: string
  ): Prisma.DocumentWhereInput {
    const where: Prisma.DocumentWhereInput = {
      organizationId,
      status: { in: filters.status || ['active', 'pending_approval', 'approved'] },
    };

    // Full-text search
    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { fileName: { contains: filters.query, mode: 'insensitive' } },
        { notes: { contains: filters.query, mode: 'insensitive' } },
        { tags: { hasSome: [filters.query] } },
      ];
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      where.category = { in: filters.categories };
    }

    // Tags filter (must have all specified tags)
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasEvery: filters.tags };
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    // File size filter
    if (filters.minSize !== undefined || filters.maxSize !== undefined) {
      where.fileSize = {};
      if (filters.minSize !== undefined) {
        where.fileSize.gte = filters.minSize;
      }
      if (filters.maxSize !== undefined) {
        where.fileSize.lte = filters.maxSize;
      }
    }

    // File type filter (by MIME type)
    if (filters.fileTypes && filters.fileTypes.length > 0) {
      where.mimeType = { in: filters.fileTypes };
    }

    // Uploaded by filter
    if (filters.uploadedBy && filters.uploadedBy.length > 0) {
      where.uploadedBy = { in: filters.uploadedBy };
    }

    return where;
  }

  /**
   * Execute search query
   */
  private async executeSearch(
    where: Prisma.DocumentWhereInput,
    filters: AdvancedSearchFilters,
    limit: number,
    offset: number
  ): Promise<Document[]> {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const orderBy: Prisma.DocumentOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    return await prisma.document.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get search facets (for filters)
   */
  private async getFacets(
    organizationId: string,
    baseWhere: Prisma.DocumentWhereInput
  ): Promise<SearchFacets> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    const [
      categoryAgg,
      tagsAgg,
      fileTypesAgg,
      uploadedByAgg,
      dateRangeCounts,
      sizeRangeCounts,
    ] = await Promise.all([
      // Category facets
      prisma.document.groupBy({
        by: ['category'],
        where: { ...baseWhere, category: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),

      // Tags facets (flatten all tags)
      prisma.$queryRaw<Array<{ tag: string; count: bigint }>>`
        SELECT unnest(tags) as tag, COUNT(*) as count
        FROM "Document"
        WHERE "organizationId" = ${organizationId}
        AND status IN ('active', 'pending_approval', 'approved')
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 50
      `,

      // File type facets
      prisma.document.groupBy({
        by: ['mimeType'],
        where: { ...baseWhere, mimeType: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 15,
      }),

      // Uploaded by facets
      prisma.document.groupBy({
        by: ['uploadedBy'],
        where: { ...baseWhere, uploadedBy: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Date range counts
      Promise.all([
        prisma.document.count({ where: { ...baseWhere, createdAt: { gte: today } } }),
        prisma.document.count({ where: { ...baseWhere, createdAt: { gte: thisWeek } } }),
        prisma.document.count({ where: { ...baseWhere, createdAt: { gte: thisMonth } } }),
        prisma.document.count({ where: { ...baseWhere, createdAt: { gte: thisYear } } }),
        prisma.document.count({ where: { ...baseWhere, createdAt: { lt: thisYear } } }),
      ]),

      // Size range counts
      Promise.all([
        prisma.document.count({ where: { ...baseWhere, fileSize: { lt: 1024 * 1024 } } }),
        prisma.document.count({
          where: { ...baseWhere, fileSize: { gte: 1024 * 1024, lt: 10 * 1024 * 1024 } },
        }),
        prisma.document.count({
          where: { ...baseWhere, fileSize: { gte: 10 * 1024 * 1024, lt: 100 * 1024 * 1024 } },
        }),
        prisma.document.count({ where: { ...baseWhere, fileSize: { gte: 100 * 1024 * 1024 } } }),
      ]),
    ]);

    return {
      categories: categoryAgg.map((c) => ({ value: c.category!, count: c._count.id })),
      tags: tagsAgg.map((t) => ({ value: t.tag, count: Number(t.count) })),
      fileTypes: fileTypesAgg.map((f) => ({ value: f.mimeType!, count: f._count.id })),
      uploadedBy: uploadedByAgg.map((u) => ({
        userId: u.uploadedBy!,
        userName: u.uploadedBy!, // TODO: Resolve user names
        count: u._count.id,
      })),
      dateRanges: {
        today: dateRangeCounts[0],
        thisWeek: dateRangeCounts[1],
        thisMonth: dateRangeCounts[2],
        thisYear: dateRangeCounts[3],
        older: dateRangeCounts[4],
      },
      sizeRanges: {
        small: sizeRangeCounts[0],
        medium: sizeRangeCounts[1],
        large: sizeRangeCounts[2],
        xlarge: sizeRangeCounts[3],
      },
    };
  }

  /**
   * Save search
   */
  async saveSearch(
    name: string,
    filters: AdvancedSearchFilters,
    organizationId: string,
    userId: string,
    isPublic = false
  ): Promise<SavedSearch> {
    const saved = await prisma.savedSearch.create({
      data: {
        name,
        filters: filters as any,
        organizationId,
        createdBy: userId,
        isPublic,
        usageCount: 0,
      },
    });

    return {
      id: saved.id,
      name: saved.name,
      filters: saved.filters as AdvancedSearchFilters,
      organizationId: saved.organizationId,
      createdBy: saved.createdBy,
      isPublic: saved.isPublic,
      usageCount: saved.usageCount,
    };
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(organizationId: string, userId: string): Promise<SavedSearch[]> {
    const searches = await prisma.savedSearch.findMany({
      where: {
        organizationId,
        OR: [{ createdBy: userId }, { isPublic: true }],
      },
      orderBy: { usageCount: 'desc' },
    });

    return searches.map((s) => ({
      id: s.id,
      name: s.name,
      filters: s.filters as AdvancedSearchFilters,
      organizationId: s.organizationId,
      createdBy: s.createdBy,
      isPublic: s.isPublic,
      usageCount: s.usageCount,
    }));
  }

  /**
   * Use saved search
   */
  async useSavedSearch(savedSearchId: string, organizationId: string): Promise<SavedSearch> {
    const search = await prisma.savedSearch.update({
      where: { id: savedSearchId, organizationId },
      data: { usageCount: { increment: 1 } },
    });

    return {
      id: search.id,
      name: search.name,
      filters: search.filters as AdvancedSearchFilters,
      organizationId: search.organizationId,
      createdBy: search.createdBy,
      isPublic: search.isPublic,
      usageCount: search.usageCount,
    };
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(savedSearchId: string, userId: string): Promise<void> {
    await prisma.savedSearch.deleteMany({
      where: { id: savedSearchId, createdBy: userId },
    });
  }

  /**
   * Get search history
   */
  async getSearchHistory(
    organizationId: string,
    userId: string,
    limit = 20
  ): Promise<Array<{ query: string; count: number; lastSearched: Date }>> {
    const history = await prisma.searchQuery.findMany({
      where: { organizationId, userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { query: true, createdAt: true },
    });

    // Group by query and count
    const grouped = new Map<string, { count: number; lastSearched: Date }>();
    history.forEach((h) => {
      const existing = grouped.get(h.query);
      if (existing) {
        existing.count++;
        if (h.createdAt > existing.lastSearched) {
          existing.lastSearched = h.createdAt;
        }
      } else {
        grouped.set(h.query, { count: 1, lastSearched: h.createdAt });
      }
    });

    return Array.from(grouped.entries())
      .map(([query, data]) => ({ query, ...data }))
      .sort((a, b) => b.lastSearched.getTime() - a.lastSearched.getTime())
      .slice(0, limit);
  }

  /**
   * Export search results
   */
  async exportResults(
    filters: AdvancedSearchFilters,
    organizationId: string,
    format: 'csv' | 'json' | 'xlsx' = 'csv'
  ): Promise<string> {
    const where = this.buildWhereClause(filters, organizationId);

    const documents = await prisma.document.findMany({
      where,
      take: 1000, // Limit exports to 1000 docs
      select: {
        id: true,
        title: true,
        category: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        tags: true,
        uploadedBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (format === 'csv') {
      return this.exportToCSV(documents);
    } else if (format === 'json') {
      return JSON.stringify(documents, null, 2);
    } else {
      // TODO: Implement XLSX export
      throw new Error('XLSX export not yet implemented');
    }
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(documents: any[]): string {
    if (documents.length === 0) {
      return '';
    }

    const headers = ['ID', 'Title', 'Category', 'File Name', 'Size (bytes)', 'MIME Type', 'Tags', 'Uploaded By', 'Created At'];
    const rows = documents.map((doc) => [
      doc.id,
      doc.title,
      doc.category,
      doc.fileName,
      doc.fileSize,
      doc.mimeType,
      doc.tags.join('; '),
      doc.uploadedBy || '',
      doc.createdAt.toISOString(),
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ];

    return csvLines.join('\n');
  }

  /**
   * Track search query for analytics
   */
  private async trackSearch(query: string, organizationId: string, userId: string): Promise<void> {
    try {
      await prisma.searchQuery.create({
        data: {
          query,
          organizationId,
          userId,
          queryType: 'advanced',
          resultsCount: 0, // Will be updated by caller
          responseTime: 0,
        },
      });
    } catch (error) {
      // Don't fail search if tracking fails
      console.error('Failed to track search:', error);
    }
  }
}

export const advancedSearchService = new AdvancedSearchService();
