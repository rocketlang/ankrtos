import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import mercurius from 'mercurius';
import { schema } from './schema.js';
import { resolvers } from './resolvers.js';
import { pool } from './db.js';

const PORT = parseInt(process.env.PORT || '4260');
const HOST = '0.0.0.0';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      }
    } : undefined,
  },
});

// Register plugins
await fastify.register(cors, {
  origin: true, // Allow all origins in development
  credentials: true,
});

await fastify.register(helmet, {
  contentSecurityPolicy: false, // Disable for GraphiQL
});

await fastify.register(rateLimit, {
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
  keyGenerator: (request) => {
    // Rate limit by installation_id if present in GraphQL variables
    const body = request.body as any;
    if (body?.variables?.input?.installation_id) {
      return body.variables.input.installation_id;
    }
    // Otherwise by IP
    return request.ip;
  },
});

// Register Mercurius GraphQL
await fastify.register(mercurius, {
  schema,
  resolvers,
  context: (request) => {
    return { request };
  },
  graphiql: process.env.NODE_ENV === 'development' ? 'playground' : false,
  path: '/graphql',
  subscription: false, // Not needed for now
});

// Health check endpoint
fastify.get('/health', async () => {
  try {
    await pool.query('SELECT 1');
    return {
      status: 'healthy',
      service: 'ankrshield-central-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      database: 'connected',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      service: 'ankrshield-central-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Graceful shutdown
const shutdown = async () => {
  fastify.log.info('Shutting down gracefully...');
  await fastify.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
try {
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`
    ✅ ankrshield Central Intelligence API Server running!

    🌐 GraphQL Playground: http://localhost:${PORT}/graphql
    ❤️  Health Check: http://localhost:${PORT}/health

    📊 Database: ankrshield_central
    🔐 Rate Limit: ${process.env.RATE_LIMIT_MAX} requests per ${process.env.RATE_LIMIT_WINDOW}ms
  `);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
