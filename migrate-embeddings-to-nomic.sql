-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Switch Embeddings from Voyage (1536) to Nomic (768)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- IMPORTANT: This migration will:
-- 1. Drop existing embeddings (they're incompatible)
-- 2. Change vector dimensions from 1536 to 768
-- 3. Recreate indexes
--
-- You'll need to regenerate embeddings after this migration.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. EON MEMORY DATABASE (ankr_eon)
-- ═══════════════════════════════════════════════════════════════════════════════

\c ankr_eon;

-- Drop existing indexes first
DROP INDEX IF EXISTS idx_episodes_embedding_hnsw;
DROP INDEX IF EXISTS idx_predictions_prompt_embedding;
DROP INDEX IF EXISTS idx_predictions_response_embedding;
DROP INDEX IF EXISTS idx_consolidations_embedding;

-- Alter columns: Drop old embeddings and recreate with 768 dimensions
-- Episodes table
ALTER TABLE eon_episodes
  DROP COLUMN IF EXISTS embedding CASCADE;

ALTER TABLE eon_episodes
  ADD COLUMN embedding vector(768);

-- Predictions table
ALTER TABLE eon_predictions
  DROP COLUMN IF EXISTS prompt_embedding CASCADE,
  DROP COLUMN IF EXISTS response_embedding CASCADE;

ALTER TABLE eon_predictions
  ADD COLUMN prompt_embedding vector(768),
  ADD COLUMN response_embedding vector(768);

-- Consolidations table (if exists)
ALTER TABLE eon_consolidations
  DROP COLUMN IF EXISTS embedding CASCADE;

ALTER TABLE eon_consolidations
  ADD COLUMN embedding vector(768);

-- Recreate HNSW indexes for fast similarity search
-- HNSW is best for high-dimensional vectors (faster than IVFFlat for <10M vectors)
CREATE INDEX idx_episodes_embedding_hnsw
  ON eon_episodes
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_predictions_prompt_embedding
  ON eon_predictions
  USING hnsw (prompt_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_predictions_response_embedding
  ON eon_predictions
  USING hnsw (response_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_consolidations_embedding
  ON eon_consolidations
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Add metadata column to track embedding provider
ALTER TABLE eon_episodes
  ADD COLUMN IF NOT EXISTS embedding_provider VARCHAR(50) DEFAULT 'nomic-v2';

ALTER TABLE eon_predictions
  ADD COLUMN IF NOT EXISTS embedding_provider VARCHAR(50) DEFAULT 'nomic-v2';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. FR8X DATABASE (if using embeddings)
-- ═══════════════════════════════════════════════════════════════════════════════

\c fr8x;

-- Fr8X uses Json for embeddings, so no migration needed
-- Just update the application code to use 768-dim vectors

-- If you have any vector columns in fr8x, handle them here:
-- ALTER TABLE your_table DROP COLUMN embedding CASCADE;
-- ALTER TABLE your_table ADD COLUMN embedding vector(768);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════════

\c ankr_eon;

-- Check column types
SELECT
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%embedding%'
ORDER BY table_name, column_name;

-- Check indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('eon_episodes', 'eon_predictions', 'eon_consolidations')
  AND indexname LIKE '%embedding%'
ORDER BY tablename;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE!
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Next steps:
-- 1. Run this migration: psql -U ankr < migrate-embeddings-to-nomic.sql
-- 2. Update AI proxy to use Nomic
-- 3. Regenerate embeddings for existing content
--
-- To regenerate embeddings:
--   node /root/regenerate-embeddings.js
--
-- ═══════════════════════════════════════════════════════════════════════════════
