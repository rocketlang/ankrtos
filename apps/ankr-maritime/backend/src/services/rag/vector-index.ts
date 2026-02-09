/**
 * Vector Index Optimization Utilities
 * Provides helpers for optimizing pgvector IVFFlat queries
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

/**
 * Set optimal IVFFlat probes for the current session
 * Should be called at the start of search operations
 */
export async function setOptimalProbes(): Promise<void> {
  try {
    // Get document count
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM maritime_documents
      WHERE embedding IS NOT NULL
    `;
    const totalDocs = Number(result[0].count);

    // Calculate optimal lists (sqrt of docs)
    const optimalLists = totalDocs < 10 ? 1 : Math.floor(Math.sqrt(totalDocs));

    // Calculate optimal probes (10% of lists, minimum 1)
    const optimalProbes = Math.max(1, Math.floor(optimalLists * 0.1));

    // Set probes for this session (using string interpolation as SET doesn't support parameters)
    await prisma.$executeRawUnsafe(`SET ivfflat.probes = ${optimalProbes}`);

    console.log(`🎯 IVFFlat probes set to ${optimalProbes} (for ${totalDocs} docs)`);
  } catch (error) {
    console.error('Failed to set optimal probes:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Get index information
 */
export async function getIndexInfo(): Promise<{
  hasIndex: boolean;
  lists: number;
  documents: number;
}> {
  try {
    const indexInfo = await prisma.$queryRaw<any[]>`
      SELECT * FROM pg_indexes
      WHERE tablename = 'maritime_documents'
      AND indexname = 'maritime_documents_embedding_idx'
    `;

    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM maritime_documents
      WHERE embedding IS NOT NULL
    `;

    const documents = Number(result[0].count);
    const hasIndex = indexInfo.length > 0;

    let lists = 0;
    if (hasIndex) {
      const def = indexInfo[0].indexdef;
      const match = def.match(/lists='?(\d+)'?/);
      if (match) {
        lists = parseInt(match[1]);
      }
    }

    return { hasIndex, lists, documents };
  } catch (error) {
    console.error('Failed to get index info:', error);
    return { hasIndex: false, lists: 0, documents: 0 };
  }
}

/**
 * Check if index needs rebuilding
 */
export async function needsIndexRebuild(): Promise<boolean> {
  const info = await getIndexInfo();

  if (info.documents < 10) {
    return info.hasIndex; // Should not have index for <10 docs
  }

  const optimalLists = Math.floor(Math.sqrt(info.documents));
  const deviation = Math.abs(info.lists - optimalLists) / optimalLists;

  // Rebuild if deviation > 30%
  return deviation > 0.3;
}

/**
 * Auto-optimize index if needed
 */
export async function autoOptimizeIndex(): Promise<void> {
  const needs = await needsIndexRebuild();

  if (needs) {
    console.log('⚠️  Vector index needs optimization');
    console.log('   Run: npx tsx scripts/optimize-vector-index.ts --optimize');
  }
}

export default {
  setOptimalProbes,
  getIndexInfo,
  needsIndexRebuild,
  autoOptimizeIndex,
};
