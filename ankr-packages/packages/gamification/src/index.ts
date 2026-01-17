/**
 * @ankr/gamification
 * Complete gamification engine for engagement and behavioral change
 *
 * Features:
 * - Points system with transaction history
 * - Badge definitions with rarity tiers
 * - Tier progression (Bronze to Diamond)
 * - Streak tracking with milestones
 * - Challenge system with progress tracking
 * - Leaderboard generation
 * - Reward redemption
 */

// ============================================================================
// Types
// ============================================================================

export type GamificationTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export type PointsTransactionType =
  | 'SAFE_TRIP'
  | 'DAILY_STEPS_GOAL'
  | 'STREAK_BONUS'
  | 'BADGE_EARNED'
  | 'CHALLENGE_COMPLETE'
  | 'REFERRAL_BONUS'
  | 'PREMIUM_PAID'
  | 'CLAIM_FREE_BONUS'
  | 'REWARD_REDEMPTION'
  | 'MANUAL_ADJUSTMENT'
  | 'SIGNUP_BONUS'
  | 'PROFILE_COMPLETE'
  | 'HEALTH_CHECKUP'
  | 'CUSTOM';

export type BadgeRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type BadgeCategory = 'DRIVING' | 'HEALTH' | 'LOYALTY' | 'ENGAGEMENT' | 'SPECIAL' | 'CUSTOM';

export type ChallengeType =
  | 'SAFE_DRIVING'
  | 'STEPS'
  | 'REFERRALS'
  | 'ENGAGEMENT'
  | 'WELLNESS'
  | 'CUSTOM';

export type ChallengeStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export interface BadgeDefinition {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  criteria: {
    type: string;
    threshold: number;
    unit?: string;
  };
  points?: number;
}

export interface PointsTransaction {
  id: string;
  points: number;
  type: PointsTransactionType;
  description: string;
  sourceType: string;
  sourceId?: string;
  balanceAfter: number;
  createdAt: Date;
}

export interface Badge {
  id: string;
  badgeCode: string;
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
  badgeCategory: BadgeCategory;
  rarity: BadgeRarity;
  earnedAt: Date;
  earnedFor?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  challengeType: ChallengeType;
  goalValue: number;
  goalUnit: string;
  pointsReward: number;
  badgeReward?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  maxParticipants?: number;
  currentParticipants: number;
}

export interface ChallengeParticipation {
  id: string;
  challengeId: string;
  challenge?: Challenge;
  status: ChallengeStatus;
  currentProgress: number;
  progressPercent: number;
  pointsEarned: number;
  badgeEarned?: string;
  joinedAt: Date;
  completedAt?: Date;
}

export interface GamificationProfile {
  id: string;
  totalPoints: number;
  currentPoints: number;
  lifetimePoints: number;
  tier: GamificationTier;
  currentStreak: number;
  longestStreak: number;
  streakType?: string;
  activeDays: number;
  thisMonthActiveDays: number;
  achievementsCount: number;
  rewardsRedeemed: number;
  rewardsValue: number;
  badgesEarned: string[];
  lastActivityAt?: Date;
  badges: Badge[];
  challenges: ChallengeParticipation[];
  pointsHistory: PointsTransaction[];
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  points: number;
  tier: GamificationTier;
  badges: number;
  isCurrentUser: boolean;
}

export interface PointsAward {
  id: string;
  points: number;
  type: PointsTransactionType;
  description: string;
  sourceType: string;
  sourceId?: string;
}

export interface Notification {
  type: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  data?: Record<string, any>;
}

// ============================================================================
// Storage Interface
// ============================================================================

export interface GamificationStorage {
  // Profile
  getProfile(userId: string): Promise<GamificationProfile | null>;
  createProfile(userId: string): Promise<GamificationProfile>;
  updateProfile(userId: string, data: Partial<GamificationProfile>): Promise<GamificationProfile>;

  // Points
  addPointsTransaction(userId: string, transaction: Omit<PointsTransaction, 'id' | 'createdAt'>): Promise<PointsTransaction>;
  getPointsHistory(userId: string, limit: number): Promise<PointsTransaction[]>;

