#!/bin/bash
set -e

# ANKR Database Execute (Write operations)
# Usage: execute.sh "<sql>" [param1] [param2] ...

SQL="${1:-}"
shift || true

if [ -z "$SQL" ]; then
    echo "Usage: execute.sh \"<sql>\" [params...]" >&2
    exit 1
fi

# Default connection
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-ankr}"
PGPASSWORD="${PGPASSWORD:-indrA@0612}"
PGDATABASE="${PGDATABASE:-ankr_eon}"

export PGPASSWORD

# Build parameterized query
PARAMS=("$@")
for i in "${!PARAMS[@]}"; do
    # Replace $N with actual value (simple substitution)
    SQL="${SQL//\$$((i+1))/'${PARAMS[$i]}'}"
done

# Execute
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "$SQL"
