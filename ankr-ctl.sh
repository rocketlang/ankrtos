#!/bin/bash
#===============================================================================
# ANKR-CTL v2.0 - Universal Service Orchestrator
#===============================================================================
# Replaces PM2 with native process management
# Uses central config from /root/ankr-services.config.js
# Features: port locking, health checks, rate-limited restarts, logging
#
# Usage: ./ankr-ctl.sh <command> [service-name]
#
# Commands:
#   start [service]    - Start all or specific service
#   stop [service]     - Stop all or specific service
#   restart [service]  - Restart all or specific service
#   status [service]   - Show status of all or specific service
#   logs <service>     - Tail logs for a service
#   health             - Health check all services
#   ports              - Show port allocations
#   conflicts          - Check for port conflicts
#   migrate            - Migrate from PM2 to ankr-ctl
#
# Author: ANKR Labs | 🙏 Jai Guru Ji
# Version: 2.0.0 | Jan 2026
#===============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Paths
ANKR_HOME="/root"
CONFIG_FILE="$ANKR_HOME/ankr-services.config.js"
PID_DIR="$ANKR_HOME/.ankr/pids"
LOG_DIR="$ANKR_HOME/.ankr/logs"
LOCK_DIR="$ANKR_HOME/.ankr/locks"
RESTART_DIR="$ANKR_HOME/.ankr/restarts"

# Create directories
mkdir -p "$PID_DIR" "$LOG_DIR" "$LOCK_DIR" "$RESTART_DIR"

#===============================================================================
# HELPER FUNCTIONS
#===============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get service config using Node.js
get_service_config() {
    local service=$1
    node -e "
        const config = require('$CONFIG_FILE');
        const svc = config.SERVICES['$service'];
        if (svc) {
            console.log(JSON.stringify(svc));
        } else {
            process.exit(1);
        }
    " 2>/dev/null
}

# Get all enabled services
get_enabled_services() {
    node -e "
        const config = require('$CONFIG_FILE');
        const services = Object.entries(config.SERVICES)
            .filter(([_, c]) => !c.disabled)
            .map(([name]) => name);
        console.log(services.join(' '));
    " 2>/dev/null
}

# Get all services
get_all_services() {
    node -e "
        const config = require('$CONFIG_FILE');
        console.log(Object.keys(config.SERVICES).join(' '));
    " 2>/dev/null
}

# Check if port is in use
is_port_in_use() {
    local port=$1
    fuser "$port/tcp" >/dev/null 2>&1
    return $?
}

# Get PID using port
get_pid_by_port() {
    local port=$1
    fuser "$port/tcp" 2>/dev/null | awk '{print $1}' | head -1
}

