#!/bin/bash

# Solver Watchdog - Auto-restart and monitoring
# Keeps the solver running 24/7 with auto-recovery

LOG_FILE="/tmp/watchdog.log"
SOLVER_DIR="/root/ncert-pipeline"
SOLVER_SCRIPT="exercise-solver-v2.js"
SESSION_ID="session-1770723707211"
SOLVER_LOG="/tmp/solver-active.log"
CHECK_INTERVAL=60  # Check every 60 seconds
STALL_THRESHOLD=300  # 5 minutes without progress = stall

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

get_solver_pid() {
    pgrep -f "node.*${SOLVER_SCRIPT}" | head -1
}

get_progress() {
    timeout 5 bash -c "PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -t -A -c \"SELECT COUNT(*) FROM ankr_learning.exercise_solving_jobs WHERE status = 'completed';\"" 2>/dev/null || echo "0"
}

start_solver() {
    log "🚀 Starting solver..."
    cd "$SOLVER_DIR"
    nohup node "$SOLVER_SCRIPT" resume "$SESSION_ID" > "$SOLVER_LOG" 2>&1 &
    sleep 5
    
    if [ ! -z "$(get_solver_pid)" ]; then
        log "✅ Solver started successfully (PID: $(get_solver_pid))"
        return 0
    else
        log "❌ Failed to start solver"
        return 1
    fi
}

stop_solver() {
    local pid=$(get_solver_pid)
    if [ ! -z "$pid" ]; then
        log "🛑 Stopping solver (PID: $pid)..."
        kill -15 "$pid" 2>/dev/null
        sleep 3
        kill -9 "$pid" 2>/dev/null
    fi
}

check_solver_health() {
    local pid=$(get_solver_pid)
    
    # Check 1: Process running?
    if [ -z "$pid" ]; then
        log "⚠️  Solver process not found!"
        return 1
    fi
    
    # Check 2: Process responsive (CPU > 0 or recent activity)?
    local cpu=$(ps -p "$pid" -o %cpu= 2>/dev/null | xargs)
    if [ -z "$cpu" ]; then
        log "⚠️  Cannot read process stats"
        return 1
    fi
    
    # Check 3: Log file being updated?
    if [ -f "$SOLVER_LOG" ]; then
        local log_age=$(stat -c %Y "$SOLVER_LOG" 2>/dev/null)
        local now=$(date +%s)
        local age=$((now - log_age))
        
        if [ $age -gt $STALL_THRESHOLD ]; then
            log "⚠️  Solver log not updated for ${age}s (stalled)"
            return 1
        fi
    fi
    
    return 0
}

# Main watchdog loop
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🐕 Watchdog started - Monitoring NCERT solver"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Initial state
LAST_PROGRESS=$(get_progress)
RESTART_COUNT=0
CONSECUTIVE_FAILURES=0

while true; do
    sleep $CHECK_INTERVAL
    
    # Check solver health
    if ! check_solver_health; then
        log "❌ Health check failed"
        CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
        
        if [ $CONSECUTIVE_FAILURES -ge 2 ]; then
            log "🔄 Attempting restart (consecutive failures: $CONSECUTIVE_FAILURES)"
            
            # Stop old process
            stop_solver
            sleep 2
            
            # Start new process
            if start_solver; then
                RESTART_COUNT=$((RESTART_COUNT + 1))
                CONSECUTIVE_FAILURES=0
                log "✅ Restart #$RESTART_COUNT successful"
            else
                log "❌ Restart failed - will retry in $CHECK_INTERVAL seconds"
            fi
        fi
    else
        # Health check passed
        CONSECUTIVE_FAILURES=0
        
        # Check progress
        CURRENT_PROGRESS=$(get_progress)
        if [ "$CURRENT_PROGRESS" != "$LAST_PROGRESS" ]; then
            log "📊 Progress: $CURRENT_PROGRESS completed (+$((CURRENT_PROGRESS - LAST_PROGRESS)))"
            LAST_PROGRESS=$CURRENT_PROGRESS
            
            # Check milestones
            if [ $CURRENT_PROGRESS -ge 1000 ]; then
                log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                log "🎊 TARGET REACHED! 1,000 exercises completed!"
                log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                log "📈 Total restarts: $RESTART_COUNT"
                log "✅ Stopping watchdog - mission accomplished!"
                break
            fi
        fi
    fi
done

log "🐕 Watchdog stopped"
