-- ============================================================================
-- ANKR-EON Hybrid Search v2 Migration
-- PostgreSQL + pgvector + Full-Text Search with RRF Fusion
-- ============================================================================
-- Run as: psql -U postgres -d ankr_eon -f ankr-eon-hybrid-search-migration.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Add generated tsvector column for fast full-text search
-- ============================================================================
-- This avoids computing to_tsvector() on every query

-- Check if column exists first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'eon_knowledge' AND column_name = 'content_tsv'
    ) THEN
        ALTER TABLE eon_knowledge 
        ADD COLUMN content_tsv tsvector 
        GENERATED ALWAYS AS (
            setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(section, '')), 'B') ||
            setweight(to_tsvector('english', content), 'C')
        ) STORED;
        
        RAISE NOTICE 'Added content_tsv column to eon_knowledge';
    ELSE
        RAISE NOTICE 'content_tsv column already exists';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Create GIN index for tsvector (fast full-text search)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_knowledge_content_tsv 
ON eon_knowledge USING GIN (content_tsv);

-- ============================================================================
-- STEP 3: Upgrade to HNSW index (better recall than IVFFlat)
-- ============================================================================
-- HNSW is slower to build but faster and more accurate for queries
-- We'll create it alongside existing IVFFlat, then drop old one

-- First check embedding dimensions
DO $$
DECLARE
    embed_dims INTEGER;
BEGIN
    SELECT vector_dims(embedding) INTO embed_dims 
    FROM eon_knowledge 
    WHERE embedding IS NOT NULL 
    LIMIT 1;
    
    IF embed_dims IS NULL THEN
        RAISE NOTICE 'No embeddings found, skipping HNSW index creation';
    ELSE
        RAISE NOTICE 'Creating HNSW index for % dimensions', embed_dims;
    END IF;
END $$;

-- Create HNSW index (m=16, ef_construction=64 are good defaults)
-- This may take a few minutes for large datasets
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding_hnsw 
ON eon_knowledge USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Drop old IVFFlat index after HNSW is ready (optional - uncomment when ready)
-- DROP INDEX IF EXISTS idx_knowledge_embedding;

-- ============================================================================
-- STEP 4: Create hybrid_search_rrf function with Reciprocal Rank Fusion
-- ============================================================================

