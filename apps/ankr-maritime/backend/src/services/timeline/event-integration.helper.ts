/**
 * Event Integration Helper
 *
 * Helper utilities for integrating timeline event publishing into existing services.
 * Provides convenience wrappers and integration patterns.
 */

import { eventPublisher } from './event-publisher.service.js';
import { EventActor, ArrivalEventType } from '@prisma/client';

/**
 * Integration helper for alert system (Phase 3)
 */
export class AlertEventIntegration {
  /**
   * Publish alert triggered event
   */
  static async onAlertTriggered(
    arrivalId: string,
    alertId: string,
    alertType: string,
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishAlertEvent({
      arrivalId,
      alertId,
      alertType,
      priority,
      actor: 'SYSTEM',
      status: 'triggered',
      metadata
    });
  }

  /**
   * Publish master alerted event
   */
  static async onMasterAlerted(
    arrivalId: string,
    alertId: string,
    channels: string[],
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishAlertEvent({
      arrivalId,
      alertId,
      alertType: 'MASTER_NOTIFICATION',
      priority: 'HIGH',
      actor: 'SYSTEM',
      status: 'alerted',
      metadata: {
        ...metadata,
        channels,
        sentAt: new Date()
      }
    });
  }

  /**
   * Publish alert acknowledged event
   */
  static async onAlertAcknowledged(
    arrivalId: string,
    alertId: string,
    reply: string,
    intent: string,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishAlertEvent({
      arrivalId,
      alertId,
      alertType: 'MASTER_ACKNOWLEDGMENT',
      priority: 'MEDIUM',
      actor: 'MASTER',
      status: 'acknowledged',
      metadata: {
        ...metadata,
        reply,
        intent,
        acknowledgedAt: new Date()
      }
    });
  }
}

/**
 * Integration helper for document workflows
 */
export class DocumentEventIntegration {
  /**
   * Publish document required event
   */
  static async onDocumentRequired(
    arrivalId: string,
    documentType: string,
    documentName: string,
    deadline: Date,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishDocumentEvent({
      arrivalId,
      documentType,
      documentName,
      actor: 'SYSTEM',
      status: 'required',
      metadata: {
        ...metadata,
        deadline: deadline.toISOString(),
        requiredAt: new Date().toISOString()
      }
    });
  }

