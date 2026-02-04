#!/bin/bash
set -e

# ANKR Database Schema Operations
# Usage: schema.sh <command> [table]

COMMAND="${1:-tables}"
TABLE="${2:-}"

# Default connection
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-ankr}"
PGPASSWORD="${PGPASSWORD:-indrA@0612}"
PGDATABASE="${PGDATABASE:-ankr_eon}"

export PGPASSWORD

case "$COMMAND" in
    tables)
        psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "
            SELECT table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;"
        ;;
    describe|desc)
        if [ -z "$TABLE" ]; then
            echo "Usage: schema.sh describe <table>" >&2
            exit 1
        fi
        psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = '$TABLE'
            ORDER BY ordinal_position;"
        ;;
    indexes)
        if [ -z "$TABLE" ]; then
            echo "Usage: schema.sh indexes <table>" >&2
            exit 1
        fi
        psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = '$TABLE';"
        ;;
    *)
        echo "Unknown command: $COMMAND" >&2
        echo "Available: tables, describe, indexes" >&2
        exit 1
        ;;
esac
