/**
 * Alert Orchestrator Service
 *
 * Composes alert messages, selects delivery channels, and queues alerts for delivery.
 *
 * Responsibilities:
 * - Generate alert title and message based on trigger type
 * - Select appropriate delivery channels (email, SMS, WhatsApp, etc.)
 * - Determine alert priority
 * - Find master contact information
 * - Create MasterAlert record
 * - Queue alert for delivery via BullMQ
 */

import { PrismaClient } from '@prisma/client';
import type { VesselArrival, Vessel, Port, CrewMember } from '@prisma/client';
import { AlertType, AlertPriority, type TriggerCondition } from './alert-trigger.service';

const prisma = new PrismaClient();

export enum AlertChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  IN_APP = 'in_app'
}

export interface ComposedAlert {
  arrivalId: string;
  vesselId: string;
  alertType: AlertType;
  title: string;
  message: string;
  priority: AlertPriority;
  channels: AlertChannel[];
  recipientEmail?: string;
  recipientPhone?: string;
  metadata: Record<string, any>;
}

export class AlertOrchestratorService {
  /**
   * Orchestrate an alert from a trigger condition
   */
  async orchestrateAlert(trigger: TriggerCondition): Promise<ComposedAlert | null> {
    // Get arrival details
    const arrival = await prisma.vesselArrival.findUnique({
      where: { id: trigger.arrivalId },
      include: {
        vessel: true,
        port: true
      }
    });

    if (!arrival) {
      console.error(`Arrival not found: ${trigger.arrivalId}`);
      return null;
    }

    // Find master contact information
    const master = await this.findMasterContact(arrival.vesselId);

    if (!master || (!master.email && !master.phone)) {
      console.warn(`No master contact info for vessel ${arrival.vesselId}`);
      return null;
    }

    // Compose alert based on type
    let composedAlert: ComposedAlert;

    switch (trigger.type) {
      case AlertType.ARRIVAL_200NM:
        composedAlert = this.composeArrival200NMAlert(arrival, master, trigger.metadata);
        break;

      case AlertType.DOCUMENT_MISSING:
        composedAlert = this.composeDocumentMissingAlert(arrival, master, trigger.metadata);
        break;

      case AlertType.DEADLINE_APPROACHING:
        composedAlert = this.composeDeadlineAlert(arrival, master, trigger.metadata);
        break;

      case AlertType.CONGESTION_HIGH:
        composedAlert = this.composeCongestionAlert(arrival, master, trigger.metadata);
        break;

      case AlertType.ETA_CHANGED:
        composedAlert = this.composeETAChangeAlert(arrival, master, trigger.metadata);
        break;

      case AlertType.DA_COST_HIGH:
        composedAlert = this.composeDAHighAlert(arrival, master, trigger.metadata);
        break;

      default:
        console.warn(`Unknown alert type: ${trigger.type}`);
        return null;
    }

    // Select delivery channels based on priority and time
    composedAlert.channels = this.selectChannels(composedAlert.priority);

    return composedAlert;
  }

  /**
   * Compose alert for vessel entering 200 NM radius
   */
  composeArrival200NMAlert(
    arrival: VesselArrival & { vessel: Vessel; port: Port },
    master: CrewMember,
    metadata: Record<string, any>
  ): ComposedAlert {
    const hoursToETA = Math.round(
      (arrival.etaMostLikely.getTime() - Date.now()) / (60 * 60 * 1000)
    );

    const title = `${arrival.vessel.name} - Arrival Notification`;

    const message = `
🚢 ${arrival.vessel.name} - Pre-Arrival Advisory

📍 Destination: ${arrival.port.name} (${arrival.port.unlocode})
⏰ ETA: ${this.formatDateTime(arrival.etaMostLikely)} (${hoursToETA}h)
📏 Distance: ${Math.round(metadata.distance)} NM
🎯 Status: Approaching

You are now within 200 NM of your destination. Please prepare the required pre-arrival documents and confirm your ETA.

Reply READY when all documents are complete.

Your agent will contact you shortly with detailed arrival instructions.
    `.trim();

    return {
      arrivalId: arrival.id,
      vesselId: arrival.vesselId,
      alertType: AlertType.ARRIVAL_200NM,
      title,
      message,
      priority: AlertPriority.HIGH,
      channels: [],
      recipientEmail: master.email || undefined,
      recipientPhone: master.phone || undefined,
      metadata: {
        distance: metadata.distance,
        eta: arrival.etaMostLikely,
        hoursToETA
      }
    };
  }

