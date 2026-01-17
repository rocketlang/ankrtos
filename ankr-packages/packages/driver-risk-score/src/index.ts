/**
 * @ankr/driver-risk-score
 * Unified driver risk scoring combining telematics and wellness data
 *
 * Bridges @ankr/telematics-scoring and @ankr/wellness-scoring for comprehensive
 * insurance underwriting and UBI (Usage-Based Insurance) programs.
 */

// ============================================================================
// Types
// ============================================================================

export type RiskLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING';

// Telematics Input (can come from @ankr/telematics-scoring)
export interface TelematicsInput {
  overallScore: number; // 0-100
  components?: {
    speeding?: number;
    braking?: number;
    acceleration?: number;
    cornering?: number;
    phoneUsage?: number;
    nightDriving?: number;
    mileage?: number;
  };
  totalTrips?: number;
  totalDistance?: number; // km
  tripSafetyScores?: number[]; // Recent trip scores
  drowsyEvents?: number;
  phoneUsageEvents?: number;
  speedingEvents?: number;
  harshBrakingEvents?: number;
}

// Wellness Input (can come from @ankr/wellness-scoring)
export interface WellnessInput {
  overallScore?: number; // 0-100
  physicalScore?: number;
  sleepScore?: number;
  nutritionScore?: number;
  mentalScore?: number;
  bmi?: number;
  smokingStatus?: 'NEVER' | 'FORMER' | 'OCCASIONAL' | 'REGULAR';
  alcoholUsage?: 'NONE' | 'SOCIAL' | 'MODERATE' | 'HEAVY';
  exerciseFrequency?: 'NONE' | 'OCCASIONAL' | 'WEEKLY' | 'REGULAR' | 'DAILY';
  stressLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  sleepHours?: number;
  chronicConditions?: string[];
  age?: number;
}

// Demographics/Profile Input
export interface DriverProfileInput {
  age?: number;
  yearsLicensed?: number;
  vehicleType?: 'SEDAN' | 'SUV' | 'TRUCK' | 'MOTORCYCLE' | 'COMMERCIAL';
  annualMileage?: number;
  previousClaims?: number;
  previousAccidents?: number;
  location?: 'URBAN' | 'SUBURBAN' | 'RURAL';
}

// Unified Risk Score Output
export interface DriverRiskScore {
  overall: number; // 0-100 (higher = safer)
  riskLevel: RiskLevel;
  grade: string; // A+, A, B+, B, C, D, F

  // Component Scores
  components: {
    telematicsScore: number;
    wellnessScore: number;
    profileScore: number;
    correlationAdjustment: number; // Bonus/penalty from wellness-telematics correlation
  };

  // Risk Factors
  riskFactors: RiskFactor[];
  positiveFactors: PositiveFactor[];

  // Insurance Pricing
  premiumAdjustment: PremiumAdjustment;

  // Trend & Recommendations
  trend: TrendDirection;
  recommendations: string[];

  // Correlation Insights
  correlations: CorrelationInsight[];

  // Metadata
  calculatedAt: Date;
  confidence: number; // 0-1, based on data completeness
}

export interface RiskFactor {
  code: string;
  category: 'TELEMATICS' | 'WELLNESS' | 'PROFILE' | 'CORRELATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  impact: number; // Negative score impact
}

export interface PositiveFactor {
  code: string;
  category: 'TELEMATICS' | 'WELLNESS' | 'PROFILE' | 'CORRELATION';
  description: string;
  bonus: number; // Positive score impact
}

export interface PremiumAdjustment {
  percentage: number; // Positive = discount, negative = surcharge
  monthlyImpact?: number; // If base premium provided
  tier: string;
  factors: string[];
}

export interface CorrelationInsight {
  wellnessMetric: string;
  telematicsMetric: string;
  correlation: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  insight: string;
}

