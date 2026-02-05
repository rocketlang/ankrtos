/**
 * Subscription GraphQL Schema
 * Phase 6: Monetization & Pricing
 */

import { builder } from '../builder.js';
import { subscriptionService, PRICING_TIERS } from '../../services/subscription-service.js';
import { FeatureGate } from '../../middleware/feature-gate.js';

// ========================================
// ENUMS (Exported for reuse in pricing.ts)
// ========================================

export const SubscriptionTierEnum = builder.enumType('SubscriptionTier', {
  values: ['FREE', 'PRO', 'AGENCY', 'ENTERPRISE'] as const,
});

export const SubscriptionStatusEnum = builder.enumType('SubscriptionStatus', {
  values: ['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'INCOMPLETE'] as const,
});

// ========================================
// OBJECT TYPES
// ========================================

const UserSubscription = builder.prismaObject('Subscription', {
  name: 'UserSubscription', // Rename GraphQL type to avoid conflict with root Subscription type
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId'),
    tier: t.expose('tier', { type: SubscriptionTierEnum }),
    status: t.expose('status', { type: SubscriptionStatusEnum }),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    interval: t.exposeString('interval'),
    currentPeriodStart: t.expose('currentPeriodStart', { type: 'DateTime' }),
    currentPeriodEnd: t.expose('currentPeriodEnd', { type: 'DateTime' }),
    cancelAtPeriodEnd: t.exposeBoolean('cancelAtPeriodEnd'),
    trialEnd: t.expose('trialEnd', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

const SubscriptionTierInfo = builder.objectRef<{
  tier: string;
  name: string;
  price: number;
  interval: string;
  features: any;
}>('SubscriptionTierInfo').implement({
  fields: (t) => ({
    tier: t.exposeString('tier'),
    name: t.exposeString('name'),
    price: t.exposeFloat('price'),
    interval: t.exposeString('interval'),
    features: t.field({ type: 'JSON', resolve: (parent) => parent.features }),
  }),
});

const SubscriptionUsageStats = builder.objectRef<{
  tier: string;
  vesselsTracked: number;
  vesselLimit: number;
  pdasGenerated: number;
  apiCalls: number;
  limitReached: boolean;
}>('SubscriptionUsageStats').implement({
  fields: (t) => ({
    tier: t.exposeString('tier'),
    vesselsTracked: t.exposeInt('vesselsTracked'),
    vesselLimit: t.exposeInt('vesselLimit'),
    pdasGenerated: t.exposeInt('pdasGenerated'),
    apiCalls: t.exposeInt('apiCalls'),
    limitReached: t.exposeBoolean('limitReached'),
  }),
});

// ========================================
// QUERIES & MUTATIONS
// ========================================

builder.queryFields((t) => ({
  mySubscription: t.prismaField({
    type: 'Subscription',
    name: 'UserSubscription', // Use renamed GraphQL type
    nullable: true,
    resolve: async (query, root, args, ctx) => {
      if (!ctx.userId) throw new Error('Not authenticated');
      return await ctx.prisma.subscription.findUnique({
        ...query,
        where: { userId: ctx.userId },
      });
    },
  }),

  pricingTiers: t.field({
    type: ['JSON'],
    resolve: () => {
      return Object.entries(PRICING_TIERS).map(([tier, config]) => ({
        tier,
        name: config.name,
        price: config.price,
        interval: config.interval,
        features: config.features,
      }));
    },
  }),
}));

builder.mutationFields((t) => ({
  createSubscription: t.field({
    type: 'JSON',
    args: {
      tier: t.arg.string({ required: true }),
      paymentMethodId: t.arg.string(),
    },
    resolve: async (root, args, ctx) => {
      if (!ctx.userId) throw new Error('Not authenticated');
      return await subscriptionService.createSubscription(
        ctx.userId,
        args.tier as any,
        args.paymentMethodId || undefined
      );
    },
  }),
}));
