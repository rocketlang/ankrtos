#!/bin/bash
set -e

# ANKR URL Discovery
# Usage: get-url.sh <service-name>

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE="${1:-}"

if [ -z "$SERVICE" ]; then
    echo "Usage: get-url.sh <service-name>" >&2
    exit 1
fi

PORT=$("$SCRIPT_DIR/get-port.sh" "$SERVICE")

if [ -z "$PORT" ]; then
    exit 1
fi

echo "http://localhost:$PORT"
