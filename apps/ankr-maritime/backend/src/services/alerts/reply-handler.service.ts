/**
 * Reply Handler Service
 *
 * Executes automated actions based on parsed master replies.
 *
 * Actions by Intent:
 * - READY: Mark documents as submitted, create timeline event, notify agent
 * - DELAY: Adjust ETA, create timeline event, notify agent
 * - QUESTION: Forward to agent inbox, create notification
 * - CONFIRM: Log acknowledgment, no action needed
 * - UNKNOWN: Forward to agent for manual review
 */

import { PrismaClient } from '@prisma/client';
import { ReplyIntent, type ParsedReply } from './reply-parser.service';

const prisma = new PrismaClient();

export interface ReplyHandlerResult {
  success: boolean;
  action: string;
  message: string;
  agentNotified: boolean;
  stateChanged: boolean;
}

export class ReplyHandlerService {
  /**
   * Handle parsed reply and execute appropriate action
   */
  async handleReply(
    alertId: string,
    parsed: ParsedReply
  ): Promise<ReplyHandlerResult> {
    // Update alert with reply info
    await this.updateAlertWithReply(alertId, parsed);

    // Execute action based on intent
    switch (parsed.intent) {
      case ReplyIntent.READY:
        return await this.handleReadyReply(alertId, parsed);

      case ReplyIntent.DELAY:
        return await this.handleDelayReply(alertId, parsed);

      case ReplyIntent.QUESTION:
        return await this.handleQuestionReply(alertId, parsed);

      case ReplyIntent.CONFIRM:
        return await this.handleConfirmReply(alertId, parsed);

      case ReplyIntent.UNKNOWN:
        return await this.handleUnknownReply(alertId, parsed);

      default:
        return {
          success: false,
          action: 'UNKNOWN_INTENT',
          message: 'Unknown intent, forwarded to agent',
          agentNotified: true,
          stateChanged: false
        };
    }
  }

  /**
   * Handle READY reply - Mark documents as submitted
   */
  private async handleReadyReply(
    alertId: string,
    parsed: ParsedReply
  ): Promise<ReplyHandlerResult> {
    try {
      // Get alert and arrival info
      const alert = await prisma.masterAlert.findUnique({
        where: { id: alertId },
        include: {
          arrival: {
            include: {
              documentStatuses: {
                where: {
                  status: {
                    in: ['NOT_STARTED', 'IN_PROGRESS']
                  }
                }
              }
            }
          }
        }
      });

      if (!alert || !alert.arrival) {
        throw new Error('Alert or arrival not found');
      }

      // Mark pending documents as SUBMITTED
      const documentsToUpdate = alert.arrival.documentStatuses;

      if (documentsToUpdate.length > 0) {
        await prisma.documentStatus.updateMany({
          where: {
            id: {
              in: documentsToUpdate.map(d => d.id)
            }
          },
          data: {
            status: 'SUBMITTED',
            submittedAt: new Date(),
            submittedBy: 'master' // Could be master user ID if available
          }
        });
      }

      // Create timeline event
      await prisma.arrivalTimelineEvent.create({
        data: {
          arrivalId: alert.arrivalId,
          timestamp: new Date(),
          eventType: 'DOCUMENTS_SUBMITTED_VIA_ALERT',
          actor: 'MASTER',
          action: `Master replied READY: ${documentsToUpdate.length} documents submitted`,
          metadata: {
            alertId,
            parsedReply: parsed,
            documentsCount: documentsToUpdate.length
          },
          impact: 'IMPORTANT'
        }
      });

      // Update alert action taken
      await prisma.masterAlert.update({
        where: { id: alertId },
        data: {
          acknowledgedAt: new Date(),
          actionTaken: `Documents marked as SUBMITTED (${documentsToUpdate.length} docs)`
        }
      });

      // Notify agent via in-app notification
      await this.notifyAgent(alert.arrivalId, {
        type: 'MASTER_READY',
        message: `Master confirmed ${documentsToUpdate.length} documents submitted`,
        alertId,
        priority: 'MEDIUM'
      });

      return {
        success: true,
        action: 'DOCUMENTS_SUBMITTED',
        message: `Marked ${documentsToUpdate.length} documents as submitted`,
        agentNotified: true,
        stateChanged: true
      };
    } catch (error) {
      console.error('Error handling READY reply:', error);
      return {
        success: false,
        action: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        agentNotified: false,
        stateChanged: false
      };
    }
  }

