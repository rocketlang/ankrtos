/**
 * Index Sample Charter Party in RAG System
 */

import { PrismaClient } from '@prisma/client';
import maritimeRAG from '../src/services/rag/maritime-rag.js';

const prisma = new PrismaClient();

async function indexSampleCP() {
  console.log('🧠 Indexing GENCON 2022 sample in RAG system...\n');

  try {
    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: 'doc-gencon-2022-sample' },
    });

    if (!document) {
      throw new Error('Sample document not found. Run quick-upload-cp.sql first.');
    }

    console.log(`📄 Document: ${document.title}`);
    console.log(`📁 Category: ${document.category}`);
    console.log(`📊 Size: ${(document.fileSize / 1024).toFixed(2)} KB`);
    console.log(`🏢 Organization: ${document.organizationId}\n`);

    // Ingest into RAG
    console.log('⚙️  Starting ingestion...');
    const job = await maritimeRAG.ingestDocument(
      document.id,
      document.organizationId
    );

    console.log(`✅ Job created: ${job.jobId}`);
    console.log(`📊 Status: ${job.status}`);
    console.log(`📈 Progress: ${job.progress}%\n`);

    // Wait for completion
    console.log('⏳ Waiting for processing...');
    let status = await maritimeRAG.getJobStatus(job.jobId);
    let attempts = 0;
    const maxAttempts = 30;

    while (status.status === 'pending' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      status = await maritimeRAG.getJobStatus(job.jobId);
      attempts++;

      if (attempts % 5 === 0) {
        console.log(`   Still processing... ${attempts}/${maxAttempts}s`);
      }
    }

    console.log(`\n✅ Processing complete!`);
    console.log(`📊 Final Status: ${status.status}`);
    console.log(`📝 Chunks Created: ${status.chunksCreated}`);

    if (status.error) {
      console.log(`❌ Error: ${status.error}`);
    }

    // Test search
    console.log('\n🔍 Testing search...');
    const searchResults = await maritimeRAG.search(
      'demurrage laytime WWDSHEX',
      { limit: 3 },
      document.organizationId
    );

    console.log(`   Found ${searchResults.length} results:\n`);
    searchResults.forEach((result, idx) => {
      console.log(`   ${idx + 1}. ${result.title}`);
      console.log(`      Score: ${(result.score * 100).toFixed(1)}%`);
      console.log(`      ${result.excerpt.substring(0, 100)}...\n`);
    });

    // Test RAG Q&A
    console.log('💬 Testing RAG Q&A...');
    const answer = await maritimeRAG.ask(
      'What is the demurrage rate and how is laytime calculated?',
      { limit: 3 },
      document.organizationId
    );

    console.log(`   Q: What is the demurrage rate and how is laytime calculated?`);
    console.log(`   A: ${answer.answer}\n`);
    console.log(`   Confidence: ${answer.confidence.toFixed(1)}%`);
    console.log(`   Sources: ${answer.sources.length}\n`);

    if (answer.followUpSuggestions.length > 0) {
      console.log('   Suggested follow-ups:');
      answer.followUpSuggestions.forEach((s) => console.log(`   • ${s}`));
    }

    console.log('\n🎉 Success! Sample charter party is now searchable.');
    console.log('\n📍 Next steps:');
    console.log('   1. Start frontend: cd frontend && npm run dev');
    console.log('   2. Open SwayamBot and ask about charter parties');
    console.log('   3. Try advanced search with maritime terms');
    console.log('   4. Test with queries like:');
    console.log('      • "What is WWDSHEX?"');
    console.log('      • "freight payment terms"');
    console.log('      • "demurrage calculation"');
    console.log('      • "laytime SHINC"');
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run
indexSampleCP()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
