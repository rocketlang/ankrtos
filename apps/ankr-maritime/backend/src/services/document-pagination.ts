/**
 * Document Pagination Service
 * Phase 33: Task #71 - Advanced Pagination with Lazy Loading
 *
 * Features:
 * - Cursor-based pagination (efficient for large datasets)
 * - Offset-based pagination (for page numbers)
 * - Virtual scrolling support
 * - Infinite scroll support
 * - Lazy loading for folder trees
 */

import { prisma } from '../lib/prisma.js';
import type { Document, Prisma } from '@prisma/client';

export interface PaginationOptions {
  limit?: number;
  cursor?: string | null;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  items: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
    totalCount?: number;
  };
}

export interface OffsetPaginationResult<T> {
  items: T[];
  pageInfo: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    perPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface DocumentFilter {
  organizationId: string;
  folderId?: string | null;
  category?: string;
  status?: string;
  search?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minSize?: number;
  maxSize?: number;
}

class DocumentPaginationService {
  /**
   * Cursor-based pagination (recommended for infinite scroll)
   */
  async cursorPaginate(
    filter: DocumentFilter,
    options: PaginationOptions = {}
  ): Promise<CursorPaginationResult<Document>> {
    const {
      limit = 50,
      cursor = null,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Build where clause
    const where = this.buildWhereClause(filter);

    // Build orderBy clause
    const orderBy: Prisma.DocumentOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Add ID to ensure stable sorting
    if (sortBy !== 'id') {
      orderBy.id = 'asc';
    }

    // Fetch items (limit + 1 to check hasNextPage)
    const items = await prisma.document.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor
        ? {
            skip: 1, // Skip the cursor item
            cursor: { id: cursor },
          }
        : {}),
    });

    const hasNextPage = items.length > limit;
    const paginatedItems = hasNextPage ? items.slice(0, -1) : items;

    const startCursor = paginatedItems.length > 0 ? paginatedItems[0].id : null;
    const endCursor =
      paginatedItems.length > 0 ? paginatedItems[paginatedItems.length - 1].id : null;

    // Check if there's a previous page
    let hasPreviousPage = false;
    if (cursor) {
      const previousItem = await prisma.document.findFirst({
        where,
        orderBy,
        cursor: { id: cursor },
        take: -1, // Reverse direction
        skip: 1,
      });
      hasPreviousPage = previousItem !== null;
    }

