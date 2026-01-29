/**
 * Billing repository — Prisma-backed data access for customers, tariffs,
 * invoices, and payments.
 */

import { BaseRepository } from '../base.repository';
import type { ITenantRepository } from '../repository.interface';
import type { PaginationInput, PaginatedResult, OperationResult } from '../../types/common';

export class BillingRepository
  extends BaseRepository
  implements ITenantRepository<any>
{
  // ---------------------------------------------------------------------------
  // ITenantRepository implementation
  // ---------------------------------------------------------------------------

  async findById(id: string): Promise<any | null> {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  async findByFacility(
    facilityId: string,
    filter?: Record<string, unknown>,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const { skip, take, orderBy } = this.buildPagination(pagination);
    const where: any = { facilityId, ...filter };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({ where, skip, take, orderBy }),
      this.prisma.customer.count({ where }),
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
      this.prisma.customer.findMany({ where, skip, take, orderBy }),
      this.prisma.customer.count({ where }),
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
    return this.createCustomer(data);
  }

  async update(id: string, data: any): Promise<OperationResult<any>> {
    return this.updateCustomer(id, data);
  }

  async delete(id: string): Promise<OperationResult<void>> {
    try {
      await this.prisma.customer.delete({ where: { id } });
      return { success: true };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return { success: false, error: 'Customer not found', errorCode: 'NOT_FOUND' };
      }
      return { success: false, error: err.message, errorCode: 'DELETE_FAILED' };
    }
  }

  async count(filter?: Record<string, unknown>): Promise<number> {
    return this.prisma.customer.count({ where: filter as any });
  }

  // ---------------------------------------------------------------------------
  // Customer-specific
  // ---------------------------------------------------------------------------

  async findCustomerById(id: string): Promise<any | null> {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findCustomerByCode(tenantId: string, code: string): Promise<any | null> {
    return this.prisma.customer.findFirst({
      where: { tenantId, code },
    });
  }

  async createCustomer(data: any): Promise<OperationResult<any>> {
    try {
      const customer = await this.prisma.customer.create({ data });
      return { success: true, data: customer };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return {
          success: false,
          error: 'A customer with the same unique fields already exists',
          errorCode: 'DUPLICATE_CUSTOMER',
        };
      }
      return { success: false, error: err.message, errorCode: 'CREATE_FAILED' };
    }
  }

  async updateCustomer(id: string, data: any): Promise<OperationResult<any>> {
    try {
      const customer = await this.prisma.customer.update({
        where: { id },
        data,
      });
      return { success: true, data: customer };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return { success: false, error: 'Customer not found', errorCode: 'NOT_FOUND' };
      }
      return { success: false, error: err.message, errorCode: 'UPDATE_FAILED' };
    }
  }

  // ---------------------------------------------------------------------------
  // Tariffs
  // ---------------------------------------------------------------------------

  async createTariff(data: any): Promise<OperationResult<any>> {
    try {
      const tariff = await this.prisma.tariff.create({ data });
      return { success: true, data: tariff };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return {
          success: false,
          error: 'A tariff with the same unique fields already exists',
          errorCode: 'DUPLICATE_TARIFF',
        };
      }
      return { success: false, error: err.message, errorCode: 'CREATE_FAILED' };
    }
  }

  async getTariff(id: string): Promise<any | null> {
    return this.prisma.tariff.findUnique({ where: { id } });
  }

  async listTariffs(
    tenantId: string,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const { skip, take, orderBy } = this.buildPagination(pagination);
    const where: any = { tenantId };

    const [data, total] = await Promise.all([
      this.prisma.tariff.findMany({ where, skip, take, orderBy }),
      this.prisma.tariff.count({ where }),
    ]);
    return this.buildPaginatedResult(data, total, pagination);
  }

  // ---------------------------------------------------------------------------
  // Invoices
  // ---------------------------------------------------------------------------

  async createInvoice(data: any): Promise<OperationResult<any>> {
    try {
      const invoice = await this.prisma.invoice.create({
        data,
        include: { payments: true },
      });
      return { success: true, data: invoice };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return {
          success: false,
          error: 'An invoice with the same unique fields already exists',
          errorCode: 'DUPLICATE_INVOICE',
        };
      }
      return { success: false, error: err.message, errorCode: 'CREATE_FAILED' };
    }
  }

  async getInvoice(id: string): Promise<any | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });
  }

  async listInvoices(
    filter: { customerId?: string; status?: string; tenantId?: string },
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<any>> {
    const { skip, take, orderBy } = this.buildPagination(pagination);
    const where: any = {};
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.status) where.status = filter.status;
    if (filter.tenantId) where.tenantId = filter.tenantId;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({ where, skip, take, orderBy }),
      this.prisma.invoice.count({ where }),
    ]);
    return this.buildPaginatedResult(data, total, pagination);
  }

  // ---------------------------------------------------------------------------
  // Payments
  // ---------------------------------------------------------------------------

  async recordPayment(data: any): Promise<OperationResult<any>> {
    try {
      const payment = await this.prisma.payment.create({ data });
      return { success: true, data: payment };
    } catch (err: any) {
      return { success: false, error: err.message, errorCode: 'CREATE_FAILED' };
    }
  }

  // ---------------------------------------------------------------------------
  // Outstanding calculation
  // ---------------------------------------------------------------------------

  async getCustomerOutstanding(customerId: string): Promise<OperationResult<{ outstanding: number }>> {
    try {
      const invoiceAgg = await this.prisma.invoice.aggregate({
        where: {
          customerId,
          status: { in: ['issued', 'overdue'] },
        },
        _sum: { totalAmount: true },
      });

      const paymentAgg = await this.prisma.payment.aggregate({
        where: {
          invoice: {
            customerId,
            status: { in: ['issued', 'overdue'] },
          },
          status: 'confirmed',
        },
        _sum: { amount: true },
      });

      const totalInvoiced = Number(invoiceAgg._sum.totalAmount ?? 0);
      const totalPaid = Number(paymentAgg._sum.amount ?? 0);
      const outstanding = totalInvoiced - totalPaid;

      return { success: true, data: { outstanding } };
    } catch (err: any) {
      return { success: false, error: err.message, errorCode: 'AGGREGATE_FAILED' };
    }
  }
}
