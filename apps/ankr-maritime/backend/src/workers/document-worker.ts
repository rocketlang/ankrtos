/**
 * Document Processing Worker
 * Standalone process that processes document jobs from the queue
 * Run with: npx tsx src/workers/document-worker.ts
 */

import { createDocumentWorker } from '../services/queue/document-queue';

console.log('🚀 Starting Document Processing Worker...\n');
console.log('========================================');
console.log('Worker Configuration:');
console.log('  Concurrency: 2 jobs');
console.log('  Redis: localhost:6382');
console.log('  Queue: document-processing');
console.log('========================================\n');

// Create and start worker
const worker = createDocumentWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⏸️  Received SIGTERM, shutting down gracefully...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⏸️  Received SIGINT, shutting down gracefully...');
  await worker.close();
  process.exit(0);
});

console.log('✅ Worker ready to process jobs');
console.log('   Press Ctrl+C to stop\n');
