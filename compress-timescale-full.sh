#!/bin/bash

# Full TimescaleDB Compression with PostgreSQL Stop
# This stops all services to avoid concurrent DML issues

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "\n${BOLD}${RED}⚠️  FULL TIMESCALEDB COMPRESSION${NC}"
echo -e "${YELLOW}This will stop PostgreSQL and dependent services${NC}\n"

# Get size before
SIZE_BEFORE=$(df -h /mnt/ais-storage | awk 'NR==2 {print $3}')
echo -e "Volume usage before: ${RED}$SIZE_BEFORE${NC} / 274G\n"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 1: Stop Services${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "Stopping maritime watcher..."
pm2 stop ankr-maritime-watcher >/dev/null 2>&1

echo "Stopping other services that may access databases..."
pm2 stop ankr-eon >/dev/null 2>&1
pm2 stop ankrshield-api >/dev/null 2>&1

sleep 2

echo "Stopping PostgreSQL..."
sudo systemctl stop postgresql

sleep 3

echo -e "${GREEN}✓ All services stopped${NC}\n"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 2: Start PostgreSQL (Clean State)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

sudo systemctl start postgresql

sleep 5

# Wait for PostgreSQL to be ready
until pg_isready -q 2>/dev/null; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo -e "${GREEN}✓ PostgreSQL started${NC}\n"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 3: Compress TimescaleDB Chunks${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

DB_SIZE_BEFORE=$(psql -U postgres -d ankr_maritime -t -c "SELECT pg_size_pretty(pg_database_size('ankr_maritime'));" | xargs)
echo -e "Database size before: ${RED}$DB_SIZE_BEFORE${NC}"

UNCOMPRESSED_BEFORE=$(psql -U postgres -d ankr_maritime -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='vessel_positions' AND is_compressed=false;" | xargs)
echo -e "Uncompressed chunks: ${YELLOW}$UNCOMPRESSED_BEFORE${NC}\n"

echo -e "${CYAN}Compressing all chunks older than 7 days...${NC}"
echo -e "${YELLOW}This may take 20-40 minutes depending on data size${NC}\n"

# Compress in batches to track progress
for batch in {1..20}; do
    echo -e "${BOLD}Batch $batch...${NC}"

    COMPRESSED=$(psql -U postgres -d ankr_maritime -t <<'SQL'
DO $$
DECLARE
    chunk_record RECORD;
    compressed_count INT := 0;
    total_to_compress INT;
BEGIN
    -- Count total chunks to compress
    SELECT COUNT(*) INTO total_to_compress
    FROM timescaledb_information.chunks
    WHERE hypertable_name = 'vessel_positions'
      AND is_compressed = false
      AND range_end < NOW() - INTERVAL '7 days';

    RAISE NOTICE 'Found % chunks to compress in this batch', total_to_compress;

    -- Compress up to 50 chunks
    FOR chunk_record IN
        SELECT chunk_schema, chunk_name
        FROM timescaledb_information.chunks
        WHERE hypertable_name = 'vessel_positions'
          AND is_compressed = false
          AND range_end < NOW() - INTERVAL '7 days'
        ORDER BY range_start
        LIMIT 50
    LOOP
        BEGIN
            EXECUTE format('SELECT compress_chunk(''%I.%I'')',
                          chunk_record.chunk_schema,
                          chunk_record.chunk_name);
            compressed_count := compressed_count + 1;

            IF compressed_count % 10 = 0 THEN
                RAISE NOTICE '  Compressed % chunks...', compressed_count;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '  Skipped chunk %: %', chunk_record.chunk_name, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE 'Batch complete: % chunks compressed', compressed_count;
END $$;
SELECT 1;
SQL
)

    # Check remaining
    REMAINING=$(psql -U postgres -d ankr_maritime -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='vessel_positions' AND is_compressed=false AND range_end < NOW() - INTERVAL '7 days';" | xargs)

    echo -e "  Remaining: ${YELLOW}$REMAINING${NC}\n"

    if [ "$REMAINING" -eq 0 ]; then
        echo -e "${GREEN}All eligible chunks compressed!${NC}\n"
        break
    fi

    sleep 1
done

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 4: VACUUM FULL to Reclaim Space${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Running VACUUM FULL (this may take 10-20 minutes)...${NC}"
psql -U postgres -d ankr_maritime -c "VACUUM FULL ANALYZE vessel_positions;" 2>&1 | tail -5

echo -e "${GREEN}✓ VACUUM complete${NC}\n"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 5: Final Checkpoint${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

psql -U postgres -c "CHECKPOINT;" >/dev/null 2>&1
echo -e "${GREEN}✓ Checkpoint complete${NC}\n"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 6: Restart Services${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

pm2 restart ankr-maritime-watcher >/dev/null 2>&1
pm2 restart ankr-eon >/dev/null 2>&1
pm2 restart ankrshield-api >/dev/null 2>&1

echo -e "${GREEN}✓ Services restarted${NC}\n"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}📊 RESULTS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

DB_SIZE_AFTER=$(psql -U postgres -d ankr_maritime -t -c "SELECT pg_size_pretty(pg_database_size('ankr_maritime'));" | xargs)
COMPRESSED_AFTER=$(psql -U postgres -d ankr_maritime -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='vessel_positions' AND is_compressed=true;" | xargs)
UNCOMPRESSED_AFTER=$(psql -U postgres -d ankr_maritime -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='vessel_positions' AND is_compressed=false;" | xargs)

echo -e "Database size:"
echo -e "  Before: ${RED}$DB_SIZE_BEFORE${NC}"
echo -e "  After:  ${GREEN}$DB_SIZE_AFTER${NC}"
echo -e ""
echo -e "Chunks:"
echo -e "  Compressed:   ${GREEN}$COMPRESSED_AFTER${NC} / 930"
echo -e "  Uncompressed: ${YELLOW}$UNCOMPRESSED_AFTER${NC}"
echo -e ""

SIZE_AFTER=$(df -h /mnt/ais-storage | awk 'NR==2 {print $3}')
echo -e "Volume usage:"
echo -e "  Before: ${RED}$SIZE_BEFORE${NC} / 274G"
echo -e "  After:  ${GREEN}$SIZE_AFTER${NC} / 274G"
echo -e ""

echo -e "${GREEN}${BOLD}✓ TimescaleDB compression complete!${NC}\n"

# Add alias for easier cleanup
echo "alias compress-maritime='/root/compress-timescale-full.sh'" >> ~/.bashrc