    return {
      items: paginatedItems,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor,
        endCursor,
      },
    };
  }

  /**
   * Offset-based pagination (for page numbers)
   */
  async offsetPaginate(
    filter: DocumentFilter,
    options: PaginationOptions = {}
  ): Promise<OffsetPaginationResult<Document>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Build where clause
    const where = this.buildWhereClause(filter);

    // Build orderBy clause
    const orderBy: Prisma.DocumentOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Get total count and items in parallel
    const [totalCount, items] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
    ]);

    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      items,
      pageInfo: {
        currentPage,
        totalPages,
        totalCount,
        perPage: limit,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

  /**
   * Virtual scroll pagination (fetch specific range)
   */
  async virtualScrollPaginate(
    filter: DocumentFilter,
    startIndex: number,
    endIndex: number,
    options: Partial<PaginationOptions> = {}
  ): Promise<{
    items: Document[];
    totalCount: number;
    startIndex: number;
    endIndex: number;
  }> {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = options;

    // Build where clause
    const where = this.buildWhereClause(filter);

    // Build orderBy clause
    const orderBy: Prisma.DocumentOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const limit = endIndex - startIndex + 1;

    // Get total count and items in parallel
    const [totalCount, items] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        orderBy,
        take: limit,
        skip: startIndex,
      }),
    ]);

    return {
      items,
      totalCount,
      startIndex,
      endIndex: startIndex + items.length - 1,
    };
  }

  /**
   * Lazy load folder children (for tree expansion)
   */
  async lazyLoadFolderChildren(
    folderId: string | null,
    organizationId: string,
    options: {
      documentsLimit?: number;
      foldersLimit?: number;
    } = {}
  ): Promise<{
    subfolders: Array<{
      id: string;
      folderName: string;
      documentCount: number;
      subfolderCount: number;
      hasChildren: boolean;
    }>;
    documents: Document[];
    totalDocuments: number;
    totalSubfolders: number;
  }> {
    const { documentsLimit = 100, foldersLimit = 100 } = options;

    // Fetch subfolders with counts
    const subfolders = await prisma.documentFolder.findMany({
      where: {
        organizationId,
        parentId: folderId,
      },
      take: foldersLimit,
      orderBy: { folderName: 'asc' },
      include: {
        _count: {
          select: {
            documents: { where: { status: 'active' } },
            subfolders: true,
          },
        },
      },
    });

    // Fetch documents in this folder
    const documents = await prisma.document.findMany({
      where: {
        organizationId,
        folderId: folderId,
        status: 'active',
      },
      take: documentsLimit,
      orderBy: { createdAt: 'desc' },
    });

    // Get total counts
    const [totalDocuments, totalSubfolders] = await Promise.all([
      prisma.document.count({
        where: {
          organizationId,
          folderId: folderId,
          status: 'active',
        },
      }),
      prisma.documentFolder.count({
        where: {
          organizationId,
          parentId: folderId,
        },
      }),
    ]);

    return {
      subfolders: subfolders.map((folder) => ({
        id: folder.id,
        folderName: folder.folderName,
        documentCount: folder._count.documents,
        subfolderCount: folder._count.subfolders,
        hasChildren: folder._count.documents > 0 || folder._count.subfolders > 0,
      })),
      documents,
      totalDocuments,
      totalSubfolders,
    };
  }

  /**
   * Search with pagination and highlighting
   */
  async searchPaginated(
    searchQuery: string,
    filter: DocumentFilter,
    options: PaginationOptions = {}
  ): Promise<
    CursorPaginationResult<
      Document & {
        relevanceScore?: number;
        highlights?: {
          title?: string;
          fileName?: string;
          content?: string;
        };
      }
    >
  > {
    const { limit = 50, cursor = null, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    // Build where clause with search
    const where = this.buildWhereClause({
      ...filter,
      search: searchQuery,
    });

    // Build orderBy clause
    const orderBy: Prisma.DocumentOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Fetch items
    const items = await prisma.document.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
    });

    const hasNextPage = items.length > limit;
    const paginatedItems = hasNextPage ? items.slice(0, -1) : items;

    // Add search highlights
    const itemsWithHighlights = paginatedItems.map((item) => ({
      ...item,
      highlights: this.generateHighlights(item, searchQuery),
    }));

    const startCursor = paginatedItems.length > 0 ? paginatedItems[0].id : null;
    const endCursor =
      paginatedItems.length > 0 ? paginatedItems[paginatedItems.length - 1].id : null;

    let hasPreviousPage = false;
    if (cursor) {
      const previousItem = await prisma.document.findFirst({
        where,
        orderBy,
        cursor: { id: cursor },
        take: -1,
        skip: 1,
      });
      hasPreviousPage = previousItem !== null;
    }

    return {
      items: itemsWithHighlights,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor,
        endCursor,
      },
    };
  }

  /**
   * Build where clause from filter
   */
  private buildWhereClause(filter: DocumentFilter): Prisma.DocumentWhereInput {
    const {
      organizationId,
      folderId,
      category,
      status = 'active',
      search,
      tags,
      dateFrom,
      dateTo,
      minSize,
      maxSize,
    } = filter;

    const where: Prisma.DocumentWhereInput = {
      organizationId,
      status,
    };

    if (folderId !== undefined) {
      where.folderId = folderId;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    if (minSize !== undefined || maxSize !== undefined) {
      where.fileSize = {};
      if (minSize !== undefined) {
        where.fileSize.gte = minSize;
      }
      if (maxSize !== undefined) {
        where.fileSize.lte = maxSize;
      }
    }

    return where;
  }

  /**
   * Generate search highlights
   */
  private generateHighlights(
    document: Document,
    searchQuery: string
  ): { title?: string; fileName?: string; content?: string } {
    const highlights: { title?: string; fileName?: string; content?: string } = {};

    const query = searchQuery.toLowerCase();

    if (document.title.toLowerCase().includes(query)) {
      highlights.title = this.highlightText(document.title, searchQuery);
    }

    if (document.fileName.toLowerCase().includes(query)) {
      highlights.fileName = this.highlightText(document.fileName, searchQuery);
    }

    if (document.notes && document.notes.toLowerCase().includes(query)) {
      highlights.content = this.highlightText(document.notes, searchQuery, 200);
    }

    return highlights;
  }

  /**
   * Highlight matched text
   */
  private highlightText(text: string, query: string, maxLength = 0): string {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 150);

    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    // Wrap match in <mark> tags
    const regex = new RegExp(`(${query})`, 'gi');
    snippet = snippet.replace(regex, '<mark>$1</mark>');

    return snippet;
  }
}

export const documentPagination = new DocumentPaginationService();
