import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

export interface Context {
  prisma: PrismaClient;
  userId?: string;
  userRole?: string;
}

export async function createContext(
  req: any,
  prisma: PrismaClient
): Promise<Context> {
  const context: Context = { prisma };

  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      context.userId = decoded.userId;
      context.userRole = decoded.role;
    } catch (error) {
      console.warn('Invalid token:', error);
    }
  }

  return context;
}

export function requireAuth(context: Context) {
  if (!context.userId) {
    throw new Error('Authentication required');
  }
  return context.userId;
}

export function requireAdmin(context: Context) {
  if (!context.userId || context.userRole !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  return context.userId;
}
