/**
 * Facility repository — Prisma-backed data access for facilities,
 * facility zones, and yard blocks.
 */

import { BaseRepository } from '../base.repository';
import type { ITenantRepository } from '../repository.interface';
import type { PaginationInput, PaginatedResult, OperationResult } from '../../types/common';

export class FacilityRepository
  extends BaseRepository
  implements ITenantRepository<any>
{
  // ---------------------------------------------------------------------------
  // ITenantRepository implementation
  // ---------------------------------------------------------------------------

  async findById(id: string): Promise<any | null> {
    return this.prisma.facility.findUnique({
      where: { id },
      include: {
        zones: {
          include: { blocks: true },
        },
      },
    });
  }

  async findByCode(tenantId: string, code: string): Promise<any | null> {
    return this.prisma.facility.findFirst({
      where: { tenantId, code },
    });
  }

  async findByFacility(
    facilityId: string,
    _filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const facility = await this.findById(facilityId);
    const data = facility ? [facility] : [];
    return this.buildPaginatedResult(data, data.length, pagination);
  }

  async findByTenant(
    tenantId: string,
    filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const { skip, take, orderBy } = this.buildPagination(pagination);
    const where: any = { tenantId, ...filter };

    const [data, total] = await Promise.all([
      this.prisma.facility.findMany({ where, skip, take, orderBy }),
      this.prisma.facility.count({ where }),
    ]);
    return this.buildPaginatedResult(data, total, pagination);
  }

  async findMany(
    filter: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    return this.findByTenant(
      (filter.tenantId as string) ?? '',
      filter,
      pagination,
    );
  }

  async create(data: any): Promise<OperationResult<any>> {
    try {
      const facility = await this.prisma.facility.create({ data });
      return { success: true, data: facility };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return {
          success: false,
          error: 'A facility with the same unique fields already exists',
          errorCode: 'DUPLICATE_FACILITY',
        };
      }
      return { success: false, error: err.message, errorCode: 'CREATE_FAILED' };
    }
  }

  async update(id: string, data: any): Promise<OperationResult<any>> {
    try {
      const facility = await this.prisma.facility.update({
        where: { id },
        data,
      });
      return { success: true, data: facility };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return { success: false, error: 'Facility not found', errorCode: 'NOT_FOUND' };
      }
      return { success: false, error: err.message, errorCode: 'UPDATE_FAILED' };
    }
  }

  async delete(id: string): Promise<OperationResult<void>> {
    try {
      await this.prisma.facility.delete({ where: { id } });
      return { success: true };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return { success: false, error: 'Facility not found', errorCode: 'NOT_FOUND' };
      }
      return { success: false, error: err.message, errorCode: 'DELETE_FAILED' };
    }
  }

  async count(filter?: Record<string, unknown>): Promise<number> {
    return this.prisma.facility.count({ where: filter as any });
  }

  // ---------------------------------------------------------------------------
  // Zones
  // ---------------------------------------------------------------------------

  async createZone(data: any): Promise<OperationResult<any>> {
    try {
      const zone = await this.prisma.facilityZone.create({ data });
      return { success: true, data: zone };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return {
          success: false,
          error: 'A zone with the same unique fields already exists',
          errorCode: 'DUPLICATE_ZONE',
        };
      }
      return { success: false, error: err.message, errorCode: 'CREATE_FAILED' };
    }
  }

  async updateZone(id: string, data: any): Promise<OperationResult<any>> {
    try {
      const zone = await this.prisma.facilityZone.update({
        where: { id },
        data,
      });
      return { success: true, data: zone };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return { success: false, error: 'Zone not found', errorCode: 'NOT_FOUND' };
      }
      return { success: false, error: err.message, errorCode: 'UPDATE_FAILED' };
    }
  }

  async getZonesByFacility(facilityId: string): Promise<any[]> {
    return this.prisma.facilityZone.findMany({
      where: { facilityId },
      include: { blocks: true },
    });
  }

  // ---------------------------------------------------------------------------
  // Yard blocks
  // ---------------------------------------------------------------------------

  async createBlock(data: any): Promise<OperationResult<any>> {
    try {
      const block = await this.prisma.yardBlock.create({ data });
      return { success: true, data: block };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return {
          success: false,
          error: 'A block with the same unique fields already exists',
          errorCode: 'DUPLICATE_BLOCK',
        };
      }
      return { success: false, error: err.message, errorCode: 'CREATE_FAILED' };
    }
  }

  async updateBlock(id: string, data: any): Promise<OperationResult<any>> {
    try {
      const block = await this.prisma.yardBlock.update({
        where: { id },
        data,
      });
      return { success: true, data: block };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return { success: false, error: 'Block not found', errorCode: 'NOT_FOUND' };
      }
      return { success: false, error: err.message, errorCode: 'UPDATE_FAILED' };
    }
  }

  async getBlocksByZone(zoneId: string): Promise<any[]> {
    return this.prisma.yardBlock.findMany({
      where: { zoneId },
    });
  }
}
