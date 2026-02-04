import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { schema } from './schema';
import { createContext } from './schema/context';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

async function startServer() {
  // Apollo Server setup
  const server = new ApolloServer({
    schema,
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();

  // Middleware
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CoralsAstrology API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // GraphQL endpoint
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => createContext(req, prisma),
    })
  );

  // Start server
  app.listen(PORT, () => {
    console.log(`🔮 CoralsAstrology API running on http://localhost:${PORT}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
