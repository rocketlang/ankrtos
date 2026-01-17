/**
 * Customer Resolvers
 *
 * Handles customer CRUD and Customer 360 queries
 */

import type { Context } from '../context.js';

interface CustomerInput {
  externalId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  pan?: string;
  dateOfBirth?: Date;
  gender?: string;
}

interface PaginationInput {
  page?: number;
  limit?: number;
  cursor?: string;
}

export const customerResolvers = {
  Query: {
    customer: async (
      _: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      return context.prisma.customer.findUnique({
        where: { id },
      });
    },

    customerByPhone: async (
      _: unknown,
      { phone }: { phone: string },
      context: Context
    ) => {
      return context.prisma.customer.findFirst({
        where: { phone },
      });
    },

    customerByPan: async (
      _: unknown,
      { pan }: { pan: string },
      context: Context
    ) => {
      return context.prisma.customer.findFirst({
        where: { pan },
      });
    },

    customers: async (
      _: unknown,
      {
        pagination = {},
        segment,
      }: { pagination?: PaginationInput; segment?: string },
      context: Context
    ) => {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const where = segment ? { segment } : {};

      const [items, total] = await Promise.all([
        context.prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        context.prisma.customer.count({ where }),
      ]);

      return {
        items,
        total,
        hasMore: skip + items.length < total,
        nextCursor: items.length === limit ? items[items.length - 1].id : null,
      };
    },

    customer360: async (
      _: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      const customer = await context.prisma.customer.findUnique({
        where: { id },
        include: {
          products: true,
          offers: {
            where: {
              status: { in: ['GENERATED', 'QUEUED', 'SHOWN'] },
            },
            take: 5,
          },
          lifeEvents: {
            take: 5,
            orderBy: { detectedAt: 'desc' },
          },
        },
      });

      if (!customer) {
        throw new Error(`Customer ${id} not found`);
      }

      // Get recent episodes
      const recentEpisodes = await context.prisma.customerEpisode.findMany({
        where: { customerId: id },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      // Calculate product summary
      const productSummary = {
        savingsCount: customer.products.filter(
          (p: any) => ['SAVINGS', 'CURRENT', 'SALARY'].includes(p.productType)
        ).length,
        loanCount: customer.products.filter((p: any) =>
          p.productType.includes('LOAN')
        ).length,
        cardCount: customer.products.filter((p: any) =>
          p.productType.includes('CARD')
        ).length,
        investmentCount: customer.products.filter((p: any) =>
          ['MUTUAL_FUND', 'DEMAT', 'FD', 'RD'].includes(p.productType)
        ).length,
        totalBalance: customer.products.reduce(
          (sum: number, p: any) => sum + Number(p.balance || 0),
          0
        ),
        totalOutstanding: customer.products.reduce(
          (sum: number, p: any) => sum + Number(p.outstandingAmount || 0),
          0
        ),
      };

      // Get Next Best Actions from NBA table
      const nba = await context.prisma.nextBestAction.findUnique({
        where: { customerId: id },
      });

      const nextBestActions = nba?.recommendations
        ? JSON.parse(nba.recommendations as string)
        : [];

      // Churn analysis
      const churnAnalysis = customer.churnRiskLevel
        ? {
            probability: customer.churnProbability,
            riskLevel: customer.churnRiskLevel,
            factors: [], // TODO: Store and retrieve factors
            lastCalculatedAt: customer.lastChurnScoreAt,
          }
        : null;

      return {
        customer,
        productSummary,
        recentEpisodes,
        activeOffers: customer.offers,
        nextBestActions,
        lifeEvents: customer.lifeEvents.map((e: any) => ({
          eventType: e.eventType,
          confidence: e.confidence,
          detectedAt: e.detectedAt,
          isConfirmed: e.isConfirmed,
        })),
        churnAnalysis,
      };
    },

    segmentAnalytics: async (
      _: unknown,
      { segment }: { segment: string },
      context: Context
    ) => {
      const customers = await context.prisma.customer.findMany({
        where: { segment },
        select: {
          riskScore: true,
          lifetimeValue: true,
          churnProbability: true,
          products: {
            select: { productType: true },
          },
        },
      });

      const count = customers.length;
      if (count === 0) {
        return {
          segment,
          customerCount: 0,
          avgRiskScore: 0,
          avgLifetimeValue: 0,
          churnRate: 0,
          topProducts: [],
        };
      }

      // Calculate averages
      const avgRiskScore =
        customers.reduce((sum, c) => sum + c.riskScore, 0) / count;
      const avgLifetimeValue =
        customers.reduce((sum, c) => sum + c.lifetimeValue, 0) / count;
      const churnRate =
        customers.filter((c) => c.churnProbability > 0.5).length / count;

      // Get top products
      const productCounts = new Map<string, number>();
      customers.forEach((c) => {
        c.products.forEach((p) => {
          productCounts.set(
            p.productType,
            (productCounts.get(p.productType) || 0) + 1
          );
        });
      });

      const topProducts = Array.from(productCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type]) => type);

      return {
        segment,
        customerCount: count,
        avgRiskScore,
        avgLifetimeValue,
        churnRate,
        topProducts,
      };
    },
  },

  Mutation: {
    createCustomer: async (
      _: unknown,
      { input }: { input: CustomerInput },
      context: Context
    ) => {
      return context.prisma.customer.create({
        data: {
          ...input,
          displayName: `${input.firstName} ${input.lastName}`,
          kycStatus: 'PENDING',
          riskScore: 0.5,
          trustScore: 0.5,
          lifetimeValue: 0,
          status: 'PROSPECT',
          churnProbability: 0,
          preferredLanguage: 'en',
          dndEnabled: false,
        },
      });
    },

    updateCustomer: async (
      _: unknown,
      { id, input }: { id: string; input: Partial<CustomerInput> },
      context: Context
    ) => {
      return context.prisma.customer.update({
        where: { id },
        data: input,
      });
    },
  },
};
