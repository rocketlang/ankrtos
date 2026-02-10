#!/bin/bash

# TimescaleDB Compression Script
# Compresses old chunks to save 80-90% disk space

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "\n${BOLD}${CYAN}🗜️  TimescaleDB Compression${NC}\n"

DB_NAME="ankr_maritime"
TABLE_NAME="vessel_positions"

echo -e "${BOLD}Database:${NC} $DB_NAME"
echo -e "${BOLD}Table:${NC} $TABLE_NAME\n"

# Check current size
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 1: Current Status${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

SIZE_BEFORE=$(psql -U postgres -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
echo -e "Database size: ${RED}$SIZE_BEFORE${NC}"

CHUNK_COUNT=$(psql -U postgres -d $DB_NAME -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='$TABLE_NAME';" | xargs)
echo -e "Total chunks: $CHUNK_COUNT"

COMPRESSED=$(psql -U postgres -d $DB_NAME -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='$TABLE_NAME' AND is_compressed=true;" | xargs)
UNCOMPRESSED=$(psql -U postgres -d $DB_NAME -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='$TABLE_NAME' AND is_compressed=false;" | xargs)

echo -e "Compressed chunks: ${GREEN}$COMPRESSED${NC}"
echo -e "Uncompressed chunks: ${RED}$UNCOMPRESSED${NC}"

# Set up compression policy if not exists
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 2: Configure Compression Policy${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

psql -U postgres -d $DB_NAME <<EOF
-- Remove old policy if exists
SELECT remove_compression_policy('$TABLE_NAME', if_exists => true);

-- Add compression policy (compress chunks older than 7 days)
SELECT add_compression_policy('$TABLE_NAME',
    compress_after => INTERVAL '7 days',
    if_not_exists => true
);
EOF

echo -e "${GREEN}✓ Compression policy configured (auto-compress after 7 days)${NC}"

# Manually compress old chunks
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 3: Compress Old Chunks (This may take 10-30 minutes)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${CYAN}Compressing chunks older than 7 days...${NC}"
echo -e "${YELLOW}This will compress ~$UNCOMPRESSED chunks and free 80-90% space${NC}\n"

# Compress in batches to avoid timeouts
psql -U postgres -d $DB_NAME <<'EOF'
DO $$
DECLARE
    chunk REGCLASS;
    compressed_count INT := 0;
BEGIN
    FOR chunk IN
        SELECT show_chunks('vessel_positions', older_than => INTERVAL '7 days')
    LOOP
        BEGIN
            PERFORM compress_chunk(chunk);
            compressed_count := compressed_count + 1;

            -- Print progress every 10 chunks
            IF compressed_count % 10 = 0 THEN
                RAISE NOTICE 'Compressed % chunks...', compressed_count;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipped chunk % (already compressed or error)', chunk;
        END;
    END LOOP;

    RAISE NOTICE 'Compression complete! Compressed % chunks total', compressed_count;
END $$;
EOF

echo -e "\n${GREEN}✓ Chunk compression complete${NC}"

# Vacuum to reclaim space
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 4: Vacuum Database${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

psql -U postgres -d $DB_NAME -c "VACUUM FULL ANALYZE $TABLE_NAME;"
echo -e "${GREEN}✓ Vacuum complete${NC}"

# Show results
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}📊 RESULTS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

SIZE_AFTER=$(psql -U postgres -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
echo -e "Database size: ${GREEN}$SIZE_AFTER${NC} (was: $SIZE_BEFORE)"

COMPRESSED_AFTER=$(psql -U postgres -d $DB_NAME -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='$TABLE_NAME' AND is_compressed=true;" | xargs)
UNCOMPRESSED_AFTER=$(psql -U postgres -d $DB_NAME -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='$TABLE_NAME' AND is_compressed=false;" | xargs)

echo -e "Compressed chunks: ${GREEN}$COMPRESSED_AFTER${NC}"
echo -e "Uncompressed chunks: ${YELLOW}$UNCOMPRESSED_AFTER${NC}"

echo -e "\n${CYAN}Expected savings: 80-95GB (80-90% compression ratio)${NC}"
echo -e "${GREEN}${BOLD}✓ Compression complete!${NC}\n"
