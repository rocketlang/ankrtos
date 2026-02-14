/**
 * BFC Gamification Module
 * Handles rewards, challenges, achievements, and engagement mechanics for financial wellness
 *
 * Gamification drives user engagement while building positive financial habits
 */

import type { Intent, ExtractedEntities } from './types';
import type { FinancialEpisode, FinancialModule } from './bfc-episode-recorder';

// ═══════════════════════════════════════════════════════════════════════════════
// GAMIFICATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface UserGamificationProfile {
  userId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalPoints: number;
  availablePoints: number;  // Can be redeemed
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string;
  };
  badges: Badge[];
  achievements: Achievement[];
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  tier: UserTier;
}

export interface Badge {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
  category: BadgeCategory;
}

export interface Achievement {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  progress: number;
  target: number;
  completed: boolean;
  xpReward: number;
  pointsReward: number;
  badgeReward?: string;
  category: AchievementCategory;
}

export interface Challenge {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  type: ChallengeType;
  target: number;
  progress: number;
  xpReward: number;
  pointsReward: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'expired';
  category: FinancialModule;
}

export type BadgeCategory =
  | 'savings'       // Saving milestones
  | 'budgeting'     // Budget discipline
  | 'investing'     // Investment achievements
  | 'credit'        // Credit score improvements
  | 'insurance'     // Insurance coverage
  | 'learning'      // Financial literacy
  | 'streak'        // Consistency
  | 'social';       // Referrals, community

export type AchievementCategory =
  | 'first_steps'   // Onboarding achievements
  | 'savings_hero'  // Savings milestones
  | 'budget_master' // Budget adherence
  | 'investor'      // Investment milestones
  | 'credit_builder'// Credit improvements
  | 'protection'    // Insurance coverage
  | 'knowledge'     // Learning/quizzes
  | 'consistency';  // Streak achievements

export type ChallengeType =
  | 'daily'         // Complete today
  | 'weekly'        // Complete this week
  | 'monthly'       // Complete this month
  | 'event';        // Special limited-time

