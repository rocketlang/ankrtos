#!/bin/bash

# TimescaleDB Maritime Compression - Batch Processing
# Compresses chunks in smaller batches to avoid timeout issues

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "\n${BOLD}${CYAN}🗜️  Maritime Database Compression${NC}\n"

# Get size before
SIZE_BEFORE=$(psql -U postgres -d ankr_maritime -t -c "SELECT pg_size_pretty(pg_database_size('ankr_maritime'));" | xargs)
echo -e "Database size before: ${RED}$SIZE_BEFORE${NC}\n"

echo -e "${CYAN}Compressing old chunks (this will take 10-20 minutes)...${NC}\n"

# Run compression in batches
for batch in {1..10}; do
    echo -e "${YELLOW}Batch $batch/10...${NC}"

    psql -U postgres -d ankr_maritime <<'SQL' 2>&1 | grep -E "NOTICE|ERROR"
DO $$
DECLARE
    chunk_name TEXT;
    compressed_count INT := 0;
BEGIN
    FOR chunk_name IN
        SELECT c.chunk_name
        FROM timescaledb_information.chunks c
        WHERE c.hypertable_name = 'vessel_positions'
          AND c.is_compressed = false
          AND c.range_end < NOW() - INTERVAL '7 days'
        ORDER BY c.range_start
        LIMIT 100
    LOOP
        BEGIN
            EXECUTE format('SELECT compress_chunk(''_timescaledb_internal.%I'', if_not_compressed => true)', chunk_name);
            compressed_count := compressed_count + 1;

            IF compressed_count % 20 = 0 THEN
                RAISE NOTICE '  Compressed % chunks in this batch...', compressed_count;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Skip problematic chunks
            NULL;
        END;
    END LOOP;

    RAISE NOTICE 'Batch complete: % chunks compressed', compressed_count;
END $$;
SQL

    # Check remaining
    REMAINING=$(psql -U postgres -d ankr_maritime -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='vessel_positions' AND is_compressed=false AND range_end < NOW() - INTERVAL '7 days';" | xargs)

    echo -e "  Remaining uncompressed: $REMAINING\n"

    if [ "$REMAINING" -eq 0 ]; then
        echo -e "${GREEN}All compressible chunks processed!${NC}\n"
        break
    fi

    sleep 2
done

# Vacuum to reclaim space
echo -e "${CYAN}Vacuuming database to reclaim space...${NC}"
psql -U postgres -d ankr_maritime -c "VACUUM FULL ANALYZE vessel_positions;" 2>&1 | tail -1

# Get final stats
SIZE_AFTER=$(psql -U postgres -d ankr_maritime -t -c "SELECT pg_size_pretty(pg_database_size('ankr_maritime'));" | xargs)
COMPRESSED=$(psql -U postgres -d ankr_maritime -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='vessel_positions' AND is_compressed=true;" | xargs)
UNCOMPRESSED=$(psql -U postgres -d ankr_maritime -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='vessel_positions' AND is_compressed=false;" | xargs)

echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}📊 RESULTS${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "Database size:"
echo -e "  Before: ${RED}$SIZE_BEFORE${NC}"
echo -e "  After:  ${GREEN}$SIZE_AFTER${NC}"
echo -e ""
echo -e "Chunks:"
echo -e "  Compressed:   ${GREEN}$COMPRESSED${NC}"
echo -e "  Uncompressed: ${YELLOW}$UNCOMPRESSED${NC}"
echo -e ""

# Restart maritime watcher
echo -e "${CYAN}Restarting maritime watcher...${NC}"
pm2 restart ankr-maritime-watcher >/dev/null 2>&1

echo -e "${GREEN}${BOLD}✓ Compression complete!${NC}\n"
