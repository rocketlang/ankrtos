/**
 * @ankr/fraud-detection
 *
 * Real-time fraud detection engine with velocity checks, pattern analysis,
 * risk scoring, and rule-based detection for fintech applications.
 *
 * Features:
 * - Velocity checks (transaction frequency, amount limits)
 * - Pattern detection (unusual behavior)
 * - Risk scoring with ML-ready signals
 * - Rule engine for custom fraud rules
 * - Device fingerprint analysis
 * - Geolocation anomaly detection
 *
 * @example
 * ```typescript
 * import { FraudDetector, VelocityChecker } from '@ankr/fraud-detection';
 *
 * const detector = new FraudDetector();
 * const result = await detector.analyze(transaction);
 *
 * if (result.riskLevel === 'HIGH') {
 *   // Block or review transaction
 * }
 * ```
 *
 * @packageDocumentation
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Risk level classification
 */
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';

/**
 * Fraud detection action
 */
export type FraudAction = 'BLOCK' | 'REVIEW' | 'CHALLENGE' | 'MONITOR' | 'ALLOW';

/**
 * Transaction type
 */
export type TransactionType =
  | 'TRANSFER'
  | 'PAYMENT'
  | 'WITHDRAWAL'
  | 'DEPOSIT'
  | 'CARD_PAYMENT'
  | 'UPI'
  | 'NEFT'
  | 'RTGS'
  | 'IMPS'
  | 'OTHER';

/**
 * Transaction for fraud analysis
 */
export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  timestamp: Date;
  merchantId?: string;
  merchantName?: string;
  merchantCategory?: string;
  sourceAccount?: string;
  destinationAccount?: string;
  beneficiaryName?: string;
  description?: string;
  channel?: string;
  device?: DeviceInfo;
  location?: LocationInfo;
  metadata?: Record<string, any>;
}

/**
 * Device information
 */
export interface DeviceInfo {
  deviceId?: string;
  fingerprint?: string;
  type?: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'OTHER';
  os?: string;
  browser?: string;
  ip?: string;
  userAgent?: string;
  isRooted?: boolean;
  isEmulator?: boolean;
}

/**
 * Location information
 */
export interface LocationInfo {
  country?: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  ipCountry?: string;
}

/**
 * User profile for fraud analysis
 */
export interface UserProfile {
  userId: string;
  accountAge: number; // days
  kycStatus?: 'VERIFIED' | 'PENDING' | 'REJECTED';
  riskTier?: 'LOW' | 'MEDIUM' | 'HIGH';
  avgTransactionAmount?: number;
  avgMonthlyVolume?: number;
  usualLocations?: string[];
  usualDevices?: string[];
  usualMerchants?: string[];
  lastLoginAt?: Date;
  failedLoginAttempts?: number;
}

/**
 * Fraud signal detected
 */
export interface FraudSignal {
  code: string;
  name: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  details?: Record<string, any>;
}

/**
 * Fraud analysis result
 */
export interface FraudAnalysisResult {
  transactionId: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  recommendedAction: FraudAction;
  signals: FraudSignal[];
  velocityChecks: VelocityCheckResult[];
  rulesTriggered: string[];
  confidence: number;
  analysisTime: number; // ms
  timestamp: Date;
  explanation: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VELOCITY CHECKER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Velocity check configuration
 */
export interface VelocityLimit {
  name: string;
  window: number; // seconds
  maxCount?: number;
  maxAmount?: number;
  action: FraudAction;
}

/**
 * Velocity check result
 */
export interface VelocityCheckResult {
  name: string;
  passed: boolean;
  currentCount?: number;
  currentAmount?: number;
  limit?: VelocityLimit;
  message: string;
}

/**
 * In-memory velocity tracking entry
 */
interface VelocityEntry {
  count: number;
  amount: number;
  timestamps: number[];
}

/**
 * Default velocity limits
 */
const DEFAULT_VELOCITY_LIMITS: VelocityLimit[] = [
  // Per minute limits
  { name: 'txn_per_minute', window: 60, maxCount: 3, action: 'REVIEW' },
  { name: 'amount_per_minute', window: 60, maxAmount: 50000, action: 'REVIEW' },

  // Per hour limits
  { name: 'txn_per_hour', window: 3600, maxCount: 10, action: 'REVIEW' },
  { name: 'amount_per_hour', window: 3600, maxAmount: 200000, action: 'REVIEW' },

  // Per day limits
  { name: 'txn_per_day', window: 86400, maxCount: 50, action: 'BLOCK' },
  { name: 'amount_per_day', window: 86400, maxAmount: 1000000, action: 'BLOCK' },

  // High-value single transaction
  { name: 'single_txn_limit', window: 1, maxAmount: 500000, action: 'CHALLENGE' },
];

/**
 * Velocity Checker
 *
 * Tracks transaction frequency and amounts within time windows.
 */
export class VelocityChecker {
  private store = new Map<string, Map<string, VelocityEntry>>();
  private limits: VelocityLimit[];

