/**
 * Repository interfaces — contract for all Prisma-backed data access
 */

import type { PaginatedResult, PaginationInput, OperationResult } from '../types/common';

/** Generic CRUD repository */
export interface IRepository<T, TCreate = Record<string, unknown>, TUpdate = Record<string, unknown>> {
  findById(id: string): Promise<T | null>;
  findMany(filter: Record<string, unknown>, pagination?: PaginationInput): Promise<PaginatedResult<T>>;
  create(data: TCreate): Promise<OperationResult<T>>;
  update(id: string, data: TUpdate): Promise<OperationResult<T>>;
  delete(id: string): Promise<OperationResult<void>>;
  count(filter?: Record<string, unknown>): Promise<number>;
}

/** Tenant-scoped repository with facility and tenant queries */
export interface ITenantRepository<T, TCreate = Record<string, unknown>, TUpdate = Record<string, unknown>>
  extends IRepository<T, TCreate, TUpdate> {
  findByFacility(
    facilityId: string,
    filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<T>>;

  findByTenant(
    tenantId: string,
    filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<T>>;
}
