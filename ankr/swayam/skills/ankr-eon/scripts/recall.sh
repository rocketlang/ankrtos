#!/bin/bash
set -e

# EON Memory - Recall (Retrieve)
# Usage: recall.sh "<query>" [--limit 10] [--tags "tag1"]

QUERY="${1:-}"
shift || true

if [ -z "$QUERY" ]; then
    echo "Usage: recall.sh \"<query>\" [--limit 10] [--tags \"tag1\"]" >&2
    exit 1
fi

# Parse options
LIMIT=10
TAGS=""
while [ $# -gt 0 ]; do
    case "$1" in
        --limit)
            LIMIT="$2"
            shift 2
            ;;
        --tags)
            TAGS="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# EON Memory endpoint
EON_URL="${EON_URL:-http://localhost:4005}"

# Build query params
PARAMS="query=$(echo "$QUERY" | jq -sRr @uri)&limit=$LIMIT"
if [ -n "$TAGS" ]; then
    PARAMS="$PARAMS&tags=$TAGS"
fi

# Query EON
curl -s "$EON_URL/api/v1/memories/search?$PARAMS" | jq .