  constructor(limits?: VelocityLimit[]) {
    this.limits = limits || DEFAULT_VELOCITY_LIMITS;
  }

  /**
   * Check velocity for a transaction
   */
  check(
    userId: string,
    amount: number,
    customLimits?: VelocityLimit[]
  ): VelocityCheckResult[] {
    const results: VelocityCheckResult[] = [];
    const now = Date.now();
    const limits = customLimits || this.limits;

    // Get or create user store
    if (!this.store.has(userId)) {
      this.store.set(userId, new Map());
    }
    const userStore = this.store.get(userId)!;

    for (const limit of limits) {
      // Get or create entry for this limit
      if (!userStore.has(limit.name)) {
        userStore.set(limit.name, { count: 0, amount: 0, timestamps: [] });
      }
      const entry = userStore.get(limit.name)!;

      // Clean old entries outside window
      const cutoff = now - limit.window * 1000;
      entry.timestamps = entry.timestamps.filter(ts => ts > cutoff);
      entry.count = entry.timestamps.length;

      // Recalculate amount (simplified - in production, store amounts)
      // For now, assume average amount per transaction
      entry.amount = entry.count > 0 ? (entry.amount / (entry.count + 1)) * entry.count : 0;

      // Check limits
      let passed = true;
      let message = 'OK';

      if (limit.maxCount !== undefined && entry.count >= limit.maxCount) {
        passed = false;
        message = `Exceeded ${limit.maxCount} transactions in ${formatWindow(limit.window)}`;
      }

      if (limit.maxAmount !== undefined) {
        const projectedAmount = entry.amount + amount;
        if (projectedAmount > limit.maxAmount) {
          passed = false;
          message = `Exceeded ${formatAmount(limit.maxAmount)} in ${formatWindow(limit.window)}`;
        }
      }

      results.push({
        name: limit.name,
        passed,
        currentCount: entry.count,
        currentAmount: entry.amount,
        limit,
        message,
      });
    }

    return results;
  }

  /**
   * Record a transaction (call after approval)
   */
  record(userId: string, amount: number): void {
    const now = Date.now();

    if (!this.store.has(userId)) {
      this.store.set(userId, new Map());
    }
    const userStore = this.store.get(userId)!;

    for (const limit of this.limits) {
      if (!userStore.has(limit.name)) {
        userStore.set(limit.name, { count: 0, amount: 0, timestamps: [] });
      }
      const entry = userStore.get(limit.name)!;
      entry.timestamps.push(now);
      entry.count = entry.timestamps.length;
      entry.amount += amount;
    }
  }

  /**
   * Clear velocity data for a user
   */
  clear(userId: string): void {
    this.store.delete(userId);
  }

