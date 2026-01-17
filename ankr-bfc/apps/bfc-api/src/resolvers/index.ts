/**
 * GraphQL Resolvers
 *
 * Implements all query, mutation, and subscription resolvers
 */

import type { Context } from '../context.js';
import { customerResolvers } from './customer.resolver.js';
import { episodeResolvers } from './episode.resolver.js';
import { creditResolvers } from './credit.resolver.js';
import { offerResolvers } from './offer.resolver.js';

export const resolvers = {
  Query: {
    ...customerResolvers.Query,
    ...episodeResolvers.Query,
    ...creditResolvers.Query,
    ...offerResolvers.Query,
  },

  Mutation: {
    ...customerResolvers.Mutation,
    ...episodeResolvers.Mutation,
    ...creditResolvers.Mutation,
    ...offerResolvers.Mutation,
  },

  Subscription: {
    customerRiskUpdated: {
      subscribe: async function* (
        _: unknown,
        { customerId }: { customerId: string },
        context: Context
      ) {
        // TODO: Implement real-time subscription
        yield { customerId };
      },
    },
    newOfferGenerated: {
      subscribe: async function* (
        _: unknown,
        { customerId }: { customerId: string },
        context: Context
      ) {
        yield { customerId };
      },
    },
    creditDecisionMade: {
      subscribe: async function* (
        _: unknown,
        { applicationId }: { applicationId: string },
        context: Context
      ) {
        yield { applicationId };
      },
    },
  },

  // Type resolvers
  Customer: {
    episodes: async (
      parent: { id: string },
      { limit = 10 }: { limit?: number },
      context: Context
    ) => {
      return context.prisma.customerEpisode.findMany({
        where: { customerId: parent.id },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    },

    products: async (parent: { id: string }, _: unknown, context: Context) => {
      return context.prisma.customerProduct.findMany({
        where: { customerId: parent.id },
      });
    },

    offers: async (
      parent: { id: string },
      { status }: { status?: string },
      context: Context
    ) => {
      return context.prisma.customerOffer.findMany({
        where: {
          customerId: parent.id,
          ...(status && { status }),
        },
        orderBy: { createdAt: 'desc' },
      });
    },
  },
};
