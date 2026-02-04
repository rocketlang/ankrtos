#!/bin/bash
set -e

# WowTruck Trip Management
# Usage: trip.sh <command> [options]

COMMAND="${1:-}"
shift || true

WT_URL="${WT_URL:-http://localhost:4000}"

case "$COMMAND" in
    create)
        ORIGIN=""
        DESTINATION=""
        VEHICLE=""
        DRIVER=""
        while [ $# -gt 0 ]; do
            case "$1" in
                --origin) ORIGIN="$2"; shift 2 ;;
                --destination) DESTINATION="$2"; shift 2 ;;
                --vehicle) VEHICLE="$2"; shift 2 ;;
                --driver) DRIVER="$2"; shift 2 ;;
                *) shift ;;
            esac
        done

        if [ -z "$ORIGIN" ] || [ -z "$DESTINATION" ]; then
            echo "Usage: trip.sh create --origin <location> --destination <location> [--vehicle <id>] [--driver <id>]" >&2
            exit 1
        fi

        curl -s -X POST "$WT_URL/api/v1/trips" \
            -H "Content-Type: application/json" \
            -d "{\"origin\":\"$ORIGIN\",\"destination\":\"$DESTINATION\",\"vehicleId\":\"$VEHICLE\",\"driverId\":\"$DRIVER\"}" | jq .
        ;;

    status)
        TRIP_ID="${1:-}"
        if [ -z "$TRIP_ID" ]; then
            echo "Usage: trip.sh status <trip-id>" >&2
            exit 1
        fi
        curl -s "$WT_URL/api/v1/trips/$TRIP_ID" | jq .
        ;;

    update)
        TRIP_ID="${1:-}"
        shift || true
        NEW_STATUS=""
        while [ $# -gt 0 ]; do
            case "$1" in
                --status) NEW_STATUS="$2"; shift 2 ;;
                *) shift ;;
            esac
        done

        if [ -z "$TRIP_ID" ] || [ -z "$NEW_STATUS" ]; then
            echo "Usage: trip.sh update <trip-id> --status <new-status>" >&2
            exit 1
        fi

        curl -s -X PATCH "$WT_URL/api/v1/trips/$TRIP_ID" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"$NEW_STATUS\"}" | jq .
        ;;

    *)
        echo "Usage: trip.sh <create|status|update> [options]" >&2
        exit 1
        ;;
esac
