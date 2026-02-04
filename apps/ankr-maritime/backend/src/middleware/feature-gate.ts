/**
 * Feature Gate Middleware
 * Phase 6: Monetization & Pricing
 * Enforces subscription tier limits and feature access
 */

import { prisma } from '../lib/prisma.js';
import { PRICING_TIERS } from '../services/subscription-service.js';

export class FeatureGate {
  /**
   * Check if user can generate automatic PDAs
   */
  static async canGenerateAutoPDA(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return false;

    const tierConfig = PRICING_TIERS[subscription.tier];
    return tierConfig.features.autoPDA;
  }

  /**
   * Check if user can access API
   */
  static async canAccessAPI(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return false;

    const tierConfig = PRICING_TIERS[subscription.tier];
    return tierConfig.features.apiAccess || false;
  }

  /**
   * Check if user can add more vessels
   */
  static async canTrackMoreVessels(userId: string): Promise<boolean> {
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

    if (!usage) return true;

    return usage.vesselsTracked < tierConfig.features.vesselLimit;
  }

  /**
   * Check if user can use multi-channel alerts
   */
  static async canUseMultiChannelAlerts(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return false;

    const tierConfig = PRICING_TIERS[subscription.tier];
    return tierConfig.features.multiChannelAlerts;
  }

  /**
   * Check if user can access multi-user features
   */
  static async canAddUsers(userId: string): Promise<{ allowed: boolean; maxUsers: number }> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return { allowed: false, maxUsers: 1 };

    const tierConfig = PRICING_TIERS[subscription.tier];
    return {
      allowed: tierConfig.features.multiUser || false,
      maxUsers: tierConfig.features.maxUsers || 1,
    };
  }

  /**
   * Get all feature flags for user
   */
  static async getFeatureFlags(userId: string) {
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

    if (!subscription) {
      return {
        tier: 'FREE',
        autoPDA: false,
        multiChannelAlerts: false,
        apiAccess: false,
        multiUser: false,
        whiteLabel: false,
        dedicatedSupport: false,
        vesselLimit: 5,
        vesselsUsed: 0,
        limitReached: false,
      };
    }

    const tierConfig = PRICING_TIERS[subscription.tier];
    const usage = subscription.usageRecords[0] || { vesselsTracked: 0 };

    return {
      tier: subscription.tier,
      ...tierConfig.features,
      vesselsUsed: usage.vesselsTracked,
      limitReached: usage.vesselsTracked >= tierConfig.features.vesselLimit,
    };
  }

  /**
   * Track feature usage
   */
  static async trackFeatureUsage(userId: string, feature: string, allowed: boolean) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return;

    await prisma.featureUsage.create({
      data: {
        userId,
        feature,
        allowed,
        tier: subscription.tier,
      },
    });
  }
}
