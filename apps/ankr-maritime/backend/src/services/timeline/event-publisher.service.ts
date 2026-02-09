/**
 * Event Publisher Service
 *
 * Unified service for publishing timeline events to ArrivalTimelineEvent.
 * Provides the single source of truth for event creation with:
 * - Event validation and deduplication
 * - Automatic timestamp management
 * - Impact level calculation
 * - Related event linking
 * - Specialized publishers for different event categories
 */

import { PrismaClient, ArrivalEventType, EventActor, EventImpact } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

interface PublishEventParams {
  arrivalId: string;
  eventType: ArrivalEventType;
  actor: EventActor;
  action: string;
  impact?: EventImpact;
  metadata?: Record<string, any>;
  relatedEvents?: string[];
  attachments?: string[];
}

interface DocumentEventParams {
  arrivalId: string;
  documentType: string;
  documentName: string;
  actor: EventActor;
  status: 'required' | 'uploaded' | 'submitted' | 'approved' | 'rejected' | 'overdue';
  metadata?: Record<string, any>;
}

interface AlertEventParams {
  arrivalId: string;
  alertId: string;
  alertType: string;
  priority: string;
  actor: EventActor;
  status: 'triggered' | 'alerted' | 'acknowledged';
  metadata?: Record<string, any>;
}

interface IntelligenceEventParams {
  arrivalId: string;
  type: 'generated' | 'eta_calculated' | 'eta_updated' | 'congestion_detected' | 'distance_updated';
  metadata: Record<string, any>;
  previousValue?: any;
  newValue?: any;
}

interface OperationalEventParams {
  arrivalId: string;
  type: 'status_updated' | 'delay_reported' | 'anchorage' | 'berth_assigned' | 'berthing_complete' | 'departure';
  actor: EventActor;
  action: string;
  metadata?: Record<string, any>;
}

export class EventPublisherService {
  /**
   * Core event publishing method
   */
  async publishEvent(params: PublishEventParams) {
    const {
      arrivalId,
      eventType,
      actor,
      action,
      impact,
      metadata = {},
      relatedEvents = [],
      attachments = []
    } = params;

    // Calculate impact if not provided
    const calculatedImpact = impact || this.calculateImpact(eventType, metadata);

    // Check for duplicate events (within last 5 minutes)
    const isDuplicate = await this.checkDuplicate(
      arrivalId,
      eventType,
      actor,
      action
    );

    if (isDuplicate) {
      console.log(`[EventPublisher] Skipping duplicate event: ${eventType} for ${arrivalId}`);
      return null;
    }

    // Create event
    const event = await prisma.arrivalTimelineEvent.create({
      data: {
        arrivalId,
        eventType,
        actor,
        action,
        impact: calculatedImpact,
        metadata,
        relatedEvents,
        attachments,
        timestamp: new Date()
      }
    });

    console.log(`[EventPublisher] Published: ${eventType} (${calculatedImpact}) by ${actor} for arrival ${arrivalId}`);

    return event;
  }

  /**
   * Publish document-related event
   */
  async publishDocumentEvent(params: DocumentEventParams) {
    const { arrivalId, documentType, documentName, actor, status, metadata = {} } = params;

    const eventTypeMap: Record<string, ArrivalEventType> = {
      required: 'DOCUMENT_REQUIRED',
      uploaded: 'DOCUMENT_UPLOADED',
      submitted: 'DOCUMENT_SUBMITTED',
      approved: 'DOCUMENT_APPROVED',
      rejected: 'DOCUMENT_REJECTED',
      overdue: 'DOCUMENT_OVERDUE'
    };

    const eventType = eventTypeMap[status];
    const actionMap: Record<string, string> = {
      required: `Document required: ${documentName}`,
      uploaded: `Document uploaded: ${documentName}`,
      submitted: `Document submitted: ${documentName}`,
      approved: `Document approved: ${documentName}`,
      rejected: `Document rejected: ${documentName}`,
      overdue: `Document overdue: ${documentName}`
    };

    return this.publishEvent({
      arrivalId,
      eventType,
      actor,
      action: actionMap[status],
      metadata: {
        ...metadata,
        documentType,
        documentName,
        status
      }
    });
  }

  /**
   * Publish alert-related event
   */
  async publishAlertEvent(params: AlertEventParams) {
    const { arrivalId, alertId, alertType, priority, actor, status, metadata = {} } = params;

    const eventTypeMap: Record<string, ArrivalEventType> = {
      triggered: 'ALERT_TRIGGERED',
      alerted: 'MASTER_ALERTED',
      acknowledged: 'ALERT_ACKNOWLEDGED'
    };

    const eventType = eventTypeMap[status];
    const actionMap: Record<string, string> = {
      triggered: `Alert triggered: ${alertType} (${priority} priority)`,
      alerted: `Master alerted via multi-channel delivery`,
      acknowledged: `Master acknowledged alert`
    };

    return this.publishEvent({
      arrivalId,
      eventType,
      actor,
      action: actionMap[status],
      impact: priority === 'CRITICAL' ? 'CRITICAL' : priority === 'HIGH' ? 'IMPORTANT' : 'INFO',
      metadata: {
        ...metadata,
        alertId,
        alertType,
        priority,
        status
      }
    });
  }

