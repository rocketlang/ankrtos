/**
 * WhatsApp Business API Webhook
 * Handles incoming messages and status updates from WhatsApp Business API
 *
 * @package @ankr/universal-ai-assistant
 * @version 1.0.0
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { whatsappService } from '../../services/messaging/whatsapp.service.js';
import { channelRouterService } from '../../services/messaging/channel-router.service.js';
import { messageNormalizerService } from '../../services/messaging/message-normalizer.service.js';
import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

// Environment configuration
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'mari8x_verify_2026';

interface WhatsAppVerifyRequest {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<any>;
        statuses?: Array<any>;
      };
      field: string;
    }>;
  }>;
}

export async function whatsappBusinessWebhook(fastify: FastifyInstance) {
  /**
   * GET /webhooks/whatsapp-business
   * Webhook verification endpoint
   * WhatsApp sends this to verify the webhook URL
   */
  fastify.get<{ Querystring: WhatsAppVerifyRequest }>(
    '/webhooks/whatsapp-business',
    async (request, reply) => {
      const mode = request.query['hub.mode'];
      const token = request.query['hub.verify_token'];
      const challenge = request.query['hub.challenge'];

      console.log('📱 WhatsApp Business webhook verification:', { mode, token });

      // Check if a token and mode is in the query string
      if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully');
        return reply.code(200).send(challenge);
      } else {
        console.log('❌ Webhook verification failed');
        return reply.code(403).send('Forbidden');
      }
    }
  );

  /**
   * POST /webhooks/whatsapp-business
   * Webhook messages endpoint
   * Receives incoming WhatsApp messages and status updates
   */
  fastify.post<{ Body: WhatsAppWebhookPayload }>(
    '/webhooks/whatsapp-business',
    async (request, reply) => {
      const payload = request.body;

      console.log('📱 WhatsApp Business webhook received:', JSON.stringify(payload, null, 2));

      // Log webhook to database for debugging
      try {
        await prisma.channelWebhookLog.create({
          data: {
            channel: 'whatsapp',
            payload: payload as any,
            processed: false,
          },
        });
      } catch (error) {
        console.error('❌ Failed to log webhook:', error);
      }

      // Respond immediately (required by WhatsApp - must respond within 20 seconds)
      reply.code(200).send({ status: 'received' });

      // Process webhook asynchronously
      setImmediate(async () => {
        try {
          await processWhatsAppWebhook(payload);
        } catch (error) {
          console.error('❌ Error processing WhatsApp webhook:', error);

          // Update webhook log with error
          try {
            await prisma.channelWebhookLog.updateMany({
              where: {
                channel: 'whatsapp',
                payload: { equals: payload as any },
                processed: false,
              },
              data: {
                processed: true,
                error: error instanceof Error ? error.message : String(error),
              },
            });
          } catch (logError) {
            console.error('❌ Failed to update webhook log:', logError);
          }
        }
      });
    }
  );

  /**
   * POST /webhooks/whatsapp-business/test
   * Test endpoint - send a test WhatsApp message
   */
  fastify.post<{ Body: { to: string; text: string } }>(
    '/webhooks/whatsapp-business/test',
    async (request, reply) => {
      try {
        const { to, text } = request.body;

        if (!to || !text) {
          return reply.code(400).send({ error: 'Missing required fields: to, text' });
        }

        const result = await whatsappService.sendTextMessage(to, text);

        return reply.send({
          success: true,
          result,
        });
      } catch (error) {
        console.error('❌ Test message failed:', error);
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * GET /webhooks/whatsapp-business/health
   * Health check endpoint
   */
  fastify.get('/webhooks/whatsapp-business/health', async (request, reply) => {
    try {
      const result = await whatsappService.testConnection();
      return reply.send({
        status: result.success ? 'healthy' : 'unhealthy',
        whatsapp: result,
      });
    } catch (error) {
      return reply.code(500).send({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

/**
 * Process WhatsApp webhook payload
 */
async function processWhatsAppWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
  if (!payload.entry || payload.entry.length === 0) {
    console.log('⚠️  No entries in webhook payload');
    return;
  }

  for (const entry of payload.entry) {
    if (!entry.changes || entry.changes.length === 0) {
      continue;
    }

    for (const change of entry.changes) {
      const value = change.value;

      // Process incoming messages
      if (value.messages && value.messages.length > 0) {
        for (const message of value.messages) {
          await processIncomingMessage(message, value.metadata, value.contacts);
        }
      }

      // Process status updates (sent, delivered, read)
      if (value.statuses && value.statuses.length > 0) {
        for (const status of value.statuses) {
          await processStatusUpdate(status);
        }
      }
    }
  }

  // Mark webhook as processed
  try {
    await prisma.channelWebhookLog.updateMany({
      where: {
        channel: 'whatsapp',
        payload: { equals: payload as any },
        processed: false,
      },
      data: {
        processed: true,
      },
    });
  } catch (error) {
    console.error('❌ Failed to mark webhook as processed:', error);
  }
}

/**
 * Process incoming WhatsApp message
 */
async function processIncomingMessage(
  message: any,
  metadata: any,
  contacts: any[]
): Promise<void> {
  try {
    console.log('📨 Processing incoming message:', message.id);

    // Find contact info
    const contact = contacts?.find((c) => c.wa_id === message.from);
    const fromName = contact?.profile?.name || message.from;

    // Normalize the message
    const normalizedMessage = await messageNormalizerService.normalizeWhatsApp({
      id: message.id,
      from: message.from,
      timestamp: message.timestamp,
      type: message.type,
      text: message.text,
      image: message.image,
      document: message.document,
      audio: message.audio,
      video: message.video,
      sticker: message.sticker,
      context: message.context,
    });

    // Find organization by phone number ID
    const organization = await prisma.organization.findFirst({
      where: {
        whatsappPhoneNumberId: metadata.phone_number_id,
        whatsappEnabled: true,
      },
      include: {
        users: {
          where: { role: 'admin' },
          take: 1,
        },
      },
    });

    if (!organization) {
      console.log('⚠️  No organization found for phone number:', metadata.phone_number_id);
      return;
    }

    if (organization.users.length === 0) {
      console.log('⚠️  No admin user found for organization:', organization.id);
      return;
    }

    const userId = organization.users[0].id;

    // Get user preferences for auto-response
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        messagingAutoRespond: true,
        messagingResponseStyle: true,
      },
    });

    const autoRespond = user?.messagingAutoRespond ?? true;
    const responseStyle = user?.messagingResponseStyle ?? 'query_reply';

    // Process the message through channel router
    const result = await channelRouterService.processIncomingMessage(
      normalizedMessage,
      userId,
      organization.id,
      {
        autoRespond,
        responseStyle: responseStyle as any,
      }
    );

    console.log('✅ Message processed successfully:', result);

    // Mark message as read
    if (message.id) {
      await whatsappService.markAsRead(message.id);
    }
  } catch (error) {
    console.error('❌ Error processing incoming message:', error);
    throw error;
  }
}

/**
 * Process WhatsApp status update
 */
async function processStatusUpdate(status: any): Promise<void> {
  try {
    console.log('📊 Processing status update:', status.id, status.status);

    // Update message status in database
    await prisma.message.updateMany({
      where: {
        channelMessageId: status.id,
        channel: 'whatsapp',
      },
      data: {
        status: status.status, // sent, delivered, read, failed
        metadata: {
          timestamp: status.timestamp,
          recipient_id: status.recipient_id,
          errors: status.errors,
        } as any,
      },
    });

    console.log('✅ Status updated:', status.id, '->', status.status);
  } catch (error) {
    console.error('❌ Error processing status update:', error);
    throw error;
  }
}
