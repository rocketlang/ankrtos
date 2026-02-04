#!/bin/bash
set -e

# EON Memory - Relate (Link Entities)
# Usage: relate.sh "<entity1>" "<relationship>" "<entity2>"

ENTITY1="${1:-}"
RELATIONSHIP="${2:-}"
ENTITY2="${3:-}"

if [ -z "$ENTITY1" ] || [ -z "$RELATIONSHIP" ] || [ -z "$ENTITY2" ]; then
    echo "Usage: relate.sh \"<entity1>\" \"<relationship>\" \"<entity2>\"" >&2
    echo "Example: relate.sh \"User\" \"PREFERS\" \"DarkMode\"" >&2
    exit 1
fi

# EON Memory endpoint
EON_URL="${EON_URL:-http://localhost:4005}"

# Build JSON payload
PAYLOAD=$(cat <<EOF
{
    "from": "$ENTITY1",
    "relationship": "$RELATIONSHIP",
    "to": "$ENTITY2"
}
EOF
)

# Send to EON
curl -s -X POST "$EON_URL/api/v1/relationships" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD"
