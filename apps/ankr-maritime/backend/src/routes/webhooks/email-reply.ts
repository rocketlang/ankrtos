/**
 * Email Reply Webhook
 *
 * Handles incoming email replies to master alerts.
 * Typically configured with email service (Mailgun, SendGrid, etc.)
 *
 * Mailgun webhook format:
 * POST /webhooks/email-reply
 * - sender: reply email
 * - stripped-text: clean reply text
 * - In-Reply-To: original message ID
 * - References: thread references
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { replyParserService } from '../../services/alerts/reply-parser.service';
import { replyHandlerService } from '../../services/alerts/reply-handler.service';
import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

interface EmailWebhookBody {
  sender: string;
  'stripped-text': string;
  subject: string;
  'In-Reply-To'?: string;
  References?: string;
  // Mailgun specific
  'message-headers'?: string;
  timestamp?: string;
}

export async function emailReplyWebhook(fastify: FastifyInstance) {
  /**
   * POST /webhooks/email-reply
   * Receive incoming email replies
   */
  fastify.post('/webhooks/email-reply', async (
    request: FastifyRequest<{ Body: EmailWebhookBody }>,
    reply: FastifyReply
  ) => {
    try {
      const {
        sender,
        'stripped-text': replyText,
        subject,
        'In-Reply-To': inReplyTo,
        References: references
      } = request.body;

      console.log(`Received email reply from ${sender}`);

      // Extract alert ID from subject or headers
      const alertId = extractAlertId(subject, inReplyTo, references);

      if (!alertId) {
        console.warn('Could not extract alert ID from email');
        return reply.code(200).send({ status: 'ignored', reason: 'No alert ID found' });
      }

      // Verify alert exists
      const alert = await prisma.masterAlert.findUnique({
        where: { id: alertId }
      });

      if (!alert) {
        console.warn(`Alert not found: ${alertId}`);
        return reply.code(200).send({ status: 'ignored', reason: 'Alert not found' });
      }

      // Verify sender matches recipient
      if (alert.recipientEmail && !sender.toLowerCase().includes(alert.recipientEmail.toLowerCase())) {
        console.warn(`Sender ${sender} does not match alert recipient ${alert.recipientEmail}`);
        // Still process, but log warning
      }

      // Parse reply
      const parsed = replyParserService.parseReply(replyText);

      console.log(`Parsed intent: ${parsed.intent} (confidence: ${parsed.confidence})`);

      // Handle reply
      const result = await replyHandlerService.handleReply(alertId, parsed);

      console.log(`Reply handled: ${result.action}`);

      return reply.code(200).send({
        status: 'processed',
        alertId,
        intent: parsed.intent,
        confidence: parsed.confidence,
        action: result.action,
        message: result.message
      });

    } catch (error) {
      console.error('Error processing email reply:', error);
      return reply.code(500).send({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /webhooks/email-reply/health
   * Health check endpoint
   */
  fastify.get('/webhooks/email-reply/health', async (request, reply) => {
    return reply.code(200).send({
      status: 'healthy',
      service: 'email-reply-webhook',
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Extract alert ID from email headers
 */
function extractAlertId(
  subject: string,
  inReplyTo?: string,
  references?: string
): string | null {
  // Try to extract from subject (e.g., "Re: Alert abc123")
  const subjectMatch = subject.match(/Alert ID:\s*([a-zA-Z0-9_-]+)/i);
  if (subjectMatch) {
    return subjectMatch[1];
  }

  // Try to extract from In-Reply-To header
  if (inReplyTo) {
    const headerMatch = inReplyTo.match(/alert-([a-zA-Z0-9_-]+)@/);
    if (headerMatch) {
      return headerMatch[1];
    }
  }

  // Try to extract from References header
  if (references) {
    const headerMatch = references.match(/alert-([a-zA-Z0-9_-]+)@/);
    if (headerMatch) {
      return headerMatch[1];
    }
  }

  return null;
}
