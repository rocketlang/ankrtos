/**
 * @ankr/telematics-scoring
 * Vehicle telematics and driving behavior scoring
 *
 * Features:
 * - Trip tracking with safety scoring
 * - Component-based driving scores (speeding, braking, phone usage, etc.)
 * - Grade generation (A+ to F)
 * - Trend analysis
 * - Personalized driving recommendations
 */

// ============================================================================
// Types
// ============================================================================

export type TelematicsEventType =
  | 'TRIP_START'
  | 'TRIP_END'
  | 'TRIP_SUMMARY'
  | 'HARSH_BRAKING'
  | 'HARSH_ACCELERATION'
  | 'SHARP_TURN'
  | 'SPEEDING'
  | 'OVER_SPEED_LIMIT'
  | 'PHONE_USAGE'
  | 'COLLISION_DETECTED'
  | 'NEAR_MISS'
  | 'DROWSY_DRIVING'
  | 'NIGHT_DRIVING'
  | 'IDLE'
  | 'LOCATION_UPDATE';

export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING';

export interface TelematicsEvent {
  id: string;
  tripId?: string;
  eventType: TelematicsEventType;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  score: number;
  severity: EventSeverity;
  metadata?: Record<string, any>;
}

export interface TripSummary {
  tripId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  distance: number; // km
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h
  safetyScore: number; // 0-100
  events: SafetyEventCounts;
}

export interface SafetyEventCounts {
  harshBraking: number;
  harshAcceleration: number;
  speeding: number;
  phoneUsage: number;
  sharpTurns: number;
  nearMiss: number;
  drowsy: number;
}

export interface DrivingScoreComponents {
  speeding: number;
  braking: number;
  acceleration: number;
  cornering: number;
  phoneUsage: number;
  nightDriving: number;
  mileage: number;
}

export interface DrivingScore {
  overall: number; // 0-100
  components: DrivingScoreComponents;
  grade: string; // A+, A, B+, B, C, D, F
  trend: TrendDirection;
  recommendations: string[];
  periodDays: number;
  totalTrips: number;
  totalDistance: number;
}

export interface ScoringWeights {
  speeding: number;
  braking: number;
  acceleration: number;
  cornering: number;
  phoneUsage: number;
  nightDriving: number;
  mileage: number;
}

export interface TelematicsScoringConfig {
  weights?: Partial<ScoringWeights>;
  gradeThresholds?: GradeThresholds;
  eventPenalties?: Partial<EventPenalties>;
}

export interface GradeThresholds {
  'A+': number;
  A: number;
  'B+': number;
  B: number;
  C: number;
  D: number;
}

export interface EventPenalties {
  harshBraking: number;
  harshAcceleration: number;
  speeding: number;
  phoneUsage: number;
  sharpTurns: number;
  nearMiss: number;
  drowsy: number;
}

export interface SafetyNudge {
  type: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'SAFETY' | 'EFFICIENCY' | 'MAINTENANCE';
}

// ============================================================================
// Storage Interface (Implement for your storage backend)
// ============================================================================

export interface TelematicsStorage {
  saveEvent(event: TelematicsEvent): Promise<void>;
  getEvents(tripId: string): Promise<TelematicsEvent[]>;
  getEventsByDateRange(startDate: Date, endDate: Date): Promise<TelematicsEvent[]>;
  getTripSummaries(limit: number): Promise<TripSummary[]>;
}

// ============================================================================
// In-Memory Storage (for testing/demo)
// ============================================================================

export class InMemoryTelematicsStorage implements TelematicsStorage {
  private events: TelematicsEvent[] = [];
  private tripSummaries: TripSummary[] = [];

  async saveEvent(event: TelematicsEvent): Promise<void> {
    this.events.push(event);
  }

  async getEvents(tripId: string): Promise<TelematicsEvent[]> {
    return this.events.filter((e) => e.tripId === tripId);
  }

  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<TelematicsEvent[]> {
    return this.events.filter(
      (e) => e.timestamp >= startDate && e.timestamp <= endDate
    );
  }

  async getTripSummaries(limit: number): Promise<TripSummary[]> {
    return this.tripSummaries.slice(-limit);
  }

