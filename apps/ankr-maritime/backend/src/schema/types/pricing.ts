/**
 * Pricing & Monetization GraphQL Schema
 *
 * Subscription tiers, payment processing, feature gating, and billing.
 * Integrates with Stripe for payment processing and Razorpay for India.
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';
import { SubscriptionTierEnum, SubscriptionStatusEnum } from './subscription.js';

// === Additional Enums ===

const BillingCycleEnum = builder.enumType('BillingCycle', {
  values: ['monthly', 'annual'] as const,
});

const PaymentProviderEnum = builder.enumType('PaymentProvider', {
  values: ['stripe', 'razorpay'] as const,
});

// === Input Types ===

const CreateSubscriptionInput = builder.inputType('CreateSubscriptionInput', {
  fields: (t) => ({
    tier: t.field({ type: SubscriptionTierEnum, required: true }),
    billingCycle: t.field({ type: BillingCycleEnum, required: true }),
    paymentProvider: t.field({ type: PaymentProviderEnum, required: true }),
    couponCode: t.string({ required: false }),
  }),
});

const UpdateSubscriptionInput = builder.inputType('UpdateSubscriptionInput', {
  fields: (t) => ({
    tier: t.field({ type: SubscriptionTierEnum, required: false }),
    billingCycle: t.field({ type: BillingCycleEnum, required: false }),
  }),
});

// === Object Types ===

const PricingTierType = builder.objectRef<{
  tier: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  limits: {
    users: number | null;
    vessels: number | null;
    ports: number | null;
    apiCallsPerMonth: number | null;
    storageGB: number | null;
  };
  popular: boolean;
  available: boolean;
}>('PricingTier');

PricingTierType.implement({
  fields: (t) => ({
    tier: t.exposeString('tier'),
    name: t.exposeString('name'),
    description: t.exposeString('description'),
    priceMonthly: t.exposeInt('priceMonthly'),
    priceAnnual: t.exposeInt('priceAnnual'),
    features: t.exposeStringList('features'),
    limits: t.field({
      type: builder.objectRef<{
        users: number | null;
        vessels: number | null;
        ports: number | null;
        apiCallsPerMonth: number | null;
        storageGB: number | null;
      }>('TierLimits').implement({
        fields: (t) => ({
          users: t.exposeInt('users', { nullable: true }),
          vessels: t.exposeInt('vessels', { nullable: true }),
          ports: t.exposeInt('ports', { nullable: true }),
          apiCallsPerMonth: t.exposeInt('apiCallsPerMonth', { nullable: true }),
          storageGB: t.exposeInt('storageGB', { nullable: true }),
        }),
      }),
      resolve: (parent) => parent.limits,
    }),
    popular: t.exposeBoolean('popular'),
    available: t.exposeBoolean('available'),
    savings: t.int({
      resolve: (parent) => {
        const monthlyCost = parent.priceMonthly * 12;
        const annualCost = parent.priceAnnual;
        return monthlyCost - annualCost;
      },
    }),
    savingsPercentage: t.float({
      resolve: (parent) => {
        const monthlyCost = parent.priceMonthly * 12;
        const annualCost = parent.priceAnnual;
        return monthlyCost > 0 ? ((monthlyCost - annualCost) / monthlyCost) * 100 : 0;
      },
    }),
  }),
});

const SubscriptionType = builder.objectRef<{
  id: string;
  userId: string;
  organizationId: string;
  tier: string;
  status: string;
  billingCycle: string | null;
  amountCents: number;
  currency: string;
  features: any;
  apiQuota: number;
  apiUsed: number;
  startDate: Date;
  endDate: Date | null;
  trialEndsAt: Date | null;
  cancelledAt: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  razorpayCustomerId: string | null;
  razorpaySubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}>('PricingSubscription');

SubscriptionType.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId'),
    organizationId: t.exposeString('organizationId'),
    tier: t.exposeString('tier'),
    status: t.exposeString('status'),
    billingCycle: t.exposeString('billingCycle', { nullable: true }),
    amountCents: t.exposeInt('amountCents'),
    currency: t.exposeString('currency'),
    features: t.field({
      type: 'JSON',
      resolve: (parent) => parent.features,
    }),
    apiQuota: t.exposeInt('apiQuota'),
    apiUsed: t.exposeInt('apiUsed'),
    quotaRemaining: t.int({
      resolve: (parent) => Math.max(0, parent.apiQuota - parent.apiUsed),
    }),
    quotaPercentage: t.float({
      resolve: (parent) => parent.apiQuota > 0 ? (parent.apiUsed / parent.apiQuota) * 100 : 0,
    }),
    startDate: t.expose('startDate', { type: 'DateTime' }),
    endDate: t.expose('endDate', { type: 'DateTime', nullable: true }),
    trialEndsAt: t.expose('trialEndsAt', { type: 'DateTime', nullable: true }),
    cancelledAt: t.expose('cancelledAt', { type: 'DateTime', nullable: true }),
    isActive: t.boolean({
      resolve: (parent) => parent.status === 'active' || parent.status === 'trialing',
    }),
    isTrial: t.boolean({
      resolve: (parent) => parent.status === 'trialing' && parent.trialEndsAt !== null,
    }),
    daysUntilRenewal: t.int({
      nullable: true,
      resolve: (parent) => {
        if (!parent.endDate) return null;
        const now = new Date();
        const diff = parent.endDate.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      },
    }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

const PaymentIntentType = builder.objectRef<{
  clientSecret: string;
  amount: number;
  currency: string;
  provider: string;
}>('PaymentIntent');

PaymentIntentType.implement({
  fields: (t) => ({
    clientSecret: t.exposeString('clientSecret'),
    amount: t.exposeInt('amount'),
    currency: t.exposeString('currency'),
    provider: t.exposeString('provider'),
  }),
});

const InvoiceType = builder.objectRef<{
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: Date;
  paidAt: Date | null;
  invoiceUrl: string | null;
  createdAt: Date;
}>('Invoice');

InvoiceType.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    subscriptionId: t.exposeString('subscriptionId'),
    amount: t.exposeInt('amount'),
    currency: t.exposeString('currency'),
    status: t.exposeString('status'),
    dueDate: t.expose('dueDate', { type: 'DateTime' }),
    paidAt: t.expose('paidAt', { type: 'DateTime', nullable: true }),
    invoiceUrl: t.exposeString('invoiceUrl', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    isPaid: t.boolean({
      resolve: (parent) => parent.status === 'paid',
    }),
    isOverdue: t.boolean({
      resolve: (parent) => {
        if (parent.status === 'paid') return false;
        return parent.dueDate < new Date();
      },
    }),
  }),
});

const UsageStatsType = builder.objectRef<{
  apiCalls: number;
  apiQuota: number;
  users: number;
  usersLimit: number | null;
  vessels: number;
  vesselsLimit: number | null;
  storageUsedGB: number;
  storageQuotaGB: number | null;
}>('UsageStats');

UsageStatsType.implement({
  fields: (t) => ({
    apiCalls: t.exposeInt('apiCalls'),
    apiQuota: t.exposeInt('apiQuota'),
    users: t.exposeInt('users'),
    usersLimit: t.exposeInt('usersLimit', { nullable: true }),
    vessels: t.exposeInt('vessels'),
    vesselsLimit: t.exposeInt('vesselsLimit', { nullable: true }),
    storageUsedGB: t.exposeFloat('storageUsedGB'),
    storageQuotaGB: t.exposeFloat('storageQuotaGB', { nullable: true }),
    apiUsagePercentage: t.float({
      resolve: (parent) => parent.apiQuota > 0 ? (parent.apiCalls / parent.apiQuota) * 100 : 0,
    }),
    usersUsagePercentage: t.float({
      resolve: (parent) => parent.usersLimit ? (parent.users / parent.usersLimit) * 100 : 0,
    }),
    vesselsUsagePercentage: t.float({
      resolve: (parent) => parent.vesselsLimit ? (parent.vessels / parent.vesselsLimit) * 100 : 0,
    }),
    storageUsagePercentage: t.float({
      resolve: (parent) => parent.storageQuotaGB ? (parent.storageUsedGB / parent.storageQuotaGB) * 100 : 0,
    }),
  }),
});

// === Queries ===

builder.queryFields((t) => ({
  pricingTiers: t.field({
    type: [PricingTierType],
    resolve: async () => {
      // Hardcoded pricing tiers (can be moved to database later)
      return [
        {
          tier: 'free',
          name: 'Free',
          description: 'For individual agents exploring the platform',
          priceMonthly: 0,
          priceAnnual: 0,
          features: [
            'Up to 3 users',
            'Up to 10 vessels',
            'Basic port intelligence',
            '100 API calls/month',
            'Email support',
            '1GB storage',
          ],
          limits: {
            users: 3,
            vessels: 10,
            ports: null,
            apiCallsPerMonth: 100,
            storageGB: 1,
          },
          popular: false,
          available: true,
        },
        {
          tier: 'agent',
          name: 'Agent',
          description: 'For professional port agents',
          priceMonthly: 4900, // $49/month
          priceAnnual: 49000, // $490/year (2 months free)
          features: [
            'Up to 10 users',
            'Up to 100 vessels',
            'Advanced port intelligence',
            'Arrival forecasting',
            'Document automation',
            '10,000 API calls/month',
            'Priority email support',
            '50GB storage',
            'Custom workflows',
          ],
          limits: {
            users: 10,
            vessels: 100,
            ports: null,
            apiCallsPerMonth: 10000,
            storageGB: 50,
          },
          popular: true,
          available: true,
        },
        {
          tier: 'operator',
          name: 'Operator',
          description: 'For ship operators and managers',
          priceMonthly: 14900, // $149/month
          priceAnnual: 149000, // $1,490/year (2 months free)
          features: [
            'Up to 50 users',
            'Unlimited vessels',
            'Everything in Agent, plus:',
            'Fleet analytics',
            'Voyage optimization',
            'Compliance tracking',
            'Bunker management',
            '100,000 API calls/month',
            'Phone + email support',
            '500GB storage',
            'Custom integrations',
          ],
          limits: {
            users: 50,
            vessels: null,
            ports: null,
            apiCallsPerMonth: 100000,
            storageGB: 500,
          },
          popular: false,
          available: true,
        },
        {
          tier: 'enterprise',
          name: 'Enterprise',
          description: 'For large organizations with custom needs',
          priceMonthly: 0, // Custom pricing
          priceAnnual: 0,
          features: [
            'Unlimited users',
            'Unlimited vessels',
            'Everything in Operator, plus:',
            'Dedicated account manager',
            'Custom development',
            'SLA guarantees',
            'On-premise deployment option',
            'Unlimited API calls',
            '24/7 phone support',
            'Unlimited storage',
            'White-label options',
            'Advanced security',
          ],
          limits: {
            users: null,
            vessels: null,
            ports: null,
            apiCallsPerMonth: null,
            storageGB: null,
          },
          popular: false,
          available: true,
        },
      ];
    },
  }),

  mySubscription: t.field({
    type: SubscriptionType,
    nullable: true,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');

      return await prisma.subscription.findFirst({
        where: { userId: ctx.user.id },
      });
    },
  }),

  myInvoices: t.field({
    type: [InvoiceType],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');

      const subscription = await prisma.subscription.findFirst({
        where: { userId: ctx.user.id },
      });

      if (!subscription) return [];

      return await prisma.subscriptionInvoice.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { createdAt: 'desc' },
      });
    },
  }),

  myUsageStats: t.field({
    type: UsageStatsType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');

      const subscription = await prisma.subscription.findFirst({
        where: { userId: ctx.user.id },
      });

      const organization = await prisma.organization.findUnique({
        where: { id: ctx.user.organizationId },
        include: {
          users: true,
          vessels: true,
        },
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      // Get tier limits
      const tiers: any = {
        free: { users: 3, vessels: 10, apiCalls: 100, storageGB: 1 },
        agent: { users: 10, vessels: 100, apiCalls: 10000, storageGB: 50 },
        operator: { users: 50, vessels: null, apiCalls: 100000, storageGB: 500 },
        enterprise: { users: null, vessels: null, apiCalls: null, storageGB: null },
      };

      const currentTier = subscription?.tier || 'free';
      const limits = tiers[currentTier];

      // Calculate storage (mock for now)
      const storageUsedGB = 0.5; // TODO: Calculate actual storage

      return {
        apiCalls: subscription?.apiUsed || 0,
        apiQuota: subscription?.apiQuota || limits.apiCalls,
        users: organization.users.length,
        usersLimit: limits.users,
        vessels: organization.vessels.length,
        vesselsLimit: limits.vessels,
        storageUsedGB,
        storageQuotaGB: limits.storageGB,
      };
    },
  }),
}));

// === Mutations ===

builder.mutationFields((t) => ({
  createSubscription: t.field({
    type: SubscriptionType,
    args: {
      input: t.arg({ type: CreateSubscriptionInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');

      // Check if user already has a subscription
      const existing = await prisma.subscription.findFirst({
        where: { userId: ctx.user.id },
      });

      if (existing) {
        throw new Error('User already has a subscription. Use updateSubscription instead.');
      }

      // Get pricing
      const tiers: any = {
        free: { monthly: 0, annual: 0, apiQuota: 100 },
        agent: { monthly: 4900, annual: 49000, apiQuota: 10000 },
        operator: { monthly: 14900, annual: 149000, apiQuota: 100000 },
        enterprise: { monthly: 0, annual: 0, apiQuota: 999999999 },
      };

      const tier = tiers[args.input.tier];
      const amount = args.input.billingCycle === 'monthly' ? tier.monthly : tier.annual;

      // Create subscription
      const subscription = await prisma.subscription.create({
        data: {
          userId: ctx.user.id,
          organizationId: ctx.user.organizationId,
          tier: args.input.tier,
          status: args.input.tier === 'free' ? 'active' : 'trialing',
          billingCycle: args.input.billingCycle,
          amountCents: amount,
          currency: 'USD',
          apiQuota: tier.apiQuota,
          apiUsed: 0,
          trialEndsAt: args.input.tier === 'free' ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        },
      });

      return subscription;
    },
  }),

  updateSubscription: t.field({
    type: SubscriptionType,
    args: {
      input: t.arg({ type: UpdateSubscriptionInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');

      const subscription = await prisma.subscription.findFirst({
        where: { userId: ctx.user.id },
      });

      if (!subscription) {
        throw new Error('No subscription found. Use createSubscription instead.');
      }

      const data: any = {};

      if (args.input.tier) {
        data.tier = args.input.tier;

        const tiers: any = {
          free: { monthly: 0, annual: 0, apiQuota: 100 },
          agent: { monthly: 4900, annual: 49000, apiQuota: 10000 },
          operator: { monthly: 14900, annual: 149000, apiQuota: 100000 },
          enterprise: { monthly: 0, annual: 0, apiQuota: 999999999 },
        };

        const tier = tiers[args.input.tier];
        const billingCycle = args.input.billingCycle || subscription.billingCycle;
        data.amountCents = billingCycle === 'monthly' ? tier.monthly : tier.annual;
        data.apiQuota = tier.apiQuota;
      }

      if (args.input.billingCycle) {
        data.billingCycle = args.input.billingCycle;
      }

      return await prisma.subscription.update({
        where: { id: subscription.id },
        data,
      });
    },
  }),

  cancelSubscription: t.field({
    type: SubscriptionType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');

      const subscription = await prisma.subscription.findFirst({
        where: { userId: ctx.user.id },
      });

      if (!subscription) {
        throw new Error('No subscription found');
      }

      return await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
      });
    },
  }),

  createPaymentIntent: t.field({
    type: PaymentIntentType,
    args: {
      tier: t.arg({ type: SubscriptionTierEnum, required: true }),
      billingCycle: t.arg({ type: BillingCycleEnum, required: true }),
      provider: t.arg({ type: PaymentProviderEnum, required: true }),
    },
    resolve: async (_root, args) => {
      const tiers: any = {
        free: { monthly: 0, annual: 0 },
        agent: { monthly: 4900, annual: 49000 },
        operator: { monthly: 14900, annual: 149000 },
        enterprise: { monthly: 0, annual: 0 },
      };

      const tier = tiers[args.tier];
      const amount = args.billingCycle === 'monthly' ? tier.monthly : tier.annual;

      // In production, this would create a Stripe PaymentIntent or Razorpay order
      // For now, return mock data
      return {
        clientSecret: `${args.provider}_secret_${Math.random().toString(36).slice(2)}`,
        amount,
        currency: 'USD',
        provider: args.provider,
      };
    },
  }),

  applyPromoCode: t.field({
    type: builder.objectRef<{ valid: boolean; discount: number; message: string }>('PromoCodeResult').implement({
      fields: (t) => ({
        valid: t.exposeBoolean('valid'),
        discount: t.exposeInt('discount'),
        message: t.exposeString('message'),
      }),
    }),
    args: {
      code: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      // Mock promo code validation
      const promoCodes: any = {
        'BETA50': { discount: 50, message: 'Beta user discount: 50% off for 3 months' },
        'LAUNCH25': { discount: 25, message: 'Launch special: 25% off first year' },
        'ANNUAL20': { discount: 20, message: 'Annual plan discount: 20% off' },
      };

      const promo = promoCodes[args.code.toUpperCase()];

      if (promo) {
        return { valid: true, ...promo };
      }

      return { valid: false, discount: 0, message: 'Invalid promo code' };
    },
  }),
}));
