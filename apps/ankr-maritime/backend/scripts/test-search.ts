/**
 * Test Search Functionality
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSearch() {
  console.log('🔍 Testing Maritime Document Search...\n');

  try {
    // 1. Check indexed documents
    const docCount = await prisma.maritimeDocument.count();
    console.log(`📊 Total indexed documents: ${docCount}\n`);

    if (docCount === 0) {
      console.log('❌ No documents indexed yet. Run index-sample-cp.ts first.');
      return;
    }

    // 2. Show sample document
    const sampleDoc = await prisma.maritimeDocument.findFirst({
      where: { documentId: 'doc-gencon-2022-sample' },
    });

    if (sampleDoc) {
      console.log('📄 Sample Document:');
      console.log(`   Title: ${sampleDoc.title}`);
      console.log(`   Type: ${sampleDoc.docType}`);
      console.log(`   Content Length: ${sampleDoc.content.length} chars`);
      console.log(`   Vessels: ${sampleDoc.vesselNames.join(', ')}`);
      console.log(`   Ports: ${sampleDoc.portNames.join(', ')}`);
      console.log(`   Has Embedding: ${sampleDoc.embedding ? 'Yes ✓' : 'No ✗'}`);
      console.log(`   Content Preview: ${sampleDoc.content.substring(0, 200)}...\n`);
    }

    // 3. Test text search (without embeddings)
    console.log('🔎 Testing text search for "demurrage"...');
    const textResults = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        title,
        "docType",
        ts_rank("contentTsv", to_tsquery('english', 'demurrage')) as rank,
        substring(content, 1, 150) as excerpt
      FROM maritime_documents
      WHERE "contentTsv" @@ to_tsquery('english', 'demurrage')
      ORDER BY rank DESC
      LIMIT 5
    `;

    console.log(`   Found ${textResults.length} results:\n`);
    textResults.forEach((result, idx) => {
      console.log(`   ${idx + 1}. ${result.title}`);
      console.log(`      Rank: ${Number(result.rank).toFixed(4)}`);
      console.log(`      Excerpt: ${result.excerpt}...\n`);
    });

    // 4. Test search for specific terms
    const searchTerms = ['laytime', 'freight', 'charter', 'vessel', 'Ocean Star'];

    for (const term of searchTerms) {
      const count = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count
        FROM maritime_documents
        WHERE "contentTsv" @@ to_tsquery('english', ${term})
      `;
      console.log(`   "${term}": ${count[0].count} documents`);
    }

    console.log('\n✅ Search test complete!');
    console.log('\n📍 Next: Generate embeddings for semantic search');
    console.log('   Command: npx tsx scripts/generate-embeddings.ts');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testSearch()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
