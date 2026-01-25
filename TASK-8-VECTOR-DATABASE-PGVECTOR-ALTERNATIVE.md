# Task #8: Vector Database with pgvector - ALTERNATIVE IMPLEMENTATION

## Why pgvector?

**Advantages over Qdrant:**
1. ✅ **Already using PostgreSQL** - No new infrastructure needed
2. ✅ **Simpler deployment** - Just install extension
3. ✅ **ACID transactions** - Consistency with main database
4. ✅ **Familiar SQL** - Easy to query and join with existing data
5. ✅ **Lower cost** - No additional hosting fees
6. ✅ **Backup integration** - Part of existing PostgreSQL backups

**When to use Qdrant instead:**
- Need >10M vectors (pgvector handles 1-5M well)
- Need advanced features (quantization, filtering)
- Want dedicated vector database

For OpenClaude's use case (hundreds of thousands of code chunks), **pgvector is the better choice.**

---

## Implementation with pgvector

### 1. Database Setup

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create code embeddings table
CREATE TABLE code_embeddings (
  id SERIAL PRIMARY KEY,
  file_path TEXT NOT NULL,
  chunk_type TEXT NOT NULL, -- 'function', 'class', 'module'
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  start_line INT NOT NULL,
  end_line INT NOT NULL,
  function_name TEXT,
  class_name TEXT,
  embedding vector(1024), -- Voyage code-2 dimension
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  UNIQUE(file_path, start_line, end_line)
);

-- Create vector index (HNSW for better performance)
CREATE INDEX code_embeddings_embedding_idx
  ON code_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- Create regular indexes for filtering
CREATE INDEX code_embeddings_language_idx ON code_embeddings(language);
CREATE INDEX code_embeddings_file_path_idx ON code_embeddings(file_path);
CREATE INDEX code_embeddings_chunk_type_idx ON code_embeddings(chunk_type);
```

### 2. Vector Service with pgvector

```typescript
import { prisma } from '@ankr-universe/db';
import { Prisma } from '@prisma/client';

export class PgVectorService {
  /**
   * Upsert code embeddings
   */
  async upsertEmbeddings(embeddings: Array<{
    filePath: string;
    chunkType: 'function' | 'class' | 'module';
    language: string;
    code: string;
    startLine: number;
    endLine: number;
    functionName?: string;
    className?: string;
    embedding: number[];
  }>) {
    for (const emb of embeddings) {
      await prisma.$executeRaw`
        INSERT INTO code_embeddings (
          file_path, chunk_type, language, code,
          start_line, end_line, function_name, class_name, embedding
        )
        VALUES (
          ${emb.filePath}, ${emb.chunkType}, ${emb.language}, ${emb.code},
          ${emb.startLine}, ${emb.endLine}, ${emb.functionName}, ${emb.className},
          ${Prisma.raw(`'[${emb.embedding.join(',')}]'::vector`)}
        )
        ON CONFLICT (file_path, start_line, end_line)
        DO UPDATE SET
          code = EXCLUDED.code,
          embedding = EXCLUDED.embedding,
          updated_at = NOW()
      `;
    }
  }

  /**
   * Semantic search using cosine similarity
   */
  async search(
    queryEmbedding: number[],
    options: {
      limit?: number;
      language?: string;
      threshold?: number; // Similarity threshold (0-1)
    } = {}
  ) {
    const { limit = 10, language, threshold = 0.7 } = options;

    // Build filter conditions
    const languageFilter = language
      ? Prisma.sql`AND language = ${language}`
      : Prisma.empty;

    const results = await prisma.$queryRaw<Array<{
      id: number;
      file_path: string;
      chunk_type: string;
      language: string;
      code: string;
      start_line: number;
      end_line: number;
      function_name: string | null;
      class_name: string | null;
      similarity: number;
    }>>`
      SELECT
        id,
        file_path,
        chunk_type,
        language,
        code,
        start_line,
        end_line,
        function_name,
        class_name,
        1 - (embedding <=> ${Prisma.raw(`'[${queryEmbedding.join(',')}]'::vector`)}) as similarity
      FROM code_embeddings
      WHERE 1 - (embedding <=> ${Prisma.raw(`'[${queryEmbedding.join(',')}]'::vector`)}) > ${threshold}
        ${languageFilter}
      ORDER BY embedding <=> ${Prisma.raw(`'[${queryEmbedding.join(',')}]'::vector`)}
      LIMIT ${limit}
    `;

    return results;
  }

