/**
 * Rail Repository — Prisma-backed data access for rail tracks, rakes, and wagons
 */

import { BaseRepository } from '../base.repository';
import type { ITenantRepository } from '../repository.interface';
import type { PaginationInput, PaginatedResult, OperationResult } from '../../types/common';

export class RailRepository
  extends BaseRepository
  implements ITenantRepository<any>
{
  // ---------------------------------------------------------------------------
  // ITenantRepository interface — delegates to track-specific methods
  // ---------------------------------------------------------------------------

  async findById(_id: string): Promise<any | null> {
    // Rail has multiple sub-entities; use findRakeById or findTracksByFacility.
    return null;
  }

  async findMany(
    filter: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    return this.findTracksByFacility(filter.facilityId as string, pagination);
  }

  async findByFacility(
    facilityId: string,
    _filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    return this.findTracksByFacility(facilityId, pagination);
  }

  async findByTenant(
    tenantId: string,
    filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const where: Record<string, unknown> = { tenantId, ...filter };
    const { skip, take, orderBy } = this.buildPagination(pagination);

    const [data, total] = await Promise.all([
      this.prisma.railTrack.findMany({
        where,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: { rakes: true },
      }),
      this.prisma.railTrack.count({ where }),
    ]);

    return this.buildPaginatedResult(data, total, pagination);
  }

  async create(data: Record<string, unknown>): Promise<OperationResult<any>> {
    return this.createTrack(data);
  }

  async update(
    id: string,
    data: Record<string, unknown>,
  ): Promise<OperationResult<any>> {
    return this.updateTrack(id, data);
  }

  async delete(id: string): Promise<OperationResult<void>> {
    return this.deleteTrack(id);
  }

  async count(filter?: Record<string, unknown>): Promise<number> {
    return this.prisma.railTrack.count({ where: filter as any });
  }

  // ---------------------------------------------------------------------------
  // Rail Track
  // ---------------------------------------------------------------------------

  async findTracksByFacility(
    facilityId: string,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const where = { facilityId };
    const { skip, take, orderBy } = this.buildPagination(pagination);

    const [data, total] = await Promise.all([
      this.prisma.railTrack.findMany({
        where,
        skip,
        take,
        orderBy: orderBy ?? { trackNumber: 'asc' },
        include: { rakes: true },
      }),
      this.prisma.railTrack.count({ where }),
    ]);

    return this.buildPaginatedResult(data, total, pagination);
  }

  async createTrack(
    data: Record<string, unknown>,
  ): Promise<OperationResult<any>> {
    try {
      const track = await this.prisma.railTrack.create({ data: data as any });
      return { success: true, data: track };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return {
          success: false,
          error: `Rail track with the given unique field already exists`,
          errorCode: 'DUPLICATE_TRACK',
        };
      }
      throw error;
    }
  }

  async updateTrack(
    id: string,
    data: Record<string, unknown>,
  ): Promise<OperationResult<any>> {
    try {
      const track = await this.prisma.railTrack.update({
        where: { id },
        data: data as any,
      });
      return { success: true, data: track };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return {
          success: false,
          error: `Rail track ${id} not found`,
          errorCode: 'NOT_FOUND',
        };
      }
      throw error;
    }
  }

  async deleteTrack(id: string): Promise<OperationResult<void>> {
    try {
      await this.prisma.railTrack.delete({ where: { id } });
      return { success: true };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return {
          success: false,
          error: `Rail track ${id} not found`,
          errorCode: 'NOT_FOUND',
        };
      }
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Rake
  // ---------------------------------------------------------------------------

  async findRakeById(id: string): Promise<any | null> {
    return this.prisma.rake.findUnique({
      where: { id },
      include: { wagons: true, track: true },
    });
  }

  async createRake(
    data: Record<string, unknown>,
  ): Promise<OperationResult<any>> {
    try {
      const rake = await this.prisma.rake.create({ data: data as any });
      return { success: true, data: rake };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return {
          success: false,
          error: `Rake with the given unique field already exists`,
          errorCode: 'DUPLICATE_RAKE',
        };
      }
      throw error;
    }
  }

  async updateRake(
    id: string,
    data: Record<string, unknown>,
  ): Promise<OperationResult<any>> {
    try {
      const rake = await this.prisma.rake.update({
        where: { id },
        data: data as any,
      });
      return { success: true, data: rake };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return {
          success: false,
          error: `Rake ${id} not found`,
          errorCode: 'NOT_FOUND',
        };
      }
      throw error;
    }
  }

  async getRakesByFacility(
    facilityId: string,
    filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const where: Record<string, unknown> = { facilityId, ...filter };
    const { skip, take, orderBy } = this.buildPagination(pagination);

    const [data, total] = await Promise.all([
      this.prisma.rake.findMany({
        where,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: { wagons: true, track: true },
      }),
      this.prisma.rake.count({ where }),
    ]);

    return this.buildPaginatedResult(data, total, pagination);
  }

  // ---------------------------------------------------------------------------
  // Wagon
  // ---------------------------------------------------------------------------

  async addWagon(
    data: Record<string, unknown>,
  ): Promise<OperationResult<any>> {
    try {
      const wagon = await this.prisma.wagon.create({ data: data as any });
      return { success: true, data: wagon };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return {
          success: false,
          error: `Wagon with the given unique field already exists`,
          errorCode: 'DUPLICATE_WAGON',
        };
      }
      throw error;
    }
  }

  async updateWagon(
    id: string,
    data: Record<string, unknown>,
  ): Promise<OperationResult<any>> {
    try {
      const wagon = await this.prisma.wagon.update({
        where: { id },
        data: data as any,
      });
      return { success: true, data: wagon };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return {
          success: false,
          error: `Wagon ${id} not found`,
          errorCode: 'NOT_FOUND',
        };
      }
      throw error;
    }
  }
}
