#!/bin/bash

# ANKR System Health Check Script
# Quick diagnostic tool for system info and service health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Symbols
CHECK="✓"
CROSS="✗"
WARN="⚠"
INFO="ℹ"

print_header() {
    echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${CYAN}$1${NC}"
    echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}${CHECK}${NC} $1"
}

print_error() {
    echo -e "${RED}${CROSS}${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}${WARN}${NC} $1"
}

print_info() {
    echo -e "${BLUE}${INFO}${NC} $1"
}

# ============================================================================
# SYSTEM INFORMATION
# ============================================================================
print_header "SYSTEM INFORMATION"

# OS and Kernel
OS=$(lsb_release -d 2>/dev/null | cut -f2 || cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)
KERNEL=$(uname -r)
UPTIME=$(uptime -p)
HOSTNAME=$(hostname)

echo -e "${BOLD}Hostname:${NC} $HOSTNAME"
echo -e "${BOLD}OS:${NC} $OS"
echo -e "${BOLD}Kernel:${NC} $KERNEL"
echo -e "${BOLD}Uptime:${NC} $UPTIME"

# ============================================================================
# CPU INFORMATION
# ============================================================================
print_header "CPU INFORMATION"

CPU_MODEL=$(lscpu | grep "Model name" | cut -d':' -f2 | xargs)
CPU_CORES=$(nproc)
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | xargs)

echo -e "${BOLD}CPU:${NC} $CPU_MODEL"
echo -e "${BOLD}Cores:${NC} $CPU_CORES"
echo -e "${BOLD}Load Average:${NC} $CPU_LOAD"

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    print_warning "CPU usage is high: ${CPU_USAGE}%"
elif (( $(echo "$CPU_USAGE > 50" | bc -l) )); then
    print_info "CPU usage: ${CPU_USAGE}%"
else
    print_success "CPU usage: ${CPU_USAGE}%"
fi

# ============================================================================
# MEMORY INFORMATION
# ============================================================================
print_header "MEMORY INFORMATION"

TOTAL_MEM=$(free -h | awk '/^Mem:/ {print $2}')
USED_MEM=$(free -h | awk '/^Mem:/ {print $3}')
FREE_MEM=$(free -h | awk '/^Mem:/ {print $4}')
MEM_PERCENT=$(free | awk '/^Mem:/ {printf "%.1f", $3/$2 * 100}')

echo -e "${BOLD}Total:${NC} $TOTAL_MEM"
echo -e "${BOLD}Used:${NC} $USED_MEM"
echo -e "${BOLD}Free:${NC} $FREE_MEM"

if (( $(echo "$MEM_PERCENT > 90" | bc -l) )); then
    print_error "Memory usage: ${MEM_PERCENT}% (Critical!)"
elif (( $(echo "$MEM_PERCENT > 75" | bc -l) )); then
    print_warning "Memory usage: ${MEM_PERCENT}% (High)"
else
    print_success "Memory usage: ${MEM_PERCENT}%"
fi

# ============================================================================
# DISK USAGE
# ============================================================================
print_header "DISK USAGE"

# Show volumes needing attention first
echo -e "${BOLD}Volumes Needing Attention:${NC}"
NEEDS_ATTENTION=false
df -h | grep -E '/dev/vd[abc]2?\s' | while read line; do
    USAGE=$(echo $line | awk '{print $5}' | sed 's/%//')
    MOUNT=$(echo $line | awk '{print $6}')
    SIZE=$(echo $line | awk '{print $2}')
    USED=$(echo $line | awk '{print $3}')
    AVAIL=$(echo $line | awk '{print $4}')

    if [ "$USAGE" -gt 75 ]; then
        NEEDS_ATTENTION=true
        if [ "$USAGE" -gt 90 ]; then
            print_error "$(printf '%-10s %6s  Used: %6s  Free: %6s  [%3s%%]  %s' "$(basename $(echo $line | awk '{print $1}'))" "$SIZE" "$USED" "$AVAIL" "$USAGE" "$MOUNT")"
        else
            print_warning "$(printf '%-10s %6s  Used: %6s  Free: %6s  [%3s%%]  %s' "$(basename $(echo $line | awk '{print $1}'))" "$SIZE" "$USED" "$AVAIL" "$USAGE" "$MOUNT")"
        fi
    fi
