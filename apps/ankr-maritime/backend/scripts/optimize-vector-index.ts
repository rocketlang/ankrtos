/**
 * Optimize IVFFlat Vector Index for Maritime Documents
 * Adjusts index parameters based on document count for optimal performance
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

/**
 * Calculate optimal number of lists for IVFFlat index
 * Rule: lists ≈ sqrt(total_documents)
 */
function calculateOptimalLists(documentCount: number): number {
  if (documentCount < 10) {
    return 1; // Don't use IVFFlat for very small datasets
  }
  if (documentCount < 100) {
    return Math.max(2, Math.floor(Math.sqrt(documentCount)));
  }
  if (documentCount < 1000) {
    return Math.floor(Math.sqrt(documentCount));
  }
  // For larger datasets
  return Math.floor(Math.sqrt(documentCount));
}

/**
 * Calculate optimal probes setting
 * Higher probes = better accuracy but slower queries
 */
function calculateOptimalProbes(lists: number): number {
  // Default: search ~10% of lists
  const probes = Math.max(1, Math.floor(lists * 0.1));
  return Math.min(probes, lists); // Can't probe more lists than exist
}

/**
 * Check if index needs optimization
 */
async function checkIndexStatus(): Promise<{
  totalDocs: number;
  currentLists: number;
  optimalLists: number;
  needsOptimization: boolean;
}> {
  // Get document count with embeddings (using raw query since embedding is Unsupported type)
  const result = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count
    FROM maritime_documents
    WHERE embedding IS NOT NULL
  `;
  const totalDocs = Number(result[0].count);

  // Get current index info
  const indexInfo = await prisma.$queryRaw<any[]>`
    SELECT * FROM pg_indexes
    WHERE tablename = 'maritime_documents'
    AND indexname = 'maritime_documents_embedding_idx'
  `;

  // Extract lists parameter from index definition
  let currentLists = 100; // default
  if (indexInfo.length > 0) {
    const def = indexInfo[0].indexdef;
    const match = def.match(/lists='?(\d+)'?/);
    if (match) {
      currentLists = parseInt(match[1]);
    }
  }

  const optimalLists = calculateOptimalLists(totalDocs);
  const needsOptimization = Math.abs(currentLists - optimalLists) > optimalLists * 0.3;

  return {
    totalDocs,
    currentLists,
    optimalLists,
    needsOptimization,
  };
}

/**
 * Recreate index with optimal parameters
 */
async function optimizeIndex() {
  console.log('🔧 Optimizing IVFFlat Vector Index\n');
  console.log('========================================\n');

  const status = await checkIndexStatus();

  console.log('Current Status:');
  console.log(`  Total documents: ${status.totalDocs}`);
  console.log(`  Current lists: ${status.currentLists}`);
  console.log(`  Optimal lists: ${status.optimalLists}`);
  console.log(`  Needs optimization: ${status.needsOptimization ? 'YES' : 'NO'}\n`);

  if (!status.needsOptimization) {
    console.log('✅ Index is already optimized!');
    console.log(`\nRecommended query settings:`);
    console.log(`  SET ivfflat.probes = ${calculateOptimalProbes(status.currentLists)};`);
    return;
  }

  console.log('🔄 Recreating index with optimal parameters...\n');

  try {
    // Drop old index
    console.log('  1. Dropping old index...');
    await prisma.$executeRaw`DROP INDEX IF EXISTS maritime_documents_embedding_idx`;
    console.log('     ✅ Old index dropped');

    // Create new index with optimal lists
    console.log(`  2. Creating new index with ${status.optimalLists} lists...`);

    if (status.totalDocs < 10) {
      // For very small datasets, use exact search (no index)
      console.log('     ⚠️  Dataset too small for IVFFlat - using exact search');
    } else {
      await prisma.$executeRaw`
        CREATE INDEX maritime_documents_embedding_idx
        ON maritime_documents
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = ${status.optimalLists})
      `;
      console.log('     ✅ New index created');
    }

    console.log('\n========================================');
    console.log('✅ Index Optimization Complete!\n');

    const optimalProbes = calculateOptimalProbes(status.optimalLists);
    console.log('Recommended query settings:');
    console.log(`  SET ivfflat.probes = ${optimalProbes};\n`);

    console.log('Performance Guidelines:');
    console.log(`  - Lists: ${status.optimalLists} (balanced speed/accuracy)`);
    console.log(`  - Probes: ${optimalProbes} (searches ~10% of lists)`);
    console.log(`  - Higher probes = better accuracy, slower queries`);
    console.log(`  - Re-run this script when document count grows significantly\n`);

  } catch (error: any) {
    console.error('❌ Error optimizing index:', error.message);
    throw error;
  }
}

/**
 * Show index statistics
 */
async function showIndexStats() {
  console.log('📊 Vector Index Statistics\n');
  console.log('========================================\n');

  const status = await checkIndexStatus();

  console.log('Index Configuration:');
  console.log(`  Algorithm: IVFFlat (approximate nearest neighbor)`);
  console.log(`  Distance metric: Cosine similarity`);
  console.log(`  Vector dimensions: 1536 (Voyage AI)`);
  console.log(`  Lists: ${status.currentLists}`);
  console.log(`  Documents: ${status.totalDocs}\n`);

  console.log('Optimization Guidelines:');
  console.log(`  Optimal lists: ${status.optimalLists}`);
  console.log(`  Optimal probes: ${calculateOptimalProbes(status.optimalLists)}`);
  console.log(`  Status: ${status.needsOptimization ? '⚠️  Needs optimization' : '✅ Optimized'}\n`);

  if (status.totalDocs < 10) {
    console.log('⚠️  Note: IVFFlat not recommended for <10 documents');
    console.log('   Using exact search (no index) until dataset grows\n');
  }

  if (status.needsOptimization) {
    console.log('💡 Run optimization: npx tsx scripts/optimize-vector-index.ts --optimize\n');
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--optimize')) {
    await optimizeIndex();
  } else if (args.includes('--stats')) {
    await showIndexStats();
  } else {
    console.log('IVFFlat Vector Index Optimizer\n');
    console.log('Usage:');
    console.log('  npx tsx scripts/optimize-vector-index.ts --stats     Show index statistics');
    console.log('  npx tsx scripts/optimize-vector-index.ts --optimize  Optimize index parameters\n');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
