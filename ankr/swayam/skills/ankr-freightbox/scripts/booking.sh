#!/bin/bash
set -e

# FreightBox Booking Operations
# Usage: booking.sh <command> [options]

COMMAND="${1:-}"
shift || true

FB_URL="${FB_URL:-http://localhost:4003}"

case "$COMMAND" in
    create)
        # Parse options
        ORIGIN=""
        DESTINATION=""
        CARGO_TYPE="FCL"
        CONTAINERS=1
        while [ $# -gt 0 ]; do
            case "$1" in
                --origin) ORIGIN="$2"; shift 2 ;;
                --destination) DESTINATION="$2"; shift 2 ;;
                --cargo-type) CARGO_TYPE="$2"; shift 2 ;;
                --containers) CONTAINERS="$2"; shift 2 ;;
                *) shift ;;
            esac
        done

        if [ -z "$ORIGIN" ] || [ -z "$DESTINATION" ]; then
            echo "Usage: booking.sh create --origin <code> --destination <code> [--cargo-type FCL|LCL] [--containers N]" >&2
            exit 1
        fi

        curl -s -X POST "$FB_URL/api/v1/bookings" \
            -H "Content-Type: application/json" \
            -d "{\"origin\":\"$ORIGIN\",\"destination\":\"$DESTINATION\",\"cargoType\":\"$CARGO_TYPE\",\"containers\":$CONTAINERS}" | jq .
        ;;

    get)
        BOOKING_ID="${1:-}"
        if [ -z "$BOOKING_ID" ]; then
            echo "Usage: booking.sh get <booking-id>" >&2
            exit 1
        fi
        curl -s "$FB_URL/api/v1/bookings/$BOOKING_ID" | jq .
        ;;

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
        curl -s "$FB_URL/api/v1/bookings$PARAMS" | jq .
        ;;

    *)
        echo "Usage: booking.sh <create|get|list> [options]" >&2
        echo "" >&2
        echo "Commands:" >&2
        echo "  create --origin <code> --destination <code> [--cargo-type FCL|LCL] [--containers N]" >&2
        echo "  get <booking-id>" >&2
        echo "  list [--status <status>]" >&2
        exit 1
        ;;
esac
