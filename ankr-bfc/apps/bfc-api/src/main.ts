/**
 * ankrBFC API Server
 *
 * Main entry point for the BFC GraphQL API
 * Port is auto-configured from @ankr-bfc/config
 */

// Bootstrap MUST be first - auto-configures from centralized ports
import '@ankr-bfc/config/bootstrap';

import Fastify from 'fastify';
import mercurius from 'mercurius';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { schema } from './schema/index.js';
import { resolvers } from './resolvers/index.js';
import { createContext, type Context } from './context.js';
import { initializeEncryption } from '@ankr-bfc/core';
import { PORTS } from '@ankr-bfc/config';

// Port is set by bootstrap, fallback to config
const PORT = Number(process.env.PORT) || PORTS.bfc.api;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  // Initialize encryption
  initializeEncryption({
    masterKey: process.env.ENCRYPTION_KEY || 'bfc-dev-key-change-in-production',
  });

  // Create Fastify instance
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty' }
        : undefined,
    },
  });

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disable for GraphQL Playground
  });

  // CORS - origins set by bootstrap or fallback to config
  const defaultOrigins = [
    `http://localhost:${PORTS.bfc.web}`,
    `http://localhost:${PORTS.bfc.customer}`,
  ];
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || defaultOrigins,
    credentials: true,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // WebSocket for subscriptions
  await app.register(websocket);

  // GraphQL with Mercurius
  await app.register(mercurius, {
    schema,
    resolvers,
    context: createContext,
    graphiql: process.env.NODE_ENV !== 'production',
    subscription: {
      context: createContext,
    },
    errorFormatter: (error, ctx) => {
      const response = mercurius.defaultErrorFormatter(error, ctx);
      // Add request ID for tracing
      if (ctx.reply.request.id) {
        response.response.extensions = {
          ...response.response.extensions,
          requestId: ctx.reply.request.id,
        };
      }
      return response;
    },
  });

  // Health check
  app.get('/health', async () => ({
    status: 'healthy',
    service: 'bfc-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }));

  // Readiness check
  app.get('/ready', async () => {
    // TODO: Check database connection
    return {
      status: 'ready',
      checks: {
        database: 'up',
        eon: 'up',
        aiProxy: 'up',
      },
    };
  });

  // Start server
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    ankrBFC API Server                        ║
╠═══════════════════════════════════════════════════════════════╣
║  GraphQL:     http://${HOST}:${PORT}/graphql                    ║
║  Playground:  http://${HOST}:${PORT}/graphiql                   ║
║  Health:      http://${HOST}:${PORT}/health                     ║
╠═══════════════════════════════════════════════════════════════╣
║  🙏 Jai Guru Ji | Transaction Behavioral Intelligence        ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
