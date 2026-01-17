/**
 * Offer Service
 * Personalized offer recommendations with AI
 */

import type { PrismaClient } from '@prisma/client';
import { getBfcEonClient, getBfcAiClient, getBfcCache } from '@bfc/core';

export interface OfferRecommendation {
  offerType: string;
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  eligibility: {
    eligible: boolean;
    criteria: string[];
  };
}

export class OfferService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get personalized offers for customer
   */
  async getRecommendations(customerId: string): Promise<OfferRecommendation[]> {
    const cache = getBfcCache();

    // Check cache
    const cached = await cache.getOffers<OfferRecommendation>(customerId);
    if (cached) {
      return cached;
    }

    // Get customer data
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        products: true,
        episodes: {
          take: 30,
          orderBy: { createdAt: 'desc' },
        },
        offers: {
          where: {
            status: { in: ['SHOWN', 'CLICKED', 'CONVERTED'] },
          },
          take: 20,
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Determine eligible products
    const eligibleProducts = await this.determineEligibility(customer);

    // Get customer context from EON
    const eon = getBfcEonClient();
    const recentEpisodes = await eon.getCustomerHistory(customerId, { limit: 20 });

    // Detect life events
    const ai = getBfcAiClient();
    const lifeEvents = await this.detectLifeEvents(customer, recentEpisodes);

    // Get AI recommendations
    const recommendations = await ai.recommendOffers({
      customerId,
      customerContext: this.buildContext(customer),
      eligibleProducts,
      recentInteractions: recentEpisodes.map((e) => `${e.action}: ${e.outcome}`),
      lifeEvents,
    });

    // Enrich with eligibility details
    const enrichedOffers = recommendations.map((rec) => ({
      ...rec,
      eligibility: {
        eligible: eligibleProducts.includes(rec.offerType),
        criteria: this.getEligibilityCriteria(rec.offerType, customer),
      },
    }));

    // Cache results
    await cache.setOffers(customerId, enrichedOffers);

    return enrichedOffers;
  }

  /**
   * Create offer for customer
   */
  async createOffer(data: {
    customerId: string;
    offerType: string;
    title: string;
    description: string;
    confidence: number;
    expiresAt?: Date;
    metadata?: Record<string, unknown>;
  }) {
    const offer = await this.prisma.customerOffer.create({
      data: {
        ...data,
        status: 'ACTIVE',
      },
    });

    // Record episode
    const eon = getBfcEonClient();
    await eon.recordEpisode({
      customerId: data.customerId,
      state: `offer_created`,
      action: `${data.offerType}_offer_generated`,
      outcome: `confidence:${data.confidence.toFixed(2)}`,
      success: true,
      module: 'SUPPORT',
      channel: 'SYSTEM',
      metadata: { offerId: offer.id },
    });

    // Invalidate cache
    const cache = getBfcCache();
    await cache.invalidateCustomer(data.customerId);

    return offer;
  }

  /**
   * Update offer status
   */
  async updateOfferStatus(offerId: string, status: 'SHOWN' | 'CLICKED' | 'CONVERTED' | 'EXPIRED' | 'DISMISSED') {
    const offer = await this.prisma.customerOffer.update({
      where: { id: offerId },
      data: { status },
    });

    // Record episode
    const eon = getBfcEonClient();
    await eon.recordEpisode({
      customerId: offer.customerId,
      state: `offer_${offer.offerType}`,
      action: `offer_${status.toLowerCase()}`,
      outcome: status === 'CONVERTED' ? 'success' : status.toLowerCase(),
      success: status === 'CONVERTED',
      module: 'SUPPORT',
      channel: 'DIGITAL',
      trustImpact: status === 'CONVERTED' ? 0.05 : 0,
      metadata: { offerId },
    });

    // Invalidate cache
    const cache = getBfcCache();
    await cache.invalidateCustomer(offer.customerId);

    return offer;
  }

  /**
   * Get active offers for customer
   */
  async getActiveOffers(customerId: string) {
    return this.prisma.customerOffer.findMany({
      where: {
        customerId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { confidence: 'desc' },
    });
  }

  /**
   * Determine product eligibility
   */
  private async determineEligibility(customer: any): Promise<string[]> {
    const eligible: string[] = [];
    const existingProducts = customer.products?.map((p: any) => p.productType) || [];

    // Basic eligibility rules
    if (!existingProducts.includes('CREDIT_CARD') && customer.riskScore < 0.6) {
      eligible.push('CREDIT_CARD');
    }

    if (!existingProducts.includes('HOME_LOAN') && customer.trustScore > 0.6) {
      eligible.push('HOME_LOAN');
    }

    if (!existingProducts.includes('PERSONAL_LOAN') && customer.riskScore < 0.5) {
      eligible.push('PERSONAL_LOAN');
    }

    if (!existingProducts.includes('FD')) {
      eligible.push('FD');
    }

    if (!existingProducts.includes('INSURANCE') && customer.trustScore > 0.5) {
      eligible.push('INSURANCE');
    }

    if (!existingProducts.includes('MUTUAL_FUND') && customer.trustScore > 0.5) {
      eligible.push('MUTUAL_FUND');
    }

    return eligible;
  }

  /**
   * Detect life events from recent activity
   */
  private async detectLifeEvents(customer: any, episodes: any[]): Promise<string[]> {
    const ai = getBfcAiClient();

    // Get recent transactions (simplified - would come from CBS)
    const recentTransactions = episodes
      .filter((e) => e.module === 'PAYMENT')
      .map((e) => ({
        category: e.action,
        amount: e.metadata?.amount || 0,
        merchant: e.metadata?.merchant,
      }));

    if (recentTransactions.length === 0) {
      return [];
    }

    const events = await ai.detectLifeEvents({
      customerId: customer.id,
      recentTransactions,
    });

    return events
      .filter((e) => e.confidence > 0.7)
      .map((e) => e.eventType);
  }

  /**
   * Build customer context string
   */
  private buildContext(customer: any): string {
    return `
Segment: ${customer.segment || 'Unknown'}
Risk Score: ${customer.riskScore}
Trust Score: ${customer.trustScore}
Products: ${customer.products?.map((p: any) => p.productType).join(', ') || 'None'}
Recent Offer Conversions: ${customer.offers?.filter((o: any) => o.status === 'CONVERTED').length || 0}
`;
  }

  /**
   * Get eligibility criteria for offer type
   */
  private getEligibilityCriteria(offerType: string, customer: any): string[] {
    const criteria: string[] = [];

    switch (offerType) {
      case 'CREDIT_CARD':
        criteria.push('Risk score < 60%');
        criteria.push('KYC verified');
        break;
      case 'HOME_LOAN':
        criteria.push('Trust score > 60%');
        criteria.push('Minimum income: ₹5L/year');
        break;
      case 'PERSONAL_LOAN':
        criteria.push('Risk score < 50%');
        criteria.push('Minimum 6 months relationship');
        break;
      case 'FD':
        criteria.push('Active savings account');
        break;
      case 'INSURANCE':
      case 'MUTUAL_FUND':
        criteria.push('Trust score > 50%');
        criteria.push('KYC verified');
        break;
    }

    return criteria;
  }
}
