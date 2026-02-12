#!/bin/bash
# Bun Services Monitor

echo "=== BUN SERVICES MONITOR ==="
echo "Generated: $(date)"
echo ""

# Count running Bun processes
BUN_COUNT=$(ps aux | grep '/root/.bun/bin/bun' | grep -v grep | wc -l)
echo "Total Bun Processes: $BUN_COUNT"
echo ""

# Memory usage by Bun services
echo "=== MEMORY USAGE (Top 10) ==="
ps aux | grep bun | grep -v grep | sort -k4 -rn | head -10 | awk '{printf "%-8s %6s %8.0fMB %s\n", $2, $4"%", $6/1024, $11}'
echo ""

# Total memory
TOTAL_MEM=$(ps aux | grep bun | grep -v grep | awk '{sum+=$6} END {print sum/1024}')
echo "Total Memory Used: ${TOTAL_MEM}MB"
echo ""

# CPU usage
echo "=== CPU USAGE (Top 5) ==="
ps aux | grep bun | grep -v grep | sort -k3 -rn | head -5 | awk '{printf "%-8s %5s%%  %s\n", $2, $3, $11}'
echo ""

# Port listeners
echo "=== PORTS LISTENING ==="
lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | grep bun | awk '{print $9, $1}' | sort -n | head -20

