#!/bin/bash
set -e

# FreightBox Container Operations
# Usage: container.sh <command> <container-number>

COMMAND="${1:-}"
CONTAINER="${2:-}"

FB_URL="${FB_URL:-http://localhost:4003}"

if [ -z "$COMMAND" ] || [ -z "$CONTAINER" ]; then
    echo "Usage: container.sh <track|history> <container-number>" >&2
    exit 1
fi

case "$COMMAND" in
    track)
        curl -s "$FB_URL/api/v1/containers/$CONTAINER/track" | jq .
        ;;

    history)
        curl -s "$FB_URL/api/v1/containers/$CONTAINER/history" | jq .
        ;;

    *)
        echo "Unknown command: $COMMAND" >&2
        echo "Available: track, history" >&2
        exit 1
        ;;
esac
