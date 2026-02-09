/**
 * Subscription Access Control - Enterprise IP Protection
 * Enforces subscription tiers and feature permissions
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

// Subscription tiers
export enum SubscriptionTier {
  FREE = 'free',
  AGENT = 'agent',
  OPERATOR = 'operator',
  ENTERPRISE = 'enterprise',
}

// Enterprise features (IP-protected)
export enum Feature {
  // Port Tariff Intelligence
  PORT_TARIFF_VIEW = 'port_tariff_view',
  PORT_TARIFF_EXPORT = 'port_tariff_export',
  PDA_GENERATION = 'pda_generation',
  FDA_GENERATION = 'fda_generation',

  // AIS Routing Engine
  AIS_ROUTING = 'ais_routing',
  AIS_REAL_TIME = 'ais_real_time',
  ROUTE_OPTIMIZATION = 'route_optimization',
  ETA_PREDICTION = 'eta_prediction',

  // Market Intelligence
  MARKET_INTELLIGENCE = 'market_intelligence',
  MARKET_INTEL_BASIC = 'market_intel_basic',
  MARKET_INTEL_ADVANCED = 'market_intel_advanced',
  FREIGHT_RATE_PREDICTIONS = 'freight_rate_predictions',

  // API Access
  API_ACCESS = 'api_access',
  WHITE_LABEL = 'white_label',
  DEDICATED_SUPPORT = 'dedicated_support',
}

// Feature permissions matrix
const FEATURE_PERMISSIONS: Record<Feature, SubscriptionTier[]> = {
  // Port Tariff
  [Feature.PORT_TARIFF_VIEW]: [SubscriptionTier.AGENT, SubscriptionTier.OPERATOR, SubscriptionTier.ENTERPRISE],
  [Feature.PORT_TARIFF_EXPORT]: [SubscriptionTier.OPERATOR, SubscriptionTier.ENTERPRISE],
  [Feature.PDA_GENERATION]: [SubscriptionTier.AGENT, SubscriptionTier.OPERATOR, SubscriptionTier.ENTERPRISE],
  [Feature.FDA_GENERATION]: [SubscriptionTier.OPERATOR, SubscriptionTier.ENTERPRISE],

  // AIS Routing
  [Feature.AIS_ROUTING]: [SubscriptionTier.OPERATOR, SubscriptionTier.ENTERPRISE],
  [Feature.AIS_REAL_TIME]: [SubscriptionTier.OPERATOR, SubscriptionTier.ENTERPRISE],
  [Feature.ROUTE_OPTIMIZATION]: [SubscriptionTier.OPERATOR, SubscriptionTier.ENTERPRISE],
  [Feature.ETA_PREDICTION]: [SubscriptionTier.OPERATOR, SubscriptionTier.ENTERPRISE],

  // Market Intelligence
  [Feature.MARKET_INTELLIGENCE]: [SubscriptionTier.OPERATOR, SubscriptionTier.ENTERPRISE],
  [Feature.MARKET_INTEL_BASIC]: [SubscriptionTier.OPERATOR, SubscriptionTier.ENTERPRISE],
  [Feature.MARKET_INTEL_ADVANCED]: [SubscriptionTier.ENTERPRISE],
  [Feature.FREIGHT_RATE_PREDICTIONS]: [SubscriptionTier.ENTERPRISE],

  // API & Enterprise
  [Feature.API_ACCESS]: [SubscriptionTier.ENTERPRISE],
  [Feature.WHITE_LABEL]: [SubscriptionTier.ENTERPRISE],
  [Feature.DEDICATED_SUPPORT]: [SubscriptionTier.ENTERPRISE],
};

// PDA generation quotas by tier
const PDA_QUOTAS: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.AGENT]: 50,        // 50 PDAs per month
  [SubscriptionTier.OPERATOR]: 500,    // 500 PDAs per month
  [SubscriptionTier.ENTERPRISE]: -1,   // Unlimited
};

// API quotas by tier (requests per month)
const API_QUOTAS: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.AGENT]: 0,
  [SubscriptionTier.OPERATOR]: 1000,
  [SubscriptionTier.ENTERPRISE]: 100000,
};

export interface AccessControlContext {
  userId: string;
  organizationId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AccessCheckResult {
  granted: boolean;
  reason?: string;
  subscriptionTier?: SubscriptionTier;
  quotaRemaining?: number;
}

/**
 * Check if user has access to a feature
 */
