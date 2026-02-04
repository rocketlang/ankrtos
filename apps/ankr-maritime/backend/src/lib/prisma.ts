/**
 * Prisma Client Instance
 * Singleton pattern for database connection
 */

import { PrismaClient } from '@prisma/client';

// Singleton instance
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to prevent multiple instances
  // during hot-reloading
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = (global as any).prisma;
}

export { prisma };
