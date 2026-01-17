/**
 * @ankr/financial-health
 *
 * Comprehensive financial wellness scoring with 7 components
 * and personalized recommendations.
 *
 * @example
 * ```typescript
 * import { FinancialHealthCalculator } from '@ankr/financial-health';
 *
 * const calculator = new FinancialHealthCalculator();
 * const score = calculator.calculate(profile);
 * // score.overallScore: 0-1000
 * // score.rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL'
 * ```
 *
 * @packageDocumentation
 */

// Re-define needed types locally (no external dependencies)
export type SpendingCategory =
  | 'FOOD_DINING' | 'GROCERIES' | 'SHOPPING' | 'ENTERTAINMENT'
  | 'UTILITIES' | 'TRANSPORT' | 'HEALTH' | 'EDUCATION'
  | 'HOUSING' | 'INSURANCE' | 'INVESTMENT' | 'TRANSFER'
  | 'EMI_LOAN' | 'SUBSCRIPTION' | 'TRAVEL' | 'PERSONAL_CARE'
  | 'GIFTS_CHARITY' | 'INCOME' | 'REFUND' | 'ATM_WITHDRAWAL' | 'OTHER';

export interface SpendingSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  categoryBreakdown: { category: SpendingCategory; amount: number; percentage: number }[];
}

// Simple logger
const logger = {
  info: (msg: string) => console.log(`[FinancialHealth] ${msg}`),
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface FinancialProfile {
  userId: string;

  // Income
  monthlyIncome: number;
  additionalIncome?: number;
  incomeStability: 'STABLE' | 'VARIABLE' | 'UNCERTAIN';

  // Savings
  totalSavings: number;
  liquidSavings: number; // Emergency fund
  savingsRate: number; // As percentage

  // Debt
  totalDebt: number;
  securedDebt: number;
  unsecuredDebt: number;
  monthlyEMI: number;
  creditUtilization: number; // Credit card utilization

  // Assets
  totalAssets: number;
  investmentAssets: number;
  realEstateValue?: number;
  vehicleValue?: number;

  // Insurance
  hasHealthInsurance: boolean;
  hasLifeInsurance: boolean;
  lifeInsuranceCoverage?: number;
  healthInsuranceCoverage?: number;

  // Credit
  creditScore?: number;
  activeLoans: number;
  creditCards: number;
  paymentHistory: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

  // Demographics
  age: number;
  dependents: number;
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';

  // Optional spending data
  spendingSummary?: SpendingSummary;
}

export interface FinancialHealthScore {
  overallScore: number; // 0-1000
  rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  ratingHi: string;

  components: HealthScoreComponent[];

  netWorth: NetWorthSummary;
  ratios: FinancialRatios;

  strengths: HealthInsight[];
  weaknesses: HealthInsight[];
  recommendations: HealthRecommendation[];

  peerComparison: PeerComparison;
  projections: FinancialProjection[];

  calculatedAt: Date;
}

export interface HealthScoreComponent {
  name: string;
  nameHi: string;
  score: number; // 0-100
  weight: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  statusHi: string;
  details: string;
  detailsHi: string;
  icon: string;
}

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  netWorthTrend: 'UP' | 'DOWN' | 'STABLE';
  assetBreakdown: { category: string; amount: number; percentage: number }[];
  liabilityBreakdown: { category: string; amount: number; percentage: number }[];
}

export interface FinancialRatios {
  debtToIncome: number;
  savingsRate: number;
  emergencyFundMonths: number;
  assetToDebt: number;
  liquidityRatio: number;
  insuranceCoverage: number;
  investmentRate: number;
}

export interface HealthInsight {
  type: 'STRENGTH' | 'WEAKNESS';
  icon: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface HealthRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  icon: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  potentialImpact: number; // Score points
  actionType: 'SAVE' | 'INVEST' | 'INSURE' | 'REDUCE_DEBT' | 'BUILD_EMERGENCY' | 'DIVERSIFY';
  suggestedAmount?: number;
  timeframe: string;
}

