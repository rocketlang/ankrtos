/**
 * Timeline Aggregator Service
 *
 * Provides intelligent timeline querying, aggregation, and analysis:
 * - Group events by day/type/actor
 * - Calculate statistics and insights
 * - Identify event gaps and missing expected events
 * - Build event causality chains
 * - Detect timeline patterns
 */

import { PrismaClient, ArrivalEventType, EventActor, EventImpact } from '@prisma/client';

const prisma = new PrismaClient();

interface TimelineGroup {
  key: string;
  label: string;
  count: number;
  events: any[];
}

interface TimelineStats {
  totalEvents: number;
  criticalCount: number;
  importantCount: number;
  infoCount: number;
  byEventType: Record<string, number>;
  byActor: Record<string, number>;
  eventVelocity: number; // Events per day
  latestEvent: Date | null;
  oldestEvent: Date | null;
}

interface EventChain {
  rootEvent: any;
  relatedEvents: any[];
  depth: number;
}

interface EventGap {
  expectedEventType: ArrivalEventType;
  expectedBy: Date;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export class TimelineAggregatorService {
  /**
   * Get timeline grouped by day
   */
  async getTimelineGroupedByDay(arrivalId: string): Promise<TimelineGroup[]> {
    const events = await prisma.arrivalTimelineEvent.findMany({
      where: { arrivalId },
      orderBy: { timestamp: 'desc' }
    });

    // Group by day
    const groups: Record<string, any[]> = {};
    events.forEach(event => {
      const day = event.timestamp.toISOString().split('T')[0];
      if (!groups[day]) groups[day] = [];
      groups[day].push(event);
    });

    return Object.entries(groups).map(([day, dayEvents]) => ({
      key: day,
      label: this.formatDate(new Date(day)),
      count: dayEvents.length,
      events: dayEvents
    }));
  }

  /**
   * Get timeline grouped by event type
   */
  async getTimelineGroupedByType(arrivalId: string): Promise<TimelineGroup[]> {
    const events = await prisma.arrivalTimelineEvent.findMany({
      where: { arrivalId },
      orderBy: { timestamp: 'desc' }
    });

    // Group by event type
    const groups: Record<string, any[]> = {};
    events.forEach(event => {
      const type = event.eventType;
      if (!groups[type]) groups[type] = [];
      groups[type].push(event);
    });

    return Object.entries(groups).map(([type, typeEvents]) => ({
      key: type,
      label: this.formatEventType(type as ArrivalEventType),
      count: typeEvents.length,
      events: typeEvents
    }));
  }

  /**
   * Get timeline grouped by actor
   */
  async getTimelineGroupedByActor(arrivalId: string): Promise<TimelineGroup[]> {
    const events = await prisma.arrivalTimelineEvent.findMany({
      where: { arrivalId },
      orderBy: { timestamp: 'desc' }
    });

    // Group by actor
    const groups: Record<string, any[]> = {};
    events.forEach(event => {
      const actor = event.actor;
      if (!groups[actor]) groups[actor] = [];
      groups[actor].push(event);
    });

    return Object.entries(groups).map(([actor, actorEvents]) => ({
      key: actor,
      label: this.formatActor(actor as EventActor),
      count: actorEvents.length,
      events: actorEvents
    }));
  }

  /**
   * Get timeline with correlation analysis
   */
  async getTimelineWithCorrelation(arrivalId: string): Promise<any[]> {
    const events = await prisma.arrivalTimelineEvent.findMany({
      where: { arrivalId },
      orderBy: { timestamp: 'desc' }
    });

    // Enhance each event with correlation data
    return events.map(event => ({
      ...event,
      relatedEventDetails: this.findRelatedEventDetails(event, events),
      correlationScore: this.calculateCorrelationScore(event, events)
    }));
  }

  /**
   * Calculate comprehensive timeline statistics
   */
  async calculateTimelineStats(arrivalId: string): Promise<TimelineStats> {
    const events = await prisma.arrivalTimelineEvent.findMany({
      where: { arrivalId }
    });

    if (events.length === 0) {
      return {
        totalEvents: 0,
        criticalCount: 0,
        importantCount: 0,
        infoCount: 0,
        byEventType: {},
        byActor: {},
        eventVelocity: 0,
        latestEvent: null,
        oldestEvent: null
      };
    }

    // Count by impact
    const criticalCount = events.filter(e => e.impact === 'CRITICAL').length;
    const importantCount = events.filter(e => e.impact === 'IMPORTANT').length;
    const infoCount = events.filter(e => e.impact === 'INFO').length;

    // Count by event type
    const byEventType: Record<string, number> = {};
    events.forEach(event => {
      byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1;
    });

    // Count by actor
    const byActor: Record<string, number> = {};
    events.forEach(event => {
      byActor[event.actor] = (byActor[event.actor] || 0) + 1;
    });

    // Calculate event velocity (events per day)
    const sortedByDate = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const oldestEvent = sortedByDate[0].timestamp;
    const latestEvent = sortedByDate[sortedByDate.length - 1].timestamp;
    const daysDiff = Math.max(1, (latestEvent.getTime() - oldestEvent.getTime()) / (1000 * 60 * 60 * 24));
    const eventVelocity = events.length / daysDiff;

    return {
      totalEvents: events.length,
      criticalCount,
      importantCount,
      infoCount,
      byEventType,
      byActor,
      eventVelocity: Math.round(eventVelocity * 10) / 10,
      latestEvent,
      oldestEvent
    };
  }

  /**
   * Identify missing expected events (event gaps)
   */
  async identifyEventGaps(arrivalId: string): Promise<EventGap[]> {
    const events = await prisma.arrivalTimelineEvent.findMany({
      where: { arrivalId },
      orderBy: { timestamp: 'asc' }
    });

    const eventTypes = new Set(events.map(e => e.eventType));
    const gaps: EventGap[] = [];

    // Check for expected event sequences

    // Gap 1: ETA should be calculated after arrival detected
    if (eventTypes.has('ARRIVAL_DETECTED') && !eventTypes.has('ETA_CALCULATED')) {
      gaps.push({
        expectedEventType: 'ETA_CALCULATED',
        expectedBy: new Date(Date.now() + 24 * 60 * 60 * 1000), // Within 24h
        description: 'ETA calculation expected after arrival detection',
        severity: 'high'
      });
    }

    // Gap 2: Intelligence should be generated
    if (eventTypes.has('ARRIVAL_DETECTED') && !eventTypes.has('INTELLIGENCE_GENERATED')) {
      gaps.push({
        expectedEventType: 'INTELLIGENCE_GENERATED',
        expectedBy: new Date(Date.now() + 24 * 60 * 60 * 1000),
        description: 'Arrival intelligence generation expected',
        severity: 'high'
      });
    }

    // Gap 3: Documents required should lead to submission
    if (eventTypes.has('DOCUMENT_REQUIRED') && !eventTypes.has('DOCUMENT_SUBMITTED')) {
      const requiredEvent = events.find(e => e.eventType === 'DOCUMENT_REQUIRED');
      if (requiredEvent) {
        const hoursSinceRequired = (Date.now() - requiredEvent.timestamp.getTime()) / (1000 * 60 * 60);
        if (hoursSinceRequired > 48) {
          gaps.push({
            expectedEventType: 'DOCUMENT_SUBMITTED',
            expectedBy: new Date(requiredEvent.timestamp.getTime() + 72 * 60 * 60 * 1000),
            description: 'Document submission overdue',
            severity: 'high'
          });
        }
      }
    }

    // Gap 4: Alert triggered should lead to acknowledgment
    if (eventTypes.has('MASTER_ALERTED') && !eventTypes.has('ALERT_ACKNOWLEDGED')) {
      const alertedEvent = events.find(e => e.eventType === 'MASTER_ALERTED');
      if (alertedEvent) {
        const hoursSinceAlert = (Date.now() - alertedEvent.timestamp.getTime()) / (1000 * 60 * 60);
        if (hoursSinceAlert > 24) {
          gaps.push({
            expectedEventType: 'ALERT_ACKNOWLEDGED',
            expectedBy: new Date(alertedEvent.timestamp.getTime() + 48 * 60 * 60 * 1000),
            description: 'Master alert acknowledgment pending',
            severity: 'medium'
          });
        }
      }
    }

    // Gap 5: Document submission should lead to approval/rejection
    if (eventTypes.has('DOCUMENT_SUBMITTED') &&
        !eventTypes.has('DOCUMENT_APPROVED') &&
        !eventTypes.has('DOCUMENT_REJECTED')) {
      const submittedEvent = events.find(e => e.eventType === 'DOCUMENT_SUBMITTED');
      if (submittedEvent) {
        const hoursSinceSubmission = (Date.now() - submittedEvent.timestamp.getTime()) / (1000 * 60 * 60);
        if (hoursSinceSubmission > 48) {
          gaps.push({
            expectedEventType: 'DOCUMENT_APPROVED',
            expectedBy: new Date(submittedEvent.timestamp.getTime() + 72 * 60 * 60 * 1000),
            description: 'Document approval/rejection pending',
            severity: 'medium'
          });
        }
      }
    }

    return gaps;
  }

  /**
   * Build event causality chain starting from a specific event
   */
  async buildEventChain(eventId: string): Promise<EventChain> {
    const rootEvent = await prisma.arrivalTimelineEvent.findUnique({
      where: { id: eventId }
    });

    if (!rootEvent) {
      throw new Error('Event not found');
    }

    const relatedEvents = await this.getRelatedEventsRecursive(eventId, new Set());

    return {
      rootEvent,
      relatedEvents,
      depth: this.calculateChainDepth(rootEvent, relatedEvents)
    };
  }

  /**
   * Get timeline summary for dashboard
   */
  async getTimelineSummary(arrivalId: string): Promise<{
    recentEvents: any[];
    criticalEvents: any[];
    stats: TimelineStats;
    gaps: EventGap[];
  }> {
    const [recentEvents, criticalEvents, stats, gaps] = await Promise.all([
      prisma.arrivalTimelineEvent.findMany({
        where: { arrivalId },
        orderBy: { timestamp: 'desc' },
        take: 5
      }),
      prisma.arrivalTimelineEvent.findMany({
        where: { arrivalId, impact: 'CRITICAL' },
        orderBy: { timestamp: 'desc' },
        take: 10
      }),
      this.calculateTimelineStats(arrivalId),
      this.identifyEventGaps(arrivalId)
    ]);

    return {
      recentEvents,
      criticalEvents,
      stats,
      gaps
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private formatEventType(type: ArrivalEventType): string {
    return type.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private formatActor(actor: EventActor): string {
    return actor.charAt(0) + actor.slice(1).toLowerCase();
  }

  private findRelatedEventDetails(event: any, allEvents: any[]): any[] {
    const relatedIds = (event.relatedEvents as string[]) || [];
    return allEvents.filter(e => relatedIds.includes(e.id));
  }

  private calculateCorrelationScore(event: any, allEvents: any[]): number {
    // Simple correlation based on:
    // - Number of related events
    // - Time proximity to other events
    // - Same actor frequency

    const relatedCount = ((event.relatedEvents as string[]) || []).length;

    const timeProximityEvents = allEvents.filter(e => {
      const timeDiff = Math.abs(e.timestamp.getTime() - event.timestamp.getTime());
      return timeDiff < 60 * 60 * 1000; // Within 1 hour
    }).length;

    const sameActorEvents = allEvents.filter(e => e.actor === event.actor).length;

    const score = (relatedCount * 3) + timeProximityEvents + (sameActorEvents / 10);
    return Math.min(100, Math.round(score));
  }

  private async getRelatedEventsRecursive(
    eventId: string,
    visited: Set<string>,
    depth: number = 0,
    maxDepth: number = 5
  ): Promise<any[]> {
    if (depth >= maxDepth || visited.has(eventId)) {
      return [];
    }

    visited.add(eventId);

    const event = await prisma.arrivalTimelineEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) return [];

    const relatedIds = (event.relatedEvents as string[]) || [];
    const relatedEvents: any[] = [];

    for (const relatedId of relatedIds) {
      if (!visited.has(relatedId)) {
        const related = await prisma.arrivalTimelineEvent.findUnique({
          where: { id: relatedId }
        });
        if (related) {
          relatedEvents.push(related);
          const nested = await this.getRelatedEventsRecursive(
            relatedId,
            visited,
            depth + 1,
            maxDepth
          );
          relatedEvents.push(...nested);
        }
      }
    }

    return relatedEvents;
  }

  private calculateChainDepth(rootEvent: any, relatedEvents: any[]): number {
    // Simple depth calculation based on timestamp ordering
    if (relatedEvents.length === 0) return 1;

    const allEvents = [rootEvent, ...relatedEvents];
    allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Each unique timestamp level adds to depth
    const uniqueTimestamps = new Set(allEvents.map(e => e.timestamp.getTime()));
    return uniqueTimestamps.size;
  }
}

// Export singleton instance
export const timelineAggregator = new TimelineAggregatorService();
