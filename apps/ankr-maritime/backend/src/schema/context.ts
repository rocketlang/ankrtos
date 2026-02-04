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
  branchId?: string;
  sessionId?: string;
}

export interface GraphQLContext {
  prisma: PrismaClient;
  user: AuthUser | null;
  loaders: DataLoaders;
  log: ReturnType<typeof createChildLogger>;
  signJwt: (payload: Record<string, unknown>) => string;
  request?: FastifyRequest;
  /** Returns the authenticated user's organizationId, or throws if unauthenticated */
  orgId: () => string;
  /** Returns org filter clause: { organizationId: orgId } or {} for unauthenticated */
  orgFilter: () => { organizationId?: string };
  /** Returns the authenticated user's branchId, or undefined if not assigned */
  branchId: () => string | undefined;
  /** Returns branch filter clause: { branchId: branchId } or {} if no branch */
  branchFilter: () => { branchId?: string };
  /** Returns combined org + branch filter for multi-tenant queries */
  tenantFilter: () => { organizationId?: string; branchId?: string };
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
    request,
    orgId: () => {
      if (!user?.organizationId) throw new Error('Authentication required');
      return user.organizationId;
    },
    orgFilter: () => user?.organizationId ? { organizationId: user.organizationId } : {},
    branchId: () => user?.branchId,
    branchFilter: () => user?.branchId ? { branchId: user.branchId } : {},
    tenantFilter: () => {
      const filter: { organizationId?: string; branchId?: string } = {};
      if (user?.organizationId) filter.organizationId = user.organizationId;
      if (user?.branchId) filter.branchId = user.branchId;
      return filter;
    },
  };
}
