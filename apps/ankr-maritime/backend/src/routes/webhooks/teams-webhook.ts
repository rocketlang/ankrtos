/**
 * Microsoft Teams Webhook Handler
 * Receives activities from Teams via Bot Framework
 *
 * @package @ankr/universal-ai-assistant
 * @version 1.0.0
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { teamsService } from '../../services/messaging/teams.service.js';
import { channelRouterService } from '../../services/messaging/channel-router.service.js';
import crypto from 'crypto';

interface TeamsActivity {
  type: string;
  id: string;
  timestamp: string;
  channelId: string;
  from: {
    id: string;
    name?: string;
  };
  conversation: {
    id: string;
    conversationType?: string;
    name?: string;
  };
  recipient: {
    id: string;
    name?: string;
  };
  text?: string;
  textFormat?: string;
  attachments?: any[];
  replyToId?: string;
  serviceUrl: string;
}

/**
 * Verify Teams request signature (JWT validation)
 * This is a simplified version - production should use proper JWT validation
 */
async function verifyTeamsSignature(authHeader: string): Promise<boolean> {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    // In production, you should:
    // 1. Decode JWT
    // 2. Verify issuer is Microsoft
    // 3. Verify audience is your app ID
    // 4. Verify signature using Microsoft's public keys
    // 5. Check expiration

    // For now, just check that a token exists
    const token = authHeader.substring(7);
    return token.length > 0;
  } catch (error) {
    console.error('Teams signature verification error:', error);
    return false;
  }
}

export default async function teamsWebhookRoutes(fastify: FastifyInstance) {
  /**
   * POST /webhooks/teams
   * Receives Teams activities (messages, events, etc.)
   */
  fastify.post(
    '/webhooks/teams',
    async (request: FastifyRequest<{ Body: TeamsActivity }>, reply: FastifyReply) => {
      try {
        const activity = request.body;
        const authHeader = request.headers['authorization'] as string;

        // Verify signature (JWT from Microsoft Bot Framework)
        const valid = await verifyTeamsSignature(authHeader);

        if (!valid) {
          console.error('❌ Invalid Teams signature');
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        console.log(`📨 Teams activity received: ${activity.type}`);

        // Handle different activity types
        switch (activity.type) {
          case 'message':
            // Process message activity
            const normalizedMessage = await teamsService.processActivity(activity);

            if (normalizedMessage) {
              // Send typing indicator
              await teamsService.sendTypingIndicator(activity, activity.conversation.id);

              // Route through Universal AI Assistant
              const userId = 'system'; // TODO: Map Teams user to system user
              const organizationId = activity.conversation.id;

              const result = await channelRouterService.processIncomingMessage(
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
                    teams: true,
                    webchat: false,
                    ticket: false,
                  },
                }
              );

              // Send AI response via Teams
              if (result.aiResponse?.generated && result.aiResponse.draftId) {
                // Response already sent by channel router
                console.log(`✅ Teams AI response sent`);
              }
            }
            break;

          case 'conversationUpdate':
            // Handle bot added to conversation
            if (activity.from.id !== process.env.TEAMS_BOT_ID) {
              // User or bot was added
              const membersAdded = (activity as any).membersAdded || [];

              for (const member of membersAdded) {
                if (member.id === process.env.TEAMS_BOT_ID) {
                  // Bot was added - send welcome message
                  await teamsService.sendTextMessage(
                    activity,
                    activity.conversation.id,
                    `👋 Hello! I'm Mari8X Assistant. I can help you with:\n\n` +
                      `• Vessel tracking and monitoring\n` +
                      `• Port congestion updates\n` +
                      `• Document management\n` +
                      `• Freight quotes and fixtures\n\n` +
                      `Just ask me anything about maritime operations!`
                  );
                }
              }
            }
            break;

          case 'invoke':
            // Handle adaptive card actions
            const invokeValue = (activity as any).value;
            console.log(`🔘 Teams invoke action:`, invokeValue);
            break;

          default:
            console.log(`Unhandled Teams activity type: ${activity.type}`);
        }

        // Always return 200 OK to acknowledge receipt
        return reply.send({ status: 'ok' });
      } catch (error: any) {
        console.error('Teams webhook error:', error);
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  /**
   * POST /webhooks/teams/messaging
   * Alternative endpoint for Teams messaging extension
   */
  fastify.post(
    '/webhooks/teams/messaging',
    async (request: FastifyRequest<{ Body: TeamsActivity }>, reply: FastifyReply) => {
      try {
        const activity = request.body;

        console.log(`📨 Teams messaging extension: ${activity.type}`);

        // Handle messaging extension queries
        if (activity.type === 'invoke' && (activity as any).name === 'composeExtension/query') {
          const query = (activity as any).value?.parameters?.[0]?.value || '';

          // Search for vessels, fixtures, etc.
          console.log(`🔍 Teams search query: ${query}`);

          // Return search results as cards
          return reply.send({
            composeExtension: {
              type: 'result',
              attachmentLayout: 'list',
              attachments: [
                {
                  contentType: 'application/vnd.microsoft.card.thumbnail',
                  content: {
                    title: 'Search results for: ' + query,
                    text: 'Results from Mari8X database',
                  },
                },
              ],
            },
          });
        }

        return reply.send({ status: 'ok' });
      } catch (error: any) {
        console.error('Teams messaging extension error:', error);
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  console.log('✅ Teams webhook routes registered');
}