  // Badges
  awardBadge(userId: string, badge: Omit<Badge, 'id' | 'earnedAt'>): Promise<Badge>;
  getBadges(userId: string): Promise<Badge[]>;
  hasBadge(userId: string, badgeCode: string): Promise<boolean>;

  // Challenges
  getChallenge(challengeId: string): Promise<Challenge | null>;
  getActiveChallenges(): Promise<Challenge[]>;
  getParticipation(userId: string, challengeId: string): Promise<ChallengeParticipation | null>;
  joinChallenge(userId: string, challengeId: string): Promise<ChallengeParticipation>;
  updateParticipation(participationId: string, data: Partial<ChallengeParticipation>): Promise<ChallengeParticipation>;
  getUserChallenges(userId: string): Promise<ChallengeParticipation[]>;

  // Leaderboard
  getLeaderboard(limit: number): Promise<Array<{ userId: string; name: string; points: number; tier: GamificationTier; badges: number }>>;
}

// ============================================================================
// In-Memory Storage
// ============================================================================

export class InMemoryGamificationStorage implements GamificationStorage {
  private profiles: Map<string, GamificationProfile> = new Map();
  private transactions: Map<string, PointsTransaction[]> = new Map();
  private badges: Map<string, Badge[]> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private participations: Map<string, ChallengeParticipation[]> = new Map();
  private idCounter = 0;

  private generateId(): string {
    return `${Date.now()}_${++this.idCounter}`;
  }

  async getProfile(userId: string): Promise<GamificationProfile | null> {
    return this.profiles.get(userId) || null;
  }

  async createProfile(userId: string): Promise<GamificationProfile> {
    const profile: GamificationProfile = {
      id: this.generateId(),
      totalPoints: 0,
      currentPoints: 0,
      lifetimePoints: 0,
      tier: 'BRONZE',
      currentStreak: 0,
      longestStreak: 0,
      activeDays: 0,
      thisMonthActiveDays: 0,
      achievementsCount: 0,
      rewardsRedeemed: 0,
      rewardsValue: 0,
      badgesEarned: [],
      badges: [],
      challenges: [],
      pointsHistory: [],
    };
    this.profiles.set(userId, profile);
    this.transactions.set(userId, []);
    this.badges.set(userId, []);
    this.participations.set(userId, []);
    return profile;
  }

  async updateProfile(userId: string, data: Partial<GamificationProfile>): Promise<GamificationProfile> {
    const profile = this.profiles.get(userId);
    if (!profile) throw new Error('Profile not found');
    Object.assign(profile, data);
    return profile;
  }

  async addPointsTransaction(userId: string, transaction: Omit<PointsTransaction, 'id' | 'createdAt'>): Promise<PointsTransaction> {
    const txn: PointsTransaction = {
      ...transaction,
      id: this.generateId(),
      createdAt: new Date(),
    };
    const userTxns = this.transactions.get(userId) || [];
    userTxns.push(txn);
    this.transactions.set(userId, userTxns);
    return txn;
  }

  async getPointsHistory(userId: string, limit: number): Promise<PointsTransaction[]> {
    const txns = this.transactions.get(userId) || [];
    return txns.slice(-limit).reverse();
  }

  async awardBadge(userId: string, badge: Omit<Badge, 'id' | 'earnedAt'>): Promise<Badge> {
    const fullBadge: Badge = {
      ...badge,
      id: this.generateId(),
      earnedAt: new Date(),
    };
    const userBadges = this.badges.get(userId) || [];
    userBadges.push(fullBadge);
    this.badges.set(userId, userBadges);
    return fullBadge;
  }

  async getBadges(userId: string): Promise<Badge[]> {
    return this.badges.get(userId) || [];
  }

  async hasBadge(userId: string, badgeCode: string): Promise<boolean> {
    const userBadges = this.badges.get(userId) || [];
    return userBadges.some((b) => b.badgeCode === badgeCode);
  }

  async getChallenge(challengeId: string): Promise<Challenge | null> {
    return this.challenges.get(challengeId) || null;
  }

  async getActiveChallenges(): Promise<Challenge[]> {
    return Array.from(this.challenges.values()).filter((c) => c.isActive);
  }

  async getParticipation(userId: string, challengeId: string): Promise<ChallengeParticipation | null> {
    const userParts = this.participations.get(userId) || [];
    return userParts.find((p) => p.challengeId === challengeId) || null;
  }