  saveTripSummary(summary: TripSummary): void {
    this.tripSummaries.push(summary);
  }

  clear(): void {
    this.events = [];
    this.tripSummaries = [];
  }
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_WEIGHTS: ScoringWeights = {
  speeding: 0.20,
  braking: 0.15,
  acceleration: 0.10,
  cornering: 0.10,
  phoneUsage: 0.25, // Phone usage weighted heavily
  nightDriving: 0.10,
  mileage: 0.10,
};

const DEFAULT_GRADE_THRESHOLDS: GradeThresholds = {
  'A+': 95,
  A: 90,
  'B+': 85,
  B: 80,
  C: 70,
  D: 60,
};

const DEFAULT_EVENT_PENALTIES: EventPenalties = {
  harshBraking: 5,
  harshAcceleration: 3,
  speeding: 8,
  phoneUsage: 15, // Heavy penalty
  sharpTurns: 2,
  nearMiss: 20,
  drowsy: 25,
};

// ============================================================================
// Event Scoring
// ============================================================================

const EVENT_SCORES: Record<TelematicsEventType, { baseScore: number; severity: EventSeverity }> = {
  TRIP_START: { baseScore: 1.0, severity: 'LOW' },
  TRIP_END: { baseScore: 1.0, severity: 'LOW' },
  TRIP_SUMMARY: { baseScore: 1.0, severity: 'LOW' },
  HARSH_BRAKING: { baseScore: 0.3, severity: 'MEDIUM' },
  HARSH_ACCELERATION: { baseScore: 0.4, severity: 'MEDIUM' },
  SHARP_TURN: { baseScore: 0.5, severity: 'MEDIUM' },
  SPEEDING: { baseScore: 0.4, severity: 'MEDIUM' },
  OVER_SPEED_LIMIT: { baseScore: 0.2, severity: 'HIGH' },
  PHONE_USAGE: { baseScore: 0.1, severity: 'HIGH' },
  COLLISION_DETECTED: { baseScore: 0.0, severity: 'CRITICAL' },
  NEAR_MISS: { baseScore: 0.1, severity: 'HIGH' },
  DROWSY_DRIVING: { baseScore: 0.1, severity: 'HIGH' },
  NIGHT_DRIVING: { baseScore: 0.7, severity: 'LOW' },
  IDLE: { baseScore: 0.8, severity: 'LOW' },
  LOCATION_UPDATE: { baseScore: 1.0, severity: 'LOW' },
};

// ============================================================================
// Telematics Scoring Engine
// ============================================================================

export class TelematicsScoringEngine {
  private weights: ScoringWeights;
  private gradeThresholds: GradeThresholds;
  private eventPenalties: EventPenalties;
  private storage: TelematicsStorage;
  private activeTrips: Map<string, { startTime: Date; events: TelematicsEvent[] }> = new Map();

  constructor(storage: TelematicsStorage, config?: TelematicsScoringConfig) {
    this.storage = storage;
    this.weights = { ...DEFAULT_WEIGHTS, ...config?.weights };
    this.gradeThresholds = { ...DEFAULT_GRADE_THRESHOLDS, ...config?.gradeThresholds };
    this.eventPenalties = { ...DEFAULT_EVENT_PENALTIES, ...config?.eventPenalties };
  }

