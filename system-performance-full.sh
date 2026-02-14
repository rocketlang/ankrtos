#!/bin/bash
# Comprehensive System Performance Report
# Created: 2026-02-13

clear
cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════════╗
║                    ANKR SYSTEM PERFORMANCE DASHBOARD                         ║
║                         Server: e2e-102-29                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo "📅 Report Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

# System Info
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖥️  SYSTEM INFORMATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Hostname:        $(hostname)"
echo "OS:              $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "Kernel:          $(uname -r)"
echo "Architecture:    $(uname -m)"
echo "Uptime:          $(uptime -p | sed 's/up //')"
echo ""

# CPU Information
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  CPU INFORMATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Model:           $(lscpu | grep 'Model name' | cut -d':' -f2 | xargs)"
echo "Cores:           $(nproc) vCPUs"
echo "Threads/Core:    $(lscpu | grep 'Thread(s)' | awk '{print $4}')"
echo "Sockets:         $(lscpu | grep 'Socket(s)' | awk '{print $2}')"
echo "CPU MHz:         $(lscpu | grep 'CPU MHz' | awk '{print $3}')"
echo ""
echo "Load Average:"
echo "  1 min:         $(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | xargs)"
echo "  5 min:         $(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $2}' | xargs)"
echo "  15 min:        $(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $3}' | xargs)"
echo ""
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print "  User:          " $2 "\n  System:        " $4 "\n  Nice:          " $6 "\n  Idle:          " $8 "\n  I/O Wait:      " $10 "\n  Hardware IRQ:  " $12 "\n  Software IRQ:  " $14}'
echo ""

# Memory Information
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 MEMORY INFORMATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
free -h | awk '
/^Mem:/ {
    printf "Physical RAM:\n"
    printf "  Total:         %s\n", $2
    printf "  Used:          %s (%.1f%%)\n", $3, ($3/$2)*100
    printf "  Free:          %s\n", $4
    printf "  Shared:        %s\n", $5
    printf "  Buffers/Cache: %s\n", $6
    printf "  Available:     %s (%.1f%%)\n\n", $7, ($7/$2)*100
}
/^Swap:/ {
    if ($2 != "0B" && $2 != "0") {
        printf "Swap Space:\n"
        printf "  Total:         %s\n", $2
        printf "  Used:          %s", $3
        if ($2 != "0B" && $2 != "0") printf " (%.1f%%)", ($3/$2)*100
        printf "\n"
        printf "  Free:          %s\n", $4
    }
}'
echo ""

# Process Memory Top 10
echo "Top 10 Memory-Consuming Processes:"
ps aux --sort=-%mem | head -11 | tail -10 | awk '{printf "  %-20s %6s  %s\n", substr($11,1,20), $4"%", $11}'
echo ""

# Disk Information
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💿 DISK INFORMATION (3 Disks)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 DISK 1: /dev/vda (Main System Disk)"
echo "────────────────────────────────────────────────────────────────"
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE /dev/vda | grep -E "NAME|vda"
echo ""
df -h /dev/vda2 | tail -1 | awk '{printf "  Mounted:       %s\n  Total:         %s\n  Used:          %s (%s)\n  Available:     %s\n  Filesystem:    %s\n", $6, $2, $3, $5, $4, $1}'
echo ""

echo "📦 DISK 2: /dev/vdb (Storage - Mounted)"
echo "────────────────────────────────────────────────────────────────"
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE /dev/vdb | grep -E "NAME|vdb"
echo ""
df -h /dev/vdb | tail -1 | awk '{printf "  Mounted:       %s\n  Total:         %s\n  Used:          %s (%s)\n  Available:     %s\n  Filesystem:    %s\n", $6, $2, $3, $5, $4, $1}'
echo ""

echo "📦 DISK 3: /dev/vdc (AIS Storage - Mounted)"
echo "────────────────────────────────────────────────────────────────"
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE /dev/vdc | grep -E "NAME|vdc"
echo ""
df -h /dev/vdc | tail -1 | awk '{printf "  Mounted:       %s\n  Total:         %s\n  Used:          %s (%s) ⬅️ OPTIMIZED!\n  Available:     %s\n  Filesystem:    %s\n", $6, $2, $3, $5, $4, $1}'
echo ""

# I/O Statistics
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 DISK I/O STATISTICS (Real-time)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
iostat -x 1 1 | grep -A 4 "Device" | grep -E "vda|vdb|vdc" | awk '{
    device=$1
    r_s=$4
    w_s=$5
    rkB_s=$6
    wkB_s=$7
    util=$NF

    printf "%-8s  Reads: %6.0f ops/s  Writes: %6.0f ops/s  Read: %7.1f KB/s  Write: %7.1f KB/s  Util: %5.1f%%\n",
           device, r_s, w_s, rkB_s, wkB_s, util
}'
echo ""

# Network
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 NETWORK INFORMATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ip addr show | grep -E "^[0-9]|inet " | awk '/^[0-9]/{iface=$2} /inet /{print "  " iface " " $2}' | grep -v "127.0.0.1"
echo ""

# Database Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  DATABASE STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u postgres psql -t <<'EOSQL'
SELECT
    '  Database' || REPEAT(' ', 20 - LENGTH(datname)) || datname ||
    '    Size: ' || pg_size_pretty(pg_database_size(datname))
FROM pg_database
WHERE datname NOT IN ('template0', 'template1', 'postgres')
ORDER BY pg_database_size(datname) DESC
LIMIT 10;
EOSQL
echo ""

# Services Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 ANKR SERVICES STATUS (via ankr-ctl)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ankr-ctl status | tail -n +4 | head -15
echo ""
echo "  ... (33 total services - run 'ankr-ctl status' for full list)"
echo ""

# Maritime Specific
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚢 MARITIME SYSTEM STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u postgres psql -d ankr_maritime -t <<'EOSQL'
SELECT
    '  Database Size:     ' || pg_size_pretty(pg_database_size('ankr_maritime')) || ' (was 177 GB - 98% reduction!)' ||
    E'\n  Latest AIS Data:   ' || MAX(timestamp)::text ||
    E'\n  Active Vessels:    ' || COUNT(DISTINCT "vesselId")::text || ' (last 24 hours)' ||
    E'\n  Position Records:  ' || COUNT(*)::text || ' raw positions'
FROM vessel_positions
WHERE timestamp > NOW() - INTERVAL '24 hours';

SELECT
    E'\n  Total Vessels:     ' || COUNT(*)::text || ' in master database' ||
    E'\n  Hourly Data:       ' || (SELECT COUNT(DISTINCT "vesselId") FROM vessel_positions_hourly)::text || ' vessels' ||
    E'\n  Daily Data:        ' || (SELECT COUNT(DISTINCT "vesselId") FROM vessel_positions_daily)::text || ' vessels'
FROM vessels;
EOSQL
echo ""

# Footer
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📌 QUICK COMMANDS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  System:       htop, iostat -x 5, free -h"
echo "  Services:     ankr-ctl status, pm2 list"
echo "  Vessels:      /root/check-active-vessels.sh 30"
echo "  Databases:    sudo -u postgres psql -l"
echo "  This Report:  /root/system-performance-full.sh"
echo ""
