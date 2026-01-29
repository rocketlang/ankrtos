/**
 * Abstract base repository — shared pagination and Prisma access
 */

import type { PrismaClient } from '@prisma/client';
import type { PaginationInput, PaginatedResult } from '../types/common';
import { getPrismaClient } from './client';

export abstract class BaseRepository {
  protected get prisma(): PrismaClient {
    return getPrismaClient();
  }

  protected buildPagination(pagination?: PaginationInput): {
    skip: number;
    take: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  } {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 25;
    return {
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: pagination?.sortBy
        ? { [pagination.sortBy]: pagination.sortOrder ?? 'desc' }
        : undefined,
    };
  }

  protected buildPaginatedResult<R>(
    data: R[],
    total: number,
    pagination?: PaginationInput,
  ): PaginatedResult<R> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 25;
    const totalPages = Math.ceil(total / pageSize);
    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }
}