export async function checkFeatureAccess(
  feature: Feature,
  context: AccessControlContext
): Promise<AccessCheckResult> {
  try {
    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: context.userId },
    });

    if (!subscription) {
      await logFeatureAccess({
        ...context,
        feature,
        subscriptionTier: SubscriptionTier.FREE,
        accessGranted: false,
        denialReason: 'No subscription found',
      });

      return {
        granted: false,
        reason: 'Enterprise subscription required. Upgrade to access this feature.',
        subscriptionTier: SubscriptionTier.FREE,
      };
    }

    // Check subscription status
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      await logFeatureAccess({
        ...context,
        feature,
        subscriptionTier: subscription.tier as SubscriptionTier,
        accessGranted: false,
        denialReason: `Subscription status: ${subscription.status}`,
      });

      return {
        granted: false,
        reason: `Subscription is ${subscription.status}. Please update your payment method.`,
        subscriptionTier: subscription.tier as SubscriptionTier,
      };
    }

    // Check if subscription has expired
    if (subscription.endDate && subscription.endDate < new Date()) {
      await logFeatureAccess({
        ...context,
        feature,
        subscriptionTier: subscription.tier as SubscriptionTier,
        accessGranted: false,
        denialReason: 'Subscription expired',
      });

      return {
        granted: false,
        reason: 'Subscription expired. Please renew to continue.',
        subscriptionTier: subscription.tier as SubscriptionTier,
      };
    }

    // Check tier permissions
    const allowedTiers = FEATURE_PERMISSIONS[feature];
    const tier = subscription.tier as SubscriptionTier;

    if (!allowedTiers.includes(tier)) {
      await logFeatureAccess({
        ...context,
        feature,
        subscriptionTier: tier,
        accessGranted: false,
        denialReason: `Tier ${tier} not allowed for feature ${feature}`,
      });

      return {
        granted: false,
        reason: `This feature requires ${allowedTiers.join(' or ')} subscription. Please upgrade.`,
        subscriptionTier: tier,
      };
    }

    // Check API quota (if applicable)
    if (feature === Feature.API_ACCESS) {
      const quotaLimit = API_QUOTAS[tier];
      if (quotaLimit > 0 && subscription.apiUsed >= subscription.apiQuota) {
        await logFeatureAccess({
          ...context,
          feature,
          subscriptionTier: tier,
          accessGranted: false,
          denialReason: 'API quota exceeded',
        });

        return {
          granted: false,
          reason: `API quota exceeded (${subscription.apiUsed}/${subscription.apiQuota}). Upgrade or wait for reset.`,
          subscriptionTier: tier,
          quotaRemaining: 0,
        };
      }
    }

    // Access granted
    await logFeatureAccess({
      ...context,
      feature,
      subscriptionTier: tier,
      accessGranted: true,
    });

    return {
      granted: true,
      subscriptionTier: tier,
      quotaRemaining: subscription.apiQuota - subscription.apiUsed,
    };
  } catch (error: any) {
    console.error('Access control error:', error.message);
    return {
      granted: false,
      reason: 'Internal error checking permissions',
    };
  }
}

/**
 * Check if user can generate PDA (with quota check)
 */
export async function checkPDAQuota(context: AccessControlContext): Promise<AccessCheckResult> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: context.userId },
    });

    if (!subscription) {
      return {
        granted: false,
        reason: 'Subscription required to generate PDAs',
        subscriptionTier: SubscriptionTier.FREE,
      };
    }

    const tier = subscription.tier as SubscriptionTier;
    const quota = PDA_QUOTAS[tier];

    if (quota === 0) {
      return {
        granted: false,
        reason: `${tier} tier does not include PDA generation`,
        subscriptionTier: tier,
      };
    }

    if (quota === -1) {
      // Unlimited
      return {
        granted: true,
        subscriptionTier: tier,
        quotaRemaining: -1,
      };
    }

    // Check usage (stored in features JSON)
    const features = subscription.features as any;
    const pdaUsed = features?.pda_used_monthly || 0;

    if (pdaUsed >= quota) {
      return {
        granted: false,
        reason: `Monthly PDA quota exceeded (${pdaUsed}/${quota}). Upgrade or wait for reset.`,
        subscriptionTier: tier,
        quotaRemaining: 0,
      };
    }

    return {
      granted: true,
      subscriptionTier: tier,
      quotaRemaining: quota - pdaUsed,
    };
  } catch (error: any) {
    console.error('PDA quota check error:', error.message);
    return {
      granted: false,
      reason: 'Internal error checking PDA quota',
    };
  }
}

