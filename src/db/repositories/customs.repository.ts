/**
 * Customs repository — Prisma-backed data access for Bills of Entry,
 * Shipping Bills, and Customs Examinations.
 */

import { BaseRepository } from '../base.repository';
import type { ITenantRepository } from '../repository.interface';
import type { PaginationInput, PaginatedResult, OperationResult } from '../../types/common';

export class CustomsRepository
  extends BaseRepository
  implements ITenantRepository<any>
{
  // ---------------------------------------------------------------------------
  // ITenantRepository implementation
  // ---------------------------------------------------------------------------

  async findById(id: string): Promise<any | null> {
    return this.prisma.billOfEntry.findUnique({ where: { id } });
  }

  async findByFacility(
    facilityId: string,
    filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const { skip, take, orderBy } = this.buildPagination(pagination);
    const where: any = { facilityId, ...filter };

    const [data, total] = await Promise.all([
      this.prisma.billOfEntry.findMany({ where, skip, take, orderBy }),
      this.prisma.billOfEntry.count({ where }),
    ]);
    return this.buildPaginatedResult(data, total, pagination);
  }

  async findByTenant(
    tenantId: string,
    filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const { skip, take, orderBy } = this.buildPagination(pagination);
    const where: any = { tenantId, ...filter };

    const [data, total] = await Promise.all([
      this.prisma.billOfEntry.findMany({ where, skip, take, orderBy }),
      this.prisma.billOfEntry.count({ where }),
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
    return this.createBOE(data);
  }

  async update(id: string, data: any): Promise<OperationResult<any>> {
    return this.updateBOE(id, data);
  }

  async delete(id: string): Promise<OperationResult<void>> {
    try {
      await this.prisma.billOfEntry.delete({ where: { id } });
      return { success: true };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return { success: false, error: 'Bill of Entry not found', errorCode: 'NOT_FOUND' };
      }
      return { success: false, error: err.message, errorCode: 'DELETE_FAILED' };
    }
  }

  async count(filter?: Record<string, unknown>): Promise<number> {
    return this.prisma.billOfEntry.count({ where: filter as any });
  }

  // ---------------------------------------------------------------------------
  // Bill of Entry (BOE)
  // ---------------------------------------------------------------------------

  async findBOEById(id: string): Promise<any | null> {
    return this.prisma.billOfEntry.findUnique({
      where: { id },
    });
  }

  async listBOE(
    filter: { status?: string; tenantId?: string; facilityId?: string },
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const { skip, take, orderBy } = this.buildPagination(pagination);
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.tenantId) where.tenantId = filter.tenantId;
    if (filter.facilityId) where.facilityId = filter.facilityId;

    const [data, total] = await Promise.all([
      this.prisma.billOfEntry.findMany({ where, skip, take, orderBy }),
      this.prisma.billOfEntry.count({ where }),
    ]);
    return this.buildPaginatedResult(data, total, pagination);
  }

  async createBOE(data: any): Promise<OperationResult<any>> {
    try {
      const boe = await this.prisma.billOfEntry.create({ data });
      return { success: true, data: boe };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return {
          success: false,
          error: 'A Bill of Entry with the same unique fields already exists',
          errorCode: 'DUPLICATE_BOE',
        };
      }
      return { success: false, error: err.message, errorCode: 'CREATE_FAILED' };
    }
  }

  async updateBOE(id: string, data: any): Promise<OperationResult<any>> {
    try {
      const boe = await this.prisma.billOfEntry.update({
        where: { id },
        data,
      });
      return { success: true, data: boe };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return { success: false, error: 'Bill of Entry not found', errorCode: 'NOT_FOUND' };
      }
      return { success: false, error: err.message, errorCode: 'UPDATE_FAILED' };
    }
  }

  async updateBOEStatus(id: string, status: string): Promise<OperationResult<any>> {
    try {
      const boe = await this.prisma.billOfEntry.update({
        where: { id },
        data: { status },
      });
      return { success: true, data: boe };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return { success: false, error: 'Bill of Entry not found', errorCode: 'NOT_FOUND' };
      }
      return { success: false, error: err.message, errorCode: 'UPDATE_FAILED' };
    }
  }

  // ---------------------------------------------------------------------------
  // Shipping Bill (SB)
  // ---------------------------------------------------------------------------

  async findSBById(id: string): Promise<any | null> {
    return this.prisma.shippingBill.findUnique({
      where: { id },
    });
  }

  async listSB(
    filter: { status?: string; tenantId?: string; facilityId?: string },
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const { skip, take, orderBy } = this.buildPagination(pagination);
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.tenantId) where.tenantId = filter.tenantId;
    if (filter.facilityId) where.facilityId = filter.facilityId;

    const [data, total] = await Promise.all([
      this.prisma.shippingBill.findMany({ where, skip, take, orderBy }),
      this.prisma.shippingBill.count({ where }),
    ]);
    return this.buildPaginatedResult(data, total, pagination);
  }

  async createSB(data: any): Promise<OperationResult<any>> {
    try {
      const sb = await this.prisma.shippingBill.create({ data });
      return { success: true, data: sb };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return {
          success: false,
          error: 'A Shipping Bill with the same unique fields already exists',
          errorCode: 'DUPLICATE_SB',
        };
      }
      return { success: false, error: err.message, errorCode: 'CREATE_FAILED' };
    }
  }

  async updateSBStatus(id: string, status: string): Promise<OperationResult<any>> {
    try {
      const sb = await this.prisma.shippingBill.update({
        where: { id },
        data: { status },
      });
      return { success: true, data: sb };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return { success: false, error: 'Shipping Bill not found', errorCode: 'NOT_FOUND' };
      }
      return { success: false, error: err.message, errorCode: 'UPDATE_FAILED' };
    }
  }

  // ---------------------------------------------------------------------------
  // Customs Examination
  // ---------------------------------------------------------------------------

  async createExamination(data: any): Promise<OperationResult<any>> {
    try {
      const exam = await this.prisma.customsExamination.create({ data });
      return { success: true, data: exam };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return {
          success: false,
          error: 'A customs examination with the same unique fields already exists',
          errorCode: 'DUPLICATE_EXAMINATION',
        };
      }
      return { success: false, error: err.message, errorCode: 'CREATE_FAILED' };
    }
  }

  async updateExamination(id: string, data: any): Promise<OperationResult<any>> {
    try {
      const exam = await this.prisma.customsExamination.update({
        where: { id },
        data,
      });
      return { success: true, data: exam };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return { success: false, error: 'Customs examination not found', errorCode: 'NOT_FOUND' };
      }
      return { success: false, error: err.message, errorCode: 'UPDATE_FAILED' };
    }
  }
}
