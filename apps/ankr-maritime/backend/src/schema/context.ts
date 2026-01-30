import { PrismaClient } from '@prisma/client';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createLoaders, type DataLoaders } from '../loaders/index.js';
import { createChildLogger } from '../utils/logger.js';

// Singleton PrismaClient
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
}

export interface GraphQLContext {
  prisma: PrismaClient;
  user: AuthUser | null;
  loaders: DataLoaders;
  log: ReturnType<typeof createChildLogger>;
  signJwt: (payload: Record<string, unknown>) => string;
}

export async function buildContext(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<GraphQLContext> {
  let user: AuthUser | null = null;

  try {
    const decoded = await request.jwtVerify<AuthUser>();
    user = decoded;
  } catch {
    // No valid token — anonymous access
  }

  const correlationId =
    (request.headers['x-correlation-id'] as string) ?? crypto.randomUUID();

  const log = createChildLogger({ correlationId, userId: user?.id });

  return {
    prisma,
    user,
    loaders: createLoaders(prisma),
    log,
    signJwt: (payload) => request.server.jwt.sign(payload),
  };
}