/**
 * Increment API usage
 */
export async function incrementAPIUsage(
  context: AccessControlContext,
  endpoint: string,
  method: string,
  statusCode?: number,
  responseTimeMs?: number
): Promise<void> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: context.userId },
    });

    if (!subscription) return;

    // Log API usage
    await prisma.apiUsage.create({
      data: {
        userId: context.userId,
        organizationId: context.organizationId,
        subscriptionId: subscription.id,
        endpoint,
        method,
        statusCode,
        responseTimeMs,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    // Increment quota used
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        apiUsed: { increment: 1 },
      },
    });
  } catch (error: any) {
    console.error('Failed to increment API usage:', error.message);
  }
}

/**
 * Log feature access (audit trail)
 */
async function logFeatureAccess(data: {
  userId: string;
  organizationId: string;
  feature: string;
  subscriptionTier?: SubscriptionTier;
  accessGranted: boolean;
  denialReason?: string;
  ipAddress?: string;
  userAgent?: string;
  action?: string;
  resourceId?: string;
}): Promise<void> {
  try {
    await prisma.featureAccessLog.create({
      data,
    });
  } catch (error: any) {
    console.error('Failed to log feature access:', error.message);
  }
}

/**
 * Get subscription for user
 */
export async function getSubscription(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });
}

/**
 * Create or upgrade subscription
 */
export async function createOrUpgradeSubscription(
  userId: string,
  organizationId: string,
  tier: SubscriptionTier,
  billingCycle: 'monthly' | 'annual' = 'monthly'
): Promise<any> {
  // Get plan details
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { tier },
  });

  if (!plan) {
    throw new Error(`Subscription plan not found for tier: ${tier}`);
  }

  const amountCents = billingCycle === 'monthly' ? plan.priceMonthlyCents : plan.priceAnnualCents;

  // Check if user already has a subscription
  const existing = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (existing) {
    // Upgrade/downgrade existing subscription
    const updated = await prisma.subscription.update({
      where: { userId },
      data: {
        tier,
        billingCycle,
        amountCents,
        features: plan.features,
        apiQuota: plan.apiQuotaMonthly,
        status: 'active',
      },
    });

    // Log event
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: updated.id,
        eventType: 'tier_changed',
        eventData: {
          oldTier: existing.tier,
          newTier: tier,
          billingCycle,
        },
        createdBy: userId,
      },
    });

    return updated;
  } else {
    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        organizationId,
        tier,
        billingCycle,
        amountCents,
        features: plan.features,
        apiQuota: plan.apiQuotaMonthly,
        status: 'trialing',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      },
    });

    // Log event
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        eventType: 'subscription_created',
        eventData: {
          tier,
          billingCycle,
          trialDays: 14,
        },
        createdBy: userId,
      },
    });

    return subscription;
  }
}

/**
 * Reset monthly quotas (called by cron job)
 */
export async function resetMonthlyQuotas(): Promise<void> {
  try {
    // Reset API quotas
    await prisma.subscription.updateMany({
      where: {
        status: 'active',
      },
      data: {
        apiUsed: 0,
        lastQuotaReset: new Date(),
      },
    });

    // Reset PDA quotas (stored in features JSON)
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'active' },
    });

    for (const sub of subscriptions) {
      const features = (sub.features as any) || {};
      features.pda_used_monthly = 0;

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { features },
      });
    }

    console.log(`✅ Reset monthly quotas for ${subscriptions.length} subscriptions`);
  } catch (error: any) {
    console.error('Failed to reset monthly quotas:', error.message);
  }
}
