import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// In-memory store (replace with database)
const users: Map<string, User> = new Map();

export default async function userRoutes(fastify: FastifyInstance) {
  // List all users
  fastify.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      success: true,
      data: Array.from(users.values()),
      count: users.size,
    };
  });

  // Get single user
  fastify.get('/users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const user = users.get(id);

    if (!user) {
      reply.code(404);
      return { success: false, error: 'User not found' };
    }

    return { success: true, data: user };
  });

  // Create user
  fastify.post('/users', async (request: FastifyRequest<{ Body: { name: string; email: string } }>, reply: FastifyReply) => {
    const { name, email } = request.body;
    const id = crypto.randomUUID();

    const user: User = {
      id,
      name,
      email,
      createdAt: new Date(),
    };

    users.set(id, user);
    reply.code(201);
    return { success: true, data: user };
  });

  // Update user
  fastify.put('/users/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: { name?: string; email?: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const user = users.get(id);

    if (!user) {
      reply.code(404);
      return { success: false, error: 'User not found' };
    }

    const { name, email } = request.body;
    const updated = { ...user, name: name ?? user.name, email: email ?? user.email };
    users.set(id, updated);

    return { success: true, data: updated };
  });

  // Delete user
  fastify.delete('/users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!users.has(id)) {
      reply.code(404);
      return { success: false, error: 'User not found' };
    }

    users.delete(id);
    return { success: true, message: 'User deleted' };
  });
}
