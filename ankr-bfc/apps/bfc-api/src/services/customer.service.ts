/**
 * Customer Service
 * Customer 360 operations with EON integration
 */

import type { PrismaClient } from '@prisma/client';
import { getBfcEonClient, getBfcCache, dataMasker } from '@bfc/core';

export class CustomerService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get customer by ID with caching
   */
  async getById(id: string, maskPii = true) {
    const cache = getBfcCache();

    // Try cache first
    const cached = await cache.getCustomer(id);
    if (cached) {
      return maskPii ? this.maskCustomerPii(cached) : cached;
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        products: true,
        episodes: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        offers: {
          where: { status: 'ACTIVE' },
          take: 5,
        },
        consents: {
          where: { isActive: true },
        },
      },
    });

    if (customer) {
      await cache.setCustomer(id, customer);
    }

    return customer && maskPii ? this.maskCustomerPii(customer) : customer;
  }

  /**
   * Search customers
   */
  async search(query: {
    phone?: string;
    pan?: string;
    email?: string;
    name?: string;
    segment?: string;
    limit?: number;
  }) {
    const { phone, pan, email, name, segment, limit = 20 } = query;

    const where: any = {};

    if (phone) where.phone = phone;
    if (pan) where.pan = pan;
    if (email) where.email = { contains: email, mode: 'insensitive' };
    if (name) {
      where.OR = [
        { firstName: { contains: name, mode: 'insensitive' } },
        { lastName: { contains: name, mode: 'insensitive' } },
      ];
    }
    if (segment) where.segment = segment;

    const customers = await this.prisma.customer.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    return customers.map((c) => this.maskCustomerPii(c));
  }

  /**
   * Get Customer 360 view
   */
  async getCustomer360(customerId: string) {
    const customer = await this.getById(customerId, false);
    if (!customer) return null;

    const eon = getBfcEonClient();

    // Get episode history from EON
    const episodes = await eon.getCustomerHistory(customerId, { limit: 50 });

    // Calculate metrics
    const metrics = this.calculateMetrics(customer, episodes);

    // Get pattern success rates
    const loanSuccessRate = await eon.getPatternSuccessRate({
      context: `segment:${customer.segment}`,
      action: 'loan_application',
      module: 'LOAN',
    });

    return {
      customer: this.maskCustomerPii(customer),
      metrics,
      episodes: episodes.slice(0, 20),
      patterns: {
        loanSuccessRate: loanSuccessRate.successRate,
        loanConfidence: loanSuccessRate.confidence,
      },
      products: customer.products,
      activeOffers: customer.offers,
      consents: customer.consents,
    };
  }

  /**
   * Create customer
   */
  async create(data: {
    externalId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    pan?: string;
    dateOfBirth?: Date;
    branchCode?: string;
  }) {
    const customer = await this.prisma.customer.create({
      data: {
        ...data,
        kycStatus: 'PENDING',
        riskScore: 0.5,
        trustScore: 0.5,
      },
    });

    // Record episode
    const eon = getBfcEonClient();
    await eon.recordEpisode({
      customerId: customer.id,
      state: 'new_customer',
      action: 'onboarded',
      outcome: 'account_created',
      success: true,
      module: 'ONBOARDING',
      channel: 'DIGITAL',
    });

    return customer;
  }

  /**
   * Update customer
   */
  async update(id: string, data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    segment: string;
    kycStatus: string;
  }>) {
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    const cache = getBfcCache();
    await cache.invalidateCustomer(id);

    return customer;
  }

  /**
   * Update risk score
   */
  async updateRiskScore(customerId: string, riskScore: number, factors: string[]) {
    const customer = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        riskScore,
        updatedAt: new Date(),
      },
    });

    // Record episode
    const eon = getBfcEonClient();
    await eon.recordEpisode({
      customerId,
      state: `previous_score:${customer.riskScore}`,
      action: 'risk_score_updated',
      outcome: `new_score:${riskScore}`,
      success: true,
      module: 'COMPLIANCE',
      channel: 'SYSTEM',
      riskImpact: riskScore - customer.riskScore,
      metadata: { factors },
    });

    // Invalidate cache
    const cache = getBfcCache();
    await cache.invalidateCustomer(customerId);

    return customer;
  }

  /**
   * Calculate customer metrics
   */
  private calculateMetrics(customer: any, episodes: any[]) {
    const successfulEpisodes = episodes.filter((e) => e.success);
    const recentEpisodes = episodes.filter(
      (e) => new Date(e.timestamp || Date.now()) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    );

    return {
      totalEpisodes: episodes.length,
      successRate: episodes.length > 0 ? successfulEpisodes.length / episodes.length : 0,
      recentActivity: recentEpisodes.length,
      riskScore: customer.riskScore,
      trustScore: customer.trustScore,
      ltv: customer.ltv || 0,
      tenure: this.calculateTenure(customer.createdAt),
      productCount: customer.products?.length || 0,
    };
  }

  /**
   * Calculate tenure in months
   */
  private calculateTenure(createdAt: Date): number {
    const now = new Date();
    const created = new Date(createdAt);
    const months = (now.getFullYear() - created.getFullYear()) * 12 +
      (now.getMonth() - created.getMonth());
    return Math.max(0, months);
  }

  /**
   * Mask PII fields
   */
  private maskCustomerPii(customer: any) {
    if (!customer) return customer;

    return {
      ...customer,
      pan: customer.pan ? dataMasker.maskPan(customer.pan) : null,
      aadhaar: customer.aadhaar ? dataMasker.maskAadhaar(customer.aadhaar) : null,
      phone: dataMasker.maskPhone(customer.phone),
      email: customer.email ? dataMasker.maskEmail(customer.email) : null,
    };
  }
}