  /**
   * Handle DELAY reply - Adjust ETA
   */
  private async handleDelayReply(
    alertId: string,
    parsed: ParsedReply
  ): Promise<ReplyHandlerResult> {
    try {
      const alert = await prisma.masterAlert.findUnique({
        where: { id: alertId },
        include: {
          arrival: true
        }
      });

      if (!alert || !alert.arrival) {
        throw new Error('Alert or arrival not found');
      }

      // Calculate new ETA if hours provided
      let newETA = alert.arrival.etaMostLikely;
      if (parsed.entities.delayHours) {
        newETA = new Date(
          newETA.getTime() + parsed.entities.delayHours * 60 * 60 * 1000
        );

        // Update arrival ETA
        await prisma.vesselArrival.update({
          where: { id: alert.arrivalId },
          data: {
            etaMostLikely: newETA,
            etaWorstCase: new Date(newETA.getTime() + 6 * 60 * 60 * 1000), // +6h buffer
            etaFactors: [
              ...(alert.arrival.etaFactors || []),
              'master_reported_delay'
            ]
          }
        });
      }

      // Create timeline event
      await prisma.arrivalTimelineEvent.create({
        data: {
          arrivalId: alert.arrivalId,
          timestamp: new Date(),
          eventType: 'DELAY_REPORTED',
          actor: 'MASTER',
          action: parsed.entities.delayHours
            ? `Master reported ${parsed.entities.delayHours}h delay`
            : `Master reported delay: ${parsed.entities.delayReason || 'unspecified'}`,
          metadata: {
            alertId,
            parsedReply: parsed,
            oldETA: alert.arrival.etaMostLikely,
            newETA: newETA,
            delayHours: parsed.entities.delayHours,
            reason: parsed.entities.delayReason
          },
          impact: 'CRITICAL'
        }
      });

      // Update alert
      await prisma.masterAlert.update({
        where: { id: alertId },
        data: {
          acknowledgedAt: new Date(),
          actionTaken: parsed.entities.delayHours
            ? `ETA adjusted by +${parsed.entities.delayHours}h`
            : 'Delay reported, ETA update needed'
        }
      });

      // Notify agent (high priority)
      await this.notifyAgent(alert.arrivalId, {
        type: 'MASTER_DELAY',
        message: parsed.entities.delayHours
          ? `Master reported ${parsed.entities.delayHours}h delay. ETA updated.`
          : `Master reported delay: ${parsed.entities.delayReason || 'reason unknown'}. Please update ETA.`,
        alertId,
        priority: 'HIGH'
      });

      return {
        success: true,
        action: 'ETA_ADJUSTED',
        message: parsed.entities.delayHours
          ? `ETA delayed by ${parsed.entities.delayHours} hours`
          : 'Delay reported, agent notified',
        agentNotified: true,
        stateChanged: !!parsed.entities.delayHours
      };
    } catch (error) {
      console.error('Error handling DELAY reply:', error);
      return {
        success: false,
        action: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        agentNotified: false,
        stateChanged: false
      };
    }
  }

