#!/bin/bash
# All Services Health Check

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           ALL SERVICES HEALTH CHECK                            ║"
echo "║           $(date '+%Y-%m-%d %H:%M:%S')                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 1. ankr-ctl managed services
echo "1. ANKR-CTL SERVICES:"
RUNNING=$(ankr-ctl status 2>/dev/null | grep -c RUNNING)
STOPPED=$(ankr-ctl status 2>/dev/null | grep -c STOPPED)
echo "   Running: $RUNNING | Stopped: $STOPPED"

# 2. nginx mapped services
echo ""
echo "2. NGINX MAPPED SERVICES:"
for port in 3001 3006 3008 3060 4000 4003 4007 4050 4051 4060 7070 7777; do
    if lsof -i :$port > /dev/null 2>&1; then
        SERVICE=$(lsof -i :$port 2>/dev/null | grep LISTEN | awk '{print $1}' | uniq | head -1)
        echo "   ✅ Port $port - $SERVICE"
    else
        echo "   ❌ Port $port - DOWN"
    fi
done

# 3. Database health
echo ""
echo "3. DATABASES:"
if psql -U ankr -d wowtruck -c "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL:5432 (wowtruck)"
else
    echo "   ❌ PostgreSQL:5432"
fi

if psql -U ankr -h localhost -p 5434 -d compliance -c "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ TimescaleDB:5434 (compliance)"
else
    echo "   ❌ TimescaleDB:5434"
fi

if redis-cli ping > /dev/null 2>&1; then
    echo "   ✅ Redis:6379"
else
    echo "   ❌ Redis:6379"
fi

# 4. AI Services
echo ""
echo "4. AI SERVICES:"
if curl -s http://localhost:4444/health > /dev/null 2>&1; then
    echo "   ✅ AI Proxy (4444)"
else
    echo "   ❌ AI Proxy (4444)"
fi

if curl -s http://localhost:4005/health > /dev/null 2>&1; then
    echo "   ✅ EON Memory (4005)"
else
    echo "   ❌ EON Memory (4005)"
fi

if curl -s http://localhost:11434/ > /dev/null 2>&1; then
    echo "   ✅ Ollama (11434)"
else
    echo "   ❌ Ollama (11434)"
fi

# 5. System resources
echo ""
echo "5. SYSTEM RESOURCES:"
MEM_USAGE=$(free -h | grep Mem | awk '{print $3 "/" $2}')
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
DISK_USAGE=$(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')
echo "   Memory: $MEM_USAGE"
echo "   CPU: ${CPU_USAGE}% used"
echo "   Disk: $DISK_USAGE"

# 6. Bun runtime stats
echo ""
echo "6. BUN RUNTIME:"
BUN_PROCS=$(ps aux | grep '/root/.bun/bin/bun' | grep -v grep | wc -l)
BUN_MEM=$(ps aux | grep bun | grep -v grep | awk '{sum+=$6} END {printf "%.0f", sum/1024}')
echo "   Processes: $BUN_PROCS"
echo "   Total Memory: ${BUN_MEM}MB"

