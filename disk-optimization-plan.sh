#!/bin/bash
# Disk Optimization Script for vda and vdb
# Created: 2026-02-13
# Purpose: Free up space on both system disks

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          ANKR Disk Optimization - Safe Cleanup               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Function to show space before/after
show_space() {
    echo "Current Disk Usage:"
    df -h / /mnt/storage | grep -v "tmpfs"
    echo ""
}

echo "BEFORE Cleanup:"
show_space

FREED=0

# 1. Clean Journal Logs (keep 7 days)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Cleaning Journal Logs (keep 7 days)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BEFORE=$(journalctl --disk-usage | grep -oP '\d+\.\d+G' | head -1)
journalctl --vacuum-time=7d
AFTER=$(journalctl --disk-usage | grep -oP '\d+\.\d+G' | head -1)
echo "Journal logs: $BEFORE → $AFTER"
echo ""

# 2. Clean Old Logs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Cleaning Old Log Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
find /var/log -type f -name "*.gz" -mtime +30 -delete 2>/dev/null || true
find /var/log -type f -name "*.1" -mtime +30 -delete 2>/dev/null || true
find /var/log -type f -name "*.old" -delete 2>/dev/null || true
echo "✅ Old compressed logs removed"
echo ""

# 3. Clean PM2 Logs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Cleaning PM2 Logs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 flush 2>/dev/null || true
echo "✅ PM2 logs flushed"
echo ""

# 4. Clean APT Cache
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Cleaning APT Cache..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
apt-get clean 2>/dev/null || true
apt-get autoclean 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true
echo "✅ APT cache cleaned"
echo ""

# 5. Clean NPM Cache
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Cleaning NPM Cache..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SIZE_BEFORE=$(du -sh /root/.npm 2>/dev/null | awk '{print $1}')
rm -rf /root/.npm/_cacache 2>/dev/null || true
rm -rf /root/.npm/_logs 2>/dev/null || true
npm cache clean --force 2>/dev/null || true
SIZE_AFTER=$(du -sh /root/.npm 2>/dev/null | awk '{print $1}')
echo "NPM cache: $SIZE_BEFORE → $SIZE_AFTER"
echo ""

# 6. Clean Docker (unused images)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Cleaning Docker Unused Images..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker image prune -a -f 2>/dev/null || true
docker container prune -f 2>/dev/null || true
docker volume prune -f 2>/dev/null || true
echo "✅ Docker cleaned (kept running containers)"
echo ""

# 7. Clean Nx Cache
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  Cleaning Nx Build Cache..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
rm -rf /root/ankr-labs-nx/.nx/cache 2>/dev/null || true
rm -rf /root/ankr-labs-nx/node_modules/.cache 2>/dev/null || true
echo "✅ Nx cache cleared"
echo ""

# 8. Clean Temp Files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  Cleaning Temporary Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
find /tmp -type f -atime +7 -delete 2>/dev/null || true
find /var/tmp -type f -atime +7 -delete 2>/dev/null || true
echo "✅ Temp files cleaned"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "AFTER Cleanup:"
show_space

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Cleanup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 For more aggressive cleanup:"
echo "   • Review /mnt/storage/root-data (32 GB)"
echo "   • Review /mnt/storage/projects (27 GB)"
echo "   • Run: docker system prune -a --volumes (removes ALL unused)"
echo ""
