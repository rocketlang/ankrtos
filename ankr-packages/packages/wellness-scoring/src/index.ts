/**
 * @ankr/wellness-scoring
 * Wellness & Prevention Hub
 * Health tracking, preventive care, employee wellness
 */

// Types
export type SmokingStatus = 'NEVER' | 'FORMER' | 'OCCASIONAL' | 'REGULAR';
export type AlcoholUsage = 'NONE' | 'SOCIAL' | 'MODERATE' | 'HEAVY';
export type ExerciseFrequency = 'NONE' | 'OCCASIONAL' | 'WEEKLY' | 'REGULAR' | 'DAILY';
export type StressLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
export type DietType = 'VEGETARIAN' | 'VEGAN' | 'NON_VEGETARIAN' | 'PESCATARIAN';

export type MetricType =
  | 'STEPS'
  | 'HEART_RATE'
  | 'SLEEP'
  | 'WATER'
  | 'CALORIES'
  | 'MEDITATION'
  | 'STRESS_LEVEL'
  | 'BLOOD_PRESSURE'
  | 'WEIGHT'
  | 'BLOOD_GLUCOSE';

export type CheckupStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type EnrollmentStatus = 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'DROPPED';
export type RewardStatus = 'EARNED' | 'REDEEMED' | 'EXPIRED';

