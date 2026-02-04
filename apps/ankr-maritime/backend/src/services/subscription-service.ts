/**
 * Subscription Service with Razorpay Integration
 * Phase 6: Monetization & Pricing
 * Handles Razorpay payments, feature gating, and usage tracking
 */

import Razorpay from 'razorpay';
import { prisma } from '../lib/prisma.js';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Pricing configuration (in INR)
export const PRICING_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceINR: 0,
    priceUSD: 0,
    interval: 'month',
    razorpayPlanId: undefined,
    features: {
      vesselLimit: 5,
      autoPDA: false,
      multiChannelAlerts: false,
      apiAccess: false,
      multiUser: false,
      whiteLabel: false,
      dedicatedSupport: false,
    },
  },
  PRO: {
    name: 'Pro',
    price: 7999, // ₹7,999/month (~$99 USD)
    priceINR: 7999,
    priceUSD: 99,
    interval: 'monthly',
    razorpayPlanId: process.env.RAZORPAY_PLAN_PRO_MONTHLY,
    features: {
      vesselLimit: Infinity,
      autoPDA: true,
      multiChannelAlerts: true,
      apiAccess: false,
      multiUser: false,
      whiteLabel: false,
      dedicatedSupport: false,
    },
  },
  AGENCY: {
    name: 'Agency',
    price: 39999, // ₹39,999/month (~$499 USD)
    priceINR: 39999,
    priceUSD: 499,
    interval: 'monthly',
    razorpayPlanId: process.env.RAZORPAY_PLAN_AGENCY_MONTHLY,
    features: {
      vesselLimit: Infinity,
      autoPDA: true,
      multiChannelAlerts: true,
      apiAccess: true,
      multiUser: true,
      maxUsers: 5,
      whiteLabel: true,
      dedicatedSupport: true,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 159999, // ₹1,59,999/month (~$2,000 USD)
    priceINR: 159999,
    priceUSD: 2000,
    interval: 'monthly',
    razorpayPlanId: process.env.RAZORPAY_PLAN_ENTERPRISE_MONTHLY,
    features: {
      vesselLimit: Infinity,
      autoPDA: true,
      multiChannelAlerts: true,
      apiAccess: true,
      multiUser: true,
      maxUsers: Infinity,
      whiteLabel: true,
      dedicatedSupport: true,
      ownerPortal: true,
      customIntegrations: true,
      sla: true,
    },
  },
} as const;