  /**
   * Compose alert for missing critical documents
   */
  composeDocumentMissingAlert(
    arrival: VesselArrival & { vessel: Vessel; port: Port },
    master: CrewMember,
    metadata: Record<string, any>
  ): ComposedAlert {
    const documents = metadata.documents as string[];
    const documentList = documents.map(d => `• ${d.replace(/_/g, ' ')}`).join('\n');

    const title = `${arrival.vessel.name} - URGENT: Missing Documents`;

    const message = `
⚠️ ${arrival.vessel.name} - Action Required

📍 Port: ${arrival.port.name}
⏰ ETA: ${this.formatDateTime(arrival.etaMostLikely)} (${metadata.hoursToETA}h)
🚨 Status: ${metadata.missingCount} Critical Documents Missing

MISSING DOCUMENTS:
${documentList}

These documents are MANDATORY and must be submitted before arrival.

📋 Action Required:
1. Prepare the above documents
2. Submit via email or upload to portal
3. Reply READY when complete

Failure to submit may result in port entry delays or rejection.

Reply READY when documents are submitted.
    `.trim();

    return {
      arrivalId: arrival.id,
      vesselId: arrival.vesselId,
      alertType: AlertType.DOCUMENT_MISSING,
      title,
      message,
      priority: AlertPriority.CRITICAL,
      channels: [],
      recipientEmail: master.email || undefined,
      recipientPhone: master.phone || undefined,
      metadata: {
        missingCount: metadata.missingCount,
        documents: documents,
        hoursToETA: metadata.hoursToETA
      }
    };
  }

  /**
   * Compose alert for approaching document deadline
   */
  composeDeadlineAlert(
    arrival: VesselArrival & { vessel: Vessel; port: Port },
    master: CrewMember,
    metadata: Record<string, any>
  ): ComposedAlert {
    const documentType = metadata.documentType.replace(/_/g, ' ');
    const urgency = metadata.hoursRemaining <= 6 ? '🚨 URGENT' : '⏰ Reminder';

    const title = `${arrival.vessel.name} - ${urgency}: ${documentType} Due`;

    const message = `
${urgency}: Document Deadline Approaching

🚢 ${arrival.vessel.name}
📍 ${arrival.port.name}
📄 Document: ${documentType}
⏰ Due: ${this.formatDateTime(metadata.deadline)}
⏳ Time Remaining: ${metadata.hoursRemaining} hours

This document must be submitted within ${metadata.hoursRemaining} hours.

Reply READY when submitted.
    `.trim();

    return {
      arrivalId: arrival.id,
      vesselId: arrival.vesselId,
      alertType: AlertType.DEADLINE_APPROACHING,
      title,
      message,
      priority: metadata.hoursRemaining <= 6 ? AlertPriority.CRITICAL : AlertPriority.HIGH,
      channels: [],
      recipientEmail: master.email || undefined,
      recipientPhone: master.phone || undefined,
      metadata: {
        documentType: metadata.documentType,
        deadline: metadata.deadline,
        hoursRemaining: metadata.hoursRemaining
      }
    };
  }

  /**
   * Compose alert for high port congestion
   */
  composeCongestionAlert(
    arrival: VesselArrival & { vessel: Vessel; port: Port },
    master: CrewMember,
    metadata: Record<string, any>
  ): ComposedAlert {
    const title = `${arrival.vessel.name} - Port Congestion Alert`;

    const message = `
🔴 Port Congestion Alert

🚢 ${arrival.vessel.name}
📍 ${metadata.port}
⏰ ETA: ${this.formatDateTime(arrival.etaMostLikely)}
🚨 Congestion: HIGH

Current Status:
• Vessels Waiting: ${metadata.vesselsWaiting}
• Average Wait: ${Math.round(metadata.averageWait)} hours
• Port Status: ${metadata.readinessScore.toUpperCase()}

⚠️ Expect significant delays at anchorage.

Consider:
- Reducing speed to optimize arrival time
- Coordinating with agent for berth scheduling
- Preparing for extended wait time

Your agent will provide updates on berth availability.
    `.trim();

    return {
      arrivalId: arrival.id,
      vesselId: arrival.vesselId,
      alertType: AlertType.CONGESTION_HIGH,
      title,
      message,
      priority: AlertPriority.HIGH,
      channels: [],
      recipientEmail: master.email || undefined,
      recipientPhone: master.phone || undefined,
      metadata: {
        vesselsWaiting: metadata.vesselsWaiting,
        averageWait: metadata.averageWait,
        readinessScore: metadata.readinessScore
      }
    };
  }