  /**
   * Generate a unique trip ID
   */
  generateTripId(): string {
    return `TRIP_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Generate a unique event ID
   */
  generateEventId(): string {
    return `EVT_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Start a new trip
   */
  async startTrip(location?: { lat: number; lng: number }): Promise<string> {
    const tripId = this.generateTripId();
    const event: TelematicsEvent = {
      id: this.generateEventId(),
      tripId,
      eventType: 'TRIP_START',
      timestamp: new Date(),
      latitude: location?.lat,
      longitude: location?.lng,
      score: 1.0,
      severity: 'LOW',
    };

    await this.storage.saveEvent(event);
    this.activeTrips.set(tripId, { startTime: new Date(), events: [event] });

    return tripId;
  }

  /**
   * Record a telematics event
   */
  async recordEvent(
    tripId: string,
    eventType: TelematicsEventType,
    data?: {
      latitude?: number;
      longitude?: number;
      speed?: number;
      heading?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<{ event: TelematicsEvent; nudge?: SafetyNudge }> {
    const { baseScore, severity } = EVENT_SCORES[eventType] || { baseScore: 0.5, severity: 'LOW' as EventSeverity };

    const event: TelematicsEvent = {
      id: this.generateEventId(),
      tripId,
      eventType,
      timestamp: new Date(),
      latitude: data?.latitude,
      longitude: data?.longitude,
      speed: data?.speed,
      heading: data?.heading,
      score: baseScore,
      severity,
      metadata: data?.metadata,
    };

    await this.storage.saveEvent(event);

    // Track in active trip
    const activeTrip = this.activeTrips.get(tripId);
    if (activeTrip) {
      activeTrip.events.push(event);
    }

    // Generate safety nudge for high severity events
    let nudge: SafetyNudge | undefined;
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      nudge = this.generateSafetyNudge(eventType, severity);
    }

    return { event, nudge };
  }

  /**
   * End a trip and calculate summary
   */
  async endTrip(tripId: string, location?: { lat: number; lng: number }): Promise<TripSummary> {
    // Record trip end event
    await this.recordEvent(tripId, 'TRIP_END', {
      latitude: location?.lat,
      longitude: location?.lng,
    });

    // Get all events for this trip
    const events = await this.storage.getEvents(tripId);

    // Calculate trip statistics
    const tripStart = events.find((e) => e.eventType === 'TRIP_START');
    const tripEnd = events.find((e) => e.eventType === 'TRIP_END');

    const startTime = tripStart?.timestamp || new Date();
    const endTime = tripEnd?.timestamp || new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Calculate speeds
    const speeds = events.filter((e) => e.speed != null).map((e) => e.speed!);
    const averageSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

    // Count safety events
    const safetyEvents: SafetyEventCounts = {
      harshBraking: events.filter((e) => e.eventType === 'HARSH_BRAKING').length,
      harshAcceleration: events.filter((e) => e.eventType === 'HARSH_ACCELERATION').length,
      speeding: events.filter((e) => e.eventType === 'SPEEDING' || e.eventType === 'OVER_SPEED_LIMIT').length,
      phoneUsage: events.filter((e) => e.eventType === 'PHONE_USAGE').length,
      sharpTurns: events.filter((e) => e.eventType === 'SHARP_TURN').length,
      nearMiss: events.filter((e) => e.eventType === 'NEAR_MISS').length,
      drowsy: events.filter((e) => e.eventType === 'DROWSY_DRIVING').length,
    };

    // Calculate safety score
    const safetyScore = this.calculateTripSafetyScore(duration, safetyEvents);

    // Estimate distance
    const distance = (averageSpeed * duration) / 3600; // km

    const summary: TripSummary = {
      tripId,
      startTime,
      endTime,
      duration,
      distance,
      averageSpeed,
      maxSpeed,
      safetyScore,
      events: safetyEvents,
    };

    // Clean up active trip
    this.activeTrips.delete(tripId);

    return summary;
  }

  /**
   * Calculate driving score from events
   */
  calculateDrivingScore(
    events: TelematicsEvent[],
    trips: TripSummary[],
    periodDays: number = 30
  ): DrivingScore {
    const totalEvents = events.length || 1;

    // Count events by type
    const speedingEvents = events.filter((e) =>
      e.eventType === 'SPEEDING' || e.eventType === 'OVER_SPEED_LIMIT'
    ).length;
    const brakingEvents = events.filter((e) => e.eventType === 'HARSH_BRAKING').length;
    const accelerationEvents = events.filter((e) => e.eventType === 'HARSH_ACCELERATION').length;
    const corneringEvents = events.filter((e) => e.eventType === 'SHARP_TURN').length;
    const phoneEvents = events.filter((e) => e.eventType === 'PHONE_USAGE').length;
    const nightEvents = events.filter((e) => e.eventType === 'NIGHT_DRIVING').length;

    // Score calculation: fewer events = higher score
    const components: DrivingScoreComponents = {
      speeding: Math.max(0, 100 - (speedingEvents / totalEvents) * 500),
      braking: Math.max(0, 100 - (brakingEvents / totalEvents) * 500),
      acceleration: Math.max(0, 100 - (accelerationEvents / totalEvents) * 500),
      cornering: Math.max(0, 100 - (corneringEvents / totalEvents) * 500),
      phoneUsage: Math.max(0, 100 - (phoneEvents / totalEvents) * 1000),
      nightDriving: Math.min(100, 100 - (nightEvents / totalEvents) * 100),
      mileage: 80, // Default - would need odometer data
    };

    // Weighted average
    const overall = Object.keys(components).reduce(
      (sum, key) =>
        sum +
        components[key as keyof DrivingScoreComponents] *
          this.weights[key as keyof ScoringWeights],
      0
    );

    // Round components
    const roundedComponents: DrivingScoreComponents = {
      speeding: Math.round(components.speeding * 10) / 10,
      braking: Math.round(components.braking * 10) / 10,
      acceleration: Math.round(components.acceleration * 10) / 10,
      cornering: Math.round(components.cornering * 10) / 10,
      phoneUsage: Math.round(components.phoneUsage * 10) / 10,
      nightDriving: Math.round(components.nightDriving * 10) / 10,
      mileage: Math.round(components.mileage * 10) / 10,
    };

    // Calculate totals
    const totalTrips = trips.length;
    const totalDistance = trips.reduce((sum, t) => sum + t.distance, 0);

    // Determine grade and trend
    const grade = this.scoreToGrade(overall);
    const trend = this.determineTrend(trips);

    // Generate recommendations
    const recommendations = this.generateRecommendations(roundedComponents);

    return {
      overall: Math.round(overall * 10) / 10,
      components: roundedComponents,
      grade,
      trend,
      recommendations,
      periodDays,
      totalTrips,
      totalDistance: Math.round(totalDistance * 10) / 10,
    };
  }

  /**
   * Calculate trip safety score
   */
  private calculateTripSafetyScore(durationSeconds: number, events: SafetyEventCounts): number {
    let score = 100;

    // Normalize by trip duration (events per 10 minutes)
    const durationMins = Math.max(durationSeconds / 60, 1);
    const normalizer = 10 / durationMins;

    score -= events.harshBraking * this.eventPenalties.harshBraking * normalizer;
    score -= events.harshAcceleration * this.eventPenalties.harshAcceleration * normalizer;
    score -= events.speeding * this.eventPenalties.speeding * normalizer;
    score -= events.phoneUsage * this.eventPenalties.phoneUsage * normalizer;
    score -= events.sharpTurns * this.eventPenalties.sharpTurns * normalizer;
    score -= events.nearMiss * this.eventPenalties.nearMiss * normalizer;
    score -= events.drowsy * this.eventPenalties.drowsy * normalizer;

    return Math.max(0, Math.min(100, Math.round(score)));
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
   * Determine trend from trip history
   */
  private determineTrend(trips: TripSummary[]): TrendDirection {
    if (trips.length < 3) return 'STABLE';

    const recent = trips.slice(-5);
    const older = trips.slice(-10, -5);

    if (older.length === 0) return 'STABLE';

    const recentAvg = recent.reduce((sum, t) => sum + t.safetyScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, t) => sum + t.safetyScore, 0) / older.length;

    const diff = recentAvg - olderAvg;

    if (diff > 5) return 'IMPROVING';
    if (diff < -5) return 'DECLINING';
    return 'STABLE';
  }

  /**
   * Generate driving recommendations
   */
  private generateRecommendations(components: DrivingScoreComponents): string[] {
    const recommendations: string[] = [];

    if (components.phoneUsage < 70) {
      recommendations.push('Reduce phone usage while driving - consider enabling Do Not Disturb mode');
    }
    if (components.speeding < 70) {
      recommendations.push('Watch your speed - staying within limits reduces accident risk by 40%');
    }
    if (components.braking < 70) {
      recommendations.push('Maintain safe following distance to reduce harsh braking');
    }
    if (components.acceleration < 70) {
      recommendations.push('Accelerate smoothly - gentle starts save fuel and reduce wear');
    }
    if (components.cornering < 70) {
      recommendations.push('Take corners more slowly to improve vehicle control');
    }
    if (components.nightDriving < 70) {
      recommendations.push('Extra caution during night driving - visibility is reduced');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great driving! Keep up the safe habits');
    }

    return recommendations;
  }

  /**
   * Generate safety nudge for event
   */
  private generateSafetyNudge(eventType: TelematicsEventType, severity: EventSeverity): SafetyNudge {
    const nudgeMap: Record<string, SafetyNudge> = {
      PHONE_USAGE: {
        type: 'PHONE_USAGE_REMINDER',
        title: 'Safety Alert: Phone Detected',
        message: 'We noticed phone usage during driving. Please pull over safely before using your phone.',
        priority: 'HIGH',
        category: 'SAFETY',
      },
      HARSH_BRAKING: {
        type: 'HARSH_BRAKING_ALERT',
        title: 'Driving Tip: Harsh Braking',
        message: 'Maintaining safe distance helps avoid sudden stops. Your score improved last week!',
        priority: 'MEDIUM',
        category: 'SAFETY',
      },
      SPEEDING: {
        type: 'SPEEDING_ALERT',
        title: 'Speed Check',
        message: 'Speed limits exist for safety. Staying within limits could earn you a premium discount.',
        priority: 'MEDIUM',
        category: 'SAFETY',
      },
      OVER_SPEED_LIMIT: {
        type: 'SPEEDING_ALERT',
        title: 'Speed Alert',
        message: 'You were detected above the speed limit. Safe speeds protect you and others.',
        priority: 'HIGH',
        category: 'SAFETY',
      },
      DROWSY_DRIVING: {
        type: 'DROWSY_ALERT',
        title: 'Fatigue Warning',
        message: 'Signs of drowsy driving detected. Consider taking a break at the next safe location.',
        priority: 'URGENT',
        category: 'SAFETY',
      },
      COLLISION_DETECTED: {
        type: 'COLLISION_ALERT',
        title: 'Collision Detected',
        message: 'A potential collision was detected. Are you okay? Emergency services can be contacted.',
        priority: 'URGENT',
        category: 'SAFETY',
      },
      NEAR_MISS: {
        type: 'NEAR_MISS_ALERT',
        title: 'Close Call Detected',
        message: 'A near-miss event was detected. Stay alert and maintain safe distances.',
        priority: 'HIGH',
        category: 'SAFETY',
      },
    };

    return (
      nudgeMap[eventType] || {
        type: 'GENERAL_SAFETY',
        title: 'Safety Reminder',
        message: 'Drive safely and stay alert on the road.',
        priority: severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
        category: 'SAFETY',
      }
    );
  }

  /**
   * Check if event is safety-critical
   */
  isSafetyCriticalEvent(eventType: TelematicsEventType): boolean {
    const criticalEvents: TelematicsEventType[] = [
      'PHONE_USAGE',
      'COLLISION_DETECTED',
      'NEAR_MISS',
      'DROWSY_DRIVING',
      'OVER_SPEED_LIMIT',
    ];
    return criticalEvents.includes(eventType);
  }

  /**
   * Get premium discount based on driving score
   */
  calculatePremiumDiscount(score: number): { percentage: number; description: string } {
    if (score >= 95) return { percentage: 25, description: 'Elite Driver - Maximum discount' };
    if (score >= 90) return { percentage: 20, description: 'Excellent Driver' };
    if (score >= 85) return { percentage: 15, description: 'Very Good Driver' };
    if (score >= 80) return { percentage: 10, description: 'Good Driver' };
    if (score >= 70) return { percentage: 5, description: 'Average Driver' };
    if (score >= 60) return { percentage: 0, description: 'Needs Improvement' };
    return { percentage: -10, description: 'High Risk - Premium Surcharge' };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createTelematicsScoringEngine(
  storage?: TelematicsStorage,
  config?: TelematicsScoringConfig
): TelematicsScoringEngine {
  return new TelematicsScoringEngine(storage || new InMemoryTelematicsStorage(), config);
}

// Default export
export default TelematicsScoringEngine;
