/**
 * Offer Resolvers
 *
 * Handles offer creation, status updates, and recommendations
 */

import type { Context } from '../context.js';

interface OfferInput {
  customerId: string;
  offerType: string;
  title: string;
  description: string;
  terms?: Record<string, unknown>;
  expiresAt?: Date;
}

export const offerResolvers = {
  Query: {
    customerOffers: async (
      _: unknown,
      {
        customerId,
        status,
      }: { customerId: string; status?: string },
      context: Context
    ) => {
      return context.prisma.customerOffer.findMany({
        where: {
          customerId,
          ...(status && { status }),
        },
        orderBy: [
          { confidence: 'desc' },
          { createdAt: 'desc' },
        ],
      });
    },

    eligibleProducts: async (
      _: unknown,
      { customerId }: { customerId: string },
      context: Context
    ) => {
      const customer = await context.prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          products: true,
        },
      });

      if (!customer) {
        throw new Error(`Customer ${customerId} not found`);
      }

      // Get existing product types
      const existingTypes = new Set(
        customer.products.map((p) => p.productType)
      );

      // Determine eligible products based on customer profile
      const allProducts = [
        'SAVINGS',
        'CURRENT',
        'FD',
        'RD',
        'HOME_LOAN',
        'PERSONAL_LOAN',
        'CAR_LOAN',
        'CREDIT_CARD',
        'DEBIT_CARD',
        'MUTUAL_FUND',
        'INSURANCE',
      ];

      const eligible: string[] = [];

      for (const product of allProducts) {
        // Skip if already has this product
        if (existingTypes.has(product)) continue;

        // Check eligibility based on customer profile
        if (isEligibleForProduct(customer, product)) {
          eligible.push(product);
        }
      }

      return eligible;
    },
  },

  Mutation: {
    createOffer: async (
      _: unknown,
      { input }: { input: OfferInput },
      context: Context
    ) => {
      // Calculate confidence score based on propensity
      const confidence = await calculateOfferConfidence(
        context,
        input.customerId,
        input.offerType
      );

      return context.prisma.customerOffer.create({
        data: {
          customerId: input.customerId,
          offerType: input.offerType,
          offerCode: `OFF_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          title: input.title,
          description: input.description,
          terms: input.terms || {},
          confidence,
          status: 'GENERATED',
          validFrom: new Date(),
          expiresAt: input.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    },

    updateOfferStatus: async (
      _: unknown,
      { id, status }: { id: string; status: string },
      context: Context
    ) => {
      const updateData: Record<string, any> = { status };

      // Add timestamp based on status
      switch (status) {
        case 'SHOWN':
          updateData.shownAt = new Date();
          break;
        case 'CLICKED':
          updateData.clickedAt = new Date();
          break;
        case 'CONVERTED':
          updateData.convertedAt = new Date();
          break;
        case 'REJECTED':
          updateData.rejectedAt = new Date();
          break;
      }

      const offer = await context.prisma.customerOffer.update({
        where: { id },
        data: updateData,
      });

      // Record episode for offer interaction
      if (['CLICKED', 'CONVERTED', 'REJECTED'].includes(status)) {
        await context.prisma.customerEpisode.create({
          data: {
            customerId: offer.customerId,
            state: `offer ${offer.offerCode} for ${offer.offerType}`,
            action: `offer_${status.toLowerCase()}`,
            outcome: status === 'CONVERTED' ? 'accepted' : status.toLowerCase(),
            success: status === 'CONVERTED',
            module: 'SUPPORT',
            channel: 'DIGITAL',
            metadata: {
              offerId: offer.id,
              offerType: offer.offerType,
              confidence: offer.confidence,
            },
          },
        });
      }

      return offer;
    },
  },
};

/**
 * Check if customer is eligible for a product
 */
function isEligibleForProduct(customer: any, productType: string): boolean {
  // Basic eligibility rules
  const rules: Record<string, () => boolean> = {
    SAVINGS: () => customer.kycStatus === 'VERIFIED',
    CURRENT: () =>
      customer.kycStatus === 'VERIFIED' && customer.segment !== 'MASS',
    FD: () => customer.kycStatus === 'VERIFIED',
    RD: () => customer.kycStatus === 'VERIFIED',
    HOME_LOAN: () =>
      customer.kycStatus === 'VERIFIED' &&
      customer.riskScore < 0.6 &&
      customer.lifetimeValue > 100000,
    PERSONAL_LOAN: () =>
      customer.kycStatus === 'VERIFIED' && customer.riskScore < 0.7,
    CAR_LOAN: () =>
      customer.kycStatus === 'VERIFIED' && customer.riskScore < 0.65,
    CREDIT_CARD: () =>
      customer.kycStatus === 'VERIFIED' && customer.riskScore < 0.5,
    DEBIT_CARD: () => customer.kycStatus === 'VERIFIED',
    MUTUAL_FUND: () => customer.kycStatus === 'VERIFIED',
    INSURANCE: () => customer.kycStatus === 'VERIFIED',
  };

  const rule = rules[productType];
  return rule ? rule() : false;
}

/**
 * Calculate offer confidence score based on customer behavior
 */
async function calculateOfferConfidence(
  context: Context,
  customerId: string,
  offerType: string
): Promise<number> {
  // Get behavioral pattern for this offer type
  const pattern = await context.prisma.behavioralPattern.findFirst({
    where: {
      action: { contains: offerType.toLowerCase() },
    },
  });

  if (pattern && pattern.totalCount > 10) {
    return pattern.successRate;
  }

  // Default confidence based on offer type
  const defaultConfidence: Record<string, number> = {
    SAVINGS: 0.8,
    FD: 0.7,
    RD: 0.6,
    HOME_LOAN: 0.4,
    PERSONAL_LOAN: 0.5,
    CAR_LOAN: 0.45,
    CREDIT_CARD: 0.55,
    MUTUAL_FUND: 0.35,
    INSURANCE: 0.4,
  };

  return defaultConfidence[offerType] || 0.5;
}
