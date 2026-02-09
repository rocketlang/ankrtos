#!/usr/bin/env node

/**
 * Regenerate Embeddings After Switching to Nomic (768 dims)
 *
 * This script:
 * 1. Fetches all episodes/memories without embeddings
 * 2. Generates new embeddings using Nomic API
 * 3. Updates database with new 768-dim vectors
 */

const { Pool } = require('pg');

const AI_PROXY_URL = 'http://localhost:4444/graphql';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon'
});

async function generateEmbedding(text) {
  const query = `
    mutation {
      embed(text: "${text.replace(/"/g, '\\"')}") {
        embedding
        provider
        dimensions
      }
    }
  `;

  const response = await fetch(AI_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });

  const { data } = await response.json();

  if (!data?.embed?.embedding) {
    throw new Error('Failed to generate embedding');
  }

  return {
    embedding: data.embed.embedding,
    provider: data.embed.provider,
    dimensions: data.embed.dimensions
  };
}

async function regenerateEpisodeEmbeddings() {
  console.log('🔄 Regenerating episode embeddings...\n');

  // Get episodes without embeddings
  const { rows } = await pool.query(`
    SELECT id, content
    FROM eon_episodes
    WHERE embedding IS NULL
      AND content IS NOT NULL
    LIMIT 100
  `);

  console.log(`Found ${rows.length} episodes to process\n`);

  let processed = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const { embedding, provider, dimensions } = await generateEmbedding(row.content);

      await pool.query(`
        UPDATE eon_episodes
        SET embedding = $1::vector,
            embedding_provider = $2
        WHERE id = $3
      `, [`[${embedding.join(',')}]`, provider, row.id]);

      processed++;

      if (processed % 10 === 0) {
        console.log(`✅ Processed ${processed}/${rows.length} episodes (${provider}, ${dimensions} dims)`);
      }

      // Rate limit: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Error processing episode ${row.id}:`, error.message);
      errors++;
    }
  }

  console.log(`\n✅ Episode embeddings complete: ${processed} processed, ${errors} errors\n`);
}

async function regeneratePredictionEmbeddings() {
  console.log('🔄 Regenerating prediction embeddings...\n');

  const { rows } = await pool.query(`
    SELECT id, prompt, response
    FROM eon_predictions
    WHERE prompt_embedding IS NULL
      AND prompt IS NOT NULL
    LIMIT 100
  `);

  console.log(`Found ${rows.length} predictions to process\n`);

  let processed = 0;

  for (const row of rows) {
    try {
      // Generate prompt embedding
      if (row.prompt) {
        const { embedding: promptEmb } = await generateEmbedding(row.prompt);
        await pool.query(`
          UPDATE eon_predictions
          SET prompt_embedding = $1::vector
          WHERE id = $2
        `, [`[${promptEmb.join(',')}]`, row.id]);
      }

      // Generate response embedding
      if (row.response) {
        const { embedding: respEmb } = await generateEmbedding(row.response);
        await pool.query(`
          UPDATE eon_predictions
          SET response_embedding = $1::vector
          WHERE id = $2
        `, [`[${respEmb.join(',')}]`, row.id]);
      }

      processed++;

      if (processed % 10 === 0) {
        console.log(`✅ Processed ${processed}/${rows.length} predictions`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Error processing prediction ${row.id}:`, error.message);
    }
  }

  console.log(`\n✅ Prediction embeddings complete: ${processed} processed\n`);
}

async function main() {
  console.log('════════════════════════════════════════════════════════');
  console.log('  Regenerate Embeddings (Nomic 768 dims)');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // Test AI proxy connection
    const testEmbed = await generateEmbedding('test');
    console.log(`✅ AI Proxy connected: ${testEmbed.provider} (${testEmbed.dimensions} dims)\n`);

    if (testEmbed.dimensions !== 768) {
      console.warn(`⚠️  WARNING: Expected 768 dimensions, got ${testEmbed.dimensions}`);
      console.warn('   Make sure AI proxy is using Nomic!\n');
    }

    // Regenerate embeddings
    await regenerateEpisodeEmbeddings();
    await regeneratePredictionEmbeddings();

    // Show stats
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE embedding IS NOT NULL) as with_embedding,
        COUNT(*) FILTER (WHERE embedding IS NULL) as without_embedding,
        COUNT(*) as total
      FROM eon_episodes
    `);

    console.log('════════════════════════════════════════════════════════');
    console.log('📊 Final Statistics:');
    console.log('════════════════════════════════════════════════════════');
    console.log(`  Episodes with embeddings: ${stats.rows[0].with_embedding}`);
    console.log(`  Episodes without: ${stats.rows[0].without_embedding}`);
    console.log(`  Total: ${stats.rows[0].total}`);
    console.log('════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