export class SubscriptionService {
  /**
   * Create or update a subscription with Razorpay
   */
  async createSubscription(userId: string, tier: keyof typeof PRICING_TIERS) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Get or create Razorpay customer
    let razorpayCustomerId = user.razorpayCustomerId;
    if (!razorpayCustomerId) {
      const customer = await razorpay.customers.create({
        name: user.name || user.email,
        email: user.email,
        contact: user.phone || undefined,
        notes: {
          userId: user.id,
        },
      });
      razorpayCustomerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { razorpayCustomerId },
      });
    }

    // Create Razorpay subscription (skip for FREE tier)
    let razorpaySubscriptionId: string | undefined;
    if (tier !== 'FREE') {
      const tierConfig = PRICING_TIERS[tier];

      // Create subscription
      const subscription = await razorpay.subscriptions.create({
        plan_id: tierConfig.razorpayPlanId!,
        customer_notify: 1,
        quantity: 1,
        total_count: 12, // 12 months (yearly)
        notes: {
          userId: user.id,
          tier: tier,
        },
      });
      razorpaySubscriptionId = subscription.id;
    }

    // Create or update subscription in database
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

    return await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tier,
        status: 'TRIALING',
        razorpayCustomerId,
        razorpaySubscriptionId,
        amount: PRICING_TIERS[tier].price,
        currency: 'INR',
        currentPeriodEnd: periodEnd,
        trialEnd,
      },
      update: {
        tier,
        razorpaySubscriptionId,
        amount: PRICING_TIERS[tier].price,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: string, immediately = false) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) throw new Error('Subscription not found');

    // Cancel Razorpay subscription
    if (subscription.razorpaySubscriptionId) {
      await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, {
        cancel_at_cycle_end: immediately ? 0 : 1,
      });
    }

    // Update database
    return await prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: !immediately,
        canceledAt: immediately ? new Date() : null,
        status: immediately ? 'CANCELED' : 'ACTIVE',
      },
    });
  }

  /**
   * Upgrade/downgrade subscription
   */
  async changeSubscriptionTier(userId: string, newTier: keyof typeof PRICING_TIERS) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) throw new Error('Subscription not found');

    // Cancel old subscription and create new one
    if (subscription.razorpaySubscriptionId && newTier !== 'FREE') {
      // Cancel existing
      await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId);

      // Create new subscription with new tier
      const tierConfig = PRICING_TIERS[newTier];
      const newSubscription = await razorpay.subscriptions.create({
        plan_id: tierConfig.razorpayPlanId!,
        customer_notify: 1,
        quantity: 1,
        total_count: 12,
        notes: {
          userId: userId,
          tier: newTier,
          upgradeFrom: subscription.tier,
        },
      });

      await prisma.subscription.update({
        where: { userId },
        data: {
          tier: newTier,
          amount: tierConfig.price,
          razorpaySubscriptionId: newSubscription.id,
        },
      });
    } else {
      // Just update tier for FREE or from FREE
      await prisma.subscription.update({
        where: { userId },
        data: {
          tier: newTier,
          amount: PRICING_TIERS[newTier].price,
        },
      });
    }

    return await prisma.subscription.findUnique({ where: { userId } });
  }

  /**
   * Track usage for the current month
   */
  async trackUsage(userId: string, metric: string, increment = 1) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) throw new Error('Subscription not found');

    const month = new Date().toISOString().substring(0, 7); // YYYY-MM
    const tierConfig = PRICING_TIERS[subscription.tier];

    await prisma.usageRecord.upsert({
      where: {
        subscriptionId_month: {
          subscriptionId: subscription.id,
          month,
        },
      },
      create: {
        subscriptionId: subscription.id,
        month,
        [metric]: increment,
        vesselLimit: tierConfig.features.vesselLimit,
      },
      update: {
        [metric]: {
          increment,
        },
      },
    });
  }

  /**
   * Check if user has reached their usage limit
   */
  async checkUsageLimit(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        usageRecords: {
          where: {
            month: new Date().toISOString().substring(0, 7),
          },
        },
      },
    });

    if (!subscription) return false;

    const tierConfig = PRICING_TIERS[subscription.tier];
    const usage = subscription.usageRecords[0];

    if (!usage) return false;

    return usage.vesselsTracked >= tierConfig.features.vesselLimit;
  }

  /**
   * Get current usage for user
   */
  async getUsage(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        usageRecords: {
          where: {
            month: new Date().toISOString().substring(0, 7),
          },
        },
      },
    });

    if (!subscription) throw new Error('Subscription not found');

    const tierConfig = PRICING_TIERS[subscription.tier];
    const usage = subscription.usageRecords[0] || {
      vesselsTracked: 0,
      pdasGenerated: 0,
      apiCalls: 0,
    };

    return {
      tier: subscription.tier,
      vesselsTracked: usage.vesselsTracked,
      vesselLimit: tierConfig.features.vesselLimit,
      pdasGenerated: usage.pdasGenerated,
      apiCalls: usage.apiCalls,
      limitReached: usage.vesselsTracked >= tierConfig.features.vesselLimit,
    };
  }

  /**
   * Handle Razorpay webhook events
   */
  async handleWebhook(event: any) {
    const eventType = event.event;
    const payload = event.payload;

    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const subscription = payload.subscription.entity;
        await this.syncSubscriptionFromRazorpay(subscription);
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.completed': {
        const subscription = payload.subscription.entity;
        await prisma.subscription.update({
          where: { razorpaySubscriptionId: subscription.id },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
          },
        });
        break;
      }

      case 'payment.captured': {
        const payment = payload.payment.entity;
        await this.recordPayment(payment);
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment.entity;
        if (payment.subscription_id) {
          await prisma.subscription.update({
            where: { razorpaySubscriptionId: payment.subscription_id },
            data: { status: 'PAST_DUE' },
          });
        }
        break;
      }
    }
  }

  /**
   * Sync subscription from Razorpay
   */
  private async syncSubscriptionFromRazorpay(razorpaySubscription: any) {
    const subscription = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: razorpaySubscription.id },
    });

    if (!subscription) return;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: razorpaySubscription.status === 'active' ? 'ACTIVE' : razorpaySubscription.status.toUpperCase(),
        currentPeriodStart: new Date(razorpaySubscription.current_start * 1000),
        currentPeriodEnd: new Date(razorpaySubscription.current_end * 1000),
      },
    });
  }

  /**
   * Record payment in database
   */
  private async recordPayment(razorpayPayment: any) {
    if (!razorpayPayment.subscription_id) return;

    const subscription = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: razorpayPayment.subscription_id },
    });

    if (!subscription) return;

    await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        razorpayPaymentId: razorpayPayment.id,
        invoiceNumber: `INV-${Date.now()}`,
        amount: razorpayPayment.amount / 100, // Razorpay stores in paise
        currency: razorpayPayment.currency.toUpperCase(),
        status: 'paid',
        periodStart: new Date(),
        periodEnd: new Date(),
        paidAt: new Date(razorpayPayment.created_at * 1000),
      },
    });
  }

  /**
   * Apply coupon code
   */
  async applyCoupon(userId: string, code: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      throw new Error('Invalid coupon code');
    }

    // Check validity
    const now = new Date();
    if (coupon.validUntil && coupon.validUntil < now) {
      throw new Error('Coupon has expired');
    }

    if (coupon.maxRedemptions && coupon.timesRedeemed >= coupon.maxRedemptions) {
      throw new Error('Coupon redemption limit reached');
    }

    // Apply to subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) throw new Error('Subscription not found');

    // Check tier restriction
    if (coupon.tiers.length > 0 && !coupon.tiers.includes(subscription.tier)) {
      throw new Error('Coupon not valid for this tier');
    }

    // Update subscription
    const discountEndDate = new Date();
    discountEndDate.setMonth(discountEndDate.getMonth() + 6); // 6 months discount

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        couponCode: code,
        discountPercent: coupon.discountPercent,
        discountEndDate,
      },
    });

    // Increment redemption count
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        timesRedeemed: { increment: 1 },
      },
    });

    return { success: true, discountPercent: coupon.discountPercent };
  }

  /**
   * Create payment link for one-time purchases
   */
  async createPaymentLink(userId: string, tier: keyof typeof PRICING_TIERS) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const tierConfig = PRICING_TIERS[tier];

    const paymentLink = await razorpay.paymentLink.create({
      amount: tierConfig.price * 100, // Convert to paise
      currency: 'INR',
      description: `Mari8X ${tierConfig.name} Subscription`,
      customer: {
        name: user.name || user.email,
        email: user.email,
        contact: user.phone || undefined,
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      notes: {
        userId: user.id,
        tier: tier,
      },
      callback_url: `${process.env.APP_URL}/subscription/success`,
      callback_method: 'get',
    });

    return {
      paymentLinkId: paymentLink.id,
      shortUrl: paymentLink.short_url,
    };
  }
}

export const subscriptionService = new SubscriptionService();
