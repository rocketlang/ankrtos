/**
 * WhatsApp Reply Webhook
 *
 * Handles incoming WhatsApp replies to master alerts.
 * Can be configured with Twilio WhatsApp, WhatsApp Business API, or MCP tool.
 *
 * Webhook format similar to SMS but with WhatsApp-specific fields.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { replyParserService } from '../../services/alerts/reply-parser.service';
import { replyHandlerService } from '../../services/alerts/reply-handler.service';
import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

interface WhatsAppWebhook {
  From: string; // WhatsApp number (whatsapp:+1234567890)
  To: string;
  Body: string;
  MessageSid?: string;
  ProfileName?: string; // WhatsApp profile name
  NumMedia?: string;
  MediaUrl0?: string; // If media attached
}

export async function whatsappReplyWebhook(fastify: FastifyInstance) {
  /**
   * POST /webhooks/whatsapp-reply
   * Receive incoming WhatsApp replies
   */
  fastify.post('/webhooks/whatsapp-reply', async (
    request: FastifyRequest<{ Body: WhatsAppWebhook }>,
    reply: FastifyReply
  ) => {
    try {
      const { From, Body, ProfileName, NumMedia } = request.body;

      console.log(`Received WhatsApp reply from ${ProfileName || From}: ${Body}`);

      // Extract phone number from WhatsApp format (whatsapp:+1234567890)
      const phoneNumber = From.replace('whatsapp:', '');

      // Find most recent alert sent to this phone number
      const alert = await findRecentAlertByPhone(phoneNumber);

      if (!alert) {
        console.warn(`No recent alert found for WhatsApp ${phoneNumber}`);

        return reply.type('text/xml').code(200).send(`
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for your message. No active alert found. Please contact your port agent.</Message>
</Response>
        `.trim());
      }

      // Check if media was sent
      if (NumMedia && parseInt(NumMedia) > 0) {
        console.log('Media attachment detected, processing as document upload');
        // TODO: Handle document upload via WhatsApp
        // For now, just acknowledge
        return reply.type('text/xml').code(200).send(`
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>✓ Document received. Processing... Your port agent will review shortly.</Message>
</Response>
        `.trim());
      }

      // Parse text reply
      const parsed = replyParserService.parseReply(Body);

      console.log(`Parsed intent: ${parsed.intent} (confidence: ${parsed.confidence})`);

      // Handle reply
      const result = await replyHandlerService.handleReply(alert.id, parsed);

      console.log(`Reply handled: ${result.action}`);

      // Send confirmation via WhatsApp
      const confirmationMessage = getConfirmationMessage(parsed.intent, result);

      return reply.type('text/xml').code(200).send(`
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${confirmationMessage}</Message>
</Response>
      `.trim());

    } catch (error) {
      console.error('Error processing WhatsApp reply:', error);

      return reply.type('text/xml').code(200).send(`
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Error processing your message. Please contact your port agent directly.</Message>
</Response>
      `.trim());
    }
  });

  /**
   * POST /webhooks/whatsapp-status/:alertId
   * Receive WhatsApp delivery status updates
   */
  fastify.post('/webhooks/whatsapp-status/:alertId', async (
    request: FastifyRequest<{ Params: { alertId: string }; Body: any }>,
    reply: FastifyReply
  ) => {
    try {
      const { alertId } = request.params;
      const { MessageStatus, ErrorCode } = request.body;

      console.log(`WhatsApp status update for alert ${alertId}: ${MessageStatus}`);

      const updateData: any = {};

      switch (MessageStatus) {
        case 'delivered':
        case 'read':
          updateData.deliveredAt = new Date();
          if (MessageStatus === 'read') {
            updateData.readAt = new Date();
          }
          break;
        case 'failed':
        case 'undelivered':
          updateData.failedAt = new Date();
          updateData.failureReason = `WhatsApp delivery failed: ${ErrorCode || 'unknown'}`;
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
      console.error('Error processing WhatsApp status:', error);
      return reply.code(500).send({ error: 'Internal error' });
    }
  });

  /**
   * GET /webhooks/whatsapp-reply/health
   * Health check endpoint
   */
  fastify.get('/webhooks/whatsapp-reply/health', async (request, reply) => {
    return reply.code(200).send({
      status: 'healthy',
      service: 'whatsapp-reply-webhook',
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Find most recent alert sent to phone number
 */
async function findRecentAlertByPhone(phoneNumber: string): Promise<any> {
  const normalized = phoneNumber.replace(/[^\d]/g, '');

  const alert = await prisma.masterAlert.findFirst({
    where: {
      recipientPhone: {
        contains: normalized.slice(-10)
      },
      sentAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    },
    orderBy: {
      sentAt: 'desc'
    }
  });

  return alert;
}

/**
 * Get confirmation message for WhatsApp (supports emojis)
 */
function getConfirmationMessage(intent: string, result: any): string {
  switch (intent) {
    case 'READY':
      return `✅ *Documents Confirmed*\n\nYour documents have been marked as submitted. Your port agent has been notified.\n\nThank you! 🚢`;

    case 'DELAY':
      return result.stateChanged
        ? `⏰ *ETA Updated*\n\nYour new ETA has been recorded. Your port agent has been notified of the delay.`
        : `⏰ *Delay Noted*\n\nYour port agent will contact you shortly to update the ETA.`;

    case 'QUESTION':
      return `❓ *Question Forwarded*\n\nYour question has been sent to your port agent. They will respond as soon as possible.`;

    case 'CONFIRM':
      return `✅ *Acknowledged*\n\nThank you for confirming!`;

    case 'UNKNOWN':
      return `📨 *Message Received*\n\nYour message has been forwarded to your port agent for review.`;

    default:
      return `✅ *Reply Received*\n\nYour port agent has been notified.`;
  }
}
