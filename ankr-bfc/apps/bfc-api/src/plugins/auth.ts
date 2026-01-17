/**
 * Authentication Plugin
 * JWT-based auth with role extraction
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  customerId?: string;
  branchCode?: string;
  permissions?: string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export async function authPlugin(app: FastifyInstance): Promise<void> {
  // Register JWT
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'bfc-dev-secret-change-in-production',
    sign: {
      expiresIn: '8h',
    },
  });

  // Auth decorator
  app.decorate('authenticate', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // Optional auth (for public endpoints that benefit from auth context)
  app.decorate('optionalAuth', async function (request: FastifyRequest) {
    try {
      await request.jwtVerify();
    } catch {
      // Ignore - user will be undefined
    }
  });
}

/**
 * Generate JWT token
 */
export function generateToken(app: FastifyInstance, payload: JwtPayload): string {
  return app.jwt.sign(payload);
}

/**
 * Verify role has permission
 */
export function hasPermission(user: JwtPayload | undefined, permission: string): boolean {
  if (!user) return false;

  // Super admin has all permissions
  if (user.role === 'SUPER_ADMIN') return true;

  return user.permissions?.includes(permission) ?? false;
}

/**
 * Check if user can access customer data
 */
export function canAccessCustomer(user: JwtPayload | undefined, customerId: string): boolean {
  if (!user) return false;

  // Admins can access all customers
  if (['SUPER_ADMIN', 'ADMIN', 'COMPLIANCE_OFFICER'].includes(user.role)) {
    return true;
  }

  // Customer can only access their own data
  if (user.role === 'CUSTOMER' && user.customerId === customerId) {
    return true;
  }

  // Branch staff can access customers in their branch
  if (['BRANCH_MANAGER', 'RELATIONSHIP_MANAGER', 'TELLER'].includes(user.role)) {
    // Would need to check branch assignment - simplified here
    return true;
  }

  return false;
}