CREATE OR REPLACE FUNCTION hybrid_search_rrf(
    query_text TEXT,
    query_embedding vector,
    match_count INT DEFAULT 10,
    vector_weight FLOAT DEFAULT 0.5,
    text_weight FLOAT DEFAULT 0.5,
    rrf_k INT DEFAULT 60,
    similarity_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    section VARCHAR(500),
    content TEXT,
    source_path TEXT,
    source_type VARCHAR(50),
    doc_type VARCHAR(50),
    chunk_index INT,
    keywords TEXT[],
    topics TEXT[],
    vector_rank INT,
    text_rank INT,
    vector_similarity FLOAT,
    text_similarity FLOAT,
    rrf_score FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- Vector search results with ranking
    vector_results AS (
        SELECT 
            ek.id,
            ROW_NUMBER() OVER (ORDER BY ek.embedding <=> query_embedding) AS rank,
            1 - (ek.embedding <=> query_embedding) AS similarity
        FROM eon_knowledge ek
        WHERE ek.embedding IS NOT NULL
        ORDER BY ek.embedding <=> query_embedding
        LIMIT match_count * 3  -- Get more candidates for fusion
    ),
    
    -- Full-text search results with ranking
    text_results AS (
        SELECT 
            ek.id,
            ROW_NUMBER() OVER (ORDER BY ts_rank_cd(ek.content_tsv, websearch_to_tsquery('english', query_text)) DESC) AS rank,
            ts_rank_cd(ek.content_tsv, websearch_to_tsquery('english', query_text)) AS similarity
        FROM eon_knowledge ek
        WHERE ek.content_tsv @@ websearch_to_tsquery('english', query_text)
        ORDER BY ts_rank_cd(ek.content_tsv, websearch_to_tsquery('english', query_text)) DESC
        LIMIT match_count * 3
    ),
    
    -- Combine using Reciprocal Rank Fusion
    combined AS (
        SELECT 
            COALESCE(vr.id, tr.id) AS id,
            vr.rank AS v_rank,
            tr.rank AS t_rank,
            COALESCE(vr.similarity, 0)::FLOAT AS v_sim,
            COALESCE(tr.similarity, 0)::FLOAT AS t_sim,
            -- RRF formula: score = sum(1 / (k + rank))
            (
                COALESCE(vector_weight / (rrf_k + vr.rank), 0) +
                COALESCE(text_weight / (rrf_k + tr.rank), 0)
            ) AS rrf
        FROM vector_results vr
        FULL OUTER JOIN text_results tr ON vr.id = tr.id
    )
    
    SELECT 
        ek.id,
        ek.title,
        ek.section,
        ek.content,
        ek.source_path,
        ek.source_type,
        ek.doc_type,
        ek.chunk_index,
        ek.keywords,
        ek.topics,
        c.v_rank::INT AS vector_rank,
        c.t_rank::INT AS text_rank,
        c.v_sim AS vector_similarity,
        c.t_sim AS text_similarity,
        c.rrf AS rrf_score
    FROM combined c
    JOIN eon_knowledge ek ON ek.id = c.id
    WHERE c.v_sim >= similarity_threshold OR c.t_sim > 0
    ORDER BY c.rrf DESC
    LIMIT match_count;
END;
$$;

-- ============================================================================
-- STEP 5: Create simple vector-only search function (for comparison)
-- ============================================================================

CREATE OR REPLACE FUNCTION vector_search(
    query_embedding vector,
    match_count INT DEFAULT 10,
    similarity_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    content TEXT,
    source_path TEXT,
    similarity FLOAT
)
LANGUAGE SQL
AS $$
    SELECT 
        id,
        title,
        content,
        source_path,
        (1 - (embedding <=> query_embedding))::FLOAT AS similarity
    FROM eon_knowledge
    WHERE embedding IS NOT NULL
      AND (1 - (embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;

-- ============================================================================
-- STEP 6: Create full-text only search function (for comparison)
-- ============================================================================

CREATE OR REPLACE FUNCTION text_search(
    query_text TEXT,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    content TEXT,
    source_path TEXT,
    similarity FLOAT,
    headline TEXT
)
LANGUAGE SQL
AS $$
    SELECT 
        id,
        title,
        content,
        source_path,
        ts_rank_cd(content_tsv, websearch_to_tsquery('english', query_text))::FLOAT AS similarity,
        ts_headline('english', content, websearch_to_tsquery('english', query_text), 
                    'MaxWords=50, MinWords=20, StartSel=**, StopSel=**') AS headline
    FROM eon_knowledge
    WHERE content_tsv @@ websearch_to_tsquery('english', query_text)
    ORDER BY ts_rank_cd(content_tsv, websearch_to_tsquery('english', query_text)) DESC
    LIMIT match_count;
$$;

-- ============================================================================
-- STEP 7: Add similar functions for eon_episodes table
-- ============================================================================

-- Add tsvector column to eon_episodes if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'eon_episodes' AND column_name = 'content_tsv'
    ) THEN
        ALTER TABLE eon_episodes 
        ADD COLUMN content_tsv tsvector 
        GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
        
        RAISE NOTICE 'Added content_tsv column to eon_episodes';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_episodes_content_tsv 
ON eon_episodes USING GIN (content_tsv);

CREATE INDEX IF NOT EXISTS idx_episodes_embedding_hnsw 
ON eon_episodes USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- STEP 8: Create search statistics view
-- ============================================================================

CREATE OR REPLACE VIEW eon_search_stats AS
SELECT 
    'eon_knowledge' AS table_name,
    COUNT(*) AS total_rows,
    COUNT(embedding) AS rows_with_embedding,
    COUNT(content_tsv) AS rows_with_tsvector,
    pg_size_pretty(pg_total_relation_size('eon_knowledge')) AS total_size
FROM eon_knowledge
UNION ALL
SELECT 
    'eon_episodes',
    COUNT(*),
    COUNT(embedding),
    COUNT(content_tsv),
    pg_size_pretty(pg_total_relation_size('eon_episodes'))
FROM eon_episodes;

-- ============================================================================
-- STEP 9: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION hybrid_search_rrf TO ankr;
GRANT EXECUTE ON FUNCTION vector_search TO ankr;
GRANT EXECUTE ON FUNCTION text_search TO ankr;
GRANT SELECT ON eon_search_stats TO ankr;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================================

-- Check new indexes
-- \di eon_knowledge

-- Check new columns
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'eon_knowledge';

-- Test hybrid search (requires embedding parameter - use from your app)
-- SELECT * FROM text_search('ANKR DevBrain sandboxing', 5);

-- Check stats
-- SELECT * FROM eon_search_stats;

-- ============================================================================
-- USAGE EXAMPLE (from TypeScript)
-- ============================================================================
/*
const results = await pool.query(`
    SELECT * FROM hybrid_search_rrf(
        $1::TEXT,           -- query_text
        $2::vector,         -- query_embedding (from your embedding service)
        $3::INT,            -- match_count (default 10)
        $4::FLOAT,          -- vector_weight (default 0.5)
        $5::FLOAT,          -- text_weight (default 0.5)
        $6::INT,            -- rrf_k (default 60)
        $7::FLOAT           -- similarity_threshold (default 0.3)
    )
`, [queryText, embedding, 10, 0.5, 0.5, 60, 0.3]);
*/
