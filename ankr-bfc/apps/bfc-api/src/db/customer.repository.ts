/**
 * Customer Repository
 */

import { prisma } from './client.js';
import type { Prisma } from '@prisma/client';

export interface CustomerFilter {
  segment?: string;
  kycStatus?: string;
  riskScoreMin?: number;
  riskScoreMax?: number;
  search?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export class CustomerRepository {
  /**
   * Get customers with filters and pagination
   */
  async findMany(filter: CustomerFilter = {}, pagination: PaginationOptions = {}) {
    const { limit = 20, offset = 0 } = pagination;

    const where: Prisma.CustomerWhereInput = {};

    if (filter.segment) {
      where.segment = filter.segment;
    }

    if (filter.kycStatus) {
      where.kycStatus = filter.kycStatus;
    }

    if (filter.riskScoreMin !== undefined || filter.riskScoreMax !== undefined) {
      where.riskScore = {
        gte: filter.riskScoreMin,
        lte: filter.riskScoreMax,
      };
    }

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search } },
        { customerId: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          accounts: true,
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Get single customer by ID
   */
  async findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        accounts: true,
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        offers: {
          where: { status: 'active' },
          take: 5,
        },
        creditApplications: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Get customer by customer ID (public identifier)
   */
  async findByCustomerId(customerId: string) {
    return prisma.customer.findUnique({
      where: { customerId },
      include: {
        accounts: true,
      },
    });
  }

  /**
   * Search customers
   */
  async search(query: string, limit = 10) {
    return prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { customerId: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create customer
   */
  async create(data: Prisma.CustomerCreateInput) {
    return prisma.customer.create({
      data,
      include: {
        accounts: true,
      },
    });
  }

  /**
   * Update customer
   */
  async update(id: string, data: Prisma.CustomerUpdateInput) {
    return prisma.customer.update({
      where: { id },
      data,
      include: {
        accounts: true,
      },
    });
  }

  /**
   * Update KYC status
   */
  async updateKYCStatus(id: string, status: string, verifiedBy?: string) {
    return prisma.customer.update({
      where: { id },
      data: {
        kycStatus: status,
        kycVerifiedAt: status === 'verified' ? new Date() : null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get segment distribution
   */
  async getSegmentDistribution() {
    const result = await prisma.customer.groupBy({
      by: ['segment'],
      _count: { segment: true },
    });

    const total = result.reduce((sum, r) => sum + r._count.segment, 0);

    return result.map((r) => ({
      segment: r.segment,
      count: r._count.segment,
      percentage: Math.round((r._count.segment / total) * 100),
    }));
  }

  /**
   * Get customer stats
   */
  async getStats() {
    const [total, verified, highRisk] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { kycStatus: 'verified' } }),
      prisma.customer.count({ where: { riskScore: { gte: 70 } } }),
    ]);

    return { total, verified, highRisk };
  }
}

export const customerRepository = new CustomerRepository();