export type UserTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const BADGE_DEFINITIONS: Record<string, Omit<Badge, 'id' | 'earnedAt'>> = {
  // Savings Badges
  first_savings_goal: {
    name: 'Goal Setter',
    nameHi: 'लक्ष्य निर्धारक',
    description: 'Set your first savings goal',
    descriptionHi: 'अपना पहला बचत लक्ष्य निर्धारित करें',
    icon: 'target',
    rarity: 'common',
    category: 'savings',
  },
  savings_10k: {
    name: 'Saver Bronze',
    nameHi: 'कांस्य बचतकर्ता',
    description: 'Save your first ₹10,000',
    descriptionHi: 'अपनी पहली ₹10,000 बचाएं',
    icon: 'piggy-bank',
    rarity: 'common',
    category: 'savings',
  },
  savings_1_lakh: {
    name: 'Saver Silver',
    nameHi: 'रजत बचतकर्ता',
    description: 'Save ₹1,00,000',
    descriptionHi: '₹1,00,000 बचाएं',
    icon: 'piggy-bank',
    rarity: 'rare',
    category: 'savings',
  },
  savings_10_lakh: {
    name: 'Saver Gold',
    nameHi: 'स्वर्ण बचतकर्ता',
    description: 'Save ₹10,00,000',
    descriptionHi: '₹10,00,000 बचाएं',
    icon: 'trophy',
    rarity: 'epic',
    category: 'savings',
  },

  // Budget Badges
  first_budget: {
    name: 'Budget Beginner',
    nameHi: 'बजट शुरुआती',
    description: 'Create your first budget',
    descriptionHi: 'अपना पहला बजट बनाएं',
    icon: 'calculator',
    rarity: 'common',
    category: 'budgeting',
  },
  budget_streak_7: {
    name: 'Budget Champion',
    nameHi: 'बजट चैंपियन',
    description: 'Stay within budget for 7 days',
    descriptionHi: '7 दिन बजट में रहें',
    icon: 'chart',
    rarity: 'rare',
    category: 'budgeting',
  },
  budget_streak_30: {
    name: 'Budget Master',
    nameHi: 'बजट मास्टर',
    description: 'Stay within budget for 30 days',
    descriptionHi: '30 दिन बजट में रहें',
    icon: 'crown',
    rarity: 'epic',
    category: 'budgeting',
  },

  // Investment Badges
  first_investment: {
    name: 'Investor',
    nameHi: 'निवेशक',
    description: 'Make your first investment',
    descriptionHi: 'अपना पहला निवेश करें',
    icon: 'trending-up',
    rarity: 'common',
    category: 'investing',
  },
  sip_starter: {
    name: 'SIP Starter',
    nameHi: 'एसआईपी स्टार्टर',
    description: 'Start your first SIP',
    descriptionHi: 'अपना पहला एसआईपी शुरू करें',
    icon: 'repeat',
    rarity: 'rare',
    category: 'investing',
  },
  diversified_portfolio: {
    name: 'Diversifier',
    nameHi: 'विविधकर्ता',
    description: 'Invest in 5+ different asset classes',
    descriptionHi: '5+ अलग-अलग एसेट क्लास में निवेश करें',
    icon: 'layers',
    rarity: 'epic',
    category: 'investing',
  },

  // Credit Badges
  credit_score_check: {
    name: 'Score Aware',
    nameHi: 'स्कोर जागरूक',
    description: 'Check your credit score',
    descriptionHi: 'अपना क्रेडिट स्कोर चेक करें',
    icon: 'shield',
    rarity: 'common',
    category: 'credit',
  },
  credit_score_700: {
    name: 'Credit Builder',
    nameHi: 'क्रेडिट बिल्डर',
    description: 'Achieve 700+ credit score',
    descriptionHi: '700+ क्रेडिट स्कोर प्राप्त करें',
    icon: 'award',
    rarity: 'rare',
    category: 'credit',
  },
  credit_score_800: {
    name: 'Credit Elite',
    nameHi: 'क्रेडिट एलीट',
    description: 'Achieve 800+ credit score',
    descriptionHi: '800+ क्रेडिट स्कोर प्राप्त करें',
    icon: 'star',
    rarity: 'legendary',
    category: 'credit',
  },

  // Insurance Badges
  first_policy: {
    name: 'Protected',
    nameHi: 'सुरक्षित',
    description: 'Link your first insurance policy',
    descriptionHi: 'अपनी पहली बीमा पॉलिसी लिंक करें',
    icon: 'shield-check',
    rarity: 'common',
    category: 'insurance',
  },
  health_coverage: {
    name: 'Health Guardian',
    nameHi: 'स्वास्थ्य अभिभावक',
    description: 'Have adequate health insurance',
    descriptionHi: 'पर्याप्त स्वास्थ्य बीमा रखें',
    icon: 'heart',
    rarity: 'rare',
    category: 'insurance',
  },
  fully_protected: {
    name: 'Fully Protected',
    nameHi: 'पूर्ण सुरक्षित',
    description: 'Have health, life, and vehicle insurance',
    descriptionHi: 'स्वास्थ्य, जीवन और वाहन बीमा रखें',
    icon: 'shield-plus',
    rarity: 'epic',
    category: 'insurance',
  },

  // Streak Badges
  streak_7: {
    name: 'Week Warrior',
    nameHi: 'सप्ताह योद्धा',
    description: '7 day activity streak',
    descriptionHi: '7 दिन की गतिविधि लकीर',
    icon: 'flame',
    rarity: 'common',
    category: 'streak',
  },
  streak_30: {
    name: 'Month Master',
    nameHi: 'महीना मास्टर',
    description: '30 day activity streak',
    descriptionHi: '30 दिन की गतिविधि लकीर',
    icon: 'flame',
    rarity: 'rare',
    category: 'streak',
  },
  streak_100: {
    name: 'Centurion',
    nameHi: 'शतक',
    description: '100 day activity streak',
    descriptionHi: '100 दिन की गतिविधि लकीर',
    icon: 'flame',
    rarity: 'epic',
    category: 'streak',
  },
  streak_365: {
    name: 'Financial Warrior',
    nameHi: 'वित्तीय योद्धा',
    description: '365 day activity streak',
    descriptionHi: '365 दिन की गतिविधि लकीर',
    icon: 'crown',
    rarity: 'legendary',
    category: 'streak',
  },

  // Learning Badges
  first_lesson: {
    name: 'Learner',
    nameHi: 'सीखने वाला',
    description: 'Complete your first financial lesson',
    descriptionHi: 'अपना पहला वित्तीय पाठ पूरा करें',
    icon: 'book-open',
    rarity: 'common',
    category: 'learning',
  },
  quiz_master: {
    name: 'Quiz Master',
    nameHi: 'क्विज़ मास्टर',
    description: 'Score 100% on 10 financial quizzes',
    descriptionHi: '10 वित्तीय क्विज़ में 100% अंक प्राप्त करें',
    icon: 'brain',
    rarity: 'epic',
    category: 'learning',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// XP AND LEVEL SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const XP_LEVELS = [
  0,       // Level 1
  100,     // Level 2
  300,     // Level 3
  600,     // Level 4
  1000,    // Level 5
  1500,    // Level 6
  2100,    // Level 7
  2800,    // Level 8
  3600,    // Level 9
  4500,    // Level 10
  5500,    // Level 11
  6600,    // Level 12
  7800,    // Level 13
  9100,    // Level 14
  10500,   // Level 15
  12000,   // Level 16
  13600,   // Level 17
  15300,   // Level 18
  17100,   // Level 19
  19000,   // Level 20
];

const TIER_THRESHOLDS: Record<UserTier, number> = {
  bronze: 0,
  silver: 5,
  gold: 10,
  platinum: 15,
  diamond: 20,
};

// ═══════════════════════════════════════════════════════════════════════════════
// XP REWARDS PER ACTION
// ═══════════════════════════════════════════════════════════════════════════════

const XP_REWARDS: Record<string, number> = {
  // Daily actions
  daily_login: 5,
  check_balance: 2,
  review_spending: 10,

  // Financial actions
  set_savings_goal: 25,
  achieve_savings_goal: 100,
  create_budget: 20,
  stay_within_budget: 15,
  check_credit_score: 15,
  make_investment: 30,
  start_sip: 50,
  link_account: 40,
  link_insurance: 30,

  // Learning
  complete_lesson: 20,
  pass_quiz: 25,
  perfect_quiz: 50,

  // Social
  refer_friend: 100,
  friend_joins: 50,

  // Streaks
  streak_bonus_7: 50,
  streak_bonus_30: 200,
  streak_bonus_100: 500,
};

// ═══════════════════════════════════════════════════════════════════════════════
// GAMIFICATION ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class BFCGamificationEngine {
  private bfcApiUrl: string;
  private eonApiUrl: string;

  constructor(config?: {
    bfcApiUrl?: string;
    eonApiUrl?: string;
  }) {
    this.bfcApiUrl = config?.bfcApiUrl || process.env.BFC_API_URL || 'http://localhost:4020';
    this.eonApiUrl = config?.eonApiUrl || process.env.EON_API_URL || 'http://localhost:4005';
  }

  /**
   * Process a financial episode and award XP/points/badges
   */
  async processEpisode(episode: FinancialEpisode): Promise<GamificationReward[]> {
    const rewards: GamificationReward[] = [];

    // Map intent to XP action
    const xpAction = this.mapIntentToXPAction(episode.action.intent);
    if (xpAction) {
      const xp = XP_REWARDS[xpAction] || 5;
      rewards.push({
        type: 'xp',
        amount: xp,
        reason: episode.action.description,
        reasonHi: episode.action.descriptionHi,
      });
    }

    // Award points for successful actions
    if (episode.outcome.success) {
      const points = this.calculatePointsForEpisode(episode);
      if (points > 0) {
        rewards.push({
          type: 'points',
          amount: points,
          reason: episode.action.description,
          reasonHi: episode.action.descriptionHi,
        });
      }
    }

    // Check for badge eligibility
    const badges = await this.checkBadgeEligibility(episode);
    for (const badge of badges) {
      rewards.push({
        type: 'badge',
        badge,
        reason: `Earned ${badge.name}`,
        reasonHi: `${badge.nameHi} अर्जित किया`,
      });
    }

    // Apply rewards to user profile
    if (rewards.length > 0) {
      await this.applyRewards(episode.userId, rewards);
    }

    return rewards;
  }

  /**
   * Map intent to XP action
   */
  private mapIntentToXPAction(intent: string): string | null {
    const mapping: Record<string, string> = {
      credit_eligibility_check: 'check_credit_score',
      credit_score_check: 'check_credit_score',
      loan_apply: 'make_investment',
      insurance_quote_request: 'link_insurance',
      investment_recommend: 'review_spending',
      investment_portfolio_view: 'check_balance',
      financial_goal_set: 'set_savings_goal',
      financial_goal_progress: 'check_balance',
      spending_analysis: 'review_spending',
      budget_set: 'create_budget',
      account_link: 'link_account',
      account_summary: 'check_balance',
      offers_view: 'daily_login',
      rewards_check: 'daily_login',
    };

    return mapping[intent] || null;
  }

  /**
   * Calculate points for an episode
   */
  private calculatePointsForEpisode(episode: FinancialEpisode): number {
    const basePoints: Record<FinancialModule, number> = {
      credit: 10,
      insurance: 15,
      investment: 20,
      savings: 15,
      payments: 5,
      rewards: 5,
      account: 25,
      advice: 10,
    };

    return basePoints[episode.module] || 5;
  }

  /**
   * Check if episode unlocks any badges
   */
  private async checkBadgeEligibility(episode: FinancialEpisode): Promise<Badge[]> {
    const badges: Badge[] = [];
    const userId = episode.userId;

    // Get user's current badges
    const profile = await this.getProfile(userId);
    const earnedBadgeIds = new Set(profile?.badges.map(b => b.id) || []);

    // Check intent-specific badges
    const badgeChecks: Array<{ condition: boolean; badgeId: string }> = [
      // First-time badges
      {
        condition: episode.action.intent === 'financial_goal_set' && !earnedBadgeIds.has('first_savings_goal'),
        badgeId: 'first_savings_goal',
      },
      {
        condition: episode.action.intent === 'budget_set' && !earnedBadgeIds.has('first_budget'),
        badgeId: 'first_budget',
      },
      {
        condition: episode.action.intent === 'investment_recommend' && !earnedBadgeIds.has('first_investment'),
        badgeId: 'first_investment',
      },
      {
        condition: episode.action.intent === 'credit_score_check' && !earnedBadgeIds.has('credit_score_check'),
        badgeId: 'credit_score_check',
      },
      {
        condition: episode.action.intent === 'account_link' && !earnedBadgeIds.has('first_policy'),
        badgeId: 'first_policy',
      },
    ];

    for (const check of badgeChecks) {
      if (check.condition) {
        const badgeDef = BADGE_DEFINITIONS[check.badgeId];
        if (badgeDef) {
          badges.push({
            id: check.badgeId,
            ...badgeDef,
            earnedAt: new Date(),
          });
        }
      }
    }

    return badges;
  }

  /**
   * Get user's gamification profile
   */
  async getProfile(userId: string): Promise<UserGamificationProfile | null> {
    try {
      const response = await fetch(`${this.bfcApiUrl}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetGamificationProfile($userId: ID!) {
              gamificationProfile(userId: $userId) {
                userId
                level
                xp
                xpToNextLevel
                totalPoints
                availablePoints
                streak { current longest lastActiveDate }
                badges { id name nameHi icon rarity earnedAt }
                tier
              }
            }
          `,
          variables: { userId },
        }),
      });

      const data = await response.json() as any;
      return data.data?.gamificationProfile;
    } catch (error) {
      console.error('[Gamification] Failed to get profile:', error);
      return null;
    }
  }

  /**
   * Apply rewards to user profile
   */
  private async applyRewards(userId: string, rewards: GamificationReward[]): Promise<void> {
    try {
      await fetch(`${this.bfcApiUrl}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation ApplyGamificationRewards($userId: ID!, $rewards: [RewardInput!]!) {
              applyRewards(userId: $userId, rewards: $rewards) {
                success
                newLevel
                newBadges
              }
            }
          `,
          variables: {
            userId,
            rewards: rewards.map(r => ({
              type: r.type,
              amount: r.amount,
              badgeId: r.badge?.id,
              reason: r.reason,
            })),
          },
        }),
      });
    } catch (error) {
      console.error('[Gamification] Failed to apply rewards:', error);
    }
  }

  /**
   * Get daily challenges for a user
   */
  async getDailyChallenges(userId: string): Promise<Challenge[]> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return [
      {
        id: `daily_${today.toISOString().split('T')[0]}_balance`,
        name: 'Check Your Balance',
        nameHi: 'अपना बैलेंस चेक करें',
        description: 'View your account summary today',
        descriptionHi: 'आज अपना खाता सारांश देखें',
        type: 'daily',
        target: 1,
        progress: 0,
        xpReward: 10,
        pointsReward: 5,
        startDate: today,
        endDate: tomorrow,
        status: 'active',
        category: 'account',
      },
      {
        id: `daily_${today.toISOString().split('T')[0]}_spending`,
        name: 'Review Spending',
        nameHi: 'खर्च समीक्षा',
        description: 'Check your spending analysis',
        descriptionHi: 'अपना खर्च विश्लेषण देखें',
        type: 'daily',
        target: 1,
        progress: 0,
        xpReward: 15,
        pointsReward: 10,
        startDate: today,
        endDate: tomorrow,
        status: 'active',
        category: 'savings',
      },
    ];
  }

  /**
   * Get weekly challenges
   */
  async getWeeklyChallenges(userId: string): Promise<Challenge[]> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return [
      {
        id: `weekly_${startOfWeek.toISOString().split('T')[0]}_budget`,
        name: 'Budget Keeper',
        nameHi: 'बजट रक्षक',
        description: 'Stay within budget for 7 days',
        descriptionHi: '7 दिन बजट में रहें',
        type: 'weekly',
        target: 7,
        progress: 0,
        xpReward: 100,
        pointsReward: 50,
        startDate: startOfWeek,
        endDate: endOfWeek,
        status: 'active',
        category: 'savings',
      },
      {
        id: `weekly_${startOfWeek.toISOString().split('T')[0]}_goals`,
        name: 'Goal Progress',
        nameHi: 'लक्ष्य प्रगति',
        description: 'Add money towards 3 goals this week',
        descriptionHi: 'इस सप्ताह 3 लक्ष्यों में पैसा जोड़ें',
        type: 'weekly',
        target: 3,
        progress: 0,
        xpReward: 75,
        pointsReward: 40,
        startDate: startOfWeek,
        endDate: endOfWeek,
        status: 'active',
        category: 'savings',
      },
    ];
  }

  /**
   * Calculate user level from XP
   */
  calculateLevel(xp: number): { level: number; xpToNextLevel: number } {
    let level = 1;
    for (let i = 0; i < XP_LEVELS.length; i++) {
      if (xp >= XP_LEVELS[i]) {
        level = i + 1;
      } else {
        break;
      }
    }

    const xpToNextLevel = level < XP_LEVELS.length
      ? XP_LEVELS[level] - xp
      : 0;

    return { level, xpToNextLevel };
  }

  /**
   * Get tier from level
   */
  getTierFromLevel(level: number): UserTier {
    if (level >= TIER_THRESHOLDS.diamond) return 'diamond';
    if (level >= TIER_THRESHOLDS.platinum) return 'platinum';
    if (level >= TIER_THRESHOLDS.gold) return 'gold';
    if (level >= TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  }

  /**
   * Get voice response for reward notification
   */
  getRewardNotification(rewards: GamificationReward[], language: string): string {
    const messages: Record<string, Record<string, string>> = {
      en: {
        xp: 'You earned ${amount} XP!',
        points: 'You earned ${amount} points!',
        badge: 'Congratulations! You earned the ${badge} badge!',
        level_up: 'Level up! You are now level ${level}!',
      },
      hi: {
        xp: 'आपने ${amount} XP अर्जित किए!',
        points: 'आपने ${amount} पॉइंट्स अर्जित किए!',
        badge: 'बधाई हो! आपने ${badge} बैज अर्जित किया!',
        level_up: 'लेवल अप! आप अब लेवल ${level} पर हैं!',
      },
    };

    const lang = messages[language] || messages.en;
    const parts: string[] = [];

    for (const reward of rewards) {
      if (reward.type === 'xp') {
        parts.push(lang.xp.replace('${amount}', reward.amount!.toString()));
      } else if (reward.type === 'points') {
        parts.push(lang.points.replace('${amount}', reward.amount!.toString()));
      } else if (reward.type === 'badge' && reward.badge) {
        parts.push(lang.badge.replace('${badge}', language === 'hi' ? reward.badge.nameHi : reward.badge.name));
      }
    }

    return parts.join(' ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REWARD TYPE
// ═══════════════════════════════════════════════════════════════════════════════

export interface GamificationReward {
  type: 'xp' | 'points' | 'badge' | 'level_up';
  amount?: number;
  badge?: Badge;
  reason: string;
  reasonHi?: string;
}

// Export singleton instance
export const bfcGamificationEngine = new BFCGamificationEngine();

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { BADGE_DEFINITIONS, XP_REWARDS, XP_LEVELS, TIER_THRESHOLDS };
