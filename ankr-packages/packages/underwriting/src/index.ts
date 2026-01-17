/**
 * @ankr/underwriting
 * Universal Underwriting Intelligence Engine
 * Insurance underwriting, credit underwriting, KYC decisions
 */

// Types
export type UnderwritingStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'REFERRED'
  | 'DECISION_MADE'
  | 'COMPLETED';

export type RuleType = 'THRESHOLD' | 'RANGE' | 'LOOKUP' | 'FORMULA';

export type EvaluationResult = 'PASS' | 'FAIL' | 'REFER' | 'NA';

export type UnderwritingDecisionType =
  | 'STANDARD_ACCEPT'
  | 'SUBSTANDARD_ACCEPT'
  | 'DECLINE'
  | 'POSTPONE'
  | 'REFER';

export type RiskCategory = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface UnderwritingRequest {
  id: string;
  requestNumber: string;
  applicantName: string;
  customerId?: string;
  applicantDetails: Record<string, any>;
  productType: string;
  productCode: string;
  sumInsured?: number;
  loanAmount?: number;
  tenure?: number;
  medicalHistory?: Record<string, any>;
  financialInfo?: Record<string, any>;
  occupationInfo?: Record<string, any>;
  lifestyleInfo?: Record<string, any>;
  propertyInfo?: Record<string, any>;
  vehicleInfo?: Record<string, any>;
  status: UnderwritingStatus;
  decision?: UnderwritingDecisionType;
  decisionReason?: string;
  decisionBy?: string;
  decisionAt?: Date;
  riskScore?: number;
  riskCategory?: RiskCategory;
  premiumLoading?: number;
  exclusions: string[];
  specialConditions?: string;
  slaDeadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnderwritingRule {
  id: string;
  ruleCode: string;
  ruleName: string;
  ruleDescription?: string;
  ruleCategory: string;
  productTypes: string[];
  ruleType: RuleType;
  condition: Record<string, any>;
  defaultAction: string;
  priority: number;
  weight?: number;
  isActive: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnderwritingEvaluation {
  id: string;
  requestId: string;
  ruleId: string;
  inputData: Record<string, any>;
  result: EvaluationResult;
  score?: number;
  recommendedAction: string;
  actionDetails?: Record<string, any>;
  createdAt: Date;
}

export interface UnderwritingReferral {
  id: string;
  requestId: string;
  referralType: string;
  referralReason: string;
  referredTo: string;
  referredBy: string;
  status: string;
  response?: string;
  responseBy?: string;
  responseAt?: Date;
  slaDeadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnderwritingRequestInput {
  applicantName: string;
  customerId?: string;
  productType: string;
  productCode: string;
  sumInsured?: number;
  loanAmount?: number;
  tenure?: number;
  medicalHistory?: Record<string, any>;
  financialInfo?: Record<string, any>;
  occupationInfo?: Record<string, any>;
  lifestyleInfo?: Record<string, any>;
  propertyInfo?: Record<string, any>;
  vehicleInfo?: Record<string, any>;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleCode: string;
  result: EvaluationResult;
  score?: number;
  recommendedAction: string;
  details?: Record<string, any>;
}

export interface UnderwritingDecision {
  decision: UnderwritingDecisionType;
  riskScore: number;
  riskCategory: RiskCategory;
  premiumLoading?: number;
  exclusions: string[];
  specialConditions?: string;
  evaluations: RuleEvaluationResult[];
}

export interface RuleInput {
  ruleCode: string;
  ruleName: string;
  ruleDescription?: string;
  ruleCategory: string;
  productTypes: string[];
  ruleType: RuleType;
  condition: Record<string, any>;
  defaultAction: string;
  priority?: number;
  weight?: number;
}

export interface DashboardStats {
  pending: number;
  inReview: number;
  referred: number;
  completed: number;
  total: number;
}

// Storage Interface
export interface UnderwritingStorage {
  // Request operations
  createRequest(request: Omit<UnderwritingRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'>): Promise<UnderwritingRequest>;
  getRequest(id: string): Promise<UnderwritingRequest | null>;
  updateRequest(id: string, updates: Partial<UnderwritingRequest>): Promise<UnderwritingRequest>;
  findRequests(filter: { status?: UnderwritingStatus[]; customerId?: string }): Promise<UnderwritingRequest[]>;
  countRequests(filter: { status?: UnderwritingStatus }): Promise<number>;

  // Rule operations
  createRule(rule: Omit<UnderwritingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<UnderwritingRule>;
  getRule(id: string): Promise<UnderwritingRule | null>;
  updateRule(id: string, updates: Partial<UnderwritingRule>): Promise<UnderwritingRule>;
  getActiveRules(productType: string): Promise<UnderwritingRule[]>;

  // Evaluation operations
  createEvaluation(evaluation: Omit<UnderwritingEvaluation, 'id' | 'createdAt'>): Promise<UnderwritingEvaluation>;
  getEvaluations(requestId: string): Promise<UnderwritingEvaluation[]>;

  // Referral operations
  createReferral(referral: Omit<UnderwritingReferral, 'id' | 'createdAt' | 'updatedAt'>): Promise<UnderwritingReferral>;
  updateReferral(id: string, updates: Partial<UnderwritingReferral>): Promise<UnderwritingReferral>;
  getReferrals(requestId: string): Promise<UnderwritingReferral[]>;
}

// Main Engine
export class UnderwritingEngine {
  private storage: UnderwritingStorage;

  constructor(storage: UnderwritingStorage) {
    this.storage = storage;
  }

  /**
   * Create a new underwriting request
   */
  async createRequest(input: UnderwritingRequestInput): Promise<UnderwritingRequest> {
    return this.storage.createRequest({
      applicantName: input.applicantName,
      customerId: input.customerId,
      applicantDetails: input,
      productType: input.productType,
      productCode: input.productCode,
      sumInsured: input.sumInsured,
      loanAmount: input.loanAmount,
      tenure: input.tenure,
      medicalHistory: input.medicalHistory,
      financialInfo: input.financialInfo,
      occupationInfo: input.occupationInfo,
      lifestyleInfo: input.lifestyleInfo,
      propertyInfo: input.propertyInfo,
      vehicleInfo: input.vehicleInfo,
      status: 'PENDING',
      exclusions: [],
      slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });
  }

  /**
   * Get active rules for a product type
   */
  async getActiveRules(productType: string): Promise<UnderwritingRule[]> {
    return this.storage.getActiveRules(productType);
  }

  /**
   * Evaluate a single rule
   */
  evaluateRule(rule: UnderwritingRule, applicantData: Record<string, any>): RuleEvaluationResult {
    const condition = rule.condition;
    let result: EvaluationResult = 'NA';
    let score: number | undefined;

    try {
      switch (rule.ruleType) {
        case 'THRESHOLD':
          result = this.evaluateThreshold(condition, applicantData);
          break;
        case 'RANGE':
          result = this.evaluateRange(condition, applicantData);
          break;
        case 'LOOKUP':
          result = this.evaluateLookup(condition, applicantData);
          break;
        case 'FORMULA':
          const formulaResult = this.evaluateFormula(condition, applicantData);
          result = formulaResult.result;
          score = formulaResult.score;
          break;
        default:
          result = 'NA';
      }
    } catch {
      result = 'REFER';
    }

    return {
      ruleId: rule.id,
      ruleCode: rule.ruleCode,
      result,
      score,
      recommendedAction: result === 'FAIL' ? rule.defaultAction : 'ACCEPT',
      details: { condition, applicantData },
    };
  }

  private evaluateThreshold(condition: Record<string, any>, data: Record<string, any>): EvaluationResult {
    const { field, operator, value } = condition;
    const fieldValue = this.getNestedValue(data, field);

    if (fieldValue === undefined) return 'NA';

    switch (operator) {
      case 'gt': return fieldValue > value ? 'PASS' : 'FAIL';
      case 'gte': return fieldValue >= value ? 'PASS' : 'FAIL';
      case 'lt': return fieldValue < value ? 'PASS' : 'FAIL';
      case 'lte': return fieldValue <= value ? 'PASS' : 'FAIL';
      case 'eq': return fieldValue === value ? 'PASS' : 'FAIL';
      case 'neq': return fieldValue !== value ? 'PASS' : 'FAIL';
      default: return 'REFER';
    }
  }

  private evaluateRange(condition: Record<string, any>, data: Record<string, any>): EvaluationResult {
    const { field, min, max } = condition;
    const fieldValue = this.getNestedValue(data, field);

    if (fieldValue === undefined) return 'NA';

    return fieldValue >= min && fieldValue <= max ? 'PASS' : 'FAIL';
  }

  private evaluateLookup(condition: Record<string, any>, data: Record<string, any>): EvaluationResult {
    const { field, allowedValues, deniedValues } = condition;
    const fieldValue = this.getNestedValue(data, field);

    if (fieldValue === undefined) return 'NA';

    if (deniedValues?.includes(fieldValue)) return 'FAIL';
    if (allowedValues && !allowedValues.includes(fieldValue)) return 'FAIL';

    return 'PASS';
  }

  private evaluateFormula(condition: Record<string, any>, data: Record<string, any>): { result: EvaluationResult; score: number } {
    const { factors, passThreshold, referThreshold } = condition;
    let score = 0;

    for (const factor of factors || []) {
      const value = this.getNestedValue(data, factor.field);
      if (value !== undefined) {
        score += (value * factor.weight) || 0;
      }
    }

    if (score >= passThreshold) return { result: 'PASS', score };
    if (score >= referThreshold) return { result: 'REFER', score };
    return { result: 'FAIL', score };
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Run automated underwriting
   */
  async runAutomatedUnderwriting(requestId: string): Promise<UnderwritingDecision> {
    const request = await this.storage.getRequest(requestId);
    if (!request) throw new Error('Request not found');

    // Get applicable rules
    const rules = await this.getActiveRules(request.productType);

    // Prepare applicant data
    const applicantData = {
      ...request.applicantDetails,
      medical: request.medicalHistory,
      financial: request.financialInfo,
      occupation: request.occupationInfo,
      lifestyle: request.lifestyleInfo,
      property: request.propertyInfo,
      vehicle: request.vehicleInfo,
    };

    // Evaluate all rules
    const evaluations: RuleEvaluationResult[] = [];
    let totalScore = 0;
    let scoreCount = 0;
    const failedRules: string[] = [];
    const referredRules: string[] = [];

    for (const rule of rules) {
      const result = this.evaluateRule(rule, applicantData);
      evaluations.push(result);

      if (result.score !== undefined) {
        totalScore += result.score;
        scoreCount++;
      }

      if (result.result === 'FAIL') failedRules.push(rule.ruleCode);
      if (result.result === 'REFER') referredRules.push(rule.ruleCode);

      // Store evaluation
      await this.storage.createEvaluation({
        requestId,
        ruleId: rule.id,
        inputData: applicantData,
        result: result.result,
        score: result.score,
        recommendedAction: result.recommendedAction,
        actionDetails: result.details,
      });
    }

    // Calculate composite risk score
    const riskScore = scoreCount > 0 ? totalScore / scoreCount : 0.5;
    const riskCategory = this.categorizeRisk(riskScore);

    // Determine decision
    let decision: UnderwritingDecisionType;
    let premiumLoading: number | undefined;
    const exclusions: string[] = [];

    if (failedRules.length > 0) {
      const criticalFail = failedRules.some(code => code.startsWith('CRIT_'));
      decision = criticalFail ? 'DECLINE' : 'REFER';
    } else if (referredRules.length > 0) {
      decision = 'REFER';
    } else if (riskScore > 0.7) {
      decision = 'SUBSTANDARD_ACCEPT';
      premiumLoading = Math.round((riskScore - 0.5) * 100);
    } else {
      decision = 'STANDARD_ACCEPT';
    }

    // Update request
    await this.storage.updateRequest(requestId, {
      status: decision === 'REFER' ? 'REFERRED' : 'DECISION_MADE',
      decision,
      decisionBy: 'AUTO',
      decisionAt: new Date(),
      riskScore,
      riskCategory,
      premiumLoading,
      exclusions,
    });

    return {
      decision,
      riskScore,
      riskCategory,
      premiumLoading,
      exclusions,
      evaluations,
    };
  }

  private categorizeRisk(score: number): RiskCategory {
    if (score <= 0.25) return 'LOW';
    if (score <= 0.5) return 'MEDIUM';
    if (score <= 0.75) return 'HIGH';
    return 'VERY_HIGH';
  }

  /**
   * Create an underwriting rule
   */
  async createRule(input: RuleInput): Promise<UnderwritingRule> {
    return this.storage.createRule({
      ruleCode: input.ruleCode,
      ruleName: input.ruleName,
      ruleDescription: input.ruleDescription,
      ruleCategory: input.ruleCategory,
      productTypes: input.productTypes,
      ruleType: input.ruleType,
      condition: input.condition,
      defaultAction: input.defaultAction,
      priority: input.priority || 100,
      weight: input.weight,
      isActive: true,
    });
  }

  /**
   * Get underwriting request details
   */
  async getRequestDetails(requestId: string): Promise<{
    request: UnderwritingRequest;
    evaluations: UnderwritingEvaluation[];
    referrals: UnderwritingReferral[];
  } | null> {
    const request = await this.storage.getRequest(requestId);
    if (!request) return null;

    const [evaluations, referrals] = await Promise.all([
      this.storage.getEvaluations(requestId),
      this.storage.getReferrals(requestId),
    ]);

    return { request, evaluations, referrals };
  }

  /**
   * Create referral to specialist
   */
  async createReferral(input: {
    requestId: string;
    referralType: string;
    referralReason: string;
    referredTo: string;
    referredBy: string;
  }): Promise<UnderwritingReferral> {
    await this.storage.updateRequest(input.requestId, { status: 'REFERRED' });

    return this.storage.createReferral({
      requestId: input.requestId,
      referralType: input.referralType,
      referralReason: input.referralReason,
      referredTo: input.referredTo,
      referredBy: input.referredBy,
      status: 'PENDING',
      slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }

  /**
   * Make manual decision
   */
  async makeManualDecision(input: {
    requestId: string;
    decision: UnderwritingDecisionType;
    decisionReason: string;
    decisionBy: string;
    premiumLoading?: number;
    exclusions?: string[];
    specialConditions?: string;
  }): Promise<UnderwritingRequest> {
    return this.storage.updateRequest(input.requestId, {
      status: 'DECISION_MADE',
      decision: input.decision,
      decisionReason: input.decisionReason,
      decisionBy: input.decisionBy,
      decisionAt: new Date(),
      premiumLoading: input.premiumLoading,
      exclusions: input.exclusions || [],
      specialConditions: input.specialConditions,
    });
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const [pending, inReview, referred, completed] = await Promise.all([
      this.storage.countRequests({ status: 'PENDING' }),
      this.storage.countRequests({ status: 'IN_REVIEW' }),
      this.storage.countRequests({ status: 'REFERRED' }),
      this.storage.countRequests({ status: 'COMPLETED' }),
    ]);

    return {
      pending,
      inReview,
      referred,
      completed,
      total: pending + inReview + referred + completed,
    };
  }
}

// In-Memory Storage Implementation
export class InMemoryUnderwritingStorage implements UnderwritingStorage {
  private requests: Map<string, UnderwritingRequest> = new Map();
  private rules: Map<string, UnderwritingRule> = new Map();
  private evaluations: Map<string, UnderwritingEvaluation> = new Map();
  private referrals: Map<string, UnderwritingReferral> = new Map();

  async createRequest(data: Omit<UnderwritingRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'>): Promise<UnderwritingRequest> {
    const request: UnderwritingRequest = {
      ...data,
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      requestNumber: `UW${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.requests.set(request.id, request);
    return request;
  }

  async getRequest(id: string): Promise<UnderwritingRequest | null> {
    return this.requests.get(id) || null;
  }

  async updateRequest(id: string, updates: Partial<UnderwritingRequest>): Promise<UnderwritingRequest> {
    const request = this.requests.get(id);
    if (!request) throw new Error('Request not found');

    const updated = { ...request, ...updates, updatedAt: new Date() };
    this.requests.set(id, updated);
    return updated;
  }

  async findRequests(filter: { status?: UnderwritingStatus[]; customerId?: string }): Promise<UnderwritingRequest[]> {
    return Array.from(this.requests.values()).filter(r => {
      if (filter.status && !filter.status.includes(r.status)) return false;
      if (filter.customerId && r.customerId !== filter.customerId) return false;
      return true;
    });
  }

  async countRequests(filter: { status?: UnderwritingStatus }): Promise<number> {
    return Array.from(this.requests.values()).filter(r => {
      if (filter.status && r.status !== filter.status) return false;
      return true;
    }).length;
  }

  async createRule(data: Omit<UnderwritingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<UnderwritingRule> {
    const rule: UnderwritingRule = {
      ...data,
      id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rules.set(rule.id, rule);
    return rule;
  }

  async getRule(id: string): Promise<UnderwritingRule | null> {
    return this.rules.get(id) || null;
  }

  async updateRule(id: string, updates: Partial<UnderwritingRule>): Promise<UnderwritingRule> {
    const rule = this.rules.get(id);
    if (!rule) throw new Error('Rule not found');

    const updated = { ...rule, ...updates, updatedAt: new Date() };
    this.rules.set(id, updated);
    return updated;
  }

  async getActiveRules(productType: string): Promise<UnderwritingRule[]> {
    const now = new Date();
    return Array.from(this.rules.values())
      .filter(r => {
        if (!r.isActive) return false;
        if (!r.productTypes.includes(productType)) return false;
        if (r.effectiveTo && r.effectiveTo < now) return false;
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
  }

  async createEvaluation(data: Omit<UnderwritingEvaluation, 'id' | 'createdAt'>): Promise<UnderwritingEvaluation> {
    const evaluation: UnderwritingEvaluation = {
      ...data,
      id: `eval_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
    };
    this.evaluations.set(evaluation.id, evaluation);
    return evaluation;
  }

  async getEvaluations(requestId: string): Promise<UnderwritingEvaluation[]> {
    return Array.from(this.evaluations.values()).filter(e => e.requestId === requestId);
  }

  async createReferral(data: Omit<UnderwritingReferral, 'id' | 'createdAt' | 'updatedAt'>): Promise<UnderwritingReferral> {
    const referral: UnderwritingReferral = {
      ...data,
      id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.referrals.set(referral.id, referral);
    return referral;
  }

  async updateReferral(id: string, updates: Partial<UnderwritingReferral>): Promise<UnderwritingReferral> {
    const referral = this.referrals.get(id);
    if (!referral) throw new Error('Referral not found');

    const updated = { ...referral, ...updates, updatedAt: new Date() };
    this.referrals.set(id, updated);
    return updated;
  }

  async getReferrals(requestId: string): Promise<UnderwritingReferral[]> {
    return Array.from(this.referrals.values()).filter(r => r.requestId === requestId);
  }
}

// Factory function
export function createUnderwritingEngine(storage?: UnderwritingStorage): UnderwritingEngine {
  return new UnderwritingEngine(storage || new InMemoryUnderwritingStorage());
}

// Default rules for common scenarios
export const DEFAULT_INSURANCE_RULES: Omit<UnderwritingRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    ruleCode: 'AGE_CHECK',
    ruleName: 'Age Eligibility',
    ruleCategory: 'ELIGIBILITY',
    productTypes: ['LIFE', 'HEALTH', 'MOTOR'],
    ruleType: 'RANGE',
    condition: { field: 'applicantDetails.age', min: 18, max: 65 },
    defaultAction: 'DECLINE',
    priority: 1,
    isActive: true,
  },
  {
    ruleCode: 'SUM_INSURED_LIMIT',
    ruleName: 'Sum Insured Limit',
    ruleCategory: 'UNDERWRITING',
    productTypes: ['LIFE', 'HEALTH'],
    ruleType: 'THRESHOLD',
    condition: { field: 'sumInsured', operator: 'lte', value: 10000000 },
    defaultAction: 'REFER',
    priority: 2,
    isActive: true,
  },
  {
    ruleCode: 'CRIT_PRE_EXISTING',
    ruleName: 'Critical Pre-existing Conditions',
    ruleCategory: 'MEDICAL',
    productTypes: ['LIFE', 'HEALTH'],
    ruleType: 'LOOKUP',
    condition: {
      field: 'medical.criticalConditions',
      deniedValues: ['CANCER', 'AIDS', 'TERMINAL_ILLNESS'],
    },
    defaultAction: 'DECLINE',
    priority: 1,
    isActive: true,
  },
];
