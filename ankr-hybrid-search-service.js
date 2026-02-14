#!/usr/bin/env bun

/**
 * ANKR Hybrid Search Service
 * File Index (instant) → Vector Search (semantic)
 *
 * Port: 4446
 */

const { Pool } = require('pg');
const Fastify = require('fastify');

const fastify = Fastify({
  logger: true,
  trustProxy: true,
});

const pool = new Pool({
  connectionString: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon',
  max: 20,
});

// Enable CORS
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true,
});

/**
 * Tier 1: File Index Search (instant)
 * Search by filename, title, category
 */
async function fileIndexSearch(query, project = null, limit = 10) {
  const startTime = Date.now();

  const searchPattern = `%${query.toLowerCase()}%`;

  let sql = `
    SELECT
      id,
      file_path,
      title,
      project,
      category,
      file_size,
      metadata,
      indexed_at,
      ts_rank(
        to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(file_path, '')),
        plainto_tsquery('english', $1)
      ) as rank
    FROM ankr_indexed_documents
    WHERE (
      LOWER(title) LIKE $2
      OR LOWER(file_path) LIKE $2
      OR LOWER(category) LIKE $2
    )
  `;

  const params = [query, searchPattern];

  if (project) {
    sql += ` AND project = $3`;
    params.push(project);
  }

  sql += ` ORDER BY rank DESC, indexed_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await pool.query(sql, params);

  const elapsed = Date.now() - startTime;

  return {
    tier: 'file_index',
    count: result.rows.length,
    results: result.rows.map(row => ({
      id: row.id,
      title: row.title,
      path: row.file_path,
      url: row.metadata?.url || `/project/documents/${row.project}/${row.file_path.split('/').pop()}`,
      project: row.project,
      category: row.category,
      size: row.file_size,
      score: parseFloat(row.rank || 0),
      indexed_at: row.indexed_at,
    })),
    elapsed_ms: elapsed,
    method: 'text_search',
  };
}

/**
 * Tier 2: Vector Search (semantic)
 * Uses AI Proxy embeddings + pgvector
 */
async function vectorSearch(query, project = null, limit = 10) {
  const startTime = Date.now();

  try {
    // Get embedding from AI Proxy
    const embeddingResponse = await fetch('http://localhost:4444/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation Embed($text: String!) {
          embed(text: $text) {
            embedding
          }
        }`,
        variables: { text: query },
      }),
    });

    const embeddingData = await embeddingResponse.json();

    if (!embeddingData.data?.embed?.embedding) {
      throw new Error('Failed to get embedding from AI Proxy');
    }

    const embedding = embeddingData.data.embed.embedding;

    // Search chunks with vector similarity
    let sql = `
      SELECT
        d.id,
        d.title,
        d.file_path,
        d.project,
        d.category,
        d.file_size,
        d.metadata,
        c.content,
        c.chunk_index,
        1 - (c.embedding <=> $1::vector) as similarity
      FROM ankr_indexed_chunks c
      JOIN ankr_indexed_documents d ON c.document_id = d.id
      WHERE c.embedding IS NOT NULL
    `;

    const params = [`[${embedding.join(',')}]`];

    if (project) {
      sql += ` AND d.project = $2`;
      params.push(project);
    }

    sql += ` ORDER BY c.embedding <=> $1::vector LIMIT $${params.length + 1}`;
    params.push(limit * 3); // Get more chunks, dedupe by doc

    const result = await pool.query(sql, params);

    // Deduplicate by document, take best chunk
    const docMap = new Map();
    result.rows.forEach(row => {
      if (!docMap.has(row.id) || docMap.get(row.id).similarity < row.similarity) {
        docMap.set(row.id, row);
      }
    });

    const results = Array.from(docMap.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(row => ({
        id: row.id,
        title: row.title,
        path: row.file_path,
        url: row.metadata?.url || `/project/documents/${row.project}/${row.file_path.split('/').pop()}`,
        project: row.project,
        category: row.category,
        size: row.file_size,
        score: row.similarity,
        snippet: row.content?.substring(0, 200) + '...',
        chunk_index: row.chunk_index,
      }));

    const elapsed = Date.now() - startTime;

    return {
      tier: 'vector_search',
      count: results.length,
      results,
      elapsed_ms: elapsed,
      method: 'semantic_similarity',
    };

  } catch (error) {
    console.error('Vector search error:', error);
    return {
      tier: 'vector_search',
      count: 0,
      results: [],
      elapsed_ms: Date.now() - startTime,
      error: error.message,
    };
  }
}

/**
 * Hybrid Search: File Index first, then Vector
 */
