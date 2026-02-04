#!/bin/bash
set -e

# EON Memory - Remember (Store)
# Usage: remember.sh "<content>" [--tags "tag1,tag2"] [--entity "EntityName"]

CONTENT="${1:-}"
shift || true

if [ -z "$CONTENT" ]; then
    echo "Usage: remember.sh \"<content>\" [--tags \"tag1,tag2\"] [--entity \"EntityName\"]" >&2
    exit 1
fi

# Parse options
TAGS=""
ENTITY=""
while [ $# -gt 0 ]; do
    case "$1" in
        --tags)
            TAGS="$2"
            shift 2
            ;;
        --entity)
            ENTITY="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# EON Memory endpoint
EON_URL="${EON_URL:-http://localhost:4005}"

# Build JSON payload
PAYLOAD=$(cat <<EOF
{
    "content": $(echo "$CONTENT" | jq -Rs .),
    "tags": $(echo "$TAGS" | jq -R 'split(",") | map(select(length > 0))'),
    "entity": $(echo "$ENTITY" | jq -Rs 'if . == "" then null else . end')
}
EOF
)

# Send to EON
curl -s -X POST "$EON_URL/api/v1/memories" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD"
