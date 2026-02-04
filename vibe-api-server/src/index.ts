import Fastify from 'fastify';
import cors from '@fastify/cors';
import userRoutes from './routes/users.js';

const fastify = Fastify({ logger: true });

// Enable CORS for React frontend
await fastify.register(cors, {
  origin: ['http://localhost:5173', 'http://localhost:5180'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});

// Root endpoint
fastify.get('/', async () => {
  return {
    name: 'vibe-api-server',
    version: '1.0.0',
    vibe: 'modern 🚀',
    endpoints: ['/health', '/users'],
  };
});

// Health check
fastify.get('/health', async () => {
  return { healthy: true, timestamp: new Date().toISOString() };
});

// Register routes
await fastify.register(userRoutes);

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 vibe-api-server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
