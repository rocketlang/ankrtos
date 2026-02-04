#!/bin/bash
set -e

# WowTruck Driver Management
# Usage: driver.sh <command> [options]

COMMAND="${1:-}"
shift || true

WT_URL="${WT_URL:-http://localhost:4000}"

case "$COMMAND" in
    list)
        AVAILABLE=""
        while [ $# -gt 0 ]; do
            case "$1" in
                --available) AVAILABLE="true"; shift ;;
                *) shift ;;
            esac
        done

        PARAMS=""
        if [ -n "$AVAILABLE" ]; then
            PARAMS="?status=available"
        fi
        curl -s "$WT_URL/api/v1/drivers$PARAMS" | jq .
        ;;

    assign)
        DRIVER_ID="${1:-}"
        TRIP_ID="${2:-}"
        if [ -z "$DRIVER_ID" ] || [ -z "$TRIP_ID" ]; then
            echo "Usage: driver.sh assign <driver-id> <trip-id>" >&2
            exit 1
        fi
        curl -s -X POST "$WT_URL/api/v1/drivers/$DRIVER_ID/assign" \
            -H "Content-Type: application/json" \
            -d "{\"tripId\":\"$TRIP_ID\"}" | jq .
        ;;

    location)
        DRIVER_ID="${1:-}"
        if [ -z "$DRIVER_ID" ]; then
            echo "Usage: driver.sh location <driver-id>" >&2
            exit 1
        fi
        curl -s "$WT_URL/api/v1/drivers/$DRIVER_ID/location" | jq .
        ;;

    *)
        echo "Usage: driver.sh <list|assign|location> [options]" >&2
        exit 1
        ;;
esac
