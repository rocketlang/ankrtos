/**
 * Generate Embeddings for Maritime Documents
 * Uses Ollama (dev) or Voyage AI (prod) to create vector embeddings
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Configuration
const USE_VOYAGE = process.env.USE_VOYAGE_EMBEDDINGS === 'true';
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || 'pa-IZUdnDHSHAErlmOHsI2w7EqwbIXBxLEtgiE2pB2zqLr';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

interface EmbeddingResult {
  embedding: number[];
  model: string;
}

/**
 * Generate embeddings using Ollama (free, local)
 */
async function generateOllamaEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
      model: 'nomic-embed-text',
      prompt: text,
    });

    return {
      embedding: response.data.embedding,
      model: 'nomic-embed-text',
    };
  } catch (error: any) {
    console.error('Ollama embedding error:', error.message);
    throw error;
  }
}

/**
 * Generate embeddings using Voyage AI (production, ~$6/month)
 */
async function generateVoyageEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    const response = await axios.post(
      'https://api.voyageai.com/v1/embeddings',
      {
        input: [text],
        model: 'voyage-code-2',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${VOYAGE_API_KEY}`,
        },
      }
    );

    return {
      embedding: response.data.data[0].embedding,
      model: 'voyage-code-2',
    };
  } catch (error: any) {
    console.error('Voyage AI error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Generate embedding (auto-select provider)
 */
async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  if (USE_VOYAGE) {
    console.log('   Using Voyage AI for embeddings');
    return generateVoyageEmbedding(text);
  } else {
    console.log('   Using Ollama (local) for embeddings');
    return generateOllamaEmbedding(text);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔮 Generating Embeddings for Maritime Documents\n');

  try {
    // 1. Find documents without embeddings (using raw SQL since Prisma doesn't support vector filtering)
    const documentsToEmbed = await prisma.$queryRaw<any[]>`
      SELECT id, "documentId", title, content, "docType", "createdAt"
      FROM maritime_documents
      WHERE embedding IS NULL
      ORDER BY "createdAt" ASC
    `;

    if (documentsToEmbed.length === 0) {
      console.log('✅ All documents already have embeddings!');
      return;
    }

    console.log(`📊 Found ${documentsToEmbed.length} documents to embed\n`);

    // 2. Generate embeddings
    let successCount = 0;
    let failCount = 0;

    for (const doc of documentsToEmbed) {
      try {
        console.log(`Processing: ${doc.title}`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Type: ${doc.docType}`);
        console.log(`   Content length: ${doc.content.length} chars`);

        // Create embedding text (combine title + content for better semantic search)
        const embeddingText = `${doc.title}\n\n${doc.content}`;

        // Generate embedding
        const { embedding, model } = await generateEmbedding(embeddingText);

        console.log(`   Generated ${embedding.length}-dim vector with ${model}`);

        // Store embedding in database
        await prisma.$executeRaw`
          UPDATE maritime_documents
          SET embedding = ${JSON.stringify(embedding)}::vector
          WHERE id = ${doc.id}
        `;

        console.log(`   ✅ Stored in database\n`);
        successCount++;

        // Rate limiting (Voyage AI free tier: 300 req/min)
        if (USE_VOYAGE) {
          await new Promise((resolve) => setTimeout(resolve, 250)); // 4 req/sec max
        }
      } catch (error: any) {
        console.error(`   ❌ Failed: ${error.message}\n`);
        failCount++;
      }
    }

    // 3. Summary
    console.log('========================================');
    console.log('📊 Embedding Generation Complete');
    console.log('========================================');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📈 Total processed: ${successCount + failCount}`);

    if (USE_VOYAGE) {
      const estimatedCost = (successCount * 0.00013).toFixed(4); // ~$0.13 per 1k docs
      console.log(`💰 Estimated cost: $${estimatedCost}`);
    } else {
      console.log('💰 Cost: $0 (using local Ollama)');
    }

    console.log('\n✅ Ready for semantic search!');
    console.log('Next: Run test-semantic-search.ts');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
