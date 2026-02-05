/**
 * Slack Webhook Handler
 * Receives events from Slack (messages, mentions, etc.)
 *
 * @package @ankr/universal-ai-assistant
 * @version 1.0.0
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { slackService } from '../../services/messaging/slack.service.js';
import { channelRouterService } from '../../services/messaging/channel-router.service.js';
import crypto from 'crypto';

interface SlackWebhookBody {
  token?: string;
  team_id?: string;
  api_app_id?: string;
  event?: any;
  type?: string;
  event_id?: string;
  event_time?: number;
  challenge?: string; // For URL verification
}

/**
 * Verify Slack request signature
 */
function verifySlackSignature(
  signingSecret: string,
  requestSignature: string,
  timestamp: string,
  body: string
): boolean {
  try {
    // Check timestamp is within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp, 10);

    if (Math.abs(now - requestTime) > 60 * 5) {
      console.error('Slack request timestamp too old');
      return false;
    }

    // Compute signature
    const sigBaseString = `v0:${timestamp}:${body}`;
    const mySignature =
      'v0=' + crypto.createHmac('sha256', signingSecret).update(sigBaseString).digest('hex');

    // Compare signatures
    const valid = crypto.timingSafeEqual(
      Buffer.from(mySignature, 'utf8'),
      Buffer.from(requestSignature, 'utf8')
    );

    return valid;
  } catch (error) {
    console.error('Slack signature verification error:', error);
    return false;
  }
}

export default async function slackWebhookRoutes(fastify: FastifyInstance) {
  /**
   * POST /webhooks/slack
   * Receives Slack events
   */
  fastify.post(
    '/webhooks/slack',
    async (request: FastifyRequest<{ Body: SlackWebhookBody }>, reply: FastifyReply) => {
      try {
        const body = request.body;
        const rawBody = JSON.stringify(body);

        // Verify signature
        const signature = request.headers['x-slack-signature'] as string;
        const timestamp = request.headers['x-slack-request-timestamp'] as string;
        const signingSecret = process.env.SLACK_SIGNING_SECRET || '';

        if (signature && timestamp && signingSecret) {
          const valid = verifySlackSignature(signingSecret, signature, timestamp, rawBody);

          if (!valid) {
            console.error('❌ Invalid Slack signature');
            return reply.code(401).send({ error: 'Invalid signature' });
          }
        }

        // Handle URL verification challenge
        if (body.type === 'url_verification') {
          console.log('✅ Slack URL verification');
          return reply.send({ challenge: body.challenge });
        }

        // Handle event callback
        if (body.type === 'event_callback' && body.event) {
          const event = body.event;

          console.log(`📨 Slack event received: ${event.type}`);

          // Process message event
          const normalizedMessage = await slackService.processWebhook(body as any);

          if (normalizedMessage) {
            // Route through Universal AI Assistant
            const userId = 'system'; // TODO: Map Slack user to system user
            const organizationId = body.team_id || 'default';

            await channelRouterService.processIncomingMessage(
              normalizedMessage,
              userId,
              organizationId,
              {
                autoRespond: true,
                responseStyle: 'query_reply',
                channels: {
                  email: true,
                  whatsapp: true,
                  slack: true,
                  teams: false,
                  webchat: false,
                  ticket: false,
                },
              }
            );
          }

          return reply.send({ ok: true });
        }

        // Acknowledge other events
        return reply.send({ ok: true });
      } catch (error: any) {
        console.error('Slack webhook error:', error);
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  /**
   * POST /webhooks/slack/interactive
   * Receives Slack interactive components (buttons, menus, etc.)
   */
  fastify.post(
    '/webhooks/slack/interactive',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Slack sends interactive payloads as form-encoded
        const payload = JSON.parse((request.body as any).payload || '{}');

        console.log(`🔘 Slack interaction: ${payload.type}`);

        // Handle button clicks, menu selections, etc.
        if (payload.type === 'block_actions') {
          const action = payload.actions?.[0];

          if (action) {
            console.log(`Action: ${action.action_id}`);

            // Respond to the action
            await slackService.sendTextMessage(
              payload.channel.id,
              `You clicked: ${action.action_id}`,
              payload.message.ts
            );
          }
        }

        return reply.send({ ok: true });
      } catch (error: any) {
        console.error('Slack interactive webhook error:', error);
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  /**
   * POST /webhooks/slack/slash
   * Receives Slack slash commands
   */
  fastify.post('/webhooks/slack/slash', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;

      console.log(`⚡ Slack slash command: ${body.command}`);

      // Example: /mari8x help
      if (body.command === '/mari8x') {
        const text = body.text?.trim() || 'help';

        let response = '';

        switch (text) {
          case 'help':
            response = `*Mari8X Assistant Commands*\n\n` + `• \`/mari8x help\` - Show this help\n` + `• \`/mari8x status\` - Check system status\n` + `• \`/mari8x search [query]\` - Search vessels, fixtures, etc.`;
            break;

          case 'status':
            response = `✅ *Mari8X Status*\n\n` + `All systems operational.`;
            break;

          default:
            response = `Processing: "${text}"`;
        }

        return reply.send({
          response_type: 'ephemeral', // Only visible to user
          text: response,
        });
      }

      return reply.send({ text: 'Unknown command' });
    } catch (error: any) {
      console.error('Slack slash command error:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  console.log('✅ Slack webhook routes registered');
}
