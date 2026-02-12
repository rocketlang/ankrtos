#!/bin/bash

# NCERT Solver Completion Notifier
# Monitors solver progress and notifies when 1,000 exercises are complete

TARGET=1000
CHECK_INTERVAL=30  # Check every 30 seconds
NOTIFICATION_FILE="/tmp/solver-complete-notification.txt"

echo "🔔 Starting solver completion monitor..."
echo "   Target: $TARGET exercises"
echo "   Checking every ${CHECK_INTERVAL}s"
echo ""

while true; do
    # Get current count from database
    COUNT=$(PGPASSWORD='indrA@0612' psql -U ankr -h localhost -d ankr_eon -t -c \
        "SELECT COUNT(*) FROM ankr_learning.exercise_solving_jobs WHERE status = 'completed';" 2>/dev/null | xargs)

    if [ -z "$COUNT" ]; then
        echo "[$(date '+%H:%M:%S')] ⚠️  Database query failed, retrying..."
        sleep $CHECK_INTERVAL
        continue
    fi

    REMAINING=$((TARGET - COUNT))
    PERCENTAGE=$(awk "BEGIN {printf \"%.1f\", ($COUNT/$TARGET)*100}")

    echo "[$(date '+%H:%M:%S')] Progress: $COUNT/$TARGET ($PERCENTAGE%) | Remaining: $REMAINING"

    # Check if complete
    if [ "$COUNT" -ge "$TARGET" ]; then
        echo ""
        echo "🎉 ========================================== 🎉"
        echo "   SOLVER COMPLETE!"
        echo "   ✅ All $TARGET exercises solved!"
        echo "   Time: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "🎉 ========================================== 🎉"
        echo ""

        # Write notification file
        cat > "$NOTIFICATION_FILE" << EOF
🎉 NCERT SOLVER COMPLETED! 🎉

Total Exercises: $COUNT
Completion Time: $(date '+%Y-%m-%d %H:%M:%S')
Session: session-1770723707211

All 1,000 NCERT exercises have been successfully solved!
EOF

        # Try to send desktop notification if available
        if command -v notify-send &> /dev/null; then
            notify-send "🎉 Solver Complete!" "All $TARGET NCERT exercises solved!"
        fi

        # Ring the terminal bell
        echo -e "\a"

        # Display completion message
        cat "$NOTIFICATION_FILE"

        echo ""
        echo "📝 Notification saved to: $NOTIFICATION_FILE"
        echo ""

        break
    fi

    sleep $CHECK_INTERVAL
done