export interface PeerComparison {
  percentile: number; // Your position among peers (0-100)
  ageGroup: string;
  incomeGroup: string;
  avgScoreInGroup: number;
  topPerformersAvg: number;
  comparisonMessage: string;
  comparisonMessageHi: string;
}

export interface FinancialProjection {
  scenario: 'CURRENT' | 'OPTIMISTIC' | 'CONSERVATIVE';
  years: number;
  projectedNetWorth: number;
  projectedSavings: number;
  assumptions: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const RATING_THRESHOLDS = {
  EXCELLENT: 800,
  GOOD: 650,
  FAIR: 500,
  POOR: 350,
  CRITICAL: 0,
};

const RATING_HI: Record<string, string> = {
  EXCELLENT: 'उत्कृष्ट',
  GOOD: 'अच्छा',
  FAIR: 'ठीक',
  POOR: 'खराब',
  CRITICAL: 'गंभीर',
};

const COMPONENT_WEIGHTS = {
  emergencyFund: 0.15,
  debtManagement: 0.20,
  savingsHabit: 0.15,
  insuranceCoverage: 0.15,
  investmentDiversification: 0.15,
  creditHealth: 0.10,
  spendingBehavior: 0.10,
};

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCIAL HEALTH CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class FinancialHealthCalculator {
  /**
   * Calculate comprehensive financial health score
   */
  calculate(profile: FinancialProfile): FinancialHealthScore {
    logger.info(`Calculating financial health for user ${profile.userId}`);

    // Calculate component scores
    const components = this.calculateComponents(profile);

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      components.reduce((sum, c) => sum + c.score * c.weight, 0) * 10
    ); // Scale to 0-1000

    // Determine rating
    const rating = this.determineRating(overallScore);

    // Calculate financial ratios
    const ratios = this.calculateRatios(profile);

    // Calculate net worth
    const netWorth = this.calculateNetWorth(profile);

    // Generate insights
    const { strengths, weaknesses } = this.generateInsights(components, ratios, profile);

    // Generate recommendations
    const recommendations = this.generateRecommendations(components, ratios, profile);

    // Peer comparison
    const peerComparison = this.generatePeerComparison(overallScore, profile);

    // Projections
    const projections = this.generateProjections(profile, ratios);

    return {
      overallScore,
      rating,
      ratingHi: RATING_HI[rating],
      components,
      netWorth,
      ratios,
      strengths,
      weaknesses,
      recommendations,
      peerComparison,
      projections,
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate individual component scores
   */
  private calculateComponents(profile: FinancialProfile): HealthScoreComponent[] {
    const components: HealthScoreComponent[] = [];

    // 1. Emergency Fund Score
    const monthlyExpenses = profile.monthlyIncome - (profile.monthlyIncome * profile.savingsRate / 100);
    const emergencyMonths = monthlyExpenses > 0 ? profile.liquidSavings / monthlyExpenses : 0;
    const emergencyScore = Math.min(100, (emergencyMonths / 6) * 100);

    components.push({
      name: 'Emergency Fund',
      nameHi: 'आपातकालीन निधि',
      score: Math.round(emergencyScore),
      weight: COMPONENT_WEIGHTS.emergencyFund,
      status: this.getStatus(emergencyScore),
      statusHi: RATING_HI[this.getStatus(emergencyScore)],
      details: `${emergencyMonths.toFixed(1)} months of expenses covered (target: 6 months)`,
      detailsHi: `${emergencyMonths.toFixed(1)} महीने का खर्च कवर (लक्ष्य: 6 महीने)`,
      icon: '🏦',
    });

    // 2. Debt Management Score
    const dti = (profile.monthlyEMI / profile.monthlyIncome) * 100;
    const debtScore = Math.max(0, 100 - (dti * 2.5)); // DTI > 40% = 0

    components.push({
      name: 'Debt Management',
      nameHi: 'कर्ज प्रबंधन',
      score: Math.round(debtScore),
      weight: COMPONENT_WEIGHTS.debtManagement,
      status: this.getStatus(debtScore),
      statusHi: RATING_HI[this.getStatus(debtScore)],
      details: `Debt-to-income ratio: ${dti.toFixed(1)}% (healthy: <30%)`,
      detailsHi: `कर्ज-आय अनुपात: ${dti.toFixed(1)}% (स्वस्थ: <30%)`,
      icon: '💳',
    });

    // 3. Savings Habit Score
    const savingsScore = Math.min(100, (profile.savingsRate / 30) * 100); // 30% = 100

    components.push({
      name: 'Savings Habit',
      nameHi: 'बचत की आदत',
      score: Math.round(savingsScore),
      weight: COMPONENT_WEIGHTS.savingsHabit,
      status: this.getStatus(savingsScore),
      statusHi: RATING_HI[this.getStatus(savingsScore)],
      details: `Saving ${profile.savingsRate.toFixed(1)}% of income (target: 20-30%)`,
      detailsHi: `आय का ${profile.savingsRate.toFixed(1)}% बचत (लक्ष्य: 20-30%)`,
      icon: '💰',
    });

    // 4. Insurance Coverage Score
    let insuranceScore = 0;
    if (profile.hasHealthInsurance) insuranceScore += 40;
    if (profile.hasLifeInsurance) insuranceScore += 30;

    // Check adequacy
    const requiredLifeCover = profile.monthlyIncome * 12 * 10; // 10x annual income
    if (profile.lifeInsuranceCoverage && profile.lifeInsuranceCoverage >= requiredLifeCover * 0.8) {
      insuranceScore += 30;
    } else if (profile.lifeInsuranceCoverage && profile.lifeInsuranceCoverage >= requiredLifeCover * 0.5) {
      insuranceScore += 15;
    }

    components.push({
      name: 'Insurance Coverage',
      nameHi: 'बीमा कवरेज',
      score: Math.round(insuranceScore),
      weight: COMPONENT_WEIGHTS.insuranceCoverage,
      status: this.getStatus(insuranceScore),
      statusHi: RATING_HI[this.getStatus(insuranceScore)],
      details: `Health: ${profile.hasHealthInsurance ? '✓' : '✗'}, Life: ${profile.hasLifeInsurance ? '✓' : '✗'}`,
      detailsHi: `स्वास्थ्य: ${profile.hasHealthInsurance ? '✓' : '✗'}, जीवन: ${profile.hasLifeInsurance ? '✓' : '✗'}`,
      icon: '🛡️',
    });

    // 5. Investment Diversification Score
    const investmentRate = (profile.investmentAssets / profile.totalAssets) * 100;
    const diversificationScore = Math.min(100, (investmentRate / 40) * 100); // 40% in investments = 100

    components.push({
      name: 'Investment Health',
      nameHi: 'निवेश स्वास्थ्य',
      score: Math.round(diversificationScore),
      weight: COMPONENT_WEIGHTS.investmentDiversification,
      status: this.getStatus(diversificationScore),
      statusHi: RATING_HI[this.getStatus(diversificationScore)],
      details: `${investmentRate.toFixed(1)}% of assets in investments`,
      detailsHi: `संपत्ति का ${investmentRate.toFixed(1)}% निवेश में`,
      icon: '📈',
    });

    // 6. Credit Health Score
    let creditScore = 50; // Base
    if (profile.creditScore) {
      if (profile.creditScore >= 750) creditScore = 100;
      else if (profile.creditScore >= 700) creditScore = 80;
      else if (profile.creditScore >= 650) creditScore = 60;
      else if (profile.creditScore >= 600) creditScore = 40;
      else creditScore = 20;
    }

    // Adjust for credit utilization
    if (profile.creditUtilization <= 30) creditScore = Math.min(100, creditScore + 10);
    else if (profile.creditUtilization > 70) creditScore = Math.max(0, creditScore - 20);

    components.push({
      name: 'Credit Health',
      nameHi: 'क्रेडिट स्वास्थ्य',
      score: Math.round(creditScore),
      weight: COMPONENT_WEIGHTS.creditHealth,
      status: this.getStatus(creditScore),
      statusHi: RATING_HI[this.getStatus(creditScore)],
      details: `Credit score: ${profile.creditScore || 'N/A'}, Utilization: ${profile.creditUtilization}%`,
      detailsHi: `क्रेडिट स्कोर: ${profile.creditScore || 'N/A'}, उपयोग: ${profile.creditUtilization}%`,
      icon: '📊',
    });

    // 7. Spending Behavior Score (if available)
    let spendingScore = 70; // Default
    if (profile.spendingSummary) {
      const essentialCategories: SpendingCategory[] = ['HOUSING', 'UTILITIES', 'GROCERIES', 'HEALTH', 'INSURANCE', 'EMI_LOAN', 'EDUCATION'];
      const essentialSpending = profile.spendingSummary.categoryBreakdown
        .filter((c) => essentialCategories.includes(c.category))
        .reduce((sum, c) => sum + c.percentage, 0);

      // 50-70% essential = 100, >85% = 50, <40% may mean missing essentials
      if (essentialSpending >= 50 && essentialSpending <= 70) spendingScore = 100;
      else if (essentialSpending > 70 && essentialSpending <= 85) spendingScore = 80;
      else if (essentialSpending > 85) spendingScore = 50;
      else if (essentialSpending < 40) spendingScore = 60;
    }

    components.push({
      name: 'Spending Behavior',
      nameHi: 'खर्च व्यवहार',
      score: Math.round(spendingScore),
      weight: COMPONENT_WEIGHTS.spendingBehavior,
      status: this.getStatus(spendingScore),
      statusHi: RATING_HI[this.getStatus(spendingScore)],
      details: 'Balanced essential vs discretionary spending',
      detailsHi: 'आवश्यक बनाम विवेकाधीन खर्च में संतुलन',
      icon: '📋',
    });

    return components;
  }

  /**
   * Calculate financial ratios
   */
  private calculateRatios(profile: FinancialProfile): FinancialRatios {
    const monthlyExpenses = profile.monthlyIncome - (profile.monthlyIncome * profile.savingsRate / 100);

    return {
      debtToIncome: (profile.monthlyEMI / profile.monthlyIncome) * 100,
      savingsRate: profile.savingsRate,
      emergencyFundMonths: monthlyExpenses > 0 ? profile.liquidSavings / monthlyExpenses : 0,
      assetToDebt: profile.totalDebt > 0 ? profile.totalAssets / profile.totalDebt : Infinity,
      liquidityRatio: profile.totalDebt > 0 ? profile.liquidSavings / (profile.totalDebt / 12) : Infinity,
      insuranceCoverage: profile.lifeInsuranceCoverage
        ? (profile.lifeInsuranceCoverage / (profile.monthlyIncome * 120)) * 100
        : 0,
      investmentRate: (profile.investmentAssets / profile.totalAssets) * 100,
    };
  }

  /**
   * Calculate net worth summary
   */
  private calculateNetWorth(profile: FinancialProfile): NetWorthSummary {
    const netWorth = profile.totalAssets - profile.totalDebt;

    const assetBreakdown = [
      { category: 'Liquid Savings', amount: profile.liquidSavings, percentage: 0 },
      { category: 'Investments', amount: profile.investmentAssets, percentage: 0 },
      { category: 'Other Savings', amount: profile.totalSavings - profile.liquidSavings - profile.investmentAssets, percentage: 0 },
    ].filter((a) => a.amount > 0);

    // Calculate percentages
    assetBreakdown.forEach((a) => {
      a.percentage = (a.amount / profile.totalAssets) * 100;
    });

    const liabilityBreakdown = [
      { category: 'Secured Loans', amount: profile.securedDebt, percentage: 0 },
      { category: 'Unsecured Loans', amount: profile.unsecuredDebt, percentage: 0 },
    ].filter((l) => l.amount > 0);

    liabilityBreakdown.forEach((l) => {
      l.percentage = profile.totalDebt > 0 ? (l.amount / profile.totalDebt) * 100 : 0;
    });

    return {
      totalAssets: profile.totalAssets,
      totalLiabilities: profile.totalDebt,
      netWorth,
      netWorthTrend: 'STABLE', // Would need historical data
      assetBreakdown,
      liabilityBreakdown,
    };
  }

  /**
   * Generate strengths and weaknesses
   */
  private generateInsights(
    components: HealthScoreComponent[],
    ratios: FinancialRatios,
    profile: FinancialProfile
  ): { strengths: HealthInsight[]; weaknesses: HealthInsight[] } {
    const strengths: HealthInsight[] = [];
    const weaknesses: HealthInsight[] = [];

    // Check each component
    for (const component of components) {
      if (component.score >= 80) {
        strengths.push({
          type: 'STRENGTH',
          icon: component.icon,
          title: component.name,
          titleHi: component.nameHi,
          description: component.details,
          descriptionHi: component.detailsHi,
          impact: component.weight > 0.15 ? 'HIGH' : 'MEDIUM',
        });
      } else if (component.score < 50) {
        weaknesses.push({
          type: 'WEAKNESS',
          icon: component.icon,
          title: component.name,
          titleHi: component.nameHi,
          description: component.details,
          descriptionHi: component.detailsHi,
          impact: component.weight > 0.15 ? 'HIGH' : 'MEDIUM',
        });
      }
    }

    // Specific insights
    if (ratios.emergencyFundMonths >= 6) {
      strengths.push({
        type: 'STRENGTH',
        icon: '🏦',
        title: 'Strong Emergency Fund',
        titleHi: 'मजबूत आपातकालीन निधि',
        description: `You have ${ratios.emergencyFundMonths.toFixed(1)} months of expenses saved`,
        descriptionHi: `आपके पास ${ratios.emergencyFundMonths.toFixed(1)} महीने का खर्च बचत में है`,
        impact: 'HIGH',
      });
    }

    if (ratios.savingsRate >= 30) {
      strengths.push({
        type: 'STRENGTH',
        icon: '💪',
        title: 'Excellent Saver',
        titleHi: 'उत्कृष्ट बचतकर्ता',
        description: `Saving ${ratios.savingsRate.toFixed(0)}% - top 10% of your age group`,
        descriptionHi: `${ratios.savingsRate.toFixed(0)}% बचत - आपके आयु वर्ग में शीर्ष 10%`,
        impact: 'HIGH',
      });
    }

    if (!profile.hasLifeInsurance && profile.dependents > 0) {
      weaknesses.push({
        type: 'WEAKNESS',
        icon: '⚠️',
        title: 'No Life Insurance with Dependents',
        titleHi: 'आश्रितों के साथ कोई जीवन बीमा नहीं',
        description: `You have ${profile.dependents} dependents but no life insurance`,
        descriptionHi: `आपके ${profile.dependents} आश्रित हैं लेकिन जीवन बीमा नहीं है`,
        impact: 'HIGH',
      });
    }

    return { strengths: strengths.slice(0, 5), weaknesses: weaknesses.slice(0, 5) };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    components: HealthScoreComponent[],
    ratios: FinancialRatios,
    profile: FinancialProfile
  ): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // Emergency fund recommendation
    if (ratios.emergencyFundMonths < 6) {
      const monthsNeeded = 6 - ratios.emergencyFundMonths;
      const monthlyExpenses = profile.monthlyIncome * (1 - profile.savingsRate / 100);
      const amountNeeded = monthsNeeded * monthlyExpenses;

      recommendations.push({
        priority: ratios.emergencyFundMonths < 3 ? 'HIGH' : 'MEDIUM',
        icon: '🏦',
        title: 'Build Emergency Fund',
        titleHi: 'आपातकालीन निधि बनाएं',
        description: `Save ₹${Math.round(amountNeeded / 1000) * 1000} more to reach 6 months of expenses`,
        descriptionHi: `6 महीने के खर्च तक पहुंचने के लिए ₹${Math.round(amountNeeded / 1000) * 1000} और बचाएं`,
        potentialImpact: 50,
        actionType: 'BUILD_EMERGENCY',
        suggestedAmount: Math.round(amountNeeded / 6), // Monthly target
        timeframe: '6-12 months',
      });
    }

    // Insurance recommendation
    if (!profile.hasHealthInsurance) {
      recommendations.push({
        priority: 'HIGH',
        icon: '🏥',
        title: 'Get Health Insurance',
        titleHi: 'स्वास्थ्य बीमा लें',
        description: 'Health insurance is essential to protect your savings from medical emergencies',
        descriptionHi: 'चिकित्सा आपात स्थिति से बचत की रक्षा के लिए स्वास्थ्य बीमा आवश्यक है',
        potentialImpact: 40,
        actionType: 'INSURE',
        suggestedAmount: 500000, // 5 lakh cover
        timeframe: 'Immediate',
      });
    }

    if (!profile.hasLifeInsurance && profile.dependents > 0) {
      recommendations.push({
        priority: 'HIGH',
        icon: '🛡️',
        title: 'Get Term Life Insurance',
        titleHi: 'टर्म लाइफ इंश्योरेंस लें',
        description: `With ${profile.dependents} dependents, you need life coverage of ₹${(profile.monthlyIncome * 120 / 100000).toFixed(0)} lakh`,
        descriptionHi: `${profile.dependents} आश्रितों के साथ, आपको ₹${(profile.monthlyIncome * 120 / 100000).toFixed(0)} लाख का जीवन कवर चाहिए`,
        potentialImpact: 30,
        actionType: 'INSURE',
        suggestedAmount: profile.monthlyIncome * 120,
        timeframe: 'Within 30 days',
      });
    }

    // Debt reduction
    if (ratios.debtToIncome > 40) {
      recommendations.push({
        priority: 'HIGH',
        icon: '💳',
        title: 'Reduce High-Interest Debt',
        titleHi: 'उच्च-ब्याज कर्ज कम करें',
        description: 'Your debt-to-income ratio is high. Focus on paying off unsecured loans first.',
        descriptionHi: 'आपका कर्ज-आय अनुपात अधिक है। पहले असुरक्षित लोन चुकाएं।',
        potentialImpact: 60,
        actionType: 'REDUCE_DEBT',
        suggestedAmount: profile.unsecuredDebt / 12,
        timeframe: '12-24 months',
      });
    }

    // Investment recommendation
    if (ratios.investmentRate < 20) {
      recommendations.push({
        priority: 'MEDIUM',
        icon: '📈',
        title: 'Start/Increase SIP Investments',
        titleHi: 'SIP निवेश शुरू/बढ़ाएं',
        description: 'Invest at least 20% of income in diversified assets for long-term wealth',
        descriptionHi: 'दीर्घकालिक संपत्ति के लिए आय का कम से कम 20% विविध संपत्तियों में निवेश करें',
        potentialImpact: 25,
        actionType: 'INVEST',
        suggestedAmount: profile.monthlyIncome * 0.15,
        timeframe: 'Start this month',
      });
    }

    // Savings recommendation
    if (ratios.savingsRate < 20) {
      recommendations.push({
        priority: 'MEDIUM',
        icon: '💰',
        title: 'Increase Savings Rate',
        titleHi: 'बचत दर बढ़ाएं',
        description: `Aim to save at least 20% of income. Currently at ${ratios.savingsRate.toFixed(0)}%`,
        descriptionHi: `आय का कम से कम 20% बचाने का लक्ष्य रखें। वर्तमान में ${ratios.savingsRate.toFixed(0)}%`,
        potentialImpact: 35,
        actionType: 'SAVE',
        suggestedAmount: profile.monthlyIncome * 0.2 - profile.monthlyIncome * ratios.savingsRate / 100,
        timeframe: '3-6 months',
      });
    }

    return recommendations
      .sort((a, b) => {
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5);
  }

  /**
   * Generate peer comparison
   */
  private generatePeerComparison(score: number, profile: FinancialProfile): PeerComparison {
    // Simplified peer data (in production, use actual aggregated data)
    const ageGroup = profile.age < 30 ? '25-30' : profile.age < 40 ? '30-40' : profile.age < 50 ? '40-50' : '50+';
    const incomeGroup = profile.monthlyIncome < 50000 ? '<50K' : profile.monthlyIncome < 100000 ? '50K-1L' : '1L+';

    // Mock percentile calculation
    const percentile = Math.min(99, Math.round((score / 1000) * 100 + 10));

    return {
      percentile,
      ageGroup,
      incomeGroup,
      avgScoreInGroup: 580,
      topPerformersAvg: 820,
      comparisonMessage: `You're doing better than ${percentile}% of people in your age and income group`,
      comparisonMessageHi: `आप अपने आयु और आय वर्ग में ${percentile}% लोगों से बेहतर कर रहे हैं`,
    };
  }

  /**
   * Generate financial projections
   */
  private generateProjections(profile: FinancialProfile, ratios: FinancialRatios): FinancialProjection[] {
    const currentNetWorth = profile.totalAssets - profile.totalDebt;
    const monthlySavings = profile.monthlyIncome * ratios.savingsRate / 100;

    return [
      {
        scenario: 'CURRENT',
        years: 10,
        projectedNetWorth: currentNetWorth + monthlySavings * 12 * 10 * 1.08, // 8% avg return
        projectedSavings: monthlySavings * 12 * 10,
        assumptions: ['Current savings rate maintained', '8% average investment return'],
      },
      {
        scenario: 'OPTIMISTIC',
        years: 10,
        projectedNetWorth: currentNetWorth + (monthlySavings * 1.3) * 12 * 10 * 1.12, // 30% more savings, 12% return
        projectedSavings: (monthlySavings * 1.3) * 12 * 10,
        assumptions: ['30% increase in savings rate', '12% average investment return', 'Career growth'],
      },
      {
        scenario: 'CONSERVATIVE',
        years: 10,
        projectedNetWorth: currentNetWorth + (monthlySavings * 0.8) * 12 * 10 * 1.05, // 20% less savings, 5% return
        projectedSavings: (monthlySavings * 0.8) * 12 * 10,
        assumptions: ['20% lower savings rate', '5% conservative return', 'Market volatility'],
      },
    ];
  }

  // Helpers

  private getStatus(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 65) return 'GOOD';
    if (score >= 50) return 'FAIR';
    if (score >= 35) return 'POOR';
    return 'CRITICAL';
  }

  private determineRating(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' {
    if (score >= RATING_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
    if (score >= RATING_THRESHOLDS.GOOD) return 'GOOD';
    if (score >= RATING_THRESHOLDS.FAIR) return 'FAIR';
    if (score >= RATING_THRESHOLDS.POOR) return 'POOR';
    return 'CRITICAL';
  }
}

// Export singleton
export const financialHealthCalculator = new FinancialHealthCalculator();

// Factory function
export function createFinancialHealthCalculator() {
  return new FinancialHealthCalculator();
}
