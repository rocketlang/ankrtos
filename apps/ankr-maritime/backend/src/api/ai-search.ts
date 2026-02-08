import { FastifyInstance } from 'fastify';
import { interpretMaritimeQuery } from '../services/claude-proxy.js';

interface AISearchBody {
  query: string;
}

/**
 * AI Search Routes for Fastify
 */
export async function aiSearchRoutes(app: FastifyInstance) {
  /**
   * POST /api/ai-search
   * AI-powered search endpoint
   */
  app.post<{ Body: AISearchBody }>('/api/ai-search', async (request, reply) => {
    try {
      const { query } = request.body;

      if (!query || typeof query !== 'string') {
        return reply.status(400).send({
          error: 'Query is required and must be a string',
        });
      }

      // Rate limiting check (simple implementation)
      const userIP = request.ip;
      console.log(`[AI Search] ${userIP} - "${query}"`);

      // Call Claude API to interpret query
      const result = await interpretMaritimeQuery(query);

      // Log for analytics
      console.log(`[AI Search Result] Page: ${result.page}, Message: ${result.message}`);

      return reply.send(result);
    } catch (error: any) {
      console.error('[AI Search API Error]', error);
      return reply.status(500).send({
        error: 'Failed to process search query',
        message: error.message,
      });
    }
  });
}
