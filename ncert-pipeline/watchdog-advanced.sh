#!/bin/bash

# Advanced Watchdog - Handles crashes, hangs, and server issues
# Auto-restart with hang detection

LOG_FILE="/tmp/watchdog.log"
SOLVER_DIR="/root/ncert-pipeline"
SOLVER_SCRIPT="exercise-solver-v2.js"
SESSION_ID="session-1770723707211"
SOLVER_LOG="/tmp/solver-active.log"
CHECK_INTERVAL=60  # Check every 60 seconds
PROGRESS_TIMEOUT=600  # 10 minutes without progress = hang
DB_TIMEOUT=10  # Database query timeout

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

get_solver_pid() {
    pgrep -f "node.*${SOLVER_SCRIPT}" | head -1
}

get_progress() {
    # Try to get progress with timeout - if DB hangs, this will timeout
    local result=$(timeout $DB_TIMEOUT bash -c "PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -t -A -c \"SELECT COUNT(*) FROM ankr_learning.exercise_solving_jobs WHERE status = 'completed';\"" 2>/dev/null)
    
    if [ $? -eq 124 ]; then
        # Timeout = database might be hung
        log "⚠️  Database query timeout - possible DB hang"
        return 1
    fi
    
    echo "$result"
    return 0
}

check_system_health() {
    # Check 1: Can we query the database?
    if ! get_progress > /dev/null; then
        log "❌ Database not responding - system may be hung"
        return 1
    fi
    
    # Check 2: Is PostgreSQL running?
    if ! pgrep -x postgres > /dev/null; then
        log "❌ PostgreSQL not running!"
        return 1
    fi
    
    # Check 3: Disk space
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log "⚠️  Disk usage critical: ${disk_usage}%"
    fi
    
    # Check 4: Memory
    local mem_free=$(free | awk 'NR==2 {print $7}')
    if [ "$mem_free" -lt 1000000 ]; then  # Less than ~1GB free
        log "⚠️  Low memory: $(($mem_free/1024))MB free"
    fi
    
    return 0
}

start_solver() {
    log "🚀 Starting solver..."
    cd "$SOLVER_DIR"
    nohup node "$SOLVER_SCRIPT" resume "$SESSION_ID" > "$SOLVER_LOG" 2>&1 &
    sleep 5
    
    if [ ! -z "$(get_solver_pid)" ]; then
        log "✅ Solver started (PID: $(get_solver_pid))"
        return 0
    else
        log "❌ Failed to start solver"
        return 1
    fi
}

force_restart_solver() {
    local pid=$(get_solver_pid)
    
    log "🔨 Force restarting solver..."
    
    # Kill with extreme prejudice
    if [ ! -z "$pid" ]; then
        kill -9 "$pid" 2>/dev/null
        pkill -9 -f "$SOLVER_SCRIPT" 2>/dev/null
    fi
    
    sleep 3
    
    # Start fresh
    start_solver
}

check_solver_hung() {
    local pid=$(get_solver_pid)
    
    if [ -z "$pid" ]; then
        return 1  # Not hung, just not running
    fi
    
    # Check if process is in uninterruptible sleep (D state) or zombie
    local state=$(ps -p "$pid" -o stat= 2>/dev/null | cut -c1)
    if [ "$state" = "D" ] || [ "$state" = "Z" ]; then
        log "⚠️  Solver process in bad state: $state (likely hung)"
        return 0  # Is hung
    fi
    
    # Check CPU - if 0% for too long, might be hung
    local cpu=$(ps -p "$pid" -o %cpu= 2>/dev/null | awk '{print int($1)}')
    if [ "$cpu" -eq 0 ]; then
        # Check if log file is being updated
        if [ -f "$SOLVER_LOG" ]; then
            local log_age=$(( $(date +%s) - $(stat -c %Y "$SOLVER_LOG" 2>/dev/null || echo 0) ))
            if [ $log_age -gt $PROGRESS_TIMEOUT ]; then
                log "⚠️  Solver hung - no activity for ${log_age}s"
                return 0  # Is hung
            fi
        fi
    fi
    
    return 1  # Not hung
}

# Main loop
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🐕 Advanced Watchdog started"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "📋 Monitoring: Process health, hangs, DB, system resources"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LAST_PROGRESS=$(get_progress)
LAST_PROGRESS_TIME=$(date +%s)
RESTART_COUNT=0
HANG_COUNT=0

while true; do
    sleep $CHECK_INTERVAL
    
    # System health check
    if ! check_system_health; then
        log "⚠️  System health issues detected"
        # Continue monitoring but log the issue
    fi
    
    # Check if solver is running
    if [ -z "$(get_solver_pid)" ]; then
        log "❌ Solver not running - restarting..."
        start_solver
        RESTART_COUNT=$((RESTART_COUNT + 1))
        continue
    fi
    
    # Check if solver is hung
    if check_solver_hung; then
        log "🔨 Solver hung - force restarting..."
        force_restart_solver
        HANG_COUNT=$((HANG_COUNT + 1))
        RESTART_COUNT=$((RESTART_COUNT + 1))
        sleep 5
        continue
    fi
    
    # Check progress
    CURRENT_PROGRESS=$(get_progress)
    if [ $? -eq 0 ]; then
        if [ "$CURRENT_PROGRESS" != "$LAST_PROGRESS" ]; then
            GAIN=$((CURRENT_PROGRESS - LAST_PROGRESS))
            log "📊 Progress: $CURRENT_PROGRESS (+$GAIN) | Restarts: $RESTART_COUNT | Hangs detected: $HANG_COUNT"
            LAST_PROGRESS=$CURRENT_PROGRESS
            LAST_PROGRESS_TIME=$(date +%s)
            
            # Check if goal reached
            if [ $CURRENT_PROGRESS -ge 1000 ]; then
                log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                log "🎊 COMPLETE! 1,000/1,000 exercises solved!"
                log "📈 Stats: $RESTART_COUNT restarts, $HANG_COUNT hangs recovered"
                log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                break
            fi
        else
            # No progress - check if too long
            local stall_time=$(( $(date +%s) - LAST_PROGRESS_TIME ))
            if [ $stall_time -gt $PROGRESS_TIMEOUT ]; then
                log "⚠️  No progress for ${stall_time}s - forcing restart"
                force_restart_solver
                RESTART_COUNT=$((RESTART_COUNT + 1))
                LAST_PROGRESS_TIME=$(date +%s)
            fi
        fi
    fi
done

log "🐕 Watchdog stopped - mission complete"
