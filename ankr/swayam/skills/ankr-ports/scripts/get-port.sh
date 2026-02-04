#!/bin/bash
set -e

# ANKR Port Discovery
# Usage: get-port.sh <service-name>

SERVICE="${1:-}"

if [ -z "$SERVICE" ]; then
    echo "Usage: get-port.sh <service-name>" >&2
    echo "Available services: freightbox, wowtruck, eon, ai-proxy" >&2
    exit 1
fi

# Normalize service name
SERVICE=$(echo "$SERVICE" | tr '[:upper:]' '[:lower:]' | tr '_' '-')

# Port mapping
case "$SERVICE" in
    freightbox|freight|fb)
        PORT=4003
        ;;
    wowtruck|wow|truck|tms)
        PORT=4000
        ;;
    eon|eon-memory|memory)
        PORT=4005
        ;;
    ai-proxy|aiproxy|proxy|llm)
        PORT=4444
        ;;
    postgres|postgresql|db|database)
        PORT=5432
        ;;
    *)
        # Try ankr5 CLI if available
        if command -v ankr5 &> /dev/null; then
            PORT=$(ankr5 ports get "$SERVICE" 2>/dev/null)
            if [ -z "$PORT" ]; then
                echo "Unknown service: $SERVICE" >&2
                exit 1
            fi
        else
            echo "Unknown service: $SERVICE" >&2
            echo "Available: freightbox, wowtruck, eon, ai-proxy, database" >&2
            exit 1
        fi
        ;;
esac

echo "$PORT"
