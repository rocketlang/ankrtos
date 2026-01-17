/**
 * BFC Churn Prediction Model
 *
 * AI-powered customer churn prediction using behavioral signals.
 * Identifies customers at risk of leaving and suggests retention strategies.
 *
 * Key Signals:
 * - Transaction frequency decline
 * - Balance trend (declining)
 * - Engagement drop (app opens, feature usage)
 * - Support ticket patterns
 * - Competitor activity indicators
 * - Life event signals
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Customer engagement metrics
 */
export interface EngagementMetrics {
  /** App opens in last 30 days */
  appOpens30d: number;
  /** App opens in previous 30 days (for comparison) */
  appOpensPrev30d: number;
  /** Features used in last 30 days */
  featuresUsed30d: string[];
  /** Last login timestamp */
  lastLoginAt: Date;
  /** Days since last login */
  daysSinceLogin: number;
  /** Notification opt-out count */
  notificationOptOuts: number;
  /** Support tickets in last 90 days */
  supportTickets90d: number;
  /** Unresolved complaints */
  unresolvedComplaints: number;
}

/**
 * Transaction behavior metrics
 */
export interface TransactionMetrics {
  /** Transactions in last 30 days */
  txnCount30d: number;
  /** Transactions in previous 30 days */
  txnCountPrev30d: number;
  /** Transaction volume in last 30 days */
  txnVolume30d: number;
  /** Transaction volume in previous 30 days */
  txnVolumePrev30d: number;
  /** Average balance last 30 days */
  avgBalance30d: number;
  /** Average balance previous 30 days */
  avgBalancePrev30d: number;
  /** Days since last transaction */
  daysSinceLastTxn: number;
  /** Recurring payment cancellations */
  recurringCancellations: number;
  /** Standing instruction removals */
  siRemovals: number;
}

/**
 * Product relationship metrics
 */
export interface ProductMetrics {
  /** Number of active products */
  activeProducts: number;
  /** Products closed in last 90 days */
  productsClosed90d: number;
  /** Cross-sell offers declined */
  offersDeclined: number;
  /** Months as customer (tenure) */
  tenureMonths: number;
  /** Has salary credit */
  hasSalaryCredit: boolean;
  /** Has auto-debit EMIs */
  hasEMIs: boolean;
  /** Has insurance products */
  hasInsurance: boolean;
  /** Has investment products */
  hasInvestments: boolean;
}

/**
 * External signals
 */
export interface ExternalSignals {
  /** Address change recently */
  recentAddressChange: boolean;
  /** Phone number change recently */
  recentPhoneChange: boolean;
  /** Email change recently */
  recentEmailChange: boolean;
  /** Large withdrawal recently */
  largeWithdrawal: boolean;
  /** Competitor app detected (if available) */
  competitorAppDetected: boolean;
  /** Life event signals (marriage, job change, etc.) */
  lifeEventSignals: string[];
}

/**
 * Customer profile for churn analysis
 */
export interface ChurnProfile {
  customerId: string;
  segment: string;
  engagement: EngagementMetrics;
  transactions: TransactionMetrics;
  products: ProductMetrics;
  external: ExternalSignals;
}

/**
 * Churn risk level
 */
export type ChurnRiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';

/**
 * Risk factor contributing to churn
 */
export interface ChurnRiskFactor {
  factor: string;
  factorHi: string;
  weight: number;
  score: number;
  description: string;
  descriptionHi: string;
}

/**
 * Retention action recommendation
 */
export interface RetentionAction {
  action: string;
  actionHi: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  descriptionHi: string;
  expectedImpact: number; // 0-100
  channel: 'CALL' | 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP' | 'VISIT';
  timing: string;
}

/**
 * Churn prediction result
 */
export interface ChurnPrediction {
  customerId: string;
  /** Churn probability (0-100) */
  churnProbability: number;
  /** Risk level */
  riskLevel: ChurnRiskLevel;
  /** Risk factors */
  riskFactors: ChurnRiskFactor[];
  /** Recommended retention actions */
  retentionActions: RetentionAction[];
  /** Predicted churn timeframe in days */
  predictedChurnDays: number;
  /** Customer lifetime value at risk */
  cltvAtRisk: number;
  /** Confidence score (0-100) */
  confidence: number;
  /** Analysis timestamp */
  analyzedAt: Date;
  /** Summary message */
  summary: string;
  summaryHi: string;
}

