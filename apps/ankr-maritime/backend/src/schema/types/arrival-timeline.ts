/**
 * Arrival Timeline GraphQL Schema
 *
 * Complete GraphQL API for ArrivalTimelineEvent with:
 * - Comprehensive queries with filtering
 * - Event creation mutations
 * - Real-time subscriptions
 * - Timeline statistics and aggregations
 */

import { builder } from '../builder.js';
import { prisma } from '../context.js';
import { Prisma } from '@prisma/client';

// ============================================================================
// ENUMS
// ============================================================================

const ArrivalEventTypeEnum = builder.enumType('ArrivalEventType', {
  values: [
    'ARRIVAL_DETECTED',
    'ETA_CALCULATED',
    'ETA_UPDATED',
    'INTELLIGENCE_GENERATED',
    'CONGESTION_DETECTED',
    'ALERT_TRIGGERED',
    'DOCUMENT_REQUIRED',
    'DOCUMENT_SUBMITTED',
    'DOCUMENT_APPROVED',
    'DOCUMENT_REJECTED',
    'DOCUMENT_OVERDUE',
    'DOCUMENT_UPLOADED',
    'PDA_GENERATED',
    'MASTER_ALERTED',
    'SERVICE_BOOKED',
    'FDA_SUBMITTED',
    'ALERT_ACKNOWLEDGED',
    'STATUS_UPDATED',
    'DELAY_REPORTED',
    'DISTANCE_UPDATED',
    'ANCHORAGE_REACHED',
    'BERTH_ASSIGNED',
    'BERTHING_COMPLETE',
    'DEPARTURE'
  ] as const
});

const EventActorEnum = builder.enumType('EventActor', {
  values: ['SYSTEM', 'AGENT', 'MASTER', 'OWNER', 'AUTHORITY'] as const
});

const EventImpactEnum = builder.enumType('EventImpact', {
  values: ['CRITICAL', 'IMPORTANT', 'INFO'] as const
});

// ============================================================================
// INPUT TYPES
// ============================================================================

const TimelineFiltersInput = builder.inputType('TimelineFiltersInput', {
  fields: (t) => ({
    eventTypes: t.field({ type: [ArrivalEventTypeEnum], required: false }),
    actors: t.field({ type: [EventActorEnum], required: false }),
    impact: t.field({ type: EventImpactEnum, required: false }),
    fromDate: t.field({ type: 'DateTime', required: false }),
    toDate: t.field({ type: 'DateTime', required: false }),
    hasAttachments: t.boolean({ required: false }),
    search: t.string({ required: false })
  })
});

// ============================================================================
// OBJECT TYPES
// ============================================================================