// Configuration
export interface DriverRiskConfig {
  weights?: Partial<ScoringWeights>;
  gradeThresholds?: Partial<GradeThresholds>;
  basePremium?: number; // For calculating monthly impact
}

export interface ScoringWeights {
  telematics: number;
  wellness: number;
  profile: number;
  correlation: number;
}

export interface GradeThresholds {
  'A+': number;
  A: number;
  'B+': number;
  B: number;
  C: number;
  D: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_WEIGHTS: ScoringWeights = {
  telematics: 0.45, // Driving behavior is primary
  wellness: 0.25,   // Health factors
  profile: 0.20,   // Demographics
  correlation: 0.10, // Wellness-telematics correlation bonus
};

const DEFAULT_GRADE_THRESHOLDS: GradeThresholds = {
  'A+': 95,
  A: 90,
  'B+': 85,
  B: 80,
  C: 70,
  D: 60,
};

// ============================================================================
// Driver Risk Scoring Engine
// ============================================================================

export class DriverRiskEngine {
  private weights: ScoringWeights;
  private gradeThresholds: GradeThresholds;
  private basePremium?: number;

  constructor(config?: DriverRiskConfig) {
    this.weights = { ...DEFAULT_WEIGHTS, ...config?.weights };
    this.gradeThresholds = { ...DEFAULT_GRADE_THRESHOLDS, ...config?.gradeThresholds };
    this.basePremium = config?.basePremium;
  }

  /**
   * Calculate unified driver risk score
   */
  calculateRiskScore(
    telematics: TelematicsInput,
    wellness?: WellnessInput,
    profile?: DriverProfileInput
  ): DriverRiskScore {
    const riskFactors: RiskFactor[] = [];
    const positiveFactors: PositiveFactor[] = [];
    const correlations: CorrelationInsight[] = [];

    // Calculate component scores
    const telematicsScore = this.scoreTelematicsWith(telematics, riskFactors, positiveFactors);
    const wellnessScore = this.scoreWellnessWith(wellness, riskFactors, positiveFactors);
    const profileScore = this.scoreProfileWith(profile, riskFactors, positiveFactors);

    // Calculate correlation adjustment
    const correlationAdjustment = this.calculateCorrelationAdjustment(
      telematics,
      wellness,
      riskFactors,
      positiveFactors,
      correlations
    );

    // Weighted overall score
    const overall = Math.min(100, Math.max(0,
      telematicsScore * this.weights.telematics +
      wellnessScore * this.weights.wellness +
      profileScore * this.weights.profile +
      correlationAdjustment * this.weights.correlation
    ));

    // Determine grade and risk level
    const grade = this.scoreToGrade(overall);
    const riskLevel = this.scoreToRiskLevel(overall);

    // Calculate premium adjustment
    const premiumAdjustment = this.calculatePremiumAdjustment(overall, riskFactors, positiveFactors);

    // Determine trend
    const trend = this.determineTrend(telematics.tripSafetyScores);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      telematicsScore,
      wellnessScore,
      telematics,
      wellness,
      riskFactors
    );

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(telematics, wellness, profile);

    return {
      overall: Math.round(overall * 10) / 10,
      riskLevel,
      grade,
      components: {
        telematicsScore: Math.round(telematicsScore * 10) / 10,
        wellnessScore: Math.round(wellnessScore * 10) / 10,
        profileScore: Math.round(profileScore * 10) / 10,
        correlationAdjustment: Math.round(correlationAdjustment * 10) / 10,
      },
      riskFactors,
      positiveFactors,
      premiumAdjustment,
      trend,
      recommendations,
      correlations,
      calculatedAt: new Date(),
      confidence,
    };
  }