  /**
   * Clear all velocity data
   */
  clearAll(): void {
    this.store.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RULE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fraud rule definition
 */
export interface FraudRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  condition: (txn: Transaction, profile?: UserProfile) => boolean;
  signal: Omit<FraudSignal, 'code'>;
  action: FraudAction;
}

/**
 * Default fraud rules
 */
const DEFAULT_RULES: FraudRule[] = [
  // High-value transaction
  {
    id: 'HIGH_VALUE',
    name: 'High Value Transaction',
    description: 'Transaction amount exceeds threshold',
    enabled: true,
    priority: 1,
    condition: (txn) => txn.amount > 500000,
    signal: {
      name: 'High Value',
      description: 'Transaction amount is unusually high',
      severity: 'HIGH',
      score: 30,
    },
    action: 'CHALLENGE',
  },

  // Round amount (often fraudulent)
  {
    id: 'ROUND_AMOUNT',
    name: 'Round Amount',
    description: 'Transaction has suspiciously round amount',
    enabled: true,
    priority: 5,
    condition: (txn) => txn.amount >= 10000 && txn.amount % 10000 === 0,
    signal: {
      name: 'Round Amount',
      description: 'Transaction amount is suspiciously round',
      severity: 'LOW',
      score: 10,
    },
    action: 'MONITOR',
  },

  // New account high value
  {
    id: 'NEW_ACCOUNT_HIGH_VALUE',
    name: 'New Account High Value',
    description: 'High value transaction from new account',
    enabled: true,
    priority: 2,
    condition: (txn, profile) =>
      (profile?.accountAge || 0) < 30 && txn.amount > 100000,
    signal: {
      name: 'New Account High Value',
      description: 'New account attempting high value transaction',
      severity: 'HIGH',
      score: 40,
    },
    action: 'REVIEW',
  },

  // Unusual time (late night)
  {
    id: 'UNUSUAL_TIME',
    name: 'Unusual Time',
    description: 'Transaction at unusual hours',
    enabled: true,
    priority: 6,
    condition: (txn) => {
      const hour = txn.timestamp.getHours();
      return hour >= 0 && hour < 5;
    },
    signal: {
      name: 'Unusual Time',
      description: 'Transaction initiated at unusual hours (midnight to 5 AM)',
      severity: 'MEDIUM',
      score: 15,
    },
    action: 'MONITOR',
  },

  // Rapid succession
  {
    id: 'FIRST_TXN_HIGH_VALUE',
    name: 'First Transaction High Value',
    description: 'First transaction is high value',
    enabled: true,
    priority: 2,
    condition: (txn, profile) =>
      (profile?.avgTransactionAmount === undefined || profile.avgTransactionAmount === 0) &&
      txn.amount > 50000,
    signal: {
      name: 'First High Value',
      description: 'First transaction on account is high value',
      severity: 'HIGH',
      score: 35,
    },
    action: 'CHALLENGE',
  },

  // Device change with high value
  {
    id: 'NEW_DEVICE_HIGH_VALUE',
    name: 'New Device High Value',
    description: 'High value transaction from new device',
    enabled: true,
    priority: 3,
    condition: (txn, profile) => {
      if (!txn.device?.deviceId || !profile?.usualDevices) return false;
      const isNewDevice = !profile.usualDevices.includes(txn.device.deviceId);
      return isNewDevice && txn.amount > 50000;
    },
    signal: {
      name: 'New Device',
      description: 'Transaction from unrecognized device',
      severity: 'HIGH',
      score: 35,
    },
    action: 'CHALLENGE',
  },

  // Rooted/jailbroken device
  {
    id: 'ROOTED_DEVICE',
    name: 'Rooted Device',
    description: 'Transaction from rooted/jailbroken device',
    enabled: true,
    priority: 3,
    condition: (txn) => txn.device?.isRooted === true,
    signal: {
      name: 'Rooted Device',
      description: 'Transaction from potentially compromised device',
      severity: 'HIGH',
      score: 40,
    },
    action: 'REVIEW',
  },

  // Emulator detection
  {
    id: 'EMULATOR',
    name: 'Emulator Detected',
    description: 'Transaction from emulator',
    enabled: true,
    priority: 2,
    condition: (txn) => txn.device?.isEmulator === true,
    signal: {
      name: 'Emulator',
      description: 'Transaction from emulator environment',
      severity: 'CRITICAL',
      score: 60,
    },
    action: 'BLOCK',
  },

  // Location mismatch
  {
    id: 'LOCATION_MISMATCH',
    name: 'Location Mismatch',
    description: 'IP country differs from declared location',
    enabled: true,
    priority: 4,
    condition: (txn) => {
      if (!txn.location?.country || !txn.location?.ipCountry) return false;
      return txn.location.country !== txn.location.ipCountry;
    },
    signal: {
      name: 'Location Mismatch',
      description: 'IP geolocation does not match declared location',
      severity: 'MEDIUM',
      score: 25,
    },
    action: 'REVIEW',
  },

  // Suspicious beneficiary name
  {
    id: 'SUSPICIOUS_BENEFICIARY',
    name: 'Suspicious Beneficiary',
    description: 'Beneficiary name contains suspicious patterns',
    enabled: true,
    priority: 5,
    condition: (txn) => {
      if (!txn.beneficiaryName) return false;
      const suspicious = /test|dummy|fake|fraud|xyz|abc123/i;
      return suspicious.test(txn.beneficiaryName);
    },
    signal: {
      name: 'Suspicious Beneficiary',
      description: 'Beneficiary name contains suspicious keywords',
      severity: 'MEDIUM',
      score: 20,
    },
    action: 'REVIEW',
  },

  // Multiple failed logins before transaction
  {
    id: 'FAILED_LOGINS',
    name: 'Failed Login Attempts',
    description: 'Transaction after multiple failed login attempts',
    enabled: true,
    priority: 3,
    condition: (txn, profile) => (profile?.failedLoginAttempts || 0) >= 3,
    signal: {
      name: 'Failed Logins',
      description: 'Multiple failed login attempts before transaction',
      severity: 'HIGH',
      score: 40,
    },
    action: 'CHALLENGE',
  },

  // Unverified KYC high value
  {
    id: 'UNVERIFIED_KYC',
    name: 'Unverified KYC High Value',
    description: 'High value transaction without verified KYC',
    enabled: true,
    priority: 2,
    condition: (txn, profile) =>
      profile?.kycStatus !== 'VERIFIED' && txn.amount > 50000,
    signal: {
      name: 'Unverified KYC',
      description: 'KYC not verified for high value transaction',
      severity: 'HIGH',
      score: 45,
    },
    action: 'BLOCK',
  },
];

/**
 * Rule Engine for fraud detection
 */
export class RuleEngine {
  private rules: FraudRule[];