done

# Show healthy volumes compactly
HEALTHY_COUNT=$(df -h | grep -E '/dev/vd[abc]2?\s' | awk '{if ($5+0 <= 75) count++} END {print count+0}')
if [ "$HEALTHY_COUNT" -gt 0 ]; then
    echo -e "\n${BOLD}Healthy Volumes:${NC} ${GREEN}$HEALTHY_COUNT volume(s) < 75% usage${NC}"
fi

echo ""
echo -e "${BOLD}Summary:${NC}"
echo -e "  Total Storage: ~553GB across 3 volumes"
echo -e "  Run ${CYAN}/root/disk-cleanup.sh${NC} to optimize storage"

# ============================================================================
# PM2 PROCESSES
# ============================================================================
print_header "PM2 PROCESSES"

if command -v pm2 &> /dev/null; then
    PM2_LIST=$(pm2 jlist 2>/dev/null)
    if [ "$PM2_LIST" != "[]" ]; then
        pm2 list
        echo ""

        # Check each process status
        echo "$PM2_LIST" | jq -r '.[] | "\(.name)|\(.pm2_env.status)|\(.monit.memory)|\(.monit.cpu)"' | while IFS='|' read name status memory cpu; do
            MEM_MB=$((memory / 1024 / 1024))
            if [ "$status" = "online" ]; then
                print_success "$name is running (CPU: ${cpu}%, Memory: ${MEM_MB}MB)"
            else
                print_error "$name is $status"
            fi
        done
    else
        print_warning "No PM2 processes running"
    fi
else
    print_warning "PM2 not installed"
fi

# ============================================================================
# PORT CHECKS
# ============================================================================
print_header "PORT CHECKS"

PORTS=(
    "4444:AI Proxy"
    "5432:PostgreSQL"
    "6379:Redis"
    "3000:Web Server"
    "8080:API Server"
)

for port_info in "${PORTS[@]}"; do
    PORT=$(echo $port_info | cut -d':' -f1)
    SERVICE=$(echo $port_info | cut -d':' -f2)

    if lsof -i :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        PID=$(lsof -i :$PORT -sTCP:LISTEN -t | head -1)
        PROCESS=$(ps -p $PID -o comm= 2>/dev/null || echo "unknown")
        print_success "Port $PORT ($SERVICE) - Active [$PROCESS PID:$PID]"
    else
        print_warning "Port $PORT ($SERVICE) - Not listening"
    fi
done

# ============================================================================
# DATABASE CONNECTIVITY
# ============================================================================
print_header "DATABASE CONNECTIVITY"

# PostgreSQL
if command -v psql &> /dev/null; then
    if pg_isready -q 2>/dev/null; then
        print_success "PostgreSQL is ready"

        # Get database size
        DB_SIZE=$(psql -U postgres -t -c "SELECT pg_size_pretty(pg_database_size('postgres'));" 2>/dev/null | xargs || echo "N/A")
        echo -e "  ${BOLD}Database size:${NC} $DB_SIZE"

        # Get connection count
        CONNECTIONS=$(psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs || echo "N/A")
        echo -e "  ${BOLD}Active connections:${NC} $CONNECTIONS"
    else
        print_error "PostgreSQL is not responding"
    fi
else
    print_info "PostgreSQL client not installed"
fi

# Redis
if command -v redis-cli &> /dev/null; then
    if redis-cli ping 2>/dev/null | grep -q PONG; then
        print_success "Redis is responding"

        # Get Redis info
        REDIS_MEM=$(redis-cli info memory 2>/dev/null | grep used_memory_human | cut -d':' -f2 | tr -d '\r')
        echo -e "  ${BOLD}Memory usage:${NC} $REDIS_MEM"
    else
        print_warning "Redis is not responding"
    fi
else
    print_info "Redis not installed"
fi

