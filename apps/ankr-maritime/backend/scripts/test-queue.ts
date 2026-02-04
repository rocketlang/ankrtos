/**
 * Test Document Processing Queue
 */

import { queueDocumentProcessing, getJobStatus, getQueueStats } from '../src/services/queue/document-queue';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Document Processing Queue\n');

  // Get a test document
  const doc = await prisma.document.findFirst({
    where: {
      category: 'charter_party',
    },
  });

  if (!doc) {
    console.error('❌ No documents found. Please upload documents first.');
    process.exit(1);
  }

  console.log(`📄 Test Document: ${doc.title}`);
  console.log(`   ID: ${doc.id}`);
  console.log(`   Org: ${doc.organizationId}\n`);

  // Queue the document
  console.log('📥 Adding document to queue...');
  const jobId = await queueDocumentProcessing(
    doc.id,
    doc.organizationId,
    'embed'
  );

  console.log(`✅ Job queued: ${jobId}\n`);

  // Check initial status
  console.log('📊 Initial job status:');
  const initialStatus = await getJobStatus(jobId);
  console.log(JSON.stringify(initialStatus, null, 2));
  console.log();

  // Check queue stats
  console.log('📈 Queue statistics:');
  const stats = await getQueueStats();
  console.log(JSON.stringify(stats, null, 2));
  console.log();

  // Wait and check status again
  console.log('⏳ Waiting 5 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('📊 Updated job status:');
  const finalStatus = await getJobStatus(jobId);
  console.log(JSON.stringify(finalStatus, null, 2));
  console.log();

  console.log('✅ Queue test complete!');
  console.log('\nNote: Make sure the worker is running:');
  console.log('  npx tsx src/workers/document-worker.ts');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