export interface WellnessProfile {
  id: string;
  customerId: string;
  height?: number;
  weight?: number;
  bmi?: number;
  bloodGroup?: string;
  chronicConditions: string[];
  allergies: string[];
  smokingStatus?: SmokingStatus;
  alcoholUsage?: AlcoholUsage;
  exerciseFrequency?: ExerciseFrequency;
  dietType?: DietType;
  sleepHours?: number;
  stressLevel?: StressLevel;
  physicalScore?: number;
  sleepScore?: number;
  nutritionScore?: number;
  mentalScore?: number;
  overallWellnessScore?: number;
  wearableDevices?: Record<string, any>;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WellnessMetric {
  id: string;
  profileId: string;
  metricType: MetricType;
  value: number;
  unit: string;
  source: string;
  deviceId?: string;
  recordedAt: Date;
  createdAt: Date;
}

export interface HealthCheckup {
  id: string;
  profileId: string;
  checkupType: string;
  checkupDate: Date;
  providerName?: string;
  providerId?: string;
  status: CheckupStatus;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  oxygenSaturation?: number;
  temperature?: number;
  testResults?: Record<string, any>;
  findings?: string;
  recommendations?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WellnessProgram {
  id: string;
  programCode: string;
  programName: string;
  description?: string;
  durationDays: number;
  activities: any[];
  rewardPoints: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WellnessProgramEnrollment {
  id: string;
  profileId: string;
  programId: string;
  program?: WellnessProgram;
  status: EnrollmentStatus;
  progress: number;
  activitiesCompleted: any[];
  completedAt?: Date;
  badgeEarned?: boolean;
  pointsEarned?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WellnessReward {
  id: string;
  profileId: string;
  rewardType: string;
  rewardValue: number;
  rewardUnit: string;
  sourceType: string;
  sourceId?: string;
  description: string;
  status: RewardStatus;
  earnedAt: Date;
  expiresAt?: Date;
  redeemedAt?: Date;
  createdAt: Date;
}

export interface WellnessScores {
  physicalScore: number;
  sleepScore: number;
  nutritionScore: number;
  mentalScore: number;
  overallWellnessScore: number;
}

export interface WellnessDiscount {
  discountPercent: number;
  factors: string[];
}

export interface MetricTrend {
  date: string;
  value: number;
  count: number;
}

// Input Types
export interface WellnessProfileInput {
  customerId: string;
  height?: number;
  weight?: number;
  bloodGroup?: string;
  chronicConditions?: string[];
  allergies?: string[];
  smokingStatus?: SmokingStatus;
  alcoholUsage?: AlcoholUsage;
  exerciseFrequency?: ExerciseFrequency;
  dietType?: DietType;
  sleepHours?: number;
  stressLevel?: StressLevel;
}

export interface WellnessMetricInput {
  profileId: string;
  metricType: MetricType;
  value: number;
  unit: string;
  source: string;
  deviceId?: string;
  recordedAt?: Date;
}

export interface HealthCheckupInput {
  profileId: string;
  checkupType: string;
  checkupDate: Date;
  providerName?: string;
  providerId?: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  oxygenSaturation?: number;
  temperature?: number;
  testResults?: Record<string, any>;
  findings?: string;
  recommendations?: string;
}

export interface RewardInput {
  rewardType: string;
  rewardValue: number;
  rewardUnit: string;
  sourceType: string;
  sourceId?: string;
  description: string;
  expiresAt?: Date;
}

// Storage Interface
export interface WellnessStorage {
  // Profile
  upsertProfile(customerId: string, data: Partial<WellnessProfile>): Promise<WellnessProfile>;
  getProfile(customerId: string): Promise<WellnessProfile | null>;
  getProfileById(id: string): Promise<WellnessProfile | null>;
  updateProfile(id: string, updates: Partial<WellnessProfile>): Promise<WellnessProfile>;

  // Metrics
  recordMetric(metric: Omit<WellnessMetric, 'id' | 'createdAt'>): Promise<WellnessMetric>;
  recordMetrics(metrics: Array<Omit<WellnessMetric, 'id' | 'createdAt'>>): Promise<number>;
  getMetrics(profileId: string, options?: {
    metricType?: MetricType;
    since?: Date;
    until?: Date;
  }): Promise<WellnessMetric[]>;

  // Checkups
  createCheckup(checkup: Omit<HealthCheckup, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthCheckup>;
  getCheckup(id: string): Promise<HealthCheckup | null>;
  updateCheckup(id: string, updates: Partial<HealthCheckup>): Promise<HealthCheckup>;
  getCheckups(profileId: string, limit?: number): Promise<HealthCheckup[]>;

  // Programs
  getProgram(id: string): Promise<WellnessProgram | null>;
  getActivePrograms(): Promise<WellnessProgram[]>;
  createEnrollment(enrollment: Omit<WellnessProgramEnrollment, 'id' | 'createdAt' | 'updatedAt'>): Promise<WellnessProgramEnrollment>;
  getEnrollment(id: string): Promise<WellnessProgramEnrollment | null>;
  updateEnrollment(id: string, updates: Partial<WellnessProgramEnrollment>): Promise<WellnessProgramEnrollment>;
  getEnrollments(profileId: string, status?: EnrollmentStatus[]): Promise<WellnessProgramEnrollment[]>;

  // Rewards
  createReward(reward: Omit<WellnessReward, 'id' | 'createdAt'>): Promise<WellnessReward>;
  getRewards(profileId: string, status?: RewardStatus, limit?: number): Promise<WellnessReward[]>;
}

// Main Engine
export class WellnessScoringEngine {
  private storage: WellnessStorage;

  constructor(storage: WellnessStorage) {
    this.storage = storage;
  }

  /**
   * Create or update wellness profile
   */
  async upsertProfile(input: WellnessProfileInput): Promise<WellnessProfile> {
    const bmi = input.height && input.weight
      ? Number((input.weight / Math.pow(input.height / 100, 2)).toFixed(1))
      : undefined;

    return this.storage.upsertProfile(input.customerId, {
      customerId: input.customerId,
      height: input.height,
      weight: input.weight,
      bmi,
      bloodGroup: input.bloodGroup,
      chronicConditions: input.chronicConditions || [],
      allergies: input.allergies || [],
      smokingStatus: input.smokingStatus,
      alcoholUsage: input.alcoholUsage,
      exerciseFrequency: input.exerciseFrequency,
      dietType: input.dietType,
      sleepHours: input.sleepHours,
      stressLevel: input.stressLevel,
    });
  }

  /**
   * Record wellness metric
   */
  async recordMetric(input: WellnessMetricInput): Promise<WellnessMetric> {
    const metric = await this.storage.recordMetric({
      profileId: input.profileId,
      metricType: input.metricType,
      value: input.value,
      unit: input.unit,
      source: input.source,
      deviceId: input.deviceId,
      recordedAt: input.recordedAt || new Date(),
    });

    await this.updateWellnessScores(input.profileId);

    return metric;
  }

  /**
   * Sync metrics from wearable
   */
  async syncWearableData(
    profileId: string,
    metrics: WellnessMetricInput[],
    deviceInfo: Record<string, any>
  ): Promise<{ synced: number }> {
    const count = await this.storage.recordMetrics(
      metrics.map(m => ({
        profileId,
        metricType: m.metricType,
        value: m.value,
        unit: m.unit,
        source: m.source,
        deviceId: m.deviceId,
        recordedAt: m.recordedAt || new Date(),
      }))
    );

    await this.storage.updateProfile(profileId, {
      wearableDevices: deviceInfo,
      lastSyncAt: new Date(),
    });

    await this.updateWellnessScores(profileId);

    return { synced: count };
  }

  /**
   * Update wellness scores
   */
  async updateWellnessScores(profileId: string): Promise<WellnessScores> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const metrics = await this.storage.getMetrics(profileId, { since: thirtyDaysAgo });

    const physicalScore = this.calculatePhysicalScore(metrics);
    const sleepScore = this.calculateSleepScore(metrics);
    const nutritionScore = this.calculateNutritionScore(metrics);
    const mentalScore = this.calculateMentalScore(metrics);
    const overallWellnessScore = Math.round((physicalScore + sleepScore + nutritionScore + mentalScore) / 4);

    await this.storage.updateProfile(profileId, {
      physicalScore,
      sleepScore,
      nutritionScore,
      mentalScore,
      overallWellnessScore,
    });

    return { physicalScore, sleepScore, nutritionScore, mentalScore, overallWellnessScore };
  }

  private calculatePhysicalScore(metrics: WellnessMetric[]): number {
    const stepsMetrics = metrics.filter(m => m.metricType === 'STEPS');
    const heartRateMetrics = metrics.filter(m => m.metricType === 'HEART_RATE');

    let score = 50;

    if (stepsMetrics.length > 0) {
      const avgSteps = stepsMetrics.reduce((sum, m) => sum + m.value, 0) / stepsMetrics.length;
      score += Math.min((avgSteps / 10000) * 25, 25);
    }

    if (heartRateMetrics.length > 0) {
      const avgHR = heartRateMetrics.reduce((sum, m) => sum + m.value, 0) / heartRateMetrics.length;
      if (avgHR >= 60 && avgHR <= 80) score += 25;
      else if (avgHR >= 50 && avgHR <= 90) score += 15;
      else score += 5;
    }

    return Math.min(Math.round(score), 100);
  }

  private calculateSleepScore(metrics: WellnessMetric[]): number {
    const sleepMetrics = metrics.filter(m => m.metricType === 'SLEEP');

    if (sleepMetrics.length === 0) return 50;

    const avgSleep = sleepMetrics.reduce((sum, m) => sum + m.value, 0) / sleepMetrics.length;

    if (avgSleep >= 7 && avgSleep <= 9) return 100;
    if (avgSleep >= 6 && avgSleep <= 10) return 75;
    if (avgSleep >= 5 && avgSleep <= 11) return 50;
    return 25;
  }

  private calculateNutritionScore(metrics: WellnessMetric[]): number {
    const waterMetrics = metrics.filter(m => m.metricType === 'WATER');
    const calorieMetrics = metrics.filter(m => m.metricType === 'CALORIES');

    let score = 50;

    if (waterMetrics.length > 0) {
      const avgWater = waterMetrics.reduce((sum, m) => sum + m.value, 0) / waterMetrics.length;
      score += Math.min((avgWater / 2000) * 25, 25);
    }

    if (calorieMetrics.length > 0) {
      score += 15;
    }

    return Math.min(Math.round(score), 100);
  }

  private calculateMentalScore(metrics: WellnessMetric[]): number {
    const meditationMetrics = metrics.filter(m => m.metricType === 'MEDITATION');
    const stressMetrics = metrics.filter(m => m.metricType === 'STRESS_LEVEL');

    let score = 50;

    if (meditationMetrics.length > 0) {
      const totalMinutes = meditationMetrics.reduce((sum, m) => sum + m.value, 0);
      score += Math.min((totalMinutes / 300) * 25, 25);
    }

    if (stressMetrics.length > 0) {
      const avgStress = stressMetrics.reduce((sum, m) => sum + m.value, 0) / stressMetrics.length;
      score += Math.max(25 - (avgStress * 5), 0);
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Schedule health checkup
   */
  async scheduleCheckup(input: HealthCheckupInput): Promise<HealthCheckup> {
    return this.storage.createCheckup({
      profileId: input.profileId,
      checkupType: input.checkupType,
      checkupDate: input.checkupDate,
      providerName: input.providerName,
      providerId: input.providerId,
      status: 'SCHEDULED',
    });
  }

  /**
   * Complete checkup with results
   */
  async completeCheckup(checkupId: string, results: Partial<HealthCheckupInput>): Promise<HealthCheckup> {
    return this.storage.updateCheckup(checkupId, {
      status: 'COMPLETED',
      bloodPressureSystolic: results.bloodPressureSystolic,
      bloodPressureDiastolic: results.bloodPressureDiastolic,
      heartRate: results.heartRate,
      oxygenSaturation: results.oxygenSaturation,
      temperature: results.temperature,
      testResults: results.testResults,
      findings: results.findings,
      recommendations: results.recommendations,
    });
  }

  /**
   * Enroll in wellness program
   */
  async enrollInProgram(profileId: string, programId: string): Promise<WellnessProgramEnrollment> {
    return this.storage.createEnrollment({
      profileId,
      programId,
      status: 'ENROLLED',
      progress: 0,
      activitiesCompleted: [],
    });
  }

  /**
   * Update program progress
   */
  async updateProgramProgress(
    enrollmentId: string,
    progress: number,
    activitiesCompleted?: any[]
  ): Promise<WellnessProgramEnrollment> {
    const enrollment = await this.storage.getEnrollment(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const program = await this.storage.getProgram(enrollment.programId);

    const updated = await this.storage.updateEnrollment(enrollmentId, {
      progress,
      activitiesCompleted: activitiesCompleted || [],
      status: progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: progress >= 100 ? new Date() : undefined,
    });

    // Award points on completion
    if (progress >= 100 && program && program.rewardPoints > 0) {
      await this.awardReward(enrollment.profileId, {
        rewardType: 'POINTS',
        rewardValue: program.rewardPoints,
        rewardUnit: 'points',
        sourceType: 'PROGRAM',
        sourceId: enrollment.programId,
        description: `Completed ${program.programName}`,
      });

      await this.storage.updateEnrollment(enrollmentId, {
        badgeEarned: true,
        pointsEarned: program.rewardPoints,
      });
    }

    return updated;
  }

  /**
   * Award wellness reward
   */
  async awardReward(profileId: string, reward: RewardInput): Promise<WellnessReward> {
    return this.storage.createReward({
      profileId,
      rewardType: reward.rewardType,
      rewardValue: reward.rewardValue,
      rewardUnit: reward.rewardUnit,
      sourceType: reward.sourceType,
      sourceId: reward.sourceId,
      description: reward.description,
      status: 'EARNED',
      earnedAt: new Date(),
      expiresAt: reward.expiresAt,
    });
  }

  /**
   * Get wellness profile
   */
  async getProfile(customerId: string): Promise<WellnessProfile | null> {
    return this.storage.getProfile(customerId);
  }

  /**
   * Get metric trends
   */
  async getMetricTrends(profileId: string, metricType: MetricType, days: number = 30): Promise<MetricTrend[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics = await this.storage.getMetrics(profileId, { metricType, since });

    const byDay = new Map<string, number[]>();
    for (const metric of metrics) {
      const day = metric.recordedAt.toISOString().split('T')[0];
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(metric.value);
    }

    return Array.from(byDay.entries()).map(([date, values]) => ({
      date,
      value: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length,
    }));
  }

  /**
   * Calculate insurance premium discount
   */
  async calculateWellnessDiscount(customerId: string): Promise<WellnessDiscount> {
    const profile = await this.storage.getProfile(customerId);

    if (!profile) return { discountPercent: 0, factors: [] };

    let discountPercent = 0;
    const factors: string[] = [];

    if (profile.overallWellnessScore && profile.overallWellnessScore >= 80) {
      discountPercent += 10;
      factors.push('Excellent wellness score (80+)');
    } else if (profile.overallWellnessScore && profile.overallWellnessScore >= 60) {
      discountPercent += 5;
      factors.push('Good wellness score (60+)');
    }

    if (profile.smokingStatus === 'NEVER') {
      discountPercent += 5;
      factors.push('Non-smoker');
    }

    if (profile.exerciseFrequency === 'DAILY' || profile.exerciseFrequency === 'REGULAR') {
      discountPercent += 3;
      factors.push('Regular exercise');
    }

    if (profile.bmi && profile.bmi >= 18.5 && profile.bmi <= 24.9) {
      discountPercent += 2;
      factors.push('Healthy BMI');
    }

    return { discountPercent: Math.min(discountPercent, 20), factors };
  }
}

// In-Memory Storage Implementation
export class InMemoryWellnessStorage implements WellnessStorage {
  private profiles: Map<string, WellnessProfile> = new Map();
  private profilesByCustomer: Map<string, string> = new Map();
  private metrics: Map<string, WellnessMetric> = new Map();
  private checkups: Map<string, HealthCheckup> = new Map();
  private programs: Map<string, WellnessProgram> = new Map();
  private enrollments: Map<string, WellnessProgramEnrollment> = new Map();
  private rewards: Map<string, WellnessReward> = new Map();

  async upsertProfile(customerId: string, data: Partial<WellnessProfile>): Promise<WellnessProfile> {
    const existingId = this.profilesByCustomer.get(customerId);

    if (existingId) {
      const existing = this.profiles.get(existingId)!;
      const updated: WellnessProfile = { ...existing, ...data, updatedAt: new Date() };
      this.profiles.set(existingId, updated);
      return updated;
    }

    const profile: WellnessProfile = {
      id: `prof_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      customerId,
      chronicConditions: [],
      allergies: [],
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.profiles.set(profile.id, profile);
    this.profilesByCustomer.set(customerId, profile.id);
    return profile;
  }

  async getProfile(customerId: string): Promise<WellnessProfile | null> {
    const id = this.profilesByCustomer.get(customerId);
    return id ? this.profiles.get(id) || null : null;
  }

  async getProfileById(id: string): Promise<WellnessProfile | null> {
    return this.profiles.get(id) || null;
  }

  async updateProfile(id: string, updates: Partial<WellnessProfile>): Promise<WellnessProfile> {
    const profile = this.profiles.get(id);
    if (!profile) throw new Error('Profile not found');
    const updated = { ...profile, ...updates, updatedAt: new Date() };
    this.profiles.set(id, updated);
    return updated;
  }

  async recordMetric(metric: Omit<WellnessMetric, 'id' | 'createdAt'>): Promise<WellnessMetric> {
    const m: WellnessMetric = {
      ...metric,
      id: `met_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
    };
    this.metrics.set(m.id, m);
    return m;
  }

  async recordMetrics(metrics: Array<Omit<WellnessMetric, 'id' | 'createdAt'>>): Promise<number> {
    for (const metric of metrics) {
      await this.recordMetric(metric);
    }
    return metrics.length;
  }

  async getMetrics(profileId: string, options?: {
    metricType?: MetricType;
    since?: Date;
    until?: Date;
  }): Promise<WellnessMetric[]> {
    return Array.from(this.metrics.values()).filter(m => {
      if (m.profileId !== profileId) return false;
      if (options?.metricType && m.metricType !== options.metricType) return false;
      if (options?.since && m.recordedAt < options.since) return false;
      if (options?.until && m.recordedAt > options.until) return false;
      return true;
    }).sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  }

  async createCheckup(checkup: Omit<HealthCheckup, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthCheckup> {
    const c: HealthCheckup = {
      ...checkup,
      id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.checkups.set(c.id, c);
    return c;
  }

  async getCheckup(id: string): Promise<HealthCheckup | null> {
    return this.checkups.get(id) || null;
  }

  async updateCheckup(id: string, updates: Partial<HealthCheckup>): Promise<HealthCheckup> {
    const checkup = this.checkups.get(id);
    if (!checkup) throw new Error('Checkup not found');
    const updated = { ...checkup, ...updates, updatedAt: new Date() };
    this.checkups.set(id, updated);
    return updated;
  }

  async getCheckups(profileId: string, limit?: number): Promise<HealthCheckup[]> {
    const results = Array.from(this.checkups.values())
      .filter(c => c.profileId === profileId)
      .sort((a, b) => b.checkupDate.getTime() - a.checkupDate.getTime());
    return limit ? results.slice(0, limit) : results;
  }

  async getProgram(id: string): Promise<WellnessProgram | null> {
    return this.programs.get(id) || null;
  }

  async getActivePrograms(): Promise<WellnessProgram[]> {
    return Array.from(this.programs.values()).filter(p => p.isActive);
  }

  async createEnrollment(enrollment: Omit<WellnessProgramEnrollment, 'id' | 'createdAt' | 'updatedAt'>): Promise<WellnessProgramEnrollment> {
    const e: WellnessProgramEnrollment = {
      ...enrollment,
      id: `enr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.enrollments.set(e.id, e);
    return e;
  }

  async getEnrollment(id: string): Promise<WellnessProgramEnrollment | null> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return null;
    enrollment.program = this.programs.get(enrollment.programId) || undefined;
    return enrollment;
  }

  async updateEnrollment(id: string, updates: Partial<WellnessProgramEnrollment>): Promise<WellnessProgramEnrollment> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) throw new Error('Enrollment not found');
    const updated = { ...enrollment, ...updates, updatedAt: new Date() };
    this.enrollments.set(id, updated);
    return updated;
  }

  async getEnrollments(profileId: string, status?: EnrollmentStatus[]): Promise<WellnessProgramEnrollment[]> {
    return Array.from(this.enrollments.values()).filter(e => {
      if (e.profileId !== profileId) return false;
      if (status && !status.includes(e.status)) return false;
      return true;
    });
  }

  async createReward(reward: Omit<WellnessReward, 'id' | 'createdAt'>): Promise<WellnessReward> {
    const r: WellnessReward = {
      ...reward,
      id: `rwd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
    };
    this.rewards.set(r.id, r);
    return r;
  }

  async getRewards(profileId: string, status?: RewardStatus, limit?: number): Promise<WellnessReward[]> {
    const results = Array.from(this.rewards.values())
      .filter(r => {
        if (r.profileId !== profileId) return false;
        if (status && r.status !== status) return false;
        return true;
      })
      .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime());
    return limit ? results.slice(0, limit) : results;
  }

  // Helper to add a program
  addProgram(program: Omit<WellnessProgram, 'id' | 'createdAt' | 'updatedAt'>): WellnessProgram {
    const p: WellnessProgram = {
      ...program,
      id: `prog_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.programs.set(p.id, p);
    return p;
  }
}

// Factory function
export function createWellnessScoringEngine(storage?: WellnessStorage): WellnessScoringEngine {
  return new WellnessScoringEngine(storage || new InMemoryWellnessStorage());
}

// Utility functions
export function calculateBMI(weightKg: number, heightCm: number): number {
  return Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function getHealthyWeightRange(heightCm: number): { min: number; max: number } {
  const heightM = heightCm / 100;
  return {
    min: Math.round(18.5 * heightM * heightM),
    max: Math.round(24.9 * heightM * heightM),
  };
}