  async joinChallenge(userId: string, challengeId: string): Promise<ChallengeParticipation> {
    const participation: ChallengeParticipation = {
      id: this.generateId(),
      challengeId,
      status: 'ACTIVE',
      currentProgress: 0,
      progressPercent: 0,
      pointsEarned: 0,
      joinedAt: new Date(),
    };
    const userParts = this.participations.get(userId) || [];
    userParts.push(participation);
    this.participations.set(userId, userParts);
    return participation;
  }

  async updateParticipation(participationId: string, data: Partial<ChallengeParticipation>): Promise<ChallengeParticipation> {
    for (const [, parts] of this.participations) {
      const part = parts.find((p) => p.id === participationId);
      if (part) {
        Object.assign(part, data);
        return part;
      }
    }
    throw new Error('Participation not found');
  }

  async getUserChallenges(userId: string): Promise<ChallengeParticipation[]> {
    return this.participations.get(userId) || [];
  }

  async getLeaderboard(limit: number): Promise<Array<{ userId: string; name: string; points: number; tier: GamificationTier; badges: number }>> {
    return Array.from(this.profiles.entries())
      .map(([userId, profile]) => ({
        userId,
        name: `User ${userId.slice(0, 6)}`,
        points: profile.totalPoints,
        tier: profile.tier,
        badges: profile.achievementsCount,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }

  // Helper to add a challenge
  addChallenge(challenge: Challenge): void {
    this.challenges.set(challenge.id, challenge);
  }
}

// ============================================================================
// Default Badges
// ============================================================================

export const DEFAULT_BADGES: BadgeDefinition[] = [
  // Driving badges
  { code: 'SAFE_STARTER', name: 'Safe Starter', description: 'Complete your first safe trip', icon: '🚗', category: 'DRIVING', rarity: 'COMMON', criteria: { type: 'SAFE_TRIPS', threshold: 1 }, points: 50 },
  { code: 'ROAD_WARRIOR', name: 'Road Warrior', description: '10 safe trips in a row', icon: '🛡️', category: 'DRIVING', rarity: 'RARE', criteria: { type: 'SAFE_TRIPS', threshold: 10 }, points: 100 },
  { code: 'HIGHWAY_HERO', name: 'Highway Hero', description: '50 safe trips', icon: '🏆', category: 'DRIVING', rarity: 'EPIC', criteria: { type: 'SAFE_TRIPS', threshold: 50 }, points: 250 },
  { code: 'CENTURY_DRIVER', name: 'Century Driver', description: '100 safe trips', icon: '💯', category: 'DRIVING', rarity: 'LEGENDARY', criteria: { type: 'SAFE_TRIPS', threshold: 100 }, points: 500 },
  { code: 'SPEED_MASTER', name: 'Speed Master', description: 'No speeding for 30 days', icon: '⚡', category: 'DRIVING', rarity: 'RARE', criteria: { type: 'NO_SPEEDING_DAYS', threshold: 30 }, points: 100 },
  { code: 'PHONE_FREE', name: 'Phone-Free Driver', description: 'No phone usage for 7 days', icon: '📵', category: 'DRIVING', rarity: 'RARE', criteria: { type: 'NO_PHONE_DAYS', threshold: 7 }, points: 100 },
  { code: 'NIGHT_OWL', name: 'Night Owl', description: '10 safe night trips', icon: '🌙', category: 'DRIVING', rarity: 'RARE', criteria: { type: 'NIGHT_TRIPS', threshold: 10 }, points: 100 },

  // Health badges
  { code: 'STEP_STARTER', name: 'Step Starter', description: 'Hit 10,000 steps in a day', icon: '👟', category: 'HEALTH', rarity: 'COMMON', criteria: { type: 'DAILY_STEPS', threshold: 10000 }, points: 50 },
  { code: 'MARATHON_WALKER', name: 'Marathon Walker', description: '42km walked in a week', icon: '🏃', category: 'HEALTH', rarity: 'RARE', criteria: { type: 'WEEKLY_DISTANCE', threshold: 42 }, points: 100 },
  { code: 'SLEEP_CHAMPION', name: 'Sleep Champion', description: '7+ hours sleep for 7 days', icon: '😴', category: 'HEALTH', rarity: 'RARE', criteria: { type: 'GOOD_SLEEP_DAYS', threshold: 7 }, points: 100 },
  { code: 'HEALTH_NUT', name: 'Health Nut', description: 'Complete annual health checkup', icon: '🩺', category: 'HEALTH', rarity: 'EPIC', criteria: { type: 'HEALTH_CHECKUP', threshold: 1 }, points: 250 },
  { code: 'FITNESS_FREAK', name: 'Fitness Freak', description: '30 day workout streak', icon: '💪', category: 'HEALTH', rarity: 'EPIC', criteria: { type: 'WORKOUT_STREAK', threshold: 30 }, points: 250 },

  // Loyalty badges
  { code: 'LOYAL_CUSTOMER', name: 'Loyal Customer', description: '1 year with us', icon: '💎', category: 'LOYALTY', rarity: 'RARE', criteria: { type: 'TENURE_YEARS', threshold: 1 }, points: 100 },
  { code: 'VETERAN', name: 'Veteran', description: '3 years with us', icon: '🎖️', category: 'LOYALTY', rarity: 'EPIC', criteria: { type: 'TENURE_YEARS', threshold: 3 }, points: 250 },
  { code: 'CLAIM_FREE', name: 'Claim-Free Champion', description: 'No claims for 1 year', icon: '🏅', category: 'LOYALTY', rarity: 'EPIC', criteria: { type: 'CLAIM_FREE_YEARS', threshold: 1 }, points: 250 },
  { code: 'REFERRAL_STARTER', name: 'Referral Starter', description: 'Refer 1 friend', icon: '🤝', category: 'LOYALTY', rarity: 'COMMON', criteria: { type: 'REFERRALS', threshold: 1 }, points: 50 },
  { code: 'REFERRAL_KING', name: 'Referral King', description: 'Refer 5 friends', icon: '👑', category: 'LOYALTY', rarity: 'EPIC', criteria: { type: 'REFERRALS', threshold: 5 }, points: 250 },

  // Engagement badges
  { code: 'EARLY_BIRD', name: 'Early Bird', description: 'Login before 6 AM', icon: '🌅', category: 'ENGAGEMENT', rarity: 'COMMON', criteria: { type: 'EARLY_LOGIN', threshold: 1 }, points: 50 },
  { code: 'STREAK_7', name: 'Week Warrior', description: '7 day activity streak', icon: '🔥', category: 'ENGAGEMENT', rarity: 'COMMON', criteria: { type: 'STREAK_DAYS', threshold: 7 }, points: 50 },
  { code: 'STREAK_30', name: 'Month Master', description: '30 day activity streak', icon: '🔥🔥', category: 'ENGAGEMENT', rarity: 'RARE', criteria: { type: 'STREAK_DAYS', threshold: 30 }, points: 100 },
  { code: 'STREAK_100', name: 'Century Streak', description: '100 day activity streak', icon: '🔥🔥🔥', category: 'ENGAGEMENT', rarity: 'LEGENDARY', criteria: { type: 'STREAK_DAYS', threshold: 100 }, points: 500 },
  { code: 'PROFILE_COMPLETE', name: 'Complete Profile', description: 'Fill out all profile details', icon: '✅', category: 'ENGAGEMENT', rarity: 'COMMON', criteria: { type: 'PROFILE_COMPLETE', threshold: 1 }, points: 50 },

  // Special badges
  { code: 'EARLY_ADOPTER', name: 'Early Adopter', description: 'One of our first users', icon: '🌟', category: 'SPECIAL', rarity: 'LEGENDARY', criteria: { type: 'SPECIAL', threshold: 1 }, points: 500 },
  { code: 'PERFECT_MONTH', name: 'Perfect Month', description: 'Perfect safety score for 30 days', icon: '✨', category: 'SPECIAL', rarity: 'LEGENDARY', criteria: { type: 'PERFECT_SCORE_DAYS', threshold: 30 }, points: 500 },
  { code: 'FIRST_CLAIM', name: 'First Claim', description: 'Successfully filed first claim', icon: '📋', category: 'SPECIAL', rarity: 'COMMON', criteria: { type: 'CLAIMS_FILED', threshold: 1 }, points: 50 },
];

// ============================================================================
// Tier Configuration
// ============================================================================

export const TIER_THRESHOLDS: Record<GamificationTier, number> = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 15000,
  DIAMOND: 50000,
};

export const TIER_BENEFITS: Record<GamificationTier, { pointsMultiplier: number; premiumDiscount: number; benefits: string[] }> = {
  BRONZE: { pointsMultiplier: 1.0, premiumDiscount: 0, benefits: ['Access to basic rewards'] },
  SILVER: { pointsMultiplier: 1.1, premiumDiscount: 2, benefits: ['10% bonus points', '2% premium discount'] },
  GOLD: { pointsMultiplier: 1.25, premiumDiscount: 5, benefits: ['25% bonus points', '5% premium discount', 'Priority support'] },
  PLATINUM: { pointsMultiplier: 1.5, premiumDiscount: 10, benefits: ['50% bonus points', '10% premium discount', 'Priority support', 'Exclusive rewards'] },
  DIAMOND: { pointsMultiplier: 2.0, premiumDiscount: 15, benefits: ['100% bonus points', '15% premium discount', 'Dedicated support', 'VIP experiences'] },
};

// ============================================================================
// Rarity Points
// ============================================================================

export const RARITY_POINTS: Record<BadgeRarity, number> = {
  COMMON: 50,
  RARE: 100,
  EPIC: 250,
  LEGENDARY: 500,
};

// ============================================================================
// Streak Milestones
// ============================================================================

export const STREAK_MILESTONES = [7, 14, 30, 60, 100, 365];

// ============================================================================
// Gamification Engine
// ============================================================================

export class GamificationEngine {
  private storage: GamificationStorage;
  private badges: BadgeDefinition[];
  private onNotification?: (userId: string, notification: Notification) => void;

  constructor(
    storage: GamificationStorage,
    options?: {
      badges?: BadgeDefinition[];
      onNotification?: (userId: string, notification: Notification) => void;
    }
  ) {
    this.storage = storage;
    this.badges = options?.badges || DEFAULT_BADGES;
    this.onNotification = options?.onNotification;
  }

  /**
   * Get or create profile
   */
  async getProfile(userId: string): Promise<GamificationProfile> {
    let profile = await this.storage.getProfile(userId);
    if (!profile) {
      profile = await this.storage.createProfile(userId);
    }
    profile.badges = await this.storage.getBadges(userId);
    profile.pointsHistory = await this.storage.getPointsHistory(userId, 10);
    profile.challenges = await this.storage.getUserChallenges(userId);
    return profile;
  }

  /**
   * Award points
   */
  async awardPoints(userId: string, award: PointsAward): Promise<PointsTransaction> {
    const profile = await this.getProfile(userId);

    // Apply tier multiplier
    const multiplier = TIER_BENEFITS[profile.tier].pointsMultiplier;
    const adjustedPoints = Math.round(award.points * multiplier);

    const transaction = await this.storage.addPointsTransaction(userId, {
      points: adjustedPoints,
      type: award.type,
      description: award.description,
      sourceType: award.sourceType,
      sourceId: award.sourceId,
      balanceAfter: profile.currentPoints + adjustedPoints,
    });

    await this.storage.updateProfile(userId, {
      totalPoints: profile.totalPoints + adjustedPoints,
      currentPoints: profile.currentPoints + adjustedPoints,
      lifetimePoints: profile.lifetimePoints + adjustedPoints,
      lastActivityAt: new Date(),
    });

    // Check tier upgrade
    await this.checkTierUpgrade(userId);

    return transaction;
  }

  /**
   * Spend points (redemption)
   */
  async spendPoints(userId: string, points: number, description: string): Promise<PointsTransaction> {
    const profile = await this.getProfile(userId);

    if (profile.currentPoints < points) {
      throw new Error(`Insufficient points. Available: ${profile.currentPoints}, Required: ${points}`);
    }

    const transaction = await this.storage.addPointsTransaction(userId, {
      points: -points,
      type: 'REWARD_REDEMPTION',
      description,
      sourceType: 'REDEMPTION',
      balanceAfter: profile.currentPoints - points,
    });

    await this.storage.updateProfile(userId, {
      currentPoints: profile.currentPoints - points,
      rewardsRedeemed: profile.rewardsRedeemed + 1,
      rewardsValue: profile.rewardsValue + this.pointsToValue(points),
    });

    return transaction;
  }

  /**
   * Award badge
   */
  async awardBadge(userId: string, badgeCode: string, earnedFor?: string): Promise<Badge | null> {
    const badgeDef = this.badges.find((b) => b.code === badgeCode);
    if (!badgeDef) {
      throw new Error(`Badge ${badgeCode} not found`);
    }

    // Check if already earned
    const hasBadge = await this.storage.hasBadge(userId, badgeCode);
    if (hasBadge) {
      return null;
    }

    const badge = await this.storage.awardBadge(userId, {
      badgeCode: badgeDef.code,
      badgeName: badgeDef.name,
      badgeDescription: badgeDef.description,
      badgeIcon: badgeDef.icon,
      badgeCategory: badgeDef.category,
      rarity: badgeDef.rarity,
      earnedFor,
    });

    // Award points for badge
    const badgePoints = badgeDef.points || RARITY_POINTS[badgeDef.rarity];
    await this.awardPoints(userId, {
      id: `badge_${badge.id}`,
      points: badgePoints,
      type: 'BADGE_EARNED',
      description: `Earned badge: ${badgeDef.name}`,
      sourceType: 'BADGE',
      sourceId: badge.id,
    });

    // Update profile
    const profile = await this.getProfile(userId);
    await this.storage.updateProfile(userId, {
      achievementsCount: profile.achievementsCount + 1,
      badgesEarned: [...profile.badgesEarned, badgeCode],
    });

    // Send notification
    this.notify(userId, {
      type: 'BADGE_EARNED',
      title: `🏆 Badge Unlocked: ${badgeDef.name}`,
      message: badgeDef.description,
      priority: 'MEDIUM',
      category: 'GAMIFICATION',
      data: { badge: badgeDef, points: badgePoints },
    });

    return badge;
  }

  /**
   * Update streak
   */
  async updateStreak(userId: string, streakType: string): Promise<number> {
    const profile = await this.getProfile(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = profile.lastActivityAt ? new Date(profile.lastActivityAt) : null;
    lastActivity?.setHours(0, 0, 0, 0);

    let newStreak = profile.currentStreak;

    if (!lastActivity) {
      newStreak = 1;
    } else {
      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));

      if (daysDiff === 0) {
        // Same day
        return newStreak;
      } else if (daysDiff === 1) {
        // Consecutive day
        newStreak += 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    // Check milestones
    if (newStreak > profile.currentStreak) {
      for (const milestone of STREAK_MILESTONES) {
        if (newStreak === milestone && profile.currentStreak < milestone) {
          await this.awardPoints(userId, {
            id: `streak_${milestone}`,
            points: milestone * 5,
            type: 'STREAK_BONUS',
            description: `${milestone}-day streak milestone!`,
            sourceType: 'STREAK',
          });

          this.notify(userId, {
            type: 'STREAK_MILESTONE',
            title: `🔥 ${milestone}-Day Streak!`,
            message: `Amazing! You've maintained your streak for ${milestone} days. Keep going!`,
            priority: 'MEDIUM',
            category: 'GAMIFICATION',
          });
        }
      }
    }

    await this.storage.updateProfile(userId, {
      currentStreak: newStreak,
      longestStreak: Math.max(profile.longestStreak, newStreak),
      streakType,
      activeDays: profile.activeDays + 1,
      thisMonthActiveDays: profile.thisMonthActiveDays + 1,
      lastActivityAt: new Date(),
    });

    return newStreak;
  }

  /**
   * Join challenge
   */
  async joinChallenge(userId: string, challengeId: string): Promise<ChallengeParticipation> {
    const existing = await this.storage.getParticipation(userId, challengeId);
    if (existing) {
      throw new Error('Already participating in this challenge');
    }

    const challenge = await this.storage.getChallenge(challengeId);
    if (!challenge || !challenge.isActive) {
      throw new Error('Challenge not available');
    }

    if (challenge.maxParticipants && challenge.currentParticipants >= challenge.maxParticipants) {
      throw new Error('Challenge is full');
    }

    return this.storage.joinChallenge(userId, challengeId);
  }

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(userId: string, challengeType: ChallengeType, value: number): Promise<void> {
    const participations = await this.storage.getUserChallenges(userId);
    const activeParts = participations.filter((p) => p.status === 'ACTIVE');

    for (const participation of activeParts) {
      const challenge = await this.storage.getChallenge(participation.challengeId);
      if (!challenge || challenge.challengeType !== challengeType) continue;

      const newProgress = participation.currentProgress + value;
      const progressPercent = Math.min(100, (newProgress / challenge.goalValue) * 100);

      const updateData: Partial<ChallengeParticipation> = {
        currentProgress: newProgress,
        progressPercent,
      };

      // Check completion
      if (newProgress >= challenge.goalValue) {
        updateData.status = 'COMPLETED';
        updateData.completedAt = new Date();
        updateData.pointsEarned = challenge.pointsReward;

        // Award points
        await this.awardPoints(userId, {
          id: `challenge_${participation.id}`,
          points: challenge.pointsReward,
          type: 'CHALLENGE_COMPLETE',
          description: `Completed challenge: ${challenge.name}`,
          sourceType: 'CHALLENGE',
          sourceId: participation.challengeId,
        });

        // Award badge if applicable
        if (challenge.badgeReward) {
          await this.awardBadge(userId, challenge.badgeReward);
          updateData.badgeEarned = challenge.badgeReward;
        }

        this.notify(userId, {
          type: 'CHALLENGE_COMPLETE',
          title: `🎯 Challenge Complete: ${challenge.name}`,
          message: `You earned ${challenge.pointsReward} points!`,
          priority: 'HIGH',
          category: 'GAMIFICATION',
        });
      }

      await this.storage.updateParticipation(participation.id, updateData);
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(userId?: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    const entries = await this.storage.getLeaderboard(limit);

    return entries.map((e, index) => ({
      rank: index + 1,
      id: e.userId,
      name: e.name,
      points: e.points,
      tier: e.tier,
      badges: e.badges,
      isCurrentUser: e.userId === userId,
    }));
  }

  /**
   * Get available challenges
   */
  async getAvailableChallenges(userId?: string): Promise<Array<Challenge & { participation?: ChallengeParticipation; isJoined: boolean }>> {
    const challenges = await this.storage.getActiveChallenges();

    if (!userId) {
      return challenges.map((c) => ({ ...c, isJoined: false }));
    }

    const participations = await this.storage.getUserChallenges(userId);
    const partMap = new Map(participations.map((p) => [p.challengeId, p]));

    return challenges.map((c) => ({
      ...c,
      participation: partMap.get(c.id),
      isJoined: partMap.has(c.id),
    }));
  }

  /**
   * Get badge definitions
   */
  getBadgeDefinitions(): BadgeDefinition[] {
    return this.badges;
  }

  /**
   * Add custom badge
   */
  addBadge(badge: BadgeDefinition): void {
    this.badges.push(badge);
  }

  // Private methods

  private async checkTierUpgrade(userId: string): Promise<void> {
    const profile = await this.getProfile(userId);
    const tiers: GamificationTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
    const currentIndex = tiers.indexOf(profile.tier);

    for (let i = tiers.length - 1; i > currentIndex; i--) {
      const tier = tiers[i];
      if (profile.lifetimePoints >= TIER_THRESHOLDS[tier]) {
        await this.storage.updateProfile(userId, { tier });

        this.notify(userId, {
          type: 'TIER_UPGRADE',
          title: `🎉 Congratulations! You're now ${tier}!`,
          message: `You've reached ${tier} tier! Enjoy exclusive benefits and rewards.`,
          priority: 'HIGH',
          category: 'GAMIFICATION',
          data: { tier, benefits: TIER_BENEFITS[tier] },
        });

        break;
      }
    }
  }

  private notify(userId: string, notification: Notification): void {
    if (this.onNotification) {
      this.onNotification(userId, notification);
    }
  }

  private pointsToValue(points: number): number {
    return points / 100; // 100 points = 1 unit of currency
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createGamificationEngine(
  storage?: GamificationStorage,
  options?: {
    badges?: BadgeDefinition[];
    onNotification?: (userId: string, notification: Notification) => void;
  }
): GamificationEngine {
  return new GamificationEngine(storage || new InMemoryGamificationStorage(), options);
}

// Default export
export default GamificationEngine;
