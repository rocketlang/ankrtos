/**
 * Gate Repository — Prisma-backed data access for gates and gate transactions
 */

import { BaseRepository } from '../base.repository';
import type { ITenantRepository } from '../repository.interface';
import type { PaginationInput, PaginatedResult, OperationResult } from '../../types/common';

export class GateRepository
  extends BaseRepository
  implements ITenantRepository<any>
{
  // ---------------------------------------------------------------------------
  // Gate Queries
  // ---------------------------------------------------------------------------

  async findById(id: string): Promise<any | null> {
    return this.prisma.gate.findUnique({
      where: { id },
      include: { lanes: true },
    });
  }

  async findByFacility(
    facilityId: string,
    filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const where: Record<string, unknown> = { facilityId, ...filter };
    const { skip, take, orderBy } = this.buildPagination(pagination);

    const [data, total] = await Promise.all([
      this.prisma.gate.findMany({
        where,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: { lanes: true },
      }),
      this.prisma.gate.count({ where }),
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
      this.prisma.gate.findMany({
        where,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: { lanes: true },
      }),
      this.prisma.gate.count({ where }),
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
  // Gate Mutations
  // ---------------------------------------------------------------------------

  async create(data: Record<string, unknown>): Promise<OperationResult<any>> {
    try {
      const gate = await this.prisma.gate.create({ data: data as any });
      return { success: true, data: gate };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return {
          success: false,
          error: `Gate with the given unique field already exists`,
          errorCode: 'DUPLICATE_GATE',
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
      const gate = await this.prisma.gate.update({
        where: { id },
        data: data as any,
      });
      return { success: true, data: gate };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return {
          success: false,
          error: `Gate ${id} not found`,
          errorCode: 'NOT_FOUND',
        };
      }
      throw error;
    }
  }

  async delete(id: string): Promise<OperationResult<void>> {
    try {
      await this.prisma.gate.delete({ where: { id } });
      return { success: true };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return {
          success: false,
          error: `Gate ${id} not found`,
          errorCode: 'NOT_FOUND',
        };
      }
      throw error;
    }
  }

  async count(filter?: Record<string, unknown>): Promise<number> {
    return this.prisma.gate.count({ where: filter as any });
  }

  // ---------------------------------------------------------------------------
  // Gate Transaction — Create / Update / Read
  // ---------------------------------------------------------------------------

  async createTransaction(
    data: Record<string, unknown>,
  ): Promise<OperationResult<any>> {
    try {
      const transaction = await this.prisma.gateTransaction.create({
        data: data as any,
      });
      return { success: true, data: transaction };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return {
          success: false,
          error: `Gate transaction with the given unique field already exists`,
          errorCode: 'DUPLICATE_TRANSACTION',
        };
      }
      throw error;
    }
  }

  async updateTransaction(
    id: string,
    data: Record<string, unknown>,
  ): Promise<OperationResult<any>> {
    try {
      const transaction = await this.prisma.gateTransaction.update({
        where: { id },
        data: data as any,
      });
      return { success: true, data: transaction };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return {
          success: false,
          error: `Gate transaction ${id} not found`,
          errorCode: 'NOT_FOUND',
        };
      }
      throw error;
    }
  }

  async getTransaction(id: string): Promise<any | null> {
    return this.prisma.gateTransaction.findUnique({
      where: { id },
      include: { gate: true },
    });
  }

  async getActiveTransactions(facilityId: string): Promise<any[]> {
    return this.prisma.gateTransaction.findMany({
      where: {
        facilityId,
        status: { in: ['in_progress', 'pending'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransactionsByFacility(
    facilityId: string,
    filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const where: Record<string, unknown> = { facilityId, ...filter };
    const { skip, take, orderBy } = this.buildPagination(pagination);

    const [data, total] = await Promise.all([
      this.prisma.gateTransaction.findMany({
        where,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: { gate: true },
      }),
      this.prisma.gateTransaction.count({ where }),
    ]);

    return this.buildPaginatedResult(data, total, pagination);
  }
}
