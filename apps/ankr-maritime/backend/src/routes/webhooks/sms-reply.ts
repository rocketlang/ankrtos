/**
 * SMS Reply Webhook
 *
 * Handles incoming SMS replies to master alerts via Twilio.
 *
 * Twilio webhook format:
 * POST /webhooks/sms-reply
 * - From: sender phone number
 * - Body: SMS text
 * - MessageSid: Twilio message ID
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { replyParserService } from '../../services/alerts/reply-parser.service';
import { replyHandlerService } from '../../services/alerts/reply-handler.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TwilioSMSWebhook {
  From: string; // Phone number
  To: string; // Mari8X phone number
  Body: string; // SMS text
  MessageSid: string; // Twilio message ID
  AccountSid?: string;
  NumMedia?: string;
}

export async function smsReplyWebhook(fastify: FastifyInstance) {
  /**
   * POST /webhooks/sms-reply
   * Receive incoming SMS replies from Twilio
   */
  fastify.post('/webhooks/sms-reply', async (
    request: FastifyRequest<{ Body: TwilioSMSWebhook }>,
    reply: FastifyReply
  ) => {
    try {
      const { From, Body, MessageSid } = request.body;

      console.log(`Received SMS reply from ${From}: ${Body}`);

      // Find most recent alert sent to this phone number
      const alert = await findRecentAlertByPhone(From);

      if (!alert) {
        console.warn(`No recent alert found for phone ${From}`);

        // Send TwiML response
        return reply.type('text/xml').code(200).send(`
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for your reply. No active alert found for this number. Please contact your port agent directly.</Message>
</Response>
        `.trim());
      }

      // Parse reply
      const parsed = replyParserService.parseReply(Body);

      console.log(`Parsed intent: ${parsed.intent} (confidence: ${parsed.confidence})`);

      // Handle reply
      const result = await replyHandlerService.handleReply(alert.id, parsed);

      console.log(`Reply handled: ${result.action}`);

      // Send confirmation SMS via TwiML
      const confirmationMessage = getConfirmationMessage(parsed.intent, result);

      return reply.type('text/xml').code(200).send(`
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${confirmationMessage}</Message>
</Response>
      `.trim());

    } catch (error) {
      console.error('Error processing SMS reply:', error);

      // Send error response
      return reply.type('text/xml').code(200).send(`
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Error processing your reply. Please contact your port agent directly.</Message>
</Response>
      `.trim());
    }
  });

  /**
   * POST /webhooks/sms-status/:alertId
   * Receive SMS delivery status updates from Twilio
   */
  fastify.post('/webhooks/sms-status/:alertId', async (
    request: FastifyRequest<{ Params: { alertId: string }; Body: any }>,
    reply: FastifyReply
  ) => {
    try {
      const { alertId } = request.params;
      const { MessageStatus, ErrorCode } = request.body;

      console.log(`SMS status update for alert ${alertId}: ${MessageStatus}`);

      // Update alert delivery status
      const updateData: any = {};

      switch (MessageStatus) {
        case 'delivered':
          updateData.deliveredAt = new Date();
          break;
        case 'failed':
        case 'undelivered':
          updateData.failedAt = new Date();
          updateData.failureReason = `SMS delivery failed: ${ErrorCode || 'unknown'}`;
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.masterAlert.update({
          where: { id: alertId },
          data: updateData
        });
      }

      return reply.code(200).send({ status: 'received' });
    } catch (error) {
      console.error('Error processing SMS status:', error);
      return reply.code(500).send({ error: 'Internal error' });
    }
  });

  /**
   * GET /webhooks/sms-reply/health
   * Health check endpoint
   */
  fastify.get('/webhooks/sms-reply/health', async (request, reply) => {
    return reply.code(200).send({
      status: 'healthy',
      service: 'sms-reply-webhook',
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Find most recent alert sent to phone number
 */
async function findRecentAlertByPhone(phoneNumber: string): Promise<any> {
  // Normalize phone number (remove +, spaces, etc.)
  const normalized = phoneNumber.replace(/[^\d]/g, '');

  // Find most recent alert sent to this number in last 7 days
  const alert = await prisma.masterAlert.findFirst({
    where: {
      recipientPhone: {
        contains: normalized.slice(-10) // Match last 10 digits
      },
      sentAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    orderBy: {
      sentAt: 'desc'
    }
  });

  return alert;
}

/**
 * Get confirmation message based on intent and result
 */
function getConfirmationMessage(intent: string, result: any): string {
  switch (intent) {
    case 'READY':
      return `✓ Documents confirmed as submitted. Your port agent has been notified. Thank you!`;

    case 'DELAY':
      return result.stateChanged
        ? `✓ ETA updated. Your port agent has been notified of the delay.`
        : `✓ Delay noted. Your port agent will contact you to update ETA.`;

    case 'QUESTION':
      return `✓ Your question has been forwarded to your port agent. They will respond shortly.`;

    case 'CONFIRM':
      return `✓ Acknowledged. Thank you for confirming.`;

    case 'UNKNOWN':
      return `✓ Your message has been forwarded to your port agent for review.`;

    default:
      return `✓ Reply received. Your port agent has been notified.`;
  }
}