async function hybridSearch(query, options = {}) {
  const {
    project = null,
    limit = 10,
    minFileScore = 0.01,
    minVectorScore = 0.5,
  } = options;

  const startTime = Date.now();

  // Tier 1: File Index (always try)
  const fileResults = await fileIndexSearch(query, project, limit);

  // If we got good file index results, return those
  if (fileResults.count >= 3 && fileResults.results[0].score > minFileScore) {
    return {
      query,
      total: fileResults.count,
      results: fileResults.results,
      tiers_used: ['file_index'],
      elapsed_ms: Date.now() - startTime,
      tier_breakdown: {
        file_index: fileResults,
      },
    };
  }

  // Tier 2: Vector Search (semantic fallback)
  const vectorResults = await vectorSearch(query, project, limit);

  // Merge results (deduplicate by ID)
  const mergedMap = new Map();

  // Add file results first (higher priority)
  fileResults.results.forEach(r => mergedMap.set(r.id, { ...r, source: 'file_index' }));

  // Add vector results if not already present
  vectorResults.results
    .filter(r => r.score >= minVectorScore)
    .forEach(r => {
      if (!mergedMap.has(r.id)) {
        mergedMap.set(r.id, { ...r, source: 'vector_search' });
      }
    });

  const results = Array.from(mergedMap.values())
    .sort((a, b) => {
      // Prioritize file_index matches
      if (a.source === 'file_index' && b.source !== 'file_index') return -1;
      if (a.source !== 'file_index' && b.source === 'file_index') return 1;
      return b.score - a.score;
    })
    .slice(0, limit);

  return {
    query,
    total: results.length,
    results,
    tiers_used: ['file_index', 'vector_search'],
    elapsed_ms: Date.now() - startTime,
    tier_breakdown: {
      file_index: fileResults,
      vector_search: vectorResults,
    },
  };
}

// Routes

fastify.get('/health', async () => {
  try {
    await pool.query('SELECT 1');
    return { status: 'ok', service: 'ankr-hybrid-search', timestamp: new Date() };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
});

fastify.get('/search', async (request, reply) => {
  const { q, query, project, limit = 10 } = request.query;

  const searchQuery = q || query;

  if (!searchQuery) {
    return reply.code(400).send({ error: 'Missing query parameter (q or query)' });
  }

  try {
    const results = await hybridSearch(searchQuery, {
      project,
      limit: parseInt(limit),
    });

    return results;
  } catch (error) {
    console.error('Search error:', error);
    return reply.code(500).send({ error: error.message });
  }
});

fastify.post('/search', async (request, reply) => {
  const { query, project, limit = 10, options = {} } = request.body;

  if (!query) {
    return reply.code(400).send({ error: 'Missing query in request body' });
  }

  try {
    const results = await hybridSearch(query, {
      project,
      limit: parseInt(limit),
      ...options,
    });

    return results;
  } catch (error) {
    console.error('Search error:', error);
    return reply.code(500).send({ error: error.message });
  }
});

// GraphQL endpoint (compatible with existing viewer)
fastify.post('/graphql', async (request, reply) => {
  const { query, variables } = request.body;

  // Parse GraphQL query (simple parser for search mutation)
  if (query?.includes('search') || query?.includes('Search')) {
    const searchQuery = variables?.query || variables?.q;
    const project = variables?.project;
    const limit = variables?.limit || 10;

    if (!searchQuery) {
      return {
        data: null,
        errors: [{ message: 'Missing search query' }],
      };
    }

    try {
      const results = await hybridSearch(searchQuery, { project, limit });

      return {
        data: {
          search: {
            total: results.total,
            results: results.results,
            elapsed: results.elapsed_ms,
            tiers: results.tiers_used,
          },
        },
      };
    } catch (error) {
      return {
        data: null,
        errors: [{ message: error.message }],
      };
    }
  }

  return {
    data: null,
    errors: [{ message: 'Unsupported GraphQL operation' }],
  };
});

// Start server
const start = async () => {
  try {
    // Read port from ankr-ctl config
    const portsConfig = require('/root/.ankr/config/ports.json');
    const port = process.env.PORT || portsConfig.services['ankr-hybrid-search']?.port || 4446;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log('');
    console.log('='.repeat(80));
    console.log('🔍 ANKR Hybrid Search Service');
    console.log('='.repeat(80));
    console.log(`✅ Server running on http://localhost:${port}`);
    console.log('');
    console.log('Endpoints:');
    console.log(`  GET  /health`);
    console.log(`  GET  /search?q=<query>&project=<project>&limit=10`);
    console.log(`  POST /search (JSON body: {query, project, limit, options})`);
    console.log(`  POST /graphql (GraphQL compatible)`);
    console.log('');
    console.log('Tiers:');
    console.log(`  1. File Index (instant) - filename/title search`);
    console.log(`  2. Vector Search (fast) - semantic similarity`);
    console.log('');
    console.log('Try:');
    console.log(`  curl "http://localhost:${port}/search?q=transformation&project=pratham-telehub"`);
    console.log('='.repeat(80));
    console.log('');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