  constructor(rules?: FraudRule[]) {
    this.rules = rules || DEFAULT_RULES;
    // Sort by priority
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Evaluate all rules against a transaction
   */
  evaluate(
    transaction: Transaction,
    profile?: UserProfile
  ): { signals: FraudSignal[]; triggeredRules: string[] } {
    const signals: FraudSignal[] = [];
    const triggeredRules: string[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(transaction, profile)) {
          signals.push({
            code: rule.id,
            ...rule.signal,
          });
          triggeredRules.push(rule.id);
        }
      } catch {
        // Skip rule on error
      }
    }

    return { signals, triggeredRules };
  }

  /**
   * Add a custom rule
   */
  addRule(rule: FraudRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Get all rules
   */
  getRules(): FraudRule[] {
    return [...this.rules];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FRAUD DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fraud detector configuration
 */
export interface FraudDetectorConfig {
  /** Risk score threshold for CRITICAL */
  criticalThreshold?: number;
  /** Risk score threshold for HIGH */
  highThreshold?: number;
  /** Risk score threshold for MEDIUM */
  mediumThreshold?: number;
  /** Risk score threshold for LOW */
  lowThreshold?: number;
  /** Custom velocity limits */
  velocityLimits?: VelocityLimit[];
  /** Custom fraud rules */
  customRules?: FraudRule[];
  /** Enable velocity checking */
  enableVelocity?: boolean;
  /** Enable rule engine */
  enableRules?: boolean;
}

const DEFAULT_DETECTOR_CONFIG: Required<Omit<FraudDetectorConfig, 'velocityLimits' | 'customRules'>> = {
  criticalThreshold: 80,
  highThreshold: 60,
  mediumThreshold: 40,
  lowThreshold: 20,
  enableVelocity: true,
  enableRules: true,
};

/**
 * Fraud Detector
 *
 * Main fraud detection engine that combines velocity checking,
 * rule evaluation, and risk scoring.
 */
export class FraudDetector {
  private config: typeof DEFAULT_DETECTOR_CONFIG & FraudDetectorConfig;
  private velocityChecker: VelocityChecker;
  private ruleEngine: RuleEngine;

  constructor(config?: FraudDetectorConfig) {
    this.config = { ...DEFAULT_DETECTOR_CONFIG, ...config };
    this.velocityChecker = new VelocityChecker(config?.velocityLimits);
    this.ruleEngine = new RuleEngine(config?.customRules);
  }

  /**
   * Analyze a transaction for fraud
   */
  analyze(
    transaction: Transaction,
    profile?: UserProfile
  ): FraudAnalysisResult {
    const startTime = Date.now();
    const signals: FraudSignal[] = [];
    const velocityChecks: VelocityCheckResult[] = [];
    let triggeredRules: string[] = [];

    // Velocity checks
    if (this.config.enableVelocity) {
      const velResults = this.velocityChecker.check(
        transaction.userId,
        transaction.amount
      );
      velocityChecks.push(...velResults);

      // Add signals for failed velocity checks
      for (const check of velResults.filter(c => !c.passed)) {
        signals.push({
          code: `VEL_${check.name.toUpperCase()}`,
          name: `Velocity: ${check.name}`,
          description: check.message,
          severity: check.limit?.action === 'BLOCK' ? 'CRITICAL' : 'HIGH',
          score: check.limit?.action === 'BLOCK' ? 40 : 25,
        });
      }
    }

    // Rule evaluation
    if (this.config.enableRules) {
      const ruleResults = this.ruleEngine.evaluate(transaction, profile);
      signals.push(...ruleResults.signals);
      triggeredRules = ruleResults.triggeredRules;
    }

    // Calculate risk score
    const riskScore = Math.min(100, signals.reduce((sum, s) => sum + s.score, 0));
    const riskLevel = this.getRiskLevel(riskScore);
    const recommendedAction = this.getRecommendedAction(riskLevel, signals);

    // Generate explanation
    const explanation = this.generateExplanation(signals, riskLevel);

    return {
      transactionId: transaction.id,
      riskScore,
      riskLevel,
      recommendedAction,
      signals,
      velocityChecks,
      rulesTriggered: triggeredRules,
      confidence: this.calculateConfidence(signals, profile),
      analysisTime: Date.now() - startTime,
      timestamp: new Date(),
      explanation,
    };
  }

  /**
   * Record a transaction (after approval)
   */
  recordTransaction(userId: string, amount: number): void {
    this.velocityChecker.record(userId, amount);
  }

  /**
   * Get risk level from score
   */
  private getRiskLevel(score: number): RiskLevel {
    if (score >= this.config.criticalThreshold) return 'CRITICAL';
    if (score >= this.config.highThreshold) return 'HIGH';
    if (score >= this.config.mediumThreshold) return 'MEDIUM';
    if (score >= this.config.lowThreshold) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Get recommended action based on risk level and signals
   */
  private getRecommendedAction(
    riskLevel: RiskLevel,
    signals: FraudSignal[]
  ): FraudAction {
    // Check for blocking signals
    if (signals.some(s => s.severity === 'CRITICAL')) {
      return 'BLOCK';
    }

    switch (riskLevel) {
      case 'CRITICAL':
        return 'BLOCK';
      case 'HIGH':
        return 'REVIEW';
      case 'MEDIUM':
        return 'CHALLENGE';
      case 'LOW':
        return 'MONITOR';
      default:
        return 'ALLOW';
    }
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(
    signals: FraudSignal[],
    profile?: UserProfile
  ): number {
    let confidence = 70; // Base confidence

    // More signals = higher confidence
    if (signals.length > 3) confidence += 10;

    // Profile data increases confidence
    if (profile) {
      if (profile.avgTransactionAmount) confidence += 5;
      if (profile.usualDevices?.length) confidence += 5;
      if (profile.usualLocations?.length) confidence += 5;
      if (profile.kycStatus === 'VERIFIED') confidence += 5;
    }

    return Math.min(95, confidence);
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(
    signals: FraudSignal[],
    riskLevel: RiskLevel
  ): string {
    if (signals.length === 0) {
      return 'No fraud indicators detected. Transaction appears legitimate.';
    }

    const topSignals = signals
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.name)
      .join(', ');

    return `${riskLevel} risk transaction. Primary concerns: ${topSignals}. Total ${signals.length} indicator(s) detected.`;
  }

  /**
   * Get the rule engine for customization
   */
  getRuleEngine(): RuleEngine {
    return this.ruleEngine;
  }

  /**
   * Get the velocity checker for customization
   */
  getVelocityChecker(): VelocityChecker {
    return this.velocityChecker;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format time window for display
 */
function formatWindow(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
}

/**
 * Format amount for display
 */
function formatAmount(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if location is physically possible given time and distance
 */
export function isLocationPossible(
  loc1: LocationInfo,
  time1: Date,
  loc2: LocationInfo,
  time2: Date,
  maxSpeedKmh = 900 // Airplane speed
): boolean {
  if (!loc1.latitude || !loc1.longitude || !loc2.latitude || !loc2.longitude) {
    return true; // Can't determine
  }

  const distance = calculateDistance(
    loc1.latitude,
    loc1.longitude,
    loc2.latitude,
    loc2.longitude
  );

  const timeDiffHours = Math.abs(time2.getTime() - time1.getTime()) / (1000 * 60 * 60);
  const requiredSpeed = distance / timeDiffHours;

  return requiredSpeed <= maxSpeedKmh;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

/** Default fraud detector instance */
export const fraudDetector = new FraudDetector();

/** Default velocity checker instance */
export const velocityChecker = new VelocityChecker();

/** Default rule engine instance */
export const ruleEngine = new RuleEngine();

/**
 * Create a configured fraud detector
 */
export function createFraudDetector(config?: FraudDetectorConfig): FraudDetector {
  return new FraudDetector(config);
}
