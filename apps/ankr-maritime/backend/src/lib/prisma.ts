/**
 * Prisma Client Singleton
 *
 * DEPRECATED: This file is kept for backward compatibility.
 * New code should use getPrisma() from './db.js'
 *
 * Migration in progress to production-grade connection manager.
 */

import { getPrisma } from './db.js';

// Export as promise to maintain compatibility
export const prisma = await getPrisma();

// Re-export getPrisma for new code
export { getPrisma };
