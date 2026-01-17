/**
 * Episode Resolvers
 *
 * Handles behavioral episode recording and querying
 * Integrates with EON Memory for semantic search
 */

import type { Context } from '../context.js';

interface EpisodeInput {
  customerId: string;
  state: string;
  action: string;
  outcome: string;
  success: boolean;
  module: string;
  channel?: string;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export const episodeResolvers = {
  Query: {
    customerEpisodes: async (
      _: unknown,
      {
        customerId,
        limit = 20,
        module,
      }: { customerId: string; limit?: number; module?: string },
      context: Context
    ) => {
      return context.prisma.customerEpisode.findMany({
        where: {
          customerId,
          ...(module && { module }),
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    },

    similarEpisodes: async (
      _: unknown,
      {
        state,
        module,
        limit = 10,
      }: { state: string; module: string; limit?: number },
      context: Context
    ) => {
      // TODO: Use pgvector similarity search
      // For now, return recent successful episodes in the same module

      return context.prisma.customerEpisode.findMany({
        where: {
          module,
          success: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      /*
      // With pgvector:
      const embedding = await generateEmbedding(state);
      const results = await context.prisma.$queryRaw`
        SELECT *,
          embedding <-> ${embedding}::vector AS distance
        FROM "CustomerEpisode"
        WHERE module = ${module}
        ORDER BY distance
        LIMIT ${limit}
      `;
      return results;
      */
    },
  },

  Mutation: {
    recordEpisode: async (
      _: unknown,
      { input }: { input: EpisodeInput },
      context: Context
    ) => {
      // Create the episode
      const episode = await context.prisma.customerEpisode.create({
        data: {
          customerId: input.customerId,
          state: input.state,
          action: input.action,
          outcome: input.outcome,
          success: input.success,
          module: input.module,
          channel: input.channel || 'DIGITAL',
          context: input.context || {},
          metadata: input.metadata || {},
        },
      });

      // Update customer's last activity
      await context.prisma.customer.update({
        where: { id: input.customerId },
        data: { lastActivityAt: new Date() },
      });

      // Update behavioral pattern (semantic memory)
      await updateBehavioralPattern(context, input);

      // TODO: Generate embedding and store in EON
      // await eonClient.remember({
      //   content: `${input.state} → ${input.action} → ${input.outcome}`,
      //   userId: input.customerId,
      //   metadata: { module: input.module, success: input.success }
      // });

      return episode;
    },
  },
};

/**
 * Update behavioral pattern statistics
 * This is the semantic memory that learns from episodes
 */
async function updateBehavioralPattern(
  context: Context,
  input: EpisodeInput
): Promise<void> {
  const patternKey = {
    context: input.module,
    action: input.action,
    segment: null, // Could be derived from customer segment
  };

  await context.prisma.behavioralPattern.upsert({
    where: {
      context_action_segment: patternKey,
    },
    create: {
      ...patternKey,
      successCount: input.success ? 1 : 0,
      totalCount: 1,
      successRate: input.success ? 1 : 0,
      confidence: 0.1, // Low confidence with single data point
      isStable: false,
      lastSeen: new Date(),
    },
    update: {
      successCount: input.success
        ? { increment: 1 }
        : undefined,
      totalCount: { increment: 1 },
      lastSeen: new Date(),
      // Recalculate success rate
      successRate: {
        // This is a simplified update; real implementation would use a transaction
      },
    },
  });
}