  /**
   * Compose alert for significant ETA change
   */
  composeETAChangeAlert(
    arrival: VesselArrival & { vessel: Vessel; port: Port },
    master: CrewMember,
    metadata: Record<string, any>
  ): ComposedAlert {
    const direction = metadata.direction === 'delayed' ? 'Delayed' : 'Advanced';
    const icon = metadata.direction === 'delayed' ? '🔴' : '🟢';

    const title = `${arrival.vessel.name} - ETA ${direction}`;

    const message = `
${icon} ETA Update

🚢 ${arrival.vessel.name}
📍 ${arrival.port.name}
⏰ Previous ETA: ${this.formatDateTime(metadata.previousETA)}
⏰ New ETA: ${this.formatDateTime(metadata.currentETA)}
⏳ Change: ${metadata.hoursDifference} hours ${metadata.direction}

Your ETA has been updated by ${metadata.hoursDifference} hours.

${metadata.direction === 'delayed'
  ? '⚠️ This may affect document deadlines and berth scheduling. Your agent has been notified.'
  : '✅ Earlier arrival may allow for earlier berth assignment.'}

Please confirm your new ETA or reply DELAY if further changes expected.
    `.trim();

    return {
      arrivalId: arrival.id,
      vesselId: arrival.vesselId,
      alertType: AlertType.ETA_CHANGED,
      title,
      message,
      priority: AlertPriority.HIGH,
      channels: [],
      recipientEmail: master.email || undefined,
      recipientPhone: master.phone || undefined,
      metadata: {
        previousETA: metadata.previousETA,
        currentETA: metadata.currentETA,
        hoursDifference: metadata.hoursDifference,
        direction: metadata.direction
      }
    };
  }

  /**
   * Compose alert for high DA cost
   */
  composeDAHighAlert(
    arrival: VesselArrival & { vessel: Vessel; port: Port },
    master: CrewMember,
    metadata: Record<string, any>
  ): ComposedAlert {
    const title = `${arrival.vessel.name} - High Port Cost Alert`;

    const message = `
💰 Port Cost Advisory

🚢 ${arrival.vessel.name}
📍 ${arrival.port.name}
💵 Estimated DA: $${metadata.forecast.toLocaleString()}
📊 Port Average: $${metadata.average.toLocaleString()}
📈 Variance: +${metadata.percentageAbove}%

The estimated port disbursement account is ${metadata.percentageAbove}% higher than average for this port.

This may be due to:
- Port tariff changes
- Special services required
- Vessel size/type factors
- Seasonal pricing

Your agent will provide a detailed cost breakdown and confirm all charges.
    `.trim();

    return {
      arrivalId: arrival.id,
      vesselId: arrival.vesselId,
      alertType: AlertType.DA_COST_HIGH,
      title,
      message,
      priority: AlertPriority.MEDIUM,
      channels: [],
      recipientEmail: master.email || undefined,
      recipientPhone: master.phone || undefined,
      metadata: {
        forecast: metadata.forecast,
        average: metadata.average,
        percentageAbove: metadata.percentageAbove
      }
    };
  }

  /**
   * Select delivery channels based on alert priority and time of day
   */
  selectChannels(priority: AlertPriority): AlertChannel[] {
    const currentHour = new Date().getUTCHours();
    const isNightTime = currentHour < 6 || currentHour > 22; // 10 PM - 6 AM UTC

    switch (priority) {
      case AlertPriority.CRITICAL:
        // Critical: all channels, even at night
        return [AlertChannel.EMAIL, AlertChannel.SMS, AlertChannel.WHATSAPP];

      case AlertPriority.HIGH:
        // High: SMS + Email during day, Email only at night
        return isNightTime
          ? [AlertChannel.EMAIL]
          : [AlertChannel.EMAIL, AlertChannel.SMS];

      case AlertPriority.MEDIUM:
        // Medium: Email + WhatsApp (less intrusive)
        return [AlertChannel.EMAIL, AlertChannel.WHATSAPP];

      case AlertPriority.LOW:
        // Low: Email only
        return [AlertChannel.EMAIL];

      default:
        return [AlertChannel.EMAIL];
    }
  }

  /**
   * Find master contact information for a vessel
   */
  async findMasterContact(vesselId: string): Promise<CrewMember | null> {
    // Find currently assigned master
    const master = await prisma.crewMember.findFirst({
      where: {
        rank: 'master',
        assignments: {
          some: {
            vesselId,
            signOffDate: null // Currently assigned
          }
        }
      }
    });

    return master;
  }

  /**
   * Create MasterAlert record in database
   */
  async createAlertRecord(alert: ComposedAlert): Promise<string> {
    const masterAlert = await prisma.masterAlert.create({
      data: {
        arrivalId: alert.arrivalId,
        vesselId: alert.vesselId,
        alertType: alert.alertType,
        title: alert.title,
        message: alert.message,
        priority: alert.priority,
        channels: alert.channels,
        recipientEmail: alert.recipientEmail,
        recipientPhone: alert.recipientPhone,
        metadata: alert.metadata
      }
    });

    return masterAlert.id;
  }

  /**
   * Format DateTime for display
   */
  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  }
}

export const alertOrchestratorService = new AlertOrchestratorService();
