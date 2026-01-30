import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import mercurius from 'mercurius';
import { schema } from './schema/index.js';
import { buildContext, prisma } from './schema/context.js';
import { logger } from './utils/logger.js';

const PORT = Number(process.env.PORT) || 4051;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3008';

async function main() {
  const app = Fastify({ logger: false });

  // CORS
  await app.register(cors, {
    origin: [FRONTEND_URL, 'http://localhost:3008'],
    credentials: true,
  });

  // Cookies
  await app.register(cookie);

  // JWT
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
  });

  // GraphQL via Mercurius
  await app.register(mercurius, {
    schema,
    context: buildContext,
    graphiql: true,
    subscription: true,
    path: '/graphql',
  });

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'ankr-maritime',
    timestamp: new Date().toISOString(),
  }));

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    await prisma.$disconnect();
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Start
  await app.listen({ port: PORT, host: '0.0.0.0' });
  logger.info(`ankr-maritime backend running on http://localhost:${PORT}`);
  logger.info(`GraphiQL IDE: http://localhost:${PORT}/graphiql`);
}

main().catch((err) => {
  logger.error(err, 'Failed to start ankr-maritime backend');
  process.exit(1);
});
