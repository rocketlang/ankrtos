/**
 * @ankr/renewal-engine
 * Universal Renewal & Retention Engine
 * Handles policy renewal, loan renewal, subscription retention
 */

// Types
export type RenewalStatus =
  | 'UPCOMING'
  | 'NOTICE_SENT'
  | 'IN_PROGRESS'
  | 'RENEWED'
  | 'LAPSED'
  | 'CANCELLED';

export type ChurnRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export type RevivalStatus =
  | 'LAPSED'
  | 'REVIVAL_REQUESTED'
  | 'REVIVED'
  | 'REJECTED';

export interface RenewalTracker {
  id: string;
  entityType: string;
  entityId: string;
  entityNumber: string;
  customerId: string;
  customerName: string;
  productType: string;
  productCode: string;
  currentTermStart: Date;
  currentTermEnd: Date;
  renewalDueDate: Date;
  currentPremium?: number;
  sumInsured?: number;
  renewalPremium?: number;
  ncbPercentage?: number;
  loyaltyYears: number;
  loyaltyDiscount?: number;
  agentId?: string;
  agentName?: string;
  status: RenewalStatus;
  renewalProbability?: number;
  churnRisk?: ChurnRisk;
  churnReasons: string[];
  retentionActionsPlanned?: any[];
  retentionOffer?: string;
  retentionDiscount?: number;
  remindersSent: number;
  lastReminderAt?: Date;
  nextReminderAt?: Date;
  renewedAt?: Date;
  lapsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LapseRevival {
  id: string;
  trackerId: string;
  entityType: string;
  entityId: string;
  entityNumber: string;
  customerId: string;
  lapsedAt: Date;
  lapseDays: number;
  unpaidAmount: number;
  surrenderValue?: number;
  status: RevivalStatus;
  revivalRequestedAt?: Date;
  revivalType?: string;
  requiresMedical?: boolean;
  revivedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RenewalTrackerInput {
  entityType: string;
  entityId: string;
  entityNumber: string;
  customerId: string;
  customerName: string;
  productType: string;
  productCode: string;
  currentTermStart: Date;
  currentTermEnd: Date;
  renewalDueDate: Date;
  currentPremium?: number;
  sumInsured?: number;
  ncbPercentage?: number;
  loyaltyYears?: number;
  agentId?: string;
  agentName?: string;
}

export interface RenewalPrediction {
  probability: number;
  churnRisk: ChurnRisk;
  churnReasons: string[];
}

export interface CustomerBehaviorData {
  claimCount: number;
  paymentDelays: number;
  engagementScore: number;
}

export interface DashboardStats {
  upcoming: number;
  atRisk: number;
  thisMonth: { renewed: number; lapsed: number };
  renewalRate: number;
  byStatus: Record<string, number>;
}

export interface RetentionOffer {
  code: string;
  name: string;
  discountPercent: number;
  validDays: number;
  eligibleChurnRisks: ChurnRisk[];
}

// Storage Interface
export interface RenewalStorage {
  // Tracker operations
  createTracker(tracker: Omit<RenewalTracker, 'id' | 'createdAt' | 'updatedAt'>): Promise<RenewalTracker>;
  getTracker(id: string): Promise<RenewalTracker | null>;
  updateTracker(id: string, updates: Partial<RenewalTracker>): Promise<RenewalTracker>;
  findTrackers(filter: {
    status?: RenewalStatus[];
    churnRisk?: ChurnRisk[];
    renewalDueDateFrom?: Date;
    renewalDueDateTo?: Date;
    customerId?: string;
  }): Promise<RenewalTracker[]>;
  countTrackers(filter: {
    status?: RenewalStatus[];
    churnRisk?: ChurnRisk[];
    renewalDueDateFrom?: Date;
    renewalDueDateTo?: Date;
    renewedAfter?: Date;
    lapsedAfter?: Date;
  }): Promise<number>;
  groupByStatus(): Promise<{ status: RenewalStatus; count: number }[]>;

  // Lapse/Revival operations
  createLapseRecord(record: Omit<LapseRevival, 'id' | 'createdAt' | 'updatedAt'>): Promise<LapseRevival>;
  getLapseRecord(id: string): Promise<LapseRevival | null>;
  updateLapseRecord(id: string, updates: Partial<LapseRevival>): Promise<LapseRevival>;

  // Customer behavior (for churn prediction)
  getCustomerBehavior(customerId: string, termStart: Date): Promise<CustomerBehaviorData>;
}

// Default Retention Offers
export const DEFAULT_RETENTION_OFFERS: RetentionOffer[] = [
  {
    code: 'LOYALTY_5',
    name: 'Loyalty Reward',
    discountPercent: 5,
    validDays: 30,
    eligibleChurnRisks: ['LOW', 'MEDIUM'],
  },
  {
    code: 'WINBACK_10',
    name: 'Win-Back Special',
    discountPercent: 10,
    validDays: 14,
    eligibleChurnRisks: ['MEDIUM', 'HIGH'],
  },
  {
    code: 'PREMIUM_15',
    name: 'Premium Retention',
    discountPercent: 15,
    validDays: 7,
    eligibleChurnRisks: ['HIGH'],
  },
];

// Main Engine
export class RenewalEngine {
  private storage: RenewalStorage;
  private retentionOffers: RetentionOffer[];

  constructor(
    storage: RenewalStorage,
    options?: { retentionOffers?: RetentionOffer[] }
  ) {
    this.storage = storage;
    this.retentionOffers = options?.retentionOffers || DEFAULT_RETENTION_OFFERS;
  }

  /**
   * Create renewal tracker
   */
  async createTracker(input: RenewalTrackerInput): Promise<RenewalTracker> {
    return this.storage.createTracker({
      entityType: input.entityType,
      entityId: input.entityId,
      entityNumber: input.entityNumber,
      customerId: input.customerId,
      customerName: input.customerName,
      productType: input.productType,
      productCode: input.productCode,
      currentTermStart: input.currentTermStart,
      currentTermEnd: input.currentTermEnd,
      renewalDueDate: input.renewalDueDate,
      currentPremium: input.currentPremium,
      sumInsured: input.sumInsured,
      ncbPercentage: input.ncbPercentage,
      loyaltyYears: input.loyaltyYears || 0,
      agentId: input.agentId,
      agentName: input.agentName,
      status: 'UPCOMING',
      churnReasons: [],
      remindersSent: 0,
    });
  }

  /**
   * Get upcoming renewals
   */
  async getUpcomingRenewals(days: number = 30): Promise<RenewalTracker[]> {
    const now = new Date();
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.storage.findTrackers({
      status: ['UPCOMING', 'NOTICE_SENT', 'IN_PROGRESS'],
      renewalDueDateFrom: now,
      renewalDueDateTo: futureDate,
    });
  }

  /**
   * Get renewals at risk of churn
   */
  async getAtRiskRenewals(): Promise<RenewalTracker[]> {
    return this.storage.findTrackers({
      status: ['UPCOMING', 'NOTICE_SENT', 'IN_PROGRESS'],
      churnRisk: ['MEDIUM', 'HIGH'],
    });
  }

  /**
   * Predict renewal probability using behavioral data
   */
  async predictRenewalProbability(trackerId: string): Promise<RenewalPrediction> {
    const tracker = await this.storage.getTracker(trackerId);
    if (!tracker) throw new Error('Tracker not found');

    const behavior = await this.storage.getCustomerBehavior(
      tracker.customerId,
      tracker.currentTermStart
    );

    // Calculate probability based on factors
    let probability = 0.7; // Base probability
    const churnReasons: string[] = [];

    // Loyalty bonus
    if (tracker.loyaltyYears >= 3) {
      probability += 0.1;
    } else if (tracker.loyaltyYears === 0) {
      probability -= 0.05;
      churnReasons.push('First-year customer');
    }

    // NCB bonus (for motor/insurance)
    if (tracker.ncbPercentage && tracker.ncbPercentage >= 50) {
      probability += 0.1;
    }

    // Claims penalty
    if (behavior.claimCount > 2) {
      probability -= 0.15;
      churnReasons.push('Multiple claims in current term');
    } else if (behavior.claimCount > 0) {
      probability -= 0.05;
    }

    // Payment delay penalty
    if (behavior.paymentDelays > 3) {
      probability -= 0.1;
      churnReasons.push('Frequent payment delays');
    }

    // Engagement bonus
    if (behavior.engagementScore > 10) {
      probability += 0.05;
    } else if (behavior.engagementScore === 0) {
      probability -= 0.1;
      churnReasons.push('Low engagement');
    }

    // Clamp probability
    probability = Math.max(0.1, Math.min(0.95, probability));

    // Determine risk level
    let churnRisk: ChurnRisk = 'LOW';
    if (probability < 0.5) churnRisk = 'HIGH';
    else if (probability < 0.7) churnRisk = 'MEDIUM';

    // Update tracker
    await this.storage.updateTracker(trackerId, {
      renewalProbability: probability,
      churnRisk,
      churnReasons,
    });

    return { probability, churnRisk, churnReasons };
  }

  /**
   * Calculate renewal premium with discounts
   */
  async calculateRenewalPremium(trackerId: string): Promise<number> {
    const tracker = await this.storage.getTracker(trackerId);
    if (!tracker || !tracker.currentPremium) {
      throw new Error('Tracker or premium not found');
    }

    let renewalPremium = tracker.currentPremium;

    // Apply NCB discount (motor insurance)
    if (tracker.ncbPercentage) {
      renewalPremium *= (1 - tracker.ncbPercentage / 100);
    }

    // Apply loyalty discount
    let loyaltyDiscount = 0;
    if (tracker.loyaltyYears >= 5) {
      loyaltyDiscount = 5;
      renewalPremium *= 0.95;
    } else if (tracker.loyaltyYears >= 3) {
      loyaltyDiscount = 3;
      renewalPremium *= 0.97;
    }

    // Apply inflation/rate revision (5% increase)
    renewalPremium *= 1.05;

    // Update tracker
    await this.storage.updateTracker(trackerId, {
      renewalPremium,
      loyaltyDiscount,
    });

    return renewalPremium;
  }

  /**
   * Send renewal notice
   */
  async sendRenewalNotice(trackerId: string): Promise<RenewalTracker> {
    const tracker = await this.storage.getTracker(trackerId);
    if (!tracker) throw new Error('Tracker not found');

    return this.storage.updateTracker(trackerId, {
      status: 'NOTICE_SENT',
      remindersSent: tracker.remindersSent + 1,
      lastReminderAt: new Date(),
      nextReminderAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  /**
   * Plan retention actions
   */
  async planRetentionActions(trackerId: string, actions: any[]): Promise<RenewalTracker> {
    return this.storage.updateTracker(trackerId, {
      retentionActionsPlanned: actions,
    });
  }

  /**
   * Get eligible retention offers
   */
  getEligibleOffers(churnRisk: ChurnRisk): RetentionOffer[] {
    return this.retentionOffers.filter(offer =>
      offer.eligibleChurnRisks.includes(churnRisk)
    );
  }

  /**
   * Apply retention offer
   */
  async applyRetentionOffer(
    trackerId: string,
    offerCode: string,
    discountPercent: number
  ): Promise<RenewalTracker> {
    const tracker = await this.storage.getTracker(trackerId);
    if (!tracker || !tracker.renewalPremium) {
      throw new Error('Tracker or renewal premium not found');
    }

    const discountedPremium = tracker.renewalPremium * (1 - discountPercent / 100);

    return this.storage.updateTracker(trackerId, {
      retentionOffer: offerCode,
      retentionDiscount: discountPercent,
      renewalPremium: discountedPremium,
    });
  }

  /**
   * Complete renewal
   */
  async completeRenewal(trackerId: string, newEntityId?: string): Promise<RenewalTracker> {
    const tracker = await this.storage.getTracker(trackerId);
    if (!tracker) throw new Error('Tracker not found');

    // Update current tracker
    await this.storage.updateTracker(trackerId, {
      status: 'RENEWED',
      renewedAt: new Date(),
    });

    // If new entity created, create new tracker for next term
    if (newEntityId) {
      const newTermStart = tracker.currentTermEnd;
      const newTermEnd = new Date(newTermStart);
      newTermEnd.setFullYear(newTermEnd.getFullYear() + 1);

      await this.createTracker({
        entityType: tracker.entityType,
        entityId: newEntityId,
        entityNumber: tracker.entityNumber,
        customerId: tracker.customerId,
        customerName: tracker.customerName,
        productType: tracker.productType,
        productCode: tracker.productCode,
        currentTermStart: newTermStart,
        currentTermEnd: newTermEnd,
        renewalDueDate: new Date(newTermEnd.getTime() - 30 * 24 * 60 * 60 * 1000),
        currentPremium: tracker.renewalPremium,
        sumInsured: tracker.sumInsured,
        ncbPercentage: tracker.ncbPercentage ? tracker.ncbPercentage + 5 : undefined,
        loyaltyYears: tracker.loyaltyYears + 1,
        agentId: tracker.agentId,
        agentName: tracker.agentName,
      });
    }

    return tracker;
  }

  /**
   * Mark as lapsed
   */
  async markAsLapsed(trackerId: string): Promise<RenewalTracker> {
    const tracker = await this.storage.getTracker(trackerId);
    if (!tracker) throw new Error('Tracker not found');

    await this.storage.updateTracker(trackerId, {
      status: 'LAPSED',
      lapsedAt: new Date(),
    });

    // Create lapse record
    await this.storage.createLapseRecord({
      trackerId,
      entityType: tracker.entityType,
      entityId: tracker.entityId,
      entityNumber: tracker.entityNumber,
      customerId: tracker.customerId,
      lapsedAt: new Date(),
      lapseDays: 0,
      unpaidAmount: tracker.renewalPremium || 0,
      status: 'LAPSED',
    });

    return tracker;
  }

  /**
   * Request revival
   */
  async requestRevival(lapseId: string, revivalType: string): Promise<LapseRevival> {
    return this.storage.updateLapseRecord(lapseId, {
      status: 'REVIVAL_REQUESTED',
      revivalRequestedAt: new Date(),
      revivalType,
      requiresMedical: revivalType === 'MEDICAL',
    });
  }

  /**
   * Process revival
   */
  async processRevival(
    lapseId: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<LapseRevival> {
    const revival = await this.storage.getLapseRecord(lapseId);
    if (!revival) throw new Error('Lapse record not found');

    if (approved) {
      const updated = await this.storage.updateLapseRecord(lapseId, {
        status: 'REVIVED',
        revivedAt: new Date(),
      });

      await this.storage.updateTracker(revival.trackerId, {
        status: 'RENEWED',
        renewedAt: new Date(),
      });

      return updated;
    } else {
      return this.storage.updateLapseRecord(lapseId, {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason,
      });
    }
  }

  /**
   * Calculate surrender value
   */
  async calculateSurrenderValue(lapseId: string): Promise<number> {
    const revival = await this.storage.getLapseRecord(lapseId);
    if (!revival) throw new Error('Lapse record not found');

    const tracker = await this.storage.getTracker(revival.trackerId);
    if (!tracker || !tracker.currentPremium) return 0;

    const yearsCompleted = tracker.loyaltyYears;
    if (yearsCompleted < 3) return 0;

    const totalPremiumPaid = tracker.currentPremium * yearsCompleted;
    const surrenderValue = totalPremiumPaid * 0.3;

    await this.storage.updateLapseRecord(lapseId, {
      surrenderValue,
    });

    return surrenderValue;
  }

  /**
   * Get renewal dashboard stats
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [upcoming, atRisk, renewed, lapsed, statusGroups] = await Promise.all([
      this.storage.countTrackers({
        status: ['UPCOMING', 'NOTICE_SENT'],
        renewalDueDateFrom: now,
        renewalDueDateTo: thirtyDays,
      }),
      this.storage.countTrackers({
        churnRisk: ['MEDIUM', 'HIGH'],
        status: ['UPCOMING', 'NOTICE_SENT', 'IN_PROGRESS'],
      }),
      this.storage.countTrackers({
        status: ['RENEWED'],
        renewedAfter: monthStart,
      }),
      this.storage.countTrackers({
        status: ['LAPSED'],
        lapsedAfter: monthStart,
      }),
      this.storage.groupByStatus(),
    ]);

    const renewalRate = renewed + lapsed > 0
      ? (renewed / (renewed + lapsed)) * 100
      : 0;

    return {
      upcoming,
      atRisk,
      thisMonth: { renewed, lapsed },
      renewalRate,
      byStatus: statusGroups.reduce((acc, s) => {
        acc[s.status] = s.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

// In-Memory Storage Implementation
export class InMemoryRenewalStorage implements RenewalStorage {
  private trackers: Map<string, RenewalTracker> = new Map();
  private lapseRecords: Map<string, LapseRevival> = new Map();

  async createTracker(data: Omit<RenewalTracker, 'id' | 'createdAt' | 'updatedAt'>): Promise<RenewalTracker> {
    const tracker: RenewalTracker = {
      ...data,
      id: `tracker_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.trackers.set(tracker.id, tracker);
    return tracker;
  }

  async getTracker(id: string): Promise<RenewalTracker | null> {
    return this.trackers.get(id) || null;
  }

  async updateTracker(id: string, updates: Partial<RenewalTracker>): Promise<RenewalTracker> {
    const tracker = this.trackers.get(id);
    if (!tracker) throw new Error('Tracker not found');

    const updated = { ...tracker, ...updates, updatedAt: new Date() };
    this.trackers.set(id, updated);
    return updated;
  }

  async findTrackers(filter: {
    status?: RenewalStatus[];
    churnRisk?: ChurnRisk[];
    renewalDueDateFrom?: Date;
    renewalDueDateTo?: Date;
    customerId?: string;
  }): Promise<RenewalTracker[]> {
    return Array.from(this.trackers.values()).filter(t => {
      if (filter.status && !filter.status.includes(t.status)) return false;
      if (filter.churnRisk && t.churnRisk && !filter.churnRisk.includes(t.churnRisk)) return false;
      if (filter.renewalDueDateFrom && t.renewalDueDate < filter.renewalDueDateFrom) return false;
      if (filter.renewalDueDateTo && t.renewalDueDate > filter.renewalDueDateTo) return false;
      if (filter.customerId && t.customerId !== filter.customerId) return false;
      return true;
    }).sort((a, b) => a.renewalDueDate.getTime() - b.renewalDueDate.getTime());
  }

  async countTrackers(filter: {
    status?: RenewalStatus[];
    churnRisk?: ChurnRisk[];
    renewalDueDateFrom?: Date;
    renewalDueDateTo?: Date;
    renewedAfter?: Date;
    lapsedAfter?: Date;
  }): Promise<number> {
    return Array.from(this.trackers.values()).filter(t => {
      if (filter.status && !filter.status.includes(t.status)) return false;
      if (filter.churnRisk && t.churnRisk && !filter.churnRisk.includes(t.churnRisk)) return false;
      if (filter.renewalDueDateFrom && t.renewalDueDate < filter.renewalDueDateFrom) return false;
      if (filter.renewalDueDateTo && t.renewalDueDate > filter.renewalDueDateTo) return false;
      if (filter.renewedAfter && (!t.renewedAt || t.renewedAt < filter.renewedAfter)) return false;
      if (filter.lapsedAfter && (!t.lapsedAt || t.lapsedAt < filter.lapsedAfter)) return false;
      return true;
    }).length;
  }

  async groupByStatus(): Promise<{ status: RenewalStatus; count: number }[]> {
    const counts: Record<string, number> = {};
    for (const t of this.trackers.values()) {
      counts[t.status] = (counts[t.status] || 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({
      status: status as RenewalStatus,
      count,
    }));
  }

  async createLapseRecord(data: Omit<LapseRevival, 'id' | 'createdAt' | 'updatedAt'>): Promise<LapseRevival> {
    const record: LapseRevival = {
      ...data,
      id: `lapse_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.lapseRecords.set(record.id, record);
    return record;
  }

  async getLapseRecord(id: string): Promise<LapseRevival | null> {
    return this.lapseRecords.get(id) || null;
  }

  async updateLapseRecord(id: string, updates: Partial<LapseRevival>): Promise<LapseRevival> {
    const record = this.lapseRecords.get(id);
    if (!record) throw new Error('Lapse record not found');

    const updated = { ...record, ...updates, updatedAt: new Date() };
    this.lapseRecords.set(id, updated);
    return updated;
  }

  async getCustomerBehavior(customerId: string, termStart: Date): Promise<CustomerBehaviorData> {
    // Default behavior data for demo/testing
    return {
      claimCount: 0,
      paymentDelays: 0,
      engagementScore: 5,
    };
  }
}

// Factory function
export function createRenewalEngine(
  storage?: RenewalStorage,
  options?: { retentionOffers?: RetentionOffer[] }
): RenewalEngine {
  return new RenewalEngine(storage || new InMemoryRenewalStorage(), options);
}