  /**
   * Handle QUESTION reply - Forward to agent
   */
  private async handleQuestionReply(
    alertId: string,
    parsed: ParsedReply
  ): Promise<ReplyHandlerResult> {
    try {
      const alert = await prisma.masterAlert.findUnique({
        where: { id: alertId },
        include: { arrival: true }
      });

      if (!alert) {
        throw new Error('Alert not found');
      }

      // Create timeline event
      await prisma.arrivalTimelineEvent.create({
        data: {
          arrivalId: alert.arrivalId,
          timestamp: new Date(),
          eventType: 'MASTER_QUESTION',
          actor: 'MASTER',
          action: `Master has a question: ${parsed.entities.question || parsed.text}`,
          metadata: {
            alertId,
            parsedReply: parsed,
            question: parsed.entities.question || parsed.text
          },
          impact: 'IMPORTANT'
        }
      });

      // Update alert
      await prisma.masterAlert.update({
        where: { id: alertId },
        data: {
          acknowledgedAt: new Date(),
          actionTaken: 'Question forwarded to agent'
        }
      });

      // Notify agent (requires response)
      await this.notifyAgent(alert.arrivalId, {
        type: 'MASTER_QUESTION',
        message: `Master question: ${parsed.entities.question || parsed.text}`,
        alertId,
        priority: 'HIGH',
        requiresResponse: true
      });

      return {
        success: true,
        action: 'QUESTION_FORWARDED',
        message: 'Question forwarded to agent',
        agentNotified: true,
        stateChanged: false
      };
    } catch (error) {
      console.error('Error handling QUESTION reply:', error);
      return {
        success: false,
        action: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        agentNotified: false,
        stateChanged: false
      };
    }
  }

  /**
   * Handle CONFIRM reply - Log acknowledgment
   */
  private async handleConfirmReply(
    alertId: string,
    parsed: ParsedReply
  ): Promise<ReplyHandlerResult> {
    try {
      // Simply log acknowledgment
      await prisma.masterAlert.update({
        where: { id: alertId },
        data: {
          acknowledgedAt: new Date(),
          actionTaken: 'Alert acknowledged by master'
        }
      });

      return {
        success: true,
        action: 'ACKNOWLEDGED',
        message: 'Alert acknowledged',
        agentNotified: false,
        stateChanged: false
      };
    } catch (error) {
      return {
        success: false,
        action: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        agentNotified: false,
        stateChanged: false
      };
    }
  }

  /**
   * Handle UNKNOWN reply - Forward to agent for review
   */
  private async handleUnknownReply(
    alertId: string,
    parsed: ParsedReply
  ): Promise<ReplyHandlerResult> {
    try {
      const alert = await prisma.masterAlert.findUnique({
        where: { id: alertId },
        include: { arrival: true }
      });

      if (!alert) {
        throw new Error('Alert not found');
      }

      // Update alert
      await prisma.masterAlert.update({
        where: { id: alertId },
        data: {
          repliedAt: new Date(),
          actionTaken: 'Reply forwarded to agent for manual review'
        }
      });

      // Notify agent to review
      await this.notifyAgent(alert.arrivalId, {
        type: 'MASTER_REPLY_UNKNOWN',
        message: `Master reply needs review: "${parsed.text}"`,
        alertId,
        priority: 'MEDIUM',
        requiresResponse: true
      });

      return {
        success: true,
        action: 'FORWARDED_FOR_REVIEW',
        message: 'Reply forwarded to agent for manual review',
        agentNotified: true,
        stateChanged: false
      };
    } catch (error) {
      return {
        success: false,
        action: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        agentNotified: false,
        stateChanged: false
      };
    }
  }

  /**
   * Update alert record with reply information
   */
  private async updateAlertWithReply(
    alertId: string,
    parsed: ParsedReply
  ): Promise<void> {
    await prisma.masterAlert.update({
      where: { id: alertId },
      data: {
        repliedAt: new Date(),
        reply: parsed.rawText,
        replyParsed: {
          intent: parsed.intent,
          confidence: parsed.confidence,
          entities: parsed.entities,
          language: parsed.language
        }
      }
    });
  }

  /**
   * Notify agent via in-app notification
   */
  private async notifyAgent(
    arrivalId: string,
    notification: {
      type: string;
      message: string;
      alertId: string;
      priority: string;
      requiresResponse?: boolean;
    }
  ): Promise<void> {
    // This would publish to GraphQL subscription or create in-app notification
    // For now, just log
    console.log(`Agent notification for arrival ${arrivalId}:`, notification);

    // TODO: Implement actual notification system
    // await pubsub.publish('AGENT_NOTIFICATION', {
    //   arrivalId,
    //   ...notification
    // });
  }
}

export const replyHandlerService = new ReplyHandlerService();