  /**
   * Hybrid search (vector + keyword)
   */
  async hybridSearch(
    queryEmbedding: number[],
    keywords: string[],
    options: {
      limit?: number;
      language?: string;
      vectorWeight?: number; // 0-1, how much to weigh vector vs keyword
    } = {}
  ) {
    const { limit = 10, language, vectorWeight = 0.7 } = options;
    const keywordWeight = 1 - vectorWeight;

    const languageFilter = language
      ? Prisma.sql`AND language = ${language}`
      : Prisma.empty;

    // Build keyword search (full-text search)
    const tsquery = keywords.join(' | '); // OR search

    const results = await prisma.$queryRaw<Array<{
      file_path: string;
      code: string;
      score: number;
      similarity: number;
      keyword_rank: number;
    }>>`
      SELECT
        file_path,
        chunk_type,
        language,
        code,
        start_line,
        end_line,
        function_name,
        class_name,
        (
          ${vectorWeight} * (1 - (embedding <=> ${Prisma.raw(`'[${queryEmbedding.join(',')}]'::vector`)})) +
          ${keywordWeight} * ts_rank(to_tsvector('english', code), to_tsquery(${tsquery}))
        ) as score,
        1 - (embedding <=> ${Prisma.raw(`'[${queryEmbedding.join(',')}]'::vector`)}) as similarity,
        ts_rank(to_tsvector('english', code), to_tsquery(${tsquery})) as keyword_rank
      FROM code_embeddings
      WHERE to_tsvector('english', code) @@ to_tsquery(${tsquery})
        ${languageFilter}
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    return results;
  }

  /**
   * Find similar code chunks
   */
  async findSimilar(
    codeEmbeddingId: number,
    options: { limit?: number; threshold?: number } = {}
  ) {
    const { limit = 5, threshold = 0.8 } = options;

    const results = await prisma.$queryRaw<Array<{
      id: number;
      file_path: string;
      code: string;
      similarity: number;
    }>>`
      SELECT
        c2.id,
        c2.file_path,
        c2.code,
        c2.function_name,
        1 - (c1.embedding <=> c2.embedding) as similarity
      FROM code_embeddings c1, code_embeddings c2
      WHERE c1.id = ${codeEmbeddingId}
        AND c2.id != ${codeEmbeddingId}
        AND 1 - (c1.embedding <=> c2.embedding) > ${threshold}
      ORDER BY c1.embedding <=> c2.embedding
      LIMIT ${limit}
    `;

    return results;
  }

  /**
   * Delete embeddings for a file
   */
  async deleteByFilePath(filePath: string) {
    await prisma.$executeRaw`
      DELETE FROM code_embeddings
      WHERE file_path = ${filePath}
    `;
  }

  /**
   * Get statistics
   */
  async getStats() {
    const stats = await prisma.$queryRaw<Array<{
      total_chunks: number;
      total_size_mb: number;
      languages: any;
      chunk_types: any;
    }>>`
      SELECT
        COUNT(*) as total_chunks,
        pg_total_relation_size('code_embeddings') / 1024 / 1024 as total_size_mb,
        jsonb_object_agg(language, lang_count) as languages,
        jsonb_object_agg(chunk_type, type_count) as chunk_types
      FROM (
        SELECT
          language,
          chunk_type,
          COUNT(*) OVER (PARTITION BY language) as lang_count,
          COUNT(*) OVER (PARTITION BY chunk_type) as type_count
        FROM code_embeddings
        GROUP BY language, chunk_type
      ) subquery
    `;

    return stats[0];
  }
}
```

### 3. Updated Semantic Search Service

```typescript
export class SemanticSearchService {
  private vectorDB: PgVectorService; // Changed from Qdrant
  private embedding: EmbeddingService;
  private chunker: CodeChunkerService;

  constructor() {
    this.vectorDB = new PgVectorService(); // Using pgvector
    this.embedding = new EmbeddingService();
    this.chunker = new CodeChunkerService();
  }

  async indexFile(filePath: string, content: string, language: string) {
    // 1. Chunk the code
    const chunks = this.chunker.chunkFile(filePath, content, language);

    // 2. Generate embeddings
    const codes = chunks.map((c) => c.code);
    const embeddings = await this.embedding.embedCode(codes);

    // 3. Upsert to PostgreSQL
    await this.vectorDB.upsertEmbeddings(
      chunks.map((chunk, i) => ({
        filePath,
        language,
        chunkType: chunk.type,
        code: chunk.code,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        functionName: chunk.name,
        className: chunk.type === 'class' ? chunk.name : undefined,
        embedding: embeddings[i],
      }))
    );
  }

  async semanticSearch(query: string, options: {
    language?: string;
    limit?: number;
    useHybrid?: boolean;
  }) {
    // 1. Embed query
    const queryVector = await this.embedding.embedQuery(query);

    // 2. Extract keywords for hybrid search
    const keywords = query.toLowerCase().match(/\b\w{3,}\b/g) || [];

    // 3. Search (hybrid or pure vector)
    const results = options.useHybrid
      ? await this.vectorDB.hybridSearch(queryVector, keywords, {
          limit: options.limit,
          language: options.language,
        })
      : await this.vectorDB.search(queryVector, {
          limit: options.limit,
          language: options.language,
        });

    return results;
  }

  async findSimilarCode(filePath: string, startLine: number, endLine: number) {
    // Find the embedding for this code chunk
    const chunk = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM code_embeddings
      WHERE file_path = ${filePath}
        AND start_line = ${startLine}
        AND end_line = ${endLine}
      LIMIT 1
    `;

    if (chunk.length === 0) return [];

    return await this.vectorDB.findSimilar(chunk[0].id);
  }
}
```

## Performance Comparison

### pgvector vs Qdrant

| Metric | pgvector | Qdrant |
|--------|----------|--------|
| Setup Complexity | ⭐⭐⭐⭐⭐ (just SQL) | ⭐⭐⭐ (Docker/cloud) |
| Query Speed (1M vectors) | ~50-100ms | ~20-50ms |
| Insert Speed | ~100 vectors/sec | ~500 vectors/sec |
| Storage Overhead | ~5KB per vector | ~3KB per vector |
| Filtering Performance | ⭐⭐⭐⭐⭐ (SQL joins) | ⭐⭐⭐⭐ |
| Cost (cloud) | Included with Postgres | $25-50/month |
| Backup | ⭐⭐⭐⭐⭐ (pg_dump) | ⭐⭐⭐ (separate) |
| Scale Limit | 5M vectors | 100M+ vectors |

**Recommendation:** Use pgvector for OpenClaude. Only switch to Qdrant if you exceed 5M code chunks (unlikely).

## Migration Path

If you later need to migrate from pgvector to Qdrant:

```typescript
// Export from pgvector
const embeddings = await prisma.codeEmbedding.findMany();