/**
 * Batch churn analysis result
 */
export interface BatchChurnAnalysis {
  totalCustomers: number;
  criticalRisk: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  minimalRisk: number;
  totalCltvAtRisk: number;
  topRiskFactors: { factor: string; count: number }[];
  predictions: ChurnPrediction[];
  analyzedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHURN PREDICTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChurnPredictorConfig {
  /** Weight for engagement signals */
  engagementWeight: number;
  /** Weight for transaction signals */
  transactionWeight: number;
  /** Weight for product signals */
  productWeight: number;
  /** Weight for external signals */
  externalWeight: number;
  /** Threshold for critical risk */
  criticalThreshold: number;
  /** Threshold for high risk */
  highThreshold: number;
  /** Threshold for medium risk */
  mediumThreshold: number;
  /** Threshold for low risk */
  lowThreshold: number;
}

const DEFAULT_CONFIG: ChurnPredictorConfig = {
  engagementWeight: 0.30,
  transactionWeight: 0.35,
  productWeight: 0.20,
  externalWeight: 0.15,
  criticalThreshold: 80,
  highThreshold: 60,
  mediumThreshold: 40,
  lowThreshold: 20,
};

/**
 * Churn Prediction Engine
 *
 * Uses behavioral signals to predict customer churn probability
 * and recommend retention strategies.
 */
export class ChurnPredictor {
  private config: ChurnPredictorConfig;

