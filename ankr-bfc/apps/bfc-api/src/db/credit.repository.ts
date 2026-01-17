/**
 * Credit Application Repository
 */

import { prisma } from './client.js';
import type { Prisma } from '@prisma/client';

export interface CreditApplicationFilter {
  status?: string;
  type?: string;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class CreditRepository {
  /**
   * Get credit applications with filters
   */
  async findMany(filter: CreditApplicationFilter = {}, pagination = { limit: 20, offset: 0 }) {
    const { limit, offset } = pagination;

    const where: Prisma.CreditApplicationWhereInput = {};

    if (filter.status) where.status = filter.status;
    if (filter.type) where.type = filter.type;
    if (filter.customerId) where.customerId = filter.customerId;

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {
        gte: filter.dateFrom,
        lte: filter.dateTo,
      };
    }

    const [items, total] = await Promise.all([
      prisma.creditApplication.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, segment: true, email: true },
          },
        },
      }),
      prisma.creditApplication.count({ where }),
    ]);

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Get single application
   */
  async findById(id: string) {
    return prisma.creditApplication.findUnique({
      where: { id },
      include: {
        customer: true,
        documents: true,
        timeline: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  }

  /**
   * Create application
   */
  async create(data: Prisma.CreditApplicationCreateInput) {
    return prisma.creditApplication.create({
      data,
      include: {
        customer: {
          select: { id: true, name: true, segment: true },
        },
      },
    });
  }

  /**
   * Update application status
   */
  async updateStatus(id: string, status: string, notes?: string, actorId?: string) {
    // Create timeline entry and update status in transaction
    return prisma.$transaction(async (tx) => {
      await tx.applicationTimeline.create({
        data: {
          applicationId: id,
          action: `Status changed to ${status}`,
          actor: actorId || 'system',
          notes,
          timestamp: new Date(),
        },
      });

      return tx.creditApplication.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          customer: {
            select: { id: true, name: true },
          },
        },
      });
    });
  }

  /**
   * Approve application
   */
  async approve(id: string, approvedAmount: number, notes?: string, actorId?: string) {
    return prisma.$transaction(async (tx) => {
      await tx.applicationTimeline.create({
        data: {
          applicationId: id,
          action: 'Application approved',
          actor: actorId || 'system',
          notes: notes || `Approved amount: ₹${approvedAmount.toLocaleString('en-IN')}`,
          timestamp: new Date(),
        },
      });

      return tx.creditApplication.update({
        where: { id },
        data: {
          status: 'approved',
          decision: 'approved',
          approvedAmount,
          updatedAt: new Date(),
        },
        include: {
          customer: true,
        },
      });
    });
  }

  /**
   * Reject application
   */
  async reject(id: string, reason: string, notes?: string, actorId?: string) {
    return prisma.$transaction(async (tx) => {
      await tx.applicationTimeline.create({
        data: {
          applicationId: id,
          action: 'Application rejected',
          actor: actorId || 'system',
          notes: `Reason: ${reason}. ${notes || ''}`,
          timestamp: new Date(),
        },
      });

      return tx.creditApplication.update({
        where: { id },
        data: {
          status: 'rejected',
          decision: 'rejected',
          rejectionReason: reason,
          updatedAt: new Date(),
        },
      });
    });
  }

  /**
   * Get application trends
   */
  async getTrends(period: 'week' | 'month' | 'quarter') {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const applications = await prisma.creditApplication.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true, decision: true },
    });

    // Group by date
    const grouped = new Map<string, { applications: number; approvals: number; rejections: number }>();

    applications.forEach((app) => {
      const date = app.createdAt.toISOString().split('T')[0];
      const current = grouped.get(date) || { applications: 0, approvals: 0, rejections: 0 };
      current.applications++;
      if (app.decision === 'approved') current.approvals++;
      if (app.decision === 'rejected') current.rejections++;
      grouped.set(date, current);
    });

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  /**
   * Get stats
   */
  async getStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      prisma.creditApplication.count(),
      prisma.creditApplication.count({ where: { status: 'pending' } }),
      prisma.creditApplication.count({ where: { decision: 'approved' } }),
      prisma.creditApplication.count({ where: { decision: 'rejected' } }),
    ]);

    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return { total, pending, approved, rejected, approvalRate };
  }
}

export const creditRepository = new CreditRepository();
