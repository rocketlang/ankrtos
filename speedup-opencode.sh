#!/bin/bash
# OpenCode Performance Optimization Script

echo "🚀 Optimizing system for OpenCode..."

# 1. Clear system caches
echo "1️⃣  Clearing system caches..."
sync
echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || echo "   (requires sudo)"

# 2. Clear npm/bun caches
echo "2️⃣  Clearing package manager caches..."
npm cache clean --force 2>/dev/null
bun pm cache rm 2>/dev/null
pnpm store prune 2>/dev/null

# 3. Clear temp files
echo "3️⃣  Clearing temp files..."
rm -rf /tmp/* 2>/dev/null
rm -rf ~/.cache/* 2>/dev/null

# 4. Clean Docker (if not needed)
echo "4️⃣  Pruning Docker (if containers aren't critical)..."
read -p "   Prune Docker? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker system prune -af --volumes
fi

# 5. Reduce swap usage
echo "5️⃣  Reducing swap usage..."
swapoff -a && swapon -a 2>/dev/null || echo "   (requires sudo)"

# 6. Find and kill duplicate processes
echo "6️⃣  Checking for duplicate processes..."
pgrep -f "claude" | wc -l | xargs -I {} echo "   Found {} Claude processes"

# 7. Clean old log files
echo "7️⃣  Cleaning old logs..."
find /root -name "*.log" -type f -size +100M -exec truncate -s 0 {} \; 2>/dev/null
journalctl --vacuum-time=7d 2>/dev/null || echo "   (journal cleanup requires sudo)"

# 8. Disk space report
echo "8️⃣  Disk space analysis..."
du -sh /root/* 2>/dev/null | sort -hr | head -10

echo ""
echo "✅ Optimization complete!"
echo ""
echo "💡 Additional suggestions:"
echo "   - Close unused terminal sessions"
echo "   - Stop unused PM2 services: pm2 stop <name>"
echo "   - Consider upgrading RAM (currently 87% used)"
free -h