const ArrivalTimelineEventType = builder.prismaObject('ArrivalTimelineEvent', {
  fields: (t) => ({
    id: t.exposeID('id'),
    arrivalId: t.exposeString('arrivalId'),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
    eventType: t.expose('eventType', { type: ArrivalEventTypeEnum }),
    actor: t.expose('actor', { type: EventActorEnum }),
    action: t.exposeString('action'),
    impact: t.expose('impact', { type: EventImpactEnum }),
    metadata: t.expose('metadata', { type: 'JSON', nullable: true }),
    relatedEvents: t.expose('relatedEvents', { type: 'JSON', nullable: true }),
    attachments: t.expose('attachments', { type: 'JSON', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),

    // Computed fields
    hasAttachments: t.boolean({
      resolve: (event) => {
        const attachments = event.attachments as any[];
        return Array.isArray(attachments) && attachments.length > 0;
      }
    }),

    relatedEventCount: t.int({
      resolve: (event) => {
        const related = event.relatedEvents as any[];
        return Array.isArray(related) ? related.length : 0;
      }
    }),

    // Formatted timestamp
    timeAgo: t.string({
      resolve: (event) => {
        const now = new Date();
        const diff = now.getTime() - event.timestamp.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
      }
    })
  })
});

const TimelineStatsType = builder.objectType('TimelineStats', {
  fields: (t) => ({
    totalEvents: t.int(),
    criticalCount: t.int(),
    importantCount: t.int(),
    infoCount: t.int(),
    byEventType: t.field({ type: 'JSON' }),
    byActor: t.field({ type: 'JSON' }),
    latestEvent: t.field({ type: 'DateTime', nullable: true }),
    oldestEvent: t.field({ type: 'DateTime', nullable: true })
  })
});

const EventGroupType = builder.objectType('EventGroup', {
  fields: (t) => ({
    key: t.string(),
    label: t.string(),
    count: t.int(),
    events: t.field({ type: [ArrivalTimelineEventType] })
  })
});

// ============================================================================
// QUERIES
// ============================================================================

builder.queryFields((t) => ({
  /**
   * Get full timeline for an arrival with optional filtering
   */
  arrivalTimeline: t.prismaField({
    type: [ArrivalTimelineEventType],
    args: {
      arrivalId: t.arg.string({ required: true }),
      filters: t.arg({ type: TimelineFiltersInput, required: false })
    },
    resolve: async (query, root, args) => {
      const { arrivalId, filters } = args;

      // Build where clause
      const where: Prisma.ArrivalTimelineEventWhereInput = {
        arrivalId
      };

      if (filters) {
        if (filters.eventTypes && filters.eventTypes.length > 0) {
          where.eventType = { in: filters.eventTypes };
        }

        if (filters.actors && filters.actors.length > 0) {
          where.actor = { in: filters.actors };
        }

        if (filters.impact) {
          where.impact = filters.impact;
        }

        if (filters.fromDate) {
          where.timestamp = { ...where.timestamp, gte: filters.fromDate };
        }

        if (filters.toDate) {
          where.timestamp = { ...where.timestamp, lte: filters.toDate };
        }

        if (filters.search) {
          where.action = { contains: filters.search, mode: 'insensitive' };
        }
      }

      const events = await prisma.arrivalTimelineEvent.findMany({
        ...query,
        where,
        orderBy: { timestamp: 'desc' }
      });

      // Filter by attachments if requested (can't do in Prisma where clause)
      if (filters?.hasAttachments !== undefined) {
        return events.filter(event => {
          const attachments = event.attachments as any[];
          const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
          return filters.hasAttachments ? hasAttachments : !hasAttachments;
        });
      }

      return events;
    }
  }),

  /**
   * Get timeline filtered by event type
   */
  arrivalTimelineByType: t.prismaField({
    type: [ArrivalTimelineEventType],
    args: {
      arrivalId: t.arg.string({ required: true }),
      eventType: t.arg({ type: ArrivalEventTypeEnum, required: true })
    },
    resolve: async (query, root, args) => {
      return prisma.arrivalTimelineEvent.findMany({
        ...query,
        where: {
          arrivalId: args.arrivalId,
          eventType: args.eventType
        },
        orderBy: { timestamp: 'desc' }
      });
    }
  }),

  /**
   * Get timeline filtered by actor
   */
  arrivalTimelineByActor: t.prismaField({
    type: [ArrivalTimelineEventType],
    args: {
      arrivalId: t.arg.string({ required: true }),
      actor: t.arg({ type: EventActorEnum, required: true })
    },
    resolve: async (query, root, args) => {
      return prisma.arrivalTimelineEvent.findMany({
        ...query,
        where: {
          arrivalId: args.arrivalId,
          actor: args.actor
        },
        orderBy: { timestamp: 'desc' }
      });
    }
  }),

  /**
   * Get timeline for a date range
   */
  arrivalTimelineByDateRange: t.prismaField({
    type: [ArrivalTimelineEventType],
    args: {
      arrivalId: t.arg.string({ required: true }),
      from: t.arg({ type: 'DateTime', required: true }),
      to: t.arg({ type: 'DateTime', required: true })
    },
    resolve: async (query, root, args) => {
      return prisma.arrivalTimelineEvent.findMany({
        ...query,
        where: {
          arrivalId: args.arrivalId,
          timestamp: {
            gte: args.from,
            lte: args.to
          }
        },
        orderBy: { timestamp: 'desc' }
      });
    }
  }),

  /**
   * Get only critical events
   */
  criticalEvents: t.prismaField({
    type: [ArrivalTimelineEventType],
    args: {
      arrivalId: t.arg.string({ required: true })
    },
    resolve: async (query, root, args) => {
      return prisma.arrivalTimelineEvent.findMany({
        ...query,
        where: {
          arrivalId: args.arrivalId,
          impact: 'CRITICAL'
        },
        orderBy: { timestamp: 'desc' }
      });
    }
  }),

  /**
   * Get timeline statistics
   */
  arrivalTimelineStats: t.field({
    type: TimelineStatsType,
    args: {
      arrivalId: t.arg.string({ required: true })
    },
    resolve: async (root, args) => {
      const events = await prisma.arrivalTimelineEvent.findMany({
        where: { arrivalId: args.arrivalId }
      });

      // Aggregate by impact
      const criticalCount = events.filter(e => e.impact === 'CRITICAL').length;
      const importantCount = events.filter(e => e.impact === 'IMPORTANT').length;
      const infoCount = events.filter(e => e.impact === 'INFO').length;

      // Aggregate by event type
      const byEventType: Record<string, number> = {};
      events.forEach(event => {
        byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1;
      });

      // Aggregate by actor
      const byActor: Record<string, number> = {};
      events.forEach(event => {
        byActor[event.actor] = (byActor[event.actor] || 0) + 1;
      });

      // Find latest and oldest
      const sortedByDate = [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      const latestEvent = sortedByDate[0]?.timestamp || null;
      const oldestEvent = sortedByDate[sortedByDate.length - 1]?.timestamp || null;

      return {
        totalEvents: events.length,
        criticalCount,
        importantCount,
        infoCount,
        byEventType,
        byActor,
        latestEvent,
        oldestEvent
      };
    }
  }),

  /**
   * Get events grouped by day
   */
  arrivalTimelineGroupedByDay: t.field({
    type: [EventGroupType],
    args: {
      arrivalId: t.arg.string({ required: true })
    },
    resolve: async (root, args) => {
      const events = await prisma.arrivalTimelineEvent.findMany({
        where: { arrivalId: args.arrivalId },
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
        label: new Date(day).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        count: dayEvents.length,
        events: dayEvents
      }));
    }
  })
}));

// ============================================================================
// MUTATIONS
// ============================================================================

builder.mutationFields((t) => ({
  /**
   * Add a manual timeline event
   */
  addTimelineEvent: t.prismaField({
    type: ArrivalTimelineEventType,
    args: {
      arrivalId: t.arg.string({ required: true }),
      eventType: t.arg({ type: ArrivalEventTypeEnum, required: true }),
      action: t.arg.string({ required: true }),
      metadata: t.arg({ type: 'JSON', required: false })
    },
    resolve: async (query, root, args, ctx) => {
      return prisma.arrivalTimelineEvent.create({
        ...query,
        data: {
          arrivalId: args.arrivalId,
          eventType: args.eventType,
          actor: 'AGENT', // Manual events are from agents
          action: args.action,
          impact: 'INFO', // Default for manual events
          metadata: args.metadata || {},
          timestamp: new Date()
        }
      });
    }
  }),

  /**
   * Link related events
   */
  linkRelatedEvents: t.prismaField({
    type: ArrivalTimelineEventType,
    args: {
      eventId: t.arg.string({ required: true }),
      relatedEventIds: t.arg.stringList({ required: true })
    },
    resolve: async (query, root, args) => {
      const event = await prisma.arrivalTimelineEvent.findUnique({
        where: { id: args.eventId },
        select: { relatedEvents: true }
      });

      if (!event) {
        throw new Error('Event not found');
      }

      const existingRelated = (event.relatedEvents as string[]) || [];
      const updatedRelated = Array.from(new Set([...existingRelated, ...args.relatedEventIds]));

      return prisma.arrivalTimelineEvent.update({
        ...query,
        where: { id: args.eventId },
        data: { relatedEvents: updatedRelated }
      });
    }
  }),

  /**
   * Add attachment to event
   */
  addEventAttachment: t.prismaField({
    type: ArrivalTimelineEventType,
    args: {
      eventId: t.arg.string({ required: true }),
      fileUrl: t.arg.string({ required: true }),
      fileName: t.arg.string({ required: true })
    },
    resolve: async (query, root, args) => {
      const event = await prisma.arrivalTimelineEvent.findUnique({
        where: { id: args.eventId },
        select: { attachments: true }
      });

      if (!event) {
        throw new Error('Event not found');
      }

      const existingAttachments = (event.attachments as any[]) || [];
      const newAttachment = {
        url: args.fileUrl,
        name: args.fileName,
        uploadedAt: new Date()
      };
      const updatedAttachments = [...existingAttachments, newAttachment];

      return prisma.arrivalTimelineEvent.update({
        ...query,
        where: { id: args.eventId },
        data: { attachments: updatedAttachments }
      });
    }
  })
}));

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

builder.subscriptionFields((t) => ({
  /**
   * Subscribe to new timeline events for an arrival
   */
  timelineEventCreated: t.field({
    type: ArrivalTimelineEventType,
    args: {
      arrivalId: t.arg.string({ required: true })
    },
    subscribe: (root, args) => {
      // TODO: Implement with Redis pub/sub or Mercurius subscriptions
      // Placeholder implementation
      return {
        [Symbol.asyncIterator]() {
          return {
            async next() {
              return { done: true, value: undefined };
            }
          };
        }
      };
    },
    resolve: (event) => event
  }),

  /**
   * Subscribe to critical events only
   */
  criticalEventOccurred: t.field({
    type: ArrivalTimelineEventType,
    args: {
      arrivalId: t.arg.string({ required: true })
    },
    subscribe: (root, args) => {
      // TODO: Implement with Redis pub/sub or Mercurius subscriptions
      // Placeholder implementation
      return {
        [Symbol.asyncIterator]() {
          return {
            async next() {
              return { done: true, value: undefined };
            }
          };
        }
      };
    },
    resolve: (event) => event
  })
}));