// Import to Qdrant
for (const emb of embeddings) {
  await qdrantClient.upsert('code-embeddings', {
    id: emb.id,
    vector: emb.embedding,
    payload: {
      filePath: emb.filePath,
      code: emb.code,
      // ... other fields
    },
  });
}
```

## Deployment

### 1. Install pgvector

**Ubuntu/Debian:**
```bash
sudo apt install postgresql-15-pgvector
```

**macOS (Homebrew):**
```bash
brew install pgvector
```

**Docker:**
```dockerfile
FROM postgres:15
RUN apt-get update && apt-get install -y postgresql-15-pgvector
```

### 2. Enable Extension

```sql
CREATE EXTENSION vector;
```

### 3. Run Migration

```bash
npx prisma migrate dev --name add_code_embeddings
```

## GraphQL Integration (Same as before)

The GraphQL schema and resolvers remain the same - only the backend service implementation changes from Qdrant to pgvector.

## Cost Comparison

### Qdrant Cloud
- **Starter:** $25/month (1GB vectors)
- **Pro:** $75/month (5GB vectors)

### pgvector (already using PostgreSQL)
- **Additional Storage:** ~$0.10/GB/month
- **1M code chunks:** ~5GB = $0.50/month
- **Total:** **$0.50/month** vs **$25/month**

**Savings:** ~$24.50/month (98% cheaper!)

## Conclusion

**Use pgvector for OpenClaude because:**
1. ✅ Already using PostgreSQL
2. ✅ Simpler architecture
3. ✅ 98% cost savings
4. ✅ Better integration with existing data
5. ✅ Sufficient performance for use case

**Only switch to Qdrant if:**
- Scale beyond 5M vectors
- Need advanced features (quantization, filtering)
- Need absolute best performance

---

**Updated Task #8 Status:** ✅ COMPLETE with pgvector recommendation
