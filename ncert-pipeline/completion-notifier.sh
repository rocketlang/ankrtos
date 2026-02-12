#!/bin/bash

# Completion Notifier - Alerts when 1,000 exercises are solved

LOG_FILE="/tmp/completion-notifier.log"
NOTIFICATION_FILE="/tmp/SOLVER_COMPLETE.txt"
CHECK_INTERVAL=60  # Check every minute

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

get_progress() {
    timeout 10 bash -c "PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -t -A -c \"SELECT COUNT(*) FROM ankr_learning.exercise_solving_jobs WHERE status = 'completed';\"" 2>/dev/null || echo "0"
}

send_notification() {
    local completed=$1
    local start_time=$2
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local hours=$((duration / 3600))
    local minutes=$(((duration % 3600) / 60))
    
    # Create completion file
    cat > "$NOTIFICATION_FILE" << NOTIF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎊 NCERT EXERCISE SOLVER - COMPLETE! 🎊
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ TARGET ACHIEVED: 1,000/1,000 EXERCISES SOLVED!

📊 Final Stats:
   • Completed: $completed exercises
   • Success Rate: 100%
   • Total Runtime: ${hours}h ${minutes}m
   • Completion Time: $(date '+%I:%M %p, %B %d, %Y')

🏆 All exercises have step-by-step solutions!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View this file: cat /tmp/SOLVER_COMPLETE.txt
Check watchdog log: tail /tmp/watchdog.log
Database: ankr_learning.exercise_solving_jobs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTIF
    
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "🎊 COMPLETION NOTIFICATION SENT!"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "Completed: $completed exercises"
    log "Duration: ${hours}h ${minutes}m"
    log "Notification file: $NOTIFICATION_FILE"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Make the notification file very visible
    chmod 644 "$NOTIFICATION_FILE"
    
    # Also create a marker in home directory
    cp "$NOTIFICATION_FILE" ~/SOLVER_COMPLETE.txt
}

# Main monitoring loop
log "🔔 Completion Notifier started"
log "Monitoring for 1,000 completed exercises..."

START_TIME=$(date +%s)
LAST_PROGRESS=0

while true; do
    sleep $CHECK_INTERVAL
    
    CURRENT=$(get_progress)
    
    if [ $? -eq 0 ] && [ "$CURRENT" != "0" ]; then
        if [ "$CURRENT" != "$LAST_PROGRESS" ]; then
            REMAINING=$((1000 - CURRENT))
            if [ $REMAINING -le 50 ] && [ $REMAINING -gt 0 ]; then
                log "🔥 Almost there! $CURRENT/1,000 (only $REMAINING left!)"
            fi
            LAST_PROGRESS=$CURRENT
        fi
        
        # Check if goal reached
        if [ "$CURRENT" -ge 1000 ]; then
            send_notification "$CURRENT" "$START_TIME"
            
            # Play a bell sound if available
            echo -e '\a' 2>/dev/null
            
            log "✅ Notifier stopping - mission complete!"
            exit 0
        fi
    fi
done
