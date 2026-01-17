/**
 * GraphQL Context
 *
 * Creates context for each request with:
 * - Prisma client
 * - Current user
 * - Request info
 * - Services
 */

import { PrismaClient } from '@prisma/client';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { MercuriusContext } from 'mercurius';

// Initialize Prisma client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  branchCode?: string;
  customerId?: string;
}

export interface Context {
  prisma: PrismaClient;
  user?: User;
  requestId: string;
  ip: string;
  userAgent: string;
}

export async function createContext(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<Context> {
  // Extract user from JWT token (if present)
  let user: User | undefined;

  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      // TODO: Verify JWT token
      // const token = authHeader.substring(7);
      // user = await verifyToken(token);
    } catch (error) {
      // Invalid token - continue without user
    }
  }

  return {
    prisma,
    user,
    requestId: request.id,
    ip: request.ip,
    userAgent: request.headers['user-agent'] || 'unknown',
  };
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