  /**
   * Publish intelligence-related event
   */
  async publishIntelligenceEvent(params: IntelligenceEventParams) {
    const { arrivalId, type, metadata, previousValue, newValue } = params;

    const eventTypeMap: Record<string, ArrivalEventType> = {
      generated: 'INTELLIGENCE_GENERATED',
      eta_calculated: 'ETA_CALCULATED',
      eta_updated: 'ETA_UPDATED',
      congestion_detected: 'CONGESTION_DETECTED',
      distance_updated: 'DISTANCE_UPDATED'
    };

    const eventType = eventTypeMap[type];
    const actions: Record<string, string> = {
      generated: 'Arrival intelligence generated with automated recommendations',
      eta_calculated: `Initial ETA calculated: ${newValue}`,
      eta_updated: `ETA updated from ${previousValue} to ${newValue}`,
      congestion_detected: `Port congestion detected: ${metadata.congestionLevel || 'MODERATE'}`,
      distance_updated: `Distance updated: ${newValue} NM from port`
    };

    return this.publishEvent({
      arrivalId,
      eventType,
      actor: 'SYSTEM',
      action: actions[type],
      metadata: {
        ...metadata,
        previousValue,
        newValue
      }
    });
  }

  /**
   * Publish operational event
   */
  async publishOperationalEvent(params: OperationalEventParams) {
    const { arrivalId, type, actor, action, metadata = {} } = params;

    const eventTypeMap: Record<string, ArrivalEventType> = {
      status_updated: 'STATUS_UPDATED',
      delay_reported: 'DELAY_REPORTED',
      anchorage: 'ANCHORAGE_REACHED',
      berth_assigned: 'BERTH_ASSIGNED',
      berthing_complete: 'BERTHING_COMPLETE',
      departure: 'DEPARTURE'
    };

    const eventType = eventTypeMap[type];

    return this.publishEvent({
      arrivalId,
      eventType,
      actor,
      action,
      metadata
    });
  }

  /**
   * Publish PDA generation event
   */
  async publishPDAEvent(arrivalId: string, metadata: Record<string, any> = {}) {
    return this.publishEvent({
      arrivalId,
      eventType: 'PDA_GENERATED',
      actor: 'SYSTEM',
      action: 'Port Disbursement Account generated with cost forecast',
      metadata
    });
  }

  /**
   * Publish service booking event
   */
  async publishServiceBookingEvent(
    arrivalId: string,
    serviceName: string,
    actor: EventActor,
    metadata: Record<string, any> = {}
  ) {
    return this.publishEvent({
      arrivalId,
      eventType: 'SERVICE_BOOKED',
      actor,
      action: `Service booked: ${serviceName}`,
      metadata: {
        ...metadata,
        serviceName
      }
    });
  }

  /**
   * Publish FDA submission event
   */
  async publishFDAEvent(arrivalId: string, actor: EventActor, metadata: Record<string, any> = {}) {
    return this.publishEvent({
      arrivalId,
      eventType: 'FDA_SUBMITTED',
      actor,
      action: 'Final Disbursement Account submitted for approval',
      metadata
    });
  }

  /**
   * Link related events
   */
  async linkRelatedEvents(eventId: string, relatedEventIds: string[]) {
    const event = await prisma.arrivalTimelineEvent.findUnique({
      where: { id: eventId },
      select: { relatedEvents: true }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const existingRelated = (event.relatedEvents as string[]) || [];
    const updatedRelated = Array.from(new Set([...existingRelated, ...relatedEventIds]));

    return prisma.arrivalTimelineEvent.update({
      where: { id: eventId },
      data: { relatedEvents: updatedRelated }
    });
  }

  /**
   * Add attachment to event
   */
  async addEventAttachment(eventId: string, fileUrl: string, fileName: string) {
    const event = await prisma.arrivalTimelineEvent.findUnique({
      where: { id: eventId },
      select: { attachments: true }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const existingAttachments = (event.attachments as string[]) || [];
    const newAttachment = JSON.stringify({ url: fileUrl, name: fileName, uploadedAt: new Date() });
    const updatedAttachments = [...existingAttachments, newAttachment];

    return prisma.arrivalTimelineEvent.update({
      where: { id: eventId },
      data: { attachments: updatedAttachments }
    });
  }

  /**
   * Calculate impact level based on event type and metadata
   */
  private calculateImpact(eventType: ArrivalEventType, metadata: Record<string, any>): EventImpact {
    // Critical events
    const criticalEvents: ArrivalEventType[] = [
      'DOCUMENT_OVERDUE',
      'DELAY_REPORTED'
    ];

    if (criticalEvents.includes(eventType)) {
      return 'CRITICAL';
    }

    // Important events
    const importantEvents: ArrivalEventType[] = [
      'ALERT_TRIGGERED',
      'MASTER_ALERTED',
      'ETA_CALCULATED',
      'ETA_UPDATED',
      'CONGESTION_DETECTED',
      'DOCUMENT_REQUIRED',
      'DOCUMENT_REJECTED',
      'ANCHORAGE_REACHED',
      'BERTH_ASSIGNED',
      'BERTHING_COMPLETE',
      'DEPARTURE'
    ];

    if (importantEvents.includes(eventType)) {
      return 'IMPORTANT';
    }

    // Check metadata for impact hints
    if (metadata.priority === 'CRITICAL' || metadata.severity === 'high') {
      return 'CRITICAL';
    }

    if (metadata.priority === 'HIGH' || metadata.severity === 'medium') {
      return 'IMPORTANT';
    }

    // Default to INFO
    return 'INFO';
  }

  /**
   * Check for duplicate events within last 5 minutes
   */
  private async checkDuplicate(
    arrivalId: string,
    eventType: ArrivalEventType,
    actor: EventActor,
    action: string
  ): Promise<boolean> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const duplicate = await prisma.arrivalTimelineEvent.findFirst({
      where: {
        arrivalId,
        eventType,
        actor,
        action,
        timestamp: {
          gte: fiveMinutesAgo
        }
      }
    });

    return duplicate !== null;
  }
}

// Export singleton instance
export const eventPublisher = new EventPublisherService();