# ============================================================================
# DOCKER CONTAINERS
# ============================================================================
print_header "DOCKER CONTAINERS"

if command -v docker &> /dev/null; then
    if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | tail -n +2 | grep -q .; then
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        print_info "No running Docker containers"
    fi
else
    print_info "Docker not installed"
fi

# ============================================================================
# NETWORK STATUS
# ============================================================================
print_header "NETWORK STATUS"

# Check internet connectivity
if ping -c 1 8.8.8.8 &> /dev/null; then
    print_success "Internet connectivity OK"
else
    print_error "No internet connectivity"
fi

# Active connections
ACTIVE_CONNECTIONS=$(netstat -an 2>/dev/null | grep ESTABLISHED | wc -l || ss -tan | grep ESTAB | wc -l)
echo -e "${BOLD}Active connections:${NC} $ACTIVE_CONNECTIONS"

# ============================================================================
# RECENT LOG ERRORS (Last 100 lines)
# ============================================================================
print_header "RECENT LOG ERRORS"

# Check PM2 logs for errors
if command -v pm2 &> /dev/null; then
    ERROR_COUNT=$(pm2 logs --nostream --lines 100 2>/dev/null | grep -i "error" | wc -l)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        print_warning "Found $ERROR_COUNT errors in PM2 logs (last 100 lines)"
        echo -e "  Run: ${CYAN}pm2 logs --lines 50${NC} to view"
    else
        print_success "No errors in recent PM2 logs"
    fi
fi

# System logs
if command -v journalctl &> /dev/null; then
    SYSTEM_ERRORS=$(journalctl -p err -n 100 --no-pager 2>/dev/null | wc -l)
    if [ "$SYSTEM_ERRORS" -gt 0 ]; then
        print_warning "Found $SYSTEM_ERRORS system errors in journal"
        echo -e "  Run: ${CYAN}journalctl -p err -n 50${NC} to view"
    else
        print_success "No recent system errors"
    fi
fi

# ============================================================================
# ENVIRONMENT CHECKS
# ============================================================================
print_header "ENVIRONMENT CHECKS"

# Check for .env files
if [ -f ".env" ]; then
    print_success ".env file exists"
    # Count non-empty, non-comment lines
    ENV_VARS=$(grep -v '^#' .env | grep -v '^$' | wc -l)
    echo -e "  ${BOLD}Variables:${NC} $ENV_VARS"
else
    print_warning ".env file not found"
fi

# Check critical environment variables
CRITICAL_VARS=("JINA_API_KEY" "NOMIC_API_KEY" "DATABASE_URL")
for var in "${CRITICAL_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        print_success "$var is set"
    else
        print_warning "$var is not set"
    fi
done

# ============================================================================
# SUMMARY
# ============================================================================
print_header "HEALTH SUMMARY"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo -e "${BOLD}Report generated:${NC} $TIMESTAMP"

# Calculate overall health score
HEALTH_SCORE=100

# Deduct points for issues
[ $(echo "$CPU_USAGE > 80" | bc -l) ] && HEALTH_SCORE=$((HEALTH_SCORE - 20))
[ $(echo "$MEM_PERCENT > 90" | bc -l) ] && HEALTH_SCORE=$((HEALTH_SCORE - 30))
[ "$ERROR_COUNT" -gt 10 ] && HEALTH_SCORE=$((HEALTH_SCORE - 15))

if [ "$HEALTH_SCORE" -ge 90 ]; then
    echo -e "\n${GREEN}${BOLD}Overall System Health: EXCELLENT ($HEALTH_SCORE/100)${NC}"
elif [ "$HEALTH_SCORE" -ge 70 ]; then
    echo -e "\n${YELLOW}${BOLD}Overall System Health: GOOD ($HEALTH_SCORE/100)${NC}"
elif [ "$HEALTH_SCORE" -ge 50 ]; then
    echo -e "\n${YELLOW}${BOLD}Overall System Health: FAIR ($HEALTH_SCORE/100)${NC}"
else
    echo -e "\n${RED}${BOLD}Overall System Health: POOR ($HEALTH_SCORE/100)${NC}"
fi

echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