  /**
   * Publish document uploaded event
   */
  static async onDocumentUploaded(
    arrivalId: string,
    documentType: string,
    documentName: string,
    uploadedBy: EventActor,
    fileUrl: string,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishDocumentEvent({
      arrivalId,
      documentType,
      documentName,
      actor: uploadedBy,
      status: 'uploaded',
      metadata: {
        ...metadata,
        fileUrl,
        uploadedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Publish document submitted event
   */
  static async onDocumentSubmitted(
    arrivalId: string,
    documentType: string,
    documentName: string,
    submittedBy: EventActor,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishDocumentEvent({
      arrivalId,
      documentType,
      documentName,
      actor: submittedBy,
      status: 'submitted',
      metadata: {
        ...metadata,
        submittedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Publish document approved event
   */
  static async onDocumentApproved(
    arrivalId: string,
    documentType: string,
    documentName: string,
    approvedBy: EventActor,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishDocumentEvent({
      arrivalId,
      documentType,
      documentName,
      actor: approvedBy,
      status: 'approved',
      metadata: {
        ...metadata,
        approvedAt: new Date().toISOString(),
        approvedBy
      }
    });
  }

  /**
   * Publish document rejected event
   */
  static async onDocumentRejected(
    arrivalId: string,
    documentType: string,
    documentName: string,
    rejectedBy: EventActor,
    reason: string,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishDocumentEvent({
      arrivalId,
      documentType,
      documentName,
      actor: rejectedBy,
      status: 'rejected',
      metadata: {
        ...metadata,
        rejectedAt: new Date().toISOString(),
        rejectedBy,
        reason
      }
    });
  }

  /**
   * Publish document overdue event
   */
  static async onDocumentOverdue(
    arrivalId: string,
    documentType: string,
    documentName: string,
    deadline: Date,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishDocumentEvent({
      arrivalId,
      documentType,
      documentName,
      actor: 'SYSTEM',
      status: 'overdue',
      metadata: {
        ...metadata,
        deadline: deadline.toISOString(),
        overdueAt: new Date().toISOString(),
        overdueDays: Math.floor((Date.now() - deadline.getTime()) / (1000 * 60 * 60 * 24))
      }
    });
  }
}

/**
 * Integration helper for arrival intelligence
 */
export class IntelligenceEventIntegration {
  /**
   * Publish arrival detected event
   */
  static async onArrivalDetected(
    arrivalId: string,
    distance: number,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishEvent({
      arrivalId,
      eventType: 'ARRIVAL_DETECTED',
      actor: 'SYSTEM',
      action: `Vessel detected ${Math.round(distance)} NM from port`,
      metadata: {
        ...metadata,
        distance,
        detectedAt: new Date()
      }
    });
  }

  /**
   * Publish ETA calculated event
   */
  static async onETACalculated(
    arrivalId: string,
    eta: Date,
    confidence: number,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishIntelligenceEvent({
      arrivalId,
      type: 'eta_calculated',
      metadata: {
        ...metadata,
        confidence
      },
      newValue: eta.toISOString()
    });
  }

  /**
   * Publish ETA updated event
   */
  static async onETAUpdated(
    arrivalId: string,
    previousETA: Date,
    newETA: Date,
    reason: string,
    metadata: Record<string, any> = {}
  ) {
    const hoursDiff = Math.abs(newETA.getTime() - previousETA.getTime()) / (1000 * 60 * 60);

    return eventPublisher.publishIntelligenceEvent({
      arrivalId,
      type: 'eta_updated',
      metadata: {
        ...metadata,
        reason,
        hoursDifference: Math.round(hoursDiff * 10) / 10
      },
      previousValue: previousETA.toISOString(),
      newValue: newETA.toISOString()
    });
  }

  /**
   * Publish intelligence generated event
   */
  static async onIntelligenceGenerated(
    arrivalId: string,
    complianceScore: number,
    daForecast: number,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishIntelligenceEvent({
      arrivalId,
      type: 'generated',
      metadata: {
        ...metadata,
        complianceScore,
        daForecast,
        generatedAt: new Date()
      }
    });
  }

  /**
   * Publish congestion detected event
   */
  static async onCongestionDetected(
    arrivalId: string,
    congestionLevel: 'GREEN' | 'YELLOW' | 'RED',
    vesselsWaiting: number,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishIntelligenceEvent({
      arrivalId,
      type: 'congestion_detected',
      metadata: {
        ...metadata,
        congestionLevel,
        vesselsWaiting,
        detectedAt: new Date()
      }
    });
  }

  /**
   * Publish distance updated event
   */
  static async onDistanceUpdated(
    arrivalId: string,
    previousDistance: number,
    newDistance: number,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishIntelligenceEvent({
      arrivalId,
      type: 'distance_updated',
      metadata: {
        ...metadata,
        updatedAt: new Date()
      },
      previousValue: `${Math.round(previousDistance)} NM`,
      newValue: `${Math.round(newDistance)} NM`
    });
  }
}

/**
 * Integration helper for operational events
 */
export class OperationalEventIntegration {
  /**
   * Publish status updated event
   */
  static async onStatusUpdated(
    arrivalId: string,
    previousStatus: string,
    newStatus: string,
    updatedBy: EventActor,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishOperationalEvent({
      arrivalId,
      type: 'status_updated',
      actor: updatedBy,
      action: `Status changed from ${previousStatus} to ${newStatus}`,
      metadata: {
        ...metadata,
        previousStatus,
        newStatus,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Publish delay reported event
   */
  static async onDelayReported(
    arrivalId: string,
    delayHours: number,
    reason: string,
    reportedBy: EventActor,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishOperationalEvent({
      arrivalId,
      type: 'delay_reported',
      actor: reportedBy,
      action: `Delay reported: ${delayHours}h - ${reason}`,
      metadata: {
        ...metadata,
        delayHours,
        reason,
        reportedAt: new Date()
      }
    });
  }

  /**
   * Publish anchorage reached event
   */
  static async onAnchorageReached(
    arrivalId: string,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishOperationalEvent({
      arrivalId,
      type: 'anchorage',
      actor: 'SYSTEM',
      action: 'Vessel reached anchorage area',
      metadata: {
        ...metadata,
        reachedAt: new Date()
      }
    });
  }

  /**
   * Publish berth assigned event
   */
  static async onBerthAssigned(
    arrivalId: string,
    berthName: string,
    assignedBy: EventActor,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishOperationalEvent({
      arrivalId,
      type: 'berth_assigned',
      actor: assignedBy,
      action: `Berth assigned: ${berthName}`,
      metadata: {
        ...metadata,
        berthName,
        assignedAt: new Date()
      }
    });
  }

  /**
   * Publish berthing complete event
   */
  static async onBerthingComplete(
    arrivalId: string,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishOperationalEvent({
      arrivalId,
      type: 'berthing_complete',
      actor: 'AGENT',
      action: 'Vessel berthing completed',
      metadata: {
        ...metadata,
        berthedAt: new Date()
      }
    });
  }

  /**
   * Publish departure event
   */
  static async onDeparture(
    arrivalId: string,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishOperationalEvent({
      arrivalId,
      type: 'departure',
      actor: 'SYSTEM',
      action: 'Vessel departed from port',
      metadata: {
        ...metadata,
        departedAt: new Date()
      }
    });
  }

  /**
   * Publish PDA generated event
   */
  static async onPDAGenerated(
    arrivalId: string,
    totalCost: number,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishPDAEvent(arrivalId, {
      ...metadata,
      totalCost,
      generatedAt: new Date()
    });
  }

  /**
   * Publish service booking event
   */
  static async onServiceBooked(
    arrivalId: string,
    serviceName: string,
    bookedBy: EventActor,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishServiceBookingEvent(
      arrivalId,
      serviceName,
      bookedBy,
      {
        ...metadata,
        bookedAt: new Date()
      }
    );
  }

  /**
   * Publish FDA submitted event
   */
  static async onFDASubmitted(
    arrivalId: string,
    submittedBy: EventActor,
    totalAmount: number,
    metadata: Record<string, any> = {}
  ) {
    return eventPublisher.publishFDAEvent(arrivalId, submittedBy, {
      ...metadata,
      totalAmount,
      submittedAt: new Date()
    });
  }
}

/**
 * Example integration patterns
 */
export const EventIntegrationExamples = {
  /**
   * Example: Alert system integration
   */
  alertSystemExample: async () => {
    // In alert-trigger.service.ts, after creating an alert:
    const arrivalId = 'arr_123';
    const alertId = 'alert_456';

    await AlertEventIntegration.onAlertTriggered(
      arrivalId,
      alertId,
      'DOCUMENT_DEADLINE',
      'HIGH',
      { missingDocuments: ['Crew List', 'Last Port Clearance'] }
    );
  },

  /**
   * Example: Document upload integration
   */
  documentUploadExample: async () => {
    // In document upload handler:
    const arrivalId = 'arr_123';

    await DocumentEventIntegration.onDocumentUploaded(
      arrivalId,
      'CREW_LIST',
      'crew-list-2026.pdf',
      'MASTER',
      'https://cdn.example.com/docs/crew-list.pdf',
      { fileSize: 2048576, format: 'PDF' }
    );
  },

  /**
   * Example: ETA update integration
   */
  etaUpdateExample: async () => {
    // In intelligence engine, when ETA changes:
    const arrivalId = 'arr_123';
    const previousETA = new Date('2026-02-10T14:00:00Z');
    const newETA = new Date('2026-02-10T18:00:00Z');

    await IntelligenceEventIntegration.onETAUpdated(
      arrivalId,
      previousETA,
      newETA,
      'Weather delay - heavy seas',
      { weatherCondition: 'ROUGH_SEAS', beaufortScale: 7 }
    );
  }
};
