#!/bin/bash
set -e

# WowTruck Fleet Management
# Usage: fleet.sh <command> [options]

COMMAND="${1:-}"
shift || true

WT_URL="${WT_URL:-http://localhost:4000}"

case "$COMMAND" in
    list)
        STATUS=""
        while [ $# -gt 0 ]; do
            case "$1" in
                --status) STATUS="$2"; shift 2 ;;
                *) shift ;;
            esac
        done

        PARAMS=""
        if [ -n "$STATUS" ]; then
            PARAMS="?status=$STATUS"
        fi
        curl -s "$WT_URL/api/v1/vehicles$PARAMS" | jq .
        ;;

    get)
        VEHICLE_ID="${1:-}"
        if [ -z "$VEHICLE_ID" ]; then
            echo "Usage: fleet.sh get <vehicle-id>" >&2
            exit 1
        fi
        curl -s "$WT_URL/api/v1/vehicles/$VEHICLE_ID" | jq .
        ;;

    status)
        VEHICLE_ID="${1:-}"
        NEW_STATUS="${2:-}"
        if [ -z "$VEHICLE_ID" ] || [ -z "$NEW_STATUS" ]; then
            echo "Usage: fleet.sh status <vehicle-id> <new-status>" >&2
            exit 1
        fi
        curl -s -X PATCH "$WT_URL/api/v1/vehicles/$VEHICLE_ID" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"$NEW_STATUS\"}" | jq .
        ;;

    *)
        echo "Usage: fleet.sh <list|get|status> [options]" >&2
        exit 1
        ;;
esac
