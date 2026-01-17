-- =============================================================================
-- ankrBFC Database Initialization
--
-- Runs on first container start to set up:
-- - pgvector extension
-- - Required schemas
-- - Initial permissions
-- =============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS bfc;
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA bfc TO ankr;
GRANT ALL PRIVILEGES ON SCHEMA audit TO ankr;

-- Set default search path
ALTER DATABASE bfc SET search_path TO bfc, public;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'BFC database initialized successfully';
END $$;