  constructor(config: Partial<ChurnPredictorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Predict churn for a customer
   */
  predict(profile: ChurnProfile): ChurnPrediction {
    const riskFactors: ChurnRiskFactor[] = [];

    // Calculate component scores
    const engagementScore = this.calculateEngagementScore(profile.engagement, riskFactors);
    const transactionScore = this.calculateTransactionScore(profile.transactions, riskFactors);
    const productScore = this.calculateProductScore(profile.products, riskFactors);
    const externalScore = this.calculateExternalScore(profile.external, riskFactors);

    // Weighted churn probability
    const churnProbability = Math.min(100, Math.round(
      engagementScore * this.config.engagementWeight +
      transactionScore * this.config.transactionWeight +
      productScore * this.config.productWeight +
      externalScore * this.config.externalWeight
    ));

    // Determine risk level
    const riskLevel = this.getRiskLevel(churnProbability);

    // Sort risk factors by score
    riskFactors.sort((a, b) => b.score - a.score);

    // Calculate predicted churn timeframe
    const predictedChurnDays = this.predictChurnTimeframe(churnProbability, profile);

    // Calculate CLTV at risk
    const cltvAtRisk = this.calculateCltvAtRisk(profile, churnProbability);

    // Generate retention actions
    const retentionActions = this.generateRetentionActions(
      profile,
      riskFactors,
      riskLevel
    );

    // Generate summary
    const { summary, summaryHi } = this.generateSummary(
      profile,
      churnProbability,
      riskLevel,
      riskFactors
    );

    // Calculate confidence
    const confidence = this.calculateConfidence(profile);

    return {
      customerId: profile.customerId,
      churnProbability,
      riskLevel,
      riskFactors: riskFactors.slice(0, 5), // Top 5 factors
      retentionActions,
      predictedChurnDays,
      cltvAtRisk,
      confidence,
      analyzedAt: new Date(),
      summary,
      summaryHi,
    };
  }

  /**
   * Batch predict churn for multiple customers
   */
  batchPredict(profiles: ChurnProfile[]): BatchChurnAnalysis {
    const predictions = profiles.map(p => this.predict(p));

    const criticalRisk = predictions.filter(p => p.riskLevel === 'CRITICAL').length;
    const highRisk = predictions.filter(p => p.riskLevel === 'HIGH').length;
    const mediumRisk = predictions.filter(p => p.riskLevel === 'MEDIUM').length;
    const lowRisk = predictions.filter(p => p.riskLevel === 'LOW').length;
    const minimalRisk = predictions.filter(p => p.riskLevel === 'MINIMAL').length;

    const totalCltvAtRisk = predictions.reduce((sum, p) => sum + p.cltvAtRisk, 0);

    // Aggregate risk factors
    const factorCounts = new Map<string, number>();
    for (const pred of predictions) {
      for (const factor of pred.riskFactors) {
        factorCounts.set(
          factor.factor,
          (factorCounts.get(factor.factor) || 0) + 1
        );
      }
    }

    const topRiskFactors = Array.from(factorCounts.entries())
      .map(([factor, count]) => ({ factor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalCustomers: profiles.length,
      criticalRisk,
      highRisk,
      mediumRisk,
      lowRisk,
      minimalRisk,
      totalCltvAtRisk,
      topRiskFactors,
      predictions: predictions.sort((a, b) => b.churnProbability - a.churnProbability),
      analyzedAt: new Date(),
    };
  }

  /**
   * Calculate engagement risk score (0-100)
   */
  private calculateEngagementScore(
    metrics: EngagementMetrics,
    factors: ChurnRiskFactor[]
  ): number {
    let score = 0;

    // App usage decline
    if (metrics.appOpensPrev30d > 0) {
      const usageDecline = (metrics.appOpensPrev30d - metrics.appOpens30d) / metrics.appOpensPrev30d;
      if (usageDecline > 0.5) {
        const impact = Math.min(30, usageDecline * 40);
        score += impact;
        factors.push({
          factor: 'App usage declined significantly',
          factorHi: 'ऐप का उपयोग काफी कम हो गया',
          weight: this.config.engagementWeight,
          score: impact,
          description: `App opens dropped ${Math.round(usageDecline * 100)}% from last month`,
          descriptionHi: `पिछले महीने से ऐप खोलना ${Math.round(usageDecline * 100)}% कम हो गया`,
        });
      }
    }

    // Days since login
    if (metrics.daysSinceLogin > 30) {
      const impact = Math.min(25, (metrics.daysSinceLogin - 30) * 0.5);
      score += impact;
      factors.push({
        factor: 'Extended inactivity',
        factorHi: 'लंबे समय से निष्क्रिय',
        weight: this.config.engagementWeight,
        score: impact,
        description: `No login for ${metrics.daysSinceLogin} days`,
        descriptionHi: `${metrics.daysSinceLogin} दिनों से लॉगिन नहीं`,
      });
    }

    // Notification opt-outs
    if (metrics.notificationOptOuts > 2) {
      const impact = Math.min(15, metrics.notificationOptOuts * 3);
      score += impact;
      factors.push({
        factor: 'Disabled notifications',
        factorHi: 'नोटिफिकेशन बंद किया',
        weight: this.config.engagementWeight,
        score: impact,
        description: `Opted out of ${metrics.notificationOptOuts} notification types`,
        descriptionHi: `${metrics.notificationOptOuts} प्रकार की सूचनाएं बंद कीं`,
      });
    }

    // Support tickets & complaints
    if (metrics.supportTickets90d > 3 || metrics.unresolvedComplaints > 0) {
      const impact = Math.min(30, metrics.supportTickets90d * 5 + metrics.unresolvedComplaints * 15);
      score += impact;
      factors.push({
        factor: 'Customer service issues',
        factorHi: 'ग्राहक सेवा समस्याएं',
        weight: this.config.engagementWeight,
        score: impact,
        description: `${metrics.supportTickets90d} tickets, ${metrics.unresolvedComplaints} unresolved`,
        descriptionHi: `${metrics.supportTickets90d} टिकट, ${metrics.unresolvedComplaints} अनसुलझे`,
      });
    }

    // Feature usage decline
    if (metrics.featuresUsed30d.length < 2) {
      const impact = 15;
      score += impact;
      factors.push({
        factor: 'Limited feature engagement',
        factorHi: 'सीमित फीचर उपयोग',
        weight: this.config.engagementWeight,
        score: impact,
        description: `Only using ${metrics.featuresUsed30d.length} features`,
        descriptionHi: `केवल ${metrics.featuresUsed30d.length} फीचर उपयोग कर रहे हैं`,
      });
    }

    return Math.min(100, score);
  }

  /**
   * Calculate transaction risk score (0-100)
   */
  private calculateTransactionScore(
    metrics: TransactionMetrics,
    factors: ChurnRiskFactor[]
  ): number {
    let score = 0;

    // Transaction count decline
    if (metrics.txnCountPrev30d > 0) {
      const txnDecline = (metrics.txnCountPrev30d - metrics.txnCount30d) / metrics.txnCountPrev30d;
      if (txnDecline > 0.3) {
        const impact = Math.min(25, txnDecline * 35);
        score += impact;
        factors.push({
          factor: 'Transaction frequency dropped',
          factorHi: 'लेनदेन की संख्या कम हुई',
          weight: this.config.transactionWeight,
          score: impact,
          description: `Transactions down ${Math.round(txnDecline * 100)}% from last month`,
          descriptionHi: `पिछले महीने से लेनदेन ${Math.round(txnDecline * 100)}% कम`,
        });
      }
    }

    // Volume decline
    if (metrics.txnVolumePrev30d > 0) {
      const volumeDecline = (metrics.txnVolumePrev30d - metrics.txnVolume30d) / metrics.txnVolumePrev30d;
      if (volumeDecline > 0.4) {
        const impact = Math.min(25, volumeDecline * 35);
        score += impact;
        factors.push({
          factor: 'Transaction volume dropped',
          factorHi: 'लेनदेन की राशि कम हुई',
          weight: this.config.transactionWeight,
          score: impact,
          description: `Volume down ${Math.round(volumeDecline * 100)}% from last month`,
          descriptionHi: `पिछले महीने से राशि ${Math.round(volumeDecline * 100)}% कम`,
        });
      }
    }

    // Balance decline
    if (metrics.avgBalancePrev30d > 0) {
      const balanceDecline = (metrics.avgBalancePrev30d - metrics.avgBalance30d) / metrics.avgBalancePrev30d;
      if (balanceDecline > 0.5) {
        const impact = Math.min(30, balanceDecline * 40);
        score += impact;
        factors.push({
          factor: 'Significant balance decline',
          factorHi: 'बैलेंस में भारी गिरावट',
          weight: this.config.transactionWeight,
          score: impact,
          description: `Average balance down ${Math.round(balanceDecline * 100)}%`,
          descriptionHi: `औसत बैलेंस ${Math.round(balanceDecline * 100)}% कम`,
        });
      }
    }

    // Days since last transaction
    if (metrics.daysSinceLastTxn > 14) {
      const impact = Math.min(20, (metrics.daysSinceLastTxn - 14) * 0.8);
      score += impact;
      factors.push({
        factor: 'Transaction inactivity',
        factorHi: 'लेनदेन निष्क्रियता',
        weight: this.config.transactionWeight,
        score: impact,
        description: `No transactions for ${metrics.daysSinceLastTxn} days`,
        descriptionHi: `${metrics.daysSinceLastTxn} दिनों से कोई लेनदेन नहीं`,
      });
    }

    // Recurring payment cancellations
    if (metrics.recurringCancellations > 0) {
      const impact = Math.min(20, metrics.recurringCancellations * 10);
      score += impact;
      factors.push({
        factor: 'Cancelled recurring payments',
        factorHi: 'आवर्ती भुगतान रद्द किए',
        weight: this.config.transactionWeight,
        score: impact,
        description: `Cancelled ${metrics.recurringCancellations} recurring payments`,
        descriptionHi: `${metrics.recurringCancellations} आवर्ती भुगतान रद्द किए`,
      });
    }

    // Standing instruction removals
    if (metrics.siRemovals > 0) {
      const impact = Math.min(15, metrics.siRemovals * 8);
      score += impact;
      factors.push({
        factor: 'Removed standing instructions',
        factorHi: 'स्थायी निर्देश हटाए',
        weight: this.config.transactionWeight,
        score: impact,
        description: `Removed ${metrics.siRemovals} standing instructions`,
        descriptionHi: `${metrics.siRemovals} स्थायी निर्देश हटाए`,
      });
    }

    return Math.min(100, score);
  }

  /**
   * Calculate product relationship risk score (0-100)
   */
  private calculateProductScore(
    metrics: ProductMetrics,
    factors: ChurnRiskFactor[]
  ): number {
    let score = 0;

    // Low product penetration
    if (metrics.activeProducts < 2) {
      const impact = 20;
      score += impact;
      factors.push({
        factor: 'Limited product relationship',
        factorHi: 'सीमित उत्पाद संबंध',
        weight: this.config.productWeight,
        score: impact,
        description: `Only ${metrics.activeProducts} active product(s)`,
        descriptionHi: `केवल ${metrics.activeProducts} सक्रिय उत्पाद`,
      });
    }

    // Recent product closures
    if (metrics.productsClosed90d > 0) {
      const impact = Math.min(30, metrics.productsClosed90d * 15);
      score += impact;
      factors.push({
        factor: 'Closed products recently',
        factorHi: 'हाल ही में उत्पाद बंद किए',
        weight: this.config.productWeight,
        score: impact,
        description: `Closed ${metrics.productsClosed90d} product(s) in last 90 days`,
        descriptionHi: `पिछले 90 दिनों में ${metrics.productsClosed90d} उत्पाद बंद किए`,
      });
    }

    // Declined offers
    if (metrics.offersDeclined > 3) {
      const impact = Math.min(15, (metrics.offersDeclined - 3) * 3);
      score += impact;
      factors.push({
        factor: 'Declining cross-sell offers',
        factorHi: 'क्रॉस-सेल ऑफर अस्वीकार',
        weight: this.config.productWeight,
        score: impact,
        description: `Declined ${metrics.offersDeclined} offers`,
        descriptionHi: `${metrics.offersDeclined} ऑफर अस्वीकार किए`,
      });
    }

    // Short tenure
    if (metrics.tenureMonths < 6) {
      const impact = 15;
      score += impact;
      factors.push({
        factor: 'New customer (short tenure)',
        factorHi: 'नया ग्राहक (कम अवधि)',
        weight: this.config.productWeight,
        score: impact,
        description: `Only ${metrics.tenureMonths} months tenure`,
        descriptionHi: `केवल ${metrics.tenureMonths} महीने का संबंध`,
      });
    }

    // No stickiness factors
    const stickinessFactors = [
      metrics.hasSalaryCredit,
      metrics.hasEMIs,
      metrics.hasInsurance,
      metrics.hasInvestments,
    ].filter(Boolean).length;

    if (stickinessFactors === 0) {
      const impact = 25;
      score += impact;
      factors.push({
        factor: 'No sticky products',
        factorHi: 'कोई स्थायी उत्पाद नहीं',
        weight: this.config.productWeight,
        score: impact,
        description: 'No salary credit, EMIs, insurance, or investments',
        descriptionHi: 'कोई सैलरी क्रेडिट, EMI, बीमा, या निवेश नहीं',
      });
    }

    return Math.min(100, score);
  }

  /**
   * Calculate external signal risk score (0-100)
   */
  private calculateExternalScore(
    signals: ExternalSignals,
    factors: ChurnRiskFactor[]
  ): number {
    let score = 0;

    // Contact info changes
    const contactChanges = [
      signals.recentAddressChange,
      signals.recentPhoneChange,
      signals.recentEmailChange,
    ].filter(Boolean).length;

    if (contactChanges >= 2) {
      const impact = 25;
      score += impact;
      factors.push({
        factor: 'Multiple contact info changes',
        factorHi: 'एकाधिक संपर्क जानकारी बदली',
        weight: this.config.externalWeight,
        score: impact,
        description: `Changed ${contactChanges} contact details recently`,
        descriptionHi: `हाल ही में ${contactChanges} संपर्क विवरण बदले`,
      });
    }

    // Large withdrawal
    if (signals.largeWithdrawal) {
      const impact = 30;
      score += impact;
      factors.push({
        factor: 'Large fund withdrawal',
        factorHi: 'बड़ी राशि निकासी',
        weight: this.config.externalWeight,
        score: impact,
        description: 'Significant funds moved out recently',
        descriptionHi: 'हाल ही में बड़ी राशि बाहर गई',
      });
    }

    // Competitor activity
    if (signals.competitorAppDetected) {
      const impact = 35;
      score += impact;
      factors.push({
        factor: 'Competitor app activity',
        factorHi: 'प्रतिस्पर्धी ऐप गतिविधि',
        weight: this.config.externalWeight,
        score: impact,
        description: 'Customer using competitor banking app',
        descriptionHi: 'ग्राहक प्रतिस्पर्धी बैंकिंग ऐप का उपयोग कर रहा है',
      });
    }

    // Life events
    if (signals.lifeEventSignals.length > 0) {
      const riskEvents = ['job_loss', 'relocation', 'divorce', 'retirement'];
      const hasRiskEvent = signals.lifeEventSignals.some(e => riskEvents.includes(e));

      if (hasRiskEvent) {
        const impact = 20;
        score += impact;
        factors.push({
          factor: 'Life event detected',
          factorHi: 'जीवन घटना का पता चला',
          weight: this.config.externalWeight,
          score: impact,
          description: `Life events: ${signals.lifeEventSignals.join(', ')}`,
          descriptionHi: `जीवन घटनाएं: ${signals.lifeEventSignals.join(', ')}`,
        });
      }
    }

    return Math.min(100, score);
  }

  /**
   * Determine risk level from probability
   */
  private getRiskLevel(probability: number): ChurnRiskLevel {
    if (probability >= this.config.criticalThreshold) return 'CRITICAL';
    if (probability >= this.config.highThreshold) return 'HIGH';
    if (probability >= this.config.mediumThreshold) return 'MEDIUM';
    if (probability >= this.config.lowThreshold) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Predict timeframe for churn
   */
  private predictChurnTimeframe(probability: number, profile: ChurnProfile): number {
    // Base days inversely proportional to probability
    let baseDays = 180 - (probability * 1.5);

    // Adjust based on urgency signals
    if (profile.external.largeWithdrawal) baseDays -= 30;
    if (profile.external.competitorAppDetected) baseDays -= 20;
    if (profile.transactions.daysSinceLastTxn > 30) baseDays -= 15;
    if (profile.products.productsClosed90d > 0) baseDays -= 20;

    return Math.max(7, Math.round(baseDays));
  }

  /**
   * Calculate customer lifetime value at risk
   */
  private calculateCltvAtRisk(profile: ChurnProfile, probability: number): number {
    // Estimate annual value based on transaction volume and products
    const monthlyTxnValue = profile.transactions.txnVolume30d;
    const annualTxnValue = monthlyTxnValue * 12;

    // Product multiplier
    let productMultiplier = 1;
    if (profile.products.hasSalaryCredit) productMultiplier += 0.3;
    if (profile.products.hasEMIs) productMultiplier += 0.4;
    if (profile.products.hasInsurance) productMultiplier += 0.2;
    if (profile.products.hasInvestments) productMultiplier += 0.3;

    // Tenure multiplier (longer tenure = more valuable)
    const tenureMultiplier = Math.min(2, 1 + profile.products.tenureMonths / 60);

    // Estimated CLTV
    const estimatedCltv = annualTxnValue * productMultiplier * tenureMultiplier * 0.02; // 2% margin

    // At risk portion
    return Math.round(estimatedCltv * (probability / 100));
  }

  /**
   * Generate retention action recommendations
   */
  private generateRetentionActions(
    profile: ChurnProfile,
    factors: ChurnRiskFactor[],
    riskLevel: ChurnRiskLevel
  ): RetentionAction[] {
    const actions: RetentionAction[] = [];
    const topFactors = factors.slice(0, 3).map(f => f.factor);

    // Critical/High risk - immediate personal outreach
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      actions.push({
        action: 'Personal relationship manager call',
        actionHi: 'व्यक्तिगत रिलेशनशिप मैनेजर कॉल',
        priority: 'URGENT',
        description: 'Schedule call within 24 hours to understand concerns',
        descriptionHi: '24 घंटे के भीतर कॉल करें और चिंताओं को समझें',
        expectedImpact: 60,
        channel: 'CALL',
        timing: 'Within 24 hours',
      });
    }

    // Service issues - resolve complaints
    if (topFactors.some(f => f.includes('service') || f.includes('complaint'))) {
      actions.push({
        action: 'Escalate pending complaints',
        actionHi: 'लंबित शिकायतों को बढ़ाएं',
        priority: 'URGENT',
        description: 'Fast-track resolution of all open issues',
        descriptionHi: 'सभी खुले मुद्दों का तेजी से समाधान करें',
        expectedImpact: 70,
        channel: 'CALL',
        timing: 'Immediate',
      });
    }

    // Balance/activity decline - offer incentives
    if (topFactors.some(f => f.includes('balance') || f.includes('Transaction'))) {
      actions.push({
        action: 'Offer cashback/rewards incentive',
        actionHi: 'कैशबैक/रिवॉर्ड इंसेंटिव दें',
        priority: 'HIGH',
        description: 'Offer 2% cashback on transactions for 3 months',
        descriptionHi: '3 महीने के लिए लेनदेन पर 2% कैशबैक ऑफर करें',
        expectedImpact: 45,
        channel: 'IN_APP',
        timing: 'Within 48 hours',
      });
    }

    // No sticky products - cross-sell
    if (topFactors.some(f => f.includes('sticky') || f.includes('Limited product'))) {
      actions.push({
        action: 'Personalized product recommendation',
        actionHi: 'व्यक्तिगत उत्पाद सिफारिश',
        priority: 'MEDIUM',
        description: 'Recommend relevant product based on behavior',
        descriptionHi: 'व्यवहार के आधार पर प्रासंगिक उत्पाद सुझाएं',
        expectedImpact: 35,
        channel: 'EMAIL',
        timing: 'Within 1 week',
      });
    }

    // Competitor detected - rate match
    if (profile.external.competitorAppDetected) {
      actions.push({
        action: 'Competitive rate matching',
        actionHi: 'प्रतिस्पर्धी दर मिलान',
        priority: 'HIGH',
        description: 'Offer preferential rates to match competitor',
        descriptionHi: 'प्रतिस्पर्धी से मिलान के लिए अधिमान्य दरें दें',
        expectedImpact: 55,
        channel: 'CALL',
        timing: 'Within 3 days',
      });
    }

    // Engagement drop - re-engage
    if (topFactors.some(f => f.includes('usage') || f.includes('login') || f.includes('engagement'))) {
      actions.push({
        action: 'Re-engagement campaign',
        actionHi: 'री-एंगेजमेंट अभियान',
        priority: 'MEDIUM',
        description: 'Send personalized content and feature highlights',
        descriptionHi: 'व्यक्तिगत सामग्री और फीचर हाइलाइट्स भेजें',
        expectedImpact: 30,
        channel: 'PUSH',
        timing: 'Within 1 week',
      });
    }

    // Life events - empathetic outreach
    if (profile.external.lifeEventSignals.length > 0) {
      actions.push({
        action: 'Life event support outreach',
        actionHi: 'जीवन घटना सहायता संपर्क',
        priority: 'HIGH',
        description: 'Offer relevant support based on life changes',
        descriptionHi: 'जीवन परिवर्तन के आधार पर प्रासंगिक सहायता दें',
        expectedImpact: 40,
        channel: 'CALL',
        timing: 'Within 3 days',
      });
    }

    // Default for lower risk
    if (actions.length === 0) {
      actions.push({
        action: 'Loyalty appreciation message',
        actionHi: 'लॉयल्टी सराहना संदेश',
        priority: 'LOW',
        description: 'Send thank you message with exclusive offer',
        descriptionHi: 'एक्सक्लूसिव ऑफर के साथ धन्यवाद संदेश भेजें',
        expectedImpact: 20,
        channel: 'SMS',
        timing: 'Within 2 weeks',
      });
    }

    // Sort by priority and expected impact
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    actions.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.expectedImpact - a.expectedImpact;
    });

    return actions.slice(0, 4); // Top 4 actions
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(
    profile: ChurnProfile,
    probability: number,
    riskLevel: ChurnRiskLevel,
    factors: ChurnRiskFactor[]
  ): { summary: string; summaryHi: string } {
    const riskLabels: Record<ChurnRiskLevel, { en: string; hi: string }> = {
      CRITICAL: { en: 'critical', hi: 'गंभीर' },
      HIGH: { en: 'high', hi: 'उच्च' },
      MEDIUM: { en: 'moderate', hi: 'मध्यम' },
      LOW: { en: 'low', hi: 'कम' },
      MINIMAL: { en: 'minimal', hi: 'न्यूनतम' },
    };

    const topFactor = factors[0];
    const label = riskLabels[riskLevel];

    const summary = `Customer has ${label.en} churn risk (${probability}%). ${topFactor ? `Primary concern: ${topFactor.description}` : 'No major concerns identified.'}`;

    const summaryHi = `ग्राहक को ${label.hi} छोड़ने का जोखिम है (${probability}%)। ${topFactor ? `मुख्य चिंता: ${topFactor.descriptionHi}` : 'कोई बड़ी चिंता नहीं पाई गई।'}`;

    return { summary, summaryHi };
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(profile: ChurnProfile): number {
    let confidence = 70; // Base confidence

    // More data = higher confidence
    if (profile.products.tenureMonths > 12) confidence += 10;
    if (profile.transactions.txnCount30d > 10) confidence += 5;
    if (profile.transactions.txnCountPrev30d > 10) confidence += 5;
    if (profile.engagement.appOpens30d > 5) confidence += 5;

    // Less data = lower confidence
    if (profile.products.tenureMonths < 3) confidence -= 15;
    if (profile.transactions.txnCount30d < 3) confidence -= 10;

    return Math.min(95, Math.max(40, confidence));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

/** Default churn predictor instance */
export const churnPredictor = new ChurnPredictor();

/**
 * Create a new churn predictor with custom config
 */
export function createChurnPredictor(config?: Partial<ChurnPredictorConfig>): ChurnPredictor {
  return new ChurnPredictor(config);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a churn profile from raw data
 * Useful for integrating with existing data sources
 */
export function buildChurnProfile(data: {
  customerId: string;
  segment?: string;
  // Engagement
  appOpens30d?: number;
  appOpensPrev30d?: number;
  lastLoginAt?: Date;
  featuresUsed?: string[];
  notificationOptOuts?: number;
  supportTickets?: number;
  unresolvedComplaints?: number;
  // Transactions
  txnCount30d?: number;
  txnCountPrev30d?: number;
  txnVolume30d?: number;
  txnVolumePrev30d?: number;
  avgBalance30d?: number;
  avgBalancePrev30d?: number;
  lastTxnAt?: Date;
  recurringCancellations?: number;
  siRemovals?: number;
  // Products
  activeProducts?: number;
  productsClosed90d?: number;
  offersDeclined?: number;
  tenureMonths?: number;
  hasSalaryCredit?: boolean;
  hasEMIs?: boolean;
  hasInsurance?: boolean;
  hasInvestments?: boolean;
  // External
  recentAddressChange?: boolean;
  recentPhoneChange?: boolean;
  recentEmailChange?: boolean;
  largeWithdrawal?: boolean;
  competitorAppDetected?: boolean;
  lifeEventSignals?: string[];
}): ChurnProfile {
  const now = new Date();

  return {
    customerId: data.customerId,
    segment: data.segment || 'STANDARD',
    engagement: {
      appOpens30d: data.appOpens30d || 0,
      appOpensPrev30d: data.appOpensPrev30d || 0,
      featuresUsed30d: data.featuresUsed || [],
      lastLoginAt: data.lastLoginAt || now,
      daysSinceLogin: data.lastLoginAt
        ? Math.floor((now.getTime() - data.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      notificationOptOuts: data.notificationOptOuts || 0,
      supportTickets90d: data.supportTickets || 0,
      unresolvedComplaints: data.unresolvedComplaints || 0,
    },
    transactions: {
      txnCount30d: data.txnCount30d || 0,
      txnCountPrev30d: data.txnCountPrev30d || 0,
      txnVolume30d: data.txnVolume30d || 0,
      txnVolumePrev30d: data.txnVolumePrev30d || 0,
      avgBalance30d: data.avgBalance30d || 0,
      avgBalancePrev30d: data.avgBalancePrev30d || 0,
      daysSinceLastTxn: data.lastTxnAt
        ? Math.floor((now.getTime() - data.lastTxnAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      recurringCancellations: data.recurringCancellations || 0,
      siRemovals: data.siRemovals || 0,
    },
    products: {
      activeProducts: data.activeProducts || 1,
      productsClosed90d: data.productsClosed90d || 0,
      offersDeclined: data.offersDeclined || 0,
      tenureMonths: data.tenureMonths || 0,
      hasSalaryCredit: data.hasSalaryCredit || false,
      hasEMIs: data.hasEMIs || false,
      hasInsurance: data.hasInsurance || false,
      hasInvestments: data.hasInvestments || false,
    },
    external: {
      recentAddressChange: data.recentAddressChange || false,
      recentPhoneChange: data.recentPhoneChange || false,
      recentEmailChange: data.recentEmailChange || false,
      largeWithdrawal: data.largeWithdrawal || false,
      competitorAppDetected: data.competitorAppDetected || false,
      lifeEventSignals: data.lifeEventSignals || [],
    },
  };
}

/**
 * Get risk level color for UI
 */
export function getRiskLevelColor(level: ChurnRiskLevel): string {
  switch (level) {
    case 'CRITICAL': return '#DC2626'; // Red
    case 'HIGH': return '#EA580C'; // Orange
    case 'MEDIUM': return '#CA8A04'; // Yellow
    case 'LOW': return '#16A34A'; // Green
    case 'MINIMAL': return '#059669'; // Teal
  }
}

/**
 * Format retention action for display
 */
export function formatRetentionAction(action: RetentionAction, language: 'en' | 'hi' = 'en'): string {
  if (language === 'hi') {
    return `[${action.priority}] ${action.actionHi} - ${action.descriptionHi} (${action.timing})`;
  }
  return `[${action.priority}] ${action.action} - ${action.description} (${action.timing})`;
}
