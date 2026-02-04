#!/bin/bash
# ============================================================================
# ANKR-EON Hybrid Search v2 - Test Script
# Run after applying the migration
# ============================================================================

set -e

DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-ankr_eon}"

echo "=============================================="
echo "  ANKR-EON Hybrid Search v2 - Test Suite"
echo "=============================================="
echo ""

# Test 1: Check new columns exist
echo "📋 Test 1: Checking content_tsv column..."
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'eon_knowledge' 
  AND column_name IN ('content_tsv', 'embedding');
"

# Test 2: Check indexes
echo ""
echo "📋 Test 2: Checking indexes..."
psql -U $DB_USER -d $DB_NAME -c "
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'eon_knowledge' 
  AND (indexname LIKE '%tsv%' OR indexname LIKE '%hnsw%' OR indexname LIKE '%embedding%');
"

# Test 3: Check functions exist
echo ""
echo "📋 Test 3: Checking functions..."
psql -U $DB_USER -d $DB_NAME -c "
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('hybrid_search_rrf', 'vector_search', 'text_search');
"

# Test 4: Run text search
echo ""
echo "📋 Test 4: Testing text_search function..."
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
    id, 
    LEFT(title, 40) as title, 
    ROUND(similarity::numeric, 4) as score,
    LEFT(headline, 80) as headline
FROM text_search('ANKR DevBrain sandboxing', 3);
"

# Test 5: Check search stats
echo ""
echo "📋 Test 5: Search statistics..."
psql -U $DB_USER -d $DB_NAME -c "SELECT * FROM eon_search_stats;"

# Test 6: Sample hybrid search (text-only since we can't generate embeddings in bash)
echo ""
echo "📋 Test 6: Sample data with tsvector populated..."
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
    id,
    LEFT(title, 50) as title,
    LENGTH(content) as content_len,
    content_tsv IS NOT NULL as has_tsv,
    embedding IS NOT NULL as has_embedding
FROM eon_knowledge
LIMIT 5;
"

echo ""
echo "=============================================="
echo "  ✅ All tests completed!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "  1. Run the TypeScript test to verify full hybrid search"
echo "  2. Compare search results: hybrid vs vector vs text"
echo "  3. Tune weights based on your use case"
echo ""
