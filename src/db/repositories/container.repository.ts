/**
 * Container Repository — Prisma-backed data access for containers
 */

import { Prisma } from '@prisma/client';
import { BaseRepository } from '../base.repository';
import type { ITenantRepository } from '../repository.interface';
import type { PaginationInput, PaginatedResult, OperationResult } from '../../types/common';

export class ContainerRepository
  extends BaseRepository
  implements ITenantRepository<any>
{
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  async findById(id: string): Promise<any | null> {
    return this.prisma.container.findUnique({
      where: { id },
      include: { movements: true, holds: true },
    });
  }

  async findByNumber(containerNumber: string): Promise<any | null> {
    return this.prisma.container.findUnique({
      where: { containerNumber },
      include: { movements: true, holds: true },
    });
  }

  async findByFacility(
    facilityId: string,
    filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const where: Record<string, unknown> = { facilityId };

    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.customsStatus) {
      where.customsStatus = filter.customsStatus;
    }
    if (filter?.owner) {
      where.owner = filter.owner;
    }

    const { skip, take, orderBy } = this.buildPagination(pagination);

    const [data, total] = await Promise.all([
      this.prisma.container.findMany({
        where,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: { movements: true, holds: true },
      }),
      this.prisma.container.count({ where }),
    ]);

    return this.buildPaginatedResult(data, total, pagination);
  }

  async findByTenant(
    tenantId: string,
    filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const where: Record<string, unknown> = { tenantId, ...filter };
    const { skip, take, orderBy } = this.buildPagination(pagination);

    const [data, total] = await Promise.all([
      this.prisma.container.findMany({
        where,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
      }),
      this.prisma.container.count({ where }),
    ]);

    return this.buildPaginatedResult(data, total, pagination);
  }

  async findMany(
    filter: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    return this.findByTenant(filter.tenantId as string, filter, pagination);
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  async create(data: Record<string, unknown>): Promise<OperationResult<any>> {
    try {
      const container = await this.prisma.container.create({ data: data as any });
      return { success: true, data: container };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return {
          success: false,
          error: `Container with the given unique field already exists`,
          errorCode: 'DUPLICATE_CONTAINER',
        };
      }
      throw error;
    }
  }

  async update(
    id: string,
    data: Record<string, unknown>,
  ): Promise<OperationResult<any>> {
    try {
      const container = await this.prisma.container.update({
        where: { id },
        data: data as any,
      });
      return { success: true, data: container };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return {
          success: false,
          error: `Container ${id} not found`,
          errorCode: 'NOT_FOUND',
        };
      }
      throw error;
    }
  }

  async delete(id: string): Promise<OperationResult<void>> {
    try {
      await this.prisma.container.delete({ where: { id } });
      return { success: true };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return {
          success: false,
          error: `Container ${id} not found`,
          errorCode: 'NOT_FOUND',
        };
      }
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Aggregates
  // ---------------------------------------------------------------------------

  async count(filter?: Record<string, unknown>): Promise<number> {
    return this.prisma.container.count({ where: filter as any });
  }

  async getStats(facilityId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    reeferCount: number;
    hazmatCount: number;
  }> {
    const [total, statusGroups, reeferCount, hazmatCount] = await Promise.all([
      this.prisma.container.count({ where: { facilityId } }),

      this.prisma.container.groupBy({
        by: ['status'],
        where: { facilityId },
        _count: { _all: true },
      }),

      this.prisma.container.count({
        where: { facilityId, reefer: { not: Prisma.JsonNull } },
      }),

      this.prisma.container.count({
        where: { facilityId, hazmat: { not: Prisma.JsonNull } },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const group of statusGroups) {
      byStatus[group.status] = group._count._all;
    }

    return { total, byStatus, reeferCount, hazmatCount };
  }
}