# Check if service is running
is_service_running() {
    local service=$1
    local pid_file="$PID_DIR/${service}.pid"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Get service PID
get_service_pid() {
    local service=$1
    local pid_file="$PID_DIR/${service}.pid"

    if [ -f "$pid_file" ]; then
        cat "$pid_file"
    fi
}

# Check restart rate limit (max 5 restarts in 5 minutes)
check_restart_limit() {
    local service=$1
    local restart_file="$RESTART_DIR/${service}.restarts"
    local now=$(date +%s)
    local window=300  # 5 minutes
    local max_restarts=5

    # Create file if not exists
    touch "$restart_file"

    # Remove old entries (older than window)
    local cutoff=$((now - window))
    awk -v cutoff="$cutoff" '$1 > cutoff' "$restart_file" > "$restart_file.tmp"
    mv "$restart_file.tmp" "$restart_file"

    # Count restarts in window
    local count=$(wc -l < "$restart_file")

    if [ "$count" -ge "$max_restarts" ]; then
        log_error "$service has restarted $count times in last 5 minutes. Cooling down..."
        return 1
    fi

    # Record this restart
    echo "$now" >> "$restart_file"
    return 0
}

# Acquire port lock
acquire_port_lock() {
    local port=$1
    local service=$2
    local lock_file="$LOCK_DIR/port_${port}.lock"

    # Check if port is already locked by another service
    if [ -f "$lock_file" ]; then
        local locked_by=$(cat "$lock_file")
        if [ "$locked_by" != "$service" ]; then
            log_error "Port $port is locked by $locked_by"
            return 1
        fi
    fi

    # Create lock
    echo "$service" > "$lock_file"
    return 0
}

# Release port lock
release_port_lock() {
    local port=$1
    local lock_file="$LOCK_DIR/port_${port}.lock"
    rm -f "$lock_file"
}

#===============================================================================
# SERVICE MANAGEMENT
#===============================================================================

start_service() {
    local service=$1
    local config=$(get_service_config "$service")

    if [ -z "$config" ]; then
        log_error "Service '$service' not found in config"
        return 1
    fi

    # Parse config
    local port=$(echo "$config" | jq -r '.port')
    local path=$(echo "$config" | jq -r '.path')
    local command=$(echo "$config" | jq -r '.command')
    local disabled=$(echo "$config" | jq -r '.disabled // false')
    local description=$(echo "$config" | jq -r '.description // ""')

    # Check if disabled
    if [ "$disabled" = "true" ]; then
        log_warning "$service is disabled in config"
        return 0
    fi

    # Check if already running
    if is_service_running "$service"; then
        log_warning "$service is already running (PID: $(get_service_pid "$service"))"
        return 0
    fi

    # Check restart rate limit
    if ! check_restart_limit "$service"; then
        return 1
    fi

    # Acquire port lock
    if ! acquire_port_lock "$port" "$service"; then
        return 1
    fi

    # Kill any process on the port
    if is_port_in_use "$port"; then
        log_warning "Port $port in use, killing existing process..."
        fuser -k "$port/tcp" 2>/dev/null || true
        sleep 2
    fi

    # Verify path exists
    if [ ! -d "$path" ]; then
        log_error "Path '$path' does not exist for $service"
        release_port_lock "$port"
        return 1
    fi

    # Prepare environment
    local env_vars=""
    local env_json=$(echo "$config" | jq -r '.env // {}')
    if [ "$env_json" != "{}" ] && [ "$env_json" != "null" ]; then
        while IFS="=" read -r key value; do
            env_vars="$env_vars export $key='$value';"
        done < <(echo "$env_json" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"')
    fi

    # Set PORT env var
    env_vars="$env_vars export PORT=$port;"

    # Start service
    log_info "Starting $service on port $port..."
    log_info "  Path: $path"
    log_info "  Command: $command"

    local log_file="$LOG_DIR/${service}.log"
    local err_file="$LOG_DIR/${service}.err"
    local pid_file="$PID_DIR/${service}.pid"

    # Start with nohup
    cd "$path"
    nohup bash -c "$env_vars cd $path && $command" >> "$log_file" 2>> "$err_file" &
    local pid=$!
    echo "$pid" > "$pid_file"

    # Wait and verify
    sleep 3

    if ps -p "$pid" > /dev/null 2>&1; then
        log_success "$service started (PID: $pid, Port: $port)"
        return 0
    else
        log_error "$service failed to start. Check logs: $err_file"
        release_port_lock "$port"
        rm -f "$pid_file"
        return 1
    fi
}

stop_service() {
    local service=$1
    local config=$(get_service_config "$service")

    if [ -z "$config" ]; then
        log_error "Service '$service' not found in config"
        return 1
    fi

    local port=$(echo "$config" | jq -r '.port')
    local pid_file="$PID_DIR/${service}.pid"

    if [ ! -f "$pid_file" ]; then
        # Try to find by port
        local pid=$(get_pid_by_port "$port")
        if [ -n "$pid" ]; then
            log_info "Found process on port $port (PID: $pid), killing..."
            kill -TERM "$pid" 2>/dev/null || true
            sleep 2
            kill -9 "$pid" 2>/dev/null || true
        else
            log_warning "$service is not running"
        fi
        release_port_lock "$port"
        return 0
    fi

    local pid=$(cat "$pid_file")
    log_info "Stopping $service (PID: $pid)..."

    # Graceful shutdown
    kill -TERM "$pid" 2>/dev/null || true

    # Wait up to 10 seconds
    local count=0
    while [ $count -lt 10 ] && ps -p "$pid" > /dev/null 2>&1; do
        sleep 1
        count=$((count + 1))
    done

    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        log_warning "Force killing $service..."
        kill -9 "$pid" 2>/dev/null || true
    fi

    # Also kill any process on the port
    fuser -k "$port/tcp" 2>/dev/null || true

    rm -f "$pid_file"
    release_port_lock "$port"

    log_success "$service stopped"
    return 0
}

restart_service() {
    local service=$1
    stop_service "$service"
    sleep 2
    start_service "$service"
}

#===============================================================================
# STATUS & MONITORING
#===============================================================================

show_status() {
    local filter=$1

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                        ANKR SERVICES STATUS                                  ║"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    printf "║ %-25s │ %-6s │ %-8s │ %-8s │ %-15s ║\n" "SERVICE" "PORT" "STATUS" "PID" "MEMORY"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"

    for service in $(get_all_services); do
        if [ -n "$filter" ] && [ "$filter" != "$service" ]; then
            continue
        fi

        local config=$(get_service_config "$service")
        local port=$(echo "$config" | jq -r '.port')
        local disabled=$(echo "$config" | jq -r '.disabled // false')

        local status="STOPPED"
        local status_color="$RED"
        local pid="-"
        local memory="-"

        if [ "$disabled" = "true" ]; then
            status="DISABLED"
            status_color="$YELLOW"
        elif is_service_running "$service"; then
            pid=$(get_service_pid "$service")
            status="RUNNING"
            status_color="$GREEN"
            # Get memory usage
            memory=$(ps -o rss= -p "$pid" 2>/dev/null | awk '{printf "%.1f MB", $1/1024}' || echo "-")
        fi

        printf "║ %-25s │ %-6s │ ${status_color}%-8s${NC} │ %-8s │ %-15s ║\n" "$service" "$port" "$status" "$pid" "$memory"
    done

    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""

    # Summary
    local running=$(for s in $(get_enabled_services); do is_service_running "$s" && echo 1; done | wc -l)
    local total=$(get_enabled_services | wc -w)
    echo -e "  ${GREEN}Running:${NC} $running/$total services"
    echo ""
}

show_ports() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                           PORT ALLOCATIONS                                   ║"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    printf "║ %-6s │ %-25s │ %-40s ║\n" "PORT" "SERVICE" "DOMAINS"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"

    node -e "
        const config = require('$CONFIG_FILE');
        const sorted = Object.entries(config.SERVICES)
            .sort((a, b) => a[1].port - b[1].port);

        sorted.forEach(([name, cfg]) => {
            const domains = (cfg.domains || []).slice(0, 2).join(', ') || '-';
            const truncDomains = domains.length > 40 ? domains.slice(0, 37) + '...' : domains;
            console.log(\`║ \${String(cfg.port).padEnd(6)} │ \${name.padEnd(25)} │ \${truncDomains.padEnd(40)} ║\`);
        });
    "

    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
}

check_conflicts() {
    echo ""
    log_info "Checking for port conflicts..."

    local conflicts=0
    local seen_ports=""

    for service in $(get_all_services); do
        local config=$(get_service_config "$service")
        local port=$(echo "$config" | jq -r '.port')

        # Check for duplicate in config
        if echo "$seen_ports" | grep -q " $port "; then
            log_error "CONFLICT: Port $port is assigned to multiple services!"
            conflicts=$((conflicts + 1))
        fi
        seen_ports="$seen_ports $port "

        # Check for external process on port
        if is_port_in_use "$port"; then
            if ! is_service_running "$service"; then
                local pid=$(get_pid_by_port "$port")
                local proc_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
                log_warning "Port $port ($service) is used by external process: $proc_name (PID: $pid)"
            fi
        fi
    done

    if [ $conflicts -eq 0 ]; then
        log_success "No port conflicts detected in configuration"
    else
        log_error "Found $conflicts port conflicts!"
    fi
    echo ""
}

health_check() {
    echo ""
    log_info "Running health checks..."
    echo ""

    for service in $(get_enabled_services); do
        local config=$(get_service_config "$service")
        local port=$(echo "$config" | jq -r '.port')
        local health_endpoint=$(echo "$config" | jq -r '.healthEndpoint // "/health"')
        local url="http://localhost:$port$health_endpoint"

        if ! is_service_running "$service"; then
            printf "  %-25s : ${RED}DOWN${NC} (not running)\n" "$service"
            continue
        fi

        local response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$url" 2>/dev/null || echo "000")

        if [ "$response" = "200" ]; then
            printf "  %-25s : ${GREEN}HEALTHY${NC} ($url)\n" "$service"
        elif [ "$response" = "000" ]; then
            printf "  %-25s : ${YELLOW}UNREACHABLE${NC} (timeout)\n" "$service"
        else
            printf "  %-25s : ${RED}UNHEALTHY${NC} (HTTP $response)\n" "$service"
        fi
    done
    echo ""
}

show_logs() {
    local service=$1

    if [ -z "$service" ]; then
        log_error "Usage: $0 logs <service-name>"
        return 1
    fi

    local log_file="$LOG_DIR/${service}.log"
    local err_file="$LOG_DIR/${service}.err"

    echo ""
    log_info "=== Logs for $service ==="

    if [ -f "$log_file" ]; then
        echo -e "${CYAN}--- stdout ---${NC}"
        tail -50 "$log_file"
    fi

    if [ -f "$err_file" ]; then
        echo -e "${RED}--- stderr ---${NC}"
        tail -50 "$err_file"
    fi
    echo ""
}

#===============================================================================
# PM2 MIGRATION
#===============================================================================

migrate_from_pm2() {
    log_info "Migrating from PM2 to ankr-ctl..."
    echo ""

    # Stop all PM2 processes
    log_info "Stopping PM2 processes..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true

    # Disable PM2 startup
    pm2 unstartup 2>/dev/null || true

    # Kill any leftover processes on known ports
    log_info "Cleaning up ports..."
    for service in $(get_all_services); do
        local config=$(get_service_config "$service")
        local port=$(echo "$config" | jq -r '.port')
        fuser -k "$port/tcp" 2>/dev/null || true
    done

    sleep 3

    # Start all enabled services
    log_info "Starting services with ankr-ctl..."
    for service in $(get_enabled_services); do
        start_service "$service"
        sleep 1
    done

    echo ""
    log_success "Migration complete!"
    show_status
}

#===============================================================================
# MAIN
#===============================================================================

case "$1" in
    start)
        if [ -n "$2" ]; then
            start_service "$2"
        else
            log_info "Starting all enabled services..."
            for service in $(get_enabled_services); do
                start_service "$service"
                sleep 1
            done
        fi
        ;;
    stop)
        if [ -n "$2" ]; then
            stop_service "$2"
        else
            log_info "Stopping all services..."
            for service in $(get_all_services); do
                stop_service "$service"
            done
        fi
        ;;
    restart)
        if [ -n "$2" ]; then
            restart_service "$2"
        else
            log_info "Restarting all enabled services..."
            for service in $(get_enabled_services); do
                restart_service "$service"
                sleep 1
            done
        fi
        ;;
    status)
        show_status "$2"
        ;;
    ports)
        show_ports
        ;;
    conflicts)
        check_conflicts
        ;;
    health)
        health_check
        ;;
    logs)
        show_logs "$2"
        ;;
    migrate)
        migrate_from_pm2
        ;;
    *)
        echo ""
        echo "╔══════════════════════════════════════════════════════════════════════════════╗"
        echo "║                    ANKR-CTL v2.0 - Service Orchestrator                      ║"
        echo "╚══════════════════════════════════════════════════════════════════════════════╝"
        echo ""
        echo "Usage: $0 <command> [service-name]"
        echo ""
        echo "Commands:"
        echo "  start [service]    - Start all or specific service"
        echo "  stop [service]     - Stop all or specific service"
        echo "  restart [service]  - Restart all or specific service"
        echo "  status [service]   - Show status of all or specific service"
        echo "  logs <service>     - Tail logs for a service"
        echo "  health             - Health check all services"
        echo "  ports              - Show port allocations"
        echo "  conflicts          - Check for port conflicts"
        echo "  migrate            - Migrate from PM2 to ankr-ctl"
        echo ""
        echo "Services are defined in: $CONFIG_FILE"
        echo "Logs directory: $LOG_DIR"
        echo "PID files: $PID_DIR"
        echo ""
        echo "Examples:"
        echo "  $0 start swayam-bani     # Start specific service"
        echo "  $0 stop all              # Stop all services"
        echo "  $0 status                # Show all services status"
        echo "  $0 health                # Check health of all services"
        echo ""
        ;;
esac