  /**
   * Score telematics data
   */
  private scoreTelematicsWith(
    input: TelematicsInput,
    riskFactors: RiskFactor[],
    positiveFactors: PositiveFactor[]
  ): number {
    let score = input.overallScore;

    // Phone usage is a major risk factor
    if (input.phoneUsageEvents && input.phoneUsageEvents > 3) {
      const impact = Math.min(15, input.phoneUsageEvents * 2);
      score -= impact;
      riskFactors.push({
        code: 'PHONE_USAGE_HIGH',
        category: 'TELEMATICS',
        severity: 'HIGH',
        description: `${input.phoneUsageEvents} phone usage events detected`,
        impact,
      });
    }

    // Drowsy driving is critical
    if (input.drowsyEvents && input.drowsyEvents > 0) {
      const impact = Math.min(20, input.drowsyEvents * 10);
      score -= impact;
      riskFactors.push({
        code: 'DROWSY_DRIVING',
        category: 'TELEMATICS',
        severity: 'HIGH',
        description: `${input.drowsyEvents} drowsy driving events - requires attention`,
        impact,
      });
    }

    // High speeding events
    if (input.speedingEvents && input.speedingEvents > 5) {
      const impact = Math.min(10, input.speedingEvents);
      score -= impact;
      riskFactors.push({
        code: 'FREQUENT_SPEEDING',
        category: 'TELEMATICS',
        severity: 'MEDIUM',
        description: `Frequent speeding detected (${input.speedingEvents} events)`,
        impact,
      });
    }

    // Good mileage without incidents is positive
    if (input.totalDistance && input.totalDistance > 1000 && score >= 80) {
      positiveFactors.push({
        code: 'EXPERIENCED_SAFE_DRIVER',
        category: 'TELEMATICS',
        description: `${Math.round(input.totalDistance)}km driven safely`,
        bonus: 5,
      });
      score += 5;
    }

    // Low phone usage
    if (!input.phoneUsageEvents || input.phoneUsageEvents === 0) {
      positiveFactors.push({
        code: 'NO_PHONE_USAGE',
        category: 'TELEMATICS',
        description: 'No phone usage while driving',
        bonus: 5,
      });
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Score wellness data
   */
  private scoreWellnessWith(
    input: WellnessInput | undefined,
    riskFactors: RiskFactor[],
    positiveFactors: PositiveFactor[]
  ): number {
    if (!input) return 70; // Default neutral score

    let score = input.overallScore || 70;

    // Poor sleep affects driving
    if (input.sleepScore && input.sleepScore < 50) {
      const impact = Math.min(10, (50 - input.sleepScore) / 5);
      score -= impact;
      riskFactors.push({
        code: 'POOR_SLEEP',
        category: 'WELLNESS',
        severity: 'MEDIUM',
        description: 'Poor sleep quality increases drowsy driving risk',
        impact,
      });
    }

    // High stress affects focus
    if (input.stressLevel === 'SEVERE' || input.stressLevel === 'HIGH') {
      const impact = input.stressLevel === 'SEVERE' ? 10 : 5;
      score -= impact;
      riskFactors.push({
        code: 'HIGH_STRESS',
        category: 'WELLNESS',
        severity: input.stressLevel === 'SEVERE' ? 'HIGH' : 'MEDIUM',
        description: 'High stress may impact driving concentration',
        impact,
      });
    }

    // Heavy alcohol usage
    if (input.alcoholUsage === 'HEAVY') {
      score -= 15;
      riskFactors.push({
        code: 'HEAVY_ALCOHOL',
        category: 'WELLNESS',
        severity: 'HIGH',
        description: 'Heavy alcohol consumption increases impaired driving risk',
        impact: 15,
      });
    }

    // Smoking affects alertness
    if (input.smokingStatus === 'REGULAR') {
      score -= 5;
      riskFactors.push({
        code: 'REGULAR_SMOKER',
        category: 'WELLNESS',
        severity: 'LOW',
        description: 'Smoking may affect alertness and reaction time',
        impact: 5,
      });
    }

    // Good sleep is positive
    if (input.sleepScore && input.sleepScore >= 80) {
      positiveFactors.push({
        code: 'GOOD_SLEEP',
        category: 'WELLNESS',
        description: 'Good sleep quality supports alert driving',
        bonus: 5,
      });
      score += 5;
    }

    // Non-smoker
    if (input.smokingStatus === 'NEVER') {
      positiveFactors.push({
        code: 'NON_SMOKER',
        category: 'WELLNESS',
        description: 'Non-smoker',
        bonus: 3,
      });
      score += 3;
    }

    // Regular exercise improves reaction time
    if (input.exerciseFrequency === 'DAILY' || input.exerciseFrequency === 'REGULAR') {
      positiveFactors.push({
        code: 'REGULAR_EXERCISE',
        category: 'WELLNESS',
        description: 'Regular exercise improves alertness and reaction time',
        bonus: 3,
      });
      score += 3;
    }

    // Healthy BMI
    if (input.bmi && input.bmi >= 18.5 && input.bmi <= 24.9) {
      positiveFactors.push({
        code: 'HEALTHY_BMI',
        category: 'WELLNESS',
        description: 'Healthy BMI',
        bonus: 2,
      });
      score += 2;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Score driver profile
   */
  private scoreProfileWith(
    input: DriverProfileInput | undefined,
    riskFactors: RiskFactor[],
    positiveFactors: PositiveFactor[]
  ): number {
    if (!input) return 70; // Default neutral score

    let score = 75; // Base profile score

    // Age factors
    if (input.age) {
      if (input.age < 25) {
        score -= 10;
        riskFactors.push({
          code: 'YOUNG_DRIVER',
          category: 'PROFILE',
          severity: 'MEDIUM',
          description: 'Young drivers have higher statistical risk',
          impact: 10,
        });
      } else if (input.age >= 25 && input.age <= 65) {
        score += 5;
        positiveFactors.push({
          code: 'PRIME_AGE',
          category: 'PROFILE',
          description: 'Optimal age range for safe driving',
          bonus: 5,
        });
      } else if (input.age > 70) {
        score -= 5;
        riskFactors.push({
          code: 'SENIOR_DRIVER',
          category: 'PROFILE',
          severity: 'LOW',
          description: 'Senior drivers may have slower reaction times',
          impact: 5,
        });
      }
    }

    // Years licensed
    if (input.yearsLicensed) {
      if (input.yearsLicensed < 2) {
        score -= 10;
        riskFactors.push({
          code: 'NEW_DRIVER',
          category: 'PROFILE',
          severity: 'MEDIUM',
          description: 'Less than 2 years driving experience',
          impact: 10,
        });
      } else if (input.yearsLicensed >= 5) {
        const bonus = Math.min(10, input.yearsLicensed);
        score += bonus;
        positiveFactors.push({
          code: 'EXPERIENCED_DRIVER',
          category: 'PROFILE',
          description: `${input.yearsLicensed} years of driving experience`,
          bonus,
        });
      }
    }

    // Previous claims/accidents
    if (input.previousClaims && input.previousClaims > 0) {
      const impact = Math.min(20, input.previousClaims * 10);
      score -= impact;
      riskFactors.push({
        code: 'PREVIOUS_CLAIMS',
        category: 'PROFILE',
        severity: input.previousClaims >= 3 ? 'HIGH' : 'MEDIUM',
        description: `${input.previousClaims} previous insurance claim(s)`,
        impact,
      });
    }

    if (input.previousAccidents && input.previousAccidents > 0) {
      const impact = Math.min(25, input.previousAccidents * 15);
      score -= impact;
      riskFactors.push({
        code: 'PREVIOUS_ACCIDENTS',
        category: 'PROFILE',
        severity: 'HIGH',
        description: `${input.previousAccidents} previous accident(s)`,
        impact,
      });
    }

    // Vehicle type
    if (input.vehicleType === 'MOTORCYCLE') {
      score -= 10;
      riskFactors.push({
        code: 'MOTORCYCLE',
        category: 'PROFILE',
        severity: 'MEDIUM',
        description: 'Motorcycles have higher accident severity',
        impact: 10,
      });
    }

    // Location
    if (input.location === 'RURAL') {
      positiveFactors.push({
        code: 'RURAL_DRIVING',
        category: 'PROFILE',
        description: 'Rural areas typically have lower accident frequency',
        bonus: 3,
      });
      score += 3;
    } else if (input.location === 'URBAN') {
      riskFactors.push({
        code: 'URBAN_DRIVING',
        category: 'PROFILE',
        severity: 'LOW',
        description: 'Urban driving has higher accident frequency',
        impact: 3,
      });
      score -= 3;
    }

    // Clean record bonus
    if ((!input.previousClaims || input.previousClaims === 0) &&
        (!input.previousAccidents || input.previousAccidents === 0)) {
      positiveFactors.push({
        code: 'CLEAN_RECORD',
        category: 'PROFILE',
        description: 'No previous claims or accidents',
        bonus: 10,
      });
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate correlation adjustment between wellness and telematics
   */
  private calculateCorrelationAdjustment(
    telematics: TelematicsInput,
    wellness: WellnessInput | undefined,
    riskFactors: RiskFactor[],
    positiveFactors: PositiveFactor[],
    correlations: CorrelationInsight[]
  ): number {
    if (!wellness) return 0;

    let adjustment = 0;

    // Poor sleep + drowsy driving events = strong negative correlation
    if (wellness.sleepScore && wellness.sleepScore < 50 && telematics.drowsyEvents && telematics.drowsyEvents > 0) {
      adjustment -= 15;
      correlations.push({
        wellnessMetric: 'Sleep Quality',
        telematicsMetric: 'Drowsy Driving Events',
        correlation: 'NEGATIVE',
        strength: 'STRONG',
        insight: 'Poor sleep quality is correlating with drowsy driving events - addressing sleep issues could improve driving safety',
      });
      riskFactors.push({
        code: 'SLEEP_DROWSY_CORRELATION',
        category: 'CORRELATION',
        severity: 'HIGH',
        description: 'Poor sleep correlated with drowsy driving',
        impact: 15,
      });
    }

    // Good sleep + no drowsy events = positive correlation
    if (wellness.sleepScore && wellness.sleepScore >= 80 && (!telematics.drowsyEvents || telematics.drowsyEvents === 0)) {
      adjustment += 10;
      correlations.push({
        wellnessMetric: 'Sleep Quality',
        telematicsMetric: 'Drowsy Driving Events',
        correlation: 'POSITIVE',
        strength: 'STRONG',
        insight: 'Good sleep hygiene is reflected in alert driving behavior',
      });
      positiveFactors.push({
        code: 'SLEEP_ALERT_CORRELATION',
        category: 'CORRELATION',
        description: 'Good sleep correlating with alert driving',
        bonus: 10,
      });
    }

    // High stress + aggressive driving (harsh braking/speeding)
    if ((wellness.stressLevel === 'HIGH' || wellness.stressLevel === 'SEVERE') &&
        ((telematics.harshBrakingEvents && telematics.harshBrakingEvents > 3) ||
         (telematics.speedingEvents && telematics.speedingEvents > 5))) {
      adjustment -= 10;
      correlations.push({
        wellnessMetric: 'Stress Level',
        telematicsMetric: 'Aggressive Driving Events',
        correlation: 'NEGATIVE',
        strength: 'MODERATE',
        insight: 'High stress levels may be contributing to aggressive driving patterns',
      });
      riskFactors.push({
        code: 'STRESS_AGGRESSION_CORRELATION',
        category: 'CORRELATION',
        severity: 'MEDIUM',
        description: 'High stress correlating with aggressive driving',
        impact: 10,
      });
    }

    // Low stress + calm driving
    if (wellness.stressLevel === 'LOW' && telematics.overallScore >= 85) {
      adjustment += 5;
      correlations.push({
        wellnessMetric: 'Stress Level',
        telematicsMetric: 'Driving Calmness',
        correlation: 'POSITIVE',
        strength: 'MODERATE',
        insight: 'Low stress levels correlate with calm, controlled driving',
      });
      positiveFactors.push({
        code: 'CALM_DRIVER_CORRELATION',
        category: 'CORRELATION',
        description: 'Low stress and calm driving pattern',
        bonus: 5,
      });
    }

    // Regular exercise + good reaction times (fewer near-miss events)
    if ((wellness.exerciseFrequency === 'DAILY' || wellness.exerciseFrequency === 'REGULAR') &&
        telematics.overallScore >= 80) {
      adjustment += 5;
      correlations.push({
        wellnessMetric: 'Exercise Frequency',
        telematicsMetric: 'Overall Driving Performance',
        correlation: 'POSITIVE',
        strength: 'WEAK',
        insight: 'Regular exercise may contribute to better reaction times and focus',
      });
      positiveFactors.push({
        code: 'FITNESS_PERFORMANCE_CORRELATION',
        category: 'CORRELATION',
        description: 'Physical fitness supporting driving performance',
        bonus: 5,
      });
    }

    return adjustment;
  }

  /**
   * Calculate premium adjustment
   */
  private calculatePremiumAdjustment(
    score: number,
    riskFactors: RiskFactor[],
    positiveFactors: PositiveFactor[]
  ): PremiumAdjustment {
    let percentage: number;
    let tier: string;

    if (score >= 95) {
      percentage = 30;
      tier = 'Elite Driver';
    } else if (score >= 90) {
      percentage = 25;
      tier = 'Excellent';
    } else if (score >= 85) {
      percentage = 20;
      tier = 'Very Good';
    } else if (score >= 80) {
      percentage = 15;
      tier = 'Good';
    } else if (score >= 75) {
      percentage = 10;
      tier = 'Above Average';
    } else if (score >= 70) {
      percentage = 5;
      tier = 'Average';
    } else if (score >= 60) {
      percentage = 0;
      tier = 'Standard';
    } else if (score >= 50) {
      percentage = -10;
      tier = 'Below Average';
    } else {
      percentage = -20;
      tier = 'High Risk';
    }

    // Collect factor descriptions
    const factors = [
      ...positiveFactors.map(f => `+ ${f.description}`),
      ...riskFactors.map(f => `- ${f.description}`),
    ];

    const adjustment: PremiumAdjustment = {
      percentage,
      tier,
      factors,
    };

    // Calculate monthly impact if base premium provided
    if (this.basePremium) {
      adjustment.monthlyImpact = Math.round(this.basePremium * (percentage / 100));
    }

    return adjustment;
  }

  /**
   * Convert score to grade
   */
  private scoreToGrade(score: number): string {
    if (score >= this.gradeThresholds['A+']) return 'A+';
    if (score >= this.gradeThresholds.A) return 'A';
    if (score >= this.gradeThresholds['B+']) return 'B+';
    if (score >= this.gradeThresholds.B) return 'B';
    if (score >= this.gradeThresholds.C) return 'C';
    if (score >= this.gradeThresholds.D) return 'D';
    return 'F';
  }

  /**
   * Convert score to risk level
   */
  private scoreToRiskLevel(score: number): RiskLevel {
    if (score >= 90) return 'VERY_LOW';
    if (score >= 80) return 'LOW';
    if (score >= 65) return 'MODERATE';
    if (score >= 50) return 'HIGH';
    return 'VERY_HIGH';
  }

  /**
   * Determine trend from recent scores
   */
  private determineTrend(tripScores?: number[]): TrendDirection {
    if (!tripScores || tripScores.length < 5) return 'STABLE';

    const recent = tripScores.slice(-5);
    const older = tripScores.slice(-10, -5);

    if (older.length === 0) return 'STABLE';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const diff = recentAvg - olderAvg;

    if (diff > 5) return 'IMPROVING';
    if (diff < -5) return 'DECLINING';
    return 'STABLE';
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    telematicsScore: number,
    wellnessScore: number,
    telematics: TelematicsInput,
    wellness?: WellnessInput,
    riskFactors?: RiskFactor[]
  ): string[] {
    const recommendations: string[] = [];

    // Telematics-based recommendations
    if (telematics.phoneUsageEvents && telematics.phoneUsageEvents > 0) {
      recommendations.push('Enable Do Not Disturb while driving - phone usage is your biggest risk factor');
    }

    if (telematics.drowsyEvents && telematics.drowsyEvents > 0) {
      recommendations.push('Take regular breaks on long drives and prioritize sleep before trips');
    }

    if (telematics.speedingEvents && telematics.speedingEvents > 5) {
      recommendations.push('Set cruise control to maintain speed limits - could save up to 15% on premium');
    }

    // Wellness-based recommendations
    if (wellness) {
      if (wellness.sleepScore && wellness.sleepScore < 60) {
        recommendations.push('Improving your sleep quality (currently low) could reduce drowsy driving risk');
      }

      if (wellness.stressLevel === 'HIGH' || wellness.stressLevel === 'SEVERE') {
        recommendations.push('Consider stress management techniques - high stress correlates with aggressive driving');
      }

      if (wellness.exerciseFrequency === 'NONE' || wellness.exerciseFrequency === 'OCCASIONAL') {
        recommendations.push('Regular exercise can improve alertness and reaction times while driving');
      }
    }

    // Correlation-based recommendations
    const correlationFactors = riskFactors?.filter(f => f.category === 'CORRELATION') || [];
    if (correlationFactors.length > 0) {
      if (correlationFactors.find(f => f.code === 'SLEEP_DROWSY_CORRELATION')) {
        recommendations.push('Your sleep patterns are directly affecting your driving - consider a sleep improvement program');
      }
      if (correlationFactors.find(f => f.code === 'STRESS_AGGRESSION_CORRELATION')) {
        recommendations.push('Stress management could calm your driving style - try breathing exercises before driving');
      }
    }

    // Positive reinforcement
    if (recommendations.length === 0) {
      recommendations.push('Excellent driving profile! Maintain your healthy habits and safe driving practices');
    }

    return recommendations.slice(0, 5); // Max 5 recommendations
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(
    telematics: TelematicsInput,
    wellness?: WellnessInput,
    profile?: DriverProfileInput
  ): number {
    let score = 0;
    let maxScore = 0;

    // Telematics data (40% weight)
    maxScore += 40;
    if (telematics.overallScore !== undefined) score += 10;
    if (telematics.totalTrips !== undefined && telematics.totalTrips >= 5) score += 10;
    if (telematics.components) score += 10;
    if (telematics.tripSafetyScores && telematics.tripSafetyScores.length >= 5) score += 10;

    // Wellness data (35% weight)
    maxScore += 35;
    if (wellness) {
      if (wellness.overallScore !== undefined) score += 10;
      if (wellness.sleepScore !== undefined) score += 10;
      if (wellness.stressLevel !== undefined) score += 10;
      if (wellness.smokingStatus !== undefined) score += 5;
    }

    // Profile data (25% weight)
    maxScore += 25;
    if (profile) {
      if (profile.age !== undefined) score += 5;
      if (profile.yearsLicensed !== undefined) score += 5;
      if (profile.previousClaims !== undefined) score += 5;
      if (profile.previousAccidents !== undefined) score += 5;
      if (profile.vehicleType !== undefined) score += 5;
    }

    return Math.round((score / maxScore) * 100) / 100;
  }

  /**
   * Quick risk assessment with minimal data
   */
  quickAssessment(telematicsScore: number, wellnessScore?: number): {
    riskLevel: RiskLevel;
    premiumTier: string;
    discount: number;
  } {
    const combinedScore = wellnessScore
      ? telematicsScore * 0.65 + wellnessScore * 0.35
      : telematicsScore;

    return {
      riskLevel: this.scoreToRiskLevel(combinedScore),
      premiumTier: this.scoreToGrade(combinedScore),
      discount: this.calculatePremiumAdjustment(combinedScore, [], []).percentage,
    };
  }

  /**
   * Get risk breakdown for display
   */
  getRiskBreakdown(result: DriverRiskScore): {
    category: string;
    score: number;
    weight: number;
    contribution: number;
  }[] {
    return [
      {
        category: 'Telematics (Driving Behavior)',
        score: result.components.telematicsScore,
        weight: this.weights.telematics,
        contribution: result.components.telematicsScore * this.weights.telematics,
      },
      {
        category: 'Wellness (Health Factors)',
        score: result.components.wellnessScore,
        weight: this.weights.wellness,
        contribution: result.components.wellnessScore * this.weights.wellness,
      },
      {
        category: 'Profile (Demographics)',
        score: result.components.profileScore,
        weight: this.weights.profile,
        contribution: result.components.profileScore * this.weights.profile,
      },
      {
        category: 'Correlation Bonus/Penalty',
        score: result.components.correlationAdjustment,
        weight: this.weights.correlation,
        contribution: result.components.correlationAdjustment * this.weights.correlation,
      },
    ];
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createDriverRiskEngine(config?: DriverRiskConfig): DriverRiskEngine {
  return new DriverRiskEngine(config);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert @ankr/telematics-scoring DrivingScore to TelematicsInput
 */
export function fromTelematicsScore(drivingScore: {
  overall: number;
  components: {
    speeding: number;
    braking: number;
    acceleration: number;
    cornering: number;
    phoneUsage: number;
    nightDriving: number;
    mileage: number;
  };
  totalTrips?: number;
  totalDistance?: number;
}): TelematicsInput {
  return {
    overallScore: drivingScore.overall,
    components: drivingScore.components,
    totalTrips: drivingScore.totalTrips,
    totalDistance: drivingScore.totalDistance,
  };
}

/**
 * Convert @ankr/wellness-scoring WellnessProfile to WellnessInput
 */
export function fromWellnessProfile(profile: {
  overallWellnessScore?: number;
  physicalScore?: number;
  sleepScore?: number;
  nutritionScore?: number;
  mentalScore?: number;
  bmi?: number;
  smokingStatus?: string;
  alcoholUsage?: string;
  exerciseFrequency?: string;
  stressLevel?: string;
  sleepHours?: number;
  chronicConditions?: string[];
}): WellnessInput {
  return {
    overallScore: profile.overallWellnessScore,
    physicalScore: profile.physicalScore,
    sleepScore: profile.sleepScore,
    nutritionScore: profile.nutritionScore,
    mentalScore: profile.mentalScore,
    bmi: profile.bmi,
    smokingStatus: profile.smokingStatus as WellnessInput['smokingStatus'],
    alcoholUsage: profile.alcoholUsage as WellnessInput['alcoholUsage'],
    exerciseFrequency: profile.exerciseFrequency as WellnessInput['exerciseFrequency'],
    stressLevel: profile.stressLevel as WellnessInput['stressLevel'],
    sleepHours: profile.sleepHours,
    chronicConditions: profile.chronicConditions,
  };
}

/**
 * Get risk level color for UI
 */
export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    VERY_LOW: '#22c55e',  // Green
    LOW: '#84cc16',       // Lime
    MODERATE: '#eab308',  // Yellow
    HIGH: '#f97316',      // Orange
    VERY_HIGH: '#ef4444', // Red
  };
  return colors[level];
}

/**
 * Get grade color for UI
 */
export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#84cc16';
  if (grade === 'C') return '#eab308';
  if (grade === 'D') return '#f97316';
  return '#ef4444';
}

// Default export
export default DriverRiskEngine;
