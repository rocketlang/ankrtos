#!/bin/bash
set -e

# ANKR Database Query (Read-only)
# Usage: query.sh "<sql>" [param1] [param2] ... [--format csv|json|table]

SQL="${1:-}"
shift || true

if [ -z "$SQL" ]; then
    echo "Usage: query.sh \"<sql>\" [params...] [--format csv|json|table]" >&2
    exit 1
fi

# Default connection
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-ankr}"
PGPASSWORD="${PGPASSWORD:-indrA@0612}"
PGDATABASE="${PGDATABASE:-ankr_eon}"

export PGPASSWORD

# Parse format option
FORMAT="table"
PARAMS=()
while [ $# -gt 0 ]; do
    case "$1" in
        --format)
            FORMAT="$2"
            shift 2
            ;;
        *)
            PARAMS+=("$1")
            shift
            ;;
    esac
done

# Build parameterized query
PARAM_ARGS=""
for i in "${!PARAMS[@]}"; do
    PARAM_ARGS="$PARAM_ARGS -v param$((i+1))='${PARAMS[$i]}'"
done

# Set output format
case "$FORMAT" in
    csv)
        OUTPUT_OPTS="--csv"
        ;;
    json)
        # Use JSON aggregation
        SQL="SELECT json_agg(row_to_json(t)) FROM ($SQL) t"
        OUTPUT_OPTS="-t"
        ;;
    table|*)
        OUTPUT_OPTS=""
        ;;
esac

# Execute query
eval psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
    $PARAM_ARGS $OUTPUT_OPTS -c "\"$SQL\""
